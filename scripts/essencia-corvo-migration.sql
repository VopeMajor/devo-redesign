-- Essência de Afinidade do Corvo (pedido do dono, 23/10). Entra no Poço como as outras essências
-- (meta.poco ausente = no sorteio). Ainda não abre nenhuma torre: o uso fica a definir pelo dono.
INSERT INTO item_defs (key, kind, name, description, rarity, stackable, meta) VALUES
  ('essencia:corvo', 'essencia', 'Essência de Afinidade do Corvo', 'Do Corvo, o Anfitrião encapuzado do Poço. O uso ainda vai ser revelado. (provisório)', 'incomum', true, '{"npc": "corvo", "provisorio": true}')
ON CONFLICT (key) DO NOTHING;
