import Link from 'next/link'
import type { Metadata } from 'next'
import { PublicPageShell } from '@/components/layout/PublicPageShell'

export const metadata: Metadata = {
  title: 'Privacy Policy — Room For You',
  description: 'How Room For You collects, uses, and protects your personal information.',
}

export default function PrivacyPolicyPage() {
  return (
    <PublicPageShell className="bg-void" mainClassName="pb-24 px-6 pt-32">
      <div className="max-w-3xl mx-auto">
        <p className="label-text mb-4">Legal</p>
        <h1 className="font-display text-snow text-4xl lg:text-5xl font-bold mb-4">Privacy Policy</h1>
        <p className="font-body text-mist text-sm mb-12">Last updated: May 2026</p>
        <div className="gold-line-left w-12 mb-12 opacity-40" />

        <div className="prose-rfy space-y-10">
          <section>
            <h2 className="font-display text-snow text-2xl mb-4">1. Introduction</h2>
            <p className="font-body text-mist leading-relaxed">
              Room For You (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is operated by SonsHub Media Ltd, a Christian
              media company based in Abuja, Nigeria. We are committed to protecting your personal information and your
              right to privacy. This Privacy Policy explains how we collect, use, and safeguard your information when
              you visit rfyglobal.org or join our community.
            </p>
          </section>

          <section>
            <h2 className="font-display text-snow text-2xl mb-4">2. Information We Collect</h2>
            <p className="font-body text-mist leading-relaxed mb-4">
              We collect information you voluntarily provide when you:
            </p>
            <ul className="space-y-2 font-body text-mist">
              <li className="flex gap-3">
                <span className="text-crimson shrink-0">—</span> Join the Room For You community (name, email, phone,
                location)
              </li>
              <li className="flex gap-3">
                <span className="text-crimson shrink-0">—</span> Register for an event (name, email, phone, location,
                expectations)
              </li>
              <li className="flex gap-3">
                <span className="text-crimson shrink-0">—</span> Make a financial gift or partnership contribution (name,
                email, payment details processed by third-party gateways)
              </li>
              <li className="flex gap-3">
                <span className="text-crimson shrink-0">—</span> Submit a form on our website
              </li>
            </ul>
            <p className="font-body text-mist leading-relaxed mt-4">
              We also automatically collect certain technical information including IP addresses, browser type, and
              pages visited through standard web server logs and cookies.
            </p>
          </section>

          <section>
            <h2 className="font-display text-snow text-2xl mb-4">3. How We Use Your Information</h2>
            <p className="font-body text-mist leading-relaxed mb-4">We use your information to:</p>
            <ul className="space-y-2 font-body text-mist">
              <li className="flex gap-3">
                <span className="text-crimson shrink-0">—</span> Send you community updates, daily scripture, and event
                reminders (you can unsubscribe at any time)
              </li>
              <li className="flex gap-3">
                <span className="text-crimson shrink-0">—</span> Confirm your event registrations and partnership gifts
              </li>
              <li className="flex gap-3">
                <span className="text-crimson shrink-0">—</span> Improve our website and community programs
              </li>
              <li className="flex gap-3">
                <span className="text-crimson shrink-0">—</span> Comply with legal obligations
              </li>
            </ul>
            <p className="font-body text-mist leading-relaxed mt-4">
              We do not sell, trade, or rent your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="font-display text-snow text-2xl mb-4">4. Data Storage and Security</h2>
            <p className="font-body text-mist leading-relaxed">
              Your data is stored securely on servers provided by Neon (PostgreSQL) and hosted via Vercel. We implement
              industry-standard security measures including encryption in transit (HTTPS) and at rest. Payment
              credentials are encrypted using AES-256-GCM before storage and are never returned in plain text. Despite
              our best efforts, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="font-display text-snow text-2xl mb-4">5. Your Rights</h2>
            <p className="font-body text-mist leading-relaxed mb-4">You have the right to:</p>
            <ul className="space-y-2 font-body text-mist">
              <li className="flex gap-3">
                <span className="text-crimson shrink-0">—</span> Access the personal data we hold about you
              </li>
              <li className="flex gap-3">
                <span className="text-crimson shrink-0">—</span> Request correction of inaccurate data
              </li>
              <li className="flex gap-3">
                <span className="text-crimson shrink-0">—</span> Request deletion of your data
              </li>
              <li className="flex gap-3">
                <span className="text-crimson shrink-0">—</span> Unsubscribe from all emails at any time using the
                unsubscribe link in any email
              </li>
              <li className="flex gap-3">
                <span className="text-crimson shrink-0">—</span> Withdraw consent for data processing
              </li>
            </ul>
            <p className="font-body text-mist leading-relaxed mt-4">
              To exercise any of these rights, contact us at privacy@rfyglobal.org.
            </p>
          </section>

          <section>
            <h2 className="font-display text-snow text-2xl mb-4">6. Third-Party Services</h2>
            <p className="font-body text-mist leading-relaxed">
              We use the following third-party services which have their own privacy policies: Brevo (email delivery),
              Paystack, Flutterwave, and Payaza (payment processing), Cloudinary (media storage), and Vercel (hosting).
              We encourage you to review their respective privacy policies.
            </p>
          </section>

          <section>
            <h2 className="font-display text-snow text-2xl mb-4">7. Cookies</h2>
            <p className="font-body text-mist leading-relaxed">
              We use cookies to maintain your session and remember your preferences. See our{' '}
              <Link href="/cookies" className="text-crimson hover:opacity-70 transition-opacity">
                Cookie Policy
              </Link>{' '}
              for full details.
            </p>
          </section>

          <section>
            <h2 className="font-display text-snow text-2xl mb-4">8. Changes to This Policy</h2>
            <p className="font-body text-mist leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any significant changes by
              posting the new policy on this page with an updated date. Continued use of our services after changes
              constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="font-display text-snow text-2xl mb-4">9. Contact Us</h2>
            <p className="font-body text-mist leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at{' '}
              <a
                href="mailto:privacy@rfyglobal.org"
                className="text-crimson hover:opacity-70 transition-opacity"
              >
                privacy@rfyglobal.org
              </a>{' '}
              or write to SonsHub Media Ltd, Abuja, Nigeria.
            </p>
          </section>
        </div>
      </div>
    </PublicPageShell>
  )
}
