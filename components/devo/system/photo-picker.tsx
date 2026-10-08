'use client'

import { Camera, RotateCcw, Trash2, ZoomIn, ZoomOut } from 'lucide-react'
import { type CSSProperties, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { Button, Frame, FrameCorners, GlyphCheck, GlyphClip, GlyphClose, IconButton, Spinner } from '@/components/devo/kit'
import { playSfx } from '@/lib/devo/audio'
import { recordAction } from './use-deadly-votes'

const OUT_W = 480
const OUT_H = 640
const FRAME_W = 240
const FRAME_H = 320
const MAX_ZOOM = 4

type Crop = { zoom: number; x: number; y: number }

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

function renderCrop(bitmap: ImageBitmap, c: Crop) {
  const s = coverScale(bitmap) * c.zoom
  const sw = FRAME_W / s
  const sh = FRAME_H / s
  const sx = bitmap.width / 2 - c.x / s - sw / 2
  const sy = bitmap.height / 2 - c.y / s - sh / 2
  const canvas = document.createElement('canvas')
  canvas.width = OUT_W
  canvas.height = OUT_H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas indisponível.')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, OUT_W, OUT_H)
  return canvas.toDataURL('image/jpeg', 0.85)
}

function PhotoCropper({ bitmap, url, onCancel, onConfirm }: { bitmap: ImageBitmap; url: string; onCancel: () => void; onConfirm: (dataUrl: string) => void }) {
  const [crop, setCrop] = useState<Crop>({ zoom: 1, x: 0, y: 0 })
  const drag = useRef<{ id: number; sx: number; sy: number; ox: number; oy: number } | null>(null)
  const setClamped = (c: Crop) => setCrop(clampCrop(c, bitmap))
  const s = coverScale(bitmap) * crop.zoom

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: crop.x, oy: crop.y }
  }
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    setClamped({ zoom: crop.zoom, x: d.ox + e.clientX - d.sx, y: d.oy + e.clientY - d.sy })
  }
  const zoomTo = (z: number) => setClamped({ ...crop, zoom: Math.min(MAX_ZOOM, Math.max(1, z)) })

  return createPortal(
    <div className="fixed inset-0 z-[130] grid animate-dv-fade place-items-center bg-[rgba(5,7,13,0.82)] p-4 backdrop-blur-sm" onClick={onCancel}>
      <div role="dialog" aria-modal="true" aria-label="Ajustar foto do perfil" onClick={(e) => e.stopPropagation()} className="w-full max-w-sm animate-dv-pop">
        <Frame tone="cobalt" pad="none" cutSize={16} glow>
          <header className="flex items-center justify-between gap-3 border-b border-dv-line px-4 py-2">
            <div>
              <p className="dv-label text-[10px] text-dv-cobalt-text">Record File · Foto</p>
              <p className="flex items-baseline gap-2.5 font-display text-[18px] font-semibold uppercase tracking-[0.08em] text-dv-text">
                Ajustar foto
                <span lang="ja" className="font-sans text-[11px] font-normal tracking-[0.22em] text-dv-text-3">
                  トリミング
                </span>
              </p>
            </div>
            <IconButton label="Cancelar" variant="ghost" onClick={onCancel} sfx="close">
              <GlyphClose />
            </IconButton>
          </header>

          <div className="flex flex-col items-center gap-3 p-5">
            <div className="relative bg-[#fbf8f0] p-1.5 pb-5 shadow-[0_10px_24px_rgba(0,0,0,0.5)]">
              <div
                className="relative cursor-grab touch-none select-none overflow-hidden bg-black active:cursor-grabbing"
                style={{ width: FRAME_W, height: FRAME_H }}
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={() => (drag.current = null)}
                onPointerCancel={() => (drag.current = null)}
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
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,transparent_33%,rgba(255,255,255,0.14)_33%,rgba(255,255,255,0.14)_calc(33%+1px),transparent_calc(33%+1px),transparent_66%,rgba(255,255,255,0.14)_66%,rgba(255,255,255,0.14)_calc(66%+1px),transparent_calc(66%+1px)),linear-gradient(to_bottom,transparent_33%,rgba(255,255,255,0.14)_33%,rgba(255,255,255,0.14)_calc(33%+1px),transparent_calc(33%+1px),transparent_66%,rgba(255,255,255,0.14)_66%,rgba(255,255,255,0.14)_calc(66%+1px),transparent_calc(66%+1px))]" />
                <FrameCorners tone="cobalt" size={18} inset={4} />
              </div>
              <GlyphClip className="absolute -top-4 left-4 size-8 -rotate-12 text-dv-gold" />
            </div>

            <p className="dv-label text-center text-[10px] text-dv-text-3">Arraste para posicionar · pince ou role para zoom</p>

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
                className="h-11 flex-1 accent-[var(--dv-cobalt)]"
              />
              <IconButton label="Aumentar zoom" variant="ghost" onClick={() => zoomTo(crop.zoom * 1.2)}>
                <ZoomIn strokeWidth={1.4} />
              </IconButton>
            </div>
          </div>

          <footer className="flex items-center gap-2 border-t border-dv-line p-3">
            <Button variant="ghost" size="sm" onClick={() => setCrop({ zoom: 1, x: 0, y: 0 })} icon={<RotateCcw strokeWidth={1.4} />}>
              Redefinir
            </Button>
            <Button size="sm" className="ml-auto" sfx="confirm" onClick={() => onConfirm(renderCrop(bitmap, crop))} icon={<GlyphCheck />}>
              Salvar foto
            </Button>
          </footer>
        </Frame>
      </div>
    </div>,
    document.body,
  )
}

export function PhotoPicker({ hasPhoto, onChanged }: { hasPhoto: boolean; onChanged: () => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ bitmap: ImageBitmap; url: string } | null>(null)

  const closeEditor = () => {
    if (editing) {
      editing.bitmap.close()
      URL.revokeObjectURL(editing.url)
    }
    setEditing(null)
  }

  async function send(image: string | null) {
    setBusy(true)
    setError(null)
    try {
      await recordAction({ action: 'avatar', image })
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao enviar a foto.')
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
          className="dv-focus dv-cut group relative flex h-11 min-w-0 flex-1 items-center justify-center gap-2 bg-dv-ink px-2 text-white transition-transform duration-[120ms] enabled:active:scale-[0.97] disabled:opacity-60"
        >
          <span aria-hidden="true" className="dv-cut absolute inset-0 shadow-[inset_0_0_0_1px_rgba(125,151,255,0.45)] transition-colors group-enabled:group-hover:bg-dv-cobalt-dim" style={{ '--dv-cut': '8px' } as CSSProperties} />
          {busy ? <Spinner className="relative size-4" /> : <Camera className="relative size-4 shrink-0 text-dv-cobalt-text" strokeWidth={1.4} aria-hidden="true" />}
          <span className="relative truncate font-mono text-[11px] uppercase tracking-[0.14em]">{hasPhoto ? 'Trocar' : 'Foto'}</span>
        </button>
        {hasPhoto && (
          <IconButton label="Remover foto" variant="secondary" disabled={busy} onClick={() => send(null)}>
            <Trash2 strokeWidth={1.4} />
          </IconButton>
        )}
      </div>
      {error && (
        <p role="alert" className="font-mono text-[11px] leading-snug text-dv-blood">
          {error}
        </p>
      )}
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        tabIndex={-1}
        onChange={async (e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (!file) return
          if (file.size > 12 * 1024 * 1024) return setError('Arquivo acima de 12 MB.')
          try {
            const bitmap = await createImageBitmap(file)
            setEditing({ bitmap, url: URL.createObjectURL(file) })
          } catch {
            setError('Não foi possível ler essa imagem.')
          }
        }}
      />
      {editing && (
        <PhotoCropper
          bitmap={editing.bitmap}
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
