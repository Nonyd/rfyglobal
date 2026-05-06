'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Upload,
  X,
  Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { UploadZone } from '@/components/shared/UploadZone'
import { cn } from '@/lib/utils'

type StudyMaterial = {
  id: string
  seriesId: string
  title: string
  fileUrl: string
  fileType: string
  order: number
}

type StudyTask = {
  id: string
  seriesId: string
  title: string
  description: string | null
  dueDate: string | null
  order: number
}

type StudySeries = {
  id: string
  title: string
  description: string | null
  order: number
  materials: StudyMaterial[]
  tasks: StudyTask[]
}

export function StudyManager() {
  const [series, setSeries] = useState<StudySeries[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [panelOpen, setPanelOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [materialSeriesId, setMaterialSeriesId] = useState<string | null>(null)
  const [taskSeriesId, setTaskSeriesId] = useState<string | null>(null)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskDue, setTaskDue] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/study/series')
    if (!res.ok) {
      toast.error('Failed to load study series')
      return
    }
    const data = (await res.json()) as StudySeries[]
    setSeries(data)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      await load()
      if (!cancelled) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [load])

  const toggleExpand = (id: string) => {
    setExpanded((e) => ({ ...e, [id]: !e[id] }))
  }

  const createSeries = async () => {
    if (!newTitle.trim()) {
      toast.error('Title is required')
      return
    }
    const res = await fetch('/api/study/series', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        order: series.length,
      }),
    })
    if (!res.ok) {
      toast.error('Failed to create series')
      return
    }
    toast.success('Series created')
    setNewTitle('')
    setNewDescription('')
    setPanelOpen(false)
    await load()
  }

  const saveSeriesEdit = async (id: string) => {
    const res = await fetch(`/api/study/series/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editTitle.trim(),
        description: editDescription.trim() || null,
      }),
    })
    if (!res.ok) {
      toast.error('Failed to update')
      return
    }
    toast.success('Series updated')
    setEditingId(null)
    await load()
  }

  const deleteSeries = async (id: string, title: string) => {
    if (!confirm(`Delete series "${title}" and all materials/tasks?`)) return
    const res = await fetch(`/api/study/series/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Failed to delete')
      return
    }
    toast.success('Series deleted')
    await load()
  }

  const deleteMaterial = async (id: string) => {
    if (!confirm('Remove this material?')) return
    const res = await fetch(`/api/study/materials/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Failed to delete')
      return
    }
    toast.success('Material removed')
    await load()
  }

  const deleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return
    const res = await fetch(`/api/study/tasks/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Failed to delete')
      return
    }
    toast.success('Task deleted')
    await load()
  }

  const submitTask = async (seriesId: string) => {
    if (!taskTitle.trim()) {
      toast.error('Task title is required')
      return
    }
    const s = series.find((x) => x.id === seriesId)
    const dueDate =
      taskDue && taskDue.length > 0 ? new Date(taskDue).toISOString() : undefined
    const res = await fetch('/api/study/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seriesId,
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        dueDate,
        order: s?.tasks.length ?? 0,
      }),
    })
    if (!res.ok) {
      toast.error('Failed to add task')
      return
    }
    toast.success('Task added')
    setTaskTitle('')
    setTaskDescription('')
    setTaskDue('')
    setTaskSeriesId(null)
    await load()
  }

  const onMaterialUploaded = async (
    seriesId: string,
    files: { url: string; name: string }[]
  ) => {
    const f = files[0]
    if (!f?.url) return
    const fileType = 'application/octet-stream'
    const s = series.find((x) => x.id === seriesId)
    const res = await fetch('/api/study/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seriesId,
        title: f.name.replace(/\.[^/.]+$/, '') || 'Material',
        fileUrl: f.url,
        fileType,
        order: s?.materials.length ?? 0,
      }),
    })
    if (!res.ok) {
      toast.error('Failed to save material')
      return
    }
    toast.success('Material uploaded')
    setMaterialSeriesId(null)
    await load()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24" style={{ color: 'var(--a-text-muted)' }}>
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--a-text)' }}>
            Study Portal
          </h2>
          <p className="mt-1 font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
            Series, materials, and tasks
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="flex items-center gap-2 bg-gold px-5 py-2.5 font-body text-sm font-medium text-black transition-colors hover:bg-gold-light"
        >
          <Plus size={16} /> New Series
        </button>
      </div>

      {series.length === 0 ? (
        <div
          className="border border-dashed py-20 text-center"
          style={{ borderColor: 'rgba(201,168,76,0.2)' }}
        >
          <p className="font-display text-xl italic" style={{ color: 'var(--a-text-muted)' }}>
            No study series yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {series.map((s) => {
            const open = expanded[s.id]
            return (
              <div
                key={s.id}
                className="border transition-all"
                style={{
                  background: 'var(--a-surface)',
                  borderColor: 'var(--a-border)',
                  boxShadow: 'var(--a-shadow)',
                }}
              >
                <div className="flex items-start gap-2 p-4">
                  <button
                    type="button"
                    onClick={() => toggleExpand(s.id)}
                    className="mt-0.5 text-gold/70 hover:text-gold"
                    aria-expanded={open}
                  >
                    {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    {editingId === s.id ? (
                      <div className="space-y-3">
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full border px-3 py-2 font-body focus:border-gold/50 focus:outline-none"
                          style={{
                            background: 'var(--a-bg)',
                            borderColor: 'var(--a-border)',
                            color: 'var(--a-text)',
                          }}
                        />
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          rows={2}
                          className="w-full border px-3 py-2 font-body text-sm focus:border-gold/50 focus:outline-none"
                          style={{
                            background: 'var(--a-bg)',
                            borderColor: 'var(--a-border)',
                            color: 'var(--a-text-secondary)',
                          }}
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => saveSeriesEdit(s.id)}
                            className="bg-gold px-4 py-1.5 font-body text-xs font-medium text-black"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="border px-4 py-1.5 font-body text-xs"
                            style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-muted)' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-lg font-semibold" style={{ color: 'var(--a-text)' }}>
                            {s.title}
                          </h3>
                          <span className="font-mono text-[10px]" style={{ color: 'var(--a-text-muted)' }}>
                            order {s.order}
                          </span>
                        </div>
                        {s.description && (
                          <p className="mt-1 font-body text-sm" style={{ color: 'var(--a-text-secondary)' }}>
                            {s.description}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  {editingId !== s.id && (
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(s.id)
                          setEditTitle(s.title)
                          setEditDescription(s.description ?? '')
                        }}
                        className="p-2 hover:text-gold"
                        style={{ color: 'var(--a-text-muted)' }}
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSeries(s.id, s.title)}
                        className="p-2 hover:text-red-brand"
                        style={{ color: 'var(--a-text-muted)' }}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {open && (
                  <div
                    className="space-y-6 border-t px-4 pb-5 pt-2 pl-12"
                    style={{ borderColor: 'var(--a-border)' }}
                  >
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h4
                          className="font-body text-xs uppercase tracking-widest font-semibold mb-0"
                          style={{ color: 'var(--a-gold)' }}
                        >
                          Materials
                        </h4>
                        <button
                          type="button"
                          onClick={() =>
                            setMaterialSeriesId((cur) => (cur === s.id ? null : s.id))
                          }
                          className="flex items-center gap-1 font-body text-xs text-gold hover:text-gold-light"
                        >
                          <Upload size={14} /> Add Material
                        </button>
                      </div>
                      {materialSeriesId === s.id && (
                        <div
                          className="mb-4 rounded border border-gold/25 p-4"
                          style={{ background: 'var(--a-bg)' }}
                        >
                          <UploadZone
                            folder="studyMaterial"
                            accept="document"
                            resourceType="raw"
                            label="Upload material (PDF or Word, max 16MB)"
                            onUploadComplete={(files) => {
                              const f = files[0]
                              if (!f?.url) return
                              void onMaterialUploaded(s.id, [
                                {
                                  url: f.url,
                                  name: f.name,
                                },
                              ])
                            }}
                            onUploadError={(e) => toast.error(e.message)}
                          />
                          <button
                            type="button"
                            onClick={() => setMaterialSeriesId(null)}
                            className="mt-2 font-body text-xs hover:opacity-80"
                            style={{ color: 'var(--a-text-muted)' }}
                          >
                            Close
                          </button>
                        </div>
                      )}
                      <ul className="space-y-2">
                        {s.materials.map((m) => (
                          <li
                            key={m.id}
                            className="flex items-center gap-3 p-3 border font-body text-sm"
                            style={{
                              borderColor: 'var(--a-border)',
                              background: 'var(--a-bg)',
                            }}
                          >
                            <a
                              href={m.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="min-w-0 flex-1 truncate hover:text-gold"
                              style={{ color: 'var(--a-text-secondary)' }}
                            >
                              {m.title}
                            </a>
                            <button
                              type="button"
                              onClick={() => deleteMaterial(m.id)}
                              className="shrink-0 hover:text-red-brand"
                              style={{ color: 'var(--a-text-muted)' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </li>
                        ))}
                        {s.materials.length === 0 && (
                          <p className="font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>
                            No files yet.
                          </p>
                        )}
                      </ul>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h4
                          className="font-body text-xs uppercase tracking-widest font-semibold mb-0"
                          style={{ color: 'var(--a-gold)' }}
                        >
                          Tasks
                        </h4>
                        <button
                          type="button"
                          onClick={() => setTaskSeriesId((cur) => (cur === s.id ? null : s.id))}
                          className="font-body text-xs text-gold hover:text-gold-light"
                        >
                          + Add Task
                        </button>
                      </div>
                      {taskSeriesId === s.id && (
                        <div
                          className="mb-4 space-y-2 rounded border border-gold/25 p-4"
                          style={{ background: 'var(--a-bg)' }}
                        >
                          <input
                            value={taskTitle}
                            onChange={(e) => setTaskTitle(e.target.value)}
                            placeholder="Task title"
                            className="w-full border px-3 py-2 font-body text-sm focus:border-gold/50 focus:outline-none"
                            style={{
                              background: 'var(--a-bg)',
                              borderColor: 'var(--a-border)',
                              color: 'var(--a-text)',
                            }}
                          />
                          <textarea
                            value={taskDescription}
                            onChange={(e) => setTaskDescription(e.target.value)}
                            placeholder="Description (optional)"
                            rows={2}
                            className="w-full border px-3 py-2 font-body text-sm focus:border-gold/50 focus:outline-none"
                            style={{
                              background: 'var(--a-bg)',
                              borderColor: 'var(--a-border)',
                              color: 'var(--a-text-secondary)',
                            }}
                          />
                          <input
                            type="datetime-local"
                            value={taskDue}
                            onChange={(e) => setTaskDue(e.target.value)}
                            className="w-full border px-3 py-2 font-body text-sm focus:border-gold/50 focus:outline-none"
                            style={{
                              background: 'var(--a-bg)',
                              borderColor: 'var(--a-border)',
                              color: 'var(--a-text)',
                            }}
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => submitTask(s.id)}
                              className="bg-gold px-4 py-1.5 font-body text-xs font-medium text-black"
                            >
                              Save task
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setTaskSeriesId(null)
                                setTaskTitle('')
                                setTaskDescription('')
                                setTaskDue('')
                              }}
                              className="font-body text-xs hover:opacity-80"
                              style={{ color: 'var(--a-text-muted)' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                      <ul className="space-y-2">
                        {s.tasks.map((t) => (
                          <li
                            key={t.id}
                            className="flex items-start justify-between gap-3 p-3 border"
                            style={{
                              borderColor: 'var(--a-border)',
                              background: 'var(--a-bg)',
                            }}
                          >
                            <div className="min-w-0">
                              <p className="font-body text-sm" style={{ color: 'var(--a-text-secondary)' }}>
                                {t.title}
                              </p>
                              {t.description && (
                                <p
                                  className="mt-1 font-body text-xs"
                                  style={{ color: 'var(--a-text-secondary)' }}
                                >
                                  {t.description}
                                </p>
                              )}
                              {t.dueDate && (
                                <p className="mt-1 font-body text-[10px] text-gold/50">
                                  Due: {new Date(t.dueDate).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteTask(t.id)}
                              className="shrink-0 hover:text-red-brand"
                              style={{ color: 'var(--a-text-muted)' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </li>
                        ))}
                        {s.tasks.length === 0 && (
                          <p className="font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>
                            No tasks yet.
                          </p>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* New series panel */}
      <div
        className={cn(
          'fixed inset-0 z-50 transition-opacity',
          panelOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/70"
          aria-label="Close panel"
          onClick={() => setPanelOpen(false)}
        />
        <div
          className={cn(
            'absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l shadow-xl transition-transform',
            panelOpen ? 'translate-x-0' : 'translate-x-full'
          )}
          style={{
            background: 'var(--a-surface)',
            borderLeft: '1px solid var(--a-border)',
            boxShadow: 'var(--a-shadow-md)',
          }}
        >
          <div
            className="flex items-center justify-between border-b p-4"
            style={{ borderColor: 'var(--a-border)' }}
          >
            <h3 className="font-display text-lg font-semibold" style={{ color: 'var(--a-text)' }}>
              New Series
            </h3>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="p-2 hover:opacity-80"
              style={{ color: 'var(--a-text-muted)' }}
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <div>
              <label
                className="mb-1 block font-body text-xs uppercase tracking-widest"
                style={{ color: 'var(--a-text-secondary)' }}
              >
                Title
              </label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full border px-3 py-2 font-body text-sm focus:border-gold/50 focus:outline-none"
                style={{
                  background: 'var(--a-bg)',
                  borderColor: 'var(--a-border)',
                  color: 'var(--a-text)',
                }}
              />
            </div>
            <div>
              <label
                className="mb-1 block font-body text-xs uppercase tracking-widest"
                style={{ color: 'var(--a-text-secondary)' }}
              >
                Description
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={4}
                className="w-full border px-3 py-2 font-body text-sm focus:border-gold/50 focus:outline-none"
                style={{
                  background: 'var(--a-bg)',
                  borderColor: 'var(--a-border)',
                  color: 'var(--a-text-secondary)',
                }}
              />
            </div>
          </div>
          <div className="border-t p-4" style={{ borderColor: 'var(--a-border)' }}>
            <button
              type="button"
              onClick={() => void createSeries()}
              className="w-full bg-gold py-2.5 font-body text-sm font-medium text-black hover:bg-gold-light"
            >
              Create Series
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
