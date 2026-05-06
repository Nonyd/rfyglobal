# ROOM FOR YOU — Phase 9b Cursor Prompt
## Admin Contrast Fix + Logo Mark

---

## CONTEXT

The admin dashboard cream sidebar has broken text contrast — service names and descriptions are nearly invisible. This prompt fixes all contrast issues across the entire admin and adds the logo mark.

---

## TASK 1 — Fix Admin CSS Variables

Open `src/app/globals.css` and replace the admin CSS variables with these corrected high-contrast values:

```css
.admin-layout {
  --admin-bg: #F7F3EE;
  --admin-surface: #FFFFFF;
  --admin-sidebar: #F0EAE0;
  --admin-border: #D8D0C4;
  --admin-text: #1A1714;          /* near black — strong contrast */
  --admin-text-secondary: #3D3830; /* dark brown — readable */
  --admin-text-muted: #7A7066;    /* medium — readable on cream */
  --admin-gold: #C9960A;          /* slightly deeper gold — visible on cream */
  --admin-gold-light: rgba(201,150,10,0.1);
  --admin-gold-border: rgba(201,150,10,0.3);
  --admin-active-bg: rgba(201,150,10,0.08);
  --admin-hover-bg: rgba(26,23,20,0.04);
}
```

---

## TASK 2 — Fix AdminSidebar

Open `src/components/admin/AdminSidebar.tsx` and apply these fixes:

**Logo area** — replace whatever is currently rendering the logo with:
```typescript
<div className="p-5 border-b" style={{ borderColor: 'var(--admin-border)' }}>
  <Image
    src="/images/logo-mark-dark.png"
    alt="Room For You"
    width={48}
    height={48}
    className="h-10 w-auto object-contain"
  />
</div>
```

**Group labels** — must be clearly visible:
```typescript
<p className="px-3 mb-2 text-[10px] font-body font-semibold tracking-[0.15em] uppercase"
  style={{ color: 'var(--admin-text-muted)' }}>
  {group.label}
</p>
```

**Nav items** — inactive state needs strong readable text:
```typescript
// Inactive:
style={{ color: 'var(--admin-text-secondary)' }}

// Active:
style={{
  color: 'var(--admin-gold)',
  background: 'var(--admin-active-bg)',
  borderLeft: '3px solid var(--admin-gold)',
}}

// Hover:
style={{ color: 'var(--admin-text)', background: 'var(--admin-hover-bg)' }}
```

**Bottom user area:**
```typescript
<div className="p-4 border-t" style={{ borderColor: 'var(--admin-border)' }}>
  <p className="text-xs font-body mb-3 truncate"
    style={{ color: 'var(--admin-text-secondary)' }}>
    {session?.user?.email}
  </p>
  <button
    onClick={() => signOut({ callbackUrl: '/admin/login' })}
    className="flex items-center gap-2 text-sm font-body w-full transition-colors"
    style={{ color: 'var(--admin-text-muted)' }}
    onMouseEnter={e => (e.currentTarget.style.color = '#D0021B')}
    onMouseLeave={e => (e.currentTarget.style.color = 'var(--admin-text-muted)')}
  >
    <LogOut size={14} />
    Sign Out
  </button>
</div>
```

---

## TASK 3 — Fix AdminTopbar

Open `src/components/admin/AdminTopbar.tsx`:

```typescript
<header
  className="flex items-center justify-between px-6 lg:px-8 border-b"
  style={{
    height: '64px',
    background: 'var(--admin-surface)',
    borderColor: 'var(--admin-border)',
  }}
>
  {/* Page title */}
  <h1 className="font-display text-xl font-semibold"
    style={{ color: 'var(--admin-text)' }}>
    {title}
  </h1>

  {/* Right side */}
  <div className="flex items-center gap-4">
    <a
      href="https://rfyglobal.vercel.app"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-xs font-body transition-colors"
      style={{ color: 'var(--admin-text-muted)' }}
    >
      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      rfyglobal.org
    </a>
    {/* Admin avatar */}
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-body font-bold text-white"
      style={{ background: 'var(--admin-gold)' }}
    >
      AD
    </div>
  </div>
</header>
```

---

## TASK 4 — Fix IntegrationsManager Contrast

Open `src/components/admin/integrations/IntegrationsManager.tsx`.

**Security banner:**
```typescript
<div className="flex items-start gap-3 p-4 mb-8"
  style={{
    background: 'var(--admin-gold-light)',
    border: '1px solid var(--admin-gold-border)',
  }}>
  <Shield size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--admin-gold)' }} />
  <p className="text-sm font-body" style={{ color: 'var(--admin-text-secondary)' }}>
    All credentials are encrypted with AES-256-GCM before storage.
    Keys are masked and never returned in plain text.
  </p>
</div>
```

**Service cards — fix invisible text:**
```typescript
<div
  className="border transition-all duration-200"
  style={{
    background: 'var(--admin-surface)',
    borderColor: isActive ? 'var(--admin-gold-border)' : 'var(--admin-border)',
  }}
>
  {/* Card header */}
  <div className="flex items-center justify-between p-5">
    <div className="flex items-center gap-4">
      <div className="w-3 h-3 rounded-full shrink-0"
        style={{ background: service.color }} />
      <div>
        <h3 className="font-display text-base font-semibold"
          style={{ color: 'var(--admin-text)' }}>  {/* ← was invisible */}
          {service.name}
        </h3>
        <p className="text-xs font-body mt-0.5"
          style={{ color: 'var(--admin-text-muted)' }}>  {/* ← was invisible */}
          {service.description}
        </p>
      </div>
    </div>
    {/* ... toggles */}
  </div>
</div>
```

**Expanded form fields:**
```typescript
{/* Field labels */}
<label className="block text-xs uppercase tracking-widest font-body font-medium mb-2"
  style={{ color: 'var(--admin-text-secondary)' }}>
  {field.label}
</label>

{/* Inputs */}
<input
  className="w-full border px-4 py-3 font-mono text-sm focus:outline-none transition-colors"
  style={{
    background: 'var(--admin-bg)',
    borderColor: 'var(--admin-border)',
    color: 'var(--admin-text)',
  }}
  onFocus={e => (e.target.style.borderColor = 'var(--admin-gold)')}
  onBlur={e => (e.target.style.borderColor = 'var(--admin-border)')}
/>

{/* Hint text */}
{field.hint && (
  <p className="text-xs font-body mt-1" style={{ color: 'var(--admin-text-muted)' }}>
    {field.hint}
  </p>
)}

{/* Footer note */}
<p className="text-xs font-body" style={{ color: 'var(--admin-text-muted)' }}>
  Values shown masked — type to update
</p>
```

**Save button:**
```typescript
<button
  onClick={() => saveService(service.id)}
  disabled={isSaving}
  className="flex items-center gap-2 px-5 py-2.5 text-sm font-body font-medium transition-colors disabled:opacity-40"
  style={{ background: 'var(--admin-gold)', color: 'white' }}
>
  <Save size={14} />
  {isSaving ? 'Saving…' : 'Save Credentials'}
</button>
```

---

## TASK 5 — Apply Same Contrast Fix to All Admin Components

Go through every admin component listed below and apply the same pattern:
- All headings → `style={{ color: 'var(--admin-text)' }}`
- All body text → `style={{ color: 'var(--admin-text-secondary)' }}`
- All muted/hint text → `style={{ color: 'var(--admin-text-muted)' }}`
- All borders → `style={{ borderColor: 'var(--admin-border)' }}`
- All card/panel backgrounds → `style={{ background: 'var(--admin-surface)' }}`
- All inputs → `background: 'var(--admin-bg)', color: 'var(--admin-text)', borderColor: 'var(--admin-border)'`

**Components to fix:**
- `src/components/admin/forms/FormCard.tsx`
- `src/components/admin/forms/FormBuilderEditor.tsx`
- `src/components/admin/forms/SortableFieldCard.tsx`
- `src/components/admin/forms/FieldTypePicker.tsx`
- `src/components/admin/forms/FormEntriesTable.tsx`
- `src/components/admin/blog/PostCard.tsx`
- `src/components/admin/blog/BlogPostEditor.tsx`
- `src/components/admin/editor/RichTextEditor.tsx`
- `src/components/admin/scripture/ScriptureManager.tsx`
- `src/components/admin/study/StudyManager.tsx`
- `src/components/admin/gallery/GalleryManager.tsx`
- `src/components/admin/cms/CMSEditor.tsx`
- `src/app/admin/(dashboard)/forms/page.tsx`
- `src/app/admin/(dashboard)/blog/page.tsx`
- `src/app/admin/(dashboard)/scripture/page.tsx`
- `src/app/admin/(dashboard)/study/page.tsx`
- `src/app/admin/(dashboard)/events/page.tsx`
- `src/app/admin/(dashboard)/gallery/page.tsx`
- `src/app/admin/(dashboard)/partner/page.tsx`
- All CMS section pages under `src/app/admin/(dashboard)/cms/`

---

## TASK 6 — Fix Admin Dashboard Home Contrast

Open `src/app/admin/(dashboard)/page.tsx` and ensure:

**Greeting:**
```typescript
<h1 className="font-display text-3xl font-semibold"
  style={{ color: 'var(--admin-text)' }}>
  {greeting}, Nony.
</h1>
<p className="font-body text-sm mt-1"
  style={{ color: 'var(--admin-text-muted)' }}>
  {formattedDate}
</p>
```

**Stat cards:**
```typescript
<div className="shadow-sm border-l-4"
  style={{
    background: 'var(--admin-surface)',
    borderLeftColor: 'var(--admin-gold)',
    borderTop: '1px solid var(--admin-border)',
    borderRight: '1px solid var(--admin-border)',
    borderBottom: '1px solid var(--admin-border)',
  }}>
  <p className="text-xs uppercase tracking-widest font-body font-medium mb-3"
    style={{ color: 'var(--admin-text-muted)' }}>
    {stat.label}
  </p>
  <p className="font-display text-3xl font-bold"
    style={{ color: 'var(--admin-text)' }}>
    {stat.value}
  </p>
</div>
```

**Section labels:**
```typescript
<p className="font-body text-xs uppercase tracking-[0.15em] font-semibold mb-4"
  style={{ color: 'var(--admin-text-muted)' }}>
  Quick Actions
</p>
```

**Quick action buttons:**
```typescript
<a href={action.href}
  className="px-4 py-2.5 font-body text-sm font-medium border transition-all"
  style={{
    background: 'var(--admin-surface)',
    borderColor: 'var(--admin-border)',
    color: 'var(--admin-text-secondary)',
  }}
  onMouseEnter={e => {
    e.currentTarget.style.borderColor = 'var(--admin-gold)'
    e.currentTarget.style.color = 'var(--admin-gold)'
  }}
  onMouseLeave={e => {
    e.currentTarget.style.borderColor = 'var(--admin-border)'
    e.currentTarget.style.color = 'var(--admin-text-secondary)'
  }}
>
  {action.label}
</a>
```

**Activity feed items:**
```typescript
<div className="flex items-center gap-3 p-3 border"
  style={{
    background: 'var(--admin-surface)',
    borderColor: 'var(--admin-border)',
  }}>
  <div className="w-2 h-2 rounded-full shrink-0"
    style={{ background: item.type === 'gift' ? 'var(--admin-gold)' : 'var(--admin-border)' }} />
  <p className="font-body text-sm flex-1"
    style={{ color: 'var(--admin-text)' }}>
    {item.label}
  </p>
  <p className="font-body text-xs"
    style={{ color: 'var(--admin-text-muted)' }}>
    {timeAgo}
  </p>
</div>
```

---

## TASK 7 — Admin Login Page Fix

Open `src/app/admin/login/page.tsx` and ensure it also uses admin vars:

```typescript
// The login page should be light and clean
<div className="min-h-screen flex items-center justify-center"
  style={{ background: 'var(--admin-bg)' }}>
  <div className="w-full max-w-md p-8 border shadow-sm"
    style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>

    {/* Logo mark */}
    <div className="flex justify-center mb-8">
      <Image
        src="/images/logo-mark-dark.png"
        alt="Room For You"
        width={60}
        height={60}
        className="h-14 w-auto"
      />
    </div>

    <h1 className="font-display text-2xl text-center mb-1 font-semibold"
      style={{ color: 'var(--admin-text)' }}>
      Admin Dashboard
    </h1>
    <p className="font-body text-sm text-center mb-8"
      style={{ color: 'var(--admin-text-muted)' }}>
      Sign in to manage Room For You
    </p>

    {/* Form inputs use admin input style */}
  </div>
</div>
```

---

## PHASE 9b COMPLETION CHECKLIST

- [ ] Logo mark shows at `public/images/logo-mark-dark.png`
- [ ] Admin sidebar shows logo mark (not text)
- [ ] All sidebar nav item text is clearly readable on cream background
- [ ] Group labels (OVERVIEW, CONTENT, SETTINGS) are visible
- [ ] Integrations page — all service names and descriptions clearly visible
- [ ] All admin form inputs have dark text on light background
- [ ] Stat cards on dashboard home have strong readable text
- [ ] Quick action buttons have visible text
- [ ] Activity feed items are readable
- [ ] Admin login page uses logo mark and light styling
- [ ] `npm run build` completes without errors

---

## NOTES FOR CURSOR

- The root cause of the invisible text was `--admin-text` and `--admin-text-muted` being too light for the cream background. The new values use near-black `#1A1714` for primary text and `#7A7066` for muted — both pass WCAG AA contrast ratios on the cream backgrounds.
- `--admin-gold` is slightly deeper `#C9960A` instead of `#D4A847` — the lighter gold was too low contrast on cream for text use. The deeper value is still clearly gold but readable.
- Every admin component should use `style={{ color: 'var(--admin-text)' }}` for main text — never Tailwind `text-white` or `text-black` directly in admin components.
- Place `logo-mark-dark.png` at `public/images/logo-mark-dark.png` before deploying. If it's not there the Image component will show a broken image — add a fallback text "RFY" in the same spot as a safety net.
