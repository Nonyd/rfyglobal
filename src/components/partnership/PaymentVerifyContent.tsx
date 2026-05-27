'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type Status = 'loading' | 'success' | 'failed' | 'error' | 'pending'

export function PaymentVerifyContent() {
  const params = useSearchParams()
  const [status, setStatus] = useState<Status>('loading')

  const verify = useCallback(() => {
    const gateway = params.get('gateway')
    const ref =
      params.get('ref') ?? params.get('reference') ?? params.get('trxref')

    if (!ref) {
      setStatus('error')
      return
    }

    if (!gateway) {
      fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: ref }),
      })
        .then((r) => r.json())
        .then((data: { success?: boolean }) => {
          if (data.success) setStatus('success')
          else setStatus('failed')
        })
        .catch(() => setStatus('error'))
      return
    }

    const url = `/api/payments/verify?gateway=${encodeURIComponent(gateway)}&ref=${encodeURIComponent(ref)}${params.get('transaction_id') ? `&transaction_id=${encodeURIComponent(params.get('transaction_id')!)}` : ''}`

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.status === 'success') setStatus('success')
        else if (data.status === 'pending') setStatus('pending')
        else if (data.status === 'error') setStatus('error')
        else setStatus('failed')
      })
      .catch(() => setStatus('error'))
  }, [params])

  useEffect(() => {
    verify()
  }, [verify])

  useEffect(() => {
    if (status !== 'pending') return
    const id = window.setInterval(verify, 4000)
    const stop = window.setTimeout(() => window.clearInterval(id), 60000)
    return () => {
      window.clearInterval(id)
      window.clearTimeout(stop)
    }
  }, [status, verify])

  return (
    <div className="max-w-lg w-full text-center py-24">
      {status === 'loading' && (
        <div className="space-y-6">
          <div className="w-12 h-12 border-2 border-crimson border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-body text-text-secondary">Verifying your gift…</p>
        </div>
      )}

      {status === 'pending' && (
        <div className="space-y-6">
          <div className="w-12 h-12 border-2 border-crimson border-t-transparent rounded-full animate-spin mx-auto" />
          <h1 className="font-display text-3xl text-text-primary">Almost there</h1>
          <p className="font-body leading-relaxed text-text-secondary max-w-sm mx-auto">
            We are confirming your payment. This can take a moment. This page will update automatically.
          </p>
          <Link
            href="/"
            className="inline-block border border-theme px-6 py-2 font-body text-sm text-text-secondary transition-colors hover:border-crimson/40 hover:text-text-primary"
          >
            Back to Home
          </Link>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-crimson">
            <span className="text-2xl text-crimson">✓</span>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-crimson/40 to-transparent" />
          <h1 className="font-display text-4xl text-text-primary">Thank You.</h1>
          <p className="mx-auto max-w-sm font-body leading-relaxed text-text-secondary">
            Your partnership gift has been received. You are sowing into the Kingdom. God sees every seed
            planted in faith.
          </p>
          <p className="font-display text-lg italic text-crimson">
            &quot;…God loves a cheerful giver.&quot; — 2 Cor 9:7
          </p>
          <div className="h-px bg-gradient-to-r from-transparent via-crimson/40 to-transparent" />
          <Link
            href="/"
            className="inline-block border border-crimson px-8 py-3 font-body text-sm uppercase tracking-widest text-crimson transition-all duration-300 hover:bg-crimson hover:text-text-inverse"
          >
            Back to Home
          </Link>
        </div>
      )}

      {(status === 'failed' || status === 'error') && (
        <div className="space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-brand/60">
            <span className="text-2xl text-red-brand">×</span>
          </div>
          <h1 className="font-display text-3xl text-text-primary">Payment Unsuccessful</h1>
          <p className="font-body text-text-secondary">
            We could not confirm your payment. Please try again or contact us.
          </p>
          <Link
            href="/partner"
            className="btn-crimson-solid inline-block bg-crimson px-8 py-3 font-body text-sm uppercase tracking-widest text-text-inverse transition-all duration-300 hover:bg-crimson-light"
          >
            Try Again
          </Link>
        </div>
      )}
    </div>
  )
}
