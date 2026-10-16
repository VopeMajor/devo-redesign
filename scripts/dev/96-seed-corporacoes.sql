-- Seed de teste das Corporações (só CI/local; depende de 90-seed.sql e corporacoes-migration.sql).
-- Convites das capturas e do teste de servidor (contas de teste):
--   DEVO-CORP-0001 → 'Cortesa'    (continua trancada: mostra o motivo)
--   DEVO-CORP-0002 → 'Candida'    (sem Corporação: holograma, código inválido, pedido enviado, recebe carta)
--   DEVO-CORP-0003 → 'Lidera'     (o roteiro a põe como líder da Ordem do Relógio Partido: aprova, transfere)
--   DEVO-CORP-0004 → 'Fundadora'  (funda uma Corporação: custo, fila na Mesa, necro)
--   DEVO-CORP-0005…0012 → livres para o teste de servidor (scripts/dev/corporacoes-test.mjs)
INSERT INTO invite_codes (code, role, note, is_test) VALUES
  ('DEVO-CORP-0001', 'player', 'capturas das corporações: trancada', true),
  ('DEVO-CORP-0002', 'player', 'capturas das corporações: candidata', true),
  ('DEVO-CORP-0003', 'player', 'capturas das corporações: líder', true),
  ('DEVO-CORP-0004', 'player', 'capturas das corporações: fundadora', true),
  ('DEVO-CORP-0005', 'player', 'corporações: teste', true),
  ('DEVO-CORP-0006', 'player', 'corporações: teste', true),
  ('DEVO-CORP-0007', 'player', 'corporações: teste', true),
  ('DEVO-CORP-0008', 'player', 'corporações: teste', true),
  ('DEVO-CORP-0009', 'player', 'corporações: teste', true),
  ('DEVO-CORP-0010', 'player', 'corporações: teste', true),
  ('DEVO-CORP-0011', 'player', 'corporações: teste', true),
  ('DEVO-CORP-0012', 'player', 'corporações: teste', true)
ON CONFLICT (code) DO NOTHING;

-- Corporações: uma oficial (Corvo lidera; Ísis vice; Matheus membro), uma Necro (Nyx) e uma fundação em análise (Lírio).
-- Jogadores do seed: Corvo …01, Ísis …02, Matheus …03, Nyx …04, Lírio …05.
INSERT INTO corporacoes (id, codigo, nome, lema, brasao_forma, brasao_cor, status, classificacao, classificacao_nota, fundador_id, custo_pago, decidida_at, created_at) VALUES
  ('c0a90000-0000-4000-8000-000000000001', 'CRP-HQRA-3746', 'Ordem do Relógio Partido', 'O tempo de um é o tempo de todos.', 'escudo', 'aco', 'ativa', 'oficial', NULL,
   '00000000-0000-4000-8000-000000000001', 360, now() - interval '9 days', now() - interval '10 days'),
  ('c0a90000-0000-4000-8000-000000000002', 'CRP-CNXA-9X4T', 'Coro das Cinzas', 'Nenhum voto é sagrado.', 'estrela', 'vinho', 'ativa', 'necro', 'Sabotagem comprovada no Leilão de Sombras.',
   '00000000-0000-4000-8000-000000000004', 360, now() - interval '6 days', now() - interval '7 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO corporacoes (id, nome, lema, brasao_forma, brasao_cor, status, fundador_id, custo_pago, requisitos, created_at) VALUES
  ('c0a90000-0000-4000-8000-000000000003', 'Irmandade da Vela Negra', 'Uma chama para cada voto.', 'losango', 'onix', 'pendente',
   '00000000-0000-4000-8000-000000000005', 360,
   '[{"id": "deadly_votes", "rotulo": "Deadly Votes sobrevividos", "exigido": 1, "atual": 2, "ok": true}, {"id": "cartas", "rotulo": "Cartas no inventário", "exigido": 3, "atual": 7, "ok": true}]'::jsonb,
   now() - interval '5 hours')
ON CONFLICT (id) DO NOTHING;

INSERT INTO corporacao_membros (player_id, corporacao_id, cargo, entrou_at) VALUES
  ('00000000-0000-4000-8000-000000000001', 'c0a90000-0000-4000-8000-000000000001', 'lider',  now() - interval '9 days'),
  ('00000000-0000-4000-8000-000000000002', 'c0a90000-0000-4000-8000-000000000001', 'vice',   now() - interval '8 days'),
  ('00000000-0000-4000-8000-000000000003', 'c0a90000-0000-4000-8000-000000000001', 'membro', now() - interval '4 days'),
  ('00000000-0000-4000-8000-000000000004', 'c0a90000-0000-4000-8000-000000000002', 'lider',  now() - interval '6 days')
ON CONFLICT (player_id) DO NOTHING;

-- Rivalidade provisória entre as duas.
INSERT INTO corporacao_rivalidades (a_id, b_id, nota) VALUES
  ('c0a90000-0000-4000-8000-000000000001', 'c0a90000-0000-4000-8000-000000000002', 'PROVISÓRIO: exemplo de rivalidade.')
ON CONFLICT DO NOTHING;

-- Transferência antiga (histórico da Ordem).
INSERT INTO corporacao_transferencias (id, corporacao_id, de_id, para_id, card_uid, card_id, created_at) VALUES
  ('c0a90001-0000-4000-8000-000000000001', 'c0a90000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002',
   '00000000-0000-4000-8000-000000000003', 'seed-corp-1', 'olho', now() - interval '2 days')
ON CONFLICT (id) DO NOTHING;

-- Deadly Vote concluído (sem resultado aplicado) para o roteiro marcar sobrevivência e cumprir o requisito de fundação.
INSERT INTO deadly_votes (id, title, arc, briefing, status, starts_at, ends_at, max_participants, created_by, updated_at)
VALUES ('c0a90002-0000-4000-8000-000000000001', 'Vigília dos Fundadores', 'Arco I', 'Seed das Corporações: sobreviventes podem fundar.', 'concluido',
        now() - interval '4 days', now() - interval '4 days' + interval '1 hour', 12, '00000000-0000-4000-8000-000000000006', now() - interval '4 days')
ON CONFLICT (id) DO NOTHING;
