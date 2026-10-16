/**
 * ELENCO — sprites OC do dono (folhas 4×3 em docs/redesign/refs/npc-oc/), fatiados por
 * `scripts/dev/fatiar-npcs.py` em public/images/npc/<id>/<expressao>.webp.
 *
 * Todos os sprites têm a MESMA tela (1080×960, alfa), a mesma altura de cabeça e o queixo na mesma linha;
 * dentro de um NPC, o tronco fica parado entre expressões. Por isso o enquadramento é comum a todo o elenco
 * (só se ajusta por NPC quando o rosto não fica no centro do tronco).
 */

/** Vocabulário único de expressões (o mesmo do script de fatiamento). */
export const EXPRESSOES = [
  'neutro', 'sorriso', 'riso', 'malicia', 'piscadela', 'confiante', 'convite', 'apresenta', 'explica',
  'pensativo', 'entediado', 'desdem', 'serio', 'sombrio', 'trama', 'segredo', 'timido', 'animado',
  'surpreso', 'preocupado', 'triste', 'irritado', 'furioso',
] as const
export type Expressao = (typeof EXPRESSOES)[number]
/** Nome antigo mantido para os roteiros que já importam `Expression`. */
export type Expression = Expressao

/**
 * Um retrato e o seu enquadramento no `PortraitFrame` do kit.
 * `position` = object-position (onde está o rosto); `scale` = zoom do busto (moldura em arco);
 * `faceScale` = zoom para medalhões/avatares redondos (o kit amplia a partir de 50% 20%).
 */
export type PortraitArt = { src: string; position?: string; scale?: number; faceScale?: number }

type Elenco = {
  /** Expressão de repouso (usada quando nenhuma é pedida ou a pedida não existe). */
  padrao: Expressao
  /** Célula da folha (0–11, ordem de leitura) → expressão. Registro do mapa; o arquivo é `<expressao>.webp`. */
  celulas: readonly Expressao[]
  /** Centro horizontal do rosto na tela, se não for o do tronco (medalhão redondo). */
  rostoX?: string
  /** Sprite ainda não entregue pelo dono: usa a silhueta de reserva. */
  pendente?: boolean
}

/**
 * MAPA ÚNICO DE RETRATOS por NPC e expressão. As telas leem tudo por `npcPortrait()` /
 * `portraitFrameProps()`; trocar um sprite é rodar o script de novo, sem mexer nas telas.
 * O mapa célula → expressão é o mesmo de `scripts/dev/fatiar-npcs.py` (e de cada manifest.json).
 */
export const ELENCO = {
  melissa: {
    padrao: 'confiante',
    celulas: ['convite', 'explica', 'riso', 'preocupado', 'pensativo', 'timido', 'confiante', 'surpreso', 'animado', 'apresenta', 'triste', 'sorriso'],
  },
  galo: {
    padrao: 'neutro',
    celulas: ['neutro', 'malicia', 'riso', 'desdem', 'irritado', 'surpreso', 'timido', 'sorriso', 'sombrio', 'piscadela', 'entediado', 'confiante'],
  },
  herdeiro: {
    padrao: 'neutro',
    celulas: ['neutro', 'malicia', 'confiante', 'riso', 'irritado', 'furioso', 'entediado', 'desdem', 'sorriso', 'surpreso', 'timido', 'trama'],
  },
  javali: {
    padrao: 'neutro',
    celulas: ['neutro', 'convite', 'trama', 'riso', 'pensativo', 'desdem', 'entediado', 'explica', 'furioso', 'surpreso', 'timido', 'sombrio'],
  },
  rato: {
    padrao: 'sorriso',
    celulas: ['convite', 'malicia', 'desdem', 'surpreso', 'trama', 'pensativo', 'apresenta', 'triste', 'confiante', 'segredo', 'sorriso', 'irritado'],
  },
  coruja: {
    padrao: 'neutro',
    celulas: ['neutro', 'sorriso', 'piscadela', 'riso', 'desdem', 'preocupado', 'surpreso', 'serio', 'irritado', 'triste', 'timido', 'malicia'],
  },
  /** PENDENTE: o dono ainda não enviou a folha do Corvo. Silhueta encapuzada até lá. */
  corvo: { padrao: 'neutro', celulas: [], pendente: true },
} satisfies Record<string, Elenco>

export type PortraitNpc = keyof typeof ELENCO
/** Nome antigo do mapa (outras áreas ainda podem importá-lo). */
export const NPC_PORTRAITS = ELENCO

/** Enquadramento comum (sprites normalizados): busto inteiro no arco; rosto a partir de 50% 20%. */
const BUSTO = { position: '50% 0%', scale: 1 }
const ROSTO_ESCALA = 2

function elenco(npc: string): Elenco | null {
  return (ELENCO as Record<string, Elenco>)[npc] ?? null
}

/** Expressões disponíveis de um NPC (vazio se não tem retrato). */
export function npcExpressoes(npc: string): Expressao[] {
  const e = elenco(npc)
  if (!e) return []
  return e.pendente ? [e.padrao] : [...e.celulas]
}

/** Resolve a expressão pedida para uma que o NPC tem (cai para a de repouso). */
export function resolveExpressao(npc: string, pose?: string): Expressao {
  const e = elenco(npc)
  if (!e) return 'neutro'
  return pose && !e.pendente && (e.celulas as readonly string[]).includes(pose) ? (pose as Expressao) : e.padrao
}

/** Retrato de um NPC numa expressão; cai para a expressão de repouso se a pedida não existir. */
export function npcPortrait(npc: string, pose?: string): PortraitArt | null {
  const e = elenco(npc)
  if (!e) return null
  const src = e.pendente ? `/images/npc/${npc}/silhueta.svg` : `/images/npc/${npc}/${resolveExpressao(npc, pose)}.webp`
  return { src, position: BUSTO.position, scale: BUSTO.scale, faceScale: ROSTO_ESCALA }
}

/** Props prontas para o `PortraitFrame` (fundo de moldura desligado: PNG transparente normal). */
export function portraitFrameProps(npc: string, pose?: string, crop: 'bust' | 'face' = 'bust') {
  const e = elenco(npc)
  const art = npcPortrait(npc, pose)
  if (!e || !art) return null
  const position = crop === 'face' && e.rostoX ? `${e.rostoX} 0%` : (art.position ?? '50% 0%')
  return { src: art.src, position, scale: crop === 'face' ? (art.faceScale ?? ROSTO_ESCALA) : (art.scale ?? 1), backdrop: false }
}

/** Nome e papel de cada membro do elenco (rótulos acessíveis). */
export const ELENCO_INFO: Record<PortraitNpc, { name: string; title: string }> = {
  melissa: { name: 'Melissa', title: 'Companhia de Despertados' },
  galo: { name: 'O Galo', title: 'Anfitrião do Arcano do Imperador' },
  herdeiro: { name: 'O Herdeiro', title: 'Herdeiro Absoluto' },
  javali: { name: 'Javali', title: 'Anfitrião da Sala de Jogos' },
  rato: { name: 'O Rato', title: 'Anfitrião' },
  coruja: { name: 'Coruja', title: 'Guardiã das Cartas' },
  corvo: { name: 'O Corvo', title: 'Anfitrião' },
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
  /** 'cutout' para sprites recortados (todo o elenco OC); 'blend' para quem não tem retrato. */
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
    choices: [
      {
        id: 'regras',
        prompt: 'Quais são as regras daqui?',
        reply: ['Hihihi! Simples, querid{o|a} {nome}: o tempo é a vida, e o jogo é a única fonte dela.', 'O resto você descobre perdendo.'],
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
    portraitStyle: 'cutout',
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
