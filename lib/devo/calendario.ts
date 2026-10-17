/**
 * Grandioso Calendário Devo — arquivo PURO (cliente e servidor importam): tipos, rótulos das recompensas,
 * datas no horário de Brasília e ocorrências de eventos (inclusive anuais). Contrato: docs/redesign/FUNDACAO.md §15.
 */
import type { Rarity } from './types'

export const TZ = 'America/Sao_Paulo'

export type Enfase = 'atencao' | 'folga' | 'normal'
export const ENFASES: Enfase[] = ['atencao', 'folga', 'normal']
export const ENFASE_ROTULO: Record<Enfase, string> = { atencao: 'Fique atento', folga: 'Dia de folga', normal: 'Programado' }
export const isEnfase = (v: unknown): v is Enfase => (ENFASES as unknown[]).includes(v)

/** Recompensa de check-in. `item` usa o catálogo da Fundação (fragmento_arcano, dracma_comum, dracma_incomum…). */
export type Recompensa =
  | { tipo: 'pp'; quantidade: number }
  | { tipo: 'item'; item: string; quantidade: number }
  | { tipo: 'tempo'; minutos: number }
  | { tipo: 'carta'; raridade: Rarity }

/** Ícone desenhado no cliente para cada recompensa. */
export type IconeRecompensa = 'pp' | 'fragmento' | 'tempo' | 'dracma_comum' | 'dracma_incomum' | 'carta' | 'item'

export type RecompensaVista = {
  recompensa: Recompensa
  /** Texto do dono ("+2 Fragmentos Arcanos", "Carta Incomum"). */
  rotulo: string
  /** Para a tira (cabe em 78 px): valor + legenda. */
  valor: string
  legenda: string
  icone: IconeRecompensa
}

const RARIDADE_CARTA: Record<string, string> = { comum: 'Comum', incomum: 'Incomum', rara: 'Rara', lendaria: 'Lendária' }
const ITEM_NOME: Record<string, [string, string, IconeRecompensa]> = {
  fragmento_arcano: ['Fragmento Arcano', 'Fragmentos Arcanos', 'fragmento'],
  dracma_comum: ['Dracma Comum', 'Dracmas Comuns', 'dracma_comum'],
  dracma_incomum: ['Dracma Incomum', 'Dracmas Incomuns', 'dracma_incomum'],
}

/** Rótulos no texto do dono (CALENDARIO-dono.md). `nomes` = nomes do catálogo para itens fora da lista. */
export function verRecompensa(r: Recompensa, nomes?: Record<string, string>): RecompensaVista {
  switch (r.tipo) {
    case 'pp':
      return { recompensa: r, rotulo: `${r.quantidade} PP`, valor: String(r.quantidade), legenda: 'PP', icone: 'pp' }
    case 'tempo': {
      const h = r.minutos / 60
      const inteiro = Number.isInteger(h)
      const v = inteiro ? `+${h}h` : `+${r.minutos}min`
      const rotulo = inteiro ? `+${h} ${h === 1 ? 'Hora' : 'Horas'}` : `+${r.minutos} Minutos`
      return { recompensa: r, rotulo, valor: v, legenda: inteiro ? (h === 1 ? 'Hora' : 'Horas') : 'Tempo', icone: 'tempo' }
    }
    case 'carta': {
      const rar = RARIDADE_CARTA[r.raridade] ?? r.raridade
      return { recompensa: r, rotulo: `Carta ${rar}`, valor: '1', legenda: `Carta ${rar}`, icone: 'carta' }
    }
    case 'item': {
      const known = ITEM_NOME[r.item]
      const nome = known ? (r.quantidade === 1 ? known[0] : known[1]) : (nomes?.[r.item] ?? r.item)
      const curto = known ? (known[2] === 'fragmento' ? 'Fragm. Arcanos' : known[2] === 'dracma_comum' ? 'Dracmas Comuns' : 'Dracmas Incomuns') : nome
      return { recompensa: r, rotulo: `+${r.quantidade} ${nome}`, valor: `+${r.quantidade}`, legenda: r.quantidade === 1 && known ? known[0] : curto, icone: known?.[2] ?? 'item' }
    }
  }
}

/* ------------------------------------------------------------------ Datas (AAAA-MM-DD, Brasília) */

export type Dia = string

/** Hoje (ou o instante `ms`) no horário de Brasília, como AAAA-MM-DD. */
export function diaDe(ms: number = Date.now()): Dia {
  return new Date(ms).toLocaleDateString('en-CA', { timeZone: TZ })
}

const parse = (d: Dia) => {
  const [y, m, dd] = d.split('-').map(Number)
  return Date.UTC(y, m - 1, dd)
}
const fmt = (ms: number) => new Date(ms).toISOString().slice(0, 10)
export const somaDias = (d: Dia, n: number): Dia => fmt(parse(d) + n * 86_400_000)
export const diasEntre = (a: Dia, b: Dia) => Math.round((parse(b) - parse(a)) / 86_400_000)
export const diaValido = (v: unknown): v is Dia => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && fmt(parse(v)) === v

/** Dia da semana (0 = domingo) de um AAAA-MM-DD. */
export const diaDaSemana = (d: Dia) => new Date(parse(d)).getUTCDay()

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
export const SEMANA_CURTA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
export const nomeMes = (m: number) => MESES[m - 1] ?? ''
export const mesCurto = (m: number) => MESES_CURTOS[m - 1] ?? ''
export const partes = (d: Dia) => {
  const [y, m, dd] = d.split('-').map(Number)
  return { ano: y, mes: m, dia: dd }
}
/** "sábado, 17 de outubro" */
export function dataLonga(d: Dia) {
  const p = partes(d)
  return `${SEMANA[diaDaSemana(d)]}, ${p.dia} de ${nomeMes(p.mes)}`
}
/** "25 dez" ou "06–09 fev" */
export function dataCurtaFaixa(inicio: Dia, fim: Dia) {
  const a = partes(inicio)
  const b = partes(fim)
  if (inicio === fim) return `${String(a.dia).padStart(2, '0')} ${mesCurto(a.mes)}`
  if (a.mes === b.mes) return `${String(a.dia).padStart(2, '0')}–${String(b.dia).padStart(2, '0')} ${mesCurto(a.mes)}`
  return `${String(a.dia).padStart(2, '0')} ${mesCurto(a.mes)} – ${String(b.dia).padStart(2, '0')} ${mesCurto(b.mes)}`
}

/* ------------------------------------------------------------------ Eventos e ocorrências */

export type CheckinEvento = { titulo: string; recompensas: Recompensa[] }

export type EventoBase = {
  id: string
  titulo: string
  descricao: string
  inicio: Dia
  fim: Dia
  anual: boolean
  enfase: Enfase
  arte: string | null
  checkin: CheckinEvento | null
}

/** Uma ocorrência concreta de um evento (o anual vira uma por ano). */
export type Ocorrencia = EventoBase & { ocorrencia: Dia; ate: Dia }

/** Ocorrências de um evento que tocam o intervalo [de, ate]. Anual em 29/02: só nos anos bissextos. */
export function ocorrencias(e: EventoBase, de: Dia, ate: Dia): Ocorrencia[] {
  const dur = diasEntre(e.inicio, e.fim)
  const out: Ocorrencia[] = []
  const add = (ini: Dia) => {
    const fim = somaDias(ini, dur)
    if (fim >= de && ini <= ate) out.push({ ...e, ocorrencia: ini, ate: fim })
  }
  if (!e.anual) {
    add(e.inicio)
    return out
  }
  const base = partes(e.inicio)
  const md = e.inicio.slice(5)
  for (let y = Math.max(base.ano, partes(de).ano - 1); y <= partes(ate).ano; y++) {
    const ini = `${y}-${md}`
    if (diaValido(ini)) add(ini)
  }
  return out
}

/** Ocorrência ativa no dia `d` (ou null). */
export function ocorrenciaEm(e: EventoBase, d: Dia): Ocorrencia | null {
  return ocorrencias(e, d, d)[0] ?? null
}

/* ------------------------------------------------------------------ Payloads */

export type EventoVista = Ocorrencia & {
  /** Dias até começar (0 = hoje; negativo = já começou e ainda está acontecendo). */
  emDias: number
  /** Nome de quem criou (só na Mesa). */
  autor?: string | null
}

export type SlotEstado = 'feito' | 'hoje' | 'proximo'
export type CheckinSlot = { posicao: number; recompensa: RecompensaVista; estado: SlotEstado }

export type CheckinDiario = {
  /** Posição do ciclo de hoje (a resgatar, ou já resgatada hoje). */
  posicao: number
  feitoHoje: boolean
  slots: CheckinSlot[]
  /** Regra de falta em vigor. */
  falta: 'pausa' | 'reinicia'
  /** Check-ins diários feitos (total). */
  total: number
  /** Próxima virada do dia (meia-noite de Brasília), em ms. */
  proximoDiaEm: number
}

export type CheckinExtra = {
  eventoId: string
  titulo: string
  evento: string
  enfase: Enfase
  ocorrencia: Dia
  ate: Dia
  feitoHoje: boolean
  posicao: number
  slots: CheckinSlot[]
}

export type CalendarioPayload =
  | { liberado: false; motivo: string }
  | {
      liberado: true
      hoje: Dia
      eventos: EventoVista[]
      diario: CheckinDiario
      extras: CheckinExtra[]
      /** Owner/Anfitrião (mostra o atalho para a Mesa). */
      podeEditar: boolean
      /** Owner/Anfitrião: tutorial pode ser pulado. */
      podePular: boolean
      /** Tempo creditado por check-ins anteriores ainda não aplicado ao relógio. */
      timeDeltaMs?: number
      cartasPendentes: number
    }

export type ResgateResultado = {
  ok: true
  tipo: 'diario' | 'evento'
  posicao: number
  recompensa: RecompensaVista
  /** P.P. que couberam no teto do Estágio (só pp); id da carta sorteada (só carta). */
  aplicado: { pp?: number; virtude?: string; cartaId?: string; saldo?: number; minutos?: number }
  timeDeltaMs: number
}

/** Mesa › Calendário (Owner/Anfitrião). */
export type CalendarioMesa = {
  eventos: (EventoBase & { autor: string | null; atualizadoEm: number })[]
  ciclo: RecompensaVista[]
  regras: { falta: 'pausa' | 'reinicia'; ppVirtude: string; ppVirtudePadrao: string; provisorio: boolean }
  podeRecompensas: boolean
  hoje: Dia
  /** Check-ins de hoje (contagem) para o resumo. */
  checkinsHoje: number
}
