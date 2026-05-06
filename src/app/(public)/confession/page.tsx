import dynamic from 'next/dynamic'
import { Navbar } from '@/components/layout/Navbar'
import type { Metadata } from 'next'

const ConfessionPageClient = dynamic(
  () => import('@/components/confession/ConfessionPageClient').then((m) => m.ConfessionPageClient),
  { ssr: false, loading: () => <div className="min-h-screen bg-black" aria-hidden /> },
)

export const metadata: Metadata = {
  title: 'The Confession — Room For You',
  description: 'I am saved by grace through faith. Make this confession yours.',
}

export default function ConfessionPage() {
  return (
    <>
      <Navbar />
      <ConfessionPageClient />
    </>
  )
}
