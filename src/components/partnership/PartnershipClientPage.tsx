'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import type { LucideIcon } from 'lucide-react'
import { BookOpen, Check, Copy, Globe, Landmark } from 'lucide-react'
import { cn } from '@/lib/utils'

type Frequency = 'ONE_TIME' | 'MONTHLY' | 'ANNUAL'
type Gateway = 'PAYSTACK' | 'FLUTTERWAVE' | 'PAYAZA'
type GatewayFlags = { paystack: boolean; flutterwave: boolean; payaza: boolean }
type BankDetails = {
  bankName?: string
  accountName?: string
  accountNumber?: string
  contactEmail?: string
} | null

const PRESET_AMOUNTS = [1000, 2500, 5000, 10000, 25000, 50000]

const GATEWAYS: {
  id: Gateway
  name: string
  description: string
  supportsRecurring: boolean
}[] = [
  {
    id: 'PAYSTACK',
    name: 'Paystack',
    description: 'Cards, bank transfer, USSD',
    supportsRecurring: true,
  },
  {
    id: 'FLUTTERWAVE',
    name: 'Flutterwave',
    description: 'Cards, mobile money, bank',
    supportsRecurring: true,
  },
  {
    id: 'PAYAZA',
    name: 'Payaza',
    description: 'One-time payments only',
    supportsRecurring: false,
  },
]

function firstApiError(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Failed to initialize payment'
  const e = error as { formErrors?: string[]; fieldErrors?: Record<string, string[]> }
  if (e.formErrors?.length) return e.formErrors[0]
  const firstField = Object.values(e.fieldErrors ?? {})[0]
  if (firstField?.length) return firstField[0]
  return 'Failed to initialize payment'
}

export function PartnershipClientPage({
  content,
  gateways,
  bankDetails,
  minimumAmount,
  isTestMode,
}: {
  content: Record<string, string>
  gateways: GatewayFlags
  bankDetails: BankDetails
  minimumAmount: number
  isTestMode: boolean
}) {
  const enabledGateways = GATEWAYS.filter((gw) =>
    gw.id === 'PAYSTACK' ? gateways.paystack : gw.id === 'FLUTTERWAVE' ? gateways.flutterwave : gateways.payaza
  )
  const [frequency, setFrequency] = useState<Frequency>('ONE_TIME')
  const [amount, setAmount] = useState<number>(5000)
  const [customAmount, setCustomAmount] = useState('')
  const [donorName, setDonorName] = useState('')
  const [donorEmail, setDonorEmail] = useState('')
  const [gateway, setGateway] = useState<Gateway>((enabledGateways[0]?.id ?? 'PAYSTACK') as Gateway)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const activeAmount = customAmount ? parseInt(customAmount, 10) : amount

  const handleGive = async () => {
    if (!donorName.trim()) {
      toast.error('Please enter your name')
      return
    }
    if (!donorEmail.trim()) {
      toast.error('Please enter your email')
      return
    }
    if (!activeAmount || Number.isNaN(activeAmount) || activeAmount < minimumAmount) {
      toast.error(`Minimum gift is ₦${minimumAmount.toLocaleString()}`)
      return
    }
    if (enabledGateways.length === 0) {
      toast.error('Online giving is currently unavailable')
      return
    }
    if (gateway === 'PAYAZA' && frequency !== 'ONE_TIME') {
      toast.error(
        'Payaza supports one-time gifts only. Please select Paystack or Flutterwave for recurring giving.'
      )
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: activeAmount,
          currency: 'NGN',
          donorName: donorName.trim(),
          donorEmail: donorEmail.trim(),
          gateway,
          frequency,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(firstApiError(data.error))
      if (data.authorizationUrl) window.location.href = data.authorizationUrl as string
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const copyAccountNumber = () => {
    void navigator.clipboard.writeText(
      bankDetails?.accountNumber ?? content['partnership.bank.accountNumber']
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="pt-24">
      {isTestMode ? (
        <div className="border border-yellow-500/30 bg-yellow-500/10 px-6 py-3 text-center">
          <p className="font-body text-sm text-yellow-600">
            Payment gateways are in <strong>TEST MODE</strong> — no real charges will be made. Admin: switch to Live mode in Integrations when ready.
          </p>
        </div>
      ) : null}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <p className="mb-6 font-body text-[10px] uppercase tracking-[0.35em] text-gold">Partner With Us</p>
        <h1 className="mb-6 font-display text-5xl leading-none text-text-primary lg:text-7xl">
          {content['partnership.hero.headline']}
        </h1>
        <p className="mx-auto mb-10 max-w-2xl font-body text-lg leading-relaxed text-text-secondary">
          {content['partnership.hero.subtext']}
        </p>
        <p className="font-display text-xl italic text-gold max-w-xl mx-auto whitespace-pre-line">
          {content['partnership.hero.scripture']}
        </p>
        <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent mt-12" />
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(
            [
              {
                Icon: Landmark,
                title: content['partnership.card1.title'],
                desc: content['partnership.card1.desc'],
              },
              {
                Icon: BookOpen,
                title: content['partnership.card2.title'],
                desc: content['partnership.card2.desc'],
              },
              {
                Icon: Globe,
                title: content['partnership.card3.title'],
                desc: content['partnership.card3.desc'],
              },
            ] satisfies { Icon: LucideIcon; title: string; desc: string }[]
          ).map(({ Icon, title, desc }) => (
            <div
              key={title}
              className="rfy-card p-6 transition-colors hover:border-gold/35"
            >
              <div
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-gold/30 bg-gold/[0.06]"
                aria-hidden
              >
                <Icon className="h-5 w-5 text-gold" strokeWidth={1.35} />
              </div>
              <h3 className="mb-2 font-display text-lg text-text-primary">{title}</h3>
              <p className="font-body text-sm leading-relaxed text-text-secondary">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent mb-16" />
        <h2 className="mb-12 text-center font-display text-3xl text-text-primary">Give Now</h2>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="space-y-8">
            <div>
              <p className="mb-3 font-body text-xs uppercase tracking-widest text-text-muted">Giving Frequency</p>
              <div className="flex">
                {(['ONE_TIME', 'MONTHLY', 'ANNUAL'] as Frequency[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => {
                      setFrequency(f)
                      if (f !== 'ONE_TIME' && gateway === 'PAYAZA') setGateway('PAYSTACK')
                    }}
                    className={cn(
                      'flex-1 py-3 text-sm font-body tracking-wide border transition-all',
                      frequency === f
                        ? 'border-gold bg-gold text-charcoal'
                        : 'border-theme text-text-secondary hover:border-gold/40 hover:text-text-primary'
                    )}
                  >
                    {f === 'ONE_TIME' ? 'One-Time' : f === 'MONTHLY' ? 'Monthly' : 'Annual'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 font-body text-xs uppercase tracking-widest text-text-muted">Select Amount</p>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_AMOUNTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => {
                      setAmount(a)
                      setCustomAmount('')
                    }}
                    className={cn(
                      'py-3 text-sm font-body border transition-all',
                      amount === a && !customAmount
                        ? 'border-gold bg-gold text-charcoal'
                        : 'border-theme text-text-secondary hover:border-gold/40 hover:text-text-primary'
                    )}
                  >
                    ₦{a.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 font-body text-xs uppercase tracking-widest text-text-muted">Or Enter Amount</p>
              <div className="flex items-center border border-theme transition-colors focus-within:border-gold">
                <span className="border-r border-theme px-4 py-3 font-body text-gold">₦</span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value)
                    setAmount(0)
                  }}
                  placeholder="Enter amount"
                  className="flex-1 bg-transparent px-4 py-3 font-body text-text-primary placeholder:text-text-muted/60 focus:outline-none"
                />
              </div>
            </div>

            {frequency !== 'ONE_TIME' && (
              <p className="font-body text-xs text-text-muted">
                * Payaza supports one-time gifts only. For recurring giving, use Paystack or Flutterwave.
              </p>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <label className="mb-2 block font-body text-xs uppercase tracking-widest text-text-muted">
                Full Name
              </label>
              <input
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="Your full name"
                className="w-full border border-theme bg-surface px-4 py-3 font-body text-text-primary transition-colors placeholder:text-text-muted/70 focus:border-gold focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block font-body text-xs uppercase tracking-widest text-text-muted">
                Email Address
              </label>
              <input
                type="email"
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full border border-theme bg-surface px-4 py-3 font-body text-text-primary transition-colors placeholder:text-text-muted/70 focus:border-gold focus:outline-none"
              />
            </div>

            <div>
              <p className="mb-3 font-body text-xs uppercase tracking-widest text-text-muted">Payment Method</p>
              <div className="space-y-2">
                {enabledGateways.map((gw) => {
                  const disabled = frequency !== 'ONE_TIME' && !gw.supportsRecurring
                  return (
                    <button
                      key={gw.id}
                      type="button"
                      onClick={() => !disabled && setGateway(gw.id)}
                      disabled={disabled}
                      className={cn(
                        'w-full flex items-center justify-between p-4 border transition-all text-left',
                        gateway === gw.id && !disabled
                          ? 'border-gold bg-gold/5'
                          : disabled
                            ? 'cursor-not-allowed border-border/40 opacity-40'
                            : 'border-theme hover:border-gold/35'
                      )}
                    >
                      <div>
                        <p
                          className={cn(
                            'font-body text-sm font-medium',
                            gateway === gw.id && !disabled ? 'text-gold' : 'text-text-primary'
                          )}
                        >
                          {gw.name}
                        </p>
                        <p className="mt-0.5 font-body text-xs text-text-muted">{gw.description}</p>
                      </div>
                      {gw.supportsRecurring && (
                        <span className="text-[10px] px-2 py-0.5 bg-gold/10 text-gold/70 font-body tracking-wide">
                          Recurring ✓
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleGive()}
              disabled={loading}
              className="animate-pulse-gold w-full bg-gold py-4 font-body text-base font-medium uppercase tracking-widest text-charcoal transition-all duration-300 hover:bg-gold-light disabled:opacity-50"
            >
              {loading
                ? 'Processing…'
                : `Give ₦${(activeAmount || 0).toLocaleString()} ${frequency === 'MONTHLY' ? '/ month' : frequency === 'ANNUAL' ? '/ year' : ''}`}
            </button>
          </div>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-6 pb-24">
        <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent mb-16" />
        <div className="rfy-card p-8 text-center">
          <h2 className="mb-6 font-display text-2xl text-text-primary">Prefer Bank Transfer?</h2>
          <div className="mx-auto mb-8 max-w-sm space-y-4 text-left">
            <div
              className="flex justify-between py-3 border-b"
              style={{ borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <span className="font-body text-sm text-text-muted">Bank</span>
              <span className="font-body text-sm text-text-primary">
                {bankDetails?.bankName ?? content['partnership.bank.bankName']}
              </span>
            </div>
            <div
              className="flex justify-between py-3 border-b"
              style={{ borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <span className="font-body text-sm text-text-muted">Account Name</span>
              <span className="font-body text-sm text-text-primary">
                {bankDetails?.accountName ?? content['partnership.bank.accountName']}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="font-body text-sm text-text-muted">Account Number</span>
              <div className="flex items-center gap-2">
                <span className="text-gold font-mono text-sm">
                  {bankDetails?.accountNumber ?? content['partnership.bank.accountNumber']}
                </span>
                <button
                  type="button"
                  onClick={copyAccountNumber}
                  className="p-1.5 text-text-muted transition-colors hover:text-gold"
                  aria-label="Copy account number"
                >
                  {copied ? <Check size={14} className="text-gold" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
          <p className="font-body text-sm leading-relaxed text-text-muted">
            After your transfer, please send your name and amount to{' '}
            <a
              href={`mailto:${bankDetails?.contactEmail ?? content['partnership.bank.contactEmail']}`}
              className="text-gold hover:underline"
            >
              {bankDetails?.contactEmail ?? content['partnership.bank.contactEmail']}
            </a>{' '}
            so we can acknowledge your gift.
          </p>
        </div>
      </section>
    </div>
  )
}
