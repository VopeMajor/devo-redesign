# Pipeline de arte do DEVO (Workers AI → assets prontos)

Responde ao pedido do dono em `ARTE-FERRAMENTAS-dono.md`: as ilustrações (molduras, emblemas, torres) passam a
ser **geradas por modelo de imagem** e só depois tratadas por código (fundo, molde, tamanhos). CSS/SVG ficam
para posicionar e animar.

Por que fora do sandbox: o ambiente dos agentes não tem gerador de imagem nem rede geral. O GitHub Actions tem
rede, e a conta Cloudflare do projeto tem **Workers AI**, que hospeda modelos de imagem e é cobrado por uso
(com franquia diária gratuita). Então a geração roda no Actions, chamando a REST API do Workers AI.

```
arte/pedidos/<id>.json ──push em infra/arte──▶ .github/workflows/arte.yml
   │  valida (pedido.py) → confere o segredo → gera (gerar.py, Workers AI)
   │  → remove fundo (rembg/BiRefNet) → limpa bordas → molde/recorte → 1024–1536 + derivados WebP
   └─▶ branch arte-saida/<id>: prancha.png · final/ · bruto/ · manifest.json · log.txt · README.md
```

## Passo único do dono (uma vez)

1. Cloudflare → **My Profile › API Tokens › Create Token › Create Custom Token**.
   - Permissão: **Account › Workers AI › Read** (Read basta para `ai/run`; Edit também serve).
   - Account Resources: **Include › a conta do DEVO** (6dfd3c2b012ccd4d1e66c60cb72e7e6b).
   - Opcional: TTL e filtro de IP não são necessários.
2. GitHub → repositório `VopeMajor/devo-redesign` → **Settings › Secrets and variables › Actions ›
   New repository secret** → nome `CLOUDFLARE_API_TOKEN`, valor = o token.
3. **Actions › Arte (Workers AI)** → abra a última execução (a que falhou por falta do segredo) → **Re-run all
   jobs**. Ela roda de novo já com o segredo e gera os três pedidos de teste.
   (O botão "Run workflow" só aparece quando o `arte.yml` estiver na branch padrão `main`; até lá, use o
   re-run ou `gh workflow run arte.yml -R VopeMajor/devo-redesign --ref infra/arte -f pedidos=todos`.)

O repositório é público: o token **só** vive no segredo do GitHub. Nunca cole em arquivo, issue ou commit.
O account id não é segredo e está no workflow (pode ser trocado pela variável de repositório
`CLOUDFLARE_ACCOUNT_ID`). Sem o segredo, o workflow falha no passo "Conferir segredo" com a instrução acima.

## Como pedir arte

Crie ou edite `arte/pedidos/<id>.json` na branch `infra/arte` e faça push. Só os pedidos alterados no push
rodam. Para repetir um pedido sem mudar nada: `gh workflow run arte.yml -R VopeMajor/devo-redesign --ref infra/arte
-f pedidos=<id>` (ou mude uma seed e faça push).

```jsonc
{
  "id": "cosm-a-asas-do-crepusculo",       // = nome do arquivo; vira a branch arte-saida/<id>
  "titulo": "Asas do Crepúsculo",
  "tipo": "moldura",                        // moldura | emblema | ilustracao
  "modelo": "@cf/black-forest-labs/flux-2-klein-4b",  // padrão das variações
  "prompt": "Fantasy RPG accessory illustration, painted, highly detailed, isolated on plain background. …",
  "negative": "text, watermark, …",         // só SDXL e Phoenix usam; FLUX ignora (escreva 'No text…' no prompt)
  "largura": 1024, "altura": 1024,          // múltiplos de 16
  "passos": null,                           // flux-2-dev 20–28; klein é fixo em 4 (ignorado)
  "guidance": null,
  "referencias": [],                        // até 4 imagens do repo (FLUX.2) — ver abaixo
  "variacoes": [                            // 1 a 8; cada uma pode trocar seed/modelo/passos/tamanho
    {"seed": 1101}, {"seed": 1102},
    {"seed": 1104, "modelo": "@cf/black-forest-labs/flux-2-dev", "passos": 20, "prompt_extra": "…"}
  ],
  "pos": {
    "remover_fundo": true,
    "modelo_fundo": "birefnet-general",     // cai para isnet-general-use se falhar
    "tamanho_final": 1024,                  // 1024–1536 (lado maior do original)
    "derivados": [512, 256, 96, 48],        // WebP com alfa
    "margem": 0.03,                         // emblema/ilustração: folga em volta da peça
    "molde": {                              // só moldura
      "forma": "circulo", "centro": [0.5, 0.5], "raio": 0.25,   // oval: "raio": [rx, ry]
      "sombra": 0.35, "largura_sombra": 0.045
    }
  }
}
```

`python3 arte/ferramentas/pedido.py arte/pedidos/*.json` valida localmente e estima o custo.

### Como escrever o prompt (o que funcionou melhor com FLUX)

- Comece pelo estilo: `Fantasy RPG accessory illustration, painted, highly detailed, isolated on a plain flat
  <cor> background.` Fundo liso e de cor contrastante com a peça (cinza claro para peças escuras, off-white para
  ouro/vermelho) deixa a remoção de fundo limpa.
- Descreva **materiais e luz** um por um (metal, gema, tecido, pena), a **composição** (o que fica em cima, à
  esquerda, assimetria) e peça margem: `whole object fully inside the image with a generous empty margin`.
- Moldura: peça `a round empty opening in the exact center, about half the width of the image … nothing inside
  the central opening`. O molde corrige o resto.
- Não cite jogos, artistas ou marcas reais. Escreva o que não quer em frases (`No text, no watermark`).
- Explore barato (klein-4b, 4–8 seeds), escolha na prancha, e refaça a escolhida no flux-2-dev ou klein-9b
  com o mesmo prompt.

### Referências de imagem (opcional)

FLUX.2 (dev, klein-4b, klein-9b) aceitam até 4 imagens (`input_image_0…3`, menores que 512×512 — o script
reduz sozinho). Use `"referencias": ["docs/redesign/refs/cosmeticos-2/ref-05.png"]` e cite no prompt
(`in the painting style and material finish of image 0, but with a new design: …`). Use para **estilo e
acabamento**, nunca para copiar a peça: o dono pediu referência de qualidade, não de aparência. Também serve
para iterar: ponha um bruto anterior como referência e peça a mudança.

## O que o pipeline entrega (branch `arte-saida/<id>`)

```
README.md        tabela das variações, avisos, janela do avatar, prompt
prancha.png      grade: bruto · fundo escuro · fundo claro · 96px e 48px (molduras com avatar de teste)
bruto/vNN.png    saída crua do modelo
final/<id>--vNN--<tam>.png|webp   original 1024–1536 (PNG + WebP) e derivados WebP
manifest.json    modelo, seed, passos, neurônios estimados, tempos, janela, bytes por arquivo
geracao.json, log.txt, pedido.json, SOURCE_SHA
```

Baixar: `git clone -q --depth 1 -b arte-saida/<id> https://github.com/VopeMajor/devo-redesign <pasta>`.

### Pós-processamento (arte/ferramentas/processar.py)

1. **Fundo real**: `rembg` com **BiRefNet** (`birefnet-general`, o melhor para detalhe fino — penas, correntes,
   filigrana); se falhar, ISNet (`isnet-general-use`). Os modelos ficam em cache no Actions.
2. **Bordas**: corta o véu de alfa fraco (halo), remove ilhas soltas pequenas, e **descontamina a cor** das
   bordas semitransparentes (tira a cor do fundo misturada: C = (I − (1−α)·fundo)/α).
3. **Moldura**: se o miolo ficou opaco, abre a região da cor do fundo ligada ao centro; detecta a abertura por
   raios a partir do centro, **reencaixa** (escala + translação) para que o aro interno caia na janela alvo
   e aplica a máscara exata (círculo/oval, borda antisserrilhada) com **sombra interna leve** (preto
   translúcido dentro da janela, que escurece a borda do avatar). Avisa se ornamento ficou fora do quadro.
4. **Emblema**: recorte justo + margem, centralizado em quadrado. **Ilustração**: recorte justo, mantém a
   proporção (lado maior = `tamanho_final`).
5. **Tamanhos**: original PNG + WebP (q94, alfa 100) e derivados WebP (q90/92) redimensionados com alfa
   pré-multiplicado (sem franja escura); 96 e 48 recebem nitidez leve.

Nomes: `<id>--v<NN>--<lado>.<ext>`, ex. `cosm-b-coracao-da-condessa--v02--256.webp`.

### Arte importada (feita em outra IA ou por ilustrador)

Ponha o arquivo em `arte/importados/` e crie um pedido com `"importar": "arte/importados/<arquivo>.png"`
(sem prompt/modelo/variações). Não gasta neurônio e roda sem o segredo. Com `"pos": {"fundo": "quadriculado"}`
(padrão para importados) o pipeline trata o **xadrez de "transparência" desenhado** que muitas IAs entregam
em RGB: acha a zona do xadrez (cinzas neutros R≈G≈B claros alternando ~253/~207, janela 19×19), cresce por
pixels de xadrez com textura claro/escuro — inclusive o xadrez visto através de véu rosado pintado — e troca
tudo por cor lisa; o BiRefNet refina o resto. Pixels com cor (gemas, pétalas, correntes) nunca viram fundo, então
peças finas soltas sobrevivem. Ilhas pequenas só somem abaixo de 60 px. Exemplo: `rosa-do-destino-*.json`.

### Formas e tipos extras

- **Moldura quadrada (miniperfil)**: `"molde": {"forma": "quadrado", "lado": 0.547, "raio_canto": 0.04}`
  (abertura 560/1024 com cantos levemente arredondados). O manifest traz `janela.lado_px` e `raio_canto_px`.
- **Balão** (`"tipo": "balao"`, gere 1536×512): além do asset inteiro, mede o **9-slice** (cantos ornamentados
  fixos, bordas esticáveis, centro liso) e monta um **kit**: `kit-corpo` (perfil vertical mediano repetido na
  horizontal — borda uniforme, centro liso para o texto, estica livre) + `kit-ponta-esq`/`kit-ponta-dir`
  (ornamentos das pontas, com 3% de sobra que se funde ao corpo). Medidas em `manifest.json › balao`:
  `nove_fatias` (top/right/bottom/left em px do original, com o `border-image` pronto), `kit.corpo.fatias`,
  `kit.texto` (retângulo do texto). Nos derivados, o número no nome é a largura do balão inteiro e todas as
  medidas escalam por `largura/W`. A prancha mostra as linhas das fatias e o kit montado em duas alturas.
- **Camadas de animação por cor** (`"pos": {"camadas": [{"nome": "gema", "matiz": [340, 15], "sat_min": 0.6,
  "val_min": 0.55, "animacao": "brilho"}]}`): recorta do próprio final só os pixels naquela faixa de cor, no
  mesmo quadro (alinhamento perfeito). O CSS anima opacidade/brilho dessa camada por cima do asset.
  Peças que giram ou balançam (engrenagem, ponteiros, pêndulo) são pedidos próprios (`"tipo": "camada"`,
  quadrado centrado) com a arte escolhida como referência; o encaixe (posição, pivô) fica no manifest da pasta
  pública.
- **Referências fixas** do catálogo ficam em `arte/referencias/` (versões escolhidas pelo dono, ≤508 px).

## Modelos (Workers AI, conferido na doc pública em 16/10/2026)

| modelo | papel no DEVO | custo aprox. 1024×1024 | observações |
|---|---|---|---|
| `@cf/black-forest-labs/flux-2-klein-4b` | **exploração** (padrão) | ~104 neurônios (~$0,001) | 4 passos fixos, rápido, multi-referência |
| `@cf/black-forest-labs/flux-2-klein-9b` | exploração de qualidade | ~1.364 neurônios (~$0,015) | 4 passos fixos, multi-referência |
| `@cf/black-forest-labs/flux-2-dev` | **final** | ~3.000 neurônios a 20 passos (~$0,033) | o mais forte hospedado pela Cloudflare; multipart; até 4 referências |
| `@cf/black-forest-labs/flux-1-schnell` | rascunho | ~96 neurônios | só 1024², até 8 passos, sem referência |
| `@cf/leonardo/lucid-origin` | alternativa de estilo | ~2.900 neurônios | bom em concept art; JSON, sem referência |
| `@cf/leonardo/phoenix-1.0` | alternativa | ~2.400 neurônios | aceita negative_prompt |
| `@cf/stabilityai/stable-diffusion-xl-base-1.0` | img2img simples | — | 1 referência (`strength`), qualidade inferior |

Escolha: **FLUX.2 [dev]** é o de maior qualidade hospedado no Workers AI e aceita imagens de referência
(estilo/iteração), por isso é o modelo de versão final. **FLUX.2 [klein] 4B** custa ~30× menos com a mesma
família e linguagem de prompt — é o padrão para gerar muitas variações e escolher. Klein 9B fica no meio.
O catálogo da Cloudflare também lista modelos "third-party" (FLUX.2 pro/max, FLUX.1 Kontext, Recraft V4),
cobrados por imagem (ex.: FLUX.2 max ~$0,07/MP) e fora da franquia de neurônios; o pipeline ainda não os chama —
ficam como opção se o dono quiser pagar por qualidade máxima.

### Limites e custos

- Franquia: **10.000 neurônios por dia** (Workers Free e Paid). No Free, passou disso a API recusa até o dia
  seguinte (00:00 UTC); no Paid, cobra **$0,011 por 1.000 neurônios**.
- O lote de teste (A, B e torre) custa ~8.550 neurônios: cabe em um dia gratuito. Na prática: ~90 imagens
  klein-4b **ou** ~3 imagens flux-2-dev por dia no gratuito.
- O pipeline estima o custo antes (validação) e registra por variação em `manifest.json`; ao bater o limite,
  pula as variações restantes e publica o que já saiu.
- Tempo: klein ~2–5 s por imagem, dev ~20–40 s; remoção de fundo BiRefNet em CPU ~10–30 s por imagem.

## Como integrar no DEVO

1. Escolha a variação na prancha (ex.: `v02`). Se for refazer no dev, ajuste o pedido e rode de novo.
2. Copie de `final/` para `public/images/cosmeticos/<item-id>/` (ou `public/images/torres/`) com nomes
   estáveis: `moldura-1024.webp`, `moldura-512.webp`, `-256`, `-96`, `-48`. Não suba o PNG nem o bruto.
3. Escolha o tamanho pelo uso: perfil/record 512 (tela retina), miniperfil/inventário 256, chat 96 e 48.
   Use `srcSet` com 2x quando couber (`96` + `256`). `loading="lazy"` fora da primeira dobra.
4. **Moldura**: a janela está no `manifest.json` (`janela.centro_px`, `janela.raio_px`, fração `raio_fracao`).
   O avatar fica **embaixo**, centrado, com diâmetro `2 × raio_fracao × 1,04` do lado da moldura (o aro cobre
   a sobra de 4%). A moldura pode passar do contêiner do avatar: a caixa da moldura = diâmetro do avatar ÷
   (2 × raio_fracao × 1,04). Ex.: raio 0,25 e avatar de 96 px → moldura de ~185 px.
5. **Miniperfil quadrado**: peça uma variante própria (`tipo: moldura`, `molde.forma: oval` ou outro pedido com
   prompt para formato quadrado), não estique a circular — pedido do dono.
6. Animação leve (brilho em gema, pena oscilando) por CSS sobre o asset; nunca para compensar arte fraca.
7. Cache: hoje `public/_headers` só dá cache longo a `/_next/static/*`. Para os assets de arte, acrescente
   `/images/cosmeticos/*` com `Cache-Control: public,max-age=31536000,immutable` e troque o nome do arquivo
   (ex.: sufixo `-v2`) quando a arte mudar.

## Arquivos

- `.github/workflows/arte.yml` — o workflow.
- `arte/ferramentas/pedido.py` — schema, validação e estimativa de custo (só biblioteca padrão).
- `arte/ferramentas/gerar.py` — chamada à REST API (`POST …/accounts/<id>/ai/run/<modelo>`), multipart para
  FLUX.2, JSON para os demais; repete em 429/5xx; para no limite diário.
- `arte/ferramentas/processar.py` — fundo, bordas, molde, tamanhos, prancha, manifest.
- `arte/pedidos/` — pedidos. Primeiros: `cosm-a-asas-do-crepusculo`, `cosm-b-coracao-da-condessa`,
  `torre-principal-agulha`.
