"""Cria camadas de piscar e de boca fechada a partir das 12 poses aprovadas, sem gerar rosto novo.
Saída: art/anim/<pose>-pisca.png e <pose>-boca.png (mesmo tamanho da pose) e anim.json.
Uso: python -I anima_melissa.py"""
from pathlib import Path
import json
import math
import sys
import numpy as np
from PIL import Image

AQUI = Path(sys.argv[0]).resolve().parent
ART = AQUI.parent / "art"
SAI = ART / "anim"
SAI.mkdir(exist_ok=True)
NOMES = ["convite", "explica", "riso", "preocupado", "pensativo", "timido", "confiante", "surpreso", "animado", "apresenta", "triste", "sorriso"]
CILIO, BOCA = (42, 26, 40, 255), (138, 74, 72, 255)


def componentes(m):
    vistos = np.zeros_like(m)
    saida = []
    for j, k in zip(*np.where(m)):
        if vistos[j, k]:
            continue
        pilha, c = [(j, k)], []
        while pilha:
            y, x = pilha.pop()
            if not (0 <= y < m.shape[0] and 0 <= x < m.shape[1]) or vistos[y, x] or not m[y, x]:
                continue
            vistos[y, x] = True
            c.append((y, x))
            pilha += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1), (y + 1, x + 1), (y - 1, x - 1), (y + 1, x - 1), (y - 1, x + 1)]
        saida.append(c)
    return sorted(saida, key=len, reverse=True)


info = {}
for nome in NOMES:
    im = Image.open(ART / f"melissa-q-{nome}.png").convert("RGBA")
    a = np.asarray(im).astype(int)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    H, W = r.shape
    lim = np.zeros_like(al, bool)
    lim[:135] = True
    lum = 0.3 * r + 0.59 * g + 0.11 * b
    registro = {"pisca": False, "boca": False}
    # cor da pele do próprio rosto, para os remendos não aparecerem
    mp = lim & (al > 0) & (r - b > 40) & (r > 200)
    pele = tuple(int(v) for v in np.median(a[mp][:, :3], axis=0)) + (255,)

    # olhos: violeta da íris, separado do cobalto da rosa
    vio = lim & (al > 0) & (b > g + 18) & (r > g + 2) & (r > 70) & (b > 95)
    comp = [c for c in componentes(vio) if len(c) >= 12][:2]
    if len(comp) == 2:
        cs = sorted(([np.mean([p[1] for p in c]), np.mean([p[0] for p in c])] for c in comp))
        ang = math.atan2(cs[1][1] - cs[0][1], cs[1][0] - cs[0][0])
        ca, sa = math.cos(ang), math.sin(ang)
        cam = np.zeros((H, W, 4), np.uint8)
        for cx, cy in cs:
            for y in range(int(cy) - 12, int(cy) + 11):
                for x in range(int(cx) - 20, int(cx) + 21):
                    u = (x - cx) * ca + (y - cy) * sa
                    v = -(x - cx) * sa + (y - cy) * ca
                    dentro = (u / 18) ** 2 + ((v - 0.5) / 9.5) ** 2 <= 1
                    franja = lum[y, x] > 190 and (r[y, x] - b[y, x]) < 40 and v < -5
                    if dentro and al[y, x] > 0 and not franja:
                        cam[y, x] = pele
            # pálpebra fechada: linha contínua de 2 pixels, curvada para baixo no meio
            for u10 in range(-150, 151):
                u = u10 / 10
                v = 1 + 2.5 * (1 - (u / 15) ** 2)
                x, y = cx + u * ca - v * sa, cy + u * sa + v * ca
                xi, yi = int(round(x)), int(round(y))
                cam[yi, xi] = CILIO
                cam[yi - 1, xi] = CILIO
        Image.fromarray(cam, "RGBA").save(SAI / f"{nome}-pisca.png")
        registro["pisca"] = True

    # boca: maior mancha avermelhada no rosto; se for aberta, a camada fecha a boca
    verm = lim & (al > 0) & (r > 120) & (r - g > 55) & (g < 140) & (b < 130)
    mb = componentes(verm)
    if mb and len(mb[0]) >= 18:
        ys, xs = zip(*mb[0])
        x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        cam = np.zeros((H, W, 4), np.uint8)
        for y in range(y0 - 3, y1 + 4):
            for x in range(x0 - 3, x1 + 4):
                if al[y, x] > 0:
                    cam[y, x] = pele
        for u in range(-5, 6):
            cam[int(round(cy - 0.08 * u * u + 1)), int(cx) + u] = BOCA
        Image.fromarray(cam, "RGBA").save(SAI / f"{nome}-boca.png")
        registro["boca"] = True
        registro["boca_box"] = [int(x0), int(y0), int(x1), int(y1)]
    registro["tam"] = [W, H]
    info[nome] = registro
    print(nome, registro)
(ART / "anim.json").write_text(json.dumps(info), encoding="utf-8")

# prancha: aberto, piscando e de boca fechada, com zoom 2x na cabeça
LADO = 340
linhas = []
for nome in NOMES:
    base = Image.open(ART / f"melissa-q-{nome}.png").convert("RGBA")
    quadros = [base]
    for sufixo in ("pisca", "boca"):
        f = SAI / f"{nome}-{sufixo}.png"
        q = base.copy()
        if f.exists():
            c = Image.open(f)
            q.paste(c, (0, 0), c)
        quadros.append(q)
    linhas.append(quadros)
L = 3 * 150
p = Image.new("RGB", (4 * L, 3 * 130), (60, 52, 72))
for i, quadros in enumerate(linhas):
    # cabeça centrada pela posição da boca ou do meio da figura
    bx = info[NOMES[i]].get("boca_box")
    cx = (bx[0] + bx[2]) // 2 if bx else quadros[0].width // 2
    for k, q in enumerate(quadros):
        c = q.crop((cx - 75, 0, cx + 75, 130))
        p.paste(c, ((i % 4) * L + k * 150, (i // 4) * 130), c)
p = p.resize((p.width * 2, p.height * 2), Image.NEAREST)
p.save(AQUI.parent / "melissa-anim-prova.png")
print(p.size)
