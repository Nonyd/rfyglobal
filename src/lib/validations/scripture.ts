import { z } from 'zod'

export const CreateScriptureSchema = z.object({
  reference: z.string().min(1, 'Reference is required').max(100),
  text: z.string().min(1, 'Scripture text is required').max(2000),
  translation: z.string().default('KJV'),
  audioUrl: z.union([z.string().url(), z.literal('')]).optional(),
  scheduledAt: z.union([z.string().datetime(), z.literal('')]).optional(),
  isActive: z.boolean().default(true),
  isDraft: z.boolean().default(false),
})

export const UpdateScriptureSchema = CreateScriptureSchema.partial()

export type CreateScriptureInput = z.infer<typeof CreateScriptureSchema>
export type UpdateScriptureInput = z.infer<typeof UpdateScriptureSchema>
