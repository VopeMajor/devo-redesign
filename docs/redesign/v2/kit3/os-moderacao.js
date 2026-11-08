/* ---- Moderação de contas (Rup, NOTAS-RUP-02-11.md item 2): advertência, suspensão e banimento, temporários ou
   permanentes. Motivo obrigatório e visível ao jogador; data de retorno quando é temporário, também visível; nota de
   gestão interna, que só a equipe vê e fica no histórico. Entra na Mesa › Jogadores (montaMesa chama mdJogadores).
   A tela do jogador (mdTelaJogador) aparece ao entrar no sistema enquanto houver sanção. Dados de exemplo.
   Teste: ?sancao=adv|susp|ban|banp mostra o que o jogador vê. ---- */
const MD_TIPO={adv:'Advertência',susp:'Suspensão',ban:'Banimento'};
const MD_ART={adv:'art/os/sancao/advertencia.webp?v=1',susp:'art/os/sancao/suspensao.webp?v=1',ban:'art/os/sancao/banimento.webp?v=1'};
const mdData=iso=>{const d=new Date(iso+'T12:00:00');return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})};
const mdHoje=()=>new Date().toISOString().slice(0,10);
const mdDias=iso=>Math.max(0,Math.ceil((new Date(iso+'T12:00:00')-new Date())/864e5));
// sanção ativa: advertência ainda não lida, ou suspensão/banimento sem data ou com data no futuro
const mdAtiva=s=>!s.encerrada&&(s.tipo==='adv'?!s.lida:(!s.ate||s.ate>mdHoje()));
const MD_JOG=[
  {id:'matheus',nome:'Matheus',record:'DV-0412',desde:'ago 2026',sancoes:[]},
  {id:'velada',nome:'Velada',record:'DV-0388',desde:'jul 2026',sancoes:[{tipo:'adv',motivo:'Mensagens ofensivas a outro jogador no chat da Corporação.',nota:'Primeira vez. Pediu desculpas no privado.',por:'Anfitrião Dora',em:'2026-10-20',lida:true}]},
  {id:'caio',nome:'Caio',record:'DV-0451',desde:'set 2026',sancoes:[{tipo:'susp',ate:'2026-11-12',motivo:'Usou uma segunda conta para receber cartas de si mesmo na Sala de Trocas.',nota:'Segunda conta já bloqueada. Cartas devolvidas ao estoque.',por:'Owner',em:'2026-10-29'}]},
  {id:'nina',nome:'Nina',record:'DV-0402',desde:'ago 2026',sancoes:[]},
  {id:'teo',nome:'Teo',record:'DV-0330',desde:'jun 2026',sancoes:[{tipo:'ban',motivo:'Divulgou dados pessoais de outro jogador.',nota:'Denúncia de três jogadores, prints no Discord da equipe (canal #moderacao).',por:'Owner',em:'2026-09-14'}]},
  {id:'sol',nome:'Sol',record:'DV-0377',desde:'jul 2026',sancoes:[]},
];
function mdSituacao(j){
  const a=j.sancoes.filter(mdAtiva).sort((x,y)=>({ban:3,susp:2,adv:1}[y.tipo]-{ban:3,susp:2,adv:1}[x.tipo]))[0];
  if(!a)return ['Ativo','ok'];
  if(a.tipo==='adv')return ['Advertido','adv'];
  return [`${MD_TIPO[a.tipo]}${a.ate?` até ${mdData(a.ate).replace(/ de \d{4}$/,'')}`:' permanente'}`,a.tipo];
}
// a tela que o jogador vê (também usada na Mesa como prévia)
function mdTelaHtml(s,nome){
  const perm=s.tipo!=='adv'&&!s.ate;
  const titulo={adv:'Advertência',susp:'Conta suspensa',ban:'Conta banida'}[s.tipo];
  const linha={adv:'A equipe registrou uma advertência na sua conta.',susp:perm?'Sua conta foi suspensa por tempo indeterminado.':'Sua conta foi suspensa até a data abaixo.',ban:perm?'Sua conta foi banida permanentemente.':'Sua conta foi banida até a data abaixo.'}[s.tipo];
  return `<div class="md-tela t-${s.tipo}" role="alertdialog" aria-modal="true" aria-labelledby="md-tit">
    <div class="md-papel">
      <img class="md-obj" src="${MD_ART[s.tipo]}" alt="">
      <small class="md-rot">Deadly Vote Record System${nome?`<br>${nome}`:''}</small>
      <h2 id="md-tit">${titulo}</h2>
      <p class="md-linha">${linha}</p>
      <dl class="md-campos"><div><dt>Motivo</dt><dd>${saEsc(s.motivo)}</dd></div>
        ${s.tipo==='adv'?'':s.ate?`<div><dt>Retorno</dt><dd>${mdData(s.ate)}<small> · faltam ${mdDias(s.ate)} ${mdDias(s.ate)===1?'dia':'dias'}</small></dd></div>`:'<div><dt>Duração</dt><dd>Permanente</dd></div>'}</dl>
      ${s.tipo==='adv'?'<button class="md-ok" data-md-ok>Entendi</button>':'<button class="md-sai" data-md-sai>Sair da conta</button>'}
    </div></div>`;
}
function mdTelaJogador(){
  const q=new URLSearchParams(location.search),t=q.get('sancao');
  const ex={adv:{tipo:'adv',motivo:MD_JOG[1].sancoes[0].motivo},susp:{tipo:'susp',ate:'2026-11-12',motivo:MD_JOG[2].sancoes[0].motivo},ban:{tipo:'ban',ate:'2027-01-10',motivo:'Combinou resultados de Deadly Vote com outros jogadores.'},banp:{tipo:'ban',motivo:MD_JOG[4].sancoes[0].motivo}}[t];
  if(!ex)return;
  const d=document.createElement('div');d.innerHTML=mdTelaHtml(ex);const el=d.firstElementChild;document.body.append(el);
  const ok=el.querySelector('[data-md-ok]');if(ok){ok.focus({focusVisible:false});ok.onclick=()=>el.remove()}
}

// Mesa › Jogadores: busca, ficha, sancionar e histórico. st é o estado da Mesa; devolve o html e liga os botões.
function mdJogadores(st,{volta,cargoNome}){
  if(!st.md)st.md={jog:MD_JOG.map(j=>({...j,sancoes:j.sancoes.map(s=>({...s}))})),busca:'',sel:null,f:null,previa:null,aviso:null};
  const M=st.md;
  const html=()=>{
    if(M.sel)return ficha(M.jog.find(j=>j.id===M.sel));
    const l=M.jog.filter(j=>!M.busca||j.nome.toLowerCase().includes(M.busca.toLowerCase())||j.record.toLowerCase().includes(M.busca.toLowerCase()));
    return `<div class="ms-linha">${volta()}</div>
      <div class="ms-titulo">${mesaIco('jogadores')}<div><h3>Jogadores</h3><small>Busque um Record para ver a ficha, advertir, suspender ou banir.</small></div></div>
      <label class="ms-campo"><span>Buscar</span><input id="md-busca" value="${saEsc(M.busca)}" placeholder="Nome do personagem ou Record (DV-…)" autocomplete="off"></label>
      <ul class="md-lista">${l.map(j=>{const [s,c]=mdSituacao(j);return `<li><button data-md-jog="${j.id}"><span class="ms-av">${j.nome[0]}</span><span><strong>${j.nome}</strong><small>${j.record} · desde ${j.desde}</small></span><em class="md-chip c-${c}">${s}</em></button></li>`}).join('')||'<li class="ms-dica">Ninguém com esse nome.</li>'}</ul>`;
  };
  function ficha(j){
    const [s,c]=mdSituacao(j),f=M.f||(M.f={tipo:'adv',dur:'temp',ate:'',motivo:'',nota:''});
    const temp=f.tipo!=='adv'&&f.dur==='temp',ok=f.motivo.trim().length>=8&&(!temp||(f.ate&&f.ate>mdHoje()));
    const falta=!f.motivo.trim()?'Escreva o motivo.':f.motivo.trim().length<8?'O motivo está curto demais.':temp&&!f.ate?'Escolha a data de retorno.':temp&&f.ate<=mdHoje()?'A data de retorno precisa ser depois de hoje.':'';
    return `<div class="ms-linha">${volta('Jogadores')}</div>
      <header class="md-cab"><span class="ms-av">${j.nome[0]}</span><div><h3>${j.nome}</h3><small>${j.record} · desde ${j.desde}</small></div><em class="md-chip c-${c}">${s}</em></header>
      ${M.aviso?`<p class="ms-aviso ok" role="status">${M.aviso}</p>`:''}
      <section class="ms-cartao md-form"><h5>Nova sanção</h5>
        <div class="ms-seg" role="group" aria-label="Tipo">${Object.entries(MD_TIPO).map(([k,t])=>`<button type="button" data-md-tipo="${k}" aria-pressed="${f.tipo===k}">${t}</button>`).join('')}</div>
        ${f.tipo==='adv'?'<p class="ms-dica">A advertência não bloqueia a conta: o jogador lê o aviso ao entrar e confirma.</p>':`
        <div class="ms-seg" role="group" aria-label="Duração">${[['temp','Temporária'],['perm','Permanente']].map(([k,t])=>`<button type="button" data-md-dur="${k}" aria-pressed="${f.dur===k}">${t}</button>`).join('')}</div>
        ${temp?`<label class="ms-campo"><span>Data de retorno</span><input type="date" id="md-ate" value="${f.ate}" min="${mdHoje()}"><small class="md-vis"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"/><circle cx="12" cy="12" r="2.5"/></svg>O jogador vê esta data.</small></label>`:'<p class="ms-dica">Sem data de retorno. Só a equipe pode encerrar.</p>'}`}
        <label class="ms-campo"><span>Motivo <b class="md-obrig">obrigatório</b></span><textarea id="md-motivo" rows="3" maxlength="400" placeholder="O que aconteceu, em poucas palavras.">${saEsc(f.motivo)}</textarea><small class="md-vis"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"/><circle cx="12" cy="12" r="2.5"/></svg>O jogador vê este texto.</small></label>
        <label class="ms-campo md-interna"><span>Nota de gestão</span><textarea id="md-nota" rows="2" maxlength="600" placeholder="Contexto, provas, combinados. Fica no histórico.">${saEsc(f.nota)}</textarea><small><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6zM4 4l16 16"/></svg>Só a equipe vê. O jogador nunca recebe esta nota.</small></label>
        <div class="ms-2"><button type="button" class="r-bt" data-md-previa${ok?'':' disabled'}>Prévia</button><button type="button" class="r-bt s-forte md-aplica t-${f.tipo}" data-md-aplica${ok?'':' disabled'}>${{adv:'Advertir',susp:'Suspender',ban:'Banir'}[f.tipo]}</button></div>
        ${falta?`<p class="ms-dica" aria-live="polite">${falta}</p>`:''}
      </section>
      <section class="ms-cartao"><h5>Histórico · ${j.sancoes.length}</h5>
        ${j.sancoes.length?`<ul class="md-hist">${[...j.sancoes].reverse().map((x,i)=>{const k=j.sancoes.length-1-i,at=mdAtiva(x);return `<li class="${at?'ativa':''}">
          <header><b class="md-chip c-${x.tipo}">${MD_TIPO[x.tipo]}${x.tipo==='adv'?'':x.ate?` até ${mdData(x.ate)}`:' permanente'}</b><small>${mdData(x.em)} · ${x.por}${x.encerrada?` · encerrada por ${x.encerrada}`:x.tipo==='adv'?(x.lida?' · lida':' · ainda não lida'):''}</small></header>
          <p><span>Motivo</span>${saEsc(x.motivo)}</p>
          ${x.nota?`<p class="md-nota"><span>Nota de gestão · só a equipe</span>${saEsc(x.nota)}</p>`:''}
          ${at&&x.tipo!=='adv'?(M.encerrando===k?`<div class="md-enc"><span>Encerrar agora? ${j.nome} volta a entrar.</span><button class="r-bt" data-md-encerra-sim="${k}">Encerrar</button><button class="r-bt" data-md-encerra-nao>Cancelar</button></div>`:`<button class="r-link" data-md-encerra="${k}">Encerrar ${x.tipo==='susp'?'suspensão':'banimento'} agora</button>`):''}</li>`}).join('')}</ul>`:'<p class="ms-dica">Nenhuma sanção registrada.</p>'}
      </section>`;
  }
  function liga(raiz,repinta){
    const on=(sel,fn)=>raiz.querySelectorAll(sel).forEach(b=>b.onclick=()=>{fn(b);repinta()});
    const b=raiz.querySelector('#md-busca');if(b)b.oninput=()=>{M.busca=b.value;repinta();const n=raiz.querySelector('#md-busca');n.focus();n.setSelectionRange(n.value.length,n.value.length)};
    on('[data-md-jog]',x=>{M.sel=x.dataset.mdJog;M.f=null;M.aviso=null});
    on('[data-md-tipo]',x=>{M.f.tipo=x.dataset.mdTipo});
    on('[data-md-dur]',x=>{M.f.dur=x.dataset.mdDur});
    const campo=(id,k)=>{const e=raiz.querySelector(id);if(!e)return;e.oninput=()=>{M.f[k]=e.value;const ok=M.f.motivo.trim().length>=8&&(M.f.tipo==='adv'||M.f.dur==='perm'||(M.f.ate&&M.f.ate>mdHoje()));raiz.querySelectorAll('[data-md-previa],[data-md-aplica]').forEach(x=>x.disabled=!ok)};e.onchange=()=>{M.f[k]=e.value;repinta()}};
    campo('#md-motivo','motivo');campo('#md-nota','nota');campo('#md-ate','ate');
    const sancao=()=>({tipo:M.f.tipo,ate:M.f.tipo!=='adv'&&M.f.dur==='temp'?M.f.ate:null,motivo:M.f.motivo.trim(),nota:M.f.nota.trim(),por:cargoNome(),em:mdHoje()});
    raiz.querySelectorAll('[data-md-previa]').forEach(x=>x.onclick=()=>previa(raiz,sancao(),false,repinta));
    raiz.querySelectorAll('[data-md-aplica]').forEach(x=>x.onclick=()=>previa(raiz,sancao(),true,repinta));
    on('[data-md-encerra]',x=>{M.encerrando=+x.dataset.mdEncerra});
    on('[data-md-encerra-nao]',()=>{M.encerrando=null});
    on('[data-md-encerra-sim]',x=>{const j=M.jog.find(y=>y.id===M.sel),s=j.sancoes[+x.dataset.mdEncerraSim];s.encerrada=cargoNome();M.encerrando=null;M.aviso=`${MD_TIPO[s.tipo]} encerrada. ${j.nome} já pode entrar.`});
  }
  // prévia do que o jogador vê; com "aplicar", pede confirmação por cima dela
  function previa(raiz,s,aplicar,repinta){
    const j=M.jog.find(y=>y.id===M.sel),jan=raiz.closest('.jan'),corpo=raiz.closest('.corpo');
    const w=document.createElement('div');w.className='md-previa';w.style.top=corpo.offsetTop+'px';
    const dur=s.tipo==='adv'?'':s.ate?` até ${mdData(s.ate)}`:' permanente';
    w.innerHTML=`<p class="md-prev-rot">${aplicar?'Confirme: é isto que '+j.nome+' vai ver':'Prévia · o que '+j.nome+' vê ao entrar'}</p>${mdTelaHtml(s,j.nome)}
      ${aplicar?`<p class="md-resumo t-${s.tipo}"><b>${MD_TIPO[s.tipo]}${dur}</b> · ${j.nome} (${j.record})${s.nota?' · nota de gestão salva, o jogador não vê':''}</p>`:''}
      ${aplicar&&s.tipo==='ban'?`<label class="ms-campo md-digita"><span>Para banir, digite ${j.record}</span><input class="s-in" id="md-conf" autocomplete="off" placeholder="${j.record}"></label>`:''}
      <div class="md-prev-bts">${aplicar?`<button class="r-bt s-forte md-aplica t-${s.tipo}" data-md-sim${s.tipo==='ban'?' disabled':''}>${{adv:'Advertir',susp:'Suspender',ban:'Banir'}[s.tipo]} ${j.nome}</button>`:''}<button class="r-bt" data-md-fecha>${aplicar?'Voltar':'Fechar prévia'}</button></div>`;
    jan.append(w);w.querySelector('.md-tela').removeAttribute('aria-modal');const okb=w.querySelector('[data-md-ok]');if(okb)okb.disabled=true;
    const cf=w.querySelector('#md-conf');if(cf){cf.oninput=()=>{w.querySelector('[data-md-sim]').disabled=cf.value.trim().toUpperCase()!==j.record};cf.focus()}else w.querySelector('[data-md-fecha]').focus();
    const sai=w.querySelector('[data-md-sai]');if(sai)sai.disabled=true;
    w.querySelector('[data-md-fecha]').onclick=()=>w.remove();
    const sim=w.querySelector('[data-md-sim]');if(sim)sim.onclick=()=>{j.sancoes.push(s);M.f=null;M.aviso=`${MD_TIPO[s.tipo]} registrada para ${j.nome}.`;w.remove();repinta()};
  }
  return {html,liga};
}
