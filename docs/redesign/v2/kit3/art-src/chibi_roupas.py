"""Roupas do chibi em peças.
molde: gera o molde dos dois corpos, do pescoço para baixo, em 4 direções x 4 passos.
recorta <folha> <f|m> <saida.png>: recorta a roupa de uma folha gerada sobre o molde. Cada quadro é alinhado
    ao molde pela cabeça e pelas mãos, que continuam magenta, e o traço em volta da cabeça é apagado.
prova <n> <saida.png>: monta corpo, roupa e cabelo em todos os quadros, nos dois corpos.
Uso: python -I chibi_roupas.py molde | recorta chibi-roupa-1-f.png f roupa-1-f.png | prova 1 chibi-roupa-1-prova.png"""
from pathlib import Path
import json
import sys
import numpy as np
from PIL import Image

AQUI = Path(sys.argv[0]).resolve().parent
CH = AQUI.parent / "art" / "avatar" / "chibi"
CEL, RW, RH, X0, Y0, ESC = 80, 64, 64, 8, 16, 4  # recorte de 64x64 em cada quadro de 80x80; cada pixel vira 4x4
BUSCA = 7


def silhueta(ch):
    a = np.asarray(Image.open(CH / f"corpo-{ch}.png").convert("RGBA"))
    return a, a[..., 3] > 0


def molde():
    for ch in "fm":
        a, _ = silhueta(ch)
        saida = np.zeros((RH * 4, RW * 4, 3), np.uint8)
        saida[...] = (0, 255, 0)
        for d in range(4):
            for p in range(4):
                c = a[d * CEL + Y0:d * CEL + Y0 + RH, p * CEL + X0:p * CEL + X0 + RW]
                saida[d * RH:(d + 1) * RH, p * RW:(p + 1) * RW][c[..., 3] > 0] = (255, 0, 255)
        Image.fromarray(saida).resize((RW * 4 * ESC, RH * 4 * ESC), Image.NEAREST).save(AQUI / f"chibi-molde-roupa-{ch}.png")
        print(ch, "molde pronto")


def dilata(m, n):
    for _ in range(n):
        d = m.copy()
        d[1:] |= m[:-1]
        d[:-1] |= m[1:]
        d[:, 1:] |= m[:, :-1]
        d[:, :-1] |= m[:, 1:]
        m = d
    return m


def recorta(nome, ch, destino):
    a = np.asarray(Image.open(AQUI / nome).convert("RGB").resize((RW * 4 * ESC, RH * 4 * ESC), Image.BOX)).astype(int)
    verde = (a[..., 1] - np.maximum(a[..., 0], a[..., 2])) >= 60
    mag = (np.minimum(a[..., 0], a[..., 2]) - a[..., 1]) >= 60
    _, sil = silhueta(ch)
    # desce para pixels reais
    gen = np.zeros((RH * 4, RW * 4, 4), np.uint8)
    magr = np.zeros((RH * 4, RW * 4), bool)
    for j in range(RH * 4):
        for i in range(RW * 4):
            mb, vb = mag[j * ESC:(j + 1) * ESC, i * ESC:(i + 1) * ESC], verde[j * ESC:(j + 1) * ESC, i * ESC:(i + 1) * ESC]
            magr[j, i] = mb.mean() >= 0.5
            eh = ~(mb | vb)
            if eh.mean() >= 0.5:
                gen[j, i, :3] = np.median(a[j * ESC:(j + 1) * ESC, i * ESC:(i + 1) * ESC][eh], axis=0)
                gen[j, i, 3] = 255
    saida = np.zeros((RH * 4, RW * 4, 4), np.uint8)
    desvios = []
    for d in range(4):
        for p in range(4):
            c = gen[d * RH:(d + 1) * RH, p * RW:(p + 1) * RW].copy()
            m = magr[d * RH:(d + 1) * RH, p * RW:(p + 1) * RW]
            t = sil[d * CEL + Y0:d * CEL + Y0 + RH, p * CEL + X0:p * CEL + X0 + RW]
            # acha o deslocamento em que cabeça e mãos magenta caem sobre o corpo do molde
            melhor, dxy = -10 ** 9, (0, 0)
            for dy in range(-BUSCA, BUSCA + 1):
                for dx in range(-BUSCA, BUSCA + 1):
                    s = np.roll(np.roll(m, dy, 0), dx, 1)
                    v = (s & t).sum() - (s & ~t).sum() - abs(dx) - abs(dy)
                    if v > melhor:
                        melhor, dxy = v, (dy, dx)
            desvios.append(dxy)
            c = np.roll(np.roll(c, dxy[0], 0), dxy[1], 1)
            m = np.roll(np.roll(m, dxy[0], 0), dxy[1], 1)
            # o que deu a volta na borda do quadro não é roupa
            if dxy[0] > 0:
                c[:dxy[0]] = 0
            elif dxy[0] < 0:
                c[dxy[0]:] = 0
            if dxy[1] > 0:
                c[:, :dxy[1]] = 0
            elif dxy[1] < 0:
                c[:, dxy[1]:] = 0
            # apaga o traço em volta da cabeça: a roupa só começa abaixo dela
            lin = np.where(m[:34].sum(1) > 6)[0]
            if len(lin):
                base = lin[lin < 30]
                fim = base[-1] if len(base) else 0
                cab = m.copy()
                cab[fim + 1:] = False
                c[..., 3][dilata(cab, 2)] = 0
                c[..., 3][:max(0, fim - 12)] = 0
            saida[d * RH:(d + 1) * RH, p * RW:(p + 1) * RW] = c
    Image.fromarray(saida, "RGBA").save(CH / destino)
    print(destino, "desvios", desvios)


def prova(n, destino):
    anc = json.loads((CH / "ancoras.json").read_text(encoding="utf-8"))
    AMOSTRAS = [("f", 1, ((166, 150, 135), (232, 220, 200), (250, 244, 232)), ((248, 217, 195), (226, 184, 162))),
                ("m", 15, ((170, 84, 120), (226, 132, 166), (250, 196, 214)), ((140, 92, 64), (106, 66, 46)))]
    Z, W, H = 3, 72, 100
    p = Image.new("RGB", (4 * 4 * W * Z // 2, 2 * 4 * H * Z // 2 // 2 * 2), (70, 60, 84))
    p = Image.new("RGB", (8 * W * Z, 4 * H * Z), (70, 60, 84))
    for b, (ch, cab, cor, pele) in enumerate(AMOSTRAS):
        a = np.asarray(Image.open(CH / f"corpo-{ch}.png").convert("RGBA")).astype(float)
        r, bl = a[..., 0], a[..., 2]
        v = .3 * r + .59 * a[..., 1] + .11 * bl
        pl = (r - bl > 30) & (a[..., 3] > 0)
        tom, som = (np.array(x, float) for x in pele)
        a[..., :3] = np.where(pl[..., None], som + (tom - som) * np.clip((v - 150) / 65, 0, 1)[..., None], a[..., :3])
        yy = (np.arange(a.shape[0]) % CEL)[:, None] * np.ones((1, a.shape[1]))
        # abaixo do pescoço, só a pele fica: quem veste é a roupa
        a[..., 3] = np.where((yy >= 37) & ~pl, 0, a[..., 3])
        h = np.asarray(Image.open(CH / f"cabelo-{cab}.png").convert("RGBA")).astype(float)
        vh = h[..., 0]
        s, m, l = (np.array(x, float) for x in cor)
        x = s + (m - s) * np.clip((vh - 95) / 80, 0, 1)[..., None]
        x = x + (l - x) * np.clip((vh - 175) / 60, 0, 1)[..., None]
        t0 = np.array((20, 14, 26), float)
        h[..., :3] = t0 + (x - t0) * np.clip((vh - 25) / 46, 0, 1)[..., None]
        ro = Image.open(CH / f"roupa-{n}-{ch}.png").convert("RGBA")
        corpo, hair = Image.fromarray(a.astype(np.uint8), "RGBA"), Image.fromarray(h.astype(np.uint8), "RGBA")
        for d in range(4):
            for q in range(4):
                tela = Image.new("RGBA", (W, H))
                tela.alpha_composite(corpo.crop((q * CEL, d * CEL, (q + 1) * CEL, (d + 1) * CEL)), (-4 if False else 0, 18))
                tela.alpha_composite(ro.crop((q * RW, d * RH, (q + 1) * RW, (d + 1) * RH)), (X0, 18 + Y0))
                tela.alpha_composite(hair.crop((d * 64, 0, (d + 1) * 64, 64)), (8, 18 + anc[ch][d][q] - 14))
                t = tela.resize((W * Z, H * Z), Image.NEAREST)
                p.paste(t, ((b * 4 + q) * W * Z, d * H * Z), t)
    p.save(AQUI.parent / destino)
    print(destino, p.size)


if sys.argv[1] == "molde":
    molde()
elif sys.argv[1] == "recorta":
    recorta(sys.argv[2], sys.argv[3], sys.argv[4])
else:
    prova(sys.argv[2], sys.argv[3])
