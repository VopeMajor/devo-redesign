-- Seed de teste do Poço dos Milagres (só CI/local; depende de 90-seed.sql e poco-migration.sql).
-- Convites das capturas (contas de teste: ficam fora do letreiro, ranking e prêmios):
--   DEVO-POCO-0001 → 'Brasa'  (o roteiro libera o Poço e o Diário dela e percorre a cena e um giro)
--   DEVO-POCO-0002 → 'Cinza'  (continua trancada: mostra o motivo)
--   DEVO-POCO-0003/0004 → livres para o teste de servidor (scripts/dev/poco-test.mjs cria os próprios)
INSERT INTO invite_codes (code, role, note, is_test) VALUES
  ('DEVO-POCO-0001', 'player', 'capturas do poço: liberada', true),
  ('DEVO-POCO-0002', 'player', 'capturas do poço: trancada', true),
  ('DEVO-POCO-0003', 'player', 'poço: livre', true),
  ('DEVO-POCO-0004', 'player', 'poço: livre', true)
ON CONFLICT (code) DO NOTHING;

-- Letreiro: prêmios bons já revelados de jogadores do seed (o letreiro mostra só o nome do personagem).
INSERT INTO poco_giros (player_id, moeda, gratis, dia, balde, estado, seed, seed_hash, acertos, pesos, provisorio, rolagem,
                        categoria_sorteada, categoria, item_key, quantidade, lancado_at, girado_at, revelado_at)
SELECT p.id::uuid, 'dracma_comum', false, (now() AT TIME ZONE 'America/Sao_Paulo')::date - v.dias, 'madeira', 'revelado',
       md5(v.item || p.id), md5(md5(v.item || p.id)), v.acertos, '{}'::jsonb, true, 0.5,
       v.cat, v.cat, v.item, v.qtd, now() - v.ha, now() - v.ha, now() - v.ha
  FROM (VALUES
    ('00000000-0000-4000-8000-000000000005', 'capsula',   'capsula:003',      1, 3, interval '40 minutes', 0),
    ('00000000-0000-4000-8000-000000000002', 'fragmento', 'fragmento_arcano', 2, 4, interval '2 hours',    0),
    ('00000000-0000-4000-8000-000000000003', 'essencia',  'essencia:galo',    3, 1, interval '5 hours',    0),
    ('00000000-0000-4000-8000-000000000004', 'capsula',   'capsula:007',      1, 5, interval '1 day',      1)
  ) AS v(pid, cat, item, qtd, acertos, ha, dias)
  JOIN players p ON p.id = v.pid::uuid
 WHERE NOT EXISTS (SELECT 1 FROM poco_giros g WHERE g.player_id = p.id AND g.item_key = v.item);
