/**
 * Casa em RPG Maker (DEVO v2): o avatar da Casa e as visitas na porta. Compartilhado entre cliente e servidor.
 * Regras do dono (docs/redesign/v2/PEDIDO-V2-dono.md): a primeira escolha de aparência é grátis, assim que a Casa é
 * desbloqueada; trocar depois é no guarda-roupa do quarto e custa 1 hora de Tempo; o avatar e o chibi são só da Casa.
 */

/** Índices de catálogo (as cores e as peças estão em components/v2/casa/avatar-cor.ts). */
export type Aparencia = {
  corpo: number
  cabelo: number
  rosto: number
  roupa: number
  corCabelo: number
  corOlhos: number
  pele: number
}

/** Quantas opções há de cada parte (kit3/avatar.html): 2 corpos, 18 cabelos, 18 rostos, 6 roupas e as cores. */
export const APARENCIA_LIMITES: Record<keyof Aparencia, number> = {
  corpo: 2,
  cabelo: 18,
  rosto: 18,
  roupa: 6,
  corCabelo: 18,
  corOlhos: 12,
  pele: 10,
}

export const APARENCIA_PADRAO: Aparencia = { corpo: 0, cabelo: 0, rosto: 0, roupa: 0, corCabelo: 6, corOlhos: 0, pele: 1 }

export const ROUPAS = ['Casaco do Record', 'Dândi', 'Paróquia', 'Turno da noite', 'Enlutado', 'Andarilho'] as const

/** Troca no guarda-roupa: 1 hora de Tempo (dono). */
export const TROCA_MINUTOS = 60

/** Lê uma aparência vinda de fora. Qualquer campo fora do catálogo → null. */
export function lerAparencia(v: unknown): Aparencia | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  const out = {} as Aparencia
  for (const k of Object.keys(APARENCIA_LIMITES) as (keyof Aparencia)[]) {
    const n = o[k]
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 0 || n >= APARENCIA_LIMITES[k]) return null
    out[k] = n
  }
  return out
}

export const mesmaAparencia = (a: Aparencia, b: Aparencia) => (Object.keys(APARENCIA_LIMITES) as (keyof Aparencia)[]).every((k) => a[k] === b[k])

/**
 * Etapas da Casa (kit3/casa.html): 1 só a sala (caixas fechadas) · 2 sala e mesa de oficina · 3 o andar dos quartos.
 * No jogo a mesa existe desde o desbloqueio (a Confecção de hoje não pode se perder), então o jogador começa na 2.
 * O andar dos quartos abre depois da primeira fabricação na mesa (regra provisória: o dono ainda vai decidir).
 * Owner e Anfitrião veem tudo.
 */
export type CasaEtapa = 1 | 2 | 3

export type VisitaResultado = 'atendeu' | 'ignorou'

export type CasaMapaPayload =
  | { liberado: false; motivo: string }
  | {
      liberado: true
      aparencia: Aparencia | null
      etapa: CasaEtapa
      /** Fabricações em andamento na mesa (para o cartão da mesa). */
      andamento: number
      /** Visita que está na porta agora (o Simon, até ser atendido). */
      visita: 'simon' | null
      simon: { resultado: VisitaResultado; detalhe: Record<string, unknown> } | null
      trocaMinutos: number
      equipe: boolean
    }
