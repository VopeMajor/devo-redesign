-- Corporações no DEVO v2 (dono, 03/11/2026: "acredito que porque terá o chat da corporação. O papel de parede pode
-- ser esses padrões, mas também deixe que o líder possa escolher algum arquivo do aparelho dele"):
--   · chat da Corporação (todos os membros leem e escrevem; o servidor limita o tamanho e o ritmo);
--   · papel de parede escolhido pelo líder: um dos seis padrões, o fundo do sistema ou uma imagem do aparelho
--     (reduzida a 1600 px no cliente e guardada no banco como a foto do Record).
-- Depende de scripts/corporacoes-migration.sql (corporacoes, corporacao_membros) e de scripts/fundacao-migration.sql.
-- Idempotente: rodar duas vezes não quebra nem duplica.

-- ---------------------------------------------------------------------------------------------
-- 1. Papel de parede: padrão escolhido (id em lib/devo/corporacoes.ts › CORP_PAPEIS), 'imagem' ou NULL (fundo do
--    sistema). papel_at muda a cada troca (é a versão da imagem servida em /api/corporacoes/papel).
-- ---------------------------------------------------------------------------------------------
ALTER TABLE corporacoes ADD COLUMN IF NOT EXISTS papel text CONSTRAINT corporacoes_papel_chk CHECK (papel ~ '^[a-z0-9_-]{1,40}$');
ALTER TABLE corporacoes ADD COLUMN IF NOT EXISTS papel_at timestamptz;

-- A imagem do aparelho fica numa tabela à parte: as consultas das Corporações (SELECT c.*) não carregam o arquivo.
CREATE TABLE IF NOT EXISTS corporacao_papeis (
  corporacao_id uuid PRIMARY KEY REFERENCES corporacoes(id) ON DELETE CASCADE,
  -- data URL JPEG/PNG/WebP (o servidor confere o tipo pelo conteúdo e o limite de 900 KB)
  imagem text NOT NULL,
  enviada_por uuid REFERENCES players(id) ON DELETE SET NULL,
  atualizado_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT corporacao_papeis_tipo_chk CHECK (imagem ~ '^data:image/(jpeg|png|webp);base64,'),
  CONSTRAINT corporacao_papeis_tam_chk CHECK (char_length(imagem) <= 1300000)
);

-- ---------------------------------------------------------------------------------------------
-- 2. Chat da Corporação
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS corporacao_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corporacao_id uuid NOT NULL REFERENCES corporacoes(id) ON DELETE CASCADE,
  -- quem escreveu (se o Record sair da Corporação, a mensagem fica, com o nome dele)
  player_id uuid REFERENCES players(id) ON DELETE SET NULL,
  texto text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT corporacao_mensagens_texto_chk CHECK (char_length(texto) BETWEEN 1 AND 300)
);
-- as últimas mensagens de uma Corporação (a lista do chat) e o ritmo de cada Record (limite por minuto)
CREATE INDEX IF NOT EXISTS corporacao_mensagens_corp_idx ON corporacao_mensagens (corporacao_id, created_at DESC);
CREATE INDEX IF NOT EXISTS corporacao_mensagens_autor_idx ON corporacao_mensagens (player_id, created_at DESC);
