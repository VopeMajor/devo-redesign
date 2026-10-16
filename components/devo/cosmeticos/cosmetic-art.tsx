'use client'

import './cosmeticos.css'
import { UserRound } from 'lucide-react'
import { type CSSProperties, type ReactNode, useId, useMemo } from 'react'
import { type CosmeticoDef, SELO_ANFITRIAO, type Visual } from '@/lib/devo/cosmeticos'
import { cn } from '@/lib/utils'
import { type Arte, BALOES, EFEITOS, EMBLEMAS, MOLDURAS, type MolduraRaster, parseAsset, RASTER_EMBLEMAS, RASTER_MOLDURAS } from './art'
import { useAnimarCosmeticos, useCatalogo } from './use-cosmeticos'

/** Injeta uma arte SVG (marcação gerada por nós, nunca do usuário) com ids únicos por instância. */
export function ArteSvg({ arte, className, animar, style }: { arte: Arte; className?: string; animar?: boolean; style?: CSSProperties }) {
  const raw = useId()
  const u = `c${raw.replace(/[^a-zA-Z0-9]/g, '')}`
  const html = useMemo(() => arte.corpo(u), [arte, u])
  return (
    <svg
      viewBox={arte.vb}
      aria-hidden="true"
      focusable="false"
      className={cn('cos-art', animar && 'cos-anim', className)}
      style={style}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: arte do catálogo embutido (kit.ts), sem entrada do usuário
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

/** Arte de moldura de um item do catálogo no formato pedido (ou null se o asset não for desenhado aqui). */
export function arteMoldura(def: CosmeticoDef | null | undefined, formato: 'avatar' | 'mini'): Arte | null {
  if (!def) return null
  const a = parseAsset(def.asset)
  if (!a || a.grupo !== 'moldura') return null
  return MOLDURAS[a.id]?.[formato] ?? null
}

/** Moldura pintada (raster) de um item do catálogo, se houver. */
export function rasterMoldura(def: CosmeticoDef | null | undefined, formato: 'avatar' | 'mini'): MolduraRaster | null {
  if (!def) return null
  const a = parseAsset(def.asset)
  if (!a || a.grupo !== 'moldura') return null
  return RASTER_MOLDURAS[a.id]?.[formato] ?? null
}

const JANELA = { avatar: { x: 10, y: 10, w: 80, h: 80 }, mini: { x: 100 / 6, y: 100 / 6, w: 200 / 3, h: 200 / 3 } }

/**
 * Foto com moldura como camada independente (a imagem nunca é alterada). O tamanho total é sempre o mesmo,
 * com ou sem moldura: sem moldura, a foto ocupa a mesma janela com um filete de aço — listas não "pulam".
 *   formato 'avatar' = retrato 3:4 do Record; 'mini' = quadrado (chat, ranking, listas, miniperfil)
 */
export function FotoMoldurada({
  formato,
  src,
  moldura,
  largura,
  className,
  animar,
  alt = '',
  vazio,
  semJanela = false,
}: {
  formato: 'avatar' | 'mini'
  src: string | null
  moldura?: CosmeticoDef | null
  /** largura total em px (a altura segue o formato). Sem ela, ocupa a largura do pai. */
  largura?: number
  className?: string
  /** força ligar/desligar animação; padrão: preferência do jogador (Ajustes + movimento reduzido) */
  animar?: boolean
  alt?: string
  vazio?: ReactNode
  /** sem moldura e sem o filete padrão (a foto ocupa a caixa toda) */
  semJanela?: boolean
}) {
  const pref = useAnimarCosmeticos()
  const anim = (animar ?? pref) && !!moldura?.animado
  const arte = arteMoldura(moldura, formato)
  const raster = arte ? null : rasterMoldura(moldura, formato)
  const url = moldura && !arte && !raster && /^(\/|https:)/.test(moldura.asset) ? moldura.asset : null
  const j = semJanela ? { x: 0, y: 0, w: 100, h: 100 } : JANELA[formato]
  const ratio = formato === 'avatar' ? 4 / 3 : 1
  const style: CSSProperties = largura ? { width: largura, height: largura * ratio } : { width: '100%', aspectRatio: formato === 'avatar' ? '3 / 4' : '1 / 1' }
  return (
    <span className={cn('relative inline-block shrink-0 align-middle', className)} style={style}>
      <span
        className={cn('absolute overflow-hidden bg-dv-ink-2', !arte && !url && !raster && !semJanela && 'shadow-[0_0_0_1px_#0c0c0e,0_0_0_2px_rgba(186,176,159,0.55)]')}
        style={{ left: `${j.x}%`, top: `${j.y}%`, width: `${j.w}%`, height: `${j.h}%`, clipPath: raster && raster.janela !== 'retangulo' ? 'ellipse(50% 50% at 50% 50%)' : undefined }}
      >
        {src ? (
          // biome-ignore lint/performance/noImgElement: avatar privado servido pela API
          <img src={src} alt={alt} className="size-full object-cover object-[50%_25%]" loading="lazy" decoding="async" />
        ) : (
          (vazio ?? (
            <span className="grid size-full place-items-center bg-[radial-gradient(80%_70%_at_50%_30%,rgba(241,240,238,0.08),transparent_70%)]">
              <UserRound className="size-1/2 text-white/35" strokeWidth={1.25} aria-hidden="true" />
            </span>
          ))
        )}
      </span>
      {arte && <ArteSvg arte={arte} animar={anim} className="pointer-events-none absolute inset-0 size-full" />}
      {raster && (
        // biome-ignore lint/performance/noImgElement: arte pintada (WebP transparente) por cima da foto
        <img
          src={raster.src}
          alt=""
          aria-hidden="true"
          decoding="async"
          className="pointer-events-none absolute max-w-none select-none"
          style={{ left: `${-raster.sangria * 100}%`, top: `${-raster.sangria * 100}%`, width: `${100 + 2 * raster.sangria * 100}%`, height: `${100 + 2 * raster.sangria * 100}%` }}
        />
      )}
      {url && (
        // biome-ignore lint/performance/noImgElement: asset enviado pelo Owner (SVG/PNG/WebP com transparência)
        <img src={url} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 size-full object-contain" loading="lazy" />
      )}
    </span>
  )
}

/** Emblema de um item do catálogo. */
export function Emblema({ def, tamanho = 18, className, animar }: { def: CosmeticoDef | null | undefined; tamanho?: number; className?: string; animar?: boolean }) {
  const pref = useAnimarCosmeticos()
  if (!def) return null
  const a = parseAsset(def.asset)
  const arte = a?.grupo === 'emblema' ? EMBLEMAS[a.id] : null
  const anim = (animar ?? pref) && def.animado
  const pintado = a?.grupo === 'emblema' ? RASTER_EMBLEMAS[a.id] : null
  if (pintado)
    // biome-ignore lint/performance/noImgElement: emblema pintado; versão própria abaixo de 28 px
    return <img src={tamanho <= 28 ? pintado.mini : pintado.src} alt="" aria-hidden="true" decoding="async" className={cn('inline-block shrink-0 align-[-0.25em] object-contain', className)} style={{ width: tamanho * 1.15, height: tamanho * 1.15 }} />
  if (arte) return <ArteSvg arte={arte} animar={anim} className={cn('inline-block shrink-0 align-[-0.2em]', className)} style={{ width: tamanho, height: tamanho }} />
  if (/^(\/|https:)/.test(def.asset))
    // biome-ignore lint/performance/noImgElement: asset enviado pelo Owner
    return <img src={def.asset} alt="" aria-hidden="true" className={cn('inline-block shrink-0 align-[-0.2em] object-contain', className)} style={{ width: tamanho, height: tamanho }} />
  return null
}

export function classeEfeito(def: CosmeticoDef | null | undefined): string | null {
  const a = def ? parseAsset(def.asset) : null
  return a?.grupo === 'efeito' ? (EFEITOS[a.id]?.classe ?? null) : null
}

/**
 * Nome com a aparência pública: selo e tipografia do Anfitrião (cargo público), efeito equipado e emblema
 * principal. Não há marca de Owner: o Owner aparece só com o que ele equipou, como qualquer jogador.
 */
export function NomeVisual({
  nome,
  visual,
  className,
  tamanhoEmblema = 16,
  semEmblema = false,
  cor,
}: {
  nome: string
  visual: Visual | null | undefined
  className?: string
  tamanhoEmblema?: number
  semEmblema?: boolean
  cor?: string
}) {
  const { mapa } = useCatalogo()
  const animar = useAnimarCosmeticos()
  const ef = visual?.ef ? mapa.get(visual.ef) : null
  const emb = visual?.emb ? mapa.get(visual.emb) : null
  const selo = visual?.anfitriao ? mapa.get(SELO_ANFITRIAO) : null
  const efClasse = classeEfeito(ef)
  return (
    <span className={cn('inline-flex min-w-0 max-w-full items-center gap-1 align-baseline', className)}>
      {selo && <Emblema def={selo} tamanho={tamanhoEmblema} />}
      <span
        className={cn('cos-nome truncate', visual?.anfitriao && 'cos-anfitriao', !visual?.anfitriao && efClasse, animar && efClasse && 'cos-anim')}
        style={!efClasse && !visual?.anfitriao && cor ? { color: cor } : undefined}
      >
        {nome}
      </span>
      {!semEmblema && emb && <Emblema def={emb} tamanho={tamanhoEmblema} />}
    </span>
  )
}

/** Balão de mensagem. Sem balão equipado, devolve o conteúdo sem moldura. */
export function BalaoChat({ def, children, className, animar }: { def: CosmeticoDef | null | undefined; children: ReactNode; className?: string; animar?: boolean }) {
  const pref = useAnimarCosmeticos()
  const a = def ? parseAsset(def.asset) : null
  const b = a?.grupo === 'balao' ? BALOES[a.id] : null
  if (!def || (!b && !/^(\/|https:)/.test(def.asset))) return <div className={className}>{children}</div>
  const anim = (animar ?? pref) && def.animado
  if (!b) {
    return (
      <div className={cn('relative border border-dv-line-strong px-3.5 py-2', className)} style={{ backgroundImage: `url(${def.asset})`, backgroundSize: 'cover' }}>
        {children}
      </div>
    )
  }
  return (
    <div
      className={cn('relative px-5 py-3', anim && 'cos-anim', className)}
      style={{ background: b.textura ? `${b.textura},${b.fundo}` : b.fundo, color: b.texto, boxShadow: `inset 0 0 0 1px ${b.borda}, inset 0 0 0 3px transparent, inset 0 0 0 4px ${b.filete}, 0 3px 10px rgba(0,0,0,.35)` }}
    >
      <ArteSvg arte={b.canto} animar={anim} className="pointer-events-none absolute -left-1.5 -top-1.5 size-[26px]" />
      <ArteSvg arte={b.canto} animar={anim} className="pointer-events-none absolute -bottom-1.5 -right-1.5 size-[26px] rotate-180" />
      <div className="relative">{children}</div>
      {b.selo && <ArteSvg arte={b.selo} className="pointer-events-none absolute -bottom-2.5 right-6 size-[24px]" />}
    </div>
  )
}

/** Cor do texto do balão (para o nome/horário dentro dele). */
export function corDoBalao(def: CosmeticoDef | null | undefined): string | null {
  const a = def ? parseAsset(def.asset) : null
  return a?.grupo === 'balao' ? (BALOES[a.id]?.texto ?? null) : null
}
