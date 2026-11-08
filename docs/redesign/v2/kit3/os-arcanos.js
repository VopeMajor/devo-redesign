/* ---- Arcanos: a coleção dos vinte e dois e a página de cada um, no modo das telas de personagem e de Eidolons
   de Honkai: Star Rail. Evoluir com Fragmentos Arcanos (I = 25 … VII = 1600), despertar outro com Grande Fragmento
   (entra no Estágio 0) e a escolha do prêmio entre três. Dados de exemplo; no jogo vêm de /api/virtudes.
   ?arc=equipe = visão de Owner/Anfitrião (tudo aberto, sem custo); ?arc=escolha = prêmio pendente. ---- */
const ARC_LISTA=[['louco','Arcano do Louco'],['mago','Arcano do Mago'],['sacerdotisa','Arcano da Sacerdotisa'],['imperatriz','Arcano da Imperatriz'],['imperador','Arcano do Imperador'],['hierofante','Arcano do Hierofante'],['enamorados','Arcano dos Enamorados'],['carro','Arcano do Carro'],['justica','Arcano da Justiça'],['eremita','Arcano do Eremita'],['fortuna','Arcano da Roda da Fortuna'],['forca','Arcano da Força'],['enforcado','Arcano do Enforcado'],['morte','Arcano da Morte'],['temperanca','Arcano da Temperança'],['diabo','Arcano do Diabo'],['torre','Arcano da Torre'],['estrela','Arcano da Estrela'],['lua','Arcano da Lua'],['sol','Arcano do Sol'],['julgamento','Arcano do Julgamento'],['mundo','Arcano do Mundo']];
const ARC_NUM=['0','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI'];
const ARC_CUSTO=[0,25,50,100,200,400,800,1600];
const ARC_ART=(k,t,l)=>`../../../../public/images/arcanos/${k}/${t}-${l}.webp`;
// "Arcano da Força" → "A Força"
const arcNome=t=>t.replace(/^Arcano (da|do|das|dos) /,(m,a)=>({da:'A ',do:'O ',das:'As ',dos:'Os '}[a]));
const arcEsc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// texto longo: parágrafos por linha em branco; linha inteira entre *asteriscos* = subtítulo (ou frase em destaque)
function arcTexto(t){
  return t.split(/\n\s*\n/).map(b=>b.trim()).filter(Boolean).map(b=>{
    const m=/^\*([^*]+)\*$/.exec(b);
    if(m&&!/[.!?…:]$/.test(m[1].trim()))return `<h5>${arcEsc(m[1].trim())}</h5>`;
    if(m)return `<p class="a-dest">${arcEsc(m[1].trim())}</p>`;
    return `<p>${arcEsc(b).replace(/\*([^*\n]+)\*/g,'<b>$1</b>').replace(/\n/g,'<br>')}</p>`;
  }).join('');
}

function montaArcanos(raiz){
  const equipe=q.get('arc')==='equipe';
  const st={vista:'lista',k:'forca',aba:'estagios',filtro:'todos',estSel:null,pedindo:null,aviso:null,
    fragmentos:64,grandes:1,posse:{forca:{estagio:2,original:true},lua:{estagio:0,original:false}},
    escolha:q.get('arc')==='escolha'?{origem:'Prêmio do Deadly Vote',opcoes:['sol','estrela','torre'],sel:null}:null};
  const tem=k=>!!st.posse[k];
  const aberto=k=>equipe||tem(k);
  const titulo=k=>ARC_LISTA.find(a=>a[0]===k)[1];
  const num=k=>ARC_NUM[ARC_LISTA.findIndex(a=>a[0]===k)];
  const original=()=>Object.keys(st.posse).find(k=>st.posse[k].original);
  const pips=(n,max=7)=>`<span class="a-pips" aria-hidden="true">${Array.from({length:max+1},(_,i)=>`<i class="${i<n?'f':i===n?'a':''}"></i>`).join('')}</span>`;
  const recursos=()=>`<div class="a-rec"><span title="Fragmentos Arcanos"><img src="art/os/poco/fragmento.png" alt=""><b>${equipe?'∞':st.fragmentos}</b><small>Fragmentos</small></span><span title="Grandes Fragmentos Arcanos"><img src="art/os/poco/grande-fragmento.png" alt=""><b>${equipe?'∞':st.grandes}</b><small>Grandes</small></span></div>`;

  function lista(){
    const o=original(),po=st.posse[o];
    const itens=ARC_LISTA.filter(([k])=>st.filtro==='todos'||tem(k));
    return `
      <header class="a-topo"><div><small>Arcanos maiores</small><h3>Os vinte e dois</h3></div>${recursos()}</header>
      ${o?`<button class="a-heroi" data-k="${o}">
        <img class="a-heroi-fig" src="${ARC_ART(o,'figura',768)}" alt="">
        <span class="a-heroi-tx"><small>Seu Arcano · original</small><b>${num(o)}</b><strong>${arcNome(titulo(o))}</strong>
          <em>Estágio ${ARC_NUM[po.estagio]} · ${arcEsc(ARC_TEXTOS[o].estagios[po.estagio].nome||'Ainda não revelado')}</em>${pips(po.estagio)}
          <u>Ver Arcano <svg class="seta" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></u></span>
      </button>`:''}
      <div class="a-filtro" role="group" aria-label="Filtrar">${[['todos','Todos',22],['seus','Seus',Object.keys(st.posse).length]].map(([f,r,n])=>`<button data-f="${f}" aria-pressed="${st.filtro===f}">${r} <i>${n}</i></button>`).join('')}</div>
      <ul class="a-grade">${itens.map(([k,t])=>{const p=st.posse[k];return `<li><button class="a-carta${p?' tem':''}${aberto(k)?'':' fechada'}" data-k="${k}" aria-label="${arcNome(t)}${p?`, Estágio ${ARC_NUM[p.estagio]}`:', não despertado'}">
        <span class="a-moldura"><img src="${ARC_ART(k,'retrato',256)}" alt="" loading="lazy"><i class="a-num">${num(k)}</i>${p?`<i class="a-est">${ARC_NUM[p.estagio]}</i>`:''}${p&&p.original?'<i class="a-orig" title="Original">★</i>':''}</span>
        <span class="a-nome">${arcNome(t)}</span></button></li>`}).join('')}</ul>`;
  }

  function detalhe(){
    const k=st.k,T=ARC_TEXTOS[k],p=st.posse[k],ab=aberto(k),af=ARC_AFIN[k];
    const atual=p?p.estagio:0;
    const sel=st.estSel??atual;
    const est=T.estagios[sel]||{nome:'',linha:''};
    const estado=i=>p?(i<atual?'passado':i===atual?'atual':'futuro'):'futuro';
    const corpoEst=()=>{
      const e=estado(sel),rev=!!est.nome;
      const mostra=equipe||e!=='futuro';
      return `<article class="a-est-cartao ${e}">
        <header><b>${ARC_NUM[sel]}</b><div><small>Estágio ${ARC_NUM[sel]}${e==='atual'?' · atual':e==='passado'?' · alcançado':''}</small><h4>${rev?arcEsc(est.nome):'Ainda não revelado'}</h4></div></header>
        ${!rev?'<p class="a-it">O dono ainda não escreveu este Estágio.</p>':mostra?(est.texto?arcTexto(est.texto):est.linha?`<p>${arcEsc(est.linha)}</p>`:''):'<p class="a-it">O que este Estágio desperta se revela quando você chegar a ele.</p>'}
      </article>`;
    };
    const evolucao=()=>{
      if(!p)return `<section class="a-acao"><h5>Despertar</h5><p>Despertar este Arcano o coloca no Estágio 0, A Essência, com evolução própria. Seu Arcano original continua definindo as Virtudes. ${equipe?'Para a equipe, sem custo.':st.grandes?`Você tem ${st.grandes} ${st.grandes===1?'Grande Fragmento Arcano':'Grandes Fragmentos Arcanos'}.`:''}</p>
        ${botao('despertar',`Despertar com Grande Fragmento Arcano`,equipe?`Despertar ${arcNome(titulo(k))}`:`Confirmar: gastar 1 para ${arcNome(titulo(k))}`,!equipe&&st.grandes<1)}
        ${!equipe&&st.grandes<1?'<p class="a-falta">Você não tem um Grande Fragmento Arcano.</p>':''}${aviso()}</section>`;
      const custo=atual>=7?null:ARC_CUSTO[atual+1],falta=custo!=null&&!equipe?Math.max(0,custo-st.fragmentos):0;
      if(custo==null)return `<section class="a-acao"><h5>Evolução</h5><p>Estágio VII alcançado. Não há Estágio além deste.</p>${aviso()}</section>`;
      const prox=T.estagios[atual+1];
      return `<section class="a-acao"><h5>Evolução</h5>
        <div class="a-custo"><span><small>Próximo</small><b>Estágio ${ARC_NUM[atual+1]}</b><em>${prox&&prox.nome?arcEsc(prox.nome):'Ainda não revelado'}</em></span><span><small>Custo</small><b>${equipe?'Sem custo':custo}</b><em>${equipe?'Equipe':'Fragmentos Arcanos'}</em></span></div>
        <div class="a-barra-frag" aria-hidden="true"><i style="width:${equipe?100:Math.min(100,st.fragmentos/custo*100).toFixed(1)}%"></i></div>
        ${p.original?'<p class="a-it">Este é o seu Arcano original: ao evoluir, os Pontos de Potencial acumulados se espalham pelas Virtudes.</p>':''}
        ${botao('evoluir',equipe?`Evoluir para o Estágio ${ARC_NUM[atual+1]} — sem custo`:`Evoluir para o Estágio ${ARC_NUM[atual+1]}`,equipe?'Confirmar Evolução':`Confirmar: gastar ${custo}`,falta>0)}
        ${falta>0?`<p class="a-falta">Faltam ${falta} Fragmentos Arcanos (você tem ${st.fragmentos} de ${custo}).</p>`:''}${aviso()}</section>`;
    };
    const abas=ab?[['estagios','Estágios'],['descricao','Descrição'],['fisiologia','Fisiologia']]:[];
    return `
      <div class="a-volta-linha"><button class="a-volta"><svg class="seta" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>Os vinte e dois</button>${recursos()}</div>
      <div class="a-pagina">
        <section class="a-palco${ab?'':' fechada'}">
          <img class="a-orbita" src="${ARC_ART('comum','orbital',768)}" alt="">
          <img class="a-fig" src="${ARC_ART(k,'figura',1024)}" alt="${arcNome(titulo(k))}">
          <div class="a-nomeplaca"><b>${num(k)}</b><div><small>${p?(p.original?'Seu Arcano · original':'Despertado'):'Não despertado'}</small><h3>${arcNome(titulo(k))}</h3></div></div>
          <div class="a-afin"><span title="Virtude excelente">${virNaipe(af.exc)}<small>Excelente</small><em>${VIR_NAIPES[af.exc].nome}</em></span><span class="def" title="Virtude deficiente">${virNaipe(af.def,'apagado')}<small>Deficiente</small><em>${VIR_NAIPES[af.def].nome}</em></span></div>
        </section>
        <section class="a-info">
          <p class="a-breve">${arcEsc(T.breve)}</p>
          ${ab?`<ol class="a-trilha" aria-label="Estágios 0 a VII">${T.estagios.map((e,i)=>`<li><button class="${estado(i)}${i===sel?' sel':''}" data-e="${i}" aria-label="Estágio ${ARC_NUM[i]}${e.nome?': '+arcEsc(e.nome):''}">${ARC_NUM[i]}</button></li>`).join('')}</ol>`:''}
          ${abas.length?`<div class="a-abas" role="tablist">${abas.map(([a,r])=>`<button role="tab" data-a="${a}" aria-selected="${st.aba===a}">${r}</button>`).join('')}</div>`:''}
          ${!ab?'':st.aba==='estagios'?corpoEst():`<div class="a-texto">${arcTexto(st.aba==='descricao'?T.descricao:T.fisiologia)}</div>`}
          ${ARC_PROVISORIO[k]&&ab&&st.aba!=='estagios'?'<p class="a-prov">Rascunho: o texto deste Arcano ainda não é do dono.</p>':''}
          ${evolucao()}
        </section>
      </div>`;
  }

  function botao(acao,rotulo,confirmar,des){
    if(st.pedindo===acao&&!des)return `<div class="a-confirma"><button class="r-bt s-forte" data-faz="${acao}">${confirmar}</button><button class="r-bt" data-cancela>Cancelar</button></div>`;
    return `<button class="r-bt a-bt" data-pede="${acao}"${des?' disabled':''}>${rotulo}</button>`;
  }
  const aviso=()=>st.aviso?`<p class="a-aviso ${st.aviso[0]}" role="${st.aviso[0]==='erro'?'alert':'status'}">${st.aviso[1]}</p>`:'';

  function escolha(){
    const e=st.escolha;if(!e)return '';
    const alvo=e.sel;
    return `<section class="a-escolha" aria-label="Escolha o seu Arcano"><small>${e.origem}</small><h3>Escolha o seu Arcano</h3>
      <p>O narrador separou ${e.opcoes.length} Arcanos para você. O que escolher vira o seu Arcano original, no Estágio 0, e não poderá ser trocado.</p>
      <ul>${e.opcoes.map(k=>`<li><button class="a-carta${alvo===k?' tem':''}" data-esc="${k}" aria-pressed="${alvo===k}"><span class="a-moldura"><img src="${ARC_ART(k,'retrato',256)}" alt=""><i class="a-num">${num(k)}</i></span><span class="a-nome">${arcNome(titulo(k))}</span></button></li>`).join('')}</ul>
      ${alvo?`<p class="a-it">${arcEsc(ARC_TEXTOS[alvo].breve)}</p>${botao('escolher','Escolher o '+titulo(alvo),'Confirmar: '+titulo(alvo),false)}`:''}${aviso()}</section>`;
  }

  function pinta(){
    raiz.innerHTML=(st.vista==='lista'?lista():detalhe())+escolha();
    raiz.classList.toggle('a-det',st.vista==='detalhe');
    raiz.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{st.vista='detalhe';st.k=b.dataset.k;st.aba='estagios';st.estSel=null;st.pedindo=null;st.aviso=null;pinta();raiz.closest('.corpo').scrollTop=0});
    raiz.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{st.filtro=b.dataset.f;pinta()});
    const v=raiz.querySelector('.a-volta');if(v)v.onclick=()=>{st.vista='lista';st.aviso=null;st.pedindo=null;pinta()};
    raiz.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>{st.estSel=+b.dataset.e;st.aba='estagios';pinta()});
    raiz.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{st.aba=b.dataset.a;pinta()});
    raiz.querySelectorAll('[data-pede]').forEach(b=>b.onclick=()=>{st.pedindo=b.dataset.pede;st.aviso=null;pinta()});
    raiz.querySelectorAll('[data-cancela]').forEach(b=>b.onclick=()=>{st.pedindo=null;pinta()});
    raiz.querySelectorAll('[data-esc]').forEach(b=>b.onclick=()=>{st.escolha.sel=b.dataset.esc;st.pedindo=null;pinta()});
    raiz.querySelectorAll('[data-faz]').forEach(b=>b.onclick=()=>{
      const a=b.dataset.faz,k=st.k;st.pedindo=null;
      if(a==='evoluir'){const p=st.posse[k],c=ARC_CUSTO[p.estagio+1];if(!equipe)st.fragmentos-=c;p.estagio++;st.estSel=null;st.aviso=['ok',`Estágio ${ARC_NUM[p.estagio]} alcançado.`]}
      if(a==='despertar'){if(!equipe)st.grandes--;st.posse[k]={estagio:0,original:false};st.aviso=['ok',`${titulo(k)} despertou. Estágio 0, A Essência.`]}
      if(a==='escolher'){const e=st.escolha.sel;st.posse={...Object.fromEntries(Object.entries(st.posse).map(([x,p])=>[x,{...p,original:false}])),[e]:{estagio:0,original:true}};st.escolha=null;st.aviso=null;st.vista='detalhe';st.k=e}
      pinta();
    });
  }
  pinta();
}
