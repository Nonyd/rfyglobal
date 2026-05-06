import { cache } from 'react'
import { db } from '@/lib/db'
import { decrypt } from '@/lib/encryption'

export interface PaystackCredentials {
  secretKey: string
  publicKey: string
  webhookSecret: string
  monthlyPlanCode: string
  annualPlanCode: string
  isActive: boolean
  mode: 'test' | 'live'
}

export interface FlutterwaveCredentials {
  secretKey: string
  publicKey: string
  webhookSecret: string
  monthlyPlanId: string
  annualPlanId: string
  isActive: boolean
  mode: 'test' | 'live'
}

export interface PayazaCredentials {
  secretKey: string
  publicKey: string
  isActive: boolean
  mode: 'test' | 'live'
}

export interface BankTransferCredentials {
  bankName: string
  accountName: string
  accountNumber: string
  contactEmail: string
  isActive: boolean
}

export interface BrevoCredentials {
  apiKey: string
  fromEmail: string
  fromName: string
  isActive: boolean
}

export interface EbulkSMSCredentials {
  username: string
  apiKey: string
  senderId: string
  isActive: boolean
}

export interface PaymentSettings {
  minimumGiftAmount: number
}

async function fetchCredential<T>(service: string): Promise<T | null> {
  try {
    const record = await db.credential.findUnique({ where: { service } })
    if (!record) return null
    const decrypted = decrypt(record.data)
    return {
      ...(JSON.parse(decrypted) as Record<string, unknown>),
      isActive: record.isActive,
    } as T
  } catch (err) {
    console.error(`[credentials] Failed to fetch ${service}:`, err)
    return null
  }
}

export const getPaystackCredentials = cache(() => fetchCredential<PaystackCredentials>('paystack'))
export const getFlutterwaveCredentials = cache(() =>
  fetchCredential<FlutterwaveCredentials>('flutterwave')
)
export const getPayazaCredentials = cache(() => fetchCredential<PayazaCredentials>('payaza'))
export const getBankTransferCredentials = cache(() =>
  fetchCredential<BankTransferCredentials>('bankTransfer')
)
export const getBrevoCredentials = cache(() => fetchCredential<BrevoCredentials>('brevo'))
export const getEbulkSMSCredentials = cache(() => fetchCredential<EbulkSMSCredentials>('ebulksms'))
export const getPaymentSettings = cache(() => fetchCredential<PaymentSettings>('paymentSettings'))
