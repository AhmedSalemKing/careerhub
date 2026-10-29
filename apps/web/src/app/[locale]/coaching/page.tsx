'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { formatMoney } from '@/lib/market'
import {
  Search, X, ChevronRight, Briefcase, Clock,
  CheckCircle2, Calendar, DollarSign, GraduationCap,
  Linkedin, Users, SlidersHorizontal, Video,
  Code2, Palette, TrendingUp, BarChart3, Shield, Star
} from 'lucide-react'

const API = 'https://api.deveways.com/api'

const SPECIALTY_KEYWORDS: Record<string, string[]> = {
  tech: ['برمجة','تقنية','software','tech','engineering','هندسة','developer','مطور','web','mobile','fullstack','frontend','backend','python','javascript','react','node','java','php','flutter','تطوير','كود','code','programming','ويب','موبايل','api','database','devops','cloud','سحابة','aws','azure','docker','linux','network','شبكات','typescript','vue','angular'],
  data: ['data','بيانات','ai','ذكاء اصطناعي','machine learning','تعلم آلي','deep learning','neural','nlp','analytics','تحليل','statistics','tensorflow','pytorch','pandas','tableau','power bi','data science','علم البيانات'],
  security: ['security','أمن','سيبراني','cyber','hacking','penetration','اختراق','ethical hacking','ctf','forensics','malware','encryption','تشفير','firewall','vpn','soc','kali'],
  design: ['تصميم','design','ui','ux','figma','graphic','جرافيك','واجهة','user experience','visual','branding','هوية','logo','photoshop','illustrator','motion','animation','creative','إبداع'],
  marketing: ['تسويق','marketing','digital','رقمي','seo','sem','google ads','social media','content','محتوى','email','brand','copywriting','growth','conversion','advertising','إعلان','campaign'],
  business: ['أعمال','business','management','إدارة','ريادة','entrepreneur','startup','مبيعات','sales','تجارة','finance','مالية','hr','موارد بشرية','project manager','product manager','scrum','agile','strategy','استراتيجية'],
}

const CATEGORIES = [
  { key: 'all', ar: 'الكل', en: 'All' },
  { key: 'tech', ar: 'التقنية والبرمجة', en: 'Tech & Programming', Icon: Code2 },
  { key: 'data', ar: 'البيانات والذكاء الاصطناعي', en: 'Data & AI', Icon: BarChart3 },
  { key: 'security', ar: 'الأمن السيبراني', en: 'Cybersecurity', Icon: Shield },
  { key: 'design', ar: 'التصميم', en: 'Design', Icon: Palette },
  { key: 'marketing', ar: 'التسويق الرقمي', en: 'Marketing', Icon: TrendingUp },
  { key: 'business', ar: 'الأعمال والإدارة', en: 'Business', Icon: Briefcase },
]

export default function CoachingPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()

  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [sortBy, setSortBy] = useState('score')
  const [detailConsultant, setDetailConsultant] = useState<any>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const bg = 'var(--background)'
  const cardBg = 'var(--card)'
  const border = 'var(--border)'
  const text = 'var(--foreground)'
  const subtext = 'var(--muted)'

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') { e.preventDefault(); searchRef.current?.focus() } }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const { data: raw = [], isLoading } = useQuery({
    queryKey: ['consultants'],
    queryFn: async () => {
      try {
        const res = await fetch(`${API}/consulting/consultants?limit=50`)
        const d = await res.json()
        if (d?.data?.length > 0) return d.data
      } catch(e) {}
      const r = await fetch(`${API}/consulting/consultants?limit=50`).then(r => r.json()).catch(() => ({}))
      const all = [...(r?.data ?? [])]
      const seen = new Set()
      return all.filter((c: any) => { if (seen.has(c.id)) return false; seen.add(c.id); return true })
    },
    staleTime: 60000,
  })

  const consultants = useMemo(() => {
    let result = [...raw]

    if (activeFilter !== 'all') {
      const kws = SPECIALTY_KEYWORDS[activeFilter] || []
      result = result.filter((c: any) => {
        const combined = [c.profile?.speciality || '', c.profile?.bio || '', ...(c.profile?.consultingAreas || []), ...(c.profile?.qualifications || [])].join(' ').toLowerCase()
        return kws.some(kw => combined.includes(kw))
      })
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((c: any) => {
        const combined = [`${c.profile?.firstName || ''} ${c.profile?.lastName || ''}`, c.profile?.speciality || '', c.profile?.bio || '', ...(c.profile?.consultingAreas || [])].join(' ').toLowerCase()
        return combined.includes(q)
      })
    }

    switch(sortBy) {
      case 'experience': result.sort((a: any, b: any) => (b.profile?.yearsExperience || 0) - (a.profile?.yearsExperience || 0)); break
      case 'price-low': result.sort((a: any, b: any) => (a.hourlyRate || parseFloat(a.profile?.sessionPrice || '0')) - (b.hourlyRate || parseFloat(b.profile?.sessionPrice || '0'))); break
      case 'price-high': result.sort((a: any, b: any) => (b.hourlyRate || parseFloat(b.profile?.sessionPrice || '0')) - (a.hourlyRate || parseFloat(a.profile?.sessionPrice || '0'))); break
    }
    return result
  }, [raw, activeFilter, search, sortBy])

  const getInitials = (c: any) => (`${c.profile?.firstName?.[0] || ''}${c.profile?.lastName?.[0] || ''}`).toUpperCase() || 'C'
  const getCategoryCount = (key: string) => {
    if (key === 'all') return raw.length
    const kws = SPECIALTY_KEYWORDS[key] || []
    return raw.filter((c: any) => {
      const t = [c.profile?.speciality || '', c.profile?.bio || '', ...(c.profile?.consultingAreas || [])].join(' ').toLowerCase()
      return kws.some(kw => t.includes(kw))
    }).length
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, direction: isAr ? 'rtl' : 'ltr' }}>
      <style>{`@keyframes cardIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}.c-card{animation:cardIn 0.35s cubic-bezier(0.16,1,0.3,1) both}`}</style>

      <div style={{ borderBottom: `1px solid ${border}`, background: cardBg, padding: '52px 24px 36px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 100, border: `1px solid ${border}`, background: 'var(--surface)', marginBottom: 18 }}>
            <Users size={12} color="#5120c8" />
            <span style={{ color: subtext, fontSize: 12, fontWeight: 600 }}>{consultants.length} {isAr ? 'مستشار متاح' : 'consultants available'}</span>
          </div>
          <h1 style={{ color: text, fontSize: 'clamp(26px,4vw,42px)', fontWeight: 700, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
            {isAr ? 'احجز استشارة مهنية' : 'Book a Professional Consultation'}
          </h1>
          <p style={{ color: subtext, fontSize: 14, margin: '0 0 24px', lineHeight: 1.7 }}>
            {isAr ? 'تواصل مع أفضل المستشارين للحصول على توجيه مهني متخصص' : 'Connect with top consultants for specialized career guidance'}
          </p>
          <div style={{ position: 'relative', maxWidth: 460, margin: '0 auto' }}>
            <Search size={15} color={subtext} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [isAr ? 'right' : 'left']: 14, pointerEvents: 'none' }} />
            <input ref={searchRef} type="text" placeholder={isAr ? 'ابحث باسم المستشار أو التخصص...' : 'Search by name or speciality...'} value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '13px 44px', borderRadius: 12, border: `1.5px solid ${search ? '#5120c8' : border}`, background: 'var(--background)', color: text, fontSize: 13, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }} />
            {search ? (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [isAr ? 'right' : 'left']: 14, background: 'none', border: 'none', cursor: 'pointer', color: subtext, display: 'flex' }}><X size={14} /></button>
            ) : (
              <kbd style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [isAr ? 'left' : 'right']: 14, background: 'var(--surface)', border: `1px solid ${border}`, borderRadius: 5, padding: '1px 6px', fontSize: 11, color: subtext, fontFamily: 'monospace' }}>/</kbd>
            )}
          </div>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: '28px 24px 80px', overflowX: 'hidden', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', gap: '8px', width: '100%', paddingBottom: '4px' }}>
            {CATEGORIES.map(cat => {
              const count = getCategoryCount(cat.key)
              const active = activeFilter === cat.key
              return (
                <button key={cat.key} onClick={() => setActiveFilter(cat.key)} style={{ flexShrink: 0, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.15s', border: active ? 'none' : `1px solid ${border}`, background: active ? '#5120c8' : 'transparent', color: active ? '#ffffff' : subtext }}>
                  {cat.Icon && <cat.Icon size={12} />}
                  {isAr ? cat.ar : cat.en}
                  <span style={{ opacity: 0.75, fontSize: 11 }}>{count}</span>
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <SlidersHorizontal size={13} color={subtext} />
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600, border: `1px solid ${border}`, background: cardBg, color: text, cursor: 'pointer', outline: 'none' }}>
              <option value="score">{isAr ? 'الأنسب' : 'Best Match'}</option>
              <option value="experience">{isAr ? 'الأكثر خبرة' : 'Most Experience'}</option>
              <option value="price-low">{isAr ? 'السعر: الأقل' : 'Price: Low'}</option>
              <option value="price-high">{isAr ? 'السعر: الأعلى' : 'Price: High'}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div style={{ padding: '12px 8px', textAlign: 'center', borderRadius: 12, border: `1px solid ${border}`, background: 'var(--surface)' }}>
            <p style={{ color: '#5120c8', fontSize: 'clamp(18px, 5vw, 28px)', fontWeight: 800, margin: '0 0 2px' }}>{consultants.length}</p>
            <p style={{ color: subtext, fontSize: 'clamp(10px, 2.5vw, 13px)', margin: 0 }}>{isAr ? 'مستشار' : 'consultants'}</p>
          </div>
          <div style={{ padding: '12px 8px', textAlign: 'center', borderRadius: 12, border: `1px solid ${border}`, background: 'var(--surface)' }}>
            <p style={{ color: '#5120c8', fontSize: 'clamp(18px, 5vw, 28px)', fontWeight: 800, margin: '0 0 2px' }}>{raw.reduce((sum: number, c: any) => sum + (c._count?.consultantSessions || 0), 0)}</p>
            <p style={{ color: subtext, fontSize: 'clamp(10px, 2.5vw, 13px)', margin: 0 }}>{isAr ? 'جلسة' : 'sessions'}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 w-full">
            {[1,2,3,4,5,6].map(i => <div key={i} style={{ height: 280, borderRadius: 16, animation: 'pulse 1.5s infinite', background: 'var(--surface)' }}><style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style></div>)}
          </div>
        ) : consultants.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <Users size={44} color={subtext} style={{ marginBottom: 16, opacity: 0.4 }} />
            <h3 style={{ color: text, fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>{isAr ? 'لا يوجد مستشارون' : 'No consultants found'}</h3>
            <button onClick={() => { setSearch(''); setActiveFilter('all') }} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 10, background: '#5120c8', color: '#ffffff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              {isAr ? 'عرض الكل' : 'Show All'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 w-full">
            {consultants.map((c: any, idx: number) => {
              const price = c.hourlyRate || parseFloat(c.profile?.sessionPrice || '0')
              const years = c.profile?.yearsExperience || 0
              const areas = c.profile?.consultingAreas || []
              const quals = c.profile?.qualifications || []
              return (
                <div key={c.id} className="c-card" style={{ width: '100%', minWidth: 0, overflow: 'hidden', animationDelay: `${(idx % 12) * 0.045}s`, background: cardBg, borderRadius: 16, border: `1px solid ${border}`, display: 'flex', flexDirection: 'column', transition: 'all 0.2s ease', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(81,32,200,0.35)'; e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}>
                  <div style={{ height: 68, background: 'var(--surface)', position: 'relative', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 8, [isAr ? 'right' : 'left']: 10, display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 10, fontWeight: 500 }}>
                      <Calendar size={9} />{c._count?.consultantSessions || 0} {isAr ? 'جلسة' : 'sessions'}
                    </div>
                    <div style={{ position: 'absolute', bottom: -22, [isAr ? 'right' : 'left']: 18 }}>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        {c.profile?.avatar
                          ? <img src={c.profile.avatar} alt="" style={{ width: 'clamp(40px, 10vw, 56px)', height: 'clamp(40px, 10vw, 56px)', borderRadius: 12, objectFit: 'cover', border: `3px solid ${cardBg}`, display: 'block' }} />
                          : <div style={{ width: 'clamp(40px, 10vw, 56px)', height: 'clamp(40px, 10vw, 56px)', borderRadius: 12, background: '#5120c8', border: `3px solid ${cardBg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 600 }}>{getInitials(c)}</div>}
                        {c.isVerified && (
                          <div style={{ position: 'absolute', bottom: -4, left: -5, width: 20, height: 20, borderRadius: '50%', background: '#5120c8', border: '2px solid #ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(81,32,200,0.5)' }}>
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '30px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>
                      <h3 style={{ color: text, fontSize: 'clamp(12px, 3vw, 15px)', fontWeight: 600, margin: '0 0 1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.profile?.firstName} {c.profile?.lastName}</h3>
                      {c.profile?.speciality && <p style={{ color: '#5120c8', fontSize: 'clamp(10px, 2.5vw, 13px)', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.profile.speciality}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {years > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: subtext, fontSize: 11 }}><Briefcase size={11} />{years} {isAr ? 'سنة' : 'yrs'}</span>}
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: subtext, fontSize: 11 }}><Clock size={11} />{c.profile?.sessionDuration || 60} {isAr ? 'دقيقة' : 'min'}</span>
                      {quals.length > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: subtext, fontSize: 11 }}><GraduationCap size={11} />{quals.length} {isAr ? 'مؤهل' : 'quals'}</span>}
                    </div>
                    {c.profile?.bio && <p style={{ color: subtext, fontSize: 12, lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.profile.bio}</p>}
                    {areas.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {areas.slice(0, 3).map((a: string, i: number) => <span key={i} style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: 'rgba(81,32,200,0.06)', border: '1px solid rgba(81,32,200,0.15)', color: '#5120c8' }}>{a}</span>)}
                        {areas.length > 3 && <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, background: 'var(--surface)', border: `1px solid ${border}`, color: subtext }}>+{areas.length - 3}</span>}
                      </div>
                    )}
                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 8 }}>
                      <div>
                        <div style={{ color: '#5120c8', fontSize: 'clamp(13px, 3.5vw, 16px)', fontWeight: 700, lineHeight: 1 }}>{price > 0 ? formatMoney(price, c.hourlyRateDisplay || c.profile?.sessionPriceDisplay) : (isAr ? 'مجاني' : 'Free')}</div>
                        {price > 0 && <div style={{ color: subtext, fontSize: 10 }}>{isAr ? 'للجلسة' : 'per session'}</div>}
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <button onClick={() => setDetailConsultant(c)} style={{ width: '100%', padding: '6px 4px', borderRadius: 9, cursor: 'pointer', border: `1px solid ${border}`, background: 'transparent', color: text, fontSize: 'clamp(10px, 2.5vw, 12px)', fontWeight: 600, transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(81,32,200,0.3)'; e.currentTarget.style.color = '#5120c8' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = text }}>
                          {isAr ? 'التفاصيل' : 'Details'}
                        </button>
                        <button onClick={() => router.push(`/${locale}/coaching/${c.id}/book`)} style={{ width: '100%', padding: '6px 4px', borderRadius: 9, cursor: 'pointer', background: '#5120c8', color: '#ffffff', border: 'none', fontSize: 'clamp(10px, 2.5vw, 12px)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                          {isAr ? 'احجز' : 'Book'}<ChevronRight size={12} style={{ transform: isAr ? 'rotate(180deg)' : 'none' }} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {detailConsultant && (
        <>
          <div onClick={() => setDetailConsultant(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 100, backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'fixed', top: 0, bottom: 0, [isAr ? 'right' : 'left']: 0, width: 'min(480px,100vw)', background: cardBg, zIndex: 101, display: 'flex', flexDirection: 'column', overflowY: 'auto', borderLeft: isAr ? 'none' : `1px solid ${border}`, borderRight: isAr ? `1px solid ${border}` : 'none' }}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: cardBg, zIndex: 10 }}>
              <h3 style={{ color: text, fontSize: 15, fontWeight: 600, margin: 0 }}>{isAr ? 'ملف المستشار' : 'Consultant Profile'}</h3>
              <button onClick={() => setDetailConsultant(null)} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: subtext }}><X size={14} /></button>
            </div>
            <div style={{ padding: '22px', flex: 1 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 18 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {detailConsultant.profile?.avatar ? <img src={detailConsultant.profile.avatar} alt="" style={{ width: 60, height: 60, borderRadius: 14, objectFit: 'cover' }} /> : <div style={{ width: 60, height: 60, borderRadius: 14, background: '#5120c8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 600 }}>{getInitials(detailConsultant)}</div>}
                  {detailConsultant.isVerified && <div style={{ position: 'absolute', bottom: -3, left: -5, width: 20, height: 20, borderRadius: '50%', background: '#5120c8', border: '2px solid #ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg></div>}
                </div>
                <div>
                  <h2 style={{ color: text, fontSize: 17, fontWeight: 700, margin: '0 0 2px' }}>{detailConsultant.profile?.firstName} {detailConsultant.profile?.lastName}</h2>
                  {detailConsultant.profile?.speciality && <p style={{ color: '#5120c8', fontSize: 12, fontWeight: 600, margin: '0 0 3px' }}>{detailConsultant.profile.speciality}</p>}
                  {detailConsultant.isVerified && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#16a34a', fontSize: 11, fontWeight: 500 }}><CheckCircle2 size={11} />{isAr ? 'مستشار موثق' : 'Verified'}</span>}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 18 }}>
                {[
                  { v: detailConsultant.profile?.yearsExperience || 0, s: isAr ? 'سنة خبرة' : 'yrs exp' },
                  { v: detailConsultant.profile?.sessionDuration || 60, s: isAr ? 'دقيقة' : 'min' },
                  { v: detailConsultant._count?.consultantSessions || 0, s: isAr ? 'جلسة' : 'sessions' },
                ].map((s, i) => (
                  <div key={i} style={{ padding: '10px', borderRadius: 10, textAlign: 'center', border: `1px solid ${border}`, background: 'var(--surface)' }}>
                    <div style={{ color: '#5120c8', fontSize: 16, fontWeight: 800 }}>{s.v}</div>
                    <div style={{ color: subtext, fontSize: 10, marginTop: 1 }}>{s.s}</div>
                  </div>
                ))}
              </div>
              {detailConsultant.profile?.bio && <div style={{ marginBottom: 16 }}><h4 style={{ color: text, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{isAr ? 'نبذة مهنية' : 'About'}</h4><p style={{ color: subtext, fontSize: 12, lineHeight: 1.7, margin: 0 }}>{detailConsultant.profile.bio}</p></div>}
              {detailConsultant.profile?.consultingAreas?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ color: text, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{isAr ? 'مجالات الاستشارات' : 'Consulting Areas'}</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {detailConsultant.profile.consultingAreas.map((a: string, i: number) => <span key={i} style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(81,32,200,0.08)', border: '1px solid rgba(81,32,200,0.2)', color: '#5120c8' }}>{a}</span>)}
                  </div>
                </div>
              )}
              {detailConsultant.profile?.qualifications?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ color: text, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{isAr ? 'المؤهلات' : 'Qualifications'}</h4>
                  {detailConsultant.profile.qualifications.map((q: string, i: number) => <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', marginBottom: 6 }}><CheckCircle2 size={13} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} /><span style={{ color: 'var(--foreground-2)', fontSize: 12 }}>{q}</span></div>)}
                </div>
              )}
              {detailConsultant.profile?.linkedinUrl && (
                <a href={detailConsultant.profile.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 12px', borderRadius: 9, border: `1px solid ${border}`, background: 'var(--surface)', textDecoration: 'none', color: text, fontSize: 12, fontWeight: 600 }}>
                  <Linkedin size={14} color="#0077b5" />{isAr ? 'عرض LinkedIn' : 'View LinkedIn'}
                  <ChevronRight size={12} color={subtext} style={{ marginRight: isAr ? 'auto' : 0, marginLeft: isAr ? 0 : 'auto', transform: isAr ? 'rotate(180deg)' : 'none' }} />
                </a>
              )}
            </div>
            <div style={{ padding: '14px 22px', borderTop: `1px solid ${border}`, display: 'flex', gap: 8, alignItems: 'center', position: 'sticky', bottom: 0, background: cardBg }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#5120c8', fontSize: 18, fontWeight: 700 }}>{(detailConsultant.hourlyRate || parseFloat(detailConsultant.profile?.sessionPrice || '0')) > 0 ? formatMoney(detailConsultant.hourlyRate || detailConsultant.profile?.sessionPrice, detailConsultant.hourlyRateDisplay || detailConsultant.profile?.sessionPriceDisplay) : (isAr ? 'مجاني' : 'Free')}</div>
                <div style={{ color: subtext, fontSize: 10 }}>{isAr ? 'للجلسة' : 'per session'}</div>
              </div>
              <button onClick={() => router.push(`/${locale}/coaching/${detailConsultant.id}/book`)} style={{ flex: 2, padding: '12px', borderRadius: 11, background: '#5120c8', color: '#ffffff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <Calendar size={14} />{isAr ? 'احجز الآن' : 'Book Now'}
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  )
}
