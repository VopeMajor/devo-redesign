import { BookOpen, Crosshair, Gem, Hourglass, Weight, type LucideIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { DuotoneArt } from "@/components/devo/kit";
import { getCard, getCardArquetipo, getCardMeta, getCardPeso, getCardRadius, RARITY_META } from "@/lib/devo/cards";
import { arteDaCarta } from "@/lib/devo/cartas-arte";
import type { GlyphName, Rarity } from "@/lib/devo/types";
import { cn } from "@/lib/utils";

/*
 * Carta DEVO. Estrutura do design do dono (22/10, referência "Alice: Procurando o Coelho"): carta alta (9:20),
 * ornamento no alto, estrelas nas laterais, janela em arco com a ilustração, faixa com o nome, quadro
 * Arquétipo · Coleção · Raridade, Função, Raio (ou Peso) e a frase, e um selo no pé.
 * Pele do DEVO (pedido do dono: "mais devo"): mármore negro no corpo, aço champanhe nos filetes (sem ouro amarelo),
 * relógio com ponteiros-agulha no alto (o Tempo é a vida), estrelas de quatro pontas do sigilo, ampulheta no pé,
 * acento ametista. A raridade aparece só num filete fino e nas pedras das estrelas.
 * Tudo medido em cqw (largura = 100cqw, altura = 222cqw). Abaixo de 260px de largura os textos do quadro somem
 * (ficam os ícones); abaixo de 132px, também o nome.
 */

export const CARTA_SHELL = "relative aspect-[9/20] [container-type:inline-size]";

/** Cor da raridade (filete fino e pedras). */
export const BORDA: Record<Rarity, { cor: string; escura: string }> = {
  comum: { cor: "#8f8e8b", escura: "#3a3a3e" },
  incomum: { cor: "#d4d4d8", escura: "#5e5e63" },
  rara: { cor: "#d6cdbd", escura: "#5d564c" },
  ultra_rara: { cor: "#bcb0e2", escura: "#4a4170" },
  lendaria: { cor: "#c2b9ec", escura: "#4a4180" },
  unica: { cor: "#c9566a", escura: "#5c0f1c" },
  promocional: { cor: "#b4dfe8", escura: "#6a54b0" },
};

/* aço champanhe (a mesma família do resto do sistema) */
const STEEL_HI = "#f4efe6";
const STEEL = "#d6cdbd";
const STEEL_MID = "#9a9184";
const STEEL_DARK = "#4d473f";
const AMETHYST = "#8a7cc8";
const TEXT = "#ece8e1";
const TEXT_SOFT = "#b9b2a6";

/** Borda: abismo com o véu da raridade, quase imperceptível. */
function fundoBorda(r: Rarity): CSSProperties {
  const b = BORDA[r];
  return {
    backgroundColor: "#0b0a0e",
    backgroundImage: `radial-gradient(70% 40% at 50% 0%, ${b.escura}55, transparent 70%), radial-gradient(60% 35% at 50% 100%, ${b.escura}33, transparent 70%), linear-gradient(160deg, #18161d, #08070a)`,
  };
}

/** Mármore negro do corpo (a mesma pedra do shell). */
const MARMORE: CSSProperties = {
  backgroundColor: "#141317",
  backgroundImage: "radial-gradient(120% 60% at 50% 0%, rgba(236,229,216,0.06), transparent 60%), url(/images/os/marmore-negro.webp)",
  backgroundSize: "auto, 260px 260px",
};

/** Agulha em losango de (0,-a) a (0,-b), meia-largura w (o traço dos emblemas do DEVO). */
const agulha = (a: number, b: number, w: number) => `M0 ${-a} L${w} ${-(a + (b - a) * 0.35)} L0 ${-b} L${-w} ${-(a + (b - a) * 0.35)} Z`;
/** Estrela de quatro pontas côncava (o sigilo). */
const estrela4 = (R: number, k = 0.2) => {
  const c = R * k;
  return `M0 ${-R} Q${c} ${-c} ${R} 0 Q${c} ${c} 0 ${R} Q${-c} ${c} ${-R} 0 Q${-c} ${-c} 0 ${-R} Z`;
};

/** Relógio do alto: mostrador negro, doze marcas, ponteiros-agulha parados, agulhas em volta e pedra ametista. */
function Relogio({ cor }: { cor: string }) {
  const marcas = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <g transform="translate(50 13)">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => (
        <path key={a} transform={`rotate(${a})`} d={i % 2 ? agulha(8.4, 13.5, 0.9) : agulha(8.4, 18.5, 1.3)} fill="url(#ct-aco)" stroke={STEEL_DARK} strokeWidth="0.15" />
      ))}
      <circle r="8.8" fill="url(#ct-aco)" stroke={STEEL_DARK} strokeWidth="0.3" />
      <circle r="7.4" fill="#0e0d11" />
      <circle r="6.8" fill="none" stroke={STEEL_MID} strokeWidth="0.2" />
      {marcas.map((a, i) => (
        <path key={a} transform={`rotate(${a})`} d={i % 3 === 0 ? "M0 -6.5 L0.45 -5.4 L0 -4.4 L-0.45 -5.4 Z" : "M0 -6.3 V-5.4"} fill={STEEL} stroke={STEEL} strokeWidth="0.25" />
      ))}
      {/* ponteiros: onze e cinquenta e cinco, parados */}
      <path transform="rotate(-30)" d={agulha(0, 3.6, 0.55)} fill={STEEL_HI} />
      <path transform="rotate(-6)" d={agulha(0, 5.6, 0.4)} fill={STEEL} />
      <circle r="0.95" fill={cor} stroke={STEEL_HI} strokeWidth="0.2" />
    </g>
  );
}

/** Estrela de quatro pontas do sigilo com uma pedra da raridade (laterais). */
function Estrela({ x, y, cor }: { x: number; y: number; cor: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={estrela4(4.6, 0.18)} fill="url(#ct-aco)" stroke={STEEL_DARK} strokeWidth="0.2" />
      <path d={`M0 -1.1 L0.8 0 L0 1.1 L-0.8 0 Z`} fill={cor} />
    </g>
  );
}

/** Ampulheta no pé (no lugar da lua). */
function Ampulheta() {
  return (
    <g transform="translate(50 213.4)">
      <path d="M-2.6 -3.4 H2.6 M-2.6 3.4 H2.6" stroke={STEEL} strokeWidth="0.55" />
      <path d="M-2 -3 L2 -3 L0.25 0 L2 3 L-2 3 L-0.25 0 Z" fill="#0e0d11" stroke="url(#ct-aco)" strokeWidth="0.45" />
      <path d="M-1.1 -2.4 L1.1 -2.4 L0 -0.6 Z M-1.3 2.6 L1.3 2.6 L0 1.4 Z" fill={AMETHYST} opacity="0.85" />
    </g>
  );
}

/** Moldura desenhada (SVG no tamanho da carta): filetes de aço, arco da janela, faixa, quadro e os selos. */
function Moldura({ verso = false, cor }: { verso?: boolean; cor: string }) {
  // janela em arco: 13..87 × 6..150
  const arco = "M13 150 V30 Q13 16 27 16 H34 Q50 6 66 16 H73 Q87 16 87 30 V150 Z";
  return (
    <svg aria-hidden="true" viewBox="0 0 100 222" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full">
      <defs>
        <linearGradient id="ct-aco" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={STEEL_HI} />
          <stop offset="0.3" stopColor={STEEL_MID} />
          <stop offset="0.55" stopColor={STEEL} />
          <stop offset="1" stopColor="#5d564c" />
        </linearGradient>
      </defs>
      {/* filete da raridade logo dentro da borda */}
      <rect x="2.4" y="2.4" width="95.2" height="217.2" rx="6.4" fill="none" stroke={cor} strokeWidth="0.45" opacity="0.9" />
      {/* filetes de aço do corpo */}
      <rect x="5" y="5" width="90" height="212" rx="5" fill="none" stroke="url(#ct-aco)" strokeWidth="0.8" />
      <rect x="7.4" y="7.4" width="85.2" height="207.2" rx="3.6" fill="none" stroke={STEEL_MID} strokeWidth="0.25" opacity="0.7" />
      {/* cantos: agulha e estrelinha, como nos emblemas */}
      {[
        [7.4, 7.4, 45],
        [92.6, 7.4, 135],
        [7.4, 214.6, -45],
        [92.6, 214.6, -135],
      ].map(([x, y, a], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${a})`}>
          <path d={agulha(0, 7, 0.7)} transform="rotate(90)" fill="url(#ct-aco)" />
          <path d={estrela4(1.6)} transform="translate(5.2 0)" fill={STEEL} />
        </g>
      ))}
      {!verso && (
        <>
          {/* moldura da janela: filete de aço + linha ametista por dentro */}
          <path d={arco} fill="none" stroke="url(#ct-aco)" strokeWidth="1.3" />
          <path d="M14.3 149 V30.4 Q14.3 17.3 27.2 17.3 H34.4 Q50 7.6 65.6 17.3 H72.8 Q85.7 17.3 85.7 30.4 V149" fill="none" stroke={AMETHYST} strokeWidth="0.3" opacity="0.6" />
          {/* faixa do nome: barra negra com pontas em agulha */}
          <path d="M9 152.2 L14 149 V155.4 Z M91 152.2 L86 149 V155.4 Z" fill="url(#ct-aco)" />
          <path d="M14 147.8 H86 V156.6 H14 Z" fill="#0b0a0e" stroke="url(#ct-aco)" strokeWidth="0.45" />
          <path d="M16 149.2 H84 M16 155.2 H84" stroke={STEEL_MID} strokeWidth="0.18" opacity="0.6" />
          {/* quadro de informações */}
          <rect x="13" y="161.5" width="74" height="49" fill="rgba(11,10,14,0.55)" stroke="url(#ct-aco)" strokeWidth="0.5" />
          <path d="M13 179 H87 M13 197.5 H87 M37.7 161.5 V179 M62.3 161.5 V179 M33 179 V210.5" stroke={STEEL_MID} strokeWidth="0.3" fill="none" opacity="0.8" />
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
            <path key={i} transform={`translate(${x} ${y})`} d={estrela4(1.5)} fill={STEEL} />
          ))}
          <Estrela x={7.4} y={85} cor={cor} />
          <Estrela x={92.6} y={85} cor={cor} />
        </>
      )}
      <Ampulheta />
      <Relogio cor={cor} />
    </svg>
  );
}

function Celula({ rotulo, Icone, valor, style }: { rotulo: string; Icone: LucideIcon; valor: string; style: CSSProperties }) {
  return (
    <span className="absolute flex flex-col items-center justify-start gap-[0.6cqw] pt-[1.2cqw] text-center" style={style}>
      <span className="hidden font-mono text-[2cqw] uppercase leading-none tracking-[0.16em] @min-[260px]:block" style={{ color: TEXT_SOFT }}>
        {rotulo}
      </span>
      <Icone className="size-[5.4cqw] @min-[260px]:size-[4.4cqw]" strokeWidth={1.2} style={{ color: STEEL }} />
      <span className="hidden line-clamp-2 px-[1cqw] font-display text-[2.3cqw] uppercase leading-[1.1] tracking-[0.04em] @min-[260px]:block">{valor}</span>
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
  const cor = BORDA[r].cor;
  return (
    <article
      className={cn(CARTA_SHELL, "select-none overflow-hidden rounded-[4.5cqw] shadow-[0_12px_28px_-14px_rgba(0,0,0,0.9)]", className)}
      style={fundoBorda(r)}
      aria-label={`${card.name}. Arquétipo ${arquetipo}. Coleção ${meta.collection}. Raridade ${rotuloRaridade}. Função: ${card.effect}${raio !== "—" ? ` Raio: ${raio}.` : ""} Peso ${peso}.`}
    >
      {/* corpo de mármore negro */}
      <span aria-hidden="true" className="absolute inset-[5cqw] rounded-[5cqw]" style={MARMORE} />
      {/* ilustração na janela em arco */}
      <span
        aria-hidden="true"
        className="absolute left-[13cqw] top-[6cqw] h-[144cqw] w-[74cqw] overflow-hidden bg-[#120f1c]"
        style={{ clipPath: "polygon(0.0% 100.0%, 0.0% 16.7%, 0.3% 14.4%, 1.2% 12.4%, 2.7% 10.7%, 4.7% 9.4%, 7.4% 8.3%, 10.6% 7.6%, 14.5% 7.1%, 18.9% 6.9%, 28.4% 6.9%, 33.8% 5.4%, 39.2% 4.3%, 44.6% 3.7%, 50.0% 3.5%, 55.4% 3.7%, 60.8% 4.3%, 66.2% 5.4%, 71.6% 6.9%, 81.1% 6.9%, 85.5% 7.1%, 89.4% 7.6%, 92.6% 8.3%, 95.3% 9.4%, 97.3% 10.7%, 98.8% 12.4%, 99.7% 14.4%, 100.0% 16.7%, 100.0% 100.0%)" }}
      >
        {arte ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={arte.src} srcSet={arte.srcSet} sizes="(min-width: 768px) 360px, 60vw" alt="" loading="lazy" decoding="async" className="size-full object-cover object-center" />
        ) : (
          <DuotoneArt src={fallbackArt} alt="" tone="violet" position={fallbackPos} contrast={1.3} className="size-full" />
        )}
        <span className="absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_45%,transparent_50%,rgba(8,7,10,0.7))]" />
        <span className="absolute inset-x-0 bottom-0 h-[20%] bg-[linear-gradient(to_top,rgba(8,7,10,0.85),transparent)]" />
        {brilho && (
          <span
            className="dvcard-holo absolute inset-0 opacity-35 mix-blend-color-dodge"
            style={{ backgroundImage: "linear-gradient(115deg, transparent 20%, rgba(194,185,236,0.45) 40%, rgba(236,229,216,0.4) 55%, transparent 75%)", backgroundSize: "260% 260%" }}
          />
        )}
      </span>
      <Moldura cor={cor} />
      {/* nome na faixa */}
      <span aria-hidden="true" className="absolute inset-x-[15cqw] top-[147.8cqw] hidden h-[8.8cqw] items-center justify-center text-center @min-[132px]:flex">
        <span className="line-clamp-1 font-display text-[4.1cqw] font-semibold uppercase leading-none tracking-[0.08em]" style={{ color: TEXT }}>
          {card.name}
        </span>
      </span>
      {/* quadro de informações */}
      <span aria-hidden="true" className="absolute inset-0" style={{ color: TEXT }}>
        <Celula rotulo="Arquétipo" Icone={BookOpen} valor={arquetipo} style={{ left: "13cqw", top: "161.5cqw", width: "24.7cqw", height: "17.5cqw" }} />
        <Celula rotulo="Coleção" Icone={Hourglass} valor={meta.collection} style={{ left: "37.7cqw", top: "161.5cqw", width: "24.6cqw", height: "17.5cqw" }} />
        <Celula rotulo="Raridade" Icone={Gem} valor={rotuloRaridade} style={{ left: "62.3cqw", top: "161.5cqw", width: "24.7cqw", height: "17.5cqw" }} />
        <span className="absolute flex flex-col items-center justify-center gap-[0.6cqw]" style={{ left: "13cqw", top: "179cqw", width: "20cqw", height: "18.5cqw" }}>
          <Rotulo>Função</Rotulo>
          <Glyph className="size-[6cqw]" strokeWidth={1.2} style={{ color: STEEL }} />
        </span>
        <span className="absolute hidden items-center px-[1.8cqw] @min-[260px]:flex" style={{ left: "33cqw", top: "179cqw", width: "54cqw", height: "18.5cqw" }}>
          <span className="line-clamp-5 font-body text-[3cqw] leading-[1.18]">{card.effect}</span>
        </span>
        <span className="absolute flex flex-col items-center justify-center gap-[0.5cqw]" style={{ left: "13cqw", top: "197.5cqw", width: "20cqw", height: "13cqw" }}>
          <Rotulo>{raio !== "—" ? "Raio" : "Peso"}</Rotulo>
          <span className="flex items-center gap-[1cqw]">
            {raio !== "—" ? <Crosshair className="size-[4.2cqw]" strokeWidth={1.2} style={{ color: STEEL }} /> : <Weight className="size-[4.2cqw]" strokeWidth={1.2} style={{ color: STEEL }} />}
            <span className="hidden font-impact text-[3.4cqw] leading-none @min-[260px]:inline">{raio !== "—" ? raio : peso}</span>
          </span>
        </span>
        <span className="absolute hidden items-center justify-center px-[2cqw] text-center @min-[260px]:flex" style={{ left: "33cqw", top: "197.5cqw", width: "54cqw", height: "13cqw" }}>
          <span className="line-clamp-2 font-body text-[2.9cqw] italic leading-[1.18]" style={{ color: TEXT_SOFT }}>
            {frase ? `“${frase}”` : card.natureza ?? card.type}
          </span>
        </span>
      </span>
    </article>
  );
}

function Rotulo({ children }: { children: ReactNode }) {
  return (
    <span className="hidden font-mono text-[2cqw] uppercase leading-none tracking-[0.16em] @min-[260px]:block" style={{ color: TEXT_SOFT }}>
      {children}
    </span>
  );
}

/** Verso: mármore negro, treliça de aço, o sigilo do Deadly Vote num medalhão e o relógio no alto. */
export function CartaVerso({ className, sigilo }: { className?: string; sigilo?: ReactNode }) {
  return (
    <div
      className={cn(CARTA_SHELL, "select-none overflow-hidden rounded-[4.5cqw] shadow-[0_12px_28px_-14px_rgba(0,0,0,0.9)]", className)}
      style={fundoBorda("rara")}
      role="img"
      aria-label="Verso de uma Carta DEVO"
    >
      <span aria-hidden="true" className="absolute inset-[5cqw] rounded-[5cqw]" style={MARMORE} />
      <span
        aria-hidden="true"
        className="absolute inset-x-[10cqw] bottom-[14cqw] top-[26cqw] opacity-45"
        style={{
          backgroundImage: "linear-gradient(60deg, transparent 48.8%, #a8a39a 49.4%, #a8a39a 50.6%, transparent 51.2%), linear-gradient(-60deg, transparent 48.8%, #a8a39a 49.4%, #a8a39a 50.6%, transparent 51.2%)",
          backgroundSize: "16cqw 27.7cqw",
          backgroundPosition: "center",
          maskImage: "radial-gradient(70% 55% at 50% 50%, #000 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(70% 55% at 50% 50%, #000 30%, transparent 100%)",
        }}
      />
      <Moldura verso cor={STEEL} />
      <span aria-hidden="true" className="absolute left-1/2 top-1/2 aspect-square w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full p-[1.1cqw]" style={{ background: "linear-gradient(150deg,#f6f3ec 0%,#9b958a 22%,#e9e4da 45%,#5f5a52 66%,#dcd6cb 84%,#f6f3ec 100%)", boxShadow: "0 0 8cqw rgba(0,0,0,0.9)" }}>
        <span className="grid size-full place-items-center rounded-full bg-[radial-gradient(circle_at_50%_38%,#25232b,#0e0d11_70%)] text-[#e9e4da]">
          <span className="grid w-[80%] place-items-center">{sigilo}</span>
        </span>
      </span>
      <span aria-hidden="true" className="absolute inset-x-0 bottom-[9cqw] hidden text-center font-mono text-[3cqw] uppercase tracking-[0.4em] text-[#a8a39a] @min-[140px]:block">
        Deadly · Vote
      </span>
    </div>
  );
}

export type { GlyphName };
