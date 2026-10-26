import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { mergeMap } from 'rxjs/operators'
import { ExchangeRateService } from '../../exchange-rate/exchange-rate.service'

/**
 * Exact monetary field names that should get a Display variant for Egyptian users.
 */
const MONETARY_FIELDS = new Set([
  'price',
  'amount',
  'total',
  'balance',
  'earnings',
  'revenue',
  'subtotal',
  'paid',
  'value',
  'cost',
  'fee',
  'salary',
  'priceSAR',
  'priceUSD',
  'sessionPrice',
  'coursePrice',
  'hourlyRate',
  'walletBalance',
  'earningsBalance',
  'totalRevenue',
  'monthlyRevenue',
  'todayRevenue',
  'coursesRevenue',
  'sessionsRevenue',
  'averageOrder',
  'averageOrderValue',
  'totalEarnings',
  'coachEarnings',
  'pendingAmount',
  'pending',
  'pendingBalance',
  'withdrawnAmount',
  'withdrawable',
  'availableBalance',
  'totalPaid',
  'totalAmount',
  'netAmount',
  'grossAmount',
  'netEarnings',
  'grossRevenue',
  'platformRevenue',
  'instructorRevenue',
  'refundAmount',
  'discountAmount',
  'subtotal',
  'fee',
  'commission',
  'payout',
  'withdrawal',
])

/**
 * Fields that are never monetary — skip even if their name looks like one.
 */
const NON_MONETARY = new Set([
  'id',
  'userId',
  'courseId',
  'sessionId',
  'orderId',
  'instructorId',
  'categoryId',
  'count',
  'totalCount',
  'totalPages',
  'page',
  'limit',
  'rate',
  'rating',
  'completionRate',
  'duration',
  'order',
  'index',
  'rank',
  'score',
  'version',
  'status',
  'code',
  'type',
  'level',
])

function formatEGP(sarAmount: number, rate: number): string {
  const egp = (sarAmount * rate).toFixed(2)
  const arabicEgp = Number(egp).toLocaleString('ar-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${arabicEgp} ج.م`
}

function isMonetaryKey(key: string): boolean {
  if (NON_MONETARY.has(key)) return false
  if (MONETARY_FIELDS.has(key)) return true
  const lower = key.toLowerCase()
  return (
    (lower.includes('price') ||
      lower.includes('amount') ||
      lower.includes('balance') ||
      lower.includes('earning') ||
      lower.includes('revenue') ||
      lower.includes('total') ||
      lower.includes('payment') ||
      lower.includes('paid') ||
      lower.includes('fee') ||
      lower.includes('cost')) &&
    !NON_MONETARY.has(key)
  )
}

function transformValue(obj: unknown, rate: number, depth = 0): unknown {
  if (depth > 15 || obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj

  if (Array.isArray(obj)) {
    return obj.map((item) => transformValue(item, rate, depth + 1))
  }

  const record = obj as Record<string, unknown>
  const result: Record<string, unknown> = {}

  for (const key of Object.keys(record)) {
    const val = record[key]

    if (val && typeof val === 'object') {
      result[key] = transformValue(val, rate, depth + 1)
      continue
    }

    result[key] = val

    if (
      typeof val === 'number' &&
      val !== 0 &&
      isMonetaryKey(key) &&
      !record[`${key}Display`]
    ) {
      result[`${key}Display`] = formatEGP(val, rate)

      if ((key === 'price' || key === 'amount') && !record['priceDisplay']) {
        result['priceDisplay'] = formatEGP(val, rate)
      }
    }
  }

  return result
}

@Injectable()
export class CurrencyInterceptor implements NestInterceptor {
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>
      query: Record<string, string>
    }>()

    const rawCountry =
      req.headers['x-vercel-ip-country'] ??
      req.headers['cf-ipcountry'] ??
      req.headers['x-market-country'] ??
      req.query?.country ??
      'SA'

    const country = String(rawCountry).toUpperCase()
    const isEgypt = country === 'EG'

    return next.handle().pipe(
      mergeMap(async (data) => {
        if (!isEgypt) return data
        try {
          const rate = await this.exchangeRateService.getSARtoEGPRate()
          return transformValue(data, rate)
        } catch {
          return data // Never break the response
        }
      })
    )
  }
}
