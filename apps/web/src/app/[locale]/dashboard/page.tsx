'use client'

import { useEffect, useState, useMemo } from 'react'
import { useLocale } from 'next-intl'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { BookOpen, Users, PlusCircle, Calendar, ArrowLeft, ChevronLeft, Shield, AlertTriangle, Hand } from 'lucide-react'
import { get } from '../../../lib/api'
import { unwrapData } from '../../../lib/unwrap'
import { getMediaUrl } from '../../../lib/media'
import { AuthGate } from '../../components/AuthGate'
import { DashboardShell } from '../../components/DashboardShell'
import { CourseCard, type CourseCardCourse } from '../../components/CourseCard'
import { Skeleton } from '../../components/ui/Skeleton'
import VerifiedBadge from '../../../components/VerifiedBadge'
import { useToast } from '../../../lib/toast'
import { useAuthStore } from '../../../stores/authStore'

/* ════════════════════════════════════════════════════════
   INSTRUCTOR OVERVIEW — PROFESSIONAL DESIGN
   ════════════════════════════════════════════════════════ */

function InstructorOverview() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const { user } = useAuthStore()

  const { data: stats } = useQuery({
    queryKey: ['instructor-stats'],
    queryFn: async () => {
      const res = await get('/courses/instructor/stats')
      const d = (res?.data as any)?.data ?? {}
      return { totalCourses: d.totalCourses ?? 0, totalStudents: d.totalStudents ?? 0, revenue: d.totalRevenue ?? 0 }
    },
  })

  const { data: courses = [] } = useQuery({
    queryKey: ['instructor-courses-preview'],
    queryFn: async () => {
      const res = await get('/courses/my-courses')
      const d = (res?.data as any)?.data ?? (res?.data as any)
      return Array.isArray(d) ? d.slice(0, 5) : []
    },
  })

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px' }}>
      <style>{`
        .dashboard-two-col { display: grid; grid-template-columns: 1fr 320px; gap: 1.25rem; }
        @media (max-width: 768px) { .dashboard-two-col { grid-template-columns: 1fr; } }
      `}</style>

      <div style={{
        background: 'linear-gradient(135deg, rgba(81,32,200,0.18) 0%, rgba(81,32,200,0.05) 100%)',
        border: '1px solid rgba(81,32,200,0.25)',
        borderRadius: '16px',
        padding: '1.75rem 2rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            border: '2px solid rgba(81,32,200,0.5)',
            overflow: 'hidden', flexShrink: 0,
            background: 'linear-gradient(135deg,#5120c8,#7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem', fontWeight: 700, color: '#fff',
          }}>
            {user?.profile?.avatar
              ? <img src={user.profile.avatar} alt=""
                  style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              : (user?.profile?.firstName?.[0] || 'م')
            }
          </div>
          <div>
            <p style={{ color:'#a78bfa', fontSize:'0.8rem', fontWeight:500, margin:'0 0 3px' }}>
              {isAr ? 'لوحة التحكم' : 'Dashboard'}
            </p>
            <h1 style={{ fontSize:'1.4rem', fontWeight:800, margin:'0 0 3px' }}>
              {isAr ? `مرحباً، ${user?.profile?.firstName || 'المحاضر'}` : `Welcome, ${user?.profile?.firstName || 'Instructor'}`}
            </h1>
            <p style={{ color:'var(--muted-foreground)', fontSize:'0.82rem', margin:0 }}>
              {isAr ? 'إليك ملخص نشاطك' : "Here's your activity overview"}
            </p>
          </div>
        </div>
        <a href={`/${locale}/dashboard/create-course`} style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '11px 22px', borderRadius: '10px',
          background: '#5120c8', color: '#fff',
          fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none',
          boxShadow: '0 4px 15px rgba(81,32,200,0.3)',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {isAr ? 'إنشاء كورس جديد' : 'New Course'}
        </a>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        {[
          {
            labelAr: 'الكورسات', labelEn: 'Courses',
            value: stats?.totalCourses ?? courses?.length ?? 0,
            color: '#a78bfa', bg: 'rgba(81,32,200,0.12)',
            href: `/${locale}/dashboard/my-courses`,
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            ),
          },
          {
            labelAr: 'الطلاب', labelEn: 'Students',
            value: stats?.totalStudents ?? 0,
            color: '#34d399', bg: 'rgba(52,211,153,0.12)',
            href: `/${locale}/dashboard/my-courses`,
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            ),
          },
          {
            labelAr: 'الإيرادات', labelEn: 'Revenue',
            value: `${stats?.revenue ?? 0} ر.س`,
            color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',
            href: `/${locale}/dashboard/revenue`,
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            ),
          },
        ].map((stat, i) => (
          <a key={i} href={stat.href} style={{ textDecoration: 'none' }}>
            <div style={{
              padding: '1.25rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '14px',
              display: 'flex', alignItems: 'flex-start', gap: '1rem',
              cursor: 'pointer', transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor='rgba(81,32,200,0.3)'}
            onMouseLeave={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'}
            >
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: stat.bg, flexShrink: 0, color: stat.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {stat.icon}
              </div>
              <div>
                <p style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 2px',
                  color: 'var(--foreground)' }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', margin: 0 }}>
                  {isAr ? stat.labelAr : stat.labelEn}
                </p>
              </div>
            </div>
          </a>
        ))}
      </div>

      <div className="dashboard-two-col" style={{ marginBottom: '1.5rem' }}>
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '14px',
          padding: '1.25rem',
        }}>
          <div style={{ display:'flex', alignItems:'center',
            justifyContent:'space-between', marginBottom:'1rem' }}>
            <h2 style={{ fontSize:'1rem', fontWeight:700, margin:0 }}>
              {isAr ? 'آخر الكورسات' : 'Recent Courses'}
            </h2>
            <a href={`/${locale}/dashboard/my-courses`}
              style={{ fontSize:'0.8rem', color:'#a78bfa', textDecoration:'none' }}>
              {isAr ? 'عرض الكل' : 'View all'}
            </a>
          </div>
          {courses.slice(0,4).map((course: any) => (
            <a key={course.id}
              href={`/${locale}/dashboard/courses/${course.id}/manage`}
              style={{ textDecoration:'none' }}>
              <div style={{
                display:'flex', alignItems:'center', gap:'12px',
                padding:'10px 0',
                borderBottom:'1px solid rgba(255,255,255,0.05)',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity='0.8'}
              onMouseLeave={e => e.currentTarget.style.opacity='1'}
              >
                <div style={{
                  width:'44px', height:'44px', borderRadius:'8px',
                  background:'#1a1a2e', flexShrink:0, overflow:'hidden',
                }}>
                  {course.thumbnail
                    ? <img src={course.thumbnail} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                    : <div style={{ width:'100%', height:'100%',
                        background:'linear-gradient(135deg,#1a0a2e,#2d1054)',
                        display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                          stroke="rgba(255,255,255,0.2)" strokeWidth="1.5">
                          <rect x="2" y="3" width="20" height="14" rx="2"/>
                          <path d="M8 21h8M12 17v4"/>
                        </svg>
                      </div>
                  }
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontWeight:600, fontSize:'0.875rem', margin:'0 0 3px',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                    color:'var(--foreground)' }}>
                    {isAr ? course.titleAr : course.titleEn}
                  </p>
                  <p style={{ fontSize:'0.75rem', color:'var(--muted-foreground)', margin:0 }}>
                    {course._count?.enrollments ?? 0}
                    {isAr ? ' طالب' : ' students'}
                    {course.price === 0 ? (isAr ? ' مجاني' : ' Free') : ` ${course.price} ر.س`}
                  </p>
                </div>
                <div style={{
                  padding:'3px 10px', borderRadius:'20px', fontSize:'0.7rem',
                  fontWeight:600, flexShrink:0,
                  background: course.status === 'PUBLISHED' ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
                  border: `1px solid ${course.status === 'PUBLISHED' ? 'rgba(34,197,94,0.3)' : 'rgba(234,179,8,0.3)'}`,
                  color: course.status === 'PUBLISHED' ? '#4ade80' : '#fbbf24',
                }}>
                  {course.status === 'PUBLISHED' ? (isAr ? 'منشور' : 'Live') : (isAr ? 'مسودة' : 'Draft')}
                </div>
              </div>
            </a>
          ))}
          {courses.length === 0 && (
            <div style={{ textAlign:'center', padding:'2rem', color:'var(--muted-foreground)' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" style={{ margin:'0 auto 8px', display:'block', opacity:0.3 }}>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
              <p style={{ margin:0, fontSize:'0.85rem' }}>
                {isAr ? 'لا توجد كورسات بعد' : 'No courses yet'}
              </p>
            </div>
          )}
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '14px',
          padding: '1.25rem',
        }}>
          <h2 style={{ fontSize:'1rem', fontWeight:700, margin:'0 0 1rem' }}>
            {isAr ? 'إجراءات سريعة' : 'Quick Actions'}
          </h2>
          {[
            {
              labelAr: 'إنشاء كورس جديد', labelEn: 'Create New Course',
              href: `/${locale}/dashboard/create-course`,
              color: '#5120c8', bg: 'rgba(81,32,200,0.1)',
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>,
            },
            {
              labelAr: 'كورساتي', labelEn: 'My Courses',
              href: `/${locale}/dashboard/my-courses`,
              color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>,
            },
            {
              labelAr: 'الإيرادات', labelEn: 'Revenue',
              href: `/${locale}/dashboard/revenue`,
              color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>,
            },
            {
              labelAr: 'الإحصائيات', labelEn: 'Analytics',
              href: `/${locale}/dashboard/analytics`,
              color: '#34d399', bg: 'rgba(52,211,153,0.1)',
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>,
            },
            {
              labelAr: 'الإعدادات', labelEn: 'Settings',
              href: `/${locale}/dashboard/settings`,
              color: '#9999aa', bg: 'rgba(153,153,170,0.1)',
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>,
            },
          ].map((action, i) => (
            <a key={i} href={action.href} style={{ textDecoration:'none', display:'block' }}>
              <div style={{
                display:'flex', alignItems:'center', gap:'12px',
                padding:'10px 12px', borderRadius:'10px', marginBottom:'6px',
                background: 'transparent', cursor:'pointer',
                transition:'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background=action.bg}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
              >
                <div style={{
                  width:'36px', height:'36px', borderRadius:'9px',
                  background: action.bg, flexShrink:0, color: action.color,
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  {action.icon}
                </div>
                <span style={{ fontSize:'0.875rem', fontWeight:500, color:'var(--foreground)' }}>
                  {isAr ? action.labelAr : action.labelEn}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2"
                  style={{ marginRight:'auto', opacity:0.3,
                    transform: isAr ? 'rotate(180deg)' : 'none' }}>
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   STUDENT OVERVIEW — ENHANCED
   ════════════════════════════════════════════════════════ */

type DashboardData = {
  stats?: { enrolledCourses?: number; completedCourses?: number; certificatesEarned?: number }
  recommendedCourses?: CourseCardCourse[]
}

function StudentOverview() {
  const locale = useLocale() as 'ar' | 'en'
  const isAr = locale === 'ar'
  const { user } = useAuthStore()
  const { toast } = useToast()

  const { data: statsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await get('/users/dashboard')
      const data = (res?.data as any)?.data ?? (res?.data as any)
      return unwrapData(data)
    },
    retry: 1, staleTime: 30000,
  })

  const { data: enrollmentData } = useQuery({
    queryKey: ['student-enrollments'],
    queryFn: async () => {
      const res = await get('/courses/my-courses')
      const raw = res?.data
      const d = (raw as any)?.data?.enrollments ?? (raw as any)?.data ?? raw ?? []
      return Array.isArray(d) ? d : []
    },
    enabled: !!user,
    retry: 1, staleTime: 30000,
  })

  const { data: certData } = useQuery({
    queryKey: ['student-certificates'],
    queryFn: async () => {
      const res = await get('/certificates/my')
      const d = (res?.data as any)?.data ?? (res?.data as any) ?? []
      return Array.isArray(d) ? d : []
    },
    enabled: !!user,
    retry: 1, staleTime: 30000,
  })

  const enrollments = enrollmentData ?? []
  const certificates = certData ?? []
  const studentStats = statsData?.stats

  if (isLoading) {
    return (
      <DashboardShell title={isAr ? 'الملخص' : 'Overview'} subtitle={isAr ? 'البيانات قيد التحميل...' : 'Loading your data...'}>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </DashboardShell>
    )
  }

  if (isError) {
    return (
      <DashboardShell title={isAr ? 'الملخص' : 'Overview'} subtitle={isAr ? 'حدث خطأ' : 'Something went wrong'}>
        <div style={{ textAlign:'center', padding:'3rem 2rem',
          border:'1px solid var(--border)', borderRadius:'16px',
          background:'var(--surface)' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
            stroke="#ef4444" strokeWidth="2" strokeLinecap="round"
            style={{ margin:'0 auto 1rem', display:'block', opacity:0.5 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <p style={{ fontSize:'0.9rem', color:'var(--muted-foreground)', marginBottom:'1rem' }}>
            {isAr ? 'فشل تحميل البيانات' : 'Failed to load data'}
          </p>
          <button onClick={() => refetch()} style={{
            padding:'10px 22px', borderRadius:'10px',
            background:'#5120c8', color:'#fff',
            border:'none', fontSize:'0.875rem', fontWeight:600, cursor:'pointer',
          }}>
            {isAr ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      </DashboardShell>
    )
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px' }}>
      <style>{`
        .student-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
        .student-two-col { display: grid; grid-template-columns: 1fr 300px; gap: 1.25rem; }
        @media (max-width: 768px) { .student-two-col { grid-template-columns: 1fr; } .student-stats { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .student-stats { grid-template-columns: 1fr; } }
      `}</style>

      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(81,32,200,0.15) 0%, rgba(81,32,200,0.05) 100%)',
        border: '1px solid rgba(81,32,200,0.2)',
        borderRadius: '16px',
        padding: '1.75rem 2rem',
        marginBottom: '1.5rem',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '1rem',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <div style={{
            width:'56px', height:'56px', borderRadius:'50%',
            border:'2px solid rgba(81,32,200,0.5)',
            overflow:'hidden', flexShrink:0,
            background:'linear-gradient(135deg,#5120c8,#7c3aed)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'1.4rem', fontWeight:700, color:'#fff',
          }}>
            {user?.profile?.avatar
              ? <img src={user.profile.avatar} alt=""
                  style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              : (user?.profile?.firstName?.[0] || 'ط')
            }
          </div>
          <div>
            <p style={{ color:'#a78bfa', fontSize:'0.8rem', fontWeight:500, margin:'0 0 3px' }}>
              {isAr ? 'مرحبا بك' : 'Welcome back,'}
            </p>
            <h1 style={{ fontSize:'1.4rem', fontWeight:800, margin:'0 0 3px' }}>
              {isAr
                ? (user?.profile?.firstName || 'الطالب')
                : (user?.profile?.firstName || 'Student')}
            </h1>
            <p style={{ color:'var(--muted-foreground)', fontSize:'0.82rem', margin:0 }}>
              {isAr ? 'واصل رحلتك التعليمية' : 'Continue your learning journey'}
            </p>
          </div>
        </div>
        <a href={`/${locale}/courses`} style={{
          display:'inline-flex', alignItems:'center', gap:'8px',
          padding:'11px 22px', borderRadius:'10px',
          background:'#5120c8', color:'#fff',
          fontWeight:600, fontSize:'0.9rem', textDecoration:'none',
          boxShadow:'0 4px 15px rgba(81,32,200,0.3)',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          {isAr ? 'استعرض الكورسات' : 'Browse Courses'}
        </a>
      </div>

      {/* Stats Grid */}
      <div className="student-stats">
        {[
          {
            labelAr:'كورسات مسجلة', labelEn:'Enrolled Courses',
            value: enrollments.length || studentStats?.enrolledCourses || 0,
            color:'#a78bfa', bg:'rgba(81,32,200,0.12)',
            href: `/${locale}/dashboard/my-courses`,
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>,
          },
          {
            labelAr:'كورسات مكتملة', labelEn:'Completed',
            value: enrollments.filter((e: any) => {
              const p = e.progress ?? e.enrollment?.progress ?? 0
              return p >= 100
            }).length || studentStats?.completedCourses || 0,
            color:'#34d399', bg:'rgba(52,211,153,0.12)',
            href: `/${locale}/dashboard/my-courses`,
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>,
          },
          {
            labelAr:'شهادات محققة', labelEn:'Certificates',
            value: certificates.length || studentStats?.certificatesEarned || 0,
            color:'#fbbf24', bg:'rgba(251,191,36,0.12)',
            href: `/${locale}/dashboard/certificates`,
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="8" r="6"/>
              <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
            </svg>,
          },
          {
            labelAr:'ساعات التعلم', labelEn:'Hours Learned',
            value: studentStats?.hoursLearned || 0,
            color:'#f87171', bg:'rgba(248,113,113,0.12)',
            href: `/${locale}/dashboard/my-courses`,
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>,
          },
        ].map((stat: any, i: number) => (
          <a key={i} href={stat.href} style={{ textDecoration:'none' }}>
            <div style={{
              padding:'1.25rem',
              background:'rgba(255,255,255,0.03)',
              border:'1px solid rgba(255,255,255,0.07)',
              borderRadius:'14px',
              display:'flex', alignItems:'flex-start', gap:'1rem',
              transition:'border-color 0.2s',
              cursor:'pointer',
            }}
            onMouseEnter={(e: any) => e.currentTarget.style.borderColor='rgba(81,32,200,0.3)'}
            onMouseLeave={(e: any) => e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'}
            >
              <div style={{
                width:'44px', height:'44px', borderRadius:'12px',
                background:stat.bg, color:stat.color, flexShrink:0,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                {stat.icon}
              </div>
              <div>
                <p style={{ fontSize:'1.6rem', fontWeight:800, margin:'0 0 2px',
                  color:'var(--foreground)' }}>
                  {stat.value}
                </p>
                <p style={{ fontSize:'0.75rem', color:'var(--muted-foreground)', margin:0 }}>
                  {isAr ? stat.labelAr : stat.labelEn}
                </p>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Two column layout */}
      <div className="student-two-col">
        {/* My Courses - recent enrollments */}
        <div style={{
          background:'rgba(255,255,255,0.02)',
          border:'1px solid rgba(255,255,255,0.07)',
          borderRadius:'14px', padding:'1.25rem',
        }}>
          <div style={{ display:'flex', alignItems:'center',
            justifyContent:'space-between', marginBottom:'1rem' }}>
            <h2 style={{ fontSize:'1rem', fontWeight:700, margin:0 }}>
              {isAr ? 'كورساتي' : 'My Courses'}
            </h2>
            <a href={`/${locale}/dashboard/my-courses`}
              style={{ fontSize:'0.8rem', color:'#a78bfa', textDecoration:'none' }}>
              {isAr ? 'عرض الكل' : 'View all'}
            </a>
          </div>

          {enrollments.length > 0 ? (
            enrollments.slice(0, 4).map((enrollment: any) => {
              const course = enrollment.course || enrollment
              const progress = enrollment.progress ?? enrollment.enrollment?.progress ?? 0
              const courseId = course?.id || enrollment.courseId
              const title = isAr
                ? (course?.titleAr || course?.title)
                : (course?.titleEn || course?.title)
              return (
                <a key={enrollment.id || courseId}
                  href={`/${locale}/learn/${courseId}`}
                  style={{ textDecoration:'none', display:'block' }}>
                  <div style={{
                    display:'flex', alignItems:'center', gap:'12px',
                    padding:'10px 0',
                    borderBottom:'1px solid rgba(255,255,255,0.05)',
                    transition:'opacity 0.15s',
                  }}
                  onMouseEnter={(e: any) => e.currentTarget.style.opacity='0.8'}
                  onMouseLeave={(e: any) => e.currentTarget.style.opacity='1'}
                  >
                    {/* Thumbnail */}
                    <div style={{
                      width:'44px', height:'44px', borderRadius:'8px',
                      background:'#1a1a2e', flexShrink:0, overflow:'hidden',
                    }}>
                      {course?.thumbnail
                        ? <img src={course.thumbnail} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                        : <div style={{ width:'100%', height:'100%',
                            background:'linear-gradient(135deg,#1a0a2e,#2d1054)',
                            display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                              stroke="rgba(255,255,255,0.2)" strokeWidth="1.5">
                              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                            </svg>
                          </div>
                      }
                    </div>

                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{
                        fontWeight:600, fontSize:'0.875rem', margin:'0 0 4px',
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                        color:'var(--foreground)',
                      }}>
                        {title}
                      </p>
                      {/* Progress bar */}
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <div style={{
                          flex:1, height:'4px', background:'rgba(255,255,255,0.06)',
                          borderRadius:'99px', overflow:'hidden',
                        }}>
                          <div style={{
                            height:'100%', borderRadius:'99px',
                            width:`${Math.round(progress)}%`,
                            background: progress >= 100
                              ? 'linear-gradient(90deg,#4ade80,#22c55e)'
                              : '#5120c8',
                          }}/>
                        </div>
                        <span style={{ fontSize:'0.7rem', color:'var(--muted-foreground)',
                          flexShrink:0 }}>
                          {Math.round(progress)}%
                        </span>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div style={{
                      padding:'3px 8px', borderRadius:'20px', fontSize:'0.68rem',
                      fontWeight:600, flexShrink:0,
                      background: progress >= 100
                        ? 'rgba(34,197,94,0.1)' : 'rgba(81,32,200,0.12)',
                      border: progress >= 100
                        ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(81,32,200,0.25)',
                      color: progress >= 100 ? '#4ade80' : '#a78bfa',
                    }}>
                      {progress >= 100
                        ? (isAr ? 'مكتمل' : 'Done')
                        : (isAr ? 'جار' : 'Active')}
                    </div>
                  </div>
                </a>
              )
            })
          ) : (
            <div style={{ textAlign:'center', padding:'2rem',
              color:'var(--muted-foreground)' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5"
                style={{ margin:'0 auto 8px', display:'block', opacity:0.3 }}>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
              <p style={{ margin:'0 0 1rem', fontSize:'0.875rem' }}>
                {isAr ? 'لم تشترك في أي كورس بعد' : 'No courses yet'}
              </p>
              <a href={`/${locale}/courses`} style={{
                padding:'8px 20px', borderRadius:'8px',
                background:'#5120c8', color:'#fff',
                textDecoration:'none', fontSize:'0.82rem', fontWeight:600,
              }}>
                {isAr ? 'ابدأ التعلم' : 'Start Learning'}
              </a>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{
          background:'rgba(255,255,255,0.02)',
          border:'1px solid rgba(255,255,255,0.07)',
          borderRadius:'14px', padding:'1.25rem',
        }}>
          <h2 style={{ fontSize:'1rem', fontWeight:700, margin:'0 0 1rem' }}>
            {isAr ? 'روابط سريعة' : 'Quick Links'}
          </h2>
          {[
            {
              labelAr:'كورساتي', labelEn:'My Courses',
              href:`/${locale}/dashboard/my-courses`,
              color:'#a78bfa', bg:'rgba(167,139,250,0.1)',
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>,
            },
            {
              labelAr:'شهاداتي', labelEn:'Certificates',
              href:`/${locale}/dashboard/certificates`,
              color:'#fbbf24', bg:'rgba(251,191,36,0.1)',
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="8" r="6"/>
                <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
              </svg>,
            },
            {
              labelAr:'المسار المهني', labelEn:'Career Path',
              href:`/${locale}/dashboard/career-path`,
              color:'#34d399', bg:'rgba(52,211,153,0.1)',
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>,
            },
            {
              labelAr:'استعرض الكورسات', labelEn:'Browse Courses',
              href:`/${locale}/courses`,
              color:'#5120c8', bg:'rgba(81,32,200,0.1)',
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>,
            },
            {
              labelAr:'احجز استشارة', labelEn:'Book Consultation',
              href:`/${locale}/coaching`,
              color:'#f87171', bg:'rgba(248,113,113,0.1)',
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>,
            },
          ].map((action: any, i: number) => (
            <a key={i} href={action.href} style={{ textDecoration:'none', display:'block' }}>
              <div style={{
                display:'flex', alignItems:'center', gap:'12px',
                padding:'9px 10px', borderRadius:'10px', marginBottom:'4px',
                background:'transparent', cursor:'pointer',
                transition:'background 0.15s',
              }}
              onMouseEnter={(e: any) => e.currentTarget.style.background=action.bg}
              onMouseLeave={(e: any) => e.currentTarget.style.background='transparent'}
              >
                <div style={{
                  width:'34px', height:'34px', borderRadius:'9px',
                  background:action.bg, color:action.color, flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  {action.icon}
                </div>
                <span style={{ fontSize:'0.875rem', fontWeight:500,
                  color:'var(--foreground)', flex:1 }}>
                  {isAr ? action.labelAr : action.labelEn}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2"
                  style={{ opacity:0.3, transform: isAr ? 'rotate(180deg)' : 'none' }}>
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

/* Stat Component — Enhanced */
function Stat({ 
  label, 
  value, 
  icon, 
  color = 'from-primary to-violet-600',
  delay = 0 
}: { 
  label: string; 
  value: number; 
  icon?: React.ReactNode;
  color?: string;
  delay?: number;
}) {
  return (
    <div 
      className={`rounded-2xl p-6 border border-border bg-surface shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-up stagger-${delay + 1}`}
    >
      <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-md`}>
        {icon || <BookOpen className="h-5 w-5 text-white" />}
      </div>
      <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">{label}</p>
      <p className="text-3xl font-extrabold text-foreground" style={{ fontFamily: 'PingARLT, sans-serif' }}>
        {value}
      </p>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   CONSULTANT OVERVIEW — PROFESSIONAL REDESIGN
   ════════════════════════════════════════════════════════ */

function ConsultantOverview() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const { user } = useAuthStore()

  const { data: sessions = [] } = useQuery({
    queryKey: ['consultant-sessions'],
    queryFn: async () => {
      try {
        const res = await get('/coaching/consulting/my-sessions')
        const d = (res?.data as any)?.data ?? (res?.data as any)
        return Array.isArray(d) ? d : []
      } catch { return [] }
    },
  })

  const pending = (sessions as any[]).filter((s: any) => s.status === 'PENDING')
  const confirmed = (sessions as any[]).filter((s: any) => s.status === 'CONFIRMED')
  const completed = (sessions as any[]).filter((s: any) => s.status === 'COMPLETED')
  const totalRevenue = completed.reduce((sum: number, s: any) => sum + (s.price || 0), 0)
  const upcomingStatuses = ['CONFIRMED', 'SCHEDULED', 'RESCHEDULE_REQUESTED']
  const upcomingSessions = (sessions as any[]).filter((s: any) =>
    upcomingStatuses.includes(s.status) &&
    s.paymentStatus === 'PAID' &&
    s.status !== 'CANCELLED' &&
    s.status !== 'COMPLETED'
  )

  return (
    <div style={{ padding: '1.5rem 2rem 2.5rem' }}>

      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(52,211,153,0.15) 0%, rgba(52,211,153,0.04) 100%)',
        border: '1px solid rgba(52,211,153,0.2)',
        borderRadius: '16px',
        padding: '1.75rem 2rem',
        marginBottom: '1.5rem',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            border: '2px solid rgba(52,211,153,0.5)',
            overflow: 'hidden', flexShrink: 0,
            background: 'linear-gradient(135deg,#059669,#34d399)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem', fontWeight: 700, color: '#fff',
          }}>
            {user?.profile?.avatar
              ? <img src={user.profile.avatar} alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
              : (user?.profile?.firstName?.[0] || 'م')
            }
          </div>
          <div>
            <p style={{ color: '#34d399', fontSize: '0.8rem', fontWeight: 500, margin: '0 0 3px' }}>
              {isAr ? 'لوحة تحكم المستشار' : 'Coach Dashboard'}
            </p>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 3px' }}>
              {isAr
                ? `مرحبا ${user?.profile?.firstName || 'المستشار'}`
                : `Welcome, ${user?.profile?.firstName || 'Coach'}`}
            </h1>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.82rem', margin: 0 }}>
              {isAr ? 'تابع جلساتك واستشاراتك اليوم' : 'Track your sessions and consultations'}
            </p>
          </div>
        </div>
        <a href={`/${locale}/dashboard/my-sessions`} style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '11px 22px', borderRadius: '10px',
          background: '#059669', color: '#fff',
          fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none',
          boxShadow: '0 4px 15px rgba(5,150,105,0.3)',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {isAr ? 'إدارة الجلسات' : 'Manage Sessions'}
        </a>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem', marginBottom: '1.5rem',
      }}>
        {[
          {
            labelAr: 'طلبات جديدة', labelEn: 'New Requests',
            value: pending.length,
            color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',
            href: `/${locale}/dashboard/client-sessions`,
          },
          {
            labelAr: 'جلسات مؤكدة', labelEn: 'Confirmed',
            value: confirmed.length,
            color: '#34d399', bg: 'rgba(52,211,153,0.12)',
            href: `/${locale}/dashboard/my-sessions`,
          },
          {
            labelAr: 'جلسات مكتملة', labelEn: 'Completed',
            value: completed.length,
            color: '#a78bfa', bg: 'rgba(81,32,200,0.12)',
            href: `/${locale}/dashboard/my-sessions`,
          },
          {
            labelAr: 'الإيرادات', labelEn: 'Revenue',
            value: `${totalRevenue} ${isAr ? 'ر.س' : 'SAR'}`,
            color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',
            href: `/${locale}/dashboard/revenue`,
          },
        ].map((stat, i) => (
          <a key={i} href={stat.href} style={{ textDecoration: 'none' }}>
            <div style={{
              padding: '1.25rem',
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              display: 'flex', alignItems: 'flex-start', gap: '1rem',
              transition: 'border-color 0.2s', cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(52,211,153,0.3)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: stat.bg, color: stat.color, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {stat.labelAr === 'طلبات جديدة' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
                    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                    <line x1="6" y1="1" x2="6" y2="4"/>
                    <line x1="10" y1="1" x2="10" y2="4"/>
                    <line x1="14" y1="1" x2="14" y2="4"/>
                  </svg>
                ) : stat.labelAr === 'جلسات مؤكدة' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                    <polyline points="9 16 11 18 15 14"/>
                  </svg>
                ) : stat.labelAr === 'جلسات مكتملة' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                )}
              </div>
              <div>
                <p style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 2px',
                  color: 'var(--foreground)' }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', margin: 0 }}>
                  {isAr ? stat.labelAr : stat.labelEn}
                </p>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Two column: upcoming sessions + quick actions */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 280px',
        gap: '1.25rem',
      }}>
        {/* Upcoming Sessions */}
        <div style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: '14px', padding: '1.25rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
              {isAr ? 'الجلسات القادمة' : 'Upcoming Sessions'}
            </h2>
            <a href={`/${locale}/dashboard/my-sessions`}
              style={{ fontSize: '0.8rem', color: '#34d399', textDecoration: 'none' }}>
              {isAr ? 'عرض الكل' : 'View all'}
            </a>
          </div>

          {upcomingSessions.length > 0 ? (
            upcomingSessions.slice(0, 4).map((session: any, i: number) => (
              <div key={session.id || i} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 12px', marginBottom: '6px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '12px',
                border: '1px solid var(--border)',
              }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '50%',
                  background: 'linear-gradient(135deg,#059669,#34d399)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '0.85rem', fontWeight: 700, flexShrink: 0,
                }}>
                  {session.user?.profile?.firstName?.[0] || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.82rem', margin: '0 0 2px',
                    color: 'var(--foreground)', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {session.sessionName || session.user?.profile?.firstName || (isAr ? 'جلسة' : 'Session')}
                  </p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', margin: 0 }}>
                    {session.scheduledAt
                      ? new Date(session.scheduledAt).toLocaleDateString(
                          isAr ? 'ar-SA' : 'en-US',
                          { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                        )
                      : (isAr ? 'تاريخ غير محدد' : 'Date TBD')}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <div style={{
                    padding: '3px 8px', borderRadius: '20px', fontSize: '0.65rem',
                    fontWeight: 600,
                    background: 'rgba(52,211,153,0.1)',
                    border: '1px solid rgba(52,211,153,0.3)',
                    color: '#34d399',
                  }}>
                    {isAr ? 'مؤكد' : 'Confirmed'}
                  </div>
                  {session.meetingLink && (
                    <a href={session.meetingLink} target="_blank" rel="noopener noreferrer"
                      style={{
                        padding: '4px 10px', borderRadius: '8px', fontSize: '0.68rem',
                        fontWeight: 700, textDecoration: 'none',
                        background: '#5120c8', color: '#ffffff',
                      }}>
                      {isAr ? 'انضم' : 'Join'}
                    </a>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem',
              color: 'var(--muted-foreground)' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5"
                style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }}>
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <p style={{ margin: '0', fontSize: '0.875rem' }}>
                {isAr ? 'لا توجد جلسات قادمة' : 'No upcoming sessions'}
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: '14px', padding: '1.25rem',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1rem' }}>
            {isAr ? 'روابط سريعة' : 'Quick Links'}
          </h2>
          {[
            {
              labelAr: 'جلساتي', labelEn: 'My Sessions',
              href: `/${locale}/dashboard/my-sessions`,
              color: '#34d399', bg: 'rgba(52,211,153,0.1)',
            },
            {
              labelAr: 'طلبات العملاء', labelEn: 'Client Requests',
              href: `/${locale}/dashboard/client-sessions`,
              color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',
            },
            {
              labelAr: 'الإيرادات', labelEn: 'Revenue',
              href: `/${locale}/dashboard/revenue`,
              color: '#a78bfa', bg: 'rgba(81,32,200,0.1)',
            },
            {
              labelAr: 'الإعدادات', labelEn: 'Settings',
              href: `/${locale}/dashboard/settings`,
              color: '#9999aa', bg: 'rgba(153,153,170,0.1)',
            },
          ].map((action, i) => (
            <a key={i} href={action.href} style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '9px 10px', borderRadius: '10px', marginBottom: '4px',
                background: 'transparent', cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = action.bg}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: '34px', height: '34px', borderRadius: '9px',
                  background: action.bg, color: action.color, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {action.labelAr === 'جلساتي' ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="4" width="18" height="18" rx="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  ) : action.labelAr === 'طلبات العملاء' ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  ) : action.labelAr === 'الإيرادات' ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="12" y1="1" x2="12" y2="23"/>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 500,
                  color: 'var(--foreground)', flex: 1 }}>
                  {isAr ? action.labelAr : action.labelEn}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2"
                  style={{ opacity: 0.3, transform: isAr ? 'rotate(180deg)' : 'none' }}>
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ════════════════════════════════════════════════════════ */

export default function DashboardPage() {
  const locale = useLocale() as 'ar' | 'en'
  const isAr = locale === 'ar'
  const { user } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const accountType = user?.accountType || 'STUDENT'

  const roleCard = useMemo(() => {
    if (accountType === 'ADMIN') return {
      icon: <Shield size={22} color="#fff"/>,
      title: 'لوحة تحكم الإدارة',
      desc: 'إدارة المستخدمين والكورسات والإعدادات',
      href: `/${locale}/admin`,
      bg: 'linear-gradient(135deg,rgba(81,32,200,0.2),rgba(124,58,237,0.15))',
      border: 'rgba(81,32,200,0.3)',
      iconBg: 'linear-gradient(135deg,#5120c8,#7c3aed)',
      chevronColor: '#5120c8',
    }
    if (accountType === 'INSTRUCTOR') return {
      icon: <BookOpen size={22} color="#fff"/>,
      title: 'إنشاء كورس جديد',
      desc: 'ابدأ في تدريس وإنشاء محتوى تعليمي احترافي',
      href: `/${locale}/dashboard/create-course`,
      bg: 'linear-gradient(135deg,rgba(43,191,163,0.15),rgba(5,150,105,0.1))',
      border: 'rgba(43,191,163,0.3)',
      iconBg: 'linear-gradient(135deg,#2BBFA3,#059669)',
      chevronColor: '#2BBFA3',
    }
    if (accountType === 'CONSULTANT') return {
      icon: <Calendar size={22} color="#fff"/>,
      title: 'جلساتي القادمة',
      desc: 'إدارة مواعيد الجلسات الاستشارية',
      href: `/${locale}/dashboard/my-sessions`,
      bg: 'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(217,119,6,0.1))',
      border: 'rgba(245,158,11,0.3)',
      iconBg: 'linear-gradient(135deg,#f59e0b,#d97706)',
      chevronColor: '#f59e0b',
    }
    return null
  }, [accountType, locale])

  if (!mounted) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        {/* Skeleton Welcome Card */}
        <div className="rounded-2xl p-8 bg-surface border border-border">
          <div className="flex items-center gap-4">
            <Skeleton className="w-14 h-14 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48 rounded-lg" />
              <Skeleton className="h-4 w-72 rounded-lg" />
            </div>
          </div>
        </div>
        
        {/* Skeleton Stats */}
        <div className="grid gap-5 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <AuthGate>
      {roleCard && (
        <Link href={roleCard.href} style={{
          display:'flex',alignItems:'center',gap:16,
          padding:'18px 22px',borderRadius:16,marginBottom:24,
          background:roleCard.bg,border:`1px solid ${roleCard.border}`,
          textDecoration:'none',transition:'all 0.2s ease',
        }}
        onMouseEnter={e=>(e.currentTarget.style.transform='translateY(-2px)')}
        onMouseLeave={e=>(e.currentTarget.style.transform='translateY(0)')}
        >
          <div style={{
            width:46,height:46,borderRadius:13,
            background:roleCard.iconBg,
            display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,
          }}>
            {roleCard.icon}
          </div>
          <div style={{flex:1}}>
            <div style={{color:isAr?'#fff':'#0d0d0d',fontWeight:700,fontSize:15}}>{roleCard.title}</div>
            <div style={{color:'#6b7280',fontSize:13,marginTop:2}}>{roleCard.desc}</div>
          </div>
          <ChevronLeft size={18} color={roleCard.chevronColor}/>
        </Link>
      )}
      {user?.accountType === 'INSTRUCTOR' ? <InstructorOverview /> :
       user?.accountType === 'CONSULTANT' ? <ConsultantOverview /> :
       <StudentOverview />}
    </AuthGate>
  )
}