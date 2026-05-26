'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AdminToggle } from '@/components/shared/Toggle'
import type { FormFieldInput } from '@/lib/validations/form'
import {
  BIRTHDAY_FIELD_TYPES,
  FIELD_TYPE_LABELS,
  HAS_OPTIONS,
  NO_PLACEHOLDER,
  type AppFieldType,
} from '@/lib/form-field-metadata'

interface SortableFieldCardProps {
  field: FormFieldInput & { _key: string }
  onUpdate: (updates: Partial<FormFieldInput>) => void
  onRemove: () => void
}

export function SortableFieldCard({ field, onUpdate, onRemove }: SortableFieldCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field._key,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const typeKey = field.type as AppFieldType
  const isBirthdayField = BIRTHDAY_FIELD_TYPES.includes(typeKey)
  const options = (field.options as string[] | undefined) ?? []

  const addOption = () => onUpdate({ options: [...options, `Option ${options.length + 1}`] })
  const updateOption = (i: number, val: string) => {
    const next = [...options]
    next[i] = val
    onUpdate({ options: next })
  }
  const removeOption = (i: number) => onUpdate({ options: options.filter((_, idx) => idx !== i) })

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: 'var(--a-bg)',
        borderColor: isDragging ? 'var(--a-gold-border)' : 'var(--a-border)',
      }}
      className={cn(
        'border p-4 space-y-4 transition-colors',
        isDragging ? '' : ''
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-0.5 transition-colors cursor-grab active:cursor-grabbing touch-none"
          style={{ color: 'var(--a-text-muted)' }}
        >
          <GripVertical size={18} />
        </button>

        <div className="flex-1 min-w-0">
          <span className="text-[10px] tracking-widest uppercase font-body px-2 py-0.5 mb-2 inline-block" style={{ background: 'var(--a-gold-light)', color: 'var(--a-gold)' }}>
            {FIELD_TYPE_LABELS[typeKey]}
          </span>

          <input
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="Field label"
            className="w-full bg-transparent border-b text-sm font-body py-1 focus:outline-none transition-colors"
            style={{ borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
          />
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="mt-0.5 transition-colors shrink-0"
          style={{ color: 'var(--a-text-muted)' }}
        >
          <Trash2 size={16} />
        </button>
      </div>

      {!NO_PLACEHOLDER.includes(typeKey) ? (
        <input
          value={field.placeholder ?? ''}
          onChange={(e) => onUpdate({ placeholder: e.target.value })}
          placeholder="Placeholder text (optional)"
          className="w-full bg-transparent border text-xs font-body px-3 py-2 focus:outline-none transition-colors"
          style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-secondary)' }}
        />
      ) : null}

      {HAS_OPTIONS.includes(typeKey) ? (
        <div className="space-y-2">
          <p className="text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--a-text-muted)' }}>Options</p>
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                className="flex-1 bg-transparent border text-xs font-body px-3 py-2 focus:outline-none transition-colors"
                style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-secondary)' }}
              />
              <button
                type="button"
                onClick={() => removeOption(i)}
                className="transition-colors"
                style={{ color: 'var(--a-text-muted)' }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            className="flex items-center gap-1 text-xs font-body transition-colors"
            style={{ color: 'var(--a-gold)' }}
          >
            <Plus size={12} /> Add option
          </button>
        </div>
      ) : null}

      {isBirthdayField ? (
        <p className="text-xs font-body leading-relaxed" style={{ color: 'var(--a-text-muted)' }}>
          This field is always optional — visitors choose whether to share their birthday.
        </p>
      ) : (
        <AdminToggle
          checked={field.required}
          onChange={(val) => onUpdate({ required: val })}
          label="Required"
          size="sm"
        />
      )}
    </div>
  )
}
