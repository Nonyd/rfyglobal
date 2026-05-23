import type { Metadata } from 'next'
import { PublicPageShell } from '@/components/layout/PublicPageShell'

export const metadata: Metadata = {
  title: 'Refund Policy — Room For You',
  description: 'Room For You refund and cancellation policy for gifts and partnership contributions.',
}

export default function RefundPolicyPage() {
  return (
    <PublicPageShell className="bg-void" mainClassName="pb-24 px-6 pt-32">
      <div className="max-w-3xl mx-auto">
        <p className="label-text mb-4">Legal</p>
        <h1 className="font-display text-snow text-4xl lg:text-5xl font-bold mb-4">Refund Policy</h1>
        <p className="font-body text-mist text-sm mb-12">Last updated: May 2026</p>
        <div className="gold-line-left w-12 mb-12 opacity-40" />

        <div className="space-y-10">
          <section>
            <h2 className="font-display text-snow text-2xl mb-4">Gifts and Donations</h2>
            <p className="font-body text-mist leading-relaxed">
              All financial gifts and partnership contributions made to Room For You (operated by SonsHub Media Ltd) are
              voluntary and are used to fund the mission and operations of the Room For You community. As these are
              freewill gifts to a ministry, they are generally non-refundable.
            </p>
          </section>

          <section>
            <h2 className="font-display text-snow text-2xl mb-4">Exceptional Circumstances</h2>
            <p className="font-body text-mist leading-relaxed mb-4">
              We may consider a refund request in the following exceptional circumstances:
            </p>
            <ul className="space-y-2 font-body text-mist">
              <li className="flex gap-3">
                <span className="text-crimson shrink-0">—</span> A duplicate payment was made in error
              </li>
              <li className="flex gap-3">
                <span className="text-crimson shrink-0">—</span> An unauthorized transaction occurred on your payment
                method
              </li>
              <li className="flex gap-3">
                <span className="text-crimson shrink-0">—</span> A technical error resulted in an incorrect amount being
                charged
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-snow text-2xl mb-4">How to Request a Refund</h2>
            <p className="font-body text-mist leading-relaxed">
              To request a refund, please contact us within 14 days of the transaction at{' '}
              <a href="mailto:partner@rfyglobal.org" className="text-crimson hover:opacity-70 transition-opacity">
                partner@rfyglobal.org
              </a>{' '}
              with your full name, email address, transaction reference, amount, and reason for the refund request. We
              will review your request and respond within 5 business days.
            </p>
          </section>

          <section>
            <h2 className="font-display text-snow text-2xl mb-4">Event Registrations</h2>
            <p className="font-body text-mist leading-relaxed">
              Room For You events are currently free to attend. There is no charge for event registration, and therefore
              no refund is applicable for event registrations.
            </p>
          </section>

          <section>
            <h2 className="font-display text-snow text-2xl mb-4">Processing Time</h2>
            <p className="font-body text-mist leading-relaxed">
              Approved refunds will be processed within 7-10 business days and returned to the original payment method.
              Processing times may vary depending on your bank or card issuer.
            </p>
          </section>

          <section>
            <h2 className="font-display text-snow text-2xl mb-4">Contact</h2>
            <p className="font-body text-mist leading-relaxed">
              For all refund enquiries, please contact{' '}
              <a href="mailto:partner@rfyglobal.org" className="text-crimson hover:opacity-70 transition-opacity">
                partner@rfyglobal.org
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </PublicPageShell>
  )
}
