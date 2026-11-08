// Carta com a moldura do jogo: a mesma de components/devo/shared/carta-tarot.tsx (design do dono de 22/10), medida em cqw.
const BORDA={comum:['#8f8e8b','#3a3a3e'],incomum:['#d4d4d8','#5e5e63'],rara:['#d6cdbd','#5d564c'],ultra_rara:['#bcb0e2','#4a4170'],lendaria:['#c2b9ec','#4a4180']};
const BRILHO={comum:0,incomum:1,rara:2,ultra_rara:3,lendaria:4};
const AR={hi:'#d8cfbd',s:'#d6cdbd',mid:'#9a9184',dark:'#4d473f',ame:'#8a7cc8'};
const Q={x0:13,x1:87,y0:161.5,y1:178,y2:195.5,y3:207.5,col:33},QC=(Q.x1-Q.x0)/3;
const GLIFO={escudo:'shield',xadrez_peao:'pawn',xadrez_rei:'king',xadrez_cavalo:'knight',xadrez_bispo:'bishop',xadrez_torre:'rook',xadrez_rainha:'queen',xadrez_tabuleiro:'board'};
const RAIO={escudo:'Pessoal'};
const agulha=(a,b,w)=>`M0 ${-a} L${w} ${-(a+(b-a)*.35)} L0 ${-b} L${-w} ${-(a+(b-a)*.35)} Z`;
const estrela4=(R,k=.2)=>{const c=R*k;return `M0 ${-R} Q${c} ${-c} ${R} 0 Q${c} ${c} 0 ${R} Q${-c} ${c} ${-R} 0 Q${-c} ${-c} 0 ${-R} Z`};
const icoLucide=(n,cl)=>`<svg class="${cl}" viewBox="0 0 24 24" fill="none" stroke="${AR.s}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">${LUCIDE[n]}</svg>`;
function fundoBorda(r){
  const [cor,esc]=BORDA[r],n=BRILHO[r];
  if(n===0)return `background-color:#0b0a0e;background-image:radial-gradient(70% 40% at 50% 0%,${esc}55,transparent 70%),linear-gradient(160deg,#18161d,#08070a)`;
  if(n===1)return 'background-color:#121216;background-image:repeating-linear-gradient(90deg,rgba(255,255,255,.025) 0 1px,transparent 1px 3px),linear-gradient(160deg,#3a3a40 0%,#141418 38%,#2c2c31 62%,#0e0e11 100%)';
  if(n===2)return 'background-color:#15130f;background-image:linear-gradient(135deg,#6e665a 0%,#1c1915 22%,#8d8474 46%,#221f1a 58%,#5d564c 80%,#141210 100%)';
  if(n===3)return `background-color:#141020;background-image:linear-gradient(135deg,${cor} 0%,#241d3c 20%,#8a7cc8 44%,#1e1833 56%,${esc} 78%,#120f1e 100%)`;
  return `background-color:#140f22;background-image:linear-gradient(135deg,#d8cfbd 0%,${esc} 16%,${cor} 34%,#fbf8f2 48%,${cor} 60%,${esc} 80%,${cor} 100%)`;
}
const auraCarta=r=>{const n=BRILHO[r],c=BORDA[r][0];return n===3?`0 12px 28px -14px rgba(0,0,0,.9),0 0 10px -3px ${c}66`:n>=4?`0 12px 28px -14px rgba(0,0,0,.9),0 0 16px -3px ${c}aa`:'0 12px 28px -14px rgba(0,0,0,.9)'};
function molduraSvg(verso,cor,n){
  const arco='M13 150 V30 Q13 16 27 16 H34 Q50 6 66 16 H73 Q87 16 87 30 V150 Z';
  const relogio=`<g transform="translate(50 13)">${[0,45,90,135,180,225,270,315].map((a,i)=>`<path transform="rotate(${a})" d="${i%2?agulha(8.4,13.5,.9):agulha(8.4,18.5,1.3)}" fill="url(#ct-aco)" stroke="${AR.dark}" stroke-width=".15"/>`).join('')}
    <circle r="8.8" fill="url(#ct-aco)" stroke="${AR.dark}" stroke-width=".3"/><circle r="7.4" fill="#0e0d11"/><circle r="6.8" fill="none" stroke="${AR.mid}" stroke-width=".2"/>
    ${Array.from({length:12},(_,i)=>`<path transform="rotate(${i*30})" d="${i%3===0?'M0 -6.5 L.45 -5.4 L0 -4.4 L-.45 -5.4 Z':'M0 -6.3 V-5.4'}" fill="${AR.s}" stroke="${AR.s}" stroke-width=".25"/>`).join('')}
    <path transform="rotate(-30)" d="${agulha(0,3.6,.55)}" fill="${AR.hi}"/><path transform="rotate(-6)" d="${agulha(0,5.6,.4)}" fill="${AR.s}"/><circle r=".95" fill="${cor}" stroke="${AR.hi}" stroke-width=".2"/></g>`;
  const ampulheta=`<g transform="translate(50 213)"><path d="M-2.6 -3.4 H2.6 M-2.6 3.4 H2.6" stroke="${AR.s}" stroke-width=".55"/><path d="M-2 -3 L2 -3 L.25 0 L2 3 L-2 3 L-.25 0 Z" fill="#0e0d11" stroke="url(#ct-aco)" stroke-width=".45"/><path d="M-1.1 -2.4 L1.1 -2.4 L0 -.6 Z M-1.3 2.6 L1.3 2.6 L0 1.4 Z" fill="${AR.ame}" opacity=".85"/></g>`;
  const estrelaLado=x=>`<g transform="translate(${x} 85)"><path d="${estrela4(4.6,.18)}" fill="url(#ct-aco)" stroke="${AR.dark}" stroke-width=".2"/>${n>=3?`<circle r="${n>=4?2.6:2}" fill="${cor}" opacity=".5" style="filter:blur(.8px)"/>`:''}<path d="M0 -1.1 L.8 0 L0 1.1 L-.8 0 Z" fill="${cor}"/>${n>=2?'<path d="M-.25 -.7 L.15 -.2 L-.25 .1 Z" fill="#d9cfba" opacity=".8"/>':''}</g>`;
  const cantos=[[7.4,7.4,45],[92.6,7.4,135],[7.4,214.6,-45],[92.6,214.6,-135]].map(([x,y,a])=>`<g transform="translate(${x} ${y}) rotate(${a})"><path d="${agulha(0,7,.7)}" transform="rotate(90)" fill="url(#ct-aco)"/><path d="${estrela4(1.6)}" transform="translate(5.2 0)" fill="${AR.s}"/></g>`).join('');
  const frente=verso?'':`<path d="${arco}" fill="none" stroke="url(#ct-aco)" stroke-width="1.3"/>
    <path d="M14.3 149 V30.4 Q14.3 17.3 27.2 17.3 H34.4 Q50 7.6 65.6 17.3 H72.8 Q85.7 17.3 85.7 30.4 V149" fill="none" stroke="${AR.ame}" stroke-width=".3" opacity=".6"/>
    <path d="M9 152.2 L14 149 V155.4 Z M91 152.2 L86 149 V155.4 Z" fill="url(#ct-aco)"/><path d="M14 147.8 H86 V156.6 H14 Z" fill="#0b0a0e" stroke="url(#ct-aco)" stroke-width=".45"/><path d="M16 149.2 H84 M16 155.2 H84" stroke="${AR.mid}" stroke-width=".18" opacity=".6"/>
    <rect x="${Q.x0}" y="${Q.y0}" width="${Q.x1-Q.x0}" height="${Q.y3-Q.y0}" fill="rgba(11,10,14,.55)" stroke="url(#ct-aco)" stroke-width=".5"/>
    <path d="M${Q.x0} ${Q.y1} H${Q.x1} M${Q.x0} ${Q.y2} H${Q.x1} M${Q.x0+QC} ${Q.y0} V${Q.y1} M${Q.x0+2*QC} ${Q.y0} V${Q.y1} M${Q.col} ${Q.y1} V${Q.y3}" stroke="${AR.mid}" stroke-width=".3" fill="none" opacity=".8"/>
    ${[[Q.x0,Q.y0],[Q.x1,Q.y0],[Q.x0,Q.y1],[Q.x1,Q.y1],[Q.x0,Q.y2],[Q.x1,Q.y2],[Q.x0,Q.y3],[Q.x1,Q.y3]].map(([x,y])=>`<path transform="translate(${x} ${y})" d="${estrela4(1.5)}" fill="${AR.s}"/>`).join('')}
    ${estrelaLado(7.4)}${estrelaLado(92.6)}`;
  return `<svg class="ct-molde" aria-hidden="true" viewBox="0 0 100 222" preserveAspectRatio="none"><defs><linearGradient id="ct-aco" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${AR.hi}"/><stop offset=".3" stop-color="${AR.mid}"/><stop offset=".55" stop-color="${AR.s}"/><stop offset="1" stop-color="#5d564c"/></linearGradient></defs>
    <rect x="2.4" y="2.4" width="95.2" height="217.2" rx="6.4" fill="none" stroke="${cor}" stroke-width="${[.35,.45,.55,.7,.85][n]}" opacity="${[.6,.8,.9,1,1][n]}"/>
    <rect x="5" y="5" width="90" height="212" rx="5" fill="none" stroke="url(#ct-aco)" stroke-width=".8"/><rect x="7.4" y="7.4" width="85.2" height="207.2" rx="3.6" fill="none" stroke="${AR.mid}" stroke-width=".25" opacity=".7"/>
    ${cantos}${frente}${ampulheta}${relogio}</svg>`;
}
function cartaFrente(c,colecao,src){
  const r=c.rar,n=BRILHO[r],cor=BORDA[r][0],frase=c.detalhe?'':c.flavor;
  const cel=(x,y,w,h)=>`left:${Q.x0+x}cqw;top:${y}cqw;width:${w}cqw;height:${h}cqw`;
  const celula=(rot,ic,val,st)=>`<span class="ct-cel" style="${st}"><span class="ct-rot">${rot}</span>${icoLucide(ic,'ct-ic')}<span class="ct-val">${val}</span></span>`;
  return `<div class="ct-carta" style="${fundoBorda(r)};box-shadow:${auraCarta(r)}">
    ${n>=2?`<span class="ct-reflexo" style="--a:${n===2?.35:n===3?.55:.8};animation-duration:${n===2?9:n===3?6.5:4.5}s"></span>`:''}
    <span class="ct-corpo"></span>
    <span class="ct-janela"><img src="${src}" alt="" draggable="false"><i></i><u></u></span>
    ${molduraSvg(false,cor,n)}
    <span class="ct-nome"><span>${c.nome}</span></span>
    ${celula('Arquétipo','BookOpen',c.arquetipo,cel(0,Q.y0,QC,Q.y1-Q.y0))}
    ${celula('Coleção','Hourglass',colecao,cel(QC,Q.y0,QC,Q.y1-Q.y0))}
    ${celula('Raridade','Gem',nomeRar(r),cel(2*QC,Q.y0,QC,Q.y1-Q.y0))}
    <span class="ct-cel" style="${cel(0,Q.y1,Q.col-Q.x0,Q.y2-Q.y1)}"><span class="ct-rot">Função</span>${icoLucide(GLIFO[c.id],'ct-ic2')}</span>
    <span class="ct-efeito" style="${cel(Q.col-Q.x0,Q.y1,Q.x1-Q.col,Q.y2-Q.y1)}"><span>${c.efeito}</span></span>
    <span class="ct-cel" style="${cel(0,Q.y2,Q.col-Q.x0,Q.y3-Q.y2)}"><span class="ct-rot">${RAIO[c.id]?'Raio':'Peso'}</span><span class="ct-peso">${icoLucide(RAIO[c.id]?'Crosshair':'Weight','ct-ic3')}<b>${RAIO[c.id]||c.peso}</b></span></span>
    <span class="ct-frase" style="${cel(Q.col-Q.x0,Q.y2,Q.x1-Q.col,Q.y3-Q.y2)}"><span>${frase?`“${frase}”`:(c.natureza||c.tipo)}</span></span>
  </div>`;
}
function cartaVerso(){
  return `<div class="ct-carta" style="${fundoBorda('comum')};box-shadow:0 12px 28px -14px rgba(0,0,0,.9)">
    <span class="ct-corpo"></span><span class="ct-trelica"></span>${molduraSvg(true,AR.s,0)}
    <span class="ct-selo"><span><svg viewBox="0 0 64 64" fill="none"><g stroke="currentColor"><circle cx="32" cy="32" r="29.5" stroke-width=".8" opacity=".55"/><circle cx="32" cy="32" r="26" stroke-width="1.6" stroke-dasharray=".8 3.3" opacity=".7"/><path d="M32 .5v4M32 59.5v4M.5 32h4M59.5 32h4"/></g><ellipse cx="32" cy="32" rx="27" ry="9.5" transform="rotate(-24 32 32)" stroke="currentColor" stroke-width="1.7"/><circle cx="55.6" cy="21.9" r="2.2" fill="currentColor"/><path d="M32 7C33.4 25.2 38.8 30.6 57 32C38.8 33.4 33.4 38.8 32 57C30.6 38.8 25.2 33.4 7 32C25.2 30.6 30.6 25.2 32 7ZM32 27.6a4.4 4.4 0 1 0 .001 0Z" fill="currentColor" fill-rule="evenodd"/><circle cx="32" cy="32" r="1.6" fill="currentColor"/></svg></span></span>
    <span class="ct-dv">Deadly · Vote</span></div>`;
}
