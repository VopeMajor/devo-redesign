'use client'

import { arteEssencia } from '@/lib/devo/essencias-arte'
import type { PocoPremio } from '@/lib/devo/poco'
import { cn } from '@/lib/utils'
import { PacoteVisual } from '../casa/pacote-visual'
import { BaldeIcon, DracmaIcon } from './poco-cena'

/**
 * Registro ÚNICO da arte dos itens do Poço (infra/arte 8f72fb2 → public/images/poco/itens/<arquivo>-{64,128,256}.webp).
 * Chave = id do sistema (item_defs.key, id do lixo, id do balde); valor = nome do arquivo (o _ virou -).
 * Quem mostra um item do Poço (revelação, faixa de prêmios, moedas, baldes, Mesa do Owner, Diário) passa por
 * aqui; id sem arte cai no desenho antigo (lixo-<id>.webp, fragmento.webp…, Dracma vetorial).
 */
const ITENS_ARTE: Record<string, string> = {
  dracma_comum: 'dracma-comum',
  dracma_incomum: 'dracma-incomum',
  dracma_rara: 'dracma-rara',
  fragmento: 'fragmento',
  fragmento_arcano: 'fragmento',
  essencia: 'essencia',
  capsula: 'capsula',
  'balde:madeira': 'balde-madeira',
  'balde:ferro': 'balde-ferro',
  'balde:cobre': 'balde-cobre',
  'balde:prata': 'balde-prata',
  agua_suja: 'lixo-agua-suja',
  pedra: 'lixo-pedra',
  tampao: 'lixo-tampao',
  curativo: 'lixo-curativo',
  meia: 'lixo-meia',
  dente: 'lixo-dente',
  boleto: 'lixo-boleto',
  chiclete: 'lixo-chiclete',
  tampa: 'lixo-tampa',
  chave_torta: 'lixo-chave-torta',
  nada: 'lixo-nada',
}
/** Camadas animadas da arte (itens/<arquivo>.json → camadas): caixa [x, y, w, h] em fração da imagem. */
const CAMADAS: Record<string, { src: string; caixa: [number, number, number, number]; dur: number }> = {
  'dracma-rara': { src: '/images/poco/itens/dracma-rara-gema.webp', caixa: [0.4199, 0.4414, 0.1494, 0.124], dur: 5.5 },
}

const DIR = '/images/poco/itens'
const LADOS = [64, 128, 256] as const

/** Id do sistema → arquivo de arte (essencia:galo → essencia, capsula:003 → capsula). */
export function arquivoItem(id: string): string | null {
  if (ITENS_ARTE[id]) return ITENS_ARTE[id]
  const base = id.split(':')[0]
  return base !== 'balde' && ITENS_ARTE[base] ? ITENS_ARTE[base] : null
}

/** Arte do item (src + srcset) se existir no registro; senão null. */
export function arteItem(id: string, tamanho: number) {
  const arq = arquivoItem(id)
  if (!arq) return null
  const lado = LADOS.find((l) => l >= tamanho * 2) ?? 256
  return { src: `${DIR}/${arq}-${lado}.webp`, srcSet: LADOS.map((l) => `${DIR}/${arq}-${l}.webp ${l}w`).join(', '), sizes: `${tamanho}px` }
}

/** Imagem do item com as camadas animadas da arte (gema da Dracma Rara). */
function ImgItem({ id, tamanho, className }: { id: string; tamanho: number; className?: string }) {
  const arte = arteItem(id, tamanho)!
  const camada = CAMADAS[arquivoItem(id) ?? '']
  if (!camada) return <img {...arte} alt="" draggable={false} className={cn('object-contain', className)} />
  const [x, y, w, h] = camada.caixa
  return (
    <span className={cn('relative inline-block', className)}>
      <img {...arte} alt="" draggable={false} className="size-full object-contain" />
      <img
        src={camada.src}
        alt=""
        draggable={false}
        className="poco-item-brilho pointer-events-none absolute mix-blend-screen"
        style={{ left: `${x * 100}%`, top: `${y * 100}%`, width: `${w * 100}%`, height: `${h * 100}%`, animationDuration: `${camada.dur}s` }}
      />
    </span>
  )
}

const RARIDADE_DRACMA: Record<string, string> = { dracma_comum: 'comum', dracma_incomum: 'incomum', dracma_rara: 'raro' }

/** Moeda (Dracma) do Poço por chave ou raridade. */
export function MoedaPoco({ chave, raridade, tamanho = 44, className }: { chave?: string; raridade?: string; tamanho?: number; className?: string }) {
  const id = chave ?? Object.keys(RARIDADE_DRACMA).find((k) => RARIDADE_DRACMA[k] === raridade) ?? 'dracma_comum'
  if (arteItem(id, tamanho)) return <ImgItem id={id} tamanho={tamanho} className={className} />
  return <DracmaIcon raridade={raridade ?? RARIDADE_DRACMA[id] ?? 'comum'} className={className} />
}

/** Prêmio lixo: imagem enviada pelo Owner, arte nova ou a arte antiga (lixo-<id>.webp). */
export function LixoPoco({ id, imagem, tamanho = 160, className }: { id: string; imagem?: string | null; tamanho?: number; className?: string }) {
  if (imagem) return <img src={imagem} alt="" draggable={false} className={cn('object-contain', className)} />
  // lixo do pool do Owner sem imagem própria (premio:<id>) usa a arte do "Nada"
  const alvo = arteItem(id, tamanho) || !/^[a-z_]+$/.test(id) ? (arteItem(id, tamanho) ? id : 'nada') : id
  if (arteItem(alvo, tamanho)) return <ImgItem id={alvo} tamanho={tamanho} className={className} />
  const antigo = /^[a-z_]+$/.test(id) ? id : 'nada'
  return <img src={`/images/poco/lixo-${antigo}.webp`} alt="" draggable={false} className={cn('object-contain', className)} />
}

/** Recurso do poço (fragmento, essência, cápsula). */
export function RecursoPoco({ id, chave, tamanho = 160, className }: { id: 'fragmento' | 'essencia' | 'capsula'; chave?: string; tamanho?: number; className?: string }) {
  const ess = id === 'essencia' ? arteEssencia(chave, tamanho) : null
  if (ess) return <img {...ess} alt="" draggable={false} className={cn('object-contain', className)} />
  if (arteItem(id, tamanho)) return <ImgItem id={id} tamanho={tamanho} className={className} />
  return <img src={`/images/poco/${id}.webp`} alt="" draggable={false} className={cn('object-contain', className)} />
}

/** Balde do Poço (madeira, ferro, cobre, prata): arte pintada, ou o ícone vetorial antigo. */
export function BaldePoco({ tipo = 'madeira', tamanho = 44, className }: { tipo?: string; tamanho?: number; className?: string }) {
  const id = `balde:${tipo}`
  if (arteItem(id, tamanho)) return <ImgItem id={id} tamanho={tamanho} className={className} />
  return <BaldeIcon tipo={tipo} className={className} />
}

/** Ícone de qualquer item do Poço pelo id do sistema (faixa de prêmios, Diário, listas). */
export function IconeItemPoco({ id, tamanho = 32, className }: { id: string; tamanho?: number; className?: string }) {
  if (id.startsWith('dracma_')) return <MoedaPoco chave={id} tamanho={tamanho} className={className} />
  if (id.startsWith('balde:')) return <BaldePoco tipo={id.slice(6)} tamanho={tamanho} className={className} />
  if (id.startsWith('essencia:') && arteEssencia(id, tamanho)) return <RecursoPoco id="essencia" chave={id} tamanho={tamanho} className={className} />
  if (arteItem(id, tamanho)) return <ImgItem id={id} tamanho={tamanho} className={className} />
  return null
}

/** Miniatura de um prêmio do pool do Owner (lista da Mesa). */
export function ItemPoco({ premio, tamanho = 64, className }: { premio: PocoPremio; tamanho?: number; className?: string }) {
  if (premio.imagem) return <img src={premio.imagem} alt="" draggable={false} className={cn('object-contain', className)} />
  if (premio.tipo === 'lixo') return <LixoPoco id="nada" tamanho={tamanho} className={className} />
  if (premio.tipo === 'tempo') return <Ampulheta className={className} />
  if (premio.tipo === 'carta') return <CartaMini className={className} />
  const k = premio.itemKey ?? ''
  if (k.startsWith('dracma_')) return <MoedaPoco chave={k} tamanho={tamanho} className={className} />
  if (k === 'fragmento_arcano') return <RecursoPoco id="fragmento" tamanho={tamanho} className={className} />
  if (k.startsWith('essencia')) return <RecursoPoco id="essencia" chave={k} tamanho={tamanho} className={className} />
  if (k.startsWith('capsula')) return <RecursoPoco id="capsula" tamanho={tamanho} className={className} />
  if (k.startsWith('pacote:')) return (
      <span className={cn('grid place-items-center', className)}>
        <PacoteVisual id={k.slice(7)} className="h-full w-auto" />
      </span>
    )
  return <span className={cn('grid place-items-center font-display text-[18px] text-dv-gold', className)}>✦</span>
}

/** Ampulheta de aço (prêmio de Tempo). */
export function Ampulheta({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="poco-amp" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4efe6" />
          <stop offset="0.5" stopColor="#bab09f" />
          <stop offset="1" stopColor="#5f584d" />
        </linearGradient>
      </defs>
      <path d="M12 5H36V9H12ZM12 39H36V43H12Z" fill="url(#poco-amp)" />
      <path d="M15 9H33C33 17 26 20 26 24C26 28 33 31 33 39H15C15 31 22 28 22 24C22 20 15 17 15 9Z" fill="#161515" stroke="url(#poco-amp)" strokeWidth="1.6" />
      <path d="M18 36H30L24 30Z" fill="#c2b9ec" />
      <path d="M19 13H29L24 19Z" fill="#c2b9ec" opacity="0.7" />
      <path d="M24 21V30" stroke="#c2b9ec" strokeWidth="0.8" />
    </svg>
  )
}

/** Verso de carta do DEVO (prêmio de carta). */
export function CartaMini({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 64" className={className} aria-hidden="true">
      <rect x="3" y="3" width="42" height="58" rx="3" fill="#e9e8e5" stroke="#bab09f" strokeWidth="1.5" />
      <rect x="7" y="7" width="34" height="50" rx="1.5" fill="#161515" />
      <path d="M24 16L31 32L24 48L17 32Z" fill="none" stroke="#bab09f" strokeWidth="1.2" />
      <path d="M24 26L27 32L24 38L21 32Z" fill="#5a4f8f" stroke="#c2b9ec" strokeWidth="0.6" />
    </svg>
  )
}
