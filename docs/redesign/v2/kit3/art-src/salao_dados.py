"""Salão: copia sem mudar nenhuma palavra a apresentação do Herdeiro e o aviso de anunciar (lib/devo/salao-herdeiro.ts).
Uso: python salao_dados.py (na pasta art-src)"""
from pathlib import Path

AQUI = Path(__file__).parent
ts = (AQUI.parents[4] / "lib" / "devo" / "salao-herdeiro.ts").read_text(encoding="utf-8")
ap = ts[ts.index("export const HERDEIRO_APRESENTACAO"):]
ap = ap[ap.index("= [") + 2:ap.index("\n]\n") + 2]
av = ts[ts.index("export const AVISO_ANUNCIAR"):]
av = av[av.index("= [") + 2:av.index("\n]\n") + 2]
(AQUI.parent / "os-salao-dados.js").write_text(
    "// Gerado por art-src/salao_dados.py a partir de lib/devo/salao-herdeiro.ts: não editar à mão.\n"
    "const HERDEIRO_FALAS=" + ap + ";\nconst AVISO_ANUNCIAR=" + av + ";\n", encoding="utf-8")
print("ok")
