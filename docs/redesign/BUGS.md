# Bugs do teste — diagnóstico inicial

Lista do dono do projeto, com o que já foi encontrado no código. Quem corrigir deve confirmar a
causa, corrigir na origem (uma fonte da verdade) e anotar aqui o que mudou.

1. **Raridades e coleções inconsistentes.** O sistema usa Comum/Incomum/Rara/Lendária
   (`lib/devo/cards.ts` → `RARITY_META`), mas a aula da Coruja (`apps/coruja-intro.tsx`, `RARITY_TIERS`)
   ensina Comum/Rara/Muito Rara/Ultra-Rara, com cores trocadas. As coleções (`ARCANA_COLLECTIONS`,
   `getCardMeta`) também aparecem com numeração diferente em lugares diferentes (Record mostra "01/…"
   em todas as cartas). Unificar nomes, cores, ordem e numeração a partir de `cards.ts`.
2. **Barra de espaço pulando etapas.** Handlers globais de Enter/Espaço em `intro/prologue-screen.tsx`,
   `intro/intro-screen.tsx`, `apps/coruja-intro.tsx`: com um botão focado, Espaço dispara o clique nativo
   E o avanço; segurar a tecla repete (`e.repeat`). Criar um hook único que ignora repetição, alvos
   interativos (button/input/textarea/select/contenteditable) e aplica um intervalo mínimo.
3. **Relógio do pulso** (`apps/pulso-app.tsx`). `ratio` passa de 1 quando o jogador tem mais de 72h
   (anel quebra); ponteiro de segundos sem continuidade; "Jogos" fixo em 0. Revisar contra a barra de
   status e o cartão da home (mesma fonte de tempo, mesmo formato).
4. **Botão "Reiniciar sessão"** (Ajustes e menu do desktop). O texto promete "apaga o inventário e
   devolve o pulso a 72 horas", mas `restart` abre a tela de convite (pede código novo). Fazer o que o
   texto diz, com confirmação explícita, e salvar.
5. **Bot do tutorial do Memory Rush rápido demais** (`arcade/games/memory-rush.tsx`, efeito do bot,
   `botSkill`). No tutorial o bot deve ser didático: bem mais lento, errando de propósito no começo.
6. **Placar diferente no resultado.** O placar exibido durante a partida diverge do placar da tela de
   resultado/servidor (`arcade/live-match.tsx`, `arcade/game-hud.tsx`, `lib/devo/arcade/server.ts`
   `submit`/pontos). Garantir uma única conta de pontos.
7. **Shuffler "Adormecido" vs "Dormente".** `system/record-file.tsx` usa "Adormecido";
   `shared/deck-panel.tsx` usa "Dormente". Padronizar ("Dormente") e usar a mesma fonte de estado.
8. **Regras das salas de troca.** Cada sala mostra uma condição ("Às cegas", "Mesma raridade",
   "Sem retorno", "Chat liberado"), mas nenhuma muda o comportamento, e o Protocolo diz coisas que
   contradizem algumas. Fazer cada condição valer de verdade e explicar a regra da sala ao entrar.
9. **Living Chess "Em breve" com botão ativo.** No card da Mesa aparece "Em breve" (do próximo evento)
   ao lado de "Jogar" habilitado (fila casual). Deixar claro o que é evento agendado e o que é partida
   livre; se o jogo estiver `em-breve` no registro, o botão deve ficar desabilitado.
10. **Contas de teste no ranking.** Contas criadas para teste aparecem no ranking. Criar uma marca de
    conta de teste (ex.: `players.is_test`, papel ou convite com nota de teste) e excluí-las de ranking,
    apostas e prêmios. Migração SQL nova em `scripts/`.
11. **Sprites com arte de outros jogos (Melissa e Javali).** Ver `MAPA.md` → Ativos. Substituir por arte
    original desenhada no projeto (SVG/Three.js), mantendo nome, papel e expressões usadas no código.
