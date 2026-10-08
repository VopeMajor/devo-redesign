'use client'

import { useEffect, useState } from 'react'

/**
 * Área visível de verdade (descontando o teclado do celular), via visualViewport.
 * `h` = altura visível, `top` = deslocamento, `keyboard` = teclado provavelmente aberto.
 * null até montar (SSR) ou se o navegador não tiver visualViewport.
 */
export function useVisibleViewport() {
  const [box, setBox] = useState<{ h: number; top: number; keyboard: boolean } | null>(null)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => setBox({ h: vv.height, top: vv.offsetTop, keyboard: vv.height < window.innerHeight * 0.78 })
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])
  return box
}
