'use client'
import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import api from '@/lib/api'
import { DollarSign, Users, BookOpen, TrendingUp, Download, Eye } from 'lucide-react'

export default function RevenuePage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/courses/instructor/revenue')
      .then(r => setData(r.data?.data || r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid rgba(81,32,200,0.3)', borderTopColor: '#5120c8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  const { totalRevenue = 0, totalStudents = 0, coursesCount = 0, publishedCourses = 0, courseBreakdown = [] } = data || {}

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', padding: '32px 24px 120px', direction: isAr ? 'rtl' : 'ltr' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: 0 }}>
            {isAr ? 'الإيرادات' : 'Revenue'}
          </h1>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
            {isAr ? 'إيراداتك من مبيعات الكورسات' : 'Your earnings from course sales'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
          <div style={{ background: '#121212', borderRadius: 16, padding: '22px 20px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(81,32,200,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <DollarSign size={20} color="#a78bfa" />
            </div>
            <div style={{ color: '#a78bfa', fontSize: 22, fontWeight: 800 }}>
              {totalRevenue.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 600 }}>{isAr ? 'ر.س' : 'SAR'}</span>
            </div>
            <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
              {isAr ? 'إجمالي الإيرادات' : 'Total Revenue'}
            </div>
          </div>

          <div style={{ background: '#121212', borderRadius: 16, padding: '22px 20px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Users size={20} color="#60a5fa" />
            </div>
            <div style={{ color: '#60a5fa', fontSize: 22, fontWeight: 800 }}>
              {totalStudents}
            </div>
            <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
              {isAr ? 'إجمالي الطلاب' : 'Total Students'}
            </div>
          </div>

          <div style={{ background: '#121212', borderRadius: 16, padding: '22px 20px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <BookOpen size={20} color="#4ade80" />
            </div>
            <div style={{ color: '#4ade80', fontSize: 22, fontWeight: 800 }}>
              {publishedCourses}
            </div>
            <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
              {isAr ? 'الكورسات المنشورة' : 'Published Courses'}
            </div>
          </div>

          <div style={{ background: '#121212', borderRadius: 16, padding: '22px 20px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(251,191,36,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <TrendingUp size={20} color="#fbbf24" />
            </div>
            <div style={{ color: '#fbbf24', fontSize: 22, fontWeight: 800 }}>
              {courseBreakdown.length}
            </div>
            <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
              {isAr ? 'إجمالي الكورسات' : 'Total Courses'}
            </div>
          </div>
        </div>

        <div style={{ background: '#121212', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 700, margin: 0 }}>
              {isAr ? 'تفصيل الإيرادات حسب الكورس' : 'Revenue by Course'}
            </h2>
            {courseBreakdown.length > 0 && (
              <span style={{ color: '#6b7280', fontSize: 13 }}>
                {isAr ? 'إجمالي' : 'Total'}: <span style={{ color: '#a78bfa', fontWeight: 700 }}>{totalRevenue.toLocaleString()} {isAr ? 'ر.س' : 'SAR'}</span>
              </span>
            )}
          </div>

          {courseBreakdown.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <DollarSign size={48} style={{ color: '#374151', margin: '0 auto 16px', display: 'block' }} />
              <p style={{ color: '#6b7280', fontSize: 14 }}>
                {isAr ? 'لا توجد إيرادات بعد. عندما يشتري طلاب كورساتك، ستظهر هنا.' : 'No revenue yet. When students purchase your courses, it will appear here.'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <th style={{ padding: '14px 20px', textAlign: isAr ? 'right' : 'left', color: '#6b7280', fontSize: 13, fontWeight: 600 }}>
                      {isAr ? 'الكورس' : 'Course'}
                    </th>
                    <th style={{ padding: '14px 20px', textAlign: 'center', color: '#6b7280', fontSize: 13, fontWeight: 600 }}>
                      {isAr ? 'الطلاب' : 'Students'}
                    </th>
                    <th style={{ padding: '14px 20px', textAlign: 'center', color: '#6b7280', fontSize: 13, fontWeight: 600 }}>
                      {isAr ? 'السعر' : 'Price'}
                    </th>
                    <th style={{ padding: '14px 20px', textAlign: 'center', color: '#6b7280', fontSize: 13, fontWeight: 600 }}>
                      {isAr ? 'الإيرادات' : 'Revenue'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {courseBreakdown.map((course: any) => (
                    <tr key={course.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {course.thumbnail ? (
                            <img src={course.thumbnail} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <BookOpen size={16} color="#5120c8" />
                            </div>
                          )}
                          <span style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 600 }}>
                            {isAr ? course.titleAr : course.titleEn}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'center', color: '#60a5fa', fontWeight: 700, fontSize: 14 }}>
                        {course.enrollmentCount}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
                        {course.price === 0
                          ? (isAr ? 'مجاني' : 'Free')
                          : `${course.price} ${isAr ? 'ر.س' : 'SAR'}`}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'center', color: '#4ade80', fontWeight: 700, fontSize: 15 }}>
                        {course.revenue.toLocaleString()} {isAr ? 'ر.س' : 'SAR'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'rgba(81,32,200,0.08)' }}>
                    <td style={{ padding: '16px 20px', color: '#fff', fontWeight: 700, fontSize: 14 }}>
                      {isAr ? 'الإجمالي' : 'Total'}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center', color: '#60a5fa', fontWeight: 700, fontSize: 14 }}>
                      {totalStudents}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }} />
                    <td style={{ padding: '16px 20px', textAlign: 'center', color: '#a78bfa', fontWeight: 800, fontSize: 16 }}>
                      {totalRevenue.toLocaleString()} {isAr ? 'ر.س' : 'SAR'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
