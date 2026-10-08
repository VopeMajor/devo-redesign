'use client'

import { Camera, Check, Loader2, RotateCcw, Trash2, X, ZoomIn, ZoomOut } from 'lucide-react'
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
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
    <div className="dv-dark fixed inset-0 z-[130] grid place-items-center bg-black/80 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Ajustar foto do perfil"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-sm flex-col border border-white/15 bg-[#0a0c11] text-foreground"
      >
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
          <span className="flex items-baseline gap-2.5">
            <span className="font-serif text-base uppercase tracking-[0.05em]">Ajustar foto</span>
            <span lang="ja" className="text-[9px] tracking-[0.25em] text-foreground/45">
              トリミング
            </span>
          </span>
          <button type="button" onClick={onCancel} aria-label="Cancelar" className="grid size-8 place-items-center text-foreground/55 hover:text-foreground">
            <X className="size-4" />
          </button>
        </header>

        <div className="flex flex-col items-center gap-4 p-5">
          <div
            className="relative cursor-grab touch-none select-none overflow-hidden border border-dv-blue-light/60 bg-black active:cursor-grabbing"
            style={{ width: FRAME_W, height: FRAME_H, boxShadow: '0 0 0 9999px rgba(0,0,0,0.0), 0 0 30px -8px #6f8cff' }}
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
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,transparent_33%,rgba(255,255,255,0.12)_33%,rgba(255,255,255,0.12)_calc(33%+1px),transparent_calc(33%+1px),transparent_66%,rgba(255,255,255,0.12)_66%,rgba(255,255,255,0.12)_calc(66%+1px),transparent_calc(66%+1px)),linear-gradient(to_bottom,transparent_33%,rgba(255,255,255,0.12)_33%,rgba(255,255,255,0.12)_calc(33%+1px),transparent_calc(33%+1px),transparent_66%,rgba(255,255,255,0.12)_66%,rgba(255,255,255,0.12)_calc(66%+1px),transparent_calc(66%+1px))]" />
          </div>

          <p className="text-[10px] uppercase tracking-[0.25em] text-foreground/45">Arraste para posicionar · role para zoom</p>

          <div className="flex w-full items-center gap-3">
            <button type="button" onClick={() => zoomTo(crop.zoom / 1.2)} aria-label="Diminuir zoom" className="text-foreground/60 hover:text-foreground">
              <ZoomOut className="size-4" />
            </button>
            <input
              type="range"
              min={1}
              max={MAX_ZOOM}
              step={0.01}
              value={crop.zoom}
              onChange={(e) => zoomTo(Number(e.target.value))}
              aria-label="Zoom"
              className="flex-1 accent-[#6f8cff]"
            />
            <button type="button" onClick={() => zoomTo(crop.zoom * 1.2)} aria-label="Aumentar zoom" className="text-foreground/60 hover:text-foreground">
              <ZoomIn className="size-4" />
            </button>
          </div>
        </div>

        <footer className="flex items-center gap-2 border-t border-white/10 p-3">
          <button
            type="button"
            onClick={() => setCrop({ zoom: 1, x: 0, y: 0 })}
            className="flex items-center gap-1.5 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-foreground/60 hover:text-foreground"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Redefinir
          </button>
          <button
            type="button"
            onClick={() => onConfirm(renderCrop(bitmap, crop))}
            className="ml-auto flex items-center gap-1.5 border border-dv-blue-light bg-dv-blue px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white hover:brightness-110"
          >
            <Check className="size-3.5" aria-hidden="true" />
            Salvar foto
          </button>
        </footer>
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

  const btn =
    'grid size-8 place-items-center border border-white/30 bg-dv-black/70 text-white backdrop-blur-sm transition-colors hover:border-dv-blue-light hover:bg-dv-blue disabled:opacity-60'

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1">
        {hasPhoto && (
          <button type="button" disabled={busy} onClick={() => send(null)} className={btn} aria-label="Remover foto">
            <Trash2 className="size-3.5" aria-hidden="true" />
          </button>
        )}
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className={cn(btn, 'w-auto gap-1.5 px-2.5')} aria-label="Escolher foto do perfil">
          {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <Camera className="size-3.5" aria-hidden="true" />}
          <span className="font-mono text-[9px] uppercase tracking-[0.18em]">{hasPhoto ? 'Trocar' : 'Foto'}</span>
        </button>
      </div>
      {error && (
        <p role="alert" className="max-w-40 bg-dv-black/80 px-2 py-1 text-right font-mono text-[9px] text-destructive">
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
