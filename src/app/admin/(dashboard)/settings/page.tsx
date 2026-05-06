import { ChangePasswordForm } from '@/components/admin/ChangePasswordForm'
import { auth } from '@/lib/auth'

export default async function SettingsPage() {
  const session = await auth()

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--a-text)' }}>
          Account Settings
        </h2>
        <p className="font-body text-sm mt-1" style={{ color: 'var(--a-text-muted)' }}>
          Manage your admin account
        </p>
      </div>

      {/* Account info */}
      <div
        className="p-5 border mb-8"
        style={{ background: 'var(--a-surface)', borderColor: 'var(--a-border)' }}
      >
        <p
          className="font-body text-xs uppercase tracking-widest mb-3"
          style={{ color: 'var(--a-text-muted)' }}
        >
          Account Info
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-body text-sm" style={{ color: 'var(--a-text-secondary)' }}>
              Email
            </span>
            <span className="font-body text-sm font-medium" style={{ color: 'var(--a-text)' }}>
              {session?.user?.email}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-body text-sm" style={{ color: 'var(--a-text-secondary)' }}>
              Role
            </span>
            <span
              className="text-[11px] px-2 py-0.5 font-body tracking-widest uppercase"
              style={{
                background: 'var(--a-gold-light)',
                color: 'var(--a-gold)',
                border: '1px solid var(--a-gold-border)',
              }}
            >
              {session?.user?.role}
            </span>
          </div>
        </div>
      </div>

      <ChangePasswordForm />
    </div>
  )
}
