
import { verifySession } from '../../_auth'

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

  if (!token) {
    return Response.json(
      { authenticated: false },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json; charset=utf-8',
        },
      },
    )
  }

  const username = await verifySession(token, env.SESSION_SECRET)

  const authenticated = username === env.ADMIN_USERNAME

  return Response.json(
    { authenticated },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json; charset=utf-8',
      },
    },
  )
}
