'use client'

import { useEffect, useState } from 'react'

type AdminTheme = 'light' | 'dark'

export function useAdminTheme() {
  const [theme, setTheme] = useState<AdminTheme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('rfy-admin-theme') as AdminTheme | null
    if (stored === 'dark' || stored === 'light') {
      setTheme(stored)
    } else {
      setTheme('light')
    }
  }, [])

  const toggleTheme = () => {
    const next: AdminTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('rfy-admin-theme', next)
  }

  return { theme, toggleTheme, mounted }
}
