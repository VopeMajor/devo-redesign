"""Corporações: reduz as cenas e monta as folhas do brasão em pixel (formas com o campo em magenta, figuras em cinza, ornamentos).
Uso: python corp_px.py (na pasta art-src)"""
import json
from pathlib import Path
import numpy as np
from PIL import Image

AQUI = Path(__file__).parent
SAI = AQUI.parent / "art" / "os" / "corp"
SAI.mkdir(parents=True, exist_ok=True)
FORMAS = ["escudo", "losango", "estrela", "sol", "coroa", "chave", "lua", "relogio", "ampulheta", "torre", "cruz", "rosa"]


def cena(nome, saida, tam, cores=64):
    im = Image.open(AQUI / nome).convert("RGB").resize(tam, Image.BOX)
    im.quantize(cores, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(SAI / saida, optimize=True)


def celulas(arq, cols, lins):
    a = np.asarray(Image.open(AQUI / arq).convert("RGB")).astype(np.int16)
    h, w = a.shape[:2]
    return [a[r * h // lins:(r + 1) * h // lins, c * w // cols:(c + 1) * w // cols] for r in range(lins) for c in range(cols)]


def verde(a, limite=50):
    return (a[..., 1] - np.maximum(a[..., 0], a[..., 2])) > limite


def magenta(a):
    return (a[..., 0] > 170) & (a[..., 2] > 170) & (a[..., 1] < 100)


def recorta(a, fora):
    ys, xs = np.where(~fora)
    return a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def reduz(a, W, H, fora, campo=None):
    """Cada pixel novo olha o bloco de origem: maioria de fundo vira transparente, maioria de campo vira magenta, o resto é a média do que sobra."""
    h, w = a.shape[:2]
    out = np.zeros((H, W, 4), np.uint8)
    for y in range(H):
        y0, y1 = y * h // H, max(y * h // H + 1, (y + 1) * h // H)
        for x in range(W):
            x0, x1 = x * w // W, max(x * w // W + 1, (x + 1) * w // W)
            f = fora[y0:y1, x0:x1]
            if f.mean() > .5:
                continue
            if campo is not None:
                c = campo[y0:y1, x0:x1]
                if c.mean() > .5:
                    out[y, x] = (255, 0, 255, 255)
                    continue
                resto = ~(f | c)
            else:
                resto = ~f
            bloco = a[y0:y1, x0:x1]
            cor = bloco[resto].mean(axis=0) if resto.any() else bloco.reshape(-1, 3).mean(axis=0)
            out[y, x, :3] = np.clip(cor, 0, 255)
            out[y, x, 3] = 255
    return out


def limita(rgba, cores):
    """Reduz as cores do que é opaco; o magenta do campo fica exato."""
    op = rgba[..., 3] > 0
    mg = (rgba[..., 0] == 255) & (rgba[..., 1] == 0) & (rgba[..., 2] == 255) & op
    rgb = Image.fromarray(rgba[..., :3]).quantize(cores, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).convert("RGB")
    out = np.dstack([np.asarray(rgb), rgba[..., 3]])
    out[mg] = (255, 0, 255, 255)
    return out


def centra(rgba, W, H):
    out = np.zeros((H, W, 4), np.uint8)
    h, w = rgba.shape[:2]
    y, x = (H - h) // 2, (W - w) // 2
    out[y:y + h, x:x + w] = rgba
    return out


def fit(w, h, W, H):
    k = min(W / w, H / h)
    return max(1, round(w * k)), max(1, round(h * k))


def maior_quadrado(m):
    """Maior quadrado dentro do campo: centro e lado, para pôr a figura."""
    h, w = m.shape
    d = np.zeros((h + 1, w + 1), np.int32)
    melhor = (0, 0, 0)
    alvo = (w / 2, h / 2)
    for y in range(h):
        for x in range(w):
            if m[y, x]:
                d[y + 1, x + 1] = min(d[y, x], d[y, x + 1], d[y + 1, x]) + 1
                s = d[y + 1, x + 1]
                cx, cy = x - s / 2 + .5, y - s / 2 + .5
                dist = abs(cx - alvo[0]) + abs(cy - alvo[1])
                if s > melhor[0] or (s == melhor[0] and dist < melhor[1]):
                    melhor = (int(s), dist, (cx, cy))
    return melhor[0], melhor[2]


def folha_formas():
    cels = celulas("co-formas.png", 4, 3)
    atlas, mini = np.zeros((88 * 3, 72 * 4, 4), np.uint8), np.zeros((44 * 3, 36 * 4, 4), np.uint8)
    meta = {}
    for i, c in enumerate(cels):
        f = verde(c)
        c2 = recorta(c, f)
        f2, m2 = verde(c2), magenta(c2)
        w, h = fit(c2.shape[1], c2.shape[0], 72, 88)
        g = centra(limita(reduz(c2, w, h, f2, m2), 14), 72, 88)
        w2, h2 = fit(c2.shape[1], c2.shape[0], 36, 44)
        p = centra(limita(reduz(c2, w2, h2, f2, m2), 10), 36, 44)
        r, k = i // 4, i % 4
        atlas[r * 88:(r + 1) * 88, k * 72:(k + 1) * 72] = g
        mini[r * 44:(r + 1) * 44, k * 36:(k + 1) * 36] = p
        campo = (g[..., 0] == 255) & (g[..., 1] == 0) & (g[..., 2] == 255) & (g[..., 3] > 0)
        s, (cx, cy) = maior_quadrado(campo)
        meta[FORMAS[i]] = {"cx": round(cx), "cy": round(cy), "s": s}
    Image.fromarray(atlas).save(SAI / "formas.png", optimize=True)
    Image.fromarray(mini).save(SAI / "formas-p.png", optimize=True)
    return meta


def cinza(rgba, niveis=6):
    op = rgba[..., 3] > 0
    l = rgba[..., :3].mean(axis=2)
    out = rgba.copy()
    if op.any():
        alto = np.percentile(l[op], 96)
        l = np.where(l > 34, 34 + (l - 34) * (236 - 34) / max(1, alto - 34), l)
    q = np.clip(np.round(l / 255 * (niveis - 1)) * 255 / (niveis - 1), 0, 255).astype(np.uint8)
    for k in range(3):
        out[..., k] = q
    out[~op] = 0
    return out


def folha_figuras():
    cels = celulas("co-figuras.png", 4, 3)
    tam = {"figuras": 40, "figuras-p": 20, "figuras-pp": 12}
    for nome, T in tam.items():
        atlas = np.zeros((T * 3, T * 4, 4), np.uint8)
        for i, c in enumerate(cels):
            f = verde(c, 12)
            c2 = recorta(c, verde(c))
            f2 = verde(c2, 12)
            w, h = fit(c2.shape[1], c2.shape[0], T, T)
            g = centra(cinza(reduz(c2, w, h, f2)), T, T)
            atlas[i // 4 * T:(i // 4 + 1) * T, i % 4 * T:(i % 4 + 1) * T] = g
        Image.fromarray(atlas).save(SAI / f"{nome}.png", optimize=True)


def sem_fios(rgba, voltas=3):
    """Apaga traços de um pixel que sobram entre as lâminas e a empunhadura."""
    a = rgba[..., 3] > 0
    for _ in range(voltas):
        v = np.zeros_like(a, dtype=np.int16)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dy or dx:
                    v += np.roll(np.roll(a, dy, 0), dx, 1)
        a = a & (v >= 3)
    out = rgba.copy()
    out[~a] = 0
    return out


def folha_ornatos():
    cels = celulas("co-ornatos.png", 3, 2)
    a1, a2 = np.zeros((224, 336, 4), np.uint8), np.zeros((112, 168, 4), np.uint8)
    for i, c in enumerate(cels[:5]):
        f = verde(c)
        g, p = limita(reduz(c, 112, 112, f), 16), limita(reduz(c, 56, 56, f), 12)
        if i == 2:
            g = sem_fios(g, 2)
        r, k = i // 3, i % 3
        a1[r * 112:(r + 1) * 112, k * 112:(k + 1) * 112] = g
        a2[r * 56:(r + 1) * 56, k * 56:(k + 1) * 56] = p
    Image.fromarray(a1).save(SAI / "ornatos.png", optimize=True)
    Image.fromarray(a2).save(SAI / "ornatos-p.png", optimize=True)
    s = cels[5]
    s2 = recorta(s, verde(s))
    f2 = verde(s2)
    for nome, T in (("selo", 56), ("selo-p", 24)):
        w, h = fit(s2.shape[1], s2.shape[0], T, T)
        Image.fromarray(centra(limita(reduz(s2, w, h, f2), 16), T, T)).save(SAI / f"{nome}.png", optimize=True)


cena("co-registro.png", "registro.png", (432, 288))
cena("co-sala.png", "sala.png", (432, 288))
if (AQUI / "co-sala-necro.png").exists():
    cena("co-sala-necro.png", "sala-necro.png", (432, 288))
cena("co-chamada.png", "chamada.png", (288, 432), 48)
meta = {"formas": folha_formas()}
folha_figuras()
folha_ornatos()
(SAI / "brasao.json").write_text(json.dumps(meta), encoding="utf-8")
print(meta)
print({p.name: p.stat().st_size for p in SAI.iterdir()})
