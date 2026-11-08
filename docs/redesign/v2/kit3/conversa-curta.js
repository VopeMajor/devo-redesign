/* ---- Conversa curta no cenário (dono, 06/11: "nas interações normais, deixe assim. porém dialogos mais longos (como a
   própria primeira aparição), deixe o NPC ocupado a tela mesmo"). O mapa continua à vista com os chibis; a caixa de
   texto fica embaixo com o rostinho da pose de quem fala; a boca do chibi mexe junto com as letras (npc-vn.js chama
   boneco.fala). Serve para qualquer NPC e qualquer tela (Casa, Torres): o estilo vem junto.
   Uso: conversaCurta({nome:'Melissa',falas:[{texto,pose}|{quem:'narra'|'Sistema',texto}],retrato:pose=>src,
     boneco:()=>chibi,voz:{…},aoFim}) ---- */
function conversaCurta({nome,falas,retrato,boneco,voz,aoFim,classe=''}){
  if(!document.getElementById('cc-estilo')){
    const css=document.createElement('style');css.id='cc-estilo';
    css.textContent=`.conversa{position:fixed;inset:0;z-index:20;display:flex;flex-direction:column;justify-content:flex-end;padding:0 10px calc(max(12px,env(safe-area-inset-bottom)) + 8px);background:linear-gradient(180deg,rgba(8,5,14,0) 50%,rgba(8,5,14,.55) 80%);cursor:pointer}
    .cc-caixa{position:relative;width:100%;max-width:620px;min-height:150px;margin:0 auto;background:var(--por);color:var(--tinta);padding:12px 16px 14px;box-shadow:0 0 0 3px var(--tinta),0 0 0 6px var(--steel)}
    .cc-rosto{position:absolute;left:10px;bottom:calc(100% + 12px);background:#1b1424 no-repeat;image-rendering:pixelated;box-shadow:0 0 0 3px var(--tinta),0 0 0 6px var(--steel)}
    .cc-rosto[hidden]{display:none}
    .cc-nome{display:block;font-size:18px;color:var(--vio)}
    .cc-nome[data-sinal]:not([data-sinal=""])::after{content:" " attr(data-sinal);color:#c9a45a}
    .cc-tx{height:calc(4 * 1.28em);overflow:hidden;font-size:20px;line-height:1.28;margin-top:2px;white-space:pre-line}
    .cc-seg{position:absolute;right:12px;bottom:6px;font-size:14px;color:#6a5a80;animation:cc-pisca 1s steps(2) infinite}
    .cc-seg[hidden]{display:none}
    @keyframes cc-pisca{50%{opacity:0}}
    .conversa[data-quem=narra] .cc-tx{font-style:italic;color:#3a2a52}
    .conversa[data-quem=sistema] .cc-caixa{background:var(--tinta);color:var(--por)}
    .conversa[data-quem=sistema] .cc-nome{color:var(--teal,#7df5e0)}
    /* chamada por holograma: a moldura do rostinho é azul de projeção e tem linhas de varredura */
    .conversa.holo .cc-rosto{box-shadow:0 0 0 3px var(--tinta),0 0 0 6px #9DB2FF}
    .conversa.holo .cc-rosto::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(157,178,255,.18) 0 1px,transparent 1px 3px)}
    @media (prefers-reduced-motion:reduce){.cc-seg{animation:none}}`;
    document.head.append(css);
  }
  const el=document.createElement('section');el.className='conversa '+classe;el.setAttribute('role','dialog');el.setAttribute('aria-label','Conversa com '+nome);
  el.innerHTML='<img class="cc-fig" alt="" hidden><div class="cc-caixa"><i class="cc-rosto" hidden></i><b class="cc-nome"></b><p class="cc-tx" aria-live="polite"></p><small class="cc-seg" hidden>▼</small></div>';
  document.body.append(el);document.body.classList.add('em-visita');
  const $c=s=>el.querySelector(s);
  // o motor das figuras só escreve o texto e mexe a boca do chibi; o retrato grande não aparece nesta forma
  const npc=NPCVN.monta($c('.cc-fig'),{voz:voz||{tipo:'square',f0:520,f1:620,dur:30,cada:2,vol:.035},nome:()=>$c('.cc-nome'),caixa:()=>$c('.cc-caixa'),boca:boneco});
  const poses=[...new Set(falas.filter(f=>f.pose).map(f=>f.pose))];NPCVN.preRostos(poses.map(retrato));
  const fila=[...falas];let pronto=0;
  function passo(){
    if(performance.now()<pronto)return;  // toques logo depois de um balão novo são ignorados
    if(npc.completa())return;            // o primeiro toque completa o texto
    const f=fila.shift();if(!f)return fecha();
    const quem=f.quem||nome,fala=quem===nome;
    el.dataset.quem=quem==='narra'?'narra':quem==='Sistema'?'sistema':'npc';
    $c('.cc-nome').textContent=quem==='narra'?'':quem;
    if(!f.cont)NPCVN.rostinho($c('.cc-rosto'),fala?retrato(f.pose||'sorriso'):null);
    const tx=$c('.cc-tx'),pags=typeof paginar==='function'?paginar(tx,f.texto):[f.texto];
    if(pags.length>1)fila.unshift(...pags.slice(1).map(t=>({...f,texto:t,cont:true})));
    $c('.cc-seg').hidden=true;pronto=performance.now()+120;
    npc.fala(tx,pags[0],()=>{$c('.cc-seg').hidden=false},{comVoz:fala});
  }
  const tecla=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();passo()}};
  function fecha(){npc.destroi();removeEventListener('keydown',tecla);el.remove();document.body.classList.remove('em-visita');aoFim&&aoFim()}
  el.addEventListener('click',passo);addEventListener('keydown',tecla);
  passo();
  return {fecha};
}
