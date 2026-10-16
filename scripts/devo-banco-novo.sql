-- DEVO — banco novo de produção (gerado; NÃO editar à mão).
-- Gerado por scripts/dev/gerar-banco-novo.sh a partir de todas as migrações, em ordem, sem dados de teste.
-- Para gerar de novo: bash scripts/dev/gerar-banco-novo.sh
-- Aplicar num banco vazio: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/devo-banco-novo.sql
-- Idempotente: rodar duas vezes não quebra.
-- Depois de criar o banco, gere o primeiro convite de Owner, por exemplo:
--   INSERT INTO invite_codes (code, role, note) VALUES ('DEVO-XXXX-XXXX', 'owner', 'primeiro owner');

-- =============================================================================================
-- scripts/dev/00-base.sql
-- =============================================================================================
-- Tabelas-base que no Neon foram criadas pelo Drizzle (lib/db/schema.ts).
-- gen_random_uuid() já é nativo no Postgres 13+.
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL DEFAULT 'player',
  avatar text,
  avatar_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS players_name_lower_idx ON players (lower(name));
CREATE TABLE IF NOT EXISTS player_saves (
  player_id uuid PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_pulse_at timestamptz
);
CREATE TABLE IF NOT EXISTS push_subscriptions (
  endpoint text PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS push_config (id integer PRIMARY KEY, public_key text NOT NULL, private_key text NOT NULL);


-- =============================================================================================
-- scripts/deadly-votes-migration.sql
-- =============================================================================================
ALTER TABLE players ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'player';
ALTER TABLE players ADD COLUMN IF NOT EXISTS avatar text;
ALTER TABLE players ADD COLUMN IF NOT EXISTS avatar_updated_at timestamptz;

CREATE TABLE IF NOT EXISTS deadly_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number serial UNIQUE,
  title text NOT NULL,
  arc text,
  briefing text,
  status text NOT NULL DEFAULT 'convocado',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  max_participants integer,
  created_by uuid REFERENCES players(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT deadly_votes_status_chk CHECK (status IN ('convocado', 'em-progresso', 'concluido', 'cancelado', 'falha'))
);

CREATE INDEX IF NOT EXISTS deadly_votes_starts_idx ON deadly_votes (starts_at DESC);

CREATE TABLE IF NOT EXISTS deadly_vote_entries (
  vote_id uuid NOT NULL REFERENCES deadly_votes(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  outcome text,
  note text,
  PRIMARY KEY (vote_id, player_id),
  CONSTRAINT deadly_vote_entries_outcome_chk CHECK (outcome IS NULL OR outcome IN ('sobreviveu', 'eliminado'))
);

CREATE INDEX IF NOT EXISTS deadly_vote_entries_player_idx ON deadly_vote_entries (player_id);


-- =============================================================================================
-- scripts/deadly-votes-group-migration.sql
-- =============================================================================================
-- Deadly Vote: link do grupo do WhatsApp (Direção 2 §4).
-- O Dealer/Anfitrião informa ou edita o link; o Record só entrega o link aos inscritos e só enquanto
-- o caso estiver "em-progresso" (lib/devo/record-server.ts). Rodar no Neon depois de deadly-votes-migration.sql.
ALTER TABLE deadly_votes ADD COLUMN IF NOT EXISTS whatsapp_url text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deadly_votes_whatsapp_chk') THEN
    ALTER TABLE deadly_votes
      ADD CONSTRAINT deadly_votes_whatsapp_chk CHECK (whatsapp_url IS NULL OR whatsapp_url ~ '^https://chat\.whatsapp\.com/[A-Za-z0-9]{10,40}$');
  END IF;
END $$;


-- =============================================================================================
-- scripts/auth-migration.sql
-- =============================================================================================
CREATE TABLE IF NOT EXISTS "user" ("id" text PRIMARY KEY, "name" text NOT NULL, "email" text NOT NULL UNIQUE, "emailVerified" boolean NOT NULL DEFAULT false, "image" text, "username" text UNIQUE, "displayUsername" text, "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS "session" ("id" text PRIMARY KEY, "expiresAt" timestamptz NOT NULL, "token" text NOT NULL UNIQUE, "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(), "ipAddress" text, "userAgent" text, "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS session_user_idx ON "session" ("userId");
CREATE TABLE IF NOT EXISTS "account" ("id" text PRIMARY KEY, "accountId" text NOT NULL, "providerId" text NOT NULL, "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE, "accessToken" text, "refreshToken" text, "idToken" text, "accessTokenExpiresAt" timestamptz, "refreshTokenExpiresAt" timestamptz, "scope" text, "password" text, "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS account_user_idx ON "account" ("userId");
CREATE TABLE IF NOT EXISTS "verification" ("id" text PRIMARY KEY, "identifier" text NOT NULL, "value" text NOT NULL, "expiresAt" timestamptz NOT NULL, "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS verification_identifier_idx ON "verification" ("identifier");
ALTER TABLE players ADD COLUMN IF NOT EXISTS user_id text UNIQUE;
CREATE TABLE IF NOT EXISTS invite_codes (code text PRIMARY KEY, role text NOT NULL DEFAULT 'player', note text, created_by uuid, created_at timestamptz NOT NULL DEFAULT now(), used_at timestamptz, used_by_user text);


-- =============================================================================================
-- scripts/arcade-migration.sql
-- =============================================================================================
CREATE TABLE IF NOT EXISTS arcade_schedule (
  id serial PRIMARY KEY,
  weekday integer NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  game_id text NOT NULL,
  label text,
  start_time text NOT NULL DEFAULT '20:00',
  duration_min integer NOT NULL DEFAULT 60,
  registration_close_min integer NOT NULL DEFAULT 30,
  max_players integer NOT NULL DEFAULT 8,
  reward jsonb NOT NULL DEFAULT '{}'::jsonb,
  rules text,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS arcade_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number serial,
  schedule_id integer REFERENCES arcade_schedule(id) ON DELETE SET NULL,
  game_id text NOT NULL,
  label text,
  starts_at timestamptz NOT NULL,
  registration_opens_at timestamptz NOT NULL,
  registration_closes_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  max_players integer NOT NULL,
  reward jsonb NOT NULL DEFAULT '{}'::jsonb,
  rules text,
  cancelled boolean NOT NULL DEFAULT false,
  locked_at timestamptz,
  resolved_at timestamptz,
  UNIQUE (schedule_id, starts_at)
);

CREATE TABLE IF NOT EXISTS arcade_entries (
  event_id uuid NOT NULL REFERENCES arcade_events(id) ON DELETE CASCADE,
  name text NOT NULL,
  player_id uuid REFERENCES players(id) ON DELETE CASCADE,
  is_bot boolean NOT NULL DEFAULT false,
  rating integer NOT NULL DEFAULT 1000,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, name)
);

CREATE TABLE IF NOT EXISTS arcade_duels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES arcade_events(id) ON DELETE CASCADE,
  slot integer NOT NULL,
  a_name text NOT NULL,
  b_name text NOT NULL,
  a_rating integer NOT NULL,
  b_rating integer NOT NULL,
  winner_name text,
  resolved_at timestamptz,
  UNIQUE (event_id, slot)
);

CREATE TABLE IF NOT EXISTS arcade_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  game_id text NOT NULL,
  mode text NOT NULL,
  duel_id uuid REFERENCES arcade_duels(id) ON DELETE SET NULL,
  opponent_name text NOT NULL,
  opponent_rating integer NOT NULL,
  seed integer NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  result text,
  score integer,
  stats jsonb
);
CREATE INDEX IF NOT EXISTS arcade_matches_player_idx ON arcade_matches (player_id, started_at DESC);

CREATE TABLE IF NOT EXISTS arcade_profiles (
  player_id uuid PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  chips integer NOT NULL DEFAULT 1000,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS arcade_week_scores (
  week_start date NOT NULL,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  games integer NOT NULL DEFAULT 0,
  PRIMARY KEY (week_start, player_id)
);

CREATE TABLE IF NOT EXISTS arcade_bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  duel_id uuid NOT NULL REFERENCES arcade_duels(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  pick_name text NOT NULL,
  amount integer NOT NULL CHECK (amount > 0),
  odds numeric(6,2) NOT NULL,
  status text NOT NULL DEFAULT 'open',
  payout integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (duel_id, player_id)
);

CREATE TABLE IF NOT EXISTS arcade_chat (
  id bigserial PRIMARY KEY,
  channel text NOT NULL,
  author text NOT NULL,
  player_id uuid REFERENCES players(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS arcade_chat_channel_idx ON arcade_chat (channel, created_at DESC);

CREATE TABLE IF NOT EXISTS arcade_claims (
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  rank integer NOT NULL,
  reward jsonb NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, week_start)
);

INSERT INTO arcade_schedule (weekday, game_id, label, start_time, duration_min, registration_close_min, max_players, reward, rules)
SELECT * FROM (VALUES
  (1, 'memory-rush', NULL, '20:00', 60, 30, 8, '{"score":400,"chips":300}'::jsonb, NULL),
  (2, 'chess', NULL, '20:00', 60, 30, 8, '{"score":500,"chips":350}'::jsonb, NULL),
  (3, 'hot-bomb', NULL, '20:00', 60, 30, 8, '{"score":450,"chips":300}'::jsonb, NULL),
  (4, 'memory-rush', NULL, '20:00', 60, 30, 8, '{"score":400,"chips":300}'::jsonb, NULL),
  (5, 'chess', NULL, '20:00', 60, 30, 8, '{"score":500,"chips":350}'::jsonb, NULL),
  (6, 'hot-bomb', NULL, '20:00', 60, 30, 8, '{"score":450,"chips":300}'::jsonb, NULL),
  (0, 'memory-rush', 'Evento especial', '19:00', 90, 30, 12, '{"score":900,"chips":700}'::jsonb, 'Pontuação em dobro. Só um sobrevive ao topo.')
) AS v(weekday, game_id, label, start_time, duration_min, registration_close_min, max_players, reward, rules)
WHERE NOT EXISTS (SELECT 1 FROM arcade_schedule);
ALTER TABLE arcade_profiles ADD COLUMN IF NOT EXISTS time_pending_ms bigint NOT NULL DEFAULT 0;
ALTER TABLE arcade_profiles ADD COLUMN IF NOT EXISTS time_pending_ms BIGINT NOT NULL DEFAULT 0;


-- =============================================================================================
-- scripts/arcade-points-migration.sql
-- =============================================================================================
ALTER TABLE arcade_matches ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 0;

UPDATE arcade_matches
SET points = CASE
  WHEN mode = 'evento' THEN score + CASE WHEN result = 'win' THEN 0 ELSE 50 END
  ELSE LEAST(250, ROUND(score * 0.2))::int + CASE result WHEN 'win' THEN 40 WHEN 'draw' THEN 20 ELSE 10 END
END
WHERE points = 0 AND finished_at IS NOT NULL AND mode <> 'treino';

CREATE INDEX IF NOT EXISTS arcade_matches_game_week_idx ON arcade_matches (game_id, finished_at) WHERE mode <> 'treino';


-- =============================================================================================
-- scripts/arcade-rooms-migration.sql
-- =============================================================================================
CREATE TABLE IF NOT EXISTS arcade_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id text NOT NULL,
  mode text NOT NULL DEFAULT 'casual',
  duel_id uuid UNIQUE,
  seed integer NOT NULL,
  status text NOT NULL DEFAULT 'waiting',
  a_id uuid NOT NULL,
  a_name text NOT NULL,
  a_rating integer NOT NULL DEFAULT 1000,
  a_seen timestamptz NOT NULL DEFAULT now(),
  a_live jsonb,
  b_id uuid,
  b_name text,
  b_rating integer,
  b_seen timestamptz,
  b_live jsonb,
  started_at timestamptz,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS arcade_rooms_waiting_idx ON arcade_rooms (game_id, created_at) WHERE status = 'waiting';
CREATE INDEX IF NOT EXISTS arcade_rooms_a_idx ON arcade_rooms (a_id, status);
CREATE INDEX IF NOT EXISTS arcade_rooms_b_idx ON arcade_rooms (b_id, status);


-- =============================================================================================
-- scripts/test-accounts-migration.sql
-- =============================================================================================
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


-- =============================================================================================
-- scripts/character-name-migration.sql
-- =============================================================================================
-- Nome do personagem (DIRECAO-2 §5): como os NPCs chamam o jogador durante todo o jogo.
-- O login continua pelo nome da conta (players.name / user.username).
-- Rodar no Neon depois de auth-migration.sql. Idempotente.
ALTER TABLE players ADD COLUMN IF NOT EXISTS character_name text;

-- Contas antigas: o personagem começa com o mesmo nome da conta (pode ser trocado depois).
UPDATE players SET character_name = name WHERE character_name IS NULL;


-- =============================================================================================
-- scripts/fundacao-migration.sql
-- =============================================================================================
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
-- 9. Arcano do jogador e Estágio (acrescentado pelo agente Virtudes; FUNDACAO.md §13)
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


-- =============================================================================================
-- scripts/poco-migration.sql
-- =============================================================================================
-- Poço dos Milagres (DIRECAO-3 §2; texto do dono em docs/redesign/SISTEMAS-texto-do-dono.txt).
-- Depende de scripts/fundacao-migration.sql (item_defs, player_items, devo_config, players).
-- Idempotente: rodar duas vezes não quebra nem duplica.
--
-- O sorteio acontece SEMPRE no servidor (lib/devo/poco-server.ts). Cada giro guarda o segredo do sorteio
-- (seed), o compromisso mostrado ao jogador antes de girar (seed_hash = sha256(seed)), os pesos lidos da
-- configuração naquele instante, os toques do minigame e o resultado. Depois do balde, o seed é revelado:
-- qualquer um confere que o resultado saiu dele.

-- ---------------------------------------------------------------------------------------------
-- 1. Estado do jogador no Poço (apresentação do encapuzado + balde escolhido)
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS poco_estado (
  player_id uuid PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  -- Quando a cena da neblina terminou (a moeda do encapuzado é entregue uma vez só, idem 'poco:corvo:<id>').
  apresentado_at timestamptz,
  balde text NOT NULL DEFAULT 'madeira',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------------------------
-- 2. Giros (um por moeda lançada). Auditoria completa por linha.
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS poco_giros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  -- Categoria do sorteio = chave da moeda ('dracma_comum', 'dracma_incomum'…).
  moeda text NOT NULL,
  gratis boolean NOT NULL DEFAULT false,
  -- Dia (horário de Brasília) e ordem do giro grátis naquele dia.
  dia date NOT NULL,
  gratis_n integer,
  balde text NOT NULL DEFAULT 'madeira',
  estado text NOT NULL DEFAULT 'lancado',
  seed text NOT NULL,
  seed_hash text NOT NULL,
  lancado_at timestamptz NOT NULL DEFAULT now(),
  manivela_at timestamptz,
  lento boolean NOT NULL DEFAULT false,
  toques jsonb,
  acertos integer,
  -- Pesos efetivos (configuração + manivela) e se a configuração era provisória.
  pesos jsonb,
  provisorio boolean,
  rolagem double precision,
  categoria_sorteada text,
  categoria text,
  item_key text REFERENCES item_defs(key) ON UPDATE CASCADE,
  lixo text,
  quantidade integer,
  girado_at timestamptz,
  revelado_at timestamptz,
  CONSTRAINT poco_giros_estado_chk CHECK (estado IN ('lancado', 'girando', 'girado', 'revelado')),
  CONSTRAINT poco_giros_categoria_chk CHECK (categoria IS NULL OR categoria IN ('lixo', 'capsula', 'fragmento', 'essencia', 'cosmetico'))
);
-- Giro grátis: no máximo um registro por (jogador, dia, ordem). A ordem vai até poco.giro_gratis_diario.quantidade.
CREATE UNIQUE INDEX IF NOT EXISTS poco_giros_gratis_idx ON poco_giros (player_id, dia, gratis_n) WHERE gratis;
-- Uma moeda por vez no poço: o balde precisa ser inspecionado antes de lançar outra.
CREATE UNIQUE INDEX IF NOT EXISTS poco_giros_aberto_idx ON poco_giros (player_id) WHERE estado <> 'revelado';
CREATE INDEX IF NOT EXISTS poco_giros_player_idx ON poco_giros (player_id, lancado_at DESC);
-- Letreiro: últimos prêmios bons.
CREATE INDEX IF NOT EXISTS poco_giros_bons_idx ON poco_giros (girado_at DESC) WHERE categoria IS NOT NULL AND categoria <> 'lixo';

-- ---------------------------------------------------------------------------------------------
-- 3. Configuração PROVISÓRIA (editável pelo Owner em /api/staff config.definir). Não sobrescreve.
-- ---------------------------------------------------------------------------------------------
INSERT INTO devo_config (key, value, provisional, note) VALUES
  ('poco.manivela',
   '{"max_acertos": 5, "reducao_lixo_por_acerto": 0.08,
     "janelas": [0.26, 0.2, 0.155, 0.12, 0.09],
     "periodos_ms": [1900, 1650, 1450, 1280, 1140],
     "fator_lento": 1.6, "rodada_max_ms": 9000}'::jsonb,
   true, 'PROVISÓRIO: minigame da manivela. Cada acerto reduz o peso do lixo; a janela encolhe e o ponteiro acelera.'),
  ('poco.quantidades', '{"fragmento": [1, 2], "essencia": [1, 3]}'::jsonb,
   true, 'PROVISÓRIO: quantidade [mín, máx] por coleta (antes do multiplicador do balde).'),
  ('poco.raridade_pesos', '{"comum": 50, "incomum": 30, "raro": 14, "epico": 5, "lendario": 1, "arcano": 0}'::jsonb,
   true, 'PROVISÓRIO: dentro da categoria cosmético, peso por raridade (chances reduzidas para os raros).')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------------------------
-- 4. Catálogo: baldes e cápsulas do tempo (dados; textos PROVISÓRIOS para o dono escrever)
-- ---------------------------------------------------------------------------------------------
-- Baldes: kind 'outro', item único. meta.tipo: inicial | normal (aparece bloqueado) | raro (oculto até obter).
-- meta.mult_qtd multiplica a quantidade de fragmentos/essências por coleta (PROVISÓRIO).
INSERT INTO item_defs (key, kind, name, description, rarity, stackable, meta) VALUES
  ('balde:madeira', 'outro', 'Balde de madeira desgastado', 'O balde de todo iniciante. Trágico, rachado e sem qualquer efeito sobre a coleta.', 'comum', false,
   '{"poco_balde": true, "tipo": "inicial", "ordem": 1, "mult_qtd": 1, "efeito": "Nenhum efeito."}'),
  ('balde:ferro', 'outro', 'Balde de ferro batido', 'Pesado e honesto. Volta do fundo com um pouco mais do que levou.', 'incomum', false,
   '{"poco_balde": true, "tipo": "normal", "ordem": 2, "mult_qtd": 1.5, "efeito": "Coleta 1,5× fragmentos e essências.", "provisorio": true}'),
  ('balde:cobre', 'outro', 'Balde de cobre polido', 'O cobre escurece no contato com a água do poço, mas não larga o que pega.', 'raro', false,
   '{"poco_balde": true, "tipo": "normal", "ordem": 3, "mult_qtd": 2, "efeito": "Coleta 2× fragmentos e essências.", "provisorio": true}'),
  ('balde:prata', 'outro', 'Balde de prata votiva', 'Gravado com nomes que ninguém lembra de ter escrito.', 'epico', false,
   '{"poco_balde": true, "tipo": "raro", "ordem": 4, "mult_qtd": 3, "efeito": "Coleta 3× fragmentos e essências.", "provisorio": true}')
ON CONFLICT (key) DO NOTHING;

-- Cápsulas do tempo: vão para o Diário (kind 'capsula', item único). meta.poco = entra no sorteio.
-- TEXTOS PROVISÓRIOS: o dono escreve título e texto de cada cápsula (editar via catálogo do Owner ou aqui).
INSERT INTO item_defs (key, kind, name, description, rarity, stackable, meta)
SELECT 'capsula:' || lpad(n::text, 3, '0'), 'capsula', 'Cápsula do Tempo ' || to_char(n, 'FMRN'),
       'Uma cápsula selada que o Poço devolveu. O conteúdo fica no Diário.', 'raro', false,
       jsonb_build_object('poco', true, 'provisorio', true, 'numero', n,
         'titulo', 'Cápsula do Tempo ' || to_char(n, 'FMRN'),
         'texto', '[TEXTO PROVISÓRIO] O dono vai escrever aqui uma informação ou curiosidade do mundo de DEVO.')
  FROM generate_series(1, 8) AS n
ON CONFLICT (key) DO NOTHING;


-- =============================================================================================
-- scripts/staff-migration.sql
-- =============================================================================================
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


-- =============================================================================================
-- scripts/torres-migration.sql
-- =============================================================================================
-- Torres de Ruptura (DIRECAO-3 §2). Idempotente: pode rodar quantas vezes quiser.
-- Depende de scripts/fundacao-migration.sql (players, item_defs, devo_item_grant/consume, devo_config).
-- Contrato e guia de conteúdo: docs/redesign/TORRES.md.

-- Andares concluídos por jogador. O andar n só entra depois do n−1 (garantido no servidor, com trava por
-- jogador+torre). O custo pago e a essência ficam registrados para auditoria (o livro-razão do inventário
-- também guarda, com idem 'torre:<torre>:andar:<n>:<jogador>:pago').
CREATE TABLE IF NOT EXISTS tower_progress (
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  tower_id text NOT NULL,
  floor integer NOT NULL,
  cost integer NOT NULL DEFAULT 0,
  essence text,
  keys_spent integer NOT NULL DEFAULT 0,
  cleared_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, tower_id, floor),
  CONSTRAINT tower_progress_floor_chk CHECK (floor BETWEEN 1 AND 20),
  CONSTRAINT tower_progress_tower_chk CHECK (tower_id ~ '^[a-z0-9][a-z0-9-]{1,40}$')
);

-- Estado narrativo das Torres por jogador: apresentação do Galo (uma vez), oferta de fã (uma vez) e a
-- reflexão "Anfitrião de quê?" ao sair da aba pela primeira vez.
CREATE TABLE IF NOT EXISTS tower_player (
  player_id uuid PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  galo_intro_at timestamptz,
  galo_fan boolean,
  galo_fan_at timestamptz,
  reflexao_at timestamptz,
  reflexao_escolha integer,
  CONSTRAINT tower_player_reflexao_chk CHECK (reflexao_escolha IS NULL OR reflexao_escolha BETWEEN 1 AND 5)
);

-- Catálogo das torres de exemplo (PROVISÓRIO). Torres novas no conteúdo ganham os itens sozinhas (o servidor
-- cria a essência e a chave que faltarem, sem sobrescrever o que o Owner já editou no catálogo).
INSERT INTO item_defs (key, kind, name, description, rarity, stackable, meta) VALUES
  ('essencia:coruja', 'essencia', 'Essência de Afinidade da Coruja', 'Abre andares da Torre do Observatório. (provisório)', 'incomum', true, '{"npc": "coruja", "torre": "observatorio", "provisorio": true}'),
  ('essencia:javali', 'essencia', 'Essência de Afinidade do Javali', 'Abre andares da Torre do Picadeiro. (provisório)', 'incomum', true, '{"npc": "javali", "torre": "picadeiro", "provisorio": true}'),
  ('chave:observatorio', 'chave', 'Chave do Observatório', 'Entregue a cada andar vencido da Torre do Observatório. Abre andares da Torre do Imperador.', 'incomum', true, '{"torre": "observatorio"}'),
  ('essencia:campanha', 'essencia', 'Essência da Ruptura (provisória)', 'Abre andares da torre principal. Nome e origem a definir pelo dono. (provisório)', 'incomum', true, '{"torre": "campanha", "provisorio": true}'),
  ('chave:imperador', 'chave', 'Chave do Imperador', 'Entregue a cada andar vencido da Torre do Imperador (do Galo). Abre andares da torre principal.', 'incomum', true, '{"torre": "imperador"}'),
  ('chave:picadeiro', 'chave', 'Chave do Picadeiro', 'Entregue a cada andar vencido da Torre do Picadeiro. Abre andares da Torre do Imperador.', 'incomum', true, '{"torre": "picadeiro"}')
ON CONFLICT (key) DO NOTHING;

-- A Essência do Galo já vem da Fundação; marca a torre dela (sem apagar o que houver em meta).
UPDATE item_defs SET meta = meta || '{"torre": "imperador"}'::jsonb WHERE key = 'essencia:galo' AND NOT (meta ? 'torre');


-- =============================================================================================
-- scripts/salao-migration.sql
-- =============================================================================================
-- Salão das Máscaras (DIRECAO-3 §2 e §1b; apresentação do Herdeiro em docs/redesign/DIALOGOS-galo-salao.md).
-- Depende de scripts/fundacao-migration.sql (players, devo_config, card_deliveries, arcade_profiles).
-- Idempotente: rodar duas vezes não quebra nem duplica.
--
-- Regras que o BANCO garante (além do servidor em lib/devo/salao-server.ts):
--   · uma carta (uid do save) só pode estar num lote OU numa oferta do mercado, uma vez só, para sempre:
--     índices únicos (seller_id, card_uid). A carta sai do save na mesma transação em que o lote nasce, e o
--     /api/save descarta qualquer uid que já foi entregue ao Salão (cópia velha do cliente não ressuscita a carta).
--   · lance positivo e inteiro (minutos de Tempo); lote com no máximo um lance "ativo" (o maior).
--   · todo crédito/débito de Tempo do Salão passa por salao_movimentos com idem_key único: o vendedor recebe
--     uma vez, o lance superado é devolvido uma vez, a taxa de divulgação devolvida uma vez.

-- ---------------------------------------------------------------------------------------------
-- 1. Estado do jogador no Salão (apresentação do Herdeiro + tipo de contrato)
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS salao_estado (
  player_id uuid PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  apresentado_at timestamptz,
  -- Aviso "Anunciar no Salão das Máscaras" (texto de sistema) já lido.
  aviso_anunciar_at timestamptz,
  -- Tipo de contrato (chave de devo_config['salao.contratos']). Define as taxas.
  contrato text NOT NULL DEFAULT 'avulso',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------------------------
-- 2. Lotes (Bandeja → avaliação do especialista → edição do leilão)
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS salao_lotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero serial,
  seller_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  card_uid text NOT NULL,
  card_id text NOT NULL,
  card_rarity text NOT NULL,
  contrato text NOT NULL,
  -- Taxas congeladas no envio (a configuração pode mudar depois).
  taxa_divulgacao integer NOT NULL DEFAULT 0,
  comissao_pct numeric(5, 2) NOT NULL DEFAULT 0,
  lance_minimo integer NOT NULL,
  incremento integer NOT NULL,
  -- avaliacao → aprovado (entra na edição) → vendido | devolvido; avaliacao → recusado | retirado.
  status text NOT NULL DEFAULT 'avaliacao',
  -- Índice da edição (0, 1, 2… a partir da âncora do calendário). Nulo até aprovar.
  edicao integer,
  nota text,
  avaliado_por uuid REFERENCES players(id) ON DELETE SET NULL,
  avaliado_at timestamptz,
  vencedor_id uuid REFERENCES players(id) ON DELETE SET NULL,
  valor_final integer,
  repasse integer,
  encerrado_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT salao_lotes_status_chk CHECK (status IN ('avaliacao', 'aprovado', 'recusado', 'retirado', 'vendido', 'devolvido')),
  CONSTRAINT salao_lotes_valores_chk CHECK (lance_minimo > 0 AND incremento > 0 AND taxa_divulgacao >= 0
    AND comissao_pct >= 0 AND comissao_pct <= 100 AND (valor_final IS NULL OR valor_final > 0) AND (repasse IS NULL OR repasse >= 0))
);
CREATE UNIQUE INDEX IF NOT EXISTS salao_lotes_carta_idx ON salao_lotes (seller_id, card_uid);
CREATE INDEX IF NOT EXISTS salao_lotes_edicao_idx ON salao_lotes (edicao, status);
CREATE INDEX IF NOT EXISTS salao_lotes_avaliacao_idx ON salao_lotes (created_at) WHERE status = 'avaliacao';

CREATE TABLE IF NOT EXISTS salao_lances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id uuid NOT NULL REFERENCES salao_lotes(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  valor integer NOT NULL,
  -- ativo (o maior) → superado (devolvido) | vencedor.
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT salao_lances_valor_chk CHECK (valor > 0),
  CONSTRAINT salao_lances_status_chk CHECK (status IN ('ativo', 'superado', 'vencedor'))
);
CREATE UNIQUE INDEX IF NOT EXISTS salao_lances_ativo_idx ON salao_lances (lote_id) WHERE status = 'ativo';
CREATE INDEX IF NOT EXISTS salao_lances_lote_idx ON salao_lances (lote_id, valor DESC);
CREATE INDEX IF NOT EXISTS salao_lances_player_idx ON salao_lances (player_id, created_at DESC);

-- ---------------------------------------------------------------------------------------------
-- 3. Mercado (compra/venda direta de cartas entre jogadores, preço fixo em Tempo)
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS salao_mercado (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  card_uid text NOT NULL,
  card_id text NOT NULL,
  card_rarity text NOT NULL,
  preco integer NOT NULL,
  comissao_pct numeric(5, 2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'ativa',
  comprador_id uuid REFERENCES players(id) ON DELETE SET NULL,
  repasse integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  fechada_at timestamptz,
  CONSTRAINT salao_mercado_status_chk CHECK (status IN ('ativa', 'vendida', 'retirada')),
  CONSTRAINT salao_mercado_preco_chk CHECK (preco > 0 AND comissao_pct >= 0 AND comissao_pct <= 100)
);
CREATE UNIQUE INDEX IF NOT EXISTS salao_mercado_carta_idx ON salao_mercado (seller_id, card_uid);
CREATE INDEX IF NOT EXISTS salao_mercado_ativa_idx ON salao_mercado (created_at DESC) WHERE status = 'ativa';

-- ---------------------------------------------------------------------------------------------
-- 4. Propostas e anúncios (inclui recrutamento de Corporações e propagandas)
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS salao_anuncios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autor_id uuid REFERENCES players(id) ON DELETE SET NULL,
  tipo text NOT NULL,
  titulo text NOT NULL,
  texto text NOT NULL,
  -- Recrutamento: nome/código da Corporação (o agente de Corporações publica por publicarRecrutamento()).
  corporacao text,
  custo integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pendente',
  avaliado_por uuid REFERENCES players(id) ON DELETE SET NULL,
  avaliado_at timestamptz,
  nota text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expira_at timestamptz,
  CONSTRAINT salao_anuncios_tipo_chk CHECK (tipo IN ('proposta', 'propaganda', 'recrutamento')),
  CONSTRAINT salao_anuncios_status_chk CHECK (status IN ('pendente', 'publicado', 'recusado', 'retirado')),
  CONSTRAINT salao_anuncios_texto_chk CHECK (char_length(titulo) BETWEEN 3 AND 80 AND char_length(texto) BETWEEN 3 AND 600 AND custo >= 0)
);
CREATE INDEX IF NOT EXISTS salao_anuncios_pub_idx ON salao_anuncios (created_at DESC) WHERE status = 'publicado';
CREATE INDEX IF NOT EXISTS salao_anuncios_pend_idx ON salao_anuncios (created_at) WHERE status = 'pendente';

-- ---------------------------------------------------------------------------------------------
-- 5. Eventos quinzenais e especiais (Calendário Devo). Conteúdo PROVISÓRIO, editável pelo Owner.
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS salao_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL DEFAULT 'especial',
  titulo text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  inicio timestamptz NOT NULL,
  fim timestamptz NOT NULL,
  -- Rótulos curtos do que o evento oferece (cartas comemorativas, essências raras, fragmentos, teatro…).
  destaques text[] NOT NULL DEFAULT '{}',
  provisorio boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES players(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT salao_eventos_tipo_chk CHECK (tipo IN ('quinzenal', 'especial', 'teatro')),
  CONSTRAINT salao_eventos_datas_chk CHECK (fim > inicio)
);
CREATE INDEX IF NOT EXISTS salao_eventos_inicio_idx ON salao_eventos (inicio);

-- ---------------------------------------------------------------------------------------------
-- 6. Livro de Tempo do Salão (auditoria + idempotência de cada crédito/débito)
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS salao_movimentos (
  id bigserial PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  -- Minutos: negativo = débito (sai do pulso na hora), positivo = crédito (livro-caixa do Tempo).
  minutos integer NOT NULL,
  motivo text NOT NULL,
  ref uuid,
  idem_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT salao_movimentos_chk CHECK (minutos <> 0)
);
CREATE INDEX IF NOT EXISTS salao_movimentos_player_idx ON salao_movimentos (player_id, created_at DESC);

-- ---------------------------------------------------------------------------------------------
-- 7. Configuração PROVISÓRIA (editável pelo Owner em /api/staff config.definir). Não sobrescreve.
-- ---------------------------------------------------------------------------------------------
INSERT INTO devo_config (key, value, provisional, note) VALUES
  ('salao.calendario',
   '{"ancora": "2026-10-15T20:00:00-03:00", "intervalo_dias": 3, "duracao_horas": 24, "forcar": null}'::jsonb,
   true, 'PROVISÓRIO: o Salão abre a cada intervalo_dias a partir da âncora (horário de Brasília) e fica aberto duracao_horas. forcar: "aberto" | "fechado" | null (manual do Owner).'),
  ('salao.bandeja',
   '{"raridade_minima": "incomum", "vagas_por_edicao": 12, "max_por_jogador": 3, "lance_minimo": 30, "incremento": 10, "reserva_min": 30}'::jsonb,
   true, 'PROVISÓRIO: raridade mínima das cartas (comum < incomum < rara < lendaria), vagas por edição, lotes ativos por jogador, lance mínimo e incremento padrão (minutos de Tempo) e Tempo mínimo que o pulso precisa manter depois de pagar.'),
  ('salao.contratos',
   '{"avulso": {"nome": "Contrato Avulso", "divulgacao": 20, "comissao_pct": 15, "ordem": 1},
     "patrono": {"nome": "Contrato de Patrono", "divulgacao": 10, "comissao_pct": 10, "ordem": 2},
     "mecenas": {"nome": "Contrato de Mecenas", "divulgacao": 5, "comissao_pct": 5, "ordem": 3}}'::jsonb,
   true, 'PROVISÓRIO: taxa de divulgação (minutos, paga no envio; devolvida se o especialista recusar) e comissão sobre a venda (%), por tipo de contrato.'),
  ('salao.anuncios',
   '{"custo_propaganda": 60, "duracao_dias": 9}'::jsonb,
   true, 'PROVISÓRIO: custo de uma propaganda (minutos de Tempo; propostas não têm custo inicial) e quantos dias o anúncio fica no mural.')
ON CONFLICT (key) DO NOTHING;

-- Eventos PROVISÓRIOS do Calendário Devo (o dono define os definitivos; o Owner edita/remove pelo calendário).
INSERT INTO salao_eventos (id, tipo, titulo, descricao, inicio, fim, destaques, provisorio) VALUES
  ('5a1a0000-0000-4000-8000-000000000001', 'quinzenal', 'Gala Quinzenal das Máscaras',
   '[PROVISÓRIO] Edição comemorativa do leilão: lotes da casa entram junto com os dos jogadores.',
   '2026-10-30T20:00:00-03:00', '2026-10-31T20:00:00-03:00', ARRAY['Cartas comemorativas', 'Essências de afinidade raras'], true),
  ('5a1a0000-0000-4000-8000-000000000002', 'teatro', 'Récita no Camarote Negro',
   '[PROVISÓRIO] Uma peça encenada no palco do Salão antes da abertura dos lances.',
   '2026-11-06T21:00:00-03:00', '2026-11-06T23:00:00-03:00', ARRAY['Peça de teatro'], true),
  ('5a1a0000-0000-4000-8000-000000000003', 'quinzenal', 'Gala Quinzenal das Máscaras',
   '[PROVISÓRIO] Segunda gala do ciclo: fragmentos arcanos entre os lotes da casa.',
   '2026-11-13T20:00:00-03:00', '2026-11-14T20:00:00-03:00', ARRAY['Fragmentos arcanos', 'Cartas comemorativas'], true)
ON CONFLICT (id) DO NOTHING;


-- =============================================================================================
-- scripts/cosmeticos-migration.sql
-- =============================================================================================
-- Cosméticos (texto do dono "Sistema de Cosméticos" §1–§14; DIRECAO-3 §5). Idempotente.
-- Depende da Fundação (item_defs, player_items, item_ledger, devo_config, admin_log, staff_authorizations).
-- Contrato: docs/redesign/FUNDACAO.md §12.

-- ---------------------------------------------------------------------------------------------
-- 1. Temporários (futuro): posse com validade. NULL = permanente (padrão de hoje).
-- ---------------------------------------------------------------------------------------------
ALTER TABLE player_items ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- ---------------------------------------------------------------------------------------------
-- 2. Equipados por jogador: 1 moldura de avatar, 1 de miniperfil, 1 emblema principal, 1 balão, 1 efeito.
--    A posse é conferida no servidor (lib/devo/cosmeticos-server.ts); o Owner equipa qualquer item.
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS player_cosmetics (
  player_id uuid PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  moldura_avatar text REFERENCES item_defs(key) ON UPDATE CASCADE ON DELETE SET NULL,
  moldura_mini text REFERENCES item_defs(key) ON UPDATE CASCADE ON DELETE SET NULL,
  emblema text REFERENCES item_defs(key) ON UPDATE CASCADE ON DELETE SET NULL,
  balao text REFERENCES item_defs(key) ON UPDATE CASCADE ON DELETE SET NULL,
  efeito text REFERENCES item_defs(key) ON UPDATE CASCADE ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------------------------
-- 3. Assets enviados pelo Owner (SVG/PNG/WebP, até 400 KB). Servidos por GET /api/cosmeticos?view=asset&id=…
--    com CSP fechada; nas telas entram como <img> (SVG em <img> não executa script).
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cosmetic_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mime text NOT NULL CHECK (mime IN ('image/svg+xml', 'image/png', 'image/webp')),
  data bytea NOT NULL,
  bytes integer NOT NULL CHECK (bytes > 0 AND bytes <= 400000),
  created_by uuid REFERENCES players(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------------------------
-- 4. Recompensas semanais dos jogos (§8): plano por semana → na distribuição vira propostas 'semanal'
--    (reward_proposals) para cada vencedor, no fluxo de aprovação da Fundação.
--    Owner cria e aprova; Anfitrião propõe (aprova/distribui só com autorização 'recompensa.semanal');
--    Dealer só sugere. Mudança relevante numa aprovada volta para 'proposta' (gatilho abaixo).
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS weekly_reward_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL,
  game text NOT NULL DEFAULT 'geral',
  criterion text NOT NULL,
  resource text NOT NULL,
  resource_key text,
  quantity integer NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'proposta',
  proposed_by uuid REFERENCES players(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES players(id) ON DELETE SET NULL,
  approved_at timestamptz,
  distributed_by uuid REFERENCES players(id) ON DELETE SET NULL,
  distributed_at timestamptz,
  distributed_count integer NOT NULL DEFAULT 0,
  revision integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT weekly_plans_criterion_chk CHECK (criterion IN ('top1', 'top3', 'top10', 'participacao')),
  CONSTRAINT weekly_plans_resource_chk CHECK (resource IN ('item', 'tempo', 'carta', 'convite')),
  CONSTRAINT weekly_plans_qty_chk CHECK (quantity > 0 AND quantity <= 1000000),
  CONSTRAINT weekly_plans_status_chk CHECK (status IN ('sugerida', 'proposta', 'aprovada', 'rejeitada', 'distribuida', 'cancelada'))
);
CREATE INDEX IF NOT EXISTS weekly_reward_plans_week_idx ON weekly_reward_plans (week_start DESC);

CREATE TABLE IF NOT EXISTS weekly_reward_log (
  id bigserial PRIMARY KEY,
  plan_id uuid NOT NULL REFERENCES weekly_reward_plans(id) ON DELETE CASCADE,
  at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid REFERENCES players(id) ON DELETE SET NULL,
  action text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE OR REPLACE FUNCTION devo_weekly_plan_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IN ('distribuida', 'cancelada') THEN
    RAISE EXCEPTION 'PLANO_FECHADO';
  END IF;
  IF (NEW.week_start, NEW.game, NEW.criterion, NEW.resource, coalesce(NEW.resource_key, ''), NEW.quantity)
     IS DISTINCT FROM (OLD.week_start, OLD.game, OLD.criterion, OLD.resource, coalesce(OLD.resource_key, ''), OLD.quantity) THEN
    IF OLD.status IN ('aprovada', 'rejeitada') AND NEW.status = OLD.status THEN
      NEW.status := 'proposta';
      NEW.approved_by := NULL;
      NEW.approved_at := NULL;
    END IF;
    NEW.revision := OLD.revision + 1;
  END IF;
  IF NEW.status = 'distribuida' AND OLD.status <> 'aprovada' THEN
    RAISE EXCEPTION 'PLANO_SEM_APROVACAO';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS weekly_plan_guard ON weekly_reward_plans;
CREATE TRIGGER weekly_plan_guard BEFORE UPDATE ON weekly_reward_plans FOR EACH ROW EXECUTE FUNCTION devo_weekly_plan_guard();

-- ---------------------------------------------------------------------------------------------
-- 5. Raridades configuráveis (rótulo, cor e brilho por raridade). PROVISÓRIO até o dono definir.
-- ---------------------------------------------------------------------------------------------
INSERT INTO devo_config (key, value, provisional, note) VALUES
  ('cosmeticos.raridades',
   '{"comum":    {"label": "Comum",    "cor": "#8f8e8b", "brilho": "rgba(143,142,139,0)"},
     "incomum":  {"label": "Incomum",  "cor": "#b7b3a8", "brilho": "rgba(183,179,168,.25)"},
     "raro":     {"label": "Raro",     "cor": "#d9d8d4", "brilho": "rgba(217,216,212,.35)"},
     "epico":    {"label": "Épico",    "cor": "#c98a95", "brilho": "rgba(163,46,64,.35)"},
     "lendario": {"label": "Lendário", "cor": "#e3d3ae", "brilho": "rgba(214,190,140,.4)"},
     "arcano":   {"label": "Arcano",   "cor": "#c2b9ec", "brilho": "rgba(138,124,200,.5)"}}'::jsonb,
   true, 'Rótulo, cor e brilho de cada raridade dos cosméticos (provisório).')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------------------------
-- 6. Coleção inicial (§3). meta.asset 'devo:<grupo>/<id>' = arte desenhada no código
--    (components/devo/cosmeticos/art). ON CONFLICT DO NOTHING: edições do Owner nunca são sobrescritas.
--    meta.poco = true → pode sair no Poço (peso por raridade em devo_config['poco.raridade_pesos']).
-- ---------------------------------------------------------------------------------------------
INSERT INTO item_defs (key, kind, name, description, rarity, stackable, meta) VALUES
  -- Molduras de avatar
  ('cosmetico:moldura-heranca-marfim', 'cosmetico', 'Herança de Marfim', 'Filigrana de prata, pérolas e um camafeu de família. Passa de mão em mão sem perder o brilho.', 'raro', false,
   '{"categoria": "moldura_avatar", "asset": "devo:moldura/heranca-marfim", "animado": false, "poco": true, "origem": "poco", "par": "cosmetico:mini-heranca-marfim", "ordem": 10}'),
  ('cosmetico:moldura-relogio-fim', 'cosmetico', 'Relógio do Fim', 'Mostrador em arco, engrenagens à mostra e um pêndulo curto. Marca o tempo que ainda resta.', 'epico', false,
   '{"categoria": "moldura_avatar", "asset": "devo:moldura/relogio-fim", "animado": true, "poco": false, "origem": "semanal", "par": "cosmetico:mini-relogio-fim", "ordem": 20}'),
  ('cosmetico:moldura-pacto-carmesim', 'cosmetico', 'Pacto Carmesim', 'Ferro enegrecido preso por ramos de espinhos e rosas cor de vinho. Um acordo que não se desfaz.', 'epico', false,
   '{"categoria": "moldura_avatar", "asset": "devo:moldura/pacto-carmesim", "animado": false, "poco": true, "origem": "poco", "par": "cosmetico:mini-pacto-carmesim", "ordem": 30}'),
  ('cosmetico:moldura-olho-arcano', 'cosmetico', 'Olho do Arcano', 'Arco de aço com um olho atento no alto, glifos em volta e cristais de ametista.', 'lendario', false,
   '{"categoria": "moldura_avatar", "asset": "devo:moldura/olho-arcano", "animado": true, "poco": true, "origem": "poco", "par": "cosmetico:mini-olho-arcano", "ordem": 40}'),
  ('cosmetico:moldura-banquete-javali', 'cosmetico', 'Banquete do Javali', 'Ouro envelhecido, presas no alto e a mesa posta: cartas e fichas da casa do Javali.', 'lendario', false,
   '{"categoria": "moldura_avatar", "asset": "devo:moldura/banquete-javali", "animado": false, "poco": false, "origem": "semanal", "par": "cosmetico:mini-banquete-javali", "ordem": 50}'),
  ('cosmetico:moldura-asas-coruja', 'cosmetico', 'Asas da Coruja', 'Penas de prata abertas sob uma lua crescente. Quem vigia à noite também é vigiado.', 'raro', false,
   '{"categoria": "moldura_avatar", "asset": "devo:moldura/asas-coruja", "animado": false, "poco": true, "origem": "poco", "par": "cosmetico:mini-asas-coruja", "ordem": 60}'),
  ('cosmetico:moldura-fortuna-rato', 'cosmetico', 'Fortuna do Rato', 'Moedas antigas, uma corrente fina e um dado que sempre cai do lado certo.', 'incomum', false,
   '{"categoria": "moldura_avatar", "asset": "devo:moldura/fortuna-rato", "animado": false, "poco": true, "origem": "poco", "par": "cosmetico:mini-fortuna-rato", "ordem": 70}'),
  ('cosmetico:moldura-ultima-badalada', 'cosmetico', 'Última Badalada', 'Um relógio que não pertence a este mundo. O pêndulo não para e o sino toca uma última vez.', 'arcano', false,
   '{"categoria": "moldura_avatar", "asset": "devo:moldura/ultima-badalada", "animado": true, "poco": false, "origem": "deadly_vote", "par": "cosmetico:mini-ultima-badalada", "ordem": 80}'),
  -- Molduras de miniperfil (mesma identidade, formato quadrado)
  ('cosmetico:mini-heranca-marfim', 'cosmetico', 'Herança de Marfim', 'Versão do miniperfil: marfim, pérolas e o camafeu no alto.', 'raro', false,
   '{"categoria": "moldura_mini", "asset": "devo:moldura/heranca-marfim", "animado": false, "poco": true, "origem": "poco", "par": "cosmetico:moldura-heranca-marfim", "ordem": 10}'),
  ('cosmetico:mini-relogio-fim', 'cosmetico', 'Relógio do Fim', 'Versão do miniperfil: meio mostrador e engrenagens nos cantos.', 'epico', false,
   '{"categoria": "moldura_mini", "asset": "devo:moldura/relogio-fim", "animado": true, "poco": false, "origem": "semanal", "par": "cosmetico:moldura-relogio-fim", "ordem": 20}'),
  ('cosmetico:mini-pacto-carmesim', 'cosmetico', 'Pacto Carmesim', 'Versão do miniperfil: duas rosas fechando os cantos.', 'epico', false,
   '{"categoria": "moldura_mini", "asset": "devo:moldura/pacto-carmesim", "animado": false, "poco": true, "origem": "poco", "par": "cosmetico:moldura-pacto-carmesim", "ordem": 30}'),
  ('cosmetico:mini-olho-arcano', 'cosmetico', 'Olho do Arcano', 'Versão do miniperfil: o olho no alto e cristais nos lados.', 'lendario', false,
   '{"categoria": "moldura_mini", "asset": "devo:moldura/olho-arcano", "animado": true, "poco": true, "origem": "poco", "par": "cosmetico:moldura-olho-arcano", "ordem": 40}'),
  ('cosmetico:mini-banquete-javali', 'cosmetico', 'Banquete do Javali', 'Versão do miniperfil: presas, uma carta e duas fichas.', 'lendario', false,
   '{"categoria": "moldura_mini", "asset": "devo:moldura/banquete-javali", "animado": false, "poco": false, "origem": "semanal", "par": "cosmetico:moldura-banquete-javali", "ordem": 50}'),
  ('cosmetico:mini-asas-coruja', 'cosmetico', 'Asas da Coruja', 'Versão do miniperfil: asas pequenas e a lua.', 'raro', false,
   '{"categoria": "moldura_mini", "asset": "devo:moldura/asas-coruja", "animado": false, "poco": true, "origem": "poco", "par": "cosmetico:moldura-asas-coruja", "ordem": 60}'),
  ('cosmetico:mini-fortuna-rato', 'cosmetico', 'Fortuna do Rato', 'Versão do miniperfil: corrente, moedas e o dado.', 'incomum', false,
   '{"categoria": "moldura_mini", "asset": "devo:moldura/fortuna-rato", "animado": false, "poco": true, "origem": "poco", "par": "cosmetico:moldura-fortuna-rato", "ordem": 70}'),
  ('cosmetico:mini-ultima-badalada', 'cosmetico', 'Última Badalada', 'Versão do miniperfil: o mostrador inteiro em volta do rosto.', 'arcano', false,
   '{"categoria": "moldura_mini", "asset": "devo:moldura/ultima-badalada", "animado": true, "poco": false, "origem": "deadly_vote", "par": "cosmetico:moldura-ultima-badalada", "ordem": 80}'),
  -- Emblemas
  ('cosmetico:emblema-rosa-sangue', 'cosmetico', 'Rosa de Sangue', 'Uma rosa que ainda pinga. Ninguém pergunta de quem.', 'raro', false,
   '{"categoria": "emblema", "asset": "devo:emblema/rosa-sangue", "animado": false, "poco": true, "origem": "poco", "ordem": 10}'),
  ('cosmetico:emblema-coroa-partida', 'cosmetico', 'Coroa Partida', 'As duas metades de uma coroa que não voltou a se fechar.', 'epico', false,
   '{"categoria": "emblema", "asset": "devo:emblema/coroa-partida", "animado": false, "poco": true, "origem": "poco", "ordem": 20}'),
  ('cosmetico:emblema-ampulheta-dourada', 'cosmetico', 'Ampulheta Dourada', 'A areia corre devagar para quem tem tempo de sobra.', 'incomum', false,
   '{"categoria": "emblema", "asset": "devo:emblema/ampulheta-dourada", "animado": false, "poco": true, "origem": "poco", "ordem": 30}'),
  ('cosmetico:emblema-olho-destino', 'cosmetico', 'Olho do Destino', 'Vê o que vem antes de chegar. Às vezes pisca.', 'lendario', false,
   '{"categoria": "emblema", "asset": "devo:emblema/olho-destino", "animado": true, "poco": true, "origem": "poco", "ordem": 40}'),
  ('cosmetico:emblema-chave-proibida', 'cosmetico', 'Chave Proibida', 'Abre uma porta que ninguém deveria abrir.', 'raro', false,
   '{"categoria": "emblema", "asset": "devo:emblema/chave-proibida", "animado": false, "poco": true, "origem": "poco", "ordem": 50}'),
  ('cosmetico:emblema-as-espadas', 'cosmetico', 'Ás de Espadas', 'A carta mais alta da mesa, ou a última.', 'comum', false,
   '{"categoria": "emblema", "asset": "devo:emblema/as-espadas", "animado": false, "poco": true, "origem": "poco", "ordem": 60}'),
  ('cosmetico:emblema-lua-escarlate', 'cosmetico', 'Lua Escarlate', 'Nasce vermelha nas noites em que alguém não volta.', 'epico', false,
   '{"categoria": "emblema", "asset": "devo:emblema/lua-escarlate", "animado": true, "poco": true, "origem": "poco", "ordem": 70}'),
  ('cosmetico:emblema-fragmento-celestial', 'cosmetico', 'Fragmento Celestial', 'Lasca de uma estrela que caiu durante um Deadly Vote.', 'arcano', false,
   '{"categoria": "emblema", "asset": "devo:emblema/fragmento-celestial", "animado": true, "poco": false, "origem": "deadly_vote", "ordem": 80}'),
  ('cosmetico:emblema-engrenagem-herdeiro', 'cosmetico', 'Engrenagem do Herdeiro', 'Peça de um mecanismo que só o Herdeiro sabe montar.', 'epico', false,
   '{"categoria": "emblema", "asset": "devo:emblema/engrenagem-herdeiro", "animado": true, "poco": false, "origem": "semanal", "ordem": 90}'),
  ('cosmetico:emblema-pena-coruja', 'cosmetico', 'Pena de Prata', 'Caiu da asa da Coruja numa noite de lua fina.', 'incomum', false,
   '{"categoria": "emblema", "asset": "devo:emblema/pena-coruja", "animado": false, "poco": true, "origem": "poco", "ordem": 100}'),
  ('cosmetico:emblema-ficha-javali', 'cosmetico', 'Ficha do Javali', 'Ficha da casa. Vale o que o Javali disser que vale.', 'comum', false,
   '{"categoria": "emblema", "asset": "devo:emblema/ficha-javali", "animado": false, "poco": false, "origem": "semanal", "ordem": 110}'),
  ('cosmetico:emblema-selo-anfitriao', 'cosmetico', 'Selo do Anfitrião', 'Insígnia dos Anfitriões do DEVO. Aparece sozinha ao lado do nome de quem recebe os convidados.', 'lendario', false,
   '{"categoria": "emblema", "asset": "devo:emblema/selo-anfitriao", "animado": false, "poco": false, "origem": "anfitriao", "automatico": true, "ordem": 999}'),
  -- Balões de chat
  ('cosmetico:balao-correspondencia-real', 'cosmetico', 'Correspondência Real', 'Papel de carta com filigrana de ouro e lacre de cera.', 'raro', false,
   '{"categoria": "balao", "asset": "devo:balao/correspondencia-real", "animado": false, "poco": true, "origem": "poco", "ordem": 10}'),
  ('cosmetico:balao-confissao-carmesim', 'cosmetico', 'Confissão Carmesim', 'Vinho escuro, rosas nos cantos. Para o que se diz baixo.', 'epico', false,
   '{"categoria": "balao", "asset": "devo:balao/confissao-carmesim", "animado": false, "poco": true, "origem": "poco", "ordem": 20}'),
  ('cosmetico:balao-ecos-arcano', 'cosmetico', 'Ecos do Arcano', 'Fundo de noite com glifos que acendem devagar.', 'lendario', false,
   '{"categoria": "balao", "asset": "devo:balao/ecos-arcano", "animado": true, "poco": true, "origem": "poco", "ordem": 30}'),
  ('cosmetico:balao-ultimo-suspiro', 'cosmetico', 'Último Suspiro', 'Tons frios e um pequeno relógio que não para.', 'raro', false,
   '{"categoria": "balao", "asset": "devo:balao/ultimo-suspiro", "animado": true, "poco": true, "origem": "poco", "ordem": 40}'),
  ('cosmetico:balao-mesa-destino', 'cosmetico', 'Mesa do Destino', 'Feltro da mesa, uma carta e uma ficha. A aposta está feita.', 'incomum', false,
   '{"categoria": "balao", "asset": "devo:balao/mesa-destino", "animado": false, "poco": false, "origem": "semanal", "ordem": 50}'),
  -- Efeitos do nome (efeitos especiais)
  ('cosmetico:efeito-assinatura-noturna', 'cosmetico', 'Assinatura Noturna', 'O nome escrito em itálico de aço, com um brilho de ametista.', 'arcano', false,
   '{"categoria": "efeito", "asset": "devo:efeito/assinatura-noturna", "animado": false, "poco": false, "origem": "evento", "ordem": 10}'),
  ('cosmetico:efeito-brasa-carmesim', 'cosmetico', 'Brasa Carmesim', 'O nome em letra de estandarte, cor de brasa.', 'epico', false,
   '{"categoria": "efeito", "asset": "devo:efeito/brasa-carmesim", "animado": false, "poco": false, "origem": "deadly_vote", "ordem": 20}'),
  ('cosmetico:efeito-geada-prata', 'cosmetico', 'Geada de Prata', 'O nome em prata fria, com um reflexo que passa de vez em quando.', 'raro', false,
   '{"categoria": "efeito", "asset": "devo:efeito/geada-prata", "animado": true, "poco": false, "origem": "semanal", "ordem": 30}')
ON CONFLICT (key) DO NOTHING;


-- =============================================================================================
-- scripts/virtudes-migration.sql
-- =============================================================================================
-- Virtudes e Pontos de Potencial (DIRECAO-3 §2; docs/redesign/VIRTUDES.md). Idempotente.
-- Depende de scripts/fundacao-migration.sql (players.arcano/arcano_estagio, devo_config, admin_log).
-- Contrato: docs/redesign/FUNDACAO.md §13. Regra do dono: os números ficam aqui e na Mesa; o jogador só vê
-- rótulos qualitativos (afinidade, quanto acumulou, para onde pendeu).

-- P.P. acumulados no Estágio atual, por Virtude (o "nutriente" da metamorfose). A soma nunca passa do teto
-- do Estágio (devo_virtude_pp_add). Zeram na Evolução de Estágio.
CREATE TABLE IF NOT EXISTS virtude_pp (
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  virtude text NOT NULL,
  pp numeric(12, 2) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, virtude),
  CONSTRAINT virtude_pp_virtude_chk CHECK (virtude IN ('paus', 'copas', 'ouros', 'espadas', 'tacas', 'escudos')),
  CONSTRAINT virtude_pp_pp_chk CHECK (pp >= 0)
);

-- Atributos de fato (o que o bot usa): somam os ganhos de cada Evolução de Estágio.
CREATE TABLE IF NOT EXISTS virtude_nivel (
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  virtude text NOT NULL,
  valor numeric(14, 2) NOT NULL DEFAULT 0,
  PRIMARY KEY (player_id, virtude),
  CONSTRAINT virtude_nivel_virtude_chk CHECK (virtude IN ('paus', 'copas', 'ouros', 'espadas', 'tacas', 'escudos'))
);

-- Livro de toda entrada de P.P.: pedido (o que a fonte quis dar) e aplicado (o que coube no teto).
-- idem_key: a mesma chave nunca soma duas vezes (ex.: 'jogo:<partida>', 'dv:<voto>:<jogador>:participacao').
CREATE TABLE IF NOT EXISTS virtude_pp_log (
  id bigserial PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  virtude text NOT NULL,
  pedido numeric(12, 2) NOT NULL,
  aplicado numeric(12, 2) NOT NULL,
  estagio integer NOT NULL,
  motivo text NOT NULL,
  ref text,
  actor_id uuid REFERENCES players(id) ON DELETE SET NULL,
  idem_key text UNIQUE,
  at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS virtude_pp_log_player_idx ON virtude_pp_log (player_id, at DESC);

-- Histórico de Evoluções de Estágio (quem disparou, quanto havia, como se espalhou).
CREATE TABLE IF NOT EXISTS virtude_evolucoes (
  id bigserial PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  arcano text,
  de_estagio integer NOT NULL,
  para_estagio integer NOT NULL,
  total numeric(12, 2) NOT NULL,
  acumulado jsonb NOT NULL DEFAULT '{}',
  ganhos jsonb NOT NULL DEFAULT '{}',
  actor_id uuid REFERENCES players(id) ON DELETE SET NULL,
  at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT virtude_evolucoes_estagio_chk CHECK (para_estagio = de_estagio + 1)
);
CREATE INDEX IF NOT EXISTS virtude_evolucoes_player_idx ON virtude_evolucoes (player_id, at DESC);

-- ---------------------------------------------------------------------------------------------
-- Configuração (PROVISÓRIA, editável pelo Owner na Mesa › Virtudes)
-- ---------------------------------------------------------------------------------------------
INSERT INTO devo_config (key, value, provisional, note) VALUES
  ('virtudes.afinidades', $json${"fonte":"Google Doc do dono \"Cópia de Upgrade Virtudes\" (lido em 16/10/2026). Ordem 1 = maior afinidade, 6 = menor; colunas paus, copas, ouros, espadas, tacas, escudos.","escala":[0.5,0.25,0.15,0.1,0.05,0.015],"ordem":{"louco":{"paus":6,"copas":3,"ouros":4,"espadas":1,"tacas":2,"escudos":5},"mago":{"paus":6,"copas":5,"ouros":2,"espadas":3,"tacas":1,"escudos":4},"sacerdotisa":{"paus":6,"copas":2,"ouros":3,"espadas":5,"tacas":1,"escudos":4},"imperatriz":{"paus":6,"copas":3,"ouros":4,"espadas":5,"tacas":1,"escudos":2},"imperador":{"paus":4,"copas":5,"ouros":6,"espadas":3,"tacas":2,"escudos":1},"hierofante":{"paus":5,"copas":6,"ouros":3,"espadas":2,"tacas":1,"escudos":4},"enamorados":{"paus":5,"copas":3,"ouros":4,"espadas":6,"tacas":2,"escudos":1},"carro":{"paus":3,"copas":2,"ouros":5,"espadas":1,"tacas":6,"escudos":4},"forca":{"paus":2,"copas":1,"ouros":6,"espadas":3,"tacas":5,"escudos":4},"eremita":{"paus":4,"copas":2,"ouros":1,"espadas":3,"tacas":6,"escudos":5},"fortuna":{"paus":4,"copas":6,"ouros":1,"espadas":5,"tacas":2,"escudos":3},"justica":{"paus":4,"copas":6,"ouros":2,"espadas":1,"tacas":5,"escudos":3},"enforcado":{"paus":1,"copas":5,"ouros":2,"espadas":6,"tacas":4,"escudos":3},"morte":{"paus":6,"copas":5,"ouros":2,"espadas":3,"tacas":1,"escudos":4},"temperanca":{"paus":1,"copas":2,"ouros":3,"espadas":4,"tacas":5,"escudos":6},"diabo":{"paus":6,"copas":1,"ouros":5,"espadas":4,"tacas":2,"escudos":3},"torre":{"paus":1,"copas":2,"ouros":4,"espadas":5,"tacas":6,"escudos":3},"estrela":{"paus":4,"copas":5,"ouros":3,"espadas":6,"tacas":1,"escudos":2},"lua":{"paus":6,"copas":5,"ouros":1,"espadas":4,"tacas":3,"escudos":2},"sol":{"paus":4,"copas":1,"ouros":5,"espadas":3,"tacas":6,"escudos":2},"julgamento":{"paus":3,"copas":2,"ouros":6,"espadas":1,"tacas":5,"escudos":4},"mundo":{"paus":4,"copas":6,"ouros":3,"espadas":5,"tacas":2,"escudos":1}},"divergencias":{"imperador":{"confirmar":true,"nota":"A lista do corpo do doc difere da tabela: lista dá Ouros ×0,25 (2º), Taças ×0,015 (6º) e Paus e Copas empatados em ×0,10; a tabela dá Taças 2º, Paus 4º, Copas 5º e Ouros 6º. Em uso: a tabela."},"lua":{"confirmar":true,"nota":"Aparece duas vezes no corpo com valores diferentes, e nenhuma das duas listas bate com a tabela. Tabela: Paus 6º, Copas 5º. As duas listas: Copas 6º, Paus 5º; a primeira ainda troca Taças (2º) e Escudos (3º). Em uso: a tabela."},"imperatriz":{"confirmar":true,"nota":"A lista dá Escudos ×0,50 e Taças ×0,25; a tabela dá Taças 1º e Escudos 2º. Em uso: a tabela."},"diabo":{"confirmar":true,"nota":"A lista dá Paus ×0,05 e Ouros ×0,015; a tabela dá Ouros 5º e Paus 6º. Em uso: a tabela."},"morte":{"confirmar":true,"nota":"O exemplo da introdução difere (Copas ×0,15, Ouros e Espadas empatados em ×0,10, Escudos ×0,05). A lista completa mais abaixo confere com a tabela. Em uso: a tabela."},"sol":{"confirmar":true,"nota":"A tabela foi cortada depois de Ouros. Espadas, Taças e Escudos vêm da lista do corpo (Escudos 2º, Espadas 3º, Taças 6º)."},"mundo":{"confirmar":true,"nota":"Fora da tabela: ordem tirada dos multiplicadores da lista. Os símbolos de Paus (deficiente, com ×0,10) e Copas (com ×0,015) contradizem os números; usamos os números."},"julgamento":{"confirmar":true,"nota":"Fora da tabela: ordem tirada dos multiplicadores da lista (os símbolos da lista não batem com os números)."},"torre":{"confirmar":false,"nota":"Confere com a tabela pelos multiplicadores, mas os símbolos da lista estão trocados e Espadas aparece como ×0,5 (provável ×0,05)."},"eremita":{"confirmar":false,"nota":"Confere com a tabela; Escudos aparece como ×0,5 (provável ×0,05)."},"estrela":{"confirmar":false,"nota":"Confere com a tabela; Paus aparece como ×0,010 (provável ×0,10)."},"temperanca":{"confirmar":false,"nota":"Confere com a tabela pelos multiplicadores; os símbolos da lista estão trocados."},"justica":{"confirmar":false,"nota":"Aparece duas vezes no corpo, com a mesma ordem; confere com a tabela."},"forca":{"confirmar":false,"nota":"Aparece duas vezes no corpo, com a mesma ordem; confere com a tabela."}}}$json$::jsonb, true,
   'Ordem de afinidade Arcano × Virtude (tabela do doc do dono). Divergências marcadas em "divergencias" para o dono confirmar.'),
  ('virtudes.estagios', '{"padrao": [{"estagio": 1, "minimo": 30, "teto": 100}, {"estagio": 2, "minimo": 60, "teto": 160}, {"estagio": 3, "minimo": 100, "teto": 240}, {"estagio": 4, "minimo": 150, "teto": 340}, {"estagio": 5, "minimo": 210, "teto": 460}], "porArcano": {}}'::jsonb, true,
   'PROVISÓRIO: mínimo e teto de P.P. por Estágio (o doc diz que o Arcano define; porArcano sobrescreve o padrão).'),
  ('virtudes.evolucao', '{"peso_direcao": 0.35, "fragmentos": 0}'::jsonb, true,
   'PROVISÓRIO: quanto o tipo de esforço inclina a distribuição (0 = só afinidade) e Fragmentos de Arcano gastos por Evolução.'),
  ('virtudes.fontes', '{"jogos": {"chess": {"virtude": "ouros", "vitoria": 3, "empate": 2, "derrota": 1}, "memory-rush": {"virtude": "ouros", "vitoria": 3, "empate": 2, "derrota": 1}, "hot-bomb": {"virtude": "espadas", "vitoria": 3, "empate": 2, "derrota": 1}, "bluff": {"virtude": "escudos", "vitoria": 3, "empate": 2, "derrota": 1}}, "deadly_vote": {"participacao": {"paus": 2}, "sobreviveu": {"tacas": 2, "paus": 1}}}'::jsonb, true,
   'PROVISÓRIO: P.P. que cada partida da Sala de Jogos e cada Deadly Vote rendem, e em qual Virtude.')
ON CONFLICT (key) DO NOTHING;

-- Mínimo e teto do Estágio para o Arcano (porArcano > padrão; além do último Estágio vale o último).
CREATE OR REPLACE FUNCTION devo_virtude_limite(p_arcano text, p_estagio integer, OUT minimo numeric, OUT teto numeric, OUT ultimo boolean)
LANGUAGE plpgsql STABLE AS $$
DECLARE cfg jsonb; tab jsonb; e jsonb; maxe integer;
BEGIN
  SELECT value INTO cfg FROM devo_config WHERE key = 'virtudes.estagios';
  tab := cfg -> 'porArcano' -> coalesce(p_arcano, '');
  IF tab IS NULL OR jsonb_typeof(tab) <> 'array' OR jsonb_array_length(tab) = 0 THEN tab := cfg -> 'padrao'; END IF;
  IF tab IS NULL OR jsonb_typeof(tab) <> 'array' OR jsonb_array_length(tab) = 0 THEN
    tab := '[{"estagio": 1, "minimo": 30, "teto": 100}]'::jsonb;
  END IF;
  SELECT max((x ->> 'estagio')::int) INTO maxe FROM jsonb_array_elements(tab) x;
  SELECT x INTO e FROM jsonb_array_elements(tab) x WHERE (x ->> 'estagio')::int = least(p_estagio, maxe)
   ORDER BY (x ->> 'estagio')::int DESC LIMIT 1;
  IF e IS NULL THEN SELECT x INTO e FROM jsonb_array_elements(tab) x ORDER BY (x ->> 'estagio')::int DESC LIMIT 1; END IF;
  minimo := greatest(0, coalesce((e ->> 'minimo')::numeric, 0));
  teto := greatest(0, coalesce((e ->> 'teto')::numeric, 0));
  ultimo := p_estagio >= maxe;
END $$;

-- Soma P.P. numa Virtude respeitando o teto do Estágio (a SOMA das seis nunca passa dele). Retorna o
-- quanto foi aplicado (0 se já estava no teto). Com p_idem repetido, não soma de novo e devolve o aplicado
-- da primeira vez. Uma trava por jogador serializa as entradas.
CREATE OR REPLACE FUNCTION devo_virtude_pp_add(p_player uuid, p_virtude text, p_qtd numeric, p_motivo text,
                                               p_ref text DEFAULT NULL, p_actor uuid DEFAULT NULL, p_idem text DEFAULT NULL)
RETURNS numeric LANGUAGE plpgsql AS $$
DECLARE v_arcano text; v_estagio integer; v_teto numeric; v_total numeric; v_apl numeric; v_prev numeric;
BEGIN
  IF p_virtude IS NULL OR p_virtude NOT IN ('paus', 'copas', 'ouros', 'espadas', 'tacas', 'escudos') THEN
    RAISE EXCEPTION 'VIRTUDE_DESCONHECIDA';
  END IF;
  IF p_qtd IS NULL OR p_qtd <= 0 OR p_qtd > 1000 THEN RAISE EXCEPTION 'QUANTIDADE_INVALIDA'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('devo-virtudes:' || p_player::text));
  IF p_idem IS NOT NULL THEN
    SELECT aplicado INTO v_prev FROM virtude_pp_log WHERE idem_key = p_idem;
    IF FOUND THEN RETURN v_prev; END IF;
  END IF;
  SELECT arcano, arcano_estagio INTO v_arcano, v_estagio FROM players WHERE id = p_player;
  IF NOT FOUND THEN RAISE EXCEPTION 'JOGADOR_DESCONHECIDO'; END IF;
  SELECT l.teto INTO v_teto FROM devo_virtude_limite(v_arcano, v_estagio) l;
  SELECT coalesce(sum(pp), 0) INTO v_total FROM virtude_pp WHERE player_id = p_player;
  v_apl := round(least(p_qtd, greatest(0, v_teto - v_total)), 2);
  IF v_apl > 0 THEN
    INSERT INTO virtude_pp (player_id, virtude, pp) VALUES (p_player, p_virtude, v_apl)
    ON CONFLICT (player_id, virtude) DO UPDATE SET pp = virtude_pp.pp + EXCLUDED.pp, updated_at = now();
  END IF;
  INSERT INTO virtude_pp_log (player_id, virtude, pedido, aplicado, estagio, motivo, ref, actor_id, idem_key)
  VALUES (p_player, p_virtude, round(p_qtd, 2), v_apl, v_estagio, left(coalesce(p_motivo, 'sistema'), 60), p_ref, p_actor, p_idem);
  RETURN v_apl;
END $$;


-- =============================================================================================
-- scripts/narrativa-migration.sql
-- =============================================================================================
-- Narrativa e progressão (DIRECAO-3 §1, §2): progresso de cenas de diálogo e efeitos aplicados uma vez só.
-- Idempotente. Depende de fundacao-migration.sql (players, devo_config). Contrato: docs/redesign/DIALOGO.md.

-- Em que passo o jogador parou em cada cena (retomar onde parou) e se já terminou.
CREATE TABLE IF NOT EXISTS dialog_progress (
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  scene_id text NOT NULL,
  step integer NOT NULL DEFAULT 0,
  done_at timestamptz,
  started_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, scene_id),
  CONSTRAINT dialog_progress_scene_chk CHECK (scene_id ~ '^[a-z0-9-]{2,60}$'),
  CONSTRAINT dialog_progress_step_chk CHECK (step >= 0 AND step < 10000)
);

-- Escolhas feitas e efeitos aplicados. A chave primária garante: cada efeito vale UMA vez por jogador.
--   key = 'e:<escolha>' (escolha de uma opção só: a primeira vale), 'e:<escolha>:<n>' (modo explorar),
--         'p:<efeito>' (passo de efeito), 'fim' (efeitos ao concluir).
CREATE TABLE IF NOT EXISTS dialog_events (
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  scene_id text NOT NULL,
  key text NOT NULL,
  option_index integer,
  applied jsonb NOT NULL DEFAULT '[]'::jsonb,
  at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, scene_id, key),
  CONSTRAINT dialog_events_key_chk CHECK (key ~ '^(fim|[ep]:[a-z0-9-]{1,60}(:[0-9]{1,2})?)$')
);
CREATE INDEX IF NOT EXISTS dialog_events_scene_idx ON dialog_events (scene_id, at DESC);

-- Valores do dono ainda não definidos ("X quantidade de tempo"): PROVISÓRIOS, editáveis pelo Owner.
INSERT INTO devo_config (key, value, provisional, note) VALUES
  ('narrativa.galo_casa.tempo_min', '60'::jsonb, true, 'PROVISÓRIO: minutos que o Galo transfere na opção "Galo…?" (texto do dono: "X quantidade de tempo").'),
  ('narrativa.melissa_corporacoes.multa_min', '-30'::jsonb, true, 'PROVISÓRIO: minutos retirados do Shuffler na opção da Necro-Corporação (negativo = tira).'),
  ('narrativa.galo_casa.explorar_min', '2'::jsonb, true, 'PROVISÓRIO: quantos sistemas novos o jogador abre antes da visita do Galo ficar disponível.')
ON CONFLICT (key) DO NOTHING;

