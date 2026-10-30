// Leitura/gravação de arquivos compartilhada pelos comandos.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

export const PASTA = dirname(fileURLToPath(import.meta.url))
export const PASTA_DADOS = join(PASTA, "dados")
export const ARQ_LEADS = join(PASTA_DADOS, "leads.json")
export const ARQ_PAINEL = join(PASTA_DADOS, "painel.html")

let configCache
export function carregarConfig() {
  if (configCache) return configCache
  const propria = join(PASTA, "config.json")
  if (existsSync(propria)) return (configCache = JSON.parse(readFileSync(propria, "utf8")))
  console.warn("⚠  prospector/config.json não existe — usando config.example.json. Copie e coloque seu nome e portfólio.\n")
  return (configCache = JSON.parse(readFileSync(join(PASTA, "config.example.json"), "utf8")))
}

export function carregarLeads() {
  if (!existsSync(ARQ_LEADS)) return []
  return JSON.parse(readFileSync(ARQ_LEADS, "utf8"))
}

export function salvarLeads(leads) {
  mkdirSync(PASTA_DADOS, { recursive: true })
  writeFileSync(ARQ_LEADS, JSON.stringify(leads, null, 2))
}

/** Chave da Google Places API: variável de ambiente ou prospector/.env */
export function chaveGoogle() {
  if (process.env.GOOGLE_PLACES_API_KEY) return process.env.GOOGLE_PLACES_API_KEY
  const env = join(PASTA, ".env")
  if (!existsSync(env)) return null
  const m = readFileSync(env, "utf8").match(/^\s*GOOGLE_PLACES_API_KEY\s*=\s*["']?([^"'\s]+)/m)
  return m?.[1] ?? null
}
