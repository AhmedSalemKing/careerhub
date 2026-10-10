'use client'

interface ToggleSwitchProps {
  checked: boolean
  onChange: (value: boolean) => void
  label?: string
  disabled?: boolean
}

export default function ToggleSwitch({ checked, onChange, label, disabled }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-150 ${
          checked
            ? 'bg-primary'
            : 'bg-[color:var(--surface-2)] border border-[color:var(--border)]'
        }`}
      >
        <span
          className={`absolute top-[3px] inline-block h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-all duration-150 ${
            checked ? 'start-[calc(100%-21px)]' : 'start-[3px]'
          }`}
        />
      </span>
      {label && (
        <span className="text-sm text-[color:var(--muted)] group-hover:text-foreground transition-colors duration-150">
          {label}
        </span>
      )}
    </button>
  )
}