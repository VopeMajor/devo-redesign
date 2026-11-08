/* ---- Chibis dos NPCs no mapa (dono, 06/11: "retire as animações dos npcs falando. deixe somente para os chibis
   deles" → "Pode fazer"). Folha em art/npc-chibi/<nome>.png (art-src/chibi_npc.py): 8 colunas x 4 linhas de 80x96;
   linhas frente, esquerda, direita, costas; colunas 0..3 andar, 4 parado, 5 boca aberta, 6 olhos fechados, 7 olhos
   fechados e boca aberta. A boca aparece de frente e de lado (de costas não há rosto).
   - parado: respira (1 px a cada poucos segundos) e pisca;
   - falando: a boca alterna com um ritmo próprio de cada um e fecha nas pausas;
   - andando: ciclo de 4 quadros pela distância, com o mesmo sobe-e-desce do chibi do jogador.
   Tudo em quadro inteiro (steps), nada de girar ou escalar. Com movimento reduzido: parado, sem piscar nem boca.
   Uso: const s=NPCChibi.cria('simon',{mundo,x,y,dir,bocaMs,piscar}); s.fala(true|false); s.vira(dir); s.anda([[x,y],…]);
   s.mostra(on); s.destroi(). Opção sombra:false para o holograma. ---- */
const NPCChibi=(()=>{
  const calmo=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const css=document.createElement('style');
  css.textContent=`.npc-chibi{position:absolute;width:80px;height:96px;margin:-96px 0 0 -40px;background-size:640px 384px;image-rendering:pixelated;pointer-events:none}
  .npc-chibi-sombra{position:absolute;width:40px;height:12px;margin:-6px 0 0 -20px;background:rgba(5,2,10,.5);pointer-events:none;clip-path:polygon(15% 0,85% 0,100% 33%,100% 67%,85% 100%,15% 100%,0 67%,0 33%)}`;
  document.head.append(css);
  function cria(nome,{mundo,x=0,y=0,dir=0,versao='',bocaMs=110,piscar=[2.5,6],piscaMs=110,resp=3,velocidade=48,sombra:temSombra=true}={}){
    const el=document.createElement('div'),sombra=document.createElement('div');
    el.className='npc-chibi';sombra.className='npc-chibi-sombra';
    el.style.backgroundImage=`url(art/npc-chibi/${nome}.png${versao?'?v='+versao:''})`;
    mundo.append(sombra,el);if(!temSombra)sombra.style.display='none'; // holograma não faz sombra
    const s={x,y,dir,col:4,falando:false,olho:false,boca:false,rota:[],aoChegar:null,andado:0,vivo:true};
    let ultima='',rodando=true,t0=performance.now(),proxPisca=1+Math.random()*2,pisca=0,bocaT=0,bocaPasso=bocaMs,respT=Math.random()*resp;
    function pinta(sobe){
      let col=4;
      if(s.rota.length)col=Math.floor(s.andado)%4;
      else{const b=s.boca&&s.dir!==3,o=s.olho&&s.dir!==3;col=o?(b?7:6):(b?5:4)} // de costas não há rosto
      const chave=col+','+s.dir+','+Math.round(s.x)+','+Math.round(s.y)+','+sobe;if(chave===ultima)return;ultima=chave; // só escreve o que mudou
      el.style.backgroundPosition=`-${col*80}px -${s.dir*96}px`;
      el.style.left=Math.round(s.x)+'px';el.style.top=Math.round(s.y-(sobe?1:0))+'px';el.style.zIndex=Math.round(s.y);
      sombra.style.left=Math.round(s.x)+'px';sombra.style.top=Math.round(s.y)+'px';sombra.style.zIndex=Math.round(s.y)-1;
    }
    function laco(t){
      if(!s.vivo)return;
      if(el.hidden&&!s.rota.length){rodando=false;return} // escondido e parado: o laço dorme até mostra(true)
      const dt=Math.min(.05,(t-t0)/1000);t0=t;let sobe=false;
      if(s.rota.length){
        const [tx,ty]=s.rota[0],dx=tx-s.x,dy=ty-s.y,d=Math.hypot(dx,dy),v=velocidade*dt;
        if(d<=v){s.x=tx;s.y=ty;s.rota.shift();if(!s.rota.length){s.andado=0;const f=s.aoChegar;s.aoChegar=null;f&&f()}}
        else{s.x+=dx/d*v;s.y+=dy/d*v;s.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?1:2):(dy>0?0:3);s.andado+=v/7;sobe=Math.floor(s.andado)%2===1}
      }else if(!calmo&&!el.hidden){
        // respira: o corpo sobe 1 px por um terço do ciclo
        respT=(respT+dt)%resp;sobe=respT>resp*.66;
        // pisca
        proxPisca-=dt;if(proxPisca<=0&&pisca<=0){pisca=piscaMs/1000;proxPisca=piscar[0]+Math.random()*(piscar[1]-piscar[0])}
        if(pisca>0){pisca-=dt;s.olho=pisca>0}
        // boca: alterna enquanto fala, com ritmo um pouco irregular
        if(s.falando){bocaT+=dt*1000;if(bocaT>=bocaPasso){bocaT=0;bocaPasso=bocaMs*(.75+Math.random()*.5);s.boca=!s.boca}}
        else s.boca=false;
      }
      pinta(sobe);requestAnimationFrame(laco);
    }
    requestAnimationFrame(laco);
    return {
      get x(){return s.x},get y(){return s.y},get dir(){return s.dir},get andando(){return s.rota.length>0},
      fala(on){s.falando=!!on&&!calmo;if(!on)s.boca=false},
      pausa(){s.boca=false;bocaT=0}, // nas pausas da pontuação a boca fecha
      vira(d){s.dir=d},
      viraPara(x,y){const dx=x-s.x,dy=y-s.y;s.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?1:2):(dy>0?0:3)},
      anda(rota,depois){s.rota=rota.slice();s.aoChegar=depois||null;if(calmo&&rota.length){[s.x,s.y]=rota[rota.length-1];s.rota=[];depois&&depois()}},
      poe(x,y){s.x=x;s.y=y;s.rota=[]},
      mostra(on){el.hidden=sombra.hidden=!on;if(on&&!rodando&&s.vivo){rodando=true;t0=performance.now();ultima='';requestAnimationFrame(laco)}},
      destroi(){s.vivo=false;el.remove();sombra.remove()},
      el,
    };
  }
  return {cria};
})();
