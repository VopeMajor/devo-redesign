/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Cloudflare (OpenNext): o `pg` carrega `pg-cloudflare` só no runtime workerd, por condição de export
  // que o Next não rastreia. Como pacotes externos, o OpenNext copia os dois inteiros com a condição
  // "workerd" (opennext.js.org/cloudflare/howtos/workerd). No Node nada muda: o `pg` já é externo.
  serverExternalPackages: ['pg', 'pg-cloudflare'],
}

export default nextConfig
