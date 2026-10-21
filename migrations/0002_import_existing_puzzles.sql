
-- Importa els tres puzles originals sense sobreescriure dates existents.

INSERT INTO puzzles (date, status)
VALUES
  ('2026-10-20', 'published'),
  ('2026-10-21', 'published'),
  ('2026-10-22', 'published')
ON CONFLICT(date) DO NOTHING;

-- Puzle del 20 d'octubre
INSERT INTO puzzle_groups (puzzle_date, position, name, difficulty, explanation)
SELECT '2026-10-20', 1, 'Flors', 1, 'Totes són flors.'
WHERE EXISTS (SELECT 1 FROM puzzles WHERE date = '2026-10-20');

INSERT INTO puzzle_groups (puzzle_date, position, name, difficulty, explanation)
SELECT '2026-10-20', 2, 'Instruments musicals', 2, 'Tots són instruments musicals.'
WHERE EXISTS (SELECT 1 FROM puzzles WHERE date = '2026-10-20');

INSERT INTO puzzle_groups (puzzle_date, position, name, difficulty, explanation)
SELECT '2026-10-20', 3, 'Mesos de l’any', 3, 'Tots són mesos de l’any.'
WHERE EXISTS (SELECT 1 FROM puzzles WHERE date = '2026-10-20');

INSERT INTO puzzle_groups (puzzle_date, position, name, difficulty, explanation)
SELECT '2026-10-20', 4, 'Animals', 4, 'Tots són animals.'
WHERE EXISTS (SELECT 1 FROM puzzles WHERE date = '2026-10-20');

-- Puzle del 21 d'octubre
INSERT INTO puzzle_groups (puzzle_date, position, name, difficulty, explanation)
SELECT '2026-10-21', 1, 'Fruites', 1, 'Totes són fruites.'
WHERE EXISTS (SELECT 1 FROM puzzles WHERE date = '2026-10-21');

INSERT INTO puzzle_groups (puzzle_date, position, name, difficulty, explanation)
SELECT '2026-10-21', 2, 'Parts del cos', 2, 'Totes són parts del cos.'
WHERE EXISTS (SELECT 1 FROM puzzles WHERE date = '2026-10-21');

INSERT INTO puzzle_groups (puzzle_date, position, name, difficulty, explanation)
SELECT '2026-10-21', 3, 'Colors', 3, 'Tots són noms de colors.'
WHERE EXISTS (SELECT 1 FROM puzzles WHERE date = '2026-10-21');

INSERT INTO puzzle_groups (puzzle_date, position, name, difficulty, explanation)
SELECT '2026-10-21', 4, 'Material escolar', 4, 'Tots són objectes que es poden utilitzar a l’escola.'
WHERE EXISTS (SELECT 1 FROM puzzles WHERE date = '2026-10-21');

-- Puzle del 22 d'octubre
INSERT INTO puzzle_groups (puzzle_date, position, name, difficulty, explanation)
SELECT '2026-10-22', 1, 'Verdures', 1, 'Totes són verdures en l''ús culinari habitual.'
WHERE EXISTS (SELECT 1 FROM puzzles WHERE date = '2026-10-22');

INSERT INTO puzzle_groups (puzzle_date, position, name, difficulty, explanation)
SELECT '2026-10-22', 2, 'Elements d''un ordinador', 2, 'Són perifèrics o dispositius habituals d''un ordinador.'
WHERE EXISTS (SELECT 1 FROM puzzles WHERE date = '2026-10-22');

INSERT INTO puzzle_groups (puzzle_date, position, name, difficulty, explanation)
SELECT '2026-10-22', 3, 'Fenòmens meteorològics', 3, 'Tots estan relacionats amb fenòmens atmosfèrics.'
WHERE EXISTS (SELECT 1 FROM puzzles WHERE date = '2026-10-22');

INSERT INTO puzzle_groups (puzzle_date, position, name, difficulty, explanation)
SELECT '2026-10-22', 4, 'Figures geomètriques', 4, 'Totes són figures geomètriques.'
WHERE EXISTS (SELECT 1 FROM puzzles WHERE date = '2026-10-22');

-- Paraules del 20 d'octubre
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 1, 'ROSA' FROM puzzle_groups WHERE puzzle_date = '2026-10-20' AND position = 1;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 2, 'TULIPA' FROM puzzle_groups WHERE puzzle_date = '2026-10-20' AND position = 1;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 3, 'LLIRI' FROM puzzle_groups WHERE puzzle_date = '2026-10-20' AND position = 1;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 4, 'GIRA-SOL' FROM puzzle_groups WHERE puzzle_date = '2026-10-20' AND position = 1;

INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 1, 'GUITARRA' FROM puzzle_groups WHERE puzzle_date = '2026-10-20' AND position = 2;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 2, 'PIANO' FROM puzzle_groups WHERE puzzle_date = '2026-10-20' AND position = 2;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 3, 'VIOLÍ' FROM puzzle_groups WHERE puzzle_date = '2026-10-20' AND position = 2;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 4, 'BATERIA' FROM puzzle_groups WHERE puzzle_date = '2026-10-20' AND position = 2;

INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 1, 'GENER' FROM puzzle_groups WHERE puzzle_date = '2026-10-20' AND position = 3;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 2, 'MARÇ' FROM puzzle_groups WHERE puzzle_date = '2026-10-20' AND position = 3;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 3, 'MAIG' FROM puzzle_groups WHERE puzzle_date = '2026-10-20' AND position = 3;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 4, 'JULIOL' FROM puzzle_groups WHERE puzzle_date = '2026-10-20' AND position = 3;

INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 1, 'GAT' FROM puzzle_groups WHERE puzzle_date = '2026-10-20' AND position = 4;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 2, 'GOS' FROM puzzle_groups WHERE puzzle_date = '2026-10-20' AND position = 4;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 3, 'CAVALL' FROM puzzle_groups WHERE puzzle_date = '2026-10-20' AND position = 4;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 4, 'CONILL' FROM puzzle_groups WHERE puzzle_date = '2026-10-20' AND position = 4;

-- Paraules del 21 d'octubre
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 1, 'POMA' FROM puzzle_groups WHERE puzzle_date = '2026-10-21' AND position = 1;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 2, 'PERA' FROM puzzle_groups WHERE puzzle_date = '2026-10-21' AND position = 1;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 3, 'PLÀTAN' FROM puzzle_groups WHERE puzzle_date = '2026-10-21' AND position = 1;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 4, 'PRÉSSEC' FROM puzzle_groups WHERE puzzle_date = '2026-10-21' AND position = 1;

INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 1, 'COLZE' FROM puzzle_groups WHERE puzzle_date = '2026-10-21' AND position = 2;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 2, 'GENOLL' FROM puzzle_groups WHERE puzzle_date = '2026-10-21' AND position = 2;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 3, 'ESPATLLA' FROM puzzle_groups WHERE puzzle_date = '2026-10-21' AND position = 2;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 4, 'TURMELL' FROM puzzle_groups WHERE puzzle_date = '2026-10-21' AND position = 2;

INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 1, 'VERMELL' FROM puzzle_groups WHERE puzzle_date = '2026-10-21' AND position = 3;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 2, 'BLAU' FROM puzzle_groups WHERE puzzle_date = '2026-10-21' AND position = 3;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 3, 'VERD' FROM puzzle_groups WHERE puzzle_date = '2026-10-21' AND position = 3;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 4, 'GROC' FROM puzzle_groups WHERE puzzle_date = '2026-10-21' AND position = 3;

INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 1, 'LLAPIS' FROM puzzle_groups WHERE puzzle_date = '2026-10-21' AND position = 4;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 2, 'GOMA' FROM puzzle_groups WHERE puzzle_date = '2026-10-21' AND position = 4;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 3, 'REGLE' FROM puzzle_groups WHERE puzzle_date = '2026-10-21' AND position = 4;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 4, 'RETOLADOR' FROM puzzle_groups WHERE puzzle_date = '2026-10-21' AND position = 4;

-- Paraules del 22 d'octubre
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 1, 'CARXOFA' FROM puzzle_groups WHERE puzzle_date = '2026-10-22' AND position = 1;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 2, 'CARBASSÓ' FROM puzzle_groups WHERE puzzle_date = '2026-10-22' AND position = 1;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 3, 'COLIFLOR' FROM puzzle_groups WHERE puzzle_date = '2026-10-22' AND position = 1;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 4, 'ALBERGÍNIA' FROM puzzle_groups WHERE puzzle_date = '2026-10-22' AND position = 1;

INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 1, 'TECLAT' FROM puzzle_groups WHERE puzzle_date = '2026-10-22' AND position = 2;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 2, 'RATOLÍ' FROM puzzle_groups WHERE puzzle_date = '2026-10-22' AND position = 2;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 3, 'PANTALLA' FROM puzzle_groups WHERE puzzle_date = '2026-10-22' AND position = 2;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 4, 'IMPRESSORA' FROM puzzle_groups WHERE puzzle_date = '2026-10-22' AND position = 2;

INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 1, 'BOIRA' FROM puzzle_groups WHERE puzzle_date = '2026-10-22' AND position = 3;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 2, 'CALAMARSA' FROM puzzle_groups WHERE puzzle_date = '2026-10-22' AND position = 3;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 3, 'VENT' FROM puzzle_groups WHERE puzzle_date = '2026-10-22' AND position = 3;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 4, 'GEBRE' FROM puzzle_groups WHERE puzzle_date = '2026-10-22' AND position = 3;

INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 1, 'ROMBE' FROM puzzle_groups WHERE puzzle_date = '2026-10-22' AND position = 4;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 2, 'TRAPEZI' FROM puzzle_groups WHERE puzzle_date = '2026-10-22' AND position = 4;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 3, 'PENTÀGON' FROM puzzle_groups WHERE puzzle_date = '2026-10-22' AND position = 4;
INSERT INTO puzzle_words (group_id, position, word)
SELECT id, 4, 'HEXÀGON' FROM puzzle_groups WHERE puzzle_date = '2026-10-22' AND position = 4;
