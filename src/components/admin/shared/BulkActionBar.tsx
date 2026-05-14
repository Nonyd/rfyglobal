'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface BulkAction {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'danger' | 'primary' | 'default'
  disabled?: boolean
}

interface BulkActionBarProps {
  selectedCount: number
  onDeselectAll: () => void
  onSelectAll: () => void
  isAllSelected: boolean
  totalCount: number
  actions: BulkAction[]
}

export function BulkActionBar({
  selectedCount,
  onDeselectAll,
  onSelectAll,
  isAllSelected,
  totalCount,
  actions,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.2 }}
        className="fixed bottom-6 left-1/2 z-50 flex items-center gap-3 px-5 py-3 shadow-2xl"
        style={{
          transform: 'translateX(-50%)',
          background: 'var(--a-surface)',
          border: '1px solid var(--a-border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          minWidth: '400px',
        }}
      >
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="w-5 h-5 flex items-center justify-center rounded-sm"
            style={{ background: 'var(--a-gold)', color: '#0F0F0F' }}
          >
            <span className="text-[10px] font-bold">{selectedCount}</span>
          </div>
          <p className="font-body text-sm font-medium" style={{ color: 'var(--a-text)' }}>
            {selectedCount === 1 ? '1 item' : `${selectedCount} items`} selected
          </p>
        </div>

        {!isAllSelected && (
          <button
            onClick={onSelectAll}
            className="font-body text-xs shrink-0 transition-opacity opacity-100 hover:opacity-70"
            style={{ color: 'var(--a-gold)' }}
          >
            Select all {totalCount}
          </button>
        )}

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              disabled={action.disabled}
              className="flex items-center gap-1.5 px-3 py-2 font-body text-xs font-medium transition-all disabled:opacity-40"
              style={{
                background:
                  action.variant === 'danger'
                    ? 'rgba(239,68,68,0.15)'
                    : action.variant === 'primary'
                      ? 'var(--a-gold)'
                      : 'var(--a-bg)',
                color:
                  action.variant === 'danger'
                    ? '#F87171'
                    : action.variant === 'primary'
                      ? '#0F0F0F'
                      : 'var(--a-text-secondary)',
                border: `1px solid ${
                  action.variant === 'danger'
                    ? 'rgba(239,68,68,0.3)'
                    : action.variant === 'primary'
                      ? 'transparent'
                      : 'var(--a-border)'
                }`,
              }}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>

        <button
          onClick={onDeselectAll}
          type="button"
          className="ml-1 p-1.5 shrink-0 transition-colors text-[var(--a-text-muted)] hover:text-[var(--a-text)]"
        >
          <X size={16} />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
