'use client'

import { useState } from 'react'
import {
  BottomNav,
  Button,
  Chip,
  CobaltTabs,
  Curtain,
  DuotoneArt,
  FUTURE_SYSTEMS,
  HudCode,
  HudRule,
  Barcode,
  LockedFeature,
  PaperSheet,
  RecordPanel,
  RecordTitle,
  Stat,
  StatGrid,
  type CurtainOptions,
} from '@/components/devo/kit'
import { ArcanoPanel, CartasPanel, HUBS, HUBS_WITH_LOCKED, InteriorHeader, RecordFilePanel, VotesPanel, type Hub } from './interior-models'

const SWATCHES = [
  { name: 'papel', v: '#e8e6e2', use: 'fundo' },
  { name: 'papel-2', v: '#d9d6d0', use: 'faixas' },
  { name: 'painel', v: '#0a090d', use: 'painéis' },
  { name: 'painel-2', v: '#15131b', use: 'elevado' },
  { name: 'cobalto', v: '#34409e', use: 'tinta / blocos' },
  { name: 'cobalto·escuro', v: '#8f9cf0', use: 'texto no painel' },
  { name: 'alerta', v: '#a3121f', use: 'só alerta' },
  { name: 'ouro', v: '#6a5530', use: 'só lendária' },
]

function Label({ children }: { children: string }) {
  return <p className="mb-2.5 mt-8 font-mono text-[10px] uppercase tracking-[0.18em] text-in-fg-3">{children}</p>
}

/** Seção "Interior" da vitrine (estética do Record). Tudo dentro de PaperSheet (.dv-interior). */
export function InteriorSection({ run }: { run: (label: string, action: () => void, opts?: CurtainOptions) => boolean }) {
  const [tab, setTab] = useState<'file' | 'arcano' | 'virtudes' | 'cartas' | 'votes'>('file')
  const [chips, setChips] = useState(['rara'])
  const [hub, setHub] = useState<Hub>('record')
  const [hub2, setHub2] = useState('record')
  return (
    <section id="interior" data-estilo="interior" aria-label="Interior" className="border-t border-dv-line">
      <PaperSheet code="DV_R084_0518" sub="DV_ST_2024_INT">
        <InteriorHeader />
        <div className="px-4 pb-10">
          <p className="font-sans text-[14px] leading-relaxed text-in-fg-2">
            Interior do DEVO: papel frio com retícula, tinta cobalto, painéis pretos e linhas de HUD. Vermelho só alerta, ouro só raridade lendária. Escopo{' '}
            <code className="font-mono text-[12px] text-in-accent">.dv-interior</code>.
          </p>

          <Label>Tokens do interior</Label>
          <div className="grid grid-cols-4 gap-1.5">
            {SWATCHES.map((c) => (
              <div key={c.name} className="shadow-[inset_0_0_0_1px_var(--in-line)]">
                <div className="h-10" style={{ background: c.v }} />
                <p className="px-1.5 pt-1 font-mono text-[9px] uppercase tracking-[0.06em] text-in-fg">{c.name}</p>
                <p className="px-1.5 pb-1.5 font-mono text-[8px] uppercase tracking-[0.06em] text-in-fg-3">{c.use}</p>
              </div>
            ))}
          </div>

          <Label>Tipografia</Label>
          <RecordTitle title="Record File" jp="レコード・ファイル" size="lg" />
          <p className="mt-3 font-mono text-[22px] tabular-nums tracking-[0.06em] text-in-fg">03:17:42:09</p>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-in-fg-2">ID.Record: DV-7X19-A</p>
          <p className="mt-2 font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-in-fg-3">Rótulo · sans caixa-alta espaçada</p>

          <Label>HUD · réguas, códigos, barras</Label>
          <HudRule label="Arquivo do Record" code="0518" />
          <div className="mt-3 flex flex-wrap items-center gap-5">
            <HudCode code="DV_R084_0518" sub="DV_MS_2024_0518" barcode />
            <HudCode code="ACC_LVL_RECORD" tone="accent" />
            <Barcode value="DEVO-CORP" width={96} height={14} />
          </div>

          <div data-estilo="interior-abas">
            <Label>CobaltTabs</Label>
            <CobaltTabs
              label="Seções"
              value={tab}
              onValueChange={setTab}
              items={[
                { value: 'file', label: 'Record File' },
                { value: 'arcano', label: 'Arcano' },
                { value: 'virtudes', label: 'Virtudes' },
                { value: 'cartas', label: 'Cartas' },
                { value: 'votes', label: 'Votes', count: 2 },
              ]}
            />
          </div>

          <div data-estilo="interior-controles">
            <Label>Botões · papel</Label>
            <div className="flex flex-wrap gap-2.5">
              <Button theme="interior">Inscrever-se</Button>
              <Button theme="interior" variant="secondary">
                Ver perfil
              </Button>
              <Button theme="interior" variant="ghost">
                Ver todas
              </Button>
              <Button theme="interior" variant="danger">
                Terminal do gerente
              </Button>
              <Button theme="interior" disabled>
                Em breve
              </Button>
              <Button theme="interior" loading>
                Enviando
              </Button>
            </div>
            <Label>Chips · Stats</Label>
            <div className="flex flex-wrap gap-2">
              {['comum', 'rara', 'lendária'].map((c) => (
                <Chip key={c} theme="interior" selected={chips.includes(c)} onClick={() => setChips((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]))}>
                  {c}
                </Chip>
              ))}
            </div>
            <StatGrid className="mt-5">
              <Stat theme="interior" label="Records" value="7.612" />
              <Stat theme="interior" label="Ranking" value="#04" tone="cobalt" />
              <Stat theme="interior" label="Lendárias" value="2" tone="gold" />
            </StatGrid>
            <Label>No painel preto (tokens invertem sozinhos)</Label>
            <RecordPanel title="Controles" jp="コントロール">
              <div className="flex flex-wrap gap-2.5">
                <Button theme="interior" size="sm">
                  Primário
                </Button>
                <Button theme="interior" size="sm" variant="secondary">
                  Secundário
                </Button>
                <Chip theme="interior" selected>
                  Ativo
                </Chip>
                <Chip theme="interior">Filtro</Chip>
              </div>
              <StatGrid className="mt-4">
                <Stat theme="interior" label="Cartas" value="10" size="sm" />
                <Stat theme="interior" label="Trocas" value="3" size="sm" tone="cobalt" />
                <Stat theme="interior" label="Alertas" value="1" size="sm" tone="blood" />
              </StatGrid>
            </RecordPanel>
          </div>

          <div data-estilo="interior-paineis" className="flex flex-col gap-4">
            <Label>RecordPanel · TimelineList · GradeBar</Label>
            <RecordFilePanel />
            <VotesPanel />
            <ArcanoPanel />
          </div>

          <div data-estilo="interior-cartas">
            <Label>DuotoneArt · cartas (grade do Record)</Label>
            <CartasPanel />
            <div className="mt-3 grid grid-cols-3 gap-2">
              <DuotoneArt src="/images/npc/shade.png" alt="Retrato em duotom" className="aspect-[3/4]" position="50% 10%" />
              <DuotoneArt src="/images/background.png" alt="Corredor em duotom" className="aspect-[3/4]" />
              <DuotoneArt src="/images/rabbit.png" alt="Alerta em duotom vermelho" tone="blood" className="aspect-[3/4]" position="50% 15%" />
            </div>
          </div>

          <div data-estilo="interior-reservados">
            <Label>LockedFeature · sistemas reservados</Label>
            <div className="grid grid-cols-2 gap-2.5">
              {FUTURE_SYSTEMS.map((f) => (
                <LockedFeature key={f.id} name={f.name} hint={f.hint} icon={f.icon} />
              ))}
            </div>
            <RecordPanel title="Torres de Ruptura" jp="断裂の塔" className="mt-4">
              <div className="flex flex-col gap-4">
                {['Altura IV', 'Altura III', 'Altura II', 'Altura I'].map((h, i) => (
                  <LockedFeature key={h} variant="node" name={h} hint={i === 3 ? 'Em breve' : `Requer altura ${['III', 'II', 'I'][i]}`} className={i % 2 ? 'ml-auto' : ''} />
                ))}
              </div>
            </RecordPanel>
            <div className="mt-3">
              {FUTURE_SYSTEMS.slice(0, 3).map((f) => (
                <LockedFeature key={f.id} variant="row" name={f.name} jp={f.jp} hint={f.hint} icon={f.icon} />
              ))}
            </div>
          </div>

          <div data-estilo="interior-nav">
            <Label>BottomNav · hubs propostos</Label>
            <BottomNav items={HUBS} value={hub} onChange={setHub} position="static" />
            <Label>BottomNav · com sistema bloqueado</Label>
            <BottomNav items={HUBS_WITH_LOCKED} value={hub2} onChange={setHub2} position="static" label="Navegação (exemplo bloqueado)" />
          </div>

          <div data-estilo="interior-fronteira">
            <Label>Fronteira Jornada → Interior · Curtain tone="interior"</Label>
            <div className="grid grid-cols-3 gap-2">
              {[300, 700, 1300].map((at) => (
                <div key={at} className="relative h-[250px] overflow-hidden bg-dv-ink shadow-[0_0_0_1px_var(--in-line-strong)]">
                  <div className="absolute inset-0 grid place-items-center font-serif text-[22px] uppercase text-dv-text/70">Noite</div>
                  <div className="absolute inset-0 origin-top-left scale-[0.3] [height:333.4%] [width:333.4%]">
                    <Curtain state={{ label: 'Reconectando', tone: 'interior', direction: 'forward', seq: at }} freezeAt={at} />
                  </div>
                  <span className="absolute bottom-1 right-1.5 z-10 font-mono text-[9px] text-white mix-blend-difference">{at}ms</span>
                </div>
              ))}
            </div>
            <Button theme="interior" className="mt-4" onClick={() => run('Reconectando', () => {}, { tone: 'interior' })}>
              Ver fronteira
            </Button>
          </div>
        </div>
      </PaperSheet>
    </section>
  )
}
