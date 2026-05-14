const faqs = [
  { q: 'كيف أبدأ التعلم في DeveWay؟', a: 'اختر كورساً من صفحة الكورسات، سجل حسابك، وابدأ التعلم فوراً. جميع الكورسات متاحة عند الاشتراك.' },
  { q: 'هل الشهادات معتمدة؟', a: 'نعم، شهاداتنا معتمدة ويمكن التحقق منها عبر موقعنا من خلال رابط التحقق الخاص بكل شهادة.' },
  { q: 'هل يمكن استرداد المبلغ؟', a: 'نعم، نوفر ضمان استرداد خلال 30 يوماً من تاريخ الاشتراك إذا لم تكن راضياً عن الكورس.' },
  { q: 'كيف أتواصل مع المحاضر؟', a: 'يمكنك التواصل مع المحاضرين عبر نظام المحادثات المدمج داخل كل كورس.' },
  { q: 'هل توجد جلسات استشارية؟', a: 'نعم، نوفر جلسات استشارية فردية مع خبراء متخصصين في مختلف المجالات المهنية.' },
]

export default function FaqPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.q,
            acceptedAnswer: { '@type': 'Answer', text: faq.a },
          })),
        })
      }} />
      <div style={{ maxWidth:'800px', margin:'0 auto', padding:'3rem 1rem' }}>
        <h1 style={{ fontSize:'2rem', fontWeight:700, marginBottom:'2rem' }}>الأسئلة الشائعة</h1>
        {faqs.map((item, i) => (
          <div key={i} style={{ marginBottom:'1.5rem', padding:'1.25rem', border:'1px solid var(--border)', borderRadius:'10px' }}>
            <h3 style={{ fontWeight:600, marginBottom:'0.5rem' }}>{item.q}</h3>
            <p style={{ color:'var(--muted-foreground)', margin:0 }}>{item.a}</p>
          </div>
        ))}
      </div>
    </>
  )
}
