'use client'

import type { ReactNode } from 'react'
import {
  APP_EMBLEMS,
  BloodDrop,
  Bow,
  BrassCorners,
  CageFrame,
  CheckerFloor,
  CrossedSwords,
  EmblemAvisos,
  EmblemMark,
  EmblemVotes,
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
  SYSTEM_EMBLEMS,
  type EmblemComponent,
} from '@/components/devo/kit'
import { portraitFrameProps } from '@/lib/devo/npcs'

const MELISSA = portraitFrameProps('melissa')

/**
 * Vitrine de §0 do IDENTIDADE.md: paleta tirada das refs do dono, materiais (CSS) e ornamentos
 * (SVG). Cada amostra cita a ref de onde veio.
 */

export const PALETTE: { name: string; token: string; v: string; role: string; ref: string; dark?: boolean }[] = [
  { name: 'Mármore negro', token: '--dv-ink', v: '#0c0c0e', role: 'fundo, painel (veludo)', ref: 'casas pretas do tabuleiro', dark: true },
  { name: 'Mármore negro alto', token: '--dv-ink-3', v: '#1f1f22', role: 'superfície elevada', ref: 'tabuleiro (#1e1f21)', dark: true },
  { name: 'Pedra negra', token: '--dv-marble-black', v: '#38393c', role: 'pedra, piso', ref: 'tabuleiro (#434449)', dark: true },
  { name: 'Veio cinza', token: '--dv-marble-vein', v: '#8f8e8b', role: 'veios, linhas', ref: 'tabuleiro (#797c81)' },
  { name: 'Mármore branco', token: '--dv-porcelain', v: '#f1f0ee', role: 'superfície clara, texto', ref: 'casas brancas (#ebe9ec)' },
  { name: 'Papel frio', token: '--dv-paper', v: '#e9e8e5', role: 'documento, interior', ref: 'tabuleiro (#dddddd)' },
  { name: 'Champanhe-prata', token: '--dv-gold', v: '#bab09f', role: 'metal, filigrana', ref: 'lâminas (#ada79b)' },
  { name: 'Reflexo do aço', token: '--dv-gold-bright', v: '#ece5d8', role: 'brilho do metal', ref: 'lâminas (#ebe1d8)' },
  { name: 'Sombra do aço', token: '--dv-gold-deep', v: '#6b6357', role: 'sombra do metal', ref: 'guardas (#7b6f63)', dark: true },
  { name: 'Ametista', token: '--dv-amethyst', v: '#8a7cc8', role: 'joia, ativo, foco', ref: 'pedras da guarda', dark: true },
  { name: 'Ametista clara', token: '--dv-amethyst-text', v: '#c2b9ec', role: 'texto/dado ativo', ref: 'reflexo das pedras' },
  { name: 'Ametista fumê', token: '--dv-cobalt', v: '#5a4f8f', role: 'bloco de estado ativo', ref: 'pedras na sombra', dark: true },
  { name: 'Noite', token: '--dv-night', v: '#19181f', role: 'só atmosfera de cena', ref: 'valsa (sombra)', dark: true },
  { name: 'Lavanda cinza', token: '--dv-violet', v: '#6f6b82', role: 'luz de cena', ref: 'valsa', dark: true },
  { name: 'Rubi', token: '--dv-blood', v: '#a3121f', role: 'só alerta e aviso', ref: 'valsa, NPCs', dark: true },
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
            <span className="font-mono text-[10px]" style={{ color: c.dark ? '#eeedeb' : '#151517' }}>
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
        <span className="absolute inset-0 grid place-items-center font-card-title text-[22px] font-semibold tracking-[0.12em] text-[#1a1916]">XII</span>
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

const APP_NAMES: Record<keyof typeof APP_EMBLEMS, string> = {
  record: 'Record',
  pulso: 'Pulso',
  mensagens: 'Mensagens',
  cartas: 'Cartas',
  trocas: 'Sala de Trocas',
  ajustes: 'Ajustes',
  jogos: 'Sala de Jogos',
}
const SYSTEM_NAMES: Record<keyof typeof SYSTEM_EMBLEMS, string> = {
  torres: 'Torres de Ruptura',
  poco: 'Poço dos Desejos',
  virtudes: 'Virtudes',
  arcanos: 'Arcanos',
  corporacoes: 'Corporações',
  mascaras: 'Salão das Máscaras',
}

function EmblemGrid({ items }: { items: [string, EmblemComponent][] }) {
  return (
    <ul className="grid grid-cols-3 gap-x-2 gap-y-5 sm:grid-cols-4">
      {items.map(([name, E]) => (
        <li key={name} className="flex flex-col items-center gap-2 text-center">
          <EmblemMark emblem={E} size={52} />
          <span className="dv-label text-[10px] leading-tight text-dv-text-2">{name}</span>
        </li>
      ))}
    </ul>
  )
}

/** Emblemas (Direção 2 §6): apps, sistemas futuros, tamanhos e estados. Sem fundo, sem ladrilho. */
export function EmblemShowcase() {
  const apps = Object.entries(APP_EMBLEMS).map(([k, E]) => [APP_NAMES[k as keyof typeof APP_EMBLEMS], E] as [string, EmblemComponent])
  const systems = Object.entries(SYSTEM_EMBLEMS).map(([k, E]) => [SYSTEM_NAMES[k as keyof typeof SYSTEM_EMBLEMS], E] as [string, EmblemComponent])
  return (
    <div className="grid gap-8">
      <div>
        <p className="dv-label mb-4 text-[10px] text-dv-gold">Apps</p>
        <EmblemGrid items={[...apps, ['Deadly Votes', EmblemVotes], ['Avisos', EmblemAvisos]]} />
      </div>
      <div>
        <p className="dv-label mb-4 text-[10px] text-dv-gold">Sistemas futuros</p>
        <EmblemGrid items={systems} />
      </div>
      <div>
        <p className="dv-label mb-3 text-[10px] text-dv-gold">Tamanhos · 24 · 40 · 72</p>
        <div className="flex items-end gap-5">
          {[24, 40, 72].map((n) => (
            <EmblemMark key={n} emblem={APP_EMBLEMS.record} size={n} />
          ))}
          {[24, 40, 72].map((n) => (
            <EmblemMark key={`j${n}`} emblem={APP_EMBLEMS.jogos} size={n} />
          ))}
        </div>
      </div>
      <div>
        <p className="dv-label mb-3 text-[10px] text-dv-gold">Estados</p>
        <div className="grid grid-cols-5 gap-2 text-center">
          {(
            [
              ['Repouso', { state: 'rest' }],
              ['Pressionado', { state: 'pressed' }],
              ['Ativo', { state: 'selected' }],
              ['Aviso', { state: 'rest', badge: 3 }],
              ['Bloqueado', { state: 'locked' }],
            ] as const
          ).map(([label, o]) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <EmblemMark emblem={APP_EMBLEMS.mensagens} size={48} {...o} />
              <span className="dv-label text-[9px] text-dv-text-3">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="dv-cold-paper flex items-center justify-around px-4 py-5 text-[#141416]">
        {Object.values(APP_EMBLEMS).map((E, i) => (
          <E key={i} className="size-9" />
        ))}
      </div>
    </div>
  )
}

/**
 * Amostra do tabuleiro (ref-mestra de cor: refs/ref-xadrez-marmore.png) desenhada com o kit:
 * mármore negro e branco com veios cinza, rejunte e espadas em aço champanhe, ametista na guarda.
 */
export function BoardSample() {
  return (
    <figure className="relative h-[280px] overflow-hidden border border-dv-line bg-[radial-gradient(80%_60%_at_50%_30%,#2a2a2e,var(--dv-ink)_75%)]">
      <CheckerFloor tilt={56} cell={58} className="!h-[78%]" />
      <Sword className="absolute bottom-[14%] left-[10%] h-[66%] rotate-[18deg]" gem="glass" />
      <Sword className="absolute bottom-[20%] right-[12%] h-[58%] -rotate-[14deg]" gem="glass" />
      <FacetGem tone="night" className="absolute left-[21%] top-[27%] h-5 rotate-[18deg]" />
      <figcaption className="dv-label absolute left-3 top-2 text-[10px] text-dv-text-2">Amostra · mármore, aço champanhe, ametista</figcaption>
    </figure>
  )
}
