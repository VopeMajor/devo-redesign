# Plano: levar o DEVO v2 do protótipo para o jogo

Pedido do dono (07/11/2026): "quando acabar atualize o site" → "Levar o v2 ao jogo" → "vou aguardar a publicação".

## Situação

- O v2 existe como **protótipo estático** em `docs/redesign/v2/kit3`: cerca de 17 mil linhas em HTML/JS, mais de 30
  telas, arte própria (`kit3/art`, 53 MB) e dados de exemplo. Não fala com o servidor nem com o banco.
- O **jogo** é o aplicativo Next.js publicado da `redesign` em devo.devorpg.workers.dev, com servidor, banco (Neon),
  login e todas as funções que já existem (`components/devo/*`, `lib/devo/*`, `/api/*`).
- Regra do projeto: **nenhuma função antiga pode se perder**. Então não dá para "trocar" o site pelo protótipo. Cada
  tela do jogo é refeita com o visual e o comportamento do protótipo, por cima dos dados e das regras que já existem.
- Algumas coisas do v2 **não existem no jogo** e precisam de servidor e banco novos: aparência do avatar e chibi,
  Casa em RPG Maker, Catedral e rituais, visitas (Simon), Conflito, Ranking, Moderação. Cada uma vira uma migração
  `scripts/<nome>-migration.sql`, que o dono roda no Neon.

## Etapas

Cada etapa sai numa branch própria, passa pelas capturas do CI, você aprova as telas, e só então entra na
`redesign` e vai ao ar. O site nunca fica quebrado no meio: o que não foi passado continua com o visual atual.

1. **Base visual.** Fontes, cores, molduras, ícones, sons e a casca do sistema (celular e computador) no estilo v2.
   A arte do kit3 vai para `public/images/v2`. Nenhuma função muda.
2. **Sistema do celular, apps que já existem.** Record, Mensagens, Cartas, Inventário, Trocas, Ajustes, Calendário,
   Pulso. Visual novo, mesmas funções. Em duas ou três levas.
3. **Apps grandes que já existem.** Poço, Salão, Jogos (Blefe, Bomba Quente, Memory Rush, Xadrez 3D),
   Corporações, Arcanos, Virtudes, Deadly Vote e Mesa.
4. **Site público e entrada.** A página de fora, a tela de entrada e a home.
5. **Avatar e chibi.** Criação de personagem com corpo, roupa, cabelo, rosto e cores (salvo no servidor), o busto e o
   chibi fofo em peças. Migração nova (aparência).
6. **Casa em RPG Maker.** Mapa com o chibi andando, andares, mesa de confecção (a Casa de hoje passa para dentro do
   mapa), motor de diálogo novo (retrato grande nas conversas longas, chibi e rostinho nas curtas) e a visita do
   Simon. Migração nova (visitas).
7. **Torres e Catedral.** Torres em pixel com Galo, Coruja e Javali; Catedral com o Erick e os rituais. Migração
   nova (rituais).
8. **Sistemas novos.** Conflito (Companhia × Ordem), Ranking e Moderação. Migrações novas.

## O que falta decidir antes de cada etapa

- **Etapas 1 a 4:** nada; só aprovar as telas.
- **Etapa 6:** o conteúdo das visitas curtas do Simon (hoje só a primeira visita existe).
- **Etapa 7:** o texto do Estágio IV e do VII ("Tirano") da Força, e o NPC da Torre da Ruptura ("???").
- **Etapa 8:** o tipo de Karma, a penalidade da troca de lado e as cenas dos Marcos (pendências anotadas no PEDIDO-V2).

## Tamanho

É o trabalho de várias sessões. Cada etapa leva de algumas horas a um dia de trabalho, mais a espera do CI de
capturas (1h30 a 2h por rodada). As etapas 1 a 4 podem andar em paralelo, em sessões separadas, porque mexem em
telas diferentes.
