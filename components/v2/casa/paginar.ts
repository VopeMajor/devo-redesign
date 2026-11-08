/**
 * Balão de diálogo com tamanho fixo (kit3/balao.js, dono 02/11): o texto ocupa no máximo as linhas da caixa; o que
 * sobra passa para o balão seguinte.
 * Dono, 08/11 ("os balões de fala estão com uma cadência estranha / os cortes"): o balão agora se enche de FRASES
 * inteiras; só uma frase que sozinha não cabe na caixa é cortada, e então entre palavras, de preferência depois de
 * uma vírgula. Antes os balões eram igualados no tamanho, o que cortava frases no meio sem precisar.
 * O elemento precisa ter altura fixa.
 */
export function paginar(el: HTMLElement, texto: string): string[] {
  const antes = el.textContent
  // sem altura (caixa ainda escondida): não corta
  if (!el.clientHeight) return [texto]
  const cabe = (t: string) => {
    el.textContent = t
    return el.scrollHeight <= el.clientHeight + 1
  }
  // frases: terminam em . ! ? … (com aspas ou colchete fechando junto); a quebra de linha do texto é mantida (a
  // primeira frase de cada parágrafo entra com "\n" na frente)
  const frases: string[] = []
  String(texto)
    .trim()
    .split('\n')
    .forEach((par, i) => {
      const fs = (par.match(/[^.!?…]+(?:[.!?…]+["”\])]*|$)|[.!?…]+["”\])]*/g) ?? []).map((f) => f.trim()).filter(Boolean)
      fs.forEach((f, j) => frases.push(i > 0 && j === 0 ? '\n' + f : f))
    })
  if (!frases.length) frases.push(String(texto))

  // corta uma frase longa demais entre palavras: o maior pedaço que cabe, de preferência terminando numa vírgula
  function cortaFrase(frase: string): string[] {
    const out: string[] = []
    let resto = frase.trim()
    while (resto && !cabe(resto)) {
      const pal = resto.split(/(\s+)/)
      let atual = ''
      for (const p of pal) {
        const t = atual + p
        if (atual.trim() && !cabe(t)) break
        atual = t
      }
      const v = atual.lastIndexOf(', ')
      if (v > atual.length * 0.5) atual = atual.slice(0, v + 1)
      if (!atual.trim()) atual = pal[0]
      out.push(atual.trim())
      resto = resto.slice(atual.length).trim()
    }
    if (resto) out.push(resto)
    return out
  }

  const pags: string[] = []
  let pag = ''
  for (const f of frases) {
    const junto = pag ? pag + (f.startsWith('\n') ? '\n' : ' ') + f.trim() : f.trim()
    if (cabe(junto)) {
      pag = junto
      continue
    }
    if (pag.trim()) pags.push(pag.trim())
    pag = ''
    if (cabe(f.trim())) pag = f.trim()
    else {
      const partes = cortaFrase(f)
      pags.push(...partes.slice(0, -1))
      pag = partes[partes.length - 1] ?? ''
    }
  }
  if (pag.trim()) pags.push(pag.trim())
  el.textContent = antes
  return pags.length ? pags : [texto]
}
