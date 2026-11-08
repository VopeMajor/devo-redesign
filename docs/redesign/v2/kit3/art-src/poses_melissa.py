"""Recorta as 12 poses, grava em meio tamanho com as chaves do jogo e monta a prancha.
Uso: python -I poses_melissa.py"""
from pathlib import Path
import sys
import numpy as np
from PIL import Image, ImageDraw

AQUI = Path(sys.argv[0]).resolve().parent
ART = AQUI.parent / "art"
NOMES = ["convite", "explica", "riso", "preocupado", "pensativo", "timido", "confiante", "surpreso", "animado", "apresenta", "triste", "sorriso"]

poses = []
for nome in NOMES:
    f = AQUI / f"melissa-pose-{nome}.png"
    if not f.exists():
        print("FALTA", nome)
        continue
    a = np.asarray(Image.open(f).convert("RGB")).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    al = np.clip(1 - ((g - np.maximum(r, b)) - 25) / 70, 0, 1)
    o = Image.fromarray(np.dstack([r, np.minimum(g, np.maximum(r, b)), b, al * 255]).astype(np.uint8), "RGBA")
    o = o.crop(o.getbbox())
    m = o.resize((o.width // 2, o.height // 2), Image.BOX)
    x = np.asarray(m).copy()
    x[..., 3] = np.where(x[..., 3] >= 128, 255, 0)
    m = Image.fromarray(x, "RGBA")
    m.save(ART / f"melissa-p-{nome}.png")
    poses.append((nome, m))
    print(nome, m.size)

cols = 6
cw = max(p.width for _, p in poses) // 2 + 16
ch = max(p.height for _, p in poses) // 2 + 34
linhas = (len(poses) + cols - 1) // cols
s = Image.new("RGB", (cols * cw, linhas * ch), (28, 22, 38))
d = ImageDraw.Draw(s)
for i, (nome, p) in enumerate(poses):
    t = p.resize((p.width // 2, p.height // 2), Image.BOX)
    x, y = (i % cols) * cw, (i // cols) * ch
    s.paste(t, (x + (cw - t.width) // 2, y + ch - t.height - 6), t)
    d.text((x + 6, y + 4), f"{i + 1} {nome}", fill=(230, 225, 235))
s.save(AQUI.parent / "melissa-12-poses-corpo.png")
print(s.size)
