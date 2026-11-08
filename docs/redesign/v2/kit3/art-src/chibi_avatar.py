"""Chibi do avatar em peças.
base: fatia as folhas dos dois corpos em pixels reais, mede a cabeça de cada quadro e gera o molde dos penteados.
cabelos <folha> <n1,n2,...>: recorta os penteados de uma folha gerada sobre o molde.
Uso: python -I chibi_avatar.py base | cabelos chibi-cabelos1.png 1,16,13,15"""
from pathlib import Path
import json
import sys
import numpy as np
from PIL import Image

AQUI = Path(sys.argv[0]).resolve().parent
SAI = AQUI.parent / "art" / "avatar" / "chibi"
SAI.mkdir(parents=True, exist_ok=True)
PX, CEL = 4, 80
# recorte do molde em pixels reais: largura 64, com a cabeça centrada e sobra em cima para penteados altos
RX, RY, ACIMA = 64, 64, 14
ESC = 4  # cada pixel real vira 4x4 na folha de 1024


def fatia(nome):
    a = np.asarray(Image.open(AQUI / nome).convert("RGB")).astype(np.int16)
    mas = (a[..., 1] - np.maximum(a[..., 0], a[..., 2])) < 60
    lin = np.where(mas.sum(1) > 0)[0]
    fil = [g for g in np.split(lin, np.where(np.diff(lin) > 6)[0] + 1) if len(g) > 60][:4]
    assert len(fil) == 4, len(fil)
    out = []
    for g in fil:
        cols = np.where(mas[g[0]:g[-1] + 1].sum(0) > 0)[0]
        blocos = [b for b in np.split(cols, np.where(np.diff(cols) > 6)[0] + 1) if len(b) > 60][:4]
        assert len(blocos) == 4, len(blocos)
        linha = []
        for b in blocos:
            c = a[g[0]:g[-1] + 1, b[0]:b[-1] + 1]
            m = mas[g[0]:g[-1] + 1, b[0]:b[-1] + 1]
            nh, nw = m.shape[0] // PX, m.shape[1] // PX
            s = np.zeros((nh, nw, 4), np.uint8)
            for j in range(nh):
                for i in range(nw):
                    bm = m[j * PX:(j + 1) * PX, i * PX:(i + 1) * PX]
                    if bm.mean() >= 0.5:
                        s[j, i, :3] = np.median(c[j * PX:(j + 1) * PX, i * PX:(i + 1) * PX][bm], axis=0)
                        s[j, i, 3] = 255
            linha.append(s)
        out.append(linha)
    return out


def cabeca(s):
    """Topo e centro da cabeça: a parte de cima do quadro, onde só há cabeça."""
    op = s[..., 3] > 0
    topo = np.where(op.sum(1) > 0)[0][0]
    xs = np.where(op[topo:topo + 26].sum(0) > 0)[0]
    return int(topo), int((xs[0] + xs[-1]) // 2)


def base():
    ancoras = {}
    primeiros = []
    for nome, chave in (("chibi-base-f.png", "f"), ("chibi-base-m.png", "m")):
        q = fatia(nome)
        folha = np.zeros((CEL * 4, CEL * 4, 4), np.uint8)
        anc = []
        for l, linha in enumerate(q):
            al = []
            for k, s in enumerate(linha):
                topo, cx = cabeca(s)
                x = CEL // 2 - cx
                y = CEL - s.shape[0]
                # recorta o que passar da célula, por segurança
                x0, y0 = max(0, -x), max(0, -y)
                h = min(s.shape[0] - y0, CEL - max(0, y))
                w = min(s.shape[1] - x0, CEL - max(0, x))
                folha[CEL * l + max(0, y):CEL * l + max(0, y) + h, CEL * k + max(0, x):CEL * k + max(0, x) + w] = s[y0:y0 + h, x0:x0 + w]
                al.append(topo + y)
            anc.append(al)
        ancoras[chave] = anc
        Image.fromarray(folha, "RGBA").save(SAI / f"corpo-{chave}.png")
        primeiros.append((chave, folha))
        print(chave, anc)
    (SAI / "ancoras.json").write_text(json.dumps(ancoras), encoding="utf-8")

    # molde: 4 direções nas colunas, 4 linhas iguais, só com a silhueta em magenta
    folha = primeiros[0][1]
    topos = ancoras["f"]
    M = Image.new("RGB", (RX * ESC * 4, RY * ESC * 4), (0, 255, 0))
    for lin in range(4):
        for dire in range(4):
            y0 = CEL * dire + topos[dire][0] - ACIMA
            x0 = CEL // 2 - RX // 2
            c = folha[max(0, y0):y0 + RY, x0:x0 + RX]
            cel = np.zeros((RY, RX, 3), np.uint8)
            cel[...] = (0, 255, 0)
            desl = max(0, -y0)
            cel[desl:desl + c.shape[0]][c[..., 3] > 0] = (255, 0, 255)
            t = Image.fromarray(cel).resize((RX * ESC, RY * ESC), Image.NEAREST)
            M.paste(t, (dire * RX * ESC, lin * RY * ESC))
    M.save(AQUI / "chibi-molde.png")
    print("molde", M.size)


def cabelos(nome, numeros):
    a = np.asarray(Image.open(AQUI / nome).convert("RGB").resize((RX * ESC * 4, RY * ESC * 4), Image.BOX)).astype(float)
    t = RX * ESC
    for lin, n in enumerate(numeros):
        folha = np.zeros((RY, RX * 4, 4), np.uint8)
        for dire in range(4):
            c = a[lin * t:(lin + 1) * t, dire * t:(dire + 1) * t]
            sat = c.max(2) - c.min(2)
            eh = sat < 60
            for j in range(RY):
                for i in range(RX):
                    bm = eh[j * ESC:(j + 1) * ESC, i * ESC:(i + 1) * ESC]
                    if bm.mean() >= 0.5:
                        v = np.median(c[j * ESC:(j + 1) * ESC, i * ESC:(i + 1) * ESC].min(2)[bm])
                        folha[j, dire * RX + i] = (v, v, v, 255)
        Image.fromarray(folha, "RGBA").save(SAI / f"cabelo-{n}.png")
        print("cabelo", n)


if sys.argv[1] == "base":
    base()
else:
    cabelos(sys.argv[2], [int(x) for x in sys.argv[3].split(",")])
