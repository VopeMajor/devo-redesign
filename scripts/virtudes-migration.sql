-- Virtudes e Pontos de Potencial (DIRECAO-3 §2; docs/redesign/VIRTUDES.md). Idempotente.
-- Depende de scripts/fundacao-migration.sql (players.arcano/arcano_estagio, devo_config, admin_log).
-- Contrato: docs/redesign/FUNDACAO.md §12. Regra do dono: os números ficam aqui e na Mesa; o jogador só vê
-- rótulos qualitativos (afinidade, quanto acumulou, para onde pendeu).

-- P.P. acumulados no Estágio atual, por Virtude (o "nutriente" da metamorfose). A soma nunca passa do teto
-- do Estágio (devo_virtude_pp_add). Zeram na Evolução de Estágio.
CREATE TABLE IF NOT EXISTS virtude_pp (
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  virtude text NOT NULL,
  pp numeric(12, 2) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, virtude),
  CONSTRAINT virtude_pp_virtude_chk CHECK (virtude IN ('paus', 'copas', 'ouros', 'espadas', 'tacas', 'escudos')),
  CONSTRAINT virtude_pp_pp_chk CHECK (pp >= 0)
);

-- Atributos de fato (o que o bot usa): somam os ganhos de cada Evolução de Estágio.
CREATE TABLE IF NOT EXISTS virtude_nivel (
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  virtude text NOT NULL,
  valor numeric(14, 2) NOT NULL DEFAULT 0,
  PRIMARY KEY (player_id, virtude),
  CONSTRAINT virtude_nivel_virtude_chk CHECK (virtude IN ('paus', 'copas', 'ouros', 'espadas', 'tacas', 'escudos'))
);

-- Livro de toda entrada de P.P.: pedido (o que a fonte quis dar) e aplicado (o que coube no teto).
-- idem_key: a mesma chave nunca soma duas vezes (ex.: 'jogo:<partida>', 'dv:<voto>:<jogador>:participacao').
CREATE TABLE IF NOT EXISTS virtude_pp_log (
  id bigserial PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  virtude text NOT NULL,
  pedido numeric(12, 2) NOT NULL,
  aplicado numeric(12, 2) NOT NULL,
  estagio integer NOT NULL,
  motivo text NOT NULL,
  ref text,
  actor_id uuid REFERENCES players(id) ON DELETE SET NULL,
  idem_key text UNIQUE,
  at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS virtude_pp_log_player_idx ON virtude_pp_log (player_id, at DESC);

-- Histórico de Evoluções de Estágio (quem disparou, quanto havia, como se espalhou).
CREATE TABLE IF NOT EXISTS virtude_evolucoes (
  id bigserial PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  arcano text,
  de_estagio integer NOT NULL,
  para_estagio integer NOT NULL,
  total numeric(12, 2) NOT NULL,
  acumulado jsonb NOT NULL DEFAULT '{}',
  ganhos jsonb NOT NULL DEFAULT '{}',
  actor_id uuid REFERENCES players(id) ON DELETE SET NULL,
  at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT virtude_evolucoes_estagio_chk CHECK (para_estagio = de_estagio + 1)
);
CREATE INDEX IF NOT EXISTS virtude_evolucoes_player_idx ON virtude_evolucoes (player_id, at DESC);

-- ---------------------------------------------------------------------------------------------
-- Configuração (PROVISÓRIA, editável pelo Owner na Mesa › Virtudes)
-- ---------------------------------------------------------------------------------------------
INSERT INTO devo_config (key, value, provisional, note) VALUES
  ('virtudes.afinidades', $json${"fonte":"Google Doc do dono \"Cópia de Upgrade Virtudes\" (lido em 16/10/2026). Ordem 1 = maior afinidade, 6 = menor; colunas paus, copas, ouros, espadas, tacas, escudos.","escala":[0.5,0.25,0.15,0.1,0.05,0.015],"ordem":{"louco":{"paus":6,"copas":3,"ouros":4,"espadas":1,"tacas":2,"escudos":5},"mago":{"paus":6,"copas":5,"ouros":2,"espadas":3,"tacas":1,"escudos":4},"sacerdotisa":{"paus":6,"copas":2,"ouros":3,"espadas":5,"tacas":1,"escudos":4},"imperatriz":{"paus":6,"copas":3,"ouros":4,"espadas":5,"tacas":1,"escudos":2},"imperador":{"paus":4,"copas":5,"ouros":6,"espadas":3,"tacas":2,"escudos":1},"hierofante":{"paus":5,"copas":6,"ouros":3,"espadas":2,"tacas":1,"escudos":4},"enamorados":{"paus":5,"copas":3,"ouros":4,"espadas":6,"tacas":2,"escudos":1},"carro":{"paus":3,"copas":2,"ouros":5,"espadas":1,"tacas":6,"escudos":4},"forca":{"paus":2,"copas":1,"ouros":6,"espadas":3,"tacas":5,"escudos":4},"eremita":{"paus":4,"copas":2,"ouros":1,"espadas":3,"tacas":6,"escudos":5},"fortuna":{"paus":4,"copas":6,"ouros":1,"espadas":5,"tacas":2,"escudos":3},"justica":{"paus":4,"copas":6,"ouros":2,"espadas":1,"tacas":5,"escudos":3},"enforcado":{"paus":1,"copas":5,"ouros":2,"espadas":6,"tacas":4,"escudos":3},"morte":{"paus":6,"copas":5,"ouros":2,"espadas":3,"tacas":1,"escudos":4},"temperanca":{"paus":1,"copas":2,"ouros":3,"espadas":4,"tacas":5,"escudos":6},"diabo":{"paus":6,"copas":1,"ouros":5,"espadas":4,"tacas":2,"escudos":3},"torre":{"paus":1,"copas":2,"ouros":4,"espadas":5,"tacas":6,"escudos":3},"estrela":{"paus":4,"copas":5,"ouros":3,"espadas":6,"tacas":1,"escudos":2},"lua":{"paus":6,"copas":5,"ouros":1,"espadas":4,"tacas":3,"escudos":2},"sol":{"paus":4,"copas":1,"ouros":5,"espadas":3,"tacas":6,"escudos":2},"julgamento":{"paus":3,"copas":2,"ouros":6,"espadas":1,"tacas":5,"escudos":4},"mundo":{"paus":4,"copas":6,"ouros":3,"espadas":5,"tacas":2,"escudos":1}},"divergencias":{"imperador":{"confirmar":true,"nota":"A lista do corpo do doc difere da tabela: lista dá Ouros ×0,25 (2º), Taças ×0,015 (6º) e Paus e Copas empatados em ×0,10; a tabela dá Taças 2º, Paus 4º, Copas 5º e Ouros 6º. Em uso: a tabela."},"lua":{"confirmar":true,"nota":"Aparece duas vezes no corpo com valores diferentes, e nenhuma das duas listas bate com a tabela. Tabela: Paus 6º, Copas 5º. As duas listas: Copas 6º, Paus 5º; a primeira ainda troca Taças (2º) e Escudos (3º). Em uso: a tabela."},"imperatriz":{"confirmar":true,"nota":"A lista dá Escudos ×0,50 e Taças ×0,25; a tabela dá Taças 1º e Escudos 2º. Em uso: a tabela."},"diabo":{"confirmar":true,"nota":"A lista dá Paus ×0,05 e Ouros ×0,015; a tabela dá Ouros 5º e Paus 6º. Em uso: a tabela."},"morte":{"confirmar":true,"nota":"O exemplo da introdução difere (Copas ×0,15, Ouros e Espadas empatados em ×0,10, Escudos ×0,05). A lista completa mais abaixo confere com a tabela. Em uso: a tabela."},"sol":{"confirmar":true,"nota":"A tabela foi cortada depois de Ouros. Espadas, Taças e Escudos vêm da lista do corpo (Escudos 2º, Espadas 3º, Taças 6º)."},"mundo":{"confirmar":true,"nota":"Fora da tabela: ordem tirada dos multiplicadores da lista. Os símbolos de Paus (deficiente, com ×0,10) e Copas (com ×0,015) contradizem os números; usamos os números."},"julgamento":{"confirmar":true,"nota":"Fora da tabela: ordem tirada dos multiplicadores da lista (os símbolos da lista não batem com os números)."},"torre":{"confirmar":false,"nota":"Confere com a tabela pelos multiplicadores, mas os símbolos da lista estão trocados e Espadas aparece como ×0,5 (provável ×0,05)."},"eremita":{"confirmar":false,"nota":"Confere com a tabela; Escudos aparece como ×0,5 (provável ×0,05)."},"estrela":{"confirmar":false,"nota":"Confere com a tabela; Paus aparece como ×0,010 (provável ×0,10)."},"temperanca":{"confirmar":false,"nota":"Confere com a tabela pelos multiplicadores; os símbolos da lista estão trocados."},"justica":{"confirmar":false,"nota":"Aparece duas vezes no corpo, com a mesma ordem; confere com a tabela."},"forca":{"confirmar":false,"nota":"Aparece duas vezes no corpo, com a mesma ordem; confere com a tabela."}}}$json$::jsonb, true,
   'Ordem de afinidade Arcano × Virtude (tabela do doc do dono). Divergências marcadas em "divergencias" para o dono confirmar.'),
  ('virtudes.estagios', '{"padrao": [{"estagio": 1, "minimo": 30, "teto": 100}, {"estagio": 2, "minimo": 60, "teto": 160}, {"estagio": 3, "minimo": 100, "teto": 240}, {"estagio": 4, "minimo": 150, "teto": 340}, {"estagio": 5, "minimo": 210, "teto": 460}], "porArcano": {}}'::jsonb, true,
   'PROVISÓRIO: mínimo e teto de P.P. por Estágio (o doc diz que o Arcano define; porArcano sobrescreve o padrão).'),
  ('virtudes.evolucao', '{"peso_direcao": 0.35, "fragmentos": 0}'::jsonb, true,
   'PROVISÓRIO: quanto o tipo de esforço inclina a distribuição (0 = só afinidade) e Fragmentos de Arcano gastos por Evolução.'),
  ('virtudes.fontes', '{"jogos": {"chess": {"virtude": "ouros", "vitoria": 3, "empate": 2, "derrota": 1}, "memory-rush": {"virtude": "ouros", "vitoria": 3, "empate": 2, "derrota": 1}, "hot-bomb": {"virtude": "espadas", "vitoria": 3, "empate": 2, "derrota": 1}, "bluff": {"virtude": "escudos", "vitoria": 3, "empate": 2, "derrota": 1}}, "deadly_vote": {"participacao": {"paus": 2}, "sobreviveu": {"tacas": 2, "paus": 1}}}'::jsonb, true,
   'PROVISÓRIO: P.P. que cada partida da Sala de Jogos e cada Deadly Vote rendem, e em qual Virtude.')
ON CONFLICT (key) DO NOTHING;

-- Mínimo e teto do Estágio para o Arcano (porArcano > padrão; além do último Estágio vale o último).
CREATE OR REPLACE FUNCTION devo_virtude_limite(p_arcano text, p_estagio integer, OUT minimo numeric, OUT teto numeric, OUT ultimo boolean)
LANGUAGE plpgsql STABLE AS $$
DECLARE cfg jsonb; tab jsonb; e jsonb; maxe integer;
BEGIN
  SELECT value INTO cfg FROM devo_config WHERE key = 'virtudes.estagios';
  tab := cfg -> 'porArcano' -> coalesce(p_arcano, '');
  IF tab IS NULL OR jsonb_typeof(tab) <> 'array' OR jsonb_array_length(tab) = 0 THEN tab := cfg -> 'padrao'; END IF;
  IF tab IS NULL OR jsonb_typeof(tab) <> 'array' OR jsonb_array_length(tab) = 0 THEN
    tab := '[{"estagio": 1, "minimo": 30, "teto": 100}]'::jsonb;
  END IF;
  SELECT max((x ->> 'estagio')::int) INTO maxe FROM jsonb_array_elements(tab) x;
  SELECT x INTO e FROM jsonb_array_elements(tab) x WHERE (x ->> 'estagio')::int = least(p_estagio, maxe)
   ORDER BY (x ->> 'estagio')::int DESC LIMIT 1;
  IF e IS NULL THEN SELECT x INTO e FROM jsonb_array_elements(tab) x ORDER BY (x ->> 'estagio')::int DESC LIMIT 1; END IF;
  minimo := greatest(0, coalesce((e ->> 'minimo')::numeric, 0));
  teto := greatest(0, coalesce((e ->> 'teto')::numeric, 0));
  ultimo := p_estagio >= maxe;
END $$;

-- Soma P.P. numa Virtude respeitando o teto do Estágio (a SOMA das seis nunca passa dele). Retorna o
-- quanto foi aplicado (0 se já estava no teto). Com p_idem repetido, não soma de novo e devolve o aplicado
-- da primeira vez. Uma trava por jogador serializa as entradas.
CREATE OR REPLACE FUNCTION devo_virtude_pp_add(p_player uuid, p_virtude text, p_qtd numeric, p_motivo text,
                                               p_ref text DEFAULT NULL, p_actor uuid DEFAULT NULL, p_idem text DEFAULT NULL)
RETURNS numeric LANGUAGE plpgsql AS $$
DECLARE v_arcano text; v_estagio integer; v_teto numeric; v_total numeric; v_apl numeric; v_prev numeric;
BEGIN
  IF p_virtude IS NULL OR p_virtude NOT IN ('paus', 'copas', 'ouros', 'espadas', 'tacas', 'escudos') THEN
    RAISE EXCEPTION 'VIRTUDE_DESCONHECIDA';
  END IF;
  IF p_qtd IS NULL OR p_qtd <= 0 OR p_qtd > 1000 THEN RAISE EXCEPTION 'QUANTIDADE_INVALIDA'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('devo-virtudes:' || p_player::text));
  IF p_idem IS NOT NULL THEN
    SELECT aplicado INTO v_prev FROM virtude_pp_log WHERE idem_key = p_idem;
    IF FOUND THEN RETURN v_prev; END IF;
  END IF;
  SELECT arcano, arcano_estagio INTO v_arcano, v_estagio FROM players WHERE id = p_player;
  IF NOT FOUND THEN RAISE EXCEPTION 'JOGADOR_DESCONHECIDO'; END IF;
  SELECT l.teto INTO v_teto FROM devo_virtude_limite(v_arcano, v_estagio) l;
  SELECT coalesce(sum(pp), 0) INTO v_total FROM virtude_pp WHERE player_id = p_player;
  v_apl := round(least(p_qtd, greatest(0, v_teto - v_total)), 2);
  IF v_apl > 0 THEN
    INSERT INTO virtude_pp (player_id, virtude, pp) VALUES (p_player, p_virtude, v_apl)
    ON CONFLICT (player_id, virtude) DO UPDATE SET pp = virtude_pp.pp + EXCLUDED.pp, updated_at = now();
  END IF;
  INSERT INTO virtude_pp_log (player_id, virtude, pedido, aplicado, estagio, motivo, ref, actor_id, idem_key)
  VALUES (p_player, p_virtude, round(p_qtd, 2), v_apl, v_estagio, left(coalesce(p_motivo, 'sistema'), 60), p_ref, p_actor, p_idem);
  RETURN v_apl;
END $$;
