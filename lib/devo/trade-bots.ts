import { CARDS, getCard } from './cards'
import type { PartnerPersonality, TradePartner } from './types'

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)]

const LINES: Record<PartnerPersonality, { opening: string[]; ask: string[]; pressure: string[]; generic: string[]; accept: string[]; leave: string[] }> = {
  cordial: {
    opening: ['Oi. Primeira troca? A minha também, mais ou menos.', 'Boa noite. Vamos tentar fazer isso de forma justa?'],
    ask: ['Sem revelar demais: é uma carta de {type}.', 'Posso dizer que é do tipo {type}. O resto, só no final.'],
    pressure: ['Se você aceitar, eu aceito também. Prometo.', 'Sem pressa. Mas o meu pulso não espera muito.'],
    generic: ['Entendo.', 'Faz sentido.', 'Justo.', 'Também estou com medo, se serve de consolo.'],
    accept: ['Aceitei. Boa sorte para nós dois.'],
    leave: ['Desculpa. Mudei de ideia.'],
  },
  mentiroso: {
    opening: ['Você deu sorte. Minha carta é das boas.', 'Ah, finalmente alguém. Tenho algo que você vai amar.'],
    ask: ['É de {fake}. Confia.', 'Uma carta de {fake}. Das raras dentro da raridade, sabe?'],
    pressure: ['Aceita logo, antes que eu desista.', 'Outro jogador já me ofereceu mais. Decide.'],
    generic: ['Claro, claro.', 'Hahaha. Você é engraçado.', 'Eu juro.', 'Todo mundo diz isso.'],
    accept: ['Pronto, aceitei. Sua vez.'],
    leave: ['Hm. Pensando bem, não.'],
  },
  nervoso: {
    opening: ['O-oi. Isso é seguro? Alguém disse que isso é seguro.', 'Eu só preciso de horas. Por favor, seja honesto.'],
    ask: ['Eu… não sei se posso dizer. Talvez {type}?', 'É… acho que é de {type}. Não lembro direito.'],
    pressure: ['Por favor, aceita. Meu pulso está piscando.', 'Eu não aguento mais esperar.'],
    generic: ['Tá bom… tá bom.', 'Você acha mesmo?', 'Desculpa.', 'Eu ouvi um barulho no corredor.'],
    accept: ['Aceitei! Não me faça me arrepender.'],
    leave: ['Não, não, não. Não consigo. Desculpa.'],
  },
  frio: {
    opening: ['Fale pouco.', 'Não vim conversar.'],
    ask: ['Irrelevante.', 'Você vai saber quando aceitar.'],
    pressure: ['Aceite ou saia.', 'Tempo é vida. Não gaste o meu.'],
    generic: ['Hm.', 'Não.', 'Continue.', '…'],
    accept: ['Aceito.'],
    leave: ['Perda de tempo.'],
  },
}

export function makePartner(): TradePartner {
  const personality = pick<PartnerPersonality>(['cordial', 'mentiroso', 'nervoso', 'frio'])
  const willingChance = { cordial: 0.9, mentiroso: 0.8, nervoso: 0.6, frio: 0.75 }[personality]
  return {
    handle: `Jogador #${String(Math.floor(Math.random() * 9000) + 1000)}`,
    personality,
    willing: Math.random() < willingChance,
  }
}

function fill(line: string, partnerCardId: string) {
  const real = getCard(partnerCardId).type
  const fake = pick(CARDS.map((c) => c.type).filter((t) => t !== real))
  return line.replace('{type}', real).replace('{fake}', fake)
}

export function partnerLine(
  partner: TradePartner,
  partnerCardId: string,
  kind: 'opening' | 'accept' | 'leave',
): string {
  return fill(pick(LINES[partner.personality][kind]), partnerCardId)
}

export function partnerReply(partner: TradePartner, partnerCardId: string, message: string): string {
  const text = message.toLowerCase()
  const pool = LINES[partner.personality]
  if (/(qual|carta|o que|tipo|raridade|mostra|revela)/.test(text)) return fill(pick(pool.ask), partnerCardId)
  if (/(aceit|troca|fecha|confia|agora|logo)/.test(text)) return fill(pick(pool.pressure), partnerCardId)
  return fill(pick(pool.generic), partnerCardId)
}
