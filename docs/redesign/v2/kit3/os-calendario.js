// Grandioso Calendário Devo dentro do sistema. Falas, ciclo de 7 dias e eventos são os do jogo (docs/redesign/CALENDARIO-dono.md,
// lib/devo/calendario.ts e a migração). A presença fica guardada no aparelho; no jogo, o servidor marca e entrega.
const CAL_CICLO=[{t:'50 PP',v:'50',l:'PP',i:'pp'},{t:'75 PP',v:'75',l:'PP',i:'pp'},{t:'+2 Fragmentos Arcanos',v:'+2',l:'Fragm. Arcanos',i:'fragmento'},{t:'+2 Horas',v:'+2h',l:'Horas',i:'ampulheta'},{t:'+5 Dracmas Comuns',v:'+5',l:'Dracmas Comuns',i:'dracma-comum'},{t:'+2 Dracmas Incomuns',v:'+2',l:'Dracmas Incomuns',i:'dracma-incomum'},{t:'Carta Incomum',v:'1',l:'Carta Incomum',i:'carta-incomum'}];
const CAL_NOTA={pp:'Os Pontos de Potencial seguem para as suas Virtudes.',ampulheta:'O tempo já entrou no seu pulso.','carta-incomum':'A carta foi para o seu inventário.'};
// todos os prêmios usam os ícones pintados do jogo (sem pixel)
const calIco=(i,t)=>`../../../../public/images/calendario/icones/${i}-${t}.webp`;
const CAL_ROT={atencao:'Fique atento',folga:'Dia de folga',normal:'Programado'};
const CAL_EVENTOS=[
  {t:'Halloween',d:'Máscaras demais pelas ruas. Repare em quem está por trás delas.',m:10,a:31,e:'atencao',arte:'halloween'},
  {t:'Natal',d:'As luzes ficam acesas até tarde e quase ninguém tem pressa.',m:12,a:25,e:'folga',arte:'natal'},
  {t:'Carnaval',d:'Quatro dias de festa pelas ruas.',ano:2027,m:2,a:6,dias:4,e:'folga',arte:'carnaval'},
  {t:'Festa Junina',d:'Fogueira, quadrilha e bandeirinhas.',m:6,a:24,e:'folga',arte:'junina'},
];
const CAL_MESES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const CAL_CENA=[
  ['animado','Bem-vindo ao Grandioso Calendário Devo!!!'],
  ['pensativo','Muito tempo atrás, dizem que um Record perdeu o dia de seu grande encontro. E desde então, nós passamos a prestar bastante atenção nas datas.'],
  ['explica','O calendário serve como um guia intuitivo de eventos importantes já programados que estão para acontecer.'],
  ['apresenta','É sempre bom conferi-lo para saber em quais dias deve ficar atento e quais dias você tem mais folga!',true],
  ['explica','Além disso, o Grande Calendário Devo também conta com um sistema de Check-in Diário nativo. Toda vez que você ficar online, deve marcar ao menos uma vez para resgatar sua recompensa de presença.'],
  ['convite','Em datas comemorativas, é provável que mais de um tipo de check-in apareça…'],
  ['riso','Agora pronto. Você já sabe de tudo. Te desejo um bom Carnaval, Festa Junina, Halloween, Natal e muito mais!!!'],
];
const calDia=(y,m,d)=>new Date(y,m-1,d);
const calHoje=()=>{const n=new Date();return calDia(n.getFullYear(),n.getMonth()+1,n.getDate())};
// a próxima ocorrência de cada evento (anuais repetem; o que está acontecendo conta como agora)
function calProxima(ev,h){
  const dias=ev.dias||1;
  for(let y=h.getFullYear();y<=h.getFullYear()+2;y++){
    if(ev.ano&&y!==ev.ano)continue;
    const i=calDia(y,ev.m,ev.a),f=new Date(i.getTime()+(dias-1)*864e5);
    if(f>=h)return {ev,i,f};
  }
  return null;
}
function calEventosEm(d){
  return CAL_EVENTOS.filter(ev=>{
    if(ev.ano&&ev.ano!==d.getFullYear())return false;
    const i=calDia(d.getFullYear(),ev.m,ev.a),f=new Date(i.getTime()+((ev.dias||1)-1)*864e5);
    return d>=i&&d<=f;
  });
}
const calQuando=(p,h)=>{const n=Math.round((p.i-h)/864e5);return n<0||(n===0&&p.f>h)?'Acontecendo agora':n===0?'Hoje':n===1?'Amanhã':`Em ${n} dias`};
const calChave=d=>`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
function montaCalendario(raiz){
  let g={pos:0,ultimo:null,visto:false};try{Object.assign(g,JSON.parse(localStorage.getItem('devo-cal')))}catch{}
  const grava=()=>{try{localStorage.setItem('devo-cal',JSON.stringify(g))}catch{}};
  const h=calHoje();
  let ano=h.getFullYear(),mes=h.getMonth()+1,sel=null,vista=q.get('calv')||'semana';
  const anoMin=ano*12+mes-1,anoMax=anoMin+14;
  function pinta(){
    const feito=g.ultimo===calChave(h),pos=g.pos%7,atual=feito?(g.pos-1+7)%7:pos;
    const prox=CAL_EVENTOS.map(e=>calProxima(e,h)).filter(Boolean).sort((a,b)=>a.i-b.i);
    const dest=prox[0],falta=dest?Math.max(0,Math.round((dest.i-h)/864e5)):0;
    const amanha=new Date(h.getTime()+864e5),hrs=Math.max(0,Math.ceil((amanha-new Date())/36e5));
    const hoje=CAL_CICLO[atual],feitos=feito?atual+1:atual;
    const NOMES=['Potencial','Potencial maior','Fragmentos','Ampulheta','Dracmas','Dracmas de prata','Carta selada'];
    // no modo do roster de Reverse: 1999 (pin do dono): folha de papel à esquerda, cartas altas à direita
    const EN=['Potential','Greater Potential','Arcane Shards','Hourglass','Drachmas','Silver Drachmas','Sealed Card'];
    const COR=['#6b5a8e','#6b5a8e','#7a4a8e','#8a6a3a','#7a5a3a','#6a6a72','#8a3a2a'];
    const amanhaC=CAL_CICLO[(atual+1)%7];
    // fiel ao roster de Reverse: 1999 (pin do dono): barra de recursos, folha cinza-creme à esquerda, filtros em etiqueta, cartas altas em duas fileiras
    raiz.innerHTML=`
      <div class="r19">
        <div class="r19-top">
          <button class="r19-volta" aria-label="Fechar o Calendário">◁</button>
          <span class="r19-rec"><img src="${calIco('fragmento',64)}" alt=""><b>64</b></span><span class="r19-rec"><img src="${calIco('dracma-comum',64)}" alt=""><b>15</b></span>
          <div class="r19-abas" role="tablist">${[['semana','Semana'],['eventos','Eventos'],['mes','Mês']].map(([k,r])=>`<button role="tab" data-v="${k}" aria-selected="${vista===k}">${r}<i></i></button>`).join('')}<button class="r19-tudo k-mel" aria-label="Rever a apresentação da Melissa">Melissa</button></div>
        </div>
        <section class="r19-papel">
          <span class="r19-arco e" aria-hidden="true"></span><span class="r19-arco d" aria-hidden="true"></span>
          <div class="r19-tri"><svg viewBox="0 0 200 176" aria-hidden="true"><path d="M100 6 L194 170 H6 Z" class="o"/><path d="M100 22 L180 162 H20 Z" class="m"/><path d="M14 162 H186" class="base"/><circle cx="34" cy="160" r="3" class="pt"/><circle cx="166" cy="160" r="3" class="pt"/></svg><img src="${calIco(hoje.i,256)}" alt=""></div>
          <p class="r19-lv"><span>Dia.</span> ${atual+1}<i>/</i>7</p>
          <hr class="r19-pont">
          <div class="r19-itens">
            <span><i><img src="${calIco(hoje.i,64)}" alt=""></i><b>${hoje.v}</b><small>Hoje</small></span>
            <span><i><img src="${calIco(amanhaC.i,64)}" alt=""></i><b>${amanhaC.v}</b><small>Amanhã</small></span>
          </div>
          ${feito?`<p class="r19-ok">Presença marcada · a próxima abre em ${hrs} ${hrs===1?'hora':'horas'}</p>`:`<button class="r19-bt k-marca" aria-label="Marcar presença: ${hoje.t}"><span>Marcar presença</span><small>CHECK-IN</small><i></i></button>`}
          <p class="r19-nota">Perdeu um dia? O ciclo espera e continua de onde parou.</p>
        </section>
        <section class="r19-dir">
          ${vista==='semana'?`<ul class="r19-cartas">${CAL_CICLO.map((c,i)=>{const est=i<atual||(feito&&i===atual)?'feito':i===atual?'hoje':'';return `<li class="r19-c ${est}${i===6?' ouro':''}" style="--tinta-c:${COR[i]}"><span class="r19-arte" style="--arte:url(art/os/cal/dia-${i+1}.webp)"></span><i class="r19-ic"><img src="${calIco(c.i,64)}" alt=""></i>${est==='hoje'?'<em class="r19-new">HOJE</em>':i>atual?'<em class="r19-new suave">NEW</em>':''}${est==='feito'?'<span class="r19-faixa">Resgatado</span>':''}<span class="r19-pe"><small>Dia. ${i+1}</small><b>${c.v} ${c.l}</b><u>${EN[i]}</u></span></li>`}).join('')}</ul>`:''}
          ${vista==='eventos'?`<ul class="r19-cartas r19-evs">${prox.map(p=>`<li class="r19-c ev ${p.ev.e}" style="--tinta-c:${p.ev.e==='atencao'?'#8a3a2a':'#3a5a4a'}"><span class="r19-arte" style="--arte:url(art/os/eventos/${p.ev.arte}.png)"></span><i class="r19-ic"><img src="${calIco('presente',64)}" alt=""></i><em class="r19-new">${calQuando(p,h).toUpperCase()}</em><span class="r19-pe"><small>${String(p.i.getDate()).padStart(2,'0')} ${CAL_MESES[p.i.getMonth()].slice(0,3)}</small><b>${p.ev.t}</b><u>${CAL_ROT[p.ev.e]}</u></span></li>`).join('')}</ul>`:''}
          ${vista==='mes'?`<div class="r19-mes">
            <div class="k-mes"><button class="kc-nav" id="k-ant" aria-label="Mês anterior" ${ano*12+mes-1<=anoMin?'disabled':''}><svg class="seta" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button><strong>${CAL_MESES[mes-1]} <span>${ano}</span></strong><button class="kc-nav" id="k-prox" aria-label="Próximo mês" ${ano*12+mes-1>=anoMax?'disabled':''}><svg class="seta" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button></div>
            <div class="k-semana" aria-hidden="true">${['D','S','T','Q','Q','S','S'].map(x=>`<span>${x}</span>`).join('')}</div>
            <div class="k-grade" role="grid" aria-label="${CAL_MESES[mes-1]} de ${ano}"></div>
            <div class="kc-leg" aria-hidden="true"><span class="folga">Dia de folga</span><span class="atencao">Fique atento</span><span class="hoje">Hoje</span></div>
            <div class="k-dia" id="k-dia"></div></div>`:''}
        </section>
        <p class="r19-rodape">Grandioso Calendário Devo · ciclo de 7 dias · as datas seguem o horário de Brasília</p>
      </div>`;
    raiz.querySelector('.r19-volta').onclick=()=>fecha('calendario');
    raiz.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{vista=b.dataset.v;pinta()});
    if(vista!=='mes'){raiz.querySelector('.k-mel').onclick=()=>cena(raiz.closest('.jan'));const m=raiz.querySelector('.k-marca');if(m)m.onclick=()=>marca(atual);return}
    const gr=raiz.querySelector('.k-grade'),ini=calDia(ano,mes,1).getDay(),tot=new Date(ano,mes,0).getDate();
    for(let i=0;i<ini;i++)gr.insertAdjacentHTML('beforeend','<span></span>');
    for(let d=1;d<=tot;d++){
      const dt=calDia(ano,mes,d),evs=calEventosEm(dt),b=document.createElement('button');
      b.className='k-d'+(calChave(dt)===calChave(h)?' hoje':'')+(evs.length?` ev ${evs[0].e}`:'')+(sel===calChave(dt)?' sel':'');
      b.innerHTML=`<span>${d}</span>`+(evs.length?`<i style="--arte:url(art/os/eventos/${evs[0].arte}.png)"></i>`:'');b.setAttribute('aria-label',`${d} de ${CAL_MESES[mes-1]}${evs.length?`: ${evs[0].t}`:''}`);
      b.onclick=()=>{sel=calChave(dt);pintaDia(dt);gr.querySelectorAll('.sel').forEach(x=>x.classList.remove('sel'));b.classList.add('sel')};
      gr.append(b);
    }
    raiz.querySelector('.k-mel').onclick=()=>cena(raiz.closest('.jan'));
    const m=raiz.querySelector('.k-marca');if(m)m.onclick=()=>marca(atual);
    const anda=n=>{const t=ano*12+mes-1+n;ano=Math.floor(t/12);mes=t%12+1;sel=null;const y=raiz.closest('.corpo').scrollTop;pinta();raiz.closest('.corpo').scrollTop=y};
    raiz.querySelector('#k-ant').onclick=()=>anda(-1);raiz.querySelector('#k-prox').onclick=()=>anda(1);
  }
  function pintaDia(dt){
    const c=raiz.querySelector('#k-dia'),evs=calEventosEm(dt);
    c.innerHTML=evs.length?evs.map(e=>`<div class="kc-diaev" style="--arte:url(art/os/eventos/${e.arte}.png)"><em class="${e.e}">${CAL_ROT[e.e]}</em><strong>${e.t}</strong><p>${e.d}</p></div>`).join(''):`<p class="kc-nada">${dt.getDate()} de ${CAL_MESES[dt.getMonth()]} · Nenhum evento programado.</p>`;
  }
  function marca(i){
    g.pos++;g.ultimo=calChave(h);grava();
    const c=CAL_CICLO[i],o=document.createElement('button');
    o.className='k-revela kc-revela';o.innerHTML=`<span class="kc-raio" aria-hidden="true"></span><small class="kc-rv-k">Presença marcada · Dia ${i+1}</small><img src="${calIco(c.i,256)}" alt=""><strong>${c.t}</strong><p>${CAL_NOTA[c.i]||'Guardado no seu inventário.'}</p><small>Toque para continuar</small>`;
    o.onclick=()=>{o.remove();pinta()};
    raiz.closest('.jan').append(o);o.focus();
    if(c.i==='carta-incomum'&&CARTAS){const x=CARTAS.find(k=>k.rar==='incomum');if(x){if(TENHO[x.id])TENHO[x.id][0]++;else TENHO[x.id]=[1,'Calendário']}}
  }
  /* a apresentação da Melissa: a cena de diálogo aprovada, dentro da janela */
  async function cena(jan){
    if(jan.querySelector('.k-cena'))return;
    const meta=await fetch('art/anim.json').then(r=>r.json()).catch(()=>({}));
    const o=document.createElement('div');o.className='k-cena';o.setAttribute('role','dialog');o.setAttribute('aria-label','Apresentação da Melissa');
    o.innerHTML=`<button class="k-pula chanfro">Pular</button><div class="k-balao"><b>Melissa</b><p aria-live="polite"></p><i aria-hidden="true"></i></div><div class="k-natal" hidden><img src="art/os/eventos/natal.png" alt=""><div><small>Exemplo · Dia de folga</small><strong>Natal</strong></div></div><div class="k-fig"><img class="b" alt=""><img class="c p" alt="" hidden><img class="c m" alt="" hidden></div>`;
    jan.append(o);
    let n=0,tid,flap,pis,txt='',k=0;
    const fim=()=>{clearInterval(tid);clearInterval(flap);clearTimeout(pis);o.remove();g.visto=true;grava()};
    const $o=s=>o.querySelector(s),rapido=parado||q.has('semraf');
    const acaba=()=>{clearInterval(tid);clearInterval(flap);$o('.m').hidden=true;$o('.k-balao p').textContent=txt;k=txt.length;$o('.k-balao i').hidden=false};
    function mostra(){
      const [pose,t,natal]=CAL_CENA[n],m=meta[pose]||{};
      $o('.b').src=`art/melissa-q-${pose}.png`;
      $o('.p').hidden=true;$o('.m').hidden=true;
      if(m.pisca)$o('.p').src=`art/anim/${pose}-pisca.png`;
      if(m.boca)$o('.m').src=`art/anim/${pose}-boca.png`;
      $o('.k-natal').hidden=!natal;
      txt=t;k=0;$o('.k-balao i').hidden=true;clearInterval(tid);clearInterval(flap);
      if(rapido)return acaba();
      $o('.k-balao p').textContent='';
      tid=setInterval(()=>{$o('.k-balao p').textContent=t.slice(0,++k);if(k>=t.length)acaba()},26);
      if(m.boca)flap=setInterval(()=>{$o('.m').hidden=!$o('.m').hidden},110);
    }
    const pisca=()=>{const m=meta[CAL_CENA[n][0]]||{};if(m.pisca){$o('.p').hidden=false;setTimeout(()=>{if(o.isConnected)$o('.p').hidden=true},110)}if(o.isConnected)pis=setTimeout(pisca,2200+Math.random()*2800)};
    if(!rapido)pis=setTimeout(pisca,2000);
    o.addEventListener('click',e=>{
      if(e.target.closest('.k-pula'))return fim();
      if(k<txt.length)return acaba();
      n++;if(n>=CAL_CENA.length)return fim();
      mostra();
    });
    mostra();
    if(q.has('cenapasso')){n=+q.get('cenapasso');mostra()}
  }
  pinta();
  if(!g.visto&&!q.has('semraf')||q.has('cena'))cena(raiz.closest('.jan'));
}
