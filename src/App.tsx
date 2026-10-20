
import { useEffect, useState } from 'react'
import './App.css'
import { grups } from './puzzles'

function barrejar<T,>(llista: T[]): T[] {
  const resultat = [...llista]

  for (let i = resultat.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[resultat[i], resultat[j]] = [resultat[j], resultat[i]]
  }

  return resultat
}

const totesLesParaules = grups.flatMap((grup) => grup.paraules)

function App() {
  const [paraules, setParaules] = useState(() =>
    barrejar(totesLesParaules),
  )
  const [seleccionades, setSeleccionades] = useState<string[]>([])
  const [grupsResolts, setGrupsResolts] = useState<string[]>([])
  const [errors, setErrors] = useState(0)
  const [missatge, setMissatge] = useState(
    'Selecciona quatre paraules relacionades.',
  )
  const [popup, setPopup] = useState('')
  const [sacsejant, setSacsejant] = useState(false)
  const [animant, setAnimant] = useState(false)

  const partidaAcabada =
    grupsResolts.length === grups.length || errors >= 4

  // El popup desapareix automàticament.
  useEffect(() => {
    if (!popup) return

    const temporitzador = window.setTimeout(() => {
      setPopup('')
    }, 1800)

    return () => window.clearTimeout(temporitzador)
  }, [popup])

  // La sacsejada dura 450 mil·lisegons.
  useEffect(() => {
    if (!sacsejant) return

    const temporitzador = window.setTimeout(() => {
      setSacsejant(false)
    }, 450)

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
        seleccionades.every((paraula) =>
          grup.paraules.includes(paraula),
        ) && !grupsResolts.includes(grup.nom),
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

// Cada grup resolt ocupa una fila.
const indexFila = grupsResolts.length
const separacioFiles = 8

const daltZona = zonaRect
  ? zonaRect.top + indexFila * (altZona + separacioFiles)
  : 100

      const targetes = document.querySelectorAll<HTMLButtonElement>(
        '.paraula.seleccionada',
      )

      targetes.forEach((targeta) => {
        const rect = targeta.getBoundingClientRect()

        // Cada targeta tindrà la seva pròpia posició al banner.
        const index = seleccionades.indexOf(targeta.textContent ?? '')
        const ampleFinal = ampleZona / 4
        const centreXFinal =
          esquerraZona + ampleFinal * (index + 0.5)
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
          actuals.filter(
            (paraula) => !grupCorrecte.paraules.includes(paraula),
          ),
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
        setMissatge('Has esgotat els intents. Torna-ho a provar!')
      } else if (grupGairebe) {
        setPopup('Gairebé! En falta una.')
        setMissatge('Aquest grup no és correcte.')
      } else {
        setPopup('')
        setMissatge('Aquest grup no és correcte. Torna-ho a intentar.')
      }
    }
  }

  function novaPartida() {
    setParaules(barrejar(totesLesParaules))
    setSeleccionades([])
    setGrupsResolts([])
    setErrors(0)
    setPopup('')
    setSacsejant(false)
    setAnimant(false)
    setMissatge('Selecciona quatre paraules relacionades.')
  }

  return (
    <main className="joc">
      <header className="capcalera">
        <h1>CONNEXIONS</h1>
        <p>Troba els quatre grups de paraules relacionades.</p>
      </header>

      <section className="grups-resolts" aria-label="Grups encertats">
      {grupsResolts
       .map((nom) => grups.find((grup) => grup.nom === nom)!)
       .map((grup) => {
            const indexColor = grups.findIndex(
              (item) => item.nom === grup.nom,
            )

            return (
              <div
                className={`grup-resolt color-${indexColor}`}
                key={grup.nom}
              >
                <strong>{grup.nom}</strong>
                <span>{grup.paraules.join(' · ')}</span>
              </div>
            )
          })}
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

      <p className="comptador" aria-live="polite">
        {missatge}
      </p>

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
            {grupsResolts.length === 4
              ? 'Felicitats! Has trobat tots els grups!'
              : 'Fi de la partida'}
          </h2>

          <button className="boto-reinicia" onClick={novaPartida}>
            Juga una altra vegada
          </button>
        </section>
      )}

      {popup && (
        <div className="popup" role="status">
          {popup}
        </div>
      )}
    </main>
  )
}

export default App
