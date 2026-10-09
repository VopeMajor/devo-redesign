# Crítica — rodada 2 (Entrada r4, Sistema r2, Sala de Jogos r2, Record r1, Cartas r1, Sala de Trocas r1b)

Régua desta rodada (Direção 2 §6 e §7): não basta média 4. Só aprova o que estiver no nível de um jogo
AAA lançado (composição de Persona 5 Royal, tensão de Danganronpa V3, polimento de Honkai: Star Rail) e
fiel à referência-mestra de cor `refs/ref-xadrez-marmore.png`. Sprites de NPC (Melissa, Javali, Herdeiro,
Rato, Coruja) não são avaliados como bloqueador.

Fontes: `/home/claude/cap-redesign` (integrada), `/home/claude/cap-area-cartas`, `/home/claude/cap-area-trocas`,
antes em `/home/claude/shots-base`. `typecheck.log` vazio nas três pastas. Console: só o 404 de
`/_vercel/insights/script.js` (ambiente). `manifest.json` da integrada registra **4 erros de roteiro**:
`partida-memory-rush` e `partida-bomba-quente` não acham o botão "Sala de Jogos" por nome acessível;
`partida-living-chess` e `partida-blefe` não acham "Jogar" dentro de "Jogos da semana". As capturas das
partidas reais (fila → jogo) não existem nesta rodada.

Veredito geral: **todas as seis áreas REPROVADAS** pela régua alta. Cartas r1 e o corredor da Sala de Trocas
são os pontos mais próximos do patamar; o resto ainda carrega a paleta antiga (cobalto/índigo, vinho de fundo,
cartas laranja).

---

## ENTRADA

```
ÁREA: Entrada   RODADA: 4   VEREDITO: REPROVADO
NOTAS: 1=4 2=3 3=4 4=3 5=3 6=3 7=4 8=4  (média 3,5)
BLOQUEADORES:
- 04-tutorial-02 / 04-tutorial-07 (e Record, Trocas): moldura das cartas antigas (laranja, sol no topo, lua na
  base, nome em faixa-pergaminho) lembra de perto o desenho das cartas Clow de Cardcaptor Sakura. Mesmo que a
  arte seja do dono, a moldura é reconhecível e está fora da paleta. Substituir pela carta nova da área Cartas
  (r1), que já é original e está na paleta.
```
O que melhorou: 03-prologo-00/07 ganharam cena (feixe de luz, mostrador, sigilo); 02-acesso pede os dois nomes
e o papel cabe na tela; 03-prologo-aparencia(-auto) implementa a escolha 2D/3D × Real e Seleção automática;
05-sala-de-jogos-revelacao ficou limpa, sem o ouro chapado.

CORREÇÕES:
1. **04-tutorial-02, 04-tutorial-07:** cartas laranja com arte cobalto. Problema: são o elemento mais saturado da
   jornada inteira e contradizem a ref de mármore. Fazer: usar a mesma carta em gravura prata da área Cartas
   (moldura de aço, arte em P&B, ametista só nas raras). No "KABUM!", trocar o letreiro azul/branco por branco com
   contorno negro e um corte rubi curto.
2. **04-tutorial-00:** caixa do narrador em gradiente bege com texto branco (contraste perto de 3:1) e bordas
   borradas (parece um quadro capturado no meio do fade). Fazer: mesma caixa negra das falas seguintes, ou
   porcelana com texto negro. Nunca branco sobre bege.
3. **04-tutorial-fim:** o dígito dos segundos do TimeDigits aparece com dois algarismos sobrepostos ("4 6/5" com um
   traço por baixo). Isso já tinha sido dado como resolvido. O mesmo acontece em 20-record-deadly-votes
   ("23:53:11"). Fazer: o dígito em troca não pode deixar fantasma nem traço visível em nenhum quadro da
   animação. Também é a primeira imagem do sistema que o jogador vê.
4. **04-tutorial-fim:** toast "PULSO SINCRONIZADO" em rubi. Uma confirmação positiva não é alerta. Além disso, ele
   cobre o texto do card "Último aviso" e encosta no dock. Fazer: toast em ink com filete de aço e ícone prata,
   posicionado abaixo do cabeçalho. Retardar até o cartão "Tempo restante" terminar de entrar.
5. **01-landing / 90-desktop-landing:** cerca de 37% da tela em índigo/violeta (mostrador #2a283a, halo #3c3c6c,
   faixa atrás de "VOTE", botão Começar #282848→#383868). Fazer: céu do mostrador em cinza-grafite com só um halo
   violeta discreto. Botão primário em porcelana/aço (texto negro) com borda de ametista ao foco. A faixa atrás de
   "VOTE" vira um veio de mármore cinza ou some.
6. **03-prologo-12 a 24:** placa de nome "MELISSA" e "DEVO · SISTEMA" em bloco violeta (#584888). Fazer: placa negra
   com filete de aço e o nome em porcelana. Ametista só num losango pequeno. Aplicar o mesmo nas placas do
   Herdeiro e do Rato no tutorial (04-tutorial-01…08).
7. **03-prologo-11 a 24:** a mina ocupa cerca de 42% da tela em marrom-alaranjado (#362515). Isso combina com a cena,
   mas destoa do resto da jornada. Fazer: graduar a mina para sépia quase neutra (pedra cinza-quente) e deixar o
   calor só no foco da lanterna. Assim Melissa passa a ser a única mancha de cor do quadro.
8. **03-prologo-01/02 vs 03-prologo-04/05:** há duas caixas de diálogo diferentes no mesmo prólogo (papel creme
   pautado × vidro negro). Fazer: uma só linguagem por ato (por exemplo, papel no ato "Rumor" e vidro negro do ato
   II em diante), com uma transição explícita entre elas, que hoje não existe.
9. **03-prologo-06:** o fogo é feito de triângulos chapados vermelho/laranja, muito abaixo da qualidade das cenas
   vizinhas (03-prologo-05, 03-prologo-09). Fazer: chamas em gravura P&B com brasas rubi pequenas, no mesmo
   tratamento de 03-prologo-03 (tesoura em gravura).
10. **03-prologo-19:** celular em retângulo arredondado genérico, com o centro vazio. Fazer: o aparelho como objeto
    do mundo (vidro facetado, moldura de aço, reflexo do mostrador), com o sigilo acendendo e não apenas parado.
11. **04-tutorial-02/04/05:** o terço entre a figura e a caixa de fala fica vazio (cerca de 200 px de mostrador
    escuro). Fazer: subir a caixa de fala ou ancorar o selo "SISTEMA APRESENTADO" logo abaixo da figura, como
    legenda, e não colado à fala.
12. **03-transicao-deadly-vote:** cortina inteira em vinho (#180609, 54% da tela). Fazer: manter o rubi só no anel
    do mostrador e num corte diagonal. O fundo fica em mármore negro. Hoje é o maior bloco vermelho da jornada e
    gasta o vermelho antes do primeiro alerta real.

Jornada como sequência (02-acesso-preenchido → 02-transicao-acesso → 03-transicao-despertando → 03-prologo-00…24 →
03-transicao-deadly-vote → 04-tutorial-00…08 → 04-tutorial-09/fim → 04-tutorial-pwa → 05-revelação): o fio narrativo
agora é contínuo, e "Assinar" leva ao "Despertando" e daí ao prólogo. Há três quebras de linguagem: (a) papel creme →
vidro negro dentro do prólogo; (b) mina marrom → salão cinza do tutorial sem ponte visual (falta um corte
"subindo à superfície"); (c) as cartas laranja do tutorial, que reaparecem na home e no Record como se fossem de
outro jogo. A fronteira noite → papel prometida na Direção 2 §2 (folha sendo impressa) não aparece: 04-tutorial-09
cai direto na home escura.

---

## SISTEMA (shell, home, avisos, Pulso, Mensagens, Ajustes, desktop)

```
ÁREA: Sistema   RODADA: 2   VEREDITO: REPROVADO
NOTAS: 1=4 2=3 3=3 4=3 5=3 6=4 7=4 8=3  (média 3,4)
BLOQUEADORES:
- manifest.json: o roteiro não encontra o botão "Sala de Jogos" pelo nome acessível (passos partida-memory-rush e
  partida-bomba-quente). Ou o nome acessível do ícone mudou com o emblema, ou algo cobre o botão. Função de
  abrir app precisa ser comprovável, e as capturas de partida dependem disso.
```
O que melhorou: os emblemas (10-home) estão sem ladrilho, em prata, da mesma família, e são originais (não copiam a
ref). O miolo da home agora tem função ("Próxima convocação", "Mesa aberta"). 11-transicao-voltar está opaco. Em
22-mensagens-* sobrou uma seta só. Em 25-ajustes a Sessão virou o bloco ornado.

CORREÇÕES:
1. **10-home-avisos / 10-home-avisos-lista:** a folha da central é azul-marinho (#080818, 25% da tela). Superfície
   azul é proibida (IDENTIDADE §0 regra 1). Fazer: mármore negro #151517 com veio cinza e filete de aço. O
   estado vazio "Silêncio. Por enquanto." é bom e deve ser mantido.
2. **21-pulso / 21-pulso-excedente / 25-ajustes-reiniciar-pulso:** cerca de 20% da tela é anel e fundo
   índigo-violeta (#585888 / #181828), e a régua de reserva também é toda violeta. Fazer: anel e ticks em aço
   champanhe, mostrador em mármore negro, ametista só no ponteiro e no ponto "agora". A régua de reserva fica
   prata, e o vermelho entra só abaixo de 6h (21-pulso-critico já está correto).
3. **10-home / 04-tutorial-09:** o mesmo anel violeta grosso (#3a345b) no cartão "Tempo restante", e o chip
   "ESTÁVEL" em bloco violeta. O cartão em si tem tom taupe amarronzado (#413d3a), que lembra mais bronze do que
   mármore. Fazer: tampo em mármore negro ou porcelana com veio, anel de aço, chip "ESTÁVEL" em contorno prata com
   ponto ametista.
4. **10-home:** dois emblemas não pertencem à mesma família de traço. Ajustes (bússola cheia, pesada) e Mensagens
   (asas largas) pesam o dobro de Sala de Trocas (chaves de linha fina) e Cartas. Fazer: normalizar peso de linha,
   área ocupada e remates em losango. Nenhum emblema deve parecer mais "cheio" que outro na grade.
5. **10-home:** a carta flutuante do fundo à direita corta a borda e passa atrás do rótulo "SALA DE JOGOS"
   (10-home e 10-home-critico). Fazer: manter as cartas do fundo fora da coluna dos ícones, ou atenuá-las abaixo
   de 15% de opacidade nessa faixa.
6. **22-mensagens-conversa / -resposta / 28-mensagens-herdeiro:** o fundo da conversa é violeta (21% da tela) com a
   marca d'água do NPC. As opções de pergunta e o balão "você" são blocos índigo (#282838 / #2a2a5c). Fazer: fundo
   mármore negro, balão do jogador em porcelana com texto negro, opções em ink com numeral de aço. Ametista só na
   opção sob foco.
7. **21-pulso-critico:** o toast "CORUJA ENTROU EM CONTATO" cobre a linha de estatísticas (Cartas/Trocas/Jogos
   cortados pela metade). Fazer: toast só no topo, abaixo da barra de status. Regra do shell para todos os apps.
8. **10-home-critico:** cerca de 45% da tela vai a vermelho (#3f1b21), da home inteira ao fundo. O crítico deve
   cortar a tela como alerta, e não pintar a home. Fazer: vermelho no cartão do tempo, na barra de status e numa
   faixa diagonal. Fundo continua mármore negro com pulsação de vinheta rubi.
9. **11-transicao-abrir / 11-transicao-voltar:** as duas capturas mostram o estado final, então não provam direção
   nem ritmo. Fazer: recapturar a ~40% da animação (abrir entra pela direita com corte diagonal, voltar sai para a
   direita).
10. **25-ajustes / 25-ajustes-scroll:** blocos "Aplicativo" e "Sistema" com o mesmo peso, e chips "NÃO INSTALADO" /
    "BLOQUEADAS NO NAVEGADOR" de 9–10 px muito apagados. Fazer: chips ≥ 11 px em prata, e uma linha de ação clara
    ("Instalar" / "Como liberar") no lugar do texto corrido.
11. **25-ajustes-reiniciar-confirmar:** dois blocos vermelhos empilhados (Sessão com halo rubi e caixa de
    confirmação rubi). Fazer: o bloco Sessão fica em ink e só a caixa de confirmação vira rubi.
12. **92-desktop-os:** área de trabalho vazia, com colunata cinza e nenhum foco. Na janela (92-desktop-janelas) há
    um grande "DEVO" esmaecido no centro. Fazer: o mesmo salão do relógio da jornada como papel de parede (mostrador
    ao fundo e piso de mármore), com o widget do tempo ancorado.

---

## SALA DE JOGOS

```
ÁREA: Sala de Jogos   RODADA: 2   VEREDITO: REPROVADO
NOTAS: 1=4 2=3 3=4 4=3 5=2 6=3 7=3 8=3  (média 3,1)
BLOQUEADORES:
- 32-tutorial-bomba-quente-a/b/c: a moldura de entrada continua roxo/amarelo, em sans arredondada e girada 90°
  (correção 4 da rodada 1 não feita). É a única tela do produto sem nenhum token DEVO.
- manifest.json: as quatro capturas de partida (fila → jogo) falharam. A função "Jogar" não está comprovada
  nesta rodada.
```
O que melhorou: o seletor de valor da aposta voltou (31-jogos-apostas, 31-jogos-apostas-folha). O cartaz "Duelo da
Casa" (30-jogos-mesa) tem foco claro e escala dramática. A derrota de treino não usa mais vermelho total
(32-tutorial-living-chess-c). O cabeçalho é o do shell.

CORREÇÕES:
1. **31-jogos-apostas-folha:** o lado escolhido (Ísis) é um bloco cobalto saturado (#0c246c → #131b3f), resto da
   paleta antiga. O chip "15min" selecionado está em rubi. Fazer: lado escolhido em porcelana (ou negro com borda de
   aço e halo ametista) e chip selecionado em branco/prata. Rubi só no "−15min" e no botão "Confirmar", que de fato
   arrisca Tempo.
2. **31-jogos-apostas-duelos / 30-jogos-mesa-scroll2 / 31-jogos-apostas:** os confrontos são azul × ouro (#212542 ×
   #241c0e). O motivo do DEVO é o xadrez, então os lados devem ser **mármore negro × mármore branco**, com o "VS" em
   losango de aço. Isso é mais forte, mais próprio e cumpre a ref.
3. **32-tutorial-living-chess-c:** faixa diagonal índigo (#24246c, cerca de 12% da tela) atrás de "DERROTA". Fazer:
   faixa em mármore negro com veio de aço. Se for derrota que custa Tempo, rubi. O carimbo "TREINO" pode ficar em
   ametista.
4. **32-tutorial-living-chess-a/b:** o tabuleiro é de madeira marrom/creme (#856046, 19% da tela). É o momento em
   que a ref de mármore deveria brilhar. Fazer: casas de mármore negro/branco com rejunte de aço (o material
   `dv-checker-marble` já existe). Segue também o texto sobre texto "PARTIDA… / JAVALI (TUTORIAL)" no topo
   (correção 3 da rodada 1). Separar o selo do nome. (O miolo é da área Partidas; a cobrança é de coordenação.)
5. **32-tutorial-blefe-a/b/c:** mesa em feltro índigo (#231f47, 41% da tela) com borda dourada amarela. Fazer: tampo
   de mármore negro com borda de aço e luz de lanterna. O baralho branco funciona bem sobre isso.
6. **31-jogos-ranking:** o fundo é uma imagem 3D pixelada (bordas serrilhadas no rei e nas cartas) e o texto
   "Semana… / Reinicia toda segunda / RESET EM 2D8H" está direto sobre casas brancas, com a mancha de fumaça
   cobrindo "2d". Fazer: imagem em resolução @2x ou procedural, texto dentro de um painel negro e o reset no mesmo
   TimeDigits do topo.
7. **31-jogos-ranking-jogo:** a base do pódio continua cortada pela dobra (correção 9 da rodada 1). Fazer: pódio
   inteiro acima de 844 px ou cartão de patente mais baixo.
8. **31-jogos-ranking / 31-jogos-ranking-jogo:** o 3º lugar é bronze/cobre (#b87848). Fazer: aço escuro (#6b6357)
   com numeral III, e prata clara no 2º. A hierarquia vem do tamanho e da luz, não de bronze.
9. **Todas (30-*, 31-*, 33-*):** o rótulo "RESET DO RANKI…" está truncado em todos os quadros. Fazer: "RESET" ou
   "RANKING ZERA EM", sem reticências.
10. **27-javali-0…3 / 34-javali-0…3:** a pílula "SEU TEMPO" é um bloco cobalto (#182868). Dentro da moldura, a metade
    inferior é uma faixa borrada cinza sem conteúdo (a imagem não preenche o quadro). Fazer: pílula em ink com
    filete de aço. Enquadrar o retrato para ocupar o quadro, ou trocar a faixa borrada pela mesa de mármore com o
    relógio.
11. **30-jogos-mesa:** o Javali aparece cortado no rodapé (só o topo da cabeça), "espiando" sem intenção. O cartaz
    "Duelo da Casa" tem um quarto direito vazio ao lado do contador. Fazer: retrato inteiro dentro de um
    `PortraitFrame` pequeno ao lado da fala, e "Prêmio" subindo para ao lado do contador.
12. **33-jogos-fila:** o radar de busca tem um setor violeta grande e o ícone do Memory Rush é uma foto pequena. Fazer:
    setor em prata translúcida, com o emblema do jogo em linha (mesma família dos emblemas de app) no centro.

---

## RECORD

```
ÁREA: Record   RODADA: 1   VEREDITO: REPROVADO
NOTAS: 1=4 2=3 3=3 4=3 5=2 6=4 7=4 8=4  (média 3,4)
BLOQUEADORES:
- 20-record-scroll / 20-record-shuffler: as cartas antigas (moldura laranja reconhecível, ver Entrada) aparecem no
  inventário do Record.
```
O que está bom: a ficha em papel (20-record) com clipe, polaroide, carimbo e "VETERANO" em display é a melhor
composição do interior. O cartaz "CONVOCAÇÃO" (20-record-deadly-votes) tem escala de Persona. Dealer, convites,
resultados, dossiê, foto e shuffler estão presentes (MAPA ok).

CORREÇÕES:
1. **20-record / -deadly-votes / -convites / -dossie / -foto:** o app inteiro fica sobre fundo vinho (#180808 →
   #280808, 16–22% da tela). É vermelho decorativo permanente e quebra a regra mais clara da paleta. Fazer: fundo em
   papel frio (#e9e8e5) com retícula, como manda a Direção 2 §2 para o interior, ou mármore negro. Vermelho só no
   badge "1" e em estados de alerta.
2. **20-record / 20-record-foto:** o placeholder da foto é um degradê cobalto (#182868 → #1d1e3b). Fazer: silhueta
   cinza sobre mármore negro, com o carimbo em tinta grafite.
3. **20-record:** a faixa "ARQUIVO CONFIDENCIAL" e o chip "ATIVO" são blocos ametista largos (#7f78a6 / #a39ebb no
   papel). Fazer: faixa em tinta negra (#1c1c1f) com texto branco, como o bloco ativo do papel definido em
   IDENTIDADE §0. Ametista só num losango.
4. **20-record-scroll / 20-record-shuffler / 20-record-arquivo:** o Card Shuffler é um mostrador de ouro amarelo com
   olho azul elétrico (#1647ff-like) e cartas laranja. Fazer: mostrador de aço, olho em prata com íris ametista,
   cartas no verso novo (estrela prata) da área Cartas.
5. **20-record-deadly-votes:** "23:53:11" com traço/fantasma sob o último "1" (mesmo defeito do TimeDigits citado na
   Entrada).
6. **Botões primários (20-record-deadly-votes "INSCREVER-SE", -convites "GERAR", -dossie, -foto-ajuste "SALVAR FOTO"):**
   gradiente violeta pesado (#3c3c6c → #545484). Fazer: primário em porcelana/aço com texto negro. Ametista só como
   halo de foco.
7. **20-record-dealer-convocar:** o botão "CONVOCAR DEADLY VOTE" desabilitado tem texto que quebra em duas linhas
   dentro do losango. Os campos são cinza genéricos, sem tratamento de formulário do papel (pauta, rótulo
   mono). Fazer: rótulo curto ("CONVOCAR") e campos no padrão de 02-acesso.
8. **20-record-dealer-resultados:** o seletor de estado (Convocado/Em progresso/Concluído/Cancelado/Falha) em 5 chips
   iguais quebra em duas linhas sem hierarquia. Fazer: linha do tempo de status (ponto → ponto) como na ref do
   Record mobile, com o estado atual em bloco negro e "Falha" em rubi só quando escolhido.
9. **20-record-arquivo:** a lista de casos é boa, mas o "CASO 002" usa plaquetas porcelana sobre fundo vinho, sem
   respiro. Fazer: linha do tempo da ref (data à esquerda, ponto, nome, status à direita) sobre papel.
10. **20-record (rodapé):** Cartas/Trocas/Avisos encostam no corte inferior da folha sem margem. Fazer: 24 px de respiro
    e borda inferior da folha visível (rasgo ou serrilha de papel), para a folha "terminar".
11. **20-record (abas):** as abas "RECORD FILE / DEADLY VOTES / CONVITES" em serifada clara sobre vinho, com o
    indicador violeta. A ref pede aba ativa em bloco. Fazer: aba ativa em bloco negro (ou porcelana sobre negro),
    inativas em cinza.
12. **20-record-foto-ajuste:** o modal tem fundo violeta escuro e slider ametista longo. Fazer: modal em mármore negro,
    slider prata com cabeça ametista pequena.

---

## CARTAS (cap-area-cartas, r1)

```
ÁREA: Cartas   RODADA: 1   VEREDITO: REPROVADO (perto do patamar)
NOTAS: 1=4 2=3 3=4 4=3 5=4 6=3 7=4 8=4  (média 3,6)
BLOQUEADORES: nenhum
```
O que está no patamar: a nova carta em gravura P&B com moldura de aço (23-cartas, 23-cartas-detalhe-ficha) é a
peça mais fiel à ref de mármore em todo o projeto: neutra, ametista só na rara, e original. O Compêndio em papel
com régua de HUD e as aulas da Coruja com raridade em losangos (26-coruja-03/07) estão corretos. Esta carta deve
virar o padrão global (tutorial, Record, Trocas).

CORREÇÕES:
1. **23-cartas / 23-cartas-scroll / 23-cartas-lendarias:** os títulos dentro das miniaturas têm espaçamento quebrado e
   sem acento: "O RELOGIO PARADO", "OLHO QU E TU DO VÊ", "MOEDA DE DU AS", "AMPU LHETA". Fazer: corrigir o
   tracking (o mesmo defeito do "s" da rodada 1 voltou neste componente), manter os acentos e deixar o nome ≥ 10 px
   efetivos ou removê-lo da miniatura (já está embaixo, fora da carta).
2. **23-cartas (topo):** o código "DV_R571_5590" se sobrepõe à régua e ao "16" (um bloco preto cobre o
   sublinhado). Fazer: código numa linha própria ou régua mais curta.
3. **23-cartas-detalhe / -verso / 26-coruja-*:** o fundo de mármore negro tem veios amarelados (#383828 / #382818) em
   alto contraste, que parecem raios elétricos sobre base azulada (#1a1a26). Fazer: veios cinza (#8f8e8b) suaves e
   difusos, base neutra #151517, e um único veio de aço fino. Hoje é o "mármore de stock" mais do que o da ref.
4. **23-cartas / Compêndio:** o "10" em Cinzel lê como "IO" ("IO / 16"). Fazer: numeral em mono/display tabular, ou
   numeral romano de verdade (X / XVI).
5. **23-cartas (filtro de raridade):** a aba ativa "TODAS" tem um halo violeta borrado que vaza para fora do
   bloco. Fazer: bloco negro limpo e halo só no foco por teclado.
6. **23-cartas-detalhe-girando:** a captura mostra o verso já pronto, sem prova de giro. Fazer: capturar a meio-giro
   (carta em perspectiva, brilho de aço passando).
7. **23-cartas-colecoes:** o Card Shuffler dentro de Cartas ainda é o mostrador de ouro amarelo com olho azul e
   cartas laranja (mesmo componente do Record). Fazer: atualizar junto (aço, íris ametista, verso novo).
8. **26-coruja-01:** a Coruja ocupa o quadro inteiro e a caixa de fala sobrepõe o retrato sem corte de base. Fazer:
   base do retrato dissolvida no `PortraitFrame` antes da caixa.
9. **26-coruja-03/05:** o painel de raridades fica por cima da Coruja em transparência, e os dois se leem ao mesmo
   tempo (rosto atrás dos losangos). Fazer: painel opaco ou Coruja recuada e escurecida a ≤ 20%.
10. **26-coruja-07:** o botão "RESPONDA" desabilitado está cinza claro sobre cinza e quase some. Fazer: estado
    desabilitado em contorno prata a 50% com texto legível.
11. **23-cartas-detalhe-ficha:** "Congela seu pulso por 12 horas." está em sans regular, enquanto o resto da ficha é
    serifada/mono. Fazer: a linha de função na serifada do corpo, ou mono, com um destaque de aço no número.
12. **Miniaturas (23-cartas):** "× I CÓPIA" em numeral romano é bonito, mas a 9–10 px fica no limite. Fazer: ≥ 11 px.

---

## SALA DE TROCAS (cap-area-trocas, r1b)

```
ÁREA: Sala de Trocas   RODADA: 1b   VEREDITO: REPROVADO
NOTAS: 1=4 2=3 3=4 4=3 5=3 6=4 7=4 8=4  (média 3,6)
BLOQUEADORES:
- 24-trocas-sala, -negociando, -aceitou, -sem-retorno, -perdeu: cartas antigas laranja e verso violeta com sol
  dourado (mesma moldura reconhecível). Depende de adotar a carta da área Cartas.
```
O que está no patamar: o corredor com portas em arco de aço, numerais serifados e chão xadrez (24-trocas) é a
melhor tela do interior em paleta (98–99% neutra) e em atmosfera. O protocolo (24-trocas-scroll) é claro.

CORREÇÕES:
1. **24-trocas-sala-negociando / -aceitou / -frase / -sem-retorno-perdeu:** o verso da carta do outro jogador é
   violeta com sol dourado, e a sua carta é laranja com arte cobalto. Fazer: verso novo (estrela prata em mármore
   negro) e frente em gravura, iguais aos de Cartas r1.
2. **24-trocas-sem-retorno-perdeu:** um texto-fantasma "SAI ^" aparece cortado abaixo do cabeçalho (resto de
   animação/rótulo). Fazer: remover. Nenhum texto parcial pode ficar visível.
3. **24-trocas-sem-retorno / -perdeu / -confirmar:** o fundo da sala "Sem retorno" é vinho (#320d11, até 27% da tela),
   mesmo antes de o jogador perder algo. Fazer: sala em mármore negro com uma faixa diagonal rubi na regra. A tela
   inteira só pulsa em rubi no instante da perda (-perdeu), e por menos de 1 s.
4. **24-trocas-sala-negociando / -aceitou:** o toast "SALA DE TROCAS / Sala de Trocas" repete o nome do app e não
   diz nada, e cobre o Canal da Sala. Fazer: toast com conteúdo ("Jogador #4888 aceitou") ou nenhum.
5. **24-trocas-sala-negociando:** o Canal da Sala abre vazio, com 150 px de painel em branco antes das frases
   prontas. Fazer: estado vazio com uma linha ("Ninguém disse nada ainda.") e as frases prontas já visíveis.
6. **24-trocas / 24-trocas-sala:** o espaçamento quebrado em "Nem a raridade" lê "Nema raridade". Fazer: corrigir o
   espaço (mesmo defeito de tracking de Cartas).
7. **24-trocas:** as portas terminam num corte reto sobre o texto das regras, sem soleira nem reflexo no piso. Fazer:
   soleira de aço e reflexo leve no xadrez, e as regras da porta numa plaqueta abaixo, sem colar no arco.
8. **24-trocas:** a barra de progresso "5 de 8 salas" usa um segmento ametista solto no meio da linha. Fazer: segmentos
   por sala (8 ticks), livres em prata, ocupadas apagadas.
9. **Botões primários ("ACEITAR TROCA", 24-trocas-sala-negociando):** gradiente violeta largo. Fazer: porcelana/aço
   com texto negro (mesma regra das outras áreas). O estado "aceito" (24-trocas-aceitou) fica em ink com check prata.
10. **24-trocas-sala:** o carrossel "Escolha a carta que vai à mesa" corta a última carta na borda direita sem
    indicar rolagem. Fazer: fade lateral e contador "1 / 9".
11. **24-trocas-sem-retorno-confirmar:** o diálogo é bom, mas o rótulo "SALA 03 · SEM RETORNO" em rubi de 10 px sobre
    vinho fica fraco. Fazer: rótulo em porcelana com losango rubi.
12. **24-trocas-sala-frase:** os balões do jogador em violeta e as frases prontas em chips cinza de alturas
    diferentes. Fazer: chips de altura única, em 2 colunas, com o balão do jogador em porcelana.

---

## Paleta — o que falta para bater `ref-xadrez-marmore.png`

Método: amostragem PIL de cada captura (redução 1/6, classificação por matiz com S > 0,18). A ref dá **100%
neutro** (pretos #1e1f21–#4f4f4f, brancos #cecece–#f6f5f3, veios #797c81, aço #968c82→#ebe1d8). As telas
abaixo são as que mais se afastam disso.

| Onde | Encontrado | Esperado (IDENTIDADE §0) |
|---|---|---|
| Cartas antigas (04-tutorial-02/07, 20-record-scroll, 23-cartas da integrada, 24-trocas-*) | moldura #e49c3c / #e48424 / #b48041; arte cobalto #0f1121 (até **62% azul** em 23-cartas integrada) | aço #bab09f, gravura P&B, ametista #8a7cc8 só na rara (já feito em Cartas r1) |
| Botões primários (Começar, Inscrever-se, Jogar, Aceitar troca, Responder, Assinar) | gradiente #282848 → #383868 → #545484 | porcelana #f1f0ee / aço #bab09f com texto #0c0c0e; ametista só em halo de foco |
| Placas de nome do diálogo (Melissa, Herdeiro, Rato, Sistema) | #584888 / #483878 | negro #151517 + filete aço, nome em porcelana |
| Fundo do Record (todas as abas) | vinho #180808 / #280808 (16–22%) | papel frio #e9e8e5 (interior) ou mármore negro #0c0c0e |
| Foto do Record, pílula "Seu tempo" do Javali, lado "Ísis" da aposta | cobalto #182868 / #0c246c | negro #1c1c1f com borda aço |
| Central de avisos | marinho #080818 (25%) | #151517 com veio |
| Pulso (anel, mostrador, régua) | #585888 / #181828 (20%) | anel aço, mostrador #1f1f22, ametista só no ponteiro |
| Mensagens (fundo, opções, balão) | violeta #1b1924 (21%) + índigo #282838 | #151517; balão porcelana |
| Confrontos de aposta | azul #212542 × ouro #241c0e | mármore negro × mármore branco |
| Derrota de treino (Living Chess) | faixa #24246c | mármore negro + veio aço |
| Blefe | feltro #231f47–#483888 (41%) | mármore negro com borda aço |
| Bomba Quente (moldura) | #4d346d + amarelo #eac03f (85%) | tokens DEVO |
| Tabuleiro Living Chess | madeira #856046 (19%) | `dv-checker-marble` |
| 3º lugar no ranking | bronze #b87848 / #d8a868 | aço escuro #6b6357 |
| Mármore de Cartas/Coruja | veios amarelados #383828 / #382818 sobre #1a1a26 | veios #8f8e8b difusos sobre #151517 |
| Mina do prólogo | marrom #362515 (42%) | sépia quase neutra, calor só na lanterna |
| Landing | índigo/violeta 37% (#2a283a, #3c3c6c) | grafite com halo violeta discreto (noite só atmosfera) |
| Vermelho estrutural | 10-home-critico 45%, 03-transicao-deadly-vote 54%, Trocas "Sem retorno" 18–27% | rubi em faixas, anéis e selos; nunca o fundo inteiro fora do instante do alerta |

Telas que já batem a ref (≥ 95% neutro, só acento pequeno): 02-acesso-cadastro, 03-transicao-despertando,
05-sala-de-jogos-revelacao, 10-home (exceto o anel), 22-mensagens (lista), 24-trocas, 24-trocas-scroll, 23-cartas*
(r1), 26-coruja-07…18 (r1), 30-jogos-mesa-chat, 31-jogos-ranking-scroll.

Conclusão: o problema de paleta agora não está nos tokens, e sim em **componentes que não herdam os tokens**: carta
antiga, botão primário, placa de nome, anel do Pulso/home, Card Shuffler, confrontos de aposta e fundos pintados à
mão (Record, avisos, Mensagens). Trocar esses sete componentes resolve cerca de 80% da distância até a ref.

## Ícones dos apps × `ref-emblemas-icones.png`
- Atendem: sem fundo nem ladrilho, prata, simetria, estrela de 4 pontas como remate, e são originais (nenhum
  reproduz os emblemas da ref, que são de terceiros e só servem de estilo).
- Faltam: (1) peso uniforme, porque Ajustes e Mensagens estão pesados e Trocas e Cartas finos; (2) o refinamento da
  ref (remates em agulha, filetes duplos, pequenos recortes vazados), já que Cartas e Sala de Jogos (coroa) estão
  simples demais e a coroa de 05-revelação é quase um ícone genérico; (3) os emblemas dos 6 sistemas futuros não
  aparecem em nenhuma captura de interior (só no /estilo). Mostrá-los como bloqueados (cadeado + estrela) na
  home ou no dock.

## Elementos que parecem de terceiros (fora os sprites de NPC)
1. **Moldura das cartas antigas**: laranja, sol no topo, lua na base, nome em faixa. Lembra de perto as cartas Clow
   (Cardcaptor Sakura). Aparece em tutorial, Record, Shuffler e Trocas. Substituir pela carta de Cartas r1.
2. **03-prologo-05 (Morte de cartola com crânio de carneiro)**: raster muito acabado, de origem não documentada. Não é
   NPC listado na Direção 2 §1. Confirmar autoria com o dono.
3. **31-jogos-ranking (fundo 3D pixelado)** e **30-jogos-mesa (banner do xadrez vermelho com relógio de bolso)**:
   origem não documentada. Registrar a fonte ou gerar procedural.
4. Os exemplos de aparência "Eren Yeager" e "Spike Spiegel" (03-prologo-aparencia/-auto) são só texto, o que é
   aceitável pela função. Ainda assim, a lista automática deve evitar exibir arte desses personagens.

## Coesão entre áreas
1. **Uma carta só.** Hoje convivem três: a laranja (tutorial, Record, Trocas, integrada), a nova de aço (Cartas r1) e
   o verso violeta-sol (Trocas). Integrar Cartas r1 primeiro e fazer as outras áreas consumirem o mesmo componente.
2. **Um botão primário só.** O gradiente violeta é hoje o maior acento frio do produto e aparece em toda tela. Cartas
   r1 já usa o primário em porcelana ("CONTINUAR", "FRENTE"), que é o caminho certo. Levar para todos.
3. **Fundo do interior.** Record é vinho, avisos é marinho, Mensagens é violeta, Pulso é índigo, Trocas e Cartas são
   mármore negro e Compêndio é papel. A Direção 2 §2 pede papel frio como fundo do interior, com painéis negros.
   Escolher: papel frio de base e painéis de mármore negro (como 23-cartas r1 já faz) em todos os apps.
4. **TimeDigits** com fantasma/traço em 04-tutorial-fim e 20-record-deadly-votes. É o elemento-assinatura do jogo,
   então precisa estar perfeito em todos os quadros.
5. **Tracking quebrado** voltou em componentes novos (miniatura de carta, "Nem a" em Trocas). O kit precisa de uma
   regra única de tracking/acentos para caixa-alta.
6. **Toast do shell**: rubi em confirmação (04-tutorial-fim), conteúdo vazio (Trocas) e sobreposição de conteúdo
   (21-pulso-critico, 04-tutorial-fim). É um componente com três defeitos que aparece em todas as áreas.
7. **Regra do vermelho**: Record (fundo), 10-home-critico (tela inteira), Trocas "Sem retorno" (fundo), chip
   selecionado da aposta e toast positivo. Rubi deve existir só onde se perde Tempo ou se morre.
8. **Fronteira noite → papel** (Direção 2 §2) ainda não existe. O fim do tutorial entra na home escura sem a
   "folha sendo impressa". Hoje o papel só aparece dentro do Record e de Cartas, e por isso parece outro jogo.
