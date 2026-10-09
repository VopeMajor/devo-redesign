'use client'

/**
 * Peças de demonstração do interior compartilhadas pela vitrine (/estilo) e pela tela-modelo
 * (/estilo/perfil). Montadas SÓ com componentes do kit — copie o padrão nas áreas.
 */
import { useState } from 'react'
import {
  Badge,
  BottomNav,
  Button,
  CobaltTabs,
  DuotoneArt,
  FUTURE_SYSTEMS,
  GradeBar,
  HudCode,
  HudRule,
  IconAvisos,
  IconCartas,
  IconJogos,
  IconRecord,
  IconTorre,
  IconVotes,
  LockedFeature,
  PanelLink,
  RecordPanel,
  RecordTitle,
  Stat,
  StatGrid,
  TimeDigits,
  TimelineList,
  type BottomNavItem,
  type TimelineItem,
} from '@/components/devo/kit'

export const VOTES: TimelineItem[] = [
  { id: 'a', date: '18.05', title: 'Shibuya Arc', status: 'Em progresso', tone: 'live', onClick: () => {} },
  { id: 'b', date: '24.05', title: 'Kyoto Arc', status: 'Convocado', tone: 'next', onClick: () => {} },
  { id: 'c', date: '11.05', title: 'Tokyo Bay Arc', status: 'Falha do sistema', tone: 'fail' },
  { id: 'd', date: '03.05', title: 'Ikebukuro Arc', status: 'Concluído', tone: 'done' },
  { id: 'e', date: '28.04', title: 'Kansai Arc', status: 'Cancelado', tone: 'cancel' },
]

export const VIRTUES = [
  { label: 'Persuasão', grade: 'SS' },
  { label: 'Intuição', grade: 'A+' },
  { label: 'Determinação', grade: 'S' },
  { label: 'Raciocínio', grade: 'A' },
  { label: 'Presença', grade: 'A-' },
  { label: 'Empatia', grade: 'B+' },
]

const CARDS = [
  { src: '/images/cards/ataque.png', name: 'Ataque', n: 12 },
  { src: '/images/cards/tempo.png', name: 'Tempo', n: 7 },
  { src: '/images/cards/trapaca.png', name: 'Trapaça', n: 3 },
  { src: '/images/cards/defesa.png', name: 'Defesa', n: 1 },
]

/** Navegação proposta do celular (IDENTIDADE.md › Interior › Mapa). */
export type Hub = 'record' | 'cartas' | 'jogos' | 'votes' | 'avisos'
export const HUBS: BottomNavItem<Hub>[] = [
  { value: 'record', label: 'Record', icon: <IconRecord /> },
  { value: 'cartas', label: 'Cartas', icon: <IconCartas /> },
  { value: 'jogos', label: 'Jogos', icon: <IconJogos /> },
  { value: 'votes', label: 'Votes', icon: <IconVotes />, badge: 1 },
  { value: 'avisos', label: 'Avisos', icon: <IconAvisos />, badge: true },
]

export function RecordFilePanel() {
  return (
    <RecordPanel title="Record File" jp="レコード・ファイル" action={{ label: 'Ver perfil', onClick: () => {} }} chamfer>
      <div className="grid grid-cols-[42%_1fr] gap-4">
        <DuotoneArt src="/images/npc/shade.png" alt="Retrato do participante em tinta azul" position="50% 12%" className="aspect-[3/4] [clip-path:polygon(0_0,100%_0,100%_100%,14%_100%,0_88%)]" />
        <dl className="flex min-w-0 flex-col gap-3">
          <div>
            <dt className="sr-only">Nome</dt>
            <dd className="font-serif text-[28px] font-light uppercase leading-none tracking-[0.02em] text-in-fg">Aurora</dd>
            <dd className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-in-fg-3">ID.Record: DV-7X19-A</dd>
          </div>
          <div>
            <dt className="font-sans text-[10px] font-medium uppercase tracking-[0.16em] text-in-fg-3">Status atual</dt>
            <dd className="mt-1 font-mono text-[15px] uppercase tracking-[0.12em] text-in-accent">Ativo</dd>
          </div>
          <div>
            <dt className="font-sans text-[10px] font-medium uppercase tracking-[0.16em] text-in-fg-3">Arcano</dt>
            <dd className="mt-1 font-mono text-[15px] uppercase tracking-[0.12em] text-in-fg">O Voto</dd>
          </div>
          <div>
            <dt className="font-sans text-[10px] font-medium uppercase tracking-[0.16em] text-in-fg-3">Shuffler</dt>
            <dd className="mt-1 font-mono text-[15px] uppercase tracking-[0.12em] text-in-accent">Desperto</dd>
          </div>
        </dl>
      </div>
      <div className="mt-4 border-t border-in-line pt-3">
        <p className="font-sans text-[10px] font-medium uppercase tracking-[0.16em] text-in-fg-3">Tempo de vida</p>
        <TimeDigits value="03:17:42:09" size="md" tone="cobalt" units={['D', 'H', 'M', 'S']} label="Tempo de vida" className="mt-1.5" />
      </div>
    </RecordPanel>
  )
}

export function ArcanoPanel() {
  return (
    <RecordPanel title="Arcano" variant="cobalt" headerRight={<Badge tone="cobalt">Rank S</Badge>}>
      <p className="font-serif text-[30px] font-light uppercase leading-none tracking-[0.04em] text-in-fg">O Voto</p>
      <div className="mt-4 flex items-center justify-between">
        <RecordTitle title="Virtudes" size="sm" as="h3" className="[&>span:first-child]:text-in-accent" />
        <HudCode code="ATB_06" tone="muted" />
      </div>
      <div className="mt-3 flex flex-col gap-3.5">
        {VIRTUES.map((v) => (
          <GradeBar key={v.label} label={v.label} grade={v.grade} />
        ))}
      </div>
      <Button theme="interior" variant="secondary" size="sm" block className="mt-4">
        Detalhes das virtudes
      </Button>
    </RecordPanel>
  )
}

export function CartasPanel() {
  return (
    <RecordPanel title="Cartas DEVO" jp="デボカード" variant="paper" action={{ label: 'Ver todas', onClick: () => {} }}>
      <ul aria-label="Cartas DEVO" className="grid grid-cols-5 gap-2">
        {CARDS.map((c, i) => (
          <li key={c.name} className="flex flex-col items-center">
            <DuotoneArt
              src={c.src}
              alt={`Carta ${c.name}`}
              contrast={1.15}
              className={i === 0 ? 'aspect-[5/7] w-full shadow-[0_0_0_2px_var(--in-accent-fill),0_0_16px_rgba(22,71,255,0.6)]' : 'aspect-[5/7] w-full shadow-[0_0_0_1px_var(--in-line-strong)]'}
            />
            <p className="mt-1.5 font-serif text-[18px] font-light leading-none text-in-fg tabular-nums">
              {String(c.n).padStart(2, '0')}
              <span className="ml-0.5 font-mono text-[10px] text-in-fg-3">/20</span>
            </p>
          </li>
        ))}
        <li>
          <button type="button" className="dv-focus flex aspect-[5/7] w-full flex-col items-center justify-center gap-1 text-in-fg-2 shadow-[inset_0_0_0_1px_var(--in-line-strong)] transition-colors hover:text-in-accent">
            <span aria-hidden="true" className="text-[24px] font-light leading-none">+</span>
            <span className="text-center font-sans text-[8px] font-medium uppercase leading-tight tracking-[0.1em]">Adquirir carta</span>
          </button>
        </li>
      </ul>
    </RecordPanel>
  )
}

export function VotesPanel() {
  return (
    <RecordPanel title="Deadly Votes" jp="デッドリー・ボート履歴" action={{ label: 'Histórico', onClick: () => {} }}>
      <TimelineList label="Deadly Votes" items={VOTES} />
    </RecordPanel>
  )
}

export function CompendioPanel() {
  return (
    <RecordPanel title="Compêndio" jp="コンペンディオ" variant="paper" action={{ label: 'Ver mais', onClick: () => {} }}>
      <StatGrid cols={2}>
        <Stat theme="interior" label="Total de records" value="7.612" size="md" hint="+23 nesta semana" />
        <Stat theme="interior" label="Sobrevivência" value="17,3" unit="%" size="md" tone="cobalt" />
      </StatGrid>
    </RecordPanel>
  )
}

export function ReservedPanel() {
  return (
    <RecordPanel title="Sistemas reservados" jp="予約" variant="paper">
      <div className="grid grid-cols-2 gap-2.5">
        {FUTURE_SYSTEMS.map((f) => (
          <LockedFeature key={f.id} name={f.name} hint={f.hint} icon={f.icon} />
        ))}
      </div>
    </RecordPanel>
  )
}

/** Cabeçalho do interior: marca em serifada fina + subtítulo cobalto + códigos de HUD. */
export function InteriorHeader() {
  return (
    <header className="px-5 pb-4 pt-[max(env(safe-area-inset-top),14px)]">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-in-fg">
          DEVO<span className="text-in-accent">.SYSTEM</span>
        </p>
        <HudCode code="DV_R084_0518" sub="DV_MS_2024_0518" barcode />
      </div>
      <h1 className="mt-5 font-serif text-[46px] font-light uppercase leading-[0.9] tracking-[0.01em] text-in-fg">Deadly Vote</h1>
      <p className="mt-2 font-sans text-[15px] font-normal uppercase tracking-[0.48em] text-in-accent">Record System</p>
      <HudRule label="Sistema de registro" code="0518" className="mt-3" />
    </header>
  )
}

/** Tela-modelo do Perfil (390×844). */
export function PerfilModelo() {
  const [tab, setTab] = useState<'file' | 'arcano' | 'cartas' | 'votes'>('file')
  const [hub, setHub] = useState<Hub>('record')
  return (
    <>
      <InteriorHeader />
      <div className="px-4">
        <CobaltTabs
          label="Seções do Record"
          value={tab}
          onValueChange={setTab}
          items={[
            { value: 'file', label: 'Record File' },
            { value: 'arcano', label: 'Arcano' },
            { value: 'cartas', label: 'Cartas' },
            { value: 'votes', label: 'Votes', count: 1 },
          ]}
        />
      </div>
      <div className="flex flex-col gap-4 px-4 pb-28 pt-4">
        <RecordFilePanel />
        <ArcanoPanel />
        <CartasPanel />
        <VotesPanel />
        <CompendioPanel />
        <ReservedPanel />
        <div className="flex items-center justify-between pt-1">
          <HudCode code="DEVO // Deadly Vote Record System" tone="muted" />
          <PanelLink label="Ajustes" onClick={() => {}} />
        </div>
      </div>
      <BottomNav items={HUBS} value={hub} onChange={setHub} />
    </>
  )
}

/** Variante da barra com um sistema futuro bloqueado no lugar de um hub (para a vitrine). */
export const HUBS_WITH_LOCKED: BottomNavItem<string>[] = [
  { value: 'record', label: 'Record', icon: <IconRecord /> },
  { value: 'cartas', label: 'Cartas', icon: <IconCartas /> },
  { value: 'torres', label: 'Torres', icon: <IconTorre />, locked: true },
  { value: 'votes', label: 'Votes', icon: <IconVotes /> },
  { value: 'avisos', label: 'Avisos', icon: <IconAvisos />, badge: 12 },
]
