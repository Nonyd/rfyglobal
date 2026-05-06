'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Copy, Check } from 'lucide-react'
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
      <section className="max-w-4xl mx-auto px-6 text-center py-20">
        <p className="text-[10px] tracking-[0.35em] uppercase text-gold font-body mb-6">Partner With Us</p>
        <h1 className="font-display text-5xl lg:text-7xl text-white mb-6 leading-none">
          {content['partnership.hero.headline']}
        </h1>
        <p className="text-white/60 font-body text-lg leading-relaxed max-w-2xl mx-auto mb-10">
          {content['partnership.hero.subtext']}
        </p>
        <p className="font-display text-xl italic text-gold max-w-xl mx-auto whitespace-pre-line">
          {content['partnership.hero.scripture']}
        </p>
        <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent mt-12" />
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: '🏛',
              title: content['partnership.card1.title'],
              desc: content['partnership.card1.desc'],
            },
            {
              icon: '📖',
              title: content['partnership.card2.title'],
              desc: content['partnership.card2.desc'],
            },
            {
              icon: '🌍',
              title: content['partnership.card3.title'],
              desc: content['partnership.card3.desc'],
            },
          ].map((item) => (
            <div
              key={item.title}
              className="border border-white/10 p-6 hover:border-gold/30 transition-colors"
            >
              <div className="text-3xl mb-4">{item.icon}</div>
              <h3 className="font-display text-lg text-white mb-2">{item.title}</h3>
              <p className="text-white/50 font-body text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent mb-16" />
        <h2 className="font-display text-3xl text-white text-center mb-12">Give Now</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-8">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/40 font-body mb-3">Giving Frequency</p>
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
                        ? 'bg-gold text-black border-gold'
                        : 'border-white/20 text-white/60 hover:border-gold/40 hover:text-white'
                    )}
                  >
                    {f === 'ONE_TIME' ? 'One-Time' : f === 'MONTHLY' ? 'Monthly' : 'Annual'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-white/40 font-body mb-3">Select Amount</p>
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
                        ? 'bg-gold text-black border-gold'
                        : 'border-white/20 text-white/60 hover:border-gold/40 hover:text-white'
                    )}
                  >
                    ₦{a.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-white/40 font-body mb-3">Or Enter Amount</p>
              <div className="flex items-center border border-white/20 focus-within:border-gold transition-colors">
                <span className="px-4 py-3 text-gold font-body border-r border-white/20">₦</span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value)
                    setAmount(0)
                  }}
                  placeholder="Enter amount"
                  className="flex-1 bg-transparent text-white px-4 py-3 font-body focus:outline-none placeholder:text-white/20"
                />
              </div>
            </div>

            {frequency !== 'ONE_TIME' && (
              <p className="text-xs text-white/30 font-body">
                * Payaza supports one-time gifts only. For recurring giving, use Paystack or Flutterwave.
              </p>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/40 font-body mb-2">
                Full Name
              </label>
              <input
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="Your full name"
                className="w-full bg-white/3 border border-white/10 text-white px-4 py-3 font-body focus:border-gold focus:outline-none transition-colors placeholder:text-white/20"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-white/40 font-body mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-white/3 border border-white/10 text-white px-4 py-3 font-body focus:border-gold focus:outline-none transition-colors placeholder:text-white/20"
              />
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-white/40 font-body mb-3">Payment Method</p>
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
                            ? 'border-white/5 opacity-40 cursor-not-allowed'
                            : 'border-white/10 hover:border-gold/30'
                      )}
                    >
                      <div>
                        <p
                          className={cn(
                            'font-body text-sm font-medium',
                            gateway === gw.id && !disabled ? 'text-gold' : 'text-white'
                          )}
                        >
                          {gw.name}
                        </p>
                        <p className="text-white/40 text-xs font-body mt-0.5">{gw.description}</p>
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
              className="w-full py-4 bg-gold text-black font-body font-medium text-base tracking-widest uppercase hover:bg-gold-light transition-all duration-300 disabled:opacity-50 animate-pulse-gold"
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
        <div className="border border-white/10 p-8 text-center">
          <h2 className="font-display text-2xl text-white mb-6">Prefer Bank Transfer?</h2>
          <div className="space-y-4 text-left max-w-sm mx-auto mb-8">
            <div
              className="flex justify-between py-3 border-b"
              style={{ borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <span className="text-white/40 font-body text-sm">Bank</span>
              <span className="text-white font-body text-sm">
                {bankDetails?.bankName ?? content['partnership.bank.bankName']}
              </span>
            </div>
            <div
              className="flex justify-between py-3 border-b"
              style={{ borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <span className="text-white/40 font-body text-sm">Account Name</span>
              <span className="text-white font-body text-sm">
                {bankDetails?.accountName ?? content['partnership.bank.accountName']}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-white/40 font-body text-sm">Account Number</span>
              <div className="flex items-center gap-2">
                <span className="text-gold font-mono text-sm">
                  {bankDetails?.accountNumber ?? content['partnership.bank.accountNumber']}
                </span>
                <button
                  type="button"
                  onClick={copyAccountNumber}
                  className="p-1.5 text-white/30 hover:text-gold transition-colors"
                  aria-label="Copy account number"
                >
                  {copied ? <Check size={14} className="text-gold" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
          <p className="text-white/40 font-body text-sm leading-relaxed">
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
