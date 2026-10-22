
/// <reference types="@cloudflare/workers-types" />

import { verifySession } from '../../../_auth'

interface Env {
  DB: D1Database
  SESSION_SECRET: string
}

interface GrupEntrada {
  name: string
  words: string[]
  difficulty: number
  explanation?: string
}

interface PuzzleEntrada {
  groups: GrupEntrada[]
}

function resposta(missatge: string, status: number): Response {
  return Response.json(
    { ok: status >= 200 && status < 300, missatge },
    { status },
  )
}

async function autoritzat(
  request: Request,
  secret: string,
): Promise<boolean> {
  const cookies = request.headers.get('Cookie') ?? ''
  const cookie = cookies
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('admin_session='))

  if (!cookie) return false

  try {
    const token = decodeURIComponent(
      cookie.slice('admin_session='.length),
    )
    return Boolean(await verifySession(token, secret))
  } catch {
    return false
  }
}

function validarGrups(
  entrada: PuzzleEntrada,
): string | null {
  if (!Array.isArray(entrada.groups) || entrada.groups.length !== 4) {
    return 'El puzle ha de tenir exactament quatre grups.'
  }

  const noms = new Set<string>()

  for (const grup of entrada.groups) {
    if (
      typeof grup.name !== 'string' ||
      !Array.isArray(grup.words) ||
      grup.words.length !== 4 ||
      !Number.isInteger(grup.difficulty) ||
      grup.difficulty < 1 ||
      grup.difficulty > 4
    ) {
      return 'Cada grup ha de tenir un nom, quatre paraules i dificultat de l’1 al 4.'
    }

    const nom = grup.name.trim()

    if (!nom || nom.length > 100) {
      return 'El nom de cada grup ha de tenir entre 1 i 100 caràcters.'
    }

    const clau = nom.toLocaleLowerCase('ca')

    if (noms.has(clau)) {
      return 'Els noms dels quatre grups han de ser diferents.'
    }

    noms.add(clau)

    const paraules = grup.words.map((paraula) =>
      typeof paraula === 'string'
        ? paraula.trim().toLocaleUpperCase('ca')
        : '',
    )

    if (paraules.some((paraula) => !paraula || paraula.length > 100)) {
      return 'Totes les paraules han de tenir entre 1 i 100 caràcters.'
    }

    if (new Set(paraules).size !== 4) {
      return 'Les paraules de cada grup han de ser diferents.'
    }

    if (
      grup.explanation !== undefined &&
      typeof grup.explanation !== 'string'
    ) {
      return 'El format de les explicacions no és vàlid.'
    }
  }

  return null
}

export const onRequestGet: PagesFunction<Env> = async ({
  request,
  env,
  params,
}) => {
  if (!(await autoritzat(request, env.SESSION_SECRET))) {
    return resposta('Cal iniciar sessió.', 401)
  }

  const date = String(params.date)

  try {
    const puzzle = await env.DB.prepare(
      `SELECT date, status FROM puzzles WHERE date = ?`,
    ).bind(date).first<{ date: string; status: string }>()

    if (!puzzle) return resposta('No s’ha trobat el puzle.', 404)

    const grups = await env.DB.prepare(
      `SELECT id, position, name, difficulty, explanation
       FROM puzzle_groups
       WHERE puzzle_date = ?
       ORDER BY position`,
    ).bind(date).all<{
      id: number
      position: number
      name: string
      difficulty: number
      explanation: string | null
    }>()

    const paraules = await env.DB.prepare(
      `SELECT w.group_id, w.position, w.word
       FROM puzzle_words w
       JOIN puzzle_groups g ON g.id = w.group_id
       WHERE g.puzzle_date = ?
       ORDER BY g.position, w.position`,
    ).bind(date).all<{
      group_id: number
      position: number
      word: string
    }>()

    return Response.json({
      ok: true,
      puzzle: {
        date: puzzle.date,
        status: puzzle.status,
        groups: grups.results.map((grup) => ({
          name: grup.name,
          difficulty: grup.difficulty,
          explanation: grup.explanation ?? '',
          words: paraules.results
            .filter((paraula) => paraula.group_id === grup.id)
            .map((paraula) => paraula.word),
        })),
      },
    })
  } catch (error) {
    console.error('Error consultant el puzle:', error)
    return resposta('No s’ha pogut consultar el puzle.', 500)
  }
}

export const onRequestPut: PagesFunction<Env> = async ({
  request,
  env,
  params,
}) => {
  if (!(await autoritzat(request, env.SESSION_SECRET))) {
    return resposta('Cal iniciar sessió.', 401)
  }

  const date = String(params.date)
  let entrada: PuzzleEntrada

  try {
    entrada = await request.json() as PuzzleEntrada
  } catch {
    return resposta('Les dades rebudes no són vàlides.', 400)
  }

  const errorValidacio = validarGrups(entrada)
  if (errorValidacio) return resposta(errorValidacio, 400)

  try {
    const existent = await env.DB.prepare(
      'SELECT date FROM puzzles WHERE date = ?',
    ).bind(date).first()

    if (!existent) return resposta('No s’ha trobat el puzle.', 404)

    const operacions = [
      env.DB.prepare(
        `DELETE FROM puzzle_groups WHERE puzzle_date = ?`,
      ).bind(date),
    ]

    for (let i = 0; i < entrada.groups.length; i++) {
      const grup = entrada.groups[i]

      operacions.push(
        env.DB.prepare(
          `INSERT INTO puzzle_groups
            (puzzle_date, position, name, difficulty, explanation)
           VALUES (?, ?, ?, ?, ?)`,
        ).bind(
          date,
          i + 1,
          grup.name.trim(),
          grup.difficulty,
          grup.explanation?.trim() || null,
        ),
      )

      for (let j = 0; j < grup.words.length; j++) {
        operacions.push(
          env.DB.prepare(
            `INSERT INTO puzzle_words (group_id, position, word)
             SELECT id, ?, ?
             FROM puzzle_groups
             WHERE puzzle_date = ? AND position = ?`,
          ).bind(
            j + 1,
            grup.words[j].trim().toLocaleUpperCase('ca'),
            date,
            i + 1,
          ),
        )
      }
    }

    operacions.push(
      env.DB.prepare(
        `UPDATE puzzles SET updated_at = CURRENT_TIMESTAMP WHERE date = ?`,
      ).bind(date),
    )

    await env.DB.batch(operacions)

    return Response.json({
      ok: true,
      missatge: 'Puzle actualitzat correctament.',
    })
  } catch (error) {
    console.error('Error actualitzant el puzle:', error)
    return resposta('No s’ha pogut actualitzar el puzle.', 500)
  }
}

export const onRequestPatch: PagesFunction<Env> = async ({
  request,
  env,
  params,
}) => {
  if (!(await autoritzat(request, env.SESSION_SECRET))) {
    return resposta('Cal iniciar sessió.', 401)
  }

  let entrada: { status?: string }

  try {
    entrada = await request.json() as { status?: string }
  } catch {
    return resposta('Les dades rebudes no són vàlides.', 400)
  }

  const nouEstat = entrada.status

  if (nouEstat !== 'draft' && nouEstat !== 'published') {
    return resposta('Només es permet canviar entre esborrany i publicat.', 400)
  }

  const date = String(params.date)

  try {
    const puzzle = await env.DB.prepare(
      'SELECT date, status FROM puzzles WHERE date = ?',
    ).bind(date).first<{ date: string; status: string }>()

    if (!puzzle) return resposta('No s’ha trobat el puzle.', 404)

    if (puzzle.status === 'retired' || puzzle.status === 'scheduled') {
      return resposta('Aquest estat no es pot canviar amb aquesta acció.', 409)
    }

    if (puzzle.status === nouEstat) {
      return resposta('El puzle ja té aquest estat.', 409)
    }

    if (nouEstat === 'published') {
      const validacio = await env.DB.prepare(
        `SELECT
          COUNT(DISTINCT g.id) AS grups,
          COUNT(w.id) AS paraules,
          COUNT(DISTINCT g.name) AS noms
         FROM puzzle_groups g
         LEFT JOIN puzzle_words w ON w.group_id = g.id
         WHERE g.puzzle_date = ?`,
      ).bind(date).first<{
        grups: number
        paraules: number
        noms: number
      }>()

      if (
        !validacio ||
        validacio.grups !== 4 ||
        validacio.paraules !== 16 ||
        validacio.noms !== 4
      ) {
        return resposta(
          'Per publicar, el puzle ha de tenir quatre grups amb quatre paraules cadascun.',
          400,
        )
      }

      await env.DB.batch([
        env.DB.prepare(
          `UPDATE puzzles
           SET status = 'published', updated_at = CURRENT_TIMESTAMP
           WHERE date = ?`,
        ).bind(date),
        env.DB.prepare(
          `INSERT INTO puzzle_publications (puzzle_date, published_at)
           VALUES (?, CURRENT_TIMESTAMP)
           ON CONFLICT(puzzle_date)
           DO UPDATE SET published_at = CURRENT_TIMESTAMP`,
        ).bind(date),
      ])
    } else {
      await env.DB.batch([
        env.DB.prepare(
          `UPDATE puzzles
           SET status = 'draft', updated_at = CURRENT_TIMESTAMP
           WHERE date = ?`,
        ).bind(date),
        env.DB.prepare(
          `DELETE FROM puzzle_publications WHERE puzzle_date = ?`,
        ).bind(date),
      ])
    }

    return Response.json({
      ok: true,
      missatge: nouEstat === 'published'
        ? 'Puzle publicat a la base de dades.'
        : 'Puzle retornat a esborrany.',
      status: nouEstat,
    })
  } catch (error) {
    console.error('Error canviant l’estat del puzle:', error)
    return resposta('No s’ha pogut canviar l’estat del puzle.', 500)
  }
}
