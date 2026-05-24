'use client'

import { Moon, Sun } from 'lucide-react'
import { usePublicThemeContext } from '@/components/providers/PublicThemeProvider'
import { cn } from '@/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { isDark, toggleTheme, mounted } = usePublicThemeContext()

  if (!mounted) return <div className="h-9 w-9" />

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'relative flex h-9 w-9 items-center justify-center border transition-all duration-200',
        className,
      )}
      style={{
        borderColor: 'var(--color-border)',
        color: 'var(--color-text-secondary)',
      }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <Sun
        size={16}
        className={cn(
          'absolute transition-all duration-300',
          isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0',
        )}
      />
      <Moon
        size={16}
        className={cn(
          'absolute transition-all duration-300',
          isDark ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100',
        )}
      />
    </button>
  )
}
