"""Separa as poses de corpo inteiro, reduz para pixels reais com paleta limitada e monta a comparação com o P4AU.
Uso: python -I pixel_melissa.py <pasta com p4au-NN.png>"""
from pathlib import Path
import sys
import numpy as np
from PIL import Image

AQUI = Path(sys.argv[0]).resolve().parent
P4AU = Path(sys.argv[1])
ART = AQUI.parent / "art"
ART.mkdir(exist_ok=True)
ALTURA, CORES, ZOOM = 232, 48, 3

im = np.asarray(Image.open(AQUI / "pixel-melissa-corpo.png").convert("RGB")).astype(np.float32)
r, g, b = im[..., 0], im[..., 1], im[..., 2]
excesso = g - np.maximum(r, b)
alfa = (excesso < 55)
limpo = np.dstack([r, np.minimum(g, np.maximum(r, b)), b]).astype(np.uint8)

cols = np.where(alfa.sum(0) > 2)[0]
blocos = [c for c in np.split(cols, np.where(np.diff(cols) > 3)[0] + 1) if len(c) > 120]
assert len(blocos) == 3, f"esperava 3 poses, achei {len(blocos)}"

# paleta única: as três poses precisam usar as mesmas cores
amostras = limpo[alfa].reshape(-1, 1, 3)
paleta = Image.fromarray(amostras[:: max(1, len(amostras) // 200000)]).quantize(CORES, method=Image.MEDIANCUT, dither=Image.NONE)

poses = []
for i, c in enumerate(blocos):
    linhas = np.where(alfa[:, c[0]:c[-1] + 1].sum(1) > 0)[0]
    y0, y1 = linhas[0], linhas[-1] + 1
    fator = (y1 - y0) / ALTURA
    w = round((c[-1] + 1 - c[0]) / fator)
    rgb = Image.fromarray(limpo[y0:y1, c[0]:c[-1] + 1]).resize((w, ALTURA), Image.BOX)
    mas = Image.fromarray((alfa[y0:y1, c[0]:c[-1] + 1] * 255).astype(np.uint8)).resize((w, ALTURA), Image.BOX)
    q = rgb.quantize(palette=paleta, dither=Image.NONE).convert("RGBA")
    q.putalpha(mas.point(lambda v: 255 if v >= 128 else 0))
    q.save(ART / f"melissa-pixel-{i}.png")
    poses.append(q)
    print(f"melissa-pixel-{i}.png", q.size)

# comparação: Melissa e sprites do P4AU no mesmo tamanho de pixel, sobre fundo escuro de jogo
ref = []
for n in ("03", "06", "09", "11"):
    f = Image.open(P4AU / f"p4au-{n}.png").convert("RGBA")
    a = np.asarray(f).copy()
    # alguns quadros vieram com fundo sólido: usa o canto como cor de fundo
    canto = a[0, 0, :3].astype(np.int16)
    if a[0, 0, 3] > 0:
        a[..., 3] = np.where(np.abs(a[..., :3].astype(np.int16) - canto).sum(2) < 12, 0, a[..., 3])
    f = Image.fromarray(a, "RGBA")
    ref.append(f.crop(f.getbbox()))

todos = poses + ref
L = sum(t.width for t in todos) + 12 * (len(todos) + 1)
A = max(t.height for t in todos) + 24
p = Image.new("RGB", (L * ZOOM, A * ZOOM), (28, 22, 38))
x = 12
for t in todos:
    z = t.resize((t.width * ZOOM, t.height * ZOOM), Image.NEAREST)
    p.paste(z, (x * ZOOM, (A - 12 - t.height) * ZOOM), z)
    x += t.width + 12
p.save(AQUI.parent / "melissa-pixel-vs-p4au.png")
print("prancha", p.size)
