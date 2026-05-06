'use client'

import { useState } from 'react'
import { Database, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export function DemoDataManager() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const loadDemoData = async () => {
    if (!confirm('This will add demo data to your database. Existing data will not be overwritten. Continue?')) return

    setLoading(true)
    setError(null)
    setResults([])

    try {
      const res = await fetch('/api/admin/demo', { method: 'POST' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? 'Failed to load demo data')
      }

      setResults(data.results)
      setDone(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--a-text)' }}>
          Demo Data
        </h2>
        <p className="font-body text-sm mt-1" style={{ color: 'var(--a-text-muted)' }}>
          Load sample data across all modules to make the site feel alive
        </p>
      </div>

      {/* Info card */}
      <div className="p-6 border mb-8" style={{ background: 'var(--a-surface)', borderColor: 'var(--a-border)' }}>
        <div className="flex items-start gap-3 mb-6">
          <Database size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--a-gold)' }} />
          <div>
            <p className="font-body text-sm font-medium mb-1" style={{ color: 'var(--a-text)' }}>
              What gets created
            </p>
            <p className="font-body text-xs leading-relaxed" style={{ color: 'var(--a-text-muted)' }}>
              Existing data is never overwritten — demo data is only added if a module is empty.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {[
            '10 daily scriptures (KJV/NIV)',
            '5 published blog devotionals with full content',
            '2 study series with tasks',
            '6 upcoming events across Abuja, Lagos, Port Harcourt',
            '20 gallery images (Unsplash placeholders)',
            'Join form with 15 sample member registrations',
            '8 giving/partnership records',
            'Site CMS content for all pages',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full" style={{ background: 'var(--a-gold)' }} />
              <p className="font-body text-sm" style={{ color: 'var(--a-text-secondary)' }}>{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="p-5 border mb-6" style={{ background: 'var(--a-sidebar)', borderColor: 'var(--a-border)' }}>
          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                {r.startsWith('✅') ? (
                  <CheckCircle size={14} className="text-green-600 shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 shrink-0" />
                )}
                <p className="font-body text-sm" style={{ color: 'var(--a-text-secondary)' }}>
                  {r.replace('✅ ', '').replace('⏭️ ', '')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 border border-red-200 bg-red-50 mb-6">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <p className="font-body text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Action button */}
      {!done ? (
        <button
          onClick={loadDemoData}
          disabled={loading}
          className="flex items-center gap-3 px-6 py-3 font-body text-sm font-medium text-white transition-all disabled:opacity-50"
          style={{ background: loading ? 'var(--a-text-muted)' : 'var(--a-gold)' }}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Loading demo data…
            </>
          ) : (
            <>
              <Database size={16} />
              Load Demo Data
            </>
          )}
        </button>
      ) : (
        <div className="flex items-center gap-3 p-4 border border-green-200 bg-green-50">
          <CheckCircle size={16} className="text-green-600 shrink-0" />
          <p className="font-body text-sm text-green-700 font-medium">
            Demo data loaded successfully. Your site is now populated and ready to present.
          </p>
        </div>
      )}

      {/* Warning */}
      <p className="font-body text-xs mt-6" style={{ color: 'var(--a-text-muted)' }}>
        Note: Gallery images use Unsplash placeholder URLs. Replace them with real Room For You event photos via the Gallery module when available.
      </p>
    </div>
  )
}
