# Direção 2 — decisões do dono (08/10, 23h)

Estas decisões têm prioridade sobre IDENTIDADE.md e sobre críticas anteriores quando houver conflito.

## 0. A identidade do DEVO (ref. do dono, 23h28) — vale para TUDO
Refs: `refs/ref-gotico-figurino.png`, `refs/ref-valsa-relogio.png`, `refs/ref-gaiola-ouro.png`,
`refs/ref-xadrez-marmore.png` (somam-se às refs anteriores de Alice, astrolábio, diário e Record).
"É o que espero para a identidade visual do DEVO. Mantenha a alta qualidade."
- **Paleta**: preto aveludado e branco porcelana como base (monocromático), xadrez preto/branco;
  **ouro antigo/latão** em metal, filigrana e molduras; **noite azul-violeta profunda** como atmosfera
  (céu do relógio, salão); **vermelho-sangue** só como joia/gota (detalhe) e alerta; cobalto continua
  como tinta de sistema (interações, dados) — mais escuro/marinho, conversando com a noite violeta.
- **Materiais**: renda e babados brancos, laços pretos, veludo, porcelana, mármore branco e negro com
  veios e rachaduras, latão polido, vidro facetado (losangos), papel frio do Record.
- **Motivos**: tabuleiro de xadrez/piso xadrez, mostrador de relógio gigante com numerais romanos,
  engrenagens, gaiola dourada (prisão elegante), espadas cravadas, estrelas de 4 pontas e losangos
  (já são o sigilo do DEVO), laços, cruz/rosário, coelho de pelúcia, tesoura e talheres de prata (Alice),
  lanternas pendentes, arcos góticos, marionetes/fios.
- **Sensação**: gótico delicado (lolita monocromática) + relojoaria + salão de valsa assombrado; luxo
  ameaçador. Sem copiar personagens, roupas ou cenas das refs: são material e motivo.
- **Como combina com o Record (seção 2)**: o layout/estrutura do interior segue as refs do Record
  (painéis, linha do tempo, abas, barra inferior, HUD), e esta seção define o MATERIAL e o ORNAMENTO:
  painéis pretos aveludados com filete de latão e cantos com filigrana; fundo de papel frio/porcelana
  com renda e xadrez sutis; arte em duotom pode ser preto/branco com toque cobalto ou violeta;
  raridades e conquistas em ouro; alerta em vermelho-joia.
- **Jornada**: mantém a noite cinematográfica, agora com o salão do relógio (mostrador gigante,
  arcos góticos, lanternas, piso xadrez em mármore) como cenário 3D-chave.

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
