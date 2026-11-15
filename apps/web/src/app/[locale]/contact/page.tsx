import { Metadata } from 'next'
import { SUPPORT_EMAIL } from '../../../components/legal/legalDefaults'

export const metadata: Metadata = {
  title: 'Contact Us | DeveWay',
  description: 'Get in touch with DeveWay support team. We are here to help you with any questions or inquiries.',
}

export default function Page() {
  return (
    <main style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '0 1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>تواصل معنا</h1>
      <p style={{ color: '#888', marginBottom: '1.5rem' }}>يسعدنا تلقّي رسائلكم واستفساراتكم</p>
      <div style={{ marginBottom: '0.5rem' }}>
        <strong>البريد الإلكتروني: </strong>
        <a href={`mailto:${SUPPORT_EMAIL}`} dir="ltr" style={{ textDecoration: 'underline' }}>{SUPPORT_EMAIL}</a>
      </div>
      <p dir="ltr" style={{ color: '#888' }}>{SUPPORT_EMAIL}</p>
    </main>
  )
}
