'use client'

import { BalaoChat, Emblema, FotoMoldurada, classeEfeito } from '@/components/devo/cosmeticos/cosmetic-art'
import { BALOES, EFEITOS, EMBLEMAS, MOLDURAS } from '@/components/devo/cosmeticos/art'
import type { CosmeticoDef, CosSlot } from '@/lib/devo/cosmeticos'
import { cn } from '@/lib/utils'

const NOMES: Record<string, string> = {
  'heranca-marfim': 'Herança de Marfim',
  'relogio-fim': 'Relógio do Fim',
  'pacto-carmesim': 'Pacto Carmesim',
  'olho-arcano': 'Olho do Arcano',
  'banquete-javali': 'Banquete do Javali',
  'asas-coruja': 'Asas da Coruja',
  'fortuna-rato': 'Fortuna do Rato',
  'ultima-badalada': 'Última Badalada',
  'rosa-sangue': 'Rosa de Sangue',
  'coroa-partida': 'Coroa Partida',
  'ampulheta-dourada': 'Ampulheta Dourada',
  'olho-destino': 'Olho do Destino',
  'chave-proibida': 'Chave Proibida',
  'as-espadas': 'Ás de Espadas',
  'lua-escarlate': 'Lua Escarlate',
  'fragmento-celestial': 'Fragmento Celestial',
  'engrenagem-herdeiro': 'Engrenagem do Herdeiro',
  'selo-anfitriao': 'Selo do Anfitrião',
  'pena-coruja': 'Pena de Prata',
  'ficha-javali': 'Ficha do Javali',
  'correspondencia-real': 'Correspondência Real',
  'confissao-carmesim': 'Confissão Carmesim',
  'ecos-arcano': 'Ecos do Arcano',
  'ultimo-suspiro': 'Último Suspiro',
  'mesa-destino': 'Mesa do Destino',
  'assinatura-noturna': 'Assinatura Noturna',
  'brasa-carmesim': 'Brasa Carmesim',
  'geada-prata': 'Geada de Prata',
}

const ANIMADOS = new Set(['relogio-fim', 'olho-arcano', 'ultima-badalada', 'olho-destino', 'lua-escarlate', 'fragmento-celestial', 'engrenagem-herdeiro', 'ecos-arcano', 'ultimo-suspiro', 'geada-prata'])

function def(grupo: string, id: string, categoria: CosSlot): CosmeticoDef {
  return { key: `cosmetico:${id}`, name: NOMES[id] ?? id, description: null, rarity: 'raro', categoria, asset: `devo:${grupo}/${id}`, animado: ANIMADOS.has(id), poco: false, origem: 'poco', automatico: false, par: null, ordem: 0, active: true }
}

const RET = '/images/cosmeticos/amostra-retrato.jpg'
const MINI = '/images/cosmeticos/amostra-mini.jpg'
const MINI2 = '/images/cosmeticos/amostra-mini-2.jpg'

function Titulo({ n, t }: { n: string; t: string }) {
  return (
    <div className="mb-4 flex items-baseline gap-3 border-b border-[rgba(186,176,159,0.35)] pb-2">
      <span className="font-impact text-[22px] text-[#bab09f]">{n}</span>
      <h2 className="font-serif text-[26px] font-light uppercase tracking-[0.04em] text-[#eeedeb]">{t}</h2>
    </div>
  )
}

/** Vitrine: a coleção inteira em tamanho grande, mais as escalas pequenas em que ela vai ser vista. */
export function Galeria() {
  return (
    <main className="min-h-screen bg-[#0c0c0e] px-4 pb-16 pt-6 text-[#eeedeb]">
      <header className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8f8e8b]">DEVO · coleção inicial</p>
        <h1 className="mt-2 font-serif text-[40px] font-light uppercase leading-none tracking-[0.03em]">Cosméticos</h1>
        <p className="mt-2 max-w-xl font-body text-[15px] leading-relaxed text-[#bdbcb8]">Oito molduras em dois formatos, doze emblemas, cinco balões e três efeitos de nome. Desenhados em SVG, por cima da foto, sem tocar na imagem.</p>
      </header>

      <section aria-label="Molduras" className="mb-12">
        <Titulo n="I" t="Molduras" />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {Object.keys(MOLDURAS).map((id) => (
            <article key={id} aria-label={NOMES[id]} className="flex flex-col gap-3">
              <h3 className="font-display text-[15px] font-semibold uppercase tracking-[0.08em] text-[#ece5d8]">
                {NOMES[id]}
                {ANIMADOS.has(id) && <span className="ml-2 font-mono text-[10px] text-[#c2b9ec]">animada</span>}
              </h3>
              <div className="flex flex-wrap items-end gap-4">
                <FotoMoldurada formato="avatar" src={RET} moldura={def('moldura', id, 'moldura_avatar')} largura={204} />
                <div className="flex flex-col items-start gap-3">
                  <FotoMoldurada formato="mini" src={MINI} moldura={def('moldura', id, 'moldura_mini')} largura={132} />
                  <div className="flex items-end gap-3">
                    <FotoMoldurada formato="mini" src={MINI2} moldura={def('moldura', id, 'moldura_mini')} largura={60} />
                    <FotoMoldurada formato="mini" src={MINI} moldura={def('moldura', id, 'moldura_mini')} largura={42} />
                    <FotoMoldurada formato="mini" src={MINI2} moldura={def('moldura', id, 'moldura_mini')} largura={32} />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-label="Emblemas" className="mb-12">
        <Titulo n="II" t="Emblemas" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Object.keys(EMBLEMAS).map((id) => (
            <article key={id} className="flex flex-col gap-2 bg-[#141416] p-3 shadow-[inset_0_0_0_1px_rgba(186,176,159,0.2)]">
              <Emblema def={def('emblema', id, 'emblema')} tamanho={72} />
              <p className="font-display text-[12px] font-semibold uppercase tracking-[0.06em]">{NOMES[id]}</p>
              <p className="flex items-center gap-1.5 font-body text-[15px]">
                <Emblema def={def('emblema', id, 'emblema')} tamanho={20} /> Lune <Emblema def={def('emblema', id, 'emblema')} tamanho={16} />
              </p>
              <p className="flex items-center gap-1.5 bg-[#e7e6e3] px-1.5 py-1 font-body text-[15px] text-[#0d0d0f]">
                <Emblema def={def('emblema', id, 'emblema')} tamanho={18} /> no papel
              </p>
            </article>
          ))}
        </div>
      </section>

      <section aria-label="Balões" className="mb-12">
        <Titulo n="III" t="Balões de chat" />
        <div className="flex max-w-xl flex-col gap-4">
          {Object.keys(BALOES).map((id) => (
            <div key={id}>
              <p className="mb-1 font-display text-[12px] font-semibold uppercase tracking-[0.06em] text-[#ece5d8]">{NOMES[id]}</p>
              <BalaoChat def={def('balao', id, 'balao')} className="w-fit max-w-full font-body text-[15px] leading-snug">
                Quem apostou no Ísis vai ter uma longa noite. Eu avisei na rodada passada.
              </BalaoChat>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Efeitos do nome">
        <Titulo n="IV" t="Efeitos do nome" />
        <div className="flex flex-col gap-3">
          {Object.keys(EFEITOS).map((id) => (
            <p key={id} className="flex items-baseline gap-4">
              <span className={cn('cos-nome text-[28px]', classeEfeito(def('efeito', id, 'efeito')))}>Lune Arcanjo</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#8f8e8b]">{NOMES[id]}</span>
            </p>
          ))}
          <p className="flex items-baseline gap-4">
            <span className="cos-nome cos-anfitriao text-[28px]">Mordomo</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#8f8e8b]">Anfitrião (público, não equipável)</span>
          </p>
        </div>
      </section>
    </main>
  )
}
