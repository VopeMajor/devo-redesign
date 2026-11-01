# DEVO v2 — Devo tipo tutorial, ferramentas da equipe e brechas

Especificação (31/10/2026). Fonte das regras: `docs/redesign/v2/PEDIDO-V2-dono.md` (texto literal do dono),
`docs/redesign/DIRECAO-3.md` §1–4, `docs/redesign/FUNDACAO.md` §12 e o código atual lido em
`lib/devo/record-server.ts`, `lib/devo/salao.ts`, `lib/devo/salao-server.ts`, `lib/devo/recompensas-server.ts`,
`lib/devo/cargos.ts`, `lib/devo/inventario-server.ts`, `lib/devo/save.ts`, `app/api/save/route.ts`,
`app/api/salao/route.ts`, `scripts/fundacao-migration.sql`.

Nada aqui é final antes de o dono aprovar. Onde o dono não definiu, a escolha aparece como **proposta** e entra
na lista de pendências (§8). Números que ele não deu ficam como `x`.

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

Regra anterior que continua valendo (DIRECAO-3 §1): o tutorial é um Deadly Vote inicial, "criado semanalmente
pela equipe", e **vencer** desbloqueia os sistemas; Owner e Anfitrião veem tudo liberado.

---

## 1. Objetivo para o jogador

- **Novato:** entra no jogo, sai da criação de avatar e encontra um só caminho: o Devo tutorial. Não se perde
  numa lista de casos que ainda não entende. O tutorial existe para ele aprender, no grupo do WhatsApp, como um
  Deadly Vote acontece ("é apenas para tipificar": não muda as regras do caso, só marca quem pode vê-lo).
- **Depois do tutorial:** a cidade abre. Ele passa a ver os Devos abertos para inscrição e "as demais coisas"
  (os sistemas que hoje o tutorial já desbloqueia: Salão, Poço, Torres, Diário, Casa).
- **Equipe:** resolve o Salão das Máscaras sem sair dele (aprovar, editar, abrir agora) e o Owner corrige uma
  recompensa entregue por engano sem precisar mexer no banco.

---

## 2. Regras

### 2.1 O tipo "tutorial"

| # | Regra | Origem |
|---|---|---|
| T1 | Todo Devo tem um tipo: **Comum** ou **Tutorial**. O tipo é escolhido por quem cria. | dono ("tem o tipo tutorial") |
| T2 | O tipo não muda nada do caso em si (grupo do WhatsApp, cartas, peso, vagas, recompensas seguem iguais). | dono ("apenas para tipificar") |
| T3 | **Quem pode criar Tutorial:** o dono escreveu "caso um dealer ou quem quer que crie um devo, tem o tipo tutorial". Hoje só Owner e Anfitrião criam (`dv.tutorial` em `lib/devo/cargos.ts`). **Proposta:** liberar para toda a equipe (Owner, Anfitrião, Dealer). | dono; pendência P1 |
| T4 | Vencer um Tutorial continua concedendo as flags de `devo_tutorial_flags()` (gatilho atual da Fundação). | DIRECAO-3 |
| T5 | Recompensas de um Tutorial criado por Dealer seguem o fluxo atual: ficam pendentes para o Anfitrião/Owner. | regra atual |

### 2.2 Novato e veterano

- **Novato** = jogador (cargo `player`) que ainda não **concluiu** um Tutorial.
- **Concluir** um Tutorial: o dono escreveu "assim que finalizar um tutorial". Hoje o desbloqueio dos sistemas
  exige **sobreviver**. **Proposta:** "concluir" = estar aceito num Tutorial cujo resultado foi aplicado, com
  decisão diferente de "não compareceu". Assim quem morreu no tutorial já aprendeu e passa a ver os Devos, mas os
  sistemas continuam exigindo vitória (regra atual). Pendência P2 decide se as duas coisas são uma só.
- Dealer, Anfitrião e Owner nunca são novatos.

### 2.3 O que cada um vê na lista de Devos

| Quem | Vê | Não vê |
|---|---|---|
| Novato | Tutoriais convocados ou em andamento; qualquer Devo em que já está inscrito; o próprio histórico. | Devos Comuns (de nenhum estado). |
| Veterano | Devos Comuns (regra atual: abertos, em andamento, encerrados, cancelados por 30 dias); Tutoriais de que participou (histórico). | **Proposta:** Tutoriais abertos de outras pessoas (pendência P3). |
| Equipe | Tudo, como hoje; na Mesa, o Tutorial tem selo próprio. | — |

### 2.4 Inscrição

- Novato só se inscreve em Tutorial. O servidor recusa o resto (o cliente esconde, mas a regra é do servidor).
- **Proposta:** novato fica em **um** Tutorial ativo por vez (convocado ou em andamento), para não segurar vaga
  em vários.
- **Proposta:** veterano não se inscreve em Tutorial (pendência P3). Equipe pode pôr alguém à mão pela Mesa.
- Tutorial cancelado ou em falha não conta: o jogador continua novato e volta a ver os próximos.

### 2.5 Contas antigas

Quem já joga hoje e nunca fez Tutorial passaria a ver só Tutoriais. **Proposta:** a migração marca como
veterano quem já tem qualquer resultado em Deadly Vote ou a flag de sistema vinda de Deadly Vote
(`player_unlocks.source = 'deadly_vote'`). Pendência P4.

### 2.6 Salão das Máscaras: faixa da equipe

| # | Regra | Origem |
|---|---|---|
| S1 | Anfitrião ou acima **autoriza dali mesmo** (lotes da Bandeja e anúncios), sem ir à Mesa. | dono |
| S2 | Anfitrião ou acima **edita** dali: lote em avaliação (lance mínimo, nota) e lote já aprovado que ainda não foi a leilão (lance mínimo, edição, cancelar com devolução). | dono ("também editar") |
| S3 | Anfitrião ou acima **abre um salão agora no padrão de três dias**: a edição começa no instante do toque e as seguintes voltam a cair a cada 3 dias a partir dela. | dono |
| S4 | Hoje o Dealer também avalia (`salao.avaliar` = equipe toda) pela Mesa. **Proposta:** o Dealer mantém a avaliação na Mesa (nenhuma função se perde); a faixa no Salão aparece para Anfitrião e Owner, como o dono pediu. Pendência P6. | regra atual |
| S5 | O calendário completo (âncora, intervalo, duração, forçar) continua só do Owner. | regra atual |

"Padrão de três dias" bate com o calendário atual (`intervalo_dias: 3`, `duracao_horas: 24`). Se o dono quis
dizer "aberto por três dias", muda só a duração (pendência P5).

### 2.7 Owner desfaz envio de recompensa

| # | Regra | Origem |
|---|---|---|
| R1 | Só o **Owner** desfaz uma recompensa já **entregue**. | dono |
| R2 | Desfazer exige uma nota (motivo) e grava quem desfez e quando. A proposta original e o histórico continuam visíveis. | proposta |
| R3 | O sistema retira do jogador o que ainda existir daquela entrega e diz, antes de confirmar, o que não dá para retirar (já gasto, vendido, trocado). | proposta |
| R4 | Desfazer não apaga: a recompensa vira **"desfeita"**. Pode ser proposta de novo, como uma recompensa nova. | proposta |
| R5 | Prazo para desfazer: `x` dias depois da entrega. | pendência P7 |

---

## 3. Fluxo de telas

### 3.1 Celular (retrato, ~390×844) — novato

1. **Saída da criação de avatar.** O avatar aparece no quarto da Casa (pixel). O celular do jogo vibra no canto
   superior direito (ícone com ponto cobalto).
2. **Celular do jogo › Deadly Vote.** Só um cartaz: o Tutorial aberto. Selo "Tutorial" no canto do cartaz,
   relógio da convocação, vagas, botão "Inscrever-se" no rodapé (área de toque ≥ 48 px).
   - Sem Tutorial aberto: estado vazio com a frase da equipe e, se houver, a data do próximo Tutorial vinda do
     Calendário. Texto proposto: "Nenhum tutorial aberto agora. A equipe abre um por semana." (P8 — o dono pode
     trocar a frase; a regra "criado semanalmente" é da DIRECAO-3.)
3. **Inscrito.** O cartaz troca para "Inscrito · aguardando o grupo". Com aprovação, "Em análise".
4. **Em andamento.** Aparece o botão do grupo do WhatsApp (regra atual: só para aceitos, só em andamento).
5. **Resultado aplicado.** Transição forte, uma vez (REFERENCIAS §2.10). Se concluiu: cena curta de abertura da
   cidade — câmera do mapa passa pelos prédios que perdem o tapume (REFERENCIAS §3), um de cada vez, com o nome
   do sistema. Se venceu, os ícones do celular saem do cinza. Se morreu e P2 separar as regras: a lista de Devos
   abre, os prédios continuam com tapume e a placa diz que eles abrem com uma vitória.
6. **Lista completa.** A partir daí o Deadly Vote mostra os Devos Comuns.

Tentativas de abrir algo trancado antes disso (prédio com tapume, app cinza): balão curto do NPC guia apontando
para o Tutorial. Sem tela de erro.

### 3.2 Desktop — novato

Mesmo conteúdo. O mapa ocupa o centro; o celular do jogo vira um painel fixo à direita (largura do celular).
A lista de Devos usa duas colunas só quando houver mais de um cartaz (veterano).

### 3.3 Salão das Máscaras — faixa da equipe

**Celular**

1. Interior do Salão em vista de cima (REFERENCIAS §2.13). Para Anfitrião/Owner, uma faixa recolhível no rodapé:
   "Equipe · 3 lotes · 1 anúncio" (contador de pendentes). Recolhida, ocupa 40 px.
2. Toque na faixa → folha que sobe até 85% da tela, com três abas: **Fila**, **Edições**, **Relógio**.
   - **Fila:** cartões de lote (carta, vendedor, raridade, lance mínimo pedido). Botões "Aprovar" e "Recusar";
     "Aprovar" abre um campo opcional de lance mínimo e nota. Anúncios no mesmo padrão ("Publicar"/"Recusar").
     As listas de lotes e de anúncios ficam separadas (REFERENCIAS §2.13: não misturar).
   - **Edições:** lotes aprovados por edição futura. Em cada um: "Editar" (lance mínimo, mudar de edição) e
     "Cancelar lote" (confirmação; devolve carta e taxa).
   - **Relógio:** estado atual (aberto/fechado, quando fecha, próxima abertura). Botão **"Abrir agora"** (só com
     o Salão fechado). A confirmação mostra: "Abre agora · fecha dia DD/MM às HH:MM · próxima abertura DD/MM às
     HH:MM". Com o Salão aberto, o botão vira **"Fechar agora"** (pendência P9: Anfitrião pode fechar?).
     O Owner vê ainda "Calendário completo", que abre o editor atual.
3. Cada ação devolve um toast curto e o contador da faixa atualiza.

**Desktop**

A faixa vira um painel lateral direito fixo (360 px) com as mesmas abas; o salão continua visível à esquerda.

### 3.4 Desfazer recompensa (Owner)

**Celular:** Mesa › Recompensas (filtro atual continua) › recompensa com status "Entregue" › botão "Desfazer
envio" no fim da ficha (cor neutra, não rubi).

1. Folha "Desfazer envio" carrega uma **simulação** do servidor: lista linha a linha o que será retirado e o que
   não dá ("2 de 5 Fragmentos retirados; 3 já foram gastos", "Carta X já foi vendida no Salão").
2. Campo "Motivo" obrigatório (até 300 caracteres).
3. Botão "Desfazer" de **segurar 1,5 s** (evita toque acidental).
4. Resultado: a ficha passa a "Desfeita por <nome> em <data> · <motivo>" e mostra o relatório.

**Desktop:** a mesma ficha em modal centralizado; o botão de segurar vale também com o mouse.

O mesmo botão aparece no histórico do jogador (Mesa › Jogadores › <nome> › Recompensas).

---

## 4. Estados de animação e de interface

### 4.1 Cartaz do Devo (celular do jogo)

| Estado | Visual |
|---|---|
| `tutorial-aberto` | Cartaz com selo "Tutorial" (fita cobalto no canto), pulso suave do botão a cada 4 s. |
| `tutorial-inscrito` | Selo + carimbo "Inscrito" que cai uma vez (200 ms). |
| `tutorial-em-analise` | Carimbo "Em análise" em cinza, sem pulso. |
| `tutorial-em-andamento` | Botão do grupo com ícone do WhatsApp; relógio corre. |
| `tutorial-concluido` | Cartaz vira papel arquivado (dessatura 60%, leve rotação). |
| `vazio-novato` | Quadro de cortiça vazio, um alfinete solto; frase da equipe; data do próximo se houver. |
| `trancado` (veterano tentando Tutorial, se P3 esconder) | Não aparece; nada a desenhar. |

### 4.2 Avatar e mundo

| Contexto | Sprite |
|---|---|
| Novato abre o celular | Avatar olha para a mão (pose "celular", 2 quadros em loop). |
| Inscrição feita | Avatar acena com a cabeça (1 vez, 4 quadros). |
| Abertura da cidade | Avatar parado de costas olhando o horizonte enquanto a câmera passa; depois volta ao controle. |
| Prédio com tapume tocado | Avatar dá meio passo para trás e o NPC guia fala (balão, sem retrato grande). |

### 4.3 Faixa da equipe no Salão

| Estado | Visual |
|---|---|
| `recolhida` | Barra de 40 px, contador em pílula; pílula pisca uma vez quando chega item novo. |
| `aberta` | Folha com abas; fundo do salão escurece 40%. |
| `acao-pendente` | Botão com indicador de progresso; os outros botões do cartão ficam desabilitados. |
| `conflito` (outro membro decidiu antes) | Cartão some com toast "Já avaliado por outra pessoa". |
| `abrir-agora-confirmar` | Modal com as três datas calculadas no servidor. |
| `salao-abrindo` | Na sala, as máscaras da parede acendem em sequência (600 ms) e o relógio da parede reinicia. |

### 4.4 Desfazer

| Estado | Visual |
|---|---|
| `simulando` | Linhas em esqueleto. |
| `pronto` | Linhas verdes (retira), cinza (já não existe). |
| `segurando` | Anel enchendo em volta do botão. |
| `desfeito` | Selo "Desfeita" na ficha; linha nova no histórico. |
| `bloqueado` | Fora do prazo (P7) ou já desfeita: botão some e uma linha explica. |

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
-- cuja decisão conta como "concluir" (proposta: tudo menos 'ausente'; P2).
-- Backfill (P4): veteranos de hoje.
UPDATE players p SET tutorial_concluido_at = coalesce(p.tutorial_concluido_at, now())
 WHERE p.tutorial_concluido_at IS NULL
   AND (EXISTS (SELECT 1 FROM deadly_vote_entries e WHERE e.player_id = p.id AND e.outcome IS NOT NULL)
     OR EXISTS (SELECT 1 FROM player_unlocks u WHERE u.player_id = p.id AND u.source = 'deadly_vote'));
```

Função pura nova em `lib/devo/progresso.ts`: `ehNovato(cargo, tutorialConcluidoAt)` → `cargo === 'player' &&
!tutorialConcluidoAt`.

APIs (as rotas atuais continuam; muda o que devolvem):

| Rota | Mudança |
|---|---|
| `GET /api/record` (`getRecord`) | Filtra pelo §2.3 no SQL. Payload ganha `novato: boolean` e `proximoTutorial: { inicio } \| null` (do Calendário). Cada voto ganha `tipo: 'comum' \| 'tutorial'`. |
| `POST /api/record {action:'join'}` (`joinVote`) | Confere sob a mesma transação: novato só em Tutorial (409 `{code:'tutorial_pendente'}`); veterano não em Tutorial (409 `{code:'tutorial_ja_feito'}`, se P3); novato com outro Tutorial ativo (409 `{code:'tutorial_ativo'}`). |
| `createVote` / `updateVote` | Aceitam `tipo`. Permissão `dv.tutorial` passa a `isStaff` se P1 aprovar. Mudar o tipo de um Devo com inscritos: bloqueado (409). |
| `applyVoteResults` | Se `is_tutorial`, grava `tutorial_concluido_at`/`tutorial_vote_id` (só se ainda nulo) na mesma transação; `admin_log 'tutorial.concluido'`. |
| `getStaffBoard` | Já devolve `isTutorial`; a Mesa mostra o selo e um filtro "Tutoriais". |

### 5.2 Salão: faixa da equipe

Sem tabela nova. Configuração atual `devo_config['salao.calendario']` ganha um campo opcional:

```ts
// lib/devo/salao.ts — SalaoCalendarioCfg
fimAntecipado?: { n: number; at: string } | null   // "Fechar agora" da edição n
```

**Abrir agora sem bagunçar a numeração.** Os lotes aprovados guardam o número da edição (`salao_lotes.edicao`)
e a edição é calculada a partir da âncora. Mudar a âncora para "agora" renumeraria tudo e jogaria lotes em
outras datas. Por isso "Abrir agora" recalcula a âncora de modo que a **próxima** edição (n+1) comece agora:

```
n         = edicaoCorrente(cfg, agora)
ancora'   = agora − (n+1) × intervalo_dias × 24 h
forcar    = null ; fimAntecipado = null
```

Os lotes que já iam para a edição n+1 entram nesta abertura; as seguintes caem a cada 3 dias a partir de agora.
Só vale com o Salão fechado. Feito sob `pg_advisory_xact_lock(hashtext('salao:calendario'))`.

**Fechar agora:** grava `fimAntecipado = { n: corrente, at: agora }`; `relogioSalao` passa a considerar a edição
n fechada a partir de `at`, e `liquidar()` encerra os lotes (a regra de `edicaoEncerrada` já usa `!aberto`).

Ações novas em `POST /api/salao`:

| Ação | Quem | Faz |
|---|---|---|
| `relogio.abrir_agora` | Anfitrião+ (`salao.relogio`) | Recalcula a âncora como acima. Devolve `{ relogio }`. `admin_log 'salao.abrir_agora'` com a âncora antiga e a nova. |
| `relogio.fechar_agora` | Owner; Anfitrião se P9 | Grava `fimAntecipado`. |
| `lote.editar` `{ loteId, lanceMinimo?, edicao? }` | Anfitrião+ (`salao.editar`) | Só lote `aprovado` cuja edição ainda não abriu; respeita vagas (mesma trava `salao:vagas`). |
| `lote.cancelar` `{ loteId, nota }` | Anfitrião+ | Lote `aprovado` sem lance → `recusado`; devolve carta (`deliverCard`, idem `salao:lote:<id>:devolucao`) e taxa (idem já usado). |
| `avaliacao.lote` / `avaliacao.anuncio` | sem mudança | Reaproveitadas pela faixa. |

`GET /api/salao` ganha `equipe: { pendentes: { lotes, anuncios }, podeRelogio, podeEditar } | null` para quem
tem cargo (evita uma segunda chamada só para o contador).

Permissões novas em `lib/devo/cargos.ts` (e em `ACOES`, e documentadas em `FUNDACAO.md`):
`'salao.relogio'` (owner | anfitriao), `'salao.editar'` (owner | anfitriao).

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
```

Ação nova em `lib/devo/cargos.ts`: `'recompensa.desfazer'` (só Owner).

Função `undoRewardIn(c, ator, id, { nota, simular })` em `lib/devo/recompensas-server.ts`, tudo numa transação,
linha travada (`lockRow`). Com `simular: true` monta o relatório e faz `ROLLBACK`.

| Recurso | Como retira | Quando não dá |
|---|---|---|
| `item` | `devo_item_consume` até o saldo, idem `recompensa:<id>:desfazer`. | Saldo menor: retira o que houver; relatório diz quanto faltou. |
| `convite` | Igual a item. Códigos já gerados com ele: revoga os **não usados** gerados depois da entrega, até a quantidade. | Código já usado: só relata. |
| `tempo` | Primeiro desconta de `arcade_profiles.time_pending_ms` (ainda não resgatado); o resto sai de `timerEndsAt` no save, sem passar de `agora + x min` (P10). | Relata o que não saiu. |
| `carta` | Entrega não resgatada (`card_deliveries.claimed_at IS NULL`, `idem_key = recompensa:<id>:<i>`) → marca `revoked_at`; resgatada → remove o uid `dlv-<delivery id>` do save, se ainda estiver lá. | Carta vendida, trocada, sacrificada ou no Salão: relata. |
| `arcano` | `arcano_escolhas` ainda sem escolha → apaga a linha. A flag `virtudes` só sai se não houver outra fonte. | Arcano já escolhido: relata e não mexe (P11). |

Rota: `POST /api/staff { action: 'recompensa.desfazer', id, nota, simular? }` → `{ ok, relatorio }`.
Coluna nova `card_deliveries.revoked_at timestamptz`; `claimCards` ignora entregas revogadas.
`admin_log 'recompensa.desfeita'` com o relatório.

---

## 6. O que muda em sistemas atuais

| Sistema | Muda |
|---|---|
| Record / Deadly Vote (`record-server.ts`) | Filtro de lista e de inscrição por novato; `tipo` no payload; conclusão gravada ao aplicar resultado. |
| Mesa › Deadly Votes (`dealer-board.tsx`) | Seletor "Tipo: Comum / Tutorial" no formulário (hoje é caixa só para Owner/Anfitrião); filtro "Tutoriais". |
| Progressão (`progresso.ts`, gatilhos da Fundação) | Nada muda no desbloqueio por vitória. Entra `ehNovato`. |
| Narrativa (`prologue-script.ts`) | A fala "Cheque seu aplicativo Devo no celular…" continua; no v2 aponta para o cartaz do Tutorial. |
| Calendário | Evento do tipo "Tutorial" (proposta) para alimentar `proximoTutorial`. |
| Salão (`salao.ts`, `salao-server.ts`, `/api/salao`) | `fimAntecipado`; ações `relogio.*` e `lote.*`; bloco `equipe` no GET. |
| Recompensas (`recompensas-server.ts`, gatilho de guarda) | Status `desfeita`; `undoRewardIn`; rota na Mesa. |
| Inventário (`inventario-server.ts`) | `revoked_at` em `card_deliveries`. |
| Cargos (`cargos.ts`, `FUNDACAO.md`) | Ações `salao.relogio`, `salao.editar`, `recompensa.desfazer`; `dv.tutorial` possivelmente para `isStaff`. |

Nenhuma função atual sai. A avaliação do Salão na Mesa continua para toda a equipe.

---

## 7. Auditoria de brechas — sugestões para o dono aprovar

Lidas no código de 31/10. Cada item diz o que acontece hoje, o porquê de mexer e a sugestão. Ordem: do mais
grave para o menos grave.

1. **O Tempo do jogador é decidido pelo navegador.** `POST /api/save` grava `timerEndsAt` como o cliente mandar
   (`lib/devo/save.ts` só confere se é número). O Salão cobra lances e compras descontando desse mesmo campo
   (`debitar` em `salao-server.ts`). Quem editar o próprio save tem Tempo infinito; e um save antigo enviado
   depois da compra devolve o Tempo pago.
   **Por quê:** é a moeda do jogo; todo o Salão, a Casa e o Poço dependem dela.
   **Sugestão:** o servidor passa a ser o dono do Tempo (livro-caixa: `timerEndsAt` só muda por crédito/débito
   no servidor; o `/api/save` ignora o valor vindo do cliente ou só aceita valores menores).

2. **O inventário de cartas também vem do navegador.** O `/api/save` aceita até 300 cartas com qualquer `cardId`
   e `uid`. A Bandeja, o Mercado, a Confecção e o peso do Deadly Vote leem esse inventário como verdade.
   Dá para "criar" uma Lendária e vendê-la no Salão.
   **Por quê:** quebra a economia inteira e as raridades.
   **Sugestão:** o servidor guarda a lista de uids que ele mesmo entregou (`card_deliveries`, pacotes, Poço,
   trocas) e o `/api/save` descarta cartas cujo uid não tenha origem conhecida. Para as cartas que já existem,
   uma migração registra o inventário atual como ponto de partida.

3. **Uma recompensa entregue não tem volta.** Hoje só existe cancelar antes da entrega. É o pedido do dono
   (§2.7). **Sugestão:** a especificação acima.

4. **Inscrição do novato em qualquer Devo, e do veterano no Tutorial.** `joinVote` não olha o tipo. Um veterano
   pode entrar em todo Tutorial e repetir prêmios pensados para iniciantes (o Arcano do tutorial, por exemplo).
   **Por quê:** o Tutorial é para quem chega; prêmio de entrada repetido vira farm.
   **Sugestão:** a regra do §2.4 no servidor.

5. **Abrir o Salão "agora" muda a numeração das edições.** Hoje só o Owner edita o calendário e, se mudar a
   âncora à mão, os lotes aprovados para uma edição vão parar em outra data sem aviso.
   **Por quê:** vendedor e comprador perdem o leilão que esperavam.
   **Sugestão:** a conta do §5.2 (a próxima edição começa agora, os números não mudam) e, no editor completo do
   Owner, um aviso quando a mudança mover lotes já aprovados.

6. **"Forçar aberto" não tem fim.** Com `forcar: 'aberto'`, a edição corrente só encerra quando o Owner soltar
   (`edicaoEncerrada`). Se ele esquecer, os lances ficam presos.
   **Sugestão:** "Abrir agora" substitui o forçar no dia a dia; o forçar ganha prazo máximo de `x` horas.

7. **Cartas resgatadas podem sumir.** `claimCards` marca a entrega como resgatada antes de o cliente salvar. Se
   a rede cair entre a resposta e o próximo save, a carta foi "entregue" e não está em lugar nenhum.
   **Por quê:** perda de item vira reclamação e pedido manual à equipe.
   **Sugestão:** o servidor adiciona a carta direto no save (como já faz para tirar cartas no Salão) e o cliente
   só mostra; ou o resgate só se confirma no save seguinte que contenha o uid `dlv-<id>`.

8. **Tempo creditado por recompensa não tem idem.** `deliverIn` → `creditMinutes` para `tempo` confia só na trava
   da linha e no status. Funciona hoje, mas o desfazer (§2.7) e qualquer reentrega futura precisam de um
   registro por entrega.
   **Sugestão:** gravar o crédito num livro (`reward_id` único), como o Salão já faz em `salao_movimentos`.

9. **Dealer cria Tutorial (se P1 aprovar) e o desbloqueio é automático.** As recompensas do Dealer passam por
   aprovação, mas as flags do Tutorial saem pelo gatilho do banco sem ninguém olhar.
   **Por quê:** um Dealer poderia abrir sistemas para quem não jogou.
   **Sugestão:** Tutorial criado por Dealer só desbloqueia depois que o Anfitrião dele aprovar o resultado
   (um "visto" no `applyVoteResults`), ou o Dealer cria e o Anfitrião confirma o tipo.

10. **Registro da equipe espalhado.** Algumas ações gravam `admin_log` (aprovar lote, resultado de Deadly Vote),
    outras não (recusar lote, publicar anúncio, mudar o status do Devo, aceitar inscrição).
    **Por quê:** o desfazer e qualquer conferência precisam saber quem fez o quê.
    **Sugestão:** toda ação de equipe grava `admin_log`; a Mesa ganha uma aba "Registro" filtrável por pessoa.

11. **Lembrete do pulso aberto sem segredo.** `app/api/cron/pulse` só confere a senha se `CRON_SECRET` existir.
    Sem ela no ambiente, qualquer um chama a rota (o limite de 20 h evita spam, mas a rota faz uma consulta
    grande a cada chamada).
    **Sugestão:** recusar quando a variável não existir. (A variável quem coloca é o dono; nada de segredo no
    repositório.)

12. **Vitória na Sala de Jogos entre contas combinadas.** Partida casual vale +3 min para quem vence, sem limite
    diário (`arcade/server.ts`). Duas contas podem alternar derrotas.
    **Sugestão:** teto diário de Tempo vindo de partidas casuais (`x` min) e nada de Tempo contra o mesmo
    adversário mais de `x` vezes por dia.

13. **Trocas e jogos com mais de um aparelho.** Não foi possível confirmar, só lendo, se a Sala de Trocas valida a
    posse da carta no servidor (a rota `/api/trocas` só devolve os uids presos no Salão). **Sugestão:** um teste
    dedicado antes do v2 (`scripts/dev/*-test.mjs`) para confirmar ou fechar.

14. **Sugestões de equipe (não são brechas):**
    - a. "Desfazer" também para o resultado de um Deadly Vote aplicado por engano (hoje fica selado). Só Owner.
    - b. Pré-visualização "como o jogador vê" na Mesa (novato/veterano), para a equipe testar o Tutorial sem
      conta de teste.
    - c. Aviso na Mesa quando não houver Tutorial aberto e existirem novatos esperando (contagem).
    - d. Na faixa do Salão, "Aprovar todos desta raridade" para filas grandes, com confirmação.

---

## 8. Pendências que só o dono decide

1. **P1 — Quem cria Tutorial.** O texto diz "um dealer ou quem quer que crie um devo". Liberar para o Dealer?
2. **P2 — O que é "finalizar".** Basta participar até o fim (inclusive morrer) para ver os Devos? E os sistemas
   continuam exigindo vencer, ou finalizar também abre tudo?
3. **P3 — Veterano e Tutorial.** O veterano deixa de ver e de se inscrever em Tutoriais?
4. **P4 — Contas antigas.** Quem já joga hoje conta como quem já fez o Tutorial (proposta) ou passa por um?
5. **P5 — "Padrão de três dias".** É "um salão a cada 3 dias, aberto 24 h" (como hoje) ou "aberto por 3 dias"?
6. **P6 — Dealer no Salão.** Dealer continua avaliando lotes pela Mesa (proposta) ou a avaliação fica só de
   Anfitrião para cima?
7. **P7 — Prazo para desfazer recompensa.** `x` dias depois da entrega, ou sem prazo.
8. **P8 — Frase do estado vazio** do novato quando não há Tutorial aberto.
9. **P9 — Fechar agora.** Anfitrião pode fechar um Salão aberto, ou só o Owner?
10. **P10 — Tempo ao desfazer.** Pode deixar o pulso do jogador abaixo de `x` minutos? (Perder Tempo até zero
    tem consequência no jogo.)
11. **P11 — Arcano já escolhido.** Desfazer a recompensa tira o Arcano escolhido ou só registra?
12. **P12 — Aviso ao jogador.** Quem perde uma recompensa desfeita recebe uma mensagem? De quem (Sistema, NPC)?
13. **P13 — Aprovar as sugestões do §7** (uma a uma).

---

## 9. Riscos e anti-abuso

| Risco | Medida |
|---|---|
| Novato sem Tutorial aberto fica sem o que fazer. | Estado vazio com data do próximo; aviso para a equipe (§7-14c); Casa e criação de avatar seguem abertas. |
| Veterano antigo trancado por engano. | Backfill (P4) e override manual do Owner (`desbloqueio.override` já existe; ganha "marcar tutorial concluído"). |
| Novato segura vaga em vários Tutoriais. | Um Tutorial ativo por vez (§2.4). |
| Farm de prêmio do Tutorial. | Veterano fora do Tutorial; conclusão gravada uma vez só (`tutorial_concluido_at` só se nulo). |
| Mudar o tipo depois de ter inscritos. | Bloqueado no servidor (409). |
| Anfitrião abre o Salão várias vezes seguidas para encurtar o ciclo. | "Abrir agora" só com o Salão fechado e só se a última edição fechou há pelo menos `x` horas; tudo no `admin_log`. |
| Duas pessoas da equipe decidem o mesmo lote. | Linha travada (`FOR UPDATE`) e status conferido, como hoje; o segundo recebe 409 e o cartão some. |
| Desfazer por engano. | Simulação antes; motivo obrigatório; botão de segurar; só Owner; o status muda para "desfeita" e nada é apagado. |
| Desfazer tira mais do que foi dado. | Idem `recompensa:<id>:desfazer` em cada retirada; nunca abaixo de zero (as funções de inventário já garantem). |
| Desfazer e entrega ao mesmo tempo. | Mesma trava da linha em `reward_proposals`; o gatilho de guarda só aceita `entregue → desfeita`. |
| Botões de equipe vistos por jogador. | O cliente esconde, mas cada ação confere o cargo no servidor (`requireCan`), como já é regra no projeto. |
| Owner exposto em tela pública. | Registros e fichas mostram "Owner" só para quem tem `cargo.ver_owner` (`cargoVisivel`), regra atual. |
| Banco sem a migração. | Rotas devolvem 503 `banco_desatualizado`; a lista de Devos cai para o comportamento atual (sem filtro) em vez de travar o novato. |
