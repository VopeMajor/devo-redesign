"""Prancha: as três opções da Melissa ao lado do elenco atual, no mesmo tamanho de rosto."""
from pathlib import Path
import sys
from PIL import Image, ImageDraw, ImageFont

AQUI = Path(sys.argv[0]).resolve().parent
NPC = AQUI.parents[4] / "public" / "images" / "npc"
FUNDO, TINTA = (214, 210, 206), (30, 24, 40)
fonte = ImageFont.truetype("arialbd.ttf", 26)

ELENCO = [("Coruja", "coruja/neutro"), ("Herdeiro", "herdeiro/neutro"), ("Galo", "galo/neutro"), ("Rato", "rato/sorriso"), ("Javali", "javali/neutro"), ("Melissa atual", "melissa/sorriso")]
OPCOES = [("A · Oficial", "melissa-a-oficial.png"), ("B · Recepcionista", "melissa-b-recepcionista.png"), ("C · Projeção", "melissa-c-projecao.png")]

L, A = 2100, 1420
p = Image.new("RGB", (L, A), FUNDO)
d = ImageDraw.Draw(p)
w = L // len(ELENCO)
for i, (nome, c) in enumerate(ELENCO):
    im = Image.open(NPC / f"{c}.webp").convert("RGBA")
    im = im.crop(im.getbbox())
    e = min((w - 20) / im.width, 330 / im.height)
    im = im.resize((int(im.width * e), int(im.height * e)), Image.LANCZOS)
    p.paste(im, (i * w + (w - im.width) // 2, 50 + 330 - im.height), im)
    d.text((i * w + 12, 8), nome, fill=TINTA, font=fonte)

w = L // 3
for i, (nome, f) in enumerate(OPCOES):
    im = Image.open(AQUI / f).convert("RGB")
    im = im.resize((w - 16, int(im.height * (w - 16) / im.width)), Image.LANCZOS)
    p.paste(im, (i * w + 8, 440))
    d.text((i * w + 14, 402), nome, fill=TINTA, font=fonte)
# silhuetas em preto: o teste de leitura em uma olhada
y = 900
for i, (nome, f) in enumerate(OPCOES):
    im = Image.open(AQUI / f).convert("RGB")
    corpo = im.crop((950, 0, 1336, 1024))
    corpo = corpo.resize((int(corpo.width * 500 / corpo.height), 500), Image.LANCZOS)
    claro = corpo.convert("L").point(lambda v: 0 if v < 178 else 255)
    p.paste(claro.convert("RGB"), (i * w + 40, y))
    p.paste(corpo, (i * w + 40 + corpo.width + 20, y))
p.save(AQUI.parent / "melissa-opcoes.png")
