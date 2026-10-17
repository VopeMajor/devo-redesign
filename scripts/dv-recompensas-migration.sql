-- Deadly Vote: recompensa "Arcano" e recompensas individuais (várias para o mesmo participante).
-- Idempotente: pode rodar quantas vezes quiser.

-- 1. O recurso 'arcano' (chave = id do Arcano, quantidade 1) nas recompensas planejadas e nas propostas.
ALTER TABLE deadly_vote_prizes DROP CONSTRAINT IF EXISTS dv_prize_resource_chk;
ALTER TABLE deadly_vote_prizes ADD CONSTRAINT dv_prize_resource_chk CHECK (resource IN ('item', 'tempo', 'carta', 'convite', 'arcano'));
ALTER TABLE deadly_vote_prizes DROP CONSTRAINT IF EXISTS dv_prize_key_chk;
ALTER TABLE deadly_vote_prizes ADD CONSTRAINT dv_prize_key_chk CHECK ((resource IN ('item', 'carta', 'arcano')) = (resource_key IS NOT NULL));

ALTER TABLE reward_proposals DROP CONSTRAINT IF EXISTS reward_resource_chk;
ALTER TABLE reward_proposals ADD CONSTRAINT reward_resource_chk CHECK (resource IN ('item', 'tempo', 'carta', 'convite', 'arcano'));
ALTER TABLE reward_proposals DROP CONSTRAINT IF EXISTS reward_key_chk;
ALTER TABLE reward_proposals ADD CONSTRAINT reward_key_chk CHECK ((resource IN ('item', 'carta', 'arcano')) = (resource_key IS NOT NULL));

-- 2. Recompensas individuais por participante, além da recompensa geral do caso.
CREATE TABLE IF NOT EXISTS deadly_vote_entry_prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_id uuid NOT NULL REFERENCES deadly_votes(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  resource text NOT NULL,
  resource_key text,
  quantity integer NOT NULL CHECK (quantity > 0 AND quantity <= 1000000),
  label text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dv_entry_prize_resource_chk CHECK (resource IN ('item', 'tempo', 'carta', 'convite', 'arcano')),
  CONSTRAINT dv_entry_prize_key_chk CHECK ((resource IN ('item', 'carta', 'arcano')) = (resource_key IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS dv_entry_prizes_vote_idx ON deadly_vote_entry_prizes (vote_id, player_id);
