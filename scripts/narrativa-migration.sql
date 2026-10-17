-- Narrativa e progressão (DIRECAO-3 §1, §2): progresso de cenas de diálogo e efeitos aplicados uma vez só.
-- Idempotente. Depende de fundacao-migration.sql (players, devo_config). Contrato: docs/redesign/DIALOGO.md.

-- Em que passo o jogador parou em cada cena (retomar onde parou) e se já terminou.
CREATE TABLE IF NOT EXISTS dialog_progress (
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  scene_id text NOT NULL,
  step integer NOT NULL DEFAULT 0,
  done_at timestamptz,
  started_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, scene_id),
  CONSTRAINT dialog_progress_scene_chk CHECK (scene_id ~ '^[a-z0-9-]{2,60}$'),
  CONSTRAINT dialog_progress_step_chk CHECK (step >= 0 AND step < 10000)
);

-- Escolhas feitas e efeitos aplicados. A chave primária garante: cada efeito vale UMA vez por jogador.
--   key = 'e:<escolha>' (escolha de uma opção só: a primeira vale), 'e:<escolha>:<n>' (modo explorar),
--         'p:<efeito>' (passo de efeito), 'fim' (efeitos ao concluir).
CREATE TABLE IF NOT EXISTS dialog_events (
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  scene_id text NOT NULL,
  key text NOT NULL,
  option_index integer,
  applied jsonb NOT NULL DEFAULT '[]'::jsonb,
  at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, scene_id, key),
  CONSTRAINT dialog_events_key_chk CHECK (key ~ '^(fim|[ep]:[a-z0-9-]{1,60}(:[0-9]{1,2})?)$')
);
CREATE INDEX IF NOT EXISTS dialog_events_scene_idx ON dialog_events (scene_id, at DESC);

-- Valores do dono ainda não definidos ("X quantidade de tempo"): PROVISÓRIOS, editáveis pelo Owner.
INSERT INTO devo_config (key, value, provisional, note) VALUES
  ('narrativa.galo_casa.tempo_min', '60'::jsonb, true, 'PROVISÓRIO: minutos que o Galo transfere na opção "Galo…?" (texto do dono: "X quantidade de tempo").'),
  ('narrativa.melissa_corporacoes.multa_min', '-90'::jsonb, false, 'Minutos retirados do Shuffler na opção da Necro-Corporação (dono, 17/10: 1h30). Negativo = tira.'),
  ('narrativa.galo_casa.explorar_min', '2'::jsonb, true, 'PROVISÓRIO: quantos sistemas novos o jogador abre antes da visita do Galo ficar disponível.')
ON CONFLICT (key) DO NOTHING;

-- Dono (17/10, DIALOGOS-casa-galo-poco-melissa-dono.txt): a multa da Necro-Corporação é 1h30. Bancos que ainda
-- têm o valor provisório antigo (-30) passam para -90; um valor já editado pelo Owner fica como está.
UPDATE devo_config
   SET value = '-90'::jsonb, provisional = false,
       note = 'Minutos retirados do Shuffler na opção da Necro-Corporação (dono, 17/10: 1h30). Negativo = tira.'
 WHERE key = 'narrativa.melissa_corporacoes.multa_min' AND value = '-30'::jsonb AND provisional;
