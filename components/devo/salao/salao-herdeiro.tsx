'use client'

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { playSfx } from '@/lib/devo/audio'
import { ELENCO_INFO, npcPortrait } from '@/lib/devo/npcs'
import type { SalaoRelogio } from '@/lib/devo/salao'
import { HERDEIRO_APRESENTACAO, HERDEIRO_POSES, salaoTexto, semMarcas, trechos, type SalaoFoco } from '@/lib/devo/salao-herdeiro'
import { cn } from '@/lib/utils'
import { useAdvanceKeys } from '../hooks'
import { toRoman } from '../kit/glyphs'
import { AdvanceIndicator, DialogueShell, SpeakerPlate, useTypewriter } from '../intro/vn'
import { SoundToggle } from '../shared/sound-toggle'
import { SalaoCena } from './salao-cena'
import { ContadorSalao } from './salao-contador'

const CHAR_MS = 24

const FOCO_ROTULO: Record<Exclude<SalaoFoco, 'contador'>, string> = {
  leiloes: 'Leilões',
  bandeja: 'Bandeja',
  mercado: 'Mercado',
  anuncios: 'Propostas',
}

/**
 * Apresentação do Salão das Máscaras (primeira entrada): o Herdeiro, do camarote, apresenta o salão. Texto
 * literal do dono em lib/devo/salao-herdeiro.ts; cada fala troca a expressão do sprite OC (por opacidade, todas
 * pré-carregadas) e, quando ele cita algo da tela, a cena acende: o contador enorme ("aquele número enorme bem
 * ali") ou a placa da aba. Peças de visual novel do DEVO (intro/vn.tsx), como a cena do Poço.
 */
export function SalaoHerdeiro({
  relogio,
  genero,
  nome,
  podePular,
  onFim,
}: {
  relogio: SalaoRelogio
  genero: string | null | undefined
  nome: string | null
  podePular: boolean
  onFim: () => void
}) {
  const [index, setIndex] = useState(0)
  const [montado, setMontado] = useState(false)
  useEffect(() => setMontado(true), [])

  const fala = HERDEIRO_APRESENTACAO[index]
  const texto = salaoTexto(fala.texto, genero, nome)
  const plano = semMarcas(texto)
  const { shown, done, finish } = useTypewriter(plano, CHAR_MS)
  const total = HERDEIRO_APRESENTACAO.length

  const advance = useCallback(() => {
    if (!done) {
      finish()
      return
    }
    playSfx('click')
    if (index + 1 >= total) {
      playSfx('whoosh')
      onFim()
      return
    }
    setIndex(index + 1)
  }, [done, finish, index, total, onFim])

  useAdvanceKeys(advance, { enabled: true })

  const info = ELENCO_INFO.herdeiro
  const foco = fala.foco

  if (!montado) return null
  return createPortal(
    <main aria-label="Salão das Máscaras: apresentação" className="fixed inset-0 z-[80] flex h-dvh flex-col overflow-hidden bg-dv-ink text-dv-text">
      <SalaoCena aberto={index >= 5} foco={0.9} />

      {/* barra superior */}
      <div className="dv-safe-top pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between bg-gradient-to-b from-black/75 to-transparent px-4 pb-8">
        <p className="dv-label pointer-events-auto flex items-center gap-2 pt-3 text-[10px] text-dv-text-2">
          <span className="font-impact text-[15px] leading-none tracking-normal text-dv-gold">{toRoman(index + 1)}</span>
          <span className="whitespace-nowrap tracking-[0.14em]">Salão das Máscaras</span>
        </p>
        <div className="pointer-events-auto flex items-center">
          <SoundToggle compact className="min-h-11 min-w-11 justify-center text-dv-text-2 hover:text-dv-text" />
          {podePular && (
            <button
              type="button"
              onClick={() => {
                playSfx('whoosh')
                onFim()
              }}
              className="dv-focus flex min-h-11 items-center px-2 font-mono text-[11px] uppercase tracking-[0.18em] text-dv-text-2 hover:text-dv-text"
            >
              Pular apresentação
            </button>
          )}
        </div>
      </div>

      {/* o que ele aponta */}
      <div className="relative z-20 mt-[max(env(safe-area-inset-top),3.25rem)] flex min-h-[132px] items-start justify-center px-4">
        {foco === 'contador' ? (
          <div className="animate-dv-rise rounded-sm bg-black/55 px-2 pb-3 pt-3 shadow-[0_18px_40px_rgba(0,0,0,0.7)]">
            <ContadorSalao relogio={relogio} destaque compacto />
          </div>
        ) : foco ? (
          <p
            key={foco}
            className="dv-cut animate-dv-cut-in mt-6 flex items-center gap-3 bg-[linear-gradient(90deg,#1f1f22,#151517)] px-5 py-2.5 shadow-[0_10px_24px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(186,176,159,0.6)]"
            style={{ '--dv-cut': '9px' } as CSSProperties}
          >
            <span aria-hidden="true" className="size-2 rotate-45 bg-dv-amethyst shadow-[0_0_10px_rgba(138,124,200,0.9)]" />
            <span className="font-display text-[15px] font-semibold uppercase tracking-[0.22em] text-dv-porcelain">{FOCO_ROTULO[foco]}</span>
          </p>
        ) : null}
      </div>

      {/* o Herdeiro, no camarote: a base do busto some atrás do parapeito */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[17%] z-10 mx-auto h-[50%] max-w-[560px]">
        <span className="absolute inset-x-[10%] top-[8%] h-[80%] bg-[radial-gradient(50%_50%_at_50%_45%,rgba(236,229,216,0.16),transparent_70%)]" />
        {HERDEIRO_POSES.map((pose) => {
          const art = npcPortrait('herdeiro', pose)
          if (!art) return null
          const ativo = pose === fala.pose
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={pose}
              src={art.src}
              alt=""
              draggable={false}
              className={cn(
                'absolute inset-x-0 top-0 h-[136%] w-full object-contain object-top drop-shadow-[0_18px_22px_rgba(0,0,0,0.7)] transition-[opacity,transform] duration-300',
                ativo ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0',
              )}
            />
          )
        })}
        {/* parapeito do camarote: mármore negro com filete de aço e balaústres */}
        <div className="absolute inset-x-[4%] bottom-[-6%] h-[26%]">
          <span className="absolute inset-0 bg-[linear-gradient(180deg,#1f1f22,#0c0c0e)] shadow-[0_-6px_18px_rgba(0,0,0,0.6)]" />
          <span className="absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,transparent,#bab09f_12%,#ece5d8_50%,#bab09f_88%,transparent)]" />
          <span className="absolute inset-x-[6%] top-[22%] bottom-[18%] opacity-60 [background-image:repeating-linear-gradient(90deg,rgba(186,176,159,0.5)_0_2px,transparent_2px_22px)]" />
          <span className="absolute inset-x-0 bottom-[14%] h-px bg-[#bab09f]/45" />
        </div>
      </div>
      <span className="sr-only">{`${info.name}, ${info.title}`}</span>

      <div className="relative z-20 mt-auto px-4 pb-[max(env(safe-area-inset-bottom),1.25rem)]">
        <button type="button" onClick={advance} aria-label={done ? 'Próxima fala' : 'Mostrar fala completa'} className="dv-focus relative block w-full text-left">
          <DialogueShell tone="gold" className="mt-6">
            <SpeakerPlate name={info.name} title="Maestro do Salão" tone="gold" />
            <span className="block px-6 pb-3 pt-8">
              <span aria-live="polite" className="block min-h-[6.2rem] text-pretty font-body text-[17px] leading-relaxed text-dv-porcelain">
                {trechos(texto, shown).map((p, i) =>
                  p.forte ? (
                    <strong key={i} className="font-display font-semibold uppercase tracking-[0.08em] text-dv-gold-bright">
                      {p.t}
                    </strong>
                  ) : (
                    <span key={i}>{p.t}</span>
                  ),
                )}
                {!done && <span aria-hidden="true" className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-dv-blink bg-dv-gold-bright" />}
              </span>
              <span className="mt-3 flex items-center gap-3" aria-hidden="true">
                <span className="dv-label dv-tabular text-[10px] text-dv-text-3">
                  {String(index + 1).padStart(2, '0')}/{String(total).padStart(2, '0')}
                </span>
                <span className="relative h-[3px] flex-1 bg-dv-line">
                  <span className="absolute inset-y-0 left-0 bg-[linear-gradient(90deg,var(--dv-gold-deep),var(--dv-porcelain))] transition-[width] duration-500 ease-out" style={{ width: `${((index + 1) / total) * 100}%` }} />
                </span>
                <AdvanceIndicator visible={done} label={index + 1 >= total ? 'Entrar' : 'Continuar'} tone="gold" />
              </span>
            </span>
          </DialogueShell>
        </button>
      </div>
    </main>,
    document.body,
  )
}
