/**
 * Balão de diálogo com tamanho fixo (kit3/balao.js, dono 02/11): o texto ocupa no máximo as linhas da caixa; o que
 * sobra passa para o balão seguinte.
 * Dono, 08/11 ("os balões de fala estão com uma cadência estranha / os cortes"): o balão se enche de FRASES inteiras;
 * só uma frase que sozinha não cabe na caixa é cortada, entre palavras, de preferência depois de uma vírgula.
 * O texto é literal (falas do dono e do Rup): as páginas são pedaços do texto original, sem trocar nenhum caractere;
 * só os espaços nas pontas de cada balão saem. Frase termina em . ! ? … seguido de espaço, quebra de linha ou fim
 * ("3.5", "Eu…não" e "Sr. Simon" não são cortados). O elemento precisa ter altura fixa.
 */
const ABREVIACOES = /(?:^|\s)(?:Sr|Sra|Srta|Dr|Dra|Prof|St|Sto|Sta)\.$/

export function paginar(el: HTMLElement, texto: string): string[] {
  const antes = el.textContent
  // sem altura (caixa ainda escondida): não corta
  if (!el.clientHeight) return [texto]
  const cabe = (t: string) => {
    el.textContent = t
    return el.scrollHeight <= el.clientHeight + 1
  }
  const src = String(texto)
  // fins de frase: índices logo depois da pontuação (e das aspas ou colchetes que fecham junto)
  const fins: number[] = []
  const re = /[.!?…]+["”\])]*(?=\s|$)|\n/g
  for (let m = re.exec(src); m; m = re.exec(src)) {
    const fim = m.index + m[0].length
    if (m[0] !== '\n' && ABREVIACOES.test(src.slice(Math.max(0, m.index - 6), fim))) continue
    fins.push(fim)
  }
  if (fins[fins.length - 1] !== src.length) fins.push(src.length)

  // pedaço [a, b) do original, sem os espaços das pontas
  const pedaco = (a: number, b: number) => src.slice(a, b).trim()
  // fins de palavra dentro de [a, b), para cortar uma frase longa demais
  const palavras = (a: number, b: number) => {
    const out: number[] = []
    const r = /\s+/g
    r.lastIndex = a
    for (let m = r.exec(src); m && m.index < b; m = r.exec(src)) out.push(m.index)
    out.push(b)
    return out
  }

  const pags: string[] = []
  let ini = 0 // começo do balão atual
  let fimOk = -1 // até onde o balão atual já cabe (fim de frase)
  const fecha = (ate: number) => {
    const t = pedaco(ini, ate)
    if (t) pags.push(t)
    ini = ate
    fimOk = -1
  }
  for (const f of fins) {
    if (cabe(pedaco(ini, f))) {
      fimOk = f
      continue
    }
    // a frase não cabe junto: fecha o balão no último fim de frase que cabia
    if (fimOk > ini) fecha(fimOk)
    if (cabe(pedaco(ini, f))) {
      fimOk = f
      continue
    }
    // a frase sozinha não cabe: corta entre palavras, de preferência depois de uma vírgula
    while (!cabe(pedaco(ini, f))) {
      const ws = palavras(ini, f)
      let ate = -1
      for (const w of ws) {
        if (w <= ini) continue
        if (pedaco(ini, w) && !cabe(pedaco(ini, w))) break
        ate = w
      }
      if (ate <= ini) ate = ws.find((w) => w > ini) ?? f
      const trecho = src.slice(ini, ate)
      const v = trecho.lastIndexOf(', ')
      if (v > trecho.length * 0.5) ate = ini + v + 1
      fecha(ate)
    }
    fimOk = f
  }
  if (pedaco(ini, src.length)) fecha(src.length)
  el.textContent = antes
  return pags.length ? pags : [texto]
}
