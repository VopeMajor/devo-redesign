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
 * Carta DEVO — peça de colecionador em mármore negro, aço e arte em duotom.
 * Proporção 5:7. Tudo é medido em `cqw` (largura da própria carta): a mesma carta serve de
 * miniatura na grade do Record (~70px) e de peça de inspeção no detalhe (~260px). Textos pequenos
 * só aparecem quando a carta tem largura para eles (container queries).
 * Nomes e ordem das raridades vêm de lib/devo/cards.ts; aqui fica só a "pele" visual de cada uma.
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

export type RaritySkin = {
  /** Quantidade de losangos (a raridade nunca depende só da cor). */
  pips: number;
  /** Metal da moldura (gradiente CSS). */
  frame: string;
  /** Filete interno. */
  filet: string;
  /** Texto sobre papel (AA). */
  ink: string;
  /** Texto sobre o veludo (AA). */
  light: string;
  glow: string;
  duo: DuotoneTone;
  /** Pedra da raridade: luz, meio, sombra. */
  gem: [string, string, string];
};

/**
 * Pele de cada raridade na paleta do mármore: ferro → prata → ametista → champanhe.
 * Ouro/champanhe só na Lendária; rubi nunca (é alerta).
 */
export const RARITY_SKIN: Record<Rarity, RaritySkin> = {
  comum: {
    pips: 1,
    frame: "linear-gradient(150deg,#77767b 0%,#2c2c31 32%,#8f8e8b 52%,#1f1f22 74%,#5d5c61 100%)",
    filet: "#8f8e8b",
    ink: "#45454b",
    light: "#c4c3c7",
    glow: "rgba(200,198,204,0.25)",
    duo: "ink",
    gem: ["#6a6a70", "#26262b", "#08080a"],
  },
  incomum: {
    pips: 2,
    frame: "linear-gradient(150deg,#ffffff 0%,#9a97a3 24%,#ecebef 48%,#5b5863 72%,#f3f1f6 100%)",
    filet: "#dcdae2",
    ink: "#3f3e46",
    light: "#eceaf0",
    glow: "rgba(236,234,240,0.35)",
    duo: "mono",
    gem: ["#ffffff", "#d9d7de", "#76737f"],
  },
  rara: {
    pips: 3,
    frame: "linear-gradient(150deg,#f3f1f6 0%,#8e8b98 22%,#d8d3ee 44%,#4e4580 64%,#c2b9ec 84%,#f3f1f6 100%)",
    filet: "#a99de0",
    ink: "#4a4180",
    light: "#cbc5e8",
    glow: "rgba(138,124,200,0.55)",
    duo: "violet",
    gem: ["#e4defb", "#8a7cc8", "#2a2350"],
  },
  lendaria: {
    pips: 4,
    frame: "linear-gradient(150deg,#f4efe6 0%,#9a9184 20%,#ece5d8 40%,#5d564c 62%,#d8d0c2 82%,#f4efe6 100%)",
    filet: "#d6cdbd",
    ink: "#5f584d",
    light: "#ece5d8",
    glow: "rgba(236,229,216,0.55)",
    duo: "mono",
    gem: ["#fffaf0", "#d6cdbd", "#6b6357"],
  },
};

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
.dvcard-holo { animation: dvcard-holo 9s ease-in-out infinite; }
.dvcard-holo[data-follow] { animation: none; }
.dvcard-sheen { animation: dvcard-sheen 7s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .dvcard-holo, .dvcard-sheen { animation: none !important } }
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

/** Pedra facetada da raridade (losango com engaste de aço; champanhe só na Lendária). */
export function RarityGem({ rarity, className, title }: { rarity: Rarity; className?: string; title?: string }) {
  const [hi, mid, lo] = RARITY_SKIN[rarity].gem;
  const metal = rarity === "lendaria" ? ["#f4efe6", "#8a8173", "#ece5d8"] : ["#ffffff", "#77747f", "#e6e4ea"];
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

const CARD_SHELL = "relative aspect-[5/7] [container-type:inline-size]";

/** Moldura metálica + bisel + veludo interno (comum à frente e ao verso). */
function Shell({ frame, filet, glow, children }: { frame: string; filet: string; glow?: string; children: ReactNode }) {
  return (
    <>
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-[5cqw]"
        style={{ background: frame, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 0 10px 26px -14px rgba(0,0,0,0.9)${glow ? `, 0 0 14px -4px ${glow}` : ""}` }}
      />
      <span aria-hidden="true" className="absolute inset-[1.5cqw] rounded-[3.9cqw] shadow-[0_0_0_0.5px_rgba(0,0,0,0.55),inset_0_0_0_0.5px_rgba(255,255,255,0.18)]" />
      <span className="absolute inset-[2.6cqw] overflow-hidden rounded-[3.2cqw] bg-[#0c0c0e] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.9)]">
        {children}
        <span aria-hidden="true" className="pointer-events-none absolute inset-[1.8cqw] rounded-[2cqw] border-solid opacity-40" style={{ borderColor: filet, borderWidth: "max(0.5px, 0.3cqw)" }} />
      </span>
    </>
  );
}

/** Verso oficial: mármore negro, treliça de losangos em aço champanhe e o sigilo num medalhão. */
export function CardBack({ className }: { className?: string }) {
  return (
    <div className={cn(CARD_SHELL, "select-none", className)} role="img" aria-label="Verso de uma Carta DEVO">
      <Shell frame={RARITY_SKIN.lendaria.frame} filet="#d6cdbd">
        <span aria-hidden="true" className="dv-marble-dark absolute inset-0" />
        <span
          aria-hidden="true"
          className="absolute inset-[5cqw] opacity-55"
          style={{
            backgroundImage:
              "linear-gradient(60deg, transparent 48.8%, #a59d90 49.4%, #a59d90 50.6%, transparent 51.2%), linear-gradient(-60deg, transparent 48.8%, #a59d90 49.4%, #a59d90 50.6%, transparent 51.2%)",
            backgroundSize: "16cqw 27.7cqw",
            backgroundPosition: "center",
            maskImage: "radial-gradient(70% 58% at 50% 50%, #000 35%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(70% 58% at 50% 50%, #000 35%, transparent 100%)",
          }}
        />
        <span aria-hidden="true" className="absolute left-1/2 top-1/2 aspect-square w-[54%] -translate-x-1/2 -translate-y-1/2 rounded-full p-[1.1cqw]" style={{ background: RARITY_SKIN.lendaria.frame, boxShadow: "0 0 6cqw rgba(0,0,0,0.9)" }}>
          <span className="grid size-full place-items-center rounded-full bg-[radial-gradient(circle_at_50%_38%,#2c2c31,#0c0c0e_70%)] text-[#ece5d8] shadow-[inset_0_0_0_0.6cqw_rgba(0,0,0,0.8)]">
            <DeadlyVoteSymbol variant="full" className="size-[80%]" />
          </span>
        </span>
        {["top-[6.5cqw]", "bottom-[6.5cqw]"].map((p) => (
          <svg key={p} aria-hidden="true" viewBox="0 0 24 24" className={cn("absolute left-1/2 size-[8cqw] -translate-x-1/2 text-[#d6cdbd]", p)}>
            <path d={STAR4} fill="currentColor" />
          </svg>
        ))}
        <span aria-hidden="true" className="absolute inset-x-0 bottom-[17cqw] hidden text-center font-mono text-[3.4cqw] uppercase tracking-[0.4em] text-[#a59d90] @min-[140px]:block">
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
  const shine = holo ?? legendary;

  return (
    <article
      className={cn(CARD_SHELL, "select-none", className)}
      aria-label={`${card.name}. Arquétipo ${archetype}. Coleção ${meta.collection}, ordem ${meta.orderLabel}, série ${meta.serial}. Raridade ${rarity.label}. Função: ${card.effect} Raio: ${radius}.`}
    >
      <style>{CARD_CSS}</style>
      <Shell frame={skin.frame} filet={skin.filet} glow={legendary ? skin.glow : undefined}>
        <span aria-hidden="true" className="dv-marble-dark absolute inset-0 opacity-90" />

        {/* janela ogival com a arte em duotom */}
        <span aria-hidden="true" className="absolute inset-x-[5.5cqw] top-[5.5cqw] h-[84cqw]">
          <span className="absolute inset-0 overflow-hidden" style={{ clipPath: ARCH_CLIP }}>
            <span className="absolute inset-0" style={{ transform: `scale(${crop.zoom ?? 1})`, transformOrigin: crop.pos }}>
              <DuotoneArt src={TYPE_ART[card.type]} alt="" tone={skin.duo} position={crop.pos} contrast={1.3} className="size-full" />
            </span>
            {legendary && <span className="absolute inset-0 mix-blend-color" style={{ background: "linear-gradient(180deg,#ece5d8,#8a8173)", opacity: 0.4 }} />}
            <span className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_30%,transparent_45%,rgba(12,12,14,0.75)_100%)]" />
            <span className="absolute inset-x-0 bottom-0 h-[40%] bg-[linear-gradient(to_top,rgba(12,12,14,0.95),transparent)]" />
          </span>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
            <path d={ARCH_PATH} fill="none" stroke={skin.filet} strokeWidth="1.1" vectorEffect="non-scaling-stroke" opacity="0.85" />
          </svg>
          <span className="absolute left-[3.4cqw] top-[20cqw] font-display text-[6.2cqw] font-semibold leading-none [text-shadow:0_1px_2px_#000]" style={{ color: skin.light }}>
            {card.numeral}
          </span>
          <span className="absolute right-[3cqw] top-[20cqw] [filter:drop-shadow(0_1px_1px_#000)]" style={{ color: skin.light }}>
            <RarityPips rarity={card.rarity} className="flex-col text-[4.4cqw]" />
          </span>
        </span>

        {/* medalhão do glifo, cravado no pé da janela */}
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-[79cqw] aspect-square w-[19cqw] -translate-x-1/2 rounded-full p-[1cqw]"
          style={{ background: skin.frame, boxShadow: `0 0 5cqw ${skin.glow}, 0 1cqw 2cqw rgba(0,0,0,0.8)` }}
        >
          <span className="grid size-full place-items-center rounded-full bg-[radial-gradient(circle_at_50%_35%,#2c2c31,#0c0c0e_72%)]" style={{ color: skin.light }}>
            <Glyph className="size-[56%]" strokeWidth={1.4} />
          </span>
        </span>

        {/* Nome só quando a carta é grande o bastante (≥ 10 px efetivos); na miniatura ele vem embaixo, fora da carta. */}
        <span aria-hidden="true" className="absolute inset-x-[6cqw] top-[100cqw] hidden h-[18cqw] items-start justify-center text-center @min-[150px]:flex">
          <span className="line-clamp-2 pt-[0.14em] font-display text-[max(10px,6.6cqw)] font-semibold uppercase leading-[1.2] tracking-[0.06em] text-[#eeedeb]">{card.name}</span>
        </span>
        <span aria-hidden="true" className="absolute inset-x-[7cqw] top-[118cqw] hidden items-center justify-center gap-[2cqw] whitespace-nowrap font-sans text-[3.6cqw] font-medium uppercase tracking-[0.18em] @min-[130px]:flex" style={{ color: skin.light }}>
          <span className="h-px flex-1 bg-current opacity-40" />
          {card.type} · {archetype}
          <span className="h-px flex-1 bg-current opacity-40" />
        </span>
        <span aria-hidden="true" className="absolute inset-x-[7cqw] bottom-[4.4cqw] hidden items-baseline justify-between font-mono text-[3.2cqw] uppercase tracking-[0.1em] text-[#eeedeb]/60 @min-[150px]:flex">
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
            className="dvcard-holo pointer-events-none absolute inset-0 opacity-[0.42] mix-blend-color-dodge"
            style={{
              backgroundImage:
                "linear-gradient(115deg, transparent 18%, rgba(203,197,232,0.38) 34%, rgba(236,229,216,0.45) 44%, rgba(170,214,220,0.22) 52%, rgba(203,197,232,0.3) 60%, transparent 76%), repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 4px)",
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
