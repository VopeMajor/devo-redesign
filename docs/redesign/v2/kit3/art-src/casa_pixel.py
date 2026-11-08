"""Reduz os cômodos para pixels reais (2x2 vira 1). Os três estados do térreo saem de uma só imagem:
só o portão e a área da oficina mudam, para o cenário não pular quando algo é liberado.
Também iguala o fundo e prepara as miniaturas dos andares.
Uso: python -I casa_pixel.py"""
from pathlib import Path
import sys
from PIL import Image, ImageDraw

AQUI = Path(sys.argv[0]).resolve().parent
SAI = AQUI.parent / "art" / "casa"
SAI.mkdir(exist_ok=True)
FUNDO = (19, 14, 27)  # #130e1b, o mesmo da página

# em coordenadas da arte original, 1536x1024
PORTAO = [(745, 290), (905, 290), (905, 495), (745, 495)]
OFICINA = [(1020, 235), (1130, 235), (1235, 395), (1290, 440), (1385, 530), (1385, 610), (1275, 680), (1165, 735), (960, 680), (890, 540), (1000, 440)]


def abre(nome):
    return Image.open(AQUI / nome).convert("RGB")


def troca(base, outra, *poligonos):
    mascara = Image.new("L", base.size, 0)
    d = ImageDraw.Draw(mascara)
    for p in poligonos:
        d.polygon(p, fill=255)
    r = base.copy()
    r.paste(outra, (0, 0), mascara)
    return r


def grava(im, destino):
    im = im.resize((im.width // 2, im.height // 2), Image.BOX)
    for canto in ((0, 0), (im.width - 1, 0), (0, im.height - 1), (im.width - 1, im.height - 1)):
        ImageDraw.floodfill(im, canto, FUNDO, thresh=22)
    p = im.quantize(128, method=Image.MEDIANCUT, dither=Image.NONE)
    p.save(SAI / destino, optimize=True)
    print(destino, p.size, (SAI / destino).stat().st_size, "fundo", p.convert("RGB").getpixel((2, 2)))


base = abre("terreo-pixel-aberto.png")
grava(troca(base, abre("terreo-pixel-vazio.png"), PORTAO, OFICINA), "terreo-1.png")
grava(troca(base, abre("terreo-pixel-escada.png"), PORTAO), "terreo-2.png")
grava(base, "terreo-3.png")
grava(abre("quarto-pixel.png"), "quarto.png")

corte = abre("casa-corte-v2.png")
for nome, caixa in (("andar-quartos.png", (20, 20, 1010, 700)), ("andar-terreo.png", (20, 640, 1010, 1320))):
    c = corte.crop(caixa)
    c = c.resize((c.width // 3, c.height // 3), Image.BOX).quantize(96, dither=Image.NONE)
    c.save(SAI / nome, optimize=True)
    print(nome, c.size)
