'use client'

import { useState } from 'react'

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
            background: 'rgba(201,168,76,0.1)',
            border: '1px solid rgba(201,168,76,0.3)',
          }}
        >
          <span style={{ fontSize: '20px' }}>✓</span>
        </div>
        <p className="font-display mb-2 text-xl" style={{ color: '#C9A84C' }}>
          Message sent
        </p>
        <p className="font-body text-sm" style={{ color: '#A0A0A0' }}>
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
          background: '#1A1A1A',
          borderColor: body ? '#C9A84C' : 'rgba(255,255,255,0.1)',
          color: '#F8F8F8',
          lineHeight: '1.6',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => (e.target.style.borderColor = '#C9A84C')}
        onBlur={(e) =>
          (e.target.style.borderColor = body ? '#C9A84C' : 'rgba(255,255,255,0.1)')
        }
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
        style={{ background: '#C9A84C', color: '#0F0F0F' }}
      >
        {sending ? 'Sending…' : 'Send Reply'}
      </button>

      <p className="text-center font-body text-xs" style={{ color: '#585858' }}>
        Room For You · rfyglobal.org
      </p>
    </div>
  )
}
