'use client'

import './cosmeticos.css'
import { UserRound } from 'lucide-react'
import { type CSSProperties, type ReactNode, useId, useMemo } from 'react'
import { type ArteImagem, type Camada, type CosmeticoDef, SELO_ANFITRIAO, srcSetImagem, urlImagem, type Visual } from '@/lib/devo/cosmeticos'
import { cn } from '@/lib/utils'
import { type Arte, BALOES, EFEITOS, EMBLEMAS, MOLDURAS, parseAsset } from './art'
import { propsEstiloNome } from './estilo-nome'
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

/**
 * Arte em imagem (pipeline de arte): faixa de resolução por contexto — listas e chat leem 96+256,
 * Record/miniperfil/vitrine leem 512+1024. `sizes` usa a largura real desenhada.
 */
function faixa(px: number): [number, number] {
  return px <= 140 ? [96, 256] : [512, 1024]
}

function ImgArte({ img, px, className, style, alt = '' }: { img: ArteImagem; px: number; className?: string; style?: CSSProperties; alt?: string }) {
  const [min, max] = faixa(px)
  return (
    // biome-ignore lint/performance/noImgElement: arte WebP transparente com variantes por tamanho (srcSet)
    <img
      src={urlImagem(img, px <= 140 ? 96 : 512)}
      srcSet={srcSetImagem(img, min, max)}
      sizes={`${Math.max(16, Math.round(px))}px`}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      decoding="async"
      loading="lazy"
      draggable={false}
      className={cn('pointer-events-none select-none', className)}
      style={style}
    />
  )
}

/**
 * Camadas animadas por cima da arte (ponteiro, engrenagem, gema, pena, pétalas). A posição vem em fração da
 * imagem principal; o movimento só roda dentro de `.cos-anim` (Ajustes + movimento reduzido; listas: parado).
 */
export function CamadasArte({ camadas }: { camadas: Camada[] | undefined }) {
  if (!camadas?.length) return null
  return (
    <>
      {camadas.map((c, i) => {
        const style: CSSProperties & Record<'--cos-dur' | '--cos-atraso', string | undefined> = {
          left: `${c.caixa[0] * 100}%`,
          top: `${c.caixa[1] * 100}%`,
          width: `${c.caixa[2] * 100}%`,
          height: `${c.caixa[3] * 100}%`,
          transformOrigin: c.origem ? `${c.origem[0] * 100}% ${c.origem[1] * 100}%` : undefined,
          '--cos-dur': c.dur ? `${c.dur}s` : undefined,
          '--cos-atraso': c.atraso ? `${-c.atraso}s` : undefined,
        }
        const k = `${c.anim}-${i}`
        if (c.anim === 'brilho') {
          const mask = c.src ? `url("${c.src}")` : 'radial-gradient(closest-side, #000 70%, transparent)'
          return <span key={k} aria-hidden="true" className="cos-camada cos-l-brilho" style={{ ...style, WebkitMaskImage: mask, maskImage: mask }} />
        }
        if (!c.src) return null
        // biome-ignore lint/performance/noImgElement: camada recortada da arte (WebP transparente)
        return <img key={k} src={c.src} alt="" aria-hidden="true" decoding="async" draggable={false} className={`cos-camada cos-l-${c.anim}`} style={style} />
      })}
    </>
  )
}

const JANELA = { avatar: { x: 10, y: 10, w: 80, h: 80 }, mini: { x: 100 / 6, y: 100 / 6, w: 200 / 3, h: 200 / 3 } }

/**
 * Molduras em imagem: diâmetro da foto em fração da largura do contêiner. A moldura é desenhada a partir da
 * janela do manifest (foto = 2 × raio × 1,04 do lado da arte) e passa do contêiner — asas e correntes saem.
 */
const FOTO_IMG = { avatar: 0.66, mini: 0.62 }
const SOBRA_FOTO = 1.04

/** Recorte da foto sob a janela: elipse (círculo/oval) ou quadrado com o arredondamento do manifest. */
function cantoFoto(jan: { forma: string; raio: [number, number]; raio_canto?: number }): string {
  if (jan.forma !== 'quadrado') return '50%'
  const r = (jan.raio_canto ?? 0.04) / (2 * jan.raio[0] * SOBRA_FOTO)
  return `${Math.round(r * 1000) / 10}%`
}

function FotoVazia({ vazio }: { vazio?: ReactNode }) {
  return (
    vazio ?? (
      <span className="grid size-full place-items-center bg-[radial-gradient(80%_70%_at_50%_30%,rgba(241,240,238,0.08),transparent_70%)]">
        <UserRound className="size-1/2 text-white/35" strokeWidth={1.25} aria-hidden="true" />
      </span>
    )
  )
}

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
  const img = moldura?.imagem ?? null
  const arte = img ? null : arteMoldura(moldura, formato)
  const url = moldura && !img && !arte && /^(\/|https:)/.test(moldura.asset) ? moldura.asset : null
  const ratio = formato === 'avatar' ? 4 / 3 : 1
  const style: CSSProperties = largura ? { width: largura, height: largura * ratio } : { width: '100%', aspectRatio: formato === 'avatar' ? '3 / 4' : '1 / 1' }
  const foto = src ? (
    // biome-ignore lint/performance/noImgElement: avatar privado servido pela API
    <img src={src} alt={alt} className="size-full object-cover object-[50%_25%]" loading="lazy" decoding="async" />
  ) : (
    <FotoVazia vazio={vazio} />
  )

  if (img) {
    const jan = img.janela ?? { forma: 'circulo' as const, centro: [0.5, 0.5] as [number, number], raio: [0.25, 0.25] as [number, number] }
    const d = FOTO_IMG[formato]
    // lado da arte em múltiplos do diâmetro da foto
    const k = 1 / (2 * jan.raio[0] * SOBRA_FOTO)
    const aspecto = jan.raio[0] / jan.raio[1]
    const px = (largura ?? 300) * d * k
    return (
      <span className={cn('relative inline-block shrink-0 align-middle', className)} style={style}>
        <span className="absolute inset-0 grid place-items-center">
          <span className={cn('relative', anim && 'cos-anim')} style={{ width: `${d * 100}%`, aspectRatio: `${aspecto}` }}>
            <span className="absolute inset-0 overflow-hidden bg-dv-ink-2" style={{ borderRadius: cantoFoto(jan) }}>
              {foto}
            </span>
            <span
              className="pointer-events-none absolute"
              style={{ width: `${k * 100}%`, aspectRatio: '1 / 1', left: `${(0.5 - jan.centro[0] * k) * 100}%`, top: `${(0.5 - jan.centro[1] * k * aspecto) * 100}%` }}
            >
              <ImgArte img={img} px={px} className="absolute inset-0 size-full max-w-none" />
              <CamadasArte camadas={img.camadas} />
            </span>
          </span>
        </span>
      </span>
    )
  }

  const j = semJanela ? { x: 0, y: 0, w: 100, h: 100 } : JANELA[formato]
  return (
    <span className={cn('relative inline-block shrink-0 align-middle', className)} style={style}>
      <span
        className={cn('absolute overflow-hidden bg-dv-ink-2', !arte && !url && !semJanela && 'shadow-[0_0_0_1px_var(--dv-ink),0_0_0_2px_rgba(186,176,159,0.55)]')}
        style={{ left: `${j.x}%`, top: `${j.y}%`, width: `${j.w}%`, height: `${j.h}%` }}
      >
        {foto}
      </span>
      {arte && <ArteSvg arte={arte} animar={anim} className="pointer-events-none absolute inset-0 size-full" />}
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
  if (def.imagem) {
    const lado = tamanho * 1.15
    return (
      <span className={cn('relative inline-block shrink-0 align-[-0.25em]', anim && 'cos-anim', className)} style={{ width: lado, height: lado }}>
        <ImgArte img={def.imagem} px={lado} className="absolute inset-0 size-full object-contain" />
        <CamadasArte camadas={def.imagem.camadas} />
      </span>
    )
  }
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
  parado = false,
}: {
  nome: string
  visual: Visual | null | undefined
  className?: string
  tamanhoEmblema?: number
  semEmblema?: boolean
  cor?: string
  /** listas longas (chat, rankings): sem animação no nome e no emblema */
  parado?: boolean
}) {
  const { mapa } = useCatalogo()
  const animar = useAnimarCosmeticos() && !parado
  const ef = visual?.ef ? mapa.get(visual.ef) : null
  const emb = visual?.emb ? mapa.get(visual.emb) : null
  const selo = visual?.anfitriao ? mapa.get(SELO_ANFITRIAO) : null
  const efClasse = classeEfeito(ef)
  // estilo do nome (fonte + cor/gradiente + efeito); o Anfitrião mantém a tipografia própria do cargo
  const estilo = !visual?.anfitriao && ef?.nome ? propsEstiloNome(ef.nome, animar) : null
  return (
    <span className={cn('inline-flex min-w-0 max-w-full items-center gap-1 align-baseline', className)}>
      {selo && <Emblema def={selo} tamanho={tamanhoEmblema} animar={animar} />}
      {estilo ? (
        <span className={cn('cos-nome truncate', estilo.className)} style={estilo.style}>
          {nome}
        </span>
      ) : (
        <span
          className={cn('cos-nome truncate', visual?.anfitriao && 'cos-anfitriao', !visual?.anfitriao && efClasse, animar && efClasse && 'cos-anim')}
          style={!efClasse && !visual?.anfitriao && cor ? { color: cor } : undefined}
        >
          {nome}
        </span>
      )}
      {!semEmblema && emb && <Emblema def={emb} tamanho={tamanhoEmblema} animar={animar} />}
    </span>
  )
}

/** Balão de mensagem. Sem balão equipado, devolve o conteúdo sem moldura. */
export function BalaoChat({ def, children, className, animar }: { def: CosmeticoDef | null | undefined; children: ReactNode; className?: string; animar?: boolean }) {
  const pref = useAnimarCosmeticos()
  const a = def ? parseAsset(def.asset) : null
  const b = a?.grupo === 'balao' ? BALOES[a.id] : null
  const anim = (animar ?? pref) && !!def?.animado
  const sl = def?.imagem?.slice
  if (def?.imagem && sl) {
    // 9-slice: cantos fixos, bordas esticadas, centro liso (fill) — o texto fica sempre sobre o centro
    const img = def.imagem
    const lado = sl.lado ?? img.tamanhos[img.tamanhos.length - 1]
    const [t, r, bb, l] = sl.corte
    const [bt, br, bbx, bl] = sl.borda
    const folga = sl.folga ?? [2, 4, 2, 4]
    return (
      <div
        className={cn('relative', anim && 'cos-anim', className)}
        style={{
          borderStyle: 'solid',
          borderColor: 'transparent',
          borderWidth: `${bt}px ${br}px ${bbx}px ${bl}px`,
          borderImage: `url("${img.base}-${lado}.webp") ${t} ${r} ${bb} ${l} fill / ${bt}px ${br}px ${bbx}px ${bl}px stretch`,
          padding: `${folga[0]}px ${folga[1]}px ${folga[2]}px ${folga[3]}px`,
          color: sl.texto,
          filter: 'drop-shadow(0 3px 6px rgba(0,0,0,.35))',
        }}
      >
        <div className="relative">{children}</div>
        <CamadasArte camadas={img.camadas} />
      </div>
    )
  }
  const prov = def?.balaoProv
  if (def && prov && !b && !def.imagem) {
    // balão provisório (cores do catálogo) até a arte pintada chegar
    return (
      <div
        className={cn('relative px-4 py-2.5', className)}
        style={{ background: `linear-gradient(180deg, ${prov.fundo}, color-mix(in srgb, ${prov.fundo} 82%, #000))`, color: prov.texto, boxShadow: `inset 0 0 0 1px ${prov.borda}, inset 0 0 0 3px transparent, inset 0 0 0 4px ${prov.filete}, 0 3px 10px rgba(0,0,0,.35)` }}
      >
        <span aria-hidden="true" className="pointer-events-none absolute -left-1 -top-1 size-2.5 rotate-45" style={{ background: prov.filete, boxShadow: `0 0 0 1px ${prov.borda}` }} />
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-1 -right-1 size-2.5 rotate-45" style={{ background: prov.filete, boxShadow: `0 0 0 1px ${prov.borda}` }} />
        <div className="relative">{children}</div>
      </div>
    )
  }
  if (!def || (!b && !/^(\/|https:)/.test(def.asset))) return <div className={className}>{children}</div>
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
  if (def?.imagem?.slice) return def.imagem.slice.texto ?? null
  if (def?.balaoProv) return def.balaoProv.texto
  const a = def ? parseAsset(def.asset) : null
  return a?.grupo === 'balao' ? (BALOES[a.id]?.texto ?? null) : null
}
