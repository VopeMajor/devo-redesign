/**
 * Tokens do "Tribunal do Relógio" espelhados em TS — para Three.js, canvas e cálculos de tempo.
 * A fonte da verdade para CSS é `app/globals.css` (:root --dv-*). Mantenha os dois em sincronia.
 * Guia completo: docs/redesign/IDENTIDADE.md
 */
import type { Sfx } from '@/lib/devo/audio'

export const DV_COLOR = {
  // Paleta "Kokken no Inori" (Refinamento 4): abismo → pedra de névoa → vinho; prata apagada nos textos secundários.
  abyss: '#090909',
  fog: '#353535',
  fog2: '#434141',
  wine0: '#280e11',
  wine: '#3f1117',
  wine2: '#5a1d26',
  wineLine: '#7d3a44',
  wineText: '#d49aa2',
  silver: '#acacac',
  block: '#2e1014',
  ink: '#090909',
  ink2: '#161515',
  ink3: '#222020',
  ink4: '#2e2c2c',
  night: '#140f11',
  night2: '#2a1d21',
  violet: '#77707c',
  violetText: '#bdb7c0',
  cobalt: '#5a1d26',
  cobaltDeep: '#3f1117',
  cobaltDim: '#231013',
  cobaltText: '#e3dcdc',
  gold: '#bab09f',
  goldBright: '#ece5d8',
  goldDeep: '#6b6357',
  paper: '#e9e8e5',
  paper2: '#d9d8d4',
  paperInk: '#141313',
  porcelain: '#f1f0ee',
  porcelain2: '#dfdedb',
  marbleVein: '#8f8e8b',
  marbleBlack: '#353535',
  amethyst: '#8f86b4',
  amethystText: '#cbc6dc',
  amethystDeep: '#4d4668',
  blood: '#9b2531',
  bloodDeep: '#3f1117',
  bloodText: '#e0858d',
  text: '#ecebe9',
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
  cobaltOnDark: '#e0dde8',
  amethyst: '#3d3858',
  violet: '#5d5970',
  violetOnDark: '#b7b3c9',
  alert: '#a3121f',
  alertOnDark: '#ff5a64',
  goldOnPaper: '#5f584d',
  brass: '#bab09f',
} as const
