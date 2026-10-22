"""Exporta figura + retrato dos Arcanos com escala e base iguais (pés na mesma altura).

Uso: python3 arte/ferramentas/arcanos.py <pasta arte-saida/arcano-<key>> <vNN> <key> [--cabeca-embaixo]
     --cabeca-embaixo: figura de ponta-cabeça (Enforcado) — o retrato pega a cabeça no pé da figura.

Contrato (lib/devo/arcanos-arte.ts): public/images/arcanos/<key>/{figura,retrato}-<lado>.webp, <lado> = maior lado.
  figura   1024×1536, figura com 1400 px de altura, pés em y=1500, centrada (ou limitada pela largura).
  retrato  768×1024, busto recortado da figura (cabeça centrada, topo com folga).
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from processar import redimensionar  # noqa: E402

ALTURA, PES, W, H = 1400, 1500, 1024, 1536


def main() -> int:
    saida, var, key = Path(sys.argv[1]), sys.argv[2], sys.argv[3]
    embaixo = "--cabeca-embaixo" in sys.argv[4:]
    pid = json.loads((saida / "manifest.json").read_text())["pedido"]
    png = max(saida.glob(f"final/{pid}--{var}--*.png"), key=lambda p: int(p.stem.split("--")[-1]))
    im = Image.open(png).convert("RGBA")
    a = np.asarray(im)[..., 3]
    ys, xs = np.nonzero(a > 24)
    obj = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    k = min(ALTURA / obj.height, (W - 40) / obj.width)
    obj = redimensionar(obj, (round(obj.width * k), round(obj.height * k)))
    fig = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    x0, y0 = (W - obj.width) // 2, PES - obj.height
    fig.alpha_composite(obj, (x0, y0))
    dest = Path("public/images/arcanos") / key
    dest.mkdir(parents=True, exist_ok=True)
    for t in (1536, 1024, 768):
        q = t / H
        redimensionar(fig, (round(W * q), t)).save(dest / f"figura-{t}.webp", "WEBP", quality=90, alpha_quality=100, method=6)
    # retrato: busto = 44% de cima da figura, cabeça centrada pelo centróide do alfa no topo
    fa = np.asarray(fig)[..., 3].astype(np.float32)
    topo = y0
    bh = int(obj.height * 0.44)
    bw = int(bh * 3 / 4)
    if embaixo:
        faixa = fa[PES - int(obj.height * 0.14):PES]
        by = PES + int(bh * 0.06) - bh
    else:
        faixa = fa[topo:topo + int(obj.height * 0.14)]
        by = topo - int(bh * 0.06)
    cx = float((faixa.sum(0) * np.arange(W)).sum() / max(faixa.sum(), 1))
    bx = int(round(cx - bw / 2))
    caixa = (bx, by, bx + bw, by + bh)
    ret = Image.new("RGBA", (bw, bh), (0, 0, 0, 0))
    ret.alpha_composite(fig.crop((max(0, bx), max(0, by), min(W, bx + bw), min(H, by + bh))), (max(0, -bx), max(0, -by)))
    ret = redimensionar(ret, (768, 1024))
    arr = np.asarray(ret, dtype=np.float32).copy()  # busto some suave embaixo (sem corte reto)
    rampa = np.clip(((np.arange(1024)) if embaixo else (1024 - np.arange(1024))) / 180.0, 0, 1)[:, None]
    arr[..., 3] *= rampa
    ret = Image.fromarray(arr.round().astype(np.uint8), "RGBA")
    for t in (1024, 512, 256):
        q = t / 1024
        redimensionar(ret, (round(768 * q), t)).save(dest / f"retrato-{t}.webp", "WEBP", quality=90, alpha_quality=100, method=6)
    meta = {"key": key, "figura": {"tamanhos": [768, 1024, 1536], "tamanho": [W, H], "pes_y": round(PES / H, 4),
                                   "altura_figura": round(obj.height / H, 4)},
            "retrato": {"tamanhos": [256, 512, 1024], "tamanho": [768, 1024], "recorte_da_figura": [round(v / W if i % 2 == 0 else v / H, 4) for i, v in enumerate(caixa)]},
            "sigilo": {"tamanhos": [64, 128, 256]},
            "origem": {"pedido": pid, "variacao": var, "png": png.name}}
    sj = dest / "sigilo.json"
    if sj.exists():
        meta["sigilo"]["origem"] = json.loads(sj.read_text()).get("origem")
    (dest / "arte.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{key}: figura {obj.width}x{obj.height}, retrato de {caixa}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
