"""Prova do chibi fofo (dono, 07/11: "deixe eles mais bonitinhos. estilo ddtank"): fatia as 4 vistas geradas, reduz
para pixel de verdade na altura do jogo (72 px, célula 80x96) e monta a comparação com o chibi atual no piso da Casa.
Uso: python -I prova.py <captura-da-casa.png>"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image
sys.path.insert(0, str(Path(sys.argv[0]).resolve().parent))  # -I tira a pasta do script do caminho
from retoque import retoca
AQUI = Path(sys.argv[0]).resolve().parent
ALT = 72

def mascara(a):
    return (a[..., 1] - np.maximum(a[..., 0], a[..., 2])) < 60

def reduz(c, m, esc):
    h, w = m.shape
    nh, nw = max(1, round(h * esc)), max(1, round(w * esc))
    s = np.zeros((nh, nw, 4), np.uint8)
    ys = np.linspace(0, h, nh + 1).round().astype(int); xs = np.linspace(0, w, nw + 1).round().astype(int)
    for j in range(nh):
        for i in range(nw):
            bm = m[ys[j]:ys[j + 1], xs[i]:xs[i + 1]]
            if bm.size == 0 or bm.mean() < .5:
                continue
            px = c[ys[j]:ys[j + 1], xs[i]:xs[i + 1]][bm]
            s[j, i, :3] = np.median(px, axis=0); s[j, i, 3] = 255
    return s

def vistas(nome):
    a = np.asarray(Image.open(AQUI / nome / f'fofo-{nome}.png').convert('RGB')).astype(np.int16)
    m = mascara(a)
    cols = np.where(m.any(0))[0]
    gs = [g for g in np.split(cols, np.where(np.diff(cols) > 4)[0] + 1) if len(g) > 80]
    ys = np.where(m.any(1))[0]; alt = ys[-1] - ys[0] + 1
    esc = ALT / alt
    out = []
    for g in gs[:4]:
        sub = m[:, g[0]:g[-1] + 1]; yy = np.where(sub.any(1))[0]
        q = reduz(a[yy[0]:yy[-1] + 1, g[0]:g[-1] + 1].astype(np.uint8), sub[yy[0]:yy[-1] + 1], esc)
        out.append(q)
    return out

def cola(fundo, q, x, y, z):
    im = Image.fromarray(q, 'RGBA'); im = im.resize((im.width * z, im.height * z), Image.NEAREST)
    fundo.paste(im, (x - im.width // 2, y - im.height), im)

if __name__ == '__main__':
    A, B = vistas('a'), vistas('b')
    for nome, vs in (('a', A), ('b', B)):
        folha = Image.new('RGBA', (80 * 4, 96), (0, 0, 0, 0))
        for k, q in enumerate(vs):
            x0, y0 = 40 - q.shape[1] // 2, 94 - q.shape[0]
            vs[k] = q = retoca(q, nome, k, y0, x0)
            im = Image.fromarray(q, 'RGBA'); folha.paste(im, (80 * k + x0, y0), im)
        folha.save(AQUI / f'fofo-{nome}-pixel.png')
    cap = Image.open(sys.argv[1]).convert('RGBA')
    # 1) no mapa, na escala do jogo (captura em 2x): o atual de casaco vermelho e as duas provas ao lado
    cena = cap.crop((150, 560, 780, 1000)).copy()
    chao = 940 - 560
    from PIL import ImageDraw
    sd = Image.new('RGBA', cena.size, (0, 0, 0, 0)); d = ImageDraw.Draw(sd)
    for cx in (390, 560):  # sombra de contato, como a do jogo (.sombra), mais escura que o piso
        d.ellipse((cx - 40, chao - 6 - 12, cx + 40, chao - 6 + 12), fill=(5, 2, 10, 140))
    cena.alpha_composite(sd)
    cola(cena, A[0], 390, chao - 6, 2); cola(cena, B[0], 560, chao - 6, 2)
    cena.save(AQUI / 'prova-no-mapa.png')
    # 2) prancha ampliada: atual x novo, 4 vistas, 4x
    atual = Image.open(AQUI / 'a' / 'atual.png').convert('RGBA')
    Z = 4; W = 80 * 4 * Z
    pr = Image.new('RGBA', (W, 96 * Z * 2 + 40), (46, 40, 58, 255))
    for linha, vs in enumerate((A, B)):
        for k, q in enumerate(vs):
            cola(pr, q, 80 * Z * k + 40 * Z, 96 * Z * (linha + 1) + 20 * linha, Z)
    pr.save(AQUI / 'prova-vistas.png')
    print('ok', [q.shape[:2] for q in A], [q.shape[:2] for q in B])
