import { z } from 'zod'
import { FIELD_TYPE_VALUES } from '@/lib/form-field-metadata'

export const FormFieldSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, 'Label is required').max(200),
  type: z.enum(FIELD_TYPE_VALUES),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  order: z.number().int().min(0),
})

const redirectUrlSchema = z
  .string()
  .url()
  .optional()
  .nullable()
  .or(z.literal(''))

export const CreateFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  notifyEmail: z.string().email().optional().or(z.literal('')),
  redirectUrl: redirectUrlSchema,
  fields: z.array(FormFieldSchema).min(1, 'At least one field is required'),
})

export const UpdateFormSchema = CreateFormSchema.partial().extend({
  isActive: z.boolean().optional(),
})

export type CreateFormInput = z.infer<typeof CreateFormSchema>
export type UpdateFormInput = z.infer<typeof UpdateFormSchema>
export type FormFieldInput = z.infer<typeof FormFieldSchema>
