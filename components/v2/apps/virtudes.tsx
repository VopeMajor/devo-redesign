'use client'

import { useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { AFINIDADE_ROTULO, type Afinidade, numeralEstagio, TEXTOS_VIRTUDES, VIRTUDE_KEYS, VIRTUDES, type VirtudeKey, type VirtudesPayload } from '@/lib/devo/virtudes'
import { useOsNav } from '@/components/devo/os/os-nav'
import { useVirtudes } from '@/components/devo/virtudes/virtudes-app'
import { VirtudesMesa } from '@/components/devo/virtudes/virtudes-mesa'
import { Legado, px, Seta } from '../comum'
import { Losangos, MetalNaipes, NaipeV2, nomeArcano } from './virtudes-naipe'

/**
 * Virtudes no v2 (protótipo kit3/os-virtudes.js, aprovado: "aprovo"), no modo dos Traços do Star Rail: os seis
 * naipes em constelação em volta do Arcano, o detalhe da Virtude tocada, os Pontos de Potencial em gomos (sem
 * número: regra do dono), o atalho para os Arcanos, os textos literais do dono (lib/devo/virtudes.ts) e o histórico
 * de Evoluções. Dados de /api/virtudes, o mesmo payload qualitativo da tela antiga (trancado pela flag `virtudes`,
 * com o motivo do servidor). Owner/Anfitrião (verTodos) ganham a aba Mesa: a Mesa das Virtudes do jogo atual, onde
 * os números aparecem (sem desenho no protótipo, fica dentro de <Legado>).
 */

type Liberado = Extract<VirtudesPayload, { liberado: true }>

/** Número de cada Virtude no doc do dono (Paus nº 1 … Escudos nº 6). */
const NUMERO: Record<VirtudeKey, number> = { paus: 1, copas: 2, ouros: 3, espadas: 4, tacas: 5, escudos: 6 }
const GRAU: Record<Afinidade, number> = { excelente: 5, favorecida: 4, regular: 3, dificil: 2, deficiente: 1 }
/** Frases curtas da afinidade (as mesmas da tela antiga e do protótipo). */
const FRASE: Record<Afinidade, string> = {
  excelente: 'O caminho mais natural do seu Arcano.',
  favorecida: 'Cresce com pouca resistência.',
  regular: 'Nem dom, nem obstáculo.',
  dificil: 'Pede mais do que devolve.',
  deficiente: 'Seu Arcano mal a sustenta.',
}
const DATA = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Sao_Paulo' })
/** Seis pontos num hexágono, começando no alto (coordenadas em % do céu). */
const POS = VIRTUDE_KEYS.map((_, i) => {
  const a = ((i * 60 - 90) * Math.PI) / 180
  return [50 + Math.cos(a) * 38, 50 + Math.sin(a) * 38] as const
})

export function VirtudesV2() {
  const { data, error, isLoading, mutate } = useVirtudes()
  if (!data) {
    return (
      <div className="v-msg">
        {error ? (
          <>
            <p role="alert">{(error as Error).message}</p>
            <button type="button" className="r-bt chanfro" onClick={() => void mutate()}>
              Tentar de novo
            </button>
          </>
        ) : (
          <p role="status">{isLoading ? 'Lendo os naipes…' : ''}</p>
        )}
      </div>
    )
  }
  if (!data.liberado) {
    return (
      <div className="v-msg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/v2/art/os/px/aco/cadeado.png" alt="" />
        <strong>Virtudes trancadas</strong>
        <p>{data.motivo}</p>
      </div>
    )
  }
  return <Tela d={data} />
}

function Tela({ d }: { d: Liberado }) {
  const [aba, setAba] = useState<'virtudes' | 'mesa'>('virtudes')
  if (!d.verTodos) return <Virtudes d={d} />
  return (
    <>
      <div className="r-abas v-abas" role="tablist" aria-label="Virtudes">
        {(
          [
            ['virtudes', 'Virtudes'],
            ['mesa', 'Mesa'],
          ] as const
        ).map(([id, nome]) => (
          <button key={id} type="button" role="tab" aria-selected={aba === id} className="chanfro" onClick={() => setAba(id)}>
            {nome}
          </button>
        ))}
      </div>
      {aba === 'virtudes' ? (
        <Virtudes d={d} />
      ) : (
        <section className="v-mesa" role="tabpanel" aria-label="Mesa das Virtudes">
          <h3 className="sec">
            <span>Mesa da equipe</span>
          </h3>
          <Legado>
            <VirtudesMesa />
          </Legado>
        </section>
      )}
    </>
  )
}

function Virtudes({ d }: { d: Liberado }) {
  const nav = useOsNav()
  const porKey = new Map(d.virtudes.map((v) => [v.key, v]))
  const af = (k: VirtudeKey) => porKey.get(k)?.afinidade ?? null
  const inicial: VirtudeKey = d.tendencia && af(d.tendencia) ? d.tendencia : (VIRTUDE_KEYS.find((k) => af(k) === 'excelente') ?? 'paus')
  const [sel, setSel] = useState<VirtudeKey>(inicial)
  const a = d.acumulo
  const acesos = a.cheio ? 5 : a.nivel === 0 ? 0 : a.nivel + 1
  const est = numeralEstagio(d.estagio)
  const nomeArc = d.arcano ? nomeArcano(d.arcano.titulo) : null

  return (
    <>
      <MetalNaipes />
      <section className="v-ceu" aria-label={d.arcano ? `${d.arcano.titulo}, Estágio ${est}` : 'Arcano não revelado'}>
        <svg className="v-linhas" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="46" className="v-anel" />
          <circle cx="50" cy="50" r="38" className="v-anel v-anel2" />
          <polygon points={POS.map((p) => p.join(',')).join(' ')} className="v-hex" />
          {POS.map((p, i) => (
            <line key={VIRTUDE_KEYS[i]} x1="50" y1="50" x2={p[0]} y2={p[1]} className={'v-raio' + (VIRTUDE_KEYS[i] === sel ? ' sel' : '')} />
          ))}
        </svg>
        <div className="v-centro">
          <small>Arcano</small>
          <b>{d.arcano ? d.arcano.numeral : '?'}</b>
          <strong>{nomeArc ?? 'Não revelado'}</strong>
          <em>Estágio {est}</em>
        </div>
        {VIRTUDE_KEYS.map((k, i) => {
          const f = af(k)
          const on = k === sel
          return (
            <button
              key={k}
              type="button"
              className={['v-no', f ?? 'apagado', on ? 'sel' : ''].filter(Boolean).join(' ')}
              style={{ left: `${POS[i][0]}%`, top: `${POS[i][1]}%`, ['--i' as string]: i }}
              aria-pressed={on}
              aria-label={`${VIRTUDES[k].nome}: ${f ? 'afinidade ' + AFINIDADE_ROTULO[f].toLowerCase() : 'afinidade desconhecida'}`}
              onClick={() => {
                if (k !== sel) playSfx('click')
                setSel(k)
              }}
            >
              <span className="v-disco">
                <NaipeV2 k={k} />
              </span>
              <span className="v-nome">{VIRTUDES[k].nome}</span>
              <Losangos n={f ? GRAU[f] : 0} />
            </button>
          )
        })}
      </section>
      {!d.arcano && (
        <p className="v-aviso" role="status">
          Sua afinidade aparece quando o Anfitrião registrar o seu Arcano.
        </p>
      )}
      <p className="v-abertura">{TEXTOS_VIRTUDES.abertura}</p>

      <Detalhe key={sel} k={sel} afinidade={af(sel)} tendencia={d.tendencia === sel} />

      <section className="v-pp" aria-labelledby="v-pp-t">
        <div className="v-cab">
          <small>Pontos de Potencial · Estágio {est}</small>
          <h3 id="v-pp-t">{a.rotulo}</h3>
        </div>
        <div className="v-barra" role="img" aria-label={`Acúmulo do Estágio: ${a.rotulo.toLowerCase()}`}>
          {[0, 1, 2, 3, 4].map((i) => (
            <i key={i} className={i < acesos ? 'on' : undefined} style={{ ['--i' as string]: i }} />
          ))}
          <u className={a.cheio ? 'on' : undefined} />
        </div>
        <div className="v-legenda">
          <span>Pouco</span>
          <span>Limite do Estágio</span>
        </div>
        <p>
          {d.ultimoEstagio
            ? 'Último Estágio. O corpo não tem para onde se transformar.'
            : 'Na próxima Evolução de Estágio do seu Arcano, paga com Fragmentos Arcanos na tela dos Arcanos, o que você acumulou se espalha pelas Virtudes.'}
        </p>
        {d.tendencia && (
          <p className="v-tend">
            <NaipeV2 k={d.tendencia} cl="mini" />
            <span>
              Seu esforço tem pendido para <b>{VIRTUDES[d.tendencia].nome}</b>.
            </span>
          </p>
        )}
        <details className="v-como">
          <summary>Como funciona</summary>
          <p>{TEXTOS_VIRTUDES.potencial}</p>
          <p>
            {TEXTOS_VIRTUDES.metamorfose} {TEXTOS_VIRTUDES.limite}
          </p>
          <p className="v-it">{TEXTOS_VIRTUDES.controle}</p>
        </details>
      </section>

      <button
        type="button"
        className="v-arcano"
        onClick={() => {
          playSfx('open')
          nav.open('arcanos')
        }}
      >
        <span className="v-arc-ic">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={px('arcanos')} alt="" />
        </span>
        <span>
          <small>{d.arcano ? 'Seu Arcano' : 'Arcanos'}</small>
          <strong>{d.arcano ? `${d.arcano.numeral} · ${nomeArc}` : 'Os vinte e dois'}</strong>
        </span>
        <em>
          Abrir Arcanos <Seta />
        </em>
      </button>

      <section className="v-sobre" aria-labelledby="v-sobre-t">
        <h3 className="sec" id="v-sobre-t">
          <span>Os seis caminhos</span>
        </h3>
        <p>{TEXTOS_VIRTUDES.naipes}</p>
        <p>{TEXTOS_VIRTUDES.misterio}</p>
      </section>

      <section className="v-hist" aria-labelledby="v-hist-t">
        <h3 className="sec" id="v-hist-t">
          <span>Evoluções de Estágio</span>
        </h3>
        {d.evolucoes.length ? (
          <ol>
            {d.evolucoes.map((e) => (
              <li key={`${e.at}-${e.para}`}>
                <b>{numeralEstagio(e.para)}</b>
                <div>
                  <strong>
                    Estágio {numeralEstagio(e.de)} → {numeralEstagio(e.para)}
                  </strong>
                  <small>
                    {DATA.format(e.at)}
                    {e.arcano ? ' · ' + e.arcano : ''}
                  </small>
                  {e.maisCresceu && e.menosCresceu ? (
                    <p>
                      <span>
                        <NaipeV2 k={e.maisCresceu} cl="mini" />
                        Mais cresceu: <em>{VIRTUDES[e.maisCresceu].nome}</em>
                      </span>
                      <span>
                        <NaipeV2 k={e.menosCresceu} cl="mini apagado" />
                        Menos: <em>{VIRTUDES[e.menosCresceu].nome}</em>
                      </span>
                    </p>
                  ) : (
                    <p className="v-it">Nada acumulado para espalhar nesta metamorfose.</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="v-it">Nenhuma metamorfose ainda. O corpo continua no primeiro Estágio que conheceu.</p>
        )}
      </section>
      <p className="v-fecho">{TEXTOS_VIRTUDES.fecho}</p>
    </>
  )
}

/** O cartão da Virtude tocada (troca com uma entrada curta; `key` = a Virtude). */
function Detalhe({ k, afinidade: a, tendencia }: { k: VirtudeKey; afinidade: Afinidade | null; tendencia: boolean }) {
  const v = VIRTUDES[k]
  return (
    <article className="v-detalhe" aria-live="polite">
      <header>
        <span className={'v-disco ' + (a ?? 'apagado')}>
          <NaipeV2 k={k} />
        </span>
        <div>
          <small>
            Virtude nº {NUMERO[k]}
            {v.antiga ? ' · antiga' : ''}
          </small>
          <h3>{v.nome}</h3>
        </div>
        <span className={'v-af' + (a ? ' ' + a : '')}>
          <Losangos n={a ? GRAU[a] : 0} />
          {a ? AFINIDADE_ROTULO[a] : 'Desconhecida'}
        </span>
      </header>
      <p>{v.texto}</p>
      {a && <p className="v-it">{FRASE[a]}</p>}
      {v.antiga && (
        <p className="v-nota">
          {TEXTOS_VIRTUDES.antigas} {TEXTOS_VIRTUDES.antigasFim}
        </p>
      )}
      {tendencia && <p className="v-tag">Para onde seu esforço tem ido</p>}
    </article>
  )
}
