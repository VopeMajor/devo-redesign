import type { Efeito, NpcRef, Opcao, Passo } from '@/lib/devo/torres/tipos'
import { monta } from '../casa/npc-vn'
import type { ChibiNpc } from '../casa/npc-chibi'
import { paginar } from '../casa/paginar'
import type { Voz } from '../casa/som'
import { ANFITRIOES, poseDe, poseSrc, rostinhoTorre, preRostosTorre, ANIM, ARTE_V, type Anfitriao } from './anfitrioes'

/**
 * Cenas das Torres (kit3/torres.html, cenaLonga e cenaCurta; kit3/conversa-curta.js), lendo os passos do conteúdo
 * das Torres como DADO (lib/devo/torres/tipos.ts › Passo): fala, jogador, narra, sistema, bloco e escolha (com
 * resposta por opção, efeito no servidor e encerramento). Nada é reescrito: as falas entram como estão, só com o nome
 * e o gênero do jogador resolvidos.
 *  · 'longa': o encontro (1º andar, apresentação do Galo): o retrato grande ocupa a tela, respira, pisca e reage;
 *  · 'curta': os outros andares, no patamar: a caixa embaixo com o rostinho da pose e a boca do chibi mexendo;
 *  · 'oculta': o NPC ainda não definido (Torre da Ruptura, "???"): conversa curta sem rosto.
 */

export type ModoCena = 'longa' | 'curta' | 'oculta'

type Item =
  | { k: 'fala'; quem: 'npc' | 'outro' | 'jogador' | 'narra' | 'sistema'; nome: string; texto: string; pose?: string; cont?: boolean }
  | { k: 'escolha'; opcoes: Opcao[] }

const VOZ_OCULTA: Voz = { tipo: 'square', f0: 240, f1: 300, dur: 30, cada: 2, vol: 0.03 }

export type CenaOpcoes = {
  raiz: HTMLElement
  passos: Passo[]
  npc: NpcRef
  modo: ModoCena
  titulo: string
  /** Nome e gênero do jogador nos marcadores do texto ({nome}, {m|f}). */
  texto: (s: string) => string
  /** Chibi do anfitrião no patamar (conversa curta): a boca mexe com as letras. */
  boneco?: () => ChibiNpc | null
  /** Efeito pedido por uma escolha (apresentação do Galo). A cena espera. */
  onEfeito?: (e: Efeito) => Promise<void>
  /** Owner e Anfitrião: botão "Pular". */
  onPular?: () => void
  aoFim: () => void
}

export function tocaCena(o: CenaOpcoes) {
  const cfg: Anfitriao | null = ANFITRIOES[o.npc.id] ?? null
  const modo: ModoCena = cfg ? o.modo : 'oculta'
  const el = document.createElement('section')
  el.className = `tv-cena ${modo}`
  el.setAttribute('role', 'dialog')
  el.setAttribute('aria-label', o.titulo)
  el.innerHTML =
    '<img class="tv-fig" alt="" hidden><div class="tv-caixa"><i class="tv-rosto" hidden></i><b class="tv-nome"></b><p class="tv-tx" aria-live="polite"></p><div class="tv-esc"></div><small class="tv-seg" hidden>▼</small></div>'
  if (o.onPular) {
    const p = document.createElement('button')
    p.className = 'tv-pular'
    p.textContent = 'Pular'
    p.onclick = (e) => {
      e.stopPropagation()
      fecha(true)
      o.onPular?.()
    }
    el.append(p)
  }
  o.raiz.append(el)
  const $c = <T extends HTMLElement = HTMLElement>(s: string) => el.querySelector(s) as T
  const fig = $c<HTMLImageElement>('.tv-fig')
  const tx = $c('.tv-tx')
  const nome = $c('.tv-nome')
  const seg = $c('.tv-seg')
  const esc = $c('.tv-esc')

  const npc = monta(fig, {
    voz: cfg?.voz ?? VOZ_OCULTA,
    resp: cfg?.resp ?? 3,
    nome: () => nome,
    caixa: () => $c('.tv-caixa'),
    rosto: modo === 'longa' ? ANIM : null,
    versao: ARTE_V,
    piscar: cfg?.piscar ?? [3, 6],
    bocaMs: cfg?.bocaMs ?? 110,
    boca: o.boneco,
  })

  // o marcador "[PROVISÓRIO]" do conteúdo de exemplo não aparece na fala (como no protótipo)
  const tx0 = (t: string) => o.texto(t.replace(/^\[PROVISÓRIO\]\s*/, ''))
  const conv = (ps: Passo[]): Item[] =>
    ps.flatMap((p): Item[] => {
      switch (p.tipo) {
        case 'fala': {
          const doNpc = !p.quem || p.quem === o.npc.id
          return [{ k: 'fala', quem: doNpc ? 'npc' : 'outro', nome: doNpc ? o.npc.nome : p.quem!, texto: tx0(p.texto), pose: doNpc && cfg ? poseDe(o.npc.id, p.pose ?? o.npc.pose) : undefined }]
        }
        case 'jogador':
          return [{ k: 'fala', quem: 'jogador', nome: 'Você', texto: tx0(p.texto) }]
        case 'narra':
          return [{ k: 'fala', quem: 'narra', nome: '', texto: tx0(p.texto) }]
        case 'sistema':
          return [{ k: 'fala', quem: 'sistema', nome: 'Sistema', texto: tx0(p.texto) }]
        case 'bloco':
          return [{ k: 'fala', quem: 'sistema', nome: `[${o.texto(p.titulo)}]`, texto: p.texto.map(tx0).join('\n') }]
        case 'escolha':
          return [{ k: 'escolha', opcoes: p.opcoes }]
        default:
          return []
      }
    })
  let fila = conv(o.passos)
  // poses da cena inteira (incluindo as respostas das escolhas), para trocar sem piscar
  if (cfg) {
    const poses = new Set<string>()
    const anda = (ps: Passo[]) =>
      ps.forEach((p) => {
        if (p.tipo === 'fala' && (!p.quem || p.quem === o.npc.id)) poses.add(poseDe(o.npc.id, p.pose ?? o.npc.pose))
        if (p.tipo === 'escolha') p.opcoes.forEach((x) => x.resposta && anda(x.resposta))
      })
    anda(o.passos)
    const srcs = [...poses].map((p) => poseSrc(o.npc.id, p))
    if (modo === 'longa') npc.precarrega(srcs)
    else preRostosTorre(srcs)
  }

  let pronto = 0
  let ocupado = false
  let esperaEscolha = false
  let fechou = false

  async function passo() {
    if (fechou || esperaEscolha) return
    if (npc.completa()) return // o primeiro toque completa o texto
    if (performance.now() < pronto || ocupado) return // toques logo depois de um balão novo são ignorados
    ocupado = true
    try {
      await passo2()
    } finally {
      ocupado = false
    }
  }
  async function passo2() {
    const f = fila.shift()
    if (!f) return fecha()
    if (f.k === 'escolha') return mostraEscolha(f.opcoes)
    esc.innerHTML = ''
    el.dataset.quem = f.quem === 'outro' ? 'npc' : f.quem
    nome.textContent = f.nome
    if (!f.cont) {
      if (modo === 'longa' && f.quem === 'npc' && f.pose) {
        const src = poseSrc(o.npc.id, f.pose)
        if (fig.hidden) {
          await npc.pose(src, { mesma: true })
          if (fechou) return
          npc.mostra(true)
        } else {
          npc.escala()
          await npc.pose(src, { reage: cfg?.reage[f.pose] ?? 'nada' })
          if (fechou) return
        }
      }
      if (modo !== 'longa') void rostinhoTorre($c('.tv-rosto'), f.quem === 'npc' && f.pose && modo === 'curta' ? poseSrc(o.npc.id, f.pose) : null)
    }
    // balão de tamanho fixo: o que não cabe vira o balão seguinte, com o mesmo falante
    tx.textContent = ''
    const pags = paginar(tx, f.texto)
    if (pags.length > 1) fila.unshift(...pags.slice(1).map((t) => ({ ...f, texto: t, cont: true })))
    seg.hidden = true
    pronto = performance.now() + 120
    npc.fala(tx, pags[0], () => (seg.hidden = false), { comVoz: f.quem === 'npc' })
  }
  function mostraEscolha(ops: Opcao[]) {
    esperaEscolha = true
    seg.hidden = true
    esc.innerHTML = ''
    ops.forEach((op, i) => {
      const b = document.createElement('button')
      if (op.acao) {
        b.className = 'acao'
        const s = document.createElement('small')
        s.textContent = 'Ação'
        b.append(s)
      }
      b.append(`${i + 1} — ${o.texto(op.texto)}`)
      b.onclick = (e) => {
        e.stopPropagation()
        void escolhe(op)
      }
      esc.append(b)
    })
    esc.querySelector('button')?.focus({ preventScroll: true })
  }
  async function escolhe(op: Opcao) {
    if (!esperaEscolha || ocupado) return
    ocupado = true
    esc.querySelectorAll('button').forEach((b) => (b.disabled = true))
    try {
      if (op.efeito && o.onEfeito) await o.onEfeito(op.efeito)
    } finally {
      ocupado = false
    }
    if (fechou) return
    esperaEscolha = false
    esc.innerHTML = ''
    fila = [...conv(op.resposta ?? []), ...(op.encerra ? [] : fila)]
    void passo()
  }
  const tecla = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    // Enter num botão de escolha escolhe aquela opção (o próprio botão cuida)
    if ((e.target as HTMLElement | null)?.closest?.('.tv-esc, .tv-pular')) return
    e.preventDefault()
    void passo()
  }
  function fecha(pulou = false) {
    if (fechou) return
    fechou = true
    npc.destroi()
    removeEventListener('keydown', tecla)
    el.remove()
    if (!pulou) o.aoFim()
  }
  el.addEventListener('click', () => void passo())
  addEventListener('keydown', tecla)
  // o primeiro balão é medido com a fonte em pixel já carregada (senão o corte das páginas sai errado)
  const fontes = (document as Document & { fonts?: FontFaceSet }).fonts
  if (fontes) void fontes.ready.then(() => !fechou && void passo())
  else void passo()
  return {
    el,
    /** Sai sem terminar (a janela fechou no meio). */
    cancela() {
      fecha(true)
    },
  }
}
