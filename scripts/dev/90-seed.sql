-- Dados de teste locais. Nunca rodar no Neon de produção.
INSERT INTO invite_codes (code, role, note) VALUES
  ('DEVO-TEST-ADM1', 'owner',  'teste local: owner (antigo admin)'),
  ('DEVO-TEST-0001', 'player', 'teste local'),
  ('DEVO-TEST-0002', 'player', 'teste local'),
  ('DEVO-TEST-0003', 'player', 'teste local'),
  ('DEVO-TEST-0004', 'player', 'teste local'),
  ('DEVO-TEST-0005', 'player', 'teste local'),
  ('DEVO-TEST-0006', 'player', 'teste local'),
  ('DEVO-TEST-0007', 'player', 'teste local'),
  ('DEVO-TEST-0008', 'player', 'teste local'),
  ('DEVO-TEST-0009', 'player', 'teste local')
ON CONFLICT (code) DO NOTHING;

-- Os convites acima geram as contas do roteiro de captura (Veterano, Rival, Aurora). Elas NÃO são
-- contas de teste (is_test = false) para continuarem aparecendo no ranking das capturas.
UPDATE invite_codes SET is_test = false WHERE code LIKE 'DEVO-TEST-%';
-- Convite que gera conta de teste (scripts/test-accounts-migration.sql).
INSERT INTO invite_codes (code, role, note, is_test) VALUES ('DEVO-QA-0001', 'player', 'conta de teste (QA)', true)
ON CONFLICT (code) DO NOTHING;

-- Fundação (scripts/fundacao-migration.sql): uma conta de cada cargo. 'Sentinela' é Owner (nunca aparece
-- como Owner em payload público), 'Mordomo' é Anfitrião e supervisiona o Dealer 'Narrador'.
INSERT INTO players (id, name, role) VALUES
  ('00000000-0000-4000-8000-000000000010', 'Sentinela', 'owner'),
  ('00000000-0000-4000-8000-000000000011', 'Mordomo',   'anfitriao')
ON CONFLICT DO NOTHING;
INSERT INTO players (id, name, role, supervisor_id) VALUES
  ('00000000-0000-4000-8000-000000000006', 'Narrador', 'dealer', '00000000-0000-4000-8000-000000000011')
ON CONFLICT DO NOTHING;

INSERT INTO players (id, name, role) VALUES
  ('00000000-0000-4000-8000-000000000001', 'Corvo',   'player'),
  ('00000000-0000-4000-8000-000000000002', 'Ísis',    'player'),
  ('00000000-0000-4000-8000-000000000003', 'Matheus', 'player'),
  ('00000000-0000-4000-8000-000000000004', 'Nyx',     'player'),
  ('00000000-0000-4000-8000-000000000005', 'Lírio',   'player')
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

-- Deadly Votes cobrindo os cinco estados (Direção 2 §4): não iniciado (convocado), em andamento,
-- encerrado (concluído), cancelado e falha. Links de grupo fictícios (formato do WhatsApp).
INSERT INTO deadly_votes (title, arc, briefing, status, starts_at, ends_at, max_participants, created_by, whatsapp_url, updated_at) VALUES
  ('A Sala Sem Relógio', 'Arco I', 'Doze pessoas. Uma porta. O tempo de todos é um só.', 'concluido', now() - interval '3 days', now() - interval '3 days' + interval '2 hours', 12, '00000000-0000-4000-8000-000000000006', NULL, now() - interval '3 days'),
  ('Leilão de Sombras', 'Arco I', 'Cada lance custa horas. O último lance custa mais.', 'convocado', now() + interval '1 day', NULL, 10, '00000000-0000-4000-8000-000000000006', NULL, now()),
  ('Baile dos Ponteiros', 'Arco II', 'A valsa só termina quando o relógio parar. Ninguém sai do salão antes do último compasso.', 'em-progresso', now() - interval '2 hours', NULL, 8, '00000000-0000-4000-8000-000000000006', 'https://chat.whatsapp.com/DevoTesteBaile0001', now() - interval '2 hours'),
  ('Jantar de Prata', 'Arco II', 'Talheres de prata, um lugar vazio à mesa e um voto por prato.', 'cancelado', now() - interval '5 days', now() - interval '5 days', 6, '00000000-0000-4000-8000-000000000006', NULL, now() - interval '5 days'),
  ('Torre Invertida', 'Arco I', 'O andar de cima é o de baixo. A contagem caiu no meio da subida.', 'falha', now() - interval '8 days', now() - interval '8 days' + interval '40 minutes', 10, '00000000-0000-4000-8000-000000000006', NULL, now() - interval '8 days'),
  ('O Primeiro Voto', 'Prólogo', 'O tribunal abriu as portas pela primeira vez.', 'concluido', now() - interval '12 days', now() - interval '12 days' + interval '3 hours', 12, '00000000-0000-4000-8000-000000000006', NULL, now() - interval '12 days');

INSERT INTO deadly_vote_entries (vote_id, player_id, outcome)
SELECT v.id, p.id, CASE WHEN p.name IN ('Nyx') THEN 'eliminado' ELSE 'sobreviveu' END
FROM deadly_votes v, players p WHERE v.status = 'concluido' AND p.role = 'player' AND p.id::text LIKE '00000000-0000-4000-8000-%'
ON CONFLICT DO NOTHING;

-- Inscritos sem resultado no caso em andamento e nos casos interrompidos.
INSERT INTO deadly_vote_entries (vote_id, player_id)
SELECT v.id, p.id FROM deadly_votes v, players p
WHERE v.status IN ('em-progresso', 'cancelado', 'falha') AND p.name IN ('Corvo', 'Ísis', 'Lírio')
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

-- Confronto aberto para apostas (Sala de Jogos): evento com inscrições fechadas e começo em 3h
-- (status LOCKED → apostas abertas), já travado, com dois duelos entre jogadores seed.
WITH ev AS (
  INSERT INTO arcade_events (game_id, label, starts_at, registration_opens_at, registration_closes_at, ends_at, max_players, reward, rules, locked_at)
  VALUES ('chess', 'Duelo da Casa', now() + interval '3 hours', now() - interval '1 day', now() - interval '10 minutes',
          now() + interval '5 hours', 4, '{"hours": 2}'::jsonb, 'Exibição da casa: dois duelos de Living Chess. Apostas abertas até o começo.', now())
  RETURNING id
), ent AS (
  INSERT INTO arcade_entries (event_id, name, player_id, rating)
  SELECT ev.id, p.name, p.id, r FROM ev, players p
  JOIN (VALUES ('Ísis', 1180), ('Nyx', 1120), ('Corvo', 1060), ('Lírio', 1000)) AS x(n, r) ON x.n = p.name
  RETURNING event_id
)
INSERT INTO arcade_duels (event_id, slot, a_name, b_name, a_rating, b_rating)
SELECT ev.id, d.slot, d.a, d.b, d.ra, d.rb FROM ev,
  (VALUES (0, 'Ísis', 'Nyx', 1180, 1120), (1, 'Corvo', 'Lírio', 1060, 1000)) AS d(slot, a, b, ra, rb);

-- Nome do personagem (scripts/character-name-migration.sql): contas do seed usam o nome da conta.
UPDATE players SET character_name = name WHERE character_name IS NULL;

-- ---------------------------------------------------------------------------------------------
-- Fundação: convites do teste de servidor (scripts/dev/fundacao-test.mjs). Contas de teste (fora do ranking).
INSERT INTO invite_codes (code, role, note, is_test) VALUES
  ('DEVO-FUND-OWNR', 'owner',     'teste fundação: owner', true),
  ('DEVO-FUND-ANF1', 'anfitriao', 'teste fundação: anfitrião', true),
  ('DEVO-FUND-ANF2', 'anfitriao', 'teste fundação: anfitrião 2', true),
  ('DEVO-FUND-JOG1', 'player',    'teste fundação: jogador', true),
  ('DEVO-FUND-JOG2', 'player',    'teste fundação: jogador 2', true)
ON CONFLICT (code) DO NOTHING;

-- 'O Primeiro Voto' é o Deadly Vote tutorial do seed: quem sobreviveu ganha as flags (gatilho do banco).
UPDATE deadly_votes SET is_tutorial = true WHERE title = 'O Primeiro Voto';
-- Gatilho de entrada: reaplica para as entradas já gravadas (idempotente).
SELECT devo_dv_desbloquear(id) FROM deadly_votes WHERE is_tutorial;

-- Itens de exemplo do catálogo (só no banco de teste): chave de torre, cápsula, cosmético.
INSERT INTO item_defs (key, kind, name, description, rarity, stackable, meta) VALUES
  ('chave:torre-exemplo', 'chave', 'Chave da Torre de Exemplo', 'Item de teste.', 'incomum', true, '{"torre": "exemplo"}'),
  ('capsula:exemplo-001', 'capsula', 'Cápsula do Tempo nº 001', 'Item de teste: uma curiosidade do mundo.', 'raro', false, '{"texto": "O relógio da catedral parou às 3h17."}'),
  ('cosmetico:moldura-exemplo', 'cosmetico', 'Moldura de Exemplo', 'Item de teste.', 'epico', false, '{"categoria": "moldura_avatar"}')
ON CONFLICT (key) DO NOTHING;

-- Inventário de exemplo para 'Lírio' (sobrevivente do tutorial).
SELECT devo_item_grant('00000000-0000-4000-8000-000000000005', k, q, 'seed', NULL, NULL, 'seed:lirio:' || k)
FROM (VALUES ('dracma_comum', 5), ('dracma_incomum', 1), ('essencia:galo', 3), ('fragmento_arcano', 2),
             ('chave:torre-exemplo', 1), ('capsula:exemplo-001', 1), ('cosmetico:moldura-exemplo', 1)) AS x(k, q);
SELECT devo_karma_ajustar('00000000-0000-4000-8000-000000000005', 7, 'seed', NULL, NULL, 'seed:lirio:karma');

-- Uma proposta pendente do Dealer (Narrador) para o Anfitrião (Mordomo) aprovar.
INSERT INTO reward_proposals (kind, vote_id, origin, recipient_id, resource, resource_key, quantity, justification, proposed_by)
SELECT 'evento', v.id, 'Deadly Vote #' || v.number || ' · ' || v.title, '00000000-0000-4000-8000-000000000002', 'item', 'dracma_comum', 3,
       'Sobreviveu até o fim da sala.', '00000000-0000-4000-8000-000000000006'
FROM deadly_votes v WHERE v.title = 'A Sala Sem Relógio'
  AND NOT EXISTS (SELECT 1 FROM reward_proposals r WHERE r.vote_id = v.id);

-- ---------------------------------------------------------------------------------------------
-- Staff e Deadly Vote (scripts/staff-migration.sql).
-- Convites que ligam as contas do seed a um login (cookie devo_player = id do seed; ver capture.mjs, grupo
-- 'staff'): Sentinela (Owner), Mordomo (Anfitrião), Narrador (Dealer) e Matheus (jogador comum).
INSERT INTO invite_codes (code, role, note) VALUES
  ('DEVO-STAF-SENT', 'player', 'capturas staff: liga Sentinela'),
  ('DEVO-STAF-MORD', 'player', 'capturas staff: liga Mordomo'),
  ('DEVO-STAF-NARR', 'player', 'capturas staff: liga Narrador'),
  ('DEVO-STAF-MATH', 'player', 'capturas staff: liga Matheus')
ON CONFLICT (code) DO NOTHING;
-- Teste de servidor do Staff (scripts/dev/staff-test.mjs). Contas de teste.
INSERT INTO invite_codes (code, role, note, is_test) VALUES
  ('DEVO-STFT-OWNR', 'owner',     'teste staff: owner', true),
  ('DEVO-STFT-ANF1', 'anfitriao', 'teste staff: anfitrião', true),
  ('DEVO-STFT-JOG1', 'player',    'teste staff: jogador 1', true),
  ('DEVO-STFT-JOG2', 'player',    'teste staff: jogador 2', true),
  ('DEVO-STFT-JOG3', 'player',    'teste staff: jogador 3', true)
ON CONFLICT (code) DO NOTHING;

-- 'Leilão de Sombras' (convocado, do Narrador): inscrição com aprovação, local, recompensas privadas e
-- inscrições à espera (Matheus e Ísis) ao lado de uma aceita (Corvo).
UPDATE deadly_votes SET admission = 'aprovacao', location = 'Salão de leilões · grupo do WhatsApp' WHERE title = 'Leilão de Sombras';
INSERT INTO deadly_vote_prizes (vote_id, resource, resource_key, quantity, label, position)
SELECT v.id, x.r, x.k, x.q, x.l, x.p FROM deadly_votes v,
  (VALUES ('item', 'dracma_comum', 3, 'último lance', 0), ('tempo', NULL, 120, NULL, 1)) AS x(r, k, q, l, p)
WHERE v.title = 'Leilão de Sombras' AND NOT EXISTS (SELECT 1 FROM deadly_vote_prizes z WHERE z.vote_id = v.id);
INSERT INTO deadly_vote_entries (vote_id, player_id, admission)
SELECT v.id, p.id, CASE WHEN p.name = 'Corvo' THEN 'aceita' ELSE 'pendente' END
FROM deadly_votes v, players p WHERE v.title = 'Leilão de Sombras' AND p.name IN ('Corvo', 'Ísis', 'Matheus')
ON CONFLICT DO NOTHING;

-- 'A Sala Sem Relógio' (concluído, do Narrador): resultado por participante pela metade, ainda não aplicado.
UPDATE deadly_votes SET location = 'Sala sem janelas · subsolo' WHERE title = 'A Sala Sem Relógio';
INSERT INTO deadly_vote_prizes (vote_id, resource, resource_key, quantity, label, position)
SELECT v.id, 'item', 'dracma_comum', 2, 'sobrevivente', 0 FROM deadly_votes v
WHERE v.title = 'A Sala Sem Relógio' AND NOT EXISTS (SELECT 1 FROM deadly_vote_prizes z WHERE z.vote_id = v.id);
UPDATE deadly_vote_entries e SET decision = CASE p.name WHEN 'Nyx' THEN 'morreu' ELSE 'premio' END
FROM players p, deadly_votes v
WHERE p.id = e.player_id AND v.id = e.vote_id AND v.title = 'A Sala Sem Relógio' AND p.name IN ('Lírio', 'Corvo', 'Nyx');
