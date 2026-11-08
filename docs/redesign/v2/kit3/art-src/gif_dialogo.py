"""GIF curto do movimento da cena de diálogo (pose, boca, piscar), para ver sem abrir a página.
Uso: python -I gif_dialogo.py"""
from pathlib import Path
import json
import sys
from PIL import Image, ImageEnhance

AQUI = Path(sys.argv[0]).resolve().parent
ART = AQUI.parent / "art"
meta = json.loads((ART / "anim.json").read_text(encoding="utf-8"))
W, H, ALT = 360, 480, 440
fundo = Image.open(ART / "quarto.webp").convert("RGB")
e = max(W / fundo.width, H / fundo.height)
fundo = fundo.resize((round(fundo.width * e), round(fundo.height * e)), Image.BOX)
x0 = (fundo.width - W) // 2
fundo = ImageEnhance.Brightness(fundo.crop((x0, 0, x0 + W, H))).enhance(0.55)


def quadro(pose, pisca=False, boca=False, dy=0):
    m = meta[pose]
    fig = Image.open(ART / f"melissa-q-{pose}.png").convert("RGBA")
    for ativo, suf in ((pisca, "pisca"), (boca, "boca")):
        if ativo and m[suf]:
            c = Image.open(ART / "anim" / f"{pose}-{suf}.png")
            fig.paste(c, (0, 0), c)
    k = ALT / fig.height
    fig = fig.resize((round(fig.width * k), ALT), Image.BOX)
    q = fundo.copy()
    q.paste(fig, (W // 2 - round(m["cabeca_x"] * k), H - ALT + dy), fig)
    return q.convert("P", palette=Image.ADAPTIVE, colors=128)


quadros, tempos = [], []
for pose in ("convite", "explica", "preocupado", "riso"):
    for i, dy in enumerate((6, -4, 0)):
        quadros.append(quadro(pose, dy=dy))
        tempos.append(60)
    for i in range(10):
        quadros.append(quadro(pose, boca=i % 2 == 0))
        tempos.append(110)
    quadros.append(quadro(pose))
    tempos.append(500)
    quadros.append(quadro(pose, pisca=True))
    tempos.append(110)
    quadros.append(quadro(pose))
    tempos.append(500)
quadros[0].save(AQUI.parent / "melissa-dialogo-movimento.gif", save_all=True, append_images=quadros[1:], duration=tempos, loop=0, optimize=True)
print(len(quadros), (AQUI.parent / "melissa-dialogo-movimento.gif").stat().st_size)
