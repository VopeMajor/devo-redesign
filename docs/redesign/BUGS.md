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


---

# Correções (branch `fix/bugs`)

Cada item: causa confirmada no código → mudança → arquivos.

### 1. Raridades e coleções
- **Causa:** a aula da Coruja tinha sua própria lista (`RARITY_TIERS`: Comum/Rara/Muito Rara/Ultra-Rara) com a cor de
  `incomum` chamada de "Rara" e a de `rara` chamada de "Muito Rara"; coleções de exemplo inventadas (Zodíaco etc.) e
  numeração fixa ("07", "№ 004.218"). O "01/20" do Record/Cartas era o `CountLabel` (cópias/limite), lido como numeração.
- **Mudança:** `RARITY_META` ganhou `plural`; novos `RARITIES`, `getCollections()` e `getCardMeta()` com `orderLabel`
  ("02/04") e `serial` ("№ 007"). A Coruja monta falas, pedras, quiz (alvo = Rara), coleções e o exemplo de numeração a
  partir disso. `CountLabel` agora mostra "× 2 cópias". O detalhe da carta mostra coleção · ordem · série.
- **Arquivos:** `lib/devo/cards.ts`, `components/devo/apps/coruja-intro.tsx`, `components/devo/shared/deck-panel.tsx`,
  `components/devo/apps/cartas-app.tsx`.

### 2. Espaço/Enter pulando etapas
- **Causa:** três `keydown` globais avançavam mesmo com um botão focado (o Espaço clicava o botão E avançava) e com tecla
  segurada (`e.repeat`).
- **Mudança:** hook único `useAdvanceKeys` (ignora repetição, alvos interativos e modificadores; intervalo mínimo de 250 ms;
  setas opcionais). Usado no prólogo, no tutorial e na Coruja.
- **Arquivos:** `components/devo/hooks.ts`, `intro/prologue-screen.tsx`, `intro/intro-screen.tsx`, `apps/coruja-intro.tsx`.

### 3. Relógio do pulso
- **Causa:** `ratio = remaining / 72h` sem limite (anel "dava a volta" acima de 72h); ponteiro calculado do segundo inteiro
  com transição CSS (saltava e voltava a cada minuto); "Jogos" era o literal `0`.
- **Mudança:** `lib/devo/pulse.ts` (constantes, `pulseRemaining`, `pulseRing` com excedente) usado pelo Pulso, barra de
  status (celular e desktop) e store. Anel limitado a 1 + arco dourado externo para o que passa de 72h; ponteiro contínuo
  por `requestAnimationFrame`; "Jogos" lê partidas reais concluídas (`/api/arcade?view=stats`, sem treino).
- **Arquivos:** `lib/devo/pulse.ts`, `apps/pulso-app.tsx`, `os/phone-shell.tsx`, `os/desktop-shell.tsx`,
  `state/devo-store.tsx`, `lib/devo/arcade/server.ts` (`getPlayerStats`), `app/api/arcade/route.ts`, `lib/devo/arcade/client.ts`.

### 4. Reiniciar sessão
- **Causa:** `restart` era o mesmo `start` da landing (pede convite novo).
- **Mudança:** ação `RESTART_SESSION` no store (cartas → kit inicial, trocas e avisos zerados, pulso → 72h; mantém conta,
  conversas e tutoriais vistos) e `restartSession()` que grava no servidor na hora. Em Ajustes, confirmação em dois passos
  ("Reiniciar sessão" → "Sim, reiniciar") com o que será perdido e o resultado do salvamento. No desktop, o menu abre Ajustes.
- **A revisar com o dono:** isso permite "resetar" o tempo (quem está com 2h volta a 72h quando quiser) e pode ser
  explorado. Decisão de design pendente (limitar frequência, custo, ou só pedir confirmação do Anfitrião).
- **Arquivos:** `state/devo-store.tsx`, `apps/ajustes-app.tsx`, `os/devo-os.tsx`, `os/os-nav.tsx`, `os/desktop-shell.tsx`.

### 5. Bot do tutorial do Memory Rush
- **Causa:** intervalo `2600 − skill·1300` ms e acerto `0,42 + skill·0,38` (rating 1000 → ~2,3 s e 52%).
- **Mudança:** primeira jogada aos 5 s; intervalo de ~5,5 s caindo até no mínimo ~3,5 s; as 3 primeiras tentativas sempre
  erram (as duas cartas viradas ficam à mostra ~1 s, com aviso "−50"); depois o acerto sobe 5% por tentativa até 55%.
- **Arquivos:** `arcade/games/memory-rush.tsx`.

### 6. Placar diferente no resultado
- **Causa:** (a) o HUD mostrava o placar bruto (podia ficar negativo), o servidor gravava `max(0, …)` → números diferentes
  ao fim; (b) o resultado somava um "Bônus" de combo que não existia em lugar nenhum do servidor; (c) "Score" no cabeçalho
  e na tela final eram coisas diferentes: `arcade_matches.score` (placar) vs `points` / `arcade_week_scores.score`
  (pontos de ranking, outra fórmula).
- **Mudança:** erro não deixa o placar abaixo de zero (`memoryAfterMiss`, mesma regra no servidor e no tutorial); HUD mostra
  exatamente o número gravado; bônus fantasma removido. Fórmula de pontos de ranking só em `rankingPoints()` (games.ts).
  Tela final: "Seu placar", "Placar do oponente", "Pontos de ranking (+N)" e a regra escrita; cabeçalho "Pontos".
- **Arquivos:** `lib/devo/arcade/games.ts`, `lib/devo/arcade/rooms.ts`, `lib/devo/arcade/server.ts`,
  `arcade/games/memory-rush.tsx`, `apps/jogos-app.tsx`.

### 7. Shuffler "Adormecido" × "Dormente"
- **Mudança:** `lib/devo/shuffler.ts` (`SHUFFLER_LABEL`, `shufflerStatus`) — Dormente / Desperto / Embaralhando /
  Sincronia completa — usado no Record e no Card Shuffler; ambos leem `state.arcadeUnlocked`.
- **Arquivos:** `lib/devo/shuffler.ts`, `system/record-file.tsx`, `apps/record-app.tsx`, `shared/deck-panel.tsx`.

### 8. Regras das salas de troca
- **Causa:** a condição era só um texto; o parceiro sempre trazia carta da mesma raridade, só "Silêncio" bloqueava o chat, e o
  Protocolo dizia "a raridade é a mesma" e "as cartas voltam aos donos" (contradiz "Às cegas" e "Sem retorno").
- **Mudança:** `lib/devo/trade-rooms.ts` com as regras de cada sala: **Às cegas** (raridade qualquer, nenhuma raridade
  na mesa), **Mesma raridade** (garantida igual, comportamento antigo), **Sem retorno** (sair depois de pôr a carta perde a
  carta, com confirmação), **Chat liberado** (chat livre; nas outras, frases prontas), **Silêncio** (sem chat, mesma
  raridade). Faixa com a regra ao entrar; Protocolo reescrito com regras gerais.
- **Arquivos:** `lib/devo/trade-rooms.ts`, `lib/devo/types.ts`, `state/devo-store.tsx`, `os/use-devo-engine.ts`,
  `apps/trocas-app.tsx`.

### 9. Living Chess "Em breve" com Jogar ativo
- **Causa:** o "Em breve" era o status do evento agendado (inscrições ainda não abertas), mostrado colado ao "Jogar" da fila
  casual.
- **Mudança:** o card separa "Próximo evento" (data + status de inscrição) de "Partida livre"; `status: 'em-breve'` no
  registro desabilita Jogar e Tutorial, e o servidor recusa fila/tutorial desse jogo.
- **Arquivos:** `arcade/mesa.tsx`, `lib/devo/arcade/rooms.ts`, `lib/devo/arcade/server.ts`.

### 10. Contas de teste no ranking
- **Mudança:** migração `scripts/test-accounts-migration.sql` (`players.is_test`, `invite_codes.is_test`; SQL para marcar e
  desmarcar no topo do arquivo). Cadastro com convite de teste já cria conta de teste; o admin marca "Conta de teste" ao
  gerar convite. Ficam de fora: ranking geral e por jogo, prêmios semanais, confrontos e odds nas apostas (e o destaque da
  Mesa, que lê as apostas). Seed: contas do roteiro continuam normais; `QA_Teste` (pontos altíssimos) não aparece no ranking.
- **Marcar uma conta existente:** `UPDATE players SET is_test = true WHERE lower(name) = lower('Nome');`
- **Arquivos:** `scripts/test-accounts-migration.sql`, `lib/auth.ts`, `lib/devo/arcade/server.ts`, `lib/devo/invites-server.ts`,
  `system/invite-panel.tsx`, `scripts/dev/90-seed.sql`, `.github/workflows/capturas.yml`.
- **Rodar no Neon** depois de `auth-migration.sql`.

### 11. Sprites de terceiros
- **Mudança:** removidos `npc/melissa-*.png`, `npc/javali*.webp`, `npc/king-dice.png`, `npc/heir-v3-*.png` e
  `arcade/javali-host.tsx` (sem uso). Arte original em SVG como componentes: `components/devo/npc-art/` —
  Melissa (neutral/soft/serious; uniforme da Companhia de Despertados com mantelete e broche do olho), Javali
  (poses table/point/door + piscadela, com cenário; homem de smoking com máscara de javali em bronze) e Herdeiro
  (neutral/smirk; casaca de veludo, plastrom cobalto). `NpcDef.art` aceita componente; prólogo, tutorial, Mensagens,
  Mesa e apresentação do Javali usam os componentes. A apresentação do Javali trocou o lilás por ouro/cobalto.
- **Arquivos:** `components/devo/npc-art/*`, `lib/devo/npcs.ts`, `intro/prologue-stage.tsx`, `intro/intro-screen.tsx`,
  `apps/mensagens-app.tsx`, `arcade/javali-intro.tsx`, `arcade/mesa.tsx`, `apps/jogos-app.tsx`.

### Roteiro de captura
- O prólogo nunca passava da primeira escolha (o roteiro procurava "Escolhas de diálogo", o prólogo usa "Escolha o que
  dizer"). Corrigido; novos passos: salas de troca (Às cegas e Sem retorno), Reiniciar sessão, conta "Visitante" para a
  aula da Coruja, a apresentação do Javali e o retrato do Herdeiro.
