
import { verifySession } from '../_auth'

interface Env {
  DB: D1Database
  SESSION_SECRET: string
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const cookieHeader = request.headers.get('Cookie') ?? ''

  const sessionCookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('admin_session='))

  if (!sessionCookie) {
    return Response.json(
      { ok: false, missatge: 'Cal iniciar sessió.' },
      { status: 401 },
    )
  }

  let token: string

  try {
    token = decodeURIComponent(
      sessionCookie.slice('admin_session='.length),
    )
  } catch {
    return Response.json(
      { ok: false, missatge: 'La sessió no és vàlida.' },
      { status: 401 },
    )
  }

  const username = await verifySession(token, env.SESSION_SECRET)

  if (!username) {
    return Response.json(
      { ok: false, missatge: 'La sessió no és vàlida o ha caducat.' },
      { status: 401 },
    )
  }

  try {
    const result = await env.DB.prepare(`
      SELECT
        p.date,
        p.status,
        p.created_at,
        p.updated_at,
        COUNT(DISTINCT g.id) AS total_grups,
        COUNT(w.id) AS total_paraules
      FROM puzzles p
      LEFT JOIN puzzle_groups g ON g.puzzle_date = p.date
      LEFT JOIN puzzle_words w ON w.group_id = g.id
      GROUP BY p.date, p.status, p.created_at, p.updated_at
      ORDER BY p.date DESC
    `).all()

    return Response.json({
      ok: true,
      username,
      puzzles: result.results,
    })
  } catch (error) {
    console.error('Error consultant els puzles a D1:', error)

    return Response.json(
      {
        ok: false,
        missatge: 'No s’han pogut consultar els puzles de la base de dades.',
      },
      { status: 500 },
    )
  }
}
