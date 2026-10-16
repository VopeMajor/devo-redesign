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

## 7. Pedidos do dono (16/10, manhã)
- **Reiniciar sessão foi removido** (Ajustes, menu do desktop, store e roteiro). Não recriar.
- **Dublagem removida** da cutscene (fica só a risadinha do Rato).
- **Continuar** retoma a encenação inicial na fala em que o jogador parou (save.story).
- **"Devolver"** as Cartas Iniciais no prólogo deixa o jogador sem cartas.
- **Feminino**: diálogos concordam com o gênero escolhido (marcador `{o|a}`).
- **Xadrez sem bot**: o Living Chess não tem partida contra bot.
- **Chat da Sala de Jogos**: só existe dentro das partidas. Na mesa, as mensagens das salas aparecem como registro, mas não há campo para digitar livremente.
- **Risadinha do Rato removida por enquanto** (o dono vai adicionar o áudio depois). Pasta public/audio/voz e lib/devo/voice*.ts saíram.
- **Salas de troca sem tipos**: todas funcionam igual, com a regra da explicação do Rato no tutorial (mesma raridade, carta do outro oculta até a revelação, chat da sala para negociar, os dois aceitam → revela, troca confirmada não se desfaz). Quem não tem carta não troca.
