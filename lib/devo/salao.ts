/**
 * Salão das Máscaras — tipos, calendário e regras puras (cliente e servidor podem importar; sem banco).
 * Contrato: docs/redesign/FUNDACAO.md §11. O servidor (lib/devo/salao-server.ts) decide tudo; o cliente só mostra.
 *
 * Tempo: todos os valores do Salão (lances, preços, taxas) são em MINUTOS do pulso.
 */
import { RARITY_META } from './cards'
import type { Rarity } from './types'

/* ------------------------------------------------------------------ Calendário */

/** devo_config['salao.calendario'] (PROVISÓRIO; editável pelo Owner). */
export type SalaoCalendarioCfg = {
  /** ISO com fuso (ex.: '2026-10-15T20:00:00-03:00'): início da edição 0. */
  ancora: string
  intervalo_dias: number
  duracao_horas: number
  /** Manual do Owner: 'aberto' abre agora (edição corrente), 'fechado' encerra agora; null = calendário. */
  forcar: 'aberto' | 'fechado' | null
}

export const CALENDARIO_PADRAO: SalaoCalendarioCfg = {
  ancora: '2026-10-15T20:00:00-03:00',
  intervalo_dias: 3,
  duracao_horas: 24,
  forcar: null,
}

export function lerCalendario(raw: unknown): SalaoCalendarioCfg {
  const v = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const ancora = typeof v.ancora === 'string' && Number.isFinite(Date.parse(v.ancora)) ? v.ancora : CALENDARIO_PADRAO.ancora
  const intervalo = Number(v.intervalo_dias)
  const duracao = Number(v.duracao_horas)
  const intervalo_dias = Number.isFinite(intervalo) && intervalo >= 1 && intervalo <= 60 ? intervalo : CALENDARIO_PADRAO.intervalo_dias
  const maxDur = intervalo_dias * 24
  const duracao_horas = Number.isFinite(duracao) && duracao >= 1 ? Math.min(duracao, maxDur) : Math.min(CALENDARIO_PADRAO.duracao_horas, maxDur)
  const forcar = v.forcar === 'aberto' || v.forcar === 'fechado' ? v.forcar : null
  return { ancora, intervalo_dias, duracao_horas, forcar }
}

export type Edicao = { n: number; inicio: number; fim: number }

const HOUR = 3_600_000
const DAY = 24 * HOUR

export function edicaoN(cfg: SalaoCalendarioCfg, n: number): Edicao {
  const inicio = Date.parse(cfg.ancora) + n * cfg.intervalo_dias * DAY
  return { n, inicio, fim: inicio + cfg.duracao_horas * HOUR }
}

/** Índice da edição cujo início é o mais recente (pode ser negativo antes da âncora). */
export function edicaoCorrente(cfg: SalaoCalendarioCfg, now: number) {
  return Math.floor((now - Date.parse(cfg.ancora)) / (cfg.intervalo_dias * DAY))
}

export type SalaoRelogio = {
  aberto: boolean
  /** Edição em curso (aberta) ou a última que começou. */
  corrente: Edicao
  /** Próxima abertura (se aberto agora: a seguinte à corrente). */
  proxima: Edicao
  /** Quando a edição aberta fecha (ms) — só com `aberto`. */
  fechaEm: number | null
  /** Owner forçou o estado. */
  forcado: 'aberto' | 'fechado' | null
}

export function relogioSalao(cfg: SalaoCalendarioCfg, now: number): SalaoRelogio {
  const n = edicaoCorrente(cfg, now)
  const corrente = edicaoN(cfg, n)
  const natural = now >= corrente.inicio && now < corrente.fim
  const aberto = cfg.forcar === 'aberto' ? true : cfg.forcar === 'fechado' ? false : natural
  const proxima = edicaoN(cfg, n + 1)
  return { aberto, corrente, proxima, fechaEm: aberto ? (natural ? corrente.fim : null) : null, forcado: cfg.forcar }
}

/**
 * Um lote da edição `e` deve ser liquidado quando a edição já passou ou quando é a corrente e o Salão está fechado
 * depois de ela ter começado. (Com o Salão forçado aberto, a edição corrente só encerra quando o Owner soltar.)
 */
export function edicaoEncerrada(e: number, relogio: SalaoRelogio, now: number) {
  if (e < relogio.corrente.n) return true
  if (e > relogio.corrente.n) return false
  return !relogio.aberto && now >= relogio.corrente.inicio
}

/* ------------------------------------------------------------------ Raridade mínima */

export function raridadeOrdem(r: string): number {
  return (RARITY_META as Record<string, { order: number }>)[r]?.order ?? -1
}

export function atendeRaridade(r: string, minima: string) {
  return raridadeOrdem(r) >= Math.max(0, raridadeOrdem(minima))
}

export const isRarity = (r: unknown): r is Rarity => typeof r === 'string' && raridadeOrdem(r) >= 0

export const RARIDADE_ROTULO = Object.fromEntries(Object.entries(RARITY_META).map(([k, v]) => [k, v.label])) as Record<Rarity, string>

/* ------------------------------------------------------------------ Contratos e taxas */

export type SalaoContrato = { id: string; nome: string; divulgacao: number; comissaoPct: number; ordem: number }

export function lerContratos(raw: unknown): SalaoContrato[] {
  const v = (raw && typeof raw === 'object' ? raw : {}) as Record<string, Record<string, unknown>>
  const out = Object.entries(v)
    .filter(([id, c]) => /^[a-z0-9_-]{2,30}$/.test(id) && c && typeof c === 'object')
    .map(([id, c]) => ({
      id,
      nome: typeof c.nome === 'string' ? c.nome.slice(0, 60) : id,
      divulgacao: Math.max(0, Math.floor(Number(c.divulgacao) || 0)),
      comissaoPct: Math.max(0, Math.min(100, Number(c.comissao_pct) || 0)),
      ordem: Number(c.ordem) || 99,
    }))
    .sort((a, b) => a.ordem - b.ordem)
  return out.length ? out : [{ id: 'avulso', nome: 'Contrato Avulso', divulgacao: 20, comissaoPct: 15, ordem: 1 }]
}

/** Parte do vendedor: valor menos a comissão (arredonda para baixo; nunca negativo). */
export function repasse(valor: number, comissaoPct: number) {
  return Math.max(0, Math.floor(valor - (valor * comissaoPct) / 100))
}

/* ------------------------------------------------------------------ Bandeja (configuração) */

export type SalaoBandejaCfg = {
  raridade_minima: Rarity
  vagas_por_edicao: number
  max_por_jogador: number
  lance_minimo: number
  incremento: number
  reserva_min: number
}

export function lerBandeja(raw: unknown): SalaoBandejaCfg {
  const v = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const int = (x: unknown, d: number, min: number, max: number) => {
    const n = Math.floor(Number(x))
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d
  }
  return {
    raridade_minima: isRarity(v.raridade_minima) ? v.raridade_minima : 'incomum',
    vagas_por_edicao: int(v.vagas_por_edicao, 12, 1, 200),
    max_por_jogador: int(v.max_por_jogador, 3, 1, 50),
    lance_minimo: int(v.lance_minimo, 30, 1, 10_000),
    incremento: int(v.incremento, 10, 1, 1_000),
    reserva_min: int(v.reserva_min, 30, 0, 24 * 60),
  }
}

/** Limite de qualquer valor em Tempo no Salão (minutos). */
export const SALAO_MAX_MIN = 10_000

/* ------------------------------------------------------------------ Payloads */

export type SalaoLoteStatus = 'avaliacao' | 'aprovado' | 'recusado' | 'retirado' | 'vendido' | 'devolvido'

export type SalaoLote = {
  id: string
  numero: number
  cardId: string
  raridade: Rarity
  /** Nome do personagem de quem vende (Owner nunca identificado: só o nome). */
  vendedor: string
  meu: boolean
  status: SalaoLoteStatus
  edicao: number | null
  lanceMinimo: number
  incremento: number
  /** Maior lance (minutos) e quantos lances. */
  maiorLance: number | null
  lances: number
  /** O maior lance é meu? */
  lidero: boolean
  /** Meu lance mais alto neste lote (se dei algum). */
  meuLance: number | null
  /** Próximo lance aceito. */
  proximoLance: number
  valorFinal: number | null
  repasse: number | null
  venci: boolean
  taxaDivulgacao: number
  comissaoPct: number
  nota: string | null
  createdAt: number
}

export type SalaoOferta = {
  id: string
  cardId: string
  raridade: Rarity
  vendedor: string
  meu: boolean
  preco: number
  status: 'ativa' | 'vendida' | 'retirada'
  comprei: boolean
  repasse: number | null
  createdAt: number
}

export type SalaoAnuncioTipo = 'proposta' | 'propaganda' | 'recrutamento'

export type SalaoAnuncio = {
  id: string
  tipo: SalaoAnuncioTipo
  titulo: string
  texto: string
  autor: string | null
  corporacao: string | null
  meu: boolean
  status: 'pendente' | 'publicado' | 'recusado' | 'retirado'
  custo: number
  createdAt: number
  expiraAt: number | null
}

export type SalaoEvento = {
  id: string
  tipo: 'quinzenal' | 'especial' | 'teatro'
  titulo: string
  descricao: string
  inicio: number
  fim: number
  destaques: string[]
  provisorio: boolean
}

export type SalaoPayload =
  | { liberado: false; motivo: string }
  | {
      liberado: true
      agora: number
      relogio: SalaoRelogio
      apresentado: boolean
      avisoAnunciar: boolean
      podePular: boolean
      /** Equipe pode avaliar a Bandeja (Mesa do Record). */
      especialista: boolean
      /** Owner: calendário, eventos e taxas editáveis (valores provisórios marcados). */
      owner: { calendario: SalaoCalendarioCfg; bandeja: SalaoBandejaCfg; provisorio: boolean } | null
      contrato: SalaoContrato
      contratos: SalaoContrato[]
      bandeja: SalaoBandejaCfg
      vagas: { edicao: number; usadas: number; total: number }
      /** Lotes da edição corrente (abertos para lance quando `relogio.aberto`). */
      leiloes: SalaoLote[]
      /** Lotes aprovados aguardando a próxima edição (vitrine). */
      proximos: SalaoLote[]
      /** Encerrados recentes (para o histórico). */
      encerrados: SalaoLote[]
      /** Meus lotes (Bandeja), em qualquer estado. */
      meusLotes: SalaoLote[]
      mercado: SalaoOferta[]
      minhasOfertas: SalaoOferta[]
      anuncios: SalaoAnuncio[]
      meusAnuncios: SalaoAnuncio[]
      custoPropaganda: number
      eventos: SalaoEvento[]
      /** Tempo creditado ao pulso nesta resposta (vendas, lances devolvidos): o cliente soma ao relógio. */
      timeDeltaMs: number
      /** Cartas esperando resgate (compras, arremates, devoluções). */
      cartasPendentes: number
    }

export type SalaoLiberado = Extract<SalaoPayload, { liberado: true }>

/** Fila do especialista (Mesa do Record). */
export type SalaoAvaliacao = {
  lotes: (SalaoLote & { vendedorId: string; contrato: string })[]
  anuncios: (SalaoAnuncio & { autorId: string | null })[]
  bandeja: SalaoBandejaCfg
  vagas: { edicao: number; usadas: number; total: number }
}

/* ------------------------------------------------------------------ Formatação */

/** 75 → "1h 15min"; 30 → "30min"; 1440 → "24h". */
export function formatTempo(min: number) {
  const m = Math.max(0, Math.round(min))
  const h = Math.floor(m / 60)
  const r = m % 60
  if (!h) return `${r}min`
  return r ? `${h}h ${String(r).padStart(2, '0')}min` : `${h}h`
}

const TZ = 'America/Sao_Paulo'

export function formatDataHora(ms: number) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    .format(ms)
    .replace(/\./g, '')
}

export function formatData(ms: number) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, day: '2-digit', month: 'short' }).format(ms).replace(/\./g, '')
}

/** "AAAA-MM-DD" do dia em Brasília (chave de dia do calendário). */
export function diaBrasilia(ms: number) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(ms)
}

export const ANUNCIO_ROTULO: Record<SalaoAnuncioTipo, string> = {
  proposta: 'Proposta',
  propaganda: 'Propaganda',
  recrutamento: 'Recrutamento',
}

export const EVENTO_ROTULO: Record<SalaoEvento['tipo'], string> = {
  quinzenal: 'Quinzenal',
  especial: 'Especial',
  teatro: 'Teatro',
}
