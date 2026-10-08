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
