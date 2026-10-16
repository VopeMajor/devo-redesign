/**
 * Atalhos para escrever cenas (lib/devo/dialogo/formato.ts) de forma parecida com o texto do dono.
 * Ex.: `narra('Relações são complicadas')`, `fala('galo', 'E aí, pé de caju.')`, `escolha('porta', [...])`.
 */
import type { Efeito, Opcao, Passo, PassoResposta } from './formato'

type Extra<T extends Passo['tipo']> = Omit<Extract<Passo, { tipo: T }>, 'tipo' | 'texto' | 'quem' | 'opcoes' | 'efeitos'>

/** "[texto]" do original, sem os colchetes. */
export const narra = (texto: string, extra: Extra<'narra'> = {}): Extract<Passo, { tipo: 'narra' }> => ({ tipo: 'narra', texto, ...extra })
/** Fala de alguém do elenco (ou `'jogador'`). */
export const fala = (quem: string, texto: string, extra: Extra<'fala'> = {}): Extract<Passo, { tipo: 'fala' }> => ({ tipo: 'fala', quem, texto, ...extra })
/** Fala do próprio jogador. */
export const eu = (texto: string, extra: Extra<'fala'> = {}) => fala('jogador', texto, extra)
/** "texto entre aspas" do original (pensamento do jogador), sem as aspas. */
export const pensa = (texto: string, extra: Extra<'pensa'> = {}): Extract<Passo, { tipo: 'pensa' }> => ({ tipo: 'pensa', texto, ...extra })
/** "*Som de porta abrindo*" → legenda + som. */
export const som = (texto: string, id: string, extra: Extra<'som'> = {}): Extract<Passo, { tipo: 'som' }> => ({ tipo: 'som', texto, som: id, ...extra })
/** Caixa de sistema com título. */
export const sistema = (titulo: string | undefined, texto: string | string[], extra: Extra<'sistema'> = {}): Extract<Passo, { tipo: 'sistema' }> => ({
  tipo: 'sistema',
  titulo,
  texto,
  ...extra,
})
/** Escolhas numeradas (modo `uma` por padrão). */
export const escolha = (id: string, opcoes: (Opcao | string)[], extra: Omit<Extra<'escolha'>, 'id'> = {}): Extract<Passo, { tipo: 'escolha' }> => ({
  tipo: 'escolha',
  id,
  opcoes: opcoes.map((o) => (typeof o === 'string' ? { texto: o } : o)),
  ...extra,
})
/** Uma opção com respostas (e efeitos opcionais). */
export const opcao = (texto: string, respostas: PassoResposta[] = [], extra: Omit<Opcao, 'texto' | 'respostas'> = {}): Opcao => ({ texto, respostas, ...extra })
/** Efeito fora de escolha. */
export const efeito = (id: string, efeitos: Efeito[], aviso?: string, extra: Omit<Extra<'efeito'>, 'id' | 'aviso'> = {}): Extract<Passo, { tipo: 'efeito' }> => ({
  tipo: 'efeito',
  id,
  efeitos,
  aviso,
  ...extra,
})
export const ir = (para: string): Extract<Passo, { tipo: 'ir' }> => ({ tipo: 'ir', para })
