'use client'

import { BalaoChat, Emblema, FotoMoldurada, classeEfeito } from '@/components/devo/cosmeticos/cosmetic-art'
import { BALOES, EFEITOS, EMBLEMAS, MOLDURAS } from '@/components/devo/cosmeticos/art'
import { type CosmeticoDef, type CosSlot, IMAGENS_CATALOGO } from '@/lib/devo/cosmeticos'
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
  'asas-crepusculo': 'Asas do Crepúsculo',
  'coracao-condessa': 'Coração da Condessa',
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
  return { key: `cosmetico:${id}`, name: NOMES[id] ?? id, description: null, rarity: 'raro', categoria, asset: `devo:${grupo}/${id}`, animado: ANIMADOS.has(id), poco: false, origem: 'poco', automatico: false, par: null, ordem: 0, active: true, imagem: null }
}

/** Item com arte em imagem (pipeline de arte), igual ao catálogo. */
function img(asset: string, nome: string, categoria: CosSlot): CosmeticoDef {
  const imagem = IMAGENS_CATALOGO[asset].imagem
  return { key: `cosmetico:${nome}`, name: nome, description: null, rarity: 'lendario', categoria, asset, animado: !!imagem.camadas?.length, poco: false, origem: 'evento', automatico: false, par: null, ordem: 0, active: true, imagem }
}
const ASAS = 'img:/images/cosmeticos/asas-do-crepusculo/moldura'
const CORACAO = 'img:/images/cosmeticos/coracao-da-condessa/emblema'

/** Lote 2 (infra/arte 2cce492): molduras em imagem e a mini própria de cada uma (quando existe). */
const LOTE2_NOMES: Record<string, string> = {
  ...NOMES,
  'catedral-esquecida': 'Catedral Esquecida',
  'relicario-marfim': 'Relicário de Marfim',
  'asas-do-crepusculo': 'Asas do Crepúsculo',
  'coracao-da-condessa': 'Coração da Condessa',
  'fortuna-profana': 'Fortuna Profana',
}
const idDe = (asset: string) => asset.split('/')[3]
const MOLDURAS_IMG = Object.keys(IMAGENS_CATALOGO).filter((a) => IMAGENS_CATALOGO[a].slots.includes('moldura_avatar'))
const EMBLEMAS_IMG = Object.keys(IMAGENS_CATALOGO).filter((a) => IMAGENS_CATALOGO[a].slots.includes('emblema'))
const BALOES_IMG = Object.keys(IMAGENS_CATALOGO).filter((a) => IMAGENS_CATALOGO[a].slots.includes('balao'))
const miniDe = (asset: string) => {
  const propria = asset.replace(/\/moldura$/, '/mini')
  return IMAGENS_CATALOGO[propria] ? propria : asset
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

      <section aria-label="Prévia da nova direção" className="mb-14">
        <Titulo n="✦" t="Prévia · nova direção" />
        <p className="mb-5 max-w-xl font-body text-[15px] leading-relaxed text-[#bdbcb8]">Arte gerada por IA no pipeline de arte (escolhas do dono: Asas v02, Coração v02), WebP transparente em cinco tamanhos. A gema do Coração tem brilho animado (desligável em Ajustes).</p>
        <article aria-label="Prévia: Asas do Crepúsculo" className="mb-10 flex flex-col gap-4">
          <h3 className="font-display text-[15px] font-semibold uppercase tracking-[0.08em] text-[#ece5d8]">Asas do Crepúsculo · moldura</h3>
          <div className="flex justify-center py-6">
            <FotoMoldurada formato="avatar" src={RET} moldura={img(ASAS, 'Asas do Crepúsculo', 'moldura_avatar')} largura={260} />
          </div>
          <div className="flex flex-wrap items-end justify-center gap-6 py-4">
            <FotoMoldurada formato="mini" src={MINI} moldura={img(ASAS, 'Asas do Crepúsculo', 'moldura_mini')} largura={150} />
            <FotoMoldurada formato="mini" src={MINI2} moldura={img(ASAS, 'Asas do Crepúsculo', 'moldura_mini')} largura={64} />
            <FotoMoldurada formato="mini" src={MINI} moldura={img(ASAS, 'Asas do Crepúsculo', 'moldura_mini')} largura={48} />
            <FotoMoldurada formato="mini" src={MINI2} moldura={img(ASAS, 'Asas do Crepúsculo', 'moldura_mini')} largura={36} />
          </div>
        </article>
        <article aria-label="Prévia: Coração da Condessa" className="flex flex-col gap-4">
          <h3 className="font-display text-[15px] font-semibold uppercase tracking-[0.08em] text-[#ece5d8]">Coração da Condessa · emblema</h3>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Emblema def={img(CORACAO, 'Coração da Condessa', 'emblema')} tamanho={180} />
            <div className="flex flex-col gap-3">
              <p className="flex items-center gap-1.5 font-body text-[17px]">Lune Arcanjo <Emblema def={img(CORACAO, 'Coração da Condessa', 'emblema')} tamanho={24} /></p>
              <p className="flex items-center gap-1.5 font-body text-[15px]">Lune Arcanjo <Emblema def={img(CORACAO, 'Coração da Condessa', 'emblema')} tamanho={20} /></p>
              <p className="flex items-center gap-1.5 bg-[#e7e6e3] px-2 py-1 font-body text-[15px] text-[#0d0d0f]">no papel <Emblema def={img(CORACAO, 'Coração da Condessa', 'emblema')} tamanho={22} /></p>
            </div>
          </div>
        </article>
      </section>

      <section aria-label="Lote 2 · molduras" className="mb-14">
        <Titulo n="✦" t="Lote 2 · molduras" />
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          {MOLDURAS_IMG.map((a) => {
            const nome = LOTE2_NOMES[idDe(a)] ?? idDe(a)
            const mini = img(miniDe(a), nome, 'moldura_mini')
            return (
              <article key={a} aria-label={`Lote 2: ${nome}`} className="flex flex-col gap-3">
                <h3 className="font-display text-[15px] font-semibold uppercase tracking-[0.08em] text-[#ece5d8]">
                  {nome}
                  {mini.imagem !== IMAGENS_CATALOGO[a].imagem && <span className="ml-2 font-mono text-[10px] text-[#c2b9ec]">mini própria</span>}
                </h3>
                <div className="flex flex-wrap items-center gap-8 px-6 py-4">
                  <FotoMoldurada formato="avatar" src={RET} moldura={img(a, nome, 'moldura_avatar')} largura={180} />
                  <div className="flex flex-col items-start gap-6">
                    <FotoMoldurada formato="mini" src={MINI} moldura={mini} largura={96} />
                    <div className="flex items-end gap-5">
                      <FotoMoldurada formato="mini" src={MINI2} moldura={mini} largura={48} animar={false} />
                      <FotoMoldurada formato="mini" src={MINI} moldura={mini} largura={36} animar={false} />
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section aria-label="Lote 3 · emblemas" className="mb-14">
        <Titulo n="✦" t="Lote 3 · emblemas" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
          {EMBLEMAS_IMG.map((a) => {
            const nome = LOTE2_NOMES[idDe(a)] ?? idDe(a)
            const e = img(a, nome, 'emblema')
            return (
              <article key={a} aria-label={`Lote 3: ${nome}`} className="flex flex-col items-center gap-2">
                <Emblema def={e} tamanho={96} />
                <p className="text-center font-display text-[12px] font-semibold uppercase tracking-[0.06em] text-[#ece5d8]">
                  {nome}
                  {e.animado && <span className="ml-1 font-mono text-[9px] text-[#c2b9ec]">anim.</span>}
                </p>
                <p className="flex items-center gap-1 font-body text-[15px]">
                  Lune <Emblema def={e} tamanho={20} animar={false} /> <Emblema def={e} tamanho={16} animar={false} />
                </p>
              </article>
            )
          })}
        </div>
      </section>

      <section aria-label="Lote 2 · balões" className="mb-14">
        <Titulo n="✦" t="Lote 2 · balões" />
        <div className="flex flex-col gap-6">
          {BALOES_IMG.map((a) => {
            const nome = LOTE2_NOMES[idDe(a)] ?? idDe(a)
            const b = img(a, nome, 'balao')
            return (
              <article key={a} aria-label={`Lote 2 balão: ${nome}`} className="flex flex-col gap-2">
                <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#bab09f]">{nome} · texto {b.imagem?.slice?.texto}</h3>
                <BalaoChat def={b} className="w-fit max-w-full font-body text-[15px] leading-snug">
                  Guardei lugar perto da janela. Alguém topa uma rodada de memória antes da mesa abrir?
                </BalaoChat>
                <BalaoChat def={b} className="w-fit max-w-full font-body text-[15px] leading-snug">
                  Eu topo.
                </BalaoChat>
              </article>
            )
          })}
        </div>
      </section>

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
