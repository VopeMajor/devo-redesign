'use client'

import type { PocoPremio } from '@/lib/devo/poco'
import { cn } from '@/lib/utils'
import { DracmaIcon } from './poco-cena'

/**
 * Ícones dos itens do Poço (moedas, prêmios lixo, fragmento, essência, cápsula).
 *
 * Arte nova (pedido ao agente de arte): public/images/poco/itens/<id>-{256,128,64}.webp. Ids:
 *   moedas  dracma_comum, dracma_incomum, dracma_rara
 *   lixo    agua_suja, pedra, tampao, curativo, meia, dente, boleto, chiclete, tampa, chave_torta, nada
 *   outros  fragmento, essencia, capsula
 * Quando um id chegar, acrescente-o em ITENS_PINTADOS: o componente passa a usar a arte nova com srcset.
 * Enquanto não chegar, cai no que existe hoje (lixo-<id>.webp, fragmento.webp…, Dracma vetorial), sem
 * pedir arquivo inexistente ao servidor.
 */
export const ITENS_PINTADOS = new Set<string>([])

const DIR = '/images/poco/itens'
const LADOS = [64, 128, 256] as const

/** Arte nova do item (src + srcset) se já existir; senão null. */
export function arteItem(id: string, tamanho: number) {
  if (!ITENS_PINTADOS.has(id)) return null
  const lado = LADOS.find((l) => l >= tamanho * 2) ?? 256
  return { src: `${DIR}/${id}-${lado}.webp`, srcSet: LADOS.map((l) => `${DIR}/${id}-${l}.webp ${l}w`).join(', '), sizes: `${tamanho}px` }
}

const RARIDADE_DRACMA: Record<string, string> = { dracma_comum: 'comum', dracma_incomum: 'incomum', dracma_rara: 'raro' }

/** Moeda (Dracma) do Poço por chave ou raridade. */
export function MoedaPoco({ chave, raridade, tamanho = 44, className }: { chave?: string; raridade?: string; tamanho?: number; className?: string }) {
  const id = chave ?? Object.keys(RARIDADE_DRACMA).find((k) => RARIDADE_DRACMA[k] === raridade) ?? 'dracma_comum'
  const arte = arteItem(id, tamanho)
  if (arte) return <img {...arte} alt="" draggable={false} className={cn('object-contain', className)} />
  return <DracmaIcon raridade={raridade ?? RARIDADE_DRACMA[id] ?? 'comum'} className={className} />
}

/** Prêmio lixo: imagem enviada pelo Owner, arte nova ou a arte antiga (lixo-<id>.webp). */
export function LixoPoco({ id, imagem, tamanho = 160, className }: { id: string; imagem?: string | null; tamanho?: number; className?: string }) {
  if (imagem) return <img src={imagem} alt="" draggable={false} className={cn('object-contain', className)} />
  const arte = arteItem(id, tamanho)
  if (arte) return <img {...arte} alt="" draggable={false} className={cn('object-contain', className)} />
  const antigo = /^[a-z_]+$/.test(id) ? id : 'nada'
  return <img src={`/images/poco/lixo-${antigo}.webp`} alt="" draggable={false} className={cn('object-contain', className)} />
}

/** Recurso do poço (fragmento, essência, cápsula). */
export function RecursoPoco({ id, tamanho = 160, className }: { id: 'fragmento' | 'essencia' | 'capsula'; tamanho?: number; className?: string }) {
  const arte = arteItem(id, tamanho)
  if (arte) return <img {...arte} alt="" draggable={false} className={cn('object-contain', className)} />
  return <img src={`/images/poco/${id}.webp`} alt="" draggable={false} className={cn('object-contain', className)} />
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
  if (k.startsWith('essencia')) return <RecursoPoco id="essencia" tamanho={tamanho} className={className} />
  if (k.startsWith('capsula')) return <RecursoPoco id="capsula" tamanho={tamanho} className={className} />
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
      <path d="M18 36H30L24 30Z" fill="#d49aa2" />
      <path d="M19 13H29L24 19Z" fill="#d49aa2" opacity="0.7" />
      <path d="M24 21V30" stroke="#d49aa2" strokeWidth="0.8" />
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
      <path d="M24 26L27 32L24 38L21 32Z" fill="#5a1d26" stroke="#d49aa2" strokeWidth="0.6" />
    </svg>
  )
}
