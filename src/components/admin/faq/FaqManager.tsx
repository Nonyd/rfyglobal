'use client'

import { adminFetch } from '@/lib/admin-fetch'
import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { AdminToggle } from '@/components/shared/Toggle'
import toast from 'react-hot-toast'

type Faq = {
  id: string
  question: string
  answer: string
  isActive: boolean
  order: number
}

type FaqCategory = {
  id: string
  title: string
  order: number
  isActive: boolean
  faqs: Faq[]
  _count?: { faqs: number }
}

export function FaqManager() {
  const [categories, setCategories] = useState<FaqCategory[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [newCategoryTitle, setNewCategoryTitle] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' })
  const [addingFaq, setAddingFaq] = useState(false)
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null)
  const [editCategoryTitle, setEditCategoryTitle] = useState('')
  const [editFaqId, setEditFaqId] = useState<string | null>(null)
  const [editFaq, setEditFaq] = useState({ question: '', answer: '' })

  const loadFaqs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminFetch('/api/admin/faq')
      const data = (await res.json()) as FaqCategory[]
      setCategories(data)
      if (!selectedCategoryId && data.length > 0) setSelectedCategoryId(data[0].id)
    } finally {
      setLoading(false)
    }
  }, [selectedCategoryId])

  useEffect(() => {
    void loadFaqs()
  }, [loadFaqs])

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)

  const addCategory = async () => {
    if (!newCategoryTitle.trim()) return
    const res = await adminFetch('/api/admin/faq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'category', title: newCategoryTitle }),
    })
    if (!res.ok) return
    toast.success('Category added')
    setNewCategoryTitle('')
    setAddingCategory(false)
    await loadFaqs()
  }

  const addFaq = async () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim() || !selectedCategoryId) return
    const res = await adminFetch('/api/admin/faq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'faq', ...newFaq, categoryId: selectedCategoryId }),
    })
    if (!res.ok) return
    toast.success('FAQ added')
    setNewFaq({ question: '', answer: '' })
    setAddingFaq(false)
    await loadFaqs()
  }

  const updateCategory = async (id: string, data: Record<string, unknown>) => {
    const res = await adminFetch(`/api/admin/faq/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'category', ...data }),
    })
    if (!res.ok) return toast.error('Failed to update')
    await loadFaqs()
  }

  const updateFaq = async (id: string, data: Record<string, unknown>) => {
    const res = await adminFetch(`/api/admin/faq/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) return toast.error('Failed to update')
    toast.success('Saved')
    await loadFaqs()
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category and all its FAQs?')) return
    await adminFetch(`/api/admin/faq/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'category' }),
    })
    toast.success('Category deleted')
    if (selectedCategoryId === id) setSelectedCategoryId(null)
    await loadFaqs()
  }

  const deleteFaq = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return
    await adminFetch(`/api/admin/faq/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'faq' }),
    })
    toast.success('FAQ deleted')
    await loadFaqs()
  }

  if (loading) {
    return (
      <div className="font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
        Loading FAQs...
      </div>
    )
  }

  return (
    <div className="flex gap-6">
      <div className="w-64 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <p className="font-body text-xs uppercase tracking-widest" style={{ color: 'var(--a-text-muted)' }}>
            Categories
          </p>
          <button onClick={() => setAddingCategory(true)} className="flex items-center gap-1 px-2 py-1 text-xs font-body" style={{ background: 'var(--a-gold)', color: '#0F0F0F' }}>
            <Plus size={11} /> Add
          </button>
        </div>

        {addingCategory && (
          <div className="mb-3 p-3 border" style={{ borderColor: 'var(--a-border)' }}>
            <input
              value={newCategoryTitle}
              onChange={(e) => setNewCategoryTitle(e.target.value)}
              placeholder="Category title"
              className="w-full px-3 py-2 text-sm font-body border mb-2"
              style={{ background: 'var(--a-bg)', borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
              onKeyDown={(e) => e.key === 'Enter' && void addCategory()}
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => void addCategory()} className="flex-1 py-1.5 text-xs font-body font-medium text-white" style={{ background: 'var(--a-gold)' }}>
                Add
              </button>
              <button onClick={() => { setAddingCategory(false); setNewCategoryTitle('') }} className="px-3 py-1.5 text-xs font-body border" style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-muted)' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-1">
          {categories.map((cat) => (
            <div key={cat.id}>
              {editCategoryId === cat.id ? (
                <div className="p-2 border" style={{ borderColor: 'var(--a-gold-border)' }}>
                  <input
                    value={editCategoryTitle}
                    onChange={(e) => setEditCategoryTitle(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm font-body border mb-2"
                    style={{ background: 'var(--a-bg)', borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        void updateCategory(cat.id, { title: editCategoryTitle })
                        setEditCategoryId(null)
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        void updateCategory(cat.id, { title: editCategoryTitle })
                        setEditCategoryId(null)
                      }}
                      className="flex-1 py-1 text-xs font-body text-white"
                      style={{ background: 'var(--a-gold)' }}
                    >
                      Save
                    </button>
                    <button onClick={() => setEditCategoryId(null)} className="px-2 py-1 text-xs font-body border" style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-muted)' }}>
                      x
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left border transition-all group"
                  style={{
                    borderColor: selectedCategoryId === cat.id ? 'var(--a-gold-border)' : 'var(--a-border)',
                    background: selectedCategoryId === cat.id ? 'var(--a-gold-light)' : 'var(--a-surface)',
                  }}
                >
                  <p className="flex-1 font-body text-xs font-medium truncate" style={{ color: selectedCategoryId === cat.id ? 'var(--a-gold)' : 'var(--a-text)' }}>
                    {cat.title}
                  </p>
                  <span className="text-[10px] font-body opacity-50" style={{ color: 'var(--a-text-muted)' }}>
                    {cat._count?.faqs ?? cat.faqs.length}
                  </span>
                  <div className="hidden group-hover:flex items-center gap-1">
                    <span onClick={(e) => { e.stopPropagation(); setEditCategoryId(cat.id); setEditCategoryTitle(cat.title) }} className="p-0.5 transition-colors" style={{ color: 'var(--a-text-muted)' }}>
                      <Pencil size={10} />
                    </span>
                    <span onClick={(e) => { e.stopPropagation(); void deleteCategory(cat.id) }} className="p-0.5 transition-colors" style={{ color: 'var(--a-text-muted)' }}>
                      <Trash2 size={10} />
                    </span>
                  </div>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {!selectedCategory ? (
          <div className="flex items-center justify-center h-48 border border-dashed" style={{ borderColor: 'var(--a-border)' }}>
            <p className="font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
              Select or create a category
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-lg font-semibold" style={{ color: 'var(--a-text)' }}>
                  {selectedCategory.title}
                </h2>
                <p className="font-body text-xs mt-0.5" style={{ color: 'var(--a-text-muted)' }}>
                  {selectedCategory.faqs.length} questions
                </p>
              </div>
              <button onClick={() => setAddingFaq(true)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-body font-medium text-white" style={{ background: 'var(--a-gold)' }}>
                <Plus size={12} /> Add FAQ
              </button>
            </div>

            {addingFaq && (
              <div className="mb-4 p-4 border" style={{ borderColor: 'var(--a-gold-border)', background: 'var(--a-gold-light)' }}>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs uppercase tracking-widest font-body mb-1" style={{ color: 'var(--a-text-secondary)' }}>
                      Question *
                    </label>
                    <input
                      value={newFaq.question}
                      onChange={(e) => setNewFaq((p) => ({ ...p, question: e.target.value }))}
                      placeholder="Enter the question..."
                      className="w-full px-3 py-2.5 text-sm font-body border"
                      style={{ background: 'var(--a-bg)', borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest font-body mb-1" style={{ color: 'var(--a-text-secondary)' }}>
                      Answer *
                    </label>
                    <textarea
                      value={newFaq.answer}
                      onChange={(e) => setNewFaq((p) => ({ ...p, answer: e.target.value }))}
                      placeholder="Enter the answer..."
                      rows={4}
                      className="w-full px-3 py-2.5 text-sm font-body border resize-none"
                      style={{ background: 'var(--a-bg)', borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => void addFaq()} className="px-4 py-2 text-xs font-body font-medium text-white" style={{ background: 'var(--a-gold)' }}>
                      Add FAQ
                    </button>
                    <button onClick={() => { setAddingFaq(false); setNewFaq({ question: '', answer: '' }) }} className="px-4 py-2 text-xs font-body border" style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-muted)' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {selectedCategory.faqs.map((faq) => (
                <div key={faq.id} className="border" style={{ borderColor: 'var(--a-border)', background: 'var(--a-surface)' }}>
                  {editFaqId === faq.id ? (
                    <div className="p-4 space-y-3">
                      <input
                        value={editFaq.question}
                        onChange={(e) => setEditFaq((p) => ({ ...p, question: e.target.value }))}
                        className="w-full px-3 py-2.5 text-sm font-body border"
                        style={{ background: 'var(--a-bg)', borderColor: 'var(--a-gold-border)', color: 'var(--a-text)' }}
                        placeholder="Question"
                        autoFocus
                      />
                      <textarea
                        value={editFaq.answer}
                        onChange={(e) => setEditFaq((p) => ({ ...p, answer: e.target.value }))}
                        rows={4}
                        className="w-full px-3 py-2.5 text-sm font-body border resize-none"
                        style={{ background: 'var(--a-bg)', borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
                        placeholder="Answer"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            void updateFaq(faq.id, { question: editFaq.question, answer: editFaq.answer })
                            setEditFaqId(null)
                          }}
                          className="px-4 py-2 text-xs font-body font-medium text-white"
                          style={{ background: 'var(--a-gold)' }}
                        >
                          Save
                        </button>
                        <button onClick={() => setEditFaqId(null)} className="px-4 py-2 text-xs font-body border" style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-muted)' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 p-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm font-medium mb-1" style={{ color: 'var(--a-text)' }}>
                          {faq.question}
                        </p>
                        <p className="font-body text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--a-text-muted)' }}>
                          {faq.answer}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <AdminToggle checked={faq.isActive} onChange={(val) => void updateFaq(faq.id, { isActive: val })} size="sm" />
                        <button
                          onClick={() => {
                            setEditFaqId(faq.id)
                            setEditFaq({ question: faq.question, answer: faq.answer })
                          }}
                          className="p-1.5 transition-colors"
                          style={{ color: 'var(--a-text-muted)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--a-text)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--a-text-muted)')}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => void deleteFaq(faq.id)}
                          className="p-1.5 transition-colors"
                          style={{ color: 'var(--a-text-muted)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--a-red)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--a-text-muted)')}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {selectedCategory.faqs.length === 0 && !addingFaq && (
                <div className="flex flex-col items-center justify-center h-32 border border-dashed" style={{ borderColor: 'var(--a-border)' }}>
                  <p className="font-body text-sm mb-2" style={{ color: 'var(--a-text-muted)' }}>
                    No FAQs in this category yet
                  </p>
                  <button onClick={() => setAddingFaq(true)} className="font-body text-xs" style={{ color: 'var(--a-gold)' }}>
                    + Add first FAQ
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
