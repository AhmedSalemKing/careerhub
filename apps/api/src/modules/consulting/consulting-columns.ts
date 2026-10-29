import { PrismaService } from '../../prisma/prisma.service'

/**
 * Every scalar column that the Prisma `ConsultingSession` model knows about.
 *
 * The consulting table went through a multi-step rebuild and production can be
 * a migration behind the schema. Reads/writes must therefore never blindly ask
 * for a column that may not exist yet, otherwise Prisma fails with P2022 and
 * the endpoint returns a 500.
 */
export const CONSULTING_SESSION_COLUMNS = [
  'id',
  'studentId',
  'consultantId',
  'sessionName',
  'topic',
  'notes',
  'description',
  'scheduledAt',
  'duration',
  'actualDuration',
  'dailyRoomName',
  'dailyRoomUrl',
  'status',
  'meetingType',
  'meetingLink',
  'meetingLinkExpiresAt',
  'price',
  'currency',
  'paymentStatus',
  'paymentId',
  'paidAt',
  'proposedAt',
  'proposedBy',
  'consultantApproved',
  'userApproved',
  'startedAt',
  'endedAt',
  'completedBy',
  'completedAt',
  'cancelReason',
  'rescheduledBy',
  'rescheduledFrom',
  'originalScheduledAt',
  'imageUrl',
  'createdAt',
  'updatedAt',
] as const

/** Columns that have existed since the first release of consulting sessions. */
export const CONSULTING_SESSION_BASE_COLUMNS = [
  'id',
  'studentId',
  'consultantId',
  'scheduledAt',
  'duration',
  'status',
  'createdAt',
  'updatedAt',
] as const

type ColumnsCache = { columns: Set<string> | null; at: number }

const CACHE_TTL_MS = 5 * 60 * 1000
let cache: ColumnsCache | null = null

/**
 * Read the live column list of `consulting_sessions` from Postgres.
 *
 * Returns `null` when the lookup itself fails (for example permissions or a
 * cold connection). Callers must treat `null` as "unknown" and fall back to
 * the base columns instead of assuming the full schema is present.
 */
export async function getConsultingSessionColumns(
  prisma: PrismaService,
  options: { force?: boolean } = {},
): Promise<Set<string> | null> {
  if (!options.force && cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.columns
  }

  try {
    const rows = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'consulting_sessions'
    `
    const columns = rows?.length ? new Set(rows.map((row) => row.column_name)) : null
    cache = { columns, at: Date.now() }
    return columns
  } catch {
    cache = { columns: null, at: Date.now() }
    return null
  }
}

/** Convert camelCase to snake_case for column-name comparison. */
function toSnakeCase(s: string): string {
  return s.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`)
}

/**
 * Build a Prisma `select` containing only the scalar columns that both the
 * model and the live database agree on. Returns `null` when the database
 * columns are unknown.
 *
 * Handles both camelCase and snake_case column names so the code works
 * whether the table was created with quoted identifiers ("scheduledAt") or
 * with a snake_case migration (scheduled_at).
 */
export function buildConsultingSessionSelect(
  columns: Set<string> | null,
): Record<string, boolean> | null {
  if (!columns) return null

  const select: Record<string, boolean> = {}
  for (const field of CONSULTING_SESSION_COLUMNS) {
    // Accept either the exact field name OR its snake_case equivalent
    if (columns.has(field) || columns.has(toSnakeCase(field))) {
      select[field] = true
    }
  }
  // `id` is required to address rows later.
  select.id = true
  return select
}

/** Build a select limited to columns present since the first release. */
export function consultingSessionBaseSelect(): Record<string, boolean> {
  const select: Record<string, boolean> = {}
  for (const field of CONSULTING_SESSION_BASE_COLUMNS) select[field] = true
  return select
}

/**
 * Drop keys that do not exist in the live database (and `undefined` values so
 * Prisma applies its own defaults instead of writing NULL).
 */
export function filterConsultingSessionData(
  data: Record<string, any>,
  columns: Set<string> | null,
): Record<string, any> {
  if (!columns) return data
  return Object.fromEntries(
    Object.entries(data).filter(([key, value]) => value !== undefined && columns.has(key)),
  )
}

export function isMissingColumnError(error: any): boolean {
  const message = String(error?.message || '')
  return (
    error?.code === 'P2022' ||
    error?.code === 'P2021' ||
    /does not exist|unknown (column|field|argument)/i.test(message)
  )
}
