'use client'

import { useEffect, useState, type ReactNode } from 'react'
import {
  Badge,
  Button,
  CardFrame,
  Chip,
  Countdown,
  Curtain,
  Dialog,
  Divider,
  Frame,
  GlyphAlert,
  GlyphArrow,
  GlyphCard,
  GlyphCheck,
  GlyphClip,
  GlyphClock,
  GlyphClose,
  GlyphDiamond,
  GlyphGavel,
  GlyphHourglass,
  GlyphKeyhole,
  GlyphSpark,
  IconButton,
  ImpactTitle,
  Kicker,
  Panel,
  Reveal,
  RewardStrip,
  SceneBackdrop,
  SectionHeader,
  Sheet,
  Spinner,
  Stagger,
  Stamp,
  Stat,
  StatGrid,
  Tabs,
  TimeDigits,
  Toast,
  useCurtain,
  type ScenePreset,
  type TicketData,
} from '@/components/devo/kit'
import { DeadlyVoteSymbol } from '@/components/devo/system/symbol'
import { HerdeiroArt } from '@/components/devo/npc-art/herdeiro'
import { MelissaArt } from '@/components/devo/npc-art/melissa'
import { OddsBar, PaperField, Plaque, PortraitFrame, StatusSeal } from '@/components/devo/kit'
import { InteriorSection } from './interior-section'

const COLORS: { group: string; items: { name: string; v: string; use: string }[] }[] = [
  {
    group: 'Noite (fundos)',
    items: [
      { name: '--dv-ink', v: '#05070d', use: 'fundo de tela' },
      { name: '--dv-ink-2', v: '#0a0f1c', use: 'superfície' },
      { name: '--dv-ink-3', v: '#111a2e', use: 'superfície alta' },
      { name: '--dv-ink-4', v: '#1a2440', use: 'realce' },
    ],
  },
  {
    group: 'Cobalto (sistema)',
    items: [
      { name: '--dv-cobalt', v: '#315dff', use: 'ação, foco' },
      { name: '--dv-cobalt-deep', v: '#1647ff', use: 'faixas, papel' },
      { name: '--dv-cobalt-dim', v: '#0b1a4d', use: 'fundo ativo' },
      { name: '--dv-cobalt-text', v: '#7d97ff', use: 'texto AA' },
    ],
  },
  {
    group: 'Ouro (ornamento)',
    items: [
      { name: '--dv-gold', v: '#c9a45c', use: 'filetes' },
      { name: '--dv-gold-bright', v: '#ecd49a', use: 'brilho' },
      { name: '--dv-gold-deep', v: '#7c5f2a', use: 'sombra' },
    ],
  },
  {
    group: 'Papel (documentos)',
    items: [
      { name: '--dv-paper', v: '#efe6d2', use: 'Record, tiras' },
      { name: '--dv-paper-2', v: '#e2d5b8', use: 'dobra' },
      { name: '--dv-paper-ink', v: '#1c1a22', use: 'texto no papel' },
    ],
  },
  {
    group: 'Sangue (só perigo)',
    items: [
      { name: '--dv-blood', v: '#d51f2b', use: 'alerta' },
      { name: '--dv-blood-deep', v: '#5a0a10', use: 'fundo alerta' },
      { name: '--dv-blood-text', v: '#ff5a63', use: 'texto AA' },
    ],
  },
]

const TICKETS: TicketData[] = [
  { index: 1, reward: <GlyphHourglass />, amount: '+1h', caption: 'Tempo', state: 'claimed' },
  { index: 2, reward: <GlyphCard />, amount: '×1', caption: 'Carta', state: 'claimed' },
  { index: 3, reward: <GlyphHourglass />, amount: '+2h', caption: 'Tempo', state: 'today' },
  { index: 4, reward: <GlyphSpark />, amount: '×3', caption: 'Fichas', state: 'upcoming' },
  { index: 5, reward: <GlyphCard />, amount: '×1', caption: 'Rara', state: 'locked' },
  { index: 6, reward: <GlyphHourglass />, amount: '+1h', caption: 'Tempo', state: 'missed' },
]

const PRESETS: { id: ScenePreset; name: string; where: string }[] = [
  { id: 'sigil', name: 'sigil', where: 'Landing, acesso' },
  { id: 'cathedral', name: 'cathedral', where: 'Sistema (home)' },
  { id: 'table', name: 'table', where: 'Sala de Jogos' },
  { id: 'corridor', name: 'corridor', where: 'Sala de Trocas' },
  { id: 'tribunal', name: 'tribunal', where: 'Deadly Vote / Record' },
]

function Section({ id, index, kicker, title, children }: { id: string; index: string; kicker: string; title: string; children: ReactNode }) {
  return (
    <section id={id} data-estilo={id} className="scroll-mt-4 border-t border-dv-line px-4 py-10">
      <SectionHeader index={index} kicker={kicker} title={title} className="mb-6" />
      {children}
    </section>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-5">
      <p className="dv-label mb-2 text-[10px] text-dv-text-3">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

export function StyleGuide() {
  // Só no cliente: relógios e cenas dependem de Date.now()/WebGL (evita divergência de hidratação).
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  if (!ready) return <main className="dv-ink-bg min-h-dvh" />
  return <StyleGuideBody />
}

function StyleGuideBody() {
  const [tab, setTab] = useState<'mesa' | 'agenda' | 'ranking' | 'apostas'>('mesa')
  const [chips, setChips] = useState<string[]>(['rara'])
  const [sheet, setSheet] = useState(false)
  const [dialog, setDialog] = useState(false)
  const [alert, setAlert] = useState(false)
  const [tickets, setTickets] = useState(TICKETS)
  const { curtain, run } = useCurtain()
  const [endsAt] = useState(() => Date.now() + 51 * 3600_000 + 16 * 60_000)
  const [critEndsAt] = useState(() => Date.now() + 42 * 60_000 + 9_000)

  return (
    <main className="dv-ink-bg min-h-dvh text-dv-text">
      {/* Abertura */}
      <header className="relative h-[520px] overflow-hidden">
        <SceneBackdrop preset="sigil" intensity={0.85} focus={{ x: 0.5, y: 0.36, size: 0.82 }} dim={0.1} />
        <div className="dv-safe-top relative z-10 flex h-full flex-col justify-end px-5 pb-8">
          <Kicker>Guia vivo · docs/redesign/IDENTIDADE.md</Kicker>
          <ImpactTitle className="mt-3" sub="Identidade visual comum do DEVO">
            Tribunal do Relógio
          </ImpactTitle>
          <p className="mt-4 max-w-md font-body text-[15px] leading-relaxed text-dv-text-2">
            Um jogo mortal elegante. O tempo é a moeda e o juiz. Cobalto é o sistema, ouro é o ornamento, papel é o documento, vermelho é o perigo.
          </p>
        </div>
      </header>

      <Section id="cores" index="I" kicker="Tokens" title="Cores">
        <div className="grid gap-6">
          {COLORS.map((g) => (
            <div key={g.group}>
              <p className="dv-label mb-2 text-[10px] text-dv-gold">{g.group}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {g.items.map((c) => (
                  <div key={c.name} className="border border-dv-line bg-dv-ink-2">
                    <div className="h-12" style={{ background: c.v }} />
                    <div className="p-2">
                      <p className="font-mono text-[11px] text-dv-text">{c.name}</p>
                      <p className="font-mono text-[10px] text-dv-text-3">
                        {c.v} · {c.use}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="tipografia" index="II" kicker="Escala" title="Tipografia">
        <div className="space-y-5">
          <div>
            <p className="dv-label text-[10px] text-dv-text-3">Impacto · Oswald 600 · 56/64px · números e títulos curtos</p>
            <p className="font-impact text-[56px] font-semibold uppercase leading-none">Eliminado</p>
          </div>
          <div>
            <p className="dv-label text-[10px] text-dv-text-3">Display · Cinzel 600 · 26px · títulos de seção</p>
            <p className="font-display text-[26px] font-semibold uppercase tracking-[0.06em]">Sala de Jogos</p>
          </div>
          <div>
            <p className="dv-label text-[10px] text-dv-text-3">Serif · Cormorant 500 · 62px · marca</p>
            <p className="font-serif text-[62px] font-medium uppercase leading-[0.85]">Deadly Vote</p>
          </div>
          <div>
            <p className="dv-label text-[10px] text-dv-text-3">Corpo · EB Garamond 400 · 15–16px</p>
            <p className="font-body text-[16px] leading-relaxed text-dv-text-2">
              O Anfitrião aguarda sua resposta. Cada hora que passa é uma hora a menos no seu pulso.
            </p>
          </div>
          <div>
            <p className="dv-label text-[10px] text-dv-text-3">Mono · IBM Plex Mono · 11px caixa-alta (rótulos)</p>
            <p className="dv-label text-dv-cobalt-text">ID.RECORD · DV-B885-N · ADMIN</p>
          </div>
          <div className="flex flex-wrap items-end gap-6">
            <TimeDigits value="51:16:50" size="xl" tone="text" label="Exemplo" />
            <TimeDigits value="3d 22h" size="md" tone="gold" label="Exemplo" />
          </div>
        </div>
      </Section>

      <Section id="botoes" index="III" kicker="Ação" title="Botões">
        <Row label="Primary · sm / md / lg">
          <Button size="sm">Jogar</Button>
          <Button>Inscrever-se</Button>
          <Button size="lg">Começar</Button>
        </Row>
        <Row label="Secondary · Ghost · Danger">
          <Button variant="secondary">Continuar</Button>
          <Button variant="ghost">Voltar</Button>
          <Button variant="danger">Eliminar</Button>
        </Row>
        <Row label="Desabilitado · Carregando">
          <Button disabled>Em breve</Button>
          <Button variant="secondary" disabled>
            Bloqueado
          </Button>
          <Button loading>Enviando</Button>
          <Button variant="danger" loading>
            Votando
          </Button>
        </Row>
        <Row label="Com ícone · bloco">
          <Button variant="primary" iconRight={<GlyphArrow />}>
            Avançar
          </Button>
          <Button variant="secondary" icon={<GlyphClock />}>
            Agenda
          </Button>
        </Row>
        <Row label="IconButton · 44px mínimo">
          <IconButton label="Fechar">
            <GlyphClose />
          </IconButton>
          <IconButton label="Avisos" variant="primary" badge={3}>
            <GlyphDiamond />
          </IconButton>
          <IconButton label="Alerta" variant="danger">
            <GlyphAlert />
          </IconButton>
          <IconButton label="Fantasma" variant="ghost">
            <GlyphKeyhole />
          </IconButton>
          <IconButton label="Carregando" loading>
            <GlyphClock />
          </IconButton>
          <IconButton label="Desabilitado" disabled>
            <GlyphCard />
          </IconButton>
        </Row>
      </Section>

      <Section id="molduras" index="IV" kicker="Superfícies" title="Molduras">
        <div className="grid gap-5">
          <Panel kicker="Frame ink · ornate" title="Próxima partida" ornate tone="gold" pad="lg">
            <p className="font-body text-[15px] text-dv-text-2">Painel-foco da tela. Cantos de filigrana só em 1–2 blocos por tela.</p>
          </Panel>
          <Frame variant="ink" tone="cobalt" glow pad="lg">
            <Kicker tone="cobalt">Frame ink · cobalto · glow</Kicker>
            <p className="mt-2 font-body text-[15px] text-dv-text-2">Estado selecionado ou sistema ativo.</p>
          </Frame>
          <Frame variant="paper" pad="lg" cut="diag">
            <Kicker tone="paper">Frame paper · corte diagonal</Kicker>
            <p className="mt-2 font-body text-[15px]">Documento do Record, bilhetes, verso de regras.</p>
            <Stamp text="Aprovado" tone="cobalt" className="absolute -right-2 -top-4" size={110} />
          </Frame>
          <Frame variant="alert" pad="lg">
            <Kicker tone="blood">Frame alert</Kicker>
            <p className="mt-2 font-body text-[15px] text-dv-text-2">Tempo crítico. Só para perigo real.</p>
          </Frame>
          <Frame variant="glass" tone="neutral" pad="md">
            <Kicker tone="muted">Frame glass</Kicker>
            <p className="mt-2 font-body text-[15px] text-dv-text-2">Sobre cena 3D.</p>
          </Frame>
          <div className="grid gap-4">
            <Divider />
            <Divider variant="filigree" />
            <Divider variant="clock" />
            <Divider variant="stitch" tone="muted" />
          </div>
        </div>
      </Section>

      <Section id="selos" index="V" kicker="Estado" title="Selos e números">
        <Row label="Badge">
          <Badge tone="cobalt" live>
            Ao vivo
          </Badge>
          <Badge tone="gold">Lendária</Badge>
          <Badge tone="paper">Record</Badge>
          <Badge tone="blood" dot>
            Crítico
          </Badge>
          <Badge>Em breve</Badge>
        </Row>
        <Row label="Chip (filtro)">
          {['comum', 'rara', 'lendaria'].map((c) => (
            <Chip key={c} selected={chips.includes(c)} onClick={() => setChips((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]))}>
              {c === 'lendaria' ? 'Lendária' : c[0].toUpperCase() + c.slice(1)}
            </Chip>
          ))}
          <Chip disabled>Vazio</Chip>
        </Row>
        <StatGrid className="mt-6">
          <Stat label="Cartas" value="9" tone="gold" icon={<GlyphCard />} />
          <Stat label="Score" value="1.240" tone="cobalt" />
          <Stat label="Posição" value="#4" hint="Top 10" />
        </StatGrid>
        <div className="mt-8 grid gap-6">
          <div>
            <p className="dv-label mb-2 text-[10px] text-dv-text-3">Countdown · normal</p>
            <Countdown endsAt={endsAt} size="lg" units />
          </div>
          <div>
            <p className="dv-label mb-2 text-[10px] text-dv-text-3">TimeDigits · units (D:H:M:S, Record)</p>
            <FastClock />
          </div>
          <div>
            <p className="dv-label mb-2 text-[10px] text-dv-text-3">Countdown · crítico (&lt; 6h)</p>
            <Countdown endsAt={critEndsAt} size="lg" units sound={false} />
          </div>
        </div>
        <Row label="Spinner">
          <Spinner className="size-8 text-dv-cobalt-text" label="Carregando" />
          <Spinner className="size-6 text-dv-gold" />
        </Row>
        <Row label="Glifos">
          {[GlyphSpark, GlyphDiamond, GlyphClock, GlyphHourglass, GlyphKeyhole, GlyphCard, GlyphGavel, GlyphClip, GlyphCheck, GlyphAlert, GlyphClose, GlyphArrow].map((G, i) => (
            <span key={i} className="grid size-11 place-items-center border border-dv-line text-dv-gold">
              <G className="size-5" />
            </span>
          ))}
          <DeadlyVoteSymbol className="size-11 text-dv-cobalt-text" />
        </Row>
      </Section>

      <Section id="navegacao" index="VI" kicker="Navegação" title="Abas e folhas">
        <Tabs
          label="Sala de Jogos"
          value={tab}
          onValueChange={setTab}
          items={[
            { value: 'mesa', label: 'Mesa' },
            { value: 'agenda', label: 'Agenda', count: 2 },
            { value: 'ranking', label: 'Ranking' },
            { value: 'apostas', label: 'Apostas' },
          ]}
          panelClassName="pt-4"
        >
          <Reveal key={tab} variant="cut">
            <p className="font-body text-[15px] text-dv-text-2">Conteúdo da aba “{tab}”. Indicador desliza com corte diagonal.</p>
          </Reveal>
        </Tabs>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setSheet(true)}>
            Abrir folha
          </Button>
          <Button variant="ghost" onClick={() => setDialog(true)}>
            Abrir diálogo
          </Button>
        </div>
        <Sheet
          open={sheet}
          onClose={() => setSheet(false)}
          kicker="Carta · Rara"
          title="Ampulheta"
          description="Folha que sobe do rodapé no celular e vira diálogo no desktop."
          footer={
            <>
              <Button block onClick={() => setSheet(false)}>
                Usar carta
              </Button>
              <Button block variant="ghost" onClick={() => setSheet(false)}>
                Agora não
              </Button>
            </>
          }
        >
          <div className="flex justify-center py-2">
            <CardFrame title="Ampulheta" index="VII" tone="gold" holo>
              <span className="grid size-full place-items-center text-dv-gold">
                <GlyphHourglass className="size-14" />
              </span>
            </CardFrame>
          </div>
        </Sheet>
        <Dialog open={dialog} onClose={() => setDialog(false)} tone="alert" kicker="Confirmação" title="Reiniciar sessão?" description="Isso apaga o inventário." footer={<Button variant="danger" block onClick={() => setDialog(false)}>Reiniciar</Button>} />
      </Section>

      <Section id="avisos" index="VII" kicker="Feedback" title="Avisos e carimbos">
        <div className="grid gap-3">
          <Toast source="Sistema" title="Nova carta no inventário" body="Ampulheta · Rara" time="01:04" />
          <Toast tone="gold" source="Conquista" title="Primeira vitória" body="+2h no pulso" time="01:05" onClose={() => {}} />
          <Toast tone="alert" source="Pulso" title="Tempo crítico" body="Menos de 6 horas restantes." time="01:06" />
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-6">
          <Stamp text="Eliminado" tone="blood" />
          <Stamp text="Voto" shape="round" tone="blood" size={110} />
          <Stamp text="Arquivo" shape="round" tone="gold" rotate={10} size={100} />
        </div>
      </Section>

      <Section id="cartas" index="VIII" kicker="Itens" title="Cartas e tiras">
        <Stagger className="flex flex-wrap gap-3" variant="rise">
          <CardFrame title="Fósforo" index="01" tone="neutral">
            <span className="grid size-full place-items-center text-dv-text-2">
              <GlyphSpark className="size-10" />
            </span>
          </CardFrame>
          <CardFrame title="Coroa" index="09" tone="gold" holo>
            <span className="grid size-full place-items-center text-dv-gold">
              <GlyphDiamond className="size-10" />
            </span>
          </CardFrame>
          <CardFrame face="back" tone="gold" label="Verso" />
          <CardFrame size="sm" title="Olho" index="03" tone="cobalt" selected onClick={() => {}}>
            <span className="grid size-full place-items-center text-dv-cobalt-text">
              <GlyphKeyhole className="size-7" />
            </span>
          </CardFrame>
          <CardFrame size="sm" title="Lâminas" index="06" tone="blood">
            <span className="grid size-full place-items-center text-dv-blood-text">
              <GlyphAlert className="size-7" />
            </span>
          </CardFrame>
        </Stagger>
        <p className="dv-label mb-3 mt-8 text-[10px] text-dv-text-3">RewardStrip · check-in diário (futuro)</p>
        <RewardStrip
          label="Check-in diário"
          items={tickets}
          onClaim={(i) => setTickets((t) => t.map((x) => (x.index === i ? { ...x, state: 'claimed' } : x.index === i + 1 ? { ...x, state: 'today' } : x)))}
        />
      </Section>

      <Section id="movimento" index="IX" kicker="Movimento" title="Entradas e cortina">
        <Stagger className="grid gap-2" variant="left" inView>
          {['Corte diagonal entra primeiro', 'Conteúdo sobe em cascata', 'Atraso de 60ms por item', 'Máximo 8 degraus'].map((t) => (
            <Frame key={t} pad="sm" cut="diag">
              <p className="font-body text-[15px]">{t}</p>
            </Frame>
          ))}
        </Stagger>
        <p className="dv-label mb-2 mt-8 text-[10px] text-dv-text-3">Cortina congelada · 260ms · 900ms · 1450ms</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { at: 260, label: 'Despertando', tone: 'system' as const, direction: 'forward' as const },
            { at: 900, label: 'Despertando', tone: 'system' as const, direction: 'forward' as const },
            { at: 1450, label: 'Despertando', tone: 'system' as const, direction: 'forward' as const },
          ].map((f) => (
            <div key={f.at} className="relative h-[240px] overflow-hidden border border-dv-line bg-dv-ink-2">
              <div className="absolute inset-0 origin-top-left scale-[0.3] [height:333.4%] [width:333.4%]">
                <Curtain state={{ ...f, seq: f.at }} freezeAt={f.at} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {[
            { at: 900, label: 'Saindo', tone: 'system' as const, direction: 'back' as const },
            { at: 900, label: 'Deadly Vote', tone: 'alert' as const, direction: 'forward' as const },
          ].map((f) => (
            <div key={f.label} className="relative h-[300px] overflow-hidden border border-dv-line bg-dv-ink-2">
              <div className="absolute inset-0 origin-top-left scale-[0.5] [height:200%] [width:200%]">
                <Curtain state={{ ...f, seq: 1 }} freezeAt={f.at} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => run('Despertando', () => {})}>Cortina · avançar</Button>
          <Button variant="secondary" onClick={() => run('Saindo', () => {}, { direction: 'back' })}>
            Cortina · voltar
          </Button>
          <Button variant="danger" onClick={() => run('Deadly Vote', () => {}, { tone: 'alert' })}>
            Cortina · alerta
          </Button>
        </div>
      </Section>

      <InteriorSection run={run} />

      <Section id="retratos" index="X" kicker="Elenco" title="Retratos">
        <p className="mb-4 font-body text-[15px] text-dv-text-2">Mesmo tratamento para raster e SVG: luz de borda na silhueta, grão, vinheta e base que se dissolve.</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
          <PortraitFrame src="/images/npc/rat-host-v2.png" alt="O Rato, anfitrião" name="O Rato" role="Anfitrião" tone="gold" ornate className="w-full" />
          <PortraitFrame alt="Herdeiro" name="Herdeiro" role="Desconhecido" tone="cobalt" className="w-full">
            <HerdeiroArt />
          </PortraitFrame>
          <PortraitFrame alt="Melissa" name="Melissa" role="Prólogo" tone="blood" shape="rect" className="w-full">
            <MelissaArt />
          </PortraitFrame>
          <PortraitFrame src="/images/npc/coruja.png" alt="A Coruja" name="Coruja" role="Mestra das cartas" tone="neutral" shape="round" className="w-full" />
        </div>
        <p className="dv-label mb-3 mt-8 text-[10px] text-dv-text-3">Plaque · OddsBar (da Sala de Jogos)</p>
        <dl className="grid grid-cols-3 gap-2">
          <Plaque label="Tempo" tone="cobalt">2d 3h</Plaque>
          <Plaque label="Pontos" tone="gold">1.240</Plaque>
          <Plaque label="Posição">#4</Plaque>
        </dl>
        <div className="mt-4">
          <OddsBar a={62} b={38} />
        </div>
        <p className="dv-label mb-3 mt-8 text-[10px] text-dv-text-3">StatusSeal · PaperField (do Record)</p>
        <Frame variant="paper" pad="md">
          <div className="flex flex-wrap gap-2">
            <StatusSeal tone="active">Ativo</StatusSeal>
            <StatusSeal tone="critical">Crítico</StatusSeal>
            <StatusSeal tone="idle">Inativo</StatusSeal>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-4">
            <PaperField label="Participantes" value="12 / 16" />
            <PaperField label="Seu registro" value="Eliminado" danger />
          </dl>
        </Frame>
      </Section>

      <Section id="cenas" index="XI" kicker="3D" title="Cenas">
        <div className="mb-4 flex items-center gap-3">
          <Chip selected={alert} onClick={() => setAlert((a) => !a)} icon={<GlyphAlert />}>
            Modo alerta
          </Chip>
        </div>
        <div className="grid gap-4">
          {PRESETS.map((p) => (
            <figure key={p.id} data-estilo-preset={p.id} className="relative h-[300px] overflow-hidden border border-dv-line">
              <SceneBackdrop preset={p.id} alert={alert} lazy dim={0.05} />
              <figcaption className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between bg-gradient-to-t from-dv-ink/90 to-transparent p-3">
                <span className="font-impact text-[24px] font-semibold uppercase">{p.name}</span>
                <span className="dv-label text-[10px] text-dv-text-2">{p.where}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <footer className="dv-safe-bottom border-t border-dv-line px-4 py-8 text-center">
        <Divider variant="filigree" className="mb-3" />
        <p className="dv-label text-[10px] text-dv-text-3">DEVO · Record System · Tribunal do Relógio</p>
      </footer>
      <Curtain state={curtain} />
    </main>
  )
}

/** Relógio acelerado (dígitos virando várias vezes por segundo) para provar a máscara da virada. */
function FastClock() {
  const [n, setN] = useState(2 * 86400 + 3 * 3600 + 16 * 60 + 37)
  useEffect(() => {
    const id = window.setInterval(() => setN((v) => v - 7), 350)
    return () => window.clearInterval(id)
  }, [])
  const d = Math.floor(n / 86400)
  const h = Math.floor((n % 86400) / 3600)
  const m = Math.floor((n % 3600) / 60)
  const sec = n % 60
  const v = [d, h, m, sec].map((x) => String(x).padStart(2, '0')).join(':')
  return <TimeDigits value={v} size="lg" tone="cobalt" units={['Dias', 'Horas', 'Min', 'Seg']} label="Tempo de vida" />
}
