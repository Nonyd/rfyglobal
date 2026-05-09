# ROOM FOR YOU — Phase 30 Cursor Prompt
## Email Template Manager with Unlayer Drag-and-Drop Builder

---

## CONTEXT

Build an email template management system in the admin dashboard using **Unlayer** — the same drag-and-drop email builder used by major platforms. Admins can visually design email templates, save them, and all automated emails use the saved templates.

**Templates to manage:**
1. Welcome / Join confirmation
2. Daily Word (devotional)
3. Event reminder
4. Event registration confirmation
5. Prayer reply
6. Partner / giving confirmation
7. Contact form auto-reply
8. Unsubscribe confirmation

---

## TASK 1 — Install Unlayer

```bash
npm install react-email-editor
```

---

## TASK 2 — Prisma Schema: Email Template Model

Add to `prisma/schema.prisma`:

```prisma
model EmailTemplate {
  id          String    @id @default(cuid())
  key         String    @unique  // 'welcome' | 'devotional' | 'event_reminder' etc.
  name        String             // Display name: "Welcome Email"
  subject     String             // Default email subject
  design      Json               // Unlayer JSON design
  html        String             @db.Text  // Rendered HTML
  updatedAt   DateTime           @updatedAt
  createdAt   DateTime           @default(now())
}
```

Run: `npx prisma db push`

---

## TASK 3 — Email Template API Routes

Create `src/app/api/admin/email-templates/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const templates = await db.emailTemplate.findMany({
    orderBy: { key: 'asc' },
  })

  return NextResponse.json(templates)
}
```

Create `src/app/api/admin/email-templates/[key]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: { key: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const template = await db.emailTemplate.findUnique({
    where: { key: params.key },
  })

  return NextResponse.json(template)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { key: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { design, html, subject } = body

  const template = await db.emailTemplate.upsert({
    where: { key: params.key },
    create: {
      key: params.key,
      name: body.name ?? params.key,
      subject: subject ?? '',
      design,
      html,
    },
    update: {
      design,
      html,
      subject,
    },
  })

  return NextResponse.json(template)
}
```

---

## TASK 4 — Default Email Templates

Create `src/lib/email-defaults.ts` with default Unlayer designs for each template:

```typescript
// Default template configurations
export const EMAIL_TEMPLATE_DEFAULTS = {
  welcome: {
    name: 'Welcome Email',
    subject: 'Welcome to Room For You 🏠',
    description: 'Sent when someone joins the community',
  },
  devotional: {
    name: 'Daily Word',
    subject: "Today's Word — {{reference}}",
    description: 'Sent every morning with the daily scripture',
  },
  event_reminder: {
    name: 'Event Reminder',
    subject: 'Reminder: {{event_title}} is coming up',
    description: 'Sent 1 week and 24 hours before an event',
  },
  event_registration: {
    name: 'Event Registration',
    subject: "You're registered for {{event_title}}",
    description: 'Sent when someone registers for an event',
  },
  prayer_reply: {
    name: 'Prayer Reply',
    subject: 'Re: Your Prayer Request — {{subject}}',
    description: 'Sent when admin replies to a prayer request',
  },
  partner_confirmation: {
    name: 'Partner Confirmation',
    subject: 'Thank you for partnering with Room For You',
    description: 'Sent after a successful giving transaction',
  },
  contact_reply: {
    name: 'Contact Auto-Reply',
    subject: 'We received your message — Room For You',
    description: 'Sent when someone submits the contact form',
  },
  unsubscribe: {
    name: 'Unsubscribe Confirmation',
    subject: 'You have been unsubscribed',
    description: 'Sent when someone unsubscribes from emails',
  },
}

// Base Unlayer design template for all RFY emails
export function getBaseDesign(content: {
  preheader?: string
  heading: string
  body: string
  ctaText?: string
  ctaUrl?: string
  footerText?: string
}) {
  return {
    counters: { u_column: 5, u_row: 8, u_content_text: 6, u_content_image: 2, u_content_button: 1, u_content_divider: 2 },
    body: {
      id: 'rfy-base',
      rows: [
        // Header row with logo
        {
          id: 'header-row',
          cells: [1],
          columns: [{
            id: 'header-col',
            contents: [{
              id: 'logo',
              type: 'image',
              values: {
                src: {
                  url: 'https://rfyglobal.org/images/logo-white.png',
                  width: 200,
                  height: 80,
                },
                textAlign: 'center',
                linkHref: { name: 'web', values: { href: 'https://rfyglobal.org', target: '_blank' } },
                containerPadding: '24px 40px',
              }
            }],
            values: { backgroundColor: '#0F0F0F', padding: '0px' }
          }],
          values: { backgroundColor: '#0F0F0F', padding: '0px' }
        },
        // Gold divider
        {
          id: 'divider-row',
          cells: [1],
          columns: [{
            id: 'divider-col',
            contents: [{
              id: 'top-divider',
              type: 'divider',
              values: {
                width: '100%',
                border: { borderTopWidth: '3px', borderTopStyle: 'solid', borderTopColor: '#C9A84C' },
                containerPadding: '0px',
              }
            }],
            values: { backgroundColor: '#0F0F0F', padding: '0px' }
          }],
          values: { backgroundColor: '#0F0F0F', padding: '0px' }
        },
        // Main content row
        {
          id: 'content-row',
          cells: [1],
          columns: [{
            id: 'content-col',
            contents: [
              // Heading
              {
                id: 'heading',
                type: 'text',
                values: {
                  text: `<h1 style="font-family: Georgia, serif; font-size: 32px; font-weight: 700; color: #F8F8F8; margin: 0 0 16px 0; line-height: 1.2;">${content.heading}</h1>`,
                  containerPadding: '40px 40px 0px',
                }
              },
              // Body
              {
                id: 'body',
                type: 'text',
                values: {
                  text: `<p style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.8; color: #A0A0A0; margin: 0;">${content.body}</p>`,
                  containerPadding: '16px 40px 32px',
                }
              },
              // CTA Button (if provided)
              ...(content.ctaText && content.ctaUrl ? [{
                id: 'cta',
                type: 'button',
                values: {
                  text: content.ctaText,
                  href: { name: 'web', values: { href: content.ctaUrl, target: '_blank' } },
                  buttonColors: { color: '#0F0F0F', backgroundColor: '#C9A84C', hoverColor: '#0F0F0F', hoverBackgroundColor: '#E8C96A' },
                  size: { autoWidth: false, width: '200px' },
                  textAlign: 'left',
                  containerPadding: '0px 40px 40px',
                  fontFamily: { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
                  fontSize: '13px',
                  fontWeight: '700',
                  letterSpacing: '2px',
                  lineHeight: '120%',
                  padding: '14px 24px',
                  borderRadius: '0px',
                }
              }] : []),
            ],
            values: { backgroundColor: '#1A1A1A', padding: '0px' }
          }],
          values: { backgroundColor: '#0F0F0F', padding: '0px 0px 0px' }
        },
        // Bottom divider
        {
          id: 'bottom-divider-row',
          cells: [1],
          columns: [{
            id: 'bottom-divider-col',
            contents: [{
              id: 'bottom-divider',
              type: 'divider',
              values: {
                width: '100%',
                border: { borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: '#C9A84C' },
                containerPadding: '0px',
              }
            }],
            values: { backgroundColor: '#0F0F0F', padding: '0px' }
          }],
          values: { backgroundColor: '#0F0F0F', padding: '0px' }
        },
        // Footer
        {
          id: 'footer-row',
          cells: [1],
          columns: [{
            id: 'footer-col',
            contents: [{
              id: 'footer-text',
              type: 'text',
              values: {
                text: `<p style="font-family: Arial, sans-serif; font-size: 11px; color: #585858; text-align: center; margin: 0; letter-spacing: 0.1em;">${content.footerText ?? 'Room For You · rfyglobal.org · Jesus to Nations'}</p><p style="font-family: Arial, sans-serif; font-size: 11px; color: #585858; text-align: center; margin: 8px 0 0 0;"><a href="{{unsubscribe_url}}" style="color: #585858; text-decoration: underline;">Unsubscribe</a></p>`,
                containerPadding: '24px 40px',
              }
            }],
            values: { backgroundColor: '#0F0F0F', padding: '0px' }
          }],
          values: { backgroundColor: '#0F0F0F', padding: '0px' }
        }
      ],
      values: {
        backgroundColor: '#0F0F0F',
        backgroundImage: { url: '', fullWidth: false, repeat: 'no-repeat', size: 'custom', position: 'center' },
        contentWidth: '600px',
        contentAlign: 'center',
        fontFamily: { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
        preheaderText: content.preheader ?? '',
      }
    }
  }
}
```

---

## TASK 5 — Admin Email Templates Page

Create `src/app/admin/(dashboard)/email-templates/page.tsx`:

```typescript
import { EmailTemplatesManager } from '@/components/admin/email-templates/EmailTemplatesManager'

export default function EmailTemplatesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold" style={{ color: 'var(--a-text)' }}>
          Email Templates
        </h1>
        <p className="font-body text-sm mt-1" style={{ color: 'var(--a-text-muted)' }}>
          Design and manage all automated email templates. Changes apply to all future sends.
        </p>
      </div>
      <EmailTemplatesManager />
    </div>
  )
}
```

---

## TASK 6 — EmailTemplatesManager Component

Create `src/components/admin/email-templates/EmailTemplatesManager.tsx`:

```typescript
'use client'

import { useState, useEffect, useRef } from 'react'
import { Mail, Pencil, Eye, Save, X, ChevronRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { EMAIL_TEMPLATE_DEFAULTS } from '@/lib/email-defaults'

const TEMPLATE_KEYS = Object.keys(EMAIL_TEMPLATE_DEFAULTS) as Array<keyof typeof EMAIL_TEMPLATE_DEFAULTS>

export function EmailTemplatesManager() {
  const [templates, setTemplates] = useState<Record<string, any>>({})
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [mode, setMode] = useState<'list' | 'edit' | 'preview'>('list')
  const [subject, setSubject] = useState('')
  const [saving, setSaving] = useState(false)
  const editorRef = useRef<any>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    const res = await fetch('/api/admin/email-templates')
    if (res.ok) {
      const data = await res.json()
      const map: Record<string, any> = {}
      data.forEach((t: any) => { map[t.key] = t })
      setTemplates(map)
    }
  }

  const openEditor = (key: string) => {
    setSelectedKey(key)
    setSubject(templates[key]?.subject ?? EMAIL_TEMPLATE_DEFAULTS[key as keyof typeof EMAIL_TEMPLATE_DEFAULTS]?.subject ?? '')
    setMode('edit')
  }

  const saveTemplate = async () => {
    if (!selectedKey || !editorRef.current) return
    setSaving(true)

    editorRef.current.exportHtml(async (data: { design: any; html: string }) => {
      try {
        const res = await fetch(`/api/admin/email-templates/${selectedKey}`, {
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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {TEMPLATE_KEYS.map(key => {
        const config = EMAIL_TEMPLATE_DEFAULTS[key]
        const saved = templates[key]

        return (
          <div
            key={key}
            className="border p-5 flex flex-col gap-3"
            style={{
              borderColor: saved ? 'var(--a-gold-border)' : 'var(--a-border)',
              background: 'var(--a-surface)',
            }}
          >
            {/* Icon + Name */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 flex items-center justify-center"
                  style={{ background: saved ? 'var(--a-gold-light)' : 'var(--a-bg)' }}>
                  <Mail size={16} style={{ color: saved ? 'var(--a-gold)' : 'var(--a-text-muted)' }} />
                </div>
                <div>
                  <p className="font-body text-sm font-semibold"
                    style={{ color: 'var(--a-text)' }}>
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

            {/* Description */}
            <p className="font-body text-xs leading-relaxed"
              style={{ color: 'var(--a-text-muted)' }}>
              {config.description}
            </p>

            {/* Subject */}
            <div className="px-3 py-2 border"
              style={{ borderColor: 'var(--a-border)', background: 'var(--a-bg)' }}>
              <p className="font-body text-[10px] uppercase tracking-widest mb-1"
                style={{ color: 'var(--a-text-muted)' }}>Subject</p>
              <p className="font-body text-xs truncate"
                style={{ color: 'var(--a-text-secondary)' }}>
                {saved?.subject ?? config.subject}
              </p>
            </div>

            {/* Actions */}
            <button
              onClick={() => openEditor(key)}
              className="flex items-center justify-center gap-2 w-full py-2.5 font-body text-xs font-medium transition-all"
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

// Edit template with Unlayer
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
  defaultConfig: any
  savedTemplate: any
  subject: string
  onSubjectChange: (s: string) => void
  editorRef: React.MutableRefObject<any>
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  const [editorLoaded, setEditorLoaded] = useState(false)
  const [EmailEditor, setEmailEditor] = useState<any>(null)

  // Dynamic import to avoid SSR issues
  useEffect(() => {
    import('react-email-editor').then(mod => {
      setEmailEditor(() => mod.default)
    })
  }, [])

  const onEditorReady = (unlayer: any) => {
    editorRef.current = unlayer
    setEditorLoaded(true)

    // Load saved design or default
    if (savedTemplate?.design) {
      unlayer.loadDesign(savedTemplate.design)
    } else {
      // Load a default RFY-branded design
      const { getBaseDesign } = require('@/lib/email-defaults')
      const defaultDesign = getBaseDesign({
        heading: defaultConfig?.name ?? 'Room For You',
        body: 'Edit this template to customize your email content.',
        ctaText: 'Visit rfyglobal.org',
        ctaUrl: 'https://rfyglobal.org',
      })
      unlayer.loadDesign(defaultDesign)
    }

    // Apply RFY brand colors
    unlayer.setMergeTags({
      first_name: { name: 'First Name', value: '{{first_name}}' },
      event_title: { name: 'Event Title', value: '{{event_title}}' },
      reference: { name: 'Scripture Reference', value: '{{reference}}' },
      unsubscribe_url: { name: 'Unsubscribe URL', value: '{{unsubscribe_url}}' },
    })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Editor header */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
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

        {/* Subject field */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <label className="font-body text-xs uppercase tracking-widest shrink-0"
            style={{ color: 'var(--a-text-muted)' }}>
            Subject
          </label>
          <input
            value={subject}
            onChange={e => onSubjectChange(e.target.value)}
            placeholder="Email subject line"
            className="flex-1 px-3 py-2 font-body text-sm border"
            style={{
              background: 'var(--a-bg)',
              borderColor: 'var(--a-border)',
              color: 'var(--a-text)',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--a-gold)')}
            onBlur={e => (e.target.style.borderColor = 'var(--a-border)')}
          />
        </div>

        {/* Save button */}
        <button
          onClick={onSave}
          disabled={saving || !editorLoaded}
          className="flex items-center gap-2 px-5 py-2.5 font-body text-sm font-semibold text-white disabled:opacity-40 transition-all"
          style={{ background: 'var(--a-gold)', color: '#0F0F0F' }}
        >
          {saving ? (
            <><Loader2 size={14} className="animate-spin" /> Saving…</>
          ) : (
            <><Save size={14} /> Save Template</>
          )}
        </button>
      </div>

      {/* Unlayer editor */}
      <div className="flex-1 border" style={{ borderColor: 'var(--a-border)' }}>
        {!editorLoaded && (
          <div className="flex items-center justify-center h-full gap-3">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--a-gold)' }} />
            <p className="font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
              Loading email editor…
            </p>
          </div>
        )}
        {EmailEditor && (
          <EmailEditor
            ref={editorRef}
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
              customCSS: [
                '.blockbuilder-branding { display: none !important; }',
              ],
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
```

---

## TASK 7 — Update Email Sending to Use Saved Templates

Update `src/lib/brevo.ts` to check for a saved template before using the hardcoded HTML:

```typescript
import { db } from './db'

export async function getTemplateHtml(
  key: string,
  variables: Record<string, string> = {}
): Promise<string | null> {
  try {
    const template = await db.emailTemplate.findUnique({ where: { key } })
    if (!template?.html) return null

    // Replace template variables
    let html = template.html
    Object.entries(variables).forEach(([k, v]) => {
      html = html.replace(new RegExp(`{{${k}}}`, 'g'), v)
    })

    return html
  } catch {
    return null
  }
}
```

Update each email function to try the saved template first, fall back to hardcoded:

```typescript
// Example for welcome email in src/lib/emails/confirmation.ts:
export async function sendConfirmationEmail(member: { email: string; name: string }) {
  // Try saved template first
  const savedHtml = await getTemplateHtml('welcome', {
    first_name: member.name,
  })

  const html = savedHtml ?? buildDefaultWelcomeHtml(member) // existing function

  await sendEmail({
    to: member.email,
    subject: await getTemplateSubject('welcome') ?? 'Welcome to Room For You 🏠',
    html,
    fromName: EMAIL_SENDERS.hello.name,
    fromEmail: EMAIL_SENDERS.hello.email,
  })
}

// Helper to get saved subject:
export async function getTemplateSubject(key: string): Promise<string | null> {
  try {
    const template = await db.emailTemplate.findUnique({ where: { key } })
    return template?.subject ?? null
  } catch {
    return null
  }
}
```

Apply the same pattern to all 8 email functions in `src/lib/emails/`.

---

## TASK 8 — Add to Sidebar Navigation

Open `src/components/admin/AdminSidebar.tsx`.

Add to SETTINGS section:

```typescript
{ label: 'Email Templates', href: '/admin/email-templates', icon: Mail },
```

Also add to `AdminMobileDrawer.tsx` under the same section.

---

## TASK 9 — Add to Permissions

Open `src/lib/permissions.ts`:

```typescript
'email-templates': ['SUPER_ADMIN', 'ADMIN'],
```

Open `src/middleware.ts`:

```typescript
'/admin/email-templates': ['SUPER_ADMIN', 'ADMIN'],
```

---

## COMPLETION CHECKLIST

**Schema**
- [ ] `EmailTemplate` model added
- [ ] `npx prisma db push` succeeds

**API**
- [ ] `GET /api/admin/email-templates` returns all templates
- [ ] `GET /api/admin/email-templates/[key]` returns one template
- [ ] `PUT /api/admin/email-templates/[key]` saves design + html + subject

**Admin UI**
- [ ] `/admin/email-templates` page loads
- [ ] Shows all 8 template cards
- [ ] Each card shows name, description, subject, saved status
- [ ] Clicking "Design Template" opens Unlayer editor
- [ ] Unlayer editor loads with RFY dark theme
- [ ] Default RFY-branded design pre-loaded for unsaved templates
- [ ] Subject field editable above the editor
- [ ] Save button exports HTML and saves to DB
- [ ] Back button returns to template list
- [ ] Merge tags available: `{{first_name}}`, `{{event_title}}`, `{{reference}}`

**Email Sending**
- [ ] Saved templates used when sending actual emails
- [ ] Falls back to hardcoded HTML if no saved template
- [ ] Template variables replaced correctly

**Navigation**
- [ ] "Email Templates" in sidebar under Settings
- [ ] "Email Templates" in mobile drawer

**Build**
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- `react-email-editor` must be dynamically imported (`import('react-email-editor')`) to avoid SSR errors — it uses browser DOM APIs. Never import it at the top level.
- The `ref` passed to `EmailEditor` is the Unlayer instance ref — use `editorRef.current.exportHtml()` to get the HTML and design JSON.
- The `onReady` callback fires when Unlayer is fully initialized. Load the design here, not before.
- Unlayer's `appearance.theme: 'dark'` gives a dark editor UI matching the admin dashboard dark mode.
- The `.blockbuilder-branding { display: none }` CSS hides the Unlayer watermark in the free tier.
- Template variables use `{{variable_name}}` syntax — this matches Brevo's merge tag syntax, making it easy to use the same templates with Brevo's template system in future.
- `getTemplateHtml` and `getTemplateSubject` make DB calls — they should be called server-side where possible, or cached. For cron jobs (devotional, event reminders), this is already server-side.
- The `require('@/lib/email-defaults')` inside `onEditorReady` is a workaround for Unlayer's browser context — the function runs in the browser so it needs to be available as a module. Consider moving `getBaseDesign` to a separate file that doesn't import any Node.js modules.
