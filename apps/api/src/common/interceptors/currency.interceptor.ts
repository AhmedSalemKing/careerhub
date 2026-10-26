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

function transformValue(obj: unknown, rate: number, isEgypt: boolean, depth = 0): unknown {
  if (depth > 15 || obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj

  if (Array.isArray(obj)) {
    return obj.map((item) => transformValue(item, rate, isEgypt, depth + 1))
  }

  const record = obj as Record<string, unknown>
  const result: Record<string, unknown> = {}

  for (const key of Object.keys(record)) {
    const val = record[key]

    if (val !== null && typeof val === 'object') {
      result[key] = transformValue(val, rate, isEgypt, depth + 1)
      continue
    }

    result[key] = val

    if (typeof val === 'number' && val >= 0 && isMonetaryField(key) && !result[`${key}Display`]) {
      result[`${key}Display`] = isEgypt ? formatEGP(val, rate) : formatSAR(val)
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
