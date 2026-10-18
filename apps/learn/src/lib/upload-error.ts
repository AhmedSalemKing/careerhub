// Maps upload failures to specific, user-friendly messages.
// Handles: file too large, unsupported type, Cloudinary/server errors,
// network failures, and a generic fallback that keeps the original reason.

export type UploadKind = 'image' | 'file' | 'video'

export interface UploadErrorMessageOptions {
  /** Kind of file being uploaded — default: 'image' */
  kind?: UploadKind
  /** Arabic UI — default: true */
  isAr?: boolean
  /** Fallback max size (MB) when the server does not report one */
  maxMB?: number
}

const ALLOWED_TYPES: Record<UploadKind, { ar: string; en: string }> = {
  image: { ar: 'JPG، PNG، WebP', en: 'JPG, PNG, WebP' },
  file: { ar: 'PDF، Word، Excel، PowerPoint', en: 'PDF, Word, Excel, PowerPoint' },
  video: { ar: 'MP4، WebM، MOV', en: 'MP4, WebM, MOV' },
}

const SUBJECT_AR: Record<UploadKind, string> = { image: 'الصورة', file: 'الملف', video: 'الفيديو' }
const SUBJECT_EN: Record<UploadKind, string> = { image: 'image', file: 'file', video: 'video' }

// Mirrors the API upload limits (multer `limits.fileSize` per endpoint)
const DEFAULT_MAX_MB: Record<UploadKind, number> = { image: 10, file: 50, video: 500 }

const SIZE_RE =
  /file too large|payload too large|limit_file_size|maximum size|max size|too large|exceeds?\b.*\bsize\b|\bsize\b.*exceeds?|exceeds?.*\blimit\b|حجم\s+(الملف|الصورة|الفيديو)?.*(كبير|يتجاوز)|يتجاوز\s+الحد|أكبر من الحد/i

const TYPE_RE =
  /not allowed|not supported|unsupported|invalid\s+(file|image|video|media|mime)|file\s*type|mime\s*type|only\s+.*\b(allowed|images|videos|files|jpeg|png|pdf)\b|allowed\s+(formats|types|images|files)|نوع\s+الملف|غير\s+مدعوم|الأنواع\s+المسموحة/i

const NETWORK_RE =
  /network error|failed to fetch|fetch failed|load failed|timed?\s*out|timeout of|connection (refused|reset|terminated)|econnrefused|econnreset|etimedout|enotfound|err_network|فشل الاتصال|تعذر الاتصال|لا يوجد اتصال/i

const SERVER_RE = /cloudinary|internal server error|server error|bad gateway|service unavailable|upstream/i

const NETWORK_CODES = ['ERR_NETWORK', 'ECONNABORTED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED']

interface ExtractedInfo {
  message?: string
  status?: number
  network: boolean
}

function extract(error: unknown): ExtractedInfo {
  const e: any = error
  if (!e) return { network: false }

  const response = e.response
  const status: number | undefined =
    typeof e.status === 'number'
      ? e.status
      : typeof response?.status === 'number'
        ? response.status
        : undefined

  const data = response?.data ?? e.data
  const serverMessage =
    typeof data === 'string'
      ? data
      : data && typeof data === 'object'
        ? typeof data.message === 'string'
          ? data.message
          : Array.isArray(data.message)
            ? data.message.join(', ')
            : undefined
        : undefined

  const message = serverMessage ?? (typeof e.message === 'string' ? e.message : undefined)
  const code = typeof e.code === 'string' ? e.code : ''

  const network =
    NETWORK_CODES.includes(code) ||
    (!!e.request && !response) ||
    (message !== undefined && NETWORK_RE.test(message))

  return { message, status, network }
}

export function getUploadErrorMessage(error: unknown, options: UploadErrorMessageOptions = {}): string {
  const kind: UploadKind = options.kind ?? 'image'
  const isAr = options.isAr !== false
  const { message, status, network } = extract(error)

  // 1) File size exceeded (multer 413 / API size validation)
  if (status === 413 || (message && SIZE_RE.test(message))) {
    const parsed = message?.match(/(\d+(?:[.,]\d+)?)\s*(?:MB|ميجا)/i)
    const mb = parsed ? parsed[1].replace(',', '.') : String(options.maxMB ?? DEFAULT_MAX_MB[kind])
    return isAr
      ? `حجم ${SUBJECT_AR[kind]} كبير جداً، الحد الأقصى المسموح هو ${mb} MB`
      : `The ${SUBJECT_EN[kind]} is too large. Maximum allowed size is ${mb} MB`
  }

  // 2) Unsupported file type
  if (message && TYPE_RE.test(message)) {
    return isAr
      ? `نوع الملف غير مدعوم. الأنواع المسموحة: ${ALLOWED_TYPES[kind].ar}`
      : `Unsupported file type. Allowed types: ${ALLOWED_TYPES[kind].en}`
  }

  // 3) Network problem (never reached the server)
  if (network) {
    return isAr
      ? 'تعذر الاتصال بالخادم، تحقق من اتصالك'
      : 'Could not connect to the server, check your connection'
  }

  // 4) Cloudinary / server-side failure
  if ((status !== undefined && status >= 500) || (message && SERVER_RE.test(message))) {
    return isAr
      ? `فشل رفع ${SUBJECT_AR[kind]} على الخادم، حاول مرة أخرى`
      : `Failed to upload the ${SUBJECT_EN[kind]} on the server, please try again`
  }

  // 5) Fallback — keep the original reason
  const detail = message || (isAr ? 'خطأ غير معروف' : 'Unknown error')
  return isAr
    ? `فشل رفع ${SUBJECT_AR[kind]}: ${detail}`
    : `${SUBJECT_EN[kind]} upload failed: ${detail}`
}
