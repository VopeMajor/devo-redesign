#!/usr/bin/env node
// Busca empresas sem site no Google Maps e adiciona à lista de leads.
//
//   node prospector/buscar.mjs --nicho "barbearia, pet shop" --cidade "Campinas, SP"
import { parseArgs } from "node:util"
import { buscarGoogle, mesclarLeads, placeParaLead } from "./lib.mjs"
import { carregarConfig, carregarLeads, chaveGoogle, salvarLeads } from "./comum.mjs"
import { gerarPainel } from "./painel.mjs"

const { values } = parseArgs({
  options: {
    nicho: { type: "string" },
    cidade: { type: "string" },
    max: { type: "string", default: "60" },
    "sem-redes": { type: "boolean", default: false },
    ajuda: { type: "boolean", short: "h", default: false },
  },
})

if (values.ajuda || !values.nicho || !values.cidade) {
  console.log(`Uso:
  node prospector/buscar.mjs --nicho "barbearia, pet shop" --cidade "Campinas, SP; Valinhos, SP"

Opções:
  --nicho      um ou mais nichos, separados por vírgula
  --cidade     uma ou mais cidades, separadas por ponto e vírgula
  --max        máximo de resultados por nicho+cidade (até 60, padrão 60)
  --sem-redes  ignora empresas cujo "site" é só Instagram/Facebook`)
  process.exit(values.ajuda ? 0 : 1)
}

const chave = chaveGoogle()
if (!chave) {
  console.error("✖ Falta a chave GOOGLE_PLACES_API_KEY. Veja prospector/README.md, passo 1.")
  process.exit(1)
}

const config = carregarConfig()
const nichos = values.nicho.split(",").map((s) => s.trim()).filter(Boolean)
const cidades = values.cidade.split(";").map((s) => s.trim()).filter(Boolean)
const max = Math.min(60, Math.max(1, Number(values.max) || 60))

let leads = carregarLeads()
let totalNovos = 0

for (const cidade of cidades) {
  for (const nicho of nichos) {
    const consulta = `${nicho} em ${cidade}`
    process.stdout.write(`🔎 ${consulta} … `)
    let places
    try {
      places = await buscarGoogle({ chave, consulta, max })
    } catch (e) {
      console.log(`\n✖ ${e.message}`)
      process.exit(1)
    }
    let achados = places.map((p) => placeParaLead(p, { nicho, cidade })).filter(Boolean)
    if (values["sem-redes"]) achados = achados.filter((l) => l.situacaoSite === "sem_site")
    if (config.apenasCelular) achados = achados.filter((l) => l.tipoTelefone === "celular")
    const r = mesclarLeads(leads, achados)
    leads = r.leads
    totalNovos += r.adicionados
    console.log(`${places.length} empresas, ${achados.length} sem site com WhatsApp, ${r.adicionados} novas`)
  }
}

salvarLeads(leads)
const painel = gerarPainel()
console.log(`\n✔ ${totalNovos} leads novos (${leads.length} no total).`)
console.log(`   Abra o painel no navegador: ${painel}`)
