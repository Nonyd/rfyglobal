'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useRedirectCountdown } from '@/hooks/useRedirectCountdown'
import { RedirectCountdownBanner } from '@/components/shared/RedirectCountdownBanner'

type Status = 'loading' | 'success' | 'failed' | 'error'

export function EventPaymentVerifyContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const slug = typeof params.slug === 'string' ? params.slug : ''
  const [status, setStatus] = useState<Status>('loading')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const {
    redirectCountdown,
    pendingRedirectUrl,
    startRedirect,
    isRedirecting,
  } = useRedirectCountdown()

  const verify = useCallback(() => {
    const ref =
      searchParams.get('reference') ?? searchParams.get('trxref') ?? searchParams.get('ref')
    if (!ref) {
      setStatus('error')
      return
    }

    fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference: ref }),
    })
      .then((r) => r.json())
      .then((data: { success?: boolean; redirectUrl?: string | null; message?: string }) => {
        if (!data.success) {
          setStatus('failed')
          return
        }
        setSuccessMessage(
          data.message ?? 'Payment received. Check your email for confirmation and event details.',
        )
        setStatus('success')
        if (data.redirectUrl) {
          startRedirect(data.redirectUrl)
        }
      })
      .catch(() => setStatus('error'))
  }, [searchParams, startRedirect])

  useEffect(() => {
    verify()
  }, [verify])

  const eventUrl = slug ? `/events/${encodeURIComponent(slug)}` : '/events'

  return (
    <div className="max-w-lg w-full text-center py-12">
      {status === 'loading' && (
        <div className="space-y-6">
          <div
            className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-gold border-t-transparent"
            aria-hidden
          />
          <p className="font-body text-sm text-mist">Confirming your registration payment…</p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-6">
          <div className="gold-line mx-auto mb-6 max-w-[60px] opacity-40" />
          <h1 className="font-display text-3xl font-bold text-snow">{"You're registered!"}</h1>
          <p className="font-body text-sm leading-relaxed text-mist">
            {successMessage ??
              'Payment received. Check your email for confirmation and event details.'}
          </p>
          {isRedirecting && redirectCountdown !== null && pendingRedirectUrl ? (
            <RedirectCountdownBanner
              redirectCountdown={redirectCountdown}
              pendingRedirectUrl={pendingRedirectUrl}
            />
          ) : (
            <button
              type="button"
              onClick={() => router.push(eventUrl)}
              className="mt-4 inline-block px-8 py-3 font-body text-xs font-semibold uppercase tracking-widest transition-all"
              style={{ background: '#C9A84C', color: '#0F0F0F' }}
            >
              Back to event
            </button>
          )}
        </div>
      )}

      {(status === 'failed' || status === 'error') && (
        <div className="space-y-6">
          <h1 className="font-display text-2xl text-snow">Payment could not be verified</h1>
          <p className="font-body text-sm text-mist">
            If you were charged, contact hello@rfyglobal.org with your payment reference.
          </p>
          <Link
            href={eventUrl}
            className="inline-block px-8 py-3 font-body text-xs uppercase tracking-widest text-gold transition-opacity hover:opacity-80"
            style={{ border: '1px solid rgba(201,168,76,0.4)' }}
          >
            Back to event
          </Link>
        </div>
      )}
    </div>
  )
}
