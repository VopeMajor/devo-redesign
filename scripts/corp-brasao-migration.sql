-- Brasões das Corporações mais trabalhados (dono, 23/10): divisão do campo com segunda cor, figura no centro e
-- ornamento em volta. Brasões antigos ficam "pleno", com a inicial e sem ornamento. Idempotente.
ALTER TABLE corporacoes ADD COLUMN IF NOT EXISTS brasao_cor2 text;
ALTER TABLE corporacoes ADD COLUMN IF NOT EXISTS brasao_divisao text NOT NULL DEFAULT 'pleno';
ALTER TABLE corporacoes ADD COLUMN IF NOT EXISTS brasao_simbolo text NOT NULL DEFAULT 'inicial';
ALTER TABLE corporacoes ADD COLUMN IF NOT EXISTS brasao_ornamento text NOT NULL DEFAULT 'nenhum';
