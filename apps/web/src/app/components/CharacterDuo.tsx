import type { CSSProperties } from 'react'
import { CHARACTERS, RASHEED_AVATAR, type CharacterId } from './characters'

/**
 * Illustrated scene with one or two characters (Saudi "sa*" / Egyptian "eg*"),
 * ported from the DeveWay design file. The SVG markup is static, trusted artwork
 * from `characters.ts`; labels come from the caller so they stay translated.
 */
export function CharacterScene({
  ids,
  label,
  flagSa,
  flagEg,
  top = false,
}: {
  ids: readonly CharacterId[]
  /** Accessible description of the illustration. */
  label: string
  flagSa?: string
  flagEg?: string
  /** Persona-card layout: characters sit in the upper area, text overlays the lower gradient. */
  top?: boolean
}) {
  return (
    <div className={`dw-scene${top ? ' top' : ''}`} role="img" aria-label={label}>
      <span className="sc-orb o1" />
      <span className="sc-orb o2" />
      <div className={`dw-duo n${ids.length}`}>
        {ids.map((id, i) => {
          const isSa = id.startsWith('sa')
          const flag = isSa ? flagSa : flagEg
          return (
            <span key={id} className="dw-duo-p" style={{ '--i': i } as CSSProperties}>
              <span className="dw-char" dangerouslySetInnerHTML={{ __html: CHARACTERS[id] }} />
              {flag && <em className={`dw-duo-flag ${isSa ? 'sa' : 'eg'}`}>{flag}</em>}
            </span>
          )
        })}
      </div>
    </div>
  )
}

/** Round avatar of a single character. */
export function CharacterAvatar({ id, size = 40 }: { id: CharacterId; size?: number }) {
  return (
    <span
      className="dw-char-av"
      style={{ width: size, height: size }}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: CHARACTERS[id] }}
    />
  )
}

/** Overlapping row of round avatars. */
export function CharacterCast({ ids, size = 34 }: { ids: readonly CharacterId[]; size?: number }) {
  return (
    <span className="dw-cast">
      {ids.map((id) => (
        <CharacterAvatar key={id} id={id} size={size} />
      ))}
    </span>
  )
}

/** Rasheed, DeveWay's AI career guide (idle pose). */
export function RasheedAvatar({ size = 18 }: { size?: number }) {
  return (
    <span
      className="dw-rasheed"
      style={{ width: size, height: size }}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: RASHEED_AVATAR }}
    />
  )
}
