'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'

export function AdminLoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/admin'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl,
    })
    setPending(false)
    if (result?.error) {
      if (result.status === 429) {
        setError('Too many login attempts. Try again in 15 minutes.')
        return
      }
      setError('Invalid credentials')
      return
    }
    if (result?.url) {
      window.location.href = result.url
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="email" className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--a-text-secondary)' }}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border px-3 py-2 font-body focus:outline-none"
          style={{
            background: 'var(--a-bg)',
            borderColor: 'var(--a-border)',
            color: 'var(--a-text)',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--a-gold)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--a-border)')}
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="block text-xs uppercase tracking-widest mb-2"
          style={{ color: 'var(--a-text-secondary)' }}
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border px-3 py-2 font-body focus:outline-none"
          style={{
            background: 'var(--a-bg)',
            borderColor: 'var(--a-border)',
            color: 'var(--a-text)',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--a-gold)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--a-border)')}
        />
      </div>
      {error ? <p className="text-sm" style={{ color: 'var(--a-red)' }}>{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 py-3 font-body text-sm uppercase tracking-widest font-medium transition-colors disabled:opacity-50"
        style={{ background: 'var(--a-gold)', color: 'var(--a-text-inverse)' }}
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
