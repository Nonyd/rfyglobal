import { z } from 'zod'

export const CreateEventSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  city: z.string().min(1).max(100),
  venue: z.string().min(1).max(300),
  date: z.string().min(1, 'Date is required'),
  time: z.string().optional(),
  imageUrl: z.union([z.string().url(), z.literal('')]).optional(),
  isActive: z.boolean().default(true),
})

export type CreateEventInput = z.infer<typeof CreateEventSchema>
