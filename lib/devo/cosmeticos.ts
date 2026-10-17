/**
 * Cosméticos (texto do dono "Sistema de Cosméticos", §1–§14; DIRECAO-3 §5). Arquivo PURO: o cliente importa
 * para desenhar; quem decide posse, equipamento e catálogo é `lib/devo/cosmeticos-server.ts`.
 *
 * Os itens vivem no inventário genérico da Fundação (`item_defs` kind 'cosmetico', chave `cosmetico:<id>`):
 *   meta.categoria  moldura_avatar | moldura_mini | emblema | balao | efeito
 *   meta.asset      'devo:<arte>' (arte desenhada no código, components/devo/cosmeticos/art) ou URL de imagem
 *                   (upload do Owner: '/api/cosmeticos?view=asset&id=<uuid>', ou https)
 *   meta.animado    true quando a arte tem animação (CSS, desligável)
 *   meta.poco       true = pode sair no Poço (FUNDACAO.md §10)
 *   meta.origem     como se obtém (texto curto mostrado no inventário): ver ORIGEM_LABEL
 *   meta.automatico true = não se equipa; aparece sozinho (Selo do Anfitrião, ligado ao cargo público)
 *   meta.par        chave do mesmo desenho no outro formato (moldura avatar ↔ mini)
 *   meta.ordem      ordem na coleção
 */
import { ITEM_RARITY_LABEL, type ItemRarity } from './progresso'

export const COS_SLOTS = ['moldura_avatar', 'moldura_mini', 'emblema', 'balao', 'efeito'] as const
export type CosSlot = (typeof COS_SLOTS)[number]
export type CosCategoria = CosSlot

export const SLOT_LABEL: Record<CosSlot, string> = {
  moldura_avatar: 'Moldura do avatar',
  moldura_mini: 'Moldura do miniperfil',
  emblema: 'Emblema principal',
  balao: 'Balão de chat',
  efeito: 'Efeito do nome',
}

/** Abas do inventário (§9): Molduras · Emblemas · Balões · Efeitos especiais. */
export const COS_ABAS = [
  { id: 'molduras', label: 'Molduras', slots: ['moldura_avatar', 'moldura_mini'] as CosSlot[] },
  { id: 'emblemas', label: 'Emblemas', slots: ['emblema'] as CosSlot[] },
  { id: 'baloes', label: 'Balões', slots: ['balao'] as CosSlot[] },
  { id: 'efeitos', label: 'Efeitos', slots: ['efeito'] as CosSlot[] },
] as const
export type CosAba = (typeof COS_ABAS)[number]['id']

export const isCosSlot = (v: unknown): v is CosSlot => (COS_SLOTS as readonly unknown[]).includes(v)

export const ORIGEM_LABEL: Record<string, string> = {
  poco: 'Poço dos Milagres',
  semanal: 'Recompensa semanal',
  deadly_vote: 'Deadly Vote',
  evento: 'Evento especial',
  exclusivo: 'Concessão da casa',
  anfitriao: 'Insígnia dos Anfitriões',
}

/** Motivo gravado no inventário (player_items.source) → texto de "como foi obtido". */
export const MOTIVO_LABEL: Record<string, string> = {
  poco: 'Sorteado no Poço dos Milagres',
  recompensa: 'Recompensa aprovada pela equipe',
  deadly_vote: 'Prêmio de Deadly Vote',
  owner: 'Concedido pela casa',
  seed: 'Concedido pela casa',
  semanal: 'Recompensa semanal',
}

/** Raridades na ordem Comum → Arcano. Rótulos e cores são configuráveis em devo_config['cosmeticos.raridades']. */
export const RARIDADES: ItemRarity[] = ['comum', 'incomum', 'raro', 'epico', 'lendario', 'arcano']

export type RaridadeVisual = { label: string; cor: string; brilho: string }

/** Padrão (provisório até o dono definir): metal e luz por raridade, sem neon. */
export const RARIDADE_PADRAO: Record<ItemRarity, RaridadeVisual> = {
  comum: { label: ITEM_RARITY_LABEL.comum, cor: '#8f8e8b', brilho: 'rgba(143,142,139,0.0)' },
  incomum: { label: ITEM_RARITY_LABEL.incomum, cor: '#b7b3a8', brilho: 'rgba(183,179,168,0.25)' },
  raro: { label: ITEM_RARITY_LABEL.raro, cor: '#d9d8d4', brilho: 'rgba(217,216,212,0.35)' },
  epico: { label: ITEM_RARITY_LABEL.epico, cor: '#c98a95', brilho: 'rgba(163,46,64,0.35)' },
  lendario: { label: ITEM_RARITY_LABEL.lendario, cor: '#e3d3ae', brilho: 'rgba(214,190,140,0.4)' },
  arcano: { label: ITEM_RARITY_LABEL.arcano, cor: '#c2b9ec', brilho: 'rgba(138,124,200,0.5)' },
}

/**
 * Arte em imagem (pipeline de arte — infra/arte, docs/redesign/ARTE-PIPELINE.md). Vai em `meta.imagem`:
 *   base      caminho sem sufixo: '/images/cosmeticos/<id>/<peca>' → `${base}-${lado}.webp`
 *   tamanhos  lados disponíveis (px), ex. [48, 96, 256, 512, 1024]
 *   janela    abertura da moldura em fração do lado da imagem (do manifest do pipeline); círculo, oval ou
 *             quadrado (miniperfil: raio = meio lado, raio_canto = arredondamento dos cantos)
 *   camadas   peças separadas animadas por CSS (ponteiro, engrenagem, gema, pena…), em fração da imagem
 *   slice     balão 9-slice: cantos fixos, bordas esticáveis, centro liso
 */
export const CAMADA_ANIMS = ['giro', 'giro-rev', 'ponteiro', 'brilho', 'oscila', 'petalas', 'pulso', 'flutua'] as const
export type CamadaAnim = (typeof CAMADA_ANIMS)[number]
export type Camada = {
  /**
   * arquivo da camada ('/images/cosmeticos/<id>/<peca>.webp'). Em `brilho`, é a máscara (a silhueta da gema):
   * o reflexo só passa onde a camada tem pixel. Sem `src`, o brilho usa a caixa inteira (elipse).
   */
  src?: string
  anim: CamadaAnim
  /** caixa da camada em fração da imagem principal (x, y, largura, altura) */
  caixa: [number, number, number, number]
  /** ponto de giro em fração da camada (padrão: centro) */
  origem?: [number, number]
  /** duração em segundos (padrão por tipo) */
  dur?: number
  atraso?: number
}
export type ArteImagem = {
  base: string
  tamanhos: number[]
  janela?: { forma: 'circulo' | 'oval' | 'quadrado'; centro: [number, number]; raio: [number, number]; raio_canto?: number }
  camadas?: Camada[]
  slice?: {
    /** corte em px da imagem original: topo, direita, baixo, esquerda */
    corte: [number, number, number, number]
    /** largura da borda na tela, em px CSS */
    borda: [number, number, number, number]
    /** espaço do texto dentro do balão (px CSS) */
    folga?: [number, number, number, number]
    /** cor do texto sobre o centro */
    texto?: string
    /** lado da imagem usada no 9-slice (precisa existir em `tamanhos`) */
    lado?: number
  }
}

const NUM = (v: unknown) => typeof v === 'number' && Number.isFinite(v)
const PAR = (v: unknown): v is [number, number] => Array.isArray(v) && v.length === 2 && v.every(NUM)
const QUAD = (v: unknown): v is [number, number, number, number] => Array.isArray(v) && v.length === 4 && v.every(NUM)

/** Lê `meta.imagem` com tolerância (dados do catálogo editáveis pelo Owner). */
export function lerImagem(raw: unknown): ArteImagem | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.base !== 'string' || !/^\/images\/cosmeticos\/[a-z0-9-]+\/[a-z0-9-]+$/.test(r.base)) return null
  const tamanhos = Array.isArray(r.tamanhos) ? (r.tamanhos.filter(NUM) as number[]).sort((a, b) => a - b) : []
  if (!tamanhos.length) return null
  const out: ArteImagem = { base: r.base, tamanhos }
  const j = r.janela as Record<string, unknown> | undefined
  if (j && PAR(j.centro) && PAR(j.raio)) {
    const forma: 'circulo' | 'oval' | 'quadrado' = j.forma === 'oval' || j.forma === 'quadrado' ? (j.forma as 'oval' | 'quadrado') : 'circulo'
    out.janela = { forma, centro: j.centro, raio: j.raio }
    if (forma === 'quadrado') out.janela.raio_canto = NUM(j.raio_canto) ? Math.min(Math.max(j.raio_canto as number, 0), j.raio[0]) : 0.04
  }
  if (Array.isArray(r.camadas)) {
    out.camadas = (r.camadas as Record<string, unknown>[])
      .filter((c) => c && QUAD(c.caixa) && (CAMADA_ANIMS as readonly unknown[]).includes(c.anim))
      .map((c) => ({
        src: typeof c.src === 'string' && /^\/images\/cosmeticos\/[a-z0-9-]+\/[a-z0-9-]+\.(webp|png)$/.test(c.src) ? c.src : undefined,
        anim: c.anim as CamadaAnim,
        caixa: c.caixa as [number, number, number, number],
        origem: PAR(c.origem) ? c.origem : undefined,
        dur: NUM(c.dur) ? (c.dur as number) : undefined,
        atraso: NUM(c.atraso) ? (c.atraso as number) : undefined,
      }))
  }
  const sl = r.slice as Record<string, unknown> | undefined
  if (sl && QUAD(sl.corte) && QUAD(sl.borda))
    out.slice = { corte: sl.corte, borda: sl.borda, folga: QUAD(sl.folga) ? sl.folga : undefined, texto: typeof sl.texto === 'string' ? sl.texto : undefined, lado: NUM(sl.lado) ? (sl.lado as number) : undefined }
  return out
}

/** URL de um tamanho da arte (o mais próximo disponível, para cima). */
export function urlImagem(img: ArteImagem, lado: number) {
  const t = img.tamanhos.find((x) => x >= lado) ?? img.tamanhos[img.tamanhos.length - 1]
  return `${img.base}-${t}.webp`
}

/** srcSet com os tamanhos dentro de [min, max] (ex.: 96+256 no chat, 512 no Record). */
export function srcSetImagem(img: ArteImagem, min = 0, max = Number.POSITIVE_INFINITY) {
  const ts = img.tamanhos.filter((t) => t >= min && t <= max)
  return (ts.length ? ts : img.tamanhos).map((t) => `${img.base}-${t}.webp ${t}w`).join(', ')
}

export type CosmeticoDef = {
  key: string
  name: string
  description: string | null
  rarity: ItemRarity
  categoria: CosSlot
  /** 'devo:<arte>' ou URL de imagem. */
  asset: string
  animado: boolean
  poco: boolean
  origem: string
  automatico: boolean
  par: string | null
  ordem: number
  active: boolean
  /** arte em imagem (pipeline de arte); quando presente, tem prioridade sobre `asset` */
  imagem: ArteImagem | null
}

/** Item possuído (inventário do próprio jogador). */
export type CosmeticoPosse = { key: string; source: string | null; firstAt: number; expiresAt: number | null }

export type Equipados = Record<CosSlot, string | null>
export const EQUIP_VAZIO: Equipados = { moldura_avatar: null, moldura_mini: null, emblema: null, balao: null, efeito: null }

/**
 * Aparência pública de um jogador (vai em qualquer payload público). NUNCA leva cargo de Owner nem
 * "pode tudo": só o que está equipado e a marca pública do Anfitrião (cargo que pode ser público).
 */
export type Visual = {
  id: string
  /** Versão da foto (para /api/arcade?view=avatar&pid=…&v=…) ou null. */
  foto: number | null
  av: string | null
  mini: string | null
  emb: string | null
  bal: string | null
  ef: string | null
  /** Anfitrião (público): selo e brilho próprios. Owner sai sempre como jogador comum. */
  anfitriao: boolean
}

export const VISUAL_VAZIO = (id: string): Visual => ({ id, foto: null, av: null, mini: null, emb: null, bal: null, ef: null, anfitriao: false })

/** Resposta de GET /api/cosmeticos (somente o próprio jogador). */
export type MeusCosmeticos = {
  catalogo: CosmeticoDef[]
  possuidos: CosmeticoPosse[]
  equipados: Equipados
  /** Pode equipar qualquer item do catálogo (decidido no servidor; nunca vai para payload público). */
  livre: boolean
  /** Coleção liberada (tutorial vencido, ou já possui algum cosmético, ou Owner/Anfitrião). */
  liberada: boolean
  raridades: Record<ItemRarity, RaridadeVisual>
}

export const SELO_ANFITRIAO = 'cosmetico:emblema-selo-anfitriao'

/** Itens de teste do seed do Poço (cosmetico:poco_teste_*): fora da coleção do jogador; o painel do Owner ainda os lista. */
export const itemDeTeste = (key: string) => key.startsWith('cosmetico:poco_teste')

/** Entra na coleção do jogador (contagem e grade): nem automático (Selo do Anfitrião) nem item de teste. */
export const naColecao = (c: { key: string; automatico: boolean }) => !c.automatico && !itemDeTeste(c.key)

/** Converte linha de item_defs em definição de cosmético (tolerante a meta incompleta). */
export function toCosmetico(r: { key: string; name: string; description: string | null; rarity: ItemRarity; meta: Record<string, unknown> | null; active: boolean }): CosmeticoDef | null {
  const m = r.meta ?? {}
  const categoria = m.categoria
  if (!isCosSlot(categoria)) return null
  return {
    key: r.key,
    name: r.name,
    description: r.description,
    rarity: r.rarity,
    categoria,
    asset: typeof m.asset === 'string' ? m.asset : '',
    animado: m.animado === true,
    poco: m.poco === true,
    origem: typeof m.origem === 'string' ? m.origem : 'exclusivo',
    automatico: m.automatico === true,
    par: typeof m.par === 'string' ? m.par : null,
    ordem: typeof m.ordem === 'number' ? m.ordem : 999,
    active: r.active,
    imagem: imagemDoAsset(typeof m.asset === 'string' ? m.asset : '', m.imagem),
  }
}

/**
 * Artes em imagem já no repositório (public/images/cosmeticos/<id>/), com o `meta.imagem` que o catálogo usa
 * (o mesmo valor vai na migração). O painel do Owner oferece estes assets; novas artes do pipeline entram aqui.
 */
export const IMAGENS_CATALOGO: Record<string, { slots: CosSlot[]; imagem: ArteImagem }> = {
  // gerado dos <peca>.json do pipeline de arte (infra/arte da41f23: lotes 1–3) + Asas/Coração do lote 1
  'img:/images/cosmeticos/ampulheta-dourada/emblema': { slots: ['emblema'], imagem: {base: '/images/cosmeticos/ampulheta-dourada/emblema', tamanhos: [48, 96, 256, 512, 1024]} },
  'img:/images/cosmeticos/as-espadas/emblema': { slots: ['emblema'], imagem: {base: '/images/cosmeticos/as-espadas/emblema', tamanhos: [48, 96, 256, 512, 1024]} },
  'img:/images/cosmeticos/asas-coruja/mini': { slots: ['moldura_mini'], imagem: {base: '/images/cosmeticos/asas-coruja/mini', tamanhos: [48, 96, 256, 512, 1024], janela: {forma: 'quadrado', centro: [0.5, 0.5], raio: [0.2735, 0.2735], raio_canto: 0.04}} },
  'img:/images/cosmeticos/asas-coruja/moldura': { slots: ['moldura_avatar'], imagem: {base: '/images/cosmeticos/asas-coruja/moldura', tamanhos: [48, 96, 256, 512, 1024], janela: {forma: 'circulo', centro: [0.5, 0.5], raio: [0.25, 0.25]}, camadas: [{src: '/images/cosmeticos/asas-coruja/moldura-lua.webp', anim: 'brilho', caixa: [0.4443, 0.125, 0.5107, 0.2148], dur: 5.5}]} },
  'img:/images/cosmeticos/asas-do-crepusculo/mini': { slots: ['moldura_mini'], imagem: {base: '/images/cosmeticos/asas-do-crepusculo/mini', tamanhos: [48, 96, 256, 512, 1024], janela: {forma: 'quadrado', centro: [0.5, 0.5], raio: [0.2735, 0.2735], raio_canto: 0.04}, camadas: [{src: '/images/cosmeticos/asas-do-crepusculo/mini-gema.webp', anim: 'brilho', caixa: [0.2334, 0.0752, 0.542, 0.7861], dur: 5.5}]} },
  'img:/images/cosmeticos/asas-do-crepusculo/moldura': { slots: ['moldura_avatar'], imagem: {base: '/images/cosmeticos/asas-do-crepusculo/moldura', tamanhos: [48, 96, 256, 512, 1024], janela: {forma: 'circulo', centro: [0.5, 0.5], raio: [0.25, 0.25]}} },
  'img:/images/cosmeticos/banquete-javali/mini': { slots: ['moldura_mini'], imagem: {base: '/images/cosmeticos/banquete-javali/mini', tamanhos: [48, 96, 256, 512, 1024], janela: {forma: 'quadrado', centro: [0.5, 0.5], raio: [0.2735, 0.2735], raio_canto: 0.04}} },
  'img:/images/cosmeticos/banquete-javali/moldura': { slots: ['moldura_avatar'], imagem: {base: '/images/cosmeticos/banquete-javali/moldura', tamanhos: [48, 96, 256, 512, 1024], janela: {forma: 'circulo', centro: [0.5, 0.5], raio: [0.25, 0.25]}} },
  'img:/images/cosmeticos/catedral-esquecida/mini': { slots: ['moldura_mini'], imagem: {base: '/images/cosmeticos/catedral-esquecida/mini', tamanhos: [48, 96, 256, 512, 1024], janela: {forma: 'quadrado', centro: [0.5, 0.5], raio: [0.2735, 0.2735], raio_canto: 0.04}} },
  'img:/images/cosmeticos/catedral-esquecida/moldura': { slots: ['moldura_avatar'], imagem: {base: '/images/cosmeticos/catedral-esquecida/moldura', tamanhos: [48, 96, 256, 512, 1024], janela: {forma: 'circulo', centro: [0.5, 0.5], raio: [0.25, 0.25]}, camadas: [{src: '/images/cosmeticos/catedral-esquecida/moldura-vitral-azul.webp', anim: 'brilho', caixa: [0.2217, 0.1963, 0.3936, 0.6006], dur: 5.5}]} },
  'img:/images/cosmeticos/chave-proibida/emblema': { slots: ['emblema'], imagem: {base: '/images/cosmeticos/chave-proibida/emblema', tamanhos: [48, 96, 256, 512, 1024]} },
  'img:/images/cosmeticos/confissao-carmesim/balao': { slots: ['balao'], imagem: {base: '/images/cosmeticos/confissao-carmesim/balao', tamanhos: [256, 512, 768, 1024], slice: {corte: [36, 76, 23, 72], borda: [20, 42, 13, 40], folga: [6, 10, 4, 10], texto: '#f1e7e9', lado: 512}} },
  'img:/images/cosmeticos/coracao-da-condessa/emblema': { slots: ['emblema'], imagem: {base: '/images/cosmeticos/coracao-da-condessa/emblema', tamanhos: [48, 96, 256, 512, 1024], camadas: [{src: '/images/cosmeticos/coracao-da-condessa/gema-256.webp', anim: 'brilho', caixa: [0.3525, 0.3594, 0.2998, 0.2812], dur: 5.5}]} },
  'img:/images/cosmeticos/coroa-partida/emblema': { slots: ['emblema'], imagem: {base: '/images/cosmeticos/coroa-partida/emblema', tamanhos: [48, 96, 256, 512, 1024]} },
  'img:/images/cosmeticos/correspondencia-real/balao': { slots: ['balao'], imagem: {base: '/images/cosmeticos/correspondencia-real/balao', tamanhos: [256, 512, 768, 1024], slice: {corte: [15, 46, 14, 61], borda: [8, 25, 8, 34], folga: [4, 8, 4, 20], texto: '#2a2320', lado: 512}} },
  'img:/images/cosmeticos/ecos-arcano/balao': { slots: ['balao'], imagem: {base: '/images/cosmeticos/ecos-arcano/balao', tamanhos: [256, 512, 768, 1024], camadas: [{src: '/images/cosmeticos/ecos-arcano/balao-glifos.webp', anim: 'brilho', caixa: [0.0098, 0.1601, 0.9818, 0.6667], dur: 5.5}], slice: {corte: [12, 70, 12, 75], borda: [8, 38, 8, 41], folga: [4, 9, 4, 10], texto: '#f1e7e9', lado: 512}} },
  'img:/images/cosmeticos/engrenagem-herdeiro/emblema': { slots: ['emblema'], imagem: {base: '/images/cosmeticos/engrenagem-herdeiro/emblema', tamanhos: [48, 96, 256, 512, 1024], camadas: [{src: '/images/cosmeticos/engrenagem-herdeiro/emblema-engrenagem-herdeiro.webp', anim: 'giro', caixa: [0.035, 0.09, 0.82, 0.82], dur: 24}]} },
  'img:/images/cosmeticos/ficha-javali/emblema': { slots: ['emblema'], imagem: {base: '/images/cosmeticos/ficha-javali/emblema', tamanhos: [48, 96, 256, 512, 1024]} },
  'img:/images/cosmeticos/fortuna-profana/emblema': { slots: ['emblema'], imagem: {base: '/images/cosmeticos/fortuna-profana/emblema', tamanhos: [48, 96, 256, 512, 1024]} },
  'img:/images/cosmeticos/fortuna-rato/mini': { slots: ['moldura_mini'], imagem: {base: '/images/cosmeticos/fortuna-rato/mini', tamanhos: [48, 96, 256, 512, 1024], janela: {forma: 'quadrado', centro: [0.5, 0.5], raio: [0.2735, 0.2735], raio_canto: 0.04}} },
  'img:/images/cosmeticos/fortuna-rato/moldura': { slots: ['moldura_avatar'], imagem: {base: '/images/cosmeticos/fortuna-rato/moldura', tamanhos: [48, 96, 256, 512, 1024], janela: {forma: 'circulo', centro: [0.5, 0.5], raio: [0.25, 0.25]}} },
  'img:/images/cosmeticos/fragmento-celestial/emblema': { slots: ['emblema'], imagem: {base: '/images/cosmeticos/fragmento-celestial/emblema', tamanhos: [48, 96, 256, 512, 1024], camadas: [{src: '/images/cosmeticos/fragmento-celestial/emblema-luz.webp', anim: 'pulso', caixa: [0.291, 0.0283, 0.416, 0.9453], dur: 3.2}]} },
  'img:/images/cosmeticos/heranca-marfim/mini': { slots: ['moldura_mini'], imagem: {base: '/images/cosmeticos/heranca-marfim/mini', tamanhos: [48, 96, 256, 512, 1024], janela: {forma: 'quadrado', centro: [0.5, 0.5], raio: [0.2735, 0.2735], raio_canto: 0.04}} },
  'img:/images/cosmeticos/heranca-marfim/moldura': { slots: ['moldura_avatar'], imagem: {base: '/images/cosmeticos/heranca-marfim/moldura', tamanhos: [48, 96, 256, 512, 1024], janela: {forma: 'circulo', centro: [0.5, 0.5], raio: [0.25, 0.25]}} },
  'img:/images/cosmeticos/lua-escarlate/emblema': { slots: ['emblema'], imagem: {base: '/images/cosmeticos/lua-escarlate/emblema', tamanhos: [48, 96, 256, 512, 1024], camadas: [{src: '/images/cosmeticos/lua-escarlate/emblema-cristal.webp', anim: 'pulso', caixa: [0.2178, 0.1895, 0.5527, 0.751], dur: 3.2}]} },
  'img:/images/cosmeticos/mesa-destino/balao': { slots: ['balao'], imagem: {base: '/images/cosmeticos/mesa-destino/balao', tamanhos: [256, 512, 768, 1024], slice: {corte: [14, 54, 11, 83], borda: [8, 30, 8, 46], folga: [4, 7, 4, 11], texto: '#f1e7e9', lado: 512}} },
  'img:/images/cosmeticos/olho-arcano/mini': { slots: ['moldura_mini'], imagem: {base: '/images/cosmeticos/olho-arcano/mini', tamanhos: [48, 96, 256, 512, 1024], janela: {forma: 'quadrado', centro: [0.5, 0.5], raio: [0.2735, 0.2735], raio_canto: 0.04}, camadas: [{src: '/images/cosmeticos/olho-arcano/mini-brilho-arcano.webp', anim: 'brilho', caixa: [0.0244, 0.0918, 0.9482, 0.9082], dur: 5.5}]} },
  'img:/images/cosmeticos/olho-arcano/moldura': { slots: ['moldura_avatar'], imagem: {base: '/images/cosmeticos/olho-arcano/moldura', tamanhos: [48, 96, 256, 512, 1024], janela: {forma: 'circulo', centro: [0.5, 0.5], raio: [0.25, 0.25]}, camadas: [{src: '/images/cosmeticos/olho-arcano/moldura-brilho-arcano.webp', anim: 'brilho', caixa: [0.0039, 0.1055, 0.9961, 0.8945], dur: 5.5}]} },
  'img:/images/cosmeticos/olho-destino/emblema': { slots: ['emblema'], imagem: {base: '/images/cosmeticos/olho-destino/emblema', tamanhos: [48, 96, 256, 512, 1024], camadas: [{src: '/images/cosmeticos/olho-destino/emblema-iris.webp', anim: 'brilho', caixa: [0.2539, 0.1045, 0.5, 0.5088], dur: 5.5}]} },
  'img:/images/cosmeticos/pacto-carmesim/mini': { slots: ['moldura_mini'], imagem: {base: '/images/cosmeticos/pacto-carmesim/mini', tamanhos: [48, 96, 256, 512, 1024], janela: {forma: 'quadrado', centro: [0.5, 0.5], raio: [0.2735, 0.2735], raio_canto: 0.04}} },
  'img:/images/cosmeticos/pacto-carmesim/moldura': { slots: ['moldura_avatar'], imagem: {base: '/images/cosmeticos/pacto-carmesim/moldura', tamanhos: [48, 96, 256, 512, 1024], janela: {forma: 'circulo', centro: [0.5, 0.5], raio: [0.25, 0.25]}} },
  'img:/images/cosmeticos/pena-coruja/emblema': { slots: ['emblema'], imagem: {base: '/images/cosmeticos/pena-coruja/emblema', tamanhos: [48, 96, 256, 512, 1024]} },
  'img:/images/cosmeticos/relicario-marfim/mini': { slots: ['moldura_mini'], imagem: {base: '/images/cosmeticos/relicario-marfim/mini', tamanhos: [48, 96, 256, 512, 1024], janela: {forma: 'quadrado', centro: [0.5, 0.5], raio: [0.2735, 0.2735], raio_canto: 0.04}} },
  'img:/images/cosmeticos/relicario-marfim/moldura': { slots: ['moldura_avatar'], imagem: {base: '/images/cosmeticos/relicario-marfim/moldura', tamanhos: [48, 96, 256, 512, 1024], janela: {forma: 'circulo', centro: [0.5, 0.5], raio: [0.25, 0.25]}} },
  'img:/images/cosmeticos/relogio-fim/mini': { slots: ['moldura_mini'], imagem: {base: '/images/cosmeticos/relogio-fim/mini', tamanhos: [48, 96, 256, 512, 1024], janela: {forma: 'quadrado', centro: [0.5, 0.5], raio: [0.2735, 0.2735], raio_canto: 0.04}, camadas: [{src: '/images/cosmeticos/relogio-fim/mini-brilho-arcano.webp', anim: 'pulso', caixa: [0.2832, 0.1191, 0.4375, 0.04], dur: 3.2}]} },
  'img:/images/cosmeticos/relogio-fim/moldura': { slots: ['moldura_avatar'], imagem: {base: '/images/cosmeticos/relogio-fim/moldura', tamanhos: [48, 96, 256, 512, 1024], janela: {forma: 'circulo', centro: [0.5, 0.5], raio: [0.25, 0.25]}, camadas: [{src: '/images/cosmeticos/relogio-fim/moldura-brilho-arcano.webp', anim: 'pulso', caixa: [0.0898, 0.2715, 0.8271, 0.4209], dur: 3.2}, {src: '/images/cosmeticos/relogio-fim/moldura-ponteiros-bronze.webp', anim: 'ponteiro', caixa: [0.468, 0.0837, 0.064, 0.064], dur: 60, origem: [0.5, 0.86]}, {src: '/images/cosmeticos/relogio-fim/moldura-engrenagem-bronze.webp', anim: 'giro', caixa: [0.035, 0.4209, 0.193, 0.193], dur: 24}, {src: '/images/cosmeticos/relogio-fim/moldura-engrenagem-bronze.webp', anim: 'giro-rev', caixa: [0.763, 0.4209, 0.193, 0.193], dur: 30}]} },
  'img:/images/cosmeticos/rosa-do-destino/balao': { slots: ['balao'], imagem: {base: '/images/cosmeticos/rosa-do-destino/balao', tamanhos: [256, 512, 768, 1024], slice: {corte: [58, 98, 55, 88], borda: [22, 38, 21, 34], folga: [6, 9, 6, 8], texto: '#f1e7e9', lado: 512}} },
  'img:/images/cosmeticos/rosa-do-destino/mini': { slots: ['moldura_mini'], imagem: {base: '/images/cosmeticos/rosa-do-destino/mini', tamanhos: [48, 96, 256, 512, 1024], janela: {forma: 'quadrado', centro: [0.5, 0.5], raio: [0.2735, 0.2735], raio_canto: 0.04}} },
  'img:/images/cosmeticos/rosa-do-destino/moldura': { slots: ['moldura_avatar'], imagem: {base: '/images/cosmeticos/rosa-do-destino/moldura', tamanhos: [48, 96, 256, 512, 1024], janela: {forma: 'circulo', centro: [0.5, 0.5], raio: [0.25, 0.25]}} },
  'img:/images/cosmeticos/rosa-sangue/emblema': { slots: ['emblema'], imagem: {base: '/images/cosmeticos/rosa-sangue/emblema', tamanhos: [48, 96, 256, 512, 1024]} },
  'img:/images/cosmeticos/selo-anfitriao/emblema': { slots: ['emblema'], imagem: {base: '/images/cosmeticos/selo-anfitriao/emblema', tamanhos: [48, 96, 256, 512, 1024]} },
  'img:/images/cosmeticos/ultima-badalada/mini': { slots: ['moldura_mini'], imagem: {base: '/images/cosmeticos/ultima-badalada/mini', tamanhos: [48, 96, 256, 512, 1024], janela: {forma: 'quadrado', centro: [0.5, 0.5], raio: [0.2735, 0.2735], raio_canto: 0.04}, camadas: [{src: '/images/cosmeticos/ultima-badalada/mini-brilho-arcano.webp', anim: 'pulso', caixa: [0.125, 0.1816, 0.75, 0.7061], dur: 3.2}]} },
  'img:/images/cosmeticos/ultima-badalada/moldura': { slots: ['moldura_avatar'], imagem: {base: '/images/cosmeticos/ultima-badalada/moldura', tamanhos: [48, 96, 256, 512, 1024], janela: {forma: 'circulo', centro: [0.5, 0.5], raio: [0.25, 0.25]}, camadas: [{src: '/images/cosmeticos/ultima-badalada/moldura-brilho-arcano.webp', anim: 'pulso', caixa: [0.1338, 0.0381, 0.7246, 0.8594], dur: 3.2}, {src: '/images/cosmeticos/ultima-badalada/moldura-sino-prata.webp', anim: 'oscila', caixa: [0.408, 0.0645, 0.184, 0.184], dur: 2.4, origem: [0.5, 0.03]}]} },
  'img:/images/cosmeticos/ultimo-suspiro/balao': { slots: ['balao'], imagem: {base: '/images/cosmeticos/ultimo-suspiro/balao', tamanhos: [256, 512, 768, 1024], slice: {corte: [23, 70, 23, 57], borda: [13, 38, 13, 31], folga: [4, 9, 4, 7], texto: '#2a2320', lado: 512}} },
}

export const ARTE_IMAGEM = {
  moldura: Object.keys(IMAGENS_CATALOGO).filter((k) => IMAGENS_CATALOGO[k].slots.includes('moldura_avatar')),
  emblema: Object.keys(IMAGENS_CATALOGO).filter((k) => IMAGENS_CATALOGO[k].slots.includes('emblema')),
  balao: Object.keys(IMAGENS_CATALOGO).filter((k) => IMAGENS_CATALOGO[k].slots.includes('balao')),
}

/** Tamanhos que o pipeline de arte sempre entrega (final/<id>--vNN--{1024,512,256,96,48}.webp). */
export const TAMANHOS_PADRAO = [48, 96, 256, 512, 1024]

/**
 * `asset = 'img:/images/cosmeticos/<id>/<peca>'` liga a arte em imagem; `meta.imagem` detalha (janela, camadas,
 * 9-slice). Só vale quando a base bate com o asset — trocar o asset no painel desliga a imagem antiga.
 */
export function imagemDoAsset(asset: string, raw: unknown): ArteImagem | null {
  if (!asset.startsWith('img:')) return null
  const base = asset.slice(4)
  const lida = lerImagem(raw)
  if (lida && lida.base === base) return lida
  return lerImagem({ base, tamanhos: TAMANHOS_PADRAO })
}

/** URL de imagem aceita para asset enviado (upload interno ou https). */
export const ASSET_URL_RE = /^(\/api\/cosmeticos\?view=asset&id=[0-9a-f-]{36}|https:\/\/[^\s"'<>]{4,400}|img:\/images\/cosmeticos\/[a-z0-9-]+\/[a-z0-9-]+)$/i

/** Semana (segunda-feira, horário de Brasília) → origem/ref das recompensas semanais: "Semana AAAA-MM-DD". */
export const semanaRef = (semana: string) => `Semana ${semana}`

export const PLANO_CRITERIOS = ['top1', 'top3', 'top10', 'participacao'] as const
export type PlanoCriterio = (typeof PLANO_CRITERIOS)[number]
export const CRITERIO_LABEL: Record<PlanoCriterio, string> = {
  top1: '1º lugar',
  top3: 'Top 3',
  top10: 'Top 10',
  participacao: 'Mínimo de partidas na semana',
}

export type PlanoStatus = 'sugerida' | 'proposta' | 'aprovada' | 'rejeitada' | 'distribuida' | 'cancelada'
export const PLANO_STATUS_LABEL: Record<PlanoStatus, string> = {
  sugerida: 'Sugestão',
  proposta: 'Aguardando aprovação',
  aprovada: 'Aprovada',
  rejeitada: 'Rejeitada',
  distribuida: 'Distribuída',
  cancelada: 'Cancelada',
}

export type PlanoSemanal = {
  id: string
  semana: string
  jogo: string
  criterio: PlanoCriterio
  recurso: 'item' | 'tempo' | 'carta' | 'convite'
  chave: string | null
  quantidade: number
  nota: string | null
  status: PlanoStatus
  propostoPor: string | null
  propostoPorNome: string | null
  aprovadoPorNome: string | null
  distribuidos: number
  revisao: number
  podeAprovar: boolean
  podeEditar: boolean
  criadoEm: number
}
