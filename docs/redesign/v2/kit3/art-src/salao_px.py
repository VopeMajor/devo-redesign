"""Salão: cenários em pixel, numa grade de 216x144 com um pixel de tamanho único.
Uso: python salao_px.py (na pasta art-src)"""
from pathlib import Path
from PIL import Image

AQUI = Path(__file__).parent
SAI = AQUI.parent / "art" / "os" / "salao"
SAI.mkdir(parents=True, exist_ok=True)
for nome in ("fechado", "aberto", "camarote"):
    im = Image.open(AQUI / f"salao-{nome}.png").convert("RGB")
    w, h = im.size
    alto = min(h, w * 2 // 3)
    larg = alto * 3 // 2
    x, y = (w - larg) // 2, (h - alto) // 2
    q = im.crop((x, y, x + larg, y + alto)).resize((216, 144), Image.BOX)
    q.quantize(colors=48, method=Image.FASTOCTREE, dither=Image.NONE).save(SAI / f"{nome}.png", optimize=True)
    print(nome, im.size)
