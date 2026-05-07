'use client'

import { useState, useCallback, useRef } from 'react'

interface UseEmailCheckOptions {
  checkUrl: (email: string) => string
  debounceMs?: number
}

export function useEmailCheck({ checkUrl, debounceMs = 600 }: UseEmailCheckOptions) {
  const [checking, setChecking] = useState(false)
  const [emailExists, setEmailExists] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const runIdRef = useRef(0)
  const lastCheckedRef = useRef('')

  const checkEmail = useCallback(
    (email: string) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      runIdRef.current += 1

      const trimmed = email.trim()
      if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
        setEmailExists(false)
        lastCheckedRef.current = ''
        return
      }

      const norm = trimmed.toLowerCase()
      if (norm === lastCheckedRef.current) return

      setEmailExists(false)

      timerRef.current = setTimeout(async () => {
        const capture = runIdRef.current
        setChecking(true)
        try {
          const res = await fetch(checkUrl(trimmed))
          const data = (await res.json()) as { exists?: boolean }
          if (capture !== runIdRef.current) return
          setEmailExists(!!data.exists)
          lastCheckedRef.current = norm
        } catch {
          if (capture !== runIdRef.current) return
          setEmailExists(false)
        } finally {
          if (capture === runIdRef.current) setChecking(false)
        }
      }, debounceMs)
    },
    [checkUrl, debounceMs],
  )

  const reset = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    runIdRef.current += 1
    setEmailExists(false)
    setChecking(false)
    lastCheckedRef.current = ''
  }, [])

  return { checking, emailExists, checkEmail, reset }
}
