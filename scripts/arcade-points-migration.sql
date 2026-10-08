ALTER TABLE arcade_matches ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 0;

UPDATE arcade_matches
SET points = CASE
  WHEN mode = 'evento' THEN score + CASE WHEN result = 'win' THEN 0 ELSE 50 END
  ELSE LEAST(250, ROUND(score * 0.2))::int + CASE result WHEN 'win' THEN 40 WHEN 'draw' THEN 20 ELSE 10 END
END
WHERE points = 0 AND finished_at IS NOT NULL AND mode <> 'treino';

CREATE INDEX IF NOT EXISTS arcade_matches_game_week_idx ON arcade_matches (game_id, finished_at) WHERE mode <> 'treino';
