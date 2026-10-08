-- Dados de teste locais. Nunca rodar no Neon de produção.
INSERT INTO invite_codes (code, role, note) VALUES
  ('DEVO-TEST-ADM1', 'admin',  'teste local: admin'),
  ('DEVO-TEST-0001', 'player', 'teste local'),
  ('DEVO-TEST-0002', 'player', 'teste local'),
  ('DEVO-TEST-0003', 'player', 'teste local'),
  ('DEVO-TEST-0004', 'player', 'teste local')
ON CONFLICT (code) DO NOTHING;

-- Os convites acima geram as contas do roteiro de captura (Veterano, Rival, Aurora). Elas NÃO são
-- contas de teste (is_test = false) para continuarem aparecendo no ranking das capturas.
UPDATE invite_codes SET is_test = false WHERE code LIKE 'DEVO-TEST-%';
-- Convite que gera conta de teste (scripts/test-accounts-migration.sql).
INSERT INTO invite_codes (code, role, note, is_test) VALUES ('DEVO-QA-0001', 'player', 'conta de teste (QA)', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO players (id, name, role) VALUES
  ('00000000-0000-4000-8000-000000000001', 'Corvo',   'player'),
  ('00000000-0000-4000-8000-000000000002', 'Ísis',    'player'),
  ('00000000-0000-4000-8000-000000000003', 'Matheus', 'player'),
  ('00000000-0000-4000-8000-000000000004', 'Nyx',     'player'),
  ('00000000-0000-4000-8000-000000000005', 'Lírio',   'player'),
  ('00000000-0000-4000-8000-000000000006', 'Narrador', 'dealer')
ON CONFLICT DO NOTHING;

-- Conta de teste com pontuação altíssima: se aparecer no ranking (geral ou por jogo), o filtro quebrou.
INSERT INTO players (id, name, role, is_test) VALUES
  ('00000000-0000-4000-8000-000000000007', 'QA_Teste', 'player', true)
ON CONFLICT DO NOTHING;

INSERT INTO arcade_profiles (player_id, chips)
SELECT id, 1000 + (row_number() OVER ())::int * 150 FROM players WHERE id::text LIKE '00000000-0000-4000-8000-%'
ON CONFLICT DO NOTHING;

-- Partidas da semana para o ranking (pontos variados por jogo).
INSERT INTO arcade_matches (player_id, game_id, mode, opponent_name, opponent_rating, seed, started_at, finished_at, result, score, points)
SELECT p.id, g.game, 'casual', 'Rival', 1000, 1, now() - (n || ' hours')::interval, now() - (n || ' hours')::interval + interval '6 minutes',
       CASE WHEN (n + length(p.name)) % 3 = 0 THEN 'loss' WHEN (n + length(p.name)) % 3 = 1 THEN 'win' ELSE 'draw' END,
       200 + ((n * 37 + length(p.name) * 53) % 600), 40 + ((n * 29 + length(p.name) * 17) % 160)
FROM players p
CROSS JOIN (VALUES ('chess'), ('memory-rush'), ('hot-bomb'), ('bluff')) AS g(game)
CROSS JOIN generate_series(1, 4) AS n
WHERE p.role = 'player' AND p.id::text LIKE '00000000-0000-4000-8000-%';

INSERT INTO arcade_matches (player_id, game_id, mode, opponent_name, opponent_rating, seed, started_at, finished_at, result, score, points)
SELECT '00000000-0000-4000-8000-000000000007', g.game, 'casual', 'Rival', 1000, 1, now() - (n || ' hours')::interval,
       now() - (n || ' hours')::interval + interval '6 minutes', 'win', 2500, 9000
FROM (VALUES ('chess'), ('memory-rush'), ('hot-bomb'), ('bluff')) AS g(game)
CROSS JOIN generate_series(1, 3) AS n;

INSERT INTO deadly_votes (title, arc, briefing, status, starts_at, ends_at, max_participants, created_by) VALUES
  ('A Sala Sem Relógio', 'Arco I', 'Doze pessoas. Uma porta. O tempo de todos é um só.', 'concluido', now() - interval '3 days', now() - interval '3 days' + interval '2 hours', 12, '00000000-0000-4000-8000-000000000006'),
  ('Leilão de Sombras', 'Arco I', 'Cada lance custa horas. O último lance custa mais.', 'convocado', now() + interval '1 day', NULL, 10, '00000000-0000-4000-8000-000000000006');

INSERT INTO deadly_vote_entries (vote_id, player_id, outcome)
SELECT v.id, p.id, CASE WHEN p.name IN ('Nyx') THEN 'eliminado' ELSE 'sobreviveu' END
FROM deadly_votes v, players p WHERE v.status = 'concluido' AND p.role = 'player' AND p.id::text LIKE '00000000-0000-4000-8000-%'
ON CONFLICT DO NOTHING;

INSERT INTO arcade_chat (channel, author, player_id, body)
SELECT 'lobby', p.name, p.id, b FROM players p
JOIN (VALUES ('Corvo', 'Alguém aposta contra mim hoje?'), ('Ísis', 'Xadrez de novo? Sábado eu volto.'), ('Nyx', 'Perdi 4 horas no blefe. Não repitam.')) AS m(n, b) ON m.n = p.name;

-- Placar geral da semana (ranking "Geral").
INSERT INTO arcade_week_scores (week_start, player_id, score, wins, games)
SELECT date_trunc('week', now() AT TIME ZONE 'America/Sao_Paulo')::date, m.player_id, sum(m.points)::int,
       count(*) FILTER (WHERE m.result = 'win')::int, count(*)::int
FROM arcade_matches m GROUP BY m.player_id
ON CONFLICT DO NOTHING;
