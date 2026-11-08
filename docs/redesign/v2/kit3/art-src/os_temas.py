"""Sistema de janelas: recorta os ícones em pixel (32x32) e faz o fundo em cada esquema de cores, só com as cores dele.
Uso: python os_temas.py (na pasta art-src)"""
from pathlib import Path
import numpy as np
from PIL import Image

AQUI = Path(__file__).parent
SAI = AQUI.parent / "art" / "os" / "px"

# tinta escura, meio-tom, destaque, claro; e os dois tons do fundo além da cor de base
TEMAS = {
    "sangue": dict(tinta=(10, 8, 10), meio=(150, 70, 80), destaque=(200, 32, 47), claro=(239, 230, 216), f1=(30, 14, 18), f2=(58, 20, 28)),
    "ouro": dict(tinta=(11, 10, 8), meio=(130, 118, 90), destaque=(201, 162, 74), claro=(240, 232, 212), f1=(28, 25, 18), f2=(52, 46, 32)),
    "aco": dict(tinta=(10, 18, 22), meio=(120, 150, 160), destaque=(95, 224, 208), claro=(230, 238, 240), f1=(20, 32, 38), f2=(36, 52, 60)),
    "rosa": dict(tinta=(26, 16, 20), meio=(180, 120, 145), destaque=(255, 150, 190), claro=(251, 239, 243), f1=(44, 26, 34), f2=(74, 44, 58)),
    "papel": dict(tinta=(16, 14, 14), meio=(110, 104, 96), destaque=(16, 14, 14), claro=(250, 246, 236), f1=(214, 207, 192), f2=(188, 180, 164), base=(232, 226, 212)),
}
BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16


IDS = "record pulso mensagens cartas inventario trocas calendario casa torres poco salao jogos corporacoes virtudes arcanos ajustes mesa sigilo sino cadeado".split()
# cada ícone vira uma grade de 32x32 por voto da maioria: 0 vazio, 1 preto, 2 cinza, 3 branco, 4 acento
folha = np.array(Image.open(AQUI / "os-icones.png").convert("RGB")).astype(int)
r, g, b = folha[..., 0], folha[..., 1], folha[..., 2]
classe = np.full(r.shape, 1)
classe[(r + g + b) / 3 > 90] = 2
classe[(r + g + b) / 3 > 190] = 3
classe[(r > 150) & (b > 150) & (g < 110)] = 4
classe[(g > 150) & (r < 120) & (b < 120)] = 0
LARG, ALT = folha.shape[1] / 5, folha.shape[0] / 4
ICONES = {}
for n, nome in enumerate(IDS):
    c0, l0 = int((n % 5) * LARG), int((n // 5) * ALT)
    cel = classe[l0:int(l0 + ALT), c0:int(c0 + LARG)]
    ys, xs = np.where(cel > 0)
    cel = cel[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    h, w = cel.shape
    passo = max(h, w) / 32
    th, tw = max(1, round(h / passo)), max(1, round(w / passo))
    grade = np.zeros((32, 32), dtype=int)
    oy, ox = (32 - th) // 2, (32 - tw) // 2
    for y in range(th):
        for x in range(tw):
            bloco = cel[int(y * h / th):max(int(y * h / th) + 1, int((y + 1) * h / th)), int(x * w / tw):max(int(x * w / tw) + 1, int((x + 1) * w / tw))]
            grade[oy + y, ox + x] = np.bincount(bloco.ravel(), minlength=5).argmax()
    ICONES[nome] = grade


# o sigilo não vem da folha gerada, que desenhou algo parecido com o símbolo de risco biológico: é o nó do sigilo do jogo
sig = np.array(Image.open(AQUI.parents[4] / "public" / "images" / "devo-sigil.png").convert("RGB")).astype(float)[352:672, 352:672]
lum = sig.mean(axis=2)
yy, xx = np.mgrid[0:320, 0:320]
corpo = (lum > 95) & (np.hypot(yy - 155, xx - 158) < 150)
blocos = corpo.reshape(32, 10, 32, 10).mean(axis=(1, 3)) > .42
borda = np.zeros_like(blocos)
for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
    borda |= np.roll(np.roll(blocos, dy, axis=0), dx, axis=1)
ICONES["sigilo"] = np.where(blocos, 3, np.where(borda, 1, 0))


# portas da Sala de Trocas: três colunas, em grade de 48x64 (exibida em dobro)
pf = np.array(Image.open(AQUI / "os-portas.png").convert("RGB")).astype(int)
r, g, b = pf[..., 0], pf[..., 1], pf[..., 2]
cp = np.full(r.shape, 1)
cp[(r + g + b) / 3 > 90] = 2
cp[(r + g + b) / 3 > 190] = 3
cp[(r > 150) & (b > 150) & (g < 110)] = 4
cp[(g > 150) & (r < 120) & (b < 120)] = 0
PORTAS = {}
for n, nome in enumerate(("porta-livre", "porta-ocupada", "porta-sua")):
    cel = cp[:, int(n * pf.shape[1] / 3):int((n + 1) * pf.shape[1] / 3)]
    ys, xs = np.where(cel > 0)
    cel = cel[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    h, w = cel.shape
    th = 64
    tw = min(48, max(1, round(w * th / h)))
    grade = np.zeros((64, 48), dtype=int)
    ox = (48 - tw) // 2
    for y in range(th):
        for x in range(tw):
            bloco = cel[int(y * h / th):max(int(y * h / th) + 1, int((y + 1) * h / th)), int(x * w / tw):max(int(x * w / tw) + 1, int((x + 1) * w / tw))]
            grade[y, ox + x] = np.bincount(bloco.ravel(), minlength=5).argmax()
    PORTAS[nome] = grade


def icone(grade, t):
    cores = np.array([(0, 0, 0), t["tinta"], t["meio"], t["claro"], t["destaque"]], dtype="uint8")
    return Image.fromarray(np.dstack([cores[grade], (grade > 0) * 255]).astype("uint8"))


fundo = Image.open(AQUI / "home-fundo.png").convert("L").resize((260, 390), Image.LANCZOS)
luz = (np.array(fundo).astype(float) / 255) ** 1.7  # bem apagado: quem aparece são os ícones
for nome, t in TEMAS.items():
    pasta = SAI / nome
    pasta.mkdir(parents=True, exist_ok=True)
    for ic_nome, grade in {**ICONES, **PORTAS}.items():
        icone(grade, t).save(pasta / f"{ic_nome}.png", optimize=True)
    # fundo pontilhado em três tons, bem discreto para os ícones aparecerem
    base = np.array(t.get("base", t["tinta"]), dtype=float)
    h, w = luz.shape
    limiar = np.tile(BAYER, (h // 4 + 1, w // 4 + 1))[:h, :w]
    nivel = np.floor(luz * 2 + limiar).clip(0, 2).astype(int)
    tons = np.stack([base, np.array(t["f1"], float), np.array(t["f2"], float)])
    Image.fromarray(tons[nivel].astype("uint8")).save(pasta / "fundo.png", optimize=True)
    print(nome, "ok")
