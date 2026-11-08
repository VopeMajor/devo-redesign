/* ---- Mesa da equipe: o que pede ação no alto, as seções do cargo e, completas, Casos (Deadly Votes) e Recompensas.
   As outras seções mostram tudo o que fazem hoje (docs/redesign/v2/INVENTARIO.md §7); cada uma ganha a sua tela
   numa próxima rodada. Dados de exemplo. "Ver como" troca o cargo para conferir o que cada um enxerga. ---- */
const MESA_SECOES={
  casos:['Casos','Deadly Votes, do convite ao resultado'],
  recompensas:['Recompensas','Propor, aprovar, entregar'],
  semanais:['Semanais','Autorizações pontuais'],
  salao:['Salão','Avaliar lotes e anúncios'],
  virtudes:['Virtudes','P.P., afinidades, Estágios, Arcanos'],
  corporacoes:['Corporações','Fundações e classificação'],
  calendario:['Calendário','Eventos e regras'],
  equipe:['Equipe','Anfitriões, Dealers e cargos'],
  jogadores:['Jogadores','Busca, itens e desbloqueios'],
  convites:['Convites','Gerar e revogar'],
  cosmeticos:['Cosméticos','Catálogo, conceder, revogar'],
  poco:['Poço','Seções, pesos e prêmios'],
  casa:['Casa','Regras e receitas'],
  anuncios:['Anúncios','Avisos da tela inicial'],
  registro:['Registro','Tudo o que a equipe fez'],
  ajustes:['Ajustes','Configurações do jogo'],
};
const MESA_GRUPOS=[['Operação',['casos','recompensas','semanais','salao']],['Supervisão',['virtudes','corporacoes','calendario','equipe','jogadores','convites']],['Casa inteira',['cosmeticos','poco','casa','anuncios','registro','ajustes']]];
const MESA_CARGO={dealer:['casos','recompensas','semanais','salao'],anfitriao:['casos','recompensas','semanais','salao','virtudes','corporacoes','calendario','equipe','jogadores','convites']};
const MESA_CARGO_NOME={dealer:'Dealer',anfitriao:'Anfitrião',owner:'Owner'};
const MESA_CARGO_LINHA={dealer:'Operação · seus Deadly Votes e propostas',anfitriao:'Supervisão · Dealers, eventos e aprovações',owner:'Mesa alta · casa inteira'};
// o que cada seção faz hoje, para nada se perder (INVENTARIO.md)
const MESA_FUNCOES={
  semanais:['Conceder e revogar autorizações pontuais'],
  salao:['Avaliar lotes enviados à Bandeja','Avaliar anúncios do Salão','Calendário do Salão e contrato (taxas), só Owner'],
  virtudes:['Ver P.P. de cada jogador','Afinidades por Arcano','Limites por Estágio','Evoluir Estágio','Registrar o Arcano do jogador','Texto de cada Arcano (Owner)'],
  corporacoes:['Aprovar fundação','Classificar: oficial ou Necro','Escopo da Corporação'],
  calendario:['Criar e remover eventos','Regras do check-in','Recompensas do ciclo (Owner)'],
  equipe:['Anfitriões e seus Dealers','Transferir Dealer','Mudar cargo (Owner)'],
  jogadores:['Buscar jogador','Dados resumidos (Anfitrião) ou completos (Owner)','Conceder e retirar item (Owner)','Liberar ou travar sistemas (Owner)'],
  convites:['Gerar convite por cargo','Revogar convite','Contas de teste'],
  cosmeticos:['Catálogo e arte','Conceder e revogar'],
  poco:['Seções e pesos','Prêmios e item por seção','Arte'],
  casa:['Regras da Confecção','Receitas'],
  anuncios:['Escrever e ordenar os avisos da tela inicial','Retirar aviso'],
  registro:['Registro com filtro por pessoa e ação'],
  ajustes:['Configurações do jogo (devo_config)'],
};
const MESA_ST={convocado:['Convocado','Inscrições abertas'],'em-progresso':['Em andamento','Grupo aberto aos inscritos'],concluido:['Encerrado','Resultado registrado'],cancelado:['Cancelado','Edição suspensa pelo Dealer'],falha:['Falha do sistema','Caso perdido']};
const MESA_DEC={premio:['Recebe prêmio','Sobreviveu · recebe as recompensas do caso'],morreu:['Morreu','Eliminado · sem recompensa'],ausente:['Não compareceu','Sem resultado · sem recompensa'],outro:['Outro','Sobreviveu sem resultado definido · explique na nota']};
const MESA_REC_ST={pendente:'Pendente',aprovada:'Aprovada',rejeitada:'Rejeitada',entregue:'Entregue',cancelada:'Cancelada'};
const MESA_ICO={
  casos:'<path d="M7 3h10l3 4v14H4V7z"/><path d="M9 12h6M9 16h4"/>',recompensas:'<path d="M4 10h16v11H4z"/><path d="M12 10v11M3 7h18v3H3zM12 7c-2-4-6-4-6-1s4 1 6 1c2 0 6 2 6-1s-4-3-6 1"/>',
  semanais:'<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4M16 3v4M4 10h16M9 15l2 2 4-4"/>',salao:'<path d="M4 8c3 3 13 3 16 0-1 6-4 9-8 9s-7-3-8-9z"/><path d="M9 11h.01M15 11h.01"/>',
  virtudes:'<path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',corporacoes:'<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/>',
  calendario:'<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>',equipe:'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-4 3-6 6-6s6 2 6 6M15 14c3 0 6 2 6 5"/>',
  jogadores:'<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',convites:'<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 8l9 6 9-6"/>',
  cosmeticos:'<path d="M12 3l3 6 6 .9-4.5 4.3 1 6.3L12 17.5 6.5 20.5l1-6.3L3 9.9 9 9z"/>',poco:'<ellipse cx="12" cy="7" rx="8" ry="3"/><path d="M4 7v10c0 1.7 3.6 3 8 3s8-1.3 8-3V7"/>',
  casa:'<path d="M3 11l9-7 9 7v10H3z"/><path d="M10 21v-6h4v6"/>',anuncios:'<path d="M4 10v4l12 5V5L4 10z"/><path d="M16 9a3 3 0 0 1 0 6M4 14l2 6"/>',
  registro:'<path d="M5 3h11l3 3v15H5z"/><path d="M9 9h6M9 13h6M9 17h3"/>',ajustes:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
};
const mesaIco=k=>`<svg class="ms-ico" viewBox="0 0 24 24" aria-hidden="true">${MESA_ICO[k]}</svg>`;

function montaMesa(raiz){
  const st={cargo:['dealer','anfitriao','owner'].includes(q.get('cargo'))?q.get('cargo'):'owner',secao:null,caso:null,novo:false,aviso:null,recTipo:'',propor:false,
    casos:[
      {id:104,dif:{v:'5',n:'espadas'},titulo:'O Baile das Máscaras',arco:'Arco II · Salão',data:'sáb 08/11 · 20h',vagas:12,admissao:'aprovacao',tutorial:false,status:'convocado',grupo:true,meu:true,entries:[{n:'Velada',a:'pendente'},{n:'Matheus',a:'aceita'},{n:'Sol',a:'pendente'},{n:'Íris',a:'recusada'},{n:'Caio',a:'aceita'}]},
      {id:103,dif:{v:'A',n:'copas'},titulo:'Primeira Noite',arco:'Tutorial',data:'dom 02/11 · 21h',vagas:8,admissao:'livre',tutorial:true,status:'em-progresso',grupo:true,meu:false,entries:['Ana','Bento','Luz','Rafa','Teo'].map(n=>({n,a:'aceita'}))},
      {id:102,dif:{v:'7',n:'ouros'},titulo:'A Sala Sem Relógio',arco:'Arco I · Torres',data:'qui 30/10 · 20h',vagas:6,admissao:'aprovacao',tutorial:false,status:'concluido',grupo:true,meu:true,aplicado:false,entries:[{n:'Matheus',a:'aceita',d:'premio'},{n:'Velada',a:'aceita',d:'morreu'},{n:'Sol',a:'aceita',d:null},{n:'Nina',a:'aceita',d:null}]},
      {id:101,dif:{v:'3',n:'paus'},titulo:'Contagem Regressiva',arco:'Arco I',data:'sáb 25/10 · 20h',vagas:10,admissao:'livre',tutorial:false,status:'concluido',grupo:true,meu:false,aplicado:true,entries:['Matheus','Sol','Velada'].map(n=>({n,a:'aceita',d:'premio'}))},
      {id:100,dif:{v:'2',n:'espadas'},titulo:'Ensaio Geral',arco:'Arco I',data:'sex 17/10 · 20h',vagas:6,admissao:'livre',tutorial:false,status:'cancelado',grupo:false,meu:true,entries:[]},
    ],
    recs:[
      {id:1,tipo:'evento',para:'Matheus',rec:'+3 h de Tempo',origem:'Nº 102 · A Sala Sem Relógio',por:'Dealer Ravi',just:'Sobreviveu e salvou dois inscritos na última rodada.',st:'pendente',aprovar:true},
      {id:2,tipo:'externa',para:'Velada',rec:'1 Grande Fragmento Arcano',origem:'Arte do mapa do Arco II',por:'Anfitrião Dora',just:'Desenhou o mapa usado no caso.',st:'pendente',aprovar:true},
      {id:3,tipo:'semanal',para:'Sol',rec:'1 convite',origem:'Semana de 27/10 · Sala de Jogos',por:'Dealer Ravi',just:'1º lugar no ranking semanal.',st:'aprovada',aprovar:true},
      {id:4,tipo:'evento',para:'Nina',rec:'+1 h de Tempo',origem:'Nº 102 · A Sala Sem Relógio',por:'Você',just:'Ajudou a abrir o cofre.',st:'pendente',aprovar:false},
      {id:5,tipo:'evento',para:'Matheus',rec:'+2 h de Tempo',origem:'Nº 101 · Contagem Regressiva',por:'Dealer Ravi',just:'Sobreviveu.',st:'entregue',aprovar:true,quem:'Owner'},
      {id:6,tipo:'externa',para:'Caio',rec:'5 Dracmas',origem:'Divulgação',por:'Dealer Ravi',just:'Trouxe dois jogadores.',st:'rejeitada',aprovar:true,quem:'Anfitrião Dora'},
    ]};
  const secoes=()=>st.cargo==='owner'?Object.keys(MESA_SECOES):MESA_CARGO[st.cargo];
  const aprovador=()=>st.cargo!=='dealer';
  const todo=c=>({analise:c.entries.filter(e=>e.a==='pendente').length,decidir:c.status==='concluido'&&!c.aplicado&&c.entries.some(e=>e.a==='aceita')});
  const pend=()=>{
    const abertos=st.casos.filter(c=>c.status==='convocado'||c.status==='em-progresso').length;
    const analise=st.casos.reduce((n,c)=>n+todo(c).analise,0),decidir=st.casos.filter(c=>todo(c).decidir).length;
    const aprovar=st.recs.filter(r=>r.aprovar&&(r.st==='pendente'||r.st==='aprovada')).length,propostas=st.recs.filter(r=>!r.aprovar&&r.st==='pendente').length;
    return {abertos,analise,decidir,aprovar,propostas};
  };
  const conta=s=>{const p=pend();return s==='casos'?p.analise+p.decidir:s==='recompensas'?(aprovador()?p.aprovar:0):s==='salao'?3:s==='corporacoes'&&st.cargo!=='dealer'?1:0};
  const avisoHtml=()=>st.aviso?`<p class="ms-aviso" role="status">${st.aviso}</p>`:'';

  function topo(){
    const p=pend();
    const tiles=[['Casos abertos',p.abertos,'casos',false],['Inscrições em análise',p.analise,'casos',p.analise>0],['Resultados a aplicar',p.decidir,'casos',p.decidir>0],aprovador()?['Recompensas a aprovar',p.aprovar,'recompensas',p.aprovar>0]:['Propostas pendentes',p.propostas,'recompensas',false]];
    // o alto da Mesa é a própria mesa do Dealer, pintada; as pendências são fichas de jogo sobre o feltro
    return `<header class="ms-heroi">
        <div class="ms-heroi-tx"><small>Mesa da equipe</small><h3>${MESA_CARGO_NOME[st.cargo]}</h3><em>${MESA_CARGO_LINHA[st.cargo]}</em></div>
        <div class="ms-vercomo" role="group" aria-label="Ver como">${['dealer','anfitriao','owner'].map(c=>`<button data-cargo="${c}" aria-pressed="${st.cargo===c}">${MESA_CARGO_NOME[c]}</button>`).join('')}</div>
        <div class="ms-fichas">${tiles.map(([l,v,s,q],i)=>`<button data-ir="${s}" class="ms-moeda m${i}${q?' quente':''}" aria-label="${l}: ${v}"><span><b>${v}</b></span><small>${l}</small></button>`).join('')}</div>
      </header>
      ${st.cargo!=='dealer'?'<button class="ms-alerta" data-ir="casos"><b>2</b><span><strong>Novatos esperando</strong><small>Nenhum Deadly Vote tutorial com inscrições abertas.</small></span><svg class="seta" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>':''}`;
  }
  function inicio(){
    const meus=secoes();
    // as seções são cartas na mesa: uma fileira por grupo, viradas para cima
    return topo()+MESA_GRUPOS.map(([g,ss])=>{const vis=ss.filter(s=>meus.includes(s));if(!vis.length)return '';return `<section class="ms-grupo"><h4 class="sec"><span>${g}</span></h4><div class="ms-cartas">${vis.map(s=>{const c=conta(s);return `<button class="ms-carta" data-ir="${s}" title="${MESA_SECOES[s][1]}"><span class="ms-carta-face">${mesaIco(s)}</span><strong>${MESA_SECOES[s][0]}</strong><small>${MESA_SECOES[s][1]}</small>${c?`<i>${c}</i>`:''}</button>`}).join('')}</div></section>`}).join('');
  }
  const volta=(rot='Mesa')=>`<button class="ms-volta" data-volta><svg class="seta" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>${rot}</button>`;

  /* ---- Casos ---- */
  function casos(){
    return `<div class="ms-linha">${volta()}<button class="r-bt s-forte ms-novo" data-novo>Novo Deadly Vote</button></div>
      <div class="ms-titulo">${mesaIco('casos')}<div><h3>Casos</h3><small>Convoque, aceite os inscritos, conduza o caso e decida o destino de cada um antes de aplicar aos perfis.</small></div></div>
      ${avisoHtml()}
      <ul class="ms-casos">${st.casos.map(c=>{const t=todo(c),ac=c.entries.filter(e=>e.a==='aceita').length;return `<li><button class="ms-dossie st-${c.status}" data-caso="${c.id}">
        <b class="ms-aba">Nº ${c.id}</b>${c.dif?dvCarta(c.red?{v:'C',red:true}:c.dif,34,{cl:'ms-dv'}):''}
        <span class="ms-caso-tx"><small>${c.arco}</small><strong>${c.titulo}</strong><em>${c.data} · ${ac}/${c.vagas} vagas</em></span>
        <em class="ms-carimbo st-${c.status}">${MESA_ST[c.status][0]}</em>
        ${c.tutorial?'<i class="ms-lacre" title="Tutorial">T</i>':''}
        ${t.analise||t.decidir?`<span class="ms-todo">${t.analise?`<i>${t.analise} em análise</i>`:''}${t.decidir?'<i>Resultado a aplicar</i>':''}</span>`:''}
      </button></li>`}).join('')}</ul>`;
  }
  function caso(){
    const c=st.casos.find(x=>x.id===st.caso),t=todo(c),selado=c.status==='cancelado'||c.status==='falha';
    const passos=['convocado','em-progresso','concluido'],iAtual=passos.indexOf(c.status);
    const aceitos=c.entries.filter(e=>e.a==='aceita'),decididos=aceitos.filter(e=>e.d).length;
    return `<div class="ms-linha">${volta('Casos')}</div>
      <header class="ms-capa st-${c.status}"><b class="ms-aba">Nº ${c.id}</b><div><small>${c.arco}${c.tutorial?' · Tutorial':''}</small><h3>${c.titulo}</h3><em>${c.data} · ${c.admissao==='livre'?'Entrada livre':'Entrada com aprovação'} · ${aceitos.length}/${c.vagas} vagas</em></div><em class="ms-carimbo st-${c.status}">${MESA_ST[c.status][0]}</em></header>
      ${avisoHtml()}
      <section class="ms-cartao"><h5>Status</h5>
        <ol class="ms-passos">${passos.map((p,i)=>`<li><button data-status="${p}" class="${selado?'':i<iAtual?'feito':i===iAtual?'atual':''}"${selado||c.aplicado?' disabled':''}><i>${i+1}</i>${MESA_ST[p][0]}</button></li>`).join('')}</ol>
        <p class="ms-dica">${MESA_ST[c.status][1]}</p>
        ${!c.aplicado?`<div class="ms-desvios">${['cancelado','falha'].map(s=>`<button data-status="${s}" class="${c.status===s?'on':''}">${MESA_ST[s][0]}</button>`).join('')}</div>`:''}
      </section>
      ${c.dif?`<section class="ms-cartao dv-mesa"><h5>Dificuldade</h5>
        <div class="dv-linha">${dvCarta(c.red?{v:'C',red:true}:c.dif,88)}<div><strong>${c.red?'Red Coringa':dvNomeCarta(c.dif)}</strong>${c.red?`<small>Era ${dvNomeCarta(c.dif)} · mudou durante o caso</small><em class="ms-carimbo dv-carimbo">Red Coringa</em>`:`<small>${dvFaixa(c.dif).filter(Boolean).join(' · ')}</small>`}</div></div>
        ${c.status==='em-progresso'&&!c.red?'<button class="dv-red-bt" data-red>Revelar Red Coringa</button><p class="ms-dica">Muda a dificuldade para Coringa no meio do caso. Os inscritos aceitos recebem o aviso.</p>':''}
      </section>`:''}
      ${c.status==='concluido'&&aceitos.length?`<section class="ms-cartao"><h5>Resultado · ${decididos} de ${aceitos.length} decididos</h5>
        ${c.aplicado?'<p class="ms-ok">Aplicado aos perfis.</p>':''}
        <ul class="ms-dec">${aceitos.map(e=>`<li><span>${e.n}</span><div role="group" aria-label="Destino de ${e.n}">${Object.keys(MESA_DEC).map(d=>`<button data-dec="${d}" data-p="${e.n}" aria-pressed="${e.d===d}" title="${MESA_DEC[d][1]}"${c.aplicado?' disabled':''} class="d-${d}">${MESA_DEC[d][0]}</button>`).join('')}</div></li>`).join('')}</ul>
        ${!c.aplicado?`<button class="r-bt s-forte ms-aplicar" data-aplicar${decididos<aceitos.length?' disabled':''}>Aplicar aos perfis</button><p class="ms-dica">${decididos<aceitos.length?`Faltam ${aceitos.length-decididos} decisões.`:'Depois de aplicado, o resultado não tem desfazer.'}</p>`:''}
      </section>`:''}
      <section class="ms-cartao"><h5>Inscrições · ${c.entries.length}</h5>
        ${c.entries.length?`<ul class="ms-insc">${c.entries.map(e=>`<li class="a-${e.a}"><span class="ms-av">${e.n[0]}</span><span><strong>${e.n}</strong><small>${{pendente:'Em análise',aceita:'Aceita',recusada:'Recusada'}[e.a]}</small></span><div>${selado||c.aplicado?'':e.a==='pendente'?`<button class="sim" data-adm="aceita" data-p="${e.n}">Aceitar</button><button data-adm="recusada" data-p="${e.n}">Recusar</button>`:e.a==='aceita'?`<button data-adm="recusada" data-p="${e.n}">Recusar</button>`:`<button data-adm="pendente" data-p="${e.n}">Reconsiderar</button>`}</div></li>`).join('')}</ul>`:'<p class="ms-dica">Ninguém se inscreveu.</p>'}
      </section>
      <section class="ms-cartao ms-dados"><h5>Caso</h5>
        <dl><div><dt>Grupo do WhatsApp</dt><dd>${c.grupo?'Link registrado':'Sem link'}</dd></div><div><dt>Prêmios de entrada</dt><dd>+1 h de Tempo a cada aceito</dd></div><div><dt>Peso máximo de cartas</dt><dd>12</dd></div><div><dt>Local</dt><dd>Discord · sala 2</dd></div></dl>
        ${c.aplicado||selado?'':'<button class="r-bt ms-editar" data-novo>Editar caso</button>'}
      </section>`;
  }
  // seletor de dificuldade: naipe, valor (Ás a Dez, Figuras, Coringa) e a prévia com a faixa de recompensa
  function difHtml(){
    const d=st.dif||(st.dif={v:'5',n:'espadas'}),f=dvFaixa(d),coringa=d.v==='C';
    return `<section class="dv-sel"><span class="ms-campo"><span>Dificuldade</span></span>
      ${coringa?'':`<div class="dv-naipes" role="radiogroup" aria-label="Naipe">${Object.entries(DV_NAIPES).map(([k,t])=>`<button type="button" role="radio" aria-checked="${d.n===k}" data-dvn="${k}" aria-label="${t}"><img src="${dvImg(k)}" alt=""></button>`).join('')}</div>`}
      <div class="dv-tira" role="radiogroup" aria-label="Valor">${DV_VALORES.map(v=>`<button type="button" role="radio" aria-checked="${d.v===v}" data-dvv="${v}" aria-label="${DV_NOME[v]}">${dvCarta({v,n:d.n||'espadas'},56)}</button>`).join('')}</div>
      <div class="dv-previa">${dvCarta(d,120)}<div><strong>${dvNomeCarta(d)}</strong>${f.filter(Boolean).map(x=>`<b>${x}</b>`).join('')}<small>Referência da escala; o prêmio é definido em Recompensas.</small></div></div>
    </section>`;
  }
  function novo(){
    const campo=(r,ph,tipo='text')=>`<label class="ms-campo"><span>${r}</span><input type="${tipo}" placeholder="${ph}"></label>`;
    return `<div class="ms-linha">${volta('Casos')}</div>
      <div class="ms-titulo">${mesaIco('casos')}<div><h3>Novo Deadly Vote</h3><small>Convoca a edição. Os inscritos aparecem em Casos.</small></div></div>
      <form class="ms-form" onsubmit="return false">
        <div class="ms-seg" role="group" aria-label="Tipo"><button type="button" aria-pressed="true">Comum</button><button type="button" aria-pressed="false">Tutorial</button></div>
        ${difHtml()}
        ${campo('Título','O Baile das Máscaras')}${campo('Arco','Arco II · Salão')}
        <label class="ms-campo"><span>Briefing</span><textarea rows="3" placeholder="O que os inscritos precisam saber antes de entrar."></textarea></label>
        <div class="ms-2">${campo('Data e hora','','datetime-local')}${campo('Vagas','12','number')}</div>
        ${campo('Grupo do WhatsApp','https://chat.whatsapp.com/…')}${campo('Local','Discord · sala 2')}
        <div class="ms-2"><label class="ms-campo"><span>Admissão</span><select><option>Com aprovação</option><option>Livre</option></select></label>${campo('Peso máximo de cartas','12','number')}</div>
        <label class="ms-campo"><span>Desbloqueia ao vencer</span><input placeholder="Nenhum sistema"><small>Abre sistemas para os sobreviventes. Use com cuidado.</small></label>
        <button type="button" class="r-bt s-forte" data-criar>Convocar</button>
      </form>`;
  }

  /* ---- Recompensas ---- */
  function recompensas(){
    const vis=st.recs.filter(r=>!st.recTipo||r.tipo===st.recTipo);
    const grupos=aprovador()?[['A aprovar',vis.filter(r=>r.aprovar&&r.st==='pendente')],['A entregar',vis.filter(r=>r.aprovar&&r.st==='aprovada')],['Suas propostas',vis.filter(r=>!r.aprovar&&r.st==='pendente')],['Histórico',vis.filter(r=>['entregue','rejeitada','cancelada'].includes(r.st))]]:[['Suas propostas',vis.filter(r=>r.st==='pendente'||r.st==='aprovada')],['Histórico',vis.filter(r=>['entregue','rejeitada','cancelada'].includes(r.st))]];
    return `<div class="ms-linha">${volta()}<button class="r-bt s-forte ms-novo" data-propor>Propor recompensa</button></div>
      <div class="ms-titulo">${mesaIco('recompensas')}<div><h3>Recompensas</h3><small>${aprovador()?'Aprove, rejeite e entregue. Qualquer mudança numa proposta aprovada volta para aprovação.':'Proponha prêmios para os seus casos. Seu Anfitrião (ou um Owner) aprova e entrega.'}</small></div></div>
      ${avisoHtml()}
      ${st.propor?propor():''}
      <div class="ms-seg" role="group" aria-label="Tipo">${[['','Todas'],['evento','Evento'],['externa','Externa'],['semanal','Semanal']].map(([t,r])=>`<button data-rtipo="${t}" aria-pressed="${st.recTipo===t}">${r}</button>`).join('')}</div>
      ${grupos.map(([g,l])=>`<section class="ms-rgrupo"><h4 class="sec"><span>${g} · ${l.length}</span></h4>${l.length?l.map(ficha).join(''):'<p class="ms-dica">Nada aqui.</p>'}</section>`).join('')}`;
  }
  function ficha(r){
    const acoes=r.aprovar&&r.st==='pendente'&&aprovador()?`<button class="sim" data-rec="${r.id}" data-faz="aprovada">Aprovar</button><button data-rec="${r.id}" data-faz="rejeitada">Rejeitar</button>`:r.aprovar&&r.st==='aprovada'&&aprovador()?`<button class="sim" data-rec="${r.id}" data-faz="entregue">Entregar</button>`:!r.aprovar&&r.st==='pendente'?`<button data-rec="${r.id}" data-faz="cancelada">Cancelar</button>`:'';
    // cada recompensa é um vale destacável: o prêmio no canhoto, a justificativa no corpo
    return `<article class="ms-ficha ms-vale t-${r.tipo} s-${r.st}">
      <div class="ms-canhoto"><small>${{evento:'Evento',externa:'Externa',semanal:'Semanal'}[r.tipo]}</small><p class="ms-rec">${r.rec}</p></div>
      <div class="ms-vale-corpo">
      <header><span class="ms-av">${r.para[0]}</span><div><strong>${r.para}</strong><small>${r.origem}</small></div><em class="ms-chip s-${r.st}">${MESA_REC_ST[r.st]}</em></header>
      <p class="ms-just">“${r.just}”</p>
      <footer><small><b class="ms-tipo">${{evento:'Evento',externa:'Externa',semanal:'Semanal'}[r.tipo]}</b> · proposta por ${r.por}${r.quem?` · ${r.st==='rejeitada'?'rejeitada':'autorizada'} por ${r.quem}`:''}</small>${acoes?`<div>${acoes}</div>`:''}</footer>
      </div>
    </article>`;
  }
  function propor(){
    return `<form class="ms-form ms-cartao" onsubmit="return false"><h5>Nova proposta</h5>
      <div class="ms-seg" role="group" aria-label="Tipo"><button type="button" aria-pressed="true">Evento</button><button type="button" aria-pressed="false">Externa</button><button type="button" aria-pressed="false">Semanal</button></div>
      <div class="ms-2"><label class="ms-campo"><span>Caso</span><select><option>Nº 102 · A Sala Sem Relógio</option><option>Nº 104 · O Baile das Máscaras</option></select></label><label class="ms-campo"><span>Para</span><select><option>Matheus</option><option>Sol</option><option>Nina</option></select></label></div>
      <div class="ms-2"><label class="ms-campo"><span>Recurso</span><select><option>Tempo</option><option>Convite</option><option>Item</option><option>Fragmentos Arcanos</option></select></label><label class="ms-campo"><span>Quantidade</span><input type="number" value="60"><small>minutos</small></label></div>
      <label class="ms-campo"><span>Justificativa</span><textarea rows="2" placeholder="Por que esta pessoa merece."></textarea></label>
      <div class="ms-2"><button type="button" class="r-bt s-forte" data-enviar>Enviar para aprovação</button><button type="button" class="r-bt" data-fecha-propor>Cancelar</button></div>
    </form>`;
  }

  /* ---- demais seções: o que fazem hoje ---- */
  function outra(s){
    return `<div class="ms-linha">${volta()}</div>
      <div class="ms-titulo">${mesaIco(s)}<div><h3>${MESA_SECOES[s][0]}</h3><small>${MESA_SECOES[s][1]}</small></div></div>
      <ul class="ms-funcoes">${(MESA_FUNCOES[s]||[]).map(f=>`<li><span>${f}</span><svg class="seta" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></li>`).join('')}</ul>
      <p class="ms-dica">Tudo o que esta seção faz hoje continua. A tela dela, neste visual, vem numa próxima rodada.</p>`;
  }

  function pinta(){
    const s=st.secao;
    const md=s==='jogadores'&&typeof mdJogadores==='function'?mdJogadores(st,{volta,cargoNome:()=>MESA_CARGO_NOME[st.cargo]}):null;
    raiz.innerHTML=!s?inicio():s==='casos'?(st.novo?novo():st.caso?caso():casos()):s==='recompensas'?recompensas():md?md.html():outra(s);
    raiz.closest('.corpo').scrollTop=0;
    const on=(sel,fn)=>raiz.querySelectorAll(sel).forEach(b=>b.onclick=()=>{fn(b);pinta()});
    on('[data-cargo]',b=>{st.cargo=b.dataset.cargo});
    on('[data-ir]',b=>{st.secao=b.dataset.ir;st.caso=null;st.novo=false;st.aviso=null});
    on('[data-volta]',()=>{st.aviso=null;if(st.md&&st.md.sel&&st.secao==='jogadores'){st.md.sel=null;st.md.aviso=null}else if(st.novo)st.novo=false;else if(st.caso)st.caso=null;else st.secao=null});
    if(md)md.liga(raiz,pinta);
    on('[data-caso]',b=>{st.caso=+b.dataset.caso});
    on('[data-novo]',()=>{st.novo=true});
    on('[data-criar]',()=>{st.novo=false;st.caso=null;st.aviso='Deadly Vote convocado. Os inscritos aparecem aqui.'});
    on('[data-dvn]',b=>{st.dif.n=b.dataset.dvn});
    on('[data-dvv]',b=>{st.dif.v=b.dataset.dvv;if(b.dataset.dvv!=='C'&&!st.dif.n)st.dif.n='espadas'});
    raiz.querySelectorAll('[data-red]').forEach(b=>b.onclick=()=>redCoringa(c()));
    const c=()=>st.casos.find(x=>x.id===st.caso);
    on('[data-status]',b=>{c().status=b.dataset.status;st.aviso=`Status: ${MESA_ST[b.dataset.status][0]}.`});
    on('[data-adm]',b=>{c().entries.find(e=>e.n===b.dataset.p).a=b.dataset.adm;st.aviso=null});
    on('[data-dec]',b=>{c().entries.find(e=>e.n===b.dataset.p).d=b.dataset.dec});
    on('[data-aplicar]',()=>{c().aplicado=true;st.aviso='Resultado aplicado aos perfis. Os prêmios seguem para Recompensas.'});
    on('[data-rtipo]',b=>{st.recTipo=b.dataset.rtipo});
    on('[data-propor]',()=>{st.propor=true});
    on('[data-fecha-propor]',()=>{st.propor=false});
    on('[data-enviar]',()=>{st.propor=false;st.aviso='Proposta enviada para aprovação.'});
    on('[data-rec]',b=>{const r=st.recs.find(x=>x.id===+b.dataset.rec);r.st=b.dataset.faz;r.quem=r.st==='cancelada'?null:MESA_CARGO_NOME[st.cargo];st.aviso=`Recompensa ${MESA_REC_ST[r.st].toLowerCase()}.`});
  }
  // revelar o Red Coringa: folha de baixo, segurar 1,5 s para confirmar (não tem desfazer)
  function redCoringa(caso){
    const n=caso.entries.filter(e=>e.a==='aceita').length,jan=raiz.closest('.jan'),corpo=raiz.closest('.corpo');
    const w=document.createElement('div');w.className='dv-folha';w.style.top=corpo.offsetTop+'px';
    w.innerHTML=`<div class="dv-folha-in" role="dialog" aria-modal="true" aria-labelledby="dv-f-t">${dvCarta({},120,{verso:true})}<h3 id="dv-f-t">Revelar Red Coringa</h3>
      <p>${caso.titulo} deixa de ser ${dvNomeCarta(caso.dif)} e passa a ser Coringa. ${n===1?'O inscrito aceito recebe':`Os ${n} inscritos aceitos recebem`} o aviso agora. Não tem desfazer.</p>
      <button class="dv-segura" data-segura><i></i><span>Segure para revelar</span></button><button class="r-bt" data-fecha>Voltar</button></div>`;
    jan.append(w);w.querySelector('[data-fecha]').focus();w.querySelector('[data-fecha]').onclick=()=>w.remove();
    const b=w.querySelector('[data-segura]');let t=null;
    const solta=()=>{clearTimeout(t);b.classList.remove('enchendo')};
    const aperta=e=>{e.preventDefault();b.classList.add('enchendo');t=setTimeout(()=>{caso.red=true;st.aviso=`Red Coringa revelado. ${n===1?'O inscrito aceito recebeu':`Os ${n} inscritos aceitos receberam`} o aviso.`;w.remove();pinta()},1500)};
    b.addEventListener('pointerdown',aperta);['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,solta));
    b.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!e.repeat)aperta(e)});b.addEventListener('keyup',solta);
  }
  pinta();
}
