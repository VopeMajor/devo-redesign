# Fundação — contrato de dados e servidor (DIRECAO-3)

Base de que dependem Poço, Torres, Salão das Máscaras, Corporações, Cosméticos, Staff/Deadly Vote, Narrativa e
Virtudes. **Este arquivo é o contrato estável**: use as funções e endpoints daqui em vez de escrever SQL próprio
para cargos, itens, flags, karma e recompensas. Se precisar de algo que não existe, acrescente uma função nos
módulos abaixo (sem mudar a assinatura das existentes) e documente aqui.

Regra de ouro: **toda permissão é decidida no servidor** com `can()`; o cliente só esconde botões.

## Arquivos

| Arquivo | O que é |
|---|---|
| `scripts/fundacao-migration.sql` | Migração idempotente (tabelas, funções SQL, gatilhos, catálogo base, config provisória). |
| `scripts/devo-banco-novo.sql` | Banco novo de produção: TODAS as migrações em ordem, sem seed. **Gerado** por `bash scripts/dev/gerar-banco-novo.sh` (o CI avisa em `banco-novo.log` se estiver desatualizado). |
| `scripts/dev/90-seed.sql` | Seed de teste: Owner `Sentinela`, Anfitrião `Mordomo`, Dealer `Narrador` (sob Mordomo), tutorial "O Primeiro Voto", itens/karma de exemplo em `Lírio`, proposta pendente, convites `DEVO-FUND-*`. |
| `scripts/dev/fundacao-test.mjs` | Teste de servidor (banco + HTTP), roda no CI depois das capturas → `fundacao-test.log`. |
| `lib/devo/cargos.ts` | **Puro** (cliente pode importar): `Cargo`, `can()`, `publicCargo()`, `cargoVisivel()`, rótulos. |
| `lib/devo/progresso.ts` | **Puro**: flags (`UNLOCK_FLAGS`), tipos de item, raridades, `destinoDoKarma()`, `EuPayload`. |
| `lib/devo/permissoes-server.ts` | `loadActor`, `requireCan`, cargos, transferência, equipe, resumo de jogador, log, autorizações. |
| `lib/devo/inventario-server.ts` | `grantItem`, `consumeItem`, `readInventory`, catálogo, entregas de cartas, crédito de Tempo. |
| `lib/devo/progresso-server.ts` | Desbloqueios, Karma, configuração, cota de convites, `getEu`. |
| `lib/devo/recompensas-server.ts` | Propostas de recompensa: propor, editar, aprovar, rejeitar, cancelar, entregar, listar. |
| `lib/devo/fundacao-db.ts` | `txAs(atorId, fn)` (transação com ator para os logs), `run`, `mapDbError`. |
| `lib/devo/errors.ts` | `RecordError(message, status)` — o mesmo erro do Record (re-exportado por `record-server.ts`). |
| `app/api/eu/route.ts` | Dados do próprio jogador. |
| `app/api/staff/route.ts` | API da equipe (Owner/Anfitrião/Dealer). |

Ordem de migração (CI, `local-db.mjs` e o gerador do banco novo): `00-base` → deadly-votes → deadly-votes-group →
auth → arcade → arcade-points → arcade-rooms → test-accounts → character-name → **fundacao** → (seed só em teste).
**Migração nova**: acrescente nos três lugares (capturas.yml, local-db.mjs, gerar-banco-novo.sh) e gere o banco novo.

**Produção (Neon existente)**: rodar `scripts/fundacao-migration.sql` **junto** com o deploy deste código (o hook
de cadastro já lê `invite_codes.supervisor_id`). Admins viram Owners; Dealers antigos ficam sob o Owner mais antigo
até o Owner transferi-los para um Anfitrião; todo Jogador recebe 1 convite de cota.

## 1. Cargos

`players.role` ∈ `'owner' | 'anfitriao' | 'dealer' | 'player'` (CHECK no banco). Jogador continua `'player'` no
banco. O antigo `'admin'` virou `'owner'` (em `players` e `invite_codes`; `normalizeCargo('admin') === 'owner'`).

- `players.supervisor_id` — **obrigatório para Dealer** (gatilho `players_cargo_chk`: `DEALER_SEM_SUPERVISOR`;
  supervisor precisa ser Anfitrião ou Owner; não-Dealer tem `supervisor_id` zerado; um Anfitrião com Dealers não
  pode ser rebaixado: `SUPERVISOR_COM_DEALERS`).
- `dealer_supervisions` — histórico (um período por supervisor; transferir fecha o aberto e abre outro).
- `reward_proposals.supervisor_id` — supervisor do proponente **no momento da proposta** (preservado após transferência).
- `admin_log` — `cargo.alterado` e `dealer.supervisor` gravados por gatilho, com o ator de `txAs`.
- `staff_authorizations` — autorizações pontuais do Owner a Anfitriões (`escopo` + `ref` opcional + validade).
  Hoje usada: `recompensa.semanal` (ref = semana/evento; ref nula = qualquer).

### `can(ator, acao, alvo)` — tabela do dono

`ator` vem de `await loadActor(playerId)` (nunca monte à mão no servidor). Retorna boolean; `requireCan(...)` lança 403.

| Ação | Owner | Anfitrião | Dealer | Jogador | Alvo |
|---|---|---|---|---|---|
| `admin.global` | ✓ | — | — | — | — |
| `cargo.gerenciar` | ✓ (menos a si) | limitado: Jogador→Dealer sob si; seu Dealer→Jogador | — | — | `{ pessoa, novoCargo, novoSupervisorId? }` |
| `dealer.transferir` | ✓ | — | — | — | `{ pessoa }` |
| `dv.criar` | ✓ | ✓ | ✓ | — | — |
| `dv.editar` | todos | os seus + dos seus Dealers | os seus | — | `VotoAlvo` (`loadVotoAlvo`) |
| `dv.tutorial` | ✓ | ✓ | — | — | — |
| `recompensa.propor` | ✓ | evento/externa/semanal | evento, só no voto que edita | — | `{ tipo, voto? }` |
| `recompensa.editar` | ✓ | as que responde | as próprias | — | `PropostaAlvo` |
| `recompensa.aprovar` / `.distribuir` | ✓ | evento (própria, ou de Dealer que supervisiona/supervisionou); semanal com autorização; **nunca externa** | — | — | `PropostaAlvo` |
| `convite.gerar` | qualquer cargo | Jogador ou Dealer (sob si) | — | Jogador, se cota > 0 | `{ cargo, cota }` |
| `dados.resumidos` | ✓ | ✓ | próprios | próprios | `{ pessoaId }` |
| `dados.completos` | ✓ | próprios | próprios | próprios | `{ pessoaId }` |
| `jogar` | ✓ | ✓ | ✓ | ✓ | — |
| `desbloqueio.override`, `karma.ajustar`, `item.conceder`, `catalogo.editar`, `config.editar`, `autorizacao.gerenciar`, `convite.teste`, `cargo.ver_owner`, `cosmetico.equipar_qualquer` | ✓ | — | — | — | — |
| `equipe.ver` | ✓ | ✓ (seus Dealers) | — | — | — |

### Owner nunca é público

- **Todo payload público** (perfil, miniperfil, ranking, chat, listas de participantes, Record) passa o cargo por
  `publicCargo(role)` → Owner sai como `'player'`. Anfitrião e Dealer podem aparecer.
- Já aplicado: chat e miniperfil da Sala de Jogos (`lib/devo/arcade/server.ts`; Owner também não ganha borda de
  equipe), anfitrião do caso no Record (`host` é `null` quando quem criou é Owner).
- Telas de equipe: use `cargoVisivel(viewer, role)` — só quem tem `cargo.ver_owner` (Owner) enxerga Owner.
- O **próprio** cargo pode ir para o dono da sessão (`/api/eu`, `/api/record`).
- Cosméticos: o destaque do Owner não pode revelar o cargo (nem em `title`, `aria-label`, `data-*` ou nome de classe
  público). Use uma marca visual neutra decidida no servidor.

## 2. Inventário genérico

Tabelas: `item_defs` (catálogo), `player_items` (saldo, `CHECK quantity >= 0`), `item_ledger` (livro-razão com
`idem_key` único).

Tipos (`kind`): `moeda`, `essencia`, `chave`, `fragmento`, `capsula`, `cosmetico`, `convite`, `outro`.
Raridade (`rarity`): `comum`, `incomum`, `raro`, `epico`, `lendario`, `arcano` (cartas têm escala própria em `cards.ts`).
`stackable = false` → item único (cosmético, cápsula): no máximo 1. `meta` (jsonb) é livre por sistema.

**Convenção de chaves** (regex `^[a-z0-9_]+(:[a-z0-9_-]+)?$`):

| Sistema | Chave | Exemplo |
|---|---|---|
| Moedas do Poço | `dracma_<raridade>` | `dracma_comum`, `dracma_incomum`, `dracma_rara` (provisória) |
| Essências | `essencia:<npc>` | `essencia:galo` (Galo, Anfitrião do Imperador); `meta.npc`, `meta.torre` |
| Chaves de torre | `chave:<torre>` | `chave:torre-do-galo`; `meta.torre` |
| Fragmentos | `fragmento_arcano` (ou `fragmento:<arcano>` se o dono separar) | |
| Cápsulas (Diário) | `capsula:<id>` | `meta.texto`, `meta.titulo` — o Diário lista `kind = 'capsula'` |
| Cosméticos | `cosmetico:<id>` | `meta.categoria` ∈ `moldura_avatar`, `moldura_mini`, `emblema`, `balao`, `efeito`; `meta.asset`, `meta.animado` |
| Convites | `convite` | cota do Jogador |

Funções (servidor; aceitam `q` = pool ou cliente de `txAs` para combinar atomicamente):

```ts
grantItem({ playerId, item, quantidade, motivo, ref?, atorId?, idem? }, q?) → saldo final
consumeItem({ ... }, q?) → saldo final | RecordError 409 'Saldo insuficiente.' (nada muda)
itemBalance(playerId, item, q?) → number
readInventory(playerId, kinds?, q?) → InventoryItem[]   // só quantidade > 0
listItemDefs(kind?) / upsertItemDef(def, q?)              // upsert só após requireCan('catalogo.editar')
```

No SQL: `devo_item_grant(player, item, qty, reason, ref, actor, idem)` e `devo_item_consume(...)`. **Use `idem`**
sempre que a operação puder repetir (ex.: `poco:giro:<uuid>`, `torre:<torre>:andar:<n>:<player>`,
`dialogo:<cena>:<escolha>:<player>`): a mesma chave nunca concede/consome duas vezes.

Exemplo (Torres: pagar andar e ganhar chave na mesma transação):

```ts
await txAs(player.id, async (c) => {
  await consumeItem({ playerId: player.id, item: 'essencia:galo', quantidade: custo, motivo: 'torre', idem: `torre:galo:andar:3:${player.id}:pago` }, c)
  await grantItem({ playerId: player.id, item: 'chave:torre-do-galo', quantidade: 1, motivo: 'torre', idem: `torre:galo:andar:3:${player.id}` }, c)
})
```

**Cartas** continuam no save do cliente. O servidor deposita em `card_deliveries` (`deliverCard`) e o cliente
resgata com `POST /api/eu {action:'cartas.resgatar'}` → `{ cartas: CardDelivery[] }` e põe no próprio inventário
(o agente de Cartas/Narrativa liga isso no store; `EuPayload.cartasPendentes` diz se há algo).
**Tempo** usa o livro-caixa existente `arcade_profiles.time_pending_ms` (`creditMinutes`); é aplicado ao relógio na
próxima resposta que chama `drainTime` (hoje, a Sala de Jogos).

## 3. Desbloqueios (flags)

`player_unlocks (player_id, flag, source, ref, actor_id)`. Flags (`UNLOCK_FLAGS`): `salao_mascaras`, `poco`,
`torres`, `diario`, `corporacoes`, `virtudes`, `galo_casa` (gatilho narrativo da visita do Galo).

- **Owner e Anfitrião veem tudo liberado** (DIRECAO-3 §1b). Todos os outros — inclusive contas antigas — ficam
  trancados até vencer o Deadly Vote tutorial (ou override do Owner, ou narrativa).
- **Tutorial**: `deadly_votes.is_tutorial` + `deadly_votes.unlocks text[]` (padrão `devo_tutorial_flags()` =
  salao_mascaras, poco, torres, diario, galo_casa; editável por voto). Gatilhos: quando o voto fica `concluido`, ou
  quando uma entrada de voto concluído vira `sobreviveu`, as flags vão para os sobreviventes (idempotente). Criar
  tutorial: `POST /api/record {action:'create', ..., tutorial: true}` (Owner/Anfitrião).
- Corporações e Virtudes não estão no padrão do tutorial: a Narrativa libera com `grantUnlock(..., 'narrativa')`
  quando a cena acontecer (ou o dono pede para incluir no tutorial — basta editar `devo_tutorial_flags()`).

**Função única de acesso (DIRECAO-3 §7):** `unlocks(playerId) → Acesso`
`{ total, sistemas: Record<UnlockFlag, boolean>, salaJogos, todosApps, pularTutoriais }`. Owner e Anfitrião:
`total = true` e **tudo** liberado — nenhuma trava de progressão vale para eles, nem as antigas do cliente (Sala de
Jogos ainda não revelada / `arcadeUnlocked`, apps ainda não vistos / `seenApps`, tutoriais e apresentações).
Jogador e Dealer: flags do servidor + `save.arcadeUnlocked`. Vai no payload do próprio jogador como
`EuPayload.acesso` (`GET /api/eu`). **A interface só reflete**: o shell/apps devem ler `acesso` em vez de decidir
sozinhos (ex.: `acesso.salaJogos || state.arcadeUnlocked`, mostrar todos os apps se `acesso.todosApps`, oferecer
"pular" se `acesso.pularTutoriais`). Ligar isso nas telas é tarefa dos agentes de Sistema/Narrativa.

```ts
unlocks(playerId) → Acesso                                    // use esta para decidir telas
getUnlocks(playerId) → { flags: Record<UnlockFlag, boolean>, tudoLiberado }
hasUnlock(playerId, flag) / requireUnlock(playerId, flag)   // 403 'Este sistema ainda está trancado.'
grantUnlock(playerId, flag, 'narrativa' | 'sistema' | 'owner' | 'deadly_vote', ref?, atorId?, q?)
ownerSetUnlock(atorId, playerId, flag, on)                    // override, com log
```

SQL: `devo_tem_desbloqueio(player, flag)`. **Toda rota de sistema novo deve chamar `requireUnlock`.**

## 4. Karma

`players.karma integer` (começa 0; + ordem, − caos) e `karma_log` (delta, saldo, motivo, ref, ator, idem).

```ts
adjustKarma({ playerId, delta, motivo, ref?, atorId?, idem? }, q?) → valor final   // |delta| ≤ 1000
ownerAdjustKarma(atorId, playerId, delta, motivo)                                   // manual, com log
karmaHistory(playerId)
destinoDoKarma(k) → { direcao: 'ordem'|'equilibrio'|'caos', intensidade: 0..3 }    // faixas provisórias em progresso.ts
```

O jogador **nunca recebe o número** (`/api/eu` manda só `destino`). Escolhas de diálogo: use `idem`.

## 5. Cota de convites

Item `convite`. Jogador recebe 1 ao criar a conta (hook do better-auth; idem `cota-inicial:<id>`; contas antigas
receberam na migração). Não renova. Gerar convite de Jogador gasta 1 (`/api/invites create`); revogar um convite não
usado devolve 1. Mais convites: recompensa com `recurso: 'convite'`. `devo_config['convites.cota_inicial']` define o
valor inicial. `GET /api/invites` agora responde também para Jogador: `{ role, canGrant, invites, quota }`.
Dealer **não gera** convites (tabela do dono). Convite de Dealer: o Anfitrião que gera vira supervisor; o Owner pode
mandar `supervisorId` (senão ele mesmo supervisiona).

## 6. Recompensas com aprovação

`reward_proposals`: `kind` (`evento` | `externa` | `semanal`), `vote_id`, `origin` (evento de origem, texto),
`recipient_id`, `resource` (`item` + `resource_key` do catálogo | `tempo` em **minutos** | `carta` + id da carta |
`convite`), `quantity`, `justification`, `status` (`pendente` → `aprovada`/`rejeitada` → `entregue`; `cancelada`),
`proposed_by`, `supervisor_id` (snapshot), `authorized_by`/`authorized_at`, `decision_note`, `delivered_by`/`delivered_at`,
`revision`. Histórico completo em `reward_log` (snapshot a cada mudança); entregas em `admin_log`
(`recompensa.entregue`).

Regras garantidas **no banco** (gatilho `devo_reward_guard`), além do `can()`:
- nasce sempre `pendente` (mesmo que o INSERT peça outra coisa);
- **editar algo relevante** (tipo, voto, destinatário, recurso, chave, quantidade) de aprovada/rejeitada → volta a
  `pendente`, limpa a autorização e soma `revision`;
- aprovar exige `authorized_by` Owner, ou Anfitrião se não for `externa` (Dealer/Jogador → `APROVACAO_NAO_PERMITIDA`);
- entregar exige `aprovada`; entregue/cancelada é imutável.

```ts
proposeReward(atorId, input, { aprovar?, entregar? }) → id
editReward(atorId, id, patch) → Recompensa
approveReward(atorId, id, { nota?, entregar? })
rejectReward(atorId, id, nota?) / cancelReward(atorId, id)
deliverReward(atorId, id) → boolean   // idempotente: segunda chamada → false, nada duplica
listRewards(atorId, { status?, voteId?, destinatarioId? })   // com podeAprovar/podeEditar por linha
rewardHistory(atorId, id)
```

Para o Staff/Deadly Vote: ao concluir um voto e decidir por participante, crie uma proposta `evento` por
participante com `voteId` (o Dealer propõe; o Anfitrião/Owner aprova e entrega). Recompensas semanais: `semanal`,
Owner aprova; Anfitrião só com `staff_authorizations` `recompensa.semanal`.

## 7. Configuração editável pelo Owner

`devo_config (key, value jsonb, provisional, note)`. `getConfig(key)` no servidor; `setConfig` (Owner, com log).
Valores **provisórios** já gravados (`provisional = true`):
- `poco.probabilidades` — pesos relativos por moeda (`dracma_comum`, `dracma_incomum`) para `lixo`, `capsula`,
  `fragmento`, `essencia`, `cosmetico`. **PROVISÓRIO** até o dono definir (DIRECAO-3 §1b). O Poço deve ler daqui e
  mostrar ao Owner a marca de provisório.
- `poco.giro_gratis_diario` — `{ categoria: 'dracma_comum', quantidade: 1 }`.
- `convites.cota_inicial` — `1`.
Virtudes (tabela de afinidade com divergências) deve entrar como `virtudes.afinidades`, provisório.
Narrativa (`scripts/narrativa-migration.sql`, provisórios): `narrativa.galo_casa.tempo_min` (60), `narrativa.melissa_corporacoes.multa_min`
(−30), `narrativa.galo_casa.explorar_min` (2). Motor de diálogo e efeitos de cena: `docs/redesign/DIALOGO.md`.

## 8. API

### `GET /api/eu` (sessão obrigatória)
`EuPayload`: `{ id, cargo, inventario: InventoryItem[], desbloqueios, tudoLiberado, acesso, destino, convites, cartasPendentes }`.
`?parte=inventario&tipo=moeda,essencia` → `{ inventario }`. `POST {action:'cartas.resgatar'}` → `{ ok, cartas }`.

### `GET /api/staff?view=…`
| view | quem | resposta |
|---|---|---|
| `equipe` | Owner, Anfitrião | `{ equipe: EquipeMembro[] }` |
| `supervisao&dealer=<id>` | Owner, Anfitrião envolvido | `{ historico }` |
| `recompensas[&status=&voto=&destinatario=]` | equipe | `{ recompensas }` |
| `recompensa&id=` | quem pode editar/aprovar | `{ historico }` |
| `jogador&id=[&nivel=completo]` | resumido: Owner/Anfitrião/si; completo: Owner/si | `PlayerSummary` |
| `log[&acao=&alvo=]` | Owner | `{ log }` |
| `config` | Owner | `{ config }` |
| `itens[&tipo=]` | equipe | `{ itens }` (catálogo) |

### `POST /api/staff {action, …}`
`cargo.definir {playerId, cargo, supervisorId?}` · `dealer.transferir {dealerId, supervisorId}` ·
`recompensa.propor {tipo, voteId?, origem?, destinatarioId, recurso, chave?, quantidade, justificativa, aprovar?, entregar?}` ·
`recompensa.editar {id, …campos}` · `recompensa.aprovar {id, nota?, entregar?}` · `recompensa.rejeitar {id, nota?}` ·
`recompensa.cancelar {id}` · `recompensa.entregar {id}` → `{entregou}` · `desbloqueio.definir {playerId, flag, on}` ·
`karma.ajustar {playerId, delta, motivo}` · `item.conceder` / `item.retirar {playerId, item, quantidade, motivo}` ·
`catalogo.definir {item: {key, kind, name, description?, rarity?, stackable?, meta?, active?}}` ·
`config.definir {key, value, provisional?, note?}` · `autorizacao.conceder {granteeId, escopo, ref?, expiresAt?}` ·
`autorizacao.revogar {id}`.
Erros: `{ ok: false, error }` com 400/403/404/409 (mensagens em português, sem revelar cargos).

### Mudanças em rotas existentes
- `/api/record`: `role` agora é o `Cargo`; Mesa do Dealer filtrada pelo escopo (Owner todos; Anfitrião os seus e dos
  seus Dealers; Dealer os seus); `status`/`group`/`outcome` exigem `dv.editar`; `create` aceita `tutorial: true`.
- `/api/invites`: Jogador com cota; Dealer não gera; `quota` no payload.
- `/api/arcade`: `role` do chat e do miniperfil passa por `publicCargo`.

## 8b. Staff e Deadly Vote (agente Staff)

Migração `scripts/staff-migration.sql` (depois da Fundação; está no CI, no `local-db.mjs` e no banco novo).

- `deadly_votes`: `location` (local), `admission` (`'livre'` entra direto | `'aprovacao'` o dono do caso aceita),
  `results_applied_at/by` (resultado aplicado aos perfis — uma vez só).
- `deadly_vote_entries`: `admission` (`pendente`/`aceita`/`recusada`), `decision` (`premio`/`morreu`/`ausente`/`outro`),
  `note`, `decided_by/at`. Gatilhos `devo_dv_entry_guard`/`devo_dv_vote_guard`: depois de aplicado, decisão, resultado,
  inscrição e estado do voto ficam selados (`RESULTADO_APLICADO` → 409).
- `deadly_vote_prizes`: recompensas planejadas do caso. **Privadas**: só a Mesa (`GET /api/record?view=staff`) as
  envia; `getRecord` (payload do jogador) nunca.
- `reward_proposals.prize_id` + índice único `(prize_id, recipient_id)`: uma proposta por prêmio e participante.
- `recompensas-server.ts`: **`proposeRewardIn(c, ator, input, { aprovar: true | 'se-puder', entregar, prizeId })`** —
  proposta dentro de uma transação aberta; `'se-puder'` aprova só se `can(ator, 'recompensa.aprovar')`.
- `permissoes-server.ts`: `listJogadores(atorId, busca)` (`equipe.ver`; cargo por `cargoVisivel`) →
  `GET /api/staff?view=jogadores&q=`. `PlayerSummary` ganhou `arcano` e `pontosPotencial` (null até Arcanos/Virtudes
  terem fonte no servidor).

`POST /api/record` (todas exigem `dv.editar` no voto): `create` aceita `location`, `admission`, `prizes[]`
(`{recurso, chave?, quantidade, label?}`, até 8); `edit {voteId, …ficha, prizes?}` (antes de aplicar);
`admission {voteId, playerId, admission}`; `decision {voteId, playerId | '*', decision | null, note?}` (só com o voto
`concluido`; `'*'` = todos os aceitos ainda sem decisão; `outro` exige nota); `apply {voteId}` →
`{ aplicou, participantes, propostas, entregues, pendentes }`. Aplicar: exige todos os aceitos decididos;
`premio` → `sobreviveu` + uma proposta `evento` por prêmio planejado; `morreu` → `eliminado`; `ausente`/`outro` → sem
resultado; inscrições ainda em análise viram recusadas. Quem pode aprovar (Owner; Anfitrião no seu escopo) já aprova e
entrega; a proposta de Dealer fica pendente. Gravar `sobreviveu` num tutorial concluído dispara o desbloqueio
(gatilhos da §3). Segunda chamada → `aplicou: false`, nada duplica. `join` respeita `admission` (pendente) e recusa
quem foi recusado. O payload público (`DeadlyVote`) ganhou `location`, `admission` e `entryStatus` (a própria inscrição).

Telas: aba **Mesa** do Record (`components/devo/system/staff-desk.tsx`): Casos (Mesa do Dealer), Recompensas, Equipe,
Jogadores, Convites, Registro, Ajustes — por cargo. Jogador: aba Convites com a cota. Teste: `scripts/dev/staff-test.mjs`
(→ `staff-test.log`).

## 9. Pendências e decisões para o dono
- Probabilidades do Poço, faixas da "linha do destino" e lista de flags do tutorial: provisórias e editáveis.
- `dracma_rara` foi criada como provisória (o texto só cita Comum e Incomum).
- Dealer não gera convites (segue a tabela; antes podia gerar convite de Jogador).
- O painel de equipe (telas) é do agente Staff; a Fundação entrega só API.

## 10. Poço dos Milagres (agente Poço)

Arquivos: `scripts/poco-migration.sql` (tabelas `poco_estado`, `poco_giros`; config e catálogo provisórios),
`lib/devo/poco.ts` (puro: tipos, lixo, minigame, pesos), `lib/devo/poco-server.ts`, `app/api/poco/route.ts`,
`lib/devo/poco-neblina.ts` (cena literal do dono, como dados), `components/devo/poco/*`, seed `scripts/dev/91-seed-poco.sql`,
teste `scripts/dev/poco-test.mjs` (CI → `poco-test.log`).

- **Trava:** toda rota chama `requireUnlock(…, 'poco')`; `GET /api/poco` trancado responde `200 { liberado: false, motivo }`.
- **Moedas:** `item_defs` com `kind = 'moeda'` e `meta.poco = true`; cada chave é uma **categoria** de sorteio com pesos em
  `devo_config['poco.probabilidades'][<moeda>]` (categoria sem pesos = fechada). `dracma_comum` = base.
- **Dracma do encapuzado:** `POST {action:'apresentacao.concluir'}` → `grantItem('dracma_incomum', idem 'poco:corvo:<id>')`.
- **Giro grátis:** `devo_config['poco.giro_gratis_diario'] = { categoria, quantidade }`; dia em horário de Brasília;
  índice único `(player_id, dia, gratis_n) WHERE gratis`.
- **Um giro por vez:** índice único `(player_id) WHERE estado <> 'revelado'`. A moeda é consumida na mesma transação do
  giro com `idem 'poco:giro:<giro>:moeda'`; o prêmio com `idem 'poco:giro:<giro>:premio'`.
- **Sorteio auditável:** `seed` aleatório por giro, `seed_hash = sha256(seed)` mostrado antes; rolagens = HMAC-SHA256(seed,
  rótulo). Grava pesos efetivos, `provisorio`, rolagem, categoria sorteada/final, item, quantidade, toques e acertos.
- **Manivela:** `devo_config['poco.manivela']` (provisório). O servidor deriva os parâmetros do ponteiro do seed, recebe só os
  instantes dos toques, recusa toques posteriores ao tempo real decorrido e conta os acertos (`avaliarToques`). Cada acerto
  multiplica o peso do lixo por `1 − acertos × reducao_lixo_por_acerto`. Não há segunda tentativa.
- **Resultados:** `lixo` (lista `POCO_LIXO`, não vai ao inventário) · `capsula` (`kind 'capsula'`, `meta.poco = true`, só as
  que o jogador não tem; vão ao **Diário**, aba do Record) · `fragmento` (`fragmento_arcano`, faixa em `poco.quantidades`) ·
  `essencia` (todas as `essencia:*` ativas, exceto `meta.poco = false`) · `cosmetico` (**`item_defs` `kind 'cosmetico'` com
  `meta.poco = true`**, peso por raridade em `poco.raridade_pesos`, só os que o jogador não tem). Categoria sem item elegível
  vira fragmento.
- **Baldes:** `item_defs` `balde:<id>` (`kind 'outro'`, `meta.poco_balde`, `meta.tipo` inicial | normal | raro, `meta.mult_qtd`).
  Normais aparecem bloqueados; raros só aparecem depois de obtidos. Conceder um balde = `grantItem('balde:ferro')`.
- **Cápsulas:** `capsula:001…008` com `meta.titulo`/`meta.texto` **provisórios** (o dono escreve; editar pelo catálogo).
- **Owner:** o payload traz `owner { provisorio, probabilidades, manivela }`; a tela grava com `POST /api/staff
  {action:'config.definir', key:'poco.probabilidades', value, provisional: true}`.
- **Letreiro:** últimos 12 prêmios não-lixo revelados (30 dias), só nome do personagem; contas de teste ficam fora.
- **Cliente:** `components/devo/state/use-acesso.ts` (`useAcesso()`/`useEu()`, SWR de `/api/eu`) — candidato a uso comum dos
  outros sistemas; a home acende o emblema do Poço por `acesso.sistemas.poco` (`SYSTEM_OPEN` em `os/phone-shell.tsx`).
