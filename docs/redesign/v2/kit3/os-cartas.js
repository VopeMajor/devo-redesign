// Tela de Cartas no modo das telas de Cone de Luz de Honkai: Star Rail: compêndio com anel de progresso, raridade em
// estrelas e cor, cartas que inclinam com o dedo ou o mouse, palco de luz na ficha e a carta que vira de verdade.
// As cartas usam sempre a arte original, sem pixel (pedido do dono). O que o jogador tem é exemplo: no jogo vem do
// inventário. Coleções como em lib/devo/cards.ts.
const RARS=[['comum','Comum'],['incomum','Incomum'],['rara','Rara'],['ultra_rara','Ultra Rara'],['lendaria','Lendária']];
const COLECOES=[['Iniciais',['escudo']],['Xadrez',['xadrez_peao','xadrez_rei','xadrez_cavalo','xadrez_bispo','xadrez_torre','xadrez_rainha','xadrez_tabuleiro']]];
const TENHO=estado==='novato'?{escudo:[1,'Kit inicial']}:{escudo:[2,'Kit inicial'],xadrez_peao:[3,'Exemplo'],xadrez_rei:[1,'Exemplo'],xadrez_cavalo:[1,'Exemplo'],xadrez_rainha:[1,'Exemplo']};
const nomeRar=r=>RARS.find(x=>x[0]===r)[1];
const ordemRar=r=>RARS.findIndex(x=>x[0]===r);
const colDe=c=>COLECOES.find(x=>x[1].includes(c.id))[0];
const ESTRELA='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.6 6.4 6.9.5-5.3 4.4 1.7 6.7L12 16.8l-5.9 3.7 1.7-6.7-5.3-4.4 6.9-.5z"/></svg>';
const estrelas=r=>`<span class="c-est r-${r}" aria-label="${nomeRar(r)}">${ESTRELA.repeat(ordemRar(r)+1)}</span>`;
// manter o nome antigo: o Inventário usa pips()
const pips=estrelas;
const artCarta=(id,l)=>`../../../../public/images/cartas/${id}/arte-${l}.webp`;

// inclina o elemento conforme o ponteiro (perspectiva 3D), com reflexo de luz que acompanha
function inclina(el,forca=10){
  if(parado)return;
  el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
    el.style.setProperty('--ry',(x*forca*2).toFixed(2)+'deg');el.style.setProperty('--rx',(-y*forca*2).toFixed(2)+'deg');
    el.style.setProperty('--lx',((x+.5)*100).toFixed(1)+'%');el.style.setProperty('--ly',((y+.5)*100).toFixed(1)+'%')});
  el.addEventListener('pointerleave',()=>{el.style.setProperty('--ry','0deg');el.style.setProperty('--rx','0deg')});
}

function montaCartas(raiz){
  let filtro='todas',sel=null,verso=false,aba='efeito';
  raiz.classList.add('cx');
  const minhas=()=>CARTAS.filter(c=>TENHO[c.id]);
  const visiveis=()=>minhas().filter(c=>filtro==='todas'||c.rar===filtro).sort((a,b)=>ordemRar(b.rar)-ordemRar(a.rar)||CARTAS.indexOf(a)-CARTAS.indexOf(b));
  const conta=f=>f==='todas'?minhas().length:minhas().filter(c=>c.rar===f).length;
  const copias=minhas().reduce((n,c)=>n+TENHO[c.id][0],0);

  function lista(){
    const vs=visiveis(),n=minhas().length,t=CARTAS.length,pct=n/t,R=34,C=2*Math.PI*R;
    raiz.innerHTML=`
      <header class="cx-topo">
        <div class="cx-anel" role="meter" aria-label="Compêndio reunido" aria-valuemin="0" aria-valuemax="${t}" aria-valuenow="${n}">
          <svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="${R}" class="trilho"/><circle cx="40" cy="40" r="${R}" class="feito" style="stroke-dasharray:${(C*pct).toFixed(1)} ${C.toFixed(1)}"/></svg>
          <b>${Math.round(pct*100)}<small>%</small></b>
        </div>
        <div class="cx-tit"><small>Compêndio</small><h3>Cartas</h3><p><b>${n}</b> de ${t} reunidas · <b>${copias}</b> ${copias===1?'cópia':'cópias'}</p></div>
      </header>
      <div class="cx-filtros" role="radiogroup" aria-label="Filtrar por raridade"></div>
      <ul class="cx-grade" aria-label="Suas cartas"></ul>
      <h4 class="sec"><span>Coleções</span></h4><ul class="cx-cols"></ul>`;
    const fs=raiz.querySelector('.cx-filtros');
    [['todas','Todas'],...RARS].forEach(([id,nome])=>{
      const b=document.createElement('button');b.setAttribute('role','radio');b.setAttribute('aria-checked',filtro===id);b.className='r-'+id;
      b.innerHTML=`${id==='todas'?'':estrelas(id)}<span>${nome}</span><b>${conta(id)}</b>`;b.onclick=()=>{filtro=id;lista()};fs.append(b);
    });
    const g=raiz.querySelector('.cx-grade');
    vs.forEach((c,i)=>{
      const li=document.createElement('li'),b=document.createElement('button'),n2=TENHO[c.id][0];
      b.className='cx-tile r-'+c.rar;b.style.setProperty('--i',i);
      b.setAttribute('aria-label',`Ver ${c.nome}: ${nomeRar(c.rar)}, ${n2} ${n2===1?'cópia':'cópias'}`);
      b.innerHTML=`<span class="cx-tile-3d"><span class="cx-face">${cartaFrente(c,colDe(c),artCarta(c.id,512))}</span><i class="cx-luz"></i></span>
        <span class="cx-base">${estrelas(c.rar)}<span class="cx-nome">${c.nome}</span></span>${n2>1?`<span class="cx-cop">×${n2}</span>`:''}`;
      b.onclick=()=>{sel=c.id;verso=false;aba='efeito';ficha()};inclina(b.querySelector('.cx-tile-3d'),9);li.append(b);g.append(li);
    });
    if(!vs.length)g.insertAdjacentHTML('beforeend','<li class="cx-vazio">Nenhuma carta desta raridade.</li>');
    if(filtro==='todas'){
      const li=document.createElement('li'),b=document.createElement('button');
      b.className='cx-adq';b.innerHTML='<span><b>+</b></span><em>Adquirir carta</em><small>Sala de Trocas</small>';
      b.onclick=()=>abre(SISTEMAS.find(a=>a.id==='trocas'));li.append(b);g.append(li);
    }
    const cs=raiz.querySelector('.cx-cols');
    COLECOES.forEach(([nome,ids])=>{
      const k=ids.filter(i=>TENHO[i]).length,li=document.createElement('li');
      const mostra=ids.slice(0,4);
      li.innerHTML=`<div class="cx-leque">${mostra.map((id,j)=>`<img src="${artCarta(id,512)}" alt="" style="--j:${j-(mostra.length-1)/2}" class="${TENHO[id]?'':'falta'}">`).join('')}</div>
        <div class="cx-col-tx"><small>Coleção</small><strong>${nome}</strong><span>${k} de ${ids.length}</span><div class="cx-col-barra"><i style="width:${(k/ids.length*100).toFixed(0)}%"></i></div></div>
        ${k===ids.length?'<em class="cx-col-ok">Completa</em>':''}`;
      cs.append(li);
    });
  }

  function ficha(){
    const c=CARTAS.find(x=>x.id===sel),[n,origem]=TENHO[c.id],vs=visiveis(),col=colDe(c);
    const idx=vs.findIndex(x=>x.id===sel);
    const abas=[['efeito','Na carta'],...(c.detalhe?[['descricao','Descrição']]:[]),['rito','Rito'],['peso','Peso']];
    if(!abas.some(a=>a[0]===aba))aba='efeito';
    const corpo={
      efeito:`<p class="cx-efeito">${c.efeito}</p>${c.flavor?`<p class="cx-flavor">“${c.flavor}”</p>`:''}`,
      descricao:`<p>${c.detalhe}</p>`,
      rito:`<dl class="cx-rito"><div><dt>Gestos</dt><dd>Ainda não definidos</dd></div><div><dt>Cântico da coleção</dt><dd>Ainda não definido</dd></div></dl>`,
      peso:`<p>${PESO_TEXTO}</p>`,
    }[aba];
    raiz.innerHTML=`
      <div class="cx-det r-${c.rar}">
        <section class="cx-palco">
          <button class="cx-volta" id="c-volta" aria-label="Voltar para as cartas"><svg class="seta" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>Cartas</button>
          <span class="cx-pos">${idx+1} / ${vs.length}</span>
          <button class="cx-seta ant" id="c-ant" aria-label="Carta anterior"><svg class="seta" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button>
          <button class="cx-carta-g${verso?' virada':''}" id="c-vira" aria-label="${verso?'Ver a frente da carta':`${c.nome}. Ver o verso da carta`}">
            <span class="cx-vira"><span class="cx-lado frente">${cartaFrente(c,col,artCarta(c.id,768))}<i class="cx-luz"></i></span><span class="cx-lado verso">${cartaVerso()}<i class="cx-luz"></i></span></span>
          </button>
          <button class="cx-seta prox" id="c-prox" aria-label="Próxima carta"><svg class="seta" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>
          <small class="cx-dica">Toque na carta para virar</small>
        </section>
        <section class="cx-info">
          ${estrelas(c.rar)}
          <h3>${c.nome}</h3>
          <p class="cx-sub">Nº ${c.num} · Coleção ${col} · ${nomeRar(c.rar)}</p>
          <div class="cx-chips">${c.natureza?`<span><small>Natureza</small>${c.natureza}</span>`:''}<span><small>Arquétipo</small>${c.arquetipo}</span><span><small>Tipo</small>${c.tipo}</span></div>
          <div class="cx-stats">
            <div><small>Peso</small><b>${c.peso}</b><i class="cx-peso">${Array.from({length:5},(_,k)=>`<u class="${k<c.peso?'on':''}"></u>`).join('')}</i></div>
            <div><small>Cópias</small><b>×${n}</b><i class="cx-sob">${Array.from({length:5},(_,k)=>`<u class="${k<n?'on':''}"></u>`).join('')}</i></div>
            <div><small>Origem</small><b class="cx-origem">${origem}</b></div>
          </div>
          <div class="cx-abas" role="tablist">${abas.map(([a,r])=>`<button role="tab" data-aba="${a}" aria-selected="${aba===a}">${r}</button>`).join('')}</div>
          <div class="cx-texto">${corpo}</div>
        </section>
      </div>`;
    raiz.closest('.corpo').scrollTop=0;
    raiz.querySelector('#c-volta').onclick=()=>{sel=null;lista()};
    const g=raiz.querySelector('#c-vira');inclina(g,12);
    g.onclick=()=>{verso=!verso;g.classList.toggle('virada',verso);g.setAttribute('aria-label',verso?'Ver a frente da carta':`${c.nome}. Ver o verso da carta`)};
    const anda=d=>{sel=vs[(idx+d+vs.length)%vs.length].id;verso=false;ficha()};
    raiz.querySelector('#c-ant').onclick=()=>anda(-1);raiz.querySelector('#c-prox').onclick=()=>anda(1);
    raiz.querySelector('#c-ant').disabled=raiz.querySelector('#c-prox').disabled=vs.length<2;
    raiz.querySelectorAll('[data-aba]').forEach(b=>b.onclick=()=>{aba=b.dataset.aba;ficha()});
  }
  if(q.get('carta')&&TENHO[q.get('carta')]){sel=q.get('carta');ficha()}else lista();
}
