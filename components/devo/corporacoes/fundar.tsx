'use client'

import { type CSSProperties, useEffect, useMemo, useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import {
  BRASAO_COR,
  BRASAO_CORES,
  BRASAO_FORMA_ROTULO,
  BRASAO_FORMAS,
  type BrasaoCor,
  type BrasaoForma,
  type CriacaoInfo,
  formatMin,
  inicialDe,
} from '@/lib/devo/corporacoes'
import { cn } from '@/lib/utils'
import { Button } from '../kit/button'
import { GlyphHourglass } from '../kit/glyphs'
import { Sheet } from '../kit/sheet'
import { BrasaoCorp } from './brasao'
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
 * Fundar uma Corporação: nome, lema, brasão (forma + cor da paleta), custo em Tempo e envio à Companhia.
 * O servidor cobra uma vez (idem por abertura da folha) e confere os requisitos de novo.
 */
export function FundarSheet({ open, onClose, criacao, agir }: { open: boolean; onClose: () => void; criacao: CriacaoInfo; agir: Agir }) {
  const [nome, setNome] = useState('')
  const [lema, setLema] = useState('')
  const [forma, setForma] = useState<BrasaoForma>('escudo')
  const [cor, setCor] = useState<BrasaoCor>('aco')
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [idem, setIdem] = useState(novoIdem)
  useEffect(() => {
    if (open) {
      setIdem(novoIdem())
      setErro(null)
    }
  }, [open])
  const brasao = useMemo(() => ({ forma, cor, inicial: inicialDe(nome || 'Corporação') }), [forma, cor, nome])
  const valido = nome.trim().length >= 3 && criacao.atende

  const enviar = async () => {
    setOcupado(true)
    setErro(null)
    try {
      await agir({ action: 'fundar', nome, lema, forma, cor, idem })
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
          <BrasaoCorp brasao={brasao} className="h-[104px] w-[84px] shrink-0 drop-shadow-[0_10px_18px_rgba(0,0,0,0.6)]" title={`Prévia do brasão: ${BRASAO_FORMA_ROTULO[forma]}, ${BRASAO_COR[cor].rotulo}`} />
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

        <fieldset>
          <legend className="dv-label mb-2 block text-[10px] tracking-[0.2em] text-dv-text-2">Forma do brasão</legend>
          <div className="grid grid-cols-6 gap-1.5">
            {BRASAO_FORMAS.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={forma === f}
                aria-label={`Forma: ${BRASAO_FORMA_ROTULO[f]}`}
                onClick={() => {
                  playSfx('card-select')
                  setForma(f)
                }}
                className={cn(
                  'dv-focus dv-cut grid min-h-14 place-items-center p-1.5 transition-shadow',
                  forma === f ? 'bg-dv-cobalt-dim shadow-[inset_0_0_0_1px_#c2b9ec]' : 'bg-black/40 shadow-[inset_0_0_0_1px_var(--dv-line-strong)]',
                )}
                style={{ '--dv-cut': '6px' } as CSSProperties}
              >
                <BrasaoCorp brasao={{ forma: f, cor, inicial: '' }} className="h-10 w-8" />
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="dv-label mb-2 block text-[10px] tracking-[0.2em] text-dv-text-2">Cor · {BRASAO_COR[cor].rotulo}</legend>
          <div className="grid grid-cols-6 gap-1.5">
            {BRASAO_CORES.map((k) => {
              const c = BRASAO_COR[k]
              return (
                <button
                  key={k}
                  type="button"
                  aria-pressed={cor === k}
                  aria-label={`Cor: ${c.rotulo}`}
                  onClick={() => {
                    playSfx('card-select')
                    setCor(k)
                  }}
                  className={cn('dv-focus grid min-h-12 place-items-center', cor === k ? 'shadow-[inset_0_0_0_1px_#c2b9ec]' : '')}
                >
                  <span
                    aria-hidden="true"
                    className="size-8 rotate-45 shadow-[0_0_0_1.5px_#bab09f,0_4px_10px_rgba(0,0,0,0.6)]"
                    style={{ background: `linear-gradient(135deg, ${c.claro}, ${c.meio} 50%, ${c.escuro})` }}
                  />
                </button>
              )
            })}
          </div>
        </fieldset>

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
