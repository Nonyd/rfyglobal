import { EmailTemplatesManager } from '@/components/admin/email-templates/EmailTemplatesManager'

export default function EmailTemplatesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold" style={{ color: 'var(--a-text)' }}>
          Email Templates
        </h1>
        <p className="font-body mt-1 text-sm" style={{ color: 'var(--a-text-muted)' }}>
          Design and manage all automated email templates. Changes apply to all future sends.
        </p>
      </div>
      <EmailTemplatesManager />
    </div>
  )
}
