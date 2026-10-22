-- Seed de teste do Salão das Máscaras (só CI/local; depende de 90-seed.sql e salao-migration.sql).
-- Convites das capturas (contas de teste):
--   DEVO-SALA-0001 → 'Velada' (o roteiro libera o Salão e percorre a apresentação, o leilão e a Bandeja)
--   DEVO-SALA-0002 → 'Fosca'  (continua trancada: mostra o motivo)
--   DEVO-SALA-0003…0006 → livres para o teste de servidor (scripts/dev/salao-test.mjs)
INSERT INTO invite_codes (code, role, note, is_test) VALUES
  ('DEVO-SALA-0001', 'player', 'capturas do salão: liberada', true),
  ('DEVO-SALA-0002', 'player', 'capturas do salão: trancada', true),
  ('DEVO-SALA-0003', 'player', 'salão: teste', true),
  ('DEVO-SALA-0004', 'player', 'salão: teste', true),
  ('DEVO-SALA-0005', 'player', 'salão: teste', true),
  ('DEVO-SALA-0006', 'player', 'salão: teste', true)
ON CONFLICT (code) DO NOTHING;

-- Lotes na edição corrente (índice calculado da âncora do calendário), na próxima, encerrados e em avaliação.
-- Jogadores do seed: Corvo …01, Ísis …02, Matheus …03, Nyx …04, Lírio …05.
WITH cal AS (
  SELECT (value->>'ancora')::timestamptz AS a, (value->>'intervalo_dias')::numeric AS i FROM devo_config WHERE key = 'salao.calendario'
), ed AS (
  SELECT floor(extract(epoch FROM now() - a) / (i * 86400))::int AS n FROM cal
)
INSERT INTO salao_lotes (id, seller_id, card_uid, card_id, card_rarity, contrato, taxa_divulgacao, comissao_pct, lance_minimo, incremento,
                         status, edicao, valor_final, repasse, vencedor_id, encerrado_at, avaliado_at, created_at)
SELECT v.id::uuid, v.seller::uuid, v.uid, v.card, v.rar, 'avulso', 20, 15, v.minimo, 10, v.status,
       CASE WHEN v.status = 'avaliacao' THEN NULL ELSE ed.n + v.desloc END,
       v.valor, CASE WHEN v.valor IS NULL THEN NULL ELSE floor(v.valor * 0.85)::int END, v.vencedor::uuid,
       CASE WHEN v.status IN ('vendido', 'devolvido') THEN now() - interval '2 days' END,
       CASE WHEN v.status <> 'avaliacao' THEN now() - interval '1 day' END, now() - v.ha
  FROM ed, (VALUES
    ('5a1a0001-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'seed-salao-1', 'coroa',    'lendaria', 'aprovado',  0, 90, NULL::int, NULL, interval '3 days'),
    ('5a1a0001-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000005', 'seed-salao-2', 'olho',     'rara',     'aprovado',  0, 40, NULL, NULL, interval '3 days'),
    ('5a1a0001-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001', 'seed-salao-3', 'dado',     'comum',    'aprovado',  0, 30, NULL, NULL, interval '2 days'),
    ('5a1a0001-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000001', 'seed-salao-4', 'relogio',  'lendaria', 'vendido',  -1, 120, 300, '00000000-0000-4000-8000-000000000004', interval '6 days'),
    ('5a1a0001-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000004', 'seed-salao-5', 'porta',    'incomum',  'devolvido', -1, 30, NULL, NULL, interval '6 days'),
    ('5a1a0001-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000004', 'seed-salao-6', 'mascara',  'rara',     'aprovado',  1, 60, NULL, NULL, interval '1 day'),
    ('5a1a0001-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000005', 'seed-salao-7', 'ampulheta','comum',     'avaliacao', 0, 45, NULL, NULL, interval '5 hours'),
    ('5a1a0001-0000-4000-8000-000000000008', '00000000-0000-4000-8000-000000000001', 'seed-salao-8', 'laminas',  'incomum',  'avaliacao', 0, 30, NULL, NULL, interval '2 hours')
  ) AS v(id, seller, uid, card, rar, status, desloc, minimo, valor, vencedor, ha)
ON CONFLICT (id) DO NOTHING;

-- Lances: a Coroa disputada (Nyx superada por Corvo), o Olho com um lance, o vencedor do Relógio.
INSERT INTO salao_lances (id, lote_id, player_id, valor, status, created_at) VALUES
  ('5a1a0002-0000-4000-8000-000000000001', '5a1a0001-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000004', 120, 'superado', now() - interval '3 hours'),
  ('5a1a0002-0000-4000-8000-000000000002', '5a1a0001-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 150, 'ativo',    now() - interval '2 hours'),
  ('5a1a0002-0000-4000-8000-000000000003', '5a1a0001-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000004', 45,  'ativo',    now() - interval '1 hour'),
  ('5a1a0002-0000-4000-8000-000000000004', '5a1a0001-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000004', 300, 'vencedor', now() - interval '3 days')
ON CONFLICT (id) DO NOTHING;

-- Mercado: duas cartas à venda.
INSERT INTO salao_mercado (id, seller_id, card_uid, card_id, card_rarity, preco, comissao_pct, created_at) VALUES
  ('5a1a0003-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000004', 'seed-mercado-1', 'tesoura', 'comum', 25, 15, now() - interval '5 hours'),
  ('5a1a0003-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', 'seed-mercado-2', 'cranio',  'rara',  180, 15, now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;

-- Mural: recrutamento de Corporação, propaganda, proposta; e uma proposta esperando avaliação.
INSERT INTO salao_anuncios (id, autor_id, tipo, titulo, texto, corporacao, custo, status, created_at, expira_at) VALUES
  ('5a1a0004-0000-4000-8000-000000000001', NULL, 'recrutamento', 'Procuramos jogadores de nervos firmes',
   'Duas vagas abertas para quem sobreviveu ao primeiro voto. Código de identificação com o líder. Reuniões depois de cada edição do Salão.',
   'Ordem do Relógio Partido', 0, 'publicado', now() - interval '1 day', now() + interval '8 days'),
  ('5a1a0004-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', 'propaganda', 'Coroas, só as verdadeiras',
   'Compro e vendo cartas lendárias. Pago em Tempo, sem pressa e sem perguntas.', NULL, 60, 'publicado', now() - interval '20 hours', now() + interval '8 days'),
  ('5a1a0004-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001', 'proposta', 'Troco informação por Tempo',
   'Sei quem vai estar no próximo Deadly Vote. Proposta séria, procure-me no Salão.', NULL, 0, 'publicado', now() - interval '6 hours', now() + interval '8 days'),
  ('5a1a0004-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000003', 'proposta', 'Procuro a Ampulheta Invertida',
   'Pago bem pela Ampulheta. Deixe um recado.', NULL, 0, 'pendente', now() - interval '1 hour', NULL)
ON CONFLICT (id) DO NOTHING;
