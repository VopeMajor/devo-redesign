'use client'

import { Fragment, type ReactNode, useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { type ArcanoVista, custoDoProximo, ESTAGIO_MAX, numeralEstagio, type VirtudesPayload } from '@/lib/devo/virtudes'
import { cn } from '@/lib/utils'
import { Button } from '../kit/button'
import { useVirtudes } from '../virtudes/virtudes-app'

/**
 * Evolução e despertar dos Arcanos (dono, 22/10). O jogador sobe o Estágio do Arcano que tem pagando Fragmentos
 * Arcanos (I = 25 … VII = 1600) e desperta outro Arcano com um Grande Fragmento Arcano (entra no Estágio 0).
 * Owner/Anfitrião: sem trava e sem custo. Aqui também mora o TextoRico, que formata os textos longos dos Estágios.
 */

type Liberado = Extract<VirtudesPayload, { liberado: true }>

/** Nome do Estágio para a tela: vazio = o dono ainda não escreveu. */
export const nomeDoEstagio = (nome: string | undefined) => (nome ? nome : 'Ainda não revelado')

/* ------------------------------------------------------------------ texto longo */

/** Trecho com *destaque* no meio da frase. */
function emLinha(t: string): ReactNode[] {
  return t.split(/(\*[^*\n]+\*)/g).map((parte, i) =>
    /^\*[^*\n]+\*$/.test(parte) ? (
      <strong key={i} className="font-semibold text-dv-text">
        {parte.slice(1, -1)}
      </strong>
    ) : (
      <Fragment key={i}>{parte}</Fragment>
    ),
  )
}

/**
 * Parágrafos separados por linha em branco. Uma linha inteira entre *asteriscos* vira subtítulo (Aparência,
 * Fisiológico, o nome de uma habilidade); se for uma frase (termina em ponto), fica como frase em destaque.
 * A cor vem de quem usa (herdada).
 */
export function TextoRico({ texto, className }: { texto: string; className?: string }) {
  const blocos = texto
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
  return (
    <div className={cn('flex flex-col gap-3 font-body text-[15.5px] leading-relaxed', className)}>
      {blocos.map((b, i) => {
        const m = /^\*([^*]+)\*$/.exec(b)
        if (m && !/[.!?…:]$/.test(m[1].trim()))
          return (
            <h4 key={i} className="flex items-center gap-2 pt-1 font-display text-[13.5px] font-semibold uppercase leading-snug tracking-[0.1em] text-dv-gold-bright">
              <span aria-hidden="true" className="size-[5px] shrink-0 rotate-45 bg-dv-amethyst shadow-[0_0_6px_var(--dv-amethyst)]" />
              {m[1].trim()}
            </h4>
          )
        if (m)
          return (
            <p key={i} className="italic text-dv-text">
              {m[1].trim()}
            </p>
          )
        return (
          <p key={i} className="whitespace-pre-line">
            {emLinha(b)}
          </p>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ ações */

async function post(body: Record<string, unknown>) {
  const r = await fetch('/api/virtudes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const j = await r.json().catch(() => null)
  if (!r.ok || !j?.ok) throw new Error(j?.error ?? 'Não foi possível concluir. Tente de novo.')
  return j
}

function useAcao() {
  const { mutate } = useVirtudes()
  const [busy, setBusy] = useState(false)
  const [aviso, setAviso] = useState<{ tom: 'ok' | 'erro'; texto: string } | null>(null)
  const agir = async (body: Record<string, unknown>, ok: string) => {
    setBusy(true)
    setAviso(null)
    try {
      await post(body)
      playSfx('confirm')
      setAviso({ tom: 'ok', texto: ok })
      await mutate()
    } catch (e) {
      playSfx('error')
      setAviso({ tom: 'erro', texto: (e as Error).message })
    } finally {
      setBusy(false)
    }
  }
  return { busy, aviso, agir }
}

function Aviso({ aviso }: { aviso: { tom: 'ok' | 'erro'; texto: string } | null }) {
  if (!aviso) return null
  return (
    <p role={aviso.tom === 'erro' ? 'alert' : 'status'} className={cn('font-body text-[14.5px] leading-relaxed', aviso.tom === 'erro' ? 'text-dv-blood-text' : 'text-dv-amethyst-text')}>
      {aviso.texto}
    </p>
  )
}

/** Botão que pede um segundo toque antes de gastar (Confirmar / Cancelar). */
function BotaoConfirma({ rotulo, confirmar, disabled, loading, onConfirm }: { rotulo: string; confirmar: string; disabled?: boolean; loading?: boolean; onConfirm: () => void }) {
  const [pedindo, setPedindo] = useState(false)
  if (pedindo && !disabled)
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          loading={loading}
          onClick={() => {
            setPedindo(false)
            onConfirm()
          }}
        >
          {confirmar}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setPedindo(false)}>
          Cancelar
        </Button>
      </div>
    )
  return (
    <Button size="sm" variant="secondary" disabled={disabled} loading={loading} onClick={() => setPedindo(true)} className="max-w-full whitespace-normal text-left">
      {rotulo}
    </Button>
  )
}

/* ------------------------------------------------------------------ evoluir */

/** Painel "Evolução" do altar, para um Arcano que o jogador tem. */
export function EvolucaoArcano({ a, d }: { a: ArcanoVista; d: Liberado }) {
  const { busy, aviso, agir } = useAcao()
  const posse = a.posse!
  const equipe = d.verTodos
  const atual = posse.estagio
  const custo = custoDoProximo(atual)
  const para = atual + 1
  const nomes = a.detalhe?.estagios ?? []
  const falta = custo != null && !equipe ? Math.max(0, custo - d.fragmentos) : 0
  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-2 gap-2">
        <div className="bg-dv-ink-3/60 px-3 py-2.5 shadow-[inset_0_0_0_1px_var(--dv-line)]">
          <dt className="dv-label text-[9.5px] text-dv-text-3">Estágio atual</dt>
          <dd className="mt-1 font-display text-[15px] font-semibold uppercase tracking-[0.06em] text-dv-text">
            <span className="dv-brass-text mr-1.5 font-impact">{numeralEstagio(atual)}</span>
            {nomeDoEstagio(nomes[atual]?.nome)}
          </dd>
        </div>
        <div className="bg-dv-ink-3/60 px-3 py-2.5 shadow-[inset_0_0_0_1px_var(--dv-line)]">
          <dt className="dv-label text-[9.5px] text-dv-text-3">Fragmentos Arcanos</dt>
          <dd className="mt-1 font-impact text-[20px] font-semibold leading-none text-dv-gold-bright dv-tabular">{d.fragmentos}</dd>
        </div>
      </dl>
      {custo == null ? (
        <p className="font-body text-[15px] leading-relaxed text-dv-text-2">Estágio {numeralEstagio(ESTAGIO_MAX)} alcançado. Não há Estágio além deste.</p>
      ) : (
        <>
          <p className="font-body text-[15px] leading-relaxed text-dv-text-2">
            Próximo: <span className="text-dv-text">Estágio {numeralEstagio(para)}</span>
            {nomes[para]?.nome ? ` — ${nomes[para].nome}` : ''}. {equipe ? 'Para a equipe, sem custo.' : `Custa ${custo} Fragmentos Arcanos.`}
          </p>
          {posse.original && (
            <p className="font-body text-[14px] italic leading-relaxed text-dv-text-3">Este é o seu Arcano original: ao evoluir, os Pontos de Potencial acumulados se espalham pelas Virtudes.</p>
          )}
          <BotaoConfirma
            rotulo={equipe ? `Evoluir para o Estágio ${numeralEstagio(para)} — sem custo` : `Evoluir para o Estágio ${numeralEstagio(para)} — ${custo} Fragmentos`}
            confirmar={equipe ? 'Confirmar Evolução' : `Confirmar: gastar ${custo}`}
            disabled={falta > 0}
            loading={busy}
            onConfirm={() => void agir({ action: 'arcano.evoluir', arcano: a.key, de: atual }, `Estágio ${numeralEstagio(para)} alcançado.`)}
          />
          {falta > 0 && (
            <p className="font-mono text-[11px] uppercase leading-relaxed tracking-[0.12em] text-dv-text-3">
              Faltam {falta} Fragmentos Arcanos (você tem {d.fragmentos} de {custo}).
            </p>
          )}
        </>
      )}
      <Aviso aviso={aviso} />
    </div>
  )
}

/* ------------------------------------------------------------------ despertar */

/** Despertar um Arcano que o jogador não tem, com um Grande Fragmento Arcano (Estágio 0). */
export function DespertarArcano({ a, d, compacto }: { a: ArcanoVista; d: Liberado; compacto?: boolean }) {
  const { busy, aviso, agir } = useAcao()
  const equipe = d.verTodos
  const tem = d.grandesFragmentos
  const nome = a.titulo.replace(/^Arcano d[aoe]s? /, '')
  return (
    <div className={cn('flex flex-col gap-2.5', compacto && 'items-center text-center')}>
      {!compacto && (
        <p className="font-body text-[15px] leading-relaxed text-dv-text-2">
          Despertar este Arcano o coloca no Estágio 0, A Essência, com evolução própria. Seu Arcano original continua definindo as Virtudes.{' '}
          {equipe ? 'Para a equipe, sem custo.' : tem ? `Você tem ${tem} ${tem === 1 ? 'Grande Fragmento Arcano' : 'Grandes Fragmentos Arcanos'}.` : ''}
        </p>
      )}
      <BotaoConfirma
        rotulo="Despertar com Grande Fragmento Arcano"
        confirmar={equipe ? `Despertar ${nome}` : `Confirmar: gastar 1 para ${nome}`}
        disabled={!equipe && tem < 1}
        loading={busy}
        onConfirm={() => void agir({ action: 'arcano.despertar', arcano: a.key }, `${a.titulo} despertou. Estágio 0, A Essência.`)}
      />
      {!equipe && tem < 1 && <p className="font-mono text-[11px] uppercase leading-relaxed tracking-[0.12em] text-dv-text-3">Você não tem um Grande Fragmento Arcano.</p>}
      <Aviso aviso={aviso} />
    </div>
  )
}
