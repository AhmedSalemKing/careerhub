'use client'
import { useState, useRef } from 'react'
import { useLocale } from 'next-intl'
import { ArrowLeft, ArrowRight, ChevronRight, Sparkles, Code2, Briefcase, Clock, Star } from 'lucide-react'

const CATEGORIES = [
  { id: 'tech', labelAr: 'التقنية', labelEn: 'Technology', icon: <Code2 size={14} /> },
  { id: 'business', labelAr: 'إدارة الأعمال', labelEn: 'Business', icon: <Briefcase size={14} /> },
]

const PATHS = [
  {
    category: 'tech',
    titleAr: 'Frontend Developer',
    titleEn: 'Frontend Developer',
    levelAr: 'مبتدئ ← متوسط',
    duration: '4–6 شهور',
    skills: ['HTML / CSS', 'JavaScript', 'React', 'TypeScript'],
    color: '#5120c8',
  },
  {
    category: 'tech',
    titleAr: 'Backend Developer',
    titleEn: 'Backend Developer',
    levelAr: 'متوسط',
    duration: '5–7 شهور',
    skills: ['Node.js', 'REST APIs', 'Databases', 'Authentication'],
    color: '#2BBFA3',
  },
  {
    category: 'tech',
    titleAr: 'Full Stack Developer',
    titleEn: 'Full Stack Developer',
    levelAr: 'متوسط ← متقدم',
    duration: '6–8 شهور',
    skills: ['Frontend', 'Backend', 'DevOps', 'Deployment'],
    color: '#5120c8',
  },
  {
    category: 'tech',
    titleAr: 'Cyber Security',
    titleEn: 'Cyber Security',
    levelAr: 'متوسط ← متقدم',
    duration: '6–9 شهور',
    skills: ['Networking', 'Linux', 'Ethical Hacking', 'CTF'],
    color: '#F5A623',
  },
  {
    category: 'tech',
    titleAr: 'Data Science',
    titleEn: 'Data Science',
    levelAr: 'متوسط',
    duration: '6 شهور',
    skills: ['Python', 'Pandas', 'Machine Learning', 'Visualization'],
    color: '#2BBFA3',
  },
  {
    category: 'tech',
    titleAr: 'AI Engineer',
    titleEn: 'AI Engineer',
    levelAr: 'متقدم',
    duration: '8–12 شهر',
    skills: ['Deep Learning', 'NLP', 'PyTorch', 'LLMs'],
    color: '#5120c8',
  },
  {
    category: 'tech',
    titleAr: 'Mobile Developer',
    titleEn: 'Mobile Developer',
    levelAr: 'مبتدئ ← متوسط',
    duration: '5 شهور',
    skills: ['Flutter', 'React Native', 'iOS', 'Android'],
    color: '#2BBFA3',
  },
  {
    category: 'tech',
    titleAr: 'Game Developer',
    titleEn: 'Game Developer',
    levelAr: 'متوسط',
    duration: '6–8 شهور',
    skills: ['Unity', 'C#', '3D Modeling', 'Physics'],
    color: '#F5A623',
  },
  {
    category: 'business',
    titleAr: 'Digital Marketing',
    titleEn: 'Digital Marketing',
    levelAr: 'مبتدئ ← متوسط',
    duration: '3–4 شهور',
    skills: ['SEO', 'Google Ads', 'Content', 'Analytics'],
    color: '#5120c8',
  },
  {
    category: 'business',
    titleAr: 'Product Manager',
    titleEn: 'Product Manager',
    levelAr: 'متوسط',
    duration: '4–6 شهور',
    skills: ['Agile', 'UX Research', 'Roadmaps', 'Metrics'],
    color: '#2BBFA3',
  },
  {
    category: 'business',
    titleAr: 'Business Analyst',
    titleEn: 'Business Analyst',
    levelAr: 'مبتدئ ← متوسط',
    duration: '3–5 شهور',
    skills: ['Excel', 'Power BI', 'SQL', 'Reporting'],
    color: '#F5A623',
  },
  {
    category: 'business',
    titleAr: 'Entrepreneurship',
    titleEn: 'Entrepreneurship',
    levelAr: 'متوسط',
    duration: '4 شهور',
    skills: ['Startup', 'Finance', 'Growth', 'Pitch'],
    color: '#5120c8',
  },
]

export function CareerPathsSection() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [activeCategory, setActiveCategory] = useState('tech')
  const [expandedPath, setExpandedPath] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const filtered = PATHS.filter(p => p.category === activeCategory)

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' })
  }

  return (
    <section
      dir={isAr ? 'rtl' : 'ltr'}
      className="career-paths-section"
    >
      <div className="career-container">

        {/* Header */}
        <div className="career-header">
          <div className="career-badge">
            <Sparkles className="w-3 h-3" />
            <span>{isAr ? 'مسارات مهنية' : 'Career Paths'}</span>
          </div>

          <div className="career-title-row">
            <div>
              <h2 className="career-title">
                {isAr ? 'استكشف المسارات المهنية' : 'Explore Career Paths'}
              </h2>
              <p className="career-subtitle">
                {isAr
                  ? 'اختر مسارك وابدأ بخطة واضحة ومنظمة'
                  : 'Choose your path and start with a clear structured plan'}
              </p>
            </div>

            {/* Scroll buttons */}
            <div className="scroll-buttons">
              <button
                onClick={() => scroll(isAr ? 'right' : 'left')}
                className="scroll-btn"
                aria-label={isAr ? 'السابق' : 'Previous'}
              >
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => scroll(isAr ? 'left' : 'right')}
                className="scroll-btn"
                aria-label={isAr ? 'التالي' : 'Next'}
              >
                <ArrowLeft size={16} />
              </button>
            </div>
          </div>

          {/* Category tabs */}
          <div className="category-tabs">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setExpandedPath(null) }}
                className={`category-tab ${activeCategory === cat.id ? 'category-tab-active' : ''}`}
              >
                <span className="category-tab-icon">{cat.icon}</span>
                {isAr ? cat.labelAr : cat.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Paths scroll rail */}
        <div ref={scrollRef} className="paths-rail">
          {filtered.map((path, index) => {
            const isExpanded = expandedPath === index
            return (
              <div
                key={index}
                onClick={() => setExpandedPath(isExpanded ? null : index)}
                className={`path-card ${isExpanded ? 'path-card-expanded' : ''}`}
                style={{ '--path-color': path.color } as React.CSSProperties}
              >
                {/* Color dot */}
                <div className="path-color-dot" />

                {/* Number badge */}
                <span className="path-number">0{index + 1}</span>

                {/* Title */}
                <h3 className="path-title">{path.titleAr}</h3>

                {/* Meta */}
                <div className="path-meta">
                  <span className="path-meta-item">
                    <Star size={12} />
                    {path.levelAr}
                  </span>
                  <span className="path-meta-divider" />
                  <span className="path-meta-item">
                    <Clock size={12} />
                    {path.duration}
                  </span>
                </div>

                {/* Skills */}
                <div className="path-skills">
                  {path.skills.map((skill, si) => (
                    <div key={si} className="path-skill-item">
                      <div className="path-skill-dot" />
                      <span>{skill}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    window.location.href = `/${locale}/dashboard/assessment`
                  }}
                  className="path-cta"
                >
                  {isAr ? 'ابدأ المسار' : 'Start Path'}
                  <ChevronRight size={14} />
                </button>
              </div>
            )
          })}
        </div>

        {/* Bottom count */}
        <div className="paths-footer">
          <p className="paths-count">
            {filtered.length} {isAr ? 'مسار متاح' : 'paths available'}
          </p>
          <a
            href={`/${locale}/dashboard/assessment`}
            className="paths-discover-link"
          >
            {isAr ? 'اكتشف مسارك بالذكاء الاصطناعي' : 'Discover your path with AI'}
            <ArrowLeft size={14} />
          </a>
        </div>
      </div>

      <style jsx global>{`
        /* ════════════════════════════════════════
           CAREER PATHS SECTION — THEME VARIABLES
           ════════════════════════════════════════ */
        
        .career-paths-section {
          --cp-bg: #0D0D0D;
          --cp-fg: #F8F8FA;
          --cp-muted: #9CA3AF;
          --cp-border: rgba(255, 255, 255, 0.08);
          --cp-surface: #161616;
          --cp-surface-2: #1C1C1C;
          --cp-primary: #5120c8;
          --cp-primary-subtle: rgba(81, 32, 200, 0.15);
          --cp-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.25);
          --cp-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.35);
          --cp-grid-color: rgba(255, 255, 255, 0.02);

          padding: 80px 0;
          background: var(--cp-bg);
          border-top: 1px solid var(--cp-border);
          color: var(--cp-fg);
          position: relative;
          overflow: hidden;
        }

        :root:not(.dark) .career-paths-section {
          --cp-bg: #F8F8FA;
          --cp-fg: #1B2340;
          --cp-muted: #6B7280;
          --cp-border: rgba(27, 35, 64, 0.1);
          --cp-surface: #FFFFFF;
          --cp-surface-2: #F2F3F7;
          --cp-primary: #5120c8;
          --cp-primary-subtle: rgba(81, 32, 200, 0.08);
          --cp-shadow-sm: 0 1px 3px rgba(27, 35, 64, 0.08);
          --cp-shadow-md: 0 4px 12px rgba(27, 35, 64, 0.12);
          --cp-grid-color: rgba(27, 35, 64, 0.03);
        }

        /* Background Pattern */
        .career-paths-section::before {
          content: '';
          position: absolute;
          inset: 0;
          background-size: 50px 50px;
          background-image:
            linear-gradient(to right, var(--cp-grid-color) 1px, transparent 1px),
            linear-gradient(to bottom, var(--cp-grid-color) 1px, transparent 1px);
          mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 0%, transparent 100%);
          pointer-events: none;
          z-index: 0;
        }

        /* Container */
        .career-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          position: relative;
          z-index: 1;
        }

        /* ════════════════════════════════════════
           HEADER STYLES
           ════════════════════════════════════════ */
        
        .career-header {
          margin-bottom: 40px;
        }

        .career-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--cp-primary-subtle);
          border: 1px solid rgba(81, 32, 200, 0.2);
          border-radius: 100px;
          padding: 6px 14px;
          margin-bottom: 16px;
          font-size: 12px;
          font-weight: 600;
          color: var(--cp-primary);
          letter-spacing: 0.05em;
          font-family: "DM Sans", sans-serif;
        }
        .career-badge svg {
          width: 14px;
          height: 14px;
        }

        .career-title-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .career-title {
          font-family: "PingARLT", "Cairo", sans-serif;
          font-weight: 700;
          font-size: clamp(26px, 4vw, 36px);
          color: var(--cp-fg);
          margin: 0;
          line-height: 1.2;
        }

        .career-subtitle {
          color: var(--cp-muted);
          font-size: 15px;
          margin-top: 8px;
          font-family: "DM Sans", sans-serif;
          line-height: 1.6;
        }

        /* Scroll Buttons */
        .scroll-buttons {
          display: flex;
          gap: 8px;
        }

        .scroll-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          border: 1px solid var(--cp-border);
          background: var(--cp-surface);
          cursor: pointer;
          color: var(--cp-muted);
          transition: all 0.2s ease;
          box-shadow: var(--cp-shadow-sm);
        }
        .scroll-btn:hover {
          border-color: var(--cp-primary);
          background: var(--cp-primary-subtle);
          color: var(--cp-primary);
          transform: scale(1.05);
        }

        /* Category Tabs */
        .category-tabs {
          display: flex;
          gap: 8px;
          margin-top: 24px;
          flex-wrap: wrap;
        }

        .category-tab {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 22px;
          border-radius: 10px;
          border: 1px solid var(--cp-border);
          background: transparent;
          color: var(--cp-muted);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: "DM Sans", sans-serif;
        }
        .category-tab:hover {
          border-color: var(--cp-primary);
          color: var(--cp-primary);
          background: var(--cp-primary-subtle);
        }
        .category-tab-active {
          border-color: var(--cp-primary);
          background: var(--cp-primary-subtle);
          color: var(--cp-primary);
        }
        .category-tab-icon {
          display: flex;
          align-items: center;
        }

        /* ════════════════════════════════════════
           PATHS RAIL & CARDS
           ════════════════════════════════════════ */
        
        .paths-rail {
          display: flex;
          gap: 18px;
          overflow-x: auto;
          padding-bottom: 20px;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .paths-rail::-webkit-scrollbar {
          display: none;
        }

        .path-card {
          min-width: 270px;
          max-width: 270px;
          padding: 24px;
          border-radius: 18px;
          border: 1px solid var(--cp-border);
          background: var(--cp-surface);
          scroll-snap-align: start;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          transform: translateY(0);
          box-shadow: var(--cp-shadow-sm);
          position: relative;
          flex-shrink: 0;
          overflow: hidden;
        }
        .path-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--path-color);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .path-card:hover {
          transform: translateY(-6px);
          border-color: color-mix(in srgb, var(--path-color) 30%, transparent);
          background: var(--cp-surface-2);
          box-shadow: var(--cp-shadow-md), 0 0 30px color-mix(in srgb, var(--path-color) 10%, transparent);
        }
        .path-card:hover::before {
          opacity: 1;
        }

        .path-card-expanded {
          transform: translateY(-6px);
          border-color: color-mix(in srgb, var(--path-color) 40%, transparent);
          box-shadow: var(--cp-shadow-md), 0 0 30px color-mix(in srgb, var(--path-color) 15%, transparent);
        }
        .path-card-expanded::before {
          opacity: 1;
        }

        /* Color Dot */
        .path-color-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--path-color);
          margin-bottom: 18px;
          box-shadow: 0 0 12px var(--path-color);
        }

        /* Number Badge */
        .path-number {
          position: absolute;
          top: 18px;
          right: 18px;
          font-size: 2.5rem;
          font-weight: 900;
          color: var(--cp-border);
          line-height: 1;
          font-family: "PingARLT", "Arial Black", sans-serif;
          opacity: 0.4;
          transition: all 0.3s ease;
          pointer-events: none;
        }
        .path-card:hover .path-number,
        .path-card-expanded .path-number {
          opacity: 0.15;
          transform: scale(1.1);
        }

        /* Path Title */
        .path-title {
          font-family: "Plus Jakarta Sans", sans-serif;
          font-weight: 700;
          font-size: 17px;
          color: var(--cp-fg);
          margin: 0 0 8px;
          line-height: 1.3;
        }

        /* Meta Info */
        .path-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }
        .path-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: var(--cp-muted);
          font-family: "DM Sans", sans-serif;
        }
        .path-meta-item svg {
          width: 13px;
          height: 13px;
          opacity: 0.7;
        }
        .path-meta-divider {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: var(--cp-muted);
          opacity: 0.5;
        }

        /* Skills List */
        .path-skills {
          margin-bottom: 22px;
        }
        .path-skill-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 0;
          border-bottom: 1px solid var(--cp-border);
          transition: padding-left 0.2s ease;
        }
        .path-skill-item:last-child {
          border-bottom: none;
        }
        .path-card:hover .path-skill-item {
          padding-left: 4px;
        }
        .path-skill-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--path-color);
          opacity: 0.85;
          flex-shrink: 0;
          box-shadow: 0 0 6px var(--path-color);
        }
        .path-skill-item span {
          font-size: 13px;
          color: var(--cp-fg);
          font-family: "DM Sans", sans-serif;
        }

        /* CTA Button */
        .path-cta {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          color: var(--path-color);
          font-size: 13px;
          font-weight: 700;
          font-family: "DM Sans", sans-serif;
          transition: all 0.2s ease;
        }
        .path-cta:hover {
          gap: 10px;
        }
        .path-cta svg {
          transition: transform 0.2s ease;
        }
        .path-cta:hover svg {
          transform: translateX(3px);
        }

        /* ════════════════════════════════════════
           FOOTER
           ════════════════════════════════════════ */
        
        .paths-footer {
          margin-top: 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .paths-count {
          font-size: 13px;
          color: var(--cp-muted);
          font-family: "DM Sans", sans-serif;
        }

        .paths-discover-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: var(--cp-primary);
          text-decoration: none;
          font-family: "DM Sans", sans-serif;
          transition: all 0.2s ease;
          padding: 8px 16px;
          border-radius: 10px;
          background: var(--cp-primary-subtle);
          border: 1px solid rgba(81, 32, 200, 0.15);
        }
        .paths-discover-link:hover {
          gap: 12px;
          background: rgba(81, 32, 200, 0.12);
          border-color: rgba(81, 32, 200, 0.3);
        }

        /* Smooth transitions */
        .career-paths-section,
        .career-paths-section *,
        .career-paths-section *::before,
        .career-paths-section *::after {
          transition: background-color 0.3s ease,
                      border-color 0.3s ease,
                      color 0.3s ease,
                      box-shadow 0.3s ease;
        }

        /* Card animation on load */
        @keyframes pathReveal {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .path-card {
          animation: pathReveal 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: calc(var(--path-index, 0) * 0.08s);
          opacity: 0;
        }
      `}</style>
    </section>
  )
}