# Pedido de arte — Poço dos Milagres (Refinamento 4 §3)

Pedido do agente de Identidade Visual (branch `sys/paleta`).

## Já entregue e em uso

`infra/arte` fd2f966 → `public/images/poco/cena/` (rua de barro, poço milenar com a estela, névoa da boca
`poco-brilho`). Integrada em `components/devo/poco/poco-cena.tsx` (`CenaPintada`), configurada em
`components/devo/poco/poco-pintura.ts` (`POCO_CENA`: base 0.5/0.83, largura 0.56, boca e corda medidas na
arte). O app desenha por cima: luz prata/vinho atrás da pedra, partículas de névoa, balde subindo pela corda,
arco da moeda, respingo, ondas, gotas e as velas acesas.

## Camada extra pedida (opcional, melhora a coerência)

| Arquivo | Tamanho | Fundo | O que contém |
|---|---|---|---|
| `public/images/poco/cena/oferendas-<lado>.webp` (512, 1024) | 1024×256 | transparente | Oferendas no chão, à frente do poço, no mesmo estilo pintado da rua: 2 velas derretidas à esquerda e 1 à direita (cera escorrida, **sem chama**: a chama e o halo são animados pelo app, deixe o pavio no topo de cada vela), uma rosa vinho caída no centro-esquerda com haste e folhas secas, 4–6 moedas antigas espalhadas, uma fita desbotada. Paleta Kokken no Inori; nada de roxo neon nem dourado forte. Junto, um `oferendas.json` com a posição (x, y em fração da imagem) do pavio de cada vela. |

Posição no app: caixa `left:-14%; top:83%; width:90%` do poço (hoje ocupada pelas oferendas vetoriais).
Enquanto ela não chegar, as oferendas vetoriais ficam no lugar.

Camadas opcionais do desenho antigo (`POCO_PINTURA`: fundo/patio/frente/nevoa) só valem para o fallback
vetorial (`POCO_PINTADO = null`) e não precisam mais ser pintadas.
