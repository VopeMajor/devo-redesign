'use client'

import { Lock } from 'lucide-react'
import type { CSSProperties } from 'react'
import { BrassCorners, Button } from '@/components/devo/kit'
import { cn } from '@/lib/utils'
import { type CosmeticoDef, naColecao, type Visual } from '@/lib/devo/cosmeticos'
import { FotoMoldurada, NomeVisual } from './cosmetic-art'
import { BordaPerfilFundo } from './estilo-nome'
import { useAnimarCosmeticos, useMeusCosmeticos } from './use-cosmeticos'

/** Moldura de avatar equipada pelo próprio jogador (para o Record File). */
export function useMinhaMolduraAvatar(): CosmeticoDef | null {
  const { data } = useMeusCosmeticos()
  const k = data?.equipados.moldura_avatar
  return (k && data?.catalogo.find((c) => c.key === k)) || null
}

/**
 * Cartão "Identidade" no Record: como o jogador aparece (miniperfil + nome + emblema) e a entrada da Coleção.
 * Trancado (com o motivo) até vencer o primeiro Deadly Vote — Owner e Anfitrião veem liberado.
 */
export function IdentidadePanel({ nome, fotoSrc, onAbrir }: { nome: string; fotoSrc: string | null; onAbrir: () => void }) {
  const { data, error } = useMeusCosmeticos()
  const animar = useAnimarCosmeticos()
  if (error) return null
  const total = (data?.catalogo ?? []).filter((c) => naColecao(c) && c.active).length
  const meus = data ? new Set(data.possuidos.map((p) => p.key)) : new Set<string>()
  const obtidos = (data?.catalogo ?? []).filter((c) => naColecao(c) && meus.has(c.key)).length
  const eq = data?.equipados
  const visual: Visual | null = eq ? { id: 'eu', foto: null, av: eq.moldura_avatar, mini: eq.moldura_mini, emb: eq.emblema, bal: eq.balao, ef: eq.efeito, borda: eq.borda, anfitriao: false } : null
  const mini = eq?.moldura_mini ? (data?.catalogo.find((c) => c.key === eq.moldura_mini) ?? null) : null
  const borda = eq?.borda ? (data?.catalogo.find((c) => c.key === eq.borda) ?? null) : null
  const fundo = borda?.imagem ? `${borda.imagem.base}-${borda.imagem.tamanhos.find((t) => t >= 512) ?? borda.imagem.tamanhos.at(-1)}.webp` : null

  return (
    <section
      aria-label="Identidade e coleção"
      className="dv-cut relative overflow-hidden bg-dv-ink text-dv-text shadow-[inset_0_0_0_1px_rgba(186,176,159,0.45)]"
      style={{ '--dv-cut': '12px' } as CSSProperties}
    >
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[url(/images/os/marmore-negro.webp)] bg-[length:520px_520px] opacity-45" />
      {/* borda do perfil equipada: faixa do topo do cartão (a mesma do miniperfil) */}
      {borda && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[92px]">
          <BordaPerfilFundo borda={borda.borda} imagem={fundo} animar={animar} />
          <span className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#0c0c0e] to-transparent" />
        </span>
      )}
      <BrassCorners size={22} inset={3} />
      <div className={cn('relative flex items-center gap-4 p-4', borda && 'pt-12')}>
        <FotoMoldurada formato="mini" src={fotoSrc} moldura={mini} largura={84} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-dv-text-3">Identidade · cosméticos</p>
          {data ? (
            <NomeVisual nome={nome} visual={visual} className="text-[19px]" tamanhoEmblema={18} cor="#ece5d8" />
          ) : (
            <span className="h-5 w-32 animate-pulse bg-white/10" />
          )}
          {data && !data.liberada ? (
            <p className="flex items-start gap-1.5 font-body text-[14px] leading-snug text-dv-text-2">
              <Lock className="mt-0.5 size-3.5 shrink-0 text-dv-gold" aria-hidden="true" />A coleção abre depois que você vencer o primeiro Deadly Vote.
            </p>
          ) : (
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-dv-text-2">
              <span className="font-impact text-[18px] text-dv-text dv-tabular">{obtidos}</span> / {total} obtidos
            </p>
          )}
        </div>
      </div>
      <div className="relative border-t border-[rgba(186,176,159,0.25)] px-4 py-3">
        <Button variant="secondary" size="md" block disabled={!data?.liberada} onClick={onAbrir} aria-label="Abrir coleção">
          {data && !data.liberada ? 'Coleção trancada' : 'Abrir coleção'}
        </Button>
      </div>
    </section>
  )
}
