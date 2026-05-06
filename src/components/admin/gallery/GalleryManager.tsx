'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { Plus, Edit, Trash2, X, Images } from 'lucide-react'
import { UploadZone } from '@/components/shared/UploadZone'
import { formatDate, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { GalleryImage } from '@prisma/client'

interface GalleryManagerProps {
  initialImages: GalleryImage[]
}

interface UploadedFile {
  name: string
  url: string
}

export function GalleryManager({ initialImages }: GalleryManagerProps) {
  const [images, setImages] = useState(initialImages)
  const [uploadPanelOpen, setUploadPanelOpen] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [eventName, setEventName] = useState('')
  const [city, setCity] = useState('')
  const [takenAt, setTakenAt] = useState('')
  const [caption, setCaption] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null)

  const handleSaveBatch = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('No images uploaded yet')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: uploadedFiles.map((f) => ({
            url: f.url,
            eventName: eventName.trim() || null,
            city: city.trim() || null,
            takenAt: takenAt || null,
            caption: caption.trim() || null,
          })),
        }),
      })
      if (!res.ok) throw new Error('Failed to save')

      const refreshed = (await fetch('/api/gallery').then((r) => r.json())) as GalleryImage[]
      setImages(refreshed)
      toast.success(
        `${uploadedFiles.length} photo${uploadedFiles.length > 1 ? 's' : ''} added to gallery`,
      )
      setUploadPanelOpen(false)
      setUploadedFiles([])
      setEventName('')
      setCity('')
      setTakenAt('')
      setCaption('')
    } catch {
      toast.error('Failed to save photos')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this photo?')) return
    const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setImages((prev) => prev.filter((i) => i.id !== id))
      toast.success('Photo deleted')
    } else {
      toast.error('Failed to delete')
    }
  }

  const handleUpdateImage = async (id: string, data: Partial<GalleryImage>) => {
    const res = await fetch(`/api/gallery/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const updated = (await res.json()) as GalleryImage
      setImages((prev) => prev.map((i) => (i.id === id ? updated : i)))
      toast.success('Photo updated')
      setEditingImage(null)
    } else {
      toast.error('Failed to update')
    }
  }

  return (
    <div className="relative">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--a-text)' }}>
            Gallery
          </h2>
          <p className="mt-1 font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
            {images.length} photo{images.length !== 1 ? 's' : ''} · Past Room For You events
          </p>
        </div>
        <button
          type="button"
          onClick={() => setUploadPanelOpen(true)}
          className="flex items-center gap-2 bg-gold px-5 py-2.5 font-body text-sm font-medium text-black transition-colors hover:bg-gold-light"
        >
          <Plus size={16} /> Upload Photos
        </button>
      </div>

      {images.length === 0 ? (
        <div
          className="border border-dashed py-24 text-center"
          style={{ borderColor: 'rgba(201,168,76,0.2)' }}
        >
          <Images size={32} className="mx-auto mb-4" style={{ color: 'var(--a-text-muted)' }} />
          <p className="font-display text-2xl italic" style={{ color: 'var(--a-text-muted)' }}>
            No photos yet
          </p>
          <p className="mt-2 font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
            Upload your first batch of event photos
          </p>
        </div>
      ) : (
        <div className="columns-1 gap-4 space-y-4 md:columns-2 lg:columns-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative break-inside-avoid overflow-hidden border border-white/10"
            >
              <Image
                src={img.url}
                alt={img.caption ?? img.eventName ?? 'Room For You event'}
                width={600}
                height={400}
                className={cn(
                  'h-auto w-full object-cover transition-transform duration-500 group-hover:scale-105',
                  !img.isActive && 'opacity-40',
                )}
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-black/70 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {img.eventName ? (
                  <p className="font-display text-sm text-white">{img.eventName}</p>
                ) : null}
                {img.city ? <p className="font-body text-xs text-gold/70">{img.city}</p> : null}
                {img.takenAt ? (
                  <p className="font-body text-xs text-white/40">{formatDate(img.takenAt)}</p>
                ) : null}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingImage(img)}
                    className="bg-white/10 p-2 text-white transition-colors hover:bg-gold/20 hover:text-gold"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(img.id)}
                    className="bg-white/10 p-2 text-white transition-colors hover:bg-red-brand/20 hover:text-red-brand"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void handleUpdateImage(img.id, { isActive: !img.isActive })
                    }
                    className={cn(
                      'px-3 py-1.5 font-body text-[10px] uppercase tracking-widest transition-colors',
                      img.isActive
                        ? 'bg-gold/20 text-gold hover:bg-red-brand/20 hover:text-red-brand'
                        : 'bg-white/10 text-white/40 hover:bg-gold/20 hover:text-gold',
                    )}
                  >
                    {img.isActive ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {uploadPanelOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setUploadPanelOpen(false)}
              className="fixed inset-0 z-40 bg-black/70"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 right-0 top-0 z-50 w-full max-w-lg overflow-y-auto"
              style={{
                background: 'var(--a-surface)',
                borderLeft: '1px solid var(--a-border)',
              }}
            >
              <div className="space-y-6 p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-xl font-semibold" style={{ color: 'var(--a-text)' }}>
                      Upload Photos
                    </h3>
                    <p className="mt-0.5 font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>
                      Add images to the gallery
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadPanelOpen(false)}
                    className="transition-colors"
                    style={{ color: 'var(--a-text-muted)' }}
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="h-px" style={{ background: 'rgba(201,168,76,0.15)' }} />

                <UploadZone
                  folder="gallery"
                  accept="image"
                  maxFiles={20}
                  preview
                  label="Drop up to 20 photos here, or click to browse"
                  onUploadComplete={(files) => {
                    setUploadedFiles(files)
                    toast.success(
                      `${files.length} photo${files.length > 1 ? 's' : ''} uploaded — now add details below`,
                    )
                  }}
                  onUploadError={(err) => toast.error(`Upload failed: ${err.message}`)}
                />

                {uploadedFiles.length > 0 ? (
                  <div className="space-y-4 pt-2">
                    <p className="font-body text-xs uppercase tracking-widest text-gold/70">
                      Event Details (applied to all {uploadedFiles.length} photos)
                    </p>

                    <div>
                      <label
                        className="mb-2 block font-body text-xs uppercase tracking-widest"
                        style={{ color: 'var(--a-text-secondary)' }}
                      >
                        Event Name
                      </label>
                      <input
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        placeholder="e.g. Abuja Monthly Meeting"
                        className="w-full border px-4 py-3 font-body text-sm transition-colors focus:border-gold focus:outline-none"
                        style={{
                          background: 'var(--a-bg)',
                          borderColor: 'var(--a-border)',
                          color: 'var(--a-text)',
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          className="mb-2 block font-body text-xs uppercase tracking-widest"
                          style={{ color: 'var(--a-text-secondary)' }}
                        >
                          City
                        </label>
                        <input
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g. Abuja"
                          className="w-full border px-4 py-3 font-body text-sm transition-colors focus:border-gold focus:outline-none"
                          style={{
                            background: 'var(--a-bg)',
                            borderColor: 'var(--a-border)',
                            color: 'var(--a-text)',
                          }}
                        />
                      </div>
                      <div>
                        <label
                          className="mb-2 block font-body text-xs uppercase tracking-widest"
                          style={{ color: 'var(--a-text-secondary)' }}
                        >
                          Date Taken
                        </label>
                        <input
                          type="date"
                          value={takenAt}
                          onChange={(e) => setTakenAt(e.target.value)}
                          className="w-full border px-4 py-3 font-body text-sm transition-colors focus:border-gold focus:outline-none"
                          style={{
                            background: 'var(--a-bg)',
                            borderColor: 'var(--a-border)',
                            color: 'var(--a-text)',
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        className="mb-2 block font-body text-xs uppercase tracking-widest"
                        style={{ color: 'var(--a-text-secondary)' }}
                      >
                        Caption (optional)
                      </label>
                      <input
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="A short caption for these photos"
                        className="w-full border px-4 py-3 font-body text-sm transition-colors focus:border-gold focus:outline-none"
                        style={{
                          background: 'var(--a-bg)',
                          borderColor: 'var(--a-border)',
                          color: 'var(--a-text)',
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleSaveBatch()}
                      disabled={saving}
                      className="w-full bg-gold py-3 font-body text-sm font-medium uppercase tracking-widest text-black transition-colors hover:bg-gold-light disabled:opacity-40"
                    >
                      {saving
                        ? 'Saving…'
                        : `Save ${uploadedFiles.length} Photo${uploadedFiles.length > 1 ? 's' : ''} to Gallery`}
                    </button>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {editingImage ? (
          <EditImagePanel
            image={editingImage}
            onSave={(data) => void handleUpdateImage(editingImage.id, data)}
            onClose={() => setEditingImage(null)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function EditImagePanel({
  image,
  onSave,
  onClose,
}: {
  image: GalleryImage
  onSave: (data: Partial<GalleryImage>) => void
  onClose: () => void
}) {
  const [caption, setCaption] = useState(image.caption ?? '')
  const [eventName, setEventName] = useState(image.eventName ?? '')
  const [city, setCity] = useState(image.city ?? '')
  const [takenAt, setTakenAt] = useState(
    image.takenAt ? new Date(image.takenAt).toISOString().split('T')[0] : '',
  )
  const [isActive, setIsActive] = useState(image.isActive)

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/70"
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 right-0 top-0 z-50 w-full max-w-md overflow-y-auto"
        style={{
          background: 'var(--a-surface)',
          borderLeft: '1px solid var(--a-border)',
        }}
      >
        <div className="space-y-6 p-8">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold" style={{ color: 'var(--a-text)' }}>
              Edit Photo
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="transition-colors"
              style={{ color: 'var(--a-text-muted)' }}
            >
              <X size={20} />
            </button>
          </div>
          <Image
            src={image.url}
            alt=""
            width={400}
            height={300}
            className="h-48 w-full object-cover"
            sizes="400px"
          />
          {[
            {
              label: 'Event Name',
              value: eventName,
              set: setEventName,
              placeholder: 'e.g. Abuja Monthly Meeting',
            },
            { label: 'City', value: city, set: setCity, placeholder: 'e.g. Abuja' },
            {
              label: 'Caption',
              value: caption,
              set: setCaption,
              placeholder: 'Optional caption',
            },
          ].map((field) => (
            <div key={field.label}>
              <label
                className="mb-2 block font-body text-xs uppercase tracking-widest"
                style={{ color: 'var(--a-text-secondary)' }}
              >
                {field.label}
              </label>
              <input
                value={field.value}
                onChange={(e) => field.set(e.target.value)}
                placeholder={field.placeholder}
                className="w-full border px-4 py-3 font-body text-sm transition-colors focus:border-gold focus:outline-none"
                style={{
                  background: 'var(--a-bg)',
                  borderColor: 'var(--a-border)',
                  color: 'var(--a-text)',
                }}
              />
            </div>
          ))}
          <div>
            <label
              className="mb-2 block font-body text-xs uppercase tracking-widest"
              style={{ color: 'var(--a-text-secondary)' }}
            >
              Date Taken
            </label>
            <input
              type="date"
              value={takenAt}
              onChange={(e) => setTakenAt(e.target.value)}
              className="w-full border px-4 py-3 font-body text-sm transition-colors focus:border-gold focus:outline-none"
              style={{
                background: 'var(--a-bg)',
                borderColor: 'var(--a-border)',
                color: 'var(--a-text)',
              }}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={cn(
                'relative h-5 w-10 rounded-full transition-colors',
                isActive ? 'bg-gold' : 'bg-white/10',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform',
                  isActive ? 'translate-x-5' : 'translate-x-0.5',
                )}
              />
            </button>
            <span className="font-body text-sm" style={{ color: 'var(--a-text-secondary)' }}>
              {isActive ? 'Visible' : 'Hidden'}
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              onSave({
                caption: caption.trim() || null,
                eventName: eventName.trim() || null,
                city: city.trim() || null,
                takenAt: takenAt ? new Date(takenAt) : null,
                isActive,
              })
            }
            className="w-full bg-gold py-3 font-body text-sm font-medium uppercase tracking-widest text-black transition-colors hover:bg-gold-light"
          >
            Save Changes
          </button>
        </div>
      </motion.div>
    </>
  )
}
