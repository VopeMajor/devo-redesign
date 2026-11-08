'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { type Aparencia, APARENCIA_LIMITES, mesmaAparencia, ROUPAS } from '@/lib/devo/casa-aparencia'
import { CAB, carregaBusto, desenhaBusto, OLHOS, type PecasBusto, PELES } from './avatar-cor'

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
  const cores = useRef<HTMLDivElement>(null)
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
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 2000)
    return () => clearTimeout(t)
  }, [aviso])

  const muda = (k: keyof Aparencia, i: number) => {
    const x = cores.current?.scrollLeft ?? 0
    setCfg((c) => ({ ...c, [k]: i }))
    requestAnimationFrame(() => {
      if (cores.current) cores.current.scrollLeft = x
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const amostras = (lista: any[][], chave: keyof Aparencia, titulo: string, ver: (c: any[]) => string, todas = false) => (
    <div>
      <p className="rotulo">{titulo}</p>
      <div ref={cores} className={'cores' + (todas ? ' todas' : '')} role="group" aria-label={titulo}>
        {lista.map((c, i) => (
          <button key={i} className="cor" style={{ background: ver(c) }} aria-label={String(c[0])} aria-pressed={cfg[chave] === i} onClick={() => muda(chave, i)} />
        ))}
      </div>
    </div>
  )
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
        <header>
          <button className="cv-av-volta" aria-label={guarda ? 'Voltar ao quarto' : 'Sair da casa'} onClick={onVoltar}>
            ‹
          </button>
          <h1>{guarda ? 'Guarda-roupa' : 'Criação do avatar'}</h1>
        </header>
        <div className="cv-av-previa">
          <canvas ref={tela} className="cv-av-tela" width={L} height={L} role="img" aria-label="Prévia do seu avatar" />
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
              {amostras(CAB, 'corCabelo', 'Cor do cabelo', (c) => `linear-gradient(135deg,${rgb(c[3])},${rgb(c[2])} 50%,${rgb(c[1])})`)}
              {grade('cabelo', APARENCIA_LIMITES.cabelo, 'Penteado')}
            </>
          )}
          {aba === 'rosto' && (
            <>
              {amostras(OLHOS, 'corOlhos', 'Cor dos olhos', (c) => `radial-gradient(circle,#111 18%,${rgb(c[2])} 22%,${rgb(c[1])} 70%)`)}
              {grade('rosto', APARENCIA_LIMITES.rosto, 'Rosto')}
            </>
          )}
          {aba === 'pele' && amostras(PELES, 'pele', 'Tom de pele', (c) => `linear-gradient(135deg,${rgb(c[1])} 60%,${rgb(c[2])})`, true)}
          {aba === 'roupa' && grade('roupa', ROUPAS.length, 'Roupa', 'tres', ROUPAS)}
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
