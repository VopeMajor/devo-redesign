/* ---- Ranking Geral da Temporada (Rup, NOTAS-RUP-02-11.md item 4). Direção de arte "O Relógio dos Autômatos"
   (crítico de arte, 03/11): o relógio astronômico da praça do Devo marca a temporada; cinco autômatos guardam as
   categorias; quando a temporada fecha, os três primeiros sobem à sacada. Bronze, pedra e esmalte; um eixo só, o
   vertical. A categoria de mortes é cômica só nos objetos (lápides, coroa fúnebre, fita de luto, o sino uma vez).
   Nomes das categorias literais do Rup. Nomes dos autômatos e linhas de apoio são proposta (passam pelo Rup).
   No ranking aparece a foto do jogador, não o avatar (LEIA-PRIMEIRO 12); quem não pôs foto aparece com a inicial.
   Dados de exemplo; no jogo, do servidor. ---- */
const RK_CAT=[
  {id:'votos',nome:'Maior quantidade de Deadly Votes solucionados',aut:'O Juiz',un:'votos',u1:'voto'},
  {id:'cartas',nome:'Maior quantidade de cartas adquiridas',aut:'O Colecionador',un:'cartas',u1:'carta'},
  {id:'tempo',nome:'Maior tempo acumulado no período',aut:'A Astrônoma',un:'',tempo:true},
  {id:'mortes',nome:'Maior número de mortes sofridas',aut:'O Esqueleto do Sino',un:'mortes',u1:'morte'},
  {id:'eliminacoes',nome:'Maior número de eliminações oficiais de outros jogadores',aut:'O Carrasco',un:'eliminações',u1:'eliminação'},
];
const RK_INICIO=new Date(2026,10,1),RK_FIM=new Date(2026,10,29,23,59);
// jogadores de exemplo: os onze primeiros têm foto própria (foto-N combina com o nome); os outros, sem foto
const RK_JOG=[['Dante Moura',1],['Ester Vaz',2],['Vicente Rocha',3],['Lia Sombra',4],['Iara K.',5],['Tomé',6],['Corvina',7],['Teodoro',8],['Fausto',9],['Zuri',10],['Abel R.',11],
  ['Noah Teles'],['Severina'],['Caio Lune'],['Helena M.'],['Otto'],['Rubi Salles'],['Jonas Pires'],['Marta Nox'],['Ícaro'],['Alba Reis'],['Selene Dias'],['Gael'],['Nina Ferro'],['Bento C.'],['Vera Luz'],['Rafa Vento'],['Clara Monte'],['Davi Sá'],['Ione']]
  .map(([nome,f])=>({nome,foto:f?`art/os/ranking/foto-${f}.webp?v=1`:null}));
const RK_EU={nome:'Você',foto:'art/os/ranking/foto-12.webp?v=1',eu:true};
// recorte do busto de cada autômato dentro do nicho (largura e deslocamentos em % da imagem)
const RK_BUSTO={votos:[210,-55,-4],cartas:[210,-55,-6],tempo:[200,-48,-4],mortes:[230,-60,-34],eliminacoes:[210,-55,-4]};
function rkTabela(cat){
  const base={votos:[31,1.15],cartas:[214,6.1],tempo:[612,16],mortes:[19,.55],eliminacoes:[14,.42]}[cat.id];
  const sem=[...cat.id].reduce((a,c)=>a+c.charCodeAt(0),0);
  // ordem diferente em cada categoria (embaralhada pela semente da categoria)
  const ordem=RK_JOG.map((j,i)=>[((i+1)*(sem%17+3)*7919)%1009,j]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
  const lista=ordem.map((j,i)=>({...j,v:Math.max(cat.tempo?20:1,Math.round(base[0]-i*base[1]-(i%4===3?base[1]*.5:0)))}));
  const minha={votos:15,cartas:118,tempo:340,mortes:0,eliminacoes:6}[cat.id];
  if(minha>0){const k=lista.findIndex(x=>x.v<minha);lista.splice(k<0?lista.length:k,0,{...RK_EU,v:minha})}
  let pos=0,ant=null;lista.forEach((x,i)=>{x.primeiro=x.v!==ant;if(x.primeiro){pos=i+1;ant=x.v}x.pos=pos});
  return lista;
}
const rkValor=(cat,v)=>cat.tempo?(v<24?`${v}h`:`${Math.floor(v/24)}d ${v%24}h`):v.toLocaleString('pt-BR');
const rkUn=(cat,v)=>cat.tempo?'':(v===1?cat.u1:cat.un);
const rkFoto=(x,cl='')=>x.foto?`<img class="${cl}" src="${x.foto}" alt="">`:`<span class="${cl} rk-ini" aria-hidden="true">${x.nome[0]}</span>`;
const RK_ROM=['I','II','III'];

function montaRanking(raiz){
  const q=new URLSearchParams(location.search);
  let atual=Math.max(0,RK_CAT.findIndex(c=>c.id===q.get('cat')));
  let somAntes=false;
  const corpo=()=>raiz.closest('.corpo')||raiz.parentElement;
  const frac=Math.min(1,Math.max(0,(new Date()-RK_INICIO)/(RK_FIM-RK_INICIO)));
  const ms=Math.max(0,RK_FIM-new Date()),d=Math.floor(ms/864e5),h=Math.floor(ms%864e5/36e5);
  raiz.innerHTML=`<header class="rk-topo">
      <div class="rk-torre" role="img" aria-label="A torre do relógio astronômico da praça do Devo, à noite"></div>
      <span class="rk-fita">Temporada I</span>
      <div class="rk-relogio" style="--p:${frac}" aria-hidden="true"><img class="rk-mostrador" src="art/os/ranking/mostrador.webp?v=1" alt=""><i class="rk-setor"></i><img class="rk-ponteiro" src="art/os/ranking/ponteiro.webp?v=1" alt=""></div>
      <p class="rk-resta"><b>${d}d ${h}h</b><small>até o relógio fechar a temporada</small></p>
    </header>
    <i class="rk-marca" aria-hidden="true"></i>
    <nav class="rk-nichos" role="tablist" aria-label="Categorias">${RK_CAT.map((c,i)=>{const [w,x,y]=RK_BUSTO[c.id];return `<button role="tab" class="rk-nicho" data-i="${i}" aria-label="${c.nome}" title="${c.aut}">
      <span class="rk-dentro"><img src="art/os/ranking/aut-${c.id}.webp?v=2" alt="" style="width:${w}%;margin-left:${x}%;margin-top:${y}%"></span><img class="rk-moldura" src="art/os/ranking/nicho.webp?v=1" alt=""><i class="rk-porta e"></i><i class="rk-porta d"></i>
      <img class="rk-un" src="art/os/ranking/u-${c.id}.webp?v=1" alt=""><small>${c.aut}</small></button>`}).join('')}</nav>
    <section class="rk-palco"></section>
    <div class="rk-eu-pe" hidden></div>`;
  const palco=raiz.querySelector('.rk-palco'),pe=raiz.querySelector('.rk-eu-pe'),nichos=raiz.querySelector('.rk-nichos');
  // o trilho dos nichos só ganha fundo quando fica preso no alto
  if('IntersectionObserver' in window)new IntersectionObserver(([e])=>nichos.classList.toggle('preso',!e.isIntersecting),{root:corpo(),threshold:0}).observe(raiz.querySelector('.rk-marca'));
  function dong(){
    if(parado)return;
    try{const c=new (window.AudioContext||window.webkitAudioContext)(),g=c.createGain();g.gain.setValueAtTime(.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(.16,c.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+2.4);g.connect(c.destination);
      [[196,1],[392,.4],[523,.18]].forEach(([f,a])=>{const o=c.createOscillator(),k=c.createGain();o.type='sine';o.frequency.value=f;k.gain.value=a;o.connect(k).connect(g);o.start();o.stop(c.currentTime+2.5)})}catch{}
  }
  function retrato(x,n,cat){
    const m=cat.id==='mortes';
    return `<span class="rk-ret p${n}">${m&&n===1?'<img class="rk-coroa" src="art/os/ranking/coroa.webp?v=1" alt="">':''}${rkFoto(x,'rk-foto')}<img class="rk-anel" src="art/os/ranking/anel-${n}.webp?v=1" alt="">${m?'<img class="rk-luto" src="art/os/ranking/fita.webp?v=1" alt="">':''}<b class="rk-rom">${RK_ROM[n-1]}</b></span>`;
  }
  function desenha(){
    const cat=RK_CAT[atual],lista=rkTabela(cat),m=cat.id==='mortes';
    raiz.dataset.cat=cat.id;
    raiz.querySelectorAll('.rk-nicho').forEach((b,i)=>{b.setAttribute('aria-selected',i===atual)});
    const top=lista.slice(0,3),resto=lista.slice(3,50),eu=lista.find(x=>x.eu);
    const ordem=[[top[1],2],[top[0],1],[top[2],3]].filter(([x])=>x);
    palco.innerHTML=`<h3 class="rk-cat">${cat.nome}</h3>
      <div class="rk-podio" aria-label="Pódio"><img class="rk-lampiao" src="art/os/ranking/lampiao.webp?v=1" alt="">${ordem.map(([x,n])=>`<div class="rk-col c${n}${x.eu?' eu':''}">
        ${retrato(x,n,cat)}
        <span class="rk-nome">${x.nome}</span>
        <span class="rk-val"><img src="art/os/ranking/u-${cat.id}.webp?v=1" alt="">${rkValor(cat,x.v)} <small>${rkUn(cat,x.v)}</small></span>
        <span class="rk-base"><img class="rk-ped" src="art/os/ranking/${m?'lapide':'pedestal'}-${n}.webp?v=2" alt=""></span></div>`).join('')}<i class="rk-chao" aria-hidden="true"></i></div>
      <ol class="rk-lista" start="4">${resto.map(x=>`<li class="${x.eu?'eu':''}"><span class="rk-pos">${x.primeiro||x.eu?`${x.pos}º`:'<i>=</i>'}</span>${rkFoto(x)}<span class="rk-n">${x.nome}</span><span class="rk-v">${rkValor(cat,x.v)}<small>${rkUn(cat,x.v)}</small></span></li>`).join('')}</ol>
      ${lista.length>50?'<button class="rk-mais">ver mais</button>':''}`;
    // placa "sua posição"
    if(!eu){pe.innerHTML=`<span class="rk-eu-tx">Ainda sem registro nesta categoria</span>`}
    else if(eu.pos<=3){pe.innerHTML=`<b>${eu.pos}º</b><span class="rk-eu-tx">Você está no pódio · ${RK_ROM[eu.pos-1]}</span>`}
    else{const acima=lista.filter(x=>x.pos<eu.pos).pop(),falta=acima.v-eu.v+1;
      pe.innerHTML=`<b>${eu.pos}º</b><img src="${eu.foto}" alt=""><span class="rk-eu-id"><small>Você</small>${rkValor(cat,eu.v)} ${rkUn(cat,eu.v)}</span><em>faltam ${rkValor(cat,falta)} ${cat.tempo?'':rkUn(cat,falta)} para o ${acima.pos}º</em>`}
    pe.hidden=false;vigia();
    if(m&&somAntes){const s=raiz.querySelector('.rk-nicho[data-i="3"] .rk-dentro img');s.src='art/os/ranking/aut-mortes-b.webp?v=2';s.classList.add('puxa');setTimeout(()=>{s.src='art/os/ranking/aut-mortes.webp?v=2';s.classList.remove('puxa')},700);dong()}
    somAntes=true;
  }
  let io;
  function vigia(){
    // a placa some enquanto o pódio ou a sua própria linha estão à vista (não cobre os pedestais)
    io&&io.disconnect();if(!('IntersectionObserver' in window))return;
    const alvos=[palco.querySelector('.rk-podio'),palco.querySelector('.rk-lista li.eu')].filter(Boolean),vis=new Map();
    io=new IntersectionObserver(es=>{es.forEach(e=>vis.set(e.target,e.isIntersecting));pe.classList.toggle('some',[...vis.values()].some(Boolean))},{root:corpo(),threshold:.35});alvos.forEach(a=>io.observe(a));
  }
  raiz.querySelectorAll('.rk-nicho').forEach(b=>b.onclick=()=>{atual=+b.dataset.i;desenha()});
  // arrastar o pódio para o lado troca a categoria
  let x0=null;palco.addEventListener('pointerdown',e=>{x0=e.clientX});palco.addEventListener('pointerup',e=>{if(x0===null)return;const dx=e.clientX-x0;x0=null;if(Math.abs(dx)>60){atual=(atual+(dx<0?1:-1)+RK_CAT.length)%RK_CAT.length;desenha()}});
  desenha();
}
