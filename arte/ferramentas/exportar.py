"""Exporta a variação escolhida de um pedido para a pasta pública do DEVO.

Uso:
  python3 arte/ferramentas/exportar.py <pasta arte-saida/<id>> <vNN> <destino> [--tamanhos 1024,512,256,96,48]
      [--camada nome:h0:h1:sat_min:val_min:animacao ...] [--montagem arquivo.json]

Copia só WebP com nomes estáveis (<tam>.webp, <camada>-<tam>.webp, kit-*-<tam>.webp) e grava manifest.json
com janela (moldura), 9-slice/kit (balão), camadas e a origem (pedido, modelo, seed).
--camada recorta do final uma camada por faixa de cor (mesmo quadro, alinhada) para o CSS animar.
--montagem junta ao manifest as camadas avulsas (engrenagem, ponteiros…) com posição e pivô.
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from processar import camada_por_cor, redimensionar  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("saida")
    ap.add_argument("var")
    ap.add_argument("destino")
    ap.add_argument("--tamanhos", default="1024,512,256,96,48")
    ap.add_argument("--camada", action="append", default=[])
    ap.add_argument("--montagem")
    a = ap.parse_args()
    saida, dest = Path(a.saida), Path(a.destino)
    man = json.loads((saida / "manifest.json").read_text())
    pid = man["pedido"]
    reg = next(v for v in man["variacoes"] if v["nome"] == a.var)
    tams = [int(t) for t in a.tamanhos.split(",")]
    final_dir = saida / "final"
    if dest.exists():
        shutil.rmtree(dest)
    dest.mkdir(parents=True)
    arquivos = []
    orig = max(final_dir.glob(f"{pid}--{a.var}--*.png"), key=lambda p: int(p.stem.split("--")[-1]))
    im = Image.open(orig).convert("RGBA")
    lado = max(im.size)

    def gravar(img: Image.Image, prefixo: str, t: int) -> None:
        k = t / max(img.size)
        out = img if t == max(img.size) else redimensionar(img, (max(1, round(img.width * k)), max(1, round(img.height * k))))
        if t <= 96:
            from PIL import ImageFilter
            out = out.filter(ImageFilter.UnsharpMask(radius=0.6, percent=60, threshold=1))
        n = f"{prefixo}{t}.webp"
        out.save(dest / n, "WEBP", quality=90 if t >= 256 else 92, alpha_quality=100, method=6)
        arquivos.append(n)

    for t in tams:
        if t <= lado:
            gravar(im, "", t)
    camadas = []
    for spec in a.camada:
        nome, h0, h1, smin, vmin, anim = spec.split(":")
        cam = camada_por_cor(im, {"matiz": [float(h0), float(h1)], "sat_min": float(smin), "val_min": float(vmin)})
        for t in tams:
            if t <= lado:
                gravar(cam, f"{nome}-", t)
        camadas.append({"nome": nome, "arquivos": f"{nome}-<tam>.webp", "animacao": anim, "quadro": "mesmo do asset (sobrepor 1:1)"})
    if reg.get("balao"):
        for f in final_dir.glob(f"{pid}--{a.var}--kit-*.webp"):
            partes = f.stem.split("--")  # pid, var, kit-x, tam
            n = f"{partes[2]}-{partes[3]}.webp"
            shutil.copy(f, dest / n)
            arquivos.append(n)
    m = {
        "id": dest.name,
        "tipo": man["tipo"],
        "origem": {"pedido": pid, "variacao": a.var, "modelo": reg["modelo"], "seed": reg["seed"],
                   "importado": man.get("importado")},
        "tamanho_original": list(im.size),
        "arquivos": sorted(arquivos, key=lambda s: (s.rsplit("-", 1)[0] if "-" in s else "", -int(s.rsplit("-", 1)[-1].split(".")[0]))),
    }
    if reg.get("janela"):
        m["janela"] = reg["janela"]
        m["janela"]["avatar_sob_moldura"] = "avatar centrado na janela, 4% maior, por baixo do asset"
    if reg.get("balao"):
        m["balao"] = reg["balao"]
        m["balao"].pop("arquivos_kit", None)
        m["balao"]["obs_tamanhos"] = "kit-*-<tam>.webp: <tam> é a largura do balão inteiro; medidas escalam por <tam>/tamanho_px[0]"
    if camadas:
        m["camadas"] = camadas
    if a.montagem:
        m["montagem"] = json.loads(Path(a.montagem).read_text())
    (dest / "manifest.json").write_text(json.dumps(m, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    total = sum((dest / f).stat().st_size for f in arquivos)
    print(f"{dest}: {len(arquivos)} arquivos, {total / 1024:.0f} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
