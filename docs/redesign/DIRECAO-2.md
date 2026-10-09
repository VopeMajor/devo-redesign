# Direção 2 — decisões do dono (08/10, 23h)

Estas decisões têm prioridade sobre IDENTIDADE.md e sobre críticas anteriores quando houver conflito.

## 1. NPCs: voltam os sprites originais (temporários)
Os sprites originais ficam até o dono trocar por OCs próprios: Melissa (`npc/melissa-*.png`), Javali
(`npc/javali*.webp`, `npc/king-dice.png`) e Herdeiro (`npc/heir-v3-*.png`). Restaurar os arquivos e o uso
deles no código, cada retrato dentro do `PortraitFrame` do kit. Os retratos SVG de `components/devo/npc-art/`
deixam de ser usados (pode apagar). O crítico NÃO deve mais apontar esses sprites como bloqueador.
O código deve facilitar a troca futura: um único mapa de retratos por NPC/expressão (ex.: `lib/devo/npcs.ts`).

## 2. Duas estéticas, uma fronteira
- **Jornada** (landing → acesso → prólogo → tutorial): mantém o tom cinematográfico noturno (noite azul,
  cobalto, ouro antigo, cenas 3D). Já está em andamento.
- **Interior do DEVO** (tudo depois que o jogador entra: shell/home, perfil, Record, Cartas, Trocas, Sala de
  Jogos, Mensagens, Ajustes, avisos): segue as referências `refs/ref-record-desktop.jpg` e
  `refs/ref-record-mobile.jpg`. Traços dessa estética:
  - papel frio cinza-claro (#e3e5e8 / #d6d9dc — os tokens `--dv-background`/`--dv-surface` já existentes) como
    fundo, com textura leve de impressão/retícula e linhas de HUD finas (réguas, ticks, códigos tipo
    `DV_R084_0518`, coordenadas, barras de código);
  - painéis pretos (#090b0f/#15171c) com cantos retos ou um chanfro, títulos em serifada fina caixa-alta
    ("RECORD FILE", "CARTAS DEVO") seguidos de legenda em japonês pequena (レコード・ファイル);
  - cobalto elétrico (#1647ff) como tinta principal: abas ativas em bloco cobalto sólido, números, barras de
    progresso, links "VER TODAS ›"; arte em duotom azul/preto (estilo tinta/mangá);
  - tipografia: serifada fina e larga para títulos (DEADLY VOTE em display), mono para dados
    (`03:17:42:09`, `ID.RECORD: DV-7X19-A`), sans pequena caixa-alta espaçada para rótulos;
  - vermelho só para alerta (EM PROGRESSO, ALERTA CRÍTICO, faixa listrada do terminal do gerente);
  - ouro quase some no interior: só em conquistas/raridade lendária;
  - mobile: barra de navegação inferior preta com ícones finos e rótulos (ex.: RECORD · ARCANO · CARTAS ·
    VOTES · AVISOS), item ativo em cobalto com brilho; listas em linha do tempo (datas à esquerda, ponto,
    nome do arco, status à direita).
- **A fronteira**: ao terminar o tutorial (ou "Reconectando"), a transição faz a passagem da noite para o
  papel do sistema (ex.: a cortina vira uma folha de registro sendo impressa/escaneada).
- O sistema de grade dos cards de cartas do Record (cartas em duotom, "12 / 20") é a referência para Cartas.

## 3. Sistemas futuros (descrições virão depois — só reservar lugar)
Não implementar agora. A navegação e a identidade do interior devem prever espaço para:
- **Torres de Ruptura** — progressão por andares (refs `ref-torre-ruptura-1/2.jpg`: escada em espiral,
  andares/"alturas" I–IV com cadeado, nós em estrela de 4 pontas — combina com o sigilo do DEVO).
- **Poço dos Desejos** — gacha.
- **Virtudes** — sistema de ATB (a ref do Record mostra Virtudes com notas SS/A+/S… por atributo).
- **Arcanos** — (a ref mostra "Arcano: O Voto, Rank S").
- **Corporações** — guildas.
- **Salão das Máscaras** — leilão.
Onde fizer sentido, mostrar como itens bloqueados/"em breve" coerentes (cadeado + estrela), sem botão ativo.

## 4. Deadly Vote (já pode implementar)
É um RPG textual no WhatsApp. Um dealer ou anfitrião lança o Deadly Vote com data; jogadores se inscrevem;
quando começa, o dealer manda o link do grupo do WhatsApp, que aparece para os inscritos. Status visíveis:
não iniciado (convocado), em andamento, encerrado (concluído), cancelado, falha. Precisa de: campo de link do
WhatsApp (migração em `scripts/`), o dealer informa/edita o link, inscritos veem o botão "Entrar no grupo"
quando o status for "em andamento" (não inscritos não veem o link).
