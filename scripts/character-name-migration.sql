-- Nome do personagem (DIRECAO-2 §5): como os NPCs chamam o jogador durante todo o jogo.
-- O login continua pelo nome da conta (players.name / user.username).
-- Rodar no Neon depois de auth-migration.sql. Idempotente.
ALTER TABLE players ADD COLUMN IF NOT EXISTS character_name text;

-- Contas antigas: o personagem começa com o mesmo nome da conta (pode ser trocado depois).
UPDATE players SET character_name = name WHERE character_name IS NULL;
