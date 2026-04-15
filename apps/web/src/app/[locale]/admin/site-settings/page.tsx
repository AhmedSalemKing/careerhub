'use client'
import { useEffect, useState } from 'react'
import { api } from '../../../../lib/api'
import { applySiteSettings } from '../../../components/Providers'
import { Save, Palette } from 'lucide-react'

type SiteSettings = {
  primaryColor: string
  backgroundColor: string
  buttonColor: string
  logoUrl?: string
}

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>({
    primaryColor: '#5120c8',
    backgroundColor: '#0d0d0d',
    buttonColor: '#5120c8',
    logoUrl: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.get('/admin/site-settings')
      .then((res) => {
        const d = res.data.data ?? res.data
        setSettings({
          primaryColor: d.primaryColor ?? '#5120c8',
          backgroundColor: d.backgroundColor ?? '#0d0d0d',
          buttonColor: d.buttonColor ?? '#5120c8',
          logoUrl: d.logoUrl ?? '',
        })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      await api.patch('/admin/site-settings', settings)
      // Apply immediately so the admin sees the effect
      applySiteSettings(settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const colorFields: { key: keyof SiteSettings; label: string; desc: string }[] = [
    { key: 'primaryColor', label: 'Primary Color', desc: 'Main brand color used throughout the site' },
    { key: 'backgroundColor', label: 'Background Color', desc: 'Default page background' },
    { key: 'buttonColor', label: 'Button Color', desc: 'CTA and action button color' },
  ]

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Palette size={20} className="text-blue-400" />
        <h1 className="text-xl font-bold text-white">Site Settings</h1>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm py-8 text-center">Loading...</div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">

          {/* Color pickers */}
          {colorFields.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-gray-400 font-mono">{settings[key] as string}</span>
                <input
                  type="color"
                  value={settings[key] as string}
                  onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer bg-transparent"
                />
              </div>
            </div>
          ))}

          {/* Logo URL */}
          <div>
            <label className="block text-sm font-semibold text-white mb-1.5">Logo URL</label>
            <input
              type="url"
              value={settings.logoUrl ?? ''}
              onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
              placeholder="https://example.com/logo.png"
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Preview */}
          <div className="border border-gray-700 rounded-lg p-4 space-y-3">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Preview</p>
            <div
              className="h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: settings.backgroundColor }}
            >
              <span style={{ color: settings.primaryColor }} className="font-bold text-sm">DeveWay</span>
            </div>
            <button
              style={{ backgroundColor: settings.buttonColor }}
              className="w-full py-2 rounded-lg text-white text-sm font-semibold"
            >
              Sample Button
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            <Save size={15} />
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      )}
    </div>
  )
}
