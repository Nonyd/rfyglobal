'use client'

import { useCallback, useEffect, useState } from 'react'

export const REDIRECT_COUNTDOWN_SECONDS = 5

export function useRedirectCountdown(totalSeconds = REDIRECT_COUNTDOWN_SECONDS) {
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null)
  const [pendingRedirectUrl, setPendingRedirectUrl] = useState<string | null>(null)

  const startRedirect = useCallback(
    (url: string) => {
      setPendingRedirectUrl(url)
      setRedirectCountdown(totalSeconds)
    },
    [totalSeconds],
  )

  const resetRedirect = useCallback(() => {
    setRedirectCountdown(null)
    setPendingRedirectUrl(null)
  }, [])

  useEffect(() => {
    if (redirectCountdown === null || !pendingRedirectUrl) return
    if (redirectCountdown === 0) {
      window.location.href = pendingRedirectUrl
      return
    }
    const timer = setTimeout(() => setRedirectCountdown((prev) => (prev ?? 1) - 1), 1000)
    return () => clearTimeout(timer)
  }, [redirectCountdown, pendingRedirectUrl])

  const isRedirecting = redirectCountdown !== null && pendingRedirectUrl !== null

  return {
    redirectCountdown,
    pendingRedirectUrl,
    startRedirect,
    resetRedirect,
    isRedirecting,
    totalSeconds,
  }
}
