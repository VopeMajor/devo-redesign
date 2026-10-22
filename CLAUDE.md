# DEVO — guia para sessões do Claude Code

RPG textual de sobrevivência com timers (o "Tempo" no pulso). Este repositório é o **redesign premium** do site:
Next.js 16 + React 19 + Tailwind 4, Postgres (Neon) via `pg`, better-auth, deploy no Cloudflare Workers (OpenNext).
Foco em **mobile**; nenhuma função antiga pode se perder. O dono conversa em português simples e quer ver o progresso.

## Regras do dono (sempre valem)

- **Repositório PÚBLICO**: nunca pôr token, senha, chave ou segredo em arquivo, commit, log ou URL.
- Nunca digitar senhas/tokens/credenciais: quem coloca segredos é o dono.
- Não instalar integrações que exijam credenciais, pagamento ou permissões externas sem autorização dele.
- **Nunca mexer na conta ou no plano do Cloudflare** (ele assinou Workers Paid por conta própria).
- Não contornar bloqueios de permissão (ex.: criar convite de owner pelo app foi bloqueado — não insistir).
- Owner e Anfitrião têm acesso liberado a todas as telas, sem restrição.
- Texto literário/narrativo: prosa contida e natural; nada do "padrão de IA" (excesso de símiles, ritmo ofegante).
  Falas que o dono escreve entram **literalmente**.

## Branches e deploy

- `redesign` — principal; o Cloudflare publica dela em https://devo.devorpg.workers.dev.
- `infra/arte` — pedidos de arte (`arte/pedidos/*.json`); cada push gera imagens (workflow `arte.yml`, Workers AI).
  Saída de cada pedido na branch `arte-saida/<id>` (`prancha.png`, `final/<id>--vNN--<lado>.(png|webp)`, `manifest.json`).
- `preview/ajustes` — branch descartável para rodar capturas sem mexer na `redesign`.
- `capturas/<branch>` — screenshots e logs que o CI publica (`typecheck.log`, `*-test.log`, imagens).

## Banco (Neon)

O dono atualiza o banco **à mão** com `scripts/devo-banco-novo.sql` (idempotente). Toda migração nova:
1. vira `scripts/<nome>-migration.sql`;
2. entra em `.github/workflows/capturas.yml`, `scripts/dev/local-db.mjs` e `scripts/dev/gerar-banco-novo.sh`;
3. `bash scripts/dev/gerar-banco-novo.sh` regenera o `devo-banco-novo.sql`;
4. avisar o dono e mandar o arquivo como `devo-atualizar-banco.sql`.
APIs devolvem 503 `{code:'banco_desatualizado'}` quando falta coluna/tabela (PG 42703/42P01/42883).

## CI de capturas (`.github/workflows/capturas.yml`)

- Roda em push; pushes novos na mesma branch **cancelam** o anterior. Execução completa ≈ 1h30–2h.
- `.capture-only` na raiz restringe os grupos (virtudes, poco, apps, torres, narrativa, cosmeticos, sistema, jogos,
  calendario, raridades…). **Apagar antes de fazer merge.**
- O passo "Tipos" usa `|| true`: conferir `typecheck.log` (procurar `error TS`) ou o passo Build.
- Sem `node_modules` local neste ambiente: typecheck/build só no CI.

## Rotina de merge na `redesign`

`git merge` → `git rm -f .capture-only` (se houver) → resolver conflitos → `bash scripts/dev/gerar-banco-novo.sh` →
`git grep -nE "^(<<<<<<<|>>>>>>>) "` (nenhum marcador!) → commit → push → mandar o banco se mudou.

## Arte (pipeline em `infra/arte`)

- Validar pedido: `python3 arte/ferramentas/pedido.py arte/pedidos/<id>.json` (mostra custo em neurônios).
- Modelo das figuras: `@cf/black-forest-labs/flux-2-klein-9b`, 1024×1536, `remover_fundo: true`.
- Exportar Arcano escolhido (rodar no worktree de `infra/arte`):
  `python3 arte/ferramentas/arcanos.py <pasta-da-saida> vNN <chave>` → `public/images/arcanos/<chave>/figura-{768,1024,1536}.webp`,
  `retrato-{256,512,1024}.webp`, `arte.json`. Levar para a `redesign` com `git checkout origin/infra/arte -- <caminho>`.
- O filtro do Workers AI às vezes recusa uma variação ("output has been flagged"): gerar outra seed.

## Sprites dos NPCs

- `scripts/dev/fatiar-npcs.py` fatia folhas 4×3 (RGBA) de `docs/redesign/refs/npc-oc/<npc>.png` em
  `public/images/npc/<id>/<expressao>.webp` (tela 1080×960, cabeça 345 px, queixo em y=508) + `manifest.json`.
  Trocar UMA célula: montar a folha nova só com aquela região e restaurar os outros `.webp` que mudarem por costura.
- `scripts/dev/rostos-npcs.py` mede a janela do rosto de cada expressão → `lib/devo/npc-rostos.json`
  (medalhões redondos, `NpcMedallion`). **Rodar de novo sempre que trocar um sprite.**

## Mapa do código (o que mais se mexe)

- Sistema/telas: `components/devo/os/*` (celular `phone-shell`, desktop `desktop-shell`), sistemas em
  `components/devo/progressao/sistemas.tsx` (flags em `lib/devo/progresso.ts`; Arcanos e Virtudes usam a flag `virtudes`).
- Motor de diálogo: `lib/devo/dialogo/*` (formato, registro de cenas, servidor) + `components/devo/dialogo/*`;
  gatilhos de narrativa em `components/devo/progressao/narrativa-host.tsx`. Doc: `docs/redesign/DIALOGO.md`.
- Recompensas: `lib/devo/recompensas-server.ts` (`deliverIn`); Deadly Vote: `lib/devo/record-server.ts`,
  `components/devo/system/dealer-board.tsx`.
- Poço (gacha): `components/devo/poco/*`, `lib/devo/poco-server.ts`. Torres: `components/devo/torres/*`,
  posições no mapa em `lib/devo/torres/conteudo.json → cenario.pedestais`.
- Áudio sintetizado + trilha (YouTube): `lib/devo/audio.ts`. Save do cliente: `components/devo/state/devo-store.tsx`,
  servidor `lib/devo/save.ts` + `/api/save`.

## Commits

Mensagens em português, descrevendo o que o jogador vê. Terminar com:
```
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Fm5U3bqZz6wpuWL1ksRMyi
```

## Estado em 22/10/2026

Feito e publicado na `redesign` (até 969291c): DV com arcano como recompensa (libera Arcanos/Virtudes), prêmios
individuais múltiplos e recompensa geral; xadrez 10 min por jogador; Poço com ×5/×10/×20 passando pela manivela,
corda com balde e água nova; X para sair da torre no desktop; torres pousadas no chão do mapa; Ajustes sem caixa
de cosméticos; intro sem a estrela de toque e com NPCs nas falas sem figura; medalhões alinhados por expressão;
falas longas rolam dentro da caixa; cena da figura ??? (`lib/devo/dialogo/cenas/figura-devolveu.ts`, para quem
devolveu as Cartas Iniciais, após o 1º Deadly Vote, +5 Dracmas Incomuns); tela de carregamento na entrada e
áudio sem "estouro" ao destravar; sprites novos (riso do Javali, desdém do Herdeiro).

Pendente:
1. **Arcanos no estilo tarô** (alta prioridade do dono): 22 pedidos `arcano-<chave>-tarot` já gerados nas branches
   `arte-saida/arcano-*-tarot`. Esperando o dono escolher a variação de cada um; depois exportar com `arcanos.py`
   e trazer para a `redesign`. O Mago só teve 1 variação (as outras foram barradas pelo filtro) — gerar mais seeds.
2. A última execução das capturas da `redesign` (969291c) foi cancelada por tempo (2h) depois de Tipos e Build
   passarem: rodar de novo (ou só os grupos tocados, via `.capture-only` numa branch de preview) e conferir se a
   tela de carregamento nova não atrasa as primeiras capturas.
3. Entrega final do redesign: zip + PR quando o dono pedir.
