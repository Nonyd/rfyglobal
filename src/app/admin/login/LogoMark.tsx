'use client'

import Image from 'next/image'
import { useState } from 'react'

export function LogoMark() {
  const [failed, setFailed] = useState(false)

  return (
    <div className="flex justify-center mb-8">
      {failed ? (
        <span className="font-display text-2xl" style={{ color: 'var(--admin-text)' }}>
          RFY
        </span>
      ) : (
        <Image
          src="/images/logo-mark-dark.png"
          alt="Room For You"
          width={60}
          height={60}
          className="h-14 w-auto"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  )
}
