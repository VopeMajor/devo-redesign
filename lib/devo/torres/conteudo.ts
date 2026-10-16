/**
 * Leitura e validação do conteúdo das Torres (puro: roda no servidor, no teste e no cliente).
 * O arquivo padrão é `conteudo.json`; o Owner pode substituir tudo gravando `torres.conteudo` em devo_config
 * (POST /api/staff {action:'config.definir', key:'torres.conteudo', value:{…}}). Guia: docs/redesign/TORRES.md.
 */
import padrao from './conteudo.json'
import { ARTES, type ConteudoTorres, EFEITOS, MAX_ANDARES, MIN_ANDARES, type Passo, type TorreDef } from './tipos'

export const CONTEUDO_PADRAO = padrao as unknown as ConteudoTorres

const ID_RE = /^[a-z0-9][a-z0-9-]{1,40}$/
const ITEM_RE = /^[a-z0-9_]+(:[a-z0-9_-]+)?$/

function validarCena(cena: unknown, onde: string, erros: string[]) {
  if (cena === undefined) return
  if (!Array.isArray(cena)) {
    erros.push(`${onde}: "cena" precisa ser uma lista de passos.`)
    return
  }
  cena.forEach((p: Passo, i) => {
    const at = `${onde} › passo ${i + 1}`
    if (!p || typeof p !== 'object') return erros.push(`${at}: passo vazio.`)
    switch (p.tipo) {
      case 'fala':
      case 'jogador':
      case 'narra':
      case 'sistema':
        if (typeof p.texto !== 'string' || !p.texto.trim()) erros.push(`${at}: "texto" vazio.`)
        break
      case 'bloco':
        if (typeof p.titulo !== 'string' || !Array.isArray(p.texto)) erros.push(`${at}: bloco precisa de "titulo" e "texto" (lista).`)
        break
      case 'escolha':
        if (!Array.isArray(p.opcoes) || p.opcoes.length < 1) erros.push(`${at}: escolha sem "opcoes".`)
        else
          p.opcoes.forEach((o, j) => {
            if (typeof o?.texto !== 'string' || !o.texto.trim()) erros.push(`${at} › opção ${j + 1}: "texto" vazio.`)
            if (o?.efeito && !(EFEITOS as readonly string[]).includes(o.efeito)) erros.push(`${at} › opção ${j + 1}: efeito desconhecido "${o.efeito}".`)
            validarCena(o?.resposta, `${at} › opção ${j + 1}`, erros)
          })
        break
      default:
        erros.push(`${at}: tipo desconhecido "${(p as { tipo?: string }).tipo}" (use fala, jogador, narra, sistema, bloco ou escolha).`)
    }
  })
}

/** Valida o conteúdo. Devolve a lista de erros (vazia = ok), em português, apontando onde corrigir. */
export function errosDoConteudo(raw: unknown): string[] {
  const erros: string[] = []
  const c = raw as ConteudoTorres
  if (!c || typeof c !== 'object' || !Array.isArray(c.torres)) return ['O conteúdo precisa ter a lista "torres".']
  const ids = new Set<string>()
  let principais = 0
  c.torres.forEach((t: TorreDef, i) => {
    const onde = `Torre ${i + 1} (${t?.id ?? 'sem id'})`
    if (!t || typeof t !== 'object') return erros.push(`${onde}: vazia.`)
    if (!ID_RE.test(t.id ?? '')) erros.push(`${onde}: "id" precisa ser minúsculo, sem espaços (ex.: "torre-da-coruja").`)
    if (ids.has(t.id)) erros.push(`${onde}: id repetido.`)
    ids.add(t.id)
    if (t.tipo === 'principal') principais++
    else if (t.tipo !== 'secundaria') erros.push(`${onde}: "tipo" deve ser "principal" ou "secundaria".`)
    if (!t.nome) erros.push(`${onde}: falta "nome".`)
    if (!t.npc?.id || !t.npc?.nome) erros.push(`${onde}: "npc" precisa de "id" e "nome".`)
    if (!t.essencia?.item || !ITEM_RE.test(t.essencia.item) || !t.essencia.item.startsWith('essencia:')) erros.push(`${onde}: "essencia.item" deve ser "essencia:<npc>".`)
    if (!(Number(t.custoBase) >= 1)) erros.push(`${onde}: "custoBase" deve ser 1 ou mais.`)
    if (!(ARTES as readonly string[]).includes(t.arte)) erros.push(`${onde}: "arte" deve ser uma de: ${ARTES.join(', ')}.`)
    if (!t.mapa || !(t.mapa.x >= 0 && t.mapa.x <= 100 && t.mapa.y >= 0 && t.mapa.y <= 100)) erros.push(`${onde}: "mapa" precisa de x e y entre 0 e 100.`)
    if (t.ilustracao) {
      const il = t.ilustracao
      if (typeof il.arquivo !== 'string' || !il.arquivo.startsWith('/')) erros.push(`${onde}: "ilustracao.arquivo" deve começar com "/" (sem o sufixo --<largura>.webp).`)
      if (!Array.isArray(il.larguras) || !il.larguras.length || il.larguras.some((w) => !(Number(w) > 0))) erros.push(`${onde}: "ilustracao.larguras" deve listar as larguras dos arquivos (ex.: [256, 512, 1024]).`)
      if (!(Number(il.aspecto) > 0) || !(Number(il.altura) > 0)) erros.push(`${onde}: "ilustracao" precisa de "aspecto" (largura ÷ altura) e "altura" > 0.`)
    }
    if (!Array.isArray(t.andares) || t.andares.length < MIN_ANDARES || t.andares.length > MAX_ANDARES)
      erros.push(`${onde}: uma torre tem de ${MIN_ANDARES} a ${MAX_ANDARES} andares.`)
    t.andares?.forEach((a, j) => {
      const at = `${onde} › andar ${j + 1}`
      if (!a?.titulo) erros.push(`${at}: falta "titulo".`)
      a?.requisitos?.chaves?.forEach((k) => {
        if (!k?.torre || !(Number(k.quantidade) >= 1)) erros.push(`${at}: requisito de chave precisa de "torre" e "quantidade" ≥ 1.`)
      })
      a?.recompensas?.itens?.forEach((it) => {
        if (!ITEM_RE.test(it?.item ?? '') || !(Number(it.quantidade) >= 1)) erros.push(`${at}: recompensa inválida (${it?.item}).`)
      })
      validarCena(a?.cena, at, erros)
    })
  })
  if (principais !== 1) erros.push(`Deve haver exatamente 1 torre principal (há ${principais}).`)
  // chaves pedidas precisam ser de torres que existem
  c.torres.forEach((t) =>
    t.andares?.forEach((a, j) =>
      a?.requisitos?.chaves?.forEach((k) => {
        if (k?.torre && !ids.has(k.torre)) erros.push(`${t.id} › andar ${j + 1}: pede chave da torre "${k.torre}", que não existe.`)
      }),
    ),
  )
  return erros
}

/** Escolhe o conteúdo em vigor: o do Owner (se válido) ou o arquivo. */
export function conteudoEmVigor(override: unknown): { conteudo: ConteudoTorres; fonte: 'arquivo' | 'owner'; erros: string[] } {
  if (override) {
    const erros = errosDoConteudo(override)
    if (!erros.length) return { conteudo: override as ConteudoTorres, fonte: 'owner', erros }
    return { conteudo: CONTEUDO_PADRAO, fonte: 'arquivo', erros }
  }
  return { conteudo: CONTEUDO_PADRAO, fonte: 'arquivo', erros: [] }
}
