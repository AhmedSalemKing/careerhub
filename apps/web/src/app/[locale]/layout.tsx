import { LocaleShell } from '../components/LocaleShell'

export default function LocaleLayout({ children }: { children: React.ReactNode }) {
  return (
    <LocaleShell>
      {children}
    </LocaleShell>
  )
}
