'use client'

import { useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { CLASSIFICACAO_ROTULO, type CorpLiberado, type CorpResumo, formatMin, normalizarCodigo } from '@/lib/devo/corporacoes'
import { cn } from '@/lib/utils'
import { Button } from '../kit/button'
import { GlyphCheck, GlyphClose, GlyphHourglass } from '../kit/glyphs'
import { Sheet } from '../kit/sheet'
import { Painel } from './painel'
import { SeloCompanhia } from './holograma'
import { BrasaoCorp, NichoBrasao } from './brasao'
import { corpGet } from './dados'
import { FundarSheet } from './fundar'
import { Erro, Placa, Selo, Vazio, dataCurta } from './ui'

type Agir = (b: Record<string, unknown>) => Promise<unknown>

/** Sem Corporação: campo do código (herói), pedido em espera, convites recebidos e fundação. */
export function SemCorp({ d, agir }: { d: CorpLiberado; agir: Agir }) {
  return (
    <div className="flex flex-col gap-5">
      {d.pedido ? <PedidoEnviado d={d} agir={agir} /> : <EntradaCodigo agir={agir} bloqueado={!!d.criacao.pendente} />}
      {d.convites.length > 0 && <Convites d={d} agir={agir} />}
      <Fundar d={d} agir={agir} />
    </div>
  )
}

function EntradaCodigo({ agir, bloqueado }: { agir: Agir; bloqueado: boolean }) {
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [previa, setPrevia] = useState<CorpResumo | null>(null)
  const consultar = async () => {
    setOcupado(true)
    setErro(null)
    try {
      const r = await corpGet<{ corporacao: CorpResumo }>(`/api/corporacoes?codigo=${encodeURIComponent(normalizarCodigo(codigo))}`)
      playSfx('open')
      setPrevia(r.corporacao)
    } catch (e) {
      playSfx('error')
      setErro((e as Error).message)
    } finally {
      setOcupado(false)
    }
  }
  return (
    <Painel as="section" edge="steel" cut={16} glow aria-label="Código de identificação" innerClassName="p-5">
      <div className="-mx-1 mb-4 flex items-center gap-2 border-b border-dv-line pb-3">
        <SeloCompanhia className="size-5 shrink-0" />
        <p className="min-w-0 flex-1 truncate font-mono text-[10px] uppercase tracking-[0.2em] text-dv-text-3">Terminal da Companhia</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-dv-amethyst-text">Entrada</p>
      </div>
      <p className="dv-label text-[10px] text-dv-gold">Entrar numa Corporação</p>
      <h2 className="mt-1.5 font-display text-[22px] font-semibold uppercase leading-tight tracking-[0.08em] text-dv-text">Código de identificação</h2>
      <p className="mt-2 font-body text-[15px] leading-relaxed text-dv-text-2">
        Insira o código da Corporação. O líder ou o vice-líder aprova a sua entrada e, durante o processo, vê partes do seu perfil.
      </p>
      <ol aria-label="Etapas" className="mt-4 grid grid-cols-3 gap-1.5">
        {['Código', 'Pedido', 'Aprovação'].map((t, i) => (
          <li key={t} className="flex flex-col items-center gap-1.5">
            <span className="flex w-full items-center">
              <span aria-hidden="true" className={cn('h-px flex-1', i === 0 ? 'bg-transparent' : 'bg-[rgb(var(--dv-champagne-rgb)/0.3)]')} />
              <span className={cn('grid size-6 rotate-45 place-items-center shadow-[inset_0_0_0_1px_rgb(var(--dv-champagne-rgb)/0.6)]', i === 0 && 'bg-[rgb(var(--dv-amethyst-rgb)/0.35)] shadow-[inset_0_0_0_1px_var(--dv-amethyst-text)]')}>
                <span className="-rotate-45 font-mono text-[11px] text-dv-text">{i + 1}</span>
              </span>
              <span aria-hidden="true" className={cn('h-px flex-1', i === 2 ? 'bg-transparent' : 'bg-[rgb(var(--dv-champagne-rgb)/0.3)]')} />
            </span>
            <span className={cn('font-mono text-[10px] uppercase tracking-[0.16em]', i === 0 ? 'text-dv-text' : 'text-dv-text-3')}>{t}</span>
          </li>
        ))}
      </ol>
      <form
        className="mt-4 flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          if (codigo.trim() && !ocupado) void consultar()
        }}
      >
        <label htmlFor="corp-codigo" className="sr-only">
          Código de identificação
        </label>
        <span className="relative block">
          {/* colchetes de mira nas pontas do campo */}
          <span aria-hidden="true" className="pointer-events-none absolute -left-1 -top-1 size-3 border-l border-t border-dv-amethyst-text/70" />
          <span aria-hidden="true" className="pointer-events-none absolute -right-1 -top-1 size-3 border-r border-t border-dv-amethyst-text/70" />
          <span aria-hidden="true" className="pointer-events-none absolute -bottom-1 -left-1 size-3 border-b border-l border-dv-amethyst-text/70" />
          <span aria-hidden="true" className="pointer-events-none absolute -bottom-1 -right-1 size-3 border-b border-r border-dv-amethyst-text/70" />
        <input
          id="corp-codigo"
          value={codigo}
          onChange={(e) => {
            setCodigo(e.target.value.toUpperCase().slice(0, 16))
            setErro(null)
          }}
          placeholder="CRP-XXXX-XXXX"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          disabled={bloqueado}
          aria-invalid={!!erro}
          className={cn(
            'h-14 w-full bg-black/55 px-4 text-center font-mono text-[22px] uppercase tracking-[0.18em] text-dv-text outline-none placeholder:text-dv-text-3/70 disabled:opacity-50',
            erro ? 'shadow-[inset_0_0_0_1px_var(--dv-blood)]' : 'shadow-[inset_0_0_0_1px_rgba(186,176,159,0.55)] focus:shadow-[inset_0_0_0_1px_var(--dv-amethyst-text),0_0_18px_rgb(var(--dv-amethyst-rgb)/0.25)]',
          )}
        />
        </span>
        {erro && <Erro>{erro}</Erro>}
        {bloqueado && <p className="font-body text-[14px] text-dv-text-2">Enquanto a sua fundação estiver em análise, não é possível pedir entrada em outra Corporação.</p>}
        <Button type="submit" block loading={ocupado} disabled={!codigo.trim() || bloqueado}>
          Consultar código
        </Button>
      </form>
      <PreviaSheet corp={previa} onClose={() => setPrevia(null)} agir={agir} />
    </Painel>
  )
}

function PreviaSheet({ corp, onClose, agir }: { corp: CorpResumo | null; onClose: () => void; agir: Agir }) {
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const necro = corp?.classificacao === 'necro'
  return (
    <Sheet
      open={!!corp}
      onClose={() => {
        setErro(null)
        onClose()
      }}
      kicker="Código encontrado"
      title={corp?.nome ?? ''}
      tone={necro ? 'alert' : 'ink'}
      footer={
        <div className="flex flex-col gap-2">
          {erro && <Erro>{erro}</Erro>}
          <Button
            block
            variant={necro ? 'danger' : 'primary'}
            loading={ocupado}
            onClick={async () => {
              if (!corp) return
              setOcupado(true)
              setErro(null)
              try {
                await agir({ action: 'entrar', codigo: corp.codigo })
                playSfx('confirm')
                onClose()
              } catch (e) {
                playSfx('error')
                setErro((e as Error).message)
              } finally {
                setOcupado(false)
              }
            }}
          >
            Enviar pedido
          </Button>
        </div>
      }
    >
      {corp && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <NichoBrasao brasao={corp.brasao} necro={necro} tamanho={100} title={`Brasão de ${corp.nome}`} />
            <div className="min-w-0">
              <Selo tom={necro ? 'rubi' : 'aco'}>{CLASSIFICACAO_ROTULO[corp.classificacao]}</Selo>
              {corp.lema && <p className="mt-2 font-body text-[15px] italic leading-snug text-dv-text-2">“{corp.lema}”</p>}
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-dv-text-2">
                {corp.membros} {corp.membros === 1 ? 'membro' : 'membros'} · {corp.codigo}
              </p>
            </div>
          </div>
          {necro && (
            <p role="alert" className="border-l-2 border-dv-blood pl-3 font-body text-[15px] leading-relaxed text-dv-blood-text">
              A Companhia de Despertados classificou esta Corporação como terrorista. Entrar numa Necro-Corporação é por sua conta e risco.
            </p>
          )}
          <p className="font-body text-[15px] leading-relaxed text-dv-text-2">
            O líder ou o vice-líder verá o nome do seu personagem, desde quando você está no DEVO, sua participação em Deadly Votes, quantas cartas tem e a sua segunda aparência.
          </p>
        </div>
      )}
    </Sheet>
  )
}

function PedidoEnviado({ d, agir }: { d: CorpLiberado; agir: Agir }) {
  const p = d.pedido!
  const [ocupado, setOcupado] = useState(false)
  const necro = p.corporacao.classificacao === 'necro'
  return (
    <Painel as="section" edge={necro ? 'blood' : 'steel'} cut={16} glow aria-label="Pedido de entrada enviado" innerClassName="p-5">
      <div className="flex items-start gap-4">
        <BrasaoCorp brasao={p.corporacao.brasao} necro={necro} className="h-[96px] w-[78px] shrink-0" />
        <div className="min-w-0 flex-1">
          <Selo tom="ametista">Pedido enviado</Selo>
          <h2 className="mt-2 break-words font-display text-[20px] font-semibold uppercase leading-tight tracking-[0.06em] text-dv-text">{p.corporacao.nome}</h2>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-dv-text-3">
            {p.origem === 'convite' ? 'Por convite' : 'Pelo código'} · {dataCurta(p.createdAt)}
          </p>
        </div>
      </div>
      <p className="mt-4 flex items-center gap-2 font-body text-[15px] leading-relaxed text-dv-text-2">
        <GlyphHourglass aria-hidden="true" className="size-4 shrink-0 text-dv-gold" />
        Aguardando o líder ou o vice-líder aprovar a sua entrada.
      </p>
      <Button
        variant="secondary"
        size="sm"
        className="mt-4"
        loading={ocupado}
        onClick={async () => {
          setOcupado(true)
          try {
            await agir({ action: 'pedido.cancelar', id: p.id })
            playSfx('close')
          } catch {
            playSfx('error')
          } finally {
            setOcupado(false)
          }
        }}
      >
        Cancelar pedido
      </Button>
    </Painel>
  )
}

function Convites({ d, agir }: { d: CorpLiberado; agir: Agir }) {
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const responder = async (id: string, aceitar: boolean) => {
    setOcupado(`${id}:${aceitar}`)
    setErro(null)
    try {
      await agir({ action: 'convite.responder', id, aceitar })
      playSfx(aceitar ? 'confirm' : 'close')
    } catch (e) {
      playSfx('error')
      setErro((e as Error).message)
    } finally {
      setOcupado(null)
    }
  }
  return (
    <Placa titulo="Convites" legenda="De Records que já fazem parte de uma Corporação">
      {erro && (
        <div className="mb-3">
          <Erro>{erro}</Erro>
        </div>
      )}
      <ul className="flex flex-col">
        {d.convites.map((v) => (
          <li key={v.id} aria-label={`Convite de ${v.corporacao.nome}`} className="flex flex-col gap-3 border-b border-dv-line py-3 first:pt-0 last:border-b-0 last:pb-0">
            <div className="flex items-center gap-3">
              <BrasaoCorp brasao={v.corporacao.brasao} necro={v.corporacao.classificacao === 'necro'} className="h-14 w-11 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="break-words font-display text-[16px] font-semibold uppercase leading-tight tracking-[0.06em] text-dv-text">{v.corporacao.nome}</p>
                <p className="mt-1 font-body text-[14px] text-dv-text-2">
                  {v.de ? `${v.de} convidou você` : 'Convite da Corporação'} · {v.direto ? 'entrada direta' : 'passa pelo líder'}
                </p>
              </div>
              {v.corporacao.classificacao === 'necro' && <Selo tom="rubi">Necro</Selo>}
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" loading={ocupado === `${v.id}:true`} onClick={() => responder(v.id, true)} icon={<GlyphCheck className="size-4" />}>
                Aceitar
              </Button>
              <Button size="sm" variant="secondary" className="flex-1" loading={ocupado === `${v.id}:false`} onClick={() => responder(v.id, false)} icon={<GlyphClose className="size-4" />}>
                Recusar
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Placa>
  )
}

function Fundar({ d, agir }: { d: CorpLiberado; agir: Agir }) {
  const [aberto, setAberto] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const c = d.criacao
  return (
    <Placa
      titulo="Fundar uma Corporação"
      legenda={`Tempo + aprovação legal${c.provisorio ? ' · valores provisórios' : ''}`}
      direita={
        !c.pendente && (
          <svg aria-hidden="true" viewBox="0 0 100 124" className="-mt-1 h-12 w-10 shrink-0">
            <path d="M50 10L86 22V58Q86 94 50 112Q14 94 14 58V22Z" fill="rgb(var(--dv-amethyst-rgb) / 0.08)" stroke="#bab09f" strokeOpacity="0.55" strokeWidth="2.4" strokeDasharray="6 6" />
            <path d="M50 46v30M35 61h30" stroke="#bab09f" strokeOpacity="0.6" strokeWidth="3" strokeLinecap="round" />
          </svg>
        )
      }
    >
      {c.pendente ? (
        <div aria-label="Fundação em análise" className="flex items-start gap-4">
          <BrasaoCorp brasao={c.pendente.brasao} className="h-[88px] w-[72px] shrink-0 opacity-90" />
          <div className="min-w-0 flex-1">
            <Selo tom="ametista">Em análise</Selo>
            <p className="mt-2 break-words font-display text-[17px] font-semibold uppercase leading-tight tracking-[0.06em] text-dv-text">{c.pendente.nome}</p>
            <p className="mt-1 font-body text-[14px] leading-snug text-dv-text-2">
              A Companhia avalia o seu perfil. Pago: {formatMin(c.pendente.custo)}. Se recusarem, o Tempo volta.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 -ml-3"
              loading={ocupado}
              onClick={async () => {
                setOcupado(true)
                try {
                  await agir({ action: 'fundacao.cancelar' })
                  playSfx('close')
                } catch {
                  playSfx('error')
                } finally {
                  setOcupado(false)
                }
              }}
            >
              Desistir da fundação
            </Button>
          </div>
        </div>
      ) : (
        <>
          {c.recusada && (
            <p role="status" className="mb-3 border-l-2 border-dv-line-strong pl-3 font-body text-[14px] leading-snug text-dv-text-2">
              A Companhia recusou “{c.recusada.nome}”{c.recusada.nota ? `: ${c.recusada.nota}` : '.'} {c.recusada.devolvido ? 'O Tempo foi devolvido.' : ''}
            </p>
          )}
          <dl aria-label="Requisitos do perfil" className="flex flex-col">
            {c.requisitos.map((r) => (
              <div key={r.id} className="flex min-h-10 items-center justify-between gap-3 border-b border-dv-line py-1.5 last:border-b-0">
                <dt className="flex items-center gap-2 font-body text-[15px] text-dv-text-2">
                  <span aria-hidden="true" className={cn('grid size-5 place-items-center', r.ok ? 'text-dv-amethyst-text' : 'text-dv-text-3')}>
                    {r.ok ? <GlyphCheck className="size-4" /> : <span className="size-2 rotate-45 shadow-[inset_0_0_0_1.5px_currentColor]" />}
                  </span>
                  {r.rotulo}
                </dt>
                <dd className="flex items-center gap-2.5">
                  <span aria-hidden="true" className="hidden h-[3px] w-14 bg-white/[0.07] min-[360px]:block">
                    <span className={cn('block h-full', r.ok ? 'bg-dv-amethyst-text' : 'bg-dv-blood')} style={{ width: `${Math.min(100, (r.atual / Math.max(1, r.exigido)) * 100)}%` }} />
                  </span>
                  <span className={cn('font-mono text-[13px] dv-tabular', r.ok ? 'text-dv-text' : 'text-dv-blood-text')}>
                    {Math.min(r.atual, 999)}/{r.exigido}
                  </span>
                </dd>
              </div>
            ))}
            {!c.requisitos.length && <Vazio titulo="Sem requisitos">A Companhia não exige nada além do Tempo por enquanto.</Vazio>}
          </dl>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dv-text-2">Investimento</span>
            <span className="flex items-center gap-1.5 font-impact text-[22px] font-semibold leading-none text-dv-text dv-tabular" aria-label={`Custo: ${formatMin(c.custo)}`}>
              <GlyphHourglass aria-hidden="true" className="size-4 text-dv-gold" />
              {formatMin(c.custo)}
            </span>
          </div>
          <div className="mt-3">
            <Button
              block
              variant={c.atende ? 'primary' : 'secondary'}
              disabled={!!d.pedido}
              onClick={() => {
                playSfx('open')
                setAberto(true)
              }}
            >
              Fundar
            </Button>
          </div>
          {!c.atende && <p className="mt-2 font-body text-[14px] text-dv-text-2">Seu perfil ainda não atende a todos os requisitos.</p>}
        </>
      )}
      <FundarSheet open={aberto} onClose={() => setAberto(false)} criacao={c} agir={agir} />
    </Placa>
  )
}

