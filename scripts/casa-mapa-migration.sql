-- Casa em RPG Maker (DEVO v2, etapas 5 e 6 do docs/redesign/v2/PLANO-PUBLICACAO.md): aparência do avatar da Casa e
-- visitas na porta (a primeira é a do Simon). Depende de scripts/fundacao-migration.sql (players, item_defs) e de
-- scripts/casa-migration.sql (kind 'pacote' no item_defs_kind_chk).
-- Idempotente: rodar duas vezes não quebra nem duplica.
--
-- Regras do dono (docs/redesign/v2/PEDIDO-V2-dono.md):
--   · a primeira escolha de aparência é grátis, assim que a Casa é desbloqueada;
--   · trocar depois é no guarda-roupa do quarto e custa 1 hora de Tempo (só cobra se algo mudar);
--   · o avatar e o chibi são só da Casa (o Record continua com a foto e a aparência dele);
--   · o Simon é sempre o primeiro a visitar; enquanto não for atendido, ninguém mais aparece.

-- ---------------------------------------------------------------------------------------------
-- 1. Aparência do avatar (corpo, cabelo, rosto, roupa e cores, sempre índices do catálogo)
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS casa_aparencia (
  player_id uuid PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  aparencia jsonb NOT NULL,
  -- trocas pagas no guarda-roupa (a criação não conta)
  trocas integer NOT NULL DEFAULT 0 CHECK (trocas >= 0),
  criada_em timestamptz NOT NULL DEFAULT now(),
  atualizada_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT casa_aparencia_obj_chk CHECK (jsonb_typeof(aparencia) = 'object')
);

-- Cada troca paga (o Tempo sai do pulso na mesma transação). idem_key: toque duplo não cobra duas vezes.
CREATE TABLE IF NOT EXISTS casa_aparencia_trocas (
  id bigserial PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  antes jsonb NOT NULL,
  depois jsonb NOT NULL,
  minutos integer NOT NULL CHECK (minutos >= 0),
  em timestamptz NOT NULL DEFAULT now(),
  idem_key text NOT NULL UNIQUE
);
CREATE INDEX IF NOT EXISTS casa_aparencia_trocas_player_idx ON casa_aparencia_trocas (player_id, em DESC);

-- ---------------------------------------------------------------------------------------------
-- 2. Visitas na porta: quem já veio e como terminou (Simon primeiro)
-- ---------------------------------------------------------------------------------------------
-- resultado: 'atendeu' (a visita chegou ao fim com a porta aberta) · 'ignorou' (não abriu; ele volta outra hora).
-- detalhe: escolhas da cena (ex.: {"guardaChuva": "ficou"|"deu"}).
CREATE TABLE IF NOT EXISTS casa_visitas (
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  npc text NOT NULL CHECK (npc ~ '^[a-z0-9_-]{1,40}$'),
  resultado text NOT NULL CHECK (resultado IN ('atendeu', 'ignorou')),
  detalhe jsonb NOT NULL DEFAULT '{}'::jsonb,
  vezes integer NOT NULL DEFAULT 1 CHECK (vezes >= 1),
  primeira_em timestamptz NOT NULL DEFAULT now(),
  ultima_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, npc)
);

-- ---------------------------------------------------------------------------------------------
-- 3. Item: o guarda-chuva que o antigo morador deixou (visita do Simon, texto do Rup)
-- ---------------------------------------------------------------------------------------------
INSERT INTO item_defs (key, kind, name, description, rarity, stackable, meta) VALUES
  ('heranca:guarda_chuva', 'outro', 'Guarda-chuva do antigo morador',
   'Tudo o que o antigo morador deixou na casa. Ainda é uma herança, talvez.',
   'comum', false, '{"origem": "visita:simon"}')
ON CONFLICT (key) DO NOTHING;
