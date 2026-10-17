'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { getCena } from '@/lib/devo/dialogo/registro'
import { CenaDialogo } from './cena-dialogo'
import { lerResumo, type Resumo } from './cliente'

/**
 * HOST GLOBAL DE CENAS. Montado no sistema (fase `os`). API para qualquer tela:
 *
 *   const cenas = useCenas()
 *   cenas.abrir('reflexao-anfitriao', { seNaoVista: true, aoFim: () => … })
 *   cenas.vista('galo-casa')
 *
 * `seNaoVista`: só abre se a cena nunca foi concluída (resumo do servidor). Devolve `false` se não abriu.
 */
export type AbrirOpts = {
  seNaoVista?: boolean
  aoFim?: () => void
  aoSair?: () => void
  /** Cada escolha feita (id da escolha, opção 0-based que valeu) — para sistemas que guardam a resposta. */
  aoEscolher?: (escolha: string, opcao: number) => void
}

/** Pedidos de cena de outros sistemas (evento `devo:cena`) → cena do motor + o que fazer com a resposta. */
const PEDIDOS: Record<string, { cena: string; opts?: AbrirOpts }> = {
  // Corporações: holograma da Melissa na 1ª entrada (a cena oficial assume o id; já vista → não repete).
  'melissa-corporacoes': { cena: 'melissa-corporacoes', opts: { seNaoVista: true } },
  // Torres (components/devo/torres/gatilho.tsx): "Anfitrião de quê?" ao sair da aba pela primeira vez.
  'anfitriao-de-que': {
    cena: 'reflexao-anfitriao',
    opts: {
      aoEscolher: (_, opcao) =>
        void fetch('/api/torres', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'reflexao', escolha: opcao + 1 }) }).catch(() => {}),
    },
  },
}

type Ctx = {
  abrir: (id: string, opts?: AbrirOpts) => boolean
  /** Cena aberta agora (ou null). */
  aberta: string | null
  vista: (id: string) => boolean
  /** Cena com condição de história que o servidor já liberou para este jogador (e ainda não terminada). */
  disponivel: (id: string) => boolean
  /** O resumo do servidor já chegou. */
  carregado: boolean
  config: Resumo['config']
  recarregar: () => Promise<void>
}

const CenasContext = createContext<Ctx | null>(null)

export function CenasProvider({ children }: { children: ReactNode }) {
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [aberta, setAberta] = useState<{ id: string; opts: AbrirOpts } | null>(null)
  const abertaRef = useRef(aberta)
  abertaRef.current = aberta
  const recarregar = useCallback(async () => {
    const r = await lerResumo()
    if (r) setResumo(r)
  }, [])
  useEffect(() => {
    void recarregar()
    // Condições de história mudam fora da tela (ex.: o Dealer aplica o resultado do Deadly Vote): confere de novo ao voltar.
    const onVis = () => {
      if (document.visibilityState === 'visible') void recarregar()
    }
    document.addEventListener('visibilitychange', onVis)
    const t = window.setInterval(() => void recarregar(), 5 * 60_000)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.clearInterval(t)
    }
  }, [recarregar])

  // Pedido por evento: window.dispatchEvent(new CustomEvent('devo:cena', { detail: 'id' | { id }, cancelable: true })).
  // Cena registrada (ou pedido conhecido em PEDIDOS) → o motor assume e chama preventDefault() (o fallback das
  // Torres não toca). Quem decide se a cena pode ser vista é o servidor (flag exigida → 403).
  const abrirRef = useRef<(id: string, opts?: AbrirOpts) => boolean>(() => false)
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<unknown>).detail
      const id = typeof d === 'string' ? d : d && typeof d === 'object' && typeof (d as { id?: unknown }).id === 'string' ? (d as { id: string }).id : null
      if (!id) return
      const pedido = PEDIDOS[id] ?? (getCena(id) ? { cena: id } : null)
      if (!pedido) return
      e.preventDefault()
      abrirRef.current(pedido.cena, pedido.opts)
    }
    window.addEventListener('devo:cena', on)
    return () => window.removeEventListener('devo:cena', on)
  }, [])

  const vista = useCallback((id: string) => !!resumo?.cenas[id]?.fim, [resumo])
  const disponivel = useCallback((id: string) => !!resumo?.disponiveis.includes(id) && !resumo.cenas[id]?.fim, [resumo])
  const abrir = useCallback(
    (id: string, opts: AbrirOpts = {}) => {
      if (abertaRef.current) return false
      if (opts.seNaoVista && vista(id)) return false
      setAberta({ id, opts })
      return true
    },
    [vista],
  )

  abrirRef.current = abrir

  const value = useMemo<Ctx>(
    () => ({ abrir, aberta: aberta?.id ?? null, vista, disponivel, carregado: !!resumo, config: resumo?.config ?? { galoExplorarMin: 2 }, recarregar }),
    [abrir, aberta, vista, disponivel, resumo, recarregar],
  )

  return (
    <CenasContext.Provider value={value}>
      {children}
      {aberta && (
        <CenaDialogo
          key={aberta.id}
          cena={aberta.id}
          onEscolha={aberta.opts.aoEscolher}
          onFim={() => {
            // Marca vista na hora (a interface reage já); o servidor confirma no recarregar.
            setResumo((r) => (r ? { ...r, cenas: { ...r.cenas, [aberta.id]: { passo: 0, fim: true } } } : r))
            setAberta(null)
            void recarregar()
            aberta.opts.aoFim?.()
          }}
          onSair={() => {
            setAberta(null)
            void recarregar()
            aberta.opts.aoSair?.()
          }}
        />
      )}
    </CenasContext.Provider>
  )
}

const FORA: Ctx = { abrir: () => false, aberta: null, vista: () => false, disponivel: () => false, carregado: false, config: { galoExplorarMin: 2 }, recarregar: async () => {} }

/** Abrir cenas de qualquer tela do sistema (fora do host: não faz nada). */
export function useCenas() {
  return useContext(CenasContext) ?? FORA
}
