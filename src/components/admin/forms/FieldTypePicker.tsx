'use client'

import { useState } from 'react'
import { Plus, ChevronDown } from 'lucide-react'
import { FIELD_TYPES_UI, type AppFieldType } from '@/lib/form-field-metadata'

export function FieldTypePicker({ onAdd }: { onAdd: (type: AppFieldType) => void }) {
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
            className="absolute right-0 top-full mt-2 w-52 border z-20 py-1 max-h-[min(70vh,24rem)] overflow-y-auto shadow-lg"
            style={{ background: '#111', borderColor: 'rgba(201,168,76,0.3)' }}
          >
            {FIELD_TYPES_UI.map(({ type, label, icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  onAdd(type)
                  setOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-body text-white/70 hover:bg-gold/10 hover:text-white transition-colors text-left"
              >
                <span className="w-5 text-center text-gold/60 font-mono text-xs">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
