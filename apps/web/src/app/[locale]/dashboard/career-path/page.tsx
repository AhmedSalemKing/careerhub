'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useTheme } from 'next-themes'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import {
  Sparkles, Plus, CheckCircle2, BookOpen, BarChart3,
  ChevronRight, Target, Briefcase, RefreshCw, X,
  Code2, Palette, TrendingUp, Shield, Settings, Package,
  BarChart, Users, Award
} from 'lucide-react'
import { CAREER_PATHS } from '../../../../lib/career-paths'
import { learnUrl } from '../../../../lib/constants'
import ConfirmModal from '@/components/ConfirmModal'
import toast from 'react-hot-toast'

const PATH_KEYWORDS: Record<string, string[]> = {
  'سيبراني': ['سيبر', 'اختراق', 'أمن', 'شبكات', 'حماية', 'cyber', 'security', 'pentest', 'network', 'ethical hacking', 'vulnerability', 'forensics', 'malware', 'SIEM', 'SOC', 'firewall', 'encryption', 'cryptography'],
  'اختراق': ['اختراق', 'سيبر', 'أمن', 'هاكر', 'pentest', 'security', 'ethical', 'burp', 'metasploit', 'kali', 'nmap', 'OWASP', 'CTF', 'exploit', 'vulnerability'],
  'محلل أمن': ['SIEM', 'SOC', 'threat', 'incident', 'log analysis', 'security operations', 'تهديدات', 'تحليل أمني', 'استجابة'],
  'شبكات': ['شبكات', 'network', 'cisco', 'routing', 'switching', 'TCP/IP', 'LAN', 'WAN', 'VPN', 'firewall', 'IDS', 'IPS', 'packet', 'wireshark'],
  'برمجيات': ['برمجة', 'تطوير', 'javascript', 'python', 'react', 'backend', 'frontend', 'fullstack', 'software', 'coding', 'programming', 'java', 'typescript', 'algorithms', 'data structures'],
  'واجهات': ['واجهة', 'frontend', 'react', 'html', 'css', 'javascript', 'UI', 'vue', 'angular', 'responsive', 'tailwind', 'bootstrap'],
  'خلفيات': ['backend', 'node', 'python', 'api', 'database', 'sql', 'REST', 'GraphQL', 'microservices', 'server', 'django', 'fastapi', 'nestjs', 'express'],
  'متكامل': ['fullstack', 'full stack', 'frontend', 'backend', 'javascript', 'react', 'node', 'database', 'api', 'typescript'],
  'موبايل': ['mobile', 'flutter', 'react native', 'ios', 'android', 'dart', 'swift', 'kotlin', 'تطبيق', 'موبايل'],
  'ألعاب': ['game', 'unity', 'unreal', 'C#', 'C++', '3D', 'gaming', 'ألعاب', 'game development'],
  'بيانات': ['بيانات', 'data', 'python', 'machine learning', 'sql', 'analytics', 'تعلم آلي', 'pandas', 'numpy', 'statistics', 'tableau', 'powerbi', 'excel', 'R'],
  'عالم بيانات': ['data science', 'machine learning', 'deep learning', 'python', 'tensorflow', 'pytorch', 'neural network', 'NLP', 'computer vision'],
  'تعلم آلي': ['machine learning', 'deep learning', 'AI', 'python', 'tensorflow', 'pytorch', 'scikit', 'neural', 'NLP', 'computer vision', 'MLOps'],
  'ذكاء': ['ذكاء', 'ai', 'artificial intelligence', 'machine learning', 'deep learning', 'llm', 'python', 'LLMs', 'prompt engineering', 'vector', 'generative', 'chatbot'],
  'تصميم': ['تصميم', 'design', 'ui', 'ux', 'figma', 'photoshop', 'illustrator', 'adobe', 'graphic', 'visual', 'prototype', 'wireframe', 'typography', 'color theory'],
  'تجربة مستخدم': ['UX', 'user experience', 'user research', 'usability', 'wireframe', 'prototype', 'figma', 'accessibility', 'تجربة مستخدم'],
  'موشن': ['motion', 'animation', 'after effects', 'cinema 4D', 'animate', 'رسوم متحركة', 'موشن جرافيك'],
  'تسويق': ['تسويق', 'marketing', 'seo', 'sem', 'ads', 'social media', 'google ads', 'meta ads', 'content', 'email marketing', 'analytics', 'conversion'],
  'محتوى': ['content', 'copywriting', 'SEO', 'blog', 'محتوى', 'كتابة', 'social media', 'content strategy'],
  'سحابي': ['cloud', 'aws', 'azure', 'gcp', 'terraform', 'kubernetes', 'docker', 'serverless', 'infrastructure'],
  'devops': ['devops', 'docker', 'kubernetes', 'ci/cd', 'linux', 'cloud', 'ansible', 'jenkins', 'github actions', 'terraform', 'monitoring'],
  'موثوقية': ['SRE', 'reliability', 'monitoring', 'observability', 'incident', 'automation', 'linux', 'cloud', 'prometheus', 'grafana'],
  'ذكاء أعمال': ['BI', 'business intelligence', 'tableau', 'powerbi', 'sql', 'data modeling', 'reporting', 'dashboard'],
  'أعمال': ['business', 'management', 'strategy', 'leadership', 'MBA', 'project management', 'agile', 'scrum', 'إدارة', 'أعمال'],
  'منتج': ['product', 'product management', 'agile', 'scrum', 'roadmap', 'user stories', 'backlog', 'stakeholder', 'إدارة منتج'],
  'مشاريع': ['project management', 'PMP', 'agile', 'scrum', 'kanban', 'risk management', 'إدارة مشاريع', 'تخطيط'],
  'مستشار': ['consulting', 'architecture', 'system design', 'enterprise', 'استشارات', 'هندسة أنظمة'],
  'تقني': ['technical', 'product', 'engineering', 'system design', 'architecture', 'agile', 'technology'],
}

type TabKey = 'paths' | 'assessment' | 'courses'

type AssessmentResult = {
  track: string
  score: number
  normalized: number
  titleAr: string
  titleEn: string
}

export default function CareerPathPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState<TabKey>('paths')
const [selectedPaths, setSelectedPaths] = useState<string[]>([])
const PATHS_CACHE_KEY = 'deveway_my_path_ids'
const [myPathIds, setMyPathIds] = useState<Set<string>>(() => {
  if (typeof window === 'undefined') return new Set()
  try {
    const cached = localStorage.getItem(PATHS_CACHE_KEY)
    if (cached) return new Set(JSON.parse(cached))
  } catch {}
  return new Set()
})
const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([])
const [allPaths, setAllPaths] = useState<any[]>([])
const [allCourses, setAllCourses] = useState<any[]>([])
const [coursesLoading, setCoursesLoading] = useState(false)
const [bundles, setBundles] = useState<any[]>([])
const [_bundlesLoading, setBundlesLoading] = useState(false)
const [busyPaths, setBusyPaths] = useState<Set<string>>(new Set())
  const fetchSeqRef = useRef(0)
const MAX_PATHS = 5

const [confirmModal, setConfirmModal] = useState<{
  isOpen: boolean; title: string; message: string;
  onConfirm: () => void; destructive?: boolean;
}>({ isOpen: false, title: '', message: '', onConfirm: () => {} })
  
  const bg = isDark ? '#0d0d0d' : '#fafafa'
  const cardBg = isDark ? '#111111' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.07)' : '#e5e7eb'
  const text = isDark ? '#f1f5f9' : '#0d0d0d'
  const subtext = isDark ? '#94a3b8' : '#6b7280'

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://deve-way.onrender.com/api'
  const getToken = () =>
    typeof window !== 'undefined'
      ? localStorage.getItem('deveway_token')
        || localStorage.getItem('careerhub_token')
        || localStorage.getItem('token')
        || sessionStorage.getItem('token')
        || ''
      : ''

  useEffect(() => {
    try {
      const savedPaths = localStorage.getItem('selectedCareerPaths')
      const savedResults = localStorage.getItem('assessmentResults')
      if (savedPaths) setSelectedPaths(JSON.parse(savedPaths))
      if (savedResults) setAssessmentResults(JSON.parse(savedResults))
      else if (!savedResults) setActiveTab('assessment')
    } catch(e) {}
  }, [])

  useEffect(() => {
    fetch(`${apiUrl}/career/paths`)
      .then(r => r.json())
      .then(data => {
        const arr = data?.data?.careerPaths ?? data?.data ?? data ?? []
        const paths = Array.isArray(arr) ? arr : []
        console.log('[CareerPath] allPaths loaded:', paths.length, paths[0])
        setAllPaths(paths)
      })
      .catch(() => {})
  }, [])

  // Persist myPathIds to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(PATHS_CACHE_KEY, JSON.stringify(Array.from(myPathIds)))
    } catch {}
  }, [myPathIds])

  // Server is source of truth — cache is for instant display only
  const fetchMyPaths = useCallback(async () => {
    const token = getToken()
    if (!token) return
    const seq = ++fetchSeqRef.current
    try {
      const res = await fetch(`${apiUrl}/career/paths/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      const paths = data?.data?.paths ?? data?.data ?? []
      if (Array.isArray(paths)) {
        const serverIds = new Set<string>(
          paths.map((p: any) => p.careerPathId ?? p.pathId ?? p.id).filter(Boolean)
        )
        if (seq !== fetchSeqRef.current) return
        setMyPathIds(serverIds)
        localStorage.setItem(PATHS_CACHE_KEY, JSON.stringify(Array.from(serverIds)))
      }
    } catch (e) {
      console.error('[fetchMyPaths] error:', e)
    }
  }, [apiUrl])

  useEffect(() => {
    fetchMyPaths()
  }, [fetchMyPaths])

  useEffect(() => {
    setCoursesLoading(true)
    const token = getToken()

    fetch(`${apiUrl}/courses?page=1&limit=100&language=${locale === 'ar' ? 'ar' : 'en'}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then(r => r.json())
      .then(data => {
        const arr = data?.data?.courses ?? data?.data ?? data ?? []
        setAllCourses(Array.isArray(arr) ? arr : [])
      })
      .catch(e => {
        console.error('[Courses error]', e)
        setAllCourses([])
      })
      .finally(() => setCoursesLoading(false))
  }, [apiUrl, locale])

  useEffect(() => {
    setBundlesLoading(true)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://deve-way.onrender.com/api'
    fetch(`${apiUrl}/courses/bundles`, {
      headers: { 'Content-Type': 'application/json' },
    })
      .then(r => r.json())
      .then(data => {
        const arr = data?.data?.data ?? data?.data ?? data ?? []
        setBundles(Array.isArray(arr) ? arr : [])
      })
      .catch(() => setBundles([]))
      .finally(() => setBundlesLoading(false))
  }, [])

  const isPathIdSelected = (id: string): boolean => {
    if (!id) return false
    if (myPathIds.has(id)) return true
    const p = allPaths.find(x => x.id === id || x.slug === id)
    return !!p && (myPathIds.has(p.id) || myPathIds.has(p.slug))
  }

  const isPathSelected = (p: any) => isPathIdSelected(p?.id)

  const collectPathKeywords = (): string[] => {
    if (myPathIds.size === 0) return []
    const selected = allPaths.filter(p => isPathIdSelected(p?.id))
    const keywords = new Set<string>()

    const addKeyWords = (kws: string[]) => {
      kws.forEach(k => keywords.add(String(k).toLowerCase()))
    }
    const collectForKey = (name: string) => {
      const lowerName = name.toLowerCase()
      for (const [key, kws] of Object.entries(PATH_KEYWORDS)) {
        const lowerKey = key.toLowerCase()
        if (lowerName.includes(lowerKey) || lowerKey.includes(lowerName)) {
          addKeyWords(kws)
        }
      }
    }

    for (const path of selected) {
      const names = [path.titleAr, path.titleEn, path.title, path.slug]
        .filter(Boolean)
        .map(n => String(n).toLowerCase())

      // Primary: path name contains a keyword key (or key contains part of the name)
      names.forEach(name => collectForKey(name))

      // Fallback: token overlap between path name words and keyword values
      for (const name of names) {
        const tokens = new Set<string>(
          name.split(/[^a-zA-Z0-9\u0600-\u06FF]+/).filter(t => t.length >= 2)
        )
        for (const kws of Object.values(PATH_KEYWORDS)) {
          for (const kw of kws) {
            const kwTokens = String(kw).toLowerCase().split(/[^a-zA-Z0-9\u0600-\u06FF]+/).filter(t => t.length >= 2)
            if (kwTokens.some(t => tokens.has(t))) addKeyWords(kws)
          }
        }
      }
    }

    return Array.from(keywords)
  }

  const courses = useMemo(() => {
    const keywords = collectPathKeywords()
    if (keywords.length === 0 || allCourses.length === 0) return []
    return allCourses.filter(course => {
      const haystack = [
        course.title, course.description,
        course.category, course.titleEn, course.titleAr,
        course.descriptionEn, course.descriptionAr,
      ].filter(Boolean).map(String).join(' ').toLowerCase()
      return keywords.some(kw => kw.length > 0 && haystack.includes(kw))
    })
  }, [myPathIds, allPaths, allCourses])

  const removePath = async (pathId: string) => {
    console.log('[removePath] called with', pathId, 'current count:', myPathIds.size)
    if (!isPathIdSelected(pathId)) {
      console.warn('[removePath] path not selected, aborting', pathId)
      return
    }
    if (busyPaths.has(pathId)) return
    const token = getToken()

    // 1. Update UI immediately — remove from state NOW
    const target = allPaths.find(p => p?.id === pathId || p?.slug === pathId)
    const targetForms = new Set<string>([pathId, target?.id, target?.slug].filter(Boolean))
    setBusyPaths(prev => new Set(prev).add(pathId))
    setMyPathIds(prev => {
      const next = new Set(prev)
      next.delete(pathId)
      return next
    })
    setSelectedPaths(prev => {
      const next = prev.filter(p => !targetForms.has(p))
      localStorage.setItem('selectedCareerPaths', JSON.stringify(next))
      return next
    })
    try {
      const cached = JSON.parse(localStorage.getItem(PATHS_CACHE_KEY) || '[]')
      if (Array.isArray(cached)) {
        localStorage.setItem(PATHS_CACHE_KEY, JSON.stringify(cached.filter((p: string) => !targetForms.has(p))))
      }
    } catch (e) {}

    // 2. Call API in background — do NOT re-sync from server on success
    //    (a stale/uncommitted read must never resurrect the removed path)
    try {
      const res = await fetch(`${apiUrl}/career/paths/remove/${pathId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        console.error('[removePath] API returned', res.status, body)
        throw new Error(`API ${res.status}`)
      }
      console.log('[removePath] API success for', pathId)
    } catch (e: any) {
      // 3. Rollback only on a real API failure
      console.error('[removePath] API error:', e.message)
      toast.error(isAr ? 'تعذر إزالة المسار، حاول مرة أخرى' : 'Could not remove path, please try again')
      setMyPathIds(prev => {
        const next = new Set(prev)
        next.add(pathId)
        return next
      })
      setSelectedPaths(prev =>
        prev.includes(pathId) ? prev : [...prev, pathId]
      )
      try {
        const cached = JSON.parse(localStorage.getItem(PATHS_CACHE_KEY) || '[]')
        if (Array.isArray(cached) && !cached.some((p: string) => targetForms.has(p))) {
          localStorage.setItem(PATHS_CACHE_KEY, JSON.stringify([...cached, pathId]))
        }
      } catch (e) {}
    } finally {
      setBusyPaths(prev => {
        const next = new Set(prev)
        next.delete(pathId)
        return next
      })
    }
  }

  const addPath = async (pathId: string) => {
    if (isPathIdSelected(pathId)) return
    if (busyPaths.has(pathId)) return
    const token = getToken()

    if (myPathIds.size >= MAX_PATHS) {
      setConfirmModal({
        isOpen: true, title: isAr ? 'تنبيه' : 'Notice',
        message: isAr ? 'لا يمكنك اختيار أكثر من 5 مسارات.' : 'Maximum 5 paths allowed.',
        destructive: false,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
      })
      return
    }

    setBusyPaths(prev => new Set(prev).add(pathId))
    setMyPathIds(prev => new Set(prev).add(pathId))
    setSelectedPaths(prev => {
      const next = prev.includes(pathId) ? prev : [...prev, pathId]
      localStorage.setItem('selectedCareerPaths', JSON.stringify(next))
      return next
    })

    try {
      await fetch(`${apiUrl}/career/paths/add/${pathId}?source=MANUAL`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
    } catch (e: any) {
      console.error('[addPath] API error:', e.message)
      setMyPathIds(prev => {
        const next = new Set(prev)
        next.delete(pathId)
        return next
      })
      setSelectedPaths(prev => prev.filter(p => p !== pathId))
    } finally {
      setBusyPaths(prev => {
        const next = new Set(prev)
        next.delete(pathId)
        return next
      })
      fetchMyPaths()
    }
  }

  const getPathIdForResult = (field: any): string | null => {
    if (allPaths.length === 0) {
      console.warn('[GetPathId] allPaths not loaded yet')
      return null
    }

    const fieldSlug = (field.track || field.slug || field.fieldSlug || '').toLowerCase()
    const fieldTitleAr = (field.titleAr || field.title || '').trim()
    const fieldTitleEn = (field.titleEn || '').toLowerCase().trim()

    const matched = allPaths.find((p: any) => {
      const pSlug = (p.slug || '').toLowerCase()

      // 1. Direct slug match
      if (pSlug === fieldSlug) return true
      // 2. Slug contains/is-contained
      if (fieldSlug && (pSlug.includes(fieldSlug) || fieldSlug.includes(pSlug))) return true

      // 3. jobTitlesAr array — primary match for Arabic assessment results
      const jobTitlesAr: string[] = Array.isArray(p.jobTitlesAr) ? p.jobTitlesAr : []
      if (fieldTitleAr && jobTitlesAr.some(t =>
        t.includes(fieldTitleAr) || fieldTitleAr.includes(t)
      )) return true

      // 4. jobTitlesEn array
      const jobTitlesEn: string[] = Array.isArray(p.jobTitlesEn) ? p.jobTitlesEn : []
      if (fieldTitleEn && jobTitlesEn.some(t =>
        t.toLowerCase().includes(fieldTitleEn) || fieldTitleEn.includes(t.toLowerCase())
      )) return true

      // 5. descriptionAr fallback
      const pDescAr = (p.descriptionAr || '').toLowerCase()
      if (fieldTitleAr && pDescAr.includes(fieldTitleAr.toLowerCase())) return true

      return false
    })

    console.log('[GetPathId] slug:', fieldSlug, '| titleAr:', fieldTitleAr,
      '| allPaths:', allPaths.length,
      '| matched:', matched?.id, matched?.slug, matched?.jobTitlesAr?.[0])

    return matched?.id ?? null
  }

  const handleAddAssessmentPath = async (field: any) => {
    const pathId = getPathIdForResult(field)
    if (!pathId) {
      console.warn('[AddPath] No DB path found for field:', field.titleAr, field.track)
      return
    }
    await addPath(pathId)
  }

  const TABS = [
    { key: 'paths' as TabKey, labelAr: 'مساراتي المهنية', labelEn: 'My Career Paths', icon: <Target size={15} /> },
    { key: 'assessment' as TabKey, labelAr: 'الاختبار الذكي', labelEn: 'Smart Assessment', icon: <Sparkles size={15} /> },
    { key: 'courses' as TabKey, labelAr: 'الكورسات المقترحة', labelEn: 'Recommended Courses', icon: <BookOpen size={15} /> },
  ]

  const ICON_MAP: Record<string, any> = {
    code: Code2, design: Palette, marketing: TrendingUp,
    data: BarChart, security: Shield, devops: Settings,
    product: Package, business: Briefcase, creative: Users,
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, direction: isAr ? 'rtl' : 'ltr' }}>
      <div style={{ padding: '28px 24px 0', borderBottom: `1px solid ${border}`, background: cardBg }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ color: text, fontSize: 22, fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              {isAr ? 'المسار المهني' : 'Career Path'}
            </h1>
            <p style={{ color: subtext, fontSize: 13, margin: 0 }}>
              {isAr ? 'اكتشف مسارك احفظ تقدمك واستكشف الكورسات المناسبة' : 'Discover your path, save progress, and explore matching courses'}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: 0 }}>
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700,
                color: activeTab === tab.key ? '#5120c8' : subtext,
                borderBottom: `2px solid ${activeTab === tab.key ? '#5120c8' : 'transparent'}`,
                transition: 'all 0.15s',
                marginBottom: -1,
              }}>
                {tab.icon}
                {isAr ? tab.labelAr : tab.labelEn}
                {tab.key === 'paths' && myPathIds.size > 0 && (
                  <span style={{ padding: '1px 6px', borderRadius: 10, fontSize: 10, fontWeight: 800, background: '#5120c8', color: '#ffffff' }}>
                    {myPathIds.size}
                  </span>
                )}
                {tab.key === 'assessment' && assessmentResults.length > 0 && (
                  <CheckCircle2 size={13} color="#16a34a" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>
        {activeTab === 'paths' && (
          <div>
            {assessmentResults.length > 0 && (
              <div style={{
                padding: '16px 20px', borderRadius: 14, marginBottom: 24,
                border: '1px solid rgba(81,32,200,0.2)',
                background: isDark ? 'rgba(81,32,200,0.06)' : 'rgba(81,32,200,0.03)',
                display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(81,32,200,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BarChart3 size={18} color="#5120c8" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: text, fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
                    {isAr ? 'نتيجة الاختبار الذكي' : 'Smart Assessment Result'}
                  </div>
                  <div style={{ color: subtext, fontSize: 12 }}>
                    {isAr ? `المسار الأنسب: ${assessmentResults[0]?.titleAr} (${assessmentResults[0]?.normalized}%)` : `Best match: ${assessmentResults[0]?.titleEn} (${assessmentResults[0]?.normalized}%)`}
                  </div>
                </div>
                <button onClick={() => setActiveTab('assessment')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(81,32,200,0.3)', background: 'transparent', color: '#5120c8', fontSize: 12, fontWeight: 700 }}>
                  <RefreshCw size={12} />
                  {isAr ? 'أعد الاختبار' : 'Retake'}
                </button>
              </div>
            )}

            {myPathIds.size > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ color: text, fontSize: 15, fontWeight: 800, margin: 0 }}>{isAr ? 'مساراتي المختارة' : 'My Selected Paths'}</h3>
                  <span style={{ color: subtext, fontSize: 12 }}>{myPathIds.size} / {MAX_PATHS} {isAr ? 'مسارات' : 'paths'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {allPaths.filter(p => isPathSelected(p)).map(path => {
                    const IconComp = ICON_MAP[(path as any).icon] || Briefcase
                    return (
                      <div key={path.id} style={{ padding: '16px 20px', borderRadius: 14, border: '1.5px solid rgba(81,32,200,0.3)', background: isDark ? 'rgba(81,32,200,0.06)' : 'rgba(81,32,200,0.02)', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: 'rgba(81,32,200,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IconComp size={18} color="#5120c8" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: text, fontSize: 14, fontWeight: 700 }}>{isAr ? path.titleAr : path.titleEn}</div>
                          <div style={{ color: subtext, fontSize: 12, marginTop: 2 }}>{isAr ? 'مسار مهني' : 'Career path'}</div>
                        </div>
                        <button onClick={() => setActiveTab('courses')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, background: '#5120c8', color: '#ffffff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                          <BookOpen size={12} />
                          {isAr ? 'كورسات' : 'Courses'}
                        </button>
                        <button onClick={() => removePath(path.id)} disabled={busyPaths.has(path.id)} style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, border: `1px solid ${border}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: subtext }}>
                          <X size={14} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {myPathIds.size === 0 && (
              <div style={{ padding: '28px 20px', borderRadius: 14, border: `1px dashed ${border}`, background: cardBg, textAlign: 'center', marginBottom: 24 }}>
                <Target size={20} color={subtext} style={{ marginBottom: 8 }} />
                <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: 0 }}>
                  {isAr ? 'لم تختر أي مسار مهني بعد' : 'No career path selected yet'}
                </p>
                <p style={{ color: subtext, fontSize: 12, margin: '4px 0 0' }}>
                  {isAr ? 'اختر مساراً من القائمة أدناه لبدء رحلتك' : 'Choose a path from the list below to start your journey'}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ color: text, fontSize: 15, fontWeight: 800, margin: 0 }}>{isAr ? 'استكشف المسارات' : 'Explore Paths'}</h3>
              {myPathIds.size < MAX_PATHS && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: subtext, fontSize: 12 }}>
                  <Plus size={13} />
                  {isAr ? `يمكنك إضافة ${MAX_PATHS - myPathIds.size} مسارات أخرى` : `You can add ${MAX_PATHS - myPathIds.size} more paths`}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {allPaths.slice(0, 30).map((path: any) => {
                const IconComp = ICON_MAP[path.icon] || Briefcase
                const dbId = path.id
                const isSelected = isPathSelected(path)
                return (
                  <div key={dbId} style={{
                    padding: '18px', borderRadius: 14,
                    border: `1.5px solid ${isSelected ? 'rgba(81,32,200,0.4)' : border}`,
                    background: isSelected ? (isDark ? 'rgba(81,32,200,0.08)' : 'rgba(81,32,200,0.03)') : cardBg,
                    cursor: 'pointer', transition: 'all 0.15s', display: 'flex', flexDirection: 'column', gap: 10, position: 'relative',
                  }}
                  onClick={() => isPathIdSelected(dbId) ? removePath(dbId) : addPath(dbId)}>
                    {isSelected && (
                      <div style={{ position: 'absolute', top: 12, left: isAr ? 12 : 'auto', right: isAr ? 'auto' : 12 }}>
                        <CheckCircle2 size={18} color="#5120c8" />
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: isSelected ? 'rgba(81,32,200,0.12)' : (isDark ? 'rgba(255,255,255,0.05)' : '#f4f4f8'), border: `1px solid ${isSelected ? 'rgba(81,32,200,0.2)' : border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <IconComp size={16} color={isSelected ? '#5120c8' : subtext} />
                      </div>
                      <h4 style={{ color: text, fontSize: 13, fontWeight: 800, margin: 0, lineHeight: 1.3 }}>{isAr ? path.titleAr : path.titleEn}</h4>
                    </div>
                    <p style={{ color: subtext, fontSize: 12, margin: 0, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{isAr ? path.descriptionAr : path.descriptionEn}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#5120c8', fontSize: 12, fontWeight: 700 }}>
                        {isAr ? 'مسار مهني' : 'Career path'}
                      </span>
                      <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: isSelected ? 'rgba(81,32,200,0.1)' : (isDark ? 'rgba(255,255,255,0.05)' : '#f4f4f8'), color: isSelected ? '#5120c8' : subtext, border: `1px solid ${isSelected ? 'rgba(81,32,200,0.2)' : border}` }}>
                        {isSelected ? (isAr ? 'تم الاختيار' : 'Selected') : (isAr ? 'اختر' : 'Select')}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button onClick={() => router.push(`/${locale}/careers`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, cursor: 'pointer', border: `1px solid ${border}`, background: 'transparent', color: subtext, fontSize: 13, fontWeight: 600 }}>
                {isAr ? `عرض جميع المسارات (${CAREER_PATHS.length}+)` : `View All Paths (${CAREER_PATHS.length}+)`}
                <ChevronRight size={14} style={{ transform: isAr ? 'rotate(180deg)' : 'none' }} />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'assessment' && (
          <div>
            {assessmentResults.length > 0 ? (
              <div>
                <div style={{ padding: '20px', borderRadius: 14, marginBottom: 24, border: '1px solid rgba(22,163,74,0.2)', background: isDark ? 'rgba(22,163,74,0.06)' : 'rgba(22,163,74,0.03)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <CheckCircle2 size={20} color="#16a34a" />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: text, fontSize: 14, fontWeight: 700 }}>{isAr ? 'لديك نتيجة محفوظة' : 'You have a saved result'}</div>
                    <div style={{ color: subtext, fontSize: 12, marginTop: 2 }}>{isAr ? 'يمكنك إعادة الاختبار في أي وقت للحصول على نتيجة أحدث' : 'You can retake the assessment anytime for a newer result'}</div>
                  </div>
                </div>
                
                <h3 style={{ color: text, fontSize: 15, fontWeight: 800, marginBottom: 16 }}>{isAr ? 'نتائج آخر اختبار' : 'Last Assessment Results'}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                  {allPaths.length === 0 && (
                    <p style={{ color: subtext, fontSize: 13, margin: '0 0 8px' }}>
                      {isAr ? 'جاري تحميل المسارات...' : 'Loading paths...'}
                    </p>
                  )}
                  {assessmentResults.slice(0, 5).map((result, idx) => {
                      const resolvedPathId = getPathIdForResult(result)
                      const pathAlreadyAdded = resolvedPathId ? isPathIdSelected(resolvedPathId) : false
                      const pathBusy = resolvedPathId ? busyPaths.has(resolvedPathId) : false
                      return (
                        <div key={idx} style={{ padding: '16px 20px', borderRadius: 12, border: `1.5px solid ${idx === 0 ? 'rgba(81,32,200,0.3)' : border}`, background: idx === 0 ? (isDark ? 'rgba(81,32,200,0.06)' : 'rgba(81,32,200,0.02)') : cardBg, display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: idx === 0 ? '#5120c8' : (isDark ? 'rgba(255,255,255,0.06)' : '#f4f4f8'), display: 'flex', alignItems: 'center', justifyContent: 'center', color: idx === 0 ? '#ffffff' : subtext, fontSize: 13, fontWeight: 800 }}>{idx + 1}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: text, fontSize: 14, fontWeight: 700 }}>{isAr ? result.titleAr : result.titleEn}</div>
                            <div style={{ marginTop: 6, height: 4, background: isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ width: `${result.normalized}%`, height: '100%', background: idx === 0 ? '#5120c8' : '#94a3b8', borderRadius: 2 }} />
                            </div>
                          </div>
                          <span style={{ color: idx === 0 ? '#5120c8' : subtext, fontSize: 14, fontWeight: 800 }}>{result.normalized}%</span>
                          <button disabled={pathBusy} onClick={() => handleAddAssessmentPath(result)} style={{ padding: '6px 12px', borderRadius: 8, cursor: pathAlreadyAdded || pathBusy ? 'default' : 'pointer', opacity: pathBusy ? 0.5 : 1, background: pathAlreadyAdded ? 'transparent' : '#5120c8', color: pathAlreadyAdded ? subtext : '#ffffff', border: `1px solid ${pathAlreadyAdded ? border : 'transparent'}`, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                            {pathAlreadyAdded ? <><CheckCircle2 size={11} />{isAr ? 'مضاف' : 'Added'}</> : <><Plus size={11} />{isAr ? 'أضف للمسار' : 'Add to Path'}</>}
                          </button>
                        </div>
                      )
                    })}
                </div>
                
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => { localStorage.removeItem('assessmentResults'); setAssessmentResults([]); router.push(`/${locale}/dashboard/assessment`) }} style={{ flex: 1, padding: '13px', borderRadius: 12, cursor: 'pointer', background: '#5120c8', color: '#ffffff', border: 'none', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <RefreshCw size={15} />
                    {isAr ? 'إعادة الاختبار الذكي' : 'Retake Smart Assessment'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, margin: '0 auto 20px', background: isDark ? 'rgba(81,32,200,0.1)' : 'rgba(81,32,200,0.06)', border: '1px solid rgba(81,32,200,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={26} color="#5120c8" />
                </div>
                <h2 style={{ color: text, fontSize: 22, fontWeight: 900, margin: '0 0 10px', letterSpacing: '-0.02em' }}>{isAr ? 'اكتشف مسارك المثالي' : 'Discover Your Ideal Path'}</h2>
                <p style={{ color: subtext, fontSize: 14, margin: '0 0 28px', lineHeight: 1.75, maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
                  {isAr ? '15 سؤال ذكي يحلل اهتماماتك ومهاراتك ليرشح لك المسار الأنسب بدقة' : '15 smart questions analyze your interests and skills to recommend the perfect path'}
                </p>
                <button onClick={() => router.push(`/${locale}/dashboard/assessment`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 14, background: '#5120c8', color: '#ffffff', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, boxShadow: '0 4px 16px rgba(81,32,200,0.3)' }}>
                  <Sparkles size={16} />
                  {isAr ? 'ابدأ الاختبار الذكي' : 'Start Smart Assessment'}
                  <ChevronRight size={15} style={{ transform: isAr ? 'rotate(180deg)' : 'none' }} />
                </button>
                <p style={{ color: isDark ? 'rgba(255,255,255,0.2)' : '#d1d5db', fontSize: 12, marginTop: 12 }}>{isAr ? 'مجاني  يستغرق 3-5 دقائق فقط' : 'Free  takes only 3-5 minutes'}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'courses' && (
          <div>
            {myPathIds.size === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                <Target size={36} color={subtext} style={{ marginBottom: 12 }} />
                <p style={{ color: text, fontSize: 15, fontWeight: 700, margin: '0 0 8px' }}>
                  {isAr ? 'يرجى اختيار مسار مهني أولاً' : 'Please select a career path first'}
                </p>
                <p style={{ color: subtext, fontSize: 13, margin: '0 0 24px' }}>
                  {isAr ? 'اختر مساراً مهنياً لعرض الكورسات المخصصة لك' : 'Choose a career path to see courses tailored to you'}
                </p>
                <button onClick={() => setActiveTab('paths')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 24px', borderRadius: 10, cursor: 'pointer', border: 'none', background: '#5120c8', color: '#ffffff', fontSize: 13, fontWeight: 700 }}>
                  <Target size={14} />
                  {isAr ? 'اختر مساراً' : 'Select a Path'}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ color: text, fontSize: 15, fontWeight: 800, margin: '0 0 4px' }}>{isAr ? 'الكورسات المقترحة' : 'Recommended Courses'}</h3>
                  <p style={{ color: subtext, fontSize: 13, margin: 0 }}>
                    {myPathIds.size > 0
                      ? (isAr ? `بناء على ${myPathIds.size} مسار مختار` : `Based on ${myPathIds.size} selected path${myPathIds.size > 1 ? 's' : ''}`)
                      : (isAr ? 'أحدث الكورسات المنشورة' : 'Latest published courses')}
                  </p>
                </div>
                
                {coursesLoading ? (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14 }}>
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} style={{ height:200, borderRadius:14, background: isDark?'#1a1a1a':'#f4f4f8' }}>
                        <div style={{ width:'100%', height:'100%', borderRadius:14, animation:'pulse 1.5s infinite', background: isDark?'#222':'#efefef' }} />
                      </div>
                    ))}
                  </div>
                ) : courses.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
                    {courses.map((course: any) => (
                      <div key={course.id} style={{ borderRadius: 14, border: `1px solid ${border}`, background: cardBg, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.15s' }}
                      onClick={() => window.open(learnUrl(`/${locale}/courses/${course.slug || course.id}`), '_blank')}>
                        <div style={{ height: 120, background: isDark ? '#1a1a1a' : '#f8f8fa', overflow: 'hidden' }}>
                          {course.thumbnail ? <img src={course.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={28} color={subtext} /></div>}
                        </div>
                        <div style={{ padding: '14px' }}>
                          <h4 style={{ color: text, fontSize: 13, fontWeight: 700, margin: '0 0 6px', lineHeight: 1.4 }}>{course.title || (isAr ? (course.titleAr || course.titleEn) : (course.titleEn || course.titleAr))}</h4>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#5120c8', fontSize: 13, fontWeight: 800 }}>{course.price > 0 ? `${course.price} ر.س` : (isAr ? 'مجاني' : 'Free')}</span>
                            <Award size={13} color={subtext} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign:'center', padding:'60px 24px' }}>
                    <BookOpen size={36} color={subtext} style={{ marginBottom:12 }} />
                    <p style={{ color:subtext, fontSize:14, marginBottom:16 }}>
                      {isAr ? 'لا توجد كورسات مطابقة لمساراتك المختارة حالياً' : 'No courses matching your selected paths yet'}
                    </p>
                    <a
                      href={learnUrl(`/${locale}/courses`)}
                      target="_blank" rel="noopener noreferrer"
                      style={{
                        display:'inline-block',
                        padding:'10px 22px', borderRadius:10,
                        background:'#5120c8', color:'#ffffff',
                        textDecoration:'none', cursor:'pointer',
                        fontSize:13, fontWeight:700,
                      }}>
                      {isAr ? 'استعرض جميع الكورسات' : 'Browse All Courses'}
                    </a>
                  </div>
                )}
                
                {bundles.length > 0 && (
                  <div style={{ marginTop: 32 }}>
                    <h4 style={{ color: text, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{isAr ? 'حزم الكورسات الداعمة' : 'Supporting Course Bundles'}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {bundles.map((bundle: any) => (
                        <div key={bundle.id} style={{ padding: '16px 18px', borderRadius: 14, border: `1px solid ${border}`, background: isDark ? 'rgba(255,255,255,0.03)' : '#fafafa', display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: 'rgba(81,32,200,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={18} color="#5120c8" />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: text, fontSize: 14, fontWeight: 700 }}>{bundle.title}</div>
                            <div style={{ color: subtext, fontSize: 12, marginTop: 3 }}>{bundle.coursesCount || bundle.courses?.length || 0} {isAr ? 'كورس' : 'courses'} · {bundle.price > 0 ? `${bundle.price} ر.س` : (isAr ? 'مجاني' : 'Free')}</div>
                          </div>
                          <button onClick={() => window.open(`https://deveway-teal.vercel.app/${locale}/bundles/${bundle.id}`, '_blank')} style={{ padding: '8px 14px', borderRadius: 10, background: '#5120c8', color: '#ffffff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>{isAr ? 'عرض' : 'View'}</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div style={{ textAlign: 'center', marginTop: 24 }}>
                  <a
                    href={learnUrl(`/${locale}/courses`)}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 24px', borderRadius: 10, cursor: 'pointer', border: `1px solid ${border}`, background: 'transparent', color: '#5120c8', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                    <BookOpen size={14} />
                    {isAr ? 'استعرض جميع الكورسات' : 'Browse All Courses'}
                    <ChevronRight size={13} style={{ transform: isAr ? 'rotate(180deg)' : 'none' }} />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={isAr ? 'حسناً' : 'OK'}
          cancelLabel={isAr ? 'إلغاء' : 'Cancel'}
          confirmDestructive={confirmModal.destructive}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        />
      </div>
    </div>
  )
}