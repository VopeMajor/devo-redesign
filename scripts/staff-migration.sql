-- Staff e Deadly Vote (DIRECAO-3 §3 e §4). Idempotente. Rodar DEPOIS de scripts/fundacao-migration.sql.
--
-- Acrescenta ao Deadly Vote:
--   * local (campo do dono) e o modo de inscrição ('livre' = entra direto; 'aprovacao' = o dono do DV aceita);
--   * recompensas planejadas (deadly_vote_prizes) — PRIVADAS: nunca saem no payload do jogador;
--   * por inscrito: situação da inscrição (pendente/aceita/recusada) e a decisão pós-conclusão
--     (premio/morreu/ausente/outro), aplicada aos perfis UMA vez (results_applied_at).
-- A aplicação cria propostas de recompensa 'evento' pelo fluxo da Fundação (Dealer propõe → Anfitrião/Owner
-- aprova → entrega idempotente) e grava o resultado público (sobreviveu/eliminado), o que dispara o
-- desbloqueio do Deadly Vote tutorial (gatilhos da Fundação).

ALTER TABLE deadly_votes ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE deadly_votes ADD COLUMN IF NOT EXISTS admission text NOT NULL DEFAULT 'livre';
ALTER TABLE deadly_votes ADD COLUMN IF NOT EXISTS results_applied_at timestamptz;
ALTER TABLE deadly_votes ADD COLUMN IF NOT EXISTS results_applied_by uuid REFERENCES players(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deadly_votes_admission_chk') THEN
    ALTER TABLE deadly_votes ADD CONSTRAINT deadly_votes_admission_chk CHECK (admission IN ('livre', 'aprovacao'));
  END IF;
END $$;

ALTER TABLE deadly_vote_entries ADD COLUMN IF NOT EXISTS admission text NOT NULL DEFAULT 'aceita';
ALTER TABLE deadly_vote_entries ADD COLUMN IF NOT EXISTS decision text;
ALTER TABLE deadly_vote_entries ADD COLUMN IF NOT EXISTS decided_by uuid REFERENCES players(id) ON DELETE SET NULL;
ALTER TABLE deadly_vote_entries ADD COLUMN IF NOT EXISTS decided_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deadly_vote_entries_admission_chk') THEN
    ALTER TABLE deadly_vote_entries ADD CONSTRAINT deadly_vote_entries_admission_chk CHECK (admission IN ('pendente', 'aceita', 'recusada'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deadly_vote_entries_decision_chk') THEN
    ALTER TABLE deadly_vote_entries ADD CONSTRAINT deadly_vote_entries_decision_chk CHECK (decision IS NULL OR decision IN ('premio', 'morreu', 'ausente', 'outro'));
  END IF;
END $$;

-- Recompensas planejadas do Deadly Vote (privadas ao jogador). Mesmo formato do recurso das propostas.
CREATE TABLE IF NOT EXISTS deadly_vote_prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_id uuid NOT NULL REFERENCES deadly_votes(id) ON DELETE CASCADE,
  -- 'item' (resource_key = item_defs.key), 'tempo' (minutos), 'carta' (id da carta), 'convite'
  resource text NOT NULL,
  resource_key text,
  quantity integer NOT NULL,
  label text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dv_prize_resource_chk CHECK (resource IN ('item', 'tempo', 'carta', 'convite')),
  CONSTRAINT dv_prize_key_chk CHECK ((resource IN ('item', 'carta')) = (resource_key IS NOT NULL)),
  CONSTRAINT dv_prize_qty_chk CHECK (quantity > 0 AND quantity <= 1000000)
);
CREATE INDEX IF NOT EXISTS deadly_vote_prizes_vote_idx ON deadly_vote_prizes (vote_id, position);

-- Uma proposta por (voto, inscrito, prêmio planejado): a aplicação nunca duplica, nem em corrida.
ALTER TABLE reward_proposals ADD COLUMN IF NOT EXISTS prize_id uuid REFERENCES deadly_vote_prizes(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS reward_proposals_prize_uniq ON reward_proposals (prize_id, recipient_id) WHERE prize_id IS NOT NULL;

-- Depois de aplicado aos perfis, o resultado fica selado: decisão, resultado e estado do voto não mudam mais.
CREATE OR REPLACE FUNCTION devo_dv_entry_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE applied timestamptz;
BEGIN
  SELECT results_applied_at INTO applied FROM deadly_votes WHERE id = NEW.vote_id;
  IF applied IS NOT NULL AND (NEW.decision IS DISTINCT FROM OLD.decision OR NEW.outcome IS DISTINCT FROM OLD.outcome
                              OR NEW.admission IS DISTINCT FROM OLD.admission) THEN
    RAISE EXCEPTION 'RESULTADO_APLICADO' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS deadly_vote_entries_guard ON deadly_vote_entries;
CREATE TRIGGER deadly_vote_entries_guard BEFORE UPDATE ON deadly_vote_entries
  FOR EACH ROW EXECUTE FUNCTION devo_dv_entry_guard();

CREATE OR REPLACE FUNCTION devo_dv_vote_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.results_applied_at IS NOT NULL THEN
    IF NEW.status IS DISTINCT FROM OLD.status OR NEW.results_applied_at IS DISTINCT FROM OLD.results_applied_at THEN
      RAISE EXCEPTION 'RESULTADO_APLICADO' USING ERRCODE = '23514';
    END IF;
  ELSIF NEW.results_applied_at IS NOT NULL AND NEW.status <> 'concluido' THEN
    RAISE EXCEPTION 'APLICAR_SO_CONCLUIDO' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS deadly_votes_guard ON deadly_votes;
CREATE TRIGGER deadly_votes_guard BEFORE UPDATE ON deadly_votes
  FOR EACH ROW EXECUTE FUNCTION devo_dv_vote_guard();
