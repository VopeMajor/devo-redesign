// Corporações dentro do sistema. Regras, valores, mensagens de erro e textos são os do jogo (lib/devo/corporacoes.ts,
// corporacoes-server.ts, components/devo/corporacoes/*); aqui tudo roda no aparelho para mostrar a tela, e no jogo quem decide
// é o servidor (/api/corporacoes). O brasão é composto em pixel a partir das folhas de art/os/corp.
const coArte=a=>`art/os/corp/${a}.png`;
const coDia=ms=>new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'short',year:'numeric'}).format(ms).replace(/\./g,'').replace(/ de /g,' ');
const coInicial=n=>{const p=n.trim().split(/\s+/).filter(x=>x.length>2);return ((p[0]||n.trim())[0]||'?').toLocaleUpperCase('pt-BR')};
const coNormaliza=t=>{const s=String(t||'').toUpperCase().replace(/[^A-Z0-9]/g,''),c=s.startsWith('CRP')?s.slice(3):s;return c.length!==8?s:`CRP-${c.slice(0,4)}-${c.slice(4)}`};
const CO_CODIGO=/^CRP-[ACDEFGHJKMNPQRTUVWXY34679]{4}-[ACDEFGHJKMNPQRTUVWXY34679]{4}$/;
const coNovoCodigo=()=>{const k=()=>Array.from({length:4},()=>CO_ALFABETO[Math.floor(Math.random()*CO_ALFABETO.length)]).join('');return `CRP-${k()}-${k()}`};
const coPode=c=>c==='lider'||c==='vice';
/* Papel de parede da Corporação (Rup, NOTAS-RUP-02-11.md item 3): o líder escolhe; ao abrir a Corporação, o fundo do
   sistema troca para ele (os-janelas.html, pinta()). Dono, 03/11: "acredito que porque terá o chat da corporação": é o
   fundo do chat da Corporação (aba Chat) e da parede do salão. Seis padrões prontos ou um arquivo do aparelho do líder.
   No protótipo fica guardado no aparelho por Corporação; no jogo, no servidor, junto da Corporação. */
const CO_PAPEIS=[['biblioteca','Biblioteca dos relógios'],['porto','Porto na névoa'],['salao','Salão abandonado'],['telhados','Telhados ao luar'],['floresta','Floresta de lanternas'],['abismo','Engrenagem do abismo']];
const coPapelSrc=id=>`art/os/papeis/${id}.webp?v=1`;
function coPapeis(){try{return JSON.parse(localStorage.getItem('devo-corp-papel')||'{}')}catch{return {}}}
function coPapelDe(corp){const v=corp&&coPapeis()[corp.id];if(!v)return null;return v.startsWith('data:')?v:coPapelSrc(v)}
function coAvisaPapel(corp){window.CO_PAPEL=coPapelDe(corp);dispatchEvent(new Event('devo-papel'))}

/* ---- o brasão: forma, campo em uma ou duas cores, figura e ornamento, em pixel ---- */
let CO_S=null;const CO_CACHE=new Map();
const CO_BAYER=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
// letras de 5×7 para a figura "Inicial"
const CO_LETRAS={A:'01110 10001 10001 11111 10001 10001 10001',B:'11110 10001 10001 11110 10001 10001 11110',C:'01110 10001 10000 10000 10000 10001 01110',D:'11110 10001 10001 10001 10001 10001 11110',E:'11111 10000 10000 11110 10000 10000 11111',F:'11111 10000 10000 11110 10000 10000 10000',G:'01110 10001 10000 10111 10001 10001 01111',H:'10001 10001 10001 11111 10001 10001 10001',I:'11111 00100 00100 00100 00100 00100 11111',J:'00111 00010 00010 00010 00010 10010 01100',K:'10001 10010 10100 11000 10100 10010 10001',L:'10000 10000 10000 10000 10000 10000 11111',M:'10001 11011 10101 10101 10001 10001 10001',N:'10001 11001 10101 10011 10001 10001 10001',O:'01110 10001 10001 10001 10001 10001 01110',P:'11110 10001 10001 11110 10000 10000 10000',Q:'01110 10001 10001 10001 10101 10010 01101',R:'11110 10001 10001 11110 10100 10010 10001',S:'01111 10000 10000 01110 00001 00001 11110',T:'11111 00100 00100 00100 00100 00100 00100',U:'10001 10001 10001 10001 10001 10001 01110',V:'10001 10001 10001 10001 10001 01010 00100',W:'10001 10001 10001 10101 10101 11011 10001',X:'10001 10001 01010 00100 01010 10001 10001',Y:'10001 10001 01010 00100 00100 00100 00100',Z:'11111 00001 00010 00100 01000 10000 11111'};
const coHex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const coImg=src=>new Promise((ok,er)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=er;i.src=src});
function coPixels(img){const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const x=c.getContext('2d');x.drawImage(img,0,0);return x.getImageData(0,0,c.width,c.height)}
async function coSprites(){
  if(CO_S)return CO_S;
  const [meta,...imgs]=await Promise.all([fetch('art/os/corp/brasao.json').then(r=>r.json()),...['formas','formas-p','figuras','figuras-p','figuras-pp','ornatos','ornatos-p'].map(n=>coImg(coArte(n)))]);
  const [f,fp,g,gp,gpp,o,op]=imgs.map(coPixels);
  CO_S={meta,f,fp,g,gp,gpp,o,op};
  return CO_S;
}
function coDivisao(d,u,v){
  if(d==='partido')return u>=.5;
  if(d==='cortado')return v>=.5;
  if(d==='quartelado')return (u>=.5)!==(v>=.5);
  if(d==='banda')return Math.abs(u-v)<.17;
  if(d==='chaveirao'){const c=.34+Math.abs(u-.5)*.96;return v>=c&&v<c+.2}
  if(d==='faixa')return v>=.4&&v<.6;
  return false;
}
function coBlit(dst,W,src,cel,ix,dx,dy,cada){
  const cols=Math.floor(src.width/cel),sx=(ix%cols)*cel,sy=Math.floor(ix/cols)*cel;
  for(let y=0;y<cel;y++)for(let x=0;x<cel;x++){
    const a=(sy+y)*src.width*4+(sx+x)*4,X=dx+x,Y=dy+y;
    if(!src.data[a+3]||X<0||Y<0||X>=W||Y*W*4>=dst.length)continue;
    const b=Y*W*4+X*4,cor=cada?cada(src.data[a],src.data[a+1],src.data[a+2]):[src.data[a],src.data[a+1],src.data[a+2]];
    dst[b]=cor[0];dst[b+1]=cor[1];dst[b+2]=cor[2];dst[b+3]=255;
  }
}
function coDesenha(b,mini,necro){
  const S=CO_S,e=mini?2:1,cw=72/e,ch=88/e,orn=b.ornamento&&b.ornamento!=='nenhum',W=orn?112/e:cw,H=orn?112/e:ch,ox=orn?20/e:0,oy=orn?12/e:0;
  const px=new Uint8ClampedArray(W*H*4),fs=mini?S.fp:S.f;
  const ir=CO_ORNATOS.findIndex(o=>o[0]===b.ornamento)-1;
  if(orn)coBlit(px,W,mini?S.op:S.o,112/e,ir,0,0);
  const iF=CO_FORMAS.findIndex(x=>x[0]===b.forma),cols=4,sx=(iF%cols)*cw,sy=Math.floor(iF/cols)*ch,mf=S.meta.formas[b.forma];
  const ramp=k=>{const c=CO_CORES[k]||CO_CORES.aco;return [coHex(c[1]),coHex(c[2]),coHex(c[3]),coHex(c[3]).map(v=>v*.62)]};
  const r1=ramp(b.cor),r2=ramp(b.cor2||b.cor),div=b.divisao||'pleno',lat=mini?6:12;
  const eCampo=(x,y)=>{if(x<0||y<0||x>=cw||y>=ch)return false;const a=(sy+y)*fs.width*4+(sx+x)*4;return fs.data[a+3]>0&&fs.data[a]>200&&fs.data[a+1]<60&&fs.data[a+2]>200};
  const rub=[163,18,31];
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){
    const a=(sy+y)*fs.width*4+(sx+x)*4;if(!fs.data[a+3])continue;
    const d=(oy+y)*W*4+(ox+x)*4;let c;
    if(eCampo(x,y)){
      const u=x/cw,v=y/ch,seg=coDivisao(div,u,v),r=seg?r2:r1;
      const lin=div!=='pleno'&&(coDivisao(div,(x+1)/cw,v)!==seg||coDivisao(div,u,(y+1)/ch)!==seg);
      const sombra=!eCampo(x-1,y)||!eCampo(x,y-1);
      let t=Math.min(2,Math.floor((u*.42+v*.58)*2.3+CO_BAYER[y&3][x&3]/16*.7));
      if((x+y)%lat===0||(((x-y)%lat)+lat)%lat===0)t=Math.min(3,t+1);
      if(sombra)t=3;
      c=lin?[10,10,14]:r[t];
    }else{
      c=[fs.data[a],fs.data[a+1],fs.data[a+2]];
      if(necro)c=c.map((v,i)=>v*.72+rub[i]*.28);
    }
    px[d]=c[0];px[d+1]=c[1];px[d+2]=c[2];px[d+3]=255;
  }
  // figura no centro do campo, na tinta que contrasta com a cor principal
  const clara=(CO_CORES[b.cor]||CO_CORES.aco)[4],tinta=clara?[[26,26,32],[43,43,51],[69,69,79],[106,106,116]]:[[107,99,87],[186,176,159],[236,229,216],[255,248,234]];
  const mapa=(R,G,B)=>{const l=(R+G+B)/3;return l<46?[10,10,14]:l<110?tinta[0]:l<165?tinta[1]:l<220?tinta[2]:tinta[3]};
  const cx=ox+Math.round(mf.cx/e),cy=oy+Math.round(mf.cy/e),fig=b.simbolo||'inicial';
  if(fig==='inicial'){
    const L=(CO_LETRAS[String(b.inicial||'?').normalize('NFD')[0]]||CO_LETRAS.A).split(' ');
    const k=mini?1:mf.s>=30?3:mf.s>=14?2:1,lw=5*k,lh=7*k,x0=cx-Math.floor(lw/2),y0=cy-Math.floor(lh/2);
    const on=(x,y)=>x>=0&&y>=0&&x<lw&&y<lh&&L[Math.floor(y/k)][Math.floor(x/k)]==='1';
    for(let y=-1;y<=lh;y++)for(let x=-1;x<=lw;x++){
      let c=null;
      if(on(x,y))c=y<k?tinta[3]:y>=lh-k?tinta[1]:tinta[2];
      else if(on(x-1,y)||on(x+1,y)||on(x,y-1)||on(x,y+1))c=[10,10,14];
      if(!c)continue;
      const d=(y0+y)*W*4+(x0+x)*4;if(d<0||d>=px.length)continue;
      px[d]=c[0];px[d+1]=c[1];px[d+2]=c[2];px[d+3]=255;
    }
  }else{
    const iG=CO_FIGURAS.findIndex(x=>x[0]===fig)-1,tam=mini?(mf.s>=30?20:12):(mf.s>=34?40:20),src=tam===40?S.g:tam===20?S.gp:S.gpp;
    coBlit(px,W,src,tam,iG,cx-tam/2,cy-tam/2,mapa);
  }
  if(necro){
    // a rachadura e a gota de rubi
    let n=0;for(const ch2 of b.inicial||'N')n+=ch2.charCodeAt(0);
    let x=Math.round(mf.cx/e)+((n%5)-2);
    for(let y=0;y<ch;y++){
      if(y%(mini?2:3)===0)x+=((y*7+n)%3)-1;
      if(!eCampo(x,y))continue;
      const d=(oy+y)*W*4+(ox+x)*4;px[d]=8;px[d+1]=2;px[d+2]=5;px[d+3]=255;
      if(!mini&&eCampo(x+1,y)){const f=d+4;px[f]=120;px[f+1]=14;px[f+2]=24;px[f+3]=255}
    }
    const G=mini?['010','111','010']:['00100','01110','01110','11111','11111','01110'],gx=ox+Math.round(mf.cx/e)-(mini?1:2),gy=oy+Math.min(ch-G.length-(mini?3:6),Math.round(mf.cy/e)+Math.round(mf.s/e/2));
    G.forEach((l,yy)=>[...l].forEach((q,xx)=>{if(q==='1'){const d=(gy+yy)*W*4+(gx+xx)*4;const c=yy<2?[224,80,92]:[163,18,31];px[d]=c[0];px[d+1]=c[1];px[d+2]=c[2];px[d+3]=255}}));
  }
  const c=document.createElement('canvas');c.width=W;c.height=H;c.getContext('2d').putImageData(new ImageData(px,W,H),0,0);
  return {url:c.toDataURL(),w:W,h:H};
}
function coBrasao(b,{k=1,mini=false,necro=false,alt=''}={}){
  const chave=JSON.stringify([b.forma,b.cor,b.cor2,b.divisao,b.simbolo,b.ornamento,b.inicial,mini,necro]);
  let r=CO_CACHE.get(chave);if(!r){r=coDesenha(b,mini,necro);CO_CACHE.set(chave,r)}
  return `<img class="co-b" src="${r.url}" width="${r.w*k}" height="${r.h*k}" alt="${saEsc(alt)}">`;
}

/* ---- os dados de exemplo ---- */
let CO_D=null;
function coDados(){
  if(CO_D)return CO_D;
  const H=36e5,DIA=864e5,ag=Date.now();
  const rp={id:'rp',nome:'Ordem do Relógio Partido',lema:'Quem para o relógio escolhe a hora.',codigo:'CRP-RK7M-4XVD',classificacao:'oficial',escopo:'local',nota:null,brasao:{forma:'escudo',cor:'cobalto',cor2:'onix',divisao:'quartelado',simbolo:'relogio',ornamento:'louros',inicial:'O'},rivais:['cc'],
    membros:[{id:'nyx',personagem:'Nyx',cargo:'lider',entrou:ag-90*DIA},{id:'lirio',personagem:'Lírio',cargo:'vice',entrou:ag-60*DIA},{id:'fosca',personagem:'Fosca',cargo:'membro',entrou:ag-21*DIA},{id:'corvo',personagem:'Corvo',cargo:'membro',entrou:ag-4*DIA}]};
  const cc={id:'cc',nome:'Colégio das Cinzas',lema:'O que queima não volta a pedir.',codigo:'CRP-N3CR-6RAV',classificacao:'necro',escopo:'local',nota:'Fraude de trocas e coação de Records.',brasao:{forma:'cruz',cor:'vinho',cor2:null,divisao:'pleno',simbolo:'mascara',ornamento:'correntes',inicial:'C'},rivais:['rp'],
    membros:[{id:'isis',personagem:'Ísis',cargo:'lider',entrou:ag-120*DIA},{id:'moira',personagem:'Moira',cargo:'vice',entrou:ag-80*DIA},{id:'hugo',personagem:'Hugo',cargo:'membro',entrou:ag-45*DIA}]};
  const va={id:'va',nome:'Vigília de Aço',lema:null,codigo:'CRP-VE7A-DA94',classificacao:'oficial',escopo:'global',nota:null,brasao:{forma:'torre',cor:'aco',cor2:null,divisao:'pleno',simbolo:'inicial',ornamento:'nenhum',inicial:'V'},rivais:[],
    membros:[{id:'bento',personagem:'Bento',cargo:'lider',entrou:ag-200*DIA},{id:'ana',personagem:'Ana',cargo:'membro',entrou:ag-40*DIA}]};
  const eu=c=>({id:'eu',personagem:'Seu nome',cargo:c,entrou:ag-12*DIA,eu:true});
  const est=q.get('corp')||(estado==='owner'?'lider':'sem');
  const D={corps:[rp,cc,va],minha:null,pedido:null,pendente:null,recusada:null,convites:[],pedidos:[],convitesEnviados:[],transf:[],transfHoje:0,recrutouHoje:false,fundacoes:[],dvSobrevividos:estado==='novato'?0:2};
  const entra=(corp,c)=>{corp.membros=[...corp.membros];if(c==='lider'){corp.membros[0]={...corp.membros[0],cargo:'vice'};corp.membros[1]={...corp.membros[1],cargo:'membro'}}corp.membros.push(eu(c));D.minha=corp};
  if(est==='membro'||est==='vice'||est==='lider')entra(rp,est);
  if(est==='necro')entra(cc,'membro');
  if(est==='sem'||est==='recusada'){D.convites=[{id:'v1',corp:va,de:'Bento',direto:true,em:ag-2*H},{id:'v2',corp:rp,de:'Corvo',direto:false,em:ag-26*H}]}
  if(est==='pedido')D.pedido={id:'p1',corp:rp,origem:'codigo',em:ag-3*H};
  if(est==='analise'){D.pendente={id:'f1',nome:'Casa do Ponteiro Quebrado',lema:'Nenhuma hora é emprestada.',brasao:{forma:'relogio',cor:'ametista',cor2:null,divisao:'pleno',simbolo:'corvo',ornamento:'asas',inicial:'C'},custo:CO_CFG.custo,em:ag-H,fundador:'Você'};D.fundacoes.push(D.pendente)}
  if(est==='recusada')D.recusada={nome:'Liga dos Sem Relógio',nota:'O nome imita o de uma Corporação já registrada.',devolvido:true};
  if(D.minha){
    D.pedidos=[{id:'q1',origem:'codigo',por:null,em:ag-5*H,perfil:{personagem:'Matheus',desde:ag-34*DIA,dv:{p:4,s:2},cartas:11,apar:{nome:'Grifo de Bronze',tipo:'Armadura'}}},{id:'q2',origem:'convite',por:'Fosca',em:ag-29*H,perfil:{personagem:'Velada',desde:ag-120*DIA,dv:{p:9,s:7},cartas:27,apar:null}}];
    D.convitesEnviados=[{id:'e1',para:'Tiago',de:'Fosca',em:ag-8*H}];
    D.transf=[{id:'t1',c:'xadrez_bispo',de:'Lírio',para:'Fosca',em:ag-DIA},{id:'t2',c:'escudo',de:'Nyx',para:'Corvo',em:ag-3*DIA}];
  }
  // na Mesa aparece também uma fundação de outro Record
  D.fundacoes.push({id:'f2',nome:'Irmandade da Hora Morta',lema:null,brasao:{forma:'ampulheta',cor:'noite',cor2:'prata',divisao:'cortado',simbolo:'inicial',ornamento:'raios',inicial:'I'},custo:CO_CFG.custo,em:ag-9*H,fundador:'Sol',reqs:[{r:'Deadly Votes sobrevividos',a:3,x:CO_CFG.dvExigido},{r:'Cartas no inventário',a:14,x:CO_CFG.cartasExigidas}]});
  CO_D=D;return D;
}

/* ---- a tela ---- */
function montaCorp(raiz){
  let g={viu:false};try{Object.assign(g,JSON.parse(localStorage.getItem('devo-corp')))}catch{}
  const grava=()=>{try{localStorage.setItem('devo-corp',JSON.stringify(g))}catch{}};
  const equipe=estado==='owner',jan=()=>raiz.closest('.jan');
  let D,aba=q.get('corpaba')||'membros',nota='',regras=false,codigo='',erCod='',editaLema=false,erMem='',convidado='',enviado='',recT='',recX='',cpara=null,cuid=null,repintaEquipe=null;
  const $r=s=>raiz.querySelector(s);
  raiz.innerHTML='<p class="co-carrega">Consultando a Companhia…</p>';
  const cab=(t,s)=>`<header class="s-cab"><h4>${t}</h4>${s?`<small>${s}</small>`:''}</header>`;
  const vazio=(t,p)=>`<div class="s-vazio fundo"><strong>${t}</strong><p class="r-sub">${p}</p></div>`;
  const okMsg=()=>nota?`<p class="s-ok fundo" role="status">${nota}</p>`:'';
  const cartasMinhas=()=>Object.values(TENHO).reduce((s,[n])=>s+n,0);
  const reqs=()=>[{id:'dv',r:'Deadly Votes sobrevividos',a:D.dvSobrevividos,x:CO_CFG.dvExigido},{id:'cartas',r:'Cartas no inventário',a:cartasMinhas(),x:CO_CFG.cartasExigidas}];
  const atende=()=>reqs().every(r=>r.a>=r.x);
  const pagar=min=>{if(segPulso-min*60<CO_CFG.reserva*60)return false;mudaPulso(-min*60);return true};
  const selo=(t,c='seu')=>`<span class="s-sel ${c}">${t}</span>`;
  const monog=p=>`<i class="co-mon ${p.cargo==='lider'?'li':p.cargo==='vice'?'vi':''}" aria-hidden="true">${saEsc(p.personagem[0].toLocaleUpperCase('pt-BR'))}</i>`;

  /* -- cabeçalho: sem Corporação, o salão de registro; com Corporação, a sala dela com o brasão no nicho -- */
  function topo(){
    const m=D.minha,necro=m&&m.classificacao==='necro';
    const mel=`<button class="k-mel chanfro co-mel" id="co-mel" aria-label="Chamar a Companhia"><img src="art/os/npc/melissa-rosto.png" alt=""><span>Companhia</span></button>`;
    if(!m)return `<div class="co-cena reg"><img class="co-fundo" src="${coArte('registro')}" alt="O salão de registro da Companhia, com um projetor de hexágonos sobre o balcão">${mel}</div><i class="s-dit" aria-hidden="true"></i>
      <section class="co-titulo"><small>Companhia de Despertados · registro</small><h3>Corporações</h3><p>Poucos Records alcançam o sucesso trabalhando sozinhos.</p></section>`;
    const me=m.membros.find(p=>p.eu),lider=me.cargo==='lider';
    const pp=coPapelDe(m);
    return `<div class="co-cena ${necro?'necro':''}${pp?' com-papel':''}" ${pp?`style="--papel-cena:url('${pp}')"`:''}>${pp?'<i class="co-papel-cena" aria-hidden="true"></i>':`<img class="co-fundo" src="${coArte(necro?'sala-necro':'sala')}" alt="A sala da Corporação">`}<div class="co-nicho">${coBrasao(m.brasao,{k:coK(),necro,alt:`Brasão de ${m.nome}`})}</div>${mel}</div><i class="s-dit" aria-hidden="true"></i>
      <section class="co-ficha ${necro?'necro':''}" aria-label="Corporação ${saEsc(m.nome)}">
        <div class="s-lin co-faixa"><span><img src="${coArte('selo-p')}" alt="">Registro da Companhia</span><b>${necro?'Classe N':'Classe A'}</b></div>
        <p class="co-cargo">${CO_CARGO[me.cargo]} · ${m.membros.length}/${CO_CFG.maxMembros}</p>
        <h3>${saEsc(m.nome)}</h3>${m.lema?`<p class="co-lema">“${saEsc(m.lema)}”</p>`:''}
        ${editaLema?`<form class="co-lema-ed" id="co-lema-f"><label class="s-rot" for="co-lema-i">Lema da Corporação</label><input class="s-in" id="co-lema-i" maxlength="90" value="${saEsc(m.lema||'')}" placeholder="Uma frase para o brasão (opcional)" autocomplete="off"><div class="co-linha"><button class="r-bt chanfro s-forte">Salvar</button>${m.lema?'<button type="button" class="r-bt chanfro" id="co-lema-x">Tirar o lema</button>':''}<button type="button" class="r-link" id="co-lema-v">Cancelar</button></div></form>`
          :lider?`<div class="co-linha"><button class="r-link" id="co-lema-e">${m.lema?'Trocar o lema':'+ Pôr um lema'}</button><button class="r-link" id="co-redes">Redesenhar o brasão</button></div>`:''}
        <div class="co-selos">${necro?selo('Necro-Corporação','sup'):selo('Oficial','lid')}${m.escopo==='global'?selo('Global · provisório','ava'):''}</div>
        ${necro?'<p class="co-alerta" role="alert">A Companhia classificou esta Corporação como terrorista por violar o código de regras.</p>':''}
        <div class="co-cod"><div><small>Código de identificação</small><b class="fundo" id="co-cod">${m.codigo}</b></div><button class="r-bt chanfro" id="co-copia">Copiar</button></div>
      </section>`;
  }
  const coK=()=>pc()?2:(raiz.clientWidth>=360?2:1);

  /* -- sem Corporação -- */
  function terminal(){
    const bloq=!!D.pendente;
    return `<section class="co-term fundo" aria-label="Código de identificação"><div class="s-lin co-faixa"><span><img src="${coArte('selo-p')}" alt="">Terminal da Companhia</span><b>Entrada</b></div>
      <small class="co-sob">Entrar numa Corporação</small><h4>Código de identificação</h4>
      <p class="r-sub">Insira o código da Corporação. O líder ou o vice-líder aprova a sua entrada e, durante o processo, vê partes do seu perfil.</p>
      <ol class="co-etapas" aria-label="Etapas">${['Código','Pedido','Aprovação'].map((t,i)=>`<li class="${i===0?'on':''}"><i>${i+1}</i><span>${t}</span></li>`).join('')}</ol>
      <form id="co-form"><label class="vs" for="co-in">Código de identificação</label><span class="co-mira"><input id="co-in" value="${saEsc(codigo)}" maxlength="16" placeholder="CRP-XXXX-XXXX" autocomplete="off" autocapitalize="characters" spellcheck="false" ${bloq?'disabled':''} ${erCod?'aria-invalid="true"':''}></span>
      ${erCod?`<p class="r-erro" role="alert">${erCod}</p>`:''}${bloq?'<p class="r-sub">Enquanto a sua fundação estiver em análise, não é possível pedir entrada em outra Corporação.</p>':''}
      <button class="r-bt chanfro s-forte s-larga" id="co-consulta" ${bloq||!codigo.trim()?'disabled':''}>Consultar código</button></form></section>`;
  }
  function pedidoEnviado(){
    const p=D.pedido,necro=p.corp.classificacao==='necro';
    return `<section class="co-ped fundo ${necro?'necro':''}" aria-label="Pedido de entrada enviado"><div class="co-ped-b">${coBrasao(p.corp.brasao,{necro,alt:''})}</div><div>${selo('Pedido enviado','ava')}<h4>${saEsc(p.corp.nome)}</h4><small>${p.origem==='convite'?'Por convite':'Pelo código'} · ${coDia(p.em)}</small>
      <p><img src="${px('pulso')}" alt="">Aguardando o líder ou o vice-líder aprovar a sua entrada.</p><button class="r-bt chanfro" id="co-canc">Cancelar pedido</button></div></section>`;
  }
  function convites(){
    if(!D.convites.length)return '';
    return cab('Convites','De Records que já fazem parte de uma Corporação')+`<ul class="co-lista">${D.convites.map(v=>`<li class="co-conv fundo" aria-label="Convite de ${saEsc(v.corp.nome)}"><div class="co-mini">${coBrasao(v.corp.brasao,{mini:true,necro:v.corp.classificacao==='necro'})}</div><div class="co-mid"><strong>${saEsc(v.corp.nome)}</strong><p class="r-sub">${v.de?`${saEsc(v.de)} convidou você`:'Convite da Corporação'} · ${v.direto?'entrada direta':'passa pelo líder'}</p>${v.corp.classificacao==='necro'?selo('Necro','sup'):''}<div class="s-duo"><button class="r-bt chanfro s-forte" data-vs="${v.id}">Aceitar</button><button class="r-bt chanfro" data-vn="${v.id}">Recusar</button></div></div></li>`).join('')}</ul>`;
  }
  function fundar(){
    const c=D.pendente,ok=atende();
    if(c)return cab('Fundar uma Corporação','Tempo + aprovação legal')+`<section class="co-ped fundo" aria-label="Fundação em análise"><div class="co-ped-b">${coBrasao(c.brasao,{alt:''})}</div><div>${selo('Em análise','ava')}<h4>${saEsc(c.nome)}</h4><p class="r-sub">A Companhia avalia o seu perfil. Pago: ${saTempo(c.custo)}. Se recusarem, o Tempo volta.</p><button class="r-link s-esq-link" id="co-desiste">Desistir da fundação</button></div></section>`;
    const rec=D.recusada;
    return cab('Fundar uma Corporação','Tempo + aprovação legal · valores provisórios')+`<section class="s-placa fundo">
      ${rec?`<p class="co-recusa" role="status">A Companhia recusou “${saEsc(rec.nome)}”${rec.nota?`: ${saEsc(rec.nota)}`:'.'} ${rec.devolvido?'O Tempo foi devolvido.':''}</p>`:''}
      <dl class="co-reqs" aria-label="Requisitos do perfil">${reqs().map(r=>{const yes=r.a>=r.x;return `<div class="${yes?'ok':''}"><dt><i aria-hidden="true"></i>${r.r}</dt><dd><u aria-hidden="true"><s style="width:${Math.min(100,r.a/Math.max(1,r.x)*100)}%"></s></u><b>${Math.min(r.a,999)}/${r.x}</b></dd></div>`}).join('')}</dl>
      <div class="s-lin co-inv"><span>Investimento</span><b><img src="${px('pulso')}" alt="">${saTempo(CO_CFG.custo)}</b></div>
      <button class="r-bt chanfro ${ok?'s-forte':''} s-larga" id="co-fundar" ${D.pedido?'disabled':''}>Fundar</button>
      ${ok?'':'<p class="r-sub">Seu perfil ainda não atende a todos os requisitos.</p>'}</section>`;
  }
  /* -- com Corporação -- */
  function abas(m){
    const decide=coPode(m.membros.find(p=>p.eu).cargo),n=D.pedidos.length;
    if(!decide&&aba==='pedidos')aba='membros';
    const lider=m.membros.find(p=>p.eu).cargo==='lider';
    if(!lider&&aba==='papel')aba='membros';
    return `<div class="r-abas" role="tablist" aria-label="Seções da Corporação">${[['chat','Chat'],['membros','Membros'],...(decide?[['pedidos','Pedidos',n]]:[]),['cartas','Cartas'],['recrutar','Recrutar'],...(lider?[['papel','Parede']]:[])].map(([id,t,c])=>`<button class="chanfro" role="tab" data-a="${id}" aria-selected="${aba===id}">${t}${c?` <b>${c}</b>`:''}</button>`).join('')}</div>`;
  }
  function pMembros(m){
    const me=m.membros.find(p=>p.eu),lider=me.cargo==='lider';
    const ordem={lider:0,vice:1,membro:2};
    return cab('Membros','Líder, vice-líder e membros')+`<ul class="co-mems fundo">${[...m.membros].sort((a,b)=>ordem[a.cargo]-ordem[b.cargo]).map(p=>`<li>${monog(p)}<div class="co-mid"><strong>${saEsc(p.personagem)}${p.eu?' <small>você</small>':''}</strong><small>desde ${coDia(p.entrou)}</small></div>${selo(CO_CARGO[p.cargo],p.cargo==='lider'?'lid':p.cargo==='vice'?'ava':'seu')}${lider&&!p.eu?`<button class="co-ger chanfro" data-gere="${p.id}" aria-label="Gerir ${saEsc(p.personagem)}">···</button>`:''}</li>`).join('')}</ul>
      ${cab('Convidar um Record','Convite direto pelo nome do personagem')}<section class="s-placa fundo"><form id="co-conv"><label class="s-rot" for="co-nome">Nome do personagem</label><input class="s-in" id="co-nome" maxlength="40" value="${saEsc(convidado)}" placeholder="Como os NPCs chamam o Record" autocomplete="off"><button class="r-bt chanfro s-larga co-mt" id="co-convida" ${convidado.trim().length<2?'disabled':''}>Convidar</button></form>
        ${erMem?`<p class="r-erro" role="alert">${erMem}</p>`:''}${enviado?`<p class="s-ok fundo" role="status">Convite enviado para ${saEsc(enviado)}.</p>`:''}${coPode(me.cargo)?'':'<p class="r-sub">Convites de membros passam pelo líder ou vice-líder antes da entrada.</p>'}
        ${D.convitesEnviados.length?`<ul class="co-pend" aria-label="Convites pendentes">${D.convitesEnviados.map(v=>`<li><span>${saEsc(v.para)} <small>· por ${saEsc(v.de)}</small></span>${v.de==='Você'||coPode(me.cargo)?`<button class="r-link" data-vcanc="${v.id}">Cancelar</button>`:selo('Pendente')}</li>`).join('')}</ul>`:''}</section>
      ${cab('Jogos coletivos especiais','Em breve · provisório')}<ul class="co-lista">${CO_JOGOS.map(j=>`<li class="co-jogo fundo"><div class="s-lin"><strong>${j.titulo}</strong>${selo('Em breve')}</div><p class="r-sub">${j.d}</p><small class="${m.membros.length>=j.min?'ok':''}">Mínimo de ${j.min} membros · vocês são ${m.membros.length}</small></li>`).join('')}</ul>
      ${cab('Corporações rivais','Provisório')}${m.rivais.length?`<ul class="co-mems fundo">${m.rivais.map(id=>{const r=D.corps.find(x=>x.id===id);return `<li><div class="co-mini">${coBrasao(r.brasao,{mini:true,necro:r.classificacao==='necro'})}</div><div class="co-mid"><strong>${saEsc(r.nome)}</strong></div></li>`}).join('')}</ul>`:vazio('Nenhuma rivalidade registrada','Tome cuidado com as Corporações Rivais e com as Corporações Globais.')}
      <button class="r-bt chanfro j-perigo s-larga co-mt" id="co-sair">Sair da Corporação</button>`;
  }
  function pPedidos(){
    return cab('Pedidos de entrada','Você vê só as partes do perfil permitidas pela Companhia')+(D.pedidos.length?`<ul class="co-lista">${D.pedidos.map(p=>`<li class="co-req-p fundo" aria-label="Pedido de ${saEsc(p.perfil.personagem)}"><div class="co-top">${monog({personagem:p.perfil.personagem})}<div class="co-mid"><strong>${saEsc(p.perfil.personagem)}</strong><small>${p.origem==='convite'?`Convite de ${saEsc(p.por||'um membro')}`:'Pelo código'} · ${coDia(p.em)}</small></div></div>
      <dl class="s-dl"><div><dt>No DEVO desde</dt><dd>${coDia(p.perfil.desde)}</dd></div><div><dt>Deadly Votes</dt><dd>${p.perfil.dv.p} · sobreviveu a ${p.perfil.dv.s}</dd></div><div><dt>Cartas</dt><dd>${p.perfil.cartas}</dd></div><div><dt>Aparência</dt><dd>${p.perfil.apar?`${saEsc(p.perfil.apar.nome)} · ${saEsc(p.perfil.apar.tipo)}`:'—'}</dd></div></dl>
      <div class="s-duo"><button class="r-bt chanfro s-forte" data-pa="${p.id}">Aprovar</button><button class="r-bt chanfro" data-pr="${p.id}">Recusar</button></div></li>`).join('')}</ul>`:vazio('Nenhum pedido','Quando alguém usar o código da Corporação, o pedido aparece aqui.'));
  }
  function pCartas(m){
    const outros=m.membros.filter(p=>!p.eu),restam=Math.max(0,CO_CFG.porDia-D.transfHoje);
    const copias=Object.entries(TENHO).flatMap(([id,[n]])=>Array(n).fill(id));
    if(cuid!==null&&cuid>=copias.length)cuid=null;
    const carta=cuid!==null?saCarta(copias[cuid]):null,dest=outros.find(p=>p.id===cpara);
    return cab('Transferir carta',`Entre membros · ${restam} de ${CO_CFG.porDia} hoje`)+(outros.length?`<section class="s-placa fundo"><small class="co-rot">Para quem</small><div class="co-quem" role="group" aria-label="Destinatário">${outros.map(p=>`<button class="chanfro" data-para="${p.id}" aria-pressed="${cpara===p.id}">${saEsc(p.personagem)}</button>`).join('')}</div>
        <small class="co-rot">Qual carta</small>${copias.length?`<ul class="i-cartas s-esc" aria-label="Suas cartas">${copias.slice(0,24).map((id,i)=>`<li><button data-cu="${i}" aria-pressed="${cuid===i}" aria-label="Escolher ${saCarta(id).nome}">${saFace(id)}</button></li>`).join('')}</ul>`:vazio('Sem cartas','Você não tem cartas para transferir.')}
        <p class="r-sub">Cartas presas no Salão das Máscaras (Bandeja ou Mercado) não podem ser transferidas. A carta sai do seu inventário na hora.</p>${okMsg()}
        <p class="co-rumo" aria-live="polite">${carta?`<b>${carta.nome}</b>`:'Escolha uma carta'} <i aria-hidden="true">→</i> ${dest?`<b>${saEsc(dest.personagem)}</b>`:'e um membro'}</p>
        <button class="r-bt chanfro s-forte s-larga" id="co-transf" ${!carta||!dest||restam<=0?'disabled':''}>Transferir carta</button></section>`:vazio('Ninguém para receber','Convide Records para a Corporação; as cartas só circulam entre membros.'))
      +cab('Últimas transferências')+(D.transf.length?`<ul class="co-tr fundo">${D.transf.map(t=>`<li><span><b>${saCarta(t.c).nome}</b> · ${saEsc(t.de)} → ${saEsc(t.para)}</span><small>${coDia(t.em)}</small></li>`).join('')}</ul>`:vazio('Nada ainda','As cartas trocadas entre membros aparecem aqui.'));
  }
  function pRecrutar(m){
    const me=m.membros.find(p=>p.eu);
    if(!coPode(me.cargo))return cab('Recrutamento')+vazio('Só líder e vice','O anúncio de recrutamento no Salão das Máscaras é publicado pelo líder ou pelo vice-líder. Você pode convidar Records na aba Membros.');
    return cab('Anunciar no Salão','Recrutamento no mural do Salão das Máscaras')+`<section class="s-placa fundo"><p class="r-sub">O código de identificação vai junto no anúncio. Um anúncio por dia.</p>
      <form id="co-rec"><label class="s-rot" for="co-rt">Título</label><input class="s-in" id="co-rt" maxlength="80" value="${saEsc(recT)}" placeholder="Ex.: Procuramos jogadores de nervos firmes">
      <label class="s-rot co-mt" for="co-rx">Texto</label><textarea class="s-in" id="co-rx" maxlength="480" rows="4" placeholder="Quem vocês procuram e o que oferecem">${saEsc(recX)}</textarea>
      ${okMsg()}<p class="r-erro" id="co-rer" role="alert" hidden></p><button class="r-bt chanfro s-forte s-larga co-mt" id="co-pub" ${recT.trim().length<3||recX.trim().length<3?'disabled':''}>Publicar no Salão</button></form></section>`;
  }
  function codigoRegras(){
    return `<section class="co-regras fundo" aria-label="${CO_REGRAS.titulo}"><button class="co-reg-bt" id="co-reg" aria-expanded="${regras}"><img src="${coArte('selo-p')}" alt=""><span><strong>${CO_REGRAS.titulo}</strong><small>Oficial ou Necro-Corporação · texto provisório</small></span><i aria-hidden="true">${regras?'−':'+'}</i></button>
      ${regras?`<ol>${CO_REGRAS.artigos.map(a=>`<li>${a}</li>`).join('')}<li class="co-alerta">Quando essas regras são violadas, a Corporação passa a ser classificada como terrorista: uma Necro-Corporação.</li></ol>`:''}</section>`;
  }
  function pPapel(m){
    const atual=coPapeis()[m.id]||null,proprio=atual&&atual.startsWith('data:');
    const selo='<b class="co-pp-selo">Na parede</b>';
    return cab('Papel de parede','Fica atrás do chat, na parede do salão e no fundo do sistema de todos os membros.')+`<section class="co-papel fundo">
      <div class="co-pp-grade" role="radiogroup" aria-label="Papéis de parede"><label class="co-pp co-pp-envia${proprio?' sel':''}" ${proprio?`style="background-image:url('${atual}')"`:''}>${proprio?selo:''}<input type="file" id="co-pp-arq" accept="image/*"><span>${proprio?'Trocar a imagem do aparelho':'Escolher do aparelho'}</span></label>${CO_PAPEIS.map(([id,nome])=>`<button class="co-pp" role="radio" aria-checked="${atual===id}" data-papel="${id}" style="background-image:url('${coPapelSrc(id)}')">${atual===id?selo:''}<span>${nome}</span></button>`).join('')}
        <button class="co-pp co-pp-sis" role="radio" aria-checked="${!atual}" id="co-pp-tira">${!atual?selo:''}<span>Fundo do sistema</span></button></div>
      <p class="r-sub">Imagens escuras e calmas funcionam melhor atrás das janelas.</p></section>`;
  }
  // chat da Corporação: as mensagens correm por cima do papel de parede escolhido pelo líder
  function pChat(m){
    const pp=coPapelDe(m),me=m.membros.find(p=>p.eu);
    if(!D.chat)D.chat=[
      {de:'lirio',t:'Alguém vai no Deadly Vote de hoje à noite?',h:'21:04'},
      {de:'fosca',t:'Eu vou. Preciso de horas.',h:'21:06'},
      {de:'corvo',t:'Tenho duas cartas repetidas da coleção Xadrez, se alguém quiser.',h:'21:11'},
      {de:'lirio',t:'Manda uma pra mim pela aba Cartas.',h:'21:12'},
    ];
    const quem=id=>m.membros.find(p=>p.id===id)||me;
    return `<section class="co-chat${pp?' com-papel':''}" ${pp?`style="--papel-chat:url('${pp}')"`:''} aria-label="Chat da Corporação">
      <div class="co-chat-fala" aria-live="polite">${D.chat.map(c=>{const p=c.eu?me:quem(c.de);return `<div class="co-msg${c.eu?' eu':''}">${c.eu?'':monog(p)}<p>${c.eu?'':`<b>${saEsc(p.personagem)}</b>`}${saEsc(c.t)}<small>${c.h}</small></p></div>`}).join('')}</div>
      <form class="co-chat-env" id="co-chat-f"><input class="s-in" id="co-chat-i" maxlength="300" placeholder="Mensagem para a Corporação" autocomplete="off" aria-label="Mensagem"><button class="r-bt chanfro" aria-label="Enviar">Enviar</button></form>
      ${pp?'':(me.cargo==='lider'?'<p class="r-sub co-chat-dica">Escolha um papel de parede na aba Parede.</p>':'')}</section>`;
  }
  function tudo(){
    const c=raiz.closest('.corpo'),y=c?c.scrollTop:0,m=D.minha,fila=D.fundacoes.length;
    raiz.innerHTML=`<div class="s-grade"><div class="s-esq">${topo()}</div><div class="s-dir">${m?abas(m):''}<div class="co-painel" ${m?'role="tabpanel"':''}>${m?(aba==='membros'?okMsg()+pMembros(m):aba==='pedidos'?okMsg()+pPedidos():aba==='cartas'?pCartas(m):aba==='papel'?pPapel(m):aba==='chat'?pChat(m):pRecrutar(m)):okMsg()+(D.pedido?pedidoEnviado():terminal())+convites()+fundar()}${codigoRegras()}</div></div></div>
      ${equipe?`<button class="s-equipe chanfro" id="co-equipe"><img src="${px('mesa')}" alt=""><span>Painel da equipe</span>${fila?`<b>${fila}</b>`:''}</button>`:''}`;
    if(c)c.scrollTop=y;
    nota='';liga();coAvisaPapel(m);
    if(repintaEquipe)repintaEquipe();
  }
  /* -- ações -- */
  function liga(){
    const L=(s,f,ev='onclick')=>{const e=$r(s);if(e)e[ev]=f};
    L('#co-mel',chamada);
    L('#co-reg',()=>{regras=!regras;tudo()});
    L('#co-equipe',abreEquipe);
    raiz.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{aba=b.dataset.a;tudo();$r('.r-abas [aria-selected=true]')?.scrollIntoView({block:'nearest',inline:'nearest'});const t=$r('.r-abas'),cp=raiz.closest('.corpo');if(t&&cp&&cp.scrollTop>t.offsetTop)cp.scrollTop=t.offsetTop});
    // entrada por código
    const inp=$r('#co-in');
    if(inp)inp.oninput=()=>{inp.value=inp.value.toUpperCase().slice(0,16);codigo=inp.value;if(erCod){erCod='';inp.removeAttribute('aria-invalid');const e=$r('#co-form .r-erro');if(e)e.remove()}$r('#co-consulta').disabled=!codigo.trim()};
    L('#co-form',e=>{e.preventDefault();consultar()},'onsubmit');
    L('#co-canc',()=>{D.pedido=null;nota='Pedido cancelado.';tudo()});
    raiz.querySelectorAll('[data-vs]').forEach(b=>b.onclick=()=>responder(b.dataset.vs,true));
    raiz.querySelectorAll('[data-vn]').forEach(b=>b.onclick=()=>responder(b.dataset.vn,false));
    L('#co-fundar',abreFundar);
    L('#co-desiste',()=>{const f=D.pendente;mudaPulso(f.custo*60);D.fundacoes=D.fundacoes.filter(x=>x!==f);D.pendente=null;nota='Fundação retirada. O Tempo voltou para o seu pulso.';tudo()});
    // ficha
    L('#co-copia',()=>{const m=D.minha;try{navigator.clipboard?.writeText(m.codigo).catch(()=>{})}catch{}const b=$r('#co-copia');b.textContent='Copiado';setTimeout(()=>{if(b.isConnected)b.textContent='Copiar'},1800)});
    L('#co-lema-e',()=>{editaLema=true;tudo();$r('#co-lema-i').focus()});
    L('#co-lema-v',()=>{editaLema=false;tudo()});
    L('#co-lema-x',()=>{D.minha.lema=null;editaLema=false;tudo()});
    L('#co-lema-f',e=>{e.preventDefault();D.minha.lema=$r('#co-lema-i').value.trim()||null;editaLema=false;tudo()},'onsubmit');
    L('#co-redes',abreRedesenho);
    // membros
    raiz.querySelectorAll('[data-gere]').forEach(b=>b.onclick=()=>gerir(b.dataset.gere));
    const cn=$r('#co-nome');if(cn)cn.oninput=()=>{convidado=cn.value;$r('#co-convida').disabled=convidado.trim().length<2};
    L('#co-conv',e=>{e.preventDefault();convidar()},'onsubmit');
    raiz.querySelectorAll('[data-vcanc]').forEach(b=>b.onclick=()=>{D.convitesEnviados=D.convitesEnviados.filter(v=>v.id!==b.dataset.vcanc);enviado='';erMem='';tudo()});
    L('#co-sair',sair);
    L('#co-chat-f',e=>{e.preventDefault();const i=$r('#co-chat-i'),t=i.value.trim();if(!t)return;const d=new Date();D.chat.push({eu:true,t,h:`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`});tudo();const f=$r('.co-chat-fala');if(f)f.scrollTop=f.scrollHeight;$r('#co-chat-i').focus()},'onsubmit');
    {const f=$r('.co-chat-fala');if(f)f.scrollTop=f.scrollHeight}
    // papel de parede
    const poe=v=>{const t=coPapeis();if(v)t[D.minha.id]=v;else delete t[D.minha.id];try{localStorage.setItem('devo-corp-papel',JSON.stringify(t))}catch{nota='Não foi possível guardar a imagem neste aparelho.'}tudo()};
    raiz.querySelectorAll('[data-papel]').forEach(b=>b.onclick=()=>poe(b.dataset.papel));
    L('#co-pp-tira',()=>poe(null));
    const arq=$r('#co-pp-arq');
    if(arq)arq.onchange=()=>{const f=arq.files[0];if(!f)return;const im=new Image();im.onload=()=>{
      // reduz para no máximo 1600 px de largura antes de guardar
      const k=Math.min(1,1600/im.width),cv=document.createElement('canvas');cv.width=Math.round(im.width*k);cv.height=Math.round(im.height*k);
      cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height);URL.revokeObjectURL(im.src);poe(cv.toDataURL('image/jpeg',.82))};im.src=URL.createObjectURL(f)};
    // pedidos
    raiz.querySelectorAll('[data-pa]').forEach(b=>b.onclick=()=>decidir(b.dataset.pa,true));
    raiz.querySelectorAll('[data-pr]').forEach(b=>b.onclick=()=>decidir(b.dataset.pr,false));
    // cartas
    raiz.querySelectorAll('[data-para]').forEach(b=>b.onclick=()=>{cpara=b.dataset.para;tudo()});
    raiz.querySelectorAll('[data-cu]').forEach(b=>b.onclick=()=>{cuid=cuid===+b.dataset.cu?null:+b.dataset.cu;tudo()});
    L('#co-transf',transferir);
    // recrutamento
    const rt=$r('#co-rt'),rx=$r('#co-rx');
    if(rt){const up=()=>{recT=rt.value;recX=rx.value;$r('#co-pub').disabled=recT.trim().length<3||recX.trim().length<3};rt.oninput=rx.oninput=up}
    L('#co-rec',e=>{e.preventDefault();publicar()},'onsubmit');
  }
  function consultar(){
    const cod=coNormaliza(codigo);
    if(!CO_CODIGO.test(cod)){erCod='Código inválido. O formato é CRP-XXXX-XXXX.';return tudo()}
    const corp=D.corps.find(c=>c.codigo===cod);
    if(!corp){erCod='Nenhuma Corporação ativa com esse código.';return tudo()}
    previa(corp);
  }
  function previa(corp){
    const necro=corp.classificacao==='necro';
    const o=saFolha(jan(),'Código encontrado',saEsc(corp.nome),`<div class="s-corpo"><div class="co-prev ${necro?'necro':''}">${coBrasao(corp.brasao,{k:2,necro,alt:`Brasão de ${corp.nome}`})}</div>
      <div class="co-selos">${selo(necro?'Necro-Corporação':'Corporação oficial',necro?'sup':'lid')}</div>${corp.lema?`<p class="co-lema">“${saEsc(corp.lema)}”</p>`:''}<small class="co-rot">${corp.membros.length} ${corp.membros.length===1?'membro':'membros'} · ${corp.codigo}</small>
      ${necro?'<p class="co-alerta" role="alert">A Companhia de Despertados classificou esta Corporação como terrorista. Entrar numa Necro-Corporação é por sua conta e risco.</p>':''}
      <p class="r-sub">O líder ou o vice-líder verá o nome do seu personagem, desde quando você está no DEVO, sua participação em Deadly Votes, quantas cartas tem e a sua segunda aparência.</p><p class="r-erro" id="co-per" role="alert" hidden></p>
      <button class="r-bt chanfro ${necro?'j-perigo':'s-forte'} s-larga" id="co-env">Enviar pedido</button></div>`);
    o.querySelector('#co-env').onclick=()=>{
      if(D.pedido||D.pendente){const e=o.querySelector('#co-per');e.textContent=D.pedido?'Você já tem um pedido de entrada aguardando resposta.':'Sua Corporação ainda está em análise pela Companhia.';e.hidden=false;return}
      D.pedido={id:'p'+Date.now(),corp,origem:'codigo',em:Date.now()};codigo='';o.remove();tudo();
    };
  }
  function entrar(corp,cargo){
    corp.membros=[...corp.membros,{id:'eu',personagem:'Seu nome',cargo,entrou:Date.now(),eu:true}];
    D.minha=corp;D.pedido=null;D.convites=[];aba='membros';
    D.pedidos=[];D.convitesEnviados=[];D.transf=[];
  }
  function responder(id,sim){
    const v=D.convites.find(x=>x.id===id);D.convites=D.convites.filter(x=>x.id!==id);
    if(sim){
      if(v.direto){entrar(v.corp,'membro');nota=`Você agora faz parte de ${saEsc(v.corp.nome)}.`}
      else{D.pedido={id:'p'+Date.now(),corp:v.corp,origem:'convite',em:Date.now()};nota='O convite virou um pedido para o líder ou o vice-líder.'}
    }
    tudo();
  }
  /* editor do brasão: as mesmas escolhas do jogo */
  function editor(alvo,valor,muda){
    const set=p=>{Object.assign(valor,p);pinta();muda()};
    const mini=p=>({...valor,inicial:valor.inicial||'A',...p});
    const seg=()=>valor.cor2||Object.keys(CO_CORES).find(c=>c!==valor.cor);
    const cores=(atual,campo,rot)=>`<div class="co-cores">${Object.entries(CO_CORES).map(([k,c])=>`<button type="button" data-${campo}="${k}" aria-pressed="${atual===k}" aria-label="${rot}: ${c[0]}" title="${c[0]}"><i style="--a:${c[1]};--b:${c[2]};--c:${c[3]}"></i></button>`).join('')}</div>`;
    const op=(dado,id,atual,rot,br)=>`<button type="button" class="co-op" data-${dado}="${id}" aria-pressed="${atual===id}" aria-label="${rot}" title="${rot}">${coBrasao(br,{mini:true})}</button>`;
    function pinta(){
      const div=valor.divisao,nome=(l,v)=>l.find(x=>x[0]===v)[1];
      alvo.innerHTML=`<fieldset><legend>Forma</legend><div class="co-ops">${CO_FORMAS.map(([f,t])=>op('f',f,valor.forma,`Forma: ${t}`,mini({forma:f,ornamento:'nenhum',simbolo:'inicial',divisao:'pleno'}))).join('')}</div></fieldset>
        <fieldset><legend>Cor · ${CO_CORES[valor.cor][0]}</legend>${cores(valor.cor,'c','Cor')}</fieldset>
        <fieldset><legend>Campo · ${nome(CO_DIVISOES,div)}</legend><div class="co-ops">${CO_DIVISOES.map(([d,t])=>op('d',d,div,`Campo: ${t}`,mini({forma:'escudo',divisao:d,cor2:seg(),ornamento:'nenhum',simbolo:'inicial'}))).join('')}</div></fieldset>
        ${div!=='pleno'?`<fieldset><legend>Segunda cor · ${CO_CORES[seg()][0]}</legend>${cores(seg(),'s','Segunda cor')}</fieldset>`:''}
        <fieldset><legend>Figura · ${nome(CO_FIGURAS,valor.simbolo)}</legend><div class="co-ops">${CO_FIGURAS.map(([s,t])=>op('g',s,valor.simbolo,`Figura: ${t}`,mini({forma:'escudo',simbolo:s,ornamento:'nenhum',divisao:'pleno'}))).join('')}</div></fieldset>
        <fieldset><legend>Ornamento · ${nome(CO_ORNATOS,valor.ornamento)}</legend><div class="co-ops o">${CO_ORNATOS.map(([s,t])=>op('o',s,valor.ornamento,`Ornamento: ${t}`,mini({forma:'escudo',ornamento:s,divisao:'pleno',simbolo:'inicial'}))).join('')}</div></fieldset>`;
      alvo.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>set({forma:b.dataset.f}));
      alvo.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>set({cor:b.dataset.c}));
      alvo.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>set({divisao:b.dataset.d,cor2:b.dataset.d==='pleno'?null:seg()}));
      alvo.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>set({cor2:b.dataset.s}));
      alvo.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>set({simbolo:b.dataset.g}));
      alvo.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>set({ornamento:b.dataset.o}));
    }
    pinta();
  }
  function abreFundar(){
    const b={forma:'escudo',cor:'aco',cor2:null,divisao:'pleno',simbolo:'inicial',ornamento:'nenhum',inicial:'C'};
    const o=saFolha(jan(),'Companhia de Despertados','Fundar Corporação',`<div class="s-corpo"><p class="r-sub">A avaliação administrativa considera se o seu perfil corresponde aos requisitos exigidos.</p>
      <div class="co-prev" id="co-pv"></div><small class="co-rot">Sinete da Corporação</small><strong class="co-pn" id="co-pn">Sem nome</strong><p class="co-lema" id="co-pl" hidden></p>
      <label class="s-rot" for="co-fn">Nome da Corporação</label><input class="s-in" id="co-fn" maxlength="40" placeholder="Ex.: Ordem do Relógio Partido" autocomplete="off">
      <label class="s-rot" for="co-fl">Lema (opcional)</label><input class="s-in" id="co-fl" maxlength="90" placeholder="Uma frase para o brasão" autocomplete="off">
      <div class="co-editor" id="co-ed"></div>
      <div class="s-lin co-inv"><span>Investimento em Tempo</span><b><img src="${px('pulso')}" alt="">${saTempo(CO_CFG.custo)}</b></div>
      <p class="r-sub">Sai do seu pulso agora (ele precisa manter ${saTempo(CO_CFG.reserva)} depois de pagar). Se a Companhia recusar, o Tempo volta. Valores provisórios.</p>
      ${atende()?'':'<p class="co-alerta">Seu perfil ainda não atende aos requisitos.</p>'}<p class="r-erro" id="co-fer" role="alert" hidden></p><button class="r-bt chanfro s-forte s-larga" id="co-paga" disabled>Pagar e enviar</button></div>`);
    const $o=s=>o.querySelector(s);
    const pv=()=>{const nome=$o('#co-fn').value.trim(),lema=$o('#co-fl').value.trim();b.inicial=coInicial(nome||'Corporação');$o('#co-pv').innerHTML=coBrasao(b,{k:2,alt:'Prévia do brasão'});$o('#co-pn').textContent=nome||'Sem nome';const l=$o('#co-pl');l.hidden=!lema;l.textContent=lema?`“${lema}”`:'';$o('#co-paga').disabled=nome.length<3||!atende()};
    editor($o('#co-ed'),b,pv);$o('#co-fn').oninput=$o('#co-fl').oninput=pv;pv();
    $o('#co-paga').onclick=()=>{
      const nome=$o('#co-fn').value.trim(),er=m=>{const e=$o('#co-fer');e.textContent=m;e.hidden=false};
      if([...D.corps,...D.fundacoes].some(c=>c.nome.toLocaleLowerCase('pt-BR')===nome.toLocaleLowerCase('pt-BR')))return er('Já existe uma Corporação com esse nome.');
      if(!pagar(CO_CFG.custo))return er(`Tempo insuficiente. Seu pulso precisa manter pelo menos ${CO_CFG.reserva} minutos depois de pagar.`);
      D.pendente={id:'f'+Date.now(),nome,lema:$o('#co-fl').value.trim()||null,brasao:{...b},custo:CO_CFG.custo,em:Date.now(),fundador:'Você'};D.fundacoes.push(D.pendente);D.recusada=null;o.remove();tudo();
    };
  }
  function abreRedesenho(){
    const m=D.minha,b={...m.brasao},o=saFolha(jan(),saEsc(m.nome),'Redesenhar o brasão',`<div class="s-corpo"><div class="co-prev" id="co-pv"></div><div class="co-editor" id="co-ed"></div><button class="r-bt chanfro s-forte s-larga" id="co-salva">Salvar o brasão</button></div>`);
    const pv=()=>{o.querySelector('#co-pv').innerHTML=coBrasao(b,{k:2,alt:'Prévia do brasão'})};
    editor(o.querySelector('#co-ed'),b,pv);pv();
    o.querySelector('#co-salva').onclick=()=>{m.brasao={...b};o.remove();tudo()};
  }
  function gerir(id){
    const m=D.minha,p=m.membros.find(x=>x.id===id);
    const o=saFolha(jan(),'Gerir membro',saEsc(p.personagem),`<div class="s-corpo"><button class="r-bt chanfro s-larga" id="co-g1">${p.cargo==='membro'?'Tornar vice-líder':'Tornar membro'}</button><button class="r-bt chanfro s-larga" id="co-g2">Passar liderança</button><button class="r-bt chanfro j-perigo s-larga" id="co-g3">Remover da Corporação</button></div>`);
    o.querySelector('#co-g1').onclick=()=>{p.cargo=p.cargo==='membro'?'vice':'membro';o.remove();tudo()};
    o.querySelector('#co-g2').onclick=()=>{m.membros.find(x=>x.eu).cargo='vice';p.cargo='lider';o.remove();nota=`${saEsc(p.personagem)} agora lidera a Corporação.`;tudo()};
    o.querySelector('#co-g3').onclick=()=>{m.membros=m.membros.filter(x=>x!==p);if(cpara===p.id)cpara=null;o.remove();tudo()};
  }
  function convidar(){
    const nome=convidado.trim();enviado='';erMem='';
    const achou=CO_LIVRES.find(n=>n.toLocaleLowerCase('pt-BR')===nome.toLocaleLowerCase('pt-BR'));
    const emCorp=D.corps.some(c=>c.membros.some(p=>!p.eu&&p.personagem.toLocaleLowerCase('pt-BR')===nome.toLocaleLowerCase('pt-BR')));
    if(nome.toLocaleLowerCase('pt-BR')==='você')erMem='Você já faz parte desta Corporação.';
    else if(emCorp)erMem='Esse Record já faz parte de uma Corporação.';
    else if(!achou)erMem='Nenhum Record encontrado com esse nome.';
    else if(D.convitesEnviados.some(v=>v.para===achou))erMem='Esse Record já tem um convite pendente desta Corporação.';
    else{D.convitesEnviados.push({id:'e'+Date.now(),para:achou,de:'Você',em:Date.now()});enviado=achou;convidado=''}
    tudo();
  }
  function sair(){
    const m=D.minha,me=m.membros.find(p=>p.eu),so=m.membros.length<=1,trava=me.cargo==='lider'&&!so;
    const o=saFolha(jan(),saEsc(m.nome),'Sair da Corporação?',`<div class="s-corpo"><p>${trava?'Passe a liderança para outro membro antes de sair.':so?'Você é o último membro: ao sair, a Corporação se dissolve e o código deixa de valer.':'Você perde as vantagens da Corporação. Para voltar, precisará de um novo pedido.'}</p><button class="r-bt chanfro j-perigo s-larga" id="co-ss" ${trava?'disabled':''}>Confirmar saída</button></div>`);
    o.querySelector('#co-ss').onclick=()=>{
      m.membros=m.membros.filter(p=>!p.eu);if(so)D.corps=D.corps.filter(c=>c!==m);
      D.minha=null;D.pedidos=[];D.convitesEnviados=[];cpara=null;cuid=null;o.remove();nota='Você saiu da Corporação.';tudo();
    };
  }
  function decidir(id,sim){
    const p=D.pedidos.find(x=>x.id===id),m=D.minha;
    if(sim&&m.membros.length>=CO_CFG.maxMembros){nota=`A Corporação já tem ${CO_CFG.maxMembros} membros.`;return tudo()}
    D.pedidos=D.pedidos.filter(x=>x!==p);
    if(sim){m.membros.push({id:'m'+Date.now(),personagem:p.perfil.personagem,cargo:'membro',entrou:Date.now()});nota=`${saEsc(p.perfil.personagem)} entrou na Corporação.`}
    tudo();
  }
  function transferir(){
    const copias=Object.entries(TENHO).flatMap(([id,[n]])=>Array(n).fill(id)),id=copias[cuid],dest=D.minha.membros.find(p=>p.id===cpara);
    if(!id||!dest)return;
    if(D.transfHoje>=CO_CFG.porDia){nota=`Limite de ${CO_CFG.porDia} transferências por dia atingido.`;return tudo()}
    saTiraCarta(id);D.transfHoje++;D.transf.unshift({id:'t'+Date.now(),c:id,de:'Você',para:dest.personagem,em:Date.now()});
    nota=`${saCarta(id).nome} foi para ${saEsc(dest.personagem)}.`;cuid=null;tudo();
  }
  function publicar(){
    if(D.recrutouHoje){const e=$r('#co-rer');e.textContent='Sua Corporação já publicou um anúncio hoje.';e.hidden=false;return}
    const m=D.minha;
    saDados().anuncios.unshift({id:'a'+Date.now(),tipo:'recrutamento',titulo:recT.trim(),texto:`${recX.trim()}\nCódigo de identificação: ${m.codigo}`,autor:null,corp:m.nome,meu:false,st:'publicado',custo:0});
    D.recrutouHoje=true;recT='';recX='';nota='Anúncio publicado no Salão das Máscaras.';tudo();
  }
  /* -- a chamada holográfica da Melissa: a cena de diálogo aprovada, projetada pelo celular -- */
  async function chamada(){
    const j=jan();if(j.querySelector('.co-holo'))return;
    const meta=await fetch('art/anim.json').then(r=>r.json()).catch(()=>({}));
    const pode=g.viu||equipe,rapido=parado||q.has('semraf');
    // as poses já ficam prontas: a figura não pode aparecer atrasada
    ['sorriso','explica','pensativo','preocupado','apresenta','convite','confiante','surpreso','riso'].forEach(p=>{new Image().src=`art/melissa-q-${p}.png`});
    const o=document.createElement('div');o.className='k-cena co-holo';o.setAttribute('role','dialog');o.setAttribute('aria-label','Chamada da Melissa');
    o.innerHTML=`<img class="co-h-fundo" src="${coArte('chamada')}" alt="">${pode?'<button class="k-pula chanfro">Pular</button>':''}<div class="k-balao"><b>Melissa</b><p aria-live="polite"></p><i aria-hidden="true"></i></div><div class="co-h-fig k-fig" hidden><img class="b" alt="Melissa, em holograma"><img class="c p" alt="" hidden><img class="c m" alt="" hidden></div><div class="co-ops-h" hidden></div>`;
    j.append(o);
    const $o=s=>o.querySelector(s),fila=[...CO_CENA];
    let n=0,tid,flap,pis,txt='',k=0,poseAt=null,escolhendo=false;
    const puro=t=>poGen(t).replace(/\*/g,'');
    const marca=(t,ate=Infinity)=>{let r='',res=ate;poGen(t).split('*').forEach((p,i)=>{if(res<=0||!p)return;const x=p.slice(0,res);res-=x.length;r+=i%2?`<strong>${x}</strong>`:x});return r};
    const fim=()=>{clearInterval(tid);clearInterval(flap);clearTimeout(pis);o.remove();if(!g.viu){g.viu=true;grava()}};
    const acaba=()=>{clearInterval(tid);clearInterval(flap);$o('.m').hidden=true;$o('.k-balao p').innerHTML=marca(txt);k=puro(txt).length;$o('.k-balao>i').hidden=false};
    function mostra(){
      const s=fila[n];clearInterval(tid);clearInterval(flap);
      if(s.esc)return opcoes(s);
      const ba=$o('.k-balao'),fig=$o('.co-h-fig');
      ba.classList.toggle('narr',!!s.n);$o('.k-balao b').hidden=!!s.n;
      if(s.holo==='materializa'){fig.hidden=false;fig.classList.remove('sai');fig.classList.add('entra');if(!poseAt)troca('sorriso')}
      if(s.holo==='encerra'){fig.classList.remove('entra');fig.classList.add('sai')}
      if(s.multa){mudaPulso(-CO_CFG.multa*60)}
      if(s.p)troca(s.p);
      txt=s.n||s.t;k=0;$o('.k-balao>i').hidden=true;ba.classList.toggle('longo',puro(txt).length>190);
      if(rapido)return acaba();
      $o('.k-balao p').innerHTML='';
      const tot=puro(txt).length,m=s.p&&meta[s.p];
      tid=setInterval(()=>{$o('.k-balao p').innerHTML=marca(txt,++k);if(k>=tot)acaba()},24);
      if(m&&m.boca)flap=setInterval(()=>{$o('.m').hidden=!$o('.m').hidden},110);
    }
    function troca(pose){
      poseAt=pose;const m=meta[pose]||{},fig=$o('.co-h-fig'),src=`art/melissa-q-${pose}.png`;
      $o('.b').src=src;fig.style.setProperty('--sprite',`url(${src})`);$o('.p').hidden=true;$o('.m').hidden=true;
      if(m.pisca)$o('.p').src=`art/anim/${pose}-pisca.png`;if(m.boca)$o('.m').src=`art/anim/${pose}-boca.png`;
    }
    function opcoes(s){
      escolhendo=true;const box=$o('.co-ops-h');box.hidden=false;$o('.k-balao>i').hidden=true;
      box.innerHTML=s.esc.map(([t],i)=>`<button class="chanfro" data-e="${i}">${t}</button>`).join('');
      box.querySelectorAll('[data-e]').forEach(b=>b.onclick=ev=>{ev.stopPropagation();const r=s.esc[+b.dataset.e][1];fila.splice(n+1,0,...r);box.hidden=true;box.innerHTML='';escolhendo=false;n++;mostra()});
    }
    const pisca=()=>{const m=meta[poseAt]||{};if(m.pisca&&!$o('.co-h-fig').hidden){$o('.p').hidden=false;setTimeout(()=>{if(o.isConnected)$o('.p').hidden=true},110)}if(o.isConnected)pis=setTimeout(pisca,2200+Math.random()*2800)};
    if(!rapido)pis=setTimeout(pisca,2000);
    o.addEventListener('click',e=>{
      if(e.target.closest('.k-pula'))return fim();
      if(escolhendo)return;
      if(k<puro(txt).length)return acaba();
      n++;if(n>=fila.length)return fim();
      mostra();
    });
    mostra();
    if(q.has('cenapasso')){const ate=+q.get('cenapasso');$o('.co-h-fig').hidden=false;$o('.co-h-fig').classList.add('entra');if(!poseAt)troca('sorriso');n=Math.min(ate,fila.length-1);mostra()}
  }
  /* -- painel da equipe (Mesa › Corporações): janela própria -- */
  function abreEquipe(){
    const nova=!janelas.has('corp-equipe');
    const je=janela('corp-equipe',{titulo:'Painel da equipe',ic:'mesa',curto:'Equipe',html:'<div id="ceq"></div>',caixa:pc()?[8,56,412,700]:null});
    je.el.querySelector('.corpo').classList.add('r-corpo');
    if(nova)montaEquipe($('ceq'));
  }
  function montaEquipe(rz){
    const notas={};let er='';
    const pinta=()=>{
      if(!rz.isConnected)return;
      const pend=D.fundacoes,ativas=D.corps;
      rz.innerHTML=`<div class="s-corpo co-eq"><p class="r-sub">Avaliação administrativa da Companhia: aprovar gera o código de identificação e faz do fundador o líder; recusar devolve o Tempo pago. Custos e requisitos provisórios.</p>${er?`<p class="r-erro" role="alert">${er}</p>`:''}
        ${cab('Fundações em análise',`${pend.length}`)}${pend.length?`<ul class="co-lista">${pend.map(c=>`<li class="co-conv fundo" aria-label="Fundação: ${saEsc(c.nome)}"><div class="co-mini">${coBrasao(c.brasao,{mini:true})}</div><div class="co-mid"><small>Fundador · ${saEsc(c.fundador)}</small><strong>${saEsc(c.nome)}</strong>${c.lema?`<p class="co-lema">“${saEsc(c.lema)}”</p>`:''}<small>Pago ${saTempo(c.custo)}</small><ul class="co-eq-req">${(c.reqs||reqs()).map(r=>`<li class="${r.a>=r.x?'ok':'no'}"><span>${r.a>=r.x?'✓':'✗'} ${r.r}</span><b>${r.a}/${r.x}</b></li>`).join('')}</ul>
          <input class="s-in" data-parecer="${c.id}" value="${saEsc(notas[c.id]||'')}" maxlength="240" placeholder="Parecer (opcional)" aria-label="Parecer da fundação ${saEsc(c.nome)}"><div class="s-duo"><button class="r-bt chanfro s-forte" data-fa="${c.id}">Aprovar fundação</button><button class="r-bt chanfro" data-fr="${c.id}">Recusar</button></div></div></li>`).join('')}</ul>`:vazio('Fila vazia','Nenhuma fundação esperando avaliação.')}
        ${cab('Status legal',`${ativas.length}`)}<ul class="co-lista">${ativas.map(c=>{const necro=c.classificacao==='necro',outras=ativas.filter(x=>x!==c);return `<li class="co-conv fundo" aria-label="Corporação ${saEsc(c.nome)}"><div class="co-mini">${coBrasao(c.brasao,{mini:true,necro})}</div><div class="co-mid"><div class="co-selos">${selo(necro?'Necro-Corporação':'Corporação oficial',necro?'sup':'lid')}${c.escopo==='global'?selo('Global · provisório','ava'):''}</div><strong>${saEsc(c.nome)}</strong><small>${c.codigo} · ${c.membros.length} ${c.membros.length===1?'membro':'membros'} · líder ${saEsc((c.membros.find(p=>p.cargo==='lider')||{}).personagem||'—')}</small>${c.nota?`<p class="r-sub">${saEsc(c.nota)}</p>`:''}
          <div class="s-duo"><button class="r-bt chanfro" data-cl="${c.id}">${necro?'Reconhecer como oficial':'Classificar como Necro'}</button><button class="r-bt chanfro" data-es="${c.id}">${c.escopo==='global'?'Marcar como local':'Marcar como global'}</button></div>
          <small class="co-rot">Rivalidades</small><div class="co-quem">${outras.map(x=>`<button class="chanfro" data-riv="${c.id}:${x.id}" aria-pressed="${c.rivais.includes(x.id)}">${saEsc(x.nome)}</button>`).join('')}</div></div></li>`}).join('')}</ul></div>`;
      rz.querySelectorAll('[data-parecer]').forEach(i=>i.oninput=()=>{notas[i.dataset.parecer]=i.value});
      rz.querySelectorAll('[data-fa]').forEach(b=>b.onclick=()=>decideFund(b.dataset.fa,true));
      rz.querySelectorAll('[data-fr]').forEach(b=>b.onclick=()=>decideFund(b.dataset.fr,false));
      rz.querySelectorAll('[data-cl]').forEach(b=>b.onclick=()=>{const c=D.corps.find(x=>x.id===b.dataset.cl);c.classificacao=c.classificacao==='necro'?'oficial':'necro';tudo()});
      rz.querySelectorAll('[data-es]').forEach(b=>b.onclick=()=>{const c=D.corps.find(x=>x.id===b.dataset.es);c.escopo=c.escopo==='global'?'local':'global';tudo()});
      rz.querySelectorAll('[data-riv]').forEach(b=>b.onclick=()=>{const [a,x]=b.dataset.riv.split(':'),A=D.corps.find(c=>c.id===a),B=D.corps.find(c=>c.id===x),on=!A.rivais.includes(x);A.rivais=on?[...A.rivais,x]:A.rivais.filter(i=>i!==x);B.rivais=on?[...B.rivais,a]:B.rivais.filter(i=>i!==a);tudo()});
    };
    function decideFund(id,sim){
      const f=D.fundacoes.find(x=>x.id===id);D.fundacoes=D.fundacoes.filter(x=>x!==f);
      const minha=f===D.pendente;
      if(sim){
        const corp={id:'c'+Date.now(),nome:f.nome,lema:f.lema,codigo:coNovoCodigo(),classificacao:'oficial',escopo:'local',nota:null,brasao:f.brasao,rivais:[],membros:[minha?{id:'eu',personagem:'Seu nome',cargo:'lider',entrou:Date.now(),eu:true}:{id:'f'+Date.now(),personagem:f.fundador,cargo:'lider',entrou:Date.now()}]};
        D.corps.push(corp);
        if(minha){D.pendente=null;D.minha=corp;aba='membros';D.pedidos=[];D.convitesEnviados=[];D.transf=[]}
      }else if(minha){mudaPulso(f.custo*60);D.pendente=null;D.recusada={nome:f.nome,nota:notas[id]||null,devolvido:true}}
      tudo();
    }
    repintaEquipe=pinta;pinta();
  }
  coSprites().then(()=>{
    D=coDados();tudo();
    if(!g.viu&&!q.has('semraf')||q.has('cena'))chamada();
    window.__co={D:()=>D,tudo};
  }).catch(()=>{raiz.innerHTML='<div class="s-vazio fundo"><strong>A Companhia não respondeu</strong><p class="r-sub">Não foi possível abrir as Corporações.</p></div>'});
}
