'use client'
import { useEffect, useState } from 'react'
import { api } from '../../../../lib/api'
import { applySiteSettings } from '../../../components/Providers'
import { Home, MessageSquare, FileText, Save } from 'lucide-react'

type SiteConfig = Record<string, any>

const TABS = [
  { id: 'landing', label: 'الصفحة الرئيسية', icon: Home },
  { id: 'testimonials', label: 'آراء المستخدمين', icon: MessageSquare },
  { id: 'pages', label: 'الصفحات', icon: FileText },
]

  const inputStyle: React.CSSProperties = {
    width: '100%', maxWidth: '100%', boxSizing: 'border-box',
    fontSize: 'clamp(13px, 3vw, 15px)',
    padding: '10px 14px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff', outline: 'none',
  }

  const cardStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: 'clamp(16px, 4vw, 24px)',
    borderRadius: '16px',
    marginBottom: '16px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
  }

export default function CMSSettingsPage() {
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('landing')
  const [saved, setSaved] = useState(false)

  const g = (key: string, fallback: any = '') => siteConfig[key] ?? fallback
  const set = (key: string, value: any) =>
    setSiteConfig((prev) => ({ ...prev, [key]: value }))

  useEffect(() => {
    api.get('/admin/cms-settings')
      .then((res) => {
        const grouped = res.data.data?.grouped ?? {}
        const flat: SiteConfig = {}
        for (const group of Object.values(grouped)) {
          for (const [key, entry] of Object.entries(group as Record<string, any>)) {
            flat[key] = (entry as any).value
          }
        }
        setSiteConfig(flat)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleSaveAll() {
    setSaving(true)
    setSaved(false)
    try {
      // Build explicit flat payload with no undefined values
      const payload: Record<string, any> = {}
      for (const [key, fallback] of Object.entries({
        'brand.siteName': 'DeveWay',
        'brand.logoUrl': '',
        'hero.title': '',
        'hero.subtitle': '',
        'hero.ctaText': '',
        'testimonials.items': [],
        'landing.stats.courses': 0,
        'landing.stats.coaches': 0,
        'landing.stats.students': 0,
        'pages.privacy': '',
        'pages.terms': '',
      })) {
        const val = g(key)
        if (val !== undefined && val !== null) payload[key] = val
      }
      console.log('[CMS] Sending payload:', JSON.stringify(payload, null, 2))
      await api.patch('/admin/cms-settings', payload)
      applySiteSettings({ siteName: g('brand.siteName', 'DeveWay') })
      // Tell Next.js to revalidate cached pages on Vercel
      try { await fetch('/api/revalidate?path=/ar', { method: 'POST' }) } catch {}
      try { await fetch('/api/revalidate?path=/en', { method: 'POST' }) } catch {}
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      console.error('Save failed:', e?.response?.data || e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400 text-sm">جاري التحميل...</div>
      </div>
    )
  }

  return (
    <div style={{
      width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box',
      padding: '16px',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: 'clamp(20px, 5vw, 24px)', fontWeight: '700', color: '#fff' }}>
          إعدادات المنصة
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'clamp(12px, 2.5vw, 14px)', marginTop: '4px' }}>
          تحكم في مظهر ومحتوى الموقع بالكامل
        </p>
      </div>

      {/* Mobile tabs */}
      <div style={{
        display: 'flex', overflowX: 'auto', scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch', gap: '8px',
        width: '100%', paddingBottom: '4px', marginBottom: '20px',
      }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flexShrink: 0, whiteSpace: 'nowrap',
                fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: '600',
                padding: '10px 20px', borderRadius: '12px',
                border: 'none', cursor: 'pointer',
                background: isActive ? 'rgba(81,32,200,0.2)' : 'transparent',
                color: isActive ? '#5120C8' : 'rgba(255,255,255,0.6)',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div style={{ width: '100%', boxSizing: 'border-box' }}>

          {/* ══ LANDING ══ */}
          {activeTab === 'landing' && (
            <>
              <div style={cardStyle}>
                <SectionTitle label="القسم الرئيسي (Hero)" />
                <div style={{ marginTop: '12px' }}>
                  <Label text="العنوان" />
                  <input
                    type="text"
                    value={g('hero.title', '')}
                    onChange={(e) => set('hero.title', e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div style={{ marginTop: '12px' }}>
                  <Label text="الوصف" />
                  <textarea
                    value={g('hero.subtitle', '')}
                    onChange={(e) => set('hero.subtitle', e.target.value)}
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
                <div style={{ marginTop: '12px' }}>
                  <Label text="نص الزر" />
                  <input
                    type="text"
                    value={g('hero.ctaText', '')}
                    onChange={(e) => set('hero.ctaText', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={cardStyle}>
                <SectionTitle label="الإحصائيات" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full" style={{ marginTop: '12px' }}>
                  {[
                    { key: 'landing.stats.courses', label: 'عدد الكورسات' },
                    { key: 'landing.stats.coaches', label: 'عدد المدربين' },
                    { key: 'landing.stats.students', label: 'عدد الطلاب' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <Label text={label} />
                      <input
                        type="number"
                        value={g(key, 0)}
                        onChange={(e) => set(key, parseInt(e.target.value) || 0)}
                        style={inputStyle}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ══ TESTIMONIALS ══ */}
          {activeTab === 'testimonials' && (
            <div style={cardStyle}>
              <SectionTitle label="آراء المستخدمين" />
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '4px' }}>
                أضف أو عدّل آراء المستخدمين التي تظهر في الصفحة الرئيسية
              </p>
              <div style={{ marginTop: '16px' }}>
                {(Array.isArray(g('testimonials.items')) ? g('testimonials.items') : []).map((item: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      padding: '16px', borderRadius: '12px', marginBottom: '12px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>#{idx + 1}</span>
                      <button
                        onClick={() => {
                          const items = [...(g('testimonials.items') as any[])]
                          items.splice(idx, 1)
                          set('testimonials.items', items)
                        }}
                        style={{
                          color: '#ef4444', fontSize: '12px',
                          background: 'none', border: 'none', cursor: 'pointer',
                        }}
                      >
                        حذف
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ marginBottom: '12px' }}>
                      <input
                        type="text"
                        value={item.name || ''}
                        onChange={(e) => {
                          const items = [...(g('testimonials.items') as any[])]
                          items[idx] = { ...items[idx], name: e.target.value }
                          set('testimonials.items', items)
                        }}
                        placeholder="الاسم"
                        style={inputStyle}
                      />
                      <input
                        type="text"
                        value={item.role || ''}
                        onChange={(e) => {
                          const items = [...(g('testimonials.items') as any[])]
                          items[idx] = { ...items[idx], role: e.target.value }
                          set('testimonials.items', items)
                        }}
                        placeholder="الوظيفة"
                        style={inputStyle}
                      />
                    </div>
                    <textarea
                      value={item.text || ''}
                      onChange={(e) => {
                        const items = [...(g('testimonials.items') as any[])]
                        items[idx] = { ...items[idx], text: e.target.value }
                        set('testimonials.items', items)
                      }}
                      rows={2}
                      placeholder="نص الرأي"
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  </div>
                ))}
                <button
                  onClick={() => {
                    const items = [...((g('testimonials.items') as any[]) || [])]
                    items.push({ name: '', role: '', text: '' })
                    set('testimonials.items', items)
                  }}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '10px',
                    border: '1px dashed rgba(255,255,255,0.2)',
                    background: 'transparent', color: '#fff',
                    fontSize: 'clamp(13px, 3vw, 15px)', cursor: 'pointer', marginTop: '8px',
                  }}
                >
                  + إضافة رأي جديد
                </button>
              </div>
            </div>
          )}

          {/* ══ PAGES ══ */}
          {activeTab === 'pages' && (
            <>
              {[
                { key: 'pages.privacy', label: 'سياسة الخصوصية' },
                { key: 'pages.terms', label: 'الشروط والأحكام' },
              ].map(({ key, label }) => (
                <div key={key} style={cardStyle}>
                  <SectionTitle label={label} />
                  <textarea
                    value={g(key, '')}
                    onChange={(e) => set(key, e.target.value)}
                    rows={12}
                    style={{
                      width: '100%', maxWidth: '100%', boxSizing: 'border-box',
                      padding: '14px', marginTop: '12px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px', color: '#fff',
                      fontSize: 'clamp(13px, 3vw, 15px)', resize: 'vertical',
                      fontFamily: 'inherit', lineHeight: '1.7',
                      outline: 'none',
                    }}
                  />
                </div>
              ))}
            </>
          )}
        </div>

      {/* Sticky save button */}
      <div style={{
        position: 'sticky', bottom: '0',
        width: '100%', marginTop: '32px', paddingTop: '16px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          style={{
            width: '100%', padding: '14px',
            fontSize: 'clamp(13px, 3vw, 16px)', fontWeight: '700',
            borderRadius: '12px', marginTop: '16px',
            background: saving ? 'rgba(81,32,200,0.5)' : '#5120C8',
            color: '#fff', border: 'none',
            cursor: saving ? 'wait' : 'pointer',
            boxShadow: saving ? 'none' : '0 4px 20px rgba(81,32,200,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          <Save className="h-4 w-4" /> {saving ? 'جاري الحفظ...' : 'حفظ جميع الإعدادات'}
        </button>
      </div>
    </div>
  )
}

function SectionTitle({ label }: { label: string }) {
  return (
    <p style={{ fontSize: 'clamp(14px, 3.5vw, 18px)', fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px', marginBottom: '16px' }}>
      {label}
    </p>
  )
}

function Label({ text }: { text: string }) {
  return (
    <p style={{ display: 'block', fontSize: 'clamp(12px, 2.5vw, 14px)', fontWeight: '600', marginBottom: '6px', color: 'rgba(255,255,255,0.5)' }}>
      {text}
    </p>
  )
}
