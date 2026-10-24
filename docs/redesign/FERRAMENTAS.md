# DEVO — ferramentas usadas no projeto

Lista do que foi usado para construir o redesign do DEVO e para que serve cada coisa. Atualizado em 24/10/2026.

## 1. O site

| Ferramenta | Para quê |
|---|---|
| **Next.js 16** | Estrutura do site: telas, rotas e APIs (`app/`, `app/api/*`). |
| **React 19** | Os componentes de todas as telas (`components/devo/*`). |
| **TypeScript** | Linguagem do código; o "typecheck" pega erros antes de publicar. |
| **Tailwind CSS 4** | Estilo das telas (cores, tamanhos, layout para celular e desktop). |
| **Base UI** + **shadcn** | Peças de interface acessíveis (diálogos, menus) usadas como base. |
| **lucide-react** | Alguns ícones simples. |
| **SWR** | Busca e atualização dos dados das telas (inventário, Poço, Mesa…). |
| **Three.js** + **React Three Fiber** | Cenas 3D (cenários da interface, tabuleiro vivo do xadrez na Sala de Jogos). |
| **chess.js** | Regras do xadrez nos jogos da Sala. |
| **Google Fonts** (via Next) | Letras: Cinzel, EB Garamond, Cormorant, Almendra, IBM Plex, Oswald, UnifrakturMaguntia. |
| **Áudio sintetizado** (Web Audio) | Efeitos sonoros e som ambiente, sem arquivos de áudio (`lib/devo/audio.ts`). |

## 2. Contas, banco e hospedagem

| Ferramenta | Para quê |
|---|---|
| **better-auth** | Login, cadastro e sessões dos jogadores. |
| **Postgres no Neon** | Banco de dados de produção. O dono atualiza à mão com `scripts/devo-banco-novo.sql`. |
| **pg** (node-postgres) | Conexão do site com o banco. |
| **Drizzle ORM** | Esquema base e notificações (`lib/db`); as consultas dos sistemas do jogo são SQL direto (`lib/devo/*-server.ts`). |
| **Cloudflare Workers** (plano Workers Paid do dono) | Onde o site roda: https://devo.devorpg.workers.dev |
| **OpenNext para Cloudflare** + **Wrangler** | Empacotam o Next.js para rodar no Cloudflare e publicam. |
| **GitHub** | Código, branches (`redesign`, `infra/arte`, `capturas/*`…) e automações. |

## 3. Arte (imagens pintadas)

A arte é feita por um "pipeline" na branch `infra/arte`: escrevo um pedido em texto, o GitHub gera as imagens
sozinho e devolve uma prancha com 3 variações para escolher.

| Ferramenta | Para quê |
|---|---|
| **Cloudflare Workers AI** | Gera as imagens. Modelo principal: **FLUX.2 [klein] 9B** (`@cf/black-forest-labs/flux-2-klein-9b`). |
| **GitHub Actions** (`arte.yml`) | Roda o pipeline a cada pedido novo e publica a saída em `arte-saida/<id>`. |
| **Python** + **Pillow** + **NumPy** + **SciPy** | Recortes, molde, margens, tamanhos finais (`.webp`) e a prancha de comparação. |
| **rembg** | Remove o fundo das figuras (Arcanos, essências, cristais, itens do Poço). |
| Scripts próprios em `arte/ferramentas/` | `pedido.py` (valida o pedido e mostra o custo), `gerar.py`, `processar.py`, `exportar.py`, `arcanos.py`, `resumo.py`. |
| `scripts/dev/fatiar-npcs.py`, `rostos-npcs.py` | Cortam as folhas de expressões dos NPCs e medem o rosto para os medalhões. |
| `scripts/dev/arte-cartas/compor.py` | Monta a arte das cartas do Xadrez (peça pintada sobre o fundo comum). |

Feito com esse pipeline: os 22 Arcanos, as cartas do Xadrez, as capas dos pacotes, as Essências (Galo, Coruja,
Javali, Ruptura, Corvo), os itens e baldes do Poço, as torres e o mapa.

## 4. Testes e capturas de tela

| Ferramenta | Para quê |
|---|---|
| **Playwright** + **Chromium** | Abre o site como um jogador e tira as capturas de tela (celular e desktop). |
| `scripts/dev/capture.mjs` | Roteiro das capturas por grupo (Poço, Torres, Arcanos, Casa…). |
| `scripts/dev/*-test.mjs` | Testes de cada sistema contra o site rodando (Poço, Casa, Torres, Corporações, Staff…). |
| **PostgreSQL 16 local** / **PGlite** | Banco de teste na máquina, igual ao de produção, sem tocar no Neon. |
| **GitHub Actions** (`capturas.yml`) | Roda tipos, build, testes e capturas em cada push e publica em `capturas/<branch>`. |
| `scripts/dev/gerar-banco-novo.sh` | Junta todas as migrações no `devo-banco-novo.sql` que o dono roda no Neon. |

## 5. Assistente (Claude Code)

| Ferramenta | Para quê |
|---|---|
| **Claude Code** (sessões na nuvem) | Escreve o código, roda testes, gera arte pelo pipeline, faz commits e publica quando o dono autoriza. |
| Subagentes | Trabalho em paralelo ou revisão separada (ex.: a revisão rigorosa dos Arcanos). |
| Integração com o GitHub | Ler branches, acompanhar as automações e publicar. |
| Protótipos em HTML + Playwright | As imagens de proposta visual ("DEVO repaginado", "o DEVO como lugar"). |

## Regras que valem para todas as ferramentas

- O repositório é **público**: nenhum token, senha ou chave entra em arquivo, commit ou log.
- Nada que peça credencial, pagamento ou permissão nova é instalado sem o dono autorizar.
- A conta e o plano do Cloudflare são do dono e não são mexidos.
