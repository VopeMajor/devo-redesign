"""Memory Rush: recorta os símbolos (32x32) e as cartas (48x64) em pixel único, com fundo transparente, e reduz a mesa.
Uso: python memory_px.py (na pasta art-src)"""
from pathlib import Path
import numpy as np
from PIL import Image

AQUI = Path(__file__).parent
SAI = AQUI.parent / "art" / "os" / "memory"
SAI.mkdir(parents=True, exist_ok=True)


def recorta(cel, larg, alt, cores):
    """Janela justa no desenho, sem o verde, reduzida para a grade pedida; sem largura, ela segue a proporção do desenho."""
    verde = (cel[..., 1] - np.maximum(cel[..., 0], cel[..., 2])) > 50
    ys, xs = np.where(~verde)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    if not larg:
        larg = round(alt * (x1 - x0) / (y1 - y0))
        print("carta", larg, alt)
    # mantém a proporção da grade: a janela cresce no lado menor, centrada
    al, la = y1 - y0, x1 - x0
    alvo = larg / alt
    if la / al < alvo:
        nl = int(al * alvo)
        x0 -= (nl - la) // 2
        x1 = x0 + nl
    else:
        na = int(la / alvo)
        y0 -= (na - al) // 2
        y1 = y0 + na
    H, W = cel.shape[:2]
    x0, y0 = max(0, x0), max(0, y0)
    q, m = cel[y0:min(H, y1), x0:min(W, x1)].copy(), verde[y0:min(H, y1), x0:min(W, x1)]
    q[..., 1] = np.minimum(q[..., 1], np.maximum(q[..., 0], q[..., 2]) + 6)
    q[m] = q[~m].mean(axis=0)
    img = Image.fromarray(q.astype("uint8")).resize((larg, alt), Image.BOX)
    alfa = Image.fromarray(((~m) * 255).astype("uint8")).resize((larg, alt), Image.BOX).point(lambda v: 255 if v > 140 else 0)
    c = img.quantize(colors=cores, method=Image.FASTOCTREE, dither=Image.NONE).convert("RGBA")
    c.putalpha(alfa)
    return c


f = np.array(Image.open(AQUI / "mr-simbolos.png").convert("RGB")).astype(float)
H, W = f.shape[:2]
for n in range(13):
    cel = f[(n // 5) * H // 3:(n // 5 + 1) * H // 3, (n % 5) * W // 5:(n % 5 + 1) * W // 5]
    recorta(cel, 32, 32, 16).save(SAI / f"s{n}.png", optimize=True)
f = np.array(Image.open(AQUI / "mr-cartas.png").convert("RGB")).astype(float)
H, W = f.shape[:2]
recorta(f[:, :W // 2], 0, 64, 24).save(SAI / "verso.png", optimize=True)
recorta(f[:, W // 2:], 0, 64, 24).save(SAI / "frente.png", optimize=True)
im = Image.open(AQUI / "mr-mesa.png").convert("RGB")
w, h = im.size
al = min(h, w * 2 // 3)
la = al * 3 // 2
im.crop(((w - la) // 2, (h - al) // 2, (w + la) // 2, (h + al) // 2)).resize((216, 144), Image.BOX).quantize(colors=40, method=Image.FASTOCTREE, dither=Image.NONE).save(SAI / "mesa.png", optimize=True)
print("ok")
