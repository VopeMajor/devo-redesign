# DEVO — mapa de telas e funções

Next.js 16 (App Router) + React 19 + Tailwind 4 + Three.js/R3F. Uma única rota (`app/page.tsx`) que
renderiza `DevoExperience`. Estado do jogador em `components/devo/state/devo-store.tsx` (reducer +
save no servidor via `/api/save`). Banco: Postgres (Neon em produção; banco de teste no CI).
Mobile é a prioridade: abaixo de 1024px o sistema é um "smartphone" (`PhoneShell`); acima, uma
área de trabalho com janelas (`DesktopShell`). As duas leem o mesmo registro de apps (`os/apps.tsx`).

Identidade atual a PRESERVAR: nome DEVO / DEADLY VOTE · Record System, o sigilo (estrela de quatro
pontas com órbita e olho), o relógio de 72h no pulso, paleta preto + azul-cobalto (#1647ff/#315dff)
com vermelho de alerta (#d51f2b) e "papel claro" (`.dv-light`) no Record, tipografia serifada
(Cormorant / Cinzel / EB Garamond) com mono (IBM Plex Mono) para números e sistema.

## Fluxo principal (fases em `devo-experience.tsx`)

| Fase | Tela | Arquivos | Funções que não podem quebrar |
|---|---|---|---|
| landing | Tela inicial: sigilo, "DEADLY VOTE", relógio 71:59:59, **Começar**, **Continuar**, som | `landing/landing-screen.tsx`, `shared/atmosphere.tsx`, `system/logo.tsx`, `system/symbol.tsx`, `menu-button.tsx`, `ornaments.tsx` | Começar → sempre pede convite; Continuar → login se sem conta, prólogo se sem sessão, senão sistema; sair da conta |
| (overlay) | Acesso: convite → cadastro (nome, senha, confirmação) ou login | `naming/access-screen.tsx` | ids `#devo-code #devo-user #devo-pass #devo-pass2`; convite de uso único; validações; mensagens de erro |
| (overlay) | Cortina de transição ("Despertando", "Reconectando", "Saindo", "Deadly Vote", "Inicializando DEVO") | `devo-experience.tsx` | duração ~1.8s, bloqueia cliques duplos |
| intro (prólogo) | Prólogo narrado: voz, Melissa, cenários (mina, crianças, morte…), escolhas, perfil | `intro/prologue-screen.tsx`, `intro/prologue-stage.tsx`, `lib/devo/prologue-script.ts`, `intro/cel-fire.tsx` | avançar por toque/Enter/Espaço, escolhas, "Pular prólogo", som |
| intro (tutorial) | Tutorial do Deadly Vote (texto + visuais) | `intro/intro-screen.tsx`, `intro/tutorial-visuals.tsx`, `lib/devo/intro-script.ts` | avançar, pular |
| os | Sistema (smartphone) | `os/phone-shell.tsx`, `os/app-icon.tsx`, `os/app-glyphs.tsx`, `os/notifications.tsx`, `os/use-devo-engine.ts` | barra de status com relógio do pulso, cartão "Tempo restante", grade de apps, dock, central de avisos, toasts, voltar (botão físico do Android via `use-back-handler.tsx`) |
| os (overlays) | Oferta de PWA (Anfitrião), revelação da Sala de Jogos | `shared/pwa-offer.tsx`, `arcade/arcade-unlock.tsx`, `arcade/javali-intro.tsx` | instalar app, notificações push, "Depois" |

## Apps (registro em `os/apps.tsx`)

| App | O que faz | Arquivos |
|---|---|---|
| **Record** | Ficha do jogador (foto, ID, status, arcano, tempo de vida, cartas/trocas/avisos, Shuffler), convocações de Deadly Vote (inscrever-se), histórico público, painel do gerente/dealer/admin (convites, resultados), cartas e Card Shuffler | `apps/record-app.tsx`, `system/record-file.tsx`, `system/deadly-vote-history.tsx`, `system/invite-panel.tsx`, `system/manager-alert.tsx`, `system/photo-picker.tsx`, `system/primitives.tsx`, `system/use-deadly-votes.ts`, `shared/deck-panel.tsx`, `lib/devo/record-server.ts`, `lib/devo/invites-server.ts`, `lib/devo/deadly-votes.ts` |
| **Pulso** | Anel do tempo restante, estado Estável/Crítico, barras, estatísticas, regras | `apps/pulso-app.tsx` |
| **Mensagens** | Conversas com NPCs (Rato/Anfitrião, Herdeiro, desconhecido, Coruja), escolhas de diálogo, área "Jogadores" (bloqueada) | `apps/mensagens-app.tsx`, `lib/devo/npcs.ts`, `apps/app-ui.tsx` |
| **Cartas** | Inventário, filtro por raridade, detalhe da carta (frente/verso), coleções, Coruja ensina as cartas | `apps/cartas-app.tsx`, `shared/devo-card.tsx`, `apps/coruja-intro.tsx`, `apps/coruja-sprite.tsx`, `lib/devo/cards.ts` |
| **Sala de Trocas** | Corredor com 8 salas (condições), troca às cegas com parceiro simulado (chat, aceitar, revelar) | `apps/trocas-app.tsx`, `lib/devo/trade-bots.ts`, reducer `TRADE_*` |
| **Ajustes** | Som, PWA/notificações, sistema, limpar avisos, tela inicial, reiniciar sessão | `apps/ajustes-app.tsx`, `shared/pwa-panel.tsx`, `shared/sound-toggle.tsx` |
| **Sala de Jogos** | Abas Mesa / Agenda / Ranking / Apostas; status (tempo, score, posição, reset); cartaz "Próxima partida" com contagem; cards dos 4 jogos (Jogar = fila online, Tutorial = bot); confronto em destaque; ranking da semana; apostas em Tempo; chat; perfil; fila "Procurando oponente"; partida ao vivo | `apps/jogos-app.tsx`, `arcade/mesa.tsx`, `arcade/mini-profile.tsx`, `arcade/arcade-chat.tsx`, `arcade/live-match.tsx`, `arcade/game-hud.tsx`, `arcade/use-room.ts`, `arcade/game-loader.tsx`, `lib/devo/arcade/*`, `app/api/arcade/route.ts` |

## Jogos (`components/devo/arcade/games/`)

| Jogo | Arquivos | Notas |
|---|---|---|
| Memory Rush | `memory-rush.tsx` | 2 jogadores, mesmo tabuleiro, fases 10/8/6/4 pares, +100/−50, combo, avisos de pressão; tutorial contra bot |
| Living Chess | `quick-chess.tsx`, `chess/living-board.tsx`, `chess/units.tsx`, `chess/pieces3d.ts`, `chess/titan-pieces.ts`, `chess/marble.ts`, `chess/clock-backdrop.tsx`, `chess/versus-bar.tsx`, `lib/devo/arcade/chess-themes.ts` | Three.js; relógio 30s +2s; capturas viram combate |
| Bomba Quente | `hot-bomb.tsx` | Three.js; joystick no celular, paisagem; 3 pontos |
| Blefe | `bluff.tsx`, `bluff.css`, `lib/devo/arcade/bluff.ts` | cartas e blefe |

Servidor dos jogos/salas: `lib/devo/arcade/server.ts`, `rooms.ts`, `client.ts`, `games.ts`.

## Ativos visuais

`public/images/` — `background.png` (catedral), `card-back.png`, `cards/*` (artes de tipo), `arcade/*`
(banners dos jogos), `chess/*`, `npc/*`, `prologue/*`, `stickers/*`. Vídeos em `public/videos`.

**Arte de terceiros que precisa sair** (bug do teste): `npc/melissa-*.png` (personagem de outro jogo),
`npc/javali*.webp` e `npc/king-dice.png` (personagem de outro jogo). Também de terceiros e devem ser
trocados: `npc/heir-v3-*.png` (Herdeiro). A substituição deve ser arte ORIGINAL (SVG/Three.js feito à mão
no projeto), mantendo o nome, o papel e a personalidade do NPC.

## Captura e teste

- CI: `.github/workflows/capturas.yml` — Postgres de teste (`scripts/dev/*.sql`), build, servidor,
  roteiro `scripts/dev/capture.mjs` (390×844 @2x), publica em `capturas/<branch>`.
- `.capture-only` (na raiz, opcional) restringe grupos: `novato,sistema,apps,jogos,partidas,desktop`.
  **Remover antes de mesclar.**
- Convites de teste: `DEVO-TEST-0001…0004`, admin `DEVO-TEST-ADM1`.
