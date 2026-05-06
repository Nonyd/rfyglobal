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
        <label htmlFor="email" className="block text-xs uppercase tracking-widest text-white/50 mb-2">
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
          className="w-full bg-black border border-white/20 px-3 py-2 text-white font-body focus:border-gold focus:outline-none"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="block text-xs uppercase tracking-widest text-white/50 mb-2"
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
          className="w-full bg-black border border-white/20 px-3 py-2 text-white font-body focus:border-gold focus:outline-none"
        />
      </div>
      {error ? <p className="text-sm text-red-brand">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 py-3 bg-gold text-black font-body text-sm uppercase tracking-widest font-medium hover:bg-gold-light transition-colors disabled:opacity-50"
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
