'use client'

import { type CSSProperties, type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { CONTEUDO_PADRAO } from '@/lib/devo/torres/conteudo'
import { CENA_ANFITRIAO_DE_QUE, CENA_GALO_TORRES } from '@/lib/devo/torres/galo'
import { type AndarEstado, chaveItem, custoDoAndar, type Efeito, type NpcRef, type Passo, type SubirResposta, type TorreEstado, type TorresPayload } from '@/lib/devo/torres/tipos'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '../hooks'
import { Button, FrameCorners, Kicker, toRoman } from '../kit'
import { useShellBack } from '../os/app-back'
import { MAPA_H, MAPA_W } from './arte'
import { Cena } from './cena'
import { pedirCena } from './gatilho'
import { MapaTorres, Recursos } from './mapa'
import { TelaTorre } from './torre'
import { Cadeado } from './ornamentos'
import { type ItemRevelado, Revelacao } from './revelacao'
import './torres.css'

/**
 * App "Torres de Ruptura" (DIRECAO-3 §2): trancado com motivo → apresentação do Galo (uma vez) → mapa das
 * torres → tela de uma torre (escada com andares). Estado e regras no servidor (/api/torres).
 */

const GALO: NpcRef = { id: 'galo', nome: 'O Galo', titulo: 'Anfitrião do Arcano do Imperador', pose: 'malicia' }
const ENTRA_MS = 560
const SAI_MS = 420
const EASE_OUT = 'cubic-bezier(0.16,1,0.3,1)'
const EASE_IN = 'cubic-bezier(0.6,0,0.9,0.4)'

/** Mapa sem progresso, a partir do conteúdo padrão (prévia na tela trancada e enquanto carrega). */
function previa(): TorreEstado[] {
  return CONTEUDO_PADRAO.torres.map((t) => ({
    id: t.id,
    nome: t.nome,
    tipo: t.tipo,
    tema: t.tema,
    descricao: t.descricao ?? null,
    npc: t.npc,
    essencia: { item: t.essencia.item, nome: t.essencia.nome, quantidade: 0 },
    chave: t.tipo === 'secundaria' ? { item: chaveItem(t.id), nome: t.chave?.nome ?? t.nome, quantidade: 0 } : null,
    arte: t.arte,
    mapa: { x: t.mapa.x, y: t.mapa.y, escala: t.mapa.escala ?? 1 },
    andares: t.andares.map((a, i) => ({
      n: i + 1,
      titulo: a.titulo,
      resumo: null,
      npc: t.npc,
      estado: 'trancado' as const,
      custo: custoDoAndar(t.custoBase, i + 1),
      chaves: [],
      gastaChaves: false,
      faltaEssencias: 0,
      faltaChaves: 0,
      podeSubir: false,
      recompensas: { chaves: 0, itens: [] },
      provisorio: !!a.provisorio,
      cena: null,
    })),
    concluidos: 0,
    provisorio: !!t.provisorio,
  }))
}

async function post<T>(body: Record<string, unknown>): Promise<{ ok: boolean; data: T | null; error: string | null }> {
  try {
    const r = await fetch('/api/torres', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    const j = await r.json().catch(() => null)
    if (!r.ok) return { ok: false, data: null, error: j?.error ?? 'Falha nas Torres de Ruptura.' }
    return { ok: true, data: j as T, error: null }
  } catch {
    return { ok: false, data: null, error: 'Sem conexão com o servidor.' }
  }
}

/** Mede a área e devolve a largura do mapa que cabe inteiro na altura. */
function useEncaixe() {
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState<number | undefined>(undefined)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => setW(Math.max(260, Math.min(el.clientWidth, (el.clientHeight * MAPA_W) / MAPA_H, 520)))
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return { ref, w }
}

export function TorresApp() {
  const [dados, setDados] = useState<TorresPayload | null>(null)
  const [falha, setFalha] = useState<string | null>(null)
  const [vista, setVista] = useState<{ id: string; x: number; y: number } | null>(null)
  const [galoAberto, setGaloAberto] = useState(false)
  const [cena, setCena] = useState<{ passos: Passo[]; npc: NpcRef; titulo: string; arte: TorreEstado['arte']; aviso: string | null } | null>(null)
  const [subindo, setSubindo] = useState(false)
  const [erroTorre, setErroTorre] = useState<string | null>(null)
  const [recem, setRecem] = useState<number | null>(null)
  const [faixa, setFaixa] = useState<string | null>(null)
  const [revelar, setRevelar] = useState<{ tipo: 'andar' | 'essencia'; titulo: string; andar?: number; gasto: number; item: ItemRevelado; depois: () => void } | null>(null)
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  const raiz = useRef<HTMLDivElement>(null)
  const mapaRef = useRef<HTMLDivElement>(null)
  const torreRef = useRef<HTMLDivElement>(null)
  const encaixe = useEncaixe()

  const carregar = useCallback(async () => {
    try {
      const r = await fetch('/api/torres', { cache: 'no-store' })
      const j = await r.json().catch(() => null)
      if (!r.ok) throw new Error(j?.error ?? 'Falha ao abrir as Torres.')
      setDados(j as TorresPayload)
      setFalha(null)
      return j as TorresPayload
    } catch (e) {
      setFalha(e instanceof Error ? e.message : 'Falha ao abrir as Torres.')
      return null
    }
  }, [])

  useEffect(() => {
    void carregar().then((d) => {
      if (d?.liberado && !d.apresentacao.galoVista) setGaloAberto(true)
    })
  }, [carregar])

  /* Reflexão "Anfitrião de quê?": ao sair da aba pela primeira vez depois da apresentação do Galo. */
  const pendente = useRef(false)
  pendente.current = !!(dados?.liberado && dados.apresentacao.reflexaoPendente)
  useEffect(() => {
    const t0 = Date.now()
    return () => {
      if (pendente.current && Date.now() - t0 > 1200) pedirCena(CENA_ANFITRIAO_DE_QUE)
    }
  }, [])

  /* ── transição mapa → torre (íris que nasce da torre tocada) e volta ── */
  const abrir = (id: string, rect: DOMRect) => {
    const box = raiz.current?.getBoundingClientRect()
    const x = box ? ((rect.left + rect.width / 2 - box.left) / box.width) * 100 : 50
    const y = box ? ((rect.top + rect.height * 0.45 - box.top) / box.height) * 100 : 50
    setErroTorre(null)
    setRecem(null)
    setVista({ id, x, y })
  }

  useLayoutEffect(() => {
    if (!vista || reduced) return
    const el = torreRef.current
    const map = mapaRef.current
    if (!el || typeof el.animate !== 'function') return
    const at = `${vista.x.toFixed(1)}% ${vista.y.toFixed(1)}%`
    const a = el.animate([{ clipPath: `circle(0% at ${at})` }, { clipPath: `circle(150% at ${at})` }], { duration: ENTRA_MS, easing: EASE_OUT })
    const b = map?.animate(
      [
        { transform: 'scale(1)', opacity: 1, transformOrigin: at },
        { transform: 'scale(1.45)', opacity: 0.2, transformOrigin: at },
      ],
      { duration: ENTRA_MS, easing: EASE_OUT, fill: 'forwards' },
    )
    return () => {
      a.cancel()
      b?.cancel()
    }
  }, [vista?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const voltar = useCallback(() => {
    if (!vista) return
    playSfx('close')
    const el = torreRef.current
    const map = mapaRef.current
    if (reduced || !el || typeof el.animate !== 'function') {
      setVista(null)
      return
    }
    const at = `${vista.x.toFixed(1)}% ${vista.y.toFixed(1)}%`
    const a = el.animate([{ clipPath: `circle(150% at ${at})` }, { clipPath: `circle(0% at ${at})` }], { duration: SAI_MS, easing: EASE_IN, fill: 'forwards' })
    map?.animate(
      [
        { transform: 'scale(1.3)', opacity: 0.3, transformOrigin: at },
        { transform: 'scale(1)', opacity: 1, transformOrigin: at },
      ],
      { duration: SAI_MS, easing: EASE_OUT },
    )
    a.onfinish = () => setVista(null)
  }, [vista, reduced])

  const shellAssumiu = useShellBack(!!vista && !cena, voltar, 'Voltar ao mapa')

  /* ── subir andar ── */
  const torreAtual = dados?.liberado && vista ? dados.torres.find((t) => t.id === vista.id) ?? null : null

  const subir = async (n: number) => {
    if (!torreAtual || subindo) return false
    setSubindo(true)
    setErroTorre(null)
    const r = await post<SubirResposta>({ action: 'subir', torre: torreAtual.id, andar: n })
    setSubindo(false)
    if (!r.ok || !r.data) {
      playSfx('error')
      setErroTorre(r.error)
      return false
    }
    const res = r.data
    setRecem(n)
    const prox = res.torre.andares[n]
    const item: ItemRevelado =
      res.chavesRecebidas && torreAtual.chave
        ? {
            tipo: 'chave',
            nome: torreAtual.chave.nome,
            quantidade: res.chavesRecebidas,
            raridade: 'incomum',
            descricao: 'Guardada no seu inventário. Abre andares da torre principal.',
          }
        : {
            tipo: 'selo',
            nome: `Andar ${toRoman(n)} vencido`,
            quantidade: 1,
            raridade: 'incomum',
            descricao: prox ? `O andar ${toRoman(n + 1)} pede ${prox.custo} ${prox.custo === 1 ? 'essência' : 'essências'}.` : 'Você chegou ao topo desta torre.',
          }
    const cenaAndar = res.cena.length ? { passos: res.cena, npc: res.andar.npc, titulo: `${torreAtual.nome} · Andar ${toRoman(n)}`, arte: torreAtual.arte, aviso: null } : null
    void carregar()
    setRevelar({
      tipo: 'andar',
      titulo: `Andar ${toRoman(n)} aberto`,
      andar: n,
      gasto: res.andar.custo,
      item,
      depois: () => {
        if (cenaAndar) setCena(cenaAndar)
      },
    })
    return true
  }

  const faixaTimer = useRef<number | undefined>(undefined)
  const mostrarFaixa = (m: string) => {
    setFaixa(m)
    window.clearTimeout(faixaTimer.current)
    faixaTimer.current = window.setTimeout(() => setFaixa(null), 4200)
  }
  useEffect(() => () => window.clearTimeout(faixaTimer.current), [])

  const rever = (a: AndarEstado) => {
    if (!torreAtual || !a.cena?.length) return
    playSfx('open')
    setCena({ passos: a.cena, npc: a.npc, titulo: `${torreAtual.nome} · Andar ${toRoman(a.n)}`, arte: torreAtual.arte, aviso: null })
  }

  /* ── apresentação do Galo ── */
  const efeitoGalo = async (e: Efeito) => {
    const aceitar = e === 'galo.fa.aceitar'
    const r = await post<{ concedido: boolean }>({ action: 'galo.fa', aceitar })
    if (!aceitar || !r.data?.concedido) return null
    // a cena espera a revelação da essência terminar
    await new Promise<void>((ok) =>
      setRevelar({
        tipo: 'essencia',
        titulo: 'Presente do Galo',
        gasto: 0,
        item: {
          tipo: 'essencia',
          nome: 'Essência de Afinidade do Galo',
          quantidade: 1,
          raridade: 'incomum',
          descricao: 'Do Galo, Anfitrião do Arcano do Imperador. Abre andares da Torre do Imperador. Fica no seu inventário.',
        },
        depois: ok,
      }),
    )
    return null
  }
  const fimGalo = async () => {
    setGaloAberto(false)
    await post({ action: 'galo.visto' })
    await carregar()
  }

  /* ── telas ── */
  const torresMapa = dados?.liberado ? dados.torres : previa()
  const trancado = dados && !dados.liberado ? dados : null

  return (
    <div ref={raiz} className="absolute inset-0 overflow-hidden bg-dv-ink text-dv-text">
      {/* céu de fundo em tela cheia (o mapa encaixa na altura e pode não cobrir as laterais) */}
      <span aria-hidden="true" className="absolute inset-0 bg-[#0b0b0d] bg-[url(/images/torres/ceu-noite.webp)] bg-cover bg-[position:30%_0%]" />

      {/* MAPA */}
      <div ref={mapaRef} className={cn('absolute inset-0 flex flex-col', vista && !reduced && 'pointer-events-none')} inert={vista ? true : undefined} aria-hidden={vista ? true : undefined}>
        <div className="relative z-10 flex shrink-0 flex-col gap-2 px-4 pb-1 pt-2">
          <div className="flex items-center justify-between gap-3">
            <Kicker tone="gold">Mapa das Torres</Kicker>
            {dados?.liberado && (
              <span className="font-body text-[13px] italic text-dv-text-3">Toque numa torre</span>
            )}
          </div>
          {dados?.liberado && <Recursos torres={dados.torres} />}
        </div>
        <div ref={encaixe.ref} className={cn('relative min-h-0 flex-1', (trancado || !dados) && 'pointer-events-none')}>
          <div className={cn('absolute inset-0 flex items-start justify-center transition-[filter,opacity] duration-700', (trancado || !dados) && '[filter:grayscale(1)_brightness(0.45)]')}>
            {encaixe.w ? <MapaTorres torres={torresMapa} largura={encaixe.w} inerte={!dados?.liberado || galoAberto} onAbrir={abrir} /> : null}
          </div>
        </div>
      </div>

      {/* carregando / falha / trancado */}
      {!dados && !falha && (
        <p role="status" className="absolute inset-x-0 bottom-[18%] text-center font-mono text-[11px] uppercase tracking-[0.22em] text-dv-text-3">
          Abrindo as torres…
        </p>
      )}
      {falha && !dados && (
        <AvisoCentral
          titulo="As torres não responderam"
          texto={falha}
          tom="alerta"
          acao={
            <Button variant="secondary" onClick={() => void carregar()} sfx="click">
              Tentar de novo
            </Button>
          }
        />
      )}
      {trancado && <AvisoCentral titulo="Torres de Ruptura" selo="Trancado" texto={trancado.motivo} />}

      {/* TORRE */}
      {torreAtual && (
        <div ref={torreRef} className="absolute inset-0 z-20">
          <TelaTorre
            torre={torreAtual}
            onVoltar={voltar}
            voltarProprio={!shellAssumiu}
            onSubir={subir}
            onRever={rever}
            subindo={subindo}
            erro={erroTorre}
            recemConcluido={recem}
          />
          {faixa && (
            <div role="status" className="animate-dv-cut-in dv-safe-bottom absolute inset-x-3 bottom-5 z-30 flex justify-center">
              <span className="relative isolate px-4 py-2.5 font-display text-[13px] font-semibold uppercase tracking-[0.12em] text-dv-gold-bright" style={{ '--dv-cut': '10px' } as CSSProperties}>
                <span aria-hidden="true" className="dv-cut-diag absolute inset-0 -z-10 bg-[linear-gradient(135deg,var(--dv-gold-bright),var(--dv-gold-deep)_45%,var(--dv-gold))]" />
                <span aria-hidden="true" className="dv-cut-diag absolute inset-px -z-10 bg-[linear-gradient(180deg,var(--dv-ink-3),var(--dv-ink))]" style={{ '--dv-cut': '9.6px' } as CSSProperties} />
                {faixa}
              </span>
            </div>
          )}
        </div>
      )}

      {/* cena de andar */}
      {cena && (
        <Cena
          passos={cena.passos}
          npc={cena.npc}
          titulo={cena.titulo}
          arteFundo={cena.arte}
          onFim={() => {
            const aviso = cena.aviso
            setCena(null)
            if (aviso) mostrarFaixa(aviso)
          }}
        />
      )}

      {/* apresentação do Galo (uma vez) */}
      {galoAberto && dados?.liberado && (
        <Cena
          passos={CENA_GALO_TORRES}
          npc={GALO}
          titulo="O Galo apresenta as Torres de Ruptura"
          kicker="Torres de Ruptura · O Galo"
          arteFundo="palacio"
          onEfeito={efeitoGalo}
          onFim={() => void fimGalo()}
          onPular={dados.pularApresentacao ? () => void fimGalo() : undefined}
        />
      )}

      {/* revelação (andar aberto, chave, essência) */}
      {revelar && (
        <Revelacao
          tipo={revelar.tipo}
          titulo={revelar.titulo}
          andar={revelar.andar}
          gasto={revelar.gasto}
          item={revelar.item}
          onFim={() => {
            const depois = revelar.depois
            setRevelar(null)
            depois()
          }}
        />
      )}
    </div>
  )
}

function AvisoCentral({ titulo, texto, selo, tom = 'normal', acao }: { titulo: string; texto: string; selo?: string; tom?: 'normal' | 'alerta'; acao?: ReactNode }) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center px-4 pb-8">
      <div role={tom === 'alerta' ? 'alert' : 'group'} aria-label={`${titulo}${selo ? `: ${selo.toLowerCase()}` : ''}`} className="animate-dv-rise relative isolate w-full max-w-sm px-5 pb-5 pt-6 text-center" style={{ '--dv-cut': '16px' } as CSSProperties}>
        <span aria-hidden="true" className={cn('dv-cut absolute inset-0 -z-10', tom === 'alerta' ? 'bg-[linear-gradient(135deg,var(--dv-blood-text),var(--dv-blood)_50%,var(--dv-blood-deep))]' : 'bg-[linear-gradient(135deg,#ece5d8,#6b6357_30%,#bab09f_62%,#5f584d)]')} />
        <span aria-hidden="true" className="dv-cut absolute inset-px -z-10 bg-[linear-gradient(180deg,rgba(31,31,34,0.97),rgba(12,12,14,0.98))]" style={{ '--dv-cut': '15.6px' } as CSSProperties} />
        {tom !== 'alerta' && <FrameCorners tone="gold" size={18} inset={5} />}
        <span aria-hidden="true" className="relative mx-auto -mt-16 grid h-24 place-items-center">
          <Cadeado aceso={!!selo} className="h-24 w-auto drop-shadow-[0_8px_18px_rgba(0,0,0,0.85)]" />
        </span>
        <p className="mt-3 font-display text-[20px] font-semibold uppercase tracking-[0.1em] text-dv-text">{titulo}</p>
        {selo && <p className="dv-label mt-1 text-[11px] text-dv-gold">{selo}</p>}
        <p className="mt-3 font-body text-[16px] leading-relaxed text-dv-text-2">{texto}</p>
        {acao && <div className="mt-4 flex justify-center">{acao}</div>}
      </div>
    </div>
  )
}
