'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Save, Settings, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { AdminToggle } from '@/components/shared/Toggle'
import { cn } from '@/lib/utils'

interface ServiceConfig {
  id: string
  name: string
  description: string
  color: string
  fields: {
    key: string
    label: string
    type: 'text' | 'password' | 'toggle'
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
            service.fields.map((field) => {
              if (field.type === 'toggle') {
                const v = initialData[service.id]?.[field.key]
                const on = v === true || v === 'true'
                return [field.key, on ? 'true' : 'false']
              }
              return [field.key, String(initialData[service.id]?.[field.key] ?? '')]
            })
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
  const [paymentSettings, setPaymentSettings] = useState({ usdEnabled: false })
  const [savingPaymentSettings, setSavingPaymentSettings] = useState(false)

  useEffect(() => {
    fetch('/api/admin/payment-settings')
      .then((r) => (r.ok ? r.json() : { usdEnabled: false }))
      .then((data: { usdEnabled?: boolean }) =>
        setPaymentSettings({ usdEnabled: data.usdEnabled === true }),
      )
      .catch(() => {})
  }, [])

  const savePaymentSetting = async (key: 'usdEnabled', value: boolean) => {
    const prev = paymentSettings.usdEnabled
    setSavingPaymentSettings(true)
    setPaymentSettings((p) => ({ ...p, [key]: value }))
    try {
      const res = await fetch('/api/admin/payment-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Payment settings saved')
    } catch {
      toast.error('Failed to save settings')
      setPaymentSettings((p) => ({ ...p, [key]: prev }))
    } finally {
      setSavingPaymentSettings(false)
    }
  }

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
      const data: Record<string, unknown> = { ...values[serviceId] }
      const res = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: serviceId,
          data,
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
        <h2 className="font-display text-2xl" style={{ color: 'var(--a-text)' }}>Integrations</h2>
        <p className="text-sm font-body mt-1" style={{ color: 'var(--a-text-secondary)' }}>Manage all third-party credentials securely</p>
      </div>

      <div className="flex items-start gap-3 p-4 mb-8"
        style={{ background: 'var(--a-gold-light)', border: '1px solid var(--a-gold-border)' }}>
        <Shield size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--a-gold)' }} />
        <p className="text-sm font-body leading-relaxed" style={{ color: 'var(--a-text-secondary)' }}>
          All credentials are encrypted with AES-256-GCM before storage. Keys are masked and never returned in plain text.
        </p>
      </div>

      <div
        className="mb-3 border p-5"
        style={{ borderColor: 'var(--a-border)', background: 'var(--a-surface)' }}
      >
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center"
            style={{ background: 'var(--a-bg)' }}
          >
            <Settings size={16} style={{ color: 'var(--a-gold)' }} />
          </div>
          <div>
            <p className="font-body text-sm font-semibold" style={{ color: 'var(--a-text)' }}>
              Payment Settings
            </p>
            <p className="font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>
              Global settings applied across all payment gateways
            </p>
          </div>
        </div>

        <div
          className="flex items-start justify-between gap-4 border-t py-4"
          style={{ borderColor: 'var(--a-border)' }}
        >
          <div className="min-w-0 flex-1">
            <p className="font-body text-sm font-medium" style={{ color: 'var(--a-text)' }}>
              USD Payments ($)
            </p>
            <p
              className="mt-1 font-body text-xs leading-relaxed"
              style={{ color: 'var(--a-text-muted)' }}
            >
              Show Dollar ($) on the partnership and paid event flows. Only activate after confirming USD is
              enabled on your payment gateway accounts.
            </p>
          </div>
          <AdminToggle
            checked={paymentSettings.usdEnabled}
            onChange={(val) => void savePaymentSetting('usdEnabled', val)}
            size="sm"
            disabled={savingPaymentSettings}
            aria-label="USD Payments"
          />
        </div>
      </div>

      <div className="space-y-3">
        {SERVICES.map((service) => {
          const isExpanded = expanded === service.id
          const isActive = activeStates[service.id]
          const isSaving = saving === service.id

          return (
            <div
              key={service.id}
              className={cn('border transition-all duration-200', !isActive && 'opacity-70')}
              style={{
                background: 'var(--a-surface)',
                borderColor: isActive ? 'var(--a-gold-border)' : 'var(--a-border)',
              }}
            >
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: service.color }} />
                  <div>
                    <h3 className="font-display text-base" style={{ color: 'var(--a-text)' }}>{service.name}</h3>
                    <p className="text-xs font-body mt-0.5" style={{ color: 'var(--a-text-muted)' }}>{service.description}</p>
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
                          color: values[service.id]?.mode !== 'live' ? '#CA8A04' : 'var(--a-text-muted)',
                          borderColor: values[service.id]?.mode !== 'live' ? 'rgba(234,179,8,0.4)' : 'var(--a-border)',
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
                          color: values[service.id]?.mode === 'live' ? '#16A34A' : 'var(--a-text-muted)',
                          borderColor: values[service.id]?.mode === 'live' ? 'rgba(34,197,94,0.4)' : 'var(--a-border)',
                          border: '1px solid',
                        }}
                      >
                        LIVE
                      </button>
                    </div>
                  ) : null}
                  <AdminToggle
                    checked={isActive}
                    onChange={() => void toggleActive(service.id)}
                    size="sm"
                    aria-label={isActive ? 'Disable integration' : 'Enable integration'}
                  />
                  <button
                    type="button"
                    onClick={() => setExpanded(isExpanded ? null : service.id)}
                    className="p-2 border transition-all"
                    style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-muted)' }}
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {isExpanded ? (
                <div className="border-t px-5 pb-5 pt-4 space-y-4" style={{ borderColor: 'var(--a-border)' }}>
                  {service.fields.map((field) =>
                    field.type === 'toggle' ? (
                      <div
                        key={field.key}
                        className="flex items-start justify-between gap-4 border-t pt-4"
                        style={{ borderColor: 'var(--a-border)' }}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-body text-sm font-medium" style={{ color: 'var(--a-text)' }}>
                            {field.label}
                          </p>
                          {field.hint ? (
                            <p className="mt-1 font-body text-xs leading-relaxed" style={{ color: 'var(--a-text-muted)' }}>
                              {field.hint}
                            </p>
                          ) : null}
                        </div>
                        <AdminToggle
                          checked={values[service.id]?.[field.key] === 'true'}
                          onChange={(checked) => updateValue(service.id, field.key, checked ? 'true' : 'false')}
                          size="sm"
                          aria-label={`${field.label} toggle`}
                        />
                      </div>
                    ) : (
                      <div key={field.key}>
                        <label
                          className="mb-2 block font-body text-xs font-medium uppercase tracking-widest"
                          style={{ color: 'var(--a-text-secondary)' }}
                        >
                          {field.label}
                        </label>
                        <input
                          type={field.type === 'password' ? 'password' : 'text'}
                          value={values[service.id]?.[field.key] ?? ''}
                          onChange={(e) => updateValue(service.id, field.key, e.target.value)}
                          placeholder={field.placeholder}
                          autoComplete="off"
                          spellCheck={false}
                          className="w-full border px-4 py-3 font-mono text-sm transition-colors focus:outline-none"
                          style={{
                            background: 'var(--a-bg)',
                            borderColor: 'var(--a-border)',
                            color: 'var(--a-text)',
                          }}
                          onFocus={(e) => (e.target.style.borderColor = 'var(--a-gold)')}
                          onBlur={(e) => (e.target.style.borderColor = 'var(--a-border)')}
                        />
                        {field.hint ? (
                          <p className="mt-1 font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>
                            {field.hint}
                          </p>
                        ) : null}
                      </div>
                    )
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs font-body" style={{ color: 'var(--a-text-muted)' }}>Values shown masked - type to update</p>
                    <button
                      type="button"
                      onClick={() => void saveService(service.id)}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-5 py-2.5 text-sm font-body font-medium transition-colors disabled:opacity-40"
                      style={{ background: 'var(--a-gold)', color: 'var(--a-text-inverse)' }}
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
