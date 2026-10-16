-- Salão das Máscaras (DIRECAO-3 §2 e §1b; apresentação do Herdeiro em docs/redesign/DIALOGOS-galo-salao.md).
-- Depende de scripts/fundacao-migration.sql (players, devo_config, card_deliveries, arcade_profiles).
-- Idempotente: rodar duas vezes não quebra nem duplica.
--
-- Regras que o BANCO garante (além do servidor em lib/devo/salao-server.ts):
--   · uma carta (uid do save) só pode estar num lote OU numa oferta do mercado, uma vez só, para sempre:
--     índices únicos (seller_id, card_uid). A carta sai do save na mesma transação em que o lote nasce, e o
--     /api/save descarta qualquer uid que já foi entregue ao Salão (cópia velha do cliente não ressuscita a carta).
--   · lance positivo e inteiro (minutos de Tempo); lote com no máximo um lance "ativo" (o maior).
--   · todo crédito/débito de Tempo do Salão passa por salao_movimentos com idem_key único: o vendedor recebe
--     uma vez, o lance superado é devolvido uma vez, a taxa de divulgação devolvida uma vez.

-- ---------------------------------------------------------------------------------------------
-- 1. Estado do jogador no Salão (apresentação do Herdeiro + tipo de contrato)
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS salao_estado (
  player_id uuid PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  apresentado_at timestamptz,
  -- Aviso "Anunciar no Salão das Máscaras" (texto de sistema) já lido.
  aviso_anunciar_at timestamptz,
  -- Tipo de contrato (chave de devo_config['salao.contratos']). Define as taxas.
  contrato text NOT NULL DEFAULT 'avulso',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------------------------
-- 2. Lotes (Bandeja → avaliação do especialista → edição do leilão)
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS salao_lotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero serial,
  seller_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  card_uid text NOT NULL,
  card_id text NOT NULL,
  card_rarity text NOT NULL,
  contrato text NOT NULL,
  -- Taxas congeladas no envio (a configuração pode mudar depois).
  taxa_divulgacao integer NOT NULL DEFAULT 0,
  comissao_pct numeric(5, 2) NOT NULL DEFAULT 0,
  lance_minimo integer NOT NULL,
  incremento integer NOT NULL,
  -- avaliacao → aprovado (entra na edição) → vendido | devolvido; avaliacao → recusado | retirado.
  status text NOT NULL DEFAULT 'avaliacao',
  -- Índice da edição (0, 1, 2… a partir da âncora do calendário). Nulo até aprovar.
  edicao integer,
  nota text,
  avaliado_por uuid REFERENCES players(id) ON DELETE SET NULL,
  avaliado_at timestamptz,
  vencedor_id uuid REFERENCES players(id) ON DELETE SET NULL,
  valor_final integer,
  repasse integer,
  encerrado_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT salao_lotes_status_chk CHECK (status IN ('avaliacao', 'aprovado', 'recusado', 'retirado', 'vendido', 'devolvido')),
  CONSTRAINT salao_lotes_valores_chk CHECK (lance_minimo > 0 AND incremento > 0 AND taxa_divulgacao >= 0
    AND comissao_pct >= 0 AND comissao_pct <= 100 AND (valor_final IS NULL OR valor_final > 0) AND (repasse IS NULL OR repasse >= 0))
);
CREATE UNIQUE INDEX IF NOT EXISTS salao_lotes_carta_idx ON salao_lotes (seller_id, card_uid);
CREATE INDEX IF NOT EXISTS salao_lotes_edicao_idx ON salao_lotes (edicao, status);
CREATE INDEX IF NOT EXISTS salao_lotes_avaliacao_idx ON salao_lotes (created_at) WHERE status = 'avaliacao';

CREATE TABLE IF NOT EXISTS salao_lances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id uuid NOT NULL REFERENCES salao_lotes(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  valor integer NOT NULL,
  -- ativo (o maior) → superado (devolvido) | vencedor.
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT salao_lances_valor_chk CHECK (valor > 0),
  CONSTRAINT salao_lances_status_chk CHECK (status IN ('ativo', 'superado', 'vencedor'))
);
CREATE UNIQUE INDEX IF NOT EXISTS salao_lances_ativo_idx ON salao_lances (lote_id) WHERE status = 'ativo';
CREATE INDEX IF NOT EXISTS salao_lances_lote_idx ON salao_lances (lote_id, valor DESC);
CREATE INDEX IF NOT EXISTS salao_lances_player_idx ON salao_lances (player_id, created_at DESC);

-- ---------------------------------------------------------------------------------------------
-- 3. Mercado (compra/venda direta de cartas entre jogadores, preço fixo em Tempo)
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS salao_mercado (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  card_uid text NOT NULL,
  card_id text NOT NULL,
  card_rarity text NOT NULL,
  preco integer NOT NULL,
  comissao_pct numeric(5, 2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'ativa',
  comprador_id uuid REFERENCES players(id) ON DELETE SET NULL,
  repasse integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  fechada_at timestamptz,
  CONSTRAINT salao_mercado_status_chk CHECK (status IN ('ativa', 'vendida', 'retirada')),
  CONSTRAINT salao_mercado_preco_chk CHECK (preco > 0 AND comissao_pct >= 0 AND comissao_pct <= 100)
);
CREATE UNIQUE INDEX IF NOT EXISTS salao_mercado_carta_idx ON salao_mercado (seller_id, card_uid);
CREATE INDEX IF NOT EXISTS salao_mercado_ativa_idx ON salao_mercado (created_at DESC) WHERE status = 'ativa';

-- ---------------------------------------------------------------------------------------------
-- 4. Propostas e anúncios (inclui recrutamento de Corporações e propagandas)
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS salao_anuncios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autor_id uuid REFERENCES players(id) ON DELETE SET NULL,
  tipo text NOT NULL,
  titulo text NOT NULL,
  texto text NOT NULL,
  -- Recrutamento: nome/código da Corporação (o agente de Corporações publica por publicarRecrutamento()).
  corporacao text,
  custo integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pendente',
  avaliado_por uuid REFERENCES players(id) ON DELETE SET NULL,
  avaliado_at timestamptz,
  nota text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expira_at timestamptz,
  CONSTRAINT salao_anuncios_tipo_chk CHECK (tipo IN ('proposta', 'propaganda', 'recrutamento')),
  CONSTRAINT salao_anuncios_status_chk CHECK (status IN ('pendente', 'publicado', 'recusado', 'retirado')),
  CONSTRAINT salao_anuncios_texto_chk CHECK (char_length(titulo) BETWEEN 3 AND 80 AND char_length(texto) BETWEEN 3 AND 600 AND custo >= 0)
);
CREATE INDEX IF NOT EXISTS salao_anuncios_pub_idx ON salao_anuncios (created_at DESC) WHERE status = 'publicado';
CREATE INDEX IF NOT EXISTS salao_anuncios_pend_idx ON salao_anuncios (created_at) WHERE status = 'pendente';

-- ---------------------------------------------------------------------------------------------
-- 5. Eventos quinzenais e especiais (Calendário Devo). Conteúdo PROVISÓRIO, editável pelo Owner.
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS salao_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL DEFAULT 'especial',
  titulo text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  inicio timestamptz NOT NULL,
  fim timestamptz NOT NULL,
  -- Rótulos curtos do que o evento oferece (cartas comemorativas, essências raras, fragmentos, teatro…).
  destaques text[] NOT NULL DEFAULT '{}',
  provisorio boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES players(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT salao_eventos_tipo_chk CHECK (tipo IN ('quinzenal', 'especial', 'teatro')),
  CONSTRAINT salao_eventos_datas_chk CHECK (fim > inicio)
);
CREATE INDEX IF NOT EXISTS salao_eventos_inicio_idx ON salao_eventos (inicio);

-- ---------------------------------------------------------------------------------------------
-- 6. Livro de Tempo do Salão (auditoria + idempotência de cada crédito/débito)
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS salao_movimentos (
  id bigserial PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  -- Minutos: negativo = débito (sai do pulso na hora), positivo = crédito (livro-caixa do Tempo).
  minutos integer NOT NULL,
  motivo text NOT NULL,
  ref uuid,
  idem_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT salao_movimentos_chk CHECK (minutos <> 0)
);
CREATE INDEX IF NOT EXISTS salao_movimentos_player_idx ON salao_movimentos (player_id, created_at DESC);

-- ---------------------------------------------------------------------------------------------
-- 7. Configuração PROVISÓRIA (editável pelo Owner em /api/staff config.definir). Não sobrescreve.
-- ---------------------------------------------------------------------------------------------
INSERT INTO devo_config (key, value, provisional, note) VALUES
  ('salao.calendario',
   '{"ancora": "2026-10-15T20:00:00-03:00", "intervalo_dias": 3, "duracao_horas": 24, "forcar": null}'::jsonb,
   true, 'PROVISÓRIO: o Salão abre a cada intervalo_dias a partir da âncora (horário de Brasília) e fica aberto duracao_horas. forcar: "aberto" | "fechado" | null (manual do Owner).'),
  ('salao.bandeja',
   '{"raridade_minima": "incomum", "vagas_por_edicao": 12, "max_por_jogador": 3, "lance_minimo": 30, "incremento": 10, "reserva_min": 30}'::jsonb,
   true, 'PROVISÓRIO: raridade mínima das cartas (comum < incomum < rara < lendaria), vagas por edição, lotes ativos por jogador, lance mínimo e incremento padrão (minutos de Tempo) e Tempo mínimo que o pulso precisa manter depois de pagar.'),
  ('salao.contratos',
   '{"avulso": {"nome": "Contrato Avulso", "divulgacao": 20, "comissao_pct": 15, "ordem": 1},
     "patrono": {"nome": "Contrato de Patrono", "divulgacao": 10, "comissao_pct": 10, "ordem": 2},
     "mecenas": {"nome": "Contrato de Mecenas", "divulgacao": 5, "comissao_pct": 5, "ordem": 3}}'::jsonb,
   true, 'PROVISÓRIO: taxa de divulgação (minutos, paga no envio; devolvida se o especialista recusar) e comissão sobre a venda (%), por tipo de contrato.'),
  ('salao.anuncios',
   '{"custo_propaganda": 60, "duracao_dias": 9}'::jsonb,
   true, 'PROVISÓRIO: custo de uma propaganda (minutos de Tempo; propostas não têm custo inicial) e quantos dias o anúncio fica no mural.')
ON CONFLICT (key) DO NOTHING;

-- Eventos PROVISÓRIOS do Calendário Devo (o dono define os definitivos; o Owner edita/remove pelo calendário).
INSERT INTO salao_eventos (id, tipo, titulo, descricao, inicio, fim, destaques, provisorio) VALUES
  ('5a1a0000-0000-4000-8000-000000000001', 'quinzenal', 'Gala Quinzenal das Máscaras',
   '[PROVISÓRIO] Edição comemorativa do leilão: lotes da casa entram junto com os dos jogadores.',
   '2026-10-30T20:00:00-03:00', '2026-10-31T20:00:00-03:00', ARRAY['Cartas comemorativas', 'Essências de afinidade raras'], true),
  ('5a1a0000-0000-4000-8000-000000000002', 'teatro', 'Récita no Camarote Negro',
   '[PROVISÓRIO] Uma peça encenada no palco do Salão antes da abertura dos lances.',
   '2026-11-06T21:00:00-03:00', '2026-11-06T23:00:00-03:00', ARRAY['Peça de teatro'], true),
  ('5a1a0000-0000-4000-8000-000000000003', 'quinzenal', 'Gala Quinzenal das Máscaras',
   '[PROVISÓRIO] Segunda gala do ciclo: fragmentos arcanos entre os lotes da casa.',
   '2026-11-13T20:00:00-03:00', '2026-11-14T20:00:00-03:00', ARRAY['Fragmentos arcanos', 'Cartas comemorativas'], true)
ON CONFLICT (id) DO NOTHING;
