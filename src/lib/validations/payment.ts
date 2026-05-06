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
