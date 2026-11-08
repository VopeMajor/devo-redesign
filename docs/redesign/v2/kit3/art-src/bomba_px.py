"""Bomba Quente: recorta personagens e objetos em pixel único, desenha o chão da arena com a geometria exata do jogo e reduz a sala.
Uso: python bomba_px.py (na pasta art-src)"""
import math
from pathlib import Path
import numpy as np
from PIL import Image

AQUI = Path(__file__).parent
SAI = AQUI.parent / "art" / "os" / "bomba"
SAI.mkdir(parents=True, exist_ok=True)
CW, CH, PE = 36, 48, 46  # célula dos personagens e linha dos pés (iguais a os-bomba.js)
R, U, K = 9.5, 10.5, 0.72  # raio do jogo, pixels por unidade e achatamento do chão


def mascara(a):
    return (a[..., 1] - np.maximum(a[..., 0], a[..., 2])) > 50


def caixa(m, margem=0):
    ys, xs = np.where(~m)
    if not len(ys):
        return None
    return ys.min(), ys.max() + 1, xs.min(), xs.max() + 1


def reduz(a, m, larg, alt, cores):
    """Reduz por caixa, com alfa duro e paleta curta. O verde vira a cor média do desenho antes de reduzir."""
    q = a.copy()
    q[..., 1] = np.minimum(q[..., 1], np.maximum(q[..., 0], q[..., 2]) + 6)
    q[m] = q[~m].mean(axis=0)
    img = Image.fromarray(q.astype("uint8")).resize((larg, alt), Image.BOX)
    alfa = Image.fromarray(((~m) * 255).astype("uint8")).resize((larg, alt), Image.BOX).point(lambda v: 255 if v > 128 else 0)
    c = img.quantize(colors=cores, method=Image.FASTOCTREE, dither=Image.NONE).convert("RGBA")
    c.putalpha(alfa)
    return c


def contorna(im, cor):
    """Contorno de 1 pixel em volta da figura: separa o personagem do chão em qualquer casa."""
    a = np.array(im)
    o = a[..., 3] > 0
    v = np.zeros_like(o)
    v[1:] |= o[:-1]
    v[:-1] |= o[1:]
    v[:, 1:] |= o[:, :-1]
    v[:, :-1] |= o[:, 1:]
    v &= ~o
    a[v] = (*cor, 255)
    return Image.fromarray(a, "RGBA")


def folha(nome, sai, alvo, cor):
    """Grade de 4x3: mesma escala em todas as células, pés na mesma linha e centrado pela caixa da figura."""
    f = np.array(Image.open(AQUI / f"{nome}.png").convert("RGB")).astype(float)
    H, W = f.shape[:2]
    celulas = [[f[r * H // 3:(r + 1) * H // 3, c * W // 4:(c + 1) * W // 4] for c in range(4)] for r in range(3)]
    caixas = [[caixa(mascara(c)) for c in linha] for linha in celulas]
    alturas = [b[1] - b[0] for linha in caixas for b in linha if b]
    base = caixas[0][0][1] - caixas[0][0][0]
    esc = min(alvo / base, (PE - 1) / max(alturas))
    print(sai, "escala", round(esc, 4), "altura em pé", round(base * esc), "maior", round(max(alturas) * esc))
    out = Image.new("RGBA", (CW * 4, CH * 3), (0, 0, 0, 0))
    for r in range(3):
        for c in range(4):
            y0, y1, x0, x1 = caixas[r][c]
            a = celulas[r][c][y0:y1, x0:x1]
            w, h = max(1, round((x1 - x0) * esc)), max(1, round((y1 - y0) * esc))
            s = reduz(a, mascara(a), w, h, 20)
            out.alpha_composite(s, (c * CW + (CW - w) // 2, r * CH + PE - h))
    contorna(out, cor).save(SAI / f"{sai}.png", optimize=True)


def objeto(cel, nome, alt, cores=12):
    m = mascara(cel)
    b = caixa(m)
    if not b:
        return
    y0, y1, x0, x1 = b
    a, mm = cel[y0:y1, x0:x1], m[y0:y1, x0:x1]
    reduz(a, mm, max(1, round((x1 - x0) * alt / (y1 - y0))), alt, cores).save(SAI / f"{nome}.png", optimize=True)


folha("bq-coelho", "coelho", 40, (11, 10, 14))
folha("bq-urso", "urso", 40, (150, 136, 214))

f = np.array(Image.open(AQUI / "bq-objetos.png").convert("RGB")).astype(float)
H, W = f.shape[:2]
cel = lambda r, c: f[r * H // 3:(r + 1) * H // 3, c * W // 4:(c + 1) * W // 4]
for (r, c, nome, alt) in [(0, 0, "bomba", 24), (0, 1, "bomba2", 24), (0, 2, "bumper", 18), (0, 3, "bumper2", 14), (1, 0, "plinto", 18), (1, 1, "bola", 10), (1, 2, "poste-b", 15), (1, 3, "poste-n", 15), (2, 0, "poeira", 10), (2, 1, "fogo", 16), (2, 2, "explosao", 56)]:
    objeto(cel(r, c), nome, alt)

# A sala reduzida inteira: 340x510, centrada na arena.
Image.open(AQUI / "bq-sala.png").convert("RGB").resize((340, 510), Image.BOX).quantize(colors=40, method=Image.FASTOCTREE, dither=Image.NONE).save(SAI / "sala.png", optimize=True)

# O chão é um mostrador de relógio: xadrez radial de mármore (6 anéis x 16 setores, como no jogo), rejunte de latão, 12 marcas na borda e luz no meio.
# Tons médios de propósito: o Coelho claro e o Urso escuro precisam se destacar em cima dele.
RA = R + 0.8
aw = int(2 * RA * U) + 4
ah = int(2 * RA * U * K) + 14
cy = RA * U * K
Bayer = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16
rs = np.random.RandomState(7)
ruido = rs.rand(ah, aw)
nuvem = np.array(Image.fromarray((rs.rand(ah // 12 + 2, aw // 12 + 2) * 255).astype("uint8")).resize((aw, ah), Image.BICUBIC)).astype(float) / 255
img = np.zeros((ah, aw, 4), "uint8")
CLARO = [np.array(c) for c in ((168, 162, 150), (142, 137, 126), (112, 108, 100))]
ESCURO = [np.array(c) for c in ((66, 64, 70), (50, 49, 55), (36, 35, 40))]
LATAO = [np.array(c) for c in ((217, 178, 92), (160, 124, 52), (96, 74, 30))]
PEDRA = [np.array(c) for c in ((58, 56, 58), (36, 35, 38), (20, 19, 22))]


def tom(paleta, luz, x, y):
    v = bqcl((1 - luz) * (len(paleta) - 1), 0, len(paleta) - 1.001)
    i = int(v)
    # pontilhado só numa faixa estreita entre dois tons: o resto fica chapado, como em arte de 16 bits
    if (v - i - 0.32) / 0.36 > Bayer[y % 4, x % 4]:
        i += 1
    return paleta[i]


def bqcl(v, a, b):
    return min(b, max(a, v))


for y in range(ah):
    for x in range(aw):
        wx = (x - aw / 2 + 0.5) / U
        wz = (y - cy + 0.5) / (U * K)
        r = math.hypot(wx, wz)
        wz2 = (y - cy - 9 + 0.5) / (U * K)
        if r > RA:
            if math.hypot(wx, wz2) <= RA and y > cy:
                img[y, x] = (*tom(PEDRA, 0.55 - 0.45 * (y - cy) / (ah - cy), x, y), 255)
            continue
        luz = 1.02 - (r / RA) ** 2 * 0.95 + 0.06 * (wx < 0)
        a = (math.atan2(wz, wx) + 2 * math.pi) % (2 * math.pi)
        if r > R:
            marca = abs((a * 12 / (2 * math.pi)) - round(a * 12 / (2 * math.pi))) * (2 * math.pi * r / 12) < 0.34
            if r < R + 0.16 or marca:
                img[y, x] = (*(LATAO[0] if marca else tom(LATAO, luz + 0.4, x, y)), 255)
            else:
                img[y, x] = (*tom(PEDRA, 0.45, x, y), 255)
            continue
        anel = min(5, int(r * 6 / R))
        setor = int(a / (2 * math.pi) * 16)
        lado = abs((a * 16 / (2 * math.pi)) - round(a * 16 / (2 * math.pi))) * (2 * math.pi * r / 16) * U
        junta = abs(r - round(r * 6 / R) * R / 6) * U
        if junta < 0.6:
            c = tom(LATAO, luz + 0.15, x, y)
        else:
            claro = (anel + setor) % 2 == 1
            l = luz + (nuvem[y, x] - 0.5) * 0.28
            if lado < 0.55 or junta < 1.1:
                l -= 0.34
            veio = abs(math.sin((wx * 0.9 + wz * 0.6 + nuvem[y, x] * 7) * 4.2)) < 0.035
            c = tom(CLARO if claro else ESCURO, l - (0.3 if veio else 0), x, y)
        img[y, x] = (*c, 255)
Image.fromarray(img, "RGBA").save(SAI / "arena.png", optimize=True)
print("arena", aw, ah, "ok")
