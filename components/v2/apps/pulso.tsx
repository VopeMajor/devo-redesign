'use client'

import useSWR from 'swr'
import { useDevo } from '@/components/devo/state/devo-store'
import { useAcesso } from '@/components/devo/state/use-acesso'
import { useNow } from '@/components/devo/hooks'
import { arcadeFetcher, arcadeKey, type PlayerStats } from '@/lib/devo/arcade/client'
import { PULSE_CRITICAL_MS, PULSE_START_HOURS, pulseRemaining } from '@/lib/devo/pulse'

/**
 * Pulso no v2 (protótipo kit3/os-pulso.js, aprovado pelo dono: "tira as regras do pulso. n precisa de extras, pode por
 * a quantia cheia de horas"). Medidor das 72 horas com uma marca por hora, o coração no centro, o batimento por baixo
 * (mais rápido no crítico) e o resumo. Números do jogo: Tempo, cartas, trocas e partidas da Sala de Jogos.
 */
const MAX = PULSE_START_HOURS
const R = 118
const C = 2 * Math.PI * R

function ecg(crit: boolean) {
  let d = 'M0 30'
  let x = 0
  const passo = crit ? 75 : 150
  while (x < 1200) {
    d += ` L${x + passo * 0.45} 30 L${x + passo * 0.5} 22 L${x + passo * 0.55} 30 L${x + passo * 0.6} 34 L${x + passo * 0.64} 6 L${x + passo * 0.68} 54 L${x + passo * 0.72} 26 L${x + passo * 0.78} 30 L${x + passo} 30`
    x += passo
  }
  return d
}

export function PulsoV2() {
  const { state } = useDevo()
  // Owner e Anfitrião veem a Sala de Jogos sem a marca no save: aqui ela também conta como liberada
  const acessoJogos = !!useAcesso()?.salaJogos
  const salaLiberada = state.arcadeUnlocked || acessoJogos
  const now = useNow(1000)
  const resta = pulseRemaining(state.timerEndsAt, now)
  const crit = resta < PULSE_CRITICAL_MS
  const horas = Math.ceil(resta / 3_600_000)
  const f = Math.min(1, resta / 3_600_000 / MAX)
  const { data: stats } = useSWR<PlayerStats>(salaLiberada ? arcadeKey('stats') : null, arcadeFetcher, { revalidateOnFocus: false })
  return (
    <div className={'pu' + (crit ? ' crit' : '')}>
      <header className="pu-cab">
        <div>
          <small>Sinal vital</small>
          <h3>Pulso</h3>
        </div>
        <b className="pu-est">{crit ? 'Crítico' : 'Estável'}</b>
      </header>
      <div className="pu-mostrador" role="img" aria-label={`${horas} horas restantes de ${MAX}`}>
        <svg viewBox="0 0 300 300" aria-hidden="true">
          <defs>
            <linearGradient id="pu-arco" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--pu-a)" />
              <stop offset="1" stopColor="var(--pu-b)" />
            </linearGradient>
          </defs>
          <circle cx="150" cy="150" r="140" className="pu-halo" />
          <g className="pu-marcas">
            {Array.from({ length: MAX }, (_, i) => {
              const g = i % 6 === 0
              return <line key={i} x1="150" y1={g ? 14 : 19} x2="150" y2="26" transform={`rotate(${(i / MAX) * 360} 150 150)`} className={[i < horas && 'on', g && 'g'].filter(Boolean).join(' ')} />
            })}
          </g>
          <circle cx="150" cy="150" r={R} className="pu-trilho" />
          <circle cx="150" cy="150" r={R} className="pu-arco" style={{ strokeDasharray: `${(C * f).toFixed(1)} ${C.toFixed(1)}` }} />
          <g className="pu-nums">
            {[0, 12, 24, 36, 48, 60].map((h) => {
              const a = (h / MAX) * 2 * Math.PI - Math.PI / 2
              return (
                <text key={h} x={150 + Math.cos(a) * 100} y={150 + Math.sin(a) * 100 + 4}>
                  {h || MAX}
                </text>
              )
            })}
          </g>
          <circle cx="150" cy="150" r="78" className="pu-nucleo" />
        </svg>
        <div className="pu-meio">
          <img src="/v2/art/os/ico/pulso.webp" alt="" />
          <strong>{horas}</strong>
          <span>
            {horas === 1 ? 'hora' : 'horas'} de {MAX}
          </span>
        </div>
      </div>
      <svg className="pu-ecg" viewBox="0 0 600 60" preserveAspectRatio="none" aria-hidden="true">
        <path d={ecg(crit)} />
      </svg>
      {crit && (
        <div className="pu-alerta" role="alert">
          <strong>Tempo crítico</strong>
          <p>Menos de 6 horas. Jogue e vença para recuperar horas antes que o pulso pare.</p>
        </div>
      )}
      <div className="pu-stats">
        <div>
          <b>{state.inventory.length}</b>
          <small>Cartas</small>
        </div>
        <div>
          <b>{state.tradesCompleted}</b>
          <small>Trocas</small>
        </div>
        <div>
          <b>{salaLiberada ? (stats?.games ?? '—') : 0}</b>
          <small>Jogos</small>
        </div>
      </div>
    </div>
  )
}
