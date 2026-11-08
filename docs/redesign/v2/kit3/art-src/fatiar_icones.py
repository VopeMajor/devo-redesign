"""Fatia as duas folhas 3x3 de ícones (fundo azul liso) em art/os/ico/<id>.webp com transparência.
Uso: python art-src/fatiar_icones.py <pasta-das-folhas> (na pasta kit3)"""
import sys
import numpy as np
from PIL import Image

NOMES = [['record', 'mensagens', 'cartas', 'pulso', 'casa', 'inventario', 'trocas', 'calendario', 'torres'],
         ['poco', 'salao', 'jogos', 'corporacoes', 'virtudes', 'arcanos', 'ajustes', 'mesa', 'sino']]


def maior_trecho(ocup, folga=8):
    # maior sequência de linhas (ou colunas) ocupadas, aceitando buracos pequenos: some o que vazou da vizinha
    runs, ini, vazio, fim = [], None, 0, 0
    for i, o in enumerate(ocup):
        if o:
            ini = i if ini is None else ini
            vazio, fim = 0, i
        elif ini is not None:
            vazio += 1
            if vazio > folga:
                runs.append((ini, fim))
                ini = None
    if ini is not None:
        runs.append((ini, fim))
    return max(runs, key=lambda r: r[1] - r[0])


pasta = sys.argv[1]
for folha, nomes in zip(['icones-1', 'icones-2'], NOMES):
    a = np.asarray(Image.open(f'{pasta}/{folha}.png').convert('RGB')).astype(float)
    c = a.shape[1] / 3
    for k, nome in enumerate(nomes):
        x0, y0 = int(round((k % 3) * c)), int(round((k // 3) * c))
        cel = a[y0:int(round(y0 + c)), x0:int(round(x0 + c))]
        borda = np.concatenate([cel[:6].reshape(-1, 3), cel[-6:].reshape(-1, 3), cel[:, :6].reshape(-1, 3), cel[:, -6:].reshape(-1, 3)])
        fundo = np.median(borda, axis=0)
        al = np.clip((np.sqrt(((cel - fundo) ** 2).sum(-1)) - 14) / 40, 0, 1)
        for _ in range(2):
            forte = al > 0.35
            r0, r1 = maior_trecho(forte.sum(1) > 2)
            c0, c1 = maior_trecho(forte.sum(0) > 2)
            m = np.zeros_like(al)
            m[max(0, r0 - 6):r1 + 7, max(0, c0 - 6):c1 + 7] = 1
            al = al * m
        # tira o azul do fundo das bordas semitransparentes
        rgb = np.clip((cel - fundo * (1 - al[..., None])) / np.maximum(al[..., None], 1e-3), 0, 255)
        img = Image.fromarray(np.dstack([rgb, al * 255]).astype(np.uint8), 'RGBA')
        bb = img.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()
        cx, cy, lado = (bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2, max(bb[2] - bb[0], bb[3] - bb[1]) * 1.06
        img = img.crop((int(cx - lado / 2), int(cy - lado / 2), int(cx + lado / 2), int(cy + lado / 2)))
        img.resize((256, 256), Image.LANCZOS).save(f'art/os/ico/{nome}.webp', quality=90, method=6)
print('ok')
