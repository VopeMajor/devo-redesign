# DEVO v2 — inventário completo do DEVO atual

Levantamento de 01/11/2026, feito no código da `redesign` (worktree desta sessão): `components/devo/**`, `lib/devo/**`,
`app/api/**`, `docs/redesign/*.md`, `CLAUDE.md` e `scripts/devo-banco-novo.sql`. Serve para que nenhuma função se perca
na versão nova.

**Como ler**

- Coluna **no v2**: `INTERFACE` = fica na interface atual, redesenhada na identidade de hoje (gótico ametista, mármore,
  arte pintada, cobalto do Record; nada de pixel). `CASA` ou `TORRES` = vai para o cenário RPG Maker / visual novel
  (avatar anda, objetos que se tocam, diálogo com retrato grande). `CASA + INTERFACE` = as duas portas levam à mesma
  função (o servidor é o mesmo). `EQUIPE` = painel da Mesa (interface, só equipe).
- **⚠** marca brecha: função sem tela, regra que o servidor não garante, valor provisório ou pendente do dono, ou
  peça que pode se perder na mudança.
- Valores que o dono deixou como `x`/`X` continuam pendentes. Este documento não inventa nenhum.
- NPCs: toda linha com retrato passa pelo redesenho com referência em Persona (silhueta, cor de assinatura, cut-in,
  retrato em pose, cartão de chamada), adaptado à paleta do DEVO. Isso vale para a interface e para a Casa/Torres.

Contagem por área no fim (§16).

---

## 1. Entrada e fluxo inicial

Fases em `components/devo/devo-experience.tsx` (landing → acesso → intro → os).

| função | quem usa | onde está hoje (arquivo) | no v2 | observação |
|---|---|---|---|---|
| Tela de carregamento (cobre até fontes e imagens chegarem) | todos | `components/devo/shared/tela-entrada.tsx` | INTERFACE | Mínimo curto e teto. Na Casa/Torres precisa carregar também o tileset e os retratos. |
| Landing: sigilo 3D, "DEADLY VOTE", relógio 71:59:59, Começar / Continuar, som | todos | `components/devo/landing/landing-screen.tsx`, `landing/entrada-button.tsx`, `system/logo.tsx`, `system/symbol.tsx`, `kit/scene/*` | INTERFACE | Identidade a preservar (MAPA.md). |
| Começar → pede convite; Continuar → login / prólogo / sistema | todos | `components/devo/devo-experience.tsx` | INTERFACE | Regra de navegação, não pode quebrar. |
| Acesso: código de convite de uso único, cadastro (nome, senha, confirmação), login | todos | `components/devo/naming/access-screen.tsx`, `app/api/auth/[...all]/route.ts`, `lib/devo/invites-server.ts` | INTERFACE | ids `#devo-code #devo-user #devo-pass #devo-pass2` usados pelos testes de captura. |
| Sair da conta | todos | `components/devo/menu-button.tsx` | INTERFACE | |
| Cortina de transição ("Despertando", "Reconectando", "Saindo", "Inicializando DEVO") | todos | `devo-experience.tsx`, `intro/journey-curtain.tsx`, `kit/transition.tsx` | INTERFACE | Entrar na Casa/Torres pede uma transição própria (interface → mundo). |
| Prólogo narrado (voz, Melissa, mina, crianças, queda, morte) | jogador novo | `intro/prologue-screen.tsx`, `intro/prologue-stage.tsx`, `intro/theater-fall.tsx`, `intro/cel-fire.tsx`, `lib/devo/prologue-script.ts` | INTERFACE | Melissa ganha retrato novo (Persona). Texto do dono literal. |
| Perguntas do prólogo: nome, idade, gênero, rosto (2D/3D), rosto real | jogador novo | `lib/devo/prologue-script.ts` (`kind:'input'`), `state/devo-store.tsx` (`SET_PROFILE`) | INTERFACE | O "rosto" de hoje é a segunda aparência; o avatar do v2 (SPEC-AVATAR) é outra coisa. Decidir se convivem. ⚠ |
| Cartas Iniciais: ficar ou devolver à Melissa | jogador novo | `devo-store.tsx` (`KEEP_STARTER_CARDS`, `RETURN_STARTER_CARDS`, `devolveuCartas`) | INTERFACE | Devolver abre a cena da figura ??? depois do primeiro DV. |
| Tutorial do Deadly Vote (Herdeiro e Rato, diagramas) | jogador novo | `intro/intro-screen.tsx`, `intro/tutorial-visuals.tsx`, `intro/vn.tsx`, `lib/devo/intro-script.ts` | INTERFACE | Herdeiro (8 falas) e Rato (10 falas) ganham retratos novos. |
| Pular prólogo / pular tutorial; avançar por toque, Enter, Espaço | todos | `intro/vn.tsx`, `intro/prologue-screen.tsx` | INTERFACE + CASA + TORRES | O mesmo controle vale para o diálogo VN da Casa/Torres. Owner/Anfitrião sempre podem pular (`acesso.pularTutoriais`). |
| Gênero nos textos (`{nome}`, `{o|a}`) | todos | `lib/devo/player-name.ts`, `state/player-text.ts` | INTERFACE + CASA + TORRES | Toda fala nova precisa do marcador. |
| Oferta de instalar o app (PWA) | todos | `shared/pwa-offer.tsx`, `lib/devo/pwa.ts` | INTERFACE | |
| Botão voltar do Android fecha a camada do topo | todos | `components/devo/use-back-handler.tsx`, `os/app-back.tsx` | INTERFACE + CASA + TORRES | Na Casa: voltar fecha menu/diálogo antes de sair do mapa. ⚠ não esquecer. |
| Tela cheia | todos | `lib/devo/fullscreen.ts` | INTERFACE + CASA + TORRES | iPhone Safari não suporta; layout 100dvh é o reserva. |
| Vitrine de estilo `/estilo` (fora de produção) | equipe técnica | `app/estilo/page.tsx`, `app/estilo/cosmeticos/page.tsx`, `app/estilo/perfil/page.tsx` | INTERFACE | Só com `DEVO_STYLEGUIDE=1`. Útil para o kit v2. |

## 2. Sistema (o celular e a área de trabalho)

| função | quem usa | onde está hoje (arquivo) | no v2 | observação |
|---|---|---|---|---|
| Celular abaixo de 1024 px; área de trabalho com janelas acima | todos | `os/devo-os.tsx`, `os/phone-shell.tsx`, `os/desktop-shell.tsx` | INTERFACE | Primeiro celular 390×844. |
| Barra de status com o relógio do pulso (um relógio só) | todos | `os/phone-shell.tsx`, `kit/time.tsx`, `lib/devo/pulse.ts` | INTERFACE + CASA + TORRES | O Tempo no pulso precisa aparecer também dentro da Casa/Torres (HUD). |
| Quadro de anúncios na home (Owner + eventos do Calendário dos próximos 14 dias) | todos | `os/anuncios-card.tsx`, `lib/devo/anuncios.ts`, `lib/devo/anuncios-server.ts`, `app/api/anuncios/route.ts` | INTERFACE | |
| Grade de apps e sistemas, selo "novo", ícone trancado com motivo | todos | `os/apps.tsx`, `os/app-icon.tsx`, `os/app-glyphs.tsx`, `progressao/sistemas.tsx`, `kit/interior/locked.tsx` | INTERFACE | A Casa e as Torres continuam com ícone no celular (porta de entrada para o mundo). |
| Barra inferior / dock | todos | `kit/interior/bottom-nav.tsx`, `os/os-nav.tsx` | INTERFACE | |
| Toasts (fila, toque abre o app de origem, barra de tempo) | todos | `os/notifications.tsx`, `kit/toast.tsx`, `devo-store.tsx` (`NOTIFY`, `DISMISS_TOAST`) | INTERFACE + CASA + TORRES | Dentro da Casa o toast não pode cobrir a caixa de diálogo. ⚠ |
| Central de avisos, contador de não lidos por app | todos | `os/notifications.tsx`, `devo-store.tsx` (`unread`, `READ_APP`, `CLEAR_NOTIFICATIONS`) | INTERFACE | |
| Avisos de boas-vindas espaçados | jogador novo | `os/use-devo-engine.ts` | INTERFACE | |
| Revelação da Sala de Jogos (após abrir todos os apps iniciais) | jogador | `arcade/arcade-unlock.tsx`, `devo-store.tsx` (`UNLOCK_ARCADE`, `ARCADE_REVEAL_DONE`) | INTERFACE | |
| Cerimônia de desbloqueio dos sistemas novos | jogador | `progressao/cerimonia.tsx`, `progressao/narrativa-host.tsx` (`CELEBRATE_UNLOCKS`) | INTERFACE | Quando a Casa abre, a cerimônia leva ao tutorial do avatar (SPEC-AVATAR). |
| Som do jogo (efeitos sintetizados) e trilha (YouTube), troca/desliga após a 1ª sessão | todos | `lib/devo/audio.ts`, `shared/sound-toggle.tsx` | INTERFACE + CASA + TORRES | Casa/Torres pedem trilha e efeitos próprios (passos, porta, campainha do visitante). |
| Save do cliente (reducer) e `/api/save` | todos | `state/devo-store.tsx`, `lib/devo/save.ts`, `app/api/save/route.ts` | INTERFACE | ⚠ O save carrega Tempo e cartas decididos no navegador (ver §15, brechas 1 e 2). Posição do avatar na Casa não deve morar aqui. |
| Acesso efetivo (`/api/eu` → `acesso`), hook único | todos | `state/use-acesso.ts`, `progressao/use-acesso.tsx`, `lib/devo/progresso-server.ts` | INTERFACE | Owner e Anfitrião: tudo liberado, sempre. Vale para a Casa e as Torres. |

## 3. Record e Deadly Vote (lado do jogador)

| função | quem usa | onde está hoje (arquivo) | no v2 | observação |
|---|---|---|---|---|
| Record File: foto, ID, status (Estável/Crítico/Eliminado), Arcano, Tempo, cartas/trocas/avisos | todos | `apps/record-app.tsx`, `system/record-file.tsx`, `system/record-ui.tsx`, `system/primitives.tsx` | INTERFACE | Coração da identidade (cobalto, papel). |
| Foto do perfil com recorte quadrado, `/api/record/avatar` | todos | `system/photo-picker.tsx`, `app/api/record/avatar/route.ts`, `app/api/record/route.ts` (`avatar`) | INTERFACE | Convive com o avatar anime do v2: foto = Record; avatar = Casa (SPEC-AVATAR §3.4). |
| Identidade (miniperfil + nome + emblema) e entrada da Coleção | todos | `cosmeticos/identidade-panel.tsx` | INTERFACE | |
| Atalhos para Virtudes e Arcanos no Record | todos | `apps/record-app.tsx` | INTERFACE | |
| Aba Deadly Votes: convocações, inscrever-se, sair | jogador | `system/use-deadly-votes.ts`, `app/api/record/route.ts` (`join`, `leave`) | INTERFACE | ⚠ `joinVote` não olha o tipo tutorial: veterano repete Tutorial; novato vê qualquer Devo (pedido do dono: novato só vê "tutorial"; SPEC-TUTORIAL-E-EQUIPE). |
| Peso máximo de cartas: escolher o que levar ao DV | jogador | `apps/dv-cartas.tsx`, `app/api/record/route.ts` (`cartas`) | INTERFACE | ⚠ Cartas antigas sem peso usam `PESO_PADRAO` por raridade (pendência 3 do CLAUDE.md). |
| Histórico público de Deadly Votes | todos | `system/deadly-vote-history.tsx` | INTERFACE | |
| Aba Diário (cápsulas do tempo do Poço) | jogador com flag `diario` | `poco/diario-panel.tsx` | INTERFACE | Pode ganhar um objeto "diário" na Casa como atalho (proposta). |
| Aba Convites (Jogador gera 1, não renova) | jogador | `system/invite-panel.tsx`, `app/api/invites/route.ts` | INTERFACE | |
| Card Shuffler (Dormente até a Sala de Jogos) | jogador | `lib/devo/shuffler.ts`, `shared/deck-panel.tsx` | CASA | Dono: "o card shuffler passa a ser outro objeto, agora que existe a questão do rito e tudo mais..". ⚠ O que ele faz no v2 não foi definido. |
| Ritos de Invocação nas cartas (Gestos, Cânticos, complexidade, Taças) | jogador | — (não existe) | INTERFACE (Cartas) + CASA (objeto do rito) | Texto do dono em PEDIDO-V2. ⚠ a construir. |
| Recuo Paranormal e redução por Paus | jogador, Dealer | — (não existe) | INTERFACE | ⚠ Lendária = `X`; reduções "um nível acima" e "dois níveis acima" = `x%`. Pendentes do dono. |

## 4. Apps de base

| função | quem usa | onde está hoje (arquivo) | no v2 | observação |
|---|---|---|---|---|
| Pulso: anel de 72 h, Estável/Crítico, barras, regras do pulso | todos | `apps/pulso-app.tsx`, `os/pulse-dial.tsx`, `lib/devo/pulse.ts` | INTERFACE | |
| Mensagens: conversas com NPCs, escolhas, figurinhas | todos | `apps/mensagens-app.tsx`, `lib/devo/npcs.ts` (`NPCS`, `THREAD_*`) | INTERFACE | Cada NPC ganha "cartão de chamada" e cores de assinatura (Persona). |
| Mensagens: área "Jogadores" | todos | `apps/mensagens-app.tsx` | INTERFACE | ⚠ Bloqueada; não existe conversa entre jogadores. |
| Cartas: inventário, filtro por raridade, frente/verso, coleções | todos | `apps/cartas-app.tsx`, `shared/devo-card.tsx`, `shared/carta-tarot.tsx`, `lib/devo/cards.ts`, `lib/devo/cartas-arte.ts` | INTERFACE | Precisa receber Natureza, Arquétipo, Peso, Gestos, Cântico com marca-texto por raridade. |
| Aula da Coruja sobre as cartas (raridades secretas: única, promocional) | jogador | `apps/coruja-intro.tsx`, `apps/coruja-sprite.tsx`, `devo-store.tsx` (`OWL_MET`) | INTERFACE | Coruja redesenhada. |
| Inventário (cartas + itens num lugar só) | todos | `apps/inventario-app.tsx`, `/api/eu?parte=inventario`, `lib/devo/inventario-server.ts` | INTERFACE + CASA | Na Casa, um baú/estante pode abrir o mesmo inventário (proposta). |
| Sala de Trocas: 8 salas, mesma raridade, às cegas, chat, aceitar → revelar | jogador | `apps/trocas-app.tsx`, `lib/devo/trade-rooms.ts`, `lib/devo/trade-bots.ts`, `os/use-devo-engine.ts`, `app/api/trocas/route.ts` | INTERFACE | ⚠ O parceiro é um bot gerado no navegador (`makePartner`); a troca não passa pelo servidor. Cartas presas no Salão são bloqueadas pela `/api/trocas`. |
| Ajustes: som, PWA e push, limpar avisos, tela inicial, reiniciar sessão | todos | `apps/ajustes-app.tsx`, `shared/pwa-panel.tsx`, `shared/sound-toggle.tsx` | INTERFACE | ⚠ Reiniciar sessão sem limite (BUGS.md §4, decisão pendente). |
| Segunda aparência (2D/3D ou Real) e troca | jogador | `lib/devo/appearances.ts`, `devo-store.tsx` (`changeAppearance`, `CHANGE_APPEARANCE`) | INTERFACE | ⚠ A troca existe no store mas nenhuma tela chama `changeAppearance`. |
| Nome do personagem | jogador | `lib/devo/character-server.ts`, `devo-store.tsx` (`SET_CHARACTER`) | INTERFACE + CASA | |

## 5. Sala de Jogos e minigames

| função | quem usa | onde está hoje (arquivo) | no v2 | observação |
|---|---|---|---|---|
| Apresentação do Javali (uma vez) | jogador | `arcade/javali-intro.tsx`, `devo-store.tsx` (`JAVALI_MET`) | INTERFACE | Javali redesenhado. |
| Abas Mesa / Agenda / Ranking / Apostas | todos | `apps/jogos-app.tsx`, `arcade/sala-tabs.tsx`, `arcade/mesa.tsx` | INTERFACE | |
| Status: Tempo, score, posição, reset semanal | todos | `apps/jogos-app.tsx`, `kit/plaque.tsx` | INTERFACE | |
| Fila online "Procurando oponente", duelo, partida ao vivo | jogador | `arcade/mesa.tsx`, `arcade/live-match.tsx`, `arcade/use-room.ts`, `lib/devo/arcade/client.ts` (`queue`, `duel`, `room`, `leave`) | INTERFACE | |
| Tutorial contra bot / demonstração guiada | jogador | `lib/devo/arcade/client.ts` (`tutorial`) | INTERFACE | |
| Chat dentro da partida e reações; registro somente-leitura | jogador | `arcade/arcade-chat.tsx`, `lib/devo/arcade/reactions.ts` | INTERFACE | |
| Apostas em Tempo (5 min a 4 h, margem mínima) | jogador | `arcade/bet-sheet.tsx`, `arcade/arcade-shared.ts`, `lib/devo/arcade/server.ts` (`bet`) | INTERFACE | |
| Prêmio semanal do ranking (`claim`) | jogador | `arcade/mesa.tsx`, `lib/devo/arcade/server.ts` | INTERFACE | |
| Miniperfil do adversário | jogador | `arcade/mini-profile.tsx` | INTERFACE | Owner nunca aparece como Owner (`publicCargo`). |
| Configuração do xadrez (tema, peças) | jogador | `arcade/games/quick-chess.tsx` (`settings`), `lib/devo/arcade/chess-themes.ts` | INTERFACE | |
| Memory Rush | jogador | `arcade/games/memory-rush.tsx` | INTERFACE | |
| Living Chess (3D, sem bot) | jogador | `arcade/games/quick-chess.tsx`, `arcade/chess/*` | INTERFACE | |
| Bomba Quente (3D, joystick) | jogador | `arcade/games/hot-bomb.tsx` | INTERFACE | |
| Blefe | jogador | `arcade/games/bluff.tsx`, `lib/devo/arcade/bluff.ts` | INTERFACE | |
| Fim de partida e pontos (`finish`), teto e tempo mínimo | jogador | `apps/jogos-app.tsx`, `lib/devo/arcade/games.ts` | INTERFACE | ⚠ Vitória casual vale +3 min sem teto diário: duas contas podem alternar derrotas. |
| Agenda de eventos (`arcade_schedule` → `arcade_events`) | equipe | `lib/devo/arcade/server.ts` | EQUIPE | ⚠ Sem tela na Mesa: a agenda só muda por SQL. |

## 6. Sistemas novos (DIRECAO-3)

Flags em `lib/devo/progresso.ts`: `salao_mascaras`, `poco`, `torres`, `diario`, `corporacoes`, `virtudes`, `galo_casa`,
`calendario` (livre para todos). Registro em `components/devo/progressao/sistemas.tsx`.

### 6.1 Grandioso Calendário Devo

| função | quem usa | onde está hoje (arquivo) | no v2 | observação |
|---|---|---|---|---|
| Apresentação pela Melissa (holograma) na 1ª entrada | jogador | `lib/devo/dialogo/cenas/melissa-calendario.ts`, `dialogo/holograma.tsx` | INTERFACE | |
| Check-in diário com recompensa (P.P., item, carta, Tempo, diário) | todos | `calendario/calendario-app.tsx`, `calendario/dados.ts`, `lib/devo/calendario-server.ts` (`checkin`) | INTERFACE | |
| Eventos (inclusive anuais) e ícones pintados | todos | `lib/devo/calendario.ts`, `calendario/icones.tsx` | INTERFACE | Eventos podem trazer Visitantes à Casa no v2 (proposta). |
| Mesa › Calendário: eventos e regras | Owner, Anfitrião (editar); Owner (recompensas) | `calendario/calendario-mesa.tsx` (`evento.salvar`, `evento.remover`, `regras`) | EQUIPE | |

### 6.2 Salão das Máscaras

| função | quem usa | onde está hoje (arquivo) | no v2 | observação |
|---|---|---|---|---|
| Apresentação do Herdeiro (uma vez) | jogador | `salao/salao-herdeiro.tsx`, `lib/devo/salao-herdeiro.ts` | INTERFACE | |
| Palco e contador até a próxima abertura / fim da edição | todos | `salao/salao-cena.tsx`, `salao/salao-contador.tsx` | INTERFACE | |
| Leilões (lance) | jogador | `salao/salao-abas.tsx` (`lance`) | INTERFACE | ⚠ Lance superado não avisa fora do app (sem push). |
| Mercado (vender, comprar, retirar) | jogador | `salao/salao-abas.tsx`, `salao/salao-enviar.tsx` | INTERFACE | |
| Anúncios (criar, retirar; recrutamento das Corporações) | jogador | `salao/salao-abas.tsx` | INTERFACE | |
| Bandeja: enviar carta ao especialista, retirar | jogador | `salao/salao-enviar.tsx`, `salao/salao-abas.tsx` | INTERFACE | |
| Avisos do Salão (lido) | jogador | `salao/salao-app.tsx` (`aviso.lido`) | INTERFACE | |
| Avaliação de lotes e anúncios (especialista) | toda a equipe (`salao.avaliar`) | `salao/salao-mesa.tsx` (`avaliacao.lote`, `avaliacao.anuncio`) | EQUIPE | ⚠ Dono pediu autorizar direto da tela do Salão (Anfitrião para cima) e "abrir agora no padrão de três dias". Hoje só pela Mesa. |
| Calendário do Salão e contrato (taxas) | Owner | `salao/salao-calendario.tsx` (`evento.*`, `config.definir`), `app/api/salao/route.ts` (`contrato.definir`) | EQUIPE | ⚠ Mudar a âncora move lotes aprovados de edição; "forçar aberto" não tem prazo. |

### 6.3 Poço dos Milagres

| função | quem usa | onde está hoje (arquivo) | no v2 | observação |
|---|---|---|---|---|
| Apresentação: a neblina e a figura encapuzada | jogador | `poco/poco-neblina.tsx`, `lib/devo/poco-neblina.ts` | INTERFACE | ⚠ A figura não tem sprite (silhueta). Entra no redesenho de NPCs. |
| Cena pintada em camadas | todos | `poco/poco-cena.tsx`, `poco/poco-pintura.ts`, `poco/poco-ornamentos.tsx` | INTERFACE | |
| Lançar moeda (uma ou várias) por Dracma | jogador | `poco/poco-app.tsx` (`moeda.lancar`, `moeda.varias`) | INTERFACE | |
| Manivela (minigame de timing) | jogador | `poco/poco-manivela.tsx` (`manivela.iniciar`, `manivela.girar`) | INTERFACE | |
| Balde: inspecionar e escolher | jogador | `app/api/poco/route.ts` (`balde.*`) | INTERFACE | |
| Revelação por raridade (falsa partida no raro+) | jogador | `poco/poco-resultado.tsx`, `poco/poco-itens.tsx` | INTERFACE | |
| Presentes para Visitantes e decorações à venda | jogador | — | INTERFACE | Dono: presentes "no Poço dos Milagres ou durante eventos". ⚠ a construir. |
| Mesa › Poço: seções, pesos, prêmios, item por seção, arte | Owner | `poco/poco-mesa.tsx` | EQUIPE | Probabilidades provisórias. |

### 6.4 Torres de Ruptura

| função | quem usa | onde está hoje (arquivo) | no v2 | observação |
|---|---|---|---|---|
| Apresentação do Galo (uma vez) | jogador | `torres/torres-app.tsx` (`galo.visto`, `galo.fa`), `lib/devo/torres/galo.ts` | TORRES | Vira cena VN com retrato grande do Galo. |
| Reflexão "Anfitrião do quê?" ao sair pela 1ª vez | jogador | `lib/devo/dialogo/cenas/reflexao-anfitriao.ts`, `torres/gatilho.tsx` (`reflexao`) | TORRES | |
| Mapa: torre principal + secundárias, pedestais | jogador | `torres/mapa.tsx`, `torres/mapa-cena.tsx`, `torres/estruturas.tsx`, `torres/ilustrada.tsx`, `lib/devo/torres/conteudo.json` (`cenario.pedestais`) | TORRES | Vira mapa onde o avatar anda até a porta de cada torre. |
| Tela da torre: escada, andares, custo em Essências que dobra | jogador | `torres/torre.tsx`, `lib/devo/torres-server.ts` (`subir`) | TORRES | |
| Chaves das torres secundárias (Imperador, Observatório, Picadeiro) | jogador | `lib/devo/torres-server.ts`, item `chave:*` | TORRES | |
| Cenas dos andares (fala, narra, escolha) | jogador | `torres/cena.tsx`, `lib/devo/torres/tipos.ts` | TORRES | Motor local; ⚠ deveria usar o motor de diálogo único (`lib/devo/dialogo`). |
| Revelação do prêmio do andar | jogador | `torres/revelacao.tsx` | TORRES | |
| Torres de companhia (afetadas por Caos e Ordem) | jogador | — | TORRES | SPEC-ORDEM §4.4. ⚠ "em construção" pelo dono. |
| Conteúdo das torres editável (`torres.conteudo`) | Owner | `lib/devo/torres/conteudo.ts`, `/api/staff` (`config.definir`) | EQUIPE | ⚠ Sem tela: só gravando JSON em `devo_config`. |

### 6.5 Corporações (Companhias)

| função | quem usa | onde está hoje (arquivo) | no v2 | observação |
|---|---|---|---|---|
| Holograma da Melissa (apresentação) | jogador | `lib/devo/dialogo/cenas/melissa-corporacoes.ts`, `corporacoes/holograma.tsx`, `lib/devo/corporacoes-melissa.ts` | INTERFACE | |
| Entrar por código, pedido, cancelar pedido | jogador | `corporacoes/sem-corp.tsx` (`entrar`, `pedido.cancelar`) | INTERFACE | |
| Convites recebidos (responder) | jogador | `corporacoes/sem-corp.tsx` (`convite.responder`) | INTERFACE | |
| Fundar (Tempo + aprovação), cancelar fundação | jogador | `corporacoes/fundar.tsx`, `sem-corp.tsx` | INTERFACE | |
| Brasão (forma + cor + inicial), lema | líder | `corporacoes/brasao.tsx`, `minha-corp.tsx` | INTERFACE | |
| Membros e cargos, remover, passar liderança, sair | líder, vice, membro | `corporacoes/minha-corp.tsx` | INTERFACE | |
| Decidir pedidos, enviar convites, publicar recrutamento | líder, vice | `corporacoes/minha-corp.tsx` | INTERFACE | ⚠ `convite.cancelar` existe na API, sem botão. |
| Transferir carta a outro membro | membro | `corporacoes/minha-corp.tsx` (`carta.transferir`) | INTERFACE | Base para a doação de horas (SPEC-ORDEM). |
| Mesa › Corporações: aprovar fundação, classificar (oficial/Necro), escopo | Owner, Anfitrião | `corporacoes/corporacoes-mesa.tsx` | EQUIPE | ⚠ `mesa.rivalidade` existe na API, sem tela. |

### 6.6 Virtudes

| função | quem usa | onde está hoje (arquivo) | no v2 | observação |
|---|---|---|---|---|
| Seis naipes (Paus, Copas, Ouros, Espadas, Taças, Escudos) em palavras, sem números | jogador | `virtudes/virtudes-app.tsx`, `virtudes/naipes.tsx`, `lib/devo/virtudes.ts` | INTERFACE | Taças e Paus ganham papel nos Ritos e no Recuo. |
| Faixas de Estágio acumulado | jogador | `virtudes/virtudes-app.tsx` | INTERFACE | |
| Mesa › Virtudes: P.P., afinidades, estágios, evoluir, Arcano, texto do Arcano | Owner, Anfitrião (ver/evoluir); Owner (ajustar) | `virtudes/virtudes-mesa.tsx` | EQUIPE | |

### 6.7 Arcanos

| função | quem usa | onde está hoje (arquivo) | no v2 | observação |
|---|---|---|---|---|
| Mapa orbital, galeria, altar dos 22 | jogador | `arcanos/arcanos-app.tsx`, `arcanos/mapa.tsx`, `arcanos/galeria.tsx`, `arcanos/altar.tsx`, `lib/devo/arcanos-arte.ts` | INTERFACE | |
| Evoluir Estágio 0..VII com Fragmentos; despertar outro com Grande Fragmento | jogador | `arcanos/evolucao.tsx` (`arcano.evoluir`, `arcano.despertar`) | INTERFACE | |
| Escolher Arcano entre três opções (prêmio "Arcano") | jogador, Anfitrião aprova | `arcanos/evolucao.tsx` (`arcano.escolher`), `lib/devo/recompensas-server.ts` (`arcano_escolhas`) | INTERFACE | Pendência 1 do CLAUDE.md; o caminho existe pela recompensa. Conferir se o narrador já indica as três pela Mesa. |
| Textos dos Arcanos | todos | `lib/devo/arcanos-textos.ts` | INTERFACE | ⚠ Força sem Estágio IV; VII "Tirano" só com nome. Demais textos são rascunho. |

### 6.8 Casa (hoje: Confecção de Cartas e Pacotes)

| função | quem usa | onde está hoje (arquivo) | no v2 | observação |
|---|---|---|---|---|
| Visita do Galo à casa (Karma, linha do destino) | jogador | `lib/devo/dialogo/cenas/galo-casa.ts`, `dialogo/casa-noite.tsx` | CASA | Vira a primeira cena VN dentro do mapa da casa. |
| Arte pintada da casa | jogador | `lib/devo/casa-arte.ts`, `public/images/casa/*` | CASA | Base de referência de clima; o cenário onde se anda é novo. |
| Confecção: iniciar, esperar, espaços de mesa | jogador | `casa/casa-app.tsx` (`confeccao.iniciar`), `lib/devo/confeccao.ts`, `lib/devo/casa-server.ts` | CASA | Vira objeto "mesa de confecção". ⚠ Custos, esperas e espaços PROVISÓRIOS. |
| Aprimorar mesa | jogador | `casa/casa-app.tsx` (`mesa.aprimorar`) | CASA | |
| Abrir pacotes (rasgar a tira) | jogador | `casa/casa-app.tsx` (`pacote.abrir`), `casa/pacote-visual.tsx`, `lib/devo/pacotes.ts` | CASA + INTERFACE | Pode abrir também pelo Inventário. |
| Livro de Receitas (descobertas) e Histórico | jogador | `casa/casa-app.tsx` | CASA | Objeto "livro" na estante. |
| Mesa › Casa: regras e receitas | Owner | `casa/casa-mesa.tsx` (`regras.salvar`, `receitas.salvar`) | EQUIPE | |
| Criação do avatar (tutorial de "fantasia") | jogador | — | CASA | SPEC-AVATAR. ⚠ a construir; quantidade de opções e preço pendentes. |
| Avatar anda, objetos tocáveis, cômodos, níveis e skins da casa | jogador | — | CASA | SPEC-CASA. ⚠ "ainda estamos discutindo"; deixar estruturado. |
| Visitantes, afinidade, presentes, hostilidade, esconderijo | jogador | — (só itens `essencia:*`) | CASA | Texto do dono em PEDIDO-V2. ⚠ a construir. |
| Decorações (loja; aumentam/diminuem chance de cada NPC) | jogador | — | CASA | ⚠ a construir. |
| Quartos de hóspedes (morador) | jogador | — | CASA | ⚠ a construir; quem aceita é decisão do dono. |
| Vínculos: segunda tela dos NPCs conhecidos, "paixão", barra de romance | jogador | — | INTERFACE (Confidentes) + CASA (cenas) | Referência Persona (Confidentes). ⚠ a construir. |

### 6.9 Cosméticos

| função | quem usa | onde está hoje (arquivo) | no v2 | observação |
|---|---|---|---|---|
| Coleção e equipar (moldura de avatar, moldura de miniperfil, emblema, balão, estilo do nome, borda) | todos | `cosmeticos/colecao.tsx`, `cosmeticos/use-cosmeticos.ts`, `lib/devo/cosmeticos.ts`, `cosmeticos/art/*` | INTERFACE | Avaliar cosméticos do avatar/casa (skins) no v2. |
| Retrato de ranking com moldura | todos | `cosmeticos/rank-retrato.tsx`, `cosmeticos/estilo-nome.tsx` | INTERFACE | |
| Mesa › Cosméticos: catálogo, arte, conceder, revogar | Owner | `cosmeticos/admin-cosmeticos.tsx` | EQUIPE | |
| Prêmios semanais (planos; autorização pontual) | Owner; Dealer/Anfitrião autorizados | `cosmeticos/semanais.tsx` | EQUIPE | ⚠ `plano.editar` existe na API, sem tela. |

## 7. Equipe: a Mesa (Dealer, Anfitrião, Owner)

Seções por cargo em `components/devo/system/staff-desk.tsx`:
Dealer = casos, recompensas, semanais, salão. Anfitrião = + virtudes, corporações, calendário, equipe, jogadores,
convites. Owner = + cosméticos, poço, casa, anúncios, registro, ajustes. Tudo fica na interface (EQUIPE).

| função | quem usa | onde está hoje (arquivo) | no v2 | observação |
|---|---|---|---|---|
| Painel de contadores (casos abertos, inscrições em análise, resultados a aplicar, recompensas) | equipe | `system/staff-desk.tsx` | EQUIPE | |
| Criar Deadly Vote (título, arco, briefing, data, vagas, grupo do WhatsApp, local, admissão, peso máximo) | toda a equipe | `system/dealer-board.tsx` (`create`) | EQUIPE | |
| Criar Deadly Vote tutorial | Owner, Anfitrião | `lib/devo/record-server.ts` (`is_tutorial`) | EQUIPE | Dono quer o "tipo tutorial" para qualquer criador (SPEC-TUTORIAL-E-EQUIPE P1). |
| Editar DV, mudar status, link do grupo | criador; Anfitrião do criador; Owner | `system/dealer-board.tsx` (`edit`, `status`, `group`) | EQUIPE | ⚠ Mudança de status e aceite de inscrição não gravam `admin_log`. |
| Admissão: aceitar/recusar inscrições | idem | `system/dealer-board.tsx` (`admission`, `decision`) | EQUIPE | |
| Prêmios de entrada | idem | `system/dealer-board.tsx` (`entryPrizes`) | EQUIPE | |
| Aplicar resultado (sobreviveu/eliminado), desbloqueio automático no tutorial | idem | `system/dealer-board.tsx` (`apply`), `lib/devo/record-server.ts` | EQUIPE | ⚠ Resultado aplicado não tem desfazer. |
| Recompensas: propor, aprovar, rejeitar, cancelar, entregar | Dealer propõe; Anfitrião/Owner aprovam | `system/staff-rewards.tsx`, `lib/devo/recompensas-server.ts` | EQUIPE | ⚠ Entregue não volta (pedido do dono: Owner desfazer). ⚠ `recompensa.editar` sem tela. |
| Equipe: Anfitriões e seus Dealers, transferir Dealer, mudar cargo | Owner; Anfitrião vê os seus | `system/staff-team.tsx` (`cargo.definir`, `dealer.transferir`) | EQUIPE | Convite de owner pelo app é bloqueado de propósito (CLAUDE.md). |
| Jogadores: busca, dados resumidos/completos | Anfitrião (resumo); Owner (completo) | `system/staff-team.tsx` (PlayersPanel) | EQUIPE | |
| Conceder/retirar item, override de desbloqueio | Owner | `system/staff-team.tsx` (`item.conceder`, `item.retirar`, `desbloqueio.definir`) | EQUIPE | |
| Ajustar Karma | Owner | `app/api/staff/route.ts` (`karma.ajustar`) | EQUIPE | ⚠ Sem tela (só aparece no registro). Vira peça central com Caos e Ordem. |
| Editar catálogo de itens (`item_defs`) | Owner | `app/api/staff/route.ts` (`catalogo.definir`) | EQUIPE | ⚠ Sem tela. Presentes e decorações do v2 vão precisar. |
| Autorizações pontuais (conceder/revogar) | Owner | `cosmeticos/semanais.tsx` | EQUIPE | |
| Convites (gerar por cargo, revogar; contas de teste) | Anfitrião, Owner | `system/invite-panel.tsx`, `lib/devo/invites-server.ts` | EQUIPE | |
| Registro (admin_log com filtro) | Owner | `system/staff-team.tsx` (AdminLogPanel) | EQUIPE | ⚠ Nem toda ação grava. |
| Ajustes (devo_config) | Owner | `system/staff-team.tsx` (ConfigPanel) | EQUIPE | |
| Supervisão (`view=supervisao`) | equipe | `app/api/staff/route.ts` | EQUIPE | ⚠ Visão sem tela própria. |
| Anúncios da home | Owner | `system/anuncios-mesa.tsx` | EQUIPE | |
| Alerta do gerente | equipe | `system/manager-alert.tsx` | EQUIPE | |
| Pré-visualizar "como o jogador vê" (novato/veterano) | equipe | — | EQUIPE | ⚠ Sugestão da SPEC-TUTORIAL-E-EQUIPE §7.14b. |
| Mesa para Visitantes, decorações, Caos e Ordem, doações | Owner | — | EQUIPE | ⚠ a construir junto com os sistemas novos. |

## 8. Itens e moedas

Inventário genérico: `item_defs`, `player_items`, `item_ledger` (`lib/devo/inventario-server.ts`). Tipos em
`lib/devo/progresso.ts`. O Tempo não é item: vive no save (`timerEndsAt`).

| função | quem usa | onde está hoje (arquivo) | no v2 | observação |
|---|---|---|---|---|
| Tempo (o pulso, 72 h) | todos | `lib/devo/pulse.ts`, save | INTERFACE + CASA + TORRES | ⚠ Decidido no navegador. Doação de horas (SPEC-ORDEM) exige que o servidor seja dono do Tempo. |
| Dracma Comum / Incomum / Rara | jogador | `item_defs` `dracma_*` | INTERFACE | ⚠ `dracma_rara` provisória (o texto só cita Comum e Incomum). |
| Essências de Afinidade: Galo, Coruja, Javali, Corvo | jogador | `item_defs` `essencia:*`, `lib/devo/essencias-arte.ts` | TORRES + CASA | Pagam andares; no v2 são a moeda da afinidade com Visitantes. ⚠ Melissa, Herdeiro e Rato não têm essência. |
| Essência da Ruptura | jogador | `essencia:campanha` | TORRES | ⚠ Marcada "provisória". |
| Chaves: Imperador, Observatório, Picadeiro | jogador | `chave:*` | TORRES | Visitantes podem dar chaves (dono). |
| Fragmento de Arcano / Grande Fragmento Arcano | jogador | `fragmento_arcano`, `grande_fragmento_arcano` | INTERFACE | |
| Cápsulas do tempo (Diário) | jogador | kind `capsula`, `item_defs.meta.texto` | INTERFACE | |
| Pacotes: Iniciante, Intermediário, Presente, Xadrez | jogador | `pacote:*`, `lib/devo/pacotes.ts` | CASA + INTERFACE | |
| Molde de Xadrez (item estético) | jogador | `estetico:molde_xadrez` | CASA | ⚠ Sem visual. |
| Baldes (madeira, cobre, ferro, prata) | jogador | `balde:*` | INTERFACE | |
| Código de convite | jogador | `convite` | INTERFACE | |
| Cosméticos (≈75 peças em 6 categorias) | todos | `cosmetico:*` | INTERFACE | |
| P.P. (Pontos de Potencial) | jogador | `virtude_pp`, `virtude_pp_log` | INTERFACE | |
| Karma (linha do destino, sem número) | jogador | `karma_log`, `lib/devo/progresso.ts` (`destinoDoKarma`), `dialogo/linha-destino.tsx` | INTERFACE + CASA | ⚠ Faixas provisórias. Caos e Ordem (honra/necro) pode reaproveitar ou substituir: decidir (SPEC-ORDEM §2.2). |
| Cartas (raridades comum → lendária + única, promocional) | todos | `lib/devo/types.ts`, `lib/devo/cards.ts`, save | INTERFACE | ⚠ Inventário de cartas vem do navegador. |
| Presentes, decorações, pontos honra/necro | jogador | — | CASA | ⚠ a construir. |

## 9. NPCs

Elenco em `lib/devo/npcs.ts` (`ELENCO`, 12 expressões cada), sprites em `public/images/npc/<id>/`, rostos em
`lib/devo/npc-rostos.json` (rodar `scripts/dev/rostos-npcs.py` a cada troca). Todos vão para o redesenho Persona.

| função | quem usa | onde está hoje (arquivo) | no v2 | observação |
|---|---|---|---|---|
| Melissa (Companhia de Despertados) | todos | prólogo, holograma das Corporações e do Calendário | INTERFACE + CASA | Visitante possível. Cor de assinatura a definir dentro da paleta. |
| O Galo (Anfitrião do Arcano do Imperador) | jogador | Torres (apresentação), Casa (`galo-casa`) | TORRES + CASA | |
| O Herdeiro (Herdeiro Absoluto) | jogador | tutorial, Salão, Mensagens | INTERFACE + CASA | |
| Javali (Anfitrião da Sala de Jogos) | jogador | Sala de Jogos | INTERFACE + CASA | |
| O Rato (Anfitrião) | jogador | tutorial, Mensagens, Sala de Trocas | INTERFACE + CASA | |
| Coruja (Guardiã das Cartas) | jogador | aula das cartas, Mensagens | INTERFACE + CASA | |
| O Corvo (Anfitrião) | jogador | `npc/corvo/silhueta.svg` | INTERFACE + CASA | ⚠ Sprite PENDENTE desde a v1; tem essência mas não tem rosto. |
| ??? (desconhecido, Mensagens) e a figura que fala com quem devolveu as cartas | jogador | `lib/devo/npcs.ts` (`desconhecido`), `cenas/figura-devolveu.ts`, `public/images/npc/voice-figure.jpg` | INTERFACE | ⚠ Sem sprite. |
| Figura encapuzada do Poço | jogador | `poco/poco-neblina.tsx` | INTERFACE | ⚠ Sem sprite. |
| Retrato no `PortraitFrame` e medalhão redondo (`NpcMedallion`) | todos | `kit/portrait.tsx`, `kit/npc-anchor.tsx`, `torres/retrato.ts` | INTERFACE + CASA + TORRES | ⚠ Retratos novos mudam a janela do rosto: regenerar `npc-rostos.json`. |
| Cut-in, retrato em pose, cartão de chamada, tela de Confidente | todos | — | INTERFACE + CASA + TORRES | ⚠ Não existe nada disso hoje (só 12 expressões estáticas). |
| Hostis (Visitantes hostis) | jogador | — | CASA | ⚠ Quem são é decisão do dono. |

## 10. Cenas e narrativa

Motor: `lib/devo/dialogo/*` + `components/devo/dialogo/*` (DIALOGO.md); gatilhos em `progressao/narrativa-host.tsx`.

| função | quem usa | onde está hoje (arquivo) | no v2 | observação |
|---|---|---|---|---|
| Motor de cena: passo salvo no servidor, escolhas, efeitos | todos | `lib/devo/dialogo/formato.ts`, `registro.ts`, `dialogo-server.ts`, `app/api/dialogo/route.ts` (`passo`, `escolher`, `efeito`, `concluir`) | INTERFACE + CASA + TORRES | O mesmo motor deve tocar as cenas VN da Casa/Torres. |
| Palco (cenário CSS, retrato, efeitos de luz/porta/campainha) | todos | `dialogo/palco.tsx`, `dialogo/cena-dialogo.tsx`, `dialogo/texto.tsx` | INTERFACE + CASA + TORRES | Precisa de cenário "mapa" e retrato grande que sai da moldura. |
| Host global de cenas (`useCenas`, evento `devo:cena`) | todos | `dialogo/cenas-host.tsx`, `torres/gatilho.tsx` | INTERFACE + CASA + TORRES | |
| Cena `figura-devolveu` | quem devolveu as cartas, após o 1º DV | `lib/devo/dialogo/cenas/figura-devolveu.ts` | INTERFACE | Texto literal. |
| Cena `galo-casa` | jogador (flag `galo_casa`) | `lib/devo/dialogo/cenas/galo-casa.ts` | CASA | |
| Cena `melissa-calendario` | jogador | `lib/devo/dialogo/cenas/melissa-calendario.ts` | INTERFACE | |
| Cena `melissa-corporacoes` | jogador | `lib/devo/dialogo/cenas/melissa-corporacoes.ts` | INTERFACE | |
| Cena `reflexao-anfitriao` | jogador | `lib/devo/dialogo/cenas/reflexao-anfitriao.ts` | TORRES | |
| Prólogo, tutorial, Poço (neblina), Salão (Herdeiro), Torres (Galo), Coruja, Javali | jogador | scripts próprios em `lib/devo/*-script.ts`, `poco-neblina.ts`, `salao-herdeiro.ts`, `torres/galo.ts` | conforme a tela | ⚠ Sete roteiros fora do motor único: unificar evita sete visuais diferentes no v2. |
| Holograma da Melissa | jogador | `dialogo/holograma.tsx`, `corporacoes/holograma.tsx` | INTERFACE | Dois arquivos com o mesmo papel. |
| Linha do destino (Karma) | jogador | `dialogo/linha-destino.tsx` | INTERFACE + CASA | |
| Dublagem | — | `docs/redesign/DUBLAGEM.md` | INTERFACE + CASA + TORRES | Planejado. |

## 11. Notificações

| função | quem usa | onde está hoje (arquivo) | no v2 | observação |
|---|---|---|---|---|
| Toast e central no app (boas-vindas, conversas, trocas, cartas resgatadas, Salão, Casa, Calendário, Corporações, desbloqueio) | todos | `os/use-devo-engine.ts`, `state/resgate-cartas.tsx`, `*/dados.ts`, `progressao/narrativa-host.tsx` | INTERFACE + CASA + TORRES | |
| Push: lembrete diário do pulso (no máximo a cada 20 h) | todos com push | `app/api/cron/pulse/route.ts`, `lib/push.ts` | INTERFACE | ⚠ A rota aceita chamada sem senha se `CRON_SECRET` não existir no ambiente (quem põe a variável é o dono). |
| Push de teste, assinatura e cancelamento | todos | `app/api/push/route.ts`, `app/api/push/test/route.ts`, `lib/devo/pwa.ts` | INTERFACE | |
| Push de convocação de DV, lance superado, recompensa entregue, Visitante na porta | todos | — | INTERFACE + CASA | ⚠ Não existe: o único push real é o do pulso. |
| Contador de pendências da Mesa | equipe | `system/staff-desk.tsx`, `salao-mesa.tsx`, `corporacoes-mesa.tsx` | EQUIPE | |

## 12. Permissões

Cargos: `owner`, `anfitriao`, `dealer`, `player` (`lib/devo/cargos.ts`, `can()`); ator em `lib/devo/permissoes-server.ts`.
O Owner nunca aparece como Owner em público (`publicCargo`).

| função | quem usa | onde está hoje (arquivo) | no v2 | observação |
|---|---|---|---|---|
| `jogar` | todos | `lib/devo/cargos.ts` | — | |
| `dv.criar`, `salao.avaliar` | toda a equipe | idem | EQUIPE | |
| `dv.editar` (Dealer: o seu; Anfitrião: o seu e dos seus Dealers; Owner: todos) | equipe | idem | EQUIPE | |
| `dv.tutorial`, `equipe.ver`, `virtudes.ver`, `virtudes.evoluir`, `corporacao.aprovar`, `corporacao.classificar`, `calendario.editar` | Owner, Anfitrião | idem | EQUIPE | |
| `recompensa.propor` / `editar` / `aprovar` / `distribuir` (externa só Owner; semanal com autorização) | equipe | idem | EQUIPE | |
| `convite.gerar` (por cargo e cota) | Anfitrião, Owner; Jogador 1 | idem | INTERFACE | |
| `dados.resumidos` (Anfitrião ou o próprio), `dados.completos` (Owner ou o próprio) | equipe | idem | EQUIPE | |
| `admin.global`, `dealer.transferir`, `desbloqueio.override`, `karma.ajustar`, `item.conceder`, `cargo.ver_owner`, `cosmetico.equipar_qualquer`, `catalogo.editar`, `config.editar`, `autorizacao.gerenciar`, `convite.teste`, `virtudes.ajustar`, `calendario.recompensas` | Owner | idem | EQUIPE | |
| Owner e Anfitrião veem tudo liberado (`seesAllSystems`) | Owner, Anfitrião | `lib/devo/progresso-server.ts` | INTERFACE + CASA + TORRES | Regra do dono: sem restrição em nenhuma tela, inclusive Casa/Torres e tutoriais. |
| Líder / vice / membro dentro da Corporação | jogador | `lib/devo/corporacoes.ts` | INTERFACE | |
| Novato × veterano (só vê Devo tutorial) | jogador | — | INTERFACE | ⚠ Regra pedida, não existe no servidor. |
| Ações novas (desfazer recompensa, autorizar no Salão, doação, Caos e Ordem, Visitantes) | equipe | — | EQUIPE | ⚠ Precisam entrar em `ACOES` e `can()`. |

## 13. APIs

Todas as rotas em `app/api/**/route.ts`. Erro de banco desatualizado: 503 `{code:'banco_desatualizado'}`.

| função | quem usa | onde está hoje (arquivo) | no v2 | observação |
|---|---|---|---|---|
| `/api/auth/[...all]` (better-auth) | todos | `app/api/auth/[...all]/route.ts` | — | |
| `/api/eu` GET (perfil, cargo, inventário, acesso, destino, convites, Arcano); POST `cartas.resgatar` | todos | `app/api/eu/route.ts` | — | ⚠ Resgate marca a entrega antes do save: carta pode sumir se a rede cair. |
| `/api/save` POST | todos | `app/api/save/route.ts` | — | ⚠ Aceita Tempo e cartas do cliente. |
| `/api/record` GET/POST: `join`, `leave`, `cartas`, `avatar`, `create`, `edit`, `status`, `group`, `admission`, `decision`, `entryPrizes`, `apply`, `outcome` | todos / equipe | `app/api/record/route.ts`, `lib/devo/record-server.ts` | — | |
| `/api/record/avatar` GET | todos | `app/api/record/avatar/route.ts` | — | |
| `/api/invites` GET/POST `create`, `revoke` | jogador, equipe | `app/api/invites/route.ts` | — | |
| `/api/staff` GET `view=` equipe, jogadores, jogador, itens, recompensas, recompensa, log, config, supervisao; POST cargo, dealer, desbloqueio, item, karma, catálogo, config, autorização, recompensa.* | equipe | `app/api/staff/route.ts` | — | ⚠ `karma.ajustar`, `catalogo.definir`, `recompensa.editar`, `view=supervisao` sem tela. |
| `/api/arcade` GET/POST: `register`, `queue`, `duel`, `room`, `leave`, `finish`, `chat`, `bet`, `claim`, `settings`, `tutorial` | jogador | `app/api/arcade/route.ts`, `lib/devo/arcade/server.ts` | — | |
| `/api/trocas` GET (uids presos no Salão) | jogador | `app/api/trocas/route.ts` | — | ⚠ Não há troca real no servidor. |
| `/api/poco` GET/POST: moeda, manivela, balde, apresentação; Owner: pesos, prêmios, seção | jogador, Owner | `app/api/poco/route.ts` | — | |
| `/api/salao` GET/POST: lance, mercado, anúncio, bandeja, aviso, apresentação; equipe: avaliação; Owner: evento, contrato, config | jogador, equipe | `app/api/salao/route.ts` | — | |
| `/api/torres` GET/POST: `subir`, `galo.visto`, `galo.fa`, `reflexao` | jogador | `app/api/torres/route.ts` | — | |
| `/api/corporacoes` GET/POST (21 ações de jogador e Mesa) | jogador, Owner/Anfitrião | `app/api/corporacoes/route.ts` | — | ⚠ `convite.cancelar` e `mesa.rivalidade` sem tela. |
| `/api/virtudes` GET/POST: Arcano (evoluir, despertar, escolher); Mesa: potencial, afinidades, estágios, evoluir, arcano, arcano-texto | jogador, equipe | `app/api/virtudes/route.ts` | — | |
| `/api/calendario` GET/POST: `checkin`; Mesa: evento, regras | todos, equipe | `app/api/calendario/route.ts` | — | |
| `/api/casa` GET/POST: confecção, mesa, pacote; Owner: regras, receitas | jogador, Owner | `app/api/casa/route.ts` | — | Base da Casa do v2; SPEC-CASA acrescenta cômodos/skins. |
| `/api/cosmeticos` GET/POST: catálogo, visuais, equipar, histórico; Owner: admin.*; planos semanais | todos, equipe | `app/api/cosmeticos/route.ts` | — | ⚠ `plano.editar` sem tela. |
| `/api/dialogo` GET/POST: passo, escolher, efeito, concluir | todos | `app/api/dialogo/route.ts` | — | |
| `/api/anuncios` GET/POST `salvar` | todos, Owner | `app/api/anuncios/route.ts` | — | |
| `/api/push` GET/POST/DELETE; `/api/push/test` | todos | `app/api/push/*` | — | |
| `/api/cron/pulse` GET | agendador | `app/api/cron/pulse/route.ts` | — | ⚠ Ver §11. |
| APIs novas previstas: `/api/aparencia`, Casa (cômodos, objetos, visitas), vínculos, doação, ordem | — | SPEC-AVATAR §6, SPEC-CASA §5, SPEC-ORDEM §3.4 | — | ⚠ a construir. |

## 14. Pedidos do v2 que ainda não existem (para não se perderem)

Texto literal em `docs/redesign/v2/PEDIDO-V2-dono.md`.

| função | quem usa | onde está hoje (arquivo) | no v2 | observação |
|---|---|---|---|---|
| Ritos de Invocação (Gestos, Cânticos com marca-texto, três complexidades, regras próprias) | jogador | — | INTERFACE (Cartas) + CASA (Card Shuffler) | |
| Virtude de Taças reduz gestos/linhas/vocalização | jogador | — | INTERFACE | ⚠ Patamares não definidos. |
| Recuo Paranormal (escala 1–6) e redução por Paus | jogador, Dealer | — | INTERFACE | ⚠ Lendária `X`; dois `x%`. |
| Visitantes com afinidade por Essências | jogador | — | CASA | |
| Decorações (loja; chance por NPC) | jogador | — | CASA | |
| Hostilidade (esconderijo) | jogador | — | CASA | |
| Quartos de Hóspedes | jogador | — | CASA | |
| Vínculos: NPCs conhecidos, "paixão", romance, diálogos e "i…" (texto do dono cortado) | jogador | — | INTERFACE + CASA | ⚠ O fim da frase do dono está truncado no arquivo: confirmar com ele. |
| Criação do avatar inspirada em anime | jogador | — | CASA | |
| Doar horas (crime fora da companhia → pontos necro) | jogador | — | INTERFACE | |
| Caos e Ordem (honra/necro; afeta Torres de companhia e hostilidade) | jogador | — | INTERFACE + CASA + TORRES | ⚠ "em construção". |
| Novato vê só o Devo "tutorial" | jogador, equipe | — | INTERFACE | |
| Casa: skins e cômodos por nível | jogador | — | CASA | ⚠ "ainda estamos discutindo". |
| Card Shuffler vira outro objeto | jogador | — | CASA | ⚠ Função nova não descrita. |
| Salão: Anfitrião+ autoriza e abre "agora" no padrão de três dias; Owner desfaz ação de alguém | equipe | — | INTERFACE (faixa da equipe) | |

## 15. Brechas consolidadas (⚠), da mais grave para a menos grave

1. **Tempo decidido pelo navegador.** `/api/save` grava `timerEndsAt` como o cliente mandar; Salão, Casa,
   Corporações, Poço e apostas debitam desse campo (`lib/devo/save.ts`, `lib/devo/arcade/server.ts`). Sem servidor
   dono do Tempo, a doação de horas do v2 não fecha.
2. **Cartas vêm do navegador.** `/api/save` aceita até 300 cartas com qualquer id. Salão, Confecção e peso do DV
   confiam nesse inventário.
3. **Sala de Trocas é simulada.** O parceiro é um bot do navegador (`lib/devo/trade-bots.ts`,
   `os/use-devo-engine.ts`); não há troca real entre jogadores, e a área "Jogadores" de Mensagens está trancada.
4. **Sem desfazer.** Recompensa entregue e resultado de DV aplicado não voltam; `admin_log` não cobre todas as
   ações da equipe (status do DV, aceite de inscrição, recusa de lote, anúncio).
5. **Novato × veterano não existe no servidor.** `joinVote` não olha o tipo tutorial: veterano repete prêmios de
   iniciante; novato vê todos os Devos.
6. **Funções sem tela:** `karma.ajustar`, `catalogo.definir`, `recompensa.editar`, `plano.editar`,
   `convite.cancelar` (Corporação), `mesa.rivalidade`, `view=supervisao`, conteúdo das Torres (`torres.conteudo`),
   agenda da Sala de Jogos (`arcade_schedule`) e a troca de segunda aparência (`changeAppearance`).
7. **Notificação fora do app só para o pulso.** Convocação de DV, lance superado, recompensa e (no v2) Visitante
   na porta não chegam por push; a rota do cron aceita chamada sem senha se `CRON_SECRET` faltar.
8. **NPCs incompletos para o redesenho Persona.** Corvo, ???, a figura encapuzada do Poço e a figura do prólogo
   não têm sprite; o elenco só tem 12 expressões paradas, sem pose, cut-in ou cartão. Trocar retratos obriga a
   regenerar `lib/devo/npc-rostos.json`. Melissa, Herdeiro e Rato não têm Essência de Afinidade (Visitantes).
9. **Sete roteiros fora do motor único de diálogo** (prólogo, tutorial, Poço, Salão, Torres, Coruja, Javali) e dois
   hologramas da Melissa. No v2 isso vira sete visuais de VN diferentes se não for unificado.
10. **Valores provisórios ou pendentes do dono:** Lendária `X` e dois `x%` no Recuo; custos e esperas da Confecção;
    `essencia:campanha`; `dracma_rara`; faixas do Karma; probabilidades do Poço; Força sem Estágio IV e VII só com
    nome; `PESO_PADRAO`; Molde de Xadrez sem visual; prazo do "forçar aberto" do Salão.

Outras: resgate de cartas pode perder a carta (`claimCards`); vitória casual sem teto diário; "Reiniciar sessão"
sem limite; mudar a âncora do Salão move lotes; o v2 precisa decidir como "rosto 2D/3D" do prólogo e o avatar anime
convivem; toasts e voltar do Android precisam de regra dentro do mapa da Casa.

## 16. Contagem por área

| área | linhas | com ⚠ |
|---|---|---|
| 1. Entrada e fluxo inicial | 16 | 2 |
| 2. Sistema (celular e desktop) | 13 | 2 |
| 3. Record e Deadly Vote | 12 | 5 |
| 4. Apps de base | 10 | 4 |
| 5. Sala de Jogos | 16 | 2 |
| 6.1 Calendário | 4 | 0 |
| 6.2 Salão das Máscaras | 9 | 3 |
| 6.3 Poço dos Milagres | 8 | 2 |
| 6.4 Torres de Ruptura | 9 | 3 |
| 6.5 Corporações | 9 | 2 |
| 6.6 Virtudes | 3 | 0 |
| 6.7 Arcanos | 4 | 1 |
| 6.8 Casa | 13 | 7 |
| 6.9 Cosméticos | 4 | 1 |
| 7. Mesa (equipe) | 22 | 9 |
| 8. Itens e moedas | 16 | 8 |
| 9. NPCs | 12 | 6 |
| 10. Cenas e narrativa | 12 | 1 |
| 11. Notificações | 5 | 2 |
| 12. Permissões | 12 | 2 |
| 13. APIs | 22 | 8 |
| 14. Pedidos novos do v2 | 15 | 6 |
| **total** | **246** | **76** |
