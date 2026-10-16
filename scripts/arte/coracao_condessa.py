"""
Emblema CORAÇÃO DA CONDESSA (prévia da nova direção; refs cosmeticos-2/ref-10, ref-08).
Laço de seda negra atrás, moldura barroca de ouro com volutas de acanto, coração de cristal vermelho
lapidado, argola com pingente (gota de cristal) e pérolas. Duas saídas:
  coracao-condessa.webp      512×512 (perfil, coleção, vitrine)
  coracao-condessa-mini.webp  96×96 (16–24 px: menos peças, contornos grossos, contraste alto)
"""
from __future__ import annotations

import math
import os

from pintura import Tela, coracao_pts, corrente, cristal, elipse, estrela, gota_pts, metal, perola, poligono, seda, suave, traco

AQUI = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.join(AQUI, '..', '..', 'public', 'images', 'cosmeticos', 'previa')
os.makedirs(SAIDA, exist_ok=True)


def espiral(cx, cy, r0, r1, voltas, a0, sentido=1, n=30):
    out = []
    for i in range(n + 1):
        t = i / n
        a = math.radians(a0 + sentido * t * voltas * 360)
        r = r0 + (r1 - r0) * t
        out.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
    return out


def voluta(T, entrada, cx, cy, r0, r1, voltas, a0, sentido, w0, w1, material='ouro'):
    pts = suave(list(entrada) + espiral(cx, cy, r0, r1, voltas, a0, sentido, 18)[1:], 5)
    metal(T, traco(T, pts, w0, w1), material, raio=max(1.2, w0 * 0.45), brilho=34)


def laco(T, cx, cy, s):
    """Laço de seda negra: alças com o "buraco" escuro perto do nó, pontas em V caindo para os lados, dobras."""
    P = lambda x, y: (cx + x * s, cy + y * s)  # noqa: E731
    pontaE = [P(-6, 4), P(-26, 26), P(-48, 56), P(-38, 54), P(-36, 66), P(-16, 34), P(0, 8)]
    pontaD = [P(6, 4), P(26, 24), P(50, 52), P(40, 51), P(39, 63), P(16, 32), P(0, 8)]
    alcaE = suave([P(0, -2), P(-12, -20), P(-38, -32), P(-58, -24), P(-60, -2), P(-44, 12), P(-14, 8), P(0, 2)], 6)
    alcaD = suave([P(0, -2), P(12, -20), P(38, -32), P(58, -24), P(60, -2), P(44, 12), P(14, 8), P(0, 2)], 6)
    seda(T, poligono(T, pontaE), 'negra', 5 * s, [(suave([P(-8, 12), P(-24, 32), P(-40, 52)]), True), (suave([P(-4, 14), P(-14, 30), P(-26, 50)]), False)])
    seda(T, poligono(T, pontaD), 'negra', 5 * s, [(suave([P(8, 12), P(24, 30), P(42, 48)]), True), (suave([P(4, 14), P(14, 30), P(30, 48)]), False)])
    for alca, sx in ((alcaE, -1), (alcaD, 1)):
        seda(T, poligono(T, alca), 'negra', 10 * s, [
            (suave([P(sx * 8, -10), P(sx * 26, -24), P(sx * 50, -24)]), True),
            (suave([P(sx * 10, 4), P(sx * 30, 6), P(sx * 52, -4)]), False),
            (suave([P(sx * 14, -4), P(sx * 32, -10), P(sx * 46, -10)]), False),
        ])
        # interior da alça (a parte de dentro do laço, mais escura)
        buraco = suave([P(sx * 10, -4), P(sx * 26, -14), P(sx * 42, -12), P(sx * 40, -2), P(sx * 22, 2)], 5)
        hm = poligono(T, buraco)
        if hm:
            import numpy as np
            from scipy import ndimage
            T.compor(np.zeros(hm[0].shape + (3,), np.float32), ndimage.gaussian_filter(hm[0], 2 * T.ss) * 0.75, hm[1], hm[2])
    no = suave([P(-9, -9), P(0, -12), P(9, -9), P(10, 3), P(6, 11), P(-6, 11), P(-10, 3)], 5)
    seda(T, poligono(T, no), 'negra', 5 * s, [(suave([P(-6, -5), P(0, -8), P(6, -5)]), True), (suave([P(-5, 4), P(0, 8), P(5, 4)]), False)])


def acanto(T, base, ang, comp, larg, material='ouro'):
    a = math.radians(ang)
    u = (math.cos(a), math.sin(a))
    n = (-u[1], u[0])
    P = lambda t, s_: (base[0] + u[0] * comp * t + n[0] * larg * s_, base[1] + u[1] * comp * t + n[1] * larg * s_)  # noqa: E731
    pts = suave([P(0, 0), P(0.2, 0.55), P(0.34, 0.35), P(0.5, 0.7), P(0.64, 0.4), P(0.8, 0.55), P(1, 0.15), P(0.82, -0.05), P(0.6, -0.3), P(0.4, -0.15), P(0.2, -0.35), P(0.05, -0.15)], 4)
    metal(T, poligono(T, pts), material, raio=larg * 0.35, brilho=26)


def grande(ss=4):
    T = Tela(256, 256, ss)
    cx, cy = 128, 134
    laco(T, 128, 70, 2.05)
    # moldura barroca: aro em coração + volutas de acanto nos lados, coroinha em cima, argola embaixo
    # plumas de acanto: folhas grandes sobrepostas abrindo para os lados (ref-10, broche do alto à esquerda)
    for lado in (-1, 1):
        for k, (ang, comp, larg, dx, dy) in enumerate([(-122, 44, 22, 30, -48), (166, 50, 24, 44, 18), (-140, 62, 26, 40, -38), (178, 66, 26, 46, 0), (-158, 74, 28, 46, -20), (150, 56, 24, 40, 30), (-170, 80, 26, 48, -8), (-148, 60, 22, 52, -30)]):
            a_ = ang if lado < 0 else 180 - ang
            base = (cx + lado * dx, cy + dy)
            acanto(T, base, a_, comp, larg)
            # nervura central
            a2 = math.radians(a_)
            pts = [(base[0] + math.cos(a2) * comp * t, base[1] + math.sin(a2) * comp * t) for t in (0.08, 0.4, 0.75)]
            vm = traco(T, pts, 1.6, 0.4)
            if vm:
                import numpy as np
                T.compor(np.broadcast_to(np.array([0.25, 0.14, 0.04], np.float32), vm[0].shape + (3,)), vm[0] * 0.6, vm[1], vm[2])
    # concha embaixo segurando a argola
    for ang in (60, 90, 120):
        acanto(T, (cx, cy + 58), ang, 22, 9)
    # aro em coração, grosso, com contas de ouro nas duas bordas
    metal(T, poligono(T, coracao_pts(cx, cy, 64)), 'ouro', raio=9, brilho=18, gravura=0.08)
    for i, (x, y) in enumerate(coracao_pts(cx, cy, 63, n=46)):
        metal(T, elipse(T, x, y, 2.4, 2.4), 'ouro', raio=1.4, brilho=30, sombra=False)
    coroa = [(cx - 16, cy - 50), (cx - 12, cy - 66), (cx - 5, cy - 56), (cx, cy - 74), (cx + 5, cy - 56), (cx + 12, cy - 66), (cx + 16, cy - 50)]
    metal(T, poligono(T, coroa), 'ouro', raio=2.6, brilho=36)
    for x, y in ((cx - 12, cy - 68), (cx, cy - 77), (cx + 12, cy - 68)):
        perola(T, x, y, 3.2)
    # bisel interno (ouro velho, mais escuro) e o cristal
    metal(T, poligono(T, coracao_pts(cx, cy, 54)), 'ouro_velho', raio=3, brilho=26, sombra=False)
    cristal(T, coracao_pts(cx, cy + 1, 47), (cx, cy + 4), 'carmim', escala_mesa=0.5, seed=7)
    # argola, corrente curta, pingente e pérolas
    metal(T, poligono(T, [(cx - 7, cy + 66), (cx + 7, cy + 66), (cx + 5, cy + 78), (cx - 5, cy + 78)]), 'ouro', raio=2, brilho=34)
    corrente(T, [(cx, cy + 78), (cx, cy + 92)], 2.2, 'ouro')
    for i in range(5):
        perola(T, cx - 14 + i * 7, cy + 92 + abs(i - 2) * -1.5 + 4, 3)
    cristal(T, gota_pts(cx, cy + 108, 16, 28), (cx, cy + 110), 'carmim', seed=9)
    estrela(T, cx + 58, cy - 64, 6, '#ffffff', 0.9)
    estrela(T, cx - 70, cy + 40, 4, '#ffe3e8', 0.8)
    return T


def mini(ss=6):
    """Lê a 20–24 px: laço, aro de ouro grosso e o coração; pingente curto. Sem volutas finas."""
    T = Tela(64, 64, ss)
    cx, cy = 32, 34
    laco(T, 32, 18, 0.58)
    metal(T, poligono(T, coracao_pts(cx, cy, 21)), 'ouro', raio=2.4, brilho=40)
    cristal(T, coracao_pts(cx, cy + 0.5, 15), (cx, cy + 1.5), 'carmim', escala_mesa=0.5, seed=7)
    cristal(T, gota_pts(cx, cy + 25, 7, 11), (cx, cy + 26), 'carmim', seed=9, bloom=False)
    metal(T, poligono(T, [(cx - 2.4, cy + 17), (cx + 2.4, cy + 17), (cx + 1.6, cy + 20.5), (cx - 1.6, cy + 20.5)]), 'ouro', raio=0.8, brilho=30)
    return T


if __name__ == '__main__':
    grande().salvar(os.path.join(SAIDA, 'coracao-condessa.webp'), 512, 512, qualidade=92)
    mini().salvar(os.path.join(SAIDA, 'coracao-condessa-mini.webp'), 96, 96, qualidade=95)
    print('ok')
