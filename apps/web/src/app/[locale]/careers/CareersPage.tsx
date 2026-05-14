'use client'

import { useState, useMemo, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search, Code2, Palette, TrendingUp, BarChart3, Shield, Settings,
  Briefcase, Package, ChevronRight, Clock, Star, DollarSign,
  Flame, Zap, Sparkles, ArrowLeft, Users, BookOpen, Globe, Megaphone, Rocket, Brain,
  X, CheckCircle2
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
  { key: 'all', labelAr: '????', labelEn: 'All' },
  { key: 'Technology & Development', labelAr: '???????', labelEn: 'Technology' },
  { key: 'Cybersecurity', labelAr: '????? ?????????', labelEn: 'Cybersecurity' },
  { key: 'Design & Creative', labelAr: '???????', labelEn: 'Design' },
  { key: 'Marketing & Sales', labelAr: '???????', labelEn: 'Marketing' },
  { key: 'Business & Management', labelAr: '???????', labelEn: 'Business' },
  { key: 'Hybrid Tech + Business', labelAr: '??????', labelEn: 'Hybrid' },
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
  const [detailPath, setDetailPath] = useState<any>(null)
  const [detailTab, setDetailTab] = useState<'tasks'|'skills'|'qualifications'|'progression'>('tasks')
  
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
  const subtext = isDark ? '#94a3b8' : '#6b7280'
  const textMuted = isDark ? '#64748b' : '#9ca3af'
  
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
              {isAr ? '????? ?????? ?????' : 'Explore Career Paths'}
            </span>
          </div>
          
          <h1 style={{ color:text, fontSize:'clamp(28px,4vw,42px)', fontWeight:900, margin:'0 0 16px', lineHeight:1.2 }}>
            {isAr ? '??? ??????? ??????' : 'Build Your Career Future'}
          </h1>
          <p style={{ color:'#6b7280', fontSize:16, margin:'0 0 32px', lineHeight:1.7 }}>
            {isAr
              ? '???? ????? ?? ???? ?? 30 ???? ????? ???? ????? ??????'
              : 'Choose your career path from 30+ specialized paths and start with a clear structured plan'}
          </p>
          
          {/* Stats row */}
          <div style={{ display:'flex', justifyContent:'center', gap:32, flexWrap:'wrap', marginBottom:32 }}>
            {[
              { value: allPaths.length.toString(), labelAr:'???? ????', labelEn:'Paths Available' },
              { value: CAREER_PATHS.length.toString(), labelAr:'????', labelEn:'Specializations' },
              { value: '100%', labelAr:'????? ?????????', labelEn:'Free to Explore' },
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
              placeholder={isAr ? '???? ?? ???? ?? ?????...' : 'Search paths or skills...'}
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
          {isAr ? `${filteredPaths.length} ???? ????` : `${filteredPaths.length} paths available`}
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
                      display:'flex', alignItems:'center', justifyContent:'center',
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
                        ? (isAr?'??? ????':'High')
                        : (isAr?'??? ???':'Good')}
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
                      {path.salary} {isAr?'?.?':'SAR'}
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
                
                {/* CTA Buttons */}
                <div style={{ display:'flex', gap:8, marginTop:'auto' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDetailPath(path); setDetailTab('tasks') }}
                    style={{
                      flex:1, padding:'10px', borderRadius:10,
                      background:'transparent',
                      border:`1px solid ${border}`,
                      color:subtext, cursor:'pointer', fontSize:13, fontWeight:600,
                      transition:'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(81,32,200,0.3)'; e.currentTarget.style.color='#5120c8' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor=border; e.currentTarget.style.color=subtext }}>
                    {isAr ? '????????' : 'Details'}
                  </button>
                  <button
                    onClick={() => {
                      try {
                        const saved = localStorage.getItem('selectedCareerPaths')
                        const current: string[] = saved ? JSON.parse(saved) : []
                        if (!current.includes(path.id)) {
                          localStorage.setItem('selectedCareerPaths', JSON.stringify([...current, path.id].slice(0,5)))
                        }
                      } catch(e) {}
                      router.push(`/${locale}/dashboard/career-path`)
                    }}
                    style={{
                      flex:1, padding:'10px', borderRadius:10,
                      background:'#5120c8', color:'#ffffff',
                      border:'none', cursor:'pointer', fontSize:13, fontWeight:700,
                      display:'flex', alignItems:'center', justifyContent:'center', gap:5,
                      transition:'opacity 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity='0.88'}
                    onMouseLeave={e => e.currentTarget.style.opacity='1'}>
                    <ChevronRight size={14} style={{ transform: isAr?'rotate(180deg)':'none' }} />
                    {isAr ? '???? ??????' : 'Start Path'}
                  </button>
                </div>
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
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <Sparkles size={24} color="#5120c8" />
            </div>
            <h2 style={{ color:text, fontSize:22, fontWeight:800, margin:'0 0 12px' }}>
              {isAr ? '?? ????? ??????? ??' : "Not sure which path?"}
            </h2>
            <p style={{ color:'#6b7280', fontSize:14, margin:'0 0 24px', lineHeight:1.7 }}>
              {isAr
                ? '????? ?????? ????????? ?????? ?? ???? ???? ????? ??? ??????? ??????????'
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
                {isAr ? '????? ????? ??????? ?????????' : 'Discover Your Path with AI'}
              </button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Detail Panel */}
      {detailPath && (
        <>
          <div
            onClick={() => setDetailPath(null)}
            style={{
              position:'fixed', inset:0, background:'rgba(0,0,0,0.5)',
              zIndex:100, backdropFilter:'blur(4px)',
            }}
          />
          
          <div style={{
            position:'fixed', top:0, bottom:0,
            right: isAr ? 0 : 'auto', left: isAr ? 'auto' : 0,
            width: Math.min(520, window.innerWidth),
            background: cardBg,
            borderLeft: isAr ? 'none' : `1px solid ${border}`,
            borderRight: isAr ? `1px solid ${border}` : 'none',
            zIndex:101, display:'flex', flexDirection:'column',
            overflowY:'auto',
            animation: 'slideIn 0.25s ease',
          }}>
            <style>{`
              @keyframes slideIn {
                from { transform: translateX(${isAr ? '100%' : '-100%'}); opacity: 0; }
                to   { transform: translateX(0); opacity: 1; }
              }
            `}</style>
            
            <div style={{
              padding:'20px 24px', borderBottom:`1px solid ${border}`,
              display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12,
              position:'sticky', top:0, background:cardBg, zIndex:10,
            }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                  {(() => { const IconComp = ICON_MAP[detailPath.icon] || Briefcase; return <IconComp size={18} color="#5120c8" /> })()}
                  <h2 style={{ color:text, fontSize:18, fontWeight:900, margin:0, letterSpacing:'-0.02em' }}>
                    {isAr ? detailPath.titleAr : detailPath.titleEn}
                  </h2>
                </div>
                <p style={{ color:subtext, fontSize:13, margin:0, lineHeight:1.6 }}>
                  {isAr ? detailPath.descriptionAr : detailPath.descriptionEn}
                </p>
              </div>
              <button onClick={() => setDetailPath(null)} style={{
                width:32, height:32, borderRadius:8, flexShrink:0,
                border:`1px solid ${border}`, background:'transparent',
                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:subtext,
              }}>
                <X size={16} />
              </button>
            </div>
            
            <div style={{ padding:'16px 24px', borderBottom:`1px solid ${border}`, display:'flex', gap:12 }}>
              <div style={{
                flex:1, padding:'14px', borderRadius:12,
                border:'1px solid rgba(81,32,200,0.2)',
                background: isDark?'rgba(81,32,200,0.08)':'rgba(81,32,200,0.04)',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:4 }}>
                  <DollarSign size={13} color="#5120c8" />
                  <span style={{ color:subtext, fontSize:11, fontWeight:600 }}>
                    {isAr ? '?????? ??????' : 'Monthly Salary'}
                  </span>
                </div>
                <div style={{ color:'#5120c8', fontWeight:900, fontSize:16 }}>
                  ${detailPath.salary?.toLocaleString() || '0'}
                  <span style={{ fontSize:11, fontWeight:500, marginRight:4, color:subtext }}> SAR</span>
                </div>
              </div>
              <div style={{
                flex:1, padding:'14px', borderRadius:12,
                border:`1px solid ${border}`,
                background: isDark?'rgba(255,255,255,0.03)':'#fafafa',
              }}>
                <div style={{ color:subtext, fontSize:11, fontWeight:600, marginBottom:4 }}>
                  {isAr ? '????? ?? ?????' : 'Market Demand'}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  {(detailPath.demand || '').toLowerCase().includes('very')
                    ? <Flame size={14} color="#16a34a" />
                    : <Zap size={14} color="#d97706" />}
                  <span style={{
                    fontWeight:700, fontSize:14,
                    color: (detailPath.demand || '').toLowerCase().includes('very')?'#16a34a':'#d97706',
                  }}>
                    {(detailPath.demand || '').toLowerCase().includes('very')
                      ? (isAr?'??? ???? ????':'Very High')
                      : (isAr?'??? ???':'Good')}
                  </span>
                </div>
              </div>
            </div>
            
            <div style={{
              display:'flex', borderBottom:`1px solid ${border}`,
              overflowX:'auto', scrollbarWidth:'none',
              position:'sticky', top:93, background:cardBg, zIndex:9,
            }}>
              {[
                { key:'tasks', labelAr:'??????', labelEn:'Tasks' },
                { key:'skills', labelAr:'????????', labelEn:'Skills' },
                { key:'qualifications', labelAr:'????????', labelEn:'Qualifications' },
                { key:'progression', labelAr:'?????? ???????', labelEn:'Career Path' },
              ].map(tab => (
                <button key={tab.key} onClick={() => setDetailTab(tab.key as any)} style={{
                  padding:'12px 20px', background:'none', border:'none', cursor:'pointer',
                  fontSize:13, fontWeight:700, flexShrink:0,
                  color: detailTab===tab.key ? '#5120c8' : subtext,
                  borderBottom: `2px solid ${detailTab===tab.key ? '#5120c8' : 'transparent'}`,
                  marginBottom:-1, transition:'all 0.15s',
                }}>
                  {isAr ? tab.labelAr : tab.labelEn}
                </button>
              ))}
            </div>
            
            <div style={{ padding:'20px 24px', flex:1 }}>
              
              {detailTab === 'tasks' && (
                <div>
                  <h3 style={{ color:text, fontSize:14, fontWeight:800, marginBottom:16 }}>
                    {isAr ? '?????? ????????' : 'Job Tasks'}
                  </h3>
                  {(detailPath.tasks || []).map((task: string, i: number) => (
                    <div key={i} style={{
                      display:'flex', gap:12, padding:'10px 0',
                      borderBottom: i < (detailPath.tasks?.length || 0)-1 ? `1px solid ${border}` : 'none',
                    }}>
                      <div style={{
                        width:24, height:24, borderRadius:6, flexShrink:0,
                        background:'rgba(81,32,200,0.08)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        marginTop:1,
                      }}>
                        <span style={{ color:'#5120c8', fontSize:11, fontWeight:800 }}>{i+1}</span>
                      </div>
                      <span style={{ color: isDark?'#e2e8f0':'#374151', fontSize:13, lineHeight:1.65 }}>{task}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {detailTab === 'skills' && (
                <div>
                  <h3 style={{ color:text, fontSize:14, fontWeight:800, marginBottom:16 }}>
                    {isAr ? '???????? ????????' : 'Required Skills'}
                  </h3>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {(detailPath.skills || []).map((skill: string, i: number) => (
                      <div key={i} style={{
                        padding:'8px 16px', borderRadius:20,
                        background: isDark?'rgba(81,32,200,0.1)':'rgba(81,32,200,0.06)',
                        border:'1px solid rgba(81,32,200,0.2)',
                        color:'#5120c8', fontSize:13, fontWeight:600,
                        display:'flex', alignItems:'center', gap:6,
                      }}>
                        <div style={{ width:5, height:5, borderRadius:'50%', background:'#5120c8', flexShrink:0 }} />
                        {skill}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {detailTab === 'qualifications' && (
                <div>
                  <h3 style={{ color:text, fontSize:14, fontWeight:800, marginBottom:16 }}>
                    {isAr ? '???????? ????????' : 'Required Qualifications'}
                  </h3>
                  {(detailPath.qualifications || []).map((q: string, i: number) => (
                    <div key={i} style={{
                      display:'flex', gap:10, padding:'10px 0',
                      borderBottom: i < (detailPath.qualifications?.length || 0)-1 ? `1px solid ${border}` : 'none',
                    }}>
                      <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink:0, marginTop:2 }} />
                      <span style={{ color: isDark?'#e2e8f0':'#374151', fontSize:13, lineHeight:1.6 }}>{q}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {detailTab === 'progression' && (
                <div>
                  <h3 style={{ color:text, fontSize:14, fontWeight:800, marginBottom:20 }}>
                    {isAr ? '?????? ???????' : 'Career Progression'}
                  </h3>
                  <div style={{ position:'relative' }}>
                    <div style={{
                      position:'absolute', top:20, bottom:20,
                      right: isAr ? 19 : 'auto', left: isAr ? 'auto' : 19,
                      width:2, background: isDark?'rgba(255,255,255,0.06)':'#e5e7eb',
                    }} />
                    {(detailPath.progression || []).map((level: string, i: number) => (
                      <div key={i} style={{ display:'flex', gap:14, alignItems:'center', marginBottom:16, position:'relative' }}>
                        <div style={{
                          width:40, height:40, borderRadius:'50%', flexShrink:0,
                          background: i===0 ? '#5120c8' : (isDark?'rgba(255,255,255,0.06)':'#f4f4f8'),
                          display:'flex', alignItems:'center', justifyContent:'center',
                          border: i>0 ? `1px solid ${border}` : 'none',
                          zIndex:1,
                        }}>
                          <span style={{ color: i===0?'#ffffff':subtext, fontSize:12, fontWeight:800 }}>{i+1}</span>
                        </div>
                        <div>
                          <div style={{ color:text, fontWeight:700, fontSize:14 }}>{level}</div>
                          {i===0 && <div style={{ color:'#5120c8', fontSize:11, marginTop:2 }}>{isAr?'???? ???????':'Starting Point'}</div>}
                          {i===(detailPath.progression?.length || 1)-1 && <div style={{ color:'#16a34a', fontSize:11, marginTop:2 }}>{isAr?'????? ???????':'End Goal'}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div style={{
              padding:'16px 24px', borderTop:`1px solid ${border}`,
              display:'flex', gap:10,
              position:'sticky', bottom:0, background:cardBg,
            }}>
              <button
                onClick={() => {
                  try {
                    const saved = localStorage.getItem('selectedCareerPaths')
                    const current: string[] = saved ? JSON.parse(saved) : []
                    if (!current.includes(detailPath.id)) {
                      localStorage.setItem('selectedCareerPaths', JSON.stringify([...current, detailPath.id].slice(0,5)))
                    }
                  } catch(e) {}
                  router.push(`/${locale}/dashboard/career-path`)
                }}
                style={{
                  flex:1, padding:'13px', borderRadius:12,
                  background:'#5120c8', color:'#ffffff', border:'none', cursor:'pointer',
                  fontSize:14, fontWeight:700, transition:'opacity 0.15s',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                }}>
                <ChevronRight size={15} style={{ transform: isAr?'rotate(180deg)':'none' }} />
                {isAr ? '???? ??? ??????' : 'Start This Path'}
              </button>
              <button
                onClick={() => router.push(`/${locale}/coaching`)}
                style={{
                  padding:'13px 18px', borderRadius:12, cursor:'pointer',
                  border:`1px solid ${border}`, background:'transparent',
                  color:subtext, fontSize:13, fontWeight:600,
                  display:'flex', alignItems:'center', gap:5,
                }}>
                <Users size={14} />
                {isAr ? '???????' : 'Coaching'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
