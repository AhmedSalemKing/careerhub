'use client'

export interface SegmentedOption {
  value: string
  label: string
}

interface SegmentedControlProps {
  options: SegmentedOption[]
  value: string
  onChange: (value: string) => void
  size?: 'sm' | 'md'
}

export default function SegmentedControl({ options, value, onChange, size = 'md' }: SegmentedControlProps) {
  return (
    <div className="flex gap-1 rounded-[12px] border border-[color:var(--border)] bg-[color:var(--surface-2)] p-1 overflow-x-auto">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 whitespace-nowrap rounded-[8px] font-semibold transition-all duration-150 ${
            size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
          } ${
            value === opt.value
              ? 'bg-primary text-white'
              : 'text-[color:var(--muted)] hover:text-foreground hover:bg-[color:var(--surface)]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}