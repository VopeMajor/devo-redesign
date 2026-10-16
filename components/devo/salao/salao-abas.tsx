'use client'

import { Plus } from 'lucide-react'
import { type CSSProperties, type ReactNode, useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import {
  ANUNCIO_ROTULO,
  formatDataHora,
  formatTempo,
  RARIDADE_ROTULO,
  SALAO_MAX_MIN,
  type SalaoAnuncio,
  type SalaoLiberado,
  type SalaoLote,
  type SalaoOferta,
} from '@/lib/devo/salao'
import { AVISO_ANUNCIAR } from '@/lib/devo/salao-herdeiro'
import { cn } from '@/lib/utils'
import { Button } from '../kit/button'
import { GlyphHourglass } from '../kit/glyphs'
import { Sheet } from '../kit/sheet'
import { MarbleSlab } from '../os/shell-ui'
import { usePlayerText } from '../state/player-text'
import { EnviarCartaSheet } from './salao-enviar'
import { CartaMini, Erro, Linha, nomeCarta, Placa, RaridadeTexto, Selo, Tempo, TempoCampo, Vazio } from './salao-ui'

type Agir = (body: Record<string, unknown>) => Promise<unknown>

const num = (n: number) => String(n).padStart(3, '0')

/* ══════════════════════════════════ Leilões ══════════════════════════════════ */

export function AbaLeiloes({ d, agir }: { d: SalaoLiberado; agir: Agir }) {
  const [lance, setLance] = useState<SalaoLote | null>(null)
  const aberto = d.relogio.aberto
  return (
    <div className="flex flex-col gap-4">
      {aberto ? (
        <section aria-label="Lotes desta edição" className="flex flex-col gap-3">
          <Cabeca titulo={`Edição ${String(d.relogio.corrente.n + 1).padStart(2, '0')}`} legenda={`${d.leiloes.length} ${d.leiloes.length === 1 ? 'lote' : 'lotes'} · lances em Tempo`} />
          {d.leiloes.length ? (
            d.leiloes.map((l, i) => <LoteCartao key={l.id} l={l} i={i} aberto onLance={() => setLance(l)} />)
          ) : (
            <Placa>
              <Vazio titulo="Palco vazio">Nenhum lote nesta edição. Os itens aprovados na Bandeja entram na próxima.</Vazio>
            </Placa>
          )}
        </section>
      ) : (
        <section aria-label="Próxima edição" className="flex flex-col gap-3">
          <Cabeca titulo="Próxima edição" legenda={`Abre ${formatDataHora(d.relogio.proxima.inicio)}`} />
          {d.proximos.length ? (
            d.proximos.map((l, i) => <LoteCartao key={l.id} l={l} i={i} aberto={false} />)
          ) : (
            <Placa>
              <Vazio titulo="Cortinas fechadas">Os lotes aprovados aparecem aqui antes da abertura. Lances só valem com o Salão aberto.</Vazio>
            </Placa>
          )}
        </section>
      )}

      {d.encerrados.length > 0 && (
        <section aria-label="Encerrados" className="flex flex-col gap-2">
          <Cabeca titulo="Encerrados" legenda="Últimas batidas de martelo" />
          <MarbleSlab cut={10} quiet innerClassName="px-4 py-1">
            <ul>
              {d.encerrados.map((l) => (
                <li key={l.id} className="flex min-h-12 items-center gap-3 border-b border-dv-line py-2 last:border-b-0">
                  <span className="w-10 font-mono text-[11px] text-dv-text-3 dv-tabular">{num(l.numero)}</span>
                  <span className="min-w-0 flex-1 truncate font-body text-[15px] text-dv-text">{nomeCarta(l.cardId)}</span>
                  {l.status === 'vendido' && l.valorFinal ? (
                    <span className="flex items-center gap-2">
                      {l.venci && <Selo tom="ametista">Seu</Selo>}
                      <Tempo min={l.valorFinal} />
                    </span>
                  ) : (
                    <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-dv-text-3">Sem lances</span>
                  )}
                </li>
              ))}
            </ul>
          </MarbleSlab>
        </section>
      )}

      <LanceSheet lote={lance} reserva={d.bandeja.reserva_min} onClose={() => setLance(null)} agir={agir} />
    </div>
  )
}

function Cabeca({ titulo, legenda }: { titulo: string; legenda?: string }) {
  return (
    <div className="flex items-end justify-between gap-3 px-1">
      <h3 className="font-display text-[17px] font-semibold uppercase tracking-[0.14em] text-dv-text">{titulo}</h3>
      {legenda && <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-dv-text-3">{legenda}</p>}
    </div>
  )
}

function LoteCartao({ l, i, aberto, onLance }: { l: SalaoLote; i: number; aberto: boolean; onLance?: () => void }) {
  return (
    <div className="animate-dv-rise" style={{ animationDelay: `${i * 60}ms` }}>
    <MarbleSlab as="section" aria-label={`Lote ${l.numero}: ${nomeCarta(l.cardId)}`} cut={12} quiet edge={l.lidero ? 'steel' : 'line'} innerClassName="flex gap-3.5 p-3.5">
      <div className="w-[84px] shrink-0">
        <CartaMini cardId={l.cardId} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-dv-text-3">Lote Nº {num(l.numero)}</span>
          {l.meu ? <Selo tom="quieto">Seu lote</Selo> : l.lidero ? <Selo tom="ametista">Você lidera</Selo> : l.meuLance ? <Selo tom="rubi">Superado</Selo> : null}
        </div>
        <p className="mt-1.5 font-display text-[17px] font-semibold uppercase leading-tight tracking-[0.06em] text-dv-text">{nomeCarta(l.cardId)}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <RaridadeTexto r={l.raridade} />
          <span className="font-body text-[14px] text-dv-text-2">de {l.vendedor}</span>
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-dv-text-3">{l.maiorLance ? `Maior lance · ${l.lances}` : 'Lance mínimo'}</p>
            <Tempo min={l.maiorLance ?? l.lanceMinimo} forte className="mt-1" />
          </div>
          {aberto && !l.meu && onLance && (
            <Button variant={l.lidero ? 'secondary' : 'primary'} size="sm" onClick={onLance} aria-label={`Dar lance no lote ${l.numero}`}>
              Dar lance
            </Button>
          )}
        </div>
      </div>
    </MarbleSlab>
    </div>
  )
}

function LanceSheet({ lote, reserva, onClose, agir }: { lote: SalaoLote | null; reserva: number; onClose: () => void; agir: Agir }) {
  const [valor, setValor] = useState(0)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aberto, setAberto] = useState<string | null>(null)
  if (lote && aberto !== lote.id) {
    setAberto(lote.id)
    setValor(lote.proximoLance)
    setErro(null)
  }
  const confirmar = async () => {
    if (!lote) return
    setOcupado(true)
    setErro(null)
    try {
      await agir({ action: 'lance', loteId: lote.id, valor })
      playSfx('confirm')
      setAberto(null)
      onClose()
    } catch (e) {
      playSfx('error')
      setErro((e as Error).message)
    } finally {
      setOcupado(false)
    }
  }
  return (
    <Sheet
      open={!!lote}
      onClose={() => {
        setAberto(null)
        onClose()
      }}
      kicker={lote ? `Lote Nº ${num(lote.numero)}` : undefined}
      title="Dar lance"
      description="O valor sai do seu pulso agora. Se alguém cobrir o seu lance, ele volta para você."
      footer={
        <Button variant="primary" size="md" block loading={ocupado} onClick={confirmar} disabled={!lote}>
          Confirmar lance
        </Button>
      }
    >
      {lote && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-[72px] shrink-0">
              <CartaMini cardId={lote.cardId} />
            </div>
            <div className="min-w-0">
              <p className="font-display text-[17px] font-semibold uppercase tracking-[0.06em] text-dv-text">{nomeCarta(lote.cardId)}</p>
              <RaridadeTexto r={lote.raridade} className="mt-1" />
              <p className="mt-1 font-body text-[14px] text-dv-text-2">de {lote.vendedor}</p>
            </div>
          </div>
          <dl>
            <Linha rotulo={lote.maiorLance ? 'Maior lance' : 'Lance mínimo'}>{formatTempo(lote.maiorLance ?? lote.lanceMinimo)}</Linha>
            <Linha rotulo="Incremento">{formatTempo(lote.incremento)}</Linha>
            {lote.lidero && lote.maiorLance && <Linha rotulo="Você paga agora">{formatTempo(Math.max(0, valor - lote.maiorLance))}</Linha>}
          </dl>
          <TempoCampo id="salao-lance-valor" rotulo="Seu lance" valor={valor} onChange={setValor} min={lote.proximoLance} max={SALAO_MAX_MIN} passo={lote.incremento} dica={`Seu pulso precisa manter pelo menos ${formatTempo(reserva)} depois do lance.`} />
          {erro && <Erro>{erro}</Erro>}
        </div>
      )}
    </Sheet>
  )
}

/* ══════════════════════════════════ Mercado ══════════════════════════════════ */

export function AbaMercado({ d, agir }: { d: SalaoLiberado; agir: Agir }) {
  const [vender, setVender] = useState(false)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const act = async (key: string, body: Record<string, unknown>) => {
    setOcupado(key)
    setErro(null)
    try {
      await agir(body)
      playSfx('confirm')
    } catch (e) {
      playSfx('error')
      setErro((e as Error).message)
    } finally {
      setOcupado(null)
    }
  }
  const outras = d.mercado.filter((o) => !o.meu)
  const minhas = d.minhasOfertas
  return (
    <div className="flex flex-col gap-4">
      <Placa titulo="Mercado" legenda="Compra e venda entre jogadores · preço fixo" direita={<Button variant="secondary" size="sm" icon={<Plus className="size-4" strokeWidth={1.4} />} onClick={() => setVender(true)}>Vender carta</Button>}>
        <p className="font-body text-[15px] leading-relaxed text-dv-text-2">
          {d.relogio.aberto ? 'Salão aberto: as compras são liquidadas na hora, em Tempo.' : 'Você pode pôr cartas à venda a qualquer momento; as compras só acontecem durante a abertura.'}
        </p>
      </Placa>
      {erro && <Erro>{erro}</Erro>}
      <section aria-label="Cartas à venda" className="flex flex-col gap-2.5">
        {outras.length ? (
          outras.map((o, i) => (
            <OfertaLinha key={o.id} o={o} i={i}>
              <Button
                variant="primary"
                size="sm"
                disabled={!d.relogio.aberto}
                loading={ocupado === o.id}
                onClick={() => act(o.id, { action: 'mercado.comprar', ofertaId: o.id })}
                aria-label={`Comprar ${nomeCarta(o.cardId)} por ${formatTempo(o.preco)}`}
              >
                Comprar
              </Button>
            </OfertaLinha>
          ))
        ) : (
          <Placa>
            <Vazio titulo="Nenhuma carta à venda">Quando alguém puser uma carta no Mercado, ela aparece aqui.</Vazio>
          </Placa>
        )}
      </section>
      {minhas.length > 0 && (
        <section aria-label="Suas ofertas" className="flex flex-col gap-2.5">
          <Cabeca titulo="Suas negociações" />
          {minhas.map((o, i) => (
            <OfertaLinha key={o.id} o={o} i={i}>
              {o.meu && o.status === 'ativa' ? (
                <Button variant="ghost" size="sm" loading={ocupado === o.id} onClick={() => act(o.id, { action: 'mercado.retirar', ofertaId: o.id })}>
                  Retirar
                </Button>
              ) : o.status === 'vendida' ? (
                <Selo tom={o.comprei ? 'ametista' : 'aco'}>{o.comprei ? 'Comprada' : `Vendida · +${formatTempo(o.repasse ?? 0)}`}</Selo>
              ) : (
                <Selo tom="quieto">Retirada</Selo>
              )}
            </OfertaLinha>
          ))}
        </section>
      )}
      <EnviarCartaSheet open={vender} onClose={() => setVender(false)} modo="mercado" dados={d} />
    </div>
  )
}

function OfertaLinha({ o, i, children }: { o: SalaoOferta; i: number; children: ReactNode }) {
  return (
    <div className="animate-dv-rise" style={{ animationDelay: `${i * 50}ms` }}>
    <MarbleSlab cut={10} quiet innerClassName="flex items-center gap-3 p-3">
      <div className="w-[52px] shrink-0">
        <CartaMini cardId={o.cardId} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-[15px] font-semibold uppercase tracking-[0.06em] text-dv-text">{nomeCarta(o.cardId)}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2">
          <RaridadeTexto r={o.raridade} />
          <span className="truncate font-body text-[13.5px] text-dv-text-2">{o.meu ? 'sua' : `de ${o.vendedor}`}</span>
        </p>
        <Tempo min={o.preco} className="mt-1.5" />
      </div>
      <div className="shrink-0">{children}</div>
    </MarbleSlab>
    </div>
  )
}

/* ══════════════════════════════════ Propostas e anúncios ══════════════════════════════════ */

export function AbaAnuncios({ d, agir }: { d: SalaoLiberado; agir: Agir }) {
  const [novo, setNovo] = useState(false)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const retirar = async (id: string) => {
    setOcupado(id)
    setErro(null)
    try {
      await agir({ action: 'anuncio.retirar', id })
      playSfx('confirm')
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setOcupado(null)
    }
  }
  return (
    <div className="flex flex-col gap-4">
      <Placa titulo="Propostas e anúncios" legenda="Recrutamento · propagandas · propostas" direita={<Button variant="secondary" size="sm" icon={<Plus className="size-4" strokeWidth={1.4} />} onClick={() => setNovo(true)}>Anunciar</Button>}>
        <p className="font-body text-[15px] leading-relaxed text-dv-text-2">Propostas não têm custo inicial. Propagandas custam {formatTempo(d.custoPropaganda)}. Tudo passa pela avaliação da casa antes de ir ao mural.</p>
      </Placa>
      {erro && <Erro>{erro}</Erro>}
      <section aria-label="Mural" className="flex flex-col gap-2.5">
        {d.anuncios.length ? (
          d.anuncios.map((a, i) => <AnuncioCartao key={a.id} a={a} i={i} />)
        ) : (
          <Placa>
            <Vazio titulo="Mural vazio">Nenhuma proposta publicada nesta temporada.</Vazio>
          </Placa>
        )}
      </section>
      {d.meusAnuncios.length > 0 && (
        <section aria-label="Seus anúncios" className="flex flex-col gap-2.5">
          <Cabeca titulo="Seus anúncios" />
          {d.meusAnuncios.map((a, i) => (
            <AnuncioCartao key={a.id} a={a} i={i}>
              <div className="mt-3 flex items-center justify-between gap-2">
                <Selo tom={a.status === 'publicado' ? 'aco' : a.status === 'pendente' ? 'ametista' : 'quieto'}>
                  {a.status === 'pendente' ? 'Em avaliação' : a.status === 'publicado' ? 'No mural' : a.status === 'recusado' ? 'Recusado' : 'Retirado'}
                </Selo>
                {(a.status === 'pendente' || a.status === 'publicado') && (
                  <Button variant="ghost" size="sm" loading={ocupado === a.id} onClick={() => retirar(a.id)}>
                    Retirar
                  </Button>
                )}
              </div>
            </AnuncioCartao>
          ))}
        </section>
      )}
      <NovoAnuncioSheet open={novo} onClose={() => setNovo(false)} custo={d.custoPropaganda} agir={agir} />
    </div>
  )
}

function AnuncioCartao({ a, i, children }: { a: SalaoAnuncio; i: number; children?: ReactNode }) {
  const recrut = a.tipo === 'recrutamento'
  return (
    <div className="animate-dv-rise" style={{ animationDelay: `${i * 50}ms` }}>
    <MarbleSlab as="section" aria-label={`${ANUNCIO_ROTULO[a.tipo]}: ${a.titulo}`} cut={12} quiet edge={recrut ? 'steel' : 'line'} innerClassName="p-4">
      <div className="flex items-center justify-between gap-2">
        <Selo tom={recrut ? 'ametista' : 'quieto'}>{ANUNCIO_ROTULO[a.tipo]}</Selo>
        <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-dv-text-3">{recrut ? a.corporacao : a.autor}</span>
      </div>
      <p className="mt-2.5 font-display text-[17px] font-semibold uppercase leading-tight tracking-[0.06em] text-dv-text">{a.titulo}</p>
      <p className="mt-1.5 whitespace-pre-line font-body text-[15px] leading-relaxed text-dv-text-2">{a.texto}</p>
      {children}
    </MarbleSlab>
    </div>
  )
}

function NovoAnuncioSheet({ open, onClose, custo, agir }: { open: boolean; onClose: () => void; custo: number; agir: Agir }) {
  const [tipo, setTipo] = useState<'proposta' | 'propaganda'>('proposta')
  const [titulo, setTitulo] = useState('')
  const [texto, setTexto] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const enviar = async () => {
    setOcupado(true)
    setErro(null)
    try {
      await agir({ action: 'anuncio.criar', tipo, titulo, texto })
      playSfx('confirm')
      setTitulo('')
      setTexto('')
      onClose()
    } catch (e) {
      playSfx('error')
      setErro((e as Error).message)
    } finally {
      setOcupado(false)
    }
  }
  const campo = 'w-full bg-black/40 px-3 font-body text-[16px] text-dv-text outline-none shadow-[inset_0_0_0_1px_var(--dv-line-strong)] focus:shadow-[inset_0_0_0_1px_#bab09f] placeholder:text-dv-text-3'
  return (
    <Sheet
      open={open}
      onClose={onClose}
      kicker="Salão das Máscaras"
      title="Novo anúncio"
      description="A casa avalia antes de publicar no mural."
      footer={
        <Button variant="primary" size="md" block loading={ocupado} onClick={enviar} disabled={titulo.trim().length < 3 || texto.trim().length < 3}>
          {tipo === 'propaganda' ? `Enviar · ${formatTempo(custo)}` : 'Enviar proposta'}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div role="radiogroup" aria-label="Tipo de anúncio" className="grid grid-cols-2 gap-2">
          {(['proposta', 'propaganda'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={tipo === t}
              onClick={() => {
                playSfx('click')
                setTipo(t)
              }}
              className={cn(
                'dv-focus dv-cut-diag flex min-h-14 flex-col items-start justify-center px-3.5 text-left',
                tipo === t ? 'bg-[#1d1a2b] shadow-[inset_0_0_0_1px_rgba(138,124,200,0.8)]' : 'shadow-[inset_0_0_0_1px_var(--dv-line-strong)]',
              )}
              style={{ '--dv-cut': '8px' } as CSSProperties}
            >
              <span className="font-display text-[14px] font-semibold uppercase tracking-[0.12em] text-dv-text">{ANUNCIO_ROTULO[t]}</span>
              <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-dv-text-2">{t === 'proposta' ? 'Sem custo inicial' : formatTempo(custo)}</span>
            </button>
          ))}
        </div>
        <label className="block">
          <span className="dv-label block text-[10px] tracking-[0.2em] text-dv-text-2">Título</span>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value.slice(0, 80))} placeholder="Compro cartas lendárias" className={cn(campo, 'mt-2 h-12')} />
        </label>
        <label className="block">
          <span className="dv-label block text-[10px] tracking-[0.2em] text-dv-text-2">Texto</span>
          <textarea value={texto} onChange={(e) => setTexto(e.target.value.slice(0, 600))} rows={4} placeholder="O que você oferece ou procura." className={cn(campo, 'mt-2 resize-none py-2.5 leading-relaxed')} />
        </label>
        {erro && <Erro>{erro}</Erro>}
      </div>
    </Sheet>
  )
}

/* ══════════════════════════════════ Bandeja ══════════════════════════════════ */

const STATUS_LOTE: Record<SalaoLote['status'], string> = {
  avaliacao: 'Em avaliação de especialista',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
  retirado: 'Retirado',
  vendido: 'Vendido',
  devolvido: 'Devolvido sem lances',
}

export function AbaBandeja({ d, agir, onAvisoLido }: { d: SalaoLiberado; agir: Agir; onAvisoLido: () => void }) {
  const t = usePlayerText()
  const [enviar, setEnviar] = useState(false)
  const [aviso, setAviso] = useState(!d.avisoAnunciar)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const ativos = d.meusLotes.filter((l) => l.status === 'avaliacao' || l.status === 'aprovado').length
  const retirar = async (id: string) => {
    setOcupado(id)
    setErro(null)
    try {
      await agir({ action: 'bandeja.retirar', loteId: id })
      playSfx('confirm')
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setOcupado(null)
    }
  }
  return (
    <div className="flex flex-col gap-4">
      {/* Texto de sistema "Anunciar no Salão das Máscaras" (literal do dono) */}
      <MarbleSlab as="section" aria-label="Anunciar no Salão das Máscaras" edge="steel" cut={12} quiet innerClassName="p-4">
        <button
          type="button"
          aria-expanded={aviso}
          onClick={() => {
            playSfx('click')
            setAviso((v) => !v)
          }}
          className="dv-focus flex min-h-11 w-full items-center justify-between gap-3 text-left"
        >
          <span>
            <span className="dv-label block text-[10px] tracking-[0.2em] text-dv-text-3">Sistema</span>
            <span className="mt-1 block font-display text-[15px] font-semibold uppercase tracking-[0.12em] text-dv-text">Anunciar no Salão das Máscaras</span>
          </span>
          <span aria-hidden="true" className={cn('size-2.5 rotate-45 border-b-[1.5px] border-r-[1.5px] border-dv-text-2 transition-transform', aviso ? '-rotate-[135deg]' : 'rotate-45')} />
        </button>
        {aviso && (
          <div className="animate-dv-fade">
            <ol className="mt-3 flex flex-col gap-2.5">
              {AVISO_ANUNCIAR.map((linha, i) => (
                <li key={i} className="flex gap-3">
                  <span aria-hidden="true" className="mt-[0.55em] size-[6px] shrink-0 rotate-45 bg-dv-gold" />
                  <span className="font-body text-[15.5px] leading-relaxed text-dv-text">{t(linha)}</span>
                </li>
              ))}
            </ol>
            {!d.avisoAnunciar && (
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setAviso(false)
                  onAvisoLido()
                }}
              >
                Entendi
              </Button>
            )}
          </div>
        )}
      </MarbleSlab>

      <Placa titulo="Bandeja" legenda={`${d.contrato.nome} · raridade mínima ${RARIDADE_ROTULO[d.bandeja.raridade_minima]}`}>
        <dl>
          <Linha rotulo="Taxa de divulgação">{formatTempo(d.contrato.divulgacao)}</Linha>
          <Linha rotulo="Comissão na venda">{d.contrato.comissaoPct}%</Linha>
          <Linha rotulo="Vagas da próxima edição">
            <span className="dv-tabular">
              {Math.max(0, d.vagas.total - d.vagas.usadas)} de {d.vagas.total}
            </span>
          </Linha>
          <Linha rotulo="Seus itens ativos">
            <span className="dv-tabular">
              {ativos} de {d.bandeja.max_por_jogador}
            </span>
          </Linha>
        </dl>
        <Button variant="primary" size="md" block className="mt-4" onClick={() => setEnviar(true)} disabled={ativos >= d.bandeja.max_por_jogador}>
          Enviar pelo Shuffler
        </Button>
        {d.owner && <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.12em] text-dv-text-3">Valores provisórios · editáveis no Calendário Devo</p>}
      </Placa>
      {erro && <Erro>{erro}</Erro>}

      <section aria-label="Seus itens na Bandeja" className="flex flex-col gap-2.5">
        <Cabeca titulo="Seus itens" />
        {d.meusLotes.length ? (
          d.meusLotes.map((l, i) => (
            <div key={l.id} className="animate-dv-rise" style={{ animationDelay: `${i * 50}ms` }}>
            <MarbleSlab cut={10} quiet innerClassName="flex gap-3 p-3">
              <div className="w-[60px] shrink-0">
                <CartaMini cardId={l.cardId} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-dv-text-3">Lote Nº {num(l.numero)}</span>
                  {l.status === 'avaliacao' && <GlyphHourglass aria-hidden="true" className="size-4 animate-dv-breathe text-dv-amethyst-text" />}
                </div>
                <p className="mt-1 truncate font-display text-[15px] font-semibold uppercase tracking-[0.06em] text-dv-text">{nomeCarta(l.cardId)}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Selo tom={l.status === 'avaliacao' ? 'ametista' : l.status === 'recusado' ? 'rubi' : l.status === 'vendido' || l.status === 'aprovado' ? 'aco' : 'quieto'}>{STATUS_LOTE[l.status]}</Selo>
                  {l.status === 'aprovado' && l.edicao !== null && <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-dv-text-2">Edição {String(l.edicao + 1).padStart(2, '0')}</span>}
                </div>
                {l.status === 'vendido' && l.repasse !== null && (
                  <p className="mt-2 font-body text-[14px] text-dv-text-2">
                    Arrematado por {formatTempo(l.valorFinal ?? 0)} · você recebeu <strong className="font-semibold text-dv-text">{formatTempo(l.repasse)}</strong>
                  </p>
                )}
                {l.status === 'aprovado' && <p className="mt-2 font-body text-[14px] text-dv-text-2">Lance mínimo {formatTempo(l.lanceMinimo)}</p>}
                {l.status === 'recusado' && l.nota && <p className="mt-2 font-body text-[14px] italic text-dv-text-2">“{l.nota}”</p>}
                {l.status === 'avaliacao' && (
                  <Button variant="ghost" size="sm" className="mt-1 -ml-2" loading={ocupado === l.id} onClick={() => retirar(l.id)}>
                    Retirar da Bandeja
                  </Button>
                )}
              </div>
            </MarbleSlab>
            </div>
          ))
        ) : (
          <Placa>
            <Vazio titulo="Bandeja vazia">Envie uma carta pelo Shuffler. Ela espera a avaliação de um especialista antes de entrar no leilão.</Vazio>
          </Placa>
        )}
      </section>
      <EnviarCartaSheet open={enviar} onClose={() => setEnviar(false)} modo="bandeja" dados={d} />
    </div>
  )
}
