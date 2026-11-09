import { BENCAOS, OFERENDAS, type OferendaId, ORAR } from '@/lib/devo/catedral'
import type { Aparencia } from '@/lib/devo/casa-aparencia'
import { folhaAndarFofo } from '../casa/avatar-cor'
import { criaChibi, type ChibiNpc } from '../casa/npc-chibi'
import { monta, preRostos, rostinho } from '../casa/npc-vn'
import { paginar } from '../casa/paginar'
import { calmo as calmoAgora } from '../casa/som'

/**
 * Catedral de Damasco no jogo (DEVO v2), a partir do protótipo aprovado (docs/redesign/v2/kit3/catedral.html).
 * Textos literais do Rup (docs/redesign/v2/NOTAS-RUP-02-11.md, itens 9, 10 e 11).
 *  · primeira visita: o diálogo da Ordem, longo, com o Erick em retrato grande (dono, 06/11);
 *  · visitas comuns: o Erick e você em chibi no corredor, o rostinho dele na caixa; saudação e despedida sorteadas;
 *  · altar: Orar (sem probabilidades definidas pelo Rup) e Oferecer uma oferenda (sorteio no servidor).
 * Sem roxo (dono, 02/11): pedra fria, ferro, ouro velho e vermelho-sangue.
 */

export type CatedralOpcoes = {
  aparencia: Aparencia | null
  descoberta: boolean
  oferendas: Record<OferendaId, number>
  equipe: boolean
  /** fim da primeira visita: 'altar' (foi até o fim) ou 'casa' (deixou para outro dia) */
  onPrimeiraFim: (fim: 'altar' | 'casa', escolhas: string[]) => Promise<{ oferendas: Record<OferendaId, number> } | null>
  onRitual: (oferenda: OferendaId, forca: number | null) => Promise<{ resultado: string; restam: number }>
  onSair: () => void
}

type Fala = { q: string; t: string; antes?: () => void | Promise<void>; cont?: boolean }
type No = { falas: Fala[]; escolha?: [string, string][]; proximo?: string; fim?: string; efeito?: () => void }

const ARTE_V = '202611030500'
const POSES = ['neutro', 'livro', 'sorriso', 'suspiro', 'observando', 'interessado', 'decepcionado', 'convite']
const REAGE: Record<string, string> = { suspiro: 'murchaLenta', interessado: 'inclina', decepcionado: 'ergue' }
const src = (p: string) => `/v2/art/catedral/erick-${p}.png?v=${ARTE_V}`
const ERICK: [number, number] = [385, 300]
const VOCE: [number, number] = [385, 396]

const sorteia = <T,>(l: T[]) => l[Math.floor(Math.random() * l.length)]
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

export function criaCatedral(raiz: HTMLElement, o: CatedralOpcoes) {
  const masc = !!o.aparencia?.corpo
  const g = (m: string, f: string) => (masc ? m : f)
  const calmo = calmoAgora()
  let vivo = true
  let inv = { ...o.oferendas }
  const timers = new Set<number>()
  const depois = (fn: () => void, ms: number) => {
    const t = window.setTimeout(() => {
      timers.delete(t)
      if (vivo) fn()
    }, ms)
    timers.add(t)
  }

  raiz.innerHTML = `<div class="cat-cena" aria-hidden="true"></div>
<div class="cat-palco" aria-hidden="true" hidden></div>
<img class="v-fig cat-fig" alt="" hidden>
<div class="cat-topo"><button class="cat-sair" aria-label="Voltar para casa">‹</button><div class="cat-lugar">Catedral de Damasco</div></div>
${o.equipe && new URLSearchParams(location.search).has('teste') ? '<div class="cat-teste" aria-label="Controle de teste da equipe"><button data-t="primeira">1ª visita</button><button data-t="comum">Visita comum</button></div>' : ''}
<section class="visita cat-vn" hidden aria-live="polite"><div class="v-caixa"><i class="v-rosto" hidden></i><b class="v-nome"></b><p class="v-tx"></p><div class="v-esc"></div><small class="v-seg">▼</small></div></section>
<section class="cat-altar" hidden aria-label="Altar"></section>
<section class="cat-res" hidden role="dialog" aria-label="Resultado do ritual"><span class="selo" aria-hidden="true"></span><small></small><strong></strong><p></p><span class="k">Toque para continuar</span></section>
<div class="cat-aviso" hidden role="status"></div>`
  const $ = <T extends HTMLElement = HTMLElement>(s: string) => raiz.querySelector(s) as T
  const cenaEl = $('.cat-cena')
  const palcoEl = $('.cat-palco')
  const fig = $<HTMLImageElement>('.cat-fig')
  const vn = $('.cat-vn')
  const altarEl = $('.cat-altar')
  const resEl = $('.cat-res')

  function aviso(t: string, ms = 2600) {
    const a = $('.cat-aviso')
    a.textContent = t
    a.hidden = false
    depois(() => (a.hidden = true), ms)
  }

  /* ---------- cenário: fora ou dentro; o palco segue o mesmo recorte "cover" do fundo (768x512) ---------- */
  let cenaAtual = ''
  let modoPalco = false
  function cena(img: 'fora' | 'dentro', escuro = false) {
    cenaEl.style.backgroundImage = `url(/v2/art/catedral/${img}.png?v=${ARTE_V})`
    cenaEl.classList.toggle('escuro', escuro)
    palcoEl.classList.toggle('escuro', escuro)
    cenaAtual = img
    palcoEl.hidden = !(img === 'dentro' && modoPalco)
  }
  function ajusta() {
    const w = raiz.clientWidth || innerWidth
    const h = raiz.clientHeight || innerHeight
    const k = Math.max(w / 768, h / 512)
    palcoEl.style.transform = `translate(${Math.round((w - 768 * k) / 2)}px,${Math.round((h - 512 * k) / 2)}px) scale(${k})`
  }
  ajusta()
  const ro = new ResizeObserver(ajusta)
  ro.observe(raiz)

  // você, de costas, alguns passos atrás do Erick (a folha de andar do avatar da Casa: coluna 0 parado, linha = direção)
  let eu: HTMLElement | null = null
  let euDir = 3
  let urlEu: string | null = null
  const pintaEu = () => {
    if (eu) eu.style.backgroundPosition = `0 -${euDir * 96}px`
  }
  if (o.aparencia)
    folhaAndarFofo(o.aparencia)
      .then((cv) =>
        cv.toBlob((b) => {
          if (!vivo || !b) return
          urlEu = URL.createObjectURL(b)
          const sb = document.createElement('i')
          sb.className = 'cat-eu-sombra'
          sb.style.cssText = `left:${VOCE[0]}px;top:${VOCE[1]}px;z-index:${VOCE[1] - 1}`
          eu = document.createElement('i')
          eu.className = 'cat-eu'
          eu.style.cssText = `left:${VOCE[0]}px;top:${VOCE[1]}px;z-index:${VOCE[1]};background-image:url(${urlEu});background-size:${cv.width}px ${cv.height}px`
          palcoEl.append(sb, eu)
          pintaEu()
        }),
      )
      .catch(() => {})
  const vira = (d: number) => {
    euDir = d
    pintaEu()
  }
  let chibi: ChibiNpc | null = null
  let chibiVisivel = false
  function erickNoPalco(on: boolean) {
    if (on && !chibi) chibi = criaChibi('erick', { mundo: palcoEl, x: ERICK[0], y: ERICK[1], dir: 0, versao: '202611060700', bocaMs: 150, piscar: [3.5, 7.5], piscaMs: 160, resp: 4.4 })
    if (chibi) chibi.mostra(on)
    chibiVisivel = on
  }

  /* ---------- o Erick: quase não se mexe; respira devagar (4,4 s), voz grave ---------- */
  const npc = monta(fig, {
    voz: { tipo: 'triangle', f0: 180, f1: 220, dur: 45, cada: 4, vol: 0.07 },
    resp: 4.4,
    nome: () => $('.cat-vn .v-nome'),
    caixa: () => $('.cat-vn .v-caixa'),
    rosto: '/v2/art/catedral/anim/',
    versao: '202611060600',
    piscar: [3.5, 7.5],
    piscaMs: 160,
    bocaMs: 150,
    letraMs: 34,
    boca: () => (chibiVisivel ? chibi : null),
  })
  npc.precarrega(POSES.map(src))
  preRostos(POSES.map(src))

  // o susto da narração ("O susto me faz virar…"): a cena corre de lado em 2 quadros e ele está lá, de corte
  async function viraSusto() {
    if (calmo) return
    await cenaEl
      .animate([{ backgroundPosition: '50% 50%' }, { backgroundPosition: '58% 50%' }, { backgroundPosition: '50% 50%' }], { duration: 160, easing: 'steps(2,end)' })
      .finished.catch(() => {})
  }
  let pedido = 0
  let poseErick: string | null = null
  function usaPalco(on: boolean) {
    modoPalco = on
    palcoEl.hidden = !(on && cenaAtual === 'dentro')
    vn.classList.toggle('mapa', on)
    if (on) {
      fig.hidden = true
      npc.mostra(false)
      if (poseErick) erickNoPalco(true)
    } else {
      erickNoPalco(false)
      void rostinho($('.cat-vn .v-rosto'), null)
    }
  }
  async function erick(pose: string | null, { inteiro = false, reage, entra }: { inteiro?: boolean; reage?: string; entra?: 'vira' } = {}) {
    const meu = ++pedido
    if (modoPalco) {
      fig.hidden = true
      npc.mostra(false)
      if (!pose) {
        poseErick = null
        erickNoPalco(false)
        return
      }
      if (!chibiVisivel && entra === 'vira') {
        await viraSusto()
        vira(3)
      }
      if (meu !== pedido) return
      poseErick = pose
      erickNoPalco(true)
      return
    }
    poseErick = pose
    if (!pose) {
      fig.hidden = true
      npc.mostra(false)
      return
    }
    const aparece = fig.hidden
    fig.classList.toggle('inteiro', inteiro)
    if (aparece && entra === 'vira') {
      await viraSusto()
      vira(3)
    }
    if (meu !== pedido || !vivo) return
    if (aparece) {
      await npc.pose(src(pose), { mesma: true })
      if (meu !== pedido || !vivo) return
      fig.hidden = false
      npc.mostra(true)
      return
    }
    npc.escala()
    await npc.pose(src(pose), { reage: reage ?? REAGE[pose] ?? null })
  }

  /* ---------- motor de diálogo (o mesmo modelo da visita do Simon) ---------- */
  let dialogoAtivo: { cancela(): void } | null = null
  const cancelaDialogo = () => (dialogoAtivo as { cancela(): void } | null)?.cancela()
  function dialogo(NOS: Record<string, No>, inicio: string, aoFim: (fim: string | undefined, escolhas: string[]) => void) {
    let fila: Fala[] = []
    let no: No = NOS[inicio]
    let espera = false
    let pronto = 0
    let ocupado = false
    let acabou = false
    const escolhas: string[] = []
    const s = <T extends HTMLElement = HTMLElement>(x: string) => vn.querySelector(x) as T
    function vai(id: string) {
      no = NOS[id]
      if (id !== inicio) escolhas.push(id)
      no.efeito?.()
      fila = [...no.falas]
      void passo()
    }
    async function passo() {
      if (npc.completa()) return // o primeiro toque completa o texto
      if (performance.now() < pronto || ocupado || acabou) return
      ocupado = true
      try {
        await passo2()
      } finally {
        ocupado = false
      }
    }
    async function passo2() {
      let f = fila.shift()
      if (!f) {
        if (no.escolha) return escolhe(no.escolha)
        if (no.proximo) return vai(no.proximo)
        termina()
        return aoFim(no.fim, escolhas)
      }
      if (f.antes && !f.cont) await f.antes()
      if (!vivo || acabou) return
      // balão de tamanho fixo: o que não cabe vira o balão seguinte, com o mesmo falante
      if (!f.cont) {
        const pags = paginar(s('.v-tx'), f.t)
        if (pags.length > 1) {
          fila.unshift(...pags.slice(1).map((t) => ({ ...f!, t, cont: true })))
          f = { ...f, t: pags[0] }
        }
      }
      const fala = f.q === 'Erick Zorak' || f.q === '???'
      vn.dataset.quem = f.q === 'narra' ? 'narra' : f.q === 'Sistema' ? 'sistema' : f.q === 'Jogador' ? 'jogador' : 'npc'
      s('.v-nome').textContent = f.q === 'narra' ? '' : f.q === 'Jogador' ? 'Você' : f.q
      void rostinho(s('.v-rosto'), modoPalco && fala && chibiVisivel && poseErick ? src(poseErick) : null)
      s('.v-esc').innerHTML = ''
      s('.v-seg').hidden = true
      espera = false
      pronto = performance.now() + 120
      npc.fala(s('.v-tx'), f.t, () => (s('.v-seg').hidden = false), { comVoz: fala })
    }
    function escolhe(ops: [string, string][]) {
      espera = true
      s('.v-seg').hidden = true
      const e = s('.v-esc')
      e.innerHTML = ''
      ops.forEach(([t, id], i) => {
        const b = document.createElement('button')
        b.textContent = `${i + 1} — ${t}`
        b.onclick = (ev) => {
          ev.stopPropagation()
          vai(id)
        }
        e.append(b)
      })
      ;(e.querySelector('button') as HTMLButtonElement | null)?.focus({ preventScroll: true })
    }
    function tecla(e: KeyboardEvent) {
      if ((e.key === 'Enter' || e.key === ' ') && !espera && !(e.target as HTMLElement)?.closest?.('button')) {
        e.preventDefault()
        void passo()
      }
    }
    function termina() {
      acabou = true
      vn.hidden = true
      vn.onclick = null
      removeEventListener('keydown', tecla)
      if (dialogoAtivo === ctl) dialogoAtivo = null
    }
    const ctl = { cancela: termina }
    cancelaDialogo()
    dialogoAtivo = ctl
    vn.hidden = false
    vn.onclick = () => {
      if (!espera) void passo()
    }
    addEventListener('keydown', tecla)
    // o primeiro balão é medido com a fonte em pixel já carregada (senão o corte das páginas sai errado)
    const fontes = (document as Document & { fonts?: FontFaceSet }).fonts
    const comeca = () => {
      if (vivo && !acabou) {
        no = NOS[inicio]
        no.efeito?.()
        fila = [...no.falas]
        void passo()
      }
    }
    if (fontes) void fontes.ready.then(comeca)
    else comeca()
  }
  const N = (t: string, antes?: () => void | Promise<void>): Fala => ({ q: 'narra', t, antes })
  const J = (t: string): Fala => ({ q: 'Jogador', t })
  const E = (t: string, pose = 'neutro', quem = 'Erick Zorak'): Fala => ({ q: quem, t, antes: () => erick(pose) })
  const SIS = (t: string): Fala => ({ q: 'Sistema', t })

  /* ---------- item 9: Ordem Ortodoxa, primeiro diálogo (literal) ---------- */
  function primeiraVisita() {
    usaPalco(false)
    cena('fora')
    void erick(null)
    vira(0)
    altarEl.hidden = true
    const NOS: Record<string, No> = {
      a: {
        falas: [
          J('“O mundo não possui mais as mesmas cores desde que esses acontecimentos estranhos começaram a fazer parte da minha vida.”'),
          J('“Talvez exista algum lugar onde eu ainda possa me sentir bem.”'),
          J('“Ouvi dizer que existe uma igreja nas redondezas...”'),
          J('“Eu deveria ir até lá.”'),
          N('[ … ]'),
          N('[Ouço o tinido de um sino pesado.]'),
          N('[O som é tão alto que sinto vontade de cobrir os ouvidos.]'),
          N(
            '[Nunca considerei a possibilidade de encontrar algo tão fantasioso nesta cidade. Parece uma igreja antiga, semelhante a uma basílica histórica da qual nunca ouvi falar em lugar algum, nem na internet, nem na televisão. Sua presença transmite uma sensação muito mais pesada e sufocante do que a de qualquer outro templo religioso. Não é acolhedora. É intimidadora.]',
          ),
          N('[Tanto sua arquitetura quanto o silêncio que a envolve parecem deliberadamente construídos para afastar visitantes. Nada nela me parece convidativo o bastante para despertar o desejo de entrar.]'),
          N(
            '[E os simbolismos espalhados pela entrada... Embora lembrem vagamente aqueles encontrados em algumas vertentes do cristianismo, são diferentes demais para serem associados a qualquer religião que eu conheça.]',
          ),
          J('“Mesmo com toda essa arquitetura, duvido que seja um templo comum de alguma religião convencional.”'),
          J('“É completamente diferente de todos os outros templos pelos quais passei até hoje.”'),
          J(
            '“Talvez agora, sendo alguma coisa diferente de um ser humano, eu finalmente consiga enxergar essas coisas. Essa energia absurda, essa aura... É completamente sobrenatural. Ela me lembra um Deadly Vote.”',
          ),
          J('“Será que eu deveria mesmo entrar?”'),
        ],
        escolha: [
          ['[Deixar para outro dia]', 'casa'],
          ['[Usar a aldrava]', 'aldrava'],
        ],
      },
      casa: { falas: [], fim: 'casa' },
      aldrava: {
        falas: [
          N('[Som de uma batida pesada.]'),
          J('“Foi bem mais alto do que eu esperava.”'),
          N('[ … ]'),
          N('[Depois de alguns minutos esperando, percebi que ninguém viria me atender.]'),
          N('[Decidi, então, tentar abrir a porta por conta própria. E, para minha surpresa...]'),
          N('[Crec.]'),
          N('[ ... ]', () => cena('dentro')),
          J('“É tão grande quanto parecia por fora.”'),
          J('“Tudo aqui parece tão silencioso. Não vejo ninguém além de mim.”'),
          J('“Será que vim em um horário ruim?”'),
          { q: '???', t: 'De forma alguma, Record.' },
          N('[O susto me faz virar imediatamente na direção da voz. Só então percebo a presença de alguém que esteve bem atrás de mim durante todo esse tempo.]', () =>
            erick('neutro', { inteiro: true, entra: 'vira' }),
          ),
          N(
            '[Era uma figura alta, de aparência masculina, pele acobreada e rosto completamente desprovido de pelos. Seus cabelos eram finos, e vestia uma batina preta, ornamentada com diversos acessórios prateados.]',
          ),
          E('Não tenha medo.', 'neutro', '???'),
          E('Estive observando. Apenas fiquei curioso para saber se você realmente entraria ou não...', 'observando', '???'),
        ],
        escolha: [
          ['Quem é você?', 'q1'],
          ['Como você leu minha mente?', 'q2'],
          ['Por quê?', 'q3'],
        ],
      },
      q1: {
        falas: [E(`Meu nome é Erick Zorak. Sou o Bispo e humilde aprendiz do Arcebispo desta Catedral que tu, ${g('humilde servo', 'humilde serva')}, agora contemplas.`, 'sorriso', '???')],
        proximo: 'obs',
      },
      q2: { falas: [E('Perdão, mas isso não parece algo que alguém consiga fazer com tanta facilidade.', 'neutro', '???')], proximo: 'obs' },
      q3: { falas: [E('...', 'neutro', '???')], proximo: 'obs' },
      obs: {
        falas: [E('Consigo observar as pessoas que passam pela rua lá de cima. Geralmente fico imaginando quem será a próxima a atravessar aquela porta... E gosto de tentar adivinhar.', 'observando')],
        escolha: [
          ['O que é este lugar?', 'l1'],
          ['Aqui não é normal, certo?', 'l2'],
        ],
      },
      l1: { falas: [E('Uma Catedral... Conhecida como Igreja Ortodoxa de Damasco. Cuidamos de todos os assuntos que você possa imaginar.')], proximo: 'p3' },
      l2: { falas: [E('Isso quem deve me dizer é você. Para mim, tudo aqui parece completamente normal.', 'interessado')], proximo: 'p3' },
      p3: {
        falas: [],
        escolha: [
          ['Você é um péssimo mentiroso.', 'r'],
          ['Quero sair daqui. Não sei do que você está falando!', 'r'],
          ['O que posso conseguir neste lugar?', 'r'],
        ],
      },
      r: {
        falas: [
          E('[Suspiro...]', 'suspiro'),
          E('Eu estava desconfiando. Então é verdade. Você é um de nós.', 'neutro'),
          E(
            'Mencionei aquela palavra com R logo no início da nossa conversa. Mas você reagiu tão naturalmente... Nem sequer me perguntou o que eu queria dizer com aquilo. Acho que acabei acertando meu palpite.',
            'sorriso',
          ),
        ],
        escolha: [
          ['...', 'd'],
          ['Você está errado.', 'd'],
          ['Isso é verdade.', 'd'],
          ['E daí?', 'd'],
        ],
      },
      d: {
        falas: [E('Diga-me, o que um Record que nunca vi antes está fazendo por aqui?', 'observando')],
        escolha: [
          [`Estou... ${g('confuso', 'confusa')}.`, 'e12'],
          ['Eu não sei.', 'e12'],
          ['Senti que este lugar era especial, então decidi entrar.', 'e3'],
          ['Sou um novato da Companhia de Despertados.', 'e4'],
        ],
      },
      e12: { falas: [E('Isso era esperado.')], proximo: 'fim' },
      e3: { falas: [E('Então você sente...', 'interessado'), SIS('+100 Karma de Caos.')], proximo: 'fim' },
      e4: { falas: [E('É mesmo? Decepcionante.', 'decepcionado')], proximo: 'fim' },
      fim: {
        falas: [
          E('Parece existir muito conflito dentro de você. Talvez devesse aproveitar esta oportunidade que o destino lhe concedeu... Quem sabe este não seja, afinal, o seu verdadeiro lugar?'),
          E('Por que não aproveita esta oportunidade para orar comigo?', 'convite'),
          SIS('[Sistema: Nova área desbloqueada — Catedral de Damasco.]'),
          SIS('[Sistema: A partir de agora, sempre que sair de casa, você poderá escolher a Catedral de Damasco como um de seus destinos.]'),
          E('Venha. Tente pelo menos uma vez.', 'convite'),
        ],
        fim: 'altar',
      },
    }
    dialogo(NOS, 'a', (fim, escolhas) => {
      const f = fim === 'altar' ? 'altar' : 'casa'
      void o.onPrimeiraFim(f, escolhas).then((r) => {
        if (!r || !vivo) return
        inv = { ...r.oferendas }
        if (!altarEl.hidden && tela === 'ofer') ofer()
      })
      if (f === 'casa') vaiCasa()
      else altar()
    })
  }

  /* ---------- item 11: saudações e despedidas (literais) ---------- */
  const SAUDA = [
    `Você de novo? Seja ${g('bem-vindo', 'bem-vinda')}.`,
    'Fico feliz que isso tenha se tornado um hábito.',
    'É sempre bom encontrar rostos familiares.',
    'O que há de tão interessante nesta igreja?',
    'Você, hum?',
    'Não sei exatamente no que acredita, mas devo admitir que sua fé é admirável.',
  ]
  const ADEUS = [
    'É um pouco mais cedo do que eu gostaria, mas... até logo.',
    'Já vai, não é? Então, adeus.',
    'É sempre bom ver você... Ficarei aguardando nosso próximo encontro.',
    'Ora, ora. Saindo de fininho, hum? Vá pela sombra.',
    'Ainda consigo enxergar você da torre do sino. Vá pela calçada... E tome cuidado.',
    '[ Suspira tristemente... ]',
  ]
  function visitaComum() {
    usaPalco(true)
    vira(3)
    cena('dentro')
    altarEl.hidden = true
    const p = sorteia(['sorriso', 'observando', 'interessado', 'livro'])
    void erick(p)
    dialogo({ s: { falas: [E(sorteia(SAUDA), p)], fim: 'altar' } }, 's', altar)
  }
  let saindo = false
  function despede() {
    if (saindo) return
    altarEl.hidden = true
    resEl.hidden = true
    usaPalco(true)
    cena('dentro')
    const t = sorteia(ADEUS)
    dialogo({ d: { falas: [E(t, t.startsWith('[') ? 'suspiro' : sorteia(['neutro', 'observando', 'sorriso']))], fim: 'casa' } }, 'd', vaiCasa)
  }
  function vaiCasa() {
    if (saindo) return
    saindo = true
    cancelaDialogo()
    cenaEl.classList.add('escuro')
    palcoEl.classList.add('escuro')
    depois(() => o.onSair(), 420)
  }

  /* ---------- item 10: altar ---------- */
  function altar() {
    usaPalco(true)
    vira(3)
    cena('dentro')
    void erick('livro')
    vn.hidden = true
    altarEl.hidden = false
    altarEl.innerHTML = `<div class="lista"><h2>Erick Zorak</h2><p class="sub">O que você deseja fazer?</p>
      <button class="op" data-v="orar"><b>1 - Orar.</b><small>Mesmo sem oferecer qualquer objeto, você ainda pode realizar uma oração e manifestar determinados desejos.</small></button>
      <button class="op" data-v="ofer"><b>2 - Oferecer uma oferenda.</b><small>Selecione uma das oferendas disponíveis e realize o ritual correspondente para tentar obter uma bênção ou maldição.</small></button>
      <button class="voltar" data-v="sair">Sair da Catedral</button></div>`
    altarEl.querySelectorAll<HTMLButtonElement>('[data-v]').forEach((b) => (b.onclick = () => ({ orar, ofer, sair: despede })[b.dataset.v as 'orar' | 'ofer' | 'sair']()))
    altarEl.scrollTop = 0
    altarEl.querySelector<HTMLButtonElement>('.op')?.focus({ preventScroll: true })
  }
  let tela: 'altar' | 'orar' | 'ofer' = 'altar'
  function orar() {
    tela = 'orar'
    altarEl.innerHTML = `<div class="lista"><h2>Orar</h2><p class="sub">As orações realizadas sem oferendas possuem opções limitadas e resultados mais modestos.</p>
      ${ORAR.map((x) => `<button class="op" data-o="${x.id}"><b>${esc(x.nome)}</b><small>[${esc(x.descricao)}]</small></button>`).join('')}
      <button class="voltar" data-v="v">Voltar</button></div>`
    altarEl.querySelector<HTMLButtonElement>('[data-v]')!.onclick = voltaAltar
    altarEl.querySelectorAll<HTMLButtonElement>('[data-o]').forEach(
      (b) =>
        (b.onclick = () => {
          const x = ORAR.find((y) => y.id === b.dataset.o)!
          resultado('#c9b78e', 'Oração', x.nome.slice(4), x.descricao)
        }),
    )
    altarEl.scrollTop = 0
  }
  function voltaAltar() {
    tela = 'altar'
    altar()
  }
  let queimando = false
  function ofer() {
    tela = 'ofer'
    altarEl.innerHTML = `<div class="lista"><h2>Oferendas disponíveis</h2><p class="sub">Cada oferenda possui probabilidades próprias de resultado. Portanto, consulte atentamente as informações disponíveis antes de decidir o que deseja sacrificar.</p>
      ${OFERENDAS.map((x, i) => {
        const n = inv[x.id] || 0
        return `<button class="op" data-f="${x.id}"${n ? '' : ' disabled'}><b>${String(i + 1).padStart(2, '0')}. ${esc(x.nome)} <em>· você tem ${n}</em></b><small>${esc(x.descricao)}</small>
        <span class="prob" aria-hidden="true">${x.resultados.map(([r, p]) => `<i class="${r === 'Nada' ? 'nada' : r.startsWith('Bênção') ? 'ben' : 'mal'}" style="--p:${p}">${p}%</i>`).join('')}</span>
        <small>${x.resultados.map(([r, p]) => `${esc(r)} ${p}%`).join(' · ')}</small></button>`
      }).join('')}
      <button class="voltar" data-v="v">Voltar</button></div>`
    altarEl.querySelector<HTMLButtonElement>('[data-v]')!.onclick = voltaAltar
    altarEl.querySelectorAll<HTMLButtonElement>('[data-f]').forEach(
      (b) =>
        (b.onclick = async () => {
          if (queimando) return
          const x = OFERENDAS.find((y) => y.id === b.dataset.f)!
          queimando = true
          b.disabled = true
          b.classList.add('queimando')
          try {
            const forca = o.equipe ? Number(new URLSearchParams(location.search).get('forca') ?? NaN) : NaN
            const r = await o.onRitual(x.id, Number.isInteger(forca) ? forca : null)
            if (!vivo) return
            inv[x.id] = r.restam
            const nada = r.resultado === 'Nada'
            resultado(nada ? '#8a8580' : r.resultado.startsWith('Bênção') ? '#c9b78e' : '#8a2a2e', x.nome, r.resultado, nada ? 'Nada aconteceu.' : (BENCAOS[r.resultado] ?? ''))
          } catch (e) {
            aviso((e as Error).message, 3200)
            ofer()
          } finally {
            queimando = false
          }
        }),
    )
    altarEl.scrollTop = 0
  }
  let resPose: [string, string] | null = null
  function resultado(cor: string, de: string, tit: string, txt: string) {
    resEl.style.setProperty('--c', cor)
    resEl.querySelector('small')!.textContent = de
    resEl.querySelector('strong')!.textContent = tit
    resEl.querySelector('p')!.textContent = txt
    resEl.hidden = false
    resPose = tit.startsWith('Maldição') ? ['sorriso', 'inclina'] : tit === 'Nada' ? ['suspiro', 'murchaLenta'] : ['neutro', 'nada']
    resEl.focus({ preventScroll: true })
  }
  resEl.tabIndex = -1
  function fechaResultado() {
    resEl.hidden = true
    if (tela === 'ofer') ofer()
    else if (tela === 'orar') orar()
    else altar()
    if (resPose) {
      const [p, r] = resPose
      resPose = null
      void erick(p, { reage: r })
    }
  }
  resEl.onclick = fechaResultado
  resEl.onkeydown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      fechaResultado()
    }
  }

  $<HTMLButtonElement>('.cat-sair').onclick = () => voltar()
  raiz.querySelectorAll<HTMLButtonElement>('.cat-teste [data-t]').forEach(
    (b) =>
      (b.onclick = () => {
        resEl.hidden = true
        if (b.dataset.t === 'primeira') primeiraVisita()
        else visitaComum()
      }),
  )

  /** Voltar (botão ‹ ou o voltar do aparelho): fecha a camada de cima; do altar, despede-se. Devolve false se já saiu. */
  function voltar(): boolean {
    if (saindo) return true
    if (!resEl.hidden) {
      fechaResultado()
      return true
    }
    if (!altarEl.hidden && tela !== 'altar') {
      voltaAltar()
      return true
    }
    if (!altarEl.hidden) {
      despede()
      return true
    }
    // no meio de um diálogo (a primeira visita, a saudação ou a despedida): sai direto para casa
    vaiCasa()
    return true
  }

  if (o.descoberta) visitaComum()
  else primeiraVisita()
  if (o.equipe && new URLSearchParams(location.search).get('altar') === 'ofer') {
    cancelaDialogo()
    altar()
    ofer()
  }

  return {
    voltar,
    destroi() {
      vivo = false
      cancelaDialogo()
      timers.forEach(clearTimeout)
      timers.clear()
      ro.disconnect()
      npc.destroi()
      chibi?.destroi()
      if (urlEu) URL.revokeObjectURL(urlEu)
      raiz.innerHTML = ''
    },
  }
}
