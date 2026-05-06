'use client'

import Image from 'next/image'
import { useState } from 'react'

export function LogoMark() {
  const [failed, setFailed] = useState(false)

  return (
    <div className="flex justify-center mb-8">
      {failed ? (
        <span className="font-display text-2xl" style={{ color: 'var(--a-text)' }}>
          RFY
        </span>
      ) : (
        <Image
          src="/images/brand-logo-on-light.png"
          alt="Room For You"
          width={160}
          height={52}
          className="h-14 w-auto max-w-[200px] object-contain"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  )
}
