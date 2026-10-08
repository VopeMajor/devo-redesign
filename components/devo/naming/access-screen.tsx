'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import { checkInviteCode } from '@/app/actions/player'
import { authClient } from '@/lib/auth-client'
import { playSfx } from '@/lib/devo/audio'
import { MenuButton } from '../menu-button'
import { Divider, Sparkle } from '../ornaments'

export type AccessMode = 'invite' | 'login'
type Step = 'code' | 'register' | 'login'

const USERNAME_MAX = 40

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

/** Hex keeps the internal e-mail valid for any allowed username (e.g. "nome." or "a..b"). */
function internalEmail(name: string) {
  const hex = Array.from(new TextEncoder().encode(name.toLowerCase()), (b) => b.toString(16).padStart(2, '0')).join('')
  return `u${hex}@jogador.devo`
}

const inputClass =
  'w-full border-b border-foreground/40 bg-transparent px-2 py-3 text-center text-xl tracking-[0.12em] text-foreground placeholder:text-foreground/30 focus:border-primary focus:outline-none'

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
  const [pending, setPending] = useState(false)

  const fail = (message: string) => {
    playSfx('error')
    setError(message)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (pending) return
    setError(null)
    setPending(true)
    try {
      if (step === 'code') {
        const res = await checkInviteCode(code)
        if (!res.ok) return fail(res.error)
        playSfx('confirm')
        setStep('register')
        return
      }

      const name = cleanName(username)
      if (!name) return fail('Escolha um nome para você.')
      if (password.length < 6) return fail('A senha precisa ter pelo menos 6 caracteres.')

      if (step === 'register') {
        if (password !== confirm) return fail('As senhas não conferem.')
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
      if (err) return fail('Usuário ou senha incorretos.')
      playSfx('confirm')
      onAuthenticated('logged-in')
    } catch {
      fail('O sistema não respondeu. Tente novamente.')
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

  const canSubmit =
    step === 'code'
      ? code.trim().length >= 6
      : cleanName(username).length > 0 &&
        password.length >= 6 &&
        (step === 'login' || confirm.length > 0)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="devo-access-title"
      className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-black/85 px-4 py-8 backdrop-blur-sm animate-[devo-fade-in_0.6s_ease-out_both]"
    >
      <form
        onSubmit={submit}
        noValidate
        className="relative w-full max-w-md border border-foreground/30 bg-background/95 p-px shadow-[0_40px_80px_-20px_rgba(0,0,0,1)] animate-rise"
      >
        <div className="flex flex-col items-center gap-5 border border-foreground/10 px-6 py-10 text-center sm:px-10">
          <Sparkle className="size-4 text-primary" />
          <Divider />
          <h2
            id="devo-access-title"
            className="font-serif text-5xl uppercase tracking-[0.08em] text-foreground [text-shadow:0_0_20px_rgba(22,71,255,0.45)]"
          >
            {title}
          </h2>
          <p className="text-pretty text-base italic text-foreground/70">{lead}</p>

          {step === 'code' ? (
            <Field id="devo-code" label="Código de convite">
              <input
                id="devo-code"
                autoFocus
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={32}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase())
                  if (error) setError(null)
                  playSfx('type')
                }}
                placeholder="DEVO-XXXX-XXXX"
                aria-invalid={Boolean(error)}
                aria-describedby="devo-access-hint"
                className={`${inputClass} font-mono`}
              />
            </Field>
          ) : (
            <>
              <Field id="devo-user" label="Seu nome">
                <input
                  id="devo-user"
                  autoFocus
                  autoComplete="username"
                  autoCapitalize="words"
                  spellCheck={false}
                  maxLength={USERNAME_MAX}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    if (error) setError(null)
                    playSfx('type')
                  }}
                  placeholder="Ex.: Ana Lima"
                  aria-invalid={Boolean(error)}
                  aria-describedby="devo-access-hint"
                  className={inputClass}
                />
              </Field>
              <Field id="devo-pass" label="Senha">
                <input
                  id="devo-pass"
                  type="password"
                  autoComplete={step === 'register' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) setError(null)
                  }}
                  placeholder="Senha"
                  aria-invalid={Boolean(error)}
                  aria-describedby="devo-access-hint"
                  className={inputClass}
                />
              </Field>
              {step === 'register' && (
                <Field id="devo-pass2" label="Confirme a senha">
                  <input
                    id="devo-pass2"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => {
                      setConfirm(e.target.value)
                      if (error) setError(null)
                    }}
                    placeholder="Confirme a senha"
                    aria-invalid={Boolean(error)}
                    aria-describedby="devo-access-hint"
                    className={inputClass}
                  />
                </Field>
              )}
            </>
          )}

          {step === 'register' && (
            <ul className="flex w-full flex-col gap-1 text-left text-xs" aria-label="Requisitos">
              {[
                { ok: cleanName(username).length > 0, text: 'Nome: do jeito que quiser, com espaços e acentos (só não pode repetir)' },
                { ok: password.length >= 6, text: 'Senha: pelo menos 6 caracteres (qualquer símbolo vale)' },
                { ok: confirm.length > 0 && confirm === password, text: 'As duas senhas são iguais' },
              ].map((r) => (
                <li key={r.text} className={r.ok ? 'text-foreground/80' : 'text-muted-foreground'}>
                  <span aria-hidden="true" className={r.ok ? 'mr-2 text-primary' : 'mr-2'}>
                    {r.ok ? '✓' : '○'}
                  </span>
                  <span className="sr-only">{r.ok ? 'Cumprido: ' : 'Pendente: '}</span>
                  {r.text}
                </li>
              ))}
            </ul>
          )}

          <p
            id="devo-access-hint"
            role="alert"
            className={error ? 'min-h-5 text-sm text-primary' : 'min-h-5 text-xs uppercase tracking-[0.25em] text-muted-foreground'}
          >
            {error ?? (step === 'code' ? 'Uso único' : step === 'register' ? 'Senha com 6+ caracteres' : '')}
          </p>

          <div className="flex w-full flex-col gap-3">
            <MenuButton variant="primary" type="submit" disabled={pending || !canSubmit}>
              {pending ? 'Verificando…' : step === 'code' ? 'Validar' : step === 'register' ? 'Assinar' : 'Entrar'}
            </MenuButton>
            <button
              type="button"
              onClick={() => {
                setError(null)
                if (step === 'register') setStep('code')
                else onCancel()
              }}
              className="text-[11px] uppercase tracking-[0.3em] text-foreground/50 hover:text-foreground"
            >
              Voltar
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="w-full">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      {children}
    </div>
  )
}
