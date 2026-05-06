import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AdminThemeWrapper } from '@/components/admin/AdminThemeWrapper'
import { AdminSessionProvider } from '@/components/admin/AdminSessionProvider'

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/admin/login')

  return (
    <AdminSessionProvider>
      <AdminThemeWrapper>{children}</AdminThemeWrapper>
    </AdminSessionProvider>
  )
}
