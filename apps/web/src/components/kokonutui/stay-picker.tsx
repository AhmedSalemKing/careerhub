'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * KokonutUI inspired Stay Picker.
 *
 * This is the local DeveWay implementation of the KokonutUI Stay Picker: a
 * month calendar where every day shows whether it can be booked. Unavailable
 * days are hatched and disabled, available days carry a small availability dot,
 * and the selected day is rendered as a filled, rounded pill.
 *
 * The shadcn CLI could not install the registry component into this app (the
 * repository does not use a components.json / shadcn setup), so the component
 * is implemented here with React + Tailwind only and styled exclusively with
 * the DeveWay CSS variables.
 */

export interface StayPickerProps {
  /** Selected date as YYYY-MM-DD (local calendar). */
  value?: string | null
  /** Called with the newly selected date as YYYY-MM-DD. */
  onChange: (date: string) => void
  /** Controlled visible month. Defaults to the month of `value`. */
  month?: Date
  onMonthChange?: (month: Date) => void
  /** Return true when a day has no free slots left. */
  isDayUnavailable?: (date: string) => boolean
  /** Optional hint shown for days that are not in the past. */
  isDayAvailable?: (date: string) => boolean
  /** First selectable date as YYYY-MM-DD. Defaults to today. */
  minDate?: string
  locale?: 'ar' | 'en'
  className?: string
}

const AR_WEEKDAYS = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
const EN_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function dateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

export default function StayPicker({
  value,
  onChange,
  month: monthProp,
  onMonthChange,
  isDayUnavailable,
  isDayAvailable,
  minDate,
  locale = 'ar',
  className,
}: StayPickerProps) {
  const isAr = locale === 'ar'
  const [internalMonth, setInternalMonth] = useState<Date>(() =>
    startOfMonth(value ? parseKey(value) : new Date()),
  )

  const month = monthProp ? startOfMonth(monthProp) : internalMonth
  const todayKey = dateKey(new Date())
  const minKey = minDate || todayKey

  const moveMonth = (amount: number) => {
    const next = addMonths(month, amount)
    if (monthProp) {
      onMonthChange?.(next)
    } else {
      setInternalMonth(next)
      onMonthChange?.(next)
    }
  }

  const days = useMemo(() => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
    const leading = firstDay.getDay()
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    const cells: Array<Date | null> = []
    for (let i = 0; i < leading; i++) cells.push(null)
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(new Date(month.getFullYear(), month.getMonth(), day))
    }
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [month])

  const monthLabel = month.toLocaleDateString(isAr ? 'ar-EG-u-ca-gregory' : 'en-US', {
    month: 'long',
    year: 'numeric',
    calendar: 'gregory',
  })

  const weekdayLabels = isAr ? AR_WEEKDAYS : EN_WEEKDAYS

  return (
    <div
      dir="rtl"
      className={cn('rounded-2xl border p-4', className)}
      style={{
        background: 'var(--card)',
        borderColor: 'var(--border)',
        fontFamily: 'var(--font-body)',
        color: 'var(--foreground)',
      }}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}
          >
            <CalendarDays size={17} />
          </span>
          <div>
            <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-madinet)' }}>
              {isAr ? 'اختر التاريخ' : 'Pick a date'}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
              {monthLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            aria-label={isAr ? 'الشهر السابق' : 'Previous month'}
            className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--surface)' }}
          >
            <ChevronRight size={15} />
          </button>
          <button
            type="button"
            onClick={() => moveMonth(1)}
            aria-label={isAr ? 'الشهر التالي' : 'Next month'}
            className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--surface)' }}
          >
            <ChevronLeft size={15} />
          </button>
        </div>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {weekdayLabels.map((label) => (
          <div
            key={label}
            className="py-1 text-center text-[10px] font-bold uppercase tracking-wide"
            style={{ color: 'var(--muted)' }}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (!day) return <div key={`empty-${index}`} className="h-11" />

          const key = dateKey(day)
          const isPast = key < minKey
          const unavailable = isDayUnavailable?.(key) ?? false
          const available = !isPast && !unavailable && (isDayAvailable ? isDayAvailable(key) : true)
          const selected = value === key
          const disabled = isPast || unavailable

          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onChange(key)}
              aria-label={`${key}${unavailable ? (isAr ? ' محجوز' : ' booked') : ''}`}
              aria-pressed={selected}
              className={cn(
                'group relative flex h-11 flex-col items-center justify-center rounded-xl border text-[13px] font-bold transition-all duration-150',
                !disabled && 'hover:-translate-y-px',
              )}
              style={{
                borderColor: selected ? 'var(--primary)' : 'var(--border)',
                background: selected
                  ? 'var(--primary)'
                  : disabled
                    ? 'transparent'
                    : 'var(--surface)',
                backgroundImage:
                  unavailable && !selected
                    ? 'repeating-linear-gradient(135deg, var(--border) 0px, var(--border) 1px, transparent 1px, transparent 6px)'
                    : undefined,
                color: selected
                  ? 'var(--primary-foreground)'
                  : disabled
                    ? 'var(--muted)'
                    : 'var(--foreground)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: isPast ? 0.45 : 1,
                boxShadow: selected ? '0 6px 16px var(--primary-subtle)' : 'none',
              }}
            >
              <span className={cn(disabled && unavailable && 'line-through decoration-1')}>{day.getDate()}</span>
              <span
                className="mt-0.5 h-1 w-1 rounded-full"
                style={{
                  background: selected
                    ? 'var(--primary-foreground)'
                    : unavailable || isPast
                      ? 'transparent'
                      : 'var(--accent)',
                }}
              />
            </button>
          )
        })}
      </div>

      <div
        className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-3 text-[11px]"
        style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
      >
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
          {isAr ? 'متاح' : 'Available'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--primary)' }} />
          {isAr ? 'محدد' : 'Selected'}
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-3 w-4 rounded"
            style={{
              backgroundImage:
                'repeating-linear-gradient(135deg, var(--border) 0px, var(--border) 1px, transparent 1px, transparent 4px)',
              border: '1px solid var(--border)',
            }}
          />
          {isAr ? 'محجوز بالكامل' : 'Fully booked'}
        </span>
      </div>
    </div>
  )
}
