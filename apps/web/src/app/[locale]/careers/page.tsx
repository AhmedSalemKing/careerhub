'use client'

import { useState, useMemo, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search, Code2, Palette, TrendingUp, BarChart3, Shield, Settings,
  Briefcase, Package, ChevronRight, Clock, Star, DollarSign,
  Flame, Zap, Sparkles, ArrowLeft, Users, BookOpen, Globe, Megaphone, Rocket, Brain
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
  { key: 'all', labelAr: '╪º┘ä┘â┘ä', labelEn: 'All' },
  { key: 'Technology & Development', labelAr: '╪º┘ä╪¬┘é┘å┘è╪⌐', labelEn: 'Technology' },
  { key: 'Cybersecurity', labelAr: '╪º┘ä╪ú┘à┘å ╪º┘ä╪│┘è╪¿╪▒╪º┘å┘è', labelEn: 'Cybersecurity' },
  { key: 'Design & Creative', labelAr: '╪º┘ä╪¬╪╡┘à┘è┘à', labelEn: 'Design' },
  { key: 'Marketing & Sales', labelAr: '╪º┘ä╪¬╪│┘ê┘è┘é', labelEn: 'Marketing' },
  { key: 'Business & Management', labelAr: '╪Ñ╪»╪º╪▒╪⌐ ╪º┘ä╪ú╪╣┘à╪º┘ä', labelEn: 'Business' },
  { key: 'Hybrid Tech + Business', labelAr: '┘ç╪¼┘è┘å', labelEn: 'Hybrid' },
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
        background: isDark
          ? 'linear-gradient(180deg, rgba(81,32,200,0.12) 0%, transparent 100%)'
          : 'linear-gradient(180deg, rgba(81,32,200,0.05) 0%, transparent 100%)',
        borderBottom: `1px solid ${border}`,
        padding: '60px 24px 40px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth:800, margin:'0 auto' }}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:8,
            padding:'6px 16px', borderRadius:20,
            background:'rgba(81,32,200,0.08)',
            border:'1px solid rgba(81,32,200,0.2)',
            marginBottom:20,
          }}>
            <Sparkles size={14} color="#5120c8" />
            <span style={{ color:'#5120c8', fontSize:13, fontWeight:600 }}>
              {isAr ? '╪º╪│╪¬┘â╪┤┘ü ╪º┘ä┘à╪│╪º╪▒╪º╪¬ ╪º┘ä┘à┘ç┘å┘è╪⌐' : 'Explore Career Paths'}
            </span>
          </div>
          
          <h1 style={{ color:text, fontSize:'clamp(28px,4vw,42px)', fontWeight:900, margin:'0 0 16px', lineHeight:1.2 }}>
            {isAr ? '╪º╪¿┘å ┘à╪│╪¬┘é╪¿┘ä┘â ╪º┘ä┘à┘ç┘å┘è' : 'Build Your Career Future'}
          </h1>
          <p style={{ color:'#6b7280', fontSize:16, margin:'0 0 32px', lineHeight:1.7 }}>
            {isAr
              ? '╪º╪«╪¬╪▒ ┘à╪│╪º╪▒┘â ╪º┘ä┘à┘ç┘å┘è ┘à┘å ╪¿┘è┘å ╪ú┘â╪½╪▒ ┘à┘å 30 ┘à╪│╪º╪▒╪º ┘à╪¬╪«╪╡╪╡╪º ┘ê╪º╪¿╪»╪ú ╪¿╪«╪╖╪⌐ ┘ê╪º╪╢╪¡╪⌐ ┘ê┘à┘å╪╕┘à╪⌐'
              : 'Choose your career path from 30+ specialized paths and start with a clear structured plan'}
          </p>
          
          {/* Stats row */}
          <div style={{ display:'flex', justifyContent:'center', gap:32, flexWrap:'wrap', marginBottom:32 }}>
            {[
              { value: allPaths.length.toString(), labelAr:'┘à╪│╪º╪▒ ┘à╪¬╪º╪¡', labelEn:'Paths Available' },
              { value: CAREER_PATHS.length.toString(), labelAr:'╪¬╪«╪╡╪╡╪º╪¬', labelEn:'Specializations' },
              { value: '100%', labelAr:'┘à╪¼╪º┘å┘è ┘ä┘ä╪º╪│╪¬┘â╪┤╪º┘ü', labelEn:'Free to Explore' },
            ].map((stat, i) => (
              <div key={i} style={{ textAlign:'center' }}>
                <div style={{ color:'#5120c8', fontSize:28, fontWeight:900 }}>{stat.value}</div>
                <div style={{ color:'#6b7280', fontSize:13 }}>{isAr ? stat.labelAr : stat.labelEn}</div>
              </div>
            ))}
          </div>
          
          {/* Search bar */}
          <div style={{ position:'relative', maxWidth:480, margin:'0 auto' }}>
            <Search size={16} color="#6b7280" style={{
              position:'absolute', top:'50%', transform:'translateY(-50%)',
              right: isAr ? 16 : 'auto', left: isAr ? 'auto' : 16,
            }} />
            <input
              type="text"
              placeholder={isAr ? '╪º╪¿╪¡╪½ ╪╣┘å ┘à╪│╪º╪▒ ╪ú┘ê ┘à┘ç╪º╪▒╪⌐...' : 'Search paths or skills...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width:'100%', padding: isAr ? '14px 44px 14px 16px' : '14px 16px 14px 44px',
                borderRadius:14, border:`1px solid ${border}`,
                background: cardBg, color:text,
                fontSize:14, outline:'none',
                boxSizing:'border-box',
              }}
            />
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
          {isAr ? `${filteredPaths.length} ┘à╪│╪º╪▒ ┘à╪¬╪º╪¡` : `${filteredPaths.length} paths available`}
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
                        ? (isAr?'╪╖┘ä╪¿ ┘à╪▒╪¬┘ü╪╣':'High')
                        : (isAr?'╪╖┘ä╪¿ ╪¼┘è╪»':'Good')}
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
                      {path.salary} {isAr?'╪▒.╪│':'SAR'}
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
                  {isAr ? '╪º╪¿╪»╪ú ╪º┘ä┘à╪│╪º╪▒' : 'Start Path'}
                  <ChevronRight size={15} style={{ transform: isAr?'rotate(180deg)':'none' }} />
                </button>
              </div>
            )
          })}
        </div>
        
        {/* Bottom CTA */}
        <div style={{
          marginTop:60, padding:'48px 32px', borderRadius:24,
          background: isDark
            ? 'linear-gradient(135deg, rgba(81,32,200,0.15), rgba(43,191,163,0.08))'
            : 'linear-gradient(135deg, rgba(81,32,200,0.06), rgba(43,191,163,0.04))',
          border:`1px solid ${isDark?'rgba(81,32,200,0.2)':'rgba(81,32,200,0.15)'}`,
          textAlign:'center',
        }}>
          <div style={{ maxWidth:500, margin:'0 auto' }}>
            <div style={{
              width:56, height:56, borderRadius:16, margin:'0 auto 16px',
              background:'rgba(81,32,200,0.1)',
              display:'flex', alignItems:'center', justifyContents:'center',
            }}>
              <Sparkles size={24} color="#5120c8" />
            </div>
            <h2 style={{ color:text, fontSize:22, fontWeight:800, margin:'0 0 12px' }}>
              {isAr ? '┘à╪┤ ╪╣╪º╪▒┘ü ╪¬╪«╪¬╪º╪▒' : "Not sure which path?"}
            </h2>
            <p style={{ color:'#6b7280', fontSize:14, margin:'0 0 24px', lineHeight:1.7 }}>
              {isAr
                ? '╪º╪╣┘à┘ä ╪º┘ä╪º╪«╪¬╪¿╪º╪▒ ╪º┘ä╪░┘â┘è ┘ê╪º╪¡┘å╪º ┘ç┘å╪▒╪┤╪¡ ┘ä┘â ╪º┘ä┘à╪│╪º╪▒ ╪º┘ä╪ú┘å╪│╪¿ ╪¿┘å╪º╪í ╪╣┘ä┘ë ┘à┘ç╪º╪▒╪º╪¬┘â ┘ê╪º┘ç╪¬┘à╪º┘à╪º╪¬┘â'
                : 'Take the AI assessment and we\'ll recommend the best path based on your skills and interests'}
            </p>
            <Link href={`/${locale}/dashboard/assessment`}>
              <button style={{
                padding:'14px 32px', borderRadius:14,
                background:'#5120c8', color:'#fff', border:'none', cursor:'pointer',
                fontSize:14, fontWeight:700,
                boxShadow:'0 4px 20px rgba(81,32,200,0.3)',
                display:'inline-flex', alignItems:'center', gap:8,
              }}>
                <Sparkles size={16} />
                {isAr ? '╪º┘â╪¬╪┤┘ü ┘à╪│╪º╪▒┘â ╪¿╪º┘ä╪░┘â╪º╪í ╪º┘ä╪º╪╡╪╖┘å╪º╪╣┘è' : 'Discover Your Path with AI'}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
