#!/usr/bin/env node
// Importa leads de uma planilha CSV (colunas: nome, telefone, nicho, cidade, endereco, site).
//
//   node prospector/importar.mjs minha-lista.csv
import { readFileSync } from "node:fs"
import { lerCSV, linhaCSVParaLead, mesclarLeads } from "./lib.mjs"
import { carregarConfig, carregarLeads, salvarLeads } from "./comum.mjs"
import { gerarPainel } from "./painel.mjs"

const arquivo = process.argv[2]
if (!arquivo) {
  console.log("Uso: node prospector/importar.mjs lista.csv\nColunas: nome, telefone, nicho, cidade, endereco, site")
  process.exit(1)
}

const config = carregarConfig()
const linhas = lerCSV(readFileSync(arquivo, "utf8"))
let achados = linhas.map(linhaCSVParaLead).filter(Boolean)
if (config.apenasCelular) achados = achados.filter((l) => l.tipoTelefone === "celular")

const { leads, adicionados } = mesclarLeads(carregarLeads(), achados)
salvarLeads(leads)
const painel = gerarPainel()
console.log(`✔ ${linhas.length} linhas lidas, ${achados.length} válidas, ${adicionados} novas.`)
console.log(`   Painel: ${painel}`)
