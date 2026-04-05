'use client'

import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, post } from '../../../../lib/api'
import { AuthGate } from '../../../components/AuthGate'
import { DashboardShell } from '../../../components/DashboardShell'
import { CAREER_PATHS, findPathByTitle } from '../../../../lib/career-paths'
import {
  Search, Target, ChevronLeft, Check, X,
  Compass, Sparkles, BookOpen, Users,
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

// ─── Color maps ───────────────────────────────────────────────────────────────

const COLOR_CARDS: Record<string, string> = {
  blue:     'border-blue-500/30 bg-blue-500/5 hover:border-blue-500/60 hover:bg-blue-500/10',
  red:      'border-red-500/30 bg-red-500/5 hover:border-red-500/60 hover:bg-red-500/10',
  green:    'border-green-500/30 bg-green-500/5 hover:border-green-500/60 hover:bg-green-500/10',
  purple:   'border-purple-500/30 bg-purple-500/5 hover:border-purple-500/60 hover:bg-purple-500/10',
  pink:     'border-pink-500/30 bg-pink-500/5 hover:border-pink-500/60 hover:bg-pink-500/10',
  amber:    'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60 hover:bg-amber-500/10',
  orange:   'border-orange-500/30 bg-orange-500/5 hover:border-orange-500/60 hover:bg-orange-500/10',
  gradient: 'border-primary/30 bg-primary/5 hover:border-primary/60 hover:bg-primary/10',
}

const DEMAND_COLORS: Record<string, string> = {
  'Very High': 'bg-green-500/20 text-green-600 border border-green-500/30 dark:text-green-400',
  'High':      'bg-blue-500/20 text-blue-600 border border-blue-500/30 dark:text-blue-400',
  'Medium':    'bg-gray-500/20 text-gray-600 border border-gray-500/30 dark:text-gray-400',
}

// ─── Demand label in Arabic ───────────────────────────────────────────────────

const DEMAND_AR: Record<string, string> = {
  'Very High': 'طلب عالي جداً',
  'High':      'طلب عالي',
  'Medium':    'طلب متوسط',
}

// ─── Category color for selected card ─────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  blue:     { bg: 'bg-blue-100 dark:bg-blue-900/30',   border: 'border-blue-300 dark:border-blue-700',   text: 'text-blue-700 dark:text-blue-300' },
  red:      { bg: 'bg-red-100 dark:bg-red-900/30',     border: 'border-red-300 dark:border-red-700',     text: 'text-red-700 dark:text-red-300' },
  green:    { bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-300 dark:border-green-700', text: 'text-green-700 dark:text-green-300' },
  purple:   { bg: 'bg-purple-100 dark:bg-purple-900/30',border: 'border-purple-300 dark:border-purple-700',text: 'text-purple-700 dark:text-purple-300' },
  pink:     { bg: 'bg-pink-100 dark:bg-pink-900/30',   border: 'border-pink-300 dark:border-pink-700',   text: 'text-pink-700 dark:text-pink-300' },
  amber:    { bg: 'bg-amber-100 dark:bg-amber-900/30', border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-700 dark:text-amber-300' },
  orange:   { bg: 'bg-orange-100 dark:bg-orange-900/30',border: 'border-orange-300 dark:border-orange-700',text: 'text-orange-700 dark:text-orange-300' },
  gradient: { bg: 'bg-primary/10',                     border: 'border-primary/40',                      text: 'text-primary' },
}

// ─── Path Selection Modal ─────────────────────────────────────────────────────

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const base = q
      ? CAREER_PATHS.map((cat) => ({
          ...cat,
          paths: cat.paths.filter(
            (p) =>
              p.title.toLowerCase().includes(q) ||
              p.titleAr.includes(q),
          ),
        })).filter((cat) => cat.paths.length > 0)
      : CAREER_PATHS

    return activeCategory ? base.filter((c) => c.category === activeCategory) : base
  }, [search, activeCategory])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative z-10 flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-2xl"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[color:var(--border)] px-6 py-5">
          <div>
            <h2 className="text-2xl font-bold font-madinet text-foreground">
              اختر مسارك المهني
            </h2>
            <p className="mt-0.5 text-sm text-[color:var(--muted)]">
              اختر التخصص الذي يناسب أهدافك وطموحاتك
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[color:var(--muted)] transition hover:bg-[color:var(--surface-2)] hover:text-foreground"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search + Category Filter */}
        <div className="space-y-3 border-b border-[color:var(--border)] px-6 py-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
            <input
              type="text"
              placeholder="ابحث عن تخصص..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] py-2.5 pr-10 pl-4 text-sm text-foreground placeholder:text-[color:var(--muted)] focus:border-primary focus:outline-none"
              autoFocus
            />
          </div>

          {/* Category pills — RTL scroll */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                !activeCategory
                  ? 'bg-primary text-white'
                  : 'bg-[color:var(--surface-2)] text-[color:var(--muted)] hover:bg-[color:var(--border)]'
              }`}
            >
              الكل
            </button>
            {CAREER_PATHS.map((cat) => (
              <button
                key={cat.category}
                type="button"
                onClick={() =>
                  setActiveCategory(activeCategory === cat.category ? null : cat.category)
                }
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  activeCategory === cat.category
                    ? 'bg-primary text-white'
                    : 'bg-[color:var(--surface-2)] text-[color:var(--muted)] hover:bg-[color:var(--border)]'
                }`}
              >
                {cat.emoji} {cat.category.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Paths — scrollable */}
        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-5">
          {filtered.map((cat) => (
            <div key={cat.category}>
              {/* Category header */}
              <div className="mb-3 flex items-center gap-3">
                <span className="text-2xl">{cat.emoji}</span>
                <div>
                  <h3 className="font-bold text-foreground">{cat.category}</h3>
                  <span className="text-xs text-[color:var(--muted)]">{cat.paths.length} تخصص</span>
                </div>
              </div>

              {/* Path cards grid */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {cat.paths.map((path) => {
                  const isSelected = currentPathId === path.id
                  const isSavingThis = isSaving && savingPathId === path.id
                  const cardColor = COLOR_CARDS[cat.color] ?? COLOR_CARDS.blue
                  const demandColor = DEMAND_COLORS[path.demand] ?? DEMAND_COLORS.Medium

                  return (
                    <button
                      key={path.id}
                      type="button"
                      disabled={isSaving}
                      onClick={() => onSelect(path.id, path.title, cat.category)}
                      className={`group relative rounded-2xl border p-4 text-right transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
                        isSelected
                          ? 'border-primary bg-primary/15 shadow-md shadow-primary/20'
                          : cardColor
                      }`}
                    >
                      {/* Selected checkmark */}
                      {isSelected && !isSavingThis && (
                        <div className="absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                          <Check className="h-3.5 w-3.5 text-white" />
                        </div>
                      )}

                      {/* Saving spinner */}
                      {isSavingThis && (
                        <div className="absolute left-3 top-3 h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      )}

                      {/* Path info */}
                      <h4 className="font-bold text-foreground text-sm leading-snug">{path.title}</h4>
                      <p className="mt-0.5 text-xs text-[color:var(--muted)]">{path.titleAr}</p>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${demandColor}`}>
                          {DEMAND_AR[path.demand] ?? path.demand}
                        </span>
                        <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)] px-2 py-0.5 text-xs text-[color:var(--muted)]">
                          {path.level}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-[color:var(--muted)]">
                        💰 <span className="font-semibold text-foreground">{path.salary}</span> SAR
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-16 text-center text-[color:var(--muted)]">
              <Search className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <p>لا توجد نتائج لـ &ldquo;{search}&rdquo;</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[color:var(--border)] px-6 py-3 text-center">
          <p className="text-xs text-[color:var(--muted)]">
            يمكنك تغيير مسارك في أي وقت من صفحة المسار المهني
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function DashboardCareerPathPage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [savingPathId, setSavingPathId] = useState<string | null>(null)

  // ── Fetch current path ────────────────────────────────────────────────────

  const { data: myPath, isLoading } = useQuery<SavedCareerPath | null>({
    queryKey: ['my-career-path'],
    queryFn: async () => {
      const res = await get<{ success: boolean; data: { path: SavedCareerPath | null } }>('/career/my-path')
      return res.data.data.path ?? null
    },
  })

  // ── Fetch AI history (for recommendation badge) ───────────────────────────

  const { data: sessions } = useQuery<HistorySession[]>({
    queryKey: ['ai-assessment-history-career'],
    queryFn: async () => {
      const res = await get<{ success: boolean; data: { sessions: HistorySession[] } }>(
        '/career/assessment/session/history',
      )
      return res.data.data.sessions ?? []
    },
  })

  const latestAiTitle = sessions
    ?.find((s) => s.status === 'COMPLETED' && s.report?.topSpecializations?.length)
    ?.report?.topSpecializations?.[0]?.titleEn

  const aiRecommendedPathId = latestAiTitle ? findPathByTitle(latestAiTitle)?.path.id : undefined

  // ── Save path mutation ────────────────────────────────────────────────────

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

  // ── Find category info for selected path ──────────────────────────────────

  const selectedCatEntry = myPath
    ? CAREER_PATHS.find((c) => c.category === myPath.pathCategory)
    : null
  const selectedPathEntry = selectedCatEntry?.paths.find((p) => p.id === myPath?.pathId)
  const catColors = CATEGORY_COLORS[selectedCatEntry?.color ?? 'blue'] ?? CATEGORY_COLORS.blue

  // ── Loading skeleton ──────────────────────────────────────────────────────

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
          {/* ── STATE A: No path selected ─────────────────────────────────── */}
          {!myPath ? (
            <div className="space-y-6">
              {/* Hero card */}
              <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-[color:var(--surface-2)] p-10 text-center">
                <div className="relative">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20">
                    <Compass className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="mb-3 text-2xl font-bold font-madinet text-foreground">
                    لم تختر مسارك المهني بعد
                  </h2>
                  <p className="mb-8 mx-auto max-w-md text-[color:var(--muted)]">
                    اختر تخصصك المهني لنعرض لك الكورسات المناسبة وخطة التعلم المخصصة
                  </p>
                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 text-base font-bold text-white shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:bg-primary/90"
                  >
                    <Target className="h-5 w-5" />
                    اختر مسارك المهني
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  { label: 'تخصص متاح', value: '40+', Icon: Target },
                  { label: 'كورس احترافي', value: '150+', Icon: BookOpen },
                  { label: 'كوتش خبير', value: '50+', Icon: Users },
                ].map(({ label, value, Icon }) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 text-center shadow-sm"
                  >
                    <Icon className="mx-auto mb-2 h-6 w-6 text-primary" />
                    <div className="text-2xl font-extrabold text-foreground">{value}</div>
                    <div className="text-sm text-[color:var(--muted)]">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ── STATE B: Path selected ────────────────────────────────────── */
            <div className="space-y-6">
              {/* Selected path card */}
              <div
                className={`rounded-3xl border-2 p-6 shadow-sm ${catColors.border} ${catColors.bg}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/20 text-2xl">
                      {selectedCatEntry?.emoji ?? '🎯'}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-xs font-semibold ${catColors.text}`}>
                          {myPath.pathCategory}
                        </span>
                        {myPath.aiRecommended && (
                          <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                            <Sparkles className="h-3 w-3" />
                            توصية AI
                          </span>
                        )}
                      </div>
                      <h2 className="mt-1 text-xl font-extrabold text-foreground">
                        {myPath.pathTitle}
                      </h2>
                      {selectedPathEntry && (
                        <p className="mt-0.5 text-sm text-[color:var(--muted)]">
                          {selectedPathEntry.titleAr}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-[color:var(--muted)]">
                        تم الاختيار في{' '}
                        {new Date(myPath.createdAt).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>

                      {selectedPathEntry && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              DEMAND_COLORS[selectedPathEntry.demand] ?? ''
                            }`}
                          >
                            {DEMAND_AR[selectedPathEntry.demand] ?? selectedPathEntry.demand}
                          </span>
                          <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-0.5 text-xs text-[color:var(--muted)]">
                            {selectedPathEntry.level}
                          </span>
                          <span className="text-xs text-[color:var(--muted)] self-center">
                            💰 {selectedPathEntry.salary} SAR
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="shrink-0 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm text-[color:var(--muted)] transition hover:bg-[color:var(--surface-2)] hover:text-foreground"
                  >
                    تغيير المسار
                  </button>
                </div>
              </div>

              {/* Courses placeholder */}
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-8 text-center shadow-sm">
                <BookOpen className="mx-auto mb-3 h-10 w-10 text-[color:var(--muted)] opacity-40" />
                <h3 className="font-bold font-madinet text-foreground">الكورسات المتاحة</h3>
                <p className="mt-2 text-sm text-[color:var(--muted)]">
                  سيتم إضافة الكورسات قريباً لمسار {myPath.pathTitle}
                </p>
                <button
                  type="button"
                  className="mt-5 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition"
                >
                  احجز جلسة كوتشينج
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Modal ─────────────────────────────────────────────────────────── */}
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
