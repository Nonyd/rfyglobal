import { z } from 'zod'

const redirectUrlSchema = z
  .string()
  .url()
  .optional()
  .nullable()
  .or(z.literal(''))

export const CreateEventSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  city: z.string().min(1).max(100),
  venue: z.string().min(1).max(300),
  date: z.string().min(1, 'Date is required'),
  time: z.string().optional(),
  imageUrl: z.union([z.string().url(), z.literal('')]).optional(),
  isActive: z.boolean().default(true),
  registrationFeeNgn: z.number().min(0).optional().nullable(),
  registrationFeeUsd: z.number().min(0).optional().nullable(),
  redirectUrl: redirectUrlSchema,
})

export type CreateEventInput = z.infer<typeof CreateEventSchema>
