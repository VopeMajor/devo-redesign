// Balão de diálogo com tamanho fixo (dono, 02/11): o texto ocupa no máximo as linhas da caixa; o que sobra passa para
// o balão seguinte. Os balões saem de tamanho parecido (nada de uma ponta solta sozinha no último) e cortam de
// preferência no fim de uma frase; se a frase não cabe, cortam entre palavras.
// Uso: paginar(elementoDoTexto, texto) devolve a lista de páginas. O elemento precisa ter altura fixa (CSS .tx).
function paginar(el,texto){
  const antes=el.textContent,cabe=t=>{el.textContent=t;return el.scrollHeight<=el.clientHeight+1};
  // corta "resto" no maior trecho que cabe, sem passar de "alvo" caracteres (quando há alvo)
  function corta(resto,alvo){
    const pal=resto.split(/(\s+)/);let atual='';
    for(let i=0;i<pal.length;i++){const t=atual+pal[i];if(atual.trim()&&(!cabe(t)||(alvo&&t.trim().length>alvo)))break;atual=t}
    // prefere terminar no fim de uma frase, se ela não deixa o balão vazio demais
    const m=[...atual.matchAll(/[.!?…]["”\]]?\s/g)].pop();
    if(m&&m.index>atual.length*.55&&m.index+m[0].length<resto.length)atual=atual.slice(0,m.index+m[0].length);
    return atual.trim()?atual:pal[0]+(pal[1]||'');
  }
  function reparte(alvo){
    const pags=[];let resto=String(texto).trim();
    while(resto){if(cabe(resto)){pags.push(resto);break}const a=corta(resto,alvo&&alvo(pags.length,resto));pags.push(a.trim());resto=resto.slice(a.length).trim()}
    return pags;
  }
  const cheio=reparte(null);
  let pags=cheio;
  if(cheio.length>1){
    // mesma quantidade de balões, cada um com uma parte parecida do texto
    const n=cheio.length,eq=reparte((i,resto)=>Math.ceil(resto.length/(n-i))*1.12);
    if(eq.length===n)pags=eq;
  }
  el.textContent=antes;
  return pags;
}
