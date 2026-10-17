-- Grandioso Calendário Devo (texto do dono: docs/redesign/CALENDARIO-dono.md).
-- Depende de scripts/fundacao-migration.sql (players, devo_config, item_defs, card_deliveries, arcade_profiles,
-- admin_log) e de scripts/virtudes-migration.sql (P.P. do check-in).
-- Idempotente: rodar duas vezes não quebra nem duplica.
--
-- Regras que o BANCO garante (além do servidor em lib/devo/calendario-server.ts):
--   · um check-in por jogador, por dia (horário de Brasília) e por tipo: PK (player_id, dia, tipo) — toque duplo,
--     duas abas ou rede instável não resgatam duas vezes ('diario' e cada 'evento:<id>' são tipos separados);
--   · o ciclo de 7 dias só anda com um resgate (a posição do dia fica gravada na linha do resgate);
--   · eventos removidos ficam com removido_at (não voltam ao rodar a migração de novo: os da migração têm slug).

-- ---------------------------------------------------------------------------------------------
-- 1. Eventos programados
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS calendario_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Eventos que vêm da migração/seed (feriados): a chave impede duplicar ou ressuscitar ao rodar de novo.
  slug text UNIQUE,
  titulo text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  -- Datas no calendário de Brasília. `anual` repete todo ano no mesmo dia/mês (Natal, Halloween).
  inicio date NOT NULL,
  fim date NOT NULL,
  anual boolean NOT NULL DEFAULT false,
  -- "Fique atento" (atencao) · "Dia de folga" (folga) · sem destaque (normal).
  enfase text NOT NULL DEFAULT 'normal',
  -- Espaço da arte: caminho em /images/… ou URL https (opcional; sem arte → placa ornamental).
  arte text,
  -- Check-in extra do evento (datas comemorativas): { "titulo": "…", "recompensas": [Recompensa, …] } ou NULL.
  -- Recompensa = {"tipo":"pp","quantidade":n} | {"tipo":"item","item":"<chave>","quantidade":n}
  --             | {"tipo":"tempo","minutos":n} | {"tipo":"carta","raridade":"incomum"}
  checkin jsonb,
  criado_por uuid REFERENCES players(id) ON DELETE SET NULL,
  atualizado_por uuid REFERENCES players(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  removido_at timestamptz,
  CONSTRAINT calendario_eventos_enfase_chk CHECK (enfase IN ('atencao', 'folga', 'normal')),
  CONSTRAINT calendario_eventos_datas_chk CHECK (fim >= inicio AND fim - inicio <= 31),
  CONSTRAINT calendario_eventos_titulo_chk CHECK (char_length(titulo) BETWEEN 2 AND 60),
  CONSTRAINT calendario_eventos_descricao_chk CHECK (char_length(descricao) <= 240),
  CONSTRAINT calendario_eventos_checkin_chk CHECK (checkin IS NULL OR jsonb_typeof(checkin->'recompensas') = 'array')
);
CREATE INDEX IF NOT EXISTS calendario_eventos_inicio_idx ON calendario_eventos (inicio) WHERE removido_at IS NULL;

-- ---------------------------------------------------------------------------------------------
-- 2. Check-ins (diário e de evento)
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS calendario_checkins (
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  -- Dia do check-in no horário de Brasília.
  dia date NOT NULL,
  -- 'diario' (ciclo de 7 dias) ou 'evento:<id do evento>'.
  tipo text NOT NULL,
  evento_id uuid REFERENCES calendario_eventos(id) ON DELETE SET NULL,
  -- Início da ocorrência do evento (num evento anual, a do ano): conta os resgates daquela edição.
  ocorrencia date,
  -- Diário: dia do ciclo (1..7). Evento: n-ésimo resgate daquela ocorrência (1..).
  posicao smallint NOT NULL,
  recompensa jsonb NOT NULL,
  -- O que de fato entrou (P.P. que couberam, carta sorteada, minutos…), para a Mesa e o teste.
  aplicado jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, dia, tipo),
  CONSTRAINT calendario_checkins_tipo_chk CHECK (tipo = 'diario' OR tipo ~ '^evento:[0-9a-f-]{36}$'),
  CONSTRAINT calendario_checkins_posicao_chk CHECK (posicao BETWEEN 1 AND 32)
);
CREATE INDEX IF NOT EXISTS calendario_checkins_ultimo_idx ON calendario_checkins (player_id, tipo, dia DESC);

-- ---------------------------------------------------------------------------------------------
-- 3. Configuração (Owner edita em Ajustes ou na seção Calendário da Mesa)
-- ---------------------------------------------------------------------------------------------
INSERT INTO devo_config (key, value, provisional, note) VALUES
  ('calendario.checkin.ciclo',
   '[{"tipo": "pp", "quantidade": 50},
     {"tipo": "pp", "quantidade": 75},
     {"tipo": "item", "item": "fragmento_arcano", "quantidade": 2},
     {"tipo": "tempo", "minutos": 120},
     {"tipo": "item", "item": "dracma_comum", "quantidade": 5},
     {"tipo": "item", "item": "dracma_incomum", "quantidade": 2},
     {"tipo": "carta", "raridade": "incomum"}]'::jsonb,
   false, 'Texto do dono (17/10): Dia 1: 50 PP · Dia 2: 75 PP · Dia 3: +2 Fragmentos Arcanos · Dia 4: +2 Horas · Dia 5: +5 Dracmas Comuns · Dia 6: +2 Dracmas Incomuns · Dia 7: Carta Incomum.'),
  ('calendario.checkin.regras',
   '{"falta": "pausa", "pp_virtude": "arcano", "pp_virtude_padrao": "paus"}'::jsonb,
   true, 'PROVISÓRIO (decisão para o dono): falta = "pausa" (perder um dia não zera; o ciclo continua de onde parou) ou "reinicia" (volta ao Dia 1). P.P. do check-in vão para a Virtude de afinidade Excelente do Arcano do jogador; sem Arcano, para pp_virtude_padrao.'),
  ('desbloqueio.livres',
   '["calendario"]'::jsonb,
   true, 'PROVISÓRIO: sistemas liberados para todo jogador desde o início (sem tutorial). O Calendário entra aqui porque o check-in diário puxa a volta diária.')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------------------------
-- 4. Datas comemorativas iniciais (o Owner edita ou remove pela Mesa; removidas não voltam)
-- ---------------------------------------------------------------------------------------------
INSERT INTO calendario_eventos (slug, titulo, descricao, inicio, fim, anual, enfase) VALUES
  ('natal', 'Natal', 'As luzes ficam acesas até tarde e quase ninguém tem pressa.', '2026-12-25', '2026-12-25', true, 'folga'),
  ('halloween', 'Halloween', 'Máscaras demais pelas ruas. Repare em quem está por trás delas.', '2026-10-31', '2026-10-31', true, 'atencao'),
  ('festa-junina', 'Festa Junina', 'Fogueira, quadrilha e bandeirinhas.', '2027-06-24', '2027-06-24', true, 'folga'),
  ('carnaval-2027', 'Carnaval', 'Quatro dias de festa pelas ruas.', '2027-02-06', '2027-02-09', false, 'folga')
ON CONFLICT (slug) DO NOTHING;
