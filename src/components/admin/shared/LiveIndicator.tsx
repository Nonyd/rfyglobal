'use client'

import { useEffect, useState } from 'react'

interface LiveIndicatorProps {
  label?: string
}

export function LiveIndicator({ label = 'Live' }: LiveIndicatorProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 500)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div className="flex items-center gap-1.5">
      <span
        className="h-2 w-2 animate-pulse rounded-full"
        style={{ background: '#22C55E' }}
        title="Live updates active"
      />
      <span className="font-body text-xs font-medium" style={{ color: '#22C55E' }}>
        {label}
      </span>
    </div>
  )
}
