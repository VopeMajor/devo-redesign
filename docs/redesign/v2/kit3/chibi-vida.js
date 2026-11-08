// Vida do chibi (dono, 02/11 e 05/11; revisado por crítico de animação). Usa a folha de folhaAndar (avatar-cor.js):
// 0 parado · 1..8 passos · 9 assentar · 10 piscar · 11 peito · 12/13/14 olhar com a cabeça (esquerda, direita, frente).
// Tudo em quadros de pixel inteiro; nada de girar, escalar ou desfocar o sprite.
// Relógio único: 1 tique = 80 ms. Andando: o ciclo avança pela distância no eixo que a perna mostra (de lado, x; de
// frente e de costas, y), para o pé não patinar; começa com o pé saindo do chão; ao parar, 1 tique assentado.
// Passos com som baixo (na Casa) ou poeira (lá fora, nas Torres). Parado: respira (peito), pisca (às vezes duas
// vezes) e de vez em quando olha para o lado só com a cabeça. Balões em pixel desenhados aqui ("!", "?", "…", "♪",
// gota de suor), que seguem o chibi. Nada disso acontece com cartão, viagem, visita ou mapa abertos.
// Usa os globais do motor da Casa e das Torres: eu, ator, sombra e o #mundo. window.chibiBalao(tipo) para os gatilhos.
(function(){
  if(typeof eu==='undefined'||typeof ator==='undefined')return;
  const calmo=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const mundo=document.getElementById('mundo');
  const fora=/torres/.test(location.pathname); // lá fora há poeira; dentro de casa, só o som do passo
  const TIQUE=.08;
  const css=document.createElement('style');
  css.textContent=`.pe-poeira{position:absolute;width:2px;height:2px;margin:-1px 0 0 -1px;background:rgba(214,204,232,.45);pointer-events:none;animation:pe-poeira .4s steps(4) forwards}
  @keyframes pe-poeira{to{transform:translate(var(--dx),-3px);opacity:0}}
  .chibi-balao{position:absolute;width:40px;height:40px;margin:-138px 0 0 2px;pointer-events:none;image-rendering:pixelated;background-size:320px 240px;z-index:9999}
  .sombra{border-radius:0!important;clip-path:polygon(15% 0,85% 0,100% 33%,100% 67%,85% 100%,15% 100%,0 67%,0 33%)}`;
  document.head.append(css);

  /* ---- balões em pixel, desenhados num canvas: 8 quadros de 20x20 por linha, uma linha por tipo ---- */
  const TIPOS=['!','?','…','♪','gota','zz'];
  const folhaBalao=(()=>{
    const c=document.createElement('canvas');c.width=160;c.height=120;const x=c.getContext('2d');
    const TINTA='#231832',CONT='#c9b78e',POR='#f4eee6';
    const px=(a,b,w=1,h=1,cor=POR)=>{x.fillStyle=cor;x.fillRect(a,b,w,h)};
    function balao(ox,oy,t){ // t: 0..1 abrindo
      if(t<=0)return;const w=Math.round(4+12*t),h=Math.round(3+10*t),l=ox+10-(w>>1),top=oy+14-h;
      x.fillStyle=CONT;x.fillRect(l-1,top,w+2,h);x.fillRect(l,top-1,w,h+2);
      x.fillStyle=TINTA;x.fillRect(l,top,w,h);
      if(t>=1){px(ox+9,oy+15,2,1,CONT);px(ox+9,oy+14,2,1,TINTA);px(ox+8,oy+16,1,1,CONT)}
    }
    const icone={
      '!':(ox,oy,f)=>{const s=f===4?-1:0;px(ox+9,oy+4+s,2,5);px(ox+9,oy+10+s,2,2)},
      '?':(ox,oy,f)=>{const s=f===5?1:0;px(ox+8+s,oy+4,4,1);px(ox+12+s,oy+5,1,2);px(ox+10+s,oy+7,2,1);px(ox+10+s,oy+8,1,1);px(ox+10+s,oy+10,1,2)},
      '…':(ox,oy,f)=>{const n=Math.min(3,f-2);for(let k=0;k<n;k++)px(ox+6+k*3,oy+9,2,2)},
      '♪':(ox,oy,f)=>{const s=f%2?-1:0;px(ox+11,oy+4+s,1,6);px(ox+12,oy+4+s,2,1);px(ox+13,oy+5+s,1,1);px(ox+9,oy+9+s,2,2)},
      zz:(ox,oy,f)=>{px(ox+7,oy+5,4,1);px(ox+9,oy+6,1,1);px(ox+8,oy+7,1,1);px(ox+7,oy+8,4,1);if(f>=5){px(ox+12,oy+3,3,1);px(ox+13,oy+4,1,1);px(ox+12,oy+5,3,1)}},
    };
    TIPOS.forEach((tp,lin)=>{for(let f=0;f<8;f++){const ox=f*20,oy=lin*20;
      if(tp==='gota'){if(f<7){const g=oy+5+Math.min(f,4);px(ox+14,g,2,3,'#9fd3e8');px(ox+14,g-1,1,1,'#9fd3e8');px(ox+15,g+2,1,1,'#5c8ea8')}continue}
      balao(ox,oy,f===7?.5:Math.min(1,(f+1)/3));if(f>=3&&f<7)icone[tp](ox,oy,f)}});
    return c.toDataURL();
  })();
  const bal=document.createElement('i');bal.className='chibi-balao';bal.hidden=true;bal.style.backgroundImage=`url(${folhaBalao})`;mundo.append(bal);
  let balT=null,balTipo=0,balQ=0;
  window.chibiBalao=tipo=>{const k=TIPOS.indexOf(tipo);if(k<0)return;balTipo=k;balQ=calmo?5:0;balT=0;bal.hidden=false};
  // tempos de cada quadro do balão, em tiques: abre 0..2, ícone 3..6, fecha 7
  const BAL_Q=[1,1,1,1,2,2,2,1];

  /* ---- sons: passos baixos dentro de casa ---- */
  let ac=null;
  function passoSom(alto){
    if(calmo)return;try{ac=ac||window.__devoAudio||(window.__devoAudio=new (window.AudioContext||window.webkitAudioContext)());if(ac.state!=='running')return;
      const t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();o.type='triangle';o.frequency.setValueAtTime(alto?150:130,t);o.frequency.exponentialRampToValueAtTime(70,t+.06);
      g.gain.setValueAtTime(.03,t);g.gain.exponentialRampToValueAtTime(.0001,t+.08);o.connect(g).connect(ac.destination);o.start(t);o.stop(t+.09)}catch{}
  }
  function poeira(lado){
    const p=document.createElement('i');p.className='pe-poeira';
    p.style.left=Math.round(eu.x+lado*4)+'px';p.style.top=Math.round(eu.y-1)+'px';p.style.zIndex=Math.round(eu.y)-1;
    p.style.setProperty('--dx',lado*3+'px');mundo.append(p);setTimeout(()=>p.remove(),420);
  }
  // algo aberto por cima da casa: o chibi fica quieto (não olha, não balança)
  const ocupado=()=>['cartao','viagem','casa'].some(id=>{const e=document.getElementById(id);return e&&!e.hidden})||!!document.querySelector('.visita')||document.hidden;

  /* ---- máquina de estados do parado ---- */
  let t0=performance.now(),andado=0,quadroAnt=-1,passos=0,andava=false,xAnt=eu.x,yAnt=eu.y,assenta=0;
  let parado=0,proxPisca=1.5+Math.random()*3,pisca=0,piscaDupla=false,proxOlha=5+Math.random()*5,olhando=0,colOlha=0,respT=0;
  function laco(t){
    const dt=Math.min(.05,(t-t0)/1000);t0=t;
    const anda=eu.rota.length>0;
    let col=COL.parado,sobe=false;
    if(anda){
      if(!andava)andado=6; // começa com o pé saindo do chão
      const lado=eu.dir===1||eu.dir===2,dx=Math.abs(eu.x-xAnt),dy=Math.abs(eu.y-yAnt);
      andado+=(lado?Math.max(dx,dy*.35):Math.max(dy,dx*.35))/PX_QUADRO;parado=0;olhando=0;
      const k=Math.floor(andado)%8;col=1+k;sobe=(ANDAR_BOB[eu.dir]||[])[k]<0;
      if(k!==quadroAnt&&k%4===0){passos++;if(fora){if(passos%2===0&&!calmo)poeira(k===0?-1:1)}else passoSom(k===0)}
      quadroAnt=k;assenta=0;
    }else{
      if(andava)assenta=TIQUE; // ao parar, 1 tique assentado
      quadroAnt=-1;andado=0;parado+=dt;
      if(assenta>0){assenta-=dt;col=COL.assenta}
      else if(!calmo&&!ocupado()){
        // respira: peito sobe por ~0,9 s a cada 2,6 s
        respT=(respT+dt)%2.6;const peito=respT>1.7;
        // pisca: fecha 1-2 tiques a cada 2,5-6 s; 15% das vezes duas vezes
        proxPisca-=dt;if(proxPisca<=0&&pisca<=0){pisca=TIQUE*1.5;piscaDupla=Math.random()<.15;proxPisca=2.5+Math.random()*3.5}
        // pisca > 0: olho fechado; pisca < 0: intervalo da piscada dupla. Ao fim de cada piscada volta a 0 (antes ficava
        // negativo e o chibi piscava sem parar depois da primeira piscada dupla)
        if(pisca>0){pisca-=dt;if(pisca<=0){if(piscaDupla){piscaDupla=false;pisca=-TIQUE}else pisca=0}}else if(pisca<0){pisca+=dt;if(pisca>=0)pisca=TIQUE*1.2}
        // olha para o lado só com a cabeça, segura 1-1,6 s; de costas não olha
        proxOlha-=dt;if(proxOlha<=0&&olhando<=0&&eu.dir!==3){olhando=1+Math.random()*.6;colOlha=eu.dir===0?(Math.random()<.5?COL.olhaE:COL.olhaD):COL.olhaF;/* de lado: vira a cabeça (antigo) ou olha para trás (fofo), sempre visível */proxOlha=6+Math.random()*7;
          if(Math.random()<.2)window.chibiBalao(Math.random()<.5?'?':'…')}
        if(olhando>0){olhando-=dt;col=colOlha}
        else if(pisca>0&&eu.dir!==3)col=peito&&COL.piscaPeito?COL.piscaPeito:COL.pisca;
        else if(peito)col=COL.peito;
      }
    }
    andava=anda;
    if(ator.dataset.andar)ator.style.backgroundPosition=`-${col*80}px -${eu.dir*96}px`;
    xAnt=eu.x;yAnt=eu.y;
    // sombra em pixel: 2 px mais estreita quando o corpo sobe
    sombra.style.width=sobe?'38px':'';sombra.style.marginLeft=sobe?'-19px':'';sombra.style.transform='';
    // balão segue o chibi
    if(balT!==null){
      balT+=dt;while(balT>=BAL_Q[balQ]*TIQUE&&balQ<8){balT-=BAL_Q[balQ]*TIQUE;balQ++}
      if(balQ>=8||(calmo&&balT>1.2)){bal.hidden=true;balT=null}
      else{bal.style.backgroundPosition=`-${(calmo?5:balQ)*40}px -${balTipo*40}px`;bal.style.left=Math.round(eu.x)+'px';bal.style.top=Math.round(eu.y)+'px'}
    }
    requestAnimationFrame(laco);
  }
  requestAnimationFrame(laco);
})();
