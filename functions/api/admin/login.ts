
interface Env {
    ADMIN_USERNAME: string
    ADMIN_PASSWORD: string
    SESSION_SECRET: string
  }
  
  export const onRequestPost = async ({
    request,
    env,
  }: {
    request: Request
    env: Env
  }) => {
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    }
  
    if (
      request.headers.get('Origin') !== new URL(request.url).origin
    ) {
      return Response.json(
        { error: 'Sol·licitud no vàlida.' },
        { status: 403, headers },
      )
    }
  
    let body: { username?: string; password?: string }
  
    try {
      body = await request.json()
    } catch {
      return Response.json(
        { error: 'Dades invàlides.' },
        { status: 400, headers },
      )
    }
  
    if (
      typeof body.username !== 'string' ||
      typeof body.password !== 'string' ||
      body.username !== env.ADMIN_USERNAME ||
      body.password !== env.ADMIN_PASSWORD
    ) {
      return Response.json(
        { error: 'Usuari o contrasenya incorrectes.' },
        { status: 401, headers },
      )
    }
  
    const { createSession } = await import('../../_auth')
    const token = await createSession(
      env.ADMIN_USERNAME,
      env.SESSION_SECRET,
    )
  
    return Response.json(
      { ok: true },
      {
        status: 200,
        headers: {
          ...headers,
          'Set-Cookie': `admin_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`,
        },
      },
    )
  }
  