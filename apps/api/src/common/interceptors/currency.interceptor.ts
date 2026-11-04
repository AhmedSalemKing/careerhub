import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { mergeMap } from 'rxjs/operators'
import { ExchangeRateService } from '../../exchange-rate/exchange-rate.service'

const NON_MONETARY_KEYS = new Set([
  'id', 'userId', 'courseId', 'sessionId', 'orderId', 'instructorId',
  'count', 'totalCount', 'totalPages', 'pageCount', 'page', 'limit',
  'rate', 'rating', 'completionRate', 'successRate', 'passRate',
  'duration', 'percentage', 'progress', 'order', 'index', 'rank',
  'score', 'version', 'status', 'code', 'level', 'step', 'attempt',
])

function isMonetaryField(key: string): boolean {
  if (NON_MONETARY_KEYS.has(key)) return false
  const k = key.toLowerCase()
  return (
    k.includes('price') || k.includes('amount') || k.includes('balance') ||
    k.includes('earning') || k.includes('revenue') || k.includes('topup') ||
    k.includes('withdraw') || k.includes('payout') || k.includes('commission') ||
    k.includes('refund') || k.includes('salary') || k.includes('payment') ||
    k.includes('wallet') || k.includes('total') || k.includes('paid') ||
    k === 'fee' || k === 'cost' || k.includes('rate') ||
    k.includes('ordervalue') || k.includes('grossvalue') || k.includes('netvalue')
  )
}

function formatEGP(sarAmount: number, rate: number): string {
  const egp = Math.round(sarAmount * rate)
  return `${egp.toLocaleString('ar-EG')} ج.م`
}

function formatSAR(sarAmount: number): string {
  return `${sarAmount.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س`
}

// Display string for an amount stored in `stored` currency, shown to the viewer's market.
//   EGP + Egypt -> as is | EGP + other -> SAR | SAR + Egypt -> EGP | SAR + other -> as is
//   any other currency (USD, ...) -> unchanged, labelled with its own code
function formatForMarket(amount: number, stored: string, rate: number, isEgypt: boolean): string {
  if (stored === 'EGP') {
    return isEgypt
      ? `${Math.round(amount).toLocaleString('ar-EG')} ج.م`
      : formatSAR(Math.round(amount / rate))
  }
  if (stored === 'SAR') {
    return isEgypt ? formatEGP(amount, rate) : formatSAR(amount)
  }
  return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${stored}`
}

function transformValue(obj: unknown, rate: number, isEgypt: boolean, depth = 0): unknown {
  if (depth > 15 || obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj
  // Dates have no own enumerable keys; rebuilding them as plain objects yields {}
  if (obj instanceof Date) return obj.toISOString()

  if (Array.isArray(obj)) {
    return obj.map((item) => transformValue(item, rate, isEgypt, depth + 1))
  }

  const record = obj as Record<string, unknown>
  const result: Record<string, unknown> = {}
  // A record carrying its own currency (course, payment, ...) describes its amounts in it;
  // records without one keep the historical assumption that amounts are SAR.
  const storedCurrency =
    typeof record.currency === 'string' && record.currency ? record.currency.toUpperCase() : 'SAR'

  for (const key of Object.keys(record)) {
    const val = record[key]

    if (val !== null && typeof val === 'object') {
      result[key] = transformValue(val, rate, isEgypt, depth + 1)
      continue
    }

    result[key] = val

    if (typeof val === 'number' && val >= 0 && isMonetaryField(key) && !result[`${key}Display`]) {
      result[`${key}Display`] = formatForMarket(val, storedCurrency, rate, isEgypt)
    }
  }

  return result
}

@Injectable()
export class CurrencyInterceptor implements NestInterceptor {
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string>
      query: Record<string, string>
    }>()

    const country =
      req.headers['x-vercel-ip-country'] || req.headers['cf-ipcountry'] ||
      req.headers['x-market-country'] || req.query?.country || 'SA'

    const isEgypt = String(country).toUpperCase() === 'EG'

    return next.handle().pipe(
      mergeMap(async (data) => {
        try {
          const rate = await this.exchangeRateService.getSARtoEGPRate()
          return transformValue(data, rate, isEgypt)
        } catch {
          return data
        }
      }),
    )
  }
}
