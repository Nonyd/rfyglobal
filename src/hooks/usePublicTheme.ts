'use client'

import { useCallback, useEffect, useState } from 'react'

export type PublicTheme = 'light' | 'dark'

const STORAGE_KEY = 'rfy-public-theme'
const ROOT_ID = 'public-site-root'

function applyTheme(theme: PublicTheme) {
  const el = document.getElementById(ROOT_ID)
  if (el) {
    el.classList.remove('public-light', 'public-dark')
    el.classList.add(theme === 'dark' ? 'public-dark' : 'public-light')
  }
  document.documentElement.setAttribute('data-public-theme', theme)
}

export function usePublicTheme() {
  const [theme, setThemeState] = useState<PublicTheme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const attr = document.documentElement.getAttribute('data-public-theme')
    const saved = localStorage.getItem(STORAGE_KEY) as PublicTheme | null
    const initial: PublicTheme =
      saved === 'dark' || attr === 'dark' ? 'dark' : 'light'
    setThemeState(initial)
    applyTheme(initial)
    setMounted(true)
  }, [])

  const setTheme = useCallback((next: PublicTheme) => {
    setThemeState(next)
    localStorage.setItem(STORAGE_KEY, next)
    applyTheme(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  return {
    theme,
    isDark: theme === 'dark',
    setTheme,
    toggleTheme,
    mounted,
  }
}
