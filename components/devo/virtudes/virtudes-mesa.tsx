'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { HudCode, RecordPanel } from '@/components/devo/kit'
import { playSfx } from '@/lib/devo/audio'
import {
  ARCANOS,
  type AfinidadesConfig,
  afinidadeDaOrdem,
  AFINIDADE_ROTULO,
  arcanoInfo,
  type EstagioLimite,
  type MesaJogador,
  ordemValida,
  VIRTUDE_KEYS,
  VIRTUDES,
  type VirtudeKey,
  type VirtudesMesa,
} from '@/lib/devo/virtudes'
import { cn } from '@/lib/utils'
import { RecButton, RecInput, RecTag } from '../system/record-ui'
import { ConfirmButton, EmptyLine, ErrorLine, Loading, RecSelect } from '../system/staff-ui'
import { Naipe } from './naipes'

/**
 * Mesa do Record › Virtudes (Owner/Anfitrião). Aqui os números aparecem: P.P. do Estágio por Virtude, mínimo e
 * teto, atributos acumulados, histórico. A equipe define o Arcano e dispara a Evolução de Estágio (o servidor
 * distribui pela afinidade). O Owner ainda lança P.P. à mão e edita a tabela de afinidade e os limites
 * (provisórios), com as divergências do doc marcadas para o dono confirmar.
 */

async function get(url: string): Promise<VirtudesMesa> {
  const r = await fetch(url, { cache: 'no-store' })
  const j = await r.json().catch(() => null)
  if (!r.ok) throw new Error(j?.error ?? 'As Virtudes não responderam.')
  return j
}

async function post(body: Record<string, unknown>) {
  const r = await fetch('/api/virtudes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const j = await r.json().catch(() => null)
  if (!r.ok || !j?.ok) throw new Error(j?.error ?? 'Não foi possível concluir.')
  return j
}

const n2 = (n: number) => (Math.round(n * 100) / 100).toLocaleString('pt-BR')

export function VirtudesMesa() {
  const [busca, setBusca] = useState('')
  const [q, setQ] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setQ(busca.trim()), 300)
    return () => clearTimeout(t)
  }, [busca])
  const { data, error, isLoading, mutate } = useSWR<VirtudesMesa>(`/api/virtudes?view=mesa${q ? `&q=${encodeURIComponent(q)}` : ''}`, get, { revalidateOnFocus: false })
  const [aviso, setAviso] = useState<{ tom: 'ok' | 'erro'; texto: string } | null>(null)

  const agir = async (body: Record<string, unknown>, ok: string) => {
    setAviso(null)
    try {
      await post(body)
      playSfx('confirm')
      setAviso({ tom: 'ok', texto: ok })
      await mutate()
      return true
    } catch (e) {
      playSfx('error')
      setAviso({ tom: 'erro', texto: (e as Error).message })
      return false
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <RecordPanel variant="paper" title="Virtudes" jp="美徳" ornate headerRight={<HudCode code="DV_VIRTUDES" />}>
        <p className="font-body text-[15px] leading-relaxed text-in-fg-2">
          Pontos de Potencial do Estágio, Arcano e Evolução de Estágio. O jogador só vê palavras (afinidade, quanto acumulou); os números ficam aqui. A Evolução espalha os P.P. pela afinidade do Arcano — ninguém escolhe a distribuição.
        </p>
        <RecInput aria-label="Buscar jogador" placeholder="Buscar jogador pelo nome" value={busca} onChange={(e) => setBusca(e.target.value.slice(0, 40))} className="mt-3 h-11 text-[15px]" />
        {aviso && (
          <p role={aviso.tom === 'erro' ? 'alert' : 'status'} className={cn('mt-3 font-mono text-[12px] leading-relaxed', aviso.tom === 'erro' ? 'text-in-alert' : 'text-in-accent')}>
            {aviso.texto}
          </p>
        )}
      </RecordPanel>

      {isLoading && !data ? (
        <Loading>Abrindo as Virtudes…</Loading>
      ) : error ? (
        <ErrorLine>{(error as Error).message}</ErrorLine>
      ) : data ? (
        <>
          <RecordPanel title="Jogadores" jp="名簿" headerRight={<RecTag tone="muted">{data.jogadores.length}</RecTag>}>
            {data.jogadores.length ? (
              <ul className="flex flex-col">
                {data.jogadores.map((j) => (
                  <LinhaJogador key={j.id} j={j} owner={data.podeEditar} agir={agir} ordem={data.config.afinidades.ordem} />
                ))}
              </ul>
            ) : (
              <EmptyLine title="Ninguém encontrado">Nenhum jogador com esse nome.</EmptyLine>
            )}
          </RecordPanel>
          {data.podeEditar && <EditorAfinidades cfg={data.config.afinidades} provisorio={data.config.afinidadesProvisorio} agir={agir} />}
          {data.podeEditar && <EditorEstagios padrao={data.config.estagios.padrao} provisorio={data.config.estagiosProvisorio} agir={agir} porArcano={data.config.estagios.porArcano} />}
        </>
      ) : null}
    </div>
  )
}

type Agir = (body: Record<string, unknown>, ok: string) => Promise<boolean>

function LinhaJogador({ j, owner, agir, ordem }: { j: MesaJogador; owner: boolean; agir: Agir; ordem: AfinidadesConfig['ordem'] }) {
  const [aberto, setAberto] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [pv, setPv] = useState<VirtudeKey>('paus')
  const [pq, setPq] = useState('5')
  const run = async (k: string, body: Record<string, unknown>, ok: string) => {
    setBusy(k)
    await agir(body, ok)
    setBusy(null)
  }
  const frac = j.teto > 0 ? Math.min(1, j.total / j.teto) : 0
  const minFrac = j.teto > 0 ? Math.min(1, j.minimo / j.teto) : 0
  const podeEvoluir = !!j.arcano && !j.ultimoEstagio && j.total > 0 && j.total >= j.minimo
  const motivo = !j.arcano ? 'sem Arcano' : j.ultimoEstagio ? 'último Estágio' : j.total < j.minimo || j.total <= 0 ? 'abaixo do mínimo' : null
  return (
    <li aria-label={`Virtudes de ${j.nome}`} className="border-b border-in-line py-3.5 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-serif text-[19px] font-light uppercase leading-tight tracking-[0.03em] text-in-fg">
            {j.nome}
            {j.isTest && <span className="ml-2 align-middle font-mono text-[9.5px] tracking-[0.14em] text-in-fg-3">teste</span>}
          </p>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-in-fg-2">
            {j.arcano ? arcanoInfo(j.arcano).titulo : 'Arcano sem registro'} · Estágio {j.estagio}
          </p>
        </div>
        <RecButton size="sm" variant="ghost" onClick={() => setAberto(!aberto)} aria-expanded={aberto}>
          {aberto ? 'Fechar' : 'Detalhes'}
        </RecButton>
      </div>

      {/* P.P. do Estágio: total, mínimo e teto (números) */}
      <div className="mt-2.5">
        <div className="relative h-2.5 bg-in-fg/[0.08]" role="img" aria-label={`P.P. ${n2(j.total)} de ${n2(j.teto)}; mínimo ${n2(j.minimo)}`}>
          <span className={cn('absolute inset-y-0 left-0', j.total >= j.teto ? 'bg-in-accent' : 'bg-in-data')} style={{ width: `${frac * 100}%` }} />
          <span aria-hidden="true" className="absolute -inset-y-1 w-px bg-in-fg" style={{ left: `${minFrac * 100}%` }} />
        </div>
        <p className="mt-1.5 flex justify-between font-mono text-[11px] uppercase tracking-[0.1em] text-in-fg-2 dv-tabular">
          <span>
            P.P. {n2(j.total)} / {n2(j.teto)}
          </span>
          <span>mín. {n2(j.minimo)}</span>
        </p>
      </div>

      {aberto && (
        <div className="mt-3 flex flex-col gap-3">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="font-mono text-[10px] uppercase tracking-[0.14em] text-in-fg-3">
                <th className="py-1 font-normal">Virtude</th>
                <th className="py-1 text-right font-normal">P.P.</th>
                <th className="py-1 text-right font-normal">Atributo</th>
                <th className="py-1 text-right font-normal">Afinidade</th>
              </tr>
            </thead>
            <tbody>
              {VIRTUDE_KEYS.map((v) => (
                <tr key={v} className="border-t border-in-line">
                  <td className="py-1.5">
                    <span className="flex items-center gap-2 font-sans text-[14px] text-in-fg">
                      <Naipe virtude={v} className="size-5" /> {VIRTUDES[v].nome}
                    </span>
                  </td>
                  <td className="py-1.5 text-right font-mono text-[13px] text-in-fg dv-tabular">{n2(j.pp[v])}</td>
                  <td className="py-1.5 text-right font-mono text-[13px] text-in-fg dv-tabular">{n2(j.nivel[v])}</td>
                  <td className="py-1.5 text-right font-mono text-[11px] uppercase tracking-[0.08em] text-in-fg-2">{j.arcano ? <AfinTag o={ordem[j.arcano]} v={v} /> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {j.evolucoes.length > 0 && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-in-fg-3">Evoluções</p>
              <ul className="mt-1">
                {j.evolucoes.map((e) => (
                  <li key={e.at} className="border-t border-in-line py-1.5 font-mono text-[11.5px] leading-relaxed text-in-fg-2 dv-tabular">
                    {new Date(e.at).toLocaleDateString('pt-BR')} · {e.de}→{e.para} · total {n2(e.total)}
                    {e.por ? ` · por ${e.por}` : ''}
                    <br />
                    {VIRTUDE_KEYS.map((v) => `${VIRTUDES[v].nome} +${n2(e.ganhos[v] ?? 0)}`).join(' · ')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-in-fg-2">Arcano</span>
            <RecSelect
              aria-label={`Arcano de ${j.nome}`}
              value={j.arcano ?? ''}
              disabled={busy === 'arcano'}
              onChange={(e) => void run('arcano', { action: 'arcano', playerId: j.id, arcano: e.target.value || null }, `Arcano de ${j.nome} atualizado.`)}
            >
              <option value="">Sem registro</option>
              {ARCANOS.map(([k, t]) => (
                <option key={k} value={k}>
                  {t}
                </option>
              ))}
            </RecSelect>
          </label>

          {owner && (
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex min-w-[120px] flex-1 flex-col gap-1">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-in-fg-2">Lançar P.P.</span>
                <RecSelect aria-label="Virtude dos P.P." value={pv} onChange={(e) => setPv(e.target.value as VirtudeKey)}>
                  {VIRTUDE_KEYS.map((v) => (
                    <option key={v} value={v}>
                      {VIRTUDES[v].nome}
                    </option>
                  ))}
                </RecSelect>
              </label>
              <RecInput aria-label="Quantidade de P.P." inputMode="decimal" value={pq} onChange={(e) => setPq(e.target.value.replace(/[^\d.,]/g, '').slice(0, 6))} className="h-12 w-20 text-[16px]" />
              <RecButton size="md" variant="secondary" loading={busy === 'pp'} onClick={() => void run('pp', { action: 'potencial', playerId: j.id, virtude: pv, quantidade: Number(pq.replace(',', '.')), motivo: 'mesa' }, 'P.P. lançados (o teto do Estágio vale).')}>
                Lançar
              </RecButton>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ConfirmButton
          size="sm"
          confirmLabel={`Confirmar Evolução de ${j.nome}`}
          disabled={!podeEvoluir}
          loading={busy === 'evoluir'}
          onConfirm={() => void run('evoluir', { action: 'evoluir', playerId: j.id }, `${j.nome} evoluiu para o Estágio ${j.estagio + 1}.`)}
        >
          Evoluir Estágio
        </ConfirmButton>
        {motivo && <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-in-fg-3">{motivo}</span>}
      </div>
    </li>
  )
}

/** Posição e rótulo de afinidade (tabela em vigor). */
function AfinTag({ o, v }: { o: Record<VirtudeKey, number> | undefined; v: VirtudeKey }) {
  if (!o || !ordemValida(o)) return <>—</>
  return (
    <>
      {o[v]}º · {AFINIDADE_ROTULO[afinidadeDaOrdem(o[v])]}
    </>
  )
}

function EditorAfinidades({ cfg, provisorio, agir }: { cfg: AfinidadesConfig; provisorio: boolean; agir: Agir }) {
  const [ordem, setOrdem] = useState(cfg.ordem)
  const [conf, setConf] = useState<Record<string, boolean>>(() => Object.fromEntries(Object.entries(cfg.divergencias ?? {}).map(([k, d]) => [k, !!d.confirmado])))
  const [final, setFinal] = useState(!provisorio)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    setOrdem(cfg.ordem)
  }, [cfg])
  const pendentes = Object.entries(cfg.divergencias ?? {}).filter(([k, d]) => d.confirmar && !conf[k]).length
  const invalidas = ARCANOS.filter(([k]) => !ordemValida(ordem[k])).map(([, t]) => t)
  const salvar = async () => {
    setBusy(true)
    const divergencias = Object.fromEntries(Object.entries(cfg.divergencias ?? {}).map(([k, d]) => [k, { ...d, confirmado: !!conf[k] }]))
    await agir({ action: 'afinidades', value: { ...cfg, ordem, divergencias }, provisorio: !final }, 'Tabela de afinidade gravada.')
    setBusy(false)
  }
  return (
    <RecordPanel
      title="Tabela de afinidade"
      jp="相性"
      headerRight={<RecTag tone={provisorio ? 'accent' : 'muted'}>{provisorio ? 'Provisório' : 'Final'}</RecTag>}
    >
      <p className="font-body text-[15px] leading-relaxed text-in-fg-2">
        Ordem de 1 (excelente) a 6 (deficiente) por Arcano, da tabela do doc do dono. Multiplicadores por posição: {cfg.escala.map((m) => `×${String(m).replace('.', ',')}`).join(' · ')}. Linhas marcadas divergem dentro do próprio doc — confirmar com o dono.
      </p>
      {pendentes > 0 && <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-in-alert">{pendentes} Arcanos esperando confirmação do dono</p>}
      <div className="mt-3">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[37%]" />
            {VIRTUDE_KEYS.map((v) => (
              <col key={v} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className="py-1 text-left font-mono text-[10px] font-normal uppercase tracking-[0.12em] text-in-fg-3">Arcano</th>
              {VIRTUDE_KEYS.map((v) => (
                <th key={v} className="px-0.5 py-1" title={VIRTUDES[v].nome}>
                  <Naipe virtude={v} className="mx-auto size-5" title={VIRTUDES[v].nome} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ARCANOS.map(([k, titulo]) => {
              const div = cfg.divergencias?.[k]
              const ruim = !ordemValida(ordem[k])
              return (
                <ArcanoLinha
                  key={k}
                  k={k}
                  titulo={titulo}
                  ordem={ordem[k]}
                  invalida={ruim}
                  div={div}
                  confirmado={!!conf[k]}
                  onConf={(v) => setConf({ ...conf, [k]: v })}
                  onChange={(v, n) => setOrdem({ ...ordem, [k]: { ...(ordem[k] ?? { paus: 1, copas: 2, ouros: 3, espadas: 4, tacas: 5, escudos: 6 }), [v]: n } })}
                />
              )
            })}
          </tbody>
        </table>
      </div>
      {invalidas.length > 0 && <p className="mt-2 font-mono text-[11px] leading-relaxed text-in-alert">Cada posição de 1 a 6 uma vez só: {invalidas.join(', ')}.</p>}
      <label className="mt-3 flex min-h-11 items-center gap-2.5 font-sans text-[14px] text-in-fg">
        <input type="checkbox" checked={final} onChange={(e) => setFinal(e.target.checked)} className="size-5 accent-[#1c1c1f]" />
        Valores finais (o dono confirmou tudo)
      </label>
      <div className="mt-2">
        <RecButton disabled={invalidas.length > 0} loading={busy} onClick={() => void salvar()}>
          Gravar tabela
        </RecButton>
      </div>
    </RecordPanel>
  )
}

function ArcanoLinha({
  k,
  titulo,
  ordem,
  invalida,
  div,
  confirmado,
  onConf,
  onChange,
}: {
  k: string
  titulo: string
  ordem: Record<VirtudeKey, number> | undefined
  invalida: boolean
  div?: { confirmar: boolean; nota: string }
  confirmado: boolean
  onConf: (v: boolean) => void
  onChange: (v: VirtudeKey, n: number) => void
}) {
  const [nota, setNota] = useState(false)
  return (
    <>
      <tr className={cn('border-t border-in-line', invalida && 'bg-in-alert/10')}>
        <td className="py-1 pr-1">
          <span className="flex items-center gap-1">
            <span className="min-w-0 font-sans text-[12.5px] leading-tight text-in-fg">{titulo.replace(/^Arcano d[aoe]s? /, '')}</span>
            {div && (
              <button
                type="button"
                onClick={() => setNota(!nota)}
                aria-expanded={nota}
                aria-label={`Divergência do doc: ${titulo}`}
                className={cn('dv-focus grid size-6 shrink-0 place-items-center font-mono text-[11px] font-semibold', div.confirmar && !confirmado ? 'text-in-alert shadow-[inset_0_0_0_1.5px_var(--in-alert)]' : 'text-in-fg-3 shadow-[inset_0_0_0_1px_var(--in-line-strong)]')}
              >
                !
              </button>
            )}
          </span>
        </td>
        {VIRTUDE_KEYS.map((v) => (
          <td key={v} className="px-[2px] py-1">
            <select
              aria-label={`${titulo}: posição de ${VIRTUDES[v].nome}`}
              value={ordem?.[v] ?? ''}
              onChange={(e) => onChange(v, Number(e.target.value))}
              className={cn('dv-focus h-10 w-full min-w-0 appearance-none bg-in-fg/[0.04] text-center font-mono text-[14px] text-in-fg [text-align-last:center]', ordem?.[v] === 1 && 'font-semibold text-in-accent', ordem?.[v] === 6 && 'text-in-fg-3')}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </td>
        ))}
      </tr>
      {div && nota && (
        <tr>
          <td colSpan={7} className="pb-2 pr-1">
            <p className="font-body text-[14px] leading-relaxed text-in-fg-2">{div.nota}</p>
            {div.confirmar && (
              <label className="mt-1 flex min-h-10 items-center gap-2 font-sans text-[13px] text-in-fg">
                <input type="checkbox" checked={confirmado} onChange={(e) => onConf(e.target.checked)} className="size-4 accent-[#1c1c1f]" />
                Conferido com o dono ({k})
              </label>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

function EditorEstagios({ padrao, porArcano, provisorio, agir }: { padrao: EstagioLimite[]; porArcano: Record<string, EstagioLimite[]>; provisorio: boolean; agir: Agir }) {
  const [linhas, setLinhas] = useState(padrao)
  const [busy, setBusy] = useState(false)
  useEffect(() => setLinhas(padrao), [padrao])
  const set = (i: number, campo: 'minimo' | 'teto', v: string) => setLinhas(linhas.map((l, j) => (j === i ? { ...l, [campo]: Number(v.replace(/\D/g, '').slice(0, 5)) } : l)))
  const ruim = linhas.some((l) => !(l.teto > 0) || l.minimo > l.teto)
  return (
    <RecordPanel title="Limites por Estágio" jp="段階" headerRight={<RecTag tone={provisorio ? 'accent' : 'muted'}>{provisorio ? 'Provisório' : 'Final'}</RecTag>}>
      <p className="font-body text-[15px] leading-relaxed text-in-fg-2">
        Mínimo para a Evolução e teto de acúmulo (soma das seis Virtudes). O doc diz que o Arcano define; por ora vale um padrão para todos{Object.keys(porArcano).length ? ` (${Object.keys(porArcano).length} Arcanos com tabela própria)` : ''}.
      </p>
      <table className="mt-3 w-full border-collapse">
        <thead>
          <tr className="font-mono text-[10px] uppercase tracking-[0.12em] text-in-fg-3">
            <th className="py-1 text-left font-normal">Estágio</th>
            <th className="py-1 font-normal">Mínimo</th>
            <th className="py-1 font-normal">Teto</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => (
            <tr key={l.estagio} className="border-t border-in-line">
              <td className="py-1.5 font-impact text-[18px] font-semibold text-in-fg">{l.estagio}</td>
              <td className="px-1 py-1.5">
                <RecInput aria-label={`Mínimo do Estágio ${l.estagio}`} inputMode="numeric" value={String(l.minimo)} onChange={(e) => set(i, 'minimo', e.target.value)} className="h-10 text-center text-[15px]" />
              </td>
              <td className="px-1 py-1.5">
                <RecInput aria-label={`Teto do Estágio ${l.estagio}`} inputMode="numeric" value={String(l.teto)} onChange={(e) => set(i, 'teto', e.target.value)} className="h-10 text-center text-[15px]" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex flex-wrap gap-2">
        <RecButton
          size="sm"
          variant="secondary"
          onClick={() => {
            const u = linhas[linhas.length - 1]
            setLinhas([...linhas, { estagio: u.estagio + 1, minimo: Math.round(u.minimo * 1.4), teto: Math.round(u.teto * 1.35) }])
          }}
        >
          Mais um Estágio
        </RecButton>
        <RecButton
          size="sm"
          disabled={ruim}
          loading={busy}
          onClick={async () => {
            setBusy(true)
            await agir({ action: 'estagios', value: { padrao: linhas, porArcano }, provisorio: true }, 'Limites gravados.')
            setBusy(false)
          }}
        >
          Gravar limites
        </RecButton>
      </div>
    </RecordPanel>
  )
}
