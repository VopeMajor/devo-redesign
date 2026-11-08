// Tela do Pulso, no padrão do Star Rail: medidor circular das 72 horas com marcas finas, o coração ao centro, o batimento
// correndo por baixo e o resumo. Sem pixel. Textos e limites são os do jogo atual (apps/pulso-app.tsx e lib/devo/pulse.ts).
const PULSO_MAX=72;
function montaPulso(raiz){
  const seg=segPulso,horas=Math.ceil(seg/3600),crit=seg<6*3600,f=Math.min(1,seg/3600/PULSO_MAX);
  const R=118,C=2*Math.PI*R;
  // uma marca por hora; a cada 6 horas a marca é mais longa e leva o número
  const marcas=Array.from({length:PULSO_MAX},(_,i)=>{const a=i/PULSO_MAX*360,g=i%6===0;return `<line x1="150" y1="${g?14:19}" x2="150" y2="26" transform="rotate(${a} 150 150)" class="${i<horas?'on':''}${g?' g':''}"/>`}).join('');
  const nums=[0,12,24,36,48,60].map(h=>{const a=(h/PULSO_MAX)*2*Math.PI-Math.PI/2;return `<text x="${150+Math.cos(a)*100}" y="${150+Math.sin(a)*100+4}">${h||72}</text>`}).join('');
  raiz.innerHTML=`
    <div class="pu ${crit?'crit':''}">
      <header class="pu-cab"><div><small>Sinal vital</small><h3>Pulso</h3></div><b class="pu-est">${crit?'Crítico':'Estável'}</b></header>
      <div class="pu-mostrador" role="img" aria-label="${horas} horas restantes de ${PULSO_MAX}">
        <svg viewBox="0 0 300 300" aria-hidden="true">
          <defs><linearGradient id="pu-arco" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--pu-a)"/><stop offset="1" stop-color="var(--pu-b)"/></linearGradient></defs>
          <circle cx="150" cy="150" r="140" class="pu-halo"/>
          <g class="pu-marcas">${marcas}</g>
          <circle cx="150" cy="150" r="${R}" class="pu-trilho"/>
          <circle cx="150" cy="150" r="${R}" class="pu-arco" style="stroke-dasharray:${(C*f).toFixed(1)} ${C.toFixed(1)}"/>
          <g class="pu-nums">${nums}</g>
          <circle cx="150" cy="150" r="78" class="pu-nucleo"/>
        </svg>
        <div class="pu-meio"><img src="${px('pulso')}" alt=""><strong>${horas}</strong><span>${horas===1?'hora':'horas'} de ${PULSO_MAX}</span></div>
      </div>
      <svg class="pu-ecg" viewBox="0 0 600 60" preserveAspectRatio="none" aria-hidden="true"><path d="${(()=>{let d='M0 30',x=0;const passo=crit?75:150;while(x<1200){d+=` L${x+passo*.45} 30 L${x+passo*.5} 22 L${x+passo*.55} 30 L${x+passo*.6} 34 L${x+passo*.64} 6 L${x+passo*.68} 54 L${x+passo*.72} 26 L${x+passo*.78} 30 L${x+passo} 30`;x+=passo}return d})()}"/></svg>
      ${crit?'<div class="pu-alerta" role="alert"><strong>Tempo crítico</strong><p>Menos de 6 horas. Jogue e vença para recuperar horas antes que o pulso pare.</p></div>':''}
      <div class="pu-stats"><div><b>12</b><small>Cartas</small></div><div><b>3</b><small>Trocas</small></div><div><b>${estado==='novato'?0:7}</b><small>Jogos</small></div></div>
    </div>`;
}
