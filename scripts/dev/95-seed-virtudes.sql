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

-- Exemplos para a Mesa: Lírio (Arcano da Morte, Estágio I, P.P. acumulando) e Ísis (Arcano do Imperador,
-- Estágio II, com uma Evolução no histórico).
UPDATE players SET arcano = 'morte' WHERE id = '00000000-0000-4000-8000-000000000005' AND arcano IS NULL;
SELECT devo_virtude_pp_add('00000000-0000-4000-8000-000000000005', v, q, 'seed', NULL, NULL, 'seed:lirio:pp:' || v)
FROM (VALUES ('tacas', 14), ('ouros', 9), ('paus', 4), ('espadas', 6)) AS x(v, q);

UPDATE players SET arcano = 'imperador', arcano_estagio = 2 WHERE id = '00000000-0000-4000-8000-000000000002' AND arcano IS NULL;
INSERT INTO virtude_evolucoes (player_id, arcano, de_estagio, para_estagio, total, acumulado, ganhos, at)
SELECT '00000000-0000-4000-8000-000000000002', 'imperador', 1, 2, 48,
       '{"paus": 8, "copas": 6, "ouros": 4, "espadas": 10, "tacas": 6, "escudos": 14}',
       '{"paus": 4.63, "copas": 3.3, "ouros": 0.84, "espadas": 7.58, "tacas": 10.47, "escudos": 21.18}', now() - interval '9 days'
WHERE NOT EXISTS (SELECT 1 FROM virtude_evolucoes WHERE player_id = '00000000-0000-4000-8000-000000000002');
INSERT INTO virtude_nivel (player_id, virtude, valor)
SELECT '00000000-0000-4000-8000-000000000002', key, value::numeric
FROM jsonb_each_text('{"paus": 4.63, "copas": 3.3, "ouros": 0.84, "espadas": 7.58, "tacas": 10.47, "escudos": 21.18}')
ON CONFLICT DO NOTHING;
SELECT devo_virtude_pp_add('00000000-0000-4000-8000-000000000002', 'escudos', 12, 'seed', NULL, NULL, 'seed:isis:pp');
