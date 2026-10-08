'use client'

import { useEffect, useRef, useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react'
import { checkInviteCode } from '@/app/actions/player'
import { authClient } from '@/lib/auth-client'
import { playSfx } from '@/lib/devo/audio'
import { cn } from '@/lib/utils'
import { Button } from '../kit/button'
import { GlyphAlert, GlyphArrow, GlyphCheck, GlyphClip } from '../kit/glyphs'
import { Stamp } from '../kit/stamp'

export type AccessMode = 'invite' | 'login'
type Step = 'code' | 'register' | 'login'
type FieldId = 'code' | 'user' | 'pass' | 'pass2'
type Status = 'idle' | 'ok' | 'error'

const USERNAME_MAX = 40
/** Tempo do carimbo "Aceito" antes do corte para o cadastro, e o meio da faixa diagonal. */
const STAMP_HOLD_MS = 620
const WIPE_SWAP_MS = 330

/** Any characters are allowed; collapsing whitespace only stops "Ana  Lima" from passing as a different name than "Ana Lima". */
function cleanName(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}
const INVITE_HEADER = 'x-devo-invite'

const SIGNUP_ERRORS: Record<string, string> = {
  INVITE_INVALID: 'Esse código acabou de ser usado. Peça outro.',
  INVITE_REQUIRED: 'Um código de convite é obrigatório.',
  NAME_TAKEN: 'Esse nome já pertence a outro jogador.',
  USERNAME_IS_ALREADY_TAKEN: 'Esse nome de usuário já existe.',
  USERNAME_IS_ALREADY_TAKEN_PLEASE_TRY_ANOTHER: 'Esse nome de usuário já existe.',
  USER_ALREADY_EXISTS: 'Esse nome de usuário já existe.',
  PASSWORD_TOO_SHORT: 'A senha precisa ter pelo menos 6 caracteres.',
  PASSWORD_TOO_LONG: 'A senha pode ter no máximo 128 caracteres.',
  INVALID_USERNAME: 'Escolha um nome para você.',
  USERNAME_IS_TOO_LONG: `O nome pode ter até ${USERNAME_MAX} caracteres.`,
  INVALID_ORIGIN: 'O sistema recusou esta janela. Recarregue a página e tente de novo.',
}

function signupError(err: { code?: string; message?: string } | null | undefined) {
  const code = err?.code ?? ''
  const message = err?.message ?? ''
  const known = SIGNUP_ERRORS[code] ?? SIGNUP_ERRORS[message]
  if (known) return known
  if (`${code}${message}`.includes('INVITE')) return SIGNUP_ERRORS.INVITE_INVALID
  if (`${code}${message}`.toUpperCase().includes('ORIGIN')) return SIGNUP_ERRORS.INVALID_ORIGIN
  return `Não foi possível criar a conta${message ? ` (${message})` : ''}. Tente novamente.`
}

/** Qual campo a mensagem de erro aponta (para marcar o campo em vermelho). */
function fieldOf(message: string): FieldId | null {
  if (/nome/i.test(message)) return 'user'
  if (/não conferem/i.test(message)) return 'pass2'
  if (/senha/i.test(message)) return 'pass'
  if (/código|convite/i.test(message)) return 'code'
  return null
}

/** Hex keeps the internal e-mail valid for any allowed username (e.g. "nome." or "a..b"). */
function internalEmail(name: string) {
  const hex = Array.from(new TextEncoder().encode(name.toLowerCase()), (b) => b.toString(16).padStart(2, '0')).join('')
  return `u${hex}@jogador.devo`
}

/**
 * Área visível de verdade (descontando o teclado do celular). O documento ocupa só essa área,
 * então a barra de ações (sticky) fica sempre acima do teclado.
 */
function useVisibleViewport() {
  const [box, setBox] = useState<{ h: number; top: number; keyboard: boolean } | null>(null)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => setBox({ h: vv.height, top: vv.offsetTop, keyboard: vv.height < window.innerHeight * 0.78 })
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])
  return box
}

const STEP_META: Record<Step, { index: string; of: string; stamp: string; ring: string }> = {
  code: { index: 'I', of: 'II', stamp: 'Convite', ring: 'DEVO · ADMISSÃO · USO ÚNICO ·' },
  register: { index: 'II', of: 'II', stamp: 'Registro', ring: 'COMPANHIA · DE · DESPERTADOS ·' },
  login: { index: 'I', of: 'I', stamp: 'Retorno', ring: 'DEVO · RECORD SYSTEM · RETORNO ·' },
}

/**
 * Acesso como "documento de admissão": papel marfim com costura do diário sobre a cena do sigilo.
 * Convite → (carimbo "Aceito" + corte diagonal) → cadastro; ou login direto.
 * ids preservados: #devo-code #devo-user #devo-pass #devo-pass2 (o roteiro de captura usa).
 */
export function AccessScreen({
  mode,
  onAuthenticated,
  onCancel,
}: {
  mode: AccessMode
  onAuthenticated: (kind: 'registered' | 'logged-in') => void
  onCancel: () => void
}) {
  const [step, setStep] = useState<Step>(mode === 'login' ? 'login' : 'code')
  const [code, setCode] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [errorField, setErrorField] = useState<FieldId | null>(null)
  const [errorSeq, setErrorSeq] = useState(0)
  const [pending, setPending] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [wipe, setWipe] = useState<{ seq: number; back: boolean } | null>(null)
  const [touched, setTouched] = useState<Partial<Record<FieldId, boolean>>>({})
  const timers = useRef<number[]>([])
  const view = useVisibleViewport()

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  /** Corte diagonal entre etapas: a faixa cobalto cobre o papel e a etapa troca no meio dela. */
  const cutTo = (next: Step, back = false) => {
    setWipe((w) => ({ seq: (w?.seq ?? 0) + 1, back }))
    later(() => setStep(next), WIPE_SWAP_MS)
    later(() => setWipe(null), 820)
  }

  const fail = (message: string, field: FieldId | null = fieldOf(message)) => {
    playSfx('error')
    setError(message)
    setErrorField(field)
    setErrorSeq((n) => n + 1)
  }

  const clearError = () => {
    if (error) {
      setError(null)
      setErrorField(null)
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (pending || accepted) return
    setError(null)
    setErrorField(null)
    setPending(true)
    try {
      if (step === 'code') {
        const res = await checkInviteCode(code)
        if (!res.ok) return fail(res.error, 'code')
        playSfx('confirm')
        // Carimbo "Aceito" no convite → corte diagonal → cadastro.
        setAccepted(true)
        later(() => {
          cutTo('register')
          later(() => setAccepted(false), WIPE_SWAP_MS)
        }, STAMP_HOLD_MS)
        return
      }

      const name = cleanName(username)
      if (!name) return fail('Escolha um nome para você.', 'user')
      if (password.length < 6) return fail('A senha precisa ter pelo menos 6 caracteres.', 'pass')

      if (step === 'register') {
        if (password !== confirm) return fail('As senhas não conferem.', 'pass2')
        const { error: err } = await authClient.signUp.email(
          { email: internalEmail(name), password, name, username: name, displayUsername: name },
          { headers: { [INVITE_HEADER]: code } },
        )
        if (err) return fail(signupError(err))
        playSfx('confirm')
        onAuthenticated('registered')
        return
      }

      const { error: err } = await authClient.signIn.username({ username: name, password })
      if (err) return fail('Usuário ou senha incorretos.', 'pass')
      playSfx('confirm')
      onAuthenticated('logged-in')
    } catch {
      fail('O sistema não respondeu. Tente novamente.', null)
    } finally {
      setPending(false)
    }
  }

  const title = step === 'code' ? 'Convite' : step === 'register' ? 'Quem é você?' : 'Identifique-se'
  const lead =
    step === 'code'
      ? 'O DEVO só abre para quem foi chamado. Digite o código que você recebeu.'
      : step === 'register'
        ? 'Diga como quer ser chamado (nome e sobrenome, se quiser) e escolha uma senha para voltar.'
        : 'Entre com o nome e a senha que você escolheu.'

  const name = cleanName(username)
  const canSubmit =
    step === 'code'
      ? code.trim().length >= 6
      : name.length > 0 && password.length >= 6 && (step === 'login' || confirm.length > 0)

  // Estado de cada campo: erro (servidor ou validação local), ok (requisito cumprido) ou neutro.
  const passShort = password.length > 0 && password.length < 6
  const mismatch = confirm.length > 0 && confirm !== password && (Boolean(touched.pass2) || confirm.length >= password.length)
  const status: Record<FieldId, Status> = {
    code: errorField === 'code' ? 'error' : accepted ? 'ok' : 'idle',
    user: errorField === 'user' ? 'error' : name.length > 0 ? 'ok' : 'idle',
    pass: errorField === 'pass' || (touched.pass && passShort) ? 'error' : step === 'register' && password.length >= 6 ? 'ok' : 'idle',
    pass2: errorField === 'pass2' || mismatch ? 'error' : confirm.length > 0 && confirm === password ? 'ok' : 'idle',
  }
  const inline: Partial<Record<FieldId, string>> = {
    pass: touched.pass && passShort ? `Mínimo de 6 caracteres · faltam ${6 - password.length}` : undefined,
    pass2: mismatch ? 'As senhas ainda não são iguais' : undefined,
  }

  const meta = STEP_META[step]
  const keyboard = Boolean(view?.keyboard)

  const focusIntoView = (el: HTMLElement) => {
    window.setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 280)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="devo-access-title"
      className="fixed inset-x-0 z-[90] flex flex-col"
      style={{ top: view?.top ?? 0, height: view ? view.h : '100dvh' }}
    >
      {/* Véu: a cena do sigilo continua viva atrás do documento. */}
      <div aria-hidden="true" className="animate-dv-fade absolute inset-0 bg-[radial-gradient(130%_90%_at_50%_28%,rgba(5,7,13,0.25),rgba(5,7,13,0.9)_70%)]" />

      <div className="devo-scroll relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <form onSubmit={submit} noValidate className="relative mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-4 pb-4 pt-[max(env(safe-area-inset-top),1.5rem)]">
          <div className="en-doc-in relative mt-3 drop-shadow-[0_34px_40px_rgba(0,0,0,0.8)]">
            {/* Papel marfim com canto dobrado */}
            <div aria-hidden="true" className="absolute inset-0 overflow-hidden [clip-path:polygon(0_0,calc(100%-28px)_0,100%_28px,100%_100%,0_100%)]">
              <div className="dv-paper-bg absolute inset-0" />
              <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_20%_0%,rgba(255,255,255,0.35),transparent_60%),radial-gradient(90%_60%_at_100%_100%,rgba(124,95,42,0.18),transparent_70%)]" />
              {/* Corte diagonal entre etapas */}
              {wipe && (
                <span key={wipe.seq} className={cn('absolute -inset-y-[10%] left-[-20%] w-[140%]', wipe.back ? 'en-wipe-back' : 'en-wipe')}>
                  <span className="absolute inset-0 bg-[linear-gradient(90deg,#0d1f7a,var(--dv-cobalt-deep)_55%,#5b78ff)]" />
                  <span className="absolute inset-y-0 left-0 w-[2px] bg-dv-gold" />
                  <span className="absolute inset-y-0 right-0 w-[2px] bg-dv-gold" />
                </span>
              )}
            </div>
            <span aria-hidden="true" className="absolute right-0 top-0 size-7 bg-[linear-gradient(225deg,transparent_50%,var(--dv-paper-2)_50%,#cdbd98)] shadow-[-2px_2px_4px_rgba(0,0,0,0.25)]" />
            {/* Costura do diário */}
            <span aria-hidden="true" className="pointer-events-none absolute inset-[9px] border border-dashed border-dv-paper-ink/25 [clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,0_100%)]" />
            {/* Fita marcadora + clipe */}
            <span aria-hidden="true" className="absolute -top-2.5 left-7 h-16 w-5 bg-[linear-gradient(90deg,#0d2bb8,var(--dv-cobalt-deep)_50%,#0d2bb8)] shadow-[0_3px_6px_rgba(0,0,0,0.35)] [clip-path:polygon(0_0,100%_0,100%_100%,50%_80%,0_100%)]" />
            <GlyphClip className="absolute -top-4 left-[3.4rem] size-9 rotate-[18deg] text-[#8d93a3] drop-shadow-[0_2px_1px_rgba(0,0,0,0.35)]" />

            <div className="relative px-6 pb-2 pt-9 text-dv-paper-ink sm:px-8">
              {/* Cabeçalho do formulário */}
              <div className="flex items-start justify-between gap-3 pl-12">
                <p className="dv-label text-[10px] leading-relaxed text-dv-paper-ink/70">
                  Companhia de Despertados
                  <br />
                  <span className="text-dv-cobalt-deep">Admissão · DEVO</span>
                </p>
                <p className="dv-label shrink-0 text-right text-[10px] leading-relaxed text-dv-paper-ink/60">
                  Form. A-72
                  <br />
                  Etapa {meta.index}/{meta.of}
                </p>
              </div>

              <Stamp
                key={`stamp-${step}`}
                shape="round"
                text={meta.stamp}
                ring={meta.ring}
                tone="cobalt"
                size={88}
                rotate={14}
                animate
                className={cn('pointer-events-none absolute right-3 top-[5.6rem] opacity-80 transition-opacity', keyboard && 'opacity-0')}
              />

              <div key={step} className="animate-dv-cut-in [animation-delay:60ms]">
                <div className="mt-5 flex items-end gap-3 pr-20">
                  <span aria-hidden="true" className="font-impact text-[52px] font-semibold leading-[0.78] text-dv-gold-deep/70 -skew-x-[8deg]">
                    {meta.index}
                  </span>
                  <h2 id="devo-access-title" className="min-w-0 font-display text-[30px] font-semibold uppercase leading-[1.02] tracking-[0.05em] text-dv-paper-ink">
                    {title}
                  </h2>
                </div>
                <div aria-hidden="true" className="relative mt-3 h-px bg-dv-paper-ink/25">
                  <span className="absolute -top-[1px] left-[18%] h-[3px] w-8 bg-dv-cobalt-deep" />
                </div>
                <p
                  className={cn(
                    'overflow-hidden text-pretty font-body text-[16px] italic leading-relaxed text-dv-paper-ink/80 transition-[max-height,opacity,margin] duration-300',
                    keyboard ? 'mt-0 max-h-0 opacity-0' : 'mt-3 max-h-40 opacity-100',
                  )}
                >
                  {lead}
                </p>

                <div className="mt-5 flex flex-col gap-4">
                  {step === 'code' ? (
                    <DocField
                      id="devo-code"
                      label="Código de convite"
                      status={status.code}
                      shake={errorField === 'code' ? errorSeq : 0}
                      overlay={
                        accepted ? (
                          <Stamp text="Aceito" tone="cobalt" size={104} rotate={-9} animate className="pointer-events-none absolute right-2 top-0" />
                        ) : null
                      }
                      inputProps={{
                        autoFocus: true,
                        autoComplete: 'off',
                        autoCapitalize: 'characters',
                        spellCheck: false,
                        maxLength: 32,
                        value: code,
                        onChange: (e) => {
                          setCode(e.target.value.toUpperCase())
                          clearError()
                          playSfx('type')
                        },
                        onFocus: (e) => focusIntoView(e.currentTarget),
                        placeholder: 'DEVO-XXXX-XXXX',
                        readOnly: accepted,
                        className: 'font-mono text-[18px] uppercase tracking-[0.16em]',
                      }}
                    />
                  ) : (
                    <>
                      <DocField
                        id="devo-user"
                        label="Seu nome"
                        status={status.user}
                        shake={errorField === 'user' ? errorSeq : 0}
                        inputProps={{
                          autoFocus: true,
                          autoComplete: 'username',
                          autoCapitalize: 'words',
                          spellCheck: false,
                          maxLength: USERNAME_MAX,
                          value: username,
                          onChange: (e) => {
                            setUsername(e.target.value)
                            clearError()
                            playSfx('type')
                          },
                          onFocus: (e) => focusIntoView(e.currentTarget),
                          placeholder: 'Ex.: Ana Lima',
                          className: 'font-body text-[19px]',
                        }}
                      />
                      <DocField
                        id="devo-pass"
                        label="Senha"
                        status={status.pass}
                        message={inline.pass}
                        shake={errorField === 'pass' ? errorSeq : 0}
                        secret
                        inputProps={{
                          autoComplete: step === 'register' ? 'new-password' : 'current-password',
                          value: password,
                          onChange: (e) => {
                            setPassword(e.target.value)
                            clearError()
                          },
                          onFocus: (e) => focusIntoView(e.currentTarget),
                          onBlur: () => setTouched((t) => ({ ...t, pass: true })),
                          placeholder: 'Senha',
                        }}
                      />
                      {step === 'register' && (
                        <DocField
                          id="devo-pass2"
                          label="Confirme a senha"
                          status={status.pass2}
                          message={inline.pass2}
                          shake={errorField === 'pass2' ? errorSeq : 0}
                          secret
                          inputProps={{
                            autoComplete: 'new-password',
                            value: confirm,
                            onChange: (e) => {
                              setConfirm(e.target.value)
                              clearError()
                            },
                            onFocus: (e) => focusIntoView(e.currentTarget),
                            onBlur: () => setTouched((t) => ({ ...t, pass2: true })),
                            placeholder: 'Confirme a senha',
                          }}
                        />
                      )}
                    </>
                  )}
                </div>

                {step === 'register' && (
                  <>
                    <ul className="mt-5 flex flex-col gap-2 border-l-2 border-dv-paper-ink/15 pl-3" aria-label="Requisitos">
                      {[
                        { ok: name.length > 0, text: 'Nome: do jeito que quiser, com espaços e acentos (só não pode repetir)' },
                        { ok: password.length >= 6, text: 'Senha: pelo menos 6 caracteres (qualquer símbolo vale)' },
                        { ok: confirm.length > 0 && confirm === password, text: 'As duas senhas são iguais' },
                      ].map((r) => (
                        <li key={r.text} className={cn('flex items-start gap-2.5 font-sans text-[13px] leading-snug transition-colors', r.ok ? 'text-dv-paper-ink' : 'text-dv-paper-ink/65')}>
                          <span
                            aria-hidden="true"
                            className={cn(
                              'mt-[1px] grid size-4 shrink-0 place-items-center border transition-colors duration-[220ms]',
                              r.ok ? 'border-dv-cobalt-deep bg-dv-cobalt-deep text-white' : 'border-dv-paper-ink/40 bg-white/30',
                            )}
                          >
                            {r.ok && <GlyphCheck className="size-3" />}
                          </span>
                          <span className="sr-only">{r.ok ? 'Cumprido: ' : 'Pendente: '}</span>
                          {r.text}
                        </li>
                      ))}
                    </ul>
                    {/* Linha de assinatura: o nome digitado vira a assinatura do documento. */}
                    <div aria-hidden="true" className="mt-5 flex items-end gap-3">
                      <span className="dv-label pb-1 text-[10px] text-dv-paper-ink/60">Assinatura</span>
                      <span className="relative min-h-9 flex-1 truncate border-b border-dv-paper-ink/45 pb-0.5 font-serif text-[26px] italic leading-none text-dv-cobalt-deep">
                        {name}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div
                id="devo-access-hint"
                role="alert"
                className={cn(
                  'mt-4 flex min-h-6 items-start gap-2',
                  error
                    ? 'border-l-[3px] border-dv-blood bg-[rgba(213,31,43,0.08)] px-3 py-2 font-sans text-[14px] leading-snug text-[#a3121c]'
                    : 'dv-label text-[10px] text-dv-paper-ink/60',
                )}
              >
                {error && <GlyphAlert className="mt-[1px] size-4 shrink-0 text-dv-blood" />}
                <span>{error ?? (step === 'code' ? 'Uso único' : step === 'register' ? 'Senha com 6+ caracteres' : '')}</span>
              </div>
            </div>

            {/* Ações: presas ao rodapé da área visível — o teclado nunca cobre o botão. */}
            <div className="sticky bottom-0 z-10 px-6 pb-[max(env(safe-area-inset-bottom),14px)] pt-3 sm:px-8">
              <span aria-hidden="true" className="dv-paper-bg absolute inset-0" />
              <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-5 h-5 bg-gradient-to-t from-[var(--dv-paper)] to-transparent" />
              <span aria-hidden="true" className="absolute inset-x-6 top-0 border-t border-dashed border-dv-paper-ink/25" />
              <div className="relative flex flex-col items-center gap-1">
                <Button type="submit" variant="primary" size="lg" block loading={pending} disabled={pending || accepted || !canSubmit}>
                  {step === 'code' ? 'Validar' : step === 'register' ? 'Assinar' : 'Entrar'}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    playSfx('close')
                    setError(null)
                    setErrorField(null)
                    if (step === 'register') cutTo('code', true)
                    else onCancel()
                  }}
                  className="dv-focus group inline-flex min-h-11 items-center gap-2 px-4 font-display text-[12px] font-semibold uppercase tracking-[0.28em] text-dv-paper-ink/75 transition-colors hover:text-dv-paper-ink"
                >
                  <GlyphArrow className="size-4 rotate-180 transition-transform group-hover:-translate-x-1" />
                  Voltar
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * Campo do documento: rótulo mono, linha de preenchimento e estado visível.
 * Foco = filete e marcador cobalto; erro = linha e mensagem em vermelho + tremida; ok = visto cobalto.
 */
function DocField({
  id,
  label,
  status,
  message,
  secret = false,
  shake = 0,
  overlay,
  inputProps,
}: {
  id: string
  label: string
  status: Status
  message?: string
  secret?: boolean
  /** Muda a cada erro neste campo: dispara a tremida (sem remontar o input, o foco fica). */
  shake?: number
  overlay?: ReactNode
  inputProps: InputHTMLAttributes<HTMLInputElement>
}) {
  const [reveal, setReveal] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const { className, ...rest } = inputProps
  const error = status === 'error'
  const ok = status === 'ok'

  useEffect(() => {
    if (!shake || !box.current?.animate) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    box.current.animate(
      [{ transform: 'none' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(-3px)' }, { transform: 'none' }],
      { duration: 360, easing: 'ease-out' },
    )
  }, [shake])

  return (
    <div ref={box} className="group/field relative">
      <label
        htmlFor={id}
        className={cn(
          'dv-label flex items-center justify-between text-[11px] transition-colors',
          error ? 'text-[#a3121c]' : 'text-dv-paper-ink/70 group-focus-within/field:text-dv-cobalt-deep',
        )}
      >
        <span>{label}</span>
        <span aria-hidden="true" className="flex items-center gap-1 text-[10px]">
          {error && (
            <>
              <GlyphAlert className="size-3.5" /> Corrigir
            </>
          )}
          {ok && (
            <span className="flex items-center gap-1 text-dv-cobalt-deep">
              <GlyphCheck className="size-3.5" /> Ok
            </span>
          )}
        </span>
      </label>
      <div className="relative mt-1.5">
        {/* marcador lateral de foco/erro */}
        <span
          aria-hidden="true"
          className={cn(
            'absolute -left-3 bottom-1 top-1 w-[3px] origin-center transition-transform duration-[220ms]',
            error ? 'scale-y-100 bg-dv-blood' : 'scale-y-0 bg-dv-cobalt-deep group-focus-within/field:scale-y-100',
          )}
        />
        <input
          id={id}
          type={secret && !reveal ? 'password' : 'text'}
          aria-invalid={error}
          aria-describedby={message ? `${id}-msg devo-access-hint` : 'devo-access-hint'}
          className={cn(
            'w-full border-b-2 bg-white/35 py-3 pl-3 font-sans text-[17px] text-dv-paper-ink outline-none transition-[border-color,background-color] duration-[220ms] placeholder:text-dv-paper-ink/40',
            secret ? 'pr-14' : 'pr-10',
            error
              ? 'border-dv-blood bg-[rgba(213,31,43,0.06)]'
              : ok
                ? 'border-dv-cobalt-deep/70 focus:border-dv-cobalt-deep focus:bg-white/60'
                : 'border-dv-paper-ink/35 focus:border-dv-cobalt-deep focus:bg-white/60',
            className,
          )}
          {...rest}
        />
        {secret ? (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={reveal}
            className="dv-focus absolute right-0 top-1/2 grid size-11 -translate-y-1/2 place-items-center text-dv-paper-ink/55 transition-colors hover:text-dv-cobalt-deep aria-pressed:text-dv-cobalt-deep"
          >
            <EyeGlyph open={reveal} />
          </button>
        ) : (
          ok && <GlyphCheck className="absolute right-3 top-1/2 size-5 -translate-y-1/2 text-dv-cobalt-deep" />
        )}
        {overlay}
      </div>
      {message && (
        <p id={`${id}-msg`} className={cn('mt-1.5 font-sans text-[13px] leading-snug', error ? 'text-[#a3121c]' : 'text-dv-paper-ink/70')}>
          {message}
        </p>
      )}
    </div>
  )
}

function EyeGlyph({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M2.5 12 C5 7 8.5 5 12 5 C15.5 5 19 7 21.5 12 C19 17 15.5 19 12 19 C8.5 19 5 17 2.5 12 Z" />
      <circle cx="12" cy="12" r="3" fill={open ? 'currentColor' : 'none'} />
      {!open && <path d="M4 20 L20 4" />}
    </svg>
  )
}
