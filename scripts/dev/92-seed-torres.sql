-- Torres de Ruptura: dados de teste (só no banco de teste; nunca no Neon de produção).
-- Convites das capturas (grupo `torres` do scripts/dev/capture.mjs) e do teste de servidor
-- (scripts/dev/torres-test.mjs). Contas de teste: fora do ranking.
INSERT INTO invite_codes (code, role, note, is_test) VALUES
  ('DEVO-TORR-CAP1', 'player', 'capturas torres: jogador trancado', true),
  ('DEVO-TORR-CAP2', 'player', 'capturas torres: jogador liberado', true),
  ('DEVO-TORR-TST1', 'player', 'teste torres: jogador', true),
  ('DEVO-TORR-TST2', 'player', 'teste torres: jogador trancado', true)
ON CONFLICT (code) DO NOTHING;

-- Exemplo para o painel/inventário: 'Lírio' (sobrevivente do tutorial do seed) com essências das secundárias.
SELECT devo_item_grant('00000000-0000-4000-8000-000000000005', k, q, 'seed', NULL, NULL, 'seed:lirio:torres:' || k)
FROM (VALUES ('essencia:coruja', 3), ('essencia:javali', 1)) AS x(k, q);
