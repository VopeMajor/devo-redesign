"""Calendário: leva as cenas de evento para uma grade de 176x88 de verdade, com um pixel de tamanho único.
Uso: python eventos_px.py (na pasta art-src)"""
from pathlib import Path
from PIL import Image

AQUI = Path(__file__).parent
SAI = AQUI.parent / "art" / "os" / "eventos"
SAI.mkdir(parents=True, exist_ok=True)
for nome in ("natal", "halloween", "carnaval", "junina"):
    im = Image.open(AQUI / f"evento-{nome}.png").convert("RGB")
    w, h = im.size
    # corta para 2:1 pelo centro, sem esticar
    alto = min(h, w // 2)
    larg = alto * 2
    x, y = (w - larg) // 2, (h - alto) // 2
    q = im.crop((x, y, x + larg, y + alto)).resize((176, 88), Image.BOX)
    q.quantize(colors=32, method=Image.MEDIANCUT, dither=Image.NONE).save(SAI / f"{nome}.png", optimize=True)
    print(nome, im.size)
