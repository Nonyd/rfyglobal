'use client'

import { motion } from 'framer-motion'
import { CheckCircle, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type FormSuccessTheme = 'dark' | 'light'

export type FormSuccessPanelProps = {
  title: string
  message: ReactNode
  /** Extra content (redirect banner, event title, links, etc.) */
  children?: ReactNode
  onClose?: () => void
  closeLabel?: string
  icon?: LucideIcon
  theme?: FormSuccessTheme
  className?: string
}

export function FormSuccessPanel({
  title,
  message,
  children,
  onClose,
  closeLabel = 'Close',
  icon: Icon = CheckCircle,
  theme = 'dark',
  className = '',
}: FormSuccessPanelProps) {
  const isDark = theme === 'dark'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={`form-success-panel form-success-panel--${theme} ${className}`.trim()}
    >
      <div className="form-success-panel__glow" aria-hidden />

      <div className="form-success-panel__icon-wrap">
        <Icon
          size={32}
          strokeWidth={2}
          className={isDark ? 'text-white' : 'text-crimson'}
          aria-hidden
        />
      </div>

      <div className="form-success-panel__divider" aria-hidden />

      <h2 className="form-success-panel__title">{title}</h2>

      <div className="form-success-panel__message">{message}</div>

      {children ? <div className="form-success-panel__extra">{children}</div> : null}

      {onClose ? (
        <button type="button" onClick={onClose} className="form-success-panel__btn">
          {closeLabel}
        </button>
      ) : null}
    </motion.div>
  )
}
