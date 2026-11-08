"""Reduz uma pose para pixels reais preservando traços escuros, limpa pixels soltos e aplica o rosto colocado à mão.
Uso: python -I pixel_melissa3.py <pasta com p4au-NN.png> <imagem-fonte.png> <saida.png> [rosto.json]
rosto.json: {"cor": [[x, y], ...]} com cor em hex, em coordenadas do sprite de 400 px."""
from pathlib import Path
import json
import sys
import numpy as np
from PIL import Image

AQUI = Path(sys.argv[0]).resolve().parent
P4AU, FONTE, SAIDA = Path(sys.argv[1]), sys.argv[2], sys.argv[3]
ROSTO = sys.argv[4] if len(sys.argv) > 4 and sys.argv[4] != "-" else None
ART = AQUI.parent / "art"
ALTURA = int(sys.argv[5]) if len(sys.argv) > 5 else 400
CORES, ZOOM = 64, 2

im = np.asarray(Image.open(AQUI / FONTE).convert("RGB")).astype(np.float32)
r, g, b = im[..., 0], im[..., 1], im[..., 2]
alfa = (g - np.maximum(r, b)) < 55
limpo = np.dstack([r, np.minimum(g, np.maximum(r, b)), b])
linhas, cols = np.where(alfa.sum(1) > 0)[0], np.where(alfa.sum(0) > 0)[0]
y0, y1, x0, x1 = linhas[0], linhas[-1] + 1, cols[0], cols[-1] + 1
fig, mas = limpo[y0:y1, x0:x1], alfa[y0:y1, x0:x1]
tam = (y1 - y0) / ALTURA
nw = round((x1 - x0) / tam)
luz = fig @ np.array([0.3, 0.59, 0.11])

saida = np.zeros((ALTURA, nw, 4), np.uint8)
for j in range(ALTURA):
    ya, yb = int(j * tam), int((j + 1) * tam)
    for i in range(nw):
        xa, xb = int(i * tam), int((i + 1) * tam)
        m = mas[ya:yb, xa:xb]
        if m.mean() < 0.5:
            continue
        px = fig[ya:yb, xa:xb][m]
        lz = luz[ya:yb, xa:xb][m]
        corte = np.median(lz)
        escuros = lz < min(corte * 0.62, 90)
        cor = np.median(px[escuros], axis=0) if escuros.mean() >= 0.22 else np.median(px, axis=0)
        saida[j, i, :3], saida[j, i, 3] = cor, 255

idx_img = Image.fromarray(saida[..., :3]).quantize(CORES, method=Image.MEDIANCUT, dither=Image.NONE)
idx = np.asarray(idx_img).astype(np.int16).copy()
idx[saida[..., 3] == 0] = -1
pal = np.array(idx_img.getpalette()[: CORES * 3]).reshape(-1, 3).astype(np.uint8)
lum = pal @ np.array([0.3, 0.59, 0.11])

# limpeza: pixel claro solto no meio de outra cor assume a cor vizinha; traço escuro é preservado
Y_ROSTO = ALTURA // 7
for _ in range(2):
    novo = idx.copy()
    for j in range(1, ALTURA - 1):
        for i in range(1, nw - 1):
            c = idx[j, i]
            if c < 0:
                continue
            viz = np.r_[idx[j - 1, i], idx[j + 1, i], idx[j, i - 1], idx[j, i + 1]]
            if (viz == c).any():
                continue
            v = viz[viz >= 0]
            if len(v) and (lum[c] > 70 or lum[np.bincount(v).argmax()] < 70):
                novo[j, i] = np.bincount(v).argmax()
    idx = novo

final = np.zeros((ALTURA, nw, 4), np.uint8)
final[idx >= 0, :3] = pal[idx[idx >= 0]]
final[idx >= 0, 3] = 255

# violeta dos olhos, recuperado da imagem original
VIOLETA, VIOLETA_ESC = (154, 127, 214), (98, 76, 170)
for j in range(Y_ROSTO):
    ya, yb = int(j * tam), int((j + 1) * tam)
    for i in range(nw):
        xa, xb = int(i * tam), int((i + 1) * tam)
        if final[j, i, 3] == 0:
            continue
        bl = fig[ya:yb, xa:xb].reshape(-1, 3)
        vio = (bl[:, 2] > bl[:, 1] + 22) & (bl[:, 0] > bl[:, 1] + 4) & (bl[:, 2] > 95) & (bl[:, 0] > 70)
        if vio.mean() >= 0.3:
            final[j, i, :3] = VIOLETA if bl[vio].mean() > 125 else VIOLETA_ESC

if ROSTO:
    for cor, pontos in json.loads((AQUI / ROSTO).read_text(encoding="utf-8")).items():
        rgb = tuple(int(cor[k:k + 2], 16) for k in (1, 3, 5))
        for x, y in pontos:
            final[y, x, :3] = rgb
            final[y, x, 3] = 255

q = Image.fromarray(final, "RGBA")
q.save(ART / SAIDA)
print(SAIDA, q.size)

ref = []
for n in ("03", "06", "09", "11"):
    f = Image.open(P4AU / f"p4au-{n}.png").convert("RGBA")
    b2 = np.asarray(f).copy()
    if b2[0, 0, 3] > 0:
        b2[..., 3] = np.where(np.abs(b2[..., :3].astype(np.int16) - b2[0, 0, :3].astype(np.int16)).sum(2) < 12, 0, b2[..., 3])
    f = Image.fromarray(b2, "RGBA")
    ref.append(f.crop(f.getbbox()))
todos = [q] + ref
L, A = sum(t.width for t in todos) + 12 * (len(todos) + 1), max(t.height for t in todos) + 24
p = Image.new("RGB", (L * ZOOM, A * ZOOM), (28, 22, 38))
x = 12
for t in todos:
    z = t.resize((t.width * ZOOM, t.height * ZOOM), Image.NEAREST)
    p.paste(z, (x * ZOOM, (A - 12 - t.height) * ZOOM), z)
    x += t.width + 12
p.save(AQUI.parent / "melissa-pixel-vs-p4au.png")

# zoom da cabeça com réguas a cada 10 pixels, para colocar pixels à mão
xa, xb = 40, nw - 40
c = q.crop((xa, 0, xb, Y_ROSTO + 6))
f = Image.new("RGB", c.size, (28, 22, 38))
f.paste(c, (0, 0), c)
Z = 8
g2 = f.resize((c.width * Z, c.height * Z), Image.NEAREST)
g2.save(AQUI.parent / "melissa-pixel-rosto.png")
from PIL import ImageDraw
d = ImageDraw.Draw(g2)
for xx in range((xa // 10 + 1) * 10, xb, 10):
    d.line([((xx - xa) * Z, 0), ((xx - xa) * Z, g2.height)], fill=(0, 255, 0))
    d.text(((xx - xa) * Z + 2, 2), str(xx), fill=(255, 255, 0))
for yy in range(0, c.height, 10):
    d.line([(0, yy * Z), (g2.width, yy * Z)], fill=(0, 255, 0))
    d.text((2, yy * Z + 2), str(yy), fill=(255, 255, 0))
g2.save(Path(sys.argv[1]).parent / "rosto-regua.png")
print("regua em", Path(sys.argv[1]).parent / "rosto-regua.png")
