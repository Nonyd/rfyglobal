'use client'

import type { ReactNode } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  title,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  children: ReactNode
  title?: string
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      disabled={disabled}
      title={title}
      className={cn(
        'rounded px-2 py-1.5 font-mono text-sm transition-colors',
        active ? 'bg-gold/20 text-gold' : 'text-white/50 hover:bg-white/5 hover:text-white',
        disabled && 'cursor-not-allowed opacity-30'
      )}
    >
      {children}
    </button>
  )
}

function EditorToolbar({ editor }: { editor: Editor }) {
  const addImage = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      toast.loading('Uploading image…', { id: 'img-upload' })
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: base64, folder: 'blogInline', resourceType: 'image' }),
        })

        toast.dismiss('img-upload')

        if (res.ok) {
          const { url } = await res.json()
          if (!url) throw new Error('Missing image URL')
          editor.chain().focus().setImage({ src: url }).run()
          toast.success('Image inserted')
        } else {
          toast.error('Image upload failed')
        }
      } catch (err: unknown) {
        toast.dismiss('img-upload')
        toast.error(err instanceof Error ? err.message : 'Upload failed')
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
    <div
      className="flex flex-wrap items-center gap-0.5 border-b p-2"
      style={{ background: '#111', borderColor: 'rgba(201,168,76,0.15)' }}
    >
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="Bold"
      >
        B
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="Italic"
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')}
        title="Underline"
      >
        <u>U</u>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
        title="Strikethrough"
      >
        <s>S</s>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        active={editor.isActive('highlight')}
        title="Highlight"
      >
        H
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-white/10" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        H3
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-white/10" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="Bullet List"
      >
        • List
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="Ordered List"
      >
        1. List
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        title="Blockquote"
      >
        &quot;
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive('codeBlock')}
        title="Code Block"
      >
        {'</>'}
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-white/10" />

      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        active={editor.isActive({ textAlign: 'left' })}
        title="Align Left"
      >
        ←
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        active={editor.isActive({ textAlign: 'center' })}
        title="Align Center"
      >
        ↔
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        active={editor.isActive({ textAlign: 'right' })}
        title="Align Right"
      >
        →
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-white/10" />

      <ToolbarButton onClick={addLink} active={editor.isActive('link')} title="Add Link">
        Link
      </ToolbarButton>
      <ToolbarButton onClick={addImage} title="Upload Image">
        Img
      </ToolbarButton>
      <ToolbarButton onClick={addYoutube} title="Embed YouTube">
        YT
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Divider"
      >
        —
      </ToolbarButton>
    </div>
  )
}

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false },
      }),
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ inline: false }),
      Youtube.configure({ width: 640, height: 360 }),
      Placeholder.configure({ placeholder: placeholder ?? 'Start writing…' }),
      CharacterCount,
    ],
    content,
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
    editorProps: {
      attributes: {
        class:
          'prose prose-invert prose-gold max-w-none min-h-[400px] p-6 focus:outline-none',
      },
    },
  })

  if (!editor) return null

  return (
    <div
      className="border transition-colors focus-within:border-gold/50"
      style={{ borderColor: 'rgba(201,168,76,0.2)', background: '#0A0A0A' }}
    >
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
      <div
        className="flex justify-end border-t px-4 py-2 font-body text-xs text-white/20"
        style={{ borderColor: 'rgba(201,168,76,0.1)' }}
      >
        {editor.storage.characterCount.characters()} characters
      </div>
    </div>
  )
}
