'use client'

interface SelectCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  size?: 'sm' | 'md'
}

export function SelectCheckbox({ checked, onChange, size = 'md' }: SelectCheckboxProps) {
  const dim = size === 'sm' ? 16 : 18

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onChange(!checked)
      }}
      className="shrink-0 flex items-center justify-center transition-all"
      style={{
        width: `${dim}px`,
        height: `${dim}px`,
        background: checked ? 'var(--a-gold)' : 'transparent',
        border: `2px solid ${checked ? 'var(--a-gold)' : 'var(--a-border-strong)'}`,
        borderRadius: '2px',
      }}
      onMouseEnter={(e) => {
        if (!checked) e.currentTarget.style.borderColor = 'var(--a-gold)'
      }}
      onMouseLeave={(e) => {
        if (!checked) e.currentTarget.style.borderColor = 'var(--a-border-strong)'
      }}
    >
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path
            d="M1 4L3.5 6.5L9 1"
            stroke="#0F0F0F"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  )
}
