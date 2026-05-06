import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { auth } from '@/lib/auth'

const f = createUploadthing()

export const rfyFileRouter = {
  blogCoverImage: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth()
      if (!session) throw new Error('Unauthorized')
      return { userId: session.user?.email }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url }
    }),

  blogInlineImage: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth()
      if (!session) throw new Error('Unauthorized')
      return { userId: session.user?.email }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url }
    }),

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

  scriptureAudio: f({ audio: { maxFileSize: '32MB', maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth()
      if (!session) throw new Error('Unauthorized')
      return { userId: session.user?.email }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url }
    }),

  galleryImages: f({
    image: { maxFileSize: '8MB', maxFileCount: 20 },
  })
    .middleware(async () => {
      const session = await auth()
      if (!session) throw new Error('Unauthorized')
      return { userId: session.user?.email }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url, name: file.name }
    }),

  cmsImage: f({ image: { maxFileSize: '8MB', maxFileCount: 1 } })
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
