"""Teste: converte os retratos atuais em pixel art direto, sem IA, para comparar com a versão redesenhada."""
from pathlib import Path
import sys
from PIL import Image

RAIZ = Path(sys.argv[0]).resolve().parents[5]
NPC = RAIZ / "public" / "images" / "npc"
SAIDA = Path(sys.argv[0]).resolve().parent / "teste-pixelar.png"


def pixelar(caminho, largura=128, cores=32):
    im = Image.open(caminho).convert("RGBA")
    im = im.crop(im.getbbox())
    alt = round(im.height * largura / im.width)
    p = im.resize((largura, alt), Image.LANCZOS)
    alfa = p.getchannel("A").point(lambda v: 255 if v > 128 else 0)
    q = p.convert("RGB").quantize(cores, method=Image.MEDIANCUT, dither=Image.NONE).convert("RGBA")
    q.putalpha(alfa)
    return q


itens = [("melissa", "sorriso"), ("galo", "neutro"), ("coruja", "neutro"), ("herdeiro", "neutro"), ("javali", "neutro"), ("rato", "sorriso")]
folha = Image.new("RGBA", (3 * 400, 2 * 400), (58, 31, 92, 255))
for i, (n, e) in enumerate(itens):
    p = pixelar(NPC / n / f"{e}.webp")
    p = p.resize((p.width * 3, p.height * 3), Image.NEAREST)
    folha.paste(p, ((i % 3) * 400 + 8, (i // 3) * 400 + 8), p)
folha.save(SAIDA)
