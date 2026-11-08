// Sala de Trocas dentro do sistema. Regras e falas são as do jogo atual (lib/devo/trade-rooms.ts e trade-bots.ts).
// Como no jogo de hoje, o parceiro é simulado no aparelho; a troca real precisa passar pelo servidor.
const TROCA_PROTOCOLO=['Escolha uma sala livre e coloque uma carta no SEU ESPAÇO.','Outro jogador entra e coloca uma carta de mesma raridade no espaço dele. Nenhum dos dois vê a carta do outro.','Negociem pelo canal da sala. Promessas não valem nada.','Se ambos aceitarem, as cartas são reveladas e vão direto para os inventários. Sem devoluções.','Se alguém sair antes de os dois aceitarem, cada carta volta ao seu dono.','Cartas entregues ao Salão das Máscaras não vão à mesa. Sem cartas, não há troca.'];
const TROCA_FRASES=['Qual o tipo da sua carta?','Vamos fechar a troca?','Confia em mim.','Não sei…'];
const TROCA_FALAS={
  cordial:{opening:['Oi. Primeira troca? A minha também, mais ou menos.','Boa noite. Vamos tentar fazer isso de forma justa?'],ask:['Sem revelar demais: é uma carta de {type}.','Posso dizer que é do tipo {type}. O resto, só no final.'],pressure:['Se você aceitar, eu aceito também. Prometo.','Sem pressa. Mas o meu pulso não espera muito.'],generic:['Entendo.','Faz sentido.','Justo.','Também estou com medo, se serve de consolo.'],accept:['Aceitei. Boa sorte para nós dois.'],leave:['Desculpa. Mudei de ideia.']},
  mentiroso:{opening:['Você deu sorte. Minha carta é das boas.','Ah, finalmente alguém. Tenho algo que você vai amar.'],ask:['É de {fake}. Confia.','Uma carta de {fake}. Das raras dentro da raridade, sabe?'],pressure:['Aceita logo, antes que eu desista.','Outro jogador já me ofereceu mais. Decide.'],generic:['Claro, claro.','Hahaha. Você é engraçado.','Eu juro.','Todo mundo diz isso.'],accept:['Pronto, aceitei. Sua vez.'],leave:['Hm. Pensando bem, não.']},
  nervoso:{opening:['O-oi. Isso é seguro? Alguém disse que isso é seguro.','Eu só preciso de horas. Por favor, seja honesto.'],ask:['Eu… não sei se posso dizer. Talvez {type}?','É… acho que é de {type}. Não lembro direito.'],pressure:['Por favor, aceita. Meu pulso está piscando.','Eu não aguento mais esperar.'],generic:['Tá bom… tá bom.','Você acha mesmo?','Desculpa.','Eu ouvi um barulho no corredor.'],accept:['Aceitei! Não me faça me arrepender.'],leave:['Não, não, não. Não consigo. Desculpa.']},
  frio:{opening:['Fale pouco.','Não vim conversar.'],ask:['Irrelevante.','Você vai saber quando aceitar.'],pressure:['Aceite ou saia.','Tempo é vida. Não gaste o meu.'],generic:['Hm.','Não.','Continue.','…'],accept:['Aceito.'],leave:['Perda de tempo.']},
};
const TROCA_ETAPA={placing:'Escolha uma carta para o seu espaço',waiting:'Aguardando outro jogador…',negotiating:'Negociação aberta',revealing:'Revelando cartas…',done:'Troca concluída',abandoned:'Sala esvaziada'};
const TROCA_OCUPADAS=[1,4,6];
let TROCAS_FEITAS=0;
const sorteia=l=>l[Math.floor(Math.random()*l.length)];
function montaTrocas(raiz){
  let s=null,protocolo=false; // s = a sessão de troca aberta
  const rapido=q.has('semraf');
  const espera=(ms,fn)=>{const t=setTimeout(()=>{if(raiz.isConnected)fn()},rapido?0:ms);if(s)s.timers.push(t)};
  const arteCarta=c=>cartaFrente(c,colDe(c),`../../../../public/images/cartas/${c.id}/arte-512.webp`);
  const temCarta=()=>CARTAS.some(c=>TENHO[c.id]);
  const fala=(tipo)=>{
    const real=s.outra.tipo,falsa=sorteia(['Ataque','Defesa','Informação','Trapaça','Tempo'].filter(t=>t!==real));
    return sorteia(TROCA_FALAS[s.par.jeito][tipo]).replace('{type}',real).replace('{fake}',falsa);
  };
  function corredor(){
    s=null;
    const ok=temCarta();
    raiz.innerHTML=`<p class="t-canto">Corredor B · Andar 3</p>
      <div class="t-placa"><span><b>${8-TROCA_OCUPADAS.length}</b> livres</span><span><b>${TROCA_OCUPADAS.length}</b> ocupadas</span></div>
      ${ok?'':'<div class="t-aviso fundo"><strong>Nenhuma porta abre para você</strong><p>Consiga uma carta e volte ao corredor.</p></div>'}
      <ul class="t-portas" aria-label="Salas"></ul>
      <button class="r-link t-prot" aria-expanded="${protocolo}">${protocolo?'Fechar o protocolo':'Ver o protocolo'}</button>
      ${protocolo?`<ol class="t-regras">${TROCA_PROTOCOLO.map((r,i)=>`<li><b>${ROMANOS[i]}.</b><span>${r}</span></li>`).join('')}</ol>`:''}`;
    raiz.querySelector('.t-prot').onclick=()=>{protocolo=!protocolo;corredor()};
    const ul=raiz.querySelector('.t-portas');
    for(let i=1;i<=8;i++){
      const oc=TROCA_OCUPADAS.includes(i-1),tr=!ok&&!oc,li=document.createElement('li'),b=document.createElement('button');
      const [tit,lin]=tr?['Trancada para você','Sem cartas, sem troca.']:oc?['Em negociação','Dois estranhos à mesa.']:['Mesa vazia','Entre e ponha uma carta.'];
      b.className='t-porta'+(oc||tr?' fechada':'');b.disabled=oc||tr;
      b.setAttribute('aria-label',`Sala ${i}, ${oc?'Ocupada':'Livre'}, ${tit}: ${lin}`);
      b.innerHTML=`<img src="${px(oc?'porta-ocupada':'porta-livre')}" alt=""><b>${String(i).padStart(2,'0')}</b><small>${oc?'Ocupada':tr?'Trancada':'Livre'}</small>`;
      b.onclick=()=>entra(i);li.append(b);ul.append(li);
    }
  }
  function entra(n){s={sala:n,etapa:'placing',minha:null,outra:null,par:null,chat:[],aceitei:false,digitando:false,timers:[]};sala()}
  function sai(){if(s)s.timers.forEach(clearTimeout);corredor()}
  function coloca(c){
    s.minha=c;s.etapa='waiting';sala();
    espera(1800+Math.random()*2200,()=>{
      const jeito=sorteia(['cordial','mentiroso','nervoso','frio']);
      s.par={nome:`Jogador #${Math.floor(Math.random()*9000)+1000}`,jeito,topa:Math.random()<{cordial:.9,mentiroso:.8,nervoso:.6,frio:.75}[jeito]};
      s.outra=sorteia(CARTAS.filter(x=>x.rar===c.rar));
      s.etapa='negotiating';s.digitando=true;sala();
      espera(1100,()=>{s.digitando=false;s.chat.push({de:'ele',t:fala('opening')});sala()});
    });
  }
  function envia(t){
    t=t.trim();if(!t||s.etapa!=='negotiating')return;
    s.chat.push({de:'eu',t});s.digitando=true;sala();
    const m=t.toLowerCase(),tipo=/(qual|carta|o que|tipo|raridade|mostra|revela)/.test(m)?'ask':/(aceit|troca|fecha|confia|agora|logo)/.test(m)?'pressure':'generic';
    espera(900+Math.random()*900,()=>{s.digitando=false;s.chat.push({de:'ele',t:fala(tipo)});sala()});
  }
  function aceita(){
    s.aceitei=true;sala();
    espera(1400+Math.random()*1400,()=>{
      if(!s.par.topa){s.chat.push({de:'ele',t:fala('leave')});s.etapa='abandoned';s.fugiu=true;sala();return}
      s.chat.push({de:'ele',t:fala('accept')});s.etapa='revealing';sala();
      espera(1500,()=>{
        // a sua carta sai do inventário e a do outro entra
        const m=TENHO[s.minha.id];m[0]--;if(!m[0])delete TENHO[s.minha.id];
        if(TENHO[s.outra.id])TENHO[s.outra.id][0]++;else TENHO[s.outra.id]=[1,`Sala ${s.sala}`];
        TROCAS_FEITAS++;
        s.etapa='done';sala();
      });
    });
  }
  function sala(){
    if(!raiz.isConnected)return;
    const e=s.etapa,fim=e==='done'||e==='abandoned',revelou=e==='revealing'||e==='done',saiu=e==='abandoned'&&s.fugiu;
    const lugar=(rot,nome,corpo,nota)=>`<div class="t-lugar"><small>${rot}</small><b>${nome}</b><div class="t-carta">${corpo}</div><em>${nota||'&nbsp;'}</em></div>`;
    const vaga=t=>`<div class="t-vaga"><span>${t||''}</span></div>`;
    const outro=saiu?vaga('Cadeira vazia'):s.outra?(revelou?arteCarta(s.outra):cartaVerso()):vaga(e==='waiting'?'Passos no corredor…':'');
    const meu=s.minha?arteCarta(s.minha):vaga('Escolha abaixo');
    raiz.innerHTML=`<div class="t-sala">
      <div class="t-esq">
        <div class="t-cab"><button class="m-volta chanfro" aria-label="${fim?'Voltar ao corredor':'Sair da sala'}">‹</button><div><strong>Sala ${String(s.sala).padStart(2,'0')}</strong><small>${TROCA_ETAPA[e]}</small></div></div>
        <p class="t-regra"><b>Mesma raridade.</b> Às cegas até a revelação.</p>
        <div class="t-mesa fundo ${e==='placing'?'vazia':fim?'grande':''}">${lugar('Espaço do outro',saiu?'Saiu da sala':s.par?s.par.nome:'Vazio',outro,revelou?'Revelada':s.outra&&!saiu?'Virada para baixo':'')}${lugar('Seu espaço','Você',meu,e==='done'?'Entregue':s.minha?'O outro vê o verso':'')}</div>
        ${s.aceitei&&!fim&&e!=='revealing'?'<p class="t-sub">Você aceitou. Não há volta.</p>':''}
      </div>
      <div class="t-dir"></div></div>`;
    raiz.querySelector('.m-volta').onclick=sai;
    const dir=raiz.querySelector('.t-dir');
    if(e==='placing'){
      dir.innerHTML='<h4>Suas cartas</h4><ul class="t-escolha" aria-label="Suas cartas"></ul>';
      CARTAS.filter(c=>TENHO[c.id]).sort((a,b)=>ordemRar(b.rar)-ordemRar(a.rar)).forEach(c=>{
        const li=document.createElement('li'),b=document.createElement('button');
        b.setAttribute('aria-label',`Colocar ${c.nome} na mesa`);b.innerHTML=arteCarta(c)+`<span>${c.nome}</span>`;
        b.onclick=()=>coloca(c);li.append(b);dir.querySelector('ul').append(li);
      });
    }else if(e==='done'){
      dir.innerHTML=`<div class="t-fim fundo"><small>Você recebeu</small><strong>${s.outra.nome}</strong><span>${nomeRar(s.outra.rar)}</span><b class="t-selo">Troca final</b></div><button class="r-bt chanfro t-volta">Voltar ao corredor</button>`;
      dir.querySelector('.t-volta').onclick=sai;
    }else if(e==='abandoned'){
      dir.innerHTML=`<div class="t-fim fundo"><p>O outro jogador fugiu antes de aceitar. Sua carta voltou para você.</p></div><button class="r-bt chanfro t-volta">Voltar ao corredor</button>`;
      dir.querySelector('.t-volta').onclick=sai;
    }else{
      const canal=e==='negotiating';
      dir.innerHTML=`<div class="t-chat" role="log" aria-label="Conversa da sala"></div>
        <div class="t-frases" role="group" aria-label="Frases prontas"></div>
        <form class="t-form"><input maxlength="120" autocomplete="off" aria-label="Sua mensagem" placeholder="${canal?'Negocie, convença… ou minta.':'O canal abre quando alguém sentar.'}" ${canal?'':'disabled'}><button class="r-bt chanfro" ${canal?'':'disabled'}>Enviar</button></form>
        ${e==='revealing'?'<p class="t-sub">As duas cartas viram ao mesmo tempo.</p>':`<button class="r-bt chanfro t-aceita" ${canal&&!s.aceitei?'':'disabled'}>${s.aceitei?'Aceito':'Aceitar troca'}</button>`}`;
      const ch=dir.querySelector('.t-chat');
      if(!s.chat.length&&!s.digitando)ch.innerHTML=`<p class="m-nada">${s.par?'Ninguém disse nada ainda.':'Ninguém na sala ainda.'}</p>`;
      s.chat.forEach(m=>{const d=document.createElement('div');d.className='m-bolha '+(m.de==='eu'?'eu':'ele');d.textContent=m.t;ch.append(d)});
      if(s.digitando)ch.insertAdjacentHTML('beforeend','<div class="m-bolha ele m-pontos" aria-label="Digitando"><u></u><u></u><u></u></div>');
      ch.scrollTop=ch.scrollHeight;
      const fr=dir.querySelector('.t-frases');
      if(canal)TROCA_FRASES.forEach(t=>{const b=document.createElement('button');b.type='button';b.className='chanfro';b.textContent=t;b.onclick=()=>envia(t);fr.append(b)});
      dir.querySelector('.t-form').onsubmit=ev=>{ev.preventDefault();envia(ev.target.querySelector('input').value)};
      const ac=dir.querySelector('.t-aceita');if(ac)ac.onclick=aceita;
    }
  }
  corredor();
  // só para as capturas de teste: já abre uma sala em certa etapa
  const t=q.get('troca');
  if(t&&temCarta()){entra(2);if(t==='mesa')coloca(CARTAS.find(c=>TENHO[c.id]))}
}
