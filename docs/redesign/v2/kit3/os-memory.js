// Memory Rush por dentro. Fases, pontos, teto e tempo são os do jogo (lib/devo/arcade/games.ts, games/memory-rush.tsx).
// O oponente aqui é simulado no aparelho; no jogo, online, quem decide os pares é o servidor.
// Leve de propósito: nada redesenha a tela inteira. O relógio só escreve quando o segundo muda, e cada carta só muda de classe.
const MR_FASES=[10,8,6,4],MR_TOTAL=120000,MR_TETO=6000,MR_ERRO=50;
const MR_GRADE={20:[5,4],16:[4,4],12:[4,3],8:[4,2]};
const mrPar=c=>100+50*(Math.min(c,5)-1);
function mrBaralho(fase){
  const emb=l=>{for(let i=l.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[l[i],l[j]]=[l[j],l[i]]}return l};
  const s=emb(Array.from({length:13},(_,i)=>i)).slice(0,MR_FASES[fase]);
  return emb([...s,...s]).map((sym,i)=>({id:fase*100+i,sym,dono:null}));
}
function jogaMemory(jan,{oponente,treino,aoFim,aoSair}){
  const rapido=parado||q.has('semraf');
  const o=document.createElement('div');o.className='mr';o.setAttribute('role','dialog');o.setAttribute('aria-label','Memory Rush');
  o.innerHTML=`<img class="mr-fundo" src="art/os/memory/mesa.png" alt="">
    <header class="mr-topo"><button class="chanfro mr-sair" aria-label="Desistir e sair">×</button>
      <div class="mr-pl eu"><small>Você</small><b id="mr-s">0</b></div>
      <div class="mr-meio"><b id="mr-t" role="timer" aria-label="Tempo restante">02:00</b><small id="mr-f">Fase 1/4 · 10 pares</small></div>
      <div class="mr-pl op"><small>${saEsc(oponente.split(' ')[0])}</small><b id="mr-so">0</b></div></header>
    <div class="mr-status"><span id="mr-pares" aria-label="0 a 0 pares">0 <u>×</u> 0</span><span class="mr-combo" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><em id="mr-lin">Empate</em></div>
    <div class="mr-area"><div class="mr-grade" id="mr-g"></div></div>
    <div class="mr-pops" aria-live="polite"></div>`;
  jan.append(o);
  const $o=s=>o.querySelector(s),grade=$o('#mr-g');
  const me={s:0,pares:0,combo:0,melhor:0,erros:0},op={s:0,pares:0,combo:0};
  let fase=0,cartas=[],abertas=[],travado=false,fim=false,corre=false,ate=0,ultSeg=-1,atras=false,errosFase=0,ultimos=false,tent=0;
  const timers=new Set();
  const espera=(f,ms)=>{const t=setTimeout(()=>{timers.delete(t);if(!fim||f.semFim)f()},ms);timers.add(t);return t};
  const nodo=new Map();
  const noTeto=n=>Math.max(0,Math.min(MR_TETO,n));
  function aviso(txt,tom='ouro',ms=1100){
    const c=$o('.mr-pops'),p=document.createElement('p');p.className=`mr-pop ${tom}`;p.textContent=txt;
    while(c.children.length>1)c.firstChild.remove();
    c.append(p);setTimeout(()=>p.remove(),rapido?300:ms);
  }
  function placar(){
    $o('#mr-s').textContent=noTeto(me.s);$o('#mr-so').textContent=noTeto(op.s);
    $o('#mr-pares').innerHTML=`${me.pares} <u>×</u> ${op.pares}`;$o('#mr-pares').setAttribute('aria-label',`${me.pares} a ${op.pares} pares`);
    o.querySelectorAll('.mr-combo i').forEach((x,i)=>x.classList.toggle('on',i<Math.min(me.combo,5)));
    const d=me.s-op.s,l=$o('#mr-lin');
    l.textContent=d<0&&d>=-150?`Você está a ${-d} pontos`:d<0?'Adversário está na frente':d>0?'Você está na frente':'Empate';
    l.className=d>0?'lid':d<0?(ultimos?'perigo':'atras'):'';
    o.querySelector('.mr-pl.eu').classList.toggle('lid',d>0);o.querySelector('.mr-pl.op').classList.toggle('lid',d<0);
    if(d<=-150)atras=true;if(atras&&d>0){atras=false;aviso('Comeback')}
  }
  function monta(){
    const [c,r]=MR_GRADE[cartas.length];grade.style.setProperty('--c',c);grade.style.setProperty('--r',r);
    grade.innerHTML='';nodo.clear();
    cartas.forEach((k,i)=>{
      const b=document.createElement('button');b.className='mr-c';b.setAttribute('aria-label','Carta virada');b.style.setProperty('--i',Math.min(i,20));
      b.innerHTML=`<img class="v" src="art/os/memory/verso.png" alt=""><span class="f"><img src="art/os/memory/frente.png" alt=""><img class="s" src="art/os/memory/s${k.sym}.png" alt=""></span>`;
      b.onclick=()=>vira(k);grade.append(b);nodo.set(k.id,b);
    });
    grade.classList.remove('entra');void grade.offsetWidth;if(!rapido)grade.classList.add('entra');
    $o('#mr-f').textContent=`${fase===MR_FASES.length-1?'Fase final':`Fase ${fase+1}/${MR_FASES.length}`} · ${MR_FASES[fase]} pares`;
  }
  const pinta=(k,cls,on=true)=>nodo.get(k.id)?.classList.toggle(cls,on);
  function faisca(k,tom){
    if(rapido)return;
    const b=nodo.get(k.id);if(!b)return;
    const g=document.createElement('i');g.className=`mr-fa ${tom}`;g.setAttribute('aria-hidden','true');
    g.innerHTML=Array.from({length:8},(_,i)=>`<u style="--a:${i*45}deg"></u>`).join('');b.append(g);setTimeout(()=>g.remove(),480);
  }
  function vira(k){
    if(!corre||travado||k.dono||abertas.includes(k))return;
    abertas.push(k);pinta(k,'aberta');nodo.get(k.id).setAttribute('aria-label','Carta revelada');
    if(abertas.length<2)return;
    const [a,b]=abertas;
    if(a.sym===b.sym){
      me.combo++;const pts=mrPar(me.combo),antes=me.s;me.s+=pts;me.pares++;me.melhor=Math.max(me.melhor,me.combo);
      for(const c of [a,b]){c.dono='me';pinta(c,'minha');faisca(c,'ouro')}
      abertas=[];
      if(me.combo>=2)aviso(`Combo x${Math.min(me.combo,5)}`,'ouro',800);
      if(ultimos&&me.s>op.s&&antes<=op.s)aviso('Clutch');
      placar();confere();
    }else{
      travado=true;errosFase++;me.erros++;me.combo=0;me.s=Math.max(0,me.s-MR_ERRO);placar();
      a&&b&&[a,b].forEach(c=>pinta(c,'errada'));
      if(!rapido){o.classList.add('treme');setTimeout(()=>o.classList.remove('treme'),220)}
      try{navigator.vibrate?.(30)}catch{}
      espera(()=>{[a,b].forEach(c=>{pinta(c,'aberta',false);pinta(c,'errada',false);nodo.get(c.id).setAttribute('aria-label','Carta virada')});abertas=[];travado=false},620);
    }
  }
  function confere(){
    if(!cartas.every(c=>c.dono))return;
    if(errosFase===0)aviso('Perfect');
    errosFase=0;
    if(fase+1>=MR_FASES.length){espera(acaba,500);return}
    fase++;
    espera(()=>{cartas=mrBaralho(fase);abertas=[];travado=false;monta()},rapido?0:700);
    aviso(fase===MR_FASES.length-1?'Fase final':`Fase ${fase+1}`,'neutro');
  }
  // o oponente simulado: no treino é didático e erra à vista; valendo Tempo, é mais rápido e tem memória
  function botProx(){
    const d=treino?(tent===0?5000:Math.max(3500,5500-tent*150)+Math.random()*900):Math.max(2000,3400-tent*60)+Math.random()*1200;
    espera(()=>{
      const livres=cartas.filter(c=>!c.dono&&!abertas.includes(c));
      if(livres.length>=2){
        const acerto=treino?(tent<3?0:Math.min(.55,.2+(tent-3)*.05)):Math.min(.7,.3+tent*.02);
        const p=livres[Math.floor(Math.random()*livres.length)],par=livres.find(c=>c.sym===p.sym&&c!==p),errados=livres.filter(c=>c.sym!==p.sym);
        if(par&&Math.random()<acerto){
          op.combo++;op.s+=mrPar(op.combo);op.pares++;p.dono=par.dono='op';
          for(const c of [p,par]){pinta(c,'dele');pinta(c,'chega');faisca(c,'violeta');setTimeout(()=>pinta(c,'chega',false),700)}
          aviso('Oponente encontrou um par!','violeta',1000);placar();confere();
        }else if(errados.length){
          const x=errados[Math.floor(Math.random()*errados.length)];
          if(treino){for(const c of [p,x])pinta(c,'espia');setTimeout(()=>{for(const c of [p,x])pinta(c,'espia',false)},1100)}
          op.combo=0;op.s=Math.max(0,op.s-MR_ERRO);
          if(treino&&tent<3)aviso(`${oponente.split(' ')[0]} errou · −50`,'neutro',1200);
          placar();
        }
        tent++;
      }
      if(!fim)botProx();
    },d);
  }
  function relogio(){
    const r=Math.max(0,ate-Date.now()),s=Math.ceil(r/1000);
    if(s!==ultSeg){ultSeg=s;$o('#mr-t').textContent=`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}
    if(!ultimos&&s<=10){ultimos=true;o.classList.add('ultimos');aviso('Últimos 10 segundos','perigo',1600);placar();try{navigator.vibrate?.(80)}catch{}}
    if(r<=0)return acaba();
    if(!fim)espera(relogio,250);
  }
  function acaba(){
    if(fim)return;fim=true;corre=false;for(const t of timers)clearTimeout(t);timers.clear();
    const s=noTeto(me.s),so=noTeto(op.s);
    setTimeout(()=>{o.remove();aoFim({result:me.s>op.s?'win':me.s<op.s?'loss':'draw',score:s,oppScore:so,stats:{pares:me.pares,erros:me.erros,melhorCombo:me.melhor}})},rapido?0:600);
  }
  function contagem(){
    if(rapido){comeca();return}
    const c=document.createElement('div');c.className='mr-conta';c.setAttribute('role','status');o.append(c);
    let n=3;const passo=()=>{c.innerHTML=`<b>${n||'JÁ'}</b>`;c.setAttribute('aria-label',n?String(n):'Já');if(n===0){setTimeout(()=>{c.remove();comeca()},400);return}n--;setTimeout(passo,650)};passo();
  }
  function comeca(){corre=true;ate=Date.now()+MR_TOTAL;relogio();botProx()}
  $o('.mr-sair').onclick=()=>{fim=true;for(const t of timers)clearTimeout(t);o.remove();aoSair()};
  cartas=mrBaralho(0);monta();placar();
  // para capturas: um estado do meio da partida
  if(q.get('mrdemo')){
    const ver=q.get('mrdemo');corre=true;ate=Date.now()+(ver==='fim'?8000:74000);
    const a=cartas[0],b=cartas.find(c=>c!==a&&c.sym===a.sym);a.dono=b.dono='me';[a,b].forEach(c=>{pinta(c,'minha')});
    const c2=cartas.find(c=>!c.dono),d2=cartas.find(c=>c!==c2&&c.sym===c2.sym);c2.dono=d2.dono='op';[c2,d2].forEach(c=>pinta(c,'dele'));
    const l=cartas.filter(c=>!c.dono);pinta(l[0],'aberta');abertas=[l[0]];
    me.s=350;me.pares=2;me.combo=2;op.s=100;op.pares=1;placar();$o('#mr-t').textContent=ver==='fim'?'00:08':'01:14';if(ver==='fim')o.classList.add('ultimos');return;
  }
  contagem();
}
