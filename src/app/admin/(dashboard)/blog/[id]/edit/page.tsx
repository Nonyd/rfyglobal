import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { BlogPostEditor } from '@/components/admin/blog/BlogPostEditor'

export const dynamic = 'force-dynamic'

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const post = await db.post.findUnique({ where: { id: params.id } })
  if (!post) notFound()
  return <BlogPostEditor mode="edit" initialData={post} />
}
