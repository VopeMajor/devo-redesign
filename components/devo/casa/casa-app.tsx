'use client'

import { type CSSProperties, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { getCard, RARITY_META } from '@/lib/devo/cards'
import {
  ALVOS_RARIDADE,
  type CasaLiberado,
  chaveMateriais,
  COMBINACAO_MAX,
  formatMinutos,
  nomeCarta,
  RECEITA_RARIDADE,
  type Tentativa,
} from '@/lib/devo/confeccao'
import { PACOTES, PACOTES_TEXTO, type PacotePremio } from '@/lib/devo/pacotes'
import type { OwnedCard, Rarity } from '@/lib/devo/types'
import { cn } from '@/lib/utils'
import { Button, Spinner } from '../kit/button'
import { EmblemCasa, EmblemMark } from '../kit/emblems'
import { Dialog } from '../kit/sheet'
import { Tabs } from '../kit/tabs'
import { GlyphArrow } from '../kit/glyphs'
import { CasaNoite } from '../dialogo/casa-noite'
import { useBackHandler } from '../use-back-handler'
import { CardFace, DevoCard, RarityGem } from '../shared/devo-card'
import { useDevo } from '../state/devo-store'
import { useCasa } from './dados'

/**
 * CASA (texto do dono: docs/redesign/CASA-CONFECCAO-dono.md). Por enquanto, dois cômodos:
 *  · Confecção de Cartas: mesa (nível, chance, espaços), fabricação por raridade ou por combinação, andamento,
 *    Livro de Receitas (suas e da sua Corporação) e histórico.
 *  · Pacotes: abrir os pacotes do inventário, com o centro de informações (chances).
 * Tudo decidido no servidor (/api/casa); a tela só escolhe as cartas e mostra.
 */

type Aba = 'confeccao' | 'pacotes' | 'livro' | 'historico'

export function CasaApp() {
  const { data, error, isLoading, mutate, agir, resgatar } = useCasa()
  if (!data) {
    return (
      <Fundo>
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
          {error ? (
            <>
              <p role="alert" className="font-body text-[16px] text-dv-text-2">
                {(error as Error).message}
              </p>
              <Button variant="secondary" size="sm" onClick={() => mutate()}>
                Tentar de novo
              </Button>
            </>
          ) : (
            <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-dv-text-3">
              {isLoading && <Spinner className="size-5" />}
              Abrindo a porta…
            </p>
          )}
        </div>
      </Fundo>
    )
  }
  if (!data.liberado) return <Trancado motivo={data.motivo} />
  return <Comodos d={data} agir={agir} resgatar={resgatar} />
}

/* ------------------------------------------------------------------ A casa (cômodos) */

/**
 * A mesma casa por onde o Galo entra (cenário `casa-noite`). Deslizando para o lado (no celular) ou pela seta
 * discreta (no computador), aparecem os fundos com a mesa de confecção; tocar na mesa abre a Confecção.
 */
function Comodos({ d, agir, resgatar }: { d: CasaLiberado; agir: Agir; resgatar: Resgatar }) {
  const [aberta, setAberta] = useState(false)
  const [quadro, setQuadro] = useState(0)
  const trilho = useRef<HTMLDivElement>(null)
  useBackHandler(aberta, () => setAberta(false))
  const ir = (i: number) => {
    const el = trilho.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }
  if (aberta)
    return (
      <Fundo>
        <div className="flex h-full flex-col">
          <button type="button" onClick={() => setAberta(false)} className="dv-focus flex min-h-11 shrink-0 items-center gap-2 px-4 pt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-dv-gold">
            <GlyphArrow className="size-3.5 rotate-180" /> Voltar para a casa
          </button>
          <div className="min-h-0 flex-1">
            <Tela d={d} agir={agir} resgatar={resgatar} />
          </div>
        </div>
      </Fundo>
    )
  const pendentes = d.andamento.length
  return (
    <div className="relative h-full overflow-hidden bg-black">
      <div
        ref={trilho}
        role="group"
        aria-roledescription="carrossel"
        aria-label="Cômodos da casa"
        onScroll={(e) => {
          const el = e.currentTarget
          setQuadro(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)))
        }}
        className="flex h-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <section aria-label="Sala" className="relative h-full w-full shrink-0 snap-start">
          <CasaNoite portaAberta={false} anima={false} fxKey={0} luzFalha={false} />
          <p className="absolute inset-x-0 top-5 px-6 text-center font-body text-[15px] italic text-dv-text-2">Sua casa. Silenciosa, por enquanto.</p>
          <p aria-hidden="true" className="casa-dica absolute bottom-[9%] right-5 flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-dv-text-3 [@media(hover:hover)]:hidden">
            Deslize <GlyphArrow className="size-3" />
          </p>
        </section>
        <section aria-label="Fundos" className="relative h-full w-full shrink-0 snap-start">
          <Fundos />
          <button
            type="button"
            onClick={() => {
              playSfx('open')
              setAberta(true)
            }}
            aria-label={`Mesa de confecção${pendentes ? `: ${pendentes} em andamento` : ''}`}
            className="dv-focus group absolute bottom-[22%] left-1/2 w-[min(78%,340px)] -translate-x-1/2"
          >
            <MesaConfeccao className="w-full transition-[filter] duration-200 group-hover:brightness-125 group-active:brightness-150" />
            {pendentes > 0 && (
              <span className="absolute -top-1 right-[12%] grid min-w-6 place-items-center rounded-full bg-dv-amethyst px-1.5 font-mono text-[11px] text-white shadow-[0_0_10px_var(--dv-amethyst)]">{pendentes}</span>
            )}
            <span className="mt-3 block text-center font-display text-[15px] font-semibold uppercase tracking-[0.12em] text-dv-text">Mesa de confecção</span>
            <span className="block text-center font-mono text-[10px] uppercase tracking-[0.16em] text-dv-text-3">Toque para usar</span>
          </button>
        </section>
      </div>
      {/* seta discreta no computador (no celular, o arrasto) */}
      <button
        type="button"
        onClick={() => ir(quadro === 0 ? 1 : 0)}
        aria-label={quadro === 0 ? 'Ir para os fundos da casa' : 'Voltar para a sala'}
        className={cn(
          'dv-focus absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 place-items-center text-dv-text-3 opacity-60 transition-opacity hover:opacity-100 [@media(hover:hover)]:grid',
          quadro === 0 ? 'right-2' : 'left-2',
        )}
      >
        <GlyphArrow className={cn('size-5', quadro !== 0 && 'rotate-180')} />
      </button>
      <style>{CASA_CSS}</style>
    </div>
  )
}

const CASA_CSS = `
.casa-dica{animation:casa-dica 2.4s ease-in-out infinite}
@keyframes casa-dica{0%,100%{transform:translateX(0);opacity:.55}50%{transform:translateX(6px);opacity:1}}
@media (prefers-reduced-motion: reduce){.casa-dica{animation:none}}
`

/** Fundos da casa: a mesma parede e o mesmo chão da sala, com o lampião baixo sobre a mesa. */
function Fundos() {
  return (
    <div className="absolute inset-0 bg-[linear-gradient(180deg,#141418,#1b1a1e_55%,#0e0e10)]">
      <span className="absolute inset-0 opacity-[0.07] bg-[repeating-linear-gradient(90deg,#ece5d8_0_1px,transparent_1px_26px)]" />
      {/* lampião pendurado e a luz quente que ele joga na parede */}
      <span className="absolute left-1/2 top-0 h-[18%] w-px -translate-x-1/2 bg-[#3a3833]" />
      <span className="absolute left-1/2 top-[18%] size-5 -translate-x-1/2 rounded-b-full bg-[#d6c49a] shadow-[0_0_30px_10px_rgba(214,196,154,0.35)]" />
      <span className="absolute inset-x-0 top-[12%] h-[70%] bg-[radial-gradient(45%_55%_at_50%_20%,rgba(214,196,154,0.16),transparent_70%)]" />
      {/* quadro torto na parede */}
      <span className="absolute left-[10%] top-[24%] h-[14%] w-[20%] -rotate-3 shadow-[inset_0_0_0_3px_#2a2a2e] bg-[linear-gradient(160deg,rgba(186,176,159,0.08),transparent)]" />
      <span className="absolute inset-x-0 bottom-0 h-[30%] bg-[linear-gradient(180deg,#121114,#08080a)] shadow-[0_-1px_0_rgba(186,176,159,0.18)]" />
      <span className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_40%,transparent_45%,rgba(0,0,0,0.7))]" />
    </div>
  )
}

/** A mesa de confecção pintada (infra/arte `casa-mesa-confeccao` v02, sem fundo), com a luz da vela por trás. */
function MesaConfeccao({ className }: { className?: string }) {
  return (
    <span className={cn('relative block', className)}>
      <span aria-hidden="true" className="absolute inset-x-[10%] bottom-[6%] h-[18%] rounded-[50%] bg-black/70 blur-md" />
      <span aria-hidden="true" className="absolute left-[60%] top-[8%] size-[30%] rounded-full bg-[radial-gradient(closest-side,rgba(243,226,176,0.28),transparent)]" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/casa/mesa-768.webp"
        srcSet="/images/casa/mesa-512.webp 512w, /images/casa/mesa-768.webp 768w, /images/casa/mesa-1024.webp 1024w, /images/casa/mesa-1536.webp 1536w"
        sizes="(min-width: 768px) 420px, 80vw"
        alt=""
        className="relative w-full drop-shadow-[0_10px_18px_rgba(0,0,0,0.6)]"
      />
    </span>
  )
}

type Agir = ReturnType<typeof useCasa>['agir']
type Resgatar = ReturnType<typeof useCasa>['resgatar']

/* ------------------------------------------------------------------ Moldura */

/** Interior da casa: madeira escura sob o mármore, luz quente de lampião no alto. */
function Fundo({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-full overflow-hidden bg-dv-ink">
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[url(/images/os/marmore-negro.webp)] bg-[length:560px_560px] opacity-30" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[45%] bg-[radial-gradient(60%_55%_at_50%_0%,color-mix(in_srgb,var(--dv-champagne)_22%,transparent),transparent_72%)]" />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  )
}

function Lamina({ children, className, ariaLabel }: { children: ReactNode; className?: string; ariaLabel?: string }) {
  return (
    <section aria-label={ariaLabel} className={cn('relative isolate', className)} style={{ '--dv-cut': '12px' } as CSSProperties}>
      <span aria-hidden="true" className="dv-cut absolute inset-0 -z-10 bg-[linear-gradient(135deg,var(--dv-champagne),var(--dv-ink-4)_45%,var(--dv-champagne))] opacity-60" />
      <span aria-hidden="true" className="dv-cut absolute inset-px -z-10 bg-[linear-gradient(180deg,var(--dv-ink-2),var(--dv-ink))]" style={{ '--dv-cut': '11.6px' } as CSSProperties} />
      {children}
    </section>
  )
}

function Rotulo({ children }: { children: ReactNode }) {
  return <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-dv-text-3">{children}</p>
}

function Trancado({ motivo }: { motivo: string }) {
  return (
    <Fundo>
      <div className="flex h-full flex-col justify-end px-4 pb-6">
        <Lamina ariaLabel="Casa: trancada" className="animate-dv-rise">
          <div className="flex items-start gap-4 p-5">
            <EmblemMark emblem={EmblemCasa} size={56} state="locked" />
            <div className="min-w-0 flex-1">
              <p className="dv-label text-[10px] text-dv-text-3">Porta trancada</p>
              <h2 className="mt-1 font-display text-[20px] font-semibold uppercase tracking-[0.08em] text-dv-text">Casa</h2>
              <p className="mt-2 font-body text-[15.5px] leading-relaxed text-dv-text-2">{motivo}</p>
            </div>
          </div>
        </Lamina>
      </div>
    </Fundo>
  )
}

/* ------------------------------------------------------------------ Tela */

function Tela({ d, agir, resgatar }: { d: CasaLiberado; agir: Agir; resgatar: Resgatar }) {
  const [aba, setAba] = useState<Aba>('confeccao')
  const pacotes = d.pacotes.reduce((s, p) => s + p.quantidade, 0)
  return (
    <div className="devo-scroll h-full overflow-y-auto overflow-x-hidden pb-10">
      <div className="sticky top-0 z-20 bg-dv-ink/90 px-2 backdrop-blur-[2px]">
        <Tabs
          label="Cômodos da casa"
          value={aba}
          onValueChange={setAba}
          items={[
            { value: 'confeccao', label: 'Confecção', count: d.andamento.length || undefined },
            { value: 'pacotes', label: 'Pacotes', count: pacotes || undefined },
            { value: 'livro', label: 'Receitas' },
            { value: 'historico', label: 'Histórico' },
          ]}
        />
      </div>
      <div className="flex flex-col gap-5 px-4 pt-4">
        {aba === 'confeccao' && <Confeccao d={d} agir={agir} />}
        {aba === 'pacotes' && <Pacotes d={d} agir={agir} resgatar={resgatar} />}
        {aba === 'livro' && <Livro d={d} />}
        {aba === 'historico' && <Historico d={d} />}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Confecção */

function Confeccao({ d, agir }: { d: CasaLiberado; agir: Agir }) {
  const [como, setComo] = useState(false)
  return (
    <>
      <Mesa d={d} agir={agir} />
      {d.andamento.length > 0 && (
        <section aria-label="Em andamento" className="flex flex-col gap-2">
          <Rotulo>Em andamento</Rotulo>
          {d.andamento.map((t) => (
            <Andamento key={t.id} t={t} agora={d.agora} />
          ))}
        </section>
      )}
      <NovaFabricacao d={d} agir={agir} />
      <div>
        <button type="button" onClick={() => setComo((v) => !v)} aria-expanded={como} className="dv-focus min-h-11 font-mono text-[11px] uppercase tracking-[0.18em] text-dv-gold">
          {como ? 'Fechar' : 'Como funciona a Confecção'}
        </button>
        {como && <ComoFunciona />}
      </div>
    </>
  )
}

function Mesa({ d, agir }: { d: CasaLiberado; agir: Agir }) {
  const [confirmar, setConfirmar] = useState(false)
  const [busy, setBusy] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const m = d.mesa
  const usados = d.andamento.length
  const aprimorar = async () => {
    if (!m.proximo) return
    setBusy(true)
    setErro(null)
    try {
      await agir({ action: 'mesa.aprimorar', para: m.proximo.nivel })
      playSfx('confirm')
      setConfirmar(false)
    } catch (e) {
      playSfx('error')
      setErro((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Lamina ariaLabel="Mesa de confecção">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Rotulo>Mesa de confecção</Rotulo>
            <p className="mt-1 font-display text-[26px] font-semibold leading-none text-dv-text">Nível {m.nivel}</p>
          </div>
          <div className="text-right">
            <p className="font-impact text-[30px] font-semibold leading-none text-dv-gold-bright dv-tabular">{m.chance}%</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-dv-text-3">chance de sucesso</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2" aria-label={`Espaços: ${usados} de ${m.espacos} em uso`}>
          {Array.from({ length: m.espacos }, (_, i) => (
            <span key={i} aria-hidden="true" className={cn('h-2 flex-1 max-w-16', i < usados ? 'bg-dv-amethyst shadow-[0_0_6px_var(--dv-amethyst)]' : 'bg-dv-ink-4')} />
          ))}
          <span className="ml-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-dv-text-2">
            {usados}/{m.espacos} {m.espacos === 1 ? 'espaço' : 'espaços'}
          </span>
        </div>
        {m.proximo ? (
          <div className="mt-4">
            <Button variant="secondary" size="sm" block onClick={() => setConfirmar(true)}>
              Aprimorar para o nível {m.proximo.nivel}
            </Button>
            <p className="mt-2 font-body text-[13.5px] text-dv-text-2">
              {m.proximo.chance}% de chance{m.proximo.espacos > m.espacos ? ` · ${m.proximo.espacos} espaços` : ''} · custa {formatMinutos(m.proximo.minutos)} de Tempo
            </p>
          </div>
        ) : (
          <p className="mt-4 font-body text-[14px] italic text-dv-text-2">A mesa está no nível máximo.</p>
        )}
      </div>
      <Dialog
        open={confirmar}
        onClose={() => setConfirmar(false)}
        title={`Aprimorar para o nível ${m.proximo?.nivel ?? ''}`}
        description={m.proximo ? `Custa ${formatMinutos(m.proximo.minutos)} do seu Tempo. A chance das próximas fabricações sobe para ${m.proximo.chance}%; as que já estão na mesa continuam com a chance de quando começaram.` : undefined}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirmar(false)}>
              Agora não
            </Button>
            <Button size="sm" loading={busy} onClick={aprimorar}>
              Aprimorar
            </Button>
          </>
        }
      >
        {erro && (
          <p role="alert" className="font-body text-[14px] text-dv-blood-bright">
            {erro}
          </p>
        )}
      </Dialog>
    </Lamina>
  )
}

/** Contagem regressiva da tentativa. O relógio de 1s vive só aqui (não re-renderiza a tela toda). */
function Andamento({ t, agora }: { t: Tentativa; agora: number }) {
  const [now, setNow] = useState(() => Date.now())
  const desvio = useMemo(() => agora - Date.now(), [agora])
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])
  const falta = Math.max(0, t.prontaEm - (now + desvio))
  const h = Math.floor(falta / 3_600_000)
  const mm = Math.floor((falta % 3_600_000) / 60_000)
  const ss = Math.floor((falta % 60_000) / 1000)
  const total = Math.max(1, t.prontaEm - t.criadaEm)
  const p = Math.min(1, 1 - falta / total)
  return (
    <div className="relative overflow-hidden bg-dv-ink-2 p-3 shadow-[inset_0_0_0_1px_var(--dv-line-gold)]">
      <span aria-hidden="true" className="absolute inset-y-0 left-0 bg-dv-amethyst/15" style={{ width: `${p * 100}%` }} />
      <div className="relative flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-body text-[15px] text-dv-text">{tituloTentativa(t)}</p>
          <p className="truncate font-mono text-[10.5px] uppercase tracking-[0.12em] text-dv-text-3">
            {t.materiais.length} cartas · {t.modo === 'experimento' ? 'combinação' : `${t.chance}% de chance`}
          </p>
        </div>
        <p className="shrink-0 font-impact text-[20px] font-semibold text-dv-gold-bright dv-tabular" aria-label={falta ? 'Tempo para terminar' : 'Pronta'}>
          {falta ? `${h ? `${h}:` : ''}${String(mm).padStart(h ? 2 : 1, '0')}:${String(ss).padStart(2, '0')}` : 'Pronta'}
        </p>
      </div>
    </div>
  )
}

function tituloTentativa(t: Tentativa) {
  if (t.modo === 'raridade' && t.alvo) return `Uma carta ${RARITY_META[t.alvo].label}`
  if (t.modo === 'receita') return 'Combinação especial'
  return 'Combinação'
}

/* ------------------------------------------------------------------ Nova fabricação */

type Modo = 'raridade' | 'combinacao'

/** Cartas do inventário agrupadas por id (as cópias são intercambiáveis para a mesa). */
function useGrupos(filtro?: (r: Rarity) => boolean) {
  const { state } = useDevo()
  return useMemo(() => {
    const m = new Map<string, OwnedCard[]>()
    for (const c of state.inventory) {
      let r: Rarity
      try {
        r = getCard(c.cardId).rarity
      } catch {
        continue
      }
      if (filtro && !filtro(r)) continue
      const l = m.get(c.cardId) ?? []
      l.push(c)
      m.set(c.cardId, l)
    }
    return [...m.entries()]
      .map(([cardId, copias]) => ({ cardId, copias }))
      .sort((a, b) => RARITY_META[getCard(a.cardId).rarity].order - RARITY_META[getCard(b.cardId).rarity].order || getCard(a.cardId).name.localeCompare(getCard(b.cardId).name))
  }, [state.inventory, filtro])
}

function NovaFabricacao({ d, agir }: { d: CasaLiberado; agir: Agir }) {
  const [modo, setModo] = useState<Modo>('raridade')
  const [alvo, setAlvo] = useState<Rarity>('incomum')
  const [sel, setSel] = useState<Record<string, number>>({})
  const [confirmar, setConfirmar] = useState(false)
  const [busy, setBusy] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const regra = RECEITA_RARIDADE[alvo]!
  const filtro = useMemo(() => (modo === 'raridade' ? (r: Rarity) => r === regra.de : (r: Rarity) => !RARITY_META[r].secreta), [modo, regra.de])
  const grupos = useGrupos(filtro)
  const { state } = useDevo()
  const contagem = useMemo(() => {
    const out: Partial<Record<Rarity, number>> = {}
    for (const c of state.inventory) {
      try {
        const r = getCard(c.cardId).rarity
        out[r] = (out[r] ?? 0) + 1
      } catch {}
    }
    return out
  }, [state.inventory])

  const total = Object.values(sel).reduce((s, n) => s + n, 0)
  const limite = modo === 'raridade' ? regra.qtd : COMBINACAO_MAX
  const ids = Object.entries(sel).flatMap(([id, n]) => Array.from({ length: n }, () => id))
  const conhecida = modo === 'combinacao' && ids.length >= 2 ? d.livro.find((r) => chaveMateriais(r.materiais) === chaveMateriais(ids)) : undefined
  const custo = modo === 'raridade' ? d.regras.raridade[alvo] : conhecida ? { minutos: conhecida.minutos, espera: conhecida.espera } : d.regras.experimento
  const lotada = d.andamento.length >= d.mesa.espacos
  const pronto = modo === 'raridade' ? total === regra.qtd : total >= 2
  const trocarModo = (m: Modo) => {
    setModo(m)
    setSel({})
    setErro(null)
  }
  const mudar = (cardId: string, delta: number, max: number) =>
    setSel((s) => {
      const n = Math.max(0, Math.min(max, (s[cardId] ?? 0) + delta))
      if (delta > 0 && total >= limite) return s
      const out = { ...s, [cardId]: n }
      if (!n) delete out[cardId]
      return out
    })
  const automatico = () => {
    // Usa primeiro as cartas com mais cópias (guarda as únicas).
    const out: Record<string, number> = {}
    let falta = regra.qtd
    for (const g of [...grupos].sort((a, b) => b.copias.length - a.copias.length)) {
      if (!falta) break
      const n = Math.min(falta, g.copias.length)
      out[g.cardId] = n
      falta -= n
    }
    setSel(out)
  }
  const fabricar = async () => {
    setBusy(true)
    setErro(null)
    const uids = Object.entries(sel).flatMap(([id, n]) => (grupos.find((g) => g.cardId === id)?.copias ?? []).slice(0, n).map((c) => c.uid))
    try {
      await agir({ action: 'confeccao.iniciar', modo, alvo: modo === 'raridade' ? alvo : undefined, uids, idem: crypto.randomUUID() })
      playSfx('confirm')
      setSel({})
      setConfirmar(false)
      setAviso('As cartas estão na mesa. Volte quando o tempo terminar.')
    } catch (e) {
      playSfx('error')
      setErro((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Lamina ariaLabel="Nova fabricação">
      <div className="p-4">
        <Rotulo>Nova fabricação</Rotulo>
        <div role="radiogroup" aria-label="Tipo de fabricação" className="mt-2 grid grid-cols-2 gap-1.5">
          {(
            [
              ['raridade', 'Por raridade', 'Cartas iguais em raridade'],
              ['combinacao', 'Combinação', 'Receitas exatas'],
            ] as const
          ).map(([v, t, h]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={modo === v}
              onClick={() => trocarModo(v)}
              className={cn('dv-focus min-h-14 px-3 py-2 text-left shadow-[inset_0_0_0_1px_var(--dv-line)]', modo === v ? 'bg-dv-gold/12 shadow-[inset_0_0_0_1px_var(--dv-line-gold)]' : 'hover:bg-white/[0.03]')}
            >
              <span className={cn('block font-display text-[14px] font-semibold uppercase tracking-[0.06em]', modo === v ? 'text-dv-gold-bright' : 'text-dv-text')}>{t}</span>
              <span className="block font-body text-[12.5px] text-dv-text-3">{h}</span>
            </button>
          ))}
        </div>

        {modo === 'raridade' && (
          <div className="mt-4">
            <p className="font-body text-[14px] text-dv-text-2">Carta desejada</p>
            <div role="radiogroup" aria-label="Carta desejada" className="mt-2 grid grid-cols-2 gap-1.5 min-[420px]:grid-cols-4">
              {ALVOS_RARIDADE.map((r) => {
                const rr = RECEITA_RARIDADE[r]!
                const tem = contagem[rr.de] ?? 0
                return (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={alvo === r}
                    onClick={() => {
                      setAlvo(r)
                      setSel({})
                    }}
                    className={cn('dv-focus flex min-h-16 flex-col items-start gap-1 px-2.5 py-2 text-left shadow-[inset_0_0_0_1px_var(--dv-line)]', alvo === r && 'bg-dv-gold/12 shadow-[inset_0_0_0_1px_var(--dv-line-gold)]')}
                  >
                    <span className="flex items-center gap-1.5 font-body text-[14px] text-dv-text">
                      <RarityGem rarity={r} className="h-4 w-3" />
                      {RARITY_META[r].label}
                    </span>
                    <span className={cn('font-mono text-[10px] uppercase tracking-[0.1em]', tem >= rr.qtd ? 'text-dv-text-2' : 'text-dv-text-3')}>
                      {rr.qtd} {RARITY_META[rr.de].plural} · tem {tem}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
        {modo === 'combinacao' && (
          <p className="mt-4 font-body text-[14px] leading-relaxed text-dv-text-2">
            Escolha exatamente as cartas da receita, sem nada a mais. Se a combinação não for receita nenhuma, o Tempo é gasto e as cartas voltam para você.
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-dv-text-2 dv-tabular" aria-live="polite">
            {total}/{modo === 'raridade' ? regra.qtd : `até ${COMBINACAO_MAX}`} escolhidas
          </p>
          {modo === 'raridade' && grupos.length > 0 && (
            <button type="button" onClick={automatico} className="dv-focus min-h-11 font-mono text-[10.5px] uppercase tracking-[0.16em] text-dv-gold">
              Escolher para mim
            </button>
          )}
        </div>
        {grupos.length === 0 ? (
          <p className="mt-2 font-body text-[14px] italic text-dv-text-3">{modo === 'raridade' ? `Você não tem cartas ${RARITY_META[regra.de].plural}.` : 'Você não tem cartas.'}</p>
        ) : (
          <ul className="mt-2 flex max-h-[340px] flex-col gap-1 overflow-y-auto pr-1 devo-scroll">
            {grupos.map((g) => (
              <SeletorCarta key={g.cardId} cardId={g.cardId} copias={g.copias.length} n={sel[g.cardId] ?? 0} cheio={total >= limite} onMudar={(dl) => mudar(g.cardId, dl, g.copias.length)} />
            ))}
          </ul>
        )}

        {conhecida && (
          <p className="mt-3 font-body text-[14px] text-dv-gold-bright">
            Receita do seu livro: vira {nomeCarta(conhecida.resultado)}.
          </p>
        )}
        <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-dv-line pt-3">
          <Info k="Tempo" v={formatMinutos(custo.minutos)} />
          <Info k="Espera" v={formatMinutos(custo.espera)} />
          <Info k="Chance" v={`${d.mesa.chance}%`} />
        </dl>
        {modo === 'combinacao' && !conhecida && total >= 2 && <p className="mt-2 font-body text-[12.5px] italic text-dv-text-3">Se for uma receita que você ainda não conhece, o custo e a espera são os dela.</p>}
        <Button className="mt-4" block disabled={!pronto || lotada} onClick={() => setConfirmar(true)}>
          {lotada ? 'Mesa ocupada' : 'Levar à mesa'}
        </Button>
        {aviso && (
          <p role="status" className="mt-2 font-body text-[14px] text-dv-text-2">
            {aviso}
          </p>
        )}
      </div>
      <Dialog
        open={confirmar}
        onClose={() => setConfirmar(false)}
        title="Sacrificar estas cartas?"
        description={`Você paga ${formatMinutos(custo.minutos)} de Tempo agora e espera ${formatMinutos(custo.espera)}. A chance de sucesso é de ${d.mesa.chance}%. Se falhar, as cartas e o Tempo se perdem.`}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirmar(false)}>
              Voltar
            </Button>
            <Button size="sm" loading={busy} onClick={fabricar}>
              Sacrificar
            </Button>
          </>
        }
      >
        <p className="font-body text-[14px] text-dv-text-2">{ids.map(nomeCarta).join(', ')}</p>
        {erro && (
          <p role="alert" className="mt-2 font-body text-[14px] text-dv-blood-bright">
            {erro}
          </p>
        )}
      </Dialog>
    </Lamina>
  )
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-dv-text-3">{k}</dt>
      <dd className="mt-0.5 truncate font-body text-[15px] text-dv-text dv-tabular">{v}</dd>
    </div>
  )
}

function SeletorCarta({ cardId, copias, n, cheio, onMudar }: { cardId: string; copias: number; n: number; cheio: boolean; onMudar: (d: number) => void }) {
  const c = getCard(cardId)
  return (
    <li className={cn('flex items-center gap-3 px-2 py-1.5', n > 0 ? 'bg-dv-gold/10' : 'bg-white/[0.02]')}>
      <CardFace cardId={cardId} className="w-[38px] shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-body text-[15px] text-dv-text">{c.name}</p>
        <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-dv-text-3">
          <RarityGem rarity={c.rarity} className="h-3 w-2" />
          {RARITY_META[c.rarity].label} · {copias} {copias === 1 ? 'cópia' : 'cópias'}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button type="button" aria-label={`Tirar ${c.name}`} disabled={!n} onClick={() => onMudar(-1)} className="dv-focus grid size-11 place-items-center text-[20px] text-dv-text-2 disabled:opacity-30">
          −
        </button>
        <span className="w-5 text-center font-impact text-[17px] text-dv-text dv-tabular" aria-label={`${n} escolhidas`}>
          {n}
        </span>
        <button type="button" aria-label={`Pôr ${c.name}`} disabled={n >= copias || cheio} onClick={() => onMudar(1)} className="dv-focus grid size-11 place-items-center text-[20px] text-dv-gold disabled:opacity-30">
          +
        </button>
      </div>
    </li>
  )
}

/** Texto do dono, literal (docs/redesign/CASA-CONFECCAO-dono.md), em blocos curtos. */
function ComoFunciona() {
  const P = ({ children }: { children: ReactNode }) => <p className="font-body text-[14.5px] leading-relaxed text-dv-text-2">{children}</p>
  const T = ({ children }: { children: ReactNode }) => <p className="mt-2 font-display text-[13px] font-semibold uppercase tracking-[0.08em] text-dv-gold-bright">{children}</p>
  return (
    <div className="mt-2 flex flex-col gap-2 bg-dv-ink-2 p-4 shadow-[inset_0_0_0_1px_var(--dv-line)]">
      <T>Confecção de Cartas</T>
      <P>Bem-vindo à Confecção de Cartas! Aqui, você pode sacrificar cartas para tentar obter outras de raridades superiores ou descobrir combinações especiais capazes de produzir resultados específicos. Entretanto, nem toda tentativa será bem-sucedida. Prepare seus materiais, reserve um pouco de Tempo e torça para que a sorte esteja ao seu lado!</P>
      <T>Fabricação por raridade</T>
      <P>A maneira mais comum de fabricar cartas consiste em utilizar várias cartas de uma mesma raridade para tentar obter uma carta da categoria imediatamente superior.</P>
      <table className="w-full text-left font-body text-[14px] text-dv-text">
        <thead>
          <tr className="font-mono text-[10px] uppercase tracking-[0.14em] text-dv-text-3">
            <th className="py-1 font-normal">Carta desejada</th>
            <th className="py-1 font-normal">Materiais necessários</th>
          </tr>
        </thead>
        <tbody>
          {ALVOS_RARIDADE.map((r) => (
            <tr key={r} className="border-t border-dv-line">
              <td className="py-1">{RARITY_META[r].label}</td>
              <td className="py-1">
                {RECEITA_RARIDADE[r]!.qtd} cartas {RARITY_META[RECEITA_RARIDADE[r]!.de].plural}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <P>Ao iniciar uma fabricação, você deve pagar o custo em Tempo e aguardar o período de conclusão. Se tudo der certo, receberá uma carta aleatória da raridade desejada. Você não pode escolher qual carta será obtida: o resultado depende da sorte!</P>
      <T>Chance de sucesso</T>
      <P>Toda fabricação possui uma chance de falhar. Se isso acontecer, você não receberá uma nova carta, e os materiais utilizados, incluindo as carta sacrificadas, serão perdidos.</P>
      <P>A boa notícia é que você pode aprimorar sua mesa de confecção para aumentar suas chances de sucesso.</P>
      <P>Nível 1: 50% · Nível 2: 60% · Nível 3: 70% · Nível 4: 80% · Nível 5: 90% · Nível 6: 95%</P>
      <P>A chance de sucesso depende do nível da sua mesa no início da tentativa. Melhorá-la não garante resultados, mas torna suas próximas fabricações menos arriscadas.</P>
      <T>Combinações especiais</T>
      <P>Nem toda fabricação precisa seguir a progressão tradicional de raridades! Algumas cartas podem ser obtidas por meio de combinações exatas, nas quais determinados materiais, quando reunidos, produzem uma carta específica.</P>
      <P>Pense nisso como uma receita: assim como a mistura de azul e vermelho pode resultar em roxo, certas cartas podem formar uma combinação capaz de produzir um resultado predeterminado.</P>
      <P>Combinações exatas: você precisa utilizar exatamente as cartas exigidas pela receita, sem adicionar materiais extras.</P>
      <P>Sem sacrifício adicional: as cartas que fazem parte da combinação já são os únicos materiais necessários. Não é preciso oferecer mais cartas além das presentes na receita como sacrifício.</P>
      <P>Custo em Tempo: mesmo conhecendo a receita, você ainda precisa pagar o custo em Tempo para tentar realizá-la.</P>
      <P>Possibilidade de falha: as combinações especiais também estão sujeitas à chance de falha da sua mesa de confecção.</P>
      <P>Resultado específico: se a tentativa for bem-sucedida, você recebe a carta definida pela combinação, em vez de uma carta aleatória da mesma raridade.</P>
      <T>Aprimore sua mesa</T>
      <P>Sua mesa de confecção pode ser aprimorada para aumentar a chance de sucesso e desbloquear espaços adicionais de fabricação. Com mais espaços, você poderá manter várias tentativas em andamento ao mesmo tempo, sem precisar esperar que uma termine para iniciar outra.</P>
      <P>Lembre-se de que cada fabricação possui seu próprio custo em Tempo e período de espera. Planeje seus recursos com cuidado!</P>
      <p className="mt-2 font-serif text-[15px] italic leading-snug text-dv-text">Reúna suas cartas, descubra novas receitas e aprimore sua mesa. Afinal, uma carta extraordinária pode estar a apenas uma combinação de distância!</p>
    </div>
  )
}

/* ------------------------------------------------------------------ Livro de Receitas */

function Livro({ d }: { d: CasaLiberado }) {
  return (
    <>
      <p className="font-body text-[14.5px] leading-relaxed text-dv-text-2">
        Toda combinação especial descoberta fica registrada no Livro de Receitas. Você só poderá consultar receitas descobertas por você ou por outros membros da sua própria Corporação.
      </p>
      <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-dv-text-3">{d.corporacao ? `Corporação: ${d.corporacao}` : 'Sem Corporação · só as suas descobertas'}</p>
      {d.livro.length === 0 ? (
        <p className="font-body text-[15px] italic text-dv-text-3">O livro ainda está em branco. Experimente combinações na mesa: o que der certo fica anotado aqui.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {d.livro.map((r) => (
            <li key={r.id} className="bg-dv-ink-2 p-3 shadow-[inset_0_0_0_1px_var(--dv-line-gold)]">
              <div className="flex items-center gap-3">
                <CardFace cardId={r.resultado} className="w-[46px] shrink-0" />
                <div className="min-w-0">
                  <p className="font-display text-[15px] font-semibold uppercase tracking-[0.05em] text-dv-text">{nomeCarta(r.resultado)}</p>
                  <p className="font-body text-[14px] text-dv-text-2">{agrupar(r.materiais)}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-dv-text-3">
                    {formatMinutos(r.minutos)} de Tempo · {formatMinutos(r.espera)} de espera · {r.por === 'voce' ? 'descoberta sua' : `descoberta de ${r.por}`}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function agrupar(ids: string[]) {
  const m = new Map<string, number>()
  for (const id of ids) m.set(id, (m.get(id) ?? 0) + 1)
  return [...m].map(([id, n]) => `${n}× ${nomeCarta(id)}`).join(' + ')
}

/* ------------------------------------------------------------------ Histórico */

const STATUS_ROTULO: Record<Tentativa['status'], string> = { andamento: 'Em andamento', sucesso: 'Sucesso', falha: 'Falhou', sem_receita: 'Nada aconteceu' }

function Historico({ d }: { d: CasaLiberado }) {
  if (!d.historico.length) return <p className="font-body text-[15px] italic text-dv-text-3">Nenhuma tentativa ainda.</p>
  return (
    <ul className="flex flex-col gap-2">
      {d.historico.map((t) => (
        <li key={t.id} className="bg-dv-ink-2 p-3 shadow-[inset_0_0_0_1px_var(--dv-line)]">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-body text-[15px] text-dv-text">{tituloTentativa(t)}</p>
            <p className={cn('shrink-0 font-mono text-[10.5px] uppercase tracking-[0.14em]', t.status === 'sucesso' ? 'text-dv-gold-bright' : t.status === 'falha' ? 'text-dv-blood-bright' : 'text-dv-text-2')}>{STATUS_ROTULO[t.status]}</p>
          </div>
          <p className="mt-1 font-body text-[13.5px] text-dv-text-2">Materiais: {agrupar(t.materiais)}</p>
          {t.resultado && (
            <p className="font-body text-[13.5px] text-dv-text">
              Recebeu: {nomeCarta(t.resultado)}
              {t.descobriu ? ' · receita nova no livro' : ''}
            </p>
          )}
          {t.status === 'sem_receita' && <p className="font-body text-[13.5px] text-dv-text-2">As cartas voltaram para o inventário.</p>}
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-dv-text-3">
            {new Date(t.criadaEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} · {formatMinutos(t.minutos)} de Tempo{t.modo !== 'experimento' ? ` · mesa nível ${t.nivelMesa} (${t.chance}%)` : ''}
          </p>
        </li>
      ))}
    </ul>
  )
}

/* ------------------------------------------------------------------ Pacotes */

function Pacotes({ d, agir, resgatar }: { d: CasaLiberado; agir: Agir; resgatar: Resgatar }) {
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [premio, setPremio] = useState<PacotePremio | null>(null)
  const [virada, setVirada] = useState(false)
  const abrir = async (id: string) => {
    setBusy(id)
    setErro(null)
    try {
      const r = await agir<{ premio: PacotePremio }>({ action: 'pacote.abrir', pacote: id, idem: crypto.randomUUID() })
      setVirada(false)
      setPremio(r.premio)
      playSfx('reveal')
      window.setTimeout(() => setVirada(true), 700)
      if (r.premio.tipo === 'carta') void resgatar()
    } catch (e) {
      playSfx('error')
      setErro((e as Error).message)
    } finally {
      setBusy(null)
    }
  }
  return (
    <>
      <p className="font-body text-[14.5px] leading-relaxed text-dv-text-2">{PACOTES_TEXTO}</p>
      {erro && (
        <p role="alert" className="font-body text-[14px] text-dv-blood-bright">
          {erro}
        </p>
      )}
      {PACOTES.map((p) => {
        const n = d.pacotes.find((x) => x.id === p.id)?.quantidade ?? 0
        return (
          <Lamina key={p.id} ariaLabel={p.nome}>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Rotulo>Coleção {p.colecao}</Rotulo>
                  <h3 className="mt-1 font-display text-[18px] font-semibold uppercase leading-tight tracking-[0.05em] text-dv-text">{p.nome}</h3>
                </div>
                <p className="shrink-0 font-impact text-[26px] font-semibold leading-none text-dv-gold-bright dv-tabular" aria-label={`Você tem ${n}`}>
                  ×{n}
                </p>
              </div>
              <p className="mt-2 font-body text-[14.5px] leading-relaxed text-dv-text-2">{p.descricao}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" disabled={!n} loading={busy === p.id} onClick={() => abrir(p.id)}>
                  Abrir pacote
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setInfo(info === p.id ? null : p.id)} aria-expanded={info === p.id}>
                  Centro de informações
                </Button>
              </div>
              {!n && <p className="mt-2 font-body text-[13px] italic text-dv-text-3">Pacotes chegam como prêmio semanal da Sala de Jogos ou por concessão da casa.</p>}
              {info === p.id && (
                <table className="mt-3 w-full text-left font-body text-[14px]">
                  <caption className="mb-1 text-left font-mono text-[10px] uppercase tracking-[0.14em] text-dv-text-3">Recompensas possíveis</caption>
                  <tbody>
                    {p.premios.map((x) => (
                      <tr key={x.rotulo} className="border-t border-dv-line">
                        <td className="py-1.5 pr-2 text-dv-text">{x.rotulo}</td>
                        <td className="py-1.5 text-right font-mono text-dv-text-2 dv-tabular">{x.chance}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Lamina>
        )
      })}
      <Dialog
        open={!!premio}
        onClose={() => setPremio(null)}
        title={virada ? (premio?.rotulo ?? '') : 'Abrindo…'}
        footer={
          <Button size="sm" onClick={() => setPremio(null)}>
            Guardar
          </Button>
        }
      >
        <div className="flex flex-col items-center gap-3 py-2">
          {premio?.tipo === 'carta' ? (
            <DevoCard cardId={premio.cardId} faceDown={!virada} size="md" />
          ) : (
            <div className="grid size-40 place-items-center bg-dv-ink-2 shadow-[inset_0_0_0_1px_var(--dv-line-gold)]">
              <p className="px-3 text-center font-display text-[16px] font-semibold uppercase tracking-[0.06em] text-dv-gold-bright">{virada ? 'Molde de Xadrez' : '?'}</p>
            </div>
          )}
          {virada && <p className="font-body text-[14px] text-dv-text-2">{premio?.tipo === 'carta' ? 'A carta foi para o seu inventário.' : 'O item foi para o seu inventário.'}</p>}
        </div>
      </Dialog>
    </>
  )
}
