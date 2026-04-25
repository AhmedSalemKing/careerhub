'use client'

import { useState, useMemo, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search, Code2, Palette, TrendingUp, BarChart3, Shield, Settings,
  Briefcase, Package, ChevronRight, Clock, Star, DollarSign,
  Flame, Zap, Sparkles, ArrowLeft, Users, BookOpen, Globe, Megaphone, Rocket, Brain, X
} from 'lucide-react'
import { CAREER_PATHS } from '@/lib/career-paths'

const ICON_MAP: Record<string, React.ElementType> = {
  code: Code2,
  palette: Palette,
  marketing: TrendingUp,
  data: BarChart3,
  shield: Shield,
  devops: Settings,
  product: Package,
  business: Briefcase,
  cloud: Globe,
  megaphone: Megaphone,
  rocket: Rocket,
  brain: Brain,
}

const CATEGORIES = [
  { key: 'all', labelAr: 'الكل', labelEn: 'All' },
  { key: 'Technology & Development', labelAr: 'التقنية', labelEn: 'Technology' },
  { key: 'Cybersecurity', labelAr: 'الأمن السيبراني', labelEn: 'Cybersecurity' },
  { key: 'Design & Creative', labelAr: 'التصميم', labelEn: 'Design' },
  { key: 'Marketing & Sales', labelAr: 'التسويق', labelEn: 'Marketing' },
  { key: 'Business & Management', labelAr: 'إدارة الأعمال', labelEn: 'Business' },
  { key: 'Hybrid Tech + Business', labelAr: 'هجين', labelEn: 'Hybrid' },
]

export default function CareersPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()
  
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set())
  
  const allPaths = useMemo(() => {
    return CAREER_PATHS.flatMap(cat => 
      cat.paths.map(path => ({ ...path, category: cat.category, icon: cat.icon }))
    )
  }, [])
  
  const filteredPaths = useMemo(() => {
    return allPaths.filter(path => {
      const matchCategory = activeCategory === 'all' || path.category === activeCategory
      const query = searchQuery.toLowerCase()
      const matchSearch = !query || 
        path.titleAr?.toLowerCase().includes(query) ||
        path.titleEn?.toLowerCase().includes(query) ||
        path.skills?.some(s => s.toLowerCase().includes(query))
      return matchCategory && matchSearch
    })
  }, [allPaths, activeCategory, searchQuery])
  
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleId = 'careers-animation-styles'
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style')
        style.id = styleId
        style.textContent = `
          @keyframes cardReveal {
            from { opacity: 0; transform: translateY(24px) scale(0.97); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .career-card {
            opacity: 0;
            transform: translateY(24px) scale(0.97);
            transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease !important;
          }
          .career-card-visible {
            animation: cardReveal 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .career-card-visible:nth-child(1) { animation-delay: 0s; }
          .career-card-visible:nth-child(2) { animation-delay: 0.06s; }
          .career-card-visible:nth-child(3) { animation-delay: 0.12s; }
          .career-card-visible:nth-child(4) { animation-delay: 0.18s; }
          .career-card-visible:nth-child(5) { animation-delay: 0.24s; }
          .career-card-visible:nth-child(6) { animation-delay: 0.30s; }
          .career-card-visible:nth-child(7) { animation-delay: 0.36s; }
          .career-card-visible:nth-child(8) { animation-delay: 0.42s; }
          .career-card-visible:nth-child(9) { animation-delay: 0.48s; }
          .career-card-visible:nth-child(n+10) { animation-delay: 0.54s; }
        `
        document.head.appendChild(style)
      }
    }
    
    const cards = document.querySelectorAll('.career-card')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('career-card-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )
    cards.forEach(card => observer.observe(card))
    return () => observer.disconnect()
  }, [filteredPaths])
  
  const bg = isDark ? '#0d0d0d' : '#f8fafc'
  const cardBg = isDark ? '#111111' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'
  const text = isDark ? '#f1f5f9' : '#0d0d0d'
  
  return (
    <div style={{ minHeight:'100vh', background:bg, direction:isAr?'rtl':'ltr' }}>
      
      {/* Hero Section */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '80px 24px 60px',
        borderBottom: `1px solid ${border}`,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: isDark
            ? 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)'
            : 'linear-gradient(rgba(81,32,200,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(81,32,200,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 0%, transparent 100%)',
        }} />
        <div style={{
          position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 300,
          background: 'radial-gradient(ellipse, rgba(81,32,200,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 20px', borderRadius: 100,
            background: isDark ? 'rgba(81,32,200,0.12)' : 'rgba(81,32,200,0.08)',
            border: '1px solid rgba(81,32,200,0.25)',
            marginBottom: 28,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#5120c8' }} />
            <span style={{ color: '#5120c8', fontSize: 13, fontWeight: 700, letterSpacing: '0.03em' }}>
              {isAr ? 'استكشف المسارات المهنية' : 'Explore Career Paths'}
            </span>
            <Sparkles size={13} color="#5120c8" />
          </div>
          <h1 style={{
            color: text,
            fontSize: 'clamp(32px, 5vw, 52px)',
            fontWeight: 900,
            margin: '0 0 20px',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
          }}>
            {isAr ? (
              <><span style={{ color: '#5120c8' }}>مستقبلك</span> المهني</>
            ) : (
              <>Build Your <span style={{ color: '#5120c8' }}>Career</span> Future</>
            )}
          </h1>
          <p style={{
            color: '#6b7280', fontSize: 16, margin: '0 0 40px',
            lineHeight: 1.75, maxWidth: 540, marginLeft: 'auto', marginRight: 'auto',
          }}>
            {isAr
              ? 'اختر من بين أكثر من 100 مسار مهني متخصص مع تفاصيل المهام والرواتب والمهارات المطلوبة'
              : 'Choose from 100+ specialized career paths with tasks, salaries and required skills'}
          </p>
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 0,
            marginBottom: 36,
            background: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
            border: `1px solid ${border}`,
            borderRadius: 16, overflow: 'hidden',
            maxWidth: 480, margin: '0 auto 36px',
            boxShadow: isDark ? 'none' : '0 2px 16px rgba(0,0,0,0.06)',
          }}>
            {[
              { value: allPaths.length.toString(), labelAr: 'مسار متاح', labelEn: 'Paths' },
              { value: CAREER_PATHS.length.toString(), labelAr: 'تخصصات', labelEn: 'Specializations' },
              { value: '100%', labelAr: 'مجاني', labelEn: 'Free' },
            ].map((stat, i) => (
              <div key={i} style={{
                flex: 1, padding: '18px 12px', textAlign: 'center',
                borderRight: i < 2 ? `1px solid ${border}` : 'none',
              }}>
                <div style={{ color: '#5120c8', fontSize: 24, fontWeight: 900, lineHeight: 1 }}>
                  {stat.value}
                </div>
                <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4, fontWeight: 500 }}>
                  {isAr ? stat.labelAr : stat.labelEn}
                </div>
              </div>
            ))}
          </div>
          <div style={{ position: 'relative', maxWidth: 520, margin: '0 auto' }}>
            <div style={{
              position: 'absolute', top: '50%', transform: 'translateY(-50%)',
              right: isAr ? 18 : 'auto', left: isAr ? 'auto' : 18,
              display: 'flex', alignItems: 'center',
            }}>
              <Search size={17} color="#9ca3af" />
            </div>
            <input
              type="text"
              placeholder={isAr ? 'ابحث عن مسار أو مهارة...' : 'Search paths or skills...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: isAr ? '16px 52px 16px 56px' : '16px 56px 16px 52px',
                borderRadius: 14,
                border: `1.5px solid ${searchQuery ? 'rgba(81,32,200,0.4)' : border}`,
                background: isDark ? '#111111' : '#ffffff',
                color: text, fontSize: 15, outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
                boxShadow: isDark ? 'none' : '0 2px 16px rgba(0,0,0,0.06)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                  left: isAr ? 'auto' : 18, right: isAr ? 18 : 'auto',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#9ca3af', display: 'flex', alignItems: 'center',
                }}>
                <X size={16} />
              </button>
            )}
            {!searchQuery && (
              <kbd style={{
                position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                left: isAr ? 'auto' : 18, right: isAr ? 18 : 'auto',
                background: isDark ? 'rgba(255,255,255,0.06)' : '#f4f4f8',
                border: `1px solid ${border}`,
                borderRadius: 6, padding: '2px 8px',
                fontSize: 11, color: '#9ca3af', fontFamily: 'monospace',
              }}>
                /
              </kbd>
            )}
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 24px' }}>
        
        {/* Category tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:28, flexWrap:'wrap' }}>
          {CATEGORIES.map(cat => (
            <button key={cat.key} onClick={() => setActiveCategory(cat.key)} style={{
              padding:'10px 22px', borderRadius:12, border:'none', cursor:'pointer',
              fontSize:13, fontWeight:700,
              background: activeCategory===cat.key ? '#5120c8' : isDark?'rgba(255,255,255,0.06)':'#f4f4f8',
              color: activeCategory===cat.key ? '#fff' : '#6b7280',
              transition:'all 0.2s',
            }}>
              {isAr ? cat.labelAr : cat.labelEn}
              {activeCategory===cat.key && (
                <span style={{ marginRight:isAr?0:6, marginLeft:isAr?6:0, opacity:0.8 }}>
                  ({filteredPaths.length})
                </span>
              )}
            </button>
          ))}
        </div>
        
        {/* Results count */}
        <div style={{ color:'#6b7280', fontSize:14, marginBottom:20 }}>
          {isAr ? `${filteredPaths.length} مسار متاح` : `${filteredPaths.length} paths available`}
        </div>
        
        {/* Paths grid */}
        <div key={`grid-${activeCategory}-${searchQuery}`} style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))',
          gap:20,
        }}>
          {filteredPaths.map((path, idx) => {
            const IconComp = ICON_MAP[path.icon] || Briefcase
            
            return (
              <div key={path.id} className="career-card" style={{
                background: cardBg,
                borderRadius:20,
                border:`1px solid ${border}`,
                padding:24,
                cursor:'pointer',
                position:'relative',
                overflow:'hidden',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(81,32,200,0.4)'
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(81,32,200,0.1)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = border
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.transform = 'translateY(0)'
              }}>
                
                {/* Top accent line */}
                <div style={{
                  position:'absolute', top:0, right:0, left:0, height:3,
                  background:'linear-gradient(90deg, #5120c8, #2BBFA3)',
                  borderRadius:'20px 20px 0 0',
                }} />
                
                {/* Header */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{
                      width:44, height:44, borderRadius:12,
                      background:'rgba(81,32,200,0.1)',
                      display:'flex', alignItems:'center', justifyContents:'center',
                    }}>
                      <IconComp size={22} color="#5120c8" />
                    </div>
                    <div>
                      <div style={{ color:'#6b7280', fontSize:11, fontWeight:600, marginBottom:2 }}>
                        {String(idx + 1).padStart(2, '0')}
                      </div>
                      <h3 style={{ color:text, fontSize:16, fontWeight:800, margin:0 }}>
                        {isAr ? path.titleAr : path.titleEn}
                      </h3>
                    </div>
                  </div>
                  
                  {/* Demand badge */}
                  <div style={{
                    display:'flex', alignItems:'center', gap:4,
                    padding:'4px 10px', borderRadius:20,
                    background: (path.demand || '').toLowerCase().includes('very') ? 'rgba(22,163,74,0.1)' : 'rgba(245,158,11,0.1)',
                    border: `1px solid ${(path.demand || '').toLowerCase().includes('very')?'rgba(22,163,74,0.2)':'rgba(245,158,11,0.2)'}`,
                  }}>
                    {(path.demand || '').toLowerCase().includes('very')
                      ? <Flame size={11} color="#16a34a" />
                      : <Zap size={11} color="#d97706" />}
                    <span style={{
                      color: (path.demand || '').toLowerCase().includes('very')?'#16a34a':'#d97706',
                      fontSize:11, fontWeight:700,
                    }}>
                      {(path.demand || '').toLowerCase().includes('very')
                        ? (isAr?'طلب مرتفع':'High')
                        : (isAr?'طلب جيد':'Good')}
                    </span>
                  </div>
                </div>
                
                {/* Description */}
                <p style={{
                  color:'#6b7280', fontSize:13, lineHeight:1.6,
                  margin:'0 0 16px',
                  display:'-webkit-box',
                  WebkitLineClamp:2,
                  WebkitBoxOrient:'vertical',
                  overflow:'hidden',
                }}>
                  {isAr ? path.descriptionAr : path.descriptionEn}
                </p>
                
                {/* Meta row */}
                <div style={{ display:'flex', gap:16, marginBottom:16 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <Star size={13} color="#6b7280" />
                    <span style={{ color:'#6b7280', fontSize:12 }}>
                      {path.level || 'All Levels'}
                    </span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <DollarSign size={13} color="#5120c8" />
                    <span style={{ color:'#5120c8', fontSize:12, fontWeight:700 }}>
                      {path.salary} {isAr?'ر.س':'SAR'}
                    </span>
                  </div>
                </div>
                
                {/* Skills chips */}
                {path.skills && path.skills.length > 0 && (
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:18 }}>
                    {path.skills.slice(0,4).map((skill, i) => (
                      <span key={i} style={{
                        padding:'4px 10px', borderRadius:20,
                        background: isDark?'rgba(255,255,255,0.05)':'#f4f4f8',
                        border:`1px solid ${border}`,
                        color:'#6b7280', fontSize:11, fontWeight:600,
                      }}>
                        {skill}
                      </span>
                    ))}
                    {path.skills.length > 4 && (
                      <span style={{
                        padding:'4px 10px', borderRadius:20,
                        background:'rgba(81,32,200,0.06)',
                        border:'1px solid rgba(81,32,200,0.15)',
                        color:'#5120c8', fontSize:11, fontWeight:600,
                      }}>
                        +{path.skills.length - 4}
                      </span>
                    )}
                  </div>
                )}
                
                {/* Progression preview */}
                {path.progression && path.progression.length > 0 && (
                  <div style={{
                    padding:'10px 14px', borderRadius:10,
                    background: isDark?'rgba(255,255,255,0.03)':'#f8fafc',
                    border:`1px solid ${border}`,
                    marginBottom:18, fontSize:12, color:'#6b7280',
                    display:'flex', alignItems:'center', gap:6,
                  }}>
                    <Users size={12} color="#6b7280" />
                    <span style={{ overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
                      {path.progression.join('  ')}
                    </span>
                  </div>
                )}
                
                {/* CTA Button */}
                <button
                  onClick={() => router.push(`/${locale}/dashboard/career-path?path=${path.id}`)}
                  style={{
                    width:'100%', padding:'12px', borderRadius:12,
                    background:'#5120c8', color:'#fff', border:'none', cursor:'pointer',
                    fontSize:13, fontWeight:700,
                    display:'flex', alignItems:'center', justifyContents:'center', gap:6,
                    boxShadow:'0 4px 12px rgba(81,32,200,0.25)',
                    transition:'opacity 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity='0.9'}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity='1'}
                >
                  {isAr ? 'ابدأ المسار' : 'Start Path'}
                  <ChevronRight size={15} style={{ transform: isAr?'rotate(180deg)':'none' }} />
                </button>
              </div>
            )
          })}
        </div>
        
        {/* Bottom CTA */}
        <div style={{ marginTop: 64, position: 'relative', overflow: 'hidden' }}>
          <div style={{
            borderRadius: 24, overflow: 'hidden',
            background: isDark
              ? 'linear-gradient(135deg, #1a0a3c 0%, #0d1f3c 50%, #0a2a1a 100%)'
              : 'linear-gradient(135deg, #f5f0ff 0%, #eff6ff 50%, #f0fdf4 100%)',
            border: `1px solid ${isDark ? 'rgba(81,32,200,0.2)' : 'rgba(81,32,200,0.12)'}`,
            padding: '56px 32px',
            textAlign: 'center',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: -60, right: -60,
              width: 200, height: 200, borderRadius: '50%',
              background: 'rgba(81,32,200,0.08)',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', bottom: -40, left: -40,
              width: 150, height: 150, borderRadius: '50%',
              background: 'rgba(43,191,163,0.06)',
              pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative', zIndex: 1, maxWidth: 560, margin: '0 auto' }}>
              <div style={{
                width: 64, height: 64, borderRadius: 18, margin: '0 auto 24px',
                background: 'rgba(81,32,200,0.1)',
                border: '1px solid rgba(81,32,200,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 30px rgba(81,32,200,0.15)',
              }}>
                <Sparkles size={26} color="#5120c8" />
              </div>
              <h2 style={{
                color: text, fontSize: 26, fontWeight: 900,
                margin: '0 0 12px', letterSpacing: '-0.02em',
              }}>
                {isAr ? 'مش عارف تختار مسارك' : "Not Sure Which Path?"}
              </h2>
              <p style={{
                color: '#6b7280', fontSize: 15, margin: '0 0 32px', lineHeight: 1.75,
              }}>
                {isAr
                  ? 'اعمل الاختبار الذكي في 5 دقائق وهنرشح لك المسار الأنسب بناء على مهاراتك واهتماماتك وخبرتك'
                  : "Take the 5-minute AI assessment and we'll recommend the perfect path based on your skills and interests"}
              </p>
              <Link href={`/${locale}/dashboard/assessment`}>
                <button style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  padding: '16px 36px', borderRadius: 14,
                  background: '#5120c8', color: '#fff', border: 'none', cursor: 'pointer',
                  fontSize: 15, fontWeight: 700,
                  boxShadow: '0 8px 24px rgba(81,32,200,0.35)',
                  transition: 'all 0.2s ease',
                  letterSpacing: '-0.01em',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'
                  ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 32px rgba(81,32,200,0.45)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
                  ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(81,32,200,0.35)'
                }}>
                  <Sparkles size={17} />
                  {isAr ? 'اكتشف مسارك بالذكاء الاصطناعي' : 'Discover Your Path with AI'}
                  <ArrowLeft size={16} style={{ transform: isAr ? 'none' : 'rotate(180deg)' }} />
                </button>
              </Link>
              <p style={{ color: '#9ca3af', fontSize: 12, marginTop: 16 }}>
                {isAr ? 'مجاني جدا لا يتطلب بطاقة ائتمانية' : 'Completely free  no credit card required'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}