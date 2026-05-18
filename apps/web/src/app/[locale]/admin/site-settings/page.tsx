'use client'
import { useEffect, useState } from 'react'
import { api } from '../../../../lib/api'
import { applySiteSettings } from '../../../components/Providers'
import { Palette, Home, Eye, MessageSquare, FileText, Save } from 'lucide-react'

type SiteConfig = Record<string, any>

const TABS = [
  { id: 'landing', label: 'الصفحة الرئيسية', icon: Home },
  { id: 'testimonials', label: 'آراء المستخدمين', icon: MessageSquare },
  { id: 'pages', label: 'الصفحات', icon: FileText },
]

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px', color: '#fff',
  fontSize: '14px', outline: 'none',
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '16px', padding: '24px', marginBottom: '16px',
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
        'theme.primaryColor': '#5120C8',
        'theme.backgroundColor': '#0d0d0d',
        'theme.buttonColor': '#5120C8',
        'brand.siteName': 'DeveWay',
        'brand.logoUrl': '',
        'hero.title': '',
        'hero.subtitle': '',
        'hero.ctaText': '',
        'sections.testimonials.visible': true,
        'sections.features.visible': true,
        'sections.courses.visible': true,
        'sections.careers.visible': true,
        'sections.pricing.visible': true,
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
      applySiteSettings({
        primaryColor: g('theme.primaryColor', '#5120C8'),
        backgroundColor: g('theme.backgroundColor', '#0d0d0d'),
        buttonColor: g('theme.buttonColor', '#5120C8'),
        siteName: g('brand.siteName', 'DeveWay'),
      })
      // Apply CSS vars directly for immediate effect
      if (typeof document !== 'undefined') {
        const root = document.documentElement
        const primary = g('theme.primaryColor')
        const bg = g('theme.backgroundColor')
        const btn = g('theme.buttonColor')
        if (primary) root.style.setProperty('--primary', primary)
        if (bg) { root.style.setProperty('--background', bg); document.body.style.background = bg }
        if (btn) root.style.setProperty('--button-color', btn)
      }
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
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#fff' }}>
          إعدادات المنصة
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginTop: '4px' }}>
          تحكم في مظهر ومحتوى الموقع بالكامل
        </p>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexDirection: 'row', alignItems: 'flex-start' }}>
        {/* Sidebar */}
        <div style={{ width: '200px', flexShrink: 0, position: 'sticky', top: '24px' }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  width: '100%', padding: '12px 16px', borderRadius: '12px',
                  marginBottom: '4px', border: 'none', cursor: 'pointer',
                  textAlign: 'right', fontSize: '14px', fontWeight: '600',
                  background: isActive ? 'rgba(81,32,200,0.2)' : 'transparent',
                  color: isActive ? '#5120C8' : 'rgba(255,255,255,0.6)',
                  borderRight: isActive ? '3px solid #5120C8' : '3px solid transparent',
                }}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* ══ THEME ══ */}
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '12px' }}>
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
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
                    fontSize: '14px', cursor: 'pointer', marginTop: '8px',
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
                      width: '100%', padding: '14px', marginTop: '12px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px', color: '#fff',
                      fontSize: '14px', resize: 'vertical',
                      fontFamily: 'inherit', lineHeight: '1.7',
                      outline: 'none',
                    }}
                  />
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Sticky save button */}
      <div style={{
        position: 'sticky', bottom: '24px',
        display: 'flex', justifyContent: 'flex-end',
        marginTop: '32px', paddingTop: '16px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          style={{
            padding: '12px 32px', borderRadius: '12px',
            background: saving ? 'rgba(81,32,200,0.5)' : '#5120C8',
            color: '#fff', border: 'none', fontSize: '15px',
            fontWeight: '700', cursor: saving ? 'wait' : 'pointer',
            boxShadow: saving ? 'none' : '0 4px 20px rgba(81,32,200,0.4)',
            transition: 'all 0.2s ease',
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
    <p style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px' }}>
      {label}
    </p>
  )
}

function Label({ text }: { text: string }) {
  return (
    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>{text}</p>
  )
}
