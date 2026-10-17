# DEVO — Refinamento Visual, Responsividade e Implementação de Diálogos Narrativos

Realize uma atualização no sistema DEVO, priorizando a identidade visual, a experiência mobile, a correção de problemas de interface e a implementação dos diálogos narrativos fornecidos no documento anexo.

**IMPORTANTE:** Não reconstrua o projeto do zero. Preserve as funcionalidades existentes, a arquitetura, os dados dos usuários e a identidade original do DEVO. As alterações devem ser incrementais, consistentes e integradas ao sistema atual.

## 1. Identidade visual —

A interface atual está excessivamente escura e apresenta pouca diferenciação visual entre seus elementos.

Refine a paleta adicionando as cores da foto referência.



Diretrizes:

- Preservar a atmosfera misteriosa, sobrenatural e sofisticada do DEVO.
- Evitar cores excessivamente saturadas, especialmente roxo neon e dourado intenso.
- Utilizar reflexos metálicos discretos, bordas delicadas e iluminação ambiental.
- Melhorar a legibilidade dos textos.
- Criar maior profundidade visual entre o fundo, os painéis e os componentes interativos.
- Padronizar a paleta em todas as páginas, inclusive nos módulos de Torres, Cosméticos, Poço, Casa e diálogos.

O resultado deve transmitir uma estética de fantasia urbana sombria, com acabamento elegante, sem parecer uma interface genérica de videogame.

## 2. Correções de responsividade mobile

### 2.1. Retratos dos NPCs nos diálogos

Atualmente, os personagens apresentados dentro dos ícones circulares dos diálogos de tutorial ultrapassam os limites de seus contêineres.

Corrigir:

- Vazamento das imagens para fora das molduras circulares.
- Cortes inadequados de rostos, cabelos e acessórios.
- Desalinhamento entre retrato, nome do NPC e balão de diálogo.
- Problemas de dimensionamento em telas pequenas.

**Atenção especial ao NPC O Galo**, cujo enquadramento está cortando partes importantes de sua aparência.

Utilize ajustes individuais de enquadramento quando necessário, em vez de aplicar um único posicionamento a todos os NPCs.

Não altere as ilustrações originais.

### 2.2. Cadência dos diálogos

Revise o funcionamento do sistema de diálogos.

- O texto deve ser exibido em uma cadência confortável.
- Pausas dramáticas precisam ser respeitadas.
- Falas longas devem possuir divisão visual adequada.
- As opções de resposta só devem ficar disponíveis quando a fala correspondente estiver concluída.
- O jogador deve conseguir avançar sem que trechos sejam pulados acidentalmente.
- Evitar animações excessivamente lentas.
- Manter uma experiência consistente em desktop e mobile.

Se existir efeito de digitação, permita que o jogador toque para concluir a exibição da fala atual, sem avançar imediatamente para a próxima.

### 2.3. Torres de Ruptura

Na versão mobile, os textos das torres estão se sobrepondo.

Corrigir o dimensionamento, o espaçamento, a quebra de linha e o posicionamento dos componentes.

As torres também estão visualmente flutuando sobre o mapa.

Ajustar para que:

- Cada torre esteja corretamente posicionada em sua base ou superfície.
- O mapa apresente profundidade e coerência espacial.
- Os elementos não pareçam desconectados do cenário.
- As torres não sejam comprimidas para caber todas na tela.

**Caso existam mais torres do que o espaço disponível, implementar navegação horizontal por arraste.**

O usuário deve conseguir deslizar lateralmente para explorar as demais torres, principalmente no mobile.

Manter indicadores discretos de que existem outros elementos fora da área visível.

### 2.4. Alteração da foto de perfil

Corrigir o problema que impede ou dificulta a alteração da foto de perfil no mobile.

Verificar:

- Seleção de imagem pela galeria.
- Pré-visualização.
- Recorte e enquadramento.
- Confirmação.
- Upload.
- Persistência da imagem após atualizar a página.

Garantir que o processo funcione em navegadores mobile e que o usuário receba mensagens claras em caso de erro.

## 3. Aprimoramento visual do Poço e da Casa

Os módulos de Cosméticos e Torres já apresentam uma direção visual mais desenvolvida.

Utilize essa qualidade como referência para aprimorar o **Poço** e a **Casa**, sem transformar todos os ambientes em interfaces idênticas.

### Poço

O Poço deve transmitir antiguidade, mistério e uma atmosfera sobrenatural.

Aprimorar:

- Composição visual.
- Iluminação.
- Profundidade do cenário.
- Elementos interativos.
- Feedback ao lançar moedas.
- Transições e efeitos associados aos resultados.

O cenário deve sugerir que o Poço possui uma história própria e uma natureza incomum.

### Casa

A Casa deve transmitir uma sensação de espaço pessoal, mas com uma atmosfera sutilmente inquietante, coerente com o universo DEVO.

Aprimorar:

- Composição dos ambientes.
- Profundidade.
- Iluminação.
- Elementos interativos.
- Transições narrativas.
- Responsividade.

Preservar todas as funcionalidades já existentes.

## 4. Rosa do Destino — Remoção de Cosméticos

Remova completamente os cosméticos da Rosa do Destino.


## 5. Implementação e revisão dos diálogos narrativos

Utilize o documento anexo como **fonte principal e obrigatória** para implementar e ajustar as interações narrativas.

O arquivo contém diálogos relacionados a:

1. O Galo e as Torres de Ruptura.
2. Essências de Afinidade.
3. Introdução à Casa.
4. Segunda aparição do Galo.
5. Sistema de Karma e Linha do Destino.
6. Encontro no Poço.
7. Dracmas.
8. Melissa e o sistema de Corporações.

### 5.1. Preservação dos textos

Não reescreva livremente as falas dos NPCs.

Preserve:

- Personalidade.
- Humor.
- Expressões características.
- Linguagem coloquial.
- Pausas dramáticas.
- Ironia.
- Tom narrativo.
- Ordem dos acontecimentos.

O Galo, por exemplo, deve continuar sendo irreverente, provocador, exagerado e teatral.

Não suavizar sua personalidade nem substituir suas falas por diálogos genéricos.

### 5.2. Estrutura de escolhas e ramificações

Cada conjunto de opções deve funcionar como uma etapa narrativa real.

O jogador precisa conseguir selecionar uma resposta e receber a reação correspondente.

Respeitar as instruções específicas do documento, principalmente quando uma opção:

- Permite retornar às demais escolhas.
- Avança diretamente para outra etapa.
- Desbloqueia uma informação.
- Entrega um item.
- Aplica uma consequência.
- Encerra a interação.

Exemplo: no diálogo sobre as Torres de Ruptura, as opções 1 e 2 devem permitir selecionar outras respostas ainda não exploradas. A opção 3 deve avançar a narrativa.

Não transformar todas as opções em botões que levam ao mesmo resultado.

### 5.3. Controle de progressão

Implementar uma estrutura de estados para os diálogos.

Cada interação deve possuir:

- Identificador único.
- NPC responsável.
- Texto.
- Opções disponíveis.
- Resposta correspondente.
- Próxima etapa.
- Condições de desbloqueio, quando aplicáveis.
- Consequências mecânicas.
- Estado de conclusão.

Evitar que o jogador receba repetidamente recompensas de diálogos já concluídos.

.

**Melissa — Corporações**

Implementar as opções de diálogo e suas consequências conforme o documento.

Na resposta sobre Necro-Corporações, aplicar a penalidade indicada de **1 hora e 30 minutos no Shuffler**, por meio da lógica segura do sistema.

Registrar a alteração no histórico apropriado.

Permitir explorar as opções informativas antes de prosseguir, respeitando a opção que encerra a etapa.

## 6. Sons e efeitos narrativos

Implementar ou ajustar os efeitos indicados no roteiro, incluindo:

- Abertura e fechamento de portas.
- Campainha.
- Lata de bebida.
- Interferência ou transição holográfica.
- Efeitos de aparição.
- Revelações do sistema.
- som de papeis no tutorial

Os efeitos devem acompanhar o momento narrativo correto.

Evitar reproduções repetidas, sobreposições sonoras e volumes excessivos.

Respeitar a preferência do usuário por áudio ativado ou desativado.

## 8. Requisitos de qualidade

Antes de concluir, verificar:

- Responsividade em diferentes larguras de tela.
- Enquadramento dos NPCs.
- Ausência de sobreposição de textos.
- Navegação horizontal das torres.
- Funcionamento do upload de fotos.
- Integridade das opções narrativas.
- Persistência dos estados dos diálogos.
- Concessão correta das recompensas.
- Atualização do inventário.
- Aplicação correta das penalidades.
- Funcionamento dos efeitos sonoros.
- Ausência de erros no console.
- Preservação das funcionalidades existentes.

----------

