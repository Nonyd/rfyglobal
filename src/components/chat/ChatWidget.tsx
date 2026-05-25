'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'

interface ChatMsg {
  id: string
  body: string
  fromAdmin: boolean
  createdAt: string
}

const SESSION_KEY = 'rfy_chat_session'

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const openRef = useRef(open)
  useEffect(() => {
    openRef.current = open
  }, [open])

  const [step, setStep] = useState<'form' | 'chat'>('form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [body, setBody] = useState('')
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [token, setToken] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [starting, setStarting] = useState(false)
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const esRef = useRef<EventSource | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchMessages = useCallback(async (t: string) => {
    try {
      const res = await fetch(`/api/chat/${t}`)
      if (!res.ok) return
      const data = await res.json()
      setMessages(data.messages ?? [])
    } catch {
      /* ignore */
    }
  }, [])

  const connectSSE = useCallback(
    (t: string) => {
      esRef.current?.close()
      const es = new EventSource(`/api/chat/stream?token=${encodeURIComponent(t)}`)
      esRef.current = es
      es.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data) as { event?: string }
          if (d.event === 'chat_reply') {
            if (openRef.current) {
              void fetchMessages(t)
            } else {
              setUnread((u) => u + 1)
            }
          } else if (d.event === 'new_chat_message' && openRef.current) {
            void fetchMessages(t)
          }
        } catch {
          /* ignore */
        }
      }
      es.onerror = () => {
        es.close()
        setTimeout(() => connectSSE(t), 3000)
      }
    },
    [fetchMessages],
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem(SESSION_KEY)
    if (!saved) return
    const { sessionToken: t } = JSON.parse(saved) as { sessionToken?: string }
    if (!t) return

    fetch(`/api/chat/${t}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) {
          localStorage.removeItem(SESSION_KEY)
          return
        }
        setToken(t)
        setMessages(data.messages ?? [])
        setStep('chat')
        connectSSE(t)
      })
      .catch(() => {})
  }, [connectSSE])

  useEffect(() => () => esRef.current?.close(), [])

  useEffect(() => {
    if (open && token) {
      setUnread(0)
      void fetchMessages(token)
    }
  }, [open, token, fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const startChat = async () => {
    if (!name.trim() || !email.trim() || starting) return
    setStarting(true)
    try {
      const res = await fetch('/api/chat/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      })
      if (!res.ok) return
      const data = await res.json()
      const t = data.sessionToken as string
      localStorage.setItem(SESSION_KEY, JSON.stringify({ sessionToken: t }))
      setToken(t)
      setMessages(data.messages ?? [])
      setStep('chat')
      connectSSE(t)
      setTimeout(() => inputRef.current?.focus(), 150)
    } catch {
      /* ignore */
    } finally {
      setStarting(false)
    }
  }

  const sendMessage = async () => {
    if (!body.trim() || !token || sending) return
    setSending(true)
    const text = body.trim()
    setBody('')

    const temp: ChatMsg = {
      id: `tmp-${Date.now()}`,
      body: text,
      fromAdmin: false,
      createdAt: new Date().toISOString(),
    }
    setMessages((p) => [...p, temp])

    try {
      await fetch(`/api/chat/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text }),
      })
      await fetchMessages(token)
    } catch {
      setMessages((p) => p.filter((m) => m.id !== temp.id))
      setBody(text)
    } finally {
      setSending(false)
    }
  }

  const fmt = (d: string) =>
    new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  return (
    <>
      <button
        type="button"
        className="hover:scale-105"
        onClick={() => setOpen((o) => !o)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#8B0000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          border: 'none',
          cursor: 'pointer',
          transition: 'transform 0.2s ease',
          flexShrink: 0,
        }}
        aria-label="Chat with Room For You"
      >
        {open ? (
          <X size={20} style={{ color: '#FFFFFF' }} />
        ) : (
          <MessageCircle size={20} style={{ color: '#FFFFFF' }} />
        )}
        {!open && unread > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#E53E3E',
              color: 'white',
              fontSize: '10px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #0F0F0F',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <div
        style={{
          position: 'fixed',
          bottom: '96px',
          right: '24px',
          zIndex: 9998,
          width: 'min(360px, calc(100vw - 32px))',
          height: '500px',
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transform: open ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.96)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'all' : 'none',
          transition: 'transform 0.25s cubic-bezier(0.32,0.72,0,1), opacity 0.2s ease',
        }}
      >
        <div
          className="flex shrink-0 items-center gap-3 px-4 py-3"
          style={{ background: 'var(--color-accent)', borderRadius: '16px 16px 0 0' }}
        >
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: 'rgba(0,0,0,0.15)' }}
          >
            <MessageCircle size={15} style={{ color: '#FFFFFF' }} />
          </div>
          <div className="min-w-0 flex-1">
            <p
              style={{
                color: '#0F0F0F',
                fontSize: '13px',
                fontWeight: 700,
                margin: 0,
                fontFamily: 'sans-serif',
              }}
            >
              Room For You
            </p>
            <p
              style={{
                color: 'rgba(0,0,0,0.55)',
                fontSize: '10px',
                margin: 0,
                fontFamily: 'sans-serif',
              }}
            >
              We usually reply within a few hours
            </p>
          </div>
          <button type="button" onClick={() => setOpen(false)} style={{ color: 'rgba(0,0,0,0.4)', lineHeight: 0 }}>
            <X size={15} />
          </button>
        </div>

        {step === 'form' ? (
          <div className="flex flex-1 flex-col justify-center gap-4 px-5 py-6">
            <div>
              <p
                style={{
                  color: 'var(--color-text-primary)',
                  fontSize: '15px',
                  fontWeight: 600,
                  marginBottom: '6px',
                  fontFamily: 'sans-serif',
                }}
              >
                👋 Hi there!
              </p>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', lineHeight: '1.6', fontFamily: 'sans-serif' }}>
                Send us a message and we&apos;ll get back to you as soon as possible.
              </p>
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full outline-none"
              onKeyDown={(e) => e.key === 'Enter' && document.getElementById('chat-email-input')?.focus()}
              style={{
                padding: '10px 14px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                color: 'var(--color-text-primary)',
                fontSize: '13px',
                fontFamily: 'sans-serif',
              }}
            />
            <input
              id="chat-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              className="w-full outline-none"
              onKeyDown={(e) => e.key === 'Enter' && void startChat()}
              style={{
                padding: '10px 14px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                color: 'var(--color-text-primary)',
                fontSize: '13px',
                fontFamily: 'sans-serif',
              }}
            />
            <button
              type="button"
              onClick={() => void startChat()}
              disabled={starting || !name.trim() || !email.trim()}
              style={{
                padding: '12px',
                background: 'var(--color-accent)',
                color: '#FAF7F2',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '12px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontFamily: 'sans-serif',
                opacity: starting || !name.trim() || !email.trim() ? 0.4 : 1,
                cursor: 'pointer',
                border: 'none',
              }}
            >
              {starting ? 'Starting…' : 'Start Chat'}
            </button>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '10px', textAlign: 'center', fontFamily: 'sans-serif' }}>
              Room For You · rfyglobal.org
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {messages.length === 0 && (
                <div className="mb-3 flex justify-start">
                  <div
                    style={{
                      maxWidth: '80%',
                      padding: '8px 12px',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '12px 12px 12px 4px',
                      fontSize: '12px',
                      color: 'var(--color-text-primary)',
                      lineHeight: '1.5',
                      fontFamily: 'sans-serif',
                    }}
                  >
                    Hi! How can we help you today? 👋
                  </div>
                </div>
              )}
              {messages.map((msg, i) => {
                const isAdmin = msg.fromAdmin
                const next = messages[i + 1]
                const isLast = !next || next.fromAdmin !== isAdmin
                return (
                  <div key={msg.id}>
                    <div style={{ display: 'flex', justifyContent: isAdmin ? 'flex-start' : 'flex-end', marginBottom: '2px' }}>
                      <div
                        style={{
                          maxWidth: '80%',
                          padding: '8px 12px',
                          background: isAdmin ? 'var(--color-surface)' : 'var(--color-accent)',
                          color: isAdmin ? 'var(--color-text-primary)' : '#FAF7F2',
                          border: isAdmin ? '1px solid var(--color-border)' : 'none',
                          borderRadius: isAdmin ? '12px 12px 12px 4px' : '12px 12px 4px 12px',
                          fontSize: '12px',
                          lineHeight: '1.5',
                          fontFamily: 'sans-serif',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {msg.body}
                      </div>
                    </div>
                    {isLast && (
                      <p
                        style={{
                          fontSize: '10px',
                          color: 'var(--color-text-muted)',
                          textAlign: isAdmin ? 'left' : 'right',
                          marginBottom: '8px',
                          fontFamily: 'sans-serif',
                        }}
                      >
                        {fmt(msg.createdAt)}
                      </p>
                    )}
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>
            <div className="flex shrink-0 items-center gap-2 border-t px-3 py-3" style={{ borderColor: 'var(--color-border)' }}>
              <input
                ref={inputRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void sendMessage()
                  }
                }}
                placeholder="Type a message…"
                className="flex-1 outline-none"
                style={{
                  padding: '8px 12px',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '20px',
                  color: 'var(--color-text-primary)',
                  fontSize: '12px',
                  fontFamily: 'sans-serif',
                }}
              />
              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={sending || !body.trim()}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--color-accent)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  opacity: sending || !body.trim() ? 0.4 : 1,
                  cursor: 'pointer',
                }}
              >
                {sending ? (
                  <Loader2 size={13} className="animate-spin" style={{ color: '#FFFFFF' }} />
                ) : (
                  <Send size={13} style={{ color: '#FFFFFF' }} />
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
