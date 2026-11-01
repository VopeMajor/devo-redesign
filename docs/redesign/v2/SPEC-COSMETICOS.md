# DEVO v2 — Cosméticos (redesign)

Versão de 01/11/2026, rodada 2 (depois da crítica nota 6). Base: pedido do dono para o v2 (`PEDIDO-V2-dono.md`, "também refaça os cosméticos. quero tudo
Melhor e mais bonito"), o texto do dono sobre os cosméticos (`docs/redesign/COSMETICOS-REFORMULACAO-dono.md`, que
continua valendo inteiro), `BIBLIA.md` §3, §5, §7 e §12 e as refs 09, 11, 17, 18, 19 e 20.

Mockups: `kit2/cosmeticos.html` (seis telas, `?tela=`) → `kit2/cosmeticos.png` (Espelho),
`kit2/cosmeticos-material.png` (Lendário × Arcano, escada de placas, 48/24 px, emblemas em traço),
`kit2/cosmeticos-album.png` (álbum por série), `kit2/cosmeticos-revelacao.png` (revelação em 3D, proposta),
`kit2/cosmeticos-cena.png` (chat, Deadly Vote, Casa) e `kit2/cosmeticos-camadas.png` (prévia 2.5D, duas etapas,
tamanhos). Render: `node docs/redesign/v2/kit2/src/render-cosmeticos.cjs [tela]` com `python3 -m http.server 8767` na
raiz do repositório (o Three.js vem de `node_modules/three`). Arte nova em `kit2/src/img/cos2/`, gerada no pipeline
(`infra/arte`, pedidos `v2-cos2-*`); pedidos e variação escolhida em `cosmeticos/PROMPTS.json`.

**O que mudou na rodada 2:** a Última Badalada foi refeita em cristal para cumprir a regra do Arcano; três molduras
deixaram de ser redondas (gaiola, arco ogival, asas); cada raridade ganhou uma placa pintada; Comum e Incomum passaram
a ser pintados; no nível Lista a raridade se lê pela forma; o vitral virou pintura; o Espelho foi limpo (três notas,
peça no pedestal, medalhões em arco); balão pintado ao lado do vetorial; tabuleiro de mármore e porta da Casa pintados;
Casulo redesenhado; álbum por série, procedência e revelação em 3D (propostas); prompts sem "circular frame".

---

## 0. Limites que este redesign respeita

- **Lógica intocada.** O texto do dono (§12) diz: "Não altere a lógica existente de raridades, inventário,
  equipagem, Poço ou recompensas durante essa revisão artística." Os seis espaços, as chaves `cosmetico:*`, a posse,
  o equipar no servidor, o Selo automático do Anfitrião e o `Visual` público ficam como estão. O que muda é desenho,
  arte e onde cada peça aparece. As duas mudanças de dados propostas (§6.3) são opcionais e só acrescentam campos.
- **Uma peça de cada vez.** O dono pediu (§12): "Primeiro, escolha uma moldura e um emblema para demonstrar a nova
  direção artística [...] Aguarde minha avaliação antes de reformular o catálogo inteiro." A dupla de demonstração no kit2
  é a moldura **Última Badalada** (Arcano, refeita em cristal na rodada 2: `kit2/src/img/cos2/badalada-janela.webp`)
  e o emblema **Coração da Condessa** (Lendário). Ao lado, para comparação, o **Banquete do Javali** (Lendário,
  gaiola): Lendário e Arcano lado a lado em `cosmeticos-material.png`. A primeira Badalada (bronze e ouro, de
  `kit2/src/img/v2/badalada.webp`) fica aposentada: pelo material ela se lia como Lendário. Este documento descreve o sistema inteiro para a aprovação ser de uma vez só, mas o catálogo só é
  refeito depois do sim do dono.
- **Sem CSS no lugar de ilustração** (texto do dono, §8). Moldura, emblema e ornamento de balão são arte pintada.
  CSS e SVG ficam para aro de raridade, posicionamento, luz, partícula e movimento.
- **Nomes e descrições dos itens são literais** (catálogo em `scripts/cosmeticos-migration.sql`). Nada foi
  renomeado. Nome novo de item é proposta e vem marcado.
- **Nada de pixel.** Cosmético é do sistema (BIBLIA §2): gótico ametista, mármore, metal, vidro. Mesmo dentro da
  Casa (que é VN), o cosmético aparece pintado.
- **Nome da tela (harmonização de 01/11).** "Espelho" já era, na `SPEC-AVATAR.md` e na `SPEC-CASA.md`, o objeto do
  Quarto que reabre a criação do avatar. Para não haver duas coisas com o mesmo nome, a tela de perfil desta spec
  (peça no pedestal, cartão inclinado, medalhões) passa a se chamar **Vitrine**, como na `BIBLIA.md` §12, e a grade
  continua **Coleção**. Onde abaixo se lê "Espelho" como tela, leia "Vitrine". Proposta padrão; o dono decide o nome
  (PENDENTE 5).

---

## 1. O que existe hoje

Código: `lib/devo/cosmeticos.ts` (tipos, leitura de `meta`, `IMAGENS_CATALOGO`), `lib/devo/cosmeticos-server.ts`
(catálogo, posse, equipar, painel do Owner, recompensas semanais), `components/devo/cosmeticos/*` (Coleção,
Identidade, nome, admin, arte em SVG em `art/`, `cosmeticos.css` com as animações dentro de `.cos-anim`).
Onde aparece hoje: Record (`apps/record-app.tsx`), miniperfil e chat das salas (`arcade/mini-profile.tsx`,
`arcade-chat.tsx`, `sala-tabs.tsx`, `mesa.tsx`) e resultado do Poço (`poco/poco-resultado.tsx`).

| Espaço (`categoria`) | No catálogo | Como é desenhado hoje | Problema visual |
|---|---|---|---|
| Moldura do avatar (`moldura_avatar`) | 11: Herança de Marfim, Relógio do Fim, Pacto Carmesim, Olho do Arcano, Banquete do Javali, Asas da Coruja, Fortuna do Rato, Última Badalada, Asas do Crepúsculo, Catedral Esquecida, Relicário de Marfim | Arte pintada do pipeline (`public/images/cosmeticos/<id>/moldura-*.webp`, 48 a 1024 px), janela redonda medida, algumas com camadas animadas (sino, gema). Sobra o SVG antigo em `art/moldura/*` | Quase todas são **um aro redondo com enfeite**. Silhueta parecida entre elas, a raridade não aparece no material. A Badalada foi refeita em cristal (§3.1) |
| Moldura do miniperfil (`moldura_mini`) | 11, uma para cada moldura | Arte pintada quadrada (`mini-*.webp`), janela quadrada de 54,7% | Funciona; em 48 px o ornamento vira ruído |
| Emblema (`emblema`) | 14 (o Selo do Anfitrião é automático) | Arte pintada (`emblema-*.webp`), algumas com camada (íris, gema, luz) | Mistura de escalas e estilos (carta chapada, ficha de cassino, pena solta). Poucos parecem joia |
| Balão de chat (`balao`) | 10: 5 pintados em 9-slice (Correspondência Real, Confissão Carmesim, Ecos do Arcano, Último Suspiro, Mesa do Destino) e 5 provisórios em cor (Cinza Fumaça, Aço Champanhe, Véu de Ametista, Tinta de Vinho, Ouro Velho) | 9-slice com cantos fixos; provisórios com `meta.balao` (fundo, borda, texto, filete) | Retângulo com borda. Ornamento espalhado pela borda inteira |
| Estilo do nome (`efeito`) | 13 (Assinatura Noturna, Brasa Carmesim, Geada de Prata e 10 `nome-*`) | Fonte + até 3 cores + efeito de lista fixa (`FONTES_NOME`, `EFEITOS_NOME`) | Bom sistema; visual de "efeito de Discord", com neon e fliperama que fogem da paleta |
| Borda do perfil (`borda`) | 7: Aço Escovado, Veludo Carmesim, Névoa do Cemitério, Vitral da Capela, Brasas, Constelação, Círculo Arcano | CSS (`ESTILOS_BORDA`) com cores, ou arte com `img:` | Desenho em CSS; é o fundo do cartão do Record e do miniperfil, mas parece moldura de div |

Raridades: Comum, Incomum, Raro, Épico, Lendário, Arcano (`RARIDADES`). Cores em `RARIDADE_PADRAO` (provisórias,
"sem neon"). Animação desligável (`useAnimarCosmeticos`).

---

## 2. A ideia central: raridade é material

Hoje a raridade é uma cor de etiqueta. No v2 ela é **do que a peça é feita e o quanto ela se mexe**. Um jogador
reconhece um Lendário de longe pelo ouro velho e pela luz que atravessa a joia, sem ler nada. É a resposta direta
ao texto do dono: "Um emblema lendário deve transmitir exclusividade pelo seu acabamento, não apenas por possuir uma
cor diferente."

Cores da BIBLIA §3 (proposta, já usadas no kit2), aplicadas às seis raridades dos cosméticos:

| Raridade | Material base | Cor | Acabamento | Placa de fundo (§2.1) | Forma na Lista (§2.2) | Movimento (só com animação ligada) | Ref |
|---|---|---|---|---|---|---|---|
| **Comum** | Pedra, ferro fosco | `#a8a39a` | Fosco, entalhe raso, sem gema | Pedra lisa e fosca | Anel liso | Nenhum | — |
| **Incomum** | Jade fosco, bronze | `#7fa38f` | Um filete polido, um reflexo | Pedra escura com veio de jade | Anel com um entalhe e uma gema | Reflexo que passa a cada ~9 s | — |
| **Raro** | Prata clara e safira | `#7f9fe0` | Gravação fina, estrelas de 4 pontas cravadas | Vidro azul com poeira de estrela | Quatro estrelas nas diagonais | Gemas cintilam (uma por vez) | 17, 18 |
| **Épico** | Orquídea, renda, prata envelhecida | `#b98bd6` | Tecido, flor, corrente | Veludo orquídea com renda | Pingente embaixo | **Uma peça que balança** (pingente, fita, pena) + poeira leve | 11 |
| **Lendário** | Ouro velho, pérola, rubi | `#d9b86a` | Gaiola, coroa, veludo bordado, metal gasto nos cantos | Veludo escuro com bordado de ouro | Coroa em cima | Luz atravessa a joia, poeira dourada, peça que balança | 11, 19 |
| **Arcano** | Cristal iridescente, mecanismo de relógio | champanhe com reflexo ametista, safira e rosa | Cristal, engrenagem à vista, ponteiro, cartas flutuando | Céu de vidro com mostrador | Anel duplo com órbita | **Objeto 3D** na vitrine e na revelação (§5b), camadas 2.5D no resto, engrenagem gira, cartas em órbita | 09, 20 |

Regras:
- O ouro só aparece em Lendário e no detalhe de Arcano (BIBLIA §3: "Ouro só aparece como raridade Lendária").
- **Todas as raridades são pintadas**, inclusive Comum e Incomum (uma peça só, material fosco, sem enfeite:
  `cos2/comum.webp`, `cos2/incomum.webp`). Um Comum bonito é o que faz alguém começar a colecionar. O aro em SVG fica só
  para o modo econômico e para o nível Lista (§2.2).
- O teste da regra é visual: em `cosmeticos-material.png`, Lendário (gaiola de ouro velho sobre veludo bordado) e
  Arcano (torre de cristal com o mecanismo à vista, sobre o céu de vidro) têm que se distinguir sem ler nada.
- Cada raridade tem no máximo **um** tipo de movimento a mais que a anterior. Animação nunca disfarça desenho
  simples (texto do dono, §9).
- Com animação desligada, cada peça para no quadro mais bonito (sino no ponto de repouso, reflexo no meio da gema).

### 2.1 Placa por raridade

Além do aro, cada raridade tem uma **placa de fundo pintada** (`cos2/placa-<raridade>.webp`, 1024², pipeline). A placa
vai atrás da peça no card da coleção, na vitrine, no álbum, nos medalhões do Espelho e na revelação. É ela que segura a
raridade quando a peça fica pequena ou escura. Na falta de uma peça (álbum), a placa aparece dessaturada e a peça vira
silhueta.

### 2.2 Nível Lista: a forma diz a raridade

Em 48 px e menos não sobra material, então a raridade passa para a **forma** do aro, desenhado em código: Comum anel
liso; Incomum anel com um entalhe e uma gema; Raro quatro estrelas nas diagonais; Épico pingente embaixo; Lendário
coroa em cima; Arcano anel duplo com órbita. A cor continua, mas não é ela que decide. Conferido em captura a 48 e a
24 px (`cosmeticos-material.png`, faixa "Na lista, a forma fala").

---

## 3. Novo desenho de cada tipo

### 3.1 Moldura do avatar

**Forma.** Cada moldura tem **silhueta própria**. O aro redondo vira só a janela; o que define a peça é o que está
em volta: gaiola (ref-11), mostrador (ref-09/20), asas, arco de capela, ramos. Os elementos podem passar do quadrado
da imagem por cima e por baixo (o texto do dono, §4: "asas podem se projetar lateralmente, correntes podem ficar
suspensas"). A janela continua livre para o rosto.

**Grade da peça** (para todo pedido de arte): três formatos, conforme a silhueta. Alta (1024×1536: torre, gaiola,
arco ogival), larga (1536×1024: asas, ramos) ou quadrada (1024²: aro simples, Comum e Incomum). O prompt descreve a
**forma** ("birdcage dome", "pointed gothic arch", "wings extending far beyond the frame", "gothic clock tower") e
nunca "circular frame"; a janela aparece como "a round opening ... left completely empty". A janela não precisa estar
no centro: é medida em cada arte (preenchimento a partir do miolo) e gravada em `meta.imagem.janela` (já existe).
Exemplo: na Badalada nova a janela fica em x 0,37, y 0,45, raio 0,17 da largura.

**O que cada uma vira** (proposta de direção; nomes e descrições ficam os do catálogo):

| Moldura | Raridade | Direção nova |
|---|---|---|
| Última Badalada | Arcano | **Refeita na rodada 2**: torre gótica de cristal iridescente, mecanismo de engrenagens visível dentro do aro, ponteiro que atravessa a janela e sai da peça, sino e pêndulo, três cartas em órbita (ref-20). Versão 3D em `kit2/src/cos3d.js` |
| Olho do Arcano | Lendário | Olho no alto vira um broche separado, agulhas de ametista em leque, glifos gravados |
| Banquete do Javali | Lendário | **Feita**: gaiola de ouro velho em cúpula (ref-11), presas de javali subindo dos lados da janela, estandarte de veludo azul, cartas e fichas penduradas (`cos2/banquete.webp`) |
| Asas do Crepúsculo | Lendário | **Feita**: asa negra e asa prateada abertas muito além do quadro, coração carmesim no alto, correntes com gotas (`cos2/asas.webp`). No Deadly Vote é ela que dá a silhueta de quem fala |
| Relógio do Fim | Épico | Mostrador quebrado em arco sobre o rosto, pêndulo que balança |
| Pacto Carmesim | Épico | Espinhos de ferro, rosas cor de vinho e um cadeado que balança |
| Catedral Esquecida | Épico | **Feita**: arco ogival de pedra escura e prata gasta, rosácea no alto, colunas, orquídeas na base, sem ouro; a janela é o vão do arco (`cos2/catedral.webp`) |
| Herança de Marfim | Raro | Prata clara, camafeu no alto, pérolas; estrelas de safira nas diagonais |
| Relicário de Marfim | Raro | Relicário que abre: duas meias-tampas laterais (estática; abre só na vitrine) |
| Asas da Coruja | Raro | Penas de prata e lua crescente; uma pena cai na vitrine |
| Fortuna do Rato | Incomum | Hoje pintada; passa a aro de bronze em código + o dado como única peça pintada pequena |

### 3.2 Moldura do miniperfil

Não é a moldura redonda recortada (texto do dono, §5). É um **brasão quadrado**: janela quadrada de cantos
levemente arredondados (`raio_canto` já existe), e a identidade da moldura reorganizada em **dois pontos fortes**:
a crista no alto e um pingente ou fita embaixo. As laterais ficam finas, porque o mini aparece colado em texto.
Em 48 px só sobra o aro de raridade (§4.1).

### 3.3 Emblema

**Forma.** Broche de luxo (texto do dono §6; refs 17 e 18 para a silhueta, 19 para o objeto). Três partes sempre:
**pino** (laço, fita, argola), **joia** (cristal, gema, mostrador, carta) e **pingente** (gotas, correntes, estrela).
A silhueta tem que ler em 18 px; por isso cada emblema tem uma versão de traço claro (família refs 17/18) usada abaixo
de 32 px, desenhada em SVG a partir da arte. Exemplos:

- **Coração da Condessa** (Lendário): o modelo. Laço de seda, coração facetado, gotas de rubi.
- **Fragmento Celestial** (Arcano): cristal alto preso por duas asas pequenas, um anel orbitando, mostrador na base
  (ref-20). Pintado na rodada 2 (`cos2/fragmento.webp`).
- **Ás de Espadas** e **Ficha do Javali** (Comum): param de ser uma carta e uma ficha chapadas; viram a carta presa
  num clipe de ferro e a ficha numa argola. Ainda simples, mas objeto.
- **Engrenagem do Herdeiro** (Épico): engrenagem gira devagar dentro de uma moldura de orquídea.

**Versões de traço** (refs 17 e 18) já desenhadas para três emblemas, em 26, 22 e 18 px: Coração da Condessa, Fragmento
Celestial e Ás de Espadas (`cosmeticos-material.png`, última faixa). A silhueta se lê nos três tamanhos.

**Item em duas etapas** (ref-19): um emblema ou moldura pode ter dois estados, fechado e aberto (`cos2/casulo-1` →
`cos2/casulo-2`). O estado aberto é outra imagem na mesma chave. Na rodada 2 a raridade proposta é **Épico**, então a
peça é de prata envelhecida, renda e orquídea, sem ouro. Fechado: casulo de pétalas de prata e renda, com uma fresta de
luz lilás e um mostrador pequeno na base. Aberto: as pétalas se abrem e dentro está uma boneca de porcelana de vestido
de renda segurando um relógio de cristal aceso. **PENDENTE DO DONO:** o que abre a peça (fim de evento, número de
vitórias, outra coisa), a raridade e o nome ("Casulo do Crepúsculo" é proposta).

### 3.4 Balão de chat

**Centro limpo, ornamento nas pontas** (texto do dono §10). O balão novo tem:
- corpo liso em veludo, papel ou vidro, conforme a raridade;
- **volutas de filigrana só nos dois cantos de cima**, um broche pequeno no meio da borda de cima e uma gema no canto
  de baixo à direita;
- rabicho do lado do autor.

No app ele é 9-slice (o que o código atual já faz). A rodada 2 mostra o ganho lado a lado no chat
(`cosmeticos-cena.png`): **Correspondência Real pintada** (papel de carta com borda rasgada, filigrana só nos cantos de
cima, rabicho, `cos2/balao-correspondencia-9.webp` em `border-image`) e a mesma ideia em vetor logo abaixo. O lacre fica
numa camada à parte (`cos2/balao-selo.webp`) para não deformar quando o balão estica. Pintado do Raro para cima; SVG
para Comum e Incomum e como modo econômico. **PENDENTE:** a descrição literal do item diz "filigrana de ouro", mas ele
é Raro e a regra guarda o ouro para o Lendário. Na arte a filigrana saiu em dourado pálido e prata; o dono decide. Os cinco balões
provisórios em cor ganham cantos pintados por raridade e mantêm as cores do catálogo. Texto nunca abaixo de 13,5 px.

### 3.5 Estilo do nome

Continua sendo fonte + cores + efeito de listas fixas (nada de CSS livre, regra do servidor). O que muda:
- **Fontes** passam a ser as da BIBLIA §4 (Bodoni Moda, Cormorant, Cinzel, EB Garamond) mais as atuais. A `pixel` e o
  efeito `neon` ficam só para itens que já existem (Fliperama, Letreiro de Sangue); nenhum item novo usa.
- **Efeitos novos propostos:** `aurora` (gradiente iridescente que corre devagar, Lendário/Arcano), `gravado` (letra
  com sombra sólida deslocada de 2 px na cor da raridade, como os títulos do kit2), `tinta` (o nome aparece da
  esquerda para a direita quando o miniperfil abre). São só chaves novas em `EFEITOS_NOME`.
- O nome com efeito animado só se mexe no Record, no miniperfil e no assento em foco do Deadly Vote (regra atual de
  `EFEITOS_NOME_ANIMADOS`).

### 3.6 Borda do perfil → fundo do perfil

Na prática a "borda" é o **fundo do cartão** do Record e do miniperfil. No v2 ela vira uma **pintura de fundo**
(o Vitral da Capela já está pintado: rosácea com chumbo, feixes de luz colorida, poeira, mármore negro, `cos2/vitral.webp`)
(paisagem 1536×1024) com uma regra de composição: o lado esquerdo tem a imagem forte (rosácea, brasas, constelação),
o lado direito fica escuro e calmo, porque é onde entram nome e números. Um filete champanhe duplo fecha o cartão.
Movimento por raridade: o vitral "respira" (a luz sobe e desce), brasas sobem, névoa passa. Os estilos em CSS atuais
viram o modo econômico (aparelho fraco ou dados móveis).

O rótulo "Borda do perfil" é literal do código. Trocar para "Fundo do perfil" é **PROPOSTA**: decide o dono.

---

## 4. Onde cada cosmético aparece

### 4.1 Tamanhos (nível de detalhe)

A mesma moldura não pode ter o mesmo desenho em 1024 e em 48 px. Quatro níveis (`kit2/cosmeticos-camadas.png`,
fila de baixo):

| Nível | Lado | Onde | O que entra |
|---|---|---|---|
| Perfil | 512 a 1024 | Espelho, Record, vitrine, resultado do Poço | Arte inteira + camadas (§5) + movimento |
| Mesa | 256 | Assentos do Deadly Vote, ficha de Confidente do jogador, listas grandes | Arte inteira, sem peças soltas |
| Chat | 96 | Chat, miniperfil, convocação | A **moldura mini** (quadrada), sem movimento |
| Lista | 48 | Rankings, listas longas, avatar na barra de cima | **Só o aro de raridade** em código, com a forma da §2.2 (entalhe, estrelas, pingente, coroa, órbita), sem ornamento |

### 4.2 Perfil: o Espelho (`kit2/cosmeticos.png`)

A Identidade vira uma tela chamada **Espelho** (nome proposto). É o Record visto "por fora". Composição em diagonal:
cartão no alto à direita, peça no pedestal embaixo à esquerda, ligados por um feixe de luz.
- A **moldura** equipada fica **em cima de um pedestal de mármore negro** (Three.js, `cos3d.js → arcanoCristal` com a
  pintura no lugar da peça 3D), com o retrato do jogador na janela. O pedestal recebe a peça; não fica vazio.
- O **cartão do perfil** fica inclinado em 3D, com espessura de metal na lateral. Fundo = o fundo equipado (Vitral).
  Nome com o estilo equipado, Vitórias e Mesas, e o **balão** equipado dentro do cartão.
- O **emblema** fica pendurado na quina de cima por uma fita: é o broche do cartão.
- Os **seis medalhões** formam um arco que abraça a base do pedestal (ref-15). Cada medalhão usa a **placa** da
  raridade como fundo. Tocar abre a coleção daquele espaço.
- No máximo **três notas**, em 10 px (Moldura, Emblema, Fundo). No app elas aparecem só na primeira visita ou quando
  o jogador segura o dedo na peça.
- A escada de materiais saiu do Espelho e ganhou tela própria (`cosmeticos-material.png`).

A Vitrine (pedestal 3D) e a Coleção (grade 3×3) que já estão no kit2 (`vitrine.png`, `inventario.png`) continuam.

### 4.3 Medalhões

Todo lugar que mostra um jogador em círculo usa a regra da §4.1. Na home, o medalhão do perfil (canto de cima) usa
o nível Chat. Na lista de Confidentes não entra cosmético de jogador (os NPCs têm assinatura própria, BIBLIA §3).

### 4.4 Chat (`kit2/cosmeticos-cena.png`, primeiro painel)

Moldura mini (96) + nome com estilo + emblema em 18 px ao lado do nome + balão. Quem não tem nada equipado aparece com
o aro de pedra e o balão comum, sem parecer "faltando".

### 4.5 Deadly Vote (segundo painel)

- O tabuleiro é **mármore com veio e espessura** e espadas cravadas (ref-16): pintura no mockup
  (`cos2/tabuleiro.webp`); no app, a cena 3D que já existe em `cena3d.js → tabuleiro()`.
- Cada assento é um medalhão de nível Mesa (256) sobre o tabuleiro, com placa de nome em diagonal.
- **Quem fala** sobe para o nível Perfil, entra num cone de luz forte e mostra o nome animado. Os outros ficam
  parados e escurecidos por uma vinheta.
- **Eliminado:** a moldura fica cinza e escura e ganha um risco rubi. Não some.
- O **emblema** vai no cartão de voto ("Seu voto"), preso no canto como lacre.
- O balão equipado vale no chat da mesa.
- Os cosméticos nunca mudam regra do jogo (texto do dono §12).

### 4.6 Casa (terceiro painel)

A Casa é VN/RPG Maker, mas o cosmético entra pintado, como objeto do cômodo:
- **Brasão na porta:** o emblema equipado aparece na porta de entrada da Sala (objeto que já está na SPEC-CASA,
  "Porta de entrada"). A porta é pintada (nogueira escura, ferragens, aldrava, `cos2/porta.webp`) e o emblema é um
  objeto pendurado nela, com sombra própria e a luz da arandela. Troca sozinho quando o jogador troca de emblema.
- **Espelho no quarto:** um objeto "espelho" no cômodo abre a tela Espelho (§4.2) sem passar pelo menu. **PROPOSTA:**
  o cômodo exato depende da lista de cômodos da SPEC-CASA.
- **O Visitante repara:** NPCs podem comentar o emblema ou a moldura numa fala de visita. A fala do kit2 ("Bonito o
  coração na sua porta. É de verdade?") é **exemplo, não texto final**. Texto de NPC é do dono.
- Quando o Record fala na VN, o retrato do avatar aparece com a moldura mini (`SPEC-AVATAR.md` A5). Nas escolhas
  aparece só o ombro do avatar em primeiro plano (`BIBLIA.md` §10).
- NPC não usa cosmético de jogador: na Casa o retrato do Visitante tem aro na cor de assinatura dele.
- Visitar a casa de outro jogador está desligado (SPEC-CASA, PENDENTE 15). Se um dia ligar, a porta mostra o brasão
  do dono da casa.

### 4.7 Revelação do cosmético (PROPOSTA)

`kit2/cosmeticos-revelacao.png`. Quando um cosmético chega ao jogador, ele tem um momento próprio, em três passos:
a peça desce até o pedestal, a placa da raridade acende no chão, e a peça gira. Arcano e Lendário giram em 3D de
verdade (§5b); as outras raridades usam a pintura em camadas. Nome, raridade, descrição literal do catálogo e
procedência ("origem Deadly Vote") ficam embaixo.

Vale para o resultado do Poço e para a entrega de recompensas (`deliverIn`). A regra de sorteio não muda, nem a
revelação por raridade que o Poço já tem: isto é o que aparece depois dela. Observação: pelo catálogo, **nenhum Arcano
sai do Poço** (todos têm origem `deadly_vote` ou `evento`), então no Poço a revelação vai até o Lendário e o exemplo
do mockup é uma recompensa do Deadly Vote. É proposta: decide o dono.

### 4.8 Álbum por série (PROPOSTA)

`kit2/cosmeticos-album.png`. A coleção ganha uma vista por **série**: peças de espaços diferentes que combinam e
fecham um visual. Cada série mostra as peças em placas, as que faltam como silhueta escura com "???", um contador
(3/5) e uma barra. Quando a série fecha, aparece um lacre de cera dourado ("Completa"). É só visual: não mexe em
lógica nem dá recompensa.

Embaixo, o detalhe da peça tocada mostra a **procedência**: a origem que já existe em `meta.origem` (semanal, poço,
deadly_vote, evento) e a temporada, que ainda não existe nos dados (**X**, pendente).

Séries de exemplo, com nomes e agrupamento como **PROPOSTA** (as peças e os nomes das peças são os do catálogo):
- **Relojoaria**: Última Badalada, Relógio do Fim, Engrenagem do Herdeiro, Ampulheta Dourada, Assinatura Noturna.
- **Capela**: Catedral Esquecida, Vitral da Capela, Relicário de Marfim, Vela Fúnebre.
- **Banquete**: Banquete do Javali, Ficha do Javali, Mesa do Destino.

Se o dono aprovar, a série vira um campo opcional `meta.serie` (só acrescenta, §6.3).

---

## 5. Prévia em 2.5D

Duas formas, das duas uma a mais barata é a padrão.

**a) Camadas (padrão, CSS 3D).** A moldura é separada em planos (`kit2/cosmeticos-camadas.png`):

| Camada | O que é | Profundidade |
|---|---|---|
| Z0 | Fundo do perfil | 0 |
| Z1 | Retrato do jogador | +1 |
| Z2 | A moldura pintada | +2 |
| Z3 | Peças soltas: sino, gema, cristal, poeira, cartas | +3 |

Com o giroscópio (ou o dedo arrastando no desktop), cada camada anda numa velocidade: até 4 px a Z0 e até 14 px a
Z3. No Espelho o cartão inteiro gira até ±12°. É CSS `transform` puro, roda em qualquer celular.

**b) Objeto 3D (vitrine e revelação).** Para o Arcano a peça é **modelada**, não um plano com textura
(`kit2/src/cos3d.js → arcanoCristal`, usado em `cosmeticos-revelacao.png`): aro e torre de cristal com
`MeshPhysicalMaterial` (transmissão, dispersão, iridescência), engrenagens de verdade dentro da espessura do aro,
ponteiro extrudado atravessando a janela, sino e pêndulo de cristal, três cartas em órbita com sombra, sobre o
pedestal de mármore negro com frisos champanhe. Em R3F a mesma cena gira devagar; arrastar gira a peça. Para o
Lendário, o pedestal 3D recebe a pintura como plano (o mesmo `arcanoCristal` com a opção `figura`), que é o que o
Espelho usa.

Sem WebGL, com movimento reduzido ou com "animação leve" desligada em Ajustes: imagem parada, sem camadas.

As camadas Z3 já existem no formato atual (`meta.imagem.camadas` com `caixa` e `anim`). O que falta é a
profundidade (§6.3).

---

## 6. Arte gerada, arte em código e dados

### 6.1 O que vira arte gerada (pipeline `infra/arte`, `flux-2-klein-9b`)

- Molduras do avatar de **todas as raridades**: uma por item, no formato da silhueta (alta, larga ou quadrada, §3.1),
  fundo removido. Depois, camadas Z3 recortadas da própria arte (sino, gema, cartas) para animar.
- Placas de fundo por raridade (seis, já feitas).
- Molduras mini de Raro para cima: adaptação quadrada de cada uma (pedido separado, não recorte).
- Emblemas de **todas** as raridades (broche pintado), 1024×1536 com fundo removido; mais a versão de traço em SVG
  para abaixo de 32 px (feita à mão a partir da arte).
- Cantos de balão de Raro para cima (um par por balão).
- Fundos do perfil: um por item, 1536×1024, sem remover fundo.
- Estados abertos dos itens em duas etapas.

Rodada 2 em `cosmeticos/PROMPTS.json` (14 pedidos `v2-cos2-*`, já gerados; cada um diz a variação escolhida):
Badalada em cristal com janela vazia, gaiola do Javali, arco ogival da Catedral, Asas do Crepúsculo, seis placas,
aros Comum e Incomum, Vitral da Capela, balão Correspondência Real, Casulo em duas etapas, tabuleiro de mármore, porta
da Casa e Fragmento Celestial. Nenhuma peça substitui um item do catálogo sem aprovação do dono.

### 6.2 O que fica em código

- O aro de nível Lista (48 px e menos) de todas as raridades, com a forma da §2.2; os aros de Comum e Incomum só no
  modo econômico.
- Luz, poeira, cone de pedestal, reflexo que passa, giro de engrenagem, balanço de pingente.
- Estilos do nome (fontes e efeitos de lista fixa).
- Balões Comum e Incomum (SVG de três peças) e o modo econômico dos outros.
- Modo econômico do fundo do perfil (os `ESTILOS_BORDA` atuais).

### 6.3 Dados (mudanças opcionais, só acrescentam)

- `meta.imagem.camadas[].z` (0 a 3): profundidade da camada para a prévia 2.5D. Sem o campo, a camada fica em Z3.
- `meta.imagem.estados` (lista de bases, para itens em duas etapas). **PENDENTE:** a regra que troca de estado.
- Novas chaves em `EFEITOS_NOME` (`aurora`, `gravado`, `tinta`).
- `meta.serie` (texto) para o álbum por série, se o dono aprovar (§4.8). A temporada da procedência não existe hoje.

Nenhuma migração de banco é necessária: tudo mora em `item_defs.meta` (JSON). Posse, equipar, Poço, recompensas e
o `Visual` público não mudam.

---

## 7. Pendências do dono

1. Aprovar a direção com a dupla de demonstração (Última Badalada + Coração da Condessa) antes de refazer o catálogo
   (texto do dono, §12).
2. Aprovar a escada de materiais por raridade (§2) e as cores (BIBLIA §3, ainda proposta).
3. Regra de abertura dos itens em duas etapas e o nome "Casulo do Crepúsculo".
4. "Borda do perfil" passa a se chamar "Fundo do perfil"?
5. Nome da tela: **Vitrine** (proposta padrão, para não colidir com o Espelho do avatar no Quarto) ou outro.
6. Falas de Visitante comentando cosméticos: texto do dono.
7. Fortuna do Rato (Incomum, hoje pintada) mantém a arte atual (na rodada 2 todas as raridades são pintadas).
8. Álbum por série: aprovar a ideia, os nomes das séries (Relojoaria, Capela, Banquete) e quais peças entram.
9. Temporada na procedência: hoje não existe nos dados (**X**).
10. Revelação do cosmético (§4.7): aprovar como momento próprio no Poço e na entrega de recompensas.
11. Correspondência Real é Raro, mas a descrição fala em "filigrana de ouro": manter o dourado pálido ou trocar.
12. Casulo: raridade (proposta Épico), nome e regra de abertura.

---

## 8. Arquivos

| Arquivo | O que é |
|---|---|
| `docs/redesign/v2/kit2/cosmeticos.html` | Mockups (seis telas, `?tela=espelho|material|album|revelacao|cena|camadas`) |
| `docs/redesign/v2/kit2/cosmeticos.png` | Espelho: peça no pedestal 3D, cartão inclinado, medalhões em arco |
| `docs/redesign/v2/kit2/cosmeticos-material.png` | Lendário × Arcano, escada de placas, forma em 48/24 px, emblemas em traço |
| `docs/redesign/v2/kit2/cosmeticos-album.png` | Álbum por série com silhuetas, contador, lacre e procedência |
| `docs/redesign/v2/kit2/cosmeticos-revelacao.png` | Revelação com a Badalada modelada em 3D |
| `docs/redesign/v2/kit2/cosmeticos-cena.png` | Chat (pintado × vetor), Deadly Vote no mármore, porta da Casa |
| `docs/redesign/v2/kit2/cosmeticos-camadas.png` | Camadas Z0–Z3, Casulo em duas etapas, quatro tamanhos |
| `docs/redesign/v2/kit2/src/cos3d.js` | Cena 3D do Arcano (cristal, mecanismo, cartas, pedestal) |
| `docs/redesign/v2/kit2/src/img/cos2/` | Arte nova da rodada 2 |
| `docs/redesign/v2/kit2/src/render-cosmeticos.cjs` | Render com Playwright (390×844 @2) |
| `docs/redesign/v2/cosmeticos/PROMPTS.json` | 14 pedidos do pipeline, com a variação escolhida |
