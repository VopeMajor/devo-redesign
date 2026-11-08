"""Blefe: monta as 52 cartas numa folha só (a mesma frente e o mesmo verso do Memory Rush), recorta os objetos e reduz o Javali à metade.
Uso: python blefe_px.py (na pasta art-src)"""
from pathlib import Path
import numpy as np
from PIL import Image

AQUI = Path(__file__).parent
SAI = AQUI.parent / "art" / "os" / "blefe"
MEM = AQUI.parent / "art" / "os" / "memory"
NPC = AQUI.parent / "art" / "os" / "npc"
SAI.mkdir(parents=True, exist_ok=True)
GLIFOS = {
    "A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
    "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
    "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
    "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
    "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
    "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
    "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
    "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
    "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
    "0": ["01110", "10011", "10101", "10101", "10101", "11001", "01110"],
    "1": ["010", "110", "010", "010", "010", "010", "111"],
    "J": ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
    "Q": ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
    "K": ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
}
RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
# espadas, copas, ouros, paus: mesma ordem de BLUFF_SUITS; os símbolos são os do Memory Rush
NAIPES = [MEM / "s3.png", MEM / "s4.png", MEM / "s6.png", MEM / "s5.png"]
PRETO, RUBI = (28, 28, 31, 255), (163, 18, 31, 255)


def reduz_px(im, lado):
    a = np.array(im.convert("RGBA"))
    m = a[..., 3] > 0
    ys, xs = np.where(m)
    im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    w, h = im.size
    esc = lado / max(w, h)
    return im.resize((max(1, round(w * esc)), max(1, round(h * esc))), Image.NEAREST if esc >= 1 else Image.BOX).convert("RGBA").point(lambda v: v)


def duro(im):
    a = np.array(im)
    a[..., 3] = (a[..., 3] > 128) * 255
    return Image.fromarray(a, "RGBA")


def escreve(card, txt, cor, x, y, esc):
    for ch in txt:
        g = GLIFOS[ch]
        for j, lin in enumerate(g):
            for i, v in enumerate(lin):
                if v == "1":
                    for a in range(esc):
                        for b in range(esc):
                            card.putpixel((x + i * esc + a, y + j * esc + b), cor)
        x += len(g[0]) * esc + 1


# Objetos primeiro: as figuras J, Q, K saem da folha nova.
f = np.array(Image.open(AQUI / "bf-objetos.png").convert("RGB")).astype(float)
H, W = f.shape[:2]


def sem_vizinhos(m):
    """Apaga pedaços dos objetos vizinhos que entraram no recorte: o que encosta na borda da célula, menos o maior pedaço (o próprio objeto)."""
    h, w = m.shape
    visto = m.copy()
    pedacos = []
    for y0 in range(h):
        for x0 in range(w):
            if visto[y0, x0]:
                continue
            visto[y0, x0] = True
            pilha, pts, borda = [(y0, x0)], [], False
            while pilha:
                y, x = pilha.pop()
                pts.append((y, x))
                borda = borda or y in (0, h - 1) or x in (0, w - 1)
                for a, b in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                    if 0 <= a < h and 0 <= b < w and not visto[a, b]:
                        visto[a, b] = True
                        pilha.append((a, b))
            pedacos.append((pts, borda))
    maior = max(len(p[0]) for p in pedacos)
    out = m.copy()
    for pts, borda in pedacos:
        if borda and len(pts) < maior:
            ys, xs = zip(*pts)
            out[list(ys), list(xs)] = True
    return out


def objeto(r, c, alt, cores=12):
    cel = f[r * H // 3:(r + 1) * H // 3, c * W // 4:(c + 1) * W // 4]
    m = sem_vizinhos((cel[..., 1] - np.maximum(cel[..., 0], cel[..., 2])) > 50)
    ys, xs = np.where(~m)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    a, mm = cel[y0:y1, x0:x1].copy(), m[y0:y1, x0:x1]
    a[..., 1] = np.minimum(a[..., 1], np.maximum(a[..., 0], a[..., 2]) + 6)
    a[mm] = a[~mm].mean(axis=0)
    larg = max(1, round((x1 - x0) * alt / (y1 - y0)))
    img = Image.fromarray(a.astype("uint8")).resize((larg, alt), Image.BOX)
    alfa = Image.fromarray(((~mm) * 255).astype("uint8")).resize((larg, alt), Image.BOX).point(lambda v: 255 if v > 128 else 0)
    c2 = img.quantize(colors=cores, method=Image.FASTOCTREE, dither=Image.NONE).convert("RGBA")
    c2.putalpha(alfa)
    return c2


for (r, c, nome, alt) in [(0, 0, "tambor", 48), (0, 1, "bala", 11), (0, 2, "gasta", 11), (0, 3, "clarao", 40), (1, 1, "fumaca", 18), (1, 2, "ficha", 32), (1, 3, "cinzas", 16)]:
    objeto(r, c, alt).save(SAI / f"{nome}.png", optimize=True)
FIGURAS = {"J": objeto(2, 0, 26, 8), "Q": objeto(2, 1, 26, 8), "K": objeto(2, 2, 26, 8)}

OURO = Image.new("RGBA", (5, 7), (0, 0, 0, 0))
for j, lin in enumerate(["00100", "01110", "11111", "11111", "11111", "01110", "00100"]):
    for i, v in enumerate(lin):
        if v == "1":
            OURO.putpixel((i, j), RUBI)
frente = Image.open(MEM / "frente.png").convert("RGBA")
CW, CH = frente.size
folha = Image.new("RGBA", (CW * 13, CH * 4), (0, 0, 0, 0))
base = frente.getpixel((CW // 2, CH // 2))
for s, arq in enumerate(NAIPES):
    n = Image.open(arq).convert("RGBA")
    grande = duro(reduz_px(n, 15))
    medio = duro(reduz_px(n, 10))
    peq = duro(reduz_px(n, 8))
    cor = RUBI if s in (1, 2) else PRETO
    for r, rk in enumerate(RANKS):
        c = frente.copy()
        # índice no alto, à esquerda: é o que aparece quando a carta está na mão, sobreposta
        for yy in range(3, 26):
            for xx in range(3, 17):
                c.putpixel((xx, yy), base)
        esc = 1 if rk == "10" else 2
        ty = 4 if rk != "10" else 5
        escreve(c, rk, cor, 4, ty, esc)
        c.alpha_composite(peq, (4 + (10 - peq.width) // 2, 19))
        if rk in FIGURAS:
            fg = FIGURAS[rk]
            c.alpha_composite(fg, (CW - fg.width - 3, CH - fg.height - 7))
        elif rk == "A":
            c.alpha_composite(grande, ((CW - grande.width) // 2 + 2, 30))
        else:
            # o valor em naipes, no pé da carta: dá para contar sem gastar a carta inteira
            total = int(rk)
            # o ouro reduzido vira um risco: este é desenhado à mão
            pq = duro(reduz_px(n, 6)) if s != 2 else OURO
            cols = 3
            for i in range(total):
                col, lin = i % cols, i // cols
                c.alpha_composite(pq, (10 + col * 8, 30 + lin * 7))
        folha.alpha_composite(c, (r * CW, s * CH))
folha.save(SAI / "cartas.png", optimize=True)

# O Javali à metade (a pixel exato de 2x2), para caber atrás da mesa durante a partida.
for p in ["convite", "trama", "explica", "sombrio", "neutro", "riso", "desdem", "pensativo"]:
    im = Image.open(NPC / f"javali-{p}.png").convert("RGBA")
    pq = im.resize((108, 96), Image.BOX)
    q = pq.convert("RGB").quantize(colors=24, method=Image.FASTOCTREE, dither=Image.NONE).convert("RGBA")
    q.putalpha(pq.getchannel("A").point(lambda v: 255 if v > 128 else 0))
    q.save(SAI / f"javali-{p}.png", optimize=True)
print("ok", folha.size)
