-- Cartas DEVO: raridade Ultra Rara (pedido do dono 17/10) e as duas secretas (Única, Promocional).
-- Ordem: comum < incomum < rara < ultra_rara < lendaria  (+ unica, promocional, acima e fora das recompensas).
-- Fonte das raridades no código: lib/devo/cards.ts (RARITY_META). Idempotente: rodar duas vezes não quebra.
--
-- Até aqui nenhuma tabela restringia a raridade da carta (o servidor sempre grava a raridade de getCard()).
-- Agora o Salão (lotes e Mercado) só aceita as 7 raridades conhecidas. Nenhuma carta muda de raridade.

ALTER TABLE salao_lotes DROP CONSTRAINT IF EXISTS salao_lotes_card_rarity_chk;
ALTER TABLE salao_lotes ADD CONSTRAINT salao_lotes_card_rarity_chk
  CHECK (card_rarity IN ('comum', 'incomum', 'rara', 'ultra_rara', 'lendaria', 'unica', 'promocional'));

ALTER TABLE salao_mercado DROP CONSTRAINT IF EXISTS salao_mercado_card_rarity_chk;
ALTER TABLE salao_mercado ADD CONSTRAINT salao_mercado_card_rarity_chk
  CHECK (card_rarity IN ('comum', 'incomum', 'rara', 'ultra_rara', 'lendaria', 'unica', 'promocional'));

-- Nota da configuração da Bandeja: a escala de raridade mínima agora tem a Ultra Rara (o valor não muda).
UPDATE devo_config
   SET note = 'PROVISÓRIO: raridade mínima das cartas (comum < incomum < rara < ultra_rara < lendaria; unica e promocional acima), vagas por edição, lotes ativos por jogador, lance mínimo e incremento padrão (minutos de Tempo) e Tempo mínimo que o pulso precisa manter depois de pagar.'
 WHERE key = 'salao.bandeja' AND note LIKE '%comum < incomum < rara < lendaria)%';
