import { FaqManager } from '@/components/admin/faq/FaqManager'

export default function FaqAdminPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold" style={{ color: 'var(--a-text)' }}>
          FAQs
        </h1>
        <p className="font-body text-sm mt-1" style={{ color: 'var(--a-text-muted)' }}>
          Manage FAQ categories and questions for the public /faq page.
        </p>
      </div>
      <FaqManager />
    </div>
  )
}
