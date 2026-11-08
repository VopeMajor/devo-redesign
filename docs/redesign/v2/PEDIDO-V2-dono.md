# DEVO v2 — pedido do dono (31/10/2026, texto literal)

Decisões tomadas na conversa (31/10):
- Motor: visual de RPG Maker dentro do site atual (Next.js, contas, banco, Cloudflare). Mapa em pixel onde o avatar anda, diálogos de visual novel, menus em pixel.
- Estilo: pixel art em mapa, casa e menus; retratos dos NPCs e imagens de encontro em ilustração anime de alta qualidade.
- Arte: mistura de pacotes com licença aberta (base) e geração por IA (retratos, cenas, itens únicos).
- Troca: versão nova em paralelo (branch e endereço separados, mesmo banco); o site atual fica no ar até o dono aprovar.
- Referências enviadas: `refs/ref-01.jpg` … `refs/ref-08.jpg` (diálogo com retrato e moldura floral, cerejeiras isométricas, casas isométricas, D1AL-ogue, diário rosa/preto).
- **Correção do dono (01/11/2026), substitui o Motor/Estilo acima:** "não gostei. o devo em geral deve ter a vibe antiga, não em pixel. mas a casa e torres rpg maker/visual novel. além disso tudo parece muito simples, aprimore as artes e enquadramento"
  - O DEVO em geral (celular do sistema, Record, Deadly Vote, Poço, Mesa, Salão, Companhias etc.) mantém a identidade atual (gótico ametista, arte pintada; ver `docs/redesign/IDENTIDADE.md`). Nada de pixel nessas telas.
  - Só a **Casa** e as **Torres** viram RPG Maker / visual novel (mapa onde o avatar anda, diálogos com retrato).
  - Arte e enquadramento precisam ser mais ricos; o primeiro kit foi julgado simples demais.
  - Mais tarde, no mesmo dia: "os npcs também tem que passar pelo redesign. pegue como referencia o persona"
  - Depois, com 14 referências novas (`refs/ref-09.jpg` … `refs/ref-22.jpg`): "a vibe anterior, mas não um reaproveitamento ok? isso é um redesgn afinal. algumas referências (mas não se prenda a elas.) pode inserir elementos 2.5/3D em algumas telas. também refaça os cosméticos. quero tudo Melhor e mais bonito"
  - Sobre a segunda proposta (kit2), 01/11: "não. muita coisa foi reaproveitada, não quero isso. pedi um REDESGN. . A casa não está parecida em NADA com as referências enviadas. Os sprites quero em pixel art. Boa parte parece que está em geometria simples, sendo que quero um design de ponta."
    - O kit2 foi REPROVADO. Nada de reaproveitar arte, telas, retratos ou cenários atuais (nem como placeholder).
    - A Casa tem que seguir as refs 01–06 (casas e cômodos isométricos, cerejeiras, interiores detalhados).
    - Sprites (avatar e NPCs andando) em pixel art. Retratos e CGs continuam em ilustração.
    - Nada de geometria simples (formas chapadas, círculos e retângulos de CSS): design de ponta.
  - Sobre as referências, 01/11, no computador do dono: "nem todas aí servem para referência, foque mais nas imagens que enviei anteriormente". Valem as refs 01–08 e a nova `refs/ref-23.jpg` (sala pintada em perspectiva, azul-petróleo). O Pinterest é apoio, não direção.
  - Sobre a interface, na mesma conversa: "já para o site, algo mais moderno. use agentes para validar a qualidade e um crítico para comparar Lado as referências e também jogos visual novel para seguir com o devo"
  - Em seguida: "jogos como danganronpa, persona, etc. e para a parte das casas (encontros, oficina de cartas, avatar, etc), essa parte mais rpg maker"
    - **Site em geral:** moderno, com Danganronpa e Persona como comparação (tipografia forte, cortes, cut-ins).
    - **Parte das casas:** RPG Maker. Inclui a Casa, os encontros, a oficina de cartas e o avatar.
  - Depois: "não quero nada genérico. pode usar os sprites que já existem, mas passe para pixel art." Exceção à regra de não reaproveitar: os sprites atuais podem ser a base, convertidos em pixel art.
  - Sobre o pixel dos personagens: "pegue como exemplo os personagens em pixel do p4au" (Persona 4 Arena Ultimax).
  - Logo depois: "os chibis devem ser somente dentro da casa. mas ao abrir o diálogo ficam na proporção real com os balões de fala."
    - **Andando na Casa:** chibi em pixel.
    - **Ao abrir o diálogo:** o personagem aparece em proporção real, em pixel no padrão P4AU, com balões de fala.
  - Sobre o elenco: "o único que quero ajuste mesmo é a melissa.. O design dela é o mais genérico e com cara de inteligência artificial". Os outros NPCs ficam como estão; só a Melissa tem o design refeito.
  - Sobre o método: "quero múltiplas expressões e até animações, não somente um trabalho simples de passar do normal para pixel. faça cada etapa com cuidado. se necessário trabalhe somente em uma tela por vez e me passe e então seguimos para a próxima etapa. quero cada coisa perfeita. priorizo qualidade e estética à pressa."
  - Escolha do novo design da Melissa, entre três opções (`kit3/melissa-opcoes.png`): "gostei da terceira. Só a deixe mais jovem". Vale a opção C, a Projeção (`kit3/art-src/melissa-c-projecao.png`): franja reta, rosa azul no lugar de um olho, casaco azul de gola alta, barra em linhas de varredura. Continua adulta, na casa dos 20 e poucos.
  - Depois de ver a opção C rejuvenescida e o parecer do crítico: "sim. ele tem razão. melissa é uma personagem que deve parecer doce e acolhedora ao jogador. pode refazer as ideias". A opção C saiu; novas ideias em andamento.
  - Sobre as opções D, E e F (`kit3/melissa-opcoes-doce.png`): "rosto extremamente genérico" e "não gostei". Saem as três; o rosto é o problema, e a roupa vem depois.
  - Entre seis rostos (`kit3/art-src/melissa-rostos.png`), o dono escolheu o 3: cabelo em cuia liso com a parte de baixo preta, olhos grandes com pupila pequena, nariz de ponto, sorriso pequeno. A roupa ainda não foi decidida.
  - Ajuste no rosto: "ela olha diretamente pro jogador. além disso aumente ligeiramente as pupilas dela por favor".
  - Sobre a folha da Melissa: "sobre as poses, compare  com a da melissa antiga". A nova segue as 12 poses da folha antiga, na mesma ordem (`docs/redesign/refs/npc-oc/melissa.png`).
  - Sobre a folha de 12 poses (`kit3/art-src/melissa-12-poses.png`): "aprovo. podemos seguir". Rosto e poses aprovados; a roupa da folha é só teste.
  - Sobre os figurinos G, H e I (`kit3/melissa-roupas.png`): "ela faz parte da companhia, tem é um uniforme mais formal". Saem os três; a roupa é farda formal da Companhia.
  - Logo depois, o dono enviou a referência do uniforme (`refs/ref-24.jpg`): casaco azul risca de giz com lapelas pretas, camisa branca e gravata preta, corpete preto alto, punhos de renda preta, luvas pretas, rosas azuis em fitas pretas, laço grande listrado na cintura, sobressaia com abertura, botas pretas de amarrar.
  - Sobre `kit3/art-src/melissa-uniforme.png`: "aprovo o uniforme". Sem chapéu e sem anel na coxa, com a saia fechada e o broche de rosa com olho.
  - Entre luvas pretas e claras na folha de 12 poses (`kit3/melissa-12-luvas.png`): "Luva preta".
  - Sobre a folha final (`kit3/melissa-12-final.png`): "Aprovo". É a base das expressões da Melissa, em ilustração e depois em pixel.
  - Sobre a primeira prova em pixel (`kit3/melissa-pixel-vs-p4au.png`, notas 7, 7, 8, 5 e 5): "tente algo que pegue no minimo nota 8". Vale como meta em todos os critérios do crítico.
  - Sobre o sprite reduzido e retocado por código (`kit3/art/melissa-pixel-idle.png`): "isso está TENEBROSO". Descartado, com o rosto feito pixel a pixel. Quem decide é o olho do dono; a nota do crítico não é mais meta.
  - Entre as três gerações sem retoque (`kit3/melissa-sem-retoque.png`), o dono escolheu a 2 (`kit3/art-src/pixel-melissa-idle2.png`): é a base do corpo em pixel.
  - Sobre a opção 2 em meio tamanho (`kit3/art/melissa-2-meio.png`, 356 × 739, sem retoques), que não é pixel rígido como o do P4AU: "Pode ser". É o acabamento de base do diálogo.
  - Sobre as 12 expressões no corpo (`kit3/melissa-12-no-corpo.png`): "Dependendo da expressão pode ajustar o corpo e mão também, e tirar a prancheta se necessário". A pose de corpo e mãos muda com a expressão, e a pasta é opcional.
  - Sobre o teste de quatro poses (`kit3/melissa-poses-teste.png`): "Aprovo". As outras oito seguem o mesmo caminho.
  - Sobre as 12 poses de corpo inteiro (`kit3/melissa-12-poses-corpo.png`): "o rosto voltou a ser o mesmo genérico, se perdeu do que eu havia escolhido antes". O dono reenviou a folha `kit3/melissa-12-final.png` como referência do rosto. As cabeças agora são recortadas dessa folha, sem gerar rosto novo.
  - Sobre as poses com as cabeças recortadas da folha aprovada (`kit3/melissa-12-cabeca-aprovada.png`): "É este". Rosto confirmado; a partir daqui, nada de gerar rosto novo sem comparar com essa folha.
  - Sobre as 12 poses limpas (`kit3/art/melissa-q-*.png`): "Aprovo". Próxima etapa: uma cena de diálogo animada com balão de fala.
  - Sobre a cena de diálogo (`kit3/dialogo.html`): "Aprovo". Vale como padrão do diálogo; o quarto de fundo foi só para o teste. Próxima etapa: o chibi da Melissa com o design aprovado.
  - Sobre o chibi da Melissa (`kit3/art/chibi-melissa.png`): "Aprovo". Próxima etapa: a Casa, começando pela arte dos cômodos.
  - Sobre a arte da Casa (`kit3/casa-vs-referencias.png`): "Refazer a partir do corte". O corte é a base: corrigir fachada e telhados, e refazer quarto e oficina a partir dele, com traço mais limpo, cores mais chapadas, porta em cada cômodo e móveis mais para o centro.
  - Sobre a Casa, 01/11: "n esqueça de passar para pixel art e otimizar para celular. lembre-se que primeiro é um cômodo, com a sala e depois a mesa de oficina, depois libera o andar dos quartos. faça uma navegação pensando na experiência do usuário".
    - Progressão: um cômodo (sala) → mesa de oficina no mesmo cômodo → libera o andar dos quartos. Substitui a proposta de três cômodos pequenos em `LEIA-PRIMEIRO.md` item 5.
    - Cômodos em pixel art, celular primeiro, navegação pensada na experiência.
  - Sobre a Casa jogável com as três etapas e a navegação (`kit3/casa.html`): "Aprovo". O que libera a mesa e a escada continua pendente. Próxima etapa: a criação do avatar.
  - Sobre o avatar: "tbm faça a versão masculina. mas independente do corpo base, penteados e outras coisas não terão gender lock". Dois corpos-base (masculino e feminino), com qualquer parte disponível para qualquer corpo. Resolve a PENDENTE 5 da `SPEC-AVATAR.md`.
  - Sobre o teste do avatar (`kit3/avatar-teste.png`): "crie mais opções, se possível menos genéricas".
  - Sobre as cores do avatar: "deixe também a cor de olho e cabelo ser selecionável além da pele".
  - Sobre as opções do avatar: "ficam todos. depois, quando houver "fotos especiais" que contenham o personagem, deve ser a aparência atual escolhida, assim como amor doce. e o personagem chibi também deve respeitar a escolha do usuário. para alterar só ir no guarda roupa quando desbloquear o quarto e tem q pagar 1 hora. mas a primeira escolha é grátis e já aparece assim que a casa é desbloqueada."
    - Os 18 penteados e 18 rostos ficam.
    - Fotos especiais (CGs) e chibi mostram a aparência atual. Resolve a PENDENTE 8 da `SPEC-AVATAR.md`: as CGs terão de ser em camadas.
    - Primeira criação grátis, assim que a Casa é desbloqueada. Trocar depois: no guarda-roupa do quarto, custa 1 hora de Tempo. Resolve a PENDENTE 4 no custo; intervalo mínimo entre trocas não foi citado.
  - Sobre o chibi em peças e o fluxo de criação e guarda-roupa (`kit3/casa.html`, `kit3/avatar.html`): "Aprovo". Próxima etapa: roupas.
  - Sobre as seis roupas (`kit3/avatar-catalogo-roupas.png`), qual segue para o chibi: "As seis".
  - Sobre as seis roupas no avatar e no chibi (`kit3/avatar.html`, `kit3/chibi-roupas-todas.png`): "Aprovo". Próxima etapa: tela inicial do site, em visual moderno (Danganronpa, Persona).
  - Sobre a tela inicial em cartaz (`kit3/home.html`): "hmm não sei. pode ser algo como realmente um sistema operacional próprio, mas obviamente na temática do devo".
  - Sobre o avatar: "e esse avatar serve somente pra casa. O Record ainda terá a aparência dele escolhida e pode por foto de perfil na tela dedicada a isso". Portanto o avatar não aparece na tela inicial nem no sistema.
  - Sobre o sistema em mosaico de vitrais (`kit3/os.html`): "não gostei desse layout. crie uma ui os nova".
  - Sobre as três propostas de sistema (mostrador, janelas, cartas): "b. mas o icone do tempo está mt gigante. deixe esta tela somente se tiver algum anuncio., se nã, deixe sem naada.  o tempo deixe rodando na parte superior do centro da tela mesmo, já que ficará em tela cheia. tbm n quero esse esquema de cores". Portanto: sistema de janelas, Tempo pequeno no alto e no centro, janela aberta só quando houver anúncio, paleta violeta descartada.
  - Sobre os esquemas de cores do sistema: "deixe o padrão azul e o usuário pode selecionar o que quer depois em configuração". O padrão é o esquema Aço, o azul oferecido; a troca fica em Ajustes.
  - Sobre o sistema de janelas em pixel, no azul, com ícones novos (`kit3/os-janelas.html`): "Aprovo". Próxima etapa: tela do Record, com a aparência e a foto de perfil.
  - Sobre a ficha do Record: "tambem adicione um lugar para por o nivel (ja falo sobre o xp)". As regras de XP ainda serão passadas pelo dono.
  - Depois da tela do Record com o Nível, sobre o XP: "depois passo. siga para as outras etapas". Próxima etapa: apps de base, um por vez, começando pelo Pulso.
  - Sobre a tela do Pulso: "tira as regras do pulso. n precisa de extras, pode por a quantia cheia de horas".
  - Sobre o Pulso sem regras e com a quantia cheia de horas: "Aprovo". Próxima etapa: Mensagens.
  - Sobre a moldura das cartas: "não, quero as molduras antigas". Volta a moldura do jogo (`shared/carta-tarot.tsx`), com relógio, janela em arco e quadro de informações.
  - Sobre as miniaturas de cartas em pixel: "não precisa pixelixar as caryas". As cartas usam a arte original em todo o sistema.
  - Sobre os balões de Mensagens: "os balões de texto estão praticamente grudados um no outro. e faça ele um pouco mais arredondado". Depois do ajuste: "Aprovo". Próxima etapa: Cartas.
  - Sobre Cartas com a moldura antiga: "Aprovo". Próxima etapa: Inventário.
  - Sobre o Inventário: "Aprovo". Próxima etapa: Sala de Trocas.
  - Sobre a Sala de Trocas: "no mobile coloque um indicador que e para arrastar para baixo". Feito em todas as janelas do sistema, no celular.
  - Sobre a Sala de Trocas com o aviso de arrastar: "Aprovo". Próxima etapa: Ajustes.
  - Sobre Ajustes: "aprovo. pode prosseguir". Próxima etapa: Calendário.
  - Sobre o Calendário: "altere essas telas aí de evento. quero em pixel art". Cenas de evento redesenhadas em pixel.
  - Sobre o Calendário com os eventos em pixel: "aprovo". Ícones do check-in seguem como estão. Próxima etapa: Poço dos Milagres.
  - Sobre o Poço dos Milagres: "altera o ícone das moedas e os fragmentos". Ícones novos em pixel no Poço, no Calendário e no Inventário.
  - Sobre os ícones novos e o Poço dos Milagres: "aprovo". Ícones de PP, ampulheta e carta seguem como estão. Próxima etapa: Salão das Máscaras.
  - Sobre o Salão das Máscaras: "salão está ok. mas falta um pouco mais do corpo do npc".
  - Sobre o Herdeiro com corpo: "a cabeça está um pouco desproporcional ao corpo".
  - Sobre o Herdeiro com a cabeça menor e o Salão das Máscaras: "pode ir para a sala de jogos". Próxima etapa: Sala de Jogos.
  - Sobre a Sala de Jogos: "aprova. sim, Valide os jogos por dentro. quero que ajuste a otimização e estilo em geral, alguns estão muito simples ou não atendem a qualidade que espero."
  - Sobre o Memory Rush refeito: "aprovo".
  - Sobre o Living Chess: "no xadrez mantém 3D,  mas melhore o desempenho".
  - Sobre o Living Chess otimizado: "aprovo. pode ir pro bomba quente".
  - Sobre a Bomba Quente em pixel: "aprovo". Próxima etapa: Blefe.
  - Sobre a ficha do valor no Blefe: "a letra ou nun tô no valor está fora do ícone". Corrigido.
  - Sobre o Blefe refeito: "aprovo". Os quatro jogos estão aprovados. Próxima etapa: Corporações.
  - Sobre Corporações (`kit3/os-corp.js`, chamada da Melissa em holograma, brasões em pixel): "aprovo".
  - Logo depois, sobre o sistema de janelas: "mas sobre o design em geral do devo... invés de parecer um sistema operacional de Windows XP queria algo mais interessante". A casca do sistema (área de trabalho, janelas, barras) será repensada; o conteúdo dos apps já aprovados fica.
  - Sobre as três direções de conceito (Palco, Grimório, Escrivaninha, em `kit3/art-src/casca/`): "hmm. pode até manter da forma atual , mas ajuste a formatação e alguns elementos. tá tudo muito quadrado demais". Fica o sistema de janelas; a forma das peças (janelas, barras, botões, abas, quadros) deixa de ser só retângulo.
  - Logo em seguida: "na verdade, misture com modernidade. não precisa ser tudo em pixel." A casca mistura pixel (ícones, arte, Tempo) com acabamento moderno (cantos arredondados, vidro, luz, tipografia limpa).
- 02/11, depois de ver os modelos A/B/C feitos a partir do Pinterest (`kit3/art-src/casca2/`) e mandando a foto da tela de entrada do site atual (Deadly Vote): "mantenha aquele azul mesmo. mas altere o símbolo do devo para aquele anterior. deixe a interface um pouco mais moderna como esta, em geral". Fica o esquema azul; o símbolo volta a ser a estrela de quatro pontas com órbita (`components/devo/system/symbol.tsx`); a casca ganha o acabamento da tela de entrada (Cormorant nos títulos, IBM Plex Mono nos rótulos, filetes finos, moldura com cantoneiras, botão principal em porcelana).
- Logo depois: "se inspire em honkai star rail". A casca passa a seguir a interface de Honkai: Star Rail, ainda no azul e com a estrela: céu com estrelas e órbitas finas, ícones em discos redondos, o Tempo numa cápsula de recurso, títulos de janela com rótulo pequeno em cima, abas e botões em cápsula, principal em creme (letra Barlow).
- Em seguida: "ajuste. não se apegue tanto a tela atual. redesenhei e deixe moderno e refinado assim como em honkai por exemplo". O início deixa de ser área de trabalho e vira um painel como o menu de Honkai: Star Rail: perfil (abre o Record), cartão grande do Tempo com barra das 72 horas (abre o Pulso), cartões de hoje (check-in e próximo evento), faixa de anúncios no lugar da janela Quadro e os sistemas em discos. Com uma janela aberta, o Tempo sobe para a barra de cima. As janelas continuam.
- Sobre o início: "aprovo. no chat, o rato está muito pra direita no ícone circular, atualize. Veja se interagindo com o jogador tbm não está errado". Os rostos do Rato foram recortados de novo, uma janela por expressão (`art-src/npc_px.py`); rostos do chat em círculo e balões sem a sombra dura.
- Depois: "pode seguir". Etapa seguinte: Virtudes (`kit3/os-virtudes.js`), no modo dos Traços do Star Rail: os seis naipes em constelação em volta do Arcano, detalhe da Virtude tocada, Pontos de Potencial em gomos (sem números), atalho para os Arcanos, textos literais do dono e histórico de Evoluções.
- Sobre Virtudes: "aprovo". Etapa seguinte: Arcanos (`kit3/os-arcanos.js`, textos em `kit3/os-arcanos-dados.js` gerados de `lib/devo/arcanos-textos.ts`), no modo das telas de personagem e de Eidolons do Star Rail: coleção dos 22 com o original em destaque, página de cada Arcano com a figura pintada, trilha dos Estágios 0..VII, Descrição e Fisiologia, evoluir com Fragmentos, despertar com Grande Fragmento e a escolha do prêmio entre três.
- Sobre Arcanos: "aprovo. acho que o que me incomoda um pouco é o esquema de cores do site. está tudo meio que ee uma cor só". Três paletas em teste no protótipo (`?paleta=ouro|sistemas|noite`): A azul e ouro; B cada sistema com sua cor (ícone e janela); C azul noturno com cor por sistema. Aguardando a escolha.
- "gostei da C. também falta um pouco de personalidade nos backgrouds". A C virou o padrão do azul (`?paleta=atual` mostra a antiga). Fundo do início pintado (`art-src/fundo-noite/`, céu noturno com anéis de relógio e cidade gótica, celular e computador); cada janela ganhou brilho da cor do sistema, poeira de estrelas e o emblema do sistema apagado no canto.
- "tá bom. pode seguir". Etapa seguinte: Mesa (`kit3/os-mesa.js`): pendências no alto, alerta de novatos sem Tutorial (B-4), seções por cargo em três grupos (Operação, Supervisão, Casa inteira), "Ver como" Dealer/Anfitrião/Owner, Casos completo (lista, status, inscrições, resultado e aplicar, novo Deadly Vote) e Recompensas completo (aprovar, rejeitar, entregar, propor). As outras 14 seções listam o que fazem hoje; as telas delas vêm depois.
- Sobre a Mesa: "essa tela tá muito genérica". E logo depois: "a tela inicial tbm. deixe o timer no centro no canto superior, tire esse relógio do pulso". A Mesa ganhou a mesa do Dealer pintada no alto (`art-src/mesa/`), pendências como fichas de cassino, seções como cartas, casos como dossiês carimbados e recompensas como vales destacáveis. No início, o cartão grande do Tempo saiu (o Tempo fica sempre no centro da barra de cima), o perfil virou a ficha do Record com retrato em arco e o Arcano, os cartões de hoje viraram bilhetes e o aviso do Owner virou carta lacrada.
- 02/11, seguidos: "aprovo. agora sobre o backgroud. pode usar o do devo abrigo" (não achei esse fundo em lugar nenhum); "e os ícones, não precisa desse círculo envolta"; depois, com a imagem do Mapa Estelar do Star Rail: "quero a interface o mais fiel possível as referências em anexo e as pesquisas que correspondem a honkai star rail u https://pin.it/2TXPjCVR7i" (o link não abre: redireciona para a página inicial do Pinterest); "como eu disse, o que deve ser em pixel são os npcs e a parte da casa que terá rpg maker.. O restante não necessariamente precisa disso"; sobre os ícones ilustrados: "esses ícones estão mt genéricos", "alguns eu gostei mas estão com caras de ia", "deixe com aspecto 3D anime", "ou 2/2.5D". O início virou o Mapa do Devo (fundo azul com órbitas, `art-src/fundo-mapa/`; cada sistema numa mira dourada com o nome entre filetes); o Tempo e os números saíram do pixel; os ícones estão sendo refeitos como lugares do universo do DEVO em anime 3D/2,5D (`art-src/icones-mundos/`).
- Depois: Pulso e Máscaras voltaram à versão anterior; mira de volta atrás dos ícones; o mapa se arrasta para o lado quando há muitos. "o card ainda não está tão royal quanto quero. a tela das cartas também parece simples. não poupe recursos, deixe um design de ponta". A ficha do jogador ganhou moldura de ouro com coroa e relógio e o retrato do Arcano (`art-src/ficha-cartas/`); Cartas virou tela no modo dos Cones de Luz do Star Rail (raridade em estrelas e cor, cartas que inclinam, palco de luz, carta que vira em 3D, abas).
- Pinterest: conectado no navegador do app (conta do dono, 1.303 pins). Usar só como apoio.

---

quero uma reestruturação geral no devo. ele agora deve ser um jogo rpg maker. algumas funções se manterão, mas com alterações ou melhorias. por exemplo isso será acrescentado nas cartas além do peso, natureza, etc:

*Manual de utilização de Cartas — Deadly Vote*

*I. Ritos de Invocação*

Record, nem toda carta pode ser utilizada simplesmente porque você deseja fazê-lo. Algumas exigem movimentos específicos, outras demandam palavras cuidadosamente pronunciadas e há aquelas que, felizmente para você, não exigem absolutamente nada. Afinal, seria bastante inconveniente precisar recitar um poema inteiro toda vez que quisesse fazer alguma coisa útil...

Para compreender como uma carta é invocada, você precisa conhecer dois elementos fundamentais: *Gestos e Cânticos*. Ambos fazem parte dos Ritos de Invocação, mas funcionam de maneiras distintas.

*I. Gestos*

Os Gestos são movimentos ritualísticos exigidos por determinadas cartas. Cada movimento possui uma denominação e um simbolismo próprios, integrando um repertório compartilhado entre diferentes cartas, coleções e raridades.

Isso significa que duas cartas completamente distintas podem exigir exatamente o mesmo gesto, ainda que seus efeitos não possuam qualquer relação aparente. Da mesma forma, uma carta pode exigir um único movimento, enquanto outra demanda uma sequência de vários deles.

A quantidade e a ordem dos gestos necessários são determinadas individualmente por cada carta. Portanto, não presuma que duas cartas semelhantes devam compartilhar os mesmos requisitos.

A boa notícia é que você não precisa aprender um gesto novo para cada carta que encontrar. Ao compreender o repertório gestual, será capaz de reconhecer movimentos já conhecidos em novas invocações.

Naturalmente, existe uma maneira de tornar tudo isso menos trabalhoso: a Virtude de Taças pode reduzir a quantidade de gestos exigidos por uma carta, conforme o nível de aptidão do Record.

*II. Cânticos*

Os Cânticos funcionam de maneira um pouco diferente.

Cada Coleção possui seu próprio texto ritualístico, composto por linhas que devem ser vocalizadas para permitir a invocação de suas cartas. Diferentemente dos Gestos, que são compartilhados livremente entre cartas, os Cânticos pertencem às respectivas Coleções e não devem ser confundidos entre si.

Uma mesma Coleção pode conter cartas de diferentes raridades, mas isso não significa que todas precisem recitar o texto completo. Pelo contrário: *a raridade da carta determina até qual linha do Cântico você precisa vocalizar.*

Imagine, por exemplo, que você tenha encontrado a Coleção *Inúteis*. Seu Cântico é composto pelo seguinte poema:

> Imagine que isso é um poema muito bom.
>
> Esse poema é tão incrível que você vai amar.
>
> Sinta a força desse poema maravilhoso.
>
> Sob o luar.
>
> Lindo.

Sim, Record. Você precisará lidar com isso.

Entretanto, a quantidade de linhas exigidas depende da carta que pretende invocar.

- *Carta Comum:* exige somente a primeira linha. Basta dizer: *"Imagine que isso é um poema muito bom."*
- *Carta Rara:* exige as duas primeiras linhas. Você deverá dizer: *"Imagine que isso é um poema muito bom. Esse poema é tão incrível que você vai amar."*
- *Cartas de outras raridades:* exigirão a quantidade de linhas correspondente à sua posição na escala da Coleção.

Observe que você não escolhe quais linhas deseja recitar. A invocação deve seguir a ordem original do texto, começando sempre pela primeira linha e avançando até alcançar o trecho exigido pela carta.

*Como identificar o limite do Cântico?*

Nos textos disponibilizados pelo site, as linhas dos Cânticos são organizadas com marca-textos coloridos que indicam os limites correspondentes às diferentes raridades.

Para saber até onde precisa vocalizar, basta observar *até onde se estende a cor correspondente à raridade da sua carta*.

Não é necessário memorizar o poema inteiro, contar versos manualmente ou adivinhar onde a invocação termina. A própria formatação do texto indica o trecho necessário.

## III. Complexidade das Coleções

Nem todas as Coleções possuem a mesma extensão ou complexidade ritualística. Por isso, os Cânticos são organizados em três padrões principais.

*Coleções Básicas*

São as mais simples e comportam, normalmente, cinco linhas de Cântico, distribuídas entre as raridades. Cada raridade corresponde a uma extensão específica do texto, conforme a marcação apresentada no site.

*Coleções de Complexidade Média*

Possuem o dobro da extensão ritualística das Coleções Básicas. Para invocar uma carta de determinada raridade, você deverá vocalizar o dobro da quantidade de linhas exigida pela mesma raridade em uma Coleção Básica.

*Coleções Complexas*

Possuem o triplo da extensão ritualística das Coleções Básicas. Consequentemente, a invocação de uma carta exige três vezes a quantidade de linhas normalmente necessária para sua raridade.

Esses padrões servem como referência geral. Algumas Coleções possuem regras próprias e não seguem essa distribuição, seja por exigirem uma sequência específica, seja por dispensarem completamente a necessidade de um Cântico.

Nesses casos, o site apresentará um aviso indicando as condições especiais da Coleção. Quando houver uma regra particular, ela sempre terá precedência sobre os padrões gerais.

Portanto, antes de invocar uma carta, verifique a complexidade de sua Coleção e observe a marcação colorida do Cântico. Assim, você saberá exatamente qual trecho precisa recitar.

*IV. A Virtude de Taças*

Record, talvez você esteja pensando que recitar poemas inteiros e executar movimentos ritualísticos parece um trabalho excessivo para alguém que só deseja utilizar uma carta.

Felizmente, existe uma Virtude capaz de tornar esse processo consideravelmente mais simples.

*Taças (Virtude nº 5)* representa, entre outras coisas, a facilidade com que você consegue utilizar uma carta e cumprir seus requisitos de invocação.

Conforme seu nível nessa Virtude, você pode obter três vantagens principais:

- *Redução de Gestos:* diminui a quantidade de movimentos exigidos pela carta.
- *Simplificação do Cântico:* reduz a quantidade de linhas que precisam ser vocalizadas.
- *Supressão da Vocalização:* permite recitar o Cântico mentalmente ou, em níveis superiores, eliminar completamente a necessidade de recitação.

Essas vantagens dependem do nível de Taças exigido para cada redução. Não basta possuir a Virtude: é necessário alcançar o patamar correspondente à vantagem pretendida.

Além disso, as reduções devem respeitar os requisitos individuais da carta e as regras particulares de sua Coleção. Dispensar a vocalização, por exemplo, não significa necessariamente dispensar os Gestos.

Em resumo, quanto maior sua aptidão em Taças, menos exigente poderá se tornar o processo de invocação.

*V. O Recuo Paranormal*

Nem toda invocação acontece sem consequências, Record. Em determinadas circunstâncias, o próprio destino parece se voltar contra aquele que tenta utilizar forças que não consegue controlar.

Esse fenômeno é conhecido como *Recuo Paranormal*.

O recuo representa uma consequência adversa associada à utilização inadequada de uma carta. Pode manifestar-se como um simples contratempo, um episódio de azar inesperado ou uma ocorrência consideravelmente mais grave, dependendo da intensidade envolvida.

Entretanto, preste atenção: *o Recuo Paranormal não é um dano automático sofrido após toda invocação.*

Se você cumprir corretamente os requisitos de uma carta e respeitar suas condições de utilização, não deverá presumir que sofrerá uma penalidade apenas por ter invocado seu efeito.

O recuo está particularmente relacionado às situações em que você descumpre os requisitos de invocação, interrompe o processo de preparação ou tenta utilizar uma carta sem atender às condições necessárias. Algumas cartas, porém, podem estabelecer exigências próprias, inclusive um nível mínimo de Recuo Paranormal para sua utilização. Quando isso acontecer, a condição específica deverá ser respeitada.

A intensidade do recuo é expressa por níveis. Quanto maior o nível, mais severa poderá ser a consequência narrativa.

*Escala de Recuo Paranormal*

A tabela abaixo serve como referência para interpretar a intensidade de um recuo. Os exemplos são ilustrativos, e a manifestação exata pode variar conforme a situação narrativa.

| *1 — Insignificante* | Azar simples e inconvenientes menores. | Tropeçar sem sofrer consequências relevantes, deixar um objeto cair ou esbarrar em alguém por distração. |
| *2 — Leve* | Contratempos perceptíveis, mas facilmente contornáveis. | Derrubar algo importante, perder uma oportunidade trivial ou ter um pequeno imprevisto que atrase seus planos. |
| *3 — Moderado* | Complicações capazes de prejudicar uma ação ou situação imediata. | Um equipamento falhar no momento inconveniente, uma informação chegar tarde ou um erro de execução comprometer uma tarefa. |
| *4 — Grave* | Ocorrências que provocam consequências sérias e exigem uma resposta imediata. | Um acidente significativo, uma falha crítica de equipamento ou uma circunstância inesperada que coloque o Record em uma situação perigosa. |
| *5 — Severo* | Acontecimentos de grande impacto, capazes de alterar drasticamente uma situação. | Uma sequência de imprevistos que comprometa uma operação inteira ou um acidente de consequências graves. |
| *6 — Catastrófico* | Uma adversidade excepcional, com repercussões extensas ou duradouras. | Uma sucessão extraordinária de acontecimentos desfavoráveis que provoque uma crise de grandes proporções. |

Essa escala não determina acontecimentos obrigatórios. Um recuo de nível 2, por exemplo, não precisa sempre resultar na perda de um objeto; pode assumir outra forma de azar de intensidade equivalente dependendo do critério narrativo.

Da mesma maneira, um nível elevado não significa que o Record sofrerá necessariamente dano físico. O recuo pode atingir seus planos, seu ambiente, seus recursos ou as circunstâncias ao seu redor.

O importante é que a manifestação seja coerente com o nível estabelecido e com a situação em que ocorreu a falha.

*Como Paus interfere no Recuo, ADM RUP?*

*Paus (Virtude nº 1)* representa a capacidade de suportar adversidades, estando associada à Resistência e ao Vigor.

No contexto dos Ritos de Invocação, essa Virtude determina quanto o Record consegue resistir ao Recuo Paranormal e reduzir suas consequências.

O dano de referência de uma carta é composto por dois elementos:

*Dano Paranormal = Dano-base da raridade + Adicional de balanceamento da carta.*

O dano-base estabelece uma intensidade mínima de referência de acordo com a raridade, enquanto o adicional considera as particularidades do efeito, como sua potência, abrangência e complexidade.

| Comum | 10 |
| Incomum | 20 |
| Rara | 30 |
| Ultra-Rara | 40 |
| Lendária| X |

Esses valores são referências de balanceamento, não pontos de vida. Devo não utiliza um sistema de HP, portanto o dano calculado deve ser interpretado narrativamente.

Para determinar a redução, compara-se o nível de Paus do Record com o nível de referência estabelecido para a carta:

| Paus inferior ao nível de referência | 0% |
| Paus equivalente ao nível de referência | 25% |
| Paus um nível acima | x% |
| Paus dois níveis acima | x% |
| Paus três ou mais níveis acima |100% |

A redução incide sobre o dano total de referência, incluindo o adicional de balanceamento. O resultado final não pode ser inferior a zero.

Se Paus for suficientemente elevado para anular o dano calculado, o Record poderá resistir completamente àquela intensidade de recuo. Isso não significa, entretanto, imunidade automática a todas as consequências narrativas possíveis.

*Importante:* a escala de dano e as reduções acima servem para estabelecer a intensidade de referência do recuo. Elas não significam que todo uso de uma carta provoque esse dano. A penalidade somente deverá ser aplicada quando as condições da carta ou as regras de invocação determinarem que houve um recuo.

--

o sistema de afinidades com npc:

*# [Um Visitante apareceu]*

[Visitantes são NPCs que possuem um sistema próprio de afinidade evolutiva.]

[De tempos em tempos, eles poderão aparecer na sua casa em busca de conversas fiadas, favores ou até mesmo intrigas.]

[A afinidade com cada Visitante é determinada pelas Essências de Afinidade.]

[Sempre que interagir com um deles, pense cuidadosamente em cada resposta. Suas escolhas podem criar, fortalecer ou prejudicar o relacionamento.]

[A maneira mais simples de evoluir esse vínculo é oferecer presentes compatíveis com os gostos pessoais do NPC.]

[Você pode adquirir esses presentes no Poço dos Milagres ou durante eventos.]

[Dependendo do grau de afinidade alcançado, um NPC com quem você tenha construído um vínculo suficientemente forte poderá recompensá-lo com Chaves de Torres, Pacotes de Cartas, Dracmas e muitos outros]

[Os NPCs com os quais você desenvolve relacionamentos ficam registrados no sistema, permitindo que seu vínculo seja consultado posteriormente.]

|

*# [Decorações]*

[A loja de decorações oferece móveis e enfeites capazes de aumentar as chances de um NPC específico aparecer na sua casa.]

[Cada NPC possui preferências próprias quanto à decoração. Por isso, alguns itens podem aumentar a probabilidade de certos Visitantes aparecerem, mas também reduzir as chances de atrair outros.]

|

*# [Hostilidade]*

[Visitantes hostis são diferentes daqueles que aparecem apenas em busca de confusão. Seu objetivo é prejudicá-lo diretamente, provocando problemas e causando sofrimento de diversas formas.]

[Quando um NPC hostil aparecer, você deverá encontrar um esconderijo o mais rápido possível ou descobrir alguma maneira de lidar com a ameaça.]

[Algumas decorações específicas podem reduzir as chances de Visitantes hostis aparecerem na sua casa.]

|

*# [Quartos de Hóspedes]*

[Quando sua afinidade com determinado NPC atingir um nível suficientemente alto, você poderá convidá-lo para morar na sua casa por tempo indeterminado.]

[Ter um Visitante como morador pode render recompensas secretas e desbloquear o acesso exclusivo a determinadas funções.]

[Entretanto, nem todos os Visitantes aceitam esse tipo de convite. Portanto, se você pretende construir esse vínculo com um personagem específico, certifique-se de que ele permite essa possibilidade antes de investir seu tempo nessa relação.]

--

também terá uma segunda tela onde possui os npcs já conhecidos, e você pode marcar ele com "paixão", isso faz ter mais chances dele aparecer e então você desbloqueia uma segunda barra com romance (além da de afinidade). conforme sobe seu romance você desbloqueia diálogos e até mesmo uma imagem especial de encontro (assim como é em amor doce) 

e por falar nisso, por agora se tratar de rpg maker, ao entrar nesse sistema de casa, há um tutorial de "fantasia" que é então a criação do avatar, com opções de penteado, pele, olhos, cor, roupas, etc. quero inspirado em animes. 

crie o sistema de doar suas horas a outro jogador, mas se fizer isso a alguém que não é da sua companhia, é crime, então você ganha mais pontos necro.. 

mas o que são pontos necro? existe o sistema de "caos e ordem" onde determinadas ações te dão honra ou necro. como sabe as necro companhias são detestadas pela companhia dos records. isso afeta as Torres de companhia e se npcs se comportarão de forma hostil ou não. 

essa parte ainda está em construção. 


--

para cada tela, coloque um subagente e um crítico. quero que compare lado a lado com rpgs makers e visual novels famosos e bem avaliados, além das referências enviadas. também acesse minha conta no pinterest para maiores apoios visuais, seja vendo meus pins salvos ou pesquisando referências. não poupe recursos ou qualidade, quero algo digno de um triple A. 

também otimize sistemas caso veja alguma brecha, como por exemplo na própria tela do salão de máscaras, se você for anfitrião para cima, poder autorizar de lá e também editar se já quer que um salão abra agora no padrão de três dias, ou que um owner possa desfazer a ação de alguém ter enviado recompensa, etc. pode sempre dar sugestões de coisas que seriam interessantes e eu aprovo se gostar. 
 
lembrando que é para redesenhar todas as telas, esqueça tudo que tem atualmente. inclusive os npcs, também tem que estar no padrão indicado. 

jogadores novatos: o único devo que aparece para ele é o chamado "tutorial". ou seja, caso um dealer ou quem quer que crie um devo, tem o tipo tutorial. este é apenas para alguém entender como funciona lá no WhatsApp, é apenas para tipificar. assim que finalizar um tutorial aí ele pode ver todos os outros devos que estão abertos para inscrição e as demais coisas. 

sobre a casa, quero que eventualmente a pessoa possa alterar a skin dela e mais cômodos, como uma melhoria basicamente ao subir de nível (ainda estamos discutindo essa parte, mas já deixe estruturado..) 

o card shuffler passa a ser outro objeto, agora que existe a questão do rito e tudo mais..
- 02/11, noite: "deixe o resto com o mesmo padrão, exceto a casa que é pixelart"; "calendário não está tão legal. falta mais carinho nos detalhes das outras telas"; com o pin https://pin.it/vto6vCD9b (roster de Reverse: 1999): "quero o calendário assim", "cada tela tem sua atmosfera própria! aprimore em detalhes", "quero o mais fiel possivel a referencia". Calendário refeito fiel ao pin (`art-src/cal1999/`, `art-src/refs-pin/`); cada tela com pintura própria (`art-src/atmos/`); cenas em pixel trocadas por anime (`art-src/cenas-anime/`, originais em `art-src/pixel-antigo/`). Sobre o Calendário: "Ficou".
- Sobre a tela de entrada nova (`kit3/entrada.html`, arte em `art-src/entrada/`): "a tela inicial do devo e convite, pode manter o da versão anterior". Fica a landing e o acesso por convite atuais (`components/devo/landing/*`, `components/devo/naming/access-screen.tsx`); o protótipo de entrada não será usado.
- Logo depois: "lembrando que o devo é um jogo sombrio". Vale para tudo: do Star Rail vem a forma e o acabamento; o clima é sombrio.
- "Escurecer antes" e "e também ajustar os icones. disseram que ainda está meio ia". Passada sombria (paleta quase preta, ouro envelhecido, névoa, vinheta e grão; atmosferas e brilhos apagados) e ícones redesenhados em 2D com sombreado em 3 tons, sem brilhos (`art-src/icones-sombrios/`; os anteriores em `art-src/icones-anteriores/`). Pulso (coração com relógio) e Máscaras (máscara veneziana) mantêm o conceito pedido antes. Sobre a versão sombria e os ícones novos: "Ficaram".
- "Seguir": Torres de Ruptura em pixel, no motor da Casa (`kit3/torres.html`, arte em `art-src/torres-pixel/` → `art/torres/`). A porta da Casa agora leva para fora, à ilha das Torres (Casa no canto, Ruptura, Imperador, Observatório e Picadeiro); dentro, a escada em espiral com os andares do `lib/devo/torres/conteudo.json`, custo em Essências que dobra, cena com o NPC e prêmio (as secundárias dão a chave). Sobre as Torres: "Aprovo". Com isso a sequência do v2 no protótipo está completa.
- Notas do Rup (`NOTAS-RUP-02-11.md`): Residência aprovada ("Aprovo, seguir"). Simon, o Carteiro, feito (`kit3/visita-simon.js`, arte em `art-src/simon/` → `art/simon/`): campainha, olho mágico e o primeiro diálogo literal com todas as escolhas; guarda-chuva vai para o inventário se ficar. Dono: "pode seguir, mas n esqueça q ele e os outros npcs são meio pixel art como a melissa já foi usada de exemplo" — Simon refeito em meio pixel (metade do tamanho, paleta curta, mostrado em 2x). Catedral de Damasco feita (`kit3/catedral.html`, arte em `art-src/catedral/`): primeiro diálogo da Ordem literal, Erick Zorak em meio pixel, altar com Orar e as quatro oferendas com as probabilidades do Rup, bênçãos e maldições, saudações e despedidas sorteadas. Na Casa, o destino "???" leva à primeira visita. Aguardando aprovação.

### 02/11/2026 — Catedral endireitada

Dono: "cenário da igreja tanto dentro quanto fora estrão tortos".
As duas cenas estavam em vista diagonal (isométrica). Foram redesenhadas de frente e simétricas, no mesmo ângulo reto da
Torre: fachada com as duas torres de sino iguais, caminho reto até a porta; dentro, o tapete sobe pelo meio até o altar,
bancos iguais dos dois lados. Paleta sem roxo mantida (pedra cinza-esverdeada, vermelho-sangue, âmbar, ouro velho).
Fontes em `kit3/art-src/catedral3/`. Aguardando aprovação.

### 02/11/2026 — Simon mais velho, balões equilibrados, poses novas

Dono: "deixe o carteiro mais velho. ele parece criança. algo como um adolescente/jovem adulto" e, logo depois,
"apenas ajuste as proporções, gosto do design atual".
Simon refeito com o MESMO design (boné, casaco, bolsa, bermuda com meião, botas, cores), só com proporções de jovem
adulto (cabeça menor, pernas e tronco mais longos, pescoço, rosto mais maduro). Oito poses: sorriso, animado, malícia,
decepcionado, nervoso, irritado, surpreso, cantando. Fontes em `kit3/art-src/simon2/`.
Balões: além de passar o que sobra para o balão seguinte, agora os balões de uma mesma fala saem de tamanho parecido
(nenhum fica com uma ponta solta). Erick: quatro poses novas (observando, decepcionado, interessado, convite), recorte
corrigido. Chibis: passos com sobe-e-desce, inclinação, poeira, impulso ao sair; parado, respira e olha em volta.
Aguardando aprovação.

### 02/11/2026 — Diálogo do busto para cima, sprites novos do Simon em todo lugar, chibi refeito

Dono: "ainda tem sprites do carteiro menor. ajuste com a nova atualização. nos diálogos n precisa aparecer o corpo todo
do npc, pode por do busto para baixo (salvo cenas especiais) a animação chibi ainda não está boa".
- Imagens e scripts com versão no endereço (`?v=`), para o navegador não mostrar mais o Simon antigo guardado.
- Diálogos: NPC aparece da cabeça até a cintura (a parte de baixo fica atrás da caixa). Corpo inteiro só em cena
  especial: a porta se abrindo / revelação da altura do Simon, a despedida de longe, e a primeira aparição do Erick.
- Chibi: folha nova (`folhaAndar` em avatar-cor.js) com ciclo de 8 passos por direção, feito em pixel inteiro. De frente e
  de costas, cada pé sai do chão na sua vez, as mãos balançam cruzadas, o corpo sobe e desce 1 px, o cabelo acompanha
  com um quadro de atraso. Parado, respira (ombros descem 1 px). Tirados o giro e o esticar por CSS, que borravam o pixel.
Aguardando aprovação.

### 02/11/2026 — Simon unificado, Erick novo (texto do dono), chibi articulado com supervisor

Dono: "TA A MESMA COISA. tem a versão adolescente e a jovem. faã as versões adolescentes do zero. as animações chibis
estão pessimas, coloque um chibi para supervisionar, pois o rosto n acompanha certo o corpo".
- Simon: as 8 poses refeitas numa folha só (`art-src/simon2/simon-todas.png`), todas com o rosto e a idade de jovem adulto.
- Chibi: boneco articulado (cabeça, rosto, cabelo e tronco presos; só pernas e botas mudam), ciclo pela distância andada,
  velocidade 78 px/s. Um agente supervisor de animação revisou os quadros e as correções dele entraram.
Dono, aparência do Erick (texto literal em `npcs/erick.md`). Erick redesenhado: pele acobreada, olhos amarelo-pálidos,
cabelo branco preso, alto e um pouco curvado, batina negra larga só com prata, anéis nas mãos; 8 poses, incluindo
"livro" (livro sob o braço). Aguardando aprovação.

### 02/11/2026 — Pernas do chibi redesenhadas e Simon refeito

Dono: "pode resenhar. o simon também. quero ele lindo, um homem, mas um pouco mais jovem. o refaça".
- Pernas: `art-src/pernas_chibi.py` redesenha, para as 12 roupas, as pernas do quadril para baixo (8 quadros por
  direção, cores de cada roupa): de lado, contato/passagem/impulso com joelho e pernas se cruzando; de frente e de
  costas, pés alternando, a perna que sobe dobra, a de apoio abre no contato; bota grossa. Saída:
  `art/avatar/chibi/roupa-<n>-<f|m>-andar.png`. Velocidade 62 px/s, ciclo pela distância. Revisado 4 vezes pelo
  agente supervisor de animação. Pendente: balanço dos braços (precisa de máscara das mãos).
- Simon v4 (`art-src/simon2/simon-v4.png`): mesma roupa que o dono aprovou, rosto mais bonito e um pouco mais jovem
  (rapaz de ~18), 8 poses numa folha só. Uma tentativa intermediária (v3) mudou a roupa e foi descartada.
Aguardando aprovação.

### 03/11/2026 — Evento de Conflito (item 8 do Rup)

Dono: "Aprovo, seguir" (Simon v4 e chibi aprovados). Próximo da ordem do Rup: Evento de Conflito.
App novo "Evento de Conflito" (`kit3/os-conflito.js`, ícone e arte em `art/os/conflito/`, fontes em
`art-src/conflito/`). Textos do Rup literais. Abas: Conheça (as duas organizações, apoiar um lado), Marcos (ocultos até
escolher; placar da última apuração de sábado; trilha dos 5 Marcos com prêmios) e Loja de Karma (6 itens de cada lado,
limite universal, compra com confirmação). Trocar de lado mostra o aviso de fidelidade e "Tem certeza de que deseja
trocar de lado?". Pendente de decisão: o tipo de Karma ("RUP, AQUI, A COISA DO KARMA"); a tela usa "Seu Karma" e
"Karma da Companhia/Ordem"; a penalidade da troca ainda não tem valor; as cenas dos Marcos ainda não foram escritas.
Aguardando aprovação.

### 03/11/2026 — Evento de Conflito refeito com crítico de arte

Dono: "cores e layout super genéricos, sendo que já apontei que quero atmosfera e personalidade nas telas. ajuste e
ponha um crítico nisso".
Um agente crítico de direção de arte avaliou a tela e propôs a direção "Dossiê e Grimório": a Companhia é papel de
ofício, aço, carimbo e prata (Barlow Semi Condensed, IBM Plex); a Ordem é pergaminho, veludo, cera, ouro gasto e vela
(Cormorant, EB Garamond, Cinzel). Sem lado escolhido a tela é ferro e névoa; ao escolher, tudo troca de material e a
metade do outro lado apaga no topo. Arte nova em `art-src/conflito2/` (topos, brasões, agente e ocultista, texturas,
placas e velas dos Marcos, pedestais, carimbos, credencial, lacre, fichas, prêmios). Estilo em `kit3/os-conflito.css`.
Duas revisões do crítico; as correções apontadas entraram. Nomes de interface sugeridos ("Loja da Companhia/Ordem",
"Cena do Marco") aguardam o dono. Aguardando aprovação.

### 03/11/2026 — Pacote da Companhia; Ranking Geral da Temporada (item 4 do Rup)

Dono: "só ajuste algo. É pacote da companhia. depois pode seguir". O "Pacote da Campainha" do texto do Rup virou
"Pacote da Companhia" (nome e ícone com a chave da Companhia; correção anotada em NOTAS-RUP-02-11.md). Evento de
Conflito aprovado.
Ranking: app novo "Ranking da Temporada" (`kit3/os-ranking.js`, `os-ranking.css`, arte em `art/os/ranking/`). Direção do
crítico de arte, "O Relógio dos Autômatos": relógio astronômico da praça do Devo marca a temporada (o ponteiro anda com
o tempo que passou); cinco autômatos de relógio guardam as categorias literais do Rup (Juiz, Colecionador, Astrônoma,
Esqueleto do Sino, Carrasco — nomes propostos, passam pelo Rup); pódio em pedestais de pedra e bronze sob um lampião;
lista com foto do jogador (quem não tem foto aparece com a inicial); placa "sua posição". Mortes: lápides tortas, coroa
fúnebre no primeiro, fita de luto, o esqueleto puxa o sino uma vez. Duas revisões do crítico. Aguardando aprovação.

### 03/11/2026 — Papel de parede da Corporação (item 3 do Rup) e chat da Corporação

Dono: "aprovo, seguir" (Ranking aprovado). Depois: "acredito que porque terá o chat da corporação. O papel de parede pode
ser esses padrões, mas também deixe que o líder possa escolher algum arquivo do aparelho dele".
- Corporações ganhou a aba **Chat** (todos os membros): mensagens da Corporação correndo por cima do papel de parede.
- Aba **Parede** (só o líder): "Escolher do aparelho" em primeiro (arquivo do aparelho, reduzido a 1600 px), seis padrões
  pintados (Biblioteca dos relógios, Porto na névoa, Salão abandonado, Telhados ao luar, Floresta de lanternas,
  Engrenagem do abismo) e "Fundo do sistema". O escolhido ganha a fita "Na parede".
- O papel aparece atrás do chat, na parede do salão (atrás do brasão) e no fundo do sistema enquanto a Corporação está
  aberta; ao fechar, volta o fundo normal. Crítico de arte revisou; no protótipo fica guardado no aparelho.
Aguardando aprovação.

### 03/11/2026 — Moderação: advertência, suspensão e banimento (item 2 do Rup)

Dono: "aprovo, pode seguir" (papel de parede e chat da Corporação aprovados).
Mesa › Jogadores (`kit3/os-moderacao.js`): busca, ficha, nova sanção (Advertência / Suspensão / Banimento;
temporária com data de retorno ou permanente), motivo obrigatório marcado "o jogador vê", nota de gestão marcada "só a
equipe vê" (fica no histórico), prévia da tela do jogador, confirmação com resumo; para banir é preciso digitar o
Record do jogador; encerrar suspensão/banimento pede confirmação. Tela do jogador ao entrar: carta lacrada
(advertência, com "Entendi"), relógio acorrentado (suspensão, com a data e quantos dias faltam), ampulheta quebrada
(banimento) e "Sair da conta". Crítico de arte revisou.
Pendente de decisão: diferença entre "suspensão permanente" e "banimento permanente"; o que acontece com o Tempo da
conta suspensa; quem da equipe pode banir (no protótipo, Anfitrião e Owner); canal para o jogador falar com a equipe.
Aguardando aprovação.

### 03/11/2026 — Dificuldade do Deadly Vote por naipes, Coringa e Red Coringa (item 12 do Rup)

Dono: "aprovo, seguir" (moderação aprovada).
Direção do crítico de arte "O Peso do Destino": cada Deadly Vote tem uma carta de baralho (naipe + valor). Do Ás ao
Dez os naipes enchem a frente, o papel escurece e as cantoneiras passam de nenhuma a latão e a ferro (corrente no Dez).
Figuras (Valete, Rainha, Rei) com o rosto escondido; Coringa é uma fantasia vazia; Red Coringa é o Coringa com mancha
escarlate (único escarlate do sistema). Arte em `art/os/baralho/`, código em `kit3/os-baralho.js` e `os-baralho.css`.
- Mesa › Casos: escolher naipe e valor ao convocar (com a faixa de XP/horas do Rup); mini carta em cada dossiê; no caso
  em andamento, "Revelar Red Coringa" (segurar 1,5 s, não tem desfazer).
- Record › Deadly Votes: a carta na convocação; "Como funcionam as dificuldades" com o texto do Rup literal e a escada;
  aviso em tela cheia do Red Coringa para os inscritos.
Pendente de decisão: XP ainda não existe no jogo; letras dos cantos (usei J, Q, K); "Às" e "6400" estão como no texto
do Rup; quem pode revelar o Red Coringa (no protótipo, quem vê o caso na Mesa); se o tutorial fica sempre no Ás.
Aguardando aprovação. Com isto, os 8 itens do Rup estão feitos no protótipo.

### 03/11/2026 — Cartas de dificuldade brancas

Dono: "aprovo, mas não gostei dessas cartas bege" e depois "quero as cartas brancas".
Frente, Coringa, Figuras e naipes refeitos em branco limpo (#F5F5F2), tinta preta e carmim, filete de ouro
(`art/os/baralho/c/`, fontes em `art-src/baralho/vC-*`). É o padrão agora. As versões escuras feitas para comparar
(laca negra com ouro, azul-noite com prata) ficam guardadas em `art/os/baralho/a` e `b` (?baralho=a|b).
Dificuldade por cartas aprovada.

### 03/11/2026 — Cartas brancas aprovadas

Dono: "aprovo". Os 8 itens das notas do Rup (02/11) estão feitos e aprovados no protótipo kit3. Nada commitado ainda.

### 05/11/2026 — Animações revisadas por críticos; funções da equipe no Salão das Máscaras

Dono: "ainda não [commit]. revise por favor as animações dentro dos personagens dentro da casa e adicione mais se
necessário. e também, as dos npcs. coloque críticos para avaliarem. outra coisa, quem for adm (anfitrião pra cima)
pode aceitar cartas no próprio salão de máscaras se quiser, mas só aparece essa opção pra ele. outras funções do salão
de máscaras também".
Dois agentes críticos de animação (um para o chibi na Casa, um para os NPCs) avaliaram, e revisaram de novo depois.
- NPCs: motor único `kit3/npc-vn.js` (Simon e Erick): escala inteira, figura presa pela cabeça (o rosto não pula ao
  trocar de pose), respiração no ritmo de cada um, reações por emoção (pula, susto, treme, tremor, murcha, inclina,
  balança), texto letra a letra com pausas e voz curta só de quem fala, primeiro toque completa. Simon: porta abre em
  fresta com rangido, some enquanto revira os armários, porta fecha com baque. Erick: entra no "susto" virando a cena,
  quase não se mexe; reação ao ritual quando o resultado fecha.
- Chibi: piscar (às vezes duas vezes), peito respirando, olhar só com os olhos (de lado, vira a cabeça), assentar ao
  chegar, virar para o objeto, balões em pixel ("!", "?", "…", "♪", gota), som de passo dentro de casa (poeira só fora),
  sombra em pixel; ao tocar a campainha, "!", vira e vai até a porta.
- Salão: Anfitrião e Owner veem, no próprio Salão e marcado "Equipe": aceitar/recusar cartas da Bandeja, publicar/
  recusar anúncios, editar/cancelar lotes da próxima edição e abrir/fechar o Salão. Contrato e calendário só o Owner.
  Dealer e jogadores não veem nada disso.
Pendente (indicado pelos críticos): braços balançando e barra do casaco no andar (arte procedural, como as pernas);
piscar e boca nas figuras do Simon e do Erick; Torres, Melissa e Herdeiro no mesmo motor; ociosidade longa e
interações com móveis. Aguardando aprovação. Nada commitado.

### 06/11/2026 — Braços do chibi balançando ao andar

Dono: "Pode fazer" (braços balançando no andar).
- `art-src/pernas_chibi.py` agora também mexe braços e barra: o quadro parado é deformado em pixel inteiro (sem borrão)
  e a mão anda inteira, a manga acompanha do ombro até a mão. De lado, a mão da frente vai e volta 3 px, oposta à perna
  de cá; a de trás, 1 px ao contrário. De frente e de costas, o braço que vai à frente sobe e entra 1 px e o outro abre
  1 px. A barra do casaco arrasta sempre um pouco, mais na passagem. Mãos do corpo em `corpo-<f|m>-andar.png`.
- Crítico de animação revisou: aprovou o ritmo e a fase; pediu amplitude maior, barra contínua, cortes suaves na manga
  e achou uma fresta de 1 px no quadro de respiração (corrigida em `avatar-cor.js`). Tudo aplicado.
Dono: "Aprovo". Nada commitado.

### 06/11/2026 — Simon e Erick piscam e mexem a boca ao falar

Dono: "Pode fazer" (piscar e boca dos NPCs).
- `art-src/anima_npcs.py`: sem rosto novo; cada pose ganha a figura de olho fechado, de boca no outro estado e as
  duas juntas (`art/simon/anim/`, `art/catedral/anim/`, com `anim.json`). Olho fechado no estilo dos olhos fechados da
  própria arte: uma linha de cílio em arco, sombra da pálpebra acima, sobrancelha e cabelo intactos. Boca aberta fecha
  2 px; boca fechada ganha uma fresta. Poses já de olhos fechados (e a "malícia", de pálpebra baixa) não piscam; o
  Erick "interessado" tem a mão na boca e não mexe a boca.
- `npc-vn.js`: só troca a figura. Simon pisca a cada 2,2–5 s (100 ms), Erick a cada 3,5–7,5 s (160 ms), às vezes
  duas vezes; nunca logo depois de mudar de expressão. A boca alterna enquanto saem as letras, só de quem fala, volta
  ao desenho nas pausas da pontuação. O Erick escreve mais devagar (34 ms por letra, contra 24 do Simon). Nada disso
  com movimento reduzido.
- Crítico de animação reprovou a 1ª versão (olhos fechados viravam "caixinhas", dois erros de estado no motor);
  refeito e revisado de novo: liberado para mostrar.
Dono: "retire as animações dos npcs falando. deixe somente para os chibis deles". Os retratos agora só piscam (a
variação de boca não é mais gerada: `BOCA_NOS_RETRATOS = False` em `anima_npcs.py`; o motor continua sabendo mexer a
boca se a variação existir). O Simon e o Erick ainda não têm chibi: a boca falando entra quando eles ganharem um.
Nada commitado.

### 06/11/2026 — Chibis do Simon e do Erick

Dono: "Pode fazer" (chibis dos NPCs, já com a boca falando).
- Arte gerada (Codex, `art-src/npc-chibi/simon2|erick2/`) e fatiada em pixel de verdade por `art-src/chibi_npc.py`
  na escala do chibi do jogador: `art/npc-chibi/simon.png` e `erick.png` (8 colunas: andar 0..3, parado, boca aberta,
  olhos fechados, os dois; linhas frente, esquerda, direita, costas). Boca e piscar em pixel, posições em
  `art-src/npc-chibi/rosto.json`.
- Simon: rapaz magro da altura do jogador, quepe com estrela, bolsa de carteiro. Erick: bem mais alto, um pouco
  curvado, mãos atrás da cintura (não balança os braços), um rabo de cavalo, olhos amarelo-pálidos.
- Crítico de arte reprovou a 1ª geração (Simon infantil, Erick baixo e sem os olhos amarelos); refeita e revisada.
- Motor dos chibis dos NPCs no mapa em `kit3/npc-chibi.js` (anda, respira, pisca, fala; o laço dorme quando escondido).

Dono: "Na porta e na Catedral" → "Rosto na caixa" → "nas interações normais, deixe assim. porém dialogos mais longos
(como a própria primeira aparição), deixe o NPC ocupado a tela mesmo".
- Interações curtas: o retrato grande sai; o chibi do NPC fica no cenário e a boca dele mexe junto com as letras
  (`npc-vn.js`, opção `boca`); a caixa ganha o rostinho da pose atual (`NPCVN.rostinho`, recorte da própria arte pela
  janela do rosto, sempre 76 px). Catedral: visita comum e altar com o Erick no corredor e você de costas para a tela
  (`catedral.html`, `palco`/`usaPalco`). Casa: palco da porta pronto (`palcoVisita` em `casa.html`, Simon na soleira,
  entra e revira a casa, volta, sai quando a porta fecha) para as visitas curtas; `?palco=1` mostra.
- Diálogos longos (a primeira visita do Simon, a primeira visita à Catedral): retrato grande, como antes.
- Crítico de interação revisou: corrigidos o Erick desenhado por cima de você, o rostinho com tamanhos diferentes e
  mal cortado, o Simon de lado sem boca, o rostinho atrasado, os chibis fora do escurecer da saída e o laço rodando
  escondido.
Sobre as conversas com os chibis no cenário (curtas) e o retrato grande (longas): "Aprovo". Nada commitado.

### 07/11/2026 — Chibi do jogador mais bonitinho (prova)

Dono: "sobre os chibis de jogadores. deixe eles mais bonitinhos. estilo ddtank".
- Crítico de arte, antes: o chibi atual é "um boneco adulto encolhido" (cabeça pequena, cerca de 3 cabeças de altura,
  rosto vazio de lado, braços em alfinete, preto sobre preto). Especificação nova "fofo sombrio": cerca de 2 cabeças,
  olhos grandes com dois brilhos, bochecha, boca pequena, mãos redondas, botas arredondadas, franja nunca cobrindo os
  olhos, contorno no tom escuro de cada material, continua em pixel art (a Casa é pixel). O nome do jogo não entra no
  pedido de arte; só a ideia de proporção e fofura.
- Prova estática com duas aparências (moço de cabelo castanho longo e casaco vinho; moça de cuia platinada e casaco
  preto), quatro vistas, reduzida para pixel de 72 px na célula de 80x96 (`art-src/chibi-fofo/`, `prova.py`,
  `retoque.py`). Crítico revisou; entraram boca calma, segundo brilho no olho, cabelo limpo, sem a borda lilás,
  contorno cinza-malva no cabelo claro, sombra de contato. Capturas: `capturas-02-11/chibi-fofo-mapa.png` e
  `chibi-fofo-vistas.png`.
- Se aprovado, a ordem é: as 4 vistas paradas em peças, o andar, troca de cores e um segundo cabelo, o corpo masculino,
  os outros cabelos e roupas, e por fim os chibis dos NPCs na mesma família.
Sobre a prova: "Aprovo".

Primeira etapa em peças (corpo feminino, roupa 1 = casaco preto, cabelo 1 = cuia):
- Arte gerada no Codex (`art-src/chibi-fofo/f-base8`, `f-base`, `f-cab1`): o corpo careca já vestido, andando em 8
  desenhos por direção (contato, baixo, passagem, alto), braços balançando; o cabelo em azul, para virar camada de cinza.
  `art-src/chibi_fofo.py` reduz para pixel e monta `art/avatar/fofo/` (roupa com máscara de pele e íris, cabelo em
  cinza, âncoras). Cada passo: cabeça no tamanho e no rosto do quadro parado, na altura da tabela; corpo ajustado para
  o pé ficar sempre no chão. Parado com os dois pés no chão, piscar, respirar (tronco 1 px), olhar com a íris, piscar
  respirando, assentar sem afundar o pé.
- No jogo (`avatar-cor.js`, `folhaAndarFofo`): pele, olhos e cabelo seguem a aparência escolhida. Acima da testa, a
  cabeça careca só aparece onde o cabelo cobre. Por enquanto só com `?fofo=1` e corpo feminino.
- Crítico de animação revisou três vezes; corrigidos o pé patinando, a subida invertida, os braços parados, a cor do
  cabelo vazando, o tronco caindo ao piscar, o contorno da cabeça atrás do cabelo, o rosto mudando ao andar e o verde
  do fundo nas bordas. Achado no caminho, também no chibi antigo: depois de uma piscada dupla o chibi piscava sem parar
  (`chibi-vida.js`); corrigido. De lado, olhar é sempre olhar para trás.
- Capturas: `capturas-02-11/chibi-fofo-casa.png`, `chibi-fofo-passos.png`, `chibi-fofo-andando.gif`,
  `chibi-fofo-cores.png`, `chibi-fofo-quadros.png`.
Próximo, se aprovado: o corpo masculino, os outros cabelos e roupas no mesmo processo, e depois os NPCs.
Sobre o chibi fofo andando: "Aprovo".

Resto das peças. Dono, no meio: "não é pra todo chibi ter a mesma expressão viu".
- Corpo masculino e as 6 roupas da criação nos dois corpos (Casaco do Record, Dândi, Paróquia, Turno da noite,
  Enlutado, Andarilho), com andar de 8 desenhos e parado em 4 vistas (Codex, `art-src/chibi-fofo/r<n><f|m>/`).
- Os 18 cabelos da criação (`cab<n>/`) e os 18 rostos (`rosto<n>/`): cada rosto é uma camada própria, com as
  expressões do catálogo (sorriso, olhos fechados de alegria, presas, piscadela, olhos arregalados, cílios de boneca,
  olheiras…), e pisca e olha para os lados como antes. O chibi mostra o rosto escolhido na criação.
- `art-src/chibi_fofo.py` monta tudo com a mesma cabeça e a mesma altura (qualquer cabelo e rosto servem em qualquer
  roupa); `avatar-cor.js` monta roupa, rosto e cabelo com as cores da aparência. Virou o padrão na Casa, na Catedral
  e nas Torres; `?antigo=1` mostra o chibi anterior.
- Crítico de arte revisou: os rostos calmos estavam parecidos demais no tamanho do chibi (refeitos 9 com traços
  exagerados), a cor dos olhos quase não aparecia (íris mais clara), as roupas pretas puxavam para o marrom e sumiam
  no piso (agora preto-violeta). Corrigidos também o cabelo deslocado de lado e a pele aparecendo atrás do cabelo.
- Pendente (crítico): o corpo masculino e o feminino ainda têm a mesma silhueta.
- Capturas: `capturas-02-11/chibi-fofo-aparencias.png`, `chibi-fofo-rostos.png`, `chibi-fofo-andando-todos.gif`,
  `chibi-fofo-casa-m.png`.
Sobre os chibis com todas as peças e rostos: "Aprovo". Nada commitado.

### 07/11/2026 — Corpo masculino do chibi

Dono: "corpo masculino. os npcs podem destoar mesmo, não refaça".
- Corpo masculino novo nas 6 roupas (Codex, `art-src/chibi-fofo/m2/`): ombros bem largos e retos, braços caindo
  retos com mãos pequenas, tronco reto com a barra do casaco reta, calça mais clara que o casaco, pés um pouco
  afastados, 3 px mais alto que o feminino. A cabeça é a mesma: cabelos e rostos servem nos dois corpos.
- Crítico de arte revisou duas vezes. Na 1ª versão as mãos eram grandes e saíam para os lados, e os ombros sumiam
  atrás dos cabelos longos; corrigido. Na 2ª: o menino se lê de relance de frente em todos os pares e de costas na
  maioria; de lado só pela altura. Observação dele: a silhueta ficou bem quadrada (ombros em ângulo reto), dá para
  arredondar os cantos dos ombros se o dono preferir mais fofo.
- Chibis dos NPCs ficam como estão (dono).
- Captura: `capturas-02-11/chibi-fofo-corpos.png` (6 pares, menina à esquerda e menino à direita, mesma roupa, cabelo
  e rosto).
Sobre o corpo masculino: "Aprovo". Nada commitado.

### 07/11/2026 — Melissa no motor; Galo, Coruja e Javali para as Torres

Dono: "Torres e Melissa".
- Melissa: o retrato agora só pisca (boca desligada em `kit3/art/anim.json`: prólogo, Calendário e Corporações). O chibi
  aprovado dela foi para o formato dos NPCs (`art/npc-chibi/melissa.png`, com boca e piscar; `chibi_npc.py`
  `folha_aprovada`) e ganhou a versão holograma (`art/npc-chibi/melissa-holo.png`, `art-src/holo_chibi.py`: azul de
  projeção, linhas de varredura, a rosa como ponto mais claro). Chamada curta na Casa: o facho sobe, ela se desenha de
  baixo para cima ao seu lado, fala com a boca mexendo e o rostinho na caixa, e se apaga ao fim (`casa.html`
  `chamadaMelissa`, `?chamada=melissa` mostra, com a abertura literal da chamada das Corporações). As cenas longas dela
  continuam com o retrato grande.
- `kit3/conversa-curta.js`: a conversa curta no cenário virou peça comum (caixa, rostinho, boca do chibi), para as
  Torres e as próximas visitas.
- Galo, Coruja e Javali: como o dono disse que "os outros NPCs ficam como estão", ficam o rosto, o cabelo, as cores e a
  roupa da arte atual; o que muda é o acabamento, igual ao do Simon e do Erick, em corpo inteiro com 8 poses
  (`art-src/galo2|coruja2|javali2/<nome>-todas.png`, versões anteriores `-v1`, `-v2`, `-v3`; prompts em `PROMPT.md`).
  Crítico de arte antes (brief) e depois (três revisões). Pose 4 do Galo veio da 2ª rodada (a 3ª desenhou um gesto
  ofensivo). Capturas: `art-src/capturas-02-11/torres-galo.png`, `torres-coruja.png`, `torres-javali.png`,
  `torres-alturas.png`.
- Observações do crítico para o dono: o broche do Galo ficou à esquerda de quem olha (na arte atual é à direita); a
  crista do Javali sobe mais que na arte atual, e na pose 5 (surpreso) virou cabelo espetado.
- Depois da aprovação: retratos meio pixel, piscar, chibis e, nas Torres, 1º andar com retrato grande e os demais em
  conversa curta com os chibis no patamar. A Torre da Ruptura segue com o NPC "???" a definir.
Dono: "javali ta sem pescoço. resto apv". Galo e Coruja aprovados. Javali refeito em duas rodadas
(`javali2/javali-v4.png`, `javali-v5.png` = `javali-todas.png`): pescoço preto à mostra entre o queixo e a gola em
todas as poses, cabeça erguida nas poses 1, 4 e 8, crista de capuz também na pose 5. Comparação em
`art-src/capturas-02-11/torres-javali-pescoco.png`. Sobre o Javali com pescoço: "Aprovo". Nada commitado.

### 07/11/2026 — Galo, Coruja e Javali no motor das Torres

- Retratos meio pixel das 24 poses em `art/torres/npc/<nome>-<pose>.png` (`corta_poses.py` ganhou `--magenta` para a
  Coruja e `--ref`, uma escala só por folha, para as poses curvadas não saírem ampliadas).
- Piscar: `art-src/anima_torres.py` → `art/torres/npc/anim/` (Galo e Coruja com as caixas dos olhos medidas à mão;
  Javali pelo âmbar, fechando na cor da cabeça com uma linha de pálpebra). Poses já de olho fechado não piscam.
  Centro dos olhos de cada pose em `art/torres/npc/centros.json`, para o rostinho da caixa (`NPCVN.centros`).
- Chibis no estilo atual dos NPCs (o mesmo do Simon, Erick e Melissa): `art/npc-chibi/galo|coruja|javali.png`,
  gerados (`art-src/npc-chibi/<nome>/PROMPT.md`) e fatiados por `chibi_npc.py`, com boca e piscar (`rosto.json`).
  O Galo anda com as mãos nos bolsos, a Coruja com as mãos juntas na cintura, o Javali com uma mão no peito.
  Se a prova do chibi "fofo sombrio" do jogador for aprovada, estes entram na troca junto com os outros NPCs.
- `torres.html`: o 1º andar de cada torre é o encontro, diálogo longo com o retrato grande (respira, pisca, reage à
  pose, letra a letra com a voz de cada um; fundo escurecido); os outros andares são conversa curta num close do
  patamar (a arte do andar em dobro e em escala inteira, para a porta ficar do tamanho dos chibis), você à esquerda,
  o anfitrião à direita com a boca mexendo, rostinho na caixa. A Torre da Ruptura ("???") usa a conversa curta sem
  rosto. Cartões das torres com os rostos novos (`art/torres/npc/<nome>-rosto.png`).
- Crítico de interação revisou; entraram: escala inteira no patamar e no rostinho (recorte de 76 px, ou 152 nas
  figuras grandes), rostinho do Javali sem pular de altura, Javali piscando também no riso, prêmio que não fecha com
  toque duplo (Enter/Espaço fecham), texto da fala anterior limpo antes da pose nova, véu escuro na cena longa,
  entrada e saída do patamar em quadros, "Sistema" e "▼" iguais nas duas formas.
- Ressalva do crítico para o dono: no close do patamar o cenário está em pixel dobrado ao lado dos chibis em pixel
  simples; o ideal, depois, é uma arte própria do patamar na escala dos chibis.
- Capturas: `art-src/capturas-02-11/torres-<galo|coruja|javali>-longa.png`, `-curta.png`, `torres-ruptura.png`,
  `torres-cartao.png`, `torres-chibis-rosto.png`. Testado sem erros (Edge sem janela).
Sobre as Torres com os anfitriões: "Aprovo". Com isso, "Torres e Melissa" está feito. Nada commitado.

### 07/11/2026 — Commit e próximo grande passo

Dono: "Commitar tudo" → "Tudo, 1,5 GB" → "Enviar". Commit 0398f8c5 na branch `ccr-a1dc3a06-5krin1`, enviado ao GitHub
(o protótipo kit3 inteiro, fontes da arte e capturas). A `redesign` e o site não mudaram.
Dono: "quando acabar atualize o site" → "Levar o v2 ao jogo": quando o v2 estiver todo aprovado, passar o que está no
protótipo (Casa, chibis, Torres, Catedral, sistema…) para o jogo de verdade (Next.js) e publicar pela `redesign`.

### 08/11/2026 — v2 no jogo: caminho do meio, etapa 1 publicada

Dono: "acha mais facil lançar num link a parte do que editar tudo?" → "como está no github, acha melhor criar outro site
pra ser o devo, ou editar o original?" → "Caminho do meio": interface do v2 nova, feita do zero a partir do protótipo,
no mesmo projeto, sobre o mesmo login, banco e regras; em /v2 só para Owner e Anfitrião até ficar completa; depois o
endereço principal troca para o v2.
- Etapa 1 (branch `v2/base`, entrou na `redesign` em 7fda7726): casca do sistema em /v2 com o CSS do protótipo
  (`components/v2/os.css` + `v2-ajustes.css`), cartão do Record, Tempo, check-in, próximo evento, anúncios, Mapa do
  Devo, doca, janelas e avisos, com os dados reais. As telas dos sistemas vêm nas próximas etapas (a janela leva ao
  DEVO atual). Jogador comum em /v2 volta para o site atual. Crítico de arte comparou com o protótipo; acertos feitos.
- CI de capturas: o GitHub trocou o ubuntu-latest para o 26.04 e o Playwright do projeto não roda nele; o job foi
  fixado no Ubuntu 24.04 (valia para todas as branches). Grupo de capturas novo: `v2`.
Dono: "Publicar". No ar em devo.devorpg.workers.dev/v2. Banco sem mudança.

### 08/11/2026 — v2 no jogo, etapa 2 (primeira parte) publicada

Dono: "Aprovo, siga" (etapa 2). Mudança de caminho dentro da etapa, para o /v2 ficar usável já: o /v2 roda o mesmo motor do
jogo e dá às telas atuais o contexto de navegação, então todos os sistemas que já existem abrem dentro das janelas do v2
com as funções completas (Record com Deadly Votes, Diário e Mesa; Mensagens, Cartas, Trocas, Inventário, Ajustes,
Calendário, Casa, Torres, Poço, Salão, Jogos, Corporações, Virtudes, Arcanos). O Pulso já está na versão nova do protótipo;
as outras telas trocam de visual uma a uma. Conflito e Ranking ainda não existem no jogo (etapa 8).
Dono: "Publicar" (6b548618 na `redesign`). Banco sem mudança.

