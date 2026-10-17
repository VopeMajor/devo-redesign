'use client'

import { useState, type CSSProperties } from 'react'
import { CASA_ARTE, CASA_ARTE_POS, casaSrcSet } from '@/lib/devo/casa-arte'
import { cn } from '@/lib/utils'

/**
 * CASA DO JOGADOR À NOITE (cenas `galo-casa` e futuras). Espaço pessoal com uma inquietação discreta:
 * papel de parede adamascado quase invisível, quadro torto, relógio parado, poltrona vazia virada para a porta.
 *
 * Camadas (de trás para a frente), todas em CSS/SVG leves (sem imagens obrigatórias, sem JS de animação):
 *  1. a PINTURA da Arte (`CASA_ARTE`, lib/devo/casa-arte.ts: porta fechada/entreaberta + cortina em paralaxe) com
 *     as luzes vivas por cima; se não houver/carregar, parede + lambri em CSS (abaixo);
 *  2. janela com lua e cortinas finas (o luar desce em feixe até o chão);
 *  3. porta com batente — ao abrir, a luz do corredor vaza em leque pelo assoalho;
 *  4. assoalho em perspectiva;
 *  5. primeiro plano: mesinha com abajur (luz quente que respira e falha no "A luz pisca") e a poltrona;
 *  6. poeira no feixe da lua + vinheta.
 * Responsivo: posições em % com tamanhos limitados (clamp); no celular a cena se apoia nas laterais.
 */
export function CasaNoite({ portaAberta, anima, fxKey, luzFalha }: { portaAberta: boolean; anima: boolean; fxKey: number; luzFalha: boolean }) {
  const [semArte, setSemArte] = useState(false)
  if (CASA_ARTE.cena && !semArte) return <CasaPintada portaAberta={portaAberta} fxKey={fxKey} luzFalha={luzFalha} onErro={() => setSemArte(true)} />
  return (
    <div className="cn-casa absolute inset-0 overflow-hidden bg-[#0f0e12]">
      <Parede />
      <Janela />
      {/* feixe de luar da janela até o chão */}
      <span className="cn-luar absolute left-[2%] top-[34%] h-[52%] w-[min(58%,520px)] bg-[linear-gradient(180deg,rgba(176,168,222,0.16),rgba(176,168,222,0.05)_70%,transparent)] mix-blend-screen [clip-path:polygon(16%_0,66%_0,100%_100%,0_100%)]" />
      <Poeira />

      <Porta aberta={portaAberta} anima={anima} fxKey={fxKey} desenhar />

      <Assoalho />
      {/* leque de luz do corredor no assoalho (só com a porta aberta) */}
      {portaAberta && (
        <span
          key={`leque${anima ? fxKey : 'x'}`}
          className={cn(
            'absolute bottom-0 right-0 h-[30%] w-[min(70%,640px)] bg-[linear-gradient(200deg,rgba(236,222,190,0.34),rgba(236,222,190,0.08)_55%,transparent_85%)] mix-blend-screen [clip-path:polygon(64%_0,90%_0,100%_100%,8%_100%)]',
            anima && 'cn-leque',
          )}
        />
      )}

      <Abajur falha={luzFalha} fxKey={fxKey} desenhar />
      <Poltrona />

      {/* vinheta: o canto do quarto engole a luz */}
      <span className="absolute inset-0 bg-[radial-gradient(120%_85%_at_45%_45%,transparent_42%,rgba(0,0,0,0.78))]" />
      <style>{CASA_CSS}</style>
    </div>
  )
}

/**
 * Quadro 2:3 que COBRE a tela (como object-cover), para que as luzes vivas fiquem sobre o abajur e a janela da
 * pintura em qualquer proporção. Celular: corta um pouco as laterais; desktop: corta em cima e embaixo.
 */
const QUADRO: CSSProperties = { width: 'max(100vw, 66.667dvh)', aspectRatio: '2 / 3', left: '50%', top: '54%', transform: 'translate(-50%, -50%)' }

/**
 * Casa pintada (CASA_ARTE): porta fechada ↔ entreaberta em cruzamento (a porta abre com o som, quando o Galo entra,
 * e fecha quando ele sai), luz quente do abajur que respira e falha no "A luz pisca", poeira no feixe do luar,
 * e o primeiro plano (a cortina vinho) com paralaxe lenta. A mesa do primeiro plano fica de fora (cairia atrás da
 * caixa de fala).
 */
function CasaPintada({ portaAberta, fxKey, luzFalha, onErro }: { portaAberta: boolean; fxKey: number; luzFalha: boolean; onErro: () => void }) {
  const { abajur, janela } = CASA_ARTE_POS
  return (
    <div className="cn-casa absolute inset-0 overflow-hidden bg-[#0f0e12]">
      <div className="absolute" style={QUADRO}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${CASA_ARTE.cena}-768.webp`} srcSet={casaSrcSet(CASA_ARTE.cena!)} sizes="max(100vw, 66.667dvh)" alt="" onError={onErro} className="absolute inset-0 size-full" />
        {CASA_ARTE.cenaPorta && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${CASA_ARTE.cenaPorta}-768.webp`}
            srcSet={casaSrcSet(CASA_ARTE.cenaPorta)}
            sizes="max(100vw, 66.667dvh)"
            alt=""
            className={cn('absolute inset-0 size-full transition-opacity ease-out', portaAberta ? 'opacity-100 duration-[1200ms]' : 'opacity-0 duration-[900ms]')}
          />
        )}
        {/* luz viva do abajur por cima da pintada */}
        <span
          key={luzFalha ? `f${fxKey}` : 'luz'}
          className={cn('absolute size-[46%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(closest-side,rgba(240,206,150,0.30),rgba(240,206,150,0.08)_55%,transparent)] mix-blend-screen', luzFalha ? 'cn-falha' : 'cn-respira')}
          style={{ left: `${abajur.x}%`, top: `${abajur.y}%` }}
        />
        {/* "A luz pisca": o abajur pintado também apaga (o quarto escurece em volta dele) */}
        {luzFalha && <span key={`e${fxKey}`} className="cn-escuro absolute inset-0 bg-black" />}
        {/* poeira no feixe do luar */}
        <span className="absolute h-[34%] w-[40%]" style={{ left: `${janela.x}%`, top: `${janela.y}%` }}>
          <Poeira />
        </span>
      </div>

      {CASA_ARTE.primeiroPlano && (
        <div className="cn-paralaxe pointer-events-none absolute" style={QUADRO}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${CASA_ARTE.primeiroPlano}-768.webp`}
            srcSet={casaSrcSet(CASA_ARTE.primeiroPlano)}
            sizes="max(100vw, 66.667dvh)"
            alt=""
            className="absolute inset-0 size-full -translate-x-[27%] brightness-[0.7] [clip-path:inset(0_0_44%_0)] [mask-image:linear-gradient(180deg,#000_46%,transparent_56%)]"
          />
        </div>
      )}

      <span className="absolute inset-0 bg-[radial-gradient(120%_85%_at_50%_45%,transparent_48%,rgba(0,0,0,0.72))]" />
      <style>{CASA_CSS}</style>
    </div>
  )
}

function Parede() {
  return (
    <>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#17151b,#1d1a20_52%,#121116)]" />
      {/* papel de parede adamascado, quase apagado */}
      <svg aria-hidden="true" className="absolute inset-x-0 top-0 h-[70%] w-full opacity-[0.07]">
        <defs>
          <pattern id="cn-damasco" width="54" height="78" patternUnits="userSpaceOnUse">
            <path
              d="M27 6c6 8 14 10 14 20s-8 14-14 22c-6-8-14-12-14-22S21 14 27 6Zm0 14c-3 4-6 6-6 10s3 7 6 10c3-3 6-6 6-10s-3-6-6-10Z"
              fill="none"
              stroke="#ece5d8"
              strokeWidth="0.9"
            />
            <path d="M0 66c6-4 10-4 14 0M40 66c4-4 8-4 14 0" fill="none" stroke="#ece5d8" strokeWidth="0.7" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cn-damasco)" />
      </svg>
      {/* lambri: faixa de madeira escura com filete champanhe */}
      <div className="absolute inset-x-0 bottom-[30%] h-[17%] bg-[linear-gradient(180deg,#1a1719,#141215)] shadow-[0_-1px_0_rgba(186,176,159,0.22),inset_0_10px_18px_rgba(0,0,0,0.45)]">
        <span className="absolute inset-x-0 top-[18%] h-px bg-[rgba(186,176,159,0.12)]" />
        <span className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0_22%,rgba(0,0,0,0.35)_22%_calc(22%+2px))] opacity-70" />
      </div>
      {/* quadro torto: um retrato que ninguém lembra de ter pendurado */}
      <div className="absolute left-[45%] top-[17%] h-[clamp(70px,13%,130px)] w-[clamp(54px,10%,100px)] rotate-[-4deg] bg-[linear-gradient(160deg,#2a2622,#151316)] shadow-[0_0_0_3px_#3a342c,0_0_0_4px_rgba(186,176,159,0.35),6px_10px_18px_rgba(0,0,0,0.7)]">
        <span className="absolute inset-[16%] rounded-[50%_50%_44%_44%] bg-[radial-gradient(60%_50%_at_50%_38%,#3a3436,#18161a_70%)]" />
        <span className="absolute inset-x-[30%] bottom-[12%] h-[22%] rounded-t-full bg-[#121014]" />
      </div>
      {/* relógio de parede parado (os ponteiros não se mexem: 3h17) */}
      <svg aria-hidden="true" viewBox="0 0 40 40" className="absolute left-[60%] top-[12%] size-[clamp(30px,6vmin,52px)] opacity-80">
        <circle cx="20" cy="20" r="17" fill="#141216" stroke="#6b6357" strokeWidth="1.4" />
        <circle cx="20" cy="20" r="14.5" fill="none" stroke="#bab09f" strokeOpacity="0.25" strokeWidth="0.6" />
        <path d="M20 20 27 22M20 20 22 9" stroke="#bab09f" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="20" cy="20" r="1.3" fill="#bab09f" />
      </svg>
    </>
  )
}

function Janela() {
  return (
    <div className="absolute left-[7%] top-[14%] h-[clamp(150px,26%,300px)] w-[clamp(112px,28%,260px)]">
      {/* céu e lua lá fora */}
      <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(180deg,#1d1c2c,#2a2840_60%,#1a1922)]">
        <span className="absolute right-[18%] top-[16%] size-[34%] max-h-[64px] max-w-[64px] rounded-full bg-[radial-gradient(circle_at_40%_40%,#f4efe6,#cfc8e6_60%,#9d96c2)] shadow-[0_0_30px_10px_rgba(196,188,236,0.28)]" />
        <span className="cn-nuvem absolute -left-1/4 top-[30%] h-[14%] w-[90%] rounded-full bg-[rgba(20,19,28,0.75)] blur-[3px]" />
        {/* telhados ao longe */}
        <svg aria-hidden="true" viewBox="0 0 100 40" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[34%] w-full" fill="#0d0c12">
          <path d="M0 40V22l8-6 8 6v-8h6v8l10-9 10 9V18l12-10 12 10v6l10-7 10 7V12h4v28Z" />
        </svg>
      </div>
      {/* caixilho e vidraças */}
      <span className="absolute inset-0 shadow-[inset_0_0_0_4px_#2a272c,0_0_0_2px_#1c1a1f,0_0_0_3px_rgba(186,176,159,0.3),0_0_60px_rgba(168,155,224,0.12)]" />
      <span className="absolute inset-y-0 left-1/2 w-[4px] -translate-x-1/2 bg-[#2a272c]" />
      <span className="absolute inset-x-0 top-[48%] h-[4px] bg-[#2a272c]" />
      {/* cortinas finas, mexendo devagar */}
      <span className="cn-cortina absolute -left-[12%] -top-[6%] h-[118%] w-[30%] origin-top bg-[linear-gradient(90deg,rgba(60,52,66,0.92),rgba(60,52,66,0.55)_70%,rgba(60,52,66,0.2))] [clip-path:polygon(0_0,100%_0,70%_100%,0_100%)]" />
      <span className="cn-cortina absolute -right-[12%] -top-[6%] h-[118%] w-[30%] origin-top bg-[linear-gradient(270deg,rgba(60,52,66,0.92),rgba(60,52,66,0.55)_70%,rgba(60,52,66,0.2))] [animation-delay:-4s] [clip-path:polygon(0_0,100%_0,100%_100%,30%_100%)]" />
      {/* parapeito */}
      <span className="absolute -inset-x-[8%] -bottom-[6%] h-[6%] bg-[linear-gradient(180deg,#3a342c,#1c1a1f)] shadow-[0_6px_10px_rgba(0,0,0,0.5)]" />
    </div>
  )
}

function Porta({ aberta, anima, fxKey, desenhar }: { aberta: boolean; anima: boolean; fxKey: number; desenhar: boolean }) {
  return (
    <div className="absolute bottom-[30%] right-[8%] aspect-[9/20] h-[min(46%,420px)]">
      {/* luz do corredor (atrás da folha) */}
      {aberta && (
        <span
          key={`luz${anima ? fxKey : 'x'}`}
          className={cn(
            'absolute inset-[5px] bg-[linear-gradient(90deg,rgba(244,232,206,0.75),rgba(236,222,190,0.28))] shadow-[0_0_60px_16px_rgba(236,222,190,0.16)]',
            anima && 'cn-luz-porta',
          )}
        />
      )}
      {desenhar && (
        <>
          {/* batente */}
          <span className="pointer-events-none absolute -inset-[7px] shadow-[inset_0_0_0_7px_#26222a,0_0_0_1px_rgba(186,176,159,0.3),inset_0_0_0_8px_rgba(186,176,159,0.18)]" />
          {/* folha */}
          <span
            key={`porta${anima ? fxKey : 'x'}`}
            className={cn(
              'absolute inset-[5px] origin-left bg-[linear-gradient(90deg,#211e24,#17151a)] shadow-[inset_0_0_0_1px_#2e2a31]',
              anima ? (aberta ? 'cn-porta-abre' : 'cn-porta-fecha') : aberta && '[transform:perspective(600px)_rotateY(-74deg)]',
            )}
          >
            <span className="absolute inset-x-[14%] top-[7%] h-[34%] border border-[#2f2b32] shadow-[inset_0_0_0_3px_rgba(0,0,0,0.25)]" />
            <span className="absolute inset-x-[14%] bottom-[7%] h-[44%] border border-[#2f2b32] shadow-[inset_0_0_0_3px_rgba(0,0,0,0.25)]" />
            {/* olho mágico (uma luz fraca demais para um corredor vazio) */}
            <span className="absolute left-1/2 top-[30%] size-1.5 -translate-x-1/2 rounded-full bg-[#bab09f]/40 shadow-[0_0_4px_rgba(236,222,190,0.5)]" />
            <span className="absolute right-[11%] top-[52%] h-2 w-3 rounded-sm bg-[linear-gradient(180deg,#d9d1bf,#8a8170)]" />
          </span>
        </>
      )}
      {/* fresta de luz por baixo (porta fechada): alguém lá fora? */}
      {!aberta && <span className="cn-fresta absolute inset-x-[6px] -bottom-[1px] h-[2px] bg-[rgba(236,222,190,0.45)] blur-[1px]" />}
    </div>
  )
}

function Assoalho() {
  return (
    <div className="absolute inset-x-0 bottom-0 h-[30%] overflow-hidden bg-[linear-gradient(180deg,#141215,#0a090b)] shadow-[0_-1px_0_rgba(186,176,159,0.2)]">
      <span
        className="absolute -inset-x-1/2 inset-y-0 origin-top opacity-60 [transform:perspective(320px)_rotateX(52deg)]"
        style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.55) 0 2px, transparent 2px 64px), linear-gradient(180deg, #1c1919, #121012)' } as CSSProperties}
      />
      {/* tapete gasto */}
      <span className="absolute bottom-[14%] left-[22%] h-[36%] w-[46%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(74,30,38,0.55),rgba(42,18,24,0.4)_70%,transparent)]" />
    </div>
  )
}

function Abajur({ falha, fxKey, desenhar }: { falha: boolean; fxKey: number; desenhar: boolean }) {
  return (
    <>
      {/* halo quente na parede e no chão */}
      <span
        key={falha ? `f${fxKey}` : 'luz'}
        className={cn(
          'absolute bottom-[14%] left-[-12%] h-[62%] w-[min(80%,620px)] bg-[radial-gradient(closest-side,rgba(232,206,160,0.26),rgba(232,206,160,0.08)_55%,transparent)] mix-blend-screen',
          falha ? 'cn-falha' : 'cn-respira',
        )}
      />
      {desenhar && (
        <svg aria-hidden="true" viewBox="0 0 120 200" className="absolute bottom-[18%] left-[9%] h-[clamp(140px,26%,260px)]" preserveAspectRatio="xMidYMax meet">
          <defs>
            <linearGradient id="cn-cupula" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#e9d7b0" stopOpacity="0.95" />
              <stop offset="1" stopColor="#b59a6c" stopOpacity="0.85" />
            </linearGradient>
          </defs>
          {/* mesinha */}
          <path d="M14 132h92l-6 8H20Z" fill="#26201d" />
          <path d="M24 140h4v58h-4ZM92 140h4v58h-4Z" fill="#1b1714" />
          <path d="M30 168h60" stroke="#1b1714" strokeWidth="3" />
          {/* livro e xícara */}
          <rect x="72" y="124" width="26" height="8" fill="#3a2226" />
          <path d="M26 126h10v6H26Z" fill="#2e2a2f" />
          {/* pé e cúpula */}
          <path d="M56 132h12l-2-4h-8Z" fill="#6b6357" />
          <path d="M60 128V76" stroke="#8a8170" strokeWidth="2.4" />
          <path className={falha ? undefined : 'cn-cupula'} d="M36 78h48l-10-34H46Z" fill="url(#cn-cupula)" />
          <path d="M36 78h48" stroke="#f4efe6" strokeOpacity="0.6" />
        </svg>
      )}
    </>
  )
}

function Poltrona() {
  return (
    <svg aria-hidden="true" viewBox="0 0 220 180" className="absolute -bottom-[2%] right-[-6%] h-[clamp(120px,22%,230px)] opacity-95" preserveAspectRatio="xMaxYMax meet">
      {/* poltrona vazia, virada para a porta */}
      <path d="M40 60c0-30 26-50 70-50s72 20 72 50v40H40Z" fill="#1b1619" stroke="#3a3034" strokeWidth="1.2" />
      <path d="M22 96c0-14 10-22 22-22s20 8 20 22v60H22ZM158 96c0-14 10-22 22-22s20 8 20 22v60h-42Z" fill="#161215" stroke="#3a3034" strokeWidth="1.2" />
      <path d="M58 104h106v34H58Z" fill="#1e181b" />
      <path d="M30 156h162v8H30Z" fill="#0f0c0e" />
      <path d="M44 22c20-10 70-12 100-2" stroke="#bab09f" strokeOpacity="0.18" fill="none" />
    </svg>
  )
}

function Poeira() {
  return (
    <span className="cn-poeira absolute left-[8%] top-[38%] h-[40%] w-[min(40%,360px)] opacity-60 mix-blend-screen [mask-image:linear-gradient(180deg,#000,transparent)]">
      {[
        [12, 18],
        [34, 52],
        [58, 26],
        [72, 70],
        [22, 80],
        [46, 40],
      ].map(([x, y], i) => (
        <span key={i} className="cn-grao absolute size-[2px] rounded-full bg-[#ece5d8]" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${-i * 2.3}s` }} />
      ))}
    </span>
  )
}

const CASA_CSS = `
.cn-porta-abre{animation:cn-porta 1.3s cubic-bezier(.16,1,.3,1) both}
.cn-porta-fecha{animation:cn-porta 1s cubic-bezier(.6,0,.9,.4) reverse both}
.cn-luz-porta{animation:cn-acende 1.3s ease-out both}
.cn-leque{animation:cn-acende 1.6s ease-out both}
.cn-respira{animation:cn-respira 7s ease-in-out infinite}
.cn-falha{animation:cn-falha 1.1s steps(1) both}
.cn-cortina{animation:cn-cortina 9s ease-in-out infinite alternate}
.cn-nuvem{animation:cn-nuvem 60s linear infinite}
.cn-grao{animation:cn-grao 14s ease-in-out infinite}
.cn-fresta{animation:cn-fresta 6s ease-in-out infinite}
.cn-paralaxe{animation:cn-paralaxe 16s ease-in-out infinite alternate}
.cn-escuro{animation:cn-escuro 1.1s steps(1) both;pointer-events:none}
@keyframes cn-paralaxe{0%{transform:translate(-50%,-50%) translateX(-1.2%)}100%{transform:translate(-50%,-50%) translateX(1.2%)}}
@keyframes cn-escuro{0%{opacity:0}12%{opacity:.55}24%{opacity:.1}36%{opacity:.7}62%{opacity:.3}74%{opacity:.6}100%{opacity:0}}
@keyframes cn-porta{0%{transform:perspective(600px) rotateY(0)}100%{transform:perspective(600px) rotateY(-74deg)}}
@keyframes cn-acende{0%{opacity:0}100%{opacity:1}}
@keyframes cn-respira{0%,100%{opacity:.92}50%{opacity:1}}
@keyframes cn-falha{0%{opacity:1}12%{opacity:.1}24%{opacity:.9}36%{opacity:0}62%{opacity:.6}74%{opacity:.05}100%{opacity:1}}
@keyframes cn-cortina{0%{transform:skewX(0deg)}100%{transform:skewX(2.4deg)}}
@keyframes cn-nuvem{0%{transform:translateX(0)}100%{transform:translateX(140%)}}
@keyframes cn-grao{0%,100%{transform:translate(0,0);opacity:.2}50%{transform:translate(10px,-16px);opacity:.9}}
@keyframes cn-fresta{0%,100%{opacity:.35}50%{opacity:.6}}
@media (prefers-reduced-motion: reduce){.cn-casa *{animation-duration:.01s!important;animation-iteration-count:1!important}}
`
