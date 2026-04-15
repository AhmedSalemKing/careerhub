'use client'
import { useQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { get } from '../../../../../../lib/api'
import { ArrowLeft, User, Mail, Calendar, DollarSign, BookOpen, Shield, Activity } from 'lucide-react'

export default function UserDetailPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const { data, isLoading } = useQuery({
    queryKey: ['admin-user-detail', userId],
    queryFn: async () => {
      const res = await get(`/admin/users/${userId}/detail`)
      return (res as any).data?.data
    },
  })

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 32, height: 32, border: '3px solid rgba(81,32,200,0.2)', borderTopColor: '#5120c8', borderRadius: '50%', animation: 'dw-spin 0.8s linear infinite' }} />
      <style>{`@keyframes dw-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const user = data?.user
  const activities: any[] = data?.activities ?? []
  const payments: any[] = data?.payments ?? []
  const enrollments: any[] = data?.enrollments ?? []

  const infoRows = [
    { icon: User, label: isAr ? 'الدور' : 'Role', value: user?.accountType },
    { icon: Shield, label: isAr ? 'الحالة' : 'Status', value: user?.status },
    { icon: Calendar, label: isAr ? 'تاريخ الانضمام' : 'Joined', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US') : '-' },
    { icon: DollarSign, label: isAr ? 'إجمالي الإنفاق' : 'Total Spent', value: `${data?.totalSpent ?? 0} ${isAr ? 'ر.س' : 'SAR'}` },
    { icon: BookOpen, label: isAr ? 'الكورسات' : 'Enrollments', value: enrollments.length },
  ]

  return (
    <div dir={isAr ? 'rtl' : 'ltr'}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#e0e0e0', display: 'flex' }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 900, fontSize: 22, color: '#fff', margin: 0 }}>
            {user?.profile?.firstName} {user?.profile?.lastName}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0, fontFamily: 'DM Sans, sans-serif' }}>{user?.email}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

        {/* Account Info */}
        <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={14} color="#A78BFA" />
            {isAr ? 'معلومات الحساب' : 'Account Info'}
          </h3>
          {infoRows.map((row, i) => {
            const Icon = row.icon
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < infoRows.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <Icon size={14} color="rgba(255,255,255,0.4)" />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'DM Sans, sans-serif', flex: 1 }}>{row.label}</span>
                <span style={{ fontSize: 13, color: '#e0e0e0', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>{String(row.value ?? '-')}</span>
              </div>
            )
          })}
        </div>

        {/* Activity Timeline */}
        <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={14} color="#A78BFA" />
            {isAr ? 'سجل النشاط' : 'Activity Log'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
            {activities.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
                {isAr ? 'لا يوجد نشاط مسجل' : 'No activity recorded yet'}
              </p>
            ) : activities.map((act, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#5120c8', marginTop: 5, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#e0e0e0', fontFamily: 'DM Sans, sans-serif' }}>{act.action}</p>
                  <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans, sans-serif' }}>
                    {new Date(act.createdAt).toLocaleString(isAr ? 'ar-SA' : 'en-US')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payments */}
        <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 8 }}>
            <DollarSign size={14} color="#A78BFA" />
            {isAr ? 'المدفوعات' : 'Payments'}
          </h3>
          {payments.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
              {isAr ? 'لا توجد مدفوعات' : 'No payments'}
            </p>
          ) : payments.map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < payments.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'DM Sans, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
                {p.course?.title?.slice(0, 25)}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#2BBFA3', fontFamily: 'DM Sans, sans-serif' }}>
                {p.amount} {isAr ? 'ر.س' : 'SAR'}
              </span>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes dw-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
