'use client'

import { adminFetch } from '@/lib/admin-fetch'
import { useState, useEffect, useRef, type MutableRefObject } from 'react'
import { Mail, Pencil, Save, Loader2, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { EMAIL_TEMPLATE_DEFAULTS, getBaseDesign } from '@/lib/email-defaults'
import { slugifyTemplateKey, type EmailTemplateListItem } from '@/lib/email-template-utils'
import type { EmailEditorProps } from 'react-email-editor'

const TEMPLATE_KEYS = Object.keys(EMAIL_TEMPLATE_DEFAULTS) as Array<keyof typeof EMAIL_TEMPLATE_DEFAULTS>

type UnlayerEditor = Parameters<NonNullable<EmailEditorProps['onReady']>>[0]

export function EmailTemplatesManager() {
  const [templates, setTemplates] = useState<Record<string, Record<string, unknown>>>({})
  const [templateList, setTemplateList] = useState<EmailTemplateListItem[]>([])
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [mode, setMode] = useState<'list' | 'edit'>('list')
  const [subject, setSubject] = useState('')
  const [saving, setSaving] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newKey, setNewKey] = useState('')
  const [newKeyTouched, setNewKeyTouched] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const editorRef = useRef<UnlayerEditor | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    const res = await adminFetch('/api/admin/email-templates')
    if (res.ok) {
      const data = (await res.json()) as EmailTemplateListItem[]
      if (!Array.isArray(data)) return
      setTemplateList(data)
      const map: Record<string, Record<string, unknown>> = {}
      data.forEach((t) => {
        if (t.hasSavedDesign) {
          map[t.key] = {
            key: t.key,
            name: t.name,
            subject: t.subject,
            html: t.html,
            description: t.description,
          }
        }
      })
      setTemplates(map)
    }
  }

  const openEditor = async (key: string) => {
    const listItem = templateList.find((t) => t.key === key)
    setSelectedKey(key)
    setSubject(
      listItem?.subject ??
        (templates[key]?.subject as string | undefined) ??
        EMAIL_TEMPLATE_DEFAULTS[key as keyof typeof EMAIL_TEMPLATE_DEFAULTS]?.subject ??
        '',
    )

    const res = await adminFetch(`/api/admin/email-templates/${key}`)
    if (res.ok) {
      const full = (await res.json()) as Record<string, unknown>
      setTemplates((prev) => ({ ...prev, [key]: full }))
      if (typeof full.subject === 'string') setSubject(full.subject)
    }

    setMode('edit')
  }

  const saveTemplate = () => {
    const unlayer = editorRef.current
    if (!selectedKey || !unlayer) return
    setSaving(true)

    unlayer.exportHtml((data: { design: unknown; html: string }) => {
      ;(async () => {
        try {
          const res = await adminFetch(`/api/admin/email-templates/${selectedKey}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              design: data.design,
              html: data.html,
              subject,
              name:
                (templates[selectedKey]?.name as string | undefined) ??
                EMAIL_TEMPLATE_DEFAULTS[selectedKey as keyof typeof EMAIL_TEMPLATE_DEFAULTS]?.name ??
                selectedKey,
            }),
          })

          if (res.ok) {
            toast.success('Template saved')
            await loadTemplates()
            setMode('list')
          } else {
            throw new Error('Save failed')
          }
        } catch {
          toast.error('Failed to save template')
        } finally {
          setSaving(false)
        }
      })()
    })
  }

  const selectedDefault = selectedKey
    ? EMAIL_TEMPLATE_DEFAULTS[selectedKey as keyof typeof EMAIL_TEMPLATE_DEFAULTS]
    : null

  const selectedListItem = selectedKey ? templateList.find((t) => t.key === selectedKey) : null

  const resetCreateForm = () => {
    setNewName('')
    setNewKey('')
    setNewKeyTouched(false)
    setNewSubject('')
    setNewDescription('')
  }

  const handleCreateTemplate = async () => {
    const name = newName.trim()
    const key = newKey.trim()
    const subjectLine = newSubject.trim()
    if (!name || !key || !subjectLine) {
      toast.error('Name, key, and subject are required')
      return
    }
    setCreating(true)
    try {
      const res = await adminFetch('/api/admin/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          key,
          subject: subjectLine,
          description: newDescription.trim() || undefined,
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        toast.error(data.error ?? 'Could not create template')
        return
      }
      toast.success('Template created')
      setCreateOpen(false)
      resetCreateForm()
      await loadTemplates()
      openEditor(key)
    } catch {
      toast.error('Could not create template')
    } finally {
      setCreating(false)
    }
  }

  if (mode === 'edit' && selectedKey) {
    return (
      <EditTemplate
        defaultConfig={selectedDefault}
        displayName={selectedListItem?.name ?? selectedDefault?.name ?? selectedKey}
        savedTemplate={templates[selectedKey]}
        subject={subject}
        onSubjectChange={setSubject}
        editorRef={editorRef}
        onSave={saveTemplate}
        onCancel={() => setMode('list')}
        saving={saving}
      />
    )
  }

  const cards = templateList.length > 0 ? templateList : TEMPLATE_KEYS.map((key) => {
    const config = EMAIL_TEMPLATE_DEFAULTS[key]
    return {
      key,
      name: config.name,
      subject: config.subject,
      description: config.description ?? null,
      html: '',
      isCustom: false,
      hasSavedDesign: Boolean(templates[key]),
    } satisfies EmailTemplateListItem
  })

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
          Design transactional and broadcast emails. System templates use built-in defaults until you save a custom design.
        </p>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex shrink-0 items-center gap-2 px-4 py-2.5 font-body text-xs font-semibold uppercase tracking-widest"
          style={{ background: 'var(--a-gold)', color: '#0F0F0F' }}
        >
          <Plus size={13} />
          New Template
        </button>
      </div>

      {createOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50"
            aria-label="Close"
            onClick={() => {
              setCreateOpen(false)
              resetCreateForm()
            }}
          />
          <div
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 border p-6"
            style={{ background: 'var(--a-surface)', borderColor: 'var(--a-border)' }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold" style={{ color: 'var(--a-text)' }}>
                New Template
              </h2>
              <button
                type="button"
                onClick={() => {
                  setCreateOpen(false)
                  resetCreateForm()
                }}
                style={{ color: 'var(--a-text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block font-body text-[10px] uppercase tracking-widest" style={{ color: 'var(--a-text-muted)' }}>
                  Template Name *
                </label>
                <input
                  value={newName}
                  onChange={(e) => {
                    const name = e.target.value
                    setNewName(name)
                    if (!newKeyTouched) setNewKey(slugifyTemplateKey(name))
                  }}
                  placeholder="Monthly Newsletter"
                  className="w-full border px-3 py-2 font-body text-sm outline-none"
                  style={{ background: 'var(--a-bg)', borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
                />
              </div>
              <div>
                <label className="mb-1 block font-body text-[10px] uppercase tracking-widest" style={{ color: 'var(--a-text-muted)' }}>
                  Template Key *
                </label>
                <input
                  value={newKey}
                  onChange={(e) => {
                    setNewKeyTouched(true)
                    setNewKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))
                  }}
                  placeholder="monthly_newsletter"
                  className="w-full border px-3 py-2 font-mono text-sm outline-none"
                  style={{ background: 'var(--a-bg)', borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
                />
              </div>
              <div>
                <label className="mb-1 block font-body text-[10px] uppercase tracking-widest" style={{ color: 'var(--a-text-muted)' }}>
                  Default Subject *
                </label>
                <input
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Your monthly update from Room For You"
                  className="w-full border px-3 py-2 font-body text-sm outline-none"
                  style={{ background: 'var(--a-bg)', borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
                />
              </div>
              <div>
                <label className="mb-1 block font-body text-[10px] uppercase tracking-widest" style={{ color: 'var(--a-text-muted)' }}>
                  Description (optional)
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  placeholder="When this template is used…"
                  className="w-full resize-none border px-3 py-2 font-body text-sm outline-none"
                  style={{ background: 'var(--a-bg)', borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
                />
              </div>
              <button
                type="button"
                disabled={creating}
                onClick={() => void handleCreateTemplate()}
                className="flex w-full items-center justify-center gap-2 py-3 font-body text-xs font-semibold uppercase tracking-widest disabled:opacity-40"
                style={{ background: 'var(--a-gold)', color: '#0F0F0F' }}
              >
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={13} />}
                Create Template
              </button>
            </div>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((item) => {
          const config = EMAIL_TEMPLATE_DEFAULTS[item.key as keyof typeof EMAIL_TEMPLATE_DEFAULTS]

          return (
            <div
              key={item.key}
              className="flex flex-col gap-3 border p-5"
              style={{
                borderColor: item.hasSavedDesign ? 'var(--a-gold-border)' : 'var(--a-border)',
                background: 'var(--a-surface)',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center"
                    style={{ background: item.hasSavedDesign ? 'var(--a-gold-light)' : 'var(--a-bg)' }}
                  >
                    <Mail size={16} style={{ color: item.hasSavedDesign ? 'var(--a-gold)' : 'var(--a-text-muted)' }} />
                  </div>
                  <div>
                    <p className="font-body text-sm font-semibold" style={{ color: 'var(--a-text)' }}>
                      {item.name}
                    </p>
                    {item.isCustom ? (
                      <p className="font-body text-[10px]" style={{ color: 'var(--a-gold)' }}>
                        Custom template
                      </p>
                    ) : item.hasSavedDesign ? (
                      <p className="font-body text-[10px]" style={{ color: 'var(--a-gold)' }}>
                        ✓ Custom design saved
                      </p>
                    ) : (
                      <p className="font-body text-[10px]" style={{ color: 'var(--a-text-muted)' }}>
                        Using default template
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <p className="font-body text-xs leading-relaxed" style={{ color: 'var(--a-text-muted)' }}>
                {item.description ?? config?.description ?? 'Custom email template'}
              </p>

              <div className="border px-3 py-2" style={{ borderColor: 'var(--a-border)', background: 'var(--a-bg)' }}>
                <p
                  className="font-body mb-1 text-[10px] uppercase tracking-widest"
                  style={{ color: 'var(--a-text-muted)' }}
                >
                  Subject
                </p>
                <p className="font-body truncate text-xs" style={{ color: 'var(--a-text-secondary)' }}>
                  {item.subject}
                </p>
              </div>

              <button
                type="button"
                onClick={() => openEditor(item.key)}
                className="flex w-full items-center justify-center gap-2 py-2.5 font-body text-xs font-medium transition-all"
                style={{
                  background: 'var(--a-gold)',
                  color: '#0F0F0F',
                }}
              >
                <Pencil size={12} />
                {item.hasSavedDesign ? 'Edit Template' : 'Design Template'}
              </button>
            </div>
          )
        })}
      </div>
    </>
  )
}

function EditTemplate({
  defaultConfig,
  displayName,
  savedTemplate,
  subject,
  onSubjectChange,
  editorRef,
  onSave,
  onCancel,
  saving,
}: {
  defaultConfig: (typeof EMAIL_TEMPLATE_DEFAULTS)[keyof typeof EMAIL_TEMPLATE_DEFAULTS] | null
  displayName: string
  savedTemplate: Record<string, unknown> | undefined
  subject: string
  onSubjectChange: (s: string) => void
  editorRef: MutableRefObject<UnlayerEditor | null>
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  const [editorLoaded, setEditorLoaded] = useState(false)
  const [EmailEditor, setEmailEditor] = useState<React.ComponentType<EmailEditorProps> | null>(null)

  useEffect(() => {
    import('react-email-editor').then((mod) => {
      setEmailEditor(() => mod.default)
    })
  }, [])

  const onEditorReady: EmailEditorProps['onReady'] = (unlayer) => {
    editorRef.current = unlayer
    setEditorLoaded(true)

    const load = (design: unknown) =>
      unlayer.loadDesign(design as Parameters<UnlayerEditor['loadDesign']>[0])

    if (savedTemplate?.design) {
      load(savedTemplate.design)
    } else {
      load(
        getBaseDesign({
          heading: displayName,
          body:
            (savedTemplate?.description as string | undefined) ??
            defaultConfig?.description ??
            'Edit this template to customize your email content.',
          ctaText: 'Visit rfyglobal.org',
          ctaUrl: 'https://rfyglobal.org',
        }),
      )
    }

    unlayer.setMergeTags({
      first_name: { name: 'First Name', value: '{{first_name}}' },
      year: { name: 'Year', value: '{{year}}' },
      event_title: { name: 'Event Title', value: '{{event_title}}' },
      event_date: { name: 'Event Date', value: '{{event_date}}' },
      event_location: { name: 'Event Location', value: '{{event_location}}' },
      event_url: { name: 'Event URL', value: '{{event_url}}' },
      event_city: { name: 'Event City', value: '{{event_city}}' },
      event_venue: { name: 'Venue', value: '{{event_venue}}' },
      event_time: { name: 'Event time', value: '{{event_time}}' },
      study_title: { name: 'Study Title', value: '{{study_title}}' },
      study_excerpt: { name: 'Study Excerpt', value: '{{study_excerpt}}' },
      reference: { name: 'Scripture Reference', value: '{{reference}}' },
      scripture_reference: { name: 'Scripture Reference', value: '{{scripture_reference}}' },
      scripture_verse: { name: 'Scripture Verse', value: '{{scripture_verse}}' },
      scripture_reflection: { name: 'Scripture Reflection', value: '{{scripture_reflection}}' },
      scripture_text: { name: 'Scripture Text', value: '{{scripture_text}}' },
      translation: { name: 'Translation', value: '{{translation}}' },
      date_str: { name: 'Date (formatted)', value: '{{date_str}}' },
      reminder_badge: { name: 'Reminder badge', value: '{{reminder_badge}}' },
      event_description: { name: 'Event description', value: '{{event_description}}' },
      unsubscribe_url: { name: 'Unsubscribe URL', value: '{{unsubscribe_url}}' },
      whatsapp_block: { name: 'WhatsApp CTA block (HTML)', value: '{{whatsapp_block}}' },
      reply_body: { name: 'Reply body (HTML)', value: '{{reply_body}}' },
      subject: { name: 'Original subject', value: '{{subject}}' },
      amount_display: { name: 'Gift amount line', value: '{{amount_display}}' },
    })
  }

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 font-body text-sm transition-colors"
            style={{ color: 'var(--a-text-muted)' }}
          >
            ← Back
          </button>
          <div className="h-4 w-px" style={{ background: 'var(--a-border)' }} />
          <p className="font-display text-lg font-semibold" style={{ color: 'var(--a-text)' }}>
            {displayName}
          </p>
        </div>

        <div className="flex max-w-md flex-1 flex-wrap items-center gap-3">
          <label
            className="shrink-0 font-body text-xs uppercase tracking-widest"
            style={{ color: 'var(--a-text-muted)' }}
          >
            Subject
          </label>
          <input
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            placeholder="Email subject line"
            className="flex-1 border px-3 py-2 font-body text-sm"
            style={{
              background: 'var(--a-bg)',
              borderColor: 'var(--a-border)',
              color: 'var(--a-text)',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--a-gold)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--a-border)'
            }}
          />
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={saving || !editorLoaded}
          className="flex items-center gap-2 px-5 py-2.5 font-body text-sm font-semibold transition-all disabled:opacity-40"
          style={{ background: 'var(--a-gold)', color: '#0F0F0F' }}
        >
          {saving ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Save size={14} /> Save Template
            </>
          )}
        </button>
      </div>

      <div className="min-h-[600px] flex-1 border" style={{ borderColor: 'var(--a-border)' }}>
        {!editorLoaded && (
          <div className="flex h-full items-center justify-center gap-3">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--a-gold)' }} />
            <p className="font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
              Loading email editor…
            </p>
          </div>
        )}
        {EmailEditor && (
          <EmailEditor
            onReady={onEditorReady}
            minHeight="100%"
            options={{
              appearance: {
                theme: 'dark',
                panels: {
                  tools: { dock: 'right' },
                },
              },
              features: {
                preview: true,
                imageEditor: true,
              },
              customCSS: ['.blockbuilder-branding { display: none !important; }'],
              projectId: 0,
              user: { id: 1 },
            }}
            style={{ minHeight: '600px' }}
          />
        )}
      </div>
    </div>
  )
}
