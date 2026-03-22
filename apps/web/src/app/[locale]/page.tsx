import dynamic from 'next/dynamic'
import { HeroSection } from './sections/HeroSection'
import { FeaturesSection } from './sections/FeaturesSection'

const CareerPathsSection = dynamic(() => import('./sections/CareerPathsSection'), {
  loading: () => <SectionSkeleton />,
})

const HowItWorksSection = dynamic(() => import('./sections/HowItWorksSection'), {
  loading: () => <SectionSkeleton />,
})

const TestimonialsSection = dynamic(() => import('./sections/TestimonialsSection'), {
  loading: () => <SectionSkeleton />,
})

const CTASection = dynamic(() => import('./sections/CTASection'), {
  loading: () => <SectionSkeleton />,
})

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <CareerPathsSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection />
    </>
  )
}

function SectionSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-[color:var(--surface-2)]" />
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl bg-[color:var(--surface-2)]" />
        ))}
      </div>
    </section>
  )
}

