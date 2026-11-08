"""Piscar e boca do Simon e do Erick (dono, 06/11: "Pode fazer"; pedido do crítico de animação dos NPCs).
Sem rosto novo: cada pose aprovada ganha variações com o olho fechado e com a boca no outro estado (aberta abre
mais 1 px; fechada ganha uma fresta), tiradas da própria arte. As caixas dos olhos e da boca foram medidas à mão em cada
pose (coordenadas da pose, x0, y0, x1, y1). Poses que já têm os olhos fechados não piscam.
Saída: art/<pasta>/anim/<pose>-pisca.png, <pose>-boca.png, <pose>-pisca-boca.png (imagens inteiras, mesmo tamanho
da pose, para o motor só trocar a figura) e anim.json.
Uso: python -I art-src/anima_npcs.py [pasta-da-prova]  (roda a partir de docs/redesign/v2/kit3)"""
import json
import sys
from pathlib import Path
import numpy as np
from PIL import Image

KIT = Path(sys.argv[0]).resolve().parent.parent
# dono, 06/11: "retire as animações dos npcs falando. deixe somente para os chibis deles". Os retratos só piscam;
# a boca mexendo fica para os chibis dos NPCs. As caixas da boca continuam medidas, caso volte.
BOCA_NOS_RETRATOS = False

# olhos: caixas que cobrem o olho inteiro com o traço de cima; boca: (caixa, estado da arte: 'aberta' ou 'fechada')
SIMON = {
    'animado': dict(olhos=[(27, 36, 36, 43), (44, 30, 54, 37)], boca=((38, 43, 49, 51), 'aberta')),
    'cantando': dict(olhos=[], boca=((64, 43, 76, 51), 'aberta')),
    'decepcionado': dict(olhos=[], boca=((38, 53, 42, 57), 'aberta')),
    'irritado': dict(olhos=[(28, 42, 33, 45, 2), (35, 39, 41, 43, 2)], boca=((41, 50, 48, 52), 'fechada')),
    'malicia': dict(olhos=[], boca=((52, 46, 58, 50), 'fechada')),
    'nervoso': dict(olhos=[], boca=((72, 43, 84, 50), 'aberta')),
    'sorriso': dict(olhos=[], boca=((54, 45, 66, 49), 'fechada')),
    'surpreso': dict(olhos=[(55, 37, 61, 42, 2), (70, 32, 76, 36, 3)], boca=((69, 46, 73, 49), 'aberta')),
}
ERICK = {
    'erick-convite': dict(olhos=[(85, 16, 98, 21), (102, 22, 109, 28)], boca=((87, 36, 100, 39), 'fechada')),
    'erick-decepcionado': dict(olhos=[(79, 20, 87, 28), (94, 16, 105, 21)], boca=((89, 36, 100, 40), 'fechada')),
    'erick-interessado': dict(olhos=[(97, 34, 113, 40), (116, 35, 124, 41)], boca=None),  # a mão cobre a boca
    'erick-livro': dict(olhos=[(89, 26, 101, 31), (106, 28, 114, 33)], boca=((93, 46, 105, 49), 'fechada')),
    'erick-neutro': dict(olhos=[(82, 25, 95, 31), (100, 27, 107, 33)], boca=((87, 46, 99, 48), 'fechada')),
    'erick-observando': dict(olhos=[(86, 21, 99, 29), (103, 27, 112, 34)], boca=((86, 46, 98, 48), 'fechada')),
    'erick-sorriso': dict(olhos=[(82, 22, 94, 27), (100, 23, 107, 31)], boca=((83, 41, 101, 45), 'fechada')),
    'erick-suspiro': dict(olhos=[], boca=((99, 58, 109, 60), 'fechada')),
}


def lum(c):
    return .3 * c[..., 0] + .59 * c[..., 1] + .11 * c[..., 2]


def pele_perto(a, x0, y0, x1, y1):
    """cor da pele logo abaixo e dos lados da caixa (mediana dos pixels claros e quentes)"""
    H, W = a.shape[:2]
    ys0, ys1 = max(0, y0 - 2), min(H, y1 + 5)
    xs0, xs1 = max(0, x0 - 3), min(W, x1 + 4)
    reg = a[ys0:ys1, xs0:xs1].reshape(-1, 4).astype(int)
    m = (reg[:, 3] > 0) & (reg[:, 0] - reg[:, 2] > 20)
    pts = reg[m]
    if not len(pts):
        return (200, 160, 140, 255)
    L = lum(pts[:, :3].astype(float))
    pts = pts[L >= np.percentile(L, 55)]  # tira as sombras e os traços
    return tuple(int(v) for v in np.median(pts[:, :3], axis=0)) + (255,)


def escuro(a, x0, y0, x1, y1):
    reg = a[y0:y1 + 1, x0:x1 + 1].reshape(-1, 4).astype(int)
    reg = reg[reg[:, 3] > 0]
    return tuple(int(v) for v in reg[np.argmin(lum(reg[:, :3].astype(float)))][:3]) + (255,)


def dist(c, pele):
    return np.abs(c[..., :3].astype(int) - np.array(pele[:3])).sum(-1)


def componentes(m):
    H, W = m.shape
    lab = np.zeros((H, W), int)
    n = 0
    for y, x in zip(*np.where(m)):
        if lab[y, x]:
            continue
        n += 1
        pilha = [(y, x)]
        lab[y, x] = n
        while pilha:
            cy, cx = pilha.pop()
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    yy, xx = cy + dy, cx + dx
                    if 0 <= yy < H and 0 <= xx < W and m[yy, xx] and not lab[yy, xx]:
                        lab[yy, xx] = n
                        pilha.append((yy, xx))
    return lab, n


def parte(a, box, pele):
    """o olho (ou a boca) dentro da caixa: a mancha que não é pele, separada da sobrancelha e da dobra da pálpebra
    pela pele; escolhe a maior entre as que ficam na metade de baixo da caixa"""
    x0, y0, x1, y1 = box
    reg = a[y0:y1 + 1, x0:x1 + 1]
    Ls = .3 * pele[0] + .59 * pele[1] + .11 * pele[2]
    m = (reg[..., 3] > 0) & ((dist(reg, pele) > 70) | (lum(reg[..., :3].astype(float)) < Ls * .72))
    lab, n = componentes(m)
    melhor, mn = None, 0
    for k in range(1, n + 1):
        ys, xs = np.where(lab == k)
        if ys.mean() < (y1 - y0) * .3 and n > 1:
            continue
        if len(ys) > mn:
            melhor, mn = lab == k, len(ys)
    if melhor is None:
        return np.zeros_like(m), Ls
    return melhor, Ls


def pele_coluna(a, x, y, pele, Ls):
    """pele logo abaixo do ponto, na mesma coluna (mantém o sombreado do rosto)"""
    for yy in (y + 1, y + 2, y + 3):
        if yy < a.shape[0]:
            c = a[yy, x]
            if c[3] and dist(c, pele) <= 40 and lum(c[:3].astype(float)) > Ls * .8:
                return tuple(int(v) for v in c[:3]) + (255,)
    return pele


def dilata(m, r):
    o = m.copy()
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            o |= np.roll(np.roll(m, dy, 0), dx, 1)
    return o


def olho(a, box, pele, Ls):
    """o olho: os pixels escuros (cílios, íris), os meio-escuros encostados neles (íris, sombra do cílio) e o branco
    (mais claro que a pele) a até 2 px; a pele sombreada e as mechas longe dos cílios ficam de fora"""
    x0, y0, x1, y1 = box
    reg = a[y0:y1 + 1, x0:x1 + 1]
    L = lum(reg[..., :3].astype(float))
    vis = reg[..., 3] > 0
    nucleo = vis & (L < Ls * .62)
    m = nucleo | (dilata(nucleo, 1) & vis & (L < Ls * .8)) | (dilata(nucleo, 3) & vis & (L > Ls * 1.02) & (dist(reg, pele) > 45))
    ys = np.where(nucleo.any(1))[0]
    if len(ys):
        m[:ys.min()] = False
        m[ys.max() + 2:] = False
    return m, nucleo


def eh_pele(c, Ls, pele):
    return c[3] and Ls * .78 < lum(c[:3].astype(float)) < Ls * 1.12 and int(c[0]) - int(c[2]) > 25 and dist(c, pele) <= 75


def tapa(orig, a, mask_abs, x, y, pele, Ls):
    """pele do vizinho mais perto na coluna (primeiro para baixo), que não seja do olho"""
    for d in (1, 2, 3, 4, 5):
        for yy in (y + d,):
            if 0 <= yy < orig.shape[0] and not mask_abs.get((x, yy)) and eh_pele(orig[yy, x], Ls, pele):
                return tuple(int(v) for v in orig[yy, x])
    return pele


def fecha_olho(a, box, quem):
    """olho fechado no estilo dos olhos fechados da própria arte (Simon decepcionado/sorriso, Erick suspiro): UMA linha
    de cílio em arco suave, com a sombra da pálpebra logo acima. Some tudo o que é olho e traço escuro em volta dele
    (íris, branco, pálpebra de baixo e, no Erick, a dobra da pálpebra 1-2 px acima); a pele da área fica, a
    sobrancelha e o cabelo também. O que some vira a pele de cima e de baixo da mesma coluna, misturada."""
    box_dobra = box[4] if len(box) > 4 else None  # linhas acima do olho que também somem (cílio grosso, dobra)
    x0, y0, x1, y1 = box[:4]
    box = box[:4]
    pele = pele_perto(a, x0, y0, x1, y1)
    Ls = .3 * pele[0] + .59 * pele[1] + .11 * pele[2]
    m, nucleo = olho(a, box, pele, Ls)
    if not m.any():
        return
    orig = a.copy()
    ys, xs = np.where(m)
    ex0, ex1, ey0, ey1 = x0 + xs.min(), x0 + xs.max(), y0 + ys.min(), y0 + ys.max()
    dobra = box_dobra if box_dobra is not None else (2 if quem == 'erick' else 0)
    r0, r1 = ey0 - dobra, ey1 + 1
    L = lum(orig[..., :3].astype(float))

    def some(x, y):
        c = orig[y, x]
        if not c[3]:
            return False
        if x0 <= x <= x1 and y0 <= y <= y1 and m[y - y0, x - x0]:
            return True
        return L[y, x] < Ls * .8 or (L[y, x] > Ls * 1.02 and dist(c, pele) > 45)

    escuros = [orig[y, x] for y in range(ey0, ey1 + 1) for x in range(ex0, ex1 + 1)
               if x0 <= x <= x1 and y0 <= y <= y1 and nucleo[y - y0, x - x0]]
    cilio = tuple(int(v) for v in min(escuros, key=lambda c: lum(c[:3].astype(float)))) if escuros else (40, 28, 30, 255)
    for x in range(ex0 - 1, ex1 + 2):
        # pele de referência acima e abaixo da área, na mesma coluna
        cima = next((orig[y, x] for y in range(r0 - 1, r0 - 4, -1) if eh_pele(orig[y, x], Ls, pele)), None)
        baixo = next((orig[y, x] for y in range(r1 + 1, r1 + 5) if eh_pele(orig[y, x], Ls, pele)), None)
        for y in range(r0, r1 + 1):
            if not some(x, y):
                continue
            if cima is not None and baixo is not None:
                t = (y - r0 + 1) / (r1 - r0 + 2)
                c = (cima[:3].astype(float) * (1 - t) + baixo[:3].astype(float) * t)
            else:
                c = (baixo if baixo is not None else cima if cima is not None else np.array(pele))[:3].astype(float)
            a[y, x] = tuple(int(round(v)) for v in c) + (255,)
    # linha do cílio: arco para baixo (pontas 1 px acima nos olhos largos), a 65% da altura do olho
    ly = ey0 + int(round((ey1 - ey0) * .65))
    w = ex1 - ex0
    for x in range(ex0, ex1 + 1):
        u = (x - ex0) / max(1, w)
        sobe = 1 if (w >= 6 and (u < .15 or u > .85)) else 0
        a[ly - sobe, x] = cilio
        # sombra da pálpebra logo acima da linha, só no meio
        if w >= 4 and .2 < u < .8 and a[ly - sobe - 1, x, 3]:
            a[ly - sobe - 1, x] = tuple(int(v * .86) for v in a[ly - sobe - 1, x, :3]) + (255,)


def troca_boca(a, box, estado, quem):
    x0, y0, x1, y1 = box
    pele = pele_perto(a, x0, y0, x1, y1)
    m, Ls = parte(a, box, pele)
    orig = a.copy()
    ys, xs = np.where(m)
    if estado == 'aberta' and len(ys):
        # boca aberta: fecha 2 px. A metade de baixo da boca sobe 2 px junto com as 2 linhas de queixo logo abaixo,
        # na mesma coluna; só pixels da própria arte, nada de pele nova
        for cx in sorted(set(xs)):
            x = x0 + cx
            col = np.where(m[:, cx])[0]
            yt, yb = y0 + col.min(), y0 + col.max()
            if yb - yt < 2:
                continue
            k = 2 if yb - yt >= 3 else 1  # boca pequena fecha só 1 px
            meio = yt + (yb - yt) // 2
            for y in range(meio, yb + k + 1):
                a[y, x] = orig[y + k, x]
        return
    # fechada: abre uma fresta logo abaixo do traço do lábio, mais escura no meio
    lab = escuro(a, x0, y0, x1, y1)
    if len(ys):
        cx, cy = x0 + xs.mean(), y0 + ys.mean()
    else:
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    meia = 2 if quem == 'erick' else max(1, round((x1 - x0) * .2))
    ly = int(round(cy)) + 1
    dentro = tuple(int(v * .6) for v in lab[:3]) + (255,)
    for x in range(round(cx) - meia, round(cx) + meia + 1):
        a[ly, x] = dentro if abs(x - cx) < meia else lab
    for x in range(round(cx) - meia + 1, round(cx) + meia):
        a[ly + 1, x] = lab
    if quem == 'erick':
        # lábio de baixo: um tom mais claro que a pele logo abaixo da fresta
        for x in range(round(cx) - meia + 1, round(cx) + meia):
            c = a[ly + 2, x]
            a[ly + 2, x] = tuple(min(255, int(v * 1.1)) for v in c[:3]) + (255,)


def gera(pasta, mapa, quem):
    sai = KIT / 'art' / pasta / 'anim'
    sai.mkdir(exist_ok=True)
    info = {}
    for nome, cfg in mapa.items():
        base = np.asarray(Image.open(KIT / 'art' / pasta / f'{nome}.png').convert('RGBA')).copy()
        reg = {'pisca': bool(cfg['olhos']), 'boca': BOCA_NOS_RETRATOS and bool(cfg['boca'])}
        for suf in ('pisca', 'boca', 'pisca-boca'):
            if ('pisca' in suf and not reg['pisca']) or ('boca' in suf and not reg['boca']):
                continue
            a = base.copy()
            if 'pisca' in suf:
                for b in cfg['olhos']:
                    fecha_olho(a, b, quem)
            if 'boca' in suf:
                troca_boca(a, cfg['boca'][0], cfg['boca'][1], quem)
            Image.fromarray(a, 'RGBA').save(sai / f'{nome}-{suf}.png', optimize=True)
        info[nome] = reg
    (sai / 'anim.json').write_text(json.dumps(info), encoding='utf-8')
    return info


def prova(pasta, mapa, destino):
    """prancha: rosto aberto, piscando e com a boca trocada, ampliado 6x"""
    Z, W, H = 6, 64, 56
    linhas = []
    for nome, cfg in mapa.items():
        caixas = [b[:4] for b in cfg['olhos']] + ([cfg['boca'][0]] if cfg['boca'] else [])
        cx = round(np.mean([(b[0] + b[2]) / 2 for b in caixas]))
        cy = round(np.mean([(b[1] + b[3]) / 2 for b in caixas]))
        x0, y0 = cx - W // 2, max(0, cy - H // 2)
        quadros = [KIT / 'art' / pasta / f'{nome}.png'] + [KIT / 'art' / pasta / 'anim' / f'{nome}-{s}.png' for s in ('pisca', 'boca')]
        linha = Image.new('RGBA', (3 * W * Z, H * Z), (70, 64, 84, 255))
        for i, f in enumerate(quadros):
            if f.exists():
                c = Image.open(f).convert('RGBA').crop((x0, y0, x0 + W, y0 + H)).resize((W * Z, H * Z), Image.NEAREST)
                linha.alpha_composite(c, (i * W * Z, 0))
        linhas.append(linha)
    for i in range(0, len(linhas), 4):
        g = linhas[i:i + 4]
        out = Image.new('RGBA', (g[0].width, sum(l.height for l in g)))
        for j, l in enumerate(g):
            out.paste(l, (0, j * l.height))
        out.save(Path(destino) / f'prova-{pasta}-{i // 4}.png')


if __name__ == '__main__':
    print(gera('simon', SIMON, 'simon'))
    print(gera('catedral', ERICK, 'erick'))
    if len(sys.argv) > 1:
        prova('simon', SIMON, sys.argv[1])
        prova('catedral', ERICK, sys.argv[1])
