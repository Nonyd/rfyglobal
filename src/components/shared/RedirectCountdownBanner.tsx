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
      style={{ borderColor: 'rgba(139,0,0,0.2)', background: 'rgba(139,0,0,0.04)' }}
    >
      <p className="font-body text-sm" style={{ color: '#8B0000' }}>
        Redirecting in {redirectCountdown} second{redirectCountdown !== 1 ? 's' : ''}…
      </p>
      <div
        className="mt-2 h-1 overflow-hidden rounded-full"
        style={{ background: 'rgba(139,0,0,0.15)' }}
      >
        <div
          className="h-full transition-all duration-1000 ease-linear"
          style={{
            width: `${(redirectCountdown / totalSeconds) * 100}%`,
            background: '#8B0000',
          }}
        />
      </div>
      <button
        type="button"
        onClick={() => {
          window.location.href = pendingRedirectUrl
        }}
        className="mt-3 font-body text-xs uppercase tracking-widest transition-opacity hover:opacity-70"
        style={{ color: '#8B0000' }}
      >
        Go now →
      </button>
    </div>
  )
}
