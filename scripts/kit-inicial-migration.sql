-- Cartas Iniciais (dono, 22/10): o jogador começa só com o Escudo de Papelão. As cópias de Fósforo, Moeda, Dado e
-- Ampulheta que vieram do kit antigo (origin 'Kit inicial') saem dos saves. As cartas continuam existindo (Comuns)
-- e as cópias ganhas de outro jeito ficam. O servidor (/api/save) e o cliente fazem o mesmo filtro.
-- Idempotente: rodar duas vezes não muda mais nada.
UPDATE player_saves
   SET data = jsonb_set(data, '{inventory}',
         coalesce((SELECT jsonb_agg(e) FROM jsonb_array_elements(data->'inventory') e
                    WHERE NOT (e->>'origin' = 'Kit inicial' AND e->>'cardId' <> 'escudo')), '[]'::jsonb)),
       updated_at = now()
 WHERE jsonb_typeof(data->'inventory') = 'array'
   AND EXISTS (SELECT 1 FROM jsonb_array_elements(data->'inventory') e WHERE e->>'origin' = 'Kit inicial' AND e->>'cardId' <> 'escudo');
