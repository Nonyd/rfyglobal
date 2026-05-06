import dynamic from 'next/dynamic'

const ConfessionRevealClient = dynamic(
  () => import('./ConfessionRevealClient').then((m) => m.ConfessionRevealClient),
  { ssr: false, loading: () => <div className="min-h-screen bg-black" aria-hidden /> },
)

export function ConfessionReveal() {
  return <ConfessionRevealClient />
}
