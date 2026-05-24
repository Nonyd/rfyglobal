import Script from 'next/script'
import { Toaster } from 'react-hot-toast'
import { ChatWidget } from '@/components/chat/ChatWidget'
import { PublicCursor } from '@/components/layout/PublicCursor'
import { ScrollRevealInit } from '@/components/layout/ScrollRevealInit'
import { PublicThemeProvider } from '@/components/providers/PublicThemeProvider'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        id="rfy-public-theme-init"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(){var t=localStorage.getItem('rfy-public-theme')||'light';document.documentElement.setAttribute('data-public-theme',t);})();
          `,
        }}
      />
      <PublicThemeProvider>
        <div
          id="public-site-root"
          className="public-site public-light"
          style={{
            background: 'var(--color-bg)',
            color: 'var(--color-text-primary)',
            minHeight: '100vh',
          }}
        >
          {children}
          <PublicCursor />
          <ScrollRevealInit />
          <ChatWidget />
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: 'var(--color-surface-2)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-accent-border)',
                fontFamily: 'var(--font-inter)',
                fontSize: '14px',
              },
              success: {
                iconTheme: { primary: 'var(--color-accent)', secondary: 'var(--color-text-inverse)' },
              },
              error: { iconTheme: { primary: '#D0021B', secondary: '#FAFAFA' } },
            }}
          />
        </div>
      </PublicThemeProvider>
    </>
  )
}
