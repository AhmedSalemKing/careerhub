'use client'

import { useEffect, useState, useMemo } from 'react'
import { useLocale } from 'next-intl'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  BookOpen, Users, PlusCircle, Calendar, ArrowLeft, ChevronLeft, Shield, AlertTriangle, Hand,
  CheckCircle, Award, Bookmark,
} from 'lucide-react'
import { get } from '../../../lib/api'
import { unwrapData } from '../../../lib/unwrap'
import { getMediaUrl } from '../../../lib/media'
import { learnCoursesLink, learnCourseLink } from '../../../lib/learn-link'
import { AuthGate } from '../../components/AuthGate'
import { DashboardShell } from '../../components/DashboardShell'
import { CourseCard, type CourseCardCourse } from '../../components/CourseCard'
import { Skeleton } from '../../components/ui/Skeleton'
import VerifiedBadge from '../../../components/VerifiedBadge'
import { useToast } from '../../../lib/toast'
import { useAuthStore } from '../../../stores/authStore'
import { ErrorBoundary } from '../../../components/ErrorBoundary'
import { formatCoursePrice } from '../../../lib/market'

function parseSessionDate(raw: unknown): Date | null {
  if (!raw) return null
  if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw
  if (typeof raw === 'string') { const d = new Date(raw); return isNaN(d.getTime()) ? null : d }
  if (typeof raw === 'object' && (raw as any).$date) { const d = new Date((raw as any).$date); return isNaN(d.getTime()) ? null : d }
  return null
}

function displayTotal(items: any[], displayKey: string, rawTotal: number): string {
  const sample = items.find((item: any) => item[displayKey])?.[displayKey] ?? ''
  const isEGP = sample.includes('ج.م')
  if (isEGP) {
    const egpTotal = items.reduce((sum: number, item: any) => {
      const d = (item[displayKey] ?? '').replace(/[٠-٩]/g, (c: string) => String(c.charCodeAt(0) - 0x0660))
      return sum + (parseFloat(d.replace(/[^\d.]/g, '')) || 0)
    }, 0)
    return `${Math.round(egpTotal).toLocaleString('ar-EG')} ج.م`
  }
  return `${(rawTotal ?? 0).toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س`
}

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
      return { totalCourses: d.totalCourses ?? 0, totalStudents: d.totalStudents ?? 0, revenue: d.totalRevenue ?? 0, revenueDisplay: d.totalRevenueDisplay ?? null }
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
    <div style={{ padding: '1.5rem', maxWidth: '1200px', width: '100%' }}>
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
        maxWidth: '100%', minWidth: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0, maxWidth: '100%' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            border: '2px solid rgba(81,32,200,0.5)',
            overflow: 'hidden', flexShrink: 0,
            background: 'linear-gradient(135deg,#5120c8,#7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem', fontWeight: 500, color: 'var(--primary-foreground)',
          }}>
            {user?.profile?.avatar
              ? <img src={user.profile.avatar} alt=""
                  style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              : (user?.profile?.firstName?.[0] || 'م')
            }
          </div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <p style={{ color:'#a78bfa', fontSize:'0.8rem', fontWeight:500, margin:'0 0 3px' }}>
              {isAr ? 'لوحة التحكم' : 'Dashboard'}
            </p>
            <h1 style={{ fontSize:'1.4rem', fontWeight:900, margin:'0 0 3px' }}>
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
          background: '#5120c8', color: 'var(--primary-foreground)',
          fontWeight: 500, fontSize: '0.9rem', textDecoration: 'none',
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
        maxWidth: '100%', minWidth: 0,
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
            value: stats?.revenueDisplay ?? `${Number(stats?.revenue ?? 0).toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س`,
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
              background: 'var(--card)',
              border: '1px solid color-mix(in srgb, var(--foreground) 7%, transparent)',
              borderRadius: '14px',
              display: 'flex', alignItems: 'flex-start', gap: '1rem',
              cursor: 'pointer', transition: 'border-color 0.2s',
              maxWidth: '100%', minWidth: 0, overflow: 'hidden', boxSizing: 'border-box',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor='rgba(81,32,200,0.3)'}
            onMouseLeave={e => e.currentTarget.style.borderColor='color-mix(in srgb, var(--foreground) 7%, transparent)'}
            >
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: stat.bg, flexShrink: 0, color: stat.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {stat.icon}
              </div>
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <p style={{ fontSize: '1.6rem', fontWeight: 300, margin: '0 0 2px',
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

      <div className="dashboard-two-col" style={{ marginBottom: '1.5rem', maxWidth: '100%', minWidth: 0 }}>
        <div style={{
          background: 'var(--card)',
          border: '1px solid color-mix(in srgb, var(--foreground) 7%, transparent)',
          borderRadius: '14px',
          padding: '1.25rem',
          maxWidth: '100%', minWidth: 0, overflow: 'hidden', boxSizing: 'border-box',
        }}>
          <div style={{ display:'flex', alignItems:'center',
            justifyContent:'space-between', marginBottom:'1rem' }}>
            <h2 style={{ fontSize:'1rem', fontWeight:500, margin:0 }}>
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
                borderBottom:'1px solid color-mix(in srgb, var(--foreground) 5%, transparent)',
                minWidth: 0, maxWidth: '100%', overflow: 'hidden',
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
                          stroke="color-mix(in srgb, var(--foreground) 20%, transparent)" strokeWidth="1.5">
                          <rect x="2" y="3" width="20" height="14" rx="2"/>
                          <path d="M8 21h8M12 17v4"/>
                        </svg>
                      </div>
                  }
                </div>
                <div style={{ flex:1, minWidth:0, overflow: 'hidden' }}>
                  <p style={{ fontWeight:500, fontSize:'0.875rem', margin:'0 0 3px',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                    color:'var(--foreground)' }}>
                    {isAr ? course.titleAr : course.titleEn}
                  </p>
                  <p style={{ fontSize:'0.75rem', color:'var(--muted-foreground)', margin:0 }}>
                    {course._count?.enrollments ?? 0}
                    {isAr ? ' طالب' : ' students'}
                    {formatCoursePrice(course)}
                  </p>
                </div>
                <div style={{
                  padding:'3px 10px', borderRadius:'20px', fontSize:'0.7rem',
                  fontWeight:300, flexShrink:0,
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
          background: 'var(--card)',
          border: '1px solid color-mix(in srgb, var(--foreground) 7%, transparent)',
          borderRadius: '14px',
          padding: '1.25rem',
          maxWidth: '100%', minWidth: 0, overflow: 'hidden', boxSizing: 'border-box',
        }}>
          <h2 style={{ fontSize:'1rem', fontWeight:500, margin:'0 0 1rem' }}>
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
            <a key={i} href={action.href} style={{ textDecoration:'none', display:'block', maxWidth:'100%' }}>
              <div style={{
                display:'flex', alignItems:'center', gap:'12px',
                padding:'10px 12px', borderRadius:'10px', marginBottom:'6px',
                background: 'transparent', cursor:'pointer',
                transition:'background 0.15s',
                minWidth: 0, maxWidth: '100%', overflow: 'hidden',
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
  const [tab, setTab] = useState<'all' | 'active' | 'done'>('all')

  if (isLoading) {
    return (
      <DashboardShell title={isAr ? 'الملخص' : 'Overview'} subtitle={isAr ? 'البيانات قيد التحميل...' : 'Loading your data...'}>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
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
            stroke="var(--error)" strokeWidth="2" strokeLinecap="round"
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
            background:'var(--primary)', color:'var(--primary-foreground)',
            border:'none', fontSize:'0.875rem', fontWeight:500, cursor:'pointer',
          }}>
            {isAr ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      </DashboardShell>
    )
  }

  const firstName = isAr
    ? (user?.profile?.firstName || 'الطالب')
    : (user?.profile?.firstName || 'Student')
  const arrow = { transform: isAr ? 'none' : 'rotate(180deg)' } as const
  const mix = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, transparent)`

  const progressOf = (e: any): number => Number(e.progress ?? e.enrollment?.progress ?? 0) || 0
  const courseOf = (e: any) => e.course || e
  const titleOf = (c: any): string =>
    (isAr ? (c?.titleAr || c?.title) : (c?.titleEn || c?.title)) || (isAr ? 'كورس' : 'Course')
  const categoryOf = (c: any): string =>
    c?.careerPath?.title || c?.category || (isAr ? 'كورس' : 'Course')
  const levelLabel = (lvl?: string | null): string => {
    if (!lvl) return ''
    const map: Record<string, [string, string]> = {
      BEGINNER: ['مبتدئ', 'Beginner'],
      INTERMEDIATE: ['متوسط', 'Intermediate'],
      ADVANCED: ['متقدم', 'Advanced'],
    }
    const hit = map[String(lvl).toUpperCase()]
    return hit ? (isAr ? hit[0] : hit[1]) : String(lvl)
  }
  const lessonsLabel = (e: any): string =>
    `${e.completedLessons ?? 0}/${e.totalLessons ?? 0} ${isAr ? 'درس' : 'lessons'}`

  const enrolledCount = enrollments.length || studentStats?.enrolledCourses || 0
  const completedCount = enrollments.filter((e: any) => progressOf(e) >= 100).length || studentStats?.completedCourses || 0
  const certificatesCount = certificates.length || studentStats?.certificatesEarned || 0

  const visible = enrollments.filter((e: any) =>
    tab === 'all' ? true : tab === 'done' ? progressOf(e) >= 100 : progressOf(e) < 100,
  )
  // unfinished courses first, so the table reads as "what to do next"
  const upNext = [...enrollments].sort((x: any, y: any) => Number(progressOf(x) >= 100) - Number(progressOf(y) >= 100))

  // Side card: a recommended course if the API sends one, else the next unfinished enrollment
  const recommended: any = (statsData as any)?.recommendedCourses?.[0]
  const nextEnrollment: any = upNext[0]
  const sideCourse: any = recommended || (nextEnrollment ? courseOf(nextEnrollment) : null)
  const sideHref = sideCourse?.id ? learnCourseLink(sideCourse.id, locale) : learnCoursesLink(locale)
  const sideThumb = getMediaUrl(sideCourse?.thumbnail ?? sideCourse?.thumbnailUrl)
  const sideLevel = levelLabel(sideCourse?.level)

  const tabs: { key: 'all' | 'active' | 'done'; label: string }[] = [
    { key: 'all', label: isAr ? 'الكل' : 'All' },
    { key: 'active', label: isAr ? 'مسجل' : 'Active' },
    { key: 'done', label: isAr ? 'مكتمل' : 'Completed' },
  ]

  const sectionTitle: React.CSSProperties = { fontWeight: 500, fontSize: 16, color: 'var(--foreground)', margin: 0 }
  const viewAll: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontWeight: 300, fontSize: 12, color: 'var(--primary)', textDecoration: 'none',
  }
  const th: React.CSSProperties = {
    fontWeight: 500, fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px', width: '100%' }}>
      <style>{`
        .sd-layout { display: flex; gap: 24px; align-items: flex-start; }
        .sd-side { width: 280px; flex-shrink: 0; }
        .sd-cards { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 8px; scroll-snap-type: x proximity; }
        .sd-card { flex: 0 0 230px; scroll-snap-align: start; transition: transform 0.15s ease; }
        .sd-card:hover { transform: translateY(-2px); }
        .sd-row { display: grid; grid-template-columns: 1fr 160px 90px; align-items: center; gap: 12px; }
        .sd-row-link { transition: background 0.15s ease; }
        .sd-row-link:hover { background: color-mix(in srgb, var(--foreground) 4%, transparent); }
        .sd-tab { transition: background 0.15s ease, color 0.15s ease; }
        @media (max-width: 1000px) {
          .sd-layout { flex-direction: column; }
          .sd-side { width: 100%; }
        }
        @media (max-width: 640px) {
          .sd-row { grid-template-columns: 1fr 70px; }
          .sd-mid { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontWeight: 900, fontSize: 26, lineHeight: 1.2, color: 'var(--foreground)', margin: 0 }}>
            {isAr ? `مرحباً بك، ${firstName}` : `Welcome back, ${firstName}`}
          </h1>
          <p style={{ fontWeight: 300, fontSize: 13, color: 'var(--muted)', margin: '4px 0 0' }}>
            {isAr ? 'واصل رحلتك التعليمية' : 'Continue your learning journey'}
          </p>
        </div>
        <div style={{ fontWeight: 300, fontSize: 12, color: 'var(--muted)' }}>
          {new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      <div className="sd-layout">
        {/* Main */}
        <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
          {/* Course cards */}
          <section style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <h2 style={sectionTitle}>{isAr ? 'كورساتي' : 'My Courses'}</h2>
                <div style={{ display: 'flex', gap: 4 }}>
                  {tabs.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      className="sd-tab"
                      onClick={() => setTab(t.key)}
                      style={{
                        padding: '4px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        fontWeight: 500, fontSize: 12,
                        background: tab === t.key ? mix('var(--primary)', 12) : 'transparent',
                        color: tab === t.key ? 'var(--primary)' : 'var(--muted)',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <a href={`/${locale}/dashboard/my-courses`} style={viewAll}>
                {isAr ? 'عرض الكل' : 'View all'}
                <ChevronLeft size={14} style={arrow} />
              </a>
            </div>

            {visible.length > 0 ? (
              <div className="sd-cards">
                {visible.slice(0, 8).map((enrollment: any) => {
                  const course = courseOf(enrollment)
                  const progress = Math.min(100, Math.round(progressOf(enrollment)))
                  const courseId = course?.id || enrollment.courseId
                  const thumb = getMediaUrl(course?.thumbnail)
                  const level = levelLabel(course?.level)
                  return (
                    <a
                      key={enrollment.id || courseId}
                      href={learnCourseLink(courseId, locale)}
                      target="_blank" rel="noopener noreferrer"
                      className="sd-card"
                      style={{
                        minWidth: 220, maxWidth: 240, borderRadius: 14, overflow: 'hidden',
                        border: '1px solid var(--border)', background: 'var(--card)',
                        textDecoration: 'none', display: 'flex', flexDirection: 'column',
                      }}
                    >
                      <div style={{
                        width: '100%', height: 130, position: 'relative', flexShrink: 0, overflow: 'hidden',
                        background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {thumb
                          ? <img src={thumb} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <BookOpen size={28} color="var(--muted-foreground)" />}
                        {level && (
                          <span style={{
                            position: 'absolute', top: 10, insetInlineEnd: 10,
                            background: 'var(--overlay-strong)', color: 'var(--primary-foreground)',
                            borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 500,
                            backdropFilter: 'blur(4px)',
                          }}>
                            {level}
                          </span>
                        )}
                      </div>

                      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                        <div style={{
                          fontWeight: 500, fontSize: 13, color: 'var(--foreground)', lineHeight: 1.4,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {titleOf(course)}
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 300, color: 'var(--muted)', marginBottom: 5 }}>
                            <span>{isAr ? 'تقدمك' : 'Progress'}</span>
                            <span>{lessonsLabel(enrollment)}</span>
                          </div>
                          <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', borderRadius: 2, width: `${progress}%`,
                              background: progress >= 100 ? 'var(--success)' : 'var(--primary)',
                              transition: 'width 0.3s ease',
                            }} />
                          </div>
                        </div>

                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
                          padding: '5px 10px', borderRadius: 7, marginTop: 'auto',
                          background: 'var(--primary)', color: 'var(--primary-foreground)',
                          fontSize: 12, fontWeight: 500,
                        }}>
                          {progress >= 100 ? (isAr ? 'مراجعة' : 'Review') : (isAr ? 'متابعة' : 'Continue')}
                          <ChevronLeft size={12} style={arrow} />
                        </div>
                      </div>
                    </a>
                  )
                })}
              </div>
            ) : (
              <div style={{
                textAlign: 'center', padding: '32px 0', color: 'var(--muted)',
                border: '1px dashed var(--border)', borderRadius: 16,
              }}>
                <BookOpen size={32} color="var(--muted-foreground)" style={{ margin: '0 auto 10px', display: 'block' }} />
                <p style={{ margin: '0 0 16px', fontWeight: 300, fontSize: 13 }}>
                  {enrollments.length === 0
                    ? (isAr ? 'لم تشترك في أي كورس بعد' : 'No courses yet')
                    : (isAr ? 'لا توجد كورسات في هذا التصنيف' : 'No courses in this view')}
                </p>
                {enrollments.length === 0 && (
                  <a href={learnCoursesLink(locale)} target="_blank" rel="noopener noreferrer" style={{
                    display: 'inline-block', padding: '8px 20px', borderRadius: 8,
                    background: 'var(--primary)', color: 'var(--primary-foreground)',
                    textDecoration: 'none', fontSize: 13, fontWeight: 500,
                  }}>
                    {isAr ? 'ابدأ التعلم' : 'Start Learning'}
                  </a>
                )}
              </div>
            )}
          </section>

          {/* Up-next table */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={sectionTitle}>{isAr ? 'كورساتي التالية' : 'Up Next'}</h2>
              <a href={`/${locale}/dashboard/my-courses`} style={viewAll}>
                {isAr ? 'عرض الكل' : 'View all'}
                <ChevronLeft size={14} style={arrow} />
              </a>
            </div>

            <div className="sd-row" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={th}>{isAr ? 'الكورس' : 'Course'}</span>
              <span className="sd-mid" style={th}>{isAr ? 'المسار' : 'Path'}</span>
              <span style={th}>{isAr ? 'التقدم' : 'Progress'}</span>
            </div>

            {upNext.slice(0, 6).map((enrollment: any) => {
              const course = courseOf(enrollment)
              const progress = Math.min(100, Math.round(progressOf(enrollment)))
              const courseId = course?.id || enrollment.courseId
              return (
                <a
                  key={enrollment.id || courseId}
                  href={learnCourseLink(courseId, locale)}
                  target="_blank" rel="noopener noreferrer"
                  className="sd-row sd-row-link"
                  style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none' }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontWeight: 500, fontSize: 13, color: 'var(--foreground)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {titleOf(course)}
                    </div>
                    <div style={{ fontWeight: 300, fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                      {lessonsLabel(enrollment)}
                    </div>
                  </div>
                  <div className="sd-mid" style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background: mix('var(--primary)', 12),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <BookOpen size={13} color="var(--primary)" />
                    </div>
                    <span style={{
                      fontWeight: 300, fontSize: 12, color: 'var(--foreground)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {categoryOf(course)}
                    </span>
                  </div>
                  <div style={{
                    fontWeight: progress >= 100 ? 500 : 300, fontSize: 12,
                    color: progress >= 100 ? 'var(--success)' : 'var(--muted)',
                  }}>
                    {progress >= 100 ? (isAr ? 'مكتمل' : 'Done') : `${progress}%`}
                  </div>
                </a>
              )
            })}
          </section>
        </div>

        {/* Side card */}
        <aside className="sd-side" style={{
          background: 'color-mix(in srgb, var(--primary) 8%, var(--background))',
          border: '1px solid ' + mix('var(--primary)', 20),
          borderRadius: 16, padding: 20,
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <div style={{ fontWeight: 300, fontSize: 12, color: 'var(--muted)' }}>
            {recommended ? (isAr ? 'مقترح لك' : 'Recommended for you') : (isAr ? 'تابع من حيث توقفت' : 'Pick up where you left off')}
          </div>

          <a href={sideHref} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{
              height: 120, position: 'relative', overflow: 'hidden', background: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {sideThumb
                ? <img src={sideThumb} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                : <BookOpen size={32} color="var(--primary-foreground)" />}
            </div>
            <div style={{
              padding: '10px 14px 14px', background: 'var(--card)',
              border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 12px 12px',
            }}>
              <div style={{ fontWeight: 900, fontSize: 14, color: 'var(--foreground)', lineHeight: 1.3 }}>
                {sideCourse ? titleOf(sideCourse) : (isAr ? 'ابدأ كورسك القادم' : 'Start your next course')}
              </div>
              {sideLevel && (
                <div style={{ fontWeight: 300, fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{sideLevel}</div>
              )}
            </div>
          </a>

          {[
            { label: isAr ? 'كورسات مسجلة' : 'Enrolled', value: enrolledCount, Icon: BookOpen, href: `/${locale}/dashboard/my-courses` },
            { label: isAr ? 'كورسات مكتملة' : 'Completed', value: completedCount, Icon: CheckCircle, href: `/${locale}/dashboard/my-courses` },
            { label: isAr ? 'شهادات' : 'Certificates', value: certificatesCount, Icon: Award, href: `/${locale}/dashboard/certificates` },
          ].map(({ label, value, Icon, href }) => (
            <a key={label} href={href} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--foreground)' }}>
              <Icon size={15} color="var(--primary)" />
              <span style={{ flex: 1, fontWeight: 300, fontSize: 13 }}>{label}</span>
              <span style={{ fontWeight: 500, fontSize: 14 }}>{value}</span>
            </a>
          ))}

          <a href={learnCoursesLink(locale)} target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: 10, borderRadius: 10,
            background: 'var(--primary)', color: 'var(--primary-foreground)',
            fontWeight: 500, fontSize: 13, textDecoration: 'none', marginTop: 'auto',
          }}>
            {isAr ? 'استعرض الكل' : 'Browse all'}
            <ChevronLeft size={14} style={arrow} />
          </a>
        </aside>
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
      className={`rounded-2xl p-4 md:p-6 border border-border bg-surface shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-up stagger-${delay + 1}`}
    >
      <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-md`}>
        {icon || <BookOpen className="h-5 w-5 text-white" />}
      </div>
      <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">{label}</p>
      <p className="text-2xl md:text-3xl font-medium text-foreground" style={{ fontFamily: 'PingARLT, sans-serif' }}>
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

  const pending = (sessions as any[]).filter((s: any) => s.status === 'PENDING' || s.status === 'PENDING_APPROVAL')
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
    <div style={{ padding: '1.5rem 2rem 2.5rem', width: '100%', maxWidth: '100vw', minWidth: 0 }}>
      <style>{`
        .consultant-two-col { display: grid; grid-template-columns: 1fr 280px; gap: 1.25rem; }
        @media (max-width: 768px) { .consultant-two-col { grid-template-columns: 1fr; } }
      `}</style>

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
        maxWidth: '100%', minWidth: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0, maxWidth: '100%' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            border: '2px solid rgba(52,211,153,0.5)',
            overflow: 'hidden', flexShrink: 0,
            background: 'linear-gradient(135deg,#059669,#34d399)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem', fontWeight: 500, color: 'var(--primary-foreground)',
          }}>
            {user?.profile?.avatar
              ? <img src={user.profile.avatar} alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
              : (user?.profile?.firstName?.[0] || 'م')
            }
          </div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <p style={{ color: '#34d399', fontSize: '0.8rem', fontWeight: 500, margin: '0 0 3px' }}>
              {isAr ? 'لوحة تحكم المستشار' : 'Coach Dashboard'}
            </p>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0 0 3px' }}>
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
          background: '#059669', color: 'var(--primary-foreground)',
          fontWeight: 500, fontSize: '0.9rem', textDecoration: 'none',
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
        maxWidth: '100%', minWidth: 0,
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
            value: displayTotal(completed, 'priceDisplay', totalRevenue),
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
              maxWidth: '100%', minWidth: 0, overflow: 'hidden', boxSizing: 'border-box',
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
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <p style={{ fontSize: '1.6rem', fontWeight: 300, margin: '0 0 2px',
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
      <div className="consultant-two-col" style={{ maxWidth: '100%', minWidth: 0 }}>
        {/* Upcoming Sessions */}
        <div style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: '14px', padding: '1.25rem',
          maxWidth: '100%', minWidth: 0, overflow: 'hidden', boxSizing: 'border-box',
        }}>
          <div style={{ display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 500, margin: 0 }}>
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
                background: 'var(--card)',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                minWidth: 0, maxWidth: '100%', overflow: 'hidden',
              }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '50%',
                  background: 'linear-gradient(135deg,#059669,#34d399)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--primary-foreground)', fontSize: '0.85rem', fontWeight: 500, flexShrink: 0,
                }}>
                  {session.user?.profile?.firstName?.[0] || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <p style={{ fontWeight: 500, fontSize: '0.82rem', margin: '0 0 2px',
                    color: 'var(--foreground)', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {session.sessionName || session.user?.profile?.firstName || (isAr ? 'جلسة' : 'Session')}
                  </p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', margin: 0 }}>
                    {(() => {
                      const d = parseSessionDate(session.scheduledAt)
                      return d ? d.toLocaleDateString(
                          isAr ? 'ar-EG-u-ca-gregory' : 'en-US',
                          { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                        ) : (isAr ? 'تاريخ غير محدد' : 'Date TBD')
                    })()}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <div style={{
                    padding: '3px 8px', borderRadius: '20px', fontSize: '0.65rem',
                    fontWeight: 300,
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
                        fontWeight: 500, textDecoration: 'none',
                        background: '#5120c8', color: 'var(--primary-foreground)',
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
          maxWidth: '100%', minWidth: 0, overflow: 'hidden', boxSizing: 'border-box',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 500, margin: '0 0 1rem' }}>
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
            <a key={i} href={action.href} style={{ textDecoration: 'none', display: 'block', maxWidth:'100%' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '9px 10px', borderRadius: '10px', marginBottom: '4px',
                background: 'transparent', cursor: 'pointer',
                transition: 'background 0.15s',
                minWidth: 0, maxWidth: '100%', overflow: 'hidden',
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
      icon: <Shield size={22} color="var(--primary-foreground)"/>,
      title: 'لوحة تحكم الإدارة',
      desc: 'إدارة المستخدمين والكورسات والإعدادات',
      href: `/${locale}/admin`,
      bg: 'linear-gradient(135deg,rgba(81,32,200,0.2),rgba(124,58,237,0.15))',
      border: 'rgba(81,32,200,0.3)',
      iconBg: 'linear-gradient(135deg,#5120c8,#7c3aed)',
      chevronColor: '#5120c8',
    }
    if (accountType === 'INSTRUCTOR') return {
      icon: <BookOpen size={22} color="var(--primary-foreground)"/>,
      title: 'إنشاء كورس جديد',
      desc: 'ابدأ في تدريس وإنشاء محتوى تعليمي احترافي',
      href: `/${locale}/dashboard/create-course`,
      bg: 'linear-gradient(135deg,rgba(43,191,163,0.15),rgba(5,150,105,0.1))',
      border: 'rgba(43,191,163,0.3)',
      iconBg: 'linear-gradient(135deg,#2BBFA3,#059669)',
      chevronColor: '#2BBFA3',
    }
    if (accountType === 'CONSULTANT') return {
      icon: <Calendar size={22} color="var(--primary-foreground)"/>,
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
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Skeleton Welcome Card */}
        <div className="rounded-2xl p-4 md:p-8 bg-surface border border-border">
          <div className="flex items-center gap-4 flex-wrap">
            <Skeleton className="w-14 h-14 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48 rounded-lg" />
              <Skeleton className="h-4 w-72 rounded-lg" />
            </div>
          </div>
        </div>
        
        {/* Skeleton Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
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
            <div style={{color:'var(--foreground)',fontWeight:500,fontSize:15}}>{roleCard.title}</div>
            <div style={{color:'#6b7280',fontSize:13,marginTop:2}}>{roleCard.desc}</div>
          </div>
          <ChevronLeft size={18} color={roleCard.chevronColor}/>
        </Link>
      )}
      <ErrorBoundary>
      {user?.accountType === 'INSTRUCTOR' ? <InstructorOverview /> :
       user?.accountType === 'CONSULTANT' ? <ConsultantOverview /> :
        <StudentOverview />}
      </ErrorBoundary>
    </AuthGate>
  )
}