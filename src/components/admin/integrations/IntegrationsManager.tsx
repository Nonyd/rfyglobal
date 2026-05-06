'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Save, Shield, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface ServiceConfig {
  id: string
  name: string
  description: string
  color: string
  fields: {
    key: string
    label: string
    type: 'text' | 'password'
    placeholder?: string
    hint?: string
  }[]
}

const SERVICES: ServiceConfig[] = [
  {
    id: 'paystack',
    name: 'Paystack',
    description: 'Nigerian payment gateway - cards, bank transfer, USSD',
    color: '#00C3F7',
    fields: [
      { key: 'publicKey', label: 'Public Key', type: 'text', placeholder: 'pk_live_...' },
      { key: 'secretKey', label: 'Secret Key', type: 'password', placeholder: 'sk_live_...' },
      { key: 'webhookSecret', label: 'Webhook Secret', type: 'password' },
      { key: 'monthlyPlanCode', label: 'Monthly Plan Code', type: 'text', placeholder: 'PLN_...' },
      { key: 'annualPlanCode', label: 'Annual Plan Code', type: 'text', placeholder: 'PLN_...' },
    ],
  },
  {
    id: 'flutterwave',
    name: 'Flutterwave',
    description: 'Pan-African payment gateway - cards, mobile money, bank',
    color: '#F5A623',
    fields: [
      { key: 'publicKey', label: 'Public Key', type: 'text', placeholder: 'FLWPUBK_TEST-...' },
      { key: 'secretKey', label: 'Secret Key', type: 'password', placeholder: 'FLWSECK_TEST-...' },
      { key: 'webhookSecret', label: 'Webhook Secret Hash', type: 'password' },
      { key: 'monthlyPlanId', label: 'Monthly Plan ID', type: 'text' },
      { key: 'annualPlanId', label: 'Annual Plan ID', type: 'text' },
    ],
  },
  {
    id: 'payaza',
    name: 'Payaza',
    description: 'One-time payments (no recurring)',
    color: '#6C63FF',
    fields: [
      { key: 'publicKey', label: 'Public Key', type: 'text' },
      { key: 'secretKey', label: 'Secret Key', type: 'password' },
    ],
  },
  {
    id: 'bankTransfer',
    name: 'Bank Transfer',
    description: 'Display bank account details for manual transfers',
    color: '#C9A84C',
    fields: [
      { key: 'bankName', label: 'Bank Name', type: 'text' },
      { key: 'accountName', label: 'Account Name', type: 'text' },
      { key: 'accountNumber', label: 'Account Number', type: 'text' },
      { key: 'contactEmail', label: 'Contact Email', type: 'text' },
    ],
  },
  {
    id: 'brevo',
    name: 'Brevo',
    description: 'Transactional email',
    color: '#0B996E',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password' },
      { key: 'fromEmail', label: 'From Email', type: 'text', placeholder: 'noreply@rfyglobal.org' },
      { key: 'fromName', label: 'From Name', type: 'text', placeholder: 'Room For You' },
    ],
  },
  {
    id: 'ebulksms',
    name: 'EbulkSMS',
    description: 'SMS notifications',
    color: '#E53E3E',
    fields: [
      { key: 'username', label: 'Username', type: 'text' },
      { key: 'apiKey', label: 'API Key', type: 'password' },
      { key: 'senderId', label: 'Sender ID', type: 'text' },
    ],
  },
  {
    id: 'paymentSettings',
    name: 'Payment Settings',
    description: 'Global settings for giving page',
    color: '#C9A84C',
    fields: [{ key: 'minimumGiftAmount', label: 'Minimum Gift Amount (Naira)', type: 'text' }],
  },
]
const PAYMENT_SERVICE_IDS = ['paystack', 'flutterwave', 'payaza']

interface IntegrationsManagerProps {
  initialData: Record<string, Record<string, unknown>>
}

export function IntegrationsManager({ initialData }: IntegrationsManagerProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, Record<string, string>>>(
    Object.fromEntries(
      SERVICES.map((service) => [
        service.id,
        {
          ...Object.fromEntries(
            service.fields.map((field) => [field.key, String(initialData[service.id]?.[field.key] ?? '')])
          ),
          ...(PAYMENT_SERVICE_IDS.includes(service.id)
            ? { mode: String(initialData[service.id]?.mode ?? 'test') }
            : {}),
        },
      ])
    )
  )
  const [activeStates, setActiveStates] = useState<Record<string, boolean>>(
    Object.fromEntries(SERVICES.map((service) => [service.id, Boolean(initialData[service.id]?.isActive ?? true)]))
  )
  const [saving, setSaving] = useState<string | null>(null)

  const updateValue = (serviceId: string, key: string, value: string) => {
    setValues((prev) => ({ ...prev, [serviceId]: { ...prev[serviceId], [key]: value } }))
  }

  const toggleActive = async (serviceId: string) => {
    const next = !activeStates[serviceId]
    setActiveStates((prev) => ({ ...prev, [serviceId]: next }))
    const res = await fetch(`/api/credentials/${serviceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: next }),
    })
    if (!res.ok) {
      setActiveStates((prev) => ({ ...prev, [serviceId]: !next }))
      toast.error('Failed to update')
      return
    }
    toast.success(next ? `${serviceId} enabled` : `${serviceId} disabled`)
  }

  const saveService = async (serviceId: string) => {
    setSaving(serviceId)
    try {
      const res = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: serviceId,
          data: values[serviceId],
          isActive: activeStates[serviceId],
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Credentials saved')
      setExpanded(null)
    } catch {
      toast.error('Failed to save credentials')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h2 className="font-display text-2xl text-white">Integrations</h2>
        <p className="text-white/40 text-sm font-body mt-1">Manage all third-party credentials securely</p>
      </div>

      <div className="flex items-start gap-3 p-4 border border-gold/30 bg-gold/5 mb-8">
        <Shield size={18} className="text-gold shrink-0 mt-0.5" />
        <p className="text-gold/80 text-sm font-body leading-relaxed">
          All credentials are encrypted with AES-256-GCM before storage. Keys are masked and never returned in plain text.
        </p>
      </div>

      <div className="space-y-3">
        {SERVICES.map((service) => {
          const isExpanded = expanded === service.id
          const isActive = activeStates[service.id]
          const isSaving = saving === service.id

          return (
            <div
              key={service.id}
              className={cn('border transition-all duration-200', isActive ? 'border-white/15' : 'border-white/8 opacity-70')}
            >
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: service.color }} />
                  <div>
                    <h3 className="font-display text-base text-white">{service.name}</h3>
                    <p className="text-white/40 text-xs font-body mt-0.5">{service.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {PAYMENT_SERVICE_IDS.includes(service.id) ? (
                    <div className="mr-2 flex items-center gap-1">
                      <button
                        onClick={() => updateValue(service.id, 'mode', 'test')}
                        className="px-2.5 py-1 text-[10px] font-body font-medium tracking-widest transition-all"
                        style={{
                          background: values[service.id]?.mode !== 'live' ? 'rgba(234,179,8,0.15)' : 'transparent',
                          color: values[service.id]?.mode !== 'live' ? '#CA8A04' : 'var(--admin-text-muted)',
                          borderColor: values[service.id]?.mode !== 'live' ? 'rgba(234,179,8,0.4)' : 'var(--admin-border)',
                          border: '1px solid',
                        }}
                      >
                        TEST
                      </button>
                      <button
                        onClick={() => updateValue(service.id, 'mode', 'live')}
                        className="px-2.5 py-1 text-[10px] font-body font-medium tracking-widest transition-all"
                        style={{
                          background: values[service.id]?.mode === 'live' ? 'rgba(34,197,94,0.15)' : 'transparent',
                          color: values[service.id]?.mode === 'live' ? '#16A34A' : 'var(--admin-text-muted)',
                          borderColor: values[service.id]?.mode === 'live' ? 'rgba(34,197,94,0.4)' : 'var(--admin-border)',
                          border: '1px solid',
                        }}
                      >
                        LIVE
                      </button>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void toggleActive(service.id)}
                    className="text-white/40 hover:text-gold transition-colors"
                    title={isActive ? 'Disable' : 'Enable'}
                  >
                    {isActive ? <ToggleRight size={22} className="text-gold" /> : <ToggleLeft size={22} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpanded(isExpanded ? null : service.id)}
                    className="p-2 border border-white/10 text-white/40 hover:border-gold/40 hover:text-gold transition-all"
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {isExpanded ? (
                <div className="border-t px-5 pb-5 pt-4 space-y-4" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  {service.fields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-xs uppercase tracking-widest text-white/40 font-body mb-2">
                        {field.label}
                      </label>
                      <input
                        type="text"
                        value={values[service.id]?.[field.key] ?? ''}
                        onChange={(e) => updateValue(service.id, field.key, e.target.value)}
                        placeholder={field.placeholder}
                        autoComplete="off"
                        spellCheck={false}
                        className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 font-mono text-sm focus:border-gold focus:outline-none transition-colors placeholder:text-white/15"
                      />
                      {field.hint ? <p className="text-white/25 text-xs font-body mt-1">{field.hint}</p> : null}
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-white/20 text-xs font-body">Values shown masked - type to update</p>
                    <button
                      type="button"
                      onClick={() => void saveService(service.id)}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gold text-black text-sm font-body font-medium hover:bg-gold-light transition-colors disabled:opacity-40"
                    >
                      <Save size={14} />
                      {isSaving ? 'Saving...' : 'Save Credentials'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
