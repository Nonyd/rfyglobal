'use client'

import { useEffect, useRef } from 'react'

export function PublicCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.innerWidth < 1024) return

    let mx = 0
    let my = 0
    let rx = 0
    let ry = 0
    let frame: number

    const onMove = (e: MouseEvent) => {
      mx = e.clientX
      my = e.clientY
      if (dotRef.current) {
        dotRef.current.style.left = `${mx}px`
        dotRef.current.style.top = `${my}px`
      }
    }

    const animate = () => {
      rx += (mx - rx) * 0.12
      ry += (my - ry) * 0.12
      if (ringRef.current) {
        ringRef.current.style.left = `${rx}px`
        ringRef.current.style.top = `${ry}px`
      }
      frame = requestAnimationFrame(animate)
    }

    document.addEventListener('mousemove', onMove)
    frame = requestAnimationFrame(animate)

    const grow = () => {
      if (dotRef.current) {
        dotRef.current.style.width = '20px'
        dotRef.current.style.height = '20px'
      }
      if (ringRef.current) {
        ringRef.current.style.width = '56px'
        ringRef.current.style.height = '56px'
      }
    }
    const shrink = () => {
      if (dotRef.current) {
        dotRef.current.style.width = '12px'
        dotRef.current.style.height = '12px'
      }
      if (ringRef.current) {
        ringRef.current.style.width = '36px'
        ringRef.current.style.height = '36px'
      }
    }

    const interactive = document.querySelectorAll('a, button')
    interactive.forEach((el) => {
      el.addEventListener('mouseenter', grow)
      el.addEventListener('mouseleave', shrink)
    })

    return () => {
      document.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(frame)
      interactive.forEach((el) => {
        el.removeEventListener('mouseenter', grow)
        el.removeEventListener('mouseleave', shrink)
      })
    }
  }, [])

  return (
    <>
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          width: '12px',
          height: '12px',
          background: 'var(--color-accent)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 9999,
          transform: 'translate(-50%, -50%)',
          transition: 'width 0.3s, height 0.3s',
          mixBlendMode: 'difference',
        }}
      />
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          width: '36px',
          height: '36px',
          border: '1.5px solid rgba(255,255,255,0.5)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 9998,
          transform: 'translate(-50%, -50%)',
          transition: 'width 0.3s, height 0.3s',
        }}
      />
    </>
  )
}
