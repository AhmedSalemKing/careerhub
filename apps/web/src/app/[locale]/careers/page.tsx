import { Metadata } from 'next'
import CareersPage from './CareersPage'

export const metadata: Metadata = {
  title: 'Career Paths | DeveWay',
  description: '47 career paths. Discover your ideal career with AI-powered assessment and personalized recommendations.',
  alternates: { languages: { ar: '/ar/careers', en: '/en/careers' } },
}

export default function Page() {
  return <CareersPage />
}
