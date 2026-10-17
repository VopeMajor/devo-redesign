"""Prancha-resumo de uma categoria a partir das pastas públicas exportadas.

Uso:
  python3 arte/ferramentas/resumo.py "<título>" <saida.png> <pasta>/<peca> [...]

Cada item é public/images/cosmeticos/<id>/<peca> (lê <peca>.json e <peca>-<lado>.webp).
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


def maior(p: Path, peca: str) -> Image.Image:
    arqs = [f for f in p.glob(f"{peca}-*.webp") if f.stem.rsplit("-", 1)[-1].isdigit() and f.stem.rsplit("-", 1)[0] == peca]
    return Image.open(max(arqs, key=lambda f: int(f.stem.rsplit("-", 1)[-1]))).convert("RGBA")


def main() -> int:
    titulo, destino = sys.argv[1], Path(sys.argv[2])
    itens = []
    for arg in sys.argv[3:]:
        p, peca = Path(arg).parent, Path(arg).name
        meta = json.loads((p / f"{peca}.json").read_text())
        img_meta, org = meta["imagem"], meta.get("origem", {})
        im = maior(p, peca)
        tipo = "balao" if img_meta.get("slice") else ("moldura" if img_meta.get("janela") else
                                                      ("ilustracao" if "torres" in str(p) else "emblema"))
        av = None
        if img_meta.get("janela"):
            S = im.width
            j = img_meta["janela"]
            jj = {"forma": j["forma"], "centro_px": [j["centro"][0] * S, j["centro"][1] * S]}
            if j["forma"] == "quadrado":
                jj.update({"lado_px": j["lado"] * S, "raio_canto_px": j["raio_canto"] * S})
            else:
                jj["raio_px"] = [j["raio"][0] * S, j["raio"][1] * S]
            av = avatar_ficticio(S, {"janela": jj})
        m = {"tipo": tipo, "origem": org, "camadas": img_meta.get("camadas", [])}
        itens.append((f"{p.name}/{peca}", m, im, av))
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
            cams = [f'{Path(c.get("src", "")).stem.split("-", 1)[-1]} ({c["anim"]})' for c in m.get("camadas", [])]
            if cams:
                d.text((x + 170, yb + 10), "camadas:\n" + "\n".join(cams[:5]), fill=(190, 180, 210), font=fonte(11))
    destino.parent.mkdir(parents=True, exist_ok=True)
    tela.convert("RGB").save(destino, "PNG", optimize=True)
    print(destino, tela.size)
    return 0


if __name__ == "__main__":
    sys.exit(main())
