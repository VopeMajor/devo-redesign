// Tela do Record dentro do sistema. A foto de perfil e a aparência são do Record; o avatar anime é só da Casa.
// Neste protótipo tudo fica no aparelho; no jogo, foto em /api/record/avatar e o resto no perfil do servidor.
const REC_CHAVE='devo-record';
function lerRecord(){
  let d=null;try{d=JSON.parse(localStorage.getItem(REC_CHAVE))}catch{}
  return Object.assign({foto:null,art:'',real:'',trocasArt:1,trocasReal:1,inscrito:false,convite:null},d||{});
}
function gravarRecord(d){try{localStorage.setItem(REC_CHAVE,JSON.stringify(d));return true}catch{return false}}
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function montaRecord(raiz,abaInicial){
  const d=lerRecord();
  const novato=estado==='novato',equipe=estado==='owner';
  const ABAS=[['ficha','Record'],['votos','Deadly Votes'],['convites','Convites'],...(novato?[]:[['diario','Diário']]),...(equipe?[['mesa','Mesa']]:[])];
  let aba=ABAS.some(a=>a[0]===abaInicial)?abaInicial:'ficha';
  raiz.innerHTML='<div class="r-abas" role="tablist" aria-label="Seções do registro"></div><div class="r-painel" role="tabpanel"></div>';
  const painel=raiz.querySelector('.r-painel');
  function pintaAbas(){
    const t=raiz.querySelector('.r-abas');t.innerHTML='';
    ABAS.forEach(([id,nome])=>{
      const b=document.createElement('button');b.setAttribute('role','tab');b.setAttribute('aria-selected',id===aba);b.className='chanfro';b.textContent=nome;
      b.onclick=()=>{aba=id;pinta()};t.append(b);
    });
  }
  const pinta=()=>{pintaAbas();painel.scrollTop=0;({ficha,votos,convites,diario,mesa})[aba]()};

  /* ---- ficha ---- */
  function ficha(){
    const carimbo=critico?['Crítico','crit']:['Registrado',''];
    const stats=[['Cartas',12],['Trocas',3],['Avisos',avisosContagem()]];
    const atalho=id=>{const a=SISTEMAS.find(x=>x.id===id),tr=trancado(a);return `<button class="r-at chanfro" data-id="${id}">${tr?`<img src="${px('cadeado')}" alt="">`:`<img src="${px(id)}" alt="">`}<span><b>${a.nome}</b><small>${tr?a.trava:a.s}</small></span></button>`};
    painel.innerHTML=`
      <p class="r-faixa"><span>Arquivo confidencial</span><span>DV-0000</span></p>
      <div class="r-topo">
        <div class="r-foto-col">
          <div class="r-foto fundo">
            ${d.foto?`<img src="${d.foto}" alt="Sua foto de perfil">`:`<span class="sem">${SIGILO}</span><span>Sem foto</span>`}
            <b class="r-carimbo ${carimbo[1]}">${carimbo[0]}</b>
          </div>
          <button class="r-bt chanfro" id="r-trocar-foto">${d.foto?'Trocar foto':'Pôr foto'}</button>
          ${d.foto?'<button class="r-link" id="r-tirar-foto">Tirar foto</button>':''}
          <input id="r-arquivo" type="file" accept="image/*" hidden>
        </div>
        <dl class="r-dados">
          <div><dt>Participante</dt><dd class="nome">Seu nome</dd></div>
          <div class="r-par"><div><dt>Status</dt><dd class="${critico?'crit':''}">${critico?'Crítico':'Estável'}</dd></div><div><dt>Nível</dt><dd>1</dd></div></div>
          <div><dt>Arcano</dt><dd>Nenhum</dd></div>
          <div class="r-stats">${stats.map(([k,v])=>`<span class="fundo"><b>${v}</b>${k}</span>`).join('')}</div>
        </dl>
      </div>
      <h4>Aparência</h4>
      <div class="r-apar" id="r-apar"></div>
      <h4>Sistemas</h4>
      <div class="r-atalhos">${atalho('virtudes')}${atalho('arcanos')}</div>`;
    pintaAparencia();
    painel.querySelector('#r-trocar-foto').onclick=()=>painel.querySelector('#r-arquivo').click();
    const tirar=painel.querySelector('#r-tirar-foto');
    if(tirar)tirar.onclick=()=>{d.foto=null;gravarRecord(d);ficha()};
    painel.querySelector('#r-arquivo').onchange=e=>{const f=e.target.files[0];e.target.value='';if(f)recorte(f)};
    painel.querySelectorAll('.r-at').forEach(b=>b.onclick=()=>abre(SISTEMAS.find(a=>a.id===b.dataset.id)));
  }
  const avisosContagem=()=>typeof avisos==='undefined'?0:avisos.length;

  /* cada tipo de aparência se escolhe uma vez e tem 1 troca depois (regra do jogo) */
  function pintaAparencia(){
    const c=painel.querySelector('#r-apar');if(!c)return;
    c.innerHTML='';
    [['art','2D/3D','Personagem de anime, jogo ou animação','trocasArt'],['real','Real','Ator, atriz ou celebridade','trocasReal']].forEach(([k,rot,dica,tr])=>{
      const nome=d[k],resta=d[tr],linha=document.createElement('div');linha.className='r-ap fundo';
      linha.innerHTML=`<div class="r-ap-tx"><small>${rot}</small><strong>${nome?esc(nome):'Ainda não escolhida'}</strong><em>${nome?(resta?'1 troca disponível':'Sem trocas'):dica}</em></div>`;
      if(!nome||resta){
        const b=document.createElement('button');b.className='r-bt chanfro';b.textContent=nome?'Trocar':'Escolher';
        b.onclick=()=>editaAparencia(linha,k,rot,dica,tr,!!nome);linha.append(b);
      }
      c.append(linha);
    });
  }
  function editaAparencia(linha,k,rot,dica,tr,troca){
    linha.innerHTML=`<form class="r-ap-form"><label><small>${rot}: ${dica}</small><input maxlength="60" required autocomplete="off" value="${esc(d[k])}"></label>${troca?'<em>Esta é a sua única troca.</em>':''}<div><button class="r-bt chanfro" type="submit">Confirmar</button><button class="r-bt chanfro" type="button">Cancelar</button></div></form>`;
    const f=linha.querySelector('form'),i=f.querySelector('input');i.focus();
    f.querySelector('[type=button]').onclick=pintaAparencia;
    f.onsubmit=e=>{
      e.preventDefault();const v=i.value.trim();if(!v)return;
      if(v===d[k])return pintaAparencia();
      d[k]=v;if(troca)d[tr]=0;gravarRecord(d);pintaAparencia();
    };
  }

  /* recorte quadrado da foto: arrastar e aproximar, como no jogo */
  function recorte(arq){
    const erro=t=>{const p=painel.querySelector('.r-topo');let m=painel.querySelector('.r-erro');if(!m){m=document.createElement('p');m.className='r-erro';m.setAttribute('role','alert');p.after(m)}m.textContent=t};
    if(/\.hei[cf]$/i.test(arq.name)||/hei[cf]/i.test(arq.type))return erro('Foto em HEIC (formato do iPhone) não abre aqui. Escolha JPEG, PNG ou WebP.');
    if(arq.type&&!arq.type.startsWith('image/'))return erro('Esse arquivo não é uma imagem. Escolha uma foto (JPEG, PNG ou WebP).');
    if(arq.size>25*1024*1024)return erro('Essa foto passa de 25 MB. Escolha uma menor.');
    const url=URL.createObjectURL(arq),im=new Image();
    im.onerror=()=>{URL.revokeObjectURL(url);erro('Não foi possível abrir essa foto.')};
    im.onload=()=>{
      painel.innerHTML=`<h4 style="margin-top:0">Ajustar foto</h4><p class="r-sub">Arraste para posicionar.</p><canvas class="r-corte fundo" width="512" height="512" aria-label="Recorte da foto"></canvas>
        <label class="r-zoom">Aproximar<input type="range" min="1" max="4" step=".01" value="1"></label>
        <div class="r-acoes"><button class="r-bt chanfro" id="r-salvar">Salvar</button><button class="r-bt chanfro" id="r-cancelar">Cancelar</button></div>`;
      const cv=painel.querySelector('canvas'),ctx=cv.getContext('2d'),base=Math.max(512/im.width,512/im.height);
      let zoom=1,x=0,y=0;
      const prende=()=>{const w=im.width*base*zoom,h=im.height*base*zoom;x=Math.min(0,Math.max(512-w,x));y=Math.min(0,Math.max(512-h,y))};
      const desenha=()=>{prende();ctx.clearRect(0,0,512,512);ctx.drawImage(im,x,y,im.width*base*zoom,im.height*base*zoom)};
      x=(512-im.width*base)/2;y=(512-im.height*base)/2;desenha();
      let p=null;
      cv.addEventListener('pointerdown',e=>{p={x:e.clientX,y:e.clientY};cv.setPointerCapture(e.pointerId)});
      cv.addEventListener('pointermove',e=>{if(!p)return;const k=512/cv.getBoundingClientRect().width;x+=(e.clientX-p.x)*k;y+=(e.clientY-p.y)*k;p={x:e.clientX,y:e.clientY};desenha()});
      cv.addEventListener('pointerup',()=>p=null);cv.addEventListener('pointercancel',()=>p=null);
      painel.querySelector('input[type=range]').oninput=e=>{
        // aproxima em volta do centro do recorte
        const novo=+e.target.value,f=novo/zoom;x=256-(256-x)*f;y=256-(256-y)*f;zoom=novo;desenha();
      };
      const fim=()=>{URL.revokeObjectURL(url);ficha()};
      painel.querySelector('#r-cancelar').onclick=fim;
      painel.querySelector('#r-salvar').onclick=()=>{
        const s=document.createElement('canvas');s.width=s.height=320;s.getContext('2d').drawImage(cv,0,0,320,320);
        d.foto=s.toDataURL('image/jpeg',.86);
        if(!gravarRecord(d)){d.foto=null;URL.revokeObjectURL(url);ficha();return erro('Não foi possível guardar a foto neste aparelho.')}
        fim();
      };
    };
    im.src=url;
  }

  /* ---- Deadly Votes: dados de exemplo; o novato só vê o tutorial ---- */
  function votos(){
    const titulo=novato?'Deadly Vote tutorial':'Convocação de exemplo';
    // dificuldade da convocação (Rup, item 12); ?red=1 mostra o caso depois do Red Coringa
    const DIF=novato?{v:'A',n:'copas'}:{v:'5',n:'espadas'},red=q.get('red')==='1',dif=red?{v:'C',red:true}:DIF;
    painel.innerHTML=`
      <h4 style="margin-top:0">Convocação</h4>
      <article class="r-voto fundo">
        <div class="dv-conv">${dvCarta(dif,96)}<div><strong>${titulo}</strong><span class="dv-nome">${red?'Red Coringa':dvNomeCarta(dif)}</span>${red?`<em class="dv-mudou">Mudou durante o caso · era ${dvNomeCarta(DIF)}</em>`:`<small>${dvFaixa(dif).filter(Boolean).join(' · ')}</small>`}</div></div>
        <dl><div><dt>Início</dt><dd>em 2 dias</dd></div><div><dt>Participantes</dt><dd>${d.inscrito?5:4} / 8</dd></div>
        ${novato?'':'<div><dt>Peso máximo de cartas</dt><dd>12</dd></div>'}<div><dt>Seu registro</dt><dd>${d.inscrito?'Inscrito':'Não inscrito'}</dd></div></dl>
        <button class="dv-como" id="r-difs">Como funcionam as dificuldades<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>
        <div class="r-acoes"><button class="r-bt chanfro" id="r-ins">${d.inscrito?'Sair':'Inscrever-se'}</button>${d.inscrito&&!novato?'<button class="r-bt chanfro" id="r-levar">Escolher cartas</button>':''}</div>
      </article>
      <h4>Histórico público</h4>
      ${novato?'<p class="r-sub">Nenhum Deadly Vote registrado ainda.</p>':`<ul class="r-hist"><li>${dvCarta({v:'7',n:'ouros'},24)}<b>Caso de exemplo</b><span>Encerrado</span></li><li>${dvCarta({v:'3',n:'paus'},24)}<b>Caso de exemplo</b><span>Encerrado</span></li></ul>`}`;
    painel.querySelector('#r-ins').onclick=()=>{d.inscrito=!d.inscrito;gravarRecord(d);votos()};
    painel.querySelector('#r-difs').onclick=()=>{painel.innerHTML=`<button class="dv-volta" id="r-vvolta"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>Deadly Votes</button>${dvRegrasHtml()}`;painel.scrollTop=0;painel.closest('.corpo')&&(painel.closest('.corpo').scrollTop=0);painel.querySelector('#r-vvolta').onclick=votos};
    if(red&&!votos.avisou){votos.avisou=true;dvAvisoRed({titulo,antes:DIF})}
    const lv=painel.querySelector('#r-levar');
    if(lv)lv.onclick=()=>{lv.textContent='Vem na etapa das Cartas';lv.disabled=true};
  }

  /* ---- Convites: o jogador gera 1, e ele não renova ---- */
  function convites(){
    painel.innerHTML=`<h4 style="margin-top:0">Convites</h4><p class="r-sub">Você tem direito a 1 convite. Ele não renova.</p>
      ${d.convite?`<div class="r-voto fundo"><small>Seu convite</small><strong class="cod">${esc(d.convite)}</strong></div>`:'<button class="r-bt chanfro" id="r-gera">Gerar convite</button>'}`;
    const g=painel.querySelector('#r-gera');
    if(g)g.onclick=()=>{d.convite='EXEMPLO-0000';gravarRecord(d);convites()};
  }
  function diario(){painel.innerHTML='<h4 style="margin-top:0">Diário</h4><p class="r-sub">As cápsulas do tempo do Poço ficam aqui. Esta parte vem na etapa do Poço.</p>'}
  function mesa(){painel.innerHTML='<h4 style="margin-top:0">Mesa</h4><p class="r-sub">Criar e conduzir Deadly Votes. Só a equipe vê esta aba. Vem na etapa da Mesa.</p>'}
  pinta();
}
