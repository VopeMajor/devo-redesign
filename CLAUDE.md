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

## Estado em 22/10/2026 (fim do dia)

Publicado na `redesign` em 22/10 (bc986b5); o dono precisa rodar o `devo-banco-novo.sql` no Neon:
- **Casa** (ícone novo, flag `galo_casa`): Confecção de Cartas (`lib/devo/confeccao.ts`, `lib/devo/casa-server.ts`,
  `/api/casa`, `components/devo/casa/*`) e Pacotes (`lib/devo/pacotes.ts`). Mesa › Casa para regras e receitas.
  Texto do dono em `docs/redesign/CASA-CONFECCAO-dono.md`. Custos/esperas/espaços PROVISÓRIOS (`confeccao.regras`).
- **Coleção Xadrez** (7 cartas com Natureza/Arquétipo/Peso) e **peso máximo de cartas** no Deadly Vote.
- **Home**: um relógio só (barra de cima); o quadro grande virou anúncios (`/api/anuncios`, Mesa › Anúncios +
  eventos do Calendário dos próximos 14 dias).
- **Arcanos**: Estágios 0..VII pagos com Fragmentos pelo próprio jogador, vários Arcanos por jogador (Grande
  Fragmento Arcano), texto literal da Força (`docs/redesign/ARCANOS-forca-dono.md`), Força = XI e Justiça = VIII.
- **Jogos**: menos travamentos (xadrez, Blefe, Memory Rush, Bomba Quente, sincronização das salas).
- Migrações novas: `scripts/casa-migration.sql`, `scripts/arcanos-estagios-migration.sql`.
- Teste local: há Postgres 16 em `/usr/lib/postgresql/16/bin` (initdb/pg_ctl como usuário `postgres`, dados fora de
  /tmp) e `node_modules` instala com `pnpm install`; os `scripts/dev/*-test.mjs` rodam contra `next dev`.

Pendente:
1. Prêmio "Arcano": o narrador indica três opções, um Anfitrião aprova e o jogador escolhe (`arcano_escolhas`).
   Artes do tarô dos 22 Arcanos já estão na `redesign`.
2. Força: o texto do dono não tem o Estágio IV e o VII ("Tirano") só tem o nome.
3. Molde de Xadrez sem visual; cartas antigas sem peso usam o padrão por raridade (`PESO_PADRAO`).
4. Sugestão do agente dos jogos (não feita): `session.cookieCache` no better-auth cortaria uma consulta por
   requisição nas salas online (mexe em autenticação: pedir ao dono).
