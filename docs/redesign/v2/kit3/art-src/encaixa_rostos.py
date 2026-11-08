"""Recorta as 12 cabeças e encaixa sobre o corpo aprovado em meio tamanho, para testar a junção.
Uso: python -I encaixa_rostos.py"""
from pathlib import Path
import json
import sys
import numpy as np
from PIL import Image

AQUI = Path(sys.argv[0]).resolve().parent
ART = AQUI.parent / "art"
NOMES = ["convite", "explica", "riso", "preocupado", "pensativo", "timido", "confiante", "surpreso", "animado", "apresenta", "triste", "sorriso"]

a = np.asarray(Image.open(AQUI / "melissa-rostos12.png").convert("RGB")).astype(np.float32)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
al = np.clip(1 - ((g - np.maximum(r, b)) - 25) / 70, 0, 1)
fol = Image.fromarray(np.dstack([r, np.minimum(g, np.maximum(r, b)), b, al * 255]).astype(np.uint8), "RGBA")
W, H = fol.size
cw, ch = W / 4, H / 3

corpo = Image.open(ART / "melissa-2-meio.png").convert("RGBA")
# largura da cabeça no corpo, medida na linha do cabelo acima do ombro
ca = np.asarray(corpo)[..., 3] > 0
xs = np.where(ca[:92].sum(0) > 0)[0]
yc0 = np.where(ca.sum(1) > 0)[0][0]
larg_corpo = xs[-1] - xs[0] + 1
cx_corpo = (xs[0] + xs[-1]) / 2

saida = ART / "melissa-rostos"
saida.mkdir(exist_ok=True)
pos = {}
resultado = {}
for i, nome in enumerate(NOMES):
    x0, y0 = int((i % 4) * cw), int((i // 4) * ch)
    cel = fol.crop((x0, y0, int(x0 + cw), int(y0 + ch)))
    m = np.asarray(cel)[..., 3] > 128
    ys = np.where(m.sum(1) > 0)[0]
    topo = ys[0]
    corte = topo + int((ys[-1] - topo) * 0.74)
    xs2 = np.where(m[:corte].sum(0) > 0)[0]
    cab = cel.crop((xs2[0], topo, xs2[-1] + 1, corte))
    e = larg_corpo / cab.width
    cab = cab.resize((larg_corpo, round(cab.height * e)), Image.BOX)
    arr = np.asarray(cab).copy()
    arr[..., 3] = np.where(arr[..., 3] >= 128, 255, 0)
    cab = Image.fromarray(arr, "RGBA")
    cab.save(saida / f"{nome}.png")
    pos[nome] = [int(xs[0]), int(yc0)]
    fig = corpo.copy()
    fig.paste(cab, (int(xs[0]), int(yc0)), cab)
    resultado[nome] = fig
(saida / "manifest.json").write_text(json.dumps(pos), encoding="utf-8")

cols, linhas = 6, 2
w, h = corpo.size
p = Image.new("RGB", (cols * (w // 2 + 40), linhas * (h // 2 + 30)), (28, 22, 38))
for i, nome in enumerate(NOMES):
    t = resultado[nome].resize((w // 2, h // 2), Image.BOX)
    p.paste(t, ((i % cols) * (w // 2 + 40) + 20, (i // cols) * (h // 2 + 30) + 15), t)
p.save(AQUI.parent / "melissa-12-no-corpo.png")
grande = Image.new("RGB", (w * 3 + 80, h + 40), (28, 22, 38))
for k, nome in enumerate(("convite", "riso", "preocupado")):
    grande.paste(resultado[nome], (20 + k * (w + 20), 20), resultado[nome])
grande.save(AQUI.parent / "melissa-encaixe-grande.png")
print(larg_corpo, p.size)
