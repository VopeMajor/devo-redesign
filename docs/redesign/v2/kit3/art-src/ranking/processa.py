"""Ranking Geral da Temporada, direção "O Relógio dos Autômatos": converte a arte de art-src/ranking para art/os/ranking.
Uso: python art-src/ranking/processa.py (na pasta kit3)"""
import os
import subprocess
import sys
import numpy as np
from PIL import Image

F = 'art-src/ranking'
S = 'art/os/ranking'
os.makedirs(S, exist_ok=True)


def recorta(cel, lado_saida):
    """tira o fundo liso (mediana da borda) e devolve um quadrado centrado no objeto"""
    borda = np.concatenate([cel[:6].reshape(-1, 3), cel[-6:].reshape(-1, 3), cel[:, :6].reshape(-1, 3), cel[:, -6:].reshape(-1, 3)])
    fundo = np.median(borda, axis=0)
    al = np.clip((np.sqrt(((cel - fundo) ** 2).sum(-1)) - 14) / 40, 0, 1)
    rgb = np.clip((cel - fundo * (1 - al[..., None])) / np.maximum(al[..., None], 1e-3), 0, 255)
    img = Image.fromarray(np.dstack([rgb, al * 255]).astype(np.uint8), 'RGBA')
    bb = img.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()
    cx, cy, lado = (bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2, max(bb[2] - bb[0], bb[3] - bb[1]) * 1.04
    img = img.crop((int(cx - lado / 2), int(cy - lado / 2), int(cx + lado / 2), int(cy + lado / 2)))
    return img.resize((lado_saida, lado_saida), Image.LANCZOS)


def grade(arq, nomes, cols, rows, lado):
    a = np.asarray(Image.open(arq).convert('RGB')).astype(float)
    h, w = a.shape[:2]
    for i, nome in enumerate(nomes):
        r, c = divmod(i, cols)
        cel = a[round(r * h / rows):round((r + 1) * h / rows), round(c * w / cols):round((c + 1) * w / cols)]
        recorta(cel, lado).save(f'{S}/{nome}.webp', quality=88, method=6)


Image.open(f'{F}/a/topo-v.png').convert('RGB').resize((900, 1350), Image.LANCZOS).save(f'{S}/topo-v.webp', quality=80, method=6)
Image.open(f'{F}/a/topo-h.png').convert('RGB').resize((1400, 933), Image.LANCZOS).save(f'{S}/topo-h.webp', quality=80, method=6)
recorta(np.asarray(Image.open(f'{F}/a/mostrador.png').convert('RGB')).astype(float), 512).save(f'{S}/mostrador.webp', quality=88, method=6)
# o ponteiro precisa girar no pino, que o gerador pôs no meio da imagem: recorta um quadrado centrado no próprio meio
p = np.asarray(Image.open(f'{F}/a/ponteiro.png').convert('RGB')).astype(float)
borda = np.concatenate([p[:6].reshape(-1, 3), p[-6:].reshape(-1, 3)])
fundo = np.median(borda, axis=0)
al = np.clip((np.sqrt(((p - fundo) ** 2).sum(-1)) - 14) / 40, 0, 1)
rgb = np.clip((p - fundo * (1 - al[..., None])) / np.maximum(al[..., None], 1e-3), 0, 255)
im = Image.fromarray(np.dstack([rgb, al * 255]).astype(np.uint8), 'RGBA')
ys = np.where((al > .5).any(1))[0]
xs = np.where((al > .5).any(0))[0]
# pino = o anel do meio da haste (linha onde a haste é mais larga entre 40% e 60% da altura do desenho)
alt = ys.max() - ys.min()
faixa = range(ys.min() + int(alt * .35), ys.min() + int(alt * .75))
larg = {y: (al[y] > .5).sum() for y in faixa}
py = max(larg, key=larg.get)
px = (xs.min() + xs.max()) / 2
r = max(py - ys.min(), ys.max() - py) + 8
im.crop((int(px - r), int(py - r), int(px + r), int(py + r))).resize((512, 512), Image.LANCZOS).save(f'{S}/ponteiro.webp', quality=88, method=6)

for t in ['bronze', 'pedra']:
    Image.open(f'{F}/d/{t}.png').convert('RGB').resize((512, 512), Image.LANCZOS).save(f'{S}/tex-{t}.webp', quality=78, method=6)
fo = Image.open(f'{F}/d/fotos.png').convert('RGB')
w, h = fo.size
for i in range(12):
    r_, c = divmod(i, 4)
    cel = fo.crop((round(c * w / 4), round(r_ * h / 3), round((c + 1) * w / 4), round((r_ + 1) * h / 3)))
    lado = min(cel.size)
    cel.crop(((cel.width - lado) // 2, 0, (cel.width - lado) // 2 + lado, lado)).resize((192, 192), Image.LANCZOS).save(f'{S}/foto-{i + 1}.webp', quality=82, method=6)

grade(f'{F}/c/objetos-1.png', ['nicho', 'portas', 'pedestal-1', 'pedestal-2', 'pedestal-3', 'anel-1', 'anel-2', 'anel-3', 'lapide-1', 'lapide-2', 'lapide-3', 'coroa'], 4, 3, 256)
grade(f'{F}/c/objetos-2.png', ['fita', 'cranio', 'u-votos', 'u-cartas', 'u-tempo', 'u-mortes', 'u-eliminacoes', 'plaqueta', 'lampiao', 'sino', 'trilho', 'selo'], 4, 3, 192)

cp = [sys.executable, 'art-src/corta_poses.py']
subprocess.run(cp + [f'{F}/b/automatos-1.png', '520', S + '/aut-{}.png', 'votos', 'cartas', 'tempo'], check=True)
subprocess.run(cp + [f'{F}/b/automatos-2.png', '520', S + '/aut-{}.png', 'mortes', 'mortes-b', 'eliminacoes'], check=True)
for n in ['votos', 'cartas', 'tempo', 'mortes', 'mortes-b', 'eliminacoes']:
    a = Image.open(f'{S}/aut-{n}.png'); a.save(f'{S}/aut-{n}.webp', quality=88, method=6); os.remove(f'{S}/aut-{n}.png')
print('ok')
