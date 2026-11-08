import { calmo as calmoAgora } from './som'

/**
 * Chibis dos NPCs no mapa (kit3/npc-chibi.js; dono, 06/11: "deixe somente para os chibis deles" → "Pode fazer").
 * Folha em /v2/art/npc-chibi/<nome>.png: 8 colunas x 4 linhas de 80x96; linhas frente, esquerda, direita, costas;
 * colunas 0..3 andar, 4 parado, 5 boca aberta, 6 olhos fechados, 7 olhos fechados e boca aberta.
 * Parado respira e pisca; falando a boca alterna e fecha nas pausas; andando, ciclo de 4 quadros. Tudo em quadro
 * inteiro. Com movimento reduzido: parado, sem piscar nem boca.
 */
export type ChibiNpc = ReturnType<typeof criaChibi>

export function criaChibi(
  nome: string,
  {
    mundo,
    x = 0,
    y = 0,
    dir = 0,
    versao = '',
    bocaMs = 110,
    piscar = [2.5, 6],
    piscaMs = 110,
    resp = 3,
    velocidade = 48,
    sombra: temSombra = true,
  }: {
    mundo: HTMLElement
    x?: number
    y?: number
    dir?: number
    versao?: string
    bocaMs?: number
    piscar?: [number, number]
    piscaMs?: number
    resp?: number
    velocidade?: number
    sombra?: boolean
  },
) {
  const calmo = calmoAgora()
  const el = document.createElement('div')
  const sombra = document.createElement('div')
  el.className = 'npc-chibi'
  sombra.className = 'npc-chibi-sombra'
  el.style.backgroundImage = `url(/v2/art/npc-chibi/${nome}.png${versao ? '?v=' + versao : ''})`
  mundo.append(sombra, el)
  if (!temSombra) sombra.style.display = 'none'
  const s = { x, y, dir, falando: false, olho: false, boca: false, rota: [] as [number, number][], aoChegar: null as null | (() => void), andado: 0, vivo: true }
  let ultima = ''
  let rodando = true
  let t0 = performance.now()
  let proxPisca = 1 + Math.random() * 2
  let pisca = 0
  let bocaT = 0
  let bocaPasso = bocaMs
  let respT = Math.random() * resp
  function pinta(sobe: boolean) {
    let col = 4
    if (s.rota.length) col = Math.floor(s.andado) % 4
    else {
      const b = s.boca && s.dir !== 3
      const o = s.olho && s.dir !== 3
      col = o ? (b ? 7 : 6) : b ? 5 : 4
    }
    const chave = col + ',' + s.dir + ',' + Math.round(s.x) + ',' + Math.round(s.y) + ',' + sobe
    if (chave === ultima) return
    ultima = chave
    el.style.backgroundPosition = `-${col * 80}px -${s.dir * 96}px`
    el.style.left = Math.round(s.x) + 'px'
    el.style.top = Math.round(s.y - (sobe ? 1 : 0)) + 'px'
    el.style.zIndex = String(Math.round(s.y))
    sombra.style.left = Math.round(s.x) + 'px'
    sombra.style.top = Math.round(s.y) + 'px'
    sombra.style.zIndex = String(Math.round(s.y) - 1)
  }
  function laco(t: number) {
    if (!s.vivo) return
    if (el.hidden && !s.rota.length) {
      rodando = false
      return
    }
    const dt = Math.min(0.05, (t - t0) / 1000)
    t0 = t
    let sobe = false
    if (s.rota.length) {
      const [tx, ty] = s.rota[0]
      const dx = tx - s.x
      const dy = ty - s.y
      const d = Math.hypot(dx, dy)
      const v = velocidade * dt
      if (d <= v) {
        s.x = tx
        s.y = ty
        s.rota.shift()
        if (!s.rota.length) {
          s.andado = 0
          const f = s.aoChegar
          s.aoChegar = null
          f?.()
        }
      } else {
        s.x += (dx / d) * v
        s.y += (dy / d) * v
        s.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : dy > 0 ? 0 : 3
        s.andado += v / 7
        sobe = Math.floor(s.andado) % 2 === 1
      }
    } else if (!calmo && !el.hidden) {
      respT = (respT + dt) % resp
      sobe = respT > resp * 0.66
      proxPisca -= dt
      if (proxPisca <= 0 && pisca <= 0) {
        pisca = piscaMs / 1000
        proxPisca = piscar[0] + Math.random() * (piscar[1] - piscar[0])
      }
      if (pisca > 0) {
        pisca -= dt
        s.olho = pisca > 0
      }
      if (s.falando) {
        bocaT += dt * 1000
        if (bocaT >= bocaPasso) {
          bocaT = 0
          bocaPasso = bocaMs * (0.75 + Math.random() * 0.5)
          s.boca = !s.boca
        }
      } else s.boca = false
    }
    pinta(sobe)
    requestAnimationFrame(laco)
  }
  requestAnimationFrame(laco)
  return {
    get x() {
      return s.x
    },
    get y() {
      return s.y
    },
    get dir() {
      return s.dir
    },
    get andando() {
      return s.rota.length > 0
    },
    fala(on: boolean) {
      s.falando = !!on && !calmo
      if (!on) s.boca = false
    },
    vira(d: number) {
      s.dir = d
    },
    anda(rota: [number, number][], depois?: () => void) {
      s.rota = rota.slice()
      s.aoChegar = depois || null
      if (calmo && rota.length) {
        ;[s.x, s.y] = rota[rota.length - 1]
        s.rota = []
        depois?.()
      }
    },
    mostra(on: boolean) {
      el.hidden = sombra.hidden = !on
      if (on && !rodando && s.vivo) {
        rodando = true
        t0 = performance.now()
        ultima = ''
        requestAnimationFrame(laco)
      }
    },
    destroi() {
      s.vivo = false
      el.remove()
      sombra.remove()
    },
    el,
  }
}
