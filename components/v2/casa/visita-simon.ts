import type { Aparencia } from '@/lib/devo/casa-aparencia'
import { monta, preRostos, rostinho } from './npc-vn'
import { paginar } from './paginar'
import { som } from './som'
import type { ChibiNpc } from './npc-chibi'

/**
 * Simon, o Carteiro: a primeira visita da casa (kit3/visita-simon.js). Texto literal do Rup
 * (docs/redesign/v2/NOTAS-RUP-02-11.md, itens 6 e 7). Simon é sempre o primeiro a visitar; enquanto não for atendido,
 * ninguém mais aparece. g('o','a') resolve o gênero pela aparência do avatar; "X" é a coordenada da casa (pendente).
 * Diálogo longo: retrato grande (dono, 06/11). O palco na porta (chibi falando, rostinho na caixa) fica para as
 * visitas curtas.
 */
export type FimSimon = { fim: 'atendeu' | 'ignorou'; guardaChuva?: 'ficou' | 'deu'; escolhas: string[] }

export type PalcoVisita = {
  readonly boneco: ChibiNpc | null
  entra(): void
  fala(pose: string): void
  entraCasa(): void
  volta(): void
  sai(): void
  fim(): void
}

type Fala = { quem: string; texto: string; pose?: string; alerta?: boolean; olho?: boolean; longe?: boolean; inteiro?: boolean; cont?: boolean }
type No = { falas: Fala[]; escolha?: [string, string][]; proximo?: string; fim?: 'atendeu' | 'ignorou'; efeito?: 'deu' | 'ficou' }

const ARTE_V = '202611030500'
const POSES = ['sorriso', 'animado', 'malicia', 'decepcionado', 'nervoso', 'irritado', 'surpreso', 'cantando']
const REAGE: Record<string, string> = { animado: 'pula', surpreso: 'susto', irritado: 'treme', nervoso: 'tremor', decepcionado: 'murcha', malicia: 'inclina', cantando: 'balanca', sorriso: 'assenta' }
const src = (p: string) => `/v2/art/simon/${p}.png?v=${ARTE_V}`

export function visitaSimon(raiz: HTMLElement, { aparencia, aoFim, palco = null }: { aparencia: Aparencia | null; aoFim?: (r: FimSimon) => void; palco?: PalcoVisita | null }) {
  const masc = !!aparencia?.corpo
  const g = (m: string, f: string) => (masc ? m : f)
  const COORD = 'X'
  const F = (quem: string, texto: string, extra: Partial<Fala> = {}): Fala => ({ quem, texto, ...extra })
  const N = (t: string) => F('narra', t)
  const S = (t: string, pose = 'sorriso') => F('Simon', t, { pose })
  const J = (t: string) => F('Jogador', t)
  const SIS = (t: string) => F('Sistema', t)
  const NOS: Record<string, No> = {
    inicio: {
      falas: [
        N('[Som de campainha]'),
        N('[Tem alguém na porta.]'),
        J('Eu devo ir?'),
        SIS(
          'Sempre que sua campainha tocar ou você ouvir alguém batendo à porta, significa que há alguém esperando do lado de fora. Essa pessoa pode ser um NPC amigável, hostil ou simplesmente alguém em busca de informações. As possibilidades são praticamente infinitas, mas atender ou não é uma decisão inteiramente sua — e que deve ser tomada com cautela.',
        ),
      ],
      escolha: [
        ['[Ignorar]', 'ignorar'],
        ['[Abrir a porta]', 'abrir'],
      ],
    },
    ignorar: { falas: [N('[Depois de alguma insistência, a figura desconhecida parece ter ido embora.]')], fim: 'ignorou' },
    abrir: {
      falas: [
        N('[Você se aproxima da porta e olha pelo olho mágico. A lente parece um tanto suja, tornando a imagem borrada, mas ainda é possível distinguir a presença de alguém do outro lado.]'),
        F(
          'Sistema',
          'Sempre que receber uma visita e decidir atendê-la, você terá a oportunidade de observar o visitante pelo olho mágico da porta. Isso pode fornecer algumas pistas sobre quem está do outro lado, mas será necessário ter conhecimento suficiente para interpretá-las.',
          { alerta: true, olho: true },
        ),
        N('[A porta é aberta gradualmente.]'),
        N('[Revelando uma figura surpreendentemente baixa, vestida com o uniforme de um carteiro.]'),
        N('[Não. De uma carteira?]'),
        S(`Olá! Você é ${g('o novo morador', 'a nova moradora')}, certo? Eu sou Simon, seu carteiro mais pontual!`, 'animado'),
        ...(masc ? [S('E que pontual eu sou…', 'malicia')] : []),
        S(`Bem, aqui é o ${COORD}, certo? Deve ser mesmo. É uma ótima casa... Você tem tanta sorte. Estou com inveja disso.`),
        S('Já fazia algum tempo que eu sentia falta de entregar coisas por aqui. Que demais! Vamos ser bons amigos, que tal?', 'animado'),
      ],
      escolha: [
        ['Você é um carteiro normal ou...?', 'normal'],
        ['O que aconteceu com o antigo morador?', 'antigo'],
      ],
    },
    normal: {
      falas: [S('Haha! Calma. Eu sei da sua condição, mas não tenho relação nenhuma com essas coisas, não. Só conte comigo se o assunto for correspondências ou entregas, belê?', 'nervoso')],
      proximo: 'preco',
    },
    antigo: { falas: [S('H-Hum... Eles não te contaram? Eu até poderia dizer, mas... Ah, tudo tem um preço.', 'nervoso')], proximo: 'preco' },
    preco: {
      falas: [
        SIS(
          'Simon pode oferecer informações em troca de uma quantia de tempo.\nAceitar ou não suas condições é uma escolha sua. As informações que ele fornece não são exatamente essenciais, portanto, não há problema algum em ignorá-lo sempre que desejar. Ainda assim, conhecer alguns detalhes interessantes pode fazer a diferença para aqueles que gostam de aproveitar todas as oportunidades.',
        ),
      ],
      escolha: [
        ['Quanto você quer?', 'quanto'],
        [`Não, ${g('obrigado', 'obrigada')}.`, 'nao'],
      ],
    },
    quanto: {
      falas: [
        S('Essa primeira vai ser por conta da casa! Que tal? Em troca, escolha sempre os meus serviços antes dos da concorrência...', 'malicia'),
        S(
          'O antigo morador era um homem alto que vivia usando roupas amarelas. Acho que ele comentou uma vez que gostava de pintar quadros e porcelanato. É uma pena que aquele balde enorme tenha caído na cabeça dele durante seus serviços valorosos.',
        ),
        S(
          'Dizem que o balde era tão pesado que o impacto parecia até um tiro de escopeta na nuca. E isso vindo de um colega da Companhia, quando ele menos esperava! Coitado... Imagine se esse tivesse sido mesmo o caso? Eu é que não gostaria de morrer assassinado pela própria Corporação que tanto me alimentou...',
          'malicia',
        ),
      ],
      proximo: 'ajuda',
    },
    nao: { falas: [S('H-Hein?! Tsk. Que pena...', 'irritado')], proximo: 'ajuda' },
    ajuda: {
      falas: [
        S('Bom, esqueça isso. Quem sabe ele não deixou alguma coisa útil por aqui? Talvez até tenha virado um fantasma que assombra a casa... Tente dar uma conferida depois. Ou quer uma ajudinha?'),
        N('[Simon parece interessado em entrar na casa para procurar pertences do antigo morador. Permitir que um estranho entre pode ser arriscado.]'),
        J('“O que devo fazer?”'),
      ],
      escolha: [
        ['Não é uma boa ideia.', 'frieza'],
        ['Você é bem-vindo. Entre.', 'entra'],
      ],
    },
    frieza: { falas: [S('Uau. Que frieza!', 'surpreso')], proximo: 'adeus' },
    entra: {
      falas: [
        S('Tá, tá. Eu vou embora, entã... Hein? Sério mesmo?', 'surpreso'),
        S('Haha! Então tá! Vamos lá!', 'animado'),
        N(
          '[Simon entra na casa com passos silenciosos, suas perninhas mal fazendo barulho pelo chão. Ele parece bastante interessado e começa a vasculhar todos os armários, inclusive aqueles que pedi expressamente para não mexer...]',
        ),
        S('Bom... Terminamos. Eu tentei. [Suspiro]', 'decepcionado'),
        N('[Simon olha para mim da entrada. Parece um tanto decepcionado com o resultado pouco satisfatório da nossa investigação.]'),
        S('Aquele maldito deixou apenas um guarda-chuva... Isso é tão triste!', 'decepcionado'),
        S('Bem, agora ele é seu. Use como bem entender. Ainda é uma herança, talvez... Será que isso lhe concede algum valor?'),
        S('Se não quiser, que tal me dar?', 'malicia'),
      ],
      escolha: [
        ['[Oferecer o guarda-chuva]', 'deu'],
        ['[Ficar com o guarda-chuva]', 'ficou'],
      ],
    },
    deu: { falas: [S('Woow. Obrigadinho…', 'animado')], proximo: 'adeus', efeito: 'deu' },
    ficou: { falas: [S('Acho que não.', 'irritado')], proximo: 'adeus', efeito: 'ficou' },
    adeus: {
      falas: [
        S('Agora estou indo embora. A mala já está lá fora. Vou te deixar. Te deixar… 🎶 Goodbye ❣️', 'cantando'),
        N('[Fecho a porta.]'),
        N('[Ele foi embora.]'),
        F('Simon', 'Te deixar... 🎶 [Muito baixo]', { longe: true, pose: 'cantando' }),
        J('Com certeza ele foi.'),
      ],
      fim: 'atendeu',
    },
  }

  const el = document.createElement('section')
  el.className = 'visita' + (palco ? ' mapa' : '')
  el.setAttribute('role', 'dialog')
  el.setAttribute('aria-label', 'Visita')
  el.innerHTML = `<div class="v-olho" hidden><img src="/v2/art/simon/olho-magico.png?v=${ARTE_V}" alt="O visitante, borrado pelo olho mágico"></div>
    <img class="v-fig" alt="" hidden><div class="v-caixa"><i class="v-rosto" hidden></i><b class="v-nome"></b><p class="v-tx" aria-live="polite"></p><div class="v-esc"></div><small class="v-seg">▼</small></div>`
  raiz.append(el)
  const $v = <T extends HTMLElement = HTMLElement>(s: string) => el.querySelector(s) as T
  let fila: Fala[] = []
  let no: No = NOS.inicio
  let esperaEscolha = false
  const resultado: { guardaChuva?: 'ficou' | 'deu' } = {}
  const escolhas: string[] = []
  const fig = $v<HTMLImageElement>('.v-fig')
  const npc = monta(fig, {
    voz: { tipo: 'square', f0: 640, f1: 760, dur: 30, cada: 2, vol: 0.035 },
    resp: 2.4,
    nome: () => $v('.v-nome'),
    caixa: () => $v('.v-caixa'),
    rosto: '/v2/art/simon/anim/',
    versao: '202611060600',
    piscar: [2.2, 5],
    piscaMs: 100,
    bocaMs: 100,
    boca: () => (palco ? palco.boneco : null),
  })
  npc.precarrega(POSES.map(src))
  if (palco) preRostos(POSES.map(src))
  function vaiPara(id: string) {
    no = NOS[id]
    if (id !== 'inicio') escolhas.push(id)
    if (no.efeito) resultado.guardaChuva = no.efeito
    fila = [...no.falas]
    void passo()
  }
  let pronto = 0
  function mostraTexto(f: Fala, t: string) {
    const tx = $v('.v-tx')
    $v('.v-esc').innerHTML = ''
    $v('.v-seg').hidden = true
    esperaEscolha = false
    pronto = performance.now() + 120
    npc.fala(tx, t, () => ($v('.v-seg').hidden = false), { comVoz: f.quem === 'Simon' })
  }
  let ocupado = false
  async function passo() {
    if (npc.completa()) return
    if (performance.now() < pronto || ocupado) return
    ocupado = true
    try {
      await passo2()
    } finally {
      ocupado = false
    }
  }
  async function passo2() {
    const f = fila.shift()
    if (!f) {
      if (no.escolha) return mostraEscolha(no.escolha)
      if (no.proximo) return vaiPara(no.proximo)
      return fecha(no.fim!)
    }
    if (f.texto === '[Som de campainha]') som('campainha')
    if (f.cont) return mostraTexto(f, f.texto)
    const porta = f.texto === '[A porta é aberta gradualmente.]'
    if (palco) {
      const fala = f.quem === 'Simon' && !f.longe
      void rostinho($v('.v-rosto'), fala ? src(f.pose || 'sorriso') : null)
      if (fala) palco.fala(f.pose || 'sorriso')
      if (porta) palco.entra()
      else if (f.texto.startsWith('[Simon entra na casa')) palco.entraCasa()
      else if (f.texto.startsWith('[Simon olha para mim da entrada')) palco.volta()
      else if (f.texto === '[Fecho a porta.]') palco.sai()
    } else if (f.quem === 'Simon') {
      // nas falas o Simon aparece do busto para cima; corpo inteiro só na porta se abrindo e de longe, na despedida
      const p = f.pose || 'sorriso'
      fig.classList.toggle('longe', !!f.longe)
      fig.classList.toggle('inteiro', !!(f.longe || f.inteiro))
      if (fig.hidden) npc.mostra(true)
      fig.hidden = false
      npc.escala()
      await npc.pose(src(p), { reage: f.longe ? null : REAGE[p] })
      if (fechou) return
    } else if (porta) {
      fig.classList.remove('longe')
      fig.classList.add('inteiro')
      fig.hidden = false
      npc.escala()
      await npc.pose(src('sorriso'), { mesma: true })
      if (fechou) return
      npc.mostra(true)
      void npc.entra('porta')
    } else if (f.texto.startsWith('[Simon entra na casa')) {
      fig.hidden = true
      npc.mostra(false)
    } else if (f.texto === '[Fecho a porta.]') {
      await npc.sai('porta', el)
      if (fechou) return
      fig.hidden = true
      npc.mostra(false)
    } else if (f.texto === '[Ele foi embora.]') fig.hidden = true
    $v('.v-olho').hidden = !f.olho && !f.texto.includes('olho mágico')
    el.dataset.quem = f.quem === 'narra' ? 'narra' : f.quem === 'Sistema' ? 'sistema' : f.quem === 'Jogador' ? 'jogador' : 'npc'
    el.classList.toggle('alerta', !!f.alerta)
    $v('.v-nome').textContent = f.quem === 'narra' ? '' : f.quem === 'Sistema' ? (f.alerta ? '⚠️ Sistema' : 'Sistema') : f.quem === 'Jogador' ? 'Você' : f.quem
    // balão de tamanho fixo: o que não cabe vira o balão seguinte, com o mesmo falante
    const pags = paginar($v('.v-tx'), f.texto)
    if (pags.length > 1) fila.unshift(...pags.slice(1).map((t) => ({ ...f, texto: t, cont: true })))
    mostraTexto(f, pags[0])
  }
  function mostraEscolha(ops: [string, string][]) {
    esperaEscolha = true
    $v('.v-seg').hidden = true
    const esc = $v('.v-esc')
    esc.innerHTML = ''
    ops.forEach(([t, id], i) => {
      const b = document.createElement('button')
      b.textContent = `${i + 1} — ${t}`
      b.onclick = (e) => {
        e.stopPropagation()
        vaiPara(id)
      }
      esc.append(b)
    })
    ;(esc.querySelector('button') as HTMLButtonElement | null)?.focus({ preventScroll: true })
  }
  function tecla(e: KeyboardEvent) {
    if ((e.key === 'Enter' || e.key === ' ') && !esperaEscolha) {
      e.preventDefault()
      void passo()
    }
  }
  let fechou = false
  function fecha(fim: 'atendeu' | 'ignorou') {
    if (fechou) return
    fechou = true
    npc.destroi()
    palco?.fim()
    removeEventListener('keydown', tecla)
    el.remove()
    aoFim?.({ fim, ...resultado, escolhas })
  }
  el.addEventListener('click', () => {
    if (!esperaEscolha) void passo()
  })
  addEventListener('keydown', tecla)
  // o primeiro balão é medido com a fonte em pixel já carregada (senão o corte das páginas sai errado)
  const fontes = (document as Document & { fonts?: FontFaceSet }).fonts
  if (fontes) void fontes.ready.then(() => !fechou && vaiPara('inicio'))
  else vaiPara('inicio')
  return {
    /** Sai sem salvar (a Casa fechou no meio da visita). */
    cancela() {
      if (fechou) return
      fechou = true
      npc.destroi()
      palco?.fim()
      removeEventListener('keydown', tecla)
      el.remove()
    },
  }
}
