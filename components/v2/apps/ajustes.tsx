'use client'

import { useEffect, useState } from 'react'
import { ambientePreferencia, type AmbientePreferencia, playSfx, setAmbientePreferencia, setMuted, unlockAudio } from '@/lib/devo/audio'
import { promptInstall, requestNotifications, sendTestPush, usePwa } from '@/lib/devo/pwa'
import { useMuted } from '@/components/devo/hooks'
import { useOsNav } from '@/components/devo/os/os-nav'
import { callName, useDevo } from '@/components/devo/state/devo-store'
import { Sigilo } from '../comum'

/**
 * Ajustes no v2 (protótipo kit3/os-ajustes.js): Áudio (trilha e sons, som ambiente), Aplicativo (instalar e
 * notificações push de verdade, com o teste pelo servidor), Sistema (ficha e limpar avisos) e Sessão (nome, conta,
 * cartas, trocas e a volta à tela inicial). As funções são as do jogo (ajustes-app.tsx e shared/pwa-panel.tsx).
 * As "Cores do sistema" do protótipo ficam de fora: o v2 usa o esquema escolhido pelo dono (azul, paleta noite).
 */

const PERMISSAO: Record<string, string> = { granted: 'Ativadas', denied: 'Bloqueadas', default: 'Desativadas', unsupported: 'Indisponíveis' }

export function AjustesV2() {
  const { state, dispatch } = useDevo()
  const { exitToLanding, layout } = useOsNav()
  const mudo = useMuted()
  const [ambiente, setAmbiente] = useState<AmbientePreferencia>('auto')
  useEffect(() => setAmbiente(ambientePreferencia()), [])
  const { installEvent, installed, permission, isIos } = usePwa()
  const [ajuda, setAjuda] = useState<'instala' | 'aviso' | null>(null)
  const [teste, setTeste] = useState<'parado' | 'enviando' | 'enviado' | 'falhou'>('parado')
  const nome = callName(state) || 'Jogador'
  const alterna = (k: 'instala' | 'aviso') => {
    playSfx('click')
    setAjuda((a) => (a === k ? null : k))
  }

  return (
    <>
      <h4 style={{ marginTop: 0 }}>Áudio</h4>
      <div className="a-linha">
        <span>Trilha e sons de interface</span>
        <button
          className="r-bt chanfro"
          aria-pressed={!mudo}
          aria-label={mudo ? 'Ativar som' : 'Silenciar som'}
          onClick={() => {
            unlockAudio()
            setMuted(!mudo)
          }}
        >
          {mudo ? 'Desligado' : 'Ligado'}
        </button>
      </div>
      <p className="a-rot">Som ambiente</p>
      <div className="a-opcoes" role="radiogroup" aria-label="Som ambiente">
        {(
          [
            ['auto', 'Só na 1ª sessão'],
            ['ligado', 'Sempre'],
            ['desligado', 'Desligado'],
          ] as [AmbientePreferencia, string][]
        ).map(([v, t]) => (
          <button
            key={v}
            className="chanfro"
            role="radio"
            aria-checked={ambiente === v}
            onClick={() => {
              playSfx('click')
              setAmbiente(v)
              setAmbientePreferencia(v)
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <h4>Aplicativo</h4>
      <div className="a-linha">
        <span>{installed ? 'Instalado' : 'Não instalado'}</span>
        {!installed &&
          (installEvent ? (
            <button
              className="r-bt chanfro"
              onClick={() => {
                playSfx('click')
                promptInstall()
              }}
            >
              Instalar
            </button>
          ) : (
            <button className="r-bt chanfro" aria-expanded={ajuda === 'instala'} onClick={() => alterna('instala')}>
              Como instalar
            </button>
          ))}
      </div>
      {ajuda === 'instala' && (
        <div className="a-ajuda fundo">
          {isIos ? (
            <p>
              No iPhone: toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>. As notificações só funcionam com o app instalado.
            </p>
          ) : (
            <p>
              No menu do navegador, escolha <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.
            </p>
          )}
        </div>
      )}
      <div className="a-linha">
        <span>Notificações: {PERMISSAO[permission] ?? PERMISSAO.unsupported}</span>
        {permission === 'default' && (
          <button
            className="r-bt chanfro"
            onClick={() => {
              playSfx('click')
              requestNotifications()
            }}
          >
            Ativar
          </button>
        )}
      </div>
      {permission === 'granted' && (
        <>
          <button
            className="r-bt chanfro a-larga"
            disabled={teste === 'enviando'}
            onClick={async () => {
              playSfx('click')
              setTeste('enviando')
              setTeste((await sendTestPush()) ? 'enviado' : 'falhou')
            }}
          >
            {teste === 'enviando' ? 'Enviando…' : 'Testar notificação'}
          </button>
          {teste === 'enviado' && (
            <p className="a-rot" role="status">
              Enviada pelo servidor. Pode fechar o jogo que ela chega do mesmo jeito.
            </p>
          )}
          {teste === 'falhou' && (
            <p className="a-rot" role="status">
              Não foi possível registrar este aparelho. No iPhone, abra o jogo pelo ícone da tela de início.
            </p>
          )}
        </>
      )}
      {permission === 'denied' && (
        <>
          <button className="r-link" aria-expanded={ajuda === 'aviso'} onClick={() => alterna('aviso')}>
            Como liberar
          </button>
          {ajuda === 'aviso' && (
            <div className="a-ajuda fundo">
              <p>
                Toque no cadeado ao lado do endereço, abra <b>Permissões</b> e mude <b>Notificações</b> para permitir. Depois volte aqui.
              </p>
            </div>
          )}
        </>
      )}

      <h4>Sistema</h4>
      <dl className="a-ficha">
        <div>
          <dt>Versão</dt>
          <dd>DEVO 0.1 · experimental</dd>
        </div>
        <div>
          <dt>Interface</dt>
          <dd>{layout === 'desktop' ? 'Área de trabalho' : 'Smartphone'}</dd>
        </div>
        <div>
          <dt>Operador</dt>
          <dd>O Anfitrião</dd>
        </div>
      </dl>
      <div className="a-linha">
        <span>Central de avisos</span>
        <button
          className="r-bt chanfro"
          disabled={!state.notifications.length}
          onClick={() => {
            playSfx('click')
            dispatch({ type: 'CLEAR_NOTIFICATIONS' })
          }}
        >
          Limpar avisos
        </button>
      </div>

      <h4>Sessão</h4>
      <div className="a-sessao fundo">
        <Sigilo />
        <div>
          <strong>{nome}</strong>
          {state.characterName && state.playerName && state.characterName !== state.playerName && <small>Conta · {state.playerName}</small>}
          <small>
            {state.inventory.length} cartas · {state.tradesCompleted} trocas
          </small>
        </div>
      </div>
      <button className="r-bt chanfro a-larga" onClick={exitToLanding}>
        Tela inicial
      </button>
    </>
  )
}
