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
