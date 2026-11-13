/**
 * Market (KSA / EG) configuration shared by client components and the AI route.
 * Pure data, no React and no browser APIs, so it is safe to import anywhere.
 *
 * The persisted source of truth is the `market` cookie (SAR | EGP) that api.ts,
 * middleware.ts and the server components already read. Market ('KSA' | 'EG')
 * is the UI-facing name for the same choice.
 */

export type Market = 'KSA' | 'EG'
export type Lang = 'ar' | 'en'

export const MARKETS: readonly Market[] = ['KSA', 'EG']
export const DEFAULT_MARKET: Market = 'KSA'
export const MARKET_STORAGE_KEY = 'deveway_market'

type Bilingual = { ar: string; en: string }

export interface MarketConfigEntry {
  country: Market
  /** Value of the legacy `market` cookie. */
  cookie: 'SAR' | 'EGP'
  currency: 'SAR' | 'EGP'
  currencySymbol: Bilingual
  currencyName: Bilingual
  vision: { show: boolean; name: Bilingual; description: Bilingual }
  salaryUnit: Bilingual
  /** Approximate EGP per SAR. Only for rough display of base-currency (SAR) figures; never used for billing. */
  salaryMultiplier: number
  jobMarketNote: Bilingual
  /** Injected into every AI prompt so answers use the right currency, jobs and vision. */
  aiMarketContext: Bilingual
  /** One-line target-market statement for the final assessment analysis prompt. */
  aiTargetMarket: Bilingual
  flag: string
  label: string
}

export const MARKET_CONFIG: Record<Market, MarketConfigEntry> = {
  KSA: {
    country: 'KSA',
    cookie: 'SAR',
    currency: 'SAR',
    currencySymbol: { ar: 'ر.س', en: 'SAR' },
    currencyName: { ar: 'ريال سعودي', en: 'Saudi Riyal' },
    vision: {
      show: true,
      name: { ar: 'رؤية السعودية 2030', en: 'Saudi Vision 2030' },
      description: {
        ar: 'متوافق مع أهداف رؤية المملكة العربية السعودية 2030',
        en: "Aligned with Saudi Arabia's Vision 2030 national goals",
      },
    },
    salaryUnit: { ar: 'شهريًا', en: 'per month' },
    salaryMultiplier: 1,
    jobMarketNote: { ar: 'سوق العمل السعودي', en: 'Saudi Job Market' },
    aiMarketContext: {
      ar: 'أنت تتحدث مع مستخدم في السوق السعودي. اذكر الرواتب بالريال السعودي (ر.س). أشر لفرص العمل في السعودية. اذكر رؤية السعودية 2030 عند الملاءمة.',
      en: 'You are speaking with a user in the Saudi Arabian market. Mention salaries in Saudi Riyals (SAR). Reference job opportunities in Saudi Arabia. Mention Saudi Vision 2030 when relevant.',
    },
    aiTargetMarket: {
      ar: 'السعودية - الرواتب بالريال السعودي (ر.س)',
      en: 'Saudi Arabia - salaries in Saudi Riyals (SAR)',
    },
    flag: '🇸🇦',
    label: 'KSA',
  },
  EG: {
    country: 'EG',
    cookie: 'EGP',
    currency: 'EGP',
    currencySymbol: { ar: 'ج.م', en: 'EGP' },
    currencyName: { ar: 'جنيه مصري', en: 'Egyptian Pound' },
    vision: {
      show: true,
      name: { ar: 'رؤية مصر 2030', en: 'Egypt Vision 2030' },
      description: {
        ar: 'متوافق مع أهداف رؤية مصر 2030 للتنمية المستدامة',
        en: "Aligned with Egypt's Vision 2030 sustainable development goals",
      },
    },
    salaryUnit: { ar: 'شهريًا', en: 'per month' },
    salaryMultiplier: 15,
    jobMarketNote: { ar: 'سوق العمل المصري', en: 'Egyptian Job Market' },
    aiMarketContext: {
      ar: 'أنت تتحدث مع مستخدم في السوق المصري. اذكر الرواتب بالجنيه المصري (ج.م). أشر لفرص العمل في مصر. اذكر رؤية مصر 2030 عند الملاءمة.',
      en: 'You are speaking with a user in the Egyptian market. Mention salaries in Egyptian Pounds (EGP). Reference job opportunities in Egypt. Mention Egypt Vision 2030 when relevant.',
    },
    aiTargetMarket: {
      ar: 'مصر - الرواتب بالجنيه المصري (ج.م)',
      en: 'Egypt - salaries in Egyptian Pounds (EGP)',
    },
    flag: '🇪🇬',
    label: 'EG',
  },
}

export const toLang = (locale: unknown): Lang => (locale === 'en' ? 'en' : 'ar')
export const toMarket = (v: unknown): Market => (v === 'EG' || v === 'EGP' ? 'EG' : 'KSA')

/** Server-side: the system-prompt block for a (possibly untrusted) market + locale pair. */
export function aiMarketContextFor(market: unknown, locale: unknown): string {
  return MARKET_CONFIG[toMarket(market)].aiMarketContext[toLang(locale)]
}

/** Base-currency (SAR) amount -> approximate amount in the market's currency. */
export const toMarketAmount = (sar: number, market: Market): number =>
  market === 'EG' ? Math.round(sar * MARKET_CONFIG.EG.salaryMultiplier) : sar
