import { Metadata } from 'next'
import CoachesPage from './CoachesPage'

export const metadata: Metadata = {
  title: 'Professional Coaches | DeveWay',
  description: 'Book a consulting session with top specialized professional coaches. Get expert guidance for your career path.',
  alternates: { languages: { ar: '/ar/coaches', en: '/en/coaches' } },
}

export default function Page() {
  return <CoachesPage />
}
