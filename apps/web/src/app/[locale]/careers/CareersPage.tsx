'use client'

import { useCallback, useRef, useState, useMemo, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ConfirmModal from '@/components/ConfirmModal'
import {
  Search, Code2, Palette, TrendingUp, BarChart3, Shield, Settings,
  Briefcase, Package, ChevronRight, Clock, Star, DollarSign,
  Flame, Zap, Sparkles, ArrowLeft, BookOpen, Globe, Megaphone, Rocket, Brain,
  X, CheckCircle2
} from 'lucide-react'
import { CAREER_PATHS } from '@/lib/career-paths'
import { useTracks } from '@/lib/tracks'
import { TracksGrid } from '@/app/components/TracksGrid'

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
  { key: 'Technology & Development', labelAr: 'التقنية والتطوير', labelEn: 'Technology' },
  { key: 'Cybersecurity', labelAr: 'الأمن السيبراني', labelEn: 'Cybersecurity' },
  { key: 'Design & Creative', labelAr: 'التصميم والإبداع', labelEn: 'Design' },
  { key: 'Marketing & Sales', labelAr: 'التسويق والمبيعات', labelEn: 'Marketing' },
  { key: 'Business & Management', labelAr: 'الأعمال والإدارة', labelEn: 'Business' },
  { key: 'Hybrid Tech + Business', labelAr: 'تقنية وأعمال', labelEn: 'Hybrid' },
]

export default function CareersPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()
  const { data: learningTracks = [] } = useTracks(locale)
  
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set())
  const [detailPath, setDetailPath] = useState<any>(null)
  const [detailTab, setDetailTab] = useState<'tasks'|'skills'|'qualifications'|'progression'>('tasks')
  const [confirmPath, setConfirmPath] = useState<any>(null)
  const [noticeMsg, setNoticeMsg] = useState('')
  const [noticeVisible, setNoticeVisible] = useState(false)
  const noticeTimer = useRef<any>(null)
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.deveways.com/api'
  const getToken = () =>
    typeof window !== 'undefined'
      ? localStorage.getItem('deveway_token') || localStorage.getItem('token') || sessionStorage.getItem('token') || ''
      : ''
  
  const requestStartPath = (path: any) => setConfirmPath(path)
  
  const showNotice = useCallback((msg: string) => {
    setNoticeMsg(msg)
    setNoticeVisible(true)
    if (noticeTimer.current) clearTimeout(noticeTimer.current)
    noticeTimer.current = setTimeout(() => setNoticeVisible(false), 3000)
  }, [])
  
  const resolveSlugToDbId = async (slugId: string): Promise<string> => {
    try {
      const res = await fetch(`${apiUrl}/career/paths`)
      const data = await res.json()
      const arr = data?.data?.careerPaths ?? data?.data ?? data ?? []
      const all = Array.isArray(arr) ? arr : []
      const match = all.find((p: any) => p.slug === slugId || p.id === slugId)
      if (match?.id) return match.id
    } catch(e) {}
    return slugId
  }
  
  const confirmAddPath = useCallback(async () => {
    if (!confirmPath) return
    setConfirmPath(null)
    const pathId = await resolveSlugToDbId(confirmPath.id)
    
    try {
      const saved = localStorage.getItem('selectedCareerPaths')
      const current: string[] = saved ? JSON.parse(saved) : []
      if (!current.includes(pathId)) {
        localStorage.setItem('selectedCareerPaths', JSON.stringify([...current, pathId].slice(0,5)))
      }
    } catch(e) {}
    
    try {
      const cached = localStorage.getItem('deveway_my_path_ids')
      const list: string[] = cached ? JSON.parse(cached) : []
      if (!list.includes(pathId)) {
        localStorage.setItem('deveway_my_path_ids', JSON.stringify([...list, pathId].slice(0,5)))
      }
    } catch(e) {}
    
    try {
      const token = getToken()
      await fetch(`${apiUrl}/career/paths/add/${pathId}?source=MANUAL`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
    } catch(e) {}
    
    showNotice(isAr ? 'تمت إضافة المسار بنجاح' : 'Career path added successfully')
    setTimeout(() => router.push(`/${locale}/dashboard/career-path`), 800)
  }, [confirmPath, apiUrl, locale, isAr, router, showNotice])
  
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
        path.title?.toLowerCase().includes(query) ||
        path.skills?.some(s => s.toLowerCase().includes(query))
      return matchCategory && matchSearch
    })
  }, [allPaths, activeCategory, searchQuery])
  
  useEffect(() => {
    const cards = document.querySelectorAll('.careers-page .rv')
    if (!('IntersectionObserver' in window)) {
      cards.forEach(el => el.classList.add('in'))
      return
    }
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target) }
      }),
      { threshold: 0.08 }
    )
    cards.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [filteredPaths])
  
  const bg = 'var(--background)'
  const cardBg = 'var(--card)'
  const border = 'var(--border)'
  const text = 'var(--foreground)'
  const subtext = 'var(--muted)'
  const textMuted = isDark ? '#64748b' : '#9ca3af'
  
  return (
    <div className="careers-page" style={{ minHeight:'100vh', direction:isAr?'rtl':'ltr' }}>
      
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
              {isAr ? 'استكشف المسارات المهنية' : 'Explore Career Paths'}
            </span>
          </div>
          
          <h1 style={{ color:text, fontSize:'clamp(28px,4vw,42px)', fontWeight:900, margin:'0 0 16px', lineHeight:1.2 }}>
            {isAr ? 'ابن مستقبلك المهني' : 'Build Your Career Future'}
          </h1>
          <p style={{ color:subtext, fontSize:16, margin:'0 0 32px', lineHeight:1.7 }}>
            {isAr
              ? 'اختر مسارك المهني من أكثر من 30 مساراً متخصصاً وابدأ بخطة واضحة ومنظمة'
              : 'Choose your career path from 30+ specialized paths and start with a clear structured plan'}
          </p>
          
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[
              { value: allPaths.length.toString(), labelAr:'المسارات المتاحة', labelEn:'Paths Available' },
              { value: CAREER_PATHS.length.toString(), labelAr:'التخصصات', labelEn:'Specializations' },
              { value: '100%', labelAr:'مجاني للاستكشاف', labelEn:'Free to Explore' },
            ].map((stat, i) => (
              <div key={i} style={{ textAlign:'center', padding:'8px 4px' }}>
                <div style={{ color:'#5120c8', fontSize:'clamp(20px, 5vw, 32px)', fontWeight:900 }}>{stat.value}</div>
                <div style={{ color:subtext, fontSize:'clamp(9px, 2vw, 12px)' }}>{isAr ? stat.labelAr : stat.labelEn}</div>
              </div>
            ))}
          </div>
          
        </div>
      </div>
      
      {/* Main content */}
      <div style={{ width:'100%', boxSizing:'border-box', maxWidth:1200, margin:'0 auto', padding:'32px 24px', overflowX:'hidden' }}>

        {learningTracks.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 800, color: 'var(--ink)' }}>{isAr ? 'مسارات التعلّم' : 'Learning tracks'}</h2>
            <TracksGrid tracks={learningTracks} />
          </section>
        )}
        
        {/* Filters: search + category chips */}
        <div className="filters">
          <label className="search">
            <Search size={16} aria-hidden="true" />
            <input
              type="text"
              placeholder={isAr ? 'ابحث عن مسار أو مهارة...' : 'Search paths or skills...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label={isAr ? 'بحث' : 'Search'}
            />
          </label>
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveCategory(cat.key)}
              className={`chip${activeCategory === cat.key ? ' on' : ''}`}
              aria-pressed={activeCategory === cat.key}
            >
              {isAr ? cat.labelAr : cat.labelEn}
              {activeCategory === cat.key && <span>({filteredPaths.length})</span>}
            </button>
          ))}
        </div>

        {/* Results count */}
        <div className="results-count">
          {isAr ? `${filteredPaths.length} مسار متاح` : `${filteredPaths.length} paths available`}
        </div>

        {/* Paths grid */}
        <div key={`grid-${activeCategory}-${searchQuery}`} className="tracks-grid">
          {filteredPaths.map((path, idx) => {
            const IconComp = ICON_MAP[path.icon] || Briefcase
            const isHigh = (path.demand || '').toLowerCase().includes('very')
            const roles = (path.progression && path.progression.length > 0 ? path.progression : path.skills ?? []).slice(0, 3)

            return (
              <article
                key={path.id}
                className="tcard rv"
                role="link"
                tabIndex={0}
                onClick={() => router.push(`/${locale}/careers/${path.id}`)}
                onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) router.push(`/${locale}/careers/${path.id}`) }}
                style={{ cursor: "pointer", ...({ ["--d" as string]: `${(idx % 3) * 80}ms` } as React.CSSProperties) }}
              >
                <div className="t-media">
                  <span className="t-watermark" aria-hidden="true"><IconComp size={72} /></span>
                  <span className={`t-demand${isHigh ? ' high' : ''}`}>
                    {isHigh ? <Flame size={12} aria-hidden="true" /> : <Zap size={12} aria-hidden="true" />}
                    {isHigh ? (isAr ? 'طلب مرتفع' : 'High demand') : (isAr ? 'طلب جيد' : 'Good demand')}
                  </span>
                  <span className="t-badge"><IconComp className="icon" size={18} aria-hidden="true" /></span>
                  <span className="t-count">
                    <Star className="icon" size={13} aria-hidden="true" />
                    {path.level || 'All Levels'}
                  </span>
                </div>

                <div className="t-body">
                  <h3>{isAr ? path.titleAr : path.title}</h3>
                  <p className="t-desc">{isAr ? path.descriptionAr : path.descriptionEn}</p>

                  {roles.length > 0 && (
                    <div className="roles">
                      {roles.map((r, i) => <span key={`${r}-${i}`}>{r}</span>)}
                    </div>
                  )}

                  <p className="t-sal">
                    <TrendingUp className="icon" size={15} aria-hidden="true" />
                    <span>{isAr ? 'الراتب الشهري المعتاد' : 'Typical monthly salary'}</span>
                    <b>{path.salary} SAR</b>
                  </p>

                  <div className="t-foot">
                    <button
                      type="button"
                      className="t-btn"
                      onClick={(e) => { e.stopPropagation(); router.push(`/${locale}/careers/${path.id}`) }}
                    >
                      {isAr ? 'تفاصيل' : 'Details'}
                    </button>
                    <button type="button" className="t-btn primary" onClick={(e) => { e.stopPropagation(); requestStartPath(path) }}>
                      {isAr ? 'ابدأ المسار' : 'Start Path'}
                    </button>
                  </div>
                </div>
              </article>
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
              {isAr ? 'لست متأكداً من مسارك' : "Not sure which path?"}
            </h2>
            <p style={{ color:subtext, fontSize:14, margin:'0 0 24px', lineHeight:1.7 }}>
              {isAr
                ? 'قم بإجراء التقييم بالذكاء الاصطناعي وسنوصي بأفضل مسار بناءً على مهاراتك واهتماماتك'
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
                {isAr ? 'اكتشف مسارك بالذكاء الاصطناعي' : 'Discover Your Path with AI'}
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
                    {isAr ? detailPath.titleAr : detailPath.title}
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
                    {isAr ? 'الراتب الشهري' : 'Monthly Salary'}
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
                  {isAr ? 'الطلب في السوق' : 'Market Demand'}
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
                      ? (isAr?'مرتفع جداً':'Very High')
                      : (isAr?'جيد':'Good')}
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
                { key:'tasks', labelAr:'المهام', labelEn:'Tasks' },
                { key:'skills', labelAr:'المهارات', labelEn:'Skills' },
                { key:'qualifications', labelAr:'المؤهلات', labelEn:'Qualifications' },
                { key:'progression', labelAr:'المسار المهني', labelEn:'Career Path' },
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
                    {isAr ? 'مهام الوظيفة' : 'Job Tasks'}
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
                    {isAr ? 'المهارات المطلوبة' : 'Required Skills'}
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
                    {isAr ? 'المؤهلات المطلوبة' : 'Required Qualifications'}
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
                    {isAr ? 'التدرج المهني' : 'Career Progression'}
                  </h3>
                  <div style={{ position:'relative' }}>
                    <div style={{
                      position:'absolute', top:20, bottom:20,
                      right: isAr ? 19 : 'auto', left: isAr ? 'auto' : 19,
                      width:2, background: 'var(--border)',
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
                          {i===0 && <div style={{ color:'#5120c8', fontSize:11, marginTop:2 }}>{isAr?'نقطة البداية':'Starting Point'}</div>}
                          {i===(detailPath.progression?.length || 1)-1 && <div style={{ color:'#16a34a', fontSize:11, marginTop:2 }}>{isAr?'الهدف النهائي':'End Goal'}</div>}
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
                onClick={() => requestStartPath(detailPath)}
                style={{
                  flex:1, padding:'13px', borderRadius:12,
                  background:'#5120c8', color:'#ffffff', border:'none', cursor:'pointer',
                  fontSize:14, fontWeight:700, transition:'opacity 0.15s',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                }}>
                <ChevronRight size={15} style={{ transform: isAr?'rotate(180deg)':'none' }} />
                {isAr ? 'ابدأ هذا المسار' : 'Start This Path'}
              </button>
            </div>
          </div>
        </>
      )}

      {noticeMsg && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          padding: '16px 24px', textAlign: 'center',
          background: 'var(--card)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          color: 'var(--foreground)',
          fontFamily: 'var(--font-body)',
          fontSize: 14, fontWeight: 600,
          borderBottom: '1px solid var(--border)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
          animation: noticeVisible ? 'noticeSlideDown 0.35s ease forwards' : 'noticeSlideUp 0.35s ease forwards',
        }}>
          {noticeMsg}
        </div>
      )}
      <style>{`
        @keyframes noticeSlideDown { from { transform: translateY(-100%); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes noticeSlideUp { from { transform: translateY(0); opacity: 1 } to { transform: translateY(-100%); opacity: 0 } }
      `}</style>

      <ConfirmModal
        isOpen={!!confirmPath}
        title={isAr ? 'إضافة مسار مهني' : 'Add Career Path'}
        message={isAr ? 'هل تريد إضافة هذا المسار إلى مساراتك المهنية؟' : 'Do you want to add this career path to your career paths?'}
        confirmLabel={isAr ? 'أضف المسار' : 'Add Path'}
        cancelLabel={isAr ? 'إلغاء' : 'Cancel'}
        onConfirm={confirmAddPath}
        onCancel={() => setConfirmPath(null)}
      />
    </div>
  )
}
