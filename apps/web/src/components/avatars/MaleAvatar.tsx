import { useId } from 'react'

export function MaleAvatar({ size = 120 }: { size?: number }) {
  const id = `dw-male-${useId().replace(/:/g, '')}`
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-0`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3B2F7A" />
          <stop offset="100%" stopColor="#1A1040" />
        </radialGradient>
        <clipPath id={`${id}-1`}>
          <rect width="120" height="120" rx="60" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-1)`}>
        <rect width="120" height="120" fill={`url(#${id}-0)`} />
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
  )
}
