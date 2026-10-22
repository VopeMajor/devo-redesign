'use client'

import { Minus, Plus } from 'lucide-react'
import { type CSSProperties, type ReactNode, type SelectHTMLAttributes, useState } from 'react'
import useSWR from 'swr'
import { Spinner } from '@/components/devo/kit'
import { playSfx } from '@/lib/devo/audio'
import { CARDS } from '@/lib/devo/cards'
import { ARCANO_KEYS, ARCANO_OPCOES, arcanoInfo, chaveOpcoesArcano, lerOpcoesArcano } from '@/lib/devo/virtudes'
import type { PrizeInput, PrizeResource } from '@/lib/devo/deadly-votes'
import { cn } from '@/lib/utils'
import { RecButton, RecInput, RecLabel } from './record-ui'

/**
 * Peças locais dos painéis de equipe (Mesa): seletor nativo no padrão do campo do Record, navegação da
 * Mesa, editor de recompensas, confirmação em dois toques e leitura da API /api/staff.
 * Candidatos ao kit: RecSelect, DeskNav e ConfirmButton.
 */

export const STAFF_KEY = '/api/staff'

export async function staffGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Falha ao carregar a mesa.')
  return data as T
}

export async function staffPost<T = Record<string, unknown>>(body: Record<string, unknown>): Promise<T & { ok: true }> {
  const res = await fetch(STAFF_KEY, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
  if (!res.ok || !data.ok) throw new Error(data.error ?? 'Não foi possível concluir a ação.')
  return data as T & { ok: true }
}

/* ───────────────────────────── Seletor ───────────────────────────── */

const SELECT =
  'dv-focus w-full appearance-none rounded-none border-b-2 border-in-line-strong bg-in-fg/[0.035] py-0 pl-3 pr-9 font-sans text-[16px] text-in-fg outline-none transition-[border-color,background-color] duration-200 focus:border-in-fg focus:bg-in-fg/[0.06] disabled:opacity-50'

/** Seletor nativo (o celular abre a roda do sistema) com a seta de aço do Record. */
export function RecSelect({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative block">
      <select className={cn(SELECT, 'h-12', className)} {...rest}>
        {children}
      </select>
      <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-2 -translate-y-[70%] rotate-45 border-b-[1.5px] border-r-[1.5px] border-in-fg-2" />
    </span>
  )
}

/* ─────────────────────────── Navegação da Mesa ─────────────────────────── */

export type DeskItem<T extends string> = { value: T; label: string; count?: number; alert?: boolean }

/**
 * Seções da Mesa: faixa de etiquetas cortadas (rola na horizontal no celular). A ativa é bloco negro;
 * `count` aparece como pílula (ametista; rubi só quando `alert`).
 */
export function DeskNav<T extends string>({ items, value, onChange, label }: { items: DeskItem<T>[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <nav aria-label={label} className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <ul className="flex min-w-max gap-1.5">
        {items.map((it) => {
          const on = it.value === value
          return (
            <li key={it.value}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => {
                  if (on) return
                  playSfx('card-select')
                  onChange(it.value)
                }}
                className={cn(
                  'dv-focus dv-cut-diag inline-flex min-h-11 items-center gap-2 px-3.5 font-mono text-[10.5px] uppercase tracking-[0.14em] transition-colors',
                  on ? 'bg-dv-block text-white shadow-[inset_0_0_0_1px_rgba(186,176,159,0.45)]' : 'text-in-fg-2 shadow-[inset_0_0_0_1px_var(--in-line-strong)] hover:text-in-fg',
                )}
                style={{ '--dv-cut': '7px' } as CSSProperties}
              >
                {on && <span aria-hidden="true" className="size-1.5 rotate-45 bg-dv-amethyst" />}
                {it.label}
                {!!it.count && (
                  <span
                    className={cn(
                      'grid h-5 min-w-5 place-items-center px-1 font-mono text-[10px] font-semibold leading-none tracking-normal dv-tabular',
                      it.alert ? 'bg-in-alert text-white' : on ? 'bg-dv-amethyst text-white' : 'bg-in-fg text-in-bg',
                    )}
                  >
                    {it.count}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/* ─────────────────────────── Confirmação ─────────────────────────── */

/** Ação de peso em dois toques: o primeiro arma ("Confirmar …"), o segundo executa. */
export function ConfirmButton({
  children,
  confirmLabel,
  onConfirm,
  loading,
  disabled,
  surface = 'paper',
  variant = 'primary',
  block,
  size = 'md',
  icon,
}: {
  children: ReactNode
  confirmLabel: string
  onConfirm: () => void
  loading?: boolean
  disabled?: boolean
  surface?: 'paper' | 'dark'
  variant?: 'primary' | 'secondary' | 'danger'
  block?: boolean
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
}) {
  const [armed, setArmed] = useState(false)
  if (!armed || loading) {
    return (
      <RecButton surface={surface} variant={variant} block={block} size={size} icon={icon} loading={loading} disabled={disabled} sfx="click" onClick={() => setArmed(true)}>
        {children}
      </RecButton>
    )
  }
  return (
    <div className={cn('flex gap-2', block && 'w-full')}>
      <RecButton surface={surface} variant={variant === 'secondary' ? 'primary' : variant} size={size} className="flex-1" sfx="confirm" onClick={() => onConfirm()}>
        {confirmLabel}
      </RecButton>
      <RecButton surface={surface} variant="ghost" size={size} onClick={() => setArmed(false)} sfx="close">
        Voltar
      </RecButton>
    </div>
  )
}

/* ─────────────────────────── Catálogo e recursos ─────────────────────────── */

export type ItemDef = { key: string; kind: string; name: string; rarity?: string | null }

/** Catálogo de itens (para propor recompensas). Só a equipe lê. */
export function useStaffItems() {
  const { data } = useSWR<{ itens: ItemDef[] }>(`${STAFF_KEY}?view=itens`, staffGet, { revalidateOnFocus: false })
  const itens = data?.itens ?? []
  const names = new Map(itens.map((i) => [i.key, i.name]))
  return { itens, names }
}

export const RESOURCE_LABEL: Record<PrizeResource, string> = { item: 'Item do inventário', tempo: 'Tempo de vida', carta: 'Carta', convite: 'Convite', arcano: 'Arcano' }

/** Texto curto de um recurso: "3 × Dracma Comum", "2 h de tempo", "Carta: Fósforo", "1 convite". */
export function resourceText(r: { recurso: PrizeResource; chave: string | null; quantidade: number }, names?: Map<string, string>) {
  if (r.recurso === 'tempo') {
    const h = Math.floor(r.quantidade / 60)
    const m = r.quantidade % 60
    return `${h ? `${h} h` : ''}${h && m ? ' ' : ''}${m ? `${m} min` : ''} de tempo`
  }
  if (r.recurso === 'convite') return r.quantidade === 1 ? '1 convite' : `${r.quantidade} convites`
  if (r.recurso === 'arcano') {
    const ks = lerOpcoesArcano(r.chave)
    if (!ks) return 'Arcano'
    const nomes = ks.map((k) => arcanoInfo(k).titulo.replace(/^Arcano (d[aeo]s?) /, ''))
    return ks.length === 1 ? arcanoInfo(ks[0]).titulo : `Arcano à escolha: ${nomes.slice(0, -1).join(', ')} ou ${nomes[nomes.length - 1]}`
  }
  if (r.recurso === 'carta') {
    const name = CARDS.find((c) => c.id === r.chave)?.name ?? r.chave
    return `${r.quantidade > 1 ? `${r.quantidade} × ` : ''}Carta ${name}`
  }
  return `${r.quantidade} × ${names?.get(r.chave ?? '') ?? r.chave}`
}

/** Campo de recurso (tipo, item/carta, quantidade) — usado nas recompensas do caso e nas propostas. */
export function ResourceFields({
  value,
  onChange,
  itens,
  idPrefix,
}: {
  value: PrizeInput
  onChange: (v: PrizeInput) => void
  itens: ItemDef[]
  idPrefix: string
}) {
  const set = (patch: Partial<PrizeInput>) => onChange({ ...value, ...patch })
  const usable = itens.filter((i) => i.kind !== 'convite')
  return (
    <div className="grid grid-cols-2 gap-3">
      <label className="col-span-2 flex min-w-0 flex-col gap-1.5">
        <RecLabel>Recurso</RecLabel>
        <RecSelect
          id={`${idPrefix}-recurso`}
          value={value.recurso}
          onChange={(e) => {
            const recurso = e.target.value as PrizeResource
            set({
              recurso,
              chave: recurso === 'item' ? (usable[0]?.key ?? null) : recurso === 'carta' ? CARDS[0]?.id : recurso === 'arcano' ? chaveOpcoesArcano(ARCANO_KEYS.slice(0, ARCANO_OPCOES)) : null,
              quantidade: recurso === 'tempo' ? 60 : 1,
            })
          }}
        >
          {(Object.keys(RESOURCE_LABEL) as PrizeResource[]).map((r) => (
            <option key={r} value={r}>
              {RESOURCE_LABEL[r]}
            </option>
          ))}
        </RecSelect>
      </label>
      {value.recurso === 'item' && (
        <label className="col-span-2 flex min-w-0 flex-col gap-1.5">
          <RecLabel>Item</RecLabel>
          <RecSelect value={value.chave ?? ''} onChange={(e) => set({ chave: e.target.value })}>
            {!usable.length && <option value="">Carregando catálogo…</option>}
            {usable.map((i) => (
              <option key={i.key} value={i.key}>
                {i.name}
              </option>
            ))}
          </RecSelect>
        </label>
      )}
      {value.recurso === 'carta' && (
        <label className="col-span-2 flex min-w-0 flex-col gap-1.5">
          <RecLabel>Carta</RecLabel>
          <RecSelect value={value.chave ?? ''} onChange={(e) => set({ chave: e.target.value })}>
            {CARDS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </RecSelect>
        </label>
      )}
      {value.recurso === 'arcano' && <OpcoesArcano chave={value.chave ?? null} onChange={(chave) => set({ chave, quantidade: 1 })} />}
      <label className={cn('flex min-w-0 flex-col gap-1.5', value.recurso === 'arcano' && 'hidden')}>
        <RecLabel hint={value.recurso === 'tempo' ? 'minutos' : undefined}>Quantidade</RecLabel>
        <RecInput
          inputMode="numeric"
          value={String(value.quantidade || '')}
          onChange={(e) => set({ quantidade: Number(e.target.value.replace(/\D/g, '').slice(0, 6)) })}
          className="dv-tabular"
        />
      </label>
      <label className="flex min-w-0 flex-col gap-1.5">
        <RecLabel hint="opcional">Rótulo</RecLabel>
        <RecInput value={value.label ?? ''} onChange={(e) => set({ label: e.target.value.slice(0, 60) })} placeholder="Ex.: prêmio do vencedor" />
      </label>
    </div>
  )
}

/**
 * Prêmio "Arcano" (dono, 22/10): o narrador indica três Arcanos diferentes; depois da aprovação de um Anfitrião, o
 * jogador escolhe um deles na tela dos Arcanos. Só quem ainda não tem Arcano recebe.
 */
function OpcoesArcano({ chave, onChange }: { chave: string | null; onChange: (chave: string) => void }) {
  const atual = (chave ?? '').split(',')
  const ks = Array.from({ length: ARCANO_OPCOES }, (_, i) => atual[i] ?? '')
  const repetido = new Set(ks.filter(Boolean)).size !== ks.filter(Boolean).length
  return (
    <div className="col-span-2 flex min-w-0 flex-col gap-1.5">
      <RecLabel hint="o jogador escolhe um · só para quem ainda não tem Arcano">Três Arcanos à escolha</RecLabel>
      {ks.map((k, i) => (
        <RecSelect key={i} aria-label={`Opção ${i + 1}`} value={k} onChange={(e) => onChange(ks.map((x, j) => (j === i ? e.target.value : x)).join(','))}>
          {ARCANO_KEYS.map((key) => {
            const a = arcanoInfo(key)
            return (
              <option key={key} value={key}>
                {a.numeral} · {a.titulo}
              </option>
            )
          })}
        </RecSelect>
      ))}
      {repetido && <p className="font-mono text-[11px] text-in-alert">Escolha três Arcanos diferentes.</p>}
      <p className="font-body text-[13px] text-in-fg-3">A recompensa só é entregue depois da aprovação de um Anfitrião.</p>
    </div>
  )
}

/**
 * Recompensas planejadas do caso (privadas): lista com remover e um mini-formulário para acrescentar.
 * Elas viram propostas por participante premiado quando o resultado é aplicado.
 */
export function PrizeEditor({ value, onChange }: { value: PrizeInput[]; onChange: (v: PrizeInput[]) => void }) {
  const { itens, names } = useStaffItems()
  const [draft, setDraft] = useState<PrizeInput | null>(null)
  const draftOk = !!draft && (draft.recurso === 'arcano' ? !!draft.chave : draft.quantidade > 0 && (draft.recurso === 'tempo' || draft.recurso === 'convite' || !!draft.chave))
  return (
    <div className="flex flex-col gap-2.5">
      {value.length > 0 && (
        <ul className="flex flex-col">
          {value.map((p, i) => (
            <li key={i} className="flex min-h-11 items-center gap-2 border-b border-dashed border-in-line py-1.5 last:border-b-0">
              <span aria-hidden="true" className="size-1.5 shrink-0 rotate-45 bg-in-gold" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-sans text-[14px] text-in-fg">{resourceText({ recurso: p.recurso, chave: p.chave ?? null, quantidade: p.quantidade }, names)}</span>
                {p.label && <span className="block truncate font-mono text-[10.5px] uppercase tracking-[0.12em] text-in-fg-3">{p.label}</span>}
              </span>
              <button
                type="button"
                aria-label={`Remover recompensa ${i + 1}`}
                onClick={() => onChange(value.filter((_, k) => k !== i))}
                className="dv-focus grid size-11 shrink-0 place-items-center text-in-fg-2 hover:text-in-alert"
              >
                <Minus className="size-4" strokeWidth={1.4} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {draft ? (
        <div className="flex flex-col gap-3 bg-in-fg/[0.03] p-3 shadow-[inset_0_0_0_1px_var(--in-line)]">
          <ResourceFields value={draft} onChange={setDraft} itens={itens} idPrefix="premio" />
          <div className="flex gap-2">
            <RecButton
              surface="paper"
              size="sm"
              disabled={!draftOk}
              className="flex-1"
              onClick={() => {
                if (!draft) return
                onChange([...value, { ...draft, label: draft.label?.trim() || null }])
                setDraft(null)
              }}
            >
              Incluir recompensa
            </RecButton>
            <RecButton surface="paper" variant="ghost" size="sm" onClick={() => setDraft(null)}>
              Cancelar
            </RecButton>
          </div>
        </div>
      ) : (
        value.length < 8 && (
          <RecButton
            surface="paper"
            variant="secondary"
            size="sm"
            icon={<Plus strokeWidth={1.4} />}
            className="self-start"
            onClick={() => setDraft({ recurso: 'item', chave: itens.find((i) => i.kind !== 'convite')?.key ?? null, quantidade: 1, label: '' })}
          >
            Adicionar recompensa
          </RecButton>
        )
      )}
    </div>
  )
}

/* ─────────────────────────── Estados de lista ─────────────────────────── */

export function Loading({ children = 'Abrindo a mesa…' }: { children?: ReactNode }) {
  return (
    <p className="flex items-center gap-2 font-body text-[15px] text-in-fg-2">
      <Spinner className="size-4" /> {children}
    </p>
  )
}

export function ErrorLine({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="font-mono text-[12px] leading-relaxed text-in-alert">
      {children}
    </p>
  )
}

/** Vazio com marca: losango aberto + frase curta. */
export function EmptyLine({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span aria-hidden="true" className="mt-1.5 size-2.5 shrink-0 rotate-45 shadow-[inset_0_0_0_1.5px_var(--in-line-strong)]" />
      <div>
        <p className="font-serif text-[18px] font-light uppercase leading-tight tracking-[0.04em] text-in-fg">{title}</p>
        {children && <p className="mt-1 font-body text-[15px] leading-relaxed text-in-fg-2">{children}</p>}
      </div>
    </div>
  )
}

/** Linha de dado: rótulo mono + valor (painéis de resumo). */
export function DataRow({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="flex min-h-10 items-baseline justify-between gap-3 border-b border-in-line py-2 last:border-b-0">
      <dt className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-in-fg-2">{label}</dt>
      <dd className="text-right">
        <span className="font-impact text-[20px] font-semibold leading-none text-in-fg dv-tabular">{value}</span>
        {hint && <span className="ml-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-in-fg-3">{hint}</span>}
      </dd>
    </div>
  )
}
