/**
 * Dublagem (DIRECAO-2 §5, só o prólogo): lista ÚNICA das falas dubladas, com ids estáveis.
 * Usada pelo gerador do CI (scripts/voz/exportar.ts → gerar.py) e pelo player do jogo (lib/devo/voice.ts).
 * Não importa nada de React/DOM: roda no Node (tsx) e no navegador.
 *
 * Ids:
 *   pr-012        fala da batida 12 do prólogo
 *   pr-021-1-0    resposta 0 da opção 1 da escolha na batida 21
 *   rato-risada   risadinha do Rato (fim da fala dele no tutorial)
 */
import { INTRO_SCRIPT } from './intro-script'
import { PROLOGUE, type Speaker } from './prologue-script'

export type VoiceCast = Speaker | 'herdeiro' | 'rato'

export type VoiceLine = {
  id: string
  cast: VoiceCast
  /** Texto exibido (pode conter {nome}). */
  text: string
  /** Texto falado (sem {nome}: o nome do personagem só aparece na legenda). */
  tts: string
}

const pad = (n: number, w = 3) => String(n).padStart(w, '0')

export const prologueLineId = (beat: number, option?: number, reply?: number) =>
  option === undefined ? `pr-${pad(beat)}` : `pr-${pad(beat)}-${option}-${reply ?? 0}`

export const tutorialLineId = (index: number) => `tu-${pad(index, 2)}`

export const RATO_LAUGH_ID = 'rato-risada'

/**
 * Texto para a voz: tira o marcador {nome} com a pontuação em volta ("acordou, {nome}." → "acordou.";
 * "Então, {nome}, você" → "Então, você"). Falas sem letras ("…", "[ … ]") não são dubladas.
 */
export function ttsText(text: string) {
  const t = text
    .replace(/,\s*\{nome\}\s*([,.!?:;…])/g, '$1')
    .replace(/\{nome\}\s*,\s*/g, '')
    .replace(/\s*\{nome\}/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return /\p{L}/u.test(t) ? t : ''
}

export function buildVoiceLines(): VoiceLine[] {
  const out: VoiceLine[] = []
  const push = (id: string, cast: VoiceCast, text: string) => {
    const tts = ttsText(text)
    if (tts) out.push({ id, cast, text, tts })
  }
  PROLOGUE.forEach((beat, i) => {
    if (beat.kind === 'line') push(prologueLineId(i), beat.line.who, beat.line.text)
    if (beat.kind === 'choice') {
      beat.options.forEach((o, oi) => o.reply.forEach((r, ri) => push(prologueLineId(i, oi, ri), r.who, r.text)))
    }
  })
  // Dublagem só na cutscene inicial (DIRECAO-2 §5): o tutorial não tem voz, só a risadinha do Rato (efeito).
  out.push({ id: RATO_LAUGH_ID, cast: 'rato', text: 'Hihihi!', tts: 'Hi, hi, hi, hi!' })
  return out
}

/** Índice da última fala do Rato no tutorial (a risadinha toca quando ela termina). */
export const LAST_RATO_LINE = INTRO_SCRIPT.reduce((last, l, i) => (l.speaker === 'rato' ? i : last), -1)
