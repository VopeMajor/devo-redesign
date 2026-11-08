"""Gera as folhas-molde: o busto-base em magenta chapado, 6 vezes, para as peças serem pintadas por cima.
Uso: python -I avatar_molde.py"""
from pathlib import Path
import sys
import numpy as np
from PIL import Image

AQUI = Path(sys.argv[0]).resolve().parent
LADO = 512

for origem, destino in (("avatar-base.png", "avatar-molde.png"), ("avatar-base-m.png", "avatar-molde-m.png")):
    a = np.asarray(Image.open(AQUI / origem).convert("RGB")).astype(int)
    base = (a[..., 1] - np.maximum(a[..., 0], a[..., 2])) < 60
    m = Image.fromarray((base * 255).astype(np.uint8)).resize((LADO, LADO), Image.BOX)
    mb = np.asarray(m) >= 128
    cel = np.zeros((LADO, LADO, 3), np.uint8)
    cel[...] = (0, 255, 0)
    cel[mb] = (255, 0, 255)
    folha = Image.new("RGB", (LADO * 3, LADO * 2))
    for j in range(2):
        for i in range(3):
            folha.paste(Image.fromarray(cel), (i * LADO, j * LADO))
    folha.save(AQUI / destino)
    print(destino, folha.size)
