import 'server-only'
import { pool } from '@/lib/db'
import { type Anuncio, type AnunciosPayload, lerAnuncios } from './anuncios'
import { eventosProximos } from './calendario-server'
import { can } from './cargos'
import { run } from './fundacao-db'
import { requireActor, requireCan } from './permissoes-server'
import { getConfig, setConfig } from './progresso-server'

const quando = (emDias: number) => (emDias <= 0 ? 'Acontecendo agora' : emDias === 1 ? 'Amanhã' : `Em ${emDias} dias`)

/** Anúncios da home: os do Owner primeiro (os vencidos somem sozinhos), depois os eventos do Calendário. */
export async function getAnuncios(playerId: string): Promise<AnunciosPayload> {
  const ator = await requireActor(playerId)
  const [cfg, eventos, [{ hoje }]] = await Promise.all([
    getConfig('home.anuncios'),
    eventosProximos(14).catch(() => []),
    run<{ hoje: string }>(pool, "SELECT to_char((now() AT TIME ZONE 'America/Sao_Paulo')::date, 'YYYY-MM-DD') AS hoje"),
  ])
  const config = lerAnuncios(cfg?.value)
  const proprios: Anuncio[] = config.filter((a) => !a.ate || a.ate >= hoje).map((a) => ({ id: `o-${a.id}`, kicker: 'Anúncio', titulo: a.titulo, texto: a.texto, app: a.app }))
  const vistos = new Set<string>()
  const doCalendario: Anuncio[] = []
  for (const e of eventos) {
    if (vistos.has(e.id)) continue
    vistos.add(e.id)
    doCalendario.push({ id: `c-${e.id}`, kicker: quando(e.emDias), titulo: e.titulo, texto: e.descricao.slice(0, 160), app: 'calendario', arte: e.arte })
  }
  const podeEditar = can(ator, 'config.editar')
  return { anuncios: [...proprios, ...doCalendario].slice(0, 8), podeEditar, ...(podeEditar ? { config } : {}) }
}

export async function salvarAnuncios(atorId: string, valor: unknown) {
  const ator = await requireActor(atorId)
  requireCan(ator, 'config.editar')
  const lista = lerAnuncios(valor)
  await setConfig(atorId, 'home.anuncios', lista, false, 'Anúncios rápidos da tela inicial.')
  return lista
}
