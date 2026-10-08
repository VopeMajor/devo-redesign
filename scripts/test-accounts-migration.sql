-- Contas de teste: marca persistente que tira a conta de rankings, apostas/odds, prêmios e destaques.
-- Idempotente. Rodar uma vez no Neon (depois de auth-migration.sql) e no banco de teste do CI.
--
-- Como funciona:
--   * players.is_test        → a conta é de teste (fica fora de ranking geral e por jogo, apostas, prêmios e destaques).
--   * invite_codes.is_test   → quem se cadastra com esse convite já nasce como conta de teste.
--
-- Marcar uma conta existente como teste (pelo nome, sem diferenciar maiúsculas):
--   UPDATE players SET is_test = true WHERE lower(name) = lower('NomeDaConta');
-- Desmarcar:
--   UPDATE players SET is_test = false WHERE lower(name) = lower('NomeDaConta');
-- Criar um convite que gera conta de teste:
--   INSERT INTO invite_codes (code, role, note, is_test) VALUES ('DEVO-QA-0001', 'player', 'conta de teste', true);
-- Listar contas de teste:
--   SELECT id, name, role, created_at FROM players WHERE is_test ORDER BY created_at;

ALTER TABLE players ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
ALTER TABLE invite_codes ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS players_is_test_idx ON players (id) WHERE is_test;

-- Contas que já usaram um convite marcado como teste herdam a marca.
UPDATE players p SET is_test = true
FROM invite_codes i
WHERE i.is_test AND i.used_by_user IS NOT NULL AND p.user_id::text = i.used_by_user AND NOT p.is_test;
