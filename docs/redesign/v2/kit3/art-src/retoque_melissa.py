"""Acabamento feito à mão no sprite de 400 px: largura do cabelo, dobras, laço, mão, rosas e contorno contínuo.
Uso: python -I retoque_melissa.py <pasta com p4au-NN.png>"""
from pathlib import Path
import sys
import numpy as np
from PIL import Image, ImageDraw

AQUI = Path(sys.argv[0]).resolve().parent
P4AU = Path(sys.argv[1])
ARQ = AQUI.parent / "art" / "melissa-pixel-idle.png"
a = np.asarray(Image.open(ARQ).convert("RGBA")).copy()
H, W = a.shape[:2]
lum = lambda v: v[..., :3] @ np.array([0.3, 0.59, 0.11])


def azul(v):
    return (v[..., 2] > 150) & (v[..., 2].astype(int) > v[..., 0].astype(int) + 90)


def creme(v):
    return lum(v) > 190


def poligono(pts):
    im = Image.new("L", (W, H), 0)
    ImageDraw.Draw(im).polygon(pts, fill=255)
    return np.asarray(im) > 0


# dobras largas no azul, em formas de sombra duras
AZUL_SOMBRA = np.array((22, 58, 190))
AZUL_FUNDO = np.array((14, 36, 142))
for pts, cor in [
    ([(38, 80), (48, 80), (42, 150), (30, 150)], AZUL_SOMBRA),
    ([(50, 95), (58, 95), (58, 150), (50, 150)], AZUL_SOMBRA),
    ([(40, 170), (54, 170), (34, 245), (14, 250)], AZUL_SOMBRA),
    ([(58, 178), (68, 178), (58, 250), (44, 252)], AZUL_FUNDO),
    ([(140, 190), (150, 190), (176, 250), (160, 256)], AZUL_SOMBRA),
    ([(122, 182), (130, 182), (150, 262), (138, 262)], AZUL_FUNDO),
]:
    m = poligono(pts) & azul(a) & (a[..., 3] > 0)
    a[m, :3] = cor

# laço: dobras em duas formas de sombra sobre o creme
SOMBRA_CREME = np.array((205, 190, 172))
for pts in [
    ([(70, 150), (80, 148), (82, 225), (72, 222)]),
    ([(62, 125), (78, 136), (72, 146), (58, 138)]),
    ([(86, 128), (98, 122), (100, 134), (88, 142)]),
]:
    m = poligono(pts) & creme(a) & (a[..., 3] > 0)
    a[m, :3] = SOMBRA_CREME

# mão solta: luz de borda onde a luva encosta no fundo
LUZ_LUVA = np.array((138, 133, 146))
caixa = (a[..., 3] > 0) & (lum(a) < 90)
for y in range(186, 222):
    for x in range(10, 42):
        if caixa[y, x] and a[y, x - 1, 3] == 0:
            a[y, x, :3] = LUZ_LUVA
            continue
        if caixa[y, x] and a[y + 1, x, 3] == 0:
            a[y, x, :3] = LUZ_LUVA

# rosas: três tons firmes, sem pontos soltos
TONS = [np.array((16, 44, 160)), np.array((26, 72, 226)), np.array((86, 130, 250))]
for (x0, y0, x1, y1) in [(96, 6, 118, 28)]:
    trecho = a[y0:y1, x0:x1]
    m = azul(trecho) | ((trecho[..., 2] > 90) & (trecho[..., 2].astype(int) > trecho[..., 0].astype(int) + 50))
    m &= trecho[..., 3] > 0
    l = lum(trecho)
    if m.any():
        c1, c2 = np.percentile(l[m], [30, 80])
        idx = np.digitize(l, [c1, c2])
        for j in range(1, y1 - y0 - 1):
            for i in range(1, x1 - x0 - 1):
                if m[j, i]:
                    v = idx[j - 1:j + 2, i - 1:i + 2][m[j - 1:j + 2, i - 1:i + 2]]
                    trecho[j, i, :3] = TONS[np.bincount(v).argmax()]

# cabelo: fecha os vãos entre fios soltos e a massa, usando a cor do vizinho de dentro
for y in range(20, 58):
    xs = np.where(a[y, 35:128, 3] > 0)[0] + 35
    if len(xs) < 8:
        continue
    for x in range(xs[0], xs[-1] + 1):
        if a[y, x, 3] == 0:
            passo = 1 if x < 82 else -1
            k = x
            while a[y, k, 3] == 0:
                k += passo
            a[y, x] = a[y, k]

# cabelo: lateral em curva contínua, sem serrilhado
def alisa(lado, y0, y1):
    ys = list(range(y0, y1))
    ext = []
    for y in ys:
        xs = np.where(a[y, 35:128, 3] > 0)[0] + 35
        ext.append(xs[0] if lado < 0 else xs[-1])
    ext = np.array(ext, float)
    med = np.array([np.median(ext[max(0, i - 5):i + 6]) for i in range(len(ext))])
    liso = np.round(np.convolve(np.pad(med, 4, mode="edge"), np.ones(9) / 9, mode="valid")).astype(int)
    for y, x_novo, x_velho in zip(ys, liso, ext.astype(int)):
        if lado < 0:
            a[y, 35:x_novo, 3] = 0
            for x in range(x_novo, x_velho):
                a[y, x] = a[y, x_velho + 1]
        else:
            a[y, x_novo + 1:128, 3] = 0
            for x in range(x_velho + 1, x_novo + 1):
                a[y, x] = a[y, x_velho - 1]


alisa(-1, 24, 56)
alisa(1, 26, 47)

# lateral do cabelo desenhada à mão: curva fechada com contorno escuro contínuo
CABELO, LINHA_C = np.array((251, 233, 218)), np.array((42, 28, 46))
ESQ = [(24, 54), (28, 51), (32, 48), (36, 46), (40, 45), (44, 44), (48, 45), (52, 46), (56, 49)]
DIR = [(26, 112), (30, 115), (34, 117), (38, 118), (42, 118), (46, 117)]


def curva(pontos):
    ys, xs = zip(*pontos)
    return {y: int(round(np.interp(y, ys, xs))) for y in range(ys[0], ys[-1] + 1)}


for y, x_b in curva(ESQ).items():
    a[y, 35:x_b, 3] = 0
    for x in range(x_b, x_b + 7):
        if y < 49 and (a[y, x, 3] == 0 or lum(a[y, x]) < 110):
            a[y, x, :3], a[y, x, 3] = CABELO, 255
    a[y, x_b, :3], a[y, x_b, 3] = LINHA_C, 255
for y, x_b in curva(DIR).items():
    a[y, x_b + 1:128, 3] = 0
    for x in range(x_b - 6, x_b + 1):
        if y < 41 and (a[y, x, 3] == 0 or lum(a[y, x]) < 110):
            a[y, x, :3], a[y, x, 3] = CABELO, 255
    a[y, x_b, :3], a[y, x_b, 3] = LINHA_C, 255

# parte preta de baixo do cabelo: filtro de maioria só nessa faixa, para virar mechas limpas em um preto só
PRETO_C = np.array((30, 22, 34))
for (x0, y0, x1, y1) in [(50, 47, 83, 62), (93, 41, 120, 58)]:
    for _ in range(2):
        escuro = (a[..., 3] > 0) & (lum(a) < 85)
        novo = a.copy()
        for y in range(y0, y1):
            for x in range(x0, x1):
                if a[y, x, 3] == 0:
                    continue
                n = escuro[y - 2:y + 3, x - 2:x + 3].sum()
                v = a[y, x, :3].astype(int)
                cabelo = lum(a[y, x]) > 200 and v[0] - v[2] < 38
                if escuro[y, x] and n >= 9:
                    novo[y, x, :3] = PRETO_C
                elif escuro[y, x] and n <= 6:
                    novo[y, x, :3] = CABELO
                elif cabelo and n >= 17:
                    novo[y, x, :3] = PRETO_C
        a = novo

# tira pixels totalmente soltos e fecha o contorno da figura com uma versão escura de cada cor
op = a[..., 3] > 0
viz = sum(np.roll(np.roll(op, dy, 0), dx, 1) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dy or dx)
a[..., 3][op & (viz <= 1)] = 0
op = a[..., 3] > 0
borda = op & ~(np.roll(op, 1, 0) & np.roll(op, -1, 0) & np.roll(op, 1, 1) & np.roll(op, -1, 1))
protege = np.zeros_like(borda)
protege[186:222, 10:42] = True  # a luz de borda da mão fica
m = borda & ~protege
a[m, :3] = (a[m, :3] * 0.32 + np.array((14, 8, 22)) * 0.5).astype(np.uint8)

# mãos: o bege vindo da redução de cores volta a ser cinza; cada dedo ganha borda de luz; a pasta ganha borda clara
BORDA_PASTA = np.array((169, 178, 194))
CINZA_LUVA = np.array((122, 117, 130))
for (x0, y0, x1, y1) in [(14, 186, 40, 216), (106, 100, 142, 128)]:
    for y in range(y0, y1):
        for x in range(x0, x1):
            if a[y, x, 3] == 0:
                continue
            v = a[y, x, :3].astype(int)
            l = v @ np.array([0.3, 0.59, 0.11])
            if 120 < l < 195 and v[0] - v[2] > 12:
                a[y, x, :3] = CINZA_LUVA
    dedo = (a[..., 3] > 0) & (lum(a) > 45) & (lum(a) < 80) & (a[..., 0].astype(int) >= a[..., 2].astype(int) - 2)
    for y in range(y0, y1):
        for x in range(x0 + 1, x1):
            if dedo[y, x] and a[y, x - 1, 3] > 0 and lum(a[y, x - 1]) < 30:
                a[y, x, :3] = CINZA_LUVA

v = a[..., :3].astype(int)
l = lum(a)
pasta = (a[..., 3] > 0) & (l > 60) & (l < 105) & (v[..., 2] > v[..., 0] + 6) & (v[..., 2] < v[..., 0] + 40)
for y in range(86, 136):
    for x in range(108, 150):
        if pasta[y, x] and any(a[y + dy, x + dx, 3] > 0 and l[y + dy, x + dx] < 45 for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            a[y, x, :3] = BORDA_PASTA

q = Image.fromarray(a, "RGBA")
q.save(ARQ)
print(ARQ.name, q.size)

ZOOM = 2
ref = []
for n in ("03", "06", "09", "11"):
    f = Image.open(P4AU / f"p4au-{n}.png").convert("RGBA")
    b2 = np.asarray(f).copy()
    if b2[0, 0, 3] > 0:
        b2[..., 3] = np.where(np.abs(b2[..., :3].astype(np.int16) - b2[0, 0, :3].astype(np.int16)).sum(2) < 12, 0, b2[..., 3])
    f = Image.fromarray(b2, "RGBA")
    ref.append(f.crop(f.getbbox()))
todos = [q] + ref
L, A = sum(t.width for t in todos) + 12 * (len(todos) + 1), max(t.height for t in todos) + 24
p = Image.new("RGB", (L * ZOOM, A * ZOOM), (28, 22, 38))
x = 12
for t in todos:
    z = t.resize((t.width * ZOOM, t.height * ZOOM), Image.NEAREST)
    p.paste(z, (x * ZOOM, (A - 12 - t.height) * ZOOM), z)
    x += t.width + 12
p.save(AQUI.parent / "melissa-pixel-vs-p4au.png")
c = q.crop((40, 0, W - 40, 63))
f = Image.new("RGB", c.size, (28, 22, 38))
f.paste(c, (0, 0), c)
f.resize((c.width * 8, c.height * 8), Image.NEAREST).save(AQUI.parent / "melissa-pixel-rosto.png")
f2 = Image.new("RGB", (W, H), (28, 22, 38))
f2.paste(q, (0, 0), q)
f2.resize((W * 3, H * 3), Image.NEAREST).save(P4AU.parent / "melissa-3x.png")
