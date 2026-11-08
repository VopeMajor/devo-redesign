// Blefe por dentro. Regras e bot são os do jogo, sem alteração: os-blefe-motor.js é gerado de lib/devo/arcade/bluff.ts.
// O oponente aqui é o bot, rodando no aparelho; no jogo, online, o estado inteiro fica no servidor e cada um recebe só a própria visão.
// Leve de propósito: nada redesenha a tela. Cada carta é um elemento só (folha única de imagens), e o relógio escreve apenas quando o segundo muda.
const BL_R=BF.BLUFF_RANKS,BL_N=['espadas','copas','ouros','paus'],BL_CW=39,BL_CH=64;
function jogaBlefe(jan,{oponente,treino,aoFim,aoSair}){
  const rapido=parado||q.has('semraf'),nomeOp=oponente.split(' ')[0],seed=(Math.random()*1e9)|0;
  const nome=s=>s==='a'?'Você':nomeOp;
  const rnd=(()=>{let a=(seed^0x7b1ef)>>>0;return()=>{a=(a+0x6d2b79f5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}})();
  const tambor=(id,tam)=>`<span class="bl-tb" id="${id}" style="--t:${tam}px"><img class="t" src="art/os/blefe/tambor.png" alt="">${[0,1,2].map(i=>`<img class="b" data-i="${i}" style="--a:${i*120}deg" src="art/os/blefe/bala.png" alt="">`).join('')}</span>`;
  const o=document.createElement('div');o.className='bl';o.setAttribute('role','dialog');o.setAttribute('aria-label','Blefe');
  o.innerHTML=`<header class="mr-topo bl-topo"><button class="chanfro mr-sair" aria-label="Desistir e sair">×</button>
      <div class="mr-pl op bl-op" id="bl-op"><i class="bl-mono" aria-hidden="true">${saEsc(nomeOp.charAt(0).toUpperCase())}</i><div><small>${saEsc(nomeOp)}</small><b><span id="bl-opn">26</span> <u>cartas</u></b></div>${tambor('bl-t2',40)}</div>
      <button class="chanfro mr-sair" id="bl-feedb" aria-label="Últimas jogadas" aria-pressed="false">≡</button><button class="chanfro mr-sair" id="bl-som" aria-label="Som" aria-pressed="true">♪</button></header>
    <div class="bl-cena"><div class="bl-mesa"><img class="f" src="art/os/jogos/mesa.png" alt=""><img class="j" id="bl-jav" src="art/os/blefe/javali-convite.png" alt=""><img class="f t" src="art/os/jogos/mesa-frente.png" alt="">
        <div class="bl-pilha" id="bl-pilha" aria-hidden="true"></div>
        <div class="bl-ficha" aria-label="Valor da vez"><img src="art/os/blefe/ficha.png" alt=""><b id="bl-rk">A</b></div><span class="bl-ficha-l">valor da vez</span>
        <span class="bl-pn" id="bl-pn"></span></div>
      <ul class="bl-feed fundo" id="bl-feed" hidden aria-label="Últimas jogadas"></ul>
      <div class="mr-pops bl-pops" aria-live="polite"></div></div>
    <p class="bl-diz" id="bl-diz" aria-live="polite"></p>
    <div class="bl-eu">${tambor('bl-t1',56)}<div class="bl-bl"><small>Suas balas</small><b id="bl-bal">3 / 3</b></div>
      <div class="bl-rel"><b id="bl-seg" role="timer" aria-label="Tempo do turno"></b><u><s id="bl-bar"></s></u></div>
      <button class="chanfro bl-marca" id="bl-marca" disabled>Marcar os A</button></div>
    <div class="bl-mao" id="bl-mao" role="group" aria-label="Sua mão"></div>
    <div class="bl-acoes"><button class="chanfro bl-bt" id="bl-joga" disabled>Escolha 1 a 4 cartas</button><button class="chanfro bl-bt bad" id="bl-call" hidden><img src="art/os/blefe/bala.png" alt=""> É blefe!</button></div>`;
  jan.append(o);
  const $o=s=>o.querySelector(s),timers=new Set(),nodo=new Map();
  const depois=(f,ms)=>{const t=setTimeout(()=>{timers.delete(t);f()},ms);timers.add(t);return t};
  let s=null,sel=[],visto=0,fim=false,jav='convite',feed=['Cartas distribuídas.'],muted=false,ac=null,botT=0,relT=0,revela=false,ultSeg=-1,medida=0,mudos=0;
  /* ---- som: as mesmas receitas de lib/devo/audio.ts ---- */
  const au=()=>{if(muted)return null;try{ac=ac||new AudioContext();return ac}catch{return null}};
  const tone=(f,d,{gain=.05,type='square',slideTo=0,delay=0}={})=>{const A=au();if(!A)return;const a=A.createOscillator(),g=A.createGain(),n=A.currentTime+delay;a.type=type;a.frequency.setValueAtTime(f,n);if(slideTo)a.frequency.exponentialRampToValueAtTime(slideTo,n+d);g.gain.setValueAtTime(gain,n);g.gain.exponentialRampToValueAtTime(.0001,n+d);a.connect(g);g.connect(A.destination);a.start(n);a.stop(n+d)};
  const ruido=(d,{gain=.1,freq=1000,q=1,sweepTo=0}={})=>{const A=au();if(!A)return;const b=A.createBuffer(1,Math.ceil(A.sampleRate*d),A.sampleRate),c=b.getChannelData(0);for(let i=0;i<c.length;i++)c[i]=Math.random()*2-1;const n=A.createBufferSource(),f=A.createBiquadFilter(),g=A.createGain(),t=A.currentTime;n.buffer=b;f.type='bandpass';f.Q.value=q;f.frequency.setValueAtTime(freq,t);if(sweepTo)f.frequency.exponentialRampToValueAtTime(sweepTo,t+d);g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);n.connect(f);f.connect(g);g.connect(A.destination);n.start()};
  const SOM={card(){ruido(.07,{gain:.09,freq:2400,q:1.2,sweepTo:900});tone(240,.08,{gain:.05,type:'triangle',slideTo:160})},sel(){ruido(.03,{gain:.05,freq:3600,q:4});tone(880,.05,{gain:.02,type:'triangle'})},tiro(){ruido(.35,{gain:.3,freq:900,q:.6,sweepTo:180});tone(110,.3,{gain:.22,type:'sine',slideTo:40});tone(1760,.6,{gain:.01,delay:.05})},verdade(){tone(160,.5,{gain:.1,type:'sawtooth',slideTo:70});tone(233.1,.7,{gain:.04,type:'triangle',delay:.08})},mentira(){tone(523.3,.18,{gain:.08});tone(784,.28,{gain:.08,delay:.12});tone(1046.5,.5,{gain:.05,delay:.24})},tique(){tone(1200,.03,{gain:.05})}};
  const som=k=>{try{SOM[k]()}catch{}};
  /* ---- pequenos ajudantes: só mexem no que mudou ---- */
  const txt=(el,t)=>{if(el.textContent!==t)el.textContent=t};
  const pose=p=>{if(p!==jav){jav=p;$o('#bl-jav').src=`art/os/blefe/javali-${p}.png`}};
  const aviso=(t,tom='ouro',ms=1200)=>{const c=$o('.bl-pops'),p=document.createElement('p');p.className=`mr-pop ${tom}`;p.textContent=t;while(c.children.length>1)c.firstChild.remove();c.append(p);setTimeout(()=>p.remove(),rapido?200:ms)};
  const balas=(id,n)=>o.querySelectorAll(`#${id} .b`).forEach(b=>{b.hidden=+b.dataset.i>=n});
  const registra=l=>{feed=[l,...feed].slice(0,6);$o('#bl-feed').innerHTML=feed.map(f=>`<li>${saEsc(f)}</li>`).join('')};
  $o('#bl-feed').innerHTML=feed.map(f=>`<li>${saEsc(f)}</li>`).join('');
  /* ---- mão: uma folha de imagens, e cada carta só muda de lugar ---- */
  const carta=c=>{
    const b=document.createElement('button');b.className='bl-c';b.dataset.id=c.id;b.style.setProperty('--fx',c.r);b.style.setProperty('--fy',c.s);b.setAttribute('aria-label',`${BL_R[c.r]} de ${BL_N[c.s]}`);b.setAttribute('aria-pressed','false');
    b.onclick=()=>marca(c.id);return b;
  };
  function pintaMao(){
    const m=$o('#bl-mao'),h=s?s.hands.a:[],W=m.clientWidth||340,esc=W>=620?2:1.5,cw=BL_CW*esc,chh=BL_CH*esc;m.style.setProperty('--esc',esc);
    const vivos=new Set(h.map(c=>c.id));for(const[id,el]of nodo)if(!vivos.has(id)){el.remove();nodo.delete(id)}
    const rows=Math.max(1,Math.ceil(h.length/13)),per=Math.max(1,Math.ceil(h.length/rows)),gap=Math.round(chh*.46);
    m.style.height=`${chh+(rows-1)*gap+10}px`;
    h.forEach((c,idx)=>{
      let el=nodo.get(c.id);if(!el){el=carta(c);nodo.set(c.id,el);m.append(el);if(!rapido){el.classList.add('dar');el.style.setProperty('--i',Math.min(idx,20));setTimeout(()=>el.classList.remove('dar'),900)}}
      const r=Math.floor(idx/per),i=idx-r*per,k=Math.min(per,h.length-r*per),sp=k>1?Math.min(cw*.62,(W-cw-6)/(k-1)):0,x=W/2-cw/2+(i-(k-1)/2)*sp,y=r*gap;
      el.style.setProperty('--x',`${Math.round(x)}px`);el.style.setProperty('--y',`${y}px`);el.style.zIndex=r*100+i;
    });
    mudos=h.length;$o('#bl-mao').setAttribute('aria-label',`Sua mão: ${h.length} cartas`);
  }
  function pintaSel(){
    const pode=minhaVez()&&!pendente();
    for(const[id,el]of nodo){const on=sel.includes(id),c=s.hands.a.find(x=>x.id===id);el.classList.toggle('sel',on);el.setAttribute('aria-pressed',String(on));el.classList.toggle('ok',!!c&&c.r===s.rk&&pode);el.disabled=!pode}
    const rk=BL_R[s.rk],j=$o('#bl-joga');
    if(pendente()&&minhaVez()){j.textContent='Deixar vencer';j.disabled=false;j.classList.add('fan')}
    else{j.classList.remove('fan');j.textContent=sel.length?`Jogar ${sel.length} como ${rk}`:'Escolha 1 a 4 cartas';j.disabled=!pode||!sel.length}
    const mk=$o('#bl-marca');txt(mk,`Marcar os ${rk}`);mk.disabled=!pode;
    const cb=$o('#bl-call'),quem=minhaVez()&&s.last&&s.last.side==='b';cb.hidden=!quem;cb.disabled=s.bul.a<1;cb.lastChild.textContent=s.bul.a<1?' Sem balas':' É blefe!';
  }
  const marca=id=>{if(!minhaVez()||pendente())return;som('sel');sel=sel.includes(id)?sel.filter(x=>x!==id):sel.length>=4?sel:[...sel,id];pintaSel()};
  /* ---- pilha na mesa ---- */
  function pintaPilha(){
    const p=$o('#bl-pilha'),n=s?Math.min(12,s.pile.length):0;
    while(p.children.length>n)p.lastChild.remove();
    while(p.children.length<n){const i=p.children.length,e=document.createElement('i');e.style.setProperty('--r',`${((i*53+11)%37)-18}deg`);e.style.setProperty('--dx',`${((i*29+5)%13)-6}%`);e.style.setProperty('--dy',`${((i*17+3)%11)-5-i*1.2}%`);if(!rapido)e.className='nova';p.append(e)}
    const t=s?s.pile.length:0;txt($o('#bl-pn'),t?`${t} ${t===1?'carta':'cartas'}`:'');
  }
  /* ---- turno ---- */
  const agora=()=>Date.now();
  const minhaVez=()=>!!s&&s.winner===null&&s.turn==='a'&&agora()>=s.holdUntil&&!revela;
  const pendente=()=>BF.bluffPending(s);
  function diz(){
    const e=$o('#bl-diz');if(!s)return;
    let h='';const L=s.last,rk=BL_R[s.rk];
    if(s.winner!==null)h='Fim de jogo.';
    else if(minhaVez()&&L&&L.side==='b')h=pendente()?`${saEsc(nomeOp)} jogou a última carta. ${s.bul.a>0?'Chame blefe agora, ou ele vence.':'Sem balas, você só pode deixá-lo vencer.'}`:`${saEsc(nomeOp)} diz <b>${L.n} × ${BL_R[L.rank]}</b>. ${s.bul.a>0?`Acredite e jogue ${rk}, ou chame blefe.`:`Você está sem balas. Jogue ${rk}.`}`;
    else if(minhaVez())h=`Sua vez. Jogue cartas como <b>${rk}</b> (mentir vale).`;
    else if(s.turn==='b'&&!revela)h=L&&L.side==='a'?`Você disse <b>${L.n} × ${BL_R[L.rank]}</b>. ${saEsc(nomeOp)} está pensando…`:`${saEsc(nomeOp)} está pensando…`;
    h=`<span>${h}</span>`;if(e.innerHTML!==h)e.innerHTML=h;e.classList.toggle('me',minhaVez());
  }
  function pinta(){
    if(!s)return;
    txt($o('#bl-opn'),String(s.hands.b.length));txt($o('#bl-rk'),BL_R[s.rk]);txt($o('#bl-bal'),`${s.bul.a} / 3`);
    balas('bl-t1',s.bul.a);balas('bl-t2',s.bul.b);$o('#bl-op').classList.toggle('lid',s.turn==='b'&&s.winner===null);
    if(mudos!==s.hands.a.length||[...nodo.keys()].some(id=>!s.hands.a.some(c=>c.id===id))||s.hands.a.some(c=>!nodo.has(c.id)))pintaMao();
    sel=sel.filter(id=>s.hands.a.some(c=>c.id===id));
    pintaPilha();pintaSel();diz();ultSeg=-1;relogio();
    if(!revela&&s.winner===null)pose(s.turn==='a'?'pensativo':s.hands.b.length<=3?'trama':'neutro');
  }
  function relogio(){
    clearTimeout(relT);if(!s||s.winner!==null||fim)return;
    const dl=Math.max(s.turnAt,s.holdUntil)+BF.BLUFF_TURN_MS,left=Math.max(0,dl-agora()),seg=Math.ceil(left/1000),meu=minhaVez();
    if(seg!==ultSeg){
      ultSeg=seg;const e=$o('#bl-seg');txt(e,revela?'':`${meu?'Sua vez':nomeOp} · ${seg}s`);e.classList.toggle('perigo',meu&&left<6000);
      const b=$o('#bl-bar');b.style.transform=`scaleX(${Math.min(1,left/BF.BLUFF_TURN_MS).toFixed(3)})`;b.className=meu&&left<6000?'perigo':meu?'meu':'';
      if(meu&&seg<=5&&seg>0)som('tique');
    }
    relT=setTimeout(relogio,(left%1000||1000)+5);
  }
  /* ---- quem joga a seguir ---- */
  function agenda(){
    clearTimeout(botT);if(!s||s.winner!==null||fim)return;
    const t=agora();
    if(s.turn==='b')botT=setTimeout(()=>{BF.bluffBotMove(s,'b',Date.now(),rnd);depoisDoLance()},Math.max(0,s.holdUntil-t)+900+rnd()*1300);
    else{
      const due=Math.max(s.turnAt,s.holdUntil)+BF.BLUFF_TURN_MS+1600-t;
      botT=setTimeout(()=>{BF.bluffTimeout(s,Date.now());depoisDoLance()},Math.max(0,due));
      if(agora()<s.holdUntil)depois(pinta,s.holdUntil-agora()+10);
    }
  }
  function depoisDoLance(){
    const ev=s.ev;
    if(ev&&ev.seq>visto){
      visto=ev.seq;
      if(ev.t==='play'){som('card');registra(`${nome(ev.side)}${ev.auto?' (tempo esgotado)':''} jogou ${ev.n} × ${BL_R[ev.rank]}.`);if(ev.side==='b'&&ev.n>=3)aviso(`${ev.n} × ${BL_R[ev.rank]}?`,'neutro',900)}
      else if(ev.t==='call'){registra(`${nome(ev.caller)} chamou blefe: ${ev.truth?'era verdade':'era mentira'}. ${nome(ev.loser)} recolheu ${ev.taken}.`);revelacao(ev)}
      else registra(`${nome(ev.side)} deixou passar.`);
    }
    pinta();agenda();
    if(s.winner!==null&&!fim){
      fim=true;clearTimeout(botT);clearTimeout(relT);
      const lc=ev&&ev.t==='call'?ev:null,wait=rapido?200:lc?BF.bluffRevealMs(lc.cards.length)+400:1800;
      if(!lc)pose(s.winner==='a'?'desdem':'riso');
      depois(()=>{const me=BF.bluffScore(s,'a'),op=BF.bluffScore(s,'b');limpa();o.remove();aoFim({result:s.winner==='a'?'win':'loss',score:me.score,oppScore:op.score,stats:me.stats})},wait);
    }
  }
  /* ---- a revelação: as cartas viram, o revólver decide ---- */
  function revelacao(ev){
    revela=true;som('tiro');try{navigator.vibrate?.(40)}catch{}
    const n=ev.cards.length,vd=rapido?0:(n*.6+.95)*1000,total=rapido?300:BF.bluffRevealMs(n);
    pose('sombrio');
    const r=document.createElement('div');r.className=`bl-rev ${ev.truth?'':'mentira'}`;r.setAttribute('role','alert');
    r.innerHTML=`<small>${saEsc(nome(ev.liar))} jogou ${n} × ${BL_R[ev.rank]} · ${saEsc(nome(ev.caller))} duvidou</small>
      <div class="bl-rc">${ev.cards.map(c=>`<i class="bl-rv" data-r="${c.r}" data-s="${c.s}" data-ok="${c.r===ev.rank?1:0}" role="img" aria-label="${BL_R[c.r]} de ${BL_N[c.s]}"></i>`).join('')}</div>
      <div class="bl-veredito" hidden>${ev.truth?'Era verdade':'Blefe!'}</div>
      <div class="bl-arma" hidden>${tambor('bl-t3',84)}<img class="clarao" src="art/os/blefe/clarao.png" alt="" hidden><img class="fumo" src="art/os/blefe/fumaca.png" alt="" hidden></div>
      <p class="bl-ev" hidden>${ev.bullet==='back'?`Bala devolvida a ${saEsc(nome(ev.caller))}`:`Bala perdida · ${saEsc(nome(ev.caller))} fica com ${ev.left}`}</p>
      <p class="bl-rec" hidden>${saEsc(nome(ev.loser))} recolhe ${ev.taken} ${ev.taken===1?'carta':'cartas'}${ev.burned>0?` · <img src="art/os/blefe/cinzas.png" alt=""> ${ev.burned} queimadas`:''}</p>`;
    o.append(r);
    r.querySelectorAll('.bl-rv').forEach((c,i)=>depois(()=>{c.classList.add('vira');depois(()=>{c.style.setProperty('--fx',c.dataset.r);c.style.setProperty('--fy',c.dataset.s);c.classList.add('aberta');c.classList.toggle('certa',c.dataset.ok==='1');c.classList.toggle('falsa',c.dataset.ok!=='1');som('sel')},rapido?0:110)},rapido?0:i*600+350));
    depois(()=>{
      const v=r.querySelector('.bl-veredito');v.hidden=false;som(ev.truth?'verdade':'mentira');pose(ev.truth?'desdem':'riso');
      try{navigator.vibrate?.(ev.loser==='a'?[60,40,60]:30)}catch{}
      if(!ev.truth&&!rapido){r.classList.add('treme');setTimeout(()=>r.classList.remove('treme'),300)}
    },vd);
    depois(()=>{
      const a=r.querySelector('.bl-arma');a.hidden=false;
      const antes=ev.bullet==='lost'?ev.left+1:ev.left-1;
      r.querySelectorAll('#bl-t3 .b').forEach(b=>{b.hidden=+b.dataset.i>=Math.max(antes,0)});
      depois(()=>{
        if(ev.bullet==='lost'){
          const b=r.querySelector(`#bl-t3 .b[data-i="${ev.left}"]`);if(b)b.src='art/os/blefe/gasta.png';
          const c=r.querySelector('.clarao'),f=r.querySelector('.fumo');c.hidden=false;f.hidden=false;som('tiro');if(!rapido){r.querySelector('#bl-t3').classList.add('gira')}depois(()=>{c.hidden=true},140);
        }else{const b=r.querySelector(`#bl-t3 .b[data-i="${ev.left-1}"]`);if(b){b.hidden=false;b.classList.add('volta')}}
        r.querySelector('.bl-ev').hidden=false;
      },rapido?0:260);
    },rapido?0:vd+150);
    depois(()=>{r.querySelector('.bl-rec').hidden=false},rapido?0:vd+700);
    depois(()=>{r.remove();revela=false;pinta();agenda()},total);
  }
  /* ---- ações ---- */
  $o('#bl-joga').onclick=()=>{
    if(!minhaVez())return;
    if(pendente()){if(BF.bluffPass(s,'a',Date.now()))depoisDoLance();return}
    if(!sel.length)return;
    const ids=sel;sel=[];if(BF.bluffPlay(s,'a',ids,Date.now()))depoisDoLance();
  };
  $o('#bl-call').onclick=()=>{if(minhaVez()&&s.last&&s.last.side==='b'&&s.bul.a>0&&BF.bluffCall(s,'a',Date.now()))depoisDoLance()};
  $o('#bl-marca').onclick=()=>{if(!minhaVez()||pendente())return;som('sel');sel=s.hands.a.filter(c=>c.r===s.rk).slice(0,4).map(c=>c.id);pintaSel()};
  $o('#bl-feedb').onclick=e=>{const f=$o('#bl-feed');f.hidden=!f.hidden;e.currentTarget.setAttribute('aria-pressed',String(!f.hidden))};
  $o('#bl-som').onclick=e=>{muted=!muted;e.currentTarget.setAttribute('aria-pressed',String(!muted));e.currentTarget.classList.toggle('off',muted)};
  function limpa(){clearTimeout(botT);clearTimeout(relT);for(const t of timers)clearTimeout(t);timers.clear();ro.disconnect();try{ac?.close()}catch{}}
  $o('.mr-sair').onclick=()=>{fim=true;limpa();o.remove();aoSair()};
  const ro=new ResizeObserver(()=>{const w=$o('#bl-mao').clientWidth;if(w!==medida){medida=w;if(s)pintaMao()}});ro.observe($o('#bl-mao'));
  /* ---- começo ---- */
  function comeca(){
    s=BF.bluffNew(seed,Date.now());
    const lim=+q.get('blmao');if(lim){s.hands.a=s.hands.a.slice(0,lim);s.hands.b=s.hands.b.slice(0,lim)}
    pinta();agenda();
    if(q.has('blteste'))window.__bl={estado:()=>({turno:s.turn,minha:minhaVez(),pendente:pendente(),rk:s.rk,last:s.last&&{side:s.last.side,n:s.last.n,rank:s.last.rank},mao:s.hands.a.map(c=>({id:c.id,r:c.r})),op:s.hands.b.length,bul:{...s.bul},pilha:s.pile.length,winner:s.winner,revela,calls:{...s.calls},hits:{...s.hits},sel})};
  }
  if(rapido)comeca();
  else{const c=document.createElement('div');c.className='mr-conta';c.setAttribute('role','status');o.append(c);let n=3;const p=()=>{c.innerHTML=`<b>${n||'JÁ'}</b>`;c.setAttribute('aria-label',n?String(n):'Já');if(n===0){depois(()=>{c.remove();comeca()},400);return}n--;depois(p,650)};p()}
}
