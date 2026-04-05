'use client'
import { useState, useRef } from 'react'
import { useLocale } from 'next-intl'
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react'

const CATEGORIES = [
  { id: 'tech', labelAr: 'التقنية', labelEn: 'Technology' },
  { id: 'business', labelAr: 'إدارة الأعمال', labelEn: 'Business' },
]

const PATHS = [
  // ── Technology ──────────────────────────
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
  // ── Business ─────────────────────────────
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
      style={{
        padding: '80px 0',
        // --- Shiny Black Background Logic ---
        background: '#050505', // أسود قاتم جداً يبدو أسود لامع
        backgroundImage: `
          radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.06) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.03) 0%, transparent 50%)
        `,
        backgroundAttachment: 'fixed', // لجعل الخلفية ثابتة ولامعة عند التمرير
        borderTop: '1px solid rgba(255, 255, 255, 0.08)', // حدود بيضاء باهتة جداً
        color: '#ffffff', // ضمان النص أبيض
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            // تعديل خلفية البadge لتكون متوافقة مع الأسود اللامع
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 100,
            padding: '6px 14px',
            marginBottom: 16,
            backdropFilter: 'blur(10px)', // تأثير زجاجي خفيف
          }}>
            <span style={{
              width: 6, height: 6,
              borderRadius: '50%',
              background: '#5120c8',
            }} />
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#E6E6E6',
              letterSpacing: '0.05em',
            }}>
              {isAr ? 'مسارات مهنية' : 'Career Paths'}
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}>
            <div>
              <h2 style={{
                fontFamily: 'MadinatAlBatt, Cairo, sans-serif',
                fontWeight: 700,
                fontSize: 'clamp(26px, 4vw, 36px)',
                color: '#ffffff',
                margin: 0,
                lineHeight: 1.2,
                textShadow: '0 0 20px rgba(255,255,255,0.1)', // لمعة خفيفة للنص
              }}>
                {isAr ? 'استكشف المسارات المهنية' : 'Explore Career Paths'}
              </h2>
              <p style={{
                color: 'rgba(255, 255, 255, 0.6)', // رمادي فاتح للنصوص الثانوية
                fontSize: 15,
                marginTop: 8,
                fontFamily: 'DM Sans, sans-serif',
              }}>
                {isAr
                  ? 'اختر مسارك وابدأ بخطة واضحة ومنظمة'
                  : 'Choose your path and start with a clear structured plan'}
              </p>
            </div>

            {/* Scroll buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => scroll(isAr ? 'right' : 'left')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 40, height: 40,
                  borderRadius: 10,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  cursor: 'pointer',
                  color: 'rgba(255, 255, 255, 0.7)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#5120c8'
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(81, 32, 200, 0.2)'
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#fff'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.03)'
                  ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255, 255, 255, 0.7)'
                }}
              >
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => scroll(isAr ? 'left' : 'right')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 40, height: 40,
                  borderRadius: 10,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  cursor: 'pointer',
                  color: 'rgba(255, 255, 255, 0.7)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#5120c8'
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(81, 32, 200, 0.2)'
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#fff'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.03)'
                  ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255, 255, 255, 0.7)'
                }}
              >
                <ArrowLeft size={16} />
              </button>
            </div>
          </div>

          {/* Category tabs */}
          <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setExpandedPath(null) }}
                style={{
                  padding: '8px 20px',
                  borderRadius: 8,
                  border: '1px solid',
                  borderColor: activeCategory === cat.id ? '#5120c8' : 'rgba(255, 255, 255, 0.1)',
                  background: activeCategory === cat.id ? 'rgba(81, 32, 200, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                  color: activeCategory === cat.id ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {isAr ? cat.labelAr : cat.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Paths scroll rail */}
        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            gap: 16,
            overflowX: 'auto',
            paddingBottom: 16,
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <style>{`
            div::-webkit-scrollbar { display: none; }
          `}</style>

          {filtered.map((path, index) => {
            const isExpanded = expandedPath === index
            return (
              <div
                key={index}
                onClick={() => setExpandedPath(isExpanded ? null : index)}
                style={{
                  minWidth: 260,
                  maxWidth: 260,
                  padding: 24,
                  borderRadius: 14,
                  border: '1px solid',
                  borderColor: isExpanded ? path.color + '40' : 'rgba(255, 255, 255, 0.08)',
                  // --- Card Background: Darker than shiny background to pop out ---
                  background: isExpanded ? path.color + '10' : '#0F0F0F', 
                  scrollSnapAlign: 'start',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: isExpanded ? 'translateY(-3px)' : 'translateY(0)',
                  boxShadow: isExpanded ? `0 8px 24px ${path.color}15` : '0 4px 6px rgba(0,0,0,0.3)',
                  position: 'relative',
                  flexShrink: 0,
                }}
                onMouseEnter={e => {
                  if (!isExpanded) {
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'
                    ;(e.currentTarget as HTMLDivElement).style.borderColor = path.color + '30'
                    ;(e.currentTarget as HTMLDivElement).style.background = '#141414' // Slightly lighter on hover
                  }
                }}
                onMouseLeave={e => {
                  if (!isExpanded) {
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
                    ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255, 255, 255, 0.08)'
                    ;(e.currentTarget as HTMLDivElement).style.background = '#0F0F0F'
                  }
                }}
              >
                {/* Color dot */}
                <div style={{
                  width: 8, height: 8,
                  borderRadius: '50%',
                  background: path.color,
                  marginBottom: 16,
                  boxShadow: `0 0 8px ${path.color}`,
                }} />

                {/* Title */}
                <h3 style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontWeight: 700,
                  fontSize: 17,
                  color: '#ffffff',
                  margin: '0 0 6px',
                  lineHeight: 1.3,
                }}>
                  {path.titleAr}
                </h3>

                {/* Meta */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 16,
                }}>
                  <span style={{
                    fontSize: 12,
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontFamily: 'DM Sans, sans-serif',
                  }}>
                    {path.levelAr}
                  </span>
                  <span style={{
                    width: 3, height: 3,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.3)',
                  }} />
                  <span style={{
                    fontSize: 12,
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontFamily: 'DM Sans, sans-serif',
                  }}>
                    {path.duration}
                  </span>
                </div>

                {/* Skills */}
                <div style={{ marginBottom: 20 }}>
                  {path.skills.map((skill, si) => (
                    <div key={si} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '4px 0',
                      borderBottom: si < path.skills.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    }}>
                      <div style={{
                        width: 4, height: 4,
                        borderRadius: '50%',
                        background: path.color,
                        opacity: 0.8,
                        flexShrink: 0,
                      }} />
                      <span style={{
                        fontSize: 13,
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontFamily: 'DM Sans, sans-serif',
                      }}>
                        {skill}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    window.location.href = `/${locale}/dashboard/assessment`
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: path.color,
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: 'DM Sans, sans-serif',
                    transition: 'gap 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.gap = '8px'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.gap = '4px'
                  }}
                >
                  {isAr ? 'ابدأ المسار' : 'Start Path'}
                  <ChevronRight size={14} />
                </button>
              </div>
            )
          })}
        </div>

        {/* Bottom count */}
        <div style={{
          marginTop: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <p style={{
            fontSize: 13,
            color: 'rgba(255, 255, 255, 0.5)',
            fontFamily: 'DM Sans, sans-serif',
          }}>
            {filtered.length} {isAr ? 'مسار متاح' : 'paths available'}
          </p>
          <a
            href={`/${locale}/dashboard/assessment`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              color: '#5120c8', // Purple CTA to stand out against black
              textDecoration: 'none',
              fontFamily: 'DM Sans, sans-serif',
              transition: 'gap 0.15s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.gap = '10px'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.gap = '6px'
            }}
          >
            {isAr ? 'اكتشف مسارك بالذكاء الاصطناعي' : 'Discover your path with AI'}
            <ArrowLeft size={14} />
          </a>
        </div>
      </div>
    </section>
  )
}