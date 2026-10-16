/**
 * Segunda aparência do jogador (DIRECAO-2 §5). Dois tipos: 2D/3D (personagem de anime/jogo/animação)
 * ou Real (ator/atriz/celebridade). Só aparências HUMANAS. A lista de "Seleção automática" é separada
 * por tipo, sexo e faixa etária; para "Real", pessoas reais menores de idade NÃO entram (a faixa
 * "adolescente" usa jovens adultos conhecidos por papéis adolescentes).
 */

export type AppearanceKind = 'art' | 'real'
export type AppearanceSex = 'f' | 'm'
export type AgeBand = 'teen' | 'young' | 'adult' | 'mature'

export type Appearance = {
  kind: AppearanceKind
  name: string
  /** Veio da Seleção automática. */
  auto: boolean
  chosenAt: number
}

/**
 * Perfil do jogador. Desde 16/10 (DIRECAO-3 §9) o jogador escolhe AS DUAS aparências no prólogo:
 * a 2D/3D (`appearanceArt`) e a real (`appearanceReal`). Regra de troca: **1 troca posterior para
 * cada aparência** (`appearanceChangesArt` / `appearanceChangesReal`). `appearanceChangesLeft` passa a
 * ser o total que ainda resta (soma das duas), mantido para quem lê o campo antigo.
 *
 * Saves antigos (só `appearance` + `appearanceChangesLeft`) continuam válidos: `sanitizeProfile`
 * coloca a aparência antiga no lugar do tipo dela e o outro tipo fica vazio até ser escolhido.
 */
export type PlayerProfile = {
  age?: number
  gender?: string
  /** Legado: a última aparência escolhida ou trocada (saves antigos só tinham esta). */
  appearance?: Appearance
  /** Aparência 2D/3D (personagem de anime, jogo, animação). */
  appearanceArt?: Appearance
  /** Aparência real (ator, atriz, celebridade). */
  appearanceReal?: Appearance
  /** Total de trocas "por afinidade" que ainda restam (soma das duas aparências). */
  appearanceChangesLeft: number
  /** Trocas que restam para a aparência 2D/3D (0 ou 1). */
  appearanceChangesArt?: number
  /** Trocas que restam para a aparência real (0 ou 1). */
  appearanceChangesReal?: number
  /** Histórico curto das trocas (para o Record/perfil). */
  appearanceHistory?: Appearance[]
}

export const EMPTY_PROFILE: PlayerProfile = { appearanceChangesLeft: 2, appearanceChangesArt: 1, appearanceChangesReal: 1 }

/** A aparência escolhida de um tipo (com saves antigos, a única que existir daquele tipo). */
export function appearanceOf(p: PlayerProfile, kind: AppearanceKind): Appearance | undefined {
  const slot = kind === 'art' ? p.appearanceArt : p.appearanceReal
  return slot ?? (p.appearance?.kind === kind ? p.appearance : undefined)
}

/** Trocas que ainda restam para um tipo de aparência. */
export function appearanceChangesFor(p: PlayerProfile, kind: AppearanceKind): number {
  return (kind === 'art' ? p.appearanceChangesArt : p.appearanceChangesReal) ?? 1
}

/** Grava a aparência de um tipo e o contador de trocas dele (o total é recalculado). */
function withSlot(p: PlayerProfile, a: Appearance, left: number): Partial<PlayerProfile> {
  const other = appearanceChangesFor(p, a.kind === 'art' ? 'real' : 'art')
  return a.kind === 'art'
    ? { appearanceArt: a, appearance: a, appearanceChangesArt: left, appearanceChangesLeft: left + other }
    : { appearanceReal: a, appearance: a, appearanceChangesReal: left, appearanceChangesLeft: left + other }
}

/** Patch do perfil ao escolher uma aparência no prólogo (cada tipo começa com 1 troca). */
export function chooseAppearance(p: PlayerProfile, a: Appearance): Partial<PlayerProfile> {
  return withSlot(p, a, 1)
}

/** Troca por afinidade (1 por tipo). Devolve o perfil novo, ou null se não houver troca para esse tipo. */
export function changeAppearanceIn(p: PlayerProfile, a: Appearance): PlayerProfile | null {
  const current = appearanceOf(p, a.kind)
  const left = appearanceChangesFor(p, a.kind)
  if (!current || left <= 0) return null
  return { ...p, ...withSlot(p, a, left - 1), appearanceHistory: [...(p.appearanceHistory ?? []), current].slice(-5) }
}

export const APPEARANCE_KIND_LABEL: Record<AppearanceKind, string> = {
  art: '2D / 3D',
  real: 'Real',
}

export function ageBand(age: number | undefined): AgeBand {
  if (!age || age < 18) return 'teen'
  if (age < 30) return 'young'
  if (age < 45) return 'adult'
  return 'mature'
}

export function sexOf(gender: string | undefined): AppearanceSex | null {
  if (gender === 'Feminino') return 'f'
  if (gender === 'Masculino') return 'm'
  return null
}

type Catalog = Record<AppearanceKind, Record<AppearanceSex, Record<AgeBand, string[]>>>

export const APPEARANCES: Catalog = {
  art: {
    f: {
      teen: ['Shoko Komi', 'Kaguya Shinomiya', 'Chika Fujiwara', 'Nobara Kugisaki', 'Hitagi Senjougahara', 'Haruhi Suzumiya', 'Mai Sakurajima'],
      young: ['Mikasa Ackerman', 'Yor Forger', 'Tifa Lockhart', 'Aerith Gainsborough', 'Violet Evergarden', 'Lara Croft', 'Ellie Williams', 'Nami'],
      adult: ['Misato Katsuragi', 'Nico Robin', 'Ada Wong', 'Motoko Kusanagi', 'Olivier Armstrong', 'Jill Valentine'],
      mature: ['Tsunade', 'Yuko Ichihara', 'Izumi Curtis', 'Lady Maria'],
    },
    m: {
      teen: ['Shoyo Hinata', 'Izuku Midoriya', 'Yuji Itadori', 'Edward Elric', 'Tanjiro Kamado', 'Light Yagami', 'Shinji Ikari'],
      young: ['Eren Yeager', 'Cloud Strife', 'Leon S. Kennedy', 'Spike Spiegel', 'Roronoa Zoro', 'Satoru Gojo', 'Guts'],
      adult: ['Levi Ackerman', 'Arthur Morgan', 'Roy Mustang', 'Kazuma Kiryu', 'Nathan Drake'],
      mature: ['Joel Miller', 'Big Boss', 'Isaac Netero', 'Jiraiya'],
    },
  },
  real: {
    f: {
      // Sem menores reais: atrizes adultas conhecidas por papéis adolescentes.
      teen: ['Jenna Ortega', 'Millie Bobby Brown', 'Sadie Sink', 'Hailee Steinfeld'],
      young: ['Zendaya', 'Bruna Marquezine', 'Sabrina Carpenter', 'Florence Pugh', 'Sydney Sweeney', 'Anya Taylor-Joy'],
      adult: ['Margot Robbie', 'Emma Stone', 'Scarlett Johansson', 'Gal Gadot', 'Taís Araújo', 'Alice Braga'],
      mature: ['Cate Blanchett', 'Viola Davis', 'Nicole Kidman', 'Fernanda Torres', 'Glória Pires', 'Meryl Streep'],
    },
    m: {
      teen: ['Tom Holland', 'Finn Wolfhard', 'Noah Schnapp', 'Asa Butterfield'],
      young: ['Timothée Chalamet', 'Jacob Elordi', 'Austin Butler', 'Paul Mescal', 'Jonathan Bailey'],
      adult: ['Henry Cavill', 'Oscar Isaac', 'Michael B. Jordan', 'Ryan Gosling', 'Chay Suede', 'Dev Patel'],
      mature: ['Keanu Reeves', 'Pedro Pascal', 'Rodrigo Santoro', 'Hugh Jackman', 'Denzel Washington', 'Wagner Moura'],
    },
  },
}

/** Lista preparada para o tipo, sexo e idade do jogador (sexo indefinido = as duas listas). */
export function appearancePool(kind: AppearanceKind, gender?: string, age?: number) {
  const band = ageBand(age)
  const sex = sexOf(gender)
  return sex ? APPEARANCES[kind][sex][band] : [...APPEARANCES[kind].f[band], ...APPEARANCES[kind].m[band]]
}

/** Sorteia uma aparência da lista preparada, evitando repetir a atual. */
export function autoAppearance(kind: AppearanceKind, gender?: string, age?: number, current?: string) {
  const pool = appearancePool(kind, gender, age).filter((n) => n !== current)
  return pool[Math.floor(Math.random() * pool.length)] ?? appearancePool(kind, gender, age)[0]
}

export function sanitizeProfile(raw: unknown): PlayerProfile {
  if (typeof raw !== 'object' || raw === null) return { ...EMPTY_PROFILE }
  const r = raw as Record<string, unknown>
  const app = (v: unknown): Appearance | undefined => {
    if (typeof v !== 'object' || v === null) return undefined
    const a = v as Record<string, unknown>
    const name = typeof a.name === 'string' ? a.name.trim().slice(0, 80) : ''
    if (!name) return undefined
    return { kind: a.kind === 'real' ? 'real' : 'art', name, auto: a.auto === true, chosenAt: typeof a.chosenAt === 'number' ? a.chosenAt : 0 }
  }
  const age = typeof r.age === 'number' && r.age >= 1 && r.age <= 150 ? Math.floor(r.age) : undefined
  const clamp1 = (v: unknown) => (typeof v === 'number' ? Math.max(0, Math.min(1, Math.floor(v))) : undefined)
  const legacy = app(r.appearance)
  // Save antigo: só `appearance` e um contador único — o contador vale para o tipo daquela aparência.
  const legacyLeft = clamp1(r.appearanceChangesLeft)
  const art = app(r.appearanceArt) ?? (legacy?.kind === 'art' ? legacy : undefined)
  const real = app(r.appearanceReal) ?? (legacy?.kind === 'real' ? legacy : undefined)
  const changesArt = clamp1(r.appearanceChangesArt) ?? (legacy?.kind === 'art' && legacyLeft !== undefined ? legacyLeft : 1)
  const changesReal = clamp1(r.appearanceChangesReal) ?? (legacy?.kind === 'real' && legacyLeft !== undefined ? legacyLeft : 1)
  return {
    age,
    gender: typeof r.gender === 'string' ? r.gender.slice(0, 40) : undefined,
    appearance: legacy,
    appearanceArt: art,
    appearanceReal: real,
    appearanceChangesLeft: changesArt + changesReal,
    appearanceChangesArt: changesArt,
    appearanceChangesReal: changesReal,
    appearanceHistory: Array.isArray(r.appearanceHistory) ? r.appearanceHistory.map(app).filter((a): a is Appearance => !!a).slice(-5) : undefined,
  }
}
