import { LocaleShell } from '../components/LocaleShell'
import { MarketProvider } from '../contexts/MarketContext'

export default function LocaleLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarketProvider>
      <LocaleShell>
        {children}
      </LocaleShell>
    </MarketProvider>
  )
}
