'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import useSWR from 'swr'
import { Pixelify_Sans } from 'next/font/google'
import { APARENCIA_PADRAO, type Aparencia, type CasaMapaPayload } from '@/lib/devo/casa-aparencia'
import { Tela } from '@/components/devo/casa/casa-app'
import { useCasa } from '@/components/devo/casa/dados'
import { useDevo } from '@/components/devo/state/devo-store'
import { useBackHandler } from '@/components/devo/use-back-handler'
import { CriacaoAvatar } from './avatar'
import { type CasaMotor, criaCasa } from './motor'
import type { FimSimon } from './visita-simon'
import './casa.css'

/**
 * A Casa em RPG Maker no jogo (DEVO v2, etapas 5 e 6 do PLANO-PUBLICACAO.md), a partir do protótipo aprovado
 * (docs/redesign/v2/kit3/casa.html e avatar.html). Abre pelo ícone Casa do Mapa do Devo e ocupa a tela inteira.
 *  · aparência: a primeira é grátis e aparece assim que a Casa é desbloqueada; trocar é no guarda-roupa do quarto,
 *    por 1 hora de Tempo (servidor: /api/casa/mapa);
 *  · a mesa de confecção abre a mesma Confecção e os mesmos Pacotes de antes (/api/casa), nada se perde;
 *  · a campainha toca enquanto o Simon não for atendido; o fim da visita fica salvo no servidor.
 */
const pixel = Pixelify_Sans({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600'], variable: '--cv-pixel' })

const MAPA = '/api/casa/mapa'
async function getMapa(url: string): Promise<CasaMapaPayload & { timeDeltaMs?: number }> {
  const r = await fetch(url, { cache: 'no-store' })
  const j = await r.json().catch(() => null)
  if (!r.ok) throw new Error(j?.error ?? 'A casa não respondeu.')
  return j
}
async function postMapa<T>(body: Record<string, unknown>): Promise<T> {
  const r = await fetch(MAPA, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const j = await r.json().catch(() => null)
  if (!r.ok || !j?.ok) throw new Error(j?.error ?? 'A casa não respondeu. Tente de novo.')
  return j as T
}
const idem = () => Math.random().toString(36).slice(2, 12) + Date.now().toString(36)

type Vista = 'mapa' | 'guarda' | 'mesa'
const aplicados = new WeakSet<object>()
const QUARTOS = 'devo-casa-quartos-vistos'
const quartosVistos = () => {
  try {
    return localStorage.getItem(QUARTOS) === '1'
  } catch {
    return true
  }
}
const marcaQuartos = () => {
  try {
    localStorage.setItem(QUARTOS, '1')
  } catch {}
}

export function CasaV2({ onFechar, onAbre }: { onFechar: () => void; onAbre: (id: string) => void }) {
  const [alvo, setAlvo] = useState<HTMLElement | null>(null)
  useEffect(() => setAlvo(document.body), [])
  if (!alvo) return null
  return createPortal(<Casa onFechar={onFechar} onAbre={onAbre} />, alvo)
}

function Casa({ onFechar, onAbre }: { onFechar: () => void; onAbre: (id: string) => void }) {
  const { dispatch } = useDevo()
  const { data, error, mutate } = useSWR(MAPA, getMapa, {
    revalidateOnFocus: false,
    onSuccess: (d) => {
      if (aplicados.has(d)) return
      aplicados.add(d)
      if (d.liberado && d.timeDeltaMs) dispatch({ type: 'ADD_TIME', ms: d.timeDeltaMs })
    },
  })
  const casa = useCasa(!!data?.liberado)
  const [tela, setTela] = useState<Vista>('mapa')
  const raiz = useRef<HTMLDivElement>(null)
  const motor = useRef<CasaMotor | null>(null)
  const telaRef = useRef<Vista>('mapa')
  telaRef.current = tela
  const tocou = useRef(false)

  const fecharMesa = () => {
    setTela('mapa')
    void mutate()
  }
  // o voltar do aparelho fecha só a camada de cima: mesa/guarda-roupa → cartão, viagem, andares → a Casa.
  // No meio da visita do Simon ele não faz nada (a visita se perderia).
  useBackHandler(true, () => {
    if (telaRef.current === 'mesa') return fecharMesa()
    if (telaRef.current === 'guarda') return setTela('mapa')
    const m = motor.current
    if (m?.emVisita) return
    if (m?.fechaTopo()) return
    onFechar()
  })

  const fimVisita = useCallback(
    async (r: FimSimon) => {
      try {
        const j = await postMapa<{ guardaChuva: boolean }>({ action: 'visita.simon', fim: r.fim, guardaChuva: r.guardaChuva, escolhas: r.escolhas })
        // o aviso só depois de o servidor confirmar o item
        if (j.guardaChuva) motor.current?.aviso('Guarda-chuva guardado no inventário')
      } catch (e) {
        motor.current?.aviso((e as Error).message, 3200)
      }
      void mutate()
    },
    [mutate],
  )

  const liberada = data?.liberado ? data : null
  const aparencia = liberada?.aparencia ?? null

  // o mapa nasce quando já há aparência; os callbacks leem o estado pelas refs
  const cb = useRef({ onFechar, onAbre, fimVisita })
  cb.current = { onFechar, onAbre, fimVisita }
  const temMapa = !!(liberada && aparencia)
  useEffect(() => {
    if (!temMapa || !raiz.current || !liberada || !aparencia) return
    // o andar dos quartos abriu longe da Casa (a fabricação terminou com ela fechada): o motor nasce na etapa 2 e o
    // aviso "O andar dos quartos abriu" aparece ao entrar, uma vez
    const etapa = liberada.etapa === 3 && !liberada.equipe && !quartosVistos() ? 2 : liberada.etapa
    const m = criaCasa(raiz.current, {
      aparencia,
      etapa,
      andamento: liberada.andamento,
      equipe: liberada.equipe,
      onSair: () => cb.current.onFechar(),
      onTorres: () => cb.current.onAbre('torres'),
      onMesa: () => setTela('mesa'),
      onGuardaRoupa: () => setTela('guarda'),
      onFimVisita: (r) => void cb.current.fimVisita(r),
      ocupado: () => telaRef.current !== 'mapa',
    })
    motor.current = m
    return () => {
      m.destroi()
      motor.current = null
    }
    // o motor é criado uma vez; dados novos chegam por atualiza()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temMapa])

  // dados novos do servidor: fabricações, andar dos quartos, aparência
  useEffect(() => {
    if (!liberada || !aparencia || !motor.current) return
    motor.current.atualiza({ etapa: liberada.etapa, andamento: liberada.andamento, aparencia })
    if (liberada.etapa === 3) marcaQuartos()
  }, [liberada, aparencia])

  // a campainha: o Simon bate enquanto não for atendido (uma vez a cada vez que a Casa abre), quando o jogador estiver
  // livre (sem painel aberto, parado, com a aba à vista)
  useEffect(() => {
    if (!temMapa || liberada?.visita !== 'simon' || tocou.current) return
    tocou.current = true
    let foi = false
    const t = setTimeout(() => {
      foi = true
      motor.current?.campainhaQuandoLivre()
    }, 2600)
    return () => {
      clearTimeout(t)
      // desmontou antes de tocar (ou o React montou duas vezes): toca na próxima
      if (!foi) tocou.current = false
    }
  }, [temMapa, liberada?.visita])

  const salvar = async (ap: Aparencia) => {
    try {
      const j = await postMapa<{ aparencia: Aparencia; mudou: boolean; primeira: boolean; timeDeltaMs: number }>({ action: 'aparencia.salvar', aparencia: ap, idem: idem() })
      if (j.timeDeltaMs) dispatch({ type: 'ADD_TIME', ms: j.timeDeltaMs })
      await mutate()
      if (!j.primeira) {
        setTela('mapa')
        if (j.mudou) setTimeout(() => motor.current?.aviso(`Aparência salva · ${liberada?.trocaMinutos === 60 ? '1 hora' : `${liberada?.trocaMinutos} min`} de Tempo`), 60)
      }
      return null
    } catch (e) {
      return (e as Error).message
    }
  }

  let conteudo: React.ReactNode
  if (!data) {
    conteudo = (
      <div className="cv-tranca">
        <section role={error ? 'alert' : 'status'}>
          <h2>{error ? 'A casa não respondeu' : 'Abrindo a porta…'}</h2>
          {error && <p>{(error as Error).message}</p>}
          {error && (
            <button onClick={() => void mutate()} style={{ marginBottom: 10 }}>
              Tentar de novo
            </button>
          )}
          <button onClick={onFechar}>Voltar ao celular</button>
        </section>
      </div>
    )
  } else if (!data.liberado) {
    conteudo = (
      <div className="cv-tranca">
        <section role="alert">
          <h2>🔒 Porta trancada</h2>
          <p>{data.motivo}</p>
          <button onClick={onFechar}>Voltar ao celular</button>
        </section>
      </div>
    )
  } else if (!data.aparencia) {
    // assim que a Casa é desbloqueada, a primeira escolha do avatar aparece, de graça
    conteudo = <CriacaoAvatar modo="criar" inicial={APARENCIA_PADRAO} trocaMinutos={data.trocaMinutos} onPronto={salvar} onVoltar={onFechar} />
  }

  return (
    <div className={`cv ${pixel.variable}`} data-tela={tela}>
      {conteudo}
      <div ref={raiz} className="cv-mapa" hidden={!temMapa} />
      {temMapa && tela === 'guarda' && aparencia && (
        <CriacaoAvatar modo="guarda" inicial={aparencia} trocaMinutos={data!.liberado ? data!.trocaMinutos : 60} onPronto={salvar} onVoltar={() => setTela('mapa')} />
      )}
      {temMapa && tela === 'mesa' && (
        <section className="cv-mesa" role="dialog" aria-label="Mesa de Confecção">
          <header className="cv-mesa-topo">
            <h2>
              Mesa de Confecção
              <small>Confecção de Cartas e Pacotes</small>
            </h2>
            <button aria-label="Voltar para a sala" onClick={fecharMesa}>
              ✕
            </button>
          </header>
          <div className="cv-mesa-corpo">
            <div className="v2-legado">
              {casa.data?.liberado ? (
                <Tela d={casa.data} agir={casa.agir} resgatar={casa.resgatar} />
              ) : (
                <div className="cv-carrega" role="status">
                  {casa.error ? (casa.error as Error).message : 'Abrindo a mesa…'}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
