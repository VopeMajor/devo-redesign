# Motor e cenário da Casa e das Torres

Parte do DEVO v2 (ver `PEDIDO-V2-dono.md`, correções no topo). A Casa e as Torres são as únicas telas em
linguagem RPG Maker / visual novel: cenário onde o avatar anda, objetos que se tocam, diálogo com retrato grande,
escolhas, visitantes. O resto do DEVO segue gótico ametista, mármore, pintado.

Protótipo: `prototipo-motor/index.html` (capturas em `prototipo-motor/capturas/v2-*`).

---

## 0. Decisão em três linhas

1. **Cenário pintado em alta definição, em camadas com profundidade** (linha "parallax mapping" do RPG Maker MZ,
   com acabamento de Coffee Talk / Persona nos cômodos). Pixel detalhado fica descartado.
2. **PixiJS 8 para a cena** (carregado só na rota da Casa/Torres), **DOM/React para a interface** por cima
   (VN, cut-in, rótulos, escolhas) e **Canvas 2D como reserva** com a mesma lista de comandos.
   Three.js/R3F, que já está no projeto, fica para as peças 2.5D/3D (diorama, escada das Torres).
3. O protótipo prova o laço completo no celular 390×844: andar por toque, oclusão atrás de móvel, objetos com
   brilho, câmera que segue e aproxima, visitante batendo na porta com cut-in e VN com retrato que sai da moldura.

---

## 1. Linguagem do cenário

### 1.1 As duas opções

| Critério | (a) Pintado HD com profundidade | (b) Pixel art detalhada (Eastward, Sea of Stars) |
|---|---|---|
| Combina com o resto do DEVO | Sim. Arcanos, cartas, Poço, mapa das Torres, NPCs: tudo é pintura. A Casa vira "o mesmo mundo, visto de perto". | Não. Seria a única ilha em pixel; o dono reprovou pixel fora daqui ("não em pixel") e o kit em pixel foi recusado por parecer simples. |
| Assets que já existem | `casa/cena`, `cena-porta`, `oficina`, `primeiro-plano` (todos pintados, 2:3, 512–1536 px) e `torres/mapa/ilha`, `torres/*/torre` (pintados, recortados). Servem direto como base e placeholder. | Nenhum. Tudo do zero. |
| Pipeline de arte | `infra/arte` (flux-2-klein no Workers AI) já gera pintura coerente com o DEVO. Recorte de camadas por máscara é script (ex.: `camadas.py`). | Modelo de imagem não entrega pixel limpo em grade; pixel no nível de Eastward exige artista humano, tile por tile, e animação quadro a quadro. Custo e prazo muito maiores. |
| Celular | Pintura de 1536 px aguenta DPR 2–3 sem serrilhar; escala qualquer. | Pixel pede escala inteira. Em 390 px de largura sobra 130 px ×3 ou 195 ×2: ou a cena fica pequena, ou aparecem barras, ou o pixel deforma. |
| Animação e luz | Luz aditiva, névoa, poeira no facho, chama tremendo, retrato respirando: tudo por camada, sem redesenhar a pintura. | Luz e partículas precisam respeitar a grade para não "descolar" do pixel; cada estado de objeto é sprite novo. |
| Sensação "RPG Maker" | Vem do jogo: andar, tocar, evento, diálogo, escolha, visitante. O RPG Maker MZ tem justamente o modo "parallax mapping" (pintura inteira + camadas de colisão e de cobertura), que é o que este motor faz. | Vem do visual. |
| Risco | Avatar precisa ser pintado e em camadas (roupa, cabelo) para não destoar; oclusores e chão andável são feitos à mão por cômodo. | Destoar do resto; parecer "simples" de novo. |

### 1.2 Recomendação: (a), pintado em camadas

Motivo principal: o DEVO inteiro é pintura gótica. Uma Casa em pixel, mesmo excelente, pareceria outro jogo
colado dentro do app, e o dono já disse não ao pixel. A sensação de RPG Maker / VN se constrói com o laço de
jogo (andar, tocar, visitante, escolha), e esse laço independe do estilo do desenho.

Como fica cada cômodo:

| Camada | O que é | Exemplo no protótipo |
|---|---|---|
| Fundo | A pintura do cômodo, com a luz parada já "assada" | `cena-1024/1536.webp` + facho da lua e tinta ametista assados no carregamento |
| Chão andável | Polígono (no app: malha de navegação) | `CENA.chao` |
| Objetos tocáveis | Área de toque, ponto onde o avatar para, brilho, rótulo | porta, relógio, poltrona, mesinha, janela |
| Avatar | Sprite em camadas, escala pela profundidade, sombra no chão, luz de recorte | placeholder procedural (ver 3.3) |
| Oclusores | Recortes da própria pintura que cobrem o avatar quando o pé dele passa atrás da linha de base | poltrona + mesinha + abajur (`oclusor-*.webp`) |
| Luz viva | Chama, abajur, fresta da porta, batida do visitante (aditivo) | `CENA.luzes` |
| Partículas | Poeira no facho, brasas das velas, névoa baixa | `S.motes`, `S.brasas` |
| Primeiro plano | Cortina e velas desfocadas, com paralaxe maior que a cena | `primeiro-plano-*.webp`, paralaxe 0,38 |
| Acabamento | Teto escurecido, vinheta (CSS, de graça no compositor) | `#vinheta` |
| Interface | VN, cut-in, rótulos, Tempo no pulso | DOM por cima do canvas |

Onde entra 2.5D/3D (pedido do dono, refs 10, 13, 16, 20):

- **Torres**: o mapa já é uma ilha flutuante pintada com torres recortadas. Seleção de andares no formato da
  escada espiral da `ref-10` (pintada, com nós de gema), e o interior de cada torre no mesmo motor da Casa.
  Uma versão em Three.js/R3F da ilha (câmera orbitando devagar, torres como planos pintados em profundidade) é
  viável e não acrescenta biblioteca.
- **Vista da Casa** (SPEC-CASA 2.2-a): em vez do corte esquemático, um diorama no espírito da `ref-13`
  (palco redondo, cômodos abertos), em R3F com os cômodos como planos pintados. Fica para depois do motor.

### 1.3 O que muda nas specs (aplicado na harmonização de 01/11, noite)

- `SPEC-CASA.md` §4.1 "Avatar (pixel, 4 direções)" e as menções a "menu pixel" e "porta em pixel" passam a valer
  como **avatar pintado em camadas** e **interface gótica do DEVO**. O resto da spec (cômodos, objetos, estados,
  Visitantes, decoração) continua.
- `SPEC-AVATAR.md` (linha 45 e §"pixelated") precisa ser reavaliada: o avatar vira sprite pintado de corpo
  inteiro com camadas (pele, roupa, cabelo, acessório) em 2–4 direções. Pendência para a parte do avatar.

---

## 2. Motor no navegador

### 2.1 Comparação

Tamanhos medidos aqui com esbuild (minificado, gzip -9), importando só o que o motor usa:

| | PixiJS 8.22.0 | Phaser 4.2.1 | Canvas/DOM próprio | Three.js / R3F (já no projeto) |
|---|---|---|---|---|
| Tamanho extra | **172 KB gz** (bundle com Application, Sprite, Graphics, Assets); `pixi.min.js` completo: 237 KB gz | **369 KB gz** só com `new Phaser.Game` | 0 | 0 (já pago) |
| Licença | MIT | MIT | nossa | MIT |
| Toque | Eventos federados (pointer) ou o nosso `pointerdown` no canvas convertendo para o mundo (o protótipo faz assim) | Sistema próprio de input, completo | Nosso, simples | Raycast; mais trabalho para 2D |
| Desempenho | WebGL/WebGPU, lote automático de sprites, blend aditivo e screen nativos, filtros (blur, color matrix, deslocamento) | WebGL, também rápido; carrega muita coisa que não usamos (física, tilemap, cenas, áudio) | Canvas 2D: bom com poucas camadas; blend aditivo e filtros pesam no celular. DOM/CSS: ótimo para 3–5 camadas, ruim para dezenas de partículas | Ótimo, mas sprite 2D com lote e camadas ordenadas exige código nosso |
| Camadas | Container com `zIndex`, máscaras, render textures (para assar luz), blend por sprite | Display list e câmeras próprias | Ordem manual | Ordem por profundidade/renderOrder |
| Encaixe no Next/React | Biblioteca de render; a gente controla o laço. Dá para montar num `useEffect` e carregar com `dynamic import` só na rota | Framework de jogo com laço, cenas e loader próprios; briga com o React pelo controle | Total | Já integrado (R3F) |

### 2.2 Recomendação

- **PixiJS 8** para a cena da Casa e das Torres, num chunk carregado só quando o jogador entra nelas.
  Ele dá o que o cenário pintado precisa (muitas camadas, aditivo, filtros, assar luz em textura) sem trazer um
  framework inteiro. Phaser resolveria, mas custa o dobro e duplica o que React já faz (cenas, UI, estado).
- **Interface em DOM/React** por cima do canvas: caixa de VN, retrato, cut-in, escolhas, rótulos, Tempo.
  Texto nítido, acessível, com as fontes e o CSS do DEVO, e animação no compositor.
- **Canvas 2D como reserva**: o protótipo desenha a mesma lista de comandos nos dois (`RendererPixi` e
  `RendererCanvas`). No app, cai para Canvas se WebGL falhar ou se o aparelho for fraco.
- **Three/R3F** só para as peças 2.5D (diorama, ilha das Torres em 3D), que já usam a biblioteca do projeto.

---

## 3. Protótipo

### 3.1 Como abrir

```
cd docs/redesign/v2/prototipo-motor
python3 -m http.server 8765
# http://127.0.0.1:8765/index.html
```

Parâmetros: `?motor=pixi|canvas` · `?demo=1` (anda sozinho, usado para medir) · `?debug=1` (chão, linha do
oclusor) · `?visita=0` (sem visitante) · `?res=1` (resolução 1×) · `?fx=0` (sem luz/partículas) ·
`?assar=0` (luz parada desenhada a cada quadro em vez de assada).

### 3.2 O que tem

- Cena atual da casa (`public/images/casa/cena-*.webp`, copiada para `assets/`) em camadas: fundo com luz
  assada, névoa, luzes vivas com tremor de chama, oclusor recortado da pintura já iluminada (sem emenda),
  poeira no facho da lua, primeiro plano com paralaxe e brasas das velas.
- Avatar placeholder andando até onde se toca, com escala pela profundidade, sombra, passo de 8 quadros,
  luz de recorte fria (lua) e quente (abajur), passando atrás da poltrona.
- Cinco objetos tocáveis com halo pulsante e losango girando; o rótulo aparece quando o avatar se aproxima.
  Tocar no objeto leva o avatar até o ponto dele e abre a VN.
- Câmera que segue com antecipação na direção do passo, respira de leve, aproxima no objeto aberto e treme
  na batida da porta.
- **Visitante** (SPEC-CASA 2.2-h): três segundos depois de entrar, a porta pisca, o rótulo ganha "!", entra um
  cut-in diagonal com os olhos do visitante. Tocar na porta abre a VN com retrato grande saindo de uma lâmina
  ametista em diagonal, placa de nome inclinada e escolhas em barras inclinadas (Atender / Não atender →
  Conversar / Dar presente). O retrato muda de expressão com entrada animada e respira.

### 3.3 O que é placeholder

- **Avatar**: silhueta desenhada em código (sobretudo, cachecol ametista, cabelo, botas). Será trocado pelo
  avatar pintado da spec de avatar.
- **Visitante**: retratos da Melissa (`public/images/npc/melissa`) só para mostrar o enquadramento. Os NPCs vão
  passar pelo redesign com Persona como referência; quem bate na porta vem do sorteio de Visitantes.
- **Falas**: todas "[fala pendente]". O texto do dono entra literal.
- "Dar presente" e "Abrir" ficam desativados (sistemas de outras partes).

### 3.4 Capturas (390×844, Chromium com toque e `isMobile`)

| Arquivo | Mostra |
|---|---|
| `v2-390x844-inicio.png` | Sala, avatar parado, rótulos perto |
| `v2-390x844-cutin-batida.png` | Batida na porta: cut-in, porta acesa, "!" no rótulo |
| `v2-390x844-atras-da-poltrona.png` | Avatar no fundo, junto da planta, com a luz da lua |
| `v2-390x844-visitante-vn.png` | VN do visitante: retrato fora da moldura, Atender / Não atender |
| `v2-390x844-visitante-atender.png` | Depois de atender: troca de expressão, novas escolhas |
| `v2-390x844-objeto-relogio.png` | Objeto comum: placa, fala pendente, Abrir (desativado) / Sair |
| `v2-1440x900-pixi.png` | Desktop: mostra o limite da pintura 2:3 (ver 4.3) |
| `v2-prancha-celular.png` | As cinco telas do celular lado a lado |

As capturas `390x844-*` sem prefixo são da primeira versão (avatar em blocos, caixa simples) e ficam como
histórico.

### 3.5 Desempenho

**Aviso**: esta máquina não tem GPU. O Chromium roda WebGL em SwiftShader (software) com 4 núcleos. Os FPS
absolutos abaixo medem o rasterizador em software, não um celular. O número que se transfere para o aparelho é
o tempo de JavaScript por quadro.

Medição: `?demo=1`, 390×844, `deviceScaleFactor` 3, `isMobile`, 6–8 s por caso, CPU sem limite e com limite 4×
(emulação de celular médio pelo DevTools). `requestAnimationFrame` vazio na mesma máquina: 60 fps.

| Caso | FPS (software) | JS lógica | JS envio do quadro | Comandos |
|---|---|---|---|---|
| Pixi, resolução 2× | 6,7 | 0,2 ms | 0,7 ms | 127 |
| Canvas, resolução 2× | 12,2 | 0,2 ms | 0,3 ms | 127 |
| Pixi, 1× | 23,7 | 0,2 ms | 0,5 ms | 127 |
| Canvas, 1× | 54,0 | 0,2 ms | 0,3 ms | 127 |
| Pixi, 1×, CPU 4× mais lenta | 14,7 | 1,1 ms | 2,5 ms | 127 |
| Canvas, 1×, CPU 4× mais lenta | 9,9 | 1,0 ms | 1,6 ms | 127 |
| Pixi, 1×, sem efeitos | 25,9 | 0,2 ms | 0,4 ms | 17 |

Leitura:

- Mesmo com a CPU 4× mais lenta, o JavaScript gasta cerca de 3,6 ms por quadro (orçamento de 60 fps: 16,7 ms).
  A lógica do motor não é o gargalo.
- O FPS sobe com a resolução caindo de 2× para 1× (6,7 → 23,7 no Pixi). O custo aqui é o preenchimento de
  pixels feito pela CPU. Num celular esse trabalho vai para a GPU.
- Sobreposição medida: 3,4 telas por quadro. Com teto de resolução 2× (780×1688) dá cerca de 4,5 Mpx por
  quadro, uns 270 Mpx/s a 60 fps. É uma estimativa, mas fica bem abaixo da taxa de preenchimento de GPUs de
  celular intermediário.
- Em software o Canvas 2D ganha do WebGL emulado. Num aparelho real com GPU a tendência se inverte quando há
  muitas camadas aditivas e filtros. Por isso a reserva em Canvas fica no desenho do motor.
- Otimizações já no protótipo: teto de 2× na resolução, luz parada assada na pintura (1 camada cheia em vez de 5),
  vinheta em CSS, texturas geradas uma vez, pintura de 1536 só quando a tela pede.

**Pendente**: medir num iPhone e num Android intermediário de verdade (abrir a URL do protótipo e ler o contador
no canto). Só esse número fecha a escolha entre Pixi e Canvas como padrão.

---

## 4. Como isso entra no app (proposta, sem código agora)

### 4.1 Formato de um cômodo

Um JSON por cômodo, no espaço da pintura:

```
{ "pintura": "/images/casa/sala", "tamanho": [683,1024],
  "chao": [[x,y]...],                      // no app: malha de navegação + A*
  "oclusores": [{ "img": "...", "x":0, "y":532, "base":868 }],
  "frente": { "img": "...", "paralaxe": 0.38 },
  "objetos": [{ "id":"porta", "toque":[...], "pe":[x,y], "brilho":[x,y,r], "rotulo":[x,y], "estados":[...] }],
  "luzes": [{ "x":84, "y":612, "r":300, "cor":"#f2c58a", "tremor":true }],
  "particulas": [{ "tipo":"poeira", "area":[...] }] }
```

Os estados de cada objeto (`SPEC-CASA` tabela de estados) trocam camadas e luzes, não a pintura inteira.

### 4.2 Arte por cômodo

Pedido em `infra/arte` → pintura base, primeiro plano e, quando houver, variações de estado. Oclusores saem por
máscara desenhada em cima da pintura (script, como o `camadas.py` usado aqui). A luz viva é do motor.

### 4.3 Desktop

A pintura 2:3 preenche o celular, mas no desktop sobram laterais (ver `v2-1440x900-pixi.png`). Duas saídas:
pintar cada cômodo também em 16:9 (o mais bonito), ou moldar a cena num quadro ornamental com o primeiro plano
transbordando (mais barato). Decisão para a parte do desktop.

### 4.4 Torres

O mesmo motor serve para o interior das torres. O mapa (ilha + torres recortadas, `lib/devo/torres/conteudo.json`
→ `cenario.pedestais`) pode continuar como está ou ganhar a versão R3F da seção 1.2. A escolha de andar segue a
escada espiral da `ref-10`. Nenhuma tela das Torres foi prototipada nesta etapa.

---

## 5. Pendências

1. FPS em aparelho real (iPhone e Android intermediário).
2. Avatar pintado em camadas: feito na harmonização de 01/11 (`SPEC-AVATAR.md` §2.3, §5.4, §5.5). Falta a arte.
3. Malha de navegação com A* para cômodos com obstáculos no meio (o protótipo usa um polígono só).
4. Retratos dos NPCs no redesign estilo Persona; quem bate na porta vem do sorteio de Visitantes.
5. Falas da porta, dos objetos e dos visitantes: texto do dono, literal.
6. Pintura 16:9 ou moldura para o desktop.
7. Interior das Torres e escada de andares: prototipar no mesmo motor.
