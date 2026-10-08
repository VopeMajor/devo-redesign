/**
 * Fonte única do relógio do pulso. Barra de status, cartão "Tempo restante", app Pulso e Record
 * leem `state.timerEndsAt` e formatam por aqui.
 */
export const PULSE_START_HOURS = 72
export const PULSE_START_MS = PULSE_START_HOURS * 3600 * 1000
/** Abaixo disso o pulso fica "Crítico". */
export const PULSE_CRITICAL_MS = 6 * 3600 * 1000

export function pulseRemaining(timerEndsAt: number, now: number) {
  return Math.max(0, timerEndsAt - now)
}

/**
 * Fração do anel principal (0..1) e o excedente acima de 72h (0..1, em voltas de 72h).
 * Antes o anel usava `remaining / 72h` sem limite e quebrava quando o jogador ganhava tempo.
 */
export function pulseRing(remaining: number) {
  const ratio = Math.min(1, Math.max(0, remaining / PULSE_START_MS))
  const excess = remaining > PULSE_START_MS ? Math.min(1, (remaining - PULSE_START_MS) / PULSE_START_MS) : 0
  return { ratio, excess }
}
