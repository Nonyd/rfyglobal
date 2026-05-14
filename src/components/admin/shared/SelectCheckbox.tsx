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
      className={`shrink-0 flex items-center justify-center rounded-[2px] border-2 transition-colors ${
        checked
          ? 'border-[var(--a-gold)] bg-[var(--a-gold)]'
          : 'border-[var(--a-border-strong)] bg-transparent hover:border-[var(--a-gold)]'
      }`}
      style={{ width: `${dim}px`, height: `${dim}px` }}
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
