// Funções puras do prospector: telefone, classificação de site, mensagens e CSV.
// Sem dependências — roda com Node 18+.

const REDES_SOCIAIS = [
  "instagram.com",
  "facebook.com",
  "fb.com",
  "linktr.ee",
  "wa.me",
  "whatsapp.com",
  "api.whatsapp.com",
  "tiktok.com",
  "linkedin.com",
  "twitter.com",
  "x.com",
  "youtube.com",
  "ifood.com.br",
  "goo.gl",
  "g.page",
  "business.site",
  "bio.link",
  "beacons.ai",
]

/**
 * Normaliza um telefone brasileiro.
 * Retorna { e164, ddd, numero, tipo } onde tipo é "celular", "fixo" ou "invalido".
 * Só celular costuma ter WhatsApp.
 */
export function normalizarTelefoneBR(raw) {
  let d = String(raw ?? "").replace(/\D/g, "")
  if (d.startsWith("0800") || d.startsWith("0300") || d.startsWith("0500") || d.startsWith("0900")) {
    return { e164: null, ddd: null, numero: d, tipo: "invalido" }
  }
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) d = d.slice(2)
  // 0 + código da operadora + DDD + número (ex: 0 21 19 99123-4567)
  if (d.startsWith("0") && (d.length === 13 || d.length === 14)) d = d.slice(3)
  else if (d.startsWith("0")) d = d.slice(1)

  if (d.length !== 10 && d.length !== 11) return { e164: null, ddd: null, numero: d, tipo: "invalido" }

  const ddd = d.slice(0, 2)
  let numero = d.slice(2)
  if (ddd[0] === "0" || ddd[1] === "0") return { e164: null, ddd: null, numero: d, tipo: "invalido" }

  let tipo = "invalido"
  if (numero.length === 9 && numero[0] === "9") tipo = "celular"
  else if (numero.length === 8 && "2345".includes(numero[0])) tipo = "fixo"
  else if (numero.length === 8 && "6789".includes(numero[0])) {
    // celular antigo, sem o nono dígito
    numero = "9" + numero
    tipo = "celular"
  }
  if (tipo === "invalido") return { e164: null, ddd, numero, tipo }
  return { e164: `55${ddd}${numero}`, ddd, numero, tipo }
}

export function formatarTelefone(tel) {
  if (!tel?.e164) return tel?.numero ?? ""
  const n = tel.numero
  const meio = n.length === 9 ? `${n.slice(0, 5)}-${n.slice(5)}` : `${n.slice(0, 4)}-${n.slice(4)}`
  return `(${tel.ddd}) ${meio}`
}

/** "sem_site", "so_rede_social" ou "tem_site". */
export function classificarSite(url) {
  if (!url || !String(url).trim()) return "sem_site"
  let host
  try {
    host = new URL(String(url).includes("://") ? url : `https://${url}`).hostname.toLowerCase()
  } catch {
    return "sem_site"
  }
  host = host.replace(/^www\./, "").replace(/^m\./, "")
  const rede = REDES_SOCIAIS.some((r) => host === r || host.endsWith(`.${r}`))
  return rede ? "so_rede_social" : "tem_site"
}

/** Troca {chave} pelos valores; chaves desconhecidas ficam vazias. */
export function preencher(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? "").toString())
}

export function linkWhatsApp(e164, texto) {
  return `https://wa.me/${e164}?text=${encodeURIComponent(texto)}`
}

// Escolha estável de variante (o mesmo lead sempre recebe o mesmo texto).
function hash(s) {
  let h = 0
  for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0
  return Math.abs(h)
}

export function escolherVariante(lista, semente) {
  if (!lista?.length) return ""
  return lista[hash(semente) % lista.length]
}

export function varsDoLead(lead, config) {
  const avaliacao =
    lead.nota && lead.avaliacoes
      ? ` (vi que vocês têm nota ${String(lead.nota).replace(".", ",")} com ${lead.avaliacoes} avaliações, parabéns!)`
      : ""
  return {
    empresa: lead.nome,
    nicho: lead.nicho ?? "",
    cidade: (lead.cidade ?? "").split(",")[0].trim(),
    avaliacao,
    rede: lead.site ?? "",
    seuNome: config.seuNome,
    portfolio: config.portfolio,
    oferta: config.oferta,
  }
}

/** Gera { inicial, followup } já preenchidas para o lead. */
export function mensagensDoLead(lead, config) {
  const vars = varsDoLead(lead, config)
  const grupo = lead.situacaoSite === "so_rede_social" ? "so_rede_social" : "sem_site"
  return {
    inicial: preencher(escolherVariante(config.mensagens[grupo], lead.id), vars).trim(),
    followup: preencher(escolherVariante(config.mensagens.followup, lead.id), vars).trim(),
  }
}

/** Converte um resultado da Places API (New) em lead, ou null se não servir. */
export function placeParaLead(place, { nicho, cidade }) {
  if (place.businessStatus && place.businessStatus !== "OPERATIONAL") return null
  const tel = normalizarTelefoneBR(place.internationalPhoneNumber || place.nationalPhoneNumber)
  if (!tel.e164) return null
  const situacaoSite = classificarSite(place.websiteUri)
  if (situacaoSite === "tem_site") return null
  return {
    id: `google:${place.id}`,
    nome: place.displayName?.text ?? "Sem nome",
    nicho,
    cidade,
    categoria: place.primaryTypeDisplayName?.text ?? "",
    endereco: place.formattedAddress ?? "",
    telefone: formatarTelefone(tel),
    whatsapp: tel.e164,
    tipoTelefone: tel.tipo,
    site: place.websiteUri ?? "",
    situacaoSite,
    nota: place.rating ?? null,
    avaliacoes: place.userRatingCount ?? 0,
    maps: place.googleMapsUri ?? "",
    fonte: "google",
  }
}

const CAMPOS_GOOGLE = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.googleMapsUri",
  "places.businessStatus",
  "places.primaryTypeDisplayName",
  "nextPageToken",
].join(",")

/**
 * Busca na Google Places API (New) — Text Search. Até 60 resultados por consulta
 * (3 páginas de 20). Retorna os places crus.
 */
export async function buscarGoogle({ chave, consulta, max = 60, fetchImpl = fetch, esperar = esperarMs }) {
  const places = []
  let pageToken
  do {
    const resp = await fetchImpl("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": chave,
        "X-Goog-FieldMask": CAMPOS_GOOGLE,
      },
      body: JSON.stringify({
        textQuery: consulta,
        languageCode: "pt-BR",
        regionCode: "BR",
        pageSize: 20,
        ...(pageToken ? { pageToken } : {}),
      }),
    })
    const json = await resp.json()
    if (!resp.ok) {
      const msg = json?.error?.message ?? `HTTP ${resp.status}`
      throw new Error(`Google Places recusou a busca: ${msg}`)
    }
    places.push(...(json.places ?? []))
    pageToken = json.nextPageToken
    if (pageToken) await esperar(1500)
  } while (pageToken && places.length < max)
  return places.slice(0, max)
}

function esperarMs(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

/** Junta leads novos aos existentes sem duplicar (por id e por WhatsApp). */
export function mesclarLeads(existentes, novos, agora = new Date().toISOString()) {
  const porId = new Map(existentes.map((l) => [l.id, l]))
  const numeros = new Set(existentes.map((l) => l.whatsapp))
  let adicionados = 0
  for (const n of novos) {
    if (porId.has(n.id)) {
      porId.set(n.id, { ...porId.get(n.id), ...n, criadoEm: porId.get(n.id).criadoEm })
      continue
    }
    if (numeros.has(n.whatsapp)) continue
    porId.set(n.id, { ...n, criadoEm: agora })
    numeros.add(n.whatsapp)
    adicionados++
  }
  return { leads: [...porId.values()], adicionados }
}

// ---------- CSV ----------

export function lerCSV(texto) {
  const linhas = []
  let campo = ""
  let linha = []
  let aspas = false
  const sep = (texto.split("\n")[0].match(/;/g)?.length ?? 0) > (texto.split("\n")[0].match(/,/g)?.length ?? 0) ? ";" : ","
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') {
        campo += '"'
        i++
      } else if (c === '"') aspas = false
      else campo += c
    } else if (c === '"') aspas = true
    else if (c === sep) {
      linha.push(campo)
      campo = ""
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++
      linha.push(campo)
      if (linha.some((v) => v.trim())) linhas.push(linha)
      linha = []
      campo = ""
    } else campo += c
  }
  linha.push(campo)
  if (linha.some((v) => v.trim())) linhas.push(linha)
  if (!linhas.length) return []
  const cab = linhas[0].map((h) => h.trim().toLowerCase())
  return linhas.slice(1).map((l) => Object.fromEntries(cab.map((h, i) => [h, (l[i] ?? "").trim()])))
}

export function paraCSV(linhas, colunas) {
  const esc = (v) => {
    const s = v == null ? "" : String(v)
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [colunas.join(","), ...linhas.map((l) => colunas.map((c) => esc(l[c])).join(","))].join("\n")
}

/** Converte uma linha de CSV importado (nome, telefone, nicho, cidade, endereco, site) em lead. */
export function linhaCSVParaLead(row) {
  const tel = normalizarTelefoneBR(row.telefone || row.whatsapp || row.celular)
  if (!tel.e164 || !row.nome) return null
  const situacaoSite = classificarSite(row.site)
  if (situacaoSite === "tem_site") return null
  return {
    id: `csv:${tel.e164}`,
    nome: row.nome,
    nicho: row.nicho ?? "",
    cidade: row.cidade ?? "",
    categoria: "",
    endereco: row.endereco ?? "",
    telefone: formatarTelefone(tel),
    whatsapp: tel.e164,
    tipoTelefone: tel.tipo,
    site: row.site ?? "",
    situacaoSite,
    nota: null,
    avaliacoes: 0,
    maps: "",
    fonte: "csv",
  }
}
