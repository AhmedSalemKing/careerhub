'use client'

import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import {
  Sparkles, ArrowLeft, LogIn, Users, CalendarDays, Star,
  PenLine, UserRound, ShieldCheck, Check, Loader2,
} from 'lucide-react'
import { get, post } from '@/lib/api'
import { setToken, setUser } from '@/lib/auth'
import { useAuthStore } from '@/stores/authStore'

/* ───────────────────────── content (from the reference design) ───────────────────────── */

const STEPS = [
  { Icon: LogIn, t: 'قدّم طلبك', d: 'أخبرنا بمجالك وخبرتك واللغات التي تتحدثها.' },
  { Icon: Users, t: 'نطابقك', d: 'نربطك بالمسارات والمتعلّمين في مجالك.' },
  { Icon: CalendarDays, t: 'حدّد مواعيدك', d: 'انشر أوقاتك في تقويمك، ويحجز المتعلّمون من داخل DeveWay.' },
  { Icon: Star, t: 'أرشد واحصل على أجرك', d: 'قدّم العيادات والمراجعات والجلسات الفردية، بأجر عن كل جلسة.' },
]

const METHODS = [
  { Icon: Users, t: 'العيادات الجماعية', d: 'مرشد واحد ومتعلّمون كثر؛ تجيب عن الأسئلة وتعالج المشكلات الشائعة.' },
  { Icon: PenLine, t: 'مراجعات الخبراء', d: 'راجع سيرة ذاتية أو ملف أعمال أو مشروعًا وأرسل ملاحظات مكتوبة أو مسجّلة، دون موعد مباشر.' },
  { Icon: UserRound, t: 'الجلسات الفردية', d: 'مراجعات الجاهزية والمقابلات التجريبية عند محطات المسار.' },
]

const WHO = [
  'خبرة لا تقل عن 5 سنوات في أحد مجالاتنا الستة',
  'القدرة على الإرشاد بالعربية أو الإنجليزية أو كلتيهما',
  'معرفة بسوق العمل السعودي أو المصري',
  'تواصل واضح ومشجّع',
]

const COUNTRIES = ['السعودية', 'مصر']
const FIELDS = ['تحليل البيانات', 'التسويق الرقمي', 'تصميم تجربة وواجهة المستخدم', 'إدارة المشاريع', 'تطوير البرمجيات', 'الأمن السيبراني']
const EXPERIENCE = ['5–7', '8–12', '13+']
const LANGS = ['العربية', 'الإنجليزية']

const MSG_REQUIRED = 'يرجى تعبئة هذا الحقل.'
const MSG_EMAIL = 'يرجى إدخال بريد إلكتروني صحيح.'
const MSG_NAME = 'يرجى كتابة الاسم الأول واسم العائلة.'
const MSG_PASSWORD = '8 أحرف على الأقل، وحرف كبير وصغير ورقم ورمز خاص (@$!%*?&).'
const MSG_CV = 'السيرة الذاتية مطلوبة.'

/**
 * Mentors apply through the existing registration flow: POST /auth/register with
 * accountType 'CONSULTANT'. The account is created as PENDING and an admin approves it.
 * The DTO whitelists its fields (forbidNonWhitelisted), so languages and notes are
 * folded into `bio`, and the CV is required by the API for consultants.
 */
const REGISTER_ENDPOINT = '/auth/register'
const CV_MAX_BYTES = 5 * 1024 * 1024
const COUNTRY_API: Record<string, string> = { 'السعودية': 'Saudi Arabia', 'مصر': 'Egypt' }
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/

interface ApiErrorShape {
  response?: { status?: number; data?: { message?: string | string[] } }
}

function applyErrorText(err: unknown): string {
  const r = (err as ApiErrorShape)?.response
  const raw = r?.data?.message
  const msg = (Array.isArray(raw) ? raw.join(' ') : raw ?? '').toLowerCase()
  if (r?.status === 429) return 'محاولات كثيرة، يرجى الانتظار دقيقة ثم إعادة المحاولة.'
  if (msg.includes('email already exists')) return 'هذا البريد الإلكتروني مسجّل مسبقًا. جرّب تسجيل الدخول أو استخدم بريدًا آخر.'
  if (msg.includes('password')) return 'كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل، وحرف كبير وصغير ورقم ورمز خاص (@$!%*?&).'
  if (msg.includes('cv')) return 'السيرة الذاتية مطلوبة، يرجى رفعها ثم إعادة المحاولة.'
  if (msg.includes('email')) return 'يرجى إدخال بريد إلكتروني صحيح.'
  if (r?.status && r.status >= 500) return 'حدث خطأ في الخادم، يرجى المحاولة لاحقًا.'
  if (!r) return 'تعذّر الاتصال بالخادم، تحقّق من اتصالك وأعد المحاولة.'
  return 'تعذّر إرسال الطلب، يرجى مراجعة البيانات والمحاولة مرة أخرى.'
}

// Illustrated cast copied verbatim from the reference design, converted to JSX.
// The <svg> is rendered directly (no wrapper element), as in the reference.
const CharEg7 = () => (
  <>
    <svg className="char" viewBox="0 0 120 120" aria-hidden="true">
    <defs>
    <linearGradient id="dw-eg7-0" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stopColor="#F6EAFF" />
    <stop offset="1" stopColor="#E6CEFF" />
    </linearGradient>
    <clipPath id="dw-eg7-1">
    <rect width="120" height="120" rx="28" />
    </clipPath>
    </defs>
    <g clipPath="url(#dw-eg7-1)">
    <rect width="120" height="120" fill="url(#dw-eg7-0)" />
    <circle cx="98" cy="22" r="26" fill="#ffffff" opacity="0.35" />
    <g>
    <path d="M12 122 C14 97 33 85 60 85 C87 85 106 97 108 122 Z" fill="#6B3A9C" />
    <path d="M50 85 L60 106 L70 85 Z" fill="#FFFFFF" />
    <path d="M48 86 L56 104 L50 108 L42 92 Z" fill="#572E82" />
    <path d="M72 86 L64 104 L70 108 L78 92 Z" fill="#572E82" />
    <circle cx="60" cy="113" r="1.6" fill="#572E82" />
    </g>
    <g>
    <ellipse cx="60" cy="52" rx="17" ry="20" fill="#D6A27C" />
    <ellipse cx="43.5" cy="54" rx="3" ry="4.5" fill="#BE8A65" />
    <ellipse cx="76.5" cy="54" rx="3" ry="4.5" fill="#BE8A65" />
    <path d="M50 45.5 Q53.5 43.8 57 45.2" stroke="#1D1530" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    <path d="M63 45.2 Q66.5 43.8 70 45.5" stroke="#1D1530" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    <ellipse cx="53.5" cy="51" rx="1.7" ry="2.1" fill="#1D1530" />
    <ellipse cx="66.5" cy="51" rx="1.7" ry="2.1" fill="#1D1530" />
    <path d="M60 52.5 Q58.2 57 60.6 57.6" stroke="#BE8A65" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <ellipse cx="50" cy="58" rx="3" ry="1.6" fill="#E77A8A" opacity="0.22" />
    <ellipse cx="70" cy="58" rx="3" ry="1.6" fill="#E77A8A" opacity="0.22" />
    <path d="M55.5 62 Q60 65.6 64.5 62" stroke="#1D1530" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </g>
    <g>
    <path d="M60 25 C41 25 36 39 36 55 C36 70 40 82 47 89 C40 92 34 95 30 99 C44 104 76 104 90 99 C86 95 80 92 73 89 C80 82 84 70 84 55 C84 39 79 25 60 25 Z M60 34 C49 34 44.5 42 44.5 52.5 C44.5 64 51 72.5 60 72.5 C69 72.5 75.5 64 75.5 52.5 C75.5 42 71 34 60 34 Z" fill="#E3A9BB" fillRule="evenodd" />
    <path d="M60 34 C49 34 44.5 42 44.5 52.5 C44.5 64 51 72.5 60 72.5 C69 72.5 75.5 64 75.5 52.5 C75.5 42 71 34 60 34 Z" fill="none" stroke="#C98AA0" strokeWidth="1.2" />
    <path d="M47 89 C52 84 56 80 58 76" stroke="#C98AA0" strokeWidth="1" fill="none" opacity="0.7" />
    </g>
    </g>
    </svg>
  </>
)

const CharSa5 = () => (
  <>
    <svg className="char" viewBox="0 0 120 120" aria-hidden="true">
    <defs>
    <linearGradient id="dw-sa5-0" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stopColor="#EEE7FF" />
    <stop offset="1" stopColor="#D6C9FF" />
    </linearGradient>
    <clipPath id="dw-sa5-1">
    <rect width="120" height="120" rx="28" />
    </clipPath>
    </defs>
    <g clipPath="url(#dw-sa5-1)">
    <rect width="120" height="120" fill="url(#dw-sa5-0)" />
    <circle cx="98" cy="22" r="26" fill="#ffffff" opacity="0.35" />
    <g>
    <path d="M12 122 C14 97 33 85 60 85 C87 85 106 97 108 122 Z" fill="#F6F4FA" />
    <path d="M12 122 C14 97 33 85 60 85 C87 85 106 97 108 122 Z" fill="none" stroke="#DCD6EA" strokeWidth="1" />
    <path d="M53 84 Q60 90 67 84" stroke="#CFC8E3" strokeWidth="2" fill="none" />
    <path d="M60 89 L60 110" stroke="#CFC8E3" strokeWidth="1.5" />
    <circle cx="60" cy="95" r="1.2" fill="#B9B0D6" />
    <circle cx="60" cy="102" r="1.2" fill="#B9B0D6" />
    </g>
    <path d="M52 66 L52 80 Q60 85 68 80 L68 66 Z" fill="#9C6A45" />
    <g>
    <ellipse cx="60" cy="52" rx="17" ry="20" fill="#B58058" />
    <ellipse cx="43.5" cy="54" rx="3" ry="4.5" fill="#9C6A45" />
    <ellipse cx="76.5" cy="54" rx="3" ry="4.5" fill="#9C6A45" />
    <path d="M50 45.5 Q53.5 43.8 57 45.2" stroke="#1D1530" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    <path d="M63 45.2 Q66.5 43.8 70 45.5" stroke="#1D1530" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    <ellipse cx="53.5" cy="51" rx="1.7" ry="2.1" fill="#1D1530" />
    <ellipse cx="66.5" cy="51" rx="1.7" ry="2.1" fill="#1D1530" />
    <path d="M60 52.5 Q58.2 57 60.6 57.6" stroke="#9C6A45" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <ellipse cx="50" cy="58" rx="3" ry="1.6" fill="#E77A8A" opacity="0.22" />
    <ellipse cx="70" cy="58" rx="3" ry="1.6" fill="#E77A8A" opacity="0.22" />
    <path d="M43.5 55 C44 67 51 73.5 60 73.5 C69 73.5 76 67 76.5 55 C74 62 69 64.5 66 64 C63 63 57 63 54 64 C51 64.5 46 62 43.5 55 Z" fill="#8F8A9C" />
    <path d="M54 61.6 Q60 59.2 66 61.6 Q60 60.8 54 61.6 Z" fill="#8F8A9C" stroke="#8F8A9C" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M56.5 65.2 Q60 67.2 63.5 65.2" stroke="#F3E9F0" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    <g stroke="#1D1530" strokeWidth="1.5" fill="#ffffff" fillOpacity="0.18">
    <rect x="47.5" y="46.5" width="11" height="9" rx="3.5" />
    <rect x="61.5" y="46.5" width="11" height="9" rx="3.5" />
    <path d="M58.5 50 Q60 49 61.5 50" fill="none" />
    </g>
    </g>
    <g>
    <path d="M60 21 C39 21 33 37 33 54 C33 70 30 86 25 100 C36 98 45 92 49 82 C45 74 42.5 64 43 53 C43.5 40 50 33.5 60 33.5 C70 33.5 76.5 40 77 53 C77.5 64 75 74 71 82 C75 92 84 98 95 100 C90 86 87 70 87 54 C87 37 81 21 60 21 Z" fill="#FBFAFD" />
    <path d="M60 21 C39 21 33 37 33 54 C33 70 30 86 25 100 C36 98 45 92 49 82 C45 74 42.5 64 43 53 C43.5 40 50 33.5 60 33.5 C70 33.5 76.5 40 77 53 C77.5 64 75 74 71 82 C75 92 84 98 95 100 C90 86 87 70 87 54 C87 37 81 21 60 21 Z" fill="none" stroke="#D9D3E8" strokeWidth="0.9" />
    <path d="M40 60 C39 72 37 84 33 94" stroke="#D9D3E8" strokeWidth="0.9" fill="none" opacity="0.6" />
    <path d="M80 60 C81 72 83 84 87 94" stroke="#D9D3E8" strokeWidth="0.9" fill="none" opacity="0.6" />
    <path d="M41 30.5 Q60 23.5 79 30.5" stroke="#15111F" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.85" />
    <path d="M38.5 30 Q60 38 81.5 30" stroke="#15111F" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M38 34 Q60 42 82 34" stroke="#15111F" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
    </g>
    </svg>
  </>
)

const CharEg4 = () => (
  <>
    <svg className="char" viewBox="0 0 120 120" aria-hidden="true">
    <defs>
    <linearGradient id="dw-eg4-0" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stopColor="#ECE6FF" />
    <stop offset="1" stopColor="#D3C7FF" />
    </linearGradient>
    <clipPath id="dw-eg4-1">
    <rect width="120" height="120" rx="28" />
    </clipPath>
    </defs>
    <g clipPath="url(#dw-eg4-1)">
    <rect width="120" height="120" fill="url(#dw-eg4-0)" />
    <circle cx="98" cy="22" r="26" fill="#ffffff" opacity="0.35" />
    <g>
    <path d="M12 122 C14 97 33 85 60 85 C87 85 106 97 108 122 Z" fill="#100C2E" />
    <path d="M50 85 L60 106 L70 85 Z" fill="#DCD3FF" />
    <path d="M48 86 L56 104 L50 108 L42 92 Z" fill="#241B55" />
    <path d="M72 86 L64 104 L70 108 L78 92 Z" fill="#241B55" />
    <circle cx="60" cy="113" r="1.6" fill="#241B55" />
    </g>
    <path d="M52 66 L52 80 Q60 85 68 80 L68 66 Z" fill="#966442" />
    <g>
    <ellipse cx="60" cy="52" rx="17" ry="20" fill="#B07A54" />
    <ellipse cx="43.5" cy="54" rx="3" ry="4.5" fill="#966442" />
    <ellipse cx="76.5" cy="54" rx="3" ry="4.5" fill="#966442" />
    <path d="M50 45.5 Q53.5 43.8 57 45.2" stroke="#1D1530" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    <path d="M63 45.2 Q66.5 43.8 70 45.5" stroke="#1D1530" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    <ellipse cx="53.5" cy="51" rx="1.7" ry="2.1" fill="#1D1530" />
    <ellipse cx="66.5" cy="51" rx="1.7" ry="2.1" fill="#1D1530" />
    <path d="M60 52.5 Q58.2 57 60.6 57.6" stroke="#966442" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <ellipse cx="50" cy="58" rx="3" ry="1.6" fill="#E77A8A" opacity="0.22" />
    <ellipse cx="70" cy="58" rx="3" ry="1.6" fill="#E77A8A" opacity="0.22" />
    <path d="M55.5 62 Q60 65.6 64.5 62" stroke="#1D1530" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    <path d="M46 60 C48 68 53 72 60 72 C67 72 72 68 74 60 C70 66 66 67.5 60 67.5 C54 67.5 50 66 46 60 Z" fill="#21182B" opacity="0.22" />
    <g stroke="#1D1530" strokeWidth="1.5" fill="#ffffff" fillOpacity="0.18">
    <rect x="47.5" y="46.5" width="11" height="9" rx="3.5" />
    <rect x="61.5" y="46.5" width="11" height="9" rx="3.5" />
    <path d="M58.5 50 Q60 49 61.5 50" fill="none" />
    </g>
    </g>
    <path d="M42.5 49 C41 36 49 28.5 60 28.5 C71 28.5 79 36 77.5 49 C76 42 72 38.5 66 37.5 C60 39 52 39 46 40 C44 43 43 46 42.5 49 Z" fill="#21182B" />
    </g>
    </svg>
  </>
)

const CharSa4 = () => (
  <>
    <svg className="char" viewBox="0 0 120 120" aria-hidden="true">
    <defs>
    <linearGradient id="dw-sa4-0" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stopColor="#F1E9FF" />
    <stop offset="1" stopColor="#E0CFFF" />
    </linearGradient>
    <clipPath id="dw-sa4-1">
    <rect width="120" height="120" rx="28" />
    </clipPath>
    </defs>
    <g clipPath="url(#dw-sa4-1)">
    <rect width="120" height="120" fill="url(#dw-sa4-0)" />
    <circle cx="98" cy="22" r="26" fill="#ffffff" opacity="0.35" />
    <g>
    <path d="M12 122 C14 97 33 85 60 85 C87 85 106 97 108 122 Z" fill="#1A1626" />
    <path d="M44 88 C50 96 54 108 55 122" stroke="#C9B8FD" strokeWidth="1.6" fill="none" opacity="0.9" />
    <path d="M76 88 C70 96 66 108 65 122" stroke="#C9B8FD" strokeWidth="1.6" fill="none" opacity="0.9" />
    </g>
    <g>
    <ellipse cx="60" cy="52" rx="17" ry="20" fill="#C99670" />
    <ellipse cx="43.5" cy="54" rx="3" ry="4.5" fill="#B07E59" />
    <ellipse cx="76.5" cy="54" rx="3" ry="4.5" fill="#B07E59" />
    <path d="M50 45.5 Q53.5 43.8 57 45.2" stroke="#1D1530" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    <path d="M63 45.2 Q66.5 43.8 70 45.5" stroke="#1D1530" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    <ellipse cx="53.5" cy="51" rx="1.7" ry="2.1" fill="#1D1530" />
    <ellipse cx="66.5" cy="51" rx="1.7" ry="2.1" fill="#1D1530" />
    <path d="M60 52.5 Q58.2 57 60.6 57.6" stroke="#B07E59" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <ellipse cx="50" cy="58" rx="3" ry="1.6" fill="#E77A8A" opacity="0.22" />
    <ellipse cx="70" cy="58" rx="3" ry="1.6" fill="#E77A8A" opacity="0.22" />
    <path d="M55.5 62 Q60 65.6 64.5 62" stroke="#1D1530" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    <g stroke="#1D1530" strokeWidth="1.5" fill="#ffffff" fillOpacity="0.18">
    <rect x="47.5" y="46.5" width="11" height="9" rx="3.5" />
    <rect x="61.5" y="46.5" width="11" height="9" rx="3.5" />
    <path d="M58.5 50 Q60 49 61.5 50" fill="none" />
    </g>
    </g>
    <g>
    <path d="M60 25 C41 25 36 39 36 55 C36 70 40 82 47 89 C40 92 34 95 30 99 C44 104 76 104 90 99 C86 95 80 92 73 89 C80 82 84 70 84 55 C84 39 79 25 60 25 Z M60 34 C49 34 44.5 42 44.5 52.5 C44.5 64 51 72.5 60 72.5 C69 72.5 75.5 64 75.5 52.5 C75.5 42 71 34 60 34 Z" fill="#4A2470" fillRule="evenodd" />
    <path d="M60 34 C49 34 44.5 42 44.5 52.5 C44.5 64 51 72.5 60 72.5 C69 72.5 75.5 64 75.5 52.5 C75.5 42 71 34 60 34 Z" fill="none" stroke="#6B3A9C" strokeWidth="1.2" />
    <path d="M47 89 C52 84 56 80 58 76" stroke="#6B3A9C" strokeWidth="1" fill="none" opacity="0.7" />
    </g>
    </g>
    </svg>
  </>
)

type CharId = 'eg7' | 'sa5' | 'eg4' | 'sa4'

const CHAR_SVG: Record<CharId, () => React.JSX.Element> = {
  eg7: CharEg7,
  sa5: CharSa5,
  eg4: CharEg4,
  sa4: CharSa4,
}

function Char({ id }: { id: CharId }) {
  const Svg = CHAR_SVG[id]
  return <Svg />
}

function Cast({ ids, size }: { ids: CharId[]; size: number }) {
  return (
    <span className="cast">
      {ids.map((id) => (
        <span key={id} className="char-av" style={{ width: size, height: size }}><Char id={id} /></span>
      ))}
    </span>
  )
}

/* ───────────────────────── types ───────────────────────── */

interface ConsultantProfile {
  firstName?: string | null
  lastName?: string | null
  speciality?: string | null
  country?: string | null
  languages?: string[] | null
  avatar?: string | null
}
interface Consultant {
  id: string
  profile?: ConsultantProfile | null
}

interface FormState {
  name: string
  email: string
  password: string
  cvUrl: string
  cvName: string
  country: string
  field: string
  exp: string
  langs: string[]
  msg: string
}
type FormErrors = Partial<Record<'name' | 'email' | 'password' | 'cv' | 'country' | 'field' | 'exp', string>>
type Phase = 'idle' | 'sending' | 'sent' | 'error'

function initials(c: Consultant): string {
  const f = c.profile?.firstName?.trim()?.[0] ?? ''
  const l = c.profile?.lastName?.trim()?.[0] ?? ''
  return (f + l) || '؟'
}

function validate(f: FormState): FormErrors {
  const e: FormErrors = {}
  const parts = f.name.trim().split(/\s+/).filter(Boolean)
  if (!f.name.trim()) e.name = MSG_REQUIRED
  else if (parts.length < 2 || parts.some((x) => x.length < 2)) e.name = MSG_NAME
  if (!f.email.trim()) e.email = MSG_REQUIRED
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = MSG_EMAIL
  if (!f.password) e.password = MSG_REQUIRED
  else if (!PASSWORD_RE.test(f.password)) e.password = MSG_PASSWORD
  if (!f.cvUrl) e.cv = MSG_CV
  if (!f.country) e.country = MSG_REQUIRED
  if (!f.field) e.field = MSG_REQUIRED
  if (!f.exp) e.exp = MSG_REQUIRED
  return e
}

/* ───────────────────────── page ───────────────────────── */

export default function CoachingPage() {
  const locale = useLocale()
  const router = useRouter()
  const authStore = useAuthStore()

  const [form, setForm] = useState<FormState>({ name: '', email: '', password: '', cvUrl: '', cvName: '', country: '', field: '', exp: '', langs: ['العربية'], msg: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [phase, setPhase] = useState<Phase>('idle')
  // Show the success state again after a refresh once an application was sent from this browser.
  useEffect(() => {
    try { if (localStorage.getItem('coaching_applied') === 'true') setPhase('sent') } catch { /* storage unavailable */ }
  }, [])
  const [errorText, setErrorText] = useState('')
  const [cvUploading, setCvUploading] = useState(false)

  const [showCoaches, setShowCoaches] = useState(false)
  const [coaches, setCoaches] = useState<Consultant[]>([])
  const [coachesLoading, setCoachesLoading] = useState(false)
  const [coachesError, setCoachesError] = useState(false)
  const [coachesLoaded, setCoachesLoaded] = useState(false)

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((p) => ({ ...p, [k]: v }))

  const toggleLang = (l: string) =>
    setForm((p) => ({ ...p, langs: p.langs.includes(l) ? p.langs.filter((x) => x !== l) : [...p.langs, l] }))

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.cch .rv'))
    if (typeof IntersectionObserver === 'undefined') {
      nodes.forEach((n) => n.classList.add('in'))
      return
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
      })
    }, { threshold: 0.12 })
    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  async function onCvChange(ev: ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0]
    ev.target.value = ''
    if (!file) return
    if (file.size > CV_MAX_BYTES) {
      setErrors((p) => ({ ...p, cv: 'حجم الملف أكبر من 5MB.' }))
      return
    }
    setCvUploading(true)
    setErrors((p) => ({ ...p, cv: undefined }))
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await post<{ data?: { url?: string }; url?: string }>('/upload/cv', fd)
      const url = res.data?.data?.url ?? res.data?.url
      if (!url) throw new Error('no-url')
      setForm((p) => ({ ...p, cvUrl: url, cvName: file.name }))
    } catch {
      setErrors((p) => ({ ...p, cv: 'تعذّر رفع الملف، تأكد أنه PDF أو Word ولا يتجاوز 5MB.' }))
    } finally {
      setCvUploading(false)
    }
  }

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault()
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0 || cvUploading) return

    setPhase('sending')
    setErrorText('')
    try {
      const parts = form.name.trim().split(/\s+/)
      const firstName = parts[0]
      const lastName = parts.slice(1).join(' ')
      const years = parseInt(form.exp, 10)
      const notes = form.msg.trim()
      const bio = [form.langs.length ? 'لغات الإرشاد: ' + form.langs.join('، ') : '', notes]
        .filter(Boolean)
        .join('\n')
        .slice(0, 1000)

      const payload: Record<string, unknown> = {
        firstName,
        lastName,
        email: form.email.trim(),
        password: form.password,
        accountType: 'CONSULTANT',
        country: COUNTRY_API[form.country] ?? form.country,
        speciality: form.field,
        language: 'ar',
        cvUrl: form.cvUrl,
      }
      if (Number.isFinite(years)) payload.experience = years
      if (bio) payload.bio = bio

      const reg = await post(REGISTER_ENDPOINT, payload)
      try { localStorage.setItem('coaching_applied', 'true') } catch { /* storage unavailable */ }

      // A pending account gets no token from /auth/register, so sign in with the credentials just
      // submitted (the login endpoint issues a limited token for PENDING accounts).
      let token: string | undefined = reg?.data?.data?.accessToken
      let user: any = reg?.data?.data?.user
      if (!token) {
        try {
          const res = await post('/auth/login', { email: form.email.trim(), password: form.password })
          token = res?.data?.data?.accessToken
          user = res?.data?.data?.user
        } catch { /* fall through to the applied=true redirect */ }
      }
      if (token && user) {
        authStore.setToken(token)
        setToken(token)
        localStorage.setItem('deveway_token', token)
        localStorage.setItem('careerhub_token', token)
        authStore.setUser(user)
        setUser(user)
        localStorage.setItem('deveway_user', JSON.stringify(user))
        localStorage.setItem('careerhub_user', JSON.stringify(user))
        window.dispatchEvent(new Event('auth:updated'))
        router.push(`/${locale}/pending-approval`)
      } else {
        setPhase('sent')
      }
    } catch (e) {
      setErrorText(applyErrorText(e))
      setPhase('error')
    }
  }

  function toggleCoaches() {
    const next = !showCoaches
    setShowCoaches(next)
    if (next && !coachesLoaded && !coachesLoading) void loadCoaches()
  }

  async function loadCoaches() {
    setCoachesLoading(true)
    setCoachesError(false)
    try {
      const res = await get<{ data?: Consultant[] } | Consultant[]>('/consulting/consultants', { params: { limit: 50 } })
      const body = res.data
      const list = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : []
      setCoaches(list)
      setCoachesLoaded(true)
    } catch {
      setCoachesError(true)
    } finally {
      setCoachesLoading(false)
    }
  }

  return (
    <main className="dw-home cch" dir="rtl" lang="ar">
      <style>{CSS}</style>

      {/* B) INTRO */}
      <section className="cch-band cch-intro-band">
        <div className="cch-bg" aria-hidden="true"><span className="cch-dots" /><span className="cch-b1" /><span className="cch-b2" /></div>
        <div className="cch-in cch-intro-grid">
          <div className="cch-copy">
            <span className="cch-eyebrow">للمرشدين</span>
            <h1>للمرشدين</h1>
            <p className="cch-lede">شارك خبرتك مع المتعلّمين في اللحظات التي يصنع فيها الإرشاد الفرق الأكبر.</p>
            <p className="cch-pill"><Sparkles size={16} aria-hidden="true" />مرونة كاملة، أجر عن كل جلسة، بالعربية أو الإنجليزية.</p>

            <div className="cch-actions">
              <a className="cch-cta primary" href="#mentor-apply" onClick={(e) => { e.preventDefault(); scrollTo('mentor-apply') }}>
                قدّم كمرشد<ArrowLeft size={18} aria-hidden="true" />
              </a>
              <a className="cch-cta ghost" href="#mentor-portal" onClick={(e) => { e.preventDefault(); scrollTo('mentor-portal') }}>افتح بوابة المرشدين</a>
            </div>
          </div>

          <div className="phero-media">
            <div className="ph scene" role="img" aria-label="للمرشدين">
              <span className="sc-orb o1"></span>
              <span className="sc-orb o2"></span>
              <div className="duo n2">
                <span className="duo-p" style={{ ['--i' as string]: 0 }}>
                  <Char id="eg7" />
                  <em className="duo-flag eg">مصر</em>
                </span>
                <span className="duo-p" style={{ ['--i' as string]: 1 }}>
                  <Char id="sa5" />
                  <em className="duo-flag sa">السعودية</em>
                </span>
              </div>
            </div>
            <div className="float f-live" style={{ position: 'absolute', top: 'auto', bottom: '-20px', insetInlineStart: '-14px' }}>
              <Cast ids={['sa5', 'eg7', 'eg4']} size={34} />
              <div>
                <p className="f-label">العيادات الجماعية</p>
                <p className="f-title">الأحد · 7:00 مساءً</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* D) HOW IT WORKS */}
      <section className="cch-band alt">
        <div className="cch-in">
          <div className="cch-head"><span className="cch-eyebrow">كيف نعمل</span><h2>كيف يعمل الإرشاد مع DeveWay</h2></div>
          <ol className="cch-steps">
            {STEPS.map(({ Icon, t, d }, i) => (
              <li key={t} className="cch-step">
                <span className="cch-step-ic"><Icon size={22} aria-hidden="true" /><span className="cch-step-n">{i + 1}</span></span>
                <h3>{t}</h3>
                <p>{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* E) COACHING METHODS */}
      <section className="cch-band">
        <div className="cch-in cch-split rev">
          <div className="split-media rv">
            <div className="ph scene" role="img" aria-label="طرق الإرشاد">
              <span className="sc-orb o1"></span>
              <span className="sc-orb o2"></span>
              <div className="duo n1">
                <span className="duo-p" style={{ ['--i' as string]: 0 }}>
                  <Char id="eg4" />
                  <em className="duo-flag eg">مصر</em>
                </span>
              </div>
            </div>
          </div>
          <div>
            <div className="cch-head tight"><span className="cch-eyebrow">للمرشدين</span><h2>طرق الإرشاد</h2></div>
            <div className="cch-feats">
              {METHODS.map(({ Icon, t, d }) => (
                <div key={t} className="cch-feat">
                  <span className="cch-feat-ic"><Icon size={20} aria-hidden="true" /></span>
                  <div><h4>{t}</h4><p>{d}</p></div>
                </div>
              ))}
            </div>
            <p className="cch-note"><ShieldCheck size={18} aria-hidden="true" /><span>يدعم المرشدون جاهزية المتعلّم، ولا يضمنون وظيفة ولا يعملون كجهات توظيف.</span></p>
            <a className="cch-cta primary" href="#mentor-apply" onClick={(e) => { e.preventDefault(); scrollTo('mentor-apply') }}>
              قدّم كمرشد<ArrowLeft size={18} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      {/* F) WHO WE LOOK FOR  +  G) APPLICATION FORM */}
      <section className="sec sec-alt" id="mentor-apply">
        <div className="wrap split" style={{ alignItems: 'start' }}>
          <div className="rv">
            <div className="sec-head">
              <span className="eyebrow">قدّم كمرشد</span>
              <h2 className="h2">من نبحث عنه</h2>
            </div>
            <ul className="checks" style={{ fontSize: '17px' }}>
              {WHO.map((x) => (
                <li key={x}>
                  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
                  <span>{x}</span>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: '24px' }}>
              <Cast ids={['sa5', 'eg7', 'eg4', 'sa4']} size={52} />
            </div>
          </div>

          <div className="card form-card rv">
            {phase === 'sent' ? (
              <div className="cch-success" role="status">
                <span className="cch-success-ic"><Check size={28} aria-hidden="true" /></span>
                <h3>تم استلام طلبك بنجاح</h3>
                <p>تم إرسال طلبك، في انتظار موافقة الإدارة. سيتم مراجعة طلبك والتواصل معك قريباً</p>
              </div>
            ) : (
              <>
                <h2>طلب الانضمام كمرشد</h2>
                <form className="form" onSubmit={onSubmit} noValidate>
                  <div className={'field' + (errors.name ? ' bad' : '')}>
                    <label htmlFor="m-name">الاسم الكامل</label>
                    <input id="m-name" type="text" required value={form.name} onChange={(e) => setField('name', e.target.value)} aria-invalid={!!errors.name} />
                    {errors.name && <span className="msg">{errors.name}</span>}
                  </div>
                  <div className={'field' + (errors.email ? ' bad' : '')}>
                    <label htmlFor="m-email">البريد الإلكتروني</label>
                    <input id="m-email" type="email" required autoComplete="email" value={form.email} onChange={(e) => setField('email', e.target.value)} aria-invalid={!!errors.email} />
                    {errors.email && <span className="msg">{errors.email}</span>}
                  </div>
                  <div className={'field' + (errors.password ? ' bad' : '')}>
                    <label htmlFor="m-pass">كلمة المرور</label>
                    <input id="m-pass" type="password" required autoComplete="new-password" value={form.password} onChange={(e) => setField('password', e.target.value)} aria-invalid={!!errors.password} />
                    {errors.password && <span className="msg">{errors.password}</span>}
                  </div>
                  <div className={'field' + (errors.cv ? ' bad' : '')}>
                    <label htmlFor="m-cv">السيرة الذاتية</label>
                    <label className="file-trigger" htmlFor="m-cv">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                      <span>{cvUploading ? 'جارٍ رفع الملف…' : form.cvName ? form.cvName : 'اختر ملف السيرة الذاتية'}</span>
                    </label>
                    <input id="m-cv" className="file-input" type="file" accept=".pdf,.doc,.docx" onChange={onCvChange} disabled={cvUploading} aria-invalid={!!errors.cv} />
                    <span className="hint">PDF أو Word — حجم أقصى 5MB</span>
                    {errors.cv && <span className="msg">{errors.cv}</span>}
                  </div>
                  <div className={'field' + (errors.country ? ' bad' : '')}>
                    <label htmlFor="m-country">الدولة</label>
                    <select id="m-country" required value={form.country} onChange={(e) => setField('country', e.target.value)} aria-invalid={!!errors.country}>
                      <option value="" />
                      {COUNTRIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                    </select>
                    {errors.country && <span className="msg">{errors.country}</span>}
                  </div>
                  <div className={'field' + (errors.field ? ' bad' : '')}>
                    <label htmlFor="m-field">المجال</label>
                    <select id="m-field" required value={form.field} onChange={(e) => setField('field', e.target.value)} aria-invalid={!!errors.field}>
                      <option value="" />
                      {FIELDS.map((c) => (<option key={c} value={c}>{c}</option>))}
                    </select>
                    {errors.field && <span className="msg">{errors.field}</span>}
                  </div>
                  <div className={'field' + (errors.exp ? ' bad' : '')}>
                    <label htmlFor="m-exp">سنوات الخبرة</label>
                    <select id="m-exp" required value={form.exp} onChange={(e) => setField('exp', e.target.value)} aria-invalid={!!errors.exp}>
                      <option value="" />
                      {EXPERIENCE.map((c) => (<option key={c} value={c}>{c}</option>))}
                    </select>
                    {errors.exp && <span className="msg">{errors.exp}</span>}
                  </div>
                  <div className="field">
                    <label>لغات الإرشاد</label>
                    <div className="checkset">
                      {LANGS.map((l) => (
                        <label key={l}><input type="checkbox" name="mlang" checked={form.langs.includes(l)} onChange={() => toggleLang(l)} />{l}</label>
                      ))}
                    </div>
                  </div>
                  <div className="field full">
                    <label htmlFor="m-msg">هل هناك ما تودّ إضافته؟</label>
                    <textarea id="m-msg" value={form.msg} onChange={(e) => setField('msg', e.target.value)} />
                  </div>

                  {phase === 'error' && <p className="cch-alert full" role="alert">{errorText}</p>}

                  <div className="full">
                    <button type="submit" className="btn btn-primary btn-block" disabled={phase === 'sending'}>
                      {phase === 'sending' ? 'جارٍ الإرسال...' : 'إرسال الطلب'}
                      {phase !== 'sending' && (
                        <svg className="icon go flip" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      {/* H) CURRENT COACHES */}
      <section className="cch-band" id="mentor-portal">
        <div className="cch-in">
          <div className="cch-head center"><span className="cch-eyebrow">للمرشدين</span><h2>المرشدون الحاليون</h2></div>
          <div className="cch-center">
            <button type="button" className="cch-cta ghost" onClick={toggleCoaches} aria-expanded={showCoaches}>
              {showCoaches ? 'إخفاء المرشدين' : 'عرض المرشدين الحاليين'}
            </button>
          </div>

          {showCoaches && (
            <div className="cch-coaches">
              {coachesLoading && <p className="cch-state"><Loader2 size={20} className="cch-spin" aria-hidden="true" />جارٍ التحميل…</p>}
              {coachesError && !coachesLoading && (
                <p className="cch-state">
                  تعذّر تحميل المرشدين.{' '}
                  <button type="button" className="cch-link" onClick={() => void loadCoaches()}>إعادة المحاولة</button>
                </p>
              )}
              {!coachesLoading && !coachesError && coachesLoaded && coaches.length === 0 && <p className="cch-state">لا يوجد مرشدون لعرضهم حاليًا.</p>}
              {!coachesLoading && coaches.length > 0 && (
                <div className="cch-grid">
                  {coaches.map((c) => {
                    const name = `${c.profile?.firstName ?? ''} ${c.profile?.lastName ?? ''}`.trim() || 'مرشد'
                    const langs = c.profile?.languages ?? []
                    return (
                      <a key={c.id} className="cch-coach" href={`/${locale}/coaching/${c.id}/book`}>
                        {c.profile?.avatar
                          ? <img className="cch-av" src={c.profile.avatar} alt="" />
                          : <span className="cch-av">{initials(c)}</span>}
                        <h3>{name}</h3>
                        {c.profile?.speciality && <p className="cch-spec">{c.profile.speciality}</p>}
                        <div className="cch-tags">
                          {c.profile?.country && <span className="cch-tag">{c.profile.country}</span>}
                          {langs.map((l) => (<span key={l} className="cch-tag soft">{l}</span>))}
                        </div>
                      </a>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

/* ───────────────────────── styles (tokens only) ───────────────────────── */

const CSS = `
.cch { min-height: 100vh; }
.cch .cch-in { max-width: var(--wrap); margin: 0 auto; padding-inline: 20px; }
.cch section.cch-band { position: relative; padding-block: 56px; }
.cch section.cch-band.alt { background: var(--bg-2); }
.cch section.cch-intro-band { padding-block: 56px 64px; overflow: hidden; isolation: isolate; }
.cch h1, .cch h2, .cch h3, .cch h4 { color: var(--ink); }


.cch-bg { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
.cch-dots { position: absolute; inset: 0; background-image: radial-gradient(var(--line-2) 1px, transparent 1px); background-size: 22px 22px; opacity: .6; }
.cch-b1, .cch-b2 { position: absolute; border-radius: 50%; filter: blur(70px); opacity: .45; }
.cch-b1 { width: 420px; height: 420px; background: var(--lavender); inset-block-start: -140px; inset-inline-start: -80px; }
.cch-b2 { width: 360px; height: 360px; background: var(--wash-2); inset-block-end: -140px; inset-inline-end: -60px; }

.cch-intro-grid { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: 24px; align-items: center; }
.cch-copy { display: flex; flex-direction: column; align-items: flex-start; gap: 0; min-width: 0; }
.cch-eyebrow { display: inline-block; font-size: 12px; font-weight: 600; letter-spacing: .04em; color: var(--brand); margin-bottom: 8px; }
.cch-copy h1 { margin: 0; font-weight: 800; line-height: 1.15; }
.cch-lede { margin: 16px 0 0; max-width: 560px; font-size: 16px; line-height: 1.8; color: var(--ink-2); }
.cch-pill { display: inline-flex; align-items: center; gap: 8px; margin: 16px 0 0; padding: 7px 14px; border-radius: 99px; background: var(--wash); border: 1px solid var(--line); color: var(--brand); font-size: 13px; font-weight: 500; }
.cch-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px; }

.cch-cta { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; border-radius: 10px; border: 1px solid var(--brand); font: inherit; font-size: 14px; font-weight: 600; text-decoration: none; cursor: pointer; transition: background .15s, box-shadow .15s; }
.cch-cta.primary { background: var(--brand); color: var(--on-brand); }
.cch-cta.primary:hover { background: var(--brand-hover); }
.cch-cta.ghost { background: transparent; color: var(--brand); }
.cch-cta.ghost:hover { background: var(--wash); }
.cch-cta.block { width: 100%; }
.cch-cta:disabled { opacity: .7; cursor: wait; }


.cch-head { margin-bottom: 28px; }
.cch-head.tight { margin-bottom: 12px; }
.cch-head.center { text-align: center; }
.cch-head h2 { margin: 0; font-weight: 800; }

.cch-steps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.cch-step { padding: 20px; border-radius: var(--r); background: var(--surface); border: 1px solid var(--line); }
.cch-step h3 { margin: 14px 0 6px; font-size: 16px; }
.cch-step p { margin: 0; font-size: 13px; line-height: 1.7; color: var(--ink-2); }
.cch-step-ic { position: relative; display: inline-grid; place-items: center; width: 46px; height: 46px; border-radius: 14px; background: var(--wash); color: var(--brand); }
.cch-step-n { position: absolute; inset-block-start: -8px; inset-inline-end: -8px; display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: var(--brand); color: var(--on-brand); font-size: 12px; font-weight: 700; }

.cch-split { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 40px; align-items: center; }
.cch-split.top { align-items: start; }
.cch-feats { display: flex; flex-direction: column; gap: 16px; }
.cch-feat { display: flex; gap: 14px; align-items: flex-start; }
.cch-feat-ic { flex-shrink: 0; display: grid; place-items: center; width: 40px; height: 40px; border-radius: 12px; background: var(--wash); color: var(--brand); }
.cch-feat h4 { margin: 0 0 4px; font-size: 15px; }
.cch-feat p { margin: 0; font-size: 13px; line-height: 1.7; color: var(--ink-2); }
.cch-note { display: flex; align-items: flex-start; gap: 10px; margin: 20px 0; padding: 12px 14px; border-radius: var(--r); background: var(--wash); color: var(--ink-2); font-size: 13px; line-height: 1.7; }
.cch-note svg { flex-shrink: 0; color: var(--brand); margin-top: 2px; }
.cch-note span { font-size: 13px; }


.cch-alert { margin: 0; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--error); color: var(--error); font-size: 13px; }
.cch-success { text-align: center; padding: 32px 8px; }
.cch-success p { margin: 8px 0 0; color: var(--ink-2); line-height: 1.7; }
.cch-success h3 { margin: 14px 0 0; font-size: 18px; line-height: 1.6; }
.cch-success-ic { display: inline-grid; place-items: center; width: 56px; height: 56px; border-radius: 50%; background: var(--brand); color: var(--on-brand); }

.cch-center { display: flex; justify-content: center; }
.cch-coaches { margin-top: 28px; }
.cch-state { display: flex; align-items: center; justify-content: center; gap: 10px; margin: 0; padding: 28px 0; color: var(--ink-2); font-size: 14px; }
.cch-link { border: 0; background: none; padding: 0; color: var(--brand); font: inherit; text-decoration: underline; cursor: pointer; }
.cch-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.cch-coach { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; padding: 20px 16px; border-radius: var(--r); background: var(--surface); border: 1px solid var(--line); color: inherit; text-decoration: none; transition: box-shadow .2s, transform .2s; }
.cch-coach:hover { box-shadow: var(--shadow); transform: translateY(-2px); }
.cch-coach h3 { margin: 8px 0 0; font-size: 15px; }
.cch-av { display: grid; place-items: center; width: 64px; height: 64px; border-radius: 18px; background: var(--wash); color: var(--brand); font-size: 22px; font-weight: 700; object-fit: cover; }
.cch-spec { margin: 0; font-size: 13px; color: var(--ink-2); }
.cch-tags { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; margin-top: 4px; }
.cch-tag { padding: 3px 10px; border-radius: 99px; background: var(--brand); color: var(--on-brand); font-size: 11px; font-weight: 500; }
.cch-tag.soft { background: var(--wash); color: var(--brand); }

.cch-spin { animation: cch-rot 1s linear infinite; }
@keyframes cch-rot { to { transform: rotate(360deg); } }

@media (max-width: 960px) {
  .cch-intro-grid, .cch-split { grid-template-columns: 1fr; }
  .cch-steps { grid-template-columns: repeat(2, 1fr); }
  .cch-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .cch-steps, .cch-grid { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) { .cch * { animation: none !important; } }
`
