'use client'

import { useEffect } from 'react'

export function ScrollRevealInit() {
  useEffect(() => {
    const selectors = '.reveal, .reveal-left, .reveal-right'
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15 },
    )

    const observe = () => {
      document.querySelectorAll(selectors).forEach((el) => observer.observe(el))
    }

    observe()

    const mutation = new MutationObserver(observe)
    mutation.observe(document.getElementById('public-site-root') ?? document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      observer.disconnect()
      mutation.disconnect()
    }
  }, [])

  return null
}
