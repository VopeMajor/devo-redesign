'use client'

import { Camera, RotateCcw, Trash2, ZoomIn, ZoomOut } from 'lucide-react'
import { type CSSProperties, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { BrassCorners, GlyphCheck, GlyphClip, GlyphClose, IconButton, Spinner } from '@/components/devo/kit'
import { playSfx } from '@/lib/devo/audio'
import { RecButton } from './record-ui'
import { recordAction } from './use-deadly-votes'

/**
 * Foto do perfil (REFINAMENTO-4 §2.4): recorte QUADRADO — as molduras mostram a foto num círculo (avatar) ou num
 * quadrado (miniperfil), e o guia redondo do recorte é exatamente essa janela. Saída JPEG comprimida no aparelho
 * até caber no limite do servidor (180 KB), antes de enviar.
 */
const OUT = 640
const FRAME_W = 280
const FRAME_H = 280
const MAX_ZOOM = 4
/** Limite do servidor (lib/devo/record-server.ts MAX_AVATAR_BYTES) com folga. */
const ALVO_BYTES = 170_000
/** Arquivo original aceito (antes de comprimir). */
const MAX_ORIGINAL = 25 * 1024 * 1024
/** Lado máximo da cópia de trabalho (iOS limita o tamanho de canvas; fotos de 48 MP travam o recorte). */
const MAX_LADO = 2048

type Crop = { zoom: number; x: number; y: number }

/** Régua de zoom: trilho de aço fino, cabeça em losango ametista pequena. */
const RANGE =
  'dv-focus h-11 flex-1 cursor-pointer appearance-none bg-transparent ' +
  '[&::-webkit-slider-runnable-track]:h-[2px] [&::-webkit-slider-runnable-track]:bg-[linear-gradient(90deg,#6b6357,#ece5d8_50%,#6b6357)] ' +
  '[&::-webkit-slider-thumb]:-mt-[6px] [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:rotate-45 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[#ece5d8] [&::-webkit-slider-thumb]:bg-[#8a7cc8] [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(138,124,200,0.7)] ' +
  '[&::-moz-range-track]:h-[2px] [&::-moz-range-track]:bg-[#bab09f] [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rotate-45 [&::-moz-range-thumb]:rounded-none [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-[#ece5d8] [&::-moz-range-thumb]:bg-[#8a7cc8]'

/** Escala mínima para a imagem cobrir todo o quadro 3:4. */
function coverScale(img: { width: number; height: number }) {
  return Math.max(FRAME_W / img.width, FRAME_H / img.height)
}

function clampCrop(c: Crop, img: { width: number; height: number }): Crop {
  const s = coverScale(img) * c.zoom
  const maxX = Math.max(0, (img.width * s - FRAME_W) / 2)
  const maxY = Math.max(0, (img.height * s - FRAME_H) / 2)
  return { zoom: c.zoom, x: Math.min(maxX, Math.max(-maxX, c.x)), y: Math.min(maxY, Math.max(-maxY, c.y)) }
}

type Fonte = { el: HTMLCanvasElement; width: number; height: number }

const bytesDe = (dataUrl: string) => Math.floor(((dataUrl.length - dataUrl.indexOf(',') - 1) * 3) / 4)

/** Recorta e comprime: baixa a qualidade (e, se precisar, o tamanho) até caber no limite do servidor. */
export function renderCrop(src: Fonte, c: Crop) {
  const s = coverScale(src) * c.zoom
  const sw = FRAME_W / s
  const sh = FRAME_H / s
  const sx = src.width / 2 - c.x / s - sw / 2
  const sy = src.height / 2 - c.y / s - sh / 2
  for (const lado of [OUT, 512, 384]) {
    const canvas = document.createElement('canvas')
    canvas.width = lado
    canvas.height = lado
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Seu navegador não conseguiu preparar a foto.')
    ctx.fillStyle = '#0c0c0e'
    ctx.fillRect(0, 0, lado, lado)
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(src.el, sx, sy, sw, sh, 0, 0, lado, lado)
    for (const q of [0.86, 0.78, 0.7, 0.6, 0.5]) {
      const url = canvas.toDataURL('image/jpeg', q)
      if (bytesDe(url) <= ALVO_BYTES) return url
    }
  }
  throw new Error('Não deu para comprimir essa foto o bastante. Tente outra imagem.')
}

const EXT_HEIC = /\.(heic|heif)$/i

/** Mensagem clara para o que não dá para abrir (HEIC do iPhone, PDF, vídeo…). */
export function motivoRecusa(file: { type: string; name: string; size: number }) {
  if (file.type === 'image/heic' || file.type === 'image/heif' || EXT_HEIC.test(file.name))
    return 'Foto em HEIC (formato do iPhone) não abre aqui. No iPhone, use Ajustes › Câmera › Formatos › "Mais compatível", ou compartilhe a foto como JPEG e tente de novo.'
  if (file.type && !file.type.startsWith('image/')) return 'Esse arquivo não é uma imagem. Escolha uma foto (JPEG, PNG ou WebP).'
  if (file.size > MAX_ORIGINAL) return 'Essa foto passa de 25 MB. Escolha uma menor.'
  return null
}

/**
 * Abre o arquivo como <img> (respeita a orientação EXIF em todos os navegadores atuais) e faz uma cópia de trabalho
 * de no máximo 2048 px — o recorte e a compressão partem dela.
 */
async function abrirImagem(file: File): Promise<{ fonte: Fonte; url: string }> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    if (!img.naturalWidth || !img.naturalHeight) throw new Error('vazia')
    const k = Math.min(1, MAX_LADO / Math.max(img.naturalWidth, img.naturalHeight))
    const el = document.createElement('canvas')
    el.width = Math.round(img.naturalWidth * k)
    el.height = Math.round(img.naturalHeight * k)
    const ctx = el.getContext('2d')
    if (!ctx) throw new Error('canvas')
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, el.width, el.height)
    URL.revokeObjectURL(url)
    return { fonte: { el, width: el.width, height: el.height }, url: el.toDataURL('image/jpeg', 0.9) }
  } catch {
    URL.revokeObjectURL(url)
    throw new Error(
      EXT_HEIC.test(file.name) ? (motivoRecusa({ type: 'image/heic', name: file.name, size: 0 }) ?? '') : 'Não foi possível abrir essa imagem. Tente outra foto (JPEG, PNG ou WebP).',
    )
  }
}

function PhotoCropper({ fonte: bitmap, url, onCancel, onConfirm }: { fonte: Fonte; url: string; onCancel: () => void; onConfirm: (dataUrl: string) => void }) {
  const [crop, setCrop] = useState<Crop>({ zoom: 1, x: 0, y: 0 })
  const drag = useRef<{ id: number; sx: number; sy: number; ox: number; oy: number } | null>(null)
  const dedos = useRef(new Map<number, { x: number; y: number }>())
  const pinca = useRef<{ d: number; z: number } | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const setClamped = (c: Crop) => setCrop(clampCrop(c, bitmap))
  const s = coverScale(bitmap) * crop.zoom

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const distancia = () => {
    const [a, b] = [...dedos.current.values()]
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0
  }
  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dedos.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (dedos.current.size === 2) {
      // dois dedos: pinça para zoom (o arrasto para até soltar)
      pinca.current = { d: distancia(), z: crop.zoom }
      drag.current = null
    } else drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: crop.x, oy: crop.y }
  }
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dedos.current.has(e.pointerId)) dedos.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const p = pinca.current
    if (p && dedos.current.size === 2) {
      const d = distancia()
      if (p.d > 0 && d > 0) setClamped({ ...crop, zoom: Math.min(MAX_ZOOM, Math.max(1, (p.z * d) / p.d)) })
      return
    }
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    setClamped({ zoom: crop.zoom, x: d.ox + e.clientX - d.sx, y: d.oy + e.clientY - d.sy })
  }
  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    dedos.current.delete(e.pointerId)
    if (dedos.current.size < 2) pinca.current = null
    drag.current = null
  }
  const confirmar = () => {
    try {
      onConfirm(renderCrop(bitmap, crop))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível preparar a foto.')
    }
  }
  const zoomTo = (z: number) => setClamped({ ...crop, zoom: Math.min(MAX_ZOOM, Math.max(1, z)) })

  return createPortal(
    <div className="fixed inset-0 z-[130] grid animate-dv-fade place-items-center bg-[rgba(10,10,12,0.84)] p-4 backdrop-blur-sm" onClick={onCancel}>
      <div role="dialog" aria-modal="true" aria-label="Ajustar foto do perfil" onClick={(e) => e.stopPropagation()} className="w-full max-w-sm animate-dv-pop">
        <div className="dv-interior-dark dv-record-panel dv-cut relative text-dv-text shadow-[0_24px_60px_-10px_rgba(0,0,0,0.9)]" style={{ '--dv-cut': '14px' } as CSSProperties}>
          <BrassCorners size={24} inset={3} tone="silver" />
          <header className="relative flex items-center justify-between gap-3 px-4 pb-2.5 pt-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-dv-gold">Record File · Foto</p>
              <p className="mt-0.5 flex items-baseline gap-2.5 font-serif text-[22px] font-light uppercase leading-none tracking-[0.04em] text-dv-text">
                Ajustar foto
                <span lang="ja" className="font-sans text-[10px] font-normal tracking-[0.16em] text-dv-text-3">
                  トリミング
                </span>
              </p>
            </div>
            <IconButton label="Cancelar" variant="ghost" onClick={onCancel} sfx="close">
              <GlyphClose />
            </IconButton>
            <span aria-hidden="true" className="absolute inset-x-4 bottom-0 h-px bg-[linear-gradient(90deg,#bab09f_0%,rgba(186,176,159,0.35)_45%,transparent_100%)]" />
          </header>

          <div className="flex flex-col items-center gap-3 p-5">
            <div className="relative bg-[#fbfaf7] p-1.5 pb-5 shadow-[0_10px_24px_rgba(0,0,0,0.5)]">
              <div
                className="relative cursor-grab touch-none select-none overflow-hidden bg-black active:cursor-grabbing"
                style={{ width: FRAME_W, height: FRAME_H }}
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                data-testid="recorte-foto"
                onWheel={(e) => zoomTo(crop.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08))}
              >
                {/* biome-ignore lint/performance/noImgElement: prévia local via object URL */}
                <img
                  src={url}
                  alt="Prévia da foto"
                  draggable={false}
                  className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
                  style={{
                    width: bitmap.width * s,
                    height: bitmap.height * s,
                    transform: `translate(calc(-50% + ${crop.x}px), calc(-50% + ${crop.y}px))`,
                  }}
                />
                {/* guia: o círculo é a janela das molduras do avatar; o quadro inteiro é o miniperfil */}
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_calc(50%-1px),rgba(236,229,216,0.85)_50%,rgba(10,10,12,0.42)_calc(50%+1px))]" />
                <BrassCorners size={18} inset={4} tone="silver" />
              </div>
              <GlyphClip className="absolute -top-4 left-4 size-8 -rotate-12 text-[#8f8e8b]" />
            </div>

            <p className="text-center font-mono text-[10px] uppercase tracking-[0.16em] text-dv-text-3">Arraste para posicionar · pince ou use a régua para zoom</p>
            <p className="-mt-1 text-center font-body text-[13px] leading-snug text-dv-text-2">O círculo é como a foto aparece nas molduras; o quadrado inteiro, no miniperfil.</p>
            {erro && (
              <p role="alert" className="text-center font-mono text-[11px] leading-snug text-[#e06a72]">
                {erro}
              </p>
            )}

            <div className="flex w-full items-center gap-1">
              <IconButton label="Diminuir zoom" variant="ghost" onClick={() => zoomTo(crop.zoom / 1.2)}>
                <ZoomOut strokeWidth={1.4} />
              </IconButton>
              <input
                type="range"
                min={1}
                max={MAX_ZOOM}
                step={0.01}
                value={crop.zoom}
                onChange={(e) => zoomTo(Number(e.target.value))}
                aria-label="Zoom"
                className={RANGE}
              />
              <IconButton label="Aumentar zoom" variant="ghost" onClick={() => zoomTo(crop.zoom * 1.2)}>
                <ZoomIn strokeWidth={1.4} />
              </IconButton>
            </div>
          </div>

          <footer className="flex items-center gap-2 border-t border-dv-line p-3">
            <RecButton variant="ghost" size="sm" onClick={() => setCrop({ zoom: 1, x: 0, y: 0 })} icon={<RotateCcw strokeWidth={1.4} />}>
              Redefinir
            </RecButton>
            <RecButton size="sm" className="ml-auto" sfx="confirm" onClick={confirmar} icon={<GlyphCheck />}>
              Salvar foto
            </RecButton>
          </footer>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function PhotoPicker({ hasPhoto, onChanged }: { hasPhoto: boolean; onChanged: () => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ fonte: Fonte; url: string } | null>(null)

  const closeEditor = () => setEditing(null)

  async function send(image: string | null) {
    setBusy(true)
    setError(null)
    setOk(null)
    try {
      await recordAction({ action: 'avatar', image })
      onChanged()
      setOk(image ? 'Foto atualizada.' : 'Foto removida.')
    } catch (e) {
      // fetch sem rede lança TypeError ("Failed to fetch"/"Load failed"): diga o que aconteceu de verdade
      setError(e instanceof TypeError ? 'Sem conexão: a foto não foi enviada. Tente de novo.' : e instanceof Error ? e.message : 'Falha ao enviar a foto.')
    } finally {
      setBusy(false)
    }
  }

  async function escolher(file: File) {
    setError(null)
    setOk(null)
    const recusa = motivoRecusa(file)
    if (recusa) return setError(recusa)
    setBusy(true)
    try {
      setEditing(await abrirImagem(file))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível abrir essa imagem.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1.5">
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            playSfx('open')
            input.current?.click()
          }}
          aria-label="Escolher foto do perfil"
          aria-busy={busy || undefined}
          style={{ '--dv-cut': '8px' } as CSSProperties}
          className="dv-focus dv-cut-diag group relative flex h-11 min-w-0 flex-1 items-center justify-center gap-2 bg-[#1c1c1f] px-1.5 text-white shadow-[inset_0_0_0_1px_rgba(186,176,159,0.45)] transition-[transform,box-shadow] duration-[120ms] enabled:hover:shadow-[inset_0_0_0_1px_#bab09f,0_0_16px_-6px_rgba(138,124,200,0.7)] enabled:active:scale-[0.97] disabled:opacity-60"
        >
          {busy ? <Spinner className="relative size-4" /> : <Camera className="relative size-4 shrink-0 text-[#d6cdbd]" strokeWidth={1.4} aria-hidden="true" />}
          <span className="relative whitespace-nowrap font-sans text-[11px] font-medium uppercase tracking-[0.16em]">{hasPhoto ? 'Trocar' : 'Foto'}</span>
        </button>
        {hasPhoto && (
          <button
            type="button"
            aria-label="Remover foto"
            disabled={busy}
            onClick={() => send(null)}
            style={{ '--dv-cut': '8px' } as CSSProperties}
            className="dv-focus dv-cut-diag grid size-11 shrink-0 place-items-center text-[#1c1c1f] shadow-[inset_0_0_0_1px_rgba(13,13,15,0.4)] transition-colors hover:text-[#a3121f] disabled:opacity-50"
          >
            <Trash2 className="size-4" strokeWidth={1.4} aria-hidden="true" />
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="font-mono text-[11px] leading-snug text-[#a3121f]">
          {error}
        </p>
      )}
      {ok && !error && (
        <p role="status" className="font-mono text-[11px] leading-snug text-[#3d6b4f]">
          {ok}
        </p>
      )}
      {/* image/*: no celular abre a escolha entre galeria e câmera (sem `capture`, que forçaria a câmera) */}
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-label="Arquivo da foto do perfil"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) void escolher(file)
        }}
      />
      {editing && (
        <PhotoCropper
          fonte={editing.fonte}
          url={editing.url}
          onCancel={closeEditor}
          onConfirm={(dataUrl) => {
            closeEditor()
            send(dataUrl)
          }}
        />
      )}
    </div>
  )
}
