"""Gera o enquadramento do rosto de cada NPC por EXPRESSÃO para o medalhão redondo (kit/npc-anchor).

O rosto muda de lugar entre expressões (o Rato tira a cartola, o Javali inclina a cabeça, o Galo põe a mão
no cabelo), então uma janela só por NPC cortava cabelo/chapéu em algumas poses. Para cada sprite:
  topo  = primeira linha com desenho (cabelo, chapéu, chifre);
  cx    = mediana do centro da faixa contínua mais larga de cada linha, nos primeiros ~260 px da cabeça
          (mãos levantadas ficam fora da faixa principal);
  cy    = topo + MARGEM + lado/2 − folga, com o lado por NPC (cabeça inteira + gola, sem tronco).
As ilustrações não são alteradas: só o recorte.

Uso: python3 -I scripts/dev/rostos-npc.py components/devo/kit/npc-rostos.ts
"""
import json
import os
import sys

import numpy as np
from PIL import Image

RAIZ = 'public/images/npc'
# lado da janela (px da tela 1080×960) e respiro acima do topo, por NPC
LADO = {'melissa': 560, 'galo': 600, 'herdeiro': 560, 'coruja': 560, 'javali': 520, 'rato': 560}
RESPIRO = {'melissa': 34, 'galo': 40, 'herdeiro': 34, 'coruja': 34, 'javali': 36, 'rato': 30}


def rosto(caminho, npc):
    a = np.asarray(Image.open(caminho).convert('RGBA'))[..., 3] > 40
    ys = np.nonzero(a.any(1))[0]
    topo = int(ys.min())
    centros = []
    for y in range(topo + 20, min(topo + 260, a.shape[0])):
        xs = np.nonzero(a[y])[0]
        if xs.size == 0:
            continue
        # faixas contínuas; fica a mais larga
        quebras = np.nonzero(np.diff(xs) > 6)[0]
        ini = np.concatenate(([0], quebras + 1))
        fim = np.concatenate((quebras, [xs.size - 1]))
        k = int(np.argmax(xs[fim] - xs[ini]))
        centros.append((xs[ini[k]] + xs[fim[k]]) / 2)
    cx = int(np.median(centros)) if centros else 540
    lado = LADO.get(npc, 560)
    y0 = max(0, topo - RESPIRO.get(npc, 34))
    cy = y0 + lado // 2
    x0 = min(max(cx - lado // 2, 0), 1080 - lado)
    return [x0 + lado // 2, cy, lado]


def main(out):
    tabela = {}
    for npc in sorted(os.listdir(RAIZ)):
        d = os.path.join(RAIZ, npc)
        if not os.path.isdir(d):
            continue
        poses = {}
        for f in sorted(os.listdir(d)):
            if f.endswith('.webp'):
                poses[f[:-5]] = rosto(os.path.join(d, f), npc)
        if poses:
            tabela[npc] = poses
    corpo = json.dumps(tabela, ensure_ascii=False, indent=2)
    with open(out, 'w', encoding='utf8') as fh:
        fh.write('/* Gerado por scripts/dev/rostos-npc.py — não editar à mão. Janela do rosto [cx, cy, lado] por NPC e\n')
        fh.write('   expressão, em px da tela do sprite (1080×960), para o medalhão redondo (NpcMedallion). */\n')
        fh.write(f'export const ROSTOS: Record<string, Record<string, [number, number, number]>> = {corpo}\n')
    print(out, sum(len(v) for v in tabela.values()), 'poses')


main(sys.argv[1] if len(sys.argv) > 1 else 'components/devo/kit/npc-rostos.ts')
