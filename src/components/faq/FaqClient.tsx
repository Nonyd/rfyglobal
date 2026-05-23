'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'

interface FaqItem {
  id: string
  question: string
  answer: string
  order: number
}

interface FaqCategoryData {
  id: string
  title: string
  faqs: FaqItem[]
}

export function FaqClient({ categories }: { categories: FaqCategoryData[] }) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())
  const [activeCategory, setActiveCategory] = useState<string | 'all'>('all')

  const toggleFaq = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filteredCategories = activeCategory === 'all' ? categories : categories.filter((c) => c.id === activeCategory)

  if (categories.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="font-display text-snow text-2xl mb-3">FAQs coming soon.</p>
        <p className="font-body text-mist">
          In the meantime,{' '}
          <Link href="/contact" className="text-crimson hover:opacity-70 transition-opacity">
            contact us directly
          </Link>
          .
        </p>
      </div>
    )
  }

  return (
    <div>
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-12">
          <button
            onClick={() => setActiveCategory('all')}
            className="px-4 py-2 font-body text-xs tracking-wide transition-all"
            style={{
              background: activeCategory === 'all' ? '#8B0000' : 'transparent',
              color: activeCategory === 'all' ? '#0F0F0F' : 'rgba(248,248,248,0.5)',
              border: activeCategory === 'all' ? 'none' : '1px solid rgba(255,255,255,0.12)',
            }}
          >
            All Topics
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="px-4 py-2 font-body text-xs tracking-wide transition-all"
              style={{
                background: activeCategory === cat.id ? '#8B0000' : 'transparent',
                color: activeCategory === cat.id ? '#0F0F0F' : 'rgba(248,248,248,0.5)',
                border: activeCategory === cat.id ? 'none' : '1px solid rgba(255,255,255,0.12)',
              }}
            >
              {cat.title}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-12">
        {filteredCategories.map((category, catIdx) => (
          <motion.div key={category.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: catIdx * 0.05 }}>
            <div className="flex items-center gap-4 mb-6">
              <h2 className="font-display text-crimson text-xl font-semibold">{category.title}</h2>
              <div className="flex-1 h-px" style={{ background: 'rgba(139,0,0,0.2)' }} />
              <p className="font-body text-xs" style={{ color: '#585858' }}>
                {category.faqs.length} {category.faqs.length === 1 ? 'question' : 'questions'}
              </p>
            </div>

            <div className="space-y-2">
              {category.faqs.map((faq) => {
                const isOpen = openIds.has(faq.id)
                return (
                  <div
                    key={faq.id}
                    className="border transition-all duration-200"
                    style={{
                      borderColor: isOpen ? 'rgba(139,0,0,0.4)' : 'rgba(255,255,255,0.08)',
                      background: isOpen ? 'rgba(139,0,0,0.03)' : 'transparent',
                    }}
                  >
                    <button onClick={() => toggleFaq(faq.id)} className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left">
                      <p className="font-body font-medium text-sm leading-relaxed" style={{ color: isOpen ? '#F8F8F8' : '#C8C0B4' }}>
                        {faq.question}
                      </p>
                      <span
                        className="shrink-0 transition-transform duration-300"
                        style={{ color: '#8B0000', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      >
                        <ChevronDown size={16} />
                      </span>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="px-6 pb-5 pt-0">
                            <div className="h-px mb-4" style={{ background: 'rgba(139,0,0,0.15)' }} />
                            <p className="font-body text-sm leading-relaxed" style={{ color: '#A0A0A0' }}>
                              {faq.answer}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-16 pt-12 border-t text-center" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <p className="font-body text-mist mb-4">Still have questions?</p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 px-8 py-3 font-body text-xs font-semibold tracking-widest uppercase border transition-all"
          style={{ borderColor: 'rgba(139,0,0,0.4)', color: '#8B0000' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#8B0000'
            e.currentTarget.style.color = '#0F0F0F'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#8B0000'
          }}
        >
          Contact Us &rarr;
        </Link>
      </div>
    </div>
  )
}
