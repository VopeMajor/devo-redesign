-- Seed de teste do Calendário (só CI/local; depende de 90-seed.sql e calendario-migration.sql).
-- Convites das capturas e do teste de servidor (contas de teste):
--   DEVO-CAL-0001 → 'Calendula'  (primeira entrada: tutorial da Melissa, check-in do Dia 1 e revelação)
--   DEVO-CAL-0002 → 'Assidua'    (o roteiro grava 3 dias de histórico: Dia 4 de hoje, carimbos)
--   DEVO-CAL-0003…0012 → livres para o teste de servidor (scripts/dev/calendario-test.mjs)
INSERT INTO invite_codes (code, role, note, is_test) VALUES
  ('DEVO-CAL-0001', 'player', 'capturas do calendário: primeira entrada', true),
  ('DEVO-CAL-0002', 'player', 'capturas do calendário: assídua', true),
  ('DEVO-CAL-0003', 'player', 'calendário: teste', true),
  ('DEVO-CAL-0004', 'player', 'calendário: teste', true),
  ('DEVO-CAL-0005', 'player', 'calendário: teste', true),
  ('DEVO-CAL-0006', 'player', 'calendário: teste', true),
  ('DEVO-CAL-0007', 'player', 'calendário: teste', true),
  ('DEVO-CAL-0008', 'player', 'calendário: teste', true),
  ('DEVO-CAL-0009', 'player', 'calendário: teste', true),
  ('DEVO-CAL-0010', 'player', 'calendário: teste', true),
  ('DEVO-CAL-0011', 'player', 'calendário: teste', true),
  ('DEVO-CAL-0012', 'player', 'calendário: teste', true)
ON CONFLICT (code) DO NOTHING;

-- Um evento acontecendo HOJE (Brasília) com check-in próprio, para as capturas mostrarem o cartão extra.
INSERT INTO calendario_eventos (slug, titulo, descricao, inicio, fim, anual, enfase, arte, checkin, criado_por)
SELECT 'dev-noite-dos-arcanos', 'Noite dos Arcanos', 'As cartas antigas saem das gavetas. Um check-in a mais enquanto durar.',
       d, d + 1, false, 'atencao', '/images/cards-spread.png',
       '{"titulo": "Check-in dos Arcanos", "recompensas": [{"tipo": "tempo", "minutos": 30}, {"tipo": "item", "item": "fragmento_arcano", "quantidade": 1}]}'::jsonb,
       '00000000-0000-4000-8000-000000000010'
  FROM (SELECT (now() AT TIME ZONE 'America/Sao_Paulo')::date AS d) h
ON CONFLICT (slug) DO NOTHING;

-- Um evento de "fique atento" daqui a alguns dias (lista de próximos e marcação no mês).
INSERT INTO calendario_eventos (slug, titulo, descricao, inicio, fim, anual, enfase, criado_por)
SELECT 'dev-leilao-de-sombras', 'Leilão de Sombras', 'Edição especial do Salão das Máscaras. Lances só até a meia-noite.',
       d + 5, d + 5, false, 'atencao', '00000000-0000-4000-8000-000000000010'
  FROM (SELECT (now() AT TIME ZONE 'America/Sao_Paulo')::date AS d) h
ON CONFLICT (slug) DO NOTHING;

-- No ambiente de teste, o Halloween e o Natal ganham check-in próprio (no banco novo eles nascem sem recompensa).
UPDATE calendario_eventos SET checkin = '{"titulo": "Check-in de Halloween", "recompensas": [{"tipo": "item", "item": "dracma_incomum", "quantidade": 1}]}'::jsonb
 WHERE slug = 'halloween' AND checkin IS NULL;
UPDATE calendario_eventos SET checkin = '{"titulo": "Check-in de Natal", "recompensas": [{"tipo": "carta", "raridade": "rara"}]}'::jsonb
 WHERE slug = 'natal' AND checkin IS NULL;

-- Histórico de exemplo (Lírio …05): dois dias do ciclo, para a Mesa não ficar vazia.
INSERT INTO calendario_checkins (player_id, dia, tipo, posicao, recompensa)
SELECT '00000000-0000-4000-8000-000000000005', d - k, 'diario', 3 - k, r
  FROM (SELECT (now() AT TIME ZONE 'America/Sao_Paulo')::date AS d) h,
       (VALUES (2, '{"tipo": "pp", "quantidade": 50}'::jsonb), (1, '{"tipo": "pp", "quantidade": 75}'::jsonb)) v(k, r)
ON CONFLICT DO NOTHING;
