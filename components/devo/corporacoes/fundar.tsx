'use client'

import { type CSSProperties, type ReactNode, useEffect, useMemo, useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import {
  BRASAO_COR,
  BRASAO_CORES,
  BRASAO_DIVISAO_ROTULO,
  BRASAO_DIVISOES,
  BRASAO_FORMA_ROTULO,
  BRASAO_FORMAS,
  BRASAO_ORNAMENTO_ROTULO,
  BRASAO_ORNAMENTOS,
  BRASAO_SIMBOLO_ROTULO,
  BRASAO_SIMBOLOS,
  type BrasaoCor,
  type BrasaoDivisao,
  type BrasaoForma,
  type BrasaoOrnamento,
  type BrasaoSimbolo,
  type CriacaoInfo,
  formatMin,
  inicialDe,
} from '@/lib/devo/corporacoes'
import { cn } from '@/lib/utils'
import { Button } from '../kit/button'
import { GlyphHourglass } from '../kit/glyphs'
import { Sheet } from '../kit/sheet'
import { BrasaoCorp, NichoBrasao } from './brasao'
import { Campo, Erro, Rotulo } from './ui'

type Agir = (b: Record<string, unknown>) => Promise<unknown>

function novoIdem() {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
  }
}

/**
 * Fundar uma Corporação: nome, lema, brasão (forma, cores, divisão, figura e ornamento), custo em Tempo e envio à Companhia.
 * O servidor cobra uma vez (idem por abertura da folha) e confere os requisitos de novo.
 */
export function FundarSheet({ open, onClose, criacao, agir }: { open: boolean; onClose: () => void; criacao: CriacaoInfo; agir: Agir }) {
  const [nome, setNome] = useState('')
  const [lema, setLema] = useState('')
  const [desenho, setDesenho] = useState<DesenhoBrasao>(DESENHO_PADRAO)
  const { forma, cor } = desenho
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [idem, setIdem] = useState(novoIdem)
  useEffect(() => {
    if (open) {
      setIdem(novoIdem())
      setErro(null)
    }
  }, [open])
  const brasao = useMemo(() => ({ ...desenho, inicial: inicialDe(nome || 'Corporação') }), [desenho, nome])
  const valido = nome.trim().length >= 3 && criacao.atende

  const enviar = async () => {
    setOcupado(true)
    setErro(null)
    try {
      await agir({ action: 'fundar', nome, lema, ...desenho, idem })
      playSfx('confirm')
      setNome('')
      setLema('')
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
      open={open}
      onClose={onClose}
      kicker="Companhia de Despertados"
      title="Fundar Corporação"
      description="A avaliação administrativa considera se o seu perfil corresponde aos requisitos exigidos."
      footer={
        <div className="flex flex-col gap-2">
          {erro && <Erro>{erro}</Erro>}
          <Button block loading={ocupado} disabled={!valido} onClick={enviar} icon={<GlyphHourglass className="size-4" />}>
            Pagar e enviar
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <NichoBrasao key={JSON.stringify(desenho)} brasao={brasao} lema={lema.trim() || null} tamanho={110} title={`Prévia do brasão: ${BRASAO_FORMA_ROTULO[forma]}, ${BRASAO_COR[cor].rotulo}`} />
          <div className="min-w-0">
            <p className="dv-label text-[10px] text-dv-text-3">Sinete da Corporação</p>
            <p className="mt-1 break-words font-display text-[20px] font-semibold uppercase leading-tight tracking-[0.06em] text-dv-text">{nome.trim() || 'Sem nome'}</p>
            {lema.trim() && <p className="mt-1 font-body text-[15px] italic leading-snug text-dv-text-2">“{lema.trim()}”</p>}
          </div>
        </div>

        <div>
          <Rotulo htmlFor="corp-nome">Nome da Corporação</Rotulo>
          <Campo id="corp-nome" value={nome} maxLength={40} placeholder="Ex.: Ordem do Relógio Partido" onChange={(e) => setNome(e.target.value)} autoComplete="off" />
        </div>
        <div>
          <Rotulo htmlFor="corp-lema">Lema (opcional)</Rotulo>
          <Campo id="corp-lema" value={lema} maxLength={90} placeholder="Uma frase para o brasão" onChange={(e) => setLema(e.target.value)} autoComplete="off" />
        </div>

        <EditorBrasao valor={desenho} onChange={setDesenho} />

        <div className="border-t border-dv-line pt-4">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dv-text-2">Investimento em Tempo</span>
            <span className="flex items-center gap-1.5 font-impact text-[22px] font-semibold leading-none text-dv-text dv-tabular">
              <GlyphHourglass aria-hidden="true" className="size-4 text-dv-gold" />
              {formatMin(criacao.custo)}
            </span>
          </div>
          <p className="mt-2 font-body text-[14px] leading-snug text-dv-text-2">
            Sai do seu pulso agora (ele precisa manter {formatMin(criacao.reserva)} depois de pagar). Se a Companhia recusar, o Tempo volta.
            {criacao.provisorio && <span className="text-dv-text-3"> Valores provisórios.</span>}
          </p>
          {!criacao.atende && <p className="mt-2 font-body text-[14px] text-dv-blood-text">Seu perfil ainda não atende aos requisitos.</p>}
        </div>
      </div>
    </Sheet>
  )
}

/* ------------------------------------------------------------------ Editor do brasão (fundar e redesenhar) */

export type DesenhoBrasao = { forma: BrasaoForma; cor: BrasaoCor; cor2: BrasaoCor | null; divisao: BrasaoDivisao; simbolo: BrasaoSimbolo; ornamento: BrasaoOrnamento }
export const DESENHO_PADRAO: DesenhoBrasao = { forma: 'escudo', cor: 'aco', cor2: null, divisao: 'pleno', simbolo: 'inicial', ornamento: 'nenhum' }

/** Botão de escolha com a miniatura do brasão (forma, divisão, figura, ornamento). */
function Opcao({ ativo, rotulo, onClick, children }: { ativo: boolean; rotulo: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      aria-label={rotulo}
      title={rotulo}
      onClick={() => {
        playSfx('card-select')
        onClick()
      }}
      className={cn(
        'dv-focus dv-cut grid min-h-14 place-items-center p-1.5 transition-shadow',
        ativo ? 'bg-dv-cobalt-dim shadow-[inset_0_0_0_1px_var(--dv-amethyst-text)]' : 'bg-black/40 shadow-[inset_0_0_0_1px_var(--dv-line-strong)]',
      )}
      style={{ '--dv-cut': '6px' } as CSSProperties}
    >
      {children}
    </button>
  )
}

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="dv-label mb-2 block text-[10px] tracking-[0.2em] text-dv-text-2">{titulo}</legend>
      {children}
    </fieldset>
  )
}

function Cores({ valor, onChange, rotulo }: { valor: BrasaoCor | null; onChange: (c: BrasaoCor) => void; rotulo: string }) {
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {BRASAO_CORES.map((k) => {
        const c = BRASAO_COR[k]
        return (
          <button
            key={k}
            type="button"
            aria-pressed={valor === k}
            aria-label={`${rotulo}: ${c.rotulo}`}
            title={c.rotulo}
            onClick={() => {
              playSfx('card-select')
              onChange(k)
            }}
            className={cn('dv-focus grid min-h-12 place-items-center', valor === k ? 'shadow-[inset_0_0_0_1px_var(--dv-amethyst-text)]' : '')}
          >
            <span aria-hidden="true" className="size-8 rotate-45 shadow-[0_0_0_1.5px_#bab09f,0_4px_10px_rgba(0,0,0,0.6)]" style={{ background: `linear-gradient(135deg, ${c.claro}, ${c.meio} 50%, ${c.escuro})` }} />
          </button>
        )
      })}
    </div>
  )
}

/** Escolhas do brasão: forma, cor, divisão do campo (+ segunda cor), figura e ornamento. */
export function EditorBrasao({ valor, onChange }: { valor: DesenhoBrasao; onChange: (v: DesenhoBrasao) => void }) {
  const set = (p: Partial<DesenhoBrasao>) => onChange({ ...valor, ...p })
  const mini = (p: Partial<DesenhoBrasao>) => ({ ...valor, inicial: 'A', ...p })
  const segunda = valor.cor2 ?? BRASAO_CORES.find((c) => c !== valor.cor) ?? 'onix'
  return (
    <div className="flex flex-col gap-5">
      <Grupo titulo="Forma">
        <div className="grid grid-cols-6 gap-1.5">
          {BRASAO_FORMAS.map((f) => (
            <Opcao key={f} ativo={valor.forma === f} rotulo={`Forma: ${BRASAO_FORMA_ROTULO[f]}`} onClick={() => set({ forma: f })}>
              <BrasaoCorp brasao={mini({ forma: f, ornamento: 'nenhum', simbolo: 'inicial' })} className="h-10 w-8" />
            </Opcao>
          ))}
        </div>
      </Grupo>
      <Grupo titulo={`Cor · ${BRASAO_COR[valor.cor].rotulo}`}>
        <Cores valor={valor.cor} onChange={(cor) => set({ cor })} rotulo="Cor" />
      </Grupo>
      <Grupo titulo={`Campo · ${BRASAO_DIVISAO_ROTULO[valor.divisao]}`}>
        <div className="grid grid-cols-7 gap-1.5">
          {BRASAO_DIVISOES.map((dv) => (
            <Opcao
              key={dv}
              ativo={valor.divisao === dv}
              rotulo={`Campo: ${BRASAO_DIVISAO_ROTULO[dv]}`}
              onClick={() => set({ divisao: dv, cor2: dv === 'pleno' ? null : segunda })}
            >
              <BrasaoCorp brasao={mini({ forma: 'escudo', divisao: dv, cor2: segunda, ornamento: 'nenhum', simbolo: 'inicial', })} className="h-10 w-8" />
            </Opcao>
          ))}
        </div>
      </Grupo>
      {valor.divisao !== 'pleno' && (
        <Grupo titulo={`Segunda cor · ${BRASAO_COR[segunda].rotulo}`}>
          <Cores valor={segunda} onChange={(cor2) => set({ cor2 })} rotulo="Segunda cor" />
        </Grupo>
      )}
      <Grupo titulo={`Figura · ${BRASAO_SIMBOLO_ROTULO[valor.simbolo]}`}>
        <div className="grid grid-cols-5 gap-1.5 min-[400px]:grid-cols-7">
          {BRASAO_SIMBOLOS.map((sb) => (
            <Opcao key={sb} ativo={valor.simbolo === sb} rotulo={`Figura: ${BRASAO_SIMBOLO_ROTULO[sb]}`} onClick={() => set({ simbolo: sb })}>
              <BrasaoCorp brasao={mini({ forma: 'escudo', simbolo: sb, ornamento: 'nenhum', divisao: 'pleno' })} className="h-10 w-8" />
            </Opcao>
          ))}
        </div>
      </Grupo>
      <Grupo titulo={`Ornamento · ${BRASAO_ORNAMENTO_ROTULO[valor.ornamento]}`}>
        <div className="grid grid-cols-6 gap-1.5">
          {BRASAO_ORNAMENTOS.map((o) => (
            <Opcao key={o} ativo={valor.ornamento === o} rotulo={`Ornamento: ${BRASAO_ORNAMENTO_ROTULO[o]}`} onClick={() => set({ ornamento: o })}>
              <BrasaoCorp brasao={mini({ forma: 'escudo', ornamento: o, divisao: 'pleno', simbolo: 'inicial' })} className="h-7 w-6" />
            </Opcao>
          ))}
        </div>
      </Grupo>
    </div>
  )
}
