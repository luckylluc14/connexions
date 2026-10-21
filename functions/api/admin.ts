
import { verifySession } from '../_auth'

interface Env {
  SESSION_SECRET: string
  ADMIN_USERNAME: string
}

export const onRequestGet = async ({
  request,
  env,
}: {
  request: Request
  env: Env
}) => {
  const cookie = request.headers.get('Cookie') ?? ''
  const match = cookie.match(/(?:^|;\s*)admin_session=([^;]+)/)
  const token = match?.[1]

  const username = token
    ? await verifySession(token, env.SESSION_SECRET)
    : null

  if (!username || username !== env.ADMIN_USERNAME) {
    return Response.json(
      { error: 'No autoritzat.' },
      {
        status: 401,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json; charset=utf-8',
        },
      },
    )
  }

  return Response.json(
    { ok: true, username },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json; charset=utf-8',
      },
    },
  )
}
