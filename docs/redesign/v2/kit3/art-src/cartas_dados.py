"""Cartas: dados do catálogo, lidos de lib/devo/cards.ts sem mudar nenhum texto.
Uso: python cartas_dados.py (na pasta art-src)"""
import json
import re
from pathlib import Path

AQUI = Path(__file__).parent
RAIZ = AQUI.parents[4]

ts = (RAIZ / "lib" / "devo" / "cards.ts").read_text(encoding="utf-8")
bloco = ts[ts.index("export const CARDS: CardDef[] = ["):ts.index("const CARD_MAP")]
TEXTO = r"'((?:[^'\\]|\\.)*)'"


def campo(obj, nome):
    m = re.search(rf"\b{nome}: {TEXTO}", obj)
    return m.group(1).replace("\\'", "'") if m else ""


cartas = []
for obj in re.split(r"(?=\bid: ')", bloco)[1:]:
    peso = re.search(r"\bpeso: (\d+)", obj)
    cartas.append({"id": campo(obj, "id"), "nome": campo(obj, "name"), "num": campo(obj, "numeral"), "rar": campo(obj, "rarity"), "tipo": campo(obj, "type"),
                   "natureza": campo(obj, "natureza"), "arquetipo": campo(obj, "arquetipo"), "peso": int(peso.group(1)) if peso else None,
                   "efeito": campo(obj, "effect"), "detalhe": campo(obj, "detalhe"), "flavor": campo(obj, "flavor")})
assert len(cartas) == 8, len(cartas)
peso_txt = re.search(rf"PESO_TEXTO =\s*{TEXTO}", ts).group(1).replace("\\'", "'")
arq = dict(re.findall(rf"(\w+|'[^']+'): {TEXTO}", ts[ts.index("ARCHETYPE_BY_TYPE"):ts.index("export function getCardArquetipo")]))
arq = {k.strip("'"): v for k, v in arq.items()}
pad = dict(re.findall(r"(\w+): (\d)", ts[ts.index("PESO_PADRAO"):ts.index("export function getCardPeso")].split("\n")[0]))
for c in cartas:
    c["arquetipo"] = c["arquetipo"] or arq.get(c["tipo"], "")
    c["peso"] = c["peso"] or int(pad[c["rar"]])
(AQUI.parent / "os-cartas-dados.js").write_text(
    "// Gerado por art-src/cartas_dados.py a partir de lib/devo/cards.ts: não editar à mão.\n"
    f"const CARTAS={json.dumps(cartas, ensure_ascii=False)};\nconst PESO_TEXTO={json.dumps(peso_txt, ensure_ascii=False)};\n", encoding="utf-8")

print("ok", [c["arquetipo"] for c in cartas][:2], len(peso_txt))
