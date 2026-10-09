/**
 * Tokens do "Tribunal do Relógio" espelhados em TS — para Three.js, canvas e cálculos de tempo.
 * A fonte da verdade para CSS é `app/globals.css` (:root --dv-*). Mantenha os dois em sincronia.
 * Guia completo: docs/redesign/IDENTIDADE.md
 */
import type { Sfx } from '@/lib/devo/audio'

export const DV_COLOR = {
  ink: '#0a090d',
  ink2: '#121016',
  ink3: '#1b1824',
  ink4: '#282436',
  night: '#1c1b33',
  night2: '#34365a',
  violet: '#6c6899',
  violetText: '#aaa5d6',
  cobalt: '#4152c0',
  cobaltDeep: '#2f3c9c',
  cobaltDim: '#161a40',
  cobaltText: '#9ea8ee',
  gold: '#b09a6c',
  goldBright: '#e3d5ac',
  goldDeep: '#5e4d33',
  paper: '#ece9e3',
  paper2: '#dbd7cf',
  paperInk: '#141217',
  porcelain: '#f2f0ec',
  porcelain2: '#e0ddd8',
  marbleVein: '#8a8986',
  marbleBlack: '#2e2f34',
  blood: '#a3121f',
  bloodDeep: '#3f060b',
  bloodText: '#ff6670',
  text: '#eeecef',
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
  paper: '#e8e6e2',
  paper2: '#d9d6d0',
  porcelain: '#f4f2ee',
  panel: '#0a090d',
  panel2: '#15131b',
  ink: '#0c0b10',
  cobalt: '#34409e',
  cobaltOnDark: '#8f9cf0',
  violet: '#4d4790',
  violetOnDark: '#aaa5d6',
  alert: '#a3121f',
  alertOnDark: '#ff5a64',
  goldOnPaper: '#6a5530',
  brass: '#b09a6c',
} as const
