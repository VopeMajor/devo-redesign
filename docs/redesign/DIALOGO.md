# Motor de diálogo do DEVO (Narrativa) — formato e API

Para Poço, Torres, Salão, Corporações e qualquer sistema com conversa encenada. **O formato é estável**: só
acréscimos compatíveis. Dono do motor: agente Narrativa (branch `sys/narrativa`).

## 1. Onde fica

| Arquivo | O que é |
|---|---|
| `lib/devo/dialogo/formato.ts` | Tipos puros: `Cena`, `Passo`, `Opcao`, `Efeito`, `Palco`, progresso. Cliente e servidor importam. |
| `lib/devo/dialogo/autor.ts` | Atalhos para escrever: `narra`, `fala`, `eu`, `pensa`, `som`, `sistema`, `escolha`, `opcao`, `efeito`, `ir`. |
| `lib/devo/dialogo/cenas/<id>.ts` | Uma cena por arquivo (texto do dono **literal**). |
| `lib/devo/dialogo/registro.ts` | Registro: **uma linha por cena** (o servidor só aceita cenas registradas). |
| `lib/devo/dialogo/dialogo-server.ts` | Servidor: progresso, escolhas, efeitos uma vez só. |
| `app/api/dialogo/route.ts` | API HTTP. |
| `components/devo/dialogo/` | Motor visual (`CenaDialogo`), palco, holograma da Melissa, linha do destino, host global (`useCenas`). |
| `scripts/narrativa-migration.sql` | `dialog_progress`, `dialog_events`, configs provisórias. |

## 2. Como escrever uma cena

Transcreva o texto do dono como está; só mude a **forma**:

| No texto do dono | No formato |
|---|---|
| `[Relações são complicadas]` | `narra('Relações são complicadas')` (sem os colchetes; o motor desenha colchetes de aço) |
| `[ … ]` | `narra('…')` |
| `"Que estranho. Alguém veio me visitar?"` | `pensa('Que estranho. Alguém veio me visitar?')` (sem as aspas; o motor desenha) |
| fala de NPC (`— E aí, pé de caju.`) | `fala('galo', 'E aí, pé de caju.')` (sem o travessão; a placa diz quem fala) |
| fala do jogador sem opção | `eu('Finalmente em casa.')` |
| `*Som de porta abrindo*` | `som('Som de porta abrindo', 'porta')` (legenda + som) |
| `[No meio da noite, a campainha toca] *Som*` | `narra('No meio da noite, a campainha toca', { som: 'campainha', fx: 'campainha' })` |
| `[A luz pisca]` | `narra('A luz pisca', { fx: 'luz-pisca', som: 'luz' })` |
| bloco "**Sistema de Karma**" / `[Torre de Ruptura]` + texto | `sistema('Sistema de Karma', ['parágrafo 1', 'parágrafo 2'])` |
| `Jogador: 1 — … 2 — …` + `Respostas: 1 — …` | `escolha('id', [opcao('texto 1', [fala('galo', 'resposta 1')]), 'texto 2'])` |
| opção em negrito (`**Ir abrir a porta**`) | `{ texto: 'Ir abrir a porta', acao: true }` |
| "Galo transferiu X quantidade de tempo" | `opcao('Galo…?', [narra('Galo transferiu {tempo} de tempo para você')], { efeitos: [{ tipo: 'tempo', minutos: 60, config: 'narrativa.galo_casa.tempo_min' }] })` |
| "(se houver) … aparecer bloqueado" | `{ texto: 'Usar moeda especial', requer: { item: 'dracma_incomum', motivo: 'Você não tem moeda especial.' } }` |
| "Todos exceto 4 — Encerra interação" | `opcao('…', [], { ir: 'fim' })` |
| "2 — pula o quadro seguinte" | `opcao('Sim, por favor.', [], { ir: 'id-do-quadro-depois' })` |
| `[Você recebeu um Dracma de Raridade Incomum]` | `efeito('dracma', [{ tipo: 'item', item: 'dracma_incomum' }], 'Dracma de Raridade Incomum')` + a `narra` do texto |

Texto aceita: `{nome}`, gênero `{o|a}` (DIRECAO-3 §7 — marque tudo que concorda com o JOGADOR),
`*ênfase*` (itálico) e `[rubrica]` dentro de uma fala (`'Escuta. [Ele tem uma lata na mão] Eu vou…'`).

### Passos (`Passo`)
`fala` · `narra` · `pensa` · `som` · `sistema` · `escolha` (id obrigatório; `modo: 'uma'` padrão, ou `'explorar'`
para ver várias opções antes de seguir) · `efeito` (id obrigatório) · `ir`.
Todo passo aceita `id`, `som`, `fx` (`luz-pisca`, `porta-abre`, `porta-fecha`, `campainha`, `escurece`,
`revela`, `tremor`) e `palco` (`npc`, `expressao`, `cenario`, `destino`, `holo`), que **persiste** nos passos
seguintes até outro passo mudar.

### Efeitos (`Efeito`) — aplicados no servidor, uma vez por jogador
- `{ tipo: 'tempo', minutos, config? }` — + dá, − tira. `config` = chave em `devo_config` (Owner edita; o número
  da cena é o padrão). Valor não definido pelo dono → config **provisória** na sua migração.
- `{ tipo: 'karma', delta }` — + ordem, − caos (`adjustKarma` com idem).
- `{ tipo: 'item', item, quantidade? }` — inventário da Fundação; quantidade negativa consome (sem saldo → a
  escolha falha com 409 e nada muda).
- `{ tipo: 'flag', flag }` — `grantUnlock(..., 'narrativa')`.
- `{ tipo: 'contato', npc }` — o NPC passa a existir em Mensagens.

**Recarregar não repete nada**: `dialog_events` tem chave primária (jogador, cena, chave). Em escolha de uma
opção só, **a primeira escolha vale** (se o jogador recarregar e tentar outra, o servidor devolve a original).

### Cenários (`cenario`)
`casa-noite`, `holograma`, `nevoa`, `salao`, `torres`, `sobreposto` (só escurece a tela atrás — reflexões
curtas), `escuro`. Cenário novo: acrescente em `components/devo/dialogo/palco.tsx` (um `case`).

### Elenco
`elenco: { galo: { nome: 'O Galo', npc: 'galo', titulo: 'Anfitrião' } }`. O retrato vem de `npcPortrait(npc,
expressao)` (lib/devo/npcs.ts; vocabulário de expressões do Elenco). Sem retrato → silhueta (Corvo).

## 3. Registrar e abrir

1. `lib/devo/dialogo/cenas/minha-cena.ts` exporta `CENA_MINHA: Cena`.
2. Uma linha em `lib/devo/dialogo/registro.ts` (`LISTA`).
3. No componente:

```tsx
import { useCenas } from '@/components/devo/dialogo'
const cenas = useCenas()
cenas.abrir('minha-cena', { seNaoVista: true, aoFim: () => … })   // seNaoVista: só abre se nunca terminou
cenas.vista('minha-cena')                                         // boolean (resumo do servidor)
```

Ou embutido numa tela própria: `<CenaDialogo cena="minha-cena" onFim={…} />`.

O host (`CenasHost`) já está montado no sistema (fase `os`). A cena abre por cima de tudo, retoma no passo em que
parou (servidor), aplica efeitos pela API e soma o Tempo no relógio do cliente. "Sair" fecha e guarda o passo.

## 4. API HTTP (`/api/dialogo`)

| Chamada | Resposta |
|---|---|
| `GET /api/dialogo` | `{ cenas: { [id]: { passo, fim } } }` |
| `GET /api/dialogo?cena=<id>` | `CenaEstado`: `{ progresso: { passo, fim, escolhas, efeitos }, tempos, itens, destino }` |
| `POST {action:'passo', cena, passo}` | `{ ok }` |
| `POST {action:'escolher', cena, escolha, opcao}` (opcao 0-based) | `EfeitoAplicado`: `{ ok, opcao, aplicados, timeDeltaMs, contatos }` |
| `POST {action:'efeito', cena, efeito}` | `EfeitoAplicado` |
| `POST {action:'concluir', cena}` | `EfeitoAplicado` (aplica `aoConcluir`) |

Cena com `requer: <flag>` → 403 para quem não tem a flag (Owner/Anfitrião passam). No servidor:
`cenaVista(playerId, id)` em `dialogo-server.ts`.

## 5. Gatilhos já prontos (Narrativa)

| Cena | Quando | Quem chama |
|---|---|---|
| `galo-casa` (Karma) | Flag `galo_casa` + jogador abriu ≥ N sistemas novos (`narrativa.galo_casa.explorar_min`, provisório = 2). Aparece o cartão "Ir para casa" na home e um aviso. | Narrativa (automático) |
| `melissa-corporacoes` | Depois de `galo-casa` terminada, ao voltar à home (chamada holográfica); ou na 1ª entrada em Corporações. Ao concluir libera a flag `corporacoes`. | Narrativa + agente Corporações: `cenas.abrir('melissa-corporacoes', { seNaoVista: true })` |
| `reflexao-anfitriao` | Ao sair da aba de Torres pela primeira vez. | Agente Torres: `cenas.abrir('reflexao-anfitriao', { seNaoVista: true })` |

**Melissa = Companhia de Despertados.** Sempre que o assunto for a Companhia, use o cenário `holograma` (chamada
+ projeção) ou, fora de uma cena, `<ChamadaMelissa />` / `<HologramaMelissa />` de `components/devo/dialogo`.
