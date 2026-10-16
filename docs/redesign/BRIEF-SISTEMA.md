# Brief comum dos agentes de sistemas novos (Direção 3)

Valem todas as regras de `BRIEF-AREA.md` (ambiente sem npm, CI no GitHub Actions, capturas na branch `capturas/<branch>`, commits com as linhas de atribuição, `.capture-only` enquanto itera, relatório curto no fim). Além disso:

1. **Leia antes de codar, inteiros:** `DIRECAO-3.md` (inclusive §1b e §7), `SISTEMAS-texto-do-dono.txt`, `DIALOGOS-galo-salao.md` (quando o seu sistema tiver diálogo), `FUNDACAO.md` (contrato de cargos, `can()`, `unlocks()`, inventário `grantItem/consumeItem`, recompensas, karma, `/api/eu`), `DIRECAO-2.md §0/§6` (paleta), `IDENTIDADE.md`, `MAPA.md`, `RUBRICA.md`.
2. **Use a Fundação, não crie sistemas paralelos.** Permissão sempre no servidor via `can()`/`unlocks()`. Itens sempre pelo inventário genérico. Se faltar algo no contrato, acrescente na própria Fundação de forma compatível e documente em `FUNDACAO.md`.
3. **Travas:** o sistema fica trancado até o jogador vencer o Deadly Vote tutorial; **Owners e Anfitriões veem tudo liberado**. O ícone trancado continua visível (como hoje), com o motivo.
4. **Textos do dono são literais.** Não reescreva diálogos; só adapte formatação (escolhas, respostas por opção, efeitos). Concordância de gênero com o marcador `{o|a}` (DIRECAO-3 §7 "Gênero nos textos": `playerText`/`usePlayerText`). Owner nunca revelado publicamente.
5. **Conteúdo é dado.** Probabilidades, custos, andares, falas futuras: em tabelas/arquivos de configuração editáveis por Owner, marcados "provisório" quando o dono não definiu o número.
6. **Sprites:** os NPCs usam o mapa novo de `lib/devo/npcs.ts` (agente Elenco está trocando pelos OCs; se ainda não estiver na redesign, use o mapa atual e não mexa nele). Corvo ainda sem sprite (silhueta).
7. **Visual:** paleta de mármore negro/branco, metal champanhe-prateado, ametista como único frio, rubi só alerta; kit em `components/devo/kit` e `MarbleSlab` de `os/shell-ui.tsx`. Mobile 390×844 primeiro. Referências são guia de qualidade, não para copiar.
8. **Migrações** idempotentes em `scripts/`, incluídas no `capturas.yml`, no `local-db.mjs` e no gerador `scripts/dev/gerar-banco-novo.sh` (rode e commite o `scripts/devo-banco-novo.sql`). Seed de teste para as capturas mostrarem o sistema funcionando.
9. **Capturas:** acrescente ao `scripts/dev/capture.mjs` um grupo próprio (nome do sistema) com os estados principais (trancado para jogador comum, liberado, fluxo principal, vazio, erro). Não quebre os outros grupos.
10. **Teste de servidor** (script node em `scripts/dev/`, rodado no CI como o `fundacao-test`) cobrindo as regras críticas do seu sistema.
