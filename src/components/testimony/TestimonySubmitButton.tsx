'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { TestimonySubmitModal } from './TestimonySubmitModal'

export function TestimonySubmitButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-6 py-3 font-body text-xs font-semibold tracking-widest uppercase transition-all"
        style={{ background: '#8B0000', color: '#0F0F0F' }}
      >
        <Plus size={13} />
        Share Your Testimony
      </button>
      <TestimonySubmitModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  )
}
