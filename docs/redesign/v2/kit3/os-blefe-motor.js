// Gerado por art-src/blefe_motor.mjs a partir de lib/devo/arcade/bluff.ts. Não editar.
"use strict";
var BF = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: !0 });
  }, __copyProps = (to, from, except, desc) => {
    if (from && typeof from == "object" || typeof from == "function")
      for (let key of __getOwnPropNames(from))
        !__hasOwnProp.call(to, key) && key !== except && __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: !0 }), mod);

  // ../../../../../lib/devo/arcade/bluff.ts
  var bluff_exports = {};
  __export(bluff_exports, {
    BLUFF_BULLETS: () => BLUFF_BULLETS,
    BLUFF_CAP: () => BLUFF_CAP,
    BLUFF_GRACE_MS: () => BLUFF_GRACE_MS,
    BLUFF_RANKS: () => BLUFF_RANKS,
    BLUFF_SUITS: () => BLUFF_SUITS,
    BLUFF_TURN_MS: () => BLUFF_TURN_MS,
    bluffBotMove: () => bluffBotMove,
    bluffCall: () => bluffCall,
    bluffCanAct: () => bluffCanAct,
    bluffNew: () => bluffNew,
    bluffPass: () => bluffPass,
    bluffPending: () => bluffPending,
    bluffPlay: () => bluffPlay,
    bluffRevealMs: () => bluffRevealMs,
    bluffScore: () => bluffScore,
    bluffTimeout: () => bluffTimeout,
    bluffView: () => bluffView
  });

  // ../../../../../lib/devo/arcade/games.ts
  var GAMES = {
    "memory-rush": {
      id: "memory-rush",
      name: "Memory Rush",
      tagline: "Mesmo tabuleiro. Dois c\xE9rebros. Um vencedor.",
      description: "Os dois jogadores recebem o mesmo tabuleiro ao mesmo tempo. Cada par encontrado \xE9 seu; cada erro custa caro.",
      players: 2,
      durationSec: 120,
      minDurationSec: 15,
      maxScore: 6e3,
      rules: [
        "Quatro fases: 10, 8, 6 e 4 pares.",
        "Os dois competem pelo mesmo tabuleiro em tempo real.",
        "Par encontrado pelo oponente sai do seu tabuleiro."
      ],
      scoring: ["Par: +100", "Erro: -50 (o placar nunca fica negativo)", "Combo soma +50 por par seguido (at\xE9 +300)"],
      accent: "#c9a227",
      thumbnail: "/images/arcade/banner-memory-rush.png",
      status: "disponivel"
    },
    chess: {
      id: "chess",
      name: "Living Chess",
      tagline: "Cada captura \xE9 um combate.",
      description: "Xadrez r\xE1pido com ex\xE9rcitos vivos: soldados, guardi\xF5es, cavaleiros e magos lutam a cada captura. 10 minutos de rel\xF3gio por jogador, que s\xF3 corre na pr\xF3pria vez.",
      players: 2,
      durationSec: 70,
      minDurationSec: 8,
      maxScore: 3e3,
      rules: ["10 minutos de rel\xF3gio por jogador; ele s\xF3 corre na sua vez e para quando voc\xEA joga.", "Promo\xE7\xE3o autom\xE1tica para dama.", "Tempo zerado \xE9 derrota."],
      scoring: ["Vit\xF3ria: +600", "Captura: + valor da pe\xE7a x10", "Tempo restante vira b\xF4nus"],
      accent: "#b3141c",
      thumbnail: "/images/arcade/banner-living-chess.png",
      status: "disponivel"
    },
    "hot-bomb": {
      id: "hot-bomb",
      name: "Bomba Quente",
      tagline: "Passe adiante. Ou exploda.",
      description: "Dois jogadores, uma bomba. Passe-a para o outro antes que ela exploda! Quem estiver com ela quando estourar perde o ponto.",
      players: 2,
      durationSec: 120,
      minDurationSec: 14,
      maxScore: 2500,
      rules: ["Vence quem fizer 3 pontos.", "Encoste no oponente para passar a bomba.", "Quem estiver com ela quando estourar perde o ponto.", "Pule, desvie das barras e aguente os eventos ca\xF3ticos."],
      scoring: ["Rodada vencida: +300", "Passe: +20", "Passe nos \xFAltimos 2s: CLUTCH +100"],
      accent: "#e0672a",
      thumbnail: "/images/arcade/banner-hot-bomb.png",
      status: "disponivel"
    },
    bluff: {
      id: "bluff",
      name: "Blefe",
      tagline: "Quem mente melhor sobrevive.",
      description: "Cartas viradas, um valor por vez e tr\xEAs balas para desmascarar o oponente. Minta, duvide e esvazie a m\xE3o primeiro.",
      players: 2,
      durationSec: 300,
      minDurationSec: 20,
      maxScore: 3e3,
      rules: [
        "A mesa pede A, 2, 3\u2026 at\xE9 K, e recome\xE7a.",
        "Jogue de 1 a 4 cartas viradas como o valor da vez. Pode mentir.",
        "Chamar blefe gasta uma bala; acertou, ela volta.",
        "Quem perde a disputa recolhe at\xE9 6 cartas; o resto queima.",
        "25 segundos por turno."
      ],
      scoring: ["Vit\xF3ria: +600", "Blefe desmascarado: +150", "Bala guardada: +80", "Carta descartada: +10"],
      accent: "#d6334f",
      thumbnail: "/images/arcade/banner-blefe.png",
      status: "disponivel"
    }
  }, GAME_LIST = Object.values(GAMES);
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = a + 1831565813 >>> 0;
      let t = a;
      return t = Math.imul(t ^ t >>> 15, t | 1), t ^= t + Math.imul(t ^ t >>> 7, t | 61), ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // ../../../../../lib/devo/arcade/bluff.ts
  var BLUFF_RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"], BLUFF_SUITS = ["\u2660", "\u2665", "\u2666", "\u2663"], BLUFF_CAP = 6, BLUFF_BULLETS = 3, BLUFF_TURN_MS = 25e3, BLUFF_GRACE_MS = 1500, other = (s) => s === "a" ? "b" : "a";
  function bluffRevealMs(n) {
    return Math.round((n * 0.6 + 0.95 + 2.8) * 1e3);
  }
  function sortHand(h) {
    return h.slice().sort((x, y) => x.r - y.r || x.s - y.s);
  }
  function bluffNew(seed, startAt) {
    let r = rng(seed ^ 5369127), deck = [];
    for (let s = 0; s < 4; s++) for (let k = 0; k < 13; k++) deck.push({ id: s * 13 + k, r: k, s });
    for (let i = deck.length - 1; i > 0; i--) {
      let j = Math.floor(r() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    let hands = { a: [], b: [] };
    return deck.forEach((c, i) => hands[i % 2 === 0 ? "a" : "b"].push(c)), {
      hands: { a: sortHand(hands.a), b: sortHand(hands.b) },
      pile: [],
      last: null,
      turn: r() < 0.5 ? "a" : "b",
      rk: 0,
      bul: { a: BLUFF_BULLETS, b: BLUFF_BULLETS },
      turnAt: startAt,
      holdUntil: startAt,
      seq: 0,
      ev: null,
      winner: null,
      calls: { a: 0, b: 0 },
      hits: { a: 0, b: 0 },
      caught: { a: 0, b: 0 }
    };
  }
  function bluffPending(s) {
    return !!s.last && s.hands[s.last.side].length === 0;
  }
  function bluffCanAct(s, side, now) {
    return s.winner === null && s.turn === side && now >= s.holdUntil;
  }
  function bluffPlay(s, side, ids, now, auto = !1) {
    if (!bluffCanAct(s, side, now) || bluffPending(s) || !ids.length || ids.length > 4 || new Set(ids).size !== ids.length) return !1;
    let hand = s.hands[side], cards = ids.map((id) => hand.find((c) => c.id === id));
    if (cards.some((c) => !c)) return !1;
    let picked = cards;
    return s.hands[side] = hand.filter((c) => !ids.includes(c.id)), s.pile = s.pile.concat(picked), s.last = { side, n: picked.length, rank: s.rk, cards: picked }, s.ev = { seq: ++s.seq, t: "play", side, n: picked.length, rank: s.rk, auto }, s.rk = (s.rk + 1) % 13, s.turn = other(side), s.turnAt = now, !0;
  }
  function bluffCall(s, side, now) {
    if (!bluffCanAct(s, side, now) || !s.last || s.last.side === side || s.bul[side] < 1) return !1;
    let L = s.last, truth = L.cards.every((c) => c.r === L.rank);
    s.calls[side] += 1, truth ? s.bul[side] -= 1 : (s.hits[side] += 1, s.caught[L.side] += 1);
    let loser = truth ? side : L.side, taken = s.pile.slice(-BLUFF_CAP), burned = s.pile.length - taken.length;
    return s.hands[loser] = sortHand(s.hands[loser].concat(taken)), s.pile = [], s.ev = {
      seq: ++s.seq,
      t: "call",
      caller: side,
      liar: L.side,
      truth,
      cards: L.cards,
      rank: L.rank,
      loser,
      taken: taken.length,
      burned,
      bullet: truth ? "lost" : "back",
      left: s.bul[side]
    }, s.last = null, s.holdUntil = now + bluffRevealMs(L.cards.length), s.turnAt = s.holdUntil, truth && s.hands[L.side].length === 0 && (s.winner = L.side), !0;
  }
  function bluffPass(s, side, now, auto = !1) {
    return !bluffCanAct(s, side, now) || !s.last || !bluffPending(s) ? !1 : (s.winner = s.last.side, s.ev = { seq: ++s.seq, t: "pass", side, auto }, !0);
  }
  function bluffTimeout(s, now) {
    if (s.winner !== null || now < Math.max(s.turnAt, s.holdUntil) + BLUFF_TURN_MS + BLUFF_GRACE_MS) return !1;
    let side = s.turn, at = Math.max(s.turnAt, s.holdUntil) + BLUFF_TURN_MS;
    if (bluffPending(s)) return bluffPass(s, side, at, !0);
    let hand = s.hands[side], pick = hand.find((c) => c.r === s.rk) ?? farthest(hand, s.rk);
    return pick ? bluffPlay(s, side, [pick.id], Math.max(at, s.holdUntil), !0) : !1;
  }
  function farthest(hand, rk) {
    return hand.slice().sort((x, y) => (y.r - rk + 13) % 13 - (x.r - rk + 13) % 13)[0];
  }
  function bluffView(s, side) {
    let opp = other(side);
    return {
      me: s.hands[side],
      oppN: s.hands[opp].length,
      pileN: s.pile.length,
      last: s.last ? { side: s.last.side, n: s.last.n, rank: s.last.rank } : null,
      turn: s.turn,
      rk: s.rk,
      bul: s.bul,
      turnAt: s.turnAt,
      holdUntil: s.holdUntil,
      ev: s.ev,
      winner: s.winner,
      calls: s.calls,
      hits: s.hits
    };
  }
  function bluffScore(s, side) {
    let discarded = Math.max(0, 26 - s.hands[side].length);
    return {
      score: s.hits[side] * 150 + s.bul[side] * 80 + discarded * 10 + (s.winner === side ? 600 : 0),
      stats: {
        calls: s.calls[side],
        hits: s.hits[side],
        caught: s.caught[side],
        cardsLeft: s.hands[side].length,
        bulletsLeft: s.bul[side]
      }
    };
  }
  function bluffBotMove(s, side, now, rand = Math.random) {
    let L = s.last, hand = s.hands[side], bl = s.bul[side];
    if (L) {
      let liarN = s.hands[L.side].length, sure = hand.filter((c) => c.r === L.rank).length + L.n > 4;
      if (bl > 0) {
        let pr;
        if (sure ? pr = 1 : liarN === 0 ? pr = 0.9 : (pr = [0, 0.05, 0.12, 0.25, 0.4][L.n], liarN <= 2 && (pr += 0.2), pr += Math.min(s.pile.length, 20) / 200, hand.length > 14 && (pr -= 0.1), bl === 1 ? pr *= 0.55 : bl === 2 && (pr *= 0.85)), rand() < pr) return bluffCall(s, side, now);
      }
      if (liarN === 0) return bluffPass(s, side, now);
    }
    let rk = s.rk, own = hand.filter((c) => c.r === rk), pick = [];
    if (own.length) {
      let k = own.length;
      k > 1 && rand() < 0.25 && (k = 1 + Math.floor(rand() * k)), pick = own.slice(0, k);
    }
    let extra = 0;
    if (own.length ? pick.length < 4 && hand.length > pick.length && rand() < 0.22 && (extra = 1) : extra = 1 + (rand() < 0.5 ? 1 : 0) + (rand() < 0.25 ? 1 : 0), extra) {
      let rest = hand.filter((c) => !pick.includes(c)).sort((x, y) => (y.r - rk + 13) % 13 - (x.r - rk + 13) % 13);
      pick = pick.concat(rest.slice(0, Math.min(extra, 4 - pick.length)));
    }
    return bluffPlay(s, side, pick.map((c) => c.id), now);
  }
  return __toCommonJS(bluff_exports);
})();
