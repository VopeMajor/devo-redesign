"""Moedas e fragmentos: recorta a folha em grade de 48x48, com um pixel de tamanho único e fundo transparente.
Uso: python moedas_px.py (na pasta art-src)"""
from pathlib import Path
import numpy as np
from PIL import Image

AQUI = Path(__file__).parent
SAI = AQUI.parent / "art" / "os" / "poco"
NOMES = ["dracma-comum", "dracma-incomum", "dracma-rara", "fragmento", "grande-fragmento"]
folha = np.array(Image.open(AQUI / "moedas-fragmentos.png").convert("RGB")).astype(float)
H, W = folha.shape[:2]
for n, nome in enumerate(NOMES):
    cel = folha[(n // 3) * H // 2:(n // 3 + 1) * H // 2, (n % 3) * W // 3:(n % 3 + 1) * W // 3]
    verde = (cel[..., 1] - np.maximum(cel[..., 0], cel[..., 2])) > 50
    ys, xs = np.where(~verde)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    lado = max(y1 - y0, x1 - x0)
    # janela quadrada centrada no desenho
    cy, cx = (y0 + y1) // 2, (x0 + x1) // 2
    py, px = max(0, cy - lado // 2), max(0, cx - lado // 2)
    q = cel[py:py + lado, px:px + lado]
    m = verde[py:py + lado, px:px + lado]
    # a beirada não herda o verde do fundo: o verde vira a média do desenho antes de reduzir
    limpa = q.copy()
    limpa[..., 1] = np.minimum(limpa[..., 1], np.maximum(limpa[..., 0], limpa[..., 2]))
    limpa[m] = limpa[~m].mean(axis=0)
    img = Image.fromarray(limpa.astype("uint8")).resize((48, 48), Image.BOX)
    alfa = Image.fromarray(((~m) * 255).astype("uint8")).resize((48, 48), Image.BOX).point(lambda v: 255 if v > 150 else 0)
    cor = img.quantize(colors=40, method=Image.FASTOCTREE, dither=Image.NONE).convert("RGBA")
    cor.putalpha(alfa)
    cor.save(SAI / f"{nome}.png", optimize=True)
    print(nome, lado)
f = Image.new("RGB", (5 * 192, 192), (20, 28, 33))
for i, nome in enumerate(NOMES):
    p = Image.open(SAI / f"{nome}.png").resize((192, 192), Image.NEAREST)
    f.paste(p, (i * 192, 0), p)
f.save(AQUI.parent / "capturas" / "moedas-prova.png")
