-- Narrativa (teste local/CI): convites das contas do grupo de captura `narrativa` e do teste de servidor.
-- Contas de teste (fora do ranking). Nunca rodar no Neon de produção.
INSERT INTO invite_codes (code, role, note, is_test) VALUES
  ('DEVO-NARR-0001', 'player', 'narrativa: jogador com o tutorial vencido (capturas)', true),
  ('DEVO-NARR-0002', 'player', 'narrativa: jogador sem tutorial (capturas, ícones trancados)', true),
  ('DEVO-NARR-0003', 'player', 'narrativa: teste de servidor', true),
  ('DEVO-NARR-0004', 'player', 'narrativa: teste de servidor (sem flag)', true)
ON CONFLICT (code) DO NOTHING;
