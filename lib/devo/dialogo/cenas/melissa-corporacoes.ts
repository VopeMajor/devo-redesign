/**
 * Holograma da Melissa — Corporações (apresentação do sistema). Texto LITERAL do dono:
 * docs/redesign/SISTEMAS-texto-do-dono.txt (só formatação, efeitos e `{o|a}`).
 * Ao concluir, libera a flag `corporacoes` (a Fundação deixa Corporações para a Narrativa liberar).
 */
import { escolha, fala, narra, opcao } from '../autor'
import type { Cena } from '../formato'

const mel = (texto: string, expressao?: string) => fala('melissa', texto, { expressao })

export const CENA_MELISSA_CORPORACOES: Cena = {
  id: 'melissa-corporacoes',
  titulo: 'Uma chamada da Companhia',
  capitulo: 'Companhia de Despertados',
  cenario: 'holograma',
  elenco: { melissa: { nome: 'Melissa', npc: 'melissa', titulo: 'Companhia de Despertados' } },
  aoConcluir: [{ tipo: 'flag', flag: 'corporacoes' }],
  passos: [
    narra('Enquanto estou distraíd{o|a}, uma luz irrompe da tela do meu próprio celular. Um feixe azulado ilumina meu rosto, revelando-se semelhante à luz de uma lanterna.', {
      som: 'chamada',
      palco: { holo: 'chamada' },
    }),
    narra('Procuro entender o que está acontecendo, mas, antes que consiga formular qualquer hipótese, vejo um holograma se materializar diante de mim. Nele, reconheço o rosto de alguém que já conheço.', {
      som: 'holograma',
      palco: { holo: 'materializa', npc: 'melissa' },
    }),
    mel('Olá, Record. Sou eu mais uma vez. Como vai?', 'sorriso'),
    mel('Você já deve ter ouvido falar da Companhia de Despertados, organização da qual faço parte. Na verdade, fui eu quem lhe contou sobre ela e sobre a nossa função. Certo?', 'explica'),
    mel('Pois bem. Saiba que não somos a única entidade perambulando por aí.', 'pensativo'),
    mel('Grupos menores, organizados por indivíduos como você, surgem a todo momento.', 'explica'),
    mel('Essas pequenas equipes são formadas para alcançar objetivos em comum, geralmente relacionados à sobrevivência de seus integrantes nos jogos perigosos que estão por vir.', 'preocupado'),
    mel('Todas elas são conhecidas como *Corporações* pela *Companhia de Despertados*.', 'apresenta'),
    mel('Existem muitas vantagens em fazer parte de uma *Corporação* competente. Você pode transferir cartas entre membros ou participar de jogos coletivos especiais, por exemplo.', 'convite'),
    mel('Naturalmente, algumas dessas *Corporações* acabam se desviando do caminho correto.', 'pensativo'),
    mel('Por esse motivo, nós, da *Companhia de Despertados*, estabelecemos um código de regras que toda *Corporação* precisa seguir caso queira ser reconhecida como oficial e legal.', 'explica'),
    mel('Quando essas regras são violadas, a *Corporação* passa a ser classificada como terrorista. São as chamadas *Necro-Corporações*.', 'preocupado'),
    mel('Eu recomendaria que você ficasse bem longe delas se quiser levar uma vida tranquila.', 'confiante'),
    escolha('entrar', [
      opcao('Como posso entrar em uma Corporação?', [mel('Entrar em uma Corporação é muito fácil, mas preciso que você espere um pouco antes de dar esse passo.', 'sorriso')]),
      opcao(
        'Parece interessante. Onde encontro uma Necro-Corporação?',
        [mel('Record... Que coisa horrível.', 'surpreso'), narra('Uma determinada quantidade de tempo é retirada do seu Shuffler.', { som: 'tempo' }), mel('Como você ainda é iniciante, vou deixar passar desta vez.', 'triste')],
        { efeitos: [{ tipo: 'tempo', minutos: -30, config: 'narrativa.melissa_corporacoes.multa_min' }] },
      ),
      opcao('Eu quero mais é ficar na minha.', [
        mel('É uma opção, embora bastante irresponsável. Poucos Records alcançam o sucesso trabalhando sozinhos. E, entre aqueles que conseguem, a maioria já participou de alguma *Corporação* em determinado momento. Além disso, existem muito mais vantagens em fazer parte de uma equipe do que em enfrentar tudo por conta própria.', 'pensativo'),
      ]),
    ]),
    mel('Para entrar em uma *Corporação*, você precisa adquirir o código de identificação dela e inseri-lo no campo correspondente na página de *Corporações*.', 'explica'),
    mel('Feito isso, basta aguardar até que o líder ou vice-líder aprove sua entrada. Durante o processo, ele terá acesso a determinadas partes do seu perfil.', 'explica'),
    mel('Na maioria das vezes, você não encontrará anúncios de recrutamento por aí. Portanto, é bom aproveitar as oportunidades quando surgirem. Quando acontecem, essas divulgações são mais frequentes no *Salão das Máscaras*.', 'apresenta'),
    mel('Outra possibilidade é receber um convite diretamente de um *Record* que já faça parte de alguma *Corporação*.', 'convite'),
    escolha('salao', [
      opcao('Salão das Máscaras?', [mel('Caso já tenha desbloqueado esse recurso, você encontrará o ícone de uma máscara no *Menu do Devo*. Ele representa o *Salão das Máscaras*. Caso contrário... Bem, paciência.', 'riso')]),
      opcao('E se eu quiser criar uma?', [mel('Se quiser criar sua própria *Corporação*, precisará investir uma determinada quantidade de tempo e obter aprovação legal. A avaliação administrativa levará em consideração se o seu perfil corresponde aos requisitos exigidos.', 'explica')]),
      'Entendi.',
    ]),
    mel('Lembre-se sempre de tomar cuidado com as *Corporações Rivais* e com as outras *Corporações Globais*. Elas não são tão boazinhas quanto nós.', 'confiante'),
    narra('A chamada é encerrada antes que eu possa me despedir de Melissa — ou perguntar a ela o que exatamente são essas tais Corporações Globais.', {
      som: 'holograma',
      palco: { holo: 'encerra', npc: null },
    }),
    narra('Será que eu deveria tomar mais cuidado daqui em diante?'),
  ],
}
