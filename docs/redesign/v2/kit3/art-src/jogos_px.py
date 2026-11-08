"""Sala de Jogos: cenários, capas e o Javali em pixel. O corte da mesa fica numa imagem só dela, para o Javali passar por trás.
Uso: python jogos_px.py (na pasta art-src)"""
from pathlib import Path
from PIL import Image

AQUI = Path(__file__).parent
RAIZ = AQUI.parents[4]
SAI = AQUI.parent / "art" / "os" / "jogos"
SAI.mkdir(parents=True, exist_ok=True)
NPC = AQUI.parent / "art" / "os" / "npc"
TAMPO = 96  # linha em que começa o tampo da mesa, na grade de 216x144
for nome, sai in (("jogos-sala", "sala"), ("jogos-mesa", "mesa"), ("capa-memory", "capa-memory"), ("capa-chess", "capa-chess"), ("capa-bomb", "capa-bomb"), ("capa-blefe", "capa-blefe")):
    im = Image.open(AQUI / f"{nome}.png").convert("RGB")
    w, h = im.size
    alto = min(h, w * 2 // 3)
    larg = alto * 3 // 2
    x, y = (w - larg) // 2, (h - alto) // 2
    q = im.crop((x, y, x + larg, y + alto)).resize((216, 144), Image.BOX).quantize(colors=48, method=Image.FASTOCTREE, dither=Image.NONE)
    q.save(SAI / f"{sai}.png", optimize=True)
    if sai == "mesa":
        f = q.convert("RGBA")
        f.putalpha(Image.new("L", f.size, 0))
        f.paste(q.convert("RGBA").crop((0, TAMPO, 216, 144)), (0, TAMPO))
        f.save(SAI / "mesa-frente.png", optimize=True)
# o Javali: os sprites do jogo reduzidos, com uma paleta só
POSES = ["convite", "trama", "explica", "sombrio", "neutro", "riso", "desdem", "pensativo"]
base = Image.open(RAIZ / "public" / "images" / "npc" / "javali" / "neutro.webp").convert("RGBA")
pal = base.resize((216, 192), Image.BOX).convert("RGB").quantize(colors=32, method=Image.FASTOCTREE, dither=Image.NONE)
for p in POSES:
    im = Image.open(RAIZ / "public" / "images" / "npc" / "javali" / f"{p}.webp").convert("RGBA").resize((216, 192), Image.BOX)
    c = im.convert("RGB").quantize(palette=pal, dither=Image.NONE).convert("RGBA")
    c.putalpha(im.getchannel("A").point(lambda v: 255 if v > 128 else 0))
    c.save(NPC / f"javali-{p}.png", optimize=True)
r = base.crop((345, 150, 785, 590)).resize((64, 64), Image.BOX)
c = r.convert("RGB").quantize(colors=20, method=Image.FASTOCTREE, dither=Image.NONE).convert("RGBA")
c.putalpha(r.getchannel("A").point(lambda v: 255 if v > 110 else 0))
c.save(NPC / "javali-rosto.png", optimize=True)
print("ok")
