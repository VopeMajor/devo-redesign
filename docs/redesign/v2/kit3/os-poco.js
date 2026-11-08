// Poço dos Milagres dentro do sistema. Falas, nomes, pesos e o minigame são os do jogo (poco-neblina.ts, poco.ts, migrações).
// Aqui o sorteio roda no aparelho só para mostrar a tela; no jogo quem sorteia é o servidor, antes da animação.
const PO_RAR={comum:'Comum',incomum:'Incomum',raro:'Raro',epico:'Épico',lendario:'Lendário'};
const PO_TIER={comum:1,incomum:2,raro:3,epico:4,lendario:4};
const PO_MOEDAS=[
  {k:'dracma_comum',nome:'Dracma Comum',arte:'dracma-comum',rar:'comum',d:'Moeda do sorteio base do Poço dos Milagres.',q:14,t:{lixo:70,capsula:10,fragmento:8,presente:9,iniciante:3}},
  {k:'dracma_incomum',nome:'Dracma Incomum',arte:'dracma-incomum',rar:'incomum',d:'Moeda antiga entregue por uma figura encapuzada. Abre uma categoria especial do Poço.',q:2,t:{lixo:50,capsula:15,fragmento:15,cosmetico:4,presente:11,iniciante:4,grande:1}},
  {k:'dracma_rara',nome:'Dracma Rara',arte:'dracma-rara',rar:'raro',d:'Moeda rara do Poço.',q:0,t:{lixo:30,capsula:16,fragmento:16,cosmetico:8,presente:13,iniciante:8,intermediario:5,grande:4}},
];
const PO_NOME={lixo:'Nada de valor',capsula:'Cápsula do tempo',fragmento:'Fragmento de arcano',cosmetico:'Item estético',presente:'Presente',iniciante:'Pacote Iniciante',intermediario:'Pacote Intermediário',grande:'Grande Fragmento Arcano'};
const PO_BALDES=[
  {id:'madeira',nome:'Balde de madeira desgastado',rar:'comum',d:'O balde de todo iniciante. Trágico, rachado e sem qualquer efeito sobre a coleta.',ef:'Nenhum efeito.',mult:1,tem:true},
  {id:'ferro',nome:'Balde de ferro batido',rar:'incomum',d:'Pesado e honesto. Volta do fundo com um pouco mais do que levou.',ef:'Coleta 1,5× fragmentos e essências.',mult:1.5,tem:true},
  {id:'cobre',nome:'Balde de cobre polido',rar:'raro',d:'O cobre escurece no contato com a água do poço, mas não larga o que pega.',ef:'Coleta 2× fragmentos e essências.',mult:2,tem:false},
  {id:'prata',nome:'Balde de prata votiva',rar:'epico',d:'Gravado com nomes que ninguém lembra de ter escrito.',ef:'Coleta 3× fragmentos e essências.',mult:3,tem:false},
];
const PO_LUGAR={rua:'rua',poco:'cena',figura:'figura',mao:'mao',partiu:'cena'};
const po=a=>`art/os/poco/${a}.png`;
const poGen=t=>t.replace(/\{([^|}]*)\|[^}]*\}/g,'$1');
function poSorteia(moeda,acertos,baldeMult){
  // cada acerto da manivela tira 8% do peso do lixo (poco.manivela)
  const t={...moeda.t};t.lixo*=Math.max(0,1-.08*acertos);
  let r=Math.random()*Object.values(t).reduce((a,b)=>a+b,0),cat='lixo';
  for(const [k,v] of Object.entries(t)){if(r<v){cat=k;break}r-=v}
  if(cat==='lixo'){const l=POCO_LIXO[Math.floor(Math.random()*POCO_LIXO.length)];return {nome:l.nome,txt:l.texto,rar:'comum',lixo:true,arte:po('lixo-'+l.id.replace('_','-')),nota:'Não vai para o inventário.'}}
  if(cat==='capsula')return {nome:'Cápsula do tempo',txt:'Uma lembrança que alguém deixou no fundo.',rar:'incomum',arte:po('capsula'),nota:'Guardada no seu Diário.'};
  if(cat==='fragmento'){const n=Math.ceil((1+Math.floor(Math.random()*2))*baldeMult);return {nome:`${n} ${n===1?'Fragmento Arcano':'Fragmentos Arcanos'}`,txt:'Lasca de um Arcano. Usada na evolução de Estágio.',rar:'raro',arte:po('fragmento'),nota:'Guardado no seu inventário.'}}
  if(cat==='cosmetico')return {nome:'Item estético',txt:'',rar:'raro',arte:null,nota:'Guardado nos seus cosméticos.'};
  if(cat==='grande')return {nome:'Grande Fragmento Arcano',txt:'',rar:'lendario',arte:po('grande-fragmento'),nota:'Guardado no seu inventário.'};
  const pac={presente:['presente','incomum'],iniciante:['iniciante','incomum'],intermediario:['intermediario','raro']}[cat];
  return {nome:PO_NOME[cat],txt:'',rar:pac[1],arte:`../../../../public/images/pacotes/${pac[0]}/arte-384.webp`,nota:'Guardado no seu inventário.',grande:true};
}
function montaPoco(raiz){
  let g={viu:false,gratisDia:null,balde:'madeira'};try{Object.assign(g,JSON.parse(localStorage.getItem('devo-poco')))}catch{}
  const grava=()=>{try{localStorage.setItem('devo-poco',JSON.stringify(g))}catch{}};
  const hoje=new Date().toDateString(),gratis=()=>g.gratisDia!==hoje;
  let fase='vazio',moeda=null,acertos=0,grat=false,msg='';
  const baldeAtual=()=>PO_BALDES.find(b=>b.id===g.balde);
  const dica=()=>fase==='vazio'?'Lance uma moeda no poço.':fase==='moeda'?'A moeda afundou. Gire a manivela.':'O balde subiu. Inspecione o balde.';
  const letreiro=[['Jogador #4120','Grande Fragmento Arcano'],['Jogador #0731','Pacote Iniciante'],['Jogador #2285','Presente']];
  const volta=(t,sub)=>`<div class="c-nav"><button class="m-volta chanfro" id="p-volta" aria-label="Voltar ao poço">‹</button><div><small>${sub}</small><strong>${t}</strong></div></div>`;
  function tela(){
    raiz.classList.add('p-fixo');
    const b=baldeAtual();
    raiz.innerHTML=`<div class="p-palco ${fase}"><img src="${po('cena')}" alt="O poço milenar na neblina"><img class="p-moeda" alt="" hidden>
        ${fase==='cheio'?`<img class="p-balde" src="${po('balde-'+b.id)}" alt="">`:''}
        <div class="p-tags"><span><img src="${po('balde-'+b.id)}" alt="">${b.nome.split(' ').slice(0,3).join(' ')}</span><span class="${gratis()?'on':''}">${gratis()?'Giro grátis disponível':'Giro grátis usado hoje'}</span></div>
        <button class="p-info chanfro" id="p-moedas" aria-label="Suas moedas">⋯</button></div>
      <p class="p-faixa" aria-live="off" aria-label="Prêmios do poço"><img src="${px('poco')}" alt=""><span id="p-let"></span></p>
      <div class="p-base" id="p-base">
        <p class="p-dica" aria-live="polite">${dica()}</p>${msg?`<p class="r-erro" role="alert">${msg}</p>`:''}
        <div class="p-acoes">
          <button class="p-ac chanfro ${fase==='vazio'?'on':''}" id="p-lanca" ${fase==='vazio'?'':'disabled'}><img src="${po('dracma-incomum')}" alt=""><span>Lançar Moeda</span></button>
          <button class="p-ac chanfro ${fase==='moeda'?'on':''}" id="p-gira" ${fase==='moeda'?'':'disabled'}><img src="${px('ajustes')}" alt=""><span>Girar Manivela</span></button>
          <button class="p-ac chanfro ${fase==='cheio'?'on':''}" id="p-balde"><img src="${po('balde-'+b.id)}" alt=""><span>Inspecionar Balde</span></button>
        </div></div>`;
    msg='';
    let li=0;const pl=()=>{const e=raiz.querySelector('#p-let');if(!e)return false;const x=letreiro[li++%letreiro.length];e.textContent=`${x[0]} · ${x[1]}`;return true};pl();
    if(!parado&&!q.has('semraf')){const t=setInterval(()=>{if(!raiz.isConnected||!pl())clearInterval(t)},4000)}
    const $r=s=>raiz.querySelector(s);
    $r('#p-moedas').onclick=()=>folhaMoedas(false);
    $r('#p-lanca').onclick=()=>folhaMoedas(true);
    $r('#p-gira').onclick=manivela;
    $r('#p-balde').onclick=()=>fase==='cheio'?inspeciona():folhaBaldes();
  }
  /* ---- moedas e chances ---- */
  function folhaMoedas(lancar){
    raiz.classList.remove('p-fixo');
    const linha=m=>{const tot=Object.entries(m.t);return `<li class="fundo"><div class="p-m"><img src="${po(m.arte)}" alt=""><div><strong>${m.nome}</strong><small>×${m.q}</small></div></div><p class="r-sub">${m.d}</p>
      <dl class="p-ch">${tot.map(([k,v])=>`<div><dt>${PO_NOME[k]}</dt><dd>${v}%</dd></div>`).join('')}</dl>
      ${lancar?`<div class="r-acoes"><button class="r-bt chanfro" data-m="${m.k}" data-n="1" ${m.q?'':'disabled'}>Lançar</button><button class="r-bt chanfro" data-m="${m.k}" data-n="5" ${m.q>=5?'':'disabled'}>Lançar 5</button></div>`:''}</li>`};
    raiz.innerHTML=volta(lancar?'Lançar Moeda':'Suas moedas','Poço dos Milagres')+`<p class="r-sub">${lancar?'Escolha o que vai para o fundo do poço. Depois, gire a manivela.':'Cada moeda abre a sua própria categoria de sorteio. Lançada, não volta.'}</p>
      ${lancar&&gratis()?'<button class="r-bt chanfro p-grat" id="p-grat">Giro grátis · Dracma Comum</button>':''}<ul class="p-lista">${PO_MOEDAS.map(linha).join('')}</ul>`;
    raiz.querySelector('#p-volta').onclick=tela;
    const pg=raiz.querySelector('#p-grat');if(pg)pg.onclick=()=>{g.gratisDia=hoje;grava();lanca(PO_MOEDAS[0],true)};
    raiz.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{
      const m=PO_MOEDAS.find(x=>x.k===b.dataset.m),n=+b.dataset.n;
      m.q-=n;const inv=INV_ITENS.find(i=>i.nome===m.nome);if(inv)inv.q=m.q;
      n===1?lanca(m,false):varias(m,n);
    });
  }
  function lanca(m,gr){
    moeda=m;grat=gr;fase='moeda';tela();
    const c=raiz.querySelector('.p-moeda');c.src=po(m.arte);c.hidden=false;
    if(parado||q.has('semraf')){c.hidden=true;return}
    c.classList.add('cai');setTimeout(()=>{c.hidden=true},620);
  }
  /* ---- baldes ---- */
  function folhaBaldes(){
    raiz.classList.remove('p-fixo');
    raiz.innerHTML=volta('Baldes','Inspecionar Balde')+`<p class="r-sub">O balde vazio espera no fundo. Escolha qual desce na próxima coleta.</p><ul class="p-lista">${PO_BALDES.filter(b=>b.tem).map(b=>`<li class="fundo"><div class="p-m"><img src="${po('balde-'+b.id)}" alt=""><div><strong>${b.nome}</strong><small class="r-${b.rar==='epico'?'raro':b.rar}">${PO_RAR[b.rar]}</small></div></div><p class="r-sub">${b.d}</p><p>${b.ef}</p>${b.id===g.balde?'<p class="p-uso">Em uso</p>':`<button class="r-bt chanfro" data-b="${b.id}" aria-label="Usar ${b.nome}">Usar</button>`}</li>`).join('')}</ul><p class="r-sub">Há baldes mais raros que nem aparecem aqui até serem encontrados.</p>`;
    raiz.querySelector('#p-volta').onclick=tela;
    raiz.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>{g.balde=b.dataset.b;grava();folhaBaldes()});
  }
  /* ---- manivela: o mesmo minigame de timing do jogo (poco.manivela) ---- */
  function manivela(){
    const JAN=[.26,.2,.155,.12,.09],PER=[1900,1650,1450,1280,1140],F=parado?1.6:1;
    let i=0,ini=0,raf=0,centro=.5,fase0=0,fim=null;acertos=0;
    const b=raiz.querySelector('#p-base');
    const novaRodada=()=>{centro=.2+Math.random()*.6;fase0=Math.random();ini=performance.now();pintaJan()};
    b.innerHTML=`<div class="p-man"><div class="p-pips" aria-hidden="true">${JAN.map(()=>'<u></u>').join('')}</div><span class="m-so" aria-live="polite" id="p-so"></span>
      <strong id="p-t">Toque na janela</strong><p id="p-d" class="r-sub">Cada acerto melhora a coleta.${parado?' Ponteiro lento (movimento reduzido).':''}</p>
      <div class="p-trilho fundo"><i id="p-j"></i><b id="p-p"></b></div>
      <button class="p-puxa chanfro" id="p-puxa" aria-label="Puxar a manivela">Puxar</button><button class="r-link" id="p-solta">Soltar a manivela</button></div>`;
    const $b=s=>b.querySelector(s);
    function pintaJan(){const j=$b('#p-j');j.style.left=(centro-JAN[i]/2)*100+'%';j.style.width=JAN[i]*100+'%'}
    const tri=x=>{const f=x-Math.floor(x);return 1-Math.abs(2*f-1)};
    const pos=()=>tri((performance.now()-ini)/(PER[i]*F)+fase0);
    function roda(){if(fim||!raiz.isConnected)return;$b('#p-p').style.left=pos()*100+'%';if(performance.now()-ini>9000)return encerra('soltou');raf=requestAnimationFrame(roda)}
    function encerra(e){
      fim=e;cancelAnimationFrame(raf);
      $b('#p-t').textContent=e==='perfeito'?'Giro perfeito':e==='escapou'?'A manivela escapou':'Manivela solta';
      $b('#p-d').textContent=`${acertos} ${acertos===1?'acerto':'acertos'}: o balde está subindo.`;
      $b('#p-puxa').disabled=true;$b('#p-solta').hidden=true;
      setTimeout(()=>{if(!raiz.isConnected)return;fase='cheio';tela()},parado||q.has('semraf')?0:1300);
    }
    $b('#p-puxa').onclick=()=>{
      if(fim)return;
      if(Math.abs(pos()-centro)>JAN[i]/2)return encerra('escapou');
      b.querySelectorAll('.p-pips u')[i].classList.add('on');acertos++;i++;$b('#p-so').textContent=`${acertos} de 5 acertos`;
      if(i>=JAN.length)return encerra('perfeito');
      novaRodada();
    };
    $b('#p-solta').onclick=()=>encerra('soltou');
    novaRodada();$b('#p-p').style.left=pos()*100+'%';raf=requestAnimationFrame(roda);
    window.__pocoPos=()=>[pos(),centro,JAN[i]];
  }
  /* ---- revelação: ativação, suspense e resultado; um toque pula ---- */
  function inspeciona(){
    revela(poSorteia(moeda,acertos,baldeAtual().mult),`${moeda.nome}${grat?' · giro grátis':''}`,()=>{fase='vazio';moeda=null;tela()});
  }
  function revela(r,sub,depois){
    const tier=PO_TIER[r.rar],jan=raiz.closest('.jan'),o=document.createElement('div');
    o.className=`p-rev t${tier}`;o.setAttribute('role','dialog');o.setAttribute('aria-label',`Resultado: ${r.nome}`);
    o.innerHTML=`<i class="p-col" aria-hidden="true"></i>${Array.from({length:tier>=4?14:tier>=3?8:0},(_,k)=>`<u class="p-fa" style="--x:${(k*37+11)%100}%;--d:${(k*13)%8/10}s" aria-hidden="true"></u>`).join('')}
      <span class="p-susp">${tier===1&&r.lixo?'Algo pinga no fundo…':'Algo sobe pela corrente…'}</span>
      <div class="p-res" hidden>${r.arte?`<img class="${r.grande?'':'pixel'}" src="${r.arte}" alt="">`:`<span class="i-joia r-raro" aria-hidden="true"><u></u></span>`}<small>${sub}</small><strong>${r.nome}</strong><em>${PO_RAR[r.rar]}</em>${r.txt?`<p>${r.txt}</p>`:''}<p class="p-not">${r.nota}</p><button class="r-bt chanfro" id="p-ok">${r.lixo?'Devolver ao poço':'Guardar'}</button></div>`;
    jan.append(o);
    let aberto=false;
    const mostra=()=>{if(aberto)return;aberto=true;o.classList.add('fim');o.querySelector('.p-res').hidden=false;o.querySelector('#p-ok').focus()};
    o.querySelector('#p-ok').onclick=e=>{e.stopPropagation();o.remove();depois()};
    o.addEventListener('click',mostra);
    if(parado||q.has('semraf'))mostra();else setTimeout(()=>{if(o.isConnected)mostra()},tier>=3?1500:900);
  }
  function varias(m,n){
    raiz.classList.remove('p-fixo');
    const lista=Array.from({length:n},()=>poSorteia(m,0,baldeAtual().mult));
    raiz.innerHTML=volta(`Poço dos Milagres · ×${n}`,m.nome)+`<ul class="p-lista p-multi">${lista.map(r=>`<li class="fundo">${r.arte?`<img class="${r.grande?'':'pixel'}" src="${r.arte}" alt="">`:'<span class="i-joia r-raro" aria-hidden="true"><u></u></span>'}<div><strong>${r.nome}</strong><small class="r-${r.rar==='lendario'||r.rar==='epico'?'raro':r.rar}">${PO_RAR[r.rar]}</small><p class="r-sub">${r.nota}</p></div></li>`).join('')}</ul><p class="r-sub">Lançamento múltiplo não tem manivela.</p>`;
    raiz.querySelector('#p-volta').onclick=tela;
  }
  /* ---- a neblina: apresentação do poço na primeira entrada ---- */
  function neblina(){
    const jan=raiz.closest('.jan'),o=document.createElement('div');
    o.className='p-neb';o.setAttribute('role','dialog');o.setAttribute('aria-label','Apresentação do Poço dos Milagres');
    o.innerHTML=`<img class="p-neb-img" alt=""><div class="p-neb-mao" hidden></div><button class="k-pula chanfro" style="bottom:auto;top:8px">Pular</button><div class="p-caixa"><b></b><p aria-live="polite"></p><i aria-hidden="true"></i></div><div class="p-esc"></div>`;
    jan.append(o);
    const $o=s=>o.querySelector(s),rapido=parado||q.has('semraf');
    const QUEM={narrador:'',jogador:'Você',figura:'???',sistema:''};
    let n=q.has('nebpasso')?+q.get('nebpasso'):0,fila=[],tid,txt='',k=0,lugar='rua',esperaEsc=false;
    const acaba=()=>{clearInterval(tid);$o('.p-caixa p').textContent=txt;k=txt.length;$o('.p-caixa i').hidden=esperaEsc};
    function escreve(q2,t){
      $o('.p-caixa b').textContent=QUEM[q2]||'';$o('.p-caixa b').hidden=!QUEM[q2];
      $o('.p-caixa').classList.toggle('narr',q2==='narrador'||q2==='sistema');
      txt=poGen(t);k=0;$o('.p-caixa i').hidden=true;clearInterval(tid);
      if(rapido)return acaba();
      $o('.p-caixa p').textContent='';
      tid=setInterval(()=>{$o('.p-caixa p').textContent=txt.slice(0,++k);if(k>=txt.length)acaba()},24);
    }
    const fim=()=>{clearInterval(tid);o.remove();g.viu=true;grava()};
    function no(){
      if(n>=NEBLINA.length)return fim();
      const x=NEBLINA[n];
      if(x.palco)lugar=x.palco;
      $o('.p-neb-img').src=po(PO_LUGAR[lugar]);$o('.p-neb-img').style.objectPosition=lugar==='figura'?'72% 50%':'50% 50%';
      $o('.p-esc').innerHTML='';esperaEsc=false;
      if(x.tipo==='fala')return escreve(x.quem,x.texto);
      if(x.tipo==='moeda'){const m=PO_MOEDAS[1];m.q++;const inv=INV_ITENS.find(i=>i.nome===m.nome);if(inv)inv.q=m.q;return escreve('sistema',x.texto)}
      esperaEsc=true;$o('.p-caixa').classList.add('narr');$o('.p-caixa b').hidden=true;$o('.p-caixa p').textContent='';$o('.p-caixa i').hidden=true;txt='';
      x.opcoes.forEach(op=>{
        const b=document.createElement('button'),tranca=op.exigeMoedaEspecial; // sem Dracma a opção fica escura, como o dono pediu
        b.className='m-op chanfro';b.textContent=poGen(op.rotulo).replace(' (se houver)','');b.disabled=!!tranca;
        b.onclick=e=>{e.stopPropagation();fila=[...(op.resposta||[])];n++;passo()};
        $o('.p-esc').append(b);
      });
    }
    function passo(){if(fila.length){const f=fila.shift();$o('.p-esc').innerHTML='';esperaEsc=false;escreve(f.quem,f.texto);return}no()}
    o.addEventListener('click',e=>{
      if(e.target.closest('.k-pula'))return fim();
      if(esperaEsc)return;
      if(k<txt.length)return acaba();
      if(!fila.length)n++;
      passo();
    });
    no();
  }
  tela();
  if(q.get('poco')==='cheio'){moeda=PO_MOEDAS[1];fase='cheio';tela()}
  if(q.get('poco')==='gira'){moeda=PO_MOEDAS[1];fase='moeda';tela();manivela()}
  if(q.get('poco')==='lanca')folhaMoedas(true);
  if(q.get('poco')==='revela')revela({nome:'Grande Fragmento Arcano',txt:'',rar:'lendario',arte:po('grande-fragmento'),nota:'Guardado no seu inventário.'},'Dracma Incomum',tela);
  if((!g.viu&&!q.has('semraf'))||q.has('neblina'))neblina();
}
