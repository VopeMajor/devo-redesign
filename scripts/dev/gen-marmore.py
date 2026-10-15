"""Gera o mármore negro do shell (área SISTEMA) como imagem raster ladrilhável.

Por que raster: o mármore procedural em SVG (feTurbulence com 5 oitavas) é refeito na pintura e, no
renderizador por software do CI (e em celulares fracos), travava a página ao abrir o Pulso. Uma
imagem de 512 px decodificada uma vez custa quase nada.

Paleta da ref-mestra (refs/ref-xadrez-marmore.png): pedra #111113–#1c1c1f, veios cinza neutros
(#797c81 → #8f8e8b), nenhum tom amarelado/azulado.

Uso: python3 -I scripts/dev/gen-marmore.py public/images/os/marmore-negro.webp
     python3 -I scripts/dev/gen-marmore.py public/images/os/marmore-branco.webp branco
"""
import sys

import numpy as np
from PIL import Image

N = 768
rng = np.random.default_rng(7 if len(sys.argv) > 2 and sys.argv[2] == 'branco' else 19)


def fractal(beta: float, sx: float = 1.0, sy: float = 1.0, lo: int = 1) -> np.ndarray:
    """Ruído 1/f^beta periódico (ladrilha sozinho) via FFT; sx/sy esticam o grão."""
    fx = np.fft.fftfreq(N)[None, :] * N / sx
    fy = np.fft.fftfreq(N)[:, None] * N / sy
    f = np.sqrt(fx * fx + fy * fy)
    f[0, 0] = 1
    amp = 1 / f**beta
    amp[f < lo] = 0
    phase = rng.uniform(0, 2 * np.pi, (N, N))
    n = np.real(np.fft.ifft2(amp * np.exp(1j * phase)))
    n -= n.mean()
    return n / n.std()


def sample(img: np.ndarray, x: np.ndarray, y: np.ndarray) -> np.ndarray:
    """Amostra bilinear com volta (mantém o ladrilho contínuo)."""
    x0 = np.floor(x).astype(int)
    y0 = np.floor(y).astype(int)
    tx, ty = x - x0, y - y0
    x0 %= N
    y0 %= N
    x1 = (x0 + 1) % N
    y1 = (y0 + 1) % N
    a = img[y0, x0] * (1 - tx) + img[y0, x1] * tx
    b = img[y1, x0] * (1 - tx) + img[y1, x1] * tx
    return a * (1 - ty) + b * ty


yy, xx = np.mgrid[0:N, 0:N].astype(float)

# campo base esticado na diagonal + distorção (domain warp) para o desenho de pedra
base = fractal(2.1, sx=1.0, sy=2.2)
wx = fractal(2.3) * 38
wy = fractal(2.3) * 38
field = sample(base, xx + wx, yy + wy)
# um segundo campo, mais fino, para veios secundários
fine = sample(fractal(1.7, sx=1.0, sy=1.6), xx + wx * 0.6, yy + wy * 0.6)

# veios = mármore clássico: faixa senoidal diagonal distorcida pelo ruído (2 veios longos por ladrilho,
# periódicos), linha fina tipo rachadura + halo baixo; rachaduras secundárias só em manchas.
def vein(n: np.ndarray, width: float) -> np.ndarray:
    return np.exp(-((n / width) ** 2))

phase = 2 * np.pi * (xx * 1 + yy * 2) / N + field * 0.55 + fine * 0.12
main = np.sin(phase)
v_main = vein(main, 0.03)
v_halo = vein(main, 0.45)
patch = np.clip(fractal(2.4) * 0.8 + 0.1, 0, 1)
v_sec = vein(fine - 0.5, 0.035) * patch * 0.6
v_sec2 = vein(np.sin(2 * np.pi * (xx * 3 - yy * 1) / N + field * 0.9 + fine * 0.3), 0.03) * np.clip(fractal(2.2) - 0.4, 0, 1) * 0.5

# nuvem da pedra (variação lenta de tom, bem baixa)
cloud = fractal(2.6)

stone = 0.07 + cloud * 0.013  # ~#121214
lum = stone + v_halo * 0.035 + v_main * 0.36 * (0.55 + 0.45 * patch) + v_sec * 0.3 + v_sec2 * 0.3
# grão finíssimo
lum += rng.normal(0, 0.005, (N, N))
lum = np.clip(lum, 0, 1)

white = len(sys.argv) > 2 and sys.argv[2] == 'branco'
if white:
    # mármore branco (porcelana #ecebe8) com os mesmos veios em cinza #8f8e8b
    ink = np.clip(lum - stone, 0, 1)
    pale = 0.93 + cloud * 0.012 - ink * 0.62
    rgb = np.stack([pale * 1.0, pale * 0.997, pale * 0.988], -1)
else:
    # cinza neutro levemente frio (#797c81 nos veios): b um tico acima de r/g
    rgb = np.stack([lum * 0.985, lum * 0.995, lum * 1.03], -1)
img = Image.fromarray((np.clip(rgb, 0, 1) * 255).round().astype(np.uint8), 'RGB')
out = sys.argv[1] if len(sys.argv) > 1 else 'marmore-negro.webp'
img.save(out, quality=86, method=6)
print(out, img.size, 'média', np.asarray(img).reshape(-1, 3).mean(0).round(1))
