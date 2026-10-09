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

export type PlayerProfile = {
  age?: number
  gender?: string
  appearance?: Appearance
  /** Trocas de aparência "por afinidade" que ainda restam (começa em 1 ao escolher a primeira). */
  appearanceChangesLeft: number
  /** Histórico curto das trocas (para o Record/perfil). */
  appearanceHistory?: Appearance[]
}

export const EMPTY_PROFILE: PlayerProfile = { appearanceChangesLeft: 1 }

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
  const left = typeof r.appearanceChangesLeft === 'number' ? Math.max(0, Math.min(1, Math.floor(r.appearanceChangesLeft))) : 1
  return {
    age,
    gender: typeof r.gender === 'string' ? r.gender.slice(0, 40) : undefined,
    appearance: app(r.appearance),
    appearanceChangesLeft: left,
    appearanceHistory: Array.isArray(r.appearanceHistory) ? r.appearanceHistory.map(app).filter((a): a is Appearance => !!a).slice(-5) : undefined,
  }
}
