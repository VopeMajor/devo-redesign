# Direção 3 — Progressão e novos sistemas (dono, 16/10)

Fontes do dono, que valem como especificação (ler inteiras, não resumir de memória):
- `SISTEMAS-texto-do-dono.txt` — Poço dos Milagres (diálogo + regras), Melissa holograma / Corporações, permissões por cargo, cosméticos (§1–14), campos do Deadly Vote, diálogo do Galo sobre Torres/Essências, regras das Torres.
- `DIALOGOS-galo-salao.md` — Galo (Karma) e apresentação do Salão das Máscaras (pelo Herdeiro).
- `VIRTUDES.md` — Virtudes / Pontos de Potencial (Google Doc).
- Refs: `refs/cosmeticos/ref-01..08` (molduras/ornamentos), `refs/torres/ref-mapa-circo.png` e `ref-mapa-castelo.png` (mapa com torres secundárias e uma principal), `refs/torres/ref-torre-andares.png` e `ref-torre-escada.png` (tela de uma torre, andares com cadeado), e as antigas `refs/ref-torre-ruptura-*.jpg`.
- **Sprites OC novos**: `refs/npc-oc/*.png` — folhas 4×3 (12 expressões) de Coruja, Galo, Herdeiro, Javali, Melissa e Rato. Substituem os sprites antigos (o dono avisou que trocaria por OCs).

As referências são guia de qualidade e de material, não para copiar (algumas são arte de jogos/livros). A paleta continua a de DIRECAO-2 §6 (mármore negro/branco, metal champanhe-prateado, ametista como único frio, rubi só alerta). Cosméticos podem ter cor própria (vinho, carmim, ametista, céu noturno), mas sempre sobre o material DEVO e sem neon.

## 1. Fluxo do jogador (ordem de desbloqueio)
1. **Início**: troca de cartas, chat com NPCs, Sala de Jogos — tudo já existente, acessível pelos ícones do DEVO, perfil etc.
2. **Tutorial = um Deadly Vote inicial** (criado semanalmente pela equipe). **Vencer** desbloqueia novos sistemas: ícones do **Salão das Máscaras**, **Poço dos Milagres** (no texto também "Poço dos Desejos"), **Torre de Ruptura**… Antes disso eles aparecem trancados (como hoje).
3. O jogador explora o que ficou disponível; cada sistema tem sua apresentação narrativa na primeira entrada (Poço → figura encapuzada, secretamente o Anfitrião **Corvo**; Torres → Galo; Salão → o "maestro"; Corporações → holograma da Melissa).
4. **Novo diálogo com O Galo** (casa, campainha, Karma).

Desbloqueios são **flags por jogador no servidor**, com override de Owner (para testes e para liberar manualmente).

## 1b. Respostas do dono (16/10, 06:53)
- O "maestro" que apresenta o Salão das Máscaras é **o Herdeiro**.
- Poço: probabilidades **provisórias**, marcadas como tal e editáveis pelo Owner, até o dono definir as finais.
- Ícones dos sistemas novos ficam **trancados também para contas existentes** até vencer o Deadly Vote do tutorial — **exceto Owners e Anfitriões**, que veem tudo liberado.

## 2. Sistemas novos
- **Karma**: inteiro por jogador, começa em 0, sobe (ordem) e desce (caos, pode ser negativo). Escolhas de diálogo podem alterar. Exibido como "linha do destino", sem número cru no início.
- **Poço dos Milagres**: poço com Moeda / Girar / Balde, ⋯ no canto (moedas e descrições), letreiro rolando com últimos prêmios bons, baldes (madeira gasto inicial; outros bloqueados; raros ocultos), minigame na manivela (ritmo/timing), 1 giro grátis diário na categoria normal, categorias por moeda (Dracma Comum = base; Dracma Incomum recebido do Corvo). Resultados: maioria lixo (não vai ao inventário), cápsulas do tempo (vão ao **Diário**), fragmentos de arcano, essências de afinidade, cosméticos. Probabilidades em **configuração editável por Owner**; não inventar números finais — usar valores provisórios claramente marcados.
- **Torres de Ruptura**: tela-mapa com torres secundárias e uma principal (refs de mapa) → toque numa torre abre a tela da torre (refs de andares/escada). Torre tem 5–8 andares; cada andar custa **Essências de Afinidade** do tipo da torre e o custo **dobra** a cada andar; andares de secundárias entregam **chaves**; andares da principal podem exigir N chaves. Diálogos/NPCs dos andares vêm do dono aos poucos: o conteúdo de cada andar é **dado** (arquivo/tabela), não código.
- **Salão das Máscaras**: abre 1× a cada 3 dias, contador grande até a próxima abertura; leilões (principal), compra/venda de cartas entre jogadores, propostas/propagandas; aba **Bandeja** (itens enviados pelo Shuffler aguardam avaliação de especialista = staff; raridade mínima; vagas por edição); pagamento em Tempo; taxas por tipo de contrato; eventos quinzenais/especiais no **Calendário Devo**. Anúncios de recrutamento de Corporações aparecem aqui.
- **Corporações** (guildas): página com campo de código de identificação; entrada aprovada por líder/vice; criar custa Tempo + aprovação administrativa; Necro-Corporações (ilegais). Apresentação por **holograma da Melissa** — sempre que o assunto for a Companhia de Despertados aparece o ícone + animação/tela holográfica dela.
- **Virtudes**: ver VIRTUDES.md. Interface qualitativa; números ficam no servidor.
- **Diário**: guarda cápsulas do tempo (curiosidades do mundo).
- **Inventário ampliado**: moedas (Dracmas por raridade), essências por torre, chaves, fragmentos de arcano, cápsulas, cosméticos.

## 3. Cargos e permissões (tabela do dono no texto)
Owner / Anfitrião / Dealer / Jogador, com as regras do texto: Dealer tem `supervisor_id` obrigatório (Anfitrião); recompensas propostas por Dealer exigem aprovação; alterar recompensa aprovada volta a "pendente"; cada recompensa tem quantidade, destinatário, justificativa, evento de origem e quem autorizou; recompensas externas do Anfitrião exigem aprovação de Owner; transferência de Dealer preserva histórico; Jogador recebe cota de 1 convite (não renova). **Tudo validado no servidor.**
**Owner nunca é revelado publicamente** (nem em tooltip, inspeção de perfil ou payload público); Anfitrião pode ser público. Owner pode equipar qualquer cosmético.

## 4. Deadly Vote (complemento)
Campos atuais: local, descrição, data, horário, link, recompensas (não públicas ao jogador); pode acrescentar campos. O dono do DV aceita inscrições, muda status; após concluir, tem a lista de participantes e decide por participante (recebe prêmio, morreu, não compareceu…) **antes** de aplicar aos perfis. Recompensas passam pelo fluxo de aprovação do §3.

## 5. Cosméticos
Especificação completa em `SISTEMAS-texto-do-dono.txt` (seção "DEVO — Sistema de Cosméticos"). Coleção inicial obrigatória (8 molduras nomeadas, emblemas, balões de chat), avatar + miniperfil, animações leves e desligáveis, inventário com pré-visualização no próprio avatar, painel de Owner, raridades (Comum → Arcano), sincronização sem recarregar. Assets em SVG/WebP transparentes feitos por nós (nada copiado das refs).

## 6. Agentes (mesmo critério das áreas: worktree própria, BRIEF-AREA, capturas no CI, crítico)
- **Fundação** (primeiro; os demais dependem): esquema e APIs de cargos/permissões, supervisor, recompensas com aprovação, inventário ampliado (moedas, essências, chaves, fragmentos, cápsulas, cosméticos possuídos), flags de desbloqueio, karma, cota de convites. Migrações SQL idempotentes + seed de teste + atualização do `devo-banco-novo`.
- **Elenco OC**: recortar as folhas 4×3 em 12 expressões transparentes por NPC, mapear em `lib/devo/npcs.ts`, trocar os sprites antigos; Galo e Corvo entram no elenco.
- **Narrativa e progressão**: motor de diálogo com escolhas, respostas por opção, efeitos (tempo, karma, itens, flags), sons; fluxo de desbloqueio pós-tutorial; diálogos do Galo (Karma), holograma da Melissa (Corporações), reflexão "Anfitrião do Imperador".
- **Poço dos Milagres**.
- **Torres de Ruptura** (+ Essências e chaves, diálogo do Galo das Torres).
- **Salão das Máscaras** (+ Bandeja via Shuffler, calendário).
- **Corporações**.
- **Cosméticos** (molduras, emblemas, balões, Owner oculto, inventário, painel).
- **Staff e Deadly Vote** (painéis de Owner/Anfitrião/Dealer, aprovações, conclusão com resultado por participante).
- **Virtudes** (tela qualitativa no perfil; dados configuráveis).

## 7. Gênero nos textos (pedido do dono, 16/10)
"Caso alguém escolha 'Feminino', os diálogos devem tratar a pessoa no feminino."

- Toda fala, aviso ou rótulo **dirigido ao jogador** marca a concordância de gênero com `{masculino|feminino}`:
  `cansad{o|a}`, `{ele|ela}`, `{o|a} Record`, `{Bem-vindo|Bem-vinda}`, `{o último|a última}`, `querid{o|a} {nome}`.
  Escreva a primeira forma igual ao texto masculino que já existiria; a segunda é a feminina.
- Resolução: `playerText(texto, { name, gender })` em `lib/devo/player-name.ts` (resolve também `{nome}`);
  em componente, `usePlayerText()` de `components/devo/state/player-text.ts` (lê nome e gênero do perfil).
  `withName(texto, nome, gênero)` continua valendo para as chamadas antigas.
- Regra: `state.profile.gender === 'Feminino'` → segunda forma; "Masculino", "Prefiro não dizer" ou sem
  resposta → primeira forma. No prólogo, antes da pergunta de gênero, vale a primeira forma.
- Só marque o que concorda com o JOGADOR. Não marque o que concorda com outra coisa (o Record como sistema,
  "seu registro", cartas, salas, NPCs, o outro jogador) nem plurais de grupo ("nós dois", "os inscritos").
- Escolhas cujo rótulo é a chave da opção (ex.: `choose()` do prólogo): marque o rótulo, mas resolva só na
  exibição; a comparação continua pelo rótulo cru.
- Galo, Poço, Torres, Salão das Máscaras e Melissa: usem o marcador desde o primeiro texto e passem cada fala
  por `playerText`/`usePlayerText` antes de exibir ou gravar na conversa.

## 8. Pedidos do dono (16/10, manhã)
- **Reiniciar sessão foi removido** (Ajustes, menu do desktop, store e roteiro). Não recriar.
- **Dublagem removida** da cutscene .
- **Continuar** retoma a encenação inicial na fala em que o jogador parou (save.story).
- **"Devolver"** as Cartas Iniciais no prólogo deixa o jogador sem cartas.
- **Feminino**: diálogos concordam com o gênero escolhido (marcador `{o|a}`, ver §7).
- **Xadrez sem bot**: o Living Chess não tem partida contra bot.
- **Chat da Sala de Jogos**: só existe dentro das partidas. Na mesa, as mensagens das salas aparecem como registro, mas não há campo para digitar livremente.
- **Risadinha do Rato removida por enquanto** (o dono vai adicionar o áudio depois). Pasta public/audio/voz e lib/devo/voice*.ts saíram.
- **Salas de troca sem tipos**: todas funcionam igual, com a regra da explicação do Rato no tutorial (mesma raridade, carta do outro oculta até a revelação, chat da sala para negociar, os dois aceitam → revela, troca confirmada não se desfaz). Quem não tem carta não troca.
- **Owners e Anfitriões têm acesso a TODAS as telas**: nenhuma trava de progressão vale para eles (sistemas novos, Sala de Jogos ainda não revelada, apps ainda não vistos, tutoriais). A regra é do servidor (flags) e a interface só reflete.

## 9. Pedidos do dono (16/10, 11:49)
- **Poço: reformulação visual profunda** — especificação literal em `POCO-REFORMULACAO-dono.md` (composição cinematográfica, mecanismo central ornamental, sequência ativação → suspense → revelação → resultado com pular/acelerar, apresentação própria por categoria de recompensa, assets de verdade em vez de primitivas, botões de invocação ornamentais). Recompensas inúteis (tampão de lixo, curativo usado…) não vão ao inventário. Faixa de notificação de prêmios raros na tela do Poço; além das reais, **notificações simuladas periódicas** com nomes fictícios (que não correspondam a contas reais), sem suprimir as reais.
- **Tela inicial (home)**: está "preto no branco" demais — trazer de volta um pouco do roxo/ametista já usado. Revisar o enquadramento dos NPCs.
- **Home do celular em telas deslizáveis** (dono: "no mobile, quero que os outros ícones estejam em outras telas ao
  arrastar o dedo"): tela 1 = relógio/Pulso, apps principais (Record, Pulso, Cartas, Sala de Jogos) e "Agora";
  tela 2 = Sistemas (Torres, Poço, Virtudes, Arcanos, Corporações, Salão das Máscaras), com nomes inteiros. Arrasto
  horizontal com snap nativo (scroll-snap; cada tela rola na vertical; não usa o voltar do shell), indicador de
  telas em losangos e botões "Tela anterior do início"/"Próxima tela do início" (teclado e leitor de tela). Dock
  fixo em todas as telas. Desktop não muda. Roteiro: `openApp` desliza até a tela do ícone antes do clique; a
  região "Sistemas" continua com o mesmo nome (os grupos poco/torres/salao usam `scrollIntoViewIfNeeded`, que
  leva o carrossel até a tela 2).
- **Torres: a mesma regra de design do Poço** (POCO-REFORMULACAO-dono.md vale para as Torres): estão simples demais. Mapa e tela da torre com composição cinematográfica, estruturas ornamentais de verdade (assets elaborados, não primitivas), profundidade, luz, botões próprios, apresentação de recompensas (essência, chave) à altura.
- **Entrada (prólogo), 16/10 11:59:** (1) a Melissa "pisca" (aparece por um instante) antes de ficar oculta no começo — corrigir; (2) aparência: o jogador responde **as duas**, a 2D e a real (pessoa real), não uma ou outra; (3) as chamas da cutscene inicial voltam à **mesma cor de antes** (exceção à paleta); (4) a animação das crianças caindo (a linha vermelha) está desconexa — refazer com uma encenação melhor.
- **Encenação única dos NPCs** (dono, 16/10 18:23: "os npcs aparecem mt distantes dos balões de fala"; "ajuste o rato no
  ícone circular"): `components/devo/kit/npc-anchor.tsx` — `NpcAnchor` ancora o busto no topo da caixa de fala (mede a
  caixa; a base dissolve por trás dela, sem vão, em qualquer altura de tela; altura limitada ao espaço livre), com a
  geometria do sprite (1080×960, cabeça 345, queixo 508, linha de corte da folha, centro próprio do Rato e do Javali);
  `NpcMedallion` = medalhão com janela do rosto por NPC (Rato com a cartola inteira, Javali com os chifres);
  `useFalaAncora` para figuras que não são do elenco (encapuzado do Poço, holograma da Narrativa). Usado no tutorial,
  prólogo, Coruja, Javali, Herdeiro, Galo (Torres e Narrativa), hologramas da Melissa e Mensagens.
