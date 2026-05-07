'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  const [failed, setFailed] = useState(false)

  return (
    <div className={cn('flex justify-center', className)}>
      {failed ? (
        <span className="font-display text-2xl" style={{ color: 'var(--a-text)' }}>
          RFY
        </span>
      ) : (
        <Image
          src="/images/brand-logo-dark-transparent.png"
          alt="Room For You — with Yadah"
          width={300}
          height={100}
          unoptimized
          className="h-20 w-auto max-w-[min(100%,320px)] object-contain sm:h-24"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  )
}
