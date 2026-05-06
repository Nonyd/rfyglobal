# ROOM FOR YOU — Phase 12 Cursor Prompt
## Admin Dark/Light Mode Toggle + Full Contrast Fix

---

## CONTEXT

The admin dashboard needs:
1. Its own independent dark/light mode toggle (separate from the public site toggle)
2. Deep navy + gold dark mode palette
3. Warm cream light mode palette with proper contrast (current contrast is broken)
4. Preference remembered in localStorage
5. Every admin component updated to use the new theme-aware variables

---

## TASK 1 — Admin Theme CSS Variables

Open `src/app/globals.css` and replace the `.admin-layout` block with both themes:

```css
/* ── ADMIN LIGHT MODE (default) ── */
.admin-layout {
  --a-bg: #FAF7F2;
  --a-surface: #FFFFFF;
  --a-surface-raised: #FFFFFF;
  --a-sidebar: #F2EDE4;
  --a-sidebar-active: rgba(180, 130, 10, 0.1);
  --a-sidebar-hover: rgba(0, 0, 0, 0.04);
  --a-border: #E2D9CC;
  --a-border-strong: #C8BDB0;
  --a-text: #1C1814;
  --a-text-secondary: #3D3530;
  --a-text-muted: #7A6E65;
  --a-text-inverse: #FFFFFF;
  --a-gold: #B8860B;
  --a-gold-light: rgba(184, 134, 11, 0.1);
  --a-gold-border: rgba(184, 134, 11, 0.25);
  --a-gold-active: rgba(184, 134, 11, 0.12);
  --a-red: #C0392B;
  --a-green: #27AE60;
  --a-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
  --a-shadow-md: 0 4px 12px rgba(0,0,0,0.1);
}

/* ── ADMIN DARK MODE ── */
.admin-layout.admin-dark {
  --a-bg: #0D1117;
  --a-surface: #161B22;
  --a-surface-raised: #1C2333;
  --a-sidebar: #0D1117;
  --a-sidebar-active: rgba(201, 168, 76, 0.12);
  --a-sidebar-hover: rgba(255, 255, 255, 0.05);
  --a-border: #21262D;
  --a-border-strong: #30363D;
  --a-text: #E6EDF3;
  --a-text-secondary: #8B949E;
  --a-text-muted: #484F58;
  --a-text-inverse: #0D1117;
  --a-gold: #C9A84C;
  --a-gold-light: rgba(201, 168, 76, 0.1);
  --a-gold-border: rgba(201, 168, 76, 0.25);
  --a-gold-active: rgba(201, 168, 76, 0.15);
  --a-red: #F85149;
  --a-green: #3FB950;
  --a-shadow: 0 1px 3px rgba(0,0,0,0.4);
  --a-shadow-md: 0 4px 16px rgba(0,0,0,0.5);
}
```

---

## TASK 2 — Admin Theme Hook

Create `src/hooks/useAdminTheme.ts`:

```typescript
'use client'

import { useState, useEffect } from 'react'

type AdminTheme = 'light' | 'dark'

export function useAdminTheme() {
  const [theme, setTheme] = useState<AdminTheme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('rfy-admin-theme') as AdminTheme | null
    if (stored === 'dark' || stored === 'light') {
      setTheme(stored)
    } else {
      // Default to light if no preference stored
      setTheme('light')
    }
  }, [])

  const toggleTheme = () => {
    const next: AdminTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('rfy-admin-theme', next)
  }

  return { theme, toggleTheme, mounted }
}
```

---

## TASK 3 — Admin Shell with Theme Support

Update `src/app/admin/(dashboard)/layout.tsx`:

The layout needs to apply `admin-dark` class when dark mode is active. Since this is a server component, we need a client wrapper.

Create `src/components/admin/AdminThemeWrapper.tsx`:

```typescript
'use client'

import { useAdminTheme } from '@/hooks/useAdminTheme'
import { AdminDashboardShell } from './AdminDashboardShell'

export function AdminThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme, mounted } = useAdminTheme()

  if (!mounted) {
    return (
      <div className="admin-layout flex h-screen" style={{ background: 'var(--a-bg)' }}>
        {children}
      </div>
    )
  }

  return (
    <div className={`admin-layout${theme === 'dark' ? ' admin-dark' : ''} flex h-screen overflow-hidden`}
      style={{ background: 'var(--a-bg)' }}>
      <AdminDashboardShell toggleTheme={toggleTheme} theme={theme}>
        {children}
      </AdminDashboardShell>
    </div>
  )
}
```

Update `src/app/admin/(dashboard)/layout.tsx`:

```typescript
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AdminThemeWrapper } from '@/components/admin/AdminThemeWrapper'

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/admin/login')

  return <AdminThemeWrapper>{children}</AdminThemeWrapper>
}
```

---

## TASK 4 — Update AdminDashboardShell

Update `src/components/admin/AdminDashboardShell.tsx` to accept and pass theme props:

```typescript
'use client'

import { AdminSidebar } from './AdminSidebar'
import { AdminTopbar } from './AdminTopbar'
import { Toaster } from 'react-hot-toast'

interface AdminDashboardShellProps {
  children: React.ReactNode
  toggleTheme: () => void
  theme: 'light' | 'dark'
}

export function AdminDashboardShell({ children, toggleTheme, theme }: AdminDashboardShellProps) {
  return (
    <div className="flex h-full w-full overflow-hidden">
      <AdminSidebar theme={theme} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminTopbar toggleTheme={toggleTheme} theme={theme} />
        <main
          className="flex-1 overflow-y-auto p-6 lg:p-8"
          style={{ background: 'var(--a-bg)' }}
        >
          {children}
        </main>
      </div>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: 'var(--a-surface)',
            color: 'var(--a-text)',
            border: '1px solid var(--a-gold-border)',
            fontFamily: 'General Sans, sans-serif',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#C9A84C', secondary: 'var(--a-bg)' } },
          error: { iconTheme: { primary: 'var(--a-red)', secondary: '#FFFFFF' } },
        }}
      />
    </div>
  )
}
```

---

## TASK 5 — Updated AdminSidebar

Rewrite `src/components/admin/AdminSidebar.tsx` completely with proper theming:

```typescript
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, BookOpen, FileText, GraduationCap,
  Calendar, Images, ClipboardList, Settings2, Plug,
  Heart, Database, LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_GROUPS = [
  {
    label: 'OVERVIEW',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'CONTENT',
    items: [
      { label: 'Scripture', href: '/admin/scripture', icon: BookOpen },
      { label: 'Blog', href: '/admin/blog', icon: FileText },
      { label: 'Study', href: '/admin/study', icon: GraduationCap },
      { label: 'Events', href: '/admin/events', icon: Calendar },
      { label: 'Gallery', href: '/admin/gallery', icon: Images },
      { label: 'Forms', href: '/admin/forms', icon: ClipboardList },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      { label: 'Site CMS', href: '/admin/cms', icon: Settings2 },
      { label: 'Integrations', href: '/admin/integrations', icon: Plug },
      { label: 'Partnership', href: '/admin/partner', icon: Heart },
      { label: 'Demo Data', href: '/admin/demo', icon: Database },
    ],
  },
]

interface AdminSidebarProps {
  theme: 'light' | 'dark'
}

export function AdminSidebar({ theme }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className="hidden lg:flex flex-col w-64 shrink-0 border-r overflow-y-auto"
      style={{
        background: 'var(--a-sidebar)',
        borderColor: 'var(--a-border)',
      }}
    >
      {/* Logo */}
      <div className="p-5 border-b" style={{ borderColor: 'var(--a-border)' }}>
        <div className="flex items-center gap-3">
          {/* Logo mark — tries dark version first, falls back to white on dark bg */}
          <div
            className="w-9 h-9 flex items-center justify-center rounded"
            style={{ background: theme === 'dark' ? 'var(--a-gold-active)' : 'var(--a-border)' }}
          >
            <Image
              src={theme === 'dark' ? '/images/logo-white.png' : '/images/logo-mark-dark.png'}
              alt="RFY"
              width={24}
              height={24}
              className="w-5 h-5 object-contain"
              onError={(e) => {
                // Fallback if image doesn't exist
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
          <div>
            <p className="font-display text-sm font-semibold" style={{ color: 'var(--a-text)' }}>
              Room For You
            </p>
            <p className="font-body text-[10px] uppercase tracking-widest"
              style={{ color: 'var(--a-text-muted)' }}>
              Admin
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-6 pt-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p
              className="px-3 mb-1 text-[10px] font-body font-semibold tracking-[0.12em] uppercase"
              style={{ color: 'var(--a-text-muted)' }}
            >
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href)
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2.5 px-3 py-2 rounded text-sm font-body font-medium transition-all duration-150 group"
                    style={{
                      background: isActive ? 'var(--a-gold-active)' : 'transparent',
                      color: isActive ? 'var(--a-gold)' : 'var(--a-text-secondary)',
                      borderLeft: isActive ? '2px solid var(--a-gold)' : '2px solid transparent',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--a-sidebar-hover)'
                        e.currentTarget.style.color = 'var(--a-text)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'var(--a-text-secondary)'
                      }
                    }}
                  >
                    <Icon size={15} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom — user + sign out */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--a-border)' }}>
        <div className="flex items-center justify-between">
          <p className="font-body text-xs truncate flex-1 mr-2"
            style={{ color: 'var(--a-text-muted)' }}>
            admin@rfyglobal.org
          </p>
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="p-1.5 rounded transition-colors"
            title="Sign out"
            style={{ color: 'var(--a-text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--a-red)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--a-text-muted)')}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
```

---

## TASK 6 — Updated AdminTopbar with Theme Toggle

Rewrite `src/components/admin/AdminTopbar.tsx`:

```typescript
'use client'

import { usePathname } from 'next/navigation'
import { Sun, Moon } from 'lucide-react'
import Link from 'next/link'

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/scripture': 'Daily Scripture',
  '/admin/blog': 'Blog & Devotionals',
  '/admin/study': 'Study Portal',
  '/admin/events': 'Events',
  '/admin/gallery': 'Gallery',
  '/admin/forms': 'Forms',
  '/admin/cms': 'Site CMS',
  '/admin/integrations': 'Integrations',
  '/admin/partner': 'Partnership',
  '/admin/demo': 'Demo Data',
}

interface AdminTopbarProps {
  toggleTheme: () => void
  theme: 'light' | 'dark'
}

export function AdminTopbar({ toggleTheme, theme }: AdminTopbarProps) {
  const pathname = usePathname()
  const title = Object.entries(PAGE_TITLES)
    .reverse()
    .find(([key]) => pathname.startsWith(key))?.[1] ?? 'Admin'

  return (
    <header
      className="flex items-center justify-between px-6 lg:px-8 shrink-0 border-b"
      style={{
        height: '60px',
        background: 'var(--a-surface)',
        borderColor: 'var(--a-border)',
        boxShadow: 'var(--a-shadow)',
      }}
    >
      {/* Page title */}
      <h1
        className="font-display text-lg font-semibold"
        style={{ color: 'var(--a-text)' }}
      >
        {title}
      </h1>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Live site link */}
        <Link
          href="https://rfyglobal.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-2 font-body text-xs transition-colors px-3 py-1.5 rounded border"
          style={{
            color: 'var(--a-text-muted)',
            borderColor: 'var(--a-border)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'var(--a-gold)'
            e.currentTarget.style.borderColor = 'var(--a-gold-border)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--a-text-muted)'
            e.currentTarget.style.borderColor = 'var(--a-border)'
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full bg-green-500"
            style={{ boxShadow: '0 0 4px #22c55e' }}
          />
          rfyglobal.org ↗
        </Link>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded border transition-all"
          style={{
            background: 'var(--a-surface)',
            borderColor: 'var(--a-border)',
            color: 'var(--a-text-secondary)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--a-gold-border)'
            e.currentTarget.style.color = 'var(--a-gold)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--a-border)'
            e.currentTarget.style.color = 'var(--a-text-secondary)'
          }}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark'
            ? <Sun size={14} />
            : <Moon size={14} />}
        </button>

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center font-body text-xs font-bold"
          style={{
            background: 'var(--a-gold)',
            color: 'var(--a-text-inverse)',
          }}
        >
          AD
        </div>
      </div>
    </header>
  )
}
```

---

## TASK 7 — Fix All Admin Component Contrast

Update every admin component to use `--a-*` variables instead of old `--admin-*` variables. Apply this find-and-replace across all admin components:

| Old variable | New variable |
|---|---|
| `var(--admin-bg)` | `var(--a-bg)` |
| `var(--admin-surface)` | `var(--a-surface)` |
| `var(--admin-sidebar)` | `var(--a-sidebar)` |
| `var(--admin-border)` | `var(--a-border)` |
| `var(--admin-text)` | `var(--a-text)` |
| `var(--admin-text-secondary)` | `var(--a-text-secondary)` |
| `var(--admin-text-muted)` | `var(--a-text-muted)` |
| `var(--admin-gold)` | `var(--a-gold)` |
| `var(--admin-gold-light)` | `var(--a-gold-light)` |
| `var(--admin-gold-border)` | `var(--a-gold-border)` |
| `var(--admin-active-bg)` | `var(--a-gold-active)` |
| `var(--admin-hover-bg)` | `var(--a-sidebar-hover)` |

**Files to update:**
- `src/components/admin/integrations/IntegrationsManager.tsx`
- `src/components/admin/cms/CMSEditor.tsx`
- `src/components/admin/forms/FormCard.tsx`
- `src/components/admin/forms/FormBuilderEditor.tsx`
- `src/components/admin/forms/SortableFieldCard.tsx`
- `src/components/admin/forms/FieldTypePicker.tsx`
- `src/components/admin/forms/FormEntriesTable.tsx`
- `src/components/admin/blog/PostCard.tsx`
- `src/components/admin/blog/BlogPostEditor.tsx`
- `src/components/admin/scripture/ScriptureManager.tsx`
- `src/components/admin/study/StudyManager.tsx`
- `src/components/admin/gallery/GalleryManager.tsx`
- `src/components/admin/QuickActions.tsx`
- `src/components/admin/DemoDataManager.tsx`
- All admin page files under `src/app/admin/(dashboard)/`

---

## TASK 8 — Fix PostCard / Blog List Contrast

The blog post cards have broken contrast. Open `src/components/admin/blog/PostCard.tsx` and ensure:

```typescript
// Card container
<div
  className="border transition-all duration-200 p-5"
  style={{
    background: 'var(--a-surface)',
    borderColor: isPublished ? 'var(--a-gold-border)' : 'var(--a-border)',
    boxShadow: 'var(--a-shadow)',
  }}
>
  {/* Title — must be strongly visible */}
  <h3
    className="font-display text-lg font-semibold mb-1"
    style={{ color: 'var(--a-text)' }}    // ← was invisible
  >
    {post.title}
  </h3>

  {/* Excerpt */}
  <p
    className="font-body text-sm line-clamp-1 mb-2"
    style={{ color: 'var(--a-text-secondary)' }}   // ← was invisible
  >
    {post.excerpt}
  </p>

  {/* Date */}
  <p
    className="font-body text-xs"
    style={{ color: 'var(--a-text-muted)' }}
  >
    {dateText}
  </p>

  {/* Status badge */}
  <span
    className="text-[10px] px-2 py-0.5 font-body tracking-widest uppercase"
    style={{
      background: isPublished ? 'var(--a-gold-light)' : 'var(--a-sidebar-hover)',
      color: isPublished ? 'var(--a-gold)' : 'var(--a-text-muted)',
      border: `1px solid ${isPublished ? 'var(--a-gold-border)' : 'var(--a-border)'}`,
    }}
  >
    {isPublished ? 'Published' : 'Draft'}
  </span>
```

---

## TASK 9 — Admin Dashboard Home Contrast Fix

Open `src/app/admin/(dashboard)/page.tsx` and ensure all inline styles use `--a-*` variables:

```typescript
// Greeting
<h1 className="font-display text-3xl font-semibold"
  style={{ color: 'var(--a-text)' }}>

// Stat cards
<div
  className="p-5 border-l-4 rounded-sm"
  style={{
    background: 'var(--a-surface)',
    borderLeftColor: 'var(--a-gold)',
    border: `1px solid var(--a-border)`,
    borderLeftWidth: '4px',
    borderLeftColor: 'var(--a-gold)',
    boxShadow: 'var(--a-shadow)',
  }}
>
  <p className="font-body text-xs uppercase tracking-widest mb-2"
    style={{ color: 'var(--a-text-muted)' }}>
    {stat.label}
  </p>
  <p className="font-display text-3xl font-bold"
    style={{ color: 'var(--a-text)' }}>
    {stat.value}
  </p>

// Section labels
<p className="font-body text-xs uppercase tracking-[0.15em] font-semibold mb-4"
  style={{ color: 'var(--a-text-muted)' }}>

// Scripture card
<div className="p-6 rounded-sm border-l-4"
  style={{
    background: 'var(--a-surface)',
    borderLeftColor: 'var(--a-gold)',
    border: `1px solid var(--a-border)`,
  }}>
  <p className="font-display text-xl mb-2"
    style={{ color: 'var(--a-text)' }}>
  <p className="font-body text-sm italic leading-relaxed"
    style={{ color: 'var(--a-text-secondary)' }}>

// Activity items
<div className="flex items-center gap-3 p-3 rounded-sm border"
  style={{
    background: 'var(--a-surface)',
    borderColor: 'var(--a-border)',
  }}>
  <p className="font-body text-sm flex-1"
    style={{ color: 'var(--a-text)' }}>
  <p className="font-body text-xs"
    style={{ color: 'var(--a-text-muted)' }}>
```

---

## TASK 10 — Admin Login Page Theme

Update `src/app/admin/login/page.tsx` — the login page should default to light but respect system. Wrap it in the admin-layout class:

```typescript
export default function LoginPage() {
  return (
    <div
      className="admin-layout min-h-screen flex items-center justify-center px-6"
      style={{ background: 'var(--a-bg)' }}
    >
      <div
        className="w-full max-w-sm p-8 border rounded-sm"
        style={{
          background: 'var(--a-surface)',
          borderColor: 'var(--a-border)',
          boxShadow: 'var(--a-shadow-md)',
        }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div
            className="w-14 h-14 rounded flex items-center justify-center"
            style={{ background: 'var(--a-gold-light)', border: '1px solid var(--a-gold-border)' }}
          >
            <span className="font-display text-xl font-bold" style={{ color: 'var(--a-gold)' }}>
              RFY
            </span>
          </div>
        </div>

        <h1 className="font-display text-2xl font-semibold text-center mb-1"
          style={{ color: 'var(--a-text)' }}>
          Welcome back
        </h1>
        <p className="font-body text-sm text-center mb-8"
          style={{ color: 'var(--a-text-muted)' }}>
          Sign in to manage Room For You
        </p>

        {/* Form rendered by AdminLoginForm component */}
        <AdminLoginForm />
      </div>
    </div>
  )
}
```

Update `src/components/admin/AdminLoginForm.tsx` — all inputs and buttons use `--a-*` vars:

```typescript
// Input style:
style={{
  background: 'var(--a-bg)',
  borderColor: 'var(--a-border)',
  color: 'var(--a-text)',
}}
onFocus={e => (e.target.style.borderColor = 'var(--a-gold)')}
onBlur={e => (e.target.style.borderColor = 'var(--a-border)')}

// Label style:
style={{ color: 'var(--a-text-secondary)' }}

// Submit button:
style={{ background: 'var(--a-gold)', color: 'var(--a-text-inverse)' }}

// Error text:
style={{ color: 'var(--a-red)' }}
```

---

## PHASE 12 COMPLETION CHECKLIST

- [ ] `.admin-layout` and `.admin-layout.admin-dark` CSS variables defined in globals.css
- [ ] `useAdminTheme` hook created — reads/writes localStorage
- [ ] `AdminThemeWrapper` client component created
- [ ] Admin layout uses `AdminThemeWrapper`
- [ ] `AdminDashboardShell` accepts and passes `toggleTheme` + `theme` props
- [ ] `AdminSidebar` uses `--a-*` variables — fully readable in both modes
- [ ] `AdminTopbar` has working theme toggle button (sun/moon)
- [ ] Clicking theme toggle switches between light cream and deep navy
- [ ] Preference saved in localStorage — persists on refresh
- [ ] Blog post cards show visible text in both modes
- [ ] Dashboard home stat cards readable in both modes
- [ ] All admin components use `--a-*` variables (not old `--admin-*`)
- [ ] Admin login page styled correctly
- [ ] `npm run build` passes without errors

---

## NOTES FOR CURSOR

- The admin theme is **completely independent** from the public site theme (`next-themes`). The public site uses `next-themes` with a `class` on `<html>`. The admin uses its own `localStorage` key `rfy-admin-theme` and applies `admin-dark` class only to the `.admin-layout` wrapper div. They never interfere with each other.
- `suppressHydrationWarning` is NOT needed on the admin wrapper because we render a neutral state (light mode markup) on the server and apply the saved theme only after mount. The `mounted` check in `useAdminTheme` prevents hydration mismatch.
- The deep navy dark mode (`#0D1117`, `#161B22`) is inspired by GitHub's dark mode — it is proven to be easy on the eyes for long admin sessions, not harsh like pure black.
- All `--admin-*` variables from previous phases are now replaced by `--a-*`. Do a global search for `--admin-` and replace all occurrences. Any remaining `--admin-*` references will not resolve and will appear as blank/transparent.
- The sidebar nav items use `onMouseEnter/onMouseLeave` for hover — these are `'use client'` components so this is fine.
- The `PostCard` contrast fix (Task 8) is the most visible bug — post titles were nearly invisible because `--admin-text` was not applying correctly. The new `--a-text` at `#1C1814` (light) or `#E6EDF3` (dark) is strongly visible on both backgrounds.
