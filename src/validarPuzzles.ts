
import type { Puzzle } from './puzzles'

export function validarPuzzle(puzzle: Puzzle): string[] {
  const errors: string[] = []

  if (puzzle.grups.length !== 4) {
    errors.push('El puzzle ha de tenir exactament 4 grups.')
  }

  const dificultats = puzzle.grups.map((grup) => grup.dificultat)

  for (const dificultat of [1, 2, 3, 4] as const) {
    const quantitat = dificultats.filter(
      (valor) => valor === dificultat,
    ).length

    if (quantitat !== 1) {
      errors.push(
        `La dificultat ${dificultat} ha d'aparèixer exactament una vegada.`,
      )
    }
  }

  const paraules = puzzle.grups.flatMap((grup) => grup.paraules)

  if (paraules.length !== 16) {
    errors.push('El puzzle ha de contenir exactament 16 paraules.')
  }

  for (const grup of puzzle.grups) {
    if (grup.paraules.length !== 4) {
      errors.push(
        `El grup "${grup.nom}" no té exactament 4 paraules.`,
      )
    }

    if (!grup.nom.trim()) {
      errors.push('Hi ha un grup sense nom.')
    }

    if (new Set(grup.paraules).size !== grup.paraules.length) {
      errors.push(
        `El grup "${grup.nom}" conté paraules repetides.`,
      )
    }

    if (
      grup.paraules.some(
        (paraula) => typeof paraula !== 'string' || !paraula.trim(),
      )
    ) {
      errors.push(
        `El grup "${grup.nom}" conté paraules buides o invàlides.`,
      )
    }
  }

  const paraulesNormalitzades = paraules.map((paraula) =>
    paraula.trim().toLocaleUpperCase('ca'),
  )

  if (new Set(paraulesNormalitzades).size !== paraulesNormalitzades.length) {
    errors.push('Hi ha paraules repetides entre els grups.')
  }

  return errors
}
