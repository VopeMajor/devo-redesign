'use client'

import type { ReactNode } from 'react'
import {
  BloodDrop,
  Bow,
  BrassCorners,
  CageFrame,
  CheckerFloor,
  CrossedSwords,
  FacetGem,
  FiligreeCorner,
  Gear,
  LaceEdge,
  Lantern,
  OrnamentBand,
  RomanDial,
  SigilLozenge,
  SigilStar,
  Sword,
} from '@/components/devo/kit'
import { portraitFrameProps } from '@/lib/devo/npcs'

const MELISSA = portraitFrameProps('melissa')

/**
 * Vitrine de §0 do IDENTIDADE.md: paleta tirada das refs do dono, materiais (CSS) e ornamentos
 * (SVG). Cada amostra cita a ref de onde veio.
 */

export const PALETTE: { name: string; token: string; v: string; role: string; ref: string; dark?: boolean }[] = [
  { name: 'Veludo', token: '--dv-ink', v: '#0a090d', role: 'fundo, painel', ref: 'figurino, NPCs', dark: true },
  { name: 'Veludo alto', token: '--dv-ink-3', v: '#1b1824', role: 'superfície', ref: 'valsa (sombras)', dark: true },
  { name: 'Mármore negro', token: '--dv-marble-black', v: '#2e2f34', role: 'pedra, piso', ref: 'xadrez', dark: true },
  { name: 'Veio', token: '--dv-marble-vein', v: '#8a8986', role: 'veios, linhas', ref: 'xadrez' },
  { name: 'Porcelana', token: '--dv-porcelain', v: '#f2f0ec', role: 'renda, superfície clara', ref: 'figurino' },
  { name: 'Papel frio', token: '--dv-paper', v: '#ece9e3', role: 'documento, interior', ref: 'Record + figurino' },
  { name: 'Noite', token: '--dv-night', v: '#1c1b33', role: 'atmosfera, céu', ref: 'valsa (céu do relógio)', dark: true },
  { name: 'Noite alta', token: '--dv-night-2', v: '#34365a', role: 'halo de cena', ref: 'valsa', dark: true },
  { name: 'Lavanda', token: '--dv-violet', v: '#6c6899', role: 'duotom, tecido', ref: 'gaiola (fita)', dark: true },
  { name: 'Índigo', token: '--dv-cobalt', v: '#4152c0', role: 'sistema, foco', ref: 'NPCs (marinho)', dark: true },
  { name: 'Marinho', token: '--dv-cobalt-deep', v: '#2f3c9c', role: 'bloco, aba ativa', ref: 'NPCs 06/11', dark: true },
  { name: 'Latão', token: '--dv-gold', v: '#b09a6c', role: 'metal, filigrana', ref: 'gaiola, xadrez' },
  { name: 'Latão claro', token: '--dv-gold-bright', v: '#e3d5ac', role: 'reflexo do metal', ref: 'valsa (engrenagens)' },
  { name: 'Latão escuro', token: '--dv-gold-deep', v: '#5e4d33', role: 'sombra do metal', ref: 'gaiola', dark: true },
  { name: 'Rubi', token: '--dv-blood', v: '#a3121f', role: 'joia, alerta', ref: 'valsa, NPCs 05/13', dark: true },
  { name: 'Vinho', token: '--dv-blood-deep', v: '#3f060b', role: 'fundo de alerta', ref: 'NPC 13', dark: true },
]

function Swatch({ label, className, children }: { label: string; className?: string; children?: ReactNode }) {
  return (
    <figure className="flex flex-col gap-1.5">
      <div className={`relative h-24 overflow-hidden ${className ?? ''}`}>{children}</div>
      <figcaption className="dv-label text-[10px] text-dv-text-2">{label}</figcaption>
    </figure>
  )
}

export function PaletteGrid() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {PALETTE.map((c) => (
        <div key={c.token} className="border border-dv-line bg-dv-ink-2">
          <div className="flex h-14 items-end justify-end p-1.5" style={{ background: c.v }}>
            <span className="font-mono text-[10px]" style={{ color: c.dark ? '#eeecef' : '#121016' }}>
              {c.v}
            </span>
          </div>
          <div className="p-2">
            <p className="font-body text-[13px] font-semibold text-dv-text">{c.name}</p>
            <p className="font-mono text-[10px] text-dv-text-3">{c.token}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-dv-text-2">
              {c.role} · <span className="text-dv-text-3">{c.ref}</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export function MaterialGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Swatch label="Veludo · dv-velvet" className="dv-velvet" />
      <Swatch label="Porcelana · dv-porcelain" className="dv-porcelain">
        <div className="absolute inset-x-0 bottom-0">
          <LaceEdge tone="porcelain" height={14} className="drop-shadow-[0_1px_0_rgba(0,0,0,0.12)]" />
        </div>
      </Swatch>
      <Swatch label="Mármore · dv-marble" className="dv-marble" />
      <Swatch label="Mármore negro · dv-marble-dark" className="dv-marble-dark" />
      <Swatch label="Latão · dv-brass" className="dv-brass">
        <span className="absolute inset-0 grid place-items-center font-card-title text-[22px] font-semibold tracking-[0.12em] text-[#1a1408]">XII</span>
      </Swatch>
      <Swatch label="Xadrez · dv-checker-marble" className="dv-checker-marble" />
      <Swatch label="Céu · dv-night-sky" className="dv-night-sky">
        <SigilStar tone="brass" className="absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2" />
      </Swatch>
      <Swatch label="Papel frio + xadrez sutil" className="dv-cold-paper">
        <span className="dv-checker-faint absolute inset-0" />
      </Swatch>
    </div>
  )
}

export function OrnamentShowcase() {
  return (
    <div className="grid gap-6">
      {/* herói: retrato na gaiola */}
      <div className="grid grid-cols-[1fr_1fr] items-end gap-4">
        <figure>
          <CageFrame className="w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={MELISSA?.src ?? ''} alt="Melissa na gaiola de latão" className="size-full object-cover" style={{ objectPosition: MELISSA?.position ?? '50% 0%' }} />
          </CageFrame>
          <figcaption className="dv-label mt-2 text-[10px] text-dv-text-3">CageFrame · retrato do perfil</figcaption>
        </figure>
        <figure>
          <CageFrame className="w-full" gems="night" ribbon={false}>
            <div className="grid size-full place-items-center">
              <CrossedSwords className="w-[70%]" />
            </div>
          </CageFrame>
          <figcaption className="dv-label mt-2 text-[10px] text-dv-text-3">CageFrame · conquista</figcaption>
        </figure>
      </div>

      {/* mostrador + lanterna */}
      <div className="dv-night-sky relative h-[340px] overflow-hidden border border-dv-line">
        <RomanDial glass className="absolute left-1/2 top-4 w-[78%] max-w-[300px] -translate-x-1/2" />
        <Lantern chain={40} className="absolute left-3 top-0 w-12" />
        <Lantern chain={90} className="absolute right-4 top-0 w-10" style={{ animationDelay: '-2.5s' }} />
        <CheckerFloor tilt={66} cell={46} className="!h-[30%]" />
        <p className="dv-label absolute right-3 top-2 text-[10px] text-dv-text-2">RomanDial · Lantern · CheckerFloor</p>
      </div>

      {/* pequenos */}
      <div className="grid grid-cols-4 items-center gap-4">
        <figure className="flex flex-col items-center gap-1">
          <Gear spin="cw" teeth={14} className="size-14" />
          <figcaption className="dv-label text-[9px] text-dv-text-3">Gear</figcaption>
        </figure>
        <figure className="flex flex-col items-center gap-1">
          <Sword className="h-16 rotate-[20deg]" gem="blood" />
          <figcaption className="dv-label text-[9px] text-dv-text-3">Sword</figcaption>
        </figure>
        <figure className="flex flex-col items-center gap-1">
          <FacetGem tone="night" className="h-12" />
          <figcaption className="dv-label text-[9px] text-dv-text-3">FacetGem</figcaption>
        </figure>
        <figure className="flex flex-col items-center gap-1">
          <BloodDrop className="h-11" />
          <figcaption className="dv-label text-[9px] text-dv-text-3">BloodDrop</figcaption>
        </figure>
        <figure className="flex flex-col items-center gap-1">
          <Bow className="w-16" />
          <figcaption className="dv-label text-[9px] text-dv-text-3">Bow</figcaption>
        </figure>
        <figure className="flex flex-col items-center gap-1">
          <SigilLozenge className="h-12" />
          <figcaption className="dv-label text-[9px] text-dv-text-3">SigilLozenge</figcaption>
        </figure>
        <figure className="flex flex-col items-center gap-1">
          <SigilStar tone="brass" className="size-11" />
          <figcaption className="dv-label text-[9px] text-dv-text-3">SigilStar</figcaption>
        </figure>
        <figure className="flex flex-col items-center gap-1">
          <FiligreeCorner className="size-12" />
          <figcaption className="dv-label text-[9px] text-dv-text-3">Filigrana</figcaption>
        </figure>
      </div>
      <OrnamentBand count={6} />

      {/* painel de veludo com cantos de latão */}
      <div className="dv-velvet relative px-6 py-7">
        <BrassCorners size={30} />
        <p className="dv-label text-[10px] text-dv-gold">Veludo · BrassCorners</p>
        <p className="mt-2 font-display text-[26px] uppercase leading-none text-dv-text">Salão do Relógio</p>
        <p className="mt-2 max-w-sm font-body text-[14px] leading-relaxed text-dv-text-2">Ouro só no metal. Um ornamento-herói por tela e no máximo dois blocos com filigrana.</p>
      </div>
    </div>
  )
}
