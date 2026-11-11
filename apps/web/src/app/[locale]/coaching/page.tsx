'use client'

import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useLocale } from 'next-intl'
import {
  Info, X, Sparkles, ArrowLeft, LogIn, Users, CalendarDays, Star,
  PenLine, UserRound, ShieldCheck, Check, Loader2,
} from 'lucide-react'
import { get, post } from '@/lib/api'

/* ───────────────────────── content (from the reference design) ───────────────────────── */

const DEMO_TEXT = 'موقع تجريبي: الدورات وجهات التدريب والأسعار ولوحات المتابعة بيانات نموذجية، ولا يُرسل أي شيء تُدخله إلى أي جهة.'

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
const MARKETS = ['مصر', 'السعودية']
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

  const [banner, setBanner] = useState(true)
  const [market, setMarket] = useState<string>('مصر')

  const [form, setForm] = useState<FormState>({ name: '', email: '', password: '', cvUrl: '', cvName: '', country: '', field: '', exp: '', langs: ['العربية'], msg: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [phase, setPhase] = useState<Phase>('idle')
  const [errorText, setErrorText] = useState('')
  const [cvUploading, setCvUploading] = useState(false)

  const [showCoaches, setShowCoaches] = useState(false)
  const [coaches, setCoaches] = useState<Consultant[]>([])
  const [coachesLoading, setCoachesLoading] = useState(false)
  const [coachesError, setCoachesError] = useState(false)
  const [coachesLoaded, setCoachesLoaded] = useState(false)

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((p) => ({ ...p, [k]: v }))

  const pickMarket = (m: string) => {
    setMarket(m)
    setForm((p) => (p.country ? p : { ...p, country: m === 'مصر' ? 'مصر' : 'السعودية' }))
  }

  const toggleLang = (l: string) =>
    setForm((p) => ({ ...p, langs: p.langs.includes(l) ? p.langs.filter((x) => x !== l) : [...p.langs, l] }))

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

      await post(REGISTER_ENDPOINT, payload)
      setPhase('sent')
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

      {/* A) DEMO BANNER */}
      {banner && (
        <div className="cch-demo" role="note">
          <div className="cch-in cch-demo-row">
            <Info size={18} aria-hidden="true" />
            <p>{DEMO_TEXT}</p>
            <button type="button" className="cch-icon-btn" aria-label="إغلاق" onClick={() => setBanner(false)}>
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* B) INTRO */}
      <section className="cch-band cch-intro-band">
        <div className="cch-bg" aria-hidden="true"><span className="cch-dots" /><span className="cch-b1" /><span className="cch-b2" /></div>
        <div className="cch-in cch-intro-grid">
          <div className="cch-copy">
            <span className="cch-eyebrow">للمرشدين</span>
            <h1>للمرشدين</h1>
            <p className="cch-lede">شارك خبرتك مع المتعلّمين في اللحظات التي يصنع فيها الإرشاد الفرق الأكبر.</p>
            <p className="cch-pill"><Sparkles size={16} aria-hidden="true" />مرونة كاملة، أجر عن كل جلسة، بالعربية أو الإنجليزية.</p>

            <div className="cch-market" role="group" aria-label="السوق">
              {MARKETS.map((m) => (
                <button key={m} type="button" className={`cch-seg${market === m ? ' on' : ''}`} aria-pressed={market === m} onClick={() => pickMarket(m)}>{m}</button>
              ))}
            </div>

            <div className="cch-actions">
              <a className="cch-cta primary" href="#mentor-apply" onClick={(e) => { e.preventDefault(); scrollTo('mentor-apply') }}>
                قدّم كمرشد<ArrowLeft size={18} aria-hidden="true" />
              </a>
              <a className="cch-cta ghost" href="#mentor-portal" onClick={(e) => { e.preventDefault(); scrollTo('mentor-portal') }}>افتح بوابة المرشدين</a>
            </div>
          </div>

          <div className="cch-media" aria-hidden="true">
            <div className="cch-scene">
              <span className="cch-orb o1" /><span className="cch-orb o2" />
              <div className="cch-duo">
                <span className="cch-face">م</span>
                <span className="cch-face alt">س</span>
              </div>
            </div>
            {/* C) LIVE CLINIC BANNER */}
            <div className="cch-live">
              <span className="cch-live-dot" />
              <div>
                <p className="cch-live-label">العيادات الجماعية</p>
                <p className="cch-live-title">الأحد · 7:00 مساءً</p>
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
        <div className="cch-in cch-split">
          <div className="cch-split-media" aria-hidden="true">
            <div className="cch-scene tall"><span className="cch-orb o1" /><span className="cch-orb o2" /><div className="cch-duo"><span className="cch-face">م</span></div></div>
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
      <section className="cch-band alt" id="mentor-apply">
        <div className="cch-in cch-split top">
          <div>
            <div className="cch-head"><span className="cch-eyebrow">قدّم كمرشد</span><h2>من نبحث عنه</h2></div>
            <ul className="cch-checks">
              {WHO.map((x) => (<li key={x}><Check size={18} aria-hidden="true" /><span>{x}</span></li>))}
            </ul>
          </div>

          <div className="cch-panel">
            {phase === 'sent' ? (
              <div className="cch-success" role="status">
                <span className="cch-success-ic"><Check size={28} aria-hidden="true" /></span>
                <h3>تم إرسال طلبك، في انتظار موافقة الإدارة</h3>
              </div>
            ) : (
              <>
                <h2>طلب الانضمام كمرشد</h2>
                <form className="cch-form" onSubmit={onSubmit} noValidate>
                  <div className={`cch-field${errors.name ? ' bad' : ''}`}>
                    <label htmlFor="m-name">الاسم الكامل</label>
                    <input id="m-name" type="text" value={form.name} onChange={(e) => setField('name', e.target.value)} aria-invalid={!!errors.name} />
                    {errors.name && <span className="cch-msg">{errors.name}</span>}
                  </div>
                  <div className={`cch-field${errors.email ? ' bad' : ''}`}>
                    <label htmlFor="m-email">البريد الإلكتروني</label>
                    <input id="m-email" type="email" autoComplete="email" value={form.email} onChange={(e) => setField('email', e.target.value)} aria-invalid={!!errors.email} />
                    {errors.email && <span className="cch-msg">{errors.email}</span>}
                  </div>
                  <div className={`cch-field${errors.password ? ' bad' : ''}`}>
                    <label htmlFor="m-pass">كلمة المرور</label>
                    <input id="m-pass" type="password" autoComplete="new-password" value={form.password} onChange={(e) => setField('password', e.target.value)} aria-invalid={!!errors.password} />
                    {errors.password && <span className="cch-msg">{errors.password}</span>}
                  </div>
                  <div className={`cch-field${errors.cv ? ' bad' : ''}`}>
                    <label htmlFor="m-cv">السيرة الذاتية</label>
                    <input id="m-cv" type="file" accept=".pdf,.doc,.docx" onChange={onCvChange} disabled={cvUploading} aria-invalid={!!errors.cv} />
                    <span className="cch-hint">
                      {cvUploading ? 'جارٍ رفع الملف…' : form.cvName ? form.cvName : 'PDF أو Word — حجم أقصى 5MB'}
                    </span>
                    {errors.cv && <span className="cch-msg">{errors.cv}</span>}
                  </div>
                  <div className={`cch-field${errors.country ? ' bad' : ''}`}>
                    <label htmlFor="m-country">الدولة</label>
                    <select id="m-country" value={form.country} onChange={(e) => setField('country', e.target.value)} aria-invalid={!!errors.country}>
                      <option value="" />
                      {COUNTRIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                    </select>
                    {errors.country && <span className="cch-msg">{errors.country}</span>}
                  </div>
                  <div className={`cch-field${errors.field ? ' bad' : ''}`}>
                    <label htmlFor="m-field">المجال</label>
                    <select id="m-field" value={form.field} onChange={(e) => setField('field', e.target.value)} aria-invalid={!!errors.field}>
                      <option value="" />
                      {FIELDS.map((c) => (<option key={c} value={c}>{c}</option>))}
                    </select>
                    {errors.field && <span className="cch-msg">{errors.field}</span>}
                  </div>
                  <div className={`cch-field${errors.exp ? ' bad' : ''}`}>
                    <label htmlFor="m-exp">سنوات الخبرة</label>
                    <select id="m-exp" value={form.exp} onChange={(e) => setField('exp', e.target.value)} aria-invalid={!!errors.exp}>
                      <option value="" />
                      {EXPERIENCE.map((c) => (<option key={c} value={c}>{c}</option>))}
                    </select>
                    {errors.exp && <span className="cch-msg">{errors.exp}</span>}
                  </div>
                  <div className="cch-field">
                    <span className="cch-label">لغات الإرشاد</span>
                    <div className="cch-checkset">
                      {LANGS.map((l) => (
                        <label key={l}><input type="checkbox" checked={form.langs.includes(l)} onChange={() => toggleLang(l)} />{l}</label>
                      ))}
                    </div>
                  </div>
                  <div className="cch-field full">
                    <label htmlFor="m-msg">هل هناك ما تودّ إضافته؟</label>
                    <textarea id="m-msg" value={form.msg} onChange={(e) => setField('msg', e.target.value)} />
                  </div>

                  {phase === 'error' && <p className="cch-alert full" role="alert">{errorText}</p>}

                  <div className="full">
                    <button type="submit" className="cch-cta primary block" disabled={phase === 'sending'}>
                      {phase === 'sending' ? <Loader2 size={18} className="cch-spin" aria-hidden="true" /> : null}
                      إرسال الطلب
                      {phase !== 'sending' && <ArrowLeft size={18} aria-hidden="true" />}
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

.cch-demo { background: var(--wash); border-bottom: 1px solid var(--line); color: var(--ink-2); }
.cch-demo-row { display: flex; align-items: center; gap: 10px; padding-block: 10px; }
.cch-demo-row p { flex: 1; margin: 0; font-size: 13px; line-height: 1.6; color: var(--ink-2); }
.cch-icon-btn { display: inline-flex; padding: 6px; border: 0; border-radius: 8px; background: transparent; color: var(--ink-2); cursor: pointer; }
.cch-icon-btn:hover { background: var(--wash-2); }

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
.cch-market { display: inline-flex; margin-top: 16px; padding: 3px; border-radius: 99px; background: var(--surface); border: 1px solid var(--line); }
.cch-seg { padding: 5px 16px; border: 0; border-radius: 99px; background: transparent; color: var(--ink-2); font: inherit; font-size: 12px; cursor: pointer; }
.cch-seg.on { background: var(--brand); color: var(--on-brand); }
.cch-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px; }

.cch-cta { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; border-radius: 10px; border: 1px solid var(--brand); font: inherit; font-size: 14px; font-weight: 600; text-decoration: none; cursor: pointer; transition: background .15s, box-shadow .15s; }
.cch-cta.primary { background: var(--brand); color: var(--on-brand); }
.cch-cta.primary:hover { background: var(--brand-hover); }
.cch-cta.ghost { background: transparent; color: var(--brand); }
.cch-cta.ghost:hover { background: var(--wash); }
.cch-cta.block { width: 100%; }
.cch-cta:disabled { opacity: .7; cursor: wait; }

.cch-media { position: relative; min-height: 300px; }
.cch-scene { position: relative; height: 300px; border-radius: var(--r-lg); overflow: hidden; background: linear-gradient(135deg, var(--wash), var(--wash-2)); border: 1px solid var(--line); box-shadow: var(--shadow); display: flex; align-items: center; justify-content: center; }
.cch-scene.tall { height: 360px; }
.cch-orb { position: absolute; border-radius: 50%; background: var(--surface); opacity: .35; }
.cch-orb.o1 { width: 180px; height: 180px; inset-block-start: -50px; inset-inline-end: -40px; }
.cch-orb.o2 { width: 120px; height: 120px; inset-block-end: -30px; inset-inline-start: 20px; }
.cch-duo { position: relative; display: flex; gap: 14px; }
.cch-face { display: grid; place-items: center; width: 96px; height: 96px; border-radius: 28px; background: var(--brand); color: var(--on-brand); font-size: 38px; font-weight: 700; box-shadow: var(--shadow); }
.cch-face.alt { background: var(--night-2); color: var(--night-ink); }
.cch-live { position: absolute; inset-block-end: -20px; inset-inline-start: -14px; display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: var(--r); background: var(--surface); border: 1px solid var(--line); box-shadow: var(--shadow); }
.cch-live p { margin: 0; }
.cch-live-label { font-size: 11px; color: var(--ink-3); }
.cch-live-title { font-size: 13px; font-weight: 700; color: var(--ink); }
.cch-live-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--error); box-shadow: 0 0 0 0 var(--error); animation: cch-pulse 1.8s infinite; }
@keyframes cch-pulse { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--error) 50%, transparent); } 100% { box-shadow: 0 0 0 10px transparent; } }

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

.cch-checks { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 14px; }
.cch-checks li { display: flex; align-items: flex-start; gap: 10px; color: var(--ink); }
.cch-checks li span { font-size: 17px; line-height: 1.6; }
.cch-checks svg { flex-shrink: 0; margin-top: 4px; color: var(--brand); }

.cch-panel { padding: 24px; border-radius: var(--r-lg); background: var(--surface); border: 1px solid var(--line); box-shadow: var(--shadow); }
.cch-panel h2 { margin: 0 0 16px; font-size: 20px; font-weight: 800; }
.cch-form { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.cch-form .full { grid-column: 1 / -1; }
.cch-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.cch-field label, .cch-label { font-size: 13px; font-weight: 600; color: var(--ink); }
.cch-field input[type="text"], .cch-field input[type="email"], .cch-field input[type="password"], .cch-field input[type="file"], .cch-field select, .cch-field textarea { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--line); background: var(--bg); color: var(--ink); font: inherit; font-size: 14px; outline: none; }
.cch-field textarea { min-height: 96px; resize: vertical; }
.cch-field input:focus, .cch-field select:focus, .cch-field textarea:focus { border-color: var(--brand); box-shadow: 0 0 0 3px var(--wash); }
.cch-field.bad input, .cch-field.bad select, .cch-field.bad textarea { border-color: var(--error); }
.cch-hint { font-size: 12px; color: var(--ink-3); }
.cch-msg { font-size: 12px; color: var(--error); }
.cch-checkset { display: flex; gap: 18px; padding-block: 8px; }
.cch-checkset label { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 400; cursor: pointer; }
.cch-alert { margin: 0; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--error); color: var(--error); font-size: 13px; }
.cch-success { text-align: center; padding: 32px 8px; }
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
  .cch-live { inset-inline-start: 8px; }
}
@media (max-width: 600px) {
  .cch-steps, .cch-grid, .cch-form { grid-template-columns: 1fr; }
  .cch-scene, .cch-scene.tall { height: 240px; }
}
@media (prefers-reduced-motion: reduce) { .cch * { animation: none !important; } }
`
