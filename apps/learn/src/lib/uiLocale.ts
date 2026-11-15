/**
 * Page language for module-level helpers that cannot call hooks.
 * The root layout sets <html lang={locale}>; before hydration (server) it defaults to Arabic.
 */
export const uiIsAr = (): boolean => typeof document === 'undefined' || document.documentElement.lang !== 'en'

/** Intl locale tag for the current page language. */
export const uiTag = (): string => (uiIsAr() ? 'ar-EG' : 'en-US')

/** Server-provided money strings are Arabic ("22,504 EGP" written with Arabic digits and ج.م). Re-render them for English. */
export function localizeDisplay(s: string): string {
  if (uiIsAr()) return s
  return s
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/\u066C/g, ',')
    .replace(/\u066B/g, '.')
    .replace(/ج\.م/g, 'EGP')
    .replace(/ر\.س/g, 'SAR')
    .replace(/مجاني/g, 'Free')
}
