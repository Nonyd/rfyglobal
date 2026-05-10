import { z } from 'zod'

export const InitiatePaymentSchema = z.object({
  amount: z.number().min(100, 'Minimum gift is ₦100'),
  currency: z.string().default('NGN'),
  donorName: z.string().min(1, 'Name is required').max(200),
  donorEmail: z.string().email('Valid email required'),
  gateway: z.enum(['PAYSTACK', 'FLUTTERWAVE', 'PAYAZA']),
  frequency: z.enum(['ONE_TIME', 'MONTHLY', 'ANNUAL']),
  planCode: z.string().optional(),
})

export type InitiatePaymentInput = z.infer<typeof InitiatePaymentSchema>

/** Paystack checkout from partner/events — amounts in smallest unit (kobo / cents). */
export const PhasePaystackInitiateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200),
  amount: z.number().int().positive(),
  currency: z.enum(['NGN', 'USD']),
  frequency: z.enum(['one_time', 'monthly', 'annual']).default('one_time'),
  type: z.enum(['partnership', 'event']),
  eventId: z.string().optional(),
  draftId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  callbackUrl: z.string().url().optional(),
})

export type PhasePaystackInitiateInput = z.infer<typeof PhasePaystackInitiateSchema>
