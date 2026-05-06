# ROOM FOR YOU — Phase 3 Cursor Prompt
## Blog / Devotionals, Study Portal & Events

---

## CONTEXT

Phases 1, 1b, and 2 are complete. The landing page, design system, security foundation, and Form Builder are all live.

Phase 3 builds three content-management modules:
1. **Blog / Devotionals** — Admin writes and publishes posts with a full Tiptap rich text editor (text formatting + image upload + video embed). Public `/blog` listing and `/blog/[slug]` single post pages.
2. **Study Portal** — Admin creates Series, uploads Materials (PDFs, docs), and creates Tasks per series. Public `/study` page is open to everyone.
3. **Events** — Admin creates events by city. Public `/events` page lists upcoming events, filterable by city.

All three modules use the admin dashboard shell built in Phase 2.

---

## INSTALL ADDITIONAL DEPENDENCIES

```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit \
  @tiptap/extension-image @tiptap/extension-link \
  @tiptap/extension-youtube @tiptap/extension-placeholder \
  @tiptap/extension-character-count @tiptap/extension-underline \
  @tiptap/extension-text-align @tiptap/extension-highlight \
  uploadthing @uploadthing/react \
  date-fns
```

---

## ═══════════════════════════════════════
## MODULE 1 — BLOG / DEVOTIONALS
## ═══════════════════════════════════════

### TASK 1 — Blog Zod Schemas

Create `src/lib/validations/blog.ts`:

```typescript
import { z } from 'zod'

export const CreatePostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(150)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1, 'Content is required'),
  coverImage: z.string().url().optional().or(z.literal('')),
  isPublished: z.boolean().default(false),
  publishedAt: z.string().datetime().optional(),
})

export const UpdatePostSchema = CreatePostSchema.partial()

export type CreatePostInput = z.infer<typeof CreatePostSchema>
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>
```

---

### TASK 2 — Blog API Routes

#### `src/app/api/blog/route.ts` — List & Create

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { CreatePostSchema } from '@/lib/validations/blog'
import { slugify } from '@/lib/utils'

export const runtime = 'nodejs'

// GET /api/blog — public listing (published only), admin gets all
export async function GET(req: NextRequest) {
  const session = await auth()
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '9')
  const skip = (page - 1) * limit

  const where = session ? {} : { isPublished: true }

  const [posts, total] = await Promise.all([
    db.post.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        isPublished: true,
        publishedAt: true,
        createdAt: true,
      },
    }),
    db.post.count({ where }),
  ])

  return NextResponse.json({ posts, total, page, totalPages: Math.ceil(total / limit) })
}

// POST /api/blog — admin create
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = CreatePostSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { slug, isPublished, ...rest } = parsed.data

  const existing = await db.post.findUnique({ where: { slug } })
  if (existing) {
    return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })
  }

  const post = await db.post.create({
    data: {
      ...rest,
      slug,
      isPublished,
      publishedAt: isPublished ? new Date() : null,
    },
  })

  return NextResponse.json(post, { status: 201 })
}
```

#### `src/app/api/blog/[id]/route.ts` — Get, Update, Delete

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { UpdatePostSchema } from '@/lib/validations/blog'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const post = await db.post.findUnique({ where: { id: params.id } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(post)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = UpdatePostSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const current = await db.post.findUnique({ where: { id: params.id } })
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Set publishedAt when first publishing
  const publishedAt =
    parsed.data.isPublished && !current.isPublished
      ? new Date()
      : current.publishedAt

  const post = await db.post.update({
    where: { id: params.id },
    data: { ...parsed.data, publishedAt },
  })

  return NextResponse.json(post)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db.post.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
```

#### `src/app/api/blog/slug/[slug]/route.ts` — Public by slug

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const post = await db.post.findUnique({
    where: { slug: params.slug, isPublished: true },
  })

  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(post)
}
```

---

### TASK 3 — Uploadthing Setup

Create `src/lib/uploadthing.ts`:

```typescript
import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { auth } from '@/lib/auth'

const f = createUploadthing()

export const rfyFileRouter = {
  // Blog cover images
  blogCoverImage: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth()
      if (!session) throw new Error('Unauthorized')
      return { userId: session.user?.email }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url }
    }),

  // Blog inline images (inserted via Tiptap)
  blogInlineImage: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth()
      if (!session) throw new Error('Unauthorized')
      return { userId: session.user?.email }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url }
    }),

  // Study materials (PDF, doc, etc.)
  studyMaterial: f({
    pdf: { maxFileSize: '16MB', maxFileCount: 1 },
    'application/msword': { maxFileSize: '16MB', maxFileCount: 1 },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
      maxFileSize: '16MB',
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const session = await auth()
      if (!session) throw new Error('Unauthorized')
      return { userId: session.user?.email }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url, name: file.name }
    }),

  // Scripture audio (MP3)
  scriptureAudio: f({ audio: { maxFileSize: '32MB', maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth()
      if (!session) throw new Error('Unauthorized')
      return { userId: session.user?.email }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url }
    }),
} satisfies FileRouter

export type RFYFileRouter = typeof rfyFileRouter
```

Create `src/app/api/uploadthing/route.ts`:

```typescript
import { createRouteHandler } from 'uploadthing/next'
import { rfyFileRouter } from '@/lib/uploadthing'

export const { GET, POST } = createRouteHandler({ router: rfyFileRouter })
```

---

### TASK 4 — Tiptap Rich Text Editor Component

Create `src/components/admin/editor/RichTextEditor.tsx`:

This is the full blog editor. It must:
- Use Tiptap with extensions: StarterKit, Image, Link, Youtube, Placeholder, CharacterCount, Underline, TextAlign, Highlight
- Have a **toolbar** above the editor with buttons for:
  - Bold, Italic, Underline, Strikethrough
  - H1, H2, H3
  - Bullet list, Ordered list
  - Blockquote, Code block
  - Align left, center, right
  - Link (prompt for URL)
  - Image upload (via Uploadthing `blogInlineImage` endpoint)
  - YouTube embed (prompt for URL)
  - Divider / horizontal rule
- The editor area: black background `#0A0A0A`, white text, min height 400px, subtle gold border on focus
- Toolbar: `#111111` background, white/60 icon buttons, gold on active state
- Character count shown bottom right of editor
- The component accepts `content: string` (HTML) and `onChange: (html: string) => void`

```typescript
'use client'

import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Youtube from '@tiptap/extension-youtube'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import { useUploadThing } from '@/lib/uploadthing-client'
import { cn } from '@/lib/utils'

// Toolbar button component
function ToolbarButton({
  onClick, active, disabled, children, title,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  children: React.ReactNode
  title?: string
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      disabled={disabled}
      title={title}
      className={cn(
        'px-2 py-1.5 text-sm font-mono transition-colors rounded',
        active ? 'bg-gold/20 text-gold' : 'text-white/50 hover:text-white hover:bg-white/5',
        disabled && 'opacity-30 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  )
}

// Toolbar
function EditorToolbar({ editor }: { editor: Editor }) {
  const { startUpload } = useUploadThing('blogInlineImage')

  const addImage = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const [res] = await startUpload([file])
      if (res?.url) {
        editor.chain().focus().setImage({ src: res.url }).run()
      }
    }
    input.click()
  }

  const addYoutube = () => {
    const url = window.prompt('Enter YouTube URL:')
    if (url) editor.commands.setYoutubeVideo({ src: url })
  }

  const addLink = () => {
    const url = window.prompt('Enter URL:')
    if (url) editor.chain().focus().setLink({ href: url }).run()
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-2 border-b"
      style={{ background: '#111', borderColor: 'rgba(201,168,76,0.15)' }}>
      {/* Text style */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')} title="Bold">B</ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')} title="Italic"><em>I</em></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')} title="Underline"><u>U</u></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')} title="Strikethrough"><s>S</s></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()}
        active={editor.isActive('highlight')} title="Highlight">H</ToolbarButton>

      <div className="w-px h-5 bg-white/10 mx-1" />

      {/* Headings */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })} title="Heading 1">H1</ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })} title="Heading 2">H2</ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })} title="Heading 3">H3</ToolbarButton>

      <div className="w-px h-5 bg-white/10 mx-1" />

      {/* Lists */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')} title="Bullet List">• List</ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')} title="Ordered List">1. List</ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')} title="Blockquote">"</ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive('codeBlock')} title="Code Block">{`</>`}</ToolbarButton>

      <div className="w-px h-5 bg-white/10 mx-1" />

      {/* Alignment */}
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()}
        active={editor.isActive({ textAlign: 'left' })} title="Align Left">←</ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()}
        active={editor.isActive({ textAlign: 'center' })} title="Align Center">↔</ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()}
        active={editor.isActive({ textAlign: 'right' })} title="Align Right">→</ToolbarButton>

      <div className="w-px h-5 bg-white/10 mx-1" />

      {/* Media */}
      <ToolbarButton onClick={addLink} active={editor.isActive('link')} title="Add Link">
        Link
      </ToolbarButton>
      <ToolbarButton onClick={addImage} title="Upload Image">Img</ToolbarButton>
      <ToolbarButton onClick={addYoutube} title="Embed YouTube">YT</ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Divider">—</ToolbarButton>
    </div>
  )
}

// Main Editor
interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: false }),
      Youtube.configure({ width: 640, height: 360 }),
      Placeholder.configure({ placeholder: placeholder ?? 'Start writing…' }),
      CharacterCount,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-gold max-w-none focus:outline-none min-h-[400px] p-6',
      },
    },
  })

  if (!editor) return null

  return (
    <div className="border focus-within:border-gold/50 transition-colors"
      style={{ borderColor: 'rgba(201,168,76,0.2)', background: '#0A0A0A' }}>
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
      <div className="flex justify-end px-4 py-2 border-t text-xs text-white/20 font-body"
        style={{ borderColor: 'rgba(201,168,76,0.1)' }}>
        {editor.storage.characterCount.characters()} characters
      </div>
    </div>
  )
}
```

Create `src/lib/uploadthing-client.ts`:

```typescript
import { generateUploadButton, generateUploadDropzone, generateReactHelpers } from '@uploadthing/react'
import type { RFYFileRouter } from './uploadthing'

export const UploadButton = generateUploadButton<RFYFileRouter>()
export const UploadDropzone = generateUploadDropzone<RFYFileRouter>()
export const { useUploadThing } = generateReactHelpers<RFYFileRouter>()
```

Add Tiptap prose styles to `globals.css`:

```css
/* Tiptap Editor Prose Styles */
.prose-gold h1, .prose-gold h2, .prose-gold h3 {
  color: #FAFAFA;
  font-family: var(--font-cormorant);
}
.prose-gold h1 { font-size: 2rem; margin-bottom: 1rem; }
.prose-gold h2 { font-size: 1.5rem; margin-bottom: 0.75rem; }
.prose-gold h3 { font-size: 1.25rem; margin-bottom: 0.5rem; }
.prose-gold p { color: rgba(250,250,250,0.8); line-height: 1.8; margin-bottom: 1rem; }
.prose-gold a { color: #C9A84C; text-decoration: underline; }
.prose-gold blockquote {
  border-left: 3px solid #C9A84C;
  padding-left: 1rem;
  color: rgba(250,250,250,0.6);
  font-style: italic;
  margin: 1.5rem 0;
}
.prose-gold code { background: rgba(255,255,255,0.08); padding: 0.2em 0.4em; border-radius: 3px; font-size: 0.875em; }
.prose-gold pre { background: #111; padding: 1rem; border-radius: 4px; overflow-x: auto; }
.prose-gold ul, .prose-gold ol { padding-left: 1.5rem; color: rgba(250,250,250,0.8); }
.prose-gold li { margin-bottom: 0.25rem; }
.prose-gold img { max-width: 100%; border-radius: 4px; margin: 1rem 0; }
.prose-gold hr { border-color: rgba(201,168,76,0.2); margin: 2rem 0; }
.prose-gold mark { background: rgba(201,168,76,0.25); color: #FAFAFA; padding: 0.1em 0.2em; }

/* Tiptap placeholder */
.tiptap p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: rgba(250,250,250,0.2);
  pointer-events: none;
  height: 0;
}
```

---

### TASK 5 — Admin Blog Page

Create `src/app/admin/(dashboard)/blog/page.tsx`:

```typescript
import Link from 'next/link'
import { db } from '@/lib/db'
import { Plus } from 'lucide-react'
import { PostCard } from '@/components/admin/blog/PostCard'

export default async function AdminBlogPage() {
  const posts = await db.post.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, title: true, slug: true,
      isPublished: true, publishedAt: true, createdAt: true, excerpt: true,
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl text-white">Blog & Devotionals</h2>
          <p className="text-white/40 text-sm font-body mt-1">{posts.length} posts total</p>
        </div>
        <Link href="/admin/blog/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-gold text-black text-sm font-body font-medium hover:bg-gold-light transition-colors">
          <Plus size={16} /> New Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-24 border border-dashed"
          style={{ borderColor: 'rgba(201,168,76,0.2)' }}>
          <p className="font-display text-2xl text-white/30 italic">No posts yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  )
}
```

---

### TASK 6 — PostCard Component

Create `src/components/admin/blog/PostCard.tsx`:

```typescript
'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Edit, Eye, Trash2, Globe, EyeOff } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface PostCardProps {
  post: {
    id: string
    title: string
    slug: string
    isPublished: boolean
    publishedAt: Date | null
    createdAt: Date
    excerpt?: string | null
  }
}

export function PostCard({ post }: PostCardProps) {
  const [isPublished, setIsPublished] = useState(post.isPublished)

  const togglePublish = async () => {
    const res = await fetch(`/api/blog/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !isPublished }),
    })
    if (res.ok) {
      setIsPublished(!isPublished)
      toast.success(isPublished ? 'Post unpublished' : 'Post published')
    } else {
      toast.error('Failed to update post')
    }
  }

  const deletePost = async () => {
    if (!confirm(`Delete "${post.title}"?`)) return
    const res = await fetch(`/api/blog/${post.id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Post deleted'); window.location.reload() }
    else toast.error('Failed to delete')
  }

  return (
    <div className={cn(
      'border p-5 transition-all',
      isPublished ? 'border-gold/25 bg-gold/3' : 'border-white/10'
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-display text-lg text-white">{post.title}</h3>
            <span className={cn(
              'text-[10px] px-2 py-0.5 font-body tracking-widest uppercase',
              isPublished ? 'bg-gold/20 text-gold' : 'bg-white/10 text-white/40'
            )}>
              {isPublished ? 'Published' : 'Draft'}
            </span>
          </div>
          {post.excerpt && (
            <p className="text-white/40 text-sm font-body mt-1 line-clamp-1">{post.excerpt}</p>
          )}
          <p className="text-white/25 text-xs font-body mt-1">
            {isPublished && post.publishedAt
              ? `Published ${formatDate(post.publishedAt)}`
              : `Created ${formatDate(post.createdAt)}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={togglePublish}
            className="p-2 text-white/40 hover:text-gold transition-colors"
            title={isPublished ? 'Unpublish' : 'Publish'}>
            {isPublished ? <Globe size={16} className="text-gold" /> : <EyeOff size={16} />}
          </button>
          <Link href={`/blog/${post.slug}`} target="_blank"
            className="p-2 text-white/40 hover:text-gold transition-colors">
            <Eye size={16} />
          </Link>
          <Link href={`/admin/blog/${post.id}/edit`}
            className="p-2 text-white/40 hover:text-white transition-colors">
            <Edit size={16} />
          </Link>
          <button onClick={deletePost}
            className="p-2 text-white/40 hover:text-red-brand transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

### TASK 7 — Blog Post Editor (Admin)

Create `src/app/admin/(dashboard)/blog/new/page.tsx`:

```typescript
import { BlogPostEditor } from '@/components/admin/blog/BlogPostEditor'
export default function NewPostPage() {
  return <BlogPostEditor mode="create" />
}
```

Create `src/app/admin/(dashboard)/blog/[id]/edit/page.tsx`:

```typescript
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { BlogPostEditor } from '@/components/admin/blog/BlogPostEditor'

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const post = await db.post.findUnique({ where: { id: params.id } })
  if (!post) notFound()
  return <BlogPostEditor mode="edit" initialData={post} />
}
```

Create `src/components/admin/blog/BlogPostEditor.tsx`:

This is a two-panel layout:

**Left panel (wider — 3/5):**
- Title input (large, display font style)
- Excerpt textarea
- `RichTextEditor` component for content

**Right panel (narrower — 2/5):**
- Slug input (auto-generated from title)
- Cover image uploader (Uploadthing `blogCoverImage` — show preview when uploaded)
- Published toggle
- Save Draft button + Publish button

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RichTextEditor } from '@/components/admin/editor/RichTextEditor'
import { UploadButton } from '@/lib/uploadthing-client'
import { slugify } from '@/lib/utils'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface BlogPostEditorProps {
  mode: 'create' | 'edit'
  initialData?: {
    id: string
    title: string
    slug: string
    excerpt?: string | null
    content: string
    coverImage?: string | null
    isPublished: boolean
  }
}

export function BlogPostEditor({ mode, initialData }: BlogPostEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [slug, setSlug] = useState(initialData?.slug ?? '')
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? '')
  const [content, setContent] = useState(initialData?.content ?? '')
  const [coverImage, setCoverImage] = useState(initialData?.coverImage ?? '')
  const [saving, setSaving] = useState(false)

  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (mode === 'create') setSlug(slugify(val))
  }

  const handleSave = async (isPublished: boolean) => {
    if (!title.trim()) { toast.error('Title is required'); return }
    if (!content || content === '<p></p>') { toast.error('Content is required'); return }

    setSaving(true)
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim() || undefined,
        content,
        coverImage: coverImage || undefined,
        isPublished,
      }

      const url = mode === 'create' ? '/api/blog' : `/api/blog/${initialData!.id}`
      const method = mode === 'create' ? 'POST' : 'PATCH'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.formErrors?.[0] ?? 'Failed to save post')
      }

      toast.success(mode === 'create' ? 'Post created!' : 'Post updated!')
      router.push('/admin/blog')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Content */}
        <div className="lg:col-span-3 space-y-5">
          {/* Title */}
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Post title…"
            className="w-full bg-transparent border-b-2 text-white font-display text-3xl pb-3 focus:outline-none transition-colors placeholder:text-white/20"
            style={{ borderColor: title ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.1)' }}
          />
          {/* Excerpt */}
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Short excerpt (shown in blog listing)…"
            rows={2}
            className="w-full bg-white/3 border border-white/10 text-white/70 px-4 py-3 text-sm font-body focus:border-gold/50 focus:outline-none transition-colors placeholder:text-white/20 resize-none"
          />
          {/* Editor */}
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Start writing your devotional…"
          />
        </div>

        {/* Right: Meta */}
        <div className="lg:col-span-2 space-y-6">
          {/* Slug */}
          <div className="border p-5 space-y-4" style={{ borderColor: 'rgba(201,168,76,0.2)' }}>
            <h3 className="font-display text-base text-white">Post Settings</h3>
            <div>
              <label className="block text-xs text-white/40 font-body uppercase tracking-widest mb-2">
                URL Slug
              </label>
              <div className="flex items-center border border-white/10 focus-within:border-gold/50 transition-colors">
                <span className="px-3 py-2.5 text-xs text-white/25 font-mono bg-white/5 border-r border-white/10">
                  /blog/
                </span>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  className="flex-1 bg-transparent text-white px-3 py-2.5 text-sm font-mono focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Cover Image */}
          <div className="border p-5 space-y-4" style={{ borderColor: 'rgba(201,168,76,0.2)' }}>
            <h3 className="font-display text-base text-white">Cover Image</h3>
            {coverImage ? (
              <div className="space-y-3">
                <Image
                  src={coverImage}
                  alt="Cover"
                  width={400}
                  height={200}
                  className="w-full h-40 object-cover"
                />
                <button
                  onClick={() => setCoverImage('')}
                  className="text-xs text-red-brand/70 hover:text-red-brand font-body transition-colors"
                >
                  Remove image
                </button>
              </div>
            ) : (
              <UploadButton
                endpoint="blogCoverImage"
                onClientUploadComplete={(res) => {
                  if (res?.[0]?.url) setCoverImage(res[0].url)
                  toast.success('Cover image uploaded')
                }}
                onUploadError={(err) => toast.error(`Upload failed: ${err.message}`)}
                appearance={{
                  button: 'bg-gold/20 text-gold border border-gold/40 hover:bg-gold/30 text-sm font-body px-4 py-2',
                  allowedContent: 'text-white/30 text-xs',
                }}
              />
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="w-full py-3 border border-gold/50 text-gold font-body text-sm hover:border-gold hover:bg-gold/5 transition-colors disabled:opacity-40"
            >
              Save as Draft
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="w-full py-3 bg-gold text-black font-body text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Publish Post'}
            </button>
            <button
              onClick={() => router.back()}
              className="w-full py-2 text-white/30 font-body text-xs hover:text-white/60 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

### TASK 8 — Public Blog Pages

#### `src/app/(public)/blog/page.tsx` — Blog Listing

```typescript
import { db } from '@/lib/db'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { formatDate } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog & Devotionals — Room For You',
  description: 'Devotionals, teachings, and reflections from Room For You.',
}

export default async function BlogPage() {
  const posts = await db.post.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true, title: true, slug: true,
      excerpt: true, coverImage: true, publishedAt: true,
    },
  })

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black pt-24 pb-16">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
          <p className="text-[10px] tracking-[0.35em] uppercase text-gold font-body mb-4">
            Room For You
          </p>
          <h1 className="font-display text-4xl lg:text-6xl text-white mb-4">
            Devotionals
          </h1>
          <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent max-w-xs mx-auto" />
        </div>

        {/* Grid */}
        <div className="max-w-7xl mx-auto px-6">
          {posts.length === 0 ? (
            <div className="text-center py-24">
              <p className="font-display text-2xl text-white/30 italic">
                Devotionals coming soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`}
                  className="group block border border-white/10 hover:border-gold/30 transition-all duration-300">
                  {post.coverImage && (
                    <div className="overflow-hidden">
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        width={600}
                        height={300}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h2 className="font-display text-xl text-white group-hover:text-gold transition-colors mb-2">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-white/50 text-sm font-body line-clamp-2 mb-4">
                        {post.excerpt}
                      </p>
                    )}
                    {post.publishedAt && (
                      <p className="text-gold/60 text-xs font-body tracking-wide">
                        {formatDate(post.publishedAt)}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
```

#### `src/app/(public)/blog/[slug]/page.tsx` — Single Post

```typescript
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { formatDate } from '@/lib/utils'
import type { Metadata } from 'next'

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const post = await db.post.findUnique({ where: { slug: params.slug, isPublished: true } })
  return {
    title: post ? `${post.title} — Room For You` : 'Post',
    description: post?.excerpt ?? undefined,
    openGraph: post?.coverImage ? { images: [post.coverImage] } : undefined,
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await db.post.findUnique({
    where: { slug: params.slug, isPublished: true },
  })

  if (!post) notFound()

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black pt-24 pb-16">
        <article className="max-w-3xl mx-auto px-6">
          {/* Back link */}
          <Link href="/blog"
            className="inline-flex items-center gap-2 text-gold/60 hover:text-gold text-sm font-body mb-10 transition-colors">
            ← Back to Devotionals
          </Link>

          {/* Header */}
          <header className="mb-10">
            {post.publishedAt && (
              <p className="text-[10px] tracking-[0.35em] uppercase text-gold/70 font-body mb-4">
                {formatDate(post.publishedAt)}
              </p>
            )}
            <h1 className="font-display text-4xl lg:text-5xl text-white leading-tight mb-4">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="text-white/50 text-lg font-body leading-relaxed">{post.excerpt}</p>
            )}
            <div className="h-px bg-gradient-to-r from-gold/40 to-transparent mt-8" />
          </header>

          {/* Cover Image */}
          {post.coverImage && (
            <Image
              src={post.coverImage}
              alt={post.title}
              width={900}
              height={450}
              className="w-full h-72 object-cover mb-10"
            />
          )}

          {/* Content */}
          <div
            className="prose prose-invert prose-gold max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Footer */}
          <div className="mt-16 pt-8 border-t text-center"
            style={{ borderColor: 'rgba(201,168,76,0.2)' }}>
            <p className="text-white/30 text-sm font-body">Room For You · rfyglobal.org</p>
            <Link href="/blog"
              className="inline-block mt-4 text-gold text-sm font-body hover:underline">
              Read more devotionals →
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
```

---

## ═══════════════════════════════════════
## MODULE 2 — STUDY PORTAL
## ═══════════════════════════════════════

### TASK 9 — Study Zod Schemas

Create `src/lib/validations/study.ts`:

```typescript
import { z } from 'zod'

export const CreateSeriesSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  order: z.number().int().min(0).default(0),
})

export const CreateMaterialSchema = z.object({
  seriesId: z.string().min(1),
  title: z.string().min(1).max(200),
  fileUrl: z.string().url(),
  fileType: z.string().min(1),
  order: z.number().int().min(0).default(0),
})

export const CreateTaskSchema = z.object({
  seriesId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  dueDate: z.string().datetime().optional(),
  order: z.number().int().min(0).default(0),
})

export type CreateSeriesInput = z.infer<typeof CreateSeriesSchema>
export type CreateMaterialInput = z.infer<typeof CreateMaterialSchema>
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>
```

---

### TASK 10 — Study API Routes

#### `src/app/api/study/series/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { CreateSeriesSchema } from '@/lib/validations/study'

export const runtime = 'nodejs'

// GET — public
export async function GET() {
  const series = await db.studySeries.findMany({
    orderBy: { order: 'asc' },
    include: {
      materials: { orderBy: { order: 'asc' } },
      tasks: { orderBy: { order: 'asc' } },
    },
  })
  return NextResponse.json(series)
}

// POST — admin
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = CreateSeriesSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const series = await db.studySeries.create({ data: parsed.data })
  return NextResponse.json(series, { status: 201 })
}
```

#### `src/app/api/study/series/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const series = await db.studySeries.update({ where: { id: params.id }, data: body })
  return NextResponse.json(series)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await db.studySeries.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
```

#### `src/app/api/study/materials/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { CreateMaterialSchema } from '@/lib/validations/study'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const parsed = CreateMaterialSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const material = await db.studyMaterial.create({ data: parsed.data })
  return NextResponse.json(material, { status: 201 })
}
```

#### `src/app/api/study/materials/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await db.studyMaterial.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
```

#### `src/app/api/study/tasks/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { CreateTaskSchema } from '@/lib/validations/study'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const parsed = CreateTaskSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const task = await db.studyTask.create({ data: parsed.data })
  return NextResponse.json(task, { status: 201 })
}
```

#### `src/app/api/study/tasks/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const task = await db.studyTask.update({ where: { id: params.id }, data: body })
  return NextResponse.json(task)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await db.studyTask.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
```

---

### TASK 11 — Admin Study Page

Create `src/app/admin/(dashboard)/study/page.tsx`:

This page manages Study Series, Materials, and Tasks in one view:

- Header with "Study Portal" title and **"New Series"** button
- List of all series, each as an expandable accordion panel showing:
  - Series title, description, order number
  - Edit and Delete buttons for the series
  - **Materials section** — list of uploaded files with download link and delete button. Plus an **"Add Material"** button that opens an upload modal using Uploadthing `studyMaterial` endpoint
  - **Tasks section** — list of tasks with title, description, optional due date. Plus an **"Add Task"** button that opens an inline form

Create `src/components/admin/study/StudyManager.tsx` as the client component that handles all study state and interactions.

The component must:
- Fetch series from `/api/study/series` on mount
- Allow creating a new series via a slide-in panel form
- Allow editing series title/description inline
- Allow uploading materials per series via Uploadthing
- Allow adding tasks per series via inline form (title, description, due date)
- Allow deleting series, materials, tasks with confirmation
- All styled consistently with the admin design system

---

### TASK 12 — Public Study Page

Create `src/app/(public)/study/page.tsx`:

```typescript
import { db } from '@/lib/db'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { formatDate } from '@/lib/utils'
import { FileText, CheckSquare, Download } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Study Portal — Room For You',
  description: 'Bible study materials, tasks, and resources from Room For You.',
}

export default async function StudyPage() {
  const series = await db.studySeries.findMany({
    orderBy: { order: 'asc' },
    include: {
      materials: { orderBy: { order: 'asc' } },
      tasks: { orderBy: { order: 'asc' } },
    },
  })

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black pt-24 pb-16">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
          <p className="text-[10px] tracking-[0.35em] uppercase text-gold font-body mb-4">
            Room For You
          </p>
          <h1 className="font-display text-4xl lg:text-6xl text-white mb-4">Study Portal</h1>
          <p className="text-white/50 font-body max-w-xl mx-auto">
            Materials, resources, and tasks to help you grow in the Word.
            Open to everyone — no account required.
          </p>
          <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent max-w-xs mx-auto mt-8" />
        </div>

        {/* Series */}
        <div className="max-w-5xl mx-auto px-6 space-y-12">
          {series.length === 0 ? (
            <div className="text-center py-24">
              <p className="font-display text-2xl text-white/30 italic">Study materials coming soon.</p>
            </div>
          ) : (
            series.map((s) => (
              <div key={s.id} className="border-l-2 border-gold/40 pl-8">
                <h2 className="font-display text-2xl lg:text-3xl text-white mb-2">{s.title}</h2>
                {s.description && (
                  <p className="text-white/50 font-body mb-6">{s.description}</p>
                )}

                {/* Materials */}
                {s.materials.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xs uppercase tracking-widest text-gold/70 font-body mb-4">
                      Materials
                    </h3>
                    <div className="space-y-2">
                      {s.materials.map((m) => (
                        <a
                          key={m.id}
                          href={m.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-4 border border-white/10 hover:border-gold/30 transition-colors group"
                        >
                          <FileText size={16} className="text-gold/60 shrink-0" />
                          <span className="text-white/80 font-body text-sm group-hover:text-white transition-colors flex-1">
                            {m.title}
                          </span>
                          <Download size={14} className="text-white/30 group-hover:text-gold transition-colors" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tasks */}
                {s.tasks.length > 0 && (
                  <div>
                    <h3 className="text-xs uppercase tracking-widest text-gold/70 font-body mb-4">
                      Tasks
                    </h3>
                    <div className="space-y-3">
                      {s.tasks.map((t) => (
                        <div key={t.id}
                          className="flex items-start gap-3 p-4 border border-white/10">
                          <CheckSquare size={16} className="text-gold/60 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-white font-body text-sm font-medium">{t.title}</p>
                            {t.description && (
                              <p className="text-white/50 font-body text-sm mt-1">{t.description}</p>
                            )}
                            {t.dueDate && (
                              <p className="text-gold/50 text-xs font-body mt-1">
                                Due: {formatDate(t.dueDate)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
```

---

## ═══════════════════════════════════════
## MODULE 3 — EVENTS
## ═══════════════════════════════════════

### TASK 13 — Events Zod Schema

Create `src/lib/validations/event.ts`:

```typescript
import { z } from 'zod'

export const CreateEventSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  city: z.string().min(1).max(100),
  venue: z.string().min(1).max(300),
  date: z.string().datetime(),
  time: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
})

export type CreateEventInput = z.infer<typeof CreateEventSchema>
```

---

### TASK 14 — Events API Routes

#### `src/app/api/events/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { CreateEventSchema } from '@/lib/validations/event'

export const runtime = 'nodejs'

// GET — public; upcoming only, sorted by date asc
export async function GET(req: NextRequest) {
  const session = await auth()
  const { searchParams } = new URL(req.url)
  const city = searchParams.get('city')

  const where: Record<string, unknown> = session
    ? {}
    : { isActive: true, date: { gte: new Date() } }

  if (city) where.city = { contains: city, mode: 'insensitive' }

  const events = await db.event.findMany({
    where,
    orderBy: { date: 'asc' },
  })

  return NextResponse.json(events)
}

// POST — admin
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = CreateEventSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const event = await db.event.create({ data: { ...parsed.data, date: new Date(parsed.data.date) } })
  return NextResponse.json(event, { status: 201 })
}
```

#### `src/app/api/events/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  if (body.date) body.date = new Date(body.date)
  const event = await db.event.update({ where: { id: params.id }, data: body })
  return NextResponse.json(event)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await db.event.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
```

---

### TASK 15 — Admin Events Page

Create `src/app/admin/(dashboard)/events/page.tsx` and `src/components/admin/events/EventsManager.tsx`.

The Events admin page must:
- Show all events (past and upcoming) in a list
- Each event card shows: title, city, venue, date/time, active badge
- **"New Event"** button opens a slide-in panel with a form:
  - Title, Description (textarea), City, Venue, Date (date input), Time (text input), Image URL, Active toggle
- Edit button on each card opens the same panel pre-filled
- Delete with confirmation
- Past events shown with reduced opacity (50%)

---

### TASK 16 — Public Events Page

Create `src/app/(public)/events/page.tsx`:

```typescript
import { db } from '@/lib/db'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { EventsClientPage } from '@/components/events/EventsClientPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Events — Room For You',
  description: 'Upcoming Room For You community meetings across cities.',
}

export default async function EventsPage() {
  const events = await db.event.findMany({
    where: { isActive: true, date: { gte: new Date() } },
    orderBy: { date: 'asc' },
  })

  // Get unique cities for filter
  const cities = [...new Set(events.map((e) => e.city))].sort()

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black pt-24 pb-16">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
          <p className="text-[10px] tracking-[0.35em] uppercase text-gold font-body mb-4">
            Room For You
          </p>
          <h1 className="font-display text-4xl lg:text-6xl text-white mb-4">Events</h1>
          <p className="text-white/50 font-body max-w-xl mx-auto">
            Monthly physical meetings across cities. Come as you are.
          </p>
          <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent max-w-xs mx-auto mt-8" />
        </div>

        <EventsClientPage events={events} cities={cities} />
      </main>
      <Footer />
    </>
  )
}
```

Create `src/components/events/EventsClientPage.tsx`:

A client component that handles city filtering:
- City filter tabs at the top: **"All"** + one button per unique city
- Active city tab styled with gold background
- Filtered events displayed as cards:
  - Event image (if available, else a matte black placeholder with gold Room For You monogram)
  - Date badge (day + month in gold, year below)
  - Title (display font, white)
  - City and Venue (white/50, small)
  - Description excerpt
  - A subtle gold "→" at the bottom right
- Cards have gold border on hover, subtle lift
- Empty state when no events in selected city: *"No upcoming events in [city] yet."*

```typescript
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { format } from 'date-fns'
import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Event {
  id: string
  title: string
  description?: string | null
  city: string
  venue: string
  date: Date
  time?: string | null
  imageUrl?: string | null
}

interface EventsClientPageProps {
  events: Event[]
  cities: string[]
}

export function EventsClientPage({ events, cities }: EventsClientPageProps) {
  const [activeCity, setActiveCity] = useState('All')

  const filtered = activeCity === 'All'
    ? events
    : events.filter((e) => e.city === activeCity)

  return (
    <div className="max-w-7xl mx-auto px-6">
      {/* City filter */}
      {cities.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-12 justify-center">
          {['All', ...cities].map((city) => (
            <button
              key={city}
              onClick={() => setActiveCity(city)}
              className={cn(
                'px-5 py-2 text-sm font-body tracking-wide transition-all duration-200',
                activeCity === city
                  ? 'bg-gold text-black'
                  : 'border border-white/20 text-white/60 hover:border-gold/40 hover:text-white'
              )}
            >
              {city}
            </button>
          ))}
        </div>
      )}

      {/* Events grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-24">
          <p className="font-display text-2xl text-white/30 italic">
            No upcoming events in {activeCity} yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((event) => (
            <div key={event.id}
              className="border border-white/10 hover:border-gold/30 transition-all duration-300 group">
              {/* Image or Placeholder */}
              <div className="h-48 overflow-hidden relative"
                style={{ background: '#111' }}>
                {event.imageUrl ? (
                  <Image
                    src={event.imageUrl}
                    alt={event.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="font-display text-4xl text-gold/20 italic">RFY</span>
                  </div>
                )}
                {/* Date badge */}
                <div className="absolute top-4 left-4 bg-black/80 border border-gold/30 px-3 py-2 text-center">
                  <p className="font-display text-2xl text-gold leading-none">
                    {format(new Date(event.date), 'dd')}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-gold/70 font-body">
                    {format(new Date(event.date), 'MMM')}
                  </p>
                </div>
              </div>

              <div className="p-6">
                <h3 className="font-display text-xl text-white group-hover:text-gold transition-colors mb-2">
                  {event.title}
                </h3>
                <div className="flex items-center gap-1 text-white/40 text-xs font-body mb-3">
                  <MapPin size={12} />
                  <span>{event.venue}, {event.city}</span>
                </div>
                {event.time && (
                  <p className="text-gold/60 text-xs font-body mb-3">{event.time}</p>
                )}
                {event.description && (
                  <p className="text-white/50 text-sm font-body line-clamp-2">{event.description}</p>
                )}
                <div className="flex justify-end mt-4">
                  <span className="text-gold/40 group-hover:text-gold transition-colors font-body text-sm">→</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## PHASE 3 COMPLETION CHECKLIST

Before moving to Phase 4, verify:

**Blog**
- [ ] Admin can create a post with the Tiptap editor
- [ ] Bold, italic, headings, lists, blockquote, code block all work
- [ ] Image can be uploaded inline via toolbar
- [ ] YouTube embed works via toolbar
- [ ] Cover image uploads and previews in the editor sidebar
- [ ] Post publishes and appears at `/blog`
- [ ] Single post renders at `/blog/[slug]` with correct content
- [ ] Draft posts are hidden from public listing

**Study**
- [ ] Admin can create a series
- [ ] Admin can upload a material PDF to a series
- [ ] Admin can add a task to a series
- [ ] `/study` shows all series with materials and tasks
- [ ] Materials are downloadable

**Events**
- [ ] Admin can create an event with city, venue, date
- [ ] Events appear at `/events` filtered by upcoming
- [ ] City filter tabs work correctly
- [ ] Past events are excluded from public page

**General**
- [ ] `npm run build` completes without errors
- [ ] No TypeScript errors
- [ ] All new pages have correct `metadata` exports

---

## NOTES FOR CURSOR

- `dangerouslySetInnerHTML` is used in the blog post page to render Tiptap HTML. This is safe here because all content is admin-authored, not user-submitted. Do NOT use `dangerouslySetInnerHTML` for any user-generated content.
- Tiptap's `useEditor` must be in a `'use client'` component. The `BlogPostEditor` and `RichTextEditor` are both client components. The page files that render them must pass initial data as props from server components — never fetch inside the editor component.
- `date-fns` is used for date formatting in the Events components — use `format()` consistently. Do not mix with `new Date().toLocaleDateString()`.
- The `EventsClientPage` receives serialized event data from the server page. Ensure `date` fields are serialized as ISO strings before passing as props (Next.js serializes Date objects automatically in server components, but confirm this works with your Next.js version).
- Uploadthing routes must be registered in `src/app/api/uploadthing/route.ts` before any upload button will work. Confirm `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID` are set in `.env.local`.
- Phase 4 will build the Partnership page and all three payment integrations (Paystack, Flutterwave, Payaza).
