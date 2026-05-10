# ROOM FOR YOU — Phase 34b Cursor Prompt
## Live Chat Bell Notifications + Chat Bubble Position Fix

---

## CONTEXT

Two fixes:

1. **Chat bubble position** — the bubble is appearing bottom-left instead of bottom-right. Tailwind positioning classes are not applying. Fix by using inline styles for all positioning.
2. **Live chat notifications** — new live chat sessions and messages should appear in the admin notification bell, linking to `/admin/live-chat`.

---

## TASK 1 — Fix Chat Bubble Position

Open `src/components/chat/ChatWidget.tsx`.

The bubble and chat window use Tailwind `fixed bottom-6 right-6 z-50` classes that are not applying correctly. Replace ALL Tailwind positioning/layout classes on the bubble button and chat window with inline styles.

**Bubble button** — remove className positioning, use only inline style:

```typescript
<button
  onClick={() => setOpen(o => !o)}
  style={{
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 9999,
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: '#C9A84C',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    border: 'none',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
    flexShrink: 0,
  }}
  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
  aria-label="Chat with Room For You"
>
```

**Unread badge** on the bubble — use inline style:

```typescript
{!open && unread > 0 && (
  <span
    style={{
      position: 'absolute',
      top: '-4px',
      right: '-4px',
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      background: '#E53E3E',
      color: 'white',
      fontSize: '10px',
      fontWeight: 700,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '2px solid #0F0F0F',
      fontFamily: 'Arial, sans-serif',
    }}
  >
    {unread > 9 ? '9+' : unread}
  </span>
)}
```

**Chat window** — remove className positioning, use only inline style:

```typescript
<div
  style={{
    position: 'fixed',
    bottom: '96px',
    right: '24px',
    zIndex: 9998,
    width: 'min(360px, calc(100vw - 32px))',
    height: '500px',
    background: '#0F0F0F',
    border: '1px solid rgba(201,168,76,0.25)',
    borderRadius: '16px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transform: open ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.96)',
    opacity: open ? 1 : 0,
    pointerEvents: open ? 'all' : 'none',
    transition: 'transform 0.25s cubic-bezier(0.32,0.72,0,1), opacity 0.2s ease',
  }}
>
```

Also ensure the outer wrapper of the entire ChatWidget component is a React Fragment `<>` or `<div style={{ position: 'fixed', bottom: 0, right: 0, zIndex: 9999 }}>` — NOT a div with Tailwind classes that might interfere with positioning.

---

## TASK 2 — Add live_chat Notification Type

Open `src/lib/notify.ts`.

Add `live_chat` to the `NotificationType` union:

```typescript
export type NotificationType =
  | 'prayer'
  | 'testimony'
  | 'message'
  | 'member'
  | 'partner'
  | 'event_registration'
  | 'contact'
  | 'live_chat'
```

Add to `NOTIFICATION_CONFIG`:

```typescript
const NOTIFICATION_CONFIG: Record<NotificationType, { title: string; link: string }> = {
  // ... existing entries ...
  live_chat: { title: 'New Live Chat Message', link: '/admin/live-chat' },
}
```

Add to `SSE_EVENT_MAP`:

```typescript
const SSE_EVENT_MAP: Record<NotificationType, string> = {
  // ... existing entries ...
  live_chat: 'new_chat_message',
}
```

---

## TASK 3 — Trigger Notifications from Live Chat

### On new session start
Open `src/app/api/chat/session/route.ts`.

After the new session is created successfully, add:

```typescript
import { createNotification } from '@/lib/notify'

// After db.liveChatSession.create:
await createNotification(
  'live_chat',
  `${session.name} started a live chat`
)
```

### On every visitor message
Open `src/app/api/chat/[sessionToken]/route.ts`.

In the POST handler, after the message is saved to DB, add:

```typescript
import { createNotification } from '@/lib/notify'

// After db.liveChatMessage.create:
await createNotification(
  'live_chat',
  `${session.name}: "${body.trim().slice(0, 80)}${body.trim().length > 80 ? '…' : ''}"`
)
```

Note: This fires on every message, not just the first. This gives the admin real-time bell updates for every chat message — same behavior as prayer requests and testimonies.

---

## TASK 4 — Add Icon to Notification Bell

Open `src/components/admin/NotificationBell.tsx`.

Find the `TYPE_ICONS` object and add:

```typescript
const TYPE_ICONS: Record<string, string> = {
  prayer: '🙏',
  testimony: '✨',
  message: '💬',
  member: '👤',
  partner: '💛',
  event_registration: '📅',
  contact: '📩',
  live_chat: '💬',  // ← add this
}
```

---

## TASK 5 — Add live_chat to useAdminSSE Types

Open `src/hooks/useAdminSSE.ts`.

Add `new_chat_message` to the `SSEEventType` if not already present:

```typescript
type SSEEventType =
  | 'new_prayer'
  | 'new_testimony'
  | 'new_message'
  | 'new_member'
  | 'new_partner'
  | 'new_event_registration'
  | 'new_chat'
  | 'new_chat_message'
  | 'chat_reply'
  | 'notification'
```

---

## COMPLETION CHECKLIST

**Chat bubble position fix**
- [ ] Gold bubble appears at bottom-RIGHT (not bottom-left)
- [ ] Bubble is fixed position — stays visible at all scroll positions
- [ ] Chat window opens bottom-right above the bubble
- [ ] No Tailwind positioning classes on the bubble or window — all inline styles
- [ ] Bubble scales up on hover
- [ ] Unread badge appears top-right of bubble

**Live chat notifications**
- [ ] `live_chat` added to `NotificationType` union in `notify.ts`
- [ ] `live_chat` added to `NOTIFICATION_CONFIG` with link `/admin/live-chat`
- [ ] `live_chat` added to `SSE_EVENT_MAP`
- [ ] New chat session triggers `createNotification('live_chat', ...)`
- [ ] Every visitor message triggers `createNotification('live_chat', ...)`
- [ ] Bell count increments when new live chat message arrives
- [ ] Clicking notification navigates to `/admin/live-chat`
- [ ] `live_chat` icon (💬) shows in notification panel

**Build**
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- The root cause of the bubble appearing bottom-left is that Tailwind's `right-6` utility is not being applied — this can happen when the class is dynamically generated or when there's a CSS specificity conflict. Using `style={{ right: '24px' }}` directly bypasses this entirely.
- `zIndex: 9999` ensures the bubble always appears above everything including modals, navbars, and any other fixed elements.
- The `createNotification` calls in the chat routes should be wrapped in try/catch so a failed notification never breaks the chat message send.
- The `live_chat` and `message` types both use the 💬 emoji — this is intentional since they're both message-type communications. The difference is the link: `message` → `/admin/messages`, `live_chat` → `/admin/live-chat`.
