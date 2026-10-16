-- Corporações (DIRECAO-3 §2; diálogo da Melissa em docs/redesign/SISTEMAS-texto-do-dono.txt).
-- Depende de scripts/fundacao-migration.sql (players, devo_config, card_deliveries, arcade_profiles, admin_log)
-- e de scripts/salao-migration.sql (cartas presas no Salão não podem ser transferidas).
-- Idempotente: rodar duas vezes não quebra nem duplica.
--
-- Regras que o BANCO garante (além do servidor em lib/devo/corporacoes-server.ts):
--   · um Record está em no máximo UMA Corporação (PK de corporacao_membros = player_id);
--   · uma Corporação tem exatamente um líder (índice único parcial);
--   · no máximo um pedido de entrada pendente por Record, e uma fundação em análise por fundador;
--   · nome único entre as Corporações em análise ou ativas (sem diferenciar maiúsculas);
--   · uma carta (uid do save) sai do remetente uma vez só (índice único (de_id, card_uid)); o /api/save descarta
--     os uids transferidos, então uma cópia velha do save não ressuscita a carta;
--   · Tempo pago/devolvido passa por corporacao_movimentos com idem_key único (fundar cobra uma vez);
--   · a classificação (oficial / necro) só muda com um ator da equipe superior (gatilho corporacao_classificacao_guard).

-- ---------------------------------------------------------------------------------------------
-- 1. Corporações
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS corporacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Código de identificação (gerado na aprovação). É o que se digita na página para pedir entrada.
  codigo text UNIQUE,
  nome text NOT NULL,
  lema text,
  -- Brasão: forma + cor da paleta (escolhidos na fundação; ver lib/devo/corporacoes.ts).
  brasao_forma text NOT NULL DEFAULT 'escudo',
  brasao_cor text NOT NULL DEFAULT 'aco',
  -- pendente (aguarda aprovação administrativa) → ativa | recusada | cancelada; ativa → dissolvida.
  status text NOT NULL DEFAULT 'pendente',
  -- Status legal (Código da Companhia): oficial | necro (Necro-Corporação, ilegal). Só a equipe classifica.
  classificacao text NOT NULL DEFAULT 'oficial',
  classificacao_nota text,
  classificada_por uuid REFERENCES players(id) ON DELETE SET NULL,
  classificada_at timestamptz,
  -- PROVISÓRIO ("Corporações Globais"): local | global. Só rótulo por enquanto.
  escopo text NOT NULL DEFAULT 'local',
  fundador_id uuid REFERENCES players(id) ON DELETE SET NULL,
  -- Tempo pago na fundação (minutos) e requisitos do perfil no momento do pedido (para a avaliação).
  custo_pago integer NOT NULL DEFAULT 0,
  requisitos jsonb NOT NULL DEFAULT '[]'::jsonb,
  decisao_nota text,
  decidida_por uuid REFERENCES players(id) ON DELETE SET NULL,
  decidida_at timestamptz,
  dissolvida_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT corporacoes_status_chk CHECK (status IN ('pendente', 'ativa', 'recusada', 'cancelada', 'dissolvida')),
  CONSTRAINT corporacoes_classificacao_chk CHECK (classificacao IN ('oficial', 'necro')),
  CONSTRAINT corporacoes_escopo_chk CHECK (escopo IN ('local', 'global')),
  CONSTRAINT corporacoes_nome_chk CHECK (char_length(nome) BETWEEN 3 AND 40),
  CONSTRAINT corporacoes_custo_chk CHECK (custo_pago >= 0)
);
-- Chave do envio do formulário de fundação (toque duplo / rede instável não cria nem cobra duas vezes).
ALTER TABLE corporacoes ADD COLUMN IF NOT EXISTS envio_idem text;
CREATE UNIQUE INDEX IF NOT EXISTS corporacoes_envio_idx ON corporacoes (fundador_id, envio_idem) WHERE envio_idem IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS corporacoes_nome_idx ON corporacoes (lower(nome)) WHERE status IN ('pendente', 'ativa');
CREATE UNIQUE INDEX IF NOT EXISTS corporacoes_fundador_pendente_idx ON corporacoes (fundador_id) WHERE status = 'pendente';
CREATE INDEX IF NOT EXISTS corporacoes_status_idx ON corporacoes (status, created_at);

-- ---------------------------------------------------------------------------------------------
-- 2. Membros (um Record, uma Corporação)
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS corporacao_membros (
  player_id uuid PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  corporacao_id uuid NOT NULL REFERENCES corporacoes(id) ON DELETE CASCADE,
  cargo text NOT NULL DEFAULT 'membro',
  entrou_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT corporacao_membros_cargo_chk CHECK (cargo IN ('lider', 'vice', 'membro'))
);
CREATE UNIQUE INDEX IF NOT EXISTS corporacao_membros_lider_idx ON corporacao_membros (corporacao_id) WHERE cargo = 'lider';
CREATE INDEX IF NOT EXISTS corporacao_membros_corp_idx ON corporacao_membros (corporacao_id);

-- ---------------------------------------------------------------------------------------------
-- 3. Pedidos de entrada (pelo código ou por convite de um membro comum) → líder ou vice decide
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS corporacao_pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corporacao_id uuid NOT NULL REFERENCES corporacoes(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  origem text NOT NULL DEFAULT 'codigo',
  convidado_por uuid REFERENCES players(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pendente',
  decidido_por uuid REFERENCES players(id) ON DELETE SET NULL,
  decidido_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT corporacao_pedidos_origem_chk CHECK (origem IN ('codigo', 'convite')),
  CONSTRAINT corporacao_pedidos_status_chk CHECK (status IN ('pendente', 'aprovado', 'recusado', 'cancelado'))
);
CREATE UNIQUE INDEX IF NOT EXISTS corporacao_pedidos_pendente_idx ON corporacao_pedidos (player_id) WHERE status = 'pendente';
CREATE INDEX IF NOT EXISTS corporacao_pedidos_corp_idx ON corporacao_pedidos (corporacao_id, status);

-- ---------------------------------------------------------------------------------------------
-- 4. Convites diretos (de um membro para um Record)
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS corporacao_convites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corporacao_id uuid NOT NULL REFERENCES corporacoes(id) ON DELETE CASCADE,
  de_id uuid REFERENCES players(id) ON DELETE SET NULL,
  para_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pendente',
  respondido_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT corporacao_convites_status_chk CHECK (status IN ('pendente', 'aceito', 'recusado', 'cancelado'))
);
CREATE UNIQUE INDEX IF NOT EXISTS corporacao_convites_pendente_idx ON corporacao_convites (corporacao_id, para_id) WHERE status = 'pendente';
CREATE INDEX IF NOT EXISTS corporacao_convites_para_idx ON corporacao_convites (para_id, status);

-- ---------------------------------------------------------------------------------------------
-- 5. Transferência de cartas entre membros (vantagem da Corporação)
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS corporacao_transferencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corporacao_id uuid REFERENCES corporacoes(id) ON DELETE SET NULL,
  de_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  para_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  card_uid text NOT NULL,
  card_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT corporacao_transferencias_chk CHECK (de_id <> para_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS corporacao_transferencias_carta_idx ON corporacao_transferencias (de_id, card_uid);
CREATE INDEX IF NOT EXISTS corporacao_transferencias_corp_idx ON corporacao_transferencias (corporacao_id, created_at DESC);

-- ---------------------------------------------------------------------------------------------
-- 6. Rivalidades (PROVISÓRIO: "Corporações Rivais" — só estrutura e rótulo por enquanto)
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS corporacao_rivalidades (
  a_id uuid NOT NULL REFERENCES corporacoes(id) ON DELETE CASCADE,
  b_id uuid NOT NULL REFERENCES corporacoes(id) ON DELETE CASCADE,
  nota text,
  provisorio boolean NOT NULL DEFAULT true,
  criada_por uuid REFERENCES players(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (a_id, b_id),
  CONSTRAINT corporacao_rivalidades_ordem_chk CHECK (a_id < b_id)
);

-- ---------------------------------------------------------------------------------------------
-- 7. Estado do Record no sistema (apresentação da Companhia vista) e livro de Tempo
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS corporacao_estado (
  player_id uuid PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  apresentado_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS corporacao_movimentos (
  id bigserial PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  -- Minutos: negativo = débito (sai do pulso na hora), positivo = crédito (livro-caixa do Tempo).
  minutos integer NOT NULL,
  motivo text NOT NULL,
  ref uuid,
  idem_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT corporacao_movimentos_chk CHECK (minutos <> 0)
);
CREATE INDEX IF NOT EXISTS corporacao_movimentos_player_idx ON corporacao_movimentos (player_id, created_at DESC);

-- ---------------------------------------------------------------------------------------------
-- 8. Guarda da classificação: oficial ↔ necro só com ator Owner/Anfitrião (devo.actor de txAs)
-- ---------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION devo_corporacao_classificacao_guard() RETURNS trigger AS $$
DECLARE
  ator uuid := nullif(current_setting('devo.actor', true), '')::uuid;
  cargo text;
BEGIN
  IF NEW.classificacao IS DISTINCT FROM OLD.classificacao THEN
    SELECT role INTO cargo FROM players WHERE id = ator;
    IF cargo IS NULL OR cargo NOT IN ('owner', 'anfitriao', 'admin') THEN
      RAISE EXCEPTION 'CORP_CLASSIFICACAO_NEGADA';
    END IF;
    NEW.classificada_por := ator;
    NEW.classificada_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS corporacao_classificacao_guard ON corporacoes;
CREATE TRIGGER corporacao_classificacao_guard BEFORE UPDATE ON corporacoes
  FOR EACH ROW EXECUTE FUNCTION devo_corporacao_classificacao_guard();

-- ---------------------------------------------------------------------------------------------
-- 9. Configuração PROVISÓRIA (editável pelo Owner em /api/staff config.definir). Não sobrescreve.
-- ---------------------------------------------------------------------------------------------
INSERT INTO devo_config (key, value, provisional, note) VALUES
  ('corporacoes.criacao',
   '{"custo_minutos": 360, "reserva_minutos": 120, "devolver_se_recusada": true, "max_membros": 12,
     "requisitos": {"deadly_votes_sobrevividos": 1, "dias_de_registro": 0, "cartas_minimas": 3}}'::jsonb,
   true, 'PROVISÓRIO: Tempo para fundar (minutos, pago no pedido; devolvido se a Companhia recusar), Tempo que o pulso precisa manter depois de pagar, limite de membros e requisitos do perfil avaliados pela equipe.'),
  ('corporacoes.perfil_visivel',
   '["personagem", "registro_desde", "deadly_votes", "cartas", "aparencia"]'::jsonb,
   true, 'PROVISÓRIO: partes do perfil do candidato que o líder/vice vê durante o pedido de entrada (personagem, registro_desde, deadly_votes, cartas, aparencia). Nunca cargo, karma, senha ou e-mail.'),
  ('corporacoes.transferencia',
   '{"por_dia": 5}'::jsonb,
   true, 'PROVISÓRIO: cartas que um membro pode transferir por dia (horário de Brasília).'),
  ('corporacoes.codigo_regras',
   '{"titulo": "Código da Companhia de Despertados", "artigos": [
      "[PROVISÓRIO] I. Toda Corporação se registra na Companhia e mantém o código de identificação em dia.",
      "[PROVISÓRIO] II. Nenhuma Corporação pode sabotar Deadly Votes, fraudar trocas ou coagir Records a entrar ou permanecer.",
      "[PROVISÓRIO] III. Cartas transferidas entre membros não podem ser revendidas para quem está fora da Corporação no mesmo dia.",
      "[PROVISÓRIO] IV. Líder e vice-líder respondem pelos atos da Corporação diante da Companhia.",
      "[PROVISÓRIO] V. A violação deste código classifica a Corporação como Necro-Corporação."
    ]}'::jsonb,
   true, 'PROVISÓRIO: texto do código de regras da Companhia (o dono escreve o definitivo).'),
  ('corporacoes.jogos_coletivos',
   '[{"id": "vigilia", "titulo": "Vigília Coletiva", "descricao": "[PROVISÓRIO] Um jogo especial em que a Corporação inteira divide o mesmo relógio.", "min_membros": 3},
     {"id": "torneio", "titulo": "Torneio entre Corporações", "descricao": "[PROVISÓRIO] Disputa entre Corporações oficiais, com prêmios para todos os membros.", "min_membros": 4}]'::jsonb,
   true, 'PROVISÓRIO: jogos coletivos especiais (só dados; a página mostra "em breve").')
ON CONFLICT (key) DO NOTHING;
