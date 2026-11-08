/* ---- Virtudes: os seis naipes como constelação em volta do Arcano, no modo dos Traços de Honkai: Star Rail.
   Tudo em palavras, sem número de P.P. (regra do dono). Dados de exemplo; no jogo vêm de /api/virtudes.
   ?virt=sem-arcano mostra o jogador sem Arcano; ?virt=limite, o Estágio cheio. ---- */
const VIR_NAIPES={
  paus:{nome:'Paus',n:1,antiga:false,texto:'Aumenta sua resistência e vigor.'},
  copas:{nome:'Copas',n:2,antiga:false,texto:'Seu corpo, melhorando força e velocidade.'},
  ouros:{nome:'Ouros',n:3,antiga:false,texto:'Aprimorando sua mente, seja lá o que isso signifique.'},
  espadas:{nome:'Espadas',n:4,antiga:false,texto:'Aumenta seus reflexos e capacidade motora.'},
  tacas:{nome:'Taças',n:5,antiga:true,texto:'Dizem que aumenta seu domínio sobrenatural.'},
  escudos:{nome:'Escudos',n:6,antiga:true,texto:'Dizem que aumenta sua influência.'},
};
const VIR_ORDEM=['paus','copas','ouros','espadas','tacas','escudos'];
// textos do doc do dono, literais (lib/devo/virtudes.ts)
const VIR_TX={
  abertura:'As Seis Virtudes são uma série de caminhos que um indivíduo pode seguir em busca de autoaprimoramento, adquirindo capacidades especiais físicas, mentais e até espirituais.',
  naipes:'Elas são representadas pelos quatro naipes originais de um baralho — Paus, Ouros, Copas e Espadas — além de outros dois, menos conhecidos e originados de baralhos antigos: Taças e Escudos.',
  misterio:'O que cada Virtude faz exatamente é um mistério, mas existem certas bases claras.',
  antigas:'Os outros dois extras são ainda mais vagos.',
  antigasFim:'Ainda assim, é um total mistério que o atual nível de informação não te permite entender totalmente.',
  potencial:'Eles aumentam sistematicamente com base nos jogos que você participa e no tipo de coisas que faz. Quando chega o momento de Evolução de Estágio, seu corpo reconstrói, e a porcentagem se espalha entre os atributos, mostrando qual evoluiu mais e qual evoluiu menos.',
  controle:'Se não entendeu, apenas saiba que seus atributos mudam por estágio, e você não está no controle disso.',
  metamorfose:'É como metamorfose. Você recolhe nutrientes o suficiente para passar pela transformação, e quanto mais você coleta, melhor.',
  limite:'Contudo, há um limite claro que te impede de coletar demais. Um limite definido pelo Estágio.',
  fecho:'Seja um destaque naquilo que faz de melhor e não se compare aos outros.',
};
const VIR_AF={excelente:['Excelente',5,'O caminho mais natural do seu Arcano.'],favorecida:['Favorecida',4,'Cresce com pouca resistência.'],regular:['Regular',3,'Nem dom, nem obstáculo.'],dificil:['Difícil',2,'Pede mais do que devolve.'],deficiente:['Deficiente',1,'Seu Arcano mal a sustenta.']};
const VIR_ACUMULO=['Quase nada acumulado','Pouco acumulado','Acumulando','Muito acumulado','Perto do limite'];
const VIR_ROMANO=['0','I','II','III','IV','V','VI','VII'];
// desenhos dos naipes (components/devo/virtudes/naipes.tsx), viewBox 48
const virCirc=(cx,cy,r)=>`M${cx-r} ${cy}a${r} ${r} 0 1 0 ${2*r} 0a${r} ${r} 0 1 0 ${-2*r} 0Z`;
const VIR_PATH={
  paus:virCirc(24,14.5,7.6)+virCirc(14.2,25.6,7.6)+virCirc(33.8,25.6,7.6)+'M24 17L15.5 27.5L32.5 27.5Z'+'M21.8 26Q22.4 36.5 16.5 42.5L31.5 42.5Q25.6 36.5 26.2 26Z',
  copas:'M24 41.5C14 33.5 6 27.2 6 18.6C6 12.5 10.6 8 16.1 8C19.7 8 22.5 10 24 13.1C25.5 10 28.3 8 31.9 8C37.4 8 42 12.5 42 18.6C42 27.2 34 33.5 24 41.5Z',
  ouros:'M24 4.5Q29.6 16.6 39.5 24Q29.6 31.4 24 43.5Q18.4 31.4 8.5 24Q18.4 16.6 24 4.5Z',
  espadas:'M24 4.5C30 12.8 41 18.6 41 27.4C41 32.4 37.2 35.8 32.7 35.8C29.7 35.8 27.3 34.5 25.8 32.4C26.3 36.5 28.2 39.6 31.4 42.5L16.6 42.5C19.8 39.6 21.7 36.5 22.2 32.4C20.7 34.5 18.3 35.8 15.3 35.8C10.8 35.8 7 32.4 7 27.4C7 18.6 18 12.8 24 4.5Z',
  tacas:'M9.5 7.5H38.5C38.5 19.5 32.6 26.6 26.1 28.3V34.4C26.1 36.6 29 38 33 39.2V42.5H15V39.2C19 38 21.9 36.6 21.9 34.4V28.3C15.4 26.6 9.5 19.5 9.5 7.5Z',
  escudos:'M24 4.5L39.5 9.6V21.8C39.5 31.8 32.6 38.9 24 43.5C15.4 38.9 8.5 31.8 8.5 21.8V9.6Z',
};
const virNaipe=(k,cl='')=>`<svg class="v-naipe ${cl}" viewBox="0 0 48 48" aria-hidden="true"><path d="${VIR_PATH[k]}"/></svg>`;
const virLosangos=n=>`<span class="v-los" aria-hidden="true">${[0,1,2,3,4].map(i=>`<i${i<n?' class="on"':''}></i>`).join('')}</span>`;

function virDados(){
  const modo=q.get('virt');
  const semArcano=modo==='sem-arcano';
  // afinidade do Arcano da Força (lib/devo/virtudes-afinidades.json): 1 excelente … 6 deficiente
  const ordem={copas:1,paus:2,espadas:3,escudos:4,tacas:5,ouros:6};
  const af=o=>o<=1?'excelente':o===2?'favorecida':o<=4?'regular':o===5?'dificil':'deficiente';
  return {
    arcano:semArcano?null:{numeral:'XI',nome:'A Força',titulo:'Arcano da Força'},
    estagio:semArcano?0:2,
    afinidade:Object.fromEntries(VIR_ORDEM.map(k=>[k,semArcano?null:af(ordem[k])])),
    acumulo:modo==='limite'?{nivel:4,cheio:true}:{nivel:2,cheio:false},
    tendencia:'paus',
    evolucoes:semArcano?[]:[
      {at:new Date(2026,9,18),de:1,para:2,arcano:'Arcano da Força',mais:'copas',menos:'ouros'},
      {at:new Date(2026,8,30),de:0,para:1,arcano:'Arcano da Força',mais:null,menos:null},
    ],
  };
}

function montaVirtudes(raiz){
  const d=virDados();
  let sel=d.tendencia&&d.afinidade[d.tendencia]?d.tendencia:VIR_ORDEM.find(k=>d.afinidade[k]==='excelente')||'paus';
  const dataFmt=new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',year:'numeric'});
  const acesos=d.acumulo.cheio?5:d.acumulo.nivel===0?0:d.acumulo.nivel+1;
  const rotulo=d.acumulo.cheio?'No limite do Estágio':VIR_ACUMULO[d.acumulo.nivel];
  // seis pontos num hexágono, começando no alto
  const pos=VIR_ORDEM.map((k,i)=>{const a=(i*60-90)*Math.PI/180;return [50+Math.cos(a)*38,50+Math.sin(a)*38]});
  raiz.innerHTML=`
    <section class="v-ceu" aria-label="${d.arcano?`${d.arcano.titulo}, Estágio ${VIR_ROMANO[d.estagio]}`:'Arcano não revelado'}">
      <svg class="v-linhas" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="46" class="v-anel"/><circle cx="50" cy="50" r="38" class="v-anel v-anel2"/>
        <polygon points="${pos.map(p=>p.join(',')).join(' ')}" class="v-hex"/>
        ${pos.map((p,i)=>`<line x1="50" y1="50" x2="${p[0]}" y2="${p[1]}" class="v-raio" data-k="${VIR_ORDEM[i]}"/>`).join('')}
      </svg>
      <div class="v-centro">
        <small>Arcano</small>
        <b>${d.arcano?d.arcano.numeral:'?'}</b>
        <strong>${d.arcano?d.arcano.nome:'Não revelado'}</strong>
        <em>Estágio ${VIR_ROMANO[d.estagio]}</em>
      </div>
      ${VIR_ORDEM.map((k,i)=>{const a=d.afinidade[k];return `<button class="v-no ${a||'apagado'}" data-k="${k}" style="left:${pos[i][0]}%;top:${pos[i][1]}%" aria-pressed="false" aria-label="${VIR_NAIPES[k].nome}: ${a?'afinidade '+VIR_AF[a][0].toLowerCase():'afinidade desconhecida'}"><span class="v-disco">${virNaipe(k)}</span><span class="v-nome">${VIR_NAIPES[k].nome}</span>${virLosangos(a?VIR_AF[a][1]:0)}</button>`}).join('')}
    </section>
    ${d.arcano?'':'<p class="v-aviso" role="status">Sua afinidade aparece quando o Anfitrião registrar o seu Arcano.</p>'}
    <p class="v-abertura">${VIR_TX.abertura}</p>
    <article class="v-detalhe" aria-live="polite"></article>
    <section class="v-pp" aria-labelledby="v-pp-t">
      <div class="v-cab"><small>Pontos de Potencial · Estágio ${VIR_ROMANO[d.estagio]}</small><h3 id="v-pp-t">${rotulo}</h3></div>
      <div class="v-barra" role="img" aria-label="Acúmulo do Estágio: ${rotulo.toLowerCase()}">${[0,1,2,3,4].map(i=>`<i${i<acesos?' class="on"':''}></i>`).join('')}<u class="${d.acumulo.cheio?'on':''}"></u></div>
      <div class="v-legenda"><span>Pouco</span><span>Limite do Estágio</span></div>
      <p>${d.estagio>=7?'Último Estágio. O corpo não tem para onde se transformar.':'Na próxima Evolução de Estágio do seu Arcano, paga com Fragmentos Arcanos na tela dos Arcanos, o que você acumulou se espalha pelas Virtudes.'}</p>
      ${d.tendencia?`<p class="v-tend">${virNaipe(d.tendencia,'mini')}<span>Seu esforço tem pendido para <b>${VIR_NAIPES[d.tendencia].nome}</b>.</span></p>`:''}
      <details class="v-como"><summary>Como funciona</summary><p>${VIR_TX.potencial}</p><p>${VIR_TX.metamorfose} ${VIR_TX.limite}</p><p class="v-it">${VIR_TX.controle}</p></details>
    </section>
    <button class="v-arcano" data-ir="arcanos"><span class="v-arc-ic"><img src="${px('arcanos')}" alt=""></span><span><small>${d.arcano?'Seu Arcano':'Arcanos'}</small><strong>${d.arcano?`${d.arcano.numeral} · ${d.arcano.nome}`:'Os vinte e dois'}</strong></span><em>Abrir Arcanos <svg class="seta" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></em></button>
    <section class="v-sobre" aria-labelledby="v-sobre-t">
      <h3 class="sec" id="v-sobre-t"><span>Os seis caminhos</span></h3>
      <p>${VIR_TX.naipes}</p>
      <p>${VIR_TX.misterio}</p>
    </section>
    <section class="v-hist" aria-labelledby="v-hist-t">
      <h3 class="sec" id="v-hist-t"><span>Evoluções de Estágio</span></h3>
      ${d.evolucoes.length?`<ol>${d.evolucoes.map(e=>`<li><b>${VIR_ROMANO[e.para]}</b><div><strong>Estágio ${VIR_ROMANO[e.de]} → ${VIR_ROMANO[e.para]}</strong><small>${dataFmt.format(e.at)}${e.arcano?' · '+e.arcano:''}</small>${e.mais&&e.menos?`<p><span>${virNaipe(e.mais,'mini')}Mais cresceu: <em>${VIR_NAIPES[e.mais].nome}</em></span><span>${virNaipe(e.menos,'mini apagado')}Menos: <em>${VIR_NAIPES[e.menos].nome}</em></span></p>`:'<p class="v-it">Nada acumulado para espalhar nesta metamorfose.</p>'}</div></li>`).join('')}</ol>`:'<p class="v-it">Nenhuma metamorfose ainda. O corpo continua no primeiro Estágio que conheceu.</p>'}
    </section>
    <p class="v-fecho">${VIR_TX.fecho}</p>`;

  function detalhe(){
    const v=VIR_NAIPES[sel],a=d.afinidade[sel];
    raiz.querySelectorAll('.v-no').forEach(b=>{const on=b.dataset.k===sel;b.classList.toggle('sel',on);b.setAttribute('aria-pressed',on)});
    raiz.querySelectorAll('.v-raio').forEach(l=>l.classList.toggle('sel',l.dataset.k===sel));
    raiz.querySelector('.v-detalhe').innerHTML=`
      <header><span class="v-disco ${a||'apagado'}">${virNaipe(sel)}</span><div><small>Virtude nº ${v.n}${v.antiga?' · antiga':''}</small><h3>${v.nome}</h3></div>
        <span class="v-af ${a||''}">${virLosangos(a?VIR_AF[a][1]:0)}${a?VIR_AF[a][0]:'Desconhecida'}</span></header>
      <p>${v.texto}</p>
      ${a?`<p class="v-it">${VIR_AF[a][2]}</p>`:''}
      ${v.antiga?`<p class="v-nota">${VIR_TX.antigas} ${VIR_TX.antigasFim}</p>`:''}
      ${d.tendencia===sel?'<p class="v-tag">Para onde seu esforço tem ido</p>':''}`;
  }
  raiz.querySelectorAll('.v-no').forEach(b=>b.onclick=()=>{sel=b.dataset.k;detalhe()});
  raiz.querySelector('.v-arcano').onclick=()=>abre(SISTEMAS.find(a=>a.id==='arcanos'));
  detalhe();
}
