"""Versão holograma de um chibi de NPC (melissa.md §7 e revisão do elenco: o holograma é a mesma figura com tratamento
de luz). Cada pixel vira um tom do azul de projeção pela luminância (rampa de 4 tons, sem degradê), as linhas pares
ficam mais transparentes (varredura) e a borda ganha 1 px de azul-claro. Pixel inteiro, nada de desfoque.
Uso: python -I art-src/holo_chibi.py melissa  →  art/npc-chibi/melissa-holo.png"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image

AQUI = Path(sys.argv[0]).resolve().parent
ART = AQUI.parent / 'art' / 'npc-chibi'
RAMPA = np.array([[23, 32, 106], [43, 67, 184], [74, 108, 240], [157, 178, 255]], np.uint8)  # #17206A #2B43B8 #4A6CF0 #9DB2FF
for nome in sys.argv[1:] or ['melissa']:
    a = np.asarray(Image.open(ART / f'{nome}.png').convert('RGBA')).astype(int)
    al = a[..., 3] > 0
    lum = .3 * a[..., 0] + .59 * a[..., 1] + .11 * a[..., 2]
    t = np.digitize(lum, [45, 100, 170])
    out = np.zeros(a.shape, np.uint8)
    out[..., :3] = RAMPA[t]
    out[..., 3] = np.where(al, 215, 0)
    out[1::2, :, 3] = np.where(al[1::2], 120, 0)
    # contorno: pixel opaco com vizinho vazio vira a luz da projeção
    viz = np.zeros_like(al)
    viz[1:] |= ~al[:-1]; viz[:-1] |= ~al[1:]; viz[:, 1:] |= ~al[:, :-1]; viz[:, :-1] |= ~al[:, 1:]
    borda = al & viz
    out[borda, :3] = RAMPA[3]; out[borda, 3] = 235
    # a rosa azul é o ponto de luz mais forte da figura
    rosa = al & (a[..., 2] > a[..., 0] + 60) & (a[..., 2] > a[..., 1] + 40)
    out[rosa, :3] = (226, 234, 255); out[rosa, 3] = 245
    Image.fromarray(out, 'RGBA').save(ART / f'{nome}-holo.png', optimize=True)
    print('ok', nome)
