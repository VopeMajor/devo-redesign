/**
 * Reflexão "Anfitrião do quê?" — ao sair da aba de Torres pela primeira vez (fim do diálogo do Galo das Torres,
 * texto LITERAL em docs/redesign/SISTEMAS-texto-do-dono.txt). O agente Torres chama
 * `abrirCena('reflexao-anfitriao', { seNaoVista: true })`.
 */
import { escolha, opcao, pensa } from '../autor'
import type { Cena } from '../formato'

export const CENA_REFLEXAO_ANFITRIAO: Cena = {
  id: 'reflexao-anfitriao',
  titulo: 'Anfitrião do quê?',
  capitulo: 'Reflexão',
  cenario: 'sobreposto',
  requer: 'torres',
  retomavel: false,
  passos: [
    pensa('Aquele cara estava marcado como Anfitrião também. Dizia até que ele era o Anfitrião de alguma coisa… O quê?'),
    escolha('anfitriao-de', [
      opcao('Não me lembro.', [], { ir: 'fim' }),
      opcao('Anfitrião das Galinhas.', [], { ir: 'fim' }),
      opcao('Anfitrião do Sol Celeste.', [], { ir: 'fim' }),
      opcao('Anfitrião do Imperador.', [pensa('Acho que era esse. Eu deveria perguntar a alguém sobre isso depois.')], { ir: 'fim' }),
      opcao('Só Anfitrião mesmo.', [], { ir: 'fim' }),
    ]),
  ],
}
