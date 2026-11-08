"""Recorta as cabeças exatas da folha aprovada (melissa-12-final) e encaixa sobre os corpos das 12 poses, sem gerar rosto novo.
Apaga a cabeça antiga do corpo e alinha cada cabeça pelo pescoço.
Uso: python -I cabecas_aprovadas.py"""
from pathlib import Path
import sys
import numpy as np
from PIL import Image, ImageDraw

AQUI = Path(sys.argv[0]).resolve().parent
ART = AQUI.parent / "art"
NOMES = ["convite", "explica", "riso", "preocupado", "pensativo", "timido", "confiante", "surpreso", "animado", "apresenta", "triste", "sorriso"]
ESCALA, RX, RY = 0.52, 152, 126
MARGEM = 40
# onde a mão da pose fica na frente da cabeça, em coordenadas do corpo
MAOS = {"explica": (95, 85, 135, 170), "riso": (135, 85, 180, 160), "pensativo": (130, 100, 170, 150),
        "timido": (190, 95, 235, 150), "triste": (160, 110, 200, 165)}


def lumin(v):
    return v[..., :3] @ np.array([0.3, 0.59, 0.11])


def pele_de(v):
    return (v[..., 0].astype(int) - v[..., 2].astype(int) > 40) & (v[..., 0] > 190) & (v[..., 3] > 128)


def componente(mascara, sementes):
    vivo = np.zeros_like(mascara)
    pilha = list(sementes)
    while pilha:
        j, k = pilha.pop()
        if not (0 <= j < mascara.shape[0] and 0 <= k < mascara.shape[1]) or vivo[j, k] or not mascara[j, k]:
            continue
        vivo[j, k] = True
        pilha += [(j + 1, k), (j - 1, k), (j, k + 1), (j, k - 1)]
    return vivo


def dilata(m, n=1):
    for _ in range(n):
        d = m.copy()
        d[1:] |= m[:-1]
        d[:-1] |= m[1:]
        d[:, 1:] |= m[:, :-1]
        d[:, :-1] |= m[:, 1:]
        m = d
    return m


fol = Image.open(AQUI / "melissa-12-final-recorte.png").convert("RGBA")
W, H = fol.size
cw, ch = W / 4, H / 3

saida = {}
for i, nome in enumerate(NOMES):
    x0, y0 = int((i % 4) * cw), int((i // 4) * ch)
    # a rosa pode passar da divisão entre células, então a janela é mais larga que a célula
    cel = fol.crop((max(0, x0 - 25), y0, min(W, int(x0 + cw) + 25), int(y0 + ch)))
    a = np.asarray(cel).copy()
    op = a[..., 3] > 128
    # mede só na faixa central da célula, porque dedos da fileira de cima podem descer pelos lados
    meio = op[:, op.shape[1] // 2 - 60:op.shape[1] // 2 + 60].sum(1) > 0
    vazia = np.where(~meio)[0][0]
    topo = vazia + np.where(meio[vazia:])[0][0]
    op[:topo] = False
    # centro do cabelo: maior bloco contínuo na altura dos olhos
    xs = np.where(op[topo + 110:topo + 130].sum(0) > 10)[0]
    bl = max(np.split(xs, np.where(np.diff(xs) > 2)[0] + 1), key=len)
    cx = (bl[0] + bl[-1]) / 2
    cy = topo + 118
    yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    dx = xx - cx
    dentro = (dx / RX) ** 2 + ((yy - cy) / RY) ** 2 <= 1
    r, g, b = a[..., 0].astype(int), a[..., 1].astype(int), a[..., 2].astype(int)
    lum = lumin(a)
    # rosa inteira: o maior bloco azul à direita do cabelo, com o contorno em volta
    azul = (b > r + 60) & (yy < topo + 135) & (yy >= topo) & (dx > 0) & (dx < 195) & op
    rot = np.zeros_like(azul)
    melhor = 0
    for j, k in zip(*np.where(azul)):
        if rot[j, k]:
            continue
        c = componente(azul, [(j, k)])
        rot |= c
        if c.sum() > melhor:
            melhor, rosa = c.sum(), c
    rosa = dilata(rosa, 3) & op
    # abaixo do queixo: só a pele do pescoço e a parte preta do cabelo; colarinho e roupa ficam os da pose
    baixo = yy > topo + 200
    pele = pele_de(a)
    preto = (lum < 80) & (np.abs(dx) > 42)
    m = (dentro | rosa) & op & (~baixo | pele | preto) & (yy <= topo + 236)
    a[..., 3] = np.where(m, 255, 0)
    # base do pescoço na folha aprovada
    faixa = pele & (np.abs(dx) < 70) & (yy > topo + 180) & (yy <= topo + 236)
    y_s = np.where(faixa.sum(1) >= 8)[0][-1]
    x_s = xx[y_s - 12:y_s + 1][faixa[y_s - 12:y_s + 1]].mean()

    cab = Image.fromarray(a, "RGBA")
    ox, oy = cab.getbbox()[:2]
    cab = cab.crop(cab.getbbox())
    nova = cab.resize((round(cab.width * ESCALA), round(cab.height * ESCALA)), Image.BOX)
    arr = np.asarray(nova).copy()
    arr[..., 3] = np.where(arr[..., 3] >= 128, 255, 0)
    nova = Image.fromarray(arr, "RGBA")

    corpo = Image.open(ART / f"melissa-p-{nome}.png").convert("RGBA")
    ca = np.asarray(corpo)
    c = ca[..., 3] > 0
    yc = np.where(c.sum(1) > 0)[0][0]
    xs2 = np.where(c[yc + 60:yc + 85].sum(0) > 12)[0]
    bl2 = max(np.split(xs2, np.where(np.diff(xs2) > 2)[0] + 1), key=len)
    cx_velho = (bl2[0] + bl2[-1]) / 2
    # base do pescoço no corpo: é por ela que a cabeça encaixa
    yb_, xb_ = np.mgrid[0:ca.shape[0], 0:ca.shape[1]]
    faixa2 = pele_de(ca) & (np.abs(xb_ - cx_velho) < 42) & (yb_ > yc + 85) & (yb_ < yc + 140)
    y_med = np.where(faixa2.sum(1) >= 5)[0][-1]
    x_b = xb_[y_med - 8:y_med + 1][faixa2[y_med - 8:y_med + 1]].mean()
    # em algumas poses a mão ou o colarinho escondem o pescoço, então a altura é a mesma para todas
    y_b = yc + 131
    px = round(x_b - (x_s - ox) * ESCALA)
    py = round(y_b - (y_s - oy) * ESCALA)
    print(nome, "pescoço corpo", round(x_b), y_b, "cabeça em", px, py)

    # apaga a cabeça antiga: acima do colarinho, tudo que não é luva
    limpo = ca.copy()
    lb = lumin(ca)
    azulb = (ca[..., 2].astype(int) > ca[..., 0].astype(int) + 60)
    neutro = np.abs(ca[..., 0].astype(int) - ca[..., 2].astype(int)) < 26
    luva = neutro & (lb > 42) & (lb < 135)
    corte = y_b - 20
    regiao = (yb_ < corte) & (np.abs(xb_ - cx_velho) < 105)
    apagar = regiao & ~luva
    # a manga azul nunca sobe até a rosa antiga, mas pode entrar na região perto do colarinho
    apagar &= ~(azulb & (yb_ > yc + 70))
    # pontas do cabelo antigo ao lado do pescoço, fora do colarinho
    lados = (yb_ >= corte) & (yb_ < y_b - 6) & (np.abs(xb_ - x_b) > 40) & (np.abs(xb_ - x_b) < 110)
    cabelo_velho = (lb < 42) | ((lb > 170) & ~azulb)
    apagar |= lados & cabelo_velho
    limpo[apagar, 3] = 0
    corpo2 = Image.fromarray(limpo, "RGBA")

    fig = Image.new("RGBA", (corpo.width + 2 * MARGEM, corpo.height + MARGEM), (0, 0, 0, 0))
    fig.paste(corpo2, (MARGEM, MARGEM), corpo2)
    fig.paste(nova, (px + MARGEM, py + MARGEM), nova)
    if nome in MAOS:
        x1, y1, x2, y2 = MAOS[nome]
        fa = np.asarray(fig).copy()
        y2 = min(y2, corpo.height)
        x2 = min(x2, corpo.width)
        t = ca[y1:y2, x1:x2]
        l = lumin(t)
        # luva: cinza neutro; traços finos do rosto antigo saem com a erosão
        neu = (np.abs(t[..., 0].astype(int) - t[..., 2].astype(int)) < 26) & (t[..., 3] > 0)
        lv = neu & (l > 28) & (l < 135)
        er = lv.copy()
        er[1:-1, 1:-1] = lv[1:-1, 1:-1] & lv[:-2, 1:-1] & lv[2:, 1:-1] & lv[1:-1, :-2] & lv[1:-1, 2:]
        # só fica o que está ligado à borda de baixo da caixa, de onde vem o braço
        vivo = componente(er, [(er.shape[0] - 1, k) for k in np.where(er[-1])[0]])
        dil = dilata(vivo) & (t[..., 3] > 0) & (l < 135)
        for j, k in zip(*np.where(dil)):
            fa[y1 + j + MARGEM, x1 + k + MARGEM] = t[j, k]
        fig = Image.fromarray(fa, "RGBA")
    # tira o que sobrou solto da cabeça antiga: só fica o que está ligado à figura
    fa = np.asarray(fig).copy()
    op2 = fa[..., 3] > 0
    ys2, xs3 = np.where(op2[fa.shape[0] // 2])[0], None
    semente = (fa.shape[0] // 2, int(np.where(op2[fa.shape[0] // 2])[0].mean()))
    if not op2[semente]:
        semente = (fa.shape[0] // 2, int(np.where(op2[fa.shape[0] // 2])[0][0]))
    fa[..., 3][op2 & ~componente(op2, [semente])] = 0
    fig = Image.fromarray(fa, "RGBA")
    fig = fig.crop(fig.getbbox())
    fig.save(ART / f"melissa-q-{nome}.png")
    saida[nome] = fig

cols = 6
cwd = max(p.width for p in saida.values()) // 2 + 16
chd = max(p.height for p in saida.values()) // 2 + 34
s = Image.new("RGB", (cols * cwd, 2 * chd), (28, 22, 38))
d = ImageDraw.Draw(s)
for i, nome in enumerate(NOMES):
    t = saida[nome].resize((saida[nome].width // 2, saida[nome].height // 2), Image.BOX)
    x, y = (i % cols) * cwd, (i // cols) * chd
    s.paste(t, (x + (cwd - t.width) // 2, y + chd - t.height - 6), t)
    d.text((x + 6, y + 4), f"{i + 1} {nome}", fill=(230, 225, 235))
s.save(AQUI.parent / "melissa-12-cabeca-aprovada.png")
Wz, Hz = 390, 300
z = Image.new("RGB", (Wz * 4, Hz * 3), (60, 52, 72))
d = ImageDraw.Draw(z)
for i, nome in enumerate(NOMES):
    p = saida[nome].crop((0, 0, Wz, Hz - 10))
    x, y = (i % 4) * Wz, (i // 4) * Hz
    z.paste(p, (x, y + 8), p)
    d.text((x + 4, y + 2), f"{i + 1} {nome}", fill=(255, 255, 0))
z.save(AQUI.parent / "melissa-12-cabeca-zoom.png")
