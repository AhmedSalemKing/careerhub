import { MaleAvatar } from './MaleAvatar'
import { FemaleAvatar } from './FemaleAvatar'

interface UserAvatarProps {
  user: {
    profileImage?: string | null
    avatar?: string | null
    /** API enum is MALE | FEMALE | OTHER; lowercase is accepted too. */
    gender?: string | null
    name?: string | null
  }
  size?: number
  className?: string
}

/** Photo if the user has one, otherwise a character picked by gender (male is the default). */
export function UserAvatar({ user, size = 40, className = '' }: UserAvatarProps) {
  const photo = user.profileImage || user.avatar
  if (photo) {
    return (
      <img
        src={photo}
        alt={user.name || ''}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size, flexShrink: 0 }}
      />
    )
  }

  const isFemale = String(user.gender ?? '').toLowerCase() === 'female'

  return (
    <div className={`rounded-full overflow-hidden flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      {isFemale ? <FemaleAvatar size={size} /> : <MaleAvatar size={size} />}
    </div>
  )
}
