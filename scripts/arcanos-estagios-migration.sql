-- Arcanos: Estágios 0 a VII pagos com Fragmentos Arcanos, e vários Arcanos por jogador (texto do dono de
-- 22/10/2026, docs/redesign/ARCANOS-forca-dono.md). Idempotente: rodar de novo não muda nada.
-- Depende de scripts/fundacao-migration.sql (players.arcano/arcano_estagio, item_defs, devo_config) e de
-- scripts/virtudes-migration.sql (virtude_evolucoes, virtude_pp_log, 'virtudes.estagios', devo_virtude_limite).
--
-- O que muda:
--  1. Estágio começa no 0 ("A Essência", ganho no Deadly Vote do tutorial) e vai até o VII. Os valores antigos
--     (1, 2, 3…) descem um ponto UMA vez só (marcador 'arcanos.estagios_base0' em devo_config).
--  2. player_arcanos: cada Arcano que o jogador tem, com o próprio Estágio. `original` = o Arcano de nascença
--     (o mesmo de players.arcano, que continua definindo as Virtudes); players.arcano_estagio continua sendo o
--     espelho do Estágio do original.
--  3. Itens: 'fragmento_arcano' passa a se chamar "Fragmento Arcano"; novo 'grande_fragmento_arcano'
--     (Grande Fragmento Arcano, lendário), que desperta outro Arcano no Estágio 0.

-- ---------------------------------------------------------------------------------------------
-- 1. Estágio do original: aceita 0 e começa em 0
-- ---------------------------------------------------------------------------------------------
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_arcano_estagio_chk;
ALTER TABLE players ADD CONSTRAINT players_arcano_estagio_chk CHECK (arcano_estagio BETWEEN 0 AND 50);
ALTER TABLE players ALTER COLUMN arcano_estagio SET DEFAULT 0;

-- ---------------------------------------------------------------------------------------------
-- 2. Arcanos de cada jogador
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS player_arcanos (
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  arcano text NOT NULL,
  estagio integer NOT NULL DEFAULT 0,
  original boolean NOT NULL DEFAULT false,
  -- 'registro' (veio de players.arcano), 'recompensa', 'mesa', 'grande_fragmento'
  origem text,
  obtido_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, arcano),
  CONSTRAINT player_arcanos_arcano_chk CHECK (arcano ~ '^[a-z]{2,20}$'),
  CONSTRAINT player_arcanos_estagio_chk CHECK (estagio BETWEEN 0 AND 7)
);
-- No máximo um original por jogador.
CREATE UNIQUE INDEX IF NOT EXISTS player_arcanos_original_uidx ON player_arcanos (player_id) WHERE original;

-- ---------------------------------------------------------------------------------------------
-- 3. Escala nova (0..VII): desce um ponto o que já existia, uma vez só
-- ---------------------------------------------------------------------------------------------
DO $$
DECLARE cfg jsonb; arc text; tab jsonb; novo jsonb;
BEGIN
  IF EXISTS (SELECT 1 FROM devo_config WHERE key = 'arcanos.estagios_base0') THEN RETURN; END IF;

  UPDATE players SET arcano_estagio = greatest(0, arcano_estagio - 1);
  UPDATE virtude_evolucoes SET de_estagio = de_estagio - 1, para_estagio = para_estagio - 1;
  UPDATE virtude_pp_log SET estagio = greatest(0, estagio - 1);

  -- Limites de P.P. por Estágio (padrão e por Arcano): mesmos números, um Estágio abaixo.
  SELECT value INTO cfg FROM devo_config WHERE key = 'virtudes.estagios';
  IF cfg IS NOT NULL THEN
    IF jsonb_typeof(cfg -> 'padrao') = 'array' THEN
      SELECT coalesce(jsonb_agg(jsonb_set(x, '{estagio}', to_jsonb(greatest(0, (x ->> 'estagio')::int - 1))) ORDER BY (x ->> 'estagio')::int), '[]'::jsonb)
        INTO novo FROM jsonb_array_elements(cfg -> 'padrao') x;
      cfg := jsonb_set(cfg, '{padrao}', novo);
    END IF;
    IF jsonb_typeof(cfg -> 'porArcano') = 'object' THEN
      FOR arc, tab IN SELECT key, value FROM jsonb_each(cfg -> 'porArcano') LOOP
        IF jsonb_typeof(tab) = 'array' THEN
          SELECT coalesce(jsonb_agg(jsonb_set(x, '{estagio}', to_jsonb(greatest(0, (x ->> 'estagio')::int - 1))) ORDER BY (x ->> 'estagio')::int), '[]'::jsonb)
            INTO novo FROM jsonb_array_elements(tab) x;
          cfg := jsonb_set(cfg, ARRAY['porArcano', arc], novo);
        END IF;
      END LOOP;
    END IF;
    UPDATE devo_config SET value = cfg, updated_at = now() WHERE key = 'virtudes.estagios';
  END IF;

  -- O texto da Força agora é o do dono (no código); uma edição antiga da Mesa não pode cobri-lo.
  UPDATE devo_config SET value = value - 'forca', updated_at = now() WHERE key = 'virtudes.arcanos' AND value ? 'forca';

  INSERT INTO devo_config (key, value, provisional, note)
  VALUES ('arcanos.estagios_base0', jsonb_build_object('em', now()), false,
          'Marcador: Estágios dos Arcanos já convertidos para a escala 0..VII (scripts/arcanos-estagios-migration.sql). Não apagar.')
  ON CONFLICT (key) DO NOTHING;
END $$;

-- Cada jogador com Arcano registrado ganha a linha do original (roda sempre; só cria o que falta).
INSERT INTO player_arcanos (player_id, arcano, estagio, original, origem)
SELECT p.id, p.arcano, least(7, greatest(0, p.arcano_estagio)), true, 'registro'
  FROM players p
 WHERE p.arcano IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM player_arcanos x WHERE x.player_id = p.id AND x.original)
ON CONFLICT (player_id, arcano) DO NOTHING;

-- ---------------------------------------------------------------------------------------------
-- 4. Limite de P.P. do Estágio: aceita o Estágio 0 (vale a linha mais alta que não passa do Estágio;
--    abaixo da primeira linha, a primeira; além da última, a última).
-- ---------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION devo_virtude_limite(p_arcano text, p_estagio integer, OUT minimo numeric, OUT teto numeric, OUT ultimo boolean)
LANGUAGE plpgsql STABLE AS $$
DECLARE cfg jsonb; tab jsonb; e jsonb; maxe integer;
BEGIN
  SELECT value INTO cfg FROM devo_config WHERE key = 'virtudes.estagios';
  tab := cfg -> 'porArcano' -> coalesce(p_arcano, '');
  IF tab IS NULL OR jsonb_typeof(tab) <> 'array' OR jsonb_array_length(tab) = 0 THEN tab := cfg -> 'padrao'; END IF;
  IF tab IS NULL OR jsonb_typeof(tab) <> 'array' OR jsonb_array_length(tab) = 0 THEN
    tab := '[{"estagio": 0, "minimo": 30, "teto": 100}]'::jsonb;
  END IF;
  SELECT max((x ->> 'estagio')::int) INTO maxe FROM jsonb_array_elements(tab) x;
  SELECT x INTO e FROM jsonb_array_elements(tab) x WHERE (x ->> 'estagio')::int <= coalesce(p_estagio, 0)
   ORDER BY (x ->> 'estagio')::int DESC LIMIT 1;
  IF e IS NULL THEN SELECT x INTO e FROM jsonb_array_elements(tab) x ORDER BY (x ->> 'estagio')::int ASC LIMIT 1; END IF;
  minimo := greatest(0, coalesce((e ->> 'minimo')::numeric, 0));
  teto := greatest(0, coalesce((e ->> 'teto')::numeric, 0));
  ultimo := coalesce(p_estagio, 0) >= 7;
END $$;

-- ---------------------------------------------------------------------------------------------
-- 5. Itens
-- ---------------------------------------------------------------------------------------------
UPDATE item_defs SET name = 'Fragmento Arcano' WHERE key = 'fragmento_arcano' AND name <> 'Fragmento Arcano';
INSERT INTO item_defs (key, kind, name, description, rarity, stackable, meta) VALUES
  ('grande_fragmento_arcano', 'fragmento', 'Grande Fragmento Arcano',
   'Um pedaço inteiro de um Arcano. Desperta um Arcano que não é o seu, no Estágio 0.', 'lendario', true, '{}')
ON CONFLICT (key) DO NOTHING;
