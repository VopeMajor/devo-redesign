export type Expression = 'neutral' | 'smirk'

/**
 * Um retrato e o seu enquadramento no `PortraitFrame` do kit.
 * `position` = object-position (onde está o rosto); `scale` = zoom do busto (moldura em arco);
 * `faceScale` = zoom para medalhões/avatares redondos (o kit amplia a partir de 50% 20%).
 */
export type PortraitArt = { src: string; position?: string; scale?: number; faceScale?: number }

/**
 * MAPA ÚNICO DE RETRATOS por NPC e expressão/pose. Para trocar o elenco (ex.: pelos OCs do dono),
 * troque só os caminhos e o enquadramento aqui; as telas leem tudo por `npcPortrait()`.
 *
 * Sprites atuais são TEMPORÁRIOS (de outros jogos), mantidos a pedido do dono até os OCs
 * (docs/redesign/DIRECAO-2.md › 1).
 */
export const NPC_PORTRAITS = {
  melissa: {
    neutral: { src: '/images/npc/melissa-neutral.png', position: '70% 0%', scale: 1.4, faceScale: 2 },
    soft: { src: '/images/npc/melissa-soft.png', position: '50% 0%', scale: 1, faceScale: 1.6 },
    serious: { src: '/images/npc/melissa-serious.png', position: '50% 0%', scale: 1, faceScale: 1.6 },
  },
  herdeiro: {
    neutral: { src: '/images/npc/heir-v3-neutral.png', position: '50% 0%', scale: 1.15, faceScale: 3 },
    smirk: { src: '/images/npc/heir-v3-smirk.png', position: '50% 0%', scale: 1.15, faceScale: 3 },
  },
  rato: {
    neutral: { src: '/images/npc/rat-host-v2.png', position: '50% 8%', scale: 1, faceScale: 1.15 },
  },
  coruja: {
    neutral: { src: '/images/npc/coruja/warai.webp', position: '50% 12%', scale: 1, faceScale: 1.15 },
  },
  javali: {
    /** Debruçado na mesa (Mesa, medalhão, placas). */
    neutral: { src: '/images/npc/javali.webp', position: '56% 0%', scale: 1, faceScale: 1.5 },
    grin: { src: '/images/npc/javali-grin.webp', position: '56% 0%', scale: 1, faceScale: 1.5 },
    wink: { src: '/images/npc/javali-wink.webp', position: '56% 0%', scale: 1, faceScale: 1.5 },
    tap: { src: '/images/npc/javali-tap.webp', position: '56% 0%', scale: 1, faceScale: 1.5 },
    /** De pé, corpo inteiro. */
    standing: { src: '/images/npc/king-dice.png', position: '50% 0%', scale: 1, faceScale: 2.4 },
    /** Cenas da apresentação da Sala de Jogos (palco largo, não arco). */
    table: { src: '/images/npc/javali-scene-table.webp', position: '50% 40%' },
    door: { src: '/images/npc/javali-scene-door.webp', position: '60% 35%' },
    point: { src: '/images/npc/javali-scene-point.webp', position: '35% 35%' },
  },
} satisfies Record<string, Record<string, PortraitArt>>

export type PortraitNpc = keyof typeof NPC_PORTRAITS
export type PortraitPose<N extends PortraitNpc> = keyof (typeof NPC_PORTRAITS)[N]

/** Retrato de um NPC numa expressão/pose; cai para `neutral` se a pose não existir. */
export function npcPortrait(npc: string, pose = 'neutral'): PortraitArt | null {
  const set = (NPC_PORTRAITS as Record<string, Record<string, PortraitArt>>)[npc]
  if (!set) return null
  return set[pose] ?? set.neutral ?? null
}

/** Props prontas para o `PortraitFrame`: busto (`bust`) ou rosto em medalhão (`face`). */
export function portraitFrameProps(npc: string, pose = 'neutral', crop: 'bust' | 'face' = 'bust') {
  const art = npcPortrait(npc, pose)
  if (!art) return null
  return { src: art.src, position: art.position ?? '50% 0%', scale: crop === 'face' ? (art.faceScale ?? 1.5) : (art.scale ?? 1) }
}

/**
 * Uma escolha de diálogo. Depois de feita, a resposta fica registrada para sempre
 * (até a morte do jogador, quando o estado for reiniciado).
 * `after` libera a escolha somente depois que outra já tiver sido feita.
 */
export type DialogueChoice = {
  id: string
  prompt: string
  /** Linhas iniciadas por `sticker:` são enviadas como figurinha. Vazio = sem resposta. */
  reply: string[]
  after?: string
  /** O jogador envia uma figurinha no lugar do texto. */
  sticker?: string
  /** A escolha não gera mensagem do jogador (ex.: ignorar). */
  silent?: boolean
}

export const STICKER_PREFIX = 'sticker:'
export const stickerSrc = (text: string) => (text.startsWith(STICKER_PREFIX) ? `/images/stickers/${text.slice(STICKER_PREFIX.length)}.png` : null)

export type NpcDef = {
  id: string
  name: string
  title: string
  /** Expressões que o NPC tem no mapa `NPC_PORTRAITS` (vazio = sem retrato). */
  expressions: Expression[]
  /** 'cutout' para PNGs recortados; 'blend' para ilustrações com fundo escuro. */
  portraitStyle: 'cutout' | 'blend'
  choices: DialogueChoice[]
  /** Conversa só aparece na lista depois do primeiro contato. */
  hidden?: boolean
  doneText?: string
}

export const NPCS: Record<string, NpcDef> = {
  herdeiro: {
    id: 'herdeiro',
    name: 'O Herdeiro',
    title: 'Herdeiro Absoluto',
    portraitStyle: 'cutout',
    expressions: ['neutral', 'smirk'],
    choices: [
      {
        id: 'quem',
        prompt: 'Quem é você, afinal?',
        reply: ['Alguém que nasceu para vencer. Você, {nome}, nasceu para assistir.', 'Isso é tudo que precisa saber.'],
      },
      {
        id: 'ajuda',
        prompt: 'Você pode me ajudar a sobreviver?',
        reply: ['Ajudar? Eu não invisto em ativos sem valor.', 'Prove que vale alguma coisa e talvez eu reconsidere.'],
      },
      {
        id: 'troca',
        prompt: 'Alguma dica para a Sala de Trocas?',
        reply: ['Nunca demonstre que quer a carta do outro.', 'Quem parece desesperado já perdeu a negociação antes de ela começar.'],
      },
      {
        id: 'rato',
        prompt: 'O que você sabe sobre o Rato?',
        after: 'quem',
        reply: ['Que ele ri demais para alguém que não tem nada a perder.', 'Desconfie de quem se diverte com as regras que escreve.'],
      },
    ],
  },
  rato: {
    id: 'rato',
    name: 'O Rato',
    title: 'Anfitrião',
    portraitStyle: 'cutout',
    expressions: ['neutral'],
    choices: [
      {
        id: 'regras',
        prompt: 'Quais são as regras daqui?',
        reply: ['Hihihi! Simples, querido {nome}: o tempo é a vida, e o jogo é a única fonte dela.', 'O resto você descobre perdendo.'],
      },
      {
        id: 'sair',
        prompt: 'Como eu saio deste lugar?',
        reply: ['Sair? Que palavra feia!', 'Ninguém sai. Alguns só param de jogar. Hihihi.'],
      },
      {
        id: 'horas',
        prompt: 'Como ganho mais horas?',
        reply: ['Jogando. E vencendo. Só isso.', 'Perder também ensina, mas costuma ser a última lição.'],
      },
      {
        id: 'promessas',
        prompt: 'Posso confiar em você?',
        after: 'regras',
        reply: ['Que pergunta maravilhosa!', 'Não confie muito em promessas. Confie ainda menos em mim!'],
      },
    ],
  },
  coruja: {
    id: 'coruja',
    name: 'Coruja',
    title: 'Guardiã das Cartas',
    portraitStyle: 'blend',
    expressions: ['neutral'],
    hidden: true,
    doneText: 'Não há mais nada aqui.',
    choices: [
      { id: 'figurinha', prompt: 'Figurinha engraçada', sticker: 'engracada', reply: ['Gostei da figurinha.'] },
      { id: 'esqueceu', prompt: 'Que coisa você esqueceu de me avisar?', reply: ['Coleções não são a única forma de agrupar um certo tipo de carta.'] },
      { id: 'ignorar', prompt: 'Ignorar', silent: true, after: 'esqueceu', reply: ['Ei…'] },
      {
        id: 'outra',
        prompt: 'O que é a outra coisa?',
        after: 'esqueceu',
        reply: [
          'Existe algo chamado Arquétipo. Esse é como o grupo maior, do qual uma coleção faz parte.',
          'É como se as Coleções fossem filiais, e o Arquétipo a grande empresa. Eles sim representam a massa das cartas.',
          'Existem poucos Arquétipos no mundo, e não há necessariamente qualquer benefício em ter cartas de um mesmo Arquétipo ou não.',
          'Ainda assim, essa é uma informação que eu não poderia simplesmente ignorar… e já que ela existe…',
        ],
      },
      { id: 'entendi', prompt: 'Entendi', after: 'outra', reply: [] },
      { id: 'exemplo', prompt: 'Algum exemplo?', after: 'outra', reply: ['Contos de Fada, Heróis do Passado ou Mitos Antigos.'] },
      { id: 'escudo', prompt: 'Qual a utilidade de um escudo de papelão…?', after: 'outra', reply: ['sticker:triste'] },
    ],
  },
  desconhecido: {
    id: 'desconhecido',
    name: '???',
    title: 'Remetente desconhecido',
    portraitStyle: 'blend',
    expressions: [],
    choices: [
      {
        id: 'quem',
        prompt: 'Quem está falando?',
        reply: ['Alguém que já esteve onde você está.'],
      },
      {
        id: 'porque',
        prompt: 'Por que eu não deveria confiar no Rato?',
        reply: ['Porque ele escolhe quem entra em cada sala.', 'Sala 07. Não entre.'],
      },
    ],
  },
}

export function getNpc(id: string): NpcDef {
  return NPCS[id] ?? NPCS.desconhecido
}

/** Escolhas ainda disponíveis, respeitando a ordem de liberação. */
export function availableChoices(npc: NpcDef, answered: string[]) {
  return npc.choices.filter((c) => !answered.includes(c.id) && (!c.after || answered.includes(c.after)))
}
