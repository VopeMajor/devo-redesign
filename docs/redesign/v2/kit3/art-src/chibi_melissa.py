"""Fatia a folha do chibi em quadros de pixel real, alinhados pelos pés, e monta a folha final e o GIF andando.
Uso: python -I chibi_melissa.py"""
from pathlib import Path
import sys
import numpy as np
from PIL import Image, ImageEnhance

AQUI = Path(sys.argv[0]).resolve().parent
ART = AQUI.parent / "art"
PX, CELULA, ZOOM = 4, 80, 3

im = Image.open(AQUI / "chibi-melissa-v4.png").convert("RGB")
a = np.asarray(im).astype(np.int16)
mas = (a[..., 1] - np.maximum(a[..., 0], a[..., 2])) < 60
print("folha", im.size)
linhas = np.where(mas.sum(1) > 0)[0]
fil = [g for g in np.split(linhas, np.where(np.diff(linhas) > 6)[0] + 1) if len(g) > 60][:4]
assert len(fil) == 4, len(fil)
quadros = []
for g in fil:
    cols = np.where(mas[g[0]:g[-1] + 1].sum(0) > 0)[0]
    blocos = [b for b in np.split(cols, np.where(np.diff(cols) > 6)[0] + 1) if len(b) > 60][:4]
    assert len(blocos) == 4, len(blocos)
    linha = []
    for b in blocos:
        c = a[g[0]:g[-1] + 1, b[0]:b[-1] + 1].astype(np.uint8)
        m = mas[g[0]:g[-1] + 1, b[0]:b[-1] + 1]
        h, w = m.shape
        nh, nw = h // PX, w // PX
        s = np.zeros((nh, nw, 4), np.uint8)
        for j in range(nh):
            for i in range(nw):
                bm = m[j * PX:(j + 1) * PX, i * PX:(i + 1) * PX]
                if bm.mean() < 0.5:
                    continue
                px = c[j * PX:(j + 1) * PX, i * PX:(i + 1) * PX][bm].astype(np.int16)
                # o violeta dos olhos é pequeno e sumiria na mediana, então tem prioridade
                vio = (px[:, 2] > px[:, 1] + 25) & (px[:, 0] > px[:, 1] + 8) & (px[:, 0] > 90)
                s[j, i, :3] = np.median(px[vio], axis=0) if vio.mean() >= 0.2 else np.median(px, axis=0)
                s[j, i, 3] = 255
        linha.append(Image.fromarray(s, "RGBA"))
    quadros.append(linha)

# paleta única para todos os quadros
todos = Image.new("RGB", (CELULA * 4, CELULA * 4), (0, 255, 0))
folha = Image.new("RGBA", (CELULA * 4, CELULA * 4), (0, 0, 0, 0))
for l, linha in enumerate(quadros):
    for k, q in enumerate(linha):
        # alinha pela cabeça, que fica parada enquanto as pernas e a saia mudam de largura
        cabeca = np.where(np.asarray(q)[:q.height // 3, :, 3].sum(0) > 0)[0]
        centro = (cabeca[0] + cabeca[-1]) // 2
        x, y = CELULA * k + CELULA // 2 - centro, CELULA * l + CELULA - q.height
        folha.paste(q, (x, y), q)
print("maior quadro", max(q.height for li in quadros for q in li), max(q.width for li in quadros for q in li))
rgb = folha.convert("RGB").quantize(64, method=Image.MEDIANCUT, dither=Image.NONE).convert("RGBA")
rgb.putalpha(folha.getchannel("A"))
# a redução de cores puxa a íris para o cinza: o violeta volta do quadro original, reforçado
ori = np.asarray(folha).astype(np.int16)
fin = np.asarray(rgb).copy()
vio = (ori[..., 3] > 0) & (ori[..., 2] > ori[..., 1] + 14) & (ori[..., 0] > ori[..., 1] + 3) & (ori[..., 0] > 80)
# só na faixa dos olhos de cada quadro, para não pintar punhos nem a barra do casaco
faixa = np.zeros(vio.shape, bool)
for l in range(4):
    faixa[CELULA * l + 22:CELULA * l + 38] = True
vio &= faixa
fin[vio, 0], fin[vio, 1], fin[vio, 2] = 150, 118, 222
print("pixels violeta", int(vio.sum()))
folha = Image.fromarray(fin, "RGBA")
folha.save(ART / "chibi-melissa.png")

fundo = Image.open(ART / "quarto.webp").convert("RGB")
fundo = ImageEnhance.Brightness(fundo.crop((560, 380, 1000, 700))).enhance(0.9)
W, H = fundo.size
frames, passo = [], 0
# anda em quadrado: baixo, direita, cima, esquerda
rota = [(0, 0, 4), (2, 4, 0), (3, 0, -4), (1, -4, 0)]
x, y = 170, 110
for fil_i, dx, dy in rota:
    for n in range(12):
        c = folha.crop((CELULA * (n % 4), CELULA * fil_i, CELULA * (n % 4 + 1), CELULA * (fil_i + 1)))
        f = fundo.copy()
        z = c.resize((CELULA * 2, CELULA * 2), Image.NEAREST)
        f.paste(z, (x, y), z)
        frames.append(f.convert("P", palette=Image.ADAPTIVE, colors=200))
        x += dx
        y += dy
frames[0].save(AQUI.parent / "chibi-melissa-andando.gif", save_all=True, append_images=frames[1:], duration=130, loop=0)
p = Image.new("RGB", folha.size, (70, 60, 84))
p.paste(folha, (0, 0), folha)
p.resize((folha.width * ZOOM, folha.height * ZOOM), Image.NEAREST).save(AQUI.parent / "chibi-melissa-folha.png")
