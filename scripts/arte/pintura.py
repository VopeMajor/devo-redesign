"""
Pintura procedural dos cosméticos (prévia da nova direção — docs/redesign/COSMETICOS-REFORMULACAO-dono.md).

Gera WebP transparente com numpy + PIL + scipy: máscaras supersampled, volume por campo de altura (normal a
partir da distância à borda → difusa + especular por rampa de material), penas com raque/barbas/fendas,
cristais facetados translúcidos com brilho, seda com dobras, correntes, sombras de contato e brilhos.
Determinístico (semente fixa). Uso: python3 scripts/arte/<peca>.py
"""
from __future__ import annotations

import math
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

# ─────────────────────────────────────────────────────────────── utilidades

def lerp(a, b, t):
    return a + (b - a) * t


def hexrgb(h: str):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)], dtype=np.float32)


def rampa(paradas: list[tuple[float, str]]):
    """Rampa de cor: [(pos, '#hex'), ...] → função v(0..1, array) → rgb."""
    pos = np.array([p for p, _ in paradas], dtype=np.float32)
    cores = np.stack([hexrgb(c) for _, c in paradas])

    def f(v):
        v = np.clip(v, 0, 1)
        out = np.empty(v.shape + (3,), dtype=np.float32)
        for k in range(3):
            out[..., k] = np.interp(v, pos, cores[:, k])
        return out

    return f


def bezier(p0, p1, p2, p3, n=40):
    t = np.linspace(0, 1, n)[:, None]
    p0, p1, p2, p3 = (np.array(p, dtype=np.float32) for p in (p0, p1, p2, p3))
    return ((1 - t) ** 3) * p0 + 3 * ((1 - t) ** 2) * t * p1 + 3 * (1 - t) * t * t * p2 + t ** 3 * p3


def suave(pts, n=8):
    """Catmull-Rom pelos pontos."""
    pts = [np.array(p, dtype=np.float32) for p in pts]
    p = [pts[0]] + pts + [pts[-1]]
    out = []
    for i in range(1, len(p) - 2):
        p0, p1, p2, p3 = p[i - 1], p[i], p[i + 1], p[i + 2]
        for k in range(n):
            t = k / n
            t2, t3 = t * t, t * t * t
            out.append(0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
    out.append(pts[-1])
    return np.array(out)


def normal2(v):
    n = np.linalg.norm(v, axis=-1, keepdims=True)
    return v / np.maximum(n, 1e-6)


# ─────────────────────────────────────────────────────────────── tela

class Tela:
    """Tela RGBA pré-multiplicada em float, em escala `ss` (supersample) da saída."""

    def __init__(self, w: int, h: int, ss: int = 2):
        self.ss = ss
        self.W, self.H = w * ss, h * ss
        self.P = np.zeros((self.H, self.W, 3), dtype=np.float32)
        self.A = np.zeros((self.H, self.W), dtype=np.float32)

    # coordenadas lógicas → pixels internos
    def s(self, v):
        return v * self.ss

    def mascara(self, desenho, bbox=None):
        """`desenho(draw, S)` desenha em branco numa imagem L do tamanho da tela; devolve (máscara, x0, y0)."""
        img = Image.new('L', (self.W, self.H), 0)
        d = ImageDraw.Draw(img)
        desenho(d, self.ss)
        m = np.asarray(img, dtype=np.float32) / 255
        ys, xs = np.nonzero(m)
        if len(xs) == 0:
            return None
        pad = 6 * self.ss
        x0, x1 = max(0, xs.min() - pad), min(self.W, xs.max() + pad + 1)
        y0, y1 = max(0, ys.min() - pad), min(self.H, ys.max() + pad + 1)
        return m[y0:y1, x0:x1].copy(), x0, y0

    def compor(self, rgb, a, x0, y0, modo='over'):
        h, w = a.shape
        sx0, sy0 = max(0, -x0), max(0, -y0)
        x0c, y0c = max(0, x0), max(0, y0)
        x1, y1 = min(self.W, x0 + w), min(self.H, y0 + h)
        if x1 <= x0c or y1 <= y0c:
            return
        a = a[sy0: sy0 + (y1 - y0c), sx0: sx0 + (x1 - x0c)]
        rgb = np.broadcast_to(rgb, (h, w, 3))[sy0: sy0 + (y1 - y0c), sx0: sx0 + (x1 - x0c)]
        P = self.P[y0c:y1, x0c:x1]
        A = self.A[y0c:y1, x0c:x1]
        if modo == 'over':
            P[:] = rgb * a[..., None] + P * (1 - a[..., None])
            A[:] = a + A * (1 - a)
        elif modo == 'add':  # luz (não muda muito a cobertura)
            P[:] = np.clip(P + rgb * a[..., None], 0, 4)
            A[:] = np.clip(A + a * 0.6, 0, 1)
        elif modo == 'multiply':
            P[:] = P * (1 - a[..., None] * (1 - rgb))

    def salvar(self, caminho: str, w: int, h: int, qualidade=92):
        A = np.clip(self.A, 0, 1)
        rgb = np.where(A[..., None] > 1e-4, self.P / np.maximum(A[..., None], 1e-4), 0)
        rgb = np.clip(rgb, 0, 1)
        img = Image.fromarray((np.dstack([rgb, A]) * 255).astype(np.uint8), 'RGBA')
        img = img.resize((w, h), Image.LANCZOS)
        img.save(caminho, 'WEBP', quality=qualidade, method=6)
        return img


# ─────────────────────────────────────────────────────────────── volume e materiais

LUZ = normal2(np.array([-0.55, -0.75, 0.62], dtype=np.float32))


def altura(m, raio):
    d = ndimage.distance_transform_edt(m > 0.5)
    h = np.clip(d / max(raio, 1), 0, 1)
    return np.sin(h * np.pi / 2)


def sombreamento(m, raio, brilho=40, forca=2.2):
    """Difusa e especular a partir do campo de altura da máscara (volume arredondado)."""
    h = altura(m, raio) * raio * 0.9
    h = ndimage.gaussian_filter(h, max(0.6, raio * 0.08))
    gy, gx = np.gradient(h)
    n = normal2(np.dstack([-gx * forca, -gy * forca, np.ones_like(h)]))
    dif = np.clip((n * LUZ).sum(-1), 0, 1)
    r = 2 * (n * LUZ).sum(-1)[..., None] * n - LUZ
    esp = np.clip(r[..., 2], 0, 1) ** brilho
    return dif, esp, n


METAIS = {
    'prata': rampa([(0, '#1c1b20'), (0.25, '#4a4852'), (0.5, '#8e8c96'), (0.72, '#cfcdd6'), (0.9, '#f3f2f7'), (1, '#ffffff')]),
    'prata_negra': rampa([(0, '#0b0a0e'), (0.3, '#262430'), (0.55, '#4d4a5a'), (0.78, '#9a97a8'), (1, '#eeedf4')]),
    'ouro': rampa([(0, '#1a0c02'), (0.18, '#55320c'), (0.36, '#94621f'), (0.52, '#c99436'), (0.68, '#ecc463'), (0.82, '#fff0b8'), (1, '#ffffff')]),
    'ouro_velho': rampa([(0, '#1e1206'), (0.3, '#5c3d16'), (0.55, '#9b7436'), (0.78, '#d6b672'), (1, '#f6e8c0')]),
}


def metal(tela: Tela, mm, material='prata', raio=4, brilho=36, sombra=True, opac=1.0, gravura=0.0):
    """Peça de metal polido com volume. `mm` = (máscara, x0, y0)."""
    if mm is None:
        return
    m, x0, y0 = mm
    s = tela.ss
    if sombra:
        contato(tela, mm, 2.2, 3.2, 0.55)
    dif, esp, n = sombreamento(m, raio * s, brilho)
    # oclusão perto da borda + reflexo do ambiente (env em faixas)
    borda = np.clip(ndimage.distance_transform_edt(m > 0.5) / (1.4 * s), 0, 1)
    env = 0.5 + 0.5 * np.sin(n[..., 1] * 3.2 + n[..., 0] * 1.4)
    v = 0.12 + 0.55 * dif + 0.25 * env
    v = v * (0.55 + 0.45 * borda) + esp * 0.9
    if gravura:
        ruido = ndimage.gaussian_filter(np.random.default_rng(3).random(m.shape), 0.8 * s)
        v = v - (ruido - 0.5) * gravura
    rgb = METAIS[material](v)
    rgb = rgb + esp[..., None] * 0.35
    tela.compor(np.clip(rgb, 0, 1.4), m * opac, x0, y0)


def contato(tela: Tela, mm, dx=2.0, dy=3.0, forca=0.5, blur=2.2):
    """Sombra de contato (a silhueta, deslocada e desfocada)."""
    m, x0, y0 = mm
    s = tela.ss
    pad = int(blur * 3 * s) + int(max(dx, dy) * s) + 2
    mp = np.pad(m, pad)
    mp = ndimage.shift(mp, (dy * s, dx * s), order=1)
    mp = ndimage.gaussian_filter(mp, blur * s) * forca
    tela.compor(np.zeros(mp.shape + (3,), np.float32), np.clip(mp, 0, 1), x0 - pad, y0 - pad)


def brilho_suave(tela: Tela, mm, cor='#ff3050', raio=10, forca=0.8):
    """Luz que vaza (bloom) ao redor de um cristal."""
    m, x0, y0 = mm
    s = tela.ss
    pad = int(raio * 3 * s)
    mp = ndimage.gaussian_filter(np.pad(m, pad), raio * s) * forca
    c = hexrgb(cor)
    tela.compor(np.broadcast_to(c, mp.shape + (3,)).astype(np.float32), np.clip(mp, 0, 1), x0 - pad, y0 - pad, 'add')


# ─────────────────────────────────────────────────────────────── formas

def poligono(tela: Tela, pts):
    pts = [(float(x) * tela.ss, float(y) * tela.ss) for x, y in pts]
    return tela.mascara(lambda d, S: d.polygon(pts, fill=255))


def traco(tela: Tela, pts, largura, larg_fim=None):
    """Traço afunilado (largura → larg_fim) ao longo de uma polilinha, como polígono cheio."""
    pts = np.array(pts, dtype=np.float32)
    if larg_fim is None:
        larg_fim = largura
    n = len(pts)
    esq, dir_ = [], []
    for i in range(n):
        a = pts[max(0, i - 1)]
        b = pts[min(n - 1, i + 1)]
        t = b - a
        t = t / max(np.linalg.norm(t), 1e-6)
        nrm = np.array([-t[1], t[0]])
        w = lerp(largura, larg_fim, i / max(1, n - 1)) / 2
        esq.append(pts[i] + nrm * w)
        dir_.append(pts[i] - nrm * w)
    return poligono(tela, esq + dir_[::-1])


def elipse(tela: Tela, cx, cy, rx, ry, contorno=None):
    s = tela.ss
    box = [(cx - rx) * s, (cy - ry) * s, (cx + rx) * s, (cy + ry) * s]
    if contorno:
        return tela.mascara(lambda d, S: d.ellipse(box, outline=255, width=max(1, int(contorno * s))))
    return tela.mascara(lambda d, S: d.ellipse(box, fill=255))


def uniao(*mms):
    mms = [m for m in mms if m is not None]
    x0 = min(m[1] for m in mms)
    y0 = min(m[2] for m in mms)
    x1 = max(m[1] + m[0].shape[1] for m in mms)
    y1 = max(m[2] + m[0].shape[0] for m in mms)
    out = np.zeros((y1 - y0, x1 - x0), np.float32)
    for m, mx, my in mms:
        h, w = m.shape
        out[my - y0: my - y0 + h, mx - x0: mx - x0 + w] = np.maximum(out[my - y0: my - y0 + h, mx - x0: mx - x0 + w], m)
    return out, x0, y0


# ─────────────────────────────────────────────────────────────── penas

def pena(tela: Tela, base, ang, comp, larg, cores, curva=0.12, lado=1.0, fendas=2, seed=0, brilho_cor=None):
    """
    Pena desenhada individualmente: raque curva, vexilo assimétrico, barbas finas, fendas na borda,
    brilho acetinado perto da raque e borda escurecida. `cores` = (raiz, meio, ponta) hex.
    """
    rng = random.Random(seed)
    a = math.radians(ang)
    u = np.array([math.cos(a), math.sin(a)])
    nv = np.array([-u[1], u[0]]) * lado
    b = np.array(base, dtype=np.float32)
    N = 36
    ts = np.linspace(0, 1, N)
    raque = np.array([b + u * comp * t + nv * curva * comp * math.sin(math.pi * t * 0.9) for t in ts])
    larg_t = [larg * (math.sin(math.pi * min(1, t * 1.08) ** 0.75) ** 0.85) * (1 - 0.2 * t) for t in ts]
    larg_t[0] = larg * 0.12
    esq, dir_ = [], []
    for i, t in enumerate(ts):
        tng = raque[min(N - 1, i + 1)] - raque[max(0, i - 1)]
        tng = tng / max(np.linalg.norm(tng), 1e-6)
        nrm = np.array([-tng[1], tng[0]])
        esq.append(raque[i] + nrm * larg_t[i] * 1.0)
        dir_.append(raque[i] - nrm * larg_t[i] * 0.62)
    esq[-1] = dir_[-1] = raque[-1] + (raque[-1] - raque[-2]) * 0.6
    mm = poligono(tela, esq + dir_[::-1])
    if mm is None:
        return
    m, x0, y0 = mm
    s = tela.ss
    # fendas: cortes finos em V na borda
    if fendas:
        img = Image.fromarray((m * 255).astype(np.uint8))
        d = ImageDraw.Draw(img)
        for _ in range(fendas):
            i = rng.randint(N // 2, N - 5)
            lado_borda = esq if rng.random() < 0.65 else dir_
            p = lado_borda[i]
            q = raque[i] * 0.2 + p * 0.8 + u * comp * 0.035
            w = 0.9 * s
            pts = [((p[0] + u[0] * 2) * s - x0, (p[1] + u[1] * 2) * s - y0), ((p[0] - u[0] * 2) * s - x0, (p[1] - u[1] * 2) * s - y0), (q[0] * s - x0, q[1] * s - y0)]
            d.polygon(pts, fill=0)
        m = np.asarray(img, dtype=np.float32) / 255
    contato(tela, (m, x0, y0), 1.6, 2.4, 0.45, 1.8)
    # coordenadas ao longo (t) e através (s) da pena
    H, W = m.shape
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    px = (xx + x0) / s
    py = (yy + y0) / s
    rel = np.dstack([px - b[0], py - b[1]])
    tt = np.clip((rel * u).sum(-1) / comp, 0, 1)
    ss_ = (rel * nv).sum(-1)
    raque_off = curva * comp * np.sin(np.pi * tt * 0.9)
    across = (ss_ - raque_off) / max(larg, 1e-3)
    c0, c1, c2 = (hexrgb(c) for c in cores)
    rng_np = np.random.default_rng(seed)
    borda = np.clip(ndimage.distance_transform_edt(m > 0.5) / (2.8 * s), 0, 1)
    borda_fina = np.clip(ndimage.distance_transform_edt(m > 0.5) / (0.8 * s), 0, 1)
    # tom: escuro na raiz e nas bordas, claro na faixa acetinada perto da raque e no meio do comprimento
    ao_longo = np.sin(np.pi * np.clip(tt * 1.1, 0, 1)) ** 0.7
    faixa = np.exp(-((across - 0.22) / 0.38) ** 2)
    v = 0.12 + 0.5 * faixa * ao_longo + 0.18 * tt
    v = v * (0.55 + 0.45 * borda)
    # barbas (fios finos diagonais, irregulares)
    ruido = ndimage.gaussian_filter(rng_np.random(m.shape).astype(np.float32), (0.5 * s, 2.0 * s))
    fase = (tt * comp - np.abs(across) * larg * 0.8) * (1.6 + 0.4 * rng.random()) * 2.0 + ruido * 6
    listras = (0.5 + 0.5 * np.sin(fase)) ** 2
    v = v * (0.86 + 0.2 * listras)
    rampa_p = rampa([(0, '#000000'), (0.1, cores[0]), (0.45, cores[1]), (0.85, cores[2]), (1, '#ffffff')])
    rgb = rampa_p(np.clip(v, 0, 1))
    # brilho úmido ao longo da pena (cetim), estreito
    brilho_l = np.exp(-((across - 0.3) / 0.1) ** 2) * np.clip((tt - 0.15) * 3, 0, 1) * np.clip((0.85 - tt) * 4, 0, 1)
    tom_brilho = hexrgb(brilho_cor) if brilho_cor is not None else lerp(c2, np.array([1, 1, 1], np.float32), 0.5)
    rgb = rgb + tom_brilho * (brilho_l * 0.32)[..., None]
    lado_luz = np.clip(0.4 - across, 0, 1)
    rgb = rgb + tom_brilho * ((1 - borda_fina) * lado_luz * 0.35)[..., None]
    tela.compor(np.clip(rgb, 0, 1.2), m, x0, y0)
    # raque: fio fino com luz
    rq = traco(tela, raque[: int(N * 0.92)], max(0.7, larg * 0.09), 0.25)
    if rq is not None:
        dif, esp, _ = sombreamento(rq[0], 1.2 * s, 20)
        cr = lerp(c2, np.array([1, 1, 1], np.float32), 0.55)
        tela.compor(np.clip(cr * (0.45 + 0.6 * dif[..., None]) + esp[..., None] * 0.6, 0, 1.2), rq[0] * 0.95, rq[1], rq[2])


# ─────────────────────────────────────────────────────────────── cristais

CRISTAIS = {
    'carmim': ['#1c0005', '#470310', '#8a0820', '#c8132f', '#ff4d62', '#ffd6dc'],
    'ametista': ['#140728', '#331159', '#5e2aa6', '#9157e6', '#c8a2ff', '#f1e6ff'],
}


def cristal(tela: Tela, contorno, centro, paleta='carmim', escala_mesa=0.48, seed=1, bloom=True, alfa=0.96):
    """
    Cristal lapidado e translúcido: coroa de facetas triangulares com tons por orientação, mesa clara,
    reflexos internos, aresta escura, brilho especular e luz vazando (bloom).
    """
    rng = random.Random(seed)
    pal = [hexrgb(c) for c in CRISTAIS[paleta]]
    c = np.array(centro, dtype=np.float32)
    cont = [np.array(p, dtype=np.float32) for p in contorno]
    mesa = [c + (p - c) * escala_mesa for p in cont]
    mm = poligono(tela, cont)
    if mm is None:
        return
    if bloom:
        brilho_suave(tela, mm, CRISTAIS[paleta][3], 7, 0.5)
    contato(tela, mm, 1.4, 2.2, 0.5, 1.6)
    # facetas
    n = len(cont)
    for i in range(n):
        a, b2 = cont[i], cont[(i + 1) % n]
        ma, mb = mesa[i], mesa[(i + 1) % n]
        for tri, k in (([a, b2, mb], 0), ([a, mb, ma], 1)):
            cen = sum(tri) / 3 - c
            ang = math.atan2(cen[1], cen[0])
            luz = 0.5 + 0.5 * math.cos(ang - math.radians(-125))
            v = 0.18 + 0.62 * luz + rng.uniform(-0.2, 0.2) + (0.1 if k else -0.05)
            idx = v * (len(pal) - 1.5)
            i0 = int(np.clip(math.floor(idx), 0, len(pal) - 2))
            cor = lerp(pal[i0], pal[i0 + 1], idx - i0)
            fm = poligono(tela, tri)
            if fm:
                # gradiente interno da faceta (mais claro para o centro)
                H, W = fm[0].shape
                yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
                cx_, cy_ = (c[0] * tela.ss - fm[1]), (c[1] * tela.ss - fm[2])
                dist = np.sqrt((xx - cx_) ** 2 + (yy - cy_) ** 2)
                g = np.clip(1 - dist / dist.max(), 0, 1)
                rgb = np.clip(cor * (0.8 + 0.4 * g[..., None]), 0, 1)
                tela.compor(rgb, fm[0] * alfa, fm[1], fm[2])
    # mesa
    tm = poligono(tela, mesa)
    if tm:
        H, W = tm[0].shape
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        g = (xx / max(W, 1) * 0.6 + yy / max(H, 1) * 0.4)
        rgb = lerp(pal[4], pal[3], g[..., None])
        tela.compor(rgb, tm[0] * 0.5, tm[1], tm[2])
        # reflexo interno escuro (dá profundidade)
        rx = [c + (p - c) * 0.22 + np.array([3, 4]) * 0 for p in mesa]
        rm = poligono(tela, rx)
        if rm:
            tela.compor(np.broadcast_to(pal[1], rm[0].shape + (3,)).astype(np.float32), rm[0] * 0.55, rm[1], rm[2])
    # arestas finas claras
    s = tela.ss
    for i in range(n):
        a, ma = cont[i], mesa[i]
        am = traco(tela, [a, ma], 0.45)
        if am:
            tela.compor(np.broadcast_to(pal[5], am[0].shape + (3,)).astype(np.float32), am[0] * 0.35, am[1], am[2])
    # contorno escuro
    bm = tela.mascara(lambda d, S: d.polygon([(p[0] * s, p[1] * s) for p in cont], outline=255, width=max(1, int(0.9 * s))))
    if bm:
        tela.compor(np.broadcast_to(pal[0], bm[0].shape + (3,)).astype(np.float32), bm[0] * 0.9, bm[1], bm[2])
    # brilho especular (estrela) no alto à esquerda
    tam = max(np.linalg.norm(p - c) for p in cont)
    # pavilhão: metade de baixo mais escura (profundidade da pedra)
    H, W = mm[0].shape
    yy = np.mgrid[0:H, 0:W][0].astype(np.float32) / max(H, 1)
    tela.compor(np.broadcast_to(pal[0], (H, W, 3)).astype(np.float32), mm[0] * np.clip((yy - 0.45) * 1.3, 0, 0.55), mm[1], mm[2])
    # reflexo: mancha clara suave no alto e um brilho pequeno
    gl = elipse(tela, c[0] - tam * 0.22, c[1] - tam * 0.3, tam * 0.22, tam * 0.12)
    if gl:
        tela.compor(np.ones(gl[0].shape + (3,), np.float32), ndimage.gaussian_filter(gl[0], 1.2 * s) * 0.55, gl[1], gl[2])
    estrela(tela, c[0] - tam * 0.3, c[1] - tam * 0.34, tam * 0.2, '#ffffff', 0.9)


def estrela(tela: Tela, x, y, r, cor='#ffffff', forca=1.0, glow=True):
    k = r * 0.12
    pts = [(x, y - r), (x + k, y - k), (x + r, y), (x + k, y + k), (x, y + r), (x - k, y + k), (x - r, y), (x - k, y - k)]
    mm = poligono(tela, pts)
    if mm is None:
        return
    if glow:
        brilho_suave(tela, mm, cor, max(1.2, r * 0.25), 0.7 * forca)
    tela.compor(np.broadcast_to(hexrgb(cor), mm[0].shape + (3,)).astype(np.float32), mm[0] * forca, mm[1], mm[2])


def losango_pts(cx, cy, w, h):
    return [(cx, cy - h / 2), (cx + w / 2, cy), (cx, cy + h / 2), (cx - w / 2, cy)]


def gota_pts(cx, cy, w, h, n=18):
    out = [(cx, cy - h / 2)]
    for i in range(1, n):
        t = i / n
        ang = math.pi * t
        x = cx + math.sin(ang) * w / 2 * (0.3 + 0.7 * t)
        y = cy - h / 2 + h * (0.5 - 0.5 * math.cos(math.pi * t ** 0.8))
        out.append((x, y))
    out.append((cx, cy + h / 2))
    for i in range(n - 1, 0, -1):
        x, y = out[i]
        out.append((2 * cx - x, y))
    return out


def coracao_pts(cx, cy, s, n=28):
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        x = 16 * math.sin(t) ** 3
        y = -(13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t))
        pts.append((cx + x * s / 17, cy + y * s / 17 + s * 0.08))
    return pts


# ─────────────────────────────────────────────────────────────── correntes, seda

def corrente(tela: Tela, pts, elo=3.0, material='prata'):
    """Corrente fina: elos alternados (de frente e de lado) ao longo da curva."""
    pts = np.array(pts, dtype=np.float32)
    seg = np.diff(pts, axis=0)
    comp = np.concatenate([[0], np.cumsum(np.linalg.norm(seg, axis=1))])
    passo = elo * 1.35
    k = 0
    d = 0.0
    while d < comp[-1]:
        i = min(len(seg) - 1, np.searchsorted(comp, d) - 1)
        i = max(0, i)
        t = (d - comp[i]) / max(np.linalg.norm(seg[i]), 1e-6)
        p = pts[i] + seg[i] * t
        ang = math.degrees(math.atan2(seg[i][1], seg[i][0]))
        rx, ry = (elo, elo * 0.55) if k % 2 == 0 else (elo, elo * 0.22)
        mm = _elo(tela, p[0], p[1], rx, ry, ang, k % 2 == 0)
        if mm is not None:
            metal(tela, mm, material, raio=0.9, brilho=24, sombra=(k % 3 == 0))
        d += passo
        k += 1


def _elo(tela, cx, cy, rx, ry, ang, aberto):
    s = tela.ss
    img = Image.new('L', (int((rx + 3) * 2 * s), int((rx + 3) * 2 * s)), 0)
    d = ImageDraw.Draw(img)
    c = (rx + 3) * s
    box = [c - rx * s, c - ry * s, c + rx * s, c + ry * s]
    if aberto:
        d.ellipse(box, outline=255, width=max(1, int(rx * 0.38 * s)))
    else:
        d.ellipse(box, fill=255)
    img = img.rotate(-ang, resample=Image.BICUBIC)
    m = np.asarray(img, dtype=np.float32) / 255
    x0 = int(cx * s - c)
    y0 = int(cy * s - c)
    if x0 < 0 or y0 < 0:
        return None
    return m, x0, y0


SEDA = {
    'negra': rampa([(0, '#020203'), (0.35, '#0e0d12'), (0.6, '#24222c'), (0.82, '#4a4756'), (0.94, '#8d89a0'), (1, '#c9c6d8')]),
    'vinho': rampa([(0, '#100104'), (0.35, '#3a0711'), (0.6, '#6d1224'), (0.82, '#a52a42'), (1, '#e6909e')]),
}


def seda(tela: Tela, mm, tecido='negra', raio=9, dobras=None, sombra=True):
    """Seda/cetim: volume macio, faixa especular larga e dobras (linhas de luz/sombra desfocadas)."""
    if mm is None:
        return
    m, x0, y0 = mm
    s = tela.ss
    if sombra:
        contato(tela, mm, 2.4, 3.6, 0.6, 2.6)
    dif, esp, n = sombreamento(m, raio * s, 10, 1.4)
    faixa = 0.5 + 0.5 * np.sin(n[..., 0] * 5 + n[..., 1] * 3)
    v = 0.1 + 0.55 * dif + 0.2 * faixa ** 4 + esp * 0.45
    rgb = SEDA[tecido](v)
    tela.compor(rgb, m, x0, y0)
    for linha, claro in dobras or []:
        lm = traco(tela, linha, 1.6, 0.4)
        if lm:
            a = ndimage.gaussian_filter(lm[0], 1.2 * s)
            # restringe à máscara do tecido
            H, W = a.shape
            sub = np.zeros_like(a)
            oy, ox = lm[2] - y0, lm[1] - x0
            ys0, xs0 = max(0, -oy), max(0, -ox)
            ys1, xs1 = min(H, m.shape[0] - oy), min(W, m.shape[1] - ox)
            if ys1 > ys0 and xs1 > xs0:
                sub[ys0:ys1, xs0:xs1] = m[oy + ys0: oy + ys1, ox + xs0: ox + xs1]
            cor = np.array([0.85, 0.83, 0.95], np.float32) if claro else np.zeros(3, np.float32)
            tela.compor(np.broadcast_to(cor, a.shape + (3,)).astype(np.float32), np.clip(a * sub * (0.55 if claro else 0.7), 0, 1), lm[1], lm[2])


def perola(tela: Tela, cx, cy, r):
    mm = elipse(tela, cx, cy, r, r)
    if mm is None:
        return
    m, x0, y0 = mm
    s = tela.ss
    contato(tela, mm, 0.8, 1.2, 0.5, 1.0)
    dif, esp, n = sombreamento(m, r * s, 30)
    iris = 0.5 + 0.5 * np.sin(n[..., 0] * 4 + n[..., 1] * 2)
    base = lerp(np.array([0.78, 0.74, 0.8], np.float32), np.array([1, 0.98, 0.96], np.float32), dif[..., None])
    rgb = base + (iris * 0.06)[..., None] * np.array([1, 0.6, 0.9], np.float32) + esp[..., None] * 0.6
    tela.compor(np.clip(rgb, 0, 1.2), m, x0, y0)
