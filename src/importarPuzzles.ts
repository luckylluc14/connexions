
import {
    existsSync,
    mkdirSync,
    readFileSync,
    renameSync,
    writeFileSync,
    copyFileSync,
    unlinkSync,
  } from 'node:fs'
  import { createInterface } from 'node:readline/promises'
  import { stdin, stdout } from 'node:process'
  import { validarPuzzle } from './validarPuzzles.ts'
  import type { Puzzle } from './puzzles'
  
  const rutaPendents = 'src/puzzles-pendents.json'
  const rutaPuzzles = 'src/puzzles.json'
  const carpetaCopia = 'backups'
  
  function llegirJson<T>(ruta: string): T {
    return JSON.parse(readFileSync(ruta, 'utf-8')) as T
  }
  
  function escriureTemporal(ruta: string, contingut: string): string {
    const temporal = `${ruta}.tmp`
    writeFileSync(temporal, contingut, 'utf-8')
    return temporal
  }
  
  function dataValida(data: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false
  
    const dataComprovada = new Date(`${data}T00:00:00Z`)
    return (
      !Number.isNaN(dataComprovada.getTime()) &&
      dataComprovada.toISOString().slice(0, 10) === data
    )
  }
  
  const pendents = llegirJson<Puzzle[]>(rutaPendents)
  const puzzlesActuals = llegirJson<Record<string, Puzzle>>(rutaPuzzles)
  
  const aprovats = pendents.filter((puzzle) => puzzle.estat === 'aprovat')
  
  if (aprovats.length === 0) {
    console.log('No hi ha cap puzzle aprovat per importar.')
    process.exit(0)
  }
  
  const datesVistes = new Set(Object.keys(puzzlesActuals))
  let errorsTotals = 0
  
  for (const [index, puzzle] of aprovats.entries()) {
    console.log(`\nPuzzle aprovat ${index + 1}: ${puzzle.data || '(sense data)'}`)
  
    if (!dataValida(puzzle.data)) {
      console.log('❌ Data invàlida.')
      errorsTotals++
      continue
    }
  
    if (datesVistes.has(puzzle.data)) {
      console.log(`❌ Ja existeix un puzzle per al dia ${puzzle.data}.`)
      errorsTotals++
      continue
    }
  
    const errors = validarPuzzle(puzzle)
  
    if (errors.length > 0) {
      console.log('❌ No supera la validació:')
      errors.forEach((error) => console.log(`  - ${error}`))
      errorsTotals += errors.length
      continue
    }
  
    datesVistes.add(puzzle.data)
    console.log(`✅ Vàlid: ${puzzle.data}`)
  }
  
  if (errorsTotals > 0) {
    console.log(`\nS'han detectat ${errorsTotals} errors. No s'ha modificat cap fitxer.`)
    process.exit(1)
  }
  
  console.log('\nPuzzles que s\'importaran:')
  for (const puzzle of aprovats) console.log(`- ${puzzle.data}`)
  
  const terminal = createInterface({ input: stdin, output: stdout })
  const resposta = await terminal.question(
    '\nVols importar aquests puzzles? Escriu SÍ per confirmar: ',
  )
  terminal.close()
  
  if (resposta.trim().toLocaleUpperCase('ca') !== 'SÍ') {
    console.log('Importació cancel·lada. No s\'ha modificat cap fitxer.')
    process.exit(0)
  }
  
  // Torna a llegir els fitxers per evitar treballar amb dades antigues.
  const pendentsActuals = readFileSync(rutaPendents, 'utf-8')
  const dadesActuals = readFileSync(rutaPuzzles, 'utf-8')
  
  const pendentsLlegits = JSON.parse(pendentsActuals) as Puzzle[]
  const puzzlesLlegits = JSON.parse(dadesActuals) as Record<string, Puzzle>
  
  for (const puzzle of aprovats) {
    if (puzzlesLlegits[puzzle.data]) {
      throw new Error(`El puzzle del dia ${puzzle.data} ja existeix. No s'ha modificat res.`)
    }
  }
  
  const puzzlesNous: Record<string, Puzzle> = { ...puzzlesLlegits }
  for (const puzzle of aprovats) {
    puzzlesNous[puzzle.data] = { ...puzzle, estat: 'publicat' }
  }
  
  const pendentsNous = pendentsLlegits.map((puzzle) =>
    puzzle.estat === 'aprovat'
      ? { ...puzzle, estat: 'publicat' as const }
      : puzzle,
  )
  
  mkdirSync(carpetaCopia, { recursive: true })
  const marcaTemps = new Date().toISOString().replace(/[:.]/g, '-')
  const copiaPuzzles = `${carpetaCopia}/puzzles-${marcaTemps}.json`
  const copiaPendents = `${carpetaCopia}/puzzles-pendents-${marcaTemps}.json`
  
  copyFileSync(rutaPuzzles, copiaPuzzles)
  copyFileSync(rutaPendents, copiaPendents)
  
  const temporalPuzzles = escriureTemporal(
    rutaPuzzles,
    `${JSON.stringify(puzzlesNous, null, 2)}\n`,
  )
  const temporalPendents = escriureTemporal(
    rutaPendents,
    `${JSON.stringify(pendentsNous, null, 2)}\n`,
  )
  
  let puzzlesSubstituits = false
  
  try {
    renameSync(temporalPuzzles, rutaPuzzles)
    puzzlesSubstituits = true
    renameSync(temporalPendents, rutaPendents)
  } catch (error) {
    if (puzzlesSubstituits) {
      copyFileSync(copiaPuzzles, rutaPuzzles)
    }
    if (existsSync(temporalPuzzles)) unlinkSync(temporalPuzzles)
    if (existsSync(temporalPendents)) unlinkSync(temporalPendents)
    throw error
  }
  
  console.log(`\n✅ Importació completada: ${aprovats.length} puzzle(s).`)
  console.log(`Còpies de seguretat desades a "${carpetaCopia}".`)
  