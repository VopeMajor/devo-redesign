"""Prancha-resumo de uma categoria a partir das pastas públicas exportadas.

Uso:
  python3 arte/ferramentas/resumo.py "<título>" <saida.png> <pasta1> [<pasta2> ...]

Cada pasta é public/images/cosmeticos/<id>/ ou public/images/torres/<id>/ (com manifest.json e <tam>.webp).
Molduras ganham o avatar de teste na janela; balões aparecem largos; mostra também 96 px e 48 px.
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).parent))
from processar import ESCURO, avatar_ficticio, fonte, ladrilho  # noqa: E402


def maior(p: Path) -> Image.Image:
    arqs = sorted((f for f in p.glob("*.webp") if f.stem.isdigit()), key=lambda f: -int(f.stem))
    return Image.open(arqs[0]).convert("RGBA")


def main() -> int:
    titulo, destino, pastas = sys.argv[1], Path(sys.argv[2]), [Path(x) for x in sys.argv[3:]]
    itens = []
    for p in pastas:
        m = json.loads((p / "manifest.json").read_text())
        im = maior(p)
        av = None
        if m.get("janela"):
            S = im.width
            j = dict(m["janela"])
            k = S / m["tamanho_original"][0]
            j["centro_px"] = [c * k for c in j["centro_px"]]
            if j["forma"] == "quadrado":
                j["lado_px"] *= k
                j["raio_canto_px"] *= k
            else:
                j["raio_px"] = [r * k for r in j["raio_px"]]
            av = avatar_ficticio(S, {"janela": j})
        itens.append((p.name, m, im, av))
    balao = all(m["tipo"] == "balao" for _, m, _, _ in itens)
    larg, alt = (560, 200) if balao else (300, 300)
    torre = all(m["tipo"] == "ilustracao" for _, m, _, _ in itens)
    if torre:
        larg, alt = 260, 390
    cols = 2 if balao else 4
    pad, cab = 18, 70
    linhas = math.ceil(len(itens) / cols)
    cel_h = 24 + alt + 8 + 100
    W = pad + cols * (larg + pad)
    H = cab + linhas * (cel_h + pad)
    tela = Image.new("RGBA", (W, H), (34, 32, 40, 255))
    d = ImageDraw.Draw(tela)
    d.text((pad, 16), titulo, fill=(240, 236, 228), font=fonte(24))
    d.text((pad, 46), "versão escolhida de cada item · fundo escuro do app · embaixo: 96 px e 48 px",
           fill=(170, 165, 180), font=fonte(13))
    for i, (nome, m, im, av) in enumerate(itens):
        x = pad + (i % cols) * (larg + pad)
        y = cab + (i // cols) * (cel_h + pad)
        org = m.get("origem", {})
        rot = f"{nome}  ·  {org.get('variacao', '')} {('importado' if org.get('importado') else org.get('modelo', '').split('/')[-1])}"
        d.text((x, y), rot, fill=(225, 221, 214), font=fonte(12))
        tela.alpha_composite(ladrilho(im, ESCURO, larg, alt, av), (x, y + 22))
        yb = y + 22 + alt + 8
        d.rectangle((x, yb, x + larg, yb + 100), fill=ESCURO)
        if balao:
            tela.alpha_composite(ladrilho(im, ESCURO, 280, 96), (x + 2, yb + 2))
        else:
            tela.alpha_composite(ladrilho(im, ESCURO, 96, 96, av), (x + 2, yb + 2))
            tela.alpha_composite(ladrilho(im, ESCURO, 48, 48, av), (x + 110, yb + 26))
            cams = [c["nome"] for c in m.get("camadas", [])] + [c.get("nome", "") for c in m.get("montagem", {}).get("camadas", [])]
            if cams:
                d.text((x + 170, yb + 10), "camadas:\n" + "\n".join(cams[:5]), fill=(190, 180, 210), font=fonte(11))
    destino.parent.mkdir(parents=True, exist_ok=True)
    tela.convert("RGB").save(destino, "PNG", optimize=True)
    print(destino, tela.size)
    return 0


if __name__ == "__main__":
    sys.exit(main())
