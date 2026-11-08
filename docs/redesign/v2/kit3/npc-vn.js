/* ---- Motor das figuras de NPC nas cenas de diálogo (dono, 05/11: "revise ... as animações ... dos npcs. coloque
   críticos para avaliarem"). Regras do crítico de animação: tudo em pixel de arte inteiro (u), quadro a quadro
   (steps), nada de rotação, escala ou desfoque no sprite.
   - escala inteira: a figura usa um múltiplo inteiro do tamanho da arte, para os pixels saírem iguais;
   - a figura fica presa pela cabeça: trocar de pose não faz o rosto pular de lugar;
   - respira (sobe 1u e volta) no ritmo de cada personagem;
   - reage ao trocar de pose (pula, susto, treme, tremor, murcha, inclina, ergue, balança, assenta);
   - o texto sai letra a letra (relógio por tempo, não por quadro), com pausas na pontuação e uma voz curta; o
     primeiro toque completa;
   - entradas e saídas: porta (fresta que abre), corte, e o painel que fecha a porta.
   - rosto (06/11): pisca de tempos em tempos (a boca mexendo ao falar existe, mas o dono pediu só nos chibis dos
     NPCs: os retratos não têm a variação de boca, então ela não acontece) (art-src/anima_npcs.py gera, para cada
     pose, a figura com o olho fechado, com a boca no outro estado e com os dois; o motor só troca a imagem).
   Com movimento reduzido: sem respiração, reações, letra a letra nem fresta; o nome ganha um sinal (!, #, …, ♪).
   Usado pela visita do Simon (visita-simon.js) e pela Catedral (Erick). ---- */
const NPCVN=(()=>{
  const calmo=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const rapido=new URLSearchParams(location.search).has('semraf'); // capturas de teste: texto inteiro de uma vez
  let ctx=null;
  const audio=()=>{try{if(!ctx)ctx=new (window.AudioContext||window.webkitAudioContext)();if(ctx.state==='suspended')ctx.resume();return ctx}catch{return null}};
  function bip({tipo,f0,f1,dur,vol=.06}){
    const c=audio();if(!c)return;
    const o=c.createOscillator(),g=c.createGain(),t=c.currentTime;
    o.type=tipo;o.frequency.value=f0+Math.random()*(f1-f0);
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur/1000);
    o.connect(g).connect(c.destination);o.start(t);o.stop(t+dur/1000+.02);
  }
  function som(nome){
    const c=audio();if(!c)return;const t=c.currentTime;
    if(nome==='range'){const o=c.createOscillator(),g=c.createGain();o.type='sawtooth';o.frequency.setValueAtTime(140,t);o.frequency.linearRampToValueAtTime(95,t+.5);g.gain.setValueAtTime(.025,t);g.gain.exponentialRampToValueAtTime(.0001,t+.55);o.connect(g).connect(c.destination);o.start(t);o.stop(t+.6)}
    // holograma: o chamado do celular, duas notas que sobem com um chiado curto de projeção
    if(nome==='holograma'||nome==='holograma-sai'){const sobe=nome==='holograma';[0,.09].forEach((d,i)=>{const o=c.createOscillator(),g=c.createGain();o.type='square';o.frequency.setValueAtTime(sobe?[660,990][i]:[990,520][i],t+d);g.gain.setValueAtTime(.03,t+d);g.gain.exponentialRampToValueAtTime(.0001,t+d+.12);o.connect(g).connect(c.destination);o.start(t+d);o.stop(t+d+.14)})}
    if(nome==='baque'){const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(90,t);o.frequency.exponentialRampToValueAtTime(40,t+.25);g.gain.setValueAtTime(.18,t);g.gain.exponentialRampToValueAtTime(.0001,t+.3);o.connect(g).connect(c.destination);o.start(t);o.stop(t+.32)}
  }
  // reações em u (pixels de arte): [x,y] por quadro, duração total; "fica" mantém o último quadro
  const REACOES={
    assenta:{q:[[0,2],[0,0]],d:140},
    susto:{q:[[0,-6],[0,-2],[0,0]],d:210},
    pula:{q:[[0,-4],[0,0],[0,-2],[0,0]],d:320},
    treme:{q:[[2,0],[-2,0],[2,0],[-2,0],[1,0],[0,0]],d:240},
    tremor:{q:[[1,0],[0,0],[-1,0],[0,0],[1,0],[0,0],[-1,0],[0,0]],d:480},
    murcha:{q:[[0,1],[0,2],[0,3]],d:600,fica:true},
    murchaLenta:{q:[[0,1],[0,2],[0,3]],d:800,fica:true},
    inclina:{q:[[1,0],[2,1],[3,1]],d:180,fica:true},
    ergue:{q:[[0,-1]],d:60,fica:true},
  };
  const SINAL={susto:'!',treme:'#',tremor:'…',murcha:'…',murchaLenta:'…',balanca:'♪'};
  // meio da cabeça: mediana x dos pixels opacos numa faixa de 6% a partir do topo do desenho (copa do quepe ou do
  // cabelo), para mãos levantadas, gotas e notas não puxarem a medida
  const cabecas=new Map();
  function cabeca(img){
    if(cabecas.has(img.src))return cabecas.get(img.src);
    let f=.5;
    try{const w=img.naturalWidth,h=img.naturalHeight,c=document.createElement('canvas');c.width=w;c.height=h;
      const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0);const d=x.getImageData(0,0,w,h).data;
      let topo=0;achou:for(;topo<h;topo++)for(let xx=0;xx<w;xx++)if(d[(topo*w+xx)*4+3]>100)break achou;
      const xs=[];for(let yy=topo;yy<Math.min(h,topo+Math.round(h*.06));yy++)for(let xx=0;xx<w;xx++)if(d[(yy*w+xx)*4+3]>100)xs.push(xx);
      if(xs.length){xs.sort((a,b)=>a-b);f=xs[xs.length>>1]/w}}catch{}
    cabecas.set(img.src,f);return f;
  }
  function monta(img,{voz=null,resp=3,nome=null,caixa=null,rosto=null,versao='',piscar=[2.5,6],piscaMs=110,bocaMs=110,letraMs=24,boca=null}={}){
    // boca(on): quando o NPC tem chibi em cena, a boca dele abre enquanto saem as letras e fecha nas pausas e no fim
    const bocaChibi=on=>{try{const b=typeof boca==='function'?boca():null;b&&b.fala(on)}catch{}};
    let u=1,anim=null,fica=null,balanco=null,ultimaPose=null,digitando=null,alturaCss=null;
    // rosto: pasta com anim.json e as variações de cada pose; olho e boca são estados, a figura é a combinação
    let rostoInfo=null,olhoFechado=false,bocaTrocada=false,vivo=true,semPiscarAte=0;const timers=new Set();
    const depois=(fn,ms)=>{const t=setTimeout(()=>{timers.delete(t);fn()},ms);timers.add(t);return t};
    const rostoPronto=rosto?fetch(rosto+'anim.json'+(versao?'?v='+versao:'')).then(r=>r.json()).then(j=>{rostoInfo=j}).catch(()=>{}):Promise.resolve();
    const nomePose=src=>(src||'').split('?')[0].split('/').pop().replace(/\.png$/,'');
    function variante(src,olho,boca){
      const n=nomePose(src),i=rostoInfo&&rostoInfo[n];if(!i)return src;
      const suf=[olho&&i.pisca?'pisca':'',boca&&i.boca?'boca':''].filter(Boolean).join('-');
      return suf?`${rosto}${n}-${suf}.png${versao?'?v='+versao:''}`:src;
    }
    function mostraRosto(){if(!ultimaPose)return;const v=variante(ultimaPose,olhoFechado,bocaTrocada);if(img.getAttribute('src')!==v)img.src=v}
    function variantes(src){const n=nomePose(src),i=rostoInfo&&rostoInfo[n];if(!i)return[];return[variante(src,1,0),variante(src,0,1),variante(src,1,1)].filter(v=>v!==src)}
    // piscar: fecha por um instante a cada poucos segundos (às vezes duas vezes); nunca com movimento reduzido, nem
    // logo depois de trocar de pose (a expressão nova aparece sempre de olhos abertos)
    function agendaPisca(){
      if(calmo||!vivo)return;
      depois(()=>{
        if(!img.hidden&&ultimaPose&&performance.now()>=semPiscarAte){olhoFechado=true;mostraRosto();
          const dupla=Math.random()<.15;
          depois(()=>{olhoFechado=false;mostraRosto();
            if(dupla)depois(()=>{if(performance.now()<semPiscarAte)return;olhoFechado=true;mostraRosto();depois(()=>{olhoFechado=false;mostraRosto()},piscaMs)},piscaMs*1.4)},piscaMs)}
        agendaPisca();
      },(piscar[0]+Math.random()*(piscar[1]-piscar[0]))*1000);
    }
    agendaPisca();
    const respAt=-Math.random()*resp;
    // escala inteira: a altura que o CSS pede, arredondada para baixo a um múltiplo inteiro da arte
    // no busto arredonda para cima (a parte de baixo fica escondida) e o corte é calculado em px a partir da caixa de
    // texto, sempre 8u atrás dela; no corpo inteiro arredonda para baixo e não corta
    function escala(){
      if(!img.naturalHeight||img.hidden)return;
      img.style.height='';img.style.clipPath='';const alvo=img.getBoundingClientRect().height||parseFloat(getComputedStyle(img).height);alturaCss=alvo;
      const busto=!img.classList.contains('inteiro')&&!img.classList.contains('longe');
      const dpr=devicePixelRatio||1,r=alvo*dpr/img.naturalHeight,k=Math.max(1,busto?Math.ceil(r):Math.floor(r))/dpr;
      u=k;const H=img.naturalHeight*k;img.style.height=H+'px';img.style.setProperty('--u',k+'px');
      img.style.translate=`${-cabeca(img)*100}% 0`;
      const cx=typeof caixa==='function'?caixa():caixa;
      if(busto&&cx){const top=img.getBoundingClientRect().top,corte=cx.getBoundingClientRect().top+8*u-top;img.style.clipPath=`inset(0 0 ${Math.max(0,H-corte)}px 0)`}
    }
    const ro=new ResizeObserver(()=>{escala();if(fica)aplica(fica,true)});ro.observe(document.documentElement);
    {const cx=typeof caixa==='function'?caixa():caixa;if(cx)ro.observe(cx)}
    img.style.imageRendering='pixelated';
    function respira(on){
      img.getAnimations().filter(a=>a.id==='resp').forEach(a=>a.cancel());
      if(!on||calmo)return;
      const st='steps(1,end)';
      const a=img.animate([{transform:'translateY(0)',offset:0,easing:st},{transform:'translateY(0)',offset:.55,easing:st},{transform:`translateY(${-u}px)`,offset:.6,easing:st},{transform:`translateY(${-u}px)`,offset:.95,easing:st},{transform:'translateY(0)',offset:1}],{duration:resp*1000,iterations:Infinity,easing:'linear',composite:'add',delay:respAt*1000});a.id='resp';
    }
    function aplica(r,instante){
      const R=REACOES[r];if(!R)return;
      img.getAnimations().filter(a=>a.id==='reage').forEach(a=>a.cancel());
      const q=R.q.map(([x,y])=>({transform:`translate(${x*u}px,${y*u}px)`}));
      anim=img.animate(instante?[q[q.length-1],q[q.length-1]]:[...q,q[q.length-1]],{duration:instante?1:R.d,easing:`steps(${instante?1:q.length},end)`,fill:R.fica?'forwards':'none',composite:'add'});anim.id='reage';
      fica=R.fica?r:null;
    }
    function solta(){ // volta ao zero em 2 quadros
      if(!fica)return;const R=REACOES[fica],[x,y]=R.q[R.q.length-1];fica=null;
      img.getAnimations().filter(a=>a.id==='reage').forEach(a=>a.cancel());
      const a=img.animate([{transform:`translate(${x*u}px,${y*u}px)`},{transform:`translate(${x*u/2}px,${y*u/2}px)`},{transform:'translate(0,0)'}],{duration:200,easing:'steps(2,end)',composite:'add'});a.id='reage';
    }
    function balanca(on){
      if(balanco){balanco.cancel();balanco=null}
      if(!on||calmo)return;
      balanco=img.animate([{transform:'translateX(0)'},{transform:`translateX(${u}px)`},{transform:'translateX(0)'},{transform:`translateX(${-u}px)`},{transform:'translateX(0)'}],{duration:1600,iterations:Infinity,easing:'steps(4,end)',composite:'add'});
    }
    function sinal(r){if(!nome)return;const el=typeof nome==='function'?nome():nome;if(!el)return;el.dataset.sinal=calmo&&SINAL[r]?SINAL[r]:''}
    const carregadas=new Map();
    // espera a imagem carregar, com tempo-limite: decode() pode não terminar com a aba em segundo plano
    const espera=(im,ms=1200)=>new Promise(ok=>{if(im.complete&&im.naturalWidth)return ok();const t=setTimeout(ok,ms);im.addEventListener('load',()=>{clearTimeout(t);ok()},{once:true});im.addEventListener('error',()=>{clearTimeout(t);ok()},{once:true})});
    function precarrega(srcs){srcs.forEach(s=>{if(!carregadas.has(s)){const i=new Image();i.src=s;carregadas.set(s,espera(i))}});
      if(rosto)rostoPronto.then(()=>srcs.forEach(s=>variantes(s).forEach(v=>{if(!carregadas.has(v)){const i=new Image();i.src=v;carregadas.set(v,espera(i))}})))}
    // troca de pose: carrega antes, corta e reage
    async function pose(src,{reage=null,mesma=false}={}){
      if(!carregadas.has(src))precarrega([src]);
      await carregadas.get(src);
      const nova=src!==ultimaPose;
      if(nova){olhoFechado=false;bocaTrocada=false;ultimaPose=src;semPiscarAte=performance.now()+((REACOES[reage]||{}).d||0)+400;
        if(img.getAttribute('src')!==src)img.src=src;await espera(img,600);escala();precarrega([src])}
      if(!mesma&&(nova||reage)){
        if(fica&&reage!==fica)solta();
        const r=reage||'assenta';balanca(r==='balanca');sinal(r);
        if(r!=='balanca'&&r!=='nada'&&!calmo)aplica(r);
      }
    }
    // texto letra a letra; o primeiro toque completa
    function fala(el,texto,fim,{comVoz=true}={}){
      completa(true);
      if(calmo||rapido){el.textContent=texto;fim&&fim();return}
      let i=0,proxima=performance.now(),letras=0,bocaPasso=bocaMs;el.textContent='';
      const pausa=ch=>ch===','?90:'.!?'.includes(ch)?220:ch==='…'?300:0;
      digitando={el,texto,fim,raf:0};
      let bocaT=0;
      const passo=t=>{
        if(!digitando)return;
        let bipou=false;
        while(i<texto.length&&t>=proxima){
          const ch=texto[i++];el.textContent=texto.slice(0,i);proxima+=letraMs+pausa(ch);
          if(comVoz&&voz&&!bipou&&/[A-Za-zÀ-ú0-9]/.test(ch)&&(++letras)%voz.cada===0){bip(voz);bipou=true}
          if(comVoz)bocaChibi(!pausa(ch));
          // boca: alterna enquanto sai letra; volta ao desenho da pose nas pausas da pontuação
          if(comVoz&&rostoInfo){if(pausa(ch)){if(bocaTrocada){bocaTrocada=false;mostraRosto()}}
            else if(/[A-Za-zÀ-ú0-9]/.test(ch)&&t-bocaT>=bocaPasso){bocaT=t;bocaPasso=bocaMs*(.75+Math.random()*.5);bocaTrocada=!bocaTrocada;mostraRosto()}}
        }
        if(i>=texto.length){const f=digitando.fim;digitando=null;bocaChibi(false);if(bocaTrocada){bocaTrocada=false;mostraRosto()}f&&f();return}
        digitando.raf=setTimeout(()=>passo(performance.now()),16);
      };
      digitando.raf=setTimeout(()=>passo(performance.now()),16);
    }
    function completa(silencio){
      if(!digitando)return false;
      clearTimeout(digitando.raf);const {el,texto,fim}=digitando;digitando=null;bocaChibi(false);if(bocaTrocada){bocaTrocada=false;mostraRosto()}
      if(!silencio){el.textContent=texto;fim&&fim()}
      return true;
    }
    // entradas e saídas
    async function entra(tipo){
      if(tipo==='porta'&&!calmo){
        som('range');
        const a=img.animate([{clipPath:'inset(0 50% 0 50%)'},{clipPath:'inset(0 0 0 0)'}],{duration:600,easing:'steps(6,end)'});await a.finished.catch(()=>{});
      }
    }
    async function sai(tipo,palco){
      if(tipo==='porta'){
        som('baque');
        if(!calmo&&palco){const p=document.createElement('i');p.className='npc-porta';palco.append(p);await p.animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:360,easing:'steps(4,end)'}).finished.catch(()=>{});setTimeout(()=>p.remove(),40)}
      }
      balanca(false);
    }
    function mostra(on){img.hidden=!on;if(on){olhoFechado=false;bocaTrocada=false;mostraRosto();escala();respira(true)}else respira(false)}
    function destroi(){vivo=false;timers.forEach(clearTimeout);timers.clear();completa(true);ro.disconnect();img.getAnimations().forEach(a=>a.cancel());balanco=null}
    return {pose,fala,completa,entra,sai,mostra,precarrega,destroi,escala,get digitando(){return !!digitando},respira};
  }
  // rostinho na caixa de texto (dono, 06/11: "Rosto na caixa"): nas cenas com os chibis no cenário o retrato grande sai
  // e a caixa mostra só a cabeça da pose atual, recortada da própria arte, em escala inteira (pixel igual)
  const recortes=new Map(),centros={};
  // recorte pela janela do rosto: a pele da faixa de cima do desenho dá o centro do rosto; quadrado de 19% da altura,
  // com o centro do rosto a 45% de cima (folga para o cabelo e o quepe) e sem pegar mão levantada
  function recorte(src){
    if(recortes.has(src))return recortes.get(src);
    const p=new Promise(ok=>{const im=new Image();im.onload=()=>{
      const w=im.naturalWidth,h=im.naturalHeight,c=document.createElement('canvas');c.width=w;c.height=h;
      const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(im,0,0);const d=x.getImageData(0,0,w,h).data;
      let topo=0;achou:for(;topo<h;topo++)for(let xx=0;xx<w;xx++)if(d[(topo*w+xx)*4+3]>100)break achou;
      const fim=Math.min(h,topo+Math.round(h*.2));let sx=0,sy=0,n=0;
      for(let yy=topo;yy<fim;yy++)for(let xx=0;xx<w;xx++){const i=(yy*w+xx)*4;if(d[i+3]>100&&d[i]-d[i+2]>25&&d[i]>110&&d[i+1]>60){sx+=xx;sy+=yy;n++}}
      // centros conhecidos (anfitriões das Torres: olhos medidos na arte) valem mais que a busca pela pele
      const z=Math.max(1,Math.round(h*.19/76)),S=76*z,k=centros[src.split('?')[0].split('/').pop().replace(/\.png$/,'')];
      const cx=k?k[0]:n?sx/n:w/2,cy=k?k[1]+S*.05:n?sy/n:topo+S/2;
      const x0=Math.round(cx-S/2),y0=Math.round(cy-S*.45);
      const o=document.createElement('canvas');o.width=o.height=S;o.getContext('2d').drawImage(im,x0,y0,S,S,0,0,S,S); // fora da figura fica transparente
      ok(o.toDataURL())};im.onerror=()=>ok(null);im.src=src});
    recortes.set(src,p);return p;
  }
  const preRostos=srcs=>srcs.forEach(recorte);
  // caixa do rostinho sempre do mesmo tamanho (76 px) em todas as cenas; o pedido mais novo vence
  async function rostinho(el,src,{px=76}={}){
    if(!el)return;
    const meu=(el._pedido=(el._pedido||0)+1);
    if(!src){el.hidden=true;return}
    const url=await recorte(src);
    if(meu!==el._pedido||!url)return;
    el.style.backgroundImage=`url(${url})`;el.style.width=el.style.height=px+'px';el.style.backgroundSize='100% 100%';el.hidden=false;
  }
  return {monta,som,calmo,rostinho,preRostos,centros};
})();
