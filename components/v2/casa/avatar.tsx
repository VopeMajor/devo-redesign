'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { type Aparencia, APARENCIA_LIMITES, CORES_ROUPA, MARCAS, mesmaAparencia, ROUPAS } from '@/lib/devo/casa-aparencia'
import { AMOSTRA_ROUPA, CAB, carregaBusto, CEL_X, CEL_Y, desenhaBusto, folhaAndarFofo, OLHOS, type PecasBusto, PELES } from './avatar-cor'

/**
 * Criação do avatar e guarda-roupa (kit3/avatar.html, aprovado): prévia do busto no quarto, abas Corpo, Cabelo,
 * Rosto, Pele e Roupa, amostras de cor e miniaturas de cada opção, "Aleatório" e "Pronto".
 * Primeira escolha: grátis, assim que a Casa é desbloqueada. Guarda-roupa: "Salvar · 1 hora", só cobra se algo mudar
 * (o servidor cobra; esta tela só escolhe).
 */
type Aba = 'corpo' | 'cabelo' | 'rosto' | 'pele' | 'roupa'
const ABAS: [Aba, string][] = [
  ['corpo', 'Corpo'],
  ['cabelo', 'Cabelo'],
  ['rosto', 'Rosto'],
  ['pele', 'Pele'],
  ['roupa', 'Roupa'],
]
const L = 512
const rgb = (a: number[]) => `rgb(${a.join(',')})`
const sorteia = (n: number) => Math.floor(Math.random() * n)

let pecasCache: Promise<PecasBusto> | null = null
const pecas = () => (pecasCache ??= carregaBusto().catch((e) => ((pecasCache = null), Promise.reject(e))))

function Mini({ p, cfg, modo }: { p: PecasBusto; cfg: Aparencia; modo: 'cabeca' | 'corpo' | 'tronco' }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const chave = JSON.stringify(cfg)
  useEffect(() => {
    const b = ref.current
    if (!b) return
    const off = document.createElement('canvas')
    off.width = off.height = 192
    desenhaBusto(off.getContext('2d', { willReadFrequently: true })!, 192, p, cfg)
    const x = b.getContext('2d')!
    x.clearRect(0, 0, b.width, b.height)
    if (modo === 'tronco') x.drawImage(off, 26, 72, 140, 120, 0, 16, 192, 165)
    else if (modo === 'corpo') x.drawImage(off, 0, 0)
    else x.drawImage(off, 30, 0, 132, 132, 0, 0, 128, 128)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p, chave, modo])
  const lado = modo === 'cabeca' ? 128 : 192
  return <canvas ref={ref} width={lado} height={lado} />
}

/**
 * O chibi da Casa ao lado do retrato (dono, 09/11: "deixe o avatar mais bonito"): anda no lugar e vira devagar
 * (frente, direita, costas, esquerda), em pixel 2x, com a aparência que está sendo escolhida. Com movimento reduzido,
 * fica parado de frente.
 */
function ChibiPrevia({ cfg }: { cfg: Aparencia }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const folha = useRef<HTMLCanvasElement | null>(null)
  const chave = JSON.stringify(cfg)
  useEffect(() => {
    let vivo = true
    const t = setTimeout(() => {
      folhaAndarFofo(cfg).then(
        (f) => {
          if (vivo) folha.current = f
        },
        () => {},
      )
    }, 180)
    return () => {
      vivo = false
      clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave])
  useEffect(() => {
    const calmo = window.matchMedia('(prefers-reduced-motion:reduce)').matches
    const ORDEM = [0, 2, 3, 1]
    let q = 0
    const desenha = () => {
      const c = ref.current
      const f = folha.current
      if (!c || !f) return
      const x = c.getContext('2d')!
      x.imageSmoothingEnabled = false
      x.clearRect(0, 0, c.width, c.height)
      // 16 passos em cada direção, depois vira
      const dir = calmo ? 0 : ORDEM[Math.floor(q / 16) % 4]
      const col = calmo ? 0 : 1 + (q % 8)
      x.drawImage(f, col * CEL_X, dir * CEL_Y, CEL_X, CEL_Y, 0, 0, CEL_X * 2, CEL_Y * 2)
      q++
    }
    desenha()
    const t = setInterval(desenha, 90)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="cv-av-chibi" aria-hidden="true">
      <canvas ref={ref} width={CEL_X * 2} height={CEL_Y * 2} />
    </span>
  )
}
export function CriacaoAvatar({
  modo,
  inicial,
  trocaMinutos,
  onPronto,
  onVoltar,
}: {
  modo: 'criar' | 'guarda'
  inicial: Aparencia
  trocaMinutos: number
  /** Salva no servidor; devolve a mensagem de erro, se houver. */
  onPronto: (ap: Aparencia) => Promise<string | null>
  onVoltar: () => void
}) {
  const [p, setP] = useState<PecasBusto | null>(null)
  const [erro, setErro] = useState(false)
  const [cfg, setCfg] = useState<Aparencia>(inicial)
  const [aba, setAba] = useState<Aba>('cabelo')
  const [aviso, setAviso] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const tela = useRef<HTMLCanvasElement>(null)
  const painel = useRef<HTMLElement>(null)
  const guarda = modo === 'guarda'
  const antes = useMemo(() => inicial, [inicial])

  useEffect(() => {
    let vivo = true
    pecas().then(
      (x) => vivo && setP(x),
      () => vivo && setErro(true),
    )
    return () => {
      vivo = false
    }
  }, [])
  useEffect(() => {
    if (p && tela.current) desenhaBusto(tela.current.getContext('2d', { willReadFrequently: true })!, L, p, cfg)
  }, [p, cfg])
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onVoltar()
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  }, [onVoltar])
  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 2000)
    return () => clearTimeout(t)
  }, [aviso])

  // muda uma opção sem perder a rolagem da fileira de cores em que o toque aconteceu
  const muda = (k: keyof Aparencia, i: number, el?: HTMLElement | null) => {
    const fila = el?.closest('.cores') as HTMLElement | null
    const x = fila?.scrollLeft ?? 0
    setCfg((c) => ({ ...c, [k]: i }))
    requestAnimationFrame(() => {
      if (fila) fila.scrollLeft = x
    })
  }

  /** Fileira de cores. "zero" (opcional) é a primeira amostra, sem cor (vale 0); as outras valem índice + 1. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const amostras = (lista: any[][], chave: keyof Aparencia, titulo: string, ver: (c: any[]) => string, todas = false, zero: string | null = null) => {
    const base = zero ? 1 : 0
    return (
      <div>
        <p className="rotulo">{titulo}</p>
        <div className={'cores' + (todas ? ' todas' : '')} role="group" aria-label={titulo}>
          {zero && <button className="cor nenhuma" aria-label={zero} aria-pressed={cfg[chave] === 0} onClick={(e) => muda(chave, 0, e.currentTarget)} />}
          {lista.map((c, i) => (
            <button
              key={i}
              className="cor"
              style={{ background: ver(c) }}
              aria-label={String(c[0])}
              aria-pressed={cfg[chave] === i + base}
              onClick={(e) => muda(chave, i + base, e.currentTarget)}
            />
          ))}
        </div>
      </div>
    )
  }
  /** Opções em texto (detalhes do rosto). */
  const chips = (chave: keyof Aparencia, titulo: string, nomes: readonly string[]) => (
    <div>
      <p className="rotulo">{titulo}</p>
      <div className="chips" role="group" aria-label={titulo}>
        {nomes.map((n, i) => (
          <button key={n} aria-pressed={cfg[chave] === i} onClick={() => muda(chave, i)}>
            {n}
          </button>
        ))}
      </div>
    </div>
  )
  const corCab = (c: number[][]) => `linear-gradient(135deg,${rgb(c[3])},${rgb(c[2])} 50%,${rgb(c[1])})`
  const corOlho = (c: number[][]) => `radial-gradient(circle,#111 18%,${rgb(c[2])} 22%,${rgb(c[1])} 70%)`
  const grade = (chave: keyof Aparencia, n: number, nome: string, classe = '', nomes: readonly string[] | null = null) =>
    p && (
      <div className={'grade ' + classe}>
        {Array.from({ length: n }, (_, i) => (
          <button key={i} className="op" aria-label={nomes ? nomes[i] : `${nome} ${i + 1}`} aria-pressed={cfg[chave] === i} onClick={() => setCfg((c) => ({ ...c, [chave]: i }))}>
            <Mini p={p} cfg={{ ...cfg, [chave]: i }} modo={nomes ? 'tronco' : chave === 'corpo' ? 'corpo' : 'cabeca'} />
            {nomes && <small>{nomes[i]}</small>}
          </button>
        ))}
      </div>
    )

  const pronto = async () => {
    if (salvando) return
    if (guarda && mesmaAparencia(cfg, antes)) return setAviso('Nada mudou, então nada foi cobrado')
    setSalvando(true)
    const e = await onPronto(cfg)
    setSalvando(false)
    if (e) setAviso(e)
  }

  return (
    <div className="cv-av" role="dialog" aria-label={guarda ? 'Guarda-roupa' : 'Criação do avatar'}>
      {!p && <div className="cv-carrega">{erro ? 'Não foi possível abrir. Tente de novo.' : 'Abrindo a porta…'}</div>}
      <main className="cv-av-app">
        {/* sem seta, como no protótipo: no guarda-roupa sai pelo "Cancelar"; Esc e o voltar do aparelho também saem */}
        <header>
          <h1>{guarda ? 'Guarda-roupa' : 'Criação do avatar'}</h1>
        </header>
        <div className="cv-av-previa">
          <canvas ref={tela} className="cv-av-tela" width={L} height={L} role="img" aria-label="Prévia do seu avatar" />
          <ChibiPrevia cfg={cfg} />
        </div>
        <div role="tablist" aria-label="Partes do avatar" className="cv-av-abas">
          {ABAS.map(([id, nome]) => (
            <button
              key={id}
              role="tab"
              aria-selected={aba === id}
              onClick={() => {
                setAba(id)
                if (painel.current) painel.current.scrollTop = 0
              }}
            >
              {nome}
            </button>
          ))}
        </div>
        <section ref={painel} className="cv-av-painel" role="tabpanel">
          {aba === 'corpo' && grade('corpo', APARENCIA_LIMITES.corpo, 'Corpo', 'dois')}
          {aba === 'cabelo' && (
            <>
              {amostras(CAB, 'corCabelo', 'Cor do cabelo', corCab)}
              {amostras(CAB, 'corPontas', 'Pontas de outra cor', corCab, false, 'Sem pontas coloridas')}
              {grade('cabelo', APARENCIA_LIMITES.cabelo, 'Penteado')}
            </>
          )}
          {aba === 'rosto' && (
            <>
              {amostras(OLHOS, 'corOlhos', 'Cor dos olhos', corOlho)}
              {amostras(OLHOS, 'olho2', 'Outro olho de outra cor', corOlho, false, 'Os dois olhos iguais')}
              {chips('marca', 'Detalhes do rosto', MARCAS)}
              {grade('rosto', APARENCIA_LIMITES.rosto, 'Rosto')}
            </>
          )}
          {aba === 'pele' && amostras(PELES, 'pele', 'Tom de pele', (c) => `linear-gradient(135deg,${rgb(c[1])} 60%,${rgb(c[2])})`, true)}
          {aba === 'roupa' && (
            <>
              <div>
                <p className="rotulo">Cor da roupa</p>
                <div className="cores" role="group" aria-label="Cor da roupa">
                  {CORES_ROUPA.map((n, i) => {
                    const a = AMOSTRA_ROUPA[i]
                    return (
                      <button
                        key={n}
                        className={'cor' + (a ? '' : ' original')}
                        style={a ? { background: `rgb(${a.map(Math.round).join(',')})` } : undefined}
                        aria-label={n}
                        title={n}
                        aria-pressed={cfg.corRoupa === i}
                        onClick={(e) => muda('corRoupa', i, e.currentTarget)}
                      />
                    )
                  })}
                </div>
              </div>
              {grade('roupa', ROUPAS.length, 'Roupa', 'tres', ROUPAS)}
            </>
          )}

        </section>
        <footer>
          {guarda ? (
            <button onClick={onVoltar}>Cancelar</button>
          ) : (
            <button
              onClick={() =>
                setCfg({
                  corpo: sorteia(2),
                  cabelo: sorteia(18),
                  rosto: sorteia(18),
                  roupa: sorteia(ROUPAS.length),
                  corCabelo: sorteia(CAB.length),
                  corOlhos: sorteia(OLHOS.length),
                  pele: sorteia(PELES.length),
                  // as opções novas aparecem às vezes, não sempre
                  corPontas: Math.random() < 0.25 ? 1 + sorteia(CAB.length) : 0,
                  olho2: Math.random() < 0.12 ? 1 + sorteia(OLHOS.length) : 0,
                  corRoupa: Math.random() < 0.5 ? sorteia(CORES_ROUPA.length) : 0,
                  marca: Math.random() < 0.3 ? sorteia(MARCAS.length) : 0,
                })
              }
            >
              Aleatório
            </button>
          )}
          <button className="principal" disabled={salvando || !p} onClick={pronto}>
            {guarda ? `Salvar · ${trocaMinutos === 60 ? '1 hora' : `${trocaMinutos} min`}` : 'Pronto'}
          </button>
        </footer>
      </main>
      {aviso && (
        <div className="cv-aviso" role="status">
          {aviso}
        </div>
      )}
    </div>
  )
}
