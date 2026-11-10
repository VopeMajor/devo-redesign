-- Catedral de Damasco (DEVO v2, parte da etapa 7 do docs/redesign/v2/PLANO-PUBLICACAO.md): o destino "Igreja" do
-- "Sair de casa". Dono, 09/11: "trazer a catedral e todo o conteudo gerado". Textos literais do Rup
-- (docs/redesign/v2/NOTAS-RUP-02-11.md, itens 9, 10 e 11).
-- Depende de scripts/fundacao-migration.sql (players, item_defs, devo_item_*) e de scripts/casa-mapa-migration.sql
-- (casa_visitas: a descoberta da Catedral fica gravada lá, com npc = 'catedral').
-- Idempotente: rodar duas vezes não quebra nem duplica.

-- ---------------------------------------------------------------------------------------------
-- 1. Oferendas do altar (descrições literais do Rup). Quem descobre a Catedral recebe uma vez
--    2 Arroz Branco, 1 Tambor Antigo, 1 Flauta de Osso e 1 Máscara Xamã (PROVISÓRIO: o Rup ainda não disse
--    de onde vêm as oferendas; é o estoque inicial do protótipo).
-- ---------------------------------------------------------------------------------------------
INSERT INTO item_defs (key, kind, name, description, rarity, stackable, meta) VALUES
  ('oferenda:arroz', 'outro', 'Arroz Branco',
   'Arroz fresquinho, ainda dentro do pacote. Despeje-o sobre si mesmo para atrair boa sorte.',
   'comum', true, '{"origem": "catedral", "oferenda": true}'),
  ('oferenda:tambor', 'outro', 'Tambor Antigo',
   'Um antigo tambor tribal. Bata nele com força até que se quebre, atraindo energias poderosas.',
   'comum', true, '{"origem": "catedral", "oferenda": true}'),
  ('oferenda:flauta', 'outro', 'Flauta de Osso',
   'Uma flauta confeccionada com os ossos de alguém. Toque uma melodia de olhos fechados e aguarde para descobrir o que os espíritos reservaram para você.',
   'comum', true, '{"origem": "catedral", "oferenda": true}'),
  ('oferenda:mascara', 'outro', 'Máscara Xamã',
   'A antiga máscara de madeira de um mestre da feitiçaria. Dance enquanto a utiliza e, antes de quebrá-la, pronuncie seu nome em voz alta para tornar possível o impossível.',
   'comum', true, '{"origem": "catedral", "oferenda": true}')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------------------------
-- 2. Rituais no altar: cada oferenda queimada e o que saiu (sorteado no servidor, com as probabilidades do Rup).
--    resultado: 'Nada' ou o nome da bênção/maldição. Os efeitos das bênçãos e maldições ainda NÃO mexem no Tempo,
--    na Confecção, no Deadly Vote nem na afinidade (fica para quando o dono confirmar); o registro já guarda quando
--    cada uma começou, para aplicar depois.
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS catedral_rituais (
  id bigserial PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  oferenda text NOT NULL CHECK (oferenda IN ('arroz', 'tambor', 'flauta', 'mascara')),
  resultado text NOT NULL CHECK (char_length(resultado) BETWEEN 1 AND 60),
  forcado boolean NOT NULL DEFAULT false,
  em timestamptz NOT NULL DEFAULT now(),
  idem_key text NOT NULL UNIQUE
);
CREATE INDEX IF NOT EXISTS catedral_rituais_player_idx ON catedral_rituais (player_id, em DESC);
