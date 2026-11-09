import type { Voz } from '../casa/som'

/**
 * Os anfitriões das Torres em pixel (aprovados pelo dono em 07/11: "Aprovo"): Galo, Coruja e Javali, 8 poses cada
 * (/v2/art/torres/npc/<nome>-<pose>.png), piscar (/v2/art/torres/npc/anim/), rosto do cartão (<nome>-rosto.png) e
 * chibi (/v2/art/npc-chibi/<nome>.png). Voz, respiração e reação de cada pose como no protótipo (kit3/torres.html,
 * NPC_T): o Galo é teatral e reage a tudo; a Coruja quase não se mexe; o Javali é lento e grave.
 * O NPC da Torre da Ruptura ainda não existe ("???", a definir pelo dono): fica sem rosto.
 */

export const ARTE_V = '202611071300'
export const ARTE = '/v2/art/torres/'
export const ANIM = `${ARTE}npc/anim/`

export type Anfitriao = {
  padrao: string
  poses: string[]
  voz: Voz
  resp: number
  piscar: [number, number]
  bocaMs: number
  reage: Record<string, string>
  /** Poses que o conteúdo antigo das Torres usa e que a folha nova não tem → a pose nova mais parecida. */
  apelidos: Record<string, string>
}

export const ANFITRIOES: Record<string, Anfitriao> = {
  galo: {
    padrao: 'sombrio',
    poses: ['sorriso', 'entediado', 'confiante', 'malicia', 'surpreso', 'riso', 'irritado', 'sombrio'],
    voz: { tipo: 'square', f0: 300, f1: 380, dur: 30, cada: 2, vol: 0.035 },
    resp: 2.6,
    piscar: [2.2, 5],
    bocaMs: 90,
    reage: { sorriso: 'assenta', entediado: 'murcha', confiante: 'ergue', malicia: 'inclina', surpreso: 'susto', riso: 'pula', irritado: 'treme', sombrio: 'nada' },
    apelidos: { neutro: 'confiante', piscadela: 'malicia', desdem: 'entediado', timido: 'surpreso' },
  },
  coruja: {
    padrao: 'neutro',
    poses: ['neutro', 'sorriso', 'serio', 'piscadela', 'surpreso', 'riso', 'desdem', 'irritado'],
    voz: { tipo: 'triangle', f0: 520, f1: 600, dur: 34, cada: 2, vol: 0.06 },
    resp: 3.8,
    piscar: [3, 6.5],
    bocaMs: 120,
    reage: { surpreso: 'susto', desdem: 'ergue', riso: 'assenta' },
    apelidos: { malicia: 'piscadela', preocupado: 'serio', triste: 'serio', timido: 'sorriso', confiante: 'sorriso' },
  },
  javali: {
    padrao: 'convite',
    poses: ['convite', 'neutro', 'explica', 'trama', 'surpreso', 'riso', 'desdem', 'sombrio'],
    voz: { tipo: 'sawtooth', f0: 150, f1: 200, dur: 40, cada: 3, vol: 0.03 },
    resp: 4.2,
    piscar: [3.5, 7.5],
    bocaMs: 130,
    reage: { surpreso: 'susto', riso: 'balanca', desdem: 'ergue', trama: 'inclina', explica: 'assenta' },
    apelidos: { pensativo: 'trama', entediado: 'desdem', furioso: 'sombrio', timido: 'neutro', confiante: 'convite' },
  },
}

/** Pose que existe na folha nova (a pedida, o apelido dela ou a de repouso). */
export function poseDe(id: string, pose?: string) {
  const a = ANFITRIOES[id]
  if (!a) return pose ?? 'neutro'
  if (pose && a.poses.includes(pose)) return pose
  if (pose && a.apelidos[pose]) return a.apelidos[pose]
  return a.padrao
}
export const poseSrc = (id: string, pose: string) => `${ARTE}npc/${id}-${pose}.png?v=${ARTE_V}`
export const rostoSrc = (id: string) => (ANFITRIOES[id] ? `${ARTE}npc/${id}-rosto.png?v=${ARTE_V}` : null)

/* rostinho na caixa (dono, 06/11: "Rosto na caixa"), como o do protótipo (kit3/npc-vn.js): a cabeça da pose atual,
   recortada da própria arte. Nos anfitriões das Torres o centro dos olhos de cada pose foi medido na arte
   (centros.json) e vale mais que a busca pela pele. Recorte de 76 px (152 nas figuras grandes), sempre 76 na tela. */
let centros: Record<string, [number, number]> | null = null
const centrosProntos: Promise<void> =
  typeof window === 'undefined'
    ? Promise.resolve()
    : fetch(`${ARTE}npc/centros.json?v=${ARTE_V}`)
        .then((r) => r.json())
        .then((j) => {
          centros = j
        })
        .catch(() => {
          centros = {}
        })

const recortes = new Map<string, Promise<string | null>>()
function recorte(src: string) {
  if (recortes.has(src)) return recortes.get(src)!
  const p = centrosProntos.then(
    () =>
      new Promise<string | null>((ok) => {
        const im = new Image()
        im.onload = () => {
          const w = im.naturalWidth
          const h = im.naturalHeight
          const c = document.createElement('canvas')
          c.width = w
          c.height = h
          const x = c.getContext('2d', { willReadFrequently: true })!
          x.drawImage(im, 0, 0)
          const d = x.getImageData(0, 0, w, h).data
          let topo = 0
          achou: for (; topo < h; topo++) for (let xx = 0; xx < w; xx++) if (d[(topo * w + xx) * 4 + 3] > 100) break achou
          const z = Math.max(1, Math.round((h * 0.19) / 76))
          const S = 76 * z
          const k = centros?.[src.split('?')[0].split('/').pop()!.replace(/\.png$/, '')]
          const cx = k ? k[0] : w / 2
          const cy = k ? k[1] + S * 0.05 : topo + S / 2
          const o = document.createElement('canvas')
          o.width = o.height = S
          // fora da figura fica transparente
          o.getContext('2d')!.drawImage(im, Math.round(cx - S / 2), Math.round(cy - S * 0.45), S, S, 0, 0, S, S)
          ok(o.toDataURL())
        }
        im.onerror = () => ok(null)
        im.src = src
      }),
  )
  recortes.set(src, p)
  return p
}
export const preRostosTorre = (srcs: string[]) => srcs.forEach(recorte)
export async function rostinhoTorre(el: (HTMLElement & { _pedido?: number }) | null, src: string | null, px = 76) {
  if (!el) return
  const meu = (el._pedido = (el._pedido || 0) + 1)
  if (!src) {
    el.hidden = true
    return
  }
  const url = await recorte(src)
  if (meu !== el._pedido || !url) return
  el.style.backgroundImage = `url(${url})`
  el.style.width = el.style.height = px + 'px'
  el.style.backgroundSize = '100% 100%'
  el.hidden = false
}
