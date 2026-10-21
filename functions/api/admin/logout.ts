
export const onRequestPost = async ({
    request,
  }: {
    request: Request
  }) => {
    if (request.headers.get('Origin') !== new URL(request.url).origin) {
      return Response.json(
        { error: 'Sol·licitud no vàlida.' },
        { status: 403 },
      )
    }
  
    return Response.json(
      { ok: true },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
          'Set-Cookie':
            'admin_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0',
        },
      },
    )
  }
  