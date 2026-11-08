"""Converte a pose idle em pixels reais: acha a grade da imagem, usa a cor predominante de cada bloco e limpa
pixels isolados. Depois compara com o P4AU na mesma escala.
Uso: python -I pixel_melissa2.py <pasta com p4au-NN.png>"""
from pathlib import Path
import sys
import numpy as np
from PIL import Image

AQUI = Path(sys.argv[0]).resolve().parent
P4AU = Path(sys.argv[1])
ART = AQUI.parent / "art"
CORES, ZOOM = 64, 2

im = np.asarray(Image.open(AQUI / "pixel-melissa-idle.png").convert("RGB")).astype(np.float32)
r, g, b = im[..., 0], im[..., 1], im[..., 2]
alfa = (g - np.maximum(r, b)) < 55
limpo = np.dstack([r, np.minimum(g, np.maximum(r, b)), b]).astype(np.uint8)
linhas, cols = np.where(alfa.sum(1) > 0)[0], np.where(alfa.sum(0) > 0)[0]
y0, y1, x0, x1 = linhas[0], linhas[-1] + 1, cols[0], cols[-1] + 1
print("figura", x1 - x0, y1 - y0)


def periodo(cinza, eixo):
    """Tamanho do pixel da imagem, pela repetição das bordas ao longo de um eixo."""
    d = np.abs(np.diff(cinza, axis=eixo)).sum(1 - eixo)
    d = d - d.mean()
    esp = np.abs(np.fft.rfft(d))
    freq = np.fft.rfftfreq(len(d))
    faixa = (freq > 1 / 12) & (freq < 1 / 2.5)
    return 1 / freq[faixa][np.argmax(esp[faixa])]


cinza = limpo[y0:y1, x0:x1].mean(2)


def variacao(t):
    """Quanto a cor varia dentro de cada bloco, para um tamanho de pixel t. Quanto menor, melhor a grade."""
    nx, ny = int(cinza.shape[1] / t), int(cinza.shape[0] / t)
    ys = (np.arange(cinza.shape[0]) / t).astype(int).clip(0, ny - 1)
    xs = (np.arange(cinza.shape[1]) / t).astype(int).clip(0, nx - 1)
    chave = ys[:, None] * nx + xs[None, :]
    n = np.bincount(chave.ravel(), minlength=nx * ny)
    soma = np.bincount(chave.ravel(), cinza.ravel(), minlength=nx * ny)
    soma2 = np.bincount(chave.ravel(), (cinza ** 2).ravel(), minlength=nx * ny)
    return ((soma2 - soma ** 2 / np.maximum(n, 1)).sum()) / cinza.size


# blocos maiores sempre variam mais, então comparamos cada tamanho com a tendência dos vizinhos
tams = np.arange(2.5, 7.01, 0.05)
vs = np.array([variacao(t) for t in tams])
tendencia = np.convolve(vs, np.ones(21) / 21, mode="same")
validos = (tams > 3) & (tams < 6.5)
tam = float(tams[validos][np.argmin((vs / tendencia)[validos])])
print(f"grade: {tam:.2f} px, altura nativa {cinza.shape[0] / tam:.0f}")

# paleta a partir da imagem inteira, para a escolha de cor por bloco não criar tons novos
fig = Image.fromarray(limpo[y0:y1, x0:x1])
amostra = limpo[y0:y1, x0:x1][alfa[y0:y1, x0:x1]].reshape(-1, 1, 3)
paleta = Image.fromarray(amostra[:: max(1, len(amostra) // 150000)]).quantize(CORES, method=Image.MEDIANCUT, dither=Image.NONE)
idx = np.asarray(fig.quantize(palette=paleta, dither=Image.NONE))
mas = alfa[y0:y1, x0:x1]
H, W = idx.shape
nw, nh = round(W / tam), round(H / tam)
saida = np.zeros((nh, nw), np.int16) - 1
for j in range(nh):
    ya, yb = int(j * tam), max(int((j + 1) * tam), int(j * tam) + 1)
    for i in range(nw):
        xa, xb = int(i * tam), max(int((i + 1) * tam), int(i * tam) + 1)
        if mas[ya:yb, xa:xb].mean() < 0.5:
            continue
        v = idx[ya:yb, xa:xb][mas[ya:yb, xa:xb]]
        saida[j, i] = np.bincount(v).argmax()

# limpeza: pixel sem nenhum vizinho da mesma cor assume a cor mais comum em volta
for _ in range(2):
    novo = saida.copy()
    for j in range(1, nh - 1):
        for i in range(1, nw - 1):
            c = saida[j, i]
            viz = np.r_[saida[j - 1, i], saida[j + 1, i], saida[j, i - 1], saida[j, i + 1]]
            if c >= 0 and not (viz == c).any():
                v = viz[viz >= 0]
                novo[j, i] = np.bincount(v).argmax() if len(v) else -1
    saida = novo

pal = np.array(paleta.getpalette()[: CORES * 3]).reshape(-1, 3).astype(np.uint8)
rgba = np.zeros((nh, nw, 4), np.uint8)
rgba[saida >= 0, :3] = pal[saida[saida >= 0]]
rgba[saida >= 0, 3] = 255
q = Image.fromarray(rgba, "RGBA")
q.save(ART / "melissa-pixel-idle.png")
print("melissa-pixel-idle.png", q.size)

ref = []
for n in ("03", "06", "09", "11"):
    f = Image.open(P4AU / f"p4au-{n}.png").convert("RGBA")
    b2 = np.asarray(f).copy()
    if b2[0, 0, 3] > 0:
        b2[..., 3] = np.where(np.abs(b2[..., :3].astype(np.int16) - b2[0, 0, :3].astype(np.int16)).sum(2) < 12, 0, b2[..., 3])
    f = Image.fromarray(b2, "RGBA")
    ref.append(f.crop(f.getbbox()))
todos = [q] + ref
L, A = sum(t.width for t in todos) + 12 * (len(todos) + 1), max(t.height for t in todos) + 24
p = Image.new("RGB", (L * ZOOM, A * ZOOM), (28, 22, 38))
x = 12
for t in todos:
    z = t.resize((t.width * ZOOM, t.height * ZOOM), Image.NEAREST)
    p.paste(z, (x * ZOOM, (A - 12 - t.height) * ZOOM), z)
    x += t.width + 12
p.save(AQUI.parent / "melissa-pixel-vs-p4au.png")
print("prancha", p.size)
c = q.crop((q.width // 4, 0, q.width * 3 // 4, q.height * 2 // 5))
f = Image.new("RGB", c.size, (28, 22, 38))
f.paste(c, (0, 0), c)
f.resize((c.width * 5, c.height * 5), Image.NEAREST).save(AQUI.parent / "melissa-pixel-rosto.png")
