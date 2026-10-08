import type { ComponentType } from 'react'
import { HerdeiroArt } from '@/components/devo/npc-art/herdeiro'

export type Expression = 'neutral' | 'smirk'

/** Retrato desenhado no projeto (SVG como componente React), no lugar de uma imagem. */
export type NpcArtProps = { expression?: Expression; crop?: 'face'; className?: string; title?: string }

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
  portraits: Partial<Record<Expression, string>>
  /** Arte original em SVG (tem prioridade sobre `portraits`). */
  art?: ComponentType<NpcArtProps>
  /** Expressões que a arte sabe desenhar. */
  artExpressions?: Expression[]
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
    portraits: {},
    art: HerdeiroArt,
    artExpressions: ['neutral', 'smirk'],
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
    portraits: { neutral: '/images/npc/rat-host-v2.png' },
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
    portraits: { neutral: '/images/npc/coruja/warai.webp' },
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
    portraits: {},
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
