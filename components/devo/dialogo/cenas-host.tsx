'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
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
export type AbrirOpts = { seNaoVista?: boolean; aoFim?: () => void; aoSair?: () => void }

type Ctx = {
  abrir: (id: string, opts?: AbrirOpts) => boolean
  /** Cena aberta agora (ou null). */
  aberta: string | null
  vista: (id: string) => boolean
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
  }, [recarregar])

  // Atalho por evento (roteiro de capturas e telas fora do React): window.dispatchEvent(new CustomEvent('devo:cena', { detail: 'id' })).
  // Só abre; quem decide se a cena pode ser vista é o servidor (flag exigida → 403).
  const abrirRef = useRef<(id: string) => void>(() => {})
  useEffect(() => {
    const on = (e: Event) => {
      const id = (e as CustomEvent<unknown>).detail
      if (typeof id === 'string') abrirRef.current(id)
    }
    window.addEventListener('devo:cena', on)
    return () => window.removeEventListener('devo:cena', on)
  }, [])

  const vista = useCallback((id: string) => !!resumo?.cenas[id]?.fim, [resumo])
  const abrir = useCallback(
    (id: string, opts: AbrirOpts = {}) => {
      if (abertaRef.current) return false
      if (opts.seNaoVista && vista(id)) return false
      setAberta({ id, opts })
      return true
    },
    [vista],
  )

  abrirRef.current = (id) => abrir(id)

  const value = useMemo<Ctx>(
    () => ({ abrir, aberta: aberta?.id ?? null, vista, carregado: !!resumo, config: resumo?.config ?? { galoExplorarMin: 2 }, recarregar }),
    [abrir, aberta, vista, resumo, recarregar],
  )

  return (
    <CenasContext.Provider value={value}>
      {children}
      {aberta && (
        <CenaDialogo
          key={aberta.id}
          cena={aberta.id}
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

const FORA: Ctx = { abrir: () => false, aberta: null, vista: () => false, carregado: false, config: { galoExplorarMin: 2 }, recarregar: async () => {} }

/** Abrir cenas de qualquer tela do sistema (fora do host: não faz nada). */
export function useCenas() {
  return useContext(CenasContext) ?? FORA
}
