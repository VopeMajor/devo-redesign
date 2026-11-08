"""Sala de Jogos: copia sem mudar nenhuma palavra os jogos, as patentes (lib/devo/arcade/games.ts) e a apresentação do Javali
(components/devo/arcade/javali-intro.tsx, mesa.tsx). Uso: python jogos_dados.py (na pasta art-src)"""
from pathlib import Path

AQUI = Path(__file__).parent
RAIZ = AQUI.parents[4]
g = (RAIZ / "lib" / "devo" / "arcade" / "games.ts").read_text(encoding="utf-8")
jogos = g[g.index("export const GAMES"):]
jogos = jogos[jogos.index("= {") + 2:jogos.index("\n}\n") + 2]
pat = g[g.index("export const PATENTES"):]
pat = pat[pat.index("= [") + 2:pat.index("] as const") + 1]
t = (RAIZ / "components" / "devo" / "arcade" / "javali-intro.tsx").read_text(encoding="utf-8")
fala = t[t.index("const SCRIPT"):]
fala = fala[fala.index("= [") + 2:fala.index("\n]\n") + 2]
m = (RAIZ / "components" / "devo" / "arcade" / "mesa.tsx").read_text(encoding="utf-8")
host = m[m.index("const HOST_LINES"):]
host = host[host.index("= [") + 2:host.index("\n]\n") + 2]
(AQUI.parent / "os-jogos-dados.js").write_text(
    "// Gerado por art-src/jogos_dados.py a partir de lib/devo/arcade/games.ts, javali-intro.tsx e mesa.tsx: não editar à mão.\n"
    "const GAMES=" + jogos + ";\nconst PATENTES=" + pat + ";\nconst JAVALI_FALAS=" + fala + ";\nconst JAVALI_LINHAS=" + host + ";\n", encoding="utf-8")
print("ok")
