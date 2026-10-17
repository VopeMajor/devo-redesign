/**
 * Holograma da Melissa — Grandioso Calendário Devo (apresentação do sistema na 1ª entrada). Texto LITERAL do dono:
 * docs/redesign/CALENDARIO-dono.md. Mudanças de forma: os colchetes do texto são falas da Melissa (é ela quem
 * apresenta, como nas Corporações); "Bem-vindo(a)" e "atento" levam o marcador de gênero (DIRECAO-3 §7).
 * "*Mostra exemplo de Evento de Natal*" = o passo `exemplo-natal`: o motor avisa (`devo:cena-passo`) e a tela do
 * Calendário projeta o evento de Natal por cima da cena (components/devo/calendario/calendario-app.tsx).
 */
import { fala } from '../autor'
import type { Cena } from '../formato'

const mel = (texto: string, expressao?: string, extra: Parameters<typeof fala>[2] = {}) => fala('melissa', texto, { expressao, ...extra })

export const CENA_MELISSA_CALENDARIO: Cena = {
  id: 'melissa-calendario',
  titulo: 'Calendário Devo',
  capitulo: 'Companhia de Despertados',
  cenario: 'holograma',
  elenco: { melissa: { nome: 'Melissa', npc: 'melissa', titulo: 'Companhia de Despertados' } },
  passos: [
    mel('{Bem-vindo|Bem-vinda} ao Grandioso Calendário Devo!!!', 'animado', { som: 'holograma', palco: { holo: 'materializa', npc: 'melissa' } }),
    mel('Muito tempo atrás, dizem que um Record perdeu o dia de seu grande encontro. E desde então, nós passamos a prestar bastante atenção nas datas.', 'pensativo'),
    mel('O calendário serve como um guia intuitivo de eventos importantes já programados que estão para acontecer.', 'explica'),
    mel('É sempre bom conferi-lo para saber em quais dias deve ficar atent{o|a} e quais dias você tem mais folga!', 'apresenta', { id: 'exemplo-natal', som: 'sistema' }),
    mel('Além disso, o Grande Calendário Devo também conta com um sistema de Check-in Diário nativo. Toda vez que você ficar online, deve marcar ao menos uma vez para resgatar sua recompensa de presença.', 'explica'),
    mel('Em datas comemorativas, é provável que mais de um tipo de check-in apareça…', 'convite'),
    mel('Agora pronto. Você já sabe de tudo. Te desejo um bom Carnaval, Festa Junina, Halloween, Natal e muito mais!!!', 'riso'),
  ],
}
