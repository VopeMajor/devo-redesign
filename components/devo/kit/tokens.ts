/**
 * Tokens do "Tribunal do Relógio" espelhados em TS — para Three.js, canvas e cálculos de tempo.
 * A fonte da verdade para CSS é `app/globals.css` (:root --dv-*). Mantenha os dois em sincronia.
 * Guia completo: docs/redesign/IDENTIDADE.md
 */
import type { Sfx } from '@/lib/devo/audio'

export const DV_COLOR = {
  ink: '#05070d',
  ink2: '#0a0f1c',
  ink3: '#111a2e',
  ink4: '#1a2440',
  cobalt: '#315dff',
  cobaltDeep: '#1647ff',
  cobaltDim: '#0b1a4d',
  cobaltText: '#7d97ff',
  gold: '#c9a45c',
  goldBright: '#ecd49a',
  goldDeep: '#7c5f2a',
  paper: '#efe6d2',
  paper2: '#e2d5b8',
  paperInk: '#1c1a22',
  blood: '#d51f2b',
  bloodDeep: '#5a0a10',
  bloodText: '#ff5a63',
  text: '#eceef2',
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
  paper: '#e3e5e8',
  paper2: '#d6d9dc',
  panel: '#090b0f',
  panel2: '#15171c',
  ink: '#0b0d12',
  cobalt: '#1647ff',
  cobaltOnDark: '#5b7bff',
  alert: '#c8151f',
  alertOnDark: '#ff4d57',
  goldOnPaper: '#7a5a1c',
} as const
