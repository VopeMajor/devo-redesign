-- Torres de Ruptura (DIRECAO-3 §2). Idempotente: pode rodar quantas vezes quiser.
-- Depende de scripts/fundacao-migration.sql (players, item_defs, devo_item_grant/consume, devo_config).
-- Contrato e guia de conteúdo: docs/redesign/TORRES.md.

-- Andares concluídos por jogador. O andar n só entra depois do n−1 (garantido no servidor, com trava por
-- jogador+torre). O custo pago e a essência ficam registrados para auditoria (o livro-razão do inventário
-- também guarda, com idem 'torre:<torre>:andar:<n>:<jogador>:pago').
CREATE TABLE IF NOT EXISTS tower_progress (
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  tower_id text NOT NULL,
  floor integer NOT NULL,
  cost integer NOT NULL DEFAULT 0,
  essence text,
  keys_spent integer NOT NULL DEFAULT 0,
  cleared_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, tower_id, floor),
  CONSTRAINT tower_progress_floor_chk CHECK (floor BETWEEN 1 AND 20),
  CONSTRAINT tower_progress_tower_chk CHECK (tower_id ~ '^[a-z0-9][a-z0-9-]{1,40}$')
);

-- Estado narrativo das Torres por jogador: apresentação do Galo (uma vez), oferta de fã (uma vez) e a
-- reflexão "Anfitrião de quê?" ao sair da aba pela primeira vez.
CREATE TABLE IF NOT EXISTS tower_player (
  player_id uuid PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  galo_intro_at timestamptz,
  galo_fan boolean,
  galo_fan_at timestamptz,
  reflexao_at timestamptz,
  reflexao_escolha integer,
  CONSTRAINT tower_player_reflexao_chk CHECK (reflexao_escolha IS NULL OR reflexao_escolha BETWEEN 1 AND 5)
);

-- Catálogo das torres de exemplo (PROVISÓRIO). Torres novas no conteúdo ganham os itens sozinhas (o servidor
-- cria a essência e a chave que faltarem, sem sobrescrever o que o Owner já editou no catálogo).
INSERT INTO item_defs (key, kind, name, description, rarity, stackable, meta) VALUES
  ('essencia:coruja', 'essencia', 'Essência de Afinidade da Coruja', 'Abre andares da Torre do Observatório. (provisório)', 'incomum', true, '{"npc": "coruja", "torre": "observatorio", "provisorio": true}'),
  ('essencia:javali', 'essencia', 'Essência de Afinidade do Javali', 'Abre andares da Torre do Picadeiro. (provisório)', 'incomum', true, '{"npc": "javali", "torre": "picadeiro", "provisorio": true}'),
  ('chave:observatorio', 'chave', 'Chave do Observatório', 'Entregue a cada andar vencido da Torre do Observatório. Abre andares da Torre do Imperador.', 'incomum', true, '{"torre": "observatorio"}'),
  ('essencia:campanha', 'essencia', 'Essência da Ruptura (provisória)', 'Abre andares da torre principal. Nome e origem a definir pelo dono. (provisório)', 'incomum', true, '{"torre": "campanha", "provisorio": true}'),
  ('chave:imperador', 'chave', 'Chave do Imperador', 'Entregue a cada andar vencido da Torre do Imperador (do Galo). Abre andares da torre principal.', 'incomum', true, '{"torre": "imperador"}'),
  ('chave:picadeiro', 'chave', 'Chave do Picadeiro', 'Entregue a cada andar vencido da Torre do Picadeiro. Abre andares da Torre do Imperador.', 'incomum', true, '{"torre": "picadeiro"}')
ON CONFLICT (key) DO NOTHING;

-- A Essência do Galo já vem da Fundação; marca a torre dela (sem apagar o que houver em meta).
UPDATE item_defs SET meta = meta || '{"torre": "imperador"}'::jsonb WHERE key = 'essencia:galo' AND NOT (meta ? 'torre');
