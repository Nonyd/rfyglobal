'use client'

import { REDIRECT_COUNTDOWN_SECONDS } from '@/hooks/useRedirectCountdown'

type RedirectCountdownBannerProps = {
  redirectCountdown: number
  pendingRedirectUrl: string
  totalSeconds?: number
}

export function RedirectCountdownBanner({
  redirectCountdown,
  pendingRedirectUrl,
  totalSeconds = REDIRECT_COUNTDOWN_SECONDS,
}: RedirectCountdownBannerProps) {
  return (
    <div
      className="mt-6 border px-4 py-3"
      style={{ borderColor: 'rgba(201,168,76,0.2)', background: 'rgba(201,168,76,0.04)' }}
    >
      <p className="font-body text-sm" style={{ color: '#C9A84C' }}>
        Redirecting in {redirectCountdown} second{redirectCountdown !== 1 ? 's' : ''}…
      </p>
      <div
        className="mt-2 h-1 overflow-hidden rounded-full"
        style={{ background: 'rgba(201,168,76,0.15)' }}
      >
        <div
          className="h-full transition-all duration-1000 ease-linear"
          style={{
            width: `${(redirectCountdown / totalSeconds) * 100}%`,
            background: '#C9A84C',
          }}
        />
      </div>
      <button
        type="button"
        onClick={() => {
          window.location.href = pendingRedirectUrl
        }}
        className="mt-3 font-body text-xs uppercase tracking-widest transition-opacity hover:opacity-70"
        style={{ color: '#C9A84C' }}
      >
        Go now →
      </button>
    </div>
  )
}
