"""Gera as variações de um pedido chamando a REST API do Workers AI.

Uso (no runner):
  CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... \
    python3 arte/ferramentas/gerar.py arte/pedidos/<id>.json <pasta-saida>

Grava <saida>/bruto/vNN.png e <saida>/geracao.json (parâmetros, tempo, erros).
O token só é lido do ambiente; nunca é impresso nem gravado.
"""
from __future__ import annotations

import base64
import io
import json
import os
import sys
import time
from pathlib import Path

import requests
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from pedido import MODELOS, carregar, estimar_neuronios  # noqa: E402

API = "https://api.cloudflare.com/client/v4/accounts/{conta}/ai/run/{modelo}"
RAIZ = Path(__file__).resolve().parents[2]


class LimiteDiario(RuntimeError):
    pass


def ref_bytes(caminho: str) -> bytes:
    """Referências precisam ser menores que 512x512 nos modelos FLUX.2."""
    im = Image.open(RAIZ / caminho).convert("RGB")
    im.thumbnail((508, 508), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "PNG")
    return buf.getvalue()


def montar(p: dict, v: dict) -> dict:
    """Devolve kwargs para requests.post conforme o formato do modelo."""
    modelo = v["modelo"]
    info = MODELOS[modelo]
    prompt = p["prompt"] + ((" " + v["prompt_extra"]) if v["prompt_extra"] else "")
    campos: dict[str, object] = {"prompt": prompt, "seed": int(v["seed"])}
    if not modelo.endswith("flux-1-schnell"):
        campos["width"] = int(v["largura"])
        campos["height"] = int(v["altura"])
    if v["passos"] is not None and "klein" not in modelo:  # klein: 4 passos fixos
        chave = "steps" if (info["formato"] == "multipart" or modelo.endswith("schnell")) else "num_steps"
        campos[chave] = int(v["passos"])
    if p["guidance"] is not None and not modelo.endswith(("schnell", "klein-4b", "klein-9b")):
        campos["guidance"] = float(p["guidance"])
    if p["negative"] and modelo.endswith(("stable-diffusion-xl-base-1.0", "phoenix-1.0")):
        campos["negative_prompt"] = p["negative"]

    if info["formato"] == "multipart":
        files = {k: (None, str(val)) for k, val in campos.items()}
        for i, ref in enumerate(p["referencias"]):
            files[f"input_image_{i}"] = (f"ref{i}.png", ref_bytes(ref), "image/png")
        return {"files": files}
    if p["referencias"] and modelo.endswith("stable-diffusion-xl-base-1.0"):
        campos["image_b64"] = base64.b64encode(ref_bytes(p["referencias"][0])).decode()
        campos["strength"] = float(p.get("forca_referencia", 0.6))
    return {"json": campos}


def extrair_imagem(resp: requests.Response) -> bytes:
    ctype = resp.headers.get("content-type", "")
    if ctype.startswith("image/"):
        return resp.content
    dados = resp.json()
    img = (dados.get("result") or {}).get("image") if isinstance(dados, dict) else None
    if not img:
        raise RuntimeError(f"resposta sem imagem: {json.dumps(dados)[:400]}")
    if img.startswith("data:"):
        img = img.split(",", 1)[1]
    return base64.b64decode(img)


def chamar(conta: str, token: str, p: dict, v: dict, log) -> bytes:
    url = API.format(conta=conta, modelo=v["modelo"])
    kwargs = montar(p, v)
    espera = [0, 15, 45, 90]
    ultimo = ""
    for tentativa, pausa in enumerate(espera, 1):
        if pausa:
            log(f"    nova tentativa em {pausa}s")
            time.sleep(pausa)
        try:
            r = requests.post(url, headers={"Authorization": f"Bearer {token}"}, timeout=300, **kwargs)
        except requests.RequestException as e:
            ultimo = f"rede: {e}"
            continue
        if r.ok:
            return extrair_imagem(r)
        try:
            corpo = r.json()
            erros = corpo.get("errors") or []
        except ValueError:
            corpo, erros = r.text[:400], []
        msg = "; ".join(f"{e.get('code')}: {e.get('message')}" for e in erros) or str(corpo)[:400]
        ultimo = f"HTTP {r.status_code} — {msg}"
        if r.status_code in (401, 403):
            raise RuntimeError(
                f"{ultimo}\nO token foi recusado. Confira se o segredo CLOUDFLARE_API_TOKEN tem a permissão "
                "'Account › Workers AI › Read' (ou Edit) nesta conta."
            )
        if any(str(e.get("code")) == "4006" for e in erros) or "neurons" in msg.lower() and "daily" in msg.lower():
            raise LimiteDiario(ultimo)
        if r.status_code not in (408, 429, 500, 502, 503, 504):
            raise RuntimeError(ultimo)
    raise RuntimeError(f"desisti após {len(espera)} tentativas: {ultimo}")


def main() -> int:
    token = os.environ.get("CLOUDFLARE_API_TOKEN", "").strip()
    conta = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "").strip()
    if not token or not conta:
        print("ERRO: CLOUDFLARE_API_TOKEN/CLOUDFLARE_ACCOUNT_ID ausentes no ambiente.")
        return 2
    p = carregar(sys.argv[1])
    saida = Path(sys.argv[2])
    (saida / "bruto").mkdir(parents=True, exist_ok=True)
    linhas: list[str] = []

    def log(s: str) -> None:
        print(s, flush=True)
        linhas.append(s)

    registro = {"pedido": p["id"], "variacoes": []}
    parar = False
    for v in p["variacoes"]:
        nome = f"v{v['n']:02d}"
        est = estimar_neuronios(v["modelo"], int(v["largura"]), int(v["altura"]), v["passos"], len(p["referencias"]))
        item = {
            "nome": nome, "modelo": v["modelo"], "seed": v["seed"], "passos": v["passos"],
            "largura": v["largura"], "altura": v["altura"], "neuronios_estimados": round(est),
        }
        if parar:
            item["erro"] = "pulada: limite diário atingido"
            registro["variacoes"].append(item)
            continue
        log(f"[{p['id']}] {nome}: {v['modelo']} seed={v['seed']} {v['largura']}x{v['altura']} passos={v['passos']} (~{est:,.0f} neurônios)")
        t0 = time.time()
        try:
            dados = chamar(conta, token, p, v, log)
            im = Image.open(io.BytesIO(dados))
            im.load()
            im.convert("RGB").save(saida / "bruto" / f"{nome}.png", "PNG")
            item.update({"ok": True, "segundos": round(time.time() - t0, 1), "tamanho_real": list(im.size)})
            log(f"    ok em {item['segundos']}s, {im.size[0]}x{im.size[1]}")
        except LimiteDiario as e:
            item["erro"] = str(e)
            parar = True
            log(f"    LIMITE DIÁRIO do Workers AI atingido ({e}). As demais variações ficam para amanhã ou para o plano pago.")
        except Exception as e:  # noqa: BLE001 — registra e segue para a próxima variação
            item["erro"] = str(e)
            log(f"    ERRO: {e}")
            if "token foi recusado" in str(e):
                parar = True
        registro["variacoes"].append(item)

    (saida / "geracao.json").write_text(json.dumps(registro, ensure_ascii=False, indent=2), encoding="utf-8")
    with open(saida / "log.txt", "a", encoding="utf-8") as f:
        f.write("\n".join(linhas) + "\n")
    ok = sum(1 for i in registro["variacoes"] if i.get("ok"))
    log(f"[{p['id']}] {ok}/{len(registro['variacoes'])} imagens geradas")
    if not ok and parar and any("LIMITE" in l for l in linhas):
        return 3  # limite diário: o workflow para os próximos pedidos e não sobrescreve a saída publicada
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
