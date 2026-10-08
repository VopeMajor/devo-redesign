# Brief comum dos agentes de área

Você refaz UMA área do DEVO com acabamento premium, seguindo a identidade já pronta.
Escreva textos, comentários e docs em português do Brasil.

## Leitura obrigatória antes de codar
1. `docs/redesign/IDENTIDADE.md` — o guia que você segue à risca (tokens, kit, movimento, som, cenas 3D).
2. `docs/redesign/MAPA.md` — funções da sua área que NÃO podem quebrar.
3. `docs/redesign/RUBRICA.md` — como o crítico vai te avaliar.
4. `docs/redesign/BUGS.md` — correções já feitas; não desfaça nenhuma.
5. `components/devo/kit/index.ts` e a vitrine `app/estilo/` — use os componentes do kit.
6. As capturas atuais da sua área (rodada base) em `/home/claude/shots-base` (veja com Read) e as
   referências em `docs/redesign/refs/`.

## Regras
- Preserve todas as funções, textos de regras, fluxos e nomes acessíveis (texto de botões, aria-label,
  ids) — o roteiro `scripts/dev/capture.mjs` depende deles. Se precisar mudar um nome, atualize o roteiro
  no mesmo commit. Pode ACRESCENTAR passos de captura no fim do bloco da sua área.
- Mobile primeiro (390×844). Desktop (≥1024px) não pode quebrar.
- Use o kit (`components/devo/kit`). NÃO edite `app/globals.css`, `app/layout.tsx` nem arquivos do kit —
  outros agentes trabalham em paralelo. Se faltar algo, crie um componente local na sua área e cite no
  relatório final como candidato ao kit.
- Não toque em arquivos de outras áreas (lista no seu prompt). Arquivos compartilhados só se o prompt
  disser que são seus.
- Three.js: use `<SceneBackdrop preset=... />` do kit. Cena própria só se a área pedir, seguindo o
  orçamento de desempenho do IDENTIDADE.md (DPR ≤ 1.5, pausa oculta, fallback estático, reduced motion).
- Nada de copiar telas, personagens, logos, ícones ou composições reconhecíveis de Persona 5 Royal,
  Danganronpa V3 ou Honkai: Star Rail. Elas são referência de qualidade, não de aparência.
- Sem dependências novas.

## Ambiente (importante)
- Sem npm local: nada de `pnpm install`/`next build`/`tsc` aqui. O GitHub Actions builda, tipa e captura.
- Fluxo: commits pequenos → `git push -u origin <sua-branch>` → espere o workflow "Capturas mobile"
  (`gh run list -R VopeMajor/devo-redesign -b <sua-branch> -L 1`, ~6–12 min) → capturas e logs
  (build.log, typecheck.log, capture.log, server.log, manifest.json) na branch `capturas/<sua-branch>`:
  `git clone -q --depth 1 -b capturas/<sua-branch> https://github.com/VopeMajor/devo-redesign <pasta>`
  (depois `git -C <pasta> fetch -q --depth 1 origin capturas/<sua-branch> && git -C <pasta> reset -q --hard FETCH_HEAD`;
  confira `SOURCE_SHA`). Logs/artefatos do Actions não são acessíveis. Em HTTP 429 do git, espere 10s e tente 1 vez.
- `.capture-only` na raiz restringe os grupos do roteiro (novato, sistema, apps, jogos, partidas,
  desktop, estilo). Use o do seu prompt. NÃO remova nem altere o `.capture-only` no fim (o coordenador cuida).
- Critérios de "pronto" a cada rodada: `typecheck.log` com 0 "error TS", build ok, `manifest.json` sem
  `pageerror` e sem erro novo de etapa, capturas da área revisadas por você com Read contra a RUBRICA.
- Commits terminam com:
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01Fm5U3bqZz6wpuWL1ksRMyi

## Ciclo com o crítico
Quando você terminar uma rodada, responda com o relatório curto abaixo. Um crítico separado vai avaliar
suas capturas; o coordenador vai te mandar as correções. Aplique TODAS, empurre, espere o CI, confira e
responda de novo com o mesmo relatório.

## Relatório (resposta final de cada rodada, curto)
- Branch, último commit, pasta local com as capturas desse commit (SOURCE_SHA conferido).
- Lista das capturas da sua área (nomes) que o crítico deve olhar.
- O que mudou (bullets), funções preservadas conferidas, limitações, candidatos ao kit.

## Convites de teste por conta do roteiro
0001 Aurora (novato) · 0002 Rival · 0003 Visitante · 0004 Convidado · 0005 Mesa (desktop) · ADM1 Veterano · 0006–0009 livres (reserve aqui antes de usar).
