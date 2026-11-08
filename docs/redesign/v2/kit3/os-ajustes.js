// Tela de Ajustes dentro do sistema. Funções e textos são os do jogo atual (apps/ajustes-app.tsx e shared/pwa-panel.tsx).
// Som, notificações e instalação aqui só guardam a escolha: no jogo ligam o áudio, o push e o aplicativo de verdade.
function lerAjustes(){let d=null;try{d=JSON.parse(localStorage.getItem('devo-ajustes'))}catch{}return Object.assign({som:true,ambiente:'auto',avisos:false},d||{})}
function gravarAjustes(d){try{localStorage.setItem('devo-ajustes',JSON.stringify(d))}catch{}}
function montaAjustes(raiz){
  const d=lerAjustes();let ajudaInstala=false,ajudaAviso=false,teste='';
  const minhas=()=>CARTAS.filter(c=>TENHO[c.id]).reduce((n,c)=>n+TENHO[c.id][0],0);
  function pinta(){
    raiz.innerHTML=`
      <h4 style="margin-top:0">Cores do sistema</h4><div class="temas" id="l-temas" style="margin-top:0"></div>
      <h4>Áudio</h4>
      <div class="a-linha"><span>Trilha e sons de interface</span><button class="r-bt chanfro" id="a-som" aria-pressed="${d.som}">${d.som?'Ligado':'Desligado'}</button></div>
      <p class="a-rot">Som ambiente</p>
      <div class="a-opcoes" role="radiogroup" aria-label="Som ambiente">${[['auto','Só na 1ª sessão'],['ligado','Sempre'],['desligado','Desligado']].map(([v,t])=>`<button class="chanfro" role="radio" data-v="${v}" aria-checked="${d.ambiente===v}">${t}</button>`).join('')}</div>
      <h4>Aplicativo</h4>
      <div class="a-linha"><span>Não instalado</span><button class="r-bt chanfro" id="a-ajuda1" aria-expanded="${ajudaInstala}">Como instalar</button></div>
      ${ajudaInstala?'<div class="a-ajuda fundo"><p>No iPhone: toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>. As notificações só funcionam com o app instalado.</p><p>No menu do navegador, escolha <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</p></div>':''}
      <div class="a-linha"><span>Notificações: ${d.avisos?'Ativadas':'Desativadas'}</span><button class="r-bt chanfro" id="a-avisos" aria-pressed="${d.avisos}">${d.avisos?'Desativar':'Ativar'}</button></div>
      ${d.avisos?`<button class="r-bt chanfro a-larga" id="a-teste">Testar notificação</button>${teste?`<p class="a-rot" role="status">${teste}</p>`:''}`:`<button class="r-link" id="a-ajuda2" aria-expanded="${ajudaAviso}">Como liberar</button>${ajudaAviso?'<div class="a-ajuda fundo"><p>Toque no cadeado ao lado do endereço, abra <b>Permissões</b> e mude <b>Notificações</b> para permitir. Depois volte aqui.</p></div>':''}`}
      <h4>Sistema</h4>
      <dl class="a-ficha"><div><dt>Versão</dt><dd>DEVO 0.1 · experimental</dd></div><div><dt>Interface</dt><dd>${pc()?'Área de trabalho':'Smartphone'}</dd></div><div><dt>Operador</dt><dd>O Anfitrião</dd></div></dl>
      <div class="a-linha"><span>Central de avisos</span><button class="r-bt chanfro" id="a-limpa" ${avisos.length?'':'disabled'}>Limpar avisos</button></div>
      <h4>Sessão</h4>
      <div class="a-sessao fundo">${SIGILO}<div><strong>Seu nome</strong><small>${minhas()} cartas · ${typeof TROCAS_FEITAS==='undefined'?0:TROCAS_FEITAS} trocas</small></div></div>
      <button class="r-bt chanfro a-larga" id="a-inicial" disabled>Tela inicial</button>
      <p class="a-rot">A tela de entrada do jogo vem na etapa dela.</p>`;
    pintaTemas();
    const $r=s=>raiz.querySelector(s);
    $r('#a-som').onclick=()=>{d.som=!d.som;salva()};
    raiz.querySelectorAll('.a-opcoes button').forEach(b=>b.onclick=()=>{d.ambiente=b.dataset.v;salva()});
    $r('#a-ajuda1').onclick=()=>{ajudaInstala=!ajudaInstala;pinta()};
    $r('#a-avisos').onclick=()=>{d.avisos=!d.avisos;teste='';salva()};
    const t=$r('#a-teste');if(t)t.onclick=()=>{teste='Neste protótipo nenhuma notificação é enviada.';pinta()};
    const a2=$r('#a-ajuda2');if(a2)a2.onclick=()=>{ajudaAviso=!ajudaAviso;pinta()};
    $r('#a-limpa').onclick=()=>{avisos=[];pintaSino();pinta()};
  }
  function salva(){gravarAjustes(d);const y=raiz.closest('.corpo').scrollTop;pinta();raiz.closest('.corpo').scrollTop=y}
  pinta();
}
