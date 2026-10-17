"""
Moldura ASAS DO CREPÚSCULO (prévia da nova direção; refs cosmeticos-2/ref-11, ref-12, ref-13).
Penas negras (brilho carmesim) e prateadas desenhadas uma a uma, cristais carmesins lapidados em
cravações de prata, correntes finas suspensas com pingentes, silhueta orgânica e assimétrica que passa do
limite da caixa. Saída: public/images/cosmeticos/previa/asas-crepusculo-{avatar,mini}.webp

Geometria (unidades lógicas):
  avatar  360×480 = caixa 300×400 + 10% de sangria; foto = elipse centro (180,240), rx 120, ry 160
  mini    144×144 = caixa 120×120 + 10% de sangria; foto = círculo centro (72,72), r 40
"""
from __future__ import annotations

import math
import os
import random

from pintura import (Tela, coracao_pts, corrente, cristal, elipse, estrela, gota_pts, losango_pts, metal, pena,
                     poligono, suave, traco)

AQUI = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.join(AQUI, '..', '..', 'public', 'images', 'cosmeticos', 'previa')
os.makedirs(SAIDA, exist_ok=True)

NEGRA = ('#0a0608', '#2a141b', '#5a2a36')
NEGRA2 = ('#070507', '#1e1116', '#43222c')
PRATA = ('#4c4e5c', '#b9bccb', '#f6f7fb')
PRATA2 = ('#3c3e4a', '#9fa2b3', '#e9eaf2')


def ponto_elipse(cx, cy, rx, ry, graus):
    a = math.radians(graus)
    return cx + math.cos(a) * rx, cy + math.sin(a) * ry


def fluxo(T, cx, cy, rx, ry, g0, g1, n, comp0, comp1, cores, inclina=16, larg=0.21, abre=26, seed=0, brilho=None, curva=0.1, rev=False):
    """
    Asa que corre ao longo do aro, do ângulo g0 ao g1 (graus, sentido horário da tela). Cada pena nasce no aro,
    segue a tangente do fluxo inclinada `inclina` graus para fora e fica mais longa perto de g1 (a ponta da asa
    abre). Desenha da ponta para a base, então as penas de perto do "corpo" ficam por cima (como numa asa).
    """
    rng = random.Random(seed)
    sentido = 1 if g1 > g0 else -1
    ordem = range(n - 1, -1, -1) if not rev else range(n)
    for i in ordem:
        t = i / max(1, n - 1)
        g = g0 + (g1 - g0) * t + rng.uniform(-1.2, 1.2)
        bx, by = ponto_elipse(cx, cy, rx, ry, g)
        ang = g + 90 * sentido - (inclina + abre * t ** 1.6) * sentido
        comp = (comp0 + (comp1 - comp0) * t ** 1.4) * rng.uniform(0.94, 1.06)
        c = cores[i % len(cores)] if isinstance(cores, list) else cores
        pena(T, (bx, by), ang + rng.uniform(-3, 3), comp, comp * larg * rng.uniform(0.9, 1.1), c,
             curva=curva, lado=-sentido, fendas=1 if comp < 40 else 2, seed=seed * 100 + i, brilho_cor=brilho)


def cravacao(T, cx, cy, w, h, forma='losango', pontas=True, material='prata', s=1.0):
    """Cravação de prata: aro com garras e espinhos (ref-11/12)."""
    if pontas:
        for ang, L in ((-90, 0.95), (90, 0.75), (0, 0.55), (180, 0.55)):
            a = math.radians(ang)
            ux, uy = math.cos(a), math.sin(a)
            nx, ny = -uy, ux
            base = h if ang in (-90, 90) else w
            p0 = (cx + ux * base * 0.42, cy + uy * base * 0.42)
            tip = (cx + ux * base * (0.42 + L), cy + uy * base * (0.42 + L))
            mm = poligono(T, [(p0[0] + nx * 3 * s, p0[1] + ny * 3 * s), tip, (p0[0] - nx * 3 * s, p0[1] - ny * 3 * s)])
            metal(T, mm, material, raio=1.6, brilho=30)
    # filigrana: duas volutas de prata saindo dos lados da cravação
    for lado in (-1, 1):
        pts = suave([(cx + lado * w * 0.5, cy + h * 0.1), (cx + lado * w * 0.95, cy - h * 0.15), (cx + lado * w * 1.25, cy + h * 0.15), (cx + lado * w * 1.05, cy + h * 0.38), (cx + lado * w * 0.88, cy + h * 0.2)], 6)
        metal(T, traco(T, pts, 3.2 * s, 1.0 * s), material, raio=1.4 * s, brilho=30)
    aro = losango_pts(cx, cy, w * 1.34, h * 1.3) if forma == 'losango' else [(cx + (x - cx) * 1.22, cy + (y - cy) * 1.18) for x, y in coracao_pts(cx, cy, w * 0.5)]
    metal(T, poligono(T, aro), material, raio=2.6 * s, brilho=34)


def pingente(T, x, y, comprimento, tam=1.0, seed=0):
    corrente(T, [(x, y), (x, y + comprimento)], 1.5 * tam)
    cristal(T, gota_pts(x, y + comprimento + 6 * tam, 7 * tam, 13 * tam), (x, y + comprimento + 7 * tam), 'carmim', seed=seed, bloom=True)


def festao(T, a, b, queda, n_pend, seed=0, tam=1.0):
    pts = []
    for i in range(25):
        t = i / 24
        pts.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + math.sin(math.pi * t) * queda))
    corrente(T, pts, 1.45 * tam)
    for k in range(n_pend):
        t = (k + 1) / (n_pend + 1)
        x = a[0] + (b[0] - a[0]) * t
        y = a[1] + (b[1] - a[1]) * t + math.sin(math.pi * t) * queda
        pingente(T, x, y, 6 + 6 * (k % 2), 0.8 * tam, seed + k)


def aro_vinha(T, cx, cy, rx, ry, larg, de=0, ate=360, espinhos=14, seed=0):
    """Aro de prata escurecida em volta da foto, com espinhos curvos (ref-12/13)."""
    pts = [ponto_elipse(cx, cy, rx, ry, de + (ate - de) * i / 120) for i in range(121)]
    metal(T, traco(T, pts, larg, larg * 0.8), 'prata_negra', raio=larg * 0.5, brilho=40)
    rng = random.Random(seed)
    for i in range(espinhos):
        g = de + (ate - de) * (i + 0.5) / espinhos + rng.uniform(-5, 5)
        bx, by = ponto_elipse(cx, cy, rx + larg * 0.3, ry + larg * 0.3, g)
        a = math.radians(g + 70)
        L = rng.uniform(7, 13)
        tip = (bx + math.cos(math.radians(g)) * L * 0.6 + math.cos(a) * L * 0.5, by + math.sin(math.radians(g)) * L * 0.6 + math.sin(a) * L * 0.5)
        nx, ny = -math.sin(math.radians(g)), math.cos(math.radians(g))
        mm = poligono(T, [(bx + nx * 2.4, by + ny * 2.4), tip, (bx - nx * 2.4, by - ny * 2.4)])
        metal(T, mm, 'prata_negra', raio=1.2, brilho=30)
    # filete claro por dentro
    pts_in = [ponto_elipse(cx, cy, rx - larg * 0.6, ry - larg * 0.6, de + (ate - de) * i / 120) for i in range(121)]
    metal(T, traco(T, pts_in, larg * 0.28), 'prata', raio=0.8, brilho=30, sombra=False)


def faiscas(T, pts, seed=0):
    rng = random.Random(seed)
    for x, y, r in pts:
        estrela(T, x, y, r, '#ffe1e6' if rng.random() < 0.5 else '#ffffff', 0.9)


def estilhacos(T, pts, seed=0):
    for i, (x, y, w, h, rot) in enumerate(pts):
        a = math.radians(rot)
        base = losango_pts(0, 0, w, h)
        pts2 = [(x + px * math.cos(a) - py * math.sin(a), y + px * math.sin(a) + py * math.cos(a)) for px, py in base]
        cristal(T, pts2, (x, y), 'carmim', seed=seed + i, bloom=True)


# ─────────────────────────────────────────────────────────────── avatar

def avatar(ss=3):
    T = Tela(360, 480, ss)
    cx, cy, rx, ry = 180, 240, 120, 160
    N = [NEGRA, NEGRA2]
    P = [PRATA, PRATA2]
    # 1. Asa negra principal: sobe pela esquerda e abre em leque no alto à esquerda (ref-11)
    fluxo(T, cx, cy, rx + 2, ry + 2, 150, 234, 17, 42, 96, N, inclina=20, seed=1, brilho='#ff3a5c', curva=0.12)
    # 2. Cauda negra: desce pela esquerda e abre embaixo (a ponta passa da caixa)
    fluxo(T, cx, cy, rx + 2, ry + 2, 168, 108, 13, 38, 86, N, inclina=18, seed=2, brilho='#ff3a5c', curva=0.12)
    # 3. Asa prateada: corre por cima da foto e abre à direita
    fluxo(T, cx, cy, rx + 1, ry + 1, 258, 326, 14, 34, 74, P, inclina=22, abre=40, seed=3, curva=0.1)
    # 4. Aro de vinha com espinhos
    aro_vinha(T, cx, cy, rx + 3, ry + 3, 6.5, seed=4)
    # 4b. Gavinhas escuras trançadas no arco de baixo à direita (ref-11), com espinhos
    for k, fase in enumerate((0, 2.1, 4.2)):
        pts = []
        for i in range(60):
            g = 6 + 70 * i / 59
            off = 7 * math.sin(i / 59 * math.pi * 3 + fase) * math.sin(math.pi * i / 59)
            pts.append(ponto_elipse(cx, cy, rx + 8 + off, ry + 8 + off, g))
        metal(T, traco(T, pts, 3.6 - k * 0.6, 1.2), 'prata_negra', raio=1.6, brilho=40)
    # 5. Coberteiras (camada de cima, curtas) — dão a leitura de asa em camadas
    fluxo(T, cx, cy, rx + 5, ry + 5, 158, 226, 12, 26, 58, N, inclina=26, seed=5, brilho='#ff5470', curva=0.14)
    fluxo(T, cx, cy, rx + 5, ry + 5, 160, 116, 9, 24, 48, N, inclina=24, seed=6, brilho='#ff5470', curva=0.14)
    fluxo(T, cx, cy, rx + 4, ry + 4, 266, 318, 9, 22, 44, P, inclina=28, seed=7, curva=0.1)
    # 6. Asinhas de prata embaixo, abrindo dos dois lados do cristal (ref-11)
    fluxo(T, cx, cy, rx + 2, ry + 2, 96, 70, 6, 18, 40, P, inclina=24, seed=8, curva=0.08)
    fluxo(T, cx, cy, rx + 2, ry + 2, 84, 110, 6, 18, 40, P, inclina=24, seed=9, curva=0.08)
    # 5. Correntes e pingentes
    festao(T, ponto_elipse(cx, cy, rx + 6, ry + 6, 244), ponto_elipse(cx, cy, rx + 6, ry + 6, 266), 16, 2, seed=20)
    festao(T, ponto_elipse(cx, cy, rx + 4, ry + 4, 300), ponto_elipse(cx, cy, rx + 4, ry + 4, 326), 20, 3, seed=24)
    corrente(T, suave([ponto_elipse(cx, cy, rx + 8, ry + 8, 20), (318, 330), (322, 360)]), 1.5)
    pingente(T, 322, 360, 10, 1.1, seed=30)
    pingente(T, 46, 318, 14, 1.0, seed=31)
    corrente(T, suave([ponto_elipse(cx, cy, rx + 6, ry + 6, 160), (52, 300), (46, 318)]), 1.4)
    # 6. Cristal do alto (coração carmesim em cravação de prata, com espinhos)
    cravacao(T, cx, 76, 36, 32, forma='coracao', pontas=True)
    cristal(T, coracao_pts(cx, 76, 28), (cx, 78), 'carmim', seed=40)
    # 7. Cristal de baixo (estrela/losango) e cristal lateral direito
    cravacao(T, cx, 402, 26, 36, forma='losango')
    cristal(T, losango_pts(cx, 402, 24, 34), (cx, 402), 'carmim', seed=41)
    cravacao(T, 302, 214, 16, 24, forma='losango')
    cristal(T, losango_pts(302, 214, 15, 22), (302, 214), 'carmim', seed=42)
    # 8. Estilhaços carmesins soltos e faíscas em volta da asa negra (partículas da ref-11)
    estilhacos(T, [(22, 120, 8, 13, 20), (12, 182, 6, 10, -30), (34, 88, 5, 8, 40), (30, 392, 7, 11, -20), (64, 438, 5, 8, 30)], seed=50)
    faiscas(T, [(48, 70, 5), (22, 236, 4), (330, 120, 4), (300, 420, 3.4), (94, 446, 3)], seed=60)
    return T


# ─────────────────────────────────────────────────────────────── mini (adaptação ao quadrado)

def mini(ss=4):
    """Menos peças, maiores e de contraste alto: lê de 32 a 48 px."""
    T = Tela(144, 144, ss)
    cx, cy, r = 72, 72, 40
    N = [NEGRA, NEGRA2]
    P = [PRATA, PRATA2]
    fluxo(T, cx, cy, r + 1, r + 1, 150, 232, 10, 15, 34, N, inclina=20, seed=101, brilho='#ff3a5c', curva=0.12)
    fluxo(T, cx, cy, r + 1, r + 1, 165, 118, 7, 14, 28, N, inclina=18, seed=102, brilho='#ff3a5c', curva=0.12)
    fluxo(T, cx, cy, r + 1, r + 1, 266, 330, 8, 13, 28, P, inclina=22, seed=103, curva=0.1)
    aro_vinha(T, cx, cy, r + 1.5, r + 1.5, 3.4, espinhos=9, seed=104)
    fluxo(T, cx, cy, r + 3, r + 3, 160, 222, 6, 12, 24, N, inclina=26, seed=105, brilho='#ff5470', curva=0.14)
    festao(T, ponto_elipse(cx, cy, r + 4, r + 4, 300), ponto_elipse(cx, cy, r + 4, r + 4, 330), 8, 1, seed=110, tam=0.7)
    cravacao(T, cx, 30, 16, 14, forma='coracao', pontas=False, s=0.5)
    cristal(T, coracao_pts(cx, 30, 13), (cx, 31), 'carmim', seed=111)
    cravacao(T, cx, 114, 12, 16, forma='losango', pontas=False, s=0.5)
    cristal(T, losango_pts(cx, 114, 11, 16), (cx, 114), 'carmim', seed=112)
    faiscas(T, [(22, 30, 2.6), (126, 108, 2.2)], seed=120)
    return T


if __name__ == '__main__':
    a = avatar()
    a.salvar(os.path.join(SAIDA, 'asas-crepusculo-avatar.webp'), 720, 960, qualidade=90)
    m = mini()
    m.salvar(os.path.join(SAIDA, 'asas-crepusculo-mini.webp'), 288, 288, qualidade=92)
    print('ok')
