# SPEC — Casa: cômodos, níveis e skins (DEVO v2)

Especificação do sistema da Casa no DEVO v2 (jogo no estilo RPG Maker dentro do site).
Base: pedido do dono em `PEDIDO-V2-dono.md` (31/10/2026), texto da Confecção e dos Pacotes em
`../CASA-CONFECCAO-dono.md` (22/10/2026), código atual (`lib/devo/casa-server.ts`, `lib/devo/confeccao.ts`,
`lib/devo/pacotes.ts`, `lib/devo/shuffler.ts`, `components/devo/casa/*`, `scripts/casa-migration.sql`), a
`SPEC-TUTORIAL-E-EQUIPE.md` (ordem de entrada do novato) e as referências `refs/ref-01..08.jpg`.

Revisão 1 (31/10/2026): aplicada a crítica da rodada de revisão. O que mudou e onde houve discordância está em
"Decisões de revisão", no fim.

> **Harmonização de 01/11 (noite).** Esta spec é anterior à correção do dono ("não gostei. o devo em geral deve ter
> a vibe antiga, não em pixel. mas a casa e torres rpg maker/visual novel."). Cômodos, objetos, estados, níveis,
> skins, decoração, Confecção, Pacotes e banco continuam valendo. O que mudou (texto do dono → `BIBLIA.md` → spec
> dona do assunto):
> 1. **Técnica.** Cenário pintado em alta definição, em camadas com profundidade (`MOTOR-CASA-TORRES.md` §0–1). Onde
>    abaixo se lê pixel, tile, tileset, grade de tiles, "menu pixel" ou "painel em pixel", leia: pintura do cômodo,
>    chão andável em polígono (malha de navegação no app), oclusores, primeiro plano, e por cima a interface gótica
>    do DEVO. Fonte pixel não existe. Pacotes CC0/CC-BY de tiles deixam de ser a base da arte.
> 2. **Escala.** P12 (tile de 32 px, personagem 32×48) sai. Vale a `SPEC-AVATAR.md` §2.3: avatar pintado de corpo
>    inteiro, 1,70 m na régua do `npcs/ELENCO.md` §2, escala pela profundidade.
> 3. **Ordem de entrada e trava.** P14, PENDENTE 19 e o estado `so_quarto` saem. Vale a D-1
>    (`SPEC-TUTORIAL-E-EQUIPE.md` §2.8): a Casa inteira fica trancada até `galo_casa`; a criação do avatar acontece
>    na primeira entrada, depois da vitória; a cena do Galo entrega as chaves. A placa "Vença o Deadly Vote do
>    tutorial…" sai (não era texto do dono). O estado `trancada` da porta continua só para Owner/Anfitrião verem.
> 4. **Não existe cidade.** "Mapa da cidade → porta da casa" vira "ícone da Casa no celular → porta"; sair da Casa é
>    voltar ao celular (`BIBLIA.md` §2). A loja de decorações não pode ficar "na cidade" (PENDENTE 5 fica entre Poço
>    e aba da Casa).
> 5. **Avatar e foto.** Saem `casas.avatar`, o kind `avatar_parte` e `avatar.salvar`; valem `aparencias`,
>    `aparencia_parte` e `/api/aparencia` (`SPEC-AVATAR.md` §0 e §9). O objeto Espelho abre `'aparencia'`. A foto
>    continua em `players.avatar`.
> 6. **Visitas, aviso na porta, carregando e menu.** Vale a tabela da `SPEC-VISITANTES.md` §8.1 (ações de visita,
>    tipo `ameaca`, `visitas.regras`, luz azul fria na ameaça, selo e faixa "[Um Visitante apareceu]" no lugar do
>    balão "!"). A tela dos NPCs conhecidos se chama **Vínculos**.
> 7. **Projeção** (P1, P2). `topdown` e `iso` saem. Cada cômodo é uma pintura em perspectiva de três-quartos, como
>    `arte/v2-casa-noite.webp`. A Vista da Casa passa a ser o diorama em R3F (`BIBLIA.md` §8, ref-13), depois do motor.
> 8. **Decorar.** Numa pintura não há grade livre. **Proposta padrão:** cada cômodo tem **pontos de encaixe**
>    desenhados (parede, chão, mesa, teto, janela), cada um com tamanho e estilo aceitos; a decoração é pintada no
>    mesmo estilo e com a luz do cômodo. Arrastar, girar e a gaveta do modo Decorar continuam, só que o item encaixa
>    no ponto mais próximo. Decisão do dono no `LEIA-PRIMEIRO.md`.
> 9. **Nomes.** O objeto de rito que substitui o Card Shuffler é da `SPEC-RITOS.md` (nome de trabalho Retábulo);
>    "Oficina" é o cômodo; "Mesa de Confecção" é o objeto.

Convenções deste documento:
- Trechos entre aspas e em bloco de citação são **texto literal do dono**, tirados da parte do `PEDIDO-V2-dono.md`
  abaixo da linha `---` ou do `CASA-CONFECCAO-dono.md`. Não reescrever. O resumo "Decisões tomadas na conversa"
  no topo do PEDIDO foi escrito pelo agente e **não** é citado entre aspas aqui.
- **PENDENTE n** marca o que só o dono decide. Números que o dono deixou como "x"/"X", ou que não deu, ficam
  como `X` no texto e como `null` + `provisional = true` no banco. Nada aqui é valor final.
- **PROPOSTA Pn** marca uma regra que esta spec sugere e o dono ainda não aprovou. Tudo que não é citação nem
  PENDENTE, nas seções 2.2 em diante, é proposta, mas as que mudam regra de jogo levam número para o dono poder
  responder "aprovo P3, não aprovo P7".
- "Cômodo" = um mapa jogável. "Objeto" = algo no mapa que abre um sistema. "Decoração" = item que o jogador põe
  na grade.

---

## 1. Objetivo para o jogador

A casa é o lugar do Record. É onde ele cria a aparência do avatar, anda pelos cômodos e encontra, em forma de
objeto, o que hoje fica em abas: fabricar cartas, abrir pacotes, decorar, receber Visitantes e, mais tarde,
hospedá-los.

Para o jogador, a casa precisa responder a três vontades:
1. **"Quero fazer minhas coisas"**: cada sistema tem um objeto na casa que ele alcança andando (a mesa de
   confecção, o baú de pacotes). Andar até o objeto é o caminho bonito, nunca o único: tudo continua alcançável
   pelo menu global e pelas notificações, como no site atual (ver 2.2-k).
2. **"Quero que seja minha"**: decorar com móveis e enfeites em qualquer cômodo, trocar a skin, abrir cômodos novos.
3. **"Quero que alguém apareça"**: a decoração muda quem bate na porta; um vínculo forte pode virar morador.

O dono, sobre a evolução da casa:

> "sobre a casa, quero que eventualmente a pessoa possa alterar a skin dela e mais cômodos, como uma melhoria
> basicamente ao subir de nível (ainda estamos discutindo essa parte, mas já deixe estruturado..)"

O dono não diz **de que** nível fala (da casa, da conta, de uma Virtude, de um Arcano). Isso é a PENDENTE 0. Esta
spec entrega a estrutura de cômodos e skins presa a "um nível" sem escolher qual, e mostra as duas opções de
dados em 5.1.

---

## 2. Regras

### 2.1 Regras definidas pelo dono (literais)

**Entrada e avatar.**

> "ao entrar nesse sistema de casa, há um tutorial de "fantasia" que é então a criação do avatar, com opções de
> penteado, pele, olhos, cor, roupas, etc. quero inspirado em animes."

**Evolução da casa.** Citação na seção 1: skin e cômodos novos como melhoria "ao subir de nível", ainda em
discussão. Nível de quê: PENDENTE 0.

**Card Shuffler.**

> "o card shuffler passa a ser outro objeto, agora que existe a questão do rito e tudo mais.."

O dono não disse qual objeto, nem onde ele fica. Ver 2.2-b e PENDENTE 7.

**Vínculos** (texto do dono, sistema de Visitantes):

> [Os NPCs com os quais você desenvolve relacionamentos ficam registrados no sistema, permitindo que seu vínculo
> seja consultado posteriormente.]

> "também terá uma segunda tela onde possui os npcs já conhecidos, e você pode marcar ele com "paixão", isso faz
> ter mais chances dele aparecer e então você desbloqueia uma segunda barra com romance (além da de afinidade)."

**Decorações.**

> [A loja de decorações oferece móveis e enfeites capazes de aumentar as chances de um NPC específico aparecer na
> sua casa.]
>
> [Cada NPC possui preferências próprias quanto à decoração. Por isso, alguns itens podem aumentar a probabilidade
> de certos Visitantes aparecerem, mas também reduzir as chances de atrair outros.]

**Presentes** (origem):

> [Você pode adquirir esses presentes no Poço dos Milagres ou durante eventos.]

**Visitantes na casa.**

> [De tempos em tempos, eles poderão aparecer na sua casa em busca de conversas fiadas, favores ou até mesmo
> intrigas.]

**Hostilidade.**

> [Quando um NPC hostil aparecer, você deverá encontrar um esconderijo o mais rápido possível ou descobrir alguma
> maneira de lidar com a ameaça.]
>
> [Algumas decorações específicas podem reduzir as chances de Visitantes hostis aparecerem na sua casa.]

**Quartos de Hóspedes.**

> [Quando sua afinidade com determinado NPC atingir um nível suficientemente alto, você poderá convidá-lo para
> morar na sua casa por tempo indeterminado.]
>
> [Ter um Visitante como morador pode render recompensas secretas e desbloquear o acesso exclusivo a determinadas
> funções.]
>
> [Entretanto, nem todos os Visitantes aceitam esse tipo de convite. Portanto, se você pretende construir esse
> vínculo com um personagem específico, certifique-se de que ele permite essa possibilidade antes de investir seu
> tempo nessa relação.]

**Owner.**

> "que um owner possa desfazer a ação de alguém ter enviado recompensa, etc."

**Confecção e Pacotes** continuam valendo como estão em `../CASA-CONFECCAO-dono.md` (fabricação por raridade,
tabela de chance por nível da mesa, combinações exatas, Livro de Receitas da Corporação, histórico, Pacote Raro:
Coleção de Xadrez). O nível da **mesa** é separado de qualquer nível da casa.

**Estilo.** *(Harmonizado em 01/11.)* Texto do dono de 01/11: "a casa e torres rpg maker/visual novel" e
"não em pixel" para o resto. A técnica escolhida é cenário pintado em camadas (`MOTOR-CASA-TORRES.md`). O resumo
antigo de 31/10 (pixel art em mapa, casa e menus) foi substituído pela correção do dono. A frase "casas em 2D, isométricas quando o caso pedir" vem do
enunciado da tarefa, também não literal. Ambas ficam como direção registrada, sujeitas a confirmação na PENDENTE 3.

### 2.2 Regras propostas por esta spec (para o dono aprovar)

a) **Projeção.** Os cômodos jogáveis são `topdown` (vista 3/4 clássica de RPG Maker): é onde se anda e se decora
   com toque preciso, e é o que a arte de licença aberta (CC0/CC-BY) oferece em quantidade. O motor aceita `iso`
   por cômodo, mas a v1 não usa (**PROPOSTA P1**).
   - `ref-04` e `ref-05` são ilustrações isométricas de alto detalhe, não pixel art. Servem como referência de
     **clima e paleta** (dourado e marfim, lilás e rosa, flores, molduras, velas), não de técnica.
   - A **Vista da Casa** (navegação entre cômodos) é um corte esquemático simples: blocos de cômodo com nome,
     ícone e skin aplicada, sem a decoração real (**PROPOSTA P2**). Mostrar a decoração real em iso exigiria um
     sprite iso de cada item além do topdown, e uma versão iso de cada skin × cômodo × nível; ou se dobra a arte,
     ou a Vista mostra uma casa que não é a do jogador. O custo está em 7, Técnicos 2.
   - Quarto de Hóspedes em iso fica fora da v1. Pode voltar como CG (ilustração) do morador, que já é arte de
     ilustração e não precisa de grade.

b) **Cômodos iniciais e objetos** (o que existe no começo, para nenhuma função atual se perder):

   | Cômodo | Objeto | Abre | Origem no site atual | Status |
   |---|---|---|---|---|
   | Sala | Porta de entrada | Visitantes (atender, recusar) e saída para o mapa | novo | proposta |
   | Sala | Quadro de visitas | **atalho** para ☰ › Vínculos (a tela fica no menu global, ver 2.2-l) | novo | proposta |
   | Quarto | Espelho | Editor do avatar (reabre a criação) | novo | **P3** |
   | Quarto | Guarda-roupa | Esconderijo (só isso) | novo | **P3** |
   | Quarto | Cama | Cena de descanso e esconderijo (ver 2.2-f) | novo | proposta |
   | Oficina | Mesa de Confecção | Confecção de Cartas (fabricar, andamento, aprimorar mesa) | aba Confecção | proposta |
   | Oficina | Livro na estante | Livro de Receitas + Histórico | abas Livro e Histórico | proposta |
   | Oficina | Baú de pacotes | Pacotes (abrir, centro de informações) | aba Pacotes | proposta |
   | Qualquer | Botão Decorar (HUD) | Modo decoração do cômodo atual | novo | proposta |

   **P3**: espelho e guarda-roupa são objetos diferentes. Um só objeto com dois papéis deixaria ambíguo o toque
   durante um hostil (abre o editor ou esconde?).

   **Card Shuffler.** Esta spec **não** põe o Shuffler na casa. Pelo manual do dono, os Ritos de Invocação
   (gestos, cânticos, Recuo) acontecem quando a carta é usada no Deadly Vote, então um altar doméstico pode não
   ter função de jogo. O Shuffler segue onde está hoje (Salão e painel do deck) com o visual novo, até o dono
   responder a PENDENTE 7. Uma opção para a casa, se o dono quiser: um **lugar de treino do rito** (estante ou
   mesa de estudo) que mostra o repertório de gestos e os cânticos de cada coleção com o marca-texto por
   raridade que o dono descreve. É só consulta e prática, sem embaralhar nem sincronizar (**PROPOSTA P4**). O
   nome do objeto fica para o dono.

   Sala, Oficina e Quarto podem ser um só mapa na casa inicial e se separar depois. PENDENTE 4.

c) **Progressões, sem misturar:**
   - **O nível que libera cômodos e skins**: qual é, PENDENTE 0. Opção A: nível próprio da casa (novo). Opção B:
     um nível que já existe (Record/conta, uma Virtude, um Arcano), lido pelo servidor sem tabela nova.
   - **Nível da mesa de confecção** (1..6): chance e espaços de fabricação. Já existe (`confeccao_mesas`); continua
     sendo aprimorado na própria mesa.
   - **Afinidade com NPCs**: libera convites para morar. Vem do sistema de Visitantes (spec própria).

d) **Como o nível sobe** (só se a PENDENTE 0 escolher a opção A). Estrutura pronta para qualquer combinação de
   requisitos, todos PENDENTES (PENDENTE 1): pagar Tempo, Dracmas, itens (`item_defs`), pontos ganhos com uso,
   afinidade somada, ou aprovação de Anfitrião. O servidor só lê a lista de requisitos do `devo_config` e confere
   cada um. Na opção B, `casa.niveis` vira uma tabela "nível X da conta/Virtude libera Y" e não há cobrança.

e) **Skins.** Skin é um tema visual do cômodo inteiro (tileset de piso, parede, janelas, iluminação) ou da
   fachada. Não mexe na decoração colocada: a grade e os itens continuam onde estão. Uma skin é um item
   (`item_defs.kind = 'casa_skin'`, não empilhável). Fontes possíveis: nível, Poço, evento, Owner (PENDENTE 6).
   Cada cômodo pode ter skin própria ou herdar a da casa. Custo de arte: cada skin precisa de um tileset por
   cômodo que ela cobre; por isso a proposta é começar com skins da casa inteira e poucos cômodos.

f) **Cama.** Proposta: cena curta de descanso (sem efeito de jogo) e esconderijo durante um hostil. Qualquer efeito
   (Tempo, sonho, diário, "fechar o dia") só existe se o dono decidir (PENDENTE 9).

g) **Grade de decoração.**
   - Escala: ver 2.2-m. A grade é a do próprio mapa.
   - Cada decoração tem `pegada` (largura × altura em tiles), `camada` (`chao`, `parede`, `sobre` para coisas em
     cima de mesas), se bloqueia passagem e quantas rotações tem (`meta.rotacoes` = 1, 2 ou 4).
   - Pode decorar **qualquer** cômodo liberado.
   - Não pode cobrir objeto de sistema, porta, nem fechar o caminho entre a porta e qualquer objeto (o servidor
     roda um teste de caminho).
   - Rotação: `rot` aceito só em `0..rotacoes-1`; com `rot` ímpar, a pegada troca largura por altura. O servidor
     confere a pegada girada contra todas as peças da mesma camada (ver 5.1, nota de integridade).
   - Limite de itens por cômodo vem do nível (`decoracao_max`, PENDENTE 1).
   - Um item colocado sai do "disponível" do inventário, mas continua sendo do jogador (não é consumido).
   - Guardar tudo de volta é sempre possível com um toque.
   - Item de decoração **não** pode ser dado como presente a NPC nem trocado enquanto estiver colocado: para dar ou
     trocar, o jogador guarda primeiro (**PROPOSTA P5**). Se presentes e decoração forem itens diferentes, a regra
     só vale para troca entre jogadores. Ver PENDENTE 18.

h) **Visitantes e decoração (ligação com a spec de Visitantes).** A casa fornece ao sorteio de Visitantes o
   **perfil de decoração** da casa inteira e a lista de esconderijos. Proposta de soma (**PROPOSTA P6**), para o
   sorteio não ter fontes soltas:

   ```
   peso(NPC) = base(NPC)
             × fator_decoracao(perfil da casa, gostos do NPC)   -- pode ser < 1 (o dono: "reduzir as chances")
             × fator_paixao(NPC marcado com "paixão")           -- o dono: "mais chances dele aparecer"
             × fator_karma(honra/necro, NPC hostil ou não)      -- PENDENTE 11, sistema "em construção"
   ```

   Todos os fatores são `X` no config. O perfil soma as tags de todos os cômodos; a proposta é a Sala pesar mais
   que os outros (`peso_comodo` no config, `X`), porque é onde o Visitante entra. Decorar qualquer cômodo conta.

   **Modelo de tempo** (**PROPOSTA P7**, base do sistema, segue Animal Crossing e Stardew):
   - O servidor sorteia visitas por período (semente por jogador e por período) e as deixa **agendadas**, com uma
     janela de validade (`X` horas).
   - Visita comum: acontece na próxima vez que o jogador entra na casa dentro da janela. Se a janela passar, o NPC
     deixa um bilhete na porta ("passei aqui") e a visita se perde, sem penalidade.
   - Visita hostil: também espera o jogador entrar. Evitar a casa **não** a faz sumir: passada a janela, aplica-se
     a consequência padrão de não se esconder (PENDENTE 11) ou o hostil continua esperando na porta até o jogador
     entrar. Qual das duas, PENDENTE 11.
   - Com hostil pendente, a lista de acessibilidade (3.3) e os atalhos globais (2.2-k) **não** pulam a resposta:
     abrir qualquer objeto da casa por menu leva antes à cena do hostil. Fora da casa o jogador segue livre.
   - Ao chegar, o hostil abre uma contagem curta (`X` s): o jogador anda até um esconderijo (cama, guarda-roupa,
     decoração com `meta.esconderijo = true`) ou escolhe "lidar com a ameaça" (diálogo). Duração e consequências
     PENDENTES (PENDENTE 11).
   - Usar o mesmo esconderijo em visitas seguidas (o hostil "aprende") é **PROPOSTA P8**, a fechar na spec de
     Visitantes.

i) **Quartos de Hóspedes.**
   - Regra do dono: convite só para NPC que aceita morar e com afinidade "suficientemente alta" (`X`, PENDENTE 12).
     A ficha do NPC mostra desde cedo se ele aceita, como o dono pede ("certifique-se de que ele permite essa
     possibilidade").
   - **PROPOSTA P9**: cada morador ocupa um quarto, e os quartos vêm do nível (quantidade PENDENTE 1). Se o dono
     não quiser trava de nível, a casa ganha um quarto quando o convite é aceito.
   - **PROPOSTA P10**: o morador anda pela casa com rotina própria (sprite com estados de 4.1) e o quarto dele tem
     um tema próprio. Se o tema substitui a decoração do jogador naquele quarto, PENDENTE 13.
   - "Recompensas secretas" e "acesso exclusivo a determinadas funções": estrutura de gatilhos por morador
     (`casa.moradia` em config); conteúdo PENDENTE 13.
   - Morador pode sair: por despejo do jogador, por queda de afinidade ou por evento. Regras PENDENTES (PENDENTE 14).

j) **Visitar a casa de outro jogador.** Não foi pedido. Fica preparado, desligado por padrão. PENDENTE 15.
   Owner e Anfitrião sempre podem **ler** qualquer casa, mesmo com `visitavel = false`, para suporte e moderação
   (ver 5.2).

k) **Nada fica preso à casa.** O site atual entrega pacotes e mostra receitas e histórico de qualquer lugar. Para
   o v2 não piorar o acesso:
   - Notificação "pacote recebido" abre a cena de abertura direto, onde o jogador estiver.
   - ☰ (menu global) tem Pacotes, Confecção (andamento e liquidar), Livro de Receitas e Histórico.
   - Na casa, andar até o objeto abre o mesmo painel com a cena do avatar (sentar, abrir o baú): é o caminho
     bonito, não a obrigação.

l) **Vínculos.** A "segunda tela" do dono (NPCs conhecidos, marca "paixão", barras de afinidade e de romance,
   consulta posterior) é uma tela do **menu global**: ☰ › Vínculos (também um app no celular do jogo, como em
   `REFERENCIAS.md` §2.5). O Quadro de visitas na Sala é só um atalho para ela. A ficha de cada NPC mostra as
   **preferências já descobertas** (tags de decoração que ele gosta ou detesta, presentes amados), que o jogador
   descobre por diálogo, por comentário do Visitante sobre a casa ou por dar presente, como a ficha de presentes
   do Stardew (**PROPOSTA P11**).

m) *(Substituída: vale a `SPEC-AVATAR.md` §2.3.)* **Escala e avatar em camadas** (**PROPOSTA P12**). A criação de avatar é "inspirada em animes" com penteado,
   olhos, cor e roupas; num personagem de 16 × 32 px quase nada disso aparece no mapa. Proposta:
   - Tiles de **32 px de arte** (mostrados a 2× no celular = 64 px por tile, 6 colunas em 390 px) e personagem de
     32 × 48 px de arte (maior que o tile, como nos RPG Maker de 48 px).
   - Antes de fechar a escala, um teste: montar 3 penteados, 3 cores de olho e 2 roupas reais no sprite e conferir
     em captura de 390 px se dá para distinguir. Se não der, o detalhe fica no retrato anime (diálogo, Vínculos,
     menu) e o sprite mostra só silhueta do cabelo, cor do cabelo e cor da roupa.
   - Custo: pacotes CC0 de 32 px existem em menor quantidade que os de 16 px; parte da base sai de upscale
     redesenhado ou de geração por IA pós-processada (ver 7, Técnicos 3).

n) **Sinal de atração** (**PROPOSTA P13**). No modo Decorar, um medidor discreto mostra para que lado a casa
   puxa ("mais calma", "mais gótica", "pouco convidativa para hostis"), sem nomes de NPC nem números, e os
   Visitantes comentam a casa no diálogo ("Gostei das velas."). O jogador não decora às cegas.

---

## 3. Fluxo de telas

### 3.1 Celular (primeiro; retrato, referência 390 × 844)

Distribuição da tela no mapa:

```
┌──────────────────────────────┐  0
│ Pulso (Tempo)   ☰ menu  ✎   │  topo 56 px: relógio, menu pixel, Decorar
├──────────────────────────────┤
│                              │
│   MAPA DO CÔMODO             │  área jogável, câmera segue o avatar
│   6 tiles de largura × 64 px │  (32 px de arte × 2, ver 2.2-m)
│                              │
│                    [ ! ]     │  botão de ação aparece perto de objeto
├──────────────────────────────┤
│ caixa de diálogo / painel    │  até 45% da altura, por cima do mapa
└──────────────────────────────┘  844 (respeitar safe-area)
```

1. *(Substituído pela D-1, `SPEC-TUTORIAL-E-EQUIPE.md` §2.8: a Casa só abre depois da vitória no tutorial e a
   criação do avatar acontece na primeira entrada. O texto abaixo fica como histórico.)*
   **Primeira entrada no jogo** (**PROPOSTA P14**, alinhada à `SPEC-TUTORIAL-E-EQUIPE.md` §3.1): a casa é a
   primeira tela do jogo. O novato abre o jogo dentro do Quarto, ainda sem avatar → **Criação do Avatar** (tela
   cheia, menu pixel; retrato anime grande no alto mostrando o resultado, abas penteado / pele / olhos / cor /
   roupas / acessórios). Confirmar → o avatar em pixel aparece no Quarto. Assim a cidade nunca precisa de sprite
   provisório, e a criação fica ligada à casa, como o dono escreveu ("ao entrar nesse sistema de casa").
   - Antes da flag `galo_casa` (vitória no tutorial), só o Quarto está aberto; as outras portas da casa ficam
     trancadas com uma placa ("Vença o Deadly Vote do tutorial para receber as chaves da casa.").
   - Com a flag: a cena do Galo (`lib/devo/dialogo/cenas/galo-casa.ts`) vira a entrega das chaves → Sala e
     Oficina abrem → tutorial curto com o próprio mapa: andar até a mesa e até o baú.
   - A alternativa (cidade primeiro com sprite provisório) está registrada na PENDENTE 19.
2. **Entradas seguintes**: ícone da Casa no celular → a porta abre para dentro (`BIBLIA.md` §2, 600–800 ms) → Sala,
   avatar na porta. Se houver
   visita agendada (2.2-h), ela começa aqui.
3. **Andar**: tocar num tile → caminho calculado (A*) → avatar anda. Tocar num objeto → anda até o tile ao lado e
   interage. Arrastar o dedo mantém a direção (opcional, ligado nas configurações).
4. **Interagir**: painel em pixel sobe de baixo (folha com moldura floral, `ref-02`). O mapa continua visível em
   cima e escurece 30%. Fechar: botão "fechar" ou gesto de voltar do sistema (`useBackHandler`). Tocar no mapa
   **não** fecha o painel (evita fechar sem querer no meio de escolher cartas).
   - Mesa de Confecção → avatar senta → painel com mesa, espaços e "Fabricar". Escolher cartas abre a grade de
     cartas em tela cheia (as cartas continuam na arte de ilustração, não em pixel).
   - Baú → abre o baú → lista de pacotes → abrir pacote tem a cena própria (já existe `pacote-visual.tsx`, refeita
     no estilo novo).
5. **Trocar de cômodo**: andar até uma porta interna; ou ☰ → **Vista da Casa** (corte esquemático, ver 2.2-a) →
   tocar no cômodo. A Vista da Casa também tem "Skins" e, se a PENDENTE 0 der opção A, "Subir nível".
6. **Modo Decorar** (✎ no topo):
   - A câmera para de seguir o avatar. O jogador move a vista com **um dedo arrastando o mapa vazio** e dá zoom
     com **dois dedos** (de 1× a 2× da escala base, sempre inteiro).
   - Arrastando um item perto da borda da área visível, o mapa rola sozinho (auto-rolagem em faixa de 48 px).
   - A grade aparece por cima (linhas 1 px, 25% de opacidade).
   - Gaveta inferior com o inventário de decoração (abas por categoria, contagem disponível). A gaveta abre a
     45% e recolhe a 25% com um toque na alça, deixando mais mapa à mostra.
   - Arrastar item para a grade: o "fantasma" fica verde onde pode, vermelho onde não pode, com o motivo em uma
     linha ("Bloqueia o caminho até a mesa").
   - Tocar num item colocado: girar, mover, guardar.
   - Sinal de atração no canto (2.2-n).
   - "Pronto" envia tudo de uma vez (uma operação em lote, ver 5.2). "Desfazer" local até enviar.
7. **Visitante na porta**: som de batida, a porta pisca, balão "!" sobre ela onde quer que o avatar esteja na casa.
   Atender → diálogo de visual novel (retrato anime). Hostil → ver 2.2-h.

### 3.2 Desktop (depois)

- Mesmo jogo, mapa centralizado em escala inteira (3× = 96 px por tile em telas ≥ 1280 px, ou 2× se o cômodo não
  couber), bordas com moldura.
- Teclado: setas/WASD andam, Enter/Espaço/Z interagem, Esc/X abre o menu, E entra no modo Decorar.
- Mouse: clicar para andar; no modo Decorar, arrastar, roda do mouse para girar, botão do meio ou espaço+arrastar
  para mover a vista.
- Painéis abrem **ao lado** do mapa (coluna direita de 420 px) em vez de por cima, para o jogador ver a casa
  enquanto fabrica ou decora.
- A Vista da Casa fica fixa num canto como minimapa clicável.

### 3.3 Acessibilidade

- Toda interação também existe por lista: ☰ → "Objetos deste cômodo" abre o mesmo painel sem andar. Com Visitante
  hostil pendente, a lista leva antes à cena do hostil (2.2-h).
- Botões de toque com 44 px no mínimo; texto do jogo nunca abaixo de 14 px de altura real.
- "Reduzir movimento" desliga partículas, tremidas e transições longas.

---

## 4. Estados de animação e de interface

### 4.1 Avatar (pintado em camadas, 4 direções; ver `SPEC-AVATAR.md` §4.1, que manda)

| Estado | Quando | Quadros (proposta) |
|---|---|---|
| `parado` | sem ação | 2 (respiração), 4 direções |
| `andando` | movendo | 4, 4 direções |
| `interagindo` | tocou num objeto | 2, estende a mão |
| `sentado` | mesa de confecção aberta | 1 + piscar |
| `deitado` | cama | 1 + sono (Zz) |
| `escondido` | esconderijo durante Visitante hostil | avatar some; o esconderijo treme de leve |
| `assustado` | hostil chegou | 2 + balão "!" |
| `comemorando` | sucesso na confecção, carta rara no pacote | 3 |
| `decepcionado` | falha na confecção | 2 |
| `gesto` | só se a P4 (treino do rito) for aprovada: um gesto do repertório | 1 sequência por gesto |

O avatar é montado em camadas (corpo, pele, olhos, cabelo atrás, roupa, cabelo frente, acessório), com as
mesmas escolhas da criação do avatar, para que trocar roupa não exija desenhar um personagem inteiro. Quanto
dessas camadas aparece no sprite depende do teste de escala (2.2-m).

### 4.2 Objetos

| Objeto | Estados |
|---|---|
| Mesa de Confecção | `vazia` · `trabalhando` (fumaça/brilho por espaço ocupado) · `pronta` (brilho pulsando, há tentativa a liquidar) · `nivel_N` (a mesa muda de aparência a cada nível 1..6) |
| Baú de pacotes | `fechado` · `com_pacotes` (fresta iluminada + contador) · `abrindo` |
| Porta | `fechada` · `batida` (visitante comum) · `batida_hostil` (luz vermelha, tremida) · `aberta` · `bilhete` (visita perdida) · `trancada` (antes da flag) |
| Cama | `feita` · `ocupada` · `esconderijo` |
| Guarda-roupa | `fechado` · `esconderijo` |
| Espelho | `normal` · `brilho` (parte de avatar nova no inventário) |
| Quadro de visitas | `normal` · `novidade` (visitante novo registrado) |
| Decoração | `normal` · `fantasma_ok` · `fantasma_bloqueado` · `selecionada` · `animada` (velas, relógio, plantas ao vento; opcional por item) |

Luz do cômodo: `dia` / `tarde` / `noite` pela hora local do jogador (PENDENTE 10: usar hora real ou do jogo).

### 4.3 Interface

| Estado | O que o jogador vê |
|---|---|
| `carregando` | porta fechada em pixel + "Abrindo a porta…" (texto atual) |
| `sem_avatar` | vai direto para a Criação do Avatar |
| ~~`so_quarto`~~ | *(sai com a D-1: antes da flag `galo_casa` o jogador não entra na Casa; o ícone fica selado no celular)* |
| `jogando` | mapa + HUD |
| `painel` | painel aberto, mapa escurecido |
| `decorando` | grade + gaveta; HUD reduzido a "Pronto" e "Desfazer" |
| `salvando` | ícone de ampulheta em pixel no canto; toques na grade bloqueados |
| `conflito` | "A casa mudou em outro aparelho." → recarregar o layout (ver 5.2, versão) |
| `banco_desatualizado` | 503 `{code:'banco_desatualizado'}` → aviso do Owner, como já é no site |
| `offline` | jogo continua navegável com o último layout; ações que gastam algo ficam desligadas |
| `visitante` | porta piscando + balão; menu mostra "Atender" |
| `hostil` | contagem visível, música muda, menu reduzido a "Esconder" e "Enfrentar" |
| `vendo_como_staff` | Owner/Anfitrião olhando a casa de outro jogador: faixa "Somente leitura · casa de <nome>", sem decorar nem usar objetos |

---

## 5. Modelo de dados e APIs

Tudo em uma migração nova `scripts/casa-v2-migration.sql`, idempotente, seguindo a rotina do `CLAUDE.md`
(entra no `capturas.yml`, `local-db.mjs`, `gerar-banco-novo.sh`). Nenhuma tabela atual é apagada.

### 5.1 Tabelas e colunas

**Kinds de item.** Esta spec **não** reescreve o `item_defs_kind_chk`. Cada spec v2 que reescrevesse a lista
inteira apagaria o kind da outra, e quem ganha seria a ordem no `devo-banco-novo.sql`. Proposta: uma migração
compartilhada `scripts/v2-item-kinds-migration.sql`, rodada antes das outras v2, que troca o CHECK por uma tabela
de kinds com FK. Cada spec só insere os seus:

```sql
-- scripts/v2-item-kinds-migration.sql (compartilhada por todas as specs v2)
CREATE TABLE IF NOT EXISTS item_kinds (kind text PRIMARY KEY, origem text NOT NULL);
INSERT INTO item_kinds (kind, origem) VALUES
  ('moeda','v1'),('essencia','v1'),('chave','v1'),('fragmento','v1'),('capsula','v1'),
  ('cosmetico','v1'),('convite','v1'),('outro','v1'),('pacote','v1')
ON CONFLICT (kind) DO NOTHING;
ALTER TABLE item_defs DROP CONSTRAINT IF EXISTS item_defs_kind_chk;
DO $$ BEGIN
  ALTER TABLE item_defs ADD CONSTRAINT item_defs_kind_fk FOREIGN KEY (kind) REFERENCES item_kinds(kind);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- scripts/casa-v2-migration.sql (só os kinds da Casa)
INSERT INTO item_kinds (kind, origem) VALUES
  ('decoracao','casa-v2'),('casa_skin','casa-v2'),('avatar_parte','casa-v2')
ON CONFLICT (kind) DO NOTHING;
```

Antes de aplicar, conferir no código atual a lista real do CHECK (`scripts/*-migration.sql`) e semear todos os
kinds existentes; o que está acima é a lista de hoje segundo a versão anterior desta spec.

```sql
-- decoracao.meta:  {"pegada":[w,h], "camada":"chao|parede|sobre", "bloqueia":true, "rotacoes":1|2|4,
--                   "tags":["floral","gotico",...], "esconderijo":false, "comodos":["sala",...]|null,
--                   "sprite":"casa/deco/<id>", "animado":false, "licenca":"CC0|CC-BY|propria", "autor":"..."}
-- casa_skin.meta:  {"alvo":"fachada|comodo", "comodos":[...]|null, "tileset":"casa/skins/<id>", "licenca":...}
-- avatar_parte.meta: {"slot":"cabelo|olhos|pele|roupa|acessorio", "sprite":..., "retrato":...}

-- A casa do jogador
CREATE TABLE IF NOT EXISTS casas (
  player_id uuid PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  nivel integer NOT NULL DEFAULT 1 CHECK (nivel >= 1),         -- só na opção A da PENDENTE 0
  pontos integer NOT NULL DEFAULT 0 CHECK (pontos >= 0),       -- só se o dono escolher "pontos de casa" (PENDENTE 1)
  skin_fachada text REFERENCES item_defs(key) ON UPDATE CASCADE ON DELETE SET NULL,
  skin_padrao text REFERENCES item_defs(key) ON UPDATE CASCADE ON DELETE SET NULL,
  avatar jsonb,                                                -- escolhas da criação do avatar (slot → item/cor)
  versao integer NOT NULL DEFAULT 1,                           -- concorrência otimista de tudo que muda a casa
  visitavel boolean NOT NULL DEFAULT false,                    -- PENDENTE 15 (Owner/Anfitrião leem sempre)
  criada_em timestamptz NOT NULL DEFAULT now(),
  atualizada_em timestamptz NOT NULL DEFAULT now()
);

-- Cômodos liberados (o catálogo de cômodos fica em devo_config 'casa.comodos')
CREATE TABLE IF NOT EXISTS casa_comodos (
  player_id uuid NOT NULL REFERENCES casas(player_id) ON DELETE CASCADE,
  comodo text NOT NULL CHECK (comodo ~ '^[a-z0-9_]{2,40}$'),
  skin text REFERENCES item_defs(key) ON UPDATE CASCADE ON DELETE SET NULL,  -- NULL = herda skin_padrao
  liberado_em timestamptz NOT NULL DEFAULT now(),
  origem text NOT NULL DEFAULT 'nivel',                        -- 'nivel' | 'owner' | 'evento' | 'inicial' | 'hospede'
  PRIMARY KEY (player_id, comodo)
);

-- Decoração colocada. Cada linha é uma peça; a posse é conferida contra player_items no servidor.
CREATE TABLE IF NOT EXISTS casa_decoracao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL,
  comodo text NOT NULL,
  item_key text NOT NULL REFERENCES item_defs(key) ON UPDATE CASCADE,
  x smallint NOT NULL CHECK (x >= 0), y smallint NOT NULL CHECK (y >= 0),
  w smallint NOT NULL CHECK (w >= 1), h smallint NOT NULL CHECK (h >= 1),  -- pegada já girada
  rot smallint NOT NULL DEFAULT 0 CHECK (rot IN (0,1,2,3)),
  camada text NOT NULL CHECK (camada IN ('chao','parede','sobre')),
  colocada_em timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (player_id, comodo) REFERENCES casa_comodos(player_id, comodo) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS casa_decoracao_ancora_idx ON casa_decoracao (player_id, comodo, camada, x, y);
CREATE INDEX IF NOT EXISTS casa_decoracao_item_idx ON casa_decoracao (player_id, item_key, colocada_em DESC);

-- Subidas de nível pagas (só na opção A da PENDENTE 0; uma por nível; idempotente)
CREATE TABLE IF NOT EXISTS casa_nivel_log (
  player_id uuid NOT NULL REFERENCES casas(player_id) ON DELETE CASCADE,
  nivel integer NOT NULL,
  pago jsonb NOT NULL,                                         -- o que saiu: {"minutos":..,"itens":{..}}
  em timestamptz NOT NULL DEFAULT now(),
  desfeito_em timestamptz,                                     -- casa.desfazer (Owner)
  PRIMARY KEY (player_id, nivel)
);

-- Moradores (Quartos de Hóspedes)
CREATE TABLE IF NOT EXISTS casa_hospedes (
  player_id uuid NOT NULL REFERENCES casas(player_id) ON DELETE CASCADE,
  npc text NOT NULL,
  comodo text NOT NULL,
  desde timestamptz NOT NULL DEFAULT now(),
  saiu_em timestamptz,
  motivo_saida text,                                           -- 'despejo' | 'afinidade' | 'evento' | 'owner'
  PRIMARY KEY (player_id, npc, desde)
);
CREATE UNIQUE INDEX IF NOT EXISTS casa_hospedes_quarto_idx ON casa_hospedes (player_id, comodo) WHERE saiu_em IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS casa_hospedes_npc_idx ON casa_hospedes (player_id, npc) WHERE saiu_em IS NULL;

-- Perfil de decoração usado pelo sorteio de Visitantes (anti-abuso, ver 7)
CREATE TABLE IF NOT EXISTS casa_perfil (
  player_id uuid PRIMARY KEY REFERENCES casas(player_id) ON DELETE CASCADE,
  tags jsonb NOT NULL DEFAULT '{}'::jsonb,                     -- {"floral":3,"gotico":1,...}
  vale_a_partir_de timestamptz NOT NULL DEFAULT now()
);
```

Notas de integridade:
- **Pegada.** O índice único só impede duas âncoras no mesmo tile. A sobreposição de pegadas (com `w`/`h` já
  trocados quando `rot` é ímpar) é conferida no servidor dentro da transação do lote, com a linha de `casas`
  travada (`FOR UPDATE`), então dois lotes não passam juntos. Gravar `w`/`h` na linha deixa a checagem por SQL
  simples (`x < x2+w2 AND x2 < x+w ...`) e permite um teste de integridade periódico.
- **Rotação.** `rot` fica `0..3` no banco porque o limite depende do item; o servidor recusa `rot >=
  meta.rotacoes` com 400 `{code:'rotacao_invalida'}`.
- **Excedente** (item saiu do inventário com peças colocadas): regra determinística, guardam-se primeiro as peças
  colocadas por último (`colocada_em DESC`). O recálculo acontece **na mesma transação** da baixa em
  `player_items` (função `casa_recalcular_posse(player, item)` chamada por quem dá baixa: troca, presente, Owner),
  que também recalcula `casa_perfil`. Assim o perfil nunca conta um item que já não é do jogador. Com a P5, troca
  e presente nem chegam a tirar item colocado.

Configuração (`devo_config`, todas `provisional = true` até o dono decidir; o Owner edita na Mesa › Casa):

| Chave | Conteúdo |
|---|---|
| `casa.nivel_fonte` | `'casa'` (opção A) ou `{tipo:'conta'|'virtude'|'arcano', chave}` (opção B) — PENDENTE 0 |
| `casa.niveis` | `[{nivel, requisitos:{minutos:null, dracmas:null, itens:{}, pontos:null, aprovacao:false}, libera:{comodos:[], skins:[], decoracao_max:null, quartos_hospedes:null}}]` — todos `null` = PENDENTE; na opção B, `requisitos` é ignorado |
| `casa.comodos` | catálogo: `{id, nome, projecao:'topdown'|'iso', mapa:'casa/<id>.json', tamanho:[w,h], tipo:'comum'|'hospede', inicial:bool, objetos:[...]}` |
| `casa.decoracao` | `{max_ops_por_lote, espera_perfil_min:null, peso_comodo:{sala:null, ...}}` |
| `casa.visitas` | `{janela_horas:null, fatores:{decoracao:null, paixao:null, karma:null}}` (P6, P7) |
| `casa.hostil` | `{segundos_para_esconder:null, ao_expirar:'consequencia'|'espera_na_porta'|null}` (PENDENTE 11) |
| `casa.moradia` | por NPC: `{aceita_morar, afinidade_min:null, recompensas:[], funcoes:[]}` (PENDENTES 12–13) |

Mapas: arquivos estáticos `public/maps/casa/<comodo>.json` no formato do Tiled (camadas de tiles + camada de
objetos com `abre: 'confeccao' | 'pacotes' | 'livro' | 'avatar' | 'vinculos' | 'cama' | 'esconderijo' | 'porta' |
'comodo:<id>'`). O layout do jogador (decoração) fica no banco; o mapa base fica no repositório. Licenças e
autores de cada tileset em `public/maps/LICENSES.md` (CC-BY exige crédito visível: tela "Créditos" no menu).

### 5.2 APIs

Continua tudo em `/api/casa` (mesmo padrão de hoje: `{action}` no POST, erros 401/403/409/503 iguais).

`GET /api/casa` → o `CasaPayload` atual **mais**:

```ts
casa: {
  nivel: number; versao: number; avatar: AvatarEscolhas | null
  skins: { fachada: string | null; padrao: string | null }
  comodos: { id: string; skin: string | null; projecao: 'topdown' | 'iso'; trancado: string | null }[]
  decoracao: { id: string; comodo: string; item: string; x: number; y: number; w: number; h: number; rot: number; camada: string }[]
  disponivel: Record<string, number>        // decoração no inventário menos a colocada
  proximoNivel: { requisitos: ...; libera: ...; provisorio: boolean } | null
  hospedes: { npc: string; comodo: string; desde: string }[]
  visita: { tipo: 'comum' | 'hostil'; npc: string; expira: string } | null   // visita agendada (P7)
  atracao: { rotulos: string[] }            // sinal de atração (P13), sem números
}
```

`GET /api/casa?view=casa&player=<id>` → layout de outra casa. Liberado se `visitavel` (PENDENTE 15) **ou** se quem
pede é Owner/Anfitrião (somente leitura, registra no `admin_log` com `acao = 'casa.ver'`).

POST, ações novas. **Toda ação que muda a casa leva `idem` e `versao`**; `versao` diferente → 409
`{code:'casa_mudou'}`; `idem` repetido devolve a resposta da primeira vez.

| Ação | Corpo | Resposta | Regras |
|---|---|---|---|
| `avatar.salvar` | `{avatar, versao?, idem}` | `{avatar, versao}` | só partes que o jogador possui ou padrão; primeira vez cria a linha em `casas` (sem `versao`) |
| `decoracao.aplicar` | `{versao, ops:[{op:'por'|'mover'|'girar'|'guardar', ...}], idem}` | `{versao, decoracao, disponivel}` | lote atômico; valida posse, limites, pegada girada, rotação, sobreposição, caminho; atualiza `casa_perfil` |
| `decoracao.guardar_tudo` | `{comodo, versao, idem}` | idem | sempre permitido |
| `skin.aplicar` | `{alvo:'fachada'|'padrao'|<comodo>, skin|null, versao, idem}` | `{skins, comodos, versao}` | posse conferida; `null` volta ao padrão |
| `nivel.subir` | `{para, idem}` | `{nivel, liberados, timeDeltaMs}` | só na opção A; só `nivel+1`; confere e cobra os requisitos numa transação; grava `casa_nivel_log`; libera cômodos |
| `hospede.convidar` | `{npc, comodo, versao, idem}` | `{hospedes, versao}` | NPC aceita morar, afinidade ≥ mínimo, quarto livre |
| `hospede.despedir` | `{npc, versao, idem}` | `{hospedes, versao}` | grava saída; efeito na afinidade PENDENTE 14 |
| `visita.responder` | `{visita, resposta:'atender'|'recusar'|'esconder'|'enfrentar', esconderijo?, idem}` | `{resultado}` | só a visita agendada atual; contagem conferida no servidor |

Owner (`config.editar`, como as regras da Confecção): `niveis.salvar`, `comodos.salvar`, `moradia.salvar`,
`visitas.salvar`, e:

| Ação | Corpo | Regras |
|---|---|---|
| `casa.conceder` | `{player, comodo|skin|nivel, motivo, idem}` | vai para o `admin_log` com o estado anterior |
| `casa.desfazer` | `{admin_log_id, motivo}` | reverte um `casa.conceder`, uma subida de nível (`desfeito_em`, devolve o pago pelo `deliverIn`) ou um despejo feito pelo Owner; peças em cômodo removido voltam para guardado; grava outra linha no `admin_log` |
| `casa.despejar` | `{player, npc, motivo, idem}` | tira um morador (`motivo_saida = 'owner'`), para suporte |

As ações atuais (`confeccao.iniciar`, `mesa.aprimorar`, `pacote.abrir`, `regras.salvar`, `receitas.salvar`) ficam
iguais. A cobrança de Tempo reusa `debitar` de `casa-server.ts`.

---

## 6. O que muda em sistemas atuais

| Sistema | Hoje | No v2 |
|---|---|---|
| `CasaApp` (abas Confecção / Pacotes / Livro / Histórico) | abas em tela única | cada aba vira o painel de um objeto do mapa **e** continua no menu global (2.2-k); a lógica (`useCasa`, `agir`, `resgatar`) é reaproveitada |
| `CasaNoite` / `casa-arte.ts` (cena pintada 2:3) | fundo da casa | sai do caminho principal; a pintura pode virar a cena de chegada ou de descanso na cama (PENDENTE 16) |
| Cena `galo-casa` + flag `galo_casa` | cartão "Ir para casa" → cena | D-1: a flag abre a Casa; na primeira entrada vêm a criação do avatar e a cena, que vira a entrega das chaves |
| Card Shuffler (`deck-panel.tsx`, `shuffler.ts`) | widget no painel do deck e no Salão | fica onde está, redesenhado. Que "outro objeto" ele vira e onde: PENDENTE 7 |
| Confecção (`confeccao_*`) | — | sem mudança de regra; a mesa ganha aparência por nível |
| Pacotes (`pacote_aberturas`) | — | sem mudança de regra; abrir também pela notificação e pelo menu |
| Inventário | lista de itens | ganha abas Decoração, Skins e Partes de Avatar (`kind` novos) |
| `item_defs.kind` | CHECK com lista fixa | tabela `item_kinds` compartilhada pelas specs v2 (5.1) |
| Poço / loja | — | a "loja de decorações" do dono precisa de lugar: aba nova no Poço ou loja própria na cidade (PENDENTE 5) |
| Cosméticos (`player_cosmetics`) | molduras, emblemas, balões | não muda; o avatar é uma camada à parte (o retrato anime pode receber a moldura equipada) |
| Recompensas (`deliverIn`) | cartas, itens | aceita decoração e skin como item comum; nada novo no fluxo de aprovação |
| Mesa › Casa (Owner) | regras e receitas da Confecção | + níveis, cômodos, moradia, visitas, conceder, desfazer, ver casa de jogador |
| Owner/Anfitrião | acesso a tudo | entram na própria casa sem a flag e veem todos os cômodos (`devo_tem_desbloqueio`). Sem avatar salvo, recebem um **avatar padrão** e entram direto (podem abrir o Espelho quando quiserem); a linha em `casas` é criada no primeiro GET. Leem a casa de qualquer jogador pelo `view=casa` |

---

## 7. Riscos e anti-abuso

**Abuso**
1. **Trocar a decoração para "pescar" Visitante.** O sorteio usa o `casa_perfil` com `vale_a_partir_de`; mudar a
   decoração só conta depois de `X` minutos (PENDENTE 8). Recarregar a página não refaz o sorteio: a visita é
   sorteada e agendada no servidor com semente por jogador e por período (P7).
2. **Usar o mesmo item duas vezes** (inclusive entre contas). Peças colocadas ≤ quantidade em `player_items`,
   conferido no lote, dentro da transação, com `SELECT ... FOR UPDATE` na linha de `casas`. Item colocado não pode
   ser trocado nem dado (P5); qualquer outra baixa recalcula posse e perfil na mesma transação (5.1, Excedente).
3. **Lote gigante ou repetido.** `max_ops_por_lote`, limite de lotes por minuto por jogador, `idem` e `versao` em
   toda ação que muda a casa.
4. **Fechar o caminho para travar o próprio mapa ou um morador.** Teste de caminho no servidor a cada lote; o
   cliente faz o mesmo antes, só para avisar.
5. **Subir de nível duas vezes com um pagamento.** PK `(player_id, nivel)` em `casa_nivel_log` + só `nivel+1`.
6. **Recompensas de morador repetidas.** Cada recompensa com `idem_key` por `(player, npc, gatilho, período)` e
   entrega pelo `deliverIn`, como os prêmios atuais.
7. **Convidar e despejar em loop** para ganhar recompensa de chegada: recompensa de chegada uma vez por NPC por
   jogador; espera entre despejo e novo convite (PENDENTE 14).
8. **Fugir do hostil evitando a casa ou usando menus.** A visita hostil não expira sem efeito, e a lista de
   acessibilidade e os atalhos não pulam a cena (2.2-h).
9. **Esconderijo repetido** contra hostil: P8, regra fina na spec de Visitantes.
10. **Visitar casas** (se o dono ligar): só leitura, sem nome de conta, sem decoração enviada pelo jogador como
    imagem (só itens do catálogo), bloquear e denunciar.
11. **Staff olhando casa alheia.** Somente leitura e registrada no `admin_log`.

**Técnicos**
1. **Desempenho no celular.** Canvas único por cômodo, atlas de sprites, escala inteira (`image-rendering:
   pixelated`), pausar o laço com `visibilitychange`, no máximo ~150 peças por cômodo.
2. **Custo de arte.** Cada skin × cada cômodo que ela cobre = um tileset. Uma Vista da Casa iso com a decoração
   real exigiria, além disso, um sprite iso de cada item de decoração e uma versão iso de cada skin × cômodo ×
   nível: o dobro da arte da casa. Por isso a Vista é esquemática (P2) e o iso fica fora da v1 (P1).
3. **Mistura de estilos.** Pixel art no mapa e ilustração anime nos retratos: definir paleta e contorno comuns para
   não parecer dois jogos. A geração por IA dos itens únicos precisa sair em pixel (pós-processo de redução de
   paleta e de resolução), ou destoa dos pacotes CC0. As refs isométricas (`ref-04`, `ref-05`) entram só como
   clima e paleta.
4. **Escala do avatar.** Detalhe anime não cabe em sprite pequeno; teste de 3 penteados antes de fechar (P12).
5. **Licenças.** CC-BY exige crédito; OFL só para fontes; nada de arte sem licença clara. Registrar autor e
   licença em `item_defs.meta` e em `public/maps/LICENSES.md`.
6. **Banco desatualizado.** Todas as rotas novas caem no 503 `banco_desatualizado` já usado; a casa abre em modo
   leitura com o mapa base se `casas` não existir.
7. **Migrações v2 em conflito.** Kinds de item numa tabela compartilhada (5.1), não num CHECK reescrito por spec.
8. **Nada se perder.** Antes de trocar a tela, um teste de captura percorre cada objeto e cada atalho do menu
   global e confere que abre o mesmo sistema que a aba atual abria.

---

## 8. Pendências que só o dono decide

0. **Subir de nível de quê?** O dono escreveu que skin e cômodos novos vêm "ao subir de nível". Nível da casa
   (sistema novo, opção A: `casas.nivel`, `casa_nivel_log`, `nivel.subir`), ou um nível que já existe (opção B:
   Record/conta, uma Virtude, um Arcano)? Enquanto não houver resposta, nada de nível é implementado além das
   colunas.
1. **Níveis**: quantos; na opção A, como sobe (Tempo, Dracmas, itens, pontos de uso, afinidade, aprovação de
   Anfitrião, outra coisa) e o custo de cada um (`X`); em qualquer opção, o que cada nível libera (cômodos, skins,
   limite de decoração por cômodo `X`, número de quartos de hóspedes `X`).
2. **Lista de cômodos**: além de Sala, Oficina, Quarto e Quartos de Hóspedes, quais existem (jardim, sótão,
   porão, biblioteca...) e em que nível cada um abre.
3. **Estilo e projeção** *(harmonizado)*: confirmar o cenário pintado em camadas (`MOTOR-CASA-TORRES.md`) e a
   Vista da Casa como diorama R3F depois do motor. A escala segue a `SPEC-AVATAR.md` §2.3.
4. **Casa inicial**: um cômodo só com tudo dentro, ou já são três cômodos pequenos?
5. **Loja de decorações**: onde fica (Poço ou aba da casa; não há cidade), com que moeda e se tem rotação.
6. **Skins**: de onde vêm (nível, Poço, evento, Owner), se são por cômodo ou da casa inteira, se a fachada é
   separada.
7. **Card Shuffler**: qual é o "outro objeto" e onde ele fica. Se o rito só acontece no Deadly Vote, o Shuffler
   continua no Salão e no DV? A casa ganha um lugar de treino do rito (P4) ou nada ligado ao rito?
8. **Tempo de efeito da decoração** sobre o sorteio de Visitantes (`X` minutos depois de mudar).
9. **Cama**: tem efeito de jogo (Tempo, sonho, diário, "fechar o dia") ou é só cena e esconderijo?
10. **Dia e noite** na casa: hora real do jogador, hora do jogo, ou sem ciclo.
11. **Visitante hostil**: janela da visita (`X` h), tempo para se esconder (`X` s), o que acontece se não se
    esconder, o que acontece se o jogador não entrar em casa até a janela fechar (consequência ou espera na
    porta), relação com Karma/honra e necro e com o Recuo Paranormal.
12. **Convite para morar**: afinidade mínima (`X`) e quais NPCs aceitam.
13. **Moradores**: quais "recompensas secretas" e quais "funções exclusivas" cada morador libera; se o tema do
    morador substitui a decoração do jogador no quarto (P10).
14. **Saída do morador**: despejo tem custo na afinidade? Morador sai sozinho se a afinidade cair? Espera para
    convidar de novo (`X`).
15. **Visitar a casa de outro jogador**: liga ou não; se ligar, só olhar ou também deixar presente/recado.
16. **A pintura atual da casa** (`public/images/casa/*`): reaproveitar como cena de chegada/descanso ou aposentar.
17. **Criação do avatar**: lista de opções na estreia (quantos penteados, olhos, roupas), se há partes pagas e se
    o jogador pode refazer o avatar de graça depois.
18. **Decoração e presentes**: item de decoração pode ser presente para NPC, ou presentes (que o dono diz virem do
    Poço e de eventos) são outra categoria? E item de decoração pode ser trocado entre jogadores?
19. **Ordem de entrada**: *(fechada como proposta D-1 na `SPEC-TUTORIAL-E-EQUIPE.md` §2.8; a alternativa é a
    D-1-A.)*
20. **Pesos do sorteio**: aprovar a fórmula decoração × paixão × karma (P6) e os valores (`X`).

---

## 9. Decisões de revisão (rodada 1, 31/10/2026)

Aceitas (com onde mudou):
- Aspas só para texto do dono: "Estilo" saiu das aspas e virou "direção registrada" (2.1); convenção explicitada
  no topo.
- PENDENTE 0 ("subir de nível de quê?"), com opção A (nível da casa) e B (nível existente) em 2.2-c/d, 5.1
  (`casa.nivel_fonte`) e 5.2.
- Quarto liberado por nível, tema do morador, esconderijo de uso único, perfil por cômodo de entrada viraram
  propostas numeradas (P8–P10) ou foram trocados (perfil da casa inteira, P6).
- Card Shuffler fora da casa até o dono decidir; "Altar do Rito" removido; treino do rito como P4.
- Modelo assíncrono de Visitantes (P7) e anti-fuga do hostil (7, Abuso 8).
- Espelho e guarda-roupa separados (P3).
- Vínculos no menu global; o quadro é atalho (2.2-l).
- Fórmula do sorteio com paixão e karma (P6); preferências descobertas na ficha (P11) e sinal de atração (P13).
- Vista da Casa esquemática, iso fora da v1, ref-04/05 como clima (2.2-a, 7 Técnicos 2–3). Conferido abrindo as
  imagens: são ilustrações de alto detalhe, não pixel art.
- Escala revista para 32 px de arte com teste de penteados (P12, 3.1, 3.2).
- Modo Decorar: pan, zoom de dois dedos, auto-rolagem, gaveta recolhível; tocar no mapa não fecha painel (3.1).
- Atalhos globais para Pacotes, Confecção, Livro e Histórico (2.2-k).
- Kinds de item numa tabela compartilhada (5.1).
- Excedente determinístico, recalculado na mesma transação; decoração colocada não pode ser trocada nem dada
  (P5, PENDENTE 18).
- `idem` + `versao` em todas as ações que mudam a casa; `w`/`h` gravados; `rot` validado contra `meta.rotacoes`.
- "Fecha o dia" saiu da Cama; ficou só na PENDENTE 9.
- `casa.desfazer`, `casa.despejar` e leitura de qualquer casa por Owner/Anfitrião; avatar padrão para staff
  sem avatar.
- Ordem tutorial/avatar resolvida como P14, alinhada à `SPEC-TUTORIAL-E-EQUIPE.md` §3.1, com a alternativa na
  PENDENTE 19.

Onde discordei ou fui por outro caminho:
- **"Pedido literal 'crie um mod para abrir navegador'".** Não cabe a esta spec decidir. Registro aqui que a
  mensagem do dono repassada nesta rodada foi essa, e não um pedido de revisão da Casa. Esta revisão foi feita
  porque era a etapa atribuída pelo fluxo; o orquestrador precisa confirmar com o dono se o mod substitui ou se
  soma a este trabalho. Nenhum mod foi criado aqui.
- **Pegada no banco por constraint de exclusão** (`EXCLUDE USING gist` com `box`): não adotei. Exigiria a extensão
  `btree_gist` no Neon, uma dependência nova para algo que a transação com `FOR UPDATE` já garante. Em troca, `w`/`h`
  ficam gravados para auditoria e teste.
- **Tirar a Vista da Casa da v1 inteira**: mantive em versão esquemática, porque a navegação entre cômodos por menu
  precisa de alguma tela, e um corte simples custa pouco.
- **Perfil só da Sala**: troquei por casa inteira com peso por cômodo (em vez de só tirar a restrição), para que
  a Sala, onde o Visitante entra, ainda conte mais sem anular os outros cômodos. Pesos `X`.
- **Escala**: a crítica deu duas saídas (32 px de arte ou personagem maior que o tile). Adotei as duas juntas
  (tile de 32 px e personagem de 32 × 48 px), mas com o teste antes de fechar, e um plano B (detalhe só no
  retrato) se o teste falhar.
