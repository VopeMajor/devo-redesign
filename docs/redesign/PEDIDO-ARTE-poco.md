# Pedido de arte — cena pintada do Poço dos Milagres (Refinamento 4 §3)

Pedido do agente de Identidade Visual (branch `sys/paleta`). A cena já aceita estas camadas sem mexer em
código: basta salvar o arquivo em `public/images/poco/` e preencher o caminho em
`components/devo/poco/poco-pintura.ts`. Enquanto o caminho estiver vazio, a cena usa o desenho vetorial
atual (nenhum pedido de imagem inexistente, console limpo).

O mecanismo do poço (estrutura, base, balde, roda, anel, aura) **continua** nas camadas que já existem
(`estrutura.webp`, `base.webp`, `balde-*.webp`, `roda.webp`): elas são alinhadas ao balde e à corrente
que se movem. Este pedido é do **ambiente** em volta.

## Direção

- Roteiro (DIALOGOS-casa-galo-poco-melissa-dono.txt): região enevoada da cidade, casas antigas e simples,
  rua de barro, e no fim dela um poço milenar com uma placa dizendo que foi construído há pelo menos
  500 anos. "O que cai não volta. Nunca desça para buscar."
- O poço tem história: pedra gasta e lascada, musgo seco nas juntas, inscrição meio apagada, oferendas
  deixadas por quem veio antes (velas derretidas, uma rosa vinho caída, moedas que ninguém ousou buscar,
  fitas desbotadas amarradas numa estaca).
- Paleta do Refinamento 4 (`refs/paleta/kokken-no-inori.jpg`): abismo `#090909`, vinho `#280e11`/`#3f1117`,
  pedra de névoa `#353535`, prata apagada `#acacac`. Luz da boca do poço = prata fria com fundo vinho.
  **Sem roxo neon, sem dourado intenso.** Velas: luz quente bem baixa (âmbar apagado), só ao redor da chama.
- Qualidade de referência: mapa pintado das Torres e as artes dos Cosméticos (pintura, profundidade, luz
  direcionada), mas com identidade própria: aqui é rua, barro, névoa e pedra — não arquitetura gótica.
- Celular primeiro: legível a 390×844 e 360×740. Nada de texto legível pintado (o texto é do app).

## Camadas

| Chave em `poco-pintura.ts` | Arquivo sugerido | Tamanho | Fundo | O que contém |
|---|---|---|---|---|
| `fundo` | `public/images/poco/cena-fundo.webp` | 1080×1920 (retrato) | opaco | Céu de neblina com a lua velada (canto superior direito), casas antigas em silhueta com 1–2 janelas fracamente acesas, a rua de barro em perspectiva com sulcos de roda e poças que refletem a lua. **Sem o poço.** O ponto de fuga da rua fica no centro horizontal, a ~47% da altura (é onde o poço é colocado). Recorte `object-cover` ancorado embaixo: deixe 10% de margem segura nas laterais. |
| `patio` | `public/images/poco/cena-patio.webp` | 1360×680 | transparente | Pátio de lajes de pedra gasta em elipse ao redor da base do poço (vista levemente de cima), rachaduras, musgo seco, poeira de barro nas bordas, e a **estela dos 500 anos** à esquerda (lápide de pedra lascada com um "D" romano e linhas gastas). O centro da elipse fica no centro horizontal da imagem, a ~30% da altura; o miolo (onde entra a base do poço, ~37% da largura) pode ficar vazio ou escuro. Posicionada em `left:-35%; top:70%; width:170%` do palco do poço (palco = 400×500). |
| `frente` | `public/images/poco/cena-oferendas.webp` | 960×200 | transparente | Oferendas no chão, à frente da base: 2 velas à esquerda e 1 à direita (derretidas, cera escorrida, **sem chama** — a chama é animada pelo app), uma rosa vinho caída no centro-esquerda com haste e folhas secas, 4–6 moedas antigas espalhadas, uma fita desbotada. Posicionada em `left:-10%; top:84%; width:120%` do palco. |
| `nevoa` | `public/images/poco/cena-nevoa.webp` | 1600×500 | transparente | Faixa de névoa baixa, prata apagada, densidade irregular, bordas esfumadas; precisa repetir bem nas laterais (ela deriva 6% para os lados). |

Formato: WebP com qualidade ~82, alfa onde indicado. Peso alvo: `fundo` ≤ 260 KB, as outras ≤ 140 KB.

## Depois de entregar

1. Salvar os arquivos em `public/images/poco/`.
2. Preencher `POCO_PINTURA` em `components/devo/poco/poco-pintura.ts`, por exemplo
   `{ fundo: '/images/poco/cena-fundo.webp', patio: '/images/poco/cena-patio.webp', ... }`.
3. Rodar as capturas do grupo `poco` (`poco-04-neblina-rua`, `poco-11-tela`, `poco-15-moeda-caindo`).
