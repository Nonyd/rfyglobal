'use client'

import { useEffect, useState } from 'react'

export function ScriptureStrip() {
  const [scriptureText, setScriptureText] = useState('')

  useEffect(() => {
    fetch('/api/scripture/today')
      .then((r) => r.json())
      .then((data) => {
        const text = data?.reference && data?.text
          ? `${data.reference} — "${data.text}"`
          : '2 Corinthians 5:17 — "Therefore, if anyone is in Christ, the new creation has come."'
        setScriptureText(text)
      })
      .catch(() =>
        setScriptureText(
          '2 Corinthians 5:17 — "Therefore, if anyone is in Christ, the new creation has come."',
        ),
      )
  }, [])

  if (!scriptureText) {
    return <div style={{ background: 'var(--color-strip-bg)', padding: '0.9rem 0', height: '48px' }} />
  }

  return (
    <div
      style={{
        background: 'var(--color-strip-bg)',
        padding: '0.9rem 0',
        overflow: 'hidden',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          whiteSpace: 'nowrap',
          animation: 'marquee 28s linear infinite',
        }}
      >
        {[0, 1].map((i) => (
          <div key={i} style={{ display: 'flex', flexShrink: 0 }}>
            <span
              style={{
                fontFamily: 'var(--font-antonio)',
                fontSize: '0.9rem',
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--color-strip-text)',
                padding: '0 2.5rem',
              }}
            >
              {scriptureText}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)', padding: '0 1rem' }}>✦</span>
          </div>
        ))}
      </div>
    </div>
  )
}
