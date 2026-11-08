// Sistemas do jogo para as propostas de interface: nomes, subtítulos e motivos são os do jogo atual
// (os/apps.tsx e progressao/sistemas.tsx). O estado vem do parâmetro; no jogo, do servidor (/api/eu).
const q=new URLSearchParams(location.search);
const $=i=>document.getElementById(i);
const parado=matchMedia('(prefers-reduced-motion: reduce)').matches;
const estado=q.get('estado')||'jogador',critico=q.get('tempo')==='critico';
const TUTORIAL='Vença o Deadly Vote tutorial';
const SISTEMAS=[
  {id:'record',nome:'Record',s:'Deadly Vote Record System'},
  {id:'mensagens',nome:'Mensagens',s:'Conversas e ameaças',conta:3},
  {id:'cartas',nome:'Cartas',s:'Seu inventário',novo:true},
  {id:'pulso',nome:'Pulso',s:'Seu tempo de vida'},
  {id:'casa',nome:'Casa',s:'Confecção de Cartas e Pacotes',trava:TUTORIAL},
  {id:'inventario',nome:'Inventário',s:'Tudo o que é seu'},
  {id:'trocas',nome:'Sala de Trocas',curto:'Trocas',s:'Trocas às cegas'},
  {id:'calendario',nome:'Calendário',s:'Eventos e check-in diário'},
  {id:'torres',nome:'Torres de Ruptura',curto:'Torres',s:'Andares, essências e chaves',trava:TUTORIAL,novo:true},
  {id:'poco',nome:'Poço dos Milagres',curto:'Poço',s:'Moedas, manivela e balde',trava:TUTORIAL},
  {id:'salao',nome:'Salão das Máscaras',curto:'Máscaras',s:'Leilões, mercado e anúncios',trava:TUTORIAL},
  {id:'jogos',nome:'Sala de Jogos',curto:'Jogos',s:'Minigames e apostas',revelada:true},
  {id:'corporacoes',nome:'Corporações',s:'Companhia de Despertados',trava:'Aguarde a Companhia',sempre:true},
  {id:'conflito',nome:'Evento de Conflito',curto:'Conflito',s:'Companhia × Ordem',novo:true},
  {id:'ranking',nome:'Ranking Geral da Temporada',curto:'Ranking',s:'O relógio da praça',novo:true},
  {id:'virtudes',nome:'Virtudes',s:'Pontos de potencial',trava:'Em breve',sempre:true},
  {id:'arcanos',nome:'Arcanos',s:'Os vinte e dois',trava:'Em breve',sempre:true},
  {id:'ajustes',nome:'Ajustes',s:'Sistema'},
  {id:'mesa',nome:'Mesa',s:'Painel da equipe',equipe:true},
].filter(a=>!(a.equipe&&estado!=='owner')&&!(a.revelada&&estado==='novato'));
// Owner e Anfitrião têm tudo liberado
const trancado=a=>estado==='owner'?false:a.id==='corporacoes'&&q.has('corp')?false:a.sempre?true:estado==='novato'&&!!a.trava;
const emb=id=>`art/home/emblema-${id}.webp`;
const ROMANOS=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII'];
const CADEADO='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a5 5 0 0 0-5 5v3H5v12h14V10h-2V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 0 1 6 0v3zm3 4a2 2 0 0 1 1 3.7V20h-2v-2.3A2 2 0 0 1 12 14z"/></svg>';
const SINO='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l1.6 2.2c3.4.6 5 3.2 5 6.600 0 3 .7 4.600 2.400 6.200l-.5 1.500H3.500L3 17.500c1.700-1.600 2.400-3.200 2.400-6.200 0-3.400 1.600-6 5-6.600zM9.200 20.500h5.600L12 23z"/></svg>';
// Letra por letra, cada uma levemente torta. Fixo por posição, nunca sorteado.
function letras(txt){
  return [...txt].map((c,i)=>{
    if(c===' ')return ' ';
    const k=(i*7+c.charCodeAt(0)*3)%11,g=((k-5)*.62).toFixed(1),y=((k%5-2)*.6).toFixed(1),e=(1+(k%4)*.022+(i===0?.14:0)).toFixed(3);
    return `<span class="l" style="--g:${g}deg;--y:${y}px;--e:${e}">${c}</span>`;
  }).join('');
}
// o Tempo no pulso: um relógio só; as telas recebem o texto a cada segundo
let segPulso=q.has('horas')?+q.get('horas')*3600:critico?2*3600+14*60+9:71*3600+59*60+59;
function relogio(pinta){
  const vai=()=>pinta([Math.floor(segPulso/3600),Math.floor(segPulso%3600/60),segPulso%60].map(n=>String(n).padStart(2,'0')).join(':'),critico?'Crítico':'Estável');
  vai();
  addEventListener('devo-pulso',vai);
  if(!q.has('semraf'))setInterval(()=>{if(segPulso>0){segPulso--;vai()}},1000);
}
// o que sai ou entra no pulso (lances, compras, taxas): o relógio mostra na hora
function mudaPulso(seg){segPulso=Math.max(0,segPulso+seg);dispatchEvent(new Event('devo-pulso'))}
// Textos provisórios: no jogo vêm do Owner e do Calendário dos próximos 14 dias.
const ANUNCIOS=[['Aviso do Owner','Aqui entra o aviso que o Owner escrever'],['Calendário','Próximo evento do Calendário']];
