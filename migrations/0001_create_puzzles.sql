
CREATE TABLE IF NOT EXISTS puzzles (
  date TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'published', 'retired')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS puzzle_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  puzzle_date TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 4),
  name TEXT NOT NULL,
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 4),
  explanation TEXT,
  FOREIGN KEY (puzzle_date) REFERENCES puzzles(date)
    ON DELETE CASCADE,
  UNIQUE (puzzle_date, position),
  UNIQUE (puzzle_date, name)
);

CREATE TABLE IF NOT EXISTS puzzle_words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 4),
  word TEXT NOT NULL,
  FOREIGN KEY (group_id) REFERENCES puzzle_groups(id)
    ON DELETE CASCADE,
  UNIQUE (group_id, position),
  UNIQUE (group_id, word)
);

CREATE TABLE IF NOT EXISTS puzzle_publications (
  puzzle_date TEXT PRIMARY KEY,
  published_at TEXT,
  FOREIGN KEY (puzzle_date) REFERENCES puzzles(date)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_puzzles_status_date
  ON puzzles(status, date);
