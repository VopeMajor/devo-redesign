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
import { useId } from "react";
import {
  ARCHETYPE_BY_TYPE,
  getCard,
  getCardMeta,
  getCardRadius,
  RARITY_META,
} from "@/lib/devo/cards";
import type { CardType, GlyphName } from "@/lib/devo/types";
import { cn } from "@/lib/utils";

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

const GOLD = "#d8b25a";
const GOLD_DEEP = "#9a7428";
const CREAM = "#f3e8c9";
const INK = "#2b1610";
const CRIMSON = "#7a0d14";
const NAVY = "#0b1a4d";

const CARD_SHELL = "relative aspect-[9/20] [container-type:inline-size]";
const CARD_BODY = "absolute inset-0 overflow-hidden rounded-[5cqw] p-[4.5cqw]";

const CRIMSON_TEXTURE = {
  backgroundColor: CRIMSON,
  backgroundImage: `radial-gradient(circle at 20% 15%, #a3141d 0 1px, transparent 2px), radial-gradient(circle at 70% 60%, #4d070c 0 1px, transparent 2px), radial-gradient(ellipse at 50% 0%, #9e1820, transparent 60%), radial-gradient(ellipse at 50% 100%, #4a060b, transparent 60%)`,
  backgroundSize: "7px 7px, 9px 9px, 100% 100%, 100% 100%",
};

function StarPoints({
  points,
  outer,
  inner,
  cx = 50,
  cy = 50,
}: {
  points: number;
  outer: number;
  inner: number;
  cx?: number;
  cy?: number;
}) {
  return Array.from({ length: points * 2 }, (_, i) => {
    const a = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(" ");
}

function CompassCrest({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <polygon
        points={StarPoints({ points: 16, outer: 50, inner: 30 })}
        fill={CRIMSON}
        stroke={GOLD}
        strokeWidth="1.2"
      />
      <circle
        cx="50"
        cy="50"
        r="30"
        fill={NAVY}
        stroke={GOLD}
        strokeWidth="2"
      />
      <circle
        cx="50"
        cy="50"
        r="26"
        fill="none"
        stroke={GOLD}
        strokeWidth="0.6"
        strokeDasharray="1.5 2"
      />
      <polygon
        points={StarPoints({ points: 8, outer: 25, inner: 7 })}
        fill={GOLD}
        stroke={GOLD_DEEP}
        strokeWidth="0.6"
      />
      <polygon
        points={StarPoints({ points: 4, outer: 25, inner: 4 })}
        fill="#f7e7b0"
      />
    </svg>
  );
}

function SideStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <polygon
        points={StarPoints({ points: 6, outer: 48, inner: 22 })}
        fill={GOLD}
        stroke={GOLD_DEEP}
        strokeWidth="3"
      />
      <polygon
        points={StarPoints({ points: 6, outer: 28, inner: 12 })}
        fill="#f7e7b0"
      />
    </svg>
  );
}

function CrescentMoon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden="true">
      <path
        d="M8 6 A24 24 0 0 0 52 6 A20 20 0 0 1 8 6 Z"
        fill={GOLD}
        stroke={GOLD_DEEP}
        strokeWidth="1.2"
      />
    </svg>
  );
}

const FACE_W = 420;
const FACE_H = 940;
const FACE_INK = "#3a2214";
const FACE_INK_SOFT = "#4a2f1d";
const TITLE_MAX = 232;

function box(left: number, top: number, width: number, height: number) {
  return {
    left: `${(left / FACE_W) * 100}%`,
    top: `${(top / FACE_H) * 100}%`,
    width: `${(width / FACE_W) * 100}%`,
    height: `${(height / FACE_H) * 100}%`,
  };
}

const px = (n: number) => `${(n / FACE_W) * 100}cqw`;

const WINDOW_PATH =
  "M75 606 L75 415 C75 402 84 394 84 380 C84 366 75 358 75 345 L75 150 C75 132 70 116 62 104 C59 101 58 100 60 98 C66 96 73 92 73 84 C73 76 68 72 66 64 C64 58 66 52 72 54 C74 55 75 57 78 58 L128 58 C148 59 158 93 210 95 C262 93 272 59 292 58 L342 58 C345 57 346 55 348 54 C354 52 356 58 354 64 C352 72 347 76 347 84 C347 92 354 96 360 98 C362 100 361 101 358 104 C350 116 345 132 345 150 L345 345 C345 358 336 366 336 380 C336 394 345 402 345 415 L345 606 C345 624 336 630 320 634 C310 637 306 644 296 646 L124 646 C114 644 110 637 100 634 C84 630 75 624 75 606 Z";
const PETAL_PATH =
  "M48 36 C57 37 66 39 72 43 C76 47 78 51 78 56 L70 58 C64 60 61 64 59 72 C54 60 50 48 48 36Z";
const LOWER_HALF_PATH =
  "M82 680 C64 683 51 690 51 704 L51 888 C51 898 57 903 67 903 L134 903 C144 903 149 897 147 892 C145 887 138 887 137 892 M150 895 C156 902 168 905 192 903";
const MIRROR = "translate(420 0) scale(-1 1)";

function FaceFrame({ uid, art, title }: { uid: string; art: string; title: string }) {
  const id = (name: string) => `${uid}-${name}`;
  const ref = (name: string) => `url(#${id(name)})`;
  const fitTitle = title.length * 11.2 > TITLE_MAX;

  const star4 = (x: number, y: number, s: number) => (
    <use href={`#${id("star4")}`} x={x} y={y} width={s} height={s} />
  );

  return (
    <svg
      viewBox={`0 0 ${FACE_W} ${FACE_H}`}
      className="absolute inset-0 block size-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id("gold")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde49a" />
          <stop offset=".45" stopColor="#e9b546" />
          <stop offset="1" stopColor="#b47a1b" />
        </linearGradient>
        <linearGradient id={id("goldSide")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c38a24" />
          <stop offset=".5" stopColor="#f6d576" />
          <stop offset="1" stopColor="#c38a24" />
        </linearGradient>
        <linearGradient id={id("flame")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#eaa042" />
          <stop offset=".5" stopColor="#c73d2c" />
          <stop offset="1" stopColor="#7d1e2a" />
        </linearGradient>
        <linearGradient id={id("ribbon")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6dc93" />
          <stop offset=".55" stopColor="#e8bd5e" />
          <stop offset="1" stopColor="#c99230" />
        </linearGradient>
        <linearGradient id={id("ribbonBack")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#b98227" />
          <stop offset=".55" stopColor="#e2b555" />
          <stop offset="1" stopColor="#9a6619" />
        </linearGradient>
        <radialGradient id={id("orangeGlow")} cx=".3" cy=".25" r=".95">
          <stop offset="0" stopColor="#f7a744" />
          <stop offset=".6" stopColor="#ec8a29" />
          <stop offset="1" stopColor="#d86f1c" />
        </radialGradient>
        <radialGradient id={id("paper")} cx=".5" cy=".4" r=".75">
          <stop offset="0" stopColor="#faf1d9" />
          <stop offset=".7" stopColor="#f3e5c3" />
          <stop offset="1" stopColor="#e8d4a6" />
        </radialGradient>
        <filter id={id("mottle")} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="4" seed="7" result="n1" />
          <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3" result="n2" />
          <feColorMatrix in="n1" values="0 0 0 0 .78  0 0 0 0 .33  0 0 0 0 .05  0 0 0 1.4 -.55" result="blot" />
          <feColorMatrix in="n2" values="0 0 0 0 .55  0 0 0 0 .22  0 0 0 0 .03  0 0 0 .7 -.1" result="grain" />
          <feMerge>
            <feMergeNode in="blot" />
            <feMergeNode in="grain" />
          </feMerge>
        </filter>
        <filter id={id("paperGrain")} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="11" />
          <feColorMatrix values="0 0 0 0 .45  0 0 0 0 .3  0 0 0 0 .12  0 0 0 .2 0" />
        </filter>
        <path id={id("window")} d={WINDOW_PATH} />
        <clipPath id={id("clipWindow")}>
          <path d={WINDOW_PATH} />
        </clipPath>
        <path id={id("petal")} d={PETAL_PATH} />
        <path id={id("lowerHalf")} d={LOWER_HALF_PATH} />
        <clipPath id={id("moonOuter")}>
          <circle cx="200.5" cy="902" r="20.5" />
        </clipPath>
        <mask id={id("moonCut")} maskUnits="userSpaceOnUse" x="170.5" y="874" width="60" height="60">
          <rect x="170.5" y="874" width="60" height="60" fill="#fff" />
          <circle cx="190.5" cy="899" r="17" fill="#000" />
        </mask>
        <symbol id={id("star4")} viewBox="-10 -10 20 20" overflow="visible">
          <path
            d="M0-10 C1-3 3-1 10 0 C3 1 1 3 0 10 C-1 3 -3 1 -10 0 C-3-1 -1-3 0-10Z"
            fill={ref("gold")}
            stroke="#4a2c0c"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          <path d="M0-10 L0 10 M-10 0 L10 0" stroke="#8d5c12" strokeWidth=".7" />
        </symbol>
        <symbol id={id("star6")} viewBox="-26 -26 52 52" overflow="visible">
          <g strokeLinejoin="round">
            <path d="M0-25 L6.8-11.8 20.8-12 13.6 0 20.8 12 6.8 11.8 0 25 -6.8 11.8 -20.8 12 -13.6 0 -20.8-12 -6.8-11.8Z" fill="#f2c962" />
            <path d="M0-25 L6.8-11.8 0 0Z M20.8-12 L13.6 0 0 0Z M20.8 12 L6.8 11.8 0 0Z M0 25 L-6.8 11.8 0 0Z M-20.8 12 L-13.6 0 0 0Z M-20.8-12 L-6.8-11.8 0 0Z" fill="#c18a2a" />
            <path d="M0-25 L6.8-11.8 20.8-12 13.6 0 20.8 12 6.8 11.8 0 25 -6.8 11.8 -20.8 12 -13.6 0 -20.8-12 -6.8-11.8Z" fill="none" stroke={FACE_INK} strokeWidth="1.6" />
            <path d="M0-25 0 25 M-20.8-12 20.8 12 M-20.8 12 20.8-12" stroke={FACE_INK} strokeWidth=".9" />
            <circle r="1.6" fill={FACE_INK} />
          </g>
        </symbol>
        <symbol id={id("star8")} viewBox="-34 -34 68 68" overflow="visible">
          <g stroke={FACE_INK} strokeWidth="1" strokeLinejoin="round">
            <path d="M15-15 L4 0 15 15 0 4 -15 15 -4 0 -15-15 0-4Z" fill="#e2ad45" />
            <path d="M15-15 L4 0 0 0Z M15 15 L0 4 0 0Z M-15 15 L-4 0 0 0Z M-15-15 L0-4 0 0Z" fill="#a46c18" />
            <path d="M0-33 L5.5-5.5 33 0 5.5 5.5 0 33 -5.5 5.5 -33 0 -5.5-5.5Z" fill="#f6d06a" />
            <path d="M0-33 L5.5-5.5 0 0Z M33 0 L5.5 5.5 0 0Z M0 33 L-5.5 5.5 0 0Z M-33 0 L-5.5-5.5 0 0Z" fill="#c18a2a" />
          </g>
        </symbol>
        <path id={id("titleCurve")} d="M84 674 Q210 701 336 674" fill="none" />
      </defs>

      <rect width={FACE_W} height={FACE_H} fill={ref("orangeGlow")} />
      <rect width={FACE_W} height={FACE_H} filter={ref("mottle")} opacity=".9" />

      <rect x="37.5" y="15" width="345" height="905" rx="15" fill={ref("paper")} />
      <rect x="37.5" y="15" width="345" height="905" rx="15" filter={ref("paperGrain")} />
      <rect x="37.5" y="15" width="345" height="905" rx="15" fill="none" stroke={FACE_INK} strokeWidth="1.6" />
      <rect x="41.5" y="19" width="337" height="897" rx="12" fill="none" stroke="#b98a3a" strokeWidth=".7" opacity=".6" />

      <use href={`#${id("window")}`} fill="#2a1838" />
      <image
        href={art}
        x="75"
        y="54"
        width="285"
        height="592"
        preserveAspectRatio="xMidYMid slice"
        clipPath={ref("clipWindow")}
      />
      <path d={WINDOW_PATH} fill="#1a0a3a" opacity=".22" />

      <g stroke={FACE_INK} strokeWidth="1.3" strokeLinejoin="round">
        <use href={`#${id("petal")}`} fill="#5b2b4c" />
        <use href={`#${id("petal")}`} fill="#5b2b4c" transform={MIRROR} />
      </g>
      <g fill="none" stroke={ref("gold")} strokeWidth="2.2" strokeLinecap="round">
        <path d="M51 40 C54 50 57 58 60 66" />
        <path d="M369 40 C366 50 363 58 360 66" />
      </g>

      <use href={`#${id("window")}`} fill="none" stroke={FACE_INK} strokeWidth="8.5" strokeLinejoin="round" />
      <use href={`#${id("window")}`} fill="none" stroke={ref("goldSide")} strokeWidth="6" strokeLinejoin="round" />
      <use href={`#${id("window")}`} fill="none" stroke="#fff3c8" strokeWidth=".9" strokeLinejoin="round" opacity=".55" />

      <g stroke={FACE_INK} strokeWidth="1" strokeLinejoin="round">
        <path d="M182 30 C168 28 150 28 136 27 C120 26 104 30 88 29 C102 35 120 35 134 35 C150 35 166 37 180 40Z" fill={ref("flame")} />
        <path d="M238 30 C252 28 270 28 284 27 C300 26 316 30 332 29 C318 35 300 35 286 35 C270 35 254 37 240 40Z" fill={ref("flame")} />
        <path d="M182 24 C166 14 150 10 136 14 C122 18 106 12 92 14 C84 15 78 17 72 19 C86 23 100 25 112 23 C128 21 140 25 152 27 C162 29 172 30 182 32Z" fill={ref("gold")} />
        <path d="M238 24 C254 14 270 10 284 14 C298 18 314 12 328 14 C336 15 342 17 348 19 C334 23 320 25 308 23 C292 21 280 25 268 27 C258 29 248 30 238 32Z" fill={ref("gold")} />
        <path d="M180 49 C164 51 148 54 136 60 C126 64 118 66 108 66 C120 71 134 70 144 66 C156 62 168 60 182 58Z" fill={ref("flame")} />
        <path d="M240 49 C256 51 272 54 284 60 C294 64 302 66 312 66 C300 71 286 70 276 66 C264 62 252 60 238 58Z" fill={ref("flame")} />
        <path d="M183 56 C170 60 160 66 150 70 C142 74 134 74 125 72 C136 79 150 79 160 75 C170 71 178 67 187 64Z" fill={ref("gold")} />
        <path d="M237 56 C250 60 260 66 270 70 C278 74 286 74 295 72 C284 79 270 79 260 75 C250 71 242 67 233 64Z" fill={ref("gold")} />
        <path d="M80 40 L180 29 L180 40Z" fill="#f7d873" />
        <path d="M80 40 L180 40 L180 51Z" fill="#c38a24" />
        <path d="M340 40 L240 29 L240 40Z" fill="#f7d873" />
        <path d="M340 40 L240 40 L240 51Z" fill="#c38a24" />
        <path d="M134 102 L170 58 L184 70Z" fill="#f7d873" />
        <path d="M134 102 L184 70 L198 82Z" fill="#c38a24" />
        <path d="M286 102 L250 58 L236 70Z" fill="#f7d873" />
        <path d="M286 102 L236 70 L222 82Z" fill="#c38a24" />
        <path d="M203 76 C195 92 212 100 203 115 C197 127 210 134 206 152 C217 137 208 126 215 114 C223 100 207 92 217 76Z" fill={ref("flame")} />
        <path d="M210 82 C205 94 216 101 209 114 C205 122 211 130 209 140" fill="none" stroke="#f3c45a" strokeWidth="1.3" />
      </g>

      <g transform="translate(210 39)">
        <circle r="40" fill={FACE_INK} />
        <circle r="38.8" fill={ref("gold")} />
        <circle r="34.5" fill="#5c2647" stroke={FACE_INK} strokeWidth="1.2" />
        <g fill="#7a3557">
          <path d="M0 0 L0-34 A34 34 0 0 1 24-24Z" />
          <path d="M0 0 L34 0 A34 34 0 0 1 24 24Z" />
          <path d="M0 0 L0 34 A34 34 0 0 1 -24 24Z" />
          <path d="M0 0 L-34 0 A34 34 0 0 1 -24-24Z" />
        </g>
        <circle r="27" fill="none" stroke="#d9a440" strokeWidth=".6" strokeDasharray="2 3" opacity=".7" />
        <g fill="#f8dc86">
          <circle cx="-18" cy="-13" r=".9" />
          <circle cx="14" cy="-20" r=".7" />
          <circle cx="22" cy="9" r=".9" />
          <circle cx="-12" cy="19" r=".7" />
          <circle cx="7" cy="25" r=".6" />
          <circle cx="-25" cy="4" r=".6" />
        </g>
        <use href={`#${id("star8")}`} x="-34" y="-34" width="68" height="68" />
      </g>

      <use href={`#${id("star6")}`} x="33" y="355" width="52" height="52" />
      <use href={`#${id("star6")}`} x="335" y="355" width="52" height="52" />

      <g fill="none" strokeLinejoin="round" strokeLinecap="round">
        <g stroke={FACE_INK} strokeWidth="7">
          <use href={`#${id("lowerHalf")}`} />
          <use href={`#${id("lowerHalf")}`} transform={MIRROR} />
        </g>
        <g stroke={ref("gold")} strokeWidth="4.6">
          <use href={`#${id("lowerHalf")}`} />
          <use href={`#${id("lowerHalf")}`} transform={MIRROR} />
        </g>
        <g stroke="#fff3c8" strokeWidth=".8" opacity=".5">
          <use href={`#${id("lowerHalf")}`} />
          <use href={`#${id("lowerHalf")}`} transform={MIRROR} />
        </g>
      </g>

      <g stroke="#4a2c18" strokeWidth=".9" fill="none" strokeLinecap="round">
        <path d="M66 698 H354" />
        <path d="M60 705 V888 M360 705 V888" />
        <path d="M66 768 H354 M66 845 H354" />
        <path d="M157.5 703 V764 M265 703 V764" />
        <path d="M157.5 772 V886" />
      </g>
      {star4(52, 690, 16)}
      {star4(352, 690, 16)}
      {star4(51, 759, 18)}
      {star4(351, 759, 18)}
      {star4(51, 836, 18)}
      {star4(351, 836, 18)}
      {star4(58.5, 885, 11)}
      {star4(350.5, 885, 11)}

      <g>
        <circle cx="200.5" cy="902" r="20.5" fill={ref("gold")} mask={ref("moonCut")} />
        <circle cx="200.5" cy="902" r="20.5" fill="none" stroke={FACE_INK} strokeWidth="1.4" mask={ref("moonCut")} />
        <circle cx="190.5" cy="899" r="17" fill="none" stroke={FACE_INK} strokeWidth="1.4" clipPath={ref("moonOuter")} />
        <path d="M213.5 888 C221.5 898 219.5 912 209.5 918" fill="none" stroke="#fff3c8" strokeWidth="1.2" opacity=".55" strokeLinecap="round" />
      </g>

      <g stroke={FACE_INK} strokeWidth="1.3" strokeLinejoin="round">
        <path d="M86 649 C80 636 78 626 72 620 L56 616 C54 636 54 660 58 678 L82 685Z" fill={ref("ribbonBack")} />
        <path d="M334 649 C340 636 342 626 348 620 L364 616 C366 636 366 660 362 678 L338 685Z" fill={ref("ribbonBack")} />
        <path d="M56 616 C46 616 43 607 47 601 C51 595 62 595 66 601 C70 607 66 614 60 612 C56 611 56 606 60 606" fill={ref("ribbon")} />
        <path d="M364 616 C374 616 377 607 373 601 C369 595 358 595 354 601 C350 607 354 614 360 612 C364 611 364 606 360 606" fill={ref("ribbon")} />
        <path d="M56 616 L72 620" fill="none" />
        <path d="M364 616 L348 620" fill="none" />
        <path d="M80 647 Q210 671 340 647 L340 684 Q210 711 80 684Z" fill={ref("ribbon")} />
      </g>
      <path d="M84 653 Q210 676 336 653" fill="none" stroke="#fff3c8" strokeWidth="1" opacity=".7" />
      <path d="M84 679 Q210 705 336 679" fill="none" stroke="#a8721e" strokeWidth=".7" opacity=".55" />
      <text
        textAnchor="middle"
        fill="#3b1d12"
        style={{ fontFamily: "var(--font-card-banner), Georgia, serif", fontWeight: 700, fontSize: 25, letterSpacing: 0.3 }}
        {...(fitTitle ? { textLength: TITLE_MAX, lengthAdjust: "spacingAndGlyphs" } : {})}
      >
        <textPath href={`#${id("titleCurve")}`} startOffset="50%">
          {title}
        </textPath>
      </text>
      {star4(205, 654, 10)}
      {star4(204, 692, 12)}

      <g fill="none" stroke={FACE_INK} strokeLinejoin="round" strokeLinecap="round">
        <g transform="translate(108.5 731)" strokeWidth="1.15">
          <path d="M-15-7 V9 C-9 7.6 -3.5 8 0 10.4 C3.5 8 9 7.6 15 9 V-7" />
          <path d="M0-7.2 C-3.6-9.4 -8.4-9.8 -13-8.6 V7 C-8.4 5.9 -3.6 6.3 0 8.4Z" fill="#f5e8c8" />
          <path d="M0-7.2 C3.6-9.4 8.4-9.8 13-8.6 V7 C8.4 5.9 3.6 6.3 0 8.4Z" fill="#f5e8c8" />
        </g>
        <g transform="translate(210.5 733)" strokeWidth="1.15">
          <circle r="9.6" fill="#f5e8c8" />
          <circle r="7.6" strokeWidth=".6" />
          <path d="M-2 -9.6 V-11.8 H2 V-9.6" />
          <circle cy="-13.4" r="1.6" strokeWidth=".9" />
          <g strokeWidth=".55">
            <path d="M0-7.6v1.4M0 7.6v-1.4M-7.6 0h1.4M7.6 0h-1.4" />
            <path d="M3.8-6.6l-.5.9M6.6-3.8l-.9.5M6.6 3.8l-.9-.5M3.8 6.6l-.5-.9M-3.8 6.6l.5-.9M-6.6 3.8l.9-.5M-6.6-3.8l.9.5M-3.8-6.6l.5.9" />
          </g>
          <path d="M0 0 L-1.5-5.4 M0 0 L3.6 1.8" strokeWidth="1.15" />
          <circle r=".9" fill={FACE_INK} stroke="none" />
        </g>
        <g transform="translate(314 737)" strokeWidth=".75">
          <circle r="7.8" />
          <path d="M0-15.5 L2.5-2.5 0 0Z M15.5 0 L2.5 2.5 0 0Z M0 15.5 L-2.5 2.5 0 0Z M-15.5 0 L-2.5-2.5 0 0Z" fill={FACE_INK} />
          <path d="M0-15.5 L-2.5-2.5 0 0Z M15.5 0 L2.5-2.5 0 0Z M0 15.5 L2.5 2.5 0 0Z M-15.5 0 L-2.5 2.5 0 0Z" fill="#f5e8c8" />
          <path d="M8.6-8.6 L1.8 0 0 0Z M8.6 8.6 L0 1.8 0 0Z M-8.6 8.6 L-1.8 0 0 0Z M-8.6-8.6 L0-1.8 0 0Z" fill="#6e2424" />
          <path d="M8.6-8.6 L0-1.8 0 0Z M8.6 8.6 L1.8 0 0 0Z M-8.6 8.6 L0 1.8 0 0Z M-8.6-8.6 L-1.8 0 0 0Z" fill="#b5503f" />
          <circle r="1.3" fill="#f5e8c8" />
        </g>
        <g transform="translate(98 877)" strokeWidth=".8">
          <circle r="11.5" />
          <circle r="8.4" />
          <circle r="5.4" />
          <circle r="2.4" />
          <path d="M0-15v6 M0 9v6 M-15 0h6 M9 0h6" />
          <path d="M-11.5-11.5l2.5 2.5 M11.5-11.5l-2.5 2.5 M-11.5 11.5l2.5-2.5 M11.5 11.5l-2.5-2.5" strokeWidth=".6" />
          <circle r=".9" fill={FACE_INK} stroke="none" />
        </g>
      </g>
    </svg>
  );
}

const FACE_LABEL =
  "absolute flex items-center justify-center overflow-hidden whitespace-nowrap text-center uppercase leading-[1.5] [font-variant-numeric:lining-nums]";
const FACE_VALUE =
  "absolute flex items-center justify-center overflow-hidden text-center uppercase leading-[1.3] [font-variant-numeric:lining-nums]";
const LABEL_FONT = { fontFamily: "var(--font-card-title), Georgia, serif", fontWeight: 600, letterSpacing: "0.07em" } as const;
const VALUE_FONT = { fontFamily: "var(--font-card-title), Georgia, serif", fontWeight: 500, letterSpacing: "0.05em" } as const;

export function CardBack({ className }: { className?: string }) {
  return (
    <div className={cn(CARD_SHELL, className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/cards/back.svg"
        alt=""
        aria-hidden="true"
        draggable={false}
        className="absolute inset-0 h-full w-full select-none"
      />
    </div>
  );
}

export function CardFace({
  cardId,
  className,
}: {
  cardId: string;
  size?: DevoCardProps["size"];
  className?: string;
}) {
  const card = getCard(cardId);
  const meta = getCardMeta(cardId);
  const rarity = RARITY_META[card.rarity];
  const radius = getCardRadius(cardId);
  const archetype = ARCHETYPE_BY_TYPE[card.type];
  const Glyph = GLYPHS[card.glyph];
  const uid = `card${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <article
      className={cn(
        "relative aspect-[420/940] overflow-hidden rounded-[3.1cqw] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.8)] [container-type:inline-size]",
        className,
      )}
      style={{ color: FACE_INK }}
      aria-label={`${card.name}. Arquétipo ${archetype}. Coleção ${meta.collection}. Raridade ${rarity.label}. Função: ${card.effect} Raio: ${radius}.`}
    >
      <FaceFrame uid={uid} art={TYPE_ART[card.type]} title={card.name} />

      <div className="pointer-events-none absolute grid place-items-center" style={box(75, 150, 270, 400)}>
        <Glyph
          className="size-[24cqw] text-[#f7e7b0] opacity-80 drop-shadow-[0_0_6px_rgba(216,178,90,0.9)]"
          strokeWidth={1.1}
          aria-hidden="true"
        />
      </div>

      <div className={FACE_LABEL} style={{ ...box(62, 703, 94, 16), ...LABEL_FONT, fontSize: px(8.6) }}>Arquétipo</div>
      <div className={FACE_LABEL} style={{ ...box(159, 703, 104, 16), ...LABEL_FONT, fontSize: px(8.6) }}>Coleção</div>
      <div className={FACE_LABEL} style={{ ...box(267, 703, 91, 16), ...LABEL_FONT, fontSize: px(8.6) }}>Raridade</div>

      <div className={FACE_VALUE} style={{ ...box(62, 744, 94, 20), ...VALUE_FONT, fontSize: px(archetype.length > 18 ? 6.6 : 7.8) }}>
        <span className="line-clamp-2">{archetype}</span>
      </div>
      <div className={FACE_VALUE} style={{ ...box(159, 743, 104, 27), ...VALUE_FONT, fontSize: px(meta.collection.length > 26 ? 6.8 : 7.8) }}>
        <span className="line-clamp-2">{meta.collection}</span>
      </div>
      <div className={FACE_VALUE} style={{ ...box(267, 753, 91, 16), ...VALUE_FONT, fontSize: px(7.8) }}>
        <span className="line-clamp-1">{rarity.label}</span>
      </div>

      <div className={FACE_LABEL} style={{ ...box(60, 776, 97, 16), ...LABEL_FONT, fontSize: px(8.6) }}>Função</div>
      <div className="absolute grid place-items-center" style={box(88, 796, 41, 38)}>
        <Glyph className="size-full p-[0.6cqw]" strokeWidth={1.2} aria-hidden="true" />
      </div>
      <p
        className="absolute overflow-hidden text-left"
        style={{
          ...box(165, 774, 189, 68),
          fontFamily: "var(--font-card-body), Georgia, serif",
          fontSize: px(card.effect.length > 200 ? 7.4 : card.effect.length > 140 ? 8.2 : 8.9),
          lineHeight: 1.22,
          color: FACE_INK_SOFT,
        }}
      >
        {card.effect}
      </p>

      <div className={FACE_LABEL} style={{ ...box(76, 847, 45, 16), ...LABEL_FONT, fontSize: px(8.6) }}>Raio</div>
      <div
        className="absolute flex items-center justify-center whitespace-nowrap uppercase leading-none [font-variant-numeric:lining-nums]"
        style={{ ...box(116, 862, 34, 15), ...LABEL_FONT, fontWeight: 600, fontSize: px(radius.length > 4 ? 8.4 : 11.5) }}
      >
        {radius}
      </div>
      <p
        className="absolute flex items-center justify-center overflow-hidden text-center italic"
        style={{
          ...box(162, 849, 194, 30),
          fontFamily: "var(--font-card-body), Georgia, serif",
          fontSize: px(card.flavor.length > 70 ? 9.6 : 11.4),
          lineHeight: 1.14,
          color: FACE_INK_SOFT,
        }}
      >
        <span className="line-clamp-2">{`“${card.flavor}”`}</span>
      </p>
    </article>
  );
}

export function DevoCard({
  cardId,
  faceDown = false,
  size = "md",
  className,
}: DevoCardProps) {
  const showFace = !faceDown && cardId;
  return (
    <div className={cn("[perspective:900px]", SIZES[size], className)}>
      <div
        className={cn(
          "relative transition-transform duration-700 [transform-style:preserve-3d]",
          showFace
            ? "[transform:rotateY(0deg)]"
            : "[transform:rotateY(180deg)]",
        )}
      >
        <div className="[backface-visibility:hidden]">
          {cardId ? <CardFace cardId={cardId} /> : <CardBack />}
        </div>
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <CardBack className="h-full" />
        </div>
      </div>
    </div>
  );
}
