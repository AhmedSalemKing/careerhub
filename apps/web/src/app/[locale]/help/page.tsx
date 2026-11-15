import { useLocale } from 'next-intl'

export default function Page() {
  const isAr = useLocale() === 'ar'
  return (
    <div style={{ maxWidth:'600px', margin:'4rem auto', textAlign:'center', padding:'0 1rem' }}>
      <h1 style={{ fontSize:'1.5rem', fontWeight:700, marginBottom:'1rem' }}>
        {isAr ? 'المساعدة والدعم' : 'Help and support'}
      </h1>
      <p style={{ color:'#888' }}>{isAr ? 'سيتم الإطلاق قريبا.' : 'Launching soon.'}</p>
    </div>
  )
}
