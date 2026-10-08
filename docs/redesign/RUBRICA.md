# Rubrica do crítico — DEVO premium (mobile 390×844)

O crítico avalia **só pelas capturas** (e pelo `manifest.json` com erros de console). Não escreve código.
Cada critério recebe nota 0–5. **Aprovação:** média ≥ 4.0, nenhum critério abaixo de 3, e zero
bloqueadores. Notas sempre com evidência: nome da captura + o que se vê.

As referências são **guias de qualidade, não de aparência**. Nada de copiar telas, personagens,
logos, ícones, fontes proprietárias ou composições reconhecíveis delas.

| # | Critério | Referência de qualidade | 5 = | 0–2 = |
|---|---|---|---|---|
| 1 | **Composição e hierarquia** | Persona 5 Royal (menus) | Um foco claro por tela; diagonais/recortes intencionais; tipografia em escala dramática; leitura em 1 segundo | Tudo com o mesmo peso; listas planas; centro vazio |
| 2 | **Transições e movimento** | Persona 5 Royal (cortes, wipes) | Entradas e saídas com direção e ritmo (≤ 500ms para UI, cortinas ≤ 1.8s); continuidade entre telas; nada "pisca" do nada | Troca seca de tela; animações aleatórias; atraso perceptível |
| 3 | **Atmosfera e tensão** | Danganronpa V3 (tribunal, contraste, vermelho de alerta) | Cena 3D/luz/partículas sustenta o clima de jogo mortal; o tempo é sempre sentido; alertas cortam a tela | Fundo genérico; nenhuma sensação de perigo |
| 4 | **Polimento e microinterações** | Honkai: Star Rail (molduras, brilho, feedback) | Estados de toque/foco/desabilitado distintos; ícones e molduras consistentes; brilhos sutis; números tabulares; nada desalinhado | Bordas tortas, recortes de texto, estados ausentes |
| 5 | **Coesão de identidade** | Identidade DEVO (`MAPA.md`) + `docs/redesign/refs` | Mesmos tokens, molduras, sigilo e tipografia em todas as áreas; cobalto + ouro + papel + vermelho de alerta usados com regra | Cada tela parece de um jogo diferente |
| 6 | **Legibilidade mobile** | — | Texto ≥ 12px efetivo (rótulos ≥ 10px só em caixa alta espaçada); contraste AA; alvos de toque ≥ 44px; nada cortado nas bordas; respeita área segura | Texto minúsculo/apagado; botões pequenos; overflow horizontal |
| 7 | **Desempenho percebido** | — | Cena 3D leve (sem engasgo aparente, fallback quando WebGL falha); tela útil em < 1s | Tela preta/vazia esperando; erros de WebGL no console |
| 8 | **Função preservada** | `MAPA.md` | Todos os botões/fluxos da área aparecem e funcionam nas capturas; nenhum erro novo no console | Algo sumiu, quebrou ou ficou inalcançável |

## Bloqueadores (reprovam na hora)
- Erro de página (`pageerror`) ou tela em branco/preta onde deveria haver conteúdo.
- Elemento protegido de terceiros (personagem, logo, arte de outro jogo).
- Função listada no `MAPA.md` para a área que não aparece mais.
- Texto ilegível ou cortado em elemento principal.

## Formato da resposta do crítico
```
ÁREA: <nome>   RODADA: <n>   VEREDITO: APROVADO | REPROVADO
NOTAS: 1=x 2=x 3=x 4=x 5=x 6=x 7=x 8=x  (média y)
BLOQUEADORES: - ...
CORREÇÕES (ordem de prioridade, cada uma com captura + o que fazer, sem código):
1. ...
```
