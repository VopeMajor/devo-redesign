"""Herdeiro da apresentação do Salão: o desenho com corpo até o quadril (herdeiro-corpo/) passado para pixel, com uma paleta
só para a cor não pular entre expressões. A cabeça diminui com uma deformação suave, sem corte: o rosto e o corpo ficam iguais.
Uso: python herdeiro_px.py (na pasta art-src)"""
from pathlib import Path
import numpy as np
from PIL import Image

AQUI = Path(__file__).parent
SAI = AQUI.parent / "art" / "os" / "npc"
# tela do sprite do jogo, com mais altura para o corpo; depois vira pixel
TELA = (1080, 1650)
PX = (216, 330)
TOPO = 20  # pixels vazios cortados em cima
CABECA = 0.86  # pedido do dono: cabeça um pouco menor em relação ao corpo
# pose: escala e posição que encaixam o desenho na tela do sprite do jogo; centro e raios da cabeça; ponto que fica parado (queixo ou pescoço)
POSES = {
    "neutro": (1.0, 28, 132, (549, 334), (190, 185), (567, 510)),
    "surpreso": (1.0, 28, 132, (533, 325), (200, 190), (550, 510)),
    "desdem": (1.01, 24, 128, (490, 356), (205, 195), (560, 545)),
    "entediado": (1.01, 24, 128, (497, 386), (200, 200), (552, 577)),
    "malicia": (1.0, 28, 132, (515, 355), (195, 200), (559, 546)),
    "confiante": (1.01, 24, 128, (546, 365), (195, 210), (552, 567)),
    "sorriso": (1.01, 24, 128, (530, 315), (195, 190), (546, 490)),
    "riso": (1.01, 24, 128, (510, 320), (200, 190), (540, 510)),
    "trama": (1.01, 24, 128, (540, 350), (200, 215), (565, 559)),
}


def sem_verde(im):
    a = np.array(im.convert("RGB")).astype(float)
    verde = (a[..., 1] - np.maximum(a[..., 0], a[..., 2])) > 40
    # a beirada não herda o verde do fundo
    a[..., 1] = np.minimum(a[..., 1], np.maximum(a[..., 0], a[..., 2]) + 6)
    return Image.fromarray(np.dstack([a, (~verde) * 255.0]).astype("uint8"), "RGBA")


def cabeca_menor(t, centro, raios, fixo):
    """Encolhe a elipse da cabeça em direção ao ponto fixo; fora dela o efeito some aos poucos, até não mexer em mais nada."""
    a = np.array(t).astype(float)
    al = a[..., 3:] / 255
    pre = np.dstack([a[..., :3] * al, a[..., 3]])  # cor pré-multiplicada, para a beirada não escurecer
    yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]].astype(float)
    d = np.hypot((xx - centro[0]) / raios[0], (yy - centro[1]) / raios[1])
    u = np.clip((d - 1) / 0.45, 0, 1)
    peso = 1 - u * u * (3 - 2 * u)
    k = peso * (1 / CABECA - 1)
    sx, sy = xx + (xx - fixo[0]) * k, yy + (yy - fixo[1]) * k
    # leitura bilinear na posição de origem de cada pixel
    x0, y0 = np.clip(np.floor(sx).astype(int), 0, a.shape[1] - 2), np.clip(np.floor(sy).astype(int), 0, a.shape[0] - 2)
    fx, fy = (sx - x0)[..., None], (sy - y0)[..., None]
    sai = (pre[y0, x0] * (1 - fx) + pre[y0, x0 + 1] * fx) * (1 - fy) + (pre[y0 + 1, x0] * (1 - fx) + pre[y0 + 1, x0 + 1] * fx) * fy
    al2 = np.clip(sai[..., 3:] / 255, 1e-3, 1)
    return Image.fromarray(np.dstack([np.clip(sai[..., :3] / al2, 0, 255), sai[..., 3]]).astype("uint8"), "RGBA")


quadros = {}
for p, (esc, dx, dy, centro, raios, fixo) in POSES.items():
    g = sem_verde(Image.open(AQUI / "herdeiro-corpo" / f"c-{p}.png"))
    t = Image.new("RGBA", TELA, (0, 0, 0, 0))
    t.paste(g.resize((int(1024 * esc), int(1536 * esc)), Image.LANCZOS), (dx, dy))
    t = cabeca_menor(t, centro, raios, fixo)
    q = t.resize(PX, Image.BOX).crop((0, TOPO, PX[0], PX[1]))
    quadros[p] = (q.convert("RGB"), q.getchannel("A").point(lambda v: 255 if v > 128 else 0))
pal = quadros["neutro"][0].quantize(colors=40, method=Image.FASTOCTREE, dither=Image.NONE)
for p, (cor, alfa) in quadros.items():
    c = cor.quantize(palette=pal, dither=Image.NONE).convert("RGBA")
    c.putalpha(alfa)
    c.save(SAI / f"herdeiro-corpo-{p}.png", optimize=True)
print("ok")
