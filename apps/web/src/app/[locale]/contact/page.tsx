import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us | DeveWay',
  description: 'Get in touch with DeveWay support team. We are here to help you with any questions or inquiries.',
}

export default function Page() {
  return (
    <div style={{ maxWidth:'600px', margin:'4rem auto', textAlign:'center', padding:'0 1rem' }}>
      <h1 style={{ fontSize:'1.5rem', fontWeight:700, marginBottom:'1rem' }}>
        تواصل معنا
      </h1>
      <p style={{ color:'#888' }}>سيتم الإطلاق قريبا.</p>
    </div>
  )
}
