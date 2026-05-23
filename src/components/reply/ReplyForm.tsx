'use client'

import { useState } from 'react'
import { onPublicInputBlur, onPublicInputFocus } from '@/lib/public-theme-styles'

export function ReplyForm({
  token,
  fromName,
}: {
  token: string
  fromName: string
}) {
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!body.trim()) return
    setSending(true)
    setError('')

    try {
      const res = await fetch(`/api/reply/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: body.trim() }),
      })

      if (res.ok) {
        setSent(true)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="py-12 px-6 text-center">
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
          style={{
            background: 'var(--color-accent-light)',
            border: '1px solid var(--color-accent-border)',
          }}
        >
          <span style={{ fontSize: '20px', color: 'var(--color-accent)' }}>✓</span>
        </div>
        <p className="font-display mb-2 text-xl" style={{ color: 'var(--color-accent)' }}>
          Message sent
        </p>
        <p className="font-body text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          The Room For You team will get back to you soon.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Type your reply here…"
        aria-label={`Reply as ${fromName}`}
        rows={6}
        className="w-full resize-none border px-4 py-3 font-body text-sm outline-none"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-primary)',
          lineHeight: '1.6',
          transition: 'border-color 0.2s',
        }}
        onFocus={onPublicInputFocus}
        onBlur={onPublicInputBlur}
      />

      {error && (
        <p className="font-body text-xs" style={{ color: '#E53E3E' }}>
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={sending || !body.trim()}
        className="w-full py-3.5 font-body text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-40"
        style={{ background: 'var(--color-accent)', color: '#FAF7F2' }}
      >
        {sending ? 'Sending…' : 'Send Reply'}
      </button>

      <p className="text-center font-body text-xs" style={{ color: 'var(--color-text-muted)' }}>
        Room For You · rfyglobal.org
      </p>
    </div>
  )
}
