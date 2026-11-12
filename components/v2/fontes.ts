import { Barlow, Barlow_Semi_Condensed, Jersey_15 } from 'next/font/google'

/** Fontes do v2 servidas pelo próprio site (next/font): a casca e as partidas da Sala de Jogos usam as mesmas. */
const barlow = Barlow({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600', '700'], variable: '--v2-barlow' })
const barlowCond = Barlow_Semi_Condensed({ subsets: ['latin', 'latin-ext'], weight: ['500', '600', '700'], variable: '--v2-barlow-cond' })
const jersey = Jersey_15({ subsets: ['latin'], weight: '400', variable: '--v2-jersey' })

export const FONTES_V2 = [barlow.variable, barlowCond.variable, jersey.variable].join(' ')
