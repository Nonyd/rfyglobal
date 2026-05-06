# ROOM FOR YOU — Phase 12b Cursor Prompt
## Admin Light Mode Contrast Fix

---

## CONTEXT

Dark mode is correct — do NOT touch it.

Light mode has broken contrast across all components. Scripture text, card body text, descriptions, labels — all nearly invisible on the cream background. The fix is updating the light mode CSS variable values only.

---

## TASK 1 — Fix Light Mode CSS Variables

Open `src/app/globals.css`.

Find the `.admin-layout` block (light mode — NOT `.admin-layout.admin-dark`) and replace it entirely:

```css
.admin-layout {
  --a-bg: #F5F0E8;
  --a-surface: #FFFFFF;
  --a-surface-raised: #FFFFFF;
  --a-sidebar: #EDE7DB;
  --a-sidebar-active: rgba(139, 90, 0, 0.1);
  --a-sidebar-hover: rgba(0, 0, 0, 0.05);
  --a-border: #D4C9B8;
  --a-border-strong: #B8A898;
  --a-text: #0F0C08;
  --a-text-secondary: #2C2520;
  --a-text-muted: #5C5248;
  --a-text-inverse: #FFFFFF;
  --a-gold: #8B5A00;
  --a-gold-light: rgba(139, 90, 0, 0.08);
  --a-gold-border: rgba(139, 90, 0, 0.2);
  --a-gold-active: rgba(139, 90, 0, 0.1);
  --a-red: #9B1C1C;
  --a-green: #166534;
  --a-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
  --a-shadow-md: 0 4px 12px rgba(0,0,0,0.1);
}
```

**Do NOT change `.admin-layout.admin-dark` — leave it exactly as is.**

---

## TASK 2 — Fix ScriptureManager Light Mode

Open `src/components/admin/scripture/ScriptureManager.tsx`.

The scripture reference text and scripture body text are rendering in gold on a cream background — nearly invisible. Find every instance of text that uses gold color for the reference and change it to use `--a-text` for body content, reserving gold only for the reference heading:

```typescript
// Scripture reference — keep gold but use darker gold var
<span className="font-display text-lg font-semibold"
  style={{ color: 'var(--a-gold)' }}>
  {s.reference}
</span>

// Translation badge — use muted text not gold
<span className="text-[10px] px-2 py-0.5 font-body tracking-widest uppercase"
  style={{
    background: 'var(--a-gold-light)',
    color: 'var(--a-text-muted)',
    border: '1px solid var(--a-gold-border)',
  }}>
  {s.translation}
</span>

// Scripture preview text — MUST be clearly readable
<p className="text-white/60 text-sm font-body line-clamp-2 mb-2 italic"
  style={{ color: 'var(--a-text-secondary)' }}>  {/* ← override the text-white/60 */}
  "{s.text.slice(0, 120)}..."
</p>

// Schedule info text
<span className="text-xs font-body"
  style={{ color: 'var(--a-text-muted)' }}>
  {s.scheduledAt ? `Scheduled: ${formatDate(s.scheduledAt)}` : 'Random Pool'}
</span>
```

The core issue: `text-white/60` Tailwind class is hardcoded on the scripture preview text. In light mode this renders as nearly transparent white on white. Replace ALL `text-white/*` classes in admin components with inline `style={{ color: 'var(--a-text-secondary)' }}` or `var(--a-text-muted)`.

---

## TASK 3 — Global Find & Replace in Admin Components

Do a search across all files under `src/components/admin/` and `src/app/admin/` for these Tailwind color classes and replace them with inline styles using `--a-*` variables:

| Find (Tailwind class) | Replace with inline style |
|---|---|
| `text-white` | `style={{ color: 'var(--a-text)' }}` |
| `text-white/80` | `style={{ color: 'var(--a-text)' }}` |
| `text-white/70` | `style={{ color: 'var(--a-text-secondary)' }}` |
| `text-white/60` | `style={{ color: 'var(--a-text-secondary)' }}` |
| `text-white/50` | `style={{ color: 'var(--a-text-secondary)' }}` |
| `text-white/40` | `style={{ color: 'var(--a-text-muted)' }}` |
| `text-white/30` | `style={{ color: 'var(--a-text-muted)' }}` |
| `text-white/25` | `style={{ color: 'var(--a-text-muted)' }}` |
| `text-white/20` | `style={{ color: 'var(--a-text-muted)' }}` |
| `bg-white/5` | `style={{ background: 'var(--a-surface)' }}` |
| `bg-white/3` | `style={{ background: 'var(--a-bg)' }}` |
| `border-white/10` | `style={{ borderColor: 'var(--a-border)' }}` |
| `border-white/20` | `style={{ borderColor: 'var(--a-border)' }}` |
| `text-gold` | `style={{ color: 'var(--a-gold)' }}` |
| `text-gold/60` | `style={{ color: 'var(--a-gold)' }}` |
| `text-gold/70` | `style={{ color: 'var(--a-gold)' }}` |
| `text-gold/80` | `style={{ color: 'var(--a-gold)' }}` |
| `bg-gold/10` | `style={{ background: 'var(--a-gold-light)' }}` |
| `bg-gold/20` | `style={{ background: 'var(--a-gold-light)' }}` |
| `border-gold/20` | `style={{ borderColor: 'var(--a-gold-border)' }}` |
| `border-gold/30` | `style={{ borderColor: 'var(--a-gold-border)' }}` |

**Files to sweep:**
- `src/components/admin/scripture/ScriptureManager.tsx`
- `src/components/admin/blog/PostCard.tsx`
- `src/components/admin/blog/BlogPostEditor.tsx`
- `src/components/admin/forms/FormCard.tsx`
- `src/components/admin/forms/FormBuilderEditor.tsx`
- `src/components/admin/forms/SortableFieldCard.tsx`
- `src/components/admin/forms/FieldTypePicker.tsx`
- `src/components/admin/forms/FormEntriesTable.tsx`
- `src/components/admin/study/StudyManager.tsx`
- `src/components/admin/gallery/GalleryManager.tsx`
- `src/components/admin/cms/CMSEditor.tsx`
- `src/components/admin/integrations/IntegrationsManager.tsx`
- `src/components/admin/DemoDataManager.tsx`
- `src/app/admin/(dashboard)/events/page.tsx`
- `src/app/admin/(dashboard)/partner/page.tsx`
- All CMS section pages

---

## TASK 4 — Fix Slide-in Panels

All the slide-in panels (ScriptureManager, GalleryManager, StudyManager etc.) have a dark background hardcoded. They need to use admin vars:

Find this pattern in all slide-in panels:
```typescript
// OLD — hardcoded dark:
style={{ background: '#0A0A0A', borderLeft: '1px solid rgba(201,168,76,0.2)' }}

// NEW — theme aware:
style={{
  background: 'var(--a-surface)',
  borderLeft: '1px solid var(--a-border)',
  boxShadow: 'var(--a-shadow-md)',
}}
```

Also fix panel headings inside slide-ins:
```typescript
// Panel title
<h3 style={{ color: 'var(--a-text)' }} className="font-display text-xl font-semibold">

// Close button
<button style={{ color: 'var(--a-text-muted)' }}
  onMouseEnter={e => e.currentTarget.style.color = 'var(--a-text)'}
  onMouseLeave={e => e.currentTarget.style.color = 'var(--a-text-muted)'}>

// Divider inside panel
<div style={{ background: 'var(--a-border)' }} className="h-px" />

// All inputs inside panels
style={{
  background: 'var(--a-bg)',
  borderColor: 'var(--a-border)',
  color: 'var(--a-text)',
}}
```

---

## TASK 5 — Fix Toggle Switches

The toggle switches across admin (scripture active toggle, form active toggle etc.) render as gold on cream — barely visible. The track color needs adjustment:

```typescript
// Toggle track — inactive state
style={{
  background: isActive ? 'var(--a-gold)' : 'var(--a-border-strong)',
}}

// Toggle thumb — always white
style={{
  background: '#FFFFFF',
  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
}}
```

---

## COMPLETION CHECKLIST

- [ ] Light mode CSS variables updated — `--a-text` is `#0F0C08`, `--a-text-secondary` is `#2C2520`
- [ ] Dark mode CSS variables unchanged
- [ ] ScriptureManager — scripture text visible in light mode
- [ ] All `text-white/*` Tailwind classes replaced with `--a-*` inline styles in admin
- [ ] All `bg-white/*` classes replaced in admin
- [ ] All `border-white/*` classes replaced in admin
- [ ] Slide-in panels use `var(--a-surface)` background
- [ ] Toggle switches visible in light mode
- [ ] Every page in admin has readable text in light mode
- [ ] Dark mode still looks correct — no regressions
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- **Do NOT touch `.admin-layout.admin-dark`** — it is correct and approved.
- The root cause of the light mode issue: components were built with dark mode hardcoded (`text-white/60`, `bg-white/5`, `border-white/10`). These classes render as semi-transparent white — invisible on a light background. Every such class in an admin component must become an inline style with `--a-*` variables.
- `--a-gold` in light mode is `#8B5A00` — a deep amber/brown that reads clearly on cream. This is different from dark mode gold `#C9A84C`. Both are stored in `--a-gold` but resolve differently based on which theme class is active.
- When replacing `text-white/60` with inline style, remove the Tailwind class entirely and add `style={{ color: 'var(--a-text-secondary)' }}`. Do not keep both — the Tailwind class will win due to specificity.
