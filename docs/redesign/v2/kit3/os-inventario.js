// Tela do Inventário dentro do sistema: tudo o que o jogador tem num lugar só. Nomes e descrições são os do catálogo
// do jogo (item_defs nas migrações); as quantidades são exemplo, e no jogo vêm de /api/eu?parte=inventario.
const INV_TIPOS=[['pacote','Pacotes'],['essencia','Essências'],['chave','Chaves'],['fragmento','Fragmentos'],['moeda','Moedas'],['outro','Outros']];
const INV_RAR={comum:'Comum',incomum:'Incomum',raro:'Raro'};
const INV_ITENS=[
  {k:'pacote',nome:'Pacote Iniciante',rar:'incomum',q:1,d:'Cinco cartas para começar a montar o baralho, com a chance de uma incomum e, às vezes, uma rara a mais.',arte:'../../../../public/images/pacotes/iniciante/arte-384.webp'},
  {k:'essencia',nome:'Essência de Afinidade do Galo',rar:'incomum',q:3,d:'Essência do Galo, Anfitrião do Arcano do Imperador. Abre andares das torres ligadas a ele.',arte:'../../../../public/images/essencias/galo-128.webp'},
  {k:'chave',nome:'Chave do Imperador',rar:'incomum',q:1,d:'Entregue a cada andar vencido da Torre do Imperador (do Galo). Abre andares da torre principal.'},
  {k:'fragmento',nome:'Fragmento Arcano',rar:'raro',q:2,d:'Lasca de um Arcano. Usada na evolução de Estágio.',arte:'art/os/poco/fragmento.png'},
  {k:'moeda',nome:'Dracma Comum',rar:'comum',q:14,d:'Moeda do sorteio base do Poço dos Milagres.',arte:'art/os/poco/dracma-comum.png'},
  {k:'moeda',nome:'Dracma Incomum',rar:'incomum',q:2,d:'Moeda antiga entregue por uma figura encapuzada. Abre uma categoria especial do Poço.',arte:'art/os/poco/dracma-incomum.png'},
  {k:'outro',nome:'Balde de madeira desgastado',rar:'comum',q:1,d:'O balde de todo iniciante. Trágico, rachado e sem qualquer efeito sobre a coleta.'},
];
function montaInventario(raiz){
  const novato=estado==='novato',itens=novato?[]:INV_ITENS;
  let filtro='tudo';
  const cartas=CARTAS.filter(c=>TENHO[c.id]).sort((a,b)=>ordemRar(b.rar)-ordemRar(a.rar));
  const copias=cartas.reduce((n,c)=>n+TENHO[c.id][0],0),qtd=itens.reduce((n,i)=>n+i.q,0);
  const sistema=id=>abre(SISTEMAS.find(a=>a.id===id));
  function secao(titulo,acao,corpo){
    const s=document.createElement('section');s.setAttribute('aria-label',titulo);
    s.innerHTML=`<header class="i-sec"><h4>${titulo}</h4>${acao?`<button class="r-link i-acao">${acao[0]} ›</button>`:''}</header>`;
    if(acao)s.querySelector('.i-acao').onclick=acao[1];
    s.append(corpo);return s;
  }
  function pinta(){
    const tipos=INV_TIPOS.filter(([k])=>itens.some(i=>i.k===k));
    const filtros=[['tudo','Tudo',copias+qtd],['cartas','Cartas',copias],...tipos.map(([k,n])=>[k,n,itens.filter(i=>i.k===k).reduce((s,i)=>s+i.q,0)])];
    raiz.innerHTML=`<dl class="i-resumo"><div class="fundo"><dt>Cartas</dt><dd>${copias}<small>${cartas.length} ${cartas.length===1?'tipo':'tipos'}</small></dd></div><div class="fundo"><dt>Itens</dt><dd>${qtd}<small>${itens.length} ${itens.length===1?'tipo':'tipos'}</small></dd></div></dl>
      <div class="i-filtros" role="radiogroup" aria-label="Filtrar o inventário"></div><div class="i-lista"></div>`;
    const fs=raiz.querySelector('.i-filtros');
    filtros.forEach(([id,nome,n])=>{
      const b=document.createElement('button');b.className='chanfro';b.setAttribute('role','radio');b.setAttribute('aria-checked',filtro===id);
      b.innerHTML=`${nome} <b>${n}</b>`;b.onclick=()=>{filtro=id;const x=fs.scrollLeft;pinta();raiz.querySelector('.i-filtros').scrollLeft=x};fs.append(b);
    });
    const l=raiz.querySelector('.i-lista'),mostra=f=>filtro==='tudo'||filtro===f;
    if(mostra('cartas')){
      const ul=document.createElement('ul');ul.className='i-cartas';
      cartas.forEach(c=>{
        const li=document.createElement('li'),b=document.createElement('button'),n=TENHO[c.id][0];b.className='r-'+c.rar;
        b.setAttribute('aria-label',`${c.nome}, ${n} ${n===1?'cópia':'cópias'}`);
        b.innerHTML=cartaFrente(c,colDe(c),`../../../../public/images/cartas/${c.id}/arte-512.webp`)+(n>1?`<b>×${n}</b>`:'');
        b.onclick=()=>sistema('cartas');li.append(b);ul.append(li);
      });
      l.append(secao('Cartas',['Abrir Cartas',()=>sistema('cartas')],ul));
    }
    tipos.filter(([k])=>mostra(k)).forEach(([k,nome])=>{
      const ul=document.createElement('ul');ul.className='i-itens';
      itens.filter(i=>i.k===k).forEach(i=>{
        const li=document.createElement('li');li.className='r-'+i.rar;li.title=i.d||'';
        li.innerHTML=`${i.arte?`<img src="${i.arte}" alt="">`:`<span class="i-joia r-${i.rar}" aria-hidden="true"><u></u></span>`}<div><strong>${i.nome}</strong><small class="r-${i.rar}">${INV_RAR[i.rar]}</small>${i.d?`<p>${i.d}</p>`:''}</div><b>×${i.q}</b>`;
        ul.append(li);
      });
      l.append(secao(nome,k==='pacote'?['Abrir na Casa',()=>sistema('casa')]:null,ul));
    });
    if(!itens.length&&filtro==='tudo')l.insertAdjacentHTML('beforeend','<p class="r-sub i-vazio">Nenhum item ainda. Itens chegam do Poço, das Torres, dos Deadly Votes e dos prêmios da casa.</p>');
  }
  pinta();
}
