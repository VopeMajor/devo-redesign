#!/usr/bin/env python3
"""
Janela do rosto de CADA expressão dos NPCs, para os medalhões redondos (NpcMedallion).

A cabeça muda de lugar de uma pose para outra (inclina, ri para trás, apoia na mão), então uma janela fixa por NPC
deixava os rostos tortos no círculo. Aqui cada sprite é alinhado à pose de referência do NPC (cuja janela foi
conferida à mão): casamento de modelo (OpenCV, correlação normalizada) da parte de cima da janela — cabeça, cabelo,
chapéu — sobre alfa + luminância suavizados. O deslocamento achado move a janela; o lado continua o do NPC.

Saída: lib/devo/npc-rostos.json  { npc: { expressao: [cx, cy, lado] } }  (px da tela 1080×960 do sprite)
Uso:   python3 scripts/dev/rostos-npcs.py        (rodar de novo sempre que trocar um sprite)
Requer Pillow, numpy e opencv-python.
"""
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

RAIZ = Path(__file__).resolve().parents[2]
NPC = RAIZ / 'public/images/npc'
SAIDA = RAIZ / 'lib/devo/npc-rostos.json'

# Pose de referência e a janela dela (cx, cy, lado), conferidas à mão.
REFERENCIA = {
    'melissa': ('sorriso', (505, 335, 560)),
    'galo': ('neutro', (540, 335, 560)),
    'herdeiro': ('neutro', (545, 330, 560)),
    'coruja': ('neutro', (535, 330, 560)),
    'javali': ('neutro', (612, 375, 470)),
    'rato': ('sorriso', (415, 380, 560)),
}
# Meia largura do modelo (fração do lado): o Rato tem orelhas e cartola largas que confundem o casamento.
MEIA = {'rato': 0.26}
BUSCA = 260  # px de procura em volta da janela de referência


def camadas(npc: str, expr: str) -> np.ndarray:
    im = np.array(Image.open(NPC / npc / f'{expr}.webp').convert('RGBA')).astype(np.float32)
    a = im[:, :, 3] / 255
    lum = im[:, :, :3].mean(2) * a
    return cv2.GaussianBlur(np.dstack([a * 255, lum]).astype(np.float32), (0, 0), 3)


def main() -> None:
    out: dict[str, dict[str, list[int]]] = {}
    for npc, (ref, (cx, cy, lado)) in REFERENCIA.items():
        k = MEIA.get(npc, 0.36)
        x0, x1 = int(cx - lado * k), int(cx + lado * k)
        y0, y1 = max(0, int(cy - lado * 0.5)), int(cy + lado * 0.12)
        modelo = camadas(npc, ref)[y0:y1, x0:x1]
        celulas = json.loads((NPC / npc / 'manifest.json').read_text())['celulas'].values()
        out[npc] = {}
        for expr in celulas:
            f = camadas(npc, expr)
            sx0, sy0 = max(0, x0 - BUSCA), max(0, y0 - BUSCA)
            sx1, sy1 = min(f.shape[1], x1 + BUSCA), min(f.shape[0], y1 + BUSCA)
            res = cv2.matchTemplate(f[sy0:sy1, sx0:sx1], modelo, cv2.TM_CCOEFF_NORMED)
            _, nota, _, (lx, ly) = cv2.minMaxLoc(res)
            dx, dy = sx0 + lx - x0, sy0 + ly - y0
            out[npc][expr] = [int(cx + dx), int(cy + dy), lado]
            if nota < 0.6:
                print(f'  aviso: {npc}/{expr} casou mal ({nota:.2f}); confira o medalhão')
    linhas = ',\n'.join(f'  {json.dumps(n)}: {json.dumps(m, separators=(", ", ": "))}' for n, m in out.items())
    SAIDA.write_text('{\n' + linhas + '\n}\n')
    print('ok:', SAIDA.relative_to(RAIZ))


if __name__ == '__main__':
    main()
