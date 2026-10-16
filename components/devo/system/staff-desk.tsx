'use client'

import { type CSSProperties, useState } from 'react'
import { BrassCorners, Reveal, Stagger } from '@/components/devo/kit'
import type { Cargo } from '@/lib/devo/cargos'
import { cn } from '@/lib/utils'
import { DealerBoard, useStaffBoard, voteTodo } from './dealer-board'
import { InvitePanel } from './invite-panel'
import { awaitingMe, RewardsPanel, useRewards } from './staff-rewards'
import { AdminLogPanel, ConfigPanel, PlayersPanel, TeamPanel } from './staff-team'
import { DeskNav, type DeskItem } from './staff-ui'
import { AdminCosmeticos } from '../cosmeticos/admin-cosmeticos'
import { SemanaisPanel } from '../cosmeticos/semanais'

type Section = 'casos' | 'recompensas' | 'semanais' | 'equipe' | 'jogadores' | 'convites' | 'cosmeticos' | 'registro' | 'ajustes'

const LABEL: Record<Section, string> = {
  casos: 'Casos',
  recompensas: 'Recompensas',
  semanais: 'Semanais',
  cosmeticos: 'Cosméticos',
  equipe: 'Equipe',
  jogadores: 'Jogadores',
  convites: 'Convites',
  registro: 'Registro',
  ajustes: 'Ajustes',
}

/** Seções por cargo (tabela do dono). O servidor decide de novo em cada chamada. */
const SECTIONS: Record<Exclude<Cargo, 'player'>, Section[]> = {
  dealer: ['casos', 'recompensas', 'semanais'],
  anfitriao: ['casos', 'recompensas', 'semanais', 'equipe', 'jogadores', 'convites'],
  owner: ['casos', 'recompensas', 'semanais', 'equipe', 'jogadores', 'convites', 'cosmeticos', 'registro', 'ajustes'],
}

const ROLE_LINE: Record<Exclude<Cargo, 'player'>, string> = {
  dealer: 'Operação · seus Deadly Votes e propostas',
  anfitriao: 'Supervisão · Dealers, eventos e aprovações',
  // Sem a palavra do cargo: a Mesa do Owner também pode aparecer numa captura.
  owner: 'Mesa alta · casa inteira',
}

/**
 * Mesa da equipe (aba "Mesa" do Record para Owner, Anfitrião e Dealer): resumo do que pede ação e as
 * seções do cargo. Dealer: casos e propostas. Anfitrião: + equipe, jogadores (resumo), convites.
 * Owner: + registro administrativo e ajustes (probabilidades provisórias do Poço).
 */
export function StaffDesk({ role }: { role: Exclude<Cargo, 'player'> }) {
  const sections = SECTIONS[role]
  const [section, setSection] = useState<Section>('casos')
  const { data: board, error: boardError } = useStaffBoard()
  const { data: rewards, error: rewardsError } = useRewards()
  const votes = board?.votes ?? []
  const abertos = votes.filter((v) => v.status === 'convocado' || v.status === 'em-progresso').length
  const analise = votes.reduce((n, v) => n + voteTodo(v).analise, 0)
  const decidir = votes.filter((v) => voteTodo(v).decidir).length
  const minhas = awaitingMe(rewards?.recompensas)
  const propostas = (rewards?.recompensas ?? []).filter((r) => !r.podeAprovar && r.status === 'pendente').length
  const approver = role !== 'dealer'

  const items: DeskItem<Section>[] = sections.map((s) => ({
    value: s,
    label: LABEL[s],
    count: s === 'casos' ? analise + decidir : s === 'recompensas' ? (approver ? minhas : 0) : undefined,
  }))

  const tiles: { label: string; value: number; go: Section; hot?: boolean; off?: boolean }[] = [
    { label: 'Casos abertos', value: abertos, go: 'casos', off: !board },
    { label: 'Inscrições em análise', value: analise, go: 'casos', hot: analise > 0, off: !board },
    { label: 'Resultados a aplicar', value: decidir, go: 'casos', hot: decidir > 0, off: !board },
    approver
      ? { label: 'Recompensas a aprovar', value: minhas, go: 'recompensas', hot: minhas > 0, off: !rewards }
      : { label: 'Propostas pendentes', value: propostas, go: 'recompensas', off: !rewards },
  ]

  return (
    <div className="flex flex-col gap-5">
      <Reveal variant="cut">
        <section
          aria-label="Mesa da equipe"
          className="dv-interior-dark dv-record-panel dv-cut relative overflow-hidden"
          style={{ '--dv-cut': '14px' } as CSSProperties}
        >
          <BrassCorners size={24} inset={4} />
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[url(/images/os/marmore-negro.webp)] bg-[length:520px_520px] opacity-55" />
          <div className="relative p-4 pb-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-in-fg-3">Mesa da equipe</p>
            <p className="mt-1.5 font-serif text-[26px] font-light uppercase leading-none tracking-[0.03em] text-in-fg">{role === 'dealer' ? 'Dealer' : role === 'anfitriao' ? 'Anfitrião' : 'Sigilo'}</p>
            <p className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-dv-gold">{ROLE_LINE[role]}</p>
          </div>
          <div className="relative grid grid-cols-2 border-t border-in-line">
            {tiles.map((t, i) => (
              <div key={t.label} className={cn('border-in-line', i % 2 === 0 && 'border-r', i < 2 && 'border-b')}>
                <button
                  type="button"
                  onClick={() => setSection(t.go)}
                  aria-label={`${t.label}: ${t.off ? 'indisponível' : t.value}`}
                  className="dv-focus flex min-h-[72px] w-full flex-col items-start justify-center gap-1 px-4 py-2.5 text-left hover:bg-white/[0.04]"
                >
                  <span className="order-2 font-mono text-[10px] uppercase leading-tight tracking-[0.12em] text-in-fg-2">{t.label}</span>
                  <span className={cn('order-1 flex items-center gap-2 font-impact text-[30px] font-semibold leading-none dv-tabular', t.value ? 'text-in-fg' : 'text-in-fg-3')}>
                    {t.hot && <span aria-hidden="true" className="size-2 rotate-45 bg-dv-amethyst shadow-[0_0_10px_rgba(138,124,200,0.8)]" />}
                    {t.off ? '—' : t.value}
                  </span>
                </button>
              </div>
            ))}
          </div>
          {(boardError || rewardsError) && (
            <p role="status" className="relative border-t border-in-line px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-in-fg-2">
              Parte da mesa não respondeu · tente de novo em instantes
            </p>
          )}
        </section>
      </Reveal>

      <DeskNav label="Seções da mesa" items={items} value={section} onChange={setSection} />

      <Stagger key={section} className="flex flex-col gap-5">
        {section === 'casos' && <DealerBoard role={role} />}
        {section === 'recompensas' && <RewardsPanel role={role} />}
        {section === 'equipe' && <TeamPanel role={role} />}
        {section === 'jogadores' && <PlayersPanel role={role} />}
        {section === 'convites' && <InvitePanel />}
        {section === 'semanais' && <SemanaisPanel role={role} />}
        {section === 'cosmeticos' && <AdminCosmeticos />}
        {section === 'registro' && <AdminLogPanel />}
        {section === 'ajustes' && <ConfigPanel />}
      </Stagger>
    </div>
  )
}
