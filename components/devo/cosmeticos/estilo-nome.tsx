'use client'

/**
 * Estilo do nome (categoria `efeito`, à moda dos estilos de nome do Discord) e borda do perfil (categoria `borda`).
 * Tudo sai de chaves de listas fixas (lib/devo/cosmeticos.ts) e cores #rrggbb já validadas: nada de CSS vindo do
 * catálogo. Fontes: Google Fonts servidas pelo próprio app (next/font, sem preload — só baixam quando aparecem).
 */
import { Cinzel_Decorative, Great_Vibes, Pirata_One, Silkscreen } from 'next/font/google'
import type { CSSProperties, ReactNode } from 'react'
import { type BordaPerfil, EFEITOS_NOME_ANIMADOS, type EstiloNome, type FonteNome } from '@/lib/devo/cosmeticos'
import { cn } from '@/lib/utils'

const decorativa = Cinzel_Decorative({ subsets: ['latin'], weight: ['700'], display: 'swap', preload: false })
const pirata = Pirata_One({ subsets: ['latin'], weight: '400', display: 'swap', preload: false })
const caligrafia = Great_Vibes({ subsets: ['latin'], weight: '400', display: 'swap', preload: false })
const pixel = Silkscreen({ subsets: ['latin'], weight: ['400', '700'], display: 'swap', preload: false })

/** Fonte de cada chave: as do app (variáveis do layout) e as quatro extras acima. */
export const FONTE_CSS: Record<FonteNome, string | undefined> = {
  padrao: undefined,
  classica: 'var(--font-cormorant), serif',
  real: 'var(--font-card-title), serif',
  gotica: 'var(--font-unifraktur), serif',
  pergaminho: 'var(--font-card-banner), serif',
  impacto: 'var(--font-oswald), sans-serif',
  decorativa: decorativa.style.fontFamily,
  pirata: pirata.style.fontFamily,
  caligrafia: caligrafia.style.fontFamily,
  pixel: pixel.style.fontFamily,
}

/** Ajuste ótico por fonte (as caligráficas e a pixel parecem menores/maiores no mesmo corpo). */
const ESCALA: Partial<Record<FonteNome, number>> = { caligrafia: 1.22, pixel: 0.82, gotica: 1.06, decorativa: 0.92 }

type Vars = CSSProperties & Record<'--n1' | '--n2' | '--n3', string>

/** Classes e estilo para um nome com estilo do catálogo. `animar` só no Record/miniperfil. */
export function propsEstiloNome(e: EstiloNome, animar: boolean): { className: string; style: Vars } {
  const [a, b = a, c = a] = e.cores
  const escala = ESCALA[e.fonte]
  return {
    className: cn('cos-nome-estilo', `cos-n-${e.efeito}`, animar && EFEITOS_NOME_ANIMADOS.includes(e.efeito) && 'cos-anim'),
    style: { fontFamily: FONTE_CSS[e.fonte], fontSize: escala ? `${escala}em` : undefined, '--n1': a, '--n2': b, '--n3': c },
  }
}

/** Amostra do estilo (coleção, vitrine do miniperfil). */
export function AmostraNome({ estilo, texto, animar = false, className }: { estilo: EstiloNome; texto: string; animar?: boolean; className?: string }) {
  const p = propsEstiloNome(estilo, animar)
  return (
    <span className={cn('cos-nome inline-block max-w-full truncate', p.className, className)} style={p.style}>
      {texto}
    </span>
  )
}

/**
 * Borda do perfil: fundo e acabamento do card (Record e miniperfil). Desenhada em camadas CSS por estilo; com arte
 * pintada (`imagem`), a arte cobre o fundo e as camadas CSS ficam por cima como luz. `animada` só onde faz sentido.
 */
export function BordaPerfilFundo({
  borda,
  imagem,
  animar,
  className,
  children,
}: {
  borda: BordaPerfil | null | undefined
  imagem?: string | null
  animar: boolean
  className?: string
  children?: ReactNode
}) {
  const [a = '#bab09f', b = '#8a7cc8', c = b] = borda?.cores ?? []
  const estilo = borda?.estilo ?? 'aco'
  return (
    <span
      aria-hidden="true"
      className={cn('cos-borda absolute inset-0 overflow-hidden', `cos-b-${estilo}`, animar && borda?.animada && 'cos-anim', className)}
      style={{ '--b1': a, '--b2': b, '--b3': c } as CSSProperties}
    >
      {imagem && (
        // biome-ignore lint/performance/noImgElement: arte pintada da borda (WebP)
        <img src={imagem} alt="" className="absolute inset-0 size-full object-cover" decoding="async" loading="lazy" />
      )}
      <span className="cos-b-camada cos-b-1" />
      <span className="cos-b-camada cos-b-2" />
      <span className="cos-b-camada cos-b-3" />
      <span className="cos-b-aro" />
      {children}
    </span>
  )
}
