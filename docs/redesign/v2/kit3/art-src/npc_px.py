"""Mensagens: passa os rostos dos sprites do jogo e as figurinhas para pixel, sem retoque além da redução.
Uso: python npc_px.py (na pasta art-src)"""
from pathlib import Path
from PIL import Image

AQUI = Path(__file__).parent
RAIZ = AQUI.parents[4]
SAI = AQUI.parent / "art" / "os" / "npc"
SAI.mkdir(parents=True, exist_ok=True)
# janela do rosto, a mesma dos medalhões do jogo (components/devo/kit/npc-anchor.tsx)
ROSTO = {"rato": (415, 380, 560), "herdeiro": (545, 330, 560), "coruja": (535, 330, 560)}
# o Rato muda de lugar a cada expressão: uma janela por expressão, centrada na cabeça (chapéu, orelhas e focinho)
POR_EXPR = {
    "rato": {"sorriso": (433, 380, 600), "malicia": (487, 401, 600), "trama": (584, 410, 600),
             "desdem": (454, 407, 600), "surpreso": (478, 398, 600)},
}
EXPR = {
    "rato": ["sorriso", "malicia", "trama", "desdem", "surpreso"],
    "herdeiro": ["neutro", "desdem", "malicia", "confiante", "entediado"],
    "coruja": ["neutro", "sorriso", "preocupado", "triste", "timido"],
}


def em_pixel(im, lado):
    im = im.resize((lado, lado), Image.LANCZOS)
    alfa = im.getchannel("A").point(lambda v: 255 if v > 110 else 0)
    cor = im.convert("RGB").quantize(colors=20, method=Image.MEDIANCUT, dither=Image.NONE).convert("RGBA")
    cor.putalpha(alfa)
    return cor


for npc, janela in ROSTO.items():
    for e in EXPR[npc]:
        cx, cy, lado = POR_EXPR.get(npc, {}).get(e, janela)
        im = Image.open(RAIZ / "public" / "images" / "npc" / npc / f"{e}.webp").convert("RGBA")
        m = lado // 2
        em_pixel(im.crop((cx - m, cy - m, cx + m, cy + m)), 64).save(SAI / f"{npc}-{e}.png", optimize=True)

for nome in ("engracada", "triste"):
    im = Image.open(RAIZ / "public" / "images" / "stickers" / f"{nome}.png").convert("RGBA")
    q = Image.new("RGBA", (max(im.size), max(im.size)), (0, 0, 0, 0))
    q.paste(im, ((q.width - im.width) // 2, (q.height - im.height) // 2))
    em_pixel(q, 64).save(SAI / f"fig-{nome}.png", optimize=True)
print("ok")
