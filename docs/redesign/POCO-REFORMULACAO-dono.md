# DEVO — Reformulação Visual do Poço (Gacha) e Fidelidade às Referências

Quero que você revise profundamente a interface atual do **Poço**, o sistema de gacha do DEVO

O resultado atual está excessivamente simples, geométrico e genérico. Embora algumas funcionalidades estejam presentes, a aparência não transmite a qualidade, a atmosfera ou a riqueza visual que espero para o projeto.

**Não quero apenas ajustes de cores, bordas e espaçamentos. Quero uma melhoria significativa na direção artística e na execução visual.**


Não simplifique elementos elaborados das referências transformando-os em retângulos, círculos, gradientes genéricos ou cartões convencionais.

Se a referência apresenta uma estrutura ornamental, quero uma estrutura ornamental. Se utiliza sobreposições, materiais e iluminação elaborada, quero que essas características sejam preservadas e adaptadas ao DEVO.

**A referência deve orientar a construção visual, e não servir apenas como inspiração distante.**

Não é necessário reproduzir literalmente elementos protegidos ou marcas de outros jogos, mas quero fidelidade ao nível de acabamento, à linguagem visual e à complexidade artística apresentada.

## 2. Problema atual: excesso de geometria simples

A interface está com aparência de protótipo.

Quero eliminar a sensação de que tudo foi construído apenas com:

- Retângulos arredondados.
- Círculos simples.
- Gradientes básicos.
- Bordas luminosas genéricas.
- Ícones comuns de bibliotecas.
- Painéis planos e repetitivos.
- Elementos perfeitamente simétricos sem personalidade.

Esses recursos podem continuar existindo quando fizerem sentido, mas não devem constituir toda a identidade visual.

Substitua a simplicidade excessiva por uma composição mais rica, utilizando elementos decorativos desenhados especificamente para o Poço.

Quero um resultado com aparência de interface de videogame, e não de dashboard administrativo.

## 3. Identidade visual do Poço

O Poço deve transmitir a sensação de um mecanismo misterioso de sorte, destino e recompensa.

Imagine uma estrutura antiga e sobrenatural, pertencente ao universo DEVO, na qual os jogadores arriscam recursos em troca de itens raros.

Explore elementos como:

- Ornamentos góticos.
- Estruturas metálicas envelhecidas.
- Cristais e fragmentos arcanos.
- Símbolos esotéricos.
- Engrenagens e mecanismos.
- Correntes decorativas.
- Cartas e inscrições.
- Luzes sobrenaturais.
- Profundidade atmosférica.
- Detalhes inspirados em cassinos aristocráticos.

Esses elementos devem ser integrados à composição, não espalhados aleatoriamente.

O resultado precisa ser misterioso, sofisticado e visualmente marcante, sem se tornar excessivamente escuro ou poluído.

## 4. Reformulação da tela principal

A tela do Poço deve possuir uma composição visual mais cinematográfica.

Quero que a área principal tenha um elemento central de destaque, como um mecanismo de invocação, uma estrutura arcana ou um poço sobrenatural elaborado.

Esse elemento deve transmitir profundidade e importância.

Evite colocar simplesmente um círculo luminoso no centro de um painel escuro.

Desenvolva uma composição com:

- Elemento central artisticamente elaborado.
- Moldura ou estrutura ornamental.
- Iluminação direcionada.
- Camadas de profundidade.
- Partículas discretas.
- Elementos ambientais.
- Animações suaves.
- Botões de invocação integrados à estética.

O jogador deve sentir que está interagindo com algo especial, e não apenas pressionando um botão que executa um sorteio.

## 5. Animação de invocação

A experiência de realizar um sorteio precisa ser satisfatória.

Crie uma sequência visual com começo, desenvolvimento e revelação.

**Etapa 1 — Ativação**

O jogador inicia a invocação. O mecanismo reage, símbolos se iluminam e a atmosfera muda discretamente.

**Etapa 2 — Suspense**

Elementos arcanos se movimentam, a iluminação se intensifica e efeitos sonoros criam expectativa.

**Etapa 3 — Revelação**

A recompensa aparece com uma apresentação proporcional à sua raridade.

**Etapa 4 — Resultado**

O jogador pode visualizar o item obtido, sua descrição, raridade e opções disponíveis.

Recompensas raras devem possuir apresentações mais especiais, mas não quero animações longas e cansativas.

Inclua a opção de pular ou acelerar a animação.

O resultado do sorteio deve ser definido pelo backend antes da animação, sem depender de efeitos visuais ou cálculos realizados exclusivamente no navegador.

## 6. Apresentação das recompensas

Cartas, molduras, emblemas, balões de chat e outros itens devem possuir apresentações visuais adequadas.

Não quero que todos sejam exibidos dentro do mesmo cartão retangular genérico.

Cada categoria pode possuir uma apresentação própria, respeitando uma identidade visual compartilhada.

Exemplos:

**Cartas:** apresentação semelhante a uma carta colecionável, com moldura e ilustração.

**Emblemas:** destaque para o símbolo, com acabamento ornamental e iluminação.

**Molduras:** pré-visualização aplicada a um avatar.

**Balões de chat:** demonstração do cosmético aplicado a uma mensagem.

**Fragmentos de Arcano:** representação visual do recurso, com efeitos e materiais adequados.

A raridade deve ser comunicada por composição, acabamento e efeitos, não apenas pela cor de uma borda.

## 7. Qualidade dos assets

Este é um ponto fundamental.

Não quero que elementos complexos sejam improvisados com CSS básico ou primitivas geométricas.

Quando um componente exigir uma arte elaborada, utilize um asset visual apropriado.

Prefira:

- Ilustrações originais.
- PNGs transparentes.
- SVGs ornamentais bem desenhados.
- Texturas adequadas.
- Camadas visuais reutilizáveis.
- Animações leves.

Não substitua uma estrutura artística elaborada por um círculo com `box-shadow` apenas porque é mais rápido de implementar.

Se determinado elemento precisar de uma ilustração ou asset específico que ainda não existe, identifique essa necessidade e prepare sua integração, em vez de apresentar uma aproximação geométrica de baixa qualidade como resultado definitivo.

## 8. Tipografia e botões

Quero uma tipografia coerente com o universo DEVO, com características elegantes, góticas ou aristocráticas quando apropriado.

Os botões de invocação devem receber atenção especial.

Eles precisam ter:

- Formatos próprios.
- Acabamentos ornamentais.
- Estados de interação.
- Iluminação sutil.
- Feedback ao pressionar.
- Boa legibilidade.

Evite botões convencionais com gradiente e borda arredondada quando a referência apresenta elementos mais sofisticados.

## 9. Mobile e desempenho

A maioria dos jogadores utilizará dispositivos móveis.

A reformulação precisa ser pensada prioritariamente para telas pequenas.

Não quero uma versão desktop simplesmente reduzida.

Adapte a composição para que:

- O elemento principal permaneça em destaque.
- Os botões sejam facilmente acessíveis.
- As informações sejam legíveis.
- As animações sejam fluidas.
- O carregamento seja rápido.
- Os efeitos não sobrecarreguem o dispositivo.

Utilize animações CSS eficientes, transforms, assets otimizados e carregamento sob demanda quando apropriado.

Evite filtros pesados, partículas em excesso e múltiplas animações simultâneas.

Busque qualidade visual elevada com custo computacional controlado.

## 10. Preservação das funcionalidades

Esta solicitação é principalmente uma reformulação visual.

Não altere indevidamente:

- Probabilidades do gacha.
- Inventário.
- Moedas e recursos.
- Sistema de raridades.
- Histórico de sorteios.
- Permissões administrativas.
- Regras de obtenção.
- Integração com recompensas.

Preserve a lógica existente e concentre as alterações na apresentação, na experiência de interação e na qualidade visual.

Qualquer mudança funcional necessária deve ser justificada.

## 11. Revisão crítica obrigatória

Após implementar a reformulação, compare o resultado com as referências enviadas.

Avalie:

1. A composição realmente se aproxima da referência?
2. Os elementos possuem profundidade e acabamento?
3. O resultado ainda parece excessivamente geométrico?
4. Há detalhes artísticos próprios ou apenas CSS decorativo?
5. O Poço transmite a sensação de um sistema de gacha premium?
6. A apresentação das recompensas é satisfatória?
7. O mobile mantém a mesma qualidade?
8. A interface continua funcional e otimizada?

Se o resultado ainda parecer um protótipo ou uma interface genérica, revise a composição e os assets antes de considerar a tarefa concluída.

Não quero alterações superficiais seguidas da afirmação de que a interface foi completamente reformulada.

## 12. Resultado esperado

Quero que a tela do Poço se torne uma das experiências visualmente mais marcantes do DEVO.

A referência de qualidade deve ser a apresentação de sistemas de invocação de jogos comerciais premium, com atenção especial à composição, aos detalhes artísticos, à animação e à revelação de recompensas.

**A prioridade é abandonar a aparência simplificada e geométrica atual, respeitar muito mais as referências enviadas e construir uma interface artisticamente elaborada, funcional e otimizada para mobile.**

Não confunda minimalismo com falta de acabamento, nem complexidade visual com excesso de efeitos.

Quero sofisticação, personalidade e qualidade real de execução.

algumas vezes terão recompensas "inúteis" (como tampão de lixo, curativo usado), essas não deverão ir ao inventário.

sempre que algum jogador ganha algo raro, na tela do poço, pode haver uma faixa de notificação dizendo o que foi ganho e raridade. coloque periodicamente notificações fake para dar impressão que tem gente girando e incentivar o usuário. isso n deve anular notificações reais.

----------

na tela inicial, está muito "preto no branco" adicione um pouco daquele roxo já utilizado. ajuste melhor o enquadramento dos npcs (revise)

gere um cód owner para mim.

