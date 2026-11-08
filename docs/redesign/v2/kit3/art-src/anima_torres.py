"""Piscar dos anfitriões das Torres (Galo, Coruja, Javali), no mesmo motor do Simon e do Erick (anima_npcs.py).
Os rostos são pequenos (olho de 4 a 6 px), então as caixas dos olhos saem da própria arte: no Galo e na Coruja, os
grupos de pixels claros e sem cor (o branco do olho) no alto do rosto, com o traço escuro do cílio por cima; no
Javali, o âmbar dos olhos na cabeça preta. A caixa de cada pose pode ser corrigida à mão em MAO. Poses que já têm
os olhos fechados (riso, piscadela, a continência da Coruja) não piscam.
Galo e Coruja fecham o olho como o Simon e o Erick (fecha_olho); o Javali, de pele preta, fecha apagando o âmbar
na cor da cabeça e deixando uma linha de pálpebra um tom acima do preto.
Saída: art/torres/npc/anim/<nome>-<pose>-pisca.png e anim.json; prova ampliada com o argumento [pasta-da-prova].
Uso: python -I art-src/anima_torres.py [pasta-da-prova]  (roda a partir de docs/redesign/v2/kit3)"""
import json
import sys
from pathlib import Path
import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(sys.argv[0]).resolve().parent))
import anima_npcs as A  # noqa: E402

KIT = Path(sys.argv[0]).resolve().parent.parent
PASTA = KIT / 'art' / 'torres' / 'npc'
POSES = {
    'galo': ['sorriso', 'entediado', 'confiante', 'malicia', 'surpreso', 'riso', 'irritado', 'sombrio'],
    'coruja': ['neutro', 'sorriso', 'serio', 'piscadela', 'surpreso', 'riso', 'desdem', 'irritado'],
    'javali': ['convite', 'neutro', 'explica', 'trama', 'surpreso', 'riso', 'desdem', 'sombrio'],
}
FECHADOS = {'galo-riso', 'coruja-riso', 'coruja-piscadela', 'coruja-sorriso'}  # o Javali ri de olho aberto
# caixas medidas à mão em recortes ampliados (Galo e Coruja: a detecção pelo branco do olho falha nos rostos de 3/4)
MAO = {
    'galo-sorriso': [(92, 32, 101, 37), (79, 36, 87, 41)],
    'galo-entediado': [(66, 33, 76, 38), (54, 38, 62, 44)],
    'galo-confiante': [(74, 25, 86, 29), (89, 25, 96, 29)],
    'galo-surpreso': [(87, 29, 96, 37), (74, 30, 83, 37)],
    'galo-irritado': [(99, 43, 112, 52), (86, 49, 97, 54)],
    'galo-sombrio': [(54, 42, 65, 48), (69, 42, 79, 48)],
    'coruja-neutro': [(39, 35, 49, 39), (59, 32, 66, 37)],
    'coruja-serio': [(41, 38, 49, 42), (60, 36, 68, 41)],
    'coruja-surpreso': [(42, 33, 51, 40), (60, 31, 68, 38)],
    'coruja-desdem': [(36, 23, 48, 27), (55, 22, 62, 26)],
    'coruja-irritado': [(40, 40, 50, 44), (57, 38, 66, 42)],
}
# o Galo de malícia tem um olho quase fechado e a cabeça inclinada: fica sem piscar
FECHADOS_EXTRA = {'galo-malicia'}


def grupos(m):
    lab, n = A.componentes(m)
    return [np.where(lab == k) for k in range(1, n + 1)]


def rosto(a):
    """faixa do rosto: do topo da figura até 70 px abaixo, nas colunas da cabeça"""
    al = a[..., 3] > 0
    top = np.where(al.any(1))[0].min()
    cols = np.where(al[top:top + 30].any(0))[0]
    return top, cols.min(), cols.max()


def olhos_claros(a):
    top, c0, c1 = rosto(a)
    r, g, b = (a[..., i].astype(int) for i in range(3))
    L = A.lum(a[..., :3].astype(float))
    sat = np.max(a[..., :3], -1).astype(int) - np.min(a[..., :3], -1)
    claro = (a[..., 3] > 0) & (L > 150) & (sat < 45)
    escuro = (a[..., 3] > 0) & (L < 70)
    m = np.zeros_like(claro)
    y0, y1 = top + 14, top + 46
    m[y0:y1, max(0, c0 - 4):c1 + 5] = claro[y0:y1, max(0, c0 - 4):c1 + 5]
    caixas = []
    for ys, xs in grupos(m):
        if len(ys) < 2 or len(ys) > 40:
            continue
        x0, x1, yy0, yy1 = xs.min(), xs.max(), ys.min(), ys.max()
        # precisa de cílio escuro logo acima (separa o olho dos dentes e de brilhos da roupa)
        if not escuro[max(0, yy0 - 3):yy0, x0:x1 + 1].any():
            continue
        caixas.append((int(x0) - 2, int(yy0) - 2, int(x1) + 2, int(yy1) + 1))
    caixas.sort(key=lambda b: b[1])
    return caixas[:2]


def olhos_ambar(a):
    top, c0, c1 = rosto(a)
    r, g, b = (a[..., i].astype(int) for i in range(3))
    # âmbar saturado (as presas e a gola, marfim, ficam de fora)
    m = (a[..., 3] > 0) & (r > 120) & (g > 70) & (r - b > 95) & (b < 100)
    m[:top] = False
    m[top + 50:] = False
    caixas = []
    for ys, xs in grupos(A.dilata(m, 1) & (a[..., 3] > 0)):
        if len(ys) < 4 or len(ys) > 120:
            continue
        caixas.append([int(xs.min()) - 1, int(ys.min()) - 1, int(xs.max()) + 1, int(ys.max()) + 1])
    # junta caixas que se tocam (o olho redondo do susto se parte na pupila)
    junta = True
    while junta:
        junta = False
        for i in range(len(caixas)):
            for j in range(i + 1, len(caixas)):
                p, q = caixas[i], caixas[j]
                if p[0] <= q[2] + 2 and q[0] <= p[2] + 2 and p[1] <= q[3] + 2 and q[1] <= p[3] + 2:
                    caixas[i] = [min(p[0], q[0]), min(p[1], q[1]), max(p[2], q[2]), max(p[3], q[3])]
                    del caixas[j]
                    junta = True
                    break
            if junta:
                break
    caixas.sort(key=lambda b: (b[2] - b[0]) * (b[3] - b[1]), reverse=True)
    return [tuple(c) for c in caixas[:2]]


def fecha_ambar(a, box):
    """olho do Javali fechado: o âmbar e o brilho viram a cor da cabeça em volta; uma linha de pálpebra na metade de
    baixo, um tom acima do preto, para o olho fechado ainda se ler"""
    x0, y0, x1, y1 = box
    reg = a[max(0, y0 - 3):y1 + 4, max(0, x0 - 3):x1 + 4].reshape(-1, 4).astype(int)
    L = A.lum(reg[:, :3].astype(float))
    pele = reg[(reg[:, 3] > 0) & (L < 60) & (reg[:, 1] <= reg[:, 0] + 2)]  # sem a franja verde do recorte
    cor = np.median(pele[:, :3], 0).astype(int) if len(pele) else np.array([30, 28, 32])
    sub = a[y0:y1 + 1, x0:x1 + 1]
    Ls = A.lum(sub[..., :3].astype(float))
    alvo = (sub[..., 3] > 0) & ((Ls > 55) | (sub[..., 0].astype(int) - sub[..., 2] > 30))
    sub[alvo, :3] = cor
    ly = y0 + int(round((y1 - y0) * .6))
    linha = tuple(min(255, int(v) + 34) for v in cor)
    for x in range(x0 + 1, x1):
        if a[ly, x, 3]:
            a[ly, x, :3] = linha


def main(prova=None):
    PASTA.joinpath('anim').mkdir(exist_ok=True)
    info, caixas_usadas = {}, {}
    for nome, poses in POSES.items():
        for p in poses:
            chave = f'{nome}-{p}'
            base = np.asarray(Image.open(PASTA / f'{chave}.png').convert('RGBA')).copy()
            if chave in FECHADOS or chave in FECHADOS_EXTRA:
                info[chave] = {'pisca': False, 'boca': False}
                continue
            caixas = MAO.get(chave) or (olhos_ambar(base) if nome == 'javali' else olhos_claros(base))
            caixas_usadas[chave] = caixas
            a = base.copy()
            for b in caixas:
                if nome == 'javali':
                    fecha_ambar(a, b)
                else:
                    A.fecha_olho(a, b, nome)
            Image.fromarray(a, 'RGBA').save(PASTA / 'anim' / f'{chave}-pisca.png', optimize=True)
            info[chave] = {'pisca': bool(caixas), 'boca': False}
    (PASTA / 'anim' / 'anim.json').write_text(json.dumps(info), encoding='utf-8')
    # centro dos olhos de cada pose, para o rostinho da caixa de texto (NPCVN.centros): a busca pela pele não serve no
    # Javali (pele preta) nem no Galo (cabelo cobre). Poses de olho fechado: a pele do rosto, 10 px abaixo do topo
    centros = {}
    for nome, poses in POSES.items():
        for p in poses:
            chave = f'{nome}-{p}'
            a = np.asarray(Image.open(PASTA / f'{chave}.png').convert('RGBA'))
            cx_ = caixas_usadas.get(chave) or (olhos_ambar(a.copy()) if nome == 'javali' else [])
            if cx_:
                cx = np.mean([(b[0] + b[2]) / 2 for b in cx_]); cy = np.mean([(b[1] + b[3]) / 2 for b in cx_])
            else:
                r, g, b = (a[..., i].astype(int) for i in range(3))
                sk = (r > 170) & (g > 115) & (b < 130) & (r - b > 60) if nome == 'galo' else (r > 200) & (g > 160) & (b > 120) & (r - b > 25)
                top, c0, c1 = rosto(a)
                sk &= a[..., 3] > 0; sk[:, :c0] = False; sk[:, c1 + 1:] = False; sk[:top + 8] = False; sk[top + 55:] = False
                ys, xs = np.where(sk)
                cx, cy = float(np.median(xs)), float(np.percentile(ys, 10)) + 10
            centros[chave] = [round(float(cx)), round(float(cy))]
    (PASTA / 'centros.json').write_text(json.dumps(centros), encoding='utf-8')
    print(json.dumps(caixas_usadas))
    if prova:
        Z, W, H = 8, 40, 26
        linhas = []
        for chave, caixas in caixas_usadas.items():
            if not caixas:
                continue
            cx = round(np.mean([(b[0] + b[2]) / 2 for b in caixas]))
            cy = round(np.mean([(b[1] + b[3]) / 2 for b in caixas]))
            x0, y0 = cx - W // 2, max(0, cy - H // 2)
            linha = Image.new('RGBA', (2 * W * Z + 8, H * Z), (70, 64, 84, 255))
            for i, f in enumerate([PASTA / f'{chave}.png', PASTA / 'anim' / f'{chave}-pisca.png']):
                c = Image.open(f).convert('RGBA').crop((x0, y0, x0 + W, y0 + H)).resize((W * Z, H * Z), Image.NEAREST)
                linha.alpha_composite(c, (i * (W * Z + 8), 0))
            linhas.append(linha)
        for i in range(0, len(linhas), 4):
            g = linhas[i:i + 4]
            out = Image.new('RGBA', (g[0].width, sum(l.height + 6 for l in g)), (0, 0, 0, 255))
            for j, l in enumerate(g):
                out.paste(l, (0, j * (l.height + 6)))
            out.save(Path(prova) / f'prova-torres-{i // 4}.png')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else None)
