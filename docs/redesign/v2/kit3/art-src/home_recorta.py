"""Tela inicial: fundo em webp, as 5 faixas recortadas do verde e a folha preta de borda rasgada.
Uso: python home_recorta.py (na pasta art-src)"""
from pathlib import Path
import numpy as np
from PIL import Image

AQUI = Path(__file__).parent
SAI = AQUI.parent / "art" / "home"
SAI.mkdir(parents=True, exist_ok=True)

Image.open(AQUI / "home-fundo.png").convert("RGB").save(SAI / "fundo.webp", quality=84, method=6)

im = np.array(Image.open(AQUI / "home-faixas.png").convert("RGB")).astype(float)
verde = np.clip((im[..., 1] - np.maximum(im[..., 0], im[..., 2])) / 90, 0, 1)
alfa = 1 - verde
# tira o verde que vazou na borda do papel
sem = im.copy()
sem[..., 1] = np.minimum(im[..., 1], np.maximum(im[..., 0], im[..., 2]))

linhas = alfa[:, :1200].mean(axis=1) > .5
faixas, y0 = [], None
for y, on in enumerate(linhas):
    if on and y0 is None:
        y0 = y
    if not on and y0 is not None:
        faixas.append((y0, y))
        y0 = None
print("faixas", faixas)
assert len(faixas) == 5

contorno = None
for i, (a, b) in enumerate(faixas, 1):
    a, b = max(0, a - 16), min(im.shape[0], b + 16)
    rgb = sem[a:b]
    al = alfa[a:b]
    xs = np.where(al.max(axis=0) > .5)[0]
    fim = xs.max() + 2
    rgba = np.dstack([rgb[:, :fim], al[:, :fim] * 255]).astype("uint8")
    Image.fromarray(rgba).save(SAI / f"faixa-{i}.webp", quality=88, method=6)
    # versão ametista, para a faixa em destaque: o papel multiplicado pela tinta
    ame = rgb[:, :fim].copy()
    tinta = np.array([164, 92, 255]) / np.array([241, 236, 224])
    ame = np.clip(ame * tinta, 0, 255)
    Image.fromarray(np.dstack([ame, al[:, :fim] * 255]).astype("uint8")).save(SAI / f"faixa-{i}-ame.webp", quality=88, method=6)
    # versão violeta escura: sistema trancado e quadro de anúncios
    vio = np.clip(rgb[:, :fim] * (np.array([58, 30, 104]) / np.array([241, 236, 224])), 0, 255)
    Image.fromarray(np.dstack([vio, al[:, :fim] * 255]).astype("uint8")).save(SAI / f"faixa-{i}-vio.webp", quality=88, method=6)
    print(i, rgba.shape)
    if i == 1:
        contorno = al[:, :1200].argmax(axis=0)

# folha preta: usa o contorno rasgado de verdade da 1ª faixa, com a beirada de papel aparecendo
L, A = 1200, 150
y = np.arange(A)[:, None]
borda = contorno - contorno.min() + 10
papel = sem[faixas[0][0] + 40, :L]
sai = np.zeros((A, L, 4), dtype="uint8")
preto = np.array([11, 8, 18])
mascara = y >= borda
beira = mascara & (y < borda + 7 + (np.sin(np.arange(L) / 37) * 2.5).astype(int) + (np.sin(np.arange(L) / 11) * 1.5).astype(int))
sai[mascara[..., 0] if mascara.ndim == 3 else mascara] = [*preto, 255]
for k in range(3):
    sai[..., k][beira] = np.broadcast_to(papel[:, k], (A, L))[beira]
Image.fromarray(sai).save(SAI / "folha.webp", quality=90, method=6)

for f in sorted(SAI.iterdir()):
    print(f.name, f.stat().st_size // 1024, "KB")
