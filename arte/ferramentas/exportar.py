"""Exporta a variação escolhida para a pasta pública, no formato que o Cosméticos lê.

Uso:
  python3 arte/ferramentas/exportar.py <pasta arte-saida/<pedido>> <vNN> <public/images/cosmeticos/<id>> <peca>
      [--tamanhos 1024,512,256,96,48] [--camada nome:h0:h1:sat_min:val_min:anim[:dur]] ...
      [--peca-camada arquivo.png:anim:x:y:w:h[:ox:oy[:dur]]] ...

Contrato (lib/devo/cosmeticos.ts › ArteImagem, asset = 'img:/images/cosmeticos/<id>/<peca>'):
  <id>/<peca>-<lado>.webp           tamanhos (lado maior; nos balões, a largura)
  <id>/<peca>-<camada>.webp         camadas animadas, recortadas na caixa delas
  <id>/<peca>.json                  o `meta.imagem` pronto (base, tamanhos, janela, camadas, slice) + origem
Balão: também <peca>-corpo-<lado>.webp e <peca>-ponta-esq|dir-<lado>.webp (kit) e `slice` no json.
--camada recorta por faixa de cor do próprio final (alinhada 1:1) e grava a caixa em fração.
--peca-camada acrescenta uma peça avulsa já recortada (ponteiro, engrenagem…) na caixa x,y,w,h (frações).
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

sys.path.insert(0, str(Path(__file__).parent))
from processar import camada_por_cor, redimensionar  # noqa: E402

DUR = {"brilho": 5.5, "giro": 24, "giro-rev": 30, "ponteiro": 60, "oscila": 2.4, "pulso": 3.2, "flutua": 6, "petalas": 9}


def salvar_webp(img: Image.Image, destino: Path, lado: int) -> None:
    k = lado / max(img.size)
    out = img if k == 1 else redimensionar(img, (max(1, round(img.width * k)), max(1, round(img.height * k))))
    if lado <= 96:
        out = out.filter(ImageFilter.UnsharpMask(radius=0.6, percent=60, threshold=1))
    out.save(destino, "WEBP", quality=90 if lado >= 256 else 92, alpha_quality=100, method=6)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("saida")
    ap.add_argument("var")
    ap.add_argument("destino")
    ap.add_argument("peca")
    ap.add_argument("--tamanhos", default="1024,512,256,96,48")
    ap.add_argument("--camada", action="append", default=[])
    ap.add_argument("--peca-camada", action="append", default=[])
    a = ap.parse_args()
    saida, dest, peca = Path(a.saida), Path(a.destino), a.peca
    man = json.loads((saida / "manifest.json").read_text())
    pid = man["pedido"]
    reg = next(v for v in man["variacoes"] if v["nome"] == a.var)
    final_dir = saida / "final"
    dest.mkdir(parents=True, exist_ok=True)
    for velho in dest.glob(f"{peca}-*.webp"):
        velho.unlink()
    orig = max(final_dir.glob(f"{pid}--{a.var}--*.png"), key=lambda p: int(p.stem.split("--")[-1]))
    im = Image.open(orig).convert("RGBA")
    lado = max(im.size)
    tams = sorted({int(t) for t in a.tamanhos.split(",") if int(t) <= lado + 4})  # arredondamento do recorte (ex.: 1023)
    for t in tams:
        salvar_webp(im, dest / f"{peca}-{t}.webp", t)
    base = "/" + str(dest).split("public/", 1)[1] + f"/{peca}"
    imagem: dict = {"base": base, "tamanhos": tams}

    if reg.get("janela"):
        j = reg["janela"]
        W = im.width
        c = [round(j["centro_px"][0] / W, 4), round(j["centro_px"][1] / W, 4)]
        if j["forma"] == "quadrado":
            meio = round(j["lado_px"] / 2 / W, 4)
            imagem["janela"] = {"forma": "quadrado", "centro": c, "raio": [meio, meio],
                                "lado": round(j["lado_px"] / W, 4), "raio_canto": round(j["raio_canto_px"] / W, 4)}
        else:
            imagem["janela"] = {"forma": j["forma"], "centro": c,
                                "raio": [round(j["raio_px"][0] / W, 4), round(j["raio_px"][1] / W, 4)]}

    camadas = []
    for spec in a.camada:
        partes = spec.split(":")
        nome, h0, h1, smin, vmin, anim = partes[:6]
        dur = float(partes[6]) if len(partes) > 6 else DUR.get(anim, 5)
        cam = camada_por_cor(im, {"matiz": [float(h0), float(h1)], "sat_min": float(smin), "val_min": float(vmin)})
        al = np.asarray(cam)[..., 3]
        ys, xs = np.nonzero(al > 16)
        if not len(xs):
            print(f"AVISO: camada {nome} vazia")
            continue
        m = 6
        cx0, cy0 = max(0, xs.min() - m), max(0, ys.min() - m)
        cx1, cy1 = min(im.width, xs.max() + 1 + m), min(im.height, ys.max() + 1 + m)
        cam.crop((cx0, cy0, cx1, cy1)).save(dest / f"{peca}-{nome}.webp", "WEBP", quality=92, alpha_quality=100, method=6)
        camadas.append({"src": f"{base}-{nome}.webp", "anim": anim,
                        "caixa": [round(cx0 / im.width, 4), round(cy0 / im.height, 4),
                                  round((cx1 - cx0) / im.width, 4), round((cy1 - cy0) / im.height, 4)], "dur": dur})
    for spec in a.peca_camada:
        partes = spec.split(":")
        arq, anim = partes[0], partes[1]
        x, y, w, h = (float(v) for v in partes[2:6])
        pc = Image.open(arq).convert("RGBA")
        nome = Path(arq).stem.split("--")[0].replace("camada-", "")
        alvo_px = max(64, round(max(w * im.width, h * im.height) * 1.0))
        salvar_webp(pc, dest / f"{peca}-{nome}.webp", min(max(pc.size), max(128, alvo_px)))
        c = {"src": f"{base}-{nome}.webp", "anim": anim, "caixa": [x, y, w, h], "dur": DUR.get(anim, 5)}
        if len(partes) >= 8:
            c["origem"] = [float(partes[6]), float(partes[7])]
        if len(partes) >= 9:
            c["dur"] = float(partes[8])
        camadas.append(c)
    if camadas:
        imagem["camadas"] = camadas

    if reg.get("balao"):
        b = reg["balao"]
        W0 = b["tamanho_px"][0]
        lado_s = 512 if 512 in tams else tams[-1]
        k = lado_s / W0
        nf = b["nove_fatias"]
        corte = [round(nf["top"] * k), round(nf["right"] * k), round(nf["bottom"] * k), round(nf["left"] * k)]
        borda = [max(8, round(v * 0.55)) for v in corte]  # balão de ~280–360 px CSS de largura
        centro = np.asarray(im)[nf["top"]:im.height - nf["bottom"], nf["left"]:im.width - nf["right"], :3]
        lum = float(np.median(centro @ np.array([0.299, 0.587, 0.114]))) if centro.size else 40
        imagem["slice"] = {"corte": corte, "borda": borda,
                           "folga": [max(4, borda[0] // 3), max(6, borda[1] // 4), max(4, borda[2] // 3), max(6, borda[3] // 4)],
                           "texto": "#2a2320" if lum > 140 else "#f1e7e9", "lado": lado_s}
        for f in final_dir.glob(f"{pid}--{a.var}--kit-*.webp"):
            _, _, kit, t = f.stem.split("--")
            (dest / f"{peca}-{kit.replace('kit-', '')}-{t}.webp").write_bytes(f.read_bytes())
        imagem["kit"] = {"corpo": b["kit"]["corpo"], "pontas": {"esq": b["kit"]["ponta_esq"], "dir": b["kit"]["ponta_dir"]},
                         "texto": b["kit"]["texto"], "tamanho_px": b["tamanho_px"],
                         "arquivos": f"{base}-corpo|ponta-esq|ponta-dir-<largura>.webp"}

    meta = {"asset": f"img:{base}", "imagem": imagem,
            "origem": {"pedido": pid, "variacao": a.var, "modelo": reg["modelo"], "seed": reg["seed"],
                       "importado": man.get("importado")}}
    (dest / f"{peca}.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    total = sum(f.stat().st_size for f in dest.glob(f"{peca}-*.webp"))
    print(f"{dest}/{peca}: {len(list(dest.glob(f'{peca}-*.webp')))} arquivos, {total / 1024:.0f} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
