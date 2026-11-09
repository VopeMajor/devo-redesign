/**
 * Catedral de Damasco (DEVO v2): dados do altar, iguais no cliente e no servidor. Textos literais do Rup
 * (docs/redesign/v2/NOTAS-RUP-02-11.md, item 10).
 */

export type OferendaId = 'arroz' | 'tambor' | 'flauta' | 'mascara'

export const OFERENDAS: { id: OferendaId; nome: string; descricao: string; resultados: [string, number][] }[] = [
  {
    id: 'arroz',
    nome: 'Arroz Branco',
    descricao: 'Arroz fresquinho, ainda dentro do pacote. Despeje-o sobre si mesmo para atrair boa sorte.',
    resultados: [
      ['Nada', 30],
      ['Bênção do Amigo', 40],
      ['Maldição do Alcoólatra', 30],
    ],
  },
  {
    id: 'tambor',
    nome: 'Tambor Antigo',
    descricao: 'Um antigo tambor tribal. Bata nele com força até que se quebre, atraindo energias poderosas.',
    resultados: [
      ['Nada', 30],
      ['Bênção do Guerreiro', 30],
      ['Maldição do Tolo', 40],
    ],
  },
  {
    id: 'flauta',
    nome: 'Flauta de Osso',
    descricao: 'Uma flauta confeccionada com os ossos de alguém. Toque uma melodia de olhos fechados e aguarde para descobrir o que os espíritos reservaram para você.',
    resultados: [
      ['Nada', 30],
      ['Bênção do Artista', 30],
      ['Maldição do Golpista', 40],
    ],
  },
  {
    id: 'mascara',
    nome: 'Máscara Xamã',
    descricao: 'A antiga máscara de madeira de um mestre da feitiçaria. Dance enquanto a utiliza e, antes de quebrá-la, pronuncie seu nome em voz alta para tornar possível o impossível.',
    resultados: [
      ['Nada', 20],
      ['Bênção do Vidente', 40],
      ['Maldição do Charlatão', 40],
    ],
  },
]

export const BENCAOS: Record<string, string> = {
  'Bênção do Amigo': 'Faz com que seu NPC favorito apareça em sua residência durante três dias consecutivos, a partir do seu próximo retorno para casa.',
  'Bênção do Guerreiro': 'Reduz passivamente em 50% a perda de Tempo durante 24 horas.',
  'Bênção do Artista': 'Aumenta em 30% suas chances de sucesso na confecção de cartas durante as próximas 4 horas.',
  'Bênção do Vidente': 'Dobra sua recompensa de Tempo uma única vez no próximo Deadly Vote que você vencer.',
  'Maldição do Alcoólatra': 'Reduz em 5% sua afinidade com o NPC favorito.',
  'Maldição do Tolo': 'Aumenta em 25% a velocidade de perda de Tempo durante as próximas 24 horas.',
  'Maldição do Golpista': 'Aumenta em 30% suas chances de falha na confecção de cartas durante as próximas 5 tentativas.',
  'Maldição do Charlatão': 'Reduz em 30% suas recompensas de Tempo nos próximos três Deadly Votes dos quais participar.',
}

/** Orar: o Rup não deu probabilidades nem valores, e "Créditos" ainda não existe no jogo (fica marcado como pendente). */
export const ORAR: { id: string; nome: string; descricao: string }[] = [
  { id: 'saude', nome: 'A — Desejar por saúde', descricao: 'Possibilidade de receber uma bênção que concede Tempo adicional.' },
  { id: 'estab', nome: 'B — Desejar estabilidade', descricao: 'Possibilidade de receber uma bênção que concede Créditos adicionais.' },
  {
    id: 'rel',
    nome: 'C — Desejar melhores relações',
    descricao: 'Possibilidade de receber Essências de Afinidade correspondentes aos três NPCs com os quais você possui os maiores vínculos.',
  },
]

/** Estoque que quem descobre a Catedral recebe uma vez (PROVISÓRIO: o do protótipo; o Rup não disse a origem). */
export const OFERENDAS_INICIAIS: Record<OferendaId, number> = { arroz: 2, tambor: 1, flauta: 1, mascara: 1 }

export const itemDaOferenda = (id: OferendaId) => `oferenda:${id}`

export type CatedralPayload =
  | { liberado: false; motivo: string }
  | {
      liberado: true
      /** já passou pela primeira visita até o fim (o destino aparece com o nome) */
      descoberta: boolean
      oferendas: Record<OferendaId, number>
      equipe: boolean
    }

export type RitualResultado = { oferenda: OferendaId; resultado: string; restam: number }
