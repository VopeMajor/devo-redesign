/**
 * FORMATO DE CENA DO DEVO (motor de diálogo reutilizável). Puro: o cliente e o servidor importam.
 * Documentação para quem escreve cenas: docs/redesign/DIALOGO.md.
 *
 * Uma cena é DADO (JSON serializável): lista de passos lidos em ordem. O servidor guarda em que passo o
 * jogador parou e aplica os efeitos (Tempo, karma, itens, flags, contatos) UMA vez só — o cliente nunca
 * manda o efeito, só "escolhi a opção N da escolha X"; o servidor procura o efeito na própria cena.
 *
 * Mudanças neste arquivo devem ser só ACRÉSCIMOS compatíveis (outros sistemas já escrevem cenas).
 */
import type { UnlockFlag } from '../progresso'

/**
 * Quem fala numa `fala`:
 * - `'jogador'` — o próprio Record (placa com o nome do personagem);
 * - um id do elenco da cena (`cena.elenco`), normalmente o id do NPC em lib/devo/npcs.ts (`galo`, `melissa`, `corvo`…).
 * Narração (texto entre colchetes no original), pensamento (entre aspas) e caixa de sistema têm passos próprios.
 */
export type Quem = 'jogador' | (string & {})

/** Efeito visual momentâneo no palco quando o passo aparece. */
export type Fx =
  /** "[A luz pisca]": a cena apaga e acende duas vezes. */
  | 'luz-pisca'
  /** Porta abrindo/fechando: faixa de luz vertical que se abre/fecha. */
  | 'porta-abre'
  | 'porta-fecha'
  /** Campainha: a tela vibra de leve e o som toca. */
  | 'campainha'
  /** Escurece o palco (sono, pesadelo). */
  | 'escurece'
  /** Clarão de revelação (alguém aparece, item recebido). */
  | 'revela'
  /** Tremor curto. */
  | 'tremor'

/** Som do motor (sintetizado em lib/devo/audio.ts). Nomes livres caem num som neutro. */
export type SomId = 'porta' | 'campainha' | 'luz' | 'passos' | 'chamada' | 'holograma' | 'item' | 'tempo' | 'sistema' | (string & {})

/** Demonstração da linha do destino (Karma) no palco. `'seu'` mostra o destino real do jogador (sem número). */
export type DestinoDemo = 'neutro' | 'ordem' | 'caos' | 'ambos' | 'seu' | null

/** Estado do holograma da Melissa (cenário `holograma`). */
export type HoloFase = 'chamada' | 'materializa' | 'ativo' | 'encerra' | null

/**
 * Mudança de palco que acompanha um passo. Persiste para os passos seguintes (até outro passo mudar),
 * exceto `fx` e `som`, que são momentâneos.
 */
export type Palco = {
  /** NPC em cena (id do elenco) ou `null` para ninguém. */
  npc?: string | null
  /** Expressão do NPC em cena (vocabulário de lib/devo/npcs.ts; cai para a de repouso se não existir). */
  expressao?: string
  /** Troca de cenário no meio da cena. */
  cenario?: CenarioId
  /** Linha do destino visível no palco (Karma). */
  destino?: DestinoDemo
  /** Holograma da Melissa. */
  holo?: HoloFase
}

/**
 * Efeito com consequência real (aplicado no servidor, uma vez por jogador; recarregar não repete).
 * - `tempo`: minutos (+ dá, − tira). `config` = chave em `devo_config` que substitui o número (Owner edita;
 *   valores do dono ainda não definidos ficam marcados "provisório"). No texto, `{tempo}` mostra o valor.
 * - `karma`: + ordem, − caos (o jogador nunca vê o número).
 * - `item`: pelo inventário da Fundação (`quantidade` negativa consome; sem saldo → a escolha falha).
 * - `flag`: desbloqueio (`grantUnlock(..., 'narrativa')`).
 * - `contato`: o NPC passa a existir em Mensagens.
 */
export type Efeito =
  | { tipo: 'tempo'; minutos: number; config?: string }
  | { tipo: 'karma'; delta: number }
  | { tipo: 'item'; item: string; quantidade?: number }
  | { tipo: 'flag'; flag: UnlockFlag }
  | { tipo: 'contato'; npc: string }

/** Campos comuns a todo passo. */
type Base = {
  /** Rótulo para `ir`/`opcao.ir` (único na cena). Obrigatório em `escolha` e `efeito`. */
  id?: string
  palco?: Palco
  fx?: Fx
  /** Som tocado quando o passo aparece (sem legenda). */
  som?: SomId
}

/**
 * Passos. Texto aceita os marcadores do jogador (`{nome}`, `{o|a}` — DIRECAO-3 §7), `*ênfase*` (itálico)
 * e `[rubrica]` dentro de uma fala (ex.: "Escuta. [Ele tem uma lata na mão] Eu vou…").
 */
export type Passo =
  /** Fala de alguém. `nome` troca a placa só neste passo (ex.: "Anfitrião" antes de se apresentar). */
  | (Base & { tipo: 'fala'; quem: Quem; texto: string; nome?: string; expressao?: string })
  /** Narração: o "[texto entre colchetes]" do original, guardado SEM os colchetes. "[ … ]" = narra('…'). */
  | (Base & { tipo: 'narra'; texto: string })
  /** Pensamento do jogador: o "texto entre aspas" do original, guardado SEM as aspas. */
  | (Base & { tipo: 'pensa'; texto: string })
  /** Legenda de som: "*Som de porta abrindo*" → `{ tipo: 'som', texto: 'Som de porta abrindo', som: 'porta' }`. */
  | (Base & { tipo: 'som'; texto: string })
  /** Caixa de sistema com título (ex.: o bloco "Sistema de Karma", "[Torre de Ruptura]"). */
  | (Base & { tipo: 'sistema'; titulo?: string; texto: string | string[] })
  /** Escolhas numeradas do jogador (`id` obrigatório). */
  | (Base & { tipo: 'escolha'; id: string; opcoes: Opcao[]; modo?: 'uma' | 'explorar'; pergunta?: string })
  /** Efeito fora de escolha (ex.: "[Você recebeu um Dracma de Raridade Incomum]"). `aviso` aparece num selo. */
  | (Base & { tipo: 'efeito'; id: string; efeitos: Efeito[]; aviso?: string })
  /** Salta para o passo com esse `id` (ou `'fim'`). */
  | (Base & { tipo: 'ir'; para: string })

/** Passos que podem ser resposta de uma opção (só exibição; efeitos ficam na opção). */
export type PassoResposta = Extract<Passo, { tipo: 'fala' | 'narra' | 'pensa' | 'som' | 'sistema' }>

export type Opcao = {
  /** Texto da opção (pode ter `{o|a}`). Negrito no original (`**Ir abrir a porta**`) = `acao: true`. */
  texto: string
  acao?: boolean
  /** Respostas desta opção, mostradas logo depois dela. */
  respostas?: PassoResposta[]
  /** Consequências reais (servidor, uma vez). */
  efeitos?: Efeito[]
  /** Depois das respostas, salta para este passo (ou `'fim'`). Sem `ir`, segue para o passo seguinte. */
  ir?: string
  /**
   * Só pode ser escolhida com este item no inventário (ex.: "moeda especial (se houver)").
   * Sem o item, aparece escura e trancada, com `motivo`.
   */
  requer?: { item: string; quantidade?: number; motivo?: string }
}

/** Cenários prontos do motor (fundo do palco). Acrescente novos em components/devo/dialogo/palco.tsx. */
export type CenarioId =
  /** Casa do jogador à noite (Galo — Karma). */
  | 'casa-noite'
  /** Holograma da Melissa (Companhia de Despertados): quarto escuro + projeção. */
  | 'holograma'
  /** Rua de barro enevoada (Poço). */
  | 'nevoa'
  /** Salão escuro com cortina (Salão das Máscaras). */
  | 'salao'
  /** Pátio das torres (Torres de Ruptura). */
  | 'torres'
  /** Sem cenário: escurece o que está atrás (reflexões curtas por cima de uma tela). */
  | 'sobreposto'
  /** Breu. */
  | 'escuro'

/**
 * Condições de história (lib/devo/dialogo/dialogo-server.ts → condicaoCumprida):
 * - `devolveu-e-dv`: devolveu as Cartas Iniciais à Melissa no prólogo E já terminou o primeiro Deadly Vote.
 */
export type CondicaoCena = 'devolveu-e-dv'

export type MembroElenco = {
  /** Nome na placa. */
  nome: string
  /** Id do retrato em lib/devo/npcs.ts (padrão: a própria chave). Sem retrato → silhueta. */
  npc?: string
  /** Subtítulo da placa (ex.: "Anfitrião"). */
  titulo?: string
}

export type Cena = {
  /** Id estável (vai para o banco): minúsculas, números e hífen. */
  id: string
  titulo: string
  /** Rótulo no topo (ex.: "Karma", "Companhia de Despertados"). */
  capitulo?: string
  cenario: CenarioId
  elenco?: Record<string, MembroElenco>
  /** Flag exigida para abrir a cena (o servidor confere; Owner/Anfitrião sempre podem). */
  requer?: UnlockFlag
  /**
   * Condição de história conferida no servidor (além de `requer`); a cena só abre quando ela vale e aparece em
   * `disponiveis` no resumo (GET /api/dialogo) para o cliente puxar sozinho. Owner/Anfitrião sempre podem.
   */
  condicao?: CondicaoCena
  /** Efeitos ao terminar (uma vez). */
  aoConcluir?: Efeito[]
  /** Pode ser fechada no meio e retomada depois (padrão true). Reflexões curtas usam false. */
  retomavel?: boolean
  passos: Passo[]
}

/* ------------------------------------------------------------------ Progresso (API) */

/** Progresso de uma cena no servidor. `escolhas[id]` = opções já feitas (na ordem). */
export type ProgressoCena = {
  passo: number
  fim: boolean
  escolhas: Record<string, number[]>
  /** Efeitos (`efeito` passos) já aplicados, por id. */
  efeitos: string[]
}

/** GET /api/dialogo?cena=<id> */
export type CenaEstado = {
  progresso: ProgressoCena
  /** Valor final de cada efeito de Tempo, por chave `escolhaId:opcao` ou `efeitoId` (já com a config). */
  tempos: Record<string, number>
  /** Itens exigidos por opções (`requer`) que o jogador tem: chave → saldo. */
  itens: Record<string, number>
  /** Linha do destino do jogador (sem número). */
  destino: { direcao: 'ordem' | 'equilibrio' | 'caos'; intensidade: 0 | 1 | 2 | 3 }
}

/** Resposta de escolher/efeito/concluir. */
export type EfeitoAplicado = {
  ok: true
  /** Opção que vale (em escolha `uma`, a primeira feita; recarregar não troca). */
  opcao?: number
  /** Efeitos aplicados AGORA (vazio se já tinham sido aplicados antes). */
  aplicados: Efeito[]
  /** Tempo a somar no relógio do cliente (ms). */
  timeDeltaMs: number
  /** Contatos novos para Mensagens. */
  contatos: string[]
}

export const CENA_ID_RE = /^[a-z0-9-]{2,60}$/

/** Formata minutos para texto: 60 → "1 hora"; 90 → "1h30"; 30 → "30 minutos". */
export function formatTempo(min: number) {
  const m = Math.abs(Math.round(min))
  if (m < 60) return `${m} ${m === 1 ? 'minuto' : 'minutos'}`
  const h = Math.floor(m / 60)
  const r = m % 60
  if (!r) return `${h} ${h === 1 ? 'hora' : 'horas'}`
  return `${h}h${String(r).padStart(2, '0')}`
}

/** Chave do evento de um efeito: escolha em modo `uma` → `e:<id>`; `explorar` → `e:<id>:<n>`; efeito → `p:<id>`. */
export function chaveEscolha(passo: Extract<Passo, { tipo: 'escolha' }>, opcao: number) {
  return passo.modo === 'explorar' ? `e:${passo.id}:${opcao}` : `e:${passo.id}`
}
