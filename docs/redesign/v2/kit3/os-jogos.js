// Sala de Jogos dentro do sistema. Nomes, regras, pontos e falas são os do jogo (lib/devo/arcade/*, components/devo/arcade/*);
// jogadores, placares e apostas são exemplos, e tudo roda no aparelho. No jogo quem decide é o servidor (/api/arcade).
// As quatro partidas por dentro vêm em etapas próprias: aqui a partida é simulada para mostrar o caminho até o resultado.
const J_BET=[5,15,30,60,120,240],J_RES=30,J_MIN_SEMANA=5;
const J_CAPA={'memory-rush':'capa-memory',chess:'capa-chess','hot-bomb':'capa-bomb',bluff:'capa-blefe'};
const J_STATUS={UPCOMING:'Em breve',REGISTRATION:'Inscrições abertas',LOCKED:'Apostas abertas',LIVE:'Ao vivo',FINISHED:'Encerrada'};
const J_REGRA_CASUAL='Pontos de ranking = 20% do placar (até 250) + 40 por vitória, 20 por empate ou 10 por derrota.';
const J_REGRA_EVENTO='Em evento, pontos de ranking = placar + bônus do evento.';
const J_DIAS=['SEG','TER','QUA','QUI','SEX','SÁB','DOM'];
const jArte=a=>`art/os/jogos/${a}.png`;
const jPts=n=>n.toLocaleString('pt-BR');
const jMin=min=>{const a=Math.abs(min),h=Math.floor(a/60),m=a%60;return `${min<0?'-':''}${h?`${h}h`:''}${m||!h?`${String(m).padStart(h?2:1,'0')}min`:''}`};
const jOdds=o=>`${o.toFixed(2).replace('.',',')}×`;
const jNo=n=>String(n).padStart(3,'0');
const jRomano=n=>ROMANOS[n-1];
const jMono=(nome,cls='')=>`<i class="j-mono ${cls}" aria-hidden="true">${saEsc([...nome][0]||'?')}</i>`;
const jDuracao=g=>`~${Math.max(1,Math.round(g.durationSec/60))} min`;
const jPatente=p=>{let i=0;while(i+1<PATENTES.length&&p>=PATENTES[i+1].min)i++;return i};
function jRecompensa(r){if(r===1)return {virtue:3,arcane:2,cards:1,hours:12};if(r===2)return {virtue:2,arcane:1,hours:8};if(r===3)return {virtue:1,arcane:1,hours:5};if(r<=10)return {virtue:1,hours:2};if(r<=50)return {hours:1};return null}
function jPartes(r){const o=[];if(r.score)o.push(`${r.score} de score`);if(r.virtue)o.push(`${r.virtue} Ponto${r.virtue>1?'s':''} de Virtude`);if(r.arcane)o.push(`${r.arcane} Fragmento${r.arcane>1?'s':''} de Arcano`);if(r.cards)o.push(`${r.cards} Carta${r.cards>1?'s':''}`);if(r.hours)o.push(`+${r.hours}h de Tempo`);return o}
const jHora=ms=>new Date(ms).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',timeZone:SA_TZ});
const jRotulo=ms=>`${new Date(ms).toLocaleDateString('pt-BR',{weekday:'short',timeZone:SA_TZ}).replace('.','').toUpperCase()} · ${jHora(ms)}`;
const jDiaK=ms=>new Date(ms).toLocaleDateString('en-CA',{timeZone:SA_TZ});
function jSemana(now=Date.now()){const O=-3*36e5,l=new Date(now+O),b=(l.getUTCDay()+6)%7;return Date.UTC(l.getUTCFullYear(),l.getUTCMonth(),l.getUTCDate()-b)-O}
function jStatus(e,now=Date.now()){return now<e.abre?'UPCOMING':now<e.fecha?'REGISTRATION':now<e.ini?'LOCKED':now<e.fim?'LIVE':'FINISHED'}
const jCurto=ms=>{if(ms<=0)return 'agora';const s=Math.floor(ms/1000),d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60);return d>0?`${d}d ${h}h`:h>0?`${h}h ${String(m).padStart(2,'0')}m`:`${m}m ${String(s%60).padStart(2,'0')}s`};
const jCrono=ms=>{const s=Math.max(0,Math.floor(ms/1000));return [Math.floor(s/3600),Math.floor(s%3600/60),s%60].map(x=>String(x).padStart(2,'0')).join(':')};
let J_DADOS=null;
function jDados(){
  if(J_DADOS)return J_DADOS;
  const now=Date.now(),sem=jSemana(now),D_=864e5,H=36e5;
  // a agenda da casa: 20:00 de segunda a sábado; domingo, o evento especial às 19:00
  const grade=[['memory-rush',{score:400}],['chess',{score:500}],['hot-bomb',{score:450}],['memory-rush',{score:400}],['chess',{score:500}],['hot-bomb',{score:450}],['memory-rush',{score:900},'Evento especial','Pontuação em dobro. Só um sobrevive ao topo.']];
  const E=(i,g,r,ini,x={})=>({id:'ev'+i,number:i,gameId:g,reward:r,ini,abre:ini-D_,fecha:ini-30*6e4,fim:ini+60*6e4,max:8,entries:5,joined:false,label:null,rules:null,duels:[],...x});
  const eventos=grade.map(([g,r,label,rules],i)=>{const ini=sem+i*D_+(i===6?19:20)*H;return E(101+i,g,r,ini,{label:label||null,rules:rules||null,max:i===6?12:8,fim:ini+(i===6?90:60)*6e4,entries:i===6?9:6})});
  // para a tela mostrar todos os estados no protótipo: a partida de hoje fecha as inscrições agora e abre as apostas, e há outra com inscrição aberta
  const hoje=eventos.find(e=>jDiaK(e.ini)===jDiaK(now));
  if(hoje){hoje.ini=now+20*6e4;hoje.fecha=now-6e4;hoje.abre=now-D_;hoje.fim=hoje.ini+90*6e4}
  eventos.push(E(108,'chess',{score:500},now+3*H,{entries:5}));
  eventos.push(E(109,'bluff',{score:600},now+5*H,{entries:2,fecha:now+4*H,abre:now-H}));
  eventos.sort((a,b)=>a.ini-b.ini);
  const lado=(name,pct,wins,bettors)=>({name,pct,wins,bettors,isMe:false,odds:Math.max(1.05,Math.round(.92/(pct/100)*100)/100)});
  const duelo=(id,slot,a,b)=>({id,slot,sides:[a,b],myBet:null,winner:null});
  if(hoje)hoje.duels=[duelo('d1',0,lado('Corvo',62,12,9),lado('Ísis',38,9,5)),duelo('d2',1,lado('Nyx',46,7,3),lado('Lírio',54,8,4)),duelo('d3',2,lado('Matheus',31,5,2),lado('Velada',69,6,6))];
  const jog=(name,score,wins,games)=>({name,score,wins,games,isMe:false,pg:J_ORDEM_G.reduce((o,g,i)=>(o[g]=Math.round(score*[.4,.3,.2,.1][(i+name.length)%4]),o),{})});
  const me={name:'Você',score:420,wins:3,games:3,isMe:true,pg:{'memory-rush':260,chess:120,'hot-bomb':40,bluff:0},best:{'memory-rush':1450,chess:900,'hot-bomb':400,bluff:0},bestWeek:{'memory-rush':820,chess:260,'hot-bomb':90,bluff:0}};
  J_DADOS={semana:sem,reseta:sem+7*D_,eventos,me,inscritos:['Corvo','Ísis','Nyx','Lírio','Matheus','Velada','Fosca'],
    jogadores:[jog('Corvo',1840,14,17),jog('Ísis',1510,11,15),jog('Nyx',1205,8,12),jog('Lírio',980,7,11),jog('Matheus',760,5,9),jog('Velada',615,4,8),me,jog('Fosca',205,1,5)],
    claim:{rank:7},
    recentes:[{r:'win',g:'memory-rush',o:'Nyx',s:1450},{r:'loss',g:'chess',o:'Corvo',s:300},{r:'win',g:'memory-rush',o:'Fosca',s:980},{r:'win',g:'hot-bomb',o:'Lírio',s:400}],
    bilhetes:[{rot:'Bomba Quente · duelo 1',pick:'Ísis',v:15,st:'won',pay:27},{rot:'Living Chess · duelo 2',pick:'Nyx',v:30,st:'lost',pay:0}],
    registro:[['Corvo','alguém viu o placar do Corvo? isso não é humano'],['Ísis','apostei tudo no azarão. de novo.'],['Nyx','o relógio do xadrez devia ser crime'],['Lírio','essa bomba explodiu na MINHA mão no 0.1'],['Velada','o Javali tá observando...'],['Matheus','apostei 2 horas do meu Tempo. sem arrependimentos.']],
    meus:0};
  return J_DADOS;
}
const J_ORDEM_G=['memory-rush','chess','hot-bomb','bluff'];
function jBoard(D){return [...D.jogadores].sort((a,b)=>b.score-a.score).map((p,i)=>({...p,rank:i+1,ref:p}))}
function montaJogos(raiz){
  let g={viu:false};try{Object.assign(g,JSON.parse(localStorage.getItem('devo-jogos')))}catch{}
  const grava=()=>{try{localStorage.setItem('devo-jogos',JSON.stringify(g))}catch{}};
  const D=jDados(),jan=()=>raiz.closest('.jan'),$r=s=>raiz.querySelector(s);
  let aba=q.get('jogosaba')||'mesa',rankV='geral',nota='',valor=15,ocupado=false,abertos={},tid=0,assinatura='';
  const linha=JAVALI_LINHAS[new Date().getDate()%JAVALI_LINHAS.length];
  const meRank=()=>jBoard(D).find(r=>r.isMe).rank;
  const eventosAtivos=()=>D.eventos.filter(e=>jStatus(e)!=='FINISHED');
  const evDo=g2=>D.eventos.find(e=>e.gameId===g2&&jStatus(e)!=='FINISHED');
  const proximo=()=>D.eventos.find(e=>jStatus(e)==='LIVE')||eventosAtivos()[0]||null;
  const duelosAbertos=()=>D.eventos.filter(e=>['LOCKED','LIVE'].includes(jStatus(e))).flatMap(e=>e.duels.filter(d=>!d.winner).map(d=>({d,e})));
  const cab=(t,s,mais)=>`<header class="s-cab j-cab"><div><h4>${t}</h4>${s?`<small>${s}</small>`:''}</div>${mais||''}</header>`;
  const link=(t,v)=>`<button class="r-link j-mais" data-ver="${v}">${t} ›</button>`;
  const seloEv=(e)=>{const st=jStatus(e);if(st==='LIVE')return '<span class="s-sel lid j-ao">Ao vivo</span>';if(e.joined&&st==='REGISTRATION')return '<span class="s-sel lid">Inscrito</span>';if(st==='REGISTRATION')return '<span class="s-sel lid">Inscrições abertas</span>';if(st==='LOCKED')return '<span class="s-sel ava">Apostas abertas</span>';if(st==='FINISHED')return '<span class="s-sel seu">Encerrada</span>';return '<span class="s-sel seu">Em breve</span>'};
  const acaoEv=e=>{const st=jStatus(e);return st==='LIVE'&&e.joined?['Jogar agora','join']:st==='REGISTRATION'&&!e.joined?['Inscrever-se','reg']:st==='REGISTRATION'&&e.joined?['Inscrito','done']:['Jogar online','fila']};
  /* ---- o palco e as placas de status ---- */
  function palco(){
    const r=meRank(),nr=D.me;
    return `<div class="s-palco j-palco"><div class="s-vista"><img class="s-cen" src="${jArte('sala')}" alt="A Sala de Jogos: uma mesa de cartas sob os lampiões e um relógio enorme na parede">
      <button class="k-mel chanfro s-her" id="j-jav" aria-label="Rever a apresentação do Javali"><img src="art/os/npc/javali-rosto.png" alt=""><span>Javali</span></button></div><i class="s-dit" aria-hidden="true"></i>
      <dl class="j-placas"><div><dt>Pontos</dt><dd class="${nr.score>0?'on':''}">${jPts(nr.score)}</dd></div><div><dt>Posição</dt><dd>#${r}</dd></div><div class="l"><dt>Ranking zera</dt><dd data-ate="${D.reseta}" data-fmt="crono"></dd></div></dl></div>`;
  }
  /* ---- Mesa ---- */
  function heroi(e){
    if(!e)return `<section class="j-hero fundo" aria-label="Próxima partida"><div class="j-h-c"><p class="j-k">Próxima partida</p><p>Nenhuma partida programada nesta semana. A mesa descansa — por enquanto.</p>${link('Ver agenda','agenda')}</div></section>`;
    const G=GAMES[e.gameId],st=jStatus(e),[t,k]=acaoEv(e),pr=jPartes(e.reward),pct=Math.round(e.entries/e.max*100);
    return `<section class="j-hero fundo" aria-label="Próxima partida"><div class="j-h-img"><img src="${jArte(J_CAPA[e.gameId])}" alt=""><div>${seloEv(e)}<small>Nº ${jNo(e.number)}</small></div></div><div class="j-h-c">
      <div class="s-lin"><p class="j-k">${st==='LIVE'?'Acontecendo agora':'Próxima partida'}</p>${link('Agenda','agenda')}</div><h3>${e.label||G.name}</h3><p class="j-sub"><b>${jRotulo(e.ini)}</b> ${G.tagline}</p>
      <div class="j-h-pr">${st==='LIVE'?'<p class="j-vivo">Ao vivo</p>':`<div><small>Começa em</small><b class="j-rel" data-ate="${e.ini}" data-fmt="crono"></b></div>`}<dl><dt>Prêmio</dt><dd>${pr.length?pr.join(' · '):'Pontos de ranking'}</dd></dl></div>
      <div class="j-vagas"><small>Jogadores</small><b>${e.entries}<u>/${e.max}</u></b><i role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Vagas preenchidas"><s style="width:${pct}%"></s></i></div>
      <button class="r-bt chanfro s-forte s-larga j-gr" data-ev="${e.id}" data-k="${k}" ${k==='done'||ocupado?'disabled':''}>${k==='done'?'✓ ':''}${t}</button></div></section>`;
  }
  function cartaJogo(gid,i){
    const G=GAMES[gid],e=evDo(gid),st=e&&jStatus(e);
    const est=!e?['Nenhum evento esta semana','']:st==='LIVE'?['Ao vivo','on']:e.joined?['Inscrito','on']:st==='REGISTRATION'?['Inscrições abertas','on']:st==='LOCKED'?['Inscrições encerradas','']:['Inscrições ainda fechadas',''];
    return `<li class="j-jogo fundo"><div class="j-capa"><img src="${jArte(J_CAPA[gid])}" alt=""><i>${jRomano(i+1)}</i></div><div class="j-j-c"><h5>${G.name}</h5>
      <dl class="j-2"><div><dt>Jogadores</dt><dd>${G.players}</dd></div><div><dt>Duração</dt><dd>${jDuracao(G)}</dd></div></dl>
      <div class="j-j-b"><small>Próximo evento</small>${e?`<b>${jRotulo(e.ini)}</b>`:''}<em class="${est[1]}">${est[0]}</em></div>
      <div class="j-j-b"><small>Partida livre</small><em>Melhor: ${jPts(D.me.best[gid]||0)}</em></div>
      <button class="r-bt chanfro s-forte s-larga" data-joga="${gid}" ${ocupado?'disabled':''}>Jogar</button><button class="r-bt chanfro s-larga" data-treino="${gid}" ${ocupado?'disabled':''}>Tutorial</button><button class="r-link" data-regras="${gid}">Regras</button></div></li>`;
  }
  function vs(d,grande,fechado){
    const trava=!!d.myBet||!!d.winner||fechado;
    return `<div class="j-vs ${grande?'g':''}">${d.sides.map((s,i)=>{const ganhou=d.winner===s.name;return `<button class="j-l ${i?'b':'a'} ${d.winner&&!ganhou?'perdeu':''}" data-dq="${d.id}" data-lado="${saEsc(s.name)}" ${s.isMe||trava?'disabled':''} aria-label="${s.isMe?`${s.name} (você)`:`Apostar em ${s.name}, odd ${s.odds.toFixed(2)}`}">${jMono(s.name)}<strong>${s.isMe?`${s.name} (você)`:s.name}</strong><b>${jOdds(s.odds)}</b><small>${s.wins} vitórias</small>${!trava&&!s.isMe?'<em>Apostar ›</em>':''}${ganhou?'<em>Venceu</em>':''}</button>`}).join('')}<i class="j-x" aria-hidden="true"><span>VS</span></i></div>`;
  }
  const barra=(d,fino)=>`<div class="j-odds ${fino?'f':''}" aria-hidden="true"><s style="width:${d.sides[0].pct}%"></s></div><p class="j-odds-t"><span>${d.sides[0].pct}%</span><span>${d.sides[1].pct}%</span></p>`;
  function destaque(){
    const it=duelosAbertos()[0];
    if(!it)return `<section class="fundo j-bloco" aria-label="Confronto em destaque">${cab('Confronto em destaque','Apostas em Tempo')}<p class="r-sub">Nenhum confronto aberto para apostas. Quando uma partida fechar as inscrições, os duelos aparecem aqui.</p>${link('Apostas','apostas')}</section>`;
    const {d,e}=it,tot=d.sides[0].bettors+d.sides[1].bettors;
    return `<section class="fundo j-bloco" aria-label="Confronto em destaque">${cab('Confronto em destaque',`${GAMES[e.gameId].name} · Nº ${jNo(e.number)}`,jStatus(e)==='LIVE'?'<span class="s-sel lid j-ao">Ao vivo</span>':'')}${vs(d,true)}${barra(d)}<p class="r-sub">${tot} ${tot===1?'apostador':'apostadores'} · toque num lado para apostar</p>${d.myBet?`<div class="j-bilhete"><small>Seu bilhete</small><p><b>${jMin(d.myBet.v)}</b> em ${saEsc(d.myBet.pick)} · odd ${jOdds(d.myBet.odds)}</p></div>`:''}</section>`;
  }
  function podio(rows){
    if(!rows.length)return '<p class="r-sub">Ninguém pontuou nesta semana ainda.</p>';
    const ord=[rows[1],rows[0],rows[2]].filter(Boolean);
    return `<ol class="j-podio" aria-label="Pódio">${ord.map(r=>`<li class="p${r.rank}"><button class="j-nome" data-perfil="${saEsc(r.name)}">${jMono(r.name,r.isMe?'eu':'')}<span class="${r.isMe?'eu':''}">${r.isMe?'Você':saEsc(r.name)}</span></button><b>${jPts(r.points)}</b>${r.sub?`<small>${r.sub}</small>`:''}<i aria-hidden="true">${jRomano(r.rank)}</i></li>`).join('')}</ol>`;
  }
  function lista(rows,me){
    const it=r=>`<li class="${r.isMe?'eu':''}"><span class="n">${r.rank||'—'}</span><button class="j-nome" data-perfil="${saEsc(r.name)}">${jMono(r.name,r.isMe?'eu':'')}<span><strong>${saEsc(r.name)}${r.isMe&&r.name!=='Você'?' (você)':''}</strong>${r.sub?`<small>${r.sub}</small>`:''}</span></button><b>${jPts(r.points)}</b></li>`;
    if(!rows.length&&!me)return '';
    return `<ol class="j-lista">${rows.map(it).join('')}${me?`<li class="j-sep" aria-hidden="true"></li>${it(me)}`:''}</ol>`;
  }
  function pMesa(){
    const abertos2=duelosAbertos().slice(1,4),b=jBoard(D),top=b.slice(0,8),meF=meRank()>8;
    const linhas=top.map(r=>({rank:r.rank,name:r.name,isMe:r.isMe,points:r.score}));
    return `${nota?`<p class="s-ok fundo" role="status">${nota}</p>`:''}<p class="j-fala"><img src="art/os/npc/javali-rosto.png" alt=""><span><small>Javali · anfitrião</small>“${linha}”</span></p>${heroi(proximo())}
      ${D.claim?`<section class="j-claim fundo" aria-label="Recompensa da semana"><div><p class="j-k">Recompensa da semana</p><p>Você terminou a semana passada em <b>#${D.claim.rank}</b>. Há uma recompensa esperando.</p></div><button class="r-bt chanfro s-forte" id="j-claim">Resgatar</button></section>`:''}
      ${cab('Jogos da semana','Partida livre · evento · treino')}<ul class="j-jogos" aria-label="Jogos da semana">${J_ORDEM_G.map(cartaJogo).join('')}</ul>
      ${destaque()}
      <section class="fundo j-bloco" aria-label="Ranking da semana">${cab('Ranking da semana','Reinicia toda segunda',link('Completo','ranking'))}${podio(linhas.slice(0,3))}${lista(linhas.slice(3),meF?{rank:meRank(),name:D.me.name,isMe:true,points:D.me.score}:null)}</section>
      ${abertos2.length?`<section class="fundo j-bloco" aria-label="Apostas em andamento">${cab('Apostas em andamento','Livro aberto',link('Todas','apostas'))}<ul class="j-duelos">${abertos2.map(({d,e})=>`<li><small>${GAMES[e.gameId].name} · duelo ${d.slot+1}</small>${vs(d)}${barra(d,true)}</li>`).join('')}</ul></section>`:''}
      <section class="fundo j-bloco" aria-label="Suas últimas partidas">${cab('Suas últimas partidas','Histórico')}${D.recentes.length?`<ul class="j-rec">${D.recentes.slice(0,6).map(r=>`<li><em class="${r.r}">${r.r==='win'?'Vitória':r.r==='draw'?'Empate':'Derrota'}</em><span>${GAMES[r.g].name} <small>vs ${saEsc(r.o)}</small></span><b>${r.treino?'treino':jPts(r.s)}</b></li>`).join('')}</ul>`:'<p class="r-sub">Nenhuma partida ainda. A mesa está esperando.</p>'}</section>
      <section class="fundo j-bloco" aria-label="Registro das partidas">${cab('Registro das partidas','Falas das salas')}<ul class="j-chat">${D.registro.map(([a,t])=>`<li><button class="j-nome" data-perfil="${saEsc(a)}">${saEsc(a)}</button><p>${saEsc(t)}</p></li>`).join('')}</ul><p class="r-sub">O chat abre dentro de cada partida. Aqui fica o registro do que foi dito nas salas.</p></section>`;
  }
  /* ---- Agenda ---- */
  function eventoAg(e,grande){
    const st=jStatus(e),aberto=abertos[e.id],now=Date.now();
    const ins=e.inscritos||D.inscritos.slice(0,Math.min(e.entries,D.inscritos.length));
    return `<div class="j-ev fundo ${st==='LIVE'||grande?'real':''}"><div class="j-ev-t"><img src="${jArte(J_CAPA[e.gameId])}" alt=""><div><p class="j-ev-h"><b>${jHora(e.ini)}</b><small>Nº ${jNo(e.number)}</small></p><strong>${e.label||GAMES[e.gameId].name}</strong><p class="r-sub">${e.entries}/${e.max} jogadores · ${J_STATUS[st]}${st==='UPCOMING'?` · inscrições em ${jCurto(e.abre-now)}`:''}${st==='REGISTRATION'?` · fecha em ${jCurto(e.fecha-now)}`:''}${st==='LOCKED'?` · começa em ${jCurto(e.ini-now)}`:''}</p></div>${st==='UPCOMING'?`<img class="j-cad" src="${px('cadeado')}" alt="Bloqueado">`:''}</div>
      <div class="j-ev-b">${st==='REGISTRATION'?(e.joined?'<span class="s-sel lid">Inscrito</span>':`<button class="r-bt chanfro s-forte" data-reg="${e.id}">Inscrever</button>`):''}${st==='LIVE'&&e.joined?`<button class="r-bt chanfro s-forte" data-duelo="${e.id}">Jogar agora</button>`:''}<button class="r-link j-det" aria-expanded="${!!aberto}" data-det="${e.id}">Detalhes</button></div>
      ${aberto?`<div class="j-ev-d"><div><small>Regras</small><p>${e.rules||GAMES[e.gameId].tagline}</p></div><div><small>Participantes</small><ul>${ins.length?ins.map(n=>`<li><span>${saEsc(n)}</span><em>inscrito</em></li>`).join(''):'<li>Ninguém ainda.</li>'}</ul></div></div>`:''}</div>`;
  }
  function pAgenda(){
    const now=Date.now(),hojeK=jDiaK(now);
    const dias=J_DIAS.map((l,i)=>{const ms=D.semana+i*864e5+12*36e5,k=jDiaK(ms);return {l,k,data:new Date(ms).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',timeZone:SA_TZ}),evs:D.eventos.filter(e=>jDiaK(e.ini)===k)}});
    const hoje=dias.find(d=>d.k===hojeK),f=hoje&&(hoje.evs.find(e=>jStatus(e)!=='FINISHED')||hoje.evs[0])||eventosAtivos()[0]||null;
    const isHoje=f&&jDiaK(f.ini)===hojeK,prox=eventosAtivos().find(e=>e!==f);
    const pri=!f?'':jStatus(f)==='LIVE'&&f.joined?'Jogar agora':jStatus(f)==='REGISTRATION'&&!f.joined?'Inscrever-se':jStatus(f)==='REGISTRATION'&&f.joined?'Inscrito':'Entrar na fila';
    const topo=Math.max(0,...D.eventos.map(e=>e.reward.hours||0)),wd=ms=>new Date(ms).toLocaleDateString('pt-BR',{weekday:'long',timeZone:SA_TZ});
    return `${nota?`<p class="s-ok fundo" role="status">${nota}</p>`:''}${f?`<section class="j-hoje fundo" aria-label="${isHoje?'Hoje':'Próximo'}"><img src="${jArte(J_CAPA[f.gameId])}" alt=""><div><p class="j-k">${isHoje?`Hoje · ${wd(now)}`:`Próximo · ${wd(f.ini)}`}</p>${seloEv(f)}<h3>${f.label||GAMES[f.gameId].name}</h3><b class="j-rel">${jHora(f.ini)}</b><p>${f.rules||GAMES[f.gameId].description}</p>
        <div class="j-premio"><small>Prêmio da semana · para o 1º do ranking</small><b>+${String(jRecompensa(1).hours).padStart(2,'0')}:00:00</b></div><div class="s-duo"><button class="r-bt chanfro s-forte" id="j-ag-p" ${pri==='Inscrito'||ocupado?'disabled':''}>${pri==='Inscrito'?'✓ ':''}${pri}</button><button class="r-bt chanfro" id="j-ag-r">Ver ranking</button></div></div></section>`:'<div class="s-vazio fundo"><p>Nenhuma partida programada nesta semana.</p></div>'}
      ${prox?`<div class="j-prox fundo"><div><small>Próxima partida</small><p>Nº ${jNo(prox.number)} · ${prox.label||GAMES[prox.gameId].name} · ${prox.entries}/${prox.max}</p></div>${jStatus(prox)==='LIVE'?'<span class="s-sel lid j-ao">Ao vivo</span>':`<b data-ate="${prox.ini}" data-fmt="curto"></b>`}</div>`:''}
      ${cab('Semana','Calendário da semana')}<ol class="j-semana" aria-label="Semana">${dias.map((d,i)=>{const past=d.k<hojeK,agora=d.k===hojeK;return `<li class="${past?'pass':''} ${agora?'hoje':''}" ${agora?'aria-current="date"':''}><span class="j-d">${d.l}<small>${jRomano(i+1)}</small></span><div><p class="j-d-t">${d.data}${agora?' <b>Hoje</b>':''}${d.evs.length?'':' · Folga'}</p>${d.evs.map(e=>eventoAg(e,topo>0&&(e.reward.hours||0)===topo)).join('')}</div></li>`}).join('')}</ol>
      <p class="j-fala j-fala2"><img src="art/os/npc/javali-rosto.png" alt=""><span><small>Javali</small>Aqui ninguém aposta dinheiro. Aposta-se Tempo. Muito mais divertido.</span></p>`;
  }
  /* ---- Ranking ---- */
  function pRanking(){
    const ops=[['geral','Geral'],...J_ORDEM_G.map(x=>[x,GAMES[x].name])],b=jBoard(D),eleg=D.me.games>=J_MIN_SEMANA,rk=meRank();
    let corpo;
    if(rankV==='geral'){
      const subG=r=>`${r.wins} vitórias · ${PATENTES[jPatente(r.score)].name}`;
      corpo=`<section class="fundo j-bloco" aria-label="Semana do ranking"><div class="s-lin"><div><p class="j-k">Semana ${new Date(D.semana).toISOString().slice(0,10)}</p><p class="r-sub">Reinicia toda segunda. Os três primeiros levam Tempo.</p></div><div class="j-zera"><small>Ranking zera em</small><b data-ate="${D.reseta}" data-fmt="crono"></b></div></div></section>
        ${podio(b.slice(0,3).map(r=>({rank:r.rank,name:r.name,isMe:r.isMe,points:r.score,sub:`${r.wins} vitórias`})))}${lista(b.slice(3,10).map(r=>({rank:r.rank,name:r.name,isMe:r.isMe,points:r.score,sub:subG(r)})),rk>10?{rank:rk,name:D.me.name,isMe:true,points:D.me.score,sub:`${D.me.wins} vitórias`}:null)}`;
    }else{
      const rows=D.jogadores.map(p=>({name:p.name,isMe:p.isMe,points:p.pg[rankV]||0})).filter(r=>r.points>0).sort((x,y)=>y.points-x.points).map((r,i)=>({...r,rank:i+1,sub:PATENTES[jPatente(r.points)].name}));
      const pts=D.me.pg[rankV]||0,idx=jPatente(pts),cur=PATENTES[idx],nx=PATENTES[idx+1],pct=nx?Math.round((pts-cur.min)/(nx.min-cur.min)*100):100,meu=rows.find(r=>r.isMe),perm=PATENTES[jPatente(D.me.bestWeek[rankV]||0)];
      corpo=`<section class="fundo j-bloco j-pat" aria-label="Sua patente"><div class="s-lin"><p class="j-k">Sua patente · ${GAMES[rankV].name}</p><small>${jPts(pts)} pts${meu?` · #${meu.rank}`:''}</small></div><h3>${cur.name}</h3><p class="r-sub">${nx?`faltam ${jPts(nx.min-pts)} pts para ${nx.name}`:'Patente máxima'}</p><div class="j-odds um" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Progresso da patente"><s style="width:${pct}%"></s></div>
        <ol class="j-pats" aria-label="Patentes">${PATENTES.map((p,i)=>`<li class="${i===idx?'on':i<idx?'foi':''}" ${i===idx?'aria-current="step"':''} title="${p.name}">${jRomano(i+1)}<span class="m-so">${p.name}</span></li>`).join('')}</ol><p class="r-sub">Maior título: <b>${(D.me.bestWeek[rankV]||0)>0?perm.name:'—'}</b>${nx?` · próxima: ${nx.name}`:''}</p></section>
        ${rows.length?`${podio(rows.slice(0,3))}${lista(rows.slice(3,10),meu&&meu.rank>10?meu:null)}`:`<p class="r-sub">Ninguém pontuou em ${GAMES[rankV].name} nesta semana. A mesa está esperando.</p>`}`;
    }
    return `<div class="i-filtros j-filtros" role="group" aria-label="Ranking por jogo">${ops.map(([id,n])=>`<button class="chanfro" data-rv="${id}" aria-pressed="${rankV===id}" aria-checked="${rankV===id}">${n}</button>`).join('')}</div>${corpo}
      <section class="j-papel" aria-label="Regulamento da casa"><small>Regulamento da casa · prêmios</small><ol>${[1,2,3].map(r=>`<li><i>${jRomano(r)}</i><b>+${jRecompensa(r).hours}h</b><small>de Tempo</small></li>`).join('')}</ol>
        <p><strong>Prêmios:</strong> top 3 do ranking geral, entregues no reset, em Tempo.</p><p><strong>Para concorrer:</strong> mínimo de ${J_MIN_SEMANA} partidas online na semana (você: ${D.me.games}/${J_MIN_SEMANA}).${eleg?'':''}</p><div class="j-pips" aria-hidden="true">${Array.from({length:J_MIN_SEMANA},(_,i)=>`<u class="${i<D.me.games?'on':''}"></u>`).join('')}</div><p><strong>Título permanente:</strong> a patente zera toda semana, mas o maior título alcançado fica no seu perfil.</p></section>`;
  }
  /* ---- Apostas ---- */
  function pApostas(){
    const rest=segPulso*1000,restMin=Math.floor(segPulso/60),abertos2=D.eventos.filter(e=>e.duels.length>0),fechados=D.eventos.filter(e=>!e.duels.length&&jStatus(e)==='FINISHED');
    const pode=abertos2.some(e=>['LOCKED','LIVE'].includes(jStatus(e))&&e.duels.some(d=>!d.winner&&!d.myBet));
    return `${nota?`<p class="s-ok fundo" role="status">${nota}</p>`:''}<section class="fundo j-bloco" aria-label="Seu Tempo"><p class="j-k">Livro de apostas · a moeda é Tempo</p><div class="j-tempo"><img src="${px('pulso')}" alt=""><div><small>Seu Tempo</small><b class="${critico?'crit':''}" id="j-tp">${jCrono(rest)}</b></div></div><p class="r-sub">Ganhou, o prêmio volta ao relógio multiplicado pela odd. Perdeu, o valor some do seu pulso.</p>
        <small class="j-rot">Apostar</small><div class="j-valores" role="radiogroup" aria-label="Apostar" aria-describedby="j-mot">${J_BET.map(v=>`<button class="chanfro" role="radio" aria-checked="${valor===v}" data-v="${v}" ${!pode||restMin-v<J_RES?'disabled':''}>${jMin(v)}</button>`).join('')}</div>
        <p class="r-sub" id="j-mot">${pode?'Escolha o valor e toque num lado do confronto.':'Sem confronto aberto agora — o valor fica guardado para a próxima.'}</p><p class="j-aviso"><u aria-hidden="true">!</u>Você sempre precisa manter ao menos ${J_RES}min no relógio.</p></section>
      ${abertos2.length?'':'<div class="s-vazio fundo"><p>Nenhum confronto aberto para apostas agora. Volte quando uma partida fechar as inscrições.</p></div>'}
      ${abertos2.map(ev=>`<section aria-label="${GAMES[ev.gameId].name}">${cab(ev.label||GAMES[ev.gameId].name,`Nº ${jNo(ev.number)} · ${J_STATUS[jStatus(ev)]}`,jStatus(ev)==='LIVE'?'<span class="s-sel lid j-ao">Ao vivo</span>':'')}<ul class="j-duelos">${ev.duels.map(d=>`<li><small>Duelo ${d.slot+1}</small>${vs(d,false,jStatus(ev)==='FINISHED')}${barra(d,true)}${d.myBet?`<p class="r-sub">Você apostou <b>${jMin(d.myBet.v)}</b> em ${saEsc(d.myBet.pick)} · aguardando</p>`:''}</li>`).join('')}</ul></section>`).join('')}
      ${fechados.length?`<section aria-label="Partidas encerradas">${cab('Livros fechados')}<ul class="j-fech">${fechados.map(ev=>`<li><img src="${px('cadeado')}" alt=""><span>${GAMES[ev.gameId].name} <small>Nº ${jNo(ev.number)}</small></span><i class="s-sel seu">Encerrada</i></li>`).join('')}</ul></section>`:''}
      <section class="j-papel" aria-label="Suas apostas"><small>Suas apostas · bilhetes</small>${D.bilhetes.length?`<ul class="j-bils">${D.bilhetes.map(h=>`<li><span>${saEsc(h.rot)} · ${saEsc(h.pick)}</span><b>${jMin(h.v)}</b><em class="${h.st}">${h.st==='won'?`+${jMin(h.pay)}`:h.st==='lost'?'perdeu':'aberta'}</em></li>`).join('')}</ul>`:'<p>Nenhum bilhete ainda. A casa está de olho.</p>'}</section>`;
  }
  function painel(){return aba==='mesa'?pMesa():aba==='agenda'?pAgenda():aba==='ranking'?pRanking():pApostas()}
  function tudo(){
    const c=raiz.closest('.corpo'),y=c?c.scrollTop:0;
    raiz.innerHTML=`<div class="s-grade"><div class="s-esq">${palco()}</div><div class="s-dir"><div class="r-abas" role="tablist" aria-label="Seções da Sala de Jogos">${[['mesa','Mesa'],['agenda','Agenda'],['ranking','Ranking'],['apostas','Apostas']].map(([id,n])=>`<button class="chanfro" role="tab" data-a="${id}" aria-selected="${aba===id}">${n}</button>`).join('')}</div><div class="s-painel" role="tabpanel">${painel()}</div></div></div>`;
    if(c)c.scrollTop=y;nota='';tique();liga();assinatura=D.eventos.map(jStatus).join();
  }
  function tique(){
    const now=Date.now();
    raiz.querySelectorAll('[data-ate]').forEach(e=>{const ms=+e.dataset.ate-now;e.textContent=e.dataset.fmt==='curto'?jCurto(ms):jCrono(ms)});
    const tp=$r('#j-tp');if(tp)tp.textContent=jCrono(segPulso*1000);
  }
  function irAba(v){aba=v;tudo();const c=raiz.closest('.corpo'),t=$r('.r-abas');if(c&&t&&c.scrollTop>t.offsetTop&&!pc())c.scrollTop=t.offsetTop}
  function liga(){
    const tod=(s,f)=>raiz.querySelectorAll(s).forEach(b=>b.onclick=()=>f(b));
    const ev=id=>D.eventos.find(e=>e.id===id);
    $r('#j-jav').onclick=()=>javali();
    tod('[data-a]',b=>irAba(b.dataset.a));tod('[data-ver]',b=>irAba(b.dataset.ver));
    tod('[data-joga]',b=>fila(b.dataset.joga,'casual'));tod('[data-treino]',b=>entra(b.dataset.treino,'treino'));tod('[data-regras]',b=>regras(b.dataset.regras));
    tod('[data-perfil]',b=>perfil(b.dataset.perfil));
    const inscreve=e=>{e.joined=true;e.entries=Math.min(e.max,e.entries+1);e.inscritos=[...(e.inscritos||D.inscritos.slice(0,e.entries-1)),'Você'];nota=`Inscrição feita em ${e.label||GAMES[e.gameId].name}.`;tudo()};
    tod('[data-ev]',b=>{const e=ev(b.dataset.ev),k=b.dataset.k;if(k==='join')fila(e.gameId,'evento',e);else if(k==='reg')inscreve(e);else if(k==='fila')fila(e.gameId,'casual')});
    tod('[data-reg]',b=>inscreve(ev(b.dataset.reg)));tod('[data-duelo]',b=>{const e=ev(b.dataset.duelo);fila(e.gameId,'evento',e)});
    tod('[data-det]',b=>{abertos[b.dataset.det]=!abertos[b.dataset.det];tudo()});
    tod('[data-rv]',b=>{rankV=b.dataset.rv;tudo()});
    tod('[data-v]',b=>{valor=+b.dataset.v;tudo()});
    tod('[data-dq]',b=>{const it=D.eventos.flatMap(e=>e.duels).find(d=>d.id===b.dataset.dq);folhaAposta(it,b.dataset.lado)});
    const c=$r('#j-claim');if(c)c.onclick=()=>{const r=jRecompensa(D.claim.rank);if(r.hours)mudaPulso(r.hours*3600);nota=`Recompensa resgatada: ${jPartes(r).join(' · ')}.`;D.claim=null;tudo()};
    const ap=$r('#j-ag-p');if(ap)ap.onclick=()=>{const hk=jDiaK(Date.now()),f=D.eventos.find(e=>jDiaK(e.ini)===hk&&jStatus(e)!=='FINISHED')||eventosAtivos()[0],st=jStatus(f);if(st==='LIVE'&&f.joined)fila(f.gameId,'evento',f);else if(st==='REGISTRATION'&&!f.joined)inscreve(f);else fila(f.gameId,'casual')};
    const ar=$r('#j-ag-r');if(ar)ar.onclick=()=>{const hk=jDiaK(Date.now()),f=D.eventos.find(e=>jDiaK(e.ini)===hk&&jStatus(e)!=='FINISHED')||eventosAtivos()[0];rankV=f.gameId;irAba('ranking')};
  }
  /* ---- regras e miniperfil ---- */
  function regras(gid){
    const G=GAMES[gid];
    saFolha(jan(),'Sala de Jogos',G.name,`<div class="s-corpo"><img class="j-f-capa" src="${jArte(J_CAPA[gid])}" alt=""><p>${G.tagline}</p><p class="r-sub">${G.description}</p><h4>Regras</h4><ul class="j-itens">${G.rules.map(t=>`<li>${t}</li>`).join('')}</ul><h4>Pontos</h4><ul class="j-itens">${G.scoring.map(t=>`<li>${t}</li>`).join('')}</ul></div>`);
  }
  function perfil(nome){
    const b=jBoard(D),r=b.find(x=>x.name===nome),eu=r&&r.isMe;
    const borda=!r?'Padrão':r.rank===1?'Ouro':r.rank<=3?'Prata':r.rank<=10?'Azul':'Padrão',sub=!r?'':r.rank===1?'#1 da semana':r.rank<=3?'Top 3':r.rank<=10?'Top 10':'';
    const mp=r?J_ORDEM_G.map(x=>[x,r.pg[x]||0]).sort((x,y)=>y[1]-x[1])[0]:null;
    saFolha(jan(),'Perfil do jogador',eu?'Você':saEsc(nome),`<div class="s-corpo"><div class="j-perfil">${jMono(nome,'g'+(eu?' eu':''))}<div><small>Participante</small><strong>${eu?'Você':saEsc(nome)}</strong><small>ID.Record D7-${[...nome].map(c=>c.charCodeAt(0).toString(16)).join('').slice(0,4).toUpperCase().padEnd(4,'0')}-${nome.length}</small></div></div>
      <dl class="j-p-dados"><div><dt>Ranking</dt><dd>${r?`#${String(r.rank).padStart(2,'0')}`:'—'}<small>${r?`/${b.length}`:''}</small></dd></div><div><dt>Pontos</dt><dd>${r?jPts(r.score):'—'}<small>na semana</small></dd></div><div><dt>Vitórias</dt><dd>${r?String(r.wins).padStart(2,'0'):'—'}<small>${r?`${r.games} partidas`:''}</small></dd></div><div><dt>Deadly Votes</dt><dd>0${(nome.length%6)+1}<small>S ${nome.length%4+1} · E ${nome.length%3}</small></dd></div><div><dt>Borda</dt><dd class="p">${borda}<small>${sub}</small></dd></div><div><dt>Melhor jogo</dt><dd class="p">${mp&&mp[1]?GAMES[mp[0]].name:'—'}<small>${mp&&mp[1]?`${mp[1]} pts`:''}</small></dd></div></dl>
      <h4>Vitrine</h4><p class="r-sub">Nada equipado ainda.</p></div>`);
  }
  /* ---- aposta ---- */
  function folhaAposta(d,pick){
    const af=v=>Math.floor(segPulso/60)-v>=J_RES;let am=af(valor)?valor:J_BET.find(af)||J_BET[0],sel=pick;
    const o=saFolha(jan(),`Livro da casa · duelo ${d.slot+1}`,'Apostar Tempo','<div class="s-corpo" id="j-f"></div>'),c=o.querySelector('#j-f');
    function pinta(er=''){
      const s=d.sides.find(x=>x.name===sel),pay=Math.round(am*s.odds);
      c.innerHTML=`<p class="r-sub">${poGen('Escolha o lado e quanto do seu relógio está dispost{o|a} a arriscar.')}</p>
        <div class="j-lados" role="radiogroup" aria-label="Lado">${d.sides.map(x=>`<button class="chanfro" role="radio" aria-checked="${x===s}" data-s="${saEsc(x.name)}" ${x.isMe?'disabled':''}>${jMono(x.name)}<strong>${saEsc(x.name)}</strong><b>${jOdds(x.odds)}</b></button>`).join('')}</div>
        <small class="j-rot">Quanto do seu Tempo</small><div class="j-valores" role="radiogroup" aria-label="Valor">${J_BET.map(v=>`<button class="chanfro" role="radio" aria-checked="${am===v}" data-v="${v}" ${af(v)?'':'disabled'}>${jMin(v)}</button>`).join('')}</div>
        <dl class="j-p-dados d2"><div><dt>Seu Tempo agora</dt><dd>${jCrono(segPulso*1000)}</dd></div><div><dt>Depois da aposta</dt><dd>${jCrono(Math.max(0,segPulso-am*60)*1000)}</dd></div><div><dt>Se ${saEsc(s.name)} vencer</dt><dd class="ganha">+${jMin(pay)}</dd></div><div><dt>Se perder</dt><dd class="perde">−${jMin(am)}</dd></div></dl>
        <p class="j-aviso"><u aria-hidden="true">!</u>O Tempo apostado sai do seu pulso na hora. Se ${saEsc(s.name)} perder, ele some. Se ganhar, volta multiplicado pela odd. Você precisa manter ao menos ${J_RES}min.</p>${er?`<p class="r-erro" role="alert">${er}</p>`:''}
        <button class="r-bt chanfro j-perigo s-larga" id="j-conf">Confirmar ${jMin(am)}</button><button class="r-link" id="j-canc">Cancelar</button>`;
      c.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{sel=b.dataset.s;pinta()});
      c.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{am=+b.dataset.v;pinta()});
      c.querySelector('#j-canc').onclick=()=>o.remove();
      c.querySelector('#j-conf').onclick=()=>{
        if(!af(am))return pinta(`Você precisa manter ao menos ${J_RES}min no relógio.`);
        mudaPulso(-am*60);d.myBet={pick:s.name,v:am,odds:s.odds,st:'open',pay:0};s.bettors++;
        const ev=D.eventos.find(e=>e.duels.includes(d));
        D.bilhetes.unshift({rot:`${GAMES[ev.gameId].name} · duelo ${d.slot+1}`,pick:s.name,v:am,st:'open',pay:0});
        o.remove();nota=`Bilhete feito: ${jMin(am)} em ${s.name}.`;tudo();
      };
    }
    pinta();
  }
  /* ---- fila: procurando oponente ---- */
  function fila(gid,modo,ev){
    if(ocupado)return;
    const j=jan(),o=document.createElement('div'),G=GAMES[gid],duelo=modo==='evento',ini=Date.now(),rapido=parado||q.has('semraf');
    o.className='j-fila';o.setAttribute('role','status');o.setAttribute('aria-live','polite');
    o.innerHTML=`<canvas width="120" height="120" aria-hidden="true"></canvas><p class="j-k">${G.name}</p><strong>${duelo?'Aguardando seu adversário':'Procurando oponente'}</strong><b id="j-fc">00:00</b><p class="r-sub">${duelo?'A partida começa assim que o outro jogador da chave entrar.':'Você será pareado com outro jogador real que estiver na fila.'}</p><button class="r-bt chanfro s-larga" id="j-cf">Cancelar</button>`;
    j.append(o);ocupado=true;
    const cv=o.querySelector('canvas'),x=cv.getContext('2d');
    const cor=getComputedStyle(document.documentElement);const c1=cor.getPropertyValue('--barra2').trim(),c2=cor.getPropertyValue('--dest').trim(),c3=cor.getPropertyValue('--rel').trim();
    let a=0,raf=0,tt;
    const anel=(r,c)=>{x.fillStyle=c;for(let t=0;t<360;t+=2){const ra=t*Math.PI/180;x.fillRect(Math.round(60+Math.cos(ra)*r),Math.round(60+Math.sin(ra)*r),1,1)}};
    function desenha(){
      x.clearRect(0,0,120,120);anel(58,c3);anel(40,c1);anel(22,c1);
      for(let i=0;i<12;i++){const ra=i*Math.PI/6,l=i%3?3:6;x.fillStyle=c3;for(let k=0;k<l;k++)x.fillRect(Math.round(60+Math.cos(ra)*(57-k)),Math.round(60+Math.sin(ra)*(57-k)),1,1)}
      for(let k=0;k<26;k+=2){const ra=(a-k*2.2)*Math.PI/180;x.globalAlpha=1-k/26;x.fillStyle=c2;for(let r=0;r<57;r++)x.fillRect(Math.round(60+Math.cos(ra)*r),Math.round(60+Math.sin(ra)*r),1,1)}
      x.globalAlpha=1;
    }
    const roda=()=>{if(!o.isConnected)return;a=(a+3)%360;desenha();raf=requestAnimationFrame(roda)};
    desenha();if(!rapido)raf=requestAnimationFrame(roda);
    const seg=setInterval(()=>{const s=Math.floor((Date.now()-ini)/1000);o.querySelector('#j-fc').textContent=`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`},1000);
    const fim=()=>{clearInterval(seg);clearTimeout(tt);cancelAnimationFrame(raf);o.remove();ocupado=false};
    o.querySelector('#j-cf').onclick=()=>{fim();tudo()};
    if(!q.has('semraf'))tt=setTimeout(()=>{fim();entra(gid,modo,ev)},3200);
  }
  /* ---- entrar: faixa de troca de fase e a partida simulada ---- */
  function entra(gid,modo,ev){
    const j=jan(),treino=modo==='treino',outros=D.jogadores.filter(p=>!p.isMe),op=treino?'Javali':(ev?outros[0].name:outros[Math.floor(Math.random()*outros.length)].name);
    const seg=()=>{
      if(gid==='memory-rush'){
        jogaMemory(j,{oponente:op,treino,aoSair:tudo,aoFim:f=>resultado(gid,modo,op,f.result,ev,f)});
        return;
      }
      if(gid==='hot-bomb'){
        jogaBomba(j,{oponente:op,treino,aoSair:tudo,aoFim:f=>resultado(gid,modo,op,f.result,ev,f)});
        return;
      }
      if(gid==='bluff'){
        jogaBlefe(j,{oponente:op,treino,aoSair:tudo,aoFim:f=>resultado(gid,modo,op,f.result,ev,f)});
        return;
      }
      if(gid==='chess'){
        // A cena 3D pesa 1,2 MB: só baixa quando alguém entra na partida.
        const abre=()=>jogaChess3D(j,{oponente:op,treino,aoSair:tudo,aoFim:f=>resultado(gid,modo,op,f.result,ev,f)});
        if(window.jogaChess3D)return abre();
        const css=document.createElement('link');css.rel='stylesheet';css.href='os-xadrez-3d.css';document.head.append(css);
        const sc=document.createElement('script');sc.src='os-xadrez-3d.js';sc.onload=abre;document.head.append(sc);
        return;
      }
      const o=document.createElement('div');o.className='j-partida';o.setAttribute('role','dialog');o.setAttribute('aria-label',`${GAMES[gid].name}: partida simulada`);
      o.innerHTML=`<img src="${jArte(J_CAPA[gid])}" alt=""><p class="j-k">${GAMES[gid].name} · vs ${saEsc(op)}</p><strong>O jogo por dentro vem na próxima etapa</strong><p class="r-sub">Por enquanto, escolha como esta partida termina para ver o caminho até o resultado.</p><div class="j-sim"><button class="r-bt chanfro" data-r="win">Vitória</button><button class="r-bt chanfro" data-r="draw">Empate</button><button class="r-bt chanfro" data-r="loss">Derrota</button></div><button class="r-link" id="j-sai">Sair da partida</button>`;
      j.append(o);
      o.querySelector('#j-sai').onclick=()=>{o.remove();tudo()};
      o.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{o.remove();resultado(gid,modo,op,b.dataset.r,ev)});
    };
    if(parado||q.has('semraf'))return seg();
    const c=document.createElement('div');c.className='j-cortina'+(treino?' t':'');c.innerHTML=`<span>${treino?'Treinando':'Valendo Tempo'}</span>`;j.append(c);
    setTimeout(()=>{seg();c.classList.add('sai');setTimeout(()=>c.remove(),300)},750);
  }
  function resultado(gid,modo,op,res,ev,real){
    const G=GAMES[gid],treino=modo==='treino',win=res==='win',draw=res==='draw',loss=res==='loss',custa=loss&&!treino;
    const score=real?real.score:Math.round(G.maxScore*(win?.42:draw?.28:.18)),opp=real?real.oppScore:Math.round(G.maxScore*(win?.25:draw?.28:.38));
    const pts=treino?0:modo==='evento'?score:Math.min(250,Math.round(score*.2))+(win?40:draw?20:10),ganho=treino?0:win?3:draw?1:0;
    if(!treino){const m=D.me;m.score+=pts;m.games++;if(win)m.wins++;m.pg[gid]=(m.pg[gid]||0)+pts;m.bestWeek[gid]=Math.max(m.bestWeek[gid]||0,m.pg[gid]);m.best[gid]=Math.max(m.best[gid]||0,score);if(ganho)mudaPulso(ganho*60)}
    D.recentes.unshift({r:res,g:gid,o:op,s:score,treino});
    const fala=treino?poGen('Treino é por conta da casa. A próxima, querid{o|a}, vale Tempo.'):win?'A casa agradece o espetáculo.':custa?'O relógio cobra. A casa só observa.':'Empate não paga a casa. Tente de novo.';
    const o=document.createElement('div');o.className=`j-res ${win?'win':custa?'custa':''}`;o.setAttribute('role','dialog');o.setAttribute('aria-label',`Resultado: ${win?'Vitória':draw?'Empate':'Derrota'}`);
    o.innerHTML=`<i class="j-faixa" aria-hidden="true"></i><p class="j-k">${G.name} · vs ${saEsc(op)}</p><h2>${win?'Vitória':draw?'Empate':'Derrota'}</h2>${treino?'<p class="j-carimbo">Treino · sem custo · sem ranking · sem Tempo</p>':''}
      <dl class="j-placar"><div>${jMono('Você','eu')}<dt>Seu placar</dt><dd>${jPts(score)}</dd></div><span aria-hidden="true">×</span><div class="d">${treino||/javali/i.test(op)?'<img src="art/os/npc/javali-rosto.png" alt="">':jMono(op)}<dt>Placar do oponente</dt><dd>${jPts(opp)}</dd></div></dl>
      <section class="fundo j-bloco"><dl class="j-p-dados d2"><div><dt>Pontos de ranking</dt><dd>${treino?'—':`+${jPts(pts)}`}${treino?'<small>não conta no treino</small>':''}</dd></div><div><dt>Tempo ganho</dt><dd class="ganha">${treino?'—':`+${jMin(ganho)}`}${treino?'<small>treino é de graça</small>':''}</dd></div><div><dt>Pontos na semana</dt><dd>${jPts(D.me.score)}</dd></div><div><dt>Posição</dt><dd>#${meRank()}</dd></div></dl><p class="r-sub">${treino?'Treino contra o bot não vale ranking nem Tempo.':modo==='evento'?J_REGRA_EVENTO:J_REGRA_CASUAL}</p></section>
      <p class="j-fala"><img src="art/os/npc/javali-rosto.png" alt=""><span><small>Javali</small>${fala}</span></p><button class="r-bt chanfro s-forte s-larga" id="j-volta">Voltar à mesa</button>`;
    jan().append(o);o.querySelector('#j-volta').onclick=()=>{o.remove();tudo()};o.querySelector('#j-volta').focus({preventScroll:true});
  }
  /* ---- o Javali apresenta a sala, com o texto do jogo ---- */
  function javali(passo=0){
    const j=jan();if(j.querySelector('.s-apres'))return;
    const rapido=parado||q.has('semraf');
    const o=document.createElement('div');o.className='s-apres j-apres';o.setAttribute('role','dialog');o.setAttribute('aria-label','Javali apresenta a Sala de Jogos');
    o.innerHTML=`<div class="s-ap-vista"><img class="s-ap-fundo" src="${jArte('mesa')}" alt=""><img class="j-ap-fig" alt="Javali, anfitrião da Sala de Jogos"><img class="s-ap-fundo j-ap-frente" src="${jArte('mesa-frente')}" alt=""><div class="s-ap-foco"><p class="j-ap-tempo"><img src="${px('pulso')}" alt=""><span><small>Seu Tempo</small><b id="j-ap-t"></b></span></p><div id="j-ap-cue"></div></div><button class="k-pula chanfro j-ap-pula">Pular</button></div>
      <div class="p-caixa s-ap-caixa"><b>Javali <small>Anfitrião</small></b><p aria-live="polite"></p><span class="s-ap-n"></span><span class="j-ap-seg"></span></div>`;
    j.append(o);
    const $o=s=>o.querySelector(s);let n=passo,itv,txt='',k=0,tp;
    const SEC=[['jogos','Mesa'],['agenda','Agenda'],['ranking','Ranking'],['apostas','Apostas'],['chat','Chat']];
    const cue=v=>{
      if(!v||v==='tempo')return '';
      if(v==='jogos')return `<ul class="j-cue">${J_ORDEM_G.map(x=>`<li>${GAMES[x].name}</li>`).join('')}</ul>`;
      if(v==='tutorial')return '<ul class="j-cue"><li class="on">Tutorial · treino grátis</li></ul>';
      if(v==='ranking')return `<ul class="j-cue">${PATENTES.map((p,i)=>`<li class="${i===PATENTES.length-1?'on':''}">${p.name}</li>`).join('')}</ul>`;
      return `<ul class="j-cue">${SEC.map(([a,t])=>`<li class="${a===v?'on':''}">${t}</li>`).join('')}</ul>`;
    };
    const tempo=()=>{const e=$o('#j-ap-t');if(e)e.textContent=jCrono(segPulso*1000)};
    const acaba=()=>{clearInterval(itv);$o('.p-caixa p').textContent=txt;k=txt.length;$o('.j-ap-seg').hidden=false};
    const fim=()=>{clearInterval(itv);clearInterval(tp);o.remove();g.viu=true;grava()};
    function fala(){
      const f=JAVALI_FALAS[n];txt=poGen(f.text);k=0;$o('.j-ap-fig').src=`art/os/npc/javali-${f.frame}.png`;$o('#j-ap-cue').innerHTML=cue(f.visual);
      $o('.s-ap-n').textContent=`A casa recebe · ${n+1}/${JAVALI_FALAS.length}`;$o('.j-ap-seg').textContent=n===JAVALI_FALAS.length-1?'Puxar a cadeira':'Continuar';$o('.j-ap-seg').hidden=true;
      clearInterval(itv);if(rapido)return acaba();
      $o('.p-caixa p').textContent='';
      itv=setInterval(()=>{$o('.p-caixa p').textContent=txt.slice(0,++k);if(k>=txt.length)acaba()},24);
    }
    o.addEventListener('click',e=>{
      if(e.target.closest('.j-ap-pula'))return fim();
      if(k<txt.length)return acaba();
      n++;if(n>=JAVALI_FALAS.length)return fim();
      fala();
    });
    tempo();if(!rapido)tp=setInterval(tempo,1000);
    fala();
  }
  addEventListener('devo-pulso',tique);
  tudo();
  if(!q.has('semraf'))tid=setInterval(()=>{
    if(!raiz.isConnected)return clearInterval(tid);
    if(D.eventos.map(jStatus).join()!==assinatura&&!jan().querySelector('.s-folha'))tudo();else tique();
  },1000);
  if((!g.viu&&!q.has('semraf'))||q.has('javali'))javali(+q.get('javalipasso')||0);
  const ver=q.get('jogosver');
  if(ver==='aposta'){const it=duelosAbertos()[0];if(it)folhaAposta(it.d,it.d.sides[0].name)}
  if(ver==='fila')fila('memory-rush','casual');
  if(ver==='regras')regras('bluff');
  if(ver==='perfil')perfil('Corvo');
  if(ver==='partida')entra(q.get('jogo')||'chess',q.get('modo')||'casual');
  if(ver==='vitoria')resultado('memory-rush','casual','Nyx','win');
  if(ver==='derrota')resultado('chess','casual','Corvo','loss');
  if(ver==='treino')resultado('bluff','treino','Javali','win');
}
