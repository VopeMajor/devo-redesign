/**
 * Cena PINTADA do Poço (infra/arte fd2f966, public/images/poco/cena/*; paleta Kokken no Inori).
 *
 * - `rua-<lado>.webp`  rua de barro e casas antigas (opaca, retrato 2:3).
 * - `poco-<lado>.webp` o poço milenar com a estela (alfa); `poco-brilho.webp` pulso da névoa na boca.
 * - Posição (rua.json): centro da base do poço em (0.5, 0.83) da rua; largura do poço = 0.56 da rua.
 *
 * `null` volta ao desenho vetorial de poco-cena.tsx (fallback). Pedidos de camadas extras:
 * docs/redesign/PEDIDO-ARTE-poco.md.
 */
export const POCO_CENA = {
  rua: { base: '/images/poco/cena/rua', lados: [512, 768, 1024, 1536], aspecto: 2 / 3 },
  poco: { base: '/images/poco/cena/poco', lados: [256, 512, 1024], aspecto: 898 / 1024 },
  brilho: '/images/poco/cena/poco-brilho.webp',
  /** Base do poço na rua (fração da largura/altura da rua) e largura do poço em fração da rua. */
  baseX: 0.5,
  baseY: 0.83,
  largura: 0.56,
  /** Na imagem do poço (fração): boca d'água (centro), corda (x) e onde o pé encosta no chão (y). */
  boca: { x: 0.52, y: 0.52, largura: 0.56 },
  corda: { x: 0.405, topo: 0.27 },
  pe: 0.94,
} as const

/** Desligue (null) para voltar ao desenho vetorial. */
export const POCO_PINTADO: typeof POCO_CENA | null = POCO_CENA

export function srcset(base: string, lados: readonly number[]) {
  return lados.map((l) => `${base}-${l}.webp ${l}w`).join(', ')
}

/** Camadas extras opcionais (ainda não pedidas): substituem partes desenhadas do fallback vetorial. */
export const POCO_PINTURA: Partial<Record<'fundo' | 'patio' | 'frente' | 'nevoa', string>> = {}
