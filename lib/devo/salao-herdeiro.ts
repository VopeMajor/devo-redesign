/**
 * Apresentação do Salão das Máscaras pelo Herdeiro (o "maestro", DIRECAO-3 §1b) e o texto de sistema
 * "Anunciar no Salão das Máscaras". Texto LITERAL do dono (docs/redesign/DIALOGOS-galo-salao.md), só com a
 * formatação adaptada: o travessão de fala vira a placa do falante, os colchetes do sistema viram a caixa do
 * sistema, `**negrito**` continua marcado (a cena destaca). Cada fala do Herdeiro escolhe uma expressão do
 * elenco OC (lib/devo/npcs.ts) e, quando cita algo da tela, um `foco` que a cena ilumina.
 *
 * Mesmo formato de nós da cena do Poço (lib/devo/poco-neblina.ts), para migrar ao motor de diálogo da Narrativa.
 * Concordância de gênero: marcador `{masculino|feminino}` resolvido por `playerText` antes de exibir.
 */
import type { Expressao } from './npcs'
import { playerText } from './player-name'

export type SalaoFoco = 'contador' | 'leiloes' | 'bandeja' | 'mercado' | 'anuncios'

export type HerdeiroFala = { id: string; texto: string; pose: Expressao; foco?: SalaoFoco }

export const HERDEIRO_APRESENTACAO: HerdeiroFala[] = [
  { id: 'h01', texto: 'Hm? É você?', pose: 'surpreso' },
  { id: 'h02', texto: 'Pelo visto, sobreviveu tempo o bastante para chegar até aqui...', pose: 'desdem' },
  { id: 'h03', texto: 'Isso é uma surpresa.', pose: 'entediado' },
  { id: 'h04', texto: 'Um ativo de baixo rendimento como você... Foi sorte? Ou será que usou algum método interessante?', pose: 'malicia' },
  { id: 'h05', texto: 'Bem. Sorte ou não, já não importa. Uma vez que chegou até aqui, vou lhe dar alguns conselhos. Só desta vez.', pose: 'confiante' },
  { id: 'h06', texto: 'Este é o **Salão das Máscaras**.', pose: 'sorriso' },
  { id: 'h07', texto: 'Diferentemente de todas as outras funcionalidades do Devo que você já conheceu, é aqui que reside o verdadeiro potencial deste lugar!', pose: 'riso' },
  { id: 'h08', texto: 'O salão funciona como uma espécie de ponto de encontro para os diversos mercados do nosso submundo. Isso sem falar no entretenimento, é claro.', pose: 'confiante' },
  { id: 'h09', texto: 'Aqui, você pode comprar cartas de outros jogadores, vender as suas próprias e até descobrir propostas anunciadas por outros pagantes.', pose: 'malicia', foco: 'mercado' },
  { id: 'h10', texto: 'Há de tudo um pouco. Até para mim, é difícil enumerar tantas possibilidades!', pose: 'riso', foco: 'anuncios' },
  { id: 'h11', texto: 'Em suma... O Salão das Máscaras é uma atração bastante conhecida, disponível uma vez a cada três dias. E aquele número enorme bem ali? Ele representa a contagem até a próxima abertura.', pose: 'sorriso', foco: 'contador' },
  { id: 'h12', texto: 'Mas não se deixe enganar.', pose: 'trama' },
  { id: 'h13', texto: 'Embora existam outras atividades, os leilões continuam sendo a principal atração. Os itens que você deseja colocar à venda podem ser enviados para a aba chamada **Bandeja**, por meio do seu Shuffler. Depois disso, ficam à espera da avaliação de um especialista.', pose: 'confiante', foco: 'bandeja' },
  { id: 'h14', texto: 'Naturalmente, as cartas precisam atender a um requisito mínimo de raridade. E, como praticamente tudo por aqui, as transações são realizadas usando Tempo.', pose: 'entediado' },
  { id: 'h15', texto: 'Caso seus itens sejam aprovados para o leilão, eles serão recolhidos automaticamente e incluídos na próxima edição, desde que ainda existam vagas disponíveis.', pose: 'neutro', foco: 'leiloes' },
  { id: 'h16', texto: 'E, se algum idiota decidir comprá-los, sua parte será transferida para você logo em seguida.', pose: 'desdem' },
  { id: 'h17', texto: 'Quanto às taxas? Bem, elas variam de acordo com o seu tipo de contrato. Se conseguir prosperar por aqui, os custos certamente diminuirão.', pose: 'malicia' },
  { id: 'h18', texto: 'Agora vá. Faça volume nesta plateia... Mas nunca se esqueça: o único maestro sou eu.', pose: 'trama' },
]

/** Expressões que a cena usa (pré-carregadas e trocadas por opacidade). */
export const HERDEIRO_POSES: Expressao[] = Array.from(new Set(HERDEIRO_APRESENTACAO.map((f) => f.pose)))

/** "Anunciar no Salão das Máscaras" — texto de sistema (colchetes do original viram a caixa do sistema). */
export const AVISO_ANUNCIAR: string[] = [
  'Uma vez a cada três dias, o Salão das Máscaras entra em atividade regular.',
  'Você pode aproveitar os intervalos entre esses dias para enviar os itens que deseja colocar em leilão.',
  'A maioria dos itens — exceto as propagandas — não exige um custo inicial além da taxa de divulgação.',
  'Fique atent{o|a} aos eventos especiais do leilão!',
  'Eventos quinzenais e especiais oferecem oportunidades de obter cartas comemorativas, essências de afinidade raras e fragmentos arcanos, assistir a peças de teatro e muito mais.',
  'Consulte as datas disponíveis no Calendário Devo.',
]

/** Resolve o marcador de gênero e o nome (helper comum de lib/devo/player-name.ts). */
export function salaoTexto(texto: string, genero: string | null | undefined, nome?: string | null) {
  return playerText(texto, { gender: genero, name: nome })
}

/** Texto sem as marcas de negrito (para a máquina de escrever contar caracteres). */
export const semMarcas = (t: string) => t.replace(/\*\*/g, '')

/**
 * Quebra um texto com `**negrito**` em trechos e corta no caractere `ate` (contado sem as marcas):
 * a cena escreve letra a letra mantendo o destaque.
 */
export function trechos(texto: string, ate = Infinity): { t: string; forte: boolean }[] {
  const partes = texto.split('**')
  const out: { t: string; forte: boolean }[] = []
  let resto = ate
  for (let i = 0; i < partes.length && resto > 0; i++) {
    const p = partes[i]
    if (!p) continue
    const t = p.slice(0, resto)
    resto -= t.length
    out.push({ t, forte: i % 2 === 1 })
  }
  return out
}
