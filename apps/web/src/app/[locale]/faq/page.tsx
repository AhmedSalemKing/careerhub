export default function FaqPage() {
  return (
    <div style={{ maxWidth:'800px', margin:'0 auto', padding:'3rem 1rem' }}>
      <h1 style={{ fontSize:'2rem', fontWeight:700, marginBottom:'2rem' }}>
        الأسئلة الشائعة
      </h1>
      {[
        { q: 'كيف أبدأ التعلم', a: 'اختر كورسا من صفحة الكورسات وابدأ فورا.' },
        { q: 'هل الشهادات معتمدة', a: 'نعم شهاداتنا معتمدة ويمكن التحقق منها.' },
        { q: 'هل يمكن استرداد المبلغ', a: 'نعم ضمان استرداد خلال 30 يوما.' },
        { q: 'كيف أتواصل مع المحاضر', a: 'عبر نظام المحادثات داخل الكورس.' },
      ].map((item, i) => (
        <div key={i} style={{ marginBottom:'1.5rem', padding:'1.25rem',
          border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px' }}>
          <h3 style={{ fontWeight:600, marginBottom:'0.5rem' }}>{item.q}</h3>
          <p style={{ color:'var(--muted-foreground)', margin:0 }}>{item.a}</p>
        </div>
      ))}
    </div>
  )
}
