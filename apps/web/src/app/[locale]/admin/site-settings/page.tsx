'use client'
import { useEffect, useState } from 'react'
import { api } from '../../../../lib/api'
import { applySiteSettings } from '../../../components/Providers'
import {
  Save, Palette, Layout, Eye, FileText, Image,
} from 'lucide-react'

type SiteConfig = Record<string, any>

const TABS = [
  { id: 'theme', labelAr: 'الهوية البصرية', labelEn: 'Theme', icon: Palette },
  { id: 'landing', labelAr: 'الصفحة الرئيسية', labelEn: 'Landing', icon: Layout },
  { id: 'visibility', labelAr: 'إظهار/إخفاء', labelEn: 'Visibility', icon: Eye },
  { id: 'content', labelAr: 'المحتوى', labelEn: 'Content', icon: Image },
  { id: 'pages', labelAr: 'الصفحات', labelEn: 'Pages', icon: FileText },
]

export default function CMSSettingsPage() {
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('theme')
  const [saved, setSaved] = useState(false)

  const g = (key: string, fallback: any = '') => siteConfig[key] ?? fallback

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

  const set = (key: string, value: any) =>
    setSiteConfig((prev) => ({ ...prev, [key]: value }))

  async function handleSaveAll() {
    setSaving(true)
    setSaved(false)
    try {
      await api.patch('/admin/cms-settings', siteConfig)
      applySiteSettings({
        primaryColor: g('theme.primaryColor', '#5120C8'),
        backgroundColor: g('theme.backgroundColor', '#0d0d0d'),
        buttonColor: g('theme.buttonColor', '#5120C8'),
        siteName: g('brand.siteName', 'DeveWay'),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400 text-sm">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Site Settings</h1>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-[#5120c8] hover:bg-[#3d1a99] disabled:bg-[#2d1370] text-white font-semibold rounded-lg transition-colors text-sm"
        >
          <Save size={15} />
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save All'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '4px' }}>
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 16px', borderRadius: '10px',
                border: 'none', cursor: 'pointer',
                background: isActive ? '#5120c8' : 'transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                fontSize: 13, fontWeight: isActive ? 700 : 500,
                transition: 'all 0.15s',
              }}
            >
              <Icon size={15} />
              {tab.labelAr}
            </button>
          )
        })}
      </div>

      <div className="space-y-6" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
        {/* ═══ THEME TAB ═══ */}
        {activeTab === 'theme' && (
          <div className="space-y-5">
            <SectionTitle label="Site Name & Logo" />
            <div className="grid grid-cols-2 gap-4">
              <FieldRow label="Site Name">
                <input
                  type="text"
                  value={g('brand.siteName', 'DeveWay')}
                  onChange={(e) => set('brand.siteName', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm text-white"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </FieldRow>
              <FieldRow label="Logo URL">
                <input
                  type="url"
                  value={g('brand.logoUrl', '')}
                  onChange={(e) => set('brand.logoUrl', e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3 py-2 rounded-lg text-sm text-white"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </FieldRow>
            </div>

            <SectionTitle label="Colors" />
            <div className="grid grid-cols-3 gap-4">
              {[
                { key: 'theme.primaryColor', label: 'Primary' },
                { key: 'theme.backgroundColor', label: 'Background' },
                { key: 'theme.buttonColor', label: 'Button' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={g(key, '#000000')}
                      onChange={(e) => set(key, e.target.value)}
                      className="w-10 h-10 rounded-lg border-0 cursor-pointer"
                      style={{ background: 'transparent' }}
                    />
                    <span className="text-xs text-gray-500 font-mono">{g(key, '')}</span>
                  </div>
                </div>
              ))}
            </div>

            <SectionTitle label="Preview" />
            <div
              className="rounded-xl p-6 space-y-4"
              style={{ background: g('theme.backgroundColor', '#0d0d0d'), border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center gap-3">
                {g('brand.logoUrl') && (
                  <img src={g('brand.logoUrl')} alt="logo" className="h-8 w-8 rounded-lg object-cover" />
                )}
                <span style={{ color: g('theme.primaryColor', '#5120C8') }} className="font-bold text-lg">
                  {g('brand.siteName', 'DeveWay')}
                </span>
              </div>
              <button
                style={{ background: g('theme.buttonColor', '#5120C8'), color: '#fff' }}
                className="w-full py-2.5 rounded-lg text-sm font-semibold border-0 cursor-pointer"
              >
                Sample Button
              </button>
            </div>
          </div>
        )}

        {/* ═══ LANDING TAB ═══ */}
        {activeTab === 'landing' && (
          <div className="space-y-5">
            <SectionTitle label="Hero Section" />
            <FieldRow label="Title">
              <input
                type="text"
                value={g('hero.title', '')}
                onChange={(e) => set('hero.title', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm text-white"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </FieldRow>
            <FieldRow label="Subtitle">
              <textarea
                value={g('hero.subtitle', '')}
                onChange={(e) => set('hero.subtitle', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg text-sm text-white resize-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </FieldRow>
            <FieldRow label="CTA Button Text">
              <input
                type="text"
                value={g('hero.ctaText', '')}
                onChange={(e) => set('hero.ctaText', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm text-white"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </FieldRow>

            <SectionTitle label="Stats" />
            <div className="grid grid-cols-3 gap-4">
              {[
                { key: 'landing.stats.courses', label: 'Courses Count' },
                { key: 'landing.stats.coaches', label: 'Coaches Count' },
                { key: 'landing.stats.students', label: 'Students Count' },
              ].map(({ key, label }) => (
                <FieldRow key={key} label={label}>
                  <input
                    type="number"
                    value={g(key, 0)}
                    onChange={(e) => set(key, parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg text-sm text-white"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                </FieldRow>
              ))}
            </div>
          </div>
        )}

        {/* ═══ VISIBILITY TAB ═══ */}
        {activeTab === 'visibility' && (
          <div className="space-y-4">
            <SectionTitle label="Toggle sections visibility" />
            {[
              { key: 'sections.features.visible', label: 'قسم المميزات' },
              { key: 'sections.courses.visible', label: 'قسم الكورسات' },
              { key: 'sections.careers.visible', label: 'قسم المسارات' },
              { key: 'sections.testimonials.visible', label: 'آراء المستخدمين' },
              { key: 'sections.pricing.visible', label: 'قسم الأسعار' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between py-3 px-4 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <span className="text-sm text-white">{label}</span>
                <button
                  onClick={() => set(key, !g(key, true))}
                  style={{
                    width: 48, height: 28, borderRadius: 50,
                    border: 'none', cursor: 'pointer',
                    background: g(key, true) ? '#5120C8' : 'rgba(255,255,255,0.1)',
                    position: 'relative', transition: 'all 0.2s',
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 3, width: 22, height: 22,
                    borderRadius: '50%', background: '#fff',
                    left: g(key, true) ? 24 : 3, transition: 'all 0.2s',
                  }} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ═══ CONTENT TAB ═══ */}
        {activeTab === 'content' && (
          <div className="space-y-5">
            <SectionTitle label="Testimonials" />
            <p className="text-xs text-gray-500">Add, edit, or remove testimonials shown on the landing page.</p>
            {Array.isArray(g('testimonials.items')) && (g('testimonials.items') as any[]).map((item: any, idx: number) => (
              <div key={idx} className="p-4 rounded-lg space-y-3"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">#{idx + 1}</span>
                  <button
                    onClick={() => {
                      const items = [...(g('testimonials.items') as any[])]
                      items.splice(idx, 1)
                      set('testimonials.items', items)
                    }}
                    className="text-xs text-red-400 bg-transparent border-0 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={item.name || ''}
                    onChange={(e) => {
                      const items = [...(g('testimonials.items') as any[])]
                      items[idx] = { ...items[idx], name: e.target.value }
                      set('testimonials.items', items)
                    }}
                    placeholder="Name"
                    className="px-3 py-2 rounded-lg text-sm text-white"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                  <input
                    type="text"
                    value={item.role || ''}
                    onChange={(e) => {
                      const items = [...(g('testimonials.items') as any[])]
                      items[idx] = { ...items[idx], role: e.target.value }
                      set('testimonials.items', items)
                    }}
                    placeholder="Role"
                    className="px-3 py-2 rounded-lg text-sm text-white"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
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
                  placeholder="Testimonial text"
                  className="w-full px-3 py-2 rounded-lg text-sm text-white resize-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </div>
            ))}
            <button
              onClick={() => {
                const items = [...(g('testimonials.items') as any[] || [])]
                items.push({ name: '', role: '', text: '' })
                set('testimonials.items', items)
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-transparent border cursor-pointer"
              style={{ border: '1px dashed rgba(255,255,255,0.2)' }}
            >
              + Add Testimonial
            </button>
          </div>
        )}

        {/* ═══ PAGES TAB ═══ */}
        {activeTab === 'pages' && (
          <div className="space-y-5">
            {[
              { key: 'pages.privacy', label: 'Privacy Policy' },
              { key: 'pages.terms', label: 'Terms & Conditions' },
            ].map(({ key, label }) => (
              <div key={key}>
                <SectionTitle label={label} />
                <textarea
                  value={g(key, '')}
                  onChange={(e) => set(key, e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white resize-none font-sans leading-relaxed"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom save */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#5120c8] hover:bg-[#3d1a99] disabled:bg-[#2d1370] text-white font-semibold rounded-lg transition-colors text-sm"
        >
          <Save size={15} />
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save All Changes'}
        </button>
      </div>
    </div>
  )
}

function SectionTitle({ label }: { label: string }) {
  return (
    <p className="text-xs font-semibold tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>
      {label}
    </p>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
