"""Propostas de interface: recorta o mostrador e as cartas, e faz os emblemas e o fundo em pixel da proposta B.
Uso: python os2_recorta.py (na pasta art-src)"""
from pathlib import Path
import numpy as np
from PIL import Image

AQUI = Path(__file__).parent
SAI = AQUI.parent / "art" / "os"
HOME = AQUI.parent / "art" / "home"
(SAI / "px").mkdir(parents=True, exist_ok=True)


def recorta(nome):
    im = np.array(Image.open(AQUI / nome).convert("RGB")).astype(float)
    verde = np.clip((im[..., 1] - np.maximum(im[..., 0], im[..., 2])) / 70, 0, 1)
    sem = im.copy()
    sem[..., 1] = np.minimum(im[..., 1], np.maximum(im[..., 0], im[..., 2]))
    p = Image.fromarray(np.dstack([sem, (1 - verde) * 255]).astype("uint8"))
    return p.crop(p.getbbox())


m = recorta("os-mostrador.png")
print("mostrador", m.size)
m.resize((840, 840), Image.LANCZOS).save(SAI / "mostrador.webp", quality=86, method=6)
for nome, saida in (("os-carta.png", "carta"), ("os-verso.png", "verso")):
    c = recorta(nome)
    print(saida, c.size)
    c.resize((560, 840), Image.LANCZOS).save(SAI / f"{saida}.webp", quality=86, method=6)

# proposta B: tudo reduzido à paleta, sem suavizar
PALETA = np.array([[11, 8, 18], [42, 20, 80], [74, 42, 134], [164, 92, 255], [207, 169, 255], [241, 236, 224]], dtype=float)


def na_paleta(rgb):
    d = ((rgb[..., None, :] - PALETA) ** 2).sum(axis=-1)
    return PALETA[d.argmin(axis=-1)]


for f in HOME.glob("emblema-*.webp"):
    e = Image.open(f).convert("RGBA")
    e.thumbnail((44, 44), Image.LANCZOS)
    a = np.array(e).astype(float)
    cor = na_paleta(a[..., :3])
    alfa = (a[..., 3] > 110) * 255
    Image.fromarray(np.dstack([cor, alfa]).astype("uint8")).save(SAI / "px" / f"{f.stem.replace('emblema-', '')}.png")

f = Image.open(AQUI / "home-fundo.png").convert("L").resize((260, 390), Image.LANCZOS)
v = np.array(f).astype(float)[..., None] / 255
escuro = np.array([11, 8, 18]) * (1 - v) + np.array([74, 42, 134]) * v
Image.fromarray(na_paleta(escuro).astype("uint8")).save(SAI / "fundo-pixel.png", optimize=True)
print("ok")
