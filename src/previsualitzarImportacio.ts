
import { readFileSync } from 'node:fs'
import { validarPuzzle } from './validarPuzzles.ts'
import type { Puzzle } from './puzzles'

const rutaPendents = 'src/puzzles-pendents.json'
const rutaPuzzles = 'src/puzzles.json'

const pendents: Puzzle[] = JSON.parse(
  readFileSync(rutaPendents, 'utf-8'),
)

const dadesActuals: Record<string, Puzzle> = JSON.parse(
  readFileSync(rutaPuzzles, 'utf-8'),
)

console.log('PREVISUALITZACIÓ DE LA IMPORTACIÓ')
console.log('================================')

let preparats = 0
let errorsTotals = 0

for (const [index, puzzle] of pendents.entries()) {
  console.log(`\nPuzzle ${index + 1}`)

  if (puzzle.estat === 'esborrany') {
    console.log('⏭️ Ignorat: encara és un esborrany.')
    continue
  }

  if (puzzle.estat !== 'aprovat') {
    console.log('❌ Estat no vàlid: cal que sigui "esborrany" o "aprovat".')
    errorsTotals++
    continue
  }

  if (!puzzle.data || !/^\d{4}-\d{2}-\d{2}$/.test(puzzle.data)) {
    console.log('❌ Ignorat: falta una data vàlida.')
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

  if (dadesActuals[puzzle.data]) {
    console.log(`❌ Ja existeix una entrada per al dia ${puzzle.data}.`)
    errorsTotals++
    continue
  }

  console.log(`✅ Preparat per importar el dia ${puzzle.data}.`)
  preparats++
}

console.log('\nRESUM')
console.log('=====')
console.log(`Puzzles pendents revisats: ${pendents.length}`)
console.log(`Puzzles preparats: ${preparats}`)
console.log(`Errors detectats: ${errorsTotals}`)
console.log('\nMode de prova: no s\'ha modificat cap fitxer.')
