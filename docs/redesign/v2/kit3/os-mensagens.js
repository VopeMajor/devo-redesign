// Tela de Mensagens dentro do sistema. Nomes, títulos, perguntas e respostas são os do jogo atual (lib/devo/npcs.ts);
// a expressão de cada resposta é sugestão minha. As conversas ficam na memória: no jogo vêm do save.
const NOME_JOGADOR='Jogador';
const NPC={
  rato:{nome:'O Rato',titulo:'Anfitrião',rosto:'sorriso',escolhas:[
    {id:'regras',p:'Quais são as regras daqui?',r:['Hihihi! Simples, querido {nome}: o tempo é a vida, e o jogo é a única fonte dela.','O resto você descobre perdendo.'],e:'malicia'},
    {id:'sair',p:'Como eu saio deste lugar?',r:['Sair? Que palavra feia!','Ninguém sai. Alguns só param de jogar. Hihihi.'],e:'trama'},
    {id:'horas',p:'Como ganho mais horas?',r:['Jogando. E vencendo. Só isso.','Perder também ensina, mas costuma ser a última lição.'],e:'desdem'},
    {id:'promessas',p:'Posso confiar em você?',apos:'regras',r:['Que pergunta maravilhosa!','Não confie muito em promessas. Confie ainda menos em mim!'],e:'surpreso'},
  ]},
  herdeiro:{nome:'O Herdeiro',titulo:'Herdeiro Absoluto',rosto:'neutro',escolhas:[
    {id:'quem',p:'Quem é você, afinal?',r:['Alguém que nasceu para vencer. Você, {nome}, nasceu para assistir.','Isso é tudo que precisa saber.'],e:'confiante'},
    {id:'ajuda',p:'Você pode me ajudar a sobreviver?',r:['Ajudar? Eu não invisto em ativos sem valor.','Prove que vale alguma coisa e talvez eu reconsidere.'],e:'desdem'},
    {id:'troca',p:'Alguma dica para a Sala de Trocas?',r:['Nunca demonstre que quer a carta do outro.','Quem parece desesperado já perdeu a negociação antes de ela começar.'],e:'malicia'},
    {id:'rato',p:'O que você sabe sobre o Rato?',apos:'quem',r:['Que ele ri demais para alguém que não tem nada a perder.','Desconfie de quem se diverte com as regras que escreve.'],e:'entediado'},
  ]},
  coruja:{nome:'Coruja',titulo:'Guardiã das Cartas',rosto:'neutro',oculto:true,fim:'Não há mais nada aqui.',escolhas:[
    {id:'figurinha',p:'Enviar figurinha engraçada',fig:'engracada',r:['Gostei da figurinha.'],e:'sorriso'},
    {id:'esqueceu',p:'Que coisa você esqueceu de me avisar?',r:['Coleções não são a única forma de agrupar um certo tipo de carta.'],e:'preocupado'},
    {id:'ignorar',p:'Ignorar',mudo:true,apos:'esqueceu',r:['Ei…'],e:'triste'},
    {id:'outra',p:'O que é a outra coisa?',apos:'esqueceu',r:['Existe algo chamado Arquétipo. Esse é como o grupo maior, do qual uma coleção faz parte.','É como se as Coleções fossem filiais, e o Arquétipo a grande empresa. Eles sim representam a massa das cartas.','Existem poucos Arquétipos no mundo, e não há necessariamente qualquer benefício em ter cartas de um mesmo Arquétipo ou não.','Ainda assim, essa é uma informação que eu não poderia simplesmente ignorar… e já que ela existe…'],e:'timido'},
    {id:'entendi',p:'Entendi',apos:'outra',r:[]},
    {id:'exemplo',p:'Algum exemplo?',apos:'outra',r:['Contos de Fada, Heróis do Passado ou Mitos Antigos.'],e:'sorriso'},
    {id:'escudo',p:'Qual a utilidade de um escudo de papelão…?',apos:'outra',r:['fig:triste'],e:'triste'},
  ]},
  desconhecido:{nome:'???',titulo:'Remetente desconhecido',escolhas:[
    {id:'quem',p:'Quem está falando?',r:['Alguém que já esteve onde você está.']},
    {id:'porque',p:'Por que eu não deveria confiar no Rato?',r:['Porque ele escolhe quem entra em cada sala.','Sala 07. Não entre.']},
  ]},
};
const com=t=>t.replace('{nome}',NOME_JOGADOR);
// conversas já começadas para a tela não abrir vazia: só falas que existem no jogo, e 3 não lidas como no ícone
const HORA_EX='21:40';
const CONVERSAS=[
  {npc:'rato',rosto:'malicia',lidas:false,nao:2,feitas:['regras'],msgs:[{de:'eu',t:'Quais são as regras daqui?'},...NPC.rato.escolhas[0].r.map(r=>({de:'npc',t:com(r)}))]},
  {npc:'desconhecido',nao:1,feitas:['quem'],msgs:[{de:'eu',t:'Quem está falando?'},{de:'npc',t:NPC.desconhecido.escolhas[0].r[0]}]},
  {npc:'herdeiro',rosto:'neutro',nao:0,feitas:[],msgs:[]},
  {npc:'coruja',rosto:'sorriso',nao:0,feitas:['figurinha'],msgs:estado==='novato'?[]:[{de:'eu',fig:'engracada'},{de:'npc',t:'Gostei da figurinha.'}]},
].map(c=>({digitando:false,rosto:NPC[c.npc].rosto,...c}));
if(estado==='novato'){const c=CONVERSAS.find(x=>x.npc==='coruja');c.feitas=[]}
const rostoSrc=c=>c.npc==='desconhecido'?null:`art/os/npc/${c.npc}-${c.rosto}.png`;
const rostoHtml=(c,cl)=>{const s=rostoSrc(c);return s?`<img class="${cl}" src="${s}" alt="">`:`<span class="${cl} m-oculto" aria-hidden="true">?</span>`};
function contaMensagens(){
  const n=CONVERSAS.reduce((a,c)=>a+c.nao,0),b=document.querySelector('#mesa .ic[data-id=mensagens]');
  if(!b)return;
  const u=b.querySelector('u');
  if(n&&u)u.textContent=n;else if(u)u.remove();
  b.setAttribute('aria-label',n?`Mensagens, ${n} novas`:'Mensagens');
}
let msgAberta=null;
function montaMensagens(raiz){
  raiz.innerHTML='<div class="m-lista"></div><div class="m-conversa"></div>';
  const lista=raiz.querySelector('.m-lista'),conv=raiz.querySelector('.m-conversa');
  const visiveis=()=>CONVERSAS.filter(c=>!(NPC[c.npc].oculto&&!c.msgs.length&&!c.digitando));
  const ultima=c=>{const m=c.msgs.at(-1);return c.digitando?'digitando…':!m?'Nenhuma mensagem ainda.':m.fig?'Figurinha':m.t};
  function pintaLista(){
    if(!raiz.isConnected)return;
    const vs=visiveis();
    lista.innerHTML=`<p class="m-canal">Canal seguro · ${vs.length} conversas</p><ul class="m-itens" aria-label="Conversas"></ul>
      <p class="m-canal">Jogadores</p><div class="m-bloq fundo"><img src="${px('cadeado')}" alt=""><div><strong>Bloqueado</strong><p>Conversas livres entre jogadores ainda não foram liberadas.</p></div></div>`;
    const ul=lista.querySelector('ul');
    vs.forEach(c=>{
      const n=NPC[c.npc],li=document.createElement('li'),b=document.createElement('button');
      b.className='m-item'+(c===msgAberta?' on':'');if(c===msgAberta)b.setAttribute('aria-current','true');
      b.innerHTML=`${rostoHtml(c,'m-rosto')}<span class="m-tx"><b>${n.nome}</b><small>${n.titulo}</small><em class="${c.nao?'novo':''}">${esc(ultima(c))}</em></span>${c.nao?`<i>${c.nao}<span class="m-so"> não lidas</span></i>`:''}`;
      b.onclick=()=>abreConversa(c);
      li.append(b);ul.append(li);
    });
    contaMensagens();
  }
  function bolha(m,c){
    const d=document.createElement('div');d.className='m-bolha '+(m.de==='eu'?'eu':'ele');
    if(m.fig)d.innerHTML=`<img class="m-fig" src="art/os/npc/fig-${m.fig}.png" alt="Figurinha">`;else d.textContent=m.t;
    return d;
  }
  function abreConversa(c){msgAberta=c;c.nao=0;raiz.classList.add('conversando');pintaConversa();pintaLista()}
  function disponiveis(c){return NPC[c.npc].escolhas.filter(e=>!c.feitas.includes(e.id)&&(!e.apos||c.feitas.includes(e.apos)))}
  function pintaConversa(){
    if(!raiz.isConnected)return;
    const c=msgAberta;
    if(!c){conv.innerHTML='<div class="m-vazio"><img src="'+px('mensagens')+'" alt=""><strong>Canal seguro</strong><p>Escolha uma conversa. Cuidado com quem responde.</p></div>';return}
    const n=NPC[c.npc],esc2=disponiveis(c),ocupado=c.digitando||c.fila;
    conv.innerHTML=`<header class="m-cab"><button class="m-volta chanfro" aria-label="Voltar para conversas">‹</button>${rostoHtml(c,'m-rosto')}<span class="m-tx"><b>${n.nome}</b><small>${n.titulo}</small></span></header>
      <div class="m-fala" role="log" aria-label="Mensagens"></div><div class="m-esc"></div>`;
    conv.querySelector('.m-volta').onclick=()=>{msgAberta=null;raiz.classList.remove('conversando');pintaConversa();pintaLista()};
    const f=conv.querySelector('.m-fala');
    if(!c.msgs.length&&!c.digitando)f.innerHTML='<p class="m-nada">Nenhuma mensagem ainda.</p>';
    c.msgs.forEach(m=>f.append(bolha(m,c)));
    if(c.digitando)f.insertAdjacentHTML('beforeend','<div class="m-bolha ele m-pontos" aria-label="Digitando"><u></u><u></u><u></u></div>');
    f.scrollTop=f.scrollHeight;
    const e=conv.querySelector('.m-esc');
    e.innerHTML=`<p>${esc2.length?'Escolha o que perguntar':(n.fim||'Nada mais a perguntar')}</p>`;
    esc2.forEach(x=>{
      const b=document.createElement('button');b.className='m-op chanfro';b.textContent=x.p;b.disabled=!!ocupado;
      b.onclick=()=>pergunta(c,x);e.append(b);
    });
  }
  function pergunta(c,x){
    if(c.fila||c.digitando)return;
    c.feitas.push(x.id);
    if(x.fig)c.msgs.push({de:'eu',fig:x.fig});else if(!x.mudo)c.msgs.push({de:'eu',t:x.p});
    const linhas=[...x.r];
    c.fila=true;
    const pausa=parado||q.has('semraf')?0:null;
    const proxima=()=>{
      if(!linhas.length){c.fila=false;pintaConversa();pintaLista();return}
      const l=linhas.shift();
      c.digitando=true;pintaConversa();pintaLista();
      setTimeout(()=>{
        c.digitando=false;
        if(x.e)c.rosto=x.e;
        if(l.startsWith('fig:'))c.msgs.push({de:'npc',fig:l.slice(4)});else c.msgs.push({de:'npc',t:com(l)});
        if(c!==msgAberta)c.nao++;
        pintaConversa();pintaLista();
        setTimeout(proxima,pausa??300);
      },pausa??700+l.length*18);
    };
    pintaConversa();pintaLista();
    setTimeout(proxima,pausa??500);
  }
  pintaLista();pintaConversa();
  if(msgAberta)raiz.classList.add('conversando');
}
