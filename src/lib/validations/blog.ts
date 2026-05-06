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
  coverImage: z.union([z.string().url(), z.literal('')]).optional(),
  isPublished: z.boolean().default(false),
})

export const UpdatePostSchema = CreatePostSchema.partial()

export type CreatePostInput = z.infer<typeof CreatePostSchema>
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>
