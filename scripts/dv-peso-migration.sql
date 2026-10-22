-- Peso das cartas no Deadly Vote (dono, 22/10): ao se inscrever num caso com peso máximo, o Record escolhe as
-- cartas que vai levar; a soma dos pesos não pode passar do limite. Guarda a escolha na inscrição.
-- Idempotente.
ALTER TABLE deadly_vote_entries ADD COLUMN IF NOT EXISTS cartas jsonb NOT NULL DEFAULT '[]'::jsonb;
