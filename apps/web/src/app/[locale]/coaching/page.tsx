'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { localDateTimeToISO } from '@/lib/time'
import {
  Search, X, ChevronRight, Briefcase, Clock,
  CheckCircle2, Calendar, DollarSign, GraduationCap,
  Linkedin, Users, SlidersHorizontal, Video,
  Code2, Palette, TrendingUp, BarChart3, Shield, Star
} from 'lucide-react'

const API = 'https://deve-way.onrender.com/api'

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
  const [bookingConsultant, setBookingConsultant] = useState<any>(null)
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
      case 'price-low': result.sort((a: any, b: any) => parseFloat(a.profile?.sessionPrice || '0') - parseFloat(b.profile?.sessionPrice || '0')); break
      case 'price-high': result.sort((a: any, b: any) => parseFloat(b.profile?.sessionPrice || '0') - parseFloat(a.profile?.sessionPrice || '0')); break
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
          <h1 style={{ color: text, fontSize: 'clamp(26px,4vw,42px)', fontWeight: 900, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
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

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => {
              const count = getCategoryCount(cat.key)
              const active = activeFilter === cat.key
              return (
                <button key={cat.key} onClick={() => setActiveFilter(cat.key)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.15s', border: active ? 'none' : `1px solid ${border}`, background: active ? '#5120c8' : 'transparent', color: active ? '#ffffff' : subtext }}>
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

        <div style={{ color: subtext, fontSize: 12, marginBottom: 18 }}>
          {consultants.length} {isAr ? 'مستشار' : 'consultants'}
        </div>

        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
            {[1,2,3,4,5,6].map(i => <div key={i} style={{ height: 280, borderRadius: 16, animation: 'pulse 1.5s infinite', background: 'var(--surface)' }}><style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style></div>)}
          </div>
        ) : consultants.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <Users size={44} color={subtext} style={{ marginBottom: 16, opacity: 0.4 }} />
            <h3 style={{ color: text, fontSize: 18, fontWeight: 800, margin: '0 0 8px' }}>{isAr ? 'لا يوجد مستشارون' : 'No consultants found'}</h3>
            <button onClick={() => { setSearch(''); setActiveFilter('all') }} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 10, background: '#5120c8', color: '#ffffff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
              {isAr ? 'عرض الكل' : 'Show All'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
            {consultants.map((c: any, idx: number) => {
              const price = parseFloat(c.profile?.sessionPrice || '0')
              const years = c.profile?.yearsExperience || 0
              const areas = c.profile?.consultingAreas || []
              const quals = c.profile?.qualifications || []
              return (
                <div key={c.id} className="c-card" style={{ animationDelay: `${(idx % 12) * 0.045}s`, background: cardBg, borderRadius: 16, border: `1px solid ${border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all 0.2s ease', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(81,32,200,0.35)'; e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}>
                  <div style={{ height: 68, background: 'var(--surface)', position: 'relative', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 8, [isAr ? 'right' : 'left']: 10, display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 10, fontWeight: 700 }}>
                      <Calendar size={9} />{c._count?.consultantSessions || 0} {isAr ? 'جلسة' : 'sessions'}
                    </div>
                    <div style={{ position: 'absolute', bottom: -22, [isAr ? 'right' : 'left']: 18 }}>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        {c.profile?.avatar
                          ? <img src={c.profile.avatar} alt="" style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover', border: `3px solid ${cardBg}`, display: 'block' }} />
                          : <div style={{ width: 48, height: 48, borderRadius: 12, background: '#5120c8', border: `3px solid ${cardBg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 800 }}>{getInitials(c)}</div>}
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
                      <h3 style={{ color: text, fontSize: 15, fontWeight: 800, margin: '0 0 1px' }}>{c.profile?.firstName} {c.profile?.lastName}</h3>
                      {c.profile?.speciality && <p style={{ color: '#5120c8', fontSize: 12, fontWeight: 600, margin: 0 }}>{c.profile.speciality}</p>}
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
                        <div style={{ color: '#5120c8', fontSize: 18, fontWeight: 900, lineHeight: 1 }}>{price > 0 ? price : (isAr ? 'مجاني' : 'Free')}{price > 0 && <span style={{ fontSize: 10, fontWeight: 500, color: subtext, marginRight: 2 }}> {isAr ? 'ر.س' : 'SAR'}</span>}</div>
                        {price > 0 && <div style={{ color: subtext, fontSize: 10 }}>{isAr ? 'للجلسة' : 'per session'}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setDetailConsultant(c)} style={{ padding: '8px 12px', borderRadius: 9, cursor: 'pointer', border: `1px solid ${border}`, background: 'transparent', color: text, fontSize: 11, fontWeight: 600, transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(81,32,200,0.3)'; e.currentTarget.style.color = '#5120c8' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = text }}>
                          {isAr ? 'التفاصيل' : 'Details'}
                        </button>
                        <button onClick={() => setBookingConsultant(c)} style={{ padding: '8px 14px', borderRadius: 9, cursor: 'pointer', background: '#5120c8', color: '#ffffff', border: 'none', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
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
              <h3 style={{ color: text, fontSize: 15, fontWeight: 800, margin: 0 }}>{isAr ? 'ملف المستشار' : 'Consultant Profile'}</h3>
              <button onClick={() => setDetailConsultant(null)} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: subtext }}><X size={14} /></button>
            </div>
            <div style={{ padding: '22px', flex: 1 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 18 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {detailConsultant.profile?.avatar ? <img src={detailConsultant.profile.avatar} alt="" style={{ width: 60, height: 60, borderRadius: 14, objectFit: 'cover' }} /> : <div style={{ width: 60, height: 60, borderRadius: 14, background: '#5120c8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 800 }}>{getInitials(detailConsultant)}</div>}
                  {detailConsultant.isVerified && <div style={{ position: 'absolute', bottom: -3, left: -5, width: 20, height: 20, borderRadius: '50%', background: '#5120c8', border: '2px solid #ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg></div>}
                </div>
                <div>
                  <h2 style={{ color: text, fontSize: 17, fontWeight: 900, margin: '0 0 2px' }}>{detailConsultant.profile?.firstName} {detailConsultant.profile?.lastName}</h2>
                  {detailConsultant.profile?.speciality && <p style={{ color: '#5120c8', fontSize: 12, fontWeight: 600, margin: '0 0 3px' }}>{detailConsultant.profile.speciality}</p>}
                  {detailConsultant.isVerified && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#16a34a', fontSize: 11, fontWeight: 700 }}><CheckCircle2 size={11} />{isAr ? 'مستشار موثق' : 'Verified'}</span>}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 18 }}>
                {[
                  { v: detailConsultant.profile?.yearsExperience || 0, s: isAr ? 'سنة خبرة' : 'yrs exp' },
                  { v: detailConsultant.profile?.sessionDuration || 60, s: isAr ? 'دقيقة' : 'min' },
                  { v: detailConsultant._count?.consultantSessions || 0, s: isAr ? 'جلسة' : 'sessions' },
                ].map((s, i) => (
                  <div key={i} style={{ padding: '10px', borderRadius: 10, textAlign: 'center', border: `1px solid ${border}`, background: 'var(--surface)' }}>
                    <div style={{ color: '#5120c8', fontSize: 16, fontWeight: 900 }}>{s.v}</div>
                    <div style={{ color: subtext, fontSize: 10, marginTop: 1 }}>{s.s}</div>
                  </div>
                ))}
              </div>
              {detailConsultant.profile?.bio && <div style={{ marginBottom: 16 }}><h4 style={{ color: text, fontSize: 12, fontWeight: 800, marginBottom: 6 }}>{isAr ? 'نبذة مهنية' : 'About'}</h4><p style={{ color: subtext, fontSize: 12, lineHeight: 1.7, margin: 0 }}>{detailConsultant.profile.bio}</p></div>}
              {detailConsultant.profile?.consultingAreas?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ color: text, fontSize: 12, fontWeight: 800, marginBottom: 8 }}>{isAr ? 'مجالات الاستشارات' : 'Consulting Areas'}</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {detailConsultant.profile.consultingAreas.map((a: string, i: number) => <span key={i} style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(81,32,200,0.08)', border: '1px solid rgba(81,32,200,0.2)', color: '#5120c8' }}>{a}</span>)}
                  </div>
                </div>
              )}
              {detailConsultant.profile?.qualifications?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ color: text, fontSize: 12, fontWeight: 800, marginBottom: 8 }}>{isAr ? 'المؤهلات' : 'Qualifications'}</h4>
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
                <div style={{ color: '#5120c8', fontSize: 18, fontWeight: 900 }}>{parseFloat(detailConsultant.profile?.sessionPrice || '0') > 0 ? `${detailConsultant.profile.sessionPrice} ${isAr ? 'ر.س' : 'SAR'}` : (isAr ? 'مجاني' : 'Free')}</div>
                <div style={{ color: subtext, fontSize: 10 }}>{isAr ? 'للجلسة' : 'per session'}</div>
              </div>
              <button onClick={() => { setDetailConsultant(null); setBookingConsultant(detailConsultant) }} style={{ flex: 2, padding: '12px', borderRadius: 11, background: '#5120c8', color: '#ffffff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <Calendar size={14} />{isAr ? 'احجز الآن' : 'Book Now'}
              </button>
            </div>
          </div>
        </>
      )}

      {bookingConsultant && (
        <BookingModal consultant={bookingConsultant} isAr={isAr} locale={locale} onClose={() => setBookingConsultant(null)} onSuccess={() => { setBookingConsultant(null); router.push(`/${locale}/dashboard/my-sessions`) }} cardBg={cardBg} border={border} text={text} subtext={subtext} />
      )}
    </div>
  )
}

function formatTimeSlot(time: string, locale: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  const formatted = `${hour12}:${m.toString().padStart(2, '0')} ${period}`
  if (locale === 'ar') {
    return formatted.replace('AM', 'ص').replace('PM', 'م')
  }
  return formatted
}

function BookingModal({ consultant, isAr, locale, onClose, onSuccess, cardBg, border, text, subtext }: any) {
  const [step, setStep] = useState<1|2|3>(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ sessionName: '', topic: '', description: '', date: '', time: '', meetingType: 'zoom' as 'zoom'|'meet' })

  const today = new Date().toISOString().split('T')[0]
  const isToday = form.date === today
  const slots = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'].filter(t => !isToday || parseInt(t) > new Date().getHours() + 1)
  const step1Ok = form.sessionName.trim() && form.topic.trim() && form.date && form.time

  const handleBook = async () => {
    setLoading(true)
    try {
      // Debug: log token existence
      const token = localStorage.getItem('careerhub_token') || localStorage.getItem('deveway_token') || ''
      console.log('[Booking] token exists:', !!token)
      const scheduledAt = localDateTimeToISO(form.date, form.time)
      console.log('[Booking] payload:', { consultantId: consultant.id, sessionName: form.sessionName, topic: form.topic, scheduledAt })

      const res = await fetch('https://deve-way.onrender.com/api/consulting/sessions/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ consultantId: consultant.id, sessionName: form.sessionName, topic: form.topic, description: form.description, scheduledAt, meetingType: form.meetingType, duration: consultant.profile?.sessionDuration || 60 })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed')
      console.log('[Booking] success:', data)
    } catch(e: any) { console.error('[Booking] error:', e.message) }
    setLoading(false)
    onSuccess()
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 200, backdropFilter: 'blur(6px)' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'min(480px,calc(100vw - 24px))', maxHeight: '92vh', overflowY: 'auto', background: cardBg, borderRadius: 20, border: `1px solid ${border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', zIndex: 201, direction: isAr ? 'rtl' : 'ltr' }}>
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: cardBg, borderRadius: '20px 20px 0 0', zIndex: 10 }}>
          <div>
            <h3 style={{ color: text, fontSize: 15, fontWeight: 800, margin: 0 }}>{isAr ? 'احجز جلسة' : 'Book Session'}</h3>
            <p style={{ color: '#5120c8', fontSize: 11, margin: '2px 0 0', fontWeight: 600 }}>{consultant.profile?.firstName} {consultant.profile?.lastName}</p>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: subtext }}><X size={14} /></button>
        </div>

        <div style={{ padding: '14px 22px', borderBottom: `1px solid ${border}`, display: 'flex', gap: 8, alignItems: 'center' }}>
          {[{n:1,ar:'تفاصيل الجلسة',en:'Session Details'},{n:2,ar:'نوع الاجتماع',en:'Meeting Type'},{n:3,ar:'تأكيد',en:'Confirm'}].map((s,i) => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'auto', gap: 5 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: step >= s.n ? '#5120c8' : ('var(--surface)'), border: `2px solid ${step >= s.n ? '#5120c8' : border}` }}>
                {step > s.n ? <CheckCircle2 size={12} color="#fff" /> : <span style={{ color: step === s.n ? '#fff' : subtext, fontSize: 10, fontWeight: 800 }}>{s.n}</span>}
              </div>
              <span style={{ color: step === s.n ? text : subtext, fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}>{isAr ? s.ar : s.en}</span>
              {i < 2 && <div style={{ flex: 1, height: 1, background: step > s.n ? '#5120c8' : border }} />}
            </div>
          ))}
        </div>

        <div style={{ padding: '20px 22px' }}>
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { key: 'sessionName', label: isAr ? 'اسم الجلسة' : 'Session Name', placeholder: isAr ? 'مثال: جلسة تطوير المسار المهني' : 'e.g. Career development session', required: true },
                { key: 'topic', label: isAr ? 'هدف الجلسة' : 'Session Goal', placeholder: isAr ? 'مثال: تطوير مسيرتي في البرمجة...' : 'e.g. Improve my programming career...', required: true },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ color: text, fontSize: 12, fontWeight: 700, marginBottom: 6, display: 'block' }}>{f.label} {f.required && '*'}</label>
                  <input type="text" placeholder={f.placeholder} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '11px 13px', borderRadius: 9, border: `1.5px solid ${(form as any)[f.key] ? '#5120c8' : border}`, background: 'var(--background)', color: text, fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ color: text, fontSize: 12, fontWeight: 700, marginBottom: 6, display: 'block' }}>{isAr ? 'وصف إضافي (اختياري)' : 'Additional Details (optional)'}</label>
                <textarea rows={2} placeholder={isAr ? 'أضف أي تفاصيل...' : 'Add any details...'} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  style={{ width: '100%', padding: '11px 13px', borderRadius: 9, border: `1px solid ${border}`, background: 'var(--background)', color: text, fontSize: 12, outline: 'none', boxSizing: 'border-box', resize: 'none', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ color: text, fontSize: 12, fontWeight: 700, marginBottom: 6, display: 'block' }}>{isAr ? 'التاريخ' : 'Date'} *</label>
                <input type="date" min={today} value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value, time: '' }))}
                  style={{ width: '100%', padding: '11px 13px', borderRadius: 9, border: `1.5px solid ${form.date ? '#5120c8' : border}`, background: 'var(--background)', color: text, fontSize: 13, outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }} />
              </div>
              {form.date && (
                <div>
                  <label style={{ color: text, fontSize: 12, fontWeight: 700, marginBottom: 8, display: 'block' }}>{isAr ? 'الوقت' : 'Time'} *</label>
                  {slots.length === 0 ? (
                    <p style={{ color: '#d97706', fontSize: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                      {isAr ? 'لا توجد مواعيد اليوم، اختر يوماً آخر' : 'No slots today, choose another date'}
                    </p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5 }}>
                      {slots.map(t => <button key={t} onClick={() => setForm(p => ({ ...p, time: t }))} style={{ padding: '8px 2px', borderRadius: 8, cursor: 'pointer', border: `1.5px solid ${form.time === t ? '#5120c8' : border}`, background: form.time === t ? 'rgba(81,32,200,0.08)' : ('var(--surface)'), color: form.time === t ? '#5120c8' : subtext, fontSize: 11, fontWeight: 700 }}>{formatTimeSlot(t, locale)}</button>)}
                    </div>
                  )}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 12px', borderRadius: 9, border: `1px solid ${border}`, background: 'var(--surface)' }}>
                <Clock size={12} color={subtext} />
                <span style={{ color: subtext, fontSize: 11 }}>{isAr ? `مدة الجلسة: ${consultant.profile?.sessionDuration || 60} دقيقة` : `Duration: ${consultant.profile?.sessionDuration || 60} min`}</span>
              </div>
              <button disabled={!step1Ok} onClick={() => setStep(2)} style={{ width: '100%', padding: '12px', borderRadius: 11, background: step1Ok ? '#5120c8' : ('var(--surface)'), color: step1Ok ? '#ffffff' : subtext, border: 'none', cursor: step1Ok ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 700 }}>
                {isAr ? 'التالي ' : 'Next '}
              </button>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h4 style={{ color: text, fontSize: 13, fontWeight: 800, margin: '0 0 4px' }}>{isAr ? 'اختر طريقة الاجتماع' : 'Choose Meeting Type'}</h4>
              {[
                { type: 'zoom', label: 'Zoom', desc: isAr ? 'اجتماع عبر Zoom  رابط سيُرسل بعد الدفع' : 'Via Zoom  link sent after payment', color: '#2D8CFF' },
                { type: 'meet', label: 'Google Meet', desc: isAr ? 'اجتماع عبر Google Meet  رابط سيُرسل بعد الدفع' : 'Via Google Meet  link sent after payment', color: '#00897B' },
              ].map(m => (
                <div key={m.type} onClick={() => setForm(p => ({ ...p, meetingType: m.type as 'zoom'|'meet' }))} style={{ padding: '15px', borderRadius: 12, cursor: 'pointer', border: `2px solid ${form.meetingType === m.type ? '#5120c8' : border}`, background: form.meetingType === m.type ? 'var(--primary-subtle)' : cardBg, display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Video size={18} color="white" /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: text, fontSize: 13, fontWeight: 800 }}>{m.label}</div>
                    <div style={{ color: subtext, fontSize: 11, marginTop: 1 }}>{m.desc}</div>
                  </div>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, border: `2px solid ${form.meetingType === m.type ? '#5120c8' : border}`, background: form.meetingType === m.type ? '#5120c8' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {form.meetingType === m.type && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: '11px', borderRadius: 10, cursor: 'pointer', border: `1px solid ${border}`, background: 'transparent', color: subtext, fontSize: 12, fontWeight: 600 }}>{isAr ? 'رجوع' : 'Back'}</button>
                <button onClick={() => setStep(3)} style={{ flex: 2, padding: '11px', borderRadius: 10, cursor: 'pointer', background: '#5120c8', color: '#ffffff', border: 'none', fontSize: 12, fontWeight: 700 }}>{isAr ? 'التالي ' : 'Next '}</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: '14px', borderRadius: 12, border: `1px solid ${border}`, background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {consultant.profile?.avatar ? <img src={consultant.profile.avatar} style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover' }} alt="" /> : <div style={{ width: 34, height: 34, borderRadius: 8, background: '#5120c8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13 }}>{consultant.profile?.firstName?.[0]}</div>}
                  <div><div style={{ color: text, fontSize: 13, fontWeight: 700 }}>{consultant.profile?.firstName} {consultant.profile?.lastName}</div><div style={{ color: '#5120c8', fontSize: 11 }}>{consultant.profile?.speciality}</div></div>
                </div>
                <div style={{ height: 1, background: border }} />
                {[
                  { ar: 'اسم الجلسة', en: 'Session Name', v: form.sessionName },
                  { ar: 'الهدف', en: 'Goal', v: form.topic },
                  { ar: 'التاريخ', en: 'Date', v: form.date },
                  { ar: 'الوقت', en: 'Time', v: form.time },
                  { ar: 'المدة', en: 'Duration', v: `${consultant.profile?.sessionDuration || 60} ${isAr ? 'دقيقة' : 'min'}` },
                  { ar: 'نوع الاجتماع', en: 'Meeting', v: form.meetingType === 'zoom' ? 'Zoom' : 'Google Meet' },
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ color: subtext, fontSize: 12 }}>{isAr ? r.ar : r.en}</span>
                    <span style={{ color: text, fontSize: 12, fontWeight: 600, textAlign: isAr ? 'left' : 'right', maxWidth: '60%' }}>{r.v}</span>
                  </div>
                ))}
                <div style={{ height: 1, background: border }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: text, fontSize: 13, fontWeight: 700 }}>{isAr ? 'السعر' : 'Price'}</span>
                  <span style={{ color: '#5120c8', fontSize: 17, fontWeight: 900 }}>{parseFloat(consultant.profile?.sessionPrice || '0') > 0 ? `${consultant.profile.sessionPrice} ${isAr ? 'ر.س' : 'SAR'}` : (isAr ? 'مجاني' : 'Free')}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(2)} style={{ flex: 1, padding: '11px', borderRadius: 10, cursor: 'pointer', border: `1px solid ${border}`, background: 'transparent', color: subtext, fontSize: 12, fontWeight: 600 }}>{isAr ? 'رجوع' : 'Back'}</button>
                <button onClick={handleBook} disabled={loading} style={{ flex: 2, padding: '11px', borderRadius: 10, cursor: loading ? 'wait' : 'pointer', background: '#5120c8', color: '#ffffff', border: 'none', fontSize: 13, fontWeight: 700, opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  {loading ? (isAr ? 'جاري الحجز...' : 'Booking...') : <><CheckCircle2 size={14} />{isAr ? 'تأكيد الحجز' : 'Confirm'}</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
