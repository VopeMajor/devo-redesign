# Validação dos jogos da Sala de Jogos (01/11/2026)

Pedido do dono: "Valide os jogos por dentro. quero que ajuste a otimização e estilo em geral, alguns estão muito simples
ou não atendem a qualidade que espero."

**Como foi feita:** leitura do código atual (`components/devo/arcade/*`) e capturas do CI de 15/10 (`capturas/area/salajogos`),
anteriores à última rodada de ajustes. Os jogos atuais não rodaram nesta máquina: precisam de banco e duas contas. Por isso não
há medida de quadros por segundo do jogo atual. O que está abaixo é o que o código mostra.

## O que vale para os quatro

| Ponto | Situação | Onde |
|---|---|---|
| Partida online por consulta repetida ao servidor | Cada consulta passa pelo Worker e pelo banco | `arcade/use-room.ts` |
| Capas | 4 PNG somam 4,9 MB; as capas novas em pixel somam 52 KB | `public/images/arcade/banner-*.png` |
| Visual | Cada jogo tem linguagem própria, nenhum segue o sistema de janelas em pixel aprovado | `games/*` |

## Por jogo

| Jogo | Estilo | Otimização |
|---|---|---|
| **Memory Rush** | O mais simples: ícones de linha em cartas lisas, tela vazia, pouca reação. | Consulta a cada 450 ms; relógio verifica a cada 100 ms (já só redesenha 1x por segundo). |
| **Living Chess** | 3D ambicioso, mas não conversa com o pixel; reações em emoji. Tutorial só demonstração. | O mais pesado para abrir: three.js + 3D. A tela inteira redesenha a cada 100 ms (`quick-chess.tsx:370`). Consulta a cada 900 ms, a mais tranquila. |
| **Bomba Quente** | Personagens genéricos (Coelho e Urso); paleta e arena fora do resto do jogo. Gira a tela no celular. | **O pior ponto:** consulta a cada 110 ms, cerca de 9 por segundo por jogador (`hot-bomb.tsx:141`). Arquivo único de 1.587 linhas, sombras suaves e várias luzes em celular; há redução automática de resolução. Áudio próprio, fora do `lib/devo/audio.ts`. |
| **Blefe** | O melhor acabamento dos quatro, mas com cara de cassino genérico e muito texto na tela. | Redesenha a cada 200 ms (mão protegida por `memo`). Até 26 cartas em SVG. Consulta a cada 600 ms. |

## Decisão de direção

Refazer os quatro no protótipo (`kit3`), um por vez, com aprovação do dono, no estilo aprovado. No jogo real nada muda até a
integração; a redução das consultas online (principalmente a da Bomba) só pode ser feita e medida lá.

**Memory Rush refeito (`kit3/os-memory.js`):** mesmas fases, pontos, teto, combo e tempo do jogo. Cartas e 13 símbolos em pixel,
mesa de feltro, placar de bronze, combo em losangos, distribuição das cartas, faíscas no par, tremida no erro, moldura de alerta
nos últimos 10 segundos. Nada redesenha a tela inteira: o relógio só escreve quando o segundo muda e cada carta só muda de
classe. Sem som ainda. Oponente simulado no aparelho.

**Living Chess (`components/devo/arcade/chess/*`, `games/quick-chess.tsx`):** o dono decidiu manter o 3D: "no xadrez mantém 3D,  mas melhore o desempenho". A otimização foi feita no código real do jogo e a interface v2 no protótipo (`kit3/art-src/xadrez-3d-entrada.tsx` → `kit3/os-xadrez-3d.js`, que usa a mesma cena).

- **O que pesava:** 32 peças com 492 mil triângulos sem índice (cavalo: 34 mil), desenhadas duas vezes por causa da sombra; 220 chamadas de desenho por quadro; 60 quadros por segundo mesmo parado; verniz (clearcoat) em todas as peças e no tabuleiro; luz nova acesa no xeque (recompila todos os shaders); shaders preparados para um tipo de sombra diferente do usado; 47 camadas animadas no fundo; tela redesenhada 10x por segundo pelo relógio.
- **O que mudou:** malhas com índice e nível de detalhe por qualidade; peças em lote (uma malha por tipo e lado); moldura, espadas, marcas e estilhaços em lote; desenho sob demanda (20 quadros por segundo parado, nenhum na qualidade baixa); sombra refeita só quando algo se move; verniz e quarta luz só na qualidade alta; xeque com halo pintado em vez de luz; todos os shaders aquecidos ao abrir; 16 camadas animadas no fundo (médio) e 1 (baixo); relógio redesenha 1x por segundo; resolução e qualidade descem sozinhas se o aparelho não der conta (gráficos em automático); textura do tampo guardada para a revanche.
- **Toque:** cavalos descansam de perfil. Área de toque afina para o alto; tocar de novo passa para a peça de trás; uma casa possível atrás de peça alta recebe o toque. Antes, no computador, o peão e2 não podia ser tocado com o rei em e1.
- **Não mudou:** consulta ao servidor a cada 900 ms; download do three.js (1,2 MB no protótipo, o jogo real não foi medido).
- **Não testado:** celular de verdade; a tela real `quick-chess.tsx` com banco e duas contas; build completo (só checagem de tipos dos arquivos do xadrez).

**Bomba Quente refeita (`kit3/os-bomba.js`, arte em `kit3/art/os/bomba`, gerada por `art-src/bomba_px.py`):** mesmas regras e mesma física do jogo (raio, velocidades, pulo, inclinação, barras, bumpers, rodadas, passe, clutch, pontos). Sai o 3D: um canvas pequeno ampliado em pixel, em pé no celular, sem girar a tela. Coelho e Urso viram figuras mascaradas; a arena vira um mostrador de relógio e as barras, os ponteiros.

- **Medido no jogo atual (Intel, 844×390, em jogo):** 264 comandos de desenho e 118 mil triângulos por quadro, 67 quadros por segundo sem limite de tela (60 com o processador 4× mais lento).
- **Medido no protótipo (Intel, partida inteira):** 1.758 quadros por segundo em 390×844, pior quadro de 13 ms; 388 em 1440×900 com processador 4× mais lento, pior quadro de 38 ms; nenhuma tarefa longa. Tela de tamanho diferente do jogo atual, então a comparação é aproximada.
- **Peso:** 27 KB de código e 88 KB de arte, sem three.js.
- **Defeito do jogo atual, corrigido só aqui:** `eventSchedule` sorteia entre 5 eventos numa lista de 6, e "CHÃO INSTÁVEL!" nunca acontece.
- **Não mudou:** a consulta a cada 110 ms do jogo real (`hot-bomb.tsx:141`). O servidor confere a distância do passe com as posições enviadas (`rooms.ts:395`), e mexer nisso sem testar com duas contas pode recusar passes válidos. Fica para a integração.
- **Não testado:** celular real, toque de verdade (o joystick foi testado com ponteiro de mouse), partida online.

**Blefe refeito (`kit3/os-blefe.js`, arte em `kit3/art/os/blefe`, gerada por `art-src/blefe_px.py`):** regras e bot são os do jogo, sem alteração: `kit3/os-blefe-motor.js` é gerado de `lib/devo/arcade/bluff.ts` por `art-src/blefe_motor.mjs`. A partida acontece na mesa do Javali, que reage com as próprias expressões; o tambor de três balas é o centro da revelação; o histórico fica escondido num botão.

- **Medido (Intel, 390×844, 30 s de partida, mesmo jogador automático):** navegador ocupado de 7,7% para 1,9%; com processador 4× mais lento, de 28,2% para 5,5%. Recálculos de estilo de 110 para 16 por segundo, recálculos de layout de 18,8 para 4,3 por segundo. SVG de 235 para 0. A contagem de elementos não é comparável: o protótipo inclui o sistema inteiro em volta do jogo (o Blefe em si usa cerca de 70).
- **Peso:** 52 cartas numa imagem só de 24 KB; toda a arte soma 80 KB.
- **Não mudou:** a consulta a cada 600 ms do jogo real. Fica para a integração.
- **Não testado:** celular real, partida online.
