/**
 * Introdução à Casa + segunda aparição do Galo + Sistema de Karma / Linha do Destino.
 * Texto LITERAL do dono: docs/redesign/DIALOGOS-casa-galo-poco-melissa-dono.txt (linhas 1–302), na mesma ordem.
 * Só muda a FORMA (DIALOGO.md §2): "[narração]" → `narra` sem colchetes, "— fala" → `fala`/`eu` sem travessão,
 * "pensamento" → `pensa` sem aspas, *Som…* → `som`/deixa sonora no passo marcado, e o gênero do JOGADOR com
 * `{o|a}` (DIRECAO-3 §7: "acordad{o|a}", "burr{o|a}", "sozinh{o|a}").
 *
 * Consequências (servidor, uma vez só — dialog_events):
 * - "Galo...?" → o Galo transfere Tempo: 60 min (config `narrativa.galo_casa.tempo_min`, PROVISÓRIA, Owner edita).
 * - "Agradeço." (contato do Galo) → Karma +1 (ordem; gratidão). Pequeno, invisível como número.
 * - Contato do Galo em Mensagens ao fim da conversa.
 */
import { eu, escolha, efeito, fala, narra, opcao, pensa, sistema, som } from '../autor'
import type { Cena } from '../formato'

const galo = (texto: string, expressao?: string, extra: Parameters<typeof fala>[2] = {}) => fala('galo', texto, { expressao, ...extra })
/** Antes de o jogador acertar o nome, a placa diz só "Anfitrião". */
const anfitriao = (texto: string, expressao?: string, extra: Parameters<typeof fala>[2] = {}) => galo(texto, expressao, { nome: 'Anfitrião', ...extra })
/** Resposta dada com o Galo de volta à cena (ele estava na cozinha). */
const naCena = { palco: { npc: 'galo' } }

export const CENA_GALO_CASA: Cena = {
  id: 'galo-casa',
  titulo: 'Uma visita no meio da noite',
  capitulo: 'Karma',
  cenario: 'casa-noite',
  requer: 'galo_casa',
  elenco: { galo: { nome: 'O Galo', npc: 'galo', titulo: 'Anfitrião' } },
  passos: [
    narra('Relações são complicadas.', { palco: { cenario: 'escuro' } }),
    narra('É difícil saber quando alguém gosta ou não de você.'),
    narra('Que bom que, no seu caso, você sempre sabe.'),
    narra('…'),
    som('Som de porta se abrindo.', 'porta-abre', { fx: 'porta-abre', palco: { cenario: 'casa-noite' } }),
    eu('Finalmente em casa.', { fx: 'porta-fecha' }),
    narra('Este é o endereço que encontrei entre os meus pertences.'),
    narra('É, sem sombra de dúvidas...'),
    escolha('casa', ['Uma boa casa.', 'Um apartamento adequado.', 'Um cativeiro. Completamente.']),
    narra('Ainda que você não se lembre de tudo, algumas memórias daquele lugar começam a parecer cada vez mais naturais.'),
    escolha('relaxar', ['Talvez eu possa relaxar agora que tudo passou.', 'Ainda não posso baixar a guarda. Tenho muita coisa em que pensar.', '...']),
    narra('Talvez, depois de remoer os próprios pensamentos por algumas horas, você finalmente comece a sentir sono.'),
    narra('Mesmo que ainda não tenha se deitado, a exaustão é grande demais para permitir que continue acordad{o|a}.', { fx: 'escurece' }),
    narra('Sonhos confusos começam a invadir sua mente.', { palco: { cenario: 'escuro' } }),
    narra('Um pesadelo parece estar prestes a surgir...'),
    narra('Só que...'),
    // "[No meio da noite, a campainha toca.] *Som de campainha.*"
    narra('No meio da noite, a campainha toca.', { som: 'campainha', fx: 'campainha', palco: { cenario: 'casa-noite' } }),
    pensa('Que estranho. Alguém veio me visitar?'),
    pensa('O que eu faço?'),
    escolha('porta', [{ texto: 'Ir abrir a porta.', acao: true }, { texto: 'Ignorar.', acao: true }, 'Vá embora!']),
    narra('Independentemente do que eu pretendesse fazer, nada disso importou.'),
    narra('A porta se abriu sozinha. E, junto dela, surgiu a figura de um homem ruivo, trajando um terno.', {
      som: 'porta-abre',
      fx: 'porta-abre',
      palco: { npc: 'galo', expressao: 'confiante' },
    }),
    narra('Um Anfitrião havia aparecido.', { som: 'aparicao', fx: 'revela' }),
    anfitriao('E aí, pé de caju! Lembra de mim?', 'malicia'),
    escolha('lembra', [
      opcao('Não...', [anfitriao('É mais burr{o|a} do que eu esperava!', 'riso')]),
      opcao('Wilson?', [anfitriao('Adoro aquela bola, mas não.', 'desdem')]),
      opcao('Galo...?', [galo('Bingo! Aí, sim! Pirulito!', 'sorriso'), narra('O Galo transferiu uma determinada quantidade de tempo para você.', { som: 'tempo' })], {
        efeitos: [{ tipo: 'tempo', minutos: 60, config: 'narrativa.galo_casa.tempo_min' }],
      }),
      opcao('Cláudio...?', [anfitriao('Nada mal, mas não.', 'entediado')]),
    ]),
    galo('Aqui é o Galo. Tipo Galo Capone! Cheguei pra fazer você pirar de novo, sacou?', 'confiante'),
    galo('Dessa vez, eu vim ensinar uma coisa. Mas não é pra você.', 'piscadela'),
    escolha('para-quem', ['Não é para mim?', 'Não sei se entendi.', 'Outra pessoa...?']),
    galo('Shhh... Cala a boquinha. Já vai começar. Deixa o mano ou a mana aí se concentrar.', 'malicia'),
    narra('A luz pisca.', { fx: 'luz-pisca', som: 'luz', palco: { npc: null } }),
    sistema(
      'Sistema de Karma',
      [
        'O Karma representa as consequências das ações de um indivíduo sobre o mundo, como uma espécie de ressonância moral. No mundo comum, há quem acredite em sua existência e quem a considere mera superstição. Para um Record, entretanto, o Karma é uma força objetivamente difícil de ignorar, pois existem evidências claras de que ele realmente existe.',
        'O Karma está intimamente ligado ao personagem e pode ser adquirido por meio de diálogos, decisões importantes e escolhas realizadas ao longo de uma narrativa — mesmo quando o próprio personagem desconhece sua existência ou a verdadeira dimensão de suas ações.',
        'Cada vínculo estabelecido e cada decisão tomada podem alterar o curso do destino, afetando tanto os relacionamentos quanto a maneira como o mundo percebe aquele que age.',
      ],
      { som: 'sistema' },
    ),
    narra('Seu Karma é representado pela Linha do Destino.', { palco: { destino: 'neutro' } }),
    narra('Nenhum dos lados é inteiramente bom ou mau.', { palco: { destino: 'ambos' } }),
    narra('Você começa com zero de Karma, o que representa um estado neutro.', { palco: { destino: 'seu' } }),
    narra('A Linha do Destino sobe conforme seu personagem se aproxima do lado da Ordem.', { palco: { destino: 'ordem' } }),
    narra('E desce conforme ele se aproxima do Caos, podendo alcançar valores negativos.', { palco: { destino: 'caos' } }),
    narra('Diferentes possibilidades aguardam aqueles que alcançam níveis significativos de Karma positivo ou negativo.', { palco: { destino: 'ambos' } }),
    galo('Em suma, pé de caju, isso só significa que você deve pensar bem antes de decidir como vai agir daqui pra frente. Afinal, sempre tem alguém anotando suas boas ações...', 'piscadela', {
      palco: { destino: null, npc: 'galo' },
    }),
    galo('É como se o Papai Noel estivesse de olho em você. Só que de verdade. Sacou?', 'riso'),
    escolha('papai-noel', ['Você não disse literalmente nada.', '...']),
    galo('Quem precisa saber, sabe.', 'confiante'),
    narra('Com um sorriso radiante e o andar de quem se considera dono do que pisa, ele começa a invadir a casa como se tivesse sido convidado.', { palco: { expressao: 'sorriso' } }),
    // "[Pelo visto, o Galo está indo até a cozinha procurar alguma coisa para comer.] *sons*"
    narra('Pelo visto, o Galo está indo até a cozinha procurar alguma coisa para comer.', { som: 'cozinha', palco: { npc: null } }),
    pensa('Eu deveria tirar uma dúvida importante antes que ele vá embora, como esses sempre fazem...'),
    pensa('Mas qual?'),
    escolha('duvida', [
      opcao('O que significa Capone?', [galo('Não me lembro. Inventei agora...', 'entediado', naCena)]),
      opcao('Por que Galo?', [galo('Longa história, xuxu. Mas digamos que eu sou o melhor, sacou?', 'confiante', naCena)]),
      opcao('Você come minhocas?', [galo('Tô de jejum.', 'desdem', naCena)]),
      opcao('Você sempre aparece, fica dizendo que tem alguém ouvindo e nunca explica nada. Eu nunca vejo ninguém. Quem é?', [
        narra('O Galo ignora você.', { palco: { npc: 'galo', expressao: 'entediado' } }),
      ]),
      opcao('Pode me ajudar de alguma forma?', [galo('Ajuda isso, ajuda aquilo... Sempre a mesma coisa! E eu aqui, achando que você podia ser diferente... Que chatice.', 'irritado', naCena)]),
    ]),
    pensa('Esse cara nunca diz algo útil?'),
    galo('Escuta, pé de caju.', 'neutro', naCena),
    // "[Ele está segurando uma lata de bebida.] *Som de lata*"
    narra('Ele está segurando uma lata de bebida.', { som: 'lata', palco: { expressao: 'sorriso' } }),
    galo('Vou te passar meu contato. Pode me ligar sempre que se sentir incapaz ou sozinh{o|a}. Eu sou bom tanto na terapia quanto no romance.', 'piscadela'),
    escolha('contato', [opcao('Agradeço.', [], { efeitos: [{ tipo: 'karma', delta: 1 }] }), 'Dispenso.', 'Eu não nado por essas águas...']),
    galo('Hahaha! Você não tem lá muita opção...', 'riso'),
    escolha('sem-opcao', ['...', 'Perdão?', 'Uau.', 'Por mim tudo bem.']),
    efeito('contato-galo', [{ tipo: 'contato', npc: 'galo' }], 'Novo contato em Mensagens · O Galo', { som: 'item' }),
    galo('Eh, tô indo!', 'sorriso'),
    narra('O Galo caminha até a porta.', { som: 'passos' }),
    galo('Sabe onde me encontrar, não é? Olhe para o céu. Adeus.', 'confiante'),
    // "[A porta se fecha.] *Som*"
    narra('A porta se fecha.', { som: 'porta-fecha', fx: 'porta-fecha', palco: { npc: null } }),
    narra('…'),
    pensa('Pelo menos ele se despediu'),
  ],
}
