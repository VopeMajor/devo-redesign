import { BookOpen, Compass, Crosshair, Watch, Weight, type LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";
import { DuotoneArt } from "@/components/devo/kit";
import { getCard, getCardArquetipo, getCardMeta, getCardPeso, getCardRadius, RARITY_META } from "@/lib/devo/cards";
import { arteDaCarta } from "@/lib/devo/cartas-arte";
import type { GlyphName, Rarity } from "@/lib/devo/types";
import { cn } from "@/lib/utils";

/*
 * Carta DEVO no design do dono (22/10, referência "Alice: Procurando o Coelho"): carta alta (9:20), borda colorida
 * pela raridade, pergaminho com filetes dourados art nouveau, sol-bússola no alto, estrelas nas laterais, janela
 * em arco com a ilustração, faixa com o nome, quadro Arquétipo · Coleção · Raridade, Função, Raio (e Peso) e a frase,
 * e a lua no pé. Tudo medido em cqw (largura = 100cqw, altura = 222cqw), então a carta escala com o pai.
 * Abaixo de 260px de largura os textos do quadro somem (ficam os ícones); abaixo de 132px, também o nome.
 */

export const CARTA_SHELL = "relative aspect-[9/20] [container-type:inline-size]";

/** Borda de fora por raridade (a do exemplo, laranja, é a Rara). Textura de papel tingido por cima. */
export const BORDA: Record<Rarity, { cor: string; escura: string }> = {
  comum: { cor: "#8b8f96", escura: "#5c6067" },
  incomum: { cor: "#c9ced6", escura: "#8d939d" },
  rara: { cor: "#f2a23c", escura: "#d9822a" },
  ultra_rara: { cor: "#9a7ae0", escura: "#6c4fb8" },
  lendaria: { cor: "#e9c25a", escura: "#b8902c" },
  unica: { cor: "#b0313f", escura: "#7a1426" },
  promocional: { cor: "#9fd6e6", escura: "#8a6fd2" },
};

const GOLD = "#c9a24a";
const GOLD_LIGHT = "#f2d98c";
const GOLD_DARK = "#8a6a24";
const PAPER = "#f4e8c8";
const INK = "#3b2a17";

function fundoBorda(r: Rarity): CSSProperties {
  const b = BORDA[r];
  if (r === "promocional")
    return {
      backgroundImage:
        "radial-gradient(60% 40% at 30% 20%, rgba(255,255,255,0.35), transparent 70%), linear-gradient(125deg,#f7d3e6 0%,#c7b6f3 18%,#a6dfee 36%,#e7f4c4 52%,#f6caa6 68%,#cdb9f2 84%,#a9e2ec 100%)",
    };
  return {
    backgroundColor: b.cor,
    backgroundImage: `radial-gradient(40% 25% at 20% 15%, rgba(255,255,255,0.18), transparent 70%), radial-gradient(35% 30% at 80% 70%, ${b.escura}55, transparent 70%), radial-gradient(30% 20% at 60% 35%, ${b.escura}33, transparent 70%), repeating-radial-gradient(circle at 37% 61%, rgba(0,0,0,0.05) 0 0.6px, transparent 0.6px 2.4px), repeating-radial-gradient(circle at 71% 23%, rgba(255,255,255,0.06) 0 0.5px, transparent 0.5px 3.1px)`,
  };
}

/** Sol-bússola do alto: rosa dos ventos de oito pontas num disco, com raios ondulados em vermelho e ouro. */
function Sol() {
  const raios = Array.from({ length: 16 }, (_, i) => (i * 360) / 16);
  return (
    <g transform="translate(50 13)">
      {raios.map((a, i) => (
        <path
          key={a}
          transform={`rotate(${a})`}
          d={i % 2 ? "M-1.2 -8 Q0 -13 0 -15.5 Q0 -13 1.2 -8 Z" : "M-1.8 -8 Q-1 -12 0 -19 Q1 -12 1.8 -8 Z"}
          fill={i % 2 ? "#b83a2a" : GOLD}
          stroke={GOLD_DARK}
          strokeWidth="0.2"
        />
      ))}
      <circle r="8.6" fill={`url(#ct-ouro)`} stroke={GOLD_DARK} strokeWidth="0.35" />
      <circle r="7.2" fill="#7a2a1c" />
      <circle r="6.6" fill="none" stroke={GOLD_LIGHT} strokeWidth="0.25" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => (
        <path key={a} transform={`rotate(${a})`} d={i % 2 ? "M0 -4.4 L1 -1 L0 0 L-1 -1 Z" : "M0 -6.4 L1.3 -1.3 L0 0 L-1.3 -1.3 Z"} fill={i % 2 ? GOLD : GOLD_LIGHT} stroke={GOLD_DARK} strokeWidth="0.15" />
      ))}
      <circle r="0.9" fill={GOLD_DARK} />
    </g>
  );
}

/** Estrela de seis pontas dourada (laterais). */
function Estrela({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 -4.6 L1.2 -1.4 L4 -2.3 L2 0 L4 2.3 L1.2 1.4 L0 4.6 L-1.2 1.4 L-4 2.3 L-2 0 L-4 -2.3 L-1.2 -1.4 Z" fill={`url(#ct-ouro)`} stroke={GOLD_DARK} strokeWidth="0.25" />
      <circle r="0.7" fill="#7a2a1c" />
    </g>
  );
}

/** Moldura desenhada (SVG no tamanho da carta): pergaminho, filetes, arco da janela, faixa, quadro e lua. */
function Moldura({ verso = false }: { verso?: boolean }) {
  // janela em arco: 13..87 × 16..150 (o arco ocupa 14 de altura)
  const arco = "M13 150 V30 Q13 16 27 16 H34 Q50 6 66 16 H73 Q87 16 87 30 V150 Z";
  return (
    <svg aria-hidden="true" viewBox="0 0 100 222" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full">
      <defs>
        <linearGradient id="ct-ouro" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={GOLD_LIGHT} />
          <stop offset="0.45" stopColor={GOLD} />
          <stop offset="1" stopColor={GOLD_DARK} />
        </linearGradient>
        <linearGradient id="ct-faixa" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={GOLD_LIGHT} />
          <stop offset="0.5" stopColor="#e3c370" />
          <stop offset="1" stopColor="#a8822f" />
        </linearGradient>
      </defs>
      {/* pergaminho com um véu quente nas bordas */}
      <path d={`M10 5 H90 Q95 5 95 10 V212 Q95 217 90 217 H10 Q5 217 5 212 V10 Q5 5 10 5 Z${verso ? "" : ` ${arco}`}`} fill={PAPER} fillRule="evenodd" />
      <rect x="5" y="5" width="90" height="212" rx="5" fill="none" stroke={GOLD_DARK} strokeWidth="0.5" />
      <rect x="7.6" y="7.6" width="84.8" height="206.8" rx="3.6" fill="none" stroke={GOLD} strokeWidth="0.9" />
      <rect x="9.2" y="9.2" width="81.6" height="203.6" rx="3" fill="none" stroke={GOLD_DARK} strokeWidth="0.25" />
      {/* cantos art nouveau: volutas */}
      {[
        [9.2, 9.2, 1, 1],
        [90.8, 9.2, -1, 1],
        [9.2, 212.8, 1, -1],
        [90.8, 212.8, -1, -1],
      ].map(([x, y, sx, sy], i) => (
        <path key={i} transform={`translate(${x} ${y}) scale(${sx} ${sy})`} d="M0 9 Q0 0 9 0 M2.4 9 Q2.6 2.6 9 2.4 Q5 5 6 8 Q4 7 2.4 9" fill="none" stroke={GOLD} strokeWidth="0.55" />
      ))}
      {!verso && (
        <>
          {/* moldura da janela: filete grosso dourado + linha escura por dentro */}
          <path d={arco} fill="none" stroke={`url(#ct-ouro)`} strokeWidth="1.6" />
          <path d="M14.3 149 V30.4 Q14.3 17.3 27.2 17.3 H34.4 Q50 7.6 65.6 17.3 H72.8 Q85.7 17.3 85.7 30.4 V149" fill="none" stroke="#2a1a0a" strokeWidth="0.35" opacity="0.7" />
          {/* faixa do nome */}
          <path d="M6 147 L12 149.5 L9 152.5 L12 156 L6 158.5 L14 158 Z" fill="#a8822f" stroke={GOLD_DARK} strokeWidth="0.25" />
          <path d="M94 147 L88 149.5 L91 152.5 L88 156 L94 158.5 L86 158 Z" fill="#a8822f" stroke={GOLD_DARK} strokeWidth="0.25" />
          <path d="M12 146 Q50 143 88 146 V158.5 Q50 156 12 158.5 Z" fill="url(#ct-faixa)" stroke={GOLD_DARK} strokeWidth="0.35" />
          {/* quadro de informações */}
          <rect x="13" y="161.5" width="74" height="49" fill="none" stroke={GOLD} strokeWidth="0.55" />
          <path d="M13 179 H87 M13 197.5 H87 M37.7 161.5 V179 M62.3 161.5 V179 M33 179 V210.5" stroke={GOLD} strokeWidth="0.35" fill="none" />
          {[
            [13, 161.5],
            [87, 161.5],
            [13, 179],
            [87, 179],
            [13, 197.5],
            [87, 197.5],
            [13, 210.5],
            [87, 210.5],
          ].map(([x, y], i) => (
            <path key={i} transform={`translate(${x} ${y})`} d="M0 -1.6 L0.5 -0.5 L1.6 0 L0.5 0.5 L0 1.6 L-0.5 0.5 L-1.6 0 L-0.5 -0.5 Z" fill={GOLD} />
          ))}
          <Estrela x={7.4} y={85} />
          <Estrela x={92.6} y={85} />
        </>
      )}
      {/* lua no pé */}
      <g transform="translate(50 213.2)">
        <path d="M-3.8 -1.6 A4.2 4.2 0 1 0 3.8 -1.6 A3.4 3.4 0 1 1 -3.8 -1.6 Z" fill={`url(#ct-ouro)`} stroke={GOLD_DARK} strokeWidth="0.25" />
      </g>
      <Sol />
    </svg>
  );
}

function Celula({ rotulo, Icone, valor, style }: { rotulo: string; Icone: LucideIcon; valor: string; style: CSSProperties }) {
  return (
    <span className="absolute flex flex-col items-center justify-start gap-[0.5cqw] pt-[1cqw] text-center" style={style}>
      <span className="hidden font-serif text-[2.7cqw] uppercase leading-none tracking-[0.04em] @min-[260px]:block">{rotulo}</span>
      <Icone className="size-[5.4cqw] @min-[260px]:size-[4.6cqw]" strokeWidth={1.3} />
      <span className="hidden line-clamp-2 px-[1cqw] font-serif text-[2.6cqw] uppercase leading-[1.1] @min-[260px]:block">{valor}</span>
    </span>
  );
}

export function CartaFrente({
  cardId,
  rarity: rarityOverride,
  glyph: Glyph,
  fallbackArt,
  fallbackPos,
  className,
}: {
  cardId: string;
  rarity?: Rarity;
  /** Ícone da Função (o glifo da carta). */
  glyph: LucideIcon;
  /** Arte provisória (gravura do tipo) enquanto a carta não tem ilustração própria. */
  fallbackArt: string;
  fallbackPos: string;
  className?: string;
}) {
  const card = getCard(cardId);
  const meta = getCardMeta(cardId);
  const r = rarityOverride ?? card.rarity;
  const rotuloRaridade = RARITY_META[r].label;
  const arquetipo = getCardArquetipo(card);
  const raio = getCardRadius(cardId);
  const peso = getCardPeso(cardId);
  const arte = arteDaCarta(cardId);
  const frase = card.detalhe ? "" : card.flavor;
  const brilho = r === "lendaria" || r === "promocional";
  return (
    <article
      className={cn(CARTA_SHELL, "select-none overflow-hidden rounded-[4.5cqw] shadow-[0_12px_28px_-14px_rgba(0,0,0,0.9)]", className)}
      style={fundoBorda(r)}
      aria-label={`${card.name}. Arquétipo ${arquetipo}. Coleção ${meta.collection}. Raridade ${rotuloRaridade}. Função: ${card.effect}${raio !== "—" ? ` Raio: ${raio}.` : ""} Peso ${peso}.`}
    >
      {/* ilustração na janela em arco (por baixo da moldura) */}
      <span aria-hidden="true" className="absolute left-[13cqw] top-[6cqw] h-[144cqw] w-[74cqw] overflow-hidden bg-[#1a1530]">
        {arte ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={arte.src} srcSet={arte.srcSet} sizes="(min-width: 768px) 360px, 60vw" alt="" loading="lazy" decoding="async" className="size-full object-cover object-center" />
        ) : (
          <>
            <DuotoneArt src={fallbackArt} alt="" tone="violet" position={fallbackPos} contrast={1.25} className="size-full" />
            <span className="absolute inset-0 mix-blend-soft-light bg-[radial-gradient(70%_50%_at_50%_40%,rgba(242,217,140,0.45),transparent_70%),linear-gradient(180deg,#2b1f5c,#0d0a1c)]" />
          </>
        )}
        <span className="absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_45%,transparent_55%,rgba(10,6,20,0.55))]" />
        {brilho && (
          <span className="dvcard-holo absolute inset-0 opacity-40 mix-blend-color-dodge" style={{ backgroundImage: "linear-gradient(115deg, transparent 20%, rgba(242,217,140,0.45) 40%, rgba(194,185,236,0.4) 55%, transparent 75%)", backgroundSize: "260% 260%" }} />
        )}
      </span>
      <Moldura />
      {/* nome na faixa */}
      <span aria-hidden="true" className="absolute inset-x-[14cqw] top-[145cqw] hidden h-[12.5cqw] items-center justify-center text-center @min-[132px]:flex">
        <span className="line-clamp-1 font-serif text-[5.2cqw] font-semibold leading-none tracking-[0.01em]" style={{ color: INK }}>
          {card.name}
        </span>
      </span>
      {/* quadro de informações */}
      <span aria-hidden="true" className="absolute inset-0" style={{ color: INK }}>
        <Celula rotulo="Arquétipo" Icone={BookOpen} valor={arquetipo} style={{ left: "13cqw", top: "161.5cqw", width: "24.7cqw", height: "17.5cqw" }} />
        <Celula rotulo="Coleção" Icone={Watch} valor={meta.collection} style={{ left: "37.7cqw", top: "161.5cqw", width: "24.6cqw", height: "17.5cqw" }} />
        <Celula rotulo="Raridade" Icone={Compass} valor={rotuloRaridade} style={{ left: "62.3cqw", top: "161.5cqw", width: "24.7cqw", height: "17.5cqw" }} />
        <span className="absolute flex flex-col items-center justify-center gap-[0.6cqw]" style={{ left: "13cqw", top: "179cqw", width: "20cqw", height: "18.5cqw" }}>
          <span className="hidden font-serif text-[2.7cqw] uppercase leading-none tracking-[0.04em] @min-[260px]:block">Função</span>
          <Glyph className="size-[6cqw]" strokeWidth={1.3} />
        </span>
        <span className="absolute hidden items-center px-[1.6cqw] @min-[260px]:flex" style={{ left: "33cqw", top: "179cqw", width: "54cqw", height: "18.5cqw" }}>
          <span className="line-clamp-5 font-serif text-[3.1cqw] leading-[1.18]">{card.effect}</span>
        </span>
        <span className="absolute flex flex-col items-center justify-center gap-[0.4cqw]" style={{ left: "13cqw", top: "197.5cqw", width: "20cqw", height: "13cqw" }}>
          <span className="hidden font-serif text-[2.6cqw] uppercase leading-none tracking-[0.04em] @min-[260px]:block">{raio !== "—" ? "Raio" : "Peso"}</span>
          <span className="flex items-center gap-[1cqw]">
            {raio !== "—" ? <Crosshair className="size-[4.4cqw]" strokeWidth={1.3} /> : <Weight className="size-[4.4cqw]" strokeWidth={1.3} />}
            <span className="hidden font-serif text-[3.2cqw] leading-none @min-[260px]:inline">{raio !== "—" ? raio : peso}</span>
          </span>
        </span>
        <span className="absolute hidden items-center justify-center px-[2cqw] text-center @min-[260px]:flex" style={{ left: "33cqw", top: "197.5cqw", width: "54cqw", height: "13cqw" }}>
          <span className="line-clamp-2 font-serif text-[2.9cqw] italic leading-[1.18]">{frase ? `“${frase}”` : card.natureza ?? card.type}</span>
        </span>
      </span>
    </article>
  );
}

/** Verso: a mesma borda (neutra, índigo), pergaminho com o sol-bússola grande, céu estrelado e a lua. */
export function CartaVerso({ className, sigilo }: { className?: string; sigilo?: React.ReactNode }) {
  return (
    <div
      className={cn(CARTA_SHELL, "select-none overflow-hidden rounded-[4.5cqw] shadow-[0_12px_28px_-14px_rgba(0,0,0,0.9)]", className)}
      style={{ backgroundColor: "#2b2350", backgroundImage: "radial-gradient(50% 30% at 50% 40%, rgba(194,185,236,0.25), transparent 70%), repeating-radial-gradient(circle at 37% 61%, rgba(255,255,255,0.05) 0 0.6px, transparent 0.6px 2.4px)" }}
      role="img"
      aria-label="Verso de uma Carta DEVO"
    >
      <Moldura verso />
      <span aria-hidden="true" className="absolute inset-x-[13cqw] bottom-[16cqw] top-[26cqw] overflow-hidden rounded-t-[37cqw] bg-[radial-gradient(80%_60%_at_50%_45%,#3a2f7a,#120d2a_75%)] shadow-[0_0_0_1.2cqw_#c9a24a,0_0_0_1.6cqw_#8a6a24]">
        {Array.from({ length: 28 }, (_, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-[#f2d98c]"
            style={{ left: `${(i * 37) % 97}%`, top: `${(i * 53) % 95}%`, width: i % 5 === 0 ? "1.4cqw" : "0.7cqw", height: i % 5 === 0 ? "1.4cqw" : "0.7cqw", opacity: 0.35 + ((i * 7) % 6) / 10 }}
          />
        ))}
        <span className="absolute left-1/2 top-1/2 grid w-[64%] -translate-x-1/2 -translate-y-1/2 place-items-center text-[#f2d98c]">{sigilo}</span>
      </span>
      <span aria-hidden="true" className="absolute inset-x-0 bottom-[8cqw] hidden text-center font-serif text-[3.4cqw] uppercase tracking-[0.4em] text-[#8a6a24] @min-[140px]:block">
        Deadly · Vote
      </span>
    </div>
  );
}

export type { GlyphName };
