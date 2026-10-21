
import dades from './puzzles.json'

export type Dificultat = 1 | 2 | 3 | 4

export type Grup = {
  nom: string
  paraules: string[]
  dificultat: Dificultat
  explicacio?: string
}

export type Puzzle = {
  data: string
  grups: Grup[]
  estat: 'esborrany' | 'aprovat' | 'publicat'
}

export const puzzlesPerData = dades as Record<string, Puzzle>
