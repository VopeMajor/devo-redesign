-- Poço dos Milagres (DIRECAO-3 §2; texto do dono em docs/redesign/SISTEMAS-texto-do-dono.txt).
-- Depende de scripts/fundacao-migration.sql (item_defs, player_items, devo_config, players).
-- Idempotente: rodar duas vezes não quebra nem duplica.
--
-- O sorteio acontece SEMPRE no servidor (lib/devo/poco-server.ts). Cada giro guarda o segredo do sorteio
-- (seed), o compromisso mostrado ao jogador antes de girar (seed_hash = sha256(seed)), os pesos lidos da
-- configuração naquele instante, os toques do minigame e o resultado. Depois do balde, o seed é revelado:
-- qualquer um confere que o resultado saiu dele.

-- ---------------------------------------------------------------------------------------------
-- 1. Estado do jogador no Poço (apresentação do encapuzado + balde escolhido)
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS poco_estado (
  player_id uuid PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  -- Quando a cena da neblina terminou (a moeda do encapuzado é entregue uma vez só, idem 'poco:corvo:<id>').
  apresentado_at timestamptz,
  balde text NOT NULL DEFAULT 'madeira',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------------------------
-- 2. Giros (um por moeda lançada). Auditoria completa por linha.
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS poco_giros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  -- Categoria do sorteio = chave da moeda ('dracma_comum', 'dracma_incomum'…).
  moeda text NOT NULL,
  gratis boolean NOT NULL DEFAULT false,
  -- Dia (horário de Brasília) e ordem do giro grátis naquele dia.
  dia date NOT NULL,
  gratis_n integer,
  balde text NOT NULL DEFAULT 'madeira',
  estado text NOT NULL DEFAULT 'lancado',
  seed text NOT NULL,
  seed_hash text NOT NULL,
  lancado_at timestamptz NOT NULL DEFAULT now(),
  manivela_at timestamptz,
  lento boolean NOT NULL DEFAULT false,
  toques jsonb,
  acertos integer,
  -- Pesos efetivos (configuração + manivela) e se a configuração era provisória.
  pesos jsonb,
  provisorio boolean,
  rolagem double precision,
  categoria_sorteada text,
  categoria text,
  item_key text REFERENCES item_defs(key) ON UPDATE CASCADE,
  lixo text,
  quantidade integer,
  girado_at timestamptz,
  revelado_at timestamptz,
  CONSTRAINT poco_giros_estado_chk CHECK (estado IN ('lancado', 'girando', 'girado', 'revelado')),
  CONSTRAINT poco_giros_categoria_chk CHECK (categoria IS NULL OR categoria IN ('lixo', 'capsula', 'fragmento', 'essencia', 'cosmetico'))
);
-- Giro grátis: no máximo um registro por (jogador, dia, ordem). A ordem vai até poco.giro_gratis_diario.quantidade.
CREATE UNIQUE INDEX IF NOT EXISTS poco_giros_gratis_idx ON poco_giros (player_id, dia, gratis_n) WHERE gratis;
-- Uma moeda por vez no poço: o balde precisa ser inspecionado antes de lançar outra.
CREATE UNIQUE INDEX IF NOT EXISTS poco_giros_aberto_idx ON poco_giros (player_id) WHERE estado <> 'revelado';
CREATE INDEX IF NOT EXISTS poco_giros_player_idx ON poco_giros (player_id, lancado_at DESC);
-- Letreiro: últimos prêmios bons.
CREATE INDEX IF NOT EXISTS poco_giros_bons_idx ON poco_giros (girado_at DESC) WHERE categoria IS NOT NULL AND categoria <> 'lixo';

-- ---------------------------------------------------------------------------------------------
-- 3. Configuração PROVISÓRIA (editável pelo Owner em /api/staff config.definir). Não sobrescreve.
-- ---------------------------------------------------------------------------------------------
INSERT INTO devo_config (key, value, provisional, note) VALUES
  ('poco.manivela',
   '{"max_acertos": 5, "reducao_lixo_por_acerto": 0.08,
     "janelas": [0.26, 0.2, 0.155, 0.12, 0.09],
     "periodos_ms": [1900, 1650, 1450, 1280, 1140],
     "fator_lento": 1.6, "rodada_max_ms": 9000}'::jsonb,
   true, 'PROVISÓRIO: minigame da manivela. Cada acerto reduz o peso do lixo; a janela encolhe e o ponteiro acelera.'),
  ('poco.quantidades', '{"fragmento": [1, 2], "essencia": [1, 3]}'::jsonb,
   true, 'PROVISÓRIO: quantidade [mín, máx] por coleta (antes do multiplicador do balde).'),
  ('poco.raridade_pesos', '{"comum": 50, "incomum": 30, "raro": 14, "epico": 5, "lendario": 1, "arcano": 0}'::jsonb,
   true, 'PROVISÓRIO: dentro da categoria cosmético, peso por raridade (chances reduzidas para os raros).')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------------------------
-- 4. Catálogo: baldes e cápsulas do tempo (dados; textos PROVISÓRIOS para o dono escrever)
-- ---------------------------------------------------------------------------------------------
-- Baldes: kind 'outro', item único. meta.tipo: inicial | normal (aparece bloqueado) | raro (oculto até obter).
-- meta.mult_qtd multiplica a quantidade de fragmentos/essências por coleta (PROVISÓRIO).
INSERT INTO item_defs (key, kind, name, description, rarity, stackable, meta) VALUES
  ('balde:madeira', 'outro', 'Balde de madeira desgastado', 'O balde de todo iniciante. Trágico, rachado e sem qualquer efeito sobre a coleta.', 'comum', false,
   '{"poco_balde": true, "tipo": "inicial", "ordem": 1, "mult_qtd": 1, "efeito": "Nenhum efeito."}'),
  ('balde:ferro', 'outro', 'Balde de ferro batido', 'Pesado e honesto. Volta do fundo com um pouco mais do que levou.', 'incomum', false,
   '{"poco_balde": true, "tipo": "normal", "ordem": 2, "mult_qtd": 1.5, "efeito": "Coleta 1,5× fragmentos e essências.", "provisorio": true}'),
  ('balde:cobre', 'outro', 'Balde de cobre polido', 'O cobre escurece no contato com a água do poço, mas não larga o que pega.', 'raro', false,
   '{"poco_balde": true, "tipo": "normal", "ordem": 3, "mult_qtd": 2, "efeito": "Coleta 2× fragmentos e essências.", "provisorio": true}'),
  ('balde:prata', 'outro', 'Balde de prata votiva', 'Gravado com nomes que ninguém lembra de ter escrito.', 'epico', false,
   '{"poco_balde": true, "tipo": "raro", "ordem": 4, "mult_qtd": 3, "efeito": "Coleta 3× fragmentos e essências.", "provisorio": true}')
ON CONFLICT (key) DO NOTHING;

-- Cápsulas do tempo: vão para o Diário (kind 'capsula', item único). meta.poco = entra no sorteio.
-- TEXTOS PROVISÓRIOS: o dono escreve título e texto de cada cápsula (editar via catálogo do Owner ou aqui).
INSERT INTO item_defs (key, kind, name, description, rarity, stackable, meta)
SELECT 'capsula:' || lpad(n::text, 3, '0'), 'capsula', 'Cápsula do Tempo ' || to_char(n, 'FMRN'),
       'Uma cápsula selada que o Poço devolveu. O conteúdo fica no Diário.', 'raro', false,
       jsonb_build_object('poco', true, 'provisorio', true, 'numero', n,
         'titulo', 'Cápsula do Tempo ' || to_char(n, 'FMRN'),
         'texto', '[TEXTO PROVISÓRIO] O dono vai escrever aqui uma informação ou curiosidade do mundo de DEVO.')
  FROM generate_series(1, 8) AS n
ON CONFLICT (key) DO NOTHING;
