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
        className="relative shrink-0 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(201,168,76,0.45)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F0F]"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          borderRadius: `${height / 2}px`,
          background: checked
            ? 'linear-gradient(135deg, #C9A84C, #E8C96A)'
            : 'rgba(255,255,255,0.1)',
          border: checked ? '1px solid rgba(201,168,76,0.5)' : '1px solid rgba(255,255,255,0.15)',
          boxShadow: checked
            ? '0 0 12px rgba(201,168,76,0.25)'
            : 'inset 0 1px 3px rgba(0,0,0,0.3)',
        }}
      >
        <span
          className="absolute transition-transform duration-300 ease-out"
          style={{
            width: `${thumbSize}px`,
            height: `${thumbSize}px`,
            borderRadius: '50%',
            background: checked ? '#0F0F0F' : 'rgba(255,255,255,0.6)',
            top: `${thumbOffset}px`,
            left: `${thumbOffset}px`,
            transform: checked ? `translateX(${translateX}px)` : 'translateX(0)',
            boxShadow: checked ? '0 1px 3px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.3)',
          }}
        />
      </button>

      {label ? (
        <span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {label}
        </span>
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
        className="relative shrink-0 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(201,168,76,0.35)] focus-visible:ring-offset-2"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          borderRadius: `${height / 2}px`,
          background: checked
            ? 'linear-gradient(135deg, var(--a-gold), #E8C96A)'
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
