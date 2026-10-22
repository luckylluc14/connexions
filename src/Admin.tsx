
import { useEffect, useState, type FormEvent } from 'react'

type EstatSessio = 'carregant' | 'login' | 'autenticat'
type EstatPuzzle = 'draft' | 'scheduled' | 'published' | 'retired'

interface GrupFormulari {
  name: string
  words: string[]
  difficulty: number
  explanation: string
}

interface PuzzleD1 {
  date: string
  status: EstatPuzzle
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

function crearGrupsBuits(): GrupFormulari[] {
  return Array.from({ length: 4 }, () => ({
    name: '',
    words: ['', '', '', ''],
    difficulty: 1,
    explanation: '',
  }))
}

export default function Admin() {
  const [estat, setEstat] = useState<EstatSessio>('carregant')
  const [usuari, setUsuari] = useState('lluc')
  const [contrasenya, setContrasenya] = useState('')
  const [error, setError] = useState('')
  const [ocupat, setOcupat] = useState(false)
  const [puzzles, setPuzzles] = useState<PuzzleD1[]>([])

  const [dataNova, setDataNova] = useState('')
  const [grupsNous, setGrupsNous] = useState<GrupFormulari[]>(crearGrupsBuits)
  const [dataEdicio, setDataEdicio] = useState<string | null>(null)
  const [grupsEdicio, setGrupsEdicio] = useState<GrupFormulari[]>([])
  const [missatge, setMissatge] = useState('')

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
    if (dades.username) setUsuari(dades.username)
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
        setError(err instanceof Error ? err.message : 'No s’han pogut carregar els puzles.')
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
        body: JSON.stringify({ username: usuari, password: contrasenya }),
      })

      if (!resposta.ok) {
        setError(resposta.status === 401
          ? 'Usuari o contrasenya incorrectes.'
          : 'No s’ha pogut iniciar sessió. Torna-ho a provar.')
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

  function textEstat(status: EstatPuzzle) {
    const estats: Record<EstatPuzzle, string> = {
      draft: 'Esborrany',
      scheduled: 'Programat',
      published: 'Publicat',
      retired: 'Retirat',
    }
    return estats[status]
  }

  function actualitzarGrup(
    grups: GrupFormulari[],
    setter: (grups: GrupFormulari[]) => void,
    indexGrup: number,
    canvis: Partial<GrupFormulari>,
  ) {
    setter(grups.map((grup, index) =>
      index === indexGrup ? { ...grup, ...canvis } : grup,
    ))
  }

  function actualitzarParaula(
    grups: GrupFormulari[],
    setter: (grups: GrupFormulari[]) => void,
    indexGrup: number,
    indexParaula: number,
    paraula: string,
  ) {
    setter(grups.map((grup, index) => {
      if (index !== indexGrup) return grup
      const words = [...grup.words]
      words[indexParaula] = paraula
      return { ...grup, words }
    }))
  }

  async function crearPuzzle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMissatge('')
    setOcupat(true)

    try {
      const resposta = await fetch('/api/admin/puzzles', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dataNova,
          groups: grupsNous,
        }),
      })
      const dades = await resposta.json() as { ok?: boolean; missatge?: string }

      if (!resposta.ok || !dades.ok) {
        setError(dades.missatge ?? 'No s’ha pogut crear el puzle.')
        return
      }

      setMissatge(dades.missatge ?? 'Puzle creat.')
      setDataNova('')
      setGrupsNous(crearGrupsBuits())
      await carregarPuzzles()
    } catch {
      setError('No s’ha pogut connectar amb el servidor.')
    } finally {
      setOcupat(false)
    }
  }

  async function editarPuzzle(date: string) {
    setError('')
    setMissatge('')
    setOcupat(true)

    try {
      const resposta = await fetch(
        `/api/admin/puzzles/${encodeURIComponent(date)}`,
        { credentials: 'same-origin', cache: 'no-store' },
      )
      const dades = await resposta.json() as {
        ok?: boolean
        missatge?: string
        puzzle?: { groups: GrupFormulari[] }
      }

      if (!resposta.ok || !dades.ok || !dades.puzzle) {
        setError(dades.missatge ?? 'No s’ha pogut carregar el puzle.')
        return
      }

      setDataEdicio(date)
      setGrupsEdicio(dades.puzzle.groups)
    } catch {
      setError('No s’ha pogut carregar el puzle.')
    } finally {
      setOcupat(false)
    }
  }

  async function desarEdicio(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!dataEdicio) return

    setError('')
    setMissatge('')
    setOcupat(true)

    try {
      const resposta = await fetch(
        `/api/admin/puzzles/${encodeURIComponent(dataEdicio)}`,
        {
          method: 'PUT',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groups: grupsEdicio }),
        },
      )
      const dades = await resposta.json() as { ok?: boolean; missatge?: string }

      if (!resposta.ok || !dades.ok) {
        setError(dades.missatge ?? 'No s’han pogut desar els canvis.')
        return
      }

      setMissatge(dades.missatge ?? 'Canvis desats.')
      setDataEdicio(null)
      setGrupsEdicio([])
      await carregarPuzzles()
    } catch {
      setError('No s’han pogut desar els canvis.')
    } finally {
      setOcupat(false)
    }
  }

  async function canviarEstat(date: string, status: 'draft' | 'published') {
    const accio = status === 'published' ? 'publicar' : 'retornar a esborrany'
    if (!window.confirm(`Vols ${accio} el puzle del ${date}?`)) return

    setError('')
    setMissatge('')
    setOcupat(true)

    try {
      const resposta = await fetch(
        `/api/admin/puzzles/${encodeURIComponent(date)}`,
        {
          method: 'PATCH',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        },
      )
      const dades = await resposta.json() as { ok?: boolean; missatge?: string }

      if (!resposta.ok || !dades.ok) {
        setError(dades.missatge ?? 'No s’ha pogut canviar l’estat.')
        return
      }

      setMissatge(dades.missatge ?? 'Estat actualitzat.')
      await carregarPuzzles()
    } catch {
      setError('No s’ha pogut canviar l’estat.')
    } finally {
      setOcupat(false)
    }
  }

  function formulariGrups(
    grups: GrupFormulari[],
    setter: (grups: GrupFormulari[]) => void,
    prefix: string,
  ) {
    return grups.map((grup, indexGrup) => (
      <fieldset className="admin-puzzle" key={`${prefix}-${indexGrup}`}>
        <legend>Grup {indexGrup + 1}</legend>

        <label htmlFor={`${prefix}-nom-${indexGrup}`}>Nom del grup</label>
        <input
          id={`${prefix}-nom-${indexGrup}`}
          value={grup.name}
          maxLength={100}
          required
          onChange={(event) => actualitzarGrup(
            grups, setter, indexGrup, { name: event.target.value },
          )}
        />

        {grup.words.map((word, indexParaula) => (
          <div key={indexParaula}>
            <label htmlFor={`${prefix}-word-${indexGrup}-${indexParaula}`}>
              Paraula {indexParaula + 1}
            </label>
            <input
              id={`${prefix}-word-${indexGrup}-${indexParaula}`}
              value={word}
              maxLength={100}
              required
              onChange={(event) => actualitzarParaula(
                grups, setter, indexGrup, indexParaula, event.target.value,
              )}
            />
          </div>
        ))}

        <label htmlFor={`${prefix}-dificultat-${indexGrup}`}>Dificultat</label>
        <select
          id={`${prefix}-dificultat-${indexGrup}`}
          value={grup.difficulty}
          onChange={(event) => actualitzarGrup(
            grups, setter, indexGrup, { difficulty: Number(event.target.value) },
          )}
        >
          <option value={1}>1 — Més fàcil</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4 — Més difícil</option>
        </select>

        <label htmlFor={`${prefix}-explicacio-${indexGrup}`}>
          Explicació (opcional)
        </label>
        <textarea
          id={`${prefix}-explicacio-${indexGrup}`}
          rows={3}
          value={grup.explanation}
          onChange={(event) => actualitzarGrup(
            grups, setter, indexGrup, { explanation: event.target.value },
          )}
        />
      </fieldset>
    ))
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
              autoComplete="username"
              value={usuari}
              onChange={(event) => setUsuari(event.target.value)}
              required
            />
            <label htmlFor="admin-contrasenya">Contrasenya</label>
            <input
              id="admin-contrasenya"
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
          <p>Administració de puzles emmagatzemats a D1.</p>

          <section className="admin-llista-puzles">
            <h3>Crear un puzle nou</h3>
            <form className="admin-formulari" onSubmit={crearPuzzle}>
              <label htmlFor="puzzle-data">Data</label>
              <input
                id="puzzle-data"
                type="date"
                value={dataNova}
                onChange={(event) => setDataNova(event.target.value)}
                required
              />
              {formulariGrups(grupsNous, setGrupsNous, 'nou')}
              <button className="boto-comprova" type="submit" disabled={ocupat}>
                {ocupat ? 'Desant…' : 'Desa com a esborrany'}
              </button>
            </form>
          </section>

          {dataEdicio && (
            <section className="admin-llista-puzles">
              <h3>Editant puzle del {dataEdicio}</h3>
              <form className="admin-formulari" onSubmit={desarEdicio}>
                {formulariGrups(grupsEdicio, setGrupsEdicio, 'edicio')}
                <button className="boto-comprova" type="submit" disabled={ocupat}>
                  {ocupat ? 'Desant…' : 'Desa els canvis'}
                </button>
                <button
                  className="boto-reinicia"
                  type="button"
                  disabled={ocupat}
                  onClick={() => {
                    setDataEdicio(null)
                    setGrupsEdicio([])
                  }}
                >
                  Cancel·la l’edició
                </button>
              </form>
            </section>
          )}

          {missatge && <p className="admin-missatge" role="status">{missatge}</p>}
          {error && <p className="admin-error" role="alert">{error}</p>}

          <section className="admin-llista-puzles">
            <h3>Puzles de la base de dades ({puzzles.length})</h3>
            <button
              className="boto-comprova"
              type="button"
              disabled={ocupat}
              onClick={() => {
                setOcupat(true)
                void carregarPuzzles()
                  .catch(() => setError('No s’han pogut carregar els puzles.'))
                  .finally(() => setOcupat(false))
              }}
            >
              {ocupat ? 'Carregant…' : 'Actualitza la llista'}
            </button>

            {puzzles.length === 0 ? (
              <p className="admin-missatge">Encara no hi ha puzles a D1.</p>
            ) : (
              [...puzzles]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((puzzle) => (
                  <article className="admin-puzzle" key={puzzle.date}>
                    <h4>{puzzle.date}</h4>
                    <p>Estat: {textEstat(puzzle.status)}</p>
                    <p>Grups: {puzzle.total_grups}</p>
                    <p>Paraules: {puzzle.total_paraules}</p>

                    <button
                      className="boto-comprova"
                      type="button"
                      disabled={ocupat}
                      onClick={() => void editarPuzzle(puzzle.date)}
                    >
                      Edita
                    </button>

                    {puzzle.status === 'draft' && (
                      <button
                        className="boto-comprova"
                        type="button"
                        disabled={ocupat}
                        onClick={() => void canviarEstat(puzzle.date, 'published')}
                      >
                        Publica
                      </button>
                    )}

                    {puzzle.status === 'published' && (
                      <button
                        className="boto-reinicia"
                        type="button"
                        disabled={ocupat}
                        onClick={() => void canviarEstat(puzzle.date, 'draft')}
                      >
                        Retorna a esborrany
                      </button>
                    )}
                  </article>
                ))
            )}
          </section>

          <button
            className="boto-reinicia"
            type="button"
            disabled={ocupat}
            onClick={() => void tancarSessio()}
          >
            {ocupat ? 'Tancant sessió…' : 'Tanca la sessió'}
          </button>
        </section>
      )}

      <p className="admin-peu"><a href="/">Torna al joc</a></p>
    </main>
  )
}
