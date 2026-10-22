'use client'

import { useEffect, useState } from 'react'
import { HudCode, RecordPanel } from '@/components/devo/kit'
import { playSfx } from '@/lib/devo/audio'
import { ANUNCIO_APPS, ANUNCIO_LIMITES, type AnuncioConfig } from '@/lib/devo/anuncios'
import type { AppId } from '@/lib/devo/types'
import { ANUNCIOS_KEY, useAnuncios } from '../os/anuncios-card'
import { RecButton, RecInput, RecLabel, RecTag, RecTextarea } from './record-ui'
import { EmptyLine, ErrorLine, Loading, RecSelect } from './staff-ui'

/**
 * Mesa › Anúncios (Owner): os avisos rápidos do quadro da tela inicial. Eventos do Calendário dos próximos 14 dias
 * entram sozinhos depois destes. Um anúncio com data "até" some no dia seguinte.
 */
export function AnunciosMesa() {
  const { data, error, mutate } = useAnuncios()
  const [lista, setLista] = useState<AnuncioConfig[]>([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  useEffect(() => setLista(data?.config ?? []), [data?.config])
  if (error) return <ErrorLine>{(error as Error).message}</ErrorLine>
  if (!data) return <Loading />
  if (!data.podeEditar) return <ErrorLine>Só o Owner edita os anúncios.</ErrorLine>

  const mudar = (i: number, p: Partial<AnuncioConfig>) => setLista((l) => l.map((a, j) => (j === i ? { ...a, ...p } : a)))
  const salvar = async () => {
    setBusy(true)
    setMsg(null)
    try {
      const r = await fetch(ANUNCIOS_KEY, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'salvar', anuncios: lista }) })
      const j = await r.json().catch(() => null)
      if (!r.ok || !j?.ok) throw new Error(j?.error ?? 'Não foi possível salvar.')
      playSfx('confirm')
      setMsg('Anúncios salvos.')
      await mutate()
    } catch (e) {
      setMsg((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <RecordPanel variant="paper" title="Anúncios" jp="告知" ornate headerRight={<HudCode code="DV_AVISO" />}>
        <p className="font-body text-[15px] leading-relaxed text-in-fg-2">
          Avisos rápidos no quadro da tela inicial, no lugar do segundo relógio. Os eventos do Calendário dos próximos 14 dias entram sozinhos, depois destes.
        </p>
      </RecordPanel>
      <RecordPanel title="Seus anúncios" jp="一覧" headerRight={<RecTag tone="muted">{`${lista.length}/${ANUNCIO_LIMITES.max}`}</RecTag>}>
        <div className="flex flex-col gap-5">
          {!lista.length && <EmptyLine title="Nenhum anúncio">Escreva o primeiro, por exemplo: Novo Evento de Natal.</EmptyLine>}
          {lista.map((a, i) => (
            <div key={i} className="flex flex-col gap-2 border-b border-in-line pb-4">
              <RecLabel hint={`${a.titulo.length}/${ANUNCIO_LIMITES.titulo}`}>Título</RecLabel>
              <RecInput value={a.titulo} maxLength={ANUNCIO_LIMITES.titulo} onChange={(e) => mudar(i, { titulo: e.target.value })} placeholder="Novo Evento de Natal" />
              <RecLabel hint={`${a.texto.length}/${ANUNCIO_LIMITES.texto}`}>Texto</RecLabel>
              <RecTextarea value={a.texto} maxLength={ANUNCIO_LIMITES.texto} rows={2} onChange={(e) => mudar(i, { texto: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <label className="flex min-w-0 flex-col gap-1">
                  <RecLabel hint="ao tocar">Abre</RecLabel>
                  <RecSelect value={a.app ?? ''} onChange={(e) => mudar(i, { app: (e.target.value || null) as AppId | null })}>
                    <option value="">Nada</option>
                    {ANUNCIO_APPS.map(([id, nome]) => (
                      <option key={id} value={id}>
                        {nome}
                      </option>
                    ))}
                  </RecSelect>
                </label>
                <label className="flex min-w-0 flex-col gap-1">
                  <RecLabel hint="opcional">Até</RecLabel>
                  <RecInput type="date" value={a.ate ?? ''} onChange={(e) => mudar(i, { ate: e.target.value || null })} className="[color-scheme:dark]" />
                </label>
              </div>
              <RecButton size="sm" variant="ghost" onClick={() => setLista((l) => l.filter((_, j) => j !== i))}>
                Remover
              </RecButton>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <RecButton variant="secondary" disabled={lista.length >= ANUNCIO_LIMITES.max} onClick={() => setLista((l) => [...l, { id: `a${Date.now().toString(36)}`, titulo: '', texto: '', app: null, ate: null }])}>
              Novo anúncio
            </RecButton>
            <RecButton loading={busy} onClick={salvar}>
              Salvar
            </RecButton>
          </div>
          {msg && <p role="status" className="font-mono text-[12px] text-in-fg-2">{msg}</p>}
        </div>
      </RecordPanel>
    </>
  )
}
