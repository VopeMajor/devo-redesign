# SPEC: Visitantes, afinidade, paixão e romance (DEVO v2)

Especificação do sistema de Visitantes: quem bate na porta da Casa e com que chance, as Essências de Afinidade,
presentes e gostos, escolhas que mexem no vínculo, recompensas por nível, a tela de NPCs conhecidos no estilo dos
Confidentes do Persona, a marca de "paixão" e a barra de romance, diálogos e CGs de encontro, decorações,
Hostilidade e Quartos de Hóspedes.

Base:
- Pedido do dono em `PEDIDO-V2-dono.md`: blocos "[Um Visitante apareceu]", "[Decorações]", "[Hostilidade]",
  "[Quartos de Hóspedes]", o parágrafo da "segunda tela" e o de "caos e ordem". As correções de 01/11 no topo do
  arquivo valem sobre o resto.
- Texto do dono sobre as Essências, na fala do Galo: `../SISTEMAS-texto-do-dono.txt`, linhas 832-916.
- Código atual:
  - elenco e retratos: `lib/devo/npcs.ts`, `lib/devo/npc-rostos.json`, `public/images/npc/<id>/`;
  - motor de diálogo: `lib/devo/dialogo/formato.ts`, `dialogo-server.ts`, tabelas `dialog_progress` e
    `dialog_events` (`scripts/narrativa-migration.sql`);
  - inventário: `item_defs`, `player_items`, `item_ledger` (`scripts/fundacao-migration.sql`);
  - Essências: `essencia:<npc>` (`scripts/fundacao-migration.sql`, `scripts/torres-migration.sql`),
    `lib/devo/essencias-arte.ts`, custo dos andares em `lib/devo/torres/*`;
  - Poço: `lib/devo/poco.ts` (categoria `essencia`), `lib/devo/poco-server.ts`;
  - Karma: `karma_log`; recompensas: `lib/devo/recompensas-server.ts` (`deliverIn`);
  - Arcanos: `public/images/arcanos/<chave>/` (figura, retrato, sigilo);
  - cosméticos: `lib/devo/cosmeticos.ts`, `components/devo/cosmeticos/*`.
- Specs v2 que continuam valendo: `SPEC-CASA.md` (2.2-h, 2.2-i, 2.2-l, 2.2-n, 5.1, 7), `SPEC-ORDEM.md` (honra,
  necro, faixas), `SPEC-AVATAR.md` (estados `escondido`, `assustado`, `acenando`; PENDENTE 8 sobre o avatar nas
  CGs), `SPEC-RITOS.md` (convenções e cut-ins), `REFERENCIAS.md` §1.3, §2.4, §2.5, §2.6.
- Fichas dos NPCs redesenhados com o Persona como referência: `npcs/*.md` (melissa, galo, herdeiro, javali, rato,
  coruja, corvo). **Nos detalhes do próprio personagem (cor de assinatura, poses, olho no estado de ameaça,
  identidade anônima), a ficha manda sobre esta spec.** Esta spec dá o padrão e a estrutura.
- Motor da Casa: `MOTOR-CASA-TORRES.md` e `prototipo-motor/` (cenário pintado em camadas, oclusor, luz, cut-in na
  batida da porta). Onde a `SPEC-CASA.md` ainda fala em pixel ou diverge do que está aqui, vale a tabela de
  reconciliação da seção 8.1, até a `SPEC-CASA.md` ser atualizada.
- Referências do dono: `refs/ref-01..22.jpg`. As que mais pesam aqui: 08 (duas barras com ícone: 阴暗值,
  "escuridão", e 好感度, "afeição"), 12 (cartões pretos), 14 (retratos em medalhão e árvore), 15 (lista de
  capítulos em medalhões com mostrador), 17 e 18 (emblemas), 21 (missões em livros abertos), 22 (mapa orbital).
- Jogos citados como comparação: Persona 5 Royal e 3 Reload (Confidentes, rank com cena, cartão de chamada),
  Stardew Valley (presentes, gostos revelados, aniversário), Animal Crossing (camping com chance crescente,
  mudança de morador anunciada), Amor Doce (rotas e CGs com variante), Alien: Isolation (a ameaça aprende os
  esconderijos, mas deixa pistas), Clock Tower (esconderijo que falha ao acaso frustra), Coffee Talk (visita
  como cena roteirizada).

Convenções:
- Trecho em bloco de citação é **texto literal do dono**. Não se reescreve nem se "corrige".
- **PENDENTE n** remete à lista da seção 11. Número que o dono não deu aparece como `X` na tela e como `null` no
  banco, com `provisional = true`. Esta spec não inventa valor final.
- **PROPOSTA Vn** é decisão desta spec que o dono pode recusar ("aprovo V3, não aprovo V7").
- **Interface do DEVO** = identidade gótica com desenho novo (mármore negro, porcelana, aço champanhe, ametista,
  cobalto, arte pintada). Nada de pixel. Nada reaproveitado das telas atuais: as molduras e composições abaixo são
  novas.
- **Casa** = cena de RPG Maker / visual novel: o avatar anda, objetos se tocam, diálogo com retrato grande,
  escolhas, visitantes. Só a Casa e as Torres usam esse registro.
- Os números de seção da `SPEC-CASA.md` aparecem como "Casa 2.2-h".
- **Cor**: a interface base fica na paleta do DEVO (mármore negro, porcelana, aço champanhe, ametista, cobalto).
  O **acento de cada NPC** (faixa do cut-in, aro do medalhão, luz de recorte, borda e faixa do cartão) usa a cor
  de assinatura da ficha (`npcs/*.md`: Galo cobre `#D2662E`, Coruja âmbar `#E3A13B`, Corvo verdete `#3FA38C`,
  Melissa azul Companhia `#4A6CF0`…). Como no Persona: interface comum, acento por personagem. Rubi `#A3121F`
  continua reservado para alerta.
- **Nomes** (para não colidir com outros sistemas):
  - "Hostil" é só a **faixa** de Caos e Ordem (`SPEC-ORDEM.md`).
  - O tipo de visita de quem vem para prejudicar é **`ameaca`**; na tela, "Ameaça". O filtro é "Ameaças". O NPC
    nesse estado está "em ameaça" (`ameaca_ate`). O texto literal do dono ("Visitantes hostis", "NPC hostil")
    continua citado como está.
  - "Anfitrião" é o **cargo da equipe** (Owner/Anfitrião). O título narrativo dos NPCs ("Anfitrião do Arcano do
    Imperador") não aparece nas telas de Vínculos; lá o NPC leva o nome e o Arcano. Na Mesa, o cargo aparece
    como "Anfitrião (equipe)".
- **Tempo**: "dia", "semana" e "período" seguem o fuso `America/Sao_Paulo`. A semana começa na segunda-feira.

---

## 1. Objetivo para o jogador

Os Visitantes são as pessoas do mundo do DEVO que entram na vida do Record pela porta de casa. O sistema tem de
responder a cinco vontades do jogador:

1. **"Quero que alguém apareça."** A casa não é um cenário vazio. De tempos em tempos alguém bate. O jogador pode
   puxar a sorte para o lado de quem ele quer ver: decorando do jeito que aquele NPC gosta, marcando paixão.
2. **"Quero que essa pessoa goste de mim."** Cada conversa conta. Cada presente certo conta mais. O jogador sente
   o vínculo crescer sem ver número, por gestos do personagem, pela barra e pelo rank.
3. **"Quero saber em que pé estamos."** Os NPCs conhecidos ficam registrados numa tela própria, no espírito dos
   Confidentes do Persona: rank, Arcano, próximo prêmio, gostos descobertos e as lembranças guardadas.
4. **"Quero algo a mais com alguém."** Com paixão marcada, abre-se uma segunda barra, a de romance, que leva a
   diálogos próprios e à imagem do encontro, como no Amor Doce.
5. **"Quero me proteger."** Nem toda visita é boa. O jogador aprende a ler a ameaça, a se esconder e a deixar a
   casa menos convidativa para quem quer machucá-lo.

E o que ele ganha com isso, nas palavras do dono: Chaves de Torres, Pacotes de Cartas, Dracmas "e muitos outros";
e, para os vínculos mais fortes, um morador com "recompensas secretas".

---

## 2. Regras do dono (literais) e como o sistema as lê

### 2.1 Visitantes

> *# [Um Visitante apareceu]*
>
> [Visitantes são NPCs que possuem um sistema próprio de afinidade evolutiva.]
>
> [De tempos em tempos, eles poderão aparecer na sua casa em busca de conversas fiadas, favores ou até mesmo
> intrigas.]
>
> [A afinidade com cada Visitante é determinada pelas Essências de Afinidade.]
>
> [Sempre que interagir com um deles, pense cuidadosamente em cada resposta. Suas escolhas podem criar, fortalecer
> ou prejudicar o relacionamento.]
>
> [A maneira mais simples de evoluir esse vínculo é oferecer presentes compatíveis com os gostos pessoais do NPC.]
>
> [Você pode adquirir esses presentes no Poço dos Milagres ou durante eventos.]
>
> [Dependendo do grau de afinidade alcançado, um NPC com quem você tenha construído um vínculo suficientemente
> forte poderá recompensá-lo com Chaves de Torres, Pacotes de Cartas, Dracmas e muitos outros]
>
> [Os NPCs com os quais você desenvolve relacionamentos ficam registrados no sistema, permitindo que seu vínculo
> seja consultado posteriormente.]

Leitura:
- "Sistema próprio de afinidade evolutiva": cada Visitante tem um vínculo por jogador, com níveis.
- "De tempos em tempos": frequência controlada pelo servidor, nunca a cada login (3.1). Valor PENDENTE 4.
- "Conversas fiadas, favores ou até mesmo intrigas": três tipos de visita com roteiros diferentes (3.1-c).
- "Pense cuidadosamente": a interface **nunca** mostra antes qual opção sobe ou desce o vínculo (3.4).
- "Criar, fortalecer ou prejudicar": a afinidade pode cair.
- "Mais simples": o presente certo é o caminho mais rápido, mas não o único.
- "Poço dos Milagres ou durante eventos": presentes não se compram em loja fixa (diferente das decorações, 2.2).
- "Registrados no sistema": o vínculo não se perde quando o NPC some da casa.

### 2.2 Decorações

> *# [Decorações]*
>
> [A loja de decorações oferece móveis e enfeites capazes de aumentar as chances de um NPC específico aparecer na
> sua casa.]
>
> [Cada NPC possui preferências próprias quanto à decoração. Por isso, alguns itens podem aumentar a probabilidade
> de certos Visitantes aparecerem, mas também reduzir as chances de atrair outros.]

Leitura: a decoração é um fator **multiplicativo por NPC** no sorteio, que pode ser maior ou menor que 1. A loja
existe, mas o lugar dela é a PENDENTE 5 da `SPEC-CASA.md` (repetida aqui como PENDENTE 15).

### 2.3 Hostilidade

> *# [Hostilidade]*
>
> [Visitantes hostis são diferentes daqueles que aparecem apenas em busca de confusão. Seu objetivo é prejudicá-lo
> diretamente, provocando problemas e causando sofrimento de diversas formas.]
>
> [Quando um NPC hostil aparecer, você deverá encontrar um esconderijo o mais rápido possível ou descobrir alguma
> maneira de lidar com a ameaça.]
>
> [Algumas decorações específicas podem reduzir as chances de Visitantes hostis aparecerem na sua casa.]

E o trecho de caos e ordem que fala de NPCs:

> "mas o que são pontos necro? existe o sistema de "caos e ordem" onde determinadas ações te dão honra ou necro.
> como sabe as necro companhias são detestadas pela companhia dos records. isso afeta as Torres de companhia e se
> npcs se comportarão de forma hostil ou não."
>
> "essa parte ainda está em construção."

Leitura:
- "Em busca de confusão" (intriga) **não** é ameaça. Ameaça é quem vem para prejudicar. São dois estados
  diferentes do Visitante.
- "Visitantes hostis": quem vem hostil **é Visitante**. Aparece em Vínculos como os outros (3.9-a).
- "O mais rápido possível": há um tempo curto para agir. Valor PENDENTE 11.
- "Lidar com a ameaça": existe uma saída que não é se esconder (3.9-c).
- "Decorações específicas": tag de proteção que reduz o peso de visitas de ameaça.
- O dono liga o comportamento hostil ao "caos e ordem": se um NPC vem como ameaça depende da faixa do jogador
  (`SPEC-ORDEM.md` §4.1) e do lado do NPC. Outros gatilhos (cena de história, afinidade baixa) são proposta
  (V11). Como o dono diz que a parte está em construção, a ligação fica só estruturada.

### 2.4 Quartos de Hóspedes

> *# [Quartos de Hóspedes]*
>
> [Quando sua afinidade com determinado NPC atingir um nível suficientemente alto, você poderá convidá-lo para
> morar na sua casa por tempo indeterminado.]
>
> [Ter um Visitante como morador pode render recompensas secretas e desbloquear o acesso exclusivo a determinadas
> funções.]
>
> [Entretanto, nem todos os Visitantes aceitam esse tipo de convite. Portanto, se você pretende construir esse
> vínculo com um personagem específico, certifique-se de que ele permite essa possibilidade antes de investir seu
> tempo nessa relação.]

Leitura: o nível mínimo é PENDENTE 12. "Certifique-se" obriga a ficha do NPC a mostrar **desde o primeiro
encontro** se ele aceita morar (5.3). "Recompensas secretas" ficam ocultas até acontecerem.

### 2.5 A segunda tela, paixão e romance

> "também terá uma segunda tela onde possui os npcs já conhecidos, e você pode marcar ele com "paixão", isso faz
> ter mais chances dele aparecer e então você desbloqueia uma segunda barra com romance (além da de afinidade).
> conforme sobe seu romance você desbloqueia diálogos e até mesmo uma imagem especial de encontro (assim como é em
> amor doce)"

Leitura:
- Só NPCs **já conhecidos** aparecem na tela (os outros ficam como silhueta ou nem aparecem: PROPOSTA V14).
- Marcar paixão faz duas coisas: aumenta a chance de visita e **abre** a barra de romance. Sem paixão, não há
  romance.
- O dono não pôs condição na paixão. Por isso a marca vale para **qualquer NPC conhecido** e o aumento de visita
  vale sempre. O que pode ter trava é a barra de romance: NPC que não é romanceável, NPC que não é adulto ou
  jogador sem idade declarada de 18 anos ou mais (3.7). Quem é romanceável e quantas paixões ao mesmo tempo são
  pendências (PENDENTE 2 e 7), não regra desta spec.
- A barra de romance é **além** da de afinidade: as duas convivem.
- Romance libera diálogos e "até mesmo" a imagem de encontro (CG).

### 2.6 Essências de Afinidade: o que o dono já escreveu antes

Na fala do Galo (`SISTEMAS-texto-do-dono.txt`):

> [Essência de Afinidade]
>
> Uma Essência de Afinidade funciona como uma moeda de desbloqueio ou um ingresso. Só que, em vez de ser usada
> numa máquina qualquer, ela permite o acesso a novos andares que exijam uma quantidade e um tipo específicos de
> essência.
>
> Cada Essência de Afinidade corresponde a uma torre ou categoria específica de torre. Todas podem ser adquiridas
> por meio de interações com NPCs importantes.

**Conflito a resolver.** Hoje a Essência é um item gastável (`essencia:<npc>`), consumido nos andares das
Torres, e o Poço também dá Essências. O texto novo diz que a afinidade "é determinada pelas Essências de
Afinidade". Se a afinidade fosse o **saldo** de Essências no inventário, subir uma Torre baixaria o vínculo. Isso
pode punir o jogador por jogar, ou pode ser exatamente a tensão que o dono quer. Três leituras possíveis, todas em aberto (PENDENTE 1):

| Opção | Como funciona | A favor | Contra |
|---|---|---|---|
| A. Essência do vínculo (PROPOSTA V1) | Cada NPC tem um contador próprio, a **Essência do vínculo**, que só se move por interação com ele (escolhas, presentes, visitas). Quando o contador sobe, o NPC também entrega `essencia:<npc>` ao inventário, numa razão `X` (pode ser 0). Gastar Essência na Torre não mexe no vínculo. | Ninguém perde vínculo por jogar Torre; casa bem com escolhas e presentes. | Dois conceitos com nome parecido; a tela precisa separar bem. Fica menos literal que C. |
| B. Oferecer Essências | O jogador dá ao NPC a Essência dele (do Poço, de eventos) e isso sobe a afinidade. | Usa o item que já existe; o presente "mais forte" é a Essência do próprio NPC. | Compete com as Torres pelo mesmo recurso; o vínculo pode ser comprado no Poço. |
| C. Saldo | Afinidade = quantidade de `essencia:<npc>` no inventário. | É a leitura mais literal de "determinada pelas Essências". Cria escolha real: subir a Torre ou guardar o vínculo. | Subir Torre baixa o vínculo; prêmio de rank precisa de regra para não ser recebido, gasto e recebido de novo. |

Para conseguir escrever o resto, esta spec usa A como **hipótese de trabalho** e escreve "Essência do vínculo"
para o contador e "Essência (item)" para o item. Não é escolha feita. Se o dono escolher B, muda a origem dos
pontos em 3.3 e uma linha na API de presente. Se escolher C, `vinculos.afinidade` deixa de existir e passa a ser
lido do inventário, a histerese de 3.3-b vira obrigatória e a PK de `vinculo_premios` já impede prêmio duplo.

---

## 3. Regras propostas por esta spec

### 3.1 Quem são os Visitantes e quando aparecem

a) **Elenco.** Visitante é um NPC com ficha de Visitante na configuração (`visitantes.npcs`, 7.4). Os
   candidatos naturais são o elenco atual (Melissa, Galo, Herdeiro, Javali, Rato, Coruja, Corvo), mas quem é
   Visitante, quem é romanceável, quem aceita morar e quem pode vir como ameaça é do dono (PENDENTE 2). NPC sem ficha
   não aparece na porta. NPCs novos entram só com a ficha, sem código novo.

b) **Primeiro encontro.** Um NPC passa a ser "conhecido" na primeira visita atendida **ou** quando outra parte do
   jogo o apresenta (cena de Torres, holograma da Melissa, Poço, a cena do Galo na Casa). A ficha guarda
   `conhecido_em` e a origem. Há um estado intermediário, **conhecido anônimo**, para quem o jogador já viu sem
   saber quem é (o Corvo, "???", 3.11).
   **PROPOSTA V2:** visitas só sorteiam NPCs já conhecidos, mais uma vaga de "visita de apresentação" para um NPC
   ainda desconhecido, a cada `X` visitas. Assim o elenco se abre aos poucos.

c) **Tipos de visita** (texto do dono: "conversas fiadas, favores ou até mesmo intrigas"):

   | Tipo | O que acontece | Efeito típico |
   |---|---|---|
   | `conversa` | papo, uma ou duas escolhas | vínculo sobe ou desce pelas escolhas |
   | `favor` | o NPC pede algo: um item, uma carta para ver, uma resposta que só aparece depois | cumprir sobe o vínculo; recusar pode descer; prazo `X` |
   | `intriga` | o NPC traz fofoca, provocação ou proposta duvidosa | escolhas com peso em honra/necro (`SPEC-ORDEM.md`) além do vínculo |
   | `ameaca` | 3.9 | Hostilidade |
   | `apresentacao` | primeira visita de um NPC | registra o conhecido; abre a ficha |
   | `encontro` | só com paixão e romance suficiente (3.7) | cena de romance; pode ter CG |

   Os roteiros são do dono ou de narrativa aprovada por ele. Esta spec não escreve fala de NPC. Cada visita
   aponta para uma cena do motor (`cena_id`), escolhida de um conjunto por NPC e tipo.

   **A visita é uma cena roteirizada**, não um hub de botões (como Coffee Talk e os encontros do Stardew). A cena
   corre com as escolhas dela e, só no fim, abre um hub curto: **Presentear**, **Convidar** (se puder morar) e
   **Despedir**. Não existe "Conversar" de novo na mesma visita: a conversa é a cena. Se a cena tiver um rank
   pronto (3.3-b), a subida acontece dentro dela.

d) **Frequência e modelo de tempo** (PROPOSTA V3, segue o camping do Animal Crossing; modelo da Casa 2.2-h, P7):
   - O servidor divide o tempo em **períodos** de `X` horas (PENDENTE 4), no fuso `America/Sao_Paulo`. Para cada
     jogador e período, decide se haverá visita e de quem. A semente é `hash(player_id, período, segredo do
     servidor)`.
   - **Toda decisão fica gravada**, inclusive a negativa: período sorteado sem visita grava uma linha em `visitas`
     com `npc = null` e `status = 'sem_visita'`. Assim, mudar a decoração ou marcar paixão depois não refaz o
     sorteio daquele período (anti-abuso 1 e 2), e os períodos vazios ficam contados.
   - **Recuperação ao voltar** (PROPOSTA V25): o sorteio roda quando o jogador abre a Casa ou Vínculos (7.4). Nessa
     hora o servidor sorteia, em ordem, todos os períodos desde o último sorteado, **até um teto de `X`
     períodos** para trás. Períodos mais antigos que o teto não são sorteados nem contam como vazios: para o jogo,
     não existiram. Quem some por duas semanas volta com no máximo `X` períodos decididos, não com uma pilha.
   - Chance de haver visita no período: `X`. **Chance crescente** com períodos vazios seguidos (`+X` por linha
     `sem_visita` seguida, até `X`), como o camping do Animal Crossing.
   - No máximo `X` visitas comuns por dia e `X` ameaças por semana (PENDENTE 4 e 11).
   - Visita sorteada fica **agendada** com janela de validade (`X` h), contada a partir do início do período.
     Acontece na próxima entrada na Casa dentro da janela. Perdida a janela (o que a recuperação torna possível),
     a visita comum vira um **cartão de visita** na porta (3.1-e). A ameaça segue 3.9-f.

e) **Cartão de visita** (PROPOSTA V4). Visita comum perdida deixa um cartão preto com o sigilo do NPC preso na
   fresta da porta (ref-12; cartão de chamada do Persona, adaptado), na cor de assinatura dele. O cartão diz quem
   veio e quando, nunca o que ia dizer. Ler o cartão não dá afinidade. Se a visita era `favor`, o cartão diz que
   havia um pedido e o pedido se perde. Proposta dentro da V4: sem penalidade no vínculo. Substitui o "bilhete
   passei aqui" da Casa 2.2-h (8.1).

f) **Sem repetição boba.** O mesmo NPC não vem em dois períodos seguidos, salvo se for o único elegível. Uma cena
   já vista só volta quando o conjunto daquele NPC e tipo se esgota; as falas repetidas ganham a marca "já lido"
   e podem ser puladas.

### 3.2 O sorteio: pesos

Fórmula única (PROPOSTA V5; amplia a P6 da Casa 2.2-h):

```
peso(NPC, tipo) = base(NPC, tipo)
                × fator_decoracao(perfil da casa, gostos de decoração do NPC)
                × fator_paixao(NPC tem paixão marcada?)
                × fator_ordem(faixa de Caos e Ordem do jogador, lado do NPC)    -- só altera a chance de `ameaca`
                × fator_morador(NPC já mora na casa?)                           -- morador não "visita": 0
                × fator_saudade(períodos desde a última visita do NPC)
                × fator_chamado(o jogador chamou o NPC? 3.12)
```

- `base`: por NPC e por tipo, em `visitantes.npcs`. `X`.
- `fator_decoracao`: soma das tags de decoração da casa (`casa_perfil.tags`, com o peso da Sala da Casa 2.2-h)
  contra as preferências do NPC (3.8). Resultado limitado entre `X_min` e `X_max`, para que nenhuma decoração
  zere ou monopolize um NPC (PENDENTE 6). Pode ser menor que 1: o dono escreveu "reduzir as chances de atrair
  outros".
- `fator_paixao`: `X` (PENDENTE 7). Vale para qualquer NPC com paixão, romanceável ou não, e só para visitas que
  não são `ameaca`.
- `fator_ordem`: lê a faixa de `SPEC-ORDEM.md` §4.1. Para NPC da Companhia, a faixa `Suspeito` ou `Hostil` pode
  trocar parte do peso de `conversa`/`favor` por `ameaca`. Valores `X`; estrutura ligada, conteúdo
  "em construção" (PENDENTE 10).
- Decoração de **proteção** (3.9-b) multiplica o peso de toda `ameaca` por `X < 1`.
- `fator_chamado`: se o jogador chamou aquele NPC pelo Mensagens (3.12, PROPOSTA V21), `X` no período seguinte.
- `fator_saudade`: sobe devagar com o tempo sem visitar (`X`), para o NPC querido não sumir.

O jogador **nunca vê** os números. Vê sinais: o sinal de atração no modo Decorar (Casa 2.2-n), comentários dos
Visitantes sobre a casa e, na ficha do NPC, os gostos de decoração já descobertos.

### 3.3 Afinidade: Essência do vínculo e níveis

a) **Contador.** `afinidade` = Essência do vínculo acumulada com aquele NPC (opção A de 2.6). Inteiro, pode
   cair, mínimo 0. Origens: escolhas de diálogo (3.4), presentes (3.5), favores cumpridos, visitas atendidas
   (`+X` só por atender). Nada mais mexe no contador, salvo Owner (7.3).

b) **Níveis** (PROPOSTA V6). O jogador vê **ranks** com numeral romano, como os estágios dos Arcanos e os
   Confidentes. Quantos ranks e quanto cada um exige: PENDENTE 3. Estrutura: `afinidade.niveis` =
   `[{rank, minimo, premios:[...], libera:[...]}]`, todos com `minimo: null` até o dono decidir.
   - **Rank pronto, subida em cena** (PROPOSTA V19, como Persona 5 Royal / 3 Reload e os apoios de Fire Emblem:
     Three Houses). Quando o contador passa do mínimo, o rank fica **pronto**, não sobe. A ficha mostra "Rank
     pronto" e o medalhão ganha um brilho. A subida acontece na **próxima visita** daquele NPC, numa cena curta
     dentro da visita, com o cut-in de 5.5. O presente enche a barra, mas não rouba o momento. Morador sobe na
     próxima conversa no quarto. Se o NPC tiver cena de rank escrita pelo dono, é ela; senão, uma cena genérica
     curta do conjunto dele.
   - Enquanto o rank está pronto, o contador continua subindo, mas para no mínimo do rank seguinte ao pronto (não
     se pulam dois ranks sem cena).
   - **Queda**: o contador cai, mas o rank só cai se o contador ficar abaixo do mínimo do rank atual menos uma
     folga de `X` (histerese). Assim uma resposta ruim não apaga um rank de semanas. Prêmio já recebido nunca é
     retirado (PENDENTE 8: se o dono quiser que a queda feche funções, como o convite de morador). O P5 tirou a
     perda de rank que o P3 e o P4 tinham por frustrar o jogador; por isso a folga.
   - Rank 0 = conhecido sem vínculo (PROPOSTA V24).

c) **Essência (item) entregue ao subir.** Ao ganhar Essência do vínculo, o NPC deposita `essencia:<npc>` no
   inventário na razão `X` (PENDENTE 1). NPC sem Essência de Torre (sem item `essencia:<npc>`) não deposita nada.
   Isso cumpre a frase do Galo ("adquiridas por meio de interações com NPCs importantes") sem misturar saldo e
   vínculo.

d) **Teto por período** (anti-abuso): no máximo `X` de Essência do vínculo por NPC por dia, somando todas as
   origens, exceto prêmios de evento lançados pela equipe.

### 3.4 Escolhas de diálogo

- O motor ganha dois efeitos: `afinidade` e `romance` (7.5). A escolha diz `{tipo:'afinidade', npc, delta}`.
  O cliente nunca manda o valor; o servidor lê na cena, como já faz com Tempo e karma.
- **Sem aviso antes.** As opções aparecem iguais. Depois da escolha, um retorno curto **no retrato**, não em
  número (REFERENCIAS §1.3):
  - sobe: o retrato muda de expressão, um filete de ametista sobe pela borda da moldura e uma faísca de
    Essência voa até o selo de rank no canto;
  - desce: a moldura racha num fio de champanhe e a expressão fecha;
  - neutro: nada.
  O jogador lê o NPC, não a barra. A barra só se mexe no fim da visita (resumo, 4.5; medalhão, 4.6).
- **Opções de romance** só aparecem com paixão marcada e o romance acima de `X` em certas cenas. Elas carregam um
  pequeno losango de ametista à esquerda, para o jogador saber que está flertando (escolher flertar é decisão,
  não armadilha). PROPOSTA V7.
- **Escolhas de intriga** podem carregar efeito de honra/necro (`SPEC-ORDEM.md` §4.2). O jogador vê, depois, a
  mudança de faixa só pelos avisos daquela spec.
- Repetição: cada visita é uma **instância** com id próprio (7.2, `visitas.id`). O efeito vale uma vez por
  instância, não uma vez por cena para sempre como hoje em `dialog_events`. Reler uma cena repetida numa visita
  nova não dá efeito se a cena estiver marcada `efeito_unico` (para as cenas de história de cada NPC).

### 3.5 Presentes e gostos

a) **Item.** Presente é um item novo `kind = 'presente'` (entra na tabela `item_kinds` da Casa 5.1), empilhável,
   com `meta.tags` (ex.: `doce`, `livro`, `flor`, `relogio`, `joia`, `necro`) e raridade. Origem, nas palavras do
   dono: Poço dos Milagres e eventos. O Poço ganha a categoria `presente` (7.6). Presentes **não** são vendidos na
   loja de decorações.

b) **Gostos por NPC** (`visitantes.npcs[npc].gostos`), em cinco graus, como Stardew:

   | Grau | Reação | Essência do vínculo |
   |---|---|---|
   | `amado` | expressão forte de alegria, cut-in curto (4.5) | `X` |
   | `gosta` | sorriso | `X` |
   | `neutro` | agradece | `X` |
   | `desgosta` | desconforto | `-X` |
   | `odeia` | recusa visível | `-X` |

   O grau vem primeiro por item (`itens: {chave: grau}`) e, se o item não estiver listado, pelas tags
   (`tags: {tag: grau}`). Item e tag sem regra = `neutro`. Os gostos de cada NPC são do dono (PENDENTE 9).

c) **Limite** (PROPOSTA V8): `X` presentes por NPC por semana e um por visita (o Stardew usa dois por semana).
   Na configuração os dois ficam `null` até o dono aprovar. O limite aparece na ficha ("Já recebeu um presente
   seu nesta visita").

d) **Multiplicadores**: presente de raridade maior vale `×X`; presente no **aniversário** do NPC vale `×X`
   (só se o dono quiser aniversários, PENDENTE 9; entram no Calendário como evento).

e) **Descoberta** (Casa P11): dar um presente revela o grau daquele item na ficha. Algumas falas revelam um gosto
   ("Odeio cheiro de vela."). Revelado uma vez, fica revelado. Nada aparece antes.

f) **Onde se dá.** Na visita, pelo botão Presentear (4.4). Fora de visita, só para morador (3.10). Não há envio de
   presente pelo menu a quem não está em casa (PROPOSTA V9): o presente é um gesto na cena.

g) **Decoração não é presente.** Item de decoração não pode ser dado (resolve a PENDENTE 18 da Casa a favor de
   categorias separadas; o dono pode mudar).

### 3.6 Paixão

- Marca-se na ficha do NPC (5.3) em **qualquer NPC conhecido** (não anônimo), como o dono escreveu, sem outra
  condição. O aumento de visita (`fator_paixao`) vale sempre.
- A **barra de romance** só abre se três coisas valerem: o NPC é `romanceavel`, o NPC é `adulto` e o jogador tem
  idade declarada de 18 anos ou mais (3.7). Se alguma faltar, a paixão fica marcada e a ficha mostra o selo
  "Sem romance" no lugar da barra. NPC não romanceável mostra esse selo desde cedo, pelo mesmo motivo do
  "certifique-se" dos Quartos.
- **Quantas ao mesmo tempo:** PENDENTE 7. Proposta para o dono decidir (V10): uma só, como as rotas do Amor Doce,
  para a escolha pesar e o aumento de chance não virar "marcar todo mundo". Até a decisão, o limite é `X` e
  fica só no servidor (sem índice no banco, 7.2).
- **Trocar:** desmarcar congela a barra de romance daquele NPC (não zera) e abre uma espera de `X` dias antes de
  marcar outro. Marcar de novo o mesmo NPC retoma de onde parou.
- Efeitos: `fator_paixao` no sorteio (3.2); e, se o romance estiver aberto, barra de romance visível, visitas do
  tipo `encontro` sorteadas e opções de romance nas cenas.
- O NPC não sabe da marca. Paixão é um sentimento do Record, não um pedido.

### 3.7 Romance

- Contador próprio por NPC (`romance`), só sobe com paixão marcada. Origens: opções de romance (3.4), presentes
  `amado` dados com paixão marcada (`+X` extra), visitas `encontro`.
- Níveis próprios (`romance.niveis`, valores PENDENTE 3), que liberam: cenas de diálogo de romance, visitas
  `encontro` e as CGs (3.7-b).
- **Encontro e CG** (Amor Doce):
  - cada NPC romanceável tem uma lista de encontros (`encontros: [{id, romance_min, cena, cg:{variantes}}]`);
  - a CG entra no meio da cena (4.7) e fica salva em Lembranças;
  - a CG pode ter **variantes** conforme as escolhas da cena e o nível de romance, como o Amor Doce faz com a
    ilustração do mesmo encontro. O servidor decide a variante e grava;
  - CG desenhada em retrato (9:16) desde o começo, para o celular.
- **Avatar na CG**: se a CG mostra o rosto do Record é a PENDENTE 8 da `SPEC-AVATAR.md`. Até lá, enquadramento
  que evita o rosto (mãos, costas, ponto de vista).
- **Idade do NPC.** Romance só com NPC adulto, declarado na ficha (`adulto: true`), conferido no servidor antes
  de abrir a barra. É uma trava de conteúdo, não de jogo (PENDENTE 2 confirma o elenco).
- **Idade do jogador.** O site é público e o DEVO é jogado por pessoas reais; a Melissa pergunta a idade no
  prólogo (`ProfileField 'age'`, guardado no save do servidor). Barra de romance, opções de romance, encontros e
  CGs só para quem declarou 18 anos ou mais, conferido no servidor. Sem idade declarada, ou com valor que não se
  lê como número, o romance fica desligado; a paixão continua valendo para a chance de visita. A idade é
  declarada, não verificada: se isso basta, ou se é preciso confirmação de outro tipo, é política do dono
  (PENDENTE 22).
- **Romance pode cair** (PROPOSTA V23): escolhas de romance podem ter `delta` negativo, e o rank de romance segue a
  mesma histerese de 3.3-b. Encontro e CG já vistos nunca se perdem.
- **Ameaça e romance** (V23): se o NPC entra em estado de ameaça, o romance **congela** (não sobe nem cai) e a barra
  aparece rachada, com o coração de vidro trincado, até o estado acabar. Se o jogador cair para a faixa Hostil
  de Caos e Ordem, nada muda no romance por isso; muda só o `fator_ordem`.
- **Morador e romance**: despejar um morador com paixão marcada não mexe no romance além do custo de despejo
  (PENDENTE 14). Morador não entra em estado de ameaça (3.10).
- Romance e afinidade são independentes: um vínculo pode ter romance alto e afinidade média. Mas um encontro pode
  pedir os dois (`afinidade_min`).

### 3.8 Decorações e preferências

- Cada decoração já tem `meta.tags` (Casa 5.1). Esta spec acrescenta duas tags especiais: `protecao` (3.9-b) e
  `esconderijo` (já existe na Casa como `meta.esconderijo`).
- Cada NPC tem `decoracao: {tag: peso}` com pesos positivos e negativos (PENDENTE 6). O `fator_decoracao` do
  NPC é `clamp(1 + Σ(tags da casa × peso), X_min, X_max)`.
- **Loja de decorações** (texto do dono). Lugar e moeda: PENDENTE 15 (Casa PENDENTE 5). Cada item na loja mostra,
  para NPCs **conhecidos e com o gosto já descoberto**, um rosto em medalhão com seta para cima ou para baixo.
  Para os outros, nada (não se decora às cegas, mas também não se ganha a cola de graça).
- Mudar a decoração só mexe no sorteio depois de `X` minutos (Casa PENDENTE 8, `casa_perfil.vale_a_partir_de`).
- Visitantes comentam a casa: cada NPC tem falas curtas por tag de que gosta ou desgosta. Comentar revela o gosto
  na ficha.

### 3.9 Hostilidade

a) **Quem vem como ameaça.** Os "Visitantes hostis" do dono são Visitantes: têm ficha, aparecem em Vínculos e
   podem, conforme o caso, ter vínculo. O que a estrutura garante é o estado: qualquer Visitante pode ser
   sorteado como `ameaca` se a ficha permitir (`pode_ameacar`) e o `fator_ordem` (caos e ordem, a ligação que o
   dono deu) levar a isso. O mesmo NPC pode ser amigo de um Record e ameaça para outro. Propostas para o dono
   aprovar ou não (PROPOSTA V11):
   - **outros gatilhos** além da faixa: afinidade abaixo de `X` e cena de história;
   - **figuras só de ameaça** (`apenas_ameaca: true`): Visitantes que nunca vêm em paz. Aparecem em Vínculos no
     filtro Ameaças, com cartão em negativo e só o que o jogador já viu (nome, quantas vezes veio, esconderijos
     em que achou o jogador). Não têm barra de afinidade nem paixão. Quem são: PENDENTE 11.

b) **Proteção.** Decoração com tag `protecao` reduz o peso de `ameaca` (3.2). Ela é visível na loja com um selo
   próprio (o dono escreveu "algumas decorações específicas"). O efeito tem teto: proteção nunca zera a chance,
   para a ameaça continuar existindo (`X_min`).

c) **Chegada, decidida no servidor.** A ameaça não depende de o jogador "iniciar" nada:
   - o `GET /api/casa` que entrega a ameaça ao jogador (ele está na Casa) grava `prazo_ameaca = now() + X s`
     (PENDENTE 11) e sorteia, na mesma transação, um número `u ∈ [0,1)` guardado em `visitas.sorte_busca`;
   - a batida é diferente: três golpes, a luz da Sala esfria, o retrato entra em cut-in rasgado (4.8);
   - até o prazo há duas saídas, como o dono escreveu:
     - **Esconder-se**: os esconderijos acendem no cenário e numa fileira no pé da tela (4.8). **O toque já manda
       o pedido** (`visita.esconder`) na hora; o avatar corre até lá só como encenação. Tocar antes do prazo =
       escondido a tempo, em qualquer cômodo. Não há regra de tempo de caminhada;
     - **Lidar com a ameaça** (nome literal do dono; substitui o "Enfrentar" da Casa): abre um diálogo de VN. As
       escolhas podem resolver (ele vai embora), piorar (consequência) ou exigir um item (`requer`, já existe no
       motor). As saídas de cada um são roteiro do dono. Escolher "lidar" para o relógio.

d) **Busca.** Escondido, o jogador vê a cena por uma fresta (vinheta escura com a forma do esconderijo) enquanto
   a ameaça anda pela casa. O resultado sai do número sorteado na chegada: **achado = `u < chance(esconderijo)`**,
   com a chance calculada no momento do `visita.esconder`:
   - chance-base `X` por esconderijo; esconderijo melhor (decoração rara com `esconderijo`) tem base menor;
   - **a ameaça aprende** (Casa P8, PROPOSTA V12, como a IA do Alien: Isolation): usar o mesmo esconderijo nas
     últimas `X` ameaças aumenta a chance em `X`;
   - **risco à vista**: ao acender, cada esconderijo mostra um olho em três estados (aberto, meio, fechado) para
     a chance atual, arredondada. O Clock Tower mostrou que esconderijo que falha sem sinal frustra; aqui o
     jogador escolhe sabendo o risco, sem ver número.
   O `u` nunca vai ao cliente antes do resultado; como é um só por chegada, trocar de esconderijo não "re-rola".

e) **Consequências** (PENDENTE 11). O dono fala em "provocando problemas e causando sofrimento de diversas
   formas". Esta spec só deixa a estrutura: cada ameaça tem uma lista de consequências possíveis, todas com
   efeito pelo motor (Tempo, item, karma, afinidade com outro NPC, decoração guardada à força, cena). Valores `X`.
   Proposta de limite: nenhuma consequência tira carta, deixa Tempo abaixo de `X` ou acontece enquanto o jogador
   está inscrito num Deadly Vote em andamento.

f) **Ameaça sorteada na ausência** (Casa 2.2-h). Com a recuperação de períodos (3.1-d), uma ameaça pode ter sido
   sorteada enquanto o jogador estava fora. Ela não some sem efeito: aplica-se `ao_expirar`, valor PENDENTE 11.
   As opções são `espera_na_porta` (a ameaça está na porta quando ele entra; o prazo só começa nesse `GET`) e
   `consequencia` (aplicada ao voltar, com aviso). Esta spec sugere `espera_na_porta` como padrão, para ninguém
   ser punido sem ter jogado. Com ameaça pendente, os atalhos da Casa levam primeiro a ela.

g) **Avisos honestos.** O jogo nunca pune sem aviso (crítica comum a The Witch's House):
   - a primeira ameaça de cada Record é guiada: a caixa de sistema explica esconderijo e "lidar com a ameaça", e a
     primeira busca nunca acha o jogador (PROPOSTA V13);
   - **barra de sombra** (PROPOSTA V20, leitura direta da ref-08, onde a primeira barra é 阴暗值, "escuridão"): na
     ficha e no medalhão de um NPC que está perto de virar ameaça, aparece uma segunda faixa, escura, que enche
     conforme o risco. Fora desse caso ela não aparece. O jogador vê antes e pode reagir (presente, decoração de
     proteção, honra).

h) **Ligação com `SPEC-ORDEM.md`.** O lado do NPC (`companhia | necro | neutro`, §4.3 de lá) e a faixa do jogador
   alimentam `fator_ordem`. Resolver bem uma ameaça pode dar honra (`X`), e algumas saídas de "lidar" podem dar
   necro (ex.: subornar). Tudo PENDENTE 10.

i) **Morador não vira ameaça** (V23). Se as condições fariam um morador vir como ameaça, ele sai da casa antes,
   numa cena (como a mudança anunciada do Animal Crossing), e só depois pode ser sorteado assim. Regra de saída:
   PENDENTE 14.

### 3.10 Quartos de Hóspedes

- **Convite**: no cartão do NPC (Vínculos) e em visita, quando: o NPC `aceita_morar`, a afinidade chegou ao rank
  mínimo (`X`, PENDENTE 12) e há quarto livre (Casa P9). O convite abre uma cena de VN; o NPC pode pedir uma
  condição antes (um presente, um favor). Aceito, ele se muda e o quarto passa a ser dele (`casa_hospedes`).
- **"Nem todos aceitam"**: a ficha mostra desde o primeiro encontro um selo "Aceita morar" ou "Não mora com
  ninguém". Se o aceite depender de condição que o jogador ainda não conhece, o selo mostra "Talvez", com a dica
  que o dono quiser dar.
- **Rotina**: o morador anda pela casa em horários (Casa P10), pode ser encontrado no quarto ou na Sala e aceita
  conversa e presente fora de visita (limites de 3.5 valem).
- **Recompensas secretas** (texto do dono): gatilhos ocultos por morador (`moradia.recompensas`, Casa 5.1):
  dias seguidos morando, rank, presente certo, evento. Só aparecem na ficha depois de acontecerem, com o selo
  "Segredo". Conteúdo PENDENTE 13.
- **Funções exclusivas** (texto do dono): uma função do jogo que só um morador abre. Exemplos que esta spec
  sugere para o dono escolher ou descartar: a Coruja revisa o rito de uma carta no Retábulo; o Rato abre uma
  sala de troca privada; o Javali convida para uma mesa da Sala de Jogos. Conteúdo PENDENTE 13.
- Morador não é sorteado como visita (`fator_morador = 0`), mas pode ter cenas próprias.
- **Saída**: despejo pelo jogador (custo em afinidade `X`), queda de rank abaixo do mínimo menos a folga, evento
  de história ou Owner (Casa PENDENTE 14, repetida aqui como PENDENTE 14).
- Morador não entra em estado de ameaça (3.9-i).

### 3.11 Elenco: casos que pedem regra própria

| NPC | Situação (ficha em `npcs/`) | Regra |
|---|---|---|
| Melissa | Depois do prólogo só aparece como **holograma** (`melissa.md`). Não tem Essência. | Não bate na porta: a "visita" dela é uma **chamada holográfica**. Em vez da batida, o projetor da Sala acende; o cut-in vira projeção com linhas de varredura em azul Companhia. Tipos possíveis: `conversa`, `favor`, `apresentacao`. Não recebe presente físico (o botão some) e não mora na casa, salvo decisão do dono. Moeda de afinidade dela: PENDENTE 1. |
| Corvo | Anônimo, placa "???", até ser revelado (`corvo.md`). | Estado **conhecido anônimo** (`identidade = 'anonimo'`): cartão com "???", sem cor de assinatura, progresso em penas apagadas, sem paixão. A revelação (cena do dono) muda para `revelado` e acende o verdete. |
| Galo | Já tem cena roteirizada de visita à Casa de madrugada (`lib/devo/dialogo/cenas/galo-casa.ts`, flag `galo_casa`, `narrativa-host`). | A cena atual conta como a `apresentacao` do Galo (`conhecido_por = 'cena'`) e grava uma linha em `visitas` com `origem = 'evento'`. No período em que ela acontece, o sorteio não escolhe o Galo. |
| Herdeiro | Não tem item `essencia:herdeiro` (`herdeiro.md`). | Tem vínculo normal; não deposita Essência (item) ao subir (3.3-c). Criar a Essência é do dono. |
| Todos | Cor de assinatura, poses, olho no estado de ameaça. | Vêm da ficha. Padrão desta spec para o olho em ameaça: rubi. Exceções da ficha valem (Galo: olho do broche em cobre; Corvo: olho em osso pálido). Campo `ameaca: {olho, cor}` em `visitantes.npcs`. |

### 3.12 Agência do jogador

O vínculo não pode depender só da sorte. Sem fugir do texto do dono (visita "de tempos em tempos"):
- **Chamar** (PROPOSTA V21, como o convite por telefone do Persona): pelo Mensagens, o jogador chama um NPC
  conhecido para vir à Casa. Custa `X` (moeda PENDENTE) e só vale para um NPC por vez. Não garante visita:
  aplica `fator_chamado` no próximo período sorteado. Se o NPC vier, a cena reconhece o chamado.
- **Rank pronto** à vista (3.3-b): a ficha e o cartão mostram quando um rank espera só a próxima visita, o que dá
  motivo para chamar aquele NPC.
- **Decoração e paixão** continuam puxando a sorte (3.2), e o sinal de atração do modo Decorar mostra o efeito.
- O que esta spec não faz: ir até o NPC fora da Casa (o Stardew deixa; aqui a Casa é o palco, e o dono não pediu
  isso). Fica como ideia para o dono.

### 3.13 Equipe (Owner e Anfitrião)

O `CLAUDE.md` dá acesso liberado a todas as telas, sem restrição. Quem é da equipe também joga, então:
- Vínculos funciona normal para eles, com os próprios vínculos.
- Um interruptor **"Visão de equipe"** no topo de Vínculos mostra todos os NPCs como conhecidos, em leitura, com a
  ficha completa (gostos, ranks, prêmios, cenas). Nessa visão nada grava nem mexe no vínculo de ninguém.
- Ver o vínculo de outro jogador é pela Mesa › Vínculos (7.4), com `admin_log`.

---

## 4. Telas da Casa (RPG Maker / visual novel)

Tudo nesta seção acontece **dentro da Casa**: cenário pintado em camadas onde o avatar anda (protótipo em
`prototipo-motor/`), objetos que se tocam, diálogo de VN. O retrato dos NPCs segue o redesenho com referência
no Persona (silhueta forte, poses, expressões grandes, cut-ins), que é tarefa da etapa de NPCs; aqui só se diz
como a cena os usa.

### 4.1 Batida na porta

Celular (390 × 844):
- A câmera da Sala desliza 40 px até a porta. Fresta de luz por baixo dela; poeira sobe no feixe.
- **Cut-in de chegada**: faixa diagonal na **cor de assinatura do NPC** (ficha) atravessa a tela de baixo à
  esquerda para cima à direita (inclinação de 14°), com bordas de mármore negro e filete champanhe, os **olhos**
  do Visitante recortados dentro dela (o protótipo já faz isso) e o nome em capitular champanhe. 700 ms. O tipo
  muda só um detalhe por cima da cor do NPC: `intriga` ganha um veio de mármore negro atravessando a faixa;
  `encontro`, um fio de porcelana e pétalas de vidro. Melissa: projeção holográfica no lugar da porta (3.11).
- Faixa de sistema no topo com o texto literal do dono: **"[Um Visitante apareceu]"**.
- A porta ganha o estado `batida` (Casa 4.2). Um selo pulsa sobre ela. Tocar abre; tocar em outro lugar deixa o
  avatar livre, e a visita espera dentro da janela.

### 4.2 A visita (VN)

Composição em camadas, de trás para a frente:
1. Sala desfocada e escurecida 35%.
2. Luz de recorte na **cor de assinatura do NPC**, vinda da ficha (cobre do Galo, âmbar da Coruja, verdete do
   Corvo…), contra uma luz fria de ametista do outro lado.
3. **Retrato grande**, cortado no quadril, com cerca de **55%** da altura, saindo da moldura pela cabeça e por um
   gesto (mão, cartola, asa): "retrato que sai da moldura". Pequena respiração (2 px) e piscar.
4. Partículas na profundidade (poeira, faíscas de Essência), atrás e na frente do retrato.
5. Caixa de diálogo nova: placa de mármore negro com chanfro em diagonal à esquerda, filete champanhe, a placa do
   nome encaixada no chanfro, na cor do NPC escurecida. Texto em serifa de leitura, 18 px.
6. Canto superior direito: **medalhão de vínculo** (ver 4.6) com o selo de rank.

**Orçamento de altura no 390 × 844** (de cima para baixo; zona segura do iOS incluída):

| Faixa | y (px) | Conteúdo |
|---|---|---|
| Topo | 0–56 | faixa de sistema (`[Um Visitante apareceu]` some depois de 2 s) e medalhão de 64 px no canto, que pode invadir até y 96 |
| **Rosto** | **120–340** | rosto e gesto do retrato. **Nada cobre esta faixa**: nem escolhas, nem caixa, nem cut-in de interface. É onde está o retorno de 3.4 |
| Corpo | 340–560 | resto do retrato, partículas |
| Caixa | 560–790 | caixa de diálogo (texto em até 4 linhas) **ou** escolhas, nunca as duas |
| Pé | 790–844 | indicador de avanço, histórico, ocultar caixa; zona do gesto do sistema |

- **Escolhas**: quando abrem, **tomam o lugar da caixa** (a fala anterior fica numa linha acima delas, em 14 px).
  No máximo 3 no celular, cada uma com 56 px de altura, inclinação de no máximo 2°. Borda champanhe; as de
  romance com o losango de ametista. Cena com 4 opções mostra a 4ª só no desktop ou em rolagem dentro da caixa.
- **Hub do fim** (3.1-c): Presentear, Convidar (se puder morar), Despedir, em três botões de 56 px no lugar da
  caixa, depois da última fala. Não há botões de ação durante a cena.
- O retrato **reage** a cada escolha (3.4).

### 4.3 Escolha e reação

- Escolher: o cartão escolhido avança e os outros caem para fora da tela em leque (180 ms).
- Reação: troca de expressão com um "estalo" (escala 1,04 → 1, 120 ms), e o retorno de 3.4 no medalhão.
- Reação forte (expressão `furioso`, `surpreso`, `riso`) tem um **cut-in de expressão**: o rosto em close numa
  faixa horizontal, como os cut-ins de diálogo do Persona, por 450 ms. Usado pouco: no máximo um por visita.

### 4.4 Presentear

- **Bolsa** sobe do pé da tela: grade de presentes em fichas de porcelana, com contagem. Presentes com grau já
  descoberto mostram um pequeno medalhão do rosto do NPC com a reação (alegre, neutro, fechado).
- Arrastar o presente até o retrato (ou tocar e "Dar"). O objeto **flutua** da bolsa até as mãos do retrato,
  num arco curto com brilho, sem sprite novo do avatar. O estado `segurando_presente`, que a `SPEC-AVATAR.md`
  deixa fora da estreia (soma quadros a toda roupa), só entra se o dono quiser pagar esse custo (6.4).
- Reação conforme o grau (3.5-b). Para `amado`: cut-in com o objeto girando em 2.5D na frente do retrato,
  faíscas de Essência e a expressão mais forte do NPC. Para `odeia`: o NPC devolve o objeto, que cai na bolsa.
- Limite atingido: o botão fica escuro com o motivo ("Já recebeu um presente seu nesta visita").

### 4.5 Fim da visita: resumo

Um cartão de visita se forma e desliza para a direita (o mesmo cartão de 3.1-e, agora como recibo):
- Essência do vínculo: um filete enche no medalhão (sem número).
- Rank novo: ver 5.5 (cut-in de rank).
- Gosto descoberto: o carimbo "Descoberto" sobre a miniatura do item.
- Itens recebidos (Essência, prêmio de rank).
- "Ver em Vínculos ›" leva à ficha (interface do DEVO).

### 4.6 Medalhão de vínculo (HUD da visita)

Medalhão redondo (64 px na visita, 120 px na ficha) com o rosto do NPC (`NpcMedallion`, refeito), dentro de um
aro de mostrador de relógio: o aro externo enche **na cor de assinatura do NPC** conforme a afinidade dentro do
rank; com romance aberto, um segundo aro interno, em porcelana com veio rosado-pálido, enche com o romance. O selo
do rank (numeral romano) fica preso embaixo, como pingente. Rank pronto: o pingente brilha. A ref-08 tem duas
barras com ícone (escuridão e afeição); aqui a afeição vira o mostrador, que é o símbolo do DEVO, e a escuridão
vira a barra de sombra (3.9-g), um arco escuro que só aparece no aro quando o NPC está perto de virar ameaça.

### 4.7 Encontro e CG

- O encontro é uma visita do tipo `encontro` ou uma saída da casa para outro cenário (PENDENTE 16: o dono decide
  se há encontros fora da Casa).
- A CG entra com flash suave de porcelana e um fio na cor do NPC que corre a borda; fica em tela cheia em 9:16
  com leve paralaxe em camadas (fundo, figuras, primeiro plano). A paralaxe segue o dedo por padrão. A inclinação
  do aparelho só liga depois de um toque em "Ativar movimento", que pede a permissão do iOS
  (`DeviceOrientationEvent.requestPermission()` dentro do gesto); recusada, segue no dedo. Desliga com "reduzir
  movimento".
- Só para jogador com romance liberado (3.7).
- A caixa de diálogo continua por cima e pode ser escondida (toque longo ou botão de olho).
- Ao fim: "Guardada em Lembranças".

### 4.8 Ameaça

- Música corta; o som de batida é mais grave. A luz da Sala vira para um **azul frio** e a vinheta fecha (decisão
  desta spec sobre a "luz vermelha" da Casa 4.2: o vermelho chapado fica perto demais do P5; rubi só nas bordas
  de alerta, 8.1).
- **Cut-in rasgado**: o retrato entra por uma rasgadura diagonal em preto, com bordas de rubi, e some. O olho
  aceso segue a ficha (rubi por padrão; cobre no Galo, osso pálido no Corvo).
- Cronômetro: um mostrador no topo com ponteiro que corre (não números grandes), segundos em texto pequeno ao
  lado para quem precisa.
- **Esconderijos no celular**: a cena mostra um cômodo só, e a cama e o guarda-roupa ficam no Quarto. Por isso:
  - uma **fileira de esconderijos** sobe no pé da tela (y 700–790): miniatura pintada, nome e cômodo ("Guarda-
    roupa · Quarto"), o olho de risco (3.9-d) e, se houver, o selo de "usado da última vez";
  - no cenário, os esconderijos visíveis ganham contorno champanhe pulsando; os que estão fora de quadro têm uma
    **seta na borda** da tela, com o ícone deles;
  - tocar na fileira, no contorno ou na seta já conta como escondido a tempo (3.9-c). O avatar corre até lá
    depois, como encenação, atravessando cômodos se precisar.
- Botão "Lidar com a ameaça", acima da fileira, abre o diálogo.
- Escondido: vinheta com a silhueta do esconderijo (portas do armário, borda da cama), passos, a sombra
  cruzando a fresta. Resultado: ela vai embora (porta bate, luz volta) ou acha o jogador (cut-in do rosto em close,
  consequência).
- Depois: caixa de sistema dizendo o que aconteceu, com o texto da consequência.

### 4.9 Morador

- Quarto com o tema do morador (Casa P10). O morador aparece em pontos fixos por horário.
- Tocar nele abre a visita de VN sem cut-in de chegada, com o mesmo medalhão.
- Recompensa secreta: cena curta com o morador e um objeto deixado sobre um móvel; ao pegar, "Segredo
  descoberto".

### 4.10 Desktop (Casa)

- Quadro de VN largo: cenário à esquerda e ao centro, retrato grande à direita saindo da moldura da cena, caixa de
  diálogo embaixo na largura da cena. Escolhas como cartões inclinados (até 6°) à direita, acima da caixa, sem
  cobrir o rosto; até 4.
- Bolsa de presentes em coluna lateral de 420 px; arrastar com o mouse até o retrato.
- Atalhos: 1-4 escolhas, G presentear, Espaço avança, H esconde a caixa, B histórico.
- Ameaça: os esconderijos também respondem a números (1, 2, 3) para teclado; a fileira vira coluna à direita.

---

## 5. Vínculos (interface do DEVO, estilo Confidentes)

Esta é a "segunda tela" do dono. Não é Casa: segue a identidade do DEVO (mármore negro, porcelana, champanhe,
ametista, cobalto, arte pintada). Fica como app no celular do sistema (**Vínculos**) e em ☰ › Vínculos dentro da
Casa (Casa 2.2-l). Mesmo conteúdo, mesma tela.

Referência do Persona: os Confidentes (carta de Arcano, rank, o que o próximo rank libera) e os cartões de
chamada. Adaptação ao DEVO: no lugar do vermelho do P5, ametista e mármore; no lugar da colagem de recortes,
cartões de mármore com filigrana de aço champanhe, sigilos e o mostrador do Tempo. Interface que "se mexe" com o
personagem: a base é comum a todos, e cada cartão leva a pose e o **acento na cor de assinatura** do NPC (faixa
diagonal, borda, aro), como os cartões de cada Confidente no Persona.

**Regras de 2.5D nesta tela** (valem para 5.1–5.5):
- uma única `<Canvas>` de React Three Fiber por tela (a da Constelação); cartões, carta de Arcano da ficha e
  cut-ins em CSS 3D (`perspective`, `transform`), sem canvas próprio;
- inclinação do aparelho só depois de um toque que peça a permissão do iOS; sempre com o dedo como alternativa;
- nenhum controle depende de deslizar a partir da borda (gesto de voltar do iOS e do Android).

### 5.1 Constelação (abertura, 2.5D)

PROPOSTA V15. Ao abrir Vínculos, primeiro uma cena em 2.5D (React Three Fiber, já no projeto), inspirada na
ref-22 e na ref-15:
- No centro, o **sigilo do Record** sobre um mostrador de relógio deitado em perspectiva, com ponteiros lentos.
- Os NPCs conhecidos orbitam em anéis finos de champanhe, cada um como um medalhão com o rosto. **Quanto maior a
  afinidade, mais perto do centro** fica o anel. Paixão marcada: o medalhão ganha um segundo aro de porcelana e
  deixa um rastro de luz ametista na órbita.
- NPCs ainda não conhecidos: pontos apagados na órbita mais externa (sem rosto, sem nome).
- Morador: o medalhão fica pousado sobre o mostrador, dentro da "casa" do relógio.
- Ameaça: o medalhão sai da órbita e fica num anel escuro à parte, com o olho aceso.
- Arrastar gira a constelação; tocar num medalhão aproxima a câmera e abre a ficha (5.3). As órbitas **param**
  quando o dedo encosta na tela, e cada medalhão tem área de toque de 64 px (maior que o desenho), para não ser
  um alvo que foge. Ao soltar, voltam a girar depois de 1,5 s.
- Botão "Lista" no topo alterna para a lista (5.2) e a escolha fica lembrada por aparelho.
- Sem WebGL ou com "reduzir movimento": vai direto para a lista.

### 5.2 Lista de cartões (celular, 390 × 844)

```
┌──────────────────────────────────┐
│ ◆ VÍNCULOS        [Lista|Órbita] │  topo: título champanhe, alternar vista (segmentos)
│ [Todos][Paixão][Moradores][Ameaças]│ filtros em pílulas de mármore
├──────────────────────────────────┤
│ ╱▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔╲   │
│ ▏[pose sai  ] O GALO        IV ▕   │  linha 1: nome + rank (único numeral)
│ ▏[pelo topo ] ◆◆◆◇◇ ─────────♡ ▕   │  linha 2: losangos + fio de romance
│ ▏[          ] ♡ ⌂ ✓          ✦ ▕   │  selos de 16 px numa faixa; ✦ = rank pronto
│ ╲▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁╱   │
│   (próximo cartão, corte ao       │
│    contrário, 8 px de sobreposição)│
└──────────────────────────────────┘
```

- Cartões de **120 px** de altura, cortados em diagonal alternada, com 8 px de sobreposição: a pilha lembra cartas
  jogadas sobre a mesa. A `REFERENCIAS.md` §2.5 pedia 96 px; 120 px é o mínimo para a pose ler a silhueta saindo
  do cartão. Isso precisa ser confirmado em captura de 390 px antes de fechar (se a silhueta não ler, sobe para
  132 px; se ler a 96, desce).
- Em cada cartão, só **duas linhas de informação**:
  - **linha 1**: nome em capitular champanhe e o **rank** em numeral romano em aço champanhe. É o único numeral
    do cartão;
  - **linha 2**: progresso dentro do rank em **losangos** de ametista (cheios, meio, vazios), nunca número; com
    romance aberto, um fio fino de porcelana à direita, com coração de vidro na ponta.
- Fundo e acento:
  - faixa diagonal na cor de assinatura do NPC atrás da figura (como as fichas pedem);
  - a carta de tarô do **Arcano** do NPC em 18% de opacidade, girada 6°, como ilustração, **sem numeral**. O nome
    do Arcano por extenso ("Imperador") fica na ficha. Qual Arcano é de cada NPC: PENDENTE 17 (o Galo já é do
    Imperador);
  - retrato em **pose** do NPC (não o busto de diálogo), saindo do cartão pela cabeça.
- Selos como ícones de 16 px numa faixa só, no pé do cartão: paixão, morador, aceita morar (✓ / ✕ / ?), sem
  romance, rank pronto. O texto de cada um fica na ficha (5.3) e no leitor de tela.
- NPC em ameaça: o cartão vira **negativo** (porcelana sobre preto, retrato em silhueta com o olho aceso; rubi por
  padrão, ou o que a ficha disser) e aparece também no filtro Ameaças.
- Corvo anônimo: "???" no lugar do nome, sem cor de assinatura, penas apagadas no lugar dos losangos (3.11).
- Ordem: rank pronto primeiro, depois paixão, depois rank, depois quem visitou por último.
- Rolagem: cada cartão entra com leve rotação e assenta (spring curto). O cartão sob o centro da tela fica 4%
  maior.

### 5.3 Ficha do NPC (tela cheia)

Composição em diagonal (inspirada nos Confidentes e na ref-14):
- **Metade de cima**: retrato em pose, grande, cortado na coxa, com a carta de Arcano atrás dele em 2.5D (CSS
  3D; segue o dedo, e a inclinação do aparelho só depois do toque de permissão). Faixa diagonal na cor do NPC com
  o nome e o Arcano por extenso ("O Galo · Imperador"), sem numeral de Arcano.
- Medalhão de vínculo (4.6) em tamanho grande, sobreposto ao canto inferior do retrato.
- **Botão Paixão**: losango grande de ametista, em qualquer NPC conhecido. Tocar abre a confirmação (5.6).
- Selo "Rank pronto" quando houver, com a linha "Sobe na próxima visita".
- **Abas** numa barra de segmentos tocável (o deslizar no meio da tela também troca, mas nunca a partir da
  borda):
  1. **Vínculo**: escada de ranks em lista de medalhões (ref-15). Cada rank mostra o que libera e o tipo do
     prêmio: os já recebidos em champanhe, o próximo aceso com "Próximo: Chave de Torre" (tipo à vista, item
     exato oculto, como o Persona), os seguintes como "???". Com romance aberto, uma segunda coluna com os ranks
     de romance e os encontros. Detalhes de moradia ("Aceita morar", "Não mora com ninguém", "Talvez" com a dica)
     e de romance ("Sem romance" e o motivo) ficam aqui, por extenso.
  2. **Gostos**: presentes descobertos em cinco faixas (amado → odeia), decoração preferida e evitada (tags
     descobertas). O que não foi descoberto aparece como ficha virada. Se aceita morar.
  3. **Lembranças**: galeria das CGs em retrato (variante obtida), cenas marcantes que podem ser **revistas**
     (sem efeito), cartões de visita recebidos, segredos de morador já descobertos.
  4. **Registro**: as últimas visitas (data, tipo, resultado), sem números de afinidade.
- Ação de rodapé: **Convidar para morar** (com o motivo se não puder) ou **Despedir morador**.

### 5.4 Desktop (Vínculos)

- Constelação em tela larga ocupando a área principal; ao lado direito, uma coluna de 420 px com a ficha do NPC
  escolhido. Mudar de NPC gira a constelação até ele.
- Lista em grade de dois cartões por linha, mantendo os cortes diagonais.
- Ficha: retrato e Arcano à esquerda (50%), abas à direita; Lembranças abrem num visor central com fundo
  desfocado.

### 5.5 Cut-in de rank (subida)

Quando o rank sobe, **dentro da cena de rank da visita** (3.3-b), nunca ao abrir Vínculos:
1. A tela escurece em diagonal.
2. Faixa na cor de assinatura do NPC atravessa com o retrato em pose e a palavra **"Vínculo"** em capitulares; o
   numeral do rank novo cai como um selo de metal e trava com um clique.
3. A carta do Arcano gira uma vez em 3D e mostra o prêmio do rank saindo dela (chave, pacote, Dracma).
4. "Toque para continuar". Duração total 1,6 s; pode pular.

Queda de rank: sem cut-in. O numeral perde um traço com som seco e um fio de rachadura corre o aro do medalhão.

### 5.6 Paixão: marcar e desmarcar

- Confirmação: folha de baixo com o retrato e a frase do sistema "Marcar {nome} com paixão?", o efeito escrito
  em uma linha ("Mais chances de visita e uma barra de romance.", ou "Mais chances de visita. {nome} não tem
  romance." quando a barra não abre) e, se houver limite, quem perde a marca.
- Ao confirmar: o losango se acende, um segundo aro de porcelana nasce no medalhão e a barra de romance se
  desenha da esquerda para a direita (400 ms).
- Desmarcar: confirmação com a espera de `X` dias escrita; a barra fica, mas em cinza-porcelana, com cadeado.

---

## 6. Estados de animação e de interface

### 6.1 NPC na Casa (cenário)

| Estado | Quando | O que se vê |
|---|---|---|
| `chegando` | visita sorteada, jogador na Casa | passos atrás da porta, sombra por baixo dela |
| `batendo` | aguardando atender | batida a cada 4 s, fresta de luz pulsando |
| `entrando` | atendeu | porta abre, o NPC entra pela profundidade (escala sobe 0,9 → 1) |
| `na_sala` | conversa | NPC em pé ou sentado num ponto da Sala; idle de respiração |
| `reagindo_bem` / `reagindo_mal` | depois de escolha ou presente | pose curta no sprite + troca de retrato |
| `saindo` | despedida | vira, anda até a porta, porta fecha |
| `cartao_deixado` | visita perdida | cartão preto na fresta, brilho fraco do sigilo |
| `ameaca_chegando` | ameaça entregue no `GET` | três golpes, luz fria, vinheta |
| `ameaca_procurando` | jogador escondido | silhueta anda pelos cômodos; passos |
| `ameaca_achou` | busca encontrou | parada brusca diante do esconderijo, cut-in de rosto |
| `ameaca_partindo` | jogador resolveu ou não foi achado | porta bate; a luz volta em 600 ms |
| `morador_rotina` | morador em casa | anda entre pontos por horário; senta, lê, dorme |
| `holograma` | visita da Melissa (3.11) | projetor acende; figura translúcida com varredura, sem andar |

Esses estados pedem **corpo do NPC no cenário**, que é outra arte além do retrato de VN. É o maior custo de arte
deste sistema e está listado em 7.6 com a contagem de quadros. As ameaças só aparecem em silhueta no cenário.

### 6.2 Retrato de VN

| Estado | O que se vê |
|---|---|
| `entra` | desliza 24 px da direita com fade, 220 ms, e passa da moldura |
| `idle` | respiração 2 px, piscar a cada 3–6 s |
| `fala` | leve inclinação para a frente (1°) enquanto o texto corre |
| `expressao` | troca com estalo (1,04 → 1, 120 ms) |
| `cutin_expressao` | close horizontal do rosto, 450 ms, no máximo 1 por visita |
| `vinculo_sobe` | filete ametista sobe pela borda; faísca voa ao medalhão |
| `vinculo_desce` | rachadura champanhe na moldura, 200 ms |
| `presente_amado` | objeto gira em 2.5D na frente; faíscas; expressão forte |
| `presente_odeia` | o NPC empurra o objeto de volta; queda na bolsa |
| `sai` | desliza para fora com fade, 180 ms |

### 6.3 Vínculos (interface do DEVO)

| Estado | O que se vê |
|---|---|
| `carregando` | mostrador da constelação girando lento em champanhe |
| `constelacao` | órbitas giram devagar; medalhões flutuam 2 px |
| `foco_npc` | câmera aproxima; os outros anéis desfocam |
| `lista` | cartões entram em cascata (40 ms entre cada) com rotação e assentam |
| `cartao_ameaca` | cartão em negativo, olho aceso piscando lento (rubi por padrão; cor da ficha se houver exceção) |
| `rank_pronto` | selo ✦ brilhando no cartão e no pingente do medalhão |
| `anonimo` | cartão "???" sem cor, penas apagadas (Corvo) |
| `visao_equipe` | faixa fina "Visão de equipe · só leitura" no topo; paixão e convite desligados |
| `paixao_marcando` | losango acende; aro de porcelana nasce; barra se desenha |
| `paixao_espera` | barra cinza com cadeado e contagem em dias |
| `rank_sobe` | cut-in 5.5 |
| `rank_cai` | numeral perde traço; rachadura no aro |
| `premio_pendente` | brilho no selo de rank até o jogador ver o prêmio |
| `gosto_descoberto` | ficha vira com som de carta |
| `cg_nova` | miniatura em Lembranças com fio de ametista girando até ser aberta |
| `pendente` | `X` em itálico champanhe, toque explica "valor ainda não definido pelo dono" |
| `banco_desatualizado` | aviso padrão (503 `{code:'banco_desatualizado'}`) |
| `offline` | só leitura do último estado; paixão e convite desligados |

### 6.4 Avatar (Casa)

Usa os estados da `SPEC-AVATAR.md` que já estão na estreia: `acenando` (atender), `assustado`, `escondido`,
`comemorando` (rank). O presente usa o objeto flutuante de 4.4, sem sprite novo.

`segurando_presente` é um **estado novo pedido por esta spec**: a `SPEC-AVATAR.md` o deixa fora da estreia
porque soma quadros a toda roupa (`X` quadros × número de roupas). Ele só entra se o dono aprovar esse custo; até
lá, o objeto flutuante cobre a cena.

### 6.5 Acessibilidade e movimento

- Toda a cena 2.5D tem alternativa estática completa (lista de cartões, ficha sem giro).
- Cut-ins e partículas obedecem a `prefers-reduced-motion` e ao "reduzir movimento" do jogo: viram esmaecimento
  de 150 ms.
- Leitor de tela: "O Galo, Imperador, rank IV, três de cinco marcas; paixão marcada; romance em dois de cinco;
  aceita morar".
- O cronômetro da ameaça tem a opção "mais tempo" (`×X`) em Ajustes, sem efeito no resultado (PROPOSTA V16). A
  fileira de esconderijos (4.8) é navegável por leitor de tela e por teclado.
- Nenhum controle depende de inclinação ou de gesto a partir da borda (5).
- Alvos de toque de 48 px; texto mínimo 14 px.

---

## 7. Modelo de dados e APIs

Migração nova `scripts/visitantes-migration.sql`, idempotente, seguindo a rotina do `CLAUDE.md` (entra no
`capturas.yml`, `scripts/dev/local-db.mjs` e `scripts/dev/gerar-banco-novo.sh`). Depende de
`fundacao-migration.sql`, `narrativa-migration.sql`, `casa-v2-migration.sql` (tabelas `casas`, `casa_perfil`,
`casa_hospedes`) e da `v2-item-kinds-migration.sql` compartilhada. Nenhuma tabela atual é apagada.

### 7.1 Código puro: `lib/devo/vinculos.ts`

Sem banco, importado por cliente e servidor:
- `rankDe(afinidade, niveis, rankAtual)`: aplica a histerese de 3.3-b;
- `pesoVisita(npc, ctx)`: a fórmula de 3.2 (com `clamp`), recebendo perfil, paixão, faixa, saudade;
- `grauPresente(npc, item)`: item → tags → `neutro`;
- `fatorDecoracao(perfil, gostosDecoracao, limites)`;
- `sortearVisita(semente, candidatos)`: sorteio determinístico;
- tipos `FichaVisitante`, `Vinculo`, `VisitaAgendada`.
Testes de unidade em `scripts/dev/vinculos-test.mjs`.

### 7.2 Tabelas

```sql
-- Item novo (tabela item_kinds compartilhada, Casa 5.1)
INSERT INTO item_kinds (kind, origem) VALUES ('presente','visitantes') ON CONFLICT (kind) DO NOTHING;
-- presente.meta: {"tags":["doce","flor"], "arte":"presentes/<id>", "evento":null}

-- Vínculo por jogador e NPC
CREATE TABLE IF NOT EXISTS vinculos (
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  npc text NOT NULL CHECK (npc ~ '^[a-z0-9_]{2,40}$'),
  afinidade integer NOT NULL DEFAULT 0 CHECK (afinidade >= 0),     -- Essência do vínculo (opção A, PENDENTE 1)
  rank smallint NOT NULL DEFAULT 0 CHECK (rank >= 0),
  rank_pronto boolean NOT NULL DEFAULT false,                       -- passou do mínimo; sobe na próxima visita (V19)
  identidade text NOT NULL DEFAULT 'revelado' CHECK (identidade IN ('anonimo','revelado')),  -- Corvo (3.11)
  romance integer NOT NULL DEFAULT 0 CHECK (romance >= 0),
  rank_romance smallint NOT NULL DEFAULT 0 CHECK (rank_romance >= 0),
  paixao boolean NOT NULL DEFAULT false,
  paixao_desde timestamptz,
  paixao_espera_ate timestamptz,                                    -- espera depois de desmarcar (3.6)
  conhecido_em timestamptz NOT NULL DEFAULT now(),
  conhecido_por text NOT NULL DEFAULT 'visita',                     -- 'visita' | 'cena' | 'owner'
  ameaca_ate timestamptz,                                           -- estado de ameaça temporário (3.9-a)
  chamado_em timestamptz,                                           -- último "chamar" (3.12, V21)
  ultima_visita_em timestamptz,
  versao integer NOT NULL DEFAULT 1,
  PRIMARY KEY (player_id, npc)
);
-- No máximo N paixões ativas (PENDENTE 7): conferido só no servidor, com SELECT ... FOR UPDATE nas linhas do
-- jogador. Nenhum índice único parcial na migração: ele travaria N = 1 no banco antes de o dono decidir.

-- Livro-razão do vínculo: toda mudança, com origem e idempotência
CREATE TABLE IF NOT EXISTS vinculo_log (
  id bigserial PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  npc text NOT NULL,
  campo text NOT NULL CHECK (campo IN ('afinidade','romance','rank','rank_romance','paixao','ameaca','identidade')),
  delta integer NOT NULL,
  valor integer NOT NULL,                                            -- valor depois
  origem text NOT NULL,                                              -- 'escolha' | 'presente' | 'visita' | 'favor' | 'premio' | 'owner' | 'desfazer'
  ref text,                                                          -- visita id, cena:escolha, item
  actor_id uuid REFERENCES players(id) ON DELETE SET NULL,
  idem_key text,
  desfeito_em timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS vinculo_log_idem_idx ON vinculo_log (idem_key) WHERE idem_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS vinculo_log_player_idx ON vinculo_log (player_id, npc, at DESC);

-- Decisões de período e visitas (uma linha por decisão; inclusive "sem visita")
CREATE TABLE IF NOT EXISTS visitas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  periodo text NOT NULL,                                             -- início do período em America/Sao_Paulo, ex.: '2026-11-01T12' (PENDENTE 4)
  origem text NOT NULL DEFAULT 'sorteio' CHECK (origem IN ('sorteio','forcada','evento','chamado')),
  npc text,                                                          -- null quando status = 'sem_visita'
  tipo text CHECK (tipo IN ('conversa','favor','intriga','ameaca','apresentacao','encontro')),
  cena_id text,
  semente bigint NOT NULL,
  pesos jsonb NOT NULL,                                              -- registro do sorteio (auditoria, Mesa)
  criada_em timestamptz NOT NULL DEFAULT now(),
  expira_em timestamptz,
  status text NOT NULL DEFAULT 'agendada'
    CHECK (status IN ('sem_visita','agendada','em_curso','concluida','perdida','recusada','escondido','achado','resolvida','expirada_ameaca','cancelada')),
  iniciada_em timestamptz,
  prazo_ameaca timestamptz,                                          -- gravado no GET que entrega a ameaça (3.9-c)
  sorte_busca double precision CHECK (sorte_busca >= 0 AND sorte_busca < 1),  -- u sorteado na chegada; nunca vai ao cliente antes do resultado
  resultado jsonb,                                                   -- esconderijo, chance, achado?, consequência, presente
  presente_dado text REFERENCES item_defs(key) ON UPDATE CASCADE,
  CHECK ((status = 'sem_visita') = (npc IS NULL))
);
-- Uma decisão de sorteio por período; visitas forçadas, de evento e de chamado convivem com ela
CREATE UNIQUE INDEX IF NOT EXISTS visitas_sorteio_periodo_idx ON visitas (player_id, periodo) WHERE origem = 'sorteio';
CREATE INDEX IF NOT EXISTS visitas_ativa_idx ON visitas (player_id, expira_em) WHERE status IN ('agendada','em_curso');
CREATE INDEX IF NOT EXISTS visitas_player_periodo_idx ON visitas (player_id, periodo DESC);

-- Escolhas de visita (efeito uma vez por instância; dialog_events continua para as cenas de história)
CREATE TABLE IF NOT EXISTS visita_eventos (
  visita_id uuid NOT NULL REFERENCES visitas(id) ON DELETE CASCADE,
  key text NOT NULL,                                                 -- mesmo formato de dialog_events.key
  option_index integer,
  applied jsonb NOT NULL DEFAULT '[]'::jsonb,
  at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (visita_id, key)
);

-- Presentes dados (limites semanais; pode ser derivado de visitas, mas morador dá fora de visita)
CREATE TABLE IF NOT EXISTS presentes_dados (
  id bigserial PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  npc text NOT NULL,
  item_key text NOT NULL REFERENCES item_defs(key) ON UPDATE CASCADE,
  grau text NOT NULL CHECK (grau IN ('amado','gosta','neutro','desgosta','odeia')),
  visita_id uuid REFERENCES visitas(id) ON DELETE SET NULL,
  at timestamptz NOT NULL DEFAULT now(),
  idem_key text UNIQUE
);
CREATE INDEX IF NOT EXISTS presentes_dados_semana_idx ON presentes_dados (player_id, npc, at DESC);

-- O que o jogador já descobriu de cada NPC (gostos de presente e de decoração, aceita morar, segredos)
CREATE TABLE IF NOT EXISTS vinculo_descobertas (
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  npc text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('presente','tag_presente','decoracao','segredo','moradia')),
  chave text NOT NULL,
  valor text,                                                        -- grau descoberto
  origem text NOT NULL,                                              -- 'presente' | 'fala' | 'comentario' | 'owner'
  em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, npc, tipo, chave)
);

-- Prêmios de rank entregues (um por rank; nunca retirado por queda)
CREATE TABLE IF NOT EXISTS vinculo_premios (
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  npc text NOT NULL,
  trilha text NOT NULL CHECK (trilha IN ('afinidade','romance','morador')),
  marco text NOT NULL,                                               -- 'rank:4', 'segredo:<id>'
  entregue jsonb NOT NULL,                                           -- o que saiu, pelo deliverIn
  em timestamptz NOT NULL DEFAULT now(),
  visto_em timestamptz,                                              -- estado premio_pendente
  desfeito_em timestamptz,
  PRIMARY KEY (player_id, npc, trilha, marco)
);

-- Lembranças: CGs e cenas revistas
CREATE TABLE IF NOT EXISTS vinculo_lembrancas (
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  npc text NOT NULL,
  lembranca text NOT NULL,                                           -- 'cg:<encontro>' | 'cena:<id>' | 'cartao:<visita>'
  variante text,
  em timestamptz NOT NULL DEFAULT now(),
  visto_em timestamptz,
  PRIMARY KEY (player_id, npc, lembranca)
);
```

Notas:
- O vínculo nasce no primeiro encontro (`conhecido_em`). Não há linha para NPC desconhecido.
- `afinidade` e `romance` só mudam por funções do servidor que escrevem em `vinculo_log` na mesma transação,
  com `SELECT ... FOR UPDATE` na linha de `vinculos`. O rank é recalculado ali, e os prêmios novos entram em
  `vinculo_premios` + `deliverIn` com `idem_key = 'vinculo:<player>:<npc>:<trilha>:<marco>'`.
- Teto diário (3.3-d): soma de `vinculo_log` por `(player, npc, dia em America/Sao_Paulo)` conferida na mesma
  transação.
- O "máximo `X` visitas comuns por dia" conta linhas de `visitas` com `npc` não nulo e tipo diferente de `ameaca`
  no dia local, de qualquer origem, salvo `forcada` (teste da equipe).
- Idade do jogador para o romance (3.7): lida do perfil do prólogo no save do servidor (`lib/devo/save.ts`), não
  do cliente. Se o dono preferir uma coluna própria em `players`, ela entra nesta migração (PENDENTE 22).
- `casa_hospedes` (Casa 5.1) continua sendo a tabela dos moradores; esta spec só lê.

### 7.3 Configuração (`devo_config`, tudo `provisional = true` até o dono decidir)

| Chave | Conteúdo |
|---|---|
| `visitantes.npcs` | por NPC: `{visitante, romanceavel:null, adulto:null, aceita_morar:'sim'|'nao'|'talvez'|null, lado:'companhia'|'necro'|'neutro'|null, pode_ameacar:null, apenas_ameaca:false, modo_visita:'porta'|'holograma', recebe_presente:true, arcano, assinatura:'#RRGGBB' (da ficha), ameaca:{olho:'rubi'|'#RRGGBB', cor}, base:{conversa:null, favor:null, intriga:null, ameaca:null, encontro:null}, gostos:{itens:{}, tags:{}}, decoracao:{}, aniversario:null, cenas:{conversa:[], favor:[], rank:[], ...}, encontros:[], ameaca_regras:{esconderijo_base:null, consequencias:[], lidar:[]}}` |
| `visitas.regras` | **fonte única** (substitui `casa.visitas` e `casa.hostil` da Casa 5.1, ver 8.1): `{fuso:'America/Sao_Paulo', periodo_horas:null, recuperar_periodos:null, chance_base:null, chance_vazio:{passo:null, teto:null}, max_dia:null, max_ameaca_semana:null, janela_horas:null, apresentacao_cada:null, chamar:{custo:null, fator:null}, fatores:{decoracao:{min:null,max:null}, paixao:null, saudade:{passo:null,teto:null}, protecao:{mult:null,min:null}, ordem:{}}}` |
| `afinidade.niveis` | `[{rank, minimo:null, folga:null, premios:[], libera:[]}]` |
| `afinidade.origens` | `{atender:null, presente:{amado:null,gosta:null,neutro:null,desgosta:null,odeia:null}, raridade:{}, aniversario:null, teto_dia:null, essencia_item_razao:null}` |
| `romance.niveis` | `[{rank, minimo:null, folga:null, libera:[]}]` e `{presente_amado_extra:null, paixao_max:null, espera_dias:null, idade_minima_jogador:18}` (o 18 é trava de conteúdo, não valor de jogo; a política é PENDENTE 22) |
| `presentes.regras` | `{por_semana:null, por_visita:null}` |
| `ameaca.regras` | `{segundos:null, ao_expirar:null, aprende:{janela:null, mult:null}, risco_visivel:true, sombra:{limiar:null}, limites:{tempo_minimo:null, sem_dv_ativo:true}}` |
| `casa.moradia` | (Casa 5.1) `{aceita_morar, rank_min:null, recompensas:[], funcoes:[], despejo_custo:null}` |

O Owner edita tudo na **Mesa › Vínculos**. Fichas de NPC e roteiros ficam em JSON validado no servidor (como o
`conteudo.json` das Torres), para que NPC novo seja dado e não código.

### 7.4 APIs

**`GET /api/vinculos`** → lista do jogador (com `?visao=equipe`, para Owner/Anfitrião, todos os NPCs em leitura,
3.13):

```ts
{
  vinculos: {
    npc: string; nome: string | null; arcano: string | null; rank: number; marcas: { cheias: number; total: number }
    identidade: 'anonimo' | 'revelado'; assinatura: string | null; rankPronto: boolean
    paixao: boolean; romance: { rank: number; marcas: { cheias: number; total: number }; congelado: boolean } | null
    semRomance: 'nao_romanceavel' | 'idade' | null
    selos: { morador: boolean; aceitaMorar: 'sim' | 'nao' | 'talvez'; ameaca: boolean; sombra: number | null }
    proximo: { tipo: 'chave' | 'pacote' | 'dracma' | 'item' | 'funcao' | '???' } | null
    premioPendente: boolean; ultimaVisita: string | null
  }[]
  desconhecidos: number                         // pontos apagados da constelação
  paixao: { max: number | null; esperaAte: string | null }
  visao: 'propria' | 'equipe'
  provisorio: boolean
}
```
Sem números de afinidade ou romance: só marcas dentro do rank (PROPOSTA V17, o cliente não recebe o contador).

**`GET /api/vinculos?npc=<id>`** → ficha: ranks com o que libera (próximo com tipo, demais `???`), descobertas,
lembranças, registro das últimas `X` visitas.

**`POST /api/vinculos`**, `{action}`, toda ação com `idem`:

| Ação | Corpo | Regras |
|---|---|---|
| `paixao.marcar` | `{npc, idem}` | conhecido e revelado, fora da espera, dentro do limite (`FOR UPDATE`). Não exige romanceável: a barra abre ou não pela regra de 3.6 |
| `npc.chamar` | `{npc, idem}` | V21: conhecido, um chamado por vez, custo `X`; grava `chamado_em` |
| `paixao.desmarcar` | `{npc, idem}` | grava `paixao_espera_ate` |
| `premio.visto` | `{npc, trilha, marco}` | só marca `visto_em` (a entrega já aconteceu) |
| `lembranca.ver` | `{npc, lembranca}` | marca `visto_em`; reabre a cena em modo revisão, sem efeito |
| `presente.dar` | `{npc, item, visita?, idem}` | só a morador fora de visita; dentro de visita vai pela Casa |

**`/api/casa`** (Casa 5.2) ganha as ações abaixo. O `visita.responder` da Casa vira **alias** delas, para não
quebrar o que já estiver escrito: `atender` → `visita.iniciar`, `recusar` → `visita.recusar`, `esconder` →
`visita.esconder`, `enfrentar` → `visita.lidar` (8.1).

| Ação | Corpo | Regras |
|---|---|---|
| `visita.iniciar` | `{visita, idem}` | só visita não-ameaça, agendada e dentro da janela; status → `em_curso`. A ameaça não passa por aqui: o prazo nasce no `GET` (3.9-c) |
| `visita.recusar` | `{visita, idem}` | visita comum: vira cartão de visita (3.1-e), sem efeito no vínculo salvo o que a ficha disser |
| `visita.escolher` | `{visita, escolha, opcao, idem}` | efeitos lidos da cena; grava `visita_eventos`; aplica afinidade/romance/honra/necro |
| `visita.presentear` | `{visita, item, idem}` | posse, limite por visita e semana; consome 1; grau; descoberta |
| `visita.esconder` | `{visita, esconderijo, idem}` | antes de `prazo_ameaca` (relógio do servidor, com folga de rede de `X` ms); esconderijo existe na casa, em qualquer cômodo; calcula a chance daquele esconderijo e devolve `achado = sorte_busca < chance` |
| `visita.lidar` | `{visita, idem}` | antes do prazo; para o relógio e abre a cena de "lidar" daquela ameaça |
| `visita.encerrar` | `{visita, idem}` | fecha, devolve o resumo (4.5) |
| `hospede.convidar` | (Casa 5.2) | + rank mínimo de `afinidade.niveis` e condição da cena |

O sorteio roda no `GET /api/casa` e no `GET /api/vinculos`, com a recuperação de 3.1-d: com `pg_advisory_xact_lock`
por jogador, o servidor pega o último período com linha de `origem = 'sorteio'`, sorteia em ordem cada período
seguinte até o atual (no máximo `recuperar_periodos`), grava **todas** as decisões, inclusive `sem_visita`, e só
então responde. Visitas comuns cuja janela já passou viram cartão; ameaças vencidas seguem `ao_expirar`. Abrir
Vínculos também permite a notificação "alguém bateu" fora da Casa (PROPOSTA V18; push só se o dono quiser). O
`GET /api/vinculos` nunca entrega ameaça nem grava `prazo_ameaca`: isso só acontece no `GET /api/casa`.

**Owner / Anfitrião** (Mesa › Vínculos; `config.editar` para regras; ações com nota obrigatória e `admin_log`):

| Ação | O que faz |
|---|---|
| `vinculos.config.salvar` | fichas, regras, níveis |
| `vinculo.ver` | vínculo e registro de qualquer jogador (inclui `pesos` dos sorteios) |
| `vinculo.ajustar` | soma/subtrai afinidade ou romance; gera `vinculo_log` origem `owner` |
| `vinculo.desfazer` | desfaz uma linha de `vinculo_log` ou um prêmio de `vinculo_premios` (devolve pelo `deliverIn` inverso, no padrão "owner desfaz recompensa" do dono) |
| `visita.forcar` | agenda uma visita de NPC e tipo escolhidos (`origem = 'forcada'` para teste, `'evento'` para eventos); convive com a decisão de sorteio do período |
| `visita.cancelar` | cancela uma visita agendada (ex.: ameaça durante problema de suporte) |
| `presente.conceder` | entrega presente por evento (`deliverIn`, fluxo de aprovação atual) |

Erros iguais ao resto: 401/403/409 (`{code:'vinculo_mudou'}`, `{code:'visita_expirada'}`,
`{code:'limite_presentes'}`, `{code:'paixao_espera'}`), 503 `{code:'banco_desatualizado'}` quando faltar tabela
ou coluna.

### 7.5 Motor de diálogo (acréscimos compatíveis em `formato.ts`)

```ts
type Efeito =
  | ...                                                     // os atuais
  | { tipo: 'afinidade'; npc?: string; delta: number; config?: string }   // npc padrão = Visitante da visita
  | { tipo: 'romance'; npc?: string; delta: number; config?: string }     // ignorado sem paixão
  | { tipo: 'honra'; delta: number } | { tipo: 'necro'; delta: number } // SPEC-ORDEM
  | { tipo: 'descobre'; npc?: string; descoberta: 'presente'|'tag_presente'|'decoracao'|'segredo'|'moradia'; chave: string }

type Condicao (nova, por opção ou passo) =
  | { paixao: true } | { rank_min: number } | { romance_min: number } | { faixa: 'ordeiro'|'neutro'|'suspeito'|'hostil' }
  | { decoracao_tag: string } | { morador: true }
```

- Opção com `condicao` que não vale **não aparece** (diferente de `requer`, que mostra trancada). Opção de
  romance leva `romance: true` para o losango de 3.4.
- Novos cenários: `casa-sala`, `casa-quarto`, `casa-ameaca` (cenário pintado da Casa), `encontro-<id>`.
- Novo passo `cg`: `{tipo:'cg', npc, encontro, variantes:{<condição>: arquivo}}`.
- Cenas de visita gravam em `visita_eventos`; cenas de história continuam em `dialog_events`.

### 7.6 Arte e arquivos

- Retratos e poses: produzidos na etapa de NPCs (Persona, `npcs/*.md`). Esta spec pede, por Visitante: busto de
  VN com as expressões do vocabulário de `npcs.ts`, **uma pose de cartão** (corpo até a coxa, gesto
  característico), a pose de ameaça quando a ficha prevê, e o recorte dos olhos para o cut-in.
- **Corpo do NPC no cenário da Casa** (o maior custo de arte deste sistema, pedido pelos estados de 6.1). Folha
  mínima por Visitante, na escala e na luz do cenário pintado do `MOTOR-CASA-TORRES.md`:

  | Estado | Direções | Quadros | Total |
  |---|---|---|---|
  | parado (respiração) | 2 (frente, 3/4 de costas) | 2 | 4 |
  | andar | 2 (para a porta, para dentro), espelhadas para os lados | 6 | 12 |
  | sentar | 1 | 1 pose + 2 de idle | 3 |
  | reagir (bem / mal) | 1 | 1 + 1 | 2 |
  | **por Visitante** | | | **21** |

  Morador soma `deitar` e `ler` (2 + 2 quadros). Ameaças só em **silhueta** (uma folha de andar de 6 quadros
  em 2 direções, recolorida por NPC), o que corta o custo delas. Melissa não anda: holograma usa a pose de
  apresentação com tratamento de luz. Com 6 Visitantes que andam, são cerca de 126 quadros mais os de morador.
- Avatar: `segurando_presente` só se o dono aprovar o custo (6.4). Sem ele, nada novo do avatar.
- Presentes: arte pintada de objeto, 512 px, fundo transparente (pipeline `infra/arte`), mesma família visual dos
  frascos de Essência.
- CGs: 1080 × 1920, em camadas separadas (fundo, figuras, primeiro plano) para a paralaxe de 4.7.
- Cartão de visita: um molde comum de mármore negro, com sigilo e faixa na cor de assinatura trocados por NPC.
- Esconderijos: miniatura pintada de cada um (128 px) para a fileira de 4.8.

---

## 8. O que muda nos sistemas atuais

| Sistema | Hoje | No v2 |
|---|---|---|
| `lib/devo/npcs.ts` | elenco, retratos, conversas fixas (Mensagens) | + `pose` de cartão e recorte de olhos; ficha de Visitante vem do config, não do arquivo |
| Mensagens (contatos, `NPCS[].choices`) | escolhas fixas, sem efeito de vínculo | continua; pode ganhar `efeito afinidade` em escolhas novas (o vínculo nasce por `conhecido_por = 'cena'`) |
| Motor de diálogo | efeitos tempo/karma/item/flag/contato, uma vez por cena | + efeitos `afinidade`, `romance`, `honra`, `necro`, `descobre`; condições; passo `cg`; tabela `visita_eventos` (7.5) |
| Essências (`essencia:<npc>`) | item gastável das Torres; vem do Poço e de cenas | continua igual nas Torres; também nasce do vínculo na razão `X` (3.3-c); o contador do vínculo é separado (PENDENTE 1) |
| Torres | custo em Essência por andar | nada muda na regra; a tela mostra de onde vem a Essência ("Vínculo com o Galo") |
| Poço dos Milagres | categorias lixo/cápsula/fragmento/essência/cosmético | + categoria `presente` (peso PENDENTE 18); `poco_giros_categoria_chk` e `poco_premios` ganham o valor |
| Calendário | eventos | + eventos de presente e, se aprovado, aniversários de NPC (PENDENTE 9) |
| Inventário | abas por kind | + aba Presentes (com o grau descoberto por NPC ao tocar) |
| Recompensas (`deliverIn`) | cartas e itens | entrega prêmios de rank com `idem`; Owner desfaz pelo fluxo atual |
| Karma (`karma_log`) | número único | as escolhas de intriga escrevem em honra/necro da `SPEC-ORDEM.md`; a relação com o karma antigo é decisão daquela spec |
| Casa (`SPEC-CASA.md`) | porta, esconderijos, `casa_perfil`, `casa_hospedes`, `visita` no payload | esta spec preenche o lado do Visitante; o payload `visita` passa a `{id, tipo: 'conversa'|'favor'|'intriga'|'ameaca'|'apresentacao'|'encontro', npc, modo: 'porta'|'holograma', expira, prazoAmeaca, esconderijos?: [{id, nome, comodo, risco: 'baixo'|'medio'|'alto', usadoUltima: boolean}]}`; ver 8.1 |
| Cosméticos | molduras, emblemas, balões | prêmios de rank podem ser cosméticos novos (ex.: moldura do Confidente de cada NPC). Desenho na etapa de cosméticos |
| Mesa | regras de vários sistemas | + **Mesa › Vínculos**: fichas, níveis, regras, ver/ajustar/desfazer, forçar visita, auditoria de sorteios |
| Owner/Anfitrião | acesso a tudo | jogam Vínculos normal, com os próprios vínculos; o interruptor "Visão de equipe" mostra todos os NPCs em leitura, sem gravar nada (3.13) |
| Mensagens | contatos | + ação "Chamar" no contato de um NPC conhecido (V21, 3.12) |

### 8.1 Reconciliação com SPEC-CASA, SPEC-AVATAR e SPEC-ORDEM

A `SPEC-CASA.md` ainda tem trechos em pixel e foi escrita antes desta spec. *(Harmonização de 01/11, noite: a
`SPEC-CASA.md` ganhou no topo uma nota que remete a esta tabela, e a `SPEC-ORDEM.md` §5 foi corrigida.)* Esta
tabela diz o que vale. **Pedido**: atualizar a `SPEC-CASA.md`
com a coluna "Vale" e apagar a coluna "Antes".

| Assunto | Antes (onde) | Vale | Por quê |
|---|---|---|---|
| Ações de visita | `visita.responder {atender|recusar|esconder|enfrentar}` (Casa 5.2) | `visita.iniciar`, `visita.recusar`, `visita.esconder`, `visita.lidar`, `visita.escolher`, `visita.presentear`, `visita.encerrar` (7.4). `visita.responder` fica como alias | cada ação tem regra própria; o alias evita quebrar código |
| Tipos no payload | `visita.tipo: 'comum'|'hostil'` (Casa 5.2) | os 6 tipos de 3.1-c, com `ameaca` no lugar de `hostil` | "conversas fiadas, favores ou até mesmo intrigas" pede tipos distintos |
| Configuração | `casa.visitas.janela_horas`, `casa.visitas.fatores.{decoracao,paixao,karma}`, `casa.hostil.{segundos_para_esconder,ao_expirar}` (Casa 5.1) | `visitas.regras` e `ameaca.regras` (7.3). As chaves `casa.visitas` e `casa.hostil` deixam de existir. O fator `karma` vira `fator_ordem` (honra/necro) | uma fonte de verdade só |
| Luz da batida de ameaça | `batida_hostil` "luz vermelha, tremida" (Casa 4.2) | azul frio com vinheta; rubi só nas bordas do cut-in; o tremor da porta continua (4.8) | o vermelho chapado lembra o P5 e gasta o rubi de alerta |
| Menu na ameaça | "menu reduzido a Esconder e Enfrentar" (Casa 4.3) | "Esconder-se" (fileira de esconderijos) e **"Lidar com a ameaça"** | texto literal do dono |
| Visita perdida | `bilhete` "passei aqui" (Casa 2.2-h, 4.2) | cartão de visita na cor do NPC, que nunca diz o que ia dizer (3.1-e); estado da porta `cartao` | V4; mais forte como objeto e coerente com o cartão de chamada |
| Aviso na porta | balão "!" sobre a porta (Casa 3.1 item 7, 4.1, 4.3) | selo pulsando sobre a porta e faixa "[Um Visitante apareceu]" (4.1) | o balão "!" é linguagem pixel |
| Carregando | "porta fechada em pixel" (Casa 4.3) | porta pintada do cenário com "Abrindo a porta…" | nada de pixel |
| Menu | "menu pixel" (Casa 3.1) | menu da Casa no registro pintado do `MOTOR-CASA-TORRES.md` | direção atual |
| Avatar com presente | `segurando_presente` previsto aqui, fora da estreia na `SPEC-AVATAR.md` | objeto flutuante; o estado só com aprovação de custo (6.4) | o custo existe e fica à vista |
| Aviso de faixa de ordem | "selo no HUD em pixel" e "caixa estilo RPG Maker" fora da Casa (`SPEC-ORDEM.md`) | fora da Casa e das Torres: selo e aviso na interface do DEVO (mármore, champanhe). Dentro da Casa: caixa de VN pintada. **Pedido**: revisar a `SPEC-ORDEM.md` | direção corrigida: pixel nunca, e RPG Maker só na Casa e nas Torres |
| Nome do estado | "hostil" para visita e para NPC | `ameaca` (visita), "em ameaça" (NPC); "Hostil" só como faixa | evita colisão de nomes |

---

## 9. Fluxos completos (resumo por tela)

| # | Tela | Onde | Estilo |
|---|---|---|---|
| 1 | Batida na porta + cut-in de chegada | Casa › Sala | RPG Maker/VN |
| 2 | Visita: conversa, escolhas, reações | Casa | VN |
| 3 | Bolsa de presentes e reação | Casa | VN + 2.5D (objeto girando) |
| 4 | Resumo da visita (cartão-recibo) | Casa | VN |
| 5 | Cartão de visita na porta | Casa › Sala | RPG Maker |
| 6 | Ameaça: chegada, fileira de esconderijos, busca, lidar | Casa | RPG Maker/VN |
| 7 | Encontro com CG | Casa ou cenário de encontro | VN + paralaxe 2.5D |
| 8 | Morador no quarto e segredo | Casa › quarto de hóspede | RPG Maker/VN |
| 9 | Vínculos › Constelação | app Vínculos / ☰ na Casa | interface do DEVO, 2.5D (R3F) |
| 10 | Vínculos › Lista de cartões | idem | interface do DEVO |
| 11 | Ficha do NPC (Vínculo, Gostos, Lembranças, Registro) | idem | interface do DEVO, carta de Arcano 2.5D |
| 12 | Marcar/desmarcar paixão | ficha | interface do DEVO |
| 13 | Cut-in de rank | visita ou Vínculos | interface do DEVO |
| 14 | Loja de decorações com medalhões de gosto | PENDENTE 15 | interface do DEVO |
| 15 | Mesa › Vínculos | Mesa | interface do DEVO |

Caminhos:
- Casa › porta → 1 → 2 → (3) → 4 → "Ver em Vínculos" → 11.
- Fora da Casa: notificação "Alguém bateu na sua porta" (se V18) → abre a Casa na Sala.
- Vínculos › cartão → 11 → "Convidar para morar" → Casa › cena de convite.
- Lembranças → CG em visor → "Rever a cena" (sem efeito).

---

## 10. Anti-abuso

1. **Recarregar para trocar o Visitante.** O sorteio é por período, com semente do servidor, e grava a decisão em
   `visitas` (índice único por período para `origem = 'sorteio'`), **inclusive quando não há visita**
   (`sem_visita`). Recarregar devolve a mesma decisão.
2. **Decorar ou marcar paixão para pescar.** O perfil de decoração só vale `X` minutos depois de mudar
   (`casa_perfil`), e o `fator_decoracao` tem teto. Como toda decisão de período fica gravada, mudar a decoração
   ou a paixão no meio do período não refaz o sorteio daquele período, mesmo se ele deu "sem visita".
3. **Repetir a visita para ganhar de novo.** Efeitos valem uma vez por instância (`visita_eventos`); cenas de
   história com `efeito_unico` não dão nada na segunda vez; teto diário de Essência do vínculo por NPC.
4. **Presente em massa.** Limite por visita e por semana; presente consome o item na mesma transação; `idem`
   evita duplo envio.
5. **Abrir duas abas na mesma visita.** `visita.iniciar` muda o status com `FOR UPDATE`; a segunda aba recebe 409
   e passa a só ler. O sorteio com recuperação roda sob `pg_advisory_xact_lock` por jogador, e duas abas abrindo
   a Casa ao mesmo tempo não sorteiam o mesmo período duas vezes.
6. **Cliente mandando o efeito.** O cliente manda só "escolhi a opção N"; o servidor lê o efeito na cena. O
   cliente não recebe os números de afinidade (V17), então nem vê o que otimizar.
7. **Fugir da ameaça.** O prazo nasce no `GET /api/casa` que a entrega, sem depender de ação do cliente; sair da
   página não para o relógio (`prazo_ameaca` no servidor). Ficar na Casa sem tocar em nada também não para.
   Ameaça sorteada na ausência segue `ao_expirar`. Os atalhos da Casa levam primeiro a ela.
8. **Adivinhar o esconderijo seguro.** O número `u` é sorteado na chegada e guardado no servidor; o cliente só
   recebe o resultado depois do `visita.esconder`. Trocar de esconderijo não re-rola, porque o `u` é um só. O
   jogador vê o risco aproximado (olho de 3 estados), não o `u`. "A ameaça aprende" pune repetir o mesmo lugar.
9. **Marcar e desmarcar paixão para ganhar chance de visita.** Espera de `X` dias ao desmarcar; limite de paixões
   `X` (PENDENTE 7); o fator de paixão vale só para visitas que não são `ameaca`.
9b. **Chamar todo período.** O "chamar" (V21) tem custo, um NPC por vez e só aumenta o peso; não garante visita.
9c. **Mentir a idade.** A idade é declarada; mudar a idade do perfil depois do prólogo segue a regra de trocas do
    perfil que já existe no save. Se isso basta é a PENDENTE 22.
10. **Rank de ida e volta para receber prêmio duas vezes.** PK `(player, npc, trilha, marco)` em
    `vinculo_premios`: prêmio sai uma vez por marco, mesmo que o rank caia e volte.
11. **Morador para farmar presente e conversa todo dia.** Os mesmos tetos de 3.3-d e 3.5-c valem para morador;
    recompensas secretas têm `idem` por período.
12. **Contas alternativas.** Vínculo e presentes não se trocam entre jogadores. Presentes podem ir para a Sala de
    Trocas ou o Salão só se o dono quiser (PENDENTE 18); se forem, entram nas mesmas travas de contas novas da
    `SPEC-ORDEM.md` §3.3.
13. **Consequência de ameaça durante Deadly Vote.** Bloqueada por `limites.sem_dv_ativo`; nada tira carta.
14. **Equipe.** Todo ajuste, desfazer, visita forçada e leitura de vínculo de outro jogador vai para o
    `admin_log` com nota. Dealer não mexe em vínculos.

---

## 11. Pendências do dono

1. **Essências de Afinidade**: o vínculo é um contador próprio que também gera o item de Essência (opção A,
   V1), é alimentado dando Essências ao NPC (B) ou é outra coisa? Se A, qual a razão contador → item.
2. **Elenco**: quais NPCs são Visitantes, quais são romanceáveis (e confirmação de que são adultos), quais aceitam
   morar, quais podem vir como ameaça e de que lado estão (`companhia`, `necro`, `neutro`). Como a Melissa visita
   (holograma, 3.11), se recebe presente e qual a moeda de afinidade dela; quando o Corvo é revelado.
3. **Níveis**: quantos ranks de afinidade e de romance, o mínimo de cada um e a folga antes de cair.
4. **Frequência**: tamanho do período, chance de visita, aumento por período vazio, máximo por dia, janela de
   validade, a cada quantas visitas vem um desconhecido e quantos períodos se recuperam quando o jogador volta
   (V25).
5. **Pontos por origem**: quanto vale atender, cada grau de presente, cada raridade, favor cumprido; teto diário.
6. **Decoração**: gostos de decoração de cada NPC (tags e pesos) e os limites mínimo e máximo do fator.
7. **Paixão**: quantas ao mesmo tempo (V10 propõe uma; o dono não limitou), o fator de chance e a espera ao
   desmarcar.
8. **Queda de rank**: se cair fecha alguma coisa (convite de morador, funções) além de baixar o numeral.
9. **Presentes**: lista de presentes, gostos de cada NPC, limite por semana, se há aniversários.
10. **Caos e Ordem**: como a faixa muda a chance de ameaça e o comportamento de cada lado, e se resolver ou
    subornar uma ameaça dá honra ou necro ("essa parte ainda está em construção").
11. **Hostilidade**: se existem figuras só de ameaça (V11) e quem são, outros gatilhos além de caos e ordem,
    tempo para se esconder, máximo por semana, chance-base de ser achado, "a ameaça aprende" (V12), se o risco
    fica à vista, consequências e o `ao_expirar` (esta spec sugere `espera_na_porta`).
12. **Morar**: rank mínimo para o convite e condições por NPC.
13. **Morador**: recompensas secretas e funções exclusivas de cada um (os exemplos de 3.10 são sugestões).
14. **Saída do morador**: custo do despejo e se ele sai sozinho quando o vínculo cai.
15. **Loja de decorações**: onde fica e com que moeda (repete a PENDENTE 5 da Casa).
16. **Encontros**: só na Casa ou também em outros cenários; lista de encontros e CGs por NPC.
17. **Arcano de cada NPC** no cartão de Confidente (o Galo já é do Imperador).
18. **Poço e trocas**: peso da categoria `presente` no Poço e se presentes podem ser trocados ou leiloados.
19. **Prêmios por rank**: o que cada rank entrega (o dono citou Chaves de Torres, Pacotes de Cartas, Dracmas
    "e muitos outros").
20. **Roteiros**: falas de cada tipo de visita por NPC, frases de comentário sobre a casa, falas de presente. A
    spec não escreve nenhuma; tudo entra literal do dono ou de narrativa aprovada.
21. **Aprovar ou recusar as propostas**: V1–V25.
22. **Idade do jogador para romance**: confirmar a trava (romance, encontros e CGs só com 18 anos ou mais
    declarados), se a idade declarada no prólogo basta e o que fazer com quem não declarou.
23. **Chamar um NPC** (V21): se existe, quanto custa e em que moeda.
24. **Cenas de rank**: falas de cada subida de rank por NPC (V19). Sem elas, a cena genérica curta.

---

## 12. Propostas desta spec (lista para responder)

| Nº | Proposta | Seção |
|---|---|---|
| V1 | Essência do vínculo separada do item; o item nasce do vínculo | 2.6, 3.3 |
| V2 | Só conhecidos são sorteados, mais uma vaga periódica de apresentação | 3.1-b |
| V3 | Visitas por período, agendadas, com chance crescente sem visita | 3.1-d |
| V4 | Cartão de visita na porta quando a visita é perdida, sem penalidade no vínculo | 3.1-e |
| V5 | Fórmula única de peso | 3.2 |
| V6 | Ranks em numeral romano (o único numeral do cartão) com histerese na queda | 3.3-b, 5.2 |
| V7 | Opções de romance marcadas com losango | 3.4 |
| V8 | Um presente por visita e `X` por semana (configuração `null` até aprovar) | 3.5-c |
| V9 | Presente só em cena (visita ou morador) | 3.5-f |
| V10 | Uma paixão por vez (o dono não limitou; é só sugestão) | 3.6 |
| V11 | Gatilhos de ameaça além de caos e ordem; figuras só de ameaça | 3.9-a |
| V12 | A ameaça aprende o esconderijo, com risco à vista | 3.9-d |
| V13 | Primeira ameaça guiada e primeira busca nunca acha | 3.9-g |
| V14 | Desconhecidos como pontos apagados | 2.5, 5.1 |
| V15 | Constelação em 2.5D na abertura de Vínculos | 5.1 |
| V16 | Opção "mais tempo" no cronômetro da ameaça | 6.5 |
| V17 | Cliente não recebe os números do vínculo | 7.4 |
| V18 | Sorteio também ao abrir Vínculos, com aviso fora da Casa | 7.4 |
| V19 | Rank pronto e subida numa cena da próxima visita | 3.3-b, 5.5 |
| V20 | Barra de sombra antes de um NPC virar ameaça (ref-08) | 3.9-g, 4.6 |
| V21 | Chamar um NPC pelo Mensagens | 3.12 |
| V22 | Visão de equipe em Vínculos para Owner/Anfitrião | 3.13 |
| V23 | Romance pode cair; congela em ameaça; morador não vira ameaça | 3.7, 3.9-i |
| V24 | Rank 0 = conhecido sem vínculo | 3.3-b |
| V25 | Recuperação de até `X` períodos ao voltar | 3.1-d |

---

## 13. Decisões de revisão (rodada 1, 01/11/2026)

Crítica recebida com nota 6.5 e 28 problemas. O que mudou, em resumo: cor de assinatura por NPC; um numeral só no
cartão; exceções da ficha no estado de ameaça; tabela de reconciliação (8.1); custo de arte assumido (6.4, 7.6);
modelo de tempo com toda decisão gravada e recuperação de períodos (3.1-d); índice único só para o sorteio, fuso
definido; ameaça decidida no servidor com `u` único; fileira de esconderijos no celular; orçamento de altura e
visita como cena roteirizada; cartão de 2 linhas; regras de 2.5D; paixão separada do romance; leitura C neutra;
valores zerados na configuração; trava de idade do jogador; casos da Melissa, do Corvo, do Galo e do Herdeiro;
renomeação para `ameaca`; visão de equipe; romance fechado; ref-08 relida; agência (chamar) e rank com cena.
`npcs/galo.md` §8 foi corrigido para não pôr o numeral do Arcano no cartão, e as fichas com cartão de lista (todas menos a da Coruja, que usa cartão vertical) passaram para 120 px.

Onde esta revisão discorda, no todo ou em parte:

1. **Altura do cartão: 120 px, não 96.** A crítica lembra que a `REFERENCIAS.md` §2.5 pedia 96 px. Com a pose
   saindo pelo topo, 96 px deixa a figura do tamanho de um ícone e a silhueta, que é o motivo do redesenho
   Persona, se perde. Ficou 120 px com o teste em captura de 390 px como condição, nos dois sentidos.
2. **Variação por tipo no cut-in continua.** A faixa passa a ser sempre da cor do NPC, como as fichas pedem, mas o
   veio de mármore da `intriga` e as pétalas do `encontro` ficam por cima. São detalhes, não troca de cor, e
   ajudam o jogador a saber o tom da visita antes da primeira fala.
3. **Deslizar entre abas não foi removido.** Virou secundário: a barra de segmentos é o controle principal e o
   deslizar só vale no meio da tela, nunca a partir da borda. Tirar de vez cortaria um gesto que o jogador de
   celular espera.
4. **V9 (presente só em cena) foi mantida**, mesmo com a crítica de agência fraca. O presente como gesto na cena é
   o que dá peso à reação do retrato. A agência entrou por outro caminho: chamar o NPC (V21) e o rank pronto à
   vista. Ir até o NPC fora da Casa, como no Stardew, ficou só como ideia para o dono (3.12), porque ele não
   pediu e mudaria o papel da Casa.
5. **Leitura A segue como hipótese de trabalho** em 2.6. A tabela agora é neutra e mostra a favor e contra de A,
   B e C, mas a spec precisa de uma base para escrever o resto. Ficou dito o que muda se o dono escolher B ou C.
6. **Ameaça na ausência não foi tirada.** A crítica deu três saídas (gravar toda decisão, recuperar períodos ou
   tirar janela e `ao_expirar`). Esta revisão usou as duas primeiras juntas, mas sugere `espera_na_porta` como
   padrão do `ao_expirar`, para não punir quem não estava jogando. A punição fora do jogo fica como opção do
   dono, não como padrão.
7. **Rubi continua como padrão do olho em ameaça.** As fichas mandam nos próprios personagens (Galo e Corvo têm
   exceção), mas o NPC sem exceção precisa de um padrão, e o rubi é a cor de alerta da identidade.
8. **A luz da batida de ameaça fica azul fria**, contra a "luz vermelha" da `SPEC-CASA.md`. O vermelho chapado na
   tela inteira é a marca do P5 que a direção manda não copiar, e gastaria o rubi, que só funciona como alerta se
   for raro.
9. **A trava de idade do jogador fica, mesmo sem pedido do dono.** É segurança de conteúdo num site público, não
   regra de jogo. A paixão e a chance de visita continuam livres; só romance, encontros e CGs dependem dela. Se o
   dono quiser outro critério, é a PENDENTE 22.
10. **"Chamar" é proposta, não regra.** O dono escreveu "de tempos em tempos", e chamar não força visita: só aumenta
    o peso no período seguinte. Se ele recusar a V21, o resto da spec não muda.

