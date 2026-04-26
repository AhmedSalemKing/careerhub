'use client'
import { useState, useMemo } from 'react'
import { useTheme } from 'next-themes'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { get } from '@/lib/api'
import {
  Search, Star, Clock, Briefcase, CheckCircle2, X,
  GraduationCap, ChevronRight, Filter, SlidersHorizontal,
  DollarSign, Linkedin, Award, Users, Calendar
} from 'lucide-react'

const SPECIALITY_FILTERS = [
  { key: 'all', labelAr: 'الكل', labelEn: 'All', keywords: [] },
  { key: 'tech', labelAr: 'التقنية', labelEn: 'Technology', keywords: ['تقنية', 'برمجة', 'software', 'tech', 'engineering', 'هندسة', 'developer', 'مطور', 'web', 'mobile', 'fullstack', 'frontend', 'backend', 'python', 'javascript', 'react', 'node', 'app', 'ios', 'android'] },
  { key: 'data', labelAr: 'البيانات والذكاء الاصطناعي', labelEn: 'Data & AI', keywords: ['بيانات', 'data', 'ai', 'ذكاء', 'machine learning', 'deep learning', 'تعلم', 'analytics', 'ml', 'nlp', ' artificial', 'python'] },
  { key: 'design', labelAr: 'التصميم', labelEn: 'Design', keywords: ['تصميم', 'design', 'ui', 'ux', 'figma', 'graphic', 'جرافيك', 'واجهة', 'creative', 'visual'] },
  { key: 'business', labelAr: 'الأعمال', labelEn: 'Business', keywords: ['أعمال', 'business', 'management', 'إدارة', 'ريادة', 'entrepreneur', 'مبيعات', 'sales', 'تجارة', 'finance', 'مالية', 'hr', 'موارد', 'استراتيجية'] },
  { key: 'marketing', labelAr: 'التسويق', labelEn: 'Marketing', keywords: ['تسويق', 'marketing', 'digital', 'رقمي', 'seo', 'content', 'محتوى', 'social media', 'ads', 'إعلان', 'brand', ' marque', 'growth'] },
  { key: 'security', labelAr: 'الأمن السيبراني', labelEn: 'Cybersecurity', keywords: ['أمن', 'security', 'cyber', 'سيبراني', 'hacking', 'network', 'penetration', 'linux', ' infosec'] },
]

export default function CoachingPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()

  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'sessions'|'experience'|'price-low'|'price-high'>('sessions')
  const [selectedConsultant, setSelectedConsultant] = useState<any>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingConsultant, setBookingConsultant] = useState<any>(null)

  const bg = isDark ? '#0d0d0d' : '#fafafa'
  const cardBg = isDark ? '#111111' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.07)' : '#e5e7eb'
  const text = isDark ? '#f1f5f9' : '#0d0d0d'
  const subtext = isDark ? '#94a3b8' : '#6b7280'

  const { data: consultants = [], isLoading } = useQuery({
    queryKey: ['consultants'],
    queryFn: async () => {
      const FAKE_NAMES = ['elon', 'musk', 'messi', 'lionel', 'gakpo', 'salah', 'gonzalo', 'نىمقسي', 'test', 'fake', 'demo']
      const [res1, res2] = await Promise.all([
        get('/users?role=INSTRUCTOR&limit=50'),
        get('/users?role=CONSULTANT&limit=50'),
      ])
      const arr1 = res1.data?.data ?? res1.data?.users ?? res1.data ?? []
      const arr2 = res2.data?.data ?? res2.data?.users ?? res2.data ?? []
      const all = [...arr1, ...arr2]
      const seen = new Set()
      return all.filter(c => {
        if (seen.has(c.id)) return false
        seen.add(c.id)
        const name = `${c.profile?.firstName || ''} ${c.profile?.lastName || ''}`.toLowerCase()
        if (FAKE_NAMES.some(fake => name.includes(fake))) return false
        return true
      })
    }
  })

  const filteredConsultants = useMemo(() => {
    let result = [...consultants]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(c => {
        const name = `${c.profile?.firstName || ''} ${c.profile?.lastName || ''}`.toLowerCase()
        const speciality = (c.profile?.speciality || '').toLowerCase()
        const bio = (c.profile?.bio || '').toLowerCase()
        const areas = (c.profile?.consultingAreas || []).join(' ').toLowerCase()
        const quals = (c.profile?.qualifications || []).join(' ').toLowerCase()
        return name.includes(q) || speciality.includes(q) || bio.includes(q) || areas.includes(q) || quals.includes(q)
      })
    }

    if (activeFilter !== 'all') {
      const filterDef = SPECIALITY_FILTERS.find(f => f.key === activeFilter)
      if (filterDef?.keywords) {
        result = result.filter(c => {
          const combined = [
            c.profile?.speciality || '',
            c.profile?.bio || '',
            ...(c.profile?.consultingAreas || []),
            ...(c.profile?.qualifications || []),
            c.email || '',
          ].join(' ').toLowerCase()
          return filterDef.keywords.some(kw => combined.includes(kw.toLowerCase()))
        })
      }
    }

    result = result.map(c => {
      let score = 0
      score += (c._count?.consultingSessions || c.sessionCount || 0) * 2
      if (c.profile?.speciality) score += 5
      if (c.profile?.bio) score += 3
      if (c.profile?.qualifications?.length > 0) score += c.profile.qualifications.length * 2
      if (c.profile?.consultingAreas?.length > 0) score += c.profile.consultingAreas.length * 2
      if (c.profile?.linkedinUrl) score += 2
      if (c.isVerified || c.verified) score += 10
      return { ...c, _score: score }
    })

    switch(sortBy) {
      case 'sessions':
        result.sort((a, b) => (b._count?.consultingSessions || 0) - (a._count?.consultingSessions || 0))
        break
      case 'experience':
        result.sort((a, b) => (b.profile?.yearsExperience || 0) - (a.profile?.yearsExperience || 0))
        break
      case 'price-low':
        result.sort((a, b) => (a.profile?.sessionPrice || 0) - (b.profile?.sessionPrice || 0))
        break
      case 'price-high':
        result.sort((a, b) => (b.profile?.sessionPrice || 0) - (a.profile?.sessionPrice || 0))
        break
    }

    return result
  }, [consultants, search, activeFilter, sortBy])

  const getInitials = (c: any) => {
    const f = c.profile?.firstName?.[0] || ''
    const l = c.profile?.lastName?.[0] || ''
    return (f + l).toUpperCase() || 'C'
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, direction: isAr ? 'rtl' : 'ltr' }}>
      <div style={{ borderBottom: `1px solid ${border}`, background: cardBg, padding: '48px 24px 36px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 100, border: `1px solid ${border}`, background: isDark ? 'rgba(255,255,255,0.04)' : '#f4f4f8', marginBottom: 20 }}>
            <Users size={12} color="#5120c8" />
            <span style={{ color: subtext, fontSize: 12, fontWeight: 600 }}>
              {isAr ? `${consultants.length} مستشار متاح` : `${consultants.length} consultants available`}
            </span>
          </div>
          <h1 style={{ color: text, fontSize: 'clamp(28px,4vw,42px)', fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
            {isAr ? 'احجز استشارة مهنية' : 'Book a Professional Consultation'}
          </h1>
          <p style={{ color: subtext, fontSize: 15, margin: '0 0 28px', lineHeight: 1.7 }}>
            {isAr ? 'تواصل مع أفضل المستشارين المهنيين للحصول على توجيه شخصي متخصص' : 'Connect with top professional consultants for personalized expert guidance'}
          </p>
          <div style={{ position: 'relative', maxWidth: 480, margin: '0 auto' }}>
            <Search size={16} color={subtext} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: isAr ? 16 : 'auto', left: isAr ? 'auto' : 16, pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder={isAr ? 'ابحث باسم المستشار أو التخصص...' : 'Search by name or speciality...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '14px 44px', borderRadius: 12, border: `1.5px solid ${search ? '#5120c8' : border}`, background: isDark ? '#0d0d0d' : '#fafafa', color: text, fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: isAr ? 'auto' : 14, right: isAr ? 14 : 'auto', background: 'none', border: 'none', cursor: 'pointer', color: subtext }}>
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {SPECIALITY_FILTERS.map(f => {
                const count = f.key === 'all' 
                  ? consultants.length 
                  : consultants.filter(c => {
                      const combined = [
                        c.profile?.speciality || '',
                        c.profile?.bio || '',
                        ...(c.profile?.consultingAreas || []),
                      ].join(' ').toLowerCase()
                      return (f.keywords || []).some(kw => combined.includes(kw.toLowerCase()))
                    }).length
                return (
                  <button key={f.key} onClick={() => setActiveFilter(f.key)} style={{ padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.15s', border: activeFilter === f.key ? 'none' : `1px solid ${border}`, background: activeFilter === f.key ? '#5120c8' : 'transparent', color: activeFilter === f.key ? '#ffffff' : subtext }}>
                    <span>{isAr ? f.labelAr : f.labelEn}</span>
                    <span style={{ marginRight: isAr ? 0 : 4, marginLeft: isAr ? 4 : 0, opacity: 0.75, fontSize: 11 }}>{count}</span>
                  </button>
                )
              })}
            </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SlidersHorizontal size={14} color={subtext} />
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={{ padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600, border: `1px solid ${border}`, background: cardBg, color: text, cursor: 'pointer', outline: 'none' }}>
              <option value="sessions">{isAr ? 'الأكثر جلسات' : 'Most Sessions'}</option>
              <option value="experience">{isAr ? 'الأكثر خبرة' : 'Most Experience'}</option>
              <option value="price-low">{isAr ? 'السعر: الأقل' : 'Price: Low'}</option>
              <option value="price-high">{isAr ? 'السعر: الأعلى' : 'Price: High'}</option>
            </select>
          </div>
        </div>

        <div style={{ color: subtext, fontSize: 13, marginBottom: 20 }}>
          {isAr ? `${filteredConsultants.length} مستشار` : `${filteredConsultants.length} consultants`}
        </div>

        {isLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ height: 280, borderRadius: 16, background: isDark?'#1a1a1a':'#f4f4f8', animation: 'pulse 1.5s infinite' }} />
            ))}
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
          </div>
        )}

        {!isLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {filteredConsultants.map((c: any) => {
              const sessionCount = 
                c._count?.consultantSessions ?? 
                c._count?.consultingSessions ?? 
                c._count?.sessions ??
                c.consultingSessionsCount ??
                c.sessionCount ??
                0
              const price = parseFloat(c.profile?.sessionPrice || 0)
              const duration = c.profile?.sessionDuration || 60
              const years = c.profile?.yearsExperience || 0
              const areas = c.profile?.consultingAreas || []
              const quals = c.profile?.qualifications || []
              const verified = c.isVerified === true || c.verified === true

              return (
                <div key={c.id} style={{
                  background: cardBg, borderRadius: 16,
                  border: `1px solid ${border}`,
                  overflow: 'hidden', transition: 'all 0.2s ease',
                  display: 'flex', flexDirection: 'column',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(81,32,200,0.3)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = border
                  e.currentTarget.style.transform = 'translateY(0)'
                }}>
                  <div style={{ height: 80, background: isDark ? '#1a1a1a' : '#f8f8fa', position: 'relative' }}>
                    <div style={{
                      position: 'absolute', top: 10,
                      left: 10, right: 'auto',
                      padding: '3px 10px', borderRadius: 20,
                      background: 'rgba(0,0,0,0.4)',
                      color: '#fff', fontSize: 11, fontWeight: 700,
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      <Calendar size={10} />
                      <span><span>{sessionCount}</span> <span>{isAr ? 'جلسة' : 'sessions'}</span></span>
                    </div>
                    <div style={{
                      position: 'absolute', bottom: -24,
                      right: isAr ? 20 : 'auto', left: isAr ? 'auto' : 20,
                      position: 'relative', display: 'inline-block',
                    }}>
                      {c.profile?.avatar ? (
                        <img src={c.profile.avatar} alt=""
                          style={{ width: 52, height: 52, borderRadius: 14, objectFit: 'cover', border: `3px solid ${cardBg}` }} />
                      ) : (
                        <div style={{
                          width: 52, height: 52, borderRadius: 14,
                          background: '#5120c8', border: `3px solid ${cardBg}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: 18, fontWeight: 800,
                        }}>
                          <span>{getInitials(c)}</span>
                        </div>
                      )}
                      {verified && (
                        <div style={{
                          position: 'absolute',
                          bottom: -4,
                          left: -6,
                          right: 'auto',
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: '#5120c8',
                          border: '2.5px solid #ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(81,32,200,0.5)',
                          zIndex: 2,
                        }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ padding: '32px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <h3 style={{ color: text, fontSize: 16, fontWeight: 800, margin: 0 }}>
                        <span>{c.profile?.firstName || ''} {c.profile?.lastName || ''}</span>
                      </h3>
                      {c.profile?.speciality ? (
                        <p style={{ color: '#5120c8', fontSize: 13, fontWeight: 600, margin: '3px 0 0' }}>
                          <span>{c.profile.speciality}</span>
                        </p>
                      ) : null}
                    </div>

                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      {years > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Briefcase size={12} color={subtext} />
                          <span style={{ color: subtext, fontSize: 12 }}><span>{years}</span> <span>{isAr ? 'سنة' : 'yrs'}</span></span>
                        </div>
                      ) : null}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} color={subtext} />
                        <span style={{ color: subtext, fontSize: 12 }}><span>{duration}</span> <span>{isAr ? 'دقيقة' : 'min'}</span></span>
                      </div>
                    </div>

                    {c.profile?.bio ? (
                      <p style={{
                        color: subtext, fontSize: 12, lineHeight: 1.65, margin: 0,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        <span>{c.profile.bio}</span>
                      </p>
                    ) : null}

                    {areas.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {areas.slice(0, 3).map((area: string, i: number) => (
                          <span key={i} style={{
                            padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                            background: 'rgba(81,32,200,0.06)',
                            border: '1px solid rgba(81,32,200,0.15)',
                            color: '#5120c8',
                          }}>
                            {area}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingTop: 8 }}>
                      <div>
                        <div style={{ color: '#5120c8', fontSize: 20, fontWeight: 900, lineHeight: 1 }}>
                          <span>{price > 0 ? (price + (isAr ? ' ر.س' : ' SAR')) : (isAr ? 'مجاني' : 'Free')}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => setSelectedConsultant(c)}
                          style={{
                            padding: '9px 14px', borderRadius: 10, cursor: 'pointer',
                            border: `1px solid ${border}`, background: 'transparent',
                            color: text, fontSize: 12, fontWeight: 600,
                          }}>
                          <span>{isAr ? 'التفاصيل' : 'Details'}</span>
                        </button>
                        <button
                          onClick={() => router.push(`/${locale}/dashboard/coaching?consultant=${c.id}`)}
                          style={{
                            padding: '9px 16px', borderRadius: 10, cursor: 'pointer',
                            background: '#5120c8', color: '#ffffff',
                            border: 'none', fontSize: 12, fontWeight: 700,
                          }}>
                          <span>{isAr ? 'احجز' : 'Book'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!isLoading && filteredConsultants.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <Users size={40} color={subtext} style={{ marginBottom: 16 }} />
            <h3 style={{ color: text, fontSize: 18, fontWeight: 800, margin: '0 0 8px' }}>
              {search ? (isAr ? 'لا توجد نتائج' : 'No results found') : (isAr ? 'لا يوجد مستشارون في هذا التخصص حتى الآن' : 'No consultants in this category yet')}
            </h3>
            <p style={{ color: subtext, fontSize: 14, marginBottom: 20 }}>
              {isAr ? 'جرب تصفح جميع المستشارين' : 'Browse all consultants instead'}
            </p>
            <button onClick={() => { setSearch(''); setActiveFilter('all') }} style={{ padding: '10px 24px', borderRadius: 10, background: '#5120c8', color: '#ffffff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
              {isAr ? 'عرض الكل' : 'Show All'}
            </button>
          </div>
        )}
      </div>

      {selectedConsultant && (
        <>
          <div onClick={() => setSelectedConsultant(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'fixed', top: 0, bottom: 0, right: isAr ? 0 : 'auto', left: isAr ? 'auto' : 0, width: Math.min(480, typeof window !== 'undefined' ? window.innerWidth : 480), background: cardBg, borderLeft: isAr ? 'none' : `1px solid ${border}`, borderRight: isAr ? `1px solid ${border}` : 'none', zIndex: 101, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: cardBg, zIndex: 10 }}>
              <h3 style={{ color: text, fontSize: 16, fontWeight: 800, margin: 0 }}>{isAr ? 'تفاصيل المستشار' : 'Consultant Details'}</h3>
              <button onClick={() => setSelectedConsultant(null)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: subtext }}><X size={15} /></button>
            </div>
            <div style={{ padding: '24px', flex: 1 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
                {selectedConsultant.profile?.avatar ? <img src={selectedConsultant.profile.avatar} alt="" style={{ width: 64, height: 64, borderRadius: 16, objectFit: 'cover' }} /> : <div style={{ width: 64, height: 64, borderRadius: 16, background: '#5120c8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 800 }}>{getInitials(selectedConsultant)}</div>}
                <div>
                  <h2 style={{ color: text, fontSize: 18, fontWeight: 900, margin: '0 0 3px' }}>{selectedConsultant.profile?.firstName} {selectedConsultant.profile?.lastName}</h2>
                  {selectedConsultant.profile?.speciality && <p style={{ color: '#5120c8', fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>{selectedConsultant.profile.speciality}</p>}
                  {selectedConsultant.isVerified && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={12} color="#16a34a" /><span style={{ color: '#16a34a', fontSize: 11, fontWeight: 700 }}>{isAr ? 'مستشار موثق' : 'Verified Consultant'}</span></div>}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
                {[{ icon: <Briefcase size={14} color="#5120c8" />, val: `${selectedConsultant.profile?.yearsExperience || 0}`, labelAr: 'سنة خبرة', labelEn: 'yrs exp' }, { icon: <Clock size={14} color="#5120c8" />, val: `${selectedConsultant.profile?.sessionDuration || 60}`, labelAr: 'دقيقة', labelEn: 'min' }, { icon: <Calendar size={14} color="#5120c8" />, val: `${selectedConsultant._count?.consultingSessions || 0}`, labelAr: 'جلسة', labelEn: 'sessions' }].map((s, i) => <div key={i} style={{ padding: '12px', borderRadius: 12, textAlign: 'center', border: `1px solid ${border}`, background: isDark ? 'rgba(255,255,255,0.03)' : '#fafafa' }}><div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>{s.icon}</div><div style={{ color: text, fontSize: 16, fontWeight: 800 }}>{s.val}</div><div style={{ color: subtext, fontSize: 11 }}>{isAr ? s.labelAr : s.labelEn}</div></div>)}
              </div>
              {selectedConsultant.profile?.bio && <div style={{ marginBottom: 20 }}><h4 style={{ color: text, fontSize: 13, fontWeight: 800, marginBottom: 8 }}>{isAr ? 'نبذة مهنية' : 'Professional Bio'}</h4><p style={{ color: subtext, fontSize: 13, lineHeight: 1.7, margin: 0 }}>{selectedConsultant.profile.bio}</p></div>}
              {selectedConsultant.profile?.consultingAreas?.length > 0 && <div style={{ marginBottom: 20 }}><h4 style={{ color: text, fontSize: 13, fontWeight: 800, marginBottom: 10 }}>{isAr ? 'مجالات ��لا��تشارات' : 'Consulting Areas'}</h4><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{selectedConsultant.profile.consultingAreas.map((area: string, i: number) => <span key={i} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: 'rgba(81,32,200,0.08)', border: '1px solid rgba(81,32,200,0.2)', color: '#5120c8' }}>{area}</span>)}</div></div>}
              {selectedConsultant.profile?.qualifications?.length > 0 && <div style={{ marginBottom: 20 }}><h4 style={{ color: text, fontSize: 13, fontWeight: 800, marginBottom: 10 }}><GraduationCap size={14} style={{ marginLeft: isAr ? 0 : 5, marginRight: isAr ? 5 : 0 }} />{isAr ? 'المؤهلات والشهادات' : 'Qualifications'}</h4><div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{selectedConsultant.profile.qualifications.map((q: string, i: number) => <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><Award size={14} color="#5120c8" style={{ flexShrink: 0, marginTop: 2 }} /><span style={{ color: isDark ? '#e2e8f0' : '#374151', fontSize: 13, lineHeight: 1.5 }}>{q}</span></div>)}</div></div>}
              {selectedConsultant.profile?.linkedinUrl && <a href={selectedConsultant.profile.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, border: `1px solid ${border}`, background: isDark ? 'rgba(255,255,255,0.03)' : '#fafafa', textDecoration: 'none', marginBottom: 20, color: text, fontSize: 13, fontWeight: 600 }}><Linkedin size={16} color="#0077b5" />{isAr ? 'عرض الملف على LinkedIn' : 'View LinkedIn Profile'}<ChevronRight size={13} color={subtext} style={{ marginRight: isAr ? 'auto' : 0, marginLeft: isAr ? 0 : 'auto', transform: isAr ? 'rotate(180deg)' : 'none' }} /></a>}
            </div>
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${border}`, position: 'sticky', bottom: 0, background: cardBg, display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#5120c8', fontSize: 20, fontWeight: 900 }}>{parseFloat(selectedConsultant.profile?.sessionPrice || 0) > 0 ? `${selectedConsultant.profile.sessionPrice} ${isAr ? 'ر.س' : 'SAR'}` : (isAr ? 'مجاني' : 'Free')}</div>
                <div style={{ color: subtext, fontSize: 11 }}>{isAr ? 'لكل جلسة' : 'per session'}</div>
              </div>
              <button onClick={() => { setSelectedConsultant(null); router.push(`/${locale}/dashboard/coaching?consultant=${selectedConsultant.id}`) }} style={{ flex: 2, padding: '13px', borderRadius: 12, background: '#5120c8', color: '#ffffff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Calendar size={15} />{isAr ? 'احجز جلسة الآن' : 'Book Session Now'}</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}