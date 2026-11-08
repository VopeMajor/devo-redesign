"""Recorta o fundo verde e prepara a arte do kit3: python -I processar.py (rodar nesta pasta)."""
from pathlib import Path
import sys
import numpy as np
from PIL import Image

AQUI = Path(sys.argv[0]).resolve().parent
ART = AQUI.parent / "art"
ART.mkdir(exist_ok=True)


def sem_verde(im):
    """Fundo verde vira transparente, com a borda sem contaminação de verde."""
    a = np.asarray(im.convert("RGB")).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    verde = g - np.maximum(r, b)
    alfa = np.clip(1 - (verde - 25) / 70, 0, 1)
    g2 = np.minimum(g, np.maximum(r, b))
    saida = np.dstack([r, g2, b, alfa * 255]).astype(np.uint8)
    return Image.fromarray(saida, "RGBA")


def retrato(nome, destino, altura):
    im = sem_verde(Image.open(AQUI / nome))
    im = im.crop(im.getbbox())
    im = im.resize((round(im.width * altura / im.height), altura), Image.LANCZOS)
    im.save(ART / destino)


def folha(nome, destino, px=4, celula=80):
    """Fatia a folha 4x4, reduz para o pixel real e alinha pelos pés."""
    a = np.asarray(Image.open(AQUI / nome).convert("RGB")).astype(np.int16)
    fundo = (a[..., 1] - np.maximum(a[..., 0], a[..., 2])) > 60
    alt, larg = fundo.shape
    linhas = np.where((~fundo).sum(1) > 0)[0]
    # separa as fileiras pelas faixas vazias
    grupos = np.split(linhas, np.where(np.diff(linhas) > 8)[0] + 1)
    grupos = [g for g in grupos if len(g) > 60][:4]
    saida = Image.new("RGBA", (celula * 4, celula * 4), (0, 0, 0, 0))
    im = sem_verde(Image.open(AQUI / nome))
    for lin, g in enumerate(grupos):
        faixa = ~fundo[g[0]:g[-1] + 1]
        cols = np.where(faixa.sum(0) > 0)[0]
        blocos = np.split(cols, np.where(np.diff(cols) > 8)[0] + 1)
        blocos = [b for b in blocos if len(b) > 40][:4]
        for col, b in enumerate(blocos):
            c = im.crop((b[0], g[0], b[-1] + 1, g[-1] + 1))
            c = c.resize((max(1, c.width // px), max(1, c.height // px)), Image.NEAREST)
            arr = np.asarray(c).copy()
            arr[..., 3] = np.where(arr[..., 3] > 128, 255, 0)
            c = Image.fromarray(arr, "RGBA")
            x = celula * col + (celula - c.width) // 2
            y = celula * lin + celula - c.height
            saida.paste(c, (x, y), c)
    saida.save(ART / destino)
    print(destino, "fileiras", len(grupos))


def cena(nome, destino, largura=None, qualidade=88):
    im = Image.open(AQUI / nome).convert("RGB")
    if largura:
        im = im.resize((largura, round(im.height * largura / im.width)), Image.LANCZOS)
    im.save(ART / destino, quality=qualidade)


def poses(nome, base, px=4):
    """Separa as três poses de corpo inteiro e reduz para o pixel real, com os pés na mesma linha."""
    im = sem_verde(Image.open(AQUI / nome))
    a = np.asarray(im)[..., 3] > 128
    cols = np.where(a.sum(0) > 2)[0]
    blocos = np.split(cols, np.where(np.diff(cols) > 12)[0] + 1)
    blocos = sorted([b for b in blocos if len(b) > 80], key=lambda b: b[0])
    print(base, "poses", len(blocos))
    for i, b in enumerate(blocos):
        linhas = np.where(a[:, b[0]:b[-1] + 1].sum(1) > 0)[0]
        c = im.crop((b[0], linhas[0], b[-1] + 1, linhas[-1] + 1))
        c = c.resize((c.width // px, c.height // px), Image.NEAREST)
        arr = np.asarray(c).copy()
        arr[..., 3] = np.where(arr[..., 3] > 128, 255, 0)
        Image.fromarray(arr, "RGBA").save(ART / f"{base}-{i}.png")
        print(" ", f"{base}-{i}.png", c.size)


folha("sprites-avatar.png", "avatar.png")
folha("sprites-melissa-v2.png", "chibi-melissa.png")
folha("sprites-galo.png", "chibi-galo.png")
for nome, base in (("pose-melissa.png", "pose-melissa"), ("pose-galo.png", "pose-galo")):
    if (AQUI / nome).exists():
        poses(nome, base)
cena("casa-quarto.png", "quarto.webp")
cena("casa-corte.png", "corte.webp")
Image.open(AQUI / "casa-corte.png").convert("RGB").crop((130, 280, 930, 1280)).resize((400, 500), Image.LANCZOS).save(ART / "casa-corte-thumb.png")

if (AQUI / "oficina.png").exists():
    cena("oficina.png", "oficina.webp")
