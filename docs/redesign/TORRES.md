# Torres de Ruptura — como funciona e como acrescentar conteúdo

Sistema da Direção 3 §2. Regras do dono (texto do Galo e notas finais de `SISTEMAS-texto-do-dono.txt`):

- Um **mapa** com uma torre **principal** (campanha) e várias **secundárias**. Tocar numa torre abre a tela dela.
- Cada torre tem de **5 a 8 andares**, um **tema** e um **NPC em destaque**.
- Cada andar custa **Essências de Afinidade** do tipo da torre, e o custo **dobra** a cada andar:
  `custo do andar n = custoBase × 2^(n−1)` (custoBase 1 → 1, 2, 4, 8, 16, 32, 64, 128).
- Andares de torres **secundárias entregam chaves** (1 por andar, uma vez só).
- Andares da **principal podem exigir N chaves** de secundárias. Por padrão as chaves **não são gastas** (basta
  tê-las, como "ter completado N andares"); um andar pode pedir `"gastaChaves": true`. *Decisão provisória:
  confirmar com o dono.*
- Os andares sobem **em ordem**. Sem recurso, o andar não abre e nada é cobrado.
- Tudo no servidor, pelo inventário da Fundação (`consumeItem`/`grantItem` com `idem`): o mesmo andar nunca cobra
  nem entrega duas vezes, nem com dois toques simultâneos.
- O sistema fica trancado até vencer o Deadly Vote do tutorial (flag `torres`); Owner e Anfitrião veem liberado.

## Onde está cada coisa

| Arquivo | O que é |
|---|---|
| `lib/devo/torres/conteudo.json` | **O conteúdo** (torres, andares, NPCs, cenas). É aqui que o dono mexe. |
| `lib/devo/torres/tipos.ts` | Formato do conteúdo e das cenas (comentado). Regra do custo (`custoDoAndar`). |
| `lib/devo/torres/conteudo.ts` | Validação: aponta em português o que está errado no conteúdo. |
| `lib/devo/torres/galo.ts` | Apresentação do Galo (texto literal) e a reflexão "Anfitrião de quê?". |
| `lib/devo/torres-server.ts` | Regras no servidor: estado, subir andar, oferta do Galo, reflexão. |
| `app/api/torres/route.ts` | API (abaixo). |
| `components/devo/torres/*` | Telas: app, mapa, torre (escada), cena de diálogo, arte em SVG, gatilho da reflexão. |
| `scripts/torres-migration.sql` | Tabelas `tower_progress` e `tower_player`; catálogo das essências/chaves de exemplo. |
| `scripts/dev/91-seed-torres.sql` | Convites de teste (capturas e teste de servidor). |
| `scripts/dev/torres-test.mjs` | Teste de servidor (roda no CI → `torres-test.log`). |
| `public/images/torres/galo/*.webp` | 12 expressões do Galo recortadas da folha OC (provisório até o Elenco pôr o Galo em `lib/devo/npcs.ts`). |

## Acrescentar um andar, um diálogo ou uma torre (sem código)

Edite `lib/devo/torres/conteudo.json` (no GitHub dá para editar pelo navegador) e faça o deploy. Ou, sem deploy, o
Owner grava o conteúdo inteiro na configuração `torres.conteudo`:
`POST /api/staff { "action": "config.definir", "key": "torres.conteudo", "value": { …o mesmo JSON… } }`.
Se o conteúdo do Owner tiver erro, o servidor ignora e continua com o arquivo (o erro aparece no log do servidor).

### Trocar o diálogo de um andar

Cada andar tem `"cena"`, uma lista de passos. Tire o `"provisorio": true` e o `[PROVISÓRIO]` do título quando o
texto for definitivo.

```json
{
  "titulo": "A Escadaria Fria",
  "resumo": "Frase curta que aparece no cartão do andar.",
  "requisitos": { "chaves": [{ "torre": "observatorio", "quantidade": 1 }] },
  "cena": [
    { "tipo": "fala", "pose": "sorriso", "texto": "E aí, mané! Subiu, hein?" },
    { "tipo": "escolha", "opcoes": [
      { "texto": "Subi.", "resposta": [{ "tipo": "fala", "texto": "Boa!" }] },
      { "texto": "Não foi fácil." }
    ] },
    { "tipo": "sistema", "texto": "Andar concluído." }
  ]
}
```

Tipos de passo:

| `tipo` | Campos | Aparece como |
|---|---|---|
| `fala` | `texto`, `pose` (opcional), `quem` (opcional: id de outro NPC) | fala do NPC com o retrato na expressão `pose` |
| `jogador` | `texto` | pensamento/fala do jogador ("Você") |
| `narra` | `texto` | narração em itálico (o que no texto do dono vem entre `*asteriscos*`) |
| `sistema` | `texto` | "Mensagem do sistema" |
| `bloco` | `titulo`, `texto` (lista de parágrafos) | quadro do sistema, como "[Torre de Ruptura]" |
| `escolha` | `opcoes`: `texto`, `resposta` (passos), `acao` (true = "*Aceitar*"), `encerra` (true = a cena termina depois da resposta) | tiras de escolha |

Nos textos: `{nome}` vira o nome do jogador; `{o|a}` (masculino|feminino) concorda com o gênero escolhido
(ex.: `cansad{o|a}`, `{obrigado|obrigada}`); trechos entre colchetes ficam como direção de cena
(`"Besteira. [Dedo do meio censurado.]"`).

Poses do Galo: `neutro`, `sorriso`, `risada`, `desdem`, `bravo`, `espanto`, `sem-graca`, `satisfeito`, `sombrio`,
`piscada`, `tedio`, `convencido`. Outros NPCs usam as poses de `lib/devo/npcs.ts` (ex.: Javali `neutral`, `grin`,
`wink`, `tap`); pose desconhecida cai na neutra.

### Acrescentar um andar

Copie um andar dentro de `"andares"` (máximo 8 por torre). O custo é calculado sozinho (dobra). Andares de
secundária entregam 1 chave; para mudar: `"recompensas": { "chaves": 2 }`. Itens extras:
`"recompensas": { "itens": [{ "item": "dracma_comum", "quantidade": 3 }] }` (chave do catálogo da Fundação).

### Acrescentar uma torre

Copie uma torre secundária e troque:

- `"id"`: minúsculo, sem espaço (`"torre-da-melissa"`). A chave dela será `chave:<id>`.
- `"nome"`, `"tema"`, `"descricao"`.
- `"npc"`: `{ "id": "melissa", "nome": "Melissa", "titulo": "…" }` (o retrato vem do mapa de retratos pelo id).
- `"essencia"`: `{ "item": "essencia:melissa", "nome": "Essência de Afinidade da Melissa" }`. O servidor cria a
  essência e a chave no catálogo sozinho, se não existirem.
- `"custoBase"`: essências do 1º andar.
- `"arte"`: desenho no mapa — `agulha` (gótica, a principal), `observatorio` (cúpula com luneta) ou `picadeiro`
  (lona listrada). Desenho novo exige código (`components/devo/torres/arte.tsx`).
- `"mapa"`: `{ "x": 0–100, "y": 0–100, "escala": 0.7 }` — posição da base da torre em % da ilustração
  (390×640). Hoje: principal em (50, 62); secundárias em (21, 77) e (80, 79). Evite sobrepor.
- `"chave"`: `{ "nome": "Chave da …" }`.

Deve haver **exatamente 1** torre `"principal"`. Requisitos de chave só podem citar torres que existem.

## Essências: como o jogador ganha

- **Galo**: 1 Essência do Galo ao aceitar ser fã na apresentação (uma vez só; recusar também é definitivo).
- Demais: recompensas da equipe (`/api/staff` › `item.conceder` ou propostas de recompensa), Poço dos Milagres
  (`essencia` nas probabilidades), diálogos futuros. Chaves: só pelos andares.

## API

| Chamada | Resposta |
|---|---|
| `GET /api/torres` | `{ liberado: false, motivo }` ou `{ liberado: true, pularApresentacao, apresentacao, torres[] }` (cada andar com estado, custo, chaves pedidas, o que falta e, se concluído, a cena) |
| `POST { action: 'subir', torre, andar }` | `{ ok, torre, andar, cena, chavesRecebidas }` · 403 trancado · 409 fora de ordem / já concluído / faltam chaves / essências insuficientes |
| `POST { action: 'galo.fa', aceitar }` | `{ concedido, galoFa }` |
| `POST { action: 'galo.visto' }` | fim (ou pulo, para Owner/Anfitrião) da apresentação |
| `POST { action: 'reflexao', escolha: 1–5 }` | `{ registrado }` (só a primeira; exige apresentação vista) |

## Apresentação e reflexão

- Primeira entrada com o sistema liberado → o Galo apresenta (texto literal; Owner/Anfitrião podem pular).
- Ao **sair da aba** das Torres pela primeira vez depois disso, toca a reflexão "Anfitrião de quê?" (evento de
  janela `devo:cena` com `{ id: 'anfitriao-de-que' }`, fallback em `components/devo/torres/gatilho.tsx`, montado
  no `DevoOS`). O motor da Narrativa pode assumir: escute o mesmo evento e chame `event.preventDefault()`.
  A escolha fica em `tower_player.reflexao_escolha` (4 = "Anfitrião do Imperador").
- O motor de cena das Torres (`components/devo/torres/cena.tsx`) é local; quando `docs/redesign/DIALOGO.md`
  (Narrativa) chegar, o formato de passos pode ser convertido 1:1.

## Pendências para o dono

- Diálogos, títulos e NPCs reais dos andares (tudo marcado `[PROVISÓRIO]`).
- Torres secundárias, NPCs (Coruja, Javali) e essências delas são exemplos provisórios.
- `custoBase` provisório (1 em todas).
- Chaves gastas ou não ao abrir andar da principal (hoje: não gastas).
