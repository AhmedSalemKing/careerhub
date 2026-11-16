'use client'

import { useId } from 'react'
import { SmartImage } from './SmartImage'

export interface UserAvatarProps {
  user: {
    /** Profile photo URL (`avatar` and `profileImage` are accepted as aliases). */
    photo?: string | null
    avatar?: string | null
    profileImage?: string | null
    /** API enum is MALE | FEMALE | OTHER; any casing is accepted. */
    gender?: string | null
    name?: string | null
  } | null | undefined
  /** Pixel size (width and height). Defaults to 40, the navbar size. */
  size?: number
  className?: string
}

/**
 * Profile photo when the user has one, otherwise a character picked by gender.
 * Female gets the female character; everything else (male, unknown, null) gets the male one,
 * so an initial letter is never shown. SVG ids get a per-instance suffix so many avatars on one page never clash.
 */
export function UserAvatar({ user, size = 40, className = '' }: UserAvatarProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const photo = (user?.photo || user?.profileImage || user?.avatar || '').trim()
  const name = (user?.name ?? '').trim()
  const isFemale = String(user?.gender ?? '').toLowerCase() === 'female'

  const wrapper = `rounded-full overflow-hidden flex-shrink-0 ${className}`
  const wrapperStyle = { width: size, height: size }

  if (photo) {
    return (
      <SmartImage
        src={photo}
        alt={name}
        width={size}
        height={size}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }

  if (isFemale) {
    const g = `dw-f-${uid}-0`
    const c = `dw-f-${uid}-1`
    return (
      <span className={wrapper} style={{ ...wrapperStyle, display: 'inline-block' }}>
        <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Female avatar" style={{ display: 'block' }}>
          <defs>
            <radialGradient id={g} cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#6B3A9C" /><stop offset="100%" stopColor="#3D1A6E" /></radialGradient>
            <clipPath id={c}><rect width="120" height="120" rx="60" /></clipPath>
          </defs>
          <g clipPath={`url(#${c})`}>
            <rect width="120" height="120" fill={`url(#${g})`} />
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
      </span>
    )
  }

  const g = `dw-m-${uid}-0`
  const c = `dw-m-${uid}-1`
  return (
    <span className={wrapper} style={{ ...wrapperStyle, display: 'inline-block' }}>
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Male avatar" style={{ display: 'block' }}>
        <defs>
          <radialGradient id={g} cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#3B2F7A" /><stop offset="100%" stopColor="#1A1040" /></radialGradient>
          <clipPath id={c}><rect width="120" height="120" rx="60" /></clipPath>
        </defs>
        <g clipPath={`url(#${c})`}>
          <rect width="120" height="120" fill={`url(#${g})`} />
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
    </span>
  )
}

export default UserAvatar
