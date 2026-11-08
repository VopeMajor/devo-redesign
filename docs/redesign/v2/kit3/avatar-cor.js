// Aparência do avatar: as peças são cinza e a cor vem destas amostras, sempre de catálogo.
// Usado na criação (avatar.html) e na Casa (casa.html), para o busto e o chibi saírem iguais.
const CAB=[
 ['Preto',[26,24,28],[52,48,54],[110,104,112]],['Noite',[24,22,40],[58,52,92],[120,112,170]],['Castanho escuro',[42,26,20],[78,50,36],[136,98,72]],
 ['Castanho',[70,44,28],[120,80,50],[186,142,96]],['Mel',[120,76,30],[176,120,56],[226,180,110]],['Loiro',[150,96,30],[214,160,60],[246,214,130]],
 ['Platinado',[166,150,135],[232,220,200],[250,244,232]],['Cinza',[92,90,98],[150,148,156],[214,212,218]],['Branco',[170,172,186],[226,228,236],[252,252,254]],
 ['Ruivo',[110,44,20],[176,80,36],[232,140,84]],['Vinho',[64,16,34],[112,28,56],[180,70,100]],['Rubi',[110,28,44],[176,50,66],[236,120,120]],
 ['Rosa',[170,84,120],[226,132,166],[250,196,214]],['Violeta',[70,40,110],[130,90,190],[200,170,240]],['Cobalto',[24,40,120],[50,84,200],[130,160,244]],
 ['Céu',[40,70,110],[90,140,190],[180,220,240]],['Verdete',[20,76,80],[44,136,134],[140,212,200]],['Musgo',[44,60,30],[86,110,56],[160,180,110]]];
const OLHOS=[
 ['Violeta',[90,62,170],[160,130,225]],['Âmbar',[120,70,16],[214,150,50]],['Castanho',[58,36,22],[120,80,50]],['Preto',[20,18,24],[64,60,70]],
 ['Mel',[80,60,30],[190,150,80]],['Verde',[50,90,50],[130,190,110]],['Azul-petróleo',[20,90,110],[70,190,200]],['Azul',[30,60,130],[90,140,230]],
 ['Cinza',[70,76,88],[150,158,172]],['Vermelho',[120,40,40],[220,100,90]],['Rosa',[150,60,110],[234,130,180]],['Branco',[150,150,160],[226,226,232]]];
const PELES=[
 ['Pele 1',[250,226,214],[228,196,186]],['Pele 2',[248,217,195],[226,184,162]],['Pele 3',[240,204,170],[212,166,132]],['Pele 4',[226,180,140],[194,144,106]],['Pele 5',[196,142,104],[160,106,76]],
 ['Pele 6',[168,116,82],[134,88,60]],['Pele 7',[140,92,64],[106,66,46]],['Pele 8',[112,72,50],[84,52,38]],['Pele 9',[92,60,44],[66,42,32]],['Pele 10',[66,44,36],[46,30,26]]];
const lerp=(a,b,t)=>a+(b-a)*t, sat=v=>v<0?0:v>1?1:v;
function pintaCabelo(d,c){
  const [,s,m,l]=c;
  for(let i=0;i<d.length;i+=4){
    if(!d[i+3])continue;const v=d[i],t1=sat((v-95)/80),t2=sat((v-175)/60),t0=sat((v-25)/46);
    for(let k=0;k<3;k++){let x=lerp(s[k],m[k],t1);x=lerp(x,l[k],t2);d[i+k]=lerp([20,14,26][k],x,t0)}
  }
}
function pintaCorpo(d,pele){
  const [,tom,som]=pele;
  for(let i=0;i<d.length;i+=4){
    if(!d[i+3]||d[i]-d[i+2]<=30)continue;
    const v=.3*d[i]+.59*d[i+1]+.11*d[i+2],t=sat((v-150)/65);
    for(let k=0;k<3;k++)d[i+k]=lerp(som[k],tom[k],t);
  }
}
function pintaRosto(d,w,indice,olho,cabelo,pele){
  // faixa dos olhos: acima são sobrancelhas, abaixo é a boca (e as olheiras do rosto 14)
  const esc=w/512,y0=186*esc,y1=(indice===13?219:240)*esc,max=indice===7?176:208;
  const [,s,m]=olho,sob=cabelo[1],claro=pele[1],lab=[Math.max(70,claro[0]-70),Math.max(40,claro[1]-90),Math.max(40,claro[2]-80)];
  for(let i=0,p=0;i<d.length;i+=4,p++){
    if(!d[i+3])continue;const v=d[i];if(v<=58||v>=max)continue;
    const y=Math.floor(p/w),t=sat((v-58)/90);
    for(let k=0;k<3;k++){
      d[i+k]=y<y0?sob[k]*(.75+.5*t):y<y1?lerp(s[k],m[k],t):lab[k]*(.7+.6*t);
    }
  }
}
const CEL_X=80,CEL_Y=96,TOPO_EXTRA=16,CAB_L=64,ACIMA=14;
function carregaImg(src){return new Promise((ok,erro)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=erro;i.src=src})}
// Busto com a aparência escolhida, igual ao da criação: será o das fotos especiais da Casa.
async function bustoAvatar(cfg){
  const base='art/avatar/',lado=cfg.corpo?'m':'f';
  const [corpo,roupa,rosto,cabelo]=await Promise.all([
    carregaImg(`${base}corpo-${lado}.png`),carregaImg(`${base}roupa-${cfg.roupa+1}-${lado}.png`),
    carregaImg(`${base}rosto-${cfg.rosto+1}.png`),carregaImg(`${base}cabelo-${cfg.cabelo+1}.png`)]);
  const L=512,cv=document.createElement('canvas');cv.width=cv.height=L;
  const ctx=cv.getContext('2d'),cc=CAB[cfg.corCabelo],pl=PELES[cfg.pele];
  const t=document.createElement('canvas');t.width=t.height=L;
  const tc=t.getContext('2d',{willReadFrequently:true});
  const camada=(im,fn)=>{tc.clearRect(0,0,L,L);tc.drawImage(im,0,0,L,L);const id=tc.getImageData(0,0,L,L);fn(id.data);tc.putImageData(id,0,0);ctx.drawImage(t,0,0)};
  camada(corpo,d=>pintaCorpo(d,pl));
  ctx.drawImage(roupa,0,0,L,L);
  camada(rosto,d=>pintaRosto(d,L,cfg.rosto,OLHOS[cfg.corOlhos],cc,pl));
  camada(cabelo,d=>pintaCabelo(d,cc));
  return cv;
}
// Monta a folha do chibi com a aparência escolhida: 4 direções x 4 passos, com folga em cima para o cabelo.
async function folhaChibi(cfg,partes){
  const base='art/avatar/chibi/';
  const lado=cfg.corpo?'m':'f';
  const [corpo,cabelo,roupa,anc]=await Promise.all([
    carregaImg(`${base}corpo-${lado}.png`),carregaImg(`${base}cabelo-${cfg.cabelo+1}.png`),carregaImg(`${base}roupa-${(cfg.roupa||0)+1}-${lado}.png`),
    fetch(base+'ancoras.json').then(r=>r.json())]);
  const cv=document.createElement('canvas');cv.width=CEL_X*4;cv.height=CEL_Y*4;
  const ctx=cv.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;
  // corpo: pele e, nas vistas com rosto, a cor dos olhos
  const t=document.createElement('canvas');t.width=corpo.width;t.height=corpo.height;
  const tc=t.getContext('2d',{willReadFrequently:true});tc.drawImage(corpo,0,0);
  const id=tc.getImageData(0,0,t.width,t.height),d=id.data;
  // abaixo do pescoço só a pele fica: quem veste é a camada de roupa
  for(let i=0,p=0;i<d.length;i+=4,p++){if(Math.floor(p/t.width)%80>=37&&d[i]-d[i+2]<=30)d[i+3]=0}
  const olhos=partes==='camadas'?mascaraOlhos(d,t.width):null;
  pintaOlhoChibi(d,t.width,OLHOS[cfg.corOlhos]);pintaCorpo(d,PELES[cfg.pele]);tc.putImageData(id,0,0);
  // cabelo
  const h=document.createElement('canvas');h.width=cabelo.width;h.height=cabelo.height;
  const hc=h.getContext('2d',{willReadFrequently:true});hc.drawImage(cabelo,0,0);
  const idh=hc.getImageData(0,0,h.width,h.height);pintaCabelo(idh.data,CAB[cfg.corCabelo]);hc.putImageData(idh,0,0);
  const A=anc[cfg.corpo?'m':'f'];
  if(partes==='camadas')return {t,h,A,olhos};
  // com "partes", o cabelo sai numa folha separada (a de andar mexe o corpo e o cabelo cada um do seu jeito)
  const cvC=partes?document.createElement('canvas'):cv;if(partes){cvC.width=cv.width;cvC.height=cv.height}
  const ctxC=cvC.getContext('2d',{willReadFrequently:true});
  for(let dir=0;dir<4;dir++)for(let p=0;p<4;p++){
    const x=p*CEL_X,y=dir*CEL_Y;
    ctx.drawImage(t,x,dir*80,80,80,x,y+TOPO_EXTRA,80,80);
    ctx.drawImage(roupa,p*64,dir*64,64,64,x+8,y+TOPO_EXTRA+16,64,64);
    ctxC.drawImage(h,dir*CAB_L,0,CAB_L,CAB_L,x+8,y+TOPO_EXTRA+A[dir][p]-ACIMA,CAB_L,CAB_L);
  }
  return partes?{corpo:cv,cabelo:cvC}:cv;
}
// Folha de andar (dono, 02/11 e 05/11: animações dos chibis revisadas por críticos). As pernas vêm redesenhadas por roupa
// (art/avatar/chibi/roupa-<n>-<f|m>-andar.png, art-src/pernas_chibi.py); cabeça, rosto, cabelo e tronco saem do quadro
// parado e andam juntos, como uma peça só; braços e barra do casaco balançam (mãos em corpo-<f|m>-andar.png, mesmo
// script). Colunas por direção:
//  0 parado · 1..8 passos · 9 assentar (corpo 1 px abaixo, ao chegar)
//  10 piscar (olhos fechados, gerado da própria máscara dos olhos, sem arte nova) · 11 peito (respiração: tronco sobe
//  1 px, cabeça e pernas paradas) · 12/13 olha para a esquerda/direita só com os olhos (a íris anda 1 px) ·
//  14 de lado, vira só a cabeça para a frente.
// ANDAR_BOB[dir][k]: quanto o corpo sobe em cada quadro (a sombra estreita junto); PX_QUADRO: px andados por quadro
// 15 piscar com o peito levantado (07/11, crítico de animação: piscar no meio da respiração derrubava o tronco)
const ANDAR_COLS=16,QUADRO_PASSO=.085,PX_QUADRO=5,ANDAR_BOB=[],COL={parado:0,assenta:9,pisca:10,peito:11,olhaE:12,olhaD:13,olhaF:14,piscaPeito:15};
const PESCOCO=37; // linha da pele (folha de 80) onde a cabeça termina
async function folhaAndar(cfg){
  if(usaFofo(cfg))return folhaAndarFofo(cfg);
  const lado=cfg.corpo?'m':'f';
  const [{t,h,A,olhos},roupa,maosIm]=await Promise.all([folhaChibi(cfg,'camadas'),carregaImg(`art/avatar/chibi/roupa-${(cfg.roupa||0)+1}-${lado}-andar.png?v=9`),
    carregaImg(`art/avatar/chibi/corpo-${lado}-andar.png?v=9`).catch(()=>null)]);
  // mãos balançando (06/11): o tronco de cada passo vem de corpo-<f|m>-andar.png, pintado com a pele escolhida
  let maos=null;
  if(maosIm){maos=document.createElement('canvas');maos.width=maosIm.width;maos.height=maosIm.height;const mc=maos.getContext('2d',{willReadFrequently:true});mc.drawImage(maosIm,0,0);
    const im=mc.getImageData(0,0,maos.width,maos.height),d=im.data;
    for(let i=0,p=0;i<d.length;i+=4,p++){if(Math.floor(p/maos.width)%80>=37&&d[i]-d[i+2]<=30)d[i+3]=0}
    pintaCorpo(d,PELES[cfg.pele]);mc.putImageData(im,0,0)}
  const fechado=olhosVariante(t,olhos,'fecha'),olhaE=olhosVariante(t,olhos,-1),olhaD=olhosVariante(t,olhos,1);
  const cv=document.createElement('canvas');cv.width=CEL_X*ANDAR_COLS;cv.height=CEL_Y*4;
  const ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;
  const BOB=[0,0,-1,-1,0,0,-1,-1]; // contato em 0 e 4 com o corpo embaixo; passagem em 2-3 e 6-7, 1 px acima
  // pele em duas faixas: cabeça (0..PESCOCO) de uma direção e tronco de outra, cada uma com o seu deslocamento
  const pele=(src,dc,db,x,y,cab,tro,k=-1)=>{
    if(k>=0&&maos)ctx.drawImage(maos,k*80,db*80+PESCOCO,80,80-PESCOCO,x,y+TOPO_EXTRA+PESCOCO+tro,80,80-PESCOCO);
    else ctx.drawImage(src,CEL_X,db*80+PESCOCO,80,80-PESCOCO,x,y+TOPO_EXTRA+PESCOCO+tro,80,80-PESCOCO);
    ctx.drawImage(src,CEL_X,dc*80,80,PESCOCO,x,y+TOPO_EXTRA+cab,80,PESCOCO);
  };
  for(let dir=0;dir<4;dir++){
    ANDAR_BOB[dir]=BOB;
    for(let col=0;col<ANDAR_COLS;col++){
      const x=col*CEL_X,y=dir*CEL_Y;
      const b=col===9?1:col>=1&&col<=8?BOB[col-1]:0;
      const soOlhos=dir!==3&&(col===12||col===13); // olhar só com os olhos: a cabeça não muda de forma
      const cab=col===14&&(dir===1||dir===2)?0:dir; // de lado, a 14 vira a cabeça para a frente
      const dc=cab,src=(col===10||col===15)&&dir!==3?fechado:soOlhos?(col===12?olhaE:olhaD):t;
      if(col===11){ // peito: o tronco sobe 1 px; cabeça, cabelo e pernas ficam
        pele(t,dir,dir,x,y,0,-1);
        ctx.drawImage(roupa,0,dir*64+40,64,24,x+8,y+TOPO_EXTRA+16+40,64,24);
        ctx.drawImage(roupa,0,dir*64,64,41,x+8,y+TOPO_EXTRA+16-1,64,41); // 41 linhas: sem fresta na linha 55
      }else{
        pele(src,dc,dir,x,y,b,b,col>=1&&col<=8?col-1:-1);
        ctx.drawImage(roupa,(col<=9?col:0)*64,dir*64,64,64,x+8,y+TOPO_EXTRA+16,64,64);
      }
      ctx.drawImage(h,dc*CAB_L,0,CAB_L,CAB_L,x+8,y+TOPO_EXTRA+A[dc][1]-ACIMA+(col===11?0:b),CAB_L,CAB_L);
    }
  }
  return cv;
}
// máscara dos olhos (mesma regra de pintaOlhoChibi), antes de a cor ser trocada
function mascaraOlhos(d,w){
  const m=new Uint8Array(d.length/4);
  for(let i=0,p=0;i<d.length;i+=4,p++){
    if(!d[i+3])continue;const y=Math.floor(p/w),dir=Math.floor(y/80),yy=y%80;
    if(dir>2||yy<=14||yy>=37)continue;if(Math.abs(d[i]-d[i+2])>=18)continue;
    const v=.3*d[i]+.59*d[i+1]+.11*d[i+2];if(v>70&&v<190)m[p]=1;
  }
  return m;
}
// olhos do chibi gerados da própria máscara dos olhos (sem arte nova), por direção com rosto (0 frente, 1 e 2 lados):
// modo 'fecha': apaga o olho inteiro (íris, branco e o traço de cima) com a pele e desenha UMA linha de cílio em arco
// curto para baixo; modo -1/+1: a íris anda 1 px dentro do contorno do olho (olhar para o lado sem mexer a cabeça).
function olhosVariante(t,m,modo){
  const c=document.createElement('canvas');c.width=t.width;c.height=t.height;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(t,0,0);
  if(!m)return c;
  const im=x.getImageData(0,0,c.width,c.height),d=im.data,w=c.width,orig=new Uint8ClampedArray(d);
  const lum=i=>.3*orig[i]+.59*orig[i+1]+.11*orig[i+2];
  for(let dir=0;dir<3;dir++){
    const cont=new Map(),pts=[];
    for(let yy=15;yy<37;yy++)for(let xx=CEL_X;xx<CEL_X*2;xx++){const p=(dir*80+yy)*w+xx,i=p*4;if(!orig[i+3])continue;
      if(m[p]){pts.push([xx,yy]);continue}if(yy<20||yy>34)continue;const k=orig[i]<<16|orig[i+1]<<8|orig[i+2];cont.set(k,(cont.get(k)||0)+1)}
    if(!pts.length)continue;
    const pele=[...cont.entries()].sort((a,b)=>b[1]-a[1])[0][0],pr=pele>>16&255,pg=pele>>8&255,pb=pele&255;
    // olhos separados por colunas vazias
    const cols=[...new Set(pts.map(q=>q[0]))].sort((a,b)=>a-b),grupos=[];
    cols.forEach(cx=>{const g=grupos[grupos.length-1];if(g&&cx-g[1]<=2)g[1]=cx;else grupos.push([cx,cx])});
    for(const [gx0,gx1] of grupos){
      const ys=pts.filter(q=>q[0]>=gx0&&q[0]<=gx1).map(q=>q[1]),y0=Math.min(...ys),y1=Math.max(...ys);
      if(modo==='fecha'){
        // apaga o olho e o traço escuro logo acima e ao lado dele
        for(let yy=y0-2;yy<=y1;yy++)for(let xx=gx0-1;xx<=gx1+1;xx++){const p=(dir*80+yy)*w+xx,i=p*4;if(!orig[i+3])continue;
          if(m[p]||(lum(i)<=70&&yy<=y1)){d[i]=pr;d[i+1]=pg;d[i+2]=pb}}
        const ly=Math.min(y1,y0+Math.round((y1-y0)*.6));
        for(let xx=gx0;xx<=gx1;xx++){const ponta=xx===gx0||xx===gx1,yy=ly+(ponta?1:0),i=((dir*80+yy)*w+xx)*4;d[i]=42;d[i+1]=29;d[i+2]=38;d[i+3]=255}
      }else{
        // íris 1 px para o lado, dentro do contorno do olho; o que fica para trás vira o branco/pele do olho
        for(let yy=y0;yy<=y1;yy++)for(let xx=gx0;xx<=gx1;xx++){const p=(dir*80+yy)*w+xx,i=p*4;if(!m[p])continue;
          const sp=p-modo,si=sp*4;if(m[sp]){d[i]=orig[si];d[i+1]=orig[si+1];d[i+2]=orig[si+2]}else{d[i]=pr;d[i+1]=pg;d[i+2]=pb}}
      }
    }
  }
  x.putImageData(im,0,0);return c;
}
function pintaOlhoChibi(d,w,olho){
  const [,s,m]=olho;
  for(let i=0,p=0;i<d.length;i+=4,p++){
    if(!d[i+3])continue;
    const y=Math.floor(p/w),dir=Math.floor(y/80),yy=y%80;
    if(dir>2||yy<=14||yy>=37)continue; // de costas não há rosto
    if(Math.abs(d[i]-d[i+2])>=18)continue;
    const v=.3*d[i]+.59*d[i+1]+.11*d[i+2];if(v<=70||v>=190)continue;
    const t=sat((v-70)/90);for(let k=0;k<3;k++)d[i+k]=lerp(s[k],m[k],t);
  }
}
/* Chibi fofo (dono, 07/11: "deixe eles mais bonitinhos. estilo ddtank" → prova → "Aprovo" → "Aprovo" para o resto;
   "não é pra todo chibi ter a mesma expressão"). Peças em art/avatar/fofo/ (art-src/chibi_fofo.py), por camadas:
   roupa-<n>-<f|m> (corpo careca já vestido, quadro a quadro, + máscara: vermelho = pele, verde = íris, + json com as
   âncoras da cabeça, a testa e o desvio da cabeça) → rosto-<n> (o rosto escolhido na criação: aberto, piscando, olhando
   para a esquerda e para a direita, de frente e de lado) → cabelo-<n> (em cinza, a cor vem da amostra). Pele, olhos e
   cabelo seguem a aparência. Mesmo formato de folhaAndar (16 colunas por direção), para chibi-vida.js não mudar.
   ?antigo=1 mostra o chibi anterior. */
// coluna da folha fofo (0..7 andar, 8 parado, 9 piscar, 10 peito, 11/12 olhar, 13 piscar com o peito, 14 assentar)
// usada em cada coluna da folha de andar; a 14 (de lado, olhar para a frente) vira olhar para trás com a íris
const FOFO_COL=[8,0,1,2,3,4,5,6,7,14,9,10,11,12,8,13],FOFO_OLHA_F=[8,12,11,8];
// variação do rosto em cada coluna da folha fofo: 0 aberto, 1 olhos fechados, 2/3 olhar para a esquerda/direita
const FOFO_ROSTO={9:1,13:1,11:2,12:3};
function usaFofo(cfg){try{return !!cfg&&!new URLSearchParams(location.search).has('antigo')}catch{return true}}
async function folhaAndarFofo(cfg){
  const b='art/avatar/fofo/',v='?v=202611071900',lado=cfg.corpo?'m':'f',nr=(cfg.roupa||0)+1;
  const [roupa,msk,info,cab,rosto,rmsk]=await Promise.all([carregaImg(`${b}roupa-${nr}-${lado}.png${v}`),carregaImg(`${b}roupa-${nr}-${lado}-mascara.png${v}`),
    fetch(`${b}roupa-${nr}-${lado}.json${v}`).then(r=>r.json()),carregaImg(`${b}cabelo-${(cfg.cabelo||0)+1}.png${v}`),
    carregaImg(`${b}rosto-${(cfg.rosto||0)+1}.png${v}`),carregaImg(`${b}rosto-${(cfg.rosto||0)+1}-mascara.png${v}`)]);
  const tela=(im)=>{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(im,0,0);return [c,x]};
  // pele e olhos: a pele multiplica cada canal pela razão entre o tom escolhido e o tom da arte (sombra, bochecha e
  // brilho continuam no lugar); a íris segue a rampa da cor dos olhos pela luz do cinza
  const tom=PELES[cfg.pele||0][1],[,os,om]=OLHOS[cfg.corOlhos||0];
  let ref=null;
  const pinta=(im,mk)=>{
    const [c,x]=tela(im),[,mx]=tela(mk);
    const id=x.getImageData(0,0,c.width,c.height),d=id.data,m=mx.getImageData(0,0,c.width,c.height).data;
    if(!ref){ref=[0,0,0];let n=0;for(let i=0;i<d.length;i+=4)if(m[i]>0&&d[i+3]){const l=.3*d[i]+.59*d[i+1]+.11*d[i+2];if(l>185&&l<225){ref[0]+=d[i];ref[1]+=d[i+1];ref[2]+=d[i+2];n++}}
      for(let k=0;k<3;k++)ref[k]=n?ref[k]/n:200}
    for(let i=0;i<d.length;i+=4){
      if(!d[i+3])continue;
      if(m[i]>0){for(let k=0;k<3;k++)d[i+k]=Math.min(255,d[i+k]*tom[k]/ref[k])}
      else if(m[i+1]>0){const t=sat((.3*d[i]+.59*d[i+1]+.11*d[i+2]-40)/95);for(let k=0;k<3;k++)d[i+k]=lerp(os[k],om[k],.25+.75*t)} // íris mais clara: a cor dos olhos aparece no tamanho do chibi
    }
    x.putImageData(id,0,0);return c;
  };
  const rc=pinta(roupa,msk),fc=pinta(rosto,rmsk);
  const [hc,hx]=tela(cab);const ih=hx.getImageData(0,0,hc.width,hc.height);pintaCabelo(ih.data,CAB[cfg.corCabelo||0]);hx.putImageData(ih,0,0);
  const A=info.anc,T=info.testa||{},D=info.desvio||{},cv=document.createElement('canvas');cv.width=CEL_X*ANDAR_COLS;cv.height=CEL_Y*4;
  const ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;
  const celv=document.createElement('canvas');celv.width=CEL_X;celv.height=CEL_Y;
  const cel=celv.getContext('2d',{willReadFrequently:true});
  const hDados=[0,1,2,3].map(d=>hx.getImageData(d*CEL_X,0,CEL_X,CEL_Y).data);
  const BOB=[0,1,0,-1,0,1,0,-1]; // a altura de cada passo já está na arte (contato, baixo, passagem, alto); a sombra estreita no alto
  for(let dir=0;dir<4;dir++){
    ANDAR_BOB[dir]=BOB;
    const [ox,oy]=D[dir]||[0,0];
    for(let col=0;col<ANDAR_COLS;col++){
      const src=col===14?FOFO_OLHA_F[dir]:FOFO_COL[col],x=col*CEL_X,y=dir*CEL_Y+1; // +1: o pé fica na última linha, como o chibi antigo
      const dx=A[dir][src][0]+ox,dy=A[dir][src][1]+oy,testa=T[dir];
      cel.clearRect(0,0,CEL_X,CEL_Y);cel.drawImage(rc,src*CEL_X,dir*CEL_Y,CEL_X,CEL_Y,0,0,CEL_X,CEL_Y);
      // o rosto escolhido por cima do rosto da roupa (de costas não há rosto)
      if(dir<3)cel.drawImage(fc,dir*CEL_X,(FOFO_ROSTO[src]||0)*CEL_Y,CEL_X,CEL_Y,dx,dy,CEL_X,CEL_Y);
      // acima da testa, a cabeça careca só fica onde há cabelo por cima na mesma coluna: o contorno que escapava por trás
      // do cabelo some, e a testa debaixo da franja continua
      if(testa!=null){
        const cd=cel.getImageData(0,0,CEL_X,CEL_Y),hd=hDados[dir];
        for(let xx=0;xx<CEL_X;xx++){
          const hx2=xx-dx;let primeiro=CEL_Y;
          if(hx2>=0&&hx2<CEL_X)for(let yy=0;yy<CEL_Y;yy++){if(hd[(yy*CEL_X+hx2)*4+3]){primeiro=yy+dy;break}}
          for(let yy=0;yy<Math.min(CEL_Y,testa+A[dir][src][1]);yy++)if(yy<primeiro)cd.data[(yy*CEL_X+xx)*4+3]=0;
        }
        // de lado, até a altura das orelhas: a cabeça não passa da borda de trás do cabelo (a pele que escapava atrás do
        // cabelo parecia uma orelha solta)
        if(dir===1||dir===2)for(let yy=0;yy<Math.min(CEL_Y,testa+A[dir][src][1]+12);yy++){
          const hy=yy-dy;if(hy<0||hy>=CEL_Y)continue;let borda=-1;
          for(let xx=0;xx<CEL_X;xx++)if(hd[(hy*CEL_X+xx)*4+3]){if(dir===1||borda<0)borda=xx+dx;if(dir===2){borda=xx+dx;break}}
          if(borda<0)continue;
          for(let xx=0;xx<CEL_X;xx++)if(dir===1?xx>borda:xx<borda)cd.data[(yy*CEL_X+xx)*4+3]=0;
        }
        cel.putImageData(cd,0,0);
      }
      ctx.drawImage(celv,x,y);
      ctx.drawImage(hc,dir*CEL_X,0,CEL_X,CEL_Y,x+dx,y+dy,CEL_X,CEL_Y);
    }
  }
  return cv;
}
function aparenciaSalva(){try{return JSON.parse(localStorage.getItem('devo-aparencia'))}catch{return null}}
