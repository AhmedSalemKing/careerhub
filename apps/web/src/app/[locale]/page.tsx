import { normalisePrimary } from '../../lib/utils'
import { HeroSection } from './sections/HeroSection'
import { MarqueeStrip } from './sections/HomeSections'
import {
  RevealOnScroll,
  HowSection,
  TracksSection,
  MomentsV3Section,
  WhySection,
  MentorsSection,
  ProvidersSection,
  RegionsSection,
  CtaBandSection,
} from './sections/HomeV3Sections'
import { HashScrollHandler } from '../components/HashScrollHandler'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.deveways.com/api'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const isAr = locale === 'ar'
  return {
    title: isAr
      ? 'DeveWay | منصة التعليم والتطوير المهني العربية'
      : 'DeveWay | Arabic Educational Platform for Career Development',
    description: isAr
      ? 'منصة تعليمية عربية متكاملة. كورسات احترافية، كوتشينج مهني، مسارات وظيفية، وشهادات معتمدة. ابدأ رحلتك التعليمية اليوم.'
      : 'An integrated Arabic educational platform. Professional courses, career coaching, job paths, and verified certificates. Start your learning journey today.',
    alternates: {
      canonical: `https://www.deveways.com/${locale}`,
      languages: {
        'ar': 'https://www.deveways.com/ar',
        'en': 'https://www.deveways.com/en',
      },
    },
    openGraph: {
      title: isAr ? 'DeveWay | منصة التعليم العربية' : 'DeveWay | Arabic Learning Platform',
      description: isAr
        ? 'كورسات احترافية وكوتشينج مهني وشهادات معتمدة'
        : 'Professional courses, career coaching, and verified certificates',
      url: `https://www.deveways.com/${locale}`,
      locale: isAr ? 'ar_SA' : 'en_US',
      alternateLocale: isAr ? 'en_US' : 'ar_SA',
    },
  }
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'DeveWay',
  url: 'https://www.deveways.com',
  logo: 'https://www.deveways.com/logo.png',
  description: 'منصة تعليمية عربية للكورسات المهنية والكوتشينج',
  sameAs: ['https://twitter.com/deveways', 'https://linkedin.com/company/deveways'],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    availableLanguage: ['Arabic', 'English'],
  },
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'DeveWay',
  url: 'https://www.deveways.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://www.deveways.com/ar/courses?search={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
}

async function getSiteConfig() {
  try {
    const res = await fetch(`${API_BASE}/admin/site-config`, {
      next: { revalidate: 300 },
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return {}
    const json = await res.json()
    // API wraps responses: { success: true, data: {...} }
    const data = json?.data ?? json
    return data
  } catch {
    return {}
  }
}

export default async function HomePage() {
  const config = await getSiteConfig()

  const primaryColor = normalisePrimary(config['theme.primaryColor'] || '#5120C8')

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <style dangerouslySetInnerHTML={{
        __html: `:root{--primary:${primaryColor};}`,
      }} />
      <main id="main-content" aria-label="DeveWay homepage" className="dw-home scroll-smooth">
        <HashScrollHandler />
        <RevealOnScroll />
        <HeroSection siteConfig={config} />
        <MarqueeStrip />
        <HowSection />
        <TracksSection />
        <MomentsV3Section />
        <WhySection />
        <MentorsSection />
        <ProvidersSection />
        <RegionsSection />
        <CtaBandSection />
      </main>
    </>
  )
}
