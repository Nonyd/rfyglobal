'use client'

import { useState, useMemo } from 'react'
import { formatDistanceToNow } from 'date-fns'
import type { ActivityLog, User } from '@prisma/client'

type LogWithUser = ActivityLog & {
  user: Pick<User, 'name' | 'email' | 'role'>
}

const MODULE_COLORS: Record<string, string> = {
  Blog: '#3B82F6',
  Scripture: '#8B5CF6',
  Events: '#F59E0B',
  Gallery: '#EC4899',
  Forms: '#14B8A6',
  Members: '#22C55E',
  CMS: '#F97316',
  Integrations: '#EF4444',
  Automation: '#A855F7',
  Users: '#C9A84C',
  Settings: '#6B7280',
  Partnership: '#0EA5E9',
}

interface ActivityLogViewerProps {
  initialLogs: LogWithUser[]
  users: Pick<User, 'id' | 'name' | 'email'>[]
  initialTotalPages?: number
}

export function ActivityLogViewer({
  initialLogs,
  users,
  initialTotalPages = 1,
}: ActivityLogViewerProps) {
  const [logs, setLogs] = useState(initialLogs)
  const [moduleFilter, setModuleFilter] = useState('All')
  const [userFilter, setUserFilter] = useState('All')
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(initialTotalPages)

  const modules = ['All', ...Array.from(new Set(logs.map((l) => l.module))).sort()]

  const filtered = useMemo(
    () =>
      logs.filter((log) => {
        const matchModule = moduleFilter === 'All' || log.module === moduleFilter
        const matchUser = userFilter === 'All' || log.userId === userFilter
        return matchModule && matchUser
      }),
    [logs, moduleFilter, userFilter]
  )

  const loadMore = async () => {
    if (page >= totalPages || loading) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: '50',
        ...(moduleFilter !== 'All' && { module: moduleFilter }),
        ...(userFilter !== 'All' && { userId: userFilter }),
      })
      const res = await fetch(`/api/admin/activity?${params}`)
      const data = await res.json()
      setLogs((prev) => [...prev, ...(data.logs ?? [])])
      setPage((p) => p + 1)
      if (typeof data.totalPages === 'number') setTotalPages(data.totalPages)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--a-text)' }}>
            Activity Log
          </h2>
          <p className="font-body text-sm mt-1" style={{ color: 'var(--a-text-muted)' }}>
            All admin actions across the platform
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="border px-3 py-2 font-body text-sm focus:outline-none rounded-sm"
          style={{
            background: 'var(--a-surface)',
            borderColor: 'var(--a-border)',
            color: 'var(--a-text)',
          }}
        >
          {modules.map((m) => (
            <option key={m} value={m}>
              {m === 'All' ? 'All Modules' : m}
            </option>
          ))}
        </select>

        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="border px-3 py-2 font-body text-sm focus:outline-none rounded-sm"
          style={{
            background: 'var(--a-surface)',
            borderColor: 'var(--a-border)',
            color: 'var(--a-text)',
          }}
        >
          <option value="All">All Users</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name ?? u.email}
            </option>
          ))}
        </select>
      </div>

      <div className="border overflow-hidden rounded-sm" style={{ borderColor: 'var(--a-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full font-body text-sm">
            <thead>
              <tr
                style={{
                  background: 'var(--a-sidebar)',
                  borderBottom: `1px solid var(--a-border)`,
                }}
              >
                {['Action', 'Module', 'User', 'When'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs uppercase tracking-widest"
                    style={{ color: 'var(--a-gold)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, i) => (
                <tr
                  key={log.id}
                  style={{
                    borderBottom: `1px solid var(--a-border)`,
                    background: i % 2 === 0 ? 'var(--a-surface)' : 'var(--a-bg)',
                  }}
                >
                  <td className="px-4 py-3" style={{ color: 'var(--a-text)' }}>
                    {log.action}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-[10px] px-2 py-0.5 font-body tracking-widest uppercase text-white rounded-sm"
                      style={{ background: MODULE_COLORS[log.module] ?? '#6B7280' }}
                    >
                      {log.module}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--a-text-secondary)' }}>
                    {log.user.name ?? log.user.email}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--a-text-muted)' }}>
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
              No activity found
            </p>
          </div>
        )}

        {page < totalPages && (
          <div className="p-4 border-t text-center" style={{ borderColor: 'var(--a-border)' }}>
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={loading}
              className="font-body text-sm transition-colors disabled:opacity-40"
              style={{ color: 'var(--a-gold)' }}
            >
              {loading ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
