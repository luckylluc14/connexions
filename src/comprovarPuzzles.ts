/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { validarPuzzle } from './validarPuzzles'
import type { Puzzle } from './puzzles'

const contingut = readFileSync(
  'src/puzzles-pendents.json',
  'utf-8',
)

const puzzles: Puzzle[] = JSON.parse(contingut)

let totalErrors = 0

puzzles.forEach((puzzle, index) => {
  const errors = validarPuzzle(puzzle)

  console.log(`\nPuzzle ${index + 1}`)

  if (errors.length === 0) {
    console.log('✅ Supera les comprovacions estructurals.')
  } else {
    console.log('❌ Cal revisar aquest puzzle:')

    errors.forEach((error) => {
      console.log(`  - ${error}`)
    })

    totalErrors += errors.length
  }
})

console.log(`\nTotal de puzzles: ${puzzles.length}`)
console.log(`Total d'errors: ${totalErrors}`)
