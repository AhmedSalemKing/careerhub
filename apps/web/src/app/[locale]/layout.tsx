import { LocaleShell } from '../components/LocaleShell'

export async function generateMetadata({ params }: { params: { locale: string } }) {
  return {
    alternates: {
      canonical: `https://www.deveways.com/${params.locale}`,
      languages: {
        'ar': 'https://www.deveways.com/ar',
        'en': 'https://www.deveways.com/en',
        'x-default': 'https://www.deveways.com/ar',
      },
    },
  }
}

export default function LocaleLayout({ children }: { children: React.ReactNode }) {
  return (
    <LocaleShell>
      {children}
    </LocaleShell>
  )
}
