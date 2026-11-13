'use client'

import type { TrackVision } from '../../lib/tracks'
import { useMarket } from '../contexts/MarketContext'

/* Flags are national artwork, so their colours are the flags' own, not theme tokens. */
export function Flag({ code }: { code: TrackVision }) {
  return code === 'KSA' ? (
    <svg viewBox="0 0 30 20" width="22" height="15" aria-hidden="true">
      <rect width="30" height="20" rx="2" fill="#006C35" />
      <path d="M7 8.2c1.2-1.6 2.4 1 3.6-.4s1.6-1.6 2.6-.2 1.8.6 2.8-.6 1.6 1.4 3 .2 1.8-.6 3.6-.8" stroke="#fff" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M8 13.4h13.5l-1.4 1.2M8 13.4l-.8-.9" stroke="#fff" strokeWidth="1.1" fill="none" strokeLinecap="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 30 20" width="22" height="15" aria-hidden="true">
      <rect width="30" height="6.67" rx="2" fill="#CE1126" />
      <rect y="6.67" width="30" height="6.67" fill="#fff" />
      <rect y="13.33" width="30" height="6.67" rx="2" fill="#000" />
      <circle cx="15" cy="10" r="2.5" fill="#C09300" />
    </svg>
  )
}

const LABEL = {
  KSA: { ar: 'رؤية السعودية 2030', en: 'Saudi Vision 2030', logo: '/images/ro2ya.png' },
  EG: { ar: 'رؤية مصر 2030', en: 'Egypt Vision 2030', logo: '/images/egypt-vision.webp' },
} as const

/** Logo + flag + name for each national vision a track is aligned with. */
/** Shows ONLY the visitor's selected market's vision (never both). Admin screens pass `all` to see every vision a track carries. */
export function VisionBadges({ vision, locale, compact, all }: { vision: readonly string[]; locale: string; compact?: boolean; all?: boolean }) {
  const { market } = useMarket()
  const items = (['KSA', 'EG'] as const).filter((v) => vision.includes(v) && (all || v === market))
  if (items.length === 0) return null
  return (
    <div className="dw-vision-badges">
      {items.map((v) => (
        <span key={v} className={'dw-vision-badge' + (compact ? ' sm' : '')}>
          <img src={LABEL[v].logo} alt="" loading="lazy" />
          <Flag code={v} />
          <span>{locale === 'ar' ? LABEL[v].ar : LABEL[v].en}</span>
        </span>
      ))}
    </div>
  )
}

const DEFAULT_DESC = {
  KSA: { ar: 'التحول الرقمي ممكّن أساسي لرؤية 2030.', en: 'Digital transformation is a key enabler of Vision 2030.' },
  EG: { ar: 'ينسجم هذا المسار مع أولويات رؤية مصر 2030 في التحول الرقمي وبناء المهارات.', en: "This track fits Egypt Vision 2030's priorities in digital transformation and skills." },
} as const

/** "Vision 2030 alignment" block of the track page: one card per selected vision. */
export function VisionBox({
  vision, descKSA, descEG, jobTitles, locale, all,
}: { vision: readonly string[]; descKSA?: string | null; descEG?: string | null; jobTitles: string[]; locale: string; all?: boolean }) {
  const ar = locale === 'ar'
  const { market } = useMarket()
  const cards = (['KSA', 'EG'] as const).filter((v) => vision.includes(v) && (all || v === market))
  if (cards.length === 0) return null
  return (
    <div className="vision-box">
      <h2>{ar ? 'التوافق مع رؤية 2030' : 'Vision 2030 alignment'}</h2>
      <p className="muted">{all ? (ar ? 'كيف يرتبط هذا المسار المهني بالأولويات الوطنية في السعودية ومصر.' : 'How this career path relates to national priorities in Saudi Arabia and Egypt.') : (ar ? `كيف يرتبط هذا المسار المهني بأولويات ${market === 'EG' ? 'مصر' : 'السعودية'} الوطنية.` : `How this career path relates to ${market === 'EG' ? 'Egypt' : 'Saudi Arabia'}'s national priorities.`)}</p>
      {cards.map((v) => {
        const custom = ar ? (v === 'KSA' ? descKSA : descEG) : null
        return (
          <div key={v} className="v-card wide">
            <span className={'v-logo lg ' + (v === 'KSA' ? 'sa' : 'eg')}>
              <img src={LABEL[v].logo} alt={LABEL[v][ar ? 'ar' : 'en']} loading="lazy" />
            </span>
            <div>
              <p className="v-name">
                <span className="flag" role="img" aria-label={v === 'KSA' ? (ar ? 'السعودية' : 'Saudi Arabia') : ar ? 'مصر' : 'Egypt'}><Flag code={v} /></span>
                {LABEL[v][ar ? 'ar' : 'en']}
              </p>
              <p>{custom || DEFAULT_DESC[v][ar ? 'ar' : 'en']}</p>
              {jobTitles.length > 0 && <p className="muted small">{ar ? 'الوظائف المتوافقة: ' : 'Aligned jobs: '}{jobTitles.join(' · ')}</p>}
            </div>
          </div>
        )
      })}
      <p className="muted small" style={{ marginTop: 10 }}>
        {ar ? 'تتبع شارات رؤية 2030 السوق الذي اخترته أعلى الصفحة.' : 'Vision 2030 badges follow the market you selected at the top of the page.'}
      </p>
      <p className="note">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v5M12 8h.01" />
        </svg>
        <span>{ar ? 'يعكس التوافق قراءة DeveWay للأولويات الوطنية المعلنة، وليس اعتمادًا رسميًا.' : "Alignment reflects DeveWay's reading of announced national priorities, not an official endorsement."}</span>
      </p>
    </div>
  )
}
