'use client'

import { useState } from 'react'
import { Plus, ChevronDown } from 'lucide-react'
import { FIELD_TYPES_UI, type AppFieldType } from '@/lib/form-field-metadata'

export function FieldTypePicker({
  onAdd,
}: {
  onAdd: (type: AppFieldType, defaultLabel?: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 bg-gold text-black text-sm font-body font-medium hover:bg-gold-light transition-colors"
      >
        <Plus size={14} />
        Add Field
        <ChevronDown
          size={14}
          className={open ? 'rotate-180 transition-transform' : 'transition-transform'}
        />
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default bg-transparent"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute right-0 top-full mt-2 w-56 rounded-md border z-20 py-1 max-h-[min(70vh,24rem)] overflow-y-auto"
            style={{
              background: 'var(--a-surface)',
              borderColor: 'var(--a-border)',
              boxShadow: 'var(--a-shadow-md)',
            }}
          >
            {FIELD_TYPES_UI.map(({ type, label, icon, defaultLabel }) => (
              <button
                key={`${type}-${label}`}
                type="button"
                onClick={() => {
                  onAdd(type, defaultLabel)
                  setOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-body transition-colors text-left"
                style={{ color: 'var(--a-text)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--a-sidebar-hover)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <span className="w-5 shrink-0 text-center text-base leading-none" aria-hidden>
                  {icon}
                </span>
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
