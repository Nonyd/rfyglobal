import type { CSSProperties, FocusEvent } from 'react'

/** Shared inline styles for public form inputs (light/dark via CSS variables). */
export const publicInputStyle: CSSProperties = {
  background: 'var(--color-surface)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-text-primary)',
}

export function onPublicInputFocus(
  e: FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
) {
  e.target.style.borderColor = 'var(--color-accent)'
}

export function onPublicInputBlur(
  e: FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
) {
  e.target.style.borderColor = 'var(--color-border)'
}
