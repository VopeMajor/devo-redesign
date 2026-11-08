"""Desenha o rosto da Melissa à mão, em coordenadas do sprite de 400 px, e grava rosto-melissa.json."""
from collections import defaultdict
from pathlib import Path
import json
import sys

AQUI = Path(sys.argv[0]).resolve().parent
CABELO, CABELO2, PELE, PELE2 = "#FBE9DA", "#DCC7B2", "#F8D9C3", "#E8BFA8"
BORDA = "#9A8474"
LINHA, BRANCO, IRIS, IRIS2, PUPILA = "#2A1C2E", "#FBF6F2", "#9A7FD6", "#6A52AE", "#241A3E"
BOCA, RUBOR = "#8A4A48", "#F0AC9A"

# a ordem importa: quem é pintado depois cobre quem veio antes
tela = {}


def px(x, y, cor):
    tela[(round(x), round(y))] = cor


def borda_franja(x):
    return 33 - (x - 66) * 8 / 33


def dentro(x, y, pol):
    c = False
    for i in range(len(pol)):
        (x1, y1), (x2, y2) = pol[i], pol[i - 1]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            c = not c
    return c


# pele
POL = [(67, 30), (100, 22), (100, 40), (96, 44), (88, 52), (84, 52), (72, 46), (67, 41)]
for y in range(20, 54):
    for x in range(64, 102):
        if dentro(x, y, POL):
            px(x, y, PELE)

# sombra da franja sobre a testa
for x in range(67, 100):
    e = borda_franja(x)
    px(x, e + 1, PELE2)
    px(x, e + 2, PELE2)

# franja em mechas largas, com a mesma inclinação da cabeça
for x in range(64, 102):
    e = borda_franja(x)
    for y in range(int(e) - 12, int(e) + 1):
        px(x, y, CABELO)
    px(x, e + 1, BORDA)
for x0 in (71, 78, 86, 94):
    e = borda_franja(x0)
    for k in range(6):
        px(x0, e - k, CABELO2)
        if k < 3:
            px(x0 + 1, e - k, CABELO2)

# lados do cabelo: tira o ruído junto ao rosto
for y in range(26, 44):
    for x in range(61, 67):
        px(x, y, CABELO)
    for x in range(101, 105):
        if y < 42:
            px(x, y, CABELO)
for y in range(31, 42):
    px(66, y, CABELO2)
for y in range(24, 41):
    px(100, y, CABELO2)


def olho(cx, cy, flick):
    # o branco aparece só nas laterais: a íris encosta na pálpebra de cima
    meia = {-3: 5, -2: 6, -1: 6, 0: 6, 1: 5, 2: 5, 3: 4, 4: 2}
    for dy, m in meia.items():
        for dx in range(-m, m + 1):
            px(cx + dx, cy + dy, BRANCO)
    for dy in range(-4, 4):
        for dx in range(-4, 5):
            if dx * dx + (dy + 0.5) ** 2 <= 16:
                px(cx + dx, cy + dy, IRIS2 if dy <= -1 else IRIS)
    for dx, dy in [(-1, -2), (0, -2), (1, -2), (-2, -1), (-1, -1), (0, -1), (1, -1), (2, -1),
                   (-2, 0), (-1, 0), (0, 0), (1, 0), (2, 0), (-1, 1), (0, 1), (1, 1)]:
        px(cx + dx, cy + dy, PUPILA)
    # cílio de cima com 2 pixels, curvo, e a ponta para fora
    for dx in range(-6, 7):
        px(cx + dx, cy - 4, LINHA)
    for dx in range(-5, 6):
        px(cx + dx, cy - 5, LINHA)
    for k in range(1, 4):
        px(cx + flick * (6 + k), cy - 4 + (k - 1), LINHA)
    # linha de baixo, curta e suave
    for dx in range(-2, 3):
        px(cx + dx, cy + 5, PELE2)


olho(74, 41, -1)
olho(92, 36, 1)

# apaga a mancha cinza do topo da cabeça
for y in range(2, 9):
    for x in range(69, 80):
        px(x, y, CABELO)

# sobrancelhas finas, altas
for x, y in [(70, 31), (71, 30), (72, 30), (73, 29), (74, 29)]:
    pass

# nariz, boca e rubor
px(84, 45, BOCA)
for x, y in [(82, 50), (83, 51), (84, 51), (85, 51), (86, 51), (87, 50)]:
    px(x, y, BOCA)

# aro escuro na íris, brilho de 3 pixels e ponta do cílio mais longa
for cx, cy, f in ((74, 41, -1), (92, 36, 1)):
    for dy in range(-5, 5):
        for dx in range(-5, 6):
            d = dx * dx + (dy + 0.5) ** 2
            if 12.5 <= d <= 16.5:
                px(cx + dx, cy + dy, IRIS2)
    # pupila de 3 pixels: tira o peso que deixava o olhar arregalado
    for dy in range(-2, 2):
        for dx in range(-2, 3):
            if dx * dx + (dy + 0.5) ** 2 <= 8:
                px(cx + dx, cy + dy, IRIS)
    for dx, dy in [(0, -2), (-1, -1), (0, -1), (1, -1), (-1, 0), (0, 0), (1, 0), (0, 1)]:
        px(cx + dx, cy + dy, PUPILA)
    for dx, dy in [(-2, -2), (-1, -2), (-2, -1)]:
        px(cx + dx, cy + dy, BRANCO)
    # pálpebra de baixo: curta, curva e só sob a íris
    for dx in range(-3, 4):
        px(cx + dx, cy + 5, "#C89A86")
    px(cx - 4, cy + 4, "#C89A86")
    px(cx + 4, cy + 4, "#C89A86")
    # cílio de cima com 2 pixels cheios
    for dx in range(-7, 8):
        px(cx + dx, cy - 5, LINHA)
        px(cx + dx, cy - 4, LINHA)
    for dx in range(-3, 4):
        px(cx + dx, cy - 6, LINHA)

# cabelo em três tons: mechas que nascem do repartido e faixa de luz em arco
LUZ = "#FFF7EE"


def traco(x0, y0, x1, y1, cor, grossura=1):
    n = max(1, round(max(abs(x1 - x0), abs(y1 - y0))))
    for k in range(n + 1):
        x, y = x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n
        for g in range(grossura):
            px(x + g, y, cor)


# mechas laterais: duas massas de sombra curvas, que acompanham o volume da cuia
def mecha(x_topo, y_topo, x_fim, y_fim, larg):
    """Mecha afilada: larga no meio, em ponta nas duas extremidades, com leve curva para fora."""
    n = y_fim - y_topo
    for k in range(n + 1):
        t = k / n
        meio = x_topo + (x_fim - x_topo) * t
        g = max(1.5, larg * (1 - abs(2 * t - 1) ** 1.5))
        for x in range(round(meio - g / 2), round(meio + g / 2) + 1):
            px(x, y_topo + k, "#D8C5B3")


# sombra fria em massas largas, nunca em fios
for args in [(56, 29, 50, 51, 7), (64, 30, 61, 51, 5), (110, 28, 114, 44, 6)]:
    mecha(*args)
# faixa de luz em arco
for x in range(58, 104):
    y = 15 - 6 * (1 - ((x - 81) / 23) ** 2)
    if abs(x - 81) > 5:
        px(x, y, LUZ)
        px(x, y + 1, LUZ)
        px(x, y + 2, LUZ)
for x, y in [(69, 48), (70, 48), (71, 48), (70, 49), (95, 44), (96, 44), (97, 44), (96, 45)]:
    px(x, y, RUBOR)

# cílios em arco: limpa a faixa reta e redesenha subindo no centro; brilho 2x2 nas íris
for cx, cy, f in ((74, 41, -1), (92, 36, 1)):
    for dx in range(-8, 9):
        topo = cy - 6 + round(3 * (dx / 7) ** 2)
        for y in range(cy - 7, topo):
            px(cx + dx, y, PELE2 if y <= cy - 7 else PELE)
        if abs(dx) <= 7:
            px(cx + dx, topo, LINHA)
            px(cx + dx, topo + 1, LINHA)
    px(cx + f * 8, cy - 3, LINHA)
    px(cx + f * 9, cy - 4, LINHA)
    px(cx + f * 10, cy - 5, LINHA)
    # pálpebra de baixo mais clara
    for dx in range(-3, 4):
        px(cx + dx, cy + 5, "#E3BCA6")
    px(cx - 4, cy + 4, "#E3BCA6")
    px(cx + 4, cy + 4, "#E3BCA6")
    # pupila inteira e redonda, com o brilho ao lado dela
    for dx, dy in [(0, -2), (-1, -1), (0, -1), (1, -1), (-1, 0), (0, 0), (1, 0), (0, 1)]:
        px(cx + dx, cy + dy, PUPILA)
    for dx, dy in [(-3, -2), (-2, -2), (-3, -1), (-2, -1)]:
        px(cx + dx, cy + dy, BRANCO)

# tom de volume no alto da cabeça, logo abaixo da faixa de luz
for x in range(62, 100):
    y = 15 - 6 * (1 - ((x - 81) / 23) ** 2) + 3
    if abs(x - 81) > 5:
        for k in range(3 if abs(x - 81) < 15 else 2):
            px(x, y + k, CABELO2)

por_cor = defaultdict(list)
for (x, y), cor in tela.items():
    por_cor[cor].append([x, y])
(AQUI / "rosto-melissa.json").write_text(json.dumps(por_cor), encoding="utf-8")
print(len(tela), "pixels")
