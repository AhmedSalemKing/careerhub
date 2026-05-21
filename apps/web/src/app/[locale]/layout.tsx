import { LocaleShell } from '../components/LocaleShell'

export async function generateMetadata({ params }: { params: { locale: string } }) {
  return {
    alternates: {
      canonical: `https://deveway-teal.vercel.app/${params.locale}`,
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
