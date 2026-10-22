-- Casa: Confecção de Cartas, Pacotes e o peso máximo de cartas do Deadly Vote (texto do dono:
-- docs/redesign/CASA-CONFECCAO-dono.md). Depende de scripts/fundacao-migration.sql (players, item_defs,
-- devo_config, card_deliveries) e de scripts/deadly-votes-migration.sql.
-- Idempotente: rodar duas vezes não quebra nem duplica.
--
-- Regras que o BANCO garante (além do servidor em lib/devo/casa-server.ts):
--   · uma tentativa por idem_key (toque duplo não cobra duas vezes);
--   · uma carta (uid) entra em no máximo uma tentativa (índice único sobre os materiais);
--   · um aprimoramento por nível e jogador (PK), uma abertura por idem_key.

-- ---------------------------------------------------------------------------------------------
-- 1. Peso máximo de cartas por Deadly Vote (soma dos pesos que cada Record leva; NULL = sem limite)
-- ---------------------------------------------------------------------------------------------
ALTER TABLE deadly_votes ADD COLUMN IF NOT EXISTS peso_maximo integer;
ALTER TABLE deadly_votes DROP CONSTRAINT IF EXISTS deadly_votes_peso_chk;
ALTER TABLE deadly_votes ADD CONSTRAINT deadly_votes_peso_chk CHECK (peso_maximo IS NULL OR peso_maximo BETWEEN 1 AND 99);

-- ---------------------------------------------------------------------------------------------
-- 2. Itens: Pacotes (kind novo 'pacote') e o Molde de Xadrez (item estético do pacote)
-- ---------------------------------------------------------------------------------------------
ALTER TABLE item_defs DROP CONSTRAINT IF EXISTS item_defs_kind_chk;
ALTER TABLE item_defs ADD CONSTRAINT item_defs_kind_chk
  CHECK (kind IN ('moeda', 'essencia', 'chave', 'fragmento', 'capsula', 'cosmetico', 'convite', 'outro', 'pacote'));

INSERT INTO item_defs (key, kind, name, description, rarity, stackable, meta) VALUES
  ('pacote:xadrez', 'pacote', 'Pacote Raro: Coleção de Xadrez',
   'Um pacote dedicado a cartas inspiradas no xadrez. Elegante, estratégico e genial — uma coleção digna de quem sabe jogar muito além do tabuleiro.',
   'raro', true, '{"pacote": "xadrez"}'),
  ('estetico:molde_xadrez', 'outro', 'Molde de Xadrez', 'Item estético da Coleção de Xadrez.', 'raro', true, '{"colecao": "xadrez"}')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------------------------
-- 3. Confecção de Cartas
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS confeccao_mesas (
  player_id uuid PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  nivel integer NOT NULL DEFAULT 1 CHECK (nivel BETWEEN 1 AND 6),
  atualizada_em timestamptz NOT NULL DEFAULT now()
);

-- Cada aprimoramento pago (o Tempo sai do pulso na mesma transação).
CREATE TABLE IF NOT EXISTS confeccao_aprimoramentos (
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  nivel integer NOT NULL CHECK (nivel BETWEEN 2 AND 6),
  minutos integer NOT NULL CHECK (minutos >= 0),
  em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, nivel)
);

-- Tentativas (andamento e histórico). materiais = [{uid, cardId}] das cartas tiradas do save.
-- modo: 'raridade' (N cartas da mesma raridade) · 'receita' (combinação exata) · 'experimento' (combinação sem receita).
-- status: 'andamento' → 'sucesso' | 'falha' | 'sem_receita' (as cartas do experimento voltam por card_deliveries).
CREATE TABLE IF NOT EXISTS confeccao_tentativas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  modo text NOT NULL CHECK (modo IN ('raridade', 'receita', 'experimento')),
  alvo text,
  receita_id text,
  -- Receita: a carta que a combinação promete (gravada no início; a receita pode mudar depois).
  resultado_previsto text,
  materiais jsonb NOT NULL,
  minutos integer NOT NULL CHECK (minutos >= 0),
  chance integer NOT NULL CHECK (chance BETWEEN 0 AND 100),
  nivel_mesa integer NOT NULL,
  criada_em timestamptz NOT NULL DEFAULT now(),
  pronta_em timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'andamento' CHECK (status IN ('andamento', 'sucesso', 'falha', 'sem_receita')),
  resultado text,
  descobriu boolean NOT NULL DEFAULT false,
  resolvida_em timestamptz,
  idem_key text NOT NULL UNIQUE
);
CREATE INDEX IF NOT EXISTS confeccao_tentativas_player_idx ON confeccao_tentativas (player_id, criada_em DESC);
CREATE INDEX IF NOT EXISTS confeccao_tentativas_andamento_idx ON confeccao_tentativas (player_id) WHERE status = 'andamento';

-- Uma carta (uid do save) só entra em uma tentativa: o /api/save descarta esses uids depois.
CREATE TABLE IF NOT EXISTS confeccao_materiais (
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  card_uid text NOT NULL,
  tentativa_id uuid NOT NULL REFERENCES confeccao_tentativas(id) ON DELETE CASCADE,
  PRIMARY KEY (player_id, card_uid)
);

-- Livro de Receitas: quem descobriu o quê. O livro mostra as suas e as dos membros atuais da sua Corporação.
CREATE TABLE IF NOT EXISTS confeccao_descobertas (
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  receita_id text NOT NULL,
  em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, receita_id)
);
CREATE INDEX IF NOT EXISTS confeccao_descobertas_receita_idx ON confeccao_descobertas (receita_id);

-- ---------------------------------------------------------------------------------------------
-- 4. Pacotes abertos
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pacote_aberturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  pacote text NOT NULL,
  premio jsonb NOT NULL,
  em timestamptz NOT NULL DEFAULT now(),
  idem_key text NOT NULL UNIQUE
);
CREATE INDEX IF NOT EXISTS pacote_aberturas_player_idx ON pacote_aberturas (player_id, em DESC);

-- ---------------------------------------------------------------------------------------------
-- 5. Configuração (PROVISÓRIA: o dono não definiu custos, esperas nem espaços; o Owner ajusta na Mesa › Casa)
-- ---------------------------------------------------------------------------------------------
INSERT INTO devo_config (key, value, provisional, note) VALUES
  ('confeccao.regras',
   '{"raridade": {"incomum": {"minutos": 30, "espera": 60}, "rara": {"minutos": 90, "espera": 180},
                  "ultra_rara": {"minutos": 240, "espera": 480}, "lendaria": {"minutos": 600, "espera": 1440}},
     "experimento": {"minutos": 60, "espera": 120},
     "espacos": [1, 1, 2, 2, 3, 3],
     "aprimorar": [180, 360, 720, 1440, 2880],
     "reserva": 60}',
   true, 'Confecção: custo em Tempo e espera (minutos), espaços por nível e custo para aprimorar a mesa (níveis 2 a 6).'),
  ('confeccao.receitas', '[]', true, 'Confecção: combinações exatas (materiais → carta). Só aparecem no Livro de quem descobriu.')
ON CONFLICT (key) DO NOTHING;
