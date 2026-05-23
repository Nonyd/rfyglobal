'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { usePublicTheme, type PublicTheme } from '@/hooks/usePublicTheme'

type PublicThemeContextValue = {
  theme: PublicTheme
  isDark: boolean
  setTheme: (theme: PublicTheme) => void
  toggleTheme: () => void
  mounted: boolean
}

const PublicThemeContext = createContext<PublicThemeContextValue | null>(null)

export function PublicThemeProvider({ children }: { children: ReactNode }) {
  const value = usePublicTheme()
  return <PublicThemeContext.Provider value={value}>{children}</PublicThemeContext.Provider>
}

export function usePublicThemeContext() {
  const ctx = useContext(PublicThemeContext)
  if (!ctx) {
    throw new Error('usePublicThemeContext must be used within PublicThemeProvider')
  }
  return ctx
}
