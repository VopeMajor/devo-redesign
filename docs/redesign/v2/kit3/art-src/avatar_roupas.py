"""Recorta as roupas das folhas-molde e veste o avatar: corpo, roupa, rosto e cabelo, nos dois corpos.
Uso: python -I avatar_roupas.py"""
from pathlib import Path
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

AQUI = Path(sys.argv[0]).resolve().parent
SAI = AQUI.parent / "art" / "avatar"
L = 512
sys.argv = [str(AQUI / "avatar_monta.py")]
ns = {"__file__": sys.argv[0]}
fonte = (AQUI / "avatar_monta.py").read_text(encoding="utf-8").split("# Penteados: rosto fixo")[0]
exec(compile(fonte, "avatar_monta", "exec"), ns)  # reaproveita as peças e a pintura; refaz as peças recortadas
monta = ns["monta"]
corpos = {"f": ns["f"], "m": ns["mas"]}


def topo_magenta(a, x0, y0, y1):
    """Topo e centro da cabeça magenta numa coluna de células, para alinhar pelo molde."""
    c = a[y0:y1, x0:x0 + L]
    m = (np.minimum(c[..., 0], c[..., 2]) - c[..., 1]) > 80
    ys = np.where(m.sum(1) > 10)[0]
    # sobras do fim da fileira de cima são trechos curtos; a cabeça é o trecho longo
    trechos = [t for t in np.split(ys, np.where(np.diff(ys) > 1)[0] + 1) if len(t) > 100]
    topo = trechos[0][0]
    xs = np.where(m[topo:topo + 120].sum(0) > 0)[0]
    return y0 + topo, x0 + (xs[0] + xs[-1]) // 2


def recorta(nome, sufixo):
    a = np.asarray(Image.open(AQUI / nome).convert("RGB")).astype(int)
    molde = np.asarray(Image.open(AQUI / ("avatar-molde-m.png" if sufixo == "m" else "avatar-molde.png")).convert("RGB")).astype(int)
    pecas = []
    for k in range(6):
        lin, col = k // 3, k % 3
        ym, xm = topo_magenta(molde, col * L, lin * L, (lin + 1) * L)
        y, x = topo_magenta(a, col * L, max(0, lin * L - 60), (lin + 1) * L)
        dy, dx = y - ym, x - xm
        print(sufixo, k + 1, "desvio", dx, dy)
        # a peça é lida na posição deslocada; o que faltar embaixo fica verde (transparente)
        c = np.zeros((L, L, 3), int)
        c[...] = (0, 255, 0)
        y0, x0 = lin * L + dy, col * L + dx
        ya, yb = max(0, y0), min(a.shape[0], y0 + L)
        xa, xb = max(0, x0), min(a.shape[1], x0 + L)
        c[ya - y0:yb - y0, xa - x0:xb - x0] = a[ya:yb, xa:xb]
        r, g, b = c[..., 0], c[..., 1], c[..., 2]
        verde = g - np.maximum(r, b)
        magenta = np.minimum(r, b) - g
        alfa = np.clip(1 - (np.maximum(verde, magenta) - 30) / 70, 0, 1)
        # só existe roupa abaixo da cabeça
        alfa[:120] = 0
        cor = np.dstack([r, np.minimum(g, np.maximum(r, b)), b]).astype(float)
        cor[..., 1] = np.where(magenta > 10, np.minimum(cor[..., 1], np.minimum(r, b)), cor[..., 1])
        p = Image.fromarray(np.dstack([cor, alfa * 255]).astype(np.uint8), "RGBA")
        p.save(SAI / f"roupa-{k + 1}-{sufixo}.png")
        pecas.append(p)
    return pecas


ROUPAS = {"f": recorta("avatar-roupas-f.png", "f"), "m": recorta("avatar-roupas-m.png", "m")}
NOMES = ["Casaco do Record", "Dândi", "Paróquia", "Turno da noite", "Enlutado", "Andarilho"]
# (pele, rosto, cabelo, cor do cabelo, íris), só para mostrar as combinações
AMOSTRAS = [(0, 6, 9, 6, 0), (3, 8, 2, 2, 3), (1, 16, 0, 6, 1), (4, 13, 15, 2, 5), (5, 12, 13, 5, 4), (2, 7, 12, 3, 2)]
C = 300
p = Image.new("RGB", (C * 6, C * 2 + 34), (42, 34, 54))
d = ImageDraw.Draw(p)
f_ = ImageFont.truetype("arialbd.ttf", 20)
for k, nome in enumerate(NOMES):
    d.text((k * C + 8, 6), f"{k + 1} {nome}", fill=(255, 240, 150), font=f_)
    for lin, ch in enumerate("fm"):
        pl, ro, ca, co, ir = AMOSTRAS[(k + lin * 2) % 6]
        comp = ns["pele"](corpos[ch], *ns["PELES"][pl])
        comp.alpha_composite(ROUPAS[ch][k])
        cc = ns["CABELOS"][co]
        claro = ns["PELES"][pl][0]
        labio = (max(70, claro[0] - 70), max(40, claro[1] - 90), max(40, claro[2] - 80))
        comp.alpha_composite(ns["rosto"](ns["ROS"][ro], *ns["IRIS"][ir], cc[0], labio))
        comp.alpha_composite(ns["cabelo"](ns["CAB"][ca], *cc))
        t = comp.resize((C, C), Image.BOX)
        p.paste(t, (k * C, 34 + lin * C), t)
p.save(AQUI.parent / "avatar-catalogo-roupas.png")
print(p.size)
