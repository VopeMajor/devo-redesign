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
