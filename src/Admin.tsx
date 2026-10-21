
import { useEffect, useState, type FormEvent } from 'react'
import { puzzlesPerData } from './puzzles'

type EstatSessio = 'carregant' | 'login' | 'autenticat'

export default function Admin() {
  const [estat, setEstat] = useState<EstatSessio>('carregant')
  const [usuari, setUsuari] = useState('lluc')
  const [contrasenya, setContrasenya] = useState('')
  const [error, setError] = useState('')
  const [ocupat, setOcupat] = useState(false)

  async function comprovarSessio() {
    try {
      const resposta = await fetch('/api/admin/session', {
        credentials: 'same-origin',
        cache: 'no-store',
      })
      const dades = await resposta.json() as { authenticated?: boolean }
      setEstat(dades.authenticated ? 'autenticat' : 'login')
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
        body: JSON.stringify({ username: usuari, password: contrasenya }),
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
    } catch {
      setError('No s’ha pogut connectar amb el servidor.')
    } finally {
      setOcupat(false)
    }
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

            {error && <p className="admin-error" role="alert">{error}</p>}

            <button className="boto-comprova" type="submit" disabled={ocupat}>
              {ocupat ? 'Comprovant…' : 'Inicia sessió'}
            </button>
          </form>
        </section>
      ) : (
        <section className="admin-panell">
          <h2>Benvingut/da, {usuari}</h2>
          <p>Has iniciat sessió correctament.</p>
          <div className="admin-llista-puzles">
  <h3>Puzles existents ({Object.keys(puzzlesPerData).length})</h3>

  {Object.entries(puzzlesPerData)
    .sort(([dataA], [dataB]) => dataB.localeCompare(dataA))
    .map(([data, puzzle]) => (
      <article className="admin-puzzle" key={data}>
        <h4>{data}</h4>
        <p>Estat: {puzzle.estat}</p>
        <p>Nombre de grups: {puzzle.grups.length}</p>

        {puzzle.grups.map((grup) => (
          <div key={grup.nom}>
            <strong>{grup.nom}</strong>
            <p>{grup.paraules.join(', ')}</p>
            <p>Dificultat: {grup.dificultat}/4</p>
          </div>
        ))}
      </article>
    ))}
</div>

          {error && <p className="admin-error" role="alert">{error}</p>}

          <button
            className="boto-reinicia"
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
