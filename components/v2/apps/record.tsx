'use client'

import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { playSfx } from '@/lib/devo/audio'
import { appearanceChangesFor, appearanceOf, chooseAppearance, type AppearanceKind } from '@/lib/devo/appearances'
import { getCard, getCardPeso } from '@/lib/devo/cards'
import { naColecao, type Visual } from '@/lib/devo/cosmeticos'
import { arcLabel, DEADLY_VOTE_STATUS, type DeadlyVote, type DeadlyVoteStatus, OUTCOME_LABEL, recordIdFor } from '@/lib/devo/deadly-votes'
import type { PlayerRole } from '@/lib/devo/deadly-votes'
import type { Invite, InvitesPayload } from '@/lib/devo/invites-server'
import { playerText } from '@/lib/devo/player-name'
import { shufflerStatus } from '@/lib/devo/shuffler'
import { PULSE_CRITICAL_MS, pulseRemaining } from '@/lib/devo/pulse'
import { useNow } from '@/components/devo/hooks'
import { useOsNav } from '@/components/devo/os/os-nav'
import { callName, useDevo } from '@/components/devo/state/devo-store'
import { usePlayerText } from '@/components/devo/state/player-text'
import { useAcesso, useEu } from '@/components/devo/state/use-acesso'
import { EscolherCartasSheet } from '@/components/devo/apps/dv-cartas'
import { EnviarCartaSheet } from '@/components/devo/salao/salao-enviar'
import { useSalao } from '@/components/devo/salao/salao-dados'
import { tallyText } from '@/components/devo/system/deadly-vote-history'
import { useManagerSignals } from '@/components/devo/system/manager-alert'
import { motivoRecusa } from '@/components/devo/system/photo-picker'
import { StaffDesk } from '@/components/devo/system/staff-desk'
import { RECORD_KEY, recordAction, useDeadlyVotes } from '@/components/devo/system/use-deadly-votes'
import { DiarioPanel } from '@/components/devo/poco/diario-panel'
import { Colecao } from '@/components/devo/cosmeticos/colecao'
import { FotoMoldurada, NomeVisual } from '@/components/devo/cosmeticos/cosmetic-art'
import { useMinhaMolduraAvatar } from '@/components/devo/cosmeticos/identidade-panel'
import { useMeusCosmeticos } from '@/components/devo/cosmeticos/use-cosmeticos'
import { mutate as mutateGlobal } from 'swr'
import { erroTexto, Legado, px, Sigilo, Volta } from '../comum'

/**
 * Record no v2 (protótipo kit3/os-record.js): abas em cápsula, a ficha na moldura de ouro (foto redonda, carimbo,
 * dados e números), Aparência, Sistemas, Deadly Votes, Convites, Diário e a Mesa da equipe.
 * Tudo o que o Record do jogo faz continua aqui: foto (recorte e envio ao servidor), moldura de avatar equipada,
 * identidade e Coleção de cosméticos, avisos do Gerente, o baralho com o Card Shuffler e o envio à Bandeja,
 * convocações (inscrever, pedir inscrição, sair, escolher e trocar as cartas levadas, grupo do WhatsApp), dossiê de
 * cada caso, histórico, os estados dos casos, os convites (cota do jogador; cargo, nota e conta de teste da equipe).
 * A Mesa e o Diário ainda são as telas do jogo atual dentro da aba (sem desenho no protótipo).
 */

type Aba = 'ficha' | 'votos' | 'convites' | 'diario' | 'mesa'
const ROLE_LABEL: Record<PlayerRole, string> = { player: 'Jogador', dealer: 'Dealer', anfitriao: 'Anfitrião', owner: 'Sigilo' }
const ABERTOS: DeadlyVoteStatus[] = ['convocado', 'em-progresso']
const TODOS: DeadlyVoteStatus[] = ['convocado', 'em-progresso', 'concluido', 'cancelado', 'falha']

export function RecordV2() {
  const votes = useDeadlyVotes()
  const role = votes.record?.role
  const equipe = role === 'dealer' || role === 'anfitriao' || role === 'owner'
  const [aba, setAba] = useState<Aba>('ficha')
  const [caso, setCaso] = useState<string | null>(null)
  const painel = useRef<HTMLDivElement>(null)
  const pendentes = votes.entries.filter((e) => e.status === 'convocado' && !e.vote.joined).length
  const ABAS: [Aba, string][] = [
    ['ficha', 'Record'],
    ['votos', pendentes ? `Deadly Votes · ${pendentes}` : 'Deadly Votes'],
    ['convites', 'Convites'],
    ['diario', 'Diário'],
    ...(equipe ? ([['mesa', 'Mesa']] as [Aba, string][]) : []),
  ]
  const vai = useCallback((a: Aba, c: string | null = null) => {
    setAba(a)
    setCaso(c)
    painel.current?.closest('.corpo')?.scrollTo({ top: 0 })
  }, [])

  return (
    <>
      <div className="r-abas" role="tablist" aria-label="Seções do registro">
        {ABAS.map(([id, nome]) => (
          <button key={id} role="tab" aria-selected={aba === id} className="chanfro" onClick={() => vai(id)}>
            {nome}
          </button>
        ))}
      </div>
      <div className="r-painel" role="tabpanel" ref={painel}>
        {aba === 'ficha' ? (
          <Ficha votes={votes} role={role ?? null} onVotos={() => vai('votos')} />
        ) : aba === 'votos' ? (
          <Votos votes={votes} caso={caso} onCaso={(c) => vai('votos', c)} />
        ) : aba === 'convites' ? (
          <Convites />
        ) : aba === 'diario' ? (
          <>
            <h4 style={{ marginTop: 0 }}>Diário</h4>
            <Legado>
              <DiarioPanel />
            </Legado>
          </>
        ) : role && role !== 'player' ? (
          <>
            <h4 style={{ marginTop: 0 }}>Mesa</h4>
            <Legado>
              <StaffDesk role={role} />
            </Legado>
          </>
        ) : null}
      </div>
    </>
  )
}

type Votes = ReturnType<typeof useDeadlyVotes>

/* ================================ ficha ================================ */

function Ficha({ votes, role, onVotos }: { votes: Votes; role: PlayerRole | null; onVotos: () => void }) {
  const { state } = useDevo()
  const nav = useOsNav()
  const acesso = useAcesso()
  const now = useNow(1000)
  const resta = pulseRemaining(state.timerEndsAt, now)
  const critico = resta < PULSE_CRITICAL_MS
  const nome = callName(state) ?? 'Não identificado'
  const versao = votes.record?.avatarVersion ?? null
  const foto = versao ? `/api/record/avatar?v=${versao}` : null
  const moldura = useMinhaMolduraAvatar()
  const [corte, setCorte] = useState<{ img: HTMLImageElement; url: string } | null>(null)
  const [colecao, setColecao] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const arquivo = useRef<HTMLInputElement>(null)
  const sinais = useManagerSignals(votes.entries, { onOpenVotes: onVotos, onOpenGames: state.arcadeUnlocked ? () => nav.open('jogos') : undefined })
  const eu = useEu().data
  const arcano = eu?.arcano ? eu.arcano.titulo.replace(/^Arcano d[aoe]s? /, '') : null
  const status = resta === 0 ? playerText('Eliminad{o|a}', { gender: state.profile.gender }) : critico ? 'Crítico' : 'Estável'

  async function envia(image: string | null) {
    setOcupado(true)
    setErro(null)
    setOk(null)
    try {
      await recordAction({ action: 'avatar', image })
      votes.refresh()
      setOk(image ? 'Foto atualizada.' : 'Foto removida.')
    } catch (e) {
      setErro(erroTexto(e, 'Falha ao enviar a foto.'))
    } finally {
      setOcupado(false)
    }
  }
  function escolhe(f: File) {
    setErro(null)
    setOk(null)
    const recusa = motivoRecusa(f)
    if (recusa) return setErro(recusa)
    const url = URL.createObjectURL(f)
    const img = new Image()
    img.onerror = () => {
      URL.revokeObjectURL(url)
      setErro('Não foi possível abrir essa foto. Tente outra (JPEG, PNG ou WebP).')
    }
    img.onload = () => setCorte({ img, url })
    img.src = url
  }

  if (corte)
    return (
      <Recorte
        img={corte.img}
        onFim={(dataUrl) => {
          URL.revokeObjectURL(corte.url)
          setCorte(null)
          if (dataUrl) void envia(dataUrl)
        }}
      />
    )
  if (colecao)
    return (
      <>
        <Volta onClick={() => setColecao(false)}>Record</Volta>
        <Legado>
          <Colecao nome={nome} fotoSrc={foto} onVoltar={() => setColecao(false)} />
        </Legado>
      </>
    )

  return (
    <>
      <p className="r-faixa">
        <span>Arquivo confidencial</span>
        <span>{recordIdFor(state.playerName)}</span>
      </p>
      <div className="r-topo">
        <div className="r-foto-col">
          <div className={'r-foto fundo' + (moldura ? ' com-moldura' : '')}>
            {moldura ? (
              <div className="r-mold">
                <FotoMoldurada formato="avatar" src={foto} moldura={moldura} alt={`Foto de ${nome}`} />
              </div>
            ) : foto ? (
              <img src={foto} alt="Sua foto de perfil" />
            ) : (
              <>
                <span className="sem">
                  <Sigilo />
                </span>
                <span>Sem foto</span>
              </>
            )}
            <b className={'r-carimbo' + (critico ? ' crit' : '')}>{critico ? 'Crítico' : 'Registrado'}</b>
          </div>
          <button className="r-bt chanfro" disabled={ocupado} aria-busy={ocupado || undefined} onClick={() => arquivo.current?.click()}>
            {ocupado ? 'Enviando…' : foto ? 'Trocar foto' : 'Pôr foto'}
          </button>
          {foto && (
            <button className="r-link" disabled={ocupado} onClick={() => envia(null)}>
              Tirar foto
            </button>
          )}
          {/* image/*: no celular abre a escolha entre galeria e câmera */}
          <input
            ref={arquivo}
            type="file"
            accept="image/*"
            hidden
            aria-label="Arquivo da foto do perfil"
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) escolhe(f)
            }}
          />
        </div>
        <dl className="r-dados">
          <div>
            <dt>Participante</dt>
            <dd className="nome">{nome}</dd>
          </div>
          <div className="r-par">
            <div>
              <dt>Status</dt>
              <dd className={critico ? 'crit' : ''}>{status}</dd>
            </div>
            <div>
              <dt>Cargo</dt>
              <dd>{role ? ROLE_LABEL[role] : '—'}</dd>
            </div>
          </div>
          <div>
            <dt>Arcano</dt>
            <dd>{arcano ?? 'Não revelado'}</dd>
          </div>
          <div className="r-stats">
            {[
              ['Cartas', state.inventory.length],
              ['Trocas', state.tradesCompleted],
              ['Avisos', state.notifications.length],
            ].map(([k, v]) => (
              <span key={k} className="fundo">
                <b>{v}</b>
                {k}
              </span>
            ))}
          </div>
        </dl>
      </div>
      {erro && (
        <p className="r-erro" role="alert">
          {erro}
        </p>
      )}
      {ok && !erro && (
        <p className="rv-ok" role="status">
          {ok}
        </p>
      )}

      {sinais.length > 0 && (
        <>
          <h4>Gerente</h4>
          <div className="rv-sinais">
            {sinais.map((s) => (
              <article key={s.id} className={'rv-sinal fundo ' + s.level}>
                <small>{s.source}</small>
                <strong>{s.title}</strong>
                <p>{s.body}</p>
                {s.action && (
                  <button className="r-bt chanfro" onClick={s.action.run}>
                    {s.action.label}
                  </button>
                )}
              </article>
            ))}
          </div>
        </>
      )}

      <h4>Aparência</h4>
      <Aparencias />

      <h4>Identidade</h4>
      <Identidade nome={nome} onAbrir={() => setColecao(true)} />

      <h4>Baralho</h4>
      <Baralho />

      <h4>Sistemas</h4>
      <div className="r-atalhos">
        {(
          [
            ['virtudes', 'Virtudes', 'Naipes e Estágio'],
            ['arcanos', 'Arcanos', 'Os vinte e dois'],
          ] as const
        ).map(([id, n, s]) => {
          const livre = !!acesso?.sistemas.virtudes
          return (
            <button key={id} className="r-at chanfro" onClick={() => nav.open(id)} aria-label={livre ? `Abrir ${n}` : `${n}: trancado`}>
              <img src={px(livre ? id : 'cadeado')} alt="" />
              <span>
                <b>{n}</b>
                <small>{livre ? s : 'Trancado'}</small>
              </span>
            </button>
          )
        })}
      </div>
    </>
  )
}

/** Recorte quadrado da foto (como no protótipo): arrastar e aproximar; sai em JPEG pequeno o bastante para o servidor. */
function Recorte({ img, onFim }: { img: HTMLImageElement; onFim: (dataUrl: string | null) => void }) {
  const cv = useRef<HTMLCanvasElement>(null)
  const pos = useRef({ zoom: 1, x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [erro, setErro] = useState<string | null>(null)
  const base = Math.max(512 / img.width, 512 / img.height)
  const desenha = useCallback(() => {
    const p = pos.current
    const w = img.width * base * p.zoom
    const h = img.height * base * p.zoom
    p.x = Math.min(0, Math.max(512 - w, p.x))
    p.y = Math.min(0, Math.max(512 - h, p.y))
    const ctx = cv.current?.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#0c0c0e'
    ctx.fillRect(0, 0, 512, 512)
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, p.x, p.y, w, h)
  }, [img, base])
  useEffect(() => {
    pos.current = { zoom: 1, x: (512 - img.width * base) / 2, y: (512 - img.height * base) / 2 }
    desenha()
  }, [img, base, desenha])
  const arrasto = useRef<{ x: number; y: number } | null>(null)
  const salva = () => {
    const c = cv.current
    if (!c) return
    // limite do servidor (180 KB): baixa a qualidade e, se precisar, o tamanho
    for (const lado of [512, 384, 320]) {
      const s = document.createElement('canvas')
      s.width = s.height = lado
      s.getContext('2d')?.drawImage(c, 0, 0, lado, lado)
      for (const q of [0.86, 0.78, 0.7, 0.6, 0.5]) {
        const url = s.toDataURL('image/jpeg', q)
        if (((url.length - url.indexOf(',') - 1) * 3) / 4 <= 170_000) return onFim(url)
      }
    }
    setErro('Não deu para comprimir essa foto o bastante. Tente outra imagem.')
  }
  return (
    <>
      <h4 style={{ marginTop: 0 }}>Ajustar foto</h4>
      <p className="r-sub">Arraste para posicionar.</p>
      <canvas
        ref={cv}
        className="r-corte fundo"
        width={512}
        height={512}
        aria-label="Recorte da foto"
        onPointerDown={(e) => {
          arrasto.current = { x: e.clientX, y: e.clientY }
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          const a = arrasto.current
          if (!a) return
          const k = 512 / e.currentTarget.getBoundingClientRect().width
          pos.current.x += (e.clientX - a.x) * k
          pos.current.y += (e.clientY - a.y) * k
          arrasto.current = { x: e.clientX, y: e.clientY }
          desenha()
        }}
        onPointerUp={() => (arrasto.current = null)}
        onPointerCancel={() => (arrasto.current = null)}
      />
      <label className="r-zoom">
        Aproximar
        <input
          type="range"
          min={1}
          max={4}
          step={0.01}
          value={zoom}
          onChange={(e) => {
            // aproxima em volta do centro do recorte
            const novo = +e.target.value
            const p = pos.current
            const f = novo / p.zoom
            p.x = 256 - (256 - p.x) * f
            p.y = 256 - (256 - p.y) * f
            p.zoom = novo
            setZoom(novo)
            desenha()
          }}
        />
      </label>
      {erro && (
        <p className="r-erro" role="alert">
          {erro}
        </p>
      )}
      <div className="r-acoes">
        <button className="r-bt chanfro s-forte" onClick={salva}>
          Salvar
        </button>
        <button className="r-bt chanfro" onClick={() => onFim(null)}>
          Cancelar
        </button>
      </div>
    </>
  )
}

/** As duas aparências do jogador (2D/3D e Real): cada uma se escolhe uma vez e tem 1 troca depois (regra do jogo). */
function Aparencias() {
  const { state, dispatch, changeAppearance } = useDevo()
  const [editando, setEditando] = useState<AppearanceKind | null>(null)
  const [valor, setValor] = useState('')
  const TIPOS: [AppearanceKind, string, string][] = [
    ['art', '2D/3D', 'Personagem de anime, jogo ou animação'],
    ['real', 'Real', 'Ator, atriz ou celebridade'],
  ]
  return (
    <div className="r-apar">
      {TIPOS.map(([k, rot, dica]) => {
        const atual = appearanceOf(state.profile, k)
        const resta = appearanceChangesFor(state.profile, k)
        if (editando === k) {
          const troca = !!atual
          const envia = (e: FormEvent) => {
            e.preventDefault()
            const v = valor.trim()
            if (!v) return
            if (v !== atual?.name) {
              if (troca) changeAppearance({ kind: k, name: v, auto: false })
              else dispatch({ type: 'SET_PROFILE', patch: chooseAppearance(state.profile, { kind: k, name: v, auto: false, chosenAt: Date.now() }) })
              playSfx('confirm')
            }
            setEditando(null)
          }
          return (
            <div key={k} className="r-ap fundo">
              <form className="r-ap-form" onSubmit={envia}>
                <label>
                  <small>
                    {rot}: {dica}
                  </small>
                  <input maxLength={60} required autoComplete="off" autoFocus value={valor} onChange={(e) => setValor(e.target.value)} />
                </label>
                {troca && <em>Esta é a sua única troca.</em>}
                <div>
                  <button className="r-bt chanfro s-forte" type="submit">
                    Confirmar
                  </button>
                  <button className="r-bt chanfro" type="button" onClick={() => setEditando(null)}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )
        }
        return (
          <div key={k} className="r-ap fundo">
            <div className="r-ap-tx">
              <small>{rot}</small>
              <strong>{atual ? atual.name : 'Ainda não escolhida'}</strong>
              <em>{atual ? (resta ? '1 troca disponível' : 'Sem trocas') : dica}</em>
            </div>
            {(!atual || resta > 0) && (
              <button
                className="r-bt chanfro"
                onClick={() => {
                  setValor(atual?.name ?? '')
                  setEditando(k)
                }}
              >
                {atual ? 'Trocar' : 'Escolher'}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

/** Como o jogador aparece (nome com os cosméticos equipados) e a entrada da Coleção, trancada até o 1º Deadly Vote. */
function Identidade({ nome, onAbrir }: { nome: string; onAbrir: () => void }) {
  const { data, error } = useMeusCosmeticos()
  if (error) return <p className="r-sub">A coleção não abriu agora. Tente de novo mais tarde.</p>
  const total = (data?.catalogo ?? []).filter((c) => naColecao(c) && c.active).length
  const meus = new Set((data?.possuidos ?? []).map((p) => p.key))
  const obtidos = (data?.catalogo ?? []).filter((c) => naColecao(c) && meus.has(c.key)).length
  const eq = data?.equipados
  const visual: Visual | null = eq ? { id: 'eu', foto: null, av: eq.moldura_avatar, mini: eq.moldura_mini, emb: eq.emblema, bal: eq.balao, ef: eq.efeito, borda: eq.borda, anfitriao: false } : null
  const trancada = !!data && !data.liberada
  return (
    <div className="r-ap fundo">
      <div className="r-ap-tx">
        <small>Cosméticos</small>
        <strong>{data ? <NomeVisual nome={nome} visual={visual} tamanhoEmblema={18} cor="#fff" /> : nome}</strong>
        <em>{!data ? 'Carregando…' : trancada ? 'A coleção abre depois que você vencer o primeiro Deadly Vote.' : `${obtidos} de ${total} obtidos`}</em>
      </div>
      <button className="r-bt chanfro" disabled={!data?.liberada} onClick={onAbrir}>
        {trancada ? 'Trancada' : 'Coleção'}
      </button>
    </div>
  )
}

/** Resumo do baralho: cartas, o Card Shuffler (desperta com a Sala de Jogos) e o envio à Bandeja do Salão. */
function Baralho() {
  const { state } = useDevo()
  const nav = useOsNav()
  const acesso = useAcesso()
  const salao = !!acesso?.sistemas.salao_mascaras
  const [bandeja, setBandeja] = useState(false)
  const { data } = useSalao(salao && bandeja)
  const n = state.inventory.length
  return (
    <div className="rv-baralho fundo">
      <div className="rv-bar-tx">
        <img src={px('cartas')} alt="" />
        <span>
          <small>Card Shuffler · {shufflerStatus(state.arcadeUnlocked)}</small>
          <strong>
            {n} {n === 1 ? 'carta' : 'cartas'}
          </strong>
        </span>
      </div>
      <div className="r-acoes">
        <button className="r-bt chanfro" onClick={() => nav.open('cartas')}>
          Ver cartas
        </button>
        <button className="r-bt chanfro" onClick={() => nav.open('trocas')}>
          Conseguir cartas
        </button>
        {salao && (
          <button className="r-bt chanfro" onClick={() => setBandeja(true)}>
            Enviar à Bandeja
          </button>
        )}
      </div>
      {salao && <EnviarCartaSheet open={bandeja} onClose={() => setBandeja(false)} modo="bandeja" dados={data && data.liberado ? data : null} />}
    </div>
  )
}

/* ================================ Deadly Votes ================================ */

function quandoComeca(ms: number, now: number) {
  const d = ms - now
  if (d <= 0) return 'agora'
  const dias = Math.floor(d / 86_400_000)
  if (dias >= 2) return `em ${dias} dias`
  const s = Math.floor(d / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `em ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
function decorrido(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
const dataHora = (ms: number) => new Date(ms).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

function Votos({ votes, caso, onCaso }: { votes: Votes; caso: string | null; onCaso: (id: string | null) => void }) {
  const escolhido = votes.entries.find((e) => e.id === caso)?.vote
  if (escolhido) return <Dossie vote={escolhido} votes={votes} onVolta={() => onCaso(null)} />
  const abertos = votes.entries.filter((e) => ABERTOS.includes(e.status))
  const arquivo = votes.entries.filter((e) => !ABERTOS.includes(e.status))
  const conta = (k: DeadlyVoteStatus) => votes.entries.filter((e) => e.status === k).length
  return (
    <>
      <h4 style={{ marginTop: 0 }}>Convocação</h4>
      {votes.error ? (
        <p className="r-erro" role="alert">
          {votes.error.message}
        </p>
      ) : votes.isLoading ? (
        <p className="r-sub">Carregando…</p>
      ) : abertos.length ? (
        <div className="rv-convs">
          {abertos.map((e) => (
            <Convocacao key={e.id} vote={e.vote} votes={votes} onDossie={() => onCaso(e.id)} />
          ))}
        </div>
      ) : (
        <div className="r-voto fundo rv-vazio">
          <strong>Nenhuma convocação aberta</strong>
          <p className="r-sub">Deadly Votes são os desafios do RPG. Quando um Dealer lançar uma edição, ela aparece aqui para inscrição.</p>
        </div>
      )}

      <h4>Estados dos casos</h4>
      <dl className="rv-estados">
        {TODOS.map((k) => (
          <div key={k} className={'fundo e-' + k + (conta(k) ? ' tem' : '')}>
            <dd>{conta(k)}</dd>
            <dt>{DEADLY_VOTE_STATUS[k].short}</dt>
          </div>
        ))}
      </dl>

      <h4>Histórico público</h4>
      {arquivo.length ? (
        <ul className="r-hist">
          {arquivo.map((e) => (
            <li key={e.id}>
              <button className="rv-hist" onClick={() => onCaso(e.id)}>
                <b>
                  № {String(e.vote.number).padStart(3, '0')} · {e.vote.title}
                </b>
                <span className={'e-' + e.status}>
                  {e.vote.outcome ? OUTCOME_LABEL[e.vote.outcome] : DEADLY_VOTE_STATUS[e.status].short}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="r-sub">Nenhum Deadly Vote registrado ainda.</p>
      )}
    </>
  )
}

function useAcao() {
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const roda = async (f: () => Promise<void>, som: 'confirm' | 'click' = 'confirm') => {
    setOcupado(true)
    setErro(null)
    try {
      await f()
      playSfx(som)
    } catch (e) {
      playSfx('error')
      setErro(erroTexto(e, 'Falha na ação.'))
    } finally {
      setOcupado(false)
    }
  }
  return { ocupado, erro, roda }
}

function registroDe(v: DeadlyVote) {
  return v.outcome
    ? OUTCOME_LABEL[v.outcome]
    : v.entryStatus === 'pendente'
      ? 'Em análise'
      : v.entryStatus === 'recusada'
        ? 'Recusada'
        : v.joined
          ? 'Inscrito'
          : 'Não inscrito'
}

/** Inscrever, pedir inscrição, sair, escolher as cartas (caso com peso máximo) e as mensagens de cada situação. */
function AcoesVoto({ vote, votes }: { vote: DeadlyVote; votes: Votes }) {
  const say = usePlayerText()
  const { ocupado, erro, roda } = useAcao()
  const [escolher, setEscolher] = useState(false)
  const cheio = vote.maxParticipants !== null && vote.participants >= vote.maxParticipants
  const recusada = vote.entryStatus === 'recusada'
  const pode = vote.status === 'convocado' && !vote.joined && !cheio && !recusada
  const sai = vote.status === 'convocado' && vote.joined
  const rotulo = vote.admission === 'aprovacao' ? 'Pedir inscrição' : 'Inscrever-se'
  return (
    <>
      <CartasDoVoto vote={vote} />
      <div className="r-acoes">
        {pode && (
          <button className="r-bt chanfro s-forte" disabled={ocupado} onClick={() => (vote.pesoMaximo != null ? setEscolher(true) : roda(() => votes.join(vote.id)))}>
            {ocupado ? 'Enviando…' : rotulo}
          </button>
        )}
        {sai && (
          <button className="r-bt chanfro" disabled={ocupado} onClick={() => roda(() => votes.leave(vote.id), 'click')}>
            {vote.entryStatus === 'pendente' ? 'Retirar pedido' : 'Sair'}
          </button>
        )}
      </div>
      {vote.pesoMaximo != null && (
        <EscolherCartasSheet
          open={escolher}
          onClose={() => setEscolher(false)}
          pesoMaximo={vote.pesoMaximo}
          inicial={[]}
          titulo="Cartas que você vai levar"
          acao={rotulo}
          onConfirm={(uids) => votes.join(vote.id, uids)}
        />
      )}
      {vote.status === 'convocado' && vote.entryStatus === 'pendente' && <p className="rv-nota">Inscrição enviada. O Dealer vai confirmar sua vaga.</p>}
      {recusada && <p className="rv-nota">Inscrição recusada pelo Dealer.</p>}
      {vote.status === 'convocado' && cheio && !vote.joined && !recusada && <p className="rv-nota">Vagas esgotadas.</p>}
      {vote.status === 'em-progresso' &&
        (!vote.joined ? (
          <p className="rv-nota">Inscrições encerradas. O grupo é só para inscritos.</p>
        ) : vote.entryStatus === 'pendente' ? (
          <p className="rv-nota">Inscrição em análise. O grupo abre quando o Dealer aceitar.</p>
        ) : !vote.groupUrl ? (
          <p className="rv-nota">{say('Você está inscrit{o|a}. O Dealer vai liberar o link do grupo aqui.')}</p>
        ) : (
          <div className="rv-grupo">
            <small>Grupo do WhatsApp · liberado pelo Dealer</small>
            <a className="r-bt chanfro s-forte" href={vote.groupUrl} target="_blank" rel="noopener noreferrer">
              Entrar no grupo
            </a>
            <p className="rv-nota">O link é pessoal da edição: não compartilhe fora do grupo de inscritos.</p>
          </div>
        ))}
      {erro && (
        <p className="r-erro" role="alert">
          {erro}
        </p>
      )}
    </>
  )
}

/** As cartas que o Record leva (caso com peso máximo), o medidor de peso e a troca enquanto o caso está convocado. */
function CartasDoVoto({ vote }: { vote: DeadlyVote }) {
  const [trocar, setTrocar] = useState(false)
  if (vote.pesoMaximo == null || !vote.joined) return null
  const peso = vote.minhasCartas.reduce((s, c) => s + getCardPeso(c.cardId), 0)
  const acima = peso > vote.pesoMaximo
  return (
    <div className="rv-levadas">
      <small>Suas cartas</small>
      <p>{vote.minhasCartas.length ? vote.minhasCartas.map((c) => getCard(c.cardId).name).join(', ') : 'Nenhuma'}</p>
      <div className={'rv-peso' + (acima ? ' acima' : '')} role="meter" aria-valuemin={0} aria-valuemax={vote.pesoMaximo} aria-valuenow={peso} aria-label="Peso das cartas">
        <i style={{ width: `${Math.min(100, (peso / Math.max(1, vote.pesoMaximo)) * 100)}%` }} />
        <b>
          {peso}/{vote.pesoMaximo}
        </b>
      </div>
      {vote.status === 'convocado' && (
        <button className="r-link" onClick={() => setTrocar(true)}>
          Trocar as cartas
        </button>
      )}
      <EscolherCartasSheet
        open={trocar}
        onClose={() => setTrocar(false)}
        pesoMaximo={vote.pesoMaximo}
        inicial={vote.minhasCartas.map((c) => c.uid)}
        titulo="Trocar as cartas"
        acao="Salvar"
        onConfirm={async (uids) => {
          await recordAction({ action: 'cartas', voteId: vote.id, cartas: uids })
          await mutateGlobal(RECORD_KEY)
        }}
      />
    </div>
  )
}

function Convocacao({ vote, votes, onDossie }: { vote: DeadlyVote; votes: Votes; onDossie: () => void }) {
  const now = useNow(1000)
  const aoVivo = vote.status === 'em-progresso'
  return (
    <article className={'r-voto fundo' + (aoVivo ? ' ao-vivo' : '')}>
      <small>
        Deadly Vote № {String(vote.number).padStart(3, '0')}
        {vote.host ? ` · Dealer ${vote.host}` : ''} · {DEADLY_VOTE_STATUS[vote.status].label}
      </small>
      <strong>{vote.title}</strong>
      {vote.arc && <em className="rv-arco">{arcLabel(vote.arc)}</em>}
      <dl>
        <div>
          <dt>{aoVivo ? 'Em andamento há' : 'Início'}</dt>
          <dd>{aoVivo ? decorrido(now - vote.startsAt) : quandoComeca(vote.startsAt, now)}</dd>
        </div>
        <div>
          <dt>Participantes</dt>
          <dd>
            {vote.participants}
            {vote.maxParticipants ? ` / ${vote.maxParticipants}` : ''}
          </dd>
        </div>
        {vote.pesoMaximo != null && (
          <div>
            <dt>Peso máximo de cartas</dt>
            <dd>{vote.pesoMaximo}</dd>
          </div>
        )}
        <div>
          <dt>Seu registro</dt>
          <dd>{registroDe(vote)}</dd>
        </div>
      </dl>
      <p className="rv-quando">
        {dataHora(vote.startsAt)}
        {vote.location ? ` · ${vote.location}` : ''}
      </p>
      {vote.briefing && <blockquote className="rv-brief">{vote.briefing}</blockquote>}
      <AcoesVoto vote={vote} votes={votes} />
      <button className="dv-como" onClick={onDossie}>
        Ver dossiê do caso
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>
    </article>
  )
}

function Dossie({ vote, votes, onVolta }: { vote: DeadlyVote; votes: Votes; onVolta: () => void }) {
  const placar = tallyText(vote.survivors, vote.eliminated)
  return (
    <>
      <Volta onClick={onVolta}>Deadly Votes</Volta>
      <article className="r-voto fundo rv-dossie">
        <small>Deadly Vote № {String(vote.number).padStart(3, '0')} · Dossiê do caso</small>
        <strong>{vote.title}</strong>
        {vote.arc && <em className="rv-arco">{arcLabel(vote.arc)}</em>}
        <p className={'rv-estado e-' + vote.status}>
          {DEADLY_VOTE_STATUS[vote.status].label} · {DEADLY_VOTE_STATUS[vote.status].hint}
        </p>
        <dl>
          <div>
            <dt>Início</dt>
            <dd>{new Date(vote.startsAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</dd>
          </div>
          <div>
            <dt>Participantes</dt>
            <dd>
              {vote.participants}
              {vote.maxParticipants ? ` / ${vote.maxParticipants}` : ''}
            </dd>
          </div>
          <div>
            <dt>Seu registro</dt>
            <dd className={vote.outcome === 'eliminado' ? 'crit' : ''}>{registroDe(vote)}</dd>
          </div>
          {vote.pesoMaximo != null && (
            <div>
              <dt>Peso máximo de cartas</dt>
              <dd>{vote.pesoMaximo}</dd>
            </div>
          )}
          {vote.host && (
            <div>
              <dt>Dealer</dt>
              <dd>{vote.host}</dd>
            </div>
          )}
          {vote.location && (
            <div className="largo">
              <dt>Local</dt>
              <dd>{vote.location}</dd>
            </div>
          )}
          {placar && (
            <div className="largo">
              <dt>Resultado público</dt>
              <dd>{placar}</dd>
            </div>
          )}
        </dl>
        {vote.briefing && (
          <>
            <small>Briefing do Dealer</small>
            <p className="rv-brief solto">{vote.briefing}</p>
          </>
        )}
        {vote.outcome && <b className={'rv-selo' + (vote.outcome === 'eliminado' ? ' crit' : '')}>{OUTCOME_LABEL[vote.outcome]}</b>}
        <AcoesVoto vote={vote} votes={votes} />
        {vote.status !== 'convocado' && vote.status !== 'em-progresso' && (
          <p className={'rv-nota' + (vote.status === 'falha' ? ' crit' : '')}>
            {vote.status === 'cancelado' ? 'Edição cancelada pelo Dealer.' : vote.status === 'falha' ? 'Caso interrompido por falha do sistema.' : 'Caso encerrado. Resultado registrado.'}
          </p>
        )}
      </article>
    </>
  )
}

/* ================================ Convites ================================ */

const CONVITES = '/api/invites'
const CARGO: Record<PlayerRole, string> = { player: 'Jogador', dealer: 'Dealer', anfitriao: 'Anfitrião', owner: 'Owner' }
async function lerConvites(url: string): Promise<InvitesPayload> {
  const r = await fetch(url, { cache: 'no-store' })
  const d = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error((d as { error?: string }).error ?? 'Falha ao carregar convites.')
  return d as InvitesPayload
}
async function postConvite(body: Record<string, unknown>) {
  const r = await fetch(CONVITES, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const d = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string; code?: string }
  if (!r.ok || !d.ok) throw new Error(d.error ?? 'Não foi possível concluir a ação.')
  return d
}
const fmt = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

/** Convites: o jogador tem cota (1, não renova); a equipe escolhe o cargo, uma nota e, o Owner, a conta de teste. */
function Convites() {
  const { data, error, isLoading, mutate } = useSWR(CONVITES, lerConvites)
  const [cargo, setCargo] = useState<PlayerRole>('player')
  const [nota, setNota] = useState('')
  const [teste, setTeste] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [novo, setNovo] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [copiado, setCopiado] = useState<string | null>(null)
  const cota = data?.role === 'player' ? (data.quota ?? 0) : null
  const lista = data?.invites ?? []
  const gera = async () => {
    setOcupado(true)
    setErro(null)
    try {
      const r = await postConvite({ action: 'create', role: cargo, note: nota, test: teste })
      setNovo(r.code ?? null)
      setNota('')
      playSfx('confirm')
      await mutate()
    } catch (e) {
      playSfx('error')
      setErro(erroTexto(e))
    } finally {
      setOcupado(false)
    }
  }
  const revoga = async (code: string) => {
    setErro(null)
    try {
      await postConvite({ action: 'revoke', code })
      if (novo === code) setNovo(null)
      await mutate()
    } catch (e) {
      setErro(erroTexto(e))
    }
  }
  const copia = (code: string) =>
    navigator.clipboard?.writeText(code).then(() => {
      setCopiado(code)
      window.setTimeout(() => setCopiado(null), 1400)
    })
  return (
    <>
      <h4 style={{ marginTop: 0 }}>Convites</h4>
      <p className="r-sub">
        {cota === null
          ? 'Cada código vale para uma única conta. Depois de usado, a pessoa entra com usuário e senha.'
          : cota > 0
            ? `Você tem direito a ${cota} ${cota === 1 ? 'convite' : 'convites'}. A cota não renova; revogar um código ainda não usado devolve o convite.`
            : 'Sua cota acabou. Novos convites só chegam como recompensa.'}
      </p>
      {novo && (
        <div className="r-voto fundo rv-novo">
          <small>Seu convite</small>
          <strong className="cod">{novo}</strong>
          <button className="r-bt chanfro" onClick={() => copia(novo)}>
            {copiado === novo ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      )}
      {data && cota !== 0 && (
        <div className="rv-form">
          {data.canGrant.length > 1 && (
            <div role="radiogroup" aria-label="Cargo do convite" className="rv-cargos">
              {data.canGrant.map((r) => (
                <button key={r} role="radio" aria-checked={cargo === r} className="r-bt chanfro" onClick={() => setCargo(r)}>
                  {CARGO[r]}
                </button>
              ))}
            </div>
          )}
          <label className="rv-campo">
            <small>Nota (opcional)</small>
            <input value={nota} maxLength={60} placeholder="Para quem é este convite?" onChange={(e) => setNota(e.target.value)} />
          </label>
          {data.role === 'owner' && (
            <label className="rv-check">
              <input type="checkbox" checked={teste} onChange={(e) => setTeste(e.target.checked)} />
              <span>
                Conta de teste
                <small>Fora de ranking, apostas e prêmios</small>
              </span>
            </label>
          )}
          <button className="r-bt chanfro s-forte" disabled={ocupado} onClick={gera}>
            {ocupado ? 'Gerando…' : 'Gerar convite'}
          </button>
        </div>
      )}
      {erro && (
        <p className="r-erro" role="alert">
          {erro}
        </p>
      )}
      <h4>Convites emitidos</h4>
      {isLoading ? (
        <p className="r-sub">Carregando…</p>
      ) : error ? (
        <p className="r-erro" role="alert">
          {(error as Error).message}
        </p>
      ) : !lista.length ? (
        <p className="r-sub">Nenhum convite emitido ainda.</p>
      ) : (
        <ul className="rv-convites">
          {lista.map((i: Invite) => {
            const usado = !!i.usedAt
            return (
              <li key={i.code} className={'fundo' + (usado ? ' usado' : '')}>
                <span>
                  <b className="cod">{i.code}</b>
                  <small>
                    {usado ? 'Usado' : 'Disponível'} · {CARGO[i.role]}
                    {i.isTest ? ' · Teste' : ''}
                  </small>
                  <small>
                    {usado ? `${i.usedBy ?? 'Conta criada'} · ${fmt(i.usedAt!)}` : `Criado ${fmt(i.createdAt)}`}
                    {data?.role === 'owner' && i.createdBy ? ` · por ${i.createdBy}` : ''}
                    {i.note ? ` · ${i.note}` : ''}
                  </small>
                </span>
                {!usado && (
                  <span className="r-acoes">
                    <button className="r-bt chanfro" aria-label={`Copiar código ${i.code}`} onClick={() => copia(i.code)}>
                      {copiado === i.code ? 'Copiado' : 'Copiar'}
                    </button>
                    <button className="r-bt chanfro" aria-label={`Revogar código ${i.code}`} onClick={() => revoga(i.code)}>
                      Revogar
                    </button>
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
