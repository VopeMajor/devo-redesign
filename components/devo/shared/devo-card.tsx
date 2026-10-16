import {
  Clock,
  Coins,
  Crown,
  Dices,
  DoorClosed,
  Eye,
  Flame,
  Heart,
  Hourglass,
  KeyRound,
  Scissors,
  ScrollText,
  Shield,
  Skull,
  Swords,
  VenetianMask,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { DuotoneArt, type DuotoneTone } from "@/components/devo/kit";
import { ARCHETYPE_BY_TYPE, getCard, getCardMeta, getCardRadius, RARITY_META } from "@/lib/devo/cards";
import type { CardType, GlyphName, Rarity } from "@/lib/devo/types";
import { cn } from "@/lib/utils";
import { DeadlyVoteSymbol } from "../system/symbol";

/*
 * Carta DEVO — peça de colecionador em mármore, metal e arte em gravura (duotom P&B).
 *
 * LINGUAGEM COMPARTILHADA (Cartas, Record, Trocas, Blefe, tutorial): use só estes componentes —
 *   <CardFace cardId className="w-[..]" />  frente; a largura vem do pai (tudo é medido em cqw).
 *   <CardBack className="w-[..]" />          verso oficial (mármore negro, treliça e sigilo em aço).
 *   <DevoCard cardId faceDown size />       frente/verso com giro 3D.
 *   <RarityGem rarity /> · <RarityPips rarity />  pedra e losangos da raridade (fora da carta).
 *   RARITY_SKIN[rarity]                     cores da raridade (ink = sobre papel, light = sobre negro).
 *
 * Anatomia (proporção 5:7, 100cqw × 140cqw):
 *   moldura de metal (0–1.5cqw) · bisel (1.5–2.6cqw) · corpo de mármore (2.6cqw+) · filete interno.
 *   Janela ogival com a arte (5.5→89.5cqw) · medalhão do glifo cravado no pé da janela (79cqw) ·
 *   nome (101cqw) · tipo · arquétipo (118cqw) · série · coleção · ordem no rodapé.
 *   Abaixo de 132px de largura (miniatura) a carta não tem NENHUM texto: só a arte, o medalhão e
 *   os losangos de raridade (o nome fica fora da carta, legível, na grade de quem usa).
 *
 * Raridade = MATERIAL (nunca só cor; os losangos contam 1–4):
 *   Comum    → mármore negro com veio cinza e filete de ferro
 *   Incomum  → prata polida
 *   Rara     → aço champanhe
 *   Lendária → champanhe claro, corpo em MÁRMORE BRANCO e ametista engastada (o único acento frio)
 * Rubi nunca aparece na carta (é alerta).
 */

export const GLYPHS: Record<GlyphName, LucideIcon> = {
  hourglass: Hourglass,
  skull: Skull,
  shield: Shield,
  eye: Eye,
  dice: Dices,
  key: KeyRound,
  flame: Flame,
  swords: Swords,
  mask: VenetianMask,
  heart: Heart,
  crown: Crown,
  clock: Clock,
  scroll: ScrollText,
  coins: Coins,
  door: DoorClosed,
  scissors: Scissors,
};

export const TYPE_ART: Record<CardType, string> = {
  Ataque: "/images/cards/ataque.png",
  Informação: "/images/cards/informacao.png",
  Trapaça: "/images/cards/trapaca.png",
  Defesa: "/images/cards/defesa.png",
  Tempo: "/images/cards/tempo.png",
};

/** Recorte da arte de tipo para cada carta (cartas do mesmo tipo mostram detalhes diferentes). */
const CROP: Record<string, { pos: string; zoom?: number }> = {
  fosforo: { pos: "50% 22%", zoom: 1.25 },
  laminas: { pos: "50% 52%" },
  cranio: { pos: "48% 18%", zoom: 1.5 },
  escudo: { pos: "40% 62%", zoom: 1.2 },
  coracao: { pos: "50% 12%" },
  chave: { pos: "50% 86%", zoom: 1.35 },
  porta: { pos: "50% 78%" },
  olho: { pos: "50% 30%", zoom: 1.15 },
  contrato: { pos: "50% 52%" },
  ampulheta: { pos: "30% 78%", zoom: 1.45 },
  relogio: { pos: "80% 78%", zoom: 1.5 },
  tesoura: { pos: "45% 30%", zoom: 1.2 },
  moeda: { pos: "55% 58%", zoom: 1.6 },
  dado: { pos: "40% 52%" },
  mascara: { pos: "72% 70%", zoom: 1.55 },
  coroa: { pos: "50% 10%" },
};

/* ── Mármore procedural (SVG) ──────────────────────────────────────────────────────────────
 * Neutro, como a ref de mármore: base sem azul, veios cinza difusos e UM veio fino de aço.
 * (O `dv-marble-dark` global tem veios amarelados; Cartas usa este.) */
function marbleUrl({ vein, veinA, cloud, cloudA, steelA, seed }: { vein: string; veinA: number; cloud: string; cloudA: number; steelA: number; seed: number }) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='520' height='520'><filter id='m' x='0' y='0' width='100%' height='100%' color-interpolation-filters='sRGB'><feTurbulence type='fractalNoise' baseFrequency='0.0048 0.0115' numOctaves='5' seed='${seed}' stitchTiles='stitch' result='n'/><feColorMatrix in='n' type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.5 0 0 0 -0.25' result='a'/><feComponentTransfer in='a' result='v'><feFuncA type='table' tableValues='0 0 0 0 0 0 0 0.12 0.55 1 0.55 0.12 0 0 0 0 0 0 0 0'/></feComponentTransfer><feGaussianBlur in='v' stdDeviation='1.1' result='vb'/><feColorMatrix in='vb' type='matrix' values='0 0 0 0 ${vein}  0 0 0 0 ${vein}  0 0 0 0 ${vein}  0 0 0 ${veinA} 0' result='c1'/><feColorMatrix in='n' type='matrix' values='0 0 0 0 ${cloud}  0 0 0 0 ${cloud}  0 0 0 0 ${cloud}  ${cloudA} 0 0 0 ${-cloudA * 0.45}' result='c0'/><feTurbulence type='fractalNoise' baseFrequency='0.0036 0.0085' numOctaves='4' seed='${seed + 17}' stitchTiles='stitch' result='n2'/><feColorMatrix in='n2' type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.5 0 0 0 -0.25' result='a2'/><feComponentTransfer in='a2' result='s'><feFuncA type='table' tableValues='0 0 0 0 0 0 0 0 0 0 0 0 0 0.6 1 0.6 0 0 0 0 0 0 0 0 0 0 0 0 0 0'/></feComponentTransfer><feColorMatrix in='s' type='matrix' values='0 0 0 0 0.73  0 0 0 0 0.69  0 0 0 0 0.62  0 0 0 ${steelA} 0' result='c2'/><feMerge><feMergeNode in='c0'/><feMergeNode in='c1'/><feMergeNode in='c2'/></feMerge></filter><rect width='100%' height='100%' filter='url(#m)'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const MARBLE_BLACK_IMG = marbleUrl({ vein: 0.56, veinA: 0.34, cloud: 0.62, cloudA: 0.09, steelA: 0.42, seed: 11 });
const MARBLE_WHITE_IMG = marbleUrl({ vein: 0.42, veinA: 0.42, cloud: 0.55, cloudA: 0.12, steelA: 0.5, seed: 29 });

/** Mármore negro neutro (#151517, veios #8f8e8b difusos, um veio de aço). `size` = tamanho do ladrilho. */
export function marbleBlack(size = 520): CSSProperties {
  return { backgroundColor: "#151517", backgroundImage: `radial-gradient(120% 80% at 80% 0%, rgba(238,237,235,0.045), transparent 60%), ${MARBLE_BLACK_IMG}`, backgroundSize: `auto, ${size}px ${size}px` };
}
/** Mármore branco (porcelana com veios cinza). */
export function marbleWhite(size = 520): CSSProperties {
  return { backgroundColor: "#ecebe8", backgroundImage: `radial-gradient(120% 80% at 20% 0%, rgba(255,255,255,0.7), transparent 60%), ${MARBLE_WHITE_IMG}`, backgroundSize: `auto, ${size}px ${size}px` };
}

export type RaritySkin = {
  /** Material da moldura (nome para a ficha e a aula). */
  material: string;
  /** Quantidade de losangos (a raridade nunca depende só da cor). */
  pips: number;
  /** Metal da moldura (gradiente CSS). */
  frame: string;
  /** Filete interno. */
  filet: string;
  /** Texto/losango sobre papel ou porcelana (AA). */
  ink: string;
  /** Texto/losango sobre o negro (AA). */
  light: string;
  /** Halo (hover, foco, Lendária). */
  glow: string;
  /** Duotom da arte. */
  duo: DuotoneTone;
  /** Véu de cor sobre a arte (mix-blend-color), para o metal "tingir" a gravura. */
  tint?: string;
  /** Corpo da carta. */
  body: "black" | "white";
  /** Pedra da raridade: luz, meio, sombra. */
  gem: [string, string, string];
};

/**
 * Pele de cada raridade na paleta do mármore: mármore negro → prata → aço champanhe → ametista.
 * A ametista só aparece na Lendária; rubi nunca (é alerta).
 */
export const RARITY_SKIN: Record<Rarity, RaritySkin> = {
  comum: {
    material: "Mármore negro",
    pips: 1,
    frame:
      "linear-gradient(112deg, transparent 0 34%, rgba(143,142,139,0.55) 35%, transparent 37% 100%), linear-gradient(64deg, transparent 0 58%, rgba(143,142,139,0.35) 59%, transparent 60.5% 100%), linear-gradient(150deg,#55555a 0%,#1f1f22 28%,#3d3d41 52%,#151517 76%,#45454a 100%)",
    filet: "#8f8e8b",
    ink: "#2c2c31",
    light: "#b4b3b7",
    glow: "rgba(200,198,204,0.22)",
    duo: "ink",
    body: "black",
    gem: ["#6a6a70", "#26262b", "#08080a"],
  },
  incomum: {
    material: "Prata",
    pips: 2,
    frame: "linear-gradient(150deg,#ffffff 0%,#9b9ba0 22%,#f0f0f1 46%,#5e5e63 70%,#e4e4e6 88%,#ffffff 100%)",
    filet: "#dcdcdf",
    ink: "#6a6a70",
    light: "#ececee",
    glow: "rgba(236,236,238,0.32)",
    duo: "mono",
    body: "black",
    gem: ["#ffffff", "#d4d4d8", "#7a7a80"],
  },
  rara: {
    material: "Aço champanhe",
    pips: 3,
    frame: "linear-gradient(150deg,#f4efe6 0%,#9a9184 20%,#ece5d8 40%,#5d564c 62%,#d8d0c2 82%,#f4efe6 100%)",
    filet: "#d6cdbd",
    ink: "#6b6357",
    light: "#d6cdbd",
    glow: "rgba(214,205,189,0.42)",
    duo: "mono",
    tint: "linear-gradient(180deg,#ece5d8,#8a8173)",
    body: "black",
    gem: ["#fffaf0", "#d6cdbd", "#6b6357"],
  },
  lendaria: {
    material: "Ametista",
    pips: 4,
    frame: "linear-gradient(150deg,#fffdf8 0%,#b3a998 17%,#f7f2e8 35%,#7b7264 55%,#efe8dc 74%,#c9c0b0 88%,#fffdf8 100%)",
    filet: "#c2b9ec",
    ink: "#4a4180",
    light: "#c2b9ec",
    glow: "rgba(138,124,200,0.5)",
    duo: "mono",
    body: "white",
    gem: ["#e4defb", "#8a7cc8", "#2a2350"],
  },
};

/** Moldura do verso: aço champanhe-prateado, a mesma para todas as cartas. */
const BACK_FRAME = "linear-gradient(150deg,#f6f3ec 0%,#9b958a 22%,#e9e4da 45%,#5f5a52 66%,#dcd6cb 84%,#f6f3ec 100%)";

/** Arco ogival (polígono em %): laterais retas e dois arcos que se encontram numa ponta. */
const ARCH = (() => {
  const rise = 17; // % da altura ocupada pelo arco
  const c = 74; // raio do arco (em % da largura): define o quão pontudo fica
  const end = Math.acos(1 - 50 / c);
  const pts: [number, number][] = [
    [0, 100],
    [0, rise],
  ];
  const n = 14;
  const at = (i: number) => {
    const a = (end * i) / n;
    return [c - c * Math.cos(a), rise * (1 - Math.sin(a) / Math.sin(end))] as const;
  };
  for (let i = 1; i <= n; i++) {
    const [x, y] = at(i);
    pts.push([x, y]);
  }
  for (let i = n - 1; i >= 1; i--) {
    const [x, y] = at(i);
    pts.push([100 - x, y]);
  }
  pts.push([100, rise], [100, 100]);
  return pts.map(([x, y]) => [Number(x.toFixed(2)), Number(y.toFixed(2))] as const);
})();
const ARCH_CLIP = `polygon(${ARCH.map(([x, y]) => `${x}% ${y}%`).join(",")})`;
const ARCH_PATH = `M${ARCH.map(([x, y]) => `${x} ${y}`).join(" L")} Z`;

const STAR4 = "M12 0.5 C12.6 8.6 15.4 11.4 23.5 12 C15.4 12.6 12.6 15.4 12 23.5 C11.4 15.4 8.6 12.6 0.5 12 C8.6 11.4 11.4 8.6 12 0.5 Z";

/** Animações da carta (escopo pelo prefixo dvcard-). */
export const CARD_CSS = `
@keyframes dvcard-sheen { 0% { background-position: 120% 0 } 55%,100% { background-position: -40% 0 } }
@keyframes dvcard-holo { 0% { background-position: 0% 30%, 0 0 } 50% { background-position: 100% 70%, 0 0 } 100% { background-position: 0% 30%, 0 0 } }
@keyframes dvcard-gem { 0%,100% { opacity: .55 } 50% { opacity: 1 } }
.dvcard-holo { animation: dvcard-holo 9s ease-in-out infinite; }
.dvcard-holo[data-follow] { animation: none; }
.dvcard-sheen { animation: dvcard-sheen 7s ease-in-out infinite; }
.dvcard-gem { animation: dvcard-gem 3.2s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .dvcard-holo, .dvcard-sheen, .dvcard-gem { animation: none !important } }
`;

/** Losangos de raridade (1–4 cheios). Herdam a cor do texto. */
export function RarityPips({ rarity, className, style }: { rarity: Rarity; className?: string; style?: CSSProperties }) {
  const n = RARITY_SKIN[rarity].pips;
  return (
    <span aria-hidden="true" className={cn("inline-flex items-center gap-[0.28em]", className)} style={style}>
      {Array.from({ length: 4 }, (_, i) => (
        <svg key={i} viewBox="0 0 10 14" className="h-[1em] w-[0.72em] shrink-0">
          <path d="M5 0.8 L9.2 7 L5 13.2 L0.8 7 Z" fill={i < n ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1" opacity={i < n ? 1 : 0.4} />
        </svg>
      ))}
    </span>
  );
}

/** Pedra facetada da raridade (losango com engaste de metal: prata, ou champanhe na Rara/Lendária). */
export function RarityGem({ rarity, className, title }: { rarity: Rarity; className?: string; title?: string }) {
  const [hi, mid, lo] = RARITY_SKIN[rarity].gem;
  const metal = rarity === "lendaria" || rarity === "rara" ? ["#f4efe6", "#8a8173", "#ece5d8"] : ["#ffffff", "#7a7a80", "#e6e6e8"];
  const id = `dvgem-${rarity}`;
  return (
    <svg viewBox="0 0 32 48" className={cn("drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)]", className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={metal[0]} />
          <stop offset=".5" stopColor={metal[1]} />
          <stop offset="1" stopColor={metal[2]} />
        </linearGradient>
      </defs>
      <path d="M16 0.8 L31.2 24 L16 47.2 L0.8 24 Z" fill={`url(#${id})`} />
      <path d="M16 3.8 L28.4 24 L16 44.2 L3.6 24 Z" fill="#0a090e" />
      <path d="M16 5 L27.2 24 L16 24 Z" fill={mid} />
      <path d="M16 5 L4.8 24 L16 24 Z" fill={hi} />
      <path d="M4.8 24 L16 43 L16 24 Z" fill={mid} />
      <path d="M27.2 24 L16 43 L16 24 Z" fill={lo} />
      <path d="M16 15 L21.5 24 L16 33 L10.5 24 Z" fill={mid} />
      <path d="M16 15 L21.5 24 L16 24 Z" fill={hi} opacity="0.4" />
      <path d="M16 24 L10.5 24 L16 33 Z" fill={lo} opacity="0.45" />
      <path d="M16 5 L16 15 M4.8 24 L10.5 24 M27.2 24 L21.5 24 M16 43 L16 33" stroke="#fff" strokeWidth="0.35" opacity="0.5" />
      <path d="M10 15 L12 13 L13 17 Z" fill="#fff" opacity="0.85" />
    </svg>
  );
}

/** Ametista engastada (só na Lendária): losango facetado pequeno, sem filtro (barato na grade). */
function SetAmethyst({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 28" aria-hidden="true" className={className}>
      <path d="M10 0.5 L19.5 14 L10 27.5 L0.5 14 Z" fill="#f4efe6" />
      <path d="M10 2.6 L17.4 14 L10 25.4 L2.6 14 Z" fill="#2a2350" />
      <path d="M10 3.4 L16.6 14 L10 14 Z" fill="#8a7cc8" />
      <path d="M10 3.4 L3.4 14 L10 14 Z" fill="#e4defb" />
      <path d="M3.4 14 L10 24.6 L10 14 Z" fill="#8a7cc8" />
      <path d="M10 9 L13 14 L10 19 L7 14 Z" fill="#c2b9ec" />
      <path d="M6.4 9 L7.6 7.8 L8.2 10.2 Z" fill="#fff" className="dvcard-gem" />
    </svg>
  );
}

type DevoCardProps = {
  cardId?: string | null;
  faceDown?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZES = {
  sm: "w-24",
  md: "w-36",
  lg: "w-48",
};

const CARD_SHELL = "relative aspect-[5/7] [container-type:inline-size]";

/** Moldura metálica + bisel + corpo de mármore (comum à frente e ao verso). */
function Shell({ frame, filet, glow, body, children }: { frame: string; filet: string; glow?: string; body: "black" | "white"; children: ReactNode }) {
  return (
    <>
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-[5cqw]"
        style={{ background: frame, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 0 10px 26px -14px rgba(0,0,0,0.9)${glow ? `, 0 0 14px -4px ${glow}` : ""}` }}
      />
      <span aria-hidden="true" className="absolute inset-[1.5cqw] rounded-[3.9cqw] shadow-[0_0_0_0.5px_rgba(0,0,0,0.55),inset_0_0_0_0.5px_rgba(255,255,255,0.18)]" />
      <span
        className={cn("absolute inset-[2.6cqw] overflow-hidden rounded-[3.2cqw]", body === "white" ? "shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.4)]" : "shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.9)]")}
        style={body === "white" ? marbleWhite(260) : marbleBlack(260)}
      >
        {children}
        <span aria-hidden="true" className="pointer-events-none absolute inset-[1.8cqw] rounded-[2cqw] border-solid opacity-50" style={{ borderColor: filet, borderWidth: "max(0.5px, 0.3cqw)" }} />
      </span>
    </>
  );
}

/** Verso oficial: mármore negro, treliça de losangos em aço e o sigilo num medalhão. */
export function CardBack({ className }: { className?: string }) {
  return (
    <div className={cn(CARD_SHELL, "select-none", className)} role="img" aria-label="Verso de uma Carta DEVO">
      <Shell frame={BACK_FRAME} filet="#d6cdbd" body="black">
        <span
          aria-hidden="true"
          className="absolute inset-[5cqw] opacity-55"
          style={{
            backgroundImage:
              "linear-gradient(60deg, transparent 48.8%, #a8a39a 49.4%, #a8a39a 50.6%, transparent 51.2%), linear-gradient(-60deg, transparent 48.8%, #a8a39a 49.4%, #a8a39a 50.6%, transparent 51.2%)",
            backgroundSize: "16cqw 27.7cqw",
            backgroundPosition: "center",
            maskImage: "radial-gradient(70% 58% at 50% 50%, #000 35%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(70% 58% at 50% 50%, #000 35%, transparent 100%)",
          }}
        />
        <span aria-hidden="true" className="absolute left-1/2 top-1/2 aspect-square w-[54%] -translate-x-1/2 -translate-y-1/2 rounded-full p-[1.1cqw]" style={{ background: BACK_FRAME, boxShadow: "0 0 6cqw rgba(0,0,0,0.9)" }}>
          <span className="grid size-full place-items-center rounded-full bg-[radial-gradient(circle_at_50%_38%,#2c2c31,#0c0c0e_70%)] text-[#e9e4da] shadow-[inset_0_0_0_0.6cqw_rgba(0,0,0,0.8)]">
            <DeadlyVoteSymbol variant="full" className="size-[80%]" />
          </span>
        </span>
        {["top-[6.5cqw]", "bottom-[6.5cqw]"].map((p) => (
          <svg key={p} aria-hidden="true" viewBox="0 0 24 24" className={cn("absolute left-1/2 size-[8cqw] -translate-x-1/2 text-[#dcd6cb]", p)}>
            <path d={STAR4} fill="currentColor" />
          </svg>
        ))}
        <span aria-hidden="true" className="absolute inset-x-0 bottom-[17cqw] hidden text-center font-mono text-[3.4cqw] uppercase tracking-[0.4em] text-[#a8a39a] @min-[140px]:block">
          Deadly · Vote
        </span>
      </Shell>
    </div>
  );
}

export function CardFace({
  cardId,
  className,
  holo,
}: {
  cardId: string;
  size?: DevoCardProps["size"];
  className?: string;
  /** `true` liga o brilho holográfico (segue --hx/--hy do ancestral); padrão: só nas Lendárias. */
  holo?: boolean;
}) {
  const card = getCard(cardId);
  const meta = getCardMeta(cardId);
  const rarity = RARITY_META[card.rarity];
  const skin = RARITY_SKIN[card.rarity];
  const radius = getCardRadius(cardId);
  const archetype = ARCHETYPE_BY_TYPE[card.type];
  const Glyph = GLYPHS[card.glyph];
  const crop = CROP[cardId] ?? { pos: "50% 30%" };
  const legendary = card.rarity === "lendaria";
  const white = skin.body === "white";
  const shine = holo ?? legendary;
  // Texto sobre o corpo (negro ou mármore branco).
  const onBody = white ? "#151517" : "#eeedeb";
  const onBodySoft = white ? skin.ink : skin.light;

  return (
    <article
      className={cn(CARD_SHELL, "select-none", className)}
      aria-label={`${card.name}. Arquétipo ${archetype}. Coleção ${meta.collection}, ordem ${meta.orderLabel}, série ${meta.serial}. Raridade ${rarity.label} (${skin.material}). Função: ${card.effect} Raio: ${radius}.`}
    >
      <style>{CARD_CSS}</style>
      <Shell frame={skin.frame} filet={skin.filet} glow={legendary ? skin.glow : undefined} body={skin.body}>
        {/* janela ogival com a arte em duotom */}
        <span aria-hidden="true" className="absolute inset-x-[5.5cqw] top-[5.5cqw] h-[84cqw]">
          <span className="absolute inset-0 overflow-hidden bg-[#0c0c0e]" style={{ clipPath: ARCH_CLIP }}>
            <span className="absolute inset-0" style={{ transform: `scale(${crop.zoom ?? 1})`, transformOrigin: crop.pos }}>
              <DuotoneArt src={TYPE_ART[card.type]} alt="" tone={skin.duo} position={crop.pos} contrast={1.3} className="size-full" />
            </span>
            {skin.tint && <span className="absolute inset-0 mix-blend-color" style={{ background: skin.tint, opacity: 0.32 }} />}
            <span className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_30%,transparent_45%,rgba(12,12,14,0.75)_100%)]" />
            <span className="absolute inset-x-0 bottom-0 h-[40%] bg-[linear-gradient(to_top,rgba(12,12,14,0.95),transparent)]" />
          </span>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
            <path d={ARCH_PATH} fill="none" stroke={white ? "#b3a998" : skin.filet} strokeWidth="1.1" vectorEffect="non-scaling-stroke" opacity="0.9" />
          </svg>
          {/* numeral e losangos: só quando a carta tem largura para eles */}
          <span className="absolute left-[3.4cqw] top-[20cqw] hidden font-display text-[6.2cqw] font-semibold leading-none [text-shadow:0_1px_2px_#000] @min-[132px]:block" style={{ color: skin.light }}>
            {card.numeral}
          </span>
          <span className="absolute right-[3cqw] top-[20cqw] hidden [filter:drop-shadow(0_1px_1px_#000)] @min-[132px]:block" style={{ color: skin.light }}>
            <RarityPips rarity={card.rarity} className="flex-col text-[4.4cqw]" />
          </span>
        </span>

        {/* ametista engastada na ponta do arco (só Lendária) */}
        {legendary && <SetAmethyst className="absolute left-1/2 top-[0.4cqw] h-[11cqw] w-[8cqw] -translate-x-1/2 drop-shadow-[0_0.6cqw_0.8cqw_rgba(0,0,0,0.6)]" />}

        {/* medalhão do glifo, cravado no pé da janela */}
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-[79cqw] aspect-square w-[19cqw] -translate-x-1/2 rounded-full p-[1cqw]"
          style={{ background: skin.frame, boxShadow: `0 0 5cqw ${skin.glow}, 0 1cqw 2cqw rgba(0,0,0,${white ? 0.45 : 0.8})` }}
        >
          <span className="grid size-full place-items-center rounded-full bg-[radial-gradient(circle_at_50%_35%,#2c2c31,#0c0c0e_72%)]" style={{ color: skin.light }}>
            <Glyph className="size-[56%]" strokeWidth={1.4} />
          </span>
        </span>

        {/* miniatura (< 132px): sem texto — losangos e uma estrela de aço */}
        <span aria-hidden="true" className="absolute inset-x-0 top-[104cqw] flex justify-center @min-[132px]:hidden" style={{ color: white ? skin.ink : skin.light }}>
          <RarityPips rarity={card.rarity} className="text-[9cqw]" />
        </span>
        <span aria-hidden="true" className="absolute inset-x-[16cqw] top-[121cqw] flex items-center gap-[2cqw] @min-[132px]:hidden" style={{ color: white ? "#8a8173" : skin.filet }}>
          <span className="h-px flex-1 bg-current opacity-50" />
          <svg viewBox="0 0 24 24" className="size-[6cqw] opacity-80">
            <path d={STAR4} fill="currentColor" />
          </svg>
          <span className="h-px flex-1 bg-current opacity-50" />
        </span>

        {/* carta grande: nome, tipo e rodapé de série */}
        <span aria-hidden="true" className="absolute inset-x-[7cqw] top-[101cqw] hidden h-[16cqw] items-start justify-center text-center @min-[132px]:flex">
          <span className="line-clamp-2 py-[0.6cqw] font-display text-[7cqw] font-semibold uppercase leading-[1.16] tracking-[0.04em]" style={{ color: onBody }}>
            {card.name}
          </span>
        </span>
        <span aria-hidden="true" className="absolute inset-x-[7cqw] top-[118cqw] hidden items-center justify-center gap-[2cqw] whitespace-nowrap font-sans text-[3.6cqw] font-medium uppercase tracking-[0.18em] @min-[132px]:flex" style={{ color: onBodySoft }}>
          <span className="h-px flex-1 bg-current opacity-40" />
          {card.type} · {archetype}
          <span className="h-px flex-1 bg-current opacity-40" />
        </span>
        <span aria-hidden="true" className="absolute inset-x-[7cqw] bottom-[4.4cqw] hidden items-baseline justify-between font-mono text-[3.2cqw] uppercase tracking-[0.1em] @min-[150px]:flex" style={{ color: white ? "rgba(21,21,23,0.62)" : "rgba(238,237,235,0.6)" }}>
          <span>{meta.serial}</span>
          <span className="truncate px-[1.5cqw]">{meta.collection}</span>
          <span>{meta.orderLabel}</span>
        </span>

        {/* reflexo do esmalte (todas) e holografia contida (Lendárias ou inspeção) */}
        <span
          aria-hidden="true"
          className="dvcard-sheen pointer-events-none absolute inset-0 mix-blend-screen"
          style={{ backgroundImage: "linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.10) 46%, rgba(255,255,255,0.02) 52%, transparent 60%)", backgroundSize: "250% 100%", backgroundPosition: "120% 0" }}
        />
        {shine && (
          <span
            aria-hidden="true"
            data-follow={holo ? "" : undefined}
            className={cn("dvcard-holo pointer-events-none absolute inset-0", white ? "opacity-[0.5] mix-blend-multiply" : "opacity-[0.42] mix-blend-color-dodge")}
            style={{
              backgroundImage: white
                ? "linear-gradient(115deg, transparent 22%, rgba(194,185,236,0.45) 38%, rgba(236,229,216,0.5) 48%, rgba(194,185,236,0.35) 58%, transparent 74%), repeating-linear-gradient(135deg, rgba(0,0,0,0.035) 0 1px, transparent 1px 4px)"
                : "linear-gradient(115deg, transparent 18%, rgba(203,197,232,0.32) 34%, rgba(236,229,216,0.45) 46%, rgba(203,197,232,0.26) 58%, transparent 76%), repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 4px)",
              backgroundSize: "260% 260%, auto",
              backgroundPosition: "var(--hx, 30%) var(--hy, 30%), 0 0",
            }}
          />
        )}
      </Shell>
    </article>
  );
}

export function DevoCard({ cardId, faceDown = false, size = "md", className }: DevoCardProps) {
  const showFace = !faceDown && cardId;
  return (
    <div className={cn("[perspective:900px]", SIZES[size], className)}>
      <div className={cn("relative transition-transform duration-700 [transform-style:preserve-3d]", showFace ? "[transform:rotateY(0deg)]" : "[transform:rotateY(180deg)]")}>
        <div className="[backface-visibility:hidden]">{cardId ? <CardFace cardId={cardId} /> : <CardBack />}</div>
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <CardBack className="h-full" />
        </div>
      </div>
    </div>
  );
}
