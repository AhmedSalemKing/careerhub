'use client'
import { useQuery } from '@tanstack/react-query'
import { get } from '@/lib/api'
import { useTheme } from 'next-themes'
import { BarChart2, Users, BookOpen, Star, TrendingUp, Award } from 'lucide-react'

export default function AnalyticsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const { data: stats } = useQuery({
    queryKey: ['instructor-stats'],
    queryFn: async () => {
      const res = await get('/courses/instructor/stats')
      return res.data?.data ?? {}
    }
  })

  const { data: courses } = useQuery({
    queryKey: ['my-courses-analytics'],
    queryFn: async () => {
      const res = await get('/courses/my-courses')
      const arr = Array.isArray(res.data?.data) ? res.data.data : []
      return arr
    }
  })

  const statCards = [
    { label:'إجمالي الطلاب', value: stats?.totalStudents || 0, icon:<Users size={20} color="#5120c8"/>, bg:'rgba(81,32,200,0.1)' },
    { label:'الكورسات المنشورة', value: stats?.publishedCourses || courses?.filter((c:any)=>c.status==='PUBLISHED').length || 0, icon:<BookOpen size={20} color="#2BBFA3"/>, bg:'rgba(43,191,163,0.1)' },
    { label:'متوسط التقييم', value: (stats?.avgRating || 0).toFixed(1) + ' ', icon:<Star size={20} color="#f59e0b"/>, bg:'rgba(245,158,11,0.1)' },
    { label:'إجمالي الإيرادات', value: `${(stats?.totalRevenue || 0).toFixed(0)} ر.س`, icon:<TrendingUp size={20} color="#16a34a"/>, bg:'rgba(22,163,74,0.1)' },
    { label:'الشهادات المصدرة', value: stats?.certificatesIssued || 0, icon:<Award size={20} color="#ef4444"/>, bg:'rgba(239,68,68,0.1)' },
    { label:'معدل الإكمال', value: `${stats?.completionRate || 0}%`, icon:<BarChart2 size={20} color="#8b5cf6"/>, bg:'rgba(139,92,246,0.1)' },
  ]

  return (
    <div style={{ minHeight:'100vh', background: isDark?'#0d0d0d':'#fafafa', padding:'32px 24px 120px', direction:'rtl' }}>
      <div style={{ maxWidth: 760, margin:'0 auto' }}>
        <div style={{ marginBottom:28 }}>
          <h1 style={{ color: isDark?'#fff':'#0d0d0d', fontSize:24, fontWeight:800, margin:0 }}>إحصائياتي</h1>
          <p style={{ color:'#6b7280', fontSize:14, marginTop:4 }}>تحليل أداء كورساتك وطلابك</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:28 }}>
          {statCards.map((s,i) => (
            <div key={i} style={{ background: isDark?'#121212':'#fff', borderRadius:16, padding:'20px 18px', border:`1px solid ${isDark?'rgba(255,255,255,0.06)':'#e5e7eb'}` }}>
              <div style={{ width:40, height:40, borderRadius:10, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>{s.icon}</div>
              <div style={{ color: isDark?'#fff':'#0d0d0d', fontSize:20, fontWeight:800 }}>{s.value}</div>
              <div style={{ color:'#6b7280', fontSize:12, marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: isDark?'#121212':'#fff', borderRadius:20, padding:24, border:`1px solid ${isDark?'rgba(255,255,255,0.06)':'#e5e7eb'}` }}>
          <h3 style={{ color: isDark?'#fff':'#0d0d0d', fontSize:16, fontWeight:700, marginBottom:20 }}>أداء الكورسات</h3>
          {!courses?.length ? (
            <div style={{ textAlign:'center', padding:32, color:'#6b7280' }}>
              <BookOpen size={40} style={{ margin:'0 auto 12px', opacity:0.3 }}/>
              <p>لا توجد كورسات بعد</p>
            </div>
          ) : courses.map((c: any) => (
            <div key={c.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 0', borderBottom:`1px solid ${isDark?'rgba(255,255,255,0.05)':'#f1f5f9'}` }}>
              <div style={{ width:44, height:44, borderRadius:10, background:'rgba(81,32,200,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <BookOpen size={20} color="#5120c8"/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ color: isDark?'#f1f5f9':'#0d0d0d', fontSize:14, fontWeight:600 }}>{c.titleAr || c.title}</div>
                <div style={{ color:'#6b7280', fontSize:12, marginTop:2 }}>{c._count?.enrollments || 0} طالب  {c.status === 'PUBLISHED' ? ' منشور' : ' مسودة'}</div>
              </div>
              <div style={{ color: isDark?'#94a3b8':'#6b7280', fontSize:13, fontWeight:600 }}>
                {(c.price || 0)} ر.س
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}