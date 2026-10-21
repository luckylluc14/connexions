
interface SessionPayload {
    username: string
    expires: number
  }
  
  function toBase64Url(bytes: Uint8Array): string {
    let binary = ''
    for (const byte of bytes) binary += String.fromCharCode(byte)
  
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '')
  }
  
  function fromBase64Url(value: string): Uint8Array {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0))
  }
  
  async function sign(value: string, secret: string): Promise<string> {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
  
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(value),
    )
  
    return toBase64Url(new Uint8Array(signature))
  }
  
  export async function createSession(
    username: string,
    secret: string,
  ): Promise<string> {
    const payload: SessionPayload = {
      username,
      expires: Date.now() + 8 * 60 * 60 * 1000,
    }
  
    const encoded = toBase64Url(
      new TextEncoder().encode(JSON.stringify(payload)),
    )
  
    return `${encoded}.${await sign(encoded, secret)}`
  }
  
  export async function verifySession(
    token: string,
    secret: string,
  ): Promise<string | null> {
    try {
      const parts = token.split('.')
      if (parts.length !== 2) return null
  
      const [encoded, signature] = parts
      const expected = fromBase64Url(await sign(encoded, secret))
      const actual = fromBase64Url(signature)
  
      if (expected.length !== actual.length) return null
  
      let difference = 0
      for (let i = 0; i < expected.length; i++) {
        difference |= expected[i] ^ actual[i]
      }
      if (difference !== 0) return null
  
      const payload = JSON.parse(
        new TextDecoder().decode(fromBase64Url(encoded)),
      ) as SessionPayload
  
      if (
        typeof payload.username !== 'string' ||
        typeof payload.expires !== 'number' ||
        payload.expires <= Date.now()
      ) {
        return null
      }
  
      return payload.username
    } catch {
      return null
    }
  }
  