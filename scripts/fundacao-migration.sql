-- Fundação (DIRECAO-3 §3 e §1b): cargos, supervisor de Dealer, log administrativo, inventário genérico,
-- recompensas com aprovação, desbloqueios por jogador, Karma, cota de convites, entregas de cartas,
-- autorizações de staff e configuração editável pelo Owner.
--
-- Idempotente: pode rodar quantas vezes quiser. Rodar no Neon DEPOIS de todas as outras migrações
-- (precisa de players, invite_codes, deadly_votes, deadly_vote_entries e arcade_profiles).
-- Contrato para os outros agentes: docs/redesign/FUNDACAO.md.
--
-- Cargos (players.role / invite_codes.role):
--   'owner'     → acesso global. NUNCA aparece em payload público (perfil, ranking, chat, listas).
--   'anfitriao' → supervisão (pode ser público).
--   'dealer'    → operação; supervisor_id obrigatório (Anfitrião ou Owner).
--   'player'    → Jogador (o valor no banco continua 'player' por compatibilidade).
-- O antigo 'admin' vira 'owner'.

-- ---------------------------------------------------------------------------------------------
-- 0. Ator da transação: o servidor faz SELECT set_config('devo.actor', '<uuid>', true) no começo da
--    transação; os gatilhos de log leem daqui quem fez a alteração.
-- ---------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION devo_actor() RETURNS uuid
LANGUAGE plpgsql STABLE AS $$
DECLARE v text := current_setting('devo.actor', true);
BEGIN
  IF v IS NULL OR v !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN RETURN NULL; END IF;
  RETURN v::uuid;
END $$;

-- ---------------------------------------------------------------------------------------------
-- 1. Cargos
-- ---------------------------------------------------------------------------------------------
UPDATE players SET role = 'owner' WHERE role = 'admin';
UPDATE players SET role = 'player' WHERE role NOT IN ('owner', 'anfitriao', 'dealer', 'player');
UPDATE invite_codes SET role = 'owner' WHERE role = 'admin';
UPDATE invite_codes SET role = 'player' WHERE role NOT IN ('owner', 'anfitriao', 'dealer', 'player');

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'players_role_chk') THEN
    ALTER TABLE players ADD CONSTRAINT players_role_chk CHECK (role IN ('owner', 'anfitriao', 'dealer', 'player'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invite_codes_role_chk') THEN
    ALTER TABLE invite_codes ADD CONSTRAINT invite_codes_role_chk CHECK (role IN ('owner', 'anfitriao', 'dealer', 'player'));
  END IF;
END $$;

ALTER TABLE players ADD COLUMN IF NOT EXISTS supervisor_id uuid REFERENCES players(id) ON DELETE RESTRICT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS karma integer NOT NULL DEFAULT 0;
-- Convite de Dealer já nasce com o supervisor (o Anfitrião que gerou, ou o escolhido pelo Owner).
ALTER TABLE invite_codes ADD COLUMN IF NOT EXISTS supervisor_id uuid REFERENCES players(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS players_supervisor_idx ON players (supervisor_id) WHERE supervisor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS players_role_idx ON players (role) WHERE role <> 'player';

-- Log administrativo único (cargos, transferências, concessões, overrides, karma manual, configuração).
CREATE TABLE IF NOT EXISTS admin_log (
  id bigserial PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid REFERENCES players(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_id uuid REFERENCES players(id) ON DELETE SET NULL,
  ref text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS admin_log_target_idx ON admin_log (target_id, at DESC);
CREATE INDEX IF NOT EXISTS admin_log_action_idx ON admin_log (action, at DESC);

-- Histórico de supervisão: um período por (dealer, supervisor). Transferir fecha o período aberto e abre outro;
-- nada é apagado, então solicitações antigas continuam apontando para o supervisor original.
CREATE TABLE IF NOT EXISTS dealer_supervisions (
  id bigserial PRIMARY KEY,
  dealer_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  supervisor_id uuid REFERENCES players(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  assigned_by uuid REFERENCES players(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS dealer_supervisions_open_idx ON dealer_supervisions (dealer_id) WHERE ended_at IS NULL;

-- Dealers antigos sem supervisor ficam sob o Owner mais antigo (o Owner transfere depois para um Anfitrião).
UPDATE players SET supervisor_id = (SELECT o.id FROM players o WHERE o.role = 'owner' ORDER BY o.created_at LIMIT 1)
 WHERE role = 'dealer' AND supervisor_id IS NULL;
INSERT INTO dealer_supervisions (dealer_id, supervisor_id)
SELECT p.id, p.supervisor_id FROM players p
 WHERE p.role = 'dealer' AND p.supervisor_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM dealer_supervisions s WHERE s.dealer_id = p.id AND s.ended_at IS NULL);

-- Regras de cargo validadas no banco (defesa em profundidade; o servidor já valida com can()).
CREATE OR REPLACE FUNCTION devo_players_cargo_chk() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.role IS NOT DISTINCT FROM OLD.role AND NEW.supervisor_id IS NOT DISTINCT FROM OLD.supervisor_id THEN
      RETURN NEW;
    END IF;
  END IF;
  IF NEW.role <> 'dealer' THEN
    NEW.supervisor_id := NULL;
  ELSE
    IF NEW.supervisor_id IS NULL THEN
      RAISE EXCEPTION 'DEALER_SEM_SUPERVISOR' USING ERRCODE = '23514';
    END IF;
    IF NEW.supervisor_id = NEW.id
       OR NOT EXISTS (SELECT 1 FROM players s WHERE s.id = NEW.supervisor_id AND s.role IN ('anfitriao', 'owner')) THEN
      RAISE EXCEPTION 'SUPERVISOR_INVALIDO' USING ERRCODE = '23514';
    END IF;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF OLD.role IN ('anfitriao', 'owner') AND NEW.role NOT IN ('anfitriao', 'owner')
       AND EXISTS (SELECT 1 FROM players d WHERE d.supervisor_id = NEW.id AND d.role = 'dealer') THEN
      RAISE EXCEPTION 'SUPERVISOR_COM_DEALERS' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS players_cargo_chk ON players;
CREATE TRIGGER players_cargo_chk BEFORE INSERT OR UPDATE OF role, supervisor_id ON players
  FOR EACH ROW EXECUTE FUNCTION devo_players_cargo_chk();

CREATE OR REPLACE FUNCTION devo_players_cargo_log() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE changed_sup boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    changed_sup := NEW.supervisor_id IS NOT NULL;
  ELSE
    changed_sup := NEW.supervisor_id IS DISTINCT FROM OLD.supervisor_id;
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      INSERT INTO admin_log (actor_id, action, target_id, data)
      VALUES (devo_actor(), 'cargo.alterado', NEW.id, jsonb_build_object('de', OLD.role, 'para', NEW.role));
    END IF;
  END IF;
  IF changed_sup THEN
    UPDATE dealer_supervisions SET ended_at = now() WHERE dealer_id = NEW.id AND ended_at IS NULL;
    IF NEW.supervisor_id IS NOT NULL THEN
      INSERT INTO dealer_supervisions (dealer_id, supervisor_id, assigned_by) VALUES (NEW.id, NEW.supervisor_id, devo_actor());
    END IF;
    IF TG_OP = 'UPDATE' THEN
      INSERT INTO admin_log (actor_id, action, target_id, data)
      VALUES (devo_actor(), 'dealer.supervisor', NEW.id, jsonb_build_object('de', OLD.supervisor_id, 'para', NEW.supervisor_id));
    END IF;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS players_cargo_log ON players;
CREATE TRIGGER players_cargo_log AFTER INSERT OR UPDATE OF role, supervisor_id ON players
  FOR EACH ROW EXECUTE FUNCTION devo_players_cargo_log();

-- Autorizações pontuais dadas pelo Owner (ex.: Anfitrião definir/distribuir recompensas semanais de uma semana).
CREATE TABLE IF NOT EXISTS staff_authorizations (
  id bigserial PRIMARY KEY,
  grantee_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  scope text NOT NULL,
  ref text,
  granted_by uuid REFERENCES players(id) ON DELETE SET NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  revoked_at timestamptz
);
CREATE INDEX IF NOT EXISTS staff_authorizations_grantee_idx ON staff_authorizations (grantee_id) WHERE revoked_at IS NULL;

-- ---------------------------------------------------------------------------------------------
-- 2. Configuração editável pelo Owner (valores provisórios marcados com provisional = true)
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS devo_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  provisional boolean NOT NULL DEFAULT true,
  note text,
  updated_by uuid REFERENCES players(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- PROVISÓRIO (DIRECAO-3 §1b): pesos relativos por categoria de moeda até o dono definir os finais.
INSERT INTO devo_config (key, value, provisional, note) VALUES
  ('poco.probabilidades',
   '{"dracma_comum":   {"lixo": 70, "capsula": 8,  "fragmento": 8,  "essencia": 10, "cosmetico": 4},
     "dracma_incomum": {"lixo": 50, "capsula": 14, "fragmento": 14, "essencia": 14, "cosmetico": 8}}'::jsonb,
   true, 'PROVISÓRIO: pesos relativos (não porcentagem final). O dono define os valores finais.'),
  ('poco.giro_gratis_diario', '{"categoria": "dracma_comum", "quantidade": 1}'::jsonb, true, 'Giro grátis diário na categoria normal.'),
  ('convites.cota_inicial', '1'::jsonb, false, 'Cota de convites do Jogador ao criar a conta (não renova).')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------------------------
-- 3. Inventário genérico (itens por tipo + quantidade)
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS item_defs (
  key text PRIMARY KEY,
  kind text NOT NULL,
  name text NOT NULL,
  description text,
  rarity text NOT NULL DEFAULT 'comum',
  -- false = item único (cosmético, cápsula): no máximo 1 no inventário.
  stackable boolean NOT NULL DEFAULT true,
  -- Dados livres por tipo: torre/NPC da essência e da chave, categoria e asset do cosmético, texto da cápsula…
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT item_defs_key_chk CHECK (key ~ '^[a-z0-9_]+(:[a-z0-9_-]+)?$'),
  CONSTRAINT item_defs_kind_chk CHECK (kind IN ('moeda', 'essencia', 'chave', 'fragmento', 'capsula', 'cosmetico', 'convite', 'outro')),
  CONSTRAINT item_defs_rarity_chk CHECK (rarity IN ('comum', 'incomum', 'raro', 'epico', 'lendario', 'arcano'))
);

CREATE TABLE IF NOT EXISTS player_items (
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  item_key text NOT NULL REFERENCES item_defs(key) ON UPDATE CASCADE,
  quantity bigint NOT NULL DEFAULT 0,
  -- Como o jogador obteve o item pela primeira vez (ex.: 'poco', 'recompensa', 'deadly_vote').
  source text,
  first_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, item_key),
  CONSTRAINT player_items_qty_chk CHECK (quantity >= 0)
);
CREATE INDEX IF NOT EXISTS player_items_item_idx ON player_items (item_key);

-- Livro-razão de toda entrada e saída. idem_key torna a operação idempotente (mesma chave = mesma operação).
CREATE TABLE IF NOT EXISTS item_ledger (
  id bigserial PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  item_key text NOT NULL REFERENCES item_defs(key) ON UPDATE CASCADE,
  delta bigint NOT NULL,
  balance bigint NOT NULL,
  reason text NOT NULL,
  ref text,
  actor_id uuid REFERENCES players(id) ON DELETE SET NULL,
  idem_key text
);
CREATE UNIQUE INDEX IF NOT EXISTS item_ledger_idem_idx ON item_ledger (idem_key) WHERE idem_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS item_ledger_player_idx ON item_ledger (player_id, at DESC);

-- Concede itens. Retorna o saldo final. Com p_idem repetido, não concede de novo e devolve o saldo atual.
CREATE OR REPLACE FUNCTION devo_item_grant(p_player uuid, p_item text, p_qty bigint, p_reason text,
  p_ref text DEFAULT NULL, p_actor uuid DEFAULT NULL, p_idem text DEFAULT NULL) RETURNS bigint
LANGUAGE plpgsql AS $$
DECLARE
  v_stack boolean;
  v_prev bigint;
  v_bal bigint;
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 OR p_qty > 1000000000 THEN RAISE EXCEPTION 'QUANTIDADE_INVALIDA'; END IF;
  SELECT stackable INTO v_stack FROM item_defs WHERE key = p_item;
  IF NOT FOUND THEN RAISE EXCEPTION 'ITEM_DESCONHECIDO: %', p_item; END IF;
  IF p_idem IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('devo-idem:' || p_idem));
    IF EXISTS (SELECT 1 FROM item_ledger WHERE idem_key = p_idem) THEN
      SELECT quantity INTO v_bal FROM player_items WHERE player_id = p_player AND item_key = p_item;
      RETURN coalesce(v_bal, 0);
    END IF;
  END IF;
  SELECT quantity INTO v_prev FROM player_items WHERE player_id = p_player AND item_key = p_item FOR UPDATE;
  INSERT INTO player_items (player_id, item_key, quantity, source)
  VALUES (p_player, p_item, CASE WHEN v_stack THEN p_qty ELSE 1 END, p_reason)
  ON CONFLICT (player_id, item_key) DO UPDATE
    SET quantity = CASE WHEN v_stack THEN player_items.quantity + p_qty ELSE 1 END,
        source = coalesce(player_items.source, EXCLUDED.source),
        updated_at = now()
  RETURNING quantity INTO v_bal;
  INSERT INTO item_ledger (player_id, item_key, delta, balance, reason, ref, actor_id, idem_key)
  VALUES (p_player, p_item, v_bal - coalesce(v_prev, 0), v_bal, p_reason, p_ref, p_actor, p_idem);
  RETURN v_bal;
END $$;

-- Consome itens. Nunca deixa negativo: sem saldo, levanta SALDO_INSUFICIENTE e nada muda.
CREATE OR REPLACE FUNCTION devo_item_consume(p_player uuid, p_item text, p_qty bigint, p_reason text,
  p_ref text DEFAULT NULL, p_actor uuid DEFAULT NULL, p_idem text DEFAULT NULL) RETURNS bigint
LANGUAGE plpgsql AS $$
DECLARE v_bal bigint;
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 OR p_qty > 1000000000 THEN RAISE EXCEPTION 'QUANTIDADE_INVALIDA'; END IF;
  IF p_idem IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('devo-idem:' || p_idem));
    IF EXISTS (SELECT 1 FROM item_ledger WHERE idem_key = p_idem) THEN
      SELECT quantity INTO v_bal FROM player_items WHERE player_id = p_player AND item_key = p_item;
      RETURN coalesce(v_bal, 0);
    END IF;
  END IF;
  UPDATE player_items SET quantity = quantity - p_qty, updated_at = now()
   WHERE player_id = p_player AND item_key = p_item AND quantity >= p_qty
  RETURNING quantity INTO v_bal;
  IF NOT FOUND THEN RAISE EXCEPTION 'SALDO_INSUFICIENTE: %', p_item; END IF;
  INSERT INTO item_ledger (player_id, item_key, delta, balance, reason, ref, actor_id, idem_key)
  VALUES (p_player, p_item, -p_qty, v_bal, p_reason, p_ref, p_actor, p_idem);
  RETURN v_bal;
END $$;

-- Catálogo base (produção). Torres, cápsulas e cosméticos entram pelos agentes de cada sistema
-- seguindo as convenções de chave do FUNDACAO.md (essencia:<npc>, chave:<torre>, capsula:<id>, cosmetico:<id>).
INSERT INTO item_defs (key, kind, name, description, rarity, stackable, meta) VALUES
  ('dracma_comum', 'moeda', 'Dracma Comum', 'Moeda do sorteio base do Poço dos Milagres.', 'comum', true, '{"poco": true}'),
  ('dracma_incomum', 'moeda', 'Dracma Incomum', 'Moeda antiga entregue por uma figura encapuzada. Abre uma categoria especial do Poço.', 'incomum', true, '{"poco": true}'),
  ('dracma_rara', 'moeda', 'Dracma Rara', 'Moeda rara do Poço (provisória: categoria ainda não definida pelo dono).', 'raro', true, '{"poco": true, "provisorio": true}'),
  ('fragmento_arcano', 'fragmento', 'Fragmento de Arcano', 'Lasca de um Arcano. Usada na evolução de Estágio.', 'raro', true, '{}'),
  ('essencia:galo', 'essencia', 'Essência de Afinidade do Galo', 'Essência do Galo, Anfitrião do Arcano do Imperador. Abre andares das torres ligadas a ele.', 'incomum', true, '{"npc": "galo", "arcano": "imperador"}'),
  ('convite', 'convite', 'Código de convite', 'Cada unidade permite gerar um código de convite de Jogador.', 'comum', true, '{}')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------------------------
-- 4. Cota de convites (item 'convite'): 1 por conta, uma única vez (idem 'cota-inicial:<id>').
-- ---------------------------------------------------------------------------------------------
DO $$
BEGIN
  PERFORM devo_item_grant(p.id, 'convite', 1, 'cota_inicial', NULL, NULL, 'cota-inicial:' || p.id)
     FROM players p
    WHERE p.role = 'player'
      AND NOT EXISTS (SELECT 1 FROM item_ledger l WHERE l.idem_key = 'cota-inicial:' || p.id);
END $$;

-- ---------------------------------------------------------------------------------------------
-- 5. Entregas de cartas (as cartas vivem no save do cliente; o servidor deixa aqui e o cliente resgata)
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS card_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  card_id text NOT NULL,
  origin text NOT NULL,
  ref text,
  idem_key text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz
);
CREATE INDEX IF NOT EXISTS card_deliveries_pending_idx ON card_deliveries (player_id) WHERE claimed_at IS NULL;

-- ---------------------------------------------------------------------------------------------
-- 6. Desbloqueios por jogador + Karma
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS player_unlocks (
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  flag text NOT NULL,
  -- 'deadly_vote' (tutorial vencido), 'owner' (override), 'narrativa', 'sistema'
  source text NOT NULL,
  ref text,
  actor_id uuid REFERENCES players(id) ON DELETE SET NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, flag),
  CONSTRAINT player_unlocks_flag_chk CHECK (flag ~ '^[a-z_]{2,40}$')
);

-- Owner e Anfitrião veem tudo liberado (DIRECAO-3 §1b); os demais dependem da flag.
CREATE OR REPLACE FUNCTION devo_tem_desbloqueio(p_player uuid, p_flag text) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM players WHERE id = p_player AND role IN ('owner', 'anfitriao'))
      OR EXISTS (SELECT 1 FROM player_unlocks WHERE player_id = p_player AND flag = p_flag)
$$;

CREATE TABLE IF NOT EXISTS karma_log (
  id bigserial PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  delta integer NOT NULL,
  balance integer NOT NULL,
  reason text NOT NULL,
  ref text,
  actor_id uuid REFERENCES players(id) ON DELETE SET NULL,
  idem_key text
);
CREATE UNIQUE INDEX IF NOT EXISTS karma_log_idem_idx ON karma_log (idem_key) WHERE idem_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS karma_log_player_idx ON karma_log (player_id, at DESC);

-- Ajusta o Karma (positivo = ordem, negativo = caos). Retorna o valor final. idem evita repetir a mesma escolha.
CREATE OR REPLACE FUNCTION devo_karma_ajustar(p_player uuid, p_delta integer, p_reason text,
  p_ref text DEFAULT NULL, p_actor uuid DEFAULT NULL, p_idem text DEFAULT NULL) RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE v_bal integer;
BEGIN
  IF p_delta IS NULL OR p_delta = 0 OR abs(p_delta) > 1000 THEN RAISE EXCEPTION 'KARMA_DELTA_INVALIDO'; END IF;
  IF p_idem IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('devo-karma:' || p_idem));
    IF EXISTS (SELECT 1 FROM karma_log WHERE idem_key = p_idem) THEN
      SELECT karma INTO v_bal FROM players WHERE id = p_player;
      RETURN v_bal;
    END IF;
  END IF;
  UPDATE players SET karma = karma + p_delta WHERE id = p_player RETURNING karma INTO v_bal;
  IF NOT FOUND THEN RAISE EXCEPTION 'JOGADOR_DESCONHECIDO'; END IF;
  INSERT INTO karma_log (player_id, delta, balance, reason, ref, actor_id, idem_key)
  VALUES (p_player, p_delta, v_bal, p_reason, p_ref, p_actor, p_idem);
  RETURN v_bal;
END $$;

-- ---------------------------------------------------------------------------------------------
-- 7. Deadly Vote tutorial: vencer (outcome 'sobreviveu' num voto 'concluido') concede as flags do voto.
-- ---------------------------------------------------------------------------------------------
ALTER TABLE deadly_votes ADD COLUMN IF NOT EXISTS is_tutorial boolean NOT NULL DEFAULT false;
ALTER TABLE deadly_votes ADD COLUMN IF NOT EXISTS unlocks text[] NOT NULL DEFAULT '{}';

-- Lista padrão de flags do tutorial (DIRECAO-3 §1). Editável por voto na coluna unlocks.
CREATE OR REPLACE FUNCTION devo_tutorial_flags() RETURNS text[]
LANGUAGE sql IMMUTABLE AS $$ SELECT ARRAY['salao_mascaras', 'poco', 'torres', 'diario', 'galo_casa']::text[] $$;

CREATE OR REPLACE FUNCTION devo_dv_tutorial_default() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_tutorial AND cardinality(NEW.unlocks) = 0 THEN NEW.unlocks := devo_tutorial_flags(); END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS deadly_votes_tutorial_default ON deadly_votes;
CREATE TRIGGER deadly_votes_tutorial_default BEFORE INSERT OR UPDATE OF is_tutorial, unlocks ON deadly_votes
  FOR EACH ROW EXECUTE FUNCTION devo_dv_tutorial_default();

-- Aplica as flags de um voto concluído aos sobreviventes (todos, ou só p_player). Idempotente.
CREATE OR REPLACE FUNCTION devo_dv_desbloquear(p_vote uuid, p_player uuid DEFAULT NULL) RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE n integer;
BEGIN
  INSERT INTO player_unlocks (player_id, flag, source, ref, actor_id)
  SELECT e.player_id, f, 'deadly_vote', v.id::text, devo_actor()
    FROM deadly_votes v
    JOIN deadly_vote_entries e ON e.vote_id = v.id
    CROSS JOIN LATERAL unnest(v.unlocks) AS f
   WHERE v.id = p_vote AND v.status = 'concluido' AND e.outcome = 'sobreviveu'
     AND (p_player IS NULL OR e.player_id = p_player)
  ON CONFLICT (player_id, flag) DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION devo_dv_status_unlock() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM devo_dv_desbloquear(NEW.id);
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS deadly_votes_unlock ON deadly_votes;
CREATE TRIGGER deadly_votes_unlock AFTER UPDATE OF status, unlocks ON deadly_votes
  FOR EACH ROW WHEN (NEW.status = 'concluido' AND cardinality(NEW.unlocks) > 0) EXECUTE FUNCTION devo_dv_status_unlock();

CREATE OR REPLACE FUNCTION devo_dv_entry_unlock() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM devo_dv_desbloquear(NEW.vote_id, NEW.player_id);
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS deadly_vote_entries_unlock ON deadly_vote_entries;
CREATE TRIGGER deadly_vote_entries_unlock AFTER INSERT OR UPDATE OF outcome ON deadly_vote_entries
  FOR EACH ROW WHEN (NEW.outcome = 'sobreviveu') EXECUTE FUNCTION devo_dv_entry_unlock();

-- ---------------------------------------------------------------------------------------------
-- 8. Recompensas com aprovação
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reward_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 'evento' (Deadly Vote / jogo), 'externa' (Anfitrião fora de evento: exige Owner), 'semanal' (recompensas semanais)
  kind text NOT NULL,
  vote_id uuid REFERENCES deadly_votes(id) ON DELETE SET NULL,
  -- Evento de origem legível ("Deadly Vote #12", "Semana 2026-10-12"…)
  origin text NOT NULL,
  recipient_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  -- 'item' (resource_key = item_defs.key), 'tempo' (minutos), 'carta' (resource_key = id da carta), 'convite' (cota)
  resource text NOT NULL,
  resource_key text,
  quantity integer NOT NULL,
  justification text NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  proposed_by uuid REFERENCES players(id) ON DELETE SET NULL,
  -- Supervisor do proponente NO MOMENTO da proposta (histórico preservado após transferência).
  supervisor_id uuid REFERENCES players(id) ON DELETE SET NULL,
  authorized_by uuid REFERENCES players(id) ON DELETE SET NULL,
  authorized_at timestamptz,
  decision_note text,
  delivered_by uuid REFERENCES players(id) ON DELETE SET NULL,
  delivered_at timestamptz,
  revision integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reward_kind_chk CHECK (kind IN ('evento', 'externa', 'semanal')),
  CONSTRAINT reward_resource_chk CHECK (resource IN ('item', 'tempo', 'carta', 'convite')),
  CONSTRAINT reward_key_chk CHECK ((resource IN ('item', 'carta')) = (resource_key IS NOT NULL)),
  CONSTRAINT reward_qty_chk CHECK (quantity > 0 AND quantity <= 1000000),
  CONSTRAINT reward_status_chk CHECK (status IN ('pendente', 'aprovada', 'rejeitada', 'entregue', 'cancelada')),
  CONSTRAINT reward_just_chk CHECK (length(trim(justification)) >= 3)
);
CREATE INDEX IF NOT EXISTS reward_proposals_status_idx ON reward_proposals (status, created_at DESC);
CREATE INDEX IF NOT EXISTS reward_proposals_supervisor_idx ON reward_proposals (supervisor_id, status);
CREATE INDEX IF NOT EXISTS reward_proposals_recipient_idx ON reward_proposals (recipient_id);
CREATE INDEX IF NOT EXISTS reward_proposals_vote_idx ON reward_proposals (vote_id) WHERE vote_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS reward_log (
  id bigserial PRIMARY KEY,
  proposal_id uuid NOT NULL REFERENCES reward_proposals(id) ON DELETE CASCADE,
  at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid REFERENCES players(id) ON DELETE SET NULL,
  action text NOT NULL,
  status text NOT NULL,
  snapshot jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS reward_log_proposal_idx ON reward_log (proposal_id, at);

-- Regras no banco: nasce pendente; edição relevante de aprovada/rejeitada volta a pendente; entregue é imutável;
-- só Owner aprova 'externa'; Dealer e Jogador nunca aprovam; entregar exige aprovação.
CREATE OR REPLACE FUNCTION devo_reward_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  relevant boolean;
  r text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pendente';
    NEW.authorized_by := NULL;
    NEW.authorized_at := NULL;
    NEW.delivered_by := NULL;
    NEW.delivered_at := NULL;
    NEW.revision := 1;
    IF NEW.supervisor_id IS NULL AND NEW.proposed_by IS NOT NULL THEN
      SELECT supervisor_id INTO NEW.supervisor_id FROM players WHERE id = NEW.proposed_by;
    END IF;
    RETURN NEW;
  END IF;

  relevant := NEW.kind IS DISTINCT FROM OLD.kind OR NEW.vote_id IS DISTINCT FROM OLD.vote_id
           OR NEW.recipient_id IS DISTINCT FROM OLD.recipient_id OR NEW.resource IS DISTINCT FROM OLD.resource
           OR NEW.resource_key IS DISTINCT FROM OLD.resource_key OR NEW.quantity IS DISTINCT FROM OLD.quantity;

  IF OLD.status IN ('entregue', 'cancelada') THEN
    IF relevant OR NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'RECOMPENSA_FECHADA' USING ERRCODE = '23514';
    END IF;
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  IF relevant THEN
    NEW.status := 'pendente';
    NEW.authorized_by := NULL;
    NEW.authorized_at := NULL;
    NEW.revision := OLD.revision + 1;
  END IF;

  IF NEW.status = 'aprovada' AND OLD.status <> 'aprovada' THEN
    IF OLD.status <> 'pendente' THEN RAISE EXCEPTION 'APROVACAO_SO_DE_PENDENTE' USING ERRCODE = '23514'; END IF;
    SELECT role INTO r FROM players WHERE id = NEW.authorized_by;
    IF r IS NULL OR NOT (r = 'owner' OR (r = 'anfitriao' AND NEW.kind <> 'externa')) THEN
      RAISE EXCEPTION 'APROVACAO_NAO_PERMITIDA' USING ERRCODE = '42501';
    END IF;
    NEW.authorized_at := now();
  END IF;

  IF NEW.status = 'entregue' AND OLD.status <> 'entregue' THEN
    IF OLD.status <> 'aprovada' THEN RAISE EXCEPTION 'ENTREGA_SEM_APROVACAO' USING ERRCODE = '23514'; END IF;
    NEW.delivered_at := now();
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS reward_proposals_guard ON reward_proposals;
CREATE TRIGGER reward_proposals_guard BEFORE INSERT OR UPDATE ON reward_proposals
  FOR EACH ROW EXECUTE FUNCTION devo_reward_guard();

CREATE OR REPLACE FUNCTION devo_reward_log() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE act text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    act := 'criada';
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    act := CASE NEW.status WHEN 'pendente' THEN 'editada' WHEN 'aprovada' THEN 'aprovada' WHEN 'rejeitada' THEN 'rejeitada'
                           WHEN 'entregue' THEN 'entregue' ELSE 'cancelada' END;
  ELSIF NEW.revision IS DISTINCT FROM OLD.revision OR NEW.justification IS DISTINCT FROM OLD.justification
        OR NEW.origin IS DISTINCT FROM OLD.origin THEN
    act := 'editada';
  ELSE
    RETURN NULL;
  END IF;
  INSERT INTO reward_log (proposal_id, actor_id, action, status, snapshot)
  VALUES (NEW.id, devo_actor(), act, NEW.status, to_jsonb(NEW));
  IF act = 'entregue' THEN
    INSERT INTO admin_log (actor_id, action, target_id, ref, data)
    VALUES (devo_actor(), 'recompensa.entregue', NEW.recipient_id, NEW.id::text,
            jsonb_build_object('kind', NEW.kind, 'resource', NEW.resource, 'key', NEW.resource_key, 'quantity', NEW.quantity,
                               'origin', NEW.origin, 'authorized_by', NEW.authorized_by, 'proposed_by', NEW.proposed_by));
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS reward_proposals_log ON reward_proposals;
CREATE TRIGGER reward_proposals_log AFTER INSERT OR UPDATE ON reward_proposals
  FOR EACH ROW EXECUTE FUNCTION devo_reward_log();

-- ---------------------------------------------------------------------------------------------
-- 9. Arcano do jogador e Estágio (acrescentado pelo agente Virtudes; FUNDACAO.md §12)
--    arcano: chave do Arcano maior ('morte', 'imperador', …; lista em lib/devo/virtudes.ts) ou NULL
--    ("sem registro"). arcano_estagio: Estágio atual (1..), sobe na Evolução de Estágio.
-- ---------------------------------------------------------------------------------------------
ALTER TABLE players ADD COLUMN IF NOT EXISTS arcano text;
ALTER TABLE players ADD COLUMN IF NOT EXISTS arcano_estagio integer NOT NULL DEFAULT 1;
DO $$ BEGIN
  ALTER TABLE players ADD CONSTRAINT players_arcano_chk CHECK (arcano IS NULL OR arcano ~ '^[a-z]{2,20}$');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE players ADD CONSTRAINT players_arcano_estagio_chk CHECK (arcano_estagio BETWEEN 1 AND 50);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
