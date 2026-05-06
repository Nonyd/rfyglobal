'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FormFieldInput } from '@/lib/validations/form'
import {
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
      style={style}
      className={cn(
        'border bg-white/[0.03] p-4 space-y-4 transition-colors',
        isDragging ? 'border-gold/60' : 'border-white/10'
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-0.5 text-white/20 hover:text-gold transition-colors cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical size={18} />
        </button>

        <div className="flex-1 min-w-0">
          <span className="text-[10px] tracking-widest uppercase font-body px-2 py-0.5 bg-gold/10 text-gold/80 mb-2 inline-block">
            {FIELD_TYPE_LABELS[typeKey]}
          </span>

          <input
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="Field label"
            className="w-full bg-transparent border-b border-white/10 text-white text-sm font-body py-1 focus:border-gold focus:outline-none transition-colors placeholder:text-white/20"
          />
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="mt-0.5 text-white/20 hover:text-red-brand transition-colors shrink-0"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {!NO_PLACEHOLDER.includes(typeKey) ? (
        <input
          value={field.placeholder ?? ''}
          onChange={(e) => onUpdate({ placeholder: e.target.value })}
          placeholder="Placeholder text (optional)"
          className="w-full bg-transparent border border-white/10 text-white/60 text-xs font-body px-3 py-2 focus:border-gold/50 focus:outline-none transition-colors placeholder:text-white/15"
        />
      ) : null}

      {HAS_OPTIONS.includes(typeKey) ? (
        <div className="space-y-2">
          <p className="text-[10px] text-white/30 font-body uppercase tracking-widest">Options</p>
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                className="flex-1 bg-transparent border border-white/10 text-white/80 text-xs font-body px-3 py-2 focus:border-gold/50 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => removeOption(i)}
                className="text-white/20 hover:text-red-brand transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            className="flex items-center gap-1 text-xs text-gold/60 hover:text-gold font-body transition-colors"
          >
            <Plus size={12} /> Add option
          </button>
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onUpdate({ required: !field.required })}
          className={cn(
            'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
            field.required ? 'bg-gold' : 'bg-white/10'
          )}
        >
          <span
            className={cn(
              'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform',
              field.required ? 'translate-x-4' : 'translate-x-0.5'
            )}
          />
        </button>
        <span className="text-xs text-white/40 font-body">Required</span>
      </div>
    </div>
  )
}
