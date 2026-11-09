'use client'

import { useCallback, useEffect, useRef } from 'react'
import useSWR from 'swr'
import { Pixelify_Sans } from 'next/font/google'
import { APARENCIA_PADRAO, type CasaMapaPayload } from '@/lib/devo/casa-aparencia'
import { CENA_ANFITRIAO_DE_QUE, CENA_GALO_TORRES } from '@/lib/devo/torres/galo'
import type { Efeito, NpcRef, SubirResposta, TorresPayload } from '@/lib/devo/torres/tipos'
import { useOsNav } from '@/components/devo/os/os-nav'
import { useDevo } from '@/components/devo/state/devo-store'
import { usePlayerText } from '@/components/devo/state/player-text'
import { pedirCena } from '@/components/devo/torres/gatilho'
import { voltarJanela } from '../voltar'
import { criaTorres, type TorresMotor } from './motor'
import './torres.css'

/**
 * Torres de Ruptura no visual novo (DEVO v2), a partir do protótipo aprovado (docs/redesign/v2/kit3/torres.html;
 * dono, 07/11: "Aprovo"). Nada da tela antiga se perde: o servidor é o mesmo (/api/torres), com as essências, as
 * chaves, os andares, os prêmios, as cenas que já existem, a apresentação do Galo (com o presente de fã) e a reflexão
 * "Anfitrião de quê?" ao sair. O seu chibi é o da Casa (/api/casa/mapa); sem Casa ainda, o chibi padrão.
 */
const pixel = Pixelify_Sans({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600'], variable: '--tv-pixel' })

const API = '/api/torres'
async function getTorres(url: string): Promise<TorresPayload> {
  const r = await fetch(url, { cache: 'no-store' })
  const j = await r.json().catch(() => null)
  if (!r.ok) throw new Error(j?.error ?? 'As torres não responderam.')
  return j
}
async function post<T>(body: Record<string, unknown>): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const r = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    const j = await r.json().catch(() => null)
    if (!r.ok || j?.ok === false) return { ok: false, error: j?.error ?? 'As torres não responderam. Tente de novo.' }
    return { ok: true, data: j as T }
  } catch {
    return { ok: false, error: 'Sem conexão com o servidor.' }
  }
}
// a aparência do chibi vem da Casa; chave própria para o Tempo devolvido pelo servidor entrar uma vez só
const CHAVE_CASA = ['torres:aparencia', '/api/casa/mapa'] as const
async function getCasa([, url]: typeof CHAVE_CASA): Promise<CasaMapaPayload & { timeDeltaMs?: number }> {
  const r = await fetch(url, { cache: 'no-store' })
  const j = await r.json().catch(() => null)
  if (!r.ok) throw new Error(j?.error ?? 'A casa não respondeu.')
  return j
}
const aplicados = new WeakSet<object>()

const GALO: NpcRef = { id: 'galo', nome: 'O Galo', titulo: 'Anfitrião do Arcano do Imperador', pose: 'malicia' }
const COR_GALO = '#d9b65c'

export function TorresV2() {
  const { dispatch } = useDevo()
  const say = usePlayerText()
  const nav = useOsNav()
  const { data, error, mutate } = useSWR(API, getTorres, { revalidateOnFocus: false })
  const casa = useSWR(CHAVE_CASA, getCasa, {
    revalidateOnFocus: false,
    onSuccess: (d) => {
      if (aplicados.has(d)) return
      aplicados.add(d)
      if (d.liberado && d.timeDeltaMs) dispatch({ type: 'ADD_TIME', ms: d.timeDeltaMs })
    },
  })
  // sem Casa (trancada ou falhou) o chibi é o padrão; espera só a primeira resposta para não trocar de roupa na frente
  const casaPronta = !!casa.data || !!casa.error
  const aparencia = (casa.data?.liberado && casa.data.aparencia) || APARENCIA_PADRAO

  const raiz = useRef<HTMLDivElement>(null)
  const motor = useRef<TorresMotor | null>(null)
  const liberado = data?.liberado ? data : null
  const cb = useRef({ say, nav, mutate })
  cb.current = { say, nav, mutate }

  const subir = useCallback(async (torre: string, andar: number): Promise<SubirResposta | { erro: string }> => {
    const r = await post<SubirResposta>({ action: 'subir', torre, andar })
    if (!r.ok) return { erro: r.error }
    void cb.current.mutate()
    return r.data
  }, [])

  const temMotor = !!liberado && casaPronta
  useEffect(() => {
    if (!temMotor || !raiz.current || !liberado) return
    const m = criaTorres(raiz.current, {
      torres: liberado.torres,
      aparencia,
      texto: (s) => cb.current.say(s),
      onSubir: subir,
      onCasa: () => cb.current.nav.open('casa'),
    })
    motor.current = m
    voltarJanela.torres = () => m.fechaTopo()
    return () => {
      delete voltarJanela.torres
      m.destroi()
      motor.current = null
    }
    // o motor nasce uma vez; dados novos chegam por atualiza()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temMotor])

  useEffect(() => {
    if (liberado) motor.current?.atualiza({ torres: liberado.torres })
  }, [liberado])
  useEffect(() => {
    motor.current?.atualiza({ aparencia })
  }, [aparencia])

  /* apresentação do Galo: uma vez, na primeira vez que as Torres abrem (texto literal do dono, lib/devo/torres/galo.ts) */
  const galoTocou = useRef(false)
  useEffect(() => {
    if (!temMotor || !liberado || liberado.apresentacao.galoVista || galoTocou.current || !motor.current) return
    galoTocou.current = true
    const m = motor.current
    const fim = async () => {
      await post({ action: 'galo.visto' })
      void cb.current.mutate()
    }
    const efeito = async (e: Efeito) => {
      const aceitar = e === 'galo.fa.aceitar'
      const r = await post<{ concedido: boolean }>({ action: 'galo.fa', aceitar })
      if (!r.ok) return m.aviso(r.error, 3200)
      if (!aceitar || !r.data.concedido) return
      void cb.current.mutate()
      // a cena espera o presente ser visto
      await m.premio({
        titulo: 'Presente do Galo',
        nome: 'Essência de Afinidade do Galo',
        texto: 'Do Galo, Anfitrião do Arcano do Imperador. Abre andares da Torre do Imperador. Fica no seu inventário.',
        cor: COR_GALO,
      })
    }
    m.apresentacao(CENA_GALO_TORRES, GALO, {
      titulo: 'O Galo apresenta as Torres de Ruptura',
      onEfeito: efeito,
      onPular: liberado.pularApresentacao ? () => void fim() : undefined,
      aoFim: () => void fim(),
    })
  }, [temMotor, liberado])

  /* reflexão "Anfitrião de quê?": ao sair das Torres pela primeira vez depois da apresentação do Galo */
  const pendente = useRef(false)
  pendente.current = !!liberado?.apresentacao.reflexaoPendente
  useEffect(() => {
    const t0 = Date.now()
    return () => {
      if (pendente.current && Date.now() - t0 > 1200) pedirCena(CENA_ANFITRIAO_DE_QUE)
    }
  }, [])

  let aviso: React.ReactNode = null
  if (!data || (data.liberado && !casaPronta)) {
    aviso = (
      <section role={error ? 'alert' : 'status'}>
        <h2>{error ? 'As torres não responderam' : 'Abrindo as torres…'}</h2>
        {error && <p>{(error as Error).message}</p>}
        {error && <button onClick={() => void mutate()}>Tentar de novo</button>}
      </section>
    )
  } else if (!data.liberado) {
    aviso = (
      <section role="alert">
        <h2>🔒 Torres de Ruptura</h2>
        <p>{data.motivo}</p>
      </section>
    )
  }

  return (
    <div className={`tv ${pixel.variable}`}>
      {aviso && <div className="tv-tranca">{aviso}</div>}
      <div ref={raiz} className="tv-ilha" hidden={!temMotor} />
    </div>
  )
}
