# DEVO v2: leia primeiro

Resumo para o dono. Atualizado em 01/11/2026 (noite), depois de alinhar todos os documentos desta pasta.

---

## 1. O v2 em um parágrafo

O DEVO continua com a cara dele: gótico, ametista, mármore negro e porcelana, aço champanhe, o Tempo no pulso,
o Record e o cobalto da Companhia. Só que é um redesign de verdade: nenhuma tela, moldura ou composição de hoje é
copiada. Cada tela tem um objeto principal com volume (o relógio da home, o tabuleiro de mármore do Deadly Vote,
o astrolábio das Torres, o pedestal dos cosméticos), luz que se explica, partículas e uma diagonal forte, e
algumas peças são 3D de verdade (Three.js, que o projeto já tem). Nada é em pixel. A **Casa** e as **Torres** são
a parte RPG Maker / visual novel: um cenário pintado em camadas onde o avatar anda, objetos que se tocam,
visitantes que batem na porta, diálogo com retrato grande e escolhas. Os NPCs passam pelo redesign com o Persona
como referência de pose, luz, cut-in e cartão do Vínculo, mas pintados no estilo da arte atual, sem o vermelho do
P5. Os cosméticos também foram refeitos: a raridade agora se vê pelo material (pedra, jade, prata, renda, ouro
velho, cristal). O primeiro kit, em pixel, foi descartado.

---

## 2. Mapa da pasta

**Quando dois documentos discordam:** vale o seu texto, depois a `BIBLIA.md`, depois a spec dona do assunto.

| Documento | O que tem |
|---|---|
| `PEDIDO-V2-dono.md` | Seu texto literal, com as correções de 01/11 no topo |
| `BIBLIA.md` | Direção visual: cores, fontes, molduras, luz, 3D, celular, Casa e Torres, NPCs, cosméticos |
| `SPEC-TUTORIAL-E-EQUIPE.md` | Devo tutorial, ordem de entrada do novato (decisão D-1), ferramentas da equipe, brechas |
| `SPEC-AVATAR.md` | Criação do avatar, foto × avatar, como o avatar aparece no cenário |
| `SPEC-CASA.md` | Cômodos, objetos, níveis, skins, decoração (tem nota no topo com o que mudou) |
| `MOTOR-CASA-TORRES.md` | Como a Casa e as Torres funcionam por dentro (cenário pintado, PixiJS) e o protótipo |
| `SPEC-VISITANTES.md` | Visitantes, afinidade, paixão e romance, presentes, ameaça, moradores, tela Vínculos |
| `SPEC-RITOS.md` | Gestos, Cânticos, Taças, Recuo Paranormal, Paus, o objeto que substitui o Card Shuffler |
| `SPEC-ORDEM.md` | Doação de horas e Caos e Ordem (honra e necro) |
| `SPEC-COSMETICOS.md` | Redesign dos cosméticos |
| `npcs/ELENCO.md` e `npcs/<npc>.md` | Os sete NPCs: cores, silhuetas, luz, cut-in, Arcanos; uma ficha por NPC |
| `arte/ESCOLHAS.md` | Arte gerada no pipeline e a crítica dela (nota 4,5) |
| `REFERENCIAS.md`, `INVENTARIO.md` | Pesquisa de jogos e lista de tudo o que o DEVO tem hoje (para nada se perder) |

**Imagens para olhar primeiro:**
- `kit2/kit2-celular.png`: as doze telas do celular lado a lado. Uma a uma: `kit2/home.png`, `explorar.png`
  (Casa andando), `casa.png` (Casa em diálogo), `cutin.png`, `confidentes.png` (Vínculos), `mapa.png`, `torre.png`,
  `dv.png`, `poco.png`, `vitrine.png`, `inventario.png`, `carta.png`; e `kit2/desktop.png`.
- `kit2/cosmeticos.png` e os outros `kit2/cosmeticos-*.png`: cosméticos.
- `arte/v2-casa-noite.webp`, `arte/v2-torre-interior.webp`, `arte/v2-cg-melissa-encontro.webp`,
  `arte/v2-ui-mostrador.webp`: a arte nova que passou na crítica.
- `prototipo-motor/capturas/v2-prancha-celular.png`: o protótipo da Casa funcionando.
- `npcs/elenco-silhuetas.svg`: os sete NPCs em silhueta e altura.
- `kit/`: o kit em pixel reprovado. Só histórico.

---

## 3. Decisões que só você toma

Cada item traz a **proposta padrão**, que é o que vale enquanto você não responder. Pode responder pelo número
("aprovo 1 a 5, no 7 quero outra coisa").

**Direção e estrutura**
1. **Técnica da Casa e das Torres.** Padrão: cenário pintado em camadas (como `arte/v2-casa-noite.webp`), sem pixel.
2. **Ordem de entrada do novato (D-1).** Padrão: a Casa fica trancada até vencer o Devo tutorial; a criação do
   avatar acontece na primeira vez que ele entra na Casa, e o Galo entrega as chaves. Alternativa: criar o avatar
   no celular logo depois da aula, antes do tutorial.
3. **Decorar a Casa.** Padrão: cada cômodo tem pontos de encaixe (parede, chão, mesa, teto, janela) em vez de grade
   livre, porque o cenário é pintura.
4. **"Subir de nível" da Casa.** Padrão: a Casa tem nível próprio. Quanto custa e o que cada nível libera: `X`.
5. **Casa inicial.** Padrão: três cômodos pequenos (Sala, Quarto, Oficina); outros cômodos com os níveis.
6. **Torres por dentro.** Padrão: a escada espiral pintada escolhe o andar, e cada andar é um cenário onde o avatar
   anda (como `arte/v2-torre-interior.webp`).
7. **Casa no computador.** Padrão: cena dentro de uma moldura ornamental agora; pintar os cômodos principais em
   formato largo depois.

**Nomes**
8. **Tela dos NPCs conhecidos.** Padrão: **Vínculos** ("Confidentes" é só a referência do Persona).
9. **Tela de cosméticos.** Padrão: **Vitrine** (peça no pedestal) e **Coleção** (grade). "Espelho" fica só para o
   objeto do Quarto que reabre a criação do avatar.
10. **Visita perdida.** Padrão: o NPC deixa um **cartão de visita** na porta, na cor dele, sem penalidade.
11. **Objeto que substitui o Card Shuffler.** Padrão: "Retábulo" (nome de trabalho), só para treino e consulta (opção B
    da `SPEC-RITOS.md`); o Shuffler redesenhado continua no Record e no Salão.

**Avatar e NPCs**
12. **Foto × avatar.** Padrão: a foto continua no Record, ranking e Deadly Vote; o avatar aparece na Casa, nas
    Torres e no diálogo; no perfil o jogador escolhe qual imagem usa.
13. **Arte dos NPCs.** Padrão: refazer as 19 peças no estilo anime pintado (o da CG da Melissa e da arte atual), os
    sete retratos no mesmo modelo, o Galo em outro modelo do pipeline; nada da rodada reprovada vai para a tela.
14. **Cores de cada NPC, silhuetas e alturas, figurinos novos** (`npcs/ELENCO.md` §1, §2, §11). Padrão: aprovar como
    estão; traços da sua arte que alguma ficha queria trocar continuam como na sua arte.
15. **Arcanos dos NPCs.** Padrão: as sugestões principais (Coruja II, Javali X, Corvo XIII, Rato I, Herdeiro V,
    Melissa XX); o Galo já é o IV.
16. **Rosto do Corvo.** Padrão: meia-máscara de crânio de corvo, bico fechado, sem boca e sem dentes; o rosto
    nunca aparece até você decidir quando ele é revelado.
17. **Quem visita, quem pode ter romance, quem pode morar, quem pode vir como ameaça.** Padrão: os sete podem
    visitar (a Melissa por holograma); romance, morar e ameaça ficam desligados por NPC até você marcar.
18. **Romance da Melissa.** Padrão: fora, até você dizer; a CG dela é só exemplo de enquadramento.
19. **CG de encontro com o avatar.** Padrão: a cena evita o rosto do Record (de costas, mãos, ponto de vista).
20. **Trava de idade para romance.** Padrão: romance, encontros e CGs só para quem declarou 18 anos ou mais.

**Sistemas**
21. **Essências de Afinidade.** Padrão: o vínculo é um contador próprio de cada NPC e, ao subir, também entrega o
    item de Essência; gastar Essência na Torre não baixa o vínculo.
22. **Paixão.** Padrão: uma por vez.
23. **"Sua companhia"** na doação de horas. Padrão: a Companhia (Corporação) de que o jogador é membro.
24. **Pontos necro.** Padrão: só sinalizam para a equipe; não reclassificam a Companhia sozinhos.
25. **Cântico: "Rara = 2 linhas".** Padrão: conta a posição entre as raridades que existem naquela Coleção, e o mapa
    de linhas fica travado por Coleção.
26. **Carta com rito "a definir" no Deadly Vote.** Padrão: pode ser usada, pela regra de hoje.
27. **O jogador vê números de dano?** Padrão: vê em palavras (leve, moderada, forte, muito forte); números só para a
    equipe.
28. **Devo tutorial.** Padrão: "finalizar" = opção B (§2.2 da spec); contas antigas contam como quem já fez;
    promoção a Dealer não mexe nas travas.
29. **Salão "no padrão de três dias".** Padrão: um salão a cada 3 dias, aberto 24 h, como hoje.
30. **Desfazer recompensa.** Padrão: só o Owner; "reverter quando der", senão vira dívida; prazo `X`.
31. **Cores de raridade.** Padrão: a paleta nova da `BIBLIA.md` §3 em todo o jogo (cartas, Cântico, Poço,
    inventário, cosméticos), com borda e selo próprios em cada raridade.
32. **Cosméticos.** Padrão: você aprova primeiro a dupla de demonstração (Última Badalada em cristal e Coração da
    Condessa) e a escada de materiais; só depois o catálogo inteiro é refeito. O Casulo fica Épico; nome e regra de
    abertura são seus.
33. **Visitar a casa de outro jogador.** Padrão: desligado.
34. **Dia e noite na Casa.** Padrão: segue a hora real (fuso de São Paulo).

**Tudo o que você deixou como `x`/`X` continua pendente e nada foi inventado:**
35. Números: Lendária = X; Paus um e dois níveis acima = x%; níveis de Taças; linhas de Cântico além de Comum e Rara;
    custos das Torres; valores de afinidade, romance, visita e presentes; níveis da Casa; Caos e Ordem; prazos e
    limites da equipe. Padrão: ficam vazios no banco, marcados como provisórios.
36. Textos: frase de cada cut-in, falas dos Visitantes, cartões de visita, nomes dos Gestos, Cânticos das Coleções,
    falas do guia, Estágio IV e VII da Força. Padrão: aparecem como `[fala pendente]` até você escrever.

As listas completas, com cada número, estão no fim de cada spec.

---

## 4. Melhorias e brechas para você aprovar

1. **Salão das Máscaras:** Anfitrião para cima aprova lotes e abre um salão "agora" pelo próprio Salão, escolhendo
   entre antecipar a próxima edição ou fazer uma edição extra; os vendedores são avisados (`SPEC-TUTORIAL-E-EQUIPE.md`
   S3–S5).
2. **Owner desfaz uma recompensa enviada:** com simulação antes, motivo obrigatório e registro; se o jogador já
   gastou o que recebeu, vira dívida (R1–R6).
3. **Três correções antes do v2 (recomendadas como obrigatórias):** o Tempo do jogador hoje é decidido pelo
   navegador; o inventário de cartas também; cartas resgatadas podem sumir (A-1 a A-3).
4. **Outras brechas encontradas:** novato pode se inscrever em qualquer Devo; "forçar aberto" no Salão não tem fim;
   Tempo de recompensa sem trava contra repetição; registro da equipe espalhado; lembrete do pulso sem senha
   obrigatória; partidas combinadas na Sala de Jogos sem teto diário; posse de carta nas trocas não confirmada no
   servidor (B-2 a B-11).
5. **Desfazer o resultado de um Deadly Vote aplicado por engano** (só Owner) e **"ver como o jogador vê"** na Mesa
   (B-12).
6. **Doação de horas com aceite:** ninguém recebe horas que não quer, e a equipe vê doações suspeitas
   (`SPEC-ORDEM.md` §3).
7. **Vínculos:** cartão de visita quando a visita é perdida (V4), uma paixão por vez (V10), constelação 2.5D na
   abertura (V15), primeira ameaça guiada (V13), "chamar" um NPC pelo Mensagens (V21), visão de equipe para Owner e
   Anfitrião (V22). Lista inteira: `SPEC-VISITANTES.md` §12.
8. **Ensaio do rito na Casa, sem prêmio:** treinar Gestos e Cântico antes de usar a carta (`SPEC-RITOS.md` P5).
9. **Cosméticos:** álbum por série, procedência de cada peça e revelação em 3D no Poço e na entrega de recompensas
   (`SPEC-COSMETICOS.md`).
10. **Aparência congelada no Deadly Vote:** trocar o avatar durante um caso não muda o quadro até o resultado
    (`SPEC-AVATAR.md` A10).
11. **Owner e Anfitrião podem redefinir o avatar** de um jogador, com motivo e registro; o Owner pode desfazer
    (`SPEC-AVATAR.md` §6.2).
12. **Sessão no cache do login** (`session.cookieCache`): cortaria uma consulta por requisição nas salas online.
    Mexe em autenticação, então só com o seu sim.
