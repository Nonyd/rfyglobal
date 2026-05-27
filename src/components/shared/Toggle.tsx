'use client'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  id?: string
  'aria-label'?: string
}

export function Toggle({
  checked,
  onChange,
  label,
  size = 'md',
  disabled = false,
  id,
  'aria-label': ariaLabel,
}: ToggleProps) {
  const width = size === 'sm' ? 36 : size === 'lg' ? 48 : 44
  const height = size === 'sm' ? 20 : 24
  const thumbSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 18
  const thumbOffset = size === 'lg' ? 2 : 3
  const translateX = size === 'sm' ? 16 : size === 'lg' ? 24 : 20

  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer select-none items-center gap-3"
      style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}
    >
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        onClick={() => onChange(!checked)}
        className="rfy-toggle-track relative shrink-0 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(139,0,0,0.45)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          borderRadius: `${height / 2}px`,
          background: checked
            ? 'linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))'
            : 'var(--color-surface-2)',
          border: checked
            ? '1px solid var(--color-accent-border)'
            : '1px solid var(--color-border-strong)',
          boxShadow: checked ? '0 0 12px var(--color-accent-glow)' : 'inset 0 1px 2px rgba(0,0,0,0.08)',
        }}
      >
        <span
          className="rfy-toggle-thumb absolute transition-transform duration-300 ease-out"
          style={{
            width: `${thumbSize}px`,
            height: `${thumbSize}px`,
            borderRadius: '50%',
            background: checked ? 'var(--color-hero-bg, #111111)' : '#FFFFFF',
            top: `${thumbOffset}px`,
            left: `${thumbOffset}px`,
            transform: checked ? `translateX(${translateX}px)` : 'translateX(0)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        />
      </button>

      {label ? (
        <span className="rfy-toggle-label font-body text-sm text-text-secondary">{label}</span>
      ) : null}
    </label>
  )
}

export function AdminToggle({
  checked,
  onChange,
  label,
  size = 'md',
  disabled = false,
  id,
  'aria-label': ariaLabel,
}: ToggleProps) {
  const width = size === 'sm' ? 36 : size === 'lg' ? 48 : 44
  const height = size === 'sm' ? 20 : 24
  const thumbSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 18
  const thumbOffset = size === 'lg' ? 2 : 3
  const translateX = size === 'sm' ? 16 : size === 'lg' ? 24 : 20

  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer select-none items-center gap-3"
      style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}
    >
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        onClick={() => onChange(!checked)}
        className="relative shrink-0 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(139,0,0,0.35)] focus-visible:ring-offset-2"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          borderRadius: `${height / 2}px`,
          background: checked
            ? 'linear-gradient(135deg, var(--a-gold), #A00000)'
            : 'var(--a-border)',
          border: `1px solid ${checked ? 'var(--a-gold-border)' : 'var(--a-border-strong, var(--a-border))'}`,
          boxShadow: checked ? '0 0 8px var(--a-gold-light)' : 'none',
        }}
      >
        <span
          className="absolute transition-transform duration-300 ease-out"
          style={{
            width: `${thumbSize}px`,
            height: `${thumbSize}px`,
            borderRadius: '50%',
            background: '#FFFFFF',
            top: `${thumbOffset}px`,
            left: `${thumbOffset}px`,
            transform: checked ? `translateX(${translateX}px)` : 'translateX(0)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
          }}
        />
      </button>

      {label ? (
        <span className="font-body text-sm" style={{ color: 'var(--a-text-secondary)' }}>
          {label}
        </span>
      ) : null}
    </label>
  )
}
