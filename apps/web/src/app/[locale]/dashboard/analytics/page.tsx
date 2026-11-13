'use client'
import { useQuery } from '@tanstack/react-query'
import { get } from '@/lib/api'
import { useTheme } from 'next-themes'
import { BarChart2, Users, BookOpen, Star, TrendingUp, Award } from 'lucide-react'
import { formatCoursePrice, formatMoney } from '@/lib/market'

export default function AnalyticsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const { data: stats, isLoading, isError, refetch } = useQuery({
    queryKey: ['instructor-stats'],
    staleTime: 60_000,
    retry: 1,
    queryFn: async () => {
      // Fail after 8s instead of spinning forever; the retry button below re-runs it
      const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
      const res = await Promise.race([get('/courses/instructor/stats'), timeout])
      return res.data?.data ?? {}
    }
  })

  const courses = stats?.courses ?? []

  const statCards = [
    { label:'إجمالي المستخدمين', value: stats?.totalStudents ?? 0, icon:<Users size={20} color="#5120c8"/>, bg:'rgba(81,32,200,0.1)' },
    { label:'الكورسات المنشورة', value: stats?.publishedCourses ?? 0, icon:<BookOpen size={20} color="#2BBFA3"/>, bg:'rgba(43,191,163,0.1)' },
    { label:'متوسط التقييم', value: stats?.avgRating ? `${stats.avgRating}` : 'لا يوجد', icon:<Star size={20} color="#f59e0b"/>, bg:'rgba(245,158,11,0.1)' },
    { label:'إجمالي الإيرادات', value: formatMoney(stats?.totalRevenue, stats?.totalRevenueDisplay), icon:<TrendingUp size={20} color="#16a34a"/>, bg:'rgba(22,163,74,0.1)' },
    { label:'الشهادات المصدرة', value: stats?.certificatesIssued ?? 0, icon:<Award size={20} color="#ef4444"/>, bg:'rgba(239,68,68,0.1)' },
    { label:'معدل الإكمال', value: `${stats?.completionRate ?? 0}%`, icon:<BarChart2 size={20} color="#8b5cf6"/>, bg:'rgba(139,92,246,0.1)' },
  ]

  return (
    <div style={{ minHeight:'100vh', background: 'var(--background)', padding:'32px 24px 120px', direction:'rtl' }}>
      <div style={{ maxWidth: 760, margin:'0 auto' }}>
        <div style={{ marginBottom:28 }}>
          <h1 style={{ color: 'var(--foreground)', fontSize:24, fontWeight:800, margin:0 }}>إحصائياتي</h1>
          <p style={{ color:'#6b7280', fontSize:14, marginTop:4 }}>تحليل أداء كورساتك وطلابك</p>
        </div>

        {isLoading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ height:110, borderRadius:16, background: 'var(--surface)', border:`1px solid ${'var(--border)'}`, opacity:0.6, animation:'pulse 1.5s ease infinite' }} />
            ))}
          </div>
        ) : (
          <>
            {isError && (
              <div style={{ marginBottom:16, padding:'12px 16px', borderRadius:12, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#ef4444', fontSize:13, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span>تعذر تحميل الإحصائيات</span>
                <button onClick={() => refetch()} style={{ background:'none', border:'1px solid currentColor', color:'inherit', borderRadius:8, padding:'4px 12px', cursor:'pointer', fontSize:12 }}>إعادة المحاولة</button>
              </div>
            )}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:28 }}>
              {statCards.map((s,i) => (
                <div key={i} style={{ background: 'var(--surface)', borderRadius:16, padding:'20px 18px', border:`1px solid ${'var(--border)'}` }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>{s.icon}</div>
                  <div style={{ color: 'var(--foreground)', fontSize:20, fontWeight:800 }}>{s.value}</div>
                  <div style={{ color:'#6b7280', fontSize:12, marginTop:4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--surface)', borderRadius:20, padding:24, border:`1px solid ${'var(--border)'}` }}>
              <h3 style={{ color: 'var(--foreground)', fontSize:16, fontWeight:700, marginBottom:20 }}>أداء الكورسات</h3>
              {!courses.length ? (
                <div style={{ textAlign:'center', padding:32, color:'#6b7280' }}>
                  <BookOpen size={40} style={{ margin:'0 auto 12px', opacity:0.3 }}/>
                  <p>لا توجد كورسات بعد</p>
                </div>
              ) : courses.map((c: any) => (
                <div key={c.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 0', borderBottom:`1px solid ${'var(--bg-2)'}` }}>
                  <div style={{ width:44, height:44, borderRadius:10, background:'rgba(81,32,200,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <BookOpen size={20} color="#5120c8"/>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ color: 'var(--foreground)', fontSize:14, fontWeight:600 }}>{c.title}</div>
                    <div style={{ color:'#6b7280', fontSize:12, marginTop:2 }}>{c.enrollments || 0} مستخدم  {c.status === 'PUBLISHED' ? ' منشور' : ' مسودة'}</div>
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize:13, fontWeight:600 }}>
                    {formatCoursePrice(c)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:.6}50%{opacity:.3}}`}</style>
    </div>
  )
}