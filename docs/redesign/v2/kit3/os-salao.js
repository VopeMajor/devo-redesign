// Salão das Máscaras dentro do sistema. Regras, valores e textos são os do jogo (lib/devo/salao.ts, salao-herdeiro.ts,
// salao-migration.sql); lotes e anúncios são os exemplos do seed de teste. Aqui tudo roda no aparelho para mostrar a tela;
// no jogo quem decide é o servidor (/api/salao). O painel da equipe segue a SPEC-TUTORIAL-E-EQUIPE §2.6.
const SA_H=36e5,SA_D=864e5,SA_TZ='America/Sao_Paulo';
const SA={ancora:Date.parse('2026-10-15T20:00:00-03:00'),intervalo:3,duracao:24,forcar:null,fimAntecipado:null,extra:null,provisorio:true};
const SA_BANDEJA={minima:'incomum',vagas:12,max:3,lanceMin:30,incremento:10,reserva:30};
const SA_CONTRATO={nome:'Contrato Avulso',divulgacao:20,comissao:15};
const SA_PROPAGANDA=60,SA_MAX=10000;
const SA_ANUNCIO={proposta:'Proposta',propaganda:'Propaganda',recrutamento:'Recrutamento'};
const SA_EVENTO={quinzenal:'Quinzenal',especial:'Especial',teatro:'Teatro'};
const SA_STATUS={avaliacao:'Em avaliação de especialista',aprovado:'Aprovado',recusado:'Recusado',retirado:'Retirado',vendido:'Vendido',devolvido:'Devolvido sem lances'};
const SA_FOCO={leiloes:'Leilões',bandeja:'Bandeja',mercado:'Mercado',anuncios:'Propostas'};
let SA_EVENTOS=[
  {id:'e1',tipo:'quinzenal',titulo:'Gala Quinzenal das Máscaras',d:'Edição comemorativa do leilão: lotes da casa entram junto com os dos jogadores.',ini:Date.parse('2026-10-30T20:00:00-03:00'),fim:Date.parse('2026-10-31T20:00:00-03:00'),dest:['Cartas comemorativas','Essências de afinidade raras'],prov:true},
  {id:'e2',tipo:'teatro',titulo:'Récita no Camarote Negro',d:'Uma peça encenada no palco do Salão antes da abertura dos lances.',ini:Date.parse('2026-11-06T21:00:00-03:00'),fim:Date.parse('2026-11-06T23:00:00-03:00'),dest:['Peça de teatro'],prov:true},
  {id:'e3',tipo:'quinzenal',titulo:'Gala Quinzenal das Máscaras',d:'Segunda gala do ciclo: fragmentos arcanos entre os lotes da casa.',ini:Date.parse('2026-11-13T20:00:00-03:00'),fim:Date.parse('2026-11-14T20:00:00-03:00'),dest:['Fragmentos arcanos','Cartas comemorativas'],prov:true},
];
const saArte=a=>`art/os/salao/${a}.png`;
const saEd=n=>String(n+1).padStart(2,'0');
const saNum=n=>String(n).padStart(3,'0');
const saCarta=id=>CARTAS.find(c=>c.id===id);
const saFace=id=>{const c=saCarta(id);return cartaFrente(c,colDe(c),`../../../../public/images/cartas/${id}/arte-512.webp`)};
const saRar=id=>{const r=saCarta(id).rar;return `<small class="s-rar r-${r}">${nomeRar(r)}</small>`};
const saEsc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function saTempo(min){const m=Math.max(0,Math.round(min)),h=Math.floor(m/60),r=m%60;return !h?`${r}min`:r?`${h}h ${String(r).padStart(2,'0')}min`:`${h}h`}
function saData(ms){return new Intl.DateTimeFormat('pt-BR',{timeZone:SA_TZ,weekday:'short',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(ms).replace(/\./g,'')}
function saDataC(ms){return new Intl.DateTimeFormat('pt-BR',{timeZone:SA_TZ,day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(ms).replace(/\./g,'').replace(',',' às')}
const saDiaBr=ms=>new Intl.DateTimeFormat('en-CA',{timeZone:SA_TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(ms);
function saRelogio(now=Date.now()){
  const iv=SA.intervalo*SA_D,n=Math.floor((now-SA.ancora)/iv),ini=SA.ancora+n*iv,fim=ini+SA.duracao*SA_H;
  const natural=now>=ini&&now<fim&&!(SA.fimAntecipado!==null&&SA.fimAntecipado>=ini);
  const extra=SA.extra&&now<SA.extra.fim?SA.extra:null;
  const aberto=SA.forcar==='aberto'?true:SA.forcar==='fechado'?false:natural||!!extra;
  return {aberto,n,ini,fim,prox:ini+iv,extra:aberto&&!natural&&extra?extra:null,fechaEm:aberto?(natural?fim:extra?extra.fim:null):null,forcado:SA.forcar};
}
// dias, horas, minutos e segundos do número enorme
function saPartes(ms){const t=Math.max(0,Math.floor(ms/1000));return [Math.floor(t/86400),Math.floor(t%86400/3600),Math.floor(t%3600/60),t%60].map(x=>String(x).padStart(2,'0'))}
let SA_DADOS=null;
function saDados(){
  if(SA_DADOS)return SA_DADOS;
  if(q.get('salao')==='aberto'&&!saRelogio().aberto)SA.ancora+=Date.now()-5*SA_H-saRelogio().ini;
  const r=saRelogio(),foco=r.aberto?r.n:r.n+1,on=r.aberto;
  const L=(numero,id,vend,st,ed,min,x={})=>({numero,id,vend,meu:vend===null,st,ed,min,inc:10,maior:null,lances:0,lidero:false,meuLance:null,final:null,repasse:null,venci:false,nota:null,taxa:20,...x});
  SA_DADOS={
    lotes:[
      L(41,'xadrez_rainha','Ísis','aprovado',foco,90,on?{maior:150,lances:2,meuLance:120}:{}),
      L(42,'xadrez_bispo','Lírio','aprovado',foco,40,on?{maior:45,lances:1}:{}),
      L(43,'xadrez_cavalo',null,'aprovado',foco,30),
      L(44,'xadrez_torre','Nyx','aprovado',foco+1,60),
      L(38,'xadrez_tabuleiro',null,'vendido',foco-1,120,{final:300,repasse:255,maior:300,lances:4}),
      L(39,'xadrez_peao','Nyx','devolvido',foco-1,30),
      L(45,'xadrez_bispo','Lírio','avaliacao',null,45),
      L(46,'xadrez_peao',null,'avaliacao',null,30),
    ],
    ofertas:[
      {id:'o1',c:'escudo',vend:'Nyx',meu:false,preco:25,st:'ativa',comprei:false,repasse:null},
      {id:'o2',c:'xadrez_rei',vend:'Ísis',meu:false,preco:180,st:'ativa',comprei:false,repasse:null},
    ],
    anuncios:[
      {id:'a1',tipo:'recrutamento',titulo:'Procuramos jogadores de nervos firmes',texto:'Duas vagas abertas para quem sobreviveu ao primeiro voto. Reuniões depois de cada edição do Salão.\nCódigo de identificação: CRP-RK7M-4XVD',autor:null,corp:'Ordem do Relógio Partido',meu:false,st:'publicado',custo:0},
      {id:'a2',tipo:'propaganda',titulo:'Coroas, só as verdadeiras',texto:'Compro e vendo cartas lendárias. Pago em Tempo, sem pressa e sem perguntas.',autor:'Ísis',meu:false,st:'publicado',custo:60},
      {id:'a3',tipo:'proposta',titulo:'Troco informação por Tempo',texto:'Sei quem vai estar no próximo Deadly Vote. Proposta séria, procure-me no Salão.',autor:'Velada',meu:false,st:'publicado',custo:0},
      {id:'a4',tipo:'proposta',titulo:'Procuro a Ampulheta Invertida',texto:'Pago bem pela Ampulheta. Deixe um recado.',autor:'Matheus',meu:false,st:'pendente',custo:0},
    ],
  };
  return SA_DADOS;
}
const saPagar=min=>{if(segPulso-min*60<SA_BANDEJA.reserva*60)return false;mudaPulso(-min*60);return true};
const saDaCarta=id=>{if(TENHO[id])TENHO[id][0]++;else TENHO[id]=[1,'Salão das Máscaras']};
const saTiraCarta=id=>{if(!TENHO[id])return;if(--TENHO[id][0]<=0)delete TENHO[id]};
const saDevolve=l=>{if(l.meu){saDaCarta(l.id);mudaPulso(l.taxa*60)}};
function saFolha(jan,sub,tit,html){
  const o=document.createElement('div');o.className='s-folha';o.setAttribute('role','dialog');o.setAttribute('aria-label',tit);
  o.innerHTML=`<div class="c-nav"><button class="m-volta chanfro" aria-label="Voltar">‹</button><div><small>${sub}</small><strong>${tit}</strong></div></div>${html}`;
  o.querySelector('.m-volta').onclick=()=>o.remove();
  jan.append(o);o.querySelector('.m-volta').focus({preventScroll:true});
  return o;
}
function saCampo(id,rot,dica=''){return `<div class="s-campo"><label for="${id}">${rot}</label><div class="s-step"><button type="button" class="chanfro" data-d="-1">−</button><span class="fundo"><input id="${id}" inputmode="numeric"><small></small></span><button type="button" class="chanfro" data-d="1">+</button></div>${dica?`<p class="r-sub">${dica}</p>`:''}</div>`}
function saLigaCampo(o,id,{val,min,max,passo},muda=()=>{}){
  const i=o.querySelector('#'+id),c=i.closest('.s-campo'),[me,ma]=c.querySelectorAll('[data-d]');
  me.setAttribute('aria-label',`Diminuir ${passo} minutos`);ma.setAttribute('aria-label',`Aumentar ${passo} minutos`);
  let v=val;
  const pinta=()=>{i.value=v;c.querySelector('small').textContent=`min · ${saTempo(v)}`;me.disabled=v<=min;ma.disabled=v>=max;muda(v)};
  const poe=x=>{v=Math.max(min,Math.min(max,Math.round(x)));pinta()};
  me.onclick=()=>poe(v-passo);ma.onclick=()=>poe(v+passo);
  i.oninput=()=>{const n=Number(i.value.replace(/\D/g,''));v=Math.min(max,n);c.querySelector('small').textContent=`min · ${saTempo(v)}`;muda(v)};
  i.onblur=()=>poe(v);
  pinta();
  return ()=>Math.max(min,Math.min(max,v));
}
function montaSalao(raiz){
  let g={viu:false,aviso:false};try{Object.assign(g,JSON.parse(localStorage.getItem('devo-salao')))}catch{}
  const grava=()=>{try{localStorage.setItem('devo-salao',JSON.stringify(g))}catch{}};
  // Dono, 05/11: "quem for adm (anfitrião pra cima) pode aceitar cartas no próprio salão de máscaras se quiser, mas só
  // aparece essa opção pra ele. outras funções do salão de máscaras também". Anfitrião e Owner veem as ações da equipe
  // no próprio Salão (aprovar e recusar lotes e anúncios, editar e cancelar lotes, abrir e fechar); o Owner também
  // mexe no contrato e no calendário. Dealer e jogadores não veem nada disso. ?cargo=dealer|anfitriao|owner para testar.
  const cargo=estado==='owner'?(['dealer','anfitriao','owner'].includes(q.get('cargo'))?q.get('cargo'):'owner'):'jogador';
  const D=saDados(),equipe=cargo==='anfitriao'||cargo==='owner',dono=cargo==='owner';
  let editaLote=null,cancLote=null,abrirEq=false,fecharEq=false;
  const selo=()=>`<span class="s-eqselo" title="Só Anfitrião e Owner veem">Equipe</span>`;
  // as ações da equipe, as mesmas do Painel da equipe
  function aprovaLote(l,nota){const r=saRelogio();let e=r.n+1;while(vagasDe(e)>=SA_BANDEJA.vagas)e++;l.st='aprovado';l.ed=e;l.nota=nota||null;return `Lote Nº ${saNum(l.numero)} aprovado para a Edição ${saEd(e)}.`}
  function recusaLote(l,nota){l.st='recusado';l.nota=nota||null;saDevolve(l);return `Lote Nº ${saNum(l.numero)} recusado. A carta e a taxa voltaram ao dono.`}
  function publicaAn(a){a.st='publicado';return 'Publicado no mural.'}
  function recusaAn(a){a.st='recusado';if(a.meu&&a.custo)mudaPulso(a.custo*60);return 'Anúncio recusado.'}
  function abreAgora(modo){const now=Date.now();if(modo==='ant'){const r=saRelogio();SA.ancora=now-(r.n+1)*SA.intervalo*SA_D;SA.fimAntecipado=null;SA.forcar=null;return 'Salão aberto. A próxima edição foi antecipada.'}SA.extra={ini:now,fim:now+SA.duracao*SA_H};SA.forcar=null;return 'Salão aberto em edição extra.'}
  function fechaAgora(){const r=saRelogio();if(!r.extra)D.lotes.filter(l=>l.st==='aprovado'&&l.ed===r.n).forEach(l=>{if(l.maior){l.st='vendido';l.final=l.maior;l.repasse=Math.floor(l.maior-l.maior*SA_CONTRATO.comissao/100);l.venci=l.lidero;if(l.lidero)saDaCarta(l.id);if(l.meu)mudaPulso(l.repasse*60)}else{l.st='devolvido';if(l.meu)saDaCarta(l.id)}});SA.extra=null;SA.forcar=null;SA.fimAntecipado=Date.now();return 'Salão fechado.'}
  const jan=()=>raiz.closest('.jan');
  let aba=q.get('salaoaba')||'leiloes',nota='',ultimo=null,avisoAberto=!g.aviso,tid=0;
  const $r=s=>raiz.querySelector(s);
  const pendFila=()=>D.lotes.filter(l=>l.st==='avaliacao').length+D.anuncios.filter(a=>a.st==='pendente').length;
  const vagasDe=ed=>D.lotes.filter(l=>l.st==='aprovado'&&l.ed===ed).length;
  /* ---- o palco e o número enorme ---- */
  function palco(r){
    const ev=SA_EVENTOS.find(e=>e.fim>Date.now()&&e.ini-Date.now()<16*SA_D);
    return `<div class="s-palco ${r.aberto?'on':''}"><div class="s-vista"><img class="s-cen" src="${saArte(r.aberto?'aberto':'fechado')}" alt="${r.aberto?'O palco aceso, com o púlpito do leiloeiro e as cortinas abertas':'O palco às escuras, com as cortinas fechadas'}">
        <button class="s-bt chanfro" id="s-cal"><img src="${px('calendario')}" alt="">Calendário Devo</button>
        <button class="k-mel chanfro s-her" id="s-her" aria-label="Rever a apresentação do Herdeiro"><img src="art/os/npc/herdeiro-neutro.png" alt=""><span>Herdeiro</span></button></div>
      <i class="s-dit" aria-hidden="true"></i>
      <section class="s-placar" aria-label="${r.aberto?'Salão aberto: tempo até o fim da edição':'Contagem até a próxima abertura'}">
        <p class="s-selo">${r.aberto?(r.extra?'Aberto · Edição extra':`Aberto · Edição ${saEd(r.n)}`):'Fechado'}${r.forcado&&equipe?' <small>manual</small>':''}</p>
        <p class="s-lab">${r.aberto?(r.fechaEm?'A edição fecha em':'Aberto até segunda ordem'):'Próxima abertura em'}</p>
        <div class="s-num" id="s-num" role="timer"></div>
        <p class="s-qdo">${r.aberto?(r.fechaEm?`Fecha ${saData(r.fechaEm)}`:'Abertura extraordinária'):`Abre ${saData(r.prox)} · Brasília`}</p>
      </section>
      ${equipe?`<div class="s-eqpalco">${selo()}${r.aberto?(fecharEq?`<span>Os lotes desta edição encerram agora.</span><button class="r-bt chanfro s-forte" id="s-eq-fc">Fechar agora</button><button class="r-link" id="s-eq-fv">Voltar</button>`:'<button class="r-bt chanfro" id="s-eq-fa">Fechar agora</button>'):(abrirEq?`<button class="r-bt chanfro s-forte" id="s-eq-ant">Antecipar a próxima edição</button><button class="r-bt chanfro" id="s-eq-ext">Edição extra</button><button class="r-link" id="s-eq-av">Voltar</button>`:'<button class="r-bt chanfro" id="s-eq-ab">Abrir agora</button>')}</div>`:''}
      ${ev?`<p class="p-faixa s-breve"><img src="${px('salao')}" alt=""><span>Em breve · ${ev.titulo}</span></p>`:''}</div>`;
  }
  function pintaNum(){
    const e=$r('#s-num');if(!e)return;
    const r=saRelogio(),alvo=r.aberto?r.fechaEm:r.prox,p=alvo?saPartes(alvo-Date.now()):['--','--','--','--'];
    e.innerHTML=p.map((x,i)=>`${i?'<i>:</i>':''}<span><b>${x}</b><small>${['Dias','Horas','Min','Seg'][i]}</small></span>`).join('');
    e.setAttribute('aria-label',alvo?`${r.aberto?'Fecha em':'Abre em'} ${+p[0]} dias, ${+p[1]} horas e ${+p[2]} minutos`:'Sem hora marcada');
  }
  /* ---- abas ---- */
  function abas(r){
    const corr=corrente(r).length,pb=D.lotes.filter(l=>l.meu&&l.st==='avaliacao').length;
    return `<div class="r-abas" role="tablist" aria-label="Seções do Salão">${[['leiloes','Leilões',r.aberto&&corr],['mercado','Mercado',0],['anuncios','Anúncios',0],['bandeja','Bandeja',pb]].map(([id,n,c])=>`<button class="chanfro" role="tab" data-a="${id}" aria-selected="${aba===id}">${n}${c?` <b>${c}</b>`:''}</button>`).join('')}</div>`;
  }
  const corrente=r=>r.extra?[]:D.lotes.filter(l=>l.st==='aprovado'&&l.ed===r.n);
  const proximos=r=>D.lotes.filter(l=>l.st==='aprovado'&&l.ed===r.n+1);
  const cab=(t,s)=>`<header class="s-cab"><h4>${t}</h4>${s?`<small>${s}</small>`:''}</header>`;
  const vazio=(t,p)=>`<div class="s-vazio fundo"><strong>${t}</strong><p class="r-sub">${p}</p></div>`;
  const avisoOk=()=>nota?`<p class="s-ok fundo" role="status">${nota}</p>`:'';
  function lote(l,aberto){
    const rot=l.maior?`Maior lance · ${l.lances}×`:'Lance mínimo',selo=l.meu?'<span class="s-sel seu">Seu lote</span>':l.lidero?'<span class="s-sel lid">Você lidera</span>':l.meuLance?'<span class="s-sel sup">Superado</span>':'';
    return `<li class="s-lote fundo ${l.lidero?'lid':''}" aria-label="Lote ${l.numero}: ${saCarta(l.id).nome}"><div class="s-carta">${saFace(l.id)}</div><div class="s-info">
      <div class="s-lin"><small>Lote Nº ${saNum(l.numero)}</small>${selo}</div><strong>${saCarta(l.id).nome}</strong>
      <p class="s-de">${saRar(l.id)} <span>de ${l.meu?'você':l.vend}</span></p>
      <div class="s-pe"><div><small>${rot}</small><b>${saTempo(l.maior??l.min)}</b></div>${aberto&&!l.meu?`<button class="r-bt chanfro ${l.lidero?'':'s-forte'}" data-lance="${l.numero}" aria-label="Dar lance no lote ${l.numero}">Dar lance</button>`:''}</div>
      ${equipe&&!aberto?eqLote(l):''}
    </div></li>`;
  }
  function eqLote(l){
    const r=saRelogio();
    if(editaLote===l.numero)return `<div class="s-eqbox">${selo()}${saCampo('s-emin','Lance mínimo')}<label class="s-rot" for="s-eed">Edição</label><select class="s-in" id="s-eed">${[0,1,2].map(k=>{const e=r.n+1+k;return `<option value="${e}" ${e===l.ed?'selected':''}>Edição ${saEd(e)} · ${saDataC(SA.ancora+e*SA.intervalo*SA_D)}</option>`}).join('')}</select><div class="r-acoes s-duo"><button class="r-bt chanfro s-forte" data-eqsalva="${l.numero}">Salvar</button><button class="r-bt chanfro" data-eqver>Voltar</button></div></div>`;
    if(cancLote===l.numero)return `<div class="s-eqbox">${selo()}<p>A carta e a taxa voltam para ${l.meu?'você':l.vend}.</p><div class="r-acoes s-duo"><button class="r-bt chanfro s-forte" data-eqccf="${l.numero}">Cancelar lote</button><button class="r-bt chanfro" data-eqver>Voltar</button></div></div>`;
    return `<div class="s-eqlin">${selo()}<button class="r-link" data-eqedit="${l.numero}">Editar</button><button class="r-link" data-eqcanc="${l.numero}">Cancelar lote</button></div>`;
  }
  function pLeiloes(r){
    const c=corrente(r),p=proximos(r),enc=D.lotes.filter(l=>l.st==='vendido'||l.st==='devolvido');
    return avisoOk()+(r.aberto?
      cab(r.extra?'Edição extra':`Edição ${saEd(r.n)}`,`${c.length} ${c.length===1?'lote':'lotes'} · lances em Tempo`)+(c.length?`<ul class="s-lotes">${c.map(l=>lote(l,true)).join('')}</ul>`:vazio('Palco vazio','Nenhum lote nesta edição. Os itens aprovados na Bandeja entram na próxima.'))
      :cab('Próxima edição',`Abre ${saData(r.prox)}`)+(p.length?`<ul class="s-lotes">${p.map(l=>lote(l,false)).join('')}</ul>`:vazio('Cortinas fechadas','Os lotes aprovados aparecem aqui antes da abertura. Lances só valem com o Salão aberto.')))
      +(enc.length?cab('Encerrados','Últimas batidas de martelo')+`<ul class="s-enc fundo">${enc.map(l=>`<li><small>${saNum(l.numero)}</small><span>${saCarta(l.id).nome}</span>${l.st==='vendido'?`${l.venci?'<i class="s-sel lid">Seu</i>':''}<b>${saTempo(l.final)}</b>`:'<em>Sem lances</em>'}</li>`).join('')}</ul>`:'');
  }
  function oferta(o,acao){return `<li class="s-of fundo"><div class="s-carta p">${saFace(o.c)}</div><div class="s-info"><strong>${saCarta(o.c).nome}</strong><p class="s-de">${saRar(o.c)} <span>${o.meu?'sua':`de ${o.vend}`}</span></p><b class="s-val">${saTempo(o.preco)}</b></div><div class="s-acao">${acao}</div></li>`}
  function pMercado(r){
    const outras=D.ofertas.filter(o=>!o.meu&&o.st==='ativa'),minhas=D.ofertas.filter(o=>o.meu||o.comprei);
    return `<div class="s-placa fundo">${cab('Mercado','Compra e venda entre jogadores · preço fixo')}<button class="r-bt chanfro" id="s-vender">Vender carta</button><p>${r.aberto?'Salão aberto: as compras são liquidadas na hora, em Tempo.':'Você pode pôr cartas à venda a qualquer momento; as compras só acontecem durante a abertura.'}</p></div>${avisoOk()}`
      +(outras.length?`<ul class="s-ofs">${outras.map(o=>oferta(o,`<button class="r-bt chanfro s-forte" data-compra="${o.id}" ${r.aberto?'':'disabled'} aria-label="Comprar ${saCarta(o.c).nome} por ${saTempo(o.preco)}">Comprar</button>`)).join('')}</ul>`:vazio('Nenhuma carta à venda','Quando alguém puser uma carta no Mercado, ela aparece aqui.'))
      +(minhas.length?cab('Suas negociações')+`<ul class="s-ofs">${minhas.map(o=>oferta(o,o.meu&&o.st==='ativa'?`<button class="r-link" data-retira="${o.id}">Retirar</button>`:o.st==='vendida'?`<span class="s-sel ${o.comprei?'lid':'seu'}">${o.comprei?'Comprada':`Vendida · +${saTempo(o.repasse)}`}</span>`:'<span class="s-sel seu">Retirada</span>')).join('')}</ul>`:'');
  }
  function anuncio(a,extra=''){const rec=a.tipo==='recrutamento';return `<li class="s-an fundo ${rec?'rec':''}" aria-label="${SA_ANUNCIO[a.tipo]}: ${saEsc(a.titulo)}"><div class="s-lin"><span class="s-sel ${rec?'lid':'seu'}">${SA_ANUNCIO[a.tipo]}</span><small>${saEsc(rec?a.corp:a.meu?'você':a.autor)}</small></div><strong>${saEsc(a.titulo)}</strong><p>${saEsc(a.texto)}</p>${extra}</li>`}
  function pAnuncios(){
    const mural=D.anuncios.filter(a=>a.st==='publicado'),meus=D.anuncios.filter(a=>a.meu);
    const pend=equipe?D.anuncios.filter(a=>a.st==='pendente'):[];
    return (pend.length?`<section class="s-eqsec">${cab('Para publicar',`${pend.length} · ${selo()}`)}<ul class="s-ans">${pend.map(a=>anuncio(a,`<p class="r-sub">${saEsc(a.meu?'você':a.autor)}${a.custo?` · pago ${saTempo(a.custo)}`:''}</p><div class="r-acoes s-duo"><button class="r-bt chanfro s-forte" data-eqpub="${a.id}">Publicar</button><button class="r-bt chanfro" data-eqarec="${a.id}">Recusar</button></div>`)).join('')}</ul></section>`:'')+`<div class="s-placa fundo">${cab('Propostas e anúncios','Recrutamento · propagandas · propostas')}<button class="r-bt chanfro" id="s-anunciar">Anunciar</button><p>Propostas não têm custo inicial. Propagandas custam ${saTempo(SA_PROPAGANDA)}. Tudo passa pela avaliação da casa antes de ir ao mural.</p></div>${avisoOk()}`
      +(mural.length?`<ul class="s-ans">${mural.map(a=>anuncio(a)).join('')}</ul>`:vazio('Mural vazio','Nenhuma proposta publicada nesta temporada.'))
      +(meus.length?cab('Seus anúncios')+`<ul class="s-ans">${meus.map(a=>anuncio(a,`<div class="s-lin"><span class="s-sel ${a.st==='recusado'||a.st==='retirado'?'seu':'lid'}">${{pendente:'Em avaliação',publicado:'No mural',recusado:'Recusado',retirado:'Retirado'}[a.st]}</span>${a.st==='pendente'||a.st==='publicado'?`<button class="r-link" data-anret="${a.id}">Retirar</button>`:''}</div>`)).join('')}</ul>`:'');
  }
  function eqBandeja(){
    const lt=D.lotes.filter(l=>l.st==='avaliacao');
    return `<section class="s-eqsec">${cab('Para avaliar',`${lt.length} · ${selo()}`)}${lt.length?`<ul class="s-ofs">${lt.map(l=>`<li class="s-of s-item fundo"><div class="s-carta p">${saFace(l.id)}</div><div class="s-info"><small>Lote Nº ${saNum(l.numero)}</small><strong>${saCarta(l.id).nome}</strong><p class="r-sub">${nomeRar(saCarta(l.id).rar)} · de ${l.meu?'você':l.vend} · mín. ${saTempo(l.min)}</p>
      <input class="s-in" data-eqnota="${l.numero}" maxlength="240" placeholder="Parecer (opcional)" aria-label="Parecer do lote ${l.numero}"><div class="r-acoes s-duo"><button class="r-bt chanfro s-forte" data-eqapr="${l.numero}">Aceitar</button><button class="r-bt chanfro" data-eqrec="${l.numero}">Recusar</button></div></div></li>`).join('')}</ul>`:vazio('Bandeja limpa','Nenhum item esperando avaliação.')}</section>`;
  }
  function pBandeja(r){
    const meus=D.lotes.filter(l=>l.meu),ativos=meus.filter(l=>l.st==='avaliacao'||l.st==='aprovado').length,livres=SA_BANDEJA.vagas-vagasDe(r.n+1);
    return `<section class="s-aviso fundo" aria-label="Anunciar no Salão das Máscaras"><button class="s-av-bt" id="s-av" aria-expanded="${avisoAberto}"><span><small>Sistema</small>Anunciar no Salão das Máscaras</span><i aria-hidden="true">${avisoAberto?'−':'+'}</i></button>
        ${avisoAberto?`<ol>${AVISO_ANUNCIAR.map(t=>`<li>${poGen(t)}</li>`).join('')}</ol>${g.aviso?'':'<button class="r-bt chanfro" id="s-entendi">Entendi</button>'}`:''}</section>
      <div class="s-placa fundo">${cab('Bandeja',`${SA_CONTRATO.nome} · raridade mínima Incomum`)}<dl class="s-dl"><div><dt>Taxa de divulgação</dt><dd>${saTempo(SA_CONTRATO.divulgacao)}</dd></div><div><dt>Comissão na venda</dt><dd>${SA_CONTRATO.comissao}%</dd></div><div><dt>Vagas da próxima edição</dt><dd>${Math.max(0,livres)} de ${SA_BANDEJA.vagas}</dd></div><div><dt>Seus itens ativos</dt><dd>${ativos} de ${SA_BANDEJA.max}</dd></div></dl>
        <button class="r-bt chanfro s-forte s-larga" id="s-enviar" ${ativos>=SA_BANDEJA.max?'disabled':''}>Enviar pelo Shuffler</button>${dono?'<p class="r-sub">Valores provisórios · editáveis no Calendário Devo</p>':''}</div>${avisoOk()}
      ${equipe?eqBandeja():''}
      ${cab('Seus itens')}${meus.length?`<ul class="s-ofs">${meus.map(l=>`<li class="s-of s-item fundo"><div class="s-carta p">${saFace(l.id)}</div><div class="s-info"><small>Lote Nº ${saNum(l.numero)}</small><strong>${saCarta(l.id).nome}</strong>
        <p class="s-de"><span class="s-sel ${l.st==='avaliacao'?'ava':l.st==='recusado'?'sup':l.st==='vendido'||l.st==='aprovado'?'lid':'seu'}">${SA_STATUS[l.st]}</span>${l.st==='aprovado'&&l.ed!==null?` <span>Edição ${saEd(l.ed)}</span>`:''}</p>
        ${l.st==='vendido'?`<p class="r-sub">Arrematado por ${saTempo(l.final)} · você recebeu <b>${saTempo(l.repasse)}</b></p>`:''}${l.st==='aprovado'?`<p class="r-sub">Lance mínimo ${saTempo(l.min)}</p>`:''}${l.st==='recusado'&&l.nota?`<p class="r-sub">“${saEsc(l.nota)}”</p>`:''}${l.st==='avaliacao'?`<button class="r-link" data-banret="${l.numero}">Retirar da Bandeja</button>`:''}</div></li>`).join('')}</ul>`:vazio('Bandeja vazia','Envie uma carta pelo Shuffler. Ela espera a avaliação de um especialista antes de entrar no leilão.')}`;
  }
  function painel(r){return aba==='leiloes'?pLeiloes(r):aba==='mercado'?pMercado(r):aba==='anuncios'?pAnuncios():pBandeja(r)}
  function tudo(){
    const r=saRelogio(),c=raiz.closest('.corpo'),y=c?c.scrollTop:0,velha=ultimo!==null&&ultimo!==r.aberto?$r('.s-cen')?.getAttribute('src'):null;
    const n=pendFila();
    raiz.innerHTML=`<div class="s-grade"><div class="s-esq">${palco(r)}</div><div class="s-dir">${abas(r)}<div class="s-painel" role="tabpanel">${painel(r)}</div></div></div>
      ${equipe?`<button class="s-equipe chanfro" id="s-equipe"><img src="${px('mesa')}" alt=""><span>Painel da equipe</span>${n?`<b>${n}</b>`:''}</button>`:''}`;
    if(c)c.scrollTop=y;
    if(velha&&!parado&&!q.has('semraf')){const v=document.createElement('img');v.className='s-cen s-velha';v.src=velha;v.alt='';$r('.s-vista').append(v);v.onanimationend=()=>v.remove()}
    ultimo=r.aberto;nota='';pintaNum();liga();
    if(saEquipeRepinta)saEquipeRepinta();
  }
  function liga(){
    $r('#s-cal').onclick=calendario;$r('#s-her').onclick=()=>herdeiro();
    raiz.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{aba=b.dataset.a;tudo();const t=$r('.r-abas');if(t&&raiz.closest('.corpo').scrollTop>t.offsetTop)raiz.closest('.corpo').scrollTop=t.offsetTop});
    raiz.querySelectorAll('[data-lance]').forEach(b=>b.onclick=()=>lance(D.lotes.find(l=>l.numero===+b.dataset.lance)));
    raiz.querySelectorAll('[data-compra]').forEach(b=>b.onclick=()=>compra(D.ofertas.find(o=>o.id===b.dataset.compra)));
    raiz.querySelectorAll('[data-retira]').forEach(b=>b.onclick=()=>{const o=D.ofertas.find(x=>x.id===b.dataset.retira);o.st='retirada';saDaCarta(o.c);nota='A carta voltou para o seu inventário.';tudo()});
    raiz.querySelectorAll('[data-anret]').forEach(b=>b.onclick=()=>{D.anuncios.find(a=>a.id===b.dataset.anret).st='retirado';tudo()});
    raiz.querySelectorAll('[data-banret]').forEach(b=>b.onclick=()=>{const l=D.lotes.find(x=>x.numero===+b.dataset.banret);l.st='retirado';saDevolve(l);nota='A carta e a taxa voltaram para você.';tudo()});
    const liga1=(s,f)=>{const e=$r(s);if(e)e.onclick=f};
    liga1('#s-vender',()=>enviar('mercado'));liga1('#s-enviar',()=>enviar('bandeja'));liga1('#s-anunciar',novoAnuncio);
    liga1('#s-av',()=>{avisoAberto=!avisoAberto;tudo()});
    liga1('#s-entendi',()=>{g.aviso=true;grava();avisoAberto=false;tudo()});
    liga1('#s-equipe',abreEquipe);
    if(!equipe)return;
    const tod=(sel,f)=>raiz.querySelectorAll(sel).forEach(b=>b.onclick=()=>{f(b);tudo()});
    const lot=v=>D.lotes.find(l=>l.numero===+v),nt=n=>($r(`[data-eqnota="${n}"]`)?.value||'').trim();
    tod('[data-eqapr]',b=>{nota=aprovaLote(lot(b.dataset.eqapr),nt(b.dataset.eqapr))});
    tod('[data-eqrec]',b=>{nota=recusaLote(lot(b.dataset.eqrec),nt(b.dataset.eqrec))});
    tod('[data-eqpub]',b=>{nota=publicaAn(D.anuncios.find(a=>a.id===b.dataset.eqpub))});
    tod('[data-eqarec]',b=>{nota=recusaAn(D.anuncios.find(a=>a.id===b.dataset.eqarec))});
    tod('[data-eqedit]',b=>{editaLote=+b.dataset.eqedit;cancLote=null});
    tod('[data-eqcanc]',b=>{cancLote=+b.dataset.eqcanc;editaLote=null});
    tod('[data-eqver]',()=>{editaLote=cancLote=null});
    tod('[data-eqccf]',b=>{const l=lot(b.dataset.eqccf);l.st='recusado';saDevolve(l);cancLote=null;nota=`Lote Nº ${saNum(l.numero)} cancelado.`});
    if(editaLote!==null&&$r('#s-emin')){const l=lot(editaLote),v=saLigaCampo(raiz,'s-emin',{val:l.min,min:1,max:SA_MAX,passo:10});
      tod('[data-eqsalva]',()=>{l.min=v();l.ed=+$r('#s-eed').value;editaLote=null;nota=`Lote Nº ${saNum(l.numero)} atualizado.`})}
    tod('#s-eq-ab',()=>{abrirEq=true});tod('#s-eq-av',()=>{abrirEq=false});tod('#s-eq-fa',()=>{fecharEq=true});tod('#s-eq-fv',()=>{fecharEq=false});
    tod('#s-eq-ant',()=>{abrirEq=false;nota=abreAgora('ant');aba='leiloes'});tod('#s-eq-ext',()=>{abrirEq=false;nota=abreAgora('ext');aba='leiloes'});
    tod('#s-eq-fc',()=>{fecharEq=false;nota=fechaAgora();aba='leiloes'});
  }
  /* ---- dar lance ---- */
  function lance(l){
    const o=saFolha(jan(),`Lote Nº ${saNum(l.numero)}`,'Dar lance',`<div class="s-corpo"><p class="r-sub">O valor sai do seu pulso agora. Se alguém cobrir o seu lance, ele volta para você.</p>
      <div class="s-res"><div class="s-carta">${saFace(l.id)}</div><div class="s-info"><strong>${saCarta(l.id).nome}</strong><p class="s-de">${saRar(l.id)}</p><p class="r-sub">de ${l.vend}</p></div></div>
      <dl class="s-dl"><div><dt>${l.maior?'Maior lance':'Lance mínimo'}</dt><dd>${saTempo(l.maior??l.min)}</dd></div><div><dt>Incremento</dt><dd>${saTempo(l.inc)}</dd></div>${l.lidero&&l.maior?'<div><dt>Você paga agora</dt><dd id="s-paga"></dd></div>':''}</dl>
      ${saCampo('s-val','Seu lance',`Seu pulso precisa manter pelo menos ${saTempo(SA_BANDEJA.reserva)} depois do lance.`)}<p class="r-erro" id="s-er" role="alert" hidden></p><button class="r-bt chanfro s-forte s-larga" id="s-conf">Confirmar lance</button></div>`);
    const prox=l.maior?l.maior+l.inc:l.min;
    const val=saLigaCampo(o,'s-val',{val:prox,min:prox,max:SA_MAX,passo:l.inc},v=>{const p=o.querySelector('#s-paga');if(p)p.textContent=saTempo(Math.max(0,v-l.maior))});
    o.querySelector('#s-conf').onclick=()=>{
      const v=val(),paga=l.lidero&&l.maior?v-l.maior:v;
      if(!saPagar(paga)){const e=o.querySelector('#s-er');e.textContent=`Seu pulso precisa manter pelo menos ${saTempo(SA_BANDEJA.reserva)} depois do lance.`;e.hidden=false;return}
      l.maior=v;l.lances++;l.lidero=true;l.meuLance=v;o.remove();nota=`Lance de ${saTempo(v)} aceito no lote Nº ${saNum(l.numero)}.`;tudo();
    };
  }
  function compra(o){
    if(!saPagar(o.preco)){nota=`Seu pulso precisa manter pelo menos ${saTempo(SA_BANDEJA.reserva)} depois da compra.`;return tudo()}
    o.st='vendida';o.comprei=true;saDaCarta(o.c);nota=`${saCarta(o.c).nome} foi para o seu inventário.`;tudo();
  }
  /* ---- enviar à Bandeja ou vender no Mercado ---- */
  function enviar(modo){
    const band=modo==='bandeja',ordem=r=>RARS.findIndex(x=>x[0]===r);
    const copias=Object.entries(TENHO).flatMap(([id,[n]])=>Array(n).fill(id)).sort((a,b)=>ordem(saCarta(b).rar)-ordem(saCarta(a).rar)||a.localeCompare(b));
    const ok=id=>!band||ordem(saCarta(id).rar)>=ordem(SA_BANDEJA.minima);
    const o=saFolha(jan(),band?'Shuffler · Salão das Máscaras':'Mercado do Salão',band?'Enviar à Bandeja':'Vender no Mercado',`<div class="s-corpo"><p class="r-sub">${band?'A carta sai do seu inventário e espera a avaliação de um especialista. Raridade mínima: Incomum.':'A carta sai do seu inventário e fica à venda por um preço fixo em Tempo. As compras acontecem durante a abertura.'}</p>
      ${copias.length?`<ul class="i-cartas s-esc" aria-label="Suas cartas">${copias.map((id,i)=>`<li><button data-i="${i}" ${ok(id)?'':'disabled'} aria-pressed="false" aria-label="${ok(id)?`Escolher ${saCarta(id).nome}`:`${saCarta(id).nome}: abaixo da raridade mínima`}">${saFace(id)}${ok(id)?'':'<span>Mínimo Incomum</span>'}</button></li>`).join('')}</ul>`:'<p>Você não tem cartas no inventário.</p>'}
      <div id="s-esc"></div><p class="r-erro" id="s-er" role="alert" hidden></p></div>`);
    let esc=null,val=null;
    const min=band?SA_BANDEJA.lanceMin:1,repasse=v=>Math.floor(v-v*SA_CONTRATO.comissao/100);
    o.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{
      const id=copias[+b.dataset.i],mesmo=esc===+b.dataset.i;
      o.querySelectorAll('[data-i]').forEach(x=>x.setAttribute('aria-pressed','false'));
      esc=mesmo?null:+b.dataset.i;const c=o.querySelector('#s-esc');c.innerHTML='';if(mesmo)return;
      b.setAttribute('aria-pressed','true');
      c.innerHTML=`<strong class="s-nome">${saCarta(id).nome}</strong>${saCampo('s-val',band?'Lance mínimo':'Preço')}<dl class="s-dl"><div><dt>Contrato</dt><dd>${SA_CONTRATO.nome}</dd></div>${band?`<div><dt>Taxa de divulgação</dt><dd>${saTempo(SA_CONTRATO.divulgacao)} · paga agora</dd></div>`:''}<div><dt>Comissão na venda</dt><dd>${SA_CONTRATO.comissao}%</dd></div><div><dt>${band?'Você recebe no lance mínimo':'Você recebe'}</dt><dd id="s-rec"></dd></div></dl>${band?'<p class="r-sub">Se o especialista recusar, a carta e a taxa voltam para você.</p>':''}<button class="r-bt chanfro s-forte s-larga" id="s-conf">${band?'Enviar à Bandeja':'Pôr à venda'}</button>`;
      val=saLigaCampo(c,'s-val',{val:band?SA_BANDEJA.lanceMin:60,min,max:SA_MAX,passo:band?SA_BANDEJA.incremento:10},v=>{c.querySelector('#s-rec').textContent=saTempo(repasse(v))});
      c.querySelector('#s-conf').onclick=()=>{
        if(band&&!saPagar(SA_CONTRATO.divulgacao)){const e=o.querySelector('#s-er');e.textContent=`Seu pulso precisa manter pelo menos ${saTempo(SA_BANDEJA.reserva)} depois da taxa.`;e.hidden=false;return}
        saTiraCarta(id);
        if(band)D.lotes.push({numero:Math.max(...D.lotes.map(l=>l.numero))+1,id,vend:null,meu:true,st:'avaliacao',ed:null,min:val(),inc:10,maior:null,lances:0,lidero:false,meuLance:null,final:null,repasse:null,venci:false,nota:null,taxa:SA_CONTRATO.divulgacao});
        else D.ofertas.push({id:'o'+Date.now(),c:id,vend:null,meu:true,preco:val(),st:'ativa',comprei:false,repasse:null});
        const corpo=o.querySelector('.s-corpo');
        corpo.innerHTML=`<div class="s-feito" role="status"><i aria-hidden="true"></i><strong>${saCarta(id).nome}</strong><p class="r-sub">${band?'Na Bandeja, em avaliação de especialista. Acompanhe na aba Bandeja do Salão.':'À venda no Mercado do Salão.'}</p><button class="r-bt chanfro" id="s-fim">Fechar</button></div>`;
        corpo.querySelector('#s-fim').onclick=()=>o.remove();tudo();
      };
    });
  }
  /* ---- novo anúncio ---- */
  function novoAnuncio(){
    let tipo='proposta';
    const o=saFolha(jan(),'Salão das Máscaras','Novo anúncio',`<div class="s-corpo"><p class="r-sub">A casa avalia antes de publicar no mural.</p>
      <div class="s-tipos" role="radiogroup" aria-label="Tipo de anúncio">${['proposta','propaganda'].map(t=>`<button class="chanfro" role="radio" data-t="${t}" aria-checked="${t===tipo}"><strong>${SA_ANUNCIO[t]}</strong><small>${t==='proposta'?'Sem custo inicial':saTempo(SA_PROPAGANDA)}</small></button>`).join('')}</div>
      <label class="s-rot" for="s-tit">Título</label><input class="s-in" id="s-tit" maxlength="80" placeholder="Compro cartas lendárias">
      <label class="s-rot" for="s-txt">Texto</label><textarea class="s-in" id="s-txt" maxlength="600" rows="4" placeholder="O que você oferece ou procura."></textarea>
      <p class="r-erro" id="s-er" role="alert" hidden></p><button class="r-bt chanfro s-forte s-larga" id="s-conf" disabled></button></div>`);
    const t1=o.querySelector('#s-tit'),t2=o.querySelector('#s-txt'),bt=o.querySelector('#s-conf');
    const pinta=()=>{o.querySelectorAll('[data-t]').forEach(b=>b.setAttribute('aria-checked',b.dataset.t===tipo));bt.textContent=tipo==='propaganda'?`Enviar · ${saTempo(SA_PROPAGANDA)}`:'Enviar proposta';bt.disabled=t1.value.trim().length<3||t2.value.trim().length<3};
    o.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{tipo=b.dataset.t;pinta()});t1.oninput=t2.oninput=pinta;pinta();
    bt.onclick=()=>{
      const er=m=>{const e=o.querySelector('#s-er');e.textContent=m;e.hidden=false};
      if(D.anuncios.filter(a=>a.meu&&a.st==='pendente').length>=3)return er('Você já tem 3 anúncios aguardando avaliação.');
      if(tipo==='propaganda'&&!saPagar(SA_PROPAGANDA))return er(`Seu pulso precisa manter pelo menos ${saTempo(SA_BANDEJA.reserva)} depois do pagamento.`);
      D.anuncios.push({id:'a'+Date.now(),tipo,titulo:t1.value.trim(),texto:t2.value.trim(),autor:null,corp:null,meu:true,st:'pendente',custo:tipo==='propaganda'?SA_PROPAGANDA:0});
      o.remove();aba='anuncios';nota='Enviado. A casa avalia antes de publicar no mural.';tudo();
    };
  }
  /* ---- Calendário Devo: aberturas do Salão e eventos ---- */
  function calendario(){
    const hoje=saDiaBr(Date.now());let [ano,mes]=hoje.split('-').map(Number),sel=null;mes--;
    const o=saFolha(jan(),'Salão das Máscaras','Calendário Devo','<div class="s-corpo" id="s-cc"></div>'),cc=o.querySelector('#s-cc');
    const itens=()=>{
      const r=saRelogio(),iv=SA.intervalo*SA_D,out=[];
      for(let k=-2;k<=14;k++){const ini=r.ini+k*iv;out.push({id:'ed'+k,tipo:'edicao',titulo:`Abertura do Salão · Edição ${saEd(r.n+k)}`,ini,fim:ini+SA.duracao*SA_H})}
      SA_EVENTOS.forEach(e=>out.push({...e,ev:e}));
      return out.sort((a,b)=>a.ini-b.ini);
    };
    function pinta(){
      const its=itens(),porDia={};its.forEach(i=>{const k=saDiaBr(i.ini);(porDia[k]=porDia[k]||[]).push(i)});
      const off=new Date(Date.UTC(ano,mes,1)).getUTCDay(),dias=new Date(Date.UTC(ano,mes+1,0)).getUTCDate();
      const chave=d=>`${ano}-${String(mes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const lista=sel?(porDia[sel]||[]):its.filter(i=>i.fim>Date.now()).slice(0,8);
      cc.innerHTML=`<p class="r-sub">Aberturas do Salão e eventos quinzenais e especiais. Horário de Brasília.</p>
        <div class="k-mes"><button class="m-volta chanfro" id="s-ant" aria-label="Mês anterior">‹</button><strong>${CAL_MESES[mes]} <span>${ano}</span></strong><button class="m-volta chanfro" id="s-pro" aria-label="Próximo mês">›</button></div>
        <div class="k-semana" aria-hidden="true">${['D','S','T','Q','Q','S','S'].map(x=>`<span>${x}</span>`).join('')}</div>
        <div class="k-grade s-grade-c">${'<span></span>'.repeat(off)}${Array.from({length:dias},(_,i)=>{const d=i+1,k=chave(d),l=porDia[k]||[],ed=l.some(x=>x.tipo==='edicao'),ev=l.some(x=>x.tipo!=='edicao');return `<button class="k-d ${k===hoje?'hoje':''} ${ed||ev?'ev':''} ${sel===k?'sel':''}" data-dia="${k}" aria-label="${d} de ${CAL_MESES[mes]}${ed?', abertura do Salão':''}${ev?', evento':''}" aria-pressed="${sel===k}">${d}<span>${ed?`<img src="${px('salao')}" alt="">`:''}${ev?'<u></u>':''}</span></button>`}).join('')}</div>
        <p class="s-leg"><span><img src="${px('salao')}" alt="">Abertura</span><span><u></u>Evento</span></p>
        <h4>${sel?'Neste dia':'Próximas datas'}</h4>
        ${lista.length?`<ul class="s-agenda">${lista.map(i=>`<li><img src="${i.tipo==='edicao'?px('salao'):px('calendario')}" alt=""><div>${i.tipo!=='edicao'?`<span class="s-sel lid">${SA_EVENTO[i.tipo]}</span>${i.prov?' <span class="s-sel seu">Provisório</span>':''}`:''}<strong>${i.titulo}</strong><small>${saData(i.ini)}</small>${i.d?`<p class="r-sub">${i.d}</p>`:''}${i.dest&&i.dest.length?`<p class="s-dest">${i.dest.join(' · ')}</p>`:''}${dono&&i.ev?`<button class="r-link s-esq-link" data-rem="${i.id}">Remover evento</button>`:''}</div></li>`).join('')}</ul>`:'<p class="r-sub">Nada marcado.</p>'}
        ${dono?ajustes():''}`;
      const anda=n=>{const t=ano*12+mes+n;ano=Math.floor(t/12);mes=t%12;sel=null;pinta()};
      cc.querySelector('#s-ant').onclick=()=>anda(-1);cc.querySelector('#s-pro').onclick=()=>anda(1);
      cc.querySelectorAll('[data-dia]').forEach(b=>b.onclick=()=>{sel=sel===b.dataset.dia?null:b.dataset.dia;pinta()});
      cc.querySelectorAll('[data-rem]').forEach(b=>b.onclick=()=>{SA_EVENTOS=SA_EVENTOS.filter(e=>e.id!==b.dataset.rem);pinta();tudo()});
      if(dono)ligaAjustes();
    }
    const paraCampo=ms=>new Intl.DateTimeFormat('sv-SE',{timeZone:SA_TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(ms).replace(' ','T');
    const deCampo=v=>v?Date.parse(`${v}:00-03:00`):NaN;
    function ajustes(){
      return `<section class="s-ajustes" aria-label="Calendário do Owner"><div class="s-lin"><h4>Ajustes do Owner</h4>${SA.provisorio?'<span class="s-sel seu">Provisório</span>':''}</div>
        <div class="s-form"><label class="l2">Primeira abertura (âncora)<input type="datetime-local" id="s-anc" value="${paraCampo(SA.ancora)}"></label>
          <label>A cada (dias)<input type="number" min="1" max="60" id="s-int" value="${SA.intervalo}"></label><label>Aberto por (horas)<input type="number" min="1" max="720" id="s-dur" value="${SA.duracao}"></label>
          <label class="l2">Abertura manual<select id="s-for"><option value="">Seguir o calendário</option><option value="aberto" ${SA.forcar==='aberto'?'selected':''}>Abrir agora</option><option value="fechado" ${SA.forcar==='fechado'?'selected':''}>Fechar agora (encerra a edição)</option></select></label></div>
        <button class="r-bt chanfro s-larga" id="s-salva">Salvar calendário</button>
        <div class="s-form"><label class="l2">Novo evento<input id="s-et" placeholder="Título"></label><label>Tipo<select id="s-etp"><option value="especial">Especial</option><option value="quinzenal">Quinzenal</option><option value="teatro">Teatro</option></select></label><label>Destaques<input id="s-ed" placeholder="separados por vírgula"></label><label>Início<input type="datetime-local" id="s-ei"></label><label>Fim<input type="datetime-local" id="s-ef"></label></div>
        <button class="r-bt chanfro s-larga" id="s-add" disabled>Adicionar evento</button><p class="s-ok" id="s-okc" role="status" hidden></p><p class="r-erro" id="s-erc" role="alert" hidden></p></section>`;
    }
    function ligaAjustes(){
      const c=s=>cc.querySelector(s),ok=m=>{pinta();const e=c('#s-okc');e.textContent=m;e.hidden=false;tudo()};
      const libera=()=>{c('#s-add').disabled=c('#s-et').value.trim().length<3||!c('#s-ei').value};c('#s-et').oninput=c('#s-ei').oninput=libera;
      c('#s-salva').onclick=()=>{
        const a=deCampo(c('#s-anc').value),i=+c('#s-int').value,d=+c('#s-dur').value;
        if(!Number.isFinite(a)||!(i>=1&&i<=60)||!(d>=1)){const e=c('#s-erc');e.textContent='Confira a âncora, o intervalo e a duração.';e.hidden=false;return}
        Object.assign(SA,{ancora:a,intervalo:i,duracao:Math.min(d,i*24),forcar:c('#s-for').value||null});SA.fimAntecipado=null;ok('Calendário salvo.');
      };
      c('#s-add').onclick=()=>{
        const ini=deCampo(c('#s-ei').value),fim=c('#s-ef').value?deCampo(c('#s-ef').value):ini+2*SA_H;
        if(fim<=ini){const e=c('#s-erc');e.textContent='O fim precisa ser depois do início.';e.hidden=false;return}
        SA_EVENTOS.push({id:'e'+Date.now(),tipo:c('#s-etp').value,titulo:c('#s-et').value.trim(),d:'',ini,fim,dest:c('#s-ed').value.split(',').map(x=>x.trim()).filter(Boolean),prov:true});ok('Evento salvo.');
      };
    }
    pinta();
    return o;
  }
  /* ---- o Herdeiro apresenta o Salão, com o texto literal do dono ---- */
  function herdeiro(passo=0){
    const j=jan();if(j.querySelector('.s-apres'))return;
    const pode=g.viu||equipe,rapido=parado||q.has('semraf');
    const o=document.createElement('div');o.className='s-apres';o.setAttribute('role','dialog');o.setAttribute('aria-label','Salão das Máscaras: apresentação');
    o.innerHTML=`<div class="s-ap-vista"><img class="s-ap-fundo" src="${saArte('camarote')}" alt=""><img class="s-ap-fig" alt="O Herdeiro"><div class="s-ap-foco"></div>${pode?'<button class="k-pula chanfro s-ap-pula">Pular apresentação</button>':''}</div>
      <div class="p-caixa s-ap-caixa"><b>O Herdeiro <small>Maestro do Salão</small></b><p aria-live="polite"></p><span class="s-ap-n"></span><i aria-hidden="true"></i></div>`;
    j.append(o);
    const $o=s=>o.querySelector(s);let n=passo,itv,txt='',k=0,seg;
    const marca=(t,ate=Infinity)=>{let r='',res=ate;t.split('**').forEach((p,i)=>{if(res<=0||!p)return;const x=p.slice(0,res);res-=x.length;r+=i%2?`<strong>${x}</strong>`:x});return r};
    const acaba=()=>{clearInterval(itv);$o('.p-caixa p').innerHTML=marca(txt);k=txt.replace(/\*\*/g,'').length;$o('.p-caixa i').hidden=false};
    const fim=()=>{clearInterval(itv);clearInterval(seg);o.remove();g.viu=true;grava()};
    function fala(){
      const f=HERDEIRO_FALAS[n];txt=f.texto;k=0;$o('.s-ap-fig').src=`art/os/npc/herdeiro-corpo-${f.pose}.png`;$o('.s-ap-n').textContent=`${String(n+1).padStart(2,'0')}/${HERDEIRO_FALAS.length}`;
      const foco=$o('.s-ap-foco');clearInterval(seg);
      if(f.foco==='contador'){foco.innerHTML='<div class="s-ap-num"><small>Próxima abertura em</small><div class="s-num" id="s-ap-num"></div></div>';const b=()=>{const r=saRelogio(),e=foco.querySelector('#s-ap-num'),a=r.aberto?r.fechaEm:r.prox,p=a?saPartes(a-Date.now()):['--','--','--','--'];if(e)e.innerHTML=p.map((x,i)=>`${i?'<i>:</i>':''}<span><b>${x}</b><small>${['Dias','Horas','Min','Seg'][i]}</small></span>`).join('')};b();if(!rapido)seg=setInterval(b,1000)}
      else foco.innerHTML=f.foco?`<p class="s-ap-tag">${SA_FOCO[f.foco]}</p>`:'';
      $o('.p-caixa i').hidden=true;clearInterval(itv);
      if(rapido)return acaba();
      const tot=txt.replace(/\*\*/g,'').length;$o('.p-caixa p').innerHTML='';
      itv=setInterval(()=>{$o('.p-caixa p').innerHTML=marca(txt,++k);if(k>=tot)acaba()},24);
    }
    o.addEventListener('click',e=>{
      if(e.target.closest('.s-ap-pula'))return fim();
      if(k<txt.replace(/\*\*/g,'').length)return acaba();
      n++;if(n>=HERDEIRO_FALAS.length)return fim();
      fala();
    });
    fala();
  }
  /* ---- painel da equipe: janela própria, sem misturar a fila com o salão dos jogadores ---- */
  function abreEquipe(){
    const nova=!janelas.has('salao-equipe');
    const j=janela('salao-equipe',{titulo:'Painel da equipe',ic:'mesa',curto:'Equipe',html:'<div id="seq"></div>',caixa:pc()?[8,56,412,700]:null});
    j.el.querySelector('.corpo').classList.add('r-corpo');
    if(nova)montaEquipe($('seq'));
  }
  function montaEquipe(rz){
    let sub=q.get('equipeaba')||'fila',msg='',abrir=false,fechar=false,editando=null,cancelando=null;
    const $e=s=>rz.querySelector(s);
    const anda=()=>{tudo()}; // repinta o Salão, que repinta o painel
    function fila(){
      const lt=D.lotes.filter(l=>l.st==='avaliacao'),an=D.anuncios.filter(a=>a.st==='pendente'),r=saRelogio();
      return `<p class="r-sub">Raridade mínima Incomum · vagas da próxima edição ${Math.max(0,SA_BANDEJA.vagas-vagasDe(r.n+1))}/${SA_BANDEJA.vagas}</p>
        ${cab('Bandeja em avaliação',`${lt.length}`)}${lt.length?`<ul class="s-ofs">${lt.map(l=>`<li class="s-of s-item fundo"><div class="s-carta p">${saFace(l.id)}</div><div class="s-info"><small>Lote Nº ${saNum(l.numero)}</small><strong>${saCarta(l.id).nome}</strong><p class="r-sub">${nomeRar(saCarta(l.id).rar)} · de ${l.meu?'você':l.vend} · mín. ${saTempo(l.min)}</p>
          <input class="s-in" data-nota="${l.numero}" maxlength="240" placeholder="Parecer (opcional)" aria-label="Parecer do lote ${l.numero}"><div class="r-acoes s-duo"><button class="r-bt chanfro s-forte" data-apr="${l.numero}">Aprovar</button><button class="r-bt chanfro" data-rec="${l.numero}">Recusar</button></div></div></li>`).join('')}</ul>`:vazio('Bandeja limpa','Nenhum item esperando avaliação.')}
        ${cab('Anúncios pendentes',`${an.length}`)}${an.length?`<ul class="s-ans">${an.map(a=>`<li class="s-an fundo"><div class="s-lin"><span class="s-sel seu">${SA_ANUNCIO[a.tipo]}</span><small>${saEsc(a.meu?'você':a.autor)}${a.custo?` · pago ${saTempo(a.custo)}`:''}</small></div><strong>${saEsc(a.titulo)}</strong><p>${saEsc(a.texto)}</p><div class="r-acoes s-duo"><button class="r-bt chanfro s-forte" data-pub="${a.id}">Publicar</button><button class="r-bt chanfro" data-arec="${a.id}">Recusar</button></div></li>`).join('')}</ul>`:vazio('Mural em dia','Nenhum anúncio esperando avaliação.')}`;
    }
    function edicoes(){
      const r=saRelogio(),lt=D.lotes.filter(l=>l.st==='aprovado'&&!(r.aberto&&!r.extra&&l.ed===r.n)).sort((a,b)=>a.ed-b.ed||a.numero-b.numero),eds=[...new Set(lt.map(l=>l.ed))];
      if(!lt.length)return vazio('Nenhum lote aguardando','Os lotes aprovados aparecem aqui até a edição deles abrir.');
      return eds.map(ed=>`${cab(`Edição ${saEd(ed)}`,saDataC(SA.ancora+ed*SA.intervalo*SA_D))}<ul class="s-ofs">${lt.filter(l=>l.ed===ed).map(l=>`<li class="s-of s-item fundo"><div class="s-carta p">${saFace(l.id)}</div><div class="s-info"><small>Lote Nº ${saNum(l.numero)}</small><strong>${saCarta(l.id).nome}</strong><p class="r-sub">de ${l.meu?'você':l.vend} · mín. ${saTempo(l.min)}</p>
        ${editando===l.numero?`${saCampo('s-emin','Lance mínimo')}<label class="s-rot" for="s-eed">Edição</label><select class="s-in" id="s-eed">${[0,1,2].map(k=>{const e=r.n+1+k;return `<option value="${e}" ${e===l.ed?'selected':''}>Edição ${saEd(e)} · ${saDataC(SA.ancora+e*SA.intervalo*SA_D)}</option>`}).join('')}</select><div class="r-acoes s-duo"><button class="r-bt chanfro s-forte" data-esalva="${l.numero}">Salvar</button><button class="r-bt chanfro" data-ever="">Voltar</button></div>`
        :cancelando===l.numero?`<p>A carta e a taxa voltam para ${l.meu?'você':l.vend}.</p><div class="r-acoes s-duo"><button class="r-bt chanfro s-forte" data-ccf="${l.numero}">Cancelar lote</button><button class="r-bt chanfro" data-ccv="">Voltar</button></div>`
        :`<div class="r-acoes s-duo"><button class="r-bt chanfro" data-edit="${l.numero}">Editar</button><button class="r-bt chanfro" data-canc="${l.numero}">Cancelar lote</button></div>`}</div></li>`).join('')}</ul>`).join('');
    }
    function relogioEq(){
      const r=saRelogio(),now=Date.now(),iv=SA.intervalo*SA_D,dur=SA.duracao*SA_H,prox=D.lotes.filter(l=>l.st==='aprovado'&&l.ed===r.n+1),vend=new Set(prox.map(l=>l.vend)).size;
      return `<dl class="s-dl"><div><dt>Estado</dt><dd>${r.aberto?(r.extra?'Aberto · Edição extra':`Aberto · Edição ${saEd(r.n)}`):'Fechado'}</dd></div>${r.aberto?(r.fechaEm?`<div><dt>Fecha</dt><dd>${saData(r.fechaEm)}</dd></div>`:'<div><dt>Fecha</dt><dd>Até segunda ordem</dd></div>'):''}<div><dt>Próxima abertura</dt><dd>${saData(r.prox)}</dd></div></dl>
        ${r.aberto?(fechar?`<p>Os lotes desta edição encerram agora: com lance, vão para quem lidera; sem lance, voltam ao vendedor.</p><div class="r-acoes s-duo"><button class="r-bt chanfro s-forte" id="s-fc">Fechar agora</button><button class="r-bt chanfro" id="s-fv">Voltar</button></div>`:'<button class="r-bt chanfro s-larga" id="s-fa">Fechar agora</button>')
        :abrir?`<div class="s-opcoes"><button class="fundo" id="s-ant-ed"><strong>Antecipar a próxima edição</strong><p>Abre agora · fecha ${saDataC(now+dur)} · próxima abertura ${saDataC(now+iv)}</p><p class="r-sub">${prox.length} ${prox.length===1?'lote':'lotes'} de ${vend} ${vend===1?'vendedor':'vendedores'} ${prox.length===1?'entra':'entram'} agora. Cada vendedor recebe um aviso em Mensagens.</p></button>
            <button class="fundo" id="s-ext"><strong>Edição extra</strong><p>Abre agora · fecha ${saDataC(now+dur)} · próxima abertura ${saDataC(r.prox)}</p><p class="r-sub">Abre sem lotes da fila. O calendário não muda.</p></button></div><button class="r-link" id="s-av2">Voltar</button>`
        :'<button class="r-bt chanfro s-forte s-larga" id="s-ab">Abrir agora</button>'}
        <button class="r-link" id="s-cc2">Calendário completo</button>`;
    }
    function pinta(){
      const n=D.lotes.filter(l=>l.st==='avaliacao').length+D.anuncios.filter(a=>a.st==='pendente').length,y=rz.closest('.corpo').scrollTop;
      rz.innerHTML=`<div class="r-abas" role="tablist" aria-label="Painel da equipe">${[['fila','Fila',n],['edicoes','Edições',0],['relogio','Relógio',0]].map(([id,t,c])=>`<button class="chanfro" role="tab" data-s="${id}" aria-selected="${sub===id}">${t}${c?` <b>${c}</b>`:''}</button>`).join('')}</div>
        <div class="s-painel" role="tabpanel">${msg?`<p class="s-ok fundo" role="status">${msg}</p>`:''}${sub==='fila'?fila():sub==='edicoes'?edicoes():relogioEq()}</div>`;
      rz.closest('.corpo').scrollTop=y;msg='';
      const tod=(s,f)=>rz.querySelectorAll(s).forEach(b=>b.onclick=()=>f(b));
      const lot=v=>D.lotes.find(l=>l.numero===+v);
      tod('[data-s]',b=>{sub=b.dataset.s;pinta()});
      tod('[data-apr]',b=>{const l=lot(b.dataset.apr);msg=aprovaLote(l,$e(`[data-nota="${l.numero}"]`).value.trim());anda()});
      tod('[data-rec]',b=>{const l=lot(b.dataset.rec);msg=recusaLote(l,$e(`[data-nota="${l.numero}"]`).value.trim());anda()});
      tod('[data-pub]',b=>{msg=publicaAn(D.anuncios.find(a=>a.id===b.dataset.pub));anda()});
      tod('[data-arec]',b=>{msg=recusaAn(D.anuncios.find(x=>x.id===b.dataset.arec));anda()});
      tod('[data-edit]',b=>{editando=+b.dataset.edit;cancelando=null;pinta()});tod('[data-ever]',()=>{editando=null;pinta()});
      tod('[data-canc]',b=>{cancelando=+b.dataset.canc;editando=null;pinta()});tod('[data-ccv]',()=>{cancelando=null;pinta()});
      tod('[data-ccf]',b=>{const l=lot(b.dataset.ccf);l.st='recusado';saDevolve(l);cancelando=null;msg=`Lote Nº ${saNum(l.numero)} cancelado.`;anda()});
      if(editando!==null&&$e('#s-emin')){
        const l=lot(editando),v=saLigaCampo(rz,'s-emin',{val:l.min,min:1,max:SA_MAX,passo:10});
        tod('[data-esalva]',()=>{l.min=v();l.ed=+$e('#s-eed').value;editando=null;msg=`Lote Nº ${saNum(l.numero)} atualizado.`;anda()});
      }
      const um=(s,f)=>{const e=$e(s);if(e)e.onclick=f};
      um('#s-ab',()=>{abrir=true;pinta()});um('#s-av2',()=>{abrir=false;pinta()});um('#s-fa',()=>{fechar=true;pinta()});um('#s-fv',()=>{fechar=false;pinta()});
      um('#s-ant-ed',()=>{abrir=false;msg=abreAgora('ant');anda()});
      um('#s-ext',()=>{abrir=false;msg=abreAgora('ext');anda()});
      um('#s-fc',()=>{fechar=false;msg=fechaAgora();anda()});
      um('#s-cc2',()=>{abre(SISTEMAS.find(a=>a.id==='salao'));calendario()});
    }
    saEquipeRepinta=()=>{if(rz.isConnected)pinta();else saEquipeRepinta=null};
    pinta();
  }
  raiz.addEventListener('devo-repinta',tudo);
  tudo();
  if(!parado&&!q.has('semraf'))tid=setInterval(()=>{
    if(!raiz.isConnected)return clearInterval(tid);
    if(saRelogio().aberto!==ultimo)tudo();else pintaNum();
  },1000);
  if((!g.viu&&!q.has('semraf'))||q.has('herdeiro'))herdeiro(+q.get('herdeiropasso')||0);
  if(q.get('salaover')==='lance'){const l=D.lotes.find(x=>x.st==='aprovado'&&!x.meu);lance(l)}
  if(q.get('salaover')==='calendario')calendario();
  if(q.get('salaover')==='enviar')enviar('bandeja');
  if(q.get('salaover')==='anuncio')novoAnuncio();
  if(q.get('salaover')==='equipe')abreEquipe();
}
let saEquipeRepinta=null;
