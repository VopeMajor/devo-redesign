-- Tabela do Poço do dono (23/10) + Pacote Iniciante, Pacote Intermediário e Presente.
--
-- Dracma Comum:   70% Lixo · 10% Cápsula · 8% Fragmento Arcano · 9% Presente · 3% Pacote Iniciante
-- Dracma Incomum: 50% Lixo · 15% Cápsula · 15% Fragmento Arcano · 11% Presente · 4% Cosmético
--                 · 4% Pacote Iniciante · 1% Grande Fragmento Arcano
-- Dracma Rara:    30% Lixo · 16% Cápsula · 16% Fragmento Arcano · 13% Presente · 8% Cosmético
--                 · 8% Pacote Iniciante · 5% Pacote Intermediário · 4% Grande Fragmento Arcano
-- Essências de Afinidade não saem mais do Poço (peso 0).
--
-- Seções = devo_config 'poco.probabilidades'; Presente, Pacotes e Grande Fragmento = prêmios do pool (poco_premios),
-- com o peso na mesma escala (soma 100 em cada Dracma). Aplica UMA vez (marca na nota da configuração): rodar o
-- arquivo de novo não desfaz o que o Owner mudar depois na Mesa › Poço.

INSERT INTO item_defs (key, kind, name, description, rarity, stackable, meta) VALUES
  ('pacote:iniciante', 'pacote', 'Pacote Iniciante',
   'Cinco cartas para começar a montar o baralho, com a chance de uma incomum e, às vezes, uma rara a mais.',
   'incomum', true, '{"pacote": "iniciante"}'),
  ('pacote:intermediario', 'pacote', 'Pacote Intermediário',
   'Nove cartas com uma rara garantida, chance de raras extras e, muito de vez em quando, uma ultra-rara.',
   'raro', true, '{"pacote": "intermediario"}'),
  ('pacote:presente', 'pacote', 'Presente',
   'Um embrulho que o poço devolveu. Só abrindo para saber o que tem dentro.',
   'incomum', true, '{"pacote": "presente", "provisorio": true}')
ON CONFLICT (key) DO NOTHING;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM devo_config WHERE key = 'poco.probabilidades' AND coalesce(note, '') LIKE '%[tabela do dono 23/10]%') THEN
    RETURN;
  END IF;

  INSERT INTO devo_config (key, value, provisional, note) VALUES (
    'poco.probabilidades',
    '{"dracma_comum":   {"lixo": 70, "capsula": 10, "fragmento": 8,  "essencia": 0, "cosmetico": 0},
      "dracma_incomum": {"lixo": 50, "capsula": 15, "fragmento": 15, "essencia": 0, "cosmetico": 4},
      "dracma_rara":    {"lixo": 30, "capsula": 16, "fragmento": 16, "essencia": 0, "cosmetico": 8}}'::jsonb,
    false,
    'Pesos em % (somam 100 com os prêmios do pool de cada Dracma). [tabela do dono 23/10]')
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, provisional = false, note = EXCLUDED.note, updated_at = now();

  INSERT INTO poco_premios (id, tipo, item_key, quantidade, nome, raridade, peso, moedas) VALUES
    ('5e5e0001-0000-4000-8000-000000000001', 'item', 'pacote:presente', 1, 'Presente', 'incomum', 9, '{dracma_comum}'),
    ('5e5e0001-0000-4000-8000-000000000002', 'item', 'pacote:presente', 1, 'Presente', 'incomum', 11, '{dracma_incomum}'),
    ('5e5e0001-0000-4000-8000-000000000003', 'item', 'pacote:presente', 1, 'Presente', 'incomum', 13, '{dracma_rara}'),
    ('5e5e0001-0000-4000-8000-000000000004', 'item', 'pacote:iniciante', 1, 'Pacote Iniciante', 'incomum', 3, '{dracma_comum}'),
    ('5e5e0001-0000-4000-8000-000000000005', 'item', 'pacote:iniciante', 1, 'Pacote Iniciante', 'incomum', 4, '{dracma_incomum}'),
    ('5e5e0001-0000-4000-8000-000000000006', 'item', 'pacote:iniciante', 1, 'Pacote Iniciante', 'incomum', 8, '{dracma_rara}'),
    ('5e5e0001-0000-4000-8000-000000000007', 'item', 'pacote:intermediario', 1, 'Pacote Intermediário', 'raro', 5, '{dracma_rara}'),
    ('5e5e0001-0000-4000-8000-000000000008', 'item', 'grande_fragmento_arcano', 1, 'Grande Fragmento Arcano', 'lendario', 1, '{dracma_incomum}'),
    ('5e5e0001-0000-4000-8000-000000000009', 'item', 'grande_fragmento_arcano', 1, 'Grande Fragmento Arcano', 'lendario', 4, '{dracma_rara}')
  ON CONFLICT (id) DO NOTHING;
END $$;
