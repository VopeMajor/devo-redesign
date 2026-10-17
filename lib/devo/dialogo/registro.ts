/**
 * REGISTRO DE CENAS. O servidor só aceita cenas daqui (é daqui que ele lê os efeitos).
 * Para acrescentar a sua: crie `lib/devo/dialogo/cenas/<id>.ts` e ponha UMA linha abaixo (uma por cena,
 * em ordem alfabética, para não dar conflito entre agentes).
 */
import { CENA_GALO_CASA } from './cenas/galo-casa'
import { CENA_MELISSA_CORPORACOES } from './cenas/melissa-corporacoes'
import { CENA_POCO_ENCONTRO } from './cenas/poco-encontro'
import { CENA_REFLEXAO_ANFITRIAO } from './cenas/reflexao-anfitriao'
import type { Cena, Passo } from './formato'

const LISTA: Cena[] = [
  CENA_GALO_CASA,
  CENA_MELISSA_CORPORACOES,
  CENA_POCO_ENCONTRO,
  CENA_REFLEXAO_ANFITRIAO,
]

export const CENAS: Record<string, Cena> = Object.fromEntries(LISTA.map((c) => [c.id, c]))

export function getCena(id: string): Cena | null {
  return Object.prototype.hasOwnProperty.call(CENAS, id) ? CENAS[id] : null
}

/** Índice do passo com esse `id` (−1 se não existe; `'fim'` → tamanho da cena). */
export function indicePasso(cena: Cena, id: string) {
  if (id === 'fim') return cena.passos.length
  return cena.passos.findIndex((p) => p.id === id)
}

export function passoPorId<T extends Passo['tipo']>(cena: Cena, id: string, tipo: T): Extract<Passo, { tipo: T }> | null {
  const p = cena.passos.find((x) => x.id === id && x.tipo === tipo)
  return (p as Extract<Passo, { tipo: T }>) ?? null
}

/**
 * Confere uma cena (ids únicos, saltos válidos, escolhas com opções). Rodado pelo teste de servidor
 * (scripts/dev/narrativa-test.mjs) para todas as cenas do registro.
 */
export function validarCena(cena: Cena): string[] {
  const erros: string[] = []
  const ids = new Set<string>()
  for (const p of cena.passos) {
    if (p.id) {
      if (ids.has(p.id)) erros.push(`${cena.id}: id repetido "${p.id}"`)
      ids.add(p.id)
    }
  }
  const alvo = (para: string, onde: string) => {
    if (para !== 'fim' && !ids.has(para)) erros.push(`${cena.id}: salto para "${para}" inexistente (${onde})`)
  }
  for (const p of cena.passos) {
    if (p.tipo === 'ir') alvo(p.para, 'ir')
    if (p.tipo === 'escolha') {
      if (!p.opcoes.length) erros.push(`${cena.id}: escolha "${p.id}" sem opções`)
      p.opcoes.forEach((o, i) => o.ir && alvo(o.ir, `${p.id}#${i + 1}`))
    }
  }
  return erros
}
