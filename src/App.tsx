
import { useEffect, useState } from 'react'
import './App.css'
import { puzzlesPerData } from './puzzles'
import type { Puzzle } from './puzzles'

type Resultat = {
  estat: 'victoria' | 'derrota'
  errors: number
}

type Registre = Record<string, Resultat>

const CLAU_REGISTRE = 'connexions-partides-v1'
const ZONA_HORARIA = 'Europe/Madrid'

function obtenirDataAvui(): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: ZONA_HORARIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const obtenir = (tipus: string) =>
    parts.find((part) => part.type === tipus)?.value ?? ''

  return `${obtenir('year')}-${obtenir('month')}-${obtenir('day')}`
}

function llegirRegistre(): Registre {
  try {
    return JSON.parse(
      localStorage.getItem(CLAU_REGISTRE) ?? '{}',
    ) as Registre
  } catch {
    return {}
  }
}

function desarResultat(data: string, resultat: Resultat) {
  const registre = llegirRegistre()
  registre[data] = resultat
  localStorage.setItem(CLAU_REGISTRE, JSON.stringify(registre))
}

function obtenirDarrersSetDies(dataAvui: string): string[] {
  const resultat: string[] = []
  const [any, mes, dia] = dataAvui.split('-').map(Number)

  // Fem els càlculs en UTC per evitar problemes amb els canvis d'hora.
  const dataBase = new Date(Date.UTC(any, mes - 1, dia))

  for (let i = 0; i < 7; i++) {
    const data = new Date(dataBase)
    data.setUTCDate(data.getUTCDate() - i)
    resultat.push(data.toISOString().slice(0, 10))
  }

  return resultat
}

function dataLlegible(data: string): string {
  const [any, mes, dia] = data.split('-').map(Number)

  const dataUTC = new Date(Date.UTC(any, mes - 1, dia))

  return new Intl.DateTimeFormat('ca-ES', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(dataUTC)
}

function barrejar<T,>(llista: T[]): T[] {
  const resultat = [...llista]

  for (let i = resultat.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[resultat[i], resultat[j]] = [resultat[j], resultat[i]]
  }

  return resultat
}

function App() {
  const [dataAvui, setDataAvui] = useState(obtenirDataAvui)
  const [dataArxiuSeleccionada, setDataArxiuSeleccionada] =
    useState<string | null>(null)
  const [veientArxiu, setVeientArxiu] = useState(false)

  // Detecta el canvi de dia encara que la pàgina estigui oberta.
  useEffect(() => {
    const temporitzador = window.setInterval(() => {
      const novaData = obtenirDataAvui()
      setDataAvui((actual) => actual === novaData ? actual : novaData)
    }, 15000)

    return () => window.clearInterval(temporitzador)
  }, [])

  const datesArxiu = obtenirDarrersSetDies(dataAvui)
const dataMostrada = dataArxiuSeleccionada ?? dataAvui
const puzzleActual: Puzzle | undefined = puzzlesPerData[dataMostrada]

function anarAvui() {
  setDataArxiuSeleccionada(null)
  setVeientArxiu(false)
}

function anarArxiu() {
  setVeientArxiu(true)
}

function seleccionarData(data: string) {
  setDataArxiuSeleccionada(data)
  setVeientArxiu(false)
}

  return (
    <main className="joc">
      <header className="capcalera">
        <h1>CONNEXIONS</h1>
        <p>Troba els quatre grups de paraules relacionades.</p>
      </header>

      <nav className="navegacio" aria-label="Navegació principal">
        <button
          className={!veientArxiu ? 'nav-actiu' : ''}
          onClick={anarAvui}
        >
          Avui
        </button>
        <button
          className={veientArxiu ? 'nav-actiu' : ''}
          onClick={anarArxiu}
        >
          Arxiu
        </button>
      </nav>

      {veientArxiu ? (
        <section className="arxiu">
          <h2>Arxiu de puzles</h2>
          <p>Consulta els puzles d'avui i dels sis dies anteriors.</p>

          <div className="llista-arxiu">
            {datesArxiu.map((data) => {
              const puzzle = puzzlesPerData[data]
              const resultat = llegirRegistre()[data]
              const esAvui = data === dataAvui

              return (
                <div className="element-arxiu" key={data}>
                  <div className="info-arxiu">
                    <strong>{dataLlegible(data)}</strong>
                    <span>
                      {!puzzle
                        ? 'No disponible'
                        : resultat
                          ? resultat.estat === 'victoria'
                            ? 'Completat'
                            : 'Partida perduda'
                          : esAvui
                            ? 'Puzle d’avui'
                            : 'Per jugar'}
                    </span>
                  </div>

                  <button
                    className="boto-arxiu"
                    disabled={!puzzle}
                    onClick={() => seleccionarData(data)}
                  >
                    {resultat ? 'Veure' : esAvui ? 'Jugar' : 'Obrir'}
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      ) : puzzleActual ? (
        <Partida
  key={dataMostrada}
  data={dataMostrada}
  puzzle={puzzleActual}
  esAvui={dataMostrada === dataAvui}
/>
      ) : (
        <section className="sense-puzzle">
          <h2>Encara no hi ha cap puzle disponible</h2>
          <p>
            Torna més tard. Publicarem un nou repte quan estigui preparat.
          </p>
        </section>
      )}
    </main>
  )
}

function Partida({
  data,
  puzzle,
  esAvui,
}: {
  data: string
  puzzle: Puzzle
  esAvui: boolean
}) {
  const grups = puzzle.grups
  const totesLesParaules = grups.flatMap((grup) => grup.paraules)

  const [resultatGuardat, setResultatGuardat] = useState<Resultat | null>(
    () => llegirRegistre()[data] ?? null,
  )
  const [paraules, setParaules] = useState(() =>
    resultatGuardat ? [] : barrejar(totesLesParaules),
  )
  const [seleccionades, setSeleccionades] = useState<string[]>([])
  const [grupsResolts, setGrupsResolts] = useState<string[]>(() =>
    resultatGuardat ? grups.map((grup) => grup.nom) : [],
  )
  const [errors, setErrors] = useState(() => resultatGuardat?.errors ?? 0)
  const [missatge, setMissatge] = useState(() =>
    resultatGuardat
      ? resultatGuardat.estat === 'victoria'
        ? 'Ja has completat aquest puzle.'
        : 'Ja has jugat aquest puzle i has esgotat els intents.'
      : 'Selecciona quatre paraules relacionades.',
  )
  const [popup, setPopup] = useState('')
  const [sacsejant, setSacsejant] = useState(false)
  const [animant, setAnimant] = useState(false)

  const partidaAcabada =
    resultatGuardat !== null ||
    grupsResolts.length === grups.length ||
    errors >= 4

  // Guarda el resultat final al navegador.
  useEffect(() => {
    if (resultatGuardat) return

    if (grupsResolts.length === grups.length) {
      const resultat: Resultat = { estat: 'victoria', errors }
      desarResultat(data, resultat)
      setResultatGuardat(resultat)
      setMissatge('Has trobat tots els grups!')
    } else if (errors >= 4) {
      const resultat: Resultat = { estat: 'derrota', errors }
      desarResultat(data, resultat)
      setResultatGuardat(resultat)
      setMissatge('Has esgotat els intents.')
    }
  }, [data, errors, grups.length, grupsResolts.length, resultatGuardat])

  useEffect(() => {
    if (!popup) return
    const temporitzador = window.setTimeout(() => setPopup(''), 1800)
    return () => window.clearTimeout(temporitzador)
  }, [popup])

  useEffect(() => {
    if (!sacsejant) return
    const temporitzador = window.setTimeout(() => setSacsejant(false), 450)
    return () => window.clearTimeout(temporitzador)
  }, [sacsejant])

  function seleccionarParaula(paraula: string) {
    if (partidaAcabada || animant) return

    setMissatge('Selecciona quatre paraules relacionades.')

    setSeleccionades((actuals) =>
      actuals.includes(paraula)
        ? actuals.filter((p) => p !== paraula)
        : actuals.length < 4
          ? [...actuals, paraula]
          : actuals,
    )
  }

  function comprovarSeleccio() {
    if (seleccionades.length !== 4 || partidaAcabada || animant) return

    const grupCorrecte = grups.find(
      (grup) =>
        seleccionades.every((paraula) => grup.paraules.includes(paraula)) &&
        !grupsResolts.includes(grup.nom),
    )

    if (grupCorrecte) {
      setAnimant(true)

      const zonaResolts = document.querySelector('.grups-resolts')
      const zonaRect = zonaResolts?.getBoundingClientRect()
      const primerBanner = zonaResolts?.querySelector('.grup-resolt')
      const bannerRect = primerBanner?.getBoundingClientRect()

      const ampleZona = zonaRect?.width ?? window.innerWidth - 40
      const altZona = bannerRect?.height ?? 76
      const esquerraZona = zonaRect?.left ?? 20
      const indexFila = grupsResolts.length
      const daltZona = zonaRect
        ? zonaRect.top + indexFila * (altZona + 8)
        : 100

      const targetes = document.querySelectorAll<HTMLButtonElement>(
        '.paraula.seleccionada',
      )

      targetes.forEach((targeta) => {
        const rect = targeta.getBoundingClientRect()
        const index = seleccionades.indexOf(targeta.textContent ?? '')
        const ampleFinal = ampleZona / 4
        const centreXFinal = esquerraZona + ampleFinal * (index + 0.5)
        const centreYFinal = daltZona + altZona / 2
        const deltaX = centreXFinal - (rect.left + rect.width / 2)
        const deltaY = centreYFinal - (rect.top + rect.height / 2)
        const escalaX = ampleFinal / rect.width
        const escalaY = altZona / rect.height

        targeta.animate(
          [
            {
              transform: 'translate(0px, 0px) scale(1)',
              borderRadius: '4px',
              opacity: 1,
            },
            {
              transform: `translate(${deltaX}px, ${deltaY}px) scale(${escalaX}, ${escalaY})`,
              borderRadius: '8px',
              opacity: 1,
            },
          ],
          {
            duration: 600,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'forwards',
          },
        )
      })

      window.setTimeout(() => {
        setGrupsResolts((actuals) => [...actuals, grupCorrecte.nom])
        setParaules((actuals) =>
          actuals.filter((paraula) => !grupCorrecte.paraules.includes(paraula)),
        )
        setSeleccionades([])
        setPopup('')
        setMissatge(`Correcte! Grup trobat: ${grupCorrecte.nom}.`)
        setAnimant(false)
      }, 600)
    } else {
      const grupGairebe = grups.find((grup) => {
        const coincidencies = seleccionades.filter((paraula) =>
          grup.paraules.includes(paraula),
        ).length
        return coincidencies === 3
      })

      const nousErrors = errors + 1
      setErrors(nousErrors)
      setSeleccionades([])
      setSacsejant(true)

      if (nousErrors >= 4) {
        setPopup('')
        setMissatge('Has esgotat els intents.')
      } else if (grupGairebe) {
        setPopup('Gairebé! En falta una.')
        setMissatge('Aquest grup no és correcte.')
      } else {
        setPopup('')
        setMissatge('Aquest grup no és correcte. Torna-ho a intentar.')
      }
    }
  }

  return (
    <>
      <div className="titol-puzzle">
        <h2>{esAvui ? 'Puzle d’avui' : 'Puzle de l’arxiu'}</h2>
        <p>{dataLlegible(data)}</p>
      </div>

      <section className="grups-resolts" aria-label="Grups encertats">
        {grupsResolts
          .map((nom) => grups.find((grup) => grup.nom === nom)!)
          .map((grup) => (
            <div
              className={`grup-resolt color-${grup.dificultat - 1}`}
              key={grup.nom}
            >
              <strong>{grup.nom}</strong>
              <span>{grup.paraules.join(' · ')}</span>
            </div>
          ))}
      </section>

      {paraules.length > 0 && (
        <section
          className={`graella ${sacsejant ? 'sacseja' : ''}`}
          aria-label="Paraules del joc"
        >
          {paraules.map((paraula) => (
            <button
              key={paraula}
              className={`paraula ${
                seleccionades.includes(paraula) ? 'seleccionada' : ''
              }`}
              onClick={() => seleccionarParaula(paraula)}
              aria-pressed={seleccionades.includes(paraula)}
              disabled={partidaAcabada || animant}
            >
              {paraula}
            </button>
          ))}
        </section>
      )}

      <p className="comptador" aria-live="polite">{missatge}</p>
      <p className="errors">Errors: {errors} de 4</p>

      {!partidaAcabada && (
        <div className="controls">
          <button
            className="boto-reinicia"
            onClick={() => setSeleccionades([])}
            disabled={animant}
          >
            Esborra la selecció
          </button>
          <button
            className="boto-comprova"
            onClick={comprovarSeleccio}
            disabled={seleccionades.length !== 4 || animant}
          >
            Comprova
          </button>
        </div>
      )}

      {partidaAcabada && (
        <section className="final-partida">
          <h2>
            {resultatGuardat?.estat === 'victoria' ||
            (!resultatGuardat && grupsResolts.length === grups.length)
              ? 'Felicitats! Has trobat tots els grups!'
              : 'Fi de la partida'}
          </h2>
          <p>
            {resultatGuardat?.estat === 'victoria'
              ? 'Pots consultar les solucions, però aquesta partida ja està tancada.'
              : resultatGuardat?.estat === 'derrota' || errors >= 4
                ? 'Has esgotat els intents. Aquí tens les solucions.'
                : 'Has completat el puzle.'}
          </p>
          <p className="nota-bloqueig">
            {esAvui
              ? 'El proper puzle estarà disponible a partir de mitjanit.'
              : 'Aquest puzle de l’arxiu ja no es pot tornar a jugar.'}
          </p>
          {grupsResolts.length < grups.length && (
            <button
              className="boto-reinicia"
              onClick={() => setGrupsResolts(grups.map((grup) => grup.nom))}
            >
              Mostra totes les solucions
            </button>
          )}
        </section>
      )}

      {popup && <div className="popup" role="status">{popup}</div>}
    </>
  )
}

export default App
