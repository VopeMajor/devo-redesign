"""Evento de Conflito: arte de capa, ícone do app e itens da Loja de Karma (fundo azul liso) para o protótipo.
Uso: python art-src/conflito/processa.py (na pasta kit3)"""
import os
import numpy as np
from PIL import Image

AQUI = 'art-src/conflito'
os.makedirs('art/os/conflito', exist_ok=True)


def recorta(cel, lado_saida):
    """tira o fundo liso (mediana da borda) com bordas suaves e devolve um quadrado centrado no objeto"""
    borda = np.concatenate([cel[:6].reshape(-1, 3), cel[-6:].reshape(-1, 3), cel[:, :6].reshape(-1, 3), cel[:, -6:].reshape(-1, 3)])
    fundo = np.median(borda, axis=0)
    al = np.clip((np.sqrt(((cel - fundo) ** 2).sum(-1)) - 14) / 40, 0, 1)
    rgb = np.clip((cel - fundo * (1 - al[..., None])) / np.maximum(al[..., None], 1e-3), 0, 255)
    img = Image.fromarray(np.dstack([rgb, al * 255]).astype(np.uint8), 'RGBA')
    bb = img.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()
    cx, cy, lado = (bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2, max(bb[2] - bb[0], bb[3] - bb[1]) * 1.06
    img = img.crop((int(cx - lado / 2), int(cy - lado / 2), int(cx + lado / 2), int(cy + lado / 2)))
    return img.resize((lado_saida, lado_saida), Image.LANCZOS)


capa = Image.open(f'{AQUI}/conflito-arte.png').convert('RGB')
capa.resize((1200, 800), Image.LANCZOS).save('art/os/conflito/arte.webp', quality=82, method=6)

ico = np.asarray(Image.open(f'{AQUI}/conflito-icone.png').convert('RGB')).astype(float)
recorta(ico, 256).save('art/os/ico/conflito.webp', quality=90, method=6)

ITENS = [['melissa-brinquedo', 'chiclete-azul', 'pacote-campainha', 'moldura-companhia'],
         ['decoracao-patinho', 'fragmento-companhia', 'amuleto-melissa', 'pastilha-carmesim'],
         ['pacote-reliquias', 'selo-ordem', 'decoracao-corvo', 'fragmento-ordem']]
loja = np.asarray(Image.open(f'{AQUI}/conflito-loja.png').convert('RGB')).astype(float)
h, w = loja.shape[:2]
for r, linha in enumerate(ITENS):
    for c, nome in enumerate(linha):
        cel = loja[round(r * h / 3):round((r + 1) * h / 3), round(c * w / 4):round((c + 1) * w / 4)]
        recorta(cel, 192).save(f'art/os/conflito/loja-{nome}.webp', quality=88, method=6)
print('ok')
