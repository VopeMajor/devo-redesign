"""Sistema: recorta do verde as duas janelas de vitral dos ícones e prepara o sigilo do jogo na paleta.
Uso: python os_recorta.py (na pasta art-src)"""
from pathlib import Path
import numpy as np
from PIL import Image

AQUI = Path(__file__).parent
SAI = AQUI.parent / "art" / "os"
SAI.mkdir(parents=True, exist_ok=True)
RAIZ = AQUI.parents[4]

im = np.array(Image.open(AQUI / "os-arcos.png").convert("RGB")).astype(float)
verde = np.clip((im[..., 1] - np.maximum(im[..., 0], im[..., 2])) / 70, 0, 1)
sem = im.copy()
sem[..., 1] = np.minimum(im[..., 1], np.maximum(im[..., 0], im[..., 2]))
rgba = np.dstack([sem, (1 - verde) * 255]).astype("uint8")
meio = rgba.shape[1] // 2


def vidro_aceso(img):
    """Janela aberta é janela acesa: a rosácea do topo vira ametista. O vidro do meio fica escuro, porque encosta no contorno, e o emblema lê melhor sobre ele."""
    px = np.array(img).astype(float)
    h, w = px.shape[:2]
    lum = px[..., :3].mean(axis=2)
    escuro = (lum < 92) & (px[..., 3] > 128)
    # as regiões escuras que encostam no transparente são o contorno de tinta, não vidro
    fora = np.zeros((h, w), bool)
    pilha = [(y, x) for y in range(h) for x in range(w) if px[y, x, 3] <= 128]
    while pilha:
        y, x = pilha.pop()
        for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= yy < h and 0 <= xx < w and not fora[yy, xx] and escuro[yy, xx]:
                fora[yy, xx] = True
                pilha.append((yy, xx))
    vidro = escuro & ~fora
    t = np.clip((lum - 18) / 42, 0, 1)[..., None]
    novo = np.array([164, 92, 255]) * (1 - t) + np.array([58, 28, 110]) * t
    px[..., :3][vidro] = novo[vidro]
    return Image.fromarray(px.astype("uint8"))


for nome, parte in (("arco", rgba[:, :meio]), ("arco-fechado", rgba[:, meio:])):
    p = Image.fromarray(parte)
    p = p.crop(p.getbbox())
    print(nome, p.size)
    # o ícone fica mais baixo que o desenho: cabem mais fileiras e o emblema ganha espaço
    p = p.resize((240, round(p.height * 240 / p.width * .8)), Image.LANCZOS)
    if nome == "arco":
        p = vidro_aceso(p)
    p.save(SAI / f"{nome}.webp", quality=90, method=6)

# sigilo do jogo: o vermelho vira ametista, o resto segue igual
s = np.array(Image.open(RAIZ / "public" / "images" / "devo-sigil.png").convert("RGB")).astype(float)
forca = np.clip((s[..., 0] - s[..., 1]) / 90, 0, 1)[..., None]
luz = s.mean(axis=2, keepdims=True) / 255
ame = np.array([164, 92, 255]) * np.clip(luz * 2.2 + forca * .35, 0, 1)
s2 = np.clip(s * (1 - forca) + ame * forca, 0, 255).astype("uint8")
Image.fromarray(s2).resize((640, 640), Image.LANCZOS).save(SAI / "sigilo.webp", quality=86, method=6)
# só o nó central, em creme com fundo transparente, para o botão de início
miolo = s[350:680, 350:680].mean(axis=2)
# fora do círculo do nó ficam as runas: nesse tamanho só viram sujeira
yy, xx = np.mgrid[350:680, 350:680]
dentro = np.hypot(yy - 505, xx - 505) < 165
alfa = np.clip((miolo - 45) / 90, 0, 1) * 255 * dentro
mini = np.dstack([np.full(miolo.shape, 241), np.full(miolo.shape, 236), np.full(miolo.shape, 224), alfa]).astype("uint8")
Image.fromarray(mini).resize((112, 112), Image.LANCZOS).save(SAI / "sigilo-mini.webp", quality=90, method=6)

# fundo do início: a mesma arte, só em preto e violeta, para os vitrais serem a coisa mais clara da tela
f = np.array(Image.open(AQUI / "home-fundo.png").convert("RGB")).astype(float).mean(axis=2, keepdims=True) / 255
f = f ** 1.15
calmo = np.array([11, 8, 18]) * (1 - f) + np.array([62, 30, 122]) * f
Image.fromarray(calmo.astype("uint8")).save(SAI / "fundo-calmo.webp", quality=82, method=6)
print("ok")
