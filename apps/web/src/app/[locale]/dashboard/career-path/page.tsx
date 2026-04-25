'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { get, post } from '../../../../lib/api'
import { AuthGate } from '../../../components/AuthGate'
import { DashboardShell } from '../../../components/DashboardShell'
import { CAREER_PATHS, findPathByTitle, CareerPathEntry } from '../../../../lib/career-paths'
import Link from 'next/link'
import {
  Search, Target, ChevronLeft, Check, X,
  Compass, Sparkles, BookOpen, Users,
  ArrowRight, Filter, Grid3X3, Star, Zap,
  DollarSign, CheckCircle2,
} from 'lucide-react'

type SavedCareerPath = {
  id: string
  userId: string
  pathId: string
  pathTitle: string
  pathCategory: string
  aiRecommended: boolean
  createdAt: string
  updatedAt: string
}

type HistorySession = {
  id: string
  status: string
  completedAt: string | null
  report: {
    topSpecializations?: { titleEn?: string; title?: string }[]
  } | null
}

const DEMAND_AR: Record<string, string> = {
  'Very High': 'طلب عالي جداً',
  'High': 'طلب عالي',
  'Medium': 'طلب متوسط',
}

function PathDetailPanel({ 
  pathId, 
  onClose 
}: { 
  pathId: string
  onClose: () => void
}) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [activeTab, setActiveTab] = useState<'tasks' | 'skills' | 'qualifications' | 'progression'>('tasks')

  const detailPath = useMemo(() => {
    for (const cat of CAREER_PATHS) {
      const path = cat.paths.find(p => p.id === pathId)
      if (path) return path
    }
    return null
  }, [pathId])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (!detailPath) return null

  const parseSalary = (salaryStr: string) => {
    const parts = salaryStr.split('-').map(s => parseInt(s.replace(/,/g, '').trim()))
    return { min: parts[0] || 0, max: parts[1] || 0 }
  }
  const salary = parseSalary(detailPath.salary)

  return (
    <div 
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        width: '100%', maxWidth: 600,
        background: isDark ? '#111111' : '#ffffff',
        borderRadius: '20px 20px 0 0',
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '24px 24px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h2 style={{ color: isDark ? '#fff' : '#0d0d0d', fontSize: 20, fontWeight: 800, margin: 0 }}>
                {isAr ? detailPath.titleAr : detailPath.title}
              </h2>
              <p style={{ color: '#6b7280', fontSize: 13, marginTop: 6 }}>
                {isAr ? (detailPath.descriptionAr || '') : (detailPath.descriptionEn || '')}
              </p>
            </div>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4,
            }}>
              <X size={20} />
            </button>
          </div>

          <div style={{
            padding: '12px 16px', borderRadius: 12, marginBottom: 16,
            background: 'rgba(81,32,200,0.06)', border: '1px solid rgba(81,32,200,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <DollarSign size={16} color="#5120c8" />
              <span style={{ color: '#6b7280', fontSize: 13 }}>
                {isAr ? 'متوسط الراتب الشهري' : 'Monthly Salary Range'}
              </span>
            </div>
            <span style={{ color: '#5120c8', fontWeight: 800, fontSize: 15 }}>
              {salary.min.toLocaleString()} - {salary.max.toLocaleString()} {isAr ? 'ر.س' : 'SAR'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 0, scrollbarWidth: 'none' }}>
            {[
              { key: 'tasks', label: isAr ? 'المهام' : 'Tasks' },
              { key: 'skills', label: isAr ? 'المهارات' : 'Skills' },
              { key: 'qualifications', label: isAr ? 'المؤهلات' : 'Qualifications' },
              { key: 'progression', label: isAr ? 'التدرج الوظيفي' : 'Career Path' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{
                padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0,
                background: activeTab === tab.key ? '#5120c8' : isDark ? 'rgba(255,255,255,0.06)' : '#f4f4f8',
                color: activeTab === tab.key ? '#fff' : '#6b7280',
                fontSize: 13, fontWeight: 600,
              }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 24px' }}>
          {activeTab === 'tasks' && detailPath.tasks && (
            <div>
              {detailPath.tasks.map((task: string, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc'}` }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(81,32,200,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <span style={{ color: '#5120c8', fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
                  </div>
                  <span style={{ color: isDark ? '#f1f5f9' : '#374151', fontSize: 14, lineHeight: 1.6 }}>{task}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'skills' && detailPath.skills && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {detailPath.skills.map((skill: string, i: number) => (
                <div key={i} style={{
                  padding: '8px 16px', borderRadius: 20,
                  background: isDark ? 'rgba(81,32,200,0.1)' : 'rgba(81,32,200,0.06)',
                  border: '1px solid rgba(81,32,200,0.2)',
                  color: '#5120c8', fontSize: 13, fontWeight: 600,
                }}>
                  {skill}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'qualifications' && detailPath.qualifications && (
            <div>
              {detailPath.qualifications.map((qual: string, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc'}` }}>
                  <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ color: isDark ? '#f1f5f9' : '#374151', fontSize: 14 }}>{qual}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'progression' && detailPath.progression && (
            <div style={{ padding: '8px 0' }}>
              {detailPath.progression.map((level: string, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: i === 0 ? '#5120c8' : isDark ? 'rgba(255,255,255,0.06)' : '#f4f4f8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: i > 0 ? `2px dashed ${isDark ? 'rgba(255,255,255,0.12)' : '#e5e7eb'}` : 'none',
                  }}>
                    <span style={{ color: i === 0 ? '#fff' : '#6b7280', fontSize: 13, fontWeight: 700 }}>{i + 1}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: isDark ? '#f1f5f9' : '#0d0d0d', fontWeight: 600, fontSize: 14 }}>{level}</div>
                    {i < detailPath.progression.length - 1 && (
                      <div style={{ color: '#6b7280', fontSize: 11, marginTop: 2 }}>
                        {isAr ? 'المرحلة التالية' : 'Next level'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PathModal({
  onClose,
  currentPathId,
  onSelect,
  onShowDetails,
  isSaving,
  savingPathId,
}: {
  onClose: () => void
  currentPathId?: string
  onSelect: (pathId: string, pathTitle: string, pathCategory: string) => void
  onShowDetails: (pathId: string) => void
  isSaving: boolean
  savingPathId: string | null
}) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true))
  }, [])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q && !activeCategory) return CAREER_PATHS
    let result = CAREER_PATHS.map((cat) => ({
      ...cat,
      paths: cat.paths.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.titleAr.includes(q),
      ),
    })).filter((cat) => cat.paths.length > 0)
    if (activeCategory) {
      result = result.filter((c) => c.category === activeCategory)
    }
    return result
  }, [search, activeCategory])

  const handleClose = useCallback(() => {
    setIsVisible(false)
    setTimeout(onClose, 200)
  }, [onClose])

  const totalPaths = filtered.reduce((acc, cat) => acc + cat.paths.length, 0)

  const modalBg = isDark ? '#111118' : '#f8fafc'
  const cardBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const textColor = isDark ? '#ffffff' : '#0d0d0d'
  const subtextColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={handleClose} />
      <div
        className={`relative z-10 flex h-[93vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border shadow-2xl shadow-black/50 transition-all duration-300 ease-out ${
          isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}
        dir="rtl"
        style={{ background: modalBg, borderColor: cardBorder }}
      >
        <div className="relative flex items-center justify-between border-b px-6 py-5 sm:px-8" style={{ borderColor: cardBorder }}>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 ring-1 ring-primary/20">
                <Compass className="h-6 w-6 text-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {totalPaths}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold sm:text-2xl" style={{ color: textColor, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                اختر مسارك المهني
              </h2>
              <p className="mt-0.5 text-sm" style={{ color: subtextColor }}>
                {totalPaths} مسار متاح · اختر ما يناسب طموحاتك
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="group flex h-10 w-10 items-center justify-center rounded-xl transition-all"
            style={{ background: cardBg, color: subtextColor }}
          >
            <X className="h-5 w-5 transition-transform group-hover:rotate-90" />
          </button>
        </div>

        <div className="relative space-y-4 border-b px-6 py-5 sm:px-8" style={{ borderColor: cardBorder }}>
          <div className="relative group">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-primary">
              <Search className="h-4 w-4" style={{ color: subtextColor }} />
            </div>
            <input
              type="text"
              placeholder="ابحث عن تخصص، مهارة، أو كلمة مفتاحية..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border py-3.5 pr-12 pl-12 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
              style={{ 
                background: cardBg, 
                borderColor: cardBorder, 
                color: textColor,
                placeholder: { color: subtextColor }
              }}
              autoFocus
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Filter className="h-4 w-4 shrink-0" style={{ color: subtextColor }} />
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className="shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-200"
              style={{
                background: !activeCategory ? '#5120c8' : cardBg,
                color: !activeCategory ? '#fff' : subtextColor,
              }}
            >
              <span className="flex items-center gap-1.5">
                <Grid3X3 className="h-3.5 w-3.5" />
                الكل ({totalPaths})
              </span>
            </button>
            {CAREER_PATHS.map((cat) => {
              const isActive = activeCategory === cat.category
              return (
                <button
                  key={cat.category}
                  type="button"
                  onClick={() => setActiveCategory(isActive ? null : cat.category)}
                  className="shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-200"
                  style={{
                    background: isActive ? '#5120c8' : cardBg,
                    color: isActive ? '#fff' : subtextColor,
                  }}
                >
                  <span className="flex items-center gap-1.5">
                    <span>{cat.emoji}</span>
                    <span>{cat.category}</span>
                    <span className="text-xs" style={{ opacity: isActive ? 0.8 : 0.4 }}>
                      ({cat.paths.length})
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6 sm:px-8">
          {filtered.map((cat, catIndex) => (
            <section key={cat.category}>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: cardBg }}>
                  <span className="text-lg">{cat.emoji}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold" style={{ color: textColor }}>{cat.category}</h3>
                  <p className="text-xs" style={{ color: subtextColor }}>{cat.paths.length} تخصص متاح</p>
                </div>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {cat.paths.map((path, pathIndex) => {
                  const isSelected = currentPathId === path.id
                  const isSavingThis = isSaving && savingPathId === path.id
                  const isHovered = hoveredCard === path.id
                  
                  return (
                    <div
                      key={path.id}
                      className="group relative overflow-hidden rounded-2xl border p-4 text-right transition-all duration-300 ease-out"
                      style={{
                        background: cardBg,
                        borderColor: isSelected ? 'rgba(81,32,200,0.5)' : cardBorder,
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                        opacity: isSaving && !isSavingThis ? 0.6 : 1,
                      }}
                      onMouseEnter={() => setHoveredCard(path.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      {isSelected && (
                        <div className="absolute left-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/40">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}

                      {isSavingThis && (
                        <div className="absolute left-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                      )}

                      <div className="relative">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: textColor }}>
                            {path.title}
                          </h4>
                        </div>

                        <p className="text-xs line-clamp-1 mb-3" style={{ color: subtextColor }}>
                          {path.titleAr}
                        </p>

                        <div className="mb-3 flex flex-wrap gap-1.5">
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: 'rgba(81,32,200,0.1)', color: '#5120c8' }}>
                            {DEMAND_AR[path.demand] ?? path.demand}
                          </span>
                          <span className="rounded-full border px-2.5 py-1 text-[11px]" style={{ borderColor: cardBorder, color: subtextColor }}>
                            {path.level}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 pt-3" style={{ borderTop: `1px solid ${cardBorder}` }}>
                          <span className="text-base">💰</span>
                          <span className="text-sm font-bold" style={{ color: textColor }}>{path.salary}</span>
                          <span className="text-xs" style={{ color: subtextColor }}>SAR / شهرياً</span>
                        </div>

                        <button
                          onClick={(e) => { e.stopPropagation(); onShowDetails(path.id) }}
                          className="mt-3 w-full rounded-lg py-2 text-xs font-medium transition-all"
                          style={{ 
                            background: cardBg, 
                            border: `1px solid ${cardBorder}`, 
                            color: subtextColor 
                          }}
                        >
                          {isAr ? 'التفاصيل' : 'Details'}
                        </button>

                        <button
                          onClick={() => onSelect(path.id, path.title, cat.category)}
                          disabled={isSaving}
                          className="mt-2 w-full rounded-lg py-2 text-xs font-bold text-white transition-all disabled:opacity-60"
                          style={{ background: '#5120c8' }}
                        >
                          {isAr ? 'اختيار' : 'Select'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl" style={{ background: cardBg }}>
                <Search className="h-8 w-8" style={{ color: subtextColor }} />
              </div>
              <h3 className="text-lg font-semibold" style={{ color: textColor }}>لا توجد نتائج</h3>
              <p className="mt-2 max-w-sm text-sm" style={{ color: subtextColor }}>
                لم نجد أي تخصص يطابق &ldquo;{search}&rdquo;
              </p>
            </div>
          )}
        </div>

        <div className="relative flex items-center justify-between border-t px-6 py-4 sm:px-8" style={{ borderColor: cardBorder, background: cardBg }}>
          <div className="flex items-center gap-3 text-xs" style={{ color: subtextColor }}>
            <Zap className="h-3.5 w-3.5" />
            <span>اختر المسار وسيتم تحديث خطة التعلم تلقائياً</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border px-5 py-2.5 text-sm font-medium transition"
              style={{ borderColor: cardBorder, color: subtextColor }}
            >
              إلغاء
            </button>
            {currentPathId && (
              <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
                <Star className="h-4 w-4" />
                تم اختيار مسار بالفعل
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardCareerPathPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [detailPathId, setDetailPathId] = useState<string | null>(null)
  const [savingPathId, setSavingPathId] = useState<string | null>(null)

  const { data: myPath, isLoading } = useQuery({
    queryKey: ['my-career-path'],
    queryFn: async () => {
      const res = await get('/career/my-path')
      const d = (res as any)?.data?.data
      return d?.path ?? null
    },
  })

  const { data: sessions } = useQuery({
    queryKey: ['ai-assessment-history-career'],
    queryFn: async () => {
      const res = await get('/career/assessment/session/history')
      const d = (res as any)?.data?.data
      return Array.isArray(d?.sessions) ? d.sessions : []
    },
  })

  const latestAiTitle = sessions
    ?.find((s: HistorySession) => s.status === 'COMPLETED' && s.report?.topSpecializations?.length)
    ?.report?.topSpecializations?.[0]?.titleEn

  const aiRecommendedPathId = latestAiTitle ? findPathByTitle(latestAiTitle)?.path.id : undefined

  const savePath = useMutation({
    mutationFn: async (data: { pathId: string; pathTitle: string; pathCategory: string; aiRecommended?: boolean }) => {
      await post('/career/my-path', data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-career-path'] })
      setModalOpen(false)
      setSavingPathId(null)
    },
    onError: () => {
      setSavingPathId(null)
    },
  })

  const handleSelect = (pathId: string, pathTitle: string, pathCategory: string) => {
    setSavingPathId(pathId)
    savePath.mutate({
      pathId,
      pathTitle,
      pathCategory,
      aiRecommended: pathId === aiRecommendedPathId,
    })
  }

  const selectedCatEntry = myPath
    ? CAREER_PATHS.find((c) => c.category === myPath.pathCategory)
    : null
  const selectedPathEntry = selectedCatEntry?.paths.find((p) => p.id === myPath?.pathId)

  const pageBg = isDark ? '#0f1221' : '#fafafa'
  const cardBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const textColor = isDark ? '#ffffff' : '#0d0d0d'
  const subtextColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'

  if (isLoading) {
    return (
      <AuthGate>
        <DashboardShell title="مساري المهني" subtitle="خارطة طريقك المهنية">
          <div className="flex min-h-[60vh] items-center justify-center" dir="rtl">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </DashboardShell>
      </AuthGate>
    )
  }

  return (
    <AuthGate>
      <DashboardShell title="مساري المهني" subtitle="خارطة طريقك المهنية">
        <div dir="rtl" style={{ background: pageBg, minHeight: '100%' }}>
          {!myPath ? (
            <div className="space-y-6 p-6">
              <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 p-10 text-center" style={{ background: isDark ? '#111118' : '#ffffff', borderColor: cardBorder }}>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
                <div className="relative">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 ring-1 ring-primary/30">
                    <Compass className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="mb-3 text-2xl font-bold" style={{ color: textColor, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    لم تختر مسارك المهني بعد
                  </h2>
                  <p className="mb-8 mx-auto max-w-md" style={{ color: subtextColor }}>
                    اختر تخصصك المهني لنعرض لك الكورسات المناسبة وخطة التعلم المخصصة
                  </p>
                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="group inline-flex items-center gap-3 rounded-2xl bg-primary px-8 py-4 text-base font-bold text-white shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:shadow-primary/50"
                  >
                    <Target className="h-5 w-5" />
                    اختر مسارك المهني
                    <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  { label: 'تخصص متاح', value: '40+', Icon: Target, color: 'text-blue-500' },
                  { label: 'كورس احترافي', value: '150+', Icon: BookOpen, color: 'text-emerald-500' },
                  { label: 'كوتش خبير', value: '50+', Icon: Users, color: 'text-purple-500' },
                ].map(({ label, value, Icon, color }) => (
                  <div
                    key={label}
                    className="group rounded-2xl border p-6 text-center transition-all"
                    style={{ background: cardBg, borderColor: cardBorder }}
                  >
                    <Icon className={`mx-auto mb-2 h-6 w-6 ${color} transition-transform group-hover:scale-110`} />
                    <div className="text-2xl font-extrabold" style={{ color: textColor }}>{value}</div>
                    <div className="text-sm" style={{ color: subtextColor }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 p-6">
              <div className="rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 p-6" style={{ background: isDark ? '#111118' : '#ffffff' }}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/20 text-2xl ring-1 ring-primary/20">
                      {selectedCatEntry?.emoji ?? '🎯'}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                          {myPath.pathCategory}
                        </span>
                        {myPath.aiRecommended && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                            <Sparkles className="h-3 w-3" />
                            توصية AI
                          </span>
                        )}
                      </div>
                      <h2 className="mt-1 text-xl font-extrabold" style={{ color: textColor }}>
                        {myPath.pathTitle}
                      </h2>
                      {selectedPathEntry && (
                        <p className="mt-0.5 text-sm" style={{ color: subtextColor }}>
                          {selectedPathEntry.titleAr}
                        </p>
                      )}
                      <p className="mt-2 text-xs" style={{ color: subtextColor }}>
                        تم الاختيار في{' '}
                        {new Date(myPath.createdAt).toLocaleDateString('ar-SA', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </p>
                      {selectedPathEntry && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: 'rgba(81,32,200,0.1)', color: '#5120c8' }}>
                            {DEMAND_AR[selectedPathEntry.demand] ?? selectedPathEntry.demand}
                          </span>
                          <span className="rounded-full border px-2.5 py-0.5 text-xs" style={{ borderColor: cardBorder, color: subtextColor }}>
                            {selectedPathEntry.level}
                          </span>
                          <span className="text-xs" style={{ color: subtextColor }}>
                            💰 {selectedPathEntry.salary} SAR
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="shrink-0 rounded-xl border px-4 py-2.5 text-sm transition"
                    style={{ borderColor: cardBorder, color: subtextColor }}
                  >
                    تغيير المسار
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border p-10 text-center" style={{ background: cardBg, borderColor: cardBorder }}>
                <BookOpen className="mx-auto mb-4 h-12 w-12" style={{ color: subtextColor }} />
                <h3 className="text-lg font-bold" style={{ color: textColor }}>الكورسات المتاحة قريباً</h3>
                <p className="mt-2 text-sm max-w-md mx-auto" style={{ color: subtextColor }}>
                  سيتم إضافة الكورسات المتخصصة لـ <span className="text-primary font-semibold">{myPath.pathTitle}</span> خلال الأيام القادمة
                </p>
                <button
                  onClick={() => router.push(`/${locale}/coaching?speciality=${encodeURIComponent(myPath.pathTitle)}`)}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:shadow-primary/40"
                >
                  <Users className="h-4 w-4" />
                  احجز جلسة كوتشينج الآن
                </button>
              </div>
            </div>
          )}
        </div>

        {modalOpen && (
          <PathModal
            onClose={() => setModalOpen(false)}
            currentPathId={myPath?.pathId}
            onSelect={handleSelect}
            onShowDetails={(pathId) => setDetailPathId(pathId)}
            isSaving={savePath.isPending}
            savingPathId={savingPathId}
          />
        )}

        {detailPathId && (
          <PathDetailPanel pathId={detailPathId} onClose={() => setDetailPathId(null)} />
        )}
      </DashboardShell>
    </AuthGate>
  )
}