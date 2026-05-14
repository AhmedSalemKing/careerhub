import { Metadata } from 'next'
import FaqPage from './FaqPage'

export const metadata: Metadata = {
  title: 'FAQ | DeveWay',
  description: 'Frequently asked questions about DeveWay platform, courses, certificates, coaching, and payments.',
  alternates: { languages: { ar: '/ar/faq', en: '/en/faq' } },
}

export default function Page() {
  return <FaqPage />
}
