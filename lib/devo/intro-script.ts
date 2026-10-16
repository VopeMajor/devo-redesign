import type { Expression } from './npcs'

/** Ilustração exibida ao lado da fala para explicar o sistema citado. */
export type TutorialVisual =
  | 'wrist'
  | 'device'
  | 'cards'
  | 'rooms'
  | 'slot'
  | 'clock'
  | 'hidden'
  | 'chat'
  | 'accept'
  | 'reveal'
  | 'lost'
  | 'messages'

export type DialogueLine = {
  speaker: string
  expression: Expression
  text: string
  /** Nome do sistema apresentado nesta fala, exibido como selo. */
  unlock?: string
  /** Etapa numerada do tutorial, como no documento ("1. Escolha uma sala"). */
  step?: string
  visual?: TutorialVisual
}

export const INTRO_SCRIPT: DialogueLine[] = [
  { speaker: 'herdeiro', expression: 'neutro', text: 'Então você finalmente acordou, {nome}. Sim, eu sei o seu nome. Não espere que eu repita nada. Preste atenção.' },
  { speaker: 'herdeiro', expression: 'neutro', visual: 'wrist', unlock: 'Pulso', text: 'Olhe para o seu pulso. Esses números não são decoração. É o seu tempo. Quando chegar a zero, você morre.' },
  { speaker: 'herdeiro', expression: 'malicia', visual: 'wrist', text: 'A única forma de ganhar horas é jogando. E vencendo. Simples, até para alguém como você.' },
  { speaker: 'herdeiro', expression: 'confiante', visual: 'device', text: 'Este aparelho é o DEVO. Um sistema dentro do sistema. Tudo que importa aqui passa por ele.' },
  { speaker: 'herdeiro', expression: 'neutro', visual: 'cards', unlock: 'Cartas', text: 'Em Cartas você guarda o que possui. Ferramentas, armas… ou moeda de troca.' },
  { speaker: 'herdeiro', expression: 'entediado', text: 'Quanto às trocas… não vou perder meu tempo explicando o óbvio. O Rato adora o som da própria voz.' },

  { speaker: 'rato', expression: 'convite', unlock: 'Sala de Trocas', text: 'Que maravilha, não acha? Você entrega aquilo que possui, recebe algo que não conhece e, por alguns instantes, acredita que fez um excelente negócio!' },
  { speaker: 'rato', expression: 'malicia', text: 'Existe apenas um pequeno detalhe… você não sabe o que está recebendo. Interessante, não? Então sente-se, {nome}. O Rato explica.' },
  { speaker: 'rato', expression: 'apresenta', step: '1. Escolha uma sala', visual: 'rooms', text: 'Primeiro, procure uma sala de troca disponível. Duas negociações no mesmo lugar seria uma tremenda confusão. Escolha uma sala livre e entre. Simples assim.' },
  { speaker: 'rato', expression: 'sorriso', step: '2. Coloque sua carta', visual: 'slot', text: 'Dentro da sala há dois espaços. Um deles é o SEU ESPAÇO. Coloque nele a carta que deseja oferecer. E você não poderá escolher o que o outro vai colocar.' },
  { speaker: 'rato', expression: 'trama', step: '3. A oferta misteriosa', visual: 'clock', text: 'Agora espere. Alguém vai entrar do outro lado da mesa. A carta dele terá a mesma raridade que a sua. Fora isso… surpresa.' },
  { speaker: 'rato', expression: 'desdem', visual: 'hidden', text: 'Você não saberá qual carta foi oferecida. Ele também não saberá a sua. Onde estaria a graça se todos soubessem o que estão recebendo?' },
  { speaker: 'rato', expression: 'segredo', visual: 'chat', text: 'Enquanto isso, usem o chat da sala para negociar, convencer… ou mentir. Uma dica do Rato: não confie muito em promessas.' },
  { speaker: 'rato', expression: 'confiante', step: '4. Aceite… se tiver coragem!', visual: 'accept', text: 'Depois de conversarem, os dois decidem. Se ambos aceitarem, as cartas são finalmente reveladas.' },
  { speaker: 'rato', expression: 'surpreso', visual: 'reveal', text: 'E então… KABUM! Uma troca confirmada não pode ser desfeita. As cartas vão direto para os inventários. Sem devoluções.' },
  { speaker: 'rato', expression: 'pensativo', visual: 'lost', text: 'Quer recuperar sua carta? Pode tentar! Mas nada garante que encontrará o mesmo jogador. Ela pode estar em qualquer lugar… nas mãos de qualquer pessoa.' },

  { speaker: 'herdeiro', expression: 'neutro', visual: 'messages', unlock: 'Mensagens', text: 'Em Mensagens, os NPCs respondem ao que você escolher perguntar. Escolha bem. Uma pergunta feita não pode ser desfeita.' },
  { speaker: 'herdeiro', expression: 'malicia', text: 'Agora vá. Tente não morrer antes de ser útil, {nome}.' },
]

export const INTRO_SPEAKERS = Array.from(new Set(INTRO_SCRIPT.map((l) => l.speaker)))
