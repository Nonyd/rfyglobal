'use client'

import { useEffect } from 'react'

export function ScrollRevealInit() {
  useEffect(() => {
    // Reduced motion: leave everything visible (the hidden state is gated on .reveal-ready).
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const selectors = '.reveal, .reveal-left, .reveal-right'
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Reveal on entry, and also when a fast scroll jumped past the element (it is above the viewport),
          // so quick scrolling never leaves blank sections behind.
          if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      // Start revealing slightly before the element scrolls into view.
      { threshold: 0, rootMargin: '0px 0px 15% 0px' },
    )

    const observe = () => {
      document
        .querySelectorAll(`:is(${selectors}):not(.visible)`)
        .forEach((el) => observer.observe(el))
    }

    observe()
    document.documentElement.classList.add('reveal-ready')

    const mutation = new MutationObserver(observe)
    mutation.observe(document.getElementById('public-site-root') ?? document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      observer.disconnect()
      mutation.disconnect()
      document.documentElement.classList.remove('reveal-ready')
    }
  }, [])

  return null
}
