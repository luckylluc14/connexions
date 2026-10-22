/// <reference types="@cloudflare/workers-types" />

import { verifySession } from '../../_auth'

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
  date: string
  groups: GrupEntrada[]
}

function resposta(
  missatge: string,
  status: number
): Response {
  return Response.json(
    { ok: status >= 200 && status < 300, missatge },
    { status }
  )
}

function obtenirSessio(request: Request): string | null {
  const cookies = request.headers.get('Cookie') ?? ''
  const cookie = cookies
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('admin_session='))

  if (!cookie) return null

  try {
    return decodeURIComponent(
      cookie.slice('admin_session='.length)
    )
  } catch {
    return null
  }
}

function validarData(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false

  const data = new Date(`${date}T00:00:00.000Z`)
  return !Number.isNaN(data.getTime()) &&
    data.toISOString().slice(0, 10) === date
}

export const onRequestPost: PagesFunction<Env> = async ({
  request,
  env,
}) => {
  // 1. Comprovar la sessió d'administrador
  const token = obtenirSessio(request)

  if (!token) {
    return resposta('Cal iniciar sessió.', 401)
  }

  const username = await verifySession(
    token,
    env.SESSION_SECRET
  )

  if (!username) {
    return resposta('La sessió no és vàlida.', 401)
  }

  // 2. Llegir les dades rebudes
  let entrada: PuzzleEntrada

  try {
    entrada = await request.json() as PuzzleEntrada
  } catch {
    return resposta('Les dades rebudes no són vàlides.', 400)
  }

  // 3. Validar la data
  if (
    typeof entrada.date !== 'string' ||
    !validarData(entrada.date)
  ) {
    return resposta('La data no és vàlida.', 400)
  }

  // 4. Comprovar que hi hagi exactament quatre grups
  if (
    !Array.isArray(entrada.groups) ||
    entrada.groups.length !== 4
  ) {
    return resposta(
      'El puzle ha de contenir exactament quatre grups.',
      400
    )
  }

  const nomsGrups = new Set<string>()
  const grupsNormalitzats: GrupEntrada[] = []

  for (const grup of entrada.groups) {
    if (
      typeof grup.name !== 'string' ||
      !Array.isArray(grup.words) ||
      grup.words.length !== 4 ||
      !Number.isInteger(grup.difficulty) ||
      grup.difficulty < 1 ||
      grup.difficulty > 4
    ) {
      return resposta(
        'Cada grup ha de tenir un nom, quatre paraules i una dificultat de l’1 al 4.',
        400
      )
    }

    const nom = grup.name.trim()
    const nomClau = nom.toLocaleLowerCase('ca')

    if (!nom || nom.length > 100) {
      return resposta(
        'El nom de cada grup ha de tenir entre 1 i 100 caràcters.',
        400
      )
    }

    if (nomsGrups.has(nomClau)) {
      return resposta(
        'No hi pot haver dos grups amb el mateix nom.',
        400
      )
    }

    nomsGrups.add(nomClau)

    const paraules = grup.words.map((paraula) =>
      typeof paraula === 'string'
        ? paraula.trim().toLocaleUpperCase('ca')
        : ''
    )

    if (paraules.some((paraula) =>
      !paraula || paraula.length > 100
    )) {
      return resposta(
        'Totes les paraules han de tenir entre 1 i 100 caràcters.',
        400
      )
    }

    if (new Set(paraules).size !== 4) {
      return resposta(
        'Les quatre paraules de cada grup han de ser diferents.',
        400
      )
    }

    const explicacio =
      typeof grup.explanation === 'string'
        ? grup.explanation.trim()
        : ''

    grupsNormalitzats.push({
      name: nom,
      words: paraules,
      difficulty: grup.difficulty,
      explanation: explicacio,
    })
  }

  // 5. Evitar crear una data que ja existeix
  const existent = await env.DB.prepare(
    'SELECT date FROM puzzles WHERE date = ?'
  )
    .bind(entrada.date)
    .first()

  if (existent) {
    return resposta(
      'Ja existeix un puzle per a aquesta data.',
      409
    )
  }

  // 6. Crear el puzle, els grups i les paraules
  // La batch executa les operacions com una transacció.
  const operacions = [
    env.DB.prepare(
      `INSERT INTO puzzles (date, status)
       VALUES (?, 'draft')`
    ).bind(entrada.date),
  ]

  for (let i = 0; i < grupsNormalitzats.length; i++) {
    const grup = grupsNormalitzats[i]

    operacions.push(
      env.DB.prepare(
        `INSERT INTO puzzle_groups
          (puzzle_date, position, name, difficulty, explanation)
         VALUES (?, ?, ?, ?, ?)`
      ).bind(
        entrada.date,
        i + 1,
        grup.name,
        grup.difficulty,
        grup.explanation || null
      )
    )

    for (let j = 0; j < grup.words.length; j++) {
      operacions.push(
        env.DB.prepare(
          `INSERT INTO puzzle_words (group_id, position, word)
           SELECT id, ?, ?
           FROM puzzle_groups
           WHERE puzzle_date = ? AND position = ?`
        ).bind(
          j + 1,
          grup.words[j],
          entrada.date,
          i + 1
        )
      )
    }
  }

  try {
    await env.DB.batch(operacions)

    return Response.json(
      {
        ok: true,
        missatge: 'Puzle desat correctament com a esborrany.',
        date: entrada.date,
        status: 'draft',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creant el puzle:', error)

    // També cobreix el cas en què dues peticions
    // intentin crear simultàniament la mateixa data.
    const errorText = String(error)

    if (errorText.includes('puzzles.date')) {
      return resposta(
        'Ja existeix un puzle per a aquesta data.',
        409
      )
    }

    return resposta(
      'No s’ha pogut desar el puzle a la base de dades.',
      500
    )
  }
}
