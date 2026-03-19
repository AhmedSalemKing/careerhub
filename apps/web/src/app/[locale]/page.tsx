import { HeroSection } from './sections/HeroSection'
import { FeaturesSection } from './sections/FeaturesSection'
import { CareerPathsSection } from './sections/CareerPathsSection'
import { HowItWorksSection } from './sections/HowItWorksSection'
import { TestimonialsSection } from './sections/TestimonialsSection'
import { CTASection } from './sections/CTASection'

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

