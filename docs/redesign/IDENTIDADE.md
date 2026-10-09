# DEVO — Identidade visual "Tribunal do Relógio"

> Um jogo mortal elegante: **o tempo é a moeda e o juiz.**
> Este guia é obrigatório para todo agente que mexer em telas. Vitrine viva: `/estilo`
> (fora de produção, ou com `DEVO_STYLEGUIDE=1`). Código: `components/devo/kit/`.

Referências de **qualidade**, nunca de aparência: Persona 5 Royal (composição ousada, cortes
diagonais, tipografia dramática, transições com direção), Danganronpa V3 (tensão, contraste duro,
vermelho que corta a tela, sensação de julgamento), Honkai: Star Rail (polimento, filigrana fina,
brilhos sutis, microinterações). Nada de copiar telas, personagens, logos, ícones ou composições.

---

## 0. Paleta, material e ornamento (Direção 2 §0 — prioridade sobre o resto do guia)

A paleta saiu das últimas refs do dono (`refs/ref-gotico-figurino.png`, `ref-valsa-relogio.png`,
`ref-gaiola-ouro.png`, `ref-xadrez-marmore.png` e os figurinos `refs/npc/npc-ref-01…13.jpg`), por
amostragem dos pixels (PIL, quantização por corte mediano + acentos por faixa de matiz). É
**monocromática na base** (veludo × porcelana, mármore preto e branco), com **latão dessaturado** no
metal, **noite azul-violeta** no ar, **índigo-marinho** discreto para o sistema e **rubi** só como joia
ou alerta. O cobalto elétrico (#1647ff) saiu: o token `--dv-cobalt` continua com o mesmo nome e papel
(interação), agora em índigo-marinho.

| Cor | Hex | Token | Papel | De qual ref veio |
|---|---|---|---|---|
| Veludo (tinta) | `#0a090d` | `--dv-ink`, `--in-panel` | fundo, painéis pretos | figurino (preto `#1f1d1e`), NPCs 01/08 |
| Veludo alto | `#1b1824` | `--dv-ink-3` | superfície elevada | sombras da valsa (`#222128`) |
| Mármore negro | `#2e2f34` | `--dv-marble-black` | pedra, piso, tabuleiro | xadrez (`#3e3f41`) |
| Veio / cinza mármore | `#8a8986` | `--dv-marble-vein` | veios, linhas | xadrez (`#777674`), figurino (`#868182`) |
| Porcelana | `#f2f0ec` | `--dv-porcelain`, `--in-porcelain` | renda, superfície clara, texto claro | figurino (`#e4e0e1`), NPC 12 |
| Papel frio | `#ece9e3` / `#e8e6e2` | `--dv-paper`, `--in-paper` | documento, fundo do interior | Record + figurino |
| Noite | `#1c1b33` | `--dv-night` | atmosfera, céu, halo de cena | valsa, céu do relógio (`#322c35`/`#42445d`) |
| Noite alta | `#34365a` | `--dv-night-2` | topo de gradiente de cena | valsa (`#42445d`) |
| Lavanda acinzentada | `#6c6899` | `--dv-violet` (texto: `#aaa5d6`) | duotom, tecido, luz de cena | fita da gaiola (`#6f6984`), valsa (`#645c76`) |
| Índigo do sistema | `#4152c0` | `--dv-cobalt` (texto: `#9ea8ee`) | foco, botão primário, dados | NPCs 06/11 (marinho `#1f2f85`) clareado p/ AA |
| Marinho | `#2f3c9c` / `#34409e` | `--dv-cobalt-deep`, `--in-accent-fill` | aba ativa, bloco, barras | NPCs 06/11 (`#38468c`) |
| Latão | `#b09a6c` | `--dv-gold`, `--in-brass` | metal, filigrana, molduras | gaiola (`#b59d82`), xadrez (`#b0a496`) |
| Latão claro | `#e3d5ac` | `--dv-gold-bright` | reflexo do metal, poeira | engrenagens da valsa (`#cfb798`) |
| Latão escuro | `#5e4d33` / `#6a5530` | `--dv-gold-deep`, `--in-gold` | sombra do metal; texto de raridade no papel | gaiola (`#6e6557`), NPC 04 |
| Rubi | `#a3121f` | `--dv-blood`, `--in-alert` | joia, gota, alerta | valsa (`#882127`), NPC 05 (`#670001`) |
| Vinho | `#3f060b` | `--dv-blood-deep` | fundo de alerta | NPC 13 (`#512123`) |

**Contraste (WCAG AA, conferido):** porcelana sobre veludo 16.9 · índigo-texto `#9ea8ee` sobre veludo
8.8 · lavanda `#aaa5d6` sobre veludo 8.6 · latão `#b09a6c` sobre veludo 7.3 · branco sobre índigo
`#4152c0` 6.6 · tinta `#2e3a94` sobre papel 7.8 · rubi sobre papel 6.3 · latão escuro `#6a5530` sobre
papel 5.7 · cinza `#565a66` sobre papel 5.5.

### Regras de uso
1. **Base preto e branco.** Toda tela começa em veludo + porcelana (ou papel frio no interior). Cor é
   exceção: se não sabe, não use.
2. **Latão só no metal.** Filetes, filigrana, molduras, engrenagens, numerais, conquistas e raridade.
   Nunca em botão de ação nem em texto longo. Nunca amarelo: use os tokens (dessaturados).
3. **Noite violeta é ar, não tinta.** Fundos de cena, halos, duotom de destaque, tecido. Texto
   pequeno em lavanda só com `--dv-violet-text`.
4. **Índigo é o sistema.** Foco, seleção, aba ativa, dados, barras de progresso. Discreto; nunca
   decorativo.
5. **Rubi é joia ou perigo.** Uma gota/pedra pequena por tela como ornamento (`BloodDrop`,
   `FacetGem tone="blood"`); fora isso, só alerta, tempo crítico e eliminação.
6. **Dose de ornamento (luxo gótico contido):** por tela, **1 ornamento-herói** (`CageFrame`,
   `RomanDial`, `CrossedSwords` ou a cena 3D com mostrador) + **no máximo 2 blocos com filigrana**
   (`ornate`, `BrassCorners`, `FrameCorners`) + **1 laço ou renda**. Ornamento nunca cobre texto e
   nunca anima rápido (engrenagens ≥ 60 s/volta, ponteiros ≥ 4 min/volta, lanterna 7 s).
7. **Materiais leves.** Tudo é CSS/SVG/canvas procedural; nada de imagens de textura externas.

### Materiais (utilitários em `app/globals.css`)
| Classe | Material | Uso |
|---|---|---|
| `dv-velvet` | veludo preto: micro-textura de pelo, brilho na borda superior, sombra violeta no pé | painel-herói escuro |
| `dv-record-panel` | o mesmo veludo + filete de latão por dentro | `RecordPanel` escuro (automático) |
| `dv-porcelain` | esmalte claro com reflexo e grão finíssimo | cartão claro, plaqueta, renda |
| `dv-cold-paper` | papel frio com retícula violeta e pauta de HUD | fundo do interior (`PaperSheet`) |
| `dv-marble` / `dv-marble-dark` | mármore branco/negro com veios cinza e um veio de latão (SVG procedural) | pedestal, faixa, tampo |
| `dv-checker-marble` | xadrez de mármore p/b com rejunte de latão | piso, tabuleiro |
| `dv-checker-faint` | xadrez quase invisível | textura do papel/porcelana |
| `dv-brass` / `dv-brass-text` / `dv-brass-edge` | latão escovado (preenchimento, texto, filete de 1px) | plaquetas, numerais grandes, molduras |
| `dv-night-sky` | céu do relógio: noite violeta com halo | atrás de heróis da Jornada |

### Ornamentos (`components/devo/kit/ornament`)
| Componente | O que é |
|---|---|
| `CageFrame` | gaiola de latão (cúpula, coroa com estrela, lanças cruzadas, cinto de losangos, fita lavanda) com conteúdo dentro — retrato do perfil, conquista |
| `RomanDial` | mostrador romano gigante com engrenagens e ponteiros lentos; `glass` mostra o céu violeta atrás |
| `Gear` | engrenagem de latão (`spin` lento) |
| `CheckerFloor` | piso xadrez de mármore em perspectiva (CSS) |
| `Sword` / `CrossedSwords` | espada de cerimônia (cravar com rotação) / selo de duas espadas com estrela |
| `Lantern` | lanterna gótica pendente com chama e balanço |
| `SigilStar` / `SigilLozenge` | estrela de 4 pontas / losango do sigilo |
| `FacetGem` / `BloodDrop` | vidro facetado em losango (vidro, ônix, noite, índigo, rubi) / gota de rubi |
| `LaceEdge` / `Bow` | renda de borda (babado) / laço preto com renda |
| `FiligreeCorner` / `BrassCorners` / `OrnamentBand` | canto de filigrana / 4 cantos / faixa de losangos e estrelas |
| `RecordPanel ornate` · `Frame` (tom ouro) | cantos de filigrana em latão nos painéis |

---

## 1. Princípios

1. **Um foco por tela.** Cada tela tem UM bloco-herói (relógio, carta, convocação, resultado). Ele
   ganha moldura `ornate`, a maior tipografia e a luz da cena 3D. O resto é secundário.
2. **O tempo está sempre visível.** Todo número de tempo usa `TimeDigits`/`Countdown` (fonte de
   impacto, dígitos de largura fixa). Abaixo de 6h vira vermelho e pulsa — automaticamente.
3. **Cor tem regra** (ver §2). Se você não sabe qual cor usar, use ink + texto. Cobalto só onde se
   toca; ouro só onde se admira; papel só onde se lê um documento; vermelho só onde se morre.
4. **Diagonal com intenção.** Cantos chanfrados (`dv-cut`), faixas inclinadas (−14° a −18°),
   entradas em corte diagonal. Nunca bordas arredondadas genéricas (`rounded-xl`) em superfícies.
5. **Ornamento escasso.** Filigrana em no máximo 1–2 blocos por tela. Brilho só em estado (hover,
   seleção, alerta), nunca decorativo permanente.
6. **Mobile primeiro** (390×844): alvos ≥ 44px, texto principal ≥ 14px (corpo 15–16px), rótulos
   caixa-alta ≥ 10px com tracking, contraste AA, `env(safe-area-inset-*)`, `prefers-reduced-motion`.

---

## 2. Tokens (`app/globals.css` → `:root`; espelho TS em `kit/tokens.ts`)

Classes Tailwind: `bg-dv-ink`, `text-dv-gold`, `border-dv-line`, etc. (prefixo `dv-` + nome).

| Token | Valor | Classe | Uso — e só isso |
|---|---|---|---|
| `--dv-ink` | `#0a090d` | `bg-dv-ink` | Fundo de tela |
| `--dv-ink-2` | `#121016` | `bg-dv-ink-2` | Superfície (painel) |
| `--dv-ink-3` | `#1b1824` | `bg-dv-ink-3` | Superfície alta, topo de gradiente |
| `--dv-ink-4` | `#282436` | `bg-dv-ink-4` | Realce de superfície |
| `--dv-cobalt` | `#4152c0` | `bg-dv-cobalt` | **Sistema/interação**: botão primário, aba ativa, foco, seleção |
| `--dv-cobalt-deep` | `#2f3c9c` | `bg-dv-cobalt-deep` | Faixas diagonais, carimbo cobalto, acento sobre papel |
| `--dv-cobalt-dim` | `#161a40` | `bg-dv-cobalt-dim` | Fundo de item selecionado |
| `--dv-cobalt-text` | `#9ea8ee` | `text-dv-cobalt-text` | Texto cobalto **pequeno** sobre ink (AA) |
| `--dv-gold` | `#b09a6c` | `text-dv-gold` | **Ornamento**: filetes, filigrana, kicker, conquista, ícone de recompensa |
| `--dv-gold-bright` | `#e3d5ac` | `text-dv-gold-bright` | Brilho do ouro, número de conquista |
| `--dv-gold-deep` | `#5e4d33` | `bg-dv-gold-deep` | Sombra do metal |
| `--dv-paper` | `#ece9e3` | `bg-dv-paper` / `dv-paper-bg` | **Documento**: Record, verso de regras, tiras, bilhetes, polaroides |
| `--dv-paper-2` | `#dbd7cf` | | Dobra/sombra do papel |
| `--dv-paper-ink` | `#141217` | `text-dv-paper-ink` | Texto sobre papel |
| `--dv-blood` | `#a3121f` | `bg-dv-blood` | **Só perigo**: tempo crítico, eliminação, alerta, badge de não lidos |
| `--dv-blood-deep` | `#3f060b` | | Fundo de alerta |
| `--dv-blood-text` | `#ff6670` | `text-dv-blood-text` | Texto vermelho sobre ink (AA) |
| `--dv-text` | `#eeecef` | `text-dv-text` | Texto principal |
| `--dv-text-2` | 74% | `text-dv-text-2` | Texto secundário (corpo longo) |
| `--dv-text-3` | 56% | `text-dv-text-3` | Rótulos, metadados (mín. 11px) |
| `--dv-line` | 14% | `border-dv-line` | Divisões |
| `--dv-line-strong` | 32% | `border-dv-line-strong` | Bordas de controles |
| `--dv-line-gold` | ouro 60% | `border-dv-line-gold` | Filete dourado |
| `--dv-night` / `--dv-night-2` | `#1c1b33` / `#34365a` | `bg-dv-night` | Atmosfera (céu, halo de cena). Nunca texto |
| `--dv-violet` / `--dv-violet-text` | `#6c6899` / `#aaa5d6` | `text-dv-violet-text` | Lavanda: duotom, tecido, luz; `-text` = AA sobre veludo |
| `--dv-porcelain` / `-2` / `-ink` | `#f2f0ec` / `#e0ddd8` / `#121016` | `bg-dv-porcelain` | Metade clara da base (renda, superfície clara) |
| `--dv-marble-vein` / `--dv-marble-black` | `#8a8986` / `#2e2f34` | | Mármore (veios, pedra negra) |

Outros: `--dv-glow-cobalt|gold|blood` (box-shadow), `--dv-shadow-1|2`, `--dv-cut` (10px) /
`--dv-cut-lg` (18px), curvas e durações (§7), `--dv-curtain` (1800ms).

**Compatibilidade:** `.dv-light`, `.dv-dark`, `--dv-blue*`, `--dv-red` e as variáveis shadcn
continuam iguais. Telas antigas não quebram; migre para os tokens novos ao redesenhar.

**Combinações proibidas:** vermelho como decoração; ouro em botão de ação; cobalto sobre papel em
texto < 14px (use `--dv-cobalt-deep`); texto `--dv-text-3` abaixo de 11px.

---

## 3. Tipografia

> **Renderização:** `html { text-rendering: geometricPrecision }` (globals.css) é obrigatório. As
> fontes do Google Fonts vêm com hinting; no Chromium do Linux isso arredonda o avanço de cada glifo
> e abre buracos ("Ajus tes", "is so"). Não sobrescreva `text-rendering` em componentes.


| Papel | Fonte | Classe | Tamanho (mobile) | Notas |
|---|---|---|---|---|
| Impacto | **Oswald** 500–700 | `font-impact` | 56–64px (herói), 28–44px (números) | Números de tempo, placares, índices, títulos de 1–2 palavras. Sempre caixa-alta. Pode `-skew-x-[8deg]`. |
| Marca | Cormorant Garamond 500 | `font-serif` | 62px | Só "DEADLY VOTE" e títulos-marca. |
| Display | Cinzel 600 | `font-display` | 20 / 26 / 34px | Títulos de seção, botões, abas. `tracking-[0.06em]` (títulos) a `0.28em` (botões). |
| Corpo | EB Garamond 400 | `font-body` | 15–16px, `leading-relaxed` | Diálogos, descrições, regras. |
| Sistema | IBM Plex Mono | `dv-label` | 11px (mín. 10px), `tracking-[0.22em]` caixa-alta | Kickers, rótulos, IDs, horários. |
| Interface | IBM Plex Sans | `font-sans` | 13–14px | Campos, textos utilitários longos. |

- Números de tempo: **sempre** `TimeDigits`/`Countdown` (largura fixa por dígito). Em outros
  números use `dv-tabular`.
- Escala recomendada: 10 · 11 · 13 · 15 · 18 · 20 · 26 · 34 · 44 · 56 · 64px.
- Japonês (`lang="ja"`) só como eco discreto de títulos (11px, `text-dv-text-3`).

---

## 4. Molduras e ornamentos

| Peça | Componente / utilitário | Quando |
|---|---|---|
| Chanfro nos 4 cantos | `dv-cut` (+ `style={{'--dv-cut':'14px'}}`) | Painéis, ícones de app |
| Chanfro diagonal (2 cantos) | `dv-cut-diag` | Toasts, badges, itens de lista |
| Pontas de flecha | `dv-cut-hex` | Botões |
| Moldura com filete | `<Frame variant tone cut ornate glow>` | Todo bloco de conteúdo |
| Cantos de filigrana | `ornate` ou `<FrameCorners/>` | 1–2 blocos-foco por tela |
| Moldura de tela | `<ScreenFrame tone="gold"/>` | Telas cheias (landing, acesso, resultado) |
| Papel | `dv-paper-bg` / `Frame variant="paper"` | Documentos |
| Costura | `dv-stitch` / `Divider variant="stitch"` | Diário, bilhetes |
| Faixa de perigo | `dv-hazard` | Só junto de alerta |
| Piso xadrez | `dv-checker` | Sala de Jogos (fallback de `table`) |
| Divisores | `<Divider variant="star|filigree|clock|stitch"/>` | Entre grupos |

`Frame` variantes: **ink** (padrão), **paper** (documento), **alert** (perigo), **glass** (sobre 3D).
Tons do filete: **neutral** (padrão), **gold** (foco/conquista), **cobalt** (selecionado/sistema),
**blood** (alerta). O conteúdo de `Frame` não é recortado (carimbos podem vazar a borda).

## 5. Ícones e glifos (`kit/glyphs.tsx`)

`GlyphSpark` (faísca), `GlyphDiamond` (marcador), `GlyphClock`, `GlyphHourglass`, `GlyphKeyhole`
(bloqueado), `GlyphCard`, `GlyphGavel` (votação), `GlyphClip`, `GlyphCheck`, `GlyphAlert` (só
perigo), `GlyphClose`, `GlyphArrow`, `CornerFiligree`, `toRoman(n)`.
Traço 1.4 em 24px, `currentColor`, decorativos (`aria-hidden`). O sigilo é sempre
`system/symbol.tsx` (`DeadlyVoteSymbol`). `lucide-react` só onde não houver glifo equivalente,
com `strokeWidth={1.4}`.

---

## 6. Componentes (`import { … } from '@/components/devo/kit'`)

| Componente | Uso em uma frase |
|---|---|
| `Frame` / `Panel` | Bloco com chanfro e filete; `Panel` adiciona kicker+título. |
| `ScreenFrame` | Moldura dourada de tela cheia, respeitando área segura. |
| `Button` | `variant` primary/secondary/ghost/danger, `size` sm/md/lg (44/48/56px), `loading`, `icon`, `block`, `sfx`. |
| `IconButton` | Quadrado chanfrado ≥ 44px; `label` obrigatório; `badge` numérico. |
| `Tabs` | Abas com indicador inclinado que desliza; teclado ←/→/Home/End; `children` = painel. |
| `SectionHeader` / `Kicker` / `ImpactTitle` | Cabeçalho com índice romano + filete; rótulo mono; título-herói com faixa diagonal (1 por tela). |
| `Divider` | Separador ornamental (`star`, `filigree`, `clock`, `stitch`). |
| `Badge` / `Chip` | Selo de estado (não clicável, `live` pisca); filtro alternável `aria-pressed`. |
| `Stat` / `StatGrid` | Número de impacto com rótulo e régua colorida (em `<dl>`). |
| `TimeDigits` / `Countdown` | Dígitos de largura fixa (0.6em por casa) com virada **mascarada** (o novo desce, o antigo sai por baixo, sempre dentro da casa); `units={['Dias','Horas','Min','Seg']}` centraliza um rótulo sob cada grupo. `Countdown units` (= Horas/Min/Seg) ou lista própria; fica vermelho < 6h. |
| `Sheet` / `Dialog` | Folha que sobe do rodapé (centraliza ≥ 640px); `Dialog` sempre central. Esc, foco preso. |
| `Toast` / `ToastStack` | Aviso visual com corte diagonal (tons system/gold/alert); a fila é de quem usa. |
| `Ticket` / `RewardStrip` | Tiras de papel numeradas penduradas num varal (claimed/today/upcoming/locked/missed) — check-in. |
| `PortraitFrame` | Retrato de NPC com tratamento único para PNG/WebP (`src`) e SVG (`children`): luz de borda na silhueta, grão, vinheta, base que se dissolve; `name`/`role` em plaqueta; `shape` arch/rect/round; `tone`. |
| `Plaque` / `OddsBar` | Placa metálica de status (em `<dl>`); barra de proporção cobalto × ouro (odds, votos). |
| `StatusSeal` / `PaperField` | Selo de status sobre papel (active/critical/idle); campo impresso rótulo+valor para documentos. |
| `useVisibleViewport` | Altura visível real (desconta o teclado do celular) para barras de ação fixas em formulários. |
| `CardFrame` | Carta 5:7 com moldura metálica, índice, verso oficial (`face="back"`), `holo`, `selected`. |
| `Stamp` | Carimbo de tinta `rect` ou `round` (com anel de texto); `animate` para a batida. |
| `Reveal` / `Stagger` | Entrada de um bloco / cascata de filhos (`cut`, `rise`, `left`, `right`, `pop`, `fade`; `inView`). |
| `Curtain` + `useCurtain` | Cortina de corte diagonal entre fases (§8). |
| `SceneBackdrop` | Fundo 3D com presets (§10). |

### Estados (todos os controles)

| Estado | Visual | Implementação |
|---|---|---|
| Repouso | Filete + preenchimento em gradiente | — |
| Hover (desktop) | Faixa de brilho atravessa (`dv-sheen`); secondary ganha filete ouro | `group-enabled:group-hover:` |
| Pressionado | `scale(0.97)` em 120ms + flash branco 15% | `enabled:active:` |
| Foco | Anel `--dv-cobalt-text` 2px, offset 3px | `dv-focus` |
| Selecionado | Fundo `cobalt-dim` + filete cobalto + brilho | `aria-pressed` / `aria-selected` |
| Desabilitado | 45% opacidade + dessaturado, cursor bloqueado; **não some** | `disabled` |
| Carregando | Relógio girando (`Spinner`) no lugar do texto, largura mantida, `aria-busy` | `loading` |
| Bloqueado (conteúdo) | `GlyphKeyhole` + `Badge` "Bloqueado" | — |

---

### Retratos de NPC (regra)

Todo NPC aparece dentro de `PortraitFrame` (ou, em cena cheia, com o mesmo tratamento: mesma luz
de borda e base em degradê). Nunca mostre o PNG/SVG "cru" com corte reto embaixo nem com fundo
próprio retangular. Tom: `gold` anfitriões/casa, `cobalt` sistema/aliados, `blood` ameaça,
`neutral` mentores. Enquadre com `position` (raster) e `scale`.

```tsx
<PortraitFrame src="/images/npc/rat-host-v2.png" alt="O Rato, anfitrião" name="O Rato" role="Anfitrião" tone="gold" />
<PortraitFrame alt="Herdeiro" tone="cobalt"><HerdeiroArt /></PortraitFrame>
```

### Peças que continuam nas áreas (candidatas, não movidas)

- `VsSplit` (`arcade/mesa.tsx`): depende do tipo `Duel` e das apostas — vira kit quando outra área
  precisar de um confronto A × B; a forma visual é `Frame` + `OddsBar` + dois `Monogram`.
- `Monogram`, `JavaliMedallion`, `AstrolabeDial` (`arcade/sala-ui.tsx`): específicos da Sala de Jogos.

## 7. Movimento

| Token | Valor | Uso |
|---|---|---|
| `--dv-ease-out` | `cubic-bezier(0.16,1,0.3,1)` | Entradas |
| `--dv-ease-cut` | `cubic-bezier(0.7,0,0.2,1)` | Cortes/wipes |
| `--dv-ease-snap` | `cubic-bezier(0.3,1.5,0.5,1)` | Pop, carimbo |
| `--dv-ease-in` | `cubic-bezier(0.6,0,0.9,0.4)` | Saídas |
| `--dv-dur-1` | 120ms | Pressão, toque |
| `--dv-dur-2` | 220ms | Hover, cor |
| `--dv-dur-3` | 360ms | Indicador de aba, saída, dígitos |
| `--dv-dur-4` | 520ms | Entrada de bloco, folha |
| `--dv-curtain` | 1800ms | Cortina entre fases |

Classes prontas: `animate-dv-cut-in`, `-rise`, `-slide-left`, `-slide-right`, `-pop`, `-fade`,
`-stamp`, `-digit`, `-sheet-up/-down`, `-toast-in`, `-ticket-in`, `-spin`, `-spin-slow`,
`-alert`, `-breathe`, `-blink`.

**Coreografia de entrada de tela (≤ 700ms no total):**
1. 0ms — cena 3D já está lá (fallback estático na primeira pintura).
2. 0–200ms — kicker (`fade`).
3. 150–500ms — título/herói (`cut`).
4. 300ms+ — conteúdo em `Stagger` (`rise`, 60ms por item, máx. 8 degraus).
5. Ações por último (`rise`), para o olho terminar nelas.

**Saída:** 220–360ms com `--dv-ease-in`, opacidade + deslocamento para o lado de onde veio a
navegação (`left`/`right`). Nada entra "do nada": todo elemento tem origem e direção.

**Reduzir movimento:** todas as classes `animate-dv-*` e a cortina param automaticamente
(`globals.css`); a cortina vira um esmaecer; cenas 3D desenham um quadro só.

---

## 8. Transições entre fases (`kit/transition.tsx`)

```tsx
const { curtain, run } = useCurtain()
run('Despertando', () => dispatch({ type: 'START_SESSION' }))       // avança
run('Saindo', () => goLanding(), { direction: 'back' })              // volta
run('Deadly Vote', () => openVote(), { tone: 'alert', sfx: 'reveal' }) // alerta
// …
<Curtain state={curtain} />
```

- Tempos fixos: ação em **850ms** (`CURTAIN_SWAP_MS`), some em **1800ms** (`CURTAIN_MS`).
- Bloqueia cliques duplos: enquanto corre, `run` retorna `false` e não faz nada.
- Coreografia: faixa colorida (cobalto/ouro/sangue) corta a −14° → lâmina escura cobre a tela
  (~470ms) com filete dourado → mostrador romano gira + rótulo entra com corte → barra de progresso →
  tudo sai na **mesma direção** (avançar = da esquerda para a direita; voltar = espelhado).
- `tone`: `system` (padrão), `gold` (conquista, desbloqueio), `alert` (Deadly Vote, eliminação).
- Rótulos: 1–2 palavras, verbo no gerúndio ou nome da fase.
- `devo-experience.tsx` já usa este sistema (mesma API `transition(label, action)`).

Dentro de um app (troca de aba/subtela) **não** use cortina: use `Reveal variant="left|right"`.

---

## 9. Som (`lib/devo/audio.ts` · mapa em `kit/tokens.ts → DV_SFX`)

| Intenção | `playSfx` | Onde |
|---|---|---|
| Toque comum | `click` | Botões, abas (Tabs já toca), chips usam `card-select` |
| Hover | `hover` | Só desktop e só depois do 1º gesto |
| Abrir / fechar | `open` / `close` | Apps, Sheet (já toca), voltar |
| Confirmar | `confirm` | Resgatar, inscrever, aceitar troca (Ticket já toca) |
| Erro | `error` | Validação, ação negada |
| Entrar em fase | `whoosh` | "Começar", junto da cortina |
| Revelação | `reveal` | Carta revelada, resultado, carimbo de eliminação |
| Aviso | `notify` | Toast chegando |
| Carta | `card` / `card-select` | Mover/virar / selecionar |
| Tique crítico | `chess-tick` | Contagem < 10s (máx. 1×/s) |
| Tempo crítico | `heartbeat` | Ao cruzar 6h (o `Countdown` já toca, uma vez) |

Nunca toque som em `useEffect` de montagem sem gesto do usuário (exceto `Countdown` crítico).
`Button`/`IconButton` aceitam `sfx="click"`; o padrão é silêncio (quem chama decide).

---

## 10. Cenas 3D (`kit/scene` · `<SceneBackdrop preset … />`)

```tsx
<div className="relative min-h-dvh">
  <SceneBackdrop preset="table" intensity={0.7} alert={critical} dim={0.35} />
  <div className="relative z-10">…conteúdo…</div>
</div>
```

| Preset | Cena | Onde |
|---|---|---|
| `clockhall` | **Cena-chave da Jornada.** Salão de valsa assombrado: mostrador gigante (céu violeta atrás do vidro, numerais romanos, aros de latão, ponteiros lentos, engrenagens, gotas de rubi), arcos góticos com vitrais, colunas, balaustrada, lanternas pendentes, piso xadrez de mármore que reflete o mostrador, poeira dourada. A câmera recua sozinha em tela retrato | Jornada: prólogo, tutorial, cortinas longas (as áreas da Jornada devem migrar `cathedral`/`sigil` → `clockhall` onde houver herói de tempo) |
| `sigil` | Astrolábio de latão (mostrador romano + 72h lavanda), anéis armilares, ponteiro de segundos, órbita, estrela do sigilo em 3D, poeira dourada | Landing, acesso, cortinas longas |
| `cathedral` | Nave com pilares na névoa, feixes de luz, cartas DEVO flutuando ao longe | Sistema (home) |
| `table` | Tabuleiro 8×8 de mármore com veios e rejunte de latão, espadas de cerimônia cravadas, rei negro de pé e peão branco tombado, luminária com cone de luz, cartas | Sala de Jogos |
| `corridor` | Corredor de portas numeradas com fechaduras acesas, porta final brilhando | Sala de Trocas |
| `tribunal` | Anel de assentos com plaquetas de papel, púlpito, estrela-juiz, luz vermelha zenital | Deadly Vote, Record |

Props: `intensity` 0..1 (padrão 0.8; abaixe em telas com muito texto), `alert` (pulso vermelho
1.6Hz — ligue em tempo crítico/eliminação), `focus` (só `sigil`: `{x,y,size}` em frações do
contêiner — a landing mede o herói e passa), `dim` 0..1 (véu escuro p/ contraste, padrão 0.25),
`lazy` (só monta quando aparece), `staticOnly`.

**Materiais:** metais usam o ambiente desenhado (`makeEnvTexture`, sem HDR externo) e o brilho de
borda fresnel (`useRimMaterial`) — a estrela do sigilo é prata-lavanda com contorno aceso; a do
tribunal, prata com contorno vermelho. Colunas da catedral têm caneluras, base e capitel numa
geometria instanciada, e faixas de bruma em camadas (`MistLayers`) escondem fundo e topo.

**Garantias de desempenho (já implementadas):**
- Primeira pintura = fallback estático (gradiente + desenho SVG do preset). WebGL carrega depois
  via `next/dynamic` (`ssr:false`) em `requestIdleCallback`, e entra com fade de 700ms.
- DPR ≤ 1.5 (≤ 1.25 no celular), `antialias` desligado no celular, sem sombras, sem stencil.
- No celular renderiza sob demanda a 30 qps (`Ticker`), metade do custo do loop contínuo.
- Renderizador por software (SwiftShader/llvmpipe, detectado por `WEBGL_debug_renderer_info`): DPR 0.75 e 15 qps.
- Pausa (`frameloop="never"`) com aba oculta ou fora da tela; `prefers-reduced-motion` → `demand`.
- Fallback definitivo se: sem WebGL, erro no React (boundary), `webglcontextlost`, ou > 7s.
- Texturas desenhadas em `<canvas>` e descartadas ao desmontar (`useDisposable`).

**Reflexo do `clockhall`:** cópia espelhada do mostrador e dos halos sob um piso semitransparente
(sem passe extra de render, sem `Reflector`). Mármore e céu são texturas de canvas com semente fixa.

**Orçamento por preset (celular):** ≤ 60 draw calls, ≤ 400 partículas, ≤ 30k triângulos, texturas
≤ 1024². Uma cena por tela. Nunca duas `SceneBackdrop` vivas ao mesmo tempo fora da vitrine.

---

## 11. Como aplicar numa tela (receita)

```tsx
import { Button, Countdown, Frame, Kicker, Panel, SceneBackdrop, SectionHeader, Stagger, Stat, StatGrid, Tabs } from '@/components/devo/kit'

export function MesaScreen({ endsAt }: { endsAt: number }) {
  const [tab, setTab] = useState<'mesa' | 'agenda'>('mesa')
  return (
    <div className="relative min-h-full bg-dv-ink text-dv-text">
      <SceneBackdrop preset="table" intensity={0.7} dim={0.4} />
      <div className="relative z-10 px-4 pb-6 pt-4">
        <SectionHeader index="I" kicker="Devo · Entretenimento" title="Sala de Jogos" />
        <Tabs label="Seções" value={tab} onValueChange={setTab} items={[{ value: 'mesa', label: 'Mesa' }, { value: 'agenda', label: 'Agenda' }]} fill panelClassName="pt-4">
          <Stagger className="grid gap-4">
            {/* 1. Herói: um só, com ornate */}
            <Panel kicker="Próxima partida" title="Memory Rush" ornate tone="gold" pad="lg">
              <Countdown endsAt={endsAt} size="lg" units />
              <Button block className="mt-4" sfx="confirm">Inscrever-se</Button>
            </Panel>
            {/* 2. Secundários: Frame neutro */}
            <Frame pad="md">
              <StatGrid>
                <Stat label="Score" value="1.240" tone="cobalt" />
                <Stat label="Posição" value="#4" />
                <Stat label="Reset" value="3d" />
              </StatGrid>
            </Frame>
          </Stagger>
        </Tabs>
      </div>
    </div>
  )
}
```

Checklist antes de pedir captura:
- [ ] Um herói por tela, com `ornate`; o resto sem filigrana.
- [ ] Cores pela regra do §2 (nenhum vermelho decorativo, nenhum ouro em ação).
- [ ] Todo tempo em `TimeDigits`/`Countdown`.
- [ ] Botões do kit (≥ 44px) com nomes acessíveis **iguais aos de antes** (o roteiro de captura usa).
- [ ] Ações principais entram só com opacidade (`fade`), sem transform, para ficarem tocáveis na hora.
- [ ] Entrada coreografada (§7), nada aparece seco.
- [ ] `SceneBackdrop` com `dim` suficiente para AA no texto por cima.
- [ ] Área segura (`dv-safe-top`, `dv-safe-bottom`, `dv-safe-x`).
- [ ] Sem novas dependências; nada de arte de terceiros.

---

## 12. Prova aplicada

- **Tela inicial** (`landing/landing-screen.tsx`): preset `sigil` medido atrás do herói,
  `ScreenFrame`, título-marca com faixa cobalto diagonal, relógio do pulso em `TimeDigits` num
  "bilhete" com filete dourado, `Button` primary/secondary. Mesmos nomes: "Começar", "Continuar",
  "Sair", som.
- **Cortina** (`devo-experience.tsx`): `useCurtain` + `Curtain`, mesmos rótulos e tempos; "Saindo"
  corre no sentido inverso.
