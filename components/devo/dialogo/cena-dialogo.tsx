'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { playSfx, type Sfx } from '@/lib/devo/audio'
import { type CenaEstado, type Efeito, type Fx, formatTempo, type MembroElenco, type Palco as PalcoMuda, type Passo, type PassoResposta, type SomId } from '@/lib/devo/dialogo/formato'
import { getCena, indicePasso } from '@/lib/devo/dialogo/registro'
import { cn } from '@/lib/utils'
import { useAdvanceKeys } from '../hooks'
import { useBackHandler } from '../use-back-handler'
import { GlyphDiamond, GlyphHourglass, GlyphKeyhole } from '../kit/glyphs'
import { AdvanceIndicator, ChoiceHeader, ChoiceStrip, DialogueShell, SpeakerPlate, VnTopBar, useTypewriter } from '../intro/vn'
import { callName, useDevo } from '../state/devo-store'
import { usePlayerText } from '../state/player-text'
import { aplicarEfeito, concluirCena, escolher, lerCena, salvarPasso } from './cliente'
import { Palco, type PalcoEstado } from './palco'
import { TextoRico, textoPlano } from './texto'

/**
 * MOTOR DE DIÁLOGO — toca uma cena registrada (lib/devo/dialogo/registro.ts) no padrão visual da encenação
 * (caixa de vidro negro, placa do falante, escolhas em tiras), retoma no passo salvo no servidor e aplica os
 * efeitos pela API (uma vez só). Formato: docs/redesign/DIALOGO.md.
 */

/** Som do motor → sons sintetizados que já existem (lib/devo/audio.ts). */
const SONS: Record<string, [Sfx, number][]> = {
  porta: [['thud', 0], ['crack', 160]],
  campainha: [['bell', 0]],
  luz: [['tick', 0], ['tick', 260]],
  passos: [['tick', 0], ['tick', 420]],
  chamada: [['notify', 0], ['shimmer', 380]],
  holograma: [['shimmer', 0]],
  item: [['card', 0]],
  tempo: [['heartbeat', 0]],
  sistema: [['reveal', 0]],
}
function tocar(som?: SomId) {
  if (!som) return
  for (const [s, ms] of SONS[som] ?? [['click', 0]]) window.setTimeout(() => playSfx(s), ms)
}

type Respostas = { passos: PassoResposta[]; escolha: string; opcao: number; ir?: string; explorar: boolean }
type Selo = { titulo: string; texto: string; tom: 'tempo' | 'perda' | 'item'; key: number }

const PALCO_INICIAL = (cenario: PalcoEstado['cenario']): PalcoEstado => ({ cenario, npc: null, retrato: null, destino: null, holo: null })

export function CenaDialogo({ cena: cenaId, onFim, onSair }: { cena: string; onFim?: () => void; onSair?: () => void }) {
  const cena = useMemo(() => getCena(cenaId), [cenaId])
  const { state, dispatch } = useDevo()
  const pt = usePlayerText()
  const [dados, setDados] = useState<CenaEstado | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [idx, setIdx] = useState(0)
  const [respostas, setRespostas] = useState<Respostas | null>(null)
  const [explorados, setExplorados] = useState<number[]>([])
  const [palco, setPalco] = useState<PalcoEstado>(() => PALCO_INICIAL(cena?.cenario ?? 'escuro'))
  const [fx, setFx] = useState<{ fx?: Fx; key: number }>({ key: 0 })
  const [selo, setSelo] = useState<Selo | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [saindo, setSaindo] = useState(false)
  const nome = callName(state) ?? 'Record'

  const retratoDe = useCallback((npc: string | null) => (npc ? (cena?.elenco?.[npc]?.npc ?? npc) : null), [cena])

  const mudarPalco = useCallback(
    (p: PalcoEstado, m?: PalcoMuda, fala?: Extract<Passo, { tipo: 'fala' }>): PalcoEstado => {
      let n = p
      // Fala de alguém do elenco põe essa pessoa em cena (com a expressão da fala).
      if (fala && fala.quem !== 'jogador' && m?.npc === undefined) n = { ...n, npc: fala.quem, retrato: retratoDe(fala.quem), expressao: fala.expressao ?? n.expressao }
      if (!m) return n
      if (m.npc !== undefined) n = { ...n, npc: m.npc, retrato: retratoDe(m.npc), expressao: m.expressao ?? (m.npc ? n.expressao : undefined) }
      if (m.expressao !== undefined) n = { ...n, expressao: m.expressao }
      if (m.cenario) n = { ...n, cenario: m.cenario }
      if (m.destino !== undefined) n = { ...n, destino: m.destino }
      if (m.holo !== undefined) n = { ...n, holo: m.holo }
      return n
    },
    [retratoDe],
  )

  /* ── carregar: retoma no passo salvo; o palco é reconstruído até ali ── */
  useEffect(() => {
    if (!cena) {
      setErro('Cena não encontrada.')
      return
    }
    let vivo = true
    lerCena(cena.id)
      .then((d) => {
        if (!vivo) return
        const inicio = d.progresso.fim || cena.retomavel === false ? 0 : Math.min(d.progresso.passo, cena.passos.length - 1)
        let p = PALCO_INICIAL(cena.cenario)
        for (const passo of cena.passos.slice(0, inicio)) {
          p = mudarPalco(p, passo.palco, passo.tipo === 'fala' ? passo : undefined)
          if (passo.fx === 'porta-abre') p = { ...p, porta: true }
          if (passo.fx === 'porta-fecha') p = { ...p, porta: false }
        }
        setPalco(p)
        setIdx(inicio)
        setDados(d)
      })
      .catch((e: Error) => vivo && setErro(e.message))
    return () => {
      vivo = false
    }
  }, [cena]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── guarda o passo no servidor (retomar depois) ── */
  useEffect(() => {
    if (!dados || !cena || cena.retomavel === false) return
    const t = window.setTimeout(() => salvarPasso(cena.id, idx), 350)
    return () => window.clearTimeout(t)
  }, [idx, dados, cena])

  const atual: Passo | null = cena && dados ? (respostas?.passos[0] ?? cena.passos[idx] ?? null) : null

  const aplicarResultado = useCallback(
    (r: { timeDeltaMs: number; contatos: string[]; aplicados: Efeito[] }) => {
      if (r.timeDeltaMs) dispatch({ type: 'ADD_TIME', ms: r.timeDeltaMs })
      for (const npc of r.contatos) dispatch({ type: 'ADD_CONTACT', npcId: npc })
      const t = r.aplicados.find((e): e is Extract<Efeito, { tipo: 'tempo' }> => e.tipo === 'tempo')
      if (t && t.minutos) {
        setSelo({ titulo: t.minutos > 0 ? 'Tempo recebido' : 'Tempo retirado', texto: `${t.minutos > 0 ? '+' : '−'}${formatTempo(t.minutos)}`, tom: t.minutos > 0 ? 'tempo' : 'perda', key: Date.now() })
        tocar('tempo')
      }
      if (r.aplicados.some((e) => e.tipo === 'flag')) window.dispatchEvent(new Event('devo:acesso'))
    },
    [dispatch],
  )

  const terminar = useCallback(async () => {
    if (!cena) return
    setOcupado(true)
    setSaindo(true)
    try {
      aplicarResultado(await concluirCena(cena.id))
    } catch {
      /* o servidor guarda o passo; a cena pode ser concluída de novo depois */
    }
    window.setTimeout(() => onFim?.(), 650)
  }, [cena, aplicarResultado, onFim])

  const irPara = useCallback(
    (n: number) => {
      if (!cena) return
      setRespostas(null)
      setExplorados([])
      if (n < 0 || n >= cena.passos.length) {
        void terminar()
        return
      }
      setIdx(n)
    },
    [cena, terminar],
  )
  const seguinte = useCallback(() => irPara(idx + 1), [irPara, idx])
  const saltar = useCallback((para?: string) => (para && cena ? irPara(indicePasso(cena, para)) : seguinte()), [cena, irPara, seguinte])

  /* ── ao mostrar um passo: palco, som, efeito visual; passos automáticos ── */
  const chaveAtual = `${idx}:${respostas ? respostas.passos.length : 'p'}:${respostas?.opcao ?? ''}`
  useEffect(() => {
    if (!atual || !cena || !dados) return
    setPalco((p) => {
      const n = mudarPalco(p, atual.palco, atual.tipo === 'fala' ? atual : undefined)
      return atual.fx === 'porta-abre' ? { ...n, porta: true } : atual.fx === 'porta-fecha' ? { ...n, porta: false } : n
    })
    if (atual.fx) setFx((f) => ({ fx: atual.fx, key: f.key + 1 }))
    else setFx((f) => (f.fx ? { key: f.key } : f))
    tocar(atual.som)
    if (respostas) return
    if (atual.tipo === 'ir') {
      saltar(atual.para)
      return
    }
    if (atual.tipo === 'escolha' && atual.modo !== 'explorar') {
      // Escolha já feita (recarregou a página): segue pela opção que valeu, sem perguntar de novo.
      const feita = dados.progresso.escolhas[atual.id]?.[0]
      if (feita !== undefined) saltar(atual.opcoes[feita]?.ir)
      return
    }
    if (atual.tipo === 'efeito' && !dados.progresso.efeitos.includes(atual.id)) {
      setOcupado(true)
      aplicarEfeito(cena.id, atual.id)
        .then((r) => {
          aplicarResultado(r)
          setDados((d) => (d ? { ...d, progresso: { ...d.progresso, efeitos: [...d.progresso.efeitos, atual.id] } } : d))
          playSfx('reveal')
        })
        .catch((e: Error) => setErro(e.message))
        .finally(() => setOcupado(false))
    }
  }, [chaveAtual, dados !== null]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selo) return
    const t = window.setTimeout(() => setSelo(null), 3400)
    return () => window.clearTimeout(t)
  }, [selo])

  /* ── texto do passo atual ── */
  const tempoDe = (k?: string) => (k && dados?.tempos[k] !== undefined ? formatTempo(dados.tempos[k]) : '')
  const resolver = (t: string) => pt(t).replaceAll('{tempo}', tempoDe(respostas ? `${respostas.escolha}:${respostas.opcao}` : atual?.id))
  const texto = atual && (atual.tipo === 'fala' || atual.tipo === 'narra' || atual.tipo === 'pensa') ? resolver(atual.texto) : ''
  const { shown, done, finish } = useTypewriter(textoPlano(texto), 26)

  const avancar = useCallback(() => {
    if (!atual || ocupado || saindo) return
    if (texto && !done) return finish()
    if (atual.tipo === 'escolha') return
    playSfx('click')
    if (respostas) {
      const resto = respostas.passos.slice(1)
      if (resto.length) {
        setRespostas({ ...respostas, passos: resto })
        return
      }
      setRespostas(null)
      if (respostas.explorar && cena) {
        const p = cena.passos[idx]
        if (p.tipo === 'escolha' && explorados.length < p.opcoes.length) return
      }
      saltar(respostas.ir)
      return
    }
    seguinte()
  }, [atual, ocupado, saindo, texto, done, finish, respostas, cena, idx, explorados.length, saltar, seguinte])

  useAdvanceKeys(avancar, { enabled: !!atual && atual.tipo !== 'escolha' })
  // Voltar do aparelho = Sair (o passo fica salvo para retomar).
  useBackHandler(true, () => onSair?.())

  const escolherOpcao = async (passo: Extract<Passo, { tipo: 'escolha' }>, i: number) => {
    if (!cena || ocupado) return
    const op = passo.opcoes[i]
    if (op.requer && (dados?.itens[op.requer.item] ?? 0) < (op.requer.quantidade ?? 1)) {
      playSfx('error')
      return
    }
    playSfx('confirm')
    setOcupado(true)
    try {
      const r = await escolher(cena.id, passo.id, i)
      aplicarResultado(r)
      const n = r.opcao ?? i
      setDados((d) =>
        d ? { ...d, progresso: { ...d.progresso, escolhas: { ...d.progresso.escolhas, [passo.id]: [...(d.progresso.escolhas[passo.id] ?? []), n] } } } : d,
      )
      const escolhida = passo.opcoes[n] ?? op
      const explorar = passo.modo === 'explorar'
      if (explorar) setExplorados((e) => (e.includes(n) ? e : [...e, n]))
      if (escolhida.respostas?.length) setRespostas({ passos: escolhida.respostas, escolha: passo.id, opcao: n, ir: escolhida.ir, explorar })
      else if (!explorar) saltar(escolhida.ir)
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setOcupado(false)
    }
  }

  /* ── render ── */
  const elenco = cena?.elenco ?? {}
  const falando = atual?.tipo === 'fala' && atual.quem !== 'jogador'
  const titulo = cena?.titulo ?? 'Cena'

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      className={cn('fixed inset-0 z-[95] overflow-hidden bg-black text-dv-text', saindo ? 'cd-out' : 'cd-in', cena?.cenario === 'sobreposto' && 'bg-transparent')}
    >
      <Palco estado={palco} fx={fx.fx} fxKey={fx.key} destinoReal={dados?.destino} falando={!!falando} />

      <VnTopBar
        skipLabel="Sair"
        onSkip={() => onSair?.()}
        chapter={
          <p className="dv-label flex flex-col gap-0.5 text-[10px] text-dv-text-2">
            {cena?.capitulo && <span className="text-dv-gold">{cena.capitulo}</span>}
            <span className="font-display text-[13px] normal-case tracking-[0.06em] text-dv-text">{titulo}</span>
          </p>
        }
      />

      {/* Véu inferior: o texto sempre sobre fundo escuro. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[48%] bg-gradient-to-t from-black/90 via-black/55 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 z-20 mx-auto flex w-full max-w-3xl flex-col gap-2.5 px-4 pb-[max(env(safe-area-inset-bottom),1.25rem)] lg:pb-10">
        {selo && <SeloEfeito key={selo.key} selo={selo} />}

        {erro && (
          <DialogueShell tone="neutral">
            <span className="flex flex-col items-start gap-3 px-6 py-5">
              <span role="alert" className="font-body text-[16px] text-dv-text">{erro}</span>
              <button type="button" onClick={() => onSair?.()} className="dv-focus dv-label min-h-11 border border-dv-line-strong px-4 text-[11px] text-dv-text-2 hover:text-dv-text">
                Fechar
              </button>
            </span>
          </DialogueShell>
        )}

        {!erro && !dados && (
          <p className="dv-label animate-dv-fade py-6 text-center text-[11px] text-dv-text-3" role="status">
            Abrindo a cena…
          </p>
        )}

        {!erro && atual && atual.tipo !== 'escolha' && atual.tipo !== 'ir' && (
          <button
            key={chaveAtual}
            type="button"
            onClick={avancar}
            aria-label={texto && !done ? 'Mostrar texto completo' : 'Continuar'}
            className={cn('en-box-in dv-focus relative block w-full text-left', atual.tipo === 'fala' && 'mt-6')}
          >
            <Caixa passo={atual} texto={texto} shown={shown} done={done || !texto} nome={nome} elenco={elenco} resolver={resolver} />
          </button>
        )}

        {!erro && atual?.tipo === 'escolha' && !respostas && (
          <div className="flex flex-col gap-2" role="group" aria-label="Escolha o que dizer">
            <ChoiceHeader>{atual.pergunta ? resolver(atual.pergunta) : `${nome} · escolha o que dizer`}</ChoiceHeader>
            {atual.opcoes.map((o, i) => {
              if (atual.modo === 'explorar' && explorados.includes(i)) return null
              const trancada = !!o.requer && (dados?.itens[o.requer.item] ?? 0) < (o.requer.quantidade ?? 1)
              const rotulo = resolver(o.texto)
              return trancada ? (
                <OpcaoTrancada key={i} index={i} label={rotulo} motivo={o.requer?.motivo ?? 'Você não tem o item necessário.'} />
              ) : (
                <ChoiceStrip key={i} index={i} delay={80 + i * 70} action={o.acao} label={rotulo} onClick={() => void escolherOpcao(atual, i)} />
              )
            })}
            {atual.modo === 'explorar' && explorados.length > 0 && <ChoiceStrip muted index={atual.opcoes.length} label="Continuar" onClick={() => seguinte()} />}
          </div>
        )}
      </div>
      <style>{`
        .cd-in{animation:cd-in .5s ease-out both}
        .cd-out{animation:cd-out .6s ease-in both}
        @keyframes cd-in{from{opacity:0}to{opacity:1}}
        @keyframes cd-out{from{opacity:1}to{opacity:0}}
        @media (prefers-reduced-motion: reduce){.cd-in,.cd-out{animation-duration:.01s}}
      `}</style>
    </section>
  )
}

/** Caixa de texto de cada tipo de passo (mesma linguagem da encenação inicial). */
function Caixa({
  passo,
  texto,
  shown,
  done,
  nome,
  elenco,
  resolver,
}: {
  passo: Passo
  texto: string
  shown: number
  done: boolean
  nome: string
  elenco: Record<string, MembroElenco>
  resolver: (t: string) => string
}) {
  const cursor = !done && <span aria-hidden="true" className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-dv-blink bg-dv-porcelain" />
  switch (passo.tipo) {
    case 'fala': {
      const eu = passo.quem === 'jogador'
      const m = elenco[passo.quem]
      const placa = passo.nome ?? (eu ? nome : (m?.nome ?? passo.quem))
      return (
        <DialogueShell tone={passo.quem === 'melissa' ? 'cobalt' : 'gold'}>
          <SpeakerPlate key={placa} name={placa} title={eu ? 'você' : passo.nome ? undefined : m?.titulo} tone={eu ? 'gold' : passo.quem === 'melissa' ? 'cobalt' : 'void'} />
          <span className="block px-6 pb-3 pt-7">
            <span aria-live="polite" className="block min-h-[3.25rem] text-pretty font-body text-[17px] leading-relaxed text-dv-text">
              <TextoRico texto={texto} shown={shown} />
              {cursor}
            </span>
            <span className="mt-1.5 flex justify-end">
              <AdvanceIndicator visible={done} tone={eu ? 'gold' : 'cobalt'} />
            </span>
          </span>
        </DialogueShell>
      )
    }
    case 'narra':
      return (
        <DialogueShell tone="gold">
          <span className="flex items-stretch gap-2 px-4 pb-3 pt-5">
            <Colchete lado="esq" />
            <span className="flex-1">
              <span aria-live="polite" className="block min-h-[3.25rem] text-pretty text-center font-body text-[17px] italic leading-relaxed text-dv-text-2">
                <TextoRico texto={texto} shown={shown} />
                {cursor}
              </span>
              <span className="mt-1 flex justify-center">
                <AdvanceIndicator visible={done} />
              </span>
            </span>
            <Colchete lado="dir" />
          </span>
        </DialogueShell>
      )
    case 'pensa':
      return (
        <DialogueShell tone="neutral">
          <span className="block px-6 pb-3 pt-4">
            <span className="dv-label mb-1.5 flex items-center gap-2 text-[10px] text-dv-text-3">
              <GlyphDiamond className="size-2 text-dv-amethyst" filled />
              {nome} · pensa
            </span>
            <span aria-live="polite" className="block min-h-[3.25rem] text-pretty font-body text-[17px] italic leading-relaxed text-dv-text">
              <span aria-hidden="true" className="mr-0.5 font-display text-[22px] leading-none text-dv-gold/70">“</span>
              <TextoRico texto={texto} shown={shown} />
              {done && <span aria-hidden="true" className="ml-0.5 font-display text-[22px] leading-none text-dv-gold/70">”</span>}
              {cursor}
            </span>
            <span className="mt-1 flex justify-end">
              <AdvanceIndicator visible={done} />
            </span>
          </span>
        </DialogueShell>
      )
    case 'som':
      return (
        <DialogueShell tone="neutral">
          <span className="flex min-h-[64px] items-center justify-center gap-3 px-6 py-4">
            <OndaSom />
            <span className="font-mono text-[13px] uppercase tracking-[0.2em] text-dv-text-2">*{resolver(passo.texto)}*</span>
            <OndaSom espelho />
          </span>
        </DialogueShell>
      )
    case 'sistema': {
      const pars = Array.isArray(passo.texto) ? passo.texto : [passo.texto]
      return (
        <DialogueShell tone="cobalt">
          <span className="block px-5 pb-4 pt-5">
            {passo.titulo && (
              <span className="mb-3 flex items-center gap-2.5">
                <span aria-hidden="true" className="size-2 rotate-45 bg-dv-amethyst shadow-[0_0_8px_rgba(138,124,200,0.8)]" />
                <span className="font-display text-[16px] font-semibold uppercase tracking-[0.16em] text-dv-text">{resolver(passo.titulo)}</span>
                <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-dv-line-strong to-transparent" />
                <span className="dv-label text-[9px] text-dv-text-3">Sistema</span>
              </span>
            )}
            <span aria-live="polite" className="devo-scroll block max-h-[46dvh] space-y-2.5 overflow-y-auto pr-1">
              {pars.map((t, i) => (
                <span key={i} className="animate-dv-rise block text-pretty font-body text-[15.5px] leading-relaxed text-dv-text-2" style={{ animationDelay: `${i * 220}ms` } as CSSProperties}>
                  <TextoRico texto={resolver(t)} />
                </span>
              ))}
            </span>
            <span className="mt-2 flex justify-end">
              <AdvanceIndicator visible label="Continuar" />
            </span>
          </span>
        </DialogueShell>
      )
    }
    case 'efeito':
      return (
        <span className="en-item flex items-center gap-3 self-start border-l-[3px] border-dv-gold bg-[linear-gradient(90deg,color-mix(in_oklab,var(--dv-gold-deep)_90%,transparent),color-mix(in_oklab,var(--dv-ink-2)_92%,transparent))] py-3 pl-3 pr-6 shadow-[0_10px_24px_rgba(0,0,0,0.6)] [clip-path:polygon(0_0,100%_0,calc(100%-12px)_100%,0_100%)]">
          <GlyphKeyhole className="size-6 text-dv-gold-bright" />
          <span className="flex flex-col">
            <span className="dv-label text-[10px] text-dv-gold-bright">{passo.efeitos.some((e) => e.tipo === 'contato') ? 'Contato' : 'Recebido'}</span>
            <span className="font-display text-[15px] font-semibold uppercase tracking-[0.08em] text-dv-text">{resolver(passo.aviso ?? 'Efeito aplicado')}</span>
          </span>
        </span>
      )
    default:
      return null
  }
}

/** Colchete de aço: a narração "[entre colchetes]" do texto do dono, desenhada. */
function Colchete({ lado }: { lado: 'esq' | 'dir' }) {
  return (
    <span aria-hidden="true" className={cn('my-1 w-2 shrink-0 border-y border-dv-gold/50', lado === 'esq' ? 'border-l' : 'border-r')} />
  )
}

function OndaSom({ espelho = false }: { espelho?: boolean }) {
  return (
    <svg viewBox="0 0 28 16" className={cn('h-4 w-7 text-dv-gold/70', espelho && '-scale-x-100')} fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <path d="M2 8h3M8 4v8M12 1v14M16 5v6M20 7v2" strokeLinecap="round" />
    </svg>
  )
}

/** Opção que exige um item que o jogador não tem: escura, com cadeado e o motivo (não clica). */
function OpcaoTrancada({ index, label, motivo }: { index: number; label: string; motivo: string }) {
  return (
    <div className="animate-dv-slide-left" style={{ animationDelay: `${80 + index * 70}ms` }}>
      <button
        type="button"
        disabled
        aria-label={`${label} — trancada: ${motivo}`}
        style={{ '--dv-cut': '12px' } as CSSProperties}
        className="dv-cut-diag relative flex min-h-12 w-full cursor-not-allowed items-center gap-3 bg-dv-ink/90 py-2.5 pl-4 pr-4 text-left opacity-70 shadow-[inset_0_0_0_1px_var(--dv-line)]"
      >
        <GlyphKeyhole aria-hidden="true" className="size-4 shrink-0 text-dv-text-3" />
        <span className="flex flex-col">
          <span className="font-body text-[16px] text-dv-text-3 line-through decoration-dv-line-strong">{label}</span>
          <span className="dv-label text-[10px] text-dv-text-3">{motivo}</span>
        </span>
      </button>
    </div>
  )
}

function SeloEfeito({ selo }: { selo: Selo }) {
  return (
    <div role="status" className="en-item flex items-center gap-3 self-start border-l-[3px] border-dv-gold bg-[linear-gradient(90deg,color-mix(in_oklab,var(--dv-ink-3)_96%,transparent),color-mix(in_oklab,var(--dv-ink-2)_92%,transparent))] py-2 pl-3 pr-6 shadow-[0_10px_24px_rgba(0,0,0,0.6)] [clip-path:polygon(0_0,100%_0,calc(100%-12px)_100%,0_100%)]">
      <GlyphHourglass className={cn('size-6', selo.tom === 'perda' ? 'text-dv-blood-text' : 'text-dv-gold-bright')} />
      <span className="flex flex-col">
        <span className="dv-label text-[10px] text-dv-text-2">{selo.titulo}</span>
        <span className={cn('dv-tabular font-impact text-[22px] leading-none tracking-[0.04em]', selo.tom === 'perda' ? 'text-dv-blood-text' : 'text-dv-text')}>{selo.texto}</span>
      </span>
    </div>
  )
}
