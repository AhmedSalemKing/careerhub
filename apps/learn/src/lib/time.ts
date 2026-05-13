import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import 'dayjs/locale/ar'

dayjs.extend(relativeTime)
dayjs.extend(localizedFormat)
dayjs.extend(utc)
dayjs.extend(timezone)

export function formatDate(date: string | Date, locale = 'en'): string {
  const d = dayjs(date)
  if (locale === 'ar') {
    return d.locale('ar').format('D MMMM YYYY  hh:mm A')
  }
  return d.format('MMMM D, YYYY  hh:mm A')
}

export function formatDateOnly(date: string | Date, locale = 'en'): string {
  const d = dayjs(date)
  if (locale === 'ar') {
    return d.locale('ar').format('D MMMM YYYY')
  }
  return d.format('MMMM D, YYYY')
}

export function formatTimeOnly(date: string | Date): string {
  return dayjs(date).format('hh:mm A')
}

export function formatRelative(date: string | Date, locale = 'en'): string {
  return dayjs(date).locale(locale === 'ar' ? 'ar' : 'en').fromNow()
}

export function formatCertDate(date: string | Date, locale = 'en'): string {
  if (locale === 'ar') {
    return 'صدرت في ' + dayjs(date).locale('ar').format('D MMMM YYYY')
  }
  return 'Issued on ' + dayjs(date).format('MMMM D, YYYY')
}

export function getNow(): string {
  return dayjs().format('hh:mm:ss A')
}
