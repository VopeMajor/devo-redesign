'use client'

import { UserRound, X } from 'lucide-react'
import { type CSSProperties, createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import useSWR from 'swr'
import { arcadeFetcher, arcadeKey, type BorderTier, type MiniProfile } from '@/lib/devo/arcade/client'
import { GAMES, type GameId } from '@/lib/devo/arcade/games'
import { cn } from '@/lib/utils'
import { type CosmeticoDef, RARIDADE_PADRAO } from '@/lib/devo/cosmeticos'
import { BalaoChat, Emblema, FotoMoldurada, NomeVisual } from '../cosmeticos/cosmetic-art'
import { AmostraNome, BordaPerfilFundo } from '../cosmeticos/estilo-nome'
import { useAnimarCosmeticos, useCatalogo, useVisual } from '../cosmeticos/use-cosmeticos'

export const BORDER_META: Record<BorderTier, { label: string; color: string; glow: string }> = {
  padrao: { label: 'Borda Padrão', color: '#58585e', glow: 'transparent' },
  azul: { label: 'Borda Azul · Top 10', color: 'var(--dv-amethyst-text)', glow: '#c2b9ec66' },
  prata: { label: 'Borda Prata · Top 3', color: '#d9d8d4', glow: '#d9d8d455' },
  ouro: { label: 'Borda Ouro · #1 da semana', color: '#ece5d8', glow: '#bab09f77' },
  dealer: { label: 'Borda Dealer', color: 'var(--dv-amethyst-text)', glow: '#c2b9ec66' },
}

// O servidor nunca envia 'owner' aqui (publicCargo em lib/devo/cargos.ts).
const ROLE_LABEL: Record<string, string> = { player: 'Participante', dealer: 'Dealer', anfitriao: 'Anfitrião' }

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

  // Folha que sobe do rodapé no celular; cartão centralizado no desktop (estrutura de card de perfil à Wild Rift:
  // faixa/borda no topo, avatar grande com moldura sobreposto, nome com estilo, cargo público, números e vitrine).
  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 backdrop-blur-[3px] sm:items-center sm:p-4" onClick={onClose}>
      <article
        role="dialog"
        aria-modal="true"
        aria-label={data ? `Perfil de ${data.name}` : 'Perfil do jogador'}
        onClick={(e) => e.stopPropagation()}
        style={{ '--dv-cut': '16px' } as CSSProperties}
        className="cos-folha dv-dark relative max-h-[92dvh] w-full max-w-[26rem] overflow-y-auto overscroll-contain bg-[linear-gradient(180deg,#15151a,#0c0c0e_45%)] text-dv-text dv-cut shadow-[0_-18px_50px_-10px_rgba(0,0,0,0.9)] sm:max-h-[88dvh]"
      >
        <span aria-hidden="true" className="absolute left-1/2 top-2 z-30 h-1 w-10 -translate-x-1/2 rounded-full bg-white/30 sm:hidden" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar perfil"
          className="dv-focus absolute right-1.5 top-1.5 z-30 grid size-11 place-items-center rounded-full bg-black/35 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/60 hover:text-white"
        >
          <X className="size-4" />
        </button>
        {error ? (
          <p className="relative p-10 text-center text-sm text-white/60">Não foi possível carregar este perfil.</p>
        ) : !data ? (
          <div className="relative flex flex-col" aria-busy="true">
            <span className="h-36 animate-pulse bg-white/5" />
            <span className="-mt-12 ml-5 size-28 animate-pulse rounded-full bg-white/10" />
            <span className="mx-5 mt-4 h-6 w-2/3 animate-pulse rounded-sm bg-white/10" />
            <span className="mx-5 mb-8 mt-4 h-16 animate-pulse rounded-sm bg-white/5" />
          </div>
        ) : (
          <ProfileBody data={data} tier={tier} />
        )}
      </article>
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
  const visual = useVisual(data.id)
  const { mapa } = useCatalogo()
  const animar = useAnimarCosmeticos()
  const mini = visual?.mini ? (mapa.get(visual.mini) ?? null) : null
  const borda = visual?.borda ? (mapa.get(visual.borda) ?? null) : null
  const emb = visual?.emb ? (mapa.get(visual.emb) ?? null) : null
  const bal = visual?.bal ? (mapa.get(visual.bal) ?? null) : null
  const nomeDef = visual?.ef ? (mapa.get(visual.ef) ?? null) : null
  const bestName = data.bestGame ? (GAMES[data.bestGame.gameId as GameId]?.name ?? data.bestGame.gameId) : null
  const fundoBorda = borda?.imagem ? `${borda.imagem.base}-${borda.imagem.tamanhos.find((t) => t >= 512) ?? borda.imagem.tamanhos.at(-1)}.webp` : null
  const corBorda = borda?.borda?.cores[0] ?? tier.color
  const vitrine = [
    emb && { def: emb, rotulo: 'Emblema', arte: <Emblema def={emb} tamanho={34} animar={false} /> },
    mini && { def: mini, rotulo: 'Moldura', arte: <FotoMoldurada formato="mini" src={src} moldura={mini} largura={44} animar={false} /> },
    bal && {
      def: bal,
      rotulo: 'Balão',
      arte: (
        <BalaoChat def={bal} animar={false} className="px-2 py-0.5 font-body text-[12px] leading-tight">
          Aa
        </BalaoChat>
      ),
    },
    nomeDef?.nome && { def: nomeDef, rotulo: 'Nome', arte: <AmostraNome estilo={nomeDef.nome} texto="Aa" className="text-[22px] leading-none" /> },
    borda && { def: borda, rotulo: 'Borda', arte: <span className="relative block h-8 w-11 overflow-hidden"><BordaPerfilFundo borda={borda.borda} imagem={fundoBorda} animar={false} /></span> },
  ].filter(Boolean) as { def: CosmeticoDef; rotulo: string; arte: ReactNode }[]

  return (
    <div className="relative flex min-w-0 flex-col" style={{ boxShadow: `inset 0 0 0 1px ${corBorda}55` }}>
      {/* faixa do topo: borda do perfil equipada (ou o fundo padrão com a própria foto desfocada) */}
      <div className="relative h-36 w-full shrink-0 overflow-hidden sm:h-40">
        {borda ? (
          <BordaPerfilFundo borda={borda.borda} imagem={fundoBorda} animar={animar} />
        ) : (
          <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(160deg,#24222b,#121216_60%)]">
            {src && (
              // biome-ignore lint/performance/noImgElement: avatar privado servido pela API
              <img src={src} alt="" className="absolute inset-0 size-full scale-110 object-cover object-[50%_25%] opacity-25 blur-[3px]" />
            )}
            <span className="absolute inset-0 bg-[radial-gradient(80%_90%_at_80%_0%,rgba(138,124,200,0.22),transparent_70%)]" />
          </span>
        )}
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#141418] to-transparent" />
        <span
          className="absolute left-3 top-3 inline-flex items-center gap-1.5 border bg-black/45 px-1.5 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-[0.22em] backdrop-blur-sm"
          style={{ borderColor: `${tier.color}88`, color: tier.color }}
        >
          <span aria-hidden="true" className="size-1 rounded-full" style={{ background: tier.color, boxShadow: `0 0 6px ${tier.color}` }} />
          {ROLE_LABEL[data.role] ?? data.role}
        </span>
      </div>

      {/* avatar grande sobreposto à faixa + nome */}
      <div className="relative -mt-16 flex min-w-0 items-end gap-3 px-4">
        <FotoMoldurada formato="mini" src={src} moldura={mini} largura={124} alt={`Foto de ${data.name}`} className="relative shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col gap-1 pb-1">
          <p className="min-w-0 font-impact text-[1.65rem] font-semibold uppercase leading-[1.05] tracking-[0.02em] text-white">
            <NomeVisual nome={data.name} visual={visual} tamanhoEmblema={24} cor="#ffffff" />
          </p>
          <p className="font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-white/55">
            ID.Record <span className="font-mono tracking-[0.12em] text-white/80">{recordId(data.id)}</span>
          </p>
        </div>
      </div>

      {/* números: ranking, pontos, vitórias · deadly votes, borda de ranking, melhor jogo */}
      <dl className="mx-4 mt-4 grid grid-cols-3 border border-white/10 bg-white/[0.03]">
        <Cell label="Ranking">
          {data.week.rank ? (
            <span style={{ color: tier.color }}>
              #{String(data.week.rank).padStart(2, '0')}
              <span className="ml-1 text-xs text-white/40">/{data.week.total}</span>
            </span>
          ) : (
            <span className="text-white/40">—</span>
          )}
        </Cell>
        <Cell label="Pontos" className="border-l border-white/10" sub="na semana">
          <span className="text-white">{data.week.score.toLocaleString('pt-BR')}</span>
        </Cell>
        <Cell label="Vitórias" className="border-l border-white/10" sub={`${data.week.games} partidas`}>
          <span className="text-white">{String(data.week.wins).padStart(2, '0')}</span>
        </Cell>
        <Cell label="Deadly Votes" className="border-t border-white/10" sub={`S ${data.deadlyVotes.survived} · E ${data.deadlyVotes.eliminated}`}>
          <span className="text-[#c2b9ec]">{String(data.deadlyVotes.total).padStart(2, '0')}</span>
        </Cell>
        <Cell label="Borda" className="border-l border-t border-white/10" sub={tier.label.split(' · ')[1]}>
          <span className="text-base uppercase" style={{ color: tier.color }}>
            {tier.label.split(' · ')[0].replace('Borda ', '')}
          </span>
        </Cell>
        <Cell label="Melhor jogo" className="border-l border-t border-white/10" sub={bestName ? `${data.bestGame?.points} pts` : undefined}>
          <span className="truncate text-sm text-white/85">{bestName ?? '—'}</span>
        </Cell>
      </dl>

      {/* vitrine: o que a pessoa tem equipado (só o que já é público) */}
      <section aria-label="Vitrine de cosméticos" className="mx-4 mb-5 mt-4">
        <h3 className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-white/55">Vitrine</h3>
        {vitrine.length ? (
          <ul className="grid grid-cols-3 gap-2 min-[380px]:grid-cols-4">
            {vitrine.map((v) => {
              const r = RARIDADE_PADRAO[v.def.rarity]
              return (
                <li key={v.def.key} className="relative flex min-w-0 flex-col items-center gap-1.5 overflow-hidden border border-white/10 bg-black/30 px-1 pb-1.5 pt-2.5">
                  <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[2px]" style={{ background: r?.cor, boxShadow: `0 0 8px ${r?.brilho}` }} />
                  <span className="grid h-12 w-full place-items-center">{v.arte}</span>
                  <span className="w-full truncate text-center font-display text-[10px] font-semibold uppercase tracking-[0.04em] text-white/85">{v.def.name}</span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/40">{v.rotulo}</span>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="border border-dashed border-white/15 px-3 py-3 font-body text-[14px] text-white/45">Nada equipado ainda.</p>
        )}
      </section>
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
        background: profile.border === 'padrao' ? tier.color: `conic-gradient(from 210deg, ${tier.color}, var(--dv-ink) 30%, ${tier.color} 55%, var(--dv-ink) 80%, ${tier.color})`,
        boxShadow: `0 0 18px ${tier.glow}`,
      }}
    >
      <span className="relative grid size-full place-items-center overflow-hidden rounded-full border-2 border-dv-ink bg-dv-ink-2">
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
