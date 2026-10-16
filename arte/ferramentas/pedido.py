"""Leitura e validação dos pedidos de arte (arte/pedidos/*.json).

Só usa a biblioteca padrão: roda no runner antes de qualquer instalação e localmente.
Uso: python3 arte/ferramentas/pedido.py arte/pedidos/*.json
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

# Modelos de imagem do Workers AI que o pipeline sabe chamar.
# formato: "multipart" (FLUX.2) ou "json"; refs: aceita imagens de referência (input_image_N)
MODELOS = {
    "@cf/black-forest-labs/flux-2-dev": {"formato": "multipart", "refs": 4, "passos": (1, 50), "max_lado": 2048},
    "@cf/black-forest-labs/flux-2-klein-9b": {"formato": "multipart", "refs": 4, "passos": None, "max_lado": 2048},
    "@cf/black-forest-labs/flux-2-klein-4b": {"formato": "multipart", "refs": 4, "passos": None, "max_lado": 2048},
    "@cf/black-forest-labs/flux-1-schnell": {"formato": "json", "refs": 0, "passos": (1, 8), "max_lado": 1024},
    "@cf/leonardo/lucid-origin": {"formato": "json", "refs": 0, "passos": (1, 40), "max_lado": 2500},
    "@cf/leonardo/phoenix-1.0": {"formato": "json", "refs": 0, "passos": (1, 50), "max_lado": 2048},
    "@cf/stabilityai/stable-diffusion-xl-base-1.0": {"formato": "json", "refs": 1, "passos": (1, 20), "max_lado": 2048},
}

# Estimativa de custo em neurônios (tabela pública de preços do Workers AI, out/2026).
# Usada só para o log e para avisar antes de gastar; a cobrança real é a da Cloudflare.
def estimar_neuronios(modelo: str, largura: int, altura: int, passos: int | None, n_refs: int = 0) -> float:
    tiles = max(1, -(-largura // 512)) * max(1, -(-altura // 512))
    mp = (largura * altura) / (1024 * 1024)
    p = passos or 0
    if modelo.endswith("flux-1-schnell"):
        return 4.8 * tiles + 9.6 * (p or 4)
    if modelo.endswith("flux-2-dev"):
        return (37.5 * tiles + 18.75 * n_refs) * (p or 25)
    if modelo.endswith("flux-2-klein-4b"):
        return 26.05 * tiles + 5.37 * n_refs
    if modelo.endswith("flux-2-klein-9b"):
        return 1363.64 + 181.82 * max(0.0, mp - 1) + 181.82 * n_refs * 0.25
    if modelo.endswith("lucid-origin"):
        return 636 * tiles + 12 * (p or 30)
    if modelo.endswith("phoenix-1.0"):
        return 530 * tiles + 10 * (p or 30)
    return 0.0


TIPOS = {"moldura", "emblema", "ilustracao", "balao", "camada"}
ID_RE = re.compile(r"^[a-z0-9][a-z0-9-]{2,60}$")


RAIZ = Path(__file__).resolve().parents[2]


class PedidoInvalido(ValueError):
    pass


def carregar(caminho: str | Path) -> dict:
    caminho = Path(caminho)
    try:
        p = json.loads(caminho.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        raise PedidoInvalido(f"{caminho}: JSON inválido ({e})") from e
    return normalizar(p, caminho)


def normalizar(p: dict, origem: Path | str = "?") -> dict:
    erros: list[str] = []
    pid = p.get("id", "")
    if not ID_RE.match(pid or ""):
        erros.append("id: use minúsculas, números e hífen (3–61 caracteres)")
    elif Path(str(origem)).stem not in (pid, "?"):
        erros.append(f"id '{pid}' diferente do nome do arquivo '{Path(str(origem)).stem}'")
    if p.get("tipo") not in TIPOS:
        erros.append(f"tipo: um de {sorted(TIPOS)}")
    imp = p.get("importar")
    if imp:
        # arte feita fora (outra IA, ilustrador): só pós-processa, não gasta neurônio
        if not (RAIZ / imp).is_file():
            erros.append(f"importar: arquivo não encontrado: {imp}")
        p.setdefault("prompt", "")
        p["modelo"] = modelo = "importado"
        p["variacoes"] = [{"seed": 0, "modelo": "importado"}]
    else:
        if not isinstance(p.get("prompt"), str) or len(p["prompt"]) < 20:
            erros.append("prompt: texto descritivo obrigatório")
        modelo = p.get("modelo")
        if modelo not in MODELOS:
            erros.append(f"modelo: um de {sorted(MODELOS)}")
    p.setdefault("negative", "")
    p.setdefault("largura", 1024)
    p.setdefault("altura", 1024)
    p.setdefault("passos", None)
    p.setdefault("guidance", None)
    p.setdefault("referencias", [])
    variacoes = p.get("variacoes") or [{"seed": 1}]
    if not isinstance(variacoes, list) or not (1 <= len(variacoes) <= 8):
        erros.append("variacoes: lista de 1 a 8 itens")
        variacoes = []
    norm_var = []
    for i, v in enumerate(variacoes, 1):
        if isinstance(v, int):
            v = {"seed": v}
        v = dict(v)
        v.setdefault("seed", 1000 + i)
        v.setdefault("modelo", modelo)
        v.setdefault("passos", p["passos"])
        v.setdefault("largura", p["largura"])
        v.setdefault("altura", p["altura"])
        v.setdefault("prompt_extra", "")
        v["n"] = i
        info = MODELOS.get(v["modelo"])
        if imp:
            pass
        elif not info:
            erros.append(f"variacoes[{i}].modelo desconhecido: {v['modelo']}")
        else:
            for lado in ("largura", "altura"):
                if not (256 <= int(v[lado]) <= info["max_lado"]) or int(v[lado]) % 16:
                    erros.append(f"variacoes[{i}].{lado}: múltiplo de 16 entre 256 e {info['max_lado']}")
            if v["passos"] is not None and info["passos"]:
                lo, hi = info["passos"]
                if not (lo <= int(v["passos"]) <= hi):
                    erros.append(f"variacoes[{i}].passos: entre {lo} e {hi} para {v['modelo']}")
            if p["referencias"] and len(p["referencias"]) > info["refs"]:
                erros.append(f"variacoes[{i}]: {v['modelo']} aceita no máximo {info['refs']} referência(s)")
        norm_var.append(v)
    p["variacoes"] = norm_var

    pos = dict(p.get("pos") or {})
    pos.setdefault("remover_fundo", True)
    pos.setdefault("modelo_fundo", "birefnet-general")
    pos.setdefault("tamanho_final", 1024)
    pos.setdefault("derivados", [1024, 768, 512, 256] if p.get("tipo") == "balao" else [512, 256, 96, 48])
    pos.setdefault("margem", 0.03)
    pos.setdefault("fundo", "quadriculado" if imp else "liso")
    pos.setdefault("camadas", [])
    if not (1024 <= int(pos["tamanho_final"]) <= 2048):
        erros.append("pos.tamanho_final: entre 1024 e 2048")
    if pos["fundo"] not in ("liso", "quadriculado"):
        erros.append("pos.fundo: liso ou quadriculado")
    molde = pos.get("molde")
    if p.get("tipo") == "moldura":
        if not molde:
            erros.append("pos.molde obrigatório para moldura")
        else:
            molde = dict(molde)
            molde.setdefault("forma", "circulo")
            molde.setdefault("centro", [0.5, 0.5])
            molde.setdefault("sombra", 0.35)
            molde.setdefault("largura_sombra", 0.05)
            r = molde.get("raio")
            if molde["forma"] == "circulo" and not (isinstance(r, (int, float)) and 0.1 <= r <= 0.45):
                erros.append("pos.molde.raio: fração do lado entre 0.10 e 0.45")
            if molde["forma"] == "oval" and not (isinstance(r, list) and len(r) == 2):
                erros.append("pos.molde.raio: [rx, ry] para oval")
            if molde["forma"] == "quadrado":
                molde.setdefault("raio_canto", 0.04)
                if not (isinstance(molde.get("lado"), (int, float)) and 0.2 <= molde["lado"] <= 0.9):
                    erros.append("pos.molde.lado: fração do lado entre 0.20 e 0.90 (ex.: 560/1024 = 0.547)")
            if molde["forma"] not in ("circulo", "oval", "quadrado"):
                erros.append("pos.molde.forma: circulo, oval ou quadrado")
            pos["molde"] = molde
    p["pos"] = pos
    for ref in p["referencias"]:
        if not isinstance(ref, str) or not (RAIZ / ref).is_file():
            erros.append(f"referencias: arquivo não encontrado (caminho relativo à raiz): {ref}")
    if erros:
        raise PedidoInvalido(f"{origem}:\n  - " + "\n  - ".join(erros))
    return p


def custo_total(p: dict) -> float:
    if p.get("importar"):
        return 0.0
    return sum(
        estimar_neuronios(v["modelo"], int(v["largura"]), int(v["altura"]), v["passos"], len(p["referencias"]))
        for v in p["variacoes"]
    )


if __name__ == "__main__":
    falhou = False
    total = 0.0
    for arq in sys.argv[1:]:
        try:
            ped = carregar(arq)
            c = custo_total(ped)
            total += c
            modelos = sorted({v["modelo"].split("/")[-1] for v in ped["variacoes"]})
            if ped.get("importar"):
                modelos = ["importado: " + ped["importar"]]
            print(f"ok  {ped['id']}: {len(ped['variacoes'])} variação(ões), {', '.join(modelos)}, ~{c:,.0f} neurônios")
        except PedidoInvalido as e:
            falhou = True
            print(f"ERRO {e}")
    if total:
        print(f"total estimado: ~{total:,.0f} neurônios (plano gratuito: 10.000/dia)")
    sys.exit(1 if falhou else 0)
