"""Evento de Conflito, direção "Dossiê e Grimório": converte a arte de art-src/conflito2 para art/os/conflito.
Uso: python art-src/conflito2/processa.py (na pasta kit3)"""
import numpy as np
from PIL import Image

F = 'art-src/conflito2'
S = 'art/os/conflito'


def recorta(cel, lado_saida):
    """tira o fundo liso (mediana da borda) e devolve um quadrado centrado no objeto"""
    borda = np.concatenate([cel[:6].reshape(-1, 3), cel[-6:].reshape(-1, 3), cel[:, :6].reshape(-1, 3), cel[:, -6:].reshape(-1, 3)])
    fundo = np.median(borda, axis=0)
    al = np.clip((np.sqrt(((cel - fundo) ** 2).sum(-1)) - 14) / 40, 0, 1)
    rgb = np.clip((cel - fundo * (1 - al[..., None])) / np.maximum(al[..., None], 1e-3), 0, 255)
    img = Image.fromarray(np.dstack([rgb, al * 255]).astype(np.uint8), 'RGBA')
    bb = img.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()
    cx, cy, lado = (bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2, max(bb[2] - bb[0], bb[3] - bb[1]) * 1.06
    img = img.crop((int(cx - lado / 2), int(cy - lado / 2), int(cx + lado / 2), int(cy + lado / 2)))
    return img.resize((lado_saida, lado_saida), Image.LANCZOS)


def grade(arq, nomes, cols, rows, lado):
    a = np.asarray(Image.open(arq).convert('RGB')).astype(float)
    h, w = a.shape[:2]
    for i, nome in enumerate(nomes):
        r, c = divmod(i, cols)
        cel = a[round(r * h / rows):round((r + 1) * h / rows), round(c * w / cols):round((c + 1) * w / cols)]
        recorta(cel, lado).save(f'{S}/{nome}.webp', quality=88, method=6)


def chroma(arq, saida, altura):
    a = np.asarray(Image.open(arq).convert('RGB')).astype(float)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    al = np.clip(1 - ((g - np.maximum(r, b)) - 25) / 50, 0, 1)
    rgb = np.dstack([r, np.minimum(g, np.maximum(r, b) + 8), b])
    im = Image.fromarray(np.dstack([rgb, al * 255]).astype(np.uint8), 'RGBA')
    im = im.crop(im.getchannel('A').point(lambda v: 255 if v > 60 else 0).getbbox())
    im.resize((round(im.width * altura / im.height), altura), Image.LANCZOS).save(saida, quality=86, method=6)


Image.open(f'{F}/a/topo-vertical.png').convert('RGB').resize((900, 1350), Image.LANCZOS).save(f'{S}/topo-v.webp', quality=80, method=6)
Image.open(f'{F}/a/topo-largo.png').convert('RGB').resize((1400, 700), Image.LANCZOS).save(f'{S}/topo-h.webp', quality=80, method=6)
grade(f'{F}/a/brasoes.png', ['brasao-companhia', 'brasao-ordem'], 2, 1, 256)
recorta(np.asarray(Image.open(f'{F}/a/icone.png').convert('RGB')).astype(float), 256).save('art/os/ico/conflito.webp', quality=90, method=6)
chroma(f'{F}/b/agente-companhia.png', f'{S}/figura-companhia.webp', 900)
chroma(f'{F}/b/ocultista-ordem.png', f'{S}/figura-ordem.webp', 900)
for t in ['dossie', 'grimorio', 'aco', 'veludo']:
    Image.open(f'{F}/c/{t}.png').convert('RGB').resize((512, 512), Image.LANCZOS).save(f'{S}/tex-{t}.webp', quality=78, method=6)
grade(f'{F}/d/objetos-1.png', ['sigilo', 'placa', 'placa-acesa', 'vela', 'vela-acesa', 'pedestal-companhia', 'pedestal-ordem',
                               'esgotado-companhia', 'esgotado-ordem', 'credencial', 'lacre', 'ficha-companhia'], 4, 3, 192)
grade(f'{F}/d/objetos-2.png', ['ficha-ordem', 'p-tempo', 'p-dracma', 'p-pacote', 'p-musica', 'p-fragmento', 'p-moldura', 'p-carta'], 4, 2, 128)
print('ok')
