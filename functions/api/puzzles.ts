
/// <reference types="@cloudflare/workers-types" />

interface Env {
    DB: D1Database;
  }
  
  interface GrupFila {
    puzzle_date: string;
    name: string;
    difficulty: number;
    explanation: string | null;
    word: string;
    group_position: number;
    word_position: number;
  }
  
  export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
    try {
      const result = await env.DB.prepare(`
        SELECT
          p.date AS puzzle_date,
          g.name,
          g.difficulty,
          g.explanation,
          w.word,
          g.position AS group_position,
          w.position AS word_position
        FROM puzzles p
        INNER JOIN puzzle_groups g ON g.puzzle_date = p.date
        INNER JOIN puzzle_words w ON w.group_id = g.id
        WHERE p.status = 'published'
        ORDER BY p.date DESC, g.position ASC, w.position ASC
      `).all<GrupFila>();
  
      const puzles = new Map<string, {
        data: string;
        grups: {
          nom: string;
          paraules: string[];
          dificultat: 1 | 2 | 3 | 4;
          explicacio?: string;
        }[];
        estat: 'publicat';
      }>();
  
      for (const fila of result.results) {
        if (!puzles.has(fila.puzzle_date)) {
          puzles.set(fila.puzzle_date, {
            data: fila.puzzle_date,
            grups: [],
            estat: 'publicat',
          });
        }
  
        const puzzle = puzles.get(fila.puzzle_date)!;
        let grup = puzzle.grups[fila.group_position];
  
        if (!grup) {
          grup = {
            nom: fila.name,
            paraules: [],
            dificultat: fila.difficulty as 1 | 2 | 3 | 4,
            ...(fila.explanation
              ? { explicacio: fila.explanation }
              : {}),
          };
  
          puzzle.grups[fila.group_position] = grup;
        }
  
        grup.paraules.push(fila.word);
      }
  
      return Response.json(Array.from(puzles.values()), {
        headers: { 'Cache-Control': 'no-store' },
      });
    } catch (error) {
      console.error('Error carregant els puzles:', error);
  
      return Response.json(
        { error: "No s'han pogut carregar els puzles." },
        { status: 500 },
      );
    }
  };
  