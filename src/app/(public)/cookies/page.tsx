import type { Metadata } from 'next'
import { PublicPageShell } from '@/components/layout/PublicPageShell'

export const metadata: Metadata = {
  title: 'Cookie Policy — Room For You',
  description: 'How Room For You uses cookies on rfyglobal.org.',
}

export default function CookiePolicyPage() {
  return (
    <PublicPageShell className="bg-void" mainClassName="pb-24 px-6 pt-32">
      <div className="max-w-3xl mx-auto">
        <p className="label-text mb-4">Legal</p>
        <h1 className="font-display text-snow text-4xl lg:text-5xl font-bold mb-4">Cookie Policy</h1>
        <p className="font-body text-mist text-sm mb-12">Last updated: May 2026</p>
        <div className="gold-line-left w-12 mb-12 opacity-40" />

        <div className="space-y-10">
          <section>
            <h2 className="font-display text-snow text-2xl mb-4">What Are Cookies</h2>
            <p className="font-body text-mist leading-relaxed">
              Cookies are small text files placed on your device when you visit a website. They help websites remember
              your preferences and provide a better browsing experience.
            </p>
          </section>

          <section>
            <h2 className="font-display text-snow text-2xl mb-4">Cookies We Use</h2>
            <div className="space-y-6">
              <div className="border-l-2 pl-4" style={{ borderColor: 'rgba(139,0,0,0.4)' }}>
                <p className="font-display text-crimson text-lg mb-2">Strictly Necessary Cookies</p>
                <p className="font-body text-mist text-sm leading-relaxed">
                  These cookies are essential for the website to function. They include session cookies that keep you
                  logged in to the admin dashboard and security tokens that protect against cross-site request forgery.
                  These cannot be disabled.
                </p>
              </div>
              <div className="border-l-2 pl-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <p className="font-display text-snow text-lg mb-2">Preference Cookies</p>
                <p className="font-body text-mist text-sm leading-relaxed">
                  We store your theme preference (dark/light mode) and cookie consent choice in your browser&apos;s local
                  storage. These are not transmitted to our servers.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display text-snow text-2xl mb-4">Managing Cookies</h2>
            <p className="font-body text-mist leading-relaxed">
              You can control cookies through your browser settings. Most browsers allow you to refuse cookies or delete
              existing ones. Note that disabling cookies may affect your ability to use certain features of this website,
              including the admin dashboard.
            </p>
          </section>

          <section>
            <h2 className="font-display text-snow text-2xl mb-4">Your Consent</h2>
            <p className="font-body text-mist leading-relaxed">
              When you first visit rfyglobal.org, you will see a cookie notice banner. By clicking &quot;Accept&quot;, you
              consent to our use of cookies as described in this policy. You can withdraw consent at any time by clearing
              your browser cookies and declining on your next visit.
            </p>
          </section>

          <section>
            <h2 className="font-display text-snow text-2xl mb-4">Contact</h2>
            <p className="font-body text-mist leading-relaxed">
              Questions about our cookie use? Contact us at{' '}
              <a href="mailto:privacy@rfyglobal.org" className="text-crimson hover:opacity-70 transition-opacity">
                privacy@rfyglobal.org
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </PublicPageShell>
  )
}
