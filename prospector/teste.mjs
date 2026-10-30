// node --test prospector/teste.mjs
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import {
  buscarGoogle,
  classificarSite,
  lerCSV,
  linhaCSVParaLead,
  mensagensDoLead,
  mesclarLeads,
  normalizarTelefoneBR,
  placeParaLead,
} from "./lib.mjs"

const config = JSON.parse(readFileSync(new URL("./config.example.json", import.meta.url), "utf8"))

test("telefone: celular, fixo, nono dígito e inválidos", () => {
  assert.deepEqual(normalizarTelefoneBR("+55 19 99123-4567"), { e164: "5519991234567", ddd: "19", numero: "991234567", tipo: "celular" })
  assert.equal(normalizarTelefoneBR("(11) 3456-7890").tipo, "fixo")
  assert.equal(normalizarTelefoneBR("(11) 3456-7890").e164, "551134567890")
  assert.equal(normalizarTelefoneBR("(21) 8765-4321").e164, "5521987654321")
  assert.equal(normalizarTelefoneBR("019 99123-4567").e164, "5519991234567")
  assert.equal(normalizarTelefoneBR("0 21 19 99123-4567").e164, "5519991234567")
  assert.equal(normalizarTelefoneBR("0800 123 4567").tipo, "invalido")
  assert.equal(normalizarTelefoneBR("1234").tipo, "invalido")
  assert.equal(normalizarTelefoneBR(undefined).tipo, "invalido")
})

test("site: vazio, rede social e site próprio", () => {
  assert.equal(classificarSite(""), "sem_site")
  assert.equal(classificarSite(undefined), "sem_site")
  assert.equal(classificarSite("https://www.instagram.com/barbearia"), "so_rede_social")
  assert.equal(classificarSite("http://m.facebook.com/x"), "so_rede_social")
  assert.equal(classificarSite("https://wa.me/5519999999999"), "so_rede_social")
  assert.equal(classificarSite("barbeariadoze.com.br"), "tem_site")
  assert.equal(classificarSite("https://instagram.com.meusite.com"), "tem_site")
})

const placeBase = {
  id: "abc",
  displayName: { text: "Barbearia do Zé" },
  formattedAddress: "Rua A, 10 - Centro, Campinas - SP",
  internationalPhoneNumber: "+55 19 99123-4567",
  rating: 4.8,
  userRatingCount: 132,
  googleMapsUri: "https://maps.google.com/?cid=1",
  businessStatus: "OPERATIONAL",
}

test("placeParaLead filtra quem tem site, sem telefone ou fechado", () => {
  const lead = placeParaLead(placeBase, { nicho: "barbearia", cidade: "Campinas, SP" })
  assert.equal(lead.whatsapp, "5519991234567")
  assert.equal(lead.telefone, "(19) 99123-4567")
  assert.equal(lead.situacaoSite, "sem_site")
  assert.equal(placeParaLead({ ...placeBase, websiteUri: "https://ze.com.br" }, {}), null)
  assert.equal(placeParaLead({ ...placeBase, internationalPhoneNumber: undefined }, {}), null)
  assert.equal(placeParaLead({ ...placeBase, businessStatus: "CLOSED_PERMANENTLY" }, {}), null)
  assert.equal(placeParaLead({ ...placeBase, websiteUri: "https://instagram.com/ze" }, {}).situacaoSite, "so_rede_social")
})

test("mensagens são preenchidas sem sobrar {chaves}", () => {
  const lead = placeParaLead(placeBase, { nicho: "barbearia", cidade: "Campinas, SP" })
  const m = mensagensDoLead(lead, config)
  assert.match(m.inicial, /Barbearia do Zé/)
  assert.match(m.inicial, /4,8 com 132 avaliações/)
  assert.doesNotMatch(m.inicial + m.followup, /\{\w+\}/)
  assert.deepEqual(mensagensDoLead(lead, config), m, "variante estável por lead")
  const conhecidas = new Set(["empresa", "nicho", "cidade", "avaliacao", "rede", "seuNome", "portfolio", "oferta"])
  for (const grupo of ["sem_site", "so_rede_social", "followup"])
    for (const t of config.mensagens[grupo])
      for (const [, k] of t.matchAll(/\{(\w+)\}/g)) assert.ok(conhecidas.has(k), `variável desconhecida {${k}}`)
})

test("mesclarLeads não duplica por id nem por número", () => {
  const a = { id: "google:1", whatsapp: "5519991234567", nome: "A" }
  const b = { id: "csv:5519991234567", whatsapp: "5519991234567", nome: "A (csv)" }
  const c = { id: "google:2", whatsapp: "5519990000000", nome: "C" }
  const r1 = mesclarLeads([], [a], "t0")
  const r2 = mesclarLeads(r1.leads, [{ ...a, nome: "A2" }, b, c], "t1")
  assert.equal(r2.adicionados, 1)
  assert.equal(r2.leads.length, 2)
  assert.equal(r2.leads.find((l) => l.id === "google:1").nome, "A2")
  assert.equal(r2.leads.find((l) => l.id === "google:1").criadoEm, "t0")
})

test("CSV com ; e aspas", () => {
  const rows = lerCSV('nome;telefone;site\n"Pet, Shop";(19) 99876-5432;\nLoja X;11 3333-4444;https://x.com.br\n')
  assert.equal(rows.length, 2)
  assert.equal(rows[0].nome, "Pet, Shop")
  assert.equal(linhaCSVParaLead(rows[0]).whatsapp, "5519998765432")
  assert.equal(linhaCSVParaLead(rows[1]), null)
})

test("buscarGoogle pagina e envia a chave", async () => {
  const chamadas = []
  const fetchImpl = async (url, opts) => {
    chamadas.push(JSON.parse(opts.body))
    assert.equal(opts.headers["X-Goog-Api-Key"], "K")
    const pagina = chamadas.length
    return {
      ok: true,
      json: async () => ({
        places: Array.from({ length: 20 }, (_, i) => ({ id: `${pagina}-${i}` })),
        nextPageToken: pagina < 3 ? `t${pagina}` : undefined,
      }),
    }
  }
  const places = await buscarGoogle({ chave: "K", consulta: "x", max: 45, fetchImpl, esperar: async () => {} })
  assert.equal(places.length, 45)
  assert.equal(chamadas[1].pageToken, "t1")

  const erro = async () => ({ ok: false, status: 403, json: async () => ({ error: { message: "API key not valid" } }) })
  await assert.rejects(buscarGoogle({ chave: "K", consulta: "x", fetchImpl: erro }), /API key not valid/)
})
