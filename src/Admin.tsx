
import { useEffect, useState, type FormEvent } from 'react'

type EstatSessio = 'carregant' | 'login' | 'autenticat'

interface PuzzleD1 {
  date: string
  status: 'draft' | 'scheduled' | 'published' | 'retired'
  created_at: string
  updated_at: string
  total_grups: number
  total_paraules: number
}

interface RespostaAdmin {
  ok: boolean
  username?: string
  puzzles?: PuzzleD1[]
  missatge?: string
}

export default function Admin() {
  const [estat, setEstat] = useState<EstatSessio>('carregant')
  const [usuari, setUsuari] = useState('lluc')
  const [contrasenya, setContrasenya] = useState('')
  const [error, setError] = useState('')
  const [ocupat, setOcupat] = useState(false)
  const [puzzles, setPuzzles] = useState<PuzzleD1[]>([])

  async function carregarPuzzles() {
    const resposta = await fetch('/api/admin', {
      credentials: 'same-origin',
      cache: 'no-store',
    })

    const dades = await resposta.json() as RespostaAdmin

    if (!resposta.ok || !dades.ok) {
      throw new Error(dades.missatge ?? 'No s’han pogut carregar els puzles.')
    }

    setPuzzles(dades.puzzles ?? [])

    if (dades.username) {
      setUsuari(dades.username)
    }
  }

  async function comprovarSessio() {
    try {
      const resposta = await fetch('/api/admin/session', {
        credentials: 'same-origin',
        cache: 'no-store',
      })

      const dades = await resposta.json() as { authenticated?: boolean }

      if (!dades.authenticated) {
        setEstat('login')
        return
      }

      setEstat('autenticat')

      try {
        await carregarPuzzles()
        setError('')
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'No s’han pogut carregar els puzles.',
        )
      }
    } catch {
      setEstat('login')
      setError('No s’ha pogut comprovar la sessió. Torna-ho a provar.')
    }
  }

  useEffect(() => {
    void comprovarSessio()
  }, [])

  async function iniciarSessio(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setOcupat(true)

    try {
      const resposta = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usuari,
          password: contrasenya,
        }),
      })

      if (!resposta.ok) {
        setError(
          resposta.status === 401
            ? 'Usuari o contrasenya incorrectes.'
            : 'No s’ha pogut iniciar sessió. Torna-ho a provar.',
        )
        return
      }

      setContrasenya('')
      await comprovarSessio()
    } catch {
      setError('No s’ha pogut connectar amb el servidor.')
    } finally {
      setOcupat(false)
    }
  }

  async function tancarSessio() {
    setError('')
    setOcupat(true)

    try {
      const resposta = await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'same-origin',
      })

      if (!resposta.ok) {
        setError('No s’ha pogut tancar la sessió.')
        return
      }

      setEstat('login')
      setContrasenya('')
      setPuzzles([])
    } catch {
      setError('No s’ha pogut connectar amb el servidor.')
    } finally {
      setOcupat(false)
    }
  }

  async function actualitzarPuzzles() {
    setError('')
    setOcupat(true)

    try {
      await carregarPuzzles()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No s’han pogut actualitzar els puzles.',
      )
    } finally {
      setOcupat(false)
    }
  }

  function textEstat(status: PuzzleD1['status']) {
    const estats: Record<PuzzleD1['status'], string> = {
      draft: 'Esborrany',
      scheduled: 'Programat',
      published: 'Publicat',
      retired: 'Retirat',
    }

    return estats[status]
  }

  return (
    <main className="joc admin">
      <header className="capcalera">
        <h1>CONNEXIONS</h1>
        <p>Administració</p>
      </header>

      {estat === 'carregant' ? (
        <p className="admin-missatge">Comprovant la sessió…</p>
      ) : estat === 'login' ? (
        <section className="admin-panell">
          <h2>Inici de sessió</h2>
          <p>Accés restringit a l’administració.</p>

          <form className="admin-formulari" onSubmit={iniciarSessio}>
            <label htmlFor="admin-usuari">Usuari</label>
            <input
              id="admin-usuari"
              name="username"
              autoComplete="username"
              value={usuari}
              onChange={(event) => setUsuari(event.target.value)}
              required
            />

            <label htmlFor="admin-contrasenya">Contrasenya</label>
            <input
              id="admin-contrasenya"
              name="password"
              type="password"
              autoComplete="current-password"
              value={contrasenya}
              onChange={(event) => setContrasenya(event.target.value)}
              required
            />

            {error && (
              <p className="admin-error" role="alert">
                {error}
              </p>
            )}

            <button
              className="boto-comprova"
              type="submit"
              disabled={ocupat}
            >
              {ocupat ? 'Comprovant…' : 'Inicia sessió'}
            </button>
          </form>
        </section>
      ) : (
        <section className="admin-panell">
          <h2>Benvingut/da, {usuari}</h2>
          <p>Administració de puzles emmagatzemats a D1.</p>

          <div className="admin-llista-puzles">
            <h3>Puzles de la base de dades ({puzzles.length})</h3>

            <button
              className="boto-comprova"
              type="button"
              onClick={() => void actualitzarPuzzles()}
              disabled={ocupat}
            >
              {ocupat ? 'Carregant…' : 'Actualitza la llista'}
            </button>

            {puzzles.length === 0 ? (
              <p className="admin-missatge">
                Encara no hi ha puzles a D1. Els importarem en el pas següent.
              </p>
            ) : (
              [...puzzles]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((puzzle) => (
                  <article className="admin-puzzle" key={puzzle.date}>
                    <h4>{puzzle.date}</h4>
                    <p>Estat: {textEstat(puzzle.status)}</p>
                    <p>Nombre de grups: {puzzle.total_grups}</p>
                    <p>Nombre de paraules: {puzzle.total_paraules}</p>
                  </article>
                ))
            )}
          </div>

          {error && (
            <p className="admin-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="boto-reinicia"
            type="button"
            onClick={() => void tancarSessio()}
            disabled={ocupat}
          >
            {ocupat ? 'Tancant sessió…' : 'Tanca la sessió'}
          </button>
        </section>
      )}

      <p className="admin-peu">
        <a href="/">Torna al joc</a>
      </p>
    </main>
  )
}
