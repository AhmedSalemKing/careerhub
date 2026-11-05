'use client'
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowLeft, ArrowRight, Sparkles, Code2, Briefcase, Clock, Star } from 'lucide-react'

const CATEGORIES = [
  { id: 'tech', labelKey: 'technology' as const, icon: <Code2 size={16} /> },
  { id: 'business', labelKey: 'business' as const, icon: <Briefcase size={16} /> },
]

const PATHS = [
  {
    category: 'tech',
    title: 'Frontend Developer',
    levelKey: 'beginner_intermediate' as const,
    durationNum: '4–6',
    skills: ['HTML / CSS', 'JavaScript', 'React', 'TypeScript'],
  },
  {
    category: 'tech',
    title: 'Backend Developer',
    levelKey: 'intermediate' as const,
    durationNum: '5–7',
    skills: ['Node.js', 'REST APIs', 'Databases', 'Authentication'],
  },
  {
    category: 'tech',
    title: 'Full Stack Developer',
    levelKey: 'intermediate_advanced' as const,
    durationNum: '6–8',
    skills: ['Frontend', 'Backend', 'DevOps', 'Deployment'],
  },
  {
    category: 'tech',
    title: 'Cyber Security',
    levelKey: 'intermediate_advanced' as const,
    durationNum: '6–9',
    skills: ['Networking', 'Linux', 'Ethical Hacking', 'CTF'],
  },
  {
    category: 'tech',
    title: 'Data Science',
    levelKey: 'intermediate' as const,
    durationNum: '6',
    skills: ['Python', 'Pandas', 'Machine Learning', 'Visualization'],
  },
  {
    category: 'tech',
    title: 'AI Engineer',
    levelKey: 'advanced' as const,
    durationNum: '8–12',
    skills: ['Deep Learning', 'NLP', 'PyTorch', 'LLMs'],
  },
  {
    category: 'tech',
    title: 'Mobile Developer',
    levelKey: 'beginner_intermediate' as const,
    durationNum: '5',
    skills: ['Flutter', 'React Native', 'iOS', 'Android'],
  },
  {
    category: 'tech',
    title: 'Game Developer',
    levelKey: 'intermediate' as const,
    durationNum: '6–8',
    skills: ['Unity', 'C#', '3D Modeling', 'Physics'],
  },
  {
    category: 'business',
    title: 'Digital Marketing',
    levelKey: 'beginner_intermediate' as const,
    durationNum: '3–4',
    skills: ['SEO', 'Google Ads', 'Content', 'Analytics'],
  },
  {
    category: 'business',
    title: 'Product Manager',
    levelKey: 'intermediate' as const,
    durationNum: '4–6',
    skills: ['Agile', 'UX Research', 'Roadmaps', 'Metrics'],
  },
  {
    category: 'business',
    title: 'Business Analyst',
    levelKey: 'beginner_intermediate' as const,
    durationNum: '3–5',
    skills: ['Excel', 'Power BI', 'SQL', 'Reporting'],
  },
  {
    category: 'business',
    title: 'Entrepreneurship',
    levelKey: 'intermediate' as const,
    durationNum: '4',
    skills: ['Startup', 'Finance', 'Growth', 'Pitch'],
  },
]

export function CareerPathsSection() {
  const locale = useLocale()
  const t = useTranslations('careerPaths')
  const isAr = locale === 'ar'
  const [activeCategory, setActiveCategory] = useState('tech')
  const Arrow = isAr ? ArrowLeft : ArrowRight

  const filtered = PATHS.filter(p => p.category === activeCategory)

  return (
    <section
      id="career-paths"
      dir={isAr ? 'rtl' : 'ltr'}
      className="dw-section"
    >
      <div className="dw-wrap">

        {/* Header */}
        <div className="dw-head">
          <span className="dw-eyebrow">
            <Sparkles size={14} aria-hidden="true" />
            {t('badge')}
          </span>
          <h2>{t('title')}</h2>
          <p>{t('subtitle')}</p>
        </div>

        {/* Category tabs */}
        <div className="dw-tabs" role="tablist">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              role="tab"
              aria-selected={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`dw-tab ${activeCategory === cat.id ? 'dw-tab-active' : ''}`}
            >
              {cat.icon}
              {t(cat.labelKey)}
            </button>
          ))}
        </div>

        {/* Tracks grid */}
        <div className="dw-tracks">
          {filtered.map((path, index) => (
            <article key={path.title} className="tcard">
              <span className="num">{String(index + 1).padStart(2, '0')}</span>

              <h3>{path.title}</h3>

              <div className="meta">
                <span className="level">
                  <Star size={12} aria-hidden="true" />
                  {t(path.levelKey)}
                </span>
                <span>
                  <Clock size={13} aria-hidden="true" />
                  {path.durationNum} {t('months')}
                </span>
              </div>

              <div className="tags">
                {path.skills.map((skill) => (
                  <span key={skill} className="tag">{skill}</span>
                ))}
              </div>

              <button
                onClick={() => {
                  window.location.href = `/${locale}/dashboard/assessment`
                }}
                className="btn btn-ghost btn-sm"
              >
                {t('start_path')}
                <Arrow size={16} aria-hidden="true" />
              </button>
            </article>
          ))}
        </div>

        {/* Bottom count + AI discover link */}
        <div className="dw-tracks-foot">
          <p>
            {filtered.length} {t('paths_available')}
          </p>
          <a
            href={`/${locale}/dashboard/assessment`}
            className="btn btn-primary btn-sm"
          >
            {t('discover_ai')}
            <Arrow size={16} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  )
}
