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
          <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-body text-white/50">Verifying your gift…</p>
        </div>
      )}

      {status === 'pending' && (
        <div className="space-y-6">
          <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
          <h1 className="font-display text-3xl text-white">Almost there</h1>
          <p className="text-white/50 font-body leading-relaxed max-w-sm mx-auto">
            We are confirming your payment. This can take a moment. This page will update automatically.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-2 border border-white/20 text-white/60 font-body text-sm hover:border-gold/40 hover:text-white transition-colors"
          >
            Back to Home
          </Link>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-6">
          <div className="w-16 h-16 rounded-full border-2 border-gold flex items-center justify-center mx-auto">
            <span className="text-gold text-2xl">✓</span>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          <h1 className="font-display text-4xl text-white">Thank You.</h1>
          <p className="text-white/50 font-body leading-relaxed max-w-sm mx-auto">
            Your partnership gift has been received. You are sowing into the Kingdom. God sees every seed
            planted in faith.
          </p>
          <p className="text-gold/70 font-display text-lg italic">
            &quot;…God loves a cheerful giver.&quot; — 2 Cor 9:7
          </p>
          <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          <Link
            href="/"
            className="inline-block px-8 py-3 border border-gold text-gold font-body text-sm tracking-widest uppercase hover:bg-gold hover:text-black transition-all duration-300"
          >
            Back to Home
          </Link>
        </div>
      )}

      {(status === 'failed' || status === 'error') && (
        <div className="space-y-6">
          <div className="w-16 h-16 rounded-full border-2 border-red-brand/60 flex items-center justify-center mx-auto">
            <span className="text-red-brand text-2xl">×</span>
          </div>
          <h1 className="font-display text-3xl text-white">Payment Unsuccessful</h1>
          <p className="text-white/50 font-body">
            We could not confirm your payment. Please try again or contact us.
          </p>
          <Link
            href="/partner"
            className="inline-block px-8 py-3 bg-gold text-black font-body text-sm tracking-widest uppercase hover:bg-gold-light transition-all duration-300"
          >
            Try Again
          </Link>
        </div>
      )}
    </div>
  )
}
