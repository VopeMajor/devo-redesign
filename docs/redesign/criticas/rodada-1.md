# Crítica — rodada 1 (Entrada, Sistema, Sala de Jogos)

Veredito: as três REPROVADAS. Médias: Entrada 2,9 · Sistema 3,1 · Sala de Jogos 2,75.
Já resolvido no kit depois desta crítica (não refazer): espaçamento quebrado no "s", dígitos do TimeDigits
vazando/sumindo, estrela do `sigil` fosca, pilares do `cathedral`, novo `PortraitFrame` (use-o para todos os retratos).
Inconsistências que vinham de cada branch ter as telas antigas das outras áreas somem com a integração —
confira nas capturas integradas em /home/claude/shots-int antes de mexer.

## ENTRADA (média 2,9)
Bloqueadores
- 03-prologo-00 e 03-prologo-07: tela preta só com caixa "…" — abertura da jornada mais importante. Precisa de cena.
- Rato (public/images/npc/rat-host-v2.png) é raster muito acabado, origem a confirmar. Dono consultado; até lá, enquadre-o no `PortraitFrame` e NÃO remova.
Correções
1. 03-prologo-00/07: troque o vazio por cena (sigilo acendendo, poeira, vinheta com luz); o texto entra depois, ritmo de "abrir os olhos". O primeiro quadro diz onde o jogador está.
2. Continuidade 02-acesso-preenchido → 03-transicao-despertando → 03-prologo-00: depois de "Assinar" o jogador cai na landing ("Bem-vindo de volta, Aurora") com o herói em SVG chapado. "Assinar" deve disparar a cortina "Despertando" e ir direto ao prólogo; se a landing aparecer, com o mesmo herói 3D.
3. 03-prologo-10: wipe escuro corta a tela na altura da cabeça da Melissa; Melissa aparece enquanto o narrador ainda descreve a caverna. Wipe termina antes de o retrato entrar; Melissa só depois da fala de cenário.
4. 04-tutorial-fim / 04-tutorial-12: dois toasts empilhados cobrem o "Tempo restante" na primeira vez que o jogador vê o sistema. Um toast por vez, abaixo do herói, ou retardar até o herói entrar (coordenar com Sistema: o toast é do shell; na Entrada, retarde a chegada dos avisos de boas-vindas).
5. (resolvido no kit) espaçamento do "s".
6. 02-acesso-cadastro/preenchido: papel passa da borda inferior; "DEVO.SYSTEM" aparece por trás do papel; assinatura cortada pela emenda. Caber na área segura (ou rolar dentro), esconder cabeçalho de fundo, assinatura inteira.
7. Rótulos cobalto pequenos sobre papel ("ADMISSÃO · DEVO", "SEU NOME", "CÓDIGO DE CONVITE") violam IDENTIDADE §2: cobalto profundo ≥14px ou tinta de papel. Quinto inferior vazio em 02-acesso-convite: suba o papel ou ocupe com o sigilo.
8. 04-tutorial-02: "71:59:12" encosta no rótulo "PULSO" na figura IV.
9. 04-tutorial-04: Rato termina num corte reto horizontal — use `PortraitFrame` (base dissolvida).
10. Elenco em cinco linguagens (crianças livro ilustrado, Morte raster, Melissa vetor, Rato raster, Herdeiro vetor): unificar tratamento com `PortraitFrame` + mesma luz/grão; nas cenas do prólogo, um tratamento comum (grade de cor, grão, vinheta) sobre as imagens existentes.
11. 05-sala-de-jogos-revelacao: faixa dourada atrás só da metade de "JOGOS", branco sobre ouro sem contraste; carimbo "LIBERADO" bate em "DE"; raios com cortes retos; "Toque para continuar" 11px apagado.
12. 90-desktop-landing/01-landing: (resolvido no kit) dígito e estrela — confira.

## SISTEMA (média 3,1)
1. 11-transicao-voltar: na volta o app fica translúcido e a home aparece por trás (duas telas legíveis). Saída para a direita, fundo opaco, ≤360ms. Recapture 11-transicao-abrir no meio da animação para provar direção.
2. 10-home: miolo vazio (~25% da altura) — use para função (último aviso, próxima convocação, atalho para a Sala), como em 10-home-critico.
3. 10-home: mostrador do cartão "Tempo restante" cortado pela borda; arco cobalto sai pela direita. Caber inteiro ou corte diagonal intencional com filete.
4. 21-pulso-critico (e Record): toast cobre o cabeçalho e "Sinal vital / Crítico". Toast menor, abaixo do cabeçalho, nunca por cima do estado crítico. Vale para todos os apps (o toast é do shell).
5. 21-pulso: ponteiro e órbita passam por cima dos dígitos; órbita atrás ou opacidade reduzida na faixa dos dígitos.
6. 22-mensagens-*: duas setas de voltar empilhadas — deixe uma (o voltar do shell deve voltar para a lista quando há conversa aberta). Marca d'água do NPC com bordas retangulares — dissolver.
7. 22-mensagens-*: opções de pergunta em papel creme (papel = documento; ação = cobalto). Controle cobalto. Kicker "…a resposta não muda" quebra com "MUDA" sozinho: encurtar.
8. 92-desktop-pulso: (dígito resolvido no kit) janela corta Cartas/Trocas/Jogos sem indicar rolagem.
9. 92-desktop-os: (pilares resolvidos no kit) confira.
10. 10-home: dock em laje cinza clara destoa — ink-2 com filete. 10-home-avisos: "LIMPAR" quase invisível; estado vazio fraco.
11. Cabeçalho de app: tique solto do filete dourado na borda esquerda; traço cobalto sob o ícone parece aba sem abas — tirar ou dar função. No Record, papel encosta no cabeçalho sem respiro.
12. 25-ajustes: o bloco-herói com filigrana é "DEVO 0.1 · versão" (informação menos importante). Ornate para Sessão/Reiniciar ou Áudio; versão vira linha secundária.

## SALA DE JOGOS (média 2,75)
Bloqueador
- 31-jogos-apostas: o controle de valor da aposta ("Apostar [15min]", existia na base) sumiu. Restaurar o seletor, desabilitado com motivo quando não houver confronto.
Correções
1. 31-jogos-apostas: painel "Livro de apostas" todo vermelho-sangue com 51h estáveis — vermelho decorativo. Ink + filete ouro; vermelho só no aviso de mínimo ou tempo crítico. "Nenhum confronto aberto…" solto sobre o xadrez claro sem contraste: colocar num Frame.
2. Cabeçalho da Sala diferente do padrão dos apps (gamepad genérico, título pequeno, sem kicker/numeral, barra de status sem pílula). Use o cabeçalho e a barra do shell (Sistema). Confira na captura integrada.
3. 32-tutorial-living-chess-a: selo "PARTIDA #824" sobre "JAVALI (TUTORIAL)" (texto sobre texto); "Sua vez — toque numa peça" sem fundo. (A barra de confronto é da área Partidas; a moldura/entrada é sua — coordene: só a sua parte.)
4. 32-tutorial-bomba-quente-a/c: moldura de entrada roxo/amarelo, sans arredondada, girada 90°, sem tokens DEVO. (Área Partidas cuida do miolo; se a moldura for do loader/live-match, é sua.)
5. 30-jogos-mesa: banner do Memory Rush fora da moldura dourada; arte com cursor de mouse e "P1" (parece print de desktop); "Inscrever-se" cortado na primeira dobra. Enquadrar, recortar a arte sem cursor, CTA cabendo em 844px.
6. 32-tutorial-living-chess-c: treino gratuito usa tela inteira vermelho-alerta como uma eliminação. Vermelho total só para derrota que custa Tempo; treino em ink/cobalto. "PERDEU" ouro sobre vermelho sem contraste e redundante com "DERROTA"; avatar "JT" do Javali errado (use o retrato); "Treino" em fonte de impacto como pontos: use "—" com nota; quinto inferior vazio.
7. 34-javali-0/1/3: Javali e fala na metade de baixo, topo ~40% vazio. Suba o retrato/ponha a mesa atrás/mostre o relógio desde o início; mesmo enquadramento em todos os passos.
8. Tile "TEMPO 2D 3H" e pílula "51:16:43" lado a lado em formatos diferentes: um só (TimeDigits HH:MM:SS). Abas: indicador de "Apostas" encosta na borda direita (fora da margem de 16px).
9. 31-jogos-ranking-jogo: pódio cortado na base ("Corvo 470" pela metade); cartão de patente toma a dobra.
10. (resolvido no kit) espaçamento do "s".
11. 30-jogos-mesa: retrato SVG do Javali (cabeça chapada, olhos de LED) muito abaixo da qualidade da mesa — subir acabamento (luz, sombra, textura) e usar `PortraitFrame`.

## Coesão entre áreas
1. Home diferente entre o fim da Entrada e o Sistema — confira na integrada.
2. Cabeçalho/barra de status em três estilos — um componente só (o do shell).
3. Regra do vermelho quebrada na Sala (apostas estáveis, derrota de treino) e no PWA ("Bloqueadas").
4. Elenco em fidelidades diferentes — `PortraitFrame` + tratamento comum.
5. (resolvido no kit) defeitos de base.
