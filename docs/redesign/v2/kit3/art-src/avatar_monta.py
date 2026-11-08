"""Recorta penteados e rostos das folhas-molde, em cinza, e monta os catálogos numerados nos dois corpos.
A cor vem de rampas aplicadas depois, então uma cor nova não exige desenho novo.
Uso: python -I avatar_monta.py"""
from pathlib import Path
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

AQUI = Path(sys.argv[0]).resolve().parent
SAI = AQUI.parent / "art" / "avatar"
SAI.mkdir(parents=True, exist_ok=True)
L = 512
# faixa dos olhos na célula de 512: acima são sobrancelhas, abaixo é a boca
OLHO_Y0, OLHO_Y1 = 186, 240


def corpo(nome, destino):
    a = np.asarray(Image.open(AQUI / nome).convert("RGB")).astype(float)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    al = np.clip(1 - ((g - np.maximum(r, b)) - 25) / 70, 0, 1)
    im = Image.fromarray(np.dstack([r, np.minimum(g, np.maximum(r, b)), b, al * 255]).astype(np.uint8), "RGBA").resize((L, L), Image.BOX)
    x = np.asarray(im).copy()
    x[..., 3] = np.where(x[..., 3] >= 128, 255, 0)
    im = Image.fromarray(x, "RGBA")
    im.save(SAI / destino)
    return im


def faixa_do_molde():
    """Borda da silhueta do molde: onde magenta e verde se misturam e viram um falso cinza."""
    a = np.asarray(Image.open(AQUI / "avatar-molde.png").convert("RGB").crop((0, 0, L, L))).astype(int)
    m = Image.fromarray(((a[..., 0] > 128).astype(np.uint8)) * 255)
    return np.asarray(m.filter(ImageFilter.MaxFilter(7))) != np.asarray(m.filter(ImageFilter.MinFilter(7)))


FAIXA = faixa_do_molde()


def tira_contorno(alfa):
    """Apaga pedaços pequenos que estão quase todos na borda do molde; penteado e rosto de verdade ficam."""
    m = alfa > 0.4
    visto = np.zeros_like(m)
    H, W = m.shape
    for j, i in zip(*np.where(m & FAIXA)):
        if visto[j, i]:
            continue
        pilha, comp = [(j, i)], []
        visto[j, i] = True
        while pilha and len(comp) <= 400:
            y, x = pilha.pop()
            comp.append((y, x))
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
                v, u = y + dy, x + dx
                if 0 <= v < H and 0 <= u < W and m[v, u] and not visto[v, u]:
                    visto[v, u] = True
                    pilha.append((v, u))
        if len(comp) <= 400 and sum(FAIXA[p] for p in comp) >= 0.7 * len(comp):
            for p in comp:
                alfa[p] = 0
    return alfa


def recorta(nomes, prefixo):
    """Tudo o que é cinza vira peça; magenta e verde somem, inclusive nas bordas misturadas."""
    pecas = []
    for nome in nomes:
        a = np.asarray(Image.open(AQUI / nome).convert("RGB")).astype(float)
        for k in range(6):
            c = a[(k // 3) * L:(k // 3 + 1) * L, (k % 3) * L:(k % 3 + 1) * L]
            sat = c.max(2) - c.min(2)
            alfa = tira_contorno(np.clip(1 - (sat - 28) / 90, 0, 1))
            cinza = np.clip(c.min(2) / np.maximum(alfa, 0.3), 0, 255)
            p = Image.fromarray(np.dstack([cinza, cinza, cinza, alfa * 255]).astype(np.uint8), "RGBA")
            p.save(SAI / f"{prefixo}-{len(pecas) + 1}.png")
            pecas.append(p)
    return pecas


def cabelo(peca, sombra, meio, luz):
    """Mapa de gradiente: o traço escuro fica, sombra, meio e luz recebem a cor."""
    a = np.asarray(peca).astype(float)
    v = a[..., 0]
    s, m, l = (np.array(x, float) for x in (sombra, meio, luz))
    t1 = np.clip((v - 95) / 80, 0, 1)[..., None]
    t2 = np.clip((v - 175) / 60, 0, 1)[..., None]
    cor = s + (m - s) * t1
    cor = cor + (l - cor) * t2
    tinta = np.array((20, 14, 26), float)
    t0 = np.clip((v - 25) / 46, 0, 1)[..., None]
    cor = tinta + (cor - tinta) * t0
    return Image.fromarray(np.dstack([cor, a[..., 3]]).astype(np.uint8), "RGBA")


def rosto(peca, iris_s, iris_m, sobrancelha, labio):
    """Íris, sobrancelha e boca recebem cores próprias; traço preto e branco do olho ficam."""
    a = np.asarray(peca).astype(float)
    v = a[..., 0]
    yy = np.arange(a.shape[0])[:, None] * np.ones((1, a.shape[1]))
    faixa = (yy >= OLHO_Y0) & (yy < OLHO_Y1)
    medio = (v > 58) & (v < 208)
    s, m = np.array(iris_s, float), np.array(iris_m, float)
    t = np.clip((v - 58) / 90, 0, 1)[..., None]
    cor = np.dstack([v, v, v]).astype(float)
    cor = np.where((medio & faixa)[..., None], s + (m - s) * t, cor)
    cor = np.where((medio & (yy < OLHO_Y0))[..., None], np.array(sobrancelha, float) * (0.75 + 0.5 * t), cor)
    # boca: pega o tom do lábio; dentes claros continuam claros
    cor = np.where((medio & (yy >= OLHO_Y1))[..., None], np.array(labio, float) * (0.7 + 0.6 * t), cor)
    return Image.fromarray(np.dstack([np.clip(cor, 0, 255), a[..., 3]]).astype(np.uint8), "RGBA")


def pele(im, tom, sombra):
    """Troca o tom de pele do corpo, mantendo traços e a camiseta cinza."""
    a = np.asarray(im).astype(float)
    r, b = a[..., 0], a[..., 2]
    m = (r - b > 30) & (a[..., 3] > 0)
    v = 0.3 * r + 0.59 * a[..., 1] + 0.11 * b
    t = np.clip((v - 150) / 65, 0, 1)[..., None]
    tn, sn = np.array(tom, float), np.array(sombra, float)
    cor = sn + (tn - sn) * t
    a[..., :3] = np.where(m[..., None], cor, a[..., :3])
    return Image.fromarray(a.astype(np.uint8), "RGBA")


f, mas = corpo("avatar-base.png", "corpo-f.png"), corpo("avatar-base-m.png", "corpo-m.png")
CAB = recorta(["avatar-cabelos.png", "avatar-cabelos2.png", "avatar-cabelos3.png"], "cabelo")
ROS = recorta(["avatar-olhos.png", "avatar-olhos2.png", "avatar-olhos3.png"], "rosto")

CABELOS = [((166, 150, 135), (232, 220, 200), (250, 244, 232)), ((24, 22, 40), (58, 52, 92), (120, 112, 170)),
           ((110, 28, 44), (176, 50, 66), (236, 120, 120)), ((70, 44, 28), (120, 80, 50), (186, 142, 96)),
           ((40, 70, 110), (90, 140, 190), (180, 220, 240)), ((70, 40, 110), (130, 90, 190), (200, 170, 240)),
           ((26, 24, 28), (52, 48, 54), (110, 104, 112)), ((150, 96, 30), (214, 160, 60), (246, 214, 130))]
IRIS = [((90, 62, 170), (160, 130, 225)), ((20, 90, 110), (70, 190, 200)), ((120, 40, 40), (220, 100, 90)),
        ((80, 60, 30), (190, 150, 80)), ((30, 60, 130), (90, 140, 230)), ((50, 90, 50), (130, 190, 110))]
PELES = [((248, 217, 195), (226, 184, 162)), ((236, 196, 160), (206, 158, 124)), ((196, 142, 104), (160, 106, 76)),
         ((140, 92, 64), (106, 66, 46)), ((92, 60, 44), (66, 42, 32)), ((250, 226, 214), (228, 196, 186))]
try:
    FONTE = ImageFont.truetype("arialbd.ttf", 22)
except OSError:
    FONTE = ImageFont.load_default()


def monta(corpo_base, k_pele, k_rosto, k_cab, k_cor, k_iris):
    c = pele(corpo_base, *PELES[k_pele % 6])
    cc = CABELOS[k_cor % 8]
    claro = PELES[k_pele % 6][0]
    labio = (max(70, claro[0] - 70), max(40, claro[1] - 90), max(40, claro[2] - 80))
    c.alpha_composite(rosto(ROS[k_rosto], *IRIS[k_iris % 6], cc[0], labio))
    c.alpha_composite(cabelo(CAB[k_cab], *cc))
    return c


def prancha(destino, itens):
    C = 300
    cols = 6
    linhas = (len(itens) + cols - 1) // cols
    p = Image.new("RGB", (cols * C, linhas * C), (42, 34, 54))
    d = ImageDraw.Draw(p)
    for i, im in enumerate(itens):
        t = im.resize((C, C), Image.BOX)
        x, y = (i % cols) * C, (i // cols) * C
        p.paste(t, (x, y), t)
        d.rectangle((x + 4, y + 4, x + 40, y + 32), fill=(20, 14, 26))
        d.text((x + 9, y + 6), str(i + 1), fill=(255, 240, 150), font=FONTE)
    p.save(AQUI.parent / destino)
    print(destino, p.size)


# Penteados: rosto fixo e bem visível, cores e corpos alternados para mostrar que nada é travado
prancha("avatar-catalogo-cabelos.png", [monta(f if i % 2 == 0 else mas, i, 1, i, i, i) for i in range(18)])
# Rostos: mesmo penteado de franja alta, para o rosto aparecer inteiro
prancha("avatar-catalogo-rostos.png", [monta(mas if i % 2 == 0 else f, i, i, 10, 6 if i % 3 else 3, i) for i in range(18)])
