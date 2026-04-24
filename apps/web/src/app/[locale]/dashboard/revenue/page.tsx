'use client'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { get, post } from '@/lib/api'
import { useTheme } from 'next-themes'
import { DollarSign, TrendingUp, Users, BookOpen, ArrowUpRight, Wallet } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

export default function RevenuePage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [transferAmount, setTransferAmount] = useState('')
  const [transferring, setTransferring] = useState(false)
  const [msg, setMsg] = useState<{type:'success'|'error',text:string}| null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['revenue'],
    queryFn: async () => {
      const res = await get('/payment/my-payments')
      return res.data?.data ?? []
    }
  })

  const { data: walletData } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: async () => {
      const res = await get('/wallet')
      return res.data?.data ?? { balance: 0 }
    }
  })

  const payments = Array.isArray(data) ? data : []
  const total = payments.reduce((s: number, p: any) => s + (p.amount || 0), 0)
  const thisMonth = payments.filter((p: any) => {
    const d = new Date(p.createdAt)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).reduce((s: number, p: any) => s + (p.amount || 0), 0)

  const handleTransfer = async () => {
    const amount = parseFloat(transferAmount)
    if (!amount || amount <= 0) return
    if (amount > total) {
      setMsg({ type:'error', text:'المبلغ أكبر من إيراداتك' })
      return
    }
    setTransferring(true)
    try {
      await post('/wallet/transfer-from-earnings', { amount })
      setMsg({ type:'success', text:`تم تحويل ${amount} ر.س للمحفظة بنجاح ` })
      setTransferAmount('')
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] })
    } catch(e: any) {
      setMsg({ type:'error', text: e.response?.data?.message || 'فشل التحويل' })
    } finally {
      setTransferring(false)
      setTimeout(() => setMsg(null), 4000)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background: isDark?'#0d0d0d':'#fafafa', padding:'32px 24px 120px', direction:'rtl' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ color: isDark?'#fff':'#0d0d0d', fontSize: 24, fontWeight: 800, margin: 0 }}>الإيرادات</h1>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>سجل المدفوعات والإيرادات</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:24 }}>
          {[
            { label:'إجمالي الإيرادات', value:`${total.toFixed(2)} ر.س`, icon:<DollarSign size={20} color="#16a34a"/>, bg:'rgba(22,163,74,0.1)' },
            { label:'هذا الشهر', value:`${thisMonth.toFixed(2)} ر.س`, icon:<TrendingUp size={20} color="#5120c8"/>, bg:'rgba(81,32,200,0.1)' },
            { label:'عدد المعاملات', value:payments.length, icon:<ArrowUpRight size={20} color="#f59e0b"/>, bg:'rgba(245,158,11,0.1)' },
          ].map((s,i) => (
            <div key={i} style={{ background: isDark?'#121212':'#fff', borderRadius:16, padding:'20px 18px', border:`1px solid ${isDark?'rgba(255,255,255,0.06)':'#e5e7eb'}` }}>
              <div style={{ width:40, height:40, borderRadius:10, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>{s.icon}</div>
              <div style={{ color: isDark?'#fff':'#0d0d0d', fontSize:18, fontWeight:800 }}>{s.value}</div>
              <div style={{ color:'#6b7280', fontSize:12, marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{
          background: isDark?'#121212':'#fff',
          borderRadius:20, padding:24, marginBottom:24,
          border:`1px solid ${isDark?'rgba(255,255,255,0.06)':'#e5e7eb'}`,
          direction:'rtl',
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <h3 style={{ color: isDark?'#fff':'#0d0d0d', fontSize:16, fontWeight:700, margin:0 }}>
              تحويل إلى المحفظة
            </h3>
            <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(81,32,200,0.1)', padding:'6px 12px', borderRadius:8 }}>
              <Wallet size={14} color="#5120c8"/>
              <span style={{ color:'#5120c8', fontSize:13, fontWeight:700 }}>
                رصيد المحفظة: {(walletData?.balance||0).toFixed(2)} ر.س
              </span>
            </div>
          </div>

          {msg && (
            <div style={{
              padding:'12px 16px', borderRadius:10, marginBottom:16,
              background: msg.type==='success'?'rgba(22,163,74,0.1)':'rgba(239,68,68,0.1)',
              border:`1px solid ${msg.type==='success'?'rgba(22,163,74,0.3)':'rgba(239,68,68,0.3)'}`,
              color: msg.type==='success'?'#16a34a':'#ef4444',
              fontSize:14, fontWeight:600,
            }}>
              {msg.text}
            </div>
          )}

          <div style={{ display:'flex', gap:10 }}>
            <input
              type="number"
              value={transferAmount}
              onChange={e => setTransferAmount(e.target.value)}
              placeholder={`الحد الأقصى: ${total.toFixed(2)} ر.س`}
              style={{
                flex:1, padding:'12px 16px', borderRadius:10,
                background: isDark?'#1a1a1a':'#f8f8fa',
                color: isDark?'#fff':'#0d0d0d',
                border:`1px solid ${isDark?'rgba(255,255,255,0.1)':'#e5e7eb'}`,
                fontSize:15, outline:'none',
              }}
            />
            <button
              onClick={handleTransfer}
              disabled={transferring || !transferAmount || parseFloat(transferAmount) <= 0}
              style={{
                padding:'12px 24px', borderRadius:10, border:'none',
                background: transferring||!transferAmount ? '#374151' : 'linear-gradient(135deg,#5120c8,#7c3aed)',
                color:'#fff', cursor: transferring||!transferAmount ? 'not-allowed':'pointer',
                fontWeight:700, fontSize:14,
                display:'flex', alignItems:'center', gap:6,
              }}
            >
              {transferring
                ? <><div style={{ width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 1s linear infinite' }}/> جاري...</>
                : <><Wallet size={16}/> تحويل</>
              }
            </button>
          </div>
          <p style={{ color:'#6b7280', fontSize:12, marginTop:8 }}>
            سيتم تحويل المبلغ من إيراداتك إلى رصيد محفظتك فورا
          </p>
        </div>

        <div style={{ background: isDark?'#121212':'#fff', borderRadius:20, padding:24, border:`1px solid ${isDark?'rgba(255,255,255,0.06)':'#e5e7eb'}` }}>
          <h3 style={{ color: isDark?'#fff':'#0d0d0d', fontSize:16, fontWeight:700, marginBottom:20 }}>سجل المعاملات</h3>
          {isLoading ? (
            <div style={{ textAlign:'center', padding:32 }}>
              <div style={{ width:36, height:36, border:'3px solid #5120c8', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto' }}/>
            </div>
          ) : payments.length === 0 ? (
            <div style={{ textAlign:'center', padding:32, color:'#6b7280' }}>
              <DollarSign size={40} style={{ margin:'0 auto 12px', opacity:0.3 }}/>
              <p>لا توجد معاملات بعد</p>
            </div>
          ) : payments.map((p: any) => (
            <div key={p.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 0', borderBottom:`1px solid ${isDark?'rgba(255,255,255,0.05)':'#f1f5f9'}` }}>
              <div style={{ width:40, height:40, borderRadius:'50%', background:'rgba(22,163,74,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <DollarSign size={18} color="#16a34a"/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ color: isDark?'#f1f5f9':'#0d0d0d', fontSize:14, fontWeight:600 }}>
                  {p.course?.titleAr || p.course?.title || 'دفعة'}
                </div>
                <div style={{ color:'#6b7280', fontSize:12, marginTop:2 }}>
                  {new Date(p.createdAt).toLocaleDateString('ar-SA', { year:'numeric', month:'short', day:'numeric' })}
                </div>
              </div>
              <div style={{ color:'#16a34a', fontWeight:700, fontSize:15 }}>+{(p.amount||0).toFixed(2)} ر.س</div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}