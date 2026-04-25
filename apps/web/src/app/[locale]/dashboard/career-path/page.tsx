'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { get, post } from '../../../../lib/api'
import { AuthGate } from '../../../components/AuthGate'
import { DashboardShell } from '../../../components/DashboardShell'
import { CAREER_PATHS, findPathByTitle } from '../../../../lib/career-paths'
import Link from 'next/link'
import {
  Search, Target, ChevronLeft, Check, X,
  Compass, Sparkles, BookOpen, Users,
  ArrowRight, Filter, Grid3X3, Star, Zap,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Color Maps ────────────────────────────────────────────────────────────────

const COLOR_CARDS: Record<string, { border: string; bg: string; hoverBorder: string; hoverBg: string }> = {
  blue:     { border: 'border-blue-500/25', bg: 'bg-blue-500/5',   hoverBorder: 'hover:border-blue-500/50', hoverBg: 'hover:bg-blue-500/10' },
  red:      { border: 'border-red-500/25',   bg: 'bg-red-500/5',    hoverBorder: 'hover:border-red-500/50',   hoverBg: 'hover:bg-red-500/10' },
  green:    { border: 'border-green-500/25', bg: 'bg-green-500/5',  hoverBorder: 'hover:border-green-500/50', hoverBg: 'hover:bg-green-500/10' },
  purple:   { border: 'border-purple-500/25',bg: 'bg-purple-500/5', hoverBorder: 'hover:border-purple-500/50',hoverBg: 'hover:bg-purple-500/10' },
  pink:     { border: 'border-pink-500/25',  bg: 'bg-pink-500/5',   hoverBorder: 'hover:border-pink-500/50',  hoverBg: 'hover:bg-pink-500/10' },
  amber:    { border: 'border-amber-500/25', bg: 'bg-amber-500/5',  hoverBorder: 'hover:border-amber-500/50', hoverBg: 'hover:bg-amber-500/10' },
  orange:   { border: 'border-orange-500/25',bg: 'bg-orange-500/5', hoverBorder: 'hover:border-orange-500/50',hoverBg: 'hover:bg-orange-500/10' },
  gradient: { border: 'border-primary/25',   bg: 'bg-primary/5',     hoverBorder: 'hover:border-primary/50',   hoverBg: 'hover:bg-primary/10' },
}

const DEMAND_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'Very High': { 
    bg: 'bg-emerald-500/15', 
    text: 'text-emerald-600 dark:text-emerald-400', 
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-500',
  },
  'High': { 
    bg: 'bg-sky-500/15', 
    text: 'text-sky-600 dark:text-sky-400', 
    border: 'border-sky-500/30',
    dot: 'bg-sky-500',
  },
  'Medium': { 
    bg: 'bg-gray-500/15', 
    text: 'text-gray-600 dark:text-gray-400', 
    border: 'border-gray-500/30',
    dot: 'bg-gray-500',
  },
}

const DEMAND_AR: Record<string, string> = {
  'Very High': 'طلب عالي جداً',
  'High':      'طلب عالي',
  'Medium':    'طلب متوسط',
}

const CATEGORY_ACCENT: Record<string, { ring: string; iconBg: string; badge: string }> = {
  blue:     { ring: 'ring-blue-500/20', iconBg: 'bg-blue-500/15', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  red:      { ring: 'ring-red-500/20',   iconBg: 'bg-red-500/15',   badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  green:    { ring: 'ring-green-500/20', iconBg: 'bg-green-500/15', badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  purple:   { ring: 'ring-purple-500/20',iconBg: 'bg-purple-500/15',badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  pink:     { ring: 'ring-pink-500/20',  iconBg: 'bg-pink-500/15',  badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' },
  amber:    { ring: 'ring-amber-500/20', iconBg: 'bg-amber-500/15', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  orange:   { ring: 'ring-orange-500/20',iconBg: 'bg-orange-500/15',badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  gradient: { ring: 'ring-primary/20',    iconBg: 'bg-primary/15',    badge: 'bg-primary/10 text-primary' },
}

// ════════════════════════════════════════════════════════
//   PATH SELECTION MODAL — PROFESSIONAL VERSION
// ════════════════════════════════════════════════════════

function PathModal({
  onClose,
  currentPathId,
  onSelect,
  isSaving,
  savingPathId,
}: {
  onClose: () => void
  currentPathId?: string
  onSelect: (pathId: string, pathTitle: string, pathCategory: string) => void
  isSaving: boolean
  savingPathId: string | null
}) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  // Animate in
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true))
  }, [])

  // ESC to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // ═══ Filter logic — FIXED: no .tags reference ═══
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

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div
        className={`relative z-10 flex h-[93vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#111118] shadow-2xl shadow-black/50 transition-all duration-300 ease-out ${
          isVisible 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-95 opacity-0 translate-y-4'
        }`}
        dir="rtl"
      >
        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        
        {/* Noise texture */}
        <div 
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* ═══ HEADER ═══ */}
        <div className="relative flex items-center justify-between border-b border-white/[0.06] px-6 py-5 sm:px-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 ring-1 ring-primary/20">
                <Compass className="h-6 w-6 text-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {totalPaths}
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-white sm:text-2xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                اختر مسارك المهني
              </h2>
              <p className="mt-0.5 text-sm text-white/40">
                {totalPaths} مسار متاح · اختر ما يناسب طموحاتك
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="group flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/50 transition-all hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5 transition-transform group-hover:rotate-90" />
          </button>
        </div>

        {/* ═══ SEARCH + FILTER BAR ═══ */}
        <div className="relative space-y-4 border-b border-white/[0.06] px-6 py-5 sm:px-8">
          {/* Search input */}
          <div className="relative group">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-primary">
              <Search className="h-4 w-4 text-white/30" />
            </div>
            <input
              type="text"
              placeholder="ابحث عن تخصص، مهارة، أو كلمة مفتاحية..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] py-3.5 pr-12 pl-12 text-sm text-white placeholder:text-white/25 transition-all focus:border-primary/50 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-0.5 text-white/50 transition hover:bg-white/20 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <div className="absolute left-14 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-white/25">
              <kbd className="font-mono">⌘</kbd><kbd className="font-mono">K</kbd>
            </div>
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Filter className="h-4 w-4 shrink-0 text-white/25" />
            
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                !activeCategory
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'bg-white/[0.05] text-white/60 hover:bg-white/[0.08] hover:text-white/80'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Grid3X3 className="h-3.5 w-3.5" />
                الكل ({totalPaths})
              </span>
            </button>

            {CAREER_PATHS.map((cat) => {
              const isActive = activeCategory === cat.category
              const accent = CATEGORY_ACCENT[cat.color] ?? CATEGORY_ACCENT.gradient
              
              return (
                <button
                  key={cat.category}
                  type="button"
                  onClick={() => setActiveCategory(isActive ? null : cat.category)}
                  className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? `${accent.badge} shadow-md`
                      : 'bg-white/[0.05] text-white/60 hover:bg-white/[0.08] hover:text-white/80'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>{cat.emoji}</span>
                    <span>{cat.category}</span>
                    <span className={`text-xs ${isActive ? 'opacity-80' : 'opacity-40'}`}>
                      ({cat.paths.length})
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ═══ CONTENT AREA ═══ */}
        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6 sm:px-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {filtered.map((cat, catIndex) => {
            const accent = CATEGORY_ACCENT[cat.color] ?? CATEGORY_ACCENT.blue
            const colors = COLOR_CARDS[cat.color] ?? COLOR_CARDS.blue
            
            return (
              <section key={cat.category}>
                {/* Category header */}
                <div className="mb-4 flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent.iconBg} ring-1 ${accent.ring}`}>
                    <span className="text-lg">{cat.emoji}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white">{cat.category}</h3>
                    <p className="text-xs text-white/35">{cat.paths.length} تخصص متاح</p>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-xs font-medium ${accent.badge}`}>
                    {cat.color}
                  </div>
                </div>

                {/* Cards grid */}
                <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {cat.paths.map((path, pathIndex) => {
                    const isSelected = currentPathId === path.id
                    const isSavingThis = isSaving && savingPathId === path.id
                    const isHovered = hoveredCard === path.id
                    const demandStyle = DEMAND_STYLES[path.demand] ?? DEMAND_STYLES.Medium
                    
                    return (
                      <button
                        key={path.id}
                        type="button"
                        disabled={isSaving}
                        onMouseEnter={() => setHoveredCard(path.id)}
                        onMouseLeave={() => setHoveredCard(null)}
                        onClick={() => onSelect(path.id, path.title, cat.category)}
                        className={`group relative overflow-hidden rounded-2xl border p-4 text-right transition-all duration-300 ease-out disabled:cursor-not-allowed disabled:opacity-60 ${
                          isSelected
                            ? 'border-primary/60 bg-primary/15 ring-2 ring-primary/20 shadow-lg shadow-primary/10 scale-[1.02]'
                            : `${colors.border} ${colors.bg} ${colors.hoverBorder} ${colors.hoverBg} hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20`
                        }`}
                        style={{
                          animationDelay: `${(catIndex * 50) + (pathIndex * 30)}ms`,
                        }}
                      >
                        {/* Hover glow effect */}
                        {isHovered && !isSelected && (
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent" />
                        )}

                        {/* Selected state */}
                        {isSelected && (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                            <div className="absolute left-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/40">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          </>
                        )}

                        {/* Saving spinner */}
                        {isSavingThis && (
                          <div className="absolute left-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          </div>
                        )}

                        {/* Content */}
                        <div className="relative">
                          {/* Title row */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-semibold text-white text-sm leading-snug line-clamp-2">
                              {path.title}
                            </h4>
                            
                            {!isSelected && !isSavingThis && (
                              <div className={`shrink-0 opacity-0 transition-all duration-200 ${
                                isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
                              }`}>
                                <ArrowRight className="h-4 w-4 text-primary" />
                              </div>
                            )}
                          </div>

                          {/* Arabic subtitle */}
                          <p className="text-xs text-white/45 line-clamp-1 mb-3">
                            {path.titleAr}
                          </p>

                          {/* Tags row */}
                          <div className="flex flex-wrap gap-1.5">
                            {/* Demand badge */}
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${demandStyle.bg} ${demandStyle.text} border ${demandStyle.border}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${demandStyle.dot}`} />
                              {DEMAND_AR[path.demand] ?? path.demand}
                            </span>
                            
                            {/* Level badge */}
                            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/50">
                              {path.level}
                            </span>
                          </div>

                          {/* Salary */}
                          <div className="mt-3 flex items-center gap-1.5 pt-3 border-t border-white/[0.05]">
                            <span className="text-base">💰</span>
                            <span className="text-sm font-bold text-white">{path.salary}</span>
                            <span className="text-xs text-white/30">SAR / شهرياً</span>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })}

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/[0.03] ring-1 ring-white/[0.05]">
                <Search className="h-8 w-8 text-white/20" />
              </div>
              <h3 className="text-lg font-semibold text-white/70">لا توجد نتائج</h3>
              <p className="mt-2 max-w-sm text-sm text-white/35">
                لم نجد أي تخصص يطابق &ldquo;<span className="text-white/60">{search}</span>&rdquo;
              </p>
              <button
                type="button"
                onClick={() => { setSearch(''); setActiveCategory(null) }}
                className="mt-5 rounded-xl bg-white/[0.06] px-5 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/[0.10] hover:text-white"
              >
                مسح الفلتر
              </button>
            </div>
          )}
        </div>

        {/* ═══ FOOTER ═══ */}
        <div className="relative flex items-center justify-between border-t border-white/[0.06] px-6 py-4 sm:px-8 bg-white/[0.01]">
          <div className="flex items-center gap-3 text-xs text-white/30">
            <Zap className="h-3.5 w-3.5" />
            <span>اختر المسار وسيتم تحديث خطة التعلم تلقائياً</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-white/60 transition hover:bg-white/[0.08] hover:text-white/80"
            >
              إلغاء
            </button>
            {currentPathId && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-2.5 text-sm font-medium text-emerald-400">
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

// ════════════════════════════════════════════════════════
//   MAIN PAGE
// ════════════════════════════════════════════════════════

export default function DashboardCareerPathPage() {
  const locale = useLocale()
  const router = useRouter()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [savingPathId, setSavingPathId] = useState<string | null>(null)

  // Fetch current path
  const { data: myPath, isLoading } = useQuery({
    queryKey: ['my-career-path'],
    queryFn: async () => {
      const res = await get('/career/my-path')
      const d = (res as any)?.data?.data
      return d?.path ?? null
    },
  })

  // Fetch AI history
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

  // Save mutation
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

  // Find category info
  const selectedCatEntry = myPath
    ? CAREER_PATHS.find((c) => c.category === myPath.pathCategory)
    : null
  const selectedPathEntry = selectedCatEntry?.paths.find((p) => p.id === myPath?.pathId)

  // Loading
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
        <div dir="rtl">
          {!myPath ? (
            /* STATE A: No path */
            <div className="space-y-6">
              {/* Hero */}
              <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-[#111118] to-[#111118] p-10 text-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
                
                <div className="relative">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 ring-1 ring-primary/30">
                    <Compass className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="mb-3 text-2xl font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    لم تختر مسارك المهني بعد
                  </h2>
                  <p className="mb-8 mx-auto max-w-md text-white/50">
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

              {/* Stats */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  { label: 'تخصص متاح', value: '40+', Icon: Target, color: 'text-blue-400' },
                  { label: 'كورس احترافي', value: '150+', Icon: BookOpen, color: 'text-emerald-400' },
                  { label: 'كوتش خبير', value: '50+', Icon: Users, color: 'text-purple-400' },
                ].map(({ label, value, Icon, color }) => (
                  <div
                    key={label}
                    className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-center transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
                  >
                    <Icon className={`mx-auto mb-2 h-6 w-6 ${color} transition-transform group-hover:scale-110`} />
                    <div className="text-2xl font-extrabold text-white">{value}</div>
                    <div className="text-sm text-white/40">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* STATE B: Path selected */
            <div className="space-y-6">
              {/* Selected path card */}
              <div className="rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-6">
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
                      <h2 className="mt-1 text-xl font-extrabold text-white">
                        {myPath.pathTitle}
                      </h2>
                      {selectedPathEntry && (
                        <p className="mt-0.5 text-sm text-white/45">
                          {selectedPathEntry.titleAr}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-white/30">
                        تم الاختيار في{' '}
                        {new Date(myPath.createdAt).toLocaleDateString('ar-SA', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </p>

                      {selectedPathEntry && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            (DEMAND_STYLES[selectedPathEntry.demand]?.bg ?? '') + ' ' +
                            (DEMAND_STYLES[selectedPathEntry.demand]?.text ?? '')
                          }`}>
                            {DEMAND_AR[selectedPathEntry.demand] ?? selectedPathEntry.demand}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs text-white/50">
                            {selectedPathEntry.level}
                          </span>
                          <span className="text-xs text-white/30 self-center">
                            💰 {selectedPathEntry.salary} SAR
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="shrink-0 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/50 transition hover:bg-white/[0.08] hover:text-white/80"
                  >
                    تغيير المسار
                  </button>
                </div>
              </div>

              {/* Career-related coaching */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-10 text-center">
                <BookOpen className="mx-auto mb-4 h-12 w-12 text-white/20" />
                <h3 className="text-lg font-bold text-white/70">الكورسات المتاحة قريباً</h3>
                <p className="mt-2 text-sm text-white/35 max-w-md mx-auto">
                  سيتم إضافة الكورسات المتخصصة لـ <span className="text-primary font-semibold">{myPath.pathTitle}</span> خلال الأيام القادمة
                </p>
                <Link
                  href={`/${locale}/coaching?speciality=${encodeURIComponent(myPath.pathTitle)}`}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:shadow-primary/40"
                >
                  <Users className="h-4 w-4" />
                  احجز جلسة كوتشينج الآن
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Modal */}
        {modalOpen && (
          <PathModal
            onClose={() => setModalOpen(false)}
            currentPathId={myPath?.pathId}
            onSelect={handleSelect}
            isSaving={savePath.isPending}
            savingPathId={savingPathId}
          />
        )}
      </DashboardShell>
    </AuthGate>
  )
}