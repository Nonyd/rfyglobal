import { useState, useCallback } from 'react'

export function useBulkSelect<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map((i) => i.id)))
  }, [items])

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds])

  const isAllSelected = items.length > 0 && selectedIds.size === items.length
  const isPartialSelected = selectedIds.size > 0 && selectedIds.size < items.length

  const selectedCount = selectedIds.size
  const selectedArray = Array.from(selectedIds)

  const reset = useCallback(() => setSelectedIds(new Set()), [])

  return {
    selectedIds,
    selectedArray,
    selectedCount,
    toggle,
    selectAll,
    deselectAll,
    isSelected,
    isAllSelected,
    isPartialSelected,
    reset,
  }
}
