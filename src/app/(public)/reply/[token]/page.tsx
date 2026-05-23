import Image from 'next/image'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { ReplyForm } from '@/components/reply/ReplyForm'

export const metadata = {
  title: 'Reply — Room For You',
  robots: { index: false },
}

export default async function ReplyPage({
  params,
}: {
  params: { token: string }
}) {
  const thread = await db.messageThread.findUnique({
    where: { replyToken: params.token },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 3,
      },
    },
  })

  if (!thread || thread.status === 'archived') notFound()

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-16"
      style={{ background: 'var(--color-bg)' }}
    >
      <div className="w-full max-w-lg">
        <div className="mb-10 flex justify-center">
          <Image src="/images/logo-white.png" alt="Room For You" width={180} height={48} priority />
        </div>

        <div
          className="mb-6 border px-5 py-4"
          style={{
            borderColor: 'rgba(139,0,0,0.2)',
            background: 'rgba(139,0,0,0.04)',
          }}
        >
          <p
            className="font-body mb-2 text-[10px] uppercase tracking-widest"
            style={{ color: 'var(--color-accent)' }}
          >
            Replying to Room For You
          </p>
          <p className="font-body mb-1 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {thread.subject}
          </p>
          <p className="font-body text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {thread.fromName} · {thread.fromEmail}
          </p>
        </div>

        <ReplyForm token={params.token} fromName={thread.fromName} />
      </div>
    </div>
  )
}
