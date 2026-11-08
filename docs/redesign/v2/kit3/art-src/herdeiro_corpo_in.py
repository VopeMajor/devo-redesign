"""Herdeiro de corpo: prepara cada sprite do jogo no alto de uma tela verde, para o desenho continuar até o quadril.
Uso: python herdeiro_corpo_in.py (na pasta art-src)"""
from pathlib import Path
from PIL import Image

AQUI = Path(__file__).parent
RAIZ = AQUI.parents[4]
SAI = AQUI / "herdeiro-corpo"
SAI.mkdir(exist_ok=True)
POSES = ["neutro", "surpreso", "desdem", "entediado", "malicia", "confiante", "sorriso", "riso", "trama"]
# a base do sprite do jogo se dissolve em degradê nos últimos 80 pixels: o corte fica acima dele
CORTE = 620
for p in POSES:
    im = Image.open(RAIZ / "public" / "images" / "npc" / "herdeiro" / f"{p}.webp").convert("RGBA")
    im = im.crop((0, 0, 1080, CORTE))
    t = Image.new("RGB", (1024, 1536), (0, 255, 0))
    t.paste(im, (-28, -130), im)
    t.save(SAI / f"in-{p}.png")
print("ok")
