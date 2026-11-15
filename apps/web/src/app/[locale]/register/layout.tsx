import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  return {
    title: isAr ? 'إنشاء حساب | DeveWay' : 'Create an Account | DeveWay',
    description: isAr
      ? 'سجّل في منصة DeveWay وابدأ رحلتك في تطوير مسيرتك المهنية مع أفضل المدربين والمرشدين التقنيين.'
      : 'Join DeveWay and start developing your career with top instructors and technical mentors.',
    alternates: { canonical: `https://www.deveways.com/${locale}/register` },
  }
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
