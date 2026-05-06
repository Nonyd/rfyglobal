# ROOM FOR YOU — Phase 2 Cursor Prompt
## Form Builder System (Full Stack)

---

## CONTEXT

Phase 1 is complete. The landing page, design system, Prisma schema, and security foundation are in place.

Phase 2 builds the **Form Builder System** — the most critical module of the platform. Every public-facing form on the site (Join the Community, Prayer Request, Mentorship, Event Registration) is powered by this single system.

The Form Builder lives in the admin dashboard and allows admin to:
- Create forms with a title, description, and slug
- Add, configure, and **drag-and-drop reorder** fields
- Toggle forms live/offline
- Share a standalone public URL `/forms/[slug]` or embed via iframe
- View all submissions per form in a data table
- Export submissions as CSV
- Receive an email notification on every submission

The public `/forms/[slug]` page renders any form dynamically and handles submission with rate limiting and validation.

---

## INSTALL ADDITIONAL DEPENDENCIES

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities \
  react-hook-form @hookform/resolvers \
  zod \
  @tanstack/react-table \
  papaparse \
  @types/papaparse \
  react-hot-toast
```

---

## TASK 1 — Zod Validation Schemas

Create `src/lib/validations/form.ts`:

```typescript
import { z } from 'zod'
import { FieldType } from '@prisma/client'

export const FormFieldSchema = z.object({
  id: z.string().optional(), // present for existing fields
  label: z.string().min(1, 'Label is required').max(200),
  type: z.nativeEnum(FieldType),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(), // for dropdown, radio, checkboxes
  order: z.number().int().min(0),
})

export const CreateFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  notifyEmail: z.string().email().optional().or(z.literal('')),
  fields: z.array(FormFieldSchema).min(1, 'At least one field is required'),
})

export const UpdateFormSchema = CreateFormSchema.partial().extend({
  isActive: z.boolean().optional(),
})

export type CreateFormInput = z.infer<typeof CreateFormSchema>
export type UpdateFormInput = z.infer<typeof UpdateFormSchema>
export type FormFieldInput = z.infer<typeof FormFieldSchema>
```

---

## TASK 2 — Form API Routes

### 2a. List & Create Forms — `src/app/api/forms/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { CreateFormSchema } from '@/lib/validations/form'
import { slugify } from '@/lib/utils'

export const runtime = 'nodejs'

// GET /api/forms — Admin: list all forms
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const forms = await db.form.findMany({
    include: { _count: { select: { submissions: true, fields: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(forms)
}

// POST /api/forms — Admin: create a new form with fields
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = CreateFormSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { title, description, slug, notifyEmail, fields } = parsed.data

  // Check slug uniqueness
  const existing = await db.form.findUnique({ where: { slug } })
  if (existing) {
    return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })
  }

  const form = await db.form.create({
    data: {
      title,
      description,
      slug,
      notifyEmail: notifyEmail || null,
      fields: {
        create: fields.map((f, i) => ({
          label: f.label,
          type: f.type,
          placeholder: f.placeholder,
          required: f.required,
          options: f.options ? f.options : undefined,
          order: f.order ?? i,
        })),
      },
    },
    include: { fields: { orderBy: { order: 'asc' } } },
  })

  return NextResponse.json(form, { status: 201 })
}
```

### 2b. Get, Update & Delete Single Form — `src/app/api/forms/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { UpdateFormSchema } from '@/lib/validations/form'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await db.form.findUnique({
    where: { id: params.id },
    include: { fields: { orderBy: { order: 'asc' } } },
  })

  if (!form) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(form)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = UpdateFormSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { fields, ...formData } = parsed.data

  // Update form metadata
  const form = await db.form.update({
    where: { id: params.id },
    data: formData,
  })

  // If fields are provided, replace them entirely (delete + recreate)
  if (fields) {
    await db.formField.deleteMany({ where: { formId: params.id } })
    await db.formField.createMany({
      data: fields.map((f, i) => ({
        formId: params.id,
        label: f.label,
        type: f.type,
        placeholder: f.placeholder ?? null,
        required: f.required,
        options: f.options ?? null,
        order: f.order ?? i,
      })),
    })
  }

  const updated = await db.form.findUnique({
    where: { id: params.id },
    include: { fields: { orderBy: { order: 'asc' } } },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db.form.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
```

### 2c. Public Form Fetch by Slug — `src/app/api/forms/slug/[slug]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const form = await db.form.findUnique({
    where: { slug: params.slug, isActive: true },
    include: { fields: { orderBy: { order: 'asc' } } },
  })

  if (!form) return NextResponse.json({ error: 'Form not found' }, { status: 404 })

  // Never expose notifyEmail to the public
  const { notifyEmail, ...publicForm } = form
  return NextResponse.json(publicForm)
}
```

---

## TASK 3 — Form Submission API Route

Create `src/app/api/forms/[id]/submit/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { strictRatelimit } from '@/lib/ratelimit'
import { sendEmail } from '@/lib/brevo'

export const runtime = 'nodejs'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Rate limiting — by IP
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'anonymous'
  const { success } = await strictRatelimit.limit(`form-submit:${ip}`)
  if (!success) {
    return NextResponse.json(
      { error: 'Too many submissions. Please wait a moment.' },
      { status: 429 }
    )
  }

  // Fetch form + fields
  const form = await db.form.findUnique({
    where: { id: params.id, isActive: true },
    include: { fields: { orderBy: { order: 'asc' } } },
  })

  if (!form) return NextResponse.json({ error: 'Form not found or inactive' }, { status: 404 })

  const body = await req.json()

  // Validate required fields
  for (const field of form.fields) {
    if (field.required) {
      const value = body[field.id]
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return NextResponse.json(
          { error: `"${field.label}" is required.` },
          { status: 400 }
        )
      }
    }
  }

  // Save submission
  const submission = await db.formSubmission.create({
    data: {
      formId: form.id,
      ipAddress: ip,
      values: {
        create: form.fields.map((field) => ({
          fieldId: field.id,
          fieldLabel: field.label,
          value: Array.isArray(body[field.id])
            ? (body[field.id] as string[]).join(', ')
            : String(body[field.id] ?? ''),
        })),
      },
    },
    include: { values: true },
  })

  // Send email notification if configured
  if (form.notifyEmail) {
    const tableRows = submission.values
      .map((v) => `<tr><td style="padding:8px;border:1px solid #333;color:#C9A84C;font-weight:600">${v.fieldLabel}</td><td style="padding:8px;border:1px solid #333;color:#FAFAFA">${v.value}</td></tr>`)
      .join('')

    await sendEmail({
      to: form.notifyEmail,
      subject: `New submission: ${form.title}`,
      html: `
        <div style="background:#0A0A0A;padding:32px;font-family:Inter,sans-serif;max-width:600px">
          <div style="border-bottom:1px solid #C9A84C;padding-bottom:16px;margin-bottom:24px">
            <h2 style="color:#C9A84C;margin:0;font-size:20px">New Form Submission</h2>
            <p style="color:#FAFAFA99;margin:4px 0 0;font-size:14px">${form.title}</p>
          </div>
          <table style="width:100%;border-collapse:collapse">
            ${tableRows}
          </table>
          <p style="color:#FAFAFA40;font-size:12px;margin-top:24px">
            Room For You · rfyglobal.org · A SonsHub Media Initiative
          </p>
        </div>
      `,
    })
  }

  return NextResponse.json({ success: true, submissionId: submission.id }, { status: 201 })
}
```

---

## TASK 4 — Form Entries API Route

Create `src/app/api/forms/[id]/entries/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// GET /api/forms/[id]/entries — paginated entries
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const skip = (page - 1) * limit

  const [submissions, total] = await Promise.all([
    db.formSubmission.findMany({
      where: { formId: params.id },
      include: { values: { orderBy: { fieldLabel: 'asc' } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.formSubmission.count({ where: { formId: params.id } }),
  ])

  return NextResponse.json({
    submissions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}
```

---

## TASK 5 — CSV Export API Route

Create `src/app/api/forms/[id]/entries/export/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await db.form.findUnique({
    where: { id: params.id },
    include: {
      fields: { orderBy: { order: 'asc' } },
      submissions: {
        include: { values: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!form) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Build CSV
  const headers = ['Submitted At', ...form.fields.map((f) => f.label)]
  const rows = form.submissions.map((sub) => {
    const valueMap = Object.fromEntries(sub.values.map((v) => [v.fieldLabel, v.value]))
    return [
      new Date(sub.createdAt).toISOString(),
      ...form.fields.map((f) => `"${(valueMap[f.label] ?? '').replace(/"/g, '""')}"`)
    ].join(',')
  })

  const csv = [headers.join(','), ...rows].join('\n')
  const filename = `${form.slug}-entries-${Date.now()}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
```

---

## TASK 6 — Admin Dashboard Shell Layout

Create `src/app/admin/(dashboard)/layout.tsx`:

```typescript
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopbar } from '@/components/admin/AdminTopbar'

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/admin/login')

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <AdminSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminTopbar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
```

---

## TASK 7 — Admin Sidebar

Create `src/components/admin/AdminSidebar.tsx`:

The sidebar must:
- Be fixed on desktop, hidden on mobile (toggled via state)
- Background: `#0A0A0A` with a right border `rgba(201,168,76,0.15)`
- Logo at the top (small version)
- Navigation items with Lucide icons:
  - **Dashboard** → `/admin` (LayoutDashboard icon)
  - **Scripture** → `/admin/scripture` (BookOpen icon)
  - **Forms** → `/admin/forms` (ClipboardList icon)
  - **Blog** → `/admin/blog` (FileText icon)
  - **Study** → `/admin/study` (GraduationCap icon)
  - **Events** → `/admin/events` (Calendar icon)
  - **Partnership** → `/admin/partner` (Heart icon)
- Active state: gold left border + gold text
- Inactive state: white/50 text, hover white/80
- Sign out button at the bottom

```typescript
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, BookOpen, ClipboardList,
  FileText, GraduationCap, Calendar, Heart, LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Scripture', href: '/admin/scripture', icon: BookOpen },
  { label: 'Forms', href: '/admin/forms', icon: ClipboardList },
  { label: 'Blog', href: '/admin/blog', icon: FileText },
  { label: 'Study', href: '/admin/study', icon: GraduationCap },
  { label: 'Events', href: '/admin/events', icon: Calendar },
  { label: 'Partnership', href: '/admin/partner', icon: Heart },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r bg-black"
      style={{ borderColor: 'rgba(201,168,76,0.15)' }}>
      {/* Logo */}
      <div className="p-6 border-b" style={{ borderColor: 'rgba(201,168,76,0.15)' }}>
        <Image
          src="/images/logo-white.png"
          alt="Room For You"
          width={100}
          height={50}
          className="h-8 w-auto"
        />
        <p className="text-[10px] tracking-widest uppercase mt-2"
          style={{ color: 'rgba(201,168,76,0.6)' }}>
          Admin Dashboard
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm font-body transition-all duration-200 border-l-2',
                isActive
                  ? 'border-gold text-gold bg-gold/5'
                  : 'border-transparent text-white/50 hover:text-white/80 hover:bg-white/5'
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="p-4 border-t" style={{ borderColor: 'rgba(201,168,76,0.15)' }}>
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/40 hover:text-red-brand transition-colors w-full"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
```

---

## TASK 8 — Admin Topbar

Create `src/components/admin/AdminTopbar.tsx`:

```typescript
'use client'

import { usePathname } from 'next/navigation'

const pageTitles: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/scripture': 'Daily Scripture',
  '/admin/forms': 'Form Builder',
  '/admin/blog': 'Blog & Devotionals',
  '/admin/study': 'Study Portal',
  '/admin/events': 'Events',
  '/admin/partner': 'Partnership',
}

export function AdminTopbar() {
  const pathname = usePathname()
  const title = Object.entries(pageTitles)
    .reverse()
    .find(([key]) => pathname.startsWith(key))?.[1] ?? 'Admin'

  return (
    <header className="border-b px-6 lg:px-8 py-4 flex items-center justify-between"
      style={{ borderColor: 'rgba(201,168,76,0.15)', background: '#0A0A0A' }}>
      <h1 className="font-display text-xl text-white">{title}</h1>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
        <span className="text-xs text-white/40 font-body tracking-wide">Room For You</span>
      </div>
    </header>
  )
}
```

---

## TASK 9 — Form Builder Page (Admin)

Create `src/app/admin/(dashboard)/forms/page.tsx`:

This page shows:
- A header with title "Form Builder" and a **"New Form"** button (gold)
- A list/grid of all existing forms, each showing:
  - Form title
  - Slug (as a copyable tag)
  - Field count
  - Submission count
  - Active/Inactive badge
  - Actions: **Edit**, **View Entries**, **Copy Link**, **Toggle Active**, **Delete**
- Empty state when no forms exist yet

```typescript
import Link from 'next/link'
import { db } from '@/lib/db'
import { FormCard } from '@/components/admin/forms/FormCard'
import { Plus } from 'lucide-react'

export default async function FormsPage() {
  const forms = await db.form.findMany({
    include: { _count: { select: { submissions: true, fields: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl text-white">Forms</h2>
          <p className="text-white/40 text-sm font-body mt-1">
            Create and manage all community forms
          </p>
        </div>
        <Link
          href="/admin/forms/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-gold text-black text-sm font-body font-medium tracking-wide hover:bg-gold-light transition-colors"
        >
          <Plus size={16} />
          New Form
        </Link>
      </div>

      {/* Forms Grid */}
      {forms.length === 0 ? (
        <div className="text-center py-24 border border-dashed"
          style={{ borderColor: 'rgba(201,168,76,0.2)' }}>
          <p className="font-display text-2xl text-white/30 italic">No forms yet</p>
          <p className="text-white/20 text-sm mt-2 font-body">Create your first form to get started</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {forms.map((form) => (
            <FormCard key={form.id} form={form} />
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## TASK 10 — FormCard Component

Create `src/components/admin/forms/FormCard.tsx`:

```typescript
'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Edit, Eye, Copy, Trash2, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface FormCardProps {
  form: {
    id: string
    title: string
    slug: string
    isActive: boolean
    _count: { submissions: number; fields: number }
  }
}

export function FormCard({ form }: FormCardProps) {
  const [isActive, setIsActive] = useState(form.isActive)
  const [loading, setLoading] = useState(false)

  const toggleActive = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/forms/${form.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })
      if (res.ok) {
        setIsActive(!isActive)
        toast.success(isActive ? 'Form deactivated' : 'Form is now live')
      }
    } catch {
      toast.error('Failed to update form')
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    const url = `${window.location.origin}/forms/${form.slug}`
    navigator.clipboard.writeText(url)
    toast.success('Form link copied!')
  }

  const deleteForm = async () => {
    if (!confirm(`Delete "${form.title}"? This cannot be undone.`)) return
    const res = await fetch(`/api/forms/${form.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Form deleted')
      window.location.reload()
    } else {
      toast.error('Failed to delete form')
    }
  }

  return (
    <div className={cn(
      'border p-5 transition-all duration-200',
      isActive
        ? 'border-gold/30 bg-gold/5'
        : 'border-white/10 bg-white/2'
    )}>
      <div className="flex items-start justify-between gap-4">
        {/* Left: Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-display text-lg text-white">{form.title}</h3>
            <span className={cn(
              'text-[10px] px-2 py-0.5 font-body tracking-widest uppercase',
              isActive
                ? 'bg-gold/20 text-gold'
                : 'bg-white/10 text-white/40'
            )}>
              {isActive ? 'Live' : 'Draft'}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-white/40 font-body">
            <span className="font-mono text-gold/60">/forms/{form.slug}</span>
            <span>{form._count.fields} fields</span>
            <span>{form._count.submissions} submissions</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={toggleActive} disabled={loading}
            className="p-2 text-white/40 hover:text-gold transition-colors"
            title={isActive ? 'Deactivate' : 'Activate'}>
            {isActive ? <ToggleRight size={18} className="text-gold" /> : <ToggleLeft size={18} />}
          </button>
          <button onClick={copyLink}
            className="p-2 text-white/40 hover:text-gold transition-colors"
            title="Copy public link">
            <Copy size={16} />
          </button>
          <Link href={`/forms/${form.slug}`} target="_blank"
            className="p-2 text-white/40 hover:text-gold transition-colors"
            title="Preview form">
            <ExternalLink size={16} />
          </Link>
          <Link href={`/admin/forms/${form.id}/entries`}
            className="p-2 text-white/40 hover:text-gold transition-colors"
            title="View entries">
            <Eye size={16} />
          </Link>
          <Link href={`/admin/forms/${form.id}/edit`}
            className="p-2 text-white/40 hover:text-white transition-colors"
            title="Edit form">
            <Edit size={16} />
          </Link>
          <button onClick={deleteForm}
            className="p-2 text-white/40 hover:text-red-brand transition-colors"
            title="Delete form">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## TASK 11 — Form Builder Editor (New & Edit)

Create `src/app/admin/(dashboard)/forms/new/page.tsx`:

```typescript
import { FormBuilderEditor } from '@/components/admin/forms/FormBuilderEditor'

export default function NewFormPage() {
  return <FormBuilderEditor mode="create" />
}
```

Create `src/app/admin/(dashboard)/forms/[id]/edit/page.tsx`:

```typescript
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { FormBuilderEditor } from '@/components/admin/forms/FormBuilderEditor'

export default async function EditFormPage({ params }: { params: { id: string } }) {
  const form = await db.form.findUnique({
    where: { id: params.id },
    include: { fields: { orderBy: { order: 'asc' } } },
  })

  if (!form) notFound()

  return <FormBuilderEditor mode="edit" initialData={form} />
}
```

---

## TASK 12 — FormBuilderEditor Component

Create `src/components/admin/forms/FormBuilderEditor.tsx`:

This is the main form builder UI. It must include:

**Left panel — Form Settings:**
- Form title input
- Description textarea
- Slug input (auto-generated from title, editable)
- Notification email input
- Active toggle

**Right panel — Field Builder:**
- "Add Field" dropdown showing all 11 field types with icons
- List of added fields rendered as draggable cards (dnd-kit)
- Each field card shows:
  - Drag handle (grip icon)
  - Field type badge
  - Label input (inline editable)
  - Placeholder input (inline editable, where applicable)
  - Required toggle
  - For Dropdown/Radio/Checkboxes: options editor (add/remove options)
  - Delete button
- Drag-and-drop reordering using `@dnd-kit/sortable`

**Bottom bar:**
- Cancel button (back to forms list)
- Save as Draft button (isActive: false)
- Publish Form button (isActive: true)

```typescript
'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { slugify } from '@/lib/utils'
import { FieldType } from '@prisma/client'
import { SortableFieldCard } from './SortableFieldCard'
import { FieldTypePicker } from './FieldTypePicker'
import toast from 'react-hot-toast'
import type { FormFieldInput } from '@/lib/validations/form'

interface FormBuilderEditorProps {
  mode: 'create' | 'edit'
  initialData?: {
    id: string
    title: string
    description?: string | null
    slug: string
    notifyEmail?: string | null
    isActive: boolean
    fields: FormFieldInput[]
  }
}

export function FormBuilderEditor({ mode, initialData }: FormBuilderEditorProps) {
  const router = useRouter()

  const [title, setTitle] = useState(initialData?.title ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [slug, setSlug] = useState(initialData?.slug ?? '')
  const [notifyEmail, setNotifyEmail] = useState(initialData?.notifyEmail ?? '')
  const [fields, setFields] = useState<(FormFieldInput & { _key: string })[]>(
    (initialData?.fields ?? []).map((f, i) => ({ ...f, _key: `field-${i}-${Date.now()}` }))
  )
  const [saving, setSaving] = useState(false)

  // Auto-slug from title (only in create mode)
  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (mode === 'create') setSlug(slugify(val))
  }

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((i) => i._key === active.id)
        const newIndex = items.findIndex((i) => i._key === over.id)
        return arrayMove(items, oldIndex, newIndex).map((f, i) => ({ ...f, order: i }))
      })
    }
  }

  const addField = (type: FieldType) => {
    const newField: FormFieldInput & { _key: string } = {
      _key: `field-${Date.now()}`,
      label: `${type.replace(/_/g, ' ').toLowerCase()} field`,
      type,
      placeholder: '',
      required: false,
      options: ['DROPDOWN', 'RADIO', 'CHECKBOXES'].includes(type) ? ['Option 1', 'Option 2'] : undefined,
      order: fields.length,
    }
    setFields((prev) => [...prev, newField])
  }

  const updateField = (key: string, updates: Partial<FormFieldInput>) => {
    setFields((prev) => prev.map((f) => f._key === key ? { ...f, ...updates } : f))
  }

  const removeField = (key: string) => {
    setFields((prev) => prev.filter((f) => f._key !== key).map((f, i) => ({ ...f, order: i })))
  }

  const handleSave = async (isActive: boolean) => {
    if (!title.trim()) { toast.error('Form title is required'); return }
    if (!slug.trim()) { toast.error('Slug is required'); return }
    if (fields.length === 0) { toast.error('Add at least one field'); return }

    setSaving(true)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        slug: slug.trim(),
        notifyEmail: notifyEmail.trim() || undefined,
        isActive,
        fields: fields.map(({ _key, ...f }, i) => ({ ...f, order: i })),
      }

      const url = mode === 'create' ? '/api/forms' : `/api/forms/${initialData!.id}`
      const method = mode === 'create' ? 'POST' : 'PATCH'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.formErrors?.[0] ?? 'Failed to save form')
      }

      toast.success(mode === 'create' ? 'Form created!' : 'Form updated!')
      router.push('/admin/forms')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* Left: Form Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border p-6 space-y-5" style={{ borderColor: 'rgba(201,168,76,0.2)' }}>
            <h3 className="font-display text-lg text-white border-b pb-3"
              style={{ borderColor: 'rgba(201,168,76,0.15)' }}>
              Form Settings
            </h3>

            {/* Title */}
            <div>
              <label className="block text-xs text-white/50 font-body tracking-widest uppercase mb-2">
                Form Title *
              </label>
              <input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Join Room For You"
                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 text-sm font-body focus:border-gold focus:outline-none transition-colors placeholder:text-white/20"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-xs text-white/50 font-body tracking-widest uppercase mb-2">
                URL Slug *
              </label>
              <div className="flex items-center border border-white/10 focus-within:border-gold transition-colors">
                <span className="px-3 py-3 text-xs text-white/30 font-mono bg-white/5 border-r border-white/10">
                  /forms/
                </span>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  className="flex-1 bg-transparent text-white px-3 py-3 text-sm font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-white/50 font-body tracking-widest uppercase mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description shown on the form page"
                rows={3}
                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 text-sm font-body focus:border-gold focus:outline-none transition-colors placeholder:text-white/20 resize-none"
              />
            </div>

            {/* Notify Email */}
            <div>
              <label className="block text-xs text-white/50 font-body tracking-widest uppercase mb-2">
                Notify Email
              </label>
              <input
                type="email"
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
                placeholder="admin@roomforyou.org"
                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 text-sm font-body focus:border-gold focus:outline-none transition-colors placeholder:text-white/20"
              />
              <p className="text-[11px] text-white/30 mt-1 font-body">
                Receive an email on every submission
              </p>
            </div>
          </div>

          {/* Embed Code Preview */}
          {mode === 'edit' && slug && (
            <div className="border p-4 space-y-2" style={{ borderColor: 'rgba(201,168,76,0.15)' }}>
              <p className="text-xs text-white/50 font-body tracking-widest uppercase">Embed Code</p>
              <code className="block text-[11px] text-gold/70 font-mono bg-white/5 p-3 break-all">
                {`<iframe src="${process.env.NEXT_PUBLIC_APP_URL}/forms/${slug}" width="100%" height="600" frameborder="0"></iframe>`}
              </code>
            </div>
          )}
        </div>

        {/* Right: Field Builder */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg text-white">Fields</h3>
            <FieldTypePicker onAdd={addField} />
          </div>

          {fields.length === 0 ? (
            <div className="border border-dashed py-16 text-center"
              style={{ borderColor: 'rgba(201,168,76,0.2)' }}>
              <p className="text-white/30 font-body text-sm">
                No fields yet. Add your first field above.
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={fields.map((f) => f._key)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {fields.map((field) => (
                    <SortableFieldCard
                      key={field._key}
                      field={field}
                      onUpdate={(updates) => updateField(field._key, updates)}
                      onRemove={() => removeField(field._key)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="sticky bottom-0 mt-8 border-t py-4 px-0 flex items-center justify-between"
        style={{ borderColor: 'rgba(201,168,76,0.2)', background: '#0A0A0A' }}>
        <button
          onClick={() => router.back()}
          className="px-5 py-2.5 border border-white/20 text-white/60 text-sm font-body hover:border-white/40 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-5 py-2.5 border border-gold/50 text-gold/80 text-sm font-body hover:border-gold hover:text-gold transition-colors disabled:opacity-40"
          >
            Save as Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-6 py-2.5 bg-gold text-black text-sm font-body font-medium hover:bg-gold-light transition-colors disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Publish Form'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## TASK 13 — SortableFieldCard Component

Create `src/components/admin/forms/SortableFieldCard.tsx`:

```typescript
'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, Plus, X } from 'lucide-react'
import { FieldType } from '@prisma/client'
import { cn } from '@/lib/utils'
import type { FormFieldInput } from '@/lib/validations/form'

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  SHORT_TEXT: 'Short Text',
  LONG_TEXT: 'Long Text',
  EMAIL: 'Email',
  PHONE: 'Phone',
  NUMBER: 'Number',
  DROPDOWN: 'Dropdown',
  RADIO: 'Radio',
  CHECKBOXES: 'Checkboxes',
  DATE: 'Date',
  FILE_UPLOAD: 'File Upload',
  LOCATION: 'Location',
}

const HAS_OPTIONS: FieldType[] = ['DROPDOWN', 'RADIO', 'CHECKBOXES']
const NO_PLACEHOLDER: FieldType[] = ['DATE', 'FILE_UPLOAD', 'LOCATION', 'CHECKBOXES', 'RADIO']

interface SortableFieldCardProps {
  field: FormFieldInput & { _key: string }
  onUpdate: (updates: Partial<FormFieldInput>) => void
  onRemove: () => void
}

export function SortableFieldCard({ field, onUpdate, onRemove }: SortableFieldCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field._key,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const options = (field.options as string[] | undefined) ?? []

  const addOption = () => onUpdate({ options: [...options, `Option ${options.length + 1}`] })
  const updateOption = (i: number, val: string) => {
    const next = [...options]; next[i] = val; onUpdate({ options: next })
  }
  const removeOption = (i: number) => onUpdate({ options: options.filter((_, idx) => idx !== i) })

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'border bg-white/3 p-4 space-y-4 transition-colors',
        isDragging ? 'border-gold/60' : 'border-white/10'
      )}
    >
      {/* Card Header */}
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 text-white/20 hover:text-gold transition-colors cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={18} />
        </button>

        <div className="flex-1 min-w-0">
          {/* Type badge */}
          <span className="text-[10px] tracking-widest uppercase font-body px-2 py-0.5 bg-gold/10 text-gold/80 mb-2 inline-block">
            {FIELD_TYPE_LABELS[field.type]}
          </span>

          {/* Label */}
          <input
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="Field label"
            className="w-full bg-transparent border-b border-white/10 text-white text-sm font-body py-1 focus:border-gold focus:outline-none transition-colors placeholder:text-white/20"
          />
        </div>

        {/* Delete */}
        <button onClick={onRemove}
          className="mt-0.5 text-white/20 hover:text-red-brand transition-colors shrink-0">
          <Trash2 size={16} />
        </button>
      </div>

      {/* Placeholder */}
      {!NO_PLACEHOLDER.includes(field.type) && (
        <input
          value={field.placeholder ?? ''}
          onChange={(e) => onUpdate({ placeholder: e.target.value })}
          placeholder="Placeholder text (optional)"
          className="w-full bg-transparent border border-white/10 text-white/60 text-xs font-body px-3 py-2 focus:border-gold/50 focus:outline-none transition-colors placeholder:text-white/15"
        />
      )}

      {/* Options editor */}
      {HAS_OPTIONS.includes(field.type) && (
        <div className="space-y-2">
          <p className="text-[10px] text-white/30 font-body uppercase tracking-widest">Options</p>
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                className="flex-1 bg-transparent border border-white/10 text-white/80 text-xs font-body px-3 py-2 focus:border-gold/50 focus:outline-none transition-colors"
              />
              <button onClick={() => removeOption(i)}
                className="text-white/20 hover:text-red-brand transition-colors">
                <X size={14} />
              </button>
            </div>
          ))}
          <button onClick={addOption}
            className="flex items-center gap-1 text-xs text-gold/60 hover:text-gold font-body transition-colors">
            <Plus size={12} /> Add option
          </button>
        </div>
      )}

      {/* Required toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onUpdate({ required: !field.required })}
          className={cn(
            'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
            field.required ? 'bg-gold' : 'bg-white/10'
          )}
        >
          <span className={cn(
            'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform',
            field.required ? 'translate-x-4' : 'translate-x-0.5'
          )} />
        </button>
        <span className="text-xs text-white/40 font-body">Required</span>
      </div>
    </div>
  )
}
```

---

## TASK 14 — FieldTypePicker Component

Create `src/components/admin/forms/FieldTypePicker.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { FieldType } from '@prisma/client'
import { Plus, ChevronDown } from 'lucide-react'

const FIELD_TYPES: { type: FieldType; label: string; icon: string }[] = [
  { type: 'SHORT_TEXT', label: 'Short Text', icon: 'T' },
  { type: 'LONG_TEXT', label: 'Long Text', icon: '¶' },
  { type: 'EMAIL', label: 'Email', icon: '@' },
  { type: 'PHONE', label: 'Phone', icon: '📞' },
  { type: 'NUMBER', label: 'Number', icon: '#' },
  { type: 'DROPDOWN', label: 'Dropdown', icon: '▾' },
  { type: 'RADIO', label: 'Radio', icon: '◉' },
  { type: 'CHECKBOXES', label: 'Checkboxes', icon: '☑' },
  { type: 'DATE', label: 'Date', icon: '📅' },
  { type: 'FILE_UPLOAD', label: 'File Upload', icon: '↑' },
  { type: 'LOCATION', label: 'Location', icon: '📍' },
]

export function FieldTypePicker({ onAdd }: { onAdd: (type: FieldType) => void }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 bg-gold text-black text-sm font-body font-medium hover:bg-gold-light transition-colors"
      >
        <Plus size={14} />
        Add Field
        <ChevronDown size={14} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-52 border z-20 py-1"
            style={{ background: '#111', borderColor: 'rgba(201,168,76,0.3)' }}>
            {FIELD_TYPES.map(({ type, label, icon }) => (
              <button
                key={type}
                onClick={() => { onAdd(type); setOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-body text-white/70 hover:bg-gold/10 hover:text-white transition-colors text-left"
              >
                <span className="w-5 text-center text-gold/60 font-mono text-xs">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
```

---

## TASK 15 — Form Entries Page (Admin)

Create `src/app/admin/(dashboard)/forms/[id]/entries/page.tsx`:

```typescript
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { FormEntriesTable } from '@/components/admin/forms/FormEntriesTable'

export default async function FormEntriesPage({ params }: { params: { id: string } }) {
  const form = await db.form.findUnique({
    where: { id: params.id },
    include: {
      fields: { orderBy: { order: 'asc' } },
      submissions: {
        include: { values: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      _count: { select: { submissions: true } },
    },
  })

  if (!form) notFound()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl text-white">{form.title}</h2>
          <p className="text-white/40 text-sm font-body mt-1">
            {form._count.submissions} total submissions
          </p>
        </div>
        <a
          href={`/api/forms/${form.id}/entries/export`}
          className="px-5 py-2.5 border border-gold/50 text-gold text-sm font-body hover:bg-gold/10 transition-colors"
        >
          Export CSV
        </a>
      </div>

      <FormEntriesTable form={form} />
    </div>
  )
}
```

---

## TASK 16 — FormEntriesTable Component

Create `src/components/admin/forms/FormEntriesTable.tsx`:

Build a clean data table using `@tanstack/react-table`:
- Columns: **Submitted At** + one column per form field (in order)
- Rows: one per submission, values matched by `fieldLabel`
- Empty cells shown as `—`
- Submitted At formatted as `DD MMM YYYY, HH:mm`
- Horizontal scroll on mobile
- Black background, gold header text, white/60 body text
- Alternating row backgrounds: `#0A0A0A` and `#111111`
- No pagination needed for Phase 2 (server loads last 20)

---

## TASK 17 — Public Form Page

Create `src/app/(public)/forms/[slug]/page.tsx`:

```typescript
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { PublicFormRenderer } from '@/components/forms/PublicFormRenderer'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import type { Metadata } from 'next'

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const form = await db.form.findUnique({ where: { slug: params.slug, isActive: true } })
  return {
    title: form ? `${form.title} — Room For You` : 'Form',
    description: form?.description ?? undefined,
  }
}

export default async function PublicFormPage({ params }: { params: { slug: string } }) {
  const form = await db.form.findUnique({
    where: { slug: params.slug, isActive: true },
    include: { fields: { orderBy: { order: 'asc' } } },
  })

  if (!form) notFound()

  const { notifyEmail, ...publicForm } = form

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black pt-24 pb-16 px-6">
        <div className="max-w-2xl mx-auto">
          {/* Form Header */}
          <div className="mb-10 text-center">
            <p className="text-[10px] tracking-[0.35em] uppercase text-gold font-body mb-4">
              Room For You
            </p>
            <h1 className="font-display text-3xl lg:text-4xl text-white mb-4">
              {publicForm.title}
            </h1>
            {publicForm.description && (
              <p className="text-white/50 font-body leading-relaxed">
                {publicForm.description}
              </p>
            )}
            <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent mt-8" />
          </div>

          {/* Form */}
          <PublicFormRenderer form={publicForm} />
        </div>
      </main>
      <Footer />
    </>
  )
}
```

---

## TASK 18 — PublicFormRenderer Component

Create `src/components/forms/PublicFormRenderer.tsx`:

This is the public-facing form. It must:
- Use `react-hook-form` for state management
- Render each field based on its `type`
- Show validation errors inline beneath each field
- On submit: POST to `/api/forms/[id]/submit`
- Show a loading state during submission
- On success: replace the form with a beautiful thank-you message
- On error: show a toast and keep the form intact

**Field rendering map:**
- `SHORT_TEXT` → `<input type="text">`
- `LONG_TEXT` → `<textarea rows={4}>`
- `EMAIL` → `<input type="email">`
- `PHONE` → `<input type="tel">`
- `NUMBER` → `<input type="number">`
- `DATE` → `<input type="date">`
- `DROPDOWN` → `<select>` with options
- `RADIO` → `<div>` with radio button group
- `CHECKBOXES` → `<div>` with checkbox group
- `FILE_UPLOAD` → `<input type="file">` (stores filename for now; full Uploadthing integration in Phase 7)
- `LOCATION` → `<input type="text">` with placeholder "City, Country"

**Styling for all inputs:**
- Background: `rgba(255,255,255,0.03)`
- Border: `rgba(255,255,255,0.1)` → gold on focus
- Text: white
- Label: `text-xs uppercase tracking-widest text-white/50`
- Error text: `text-red-brand text-xs mt-1`

**Thank-you screen:**
```
— centered, full area —
[gold divider line]
"✓" in a gold circle
"Thank You" in Cormorant Garamond, large, white
A personal message: "Your response has been received. We'll be in touch soon."
"Back to Home" link in gold
[gold divider line]
```

---

## TASK 19 — Toast Provider

Update `src/app/(public)/layout.tsx` (create if not exists) and `src/app/admin/(dashboard)/layout.tsx` to include:

```typescript
import { Toaster } from 'react-hot-toast'

// Inside JSX:
<Toaster
  position="bottom-center"
  toastOptions={{
    style: {
      background: '#111',
      color: '#FAFAFA',
      border: '1px solid rgba(201,168,76,0.3)',
      fontFamily: 'var(--font-inter)',
      fontSize: '14px',
    },
    success: { iconTheme: { primary: '#C9A84C', secondary: '#0A0A0A' } },
    error: { iconTheme: { primary: '#D0021B', secondary: '#FAFAFA' } },
  }}
/>
```

---

## TASK 20 — Admin Dashboard Home

Create `src/app/admin/(dashboard)/page.tsx`:

A clean overview dashboard showing:
- Welcome heading: `"Good morning, Admin."` (dynamic greeting based on time)
- 4 stat cards: Total Forms, Total Submissions, Active Events, Published Posts
- Quick action links to each module
- Recent form submissions (last 5, across all forms)

---

## PHASE 2 COMPLETION CHECKLIST

Before moving to Phase 3, verify:

- [ ] `/admin/forms` lists all forms correctly
- [ ] `/admin/forms/new` creates a form with drag-and-drop fields
- [ ] Form slug auto-generates from title
- [ ] All 11 field types render in the builder
- [ ] Drag-and-drop reordering works
- [ ] Options editor works for Dropdown/Radio/Checkboxes
- [ ] Form can be toggled Active/Inactive
- [ ] `/forms/[slug]` renders the public form correctly
- [ ] Form submission saves to DB
- [ ] Rate limiting blocks more than 3 submissions/minute per IP
- [ ] Email notification sends on submission (test with Resend)
- [ ] `/admin/forms/[id]/entries` shows all submissions in a table
- [ ] CSV export downloads correctly
- [ ] Admin sidebar navigates correctly between all modules
- [ ] `npm run build` completes without errors

---

## NOTES FOR CURSOR

- `@dnd-kit/sortable` uses `_key` as the sortable ID — make sure every field has a unique stable `_key` that doesn't change on re-render.
- Never import `@prisma/client` enums in `'use client'` components directly — pass them as strings or use a local const map.
- The `FormEntriesTable` should handle missing values gracefully — not every submission will have every field if the form was edited after submissions came in.
- Keep all admin components as `'use client'` only where necessary. The pages themselves (`page.tsx`) should remain server components fetching data directly.
- Phase 3 will build: Blog/Devotionals, Study Portal, and Events — all using the same admin shell built in this phase.
