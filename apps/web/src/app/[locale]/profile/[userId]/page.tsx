'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { learnUrl } from '../../../../lib/constants'

export default function PublicProfilePage() {
  const params = useParams()
  const userId = params?.userId as string
  const locale = params?.locale as string || 'ar'
  const isAr = locale === 'ar'
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://deve-way.onrender.com/api'

  useEffect(() => {
    fetch(`${apiBase}/users/profile/${userId}`)
      .then(r => r.json())
      .then(d => { setProfile(d?.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [userId])

  if (loading) return (
    <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:'40px', height:'40px', borderRadius:'50%', border:'3px solid rgba(81,32,200,0.3)', borderTopColor:'#5120c8', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (!profile) return (
    <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'1rem' }}>
      <p style={{ color:'#888' }}>{isAr ? 'المستخدم غير موجود' : 'User not found'}</p>
      <Link href={`/${locale}`} style={{ color:'#a78bfa', textDecoration:'none' }}>{isAr ? 'العودة للرئيسية' : 'Back to home'}</Link>
    </div>
  )

  const p = profile.profile || {}
  const fullName = [p.firstName, p.lastName].filter(Boolean).join(' ') || (isAr ? 'مستخدم DeveWay' : 'DeveWay User')
  const isInstructor = profile.accountType === 'INSTRUCTOR'

  return (
    <div style={{ maxWidth:'900px', margin:'0 auto', padding:'2rem 1rem' }}>

      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'20px', padding:'2rem', marginBottom:'1.5rem', display:'flex', gap:'1.5rem', alignItems:'flex-start', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flexShrink:0 }}>
          {p.avatar ? (
            <img src={p.avatar} alt={fullName} style={{ width:'96px', height:'96px', borderRadius:'50%', objectFit:'cover', border:'3px solid rgba(81,32,200,0.4)' }}/>
          ) : (
            <div style={{ width:'96px', height:'96px', borderRadius:'50%', background:'linear-gradient(135deg,#5120c8,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', fontWeight:700, color:'#fff', border:'3px solid rgba(81,32,200,0.4)' }}>
              {fullName.charAt(0)}
            </div>
          )}
          {profile.isVerified && (
            <div style={{ position:'absolute', bottom:0, right:0, width:'28px', height:'28px', borderRadius:'50%', background:'#5120c8', border:'2px solid var(--background, #0d0d0d)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          )}
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap', marginBottom:'4px' }}>
            <h1 style={{ fontSize:'1.4rem', fontWeight:800, margin:0 }}>{fullName}</h1>
            {profile.isVerified && (
              <span style={{ padding:'2px 10px', borderRadius:'20px', fontSize:'0.72rem', fontWeight:600, background:'rgba(81,32,200,0.15)', border:'1px solid rgba(81,32,200,0.3)', color:'#a78bfa' }}>
                {isAr ? ' موثق' : ' Verified'}
              </span>
            )}
            <span style={{ padding:'2px 10px', borderRadius:'20px', fontSize:'0.72rem', fontWeight:600, background: isInstructor ? 'rgba(251,191,36,0.1)' : 'rgba(34,197,94,0.1)', border: isInstructor ? '1px solid rgba(251,191,36,0.3)' : '1px solid rgba(34,197,94,0.3)', color: isInstructor ? '#fbbf24' : '#4ade80' }}>
              {isInstructor ? (isAr ? 'محاضر' : 'Instructor') : (isAr ? 'طالب' : 'Student')}
            </span>
          </div>

          {p.speciality && (
            <p style={{ color:'#9999aa', fontSize:'0.9rem', margin:'0 0 8px' }}>{p.speciality}</p>
          )}

          {p.bio && (
            <p style={{ color:'var(--muted-foreground)', fontSize:'0.88rem', lineHeight:1.7, margin:'0 0 1rem', maxWidth:'500px' }}>{p.bio}</p>
          )}

          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
            {p.country && (
              <span style={{ display:'flex', alignItems:'center', gap:'4px', color:'#666680', fontSize:'0.8rem' }}>{p.country}</span>
            )}
            {p.linkedinUrl && (
              <a href={p.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ color:'#a78bfa', fontSize:'0.8rem', textDecoration:'none' }}>{p.linkedinUrl.replace(/https?:\/\//, '')}</a>
            )}
            <span style={{ color:'#666680', fontSize:'0.8rem' }}>
              {isAr ? `انضم ${new Date(profile.joinedAt).toLocaleDateString('ar-SA', { year:'numeric', month:'long' })}` : `Joined ${new Date(profile.joinedAt).toLocaleDateString('en-US', { year:'numeric', month:'long' })}`}
            </span>
          </div>
        </div>
      </div>

      {isInstructor && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
          {[
            { value: profile.stats.publishedCourses, labelAr: 'كورس منشور', labelEn: 'Courses' },
            { value: profile.stats.totalStudents, labelAr: 'طالب', labelEn: 'Students' },
            { value: profile.isVerified ? (isAr ? 'موثق' : 'Verified') : (isAr ? 'غير موثق' : 'Unverified'), labelAr: 'التوثيق', labelEn: 'Status' },
          ].map((stat, i) => (
            <div key={i} style={{ padding:'1.25rem', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'12px', textAlign:'center' }}>
              <p style={{ fontSize:'1.6rem', fontWeight:800, margin:'0 0 4px', color: i===2 && profile.isVerified ? '#a78bfa' : 'var(--foreground)' }}>{stat.value}</p>
              <p style={{ fontSize:'0.78rem', color:'var(--muted-foreground)', margin:0 }}>{isAr ? stat.labelAr : stat.labelEn}</p>
            </div>
          ))}
        </div>
      )}

      {isInstructor && profile.courses?.length > 0 && (
        <div>
          <h2 style={{ fontSize:'1.1rem', fontWeight:700, marginBottom:'1rem' }}>{isAr ? 'كورسات المحاضر' : 'Instructor Courses'}</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:'1rem' }}>
            {profile.courses.map((course: any) => (
              <Link key={course.id} href={learnUrl(`/${locale}/courses/${course.id}`)} style={{ textDecoration:'none' }}>
                <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'12px', overflow:'hidden', transition:'border-color 0.2s', cursor:'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(81,32,200,0.4)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}>
                  <div style={{ height:'130px', background:'#1a1a2e', overflow:'hidden' }}>
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.titleAr || course.titleEn} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                    ) : (
                      <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#1a0a2e,#2d1054)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                      </div>
                    )}
                  </div>
                  <div style={{ padding:'0.75rem 1rem' }}>
                    <p style={{ fontWeight:600, fontSize:'0.88rem', margin:'0 0 6px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--foreground)' }}>{isAr ? course.titleAr : course.titleEn}</p>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontSize:'0.78rem', color:'var(--muted-foreground)' }}>{course._count?.enrollments || 0} {isAr ? 'طالب' : 'students'}</span>
                      <span style={{ fontSize:'0.82rem', fontWeight:600, color: course.price === 0 ? '#4ade80' : 'var(--foreground)' }}>{course.price === 0 ? (isAr ? 'مجاني' : 'Free') : `${course.price} ر.س`}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
