import { Metadata } from 'next'
import PricingPage from './PricingPage'

export const metadata: Metadata = {
  title: 'Pricing | DeveWay',
  description: 'Choose the right plan for your learning journey. Flexible pricing for individuals, professionals, and teams.',
  alternates: { languages: { ar: '/ar/pricing', en: '/en/pricing' } },
}

export default function Page() {
  return <PricingPage />
}
