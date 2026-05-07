'use client'
import { useParams } from 'next/navigation'
export default function AiChatPage() {
  const params = useParams()
  const isAr = params?.locale === 'ar'
  return (
    <div style={{ minHeight:'60vh', display:'flex', alignItems:'center',
      justifyContent:'center', flexDirection:'column', gap:'1rem',
      padding:'2rem', textAlign:'center' }}>
      <h1 style={{ fontSize:'1.75rem', fontWeight:700 }}>
        {isAr ? 'المساعد الذكي' : 'AI Assistant'}
      </h1>
      <p style={{ color:'var(--muted-foreground,#888)', maxWidth:'480px' }}>
        {isAr ? 'سيتم الإطلاق قريبا.' : 'Coming soon.'}
      </p>
    </div>
  )
}
