import type { Metadata } from 'next'

import { HeroSection } from './sections/HeroSection'
import { FeaturesSection } from './sections/FeaturesSection'
import { CareerPathsSection } from './sections/CareerPathsSection'
import { TestimonialsSection } from './sections/TestimonialsSection'
import { CTASection } from './sections/CTASection'
import { CoursesShowcase } from '../components/CoursesShowcase'
import { HashScrollHandler } from '../components/HashScrollHandler'  // ← ضفت ده

export const metadata: Metadata = {
  title: 'DeveWay — Discover Your Career Path',
  description:
    'AI-powered career guidance, professional courses, and expert coaching to help you land your first tech job.',
  openGraph: {
    title: 'DeveWay — Discover Your Career Path',
    description:
      'AI-powered career guidance, professional courses, and expert coaching to help you land your first tech job.',
    type: 'website',
  },
}

export default function HomePage() {
  return (
    <main id="main-content" aria-label="DeveWay homepage" className="scroll-smooth">

      {/* 🔥 Hash Scroll Handler - handles #career-paths on page load */}
      <HashScrollHandler />

      {/* ── HERO ── Full-width dark section */}
      <HeroSection />

      {/* ── FEATURES ── Light bg with border separator */}
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <FeaturesSection />
      </div>

      {/* ── CAREER PATHS ── Theme-aware */}
      <CareerPathsSection />

      {/* ── JOURNEY / COURSES ── Dark section */}
      <CoursesShowcase />

      {/* ── TESTIMONIALS ── Light bg */}
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <TestimonialsSection />
      </div>

      {/* ── CTA ── Theme-aware */}
      <CTASection />

    </main>
  )
}