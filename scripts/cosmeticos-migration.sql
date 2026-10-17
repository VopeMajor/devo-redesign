-- Cosméticos (texto do dono "Sistema de Cosméticos" §1–§14; DIRECAO-3 §5). Idempotente.
-- Depende da Fundação (item_defs, player_items, item_ledger, devo_config, admin_log, staff_authorizations).
-- Contrato: docs/redesign/FUNDACAO.md §14.

-- ---------------------------------------------------------------------------------------------
-- 1. Temporários (futuro): posse com validade. NULL = permanente (padrão de hoje).
-- ---------------------------------------------------------------------------------------------
ALTER TABLE player_items ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- ---------------------------------------------------------------------------------------------
-- 2. Equipados por jogador: 1 moldura de avatar, 1 de miniperfil, 1 emblema principal, 1 balão, 1 efeito.
--    A posse é conferida no servidor (lib/devo/cosmeticos-server.ts); o Owner equipa qualquer item.
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS player_cosmetics (
  player_id uuid PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  moldura_avatar text REFERENCES item_defs(key) ON UPDATE CASCADE ON DELETE SET NULL,
  moldura_mini text REFERENCES item_defs(key) ON UPDATE CASCADE ON DELETE SET NULL,
  emblema text REFERENCES item_defs(key) ON UPDATE CASCADE ON DELETE SET NULL,
  balao text REFERENCES item_defs(key) ON UPDATE CASCADE ON DELETE SET NULL,
  efeito text REFERENCES item_defs(key) ON UPDATE CASCADE ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------------------------
-- 3. Assets enviados pelo Owner (SVG/PNG/WebP, até 400 KB). Servidos por GET /api/cosmeticos?view=asset&id=…
--    com CSP fechada; nas telas entram como <img> (SVG em <img> não executa script).
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cosmetic_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mime text NOT NULL CHECK (mime IN ('image/svg+xml', 'image/png', 'image/webp')),
  data bytea NOT NULL,
  bytes integer NOT NULL CHECK (bytes > 0 AND bytes <= 400000),
  created_by uuid REFERENCES players(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------------------------
-- 4. Recompensas semanais dos jogos (§8): plano por semana → na distribuição vira propostas 'semanal'
--    (reward_proposals) para cada vencedor, no fluxo de aprovação da Fundação.
--    Owner cria e aprova; Anfitrião propõe (aprova/distribui só com autorização 'recompensa.semanal');
--    Dealer só sugere. Mudança relevante numa aprovada volta para 'proposta' (gatilho abaixo).
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS weekly_reward_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL,
  game text NOT NULL DEFAULT 'geral',
  criterion text NOT NULL,
  resource text NOT NULL,
  resource_key text,
  quantity integer NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'proposta',
  proposed_by uuid REFERENCES players(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES players(id) ON DELETE SET NULL,
  approved_at timestamptz,
  distributed_by uuid REFERENCES players(id) ON DELETE SET NULL,
  distributed_at timestamptz,
  distributed_count integer NOT NULL DEFAULT 0,
  revision integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT weekly_plans_criterion_chk CHECK (criterion IN ('top1', 'top3', 'top10', 'participacao')),
  CONSTRAINT weekly_plans_resource_chk CHECK (resource IN ('item', 'tempo', 'carta', 'convite')),
  CONSTRAINT weekly_plans_qty_chk CHECK (quantity > 0 AND quantity <= 1000000),
  CONSTRAINT weekly_plans_status_chk CHECK (status IN ('sugerida', 'proposta', 'aprovada', 'rejeitada', 'distribuida', 'cancelada'))
);
CREATE INDEX IF NOT EXISTS weekly_reward_plans_week_idx ON weekly_reward_plans (week_start DESC);

CREATE TABLE IF NOT EXISTS weekly_reward_log (
  id bigserial PRIMARY KEY,
  plan_id uuid NOT NULL REFERENCES weekly_reward_plans(id) ON DELETE CASCADE,
  at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid REFERENCES players(id) ON DELETE SET NULL,
  action text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE OR REPLACE FUNCTION devo_weekly_plan_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IN ('distribuida', 'cancelada') THEN
    RAISE EXCEPTION 'PLANO_FECHADO';
  END IF;
  IF (NEW.week_start, NEW.game, NEW.criterion, NEW.resource, coalesce(NEW.resource_key, ''), NEW.quantity)
     IS DISTINCT FROM (OLD.week_start, OLD.game, OLD.criterion, OLD.resource, coalesce(OLD.resource_key, ''), OLD.quantity) THEN
    IF OLD.status IN ('aprovada', 'rejeitada') AND NEW.status = OLD.status THEN
      NEW.status := 'proposta';
      NEW.approved_by := NULL;
      NEW.approved_at := NULL;
    END IF;
    NEW.revision := OLD.revision + 1;
  END IF;
  IF NEW.status = 'distribuida' AND OLD.status <> 'aprovada' THEN
    RAISE EXCEPTION 'PLANO_SEM_APROVACAO';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS weekly_plan_guard ON weekly_reward_plans;
CREATE TRIGGER weekly_plan_guard BEFORE UPDATE ON weekly_reward_plans FOR EACH ROW EXECUTE FUNCTION devo_weekly_plan_guard();

-- ---------------------------------------------------------------------------------------------
-- 5. Raridades configuráveis (rótulo, cor e brilho por raridade). PROVISÓRIO até o dono definir.
-- ---------------------------------------------------------------------------------------------
INSERT INTO devo_config (key, value, provisional, note) VALUES
  ('cosmeticos.raridades',
   '{"comum":    {"label": "Comum",    "cor": "#8f8e8b", "brilho": "rgba(143,142,139,0)"},
     "incomum":  {"label": "Incomum",  "cor": "#b7b3a8", "brilho": "rgba(183,179,168,.25)"},
     "raro":     {"label": "Raro",     "cor": "#d9d8d4", "brilho": "rgba(217,216,212,.35)"},
     "epico":    {"label": "Épico",    "cor": "#c98a95", "brilho": "rgba(163,46,64,.35)"},
     "lendario": {"label": "Lendário", "cor": "#e3d3ae", "brilho": "rgba(214,190,140,.4)"},
     "arcano":   {"label": "Arcano",   "cor": "#c2b9ec", "brilho": "rgba(138,124,200,.5)"}}'::jsonb,
   true, 'Rótulo, cor e brilho de cada raridade dos cosméticos (provisório).')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------------------------
-- 6. Coleção inicial (§3). meta.asset 'devo:<grupo>/<id>' = arte desenhada no código
--    (components/devo/cosmeticos/art). ON CONFLICT DO NOTHING: edições do Owner nunca são sobrescritas.
--    meta.poco = true → pode sair no Poço (peso por raridade em devo_config['poco.raridade_pesos']).
-- ---------------------------------------------------------------------------------------------
INSERT INTO item_defs (key, kind, name, description, rarity, stackable, meta) VALUES
  -- Molduras de avatar
  ('cosmetico:moldura-heranca-marfim', 'cosmetico', 'Herança de Marfim', 'Filigrana de prata, pérolas e um camafeu de família. Passa de mão em mão sem perder o brilho.', 'raro', false,
   '{"categoria": "moldura_avatar", "asset": "devo:moldura/heranca-marfim", "animado": false, "poco": true, "origem": "poco", "par": "cosmetico:mini-heranca-marfim", "ordem": 10}'),
  ('cosmetico:moldura-relogio-fim', 'cosmetico', 'Relógio do Fim', 'Mostrador em arco, engrenagens à mostra e um pêndulo curto. Marca o tempo que ainda resta.', 'epico', false,
   '{"categoria": "moldura_avatar", "asset": "devo:moldura/relogio-fim", "animado": true, "poco": false, "origem": "semanal", "par": "cosmetico:mini-relogio-fim", "ordem": 20}'),
  ('cosmetico:moldura-pacto-carmesim', 'cosmetico', 'Pacto Carmesim', 'Ferro enegrecido preso por ramos de espinhos e rosas cor de vinho. Um acordo que não se desfaz.', 'epico', false,
   '{"categoria": "moldura_avatar", "asset": "devo:moldura/pacto-carmesim", "animado": false, "poco": true, "origem": "poco", "par": "cosmetico:mini-pacto-carmesim", "ordem": 30}'),
  ('cosmetico:moldura-olho-arcano', 'cosmetico', 'Olho do Arcano', 'Arco de aço com um olho atento no alto, glifos em volta e cristais de ametista.', 'lendario', false,
   '{"categoria": "moldura_avatar", "asset": "devo:moldura/olho-arcano", "animado": true, "poco": true, "origem": "poco", "par": "cosmetico:mini-olho-arcano", "ordem": 40}'),
  ('cosmetico:moldura-banquete-javali', 'cosmetico', 'Banquete do Javali', 'Ouro envelhecido, presas no alto e a mesa posta: cartas e fichas da casa do Javali.', 'lendario', false,
   '{"categoria": "moldura_avatar", "asset": "devo:moldura/banquete-javali", "animado": false, "poco": false, "origem": "semanal", "par": "cosmetico:mini-banquete-javali", "ordem": 50}'),
  ('cosmetico:moldura-asas-coruja', 'cosmetico', 'Asas da Coruja', 'Penas de prata abertas sob uma lua crescente. Quem vigia à noite também é vigiado.', 'raro', false,
   '{"categoria": "moldura_avatar", "asset": "devo:moldura/asas-coruja", "animado": false, "poco": true, "origem": "poco", "par": "cosmetico:mini-asas-coruja", "ordem": 60}'),
  ('cosmetico:moldura-fortuna-rato', 'cosmetico', 'Fortuna do Rato', 'Moedas antigas, uma corrente fina e um dado que sempre cai do lado certo.', 'incomum', false,
   '{"categoria": "moldura_avatar", "asset": "devo:moldura/fortuna-rato", "animado": false, "poco": true, "origem": "poco", "par": "cosmetico:mini-fortuna-rato", "ordem": 70}'),
  ('cosmetico:moldura-ultima-badalada', 'cosmetico', 'Última Badalada', 'Um relógio que não pertence a este mundo. O pêndulo não para e o sino toca uma última vez.', 'arcano', false,
   '{"categoria": "moldura_avatar", "asset": "devo:moldura/ultima-badalada", "animado": true, "poco": false, "origem": "deadly_vote", "par": "cosmetico:mini-ultima-badalada", "ordem": 80}'),
  -- Molduras de miniperfil (mesma identidade, formato quadrado)
  ('cosmetico:mini-heranca-marfim', 'cosmetico', 'Herança de Marfim', 'Versão do miniperfil: marfim, pérolas e o camafeu no alto.', 'raro', false,
   '{"categoria": "moldura_mini", "asset": "devo:moldura/heranca-marfim", "animado": false, "poco": true, "origem": "poco", "par": "cosmetico:moldura-heranca-marfim", "ordem": 10}'),
  ('cosmetico:mini-relogio-fim', 'cosmetico', 'Relógio do Fim', 'Versão do miniperfil: meio mostrador e engrenagens nos cantos.', 'epico', false,
   '{"categoria": "moldura_mini", "asset": "devo:moldura/relogio-fim", "animado": true, "poco": false, "origem": "semanal", "par": "cosmetico:moldura-relogio-fim", "ordem": 20}'),
  ('cosmetico:mini-pacto-carmesim', 'cosmetico', 'Pacto Carmesim', 'Versão do miniperfil: duas rosas fechando os cantos.', 'epico', false,
   '{"categoria": "moldura_mini", "asset": "devo:moldura/pacto-carmesim", "animado": false, "poco": true, "origem": "poco", "par": "cosmetico:moldura-pacto-carmesim", "ordem": 30}'),
  ('cosmetico:mini-olho-arcano', 'cosmetico', 'Olho do Arcano', 'Versão do miniperfil: o olho no alto e cristais nos lados.', 'lendario', false,
   '{"categoria": "moldura_mini", "asset": "devo:moldura/olho-arcano", "animado": true, "poco": true, "origem": "poco", "par": "cosmetico:moldura-olho-arcano", "ordem": 40}'),
  ('cosmetico:mini-banquete-javali', 'cosmetico', 'Banquete do Javali', 'Versão do miniperfil: presas, uma carta e duas fichas.', 'lendario', false,
   '{"categoria": "moldura_mini", "asset": "devo:moldura/banquete-javali", "animado": false, "poco": false, "origem": "semanal", "par": "cosmetico:moldura-banquete-javali", "ordem": 50}'),
  ('cosmetico:mini-asas-coruja', 'cosmetico', 'Asas da Coruja', 'Versão do miniperfil: asas pequenas e a lua.', 'raro', false,
   '{"categoria": "moldura_mini", "asset": "devo:moldura/asas-coruja", "animado": false, "poco": true, "origem": "poco", "par": "cosmetico:moldura-asas-coruja", "ordem": 60}'),
  ('cosmetico:mini-fortuna-rato', 'cosmetico', 'Fortuna do Rato', 'Versão do miniperfil: corrente, moedas e o dado.', 'incomum', false,
   '{"categoria": "moldura_mini", "asset": "devo:moldura/fortuna-rato", "animado": false, "poco": true, "origem": "poco", "par": "cosmetico:moldura-fortuna-rato", "ordem": 70}'),
  ('cosmetico:mini-ultima-badalada', 'cosmetico', 'Última Badalada', 'Versão do miniperfil: o mostrador inteiro em volta do rosto.', 'arcano', false,
   '{"categoria": "moldura_mini", "asset": "devo:moldura/ultima-badalada", "animado": true, "poco": false, "origem": "deadly_vote", "par": "cosmetico:moldura-ultima-badalada", "ordem": 80}'),
  -- Emblemas
  ('cosmetico:emblema-rosa-sangue', 'cosmetico', 'Rosa de Sangue', 'Uma rosa que ainda pinga. Ninguém pergunta de quem.', 'raro', false,
   '{"categoria": "emblema", "asset": "devo:emblema/rosa-sangue", "animado": false, "poco": true, "origem": "poco", "ordem": 10}'),
  ('cosmetico:emblema-coroa-partida', 'cosmetico', 'Coroa Partida', 'As duas metades de uma coroa que não voltou a se fechar.', 'epico', false,
   '{"categoria": "emblema", "asset": "devo:emblema/coroa-partida", "animado": false, "poco": true, "origem": "poco", "ordem": 20}'),
  ('cosmetico:emblema-ampulheta-dourada', 'cosmetico', 'Ampulheta Dourada', 'A areia corre devagar para quem tem tempo de sobra.', 'incomum', false,
   '{"categoria": "emblema", "asset": "devo:emblema/ampulheta-dourada", "animado": false, "poco": true, "origem": "poco", "ordem": 30}'),
  ('cosmetico:emblema-olho-destino', 'cosmetico', 'Olho do Destino', 'Vê o que vem antes de chegar. Às vezes pisca.', 'lendario', false,
   '{"categoria": "emblema", "asset": "devo:emblema/olho-destino", "animado": true, "poco": true, "origem": "poco", "ordem": 40}'),
  ('cosmetico:emblema-chave-proibida', 'cosmetico', 'Chave Proibida', 'Abre uma porta que ninguém deveria abrir.', 'raro', false,
   '{"categoria": "emblema", "asset": "devo:emblema/chave-proibida", "animado": false, "poco": true, "origem": "poco", "ordem": 50}'),
  ('cosmetico:emblema-as-espadas', 'cosmetico', 'Ás de Espadas', 'A carta mais alta da mesa, ou a última.', 'comum', false,
   '{"categoria": "emblema", "asset": "devo:emblema/as-espadas", "animado": false, "poco": true, "origem": "poco", "ordem": 60}'),
  ('cosmetico:emblema-lua-escarlate', 'cosmetico', 'Lua Escarlate', 'Nasce vermelha nas noites em que alguém não volta.', 'epico', false,
   '{"categoria": "emblema", "asset": "devo:emblema/lua-escarlate", "animado": true, "poco": true, "origem": "poco", "ordem": 70}'),
  ('cosmetico:emblema-fragmento-celestial', 'cosmetico', 'Fragmento Celestial', 'Lasca de uma estrela que caiu durante um Deadly Vote.', 'arcano', false,
   '{"categoria": "emblema", "asset": "devo:emblema/fragmento-celestial", "animado": true, "poco": false, "origem": "deadly_vote", "ordem": 80}'),
  ('cosmetico:emblema-engrenagem-herdeiro', 'cosmetico', 'Engrenagem do Herdeiro', 'Peça de um mecanismo que só o Herdeiro sabe montar.', 'epico', false,
   '{"categoria": "emblema", "asset": "devo:emblema/engrenagem-herdeiro", "animado": true, "poco": false, "origem": "semanal", "ordem": 90}'),
  ('cosmetico:emblema-pena-coruja', 'cosmetico', 'Pena de Prata', 'Caiu da asa da Coruja numa noite de lua fina.', 'incomum', false,
   '{"categoria": "emblema", "asset": "devo:emblema/pena-coruja", "animado": false, "poco": true, "origem": "poco", "ordem": 100}'),
  ('cosmetico:emblema-ficha-javali', 'cosmetico', 'Ficha do Javali', 'Ficha da casa. Vale o que o Javali disser que vale.', 'comum', false,
   '{"categoria": "emblema", "asset": "devo:emblema/ficha-javali", "animado": false, "poco": false, "origem": "semanal", "ordem": 110}'),
  ('cosmetico:emblema-selo-anfitriao', 'cosmetico', 'Selo do Anfitrião', 'Insígnia dos Anfitriões do DEVO. Aparece sozinha ao lado do nome de quem recebe os convidados.', 'lendario', false,
   '{"categoria": "emblema", "asset": "devo:emblema/selo-anfitriao", "animado": false, "poco": false, "origem": "anfitriao", "automatico": true, "ordem": 999}'),
  -- Balões de chat
  ('cosmetico:balao-correspondencia-real', 'cosmetico', 'Correspondência Real', 'Papel de carta com filigrana de ouro e lacre de cera.', 'raro', false,
   '{"categoria": "balao", "asset": "devo:balao/correspondencia-real", "animado": false, "poco": true, "origem": "poco", "ordem": 10}'),
  ('cosmetico:balao-confissao-carmesim', 'cosmetico', 'Confissão Carmesim', 'Vinho escuro, rosas nos cantos. Para o que se diz baixo.', 'epico', false,
   '{"categoria": "balao", "asset": "devo:balao/confissao-carmesim", "animado": false, "poco": true, "origem": "poco", "ordem": 20}'),
  ('cosmetico:balao-ecos-arcano', 'cosmetico', 'Ecos do Arcano', 'Fundo de noite com glifos que acendem devagar.', 'lendario', false,
   '{"categoria": "balao", "asset": "devo:balao/ecos-arcano", "animado": true, "poco": true, "origem": "poco", "ordem": 30}'),
  ('cosmetico:balao-ultimo-suspiro', 'cosmetico', 'Último Suspiro', 'Tons frios e um pequeno relógio que não para.', 'raro', false,
   '{"categoria": "balao", "asset": "devo:balao/ultimo-suspiro", "animado": true, "poco": true, "origem": "poco", "ordem": 40}'),
  ('cosmetico:balao-mesa-destino', 'cosmetico', 'Mesa do Destino', 'Feltro da mesa, uma carta e uma ficha. A aposta está feita.', 'incomum', false,
   '{"categoria": "balao", "asset": "devo:balao/mesa-destino", "animado": false, "poco": false, "origem": "semanal", "ordem": 50}'),
  -- Efeitos do nome (efeitos especiais)
  ('cosmetico:efeito-assinatura-noturna', 'cosmetico', 'Assinatura Noturna', 'O nome escrito em itálico de aço, com um brilho de ametista.', 'arcano', false,
   '{"categoria": "efeito", "asset": "devo:efeito/assinatura-noturna", "animado": false, "poco": false, "origem": "evento", "ordem": 10}'),
  ('cosmetico:efeito-brasa-carmesim', 'cosmetico', 'Brasa Carmesim', 'O nome em letra de estandarte, cor de brasa.', 'epico', false,
   '{"categoria": "efeito", "asset": "devo:efeito/brasa-carmesim", "animado": false, "poco": false, "origem": "deadly_vote", "ordem": 20}'),
  ('cosmetico:efeito-geada-prata', 'cosmetico', 'Geada de Prata', 'O nome em prata fria, com um reflexo que passa de vez em quando.', 'raro', false,
   '{"categoria": "efeito", "asset": "devo:efeito/geada-prata", "animado": true, "poco": false, "origem": "semanal", "ordem": 30}')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------------------------
-- 7. Nova direção artística (COSMETICOS-REFORMULACAO-dono.md §12): arte gerada por IA no pipeline infra/arte
--    (docs/redesign/ARTE-PIPELINE.md), WebP em public/images/cosmeticos/<id>/. Fora do Poço por enquanto.
-- ---------------------------------------------------------------------------------------------
INSERT INTO item_defs (key, kind, name, description, rarity, stackable, meta) VALUES
  ('cosmetico:moldura-asas-crepusculo', 'cosmetico', 'Asas do Crepúsculo', 'Penas negras e prateadas abertas em volta do rosto, cristais carmesins e correntes finas que balançam.', 'lendario', false,
   '{"categoria": "moldura_avatar", "asset": "img:/images/cosmeticos/asas-do-crepusculo/moldura", "imagem": {"base": "/images/cosmeticos/asas-do-crepusculo/moldura", "tamanhos": [48, 96, 256, 512, 1024], "janela": {"forma": "circulo", "centro": [0.5, 0.5], "raio": [0.25, 0.25]}}, "animado": false, "poco": false, "origem": "evento", "par": "cosmetico:mini-asas-crepusculo", "ordem": 5}'),
  ('cosmetico:mini-asas-crepusculo', 'cosmetico', 'Asas do Crepúsculo', 'Versão do miniperfil: a asa negra, a prateada e o coração carmesim.', 'lendario', false,
   '{"categoria": "moldura_mini", "asset": "img:/images/cosmeticos/asas-do-crepusculo/moldura", "imagem": {"base": "/images/cosmeticos/asas-do-crepusculo/moldura", "tamanhos": [48, 96, 256, 512, 1024], "janela": {"forma": "circulo", "centro": [0.5, 0.5], "raio": [0.25, 0.25]}}, "animado": false, "poco": false, "origem": "evento", "par": "cosmetico:moldura-asas-crepusculo", "ordem": 5}'),
  ('cosmetico:emblema-coracao-condessa', 'cosmetico', 'Coração da Condessa', 'Coração de cristal vermelho num broche de ouro, preso a um laço de seda escura.', 'lendario', false,
   '{"categoria": "emblema", "asset": "img:/images/cosmeticos/coracao-da-condessa/emblema", "imagem": {"base": "/images/cosmeticos/coracao-da-condessa/emblema", "tamanhos": [48, 96, 256, 512, 1024], "camadas": [{"src": "/images/cosmeticos/coracao-da-condessa/gema-256.webp", "anim": "brilho", "caixa": [0.3525, 0.3594, 0.2998, 0.2812], "dur": 5.5}]}, "animado": true, "poco": false, "origem": "evento", "ordem": 5}')
ON CONFLICT (key) DO NOTHING;

-- Arte por IA (pipeline infra/arte, escolhas do dono: Asas v02, Coração v02): troca a prévia desenhada pela imagem.
-- Idempotente e só sobre o valor antigo — não desfaz edição do Owner no painel.
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/asas-do-crepusculo/moldura", "imagem": {"base": "/images/cosmeticos/asas-do-crepusculo/moldura", "tamanhos": [48, 96, 256, 512, 1024], "janela": {"forma": "circulo", "centro": [0.5, 0.5], "raio": [0.25, 0.25]}}}'::jsonb
 WHERE key IN ('cosmetico:moldura-asas-crepusculo', 'cosmetico:mini-asas-crepusculo') AND meta->>'asset' = 'devo:moldura/asas-crepusculo';
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/coracao-da-condessa/emblema", "imagem": {"base": "/images/cosmeticos/coracao-da-condessa/emblema", "tamanhos": [48, 96, 256, 512, 1024], "camadas": [{"src": "/images/cosmeticos/coracao-da-condessa/gema-256.webp", "anim": "brilho", "caixa": [0.3525, 0.3594, 0.2998, 0.2812], "dur": 5.5}]}, "animado": true}'::jsonb
 WHERE key = 'cosmetico:emblema-coracao-condessa' AND meta->>'asset' = 'devo:emblema/coracao-condessa';

-- ---------------------------------------------------------------------------------------------
-- 8. Arte por IA, lotes 2 e 3 (infra/arte da41f23): molduras e minis quadradas definitivas, balões 9-slice,
--    emblemas e camadas animadas; itens novos (Catedral Esquecida, Relicário de Marfim, Fortuna Profana). Os UPDATEs só trocam o asset desenhado antigo (ou a mini provisória do lote 1) — edição
--    do Owner no painel fica como está.
-- ---------------------------------------------------------------------------------------------
INSERT INTO item_defs (key, kind, name, description, rarity, stackable, meta) VALUES
  ('cosmetico:moldura-catedral-esquecida', 'cosmetico', 'Catedral Esquecida', 'Arcos góticos de pedra escura, vitrais apagados e uma rosácea sobre a cabeça. Ninguém reza mais ali.', 'epico', false,
   '{"categoria": "moldura_avatar", "asset": "img:/images/cosmeticos/catedral-esquecida/moldura", "imagem": {"base": "/images/cosmeticos/catedral-esquecida/moldura", "tamanhos": [48, 96, 256, 512, 1024], "janela": {"forma": "circulo", "centro": [0.5, 0.5], "raio": [0.25, 0.25]}, "camadas": [{"src": "/images/cosmeticos/catedral-esquecida/moldura-vitral-azul.webp", "anim": "brilho", "caixa": [0.2217, 0.1963, 0.3936, 0.6006], "dur": 5.5}]}, "animado": true, "poco": true, "origem": "poco", "par": "cosmetico:mini-catedral-esquecida", "ordem": 85}'),
  ('cosmetico:mini-catedral-esquecida', 'cosmetico', 'Catedral Esquecida', 'Versão do miniperfil: a rosácea e os arcos de pedra.', 'epico', false,
   '{"categoria": "moldura_mini", "asset": "img:/images/cosmeticos/catedral-esquecida/mini", "imagem": {"base": "/images/cosmeticos/catedral-esquecida/mini", "tamanhos": [48, 96, 256, 512, 1024], "janela": {"forma": "quadrado", "centro": [0.5, 0.5], "raio": [0.2735, 0.2735], "raio_canto": 0.04}}, "animado": false, "poco": true, "origem": "poco", "par": "cosmetico:moldura-catedral-esquecida", "ordem": 85}'),
  ('cosmetico:moldura-relicario-marfim', 'cosmetico', 'Relicário de Marfim', 'Um relicário de marfim e ouro velho, fechado com cuidado em volta do retrato.', 'raro', false,
   '{"categoria": "moldura_avatar", "asset": "img:/images/cosmeticos/relicario-marfim/moldura", "imagem": {"base": "/images/cosmeticos/relicario-marfim/moldura", "tamanhos": [48, 96, 256, 512, 1024], "janela": {"forma": "circulo", "centro": [0.5, 0.5], "raio": [0.25, 0.25]}}, "animado": false, "poco": true, "origem": "poco", "par": "cosmetico:mini-relicario-marfim", "ordem": 15}'),
  ('cosmetico:mini-relicario-marfim', 'cosmetico', 'Relicário de Marfim', 'Versão do miniperfil: marfim e ouro velho.', 'raro', false,
   '{"categoria": "moldura_mini", "asset": "img:/images/cosmeticos/relicario-marfim/mini", "imagem": {"base": "/images/cosmeticos/relicario-marfim/mini", "tamanhos": [48, 96, 256, 512, 1024], "janela": {"forma": "quadrado", "centro": [0.5, 0.5], "raio": [0.2735, 0.2735], "raio_canto": 0.04}}, "animado": false, "poco": true, "origem": "poco", "par": "cosmetico:moldura-relicario-marfim", "ordem": 15}'),
  ('cosmetico:emblema-fortuna-profana', 'cosmetico', 'Fortuna Profana', 'Cartas, dados e fichas presos a um rubi por uma corrente de ouro. A casa sempre cobra.', 'epico', false,
   '{"categoria": "emblema", "asset": "img:/images/cosmeticos/fortuna-profana/emblema", "imagem": {"base": "/images/cosmeticos/fortuna-profana/emblema", "tamanhos": [48, 96, 256, 512, 1024]}, "animado": false, "poco": true, "origem": "poco", "ordem": 45}')
ON CONFLICT (key) DO NOTHING;

UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/heranca-marfim/moldura", "imagem": {"base": "/images/cosmeticos/heranca-marfim/moldura", "tamanhos": [48, 96, 256, 512, 1024], "janela": {"forma": "circulo", "centro": [0.5, 0.5], "raio": [0.25, 0.25]}}, "animado": false}'::jsonb
 WHERE key = 'cosmetico:moldura-heranca-marfim' AND meta->>'asset' = 'devo:moldura/heranca-marfim';
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/heranca-marfim/mini", "imagem": {"base": "/images/cosmeticos/heranca-marfim/mini", "tamanhos": [48, 96, 256, 512, 1024], "janela": {"forma": "quadrado", "centro": [0.5, 0.5], "raio": [0.2735, 0.2735], "raio_canto": 0.04}}, "animado": false}'::jsonb
 WHERE key = 'cosmetico:mini-heranca-marfim' AND meta->>'asset' = 'devo:moldura/heranca-marfim';
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/relogio-fim/moldura", "imagem": {"base": "/images/cosmeticos/relogio-fim/moldura", "tamanhos": [48, 96, 256, 512, 1024], "janela": {"forma": "circulo", "centro": [0.5, 0.5], "raio": [0.25, 0.25]}, "camadas": [{"src": "/images/cosmeticos/relogio-fim/moldura-brilho-arcano.webp", "anim": "pulso", "caixa": [0.0898, 0.2715, 0.8271, 0.4209], "dur": 3.2}, {"src": "/images/cosmeticos/relogio-fim/moldura-ponteiros-bronze.webp", "anim": "ponteiro", "caixa": [0.468, 0.0837, 0.064, 0.064], "dur": 60, "origem": [0.5, 0.86]}, {"src": "/images/cosmeticos/relogio-fim/moldura-engrenagem-bronze.webp", "anim": "giro", "caixa": [0.035, 0.4209, 0.193, 0.193], "dur": 24}, {"src": "/images/cosmeticos/relogio-fim/moldura-engrenagem-bronze.webp", "anim": "giro-rev", "caixa": [0.763, 0.4209, 0.193, 0.193], "dur": 30}]}, "animado": true}'::jsonb
 WHERE key = 'cosmetico:moldura-relogio-fim' AND meta->>'asset' = 'devo:moldura/relogio-fim';
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/relogio-fim/mini", "imagem": {"base": "/images/cosmeticos/relogio-fim/mini", "tamanhos": [48, 96, 256, 512, 1024], "janela": {"forma": "quadrado", "centro": [0.5, 0.5], "raio": [0.2735, 0.2735], "raio_canto": 0.04}, "camadas": [{"src": "/images/cosmeticos/relogio-fim/mini-brilho-arcano.webp", "anim": "pulso", "caixa": [0.2832, 0.1191, 0.4375, 0.04], "dur": 3.2}]}, "animado": true}'::jsonb
 WHERE key = 'cosmetico:mini-relogio-fim' AND meta->>'asset' = 'devo:moldura/relogio-fim';
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/pacto-carmesim/moldura", "imagem": {"base": "/images/cosmeticos/pacto-carmesim/moldura", "tamanhos": [48, 96, 256, 512, 1024], "janela": {"forma": "circulo", "centro": [0.5, 0.5], "raio": [0.25, 0.25]}}, "animado": false}'::jsonb
 WHERE key = 'cosmetico:moldura-pacto-carmesim' AND meta->>'asset' = 'devo:moldura/pacto-carmesim';
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/pacto-carmesim/mini", "imagem": {"base": "/images/cosmeticos/pacto-carmesim/mini", "tamanhos": [48, 96, 256, 512, 1024], "janela": {"forma": "quadrado", "centro": [0.5, 0.5], "raio": [0.2735, 0.2735], "raio_canto": 0.04}}, "animado": false}'::jsonb
 WHERE key = 'cosmetico:mini-pacto-carmesim' AND meta->>'asset' = 'devo:moldura/pacto-carmesim';
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/olho-arcano/moldura", "imagem": {"base": "/images/cosmeticos/olho-arcano/moldura", "tamanhos": [48, 96, 256, 512, 1024], "janela": {"forma": "circulo", "centro": [0.5, 0.5], "raio": [0.25, 0.25]}, "camadas": [{"src": "/images/cosmeticos/olho-arcano/moldura-brilho-arcano.webp", "anim": "brilho", "caixa": [0.0039, 0.1055, 0.9961, 0.8945], "dur": 5.5}]}, "animado": true}'::jsonb
 WHERE key = 'cosmetico:moldura-olho-arcano' AND meta->>'asset' = 'devo:moldura/olho-arcano';
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/olho-arcano/mini", "imagem": {"base": "/images/cosmeticos/olho-arcano/mini", "tamanhos": [48, 96, 256, 512, 1024], "janela": {"forma": "quadrado", "centro": [0.5, 0.5], "raio": [0.2735, 0.2735], "raio_canto": 0.04}, "camadas": [{"src": "/images/cosmeticos/olho-arcano/mini-brilho-arcano.webp", "anim": "brilho", "caixa": [0.0244, 0.0918, 0.9482, 0.9082], "dur": 5.5}]}, "animado": true}'::jsonb
 WHERE key = 'cosmetico:mini-olho-arcano' AND meta->>'asset' = 'devo:moldura/olho-arcano';
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/banquete-javali/moldura", "imagem": {"base": "/images/cosmeticos/banquete-javali/moldura", "tamanhos": [48, 96, 256, 512, 1024], "janela": {"forma": "circulo", "centro": [0.5, 0.5], "raio": [0.25, 0.25]}}, "animado": false}'::jsonb
 WHERE key = 'cosmetico:moldura-banquete-javali' AND meta->>'asset' = 'devo:moldura/banquete-javali';
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/banquete-javali/mini", "imagem": {"base": "/images/cosmeticos/banquete-javali/mini", "tamanhos": [48, 96, 256, 512, 1024], "janela": {"forma": "quadrado", "centro": [0.5, 0.5], "raio": [0.2735, 0.2735], "raio_canto": 0.04}}, "animado": false}'::jsonb
 WHERE key = 'cosmetico:mini-banquete-javali' AND meta->>'asset' = 'devo:moldura/banquete-javali';
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/asas-coruja/moldura", "imagem": {"base": "/images/cosmeticos/asas-coruja/moldura", "tamanhos": [48, 96, 256, 512, 1024], "janela": {"forma": "circulo", "centro": [0.5, 0.5], "raio": [0.25, 0.25]}, "camadas": [{"src": "/images/cosmeticos/asas-coruja/moldura-lua.webp", "anim": "brilho", "caixa": [0.4443, 0.125, 0.5107, 0.2148], "dur": 5.5}]}, "animado": true}'::jsonb
 WHERE key = 'cosmetico:moldura-asas-coruja' AND meta->>'asset' = 'devo:moldura/asas-coruja';
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/asas-coruja/mini", "imagem": {"base": "/images/cosmeticos/asas-coruja/mini", "tamanhos": [48, 96, 256, 512, 1024], "janela": {"forma": "quadrado", "centro": [0.5, 0.5], "raio": [0.2735, 0.2735], "raio_canto": 0.04}}, "animado": false}'::jsonb
 WHERE key = 'cosmetico:mini-asas-coruja' AND meta->>'asset' = 'devo:moldura/asas-coruja';
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/fortuna-rato/moldura", "imagem": {"base": "/images/cosmeticos/fortuna-rato/moldura", "tamanhos": [48, 96, 256, 512, 1024], "janela": {"forma": "circulo", "centro": [0.5, 0.5], "raio": [0.25, 0.25]}}, "animado": false}'::jsonb
 WHERE key = 'cosmetico:moldura-fortuna-rato' AND meta->>'asset' = 'devo:moldura/fortuna-rato';
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/fortuna-rato/mini", "imagem": {"base": "/images/cosmeticos/fortuna-rato/mini", "tamanhos": [48, 96, 256, 512, 1024], "janela": {"forma": "quadrado", "centro": [0.5, 0.5], "raio": [0.2735, 0.2735], "raio_canto": 0.04}}, "animado": false}'::jsonb
 WHERE key = 'cosmetico:mini-fortuna-rato' AND meta->>'asset' = 'devo:moldura/fortuna-rato';
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/ultima-badalada/moldura", "imagem": {"base": "/images/cosmeticos/ultima-badalada/moldura", "tamanhos": [48, 96, 256, 512, 1024], "janela": {"forma": "circulo", "centro": [0.5, 0.5], "raio": [0.25, 0.25]}, "camadas": [{"src": "/images/cosmeticos/ultima-badalada/moldura-brilho-arcano.webp", "anim": "pulso", "caixa": [0.1338, 0.0381, 0.7246, 0.8594], "dur": 3.2}, {"src": "/images/cosmeticos/ultima-badalada/moldura-sino-prata.webp", "anim": "oscila", "caixa": [0.408, 0.0645, 0.184, 0.184], "dur": 2.4, "origem": [0.5, 0.03]}]}, "animado": true}'::jsonb
 WHERE key = 'cosmetico:moldura-ultima-badalada' AND meta->>'asset' = 'devo:moldura/ultima-badalada';
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/ultima-badalada/mini", "imagem": {"base": "/images/cosmeticos/ultima-badalada/mini", "tamanhos": [48, 96, 256, 512, 1024], "janela": {"forma": "quadrado", "centro": [0.5, 0.5], "raio": [0.2735, 0.2735], "raio_canto": 0.04}, "camadas": [{"src": "/images/cosmeticos/ultima-badalada/mini-brilho-arcano.webp", "anim": "pulso", "caixa": [0.125, 0.1816, 0.75, 0.7061], "dur": 3.2}]}, "animado": true}'::jsonb
 WHERE key = 'cosmetico:mini-ultima-badalada' AND meta->>'asset' = 'devo:moldura/ultima-badalada';
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/correspondencia-real/balao", "imagem": {"base": "/images/cosmeticos/correspondencia-real/balao", "tamanhos": [256, 512, 768, 1024], "slice": {"corte": [15, 46, 14, 61], "borda": [8, 25, 8, 34], "folga": [4, 8, 4, 20], "texto": "#2a2320", "lado": 512}}, "animado": false}'::jsonb
 WHERE key = 'cosmetico:balao-correspondencia-real' AND meta->>'asset' = 'devo:balao/correspondencia-real';
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/confissao-carmesim/balao", "imagem": {"base": "/images/cosmeticos/confissao-carmesim/balao", "tamanhos": [256, 512, 768, 1024], "slice": {"corte": [36, 76, 23, 72], "borda": [20, 42, 13, 40], "folga": [6, 10, 4, 10], "texto": "#f1e7e9", "lado": 512}}, "animado": false}'::jsonb
 WHERE key = 'cosmetico:balao-confissao-carmesim' AND meta->>'asset' = 'devo:balao/confissao-carmesim';
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/ecos-arcano/balao", "imagem": {"base": "/images/cosmeticos/ecos-arcano/balao", "tamanhos": [256, 512, 768, 1024], "camadas": [{"src": "/images/cosmeticos/ecos-arcano/balao-glifos.webp", "anim": "brilho", "caixa": [0.0098, 0.1601, 0.9818, 0.6667], "dur": 5.5}], "slice": {"corte": [12, 70, 12, 75], "borda": [8, 38, 8, 41], "folga": [4, 9, 4, 10], "texto": "#f1e7e9", "lado": 512}}, "animado": true}'::jsonb
 WHERE key = 'cosmetico:balao-ecos-arcano' AND meta->>'asset' = 'devo:balao/ecos-arcano';
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/ultimo-suspiro/balao", "imagem": {"base": "/images/cosmeticos/ultimo-suspiro/balao", "tamanhos": [256, 512, 768, 1024], "slice": {"corte": [23, 70, 23, 57], "borda": [13, 38, 13, 31], "folga": [4, 9, 4, 7], "texto": "#2a2320", "lado": 512}}, "animado": false}'::jsonb
 WHERE key = 'cosmetico:balao-ultimo-suspiro' AND meta->>'asset' = 'devo:balao/ultimo-suspiro';
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/mesa-destino/balao", "imagem": {"base": "/images/cosmeticos/mesa-destino/balao", "tamanhos": [256, 512, 768, 1024], "slice": {"corte": [14, 54, 11, 83], "borda": [8, 30, 8, 46], "folga": [4, 7, 4, 11], "texto": "#f1e7e9", "lado": 512}}, "animado": false}'::jsonb
 WHERE key = 'cosmetico:balao-mesa-destino' AND meta->>'asset' = 'devo:balao/mesa-destino';
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/rosa-sangue/emblema", "imagem": {"base": "/images/cosmeticos/rosa-sangue/emblema", "tamanhos": [48, 96, 256, 512, 1024]}, "animado": false}'::jsonb
 WHERE key = 'cosmetico:emblema-rosa-sangue' AND meta->>'asset' = 'devo:emblema/rosa-sangue';
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/coroa-partida/emblema", "imagem": {"base": "/images/cosmeticos/coroa-partida/emblema", "tamanhos": [48, 96, 256, 512, 1024]}, "animado": false}'::jsonb
 WHERE key = 'cosmetico:emblema-coroa-partida' AND meta->>'asset' = 'devo:emblema/coroa-partida';
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/ampulheta-dourada/emblema", "imagem": {"base": "/images/cosmeticos/ampulheta-dourada/emblema", "tamanhos": [48, 96, 256, 512, 1024]}, "animado": false}'::jsonb
 WHERE key = 'cosmetico:emblema-ampulheta-dourada' AND meta->>'asset' = 'devo:emblema/ampulheta-dourada';
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/olho-destino/emblema", "imagem": {"base": "/images/cosmeticos/olho-destino/emblema", "tamanhos": [48, 96, 256, 512, 1024], "camadas": [{"src": "/images/cosmeticos/olho-destino/emblema-iris.webp", "anim": "brilho", "caixa": [0.2539, 0.1045, 0.5, 0.5088], "dur": 5.5}]}, "animado": true}'::jsonb
 WHERE key = 'cosmetico:emblema-olho-destino' AND meta->>'asset' = 'devo:emblema/olho-destino';
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/chave-proibida/emblema", "imagem": {"base": "/images/cosmeticos/chave-proibida/emblema", "tamanhos": [48, 96, 256, 512, 1024]}, "animado": false}'::jsonb
 WHERE key = 'cosmetico:emblema-chave-proibida' AND meta->>'asset' = 'devo:emblema/chave-proibida';
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/as-espadas/emblema", "imagem": {"base": "/images/cosmeticos/as-espadas/emblema", "tamanhos": [48, 96, 256, 512, 1024]}, "animado": false}'::jsonb
 WHERE key = 'cosmetico:emblema-as-espadas' AND meta->>'asset' = 'devo:emblema/as-espadas';
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/lua-escarlate/emblema", "imagem": {"base": "/images/cosmeticos/lua-escarlate/emblema", "tamanhos": [48, 96, 256, 512, 1024], "camadas": [{"src": "/images/cosmeticos/lua-escarlate/emblema-cristal.webp", "anim": "pulso", "caixa": [0.2178, 0.1895, 0.5527, 0.751], "dur": 3.2}]}, "animado": true}'::jsonb
 WHERE key = 'cosmetico:emblema-lua-escarlate' AND meta->>'asset' = 'devo:emblema/lua-escarlate';
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/fragmento-celestial/emblema", "imagem": {"base": "/images/cosmeticos/fragmento-celestial/emblema", "tamanhos": [48, 96, 256, 512, 1024], "camadas": [{"src": "/images/cosmeticos/fragmento-celestial/emblema-luz.webp", "anim": "pulso", "caixa": [0.291, 0.0283, 0.416, 0.9453], "dur": 3.2}]}, "animado": true}'::jsonb
 WHERE key = 'cosmetico:emblema-fragmento-celestial' AND meta->>'asset' = 'devo:emblema/fragmento-celestial';
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/engrenagem-herdeiro/emblema", "imagem": {"base": "/images/cosmeticos/engrenagem-herdeiro/emblema", "tamanhos": [48, 96, 256, 512, 1024], "camadas": [{"src": "/images/cosmeticos/engrenagem-herdeiro/emblema-engrenagem-herdeiro.webp", "anim": "giro", "caixa": [0.035, 0.09, 0.82, 0.82], "dur": 24}]}, "animado": true}'::jsonb
 WHERE key = 'cosmetico:emblema-engrenagem-herdeiro' AND meta->>'asset' = 'devo:emblema/engrenagem-herdeiro';
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/pena-coruja/emblema", "imagem": {"base": "/images/cosmeticos/pena-coruja/emblema", "tamanhos": [48, 96, 256, 512, 1024]}, "animado": false}'::jsonb
 WHERE key = 'cosmetico:emblema-pena-coruja' AND meta->>'asset' = 'devo:emblema/pena-coruja';
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/ficha-javali/emblema", "imagem": {"base": "/images/cosmeticos/ficha-javali/emblema", "tamanhos": [48, 96, 256, 512, 1024]}, "animado": false}'::jsonb
 WHERE key = 'cosmetico:emblema-ficha-javali' AND meta->>'asset' = 'devo:emblema/ficha-javali';
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/selo-anfitriao/emblema", "imagem": {"base": "/images/cosmeticos/selo-anfitriao/emblema", "tamanhos": [48, 96, 256, 512, 1024]}, "animado": false}'::jsonb
 WHERE key = 'cosmetico:emblema-selo-anfitriao' AND meta->>'asset' = 'devo:emblema/selo-anfitriao';
UPDATE item_defs SET meta = meta || '{"asset": "img:/images/cosmeticos/asas-do-crepusculo/mini", "imagem": {"base": "/images/cosmeticos/asas-do-crepusculo/mini", "tamanhos": [48, 96, 256, 512, 1024], "janela": {"forma": "quadrado", "centro": [0.5, 0.5], "raio": [0.2735, 0.2735], "raio_canto": 0.04}, "camadas": [{"src": "/images/cosmeticos/asas-do-crepusculo/mini-gema.webp", "anim": "brilho", "caixa": [0.2334, 0.0752, 0.542, 0.7861], "dur": 5.5}]}, "animado": true}'::jsonb
 WHERE key = 'cosmetico:mini-asas-crepusculo' AND meta->>'asset' IN ('devo:moldura/asas-crepusculo', 'img:/images/cosmeticos/asas-do-crepusculo/moldura');

-- ---------------------------------------------------------------------------------------------
-- 9. Rosa do Destino retirada (REFINAMENTO-4-dono.md §4): moldura, mini e balão saem do jogo. Idempotente — na
--    segunda vez nada mais casa. Ordem: registra no admin_log (por jogador: o que tinha e o que estava equipado),
--    desequipa, tira dos inventários, limpa o histórico do item (item_ledger e poco_giros apontam para item_defs)
--    e apaga a definição. O registro fica só no admin_log ('cosmetico.removido' por jogador, 'cosmetico.item_removido'
--    por item, com a definição completa para restaurar se o dono mudar de ideia).
-- ---------------------------------------------------------------------------------------------
INSERT INTO admin_log (action, target_id, ref, data)
SELECT 'cosmetico.removido', x.pid, 'rosa-do-destino',
       jsonb_build_object('motivo', 'Rosa do Destino retirada do catálogo (pedido do dono)',
                          'itens', coalesce(it.itens, '[]'::jsonb), 'equipados', coalesce(eq.slots, '{}'::jsonb))
  FROM (SELECT player_id AS pid FROM player_items WHERE item_key = ANY(ARRAY['cosmetico:moldura-rosa-destino', 'cosmetico:mini-rosa-destino', 'cosmetico:balao-rosa-destino']) AND quantity > 0
        UNION
        SELECT player_id FROM player_cosmetics
         WHERE moldura_avatar = ANY(ARRAY['cosmetico:moldura-rosa-destino', 'cosmetico:mini-rosa-destino', 'cosmetico:balao-rosa-destino']) OR moldura_mini = ANY(ARRAY['cosmetico:moldura-rosa-destino', 'cosmetico:mini-rosa-destino', 'cosmetico:balao-rosa-destino']) OR balao = ANY(ARRAY['cosmetico:moldura-rosa-destino', 'cosmetico:mini-rosa-destino', 'cosmetico:balao-rosa-destino'])) x
  LEFT JOIN LATERAL (SELECT jsonb_agg(jsonb_build_object('item', i.item_key, 'quantidade', i.quantity)) AS itens
                       FROM player_items i WHERE i.player_id = x.pid AND i.item_key = ANY(ARRAY['cosmetico:moldura-rosa-destino', 'cosmetico:mini-rosa-destino', 'cosmetico:balao-rosa-destino']) AND i.quantity > 0) it ON true
  LEFT JOIN LATERAL (SELECT jsonb_strip_nulls(jsonb_build_object(
                              'moldura_avatar', CASE WHEN c.moldura_avatar = ANY(ARRAY['cosmetico:moldura-rosa-destino', 'cosmetico:mini-rosa-destino', 'cosmetico:balao-rosa-destino']) THEN c.moldura_avatar END,
                              'moldura_mini', CASE WHEN c.moldura_mini = ANY(ARRAY['cosmetico:moldura-rosa-destino', 'cosmetico:mini-rosa-destino', 'cosmetico:balao-rosa-destino']) THEN c.moldura_mini END,
                              'balao', CASE WHEN c.balao = ANY(ARRAY['cosmetico:moldura-rosa-destino', 'cosmetico:mini-rosa-destino', 'cosmetico:balao-rosa-destino']) THEN c.balao END)) AS slots
                       FROM player_cosmetics c WHERE c.player_id = x.pid) eq ON true;

UPDATE player_cosmetics SET
  moldura_avatar = CASE WHEN moldura_avatar = ANY(ARRAY['cosmetico:moldura-rosa-destino', 'cosmetico:mini-rosa-destino', 'cosmetico:balao-rosa-destino']) THEN NULL ELSE moldura_avatar END,
  moldura_mini = CASE WHEN moldura_mini = ANY(ARRAY['cosmetico:moldura-rosa-destino', 'cosmetico:mini-rosa-destino', 'cosmetico:balao-rosa-destino']) THEN NULL ELSE moldura_mini END,
  balao = CASE WHEN balao = ANY(ARRAY['cosmetico:moldura-rosa-destino', 'cosmetico:mini-rosa-destino', 'cosmetico:balao-rosa-destino']) THEN NULL ELSE balao END,
  updated_at = now()
 WHERE moldura_avatar = ANY(ARRAY['cosmetico:moldura-rosa-destino', 'cosmetico:mini-rosa-destino', 'cosmetico:balao-rosa-destino']) OR moldura_mini = ANY(ARRAY['cosmetico:moldura-rosa-destino', 'cosmetico:mini-rosa-destino', 'cosmetico:balao-rosa-destino']) OR balao = ANY(ARRAY['cosmetico:moldura-rosa-destino', 'cosmetico:mini-rosa-destino', 'cosmetico:balao-rosa-destino']);

DELETE FROM player_items WHERE item_key = ANY(ARRAY['cosmetico:moldura-rosa-destino', 'cosmetico:mini-rosa-destino', 'cosmetico:balao-rosa-destino']);
DELETE FROM item_ledger WHERE item_key = ANY(ARRAY['cosmetico:moldura-rosa-destino', 'cosmetico:mini-rosa-destino', 'cosmetico:balao-rosa-destino']);
UPDATE poco_giros SET item_key = NULL WHERE item_key = ANY(ARRAY['cosmetico:moldura-rosa-destino', 'cosmetico:mini-rosa-destino', 'cosmetico:balao-rosa-destino']);

INSERT INTO admin_log (action, ref, data)
SELECT 'cosmetico.item_removido', d.key, jsonb_build_object('motivo', 'Rosa do Destino retirada do catálogo (pedido do dono)',
       'definicao', to_jsonb(d))
  FROM item_defs d WHERE d.key = ANY(ARRAY['cosmetico:moldura-rosa-destino', 'cosmetico:mini-rosa-destino', 'cosmetico:balao-rosa-destino']);
DELETE FROM item_defs WHERE key = ANY(ARRAY['cosmetico:moldura-rosa-destino', 'cosmetico:mini-rosa-destino', 'cosmetico:balao-rosa-destino']);


-- ---------------------------------------------------------------------------------------------
-- 10. Pedido do dono (17/10): estilo do nome (à moda do Discord), borda do perfil e mais balões.
--     • `efeito` passa a se chamar "Nome" na coleção: além dos três efeitos antigos, estilos com fonte + cor/gradiente
--       + efeito em meta.nome = {fonte, cores, efeito} (listas fixas em lib/devo/cosmeticos.ts; nada de CSS livre).
--     • Novo espaço `borda` (borda do perfil: card do Record e do miniperfil), meta.borda = {estilo, cores, animada}.
--     • Balões e bordas marcados meta.provisorio: desenhados em CSS até a arte pintada chegar do agente de arte
--       (public/images/cosmeticos/<id>/…); aí um UPDATE troca o asset para 'img:…' e a arte assume.
-- ---------------------------------------------------------------------------------------------
ALTER TABLE player_cosmetics ADD COLUMN IF NOT EXISTS borda text REFERENCES item_defs(key) ON UPDATE CASCADE ON DELETE SET NULL;

INSERT INTO item_defs (key, kind, name, description, rarity, stackable, meta) VALUES
  ('cosmetico:nome-pergaminho-real', 'cosmetico', 'Pergaminho Real', 'Letras de chancelaria em tinta sépia e ouro baço.', 'incomum', false,
   '{"categoria": "efeito", "asset": "devo:nome/pergaminho-real", "nome": {"fonte": "real", "cores": ["#ece5d8", "#bab09f"], "efeito": "gradiente"}, "animado": false, "poco": true, "origem": "poco", "ordem": 10}'),
  ('cosmetico:nome-tinta-gotica', 'cosmetico', 'Tinta Gótica', 'O nome em letra negra, como num registro antigo.', 'comum', false,
   '{"categoria": "efeito", "asset": "devo:nome/tinta-gotica", "nome": {"fonte": "gotica", "cores": ["#d9d8d4"], "efeito": "nenhum"}, "animado": false, "poco": true, "origem": "poco", "ordem": 11}'),
  ('cosmetico:nome-fliperama', 'cosmetico', 'Fliperama', 'Letra de fliperama que pulsa devagar, verde de tela velha.', 'incomum', false,
   '{"categoria": "efeito", "asset": "devo:nome/fliperama", "nome": {"fonte": "pixel", "cores": ["#7cf2c8", "#2a7a5e"], "efeito": "pulso"}, "animado": true, "poco": true, "origem": "poco", "ordem": 12}'),
  ('cosmetico:nome-vela-funebre', 'cosmetico', 'Vela Fúnebre', 'Pergaminho à luz de vela: o brilho sobe e desce.', 'raro', false,
   '{"categoria": "efeito", "asset": "devo:nome/vela-funebre", "nome": {"fonte": "pergaminho", "cores": ["#f2d39b", "#c26a1c"], "efeito": "pulso"}, "animado": true, "poco": true, "origem": "poco", "ordem": 13}'),
  ('cosmetico:nome-corsario', 'cosmetico', 'Corsário', 'Letra de mapa de pirata, contornada como cartaz.', 'raro', false,
   '{"categoria": "efeito", "asset": "devo:nome/corsario", "nome": {"fonte": "pirata", "cores": ["#e2c27a", "#3a240c"], "efeito": "toon"}, "animado": false, "poco": true, "origem": "poco", "ordem": 14}'),
  ('cosmetico:nome-caligrafia-noturna', 'cosmetico', 'Caligrafia Noturna', 'Traço de pena com um halo de ametista.', 'raro', false,
   '{"categoria": "efeito", "asset": "devo:nome/caligrafia-noturna", "nome": {"fonte": "caligrafia", "cores": ["#f1e7e9", "#8a7cc8"], "efeito": "glow"}, "animado": false, "poco": true, "origem": "poco", "ordem": 15}'),
  ('cosmetico:nome-veu-ametista', 'cosmetico', 'Véu de Ametista', 'Capitulares com um reflexo que atravessa o nome.', 'raro', false,
   '{"categoria": "efeito", "asset": "devo:nome/veu-ametista", "nome": {"fonte": "decorativa", "cores": ["#c2b9ec", "#8a7cc8", "#efe9ff"], "efeito": "brilho"}, "animado": true, "poco": true, "origem": "poco", "ordem": 16}'),
  ('cosmetico:nome-champanhe', 'cosmetico', 'Aço Champanhe', 'Champanhe e aço em gradiente que corre devagar.', 'epico', false,
   '{"categoria": "efeito", "asset": "devo:nome/champanhe", "nome": {"fonte": "classica", "cores": ["#e3d3ae", "#9aa0b4", "#fff6e0"], "efeito": "gradiente-movel"}, "animado": true, "poco": false, "origem": "semanal", "ordem": 17}'),
  ('cosmetico:nome-sangue-neon', 'cosmetico', 'Letreiro de Sangue', 'Neon vermelho de cassino, com uma falha de vez em quando.', 'epico', false,
   '{"categoria": "efeito", "asset": "devo:nome/sangue-neon", "nome": {"fonte": "impacto", "cores": ["#ff3a5c", "#a3121f"], "efeito": "neon"}, "animado": true, "poco": false, "origem": "deadly_vote", "ordem": 18}'),
  ('cosmetico:nome-aurora-arcana', 'cosmetico', 'Aurora Arcana', 'Ametista, rosa-seco e champanhe correndo pelo nome.', 'lendario', false,
   '{"categoria": "efeito", "asset": "devo:nome/aurora-arcana", "nome": {"fonte": "real", "cores": ["#8a7cc8", "#c98a95", "#e3d3ae"], "efeito": "gradiente-movel"}, "animado": true, "poco": false, "origem": "evento", "ordem": 19}'),
  ('cosmetico:borda-aco-escovado', 'cosmetico', 'Aço Escovado', 'Aço escuro com filete champanhe. Discreta.', 'comum', false,
   '{"categoria": "borda", "asset": "devo:borda/aco-escovado", "borda": {"estilo": "aco", "cores": ["#bab09f", "#8a7cc8"], "animada": false}, "animado": false, "poco": true, "origem": "poco", "ordem": 10, "provisorio": true}'),
  ('cosmetico:borda-veludo-carmesim', 'cosmetico', 'Veludo Carmesim', 'Veludo cor de vinho com filigrana dourada.', 'raro', false,
   '{"categoria": "borda", "asset": "devo:borda/veludo-carmesim", "borda": {"estilo": "veludo", "cores": ["#e3d3ae", "#5c1424"], "animada": false}, "animado": false, "poco": true, "origem": "poco", "ordem": 11, "provisorio": true}'),
  ('cosmetico:borda-nevoa-cemiterio', 'cosmetico', 'Névoa do Cemitério', 'Uma névoa fria que passa devagar atrás do nome.', 'raro', false,
   '{"categoria": "borda", "asset": "devo:borda/nevoa-cemiterio", "borda": {"estilo": "nevoa", "cores": ["#c9ccd6", "#2a2f3a"], "animada": true}, "animado": true, "poco": true, "origem": "poco", "ordem": 12, "provisorio": true}'),
  ('cosmetico:borda-vitral-capela', 'cosmetico', 'Vitral da Capela', 'Vitrais de capela com luz que respira.', 'epico', false,
   '{"categoria": "borda", "asset": "devo:borda/vitral-capela", "borda": {"estilo": "vitral", "cores": ["#8a7cc8", "#a3121f", "#2f5a8a"], "animada": true}, "animado": true, "poco": false, "origem": "semanal", "ordem": 13, "provisorio": true}'),
  ('cosmetico:borda-brasas', 'cosmetico', 'Brasas', 'Brasas subindo de um fundo em carvão.', 'epico', false,
   '{"categoria": "borda", "asset": "devo:borda/brasas", "borda": {"estilo": "brasas", "cores": ["#ffb36b", "#5c1a10", "#ff6a3d"], "animada": true}, "animado": true, "poco": false, "origem": "deadly_vote", "ordem": 14, "provisorio": true}'),
  ('cosmetico:borda-constelacao', 'cosmetico', 'Constelação', 'Céu de estrelas que piscam, ligadas por linhas finas.', 'lendario', false,
   '{"categoria": "borda", "asset": "devo:borda/constelacao", "borda": {"estilo": "constelacao", "cores": ["#e3d3ae", "#2a2448", "#c2b9ec"], "animada": true}, "animado": true, "poco": false, "origem": "evento", "ordem": 15, "provisorio": true}'),
  ('cosmetico:borda-circulo-arcano', 'cosmetico', 'Círculo Arcano', 'Um anel rúnico de ametista girando sem pressa.', 'arcano', false,
   '{"categoria": "borda", "asset": "devo:borda/circulo-arcano", "borda": {"estilo": "arcano", "cores": ["#c2b9ec", "#3b2f6b", "#8a7cc8"], "animada": true}, "animado": true, "poco": false, "origem": "evento", "ordem": 16, "provisorio": true}'),
  ('cosmetico:balao-cinza-fumaca', 'cosmetico', 'Cinza Fumaça', 'Fumaça fria com filete de aço.', 'comum', false,
   '{"categoria": "balao", "asset": "devo:balao/cinza-fumaca", "balao": {"fundo": "#1c1d22", "borda": "#5d6070", "texto": "#e6e7ec", "filete": "#9aa0b4"}, "animado": false, "poco": true, "origem": "poco", "ordem": 40, "provisorio": true}'),
  ('cosmetico:balao-aco-champanhe', 'cosmetico', 'Aço Champanhe', 'Aço escuro com filete champanhe.', 'incomum', false,
   '{"categoria": "balao", "asset": "devo:balao/aco-champanhe", "balao": {"fundo": "#2a2926", "borda": "#bab09f", "texto": "#f3eee4", "filete": "#e3d3ae"}, "animado": false, "poco": true, "origem": "poco", "ordem": 41, "provisorio": true}'),
  ('cosmetico:balao-veu-ametista', 'cosmetico', 'Véu de Ametista', 'Roxo profundo com um fio de ametista.', 'raro', false,
   '{"categoria": "balao", "asset": "devo:balao/veu-ametista", "balao": {"fundo": "#241d38", "borda": "#8a7cc8", "texto": "#efe9ff", "filete": "#c2b9ec"}, "animado": false, "poco": true, "origem": "poco", "ordem": 42, "provisorio": true}'),
  ('cosmetico:balao-tinta-vinho', 'cosmetico', 'Tinta de Vinho', 'Vinho escuro com borda de sangue.', 'raro', false,
   '{"categoria": "balao", "asset": "devo:balao/tinta-vinho", "balao": {"fundo": "#3a0f18", "borda": "#a3121f", "texto": "#f1e7e9", "filete": "#c98a95"}, "animado": false, "poco": true, "origem": "poco", "ordem": 43, "provisorio": true}'),
  ('cosmetico:balao-ouro-velho', 'cosmetico', 'Ouro Velho', 'Papel de cartório com moldura de ouro gasto.', 'epico', false,
   '{"categoria": "balao", "asset": "devo:balao/ouro-velho", "balao": {"fundo": "#e9dfc6", "borda": "#8a6a2a", "texto": "#2a2320", "filete": "#b8923a"}, "animado": false, "poco": false, "origem": "semanal", "ordem": 44, "provisorio": true}')
ON CONFLICT (key) DO NOTHING;
