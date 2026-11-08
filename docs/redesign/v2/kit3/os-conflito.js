/* ---- Evento de Conflito (Rup, NOTAS-RUP-02-11.md item 8): Companhia de Despertados × Ordem Ortodoxa.
   Direção de arte "Dossiê e Grimório" (crítico de arte, 03/11, depois de o dono achar a primeira versão genérica):
   uma mesa à noite partida por uma fenda. Do lado de cá, o dossiê da Companhia (papel de ofício, aço, carimbo, prata,
   luz fria); do lado de lá, o grimório da Ordem (pergaminho, veludo, cera, ouro gasto, vela). A ampulheta fica na fenda.
   Sem lado escolhido a tela é de ferro e névoa; escolhido um lado, tudo troca de material (#cf[data-lado]).
   Textos do Rup literais. Abas: Conheça, Marcos, Loja de Karma. Dados de exemplo guardados no aparelho.
   Teste: ?conf=companhia|ordem entra com um lado; ?apuracao=1 mostra o placar aberto (como num sábado). ---- */
const CONF_TX={
  abertura:'Toda temporada, você poderá escolher um lado e participar de uma disputa pelo domínio de todo o Devo. Cada organização acumula pontos e influência conforme a participação de seus afiliados. O objetivo é superar o adversário e conquistar a supremacia ao final da temporada.',
  pergunta:'Qual delas poderá contar com o seu apoio? E, afinal, qual delas está certa?',
  marcos:['Escolher um lado não significa apenas participar de uma disputa. Durante o evento, cada organização terá uma série de objetivos coletivos conhecidos como Marcos.',
    'Ao atingir determinadas metas de Karma, os afiliados contribuem para desbloquear premiações globais exclusivas. Essas recompensas variam de acordo com a organização escolhida e mudam a cada temporada.',
    'Portanto, reunir seus companheiros, movimentar a comunidade e contribuir para o progresso do seu lado será fundamental.'],
  apuracao:'Todos os sábados, será revelada a quantidade de Karma acumulada por cada organização durante a semana. Após a divulgação, os resultados voltarão a ficar ocultos até a próxima apuração, preservando a imprevisibilidade da disputa.',
  loja:['Utilize o Karma individual acumulado para adquirir produtos exclusivos da organização escolhida. Cada loja possui itens próprios, alguns dos quais apresentam um limite universal de compras.',
    'As mercadorias disponíveis não são necessariamente permanentes. Aproveite enquanto estiverem em estoque!'],
  troca:'Caso o Record selecione uma organização diferente daquela à qual esteve afiliado anteriormente, um aviso será apresentado antes da confirmação.',
  fidelidade:'Para manter acesso a determinadas funções especiais, você precisa preservar sua fidelidade a uma mesma organização durante três temporadas consecutivas. Trocar de lado antes de cumprir esse requisito poderá resultar em uma penalidade de Karma.',
  certeza:'Tem certeza de que deseja trocar de lado?',
};
const CONF_LADOS={
  companhia:{nome:'Companhia de Despertados',curto:'Companhia',karma:'Karma da Companhia',
    texto:['Com fundadores completamente desconhecidos, a Companhia de Despertados foi criada há pouco mais de cem anos, com o propósito de superar os métodos ultrapassados da Ordem Ortodoxa.',
      'A organização prioriza a sobrevivência da humanidade como um todo, intervindo contra aqueles que ousam transgredir suas regras. Funcionando como uma grande empresa, a Companhia procura auxiliar Records menos experientes, desenvolver seus talentos e eliminar qualquer ameaça ao equilíbrio do mundo — fiscalizando até mesmo as Corporações mais antigas e poderosas.',
      'É amplamente reconhecida como uma das poucas instituições com autoridade efetiva sobre os demais participantes do Devo, sendo frequentemente comparada a um órgão público ou fiscalizador.',
      'Seus princípios são fundamentados no progresso, na segurança controlada e na manutenção da ordem estabelecida. Afinal, a Companhia nasceu para eliminar todos aqueles que ameaçam esses valores.'],
    marcos:[[10000,['+100 horas de Tempo.']],[15000,['10 Dracmas Comuns.','01 Pacote Raro.']],[20000,['01 Pacote Especial da Companhia de Despertados (Raro).','01 Música de Interface.']],[30000,['20 Fragmentos Arcanos.']],[40000,['Moldura temporária de Campeão (concedida ao primeiro lado que alcançar a meta).','+150 horas de Tempo.','01 Carta Rara garantida de um Pacote da Companhia de Despertados.']]],
    loja:[['melissa-brinquedo','Melissa de Brinquedo',25,'Um presente bastante popular, com alta taxa de aceitação entre os NPCs. Não pode ser oferecido a personagens vinculados à Ordem Ortodoxa.',700],
      ['chiclete-azul','Chiclete Azul',200,'Recupera +2 horas de Tempo.',75],
      ['pacote-companhia','Pacote da Companhia',40,'Contém cartas pertencentes a diferentes coleções. Algumas são exclusivas do Evento de Conflito.',1100],
      ['moldura-companhia','Moldura Definitiva da Companhia',8,'Uma moldura institucional exclusiva, reservada àqueles que conseguem arcar com seu preço elevado. Permanente.',2000],
      ['decoracao-patinho','Decoração de Patinho',12,'Uma decoração adorável que aumenta consideravelmente as chances de atrair NPCs com traços ordeiros para sua residência.',1600],
      ['fragmento-companhia','Grande Fragmento Arcano',6,'Um Grande Fragmento Arcano novinho em folha.',2500]]},
  ordem:{nome:'Ordem Ortodoxa',curto:'Ordem',karma:'Karma da Ordem',
    texto:['Muito antes da Companhia de Despertados existir e preparar o terreno para o futuro do Deadly Vote, já havia pessoas que lidavam com as mesmas circunstâncias sobrenaturais do mundo atual. Naquela época, o conhecimento era transmitido por meio de antigas famílias, tradições arcaicas e organizações milenares.',
      'Com a ascensão da Companhia, essas comunidades perderam parte de seu espaço e prestígio, passando a ser consideradas rudimentares, ultrapassadas ou até mesmo bárbaras em seus métodos.',
      'Aquelas que conseguiram sobreviver e preservar suas tradições acabaram formando o que conhecemos hoje como Ordem Ortodoxa: uma sociedade secreta de ocultistas que valoriza suas raízes acima de praticamente qualquer outra coisa.',
      'Seus objetivos vão muito além daqueles estabelecidos pela Companhia. Seus membros defendem a preservação de conhecimentos antigos, a autonomia de suas comunidades e a continuidade de práticas que consideram essenciais.',
      'Considerada hostil pela Companhia, a Ordem é frequentemente associada a atividades criminosas e enquadrada como uma organização terrorista. Entretanto, seus integrantes possuem uma visão bastante diferente sobre quem, de fato, representa a maior ameaça ao mundo.'],
    marcos:[[10000,['+100 horas de Tempo.']],[15000,['10 Dracmas Comuns.','01 Pacote Raro.']],[20000,['01 Pacote Especial da Ordem Ortodoxa (Raro).','01 Música de Interface.']],[30000,['20 Fragmentos Arcanos']],[40000,['Moldura temporária de Campeão (concedida ao primeiro lado que alcançar a meta).','+150 horas de Tempo.','01 Carta Rara garantida de um Pacote da Ordem Ortodoxa.']]],
    loja:[['amuleto-melissa','Amuleto de Melissa',25,'Um pequeno amuleto de aparência peculiar. Pode ser oferecido como presente a praticamente qualquer personagem, apresentando alta taxa de aceitação, exceto aqueles vinculados à Companhia de Despertados.',700],
      ['pastilha-carmesim','Pastilha Carmesim',200,'Recupera +2 horas de Tempo.',75],
      ['pacote-reliquias','Pacote de Relíquias',40,'Contém cartas pertencentes a diferentes coleções. Algumas são exclusivas do Evento de Conflito.',1100],
      ['selo-ordem','Selo Definitivo da Ordem',8,'Uma insígnia ritualística que representa a fidelidade às antigas tradições. Poucos conseguirão obtê-la devido ao seu preço elevado. Permanente.',2000],
      ['decoracao-corvo','Decoração de Corvo',12,'Um enfeite de aparência sombria que aumenta consideravelmente as chances de atrair NPCs com traços caóticos para sua residência.',1600],
      ['fragmento-ordem','Grande Fragmento Arcano',6,'Um Grande Fragmento Arcano novinho em folha.',2500]]},
};
// exemplo: última apuração (sábado) e o que já foi vendido na loja universal; no jogo, do servidor
const CONF_APURACAO={data:'sábado, 31 de outubro',companhia:17420,ordem:15980};
const CONF_VENDIDOS={'melissa-brinquedo':19,'chiclete-azul':112,'pacote-companhia':8,'moldura-companhia':8,'decoracao-patinho':3,'fragmento-companhia':2,'amuleto-melissa':21,'pastilha-carmesim':87,'pacote-reliquias':11,'selo-ordem':5,'decoracao-corvo':4,'fragmento-ordem':1};
const CONF_FIM=new Date(2026,10,29,23,59); // fim da temporada (exemplo)
const confImg=n=>`art/os/conflito/${n}.webp?v=2`;
const confMil=n=>n.toLocaleString('pt-BR');
const confLer=(k,pad)=>{try{const v=localStorage.getItem(k);return v===null?pad:JSON.parse(v)}catch{return pad}};
const confGrava=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
// ícone de cada prêmio dos Marcos, pela palavra do texto do Rup
const confPremio=(t,lado)=>/horas de Tempo/.test(t)?'p-tempo':/Dracma/.test(t)?'p-dracma':/Pacote Especial/.test(t)?(lado==='ordem'?'loja-pacote-reliquias':'loja-pacote-companhia'):/Pacote/.test(t)?'p-pacote':/Música/.test(t)?'p-musica':/Fragmento/.test(t)?'p-fragmento':/Moldura/.test(t)?'p-moldura':'p-carta';
const CONF_CADEADO='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 7V5a4 4 0 0 1 8 0v2h1v8H3V7Zm2 0h4V5a2 2 0 0 0-4 0Z"/></svg>';

function montaConflito(raiz){
  const q=new URLSearchParams(location.search);
  if(q.get('conf'))confGrava('devo-conflito-lado',q.get('conf'));
  let lado=confLer('devo-conflito-lado',null);
  // lado da temporada anterior (para o aviso de troca) e temporadas seguidas com ele
  const anterior=confLer('devo-conflito-anterior',q.get('anterior')||'ordem');
  const seguidas=confLer('devo-conflito-seguidas',1);
  let karma=confLer('devo-karma',3260),compras=confLer('devo-conflito-compras',{}),aba=q.get('aba')||'conheca',ver=lado;
  const aberta=q.get('apuracao')==='1'||new Date().getDay()===6;
  const restam=fim=>{const ms=Math.max(0,fim-new Date());return [Math.floor(ms/864e5),Math.floor(ms%864e5/36e5)]};
  const proxSabado=()=>{const d=new Date();d.setDate(d.getDate()+((6-d.getDay()+7)%7||7));d.setHours(20,0,0,0);return d};
  const mini=()=>`<div class="cf-mini">${['companhia','ordem'].map(k=>`<button class="${k}" data-ver="${k}"><img src="${confImg('brasao-'+k)}" alt=""><span>${CONF_LADOS[k].nome}</span></button>`).join('')}</div>`;
  // rola só o corpo da janela (scrollIntoView rolava o sistema inteiro e escondia a barra da janela)
  function rolaAte(sel,suave){
    const c=raiz.closest('.corpo')||raiz.parentElement,e=raiz.querySelector(sel);if(!c||!e)return;
    const topo=e.getBoundingClientRect().top-c.getBoundingClientRect().top+c.scrollTop-(sel==='.cf-abas'?0:58);
    c.scrollTo({top:topo,behavior:suave&&!parado?'smooth':'auto'});
  }
  function desenha(){
    raiz.dataset.lado=lado||'';
    const [d,h]=restam(CONF_FIM);
    raiz.innerHTML=`<header class="cf-topo">
        <div class="cf-arte" role="img" aria-label="A cidadela da Companhia e a catedral da Ordem, separadas por uma fenda; uma ampulheta no meio"></div>
        <div class="cf-sombra" aria-hidden="true"></div>
        <span class="cf-fita">Temporada I</span>
        <div class="cf-titulo"><em>Evento de</em><h2 aria-label="Conflito"><span class="cf-t-cia" aria-hidden="true">Conflito</span><span class="cf-t-ord" aria-hidden="true">Conflito</span></h2>
</div>
        <p class="cf-relogio"><b>${d}d ${h}h</b><small>até o fim da temporada</small></p>
        ${lado?`<div class="cf-id ${lado}"><img src="${confImg(lado==='companhia'?'credencial':'lacre')}" alt=""><span><small>Você apoia</small>${CONF_LADOS[lado].nome}</span></div>`
          :`<div class="cf-escolha"><img src="${confImg('brasao-companhia')}" alt=""><em>Escolha um lado</em><img src="${confImg('brasao-ordem')}" alt=""></div>`}
      </header>
      <nav class="cf-abas" role="tablist">${[['conheca','Conheça'],['marcos','Marcos'],['loja','Loja de Karma']].map(([k,t])=>`<button role="tab" data-aba="${k}" aria-selected="${aba===k}"><span>${t}</span></button>`).join('')}</nav>
      <section class="cf-corpo cf-${aba}">${aba==='conheca'?conheca():aba==='marcos'?marcos():loja()}</section>`;
    raiz.querySelectorAll('[data-aba]').forEach(b=>b.onclick=()=>{aba=b.dataset.aba;desenha();rolaAte('.cf-abas',false)});
    raiz.querySelectorAll('[data-ver]').forEach(b=>b.onclick=()=>{ver=b.dataset.ver;aba='conheca';desenha();rolaAte('.cf-pagina',true)});
    raiz.querySelectorAll('[data-apoia]').forEach(b=>b.onclick=()=>escolhe(b.dataset.apoia));
    raiz.querySelectorAll('[data-compra]').forEach(b=>b.onclick=()=>compra(b.dataset.compra));
  }
  const regua=()=>`<div class="cf-regua" aria-hidden="true"><i></i><img src="${confImg('p-tempo')}" alt=""><i></i></div>`;
  function conheca(){
    const capas=['companhia','ordem'].map(k=>`<button class="cf-capa ${k}${ver===k?' aberta':''}" data-ver="${k}" aria-pressed="${ver===k}">
        <img class="cf-capa-fig" src="${confImg('figura-'+k)}" alt="">
        <img class="cf-capa-bra" src="${confImg('brasao-'+k)}" alt="">
        <span class="cf-capa-nome">${CONF_LADOS[k].nome}</span></button>`).join('<i class="cf-emenda" aria-hidden="true"></i>');
    const L=ver&&CONF_LADOS[ver],meu=lado===ver,outro=ver==='companhia'?'ordem':'companhia';
    return `${regua()}<p class="cf-abre">${CONF_TX.abertura}</p>${regua()}
      <div class="cf-capas">${capas}</div>
      <p class="cf-pergunta">${CONF_TX.pergunta}</p>
      ${L?`<article class="cf-pagina ${ver}">
        <header><img src="${confImg('brasao-'+ver)}" alt=""><h3 class="cf-h">${L.nome}</h3></header>
        ${L.texto.map((t,i)=>`${i&&ver==='ordem'?`<img class="cf-orna" src="${confImg('brasao-ordem')}" alt="">`:''}<p>${t}</p>`).join('')}
        <button class="cf-outra" data-ver="${outro}">Ver a ${CONF_LADOS[outro].nome}</button>
      </article>
      <div class="cf-pe"><button class="cf-apoia ${ver}" data-apoia="${ver}" ${meu?'disabled':''}><img src="${confImg(ver==='companhia'?'brasao-companhia':'lacre')}" alt=""><span>${meu?'Seu lado nesta temporada':`Apoiar a ${L.curto}`}</span></button></div>`
      :'<p class="cf-dica">Toque numa das capas para ler sobre a organização.</p>'}`;
  }
  function placar(){
    const t=CONF_APURACAO.companhia+CONF_APURACAO.ordem,v=CONF_APURACAO.companhia/t,[pd,ph]=restam(proxSabado());
    return `<div class="cf-placar${aberta?'':' selado'}">
      <small class="cf-rot">${aberta?`Apuração · ${CONF_APURACAO.data}`:'Resultado selado até a próxima apuração'}</small>
      <div class="cf-cabo" style="--v:${aberta?v:.5}"><span class="cia"></span><span class="ord"></span><i class="cf-no-cabo"><img src="${confImg('p-tempo')}" alt=""></i>
        ${aberta?'':`<div class="cf-nevoa"><img src="${confImg('sigilo')}" alt=""><b>Próxima apuração em ${pd}d ${String(ph).padStart(2,'0')}h</b></div>`}</div>
      <div class="cf-nums"><span class="cia"><b>${aberta?confMil(CONF_APURACAO.companhia):'— — —'}</b>Karma da Companhia</span><span class="ord"><b>${aberta?confMil(CONF_APURACAO.ordem):'— — —'}</b>Karma da Ordem</span></div>
    </div>`;
  }
  const regras=()=>`<details class="cf-regras"><summary>Como funcionam os Marcos</summary>${CONF_TX.marcos.map(t=>`<p>${t}</p>`).join('')}<p><b>Apuração semanal:</b> ${CONF_TX.apuracao}</p></details>`;
  function marcos(){
    if(!lado)return placar()+`<div class="cf-silhueta"><p>Escolha um lado para ver os Marcos.</p>${mini()}</div>`+regras();
    const L=CONF_LADOS[lado],meu=CONF_APURACAO[lado],cia=lado==='companhia';
    return placar()+`<ol class="cf-trilha ${lado}">${L.marcos.map(([meta,premios],i)=>{const ok=meu>=meta,ant=i?L.marcos[i-1][0]:0,parte=Math.max(0,Math.min(1,(meu-ant)/(meta-ant)));return `<li class="${ok?'ok':''}">
        <span class="cf-marco" aria-hidden="true"><img src="${confImg(cia?(ok?'placa-acesa':'placa'):(ok?'vela-acesa':'vela'))}" alt="">${cia?`<b>${['I','II','III','IV','V'][i]}</b>`:''}</span>
        <div class="cf-marco-tx"><h4 class="cf-h">Marco ${i+1}</h4><small class="cf-meta">${confMil(meta)} ${L.karma}</small>
          <ul class="cf-premios">${premios.map(p=>`<li><img src="${confImg(confPremio(p,lado))}" alt=""><span>${p}</span></li>`).join('')}</ul>
          ${ok?`<span class="cf-cena">${CONF_CADEADO}Cena do Marco ${i+1}</span>`:`<span class="cf-falta"><i style="--p:${parte}"></i>Faltam ${confMil(meta-meu)}</span>`}</div></li>`}).join('')}</ol>`+regras();
  }
  function loja(){
    const aviso=`<div class="cf-aviso">${CONF_TX.loja.map(t=>`<p>${t}</p>`).join('')}</div>`;
    if(!lado)return aviso+`<div class="cf-silhueta"><p>A loja é a da organização que você apoia.</p>${mini()}</div>`;
    const L=CONF_LADOS[lado];
    return `<div class="cf-loja-topo"><h3 class="cf-h">Loja da ${L.curto}</h3><span class="cf-saldo"><img src="${confImg('ficha-'+lado)}" alt=""><b>${confMil(karma)}</b><small>Seu Karma</small></span></div>
      <ul class="cf-itens">${L.loja.map(([id,nome,lim,,preco])=>{const v=(CONF_VENDIDOS[id]||0)+(compras[id]||0),esgotou=v>=lim,falta=karma<preco;return `<li class="cf-item${esgotou?' esgotado':''}">
        <button class="cf-item-bt" data-compra="${id}" ${esgotou?'disabled':''} aria-label="${nome}, ${confMil(preco)} Karma${esgotou?', esgotado':''}">
        <span class="cf-vitrine"><img class="cf-ped" src="${confImg('pedestal-'+lado)}" alt=""><img class="cf-obj" src="${confImg('loja-'+id)}" alt=""></span>
        <span class="cf-item-nome">${nome}</span>
        <span class="cf-estoque">${lim<=30?`<span class="cf-entalhes">${Array.from({length:lim},(_,i)=>`<i${i<v?' class="ido"':''}></i>`).join('')}</span>`:`<span class="cf-regua-estoque"><i style="--p:${v/lim}"></i></span>`}<small>${lim-v} de ${lim} no mundo todo</small></span>
        <span class="cf-preco${falta&&!esgotou?' falta':''}">${confMil(preco)} <small>Karma</small></span>
        ${esgotou?`<span class="cf-carimbo"><img src="${confImg('esgotado-'+lado)}" alt=""><b>Esgotado</b></span>`:''}</button></li>`}).join('')}</ul>${aviso}`;
  }
  // gaveta de baixo, no material de um lado; "cena" ocupa a tela toda (aviso de troca)
  function gaveta(html,botoes,material,cena){
    const m=document.createElement('div');m.className=`cf-veu${cena?' cena':''}`;m.dataset.mat=material||'';
    m.innerHTML=`<div class="cf-gaveta" role="dialog" aria-modal="true" aria-labelledby="cf-g-tit">${html}<div class="cf-bts">${botoes.map(([t,cl],i)=>`<button class="${cl||''}" data-i="${i}">${t}</button>`).join('')}</div></div>`;
    // fica dentro da janela, abaixo da barra de título (que continua à vista)
    const jan=raiz.closest('.jan'),corpo=raiz.closest('.corpo');
    if(jan&&corpo){m.style.top=corpo.offsetTop+'px';jan.append(m)}else raiz.append(m);
    const t=m.querySelector('#cf-g-tit');t.tabIndex=-1;t.focus({preventScroll:true});
    return new Promise(ok=>{const sai=i=>{m.remove();ok(i)};m.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>sai(+b.dataset.i));m.onclick=e=>{if(e.target===m)sai(-1)};m.onkeydown=e=>{if(e.key==='Escape')sai(-1)}});
  }
  async function escolhe(k){
    const L=CONF_LADOS[k],atual=lado||anterior;
    if(atual&&atual!==k){
      const A=CONF_LADOS[atual],marcas=[0,1,2].map(i=>`<img src="${confImg(atual==='companhia'?(i<seguidas?'placa-acesa':'placa'):(i<seguidas?'vela-acesa':'vela'))}" alt="">`).join('');
      const r=await gaveta(`<div class="cf-racha" aria-hidden="true"><img src="${confImg('brasao-'+atual)}" alt=""><img src="${confImg('brasao-'+atual)}" alt=""></div>
        <h3 id="cf-g-tit">Trocar de lado</h3>
        <div class="cf-folha ${atual}"><p>${CONF_TX.troca}</p><p><b>Fidelidade:</b> ${CONF_TX.fidelidade}</p></div>
        <div class="cf-fiel"><span>${marcas}</span><small>Você está com a ${A.curto} há ${seguidas} de 3 temporadas.</small></div>
        <p class="cf-certeza">${CONF_TX.certeza}</p>`,[['Continuar onde estou','fica '+atual],['Trocar de lado','vai '+k]],atual,true);
      if(r!==1)return;
    }else if(!lado){
      const r=await gaveta(`<img class="cf-g-bra" src="${confImg('brasao-'+k)}" alt=""><h3 id="cf-g-tit">${L.nome}</h3>
        <p>Seu Karma desta temporada passa a contar para a ${L.curto}, e a loja e os Marcos dela se abrem para você.</p>`,[[`Apoiar a ${L.curto}`,'sim '+k],['Voltar']],k);
      if(r!==0)return;
    }else return;
    lado=k;ver=k;confGrava('devo-conflito-lado',k);aba='marcos';desenha();
  }
  async function compra(id){
    const it=CONF_LADOS[lado].loja.find(x=>x[0]===id),v=(CONF_VENDIDOS[id]||0)+(compras[id]||0),falta=karma<it[4];
    const r=await gaveta(`<span class="cf-vitrine grande"><img class="cf-ped" src="${confImg('pedestal-'+lado)}" alt=""><img class="cf-obj" src="${confImg('loja-'+id)}" alt=""></span>
      <h3 id="cf-g-tit">${it[1]}</h3><p>${it[3]}</p>
      <p class="cf-conta"><span>${it[2]-v} de ${it[2]} no mundo todo</span><span><b>${confMil(karma)}</b> − ${confMil(it[4])} = <b>${confMil(karma-it[4])}</b> Karma</span></p>
      ${falta?'<p class="cf-falta-k">Seu Karma não basta para este item.</p>':''}`,falta?[['Voltar']]:[['Comprar','sim '+lado],['Agora não']],lado);
    if(falta||r!==0)return;
    karma-=it[4];compras[id]=(compras[id]||0)+1;confGrava('devo-karma',karma);confGrava('devo-conflito-compras',compras);desenha();
  }
  desenha();
}
