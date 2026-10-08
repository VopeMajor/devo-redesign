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
