/**
 * Tokens do "Tribunal do Relógio" espelhados em TS — para Three.js, canvas e cálculos de tempo.
 * A fonte da verdade para CSS é `app/globals.css` (:root --dv-*). Mantenha os dois em sincronia.
 * Guia completo: docs/redesign/IDENTIDADE.md
 */
import type { Sfx } from '@/lib/devo/audio'

export const DV_COLOR = {
  ink: '#0c0c0e',
  ink2: '#151517',
  ink3: '#1f1f22',
  ink4: '#2c2c31',
  night: '#19181f',
  night2: '#2b2a35',
  violet: '#6f6b82',
  violetText: '#b7b3c9',
  cobalt: '#5a4f8f',
  cobaltDeep: '#463d78',
  cobaltDim: '#1e1b2b',
  cobaltText: '#cbc5e8',
  gold: '#bab09f',
  goldBright: '#ece5d8',
  goldDeep: '#6b6357',
  paper: '#e9e8e5',
  paper2: '#d9d8d4',
  paperInk: '#141416',
  porcelain: '#f1f0ee',
  porcelain2: '#dfdedb',
  marbleVein: '#8f8e8b',
  marbleBlack: '#38393c',
  amethyst: '#8a7cc8',
  amethystText: '#c2b9ec',
  amethystDeep: '#4e4580',
  blood: '#a3121f',
  bloodDeep: '#3f060b',
  bloodText: '#ff6670',
  text: '#eeedeb',
} as const

/** Durações em ms (iguais a --dv-dur-*). */
export const DV_DUR = { tap: 120, ui: 220, enter: 360, scene: 520 } as const

/** Cortina entre fases: duração total e momento em que a ação (troca de tela) acontece. */
export const CURTAIN_MS = 1800
export const CURTAIN_SWAP_MS = 850

/** Abaixo disso o tempo do pulso é "crítico" (vermelho + pulso). */
export const CRITICAL_MS = 6 * 3600 * 1000

/** Mapa de som por intenção. Use estes nomes no lugar de escolher um `playSfx` ao acaso. */
export const DV_SFX = {
  /** Toque comum em botão/aba/chip. */
  tap: 'click',
  /** Passar o mouse (só desktop, só depois do primeiro gesto). */
  hover: 'hover',
  /** Abrir app, folha (Sheet) ou painel. */
  open: 'open',
  /** Fechar/voltar. */
  close: 'close',
  /** Confirmar algo importante (resgatar, inscrever, aceitar troca). */
  confirm: 'confirm',
  /** Erro de validação ou ação negada. */
  error: 'error',
  /** Entrar numa fase / começar (acompanha a cortina). */
  enter: 'whoosh',
  /** Revelação dramática (carta, resultado, carimbo de eliminação). */
  reveal: 'reveal',
  /** Aviso/notificação chegando. */
  notify: 'notify',
  /** Carta movida/virada. */
  card: 'card',
  /** Carta selecionada. */
  cardSelect: 'card-select',
  /** Tique de relógio em contagem crítica (no máximo 1×/s). */
  tick: 'chess-tick',
  /** Batimento quando o tempo entra em estado crítico (uma vez). */
  critical: 'heartbeat',
} as const satisfies Record<string, Sfx>

export type DvSfxIntent = keyof typeof DV_SFX

/** Interior (estética do Record) — espelho de .dv-interior / .dv-interior-dark em globals.css. */
export const DV_INTERIOR = {
  paper: '#e7e6e3',
  paper2: '#d6d5d1',
  porcelain: '#f3f2f0',
  panel: '#0c0c0e',
  panel2: '#161618',
  ink: '#0d0d0f',
  cobalt: '#1c1c1f',
  cobaltOnDark: '#d4cfee',
  amethyst: '#4a4180',
  violet: '#5d5970',
  violetOnDark: '#b7b3c9',
  alert: '#a3121f',
  alertOnDark: '#ff5a64',
  goldOnPaper: '#5f584d',
  brass: '#bab09f',
} as const
