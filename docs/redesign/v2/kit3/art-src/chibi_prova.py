"""Prova do chibi em peças: corpo + penteado + cores, em andando, nos dois corpos.
Uso: python -I chibi_prova.py 1,16,13,15 saida.png"""
from pathlib import Path
import json
import sys
import numpy as np
from PIL import Image

AQUI = Path(sys.argv[0]).resolve().parent
CH = AQUI.parent / "art" / "avatar" / "chibi"
CEL, RX, ACIMA = 80, 64, 14
anc = json.loads((CH / "ancoras.json").read_text(encoding="utf-8"))
NUM = [int(x) for x in sys.argv[1].split(",")]

CAB = [((166, 150, 135), (232, 220, 200), (250, 244, 232)), ((110, 28, 44), (176, 50, 66), (236, 120, 120)),
       ((40, 70, 110), (90, 140, 190), (180, 220, 240)), ((26, 24, 28), (52, 48, 54), (110, 104, 112)),
       ((170, 84, 120), (226, 132, 166), (250, 196, 214)), ((70, 44, 28), (120, 80, 50), (186, 142, 96))]
IRIS = [((90, 62, 170), (160, 130, 225)), ((120, 70, 16), (214, 150, 50)), ((20, 90, 110), (70, 190, 200)), ((120, 40, 40), (220, 100, 90))]
PELE = [((248, 217, 195), (226, 184, 162)), ((196, 142, 104), (160, 106, 76)), ((92, 60, 44), (66, 42, 32)), ((236, 196, 160), (206, 158, 124))]


def corpo(ch, pele, iris):
    a = np.asarray(Image.open(CH / f"corpo-{ch}.png").convert("RGBA")).astype(float)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    v = .3 * r + .59 * g + .11 * b
    tom, som = (np.array(x, float) for x in pele)
    m = (r - b > 30) & (a[..., 3] > 0)
    t = np.clip((v - 150) / 65, 0, 1)[..., None]
    a[..., :3] = np.where(m[..., None], som + (tom - som) * t, a[..., :3])
    # íris: cinza médio dentro da cabeça, onde não há roupa
    s, n = (np.array(x, float) for x in iris)
    yy = (np.arange(a.shape[0]) % CEL)[:, None] * np.ones((1, a.shape[1]))
    neutro = (np.abs(r - b) < 18) & (v > 70) & (v < 190) & (a[..., 3] > 0) & (yy < 37) & (yy > 14)
    ti = np.clip((v - 70) / 90, 0, 1)[..., None]
    a[..., :3] = np.where(neutro[..., None], s + (n - s) * ti, a[..., :3])
    return a


def cabelo(n, cor):
    a = np.asarray(Image.open(CH / f"cabelo-{n}.png").convert("RGBA")).astype(float)
    v = a[..., 0]
    s, m, l = (np.array(x, float) for x in cor)
    x = s + (m - s) * np.clip((v - 95) / 80, 0, 1)[..., None]
    x = x + (l - x) * np.clip((v - 175) / 60, 0, 1)[..., None]
    tinta = np.array((20, 14, 26), float)
    a[..., :3] = tinta + (x - tinta) * np.clip((v - 25) / 46, 0, 1)[..., None]
    return a


def quadro(c, h, ch, dire, passo):
    f = Image.fromarray(c[dire * CEL:(dire + 1) * CEL, passo * CEL:(passo + 1) * CEL].astype(np.uint8), "RGBA")
    hp = Image.fromarray(h[:, dire * RX:(dire + 1) * RX].astype(np.uint8), "RGBA")
    f.alpha_composite(Image.new("RGBA", f.size), (0, 0))
    topo = anc[ch][dire][passo]
    tela = Image.new("RGBA", (CEL + 16, CEL + 16))
    tela.alpha_composite(f, (8, 16))
    tela.alpha_composite(hp, (8 + CEL // 2 - RX // 2, 16 + topo - ACIMA))
    return tela


Z, W, H = 3, CEL + 16, CEL + 16
linhas = len(NUM) * 2
p = Image.new("RGB", (8 * W * Z, linhas * H * Z // 1), (58, 46, 72))
for i, n in enumerate(NUM):
    for b, ch in enumerate("fm"):
        c = corpo(ch, PELE[(i + b) % 4], IRIS[i % 4])
        h = cabelo(n, CAB[(i + b * 3) % 6])
        for k in range(8):
            q = quadro(c, h, ch, k // 2, 0 if k % 2 == 0 else 1)
            t = q.resize((W * Z, H * Z), Image.NEAREST)
            p.paste(t, (k * W * Z, (i * 2 + b) * H * Z), t)
p.save(AQUI.parent / sys.argv[2])
print(p.size)
