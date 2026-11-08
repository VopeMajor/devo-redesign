"""Acertos do crítico na prova (07/11): boca calma, segundo brilho no olho, cabelo sem ruído, sem a borda lilás e o
verde que sobraram do fundo, contorno cinza-malva no cabelo claro, realce no topo das botas."""
import numpy as np

def lum(c):
    return .3 * c[..., 0] + .59 * c[..., 1] + .11 * c[..., 2]

def borda(al):
    v = np.zeros_like(al)
    v[1:] |= ~al[:-1]; v[:-1] |= ~al[1:]; v[:, 1:] |= ~al[:, :-1]; v[:, :-1] |= ~al[:, 1:]
    v[0, :] = True; v[-1, :] = True; v[:, 0] = True; v[:, -1] = True
    return al & v

def retoca(q, nome, k, y0, x0):
    """q: vista reduzida (h, w, 4); (x0, y0): canto dela na célula de 80x96 (para usar as coordenadas medidas)"""
    q = q.copy(); a = q.astype(int); al = q[..., 3] > 0
    # 1. sobras do fundo na borda: verde (croma) e o lilás claro só de um lado → saem
    for _ in range(3):
        a = q.astype(int); al = q[..., 3] > 0; b = borda(al)
        verde = (a[..., 1] > a[..., 0] + 10) & (a[..., 1] > a[..., 2] + 10)
        lilas = (a[..., 2] > a[..., 1] + 25) & (a[..., 0] > a[..., 1] + 15) & (lum(a) > 110)
        q[b & (verde | lilas), 3] = 0
    a = q.astype(int); al = q[..., 3] > 0
    # 2. pixel solto (opaco com 0 ou 1 vizinho opaco) sai; ruído de cabelo: cor muito diferente dos 4 vizinhos vira a mediana
    h, w = al.shape
    for y in range(h):
        for x in range(w):
            if not al[y, x]:
                continue
            viz = [(y + dy, x + dx) for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)) if 0 <= y + dy < h and 0 <= x + dx < w and al[y + dy, x + dx]]
            if len(viz) <= 1:
                q[y, x, 3] = 0; continue
            if nome == 'a' and y < h * .62 and len(viz) == 4:
                c = a[y, x, :3]; cs = np.array([a[p][:3] for p in viz])
                pele = c[0] - c[2] > 40 and lum(c[None])[0] > 150
                if not pele and np.abs(cs - c).sum(1).min() > 60:
                    q[y, x, :3] = np.median(cs, 0)
    a = q.astype(int); al = q[..., 3] > 0; b = borda(al)
    # 3. contorno do cabelo claro: quase preto encostado no platinado vira cinza-malva
    if nome == 'b':
        claro = lum(a) > 170
        perto = np.zeros_like(claro); perto[1:] |= claro[:-1]; perto[:-1] |= claro[1:]; perto[:, 1:] |= claro[:, :-1]; perto[:, :-1] |= claro[:, 1:]
        sel = b & (lum(a) < 70) & perto
        sel[int(h * .55):] = False
        q[sel, :3] = (118, 104, 120)
    # 4. botas: o pixel escuro mais alto de cada coluna nas 6 linhas de baixo ganha 1 tom
    for x in range(w):
        col = [y for y in range(h - 6, h) if al[y, x] and lum(a[y, x][None])[0] < 75]
        if col and (col[0] == 0 or not (al[col[0] - 1, x] and lum(a[col[0] - 1, x][None])[0] < 75)):
            q[col[0], x, :3] = np.clip(a[col[0], x, :3] + 34, 0, 255)
    # 5. rosto de frente: boca calma (traço de 2 px) e o segundo brilho do olho (medidos na célula)
    def px(cx, cy, cor):
        y, x = cy - y0, cx - x0
        if 0 <= y < h and 0 <= x < w and q[y, x, 3]:
            q[y, x, :3] = cor
    if k == 0:
        pele = (247, 205, 178) if nome == 'a' else (250, 214, 196)
        if nome == 'a':
            for x in (40, 41, 42): px(x, 57, pele)
            px(40, 57, (128, 70, 66)); px(41, 57, (128, 70, 66))
            px(32, 53, (240, 232, 228)); px(50, 53, (240, 232, 228))
        else:
            for x in (39, 40): px(x, 56, pele); px(x, 57, pele)
            px(39, 57, (140, 78, 76)); px(40, 57, (140, 78, 76))
    return q
