'use client'

import { adminFetch } from '@/lib/admin-fetch'
import { useState, useEffect, useRef, type MutableRefObject } from 'react'
import { Mail, Pencil, Save, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { EMAIL_TEMPLATE_DEFAULTS, getBaseDesign } from '@/lib/email-defaults'
import type { EmailEditorProps } from 'react-email-editor'

const TEMPLATE_KEYS = Object.keys(EMAIL_TEMPLATE_DEFAULTS) as Array<keyof typeof EMAIL_TEMPLATE_DEFAULTS>

type UnlayerEditor = Parameters<NonNullable<EmailEditorProps['onReady']>>[0]

export function EmailTemplatesManager() {
  const [templates, setTemplates] = useState<Record<string, Record<string, unknown>>>({})
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [mode, setMode] = useState<'list' | 'edit'>('list')
  const [subject, setSubject] = useState('')
  const [saving, setSaving] = useState(false)
  const editorRef = useRef<UnlayerEditor | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    const res = await adminFetch('/api/admin/email-templates')
    if (res.ok) {
      const data = (await res.json()) as Array<{ key: string } & Record<string, unknown>>
      const map: Record<string, Record<string, unknown>> = {}
      data.forEach((t) => {
        map[t.key] = t
      })
      setTemplates(map)
    }
  }

  const openEditor = (key: string) => {
    setSelectedKey(key)
    setSubject(
      (templates[key]?.subject as string | undefined) ??
        EMAIL_TEMPLATE_DEFAULTS[key as keyof typeof EMAIL_TEMPLATE_DEFAULTS]?.subject ??
        '',
    )
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
              name: EMAIL_TEMPLATE_DEFAULTS[selectedKey as keyof typeof EMAIL_TEMPLATE_DEFAULTS]?.name,
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

  if (mode === 'edit' && selectedKey) {
    return (
      <EditTemplate
        templateKey={selectedKey}
        defaultConfig={selectedDefault}
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

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {TEMPLATE_KEYS.map((key) => {
        const config = EMAIL_TEMPLATE_DEFAULTS[key]
        const saved = templates[key]

        return (
          <div
            key={key}
            className="flex flex-col gap-3 border p-5"
            style={{
              borderColor: saved ? 'var(--a-gold-border)' : 'var(--a-border)',
              background: 'var(--a-surface)',
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center"
                  style={{ background: saved ? 'var(--a-gold-light)' : 'var(--a-bg)' }}
                >
                  <Mail size={16} style={{ color: saved ? 'var(--a-gold)' : 'var(--a-text-muted)' }} />
                </div>
                <div>
                  <p className="font-body text-sm font-semibold" style={{ color: 'var(--a-text)' }}>
                    {config.name}
                  </p>
                  {saved ? (
                    <p className="font-body text-[10px]" style={{ color: 'var(--a-gold)' }}>
                      ✓ Custom template saved
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
              {config.description}
            </p>

            <div className="border px-3 py-2" style={{ borderColor: 'var(--a-border)', background: 'var(--a-bg)' }}>
              <p
                className="font-body mb-1 text-[10px] uppercase tracking-widest"
                style={{ color: 'var(--a-text-muted)' }}
              >
                Subject
              </p>
              <p className="font-body truncate text-xs" style={{ color: 'var(--a-text-secondary)' }}>
                {(saved?.subject as string | undefined) ?? config.subject}
              </p>
            </div>

            <button
              type="button"
              onClick={() => openEditor(key)}
              className="flex w-full items-center justify-center gap-2 py-2.5 font-body text-xs font-medium transition-all"
              style={{
                background: 'var(--a-gold)',
                color: '#0F0F0F',
              }}
            >
              <Pencil size={12} />
              {saved ? 'Edit Template' : 'Design Template'}
            </button>
          </div>
        )
      })}
    </div>
  )
}

function EditTemplate({
  templateKey,
  defaultConfig,
  savedTemplate,
  subject,
  onSubjectChange,
  editorRef,
  onSave,
  onCancel,
  saving,
}: {
  templateKey: string
  defaultConfig: (typeof EMAIL_TEMPLATE_DEFAULTS)[keyof typeof EMAIL_TEMPLATE_DEFAULTS] | null
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
          heading: defaultConfig?.name ?? 'Room For You',
          body: 'Edit this template to customize your email content.',
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
            {defaultConfig?.name ?? templateKey}
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
