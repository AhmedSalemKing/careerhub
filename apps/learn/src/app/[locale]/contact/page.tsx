'use client'
import { useParams } from 'next/navigation'
import { useEffect } from 'react'
export default function ContactPage() {
  const params = useParams()
  const locale = params?.locale as string || 'ar'
  useEffect(() => { window.location.href = 'https://deveway-teal.vercel.app/' + locale + '/contact' }, [locale])
  return <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center' }}><p style={{ color:'#888' }}>{locale === 'ar' ? 'جاري التحويل...' : 'Redirecting...'}</p></div>
}
