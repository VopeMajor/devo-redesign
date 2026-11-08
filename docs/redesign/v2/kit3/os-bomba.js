// Bomba Quente por dentro. Física, rodadas, pontos e eventos são os do jogo (components/devo/arcade/games/hot-bomb.tsx, lib/devo/arcade/rooms.ts).
// O oponente aqui é o bot do próprio jogo, rodando no aparelho; no jogo, online, quem decide o dono da bomba é o servidor.
// Leve de propósito: um canvas pequeno ampliado em pixel, sem 3D. Arena, sala e peças são imagens já prontas, e a tela fica em pé no celular.
const BQ_R=9.5,BQ_PONTOS=3,BQ_CONTA=3200,BQ_BOOM=2600,BQ_COOLDOWN=.9,BQ_FUSE_MIN=14,BQ_FUSE_SPAN=10;
const BQ_U=10.5,BQ_K=.72,BQ_ALTO=.85;           // pixels por unidade, achatamento do chão e altura na tela
const BQ_CW=36,BQ_CH=48,BQ_PE=46;               // célula dos personagens e linha dos pés
const BQ_ARTE=['coelho','urso','arena','sala','bomba','bomba2','bumper','bumper2','plinto','bola','poste-b','poste-n','poeira','fogo','explosao'];
const bqRng=seed=>{let a=seed>>>0;return()=>{a=(a+0x6d2b79f5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}};
const bqNorm=(x,y)=>{const l=Math.hypot(x,y);return l>1?[x/l,y/l]:[x,y]};
const bqCl=(x,a,b)=>Math.min(b,Math.max(a,x));
const BQ_FOGO=['#a3121f','#ff6670','#ece5d8','#fff4e0'],BQ_PO=['#ece5d8','#fff4e0','#bab09f'],BQ_CONF=['#f1f0ee','#bab09f','#38393c','#ece5d8','#2c2c31','#8a7cc8','#c2b9ec'];
let bqImgs=null;
function bqCarrega(){
  if(bqImgs)return bqImgs;
  bqImgs=Promise.all(BQ_ARTE.map(n=>new Promise(r=>{const i=new Image();i.onload=()=>r([n,i]);i.onerror=()=>r([n,null]);i.src=`art/os/bomba/${n}.png`}))).then(l=>Object.fromEntries(l));
  return bqImgs;
}
function jogaBomba(jan,{oponente,treino,aoFim,aoSair}){
  const seed=(Math.random()*1e9)|0,skill=treino?.4:.75,nomeOp=oponente.split(' ')[0];
  const o=document.createElement('div');o.className='bq';o.setAttribute('role','dialog');o.setAttribute('aria-label','Bomba Quente');
  o.innerHTML=`<header class="mr-topo bq-topo"><button class="chanfro mr-sair" aria-label="Desistir e sair">×</button>
      <div class="mr-pl eu"><small>Você · Coelho</small><span class="bq-pips" id="bq-s1" aria-label="0 pontos"></span></div>
      <div class="bq-nivel" title="Inclinação do chão" aria-hidden="true"><i></i></div>
      <div class="mr-pl op"><small>${saEsc(nomeOp)} · Urso</small><span class="bq-pips" id="bq-s2" aria-label="0 pontos"></span></div></header>
    <p class="bq-st" id="bq-st" aria-live="polite"></p>
    <div class="bq-area"><canvas></canvas><div class="bq-pad"></div><div class="bq-msg" aria-live="polite"></div>
      <div class="bq-jb" hidden><i></i></div><button class="bq-pula chanfro" aria-label="Pular">PULA</button><button class="bq-som chanfro" aria-pressed="true" aria-label="Som">♪</button></div>
    <div class="bq-entrada fundo"><img class="bq-capa" src="art/os/jogos/capa-bomb.png" alt=""><small>${treino?'Treino · Sala de Jogos':'Partida · Sala de Jogos'}</small><h2>Bomba Quente</h2>
      <p>Dois jogadores, uma bomba. Passe-a para o outro antes que ela exploda! Quem estiver com ela quando estourar perde o ponto. Vence quem fizer ${BQ_PONTOS} pontos.</p>
      <p class="bq-voce"><img src="art/os/bomba/coelho.png" alt="" class="bq-mini">Você é o <b>Coelho</b></p>
      <ul><li>Celular: arraste o polegar na tela para andar e toque em PULA.</li><li>Teclado: WASD ou setas para mover · Espaço ou Enter para pular.</li></ul>
      <button class="r-bt chanfro s-forte s-larga" id="bq-joga">Jogar</button><button class="r-link" id="bq-volta">Sair</button></div>`;
  jan.append(o);
  const $o=s=>o.querySelector(s),cv=$o('canvas'),x=cv.getContext('2d',{alpha:false}),area=$o('.bq-area');
  let A=null,fim=false,raf=0,muted=false,img=null,ac=null,W=232,H=375,CX=116,CY=138;

  /* ---- som: os mesmos bipes sintetizados do jogo ---- */
  const snd=(f,d=.08,ty='square',v=.05,sl=0)=>{
    if(muted)return;
    try{ac=ac||new AudioContext();const a=ac.createOscillator(),g=ac.createGain(),n=ac.currentTime;a.type=ty;a.frequency.setValueAtTime(f,n);if(sl)a.frequency.exponentialRampToValueAtTime(Math.max(30,f+sl),n+d);g.gain.setValueAtTime(v,n);g.gain.exponentialRampToValueAtTime(.0001,n+d);a.connect(g);g.connect(ac.destination);a.start();a.stop(n+d)}catch{}
  };
  /* ---- mundo ---- */
  const P=[0,1].map(i=>({i,side:i?'b':'a',sheet:i?'urso':'coelho',x:0,z:0,y:0,vx:0,vz:0,kx:0,kz:0,face:0,dir:0,flip:false,jv:0,sq:0,fly:0,jr:0,rot:0})),ME=P[0],OPP=P[1];
  const OB=[{x:0,z:0,r:.8,h:1,bump:false,pop:0,art:'plinto'}];
  for(let i=0;i<5;i++){const a=i/5*6.283+.3;OB.push({x:Math.cos(a)*5.6,z:Math.sin(a)*5.6,r:.7,h:.9,bump:true,pop:0,art:'bumper'})}
  // As barras do jogo são os ponteiros deste relógio.
  const SW=[0,1].map(i=>({a:i*1.5,w:i?-1.2:1.5,len:BQ_R*.75,cor:i?['#efe6d8','#b5ab99','#5f5a50','#d9cfba']:['#d9b25c','#a07c34','#4f3d18','#f2cf7a']}));
  const POSTES=Array.from({length:16},(_,i)=>{const a=i/16*6.283+.2;return{x:Math.cos(a)*(BQ_R+.5),z:Math.sin(a)*(BQ_R+.5),art:i%2?'poste-b':'poste-n',i}});
  const NP=220,pd=Array.from({length:NP},()=>({l:0,m:1,x:0,y:0,z:0,vx:0,vy:0,vz:0,s:1,c:'#fff'}));let pi=0;
  const balls=[],waves=[],later=[];
  let state='menu',cd=0,lastN=0,shake=0,inv=0,swT=0,bp=0,onP=0,T=0,seenRound=0,boomRound=0,boomT=0,lastHolder=null,lastWins='',sched=[],evIdx=0,botWob=0,tiltWarn=false,tbUntil=0,rseed=0,flashA=0,prev=0;
  const tl=[0,0],tilt={m:0,dx:0,dz:0},keys={},joy={x:0,y:0};
  const burst=(bx,by,bz,n,sp,h,rg=.12)=>{
    for(let k=0;k<n;k++){
      pi=(pi+1)%NP;const p=pd[pi],a=Math.random()*6.28,e=-.2+Math.random()*1.2,s=(.3+Math.random()*.7)*sp;
      p.x=bx;p.y=by;p.z=bz;p.vx=Math.cos(a)*s*(1-e*.4);p.vz=Math.sin(a)*s*(1-e*.4);p.vy=Math.abs(e)*s+2;p.l=p.m=.5+Math.random()*.7;p.s=Math.random()<.3?3:2;
      const l=h<.15?(rg>=.1?BQ_FOGO:BQ_PO):BQ_CONF;p.c=l[Math.floor(Math.random()*l.length)];
    }
  };
  const eventos=(s,round)=>{const r=bqRng(s+round*977),out=[];let t=4+r()*2;while(t<40){out.push({t,e:Math.floor(r()*EV.length),r:bqRng(s+round*977+Math.floor(t*100))});t+=5+r()*3}return out};
  const fuseMs=round=>Math.round((BQ_FUSE_MIN+bqRng(seed+round*131)()*BQ_FUSE_SPAN)*1000);
  const primeiro=round=>bqRng(seed+round*71)()<.5?'a':'b';
  const outro=s=>s==='a'?'b':'a';
  /* ---- mensagens ---- */
  let msgT=0;
  const msg=(t,ms=1500,tom='ouro')=>{const c=$o('.bq-msg');c.innerHTML='';const p=document.createElement('p');p.className=`mr-pop ${tom}`;p.textContent=t;c.append(p);clearTimeout(msgT);msgT=setTimeout(()=>{p.remove()},ms)};
  const pips=(el,n)=>{el.innerHTML=Array.from({length:BQ_PONTOS},(_,i)=>`<i class="${i<n?'on':''}"></i>`).join('');el.setAttribute('aria-label',`${n} ${n===1?'ponto':'pontos'}`)};
  const EV=[
    ['TERREMOTO!',()=>{shake=1;for(const p of P){p.kx+=-10+Math.random()*20;p.kz+=-10+Math.random()*20}}],
    ['CHUVA DE BOLAS!',(r,now)=>{for(let i=0;i<9;i++)later.push({at:now+i*180,fn:()=>{const a=r()*6.28,d=r()*BQ_R*.8;balls.push({x:Math.cos(a)*d,y:14,z:Math.sin(a)*d,vx:-3+r()*6,vy:0,vz:-3+r()*6,l:11})}})}],
    ['BARRAS TURBO!',()=>{swT=5}],
    ['CONTROLES INVERTIDOS!',()=>{inv=4}],
    ['FOGOS DE ARTIFÍCIO!',(r,now)=>{for(let i=0;i<5;i++){const fx=-8+r()*16,fy=5+r()*4,fz=-8+r()*12,h=r();later.push({at:now+i*250,fn:()=>burst(fx,fy,fz,40,6,h)})}}],
    ['CHÃO INSTÁVEL!',(_r,now)=>{tbUntil=now+3000}],
  ];
  /* ---- rodadas: o aparelho faz o papel do servidor ---- */
  function comeca(){
    const now=Date.now(),passAt=now+BQ_CONTA;
    A={round:1,holder:primeiro(1),passAt,explodeAt:passAt+fuseMs(1),phase:'play',boomAt:0,wins:{a:0,b:0},score:{a:0,b:0},passes:{a:0,b:0},clutch:{a:0,b:0}};
    snd(600,.1,'triangle',.1,300);$o('.bq-entrada').remove();
  }
  function acabou(){
    fim=true;
    const meu=A.wins.a,dele=A.wins.b,w=meu>dele?'a':'b';
    const c=document.createElement('div');c.className='bq-fim';c.setAttribute('role','status');c.innerHTML=`<small>Fim de partida</small><h2>${w==='a'?'O Coelho venceu':'O Urso venceu'}</h2><p>Placar: ${meu} × ${dele}</p>`;o.append(c);
    setTimeout(()=>{limpa();o.remove();aoFim({result:meu>dele?'win':'loss',score:Math.min(2500,A.score.a),oppScore:A.score.b,stats:{passes:A.passes.a,clutch:A.clutch.a,roundsWon:meu,roundsLost:dele}})},parado?300:2600);
  }
  function servidor(now){
    if(!A||fim)return;
    if(A.phase==='play'&&now>=A.explodeAt){const w=outro(A.holder);A.phase='boom';A.boomAt=now;A.wins[w]+=1;A.score[w]+=300}
    else if(A.phase==='boom'&&now>=A.boomAt+BQ_BOOM){
      if(A.wins.a>=BQ_PONTOS||A.wins.b>=BQ_PONTOS)return acabou();
      A.round+=1;A.holder=primeiro(A.round);A.phase='play';A.passAt=now+BQ_CONTA;A.explodeAt=A.passAt+fuseMs(A.round);
    }
  }
  function novaRodada(){
    seenRound=A.round;lastN=0;cd=0;inv=swT=0;lastHolder=A.holder;sched=eventos(seed,A.round);evIdx=0;later.length=0;balls.length=0;tiltWarn=false;tbUntil=0;rseed=bqRng(seed+A.round*131)()*6.28;
    for(const p of P){p.x=p.i?4:-4;p.z=3;p.vx=p.vz=p.kx=p.kz=0;p.y=0;p.jv=0;p.fly=0;p.rot=0;p.face=p.i?-1.2:1.2}
    status();
  }
  function status(){
    const e=$o('#bq-st');if(!A)return;
    const meu=A.holder==='a';e.textContent=meu?`A bomba é sua. Encoste em ${nomeOp} para passar.`:`A bomba está com ${nomeOp}. Fuja.`;e.className='bq-st'+(meu?' meu':'');
  }
  function boom(holder){
    boomT=0;const p=P[holder==='a'?0:1];p.fly=1;
    burst(p.x,1,p.z,110,12,.02,.14);burst(p.x,1,p.z,40,8,.12,.1);
    shake=1.4;flashA=parado?0:.65;snd(150,.7,'sawtooth',.25,-110);msg('BUUUM!',2000,'perigo');waves.push({x:p.x,z:p.z,t:0});
    try{navigator.vibrate?.([40,30,80])}catch{}
  }
  /* ---- entrada ---- */
  const input=()=>{
    const v=bqNorm((keys.KeyD||keys.ArrowRight||0)-(keys.KeyA||keys.ArrowLeft||0)+joy.x,(keys.KeyS||keys.ArrowDown||0)-(keys.KeyW||keys.ArrowUp||0)+joy.y);
    return inv>0?[-v[0],-v[1]]:v;
  };
  const JK=new Set(['Space','Enter','ShiftRight']);
  const kd=e=>{keys[e.code]=1;if(e.code.startsWith('Arrow')||e.code==='Space')e.preventDefault();if(!e.repeat&&JK.has(e.code)&&A)ME.jr=.15};
  const ku=e=>{keys[e.code]=0};
  addEventListener('keydown',kd);addEventListener('keyup',ku);
  const pad=$o('.bq-pad'),jb=$o('.bq-jb');let toque=null,tx=0,ty=0;
  pad.addEventListener('pointerdown',e=>{if(toque!==null)return;pad.setPointerCapture(e.pointerId);toque=e.pointerId;const r=area.getBoundingClientRect();tx=e.clientX;ty=e.clientY;jb.style.left=`${tx-r.left}px`;jb.style.top=`${ty-r.top}px`;jb.hidden=false});
  pad.addEventListener('pointermove',e=>{if(e.pointerId!==toque)return;const v=bqNorm((e.clientX-tx)/55,(e.clientY-ty)/55);joy.x=v[0];joy.y=v[1];jb.firstChild.style.transform=`translate(${v[0]*44}px,${v[1]*44}px)`});
  const solta=e=>{if(e.pointerId!==toque)return;toque=null;joy.x=joy.y=0;jb.hidden=true;jb.firstChild.style.transform=''};
  pad.addEventListener('pointerup',solta);pad.addEventListener('pointercancel',solta);
  $o('.bq-pula').addEventListener('pointerdown',e=>{e.preventDefault();ME.jr=.15});
  $o('.bq-som').onclick=e=>{muted=!muted;e.currentTarget.setAttribute('aria-pressed',String(!muted));e.currentTarget.classList.toggle('off',muted)};
  /* ---- física: igual à do jogo ---- */
  function bot(){
    botWob+=1/60;
    const dx=ME.x-OPP.x,dz=ME.z-OPP.z,d=Math.hypot(dx,dz)||.01;let ix,iz;
    if(A.holder===OPP.side){ix=dx/d;iz=dz/d}
    else{const ax=-dx/d,az=-dz/d,wob=Math.sin(botWob*1.7)*.8,r=Math.hypot(OPP.x,OPP.z)/BQ_R;ix=ax-az*wob-OPP.x*.12*r;iz=az+ax*wob-OPP.z*.12*r}
    const v=bqNorm(ix,iz),k=.72+skill*.28;return[v[0]*k,v[1]*k];
  }
  function fisica(p,ix,iz,pode,holder,dt){
    let fl=0;
    for(const ob of OB)if(Math.hypot(p.x-ob.x,p.z-ob.z)<ob.r+.15&&p.y>=ob.h-.3)fl=Math.max(fl,ob.h);
    if(p.jr>0)p.jr-=dt;
    if(pode&&!p.fly&&p.y<=fl+.02&&p.jr>0){p.jv=11.5;p.jr=0;snd(420,.15,'triangle',.1,500);burst(p.x,fl+.1,p.z,6,3,.1,.05)}
    if(!p.fly){p.jv-=32*dt;p.y+=p.jv*dt;if(p.y<=fl){if(p.jv<-7){burst(p.x,fl+.1,p.z,8,3.5,.1,.05);p.sq=1}p.y=fl;p.jv=0}}
    const up=Math.max(0,-(ix*tilt.dx+iz*tilt.dz)),sp=(holder===p.side?5.9:5.2)*(1-up*tilt.m*1.2),k=Math.min(1,10*dt);
    p.vx+=(ix*sp-p.vx)*k;p.vz+=(iz*sp-p.vz)*k;
    if(!p.fly&&p.y<=fl+.05){p.kx+=tl[0]*42*dt;p.kz+=tl[1]*42*dt}
    const kdp=Math.exp(-4.5*dt);p.kx*=kdp;p.kz*=kdp;
    p.x+=(p.vx+p.kx)*dt;p.z+=(p.vz+p.kz)*dt;
    const r=Math.hypot(p.x,p.z);
    if(r>BQ_R-.55){const nx=p.x/r,nz=p.z/r;p.x=nx*(BQ_R-.55);p.z=nz*(BQ_R-.55);const d=p.kx*nx+p.kz*nz;if(d>0){p.kx-=1.8*d*nx;p.kz-=1.8*d*nz}}
    for(const ob of OB){
      const dx=p.x-ob.x,dz=p.z-ob.z,d=Math.hypot(dx,dz),mr=ob.r+.5;
      if(d<mr&&d>0&&p.y<ob.h-.3){const nx=dx/d,nz=dz/d;p.x=ob.x+nx*mr;p.z=ob.z+nz*mr;if(ob.bump){p.kx=nx*13;p.kz=nz*13;ob.pop=1;burst(p.x,.6,p.z,10,5,Math.random());snd(300,.1,'sine',.12,300)}}
    }
    for(const s of SW){
      const dx=Math.cos(s.a),dz=-Math.sin(s.a),t=bqCl(p.x*dx+p.z*dz,-s.len,s.len),ex=p.x-dx*t,ez=p.z-dz*t,d=Math.hypot(ex,ez);
      if(d<.78&&d>0&&p.y<.75){p.x=dx*t+ex/d*.78;p.z=dz*t+ez/d*.78;p.kx=ex/d*11;p.kz=ez/d*11;burst(p.x,.7,p.z,6,4,.55);snd(220,.08,'square',.06,-80)}
    }
  }
  function passeFx(){
    const[a,b]=P,dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz)||.01;cd=BQ_COOLDOWN;
    a.kx=-dx/d*9;a.kz=-dz/d*9;b.kx=dx/d*9;b.kz=dz/d*9;
    burst((a.x+b.x)/2,1,(a.z+b.z)/2,24,6,Math.random());snd(500,.12,'triangle',.12,500);shake=Math.max(shake,.35);status();
    try{navigator.vibrate?.(25)}catch{}
  }
  function passo(dt){
    T+=dt;const now=Date.now();
    servidor(now);if(fim)return;
    if(!A)state='menu';
    else{
      if(A.round!==seenRound)novaRodada();
      state=A.phase==='boom'||(now>=A.explodeAt&&A.phase==='play')?'boom':now<A.passAt?'cd':'play';
      if(state==='boom'&&boomRound!==A.round){boomRound=A.round;boom(A.holder)}
      const w=`${A.wins.a}:${A.wins.b}`;
      if(w!==lastWins){lastWins=w;pips($o('#bq-s1'),A.wins.a);pips($o('#bq-s2'),A.wins.b)}
    }
    const holder=A&&state!=='menu'?A.holder:null;
    shake=Math.max(0,shake-dt*1.2);inv=Math.max(0,inv-dt);swT=Math.max(0,swT-dt);cd-=dt;flashA=Math.max(0,flashA-dt*1.8);
    for(let i=later.length-1;i>=0;i--)if(now>=later[i].at){later[i].fn();later.splice(i,1)}
    for(const s of SW)s.a+=s.w*dt*(swT>0?2.6:1);
    if(state==='cd'){const n=Math.min(3,Math.ceil((A.passAt-now)/1000));if(n!==lastN&&n>0){lastN=n;msg(String(n),900,'neutro');snd(440,.1,'square',.08)}}
    if(state==='play'){
      if(lastN>0){lastN=0;msg('VAI!',900);snd(880,.2,'square',.08)}
      const ev=sched[evIdx];
      if(ev&&now>=A.passAt+ev.t*1000){evIdx+=1;const e=EV[ev.e];msg(e[0],1800,'neutro');snd(200,.3,'sawtooth',.08,300);e[1](ev.r,now)}
      if(lastHolder!==null&&A.holder!==lastHolder)passeFx();
      lastHolder=A.holder;
    }
    if(state==='boom')boomT+=dt;
    /* chão inclinado */
    let ta=0,tdir=0;
    if(state==='play'){
      const age=(now-A.passAt)/1000,ramp=bqCl((age-3.5)/9,0,1),tb=Math.max(0,(tbUntil-now)/1000);
      ta=ramp*Math.min(.2+.035*(A.wins.a+A.wins.b),.34)+(tb>0?.12*Math.min(1,tb):0);tdir=rseed+age*.5+Math.sin(age*.8)*1.3;
    }
    const tk=Math.min(1,2.5*dt);tl[0]+=(Math.cos(tdir)*ta-tl[0])*tk;tl[1]+=(Math.sin(tdir)*ta-tl[1])*tk;
    tilt.m=Math.hypot(tl[0],tl[1]);tilt.dx=tilt.m>.001?tl[0]/tilt.m:0;tilt.dz=tilt.m>.001?tl[1]/tilt.m:0;
    if(state==='play'&&tilt.m>.07&&!tiltWarn){tiltWarn=true;msg('O CHÃO ESTÁ CEDENDO!',1700,'perigo');snd(90,.6,'sawtooth',.07,-30)}
    const pt=$o('.bq-nivel i');pt.style.transform=`translate(${(tl[0]/.34*12).toFixed(0)}px,${(tl[1]/.34*12).toFixed(0)}px)`;pt.className=tilt.m>.22?'perigo':tilt.m>.1?'meio':'';
    for(const p of P){
      let ix=0,iz=0;
      if(state==='play'&&!p.fly){
        const v=p===ME?input():bot();ix=v[0];iz=v[1];
        if(p!==ME&&p.y<=.02&&Math.random()<dt*(.4+skill)){
          for(const s of SW){const t=bqCl(p.x*Math.cos(s.a)-p.z*Math.sin(s.a),-s.len,s.len);if(Math.hypot(p.x-Math.cos(s.a)*t,p.z+Math.sin(s.a)*t)<1.6)p.jr=.15}
        }
      }
      fisica(p,ix,iz,state==='play',holder,dt);
    }
    const[a,b]=P,dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz)||.01;
    if(state==='play'&&d<1.1&&Math.abs(a.y-b.y)<.9){
      if(cd<=0){const from=A.holder;A.passes[from]+=1;A.score[from]+=20;if(A.explodeAt-now<2000){A.clutch[from]+=1;A.score[from]+=100;msg('CLUTCH',900)}A.holder=outro(from)}
      else if(d<1){const c=(1-d)/2;a.x-=dx/d*c;a.z-=dz/d*c;b.x+=dx/d*c;b.z+=dz/d*c}
    }
    for(let i=balls.length-1;i>=0;i--){
      const q=balls[i];q.l-=dt;q.vy-=22*dt;
      if(q.y<.6){q.vx+=tl[0]*34*dt;q.vz+=tl[1]*34*dt}
      q.x+=q.vx*dt;q.y+=q.vy*dt;q.z+=q.vz*dt;
      if(q.y<.35){q.y=.35;q.vy=Math.abs(q.vy)*.85}
      const r=Math.hypot(q.x,q.z);
      if(r>BQ_R-.4){const nx=q.x/r,nz=q.z/r,v=q.vx*nx+q.vz*nz;if(v>0){q.vx-=2*v*nx;q.vz-=2*v*nz}}
      for(const ob of OB){const ex=q.x-ob.x,ez=q.z-ob.z,e=Math.hypot(ex,ez);if(e<ob.r+.35&&e>0){const nx=ex/e,nz=ez/e,v=q.vx*nx+q.vz*nz;if(v<0){q.vx-=2*v*nx;q.vz-=2*v*nz}}}
      if(state!=='cd')for(const p of P){const ex=p.x-q.x,ez=p.z-q.z,e=Math.hypot(ex,ez);if(e<.85&&q.y<1.3&&e>0&&!p.fly&&p.y<.9){p.kx+=ex/e*8;p.kz+=ez/e*8;q.vx=-ex/e*7;q.vz=-ez/e*7;q.vy=5;snd(380,.08,'sine',.1,200)}}
      if(q.l<=0)balls.splice(i,1);
    }
    for(let i=waves.length-1;i>=0;i--){waves[i].t+=dt;if(waves[i].t>.7)waves.splice(i,1)}
    for(const p of P){
      const sp=Math.hypot(p.vx,p.vz);
      if(sp>.4){if(Math.abs(p.vx)>Math.abs(p.vz)*.8){p.dir=2;p.flip=p.vx<0}else p.dir=p.vz>0?0:1}
      if(p.fly){p.y+=15*dt;p.rot+=dt*14}
      p.sq=Math.max(0,p.sq-dt*5);
    }
    for(const ob of OB)if(ob.bump)ob.pop=Math.max(0,ob.pop-dt*4);
    for(const q of pd)if(q.l>0){q.l-=dt;q.vy-=14*dt;q.x+=q.vx*dt;q.y=Math.max(.1,q.y+q.vy*dt);q.z+=q.vz*dt}
    if(A&&holder&&state==='play'){
      const fr=bqCl((A.explodeAt-Math.max(now,A.passAt))/Math.max(1,A.explodeAt-A.passAt),0,1),fq=2+(1-fr)*(1-fr)*16;
      bp+=fq*dt;const on=Math.sin(bp*6.283)>0?1:0;if(on&&!onP)snd(900+(1-fr)*600,.05,'square',.04);onP=on;
    }else if(state==='cd'){bp+=2*dt;onP=Math.sin(bp*6.283)>0?1:0}
    o.classList.toggle('perigo',!!(A&&state==='play'&&A.holder==='a'&&A.explodeAt-now<2500));
  }
  /* ---- desenho: uma passada por quadro, sem pedir nada à placa de vídeo além de copiar imagens ---- */
  const scr=(wx,wy,wz)=>{const h=-(wx*tl[0]+wz*tl[1]);return[CX+wx*BQ_U,CY+wz*BQ_U*BQ_K-(wy+h)*BQ_U*BQ_ALTO]};
  const lista=[];
  const poli=(pts,cor)=>{ // preenche sem suavizar, linha a linha
    let y0=1e9,y1=-1e9;for(const p of pts){y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1])}
    x.fillStyle=cor;
    for(let y=Math.ceil(y0);y<=Math.floor(y1);y++){
      let a=1e9,b=-1e9;
      for(let i=0;i<pts.length;i++){const p=pts[i],q=pts[(i+1)%pts.length];if((p[1]<=y&&q[1]>=y)||(q[1]<=y&&p[1]>=y)){const t=q[1]===p[1]?0:(y-p[1])/(q[1]-p[1]),xx=p[0]+(q[0]-p[0])*t;a=Math.min(a,xx);b=Math.max(b,xx)}}
      if(b>=a)x.fillRect(Math.round(a),y,Math.max(1,Math.round(b)-Math.round(a)),1);
    }
  };
  const sombra=(wx,wz,r)=>{const[sx,sy]=scr(wx,0,wz),w=Math.round(r*BQ_U*2),h=Math.max(2,Math.round(w*BQ_K*.6));x.fillStyle='rgba(0,0,0,.42)';for(let i=0;i<h;i++){const t=(i+.5)/h*2-1,l=Math.round(w*Math.sqrt(1-t*t));x.fillRect(Math.round(sx-l/2),Math.round(sy-h/2+i),l,1)}};
  function desenhaPersonagem(p){
    const s=img[p.sheet];if(!s)return;
    const sp=Math.hypot(p.vx,p.vz),k=Math.min(sp/5,1),hold=A&&A.holder===p.side&&state!=='boom',tleft=A?(A.explodeAt-Date.now())/1000:99;
    let col=hold?3:0;
    if(!hold&&sp>.6){const c=Math.floor(T*9+p.i)%4;col=c===0?1:c===2?2:0}
    const air=p.y>.1&&!p.fly;if(air&&!hold)col=1;
    const hop=Math.abs(Math.sin(T*11+p.i))*.2*k*(p.y<.05?1:0),jit=hold&&tleft<2.5?Math.round(Math.sin(T*70)):0;
    const[sx,sy]=scr(p.x,p.y+hop,p.z);
    const st=(air?bqCl(p.jv*.015,-.12,.2):0)-p.sq*.25,dw=BQ_CW,dh=Math.round(BQ_CH*(1+st));
    if(p.fly){
      const e=Math.max(0,1-boomT/1.4);if(e<=0)return;
      x.save();x.translate(Math.round(sx),Math.round(sy-20));x.rotate(p.rot);x.scale(e,e);x.drawImage(s,col*BQ_CW,p.dir*BQ_CH,BQ_CW,BQ_CH,-BQ_CW/2,-BQ_PE/2,BQ_CW,BQ_CH);x.restore();return;
    }
    const px=Math.round(sx-dw/2)+jit,py=Math.round(sy-BQ_PE*(dh/BQ_CH));
    if(p.dir===2&&p.flip){x.save();x.translate(px+dw,py);x.scale(-1,1);x.drawImage(s,col*BQ_CW,2*BQ_CH,BQ_CW,BQ_CH,0,0,dw,dh);x.restore()}
    else x.drawImage(s,col*BQ_CW,p.dir*BQ_CH,BQ_CW,BQ_CH,px,py,dw,dh);
    const topo=py+2;
    if(hold&&(state==='play'||state==='cd'))desenhaBomba(sx+jit,topo);
    else if(p===ME&&state!=='boom'){x.fillStyle='#a795ec';const my=topo-6+Math.round(Math.sin(T*5));for(let i=0;i<3;i++)x.fillRect(Math.round(sx)-2+i,my+i,5-2*i,1)}
    if(hold&&tleft<5&&state==='play'){x.fillStyle='#cbc5e8';x.fillRect(Math.round(sx+7),topo+8+Math.round((T*1.6%1)*7),1,2)}
  }
  function desenhaBomba(sx,topo){
    const b=onP?img.bomba2:img.bomba;if(!b)return;
    const fr=A?bqCl((A.explodeAt-Math.max(Date.now(),A.passAt))/Math.max(1,A.explodeAt-A.passAt),0,1):1,pul=onP?1:0,w=b.width+pul*2,h=b.height+pul*2,bx=Math.round(sx-w/2),by=Math.round(topo-h+1+Math.sin(T*6));
    x.drawImage(b,bx,by,w,h);
    const f=Math.round(fr*4),fa=[1,3][Math.floor(T*20)%2];x.fillStyle='#fff4e0';x.fillRect(bx+w-5+f-2,by-1-f+1,fa,fa);x.fillStyle='#ff6670';x.fillRect(bx+w-6+f-2,by+1-f+1,1,1);
  }
  function desenha(){
    const sk=shake*3,ox=Math.round((Math.random()-.5)*sk),oy=Math.round((Math.random()-.5)*sk);
    x.setTransform(1,0,0,1,0,0);x.imageSmoothingEnabled=false;
    x.fillStyle='#07070a';x.fillRect(0,0,W,H);
    if(img.sala){
      const sx=Math.round(CX-170)+ox,sy=Math.round(CY-287)+oy;x.drawImage(img.sala,sx,sy);
      // janela mais larga que a sala: o mesmo cenário espelhado nas laterais
      if(W>340){x.save();x.scale(-1,1);x.drawImage(img.sala,-sx,sy);x.drawImage(img.sala,-sx-680,sy);x.restore()}
    }
    const ccx=CX,ccy=CY;CX+=ox;CY+=oy;
    if(img.arena){
      const aw=img.arena.width,ah=img.arena.height,b=tl[0]*BQ_ALTO,d=1+tl[1]*BQ_ALTO/BQ_K;
      x.setTransform(1,b,0,d,CX,CY);x.drawImage(img.arena,-aw/2,-Math.round((BQ_R+.8)*BQ_U*BQ_K));x.setTransform(1,0,0,1,0,0);
    }
    for(const p of P)if(!p.fly){const e=Math.max(.3,1-p.y*.2);sombra(p.x,p.z,.55*e)}
    if(A&&(state==='play'||state==='cd')){const p=P[A.holder==='a'?0:1],[sx,sy]=scr(p.x,0,p.z),r=13+onP*2;x.fillStyle=onP?'#ff6a5a':'#a3121f';for(let i=0;i<28;i++){const an=i/28*6.283;x.fillRect(Math.round(sx+Math.cos(an)*r),Math.round(sy+Math.sin(an)*r*BQ_K),2,1)}}
    for(const q of balls)sombra(q.x,q.z,.3);
    // objetos em ordem de profundidade, para um passar por trás do outro
    lista.length=0;
    for(const ob of OB)lista.push({z:ob.z,t:0,ob});
    for(const po of POSTES)lista.push({z:po.z,t:1,po});
    for(const s of SW){const dx=Math.cos(s.a),dz=-Math.sin(s.a),n=8;for(let i=0;i<n;i++){const t0=-s.len+i/n*2*s.len,t1=t0+2*s.len/n;lista.push({z:(t0+t1)/2*dz,t:2,s,t0,t1,dx,dz,ponta:i===0?-1:i===n-1?1:0})}}
    for(const q of balls)lista.push({z:q.z,t:3,q});
    for(const p of P)lista.push({z:p.z+(p.fly?100:0),t:4,p});
    lista.sort((a,b)=>a.z-b.z);
    for(const it of lista){
      if(it.t===0){const ob=it.ob,im=ob.bump&&ob.pop>.2?img.bumper2:img[ob.art];if(!im)continue;const[sx,sy]=scr(ob.x,0,ob.z);x.drawImage(im,Math.round(sx-im.width/2),Math.round(sy-im.height+im.height*.32))}
      else if(it.t===1){const po=it.po,im=img[po.art];if(!im)continue;const[sx,sy]=scr(po.x,0,po.z),h=Math.round(im.height*(1+.35*Math.abs(Math.sin(T*4+po.i*.9))));x.drawImage(im,Math.round(sx-im.width/2),Math.round(sy-h+3),im.width,h)}
      else if(it.t===2){
        const{s,t0,t1,dx,dz,ponta}=it,nx=-dz*.36,nz=dx*.36,ALT=.9;
        // a ponta do ponteiro afina em lança
        const fa=ponta===-1?0:1,fb=ponta===1?0:1,a=[t0*dx+nx*fa,t0*dz+nz*fa],b=[t1*dx+nx*fb,t1*dz+nz*fb],c=[t1*dx-nx*fb,t1*dz-nz*fb],e=[t0*dx-nx*fa,t0*dz-nz*fa];
        const front=nz>0?[a,b]:[e,c],back=nz>0?[e,c]:[a,b],topo=[a,b,c,e].map(v=>scr(v[0],ALT,v[1]));
        poli([scr(front[0][0],.1,front[0][1]),scr(front[1][0],.1,front[1][1]),scr(front[1][0],ALT,front[1][1]),scr(front[0][0],ALT,front[0][1])],s.cor[2]);
        poli(topo,s.cor[0]);
        const fio=(p0,p1,cor)=>{const q0=scr(p0[0],ALT,p0[1]),q1=scr(p1[0],ALT,p1[1]),n=Math.ceil(Math.max(Math.abs(q1[0]-q0[0]),Math.abs(q1[1]-q0[1])));x.fillStyle=cor;for(let i=0;i<=n;i++){const k=n?i/n:0;x.fillRect(Math.round(q0[0]+(q1[0]-q0[0])*k),Math.round(q0[1]+(q1[1]-q0[1])*k),1,1)}};
        fio(front[0],front[1],s.cor[1]);fio(back[0],back[1],s.cor[3]);
        if(!ponta){const m=scr((t0+t1)/2*dx,ALT,(t0+t1)/2*dz);x.fillStyle=s.cor[2];x.fillRect(Math.round(m[0])-1,Math.round(m[1])-1,2,2)}
      }
      else if(it.t===3){const q=it.q,im=img.bola;if(!im)continue;const[sx,sy]=scr(q.x,q.y,q.z),e=q.l<1?Math.max(.1,q.l):1;x.drawImage(im,Math.round(sx-im.width*e/2),Math.round(sy-im.height*e),im.width*e,im.height*e)}
      else desenhaPersonagem(it.p);
    }
    for(const w of waves){const[sx,sy]=scr(w.x,.4,w.z),r=(1+w.t*22)*BQ_U*.7;x.fillStyle=`rgba(236,229,216,${Math.max(0,1-w.t*1.6).toFixed(2)})`;for(let i=0;i<56;i++){const an=i/56*6.283;x.fillRect(Math.round(sx+Math.cos(an)*r),Math.round(sy+Math.sin(an)*r*BQ_K),2,2)}}
    if(state==='boom'&&boomT<.55&&img.explosao){const p=P[A.holder==='a'?0:1],[sx,sy]=scr(p.x,0,p.z),e=.5+boomT*2.2,w=img.explosao.width*e,h=img.explosao.height*e;x.globalAlpha=Math.min(1,(.55-boomT)*4);x.drawImage(img.explosao,Math.round(sx-w/2),Math.round(sy-h*.7),w,h);x.globalAlpha=1}
    for(const q of pd)if(q.l>0){const[sx,sy]=scr(q.x,q.y,q.z),e=q.l/q.m;x.fillStyle=q.c;const z=e>.5?q.s:1;x.fillRect(Math.round(sx),Math.round(sy),z,z)}
    CX=ccx;CY=ccy;
    if(flashA>.01){x.fillStyle=`rgba(255,255,255,${flashA.toFixed(2)})`;x.fillRect(0,0,W,H)}
  }
  /* ---- laço e medidas ---- */
  function medida(){
    const r=area.getBoundingClientRect();if(!r.width)return;
    const arenaW=(BQ_R+.8)*BQ_U*2+16,alto=(BQ_R+.8)*BQ_U*BQ_K*2+78,px=Math.max(1,Math.round(Math.min(r.width/arenaW,r.height/alto)*4)/4);
    W=Math.ceil(r.width/px);H=Math.ceil(r.height/px);cv.width=W;cv.height=H;
    const retrato=r.height/r.width>1.1,meia=(BQ_R+.8)*BQ_U*BQ_K;
    CX=Math.round(W/2);CY=Math.round(retrato?Math.min(meia+100,H/2):Math.max(meia+58,H/2+18));
    x.imageSmoothingEnabled=false;
  }
  const ro=new ResizeObserver(medida);ro.observe(area);
  function laco(t){
    if(fim&&!o.isConnected)return;
    const ms=t-prev,dt=Math.min(ms/1000,.05);prev=t;
    if(!fim)passo(dt);
    desenha();
    raf=requestAnimationFrame(laco);
  }
  function limpa(){cancelAnimationFrame(raf);ro.disconnect();removeEventListener('keydown',kd);removeEventListener('keyup',ku);clearTimeout(msgT);try{ac?.close()}catch{}}
  for(const p of P){p.x=p.i?4:-4;p.z=3}
  pips($o('#bq-s1'),0);pips($o('#bq-s2'),0);
  $o('.mr-sair').onclick=()=>{fim=true;limpa();o.remove();aoSair()};
  $o('#bq-volta').onclick=()=>{fim=true;limpa();o.remove();aoSair()};
  $o('#bq-joga').onclick=()=>comeca();
  bqCarrega().then(l=>{img=l;medida();prev=performance.now();raf=requestAnimationFrame(laco)});
  // Só para o teste automático (?bqteste): o que está em jogo.
  if(q.has('bqteste'))window.__bq={estado:()=>({state,round:A&&A.round,holder:A&&A.holder,wins:A&&{...A.wins},score:A&&{...A.score},passes:A&&{...A.passes},clutch:A&&{...A.clutch},me:[ME.x,ME.z,ME.y],op:[OPP.x,OPP.z,OPP.y],explodeEm:A?A.explodeAt-Date.now():0,W,H,fim})};
}
