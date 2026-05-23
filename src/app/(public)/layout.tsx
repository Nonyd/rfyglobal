import { Toaster } from 'react-hot-toast'
import { ChatWidget } from '@/components/chat/ChatWidget'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ChatWidget />
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#111',
            color: '#FAFAFA',
            border: '1px solid rgba(139,0,0,0.3)',
            fontFamily: 'var(--font-inter)',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#8B0000', secondary: '#0A0A0A' } },
          error: { iconTheme: { primary: '#D0021B', secondary: '#FAFAFA' } },
        }}
      />
    </>
  )
}
