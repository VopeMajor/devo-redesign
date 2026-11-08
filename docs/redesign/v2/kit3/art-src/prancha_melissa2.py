"""Prancha da rodada doce: elenco, as três opções, silhueta da figura inteira e prova em tamanho de sprite."""
from pathlib import Path
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

AQUI = Path(sys.argv[0]).resolve().parent
NPC = AQUI.parents[4] / "public" / "images" / "npc"
FUNDO, TINTA = (214, 210, 206), (30, 24, 40)
fonte = ImageFont.truetype("arialbd.ttf", 26)

ELENCO = [("Coruja", "coruja/neutro"), ("Herdeiro", "herdeiro/neutro"), ("Galo", "galo/neutro"), ("Rato", "rato/sorriso"), ("Javali", "javali/neutro")]
OPCOES = [("G · Sino", "melissa-roupa-g-sino.png"), ("H · Concierge", "melissa-roupa-h-concierge.png"), ("I · Lacaia", "melissa-roupa-i-lacaia.png")]

L, A = 2100, 1500
p = Image.new("RGB", (L, A), FUNDO)
d = ImageDraw.Draw(p)
w = L // len(ELENCO)
for i, (nome, c) in enumerate(ELENCO):
    im = Image.open(NPC / f"{c}.webp").convert("RGBA")
    im = im.crop(im.getbbox())
    e = min((w - 20) / im.width, 280 / im.height)
    im = im.resize((int(im.width * e), int(im.height * e)), Image.LANCZOS)
    p.paste(im, (i * w + (w - im.width) // 2, 40 + 280 - im.height), im)
    d.text((i * w + 12, 6), nome, fill=TINTA, font=fonte)

w = L // 3
for i, (nome, f) in enumerate(OPCOES):
    im = Image.open(AQUI / f).convert("RGB")
    fig = im.resize((w - 16, int(im.height * (w - 16) / im.width)), Image.LANCZOS)
    p.paste(fig, (i * w + 8, 370))
    d.text((i * w + 14, 334), nome, fill=TINTA, font=fonte)

    # só a figura de corpo inteiro, recortada do fundo cinza
    a = np.asarray(im).astype(np.int16)
    corpo = a[:, 880:]
    base = np.median(corpo[:40, :40].reshape(-1, 3), axis=0)
    masc = np.abs(corpo - base).sum(2) > 34
    linhas = np.where(masc.sum(1) > 0)[0]
    cols = np.where(masc.sum(0) > 0)[0]
    y0, y1, x0, x1 = linhas[0], linhas[-1] + 1, cols[0], cols[-1] + 1
    rgba = np.dstack([corpo[y0:y1, x0:x1], masc[y0:y1, x0:x1] * 255]).astype(np.uint8)
    figura = Image.fromarray(rgba, "RGBA")

    y = 850
    x = i * w + 14
    # silhueta com a figura inteira preenchida
    alt = 420
    s = figura.resize((int(figura.width * alt / figura.height), alt), Image.LANCZOS)
    a2 = np.asarray(s).copy()
    a2[..., :3] = 0
    s2 = Image.fromarray(a2, "RGBA")
    p.paste(s2, (x, y), s2)
    x += s.width + 16
    # tamanho P4AU: 230 px de altura, mostrado 2x sem suavizar
    r = figura.resize((int(figura.width * 230 / figura.height), 230), Image.BOX).convert("RGBA")
    r = r.convert("RGB").quantize(40, method=Image.MEDIANCUT, dither=Image.NONE).convert("RGBA")
    r.putalpha(figura.resize(r.size, Image.BOX).getchannel("A").point(lambda v: 255 if v > 128 else 0))
    r2 = r.resize((r.width * 2, r.height * 2), Image.NEAREST)
    p.paste(r2, (x, y), r2)
    x += r2.width + 16
    # rosto no tamanho de chibi
    d.text((i * w + 14, 1290), "silhueta · prova 230 px", fill=TINTA, font=fonte)
    h = figura.resize((int(figura.width * 72 / figura.height), 72), Image.BOX)
    h3 = h.resize((h.width * 3, h.height * 3), Image.NEAREST)
    p.paste(h3, (i * w + 14, 1330 - 0) if False else (x, y), h3)
p.save(AQUI.parent / "melissa-roupas.png")
