import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  const title = isAr ? 'الإرشاد المهني | DeveWay' : 'Career Coaching | DeveWay'
  const description = isAr
    ? 'احصل على إرشاد مهني من خبراء التقنية على منصة DeveWay. جلسات فردية مع مرشدين محترفين في مجال البرمجة والتقنية.'
    : 'Get career guidance from tech experts on DeveWay. One-on-one sessions with professional mentors in software and technology.'
  const url = `https://www.deveways.com/${locale}/coaching`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, locale: isAr ? 'ar_SA' : 'en_US', type: 'website' },
  }
}

export default function CoachingLayout({ children }: { children: React.ReactNode }) {
  return children
}
