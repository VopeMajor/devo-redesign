-- Cartas Iniciais e catálogo (dono, 22/10): o jogador começa só com o Escudo de Papelão e, das cartas antigas, só ele fica.
-- As cópias do kit antigo (origin 'Kit inicial') que não são o Escudo saem dos saves; depois, as cartas excluídas saem de
-- todo inventário. O servidor (/api/save) e o cliente fazem o mesmo filtro (lib/devo/cards.ts: semKitAntigo).
-- Idempotente: rodar duas vezes não muda mais nada.
UPDATE player_saves
   SET data = jsonb_set(data, '{inventory}',
         coalesce((SELECT jsonb_agg(e) FROM jsonb_array_elements(data->'inventory') e
                    WHERE NOT (e->>'origin' = 'Kit inicial' AND e->>'cardId' <> 'escudo')), '[]'::jsonb)),
       updated_at = now()
 WHERE jsonb_typeof(data->'inventory') = 'array'
   AND EXISTS (SELECT 1 FROM jsonb_array_elements(data->'inventory') e WHERE e->>'origin' = 'Kit inicial' AND e->>'cardId' <> 'escudo');

-- Catálogo (dono, 22/10): das cartas antigas fica só o Escudo de Papelão. As outras saem dos inventários, das
-- entregas ainda não resgatadas e dos prêmios do Poço (desligados, sem apagar o histórico).
UPDATE player_saves
   SET data = jsonb_set(data, '{inventory}',
         coalesce((SELECT jsonb_agg(e) FROM jsonb_array_elements(data->'inventory') e
                    WHERE NOT (e->>'cardId' = ANY (ARRAY['fosforo','chave','tesoura','moeda','dado','porta','laminas','ampulheta','olho','mascara','cranio','relogio','coracao','coroa','contrato']))), '[]'::jsonb)),
       updated_at = now()
 WHERE jsonb_typeof(data->'inventory') = 'array'
   AND EXISTS (SELECT 1 FROM jsonb_array_elements(data->'inventory') e
                WHERE e->>'cardId' = ANY (ARRAY['fosforo','chave','tesoura','moeda','dado','porta','laminas','ampulheta','olho','mascara','cranio','relogio','coracao','coroa','contrato']));

UPDATE card_deliveries SET claimed_at = now()
 WHERE claimed_at IS NULL
   AND card_id = ANY (ARRAY['fosforo','chave','tesoura','moeda','dado','porta','laminas','ampulheta','olho','mascara','cranio','relogio','coracao','coroa','contrato']);

DO $$ BEGIN
  IF to_regclass('poco_premios') IS NOT NULL THEN
    UPDATE poco_premios SET ativo = false
     WHERE tipo = 'carta' AND ativo
       AND card_id = ANY (ARRAY['fosforo','chave','tesoura','moeda','dado','porta','laminas','ampulheta','olho','mascara','cranio','relogio','coracao','coroa','contrato']);
  END IF;
END $$;
