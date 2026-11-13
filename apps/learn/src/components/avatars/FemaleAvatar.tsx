import { useId } from 'react'

export function FemaleAvatar({ size = 120 }: { size?: number }) {
  const id = `dw-female-${useId().replace(/:/g, '')}`
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-0`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#4C1D95" />
        </radialGradient>
        <clipPath id={`${id}-1`}>
          <rect width="120" height="120" rx="60" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-1)`}>
        <rect width="120" height="120" fill={`url(#${id}-0)`} />
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
  )
}
