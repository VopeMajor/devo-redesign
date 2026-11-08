// Simon, o Carteiro: a primeira visita da casa. Texto literal do Rup (docs/redesign/v2/NOTAS-RUP-02-11.md, itens 6 e 7).
// Offscreen do Rup: Simon é sempre o primeiro NPC a visitar; enquanto ele não for atendido, ninguém mais aparece.
// Marcadores: g('o','a') resolve o gênero pela aparência do avatar; "X" é a coordenada da casa (sistema da dona, pendente).
// palco (dono, 06/11, "Rosto na caixa"): com o mapa da Casa por trás, o retrato grande sai; o chibi do Simon fica na
// porta e fala no cenário, e a caixa mostra só o rostinho da pose. Sem palco, a cena volta ao retrato grande.
function visitaSimon({aoFim,palco=null}={}){
  const ap=(typeof aparenciaSalva==='function'&&aparenciaSalva())||{};
  const masc=!!ap.corpo,g=(m,f)=>masc?m:f;
  const COORD='X',ARTE_V='202611030500';
  const F=(quem,texto,extra={})=>({quem,texto,...extra});
  const N=t=>F('narra',t),S=(t,pose='sorriso')=>F('Simon',t,{pose}),J=t=>F('Jogador',t),SIS=t=>F('Sistema',t);
  // cada nó: lista de falas e, no fim, escolha ou próximo nó
  const NOS={
    inicio:{falas:[N('[Som de campainha]'),N('[Tem alguém na porta.]'),J('Eu devo ir?'),
      SIS('Sempre que sua campainha tocar ou você ouvir alguém batendo à porta, significa que há alguém esperando do lado de fora. Essa pessoa pode ser um NPC amigável, hostil ou simplesmente alguém em busca de informações. As possibilidades são praticamente infinitas, mas atender ou não é uma decisão inteiramente sua — e que deve ser tomada com cautela.')],
      escolha:[['[Ignorar]','ignorar'],['[Abrir a porta]','abrir']]},
    ignorar:{falas:[N('[Depois de alguma insistência, a figura desconhecida parece ter ido embora.]')],fim:'ignorou'},
    abrir:{falas:[N('[Você se aproxima da porta e olha pelo olho mágico. A lente parece um tanto suja, tornando a imagem borrada, mas ainda é possível distinguir a presença de alguém do outro lado.]',),
      F('Sistema','Sempre que receber uma visita e decidir atendê-la, você terá a oportunidade de observar o visitante pelo olho mágico da porta. Isso pode fornecer algumas pistas sobre quem está do outro lado, mas será necessário ter conhecimento suficiente para interpretá-las.',{alerta:true,olho:true}),
      N('[A porta é aberta gradualmente.]'),N('[Revelando uma figura surpreendentemente baixa, vestida com o uniforme de um carteiro.]'),N('[Não. De uma carteira?]'),
      S(`Olá! Você é ${g('o novo morador','a nova moradora')}, certo? Eu sou Simon, seu carteiro mais pontual!`,'animado'),
      ...(masc?[S('E que pontual eu sou…','malicia')]:[]),
      S(`Bem, aqui é o ${COORD}, certo? Deve ser mesmo. É uma ótima casa... Você tem tanta sorte. Estou com inveja disso.`),
      S('Já fazia algum tempo que eu sentia falta de entregar coisas por aqui. Que demais! Vamos ser bons amigos, que tal?','animado')],
      escolha:[['Você é um carteiro normal ou...?','normal'],['O que aconteceu com o antigo morador?','antigo']]},
    normal:{falas:[S('Haha! Calma. Eu sei da sua condição, mas não tenho relação nenhuma com essas coisas, não. Só conte comigo se o assunto for correspondências ou entregas, belê?','nervoso')],proximo:'preco'},
    antigo:{falas:[S('H-Hum... Eles não te contaram? Eu até poderia dizer, mas... Ah, tudo tem um preço.','nervoso')],proximo:'preco'},
    preco:{falas:[SIS('Simon pode oferecer informações em troca de uma quantia de tempo.\nAceitar ou não suas condições é uma escolha sua. As informações que ele fornece não são exatamente essenciais, portanto, não há problema algum em ignorá-lo sempre que desejar. Ainda assim, conhecer alguns detalhes interessantes pode fazer a diferença para aqueles que gostam de aproveitar todas as oportunidades.')],
      escolha:[['Quanto você quer?','quanto'],[`Não, ${g('obrigado','obrigada')}.`,'nao']]},
    quanto:{falas:[S('Essa primeira vai ser por conta da casa! Que tal? Em troca, escolha sempre os meus serviços antes dos da concorrência...','malicia'),
      S('O antigo morador era um homem alto que vivia usando roupas amarelas. Acho que ele comentou uma vez que gostava de pintar quadros e porcelanato. É uma pena que aquele balde enorme tenha caído na cabeça dele durante seus serviços valorosos.'),
      S('Dizem que o balde era tão pesado que o impacto parecia até um tiro de escopeta na nuca. E isso vindo de um colega da Companhia, quando ele menos esperava! Coitado... Imagine se esse tivesse sido mesmo o caso? Eu é que não gostaria de morrer assassinado pela própria Corporação que tanto me alimentou...','malicia')],proximo:'ajuda'},
    nao:{falas:[S('H-Hein?! Tsk. Que pena...','irritado')],proximo:'ajuda'},
    ajuda:{falas:[S('Bom, esqueça isso. Quem sabe ele não deixou alguma coisa útil por aqui? Talvez até tenha virado um fantasma que assombra a casa... Tente dar uma conferida depois. Ou quer uma ajudinha?'),
      N('[Simon parece interessado em entrar na casa para procurar pertences do antigo morador. Permitir que um estranho entre pode ser arriscado.]'),J('“O que devo fazer?”')],
      escolha:[['Não é uma boa ideia.','frieza'],['Você é bem-vindo. Entre.','entra']]},
    frieza:{falas:[S('Uau. Que frieza!','surpreso')],proximo:'adeus'},
    entra:{falas:[S('Tá, tá. Eu vou embora, entã... Hein? Sério mesmo?','surpreso'),S('Haha! Então tá! Vamos lá!','animado'),
      N('[Simon entra na casa com passos silenciosos, suas perninhas mal fazendo barulho pelo chão. Ele parece bastante interessado e começa a vasculhar todos os armários, inclusive aqueles que pedi expressamente para não mexer...]'),
      S('Bom... Terminamos. Eu tentei. [Suspiro]','decepcionado'),
      N('[Simon olha para mim da entrada. Parece um tanto decepcionado com o resultado pouco satisfatório da nossa investigação.]'),
      S('Aquele maldito deixou apenas um guarda-chuva... Isso é tão triste!','decepcionado'),
      S('Bem, agora ele é seu. Use como bem entender. Ainda é uma herança, talvez... Será que isso lhe concede algum valor?'),
      S('Se não quiser, que tal me dar?','malicia')],
      escolha:[['[Oferecer o guarda-chuva]','deu'],['[Ficar com o guarda-chuva]','ficou']]},
    deu:{falas:[S('Woow. Obrigadinho…','animado')],proximo:'adeus',efeito:'deu'},
    ficou:{falas:[S('Acho que não.','irritado')],proximo:'adeus',efeito:'ficou'},
    adeus:{falas:[S('Agora estou indo embora. A mala já está lá fora. Vou te deixar. Te deixar… 🎶 Goodbye ❣️','cantando'),
      N('[Fecho a porta.]'),N('[Ele foi embora.]'),F('Simon','Te deixar... 🎶 [Muito baixo]',{longe:true,pose:'cantando'}),J('Com certeza ele foi.')],fim:'atendeu'},
  };
  const el=document.createElement('section');el.className='visita'+(palco?' mapa':'');el.setAttribute('role','dialog');el.setAttribute('aria-label','Visita');
  el.innerHTML=`<div class="v-olho" hidden><img src="art/simon/olho-magico.png?v=${ARTE_V}" alt="O visitante, borrado pelo olho mágico"></div>
    <img class="v-fig" alt="" hidden><div class="v-caixa"><i class="v-rosto" hidden></i><b class="v-nome"></b><p class="v-tx" aria-live="polite"></p><div class="v-esc"></div><small class="v-seg">▼</small></div>`;
  document.body.append(el);
  const $v=s=>el.querySelector(s);
  let fila=[],no=null,esperaEscolha=false,resultado={};
  // motor das figuras (npc-vn.js): escala inteira, presa pela cabeça, respira, reage, fala letra a letra
  const POSES=['sorriso','animado','malicia','decepcionado','nervoso','irritado','surpreso','cantando'];
  const src=p=>`art/simon/${p}.png?v=${ARTE_V}`;
  const REAGE={animado:'pula',surpreso:'susto',irritado:'treme',nervoso:'tremor',decepcionado:'murcha',malicia:'inclina',cantando:'balanca',sorriso:'assenta'};
  const fig=$v('.v-fig');
  const npc=typeof NPCVN!=='undefined'?NPCVN.monta(fig,{voz:{tipo:'square',f0:640,f1:760,dur:30,cada:2,vol:.035},resp:2.4,nome:()=>$v('.v-nome'),caixa:()=>$v('.v-caixa'),rosto:'art/simon/anim/',versao:'202611060600',piscar:[2.2,5],piscaMs:100,bocaMs:100,boca:()=>palco&&palco.boneco}):null;
  npc&&npc.precarrega(POSES.map(src));
  palco&&NPCVN.preRostos(POSES.map(src));
  const toca=()=>{try{const a=window.__devoAudio||(window.__devoAudio=new (window.AudioContext||window.webkitAudioContext)()),o=a.createOscillator(),gn=a.createGain(),t=a.currentTime;o.type='triangle';o.frequency.setValueAtTime(880,t);o.frequency.setValueAtTime(660,t+.25);gn.gain.setValueAtTime(.15,t);gn.gain.exponentialRampToValueAtTime(.001,t+.7);o.connect(gn).connect(a.destination);o.start(t);o.stop(t+.7)}catch{}};
  function vaiPara(id){no=NOS[id];if(no.efeito)resultado.guardaChuva=no.efeito;fila=[...no.falas];passo()}
  let pronto=0; // toques nos 120 ms depois de um balão novo são ignorados
  function mostraTexto(f,t){
    const tx=$v('.v-tx');$v('.v-esc').innerHTML='';$v('.v-seg').hidden=true;esperaEscolha=false;pronto=performance.now()+120;
    const fim=()=>{$v('.v-seg').hidden=false};
    if(npc)npc.fala(tx,t,fim,{comVoz:f.quem==='Simon'});else{tx.textContent=t;fim()}
  }
  let ocupado=false;
  async function passo(){
    if(npc&&npc.completa())return; // o primeiro toque completa o texto
    if(performance.now()<pronto||ocupado)return;
    ocupado=true;try{await passo2()}finally{ocupado=false}
  }
  async function passo2(){
    const f=fila.shift();
    if(!f){
      if(no.escolha)return mostraEscolha(no.escolha);
      if(no.proximo)return vaiPara(no.proximo);
      return fecha(no.fim);
    }
    if(f.texto==='[Som de campainha]')toca();
    if(f.cont)return mostraTexto(f,f.texto);
    const porta=f.texto==='[A porta é aberta gradualmente.]';
    if(palco){
      // no cenário: o chibi faz a cena e a caixa mostra o rostinho de quem fala
      const fala=f.quem==='Simon'&&!f.longe;
      NPCVN.rostinho($v('.v-rosto'),fala?src(f.pose||'sorriso'):null);
      if(fala)palco.fala(f.pose||'sorriso');
      if(porta)palco.entra();
      else if(f.texto.startsWith('[Simon entra na casa'))palco.entraCasa();
      else if(f.texto.startsWith('[Simon olha para mim da entrada'))palco.volta();
      else if(f.texto==='[Fecho a porta.]')palco.sai();
    }else
    // nas falas o Simon aparece do busto para cima; corpo inteiro só nas cenas especiais (a porta se abrindo e a
    // revelação da altura dele) e de longe, na despedida
    if(f.quem==='Simon'){
      const p=f.pose||'sorriso';fig.classList.toggle('longe',!!f.longe);fig.classList.toggle('inteiro',!!(f.longe||f.inteiro));
      if(fig.hidden&&npc)npc.mostra(true);fig.hidden=false;npc&&npc.escala();
      if(npc)await npc.pose(src(p),{reage:f.longe?null:REAGE[p]});else fig.src=src(p);
    }else if(porta){
      fig.classList.remove('longe');fig.classList.add('inteiro');fig.hidden=false;npc&&npc.escala();
      if(npc){await npc.pose(src('sorriso'),{mesma:true});npc.mostra(true);npc.entra('porta')}else fig.src=src('sorriso');
    }else if(f.texto.startsWith('[Revelando')){/* a figura já está na porta; nada se mexe */}
    else if(f.texto.startsWith('[Simon entra na casa')){fig.hidden=true;npc&&npc.mostra(false)} // ele está lá dentro, revirando os armários
    else if(f.texto==='[Fecho a porta.]'){if(npc)await npc.sai('porta',el);fig.hidden=true;npc&&npc.mostra(false)}
    else if(f.texto==='[Ele foi embora.]'){fig.hidden=true}
    $v('.v-olho').hidden=!f.olho&&!f.texto.includes('olho mágico');
    el.dataset.quem=f.quem==='narra'?'narra':f.quem==='Sistema'?'sistema':f.quem==='Jogador'?'jogador':'npc';
    el.classList.toggle('alerta',!!f.alerta);
    $v('.v-nome').textContent=f.quem==='narra'?'':f.quem==='Sistema'?(f.alerta?'⚠️ Sistema':'Sistema'):f.quem==='Jogador'?'Você':f.quem;
    // balão de tamanho fixo: o que não cabe vira o balão seguinte, com o mesmo falante
    const pags=typeof paginar==='function'?paginar($v('.v-tx'),f.texto):[f.texto];
    if(pags.length>1)fila.unshift(...pags.slice(1).map(t=>({...f,texto:t,cont:true})));
    mostraTexto(f,pags[0]);
  }
  function mostraEscolha(ops){
    esperaEscolha=true;$v('.v-seg').hidden=true;
    $v('.v-esc').innerHTML=ops.map(([t,id],i)=>`<button data-id="${id}">${i+1} — ${t}</button>`).join('');
    $v('.v-esc').querySelectorAll('button').forEach(b=>b.onclick=e=>{e.stopPropagation();vaiPara(b.dataset.id)});
    $v('.v-esc button').focus({preventScroll:true});
  }
  function tecla(e){if((e.key==='Enter'||e.key===' ')&&!esperaEscolha){e.preventDefault();passo()}}
  function fecha(fim){
    npc&&npc.destroi();palco&&palco.fim();removeEventListener('keydown',tecla);el.remove();
    try{localStorage.setItem('devo-simon',fim)}catch{}
    if(resultado.guardaChuva==='ficou'){try{localStorage.setItem('devo-guarda-chuva','1')}catch{}}
    aoFim&&aoFim({fim,...resultado});
  }
  el.addEventListener('click',()=>{if(!esperaEscolha)passo()});
  addEventListener('keydown',tecla);
  vaiPara('inicio');
}
