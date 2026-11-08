/* ---- Dificuldade do Deadly Vote por naipes (Rup, NOTAS-RUP-02-11.md item 12). Direção de arte "O Peso do Destino"
   (crítico de arte, 03/11): a carta é um objeto de papel osso; do Ás ao Dez os naipes enchem a frente, o papel
   escurece e as cantoneiras passam de nenhuma a latão e a ferro. Figuras com o rosto escondido; Coringa é uma fantasia
   vazia; Red Coringa é o Coringa com a mancha escarlate, único escarlate do sistema.
   Texto do Rup literal em DV_TX. A arte está em art/os/baralho/; números e disposição dos naipes saem daqui. ---- */
const DV_NAIPES={espadas:'Espadas',copas:'Copas',ouros:'Ouros',paus:'Paus'};
const DV_VALORES=['A','2','3','4','5','6','7','8','9','10','J','Q','K','C'];
const DV_NOME={A:'Ás',2:'Dois',3:'Três',4:'Quatro',5:'Cinco',6:'Seis',7:'Sete',8:'Oito',9:'Nove',10:'Dez',J:'Valete',Q:'Rainha',K:'Rei',C:'Coringa'};
// escala do Rup (literal, com "Às" e "6400" como estão no texto)
const DV_ESCALA=[['Às','500 a 1.000 XP','10 a 25h'],['Dois','1.000 a 1.500 XP','25 a 50h'],['Três','1.500 a 3.000 XP','50 a 100h'],['Quatro','3.000 a 6.000 XP','100 a 200h'],['Cinco','6.000 a 12.000 XP','200 a 400h'],['Seis','12.000 a 24.000 XP','400 a 800h'],['Sete','24.000 a 48.000 XP','800 a 1.600h'],['Oito','48.000 a 96.000 XP','1.600 a 3.200h'],['Nove','96.000 a 192.000 XP','3.200 a 6.400h'],['Dez','192.000 a 384.000 XP','6400 a 12.800h']];
const DV_TX={
  abre:'A dificuldade de um Deadly Vote é medida pelos Naipes de Baralho. Cada valor crescente revela uma escala de rigor superior à anterior, como se as próprias cartas fossem o peso que o destino coloca sobre os ombros dos jogadores.',
  tendencia:'Embora não exista relação oficial e inequívoca entre o tipo de naipe e o conteúdo da missão, observadores experientes notam certas tendências — especialmente quando se trata das Cartas de Figura. Há quem afirme, ainda, que o naipe influencie o tipo de carta que pode surgir como recompensa. Tudo isso, no entanto, permanece no terreno da suposição. No fim, o único conselho que resiste ao tempo é o mesmo de sempre: acredite apenas em si próprio.',
  escala:'Com base na dificuldade anunciada, o padrão de recompensa oferecida costuma seguir a seguinte escala:',
  figuras:'As Cartas de Figura (Valete, Rainha e Rei) não possuem valores rigidamente definidos, apenas faixas aproximadas. Mesmo com números de referência, elas variam de forma imprevisível e quase sempre se manifestam como Eventos Globais ou como Deadly Votes de dificuldade extrema. Quem se arrisca a entrar nesses jogos precisa carregar consigo uma dose generosa de otimismo… ou de desespero.',
  coringa:['O Coringa é a dificuldade mais especial — e a mais temida.','Quando um Deadly Vote é lançado sob essa classificação, significa que a missão é, por natureza, imprevisível. Existem Coringas em que a morte sequer é possível; o jogador simplesmente emerge do outro lado carregando recompensas aleatórias e absurdas. Existem outros, porém, que parecem ter sido criados com o único propósito de quebrar quem ousa enfrentá-los.'],
  red:['Há, ainda, um fenômeno estranho e raro associado a essa dificuldade. Em alguns casos, um Deadly Vote começa sob uma classificação comum… e, no meio da missão, o efeito do Coringa se manifesta. Os jogadores são notificados de que a dificuldade acabou de mudar. Esses casos são conhecidos como Red Coringa.','Eles são extremamente raros. Extremamente difíceis. E quase sempre terminam de forma terrível.'],
};
// posição de cada naipe na frente (x,y em % da área interna); os da metade de baixo giram 180°
const DV_PIPS={1:[[50,50]],2:[[50,8],[50,92]],3:[[50,8],[50,50],[50,92]],4:[[22,8],[78,8],[22,92],[78,92]],5:[[22,8],[78,8],[50,50],[22,92],[78,92]],
  6:[[22,8],[78,8],[22,50],[78,50],[22,92],[78,92]],7:[[22,8],[78,8],[50,29],[22,50],[78,50],[22,92],[78,92]],8:[[22,8],[78,8],[50,29],[22,50],[78,50],[50,71],[22,92],[78,92]],
  9:[[22,8],[78,8],[22,36],[78,36],[50,50],[22,64],[78,64],[22,92],[78,92]],10:[[22,8],[78,8],[50,22],[22,36],[78,36],[22,64],[78,64],[50,78],[22,92],[78,92]]};
// cor do baralho (dono, 03/11: "não gostei dessas cartas bege" e depois "quero as cartas brancas"): 'c' branco limpo,
// tinta preta e carmim. As escuras ('a' laca negra, 'b' azul-noite) ficam guardadas: ?baralho=a|b.
const DV_TEMA=['a','b','c'].includes(new URLSearchParams(location.search).get('baralho'))?new URLSearchParams(location.search).get('baralho'):'c';
const DV_DO_TEMA=['frente','coringa','valete','rainha','rei','espadas','copas','ouros','paus'];
const dvImg=n=>`art/os/baralho/${DV_DO_TEMA.includes(n)?DV_TEMA+'/':''}${n}.webp?v=2`;
document.documentElement.dataset.baralho=DV_TEMA;
const dvNum=v=>v==='A'?1:+v||0;
const dvNomeCarta=d=>!d?'':d.v==='C'?'Coringa':`${DV_NOME[d.v]} de ${DV_NAIPES[d.n]}`;
const dvFaixa=d=>!d?null:d.v==='C'?['Imprevisível','']:'JQK'.includes(d.v)?['Faixa aproximada','Quase sempre um Evento Global']:DV_ESCALA[dvNum(d.v)-1].slice(1);
// a carta: d={v,n,red}; w em px; verso=true mostra as costas
function dvCarta(d,w=96,{verso=false,cl=''}={}){
  if(verso)return `<span class="dv-carta verso ${cl}" style="--w:${w}px" aria-hidden="true"><img src="${dvImg('verso')}" alt=""></span>`;
  const coringa=d.v==='C',fig='JQK'.includes(d.v),n=dvNum(d.v),peso=coringa||fig?0:n;
  const nome=d.red?'Red Coringa':dvNomeCarta(d);
  const canto=peso>=8?'ferro':peso>=4?'latao':fig?'latao':'';
  const ind=coringa?`<img class="dv-guizo" src="${dvImg('guizo')}" alt="">`:`<b>${d.v}</b><img src="${dvImg(d.n)}" alt="">`;
  const miolo=coringa?`<img class="dv-arte" src="${dvImg('coringa')}" alt="">`
    :fig?`<span class="dv-fig"><img src="${dvImg({J:'valete',Q:'rainha',K:'rei'}[d.v])}" alt=""><img class="b" src="${dvImg({J:'valete',Q:'rainha',K:'rei'}[d.v])}" alt=""></span>`
    :`<span class="dv-pips${n===1?' as':''}">${DV_PIPS[n].map(([x,y])=>`<img src="${dvImg(d.n)}" alt="" style="left:${x}%;top:${y}%${y>50?';rotate:180deg':''}">`).join('')}</span>`;
  return `<span class="dv-carta ${coringa?'coringa':''} ${d.red?'red':''} n-${d.n||''} ${cl}" style="--w:${w}px;--peso:${peso}" role="img" aria-label="${nome}">
    ${coringa?'':`<img class="dv-papel" src="${dvImg('frente')}" alt="">`}${miolo}
    <span class="dv-ind a">${ind}</span><span class="dv-ind z">${ind}</span>
    ${canto?['tl','tr','bl','br'].map(c=>`<img class="dv-canto k-${c}" src="${dvImg('canto-'+canto)}" alt="">`).join(''):''}
    ${peso===10?'<i class="dv-corrente" aria-hidden="true"></i>':''}
    ${d.red?`<img class="dv-mancha" src="${dvImg('mancha')}" alt="">`:''}</span>`;
}
// página de regras (texto do Rup literal); volta() devolve o botão de voltar do lugar onde abriu
function dvRegrasHtml(){
  return `<article class="dv-regras">
    <header><h4>Dificuldades de Deadly Vote</h4></header>
    <p>${DV_TX.abre}</p><p>${DV_TX.tendencia}</p>
    <p>${DV_TX.escala}</p>
    <ol class="dv-escada">${DV_ESCALA.map(([n,xp,h],i)=>`<li style="--i:${i+1}">${dvCarta({v:DV_VALORES[i],n:'espadas'},36)}<span>${n}</span><b>${xp}</b><b>${h}</b></li>`).join('')}</ol>
    <div class="dv-fileira">${['J','Q','K'].map(v=>dvCarta({v,n:'copas'},104)).join('')}</div>
    <p>${DV_TX.figuras}</p>
    <h5 class="dv-sub">O Coringa</h5>
    <div class="dv-fileira">${dvCarta({v:'C'},120)}</div>
    ${DV_TX.coringa.map(t=>`<p>${t}</p>`).join('')}
    <div class="dv-fileira">${dvCarta({v:'C',red:true},120)}</div>
    ${DV_TX.red.map(t=>`<p>${t}</p>`).join('')}
  </article>`;
}
// aviso do Red Coringa para os inscritos: a carta racha, vira e volta como Coringa manchado
function dvAvisoRed({titulo,antes}){
  const el=document.createElement('div');el.className='dv-aviso';el.setAttribute('role','alertdialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','dv-av-t');
  el.innerHTML=`<div class="dv-av-carta"><span class="dv-vira">${dvCarta(antes,200,{cl:'f1'})}${dvCarta({v:'C',red:true},200,{cl:'f2'})}</span><img class="dv-racha" src="${dvImg('mancha')}" alt=""></div>
    <h2 id="dv-av-t">Red Coringa</h2>
    <p>A dificuldade de ${titulo} acabou de mudar.</p><p>Era ${dvNomeCarta(antes)}. Agora é Coringa.</p>
    <button class="dv-av-ok">Entendi</button>`;
  document.body.append(el);
  if(!parado){try{const c=new (window.AudioContext||window.webkitAudioContext)(),o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(98,c.currentTime);o.frequency.exponentialRampToValueAtTime(55,c.currentTime+1.6);g.gain.setValueAtTime(.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(.22,c.currentTime+.05);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+2);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+2.1)}catch{}}
  el.classList.toggle('pronto',parado);
  el.onclick=e=>{if(!el.classList.contains('pronto')){el.classList.add('pronto');return}if(e.target.closest('.dv-av-ok'))el.remove()};
  el.querySelector('.dv-av-ok').focus({preventScroll:true});
  setTimeout(()=>el.classList.add('pronto'),2400);
}
