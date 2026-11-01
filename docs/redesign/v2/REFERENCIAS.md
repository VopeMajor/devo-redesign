# DEVO v2 — referências por tela

Pesquisa de 31/10/2026 para a versão RPG Maker. Compara as oito referências do dono (`refs/ref-01..08.jpg`)
com RPG Makers e visual novels bem avaliados e diz, tela por tela, o que copiar, o que evitar e como fica no
celular em retrato (alvo 390×844). Nada aqui é regra nova do jogo: onde o dono deixou "x"/"X", segue pendente.

Fontes confirmadas por busca estão no fim. O que vem de conhecimento geral dos jogos está escrito como
padrão de interface, sem números.

---

## 0. O que as referências do dono já decidem

| Ref | O que mostra | O que levamos |
|---|---|---|
| 01, 02 | Mapa em pixel visto de cima (estilo Stardew), caixa de diálogo bege com borda dupla, retrato anime em moldura floral à direita, placa com o nome embaixo do retrato, ícone de "avançar" no canto. HUD de data/hora no canto superior direito. | **Caixa de diálogo padrão do v2.** Texto em fonte pixel, retrato em ilustração (não pixel), moldura com flores e ornamento de canto. É o padrão "Amor Doce dentro de Stardew". |
| 03 | Rua isométrica com cerejeiras, pétalas caindo, sprite chibi andando; caixa translúcida em cima com retrato pequeno e legenda dupla. | Mapa da cidade em **isométrico leve** com partículas (pétalas) e caixa translúcida "de passagem" para falas curtas que não param o jogo. |
| 04 | Casa isométrica em corte, dourada, vários cômodos e escada, céu de nuvens. | Visão de **casa em corte** (dollhouse) para a tela de cômodos e para mostrar melhorias de nível. |
| 05 | Quarto isométrico lilás, móveis ornamentados, personagem de costas. | Estilo de **decoração**: peças grandes, legíveis, com tema (laço, pérola, flor). |
| 06 | Quarto gótico isométrico (Habbo/Pixel), roxo e verde-fantasma, caixão, esqueleto. | Prova de que **o mesmo grid aceita temas opostos**: tema fofo e tema necro na mesma casa. Bom par para Honra x Necro. |
| 07 | D1AL-ogue: celular à esquerda como menu (player de música, Mensagens, Data Storage, SNS, Option, Exit), cena com personagem à direita, caixa de texto escura embaixo, atalhos (Backlog, Hide, Skip). | **O celular do jogo** e a barra de atalhos de VN (Histórico, Ocultar, Pular, Auto). |
| 08 | "Diário" rosa e preto estilo janela de PC antigo: barras de afinidade (dois medidores com ícone do NPC), escolhas como botões grandes sobre a cena, caixa de diálogo com retrato embutido, menu "SETTING" com moldura de orelhas de gato, barra de tarefas embaixo. | **Escolhas e barras de afinidade/romance.** Visual de diário/OS para o lado "sistema" do DEVO. |

Síntese visual: **dois registros**. O mundo (mapa, casa, rua) é pixel quente e pastel (01–06). A camada de
sistema (celular, Record, Deadly Vote, afinidade) é interface de "aparelho" com moldura pixel (07–08), que já
conversa com o Record System atual (preto + azul-cobalto). Os retratos e CGs atravessam os dois registros em
ilustração anime de alta definição.

---

## 1. Padrões globais (valem para todas as telas)

### 1.1 Caixa de diálogo
- **Copiar (ref-01/02 + Stardew + Amor Doce):** caixa embaixo, retrato à direita com placa de nome. No
  celular a caixa ocupa a largura toda e ~30% da altura; o retrato **sai da caixa** e fica em pé por cima dela,
  do lado direito, cortado na cintura (como ref-07). Assim o retrato fica grande sem comer o texto.
- Texto em fonte pixel legível em 16 px reais (nada de 8 px escalado); acentos do português testados.
- Efeito de digitação com velocidade ajustável; toque completa a linha, segundo toque avança. Indicador de
  "avançar" animado no canto (o "+" da ref-01).
- **Barra de atalhos de VN** (ref-07): Histórico, Auto, Pular (só falas já lidas), Ocultar caixa. No
  celular vira um ícone de três pontos na borda da caixa e o gesto de deslizar para cima abre o Histórico.
- **Efeitos de texto** (DDLC, OMORI, Danganronpa): tremor em palavra, cor por palavra-chave (termos do jogo
  como *Record*, *Recuo Paranormal* em destaque), texto "corrompido" só em momentos narrativos raros.
  Formato sugerido no motor atual: marcações inline, como o `*negrito*` que `lib/devo/dialogo/*` já usa.
- **Evitar:** caixa translúcida para diálogo longo (ref-03 funciona só em falas curtas); retrato pequeno
  dentro da caixa no celular (fica ilegível); texto em caixa alta pixel (cansa em português).

### 1.2 Retratos e expressões
- **OMORI** guarda conjuntos de quadros separados por emoção; **Amor Doce** troca expressão a cada fala.
  Copiar: cada NPC com 6–12 expressões nomeadas, mais 2–3 quadros de piscar e boca. O pipeline atual de
  `fatiar-npcs.py` (folhas 4×3) já serve; só muda o estilo da arte.
- **Evitar:** retrato parado o diálogo inteiro. Piscar e respirar (1–2 px de deslocamento) já bastam.

### 1.3 Escolhas
- **Copiar ref-08:** botões grandes centrais sobre a cena escurecida, ícone à esquerda de cada opção. No
  celular: até 4 opções empilhadas na metade de baixo, alvo de toque ≥ 48 px.
- **Copiar Amor Doce/Mystic Messenger:** feedback discreto depois da escolha (coraçãozinho subindo ou
  rachando perto do retrato), sem número na hora. O número aparece no Vínculo.
- **Evitar:** mostrar de antemão qual opção dá afinidade. O texto do dono pede que o jogador "pense
  cuidadosamente em cada resposta".

### 1.4 Sprites por contexto
- Estados mínimos do avatar: parado, andando (4 direções), sentado, dormindo, segurando presente,
  escondido (para Hostilidade), assustado, rito (gesto). NPCs: chegando à porta, esperando, sentado,
  conversando, irritado, indo embora, hostil.
- **Corpse Party** usa sprites chibi com poses exageradas para horror; **LISA** mostra que pose estranha
  pesa mais que detalhe. Copiar: poses de corpo inteiro para os momentos fortes, mesmo em sprite pequeno.
- Grade de sprite 32×48 ou 48×64 (escala inteira no celular: ×2 em 390 px de largura dá 12 tiles visíveis).

### 1.5 Transições
- Corte em íris/círculo ao entrar em prédio, desbotar em preto para mudança de dia, "rasgo" de tela para
  Deadly Vote (Persona 5 usa transições agressivas só nos momentos de virada; o resto é seco e rápido).
- **Evitar:** transição longa em ação repetida. Entrar e sair de casa deve levar menos de 0,5 s.

### 1.6 Celular do jogo (ver tela 8)
O celular é o menu principal. Ele substitui o "phone-shell" atual dentro do mundo.

---

## 2. Tela por tela

### 2.1 Título
- **Referências:** OMORI (título com ilustração desenhada e música suave), DDLC (título inocente que muda
  depois), Needy Streamer Overload (título como "ligar o PC"), D1AL-ogue (ref-07).
- **Copiar:** o sigilo do DEVO e o relógio 71:59:59 continuam como identidade. A tela vira uma cena viva em
  pixel: a rua da ref-03 à noite, pétalas caindo, a janela da casa acesa. Botões em pixel: **Começar**,
  **Continuar**, Som. Depois do primeiro Deadly Vote a cena de título muda (DDLC): mesma rua, um detalhe
  diferente. Isso dá ao jogador uma razão para olhar o título.
- **Evitar:** vídeo pesado ou 3D; logo tomando a tela inteira no celular.
- **Celular:** cena em retrato com a câmera mostrando a rua de cima para baixo; logo no terço superior,
  botões no terço inferior (polegar).

### 2.2 Criação de avatar (tutorial de "fantasia")
- **Referências:** Amor Doce (vestir a Docete com roupas e penteados), Stardew (criação com setas por
  categoria e prévia do sprite), Animal Crossing (prévia de rosto grande), Persona 5 (cada passo tem uma
  moldura estilizada).
- **Copiar:** duas prévias ao mesmo tempo: **retrato anime grande** e o **sprite pixel** ao lado, girando
  nas 4 direções. Categorias pedidas pelo dono: penteado, pele, olhos, cor, roupas (mais: sobrancelha, boca,
  acessório). Paletas de cor em amostras, não seletor livre (garante que o retrato gerado bata com o sprite).
- O tutorial é narrado, com uma personagem guia dentro da caixa de diálogo padrão.
- **Arte:** o retrato do avatar não pode ser IA por jogador em tempo real (custo e coerência). Montagem em
  camadas (cabelo frente/trás, olhos, roupa) desenhadas uma vez, como Amor Doce faz.
- **Evitar:** dezenas de sliders (Sims); escolhas que só aparecem no sprite e não no retrato.
- **Celular:** prévia no topo (50% da altura), abas de categoria em fileira rolável, grade de opções embaixo.
  Botão "Aleatório" e "Pronto" fixos no rodapé.

### 2.3 Casa
- **Referências:** ref-04/05/06 (isométrico decorado), Stardew (casa com upgrades que acrescentam cômodos),
  Animal Crossing (decoração livre com grade, avaliação da casa por tema), Habbo (ref-06).
- **Copiar:**
  - Duas vistas. **Vista de cômodo** em isométrico (ref-05/06) onde o avatar anda e os Visitantes aparecem;
    **vista de corte** da casa toda (ref-04) para trocar de cômodo e ver os cômodos trancados.
  - Modo decorar à parte (Animal Crossing): grade visível, girar peça, empilhar sobre mesa, guardar no baú.
  - Cada móvel mostra que Visitantes gosta/desgosta, conforme o texto do dono ("alguns itens podem aumentar
    a probabilidade de certos Visitantes aparecerem, mas também reduzir as chances de atrair outros"). Ícones
    de rosto com seta para cima/baixo, só para NPCs já conhecidos.
  - **Skin da casa e cômodos novos** como melhoria por nível (dono: "ainda estamos discutindo"). Estrutura:
    a casa é uma lista de cômodos com estado trancado/aberto e uma skin por casa. A vista de corte mostra os
    trancados em silhueta.
  - **Quartos de Hóspedes:** um cômodo próprio por morador, com o sprite dele em rotina (Stardew/Animal
    Crossing: o morador tem horário, móveis dele e falas novas).
  - Objeto do **Card Shuffler** como móvel interativo (o dono disse que ele "passa a ser outro objeto").
- **Evitar:** casa sem limite de peças (pesa no celular); decoração só cosmética, sem efeito em Visitantes.
- **Celular:** isométrico com câmera que segue o avatar; arrastar com um dedo move a câmera, pinça dá zoom de
  duas escalas fixas (×2, ×3). No modo decorar, a peça segue o dedo com deslocamento acima dele para não
  ficar escondida.

### 2.4 Visita de NPC ("Um Visitante apareceu") e Hostilidade
- **Referências:** Animal Crossing (visitante no camping com chance que cresce a cada dia sem visita),
  Coffee Talk e VA-11 Hall-A (pessoas vêm até você; o lugar é fixo, as histórias chegam), Stardew (presentes
  com gosto pessoal), The Witch's House / Ib (fuga e esconderijo).
- **Copiar:**
  - Chegada como evento: batida na porta, sprite do NPC entra, faixa no topo "**[Um Visitante apareceu]**"
    (texto do dono, literal) no estilo de janela de sistema.
  - Conversa no formato da caixa padrão, com escolhas que mexem nas Essências de Afinidade.
  - **Presentear:** abrir a bolsa, arrastar o presente até o NPC. Reação imediata no retrato (expressão
    "adorou"/"não gostou"), como Stardew. Depois de dado uma vez, o gosto fica anotado na ficha do NPC
    (Stardew registra gostos descobertos). Limites e pesos de presente: pendência para o dono.
  - Coffee Talk mostra que **acertar o que a pessoa quer** é mais forte que um contador: a bebida certa abre
    a próxima parte da história. Aqui o presente certo pode abrir a fala seguinte.
  - **Hostil:** a música corta, a tela escurece nas bordas, aparece um cronômetro curto e os esconderijos da
    casa brilham (armário, debaixo da cama). Lógica de The Witch's House: perseguições raras para continuarem
    assustando. Decorações "de proteção" reduzem a chance (texto do dono).
- **Evitar:** morte súbita sem aviso (crítica frequente a The Witch's House); visita em todo login (vira
  rotina).
- **Celular:** o Visitante sempre aparece na metade de cima da tela para não ficar sob o polegar; botão grande
  "Presentear" ao lado de "Conversar". No modo hostil, esconderijos com ícone pulsando e toque único para
  correr até eles.

### 2.5 Vínculos e romance
- **Referências:** Persona 5 (Confidentes: cada um com carta de Arcano, rank e próxima recompensa à vista),
  Stardew (corações por NPC com aniversário e gostos), Amor Doce (Lov'O'Meter), ref-08 (duas barras com
  ícone do NPC), Mystic Messenger (rotas por personagem).
- **Copiar:**
  - Tela "Conhecidos" em lista de cartões: retrato, nome, barra de **afinidade**, ícone de "paixão". Marcar
    **paixão** (pedido do dono) acende uma segunda barra, de **romance**, logo abaixo, no padrão das duas
    barras da ref-08.
  - Persona 5 mostra o próximo prêmio do vínculo. Copiar isso para as recompensas do dono (Chaves de Torres,
    Pacotes de Cartas, Dracmas): o cartão diz "próximo: ???" e o tipo do prêmio.
  - Ficha do NPC: gostos descobertos, decoração preferida, se aceita morar (o dono pede que o jogador saiba
    "antes de investir seu tempo nessa relação"), galeria de CGs desbloqueadas.
  - Combina com os **Arcanos** do DEVO: cada NPC pode ter uma carta de tarô como em Persona.
- **Evitar:** número cru de pontos na lista (Persona e Stardew usam níveis e corações); romance acessível sem
  marcar paixão.
- **Celular:** lista vertical com cartões de 96 px; ficha do NPC em tela cheia com retrato no topo e abas
  (Vínculo, Gostos, Lembranças).

### 2.6 CG de encontro
- **Referências:** Amor Doce (ilustração do encontro depende do Lov'O'Meter e das escolhas), Mystic Messenger,
  DDLC (CG que entra por cima da cena).
- **Copiar:** a CG entra com um flash suave e fica em tela cheia; a caixa de diálogo continua por cima e pode
  ser ocultada. Fica salva na galeria do NPC. Variações da mesma CG conforme o nível de romance (Amor Doce
  tem ilustrações diferentes para o mesmo encontro).
- **Arte:** ilustração anime gerada no pipeline do projeto e revisada à mão; mesmo estilo dos retratos.
- **Evitar:** CG em paisagem espremida no celular.
- **Celular:** **desenhar as CGs em retrato (9:16)** desde o começo; no desktop elas viram painel central com
  fundo desfocado. Arrastar na CG revela a parte cortada quando for larga.

### 2.7 Mapa da cidade
- **Referências:** ref-03 (rua isométrica), Stardew (cidade pequena, densa, cheia de gente com horário),
  Rakuen e To the Moon (mapa simples, mas cada canto com uma história), Yume Nikki (portas que levam a lugares
  estranhos).
- **Copiar:**
  - Cidade pequena e densa: cada prédio é uma função (Poço, Torres, Salão das Máscaras, sede da Companhia,
    loja de decoração). Placa em pixel na porta.
  - NPCs andando pela rua com horário (Stardew), o que dá vida e indica onde achar cada um.
  - Pétalas, chuva, neve como camada de partícula por estação (ref-03).
  - Em Yume Nikki explorar é a recompensa. Copiar só um pouco: um ou dois lugares escondidos que abrem com
    efeitos ou Arcanos.
- **Evitar:** mapa grande e vazio (crítica comum ao visual padrão do RPG Maker, citada em resenhas de Rakuen).
- **Celular:** controle por **toque para andar** (o avatar vai até o ponto tocado) em vez de direcional
  virtual; atalho "ir para" no celular do jogo para quem não quer andar. HUD só com hora no topo direito
  (ref-01) e o botão do celular.

### 2.8 Menu / celular do jogo
- **Referências:** ref-07 (D1AL-ogue), VA-11 Hall-A (o celular da Jill é o menu do apartamento, com blogs e
  notícias), Mystic Messenger (chat em tempo real com NPCs), Coffee Talk (rede social Tomodachill com perfis
  que crescem com a amizade), Needy Streamer Overload (interface de OS com janelas e barras), Persona 5
  (menus muito estilizados e legíveis por cor de destaque única).
- **Copiar:**
  - Um aparelho em pixel com apps em grade, como a ref-07: Record, Pulso, Mensagens, Cartas, Vínculos,
    Casa, Mapa, Inventário, Ajustes. O DEVO já é um "smartphone"; o v2 só põe esse aparelho dentro do mundo.
  - Mensagens como Mystic Messenger: conversas com NPC em balões, escolha de resposta, NPC "digitando".
  - Rede social dos NPCs (Coffee Talk): posts que liberam mais perfis com o vínculo.
  - Player de música no topo (ref-07, VA-11 Hall-A jukebox) para a trilha que já existe em `lib/devo/audio.ts`.
  - Persona 5: **uma cor de destaque** no menu inteiro. No DEVO, o azul-cobalto (#1647ff) segue como a cor
    do sistema; o rosa/creme fica para o mundo.
- **Evitar:** menu sobre menu sobre menu; cada app abre em tela cheia e "voltar" sempre volta um nível
  (o `use-back-handler` atual continua).
- **Celular:** o aparelho ocupa a tela inteira quando aberto (o celular do jogo é o próprio celular do
  jogador). No desktop fica à esquerda e a cena à direita, exatamente como a ref-07.

### 2.9 Cartas e rito de invocação
- **Referências:** Danganronpa (trechos de fala destacados como alvo; o jogador "atira" a prova certa), DDLC
  (minijogo de poema por palavras), Persona 5 (fichas de Persona com atributos), Coffee Talk e VA-11 Hall-A
  (preparo por passos, receita visível).
- **Copiar:**
  - Ficha da carta com Peso, Natureza, Arquétipo e o bloco novo **Ritos de Invocação**: lista de **Gestos**
    (ícones do repertório, em ordem) e o **Cântico** da Coleção.
  - **Cântico com marca-texto por raridade** (pedido literal do dono: "até onde se estende a cor
    correspondente à raridade da sua carta"). O poema aparece inteiro, e a faixa colorida cobre só as linhas
    exigidas. Ao lado, "Básica / Média / Complexa" e o aviso de regra própria quando houver.
  - Taças reduz gestos e linhas: mostrar o que foi cortado riscado, não sumir (o jogador vê o ganho).
  - O "rito" como minijogo opcional ao invocar: tocar os gestos na ordem (ritmo de VA-11 Hall-A, receita à
    vista) e o texto do Cântico sendo "dito" na caixa de diálogo com o efeito de digitação. Errar a ordem
    leva ao **Recuo Paranormal** conforme as regras do dono.
  - **Recuo Paranormal:** a tabela 1–6 do dono entra literal numa página do manual. Valores ainda abertos
    ficam como estão: Lendária = **X**; Paus "um nível acima" = **x%**, "dois níveis acima" = **x%**
    (pendências do dono, sem número inventado).
  - Gestos como glifos pixel de 16×16 reaproveitados entre cartas (o dono diz que é um repertório
    compartilhado).
- **Evitar:** obrigar o minijogo em todo uso; cores de raridade que se confundem com as cores de sistema.
- **Celular:** carta no topo (frente/verso por toque), abas Efeito / Rito / Coleção embaixo. Cântico com
  rolagem própria e a faixa de cor sempre à esquerda das linhas.

### 2.10 Record / Deadly Vote
- **Referências:** Danganronpa (julgamento de classe: debate em que frases aparecem, trechos destacados e o
  jogador responde com provas; mais de uma pessoa falando ao mesmo tempo em versões mais difíceis), Persona 5
  (transição de "tomada" de cena), Needy Streamer Overload (painel de sistema com barras e relógio).
- **Copiar:**
  - Convocação como cartaz no celular, inscrição em um toque (função atual mantida).
  - Na mesa do Deadly Vote, os jogadores em retratos ao redor (Danganronpa põe cada um no seu pedestal) e as
    falas aparecendo em balões; cartas escolhidas respeitando o peso máximo atual.
  - Abertura e resultado com transição forte (Persona 5), uma vez por partida.
  - Record (ficha) em visual de "documento" do sistema, preto e cobalto, relógio de 72 h no pulso.
- **Evitar:** transformar o Deadly Vote em minijogo de reflexo; é jogo social e narrado, e a pressão vem do
  tempo, não da mira.
- **Celular:** mesa vista de cima com retratos em círculo; a fala ativa ocupa a metade de baixo.

### 2.11 Poço (gacha)
- **Referências:** Animal Crossing (presentes e loja com troca diária), Persona 5 (revelação com efeito de
  carta), DDLC (efeito "errado" de texto para momentos raros).
- **Copiar:** o Poço vira um lugar no mapa (um poço de pedra em pixel); a tiragem é uma animação curta
  (moeda cai, luz sobe, item aparece na mão do avatar em sprite e em ilustração). Raridade alta muda a cor da
  luz e a música por um instante. Agora vende também **presentes de Visitantes** (texto do dono).
- **Evitar:** sequências longas sem pular (toque duplo pula); esconder probabilidades.
- **Celular:** animação em retrato; botão "x1" e "x10" no rodapé; resultado em grade 2×5.

### 2.12 Torres de Ruptura
- **Referências:** Persona 5 (Mementos/Palácios com andares, cada um com tema), Rakuen (cada lugar ligado a
  um personagem), ref-04 (construção em corte).
- **Copiar:** a torre em **corte vertical** pixel, andares empilhados (como a ref-04 em pé). Cada andar mostra
  o custo em Essências que dobra (regra atual) e o NPC em destaque com retrato. Subir um andar = animação do
  avatar subindo a escada. Chaves das secundárias como objetos na estante do avatar.
- **Evitar:** mapa de torres desligado da cidade; as torres devem ser vistas no horizonte do mapa.
- **Celular:** torre em pé ocupa a tela; rolagem vertical sobe e desce os andares (gesto natural em retrato).

### 2.13 Salão das Máscaras
- **Referências:** Persona 5 (Velvet Room: sala fechada, anfitrião fixo, clima próprio), Coffee Talk (um
  salão onde as pessoas chegam e falam), Danganronpa (retratos em volta de uma mesa).
- **Copiar:** um interior em pixel com máscaras na parede e mesas; anúncios de recrutamento como cartazes
  pregados. Eventos com duração mostrada como relógio na parede.
- **Melhorias pedidas pelo dono (para aprovar):** Anfitrião ou acima autoriza direto dali, edita e escolhe
  "abrir agora no padrão de três dias"; Owner desfaz envio de recompensa com registro de quem desfez.
  Botões de equipe só aparecem para quem tem cargo, numa faixa separada embaixo.
- **Evitar:** misturar a fila de aprovação com o salão dos jogadores na mesma lista.
- **Celular:** salão em vista de cima; tocar num cartaz abre a ficha; faixa da equipe recolhível.

### 2.14 Companhia (Corporações)
- **Referências:** Persona 5 (grupo com esconderijo próprio), Stardew (centro comunitário que se completa
  com o tempo), Animal Crossing (avaliação da ilha por estrelas).
- **Copiar:** a Companhia tem uma sede no mapa que muda de aparência com o nível e com o lado **Honra x
  Necro** (ref-06 serve de base para a sede necro). Lista de membros como retratos em quadro na parede,
  cargos como placas. A doação de horas entre jogadores da mesma Companhia vira gesto no mundo (entregar
  ampulheta); doar a quem é de fora é crime e soma pontos necro (texto do dono). Tela de Caos e Ordem como
  balança de dois pratos no Record. O dono marcou essa parte como "em construção".
- **Evitar:** Necro só como número; a casa, os NPCs hostis e as Torres de Companhia devem reagir (dono).
- **Celular:** sede em vista única, lista de membros embaixo, painel do líder recolhível.

### 2.15 Mesa da equipe
- **Referências:** Needy Streamer Overload (painel de OS com janelas e barras), ref-08 (janela de "diário"
  com barra de tarefas), Persona 5 (menus densos mas legíveis por hierarquia de tamanho e cor).
- **Copiar:** a Mesa continua sendo ferramenta, não cena. Visual de **janela de sistema pixel** (ref-08),
  abas: Anúncios, Calendário, Convites, Casa (regras/receitas), Recompensas, Salão. Toda ação perigosa com
  confirmação e com "desfazer" para Owner (pedido do dono).
- **Evitar:** colocar a Mesa dentro do mapa; equipe precisa de rapidez. Um botão no celular do jogo basta.
- **Celular:** uma aba por vez, listas com filtro no topo (o filtro de recompensas atual continua).

---

## 3. Novatos e o Devo "tutorial"

Pedido do dono: o jogador novato só vê Devos do tipo **tutorial** até concluir um. Referência de forma:
Stardew e Animal Crossing abrem a cidade por etapas e explicam cada prédio quando ele abre. No mapa, os
prédios ainda trancados ficam com tapume e placa "Em breve", e o celular mostra os apps cinza com o motivo.
Owner e Anfitrião veem tudo liberado (regra atual).

---

## 4. O que não copiar de ninguém

- Telas em paisagem forçada (LISA fica em 4:3; muitos RPG Makers são 16:9). O v2 nasce em retrato.
- Jump scare constante e morte súbita (Witch's House, Corpse Party): fica reservado à Hostilidade.
- Quebra da quarta parede como truque recorrente (DDLC): no DEVO o sistema já fala com o jogador; usar
  com parcimônia.
- Excesso de texto em caixa alta e fontes pixel minúsculas (problema comum em ports para celular).
- Visual padrão do RPG Maker (tiles RTP): resenhas criticam até jogos bons por isso. Pacotes CC0/CC-BY servem de
  base, mas paleta, moldura e retratos precisam ser do DEVO.

---

## 5. Pendências deixadas pelo dono (não inventar)

- Dano-base da raridade **Lendária: X**.
- Redução de Paus "um nível acima": **x%**; "dois níveis acima": **x%**.
- Níveis de Taças que liberam cada redução: não informados.
- Valores de afinidade, romance, limites de presentes e chances de visita: não informados.
- Melhorias de casa por nível e skins: "ainda estamos discutindo".
- Caos e Ordem / pontos necro: "essa parte ainda está em construção".
- Pinterest do dono: sem acesso nesta sessão; aguardando links ou imagens.

---

## Fontes consultadas (busca de 31/10/2026)

- Amor Doce / My Candy Love: [TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/VisualNovel/MyCandyLove), [My Candy Love (Beemoov)](https://bafybeiemxf5abjwjbikoz4mc3a3dla6ual3jsgpdr4cjr3oz3evfyavhwq.ipfs.4everland.io/wiki/Beemoov.html), [loja](https://appgoblin.info/apps/515953991)
- Persona 5: [Digital Trends, Confidentes](https://www.digitaltrends.com/gaming/persona-5-romance-confidants-guide-tips/), [Mechanics of Magic, design visual](https://mechanicsofmagic.com/2022/04/23/visual-design-of-games-persona-5/), [Siliconera, palestra CEDEC](https://www.siliconera.com/?p=668266), [GamesRadar, menus](https://www.gamesradar.com/games/jrpg/persona-director-and-jrpg-veteran-says-the-amazing-menus-in-metaphor-refantazio-were-really-annoying-to-make-just-as-persona-5s-were-impossible-to-read-at-first)
- OMORI: [OMORI Modding Encyclopedia](https://sites.google.com/view/omori-modding-encyclopedia/home/sprites-art), [Nintendo Life](https://www.nintendolife.com/reviews/switch-eshop/omori), [Hardcore Gaming 101](https://www.hardcoregaming101.net/omori/)
- Needy Streamer Overload: [Wikipedia](https://en.wikipedia.org/wiki/Needy_Streamer_Overload), [wiki.gg](https://needystreameroverload.wiki.gg/wiki/Streams)
- Stardew Valley: [Gifts](https://stardewvalleywiki.com/Gifts), [Friendship](https://stardewvalleywiki.com/friendship)
- Coffee Talk: [Raider King](https://raiderking.com/coffee-talk-tokyo-review-brewing-a-good-time/), [eShop](https://ec.nintendo.com/AU/en/titles/70010000118953), [80.lv](https://80.lv/articles/how-coffee-talk-tokyo-expands-the-series-with-yokai-social-media-modern-tokyo)
- VA-11 Hall-A: [Wikipedia](https://en.wikipedia.org/wiki/VA-11_Hall-A), [Game Informer](https://gameinformer.com/games/va-11_hall-a/b/pc/archive/2016/07/02/va11-halla-review-game-informer), [Nintendo Wire](https://nintendowire.com/features/impressions-va-11-hall-a-on-switch/)
- Danganronpa: [StrategyWiki](https://strategywiki.org/wiki/Danganronpa:_Trigger_Happy_Havoc/Gameplay), [Gematsu V3](https://gematsu.com/2016/10/new-danganronpa-v3-introduction-trailer-nonstop-debate-lies-panic-debate-rebuttal-showdown-detailed), [Siliconera V3](https://www.siliconera.com/dangaronpa-v3-makes-class-trials-complex-frantic/)
- Doki Doki Literature Club: [TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/Recap/DokiDokiLiteratureClub), [Wikipedia (espelho)](https://ipfs.ssi.eecc.de/ipns/en.wikipedia-on-ipfs.org/wiki/Doki_Doki_Literature_Club!)
- Animal Crossing: [Nookipedia, Camping](https://www.nookipedia.com/wiki/Campsite_(New_Leaf)), [Nintendo Wire](https://nintendowire.com/guides/animal-crossing-new-horizons/campsite/), [Game8](https://game8.co/games/Animal-Crossing-New-Horizons/archives/285110)
- The Witch's House / Ib: [RPG Site](https://www.rpgsite.net/review/7961-the-witch-s-house-mv-review), [Tales from the Backlog](https://talesfrombacklog.blogspot.com/2016/10/review-double-shot-ib-and-witchs-house.html), [vgdb](https://vgdb.co/games/the-witch-s-house)
- LISA, Rakuen, To the Moon: [RPGFan LISA](https://www.rpgfan.com/review/lisa-definitive-edition/), [Gamingtrend LISA](https://gamingtrend.com/feature/reviews/lisa-the-painful-the-joyful-definitive-edition-review-an-exercise-in-pain/), [OpenCritic Rakuen](https://opencritic.com/game/4321/rakuen/reviews), [GameStar Rakuen](https://www.gamestar.de/artikel/rakuen,573_138/), [GamesXtreme To the Moon](https://www.gamesxtreme.com/article/5944/to-the-moon-review)
- Yume Nikki: [Wikipedia](https://en.wikipedia.org/wiki/Yume_Nikki), [Hardcore Gaming 101](https://www.hardcoregaming101.net/yume-nikki/)
- Sem fonte confirmada nesta busca (uso de conhecimento geral, só padrões de interface): Mystic Messenger,
  Corpse Party, Ib (detalhes de esconderijo).
