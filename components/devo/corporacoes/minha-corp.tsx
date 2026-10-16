'use client'

import { type CSSProperties, useMemo, useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { getCard } from '@/lib/devo/cards'
import {
  CLASSIFICACAO_ROTULO,
  CORP_CARGO_ROTULO,
  type CorpLiberado,
  type CorpMembro,
  ESCOPO_ROTULO,
  type MinhaCorp,
  podeDecidir,
} from '@/lib/devo/corporacoes'
import { cn } from '@/lib/utils'
import { Button } from '../kit/button'
import { GlyphCheck, GlyphClose } from '../kit/glyphs'
import { Dialog, Sheet } from '../kit/sheet'
import { Tabs } from '../kit/tabs'
import { MarbleSlab } from '../os/shell-ui'
import { CardFace } from '../shared/devo-card'
import { useDevo } from '../state/devo-store'
import { BrasaoCorp } from './brasao'
import { Campo, Erro, Linha, Monograma, Placa, Rotulo, Selo, Vazio, dataCurta } from './ui'

type Agir = (b: Record<string, unknown>) => Promise<unknown>
type Aba = 'membros' | 'pedidos' | 'cartas' | 'recrutar' | 'jogos'

const nomeCarta = (id: string) => {
  try {
    return getCard(id).name
  } catch {
    return id
  }
}

/** Hook local de ação com estado de ocupado/erro (uma ação por vez na tela). */
function useAcao(agir: Agir) {
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const fazer = async (chave: string, body: Record<string, unknown>, som: 'confirm' | 'close' = 'confirm') => {
    setOcupado(chave)
    setErro(null)
    try {
      const r = await agir(body)
      playSfx(som)
      return r
    } catch (e) {
      playSfx('error')
      setErro((e as Error).message)
      return null
    } finally {
      setOcupado(null)
    }
  }
  return { ocupado, erro, fazer, setErro }
}

export function MinhaCorpView({ d, agir }: { d: CorpLiberado; agir: Agir }) {
  const m = d.minha!
  const decide = podeDecidir(m.meuCargo)
  const [aba, setAba] = useState<Aba>('membros')
  return (
    <div className="flex flex-col gap-5">
      <Heroi m={m} />
      <Tabs<Aba>
        label="Seções da Corporação"
        items={[
          { value: 'membros', label: 'Membros' },
          ...(decide ? [{ value: 'pedidos' as Aba, label: 'Pedidos', count: m.pedidos.length || undefined }] : []),
          { value: 'cartas', label: 'Cartas' },
          { value: 'recrutar', label: 'Recrutar' },
          { value: 'jogos', label: 'Jogos' },
        ]}
        value={aba}
        onValueChange={setAba}
        fill
        className="[&_[role=tab]]:min-w-0 [&_[role=tab]]:px-1 [&_[role=tab]]:text-[11.5px] [&_[role=tab]]:tracking-[0.08em]"
        panelClassName="pt-4"
      >
        <div key={aba} className="animate-dv-fade flex flex-col gap-5">
          {aba === 'membros' && <Membros m={m} agir={agir} />}
          {aba === 'pedidos' && decide && <Pedidos m={m} agir={agir} />}
          {aba === 'cartas' && <Cartas m={m} agir={agir} />}
          {aba === 'recrutar' && <Recrutar m={m} agir={agir} />}
          {aba === 'jogos' && <Jogos d={d} m={m} />}
        </div>
      </Tabs>
    </div>
  )
}

function Heroi({ m }: { m: MinhaCorp }) {
  const necro = m.classificacao === 'necro'
  const [copiado, setCopiado] = useState(false)
  return (
    <MarbleSlab as="section" edge={necro ? 'blood' : 'steel'} cut={16} glow aria-label={`Corporação ${m.nome}`} innerClassName="p-5">
      <div className="flex items-start gap-4">
        <BrasaoCorp brasao={m.brasao} necro={necro} title={`Brasão de ${m.nome}`} className="animate-dv-pop h-[124px] w-[100px] shrink-0 drop-shadow-[0_12px_20px_rgba(0,0,0,0.7)]" />
        <div className="min-w-0 flex-1 pt-1">
          <p className="dv-label text-[10px] text-dv-gold">{CORP_CARGO_ROTULO[m.meuCargo]} · {m.membros}/{m.maxMembros}</p>
          <h2 className="mt-1.5 break-words font-display text-[22px] font-semibold uppercase leading-[1.1] tracking-[0.06em] text-dv-text">{m.nome}</h2>
          {m.lema && <p className="mt-1.5 font-body text-[15px] italic leading-snug text-dv-text-2">“{m.lema}”</p>}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <Selo tom={necro ? 'rubi' : 'aco'}>{necro ? 'Necro-Corporação' : 'Oficial'}</Selo>
            {m.escopo === 'global' && <Selo tom="ametista">{ESCOPO_ROTULO.global} · provisório</Selo>}
          </div>
        </div>
      </div>
      {necro && (
        <p role="alert" className="mt-4 border-l-2 border-dv-blood pl-3 font-body text-[15px] leading-relaxed text-dv-blood-text">
          A Companhia classificou esta Corporação como terrorista por violar o código de regras.
        </p>
      )}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-dv-line pt-3">
        <div className="min-w-0">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-dv-text-3">Código de identificação</p>
          <p className="mt-1 font-mono text-[19px] tracking-[0.14em] text-dv-text dv-tabular">{m.codigo}</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            if (!m.codigo) return
            void navigator.clipboard?.writeText(m.codigo).catch(() => {})
            playSfx('confirm')
            setCopiado(true)
            window.setTimeout(() => setCopiado(false), 1800)
          }}
        >
          {copiado ? 'Copiado' : 'Copiar código'}
        </Button>
      </div>
      <p className="sr-only">{CLASSIFICACAO_ROTULO[m.classificacao]}</p>
    </MarbleSlab>
  )
}

/* ------------------------------------------------------------------ Membros, convites e saída */

function Membros({ m, agir }: { m: MinhaCorp; agir: Agir }) {
  const { ocupado, erro, fazer } = useAcao(agir)
  const [gerir, setGerir] = useState<CorpMembro | null>(null)
  const [convidado, setConvidado] = useState('')
  const [enviado, setEnviado] = useState<string | null>(null)
  const [sair, setSair] = useState(false)
  const lider = m.meuCargo === 'lider'
  return (
    <>
      <Placa titulo="Membros" legenda="Líder, vice-líder e membros">
        <ul className="flex flex-col">
          {m.membrosLista.map((p) => (
            <li key={p.id} className="flex min-h-14 items-center gap-3 border-b border-dv-line py-2 last:border-b-0">
              <Monograma nome={p.personagem} className={cn(p.cargo === 'lider' && 'shadow-[inset_0_0_0_1px_#ece5d8,0_0_10px_rgba(186,176,159,0.35)]')} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[15px] font-semibold uppercase tracking-[0.06em] text-dv-text">
                  {p.personagem}
                  {p.eu && <span className="ml-2 font-mono text-[10.5px] font-normal tracking-[0.14em] text-dv-text-3">você</span>}
                </p>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-dv-text-3">desde {dataCurta(p.entrouAt)}</p>
              </div>
              <Selo tom={p.cargo === 'lider' ? 'aco' : p.cargo === 'vice' ? 'ametista' : 'quieto'}>{CORP_CARGO_ROTULO[p.cargo]}</Selo>
              {lider && !p.eu && (
                <button
                  type="button"
                  aria-label={`Gerir ${p.personagem}`}
                  onClick={() => {
                    playSfx('open')
                    setGerir(p)
                  }}
                  className="dv-focus grid size-11 shrink-0 place-items-center font-mono text-[18px] leading-none text-dv-text-2 hover:text-dv-text"
                >
                  ⋯
                </button>
              )}
            </li>
          ))}
        </ul>
      </Placa>

      <Placa titulo="Convidar um Record" legenda="Convite direto pelo nome do personagem">
        <form
          className="flex flex-col gap-3"
          onSubmit={async (e) => {
            e.preventDefault()
            const r = await fazer('convite', { action: 'convite.enviar', nome: convidado })
            if (r) {
              setEnviado(convidado.trim())
              setConvidado('')
            }
          }}
        >
          <Rotulo htmlFor="corp-convidar">Nome do personagem</Rotulo>
          <Campo id="corp-convidar" value={convidado} maxLength={40} onChange={(e) => setConvidado(e.target.value)} placeholder="Como os NPCs chamam o Record" autoComplete="off" />
          <Button type="submit" size="sm" variant="secondary" loading={ocupado === 'convite'} disabled={convidado.trim().length < 2}>
            Convidar
          </Button>
          {enviado && <p role="status" className="font-body text-[14px] text-dv-amethyst-text">Convite enviado para {enviado}.</p>}
          {!podeDecidir(m.meuCargo) && <p className="font-body text-[14px] text-dv-text-2">Convites de membros passam pelo líder ou vice-líder antes da entrada.</p>}
        </form>
        {m.convitesEnviados.length > 0 && (
          <ul aria-label="Convites pendentes" className="mt-4 flex flex-col border-t border-dv-line pt-2">
            {m.convitesEnviados.map((v) => (
              <li key={v.id} className="flex min-h-11 items-center justify-between gap-3 py-1">
                <span className="font-body text-[15px] text-dv-text-2">
                  {v.para} <span className="text-dv-text-3">· por {v.de ?? '—'}</span>
                </span>
                <Selo tom="quieto">Pendente</Selo>
              </li>
            ))}
          </ul>
        )}
      </Placa>

      {erro && <Erro>{erro}</Erro>}

      <Button
        variant="danger"
        size="sm"
        onClick={() => {
          playSfx('open')
          setSair(true)
        }}
      >
        Sair da Corporação
      </Button>

      <Sheet open={!!gerir} onClose={() => setGerir(null)} kicker="Gerir membro" title={gerir?.personagem ?? ''} size="sm">
        {gerir && (
          <div className="flex flex-col gap-2.5">
            {erro && <Erro>{erro}</Erro>}
            {gerir.cargo === 'membro' ? (
              <Button block variant="secondary" loading={ocupado === 'vice'} onClick={async () => (await fazer('vice', { action: 'membro.cargo', playerId: gerir.id, cargo: 'vice' })) && setGerir(null)}>
                Tornar vice-líder
              </Button>
            ) : (
              <Button block variant="secondary" loading={ocupado === 'membro'} onClick={async () => (await fazer('membro', { action: 'membro.cargo', playerId: gerir.id, cargo: 'membro' })) && setGerir(null)}>
                Tornar membro
              </Button>
            )}
            <Button block variant="secondary" loading={ocupado === 'lider'} onClick={async () => (await fazer('lider', { action: 'lideranca.passar', playerId: gerir.id })) && setGerir(null)}>
              Passar liderança
            </Button>
            <Button block variant="danger" loading={ocupado === 'remover'} onClick={async () => (await fazer('remover', { action: 'membro.remover', playerId: gerir.id }, 'close')) && setGerir(null)}>
              Remover da Corporação
            </Button>
          </div>
        )}
      </Sheet>

      <Dialog
        open={sair}
        onClose={() => setSair(false)}
        tone="alert"
        kicker={m.nome}
        title="Sair da Corporação?"
        description={
          m.meuCargo === 'lider' && m.membros > 1
            ? 'Passe a liderança para outro membro antes de sair.'
            : m.membros <= 1
              ? 'Você é o último membro: ao sair, a Corporação se dissolve e o código deixa de valer.'
              : 'Você perde as vantagens da Corporação. Para voltar, precisará de um novo pedido.'
        }
        footer={
          <div className="flex flex-col gap-2">
            {erro && <Erro>{erro}</Erro>}
            <Button block variant="danger" loading={ocupado === 'sair'} onClick={async () => (await fazer('sair', { action: 'sair' }, 'close')) && setSair(false)}>
              Confirmar saída
            </Button>
          </div>
        }
      />
    </>
  )
}

/* ------------------------------------------------------------------ Pedidos (líder/vice) */

function Pedidos({ m, agir }: { m: MinhaCorp; agir: Agir }) {
  const { ocupado, erro, fazer } = useAcao(agir)
  return (
    <Placa titulo="Pedidos de entrada" legenda="Você vê só as partes do perfil permitidas pela Companhia">
      {erro && (
        <div className="mb-3">
          <Erro>{erro}</Erro>
        </div>
      )}
      {m.pedidos.length ? (
        <ul className="flex flex-col">
          {m.pedidos.map((p) => (
            <li key={p.id} aria-label={`Pedido de ${p.perfil.personagem}`} className="border-b border-dv-line py-4 first:pt-0 last:border-b-0 last:pb-0">
              <div className="flex items-center gap-3">
                <Monograma nome={p.perfil.personagem} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-[16px] font-semibold uppercase tracking-[0.06em] text-dv-text">{p.perfil.personagem}</p>
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-dv-text-3">
                    {p.origem === 'convite' ? `Convite de ${p.convidadoPor ?? 'um membro'}` : 'Pelo código'} · {dataCurta(p.createdAt)}
                  </p>
                </div>
              </div>
              <dl className="mt-3 flex flex-col">
                {p.perfil.registroDesde !== undefined && <Linha rotulo="No DEVO desde">{dataCurta(p.perfil.registroDesde)}</Linha>}
                {p.perfil.deadlyVotes && (
                  <Linha rotulo="Deadly Votes">
                    {p.perfil.deadlyVotes.participou} · sobreviveu a {p.perfil.deadlyVotes.sobreviveu}
                  </Linha>
                )}
                {p.perfil.cartas !== undefined && <Linha rotulo="Cartas">{p.perfil.cartas}</Linha>}
                {p.perfil.aparencia !== undefined && <Linha rotulo="Aparência">{p.perfil.aparencia ? `${p.perfil.aparencia.nome} · ${p.perfil.aparencia.tipo}` : '—'}</Linha>}
              </dl>
              <div className="mt-3 flex gap-2">
                <Button size="sm" className="flex-1" loading={ocupado === `a:${p.id}`} icon={<GlyphCheck className="size-4" />} onClick={() => fazer(`a:${p.id}`, { action: 'pedido.decidir', id: p.id, decisao: 'aprovar' })}>
                  Aprovar
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1"
                  loading={ocupado === `r:${p.id}`}
                  icon={<GlyphClose className="size-4" />}
                  onClick={() => fazer(`r:${p.id}`, { action: 'pedido.decidir', id: p.id, decisao: 'recusar' }, 'close')}
                >
                  Recusar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Vazio titulo="Nenhum pedido">Quando alguém usar o código da Corporação, o pedido aparece aqui.</Vazio>
      )}
    </Placa>
  )
}

/* ------------------------------------------------------------------ Transferir cartas */

function Cartas({ m, agir }: { m: MinhaCorp; agir: Agir }) {
  const { state } = useDevo()
  const { ocupado, erro, fazer, setErro } = useAcao(agir)
  const outros = m.membrosLista.filter((p) => !p.eu)
  const [para, setPara] = useState<string | null>(null)
  const [uid, setUid] = useState<string | null>(null)
  const [feito, setFeito] = useState<string | null>(null)
  const cartas = useMemo(() => [...state.inventory].sort((a, b) => b.acquiredAt - a.acquiredAt), [state.inventory])
  const carta = cartas.find((c) => c.uid === uid)
  const destino = outros.find((p) => p.id === para)
  const restam = Math.max(0, m.transferenciasPorDia - m.transferenciasHoje)
  return (
    <>
      <Placa titulo="Transferir carta" legenda={`Entre membros · ${restam} de ${m.transferenciasPorDia} hoje`}>
        {outros.length ? (
          <>
            <p className="dv-label mb-2 text-[10px] tracking-[0.2em] text-dv-text-2">Para quem</p>
            <div role="group" aria-label="Destinatário" className="flex flex-wrap gap-2">
              {outros.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={para === p.id}
                  onClick={() => {
                    playSfx('card-select')
                    setPara(p.id)
                    setErro(null)
                  }}
                  className={cn(
                    'dv-focus dv-cut-diag flex min-h-11 items-center gap-2 px-3 font-body text-[15px]',
                    para === p.id ? 'bg-dv-cobalt-dim text-dv-text shadow-[inset_0_0_0_1px_#c2b9ec]' : 'text-dv-text-2 shadow-[inset_0_0_0_1px_var(--dv-line-strong)]',
                  )}
                  style={{ '--dv-cut': '7px' } as CSSProperties}
                >
                  {p.personagem}
                </button>
              ))}
            </div>
            <p className="dv-label mb-2 mt-4 text-[10px] tracking-[0.2em] text-dv-text-2">Qual carta</p>
            {cartas.length ? (
              <ul aria-label="Suas cartas" className="grid grid-cols-4 gap-2">
                {cartas.slice(0, 24).map((c) => (
                  <li key={c.uid}>
                    <button
                      type="button"
                      aria-pressed={uid === c.uid}
                      aria-label={`Escolher ${nomeCarta(c.cardId)}`}
                      onClick={() => {
                        playSfx('card-select')
                        setUid(c.uid)
                        setErro(null)
                      }}
                      className={cn('dv-focus block w-full transition-transform', uid === c.uid ? '-translate-y-1 drop-shadow-[0_0_10px_rgba(138,124,200,0.7)]' : 'opacity-85')}
                    >
                      <CardFace cardId={c.cardId} className="w-full" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <Vazio titulo="Sem cartas">Você não tem cartas para transferir.</Vazio>
            )}
            <p className="mt-3 font-body text-[14px] leading-snug text-dv-text-2">Cartas presas no Salão das Máscaras (Bandeja ou Mercado) não podem ser transferidas. A carta sai do seu inventário na hora.</p>
            {erro && (
              <div className="mt-3">
                <Erro>{erro}</Erro>
              </div>
            )}
            {feito && <p role="status" className="mt-3 font-body text-[14px] text-dv-amethyst-text">{feito}</p>}
            <Button
              block
              className="mt-4"
              disabled={!carta || !destino || restam <= 0}
              loading={ocupado === 'transf'}
              onClick={async () => {
                if (!carta || !destino) return
                const r = await fazer('transf', { action: 'carta.transferir', uid: carta.uid, para: destino.id })
                if (r) {
                  setFeito(`${nomeCarta(carta.cardId)} foi para ${destino.personagem}.`)
                  setUid(null)
                }
              }}
            >
              {carta && destino ? `Transferir para ${destino.personagem}` : 'Transferir carta'}
            </Button>
          </>
        ) : (
          <Vazio titulo="Ninguém para receber">Convide Records para a Corporação; as cartas só circulam entre membros.</Vazio>
        )}
      </Placa>
      <Placa titulo="Últimas transferências">
        {m.transferencias.length ? (
          <ul className="flex flex-col">
            {m.transferencias.map((t) => (
              <li key={t.id} className="flex min-h-11 items-center justify-between gap-3 border-b border-dv-line py-1.5 last:border-b-0">
                <span className="min-w-0 truncate font-body text-[15px] text-dv-text-2">
                  <span className="text-dv-text">{nomeCarta(t.cardId)}</span> · {t.de} → {t.para}
                </span>
                <span className="shrink-0 font-mono text-[10.5px] uppercase tracking-[0.12em] text-dv-text-3">{dataCurta(t.createdAt)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Vazio titulo="Nada ainda">As cartas trocadas entre membros aparecem aqui.</Vazio>
        )}
      </Placa>
    </>
  )
}

/* ------------------------------------------------------------------ Recrutamento */

function Recrutar({ m, agir }: { m: MinhaCorp; agir: Agir }) {
  const { ocupado, erro, fazer } = useAcao(agir)
  const [titulo, setTitulo] = useState('')
  const [texto, setTexto] = useState('')
  const [publicado, setPublicado] = useState(false)
  if (!podeDecidir(m.meuCargo)) {
    return (
      <Placa titulo="Recrutamento">
        <Vazio titulo="Só líder e vice">O anúncio de recrutamento no Salão das Máscaras é publicado pelo líder ou pelo vice-líder. Você pode convidar Records na aba Membros.</Vazio>
      </Placa>
    )
  }
  return (
    <Placa titulo="Anunciar no Salão" legenda="Recrutamento no mural do Salão das Máscaras">
      <p className="mb-4 font-body text-[15px] leading-relaxed text-dv-text-2">O código de identificação vai junto no anúncio. Um anúncio por dia.</p>
      <form
        className="flex flex-col gap-3"
        onSubmit={async (e) => {
          e.preventDefault()
          const r = await fazer('rec', { action: 'recrutamento.publicar', titulo, texto })
          if (r) {
            setPublicado(true)
            setTitulo('')
            setTexto('')
          }
        }}
      >
        <div>
          <Rotulo htmlFor="corp-rec-titulo">Título</Rotulo>
          <Campo id="corp-rec-titulo" value={titulo} maxLength={80} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Procuramos jogadores de nervos firmes" />
        </div>
        <div>
          <Rotulo htmlFor="corp-rec-texto">Texto</Rotulo>
          <textarea
            id="corp-rec-texto"
            value={texto}
            maxLength={480}
            rows={4}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Quem vocês procuram e o que oferecem"
            className="w-full resize-none bg-black/45 px-3 py-2.5 font-body text-[16px] leading-relaxed text-dv-text outline-none shadow-[inset_0_0_0_1px_var(--dv-line-strong)] placeholder:text-dv-text-3 focus:shadow-[inset_0_0_0_1px_#bab09f]"
          />
        </div>
        {erro && <Erro>{erro}</Erro>}
        {publicado && <p role="status" className="font-body text-[14px] text-dv-amethyst-text">Anúncio publicado no Salão das Máscaras.</p>}
        <Button type="submit" block loading={ocupado === 'rec'} disabled={titulo.trim().length < 3 || texto.trim().length < 3}>
          Publicar no Salão
        </Button>
      </form>
    </Placa>
  )
}

/* ------------------------------------------------------------------ Jogos coletivos e rivais (estrutura provisória) */

function Jogos({ d, m }: { d: CorpLiberado; m: MinhaCorp }) {
  return (
    <>
      <Placa titulo="Jogos coletivos especiais" legenda={d.jogos.provisorio ? 'Em breve · provisório' : 'Em breve'}>
        {d.jogos.lista.length ? (
          <ul className="flex flex-col">
            {d.jogos.lista.map((j) => (
              <li key={j.id} className="border-b border-dv-line py-3 first:pt-0 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-display text-[16px] font-semibold uppercase tracking-[0.08em] text-dv-text">{j.titulo}</p>
                  <Selo tom="quieto">Em breve</Selo>
                </div>
                <p className="mt-1 font-body text-[15px] leading-relaxed text-dv-text-2">{j.descricao}</p>
                <p className={cn('mt-1 font-mono text-[10.5px] uppercase tracking-[0.14em]', m.membros >= j.minMembros ? 'text-dv-amethyst-text' : 'text-dv-text-3')}>
                  Mínimo de {j.minMembros} membros · vocês são {m.membros}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <Vazio titulo="Em breve">A Companhia ainda não anunciou jogos coletivos.</Vazio>
        )}
      </Placa>
      <Placa titulo="Corporações rivais" legenda="Provisório">
        {m.rivais.length ? (
          <ul className="flex flex-col">
            {m.rivais.map((r) => (
              <li key={r.nome} className="flex min-h-14 items-center gap-3 border-b border-dv-line py-2 last:border-b-0">
                <BrasaoCorp brasao={r.brasao} className="h-12 w-10 shrink-0" />
                <span className="font-display text-[15px] font-semibold uppercase tracking-[0.06em] text-dv-text">{r.nome}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Vazio titulo="Nenhuma rivalidade registrada">Tome cuidado com as Corporações Rivais e com as Corporações Globais.</Vazio>
        )}
      </Placa>
    </>
  )
}
