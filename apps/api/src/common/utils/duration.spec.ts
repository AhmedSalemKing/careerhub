import { calculateActualDuration, snapDurationToPackage } from './duration'

describe('snapDurationToPackage', () => {
  it('bills the actual time for very short sessions', () => {
    expect(snapDurationToPackage(5, 60)).toBe(5)
    expect(snapDurationToPackage(19, 60)).toBe(19)
  })

  it('rounds a short session up to 30', () => {
    expect(snapDurationToPackage(20, 60)).toBe(30)
    expect(snapDurationToPackage(34, 60)).toBe(30)
  })

  it('bills the booked length when the session is within tolerance (60 booked)', () => {
    expect(snapDurationToPackage(35, 60)).toBe(60)
    expect(snapDurationToPackage(60, 60)).toBe(60)
    expect(snapDurationToPackage(89, 60)).toBe(60)
  })

  it('bills 90 when a 60 minute booking runs 90 to 119 minutes', () => {
    expect(snapDurationToPackage(90, 60)).toBe(90)
    expect(snapDurationToPackage(119, 60)).toBe(90)
  })

  it('follows the booked length for other packages', () => {
    expect(snapDurationToPackage(70, 90)).toBe(90)
    expect(snapDurationToPackage(45, 90)).toBe(60)
    expect(snapDurationToPackage(55, 30)).toBe(30)
    expect(snapDurationToPackage(70, 30)).toBe(60)
  })

  it('keeps counting whole half hours for very long sessions', () => {
    expect(snapDurationToPackage(120, 60)).toBe(120)
    expect(snapDurationToPackage(130, 90)).toBe(120)
  })

  it('falls back to a 60 minute booking when none is given', () => {
    expect(snapDurationToPackage(50, 0)).toBe(60)
  })
})

describe('calculateActualDuration', () => {
  it('returns whole minutes', () => {
    expect(calculateActualDuration(new Date('2026-01-01T10:00:00Z'), new Date('2026-01-01T11:05:20Z'))).toBe(65)
  })

  it('returns null when a timestamp is missing', () => {
    expect(calculateActualDuration(null, new Date())).toBeNull()
    expect(calculateActualDuration(new Date(), undefined)).toBeNull()
  })
})
