'use client'

import { Fragment } from 'react'

/**
 * Texto rico das cenas: `*ênfase*` vira itálico claro e `[rubrica]` dentro de uma fala vira indicação de cena
 * (itálico, cor de aço, entre colchetes). Funciona com a máquina de escrever: `shown` corta o texto visível
 * (contado sobre o texto SEM as marcas, o mesmo que `textoPlano`).
 */
type Seg = { t: string; k: 'n' | 'e' | 'r' }

export function segmentos(texto: string): Seg[] {
  const out: Seg[] = []
  const re = /\*([^*]+)\*|\[([^\]]+)\]/g
  let last = 0
  for (let m = re.exec(texto); m; m = re.exec(texto)) {
    if (m.index > last) out.push({ t: texto.slice(last, m.index), k: 'n' })
    if (m[1] !== undefined) out.push({ t: m[1], k: 'e' })
    else out.push({ t: `[${m[2]}]`, k: 'r' })
    last = re.lastIndex
  }
  if (last < texto.length) out.push({ t: texto.slice(last), k: 'n' })
  return out
}

/** Texto sem as marcas de ênfase (as rubricas mantêm os colchetes). */
export const textoPlano = (texto: string) => segmentos(texto).map((s) => s.t).join('')

export function TextoRico({ texto, shown }: { texto: string; shown?: number }) {
  let left = shown ?? Number.POSITIVE_INFINITY
  return (
    <>
      {segmentos(texto).map((s, i) => {
        if (left <= 0) return null
        const t = s.t.slice(0, Math.max(0, left))
        left -= s.t.length
        if (s.k === 'e') return <em key={i} className="not-italic text-dv-gold-bright [font-style:italic]">{t}</em>
        if (s.k === 'r') return <span key={i} className="font-body italic text-dv-text-3">{t}</span>
        return <Fragment key={i}>{t}</Fragment>
      })}
    </>
  )
}
