import {
  ChessBishop,
  ChessKing,
  ChessKnight,
  ChessPawn,
  ChessQueen,
  ChessRook,
  Clock,
  Coins,
  Grid3x3,
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
import type { CSSProperties } from "react";
import type { DuotoneTone } from "@/components/devo/kit";
import { getCard } from "@/lib/devo/cards";
import type { CardType, GlyphName, Rarity } from "@/lib/devo/types";
import { cn } from "@/lib/utils";
import { DeadlyVoteSymbol } from "../system/symbol";
import { CartaFrente, CartaVerso } from "./carta-tarot";

/*
 * Carta DEVO — peça de colecionador em mármore, metal e arte em gravura (duotom P&B).
 *
 * LINGUAGEM COMPARTILHADA (Cartas, Record, Trocas, Blefe, tutorial): use só estes componentes —
 *   <CardFace cardId className="w-[..]" />  frente; a largura vem do pai (tudo é medido em cqw).
 *   <CardBack className="w-[..]" />          verso oficial (corpo escuro, treliça e sigilo em aço).
 *   <DevoCard cardId faceDown size />       frente/verso com giro 3D.
 *   <RarityGem rarity /> · <RarityPips rarity />  pedra e losangos da raridade (fora da carta).
 *   RARITY_SKIN[rarity]                     cores da raridade (ink = sobre papel, light = sobre negro).
 *
 * Anatomia: ver carta-tarot.tsx (design do dono de 22/10, proporção 9:20). Abaixo, só utilidades comuns.
 *   moldura de metal (0–1.5cqw) · bisel (1.5–2.6cqw) · corpo de mármore (2.6cqw+) · filete interno.
 *   Janela ogival com a arte (5.5→89.5cqw) · medalhão do glifo cravado no pé da janela (79cqw) ·
 *   nome (101cqw) · tipo · arquétipo (118cqw) · série · coleção · ordem no rodapé.
 *   Abaixo de 132px de largura (miniatura) a carta não tem NENHUM texto: só a arte, o medalhão e
 *   os losangos de raridade (o nome fica fora da carta, legível, na grade de quem usa).
 *
 * Raridade = MATERIAL (nunca só cor; os losangos contam 1–5):
 *   Comum      → ferro fosco, sem brilho
 *   Incomum    → prata polida
 *   Rara       → aço champanhe
 *   Ultra Rara → aço ametista: faixas de champanhe e ametista na moldura, um reflexo lento que corre só
 *                pela borda e halo lilás discreto (corpo ainda negro: fica abaixo da Lendária)
 *   Lendária   → champanhe claro, corpo em MÁRMORE BRANCO e ametista engastada
 * Secretas (pedido do dono 17/10; nenhuma carta do Compêndio as tem ainda — vitrine via `rarity`):
 *   Única       → granada: moldura em vermelho profundo, filete e halo de granada, pedra engastada
 *   Promocional → holográfica: moldura iridescente que desliza devagar + folha holográfica no corpo
 *                 (segue o ponteiro na inspeção); com movimento reduzido fica um gradiente parado.
 * O vermelho da Única é granada (vinho), nunca o rubi de alerta.
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
  pawn: ChessPawn,
  bishop: ChessBishop,
  knight: ChessKnight,
  rook: ChessRook,
  queen: ChessQueen,
  king: ChessKing,
  board: Grid3x3,
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

/* ── Mármore ───────────────────────────────────────────────────────────────────────────────
 * Mesmo material do shell (Sistema r3): imagens raster neutras em public/images/os/marmore-*.webp
 * (geradas por scripts/dev/gen-marmore.py). Pedra sem azul, veios cinza. `size` = ladrilho em px. */
export function marbleBlack(size = 560): CSSProperties {
  return {
    backgroundColor: "var(--dv-ink-2)",
    backgroundImage: "radial-gradient(120% 80% at 80% 0%, rgb(var(--dv-text-rgb) / 0.045), transparent 60%), url(/images/os/marmore-negro.webp)",
    backgroundSize: `auto, ${size}px ${size}px`,
  };
}
/** Mármore branco (porcelana com veios cinza). */
export function marbleWhite(size = 560): CSSProperties {
  return {
    backgroundColor: "#ecebe8",
    backgroundImage: "radial-gradient(120% 80% at 20% 0%, rgba(255,255,255,0.55), transparent 60%), url(/images/os/marmore-branco.webp)",
    backgroundSize: `auto, ${size}px ${size}px`,
  };
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
 * Pele de cada raridade na paleta do mármore: mármore negro → prata → aço champanhe → aço ametista → ametista,
 * mais as secretas (granada e holográfica). Rubi de alerta nunca.
 */
export const RARITY_SKIN: Record<Rarity, RaritySkin> = {
  comum: {
    material: "Ferro fosco",
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
  ultra_rara: {
    material: "Aço ametista",
    pips: 4,
    frame: "linear-gradient(150deg,#f3eee6 0%,#9c90c4 15%,#e9e2d6 31%,#4a4170 50%,#d9d0ee 67%,#8a8173 83%,#f3eee6 100%)",
    filet: "#bcb0e2",
    ink: "#574c8c",
    light: "#d9c9e3",
    glow: "rgba(160,142,220,0.4)",
    duo: "mono",
    tint: "linear-gradient(180deg,#e6dcef,#5b5088)",
    body: "black",
    gem: ["#f7eef5", "#c4abd2", "#57446c"],
  },
  lendaria: {
    material: "Ametista",
    pips: 5,
    frame: "linear-gradient(150deg,#fffdf8 0%,#b3a998 17%,#f7f2e8 35%,#7b7264 55%,#efe8dc 74%,#c9c0b0 88%,#fffdf8 100%)",
    filet: "#c2b9ec",
    ink: "#4a4180",
    light: "#c2b9ec",
    glow: "rgba(138,124,200,0.5)",
    duo: "mono",
    body: "white",
    gem: ["#e4defb", "#8a7cc8", "#2a2350"],
  },
  unica: {
    material: "Granada",
    pips: 5,
    frame: "linear-gradient(150deg,#f3cfd2 0%,#7a1426 17%,#d98a95 34%,#3a0810 54%,#b03d4e 72%,#5c0f1c 87%,#f3cfd2 100%)",
    filet: "#c9566a",
    ink: "#8a1a2d",
    light: "#e3909a",
    glow: "rgba(168,28,52,0.55)",
    duo: "mono",
    tint: "linear-gradient(180deg,#e3a0a8,#5c0f1c)",
    body: "black",
    gem: ["#f8ccd2", "#a3243a", "#3a0810"],
  },
  promocional: {
    material: "Holográfica",
    pips: 5,
    frame: "linear-gradient(125deg,#f7d3e6 0%,#c7b6f3 16%,#a6dfee 32%,#e7f4c4 48%,#f6caa6 64%,#cdb9f2 80%,#a9e2ec 92%,#f7d3e6 100%)",
    filet: "#cfc4f2",
    ink: "#4f4a8c",
    light: "#b4dfe8",
    glow: "rgba(170,205,245,0.45)",
    duo: "mono",
    body: "black",
    gem: ["#f9d6ea", "#9fdcea", "#8a6fd2"],
  },
};

/** Animações da carta (escopo pelo prefixo dvcard-). */
export const CARD_CSS = `
@keyframes dvcard-sheen { 0% { background-position: 120% 0 } 55%,100% { background-position: -40% 0 } }
@keyframes dvcard-holo { 0% { background-position: 0% 30%, 0 0 } 50% { background-position: 100% 70%, 0 0 } 100% { background-position: 0% 30%, 0 0 } }
@keyframes dvcard-gem { 0%,100% { opacity: .55 } 50% { opacity: 1 } }
@keyframes dvcard-iris { 0% { background-position: 0% 50% } 50% { background-position: 100% 50% } 100% { background-position: 0% 50% } }
@keyframes dvcard-edge { 0% { background-position: 160% 0 } 60%,100% { background-position: -60% 0 } }
.dvcard-holo { animation: dvcard-holo 9s ease-in-out infinite; }
.dvcard-holo[data-follow] { animation: none; }
.dvcard-sheen { animation: dvcard-sheen 7s ease-in-out infinite; }
.dvcard-gem { animation: dvcard-gem 3.2s ease-in-out infinite; }
.dvcard-iris { animation: dvcard-iris 12s ease-in-out infinite; }
.dvcard-edge { animation: dvcard-edge 5.5s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .dvcard-holo, .dvcard-sheen, .dvcard-gem, .dvcard-iris, .dvcard-edge { animation: none !important } }
`;

/** Losangos de raridade (1–5 cheios). Herdam a cor do texto. */
export function RarityPips({ rarity, className, style }: { rarity: Rarity; className?: string; style?: CSSProperties }) {
  const n = RARITY_SKIN[rarity].pips;
  return (
    <span aria-hidden="true" className={cn("inline-flex items-center gap-[0.28em]", className)} style={style}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 10 14" className="h-[1em] w-[0.72em] shrink-0">
          <path d="M5 0.8 L9.2 7 L5 13.2 L0.8 7 Z" fill={i < n ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1" opacity={i < n ? 1 : 0.4} />
        </svg>
      ))}
    </span>
  );
}

/** Pedra facetada da raridade (losango com engaste de metal: prata, ou champanhe da Rara para cima). */
export function RarityGem({ rarity, className, title }: { rarity: Rarity; className?: string; title?: string }) {
  const [hi, mid, lo] = RARITY_SKIN[rarity].gem;
  const metal = rarity === "comum" || rarity === "incomum" || rarity === "promocional" ? ["#ffffff", "#7a7a80", "#e6e6e8"] : ["#f4efe6", "#8a8173", "#ece5d8"];
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



/** Verso oficial (design do dono, 22/10): pergaminho com o sol-bússola, céu estrelado e o sigilo do Deadly Vote. */
export function CardBack({ className }: { className?: string }) {
  return <CartaVerso className={className} sigilo={<DeadlyVoteSymbol variant="full" className="size-full" />} />;
}

/** Frente (design do dono, 22/10): ver components/devo/shared/carta-tarot.tsx. */
export function CardFace({
  cardId,
  className,
  rarity: rarityOverride,
}: {
  cardId: string;
  size?: DevoCardProps["size"];
  className?: string;
  /** Mantido por compatibilidade (o brilho das Lendárias e Promocionais é automático). */
  holo?: boolean;
  /** Vitrine: mostra a carta com a borda de outra raridade (aula, guia de estilo). O jogo nunca usa. */
  rarity?: Rarity;
}) {
  const card = getCard(cardId);
  const crop = CROP[cardId] ?? { pos: "50% 30%" };
  return <CartaFrente cardId={cardId} rarity={rarityOverride} glyph={GLYPHS[card.glyph]} fallbackArt={TYPE_ART[card.type]} fallbackPos={crop.pos} className={className} />;
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
