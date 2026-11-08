/**
 * Balão de diálogo com tamanho fixo (kit3/balao.js, dono 02/11): o texto ocupa no máximo as linhas da caixa; o que
 * sobra passa para o balão seguinte. Os balões saem de tamanho parecido e cortam de preferência no fim de uma frase.
 * O elemento precisa ter altura fixa.
 */
export function paginar(el: HTMLElement, texto: string): string[] {
  const antes = el.textContent
  const cabe = (t: string) => {
    el.textContent = t
    return el.scrollHeight <= el.clientHeight + 1
  }
  function corta(resto: string, alvo: number | null) {
    const pal = resto.split(/(\s+)/)
    let atual = ''
    for (let i = 0; i < pal.length; i++) {
      const t = atual + pal[i]
      if (atual.trim() && (!cabe(t) || (alvo && t.trim().length > alvo))) break
      atual = t
    }
    const m = [...atual.matchAll(/[.!?…]["”\]]?\s/g)].pop()
    if (m && m.index! > atual.length * 0.55 && m.index! + m[0].length < resto.length) atual = atual.slice(0, m.index! + m[0].length)
    return atual.trim() ? atual : pal[0] + (pal[1] || '')
  }
  function reparte(alvo: ((i: number, resto: string) => number) | null) {
    const pags: string[] = []
    let resto = String(texto).trim()
    while (resto) {
      if (cabe(resto)) {
        pags.push(resto)
        break
      }
      const a = corta(resto, alvo && alvo(pags.length, resto))
      pags.push(a.trim())
      resto = resto.slice(a.length).trim()
    }
    return pags
  }
  // sem altura (caixa ainda escondida): não corta
  if (!el.clientHeight) return [texto]
  const cheio = reparte(null)
  let pags = cheio
  if (cheio.length > 1) {
    const n = cheio.length
    const eq = reparte((i, resto) => Math.ceil(resto.length / (n - i)) * 1.12)
    if (eq.length === n) pags = eq
  }
  el.textContent = antes
  return pags
}
