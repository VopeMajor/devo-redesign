"""Tela inicial: recorta do verde os espinhos e os 17 emblemas dos sistemas.
Uso: python home_emblemas.py (na pasta art-src)"""
from pathlib import Path
import numpy as np
from PIL import Image

AQUI = Path(__file__).parent
SAI = AQUI.parent / "art" / "home"
IDS = "record pulso mensagens cartas inventario trocas calendario casa torres poco salao jogos corporacoes virtudes arcanos ajustes mesa".split()


def recorta(caminho):
    im = np.array(Image.open(caminho).convert("RGB")).astype(float)
    verde = np.clip((im[..., 1] - np.maximum(im[..., 0], im[..., 2])) / 70, 0, 1)
    sem = im.copy()
    sem[..., 1] = np.minimum(im[..., 1], np.maximum(im[..., 0], im[..., 2]))
    return np.dstack([sem, (1 - verde) * 255]).astype("uint8")


esp = recorta(AQUI / "home-espinhos.png")
caixa = Image.fromarray(esp).getbbox()
e = Image.fromarray(esp).crop(caixa)
e = e.resize((round(e.width * 820 / e.height), 820), Image.LANCZOS)
e.save(SAI / "espinhos.webp", quality=84, method=6)
print("espinhos", e.size)

folha = recorta(AQUI / "home-emblemas.png")
# as fileiras se encostam: cada emblema tem a sua caixa, medida na folha gerada
CAIXAS = [(25, 20, 310, 272), (350, 5, 595, 272), (620, 40, 905, 255), (925, 35, 1210, 255), (1225, 25, 1515, 258),
          (10, 328, 318, 445), (338, 275, 592, 510), (625, 268, 905, 500), (945, 265, 1195, 505), (1238, 285, 1505, 502),
          (10, 492, 318, 752), (330, 520, 605, 752), (640, 505, 895, 770), (920, 520, 1215, 760), (1290, 515, 1460, 760),
          (15, 770, 298, 1000), (315, 772, 625, 985)]
inteira = Image.fromarray(folha)
for nome, caixa in zip(IDS, CAIXAS):
    pedaco = inteira.crop(caixa)
    pedaco = pedaco.crop(pedaco.getbbox())
    pedaco.thumbnail((180, 180), Image.LANCZOS)
    pedaco.save(SAI / f"emblema-{nome}.webp", quality=86, method=6)
print(sum(f.stat().st_size for f in SAI.glob("emblema-*")) // 1024, "KB nos emblemas")
