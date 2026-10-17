# Virtudes (resumo fiel do Google Doc do dono "Cópia de Upgrade Virtudes")

Fonte: https://docs.google.com/document/d/1IZ4cm3L4BMp79RSUj_F9dzeVOpuy7-Ix7J8D3EAQtzs (lido em 16/10; o fim do documento veio truncado na linha do Sol).

- **Seis Virtudes**, representadas por naipes: **Paus** (resistência e vigor), **Ouros** (mente), **Copas** (corpo: força e velocidade), **Espadas** (reflexos e capacidade motora), e as duas antigas, mais vagas: **Escudos** (influência) e **Taças** (domínio sobrenatural). O que cada uma faz exatamente é mistério para o jogador.
- **Pontos de Potencial (P.P.)**: sobem sozinhos com base nos jogos e no que o jogador faz. São uma porcentagem limitada por **Estágio**. Na **Evolução de Estágio** (do Arcano) o corpo "se reconstrói" e os P.P. se distribuem entre as Virtudes; o jogador **não controla** a distribuição.
- **Limite de acúmulo**: cada Estágio tem teto e mínimo, definidos pelo Arcano.
- **Afinidade por Arcano**: cada Arcano tem 1 Virtude excelente, 1 deficiente e 4 neutras. Escala de multiplicadores: ×0,50 · ×0,25 · ×0,15 · ×0,10 · ×0,05 · ×0,015.
- **Regra de apresentação (do dono, em destaque):** "NÃO É PRECISO SE PREOCUPAR COM OS NÚMEROS. ESTE NÃO É UM RPG FOCADO EM POWER SCALING, O BOT É O ÚNICO QUEM CUIDA DESSAS INFORMAÇÕES." → a interface não expõe multiplicadores crus ao jogador; mostra direção/afinidade de forma qualitativa.
- Exemplo do doc: **Morte** — Taças ×0,50 (excelente), Paus ×0,015 (deficiente).
- O doc chama o sistema de "Virtudes (sistema de ATB)" em DIRECAO-2 §4.

## Tabela de ordem de afinidade (1 = maior, 6 = menor), copiada do doc

| Arcano | Paus | Copas | Ouros | Espadas | Taças | Escudos |
|---|---|---|---|---|---|---|
| Louco | 6 | 3 | 4 | 1 | 2 | 5 |
| Mago | 6 | 5 | 2 | 3 | 1 | 4 |
| Sacerdotisa | 6 | 2 | 3 | 5 | 1 | 4 |
| Rainha | 6 | 3 | 4 | 5 | 1 | 2 |
| Rei | 4 | 5 | 6 | 3 | 2 | 1 |
| Papa | 5 | 6 | 3 | 2 | 1 | 4 |
| Amante | 5 | 3 | 4 | 6 | 2 | 1 |
| Carro | 3 | 2 | 5 | 1 | 6 | 4 |
| Força | 2 | 1 | 6 | 3 | 5 | 4 |
| Eremita | 4 | 2 | 1 | 3 | 6 | 5 |
| Fortuna | 4 | 6 | 1 | 5 | 2 | 3 |
| Justiça | 4 | 6 | 2 | 1 | 5 | 3 |
| Enforcado | 1 | 5 | 2 | 6 | 4 | 3 |
| Morte | 6 | 5 | 2 | 3 | 1 | 4 |
| Temperança | 1 | 2 | 3 | 4 | 5 | 6 |
| Diabo | 6 | 1 | 5 | 4 | 2 | 3 |
| Torre | 1 | 2 | 4 | 5 | 6 | 3 |
| Estrela | 4 | 5 | 3 | 6 | 1 | 2 |
| Lua | 6 | 5 | 1 | 4 | 3 | 2 |
| Sol | 4 | 1 | 5 | (truncado) | | |

Observação: as listas por Arcano no corpo do doc às vezes divergem desta tabela (ex.: Lua e Justiça aparecem duas vezes com valores diferentes). **Não decidir sozinho**: guardar os dados em configuração editável (por Owner) e marcar as divergências para o dono confirmar.

## Os vinte e dois Arcanos na tela (pedido do dono, 17/10)

- Lista "Os vinte e dois" na tela das Virtudes. Arcano trancado (não é o do jogador): numeral, nome e uma frase breve, apagado e com cadeado; o servidor só manda `key`, `numeral`, `titulo` e `breve`.
- O Arcano do jogador vem primeiro e expande (Descrição, Fisiologia, Estágios de Evolução). Estágio atual em destaque, anteriores "alcançado", seguintes só com o nome ("Ainda velado"). Owner e Anfitrião abrem todos.
- **Textos são rascunho** (o doc não descreve os Arcanos): `lib/devo/arcanos-textos.ts`, escritos a partir do tarô e da tabela acima (Virtude excelente e deficiente na Fisiologia, sem números). Cinco Estágios por Arcano, como os limites padrão.
- O Owner edita na Mesa › Virtudes › "Textos dos Arcanos" (`POST /api/virtudes { action: 'arcano-texto', arcano, value | null, provisorio? }`, devo_config `virtudes.arcanos`, admin_log `virtudes.arcano_texto`); `null` volta ao rascunho. O selo "Provisório" aparece só para o Owner.

## Arcanos: tela própria (dono, 17/10, refs em docs/redesign/refs/arcanos)

- "Apesar dos arcanos influenciarem nas virtudes, quero telas separadas." Os 22 saíram das Virtudes, que ficam só com a entrada "Seu Arcano → Abrir Arcanos".
- Sistema `arcanos` (components/devo/arcanos/): mesma regra de liberação das Virtudes (flag `virtudes`; Owner/Anfitrião sempre) e o mesmo payload `/api/virtudes` (trancado = numeral, nome e frase breve).
- Vistas: **Mapa** orbital (ref-06), **Galeria** em carrossel com molduras (ref-05/04; trancado em grisalha), **Detalhe** no altar com vitral vermelho e velas (ref-07) com Descrição, Fisiologia e Estágios.
- Figuras pintadas: registro em `lib/devo/arcanos-arte.ts` (`public/images/arcanos/<key>/{figura,retrato,sigilo}-<lado>.webp`); sem arte, o placeholder é o sigilo do Arcano (components/devo/arcanos/sigilos.tsx) na moldura.
