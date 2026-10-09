'use client'

import { UserRound, X } from 'lucide-react'
import { type CSSProperties, createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import useSWR from 'swr'
import { arcadeFetcher, arcadeKey, type BorderTier, type MiniProfile } from '@/lib/devo/arcade/client'
import { GAMES, type GameId } from '@/lib/devo/arcade/games'
import { cn } from '@/lib/utils'

export const BORDER_META: Record<BorderTier, { label: string; color: string; glow: string }> = {
  padrao: { label: 'Borda Padrão', color: '#5b6170', glow: 'transparent' },
  azul: { label: 'Borda Azul · Top 10', color: '#c2b9ec', glow: '#c2b9ec66' },
  prata: { label: 'Borda Prata · Top 3', color: '#d3dae8', glow: '#d3dae855' },
  ouro: { label: 'Borda Ouro · #1 da semana', color: '#e2b95c', glow: '#e2b95c77' },
  dealer: { label: 'Borda Dealer', color: '#c2b9ec', glow: '#c2b9ec66' },
}

const ROLE_LABEL: Record<string, string> = { player: 'Participante', dealer: 'Dealer', admin: 'Administrador' }

const OpenProfileContext = createContext<((pid: string) => void) | null>(null)

export function useOpenProfile() {
  return useContext(OpenProfileContext)
}

export function MiniProfileHost({ children }: { children: ReactNode }) {
  const [pid, setPid] = useState<string | null>(null)
  const open = useCallback((id: string) => setPid(id), [])
  return (
    <OpenProfileContext.Provider value={open}>
      {children}
      {pid && <MiniProfileDialog pid={pid} onClose={() => setPid(null)} />}
    </OpenProfileContext.Provider>
  )
}

export function avatarSrc(p: Pick<MiniProfile, 'id' | 'avatarVersion'>) {
  return p.avatarVersion ? `/api/arcade?view=avatar&pid=${p.id}&v=${p.avatarVersion}` : null
}

function MiniProfileDialog({ pid, onClose }: { pid: string; onClose: () => void }) {
  const { data, error } = useSWR<MiniProfile>(arcadeKey('profile', `&pid=${pid}`), arcadeFetcher)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const tier = BORDER_META[data?.border ?? 'padrao']

  return createPortal(
    <div className="fixed inset-0 z-[120] grid place-items-center overflow-y-auto bg-black/75 p-3 backdrop-blur-sm sm:p-4" onClick={onClose}>
      <div className="flex w-full min-w-0 max-w-[22rem] flex-col gap-1.5 sm:max-w-[40rem]" onClick={(e) => e.stopPropagation()}>
        <span className="px-1 font-sans text-[10px] font-semibold uppercase tracking-[0.32em] text-white/55">DEVO.System</span>
        <article
          style={{ '--dv-cut': '14px', borderColor: `${tier.color}99`, boxShadow: `0 0 0 1px #000, 0 0 60px -12px ${tier.glow}, inset 0 0 40px -20px ${tier.glow}` } as CSSProperties}
          role="dialog"
          aria-modal="true"
          aria-label={data ? `Perfil de ${data.name}` : 'Perfil do jogador'}
          className="dv-dark dv-cut relative w-full animate-dv-pop overflow-hidden border bg-[linear-gradient(170deg,var(--dv-ink-3),var(--dv-ink)_60%)] text-dv-text"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar perfil"
            className="dv-focus absolute right-1 top-1 z-20 grid size-11 place-items-center text-dv-text-2 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>

          {error ? (
            <p className="relative p-8 text-center text-sm text-white/60">Não foi possível carregar este perfil.</p>
          ) : !data ? (
            <div className="relative flex min-h-[16rem]" aria-busy="true">
              <span className="w-[38%] animate-pulse bg-[#0b1550]/60" />
              <span className="flex flex-1 flex-col gap-3 p-6">
                <span className="h-7 w-2/3 animate-pulse rounded-sm bg-white/10" />
                <span className="h-3 w-1/3 animate-pulse rounded-sm bg-white/10" />
                <span className="mt-6 h-12 w-full animate-pulse rounded-sm bg-white/10" />
                <span className="mt-2 h-10 w-full animate-pulse rounded-sm bg-white/10" />
              </span>
            </div>
          ) : (
            <ProfileBody data={data} tier={tier} />
          )}
        </article>
      </div>
    </div>,
    document.body,
  )
}

function recordId(id: string) {
  const clean = id.replace(/[^a-z0-9]/gi, '').toUpperCase().padEnd(8, '0')
  return `D7-${clean.slice(0, 4)}-${clean.slice(4, 5)}`
}

function ProfileBody({ data, tier }: { data: MiniProfile; tier: (typeof BORDER_META)[BorderTier] }) {
  const src = avatarSrc(data)
  const bestName = data.bestGame ? (GAMES[data.bestGame.gameId as GameId]?.name ?? data.bestGame.gameId) : null

  return (
    <div className="relative flex min-w-0 flex-col sm:min-h-[17rem] sm:flex-row">
      <div className="relative aspect-[4/3] max-h-[45vh] w-full shrink-0 overflow-hidden min-[400px]:aspect-[16/10] sm:absolute sm:inset-y-0 sm:left-0 sm:aspect-auto sm:max-h-none sm:w-[42%]">
        {src ? (
          // biome-ignore lint/performance/noImgElement: avatar privado servido pela API
          <img src={src} alt="" className="absolute inset-0 size-full object-cover object-[50%_20%]" />
        ) : (
          <span className="absolute inset-0 grid place-items-center bg-white/[0.03]">
            <UserRound className="size-24 text-white/30" strokeWidth={0.75} aria-hidden="true" />
          </span>
        )}
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#04071a] to-transparent sm:inset-y-0 sm:left-auto sm:right-0 sm:h-auto sm:w-1/3 sm:bg-gradient-to-r sm:from-transparent sm:to-[#04071a]" />
      </div>

      <div className="relative flex min-w-0 flex-1 flex-col sm:ml-[38%]">
        <div className="relative flex min-w-0 flex-col gap-1 px-4 pb-3 pt-3 pr-10 sm:gap-1.5 sm:px-5 sm:pb-4 sm:pt-5 sm:pr-12">
          <span className="mb-1 inline-flex w-fit items-center gap-1.5 border px-1.5 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ borderColor: `${tier.color}66`, color: tier.color }}>
            <span aria-hidden="true" className="size-1 rounded-full" style={{ background: tier.color, boxShadow: `0 0 6px ${tier.color}` }} />
            {ROLE_LABEL[data.role] ?? data.role}
          </span>
          <p className="truncate font-impact text-[1.6rem] font-semibold sm:text-[2.1rem] uppercase leading-none tracking-[0.02em] text-white">{data.name}</p>
          <p className="font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-white/60">
            ID.Record: <span className="font-mono tracking-[0.12em] text-white/85">{recordId(data.id)}</span>
          </p>
          <p aria-hidden="true" className="mt-0.5 truncate font-serif text-sm italic sm:text-base text-white/35" style={{ transform: 'skewX(-14deg)', letterSpacing: '-0.02em' }}>
            {data.name}
          </p>
        </div>

        <dl className="relative grid min-w-0 grid-cols-3 border-y border-white/10">
          <Cell label="Ranking semanal">
            {data.week.rank ? (
              <span style={{ color: tier.color }}>
                #{String(data.week.rank).padStart(2, '0')}
                <span className="ml-1 text-xs text-white/40">/{data.week.total}</span>
              </span>
            ) : (
              <span className="text-white/40">—</span>
            )}
          </Cell>
          <Cell label="Deadly Votes" className="border-l border-white/10" sub={`S ${data.deadlyVotes.survived} · E ${data.deadlyVotes.eliminated}`}>
            <span className="text-[#c2b9ec]">{String(data.deadlyVotes.total).padStart(2, '0')}</span>
          </Cell>
          <Cell label="Vitórias" className="border-l border-white/10" sub={`${data.week.games} partidas`}>
            <span className="text-white">{String(data.week.wins).padStart(2, '0')}</span>
          </Cell>
        </dl>

        <div className="relative flex min-w-0 flex-1 flex-wrap items-end justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex flex-col gap-1.5">
            <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">Borda</span>
            <span className="flex items-center gap-2 font-mono text-base uppercase leading-none sm:text-lg tracking-[0.06em]" style={{ color: tier.color }}>
              {tier.label.split(' · ')[0].replace('Borda ', '')}
              <span aria-hidden="true" className="grid size-5 place-items-center rounded-full border" style={{ borderColor: tier.color, boxShadow: `0 0 10px ${tier.glow}` }}>
                <span className="size-1.5 rotate-45" style={{ background: tier.color }} />
              </span>
            </span>
            {tier.label.includes(' · ') && (
              <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/45">{tier.label.split(' · ')[1]}</span>
            )}
          </div>
          <div
            className="flex min-w-0 max-w-full items-center gap-3 dv-cut-diag border px-3 py-2 font-sans text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ borderColor: `${tier.color}55`, color: '#c9d4ff', background: `${tier.color}0d` }}
          >
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-white/45">{bestName ? 'Melhor jogo' : 'Pontos da semana'}</span>
              <span className="truncate">{bestName ? `${bestName} · ${data.bestGame?.points} pts` : `${data.week.score.toLocaleString('pt-BR')} pts`}</span>
            </span>
            <span aria-hidden="true" style={{ color: tier.color }}>→</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Cell({ label, children, className, sub }: { label: string; children: ReactNode; className?: string; sub?: string }) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5 px-2.5 py-2.5 sm:gap-2 sm:px-5 sm:py-3.5', className)}>
      <dt className="font-sans text-[10px] font-semibold uppercase leading-tight tracking-[0.12em] text-white/55  sm:tracking-[0.18em]">{label}</dt>
      <dd className="flex flex-col gap-1 font-mono text-lg tabular-nums leading-none sm:text-2xl">
        {children}
        {sub && <span className="truncate font-sans text-[10px] uppercase tracking-[0.14em] text-white/45  sm:tracking-[0.24em]">{sub}</span>}
      </dd>
    </div>
  )
}

export function AvatarRing({ profile, size = 48 }: { profile: MiniProfile; size?: number }) {
  const tier = BORDER_META[profile.border]
  const src = avatarSrc(profile)
  return (
    <span
      className="relative grid shrink-0 place-items-center rounded-full p-[3px]"
      style={{
        width: size,
        height: size,
        background: profile.border === 'padrao' ? tier.color : `conic-gradient(from 210deg, ${tier.color}, #0a0c11 30%, ${tier.color} 55%, #0a0c11 80%, ${tier.color})`,
        boxShadow: `0 0 18px ${tier.glow}`,
      }}
    >
      <span className="relative grid size-full place-items-center overflow-hidden rounded-full border-2 border-[#0a0c11] bg-[#121726]">
        {src ? (
          // biome-ignore lint/performance/noImgElement: avatar privado servido pela API
          <img src={src} alt="" className="size-full object-cover" />
        ) : (
          <UserRound className="size-1/2 text-white/45" strokeWidth={1.25} aria-hidden="true" />
        )}
      </span>
    </span>
  )
}
