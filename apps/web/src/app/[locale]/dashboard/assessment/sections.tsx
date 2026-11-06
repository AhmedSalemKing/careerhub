import type { ReactElement } from 'react'
import { RASHEED_AVATAR } from '../../../components/characters'

const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  style: { width: 20, height: 20 },
}

/** One inline SVG icon per assessment section, in section order. */
export const SECTION_SVGS: readonly ReactElement[] = [
  // star
  <svg key="s0" {...svgProps}><path d="m12 3 2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.4l-5.6 2.9 1.1-6.2L3 9.7l6.2-.9L12 3Z" /></svg>,
  // graduation cap
  <svg key="s1" {...svgProps}><path d="M2 9l10-5 10 5-10 5L2 9ZM6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5M22 9v6" /></svg>,
  // briefcase
  <svg key="s2" {...svgProps}><path d="M4 7h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1ZM9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" /></svg>,
  // heart
  <svg key="s3" {...svgProps}><path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.3a4.2 4.2 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z" /></svg>,
  // sparkle
  <svg key="s4" {...svgProps}><path d="M12 3l1.9 5.6 5.6 1.9-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9L12 3Z" /></svg>,
  // target
  <svg key="s5" {...svgProps}><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" /></svg>,
]

/** Shown in place of the section icon once that section is complete. */
export const CHECK_SVG = (
  <svg {...svgProps}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
)

/** Section labels in display order (kept in step with PHASES in AIInterviewPage). */
export const SECTION_LABELS = [
  'فهم المستخدم',
  'الاهتمامات المهنية',
  'المهارات والقدرات',
  'السلوك المهني',
  'الدوافع وبيئة العمل',
  'الجاهزية المهنية',
] as const

// Same artwork as the round avatar, with the crop widened to show the whole figure.
const RASHEED_FIGURE = RASHEED_AVATAR.replace('viewBox="45 42 70 70"', 'viewBox="28 20 104 152"')

/** Full-height Rasheed figure for the intro screen. */
export function RasheedFigure() {
  return <span className="ri-char" aria-hidden="true" dangerouslySetInnerHTML={{ __html: RASHEED_FIGURE }} />
}
