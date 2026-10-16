/**
 * Novo diálogo com O Galo (Karma) — passo 4 do fluxo, depois do Deadly Vote tutorial e de explorar.
 * Texto LITERAL do dono: docs/redesign/DIALOGOS-galo-salao.md (só formatação: escolhas, respostas, efeitos,
 * palco e o marcador de gênero `{o|a}`).
 */
import { eu, escolha, efeito, fala, narra, opcao, pensa, sistema, som } from '../autor'
import type { Cena } from '../formato'

const galo = (texto: string, expressao?: string, extra: Parameters<typeof fala>[2] = {}) => fala('galo', texto, { expressao, ...extra })

export const CENA_GALO_CASA: Cena = {
  id: 'galo-casa',
  titulo: 'Uma visita no meio da noite',
  capitulo: 'Karma',
  cenario: 'casa-noite',
  requer: 'galo_casa',
  elenco: { galo: { nome: 'O Galo', npc: 'galo', titulo: 'Anfitrião' } },
  passos: [
    narra('Relações são complicadas', { palco: { cenario: 'escuro' } }),
    narra('É difícil saber quando uma pessoa gosta ou não de alguém'),
    narra('Que bom que, no seu caso, você sempre sabe'),
    narra('…'),
    som('Som de porta abrindo', 'porta', { fx: 'porta-abre', palco: { cenario: 'casa-noite' } }),
    eu('Finalmente em casa.', { fx: 'porta-fecha' }),
    eu('Esse é o endereço que encontrei entre os meus pertences.'),
    eu('É, sem sombra de dúvidas…'),
    escolha('casa', ['Uma boa casa', 'Um apartamento adequado', 'Um cativeiro, completamente']),
    narra('Ainda que você não se lembre de tudo, algumas memórias daquele lugar começam a se tornar cada vez mais naturais'),
    escolha('relaxar', ['Talvez eu possa relaxar agora que tudo passou.', 'Ainda não posso me desconcentrar. Estou pensativ{o|a}.', '…']),
    narra('Talvez, depois de remoer os pensamentos por algumas horas, você finalmente comece a sentir sono'),
    narra('Mesmo se não tiver deitado, a exaustão é grande demais para simplesmente continuar', { fx: 'escurece' }),
    narra('Sonhos confusos invadem sua mente', { palco: { cenario: 'escuro' } }),
    narra('Um pesadelo parece querer chegar…'),
    narra('Só que…'),
    narra('No meio da noite, a campainha toca', { som: 'campainha', fx: 'campainha', palco: { cenario: 'casa-noite' } }),
    pensa('Que estranho. Alguém veio me visitar?'),
    pensa('O que eu faço?'),
    escolha('porta', [
      { texto: 'Ir abrir a porta', acao: true },
      { texto: 'Ignorar', acao: true },
      'Vá embora',
    ]),
    narra('Independente do que eu pretendesse fazer, nada importou'),
    narra('A porta se abriu sozinha. E com ela veio o surgimento da figura de um homem ruivo de terno', {
      som: 'porta',
      fx: 'porta-abre',
      palco: { npc: 'galo', expressao: 'confiante' },
    }),
    narra('Um Anfitrião apareceu', { fx: 'revela' }),
    galo('E aí, pé de caju. Lembra de mim?', 'malicia', { nome: 'Anfitrião' }),
    escolha('lembra', [
      opcao('Não…', [galo('É mais burr{o|a} do que eu esperava!', 'riso', { nome: 'Anfitrião' })]),
      opcao('Wilson?', [galo('Adoro aquela bola, mas não.', 'desdem', { nome: 'Anfitrião' })]),
      opcao('Galo…?', [galo('Bingo! Aí sim. Pirulito!', 'sorriso'), narra('Galo transferiu {tempo} de tempo para você')], {
        efeitos: [{ tipo: 'tempo', minutos: 60, config: 'narrativa.galo_casa.tempo_min' }],
      }),
      opcao('Cláudio…?', [galo('Nada mal, mas não.', 'entediado', { nome: 'Anfitrião' })]),
    ]),
    galo('Aqui é o Galo. Tipo Galo Capone. Cheguei pra fazer pirar de novo, sacou?', 'confiante'),
    galo('Dessa vez eu vim ensinar, mas não é para você.', 'piscadela'),
    escolha('para-quem', ['Não é para mim?', 'Não sei se entendi.', 'Outra pessoa…']),
    galo('Shh… Cala a boquinha. Já vai começar. Deixa o "mano" ou a "mana" aí se concentrar.', 'malicia'),
    narra('A luz pisca', { fx: 'luz-pisca', som: 'luz', palco: { npc: null } }),
    sistema(
      'Sistema de Karma',
      [
        'Karma é a consequência das ações de alguém impactando o próprio mundo como uma ressonância moral. No mundo comum, existe quem acredita nele e quem não. Já para um Record, karma é uma força objetivamente difícil de ignorar, pois demonstra sinais claros de que realmente existe.',
        'O karma parece estar intensamente ligado ao personagem. Ele pode ser adquirido por meio de diálogos e decisões importantes tomadas no decorrer de uma narrativa — mesmo que o personagem pessoal não saiba da sua existência ou do peso de suas ações.',
        'Cada laço e escolha feita sempre mudam o destino, afetando tanto relacionamentos quanto a impressão do mundo sobre quem age.',
      ],
      { som: 'sistema' },
    ),
    narra('Seu karma é medido pela linha do destino', { palco: { destino: 'neutro' } }),
    narra('Nenhum lado é puramente bom ou mal', { palco: { destino: 'ambos' } }),
    narra('Você começa com zero de karma, o que significa neutro', { palco: { destino: 'seu' } }),
    narra('A linha do destino sobe conforme seu personagem se direciona ao lado da ordem', { palco: { destino: 'ordem' } }),
    narra('E desce — podendo até ficar negativo — quando se move rumo ao caos', { palco: { destino: 'caos' } }),
    narra('Diferentes possibilidades aguardam aqueles que alcançam níveis relevantes de karma positivo e negativo', { palco: { destino: 'ambos' } }),
    galo('Em suma, pé de caju, só significa que você deve pensar bem em como quer agir daqui em diante. Já que sempre vai ter alguém anotando suas boas ações… É como se o Papai Noel tivesse de olho, mas de verdade. Sacou?', 'piscadela', {
      palco: { destino: null, npc: 'galo' },
    }),
    escolha('papai-noel', ['Você não disse literalmente nada.', '…']),
    galo('Quem precisa saber, sabe.', 'confiante'),
    narra('Com um sorriso brilhante e andar de dono do mundo, ele começa a invadir a casa', { palco: { expressao: 'sorriso' } }),
    narra('Parece que o Galo vai até a cozinha buscar algo para comer', { som: 'passos', palco: { npc: null } }),
    pensa('Eu deveria tirar uma dúvida importante antes que ele se vá como sempre fazem…'),
    pensa('Mas qual?'),
    escolha('duvida', [
      opcao('O que significa Capone?', [galo('Não me lembro. Inventei agora…', 'entediado', { palco: { npc: 'galo' } })]),
      opcao('Por que Galo?', [galo('Longa história, xuxu. Mas digamos que eu sou o melhor, sacou?', 'confiante', { palco: { npc: 'galo' } })]),
      opcao('Você come minhocas?', [galo('Tô de jejum.', 'desdem', { palco: { npc: 'galo' } })]),
      opcao('Você sempre aparece e fica calado dizendo que tem alguém ouvindo, mas nunca vejo. Quem é?', [narra('O Galo te ignora', { palco: { npc: 'galo', expressao: 'entediado' } })]),
      opcao('Pode me ajudar de alguma forma?', [galo('Ajuda isso, ajuda aquilo. Sempre a mesma coisa. E eu achando que você podia ser diferente… Chatice.', 'irritado', { palco: { npc: 'galo' } })]),
    ]),
    galo('Escuta, Pé de Caju. [Ele tem uma lata de bebida na mão] Eu vou te dar o meu contato. Você pode ligar sempre que se sentir incapaz ou na solidão. Eu sou tanto na terapia quanto no romance.', 'piscadela', {
      palco: { npc: 'galo' },
    }),
    escolha('contato', ['Agradeço.', 'Dispenso.', 'Eu não nado por essas águas…']),
    galo('Haha. Você não tem muita opção… Bem, tô indo.', 'riso'),
    efeito('contato-galo', [{ tipo: 'contato', npc: 'galo' }], 'Novo contato em Mensagens · O Galo'),
    narra('O Galo vai até a porta', { som: 'passos' }),
    galo('Sabe onde me encontrar.', 'confiante'),
    narra('A porta se fecha', { som: 'porta', fx: 'porta-fecha', palco: { npc: null } }),
    narra('…'),
    pensa('Pelo menos ele se despediu.'),
  ],
}
