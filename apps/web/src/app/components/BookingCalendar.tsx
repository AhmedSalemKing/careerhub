'use client'

import { useMemo } from 'react'
import { cn } from './ui/cn'

export type BookingSlot = {
  id: string
  startTime: string
  endTime: string
  date?: string
  isAvailable?: boolean
}

export function BookingCalendar({
  slots,
  selectedSlotId,
  onSelect,
}: {
  slots: BookingSlot[]
  selectedSlotId: string | null
  onSelect: (slotId: string) => void
}) {
  const normalized = useMemo(() => {
    return slots.map((s) => ({
      ...s,
      isAvailable: typeof s.isAvailable === 'boolean' ? s.isAvailable : true,
    }))
  }, [slots])

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {normalized.map((s) => (
        <button
          key={s.id}
          type="button"
          disabled={!s.isAvailable}
          onClick={() => onSelect(s.id)}
          className={cn(
            'rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-sm font-semibold text-foreground hover:bg-[color:var(--surface-2)] disabled:opacity-60',
            selectedSlotId === s.id && 'border-primary ring-2 ring-primary/20',
          )}
        >
          <div className="text-xs text-[color:var(--muted)]">{s.date ?? ''}</div>
          <div className="mt-1">
            {s.startTime} - {s.endTime}
          </div>
        </button>
      ))}
    </div>
  )
}

