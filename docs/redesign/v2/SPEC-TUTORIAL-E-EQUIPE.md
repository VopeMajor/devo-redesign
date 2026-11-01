# DEVO v2 — Devo tipo tutorial, ferramentas da equipe e brechas

Especificação. Primeira versão em 31/10/2026; **revista em 01/11/2026** depois das correções do dono (topo de
`docs/redesign/v2/PEDIDO-V2-dono.md`) e da crítica. O que mudou está em "Decisões de revisão" (§12).

Fontes das regras: `PEDIDO-V2-dono.md` (texto literal do dono), `docs/redesign/DIRECAO-3.md` §1–4 e §7,
`docs/redesign/IDENTIDADE.md` §0, `docs/redesign/DIRECAO-2.md` §6, `docs/redesign/FUNDACAO.md` §12,
`docs/redesign/v2/INVENTARIO.md`, `docs/redesign/v2/npcs/*.md` e o código lido em `lib/devo/record-server.ts`,
`lib/devo/salao.ts`, `lib/devo/salao-server.ts`, `lib/devo/recompensas-server.ts`, `lib/devo/cargos.ts`,
`lib/devo/progresso.ts`, `lib/devo/inventario-server.ts`, `lib/devo/save.ts`, `app/api/save/route.ts`,
`app/api/salao/route.ts`, `scripts/fundacao-migration.sql`.

Nada aqui é final antes de o dono aprovar. Onde o dono não definiu, a escolha aparece como **proposta** e entra
nas pendências (§10). Números que ele não deu ficam como `x`.

**Convenção de números de interface.** Tempos, tamanhos e limites que não vieram do dono aparecem como
*(proposta: valor)* e são para ajustar no protótipo. Não são definição.

**Convenção de texto.** Toda frase que vai para a tela do jogador e que o dono não escreveu aparece como
`[fala pendente: assunto]` ou `[texto pendente: assunto]`. Rótulos de botão de uma palavra ("Inscrever-se",
"Aprovar") seguem o vocabulário que o app já usa.

---

## 0. Texto do dono (literal)

Sobre novatos:

> jogadores novatos: o único devo que aparece para ele é o chamado "tutorial". ou seja, caso um dealer ou quem
> quer que crie um devo, tem o tipo tutorial. este é apenas para alguém entender como funciona lá no WhatsApp, é
> apenas para tipificar. assim que finalizar um tutorial aí ele pode ver todos os outros devos que estão abertos
> para inscrição e as demais coisas.

Sobre a equipe e as brechas:

> também otimize sistemas caso veja alguma brecha, como por exemplo na própria tela do salão de máscaras, se você
> for anfitrião para cima, poder autorizar de lá e também editar se já quer que um salão abra agora no padrão de
> três dias, ou que um owner possa desfazer a ação de alguém ter enviado recompensa, etc. pode sempre dar
> sugestões de coisas que seriam interessantes e eu aprovo se gostar.

Direção visual que vale para esta spec (correções de 01/11, literais):

> não gostei. o devo em geral deve ter a vibe antiga, não em pixel. mas a casa e torres rpg maker/visual novel.
> além disso tudo parece muito simples, aprimore as artes e enquadramento

> os npcs também tem que passar pelo redesign. pegue como referencia o persona

> a vibe anterior, mas não um reaproveitamento ok? isso é um redesgn afinal. algumas referências (mas não se
> prenda a elas.) pode inserir elementos 2.5/3D em algumas telas. também refaça os cosméticos. quero tudo Melhor
> e mais bonito

Consequência para esta spec: **tudo o que ela desenha fica no celular do sistema** (Deadly Vote, Mesa, Salão das
Máscaras), que mantém a identidade gótica (mármore negro e porcelana, aço champanhe, ametista em pontos, cobalto,
o Tempo no pulso, o Record) **sem pixel**, mas com desenho novo, não com as telas e molduras de hoje. A única
tela daqui que toca o mundo da Casa (cenário pintado de RPG Maker / VN, `MOTOR-CASA-TORRES.md`; não é pixel) é a
primeira entrada na Casa (§3.1, passo 8), que pertence à `SPEC-CASA.md` e à `SPEC-AVATAR.md`. Não existe cidade andável: só a Casa e as Torres são mapa.

Regras anteriores que continuam valendo:
- DIRECAO-3 §1: no **Início** o jogador já tem "troca de cartas, chat com NPCs, Sala de Jogos"; o tutorial é um
  Deadly Vote inicial, "criado semanalmente pela equipe", e **vencer** desbloqueia os sistemas.
- DIRECAO-3 §1b: os ícones novos ficam trancados até vencer o tutorial, "exceto Owners e Anfitriões, que veem
  tudo liberado".
- DIRECAO-3 §7: falas dirigidas ao jogador usam o marcador de gênero `{o|a}`.

---

## 1. Objetivo para o jogador

- **Novato:** sai do prólogo e da aula do Herdeiro e do Rato (que já existem) e cai no celular do sistema com um
  só caminho destacado: o Devo tutorial. Não se perde numa lista de casos que ainda não entende. O tutorial
  existe para ele aprender, no grupo do WhatsApp, como um Deadly Vote acontece ("é apenas para tipificar": não
  muda as regras do caso, só marca quem pode vê-lo). Enquanto espera, continua com tudo o que o Início já dava
  (§1.1).
- **Depois do tutorial:** o celular "acende". Ele passa a ver os Devos abertos para inscrição e "as demais
  coisas" (os sistemas que o tutorial já desbloqueia hoje: Salão, Poço, Torres, Diário, Casa). A primeira
  entrada na Casa é a criação do avatar.
- **Equipe:** resolve o Salão das Máscaras sem sair dele (aprovar, editar, abrir agora), e o Owner corrige uma
  recompensa entregue por engano sem mexer no banco.

### 1.1 Novato: pode / não pode

"As demais coisas" não pode trancar o que hoje é livre ("nenhuma função antiga pode se perder"). A tabela lista
todas as funções do celular e de onde vem a regra.

| Função | Novato | Origem |
|---|---|---|
| Prólogo, perguntas (nome, idade, gênero, rosto) e Cartas Iniciais | sim (já acontece antes) | INVENTARIO l.35–37 |
| Aula do Deadly Vote e da Sala de Trocas (Herdeiro e Rato) | sim; pode rever pelo rastreador (§3.1) | INVENTARIO l.38 |
| Deadly Vote | só Tutoriais (§2.3) | dono |
| Mensagens (chat com NPCs) | sim | DIRECAO-3 §1 "Início" |
| Sala de Trocas | sim | DIRECAO-3 §1 "Início" |
| Sala de Jogos | sim | DIRECAO-3 §1 "Início" |
| Perfil, Configurações, Inventário | sim | regra atual (sem flag) |
| Cosméticos (ver e equipar o que tem) | sim | regra atual (sem flag); o redesenho é de outra spec |
| Calendário | sim | `FLAGS_LIVRES_PADRAO = ['calendario']` |
| Mesa | não (é da equipe) | cargos |
| Salão das Máscaras, Poço, Torres, Diário | não, até a vitória | `devo_tutorial_flags()` |
| Casa (e com ela a criação do avatar) | não, até a vitória (`galo_casa`) | `devo_tutorial_flags()`; decisão D-1 (§2.8) |
| Corporações, Arcanos e Virtudes | não; **não** vêm do tutorial (`corporacoes`, `virtudes` ficam fora de `devo_tutorial_flags()`) | `progresso.ts` |

Se o dono quiser trancar alguma das linhas "sim" para o novato, isso vira pendência; a proposta é não trancar.

---

## 2. Regras

### 2.1 O tipo "tutorial"

| # | Regra | Origem |
|---|---|---|
| T1 | Todo Devo tem um tipo: **Comum** ou **Tutorial**. O tipo é escolhido por quem cria. | dono ("tem o tipo tutorial") |
| T2 | O tipo não muda nada do caso em si (grupo do WhatsApp, cartas, peso, vagas, recompensas seguem iguais). | dono ("apenas para tipificar") |
| T3 | **Quem pode criar Tutorial:** o dono escreveu "caso um dealer ou quem quer que crie um devo, tem o tipo tutorial". Hoje só Owner e Anfitrião criam (`dv.tutorial` em `lib/devo/cargos.ts`). **Proposta:** liberar para toda a equipe (Owner, Anfitrião, Dealer). | dono; P1 |
| T4 | Vencer um Tutorial concede as flags de `devo_tutorial_flags()` (gatilho atual da Fundação). | DIRECAO-3 |
| T5 | Recompensas de um Tutorial criado por Dealer seguem o fluxo atual: ficam pendentes para o Anfitrião/Owner. | regra atual |
| T6 | **Segunda porta, já existente:** qualquer Devo, inclusive Comum, com `deadly_votes.unlocks` preenchido entrega essas flags aos sobreviventes (`devo_dv_desbloquear`, gatilhos `deadly_votes_unlock` e `deadly_vote_entries`). Hoje só o Tutorial recebe a lista padrão automaticamente; num Comum ela vem vazia, a não ser que a equipe preencha. Esta spec documenta a porta e a usa na opção B do P2. | código atual |

### 2.2 Novato, veterano e o que é "finalizar"

- **Novato** = jogador (cargo `player`) que ainda não **concluiu** um Tutorial.
- **Concluir** depende do P2, que o dono decide entre três opções. As três fecham o caso de quem morre no
  tutorial, que na versão anterior podia ficar trancado para sempre fora dos sistemas.

| Opção | "Finalizar" (vê os Devos) | Sistemas (flags) | Quem morre no Tutorial |
|---|---|---|---|
| **A** | = vencer | = vencer o Tutorial | Continua novato e pode se inscrever no próximo Tutorial até vencer. Uma regra só. |
| **B** (proposta) | participar até o resultado (decisão ≠ "não compareceu") | = vencer **qualquer** Devo | Vira veterano e vê os Devos Comuns. Na primeira vitória num Devo Comum, recebe `devo_tutorial_flags()` mesmo que o `unlocks` daquele Devo esteja vazio (regra nova em `devo_dv_desbloquear`, só para quem ainda não tem as flags de origem `deadly_vote`). |
| **C** | participar até o resultado | = participar | Recebe as flags junto com quem venceu. Muda a regra de DIRECAO-3 ("vencer desbloqueia"). |

Por que B é a proposta: segue as duas frases do dono ao pé da letra ("assim que finalizar" para a lista;
"vencer desbloqueia" para os sistemas) e não deixa ninguém sem saída. Na B, o rastreador do celular (§3.1)
mostra ao veterano sem flags qual é o próximo passo: `[texto pendente: vencer um Devo para abrir os sistemas]`.

- **Dealer:** não é novato (vê todos os Devos), mas as flags de sistema dependem de vitória ou de override do
  Owner; só Owner e Anfitrião têm tudo liberado. Um Dealer recém-promovido que nunca venceu vê a Mesa e todos
  os Devos e continua com Casa, Poço, Torres, Salão e Diário trancados. **Proposta:** a promoção a Dealer não
  muda flags; quem quiser libera pelo override (`desbloqueio.override`). P14.
- Anfitrião e Owner nunca são novatos e veem tudo liberado (regra permanente do dono).

### 2.3 O que cada um vê na lista de Devos

| Quem | Vê | Não vê |
|---|---|---|
| Novato | Tutoriais convocados ou em andamento; qualquer Devo em que já está inscrito; o próprio histórico. | Devos Comuns (de nenhum estado). |
| Veterano | Devos Comuns (regra atual: abertos, em andamento, encerrados, cancelados por 30 dias); Tutoriais de que participou (histórico). | **Proposta:** Tutoriais abertos de outras pessoas (P3). |
| Equipe | Tudo, como hoje; na Mesa, o Tutorial tem selo próprio. | — |

### 2.4 Inscrição

- Novato só se inscreve em Tutorial. O servidor recusa o resto (o cliente esconde, mas a regra é do servidor).
- **Proposta:** novato fica em **um** Tutorial ativo por vez (convocado ou em andamento), para não segurar vaga
  em vários.
- **Proposta:** veterano não se inscreve em Tutorial (P3). Na opção A do P2, quem morreu continua novato e por
  isso pode voltar. A equipe pode pôr alguém à mão pela Mesa.
- Tutorial cancelado ou em falha não conta: o jogador continua novato e volta a ver os próximos.

### 2.5 Contas antigas

Quem já joga hoje e nunca fez Tutorial passaria a ver só Tutoriais. **Proposta:** a migração marca como
veterano quem já tem qualquer resultado em Deadly Vote ou a flag de sistema vinda de Deadly Vote
(`player_unlocks.source = 'deadly_vote'`). P4.

### 2.6 Salão das Máscaras: painel da equipe

| # | Regra | Origem |
|---|---|---|
| S1 | Anfitrião ou acima **autoriza dali mesmo** (lotes da Bandeja e anúncios), sem ir à Mesa. | dono |
| S2 | Anfitrião ou acima **edita** dali: lote em avaliação (lance mínimo, nota) e lote aprovado que ainda não foi a leilão (lance mínimo, edição, cancelar com devolução). | dono ("também editar") |
| S3 | Anfitrião ou acima **abre um salão agora no padrão de três dias**. Duas formas, escolhidas na hora: **antecipar a próxima edição** (os lotes já aprovados para ela entram agora; as seguintes caem a cada 3 dias a partir daqui) ou **edição extra** (o Salão abre agora sem lotes da fila; o calendário não muda). | dono; a escolha é proposta |
| S4 | Antes de confirmar "antecipar", o painel mostra quantos lotes e quantos vendedores serão antecipados. Cada vendedor recebe aviso em Mensagens: `[fala pendente: lote antecipado]`. | proposta |
| S5 | "Abrir agora" só com o Salão fechado e só se a última edição fechou há pelo menos `x` horas. | proposta; P16 |
| S6 | Hoje o Dealer também avalia (`salao.avaliar` = equipe toda) pela Mesa. **Proposta:** o Dealer mantém a avaliação na Mesa (nenhuma função se perde); o painel no Salão aparece para Anfitrião e Owner, como o dono pediu. | regra atual; P6 |
| S7 | O calendário completo (âncora, intervalo, duração, forçar) continua só do Owner. | regra atual |

"Padrão de três dias" bate com o calendário atual (`intervalo_dias: 3`, `duracao_horas: 24`). Se o dono quis
dizer "aberto por três dias", muda só a duração (P5).

### 2.7 Owner desfaz envio de recompensa

| # | Regra | Origem |
|---|---|---|
| R1 | Só o **Owner** desfaz uma recompensa já **entregue**. | dono |
| R2 | Desfazer exige uma nota (motivo) e grava quem desfez e quando. A proposta original e o histórico continuam visíveis. | proposta |
| R3 | O sistema retira do jogador o que ainda existir daquela entrega e, antes de confirmar, mostra o que não dá para retirar como está. | proposta |
| R4 | **Conversões.** Se a recompensa já virou outra coisa (Fragmentos gastos num Estágio de Arcano, carta usada na Confecção, item dado a um Visitante, peça de aparência em uso), a simulação mostra a conversão e o Owner escolhe, linha a linha: **reverter a conversão** (quando o sistema permite) ou **registrar dívida** no livro-caixa do jogador. Dívida é descontada dos próximos créditos do mesmo recurso. Assim "receber e converter na hora" não escapa do desfazer. | proposta; P15 |
| R5 | Desfazer não apaga: a recompensa vira **"desfeita"**. Pode ser proposta de novo, como uma recompensa nova. | proposta |
| R6 | Prazo para desfazer: `x` dias depois da entrega. | P7 |

### 2.8 Ordem de entrada e criação do avatar (decisão D-1, fonte única)

Três documentos tratavam disso com quatro variantes (`SPEC-CASA.md` P14 e PENDENTE 19, `SPEC-AVATAR.md` A1 e
A1-b, e a versão anterior desta spec). **Esta seção passa a ser a única fonte.** Aquelas duas specs já apontam para cá (harmonização de 01/11, noite).

**D-1 (proposta): a Casa inteira fica trancada até `galo_casa`; a criação do avatar acontece na primeira
entrada na Casa, depois da vitória.** É a A1-b da `SPEC-AVATAR.md` **sem avatar provisório**.

- Literal do dono: a criação acontece "ao entrar nesse sistema de casa", e antes do tutorial o novato não vê "as
  demais coisas". D-1 cumpre as duas frases sem exceção.
- O argumento antigo a favor de A1 (evitar um sprite provisório andando "na cidade") caiu: não há cidade. Antes
  da Casa não existe mundo andável, e o Devo tutorial acontece no WhatsApp. O novato não precisa de avatar
  nenhum antes da vitória, então a folha extra de 51 quadros também sai.
- O primeiro contato do jogador com o jogo continua sendo a identidade gótica (abertura, prólogo, celular), não
  o mundo da Casa.
- `devo_tutorial_flags()` já inclui `galo_casa`; o banco não muda.

**Gênero.** O prólogo já pergunta o gênero (DIRECAO-3 §7). **Proposta:** a criação do avatar abre com o corpo
que corresponde ao gênero do prólogo **pré-selecionado**, e o jogador pode trocar. O corpo do avatar não muda o
tratamento nas falas; quem decide `{o|a}` continua sendo o gênero do perfil. P17.

**Alternativa D-1-A (se o dono quiser o avatar antes do tutorial):** a criação vira uma tela do celular, não um
cômodo em pixel: um espelho gótico em 2.5D com o retrato anime grande do jogador saindo da moldura (padrão de
retrato da direção Persona), logo depois da aula do Herdeiro e do Rato. O sprite fica guardado e só aparece
quando a Casa abrir. A Casa continua trancada inteira até `galo_casa`.

---

## 3. Fluxo de telas

### 3.1 Celular (retrato, 390×844) — novato, do prólogo à Casa

1. **Prólogo** (já existe; `lib/devo/prologue-script.ts`): nome, idade, gênero, rosto, Cartas Iniciais.
2. **Aula do Deadly Vote** (já existe; `lib/devo/intro-script.ts`): Herdeiro (8 falas) e Rato (10 falas), com os
   retratos novos das fichas `npcs/herdeiro.md` e `npcs/rato.md`. A fala "Cheque seu aplicativo Devo no
   celular…" continua e passa a apontar para o cartaz do Tutorial.
3. **Celular do sistema, primeira vez.** Home redesenhada (não a de hoje): o relógio do pulso no alto, a grade de
   apps abaixo. O ícone do **Deadly Vote** é o único com halo de ametista e um ponto cobalto. Os ícones
   trancados (Salão, Poço, Torres, Diário, Casa) aparecem em mármore escuro com um **selo de cera ametista** e,
   embaixo do nome, uma linha curta com o requisito: `[texto pendente: abre ao concluir o Devo tutorial]`.
   Tocar num trancado não abre tela de erro: o selo treme uma vez e o rastreador pisca.
   - **Rastreador de missão** fixo logo abaixo do relógio, uma linha só (proposta: altura de 44 px):
     "Próximo passo · Devo tutorial · convocação DD/MM" quando há Tutorial no Calendário, ou
     `[texto pendente: aguardando a equipe abrir um tutorial]` quando não há. Tocar abre o Deadly Vote. Um
     botão secundário no rastreador, "Rever a aula", reabre a VN do Herdeiro e do Rato.
4. **Deadly Vote › Tutorial.** Um só cartaz, desenhado como **livro de missão aberto** (ref-21), em 2.5D leve:
   - página esquerda: retrato do Herdeiro em pose, recortado, com o ombro e a mão saindo da margem do livro;
   - página direita, em porcelana com filete champanhe: título do Devo, local, vagas, e o **relógio da
     convocação** como um mostrador pequeno com ponteiro real que anda;
   - **fita de selo cobalto** "Tutorial" cruzando o canto superior do livro;
   - fundo: mármore negro com profundidade (duas camadas em paralaxe pelo giroscópio ou pelo arraste, com
     partículas finas de poeira ametista), sem textura de cortiça nem papel solto;
   - botão "Inscrever-se" no rodapé, com área de toque ≥ 48 px, acima da área segura.
   - **Sem Tutorial aberto:** o livro aparece fechado sobre o mármore, o mostrador parado, e um vitral apagado
     ao fundo. Texto: `[texto pendente: nenhum tutorial aberto]`. Se o Calendário tiver um evento Tutorial, a
     data aparece no mostrador. Nenhuma promessa de prazo é escrita pela interface (a frase "criado
     semanalmente" é descrição interna da DIRECAO-3, não texto para o jogador).
5. **Inscrito.** Um carimbo "Inscrito" cai sobre a página direita; com aprovação, o carimbo é "Em análise".
6. **Em andamento.** O botão do grupo do WhatsApp aparece (regra atual: só para aceitos, só em andamento). O
   ponteiro do mostrador corre.
7. **Resultado aplicado.** Uma vez só, com som:
   - **Venceu:** cut-in do Herdeiro (faixa diagonal ametista atravessando a tela, retrato em pose com expressão
     forte, nome em letreiro champanhe) com `[fala pendente: Herdeiro, vitória no tutorial]`. Depois a
     **cerimônia de desbloqueio** em 2.5D: a câmera recua para a home, o relógio do pulso gira uma volta e cada
     ícone trancado perde o selo de cera e acende em ametista, um por vez, com o nome do sistema numa faixa
     curta (padrão Persona de apresentar um Confidente ou local). O livro do Tutorial se fecha e recebe o selo
     do Record.
   - **Morreu ou perdeu:** depende do P2. Na opção B, a lista de Devos abre com cut-in do Herdeiro
     `[fala pendente: Herdeiro, derrota no tutorial]`; os ícones ficam selados e o rastreador passa a mostrar
     o próximo passo. Na opção A, o jogador continua novato e o rastreador aponta para o próximo Tutorial.
   - Com "reduzir movimento" ligado, o cut-in vira um retrato parado com fade e a cerimônia acende todos os
     ícones de uma vez.
8. **Primeira entrada na Casa (D-1).** Tocar no ícone da Casa abre a transição interface → mundo
   (INVENTARIO, "Cortina de transição") e a **criação do avatar** (`SPEC-AVATAR.md`). Ao terminar, a cena
   `galo-casa` entrega as chaves (`SPEC-CASA.md`). Daqui em diante vale o motor da Casa.
9. **Lista completa.** O Deadly Vote passa a mostrar os Devos Comuns (§3.2).

**Guia.** O guia do novato é o **Herdeiro**, que já é a primeira voz do tutorial do Deadly Vote e o maestro do
Salão (`npcs/herdeiro.md`). Para a Sala de Trocas, o Rato. Os dois aparecem sempre em cut-in com retrato em
pose, nunca em balão sem retrato. As falas novas ficam `[fala pendente]`. Isso fecha a parte do guia que a
`SPEC-AVATAR.md` deixou na PENDENTE 7 para o que acontece no celular; o guia dentro da Casa continua com aquela
spec.

### 3.2 Lista de Devos do veterano (celular)

Padrão de capítulos em medalhões presos a um mostrador (ref-15), adaptado ao retrato:
- à direita, um quarto do mostrador zodiacal em cobalto e aço champanhe, cortado pela borda da tela, girando
  devagar conforme a lista rola;
- à esquerda, uma coluna de medalhões (um por Devo) presos por um fio champanhe ao mostrador. No medalhão, o
  emblema do Devo ou o retrato do Dealer; ao lado, nome, data e vagas;
- o Devo selecionado se destaca numa faixa diagonal de luz ametista e abre um **cartão preto** (ref-12: preto
  fosco, filetes finos em champanhe, dados em tipografia técnica) com os detalhes e o botão de inscrição;
- estados por cor de aro e ícone, nunca só por cor: aberto (aro ametista), em andamento (ponteiro correndo),
  encerrado (aro champanhe apagado), cancelado (selo riscado, some em 30 dias como hoje);
- Tutoriais de que o jogador participou aparecem no fim, como livros fechados com o selo do Record.

### 3.3 Desktop

Mesmo conteúdo, no shell de desktop (`components/devo/os/desktop-shell`). No Deadly Vote o mostrador aparece
inteiro à direita, com os medalhões em arco à esquerda (como na ref-15). O livro do Tutorial abre em página dupla
no centro. A cerimônia de desbloqueio é a mesma, com o relógio maior.

### 3.4 Salão das Máscaras — painel da equipe

O Salão é tela do celular do sistema, com a identidade gótica (não há interior em pixel). O desenho do Salão em
si é de outra spec; aqui entra só o que a equipe vê por cima.

**Celular**

1. Para Anfitrião/Owner, um **botão flutuante** redondo no canto inferior direito, acima da navegação do celular
   e da área segura (`env(safe-area-inset-bottom)`), com uma máscara de porcelana e um contador em pílula
   ametista (lotes + anúncios pendentes). Ele nunca cobre a navegação.
2. Toque → **folha** que sobe da base (proposta: até 85% da altura) com três abas: **Fila**, **Edições**,
   **Relógio**. O fundo do Salão escurece (proposta: 40%).
   - **Fila:** cartões pretos de lote (carta à esquerda em pé, vendedor, raridade, lance mínimo pedido) com
     "Aprovar" e "Recusar". "Aprovar" expande no próprio cartão um campo opcional de lance mínimo e nota.
     Anúncios em lista separada ("Publicar"/"Recusar"); as duas listas não se misturam (REFERENCIAS §2.13).
   - **Edições:** lotes aprovados por edição futura. Em cada um: "Editar" (lance mínimo, mudar de edição) e
     "Cancelar lote" (devolve carta e taxa).
   - **Relógio:** o mostrador do Salão (aberto/fechado, quando fecha, próxima abertura). Botão **"Abrir agora"**
     (só com o Salão fechado e respeitando S5). A confirmação **troca o conteúdo da própria aba**, sem modal
     por cima: escolha entre "Antecipar a próxima edição" e "Edição extra", as datas calculadas no servidor
     ("Abre agora · fecha DD/MM às HH:MM · próxima abertura DD/MM às HH:MM"), e, para "antecipar", o número de
     lotes e vendedores afetados (S4). Com o Salão aberto, o botão vira **"Fechar agora"** (P9). O Owner vê
     ainda "Calendário completo", que abre o editor.
3. Cada ação mostra uma confirmação curta no topo da folha e o contador do botão atualiza.

**Desktop:** o painel vira uma coluna fixa à direita (proposta: 360 px) com as mesmas abas; o Salão continua à
esquerda.

### 3.5 Desfazer recompensa (Owner)

**Celular:** Mesa › Recompensas (o filtro atual continua) › recompensa "Entregue" › botão "Desfazer envio" no
fim da ficha, em contorno champanhe (não rubi).

1. A folha "Desfazer envio" carrega uma **simulação** do servidor, linha a linha. Cada linha tem **ícone e
   texto**, nunca só cor:
   - losango ametista cheio + "Retira" ("2 de 5 Fragmentos retirados");
   - losango vazado + "Não alcança" ("Carta X já foi vendida no Salão");
   - seta circular + "Convertido" ("3 Fragmentos viraram o Estágio II da Força") com a escolha "Reverter" ou
     "Registrar dívida" (R4).
2. Campo "Motivo" obrigatório (proposta: até 300 caracteres).
3. Confirmação de duas formas, ambas válidas:
   - **segurar** o botão "Desfazer" (proposta: 1,5 s) com um anel enchendo em volta;
   - **digitar o nome do jogador** num campo e tocar "Desfazer" (para teclado e leitor de tela; padrão do
     GitHub para ações destrutivas). O botão anuncia o estado ao leitor de tela.
4. Resultado: a ficha passa a "Desfeita por <nome> em <data> · <motivo>" e mostra o relatório.

**Desktop:** a mesma ficha num painel lateral; as duas formas de confirmar valem com mouse e teclado.

O mesmo botão aparece no histórico do jogador (Mesa › Jogadores › <nome> › Recompensas).

---

## 4. Estados de animação e de interface

Todas as durações são *(proposta)*. Toda animação tem versão para "reduzir movimento".

### 4.1 Cartaz do Tutorial

| Estado | Visual |
|---|---|
| `tutorial-aberto` | Livro aberto, fita cobalto, ponteiro do mostrador andando; o retrato do Herdeiro respira (leve escala); o botão ganha um brilho champanhe que corre a borda (proposta: a cada 4 s). |
| `tutorial-inscrito` | Carimbo "Inscrito" cai sobre a página (proposta: 200 ms) com um pó ametista. |
| `tutorial-em-analise` | Carimbo "Em análise" em champanhe apagado; sem brilho no botão. |
| `tutorial-em-andamento` | Botão do grupo com ícone do WhatsApp; ponteiro mais rápido; o retrato muda para a expressão séria. |
| `tutorial-concluido` | O livro se fecha (virada de capa em 2.5D) e recebe o selo do Record em cera ametista. |
| `vazio-novato` | Livro fechado, mostrador parado, vitral apagado ao fundo; `[texto pendente: nenhum tutorial aberto]`; data do próximo, se houver. |

### 4.2 Celular do sistema (novato)

| Estado | Visual |
|---|---|
| `icone-trancado` | Mármore escuro, selo de cera ametista, linha de requisito (`[texto pendente]`). |
| `icone-trancado-tocado` | O selo treme uma vez; o rastreador pisca; nenhuma tela de erro. |
| `rastreador` | Linha fixa sob o relógio com o próximo passo; some depois da cerimônia (ou, na opção B do P2, troca de texto). |
| `cerimonia` | Relógio do pulso gira uma volta; ícones perdem o selo e acendem em ametista um a um, cada um com o nome numa faixa curta (proposta: 600 ms por ícone). |
| `cut-in` | Faixa diagonal ametista, retrato em pose que ultrapassa a faixa, nome em letreiro champanhe, fala em caixa de VN. |

### 4.3 Painel da equipe no Salão

| Estado | Visual |
|---|---|
| `botao` | Botão flutuante com máscara e contador; o contador pulsa uma vez quando chega item novo. |
| `aberta` | Folha com abas; fundo do Salão escurecido. |
| `acao-pendente` | Botão com indicador de progresso; os outros botões do cartão ficam desabilitados. |
| `conflito` (outro membro decidiu antes) | O cartão sai da lista com a linha "Já avaliado por outra pessoa". |
| `abrir-agora-confirmar` | A aba Relógio troca de conteúdo: as duas formas, as datas do servidor e os afetados. |
| `salao-abrindo` | As máscaras do Salão acendem em sequência e o mostrador reinicia. |

### 4.4 Desfazer

| Estado | Visual |
|---|---|
| `simulando` | Linhas em esqueleto. |
| `pronto` | Linhas com ícone e texto (retira / não alcança / convertido). Sem verde; rubi só se houver erro. |
| `segurando` | Anel champanhe enchendo em volta do botão. |
| `desfeito` | Selo "Desfeita" na ficha; linha nova no histórico. |
| `bloqueado` | Fora do prazo (P7) ou já desfeita: o botão some e uma linha explica. |

---

## 5. Modelo de dados e APIs

Toda migração segue a rotina do CLAUDE.md (arquivo `scripts/<nome>-migration.sql`, entrar em `capturas.yml`,
`local-db.mjs`, `gerar-banco-novo.sh`; APIs devolvem 503 `banco_desatualizado` quando faltar coluna).
Nome sugerido: `scripts/tutorial-equipe-migration.sql`.

### 5.1 Tutorial

```sql
-- deadly_votes.is_tutorial já existe (fundacao-migration.sql §7). Continua sendo o "tipo".
ALTER TABLE players ADD COLUMN IF NOT EXISTS tutorial_concluido_at timestamptz;
ALTER TABLE players ADD COLUMN IF NOT EXISTS tutorial_vote_id uuid REFERENCES deadly_votes(id) ON DELETE SET NULL;

-- Conclusão: gravada quando o resultado de um Tutorial é aplicado (applyVoteResults), para cada aceito
-- cuja decisão conta como "concluir" (A: 'sobreviveu'; B e C: tudo menos 'ausente'; P2).
-- Backfill (P4): veteranos de hoje.
UPDATE players p SET tutorial_concluido_at = coalesce(p.tutorial_concluido_at, now())
 WHERE p.tutorial_concluido_at IS NULL
   AND (EXISTS (SELECT 1 FROM deadly_vote_entries e WHERE e.player_id = p.id AND e.outcome IS NOT NULL)
     OR EXISTS (SELECT 1 FROM player_unlocks u WHERE u.player_id = p.id AND u.source = 'deadly_vote'));

-- Opção B do P2: em devo_dv_desbloquear, além das flags do próprio voto, o sobrevivente de um voto Comum
-- que ainda não tem nenhuma flag de origem 'deadly_vote' recebe devo_tutorial_flags().
-- Opção C: o mesmo gatilho passa a aceitar outcome <> 'ausente' quando is_tutorial.
```

Função pura nova em `lib/devo/progresso.ts`: `ehNovato(cargo, tutorialConcluidoAt)` → `cargo === 'player' &&
!tutorialConcluidoAt`.

| Rota | Mudança |
|---|---|
| `GET /api/record` (`getRecord`) | Filtra pelo §2.3 no SQL. Payload ganha `novato: boolean`, `proximoTutorial: { inicio } \| null` (do Calendário) e `proximoPasso` para o rastreador. Cada voto ganha `tipo: 'comum' \| 'tutorial'`. |
| `POST /api/record {action:'join'}` (`joinVote`) | Confere na mesma transação: novato só em Tutorial (409 `{code:'tutorial_pendente'}`); veterano não em Tutorial (409 `{code:'tutorial_ja_feito'}`, se P3); novato com outro Tutorial ativo (409 `{code:'tutorial_ativo'}`). |
| `createVote` / `updateVote` | Aceitam `tipo`. Permissão `dv.tutorial` passa a `isStaff` se P1 aprovar. Mudar o tipo de um Devo com inscritos: bloqueado (409). O formulário da Mesa mostra o campo `unlocks` com o aviso de que ele abre sistemas (T6). |
| `applyVoteResults` | Se `is_tutorial`, grava `tutorial_concluido_at`/`tutorial_vote_id` (só se ainda nulo) na mesma transação; `admin_log 'tutorial.concluido'`. Devolve, por jogador, se a cerimônia deve tocar (flags novas). |
| `getStaffBoard` | Já devolve `isTutorial`; a Mesa mostra o selo, um filtro "Tutoriais" e o contador de novatos em espera (§7, B-4). |

### 5.2 Salão: painel da equipe

Sem tabela nova. A configuração `devo_config['salao.calendario']` ganha campos opcionais:

```ts
// lib/devo/salao.ts — SalaoCalendarioCfg
fimAntecipado?: { n: number; at: string } | null      // "Fechar agora" da edição n
extras?: { inicio: string; fim: string }[]            // "Edição extra": abre sem lotes da fila
```

**Antecipar a próxima edição sem bagunçar a numeração.** Os lotes aprovados guardam o número da edição
(`salao_lotes.edicao`), calculado a partir da âncora. Mudar a âncora para "agora" renumeraria tudo. Por isso
"antecipar" recalcula a âncora de modo que a **próxima** edição (n+1) comece agora:

```
n         = edicaoCorrente(cfg, agora)
ancora'   = agora − (n+1) × intervalo_dias × 24 h
forcar    = null ; fimAntecipado = null
```

Os lotes da edição n+1 entram nesta abertura (com até 3 dias a menos de divulgação, por isso S4 mostra e avisa
os vendedores); as seguintes caem a cada 3 dias a partir de agora.

**Edição extra:** acrescenta `{ inicio: agora, fim: agora + duracao_horas }` em `extras`. `relogioSalao` passa a
considerar o Salão aberto também dentro de um extra, sem mudar `edicaoCorrente`; leilões da fila não entram.

As duas só valem com o Salão fechado e depois do intervalo mínimo (S5). Feitas sob
`pg_advisory_xact_lock(hashtext('salao:calendario'))`.

**Fechar agora:** grava `fimAntecipado = { n: corrente, at: agora }` (ou encerra o extra corrente);
`relogioSalao` considera a edição fechada a partir de `at`, e `liquidar()` encerra os lotes (a regra de
`edicaoEncerrada` já usa `!aberto`).

Ações novas em `POST /api/salao`:

| Ação | Quem | Faz |
|---|---|---|
| `relogio.simular_abrir` `{ modo }` | Anfitrião+ | Devolve as datas e, em `antecipar`, os lotes e vendedores afetados. Não grava. |
| `relogio.abrir_agora` `{ modo: 'antecipar' \| 'extra' }` | Anfitrião+ (`salao.relogio`) | Como acima; avisa os vendedores (S4). `admin_log 'salao.abrir_agora'` com o modo, a âncora antiga e a nova. |
| `relogio.fechar_agora` | Owner; Anfitrião se P9 | Grava `fimAntecipado`. |
| `lote.editar` `{ loteId, lanceMinimo?, edicao? }` | Anfitrião+ (`salao.editar`) | Só lote `aprovado` cuja edição ainda não abriu; respeita vagas (mesma trava `salao:vagas`). |
| `lote.cancelar` `{ loteId, nota }` | Anfitrião+ | Lote `aprovado` sem lance → `recusado`; devolve carta (`deliverCard`, idem `salao:lote:<id>:devolucao`) e taxa. |
| `avaliacao.lote` / `avaliacao.anuncio` | sem mudança | Reaproveitadas pelo painel. |

`GET /api/salao` ganha `equipe: { pendentes: { lotes, anuncios }, podeRelogio, podeEditar } | null` para quem
tem cargo (evita uma segunda chamada só para o contador).

Permissões novas em `lib/devo/cargos.ts` (em `ACOES` e em `FUNDACAO.md`): `'salao.relogio'` (owner | anfitriao),
`'salao.editar'` (owner | anfitriao).

### 5.3 Desfazer recompensa

```sql
ALTER TABLE reward_proposals DROP CONSTRAINT IF EXISTS reward_status_chk;
ALTER TABLE reward_proposals ADD CONSTRAINT reward_status_chk
  CHECK (status IN ('pendente', 'aprovada', 'rejeitada', 'entregue', 'cancelada', 'desfeita'));
ALTER TABLE reward_proposals ADD COLUMN IF NOT EXISTS undone_by uuid REFERENCES players(id);
ALTER TABLE reward_proposals ADD COLUMN IF NOT EXISTS undone_at timestamptz;
ALTER TABLE reward_proposals ADD COLUMN IF NOT EXISTS undo_note text;
ALTER TABLE reward_proposals ADD COLUMN IF NOT EXISTS undo_report jsonb;
-- devo_reward_guard(): 'desfeita' só a partir de 'entregue' e só com undone_by de cargo 'owner'
-- (RAISE 'DESFAZER_NAO_PERMITIDO' 42501). devo_reward_log() já registra a troca de status.

-- R4: livro de dívidas (proposta). Créditos futuros do mesmo recurso quitam a dívida primeiro.
CREATE TABLE IF NOT EXISTS player_dividas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  recurso text NOT NULL,            -- 'item:<id>', 'tempo', 'fragmento:<arcano>', ...
  quantidade integer NOT NULL CHECK (quantidade > 0),
  restante integer NOT NULL CHECK (restante >= 0),
  reward_id uuid REFERENCES reward_proposals(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  quitada_at timestamptz
);
```

Ação nova em `lib/devo/cargos.ts`: `'recompensa.desfazer'` (só Owner).

Função `undoRewardIn(c, ator, id, { nota, simular, escolhas })` em `lib/devo/recompensas-server.ts`, tudo numa
transação, linha travada (`lockRow`). Com `simular: true` monta o relatório e faz `ROLLBACK`. `escolhas` diz,
por linha convertida, `reverter` ou `divida`.

| Recurso | Como retira | Quando não dá como está |
|---|---|---|
| `item` | `devo_item_consume` até o saldo, idem `recompensa:<id>:desfazer`. | Saldo menor: retira o que houver; o resto vira "não alcança" ou dívida. |
| `item` dado a Visitante | Não reverte (afinidade já subiu). | Dívida do item. |
| `convite` | Igual a item. Códigos gerados com ele: revoga os **não usados** gerados depois da entrega, até a quantidade. | Código já usado: só relata. |
| `tempo` | Primeiro desconta de `arcade_profiles.time_pending_ms` (ainda não resgatado); o resto sai de `timerEndsAt`, sem deixar o pulso abaixo de `agora + x min` (P10). | O que não sai vira dívida de Tempo. |
| `carta` | Entrega não resgatada (`card_deliveries.claimed_at IS NULL`, `idem_key = recompensa:<id>:<i>`) → marca `revoked_at`; resgatada → remove o uid `dlv-<delivery id>` do save, se ainda estiver lá. | Vendida, trocada ou no Salão: relata. Usada na Confecção: reverter = desfazer a confecção se a carta resultante ainda existir; senão, dívida. |
| `fragmento` | Retira do saldo. | Gasto num Estágio de Arcano: reverter = rebaixar o Estágio e devolver os Fragmentos (que então saem); ou dívida. |
| peça de aparência | Retira do inventário. | Em uso: reverter = trocar pela peça padrão daquele espaço (`SPEC-AVATAR.md`) e retirar. |
| `arcano` | `arcano_escolhas` ainda sem escolha → apaga a linha. A flag `virtudes` só sai se não houver outra fonte. | Arcano já escolhido: relata e não mexe (P11). |

Rastrear conversões exige que cada sistema guarde a origem do que consumiu (Estágio, Confecção, presente). Onde
isso ainda não existe, a simulação mostra "origem desconhecida" e oferece só a dívida.

Rota: `POST /api/staff { action: 'recompensa.desfazer', id, nota, simular?, escolhas? }` → `{ ok, relatorio }`.
Coluna nova `card_deliveries.revoked_at timestamptz`; `claimCards` ignora entregas revogadas.
`admin_log 'recompensa.desfeita'` com o relatório.

---

## 6. O que muda em sistemas atuais

| Sistema | Muda |
|---|---|
| Record / Deadly Vote (`record-server.ts`) | Filtro de lista e de inscrição por novato; `tipo` e `proximoPasso` no payload; conclusão gravada ao aplicar resultado. |
| Mesa › Deadly Votes (`dealer-board.tsx`) | Seletor "Tipo: Comum / Tutorial" (hoje é caixa só para Owner/Anfitrião); filtro "Tutoriais"; aviso no campo `unlocks`; contador de novatos em espera. |
| Progressão (`progresso.ts`, gatilhos da Fundação) | Entra `ehNovato`. Opção B/C do P2 mexe em `devo_dv_desbloquear`. |
| Narrativa (`prologue-script.ts`, `intro-script.ts`) | Texto igual. A fala "Cheque seu aplicativo Devo…" aponta para o cartaz do Tutorial; a aula pode ser revista pelo rastreador. Cut-ins novos com `[fala pendente]`. |
| Home do celular | Rastreador de missão; ícones trancados com selo e requisito; cerimônia de desbloqueio (R3F, que o projeto já usa). |
| Calendário | Evento do tipo "Tutorial" (proposta) para alimentar `proximoTutorial`. |
| Salão (`salao.ts`, `salao-server.ts`, `/api/salao`) | `fimAntecipado`, `extras`; ações `relogio.*` e `lote.*`; bloco `equipe` no GET. |
| Recompensas (`recompensas-server.ts`, gatilho de guarda) | Status `desfeita`; `undoRewardIn`; `player_dividas`; rota na Mesa. |
| Inventário (`inventario-server.ts`) | `revoked_at` em `card_deliveries`; quitação de dívida antes de creditar. |
| Cargos (`cargos.ts`, `FUNDACAO.md`) | Ações `salao.relogio`, `salao.editar`, `recompensa.desfazer`; `dv.tutorial` possivelmente para `isStaff`. |

Nenhuma função atual sai. A avaliação do Salão na Mesa continua para toda a equipe.

---

## 7. Auditoria de brechas

Lidas no código de 31/10. Separadas em **requisitos antes do v2** (sem eles, todo prêmio de tutorial pode ser
forjado, inclusive o Arcano do Estágio 0) e **sugestões** para o dono aprovar uma a uma (P13).

### 7.1 Requisitos antes do v2

- **A-1. O Tempo do jogador é decidido pelo navegador.** `POST /api/save` grava `timerEndsAt` como o cliente
  mandar (`lib/devo/save.ts` só confere se é número). O Salão cobra lances e compras desse mesmo campo
  (`debitar` em `salao-server.ts`). Quem editar o próprio save tem Tempo infinito; um save antigo enviado depois
  da compra devolve o Tempo pago.
  **Sugestão:** o servidor passa a ser o dono do Tempo (livro-caixa: `timerEndsAt` só muda por crédito/débito
  no servidor; o `/api/save` ignora o valor do cliente ou só aceita valores menores).
- **A-2. O inventário de cartas também vem do navegador.** O `/api/save` aceita até 300 cartas com qualquer
  `cardId` e `uid`. Bandeja, Mercado, Confecção e o peso do Deadly Vote leem esse inventário como verdade. Dá
  para "criar" uma Lendária e vendê-la no Salão.
  **Sugestão:** o servidor guarda os uids que ele mesmo entregou (`card_deliveries`, pacotes, Poço, trocas) e o
  `/api/save` descarta cartas sem origem conhecida. Uma migração registra o inventário atual como ponto de
  partida.
- **A-3. Cartas resgatadas podem sumir.** `claimCards` marca a entrega como resgatada antes de o cliente salvar.
  Se a rede cair entre a resposta e o próximo save, a carta foi "entregue" e não está em lugar nenhum.
  **Sugestão:** o servidor adiciona a carta direto no save (como já faz para tirar cartas no Salão), ou o
  resgate só se confirma no save seguinte que contenha o uid `dlv-<id>`.

O desfazer (§2.7) e a dívida (R4) dependem de A-1 e A-2: se o saldo vem do cliente, não há o que retirar.

### 7.2 Sugestões

- **B-1. Uma recompensa entregue não tem volta.** Hoje só existe cancelar antes da entrega. É o pedido do dono
  (§2.7).
- **B-2. Inscrição do novato em qualquer Devo, e do veterano no Tutorial.** `joinVote` não olha o tipo. Um
  veterano pode entrar em todo Tutorial e repetir prêmios pensados para iniciantes. **Sugestão:** §2.4 no
  servidor.
- **B-3. Abrir o Salão "agora" muda a numeração das edições.** Hoje, se o Owner mudar a âncora à mão, os lotes
  aprovados vão parar em outra data sem aviso. **Sugestão:** §5.2 e, no editor completo do Owner, um aviso
  quando a mudança mover lotes aprovados.
- **B-4. Novatos esperando sem Tutorial aberto.** **Sugestão:** a Mesa mostra no topo, em destaque, "N novatos
  aguardando tutorial · último aberto há D dias" quando N > 0 e não houver Tutorial convocado.
- **B-5. "Forçar aberto" não tem fim.** Com `forcar: 'aberto'` a edição só encerra quando o Owner soltar.
  **Sugestão:** "Abrir agora" substitui o forçar no dia a dia; o forçar ganha prazo máximo de `x` horas.
- **B-6. Tempo creditado por recompensa não tem idem.** `deliverIn` → `creditMinutes` confia só na trava da
  linha e no status. **Sugestão:** gravar o crédito num livro (`reward_id` único), como o Salão faz em
  `salao_movimentos`.
- **B-7. Dealer cria Tutorial (se P1 aprovar) e o desbloqueio é automático.** As flags saem pelo gatilho sem
  ninguém olhar. **Sugestão:** Tutorial criado por Dealer só desbloqueia depois que o Anfitrião dele der o visto
  no resultado. O mesmo vale para `unlocks` preenchido num Devo Comum (T6).
- **B-8. Registro da equipe espalhado.** Algumas ações gravam `admin_log`, outras não (recusar lote, publicar
  anúncio, mudar status do Devo, aceitar inscrição). **Sugestão:** toda ação de equipe grava `admin_log`; a Mesa
  ganha uma aba "Registro" filtrável por pessoa.
- **B-9. Lembrete do pulso sem segredo.** `app/api/cron/pulse` só confere a senha se `CRON_SECRET` existir.
  **Sugestão:** recusar quando a variável não existir. (Quem coloca a variável é o dono; nada de segredo no
  repositório.)
- **B-10. Vitória na Sala de Jogos entre contas combinadas.** Partida casual vale +3 min sem limite diário
  (`arcade/server.ts`). **Sugestão:** teto diário de `x` min vindo de partidas casuais e nada de Tempo contra o
  mesmo adversário mais de `x` vezes por dia.
- **B-11. Trocas com mais de um aparelho.** Não deu para confirmar, só lendo, se a Sala de Trocas valida a posse
  da carta no servidor. **Sugestão:** um teste dedicado (`scripts/dev/*-test.mjs`) antes do v2.
- **B-12. Outras ideias (não são brechas):** desfazer o resultado de um Deadly Vote aplicado por engano (só
  Owner); "ver como o jogador vê" na Mesa (novato/veterano); "Aprovar todos desta raridade" no painel do Salão,
  com confirmação.

---

## 8. Ligações com outras specs

| Spec | O que muda nela (aplicado na harmonização de 01/11, noite) |
|---|---|
| `SPEC-AVATAR.md` §2.2, PENDENTE 1 | A1/A1-b passam a apontar para D-1 (§2.8 daqui). Sai a folha do avatar provisório. O fim da criação não manda mais para "SPEC-TUTORIAL §3.1 passo 1": a criação é o passo 8 daqui, e a Casa segue com a `SPEC-CASA.md`. |
| `SPEC-AVATAR.md` PENDENTE 7 (guia) | No celular, o guia é o Herdeiro (§3.1); dentro da Casa, continua lá. |
| `SPEC-CASA.md` P14, PENDENTE 19, estado `so_quarto` | Apontam para D-1. Com D-1 o estado `so_quarto` antes de `galo_casa` deixa de existir, e a placa "Vença o Deadly Vote do tutorial…" (texto que não é do dono) sai. |
| `INVENTARIO.md` | Linhas do prólogo e da aula: sem mudança de função; ganham o rastreador e o "Rever a aula". |

Este documento é a fonte da ordem de entrada. As outras specs descrevem as telas que vêm depois.

---

## 9. Como jogos bem avaliados resolvem

| Jogo | O que faz | O que o DEVO adota | O que não adota |
|---|---|---|---|
| Persona 5 Royal | Os primeiros dias trancam sistemas pela história; cada Confidente e cada local novo entra com cut-in de nome e retrato em pose. | Cerimônia de desbloqueio com faixa de nome por sistema; cut-in do Herdeiro no resultado. | O vermelho do P5 e o ritmo de semanas de tutorial. |
| Animal Crossing: New Horizons | Começa numa barraca; a casa e os serviços chegam por etapas; o personagem é criado na chegada. | A Casa como recompensa (chaves entregues pelo Galo). | Criar o personagem no começo: aqui a criação fica na entrada da Casa (D-1), porque antes dela não há mundo andável. |
| Stardew Valley | O Centro Comunitário tapado mostra o que vem e o que falta. | Ícone trancado visível, com selo e requisito. | Tapumes num mapa: o DEVO não tem cidade. |
| Genshin Impact / Honkai: Star Rail | Requisito escrito no próprio ícone; rastreador de missão fixo. | Linha de requisito no ícone; rastreador sob o relógio. | Lista longa de missões paralelas. |
| Final Fantasy XIV | Funções liberam por missões curtas; há atalho para quem chega atrasado. | "Rever a aula" e a opção B do P2 para quem morreu. | Pular o tutorial pagando; aqui só Owner/Anfitrião pulam (`acesso.pularTutoriais`). |

---

## 10. Pendências que só o dono decide

1. **P1 — Quem cria Tutorial.** O texto diz "um dealer ou quem quer que crie um devo". Liberar para o Dealer?
2. **P2 — O que é "finalizar".** Opção A, B (proposta) ou C (§2.2).
3. **P3 — Veterano e Tutorial.** O veterano deixa de ver e de se inscrever em Tutoriais?
4. **P4 — Contas antigas.** Quem já joga hoje conta como quem fez o Tutorial (proposta) ou passa por um?
5. **P5 — "Padrão de três dias".** "Um salão a cada 3 dias, aberto 24 h" (como hoje) ou "aberto por 3 dias"?
6. **P6 — Dealer no Salão.** Continua avaliando pela Mesa (proposta) ou a avaliação fica só de Anfitrião para
   cima?
7. **P7 — Prazo para desfazer recompensa.** `x` dias depois da entrega, ou sem prazo.
8. **P8 — Textos da tela do novato.** Estado vazio do Tutorial, linha de requisito nos ícones, rastreador, aviso
   ao vendedor de lote antecipado e as falas do Herdeiro (vitória, derrota). Tudo `[pendente]` até o dono
   escrever.
9. **P9 — Fechar agora.** Anfitrião pode fechar um Salão aberto, ou só o Owner?
10. **P10 — Tempo ao desfazer.** Pode deixar o pulso abaixo de `x` minutos?
11. **P11 — Arcano já escolhido.** Desfazer tira o Arcano escolhido ou só registra?
12. **P12 — Aviso ao jogador.** Quem perde uma recompensa desfeita recebe mensagem? De quem (Sistema, NPC)?
13. **P13 — Sugestões do §7.2**, uma a uma. Os requisitos do §7.1 são recomendados como obrigatórios.
14. **P14 — Dealer novo.** A promoção a Dealer não mexe nas flags (proposta), ou Dealer recebe os sistemas?
15. **P15 — Conversões no desfazer.** Padrão "reverter quando der" (proposta) ou sempre dívida?
16. **P16 — Intervalo mínimo entre aberturas do Salão.** `x` horas desde o último fechamento.
17. **P17 — Corpo do avatar e gênero do prólogo.** Pré-selecionar o corpo pelo gênero (proposta) ou começar
    neutro?
18. **D-1 — Ordem de entrada.** Avatar na primeira entrada da Casa, depois da vitória (proposta), ou D-1-A
    (espelho 2.5D no celular antes do tutorial).

---

## 11. Riscos e anti-abuso

| Risco | Medida |
|---|---|
| Novato sem Tutorial aberto fica sem o que fazer (a espera pode passar de uma semana). | Tudo o que o Início já dava continua aberto (§1.1); "Rever a aula"; rastreador com a data do próximo; contador de novatos em espera em destaque na Mesa (B-4). |
| Quem morre no tutorial fica trancado para sempre. | P2 em qualquer das três opções tem saída (§2.2). |
| Veterano antigo trancado por engano. | Backfill (P4) e override manual do Owner (`desbloqueio.override` ganha "marcar tutorial concluído"). |
| Novato segura vaga em vários Tutoriais. | Um Tutorial ativo por vez (§2.4). |
| Farm de prêmio do Tutorial. | Veterano fora do Tutorial; conclusão gravada uma vez (`tutorial_concluido_at` só se nulo); requisitos A-1 e A-2. |
| Flags abertas por um Devo Comum sem ninguém ver. | Aviso no campo `unlocks` (T6) e visto do Anfitrião (B-7). |
| Mudar o tipo depois de ter inscritos. | Bloqueado no servidor (409). |
| Anfitrião abre o Salão várias vezes seguidas para encurtar o ciclo. | Só com o Salão fechado e depois de `x` horas (S5); tudo no `admin_log`. |
| Vendedor surpreendido pela antecipação. | S4: número de afetados antes de confirmar, aviso em Mensagens, e a opção "edição extra" que não mexe na fila. |
| Duas pessoas da equipe decidem o mesmo lote. | Linha travada (`FOR UPDATE`) e status conferido; o segundo recebe 409 e o cartão sai da lista. |
| Desfazer por engano. | Simulação antes; motivo obrigatório; segurar ou digitar o nome; só Owner; nada é apagado. |
| Receber e converter na hora para escapar do desfazer. | Conversões rastreadas e dívida (R4). |
| Desfazer tira mais do que foi dado. | Idem `recompensa:<id>:desfazer` em cada retirada; nunca abaixo de zero; dívida limitada à quantidade entregue. |
| Desfazer e entrega ao mesmo tempo. | Mesma trava da linha em `reward_proposals`; o gatilho de guarda só aceita `entregue → desfeita`. |
| Botões de equipe vistos por jogador. | O cliente esconde e cada ação confere o cargo no servidor (`requireCan`). |
| Owner exposto em tela pública. | Registros e fichas mostram "Owner" só para quem tem `cargo.ver_owner` (`cargoVisivel`). |
| Animação pesada no celular. | Cerimônia e paralaxe em R3F com limite de quadros; "reduzir movimento" troca tudo por fades. |
| Banco sem a migração. | Rotas devolvem 503 `banco_desatualizado`; a lista de Devos cai para o comportamento atual (sem filtro) em vez de travar o novato. |

---

## 12. Decisões de revisão (01/11/2026)

O que a crítica apontou e o que foi feito:

1. **Spec anterior às correções de 01/11.** Procede. Entraram as três falas do dono no §0, a regra "pixel só na
   Casa e nas Torres" (depois afinada: nada de pixel em lugar nenhum; Casa e Torres são cenário pintado de RPG Maker /
   VN, `MOTOR-CASA-TORRES.md`), os NPCs com referência Persona (cut-ins), as refs 12, 15 e 21 e o 2.5D (livro do
   Tutorial, cerimônia, mostrador).
2. **Primeira tela no Quarto em pixel / celular como acessório.** Procede. O fluxo (§3.1) agora é prólogo → aula
   → celular do sistema → Tutorial → cerimônia → Casa. O mundo da Casa só aparece na primeira entrada da Casa (em cenário pintado, não em pixel, desde a harmonização de 01/11).
3. **Mapa da cidade, tapumes, câmera pelos prédios.** Procede. Tudo saiu; os equivalentes são ícone selado com
   requisito, rastreador e cerimônia de desbloqueio. Os estados de sprite (§4.2 antigo) saíram desta spec.
4. **Salão em vista de cima.** Procede. O painel da equipe é desenhado para o Salão no celular do sistema.
5. **Casa trancada e aberta ao mesmo tempo.** Procede. D-1 (§2.8) é a fonte única: Casa trancada inteira até
   `galo_casa`. O §8 lista o que as outras specs devem trocar. Não editei `SPEC-CASA.md` nem `SPEC-AVATAR.md`
   nesta tarefa porque ela é a revisão só desta spec.
6. **Justificativa de A1 caiu.** Procede. D-1 adota a A1-b sem avatar provisório; a A1 ficou como D-1-A, refeita
   como tela pintada/2.5D, não como cômodo em pixel.
7. **Prólogo e aula ignorados; gênero.** Procede. Passos 1–2 do §3.1, "Rever a aula" e P17.
8. **O que o novato pode usar.** Procede. Tabela §1.1. A proposta é não trancar nada que hoje é livre.
9. **Brecha do P2 e porta `unlocks`.** Procede. Opções A/B/C no §2.2 e T6.
10. **Dealer sem flags.** Procede. §2.2 e P14.
11. **Frases inventadas.** Procede. "A equipe abre um por semana" e a placa da Casa saíram; os textos da tela
    ficaram `[pendente]` e foram reunidos em P8.
12. **Números sem marca de proposta.** Procede. Convenção no topo e marca em cada número.
13. **Estética genérica.** Procede. Cortiça, papel arquivado, toasts e verde saíram. Entraram livro de missão
    (ref-21), medalhões no mostrador (ref-15), cartões pretos (ref-12), fita cobalto, selo do Record, 2.5D.
    **Discordância parcial:** a crítica sugeriu as três referências juntas no cartaz do Tutorial; usei o livro
    só para o Tutorial e os medalhões para a lista do veterano, para que o Tutorial pareça um objeto único e a
    lista, um índice. O desenho final do Deadly Vote é de outra spec; aqui só fica o que depende do tipo.
14. **Guia sem nome e em balão.** Procede. O guia no celular é o Herdeiro (Rato para trocas), sempre em cut-in.
15. **Celular.** Procede nos cinco pontos: botão flutuante acima da navegação e da área segura; confirmação
    dentro da folha; nada de celular dentro do celular (o aviso agora é o ícone com ponto cobalto e o
    rastreador); alternativa de digitar o nome; relatório com ícone e texto, sem verde.
16. **"Abrir agora" encurta a divulgação.** Procede. S3–S5: duas formas, afetados à vista, aviso aos vendedores,
    intervalo mínimo `x` (P16) também na tabela de regras.
17. **Conversões escapam do desfazer.** Procede. R4, tabela do §5.3 e `player_dividas`. Observação: onde o
    sistema ainda não guarda a origem do que consumiu, só a dívida é possível; isso está dito no §5.3.
18. **Laço de referências com SPEC-AVATAR.** Procede. Esta spec é dona da ordem (§8); a criação é o passo 8.
19. **Brechas misturadas.** Procede. §7.1 (requisitos antes do v2: Tempo, inventário, resgate) e §7.2
    (sugestões). **Discordância pequena:** a crítica pediu "1, 2 e 7"; mantive exatamente essas três como
    requisitos e deixei o livro de Tempo das recompensas (B-6) como sugestão, porque ele só pesa depois que A-1
    existir.
20. **Seção de referências de jogos.** Procede. §9, com o que se adota e o que não.

Não entrou: o redesenho dos cosméticos e o desenho completo do Salão e do Deadly Vote, que pertencem às specs
desses sistemas. Esta spec só define o que o tipo "tutorial", o painel da equipe e o desfazer acrescentam.
