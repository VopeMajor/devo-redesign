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
