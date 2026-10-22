-- Virtudes: dados de teste (só no banco de teste; nunca no Neon de produção).
-- Convites das capturas (grupo `virtudes` do scripts/dev/capture.mjs) e do teste de servidor
-- (scripts/dev/virtudes-test.mjs). Contas de teste: fora do ranking.
INSERT INTO invite_codes (code, role, note, is_test) VALUES
  ('DEVO-VIRT-CAP1', 'player', 'capturas virtudes: jogador trancado', true),
  ('DEVO-VIRT-CAP2', 'player', 'capturas virtudes: Arcano da Morte', true),
  ('DEVO-VIRT-CAP3', 'player', 'capturas virtudes: outro Arcano', true),
  ('DEVO-VIRT-TST1', 'player', 'teste virtudes: jogador', true),
  ('DEVO-VIRT-TST2', 'player', 'teste virtudes: jogador trancado', true),
  ('DEVO-VIRT-OWN1', 'owner', 'teste virtudes: owner', true),
  ('DEVO-VIRT-ANF1', 'anfitriao', 'teste virtudes: anfitrião (textos dos Arcanos)', true)
ON CONFLICT (code) DO NOTHING;

-- Exemplos para a Mesa: Lírio (Arcano da Morte, Estágio 0, P.P. acumulando, Fragmentos para o Estágio I e um
-- Grande Fragmento Arcano para despertar outro) e Ísis (Arcano do Imperador, Estágio I, com uma Evolução no
-- histórico, e o Arcano da Lua despertado). Estágios 0..VII (scripts/arcanos-estagios-migration.sql).
UPDATE players SET arcano = 'morte' WHERE id = '00000000-0000-4000-8000-000000000005' AND arcano IS NULL;
SELECT devo_virtude_pp_add('00000000-0000-4000-8000-000000000005', v, q, 'seed', NULL, NULL, 'seed:lirio:pp:' || v)
FROM (VALUES ('tacas', 14), ('ouros', 9), ('paus', 4), ('espadas', 6)) AS x(v, q);

UPDATE players SET arcano = 'imperador', arcano_estagio = 1 WHERE id = '00000000-0000-4000-8000-000000000002' AND arcano IS NULL;
INSERT INTO virtude_evolucoes (player_id, arcano, de_estagio, para_estagio, total, acumulado, ganhos, at)
SELECT '00000000-0000-4000-8000-000000000002', 'imperador', 0, 1, 48,
       '{"paus": 8, "copas": 6, "ouros": 4, "espadas": 10, "tacas": 6, "escudos": 14}',
       '{"paus": 4.63, "copas": 3.3, "ouros": 0.84, "espadas": 7.58, "tacas": 10.47, "escudos": 21.18}', now() - interval '9 days'
WHERE NOT EXISTS (SELECT 1 FROM virtude_evolucoes WHERE player_id = '00000000-0000-4000-8000-000000000002');
INSERT INTO virtude_nivel (player_id, virtude, valor)
SELECT '00000000-0000-4000-8000-000000000002', key, value::numeric
FROM jsonb_each_text('{"paus": 4.63, "copas": 3.3, "ouros": 0.84, "espadas": 7.58, "tacas": 10.47, "escudos": 21.18}')
ON CONFLICT DO NOTHING;
SELECT devo_virtude_pp_add('00000000-0000-4000-8000-000000000002', 'escudos', 12, 'seed', NULL, NULL, 'seed:isis:pp');

-- Arcanos de cada um (o original espelha players.arcano/arcano_estagio) e saldos de Fragmentos.
INSERT INTO player_arcanos (player_id, arcano, estagio, original, origem)
SELECT id, arcano, arcano_estagio, true, 'registro' FROM players
 WHERE id IN ('00000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000002') AND arcano IS NOT NULL
ON CONFLICT (player_id, arcano) DO NOTHING;
INSERT INTO player_arcanos (player_id, arcano, estagio, original, origem)
VALUES ('00000000-0000-4000-8000-000000000002', 'lua', 0, false, 'grande_fragmento')
ON CONFLICT (player_id, arcano) DO NOTHING;
SELECT devo_item_grant('00000000-0000-4000-8000-000000000005', 'fragmento_arcano', 30, 'seed', NULL, NULL, 'seed:lirio:fragmentos');
SELECT devo_item_grant('00000000-0000-4000-8000-000000000005', 'grande_fragmento_arcano', 1, 'seed', NULL, NULL, 'seed:lirio:grande');
