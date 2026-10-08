# DEVO — Identidade visual "Tribunal do Relógio"

> Um jogo mortal elegante: **o tempo é a moeda e o juiz.**
> Este guia é obrigatório para todo agente que mexer em telas. Vitrine viva: `/estilo`
> (fora de produção, ou com `DEVO_STYLEGUIDE=1`). Código: `components/devo/kit/`.

Referências de **qualidade**, nunca de aparência: Persona 5 Royal (composição ousada, cortes
diagonais, tipografia dramática, transições com direção), Danganronpa V3 (tensão, contraste duro,
vermelho que corta a tela, sensação de julgamento), Honkai: Star Rail (polimento, filigrana fina,
brilhos sutis, microinterações). Nada de copiar telas, personagens, logos, ícones ou composições.

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
| `--dv-ink` | `#05070d` | `bg-dv-ink` | Fundo de tela |
| `--dv-ink-2` | `#0a0f1c` | `bg-dv-ink-2` | Superfície (painel) |
| `--dv-ink-3` | `#111a2e` | `bg-dv-ink-3` | Superfície alta, topo de gradiente |
| `--dv-ink-4` | `#1a2440` | `bg-dv-ink-4` | Realce de superfície |
| `--dv-cobalt` | `#315dff` | `bg-dv-cobalt` | **Sistema/interação**: botão primário, aba ativa, foco, seleção |
| `--dv-cobalt-deep` | `#1647ff` | `bg-dv-cobalt-deep` | Faixas diagonais, carimbo cobalto, acento sobre papel |
| `--dv-cobalt-dim` | `#0b1a4d` | `bg-dv-cobalt-dim` | Fundo de item selecionado |
| `--dv-cobalt-text` | `#7d97ff` | `text-dv-cobalt-text` | Texto cobalto **pequeno** sobre ink (AA) |
| `--dv-gold` | `#c9a45c` | `text-dv-gold` | **Ornamento**: filetes, filigrana, kicker, conquista, ícone de recompensa |
| `--dv-gold-bright` | `#ecd49a` | `text-dv-gold-bright` | Brilho do ouro, número de conquista |
| `--dv-gold-deep` | `#7c5f2a` | `bg-dv-gold-deep` | Sombra do metal |
| `--dv-paper` | `#efe6d2` | `bg-dv-paper` / `dv-paper-bg` | **Documento**: Record, verso de regras, tiras, bilhetes, polaroides |
| `--dv-paper-2` | `#e2d5b8` | | Dobra/sombra do papel |
| `--dv-paper-ink` | `#1c1a22` | `text-dv-paper-ink` | Texto sobre papel |
| `--dv-blood` | `#d51f2b` | `bg-dv-blood` | **Só perigo**: tempo crítico, eliminação, alerta, badge de não lidos |
| `--dv-blood-deep` | `#5a0a10` | | Fundo de alerta |
| `--dv-blood-text` | `#ff5a63` | `text-dv-blood-text` | Texto vermelho sobre ink (AA) |
| `--dv-text` | `#eceef2` | `text-dv-text` | Texto principal |
| `--dv-text-2` | 74% | `text-dv-text-2` | Texto secundário (corpo longo) |
| `--dv-text-3` | 56% | `text-dv-text-3` | Rótulos, metadados (mín. 11px) |
| `--dv-line` | 14% | `border-dv-line` | Divisões |
| `--dv-line-strong` | 32% | `border-dv-line-strong` | Bordas de controles |
| `--dv-line-gold` | ouro 60% | `border-dv-line-gold` | Filete dourado |

Outros: `--dv-glow-cobalt|gold|blood` (box-shadow), `--dv-shadow-1|2`, `--dv-cut` (10px) /
`--dv-cut-lg` (18px), curvas e durações (§7), `--dv-curtain` (1800ms).

**Compatibilidade:** `.dv-light`, `.dv-dark`, `--dv-blue*`, `--dv-red` e as variáveis shadcn
continuam iguais. Telas antigas não quebram; migre para os tokens novos ao redesenhar.

**Combinações proibidas:** vermelho como decoração; ouro em botão de ação; cobalto sobre papel em
texto < 14px (use `--dv-cobalt-deep`); texto `--dv-text-3` abaixo de 11px.

---

## 3. Tipografia

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
| `TimeDigits` / `Countdown` | Dígitos de largura fixa com virada; contagem até `endsAt` que fica vermelha < 6h. |
| `Sheet` / `Dialog` | Folha que sobe do rodapé (centraliza ≥ 640px); `Dialog` sempre central. Esc, foco preso. |
| `Toast` / `ToastStack` | Aviso visual com corte diagonal (tons system/gold/alert); a fila é de quem usa. |
| `Ticket` / `RewardStrip` | Tiras de papel numeradas penduradas num varal (claimed/today/upcoming/locked/missed) — check-in. |
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
| `sigil` | Astrolábio dourado (mostrador romano + 72h cobalto), anéis armilares, ponteiro de segundos, órbita, estrela do sigilo em 3D, poeira dourada | Landing, acesso, cortinas longas |
| `cathedral` | Nave com pilares na névoa, feixes de luz, cartas DEVO flutuando ao longe | Sistema (home) |
| `table` | Piso xadrez, luminária pendente com cone de luz, cartas na mesa | Sala de Jogos |
| `corridor` | Corredor de portas numeradas com fechaduras acesas, porta final brilhando | Sala de Trocas |
| `tribunal` | Anel de assentos com plaquetas de papel, púlpito, estrela-juiz, luz vermelha zenital | Deadly Vote, Record |

Props: `intensity` 0..1 (padrão 0.8; abaixe em telas com muito texto), `alert` (pulso vermelho
1.6Hz — ligue em tempo crítico/eliminação), `focus` (só `sigil`: `{x,y,size}` em frações do
contêiner — a landing mede o herói e passa), `dim` 0..1 (véu escuro p/ contraste, padrão 0.25),
`lazy` (só monta quando aparece), `staticOnly`.

**Garantias de desempenho (já implementadas):**
- Primeira pintura = fallback estático (gradiente + desenho SVG do preset). WebGL carrega depois
  via `next/dynamic` (`ssr:false`) em `requestIdleCallback`, e entra com fade de 700ms.
- DPR ≤ 1.5 (≤ 1.25 no celular), `antialias` desligado no celular, sem sombras, sem stencil.
- Pausa (`frameloop="never"`) com aba oculta ou fora da tela; `prefers-reduced-motion` → `demand`.
- Fallback definitivo se: sem WebGL, erro no React (boundary), `webglcontextlost`, ou > 7s.
- Texturas desenhadas em `<canvas>` e descartadas ao desmontar (`useDisposable`).

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
