# SPEC — Doação de horas e Caos e Ordem (DEVO v2)

Especificação da doação de Tempo entre jogadores e do sistema "caos e ordem" (honra e necro) no DEVO v2.
Base: pedido do dono em `PEDIDO-V2-dono.md` (31/10/2026, linhas 238-242), código atual das Corporações
(`lib/devo/corporacoes.ts`, `lib/devo/corporacoes-server.ts`), livro-caixa do Tempo
(`lib/devo/inventario-server.ts → creditMinutes`) e Torres (`lib/devo/torres/*`).

> **Harmonização de 01/11 (noite).** Esta spec é de 31/10. Duas trocas: (1) nada de pixel fora da Casa e das
> Torres, então o selo da faixa e o aviso de mudança ficam na interface gótica do DEVO (§5 corrigido, como pediu a
> `SPEC-VISITANTES.md` §8.1); (2) nomes: "Companhia" é como o dono e a tela chamam o grupo do jogador (código
> `corporacoes`, por isso "Corporação" no texto abaixo quer dizer a mesma coisa); "Companhia de Despertados" é a
> organização da equipe; "Hostil" é só o nome da faixa, e a visita de NPC hostil se chama `ameaca`
> (`SPEC-VISITANTES.md`). Não existe cidade: "no mapa" quer dizer dentro da Casa ou de uma Torre.

Convenções deste documento:
- Trechos em bloco de citação são **texto literal do dono**. Não reescrever.
- **PENDENTE** marca o que só o dono decide. Todo número que o dono não deu aparece como `X` no texto e como
  `null` + `provisional = true` no banco. Nada aqui é valor final.
- O dono avisou que esta parte "ainda está em construção". Por isso a spec entrega **estrutura e travas**;
  os valores e boa parte das consequências ficam em aberto.

---

## 1. Texto literal do dono

> "crie o sistema de doar suas horas a outro jogador, mas se fizer isso a alguém que não é da sua companhia,
> é crime, então você ganha mais pontos necro.."

> "mas o que são pontos necro? existe o sistema de "caos e ordem" onde determinadas ações te dão honra ou
> necro. como sabe as necro companhias são detestadas pela companhia dos records. isso afeta as Torres de
> companhia e se npcs se comportarão de forma hostil ou não."

> "essa parte ainda está em construção."

Pedido do dono que vale para este sistema também (mesmo arquivo, bloco final):

> "ou que um owner possa desfazer a ação de alguém ter enviado recompensa, etc."

O que o texto fixa, sem interpretação:
1. Existe doação de horas de um jogador para outro.
2. Doar para alguém fora da "sua companhia" é crime e dá pontos necro (o dono diz "mais pontos necro").
3. Existe o sistema "caos e ordem": ações dão honra ou necro.
4. Necro companhias são detestadas pela "companhia dos records".
5. Caos e ordem afeta as "Torres de companhia" e se os NPCs ficam hostis.

Tudo além disso, daqui para baixo, é **PROPOSTA** para o dono aprovar.

---

## 2. Termos e conflito com o que já existe

### 2.1 O que "companhia" quer dizer

O texto usa a palavra em dois sentidos:
- "a companhia dos records" = a **Companhia de Despertados**, a organização da equipe (Owner, Anfitrião etc.).
  É o nome que o código já usa (`corporacoes-server.ts`, mensagem `MOTIVO_TRANCADO`).
- "sua companhia" e "necro companhias" = a **Corporação** do jogador. No código, a classificação já se chama
  "Necro-Corporação" (`CLASSIFICACAO_ROTULO`).

**PROPOSTA:** "sua companhia" = a Corporação ativa de que o jogador é membro. Quem não está em Corporação
nenhuma não tem companhia; qualquer doação que ele faça conta como crime.
**PENDENTE (dono):** confirmar essa leitura e dizer se "Torres de companhia" são Torres novas por Corporação ou
as Torres atuais (que hoje não têm ligação com Corporações).

### 2.2 Necro do jogador × classificação da Corporação

Hoje "necro" é um estado da **Corporação** (`CorpClassificacao = 'oficial' | 'necro'`), e quem decide é só a
equipe: o servidor exige `corporacao.classificar` e um gatilho no banco reforça a regra
(`corporacoes-server.ts`, função `classificar`). O dono agora fala de **pontos necro por jogador**.

**PROPOSTA:** os pontos são do jogador e não mudam a classificação da Corporação por conta própria.
- A Mesa do Record mostra para a equipe a soma e a média de necro dos membros de cada Corporação, como sinal.
- Ao passar de um limiar (`X`), a Corporação entra numa fila "revisar classificação" na Mesa. A decisão
  continua manual, com justificativa, pelo mesmo `classificar` de hoje.
- Assim fica de pé a regra "só a equipe classifica", que hoje está no código e no banco.
**PENDENTE (dono):** se ele quiser reclassificação automática, isso muda a regra atual e precisa de aprovação
explícita.

---

## 3. Doação de horas

### 3.1 Fluxo para o jogador (celular, retrato)

1. No perfil de outro jogador (ou na lista da Corporação), botão **Doar horas**.
2. Tela de doação: campo de quantidade (em horas e minutos), saldo atual, limite do dia restante.
3. Se a doação conta como crime, aparece um aviso antes de confirmar, em destaque, com o efeito:
   "Essa pessoa não é da sua companhia. Doar para ela é crime e soma `X` de necro." Botão de confirmação
   separado ("Doar mesmo assim"), nunca o mesmo toque da doação comum.
4. Quem recebe vê um pedido e aceita ou recusa (**PROPOSTA**: sem aceite, ninguém recebe horas que não quer,
   e ninguém empurra necro para outra pessoa pela doação).
5. Se recusar ou não responder em `X` horas, o Tempo volta para quem doou.

### 3.2 Regras (PROPOSTAS, todos os valores pendentes)

| Regra | Valor |
|---|---|
| Doação mínima | `X` min |
| Limite por dia, para quem doa | `X` h |
| Limite por dia, para quem recebe | `X` h |
| Taxa da doação (Tempo que some) | `X` % |
| Carência depois de entrar numa Corporação para a doação contar como "dentro da companhia" | `X` dias |
| Prazo para aceitar | `X` h |
| Necro por doação criminosa | `X` (fixo) ou `X` por hora doada |
| Saldo mínimo que precisa sobrar em quem doa | `X` min |

### 3.3 Travas contra abuso

Cada brecha do texto do dono e o que fecha:

| Brecha | Trava proposta |
|---|---|
| (a) Conta alternativa criada só para receber horas | Conta precisa de `X` dias e de ter sobrevivido a `X` ciclos para receber; limite diário de quem recebe; a Mesa marca contas novas que recebem muito. |
| (b) Duas pessoas da mesma Corporação trocando horas em ciclo | Taxa por doação (o ciclo perde Tempo); limite diário dos dois lados; quem recebeu de alguém não devolve para a mesma pessoa por `X` dias. |
| (c) Entrar numa Corporação, receber e sair para escapar do crime | Carência de `X` dias antes de a doação contar como interna; se sair em até `X` dias depois de receber, a doação é reclassificada como crime para quem doou. **PENDENTE:** o dono decide se o necro também cai em quem recebeu. |
| (d) Alguém da mesma Corporação drenando um parceiro sob coação | Limite diário de quem doa; aviso para o líder da Corporação quando um membro doa mais de `X` h na semana; botão "denunciar" na doação recebida; Owner/Anfitrião pode desfazer. |
| (e) Usar a doação para burlar os timers do Tempo | Tempo recebido não passa do teto de saldo do jogador (`X`); limite por dia; as horas doadas saem do saldo de quem doa na hora, sem gerar Tempo novo. **PENDENTE:** o dono decide se doação vale durante um Deadly Vote ou outro evento com timer. |
| (f) Doar a alguém para empurrar necro nele | O necro do crime cai só em quem doa; quem recebe precisa aceitar (§3.1, passo 4). |

### 3.4 Servidor e banco

- Tabela `doacoes_tempo`: `id`, `de_id`, `para_id`, `minutos`, `taxa_minutos`, `mesma_companhia` (bool, no momento
  do envio), `corporacao_de` e `corporacao_para` (ids no momento do envio), `crime` (bool), `necro_aplicado`,
  `status` (`pendente | aceita | recusada | expirada | desfeita`), `created_at`, `decidida_at`,
  `desfeita_por`, `desfeita_nota`, `idem_key` único.
- Débito e crédito pelo livro-caixa do Tempo, na mesma transação, com `idem_key` (padrão de `creditar`
  em `corporacoes-server.ts`). O débito acontece no envio; o crédito, no aceite; a devolução, na recusa.
- **Desfazer** (Owner e Anfitrião): devolve o Tempo, remove o necro aplicado e grava em `admin_log` com nota
  obrigatória. Se quem recebeu já gastou, o saldo pode ficar negativo até `X` ou a equipe escolhe só remover o
  necro. **PENDENTE (dono).**
- Configuração em `devo_config` (`doacao.regras`), editável pelo Owner, com `provisional = true`.
- Migração nova: `scripts/doacao-ordem-migration.sql`, seguindo a rotina do `CLAUDE.md`. APIs devolvem 503
  `banco_desatualizado` quando faltar tabela.

---

## 4. Caos e Ordem

### 4.1 Modelo

**PROPOSTA:** dois contadores separados por jogador, **Honra** e **Necro**, os dois visíveis. Ganhar honra não
apaga necro. É o modelo de fama e infâmia de Fallout: New Vegas: alguém pode ser respeitado e temido ao mesmo
tempo, e o jogador entende por que um NPC reage de um jeito.

O estado que os NPCs e as Torres leem é derivado dos dois (**PENDENTE**: a fórmula e as faixas abaixo são só
estrutura):

| Faixa | Condição | Efeito proposto |
|---|---|---|
| Ordeiro | Honra ≥ `X` e Necro < `X` | NPCs da Companhia mais receptivos; diálogos extras. |
| Neutro | demais casos | Comportamento padrão. |
| Suspeito | Necro ≥ `X` | NPCs da Companhia frios; alguns diálogos fechados. |
| Hostil | Necro ≥ `X` e Necro > Honra + `X` | NPCs da Companhia hostis ("detestadas pela companhia dos records"); acesso a Torres de companhia limitado (**PENDENTE**). |

**PENDENTE (dono):** se Necro cai com o tempo (decaimento de `X` por semana, como o "heat" de jogos online) ou
só por ações de honra. A proposta é decair devagar, para ninguém ficar marcado para sempre por um erro antigo.

### 4.2 Tabela de ações

Só a doação criminosa vem do dono. As outras linhas são sugestões para ele aprovar ou cortar.

| Ação | Honra | Necro | Origem |
|---|---|---|---|
| Doar horas a alguém fora da sua companhia | — | `X` | dono |
| Doar horas a alguém da sua companhia | `X`? | — | proposta |
| Ser membro de uma Necro-Corporação (por semana) | — | `X` | proposta |
| Cumprir um pedido de NPC da Companhia | `X` | — | proposta |
| Trair um voto combinado no Deadly Vote | — | `X` | proposta |
| Denúncia confirmada pela equipe contra o jogador | — | `X` | proposta |

### 4.3 NPCs

- Cada NPC tem um campo `lado` (`companhia | necro | neutro`) no registro de cenas. NPCs da Companhia reagem à
  faixa do jogador; NPCs do lado necro reagem ao contrário (**PENDENTE**: se existem NPCs do lado necro).
- No motor de diálogo (`lib/devo/dialogo/*`), uma condição nova `ordem.faixa` deixa a cena escolher falas.
  Nenhuma fala nova é escrita aqui: as falas são do dono ou da narrativa aprovada.
- Na Casa e nas Torres, a pose do NPC em cena muda com a faixa (braços cruzados, de costas), sem bloquear sistemas
  essenciais. **Nenhuma função atual pode ficar inacessível por causa do necro** sem o dono decidir isso.

### 4.4 Torres de companhia

**PENDENTE (dono):** o texto diz que caos e ordem "afeta as Torres de companhia", sem dizer como. Até ele
definir, a spec só reserva o gancho: a Torre lê a faixa do jogador e a soma da Corporação, e o efeito fica
vazio no `conteudo.json` (`ordem: null`).

---

## 5. Telas (celular primeiro)

- **Selo no HUD:** um emblema pequeno ao lado da pílula do Tempo, na família de emblemas da `BIBLIA.md` §5 (traço
  claro, simetria; nada de pixel), com a faixa atual (balança para Ordeiro,
  caveira para Hostil). Toque abre o detalhe.
- **Tela "Caos e Ordem":** os dois contadores, a faixa, o que ela faz agora e o **histórico** ("por que ganhei
  necro": ação, data, valor, e se foi desfeita pela equipe). Inspirado no aviso gradual do Honor de Red Dead
  Redemption 2: o jogador sempre vê o efeito antes de cair de faixa.
- **Aviso de mudança de faixa:** uma vez por mudança. No celular, placa diagonal com o emblema da faixa (interface
  do DEVO); dentro da Casa ou de uma Torre, caixa de VN pintada.
- **Mesa do Record (equipe):** lista de doações com filtro (crime, contas novas, valores altos), botão Desfazer,
  painel de necro por Corporação e a fila de "revisar classificação".
- Desktop: as mesmas telas, em painel lateral.

---

## 6. Pendências para o dono

1. Confirmar que "sua companhia" = a Corporação do jogador (§2.1).
2. Pontos necro só sinalizam para a equipe, ou reclassificam a Corporação sozinhos? (§2.2)
3. Todos os valores `X` das §3.2, §4.1 e §4.2.
4. Necro também cai em quem recebe numa doação criminosa? (§3.3 c/f)
5. Doação vale durante Deadly Vote e eventos com timer? (§3.3 e)
6. Necro decai com o tempo? (§4.1)
7. O que exatamente muda nas Torres de companhia (§4.4) e se existem NPCs do lado necro (§4.3).
8. Aprovar ou cortar as ações propostas da §4.2.

---

## Decisões de revisão

Crítica recebida (nota 0) e o que foi feito:

1. **"O arquivo não existe."** Procede. Esta versão é a primeira escrita da spec, feita já com a crítica em
   mãos.
2. **"A tarefa não bate com o pedido do usuário nesta rodada ('crie um mod para abrir navegador')."**
   Procede, e não cabe a este documento resolver. O passo atribuído foi só esta spec, com saída restrita a
   `docs/redesign/v2/`; criar um mod (mudança na interface do Claude) fica fora disso. Registrado para o
   orquestrador confirmar com o dono qual era o pedido.
3. **Partir do texto literal e marcar o resto como pendência.** Aplicado: §1 traz o texto literal, incluindo
   "essa parte ainda está em construção"; todo o resto está marcado como PROPOSTA ou PENDENTE, com valores `X`.
4. **Conflito com a classificação necro das Corporações.** Aplicado em §2.2: os pontos do jogador ficam como
   sinal para a equipe; a regra "só a equipe classifica" (servidor + gatilho) não muda sem aprovação do dono.
   §2.1 trata "companhia" × "Corporação" × "Companhia de Despertados".
5. **Brechas (a)–(f).** Aplicado na tabela da §3.3, uma trava por brecha.
6. **Registro, limite, carência, aceite e desfazer.** Aplicado em §3.1, §3.2 e §3.4.
7. **Eixo único ou dois contadores.** Escolhi dois contadores (§4.1). Um eixo único faz uma ação boa apagar uma
   criminosa, o que esconde da equipe quem cometeu crime e tira o sentido do histórico. Com dois contadores, a
   faixa derivada ainda dá aos NPCs um estado único para ler.
8. **Selo no HUD, histórico e aviso antes do crime.** Aplicado em §3.1 (passo 3) e §5.
9. **Ponto em que discordei em parte:** a crítica sugere que o necro "decai com o tempo" como regra. Deixei
   como proposta pendente (§4.1), não como regra, porque muda o peso do crime e o dono ainda está desenhando
   esta parte.
