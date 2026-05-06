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
  dueDate: z.union([z.string().datetime(), z.literal('')]).optional(),
  order: z.number().int().min(0).default(0),
})

export type CreateSeriesInput = z.infer<typeof CreateSeriesSchema>
export type CreateMaterialInput = z.infer<typeof CreateMaterialSchema>
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>
