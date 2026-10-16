import { defineCloudflareConfig } from '@opennextjs/cloudflare'
import staticAssetsIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache'

/**
 * Configuração do OpenNext para Cloudflare (opennext.js.org/cloudflare/caching).
 *
 * O DEVO é quase todo dinâmico (sessão, banco). As poucas páginas pré-renderizadas no build são
 * servidas dos Static Assets (só leitura, sem R2/KV e sem custo extra). Não há ISR/revalidate.
 */
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
})
