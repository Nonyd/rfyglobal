# ROOM FOR YOU — Phase 25b Cursor Prompt
## Admin Dashboard Mobile Navigation

---

## CONTEXT

The admin dashboard has no navigation on mobile. The sidebar is desktop-only and disappears on small screens, leaving no way to navigate between admin pages on mobile. This phase adds a mobile hamburger menu to the admin topbar that opens a full slide-in drawer with all admin navigation links.

---

## TASK 1 — Update AdminTopbar with Mobile Hamburger

Open `src/components/admin/AdminTopbar.tsx`.

Add a hamburger button on the left side of the topbar (visible only on mobile):

```typescript
'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { AdminMobileDrawer } from './AdminMobileDrawer'
// ... existing imports

export function AdminTopbar({ session }: AdminTopbarProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  // ... existing state (notifications, theme, etc.)

  return (
    <>
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 h-14 border-b"
        style={{ background: 'var(--a-surface)', borderColor: 'var(--a-border)' }}
      >
        {/* Left side */}
        <div className="flex items-center gap-3">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileNavOpen(true)}
            className="lg:hidden flex items-center justify-center w-8 h-8 border transition-all"
            style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-secondary)' }}
            aria-label="Open navigation"
          >
            <Menu size={16} />
          </button>

          {/* Page title or breadcrumb — existing content */}
          <h1 className="font-display text-lg font-semibold" style={{ color: 'var(--a-text)' }}>
            Dashboard
          </h1>
        </div>

        {/* Right side — existing: notifications bell, theme toggle, user avatar */}
        <div className="flex items-center gap-2">
          {/* ... keep all existing right-side elements unchanged ... */}
        </div>
      </header>

      {/* Mobile nav drawer */}
      <AdminMobileDrawer
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        session={session}
      />
    </>
  )
}
```

---

## TASK 2 — Create AdminMobileDrawer Component

Create `src/components/admin/AdminMobileDrawer.tsx`:

```typescript
'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import {
  LayoutDashboard, Users, Activity, BookOpen, Calendar,
  Images, FileText, BookMarked, Handshake, MessageSquare,
  Settings, Shield, Heart, Star, HelpCircle, Megaphone,
  Puzzle, LogOut, Moon, Sun,
} from 'lucide-react'
import { useAdminTheme } from '@/hooks/useAdminTheme'
import { signOut } from 'next-auth/react'

// Copy the exact same NAV_SECTIONS structure from AdminSidebar.tsx
// so both sidebar and mobile drawer show the same links

const NAV_SECTIONS = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { label: 'Members', href: '/admin/members', icon: Users },
      { label: 'Prayer', href: '/admin/prayer', icon: Heart },
      { label: 'Messages', href: '/admin/messages', icon: MessageSquare },
      { label: 'Activity', href: '/admin/activity', icon: Activity },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'Scripture', href: '/admin/scripture', icon: BookOpen },
      { label: 'Events', href: '/admin/events', icon: Calendar },
      { label: 'Gallery', href: '/admin/gallery', icon: Images },
      { label: 'Blog', href: '/admin/blog', icon: FileText },
      { label: 'Study', href: '/admin/study', icon: BookMarked },
      { label: 'Testimonies', href: '/admin/testimonies', icon: Star },
      { label: 'Forms', href: '/admin/forms', icon: Puzzle },
      { label: 'FAQs', href: '/admin/faq', icon: HelpCircle },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Partnership', href: '/admin/partnership', icon: Handshake },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'CMS', href: '/admin/cms', icon: Megaphone },
      { label: 'Integrations', href: '/admin/integrations', icon: Settings },
      { label: 'Users', href: '/admin/users', icon: Shield },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
]

interface AdminMobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  session: any
}

export function AdminMobileDrawer({ isOpen, onClose, session }: AdminMobileDrawerProps) {
  const pathname = usePathname()
  const { theme, toggleTheme } = useAdminTheme()

  // Close on route change
  useEffect(() => { onClose() }, [pathname])

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="admin-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          />

          {/* Drawer */}
          <motion.div
            key="admin-drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 z-50 lg:hidden flex flex-col"
            style={{
              width: 'min(280px, 85vw)',
              background: 'var(--a-surface)',
              borderRight: '1px solid var(--a-border)',
            }}
          >
            {/* Drawer header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: 'var(--a-border)' }}
            >
              {/* Logo */}
              <img
                src={theme === 'dark' ? '/images/logo-white.png' : '/images/logo-dark.png'}
                alt="Room For You"
                style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
              />
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center transition-colors"
                style={{ color: 'var(--a-text-muted)' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Nav sections — scrollable */}
            <nav className="flex-1 overflow-y-auto py-3 px-3">
              {NAV_SECTIONS.map(section => (
                <div key={section.title} className="mb-4">
                  <p
                    className="px-3 mb-1 font-body text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: 'var(--a-text-muted)' }}
                  >
                    {section.title}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map(item => {
                      const active = isActive(item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center gap-3 px-3 py-2.5 font-body text-sm transition-all"
                          style={{
                            background: active ? 'var(--a-gold-light)' : 'transparent',
                            color: active ? 'var(--a-gold)' : 'var(--a-text-secondary)',
                            borderRadius: '2px',
                          }}
                        >
                          <item.icon size={15} />
                          {item.label}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Drawer footer */}
            <div
              className="px-4 py-4 border-t space-y-2"
              style={{ borderColor: 'var(--a-border)' }}
            >
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center gap-3 w-full px-3 py-2.5 font-body text-sm transition-all"
                style={{ color: 'var(--a-text-secondary)' }}
              >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>

              {/* Sign out */}
              <button
                onClick={() => signOut({ callbackUrl: '/admin/login' })}
                className="flex items-center gap-3 w-full px-3 py-2.5 font-body text-sm transition-all"
                style={{ color: 'var(--a-text-muted)' }}
              >
                <LogOut size={15} />
                Sign Out
              </button>

              {/* User info */}
              {session?.user && (
                <div className="flex items-center gap-3 px-3 py-2 mt-2 border-t"
                  style={{ borderColor: 'var(--a-border)' }}>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center font-body text-xs font-bold shrink-0"
                    style={{ background: 'var(--a-gold)', color: '#0F0F0F' }}
                  >
                    {session.user.name?.[0]?.toUpperCase() ?? 'A'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-body text-xs font-medium truncate"
                      style={{ color: 'var(--a-text)' }}>
                      {session.user.name ?? 'Admin'}
                    </p>
                    <p className="font-body text-[10px] truncate"
                      style={{ color: 'var(--a-text-muted)' }}>
                      {session.user.email}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

---

## TASK 3 — Hide Sidebar on Mobile

Open `src/components/admin/AdminSidebar.tsx`.

The sidebar should only show on desktop. Add `hidden lg:flex` to the sidebar's outer element:

```typescript
// BEFORE:
<aside className="w-64 shrink-0 flex flex-col ...">

// AFTER:
<aside className="hidden lg:flex w-64 shrink-0 flex-col ...">
```

---

## TASK 4 — Admin Layout Responsive Fix

Open `src/app/admin/(dashboard)/layout.tsx` or wherever the admin shell layout is defined.

The layout uses a flex row with sidebar + main content. On mobile, the sidebar should be hidden and the main content should take full width:

```typescript
// BEFORE:
<div className="flex h-screen overflow-hidden">
  <AdminSidebar />
  <div className="flex-1 flex flex-col overflow-hidden">
    <AdminTopbar />
    <main className="flex-1 overflow-y-auto p-6">
      {children}
    </main>
  </div>
</div>

// AFTER — main content takes full width on mobile:
<div className="flex h-screen overflow-hidden">
  <AdminSidebar /> {/* already hidden on mobile via lg:flex */}
  <div className="flex-1 flex flex-col overflow-hidden min-w-0">
    <AdminTopbar session={session} />
    <main className="flex-1 overflow-y-auto p-4 lg:p-6">
      {children}
    </main>
  </div>
</div>
```

---

## COMPLETION CHECKLIST

- [ ] Hamburger (☰) icon visible in admin topbar on mobile (below 1024px)
- [ ] Hamburger not visible on desktop (≥1024px)
- [ ] Tapping hamburger opens slide-in drawer from the LEFT
- [ ] Drawer shows all nav sections: Overview, Content, Finance, Settings
- [ ] Active page highlighted in gold
- [ ] Tapping any nav link navigates and closes the drawer
- [ ] Theme toggle in drawer footer works
- [ ] Sign Out in drawer footer works
- [ ] User name and email shown at bottom of drawer
- [ ] Desktop sidebar still shows correctly on large screens
- [ ] Admin dashboard content takes full width on mobile
- [ ] Body scroll locked while drawer is open
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- The mobile drawer slides in from the LEFT (opposite of the public site drawer which comes from the right). Left makes more sense for admin navigation since the sidebar is on the left.
- Copy the exact NAV_SECTIONS from `AdminSidebar.tsx` into `AdminMobileDrawer.tsx` so both always show the same links. If NAV_SECTIONS is already exported from the sidebar, import it instead of duplicating.
- The `useAdminTheme` hook already exists from Phase 12 — use it for the theme toggle in the drawer.
- `signOut` is from `next-auth/react` — import it at the top of the file.
- The `session` prop is passed from `AdminTopbar` down to `AdminMobileDrawer` — check how `AdminTopbar` currently receives the session and pass it through.
- If `AdminTopbar` does not currently receive `session` as a prop (it might use `useSession()` instead), use `useSession()` inside `AdminMobileDrawer` directly instead.
