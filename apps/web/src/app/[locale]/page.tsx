import { HeroSection } from './sections/HeroSection'
import { FeaturesSection } from './sections/FeaturesSection'
import { CareerPathsSection } from './sections/CareerPathsSection'
import { TestimonialsSection } from './sections/TestimonialsSection'
import { CTASection } from './sections/CTASection'
import { CoursesShowcase } from '../components/CoursesShowcase'
import { HashScrollHandler } from '../components/HashScrollHandler'

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const isAr = params.locale === 'ar'
  return {
    title: isAr
      ? 'DeveWay | منصة التعليم والتطوير المهني العربية'
      : 'DeveWay | Arabic Educational Platform for Career Development',
    description: isAr
      ? 'منصة تعليمية عربية متكاملة. كورسات احترافية، كوتشينج مهني، مسارات وظيفية، وشهادات معتمدة. ابدأ رحلتك التعليمية اليوم.'
      : 'An integrated Arabic educational platform. Professional courses, career coaching, job paths, and verified certificates. Start your learning journey today.',
    alternates: {
      canonical: `https://www.deveways.com/${params.locale}`,
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
      url: `https://www.deveways.com/${params.locale}`,
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

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <main id="main-content" aria-label="DeveWay homepage" className="scroll-smooth">
        <HashScrollHandler />
        <HeroSection />
        <div style={{ borderTop: '1px solid var(--border)' }}>
          <FeaturesSection />
        </div>
        <CareerPathsSection />
        <CoursesShowcase />
        <div style={{ borderTop: '1px solid var(--border)' }}>
          <TestimonialsSection />
        </div>
        <CTASection />
      </main>
    </>
  )
}