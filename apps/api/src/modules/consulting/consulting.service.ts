import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { ActivityService } from '../../common/services/activity.service'
import { DailyService } from '../live/daily.service'
import { NotificationsService } from '../notifications/notifications.service'
import {
  buildConsultingSessionSelect,
  consultingSessionBaseSelect,
  filterConsultingSessionData,
  getConsultingSessionColumns,
  isMissingColumnError,
} from './consulting-columns'

export const SPECIALTY_KEYWORDS: Record<string, string[]> = {
  tech: ['برمجة','تقنية','software','tech','engineering','هندسة','developer','مطور','web','mobile','fullstack','frontend','backend','python','javascript','react','node','java','php','flutter','تطوير','كود','code','programming','ويب','موبايل','api','database','قاعدة بيانات','devops','cloud','سحابة','aws','azure','docker','kubernetes','linux','network','شبكات','typescript','vue','angular','spring','laravel'],
  data: ['data','بيانات','ai','ذكاء اصطناعي','machine learning','تعلم آلي','deep learning','neural','nlp','computer vision','analytics','تحليل','statistics','احصاء','tensorflow','pytorch','pandas','numpy','tableau','power bi','data science','علم البيانات','big data','etl','spark','hadoop'],
  security: ['security','أمن','سيبراني','cyber','hacking','penetration','اختراق','ethical hacking','ctf','forensics','malware','encryption','تشفير','firewall','vpn','soc','incident response','vulnerability','ثغرات','kali','metasploit','owasp'],
  design: ['تصميم','design','ui','ux','figma','graphic','جرافيك','واجهة','user experience','interaction','visual','branding','هوية','logo','photoshop','illustrator','sketch','motion','animation','حركة','creative','إبداع','art','فن','typography','خطوط','after effects','premiere'],
  marketing: ['تسويق','marketing','digital','رقمي','seo','sem','google ads','social media','content','محتوى','email','affiliate','influencer','brand','علامة تجارية','copywriting','growth','analytics','conversion','pr','advertising','إعلان','campaign','حملة','facebook ads','instagram','tiktok'],
  business: ['أعمال','business','management','إدارة','ريادة','entrepreneur','startup','مبيعات','sales','تجارة','finance','مالية','hr','موارد بشرية','project manager','product manager','scrum','agile','strategy','استراتيجية','consulting','استشارات','operations','accounting','محاسبة','investment','استثمار'],
}

// Status values used throughout the consulting flow.
export const ConsultingStatus = {
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  AWAITING_PAYMENT: 'AWAITING_PAYMENT',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  RESCHEDULE_REQUESTED: 'RESCHEDULE_REQUESTED',
} as const

// A slot is held as soon as a request exists: pending approval, awaiting
// payment, confirmed or running. PENDING and RESCHEDULED are the legacy
// spellings written before the rebuild; they must keep blocking their slot or
// two students can book the same time.
const LOCKED_STATUSES = [
  ConsultingStatus.PENDING_APPROVAL,
  ConsultingStatus.AWAITING_PAYMENT,
  ConsultingStatus.CONFIRMED,
  ConsultingStatus.IN_PROGRESS,
  ConsultingStatus.RESCHEDULE_REQUESTED,
  'PENDING',
  'RESCHEDULED',
]

// Used when a legacy row has no duration stored.
const DEFAULT_DURATION = 60

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return isNaN(date.getTime()) ? null : date
}

function formatName(profile?: { firstName?: string | null; lastName?: string | null } | null): string {
  return `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim()
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000)
}

@Injectable()
export class ConsultingService {
  constructor(
    private prisma: PrismaService,
    private readonly activityService: ActivityService,
    private readonly dailyService: DailyService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getConsultants(query: { filter?: string; search?: string; sort?: string; limit?: number }) {
    try {
      const users = await this.prisma.user.findMany({
        where: { accountType: 'CONSULTANT' },
        include: {
          profile: {
            select: {
              firstName: true, lastName: true, avatar: true, bio: true,
              speciality: true, yearsExperience: true,
              qualifications: true, consultingAreas: true,
              linkedinUrl: true, sessionPrice: true, sessionDuration: true,
            }
          },
        },
      })

      const keywords = SPECIALTY_KEYWORDS[query.filter || ''] || []

      let scored = users.map(u => {
        const p = (u as any).profile
        let score = 0
        const combined = [
          p?.speciality || '',
          p?.bio || '',
          ...(p?.consultingAreas || []),
          ...(p?.qualifications || []),
        ].join(' ').toLowerCase()

        if (query.filter && query.filter !== 'all') {
          keywords.forEach(kw => { if (combined.includes(kw)) score += 10 })
        } else {
          score = 50
        }

        if (query.search) {
          const q = query.search.toLowerCase()
          const nameStr = `${p?.firstName || ''} ${p?.lastName || ''}`.toLowerCase()
          if (nameStr.includes(q)) score += 30
          if (combined.includes(q)) score += 20
        }

        if (p?.speciality) score += 5
        if (p?.bio) score += 3
        if (p?.qualifications?.length) score += p.qualifications.length * 2
        if (p?.consultingAreas?.length) score += p.consultingAreas.length * 2
        if (u.isVerified) score += 15

        return { ...u, _score: score, _count: { consultantSessions: 0 } }
      })

      if (query.filter && query.filter !== 'all') scored = scored.filter(u => u._score > 0)
      if (query.search) scored = scored.filter(u => u._score > 0)

      switch(query.sort) {
        case 'price-low': scored.sort((a: any,b: any) => parseFloat(a.profile?.sessionPrice||'0') - parseFloat(b.profile?.sessionPrice||'0')); break
        case 'price-high': scored.sort((a: any,b: any) => parseFloat(b.profile?.sessionPrice||'0') - parseFloat(a.profile?.sessionPrice||'0')); break
        case 'experience': scored.sort((a: any,b: any) => (b.profile?.yearsExperience||0) - (a.profile?.yearsExperience||0)); break
        default: scored.sort((a,b) => b._score - a._score)
      }

      return { success: true, data: scored.slice(0, query.limit || 50) }
    } catch(e: any) {
      console.error('[getConsultants]', e.message)
      return { success: true, data: [] }
    }
  }

  async getConsultant(consultantId: string) {
    const consultant = await this.prisma.user.findUnique({
      where: { id: consultantId, accountType: 'CONSULTANT' },
      include: {
        profile: {
          select: {
            firstName: true, lastName: true, avatar: true, bio: true,
            speciality: true, yearsExperience: true,
            qualifications: true, consultingAreas: true,
            linkedinUrl: true, sessionPrice: true, sessionDuration: true,
          },
        },
      },
    })
    if (!consultant) throw new NotFoundException('Consultant not found')
    return { success: true, data: consultant }
  }

  async getAvailableSlots(consultantId: string, fromStr: string, toStr: string, durationMinutes = 60) {
    const consultant = await this.prisma.user.findUnique({
      where: { id: consultantId, accountType: 'CONSULTANT' },
      include: { profile: { select: { sessionDuration: true } } },
    })
    if (!consultant) throw new NotFoundException('Consultant not found')

    const from = new Date(fromStr)
    const to = new Date(toStr)
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      throw new BadRequestException('Invalid date range')
    }

    const slotDuration = durationMinutes || (consultant.profile?.sessionDuration as number) || 60

    // Locked sessions in range. The lower bound is widened by the longest
    // supported duration so a session that starts before `from` but runs into
    // the range is still detected. If the database is missing a column used by
    // the default select, degrade to showing the slot as free instead of
    // failing the whole booking page with a 500.
    let locked: Array<{ id: string; scheduledAt: Date; duration: number; status: string }> = []
    try {
      locked = await this.prisma.consultingSession.findMany({
        where: {
          consultantId,
          status: { in: LOCKED_STATUSES },
          scheduledAt: {
            gte: addMinutes(from, -(Math.max(slotDuration, DEFAULT_DURATION) * 2)),
            lte: addMinutes(to, DEFAULT_DURATION),
          },
        },
        select: { id: true, scheduledAt: true, duration: true, status: true },
      })
    } catch (error: any) {
      console.error('[getAvailableSlots] could not load locked sessions:', error?.message)
      locked = []
    }

    const lockedRanges = locked.map(s => ({
      id: s.id,
      status: s.status,
      start: s.scheduledAt,
      end: addMinutes(s.scheduledAt, s.duration || slotDuration),
    }))

    // Build slots every 30 minutes, 9am to 9pm local time, for each day in range
    const slots: { time: string; available: boolean; sessionId?: string; status?: string }[] = []
    const cursor = new Date(from)
    cursor.setHours(0, 0, 0, 0)

    while (cursor < to) {
      for (let hour = 9; hour < 21; hour++) {
        for (const minute of [0, 30]) {
          const slotStart = new Date(cursor)
          slotStart.setHours(hour, minute, 0, 0)
          if (slotStart < from || slotStart >= to || slotStart < new Date()) continue

          const slotEnd = addMinutes(slotStart, slotDuration)
          const conflict = lockedRanges.find(r => slotStart < r.end && slotEnd > r.start)
          slots.push({
            time: slotStart.toISOString(),
            available: !conflict,
            sessionId: conflict?.id,
            status: conflict?.status,
          })
        }
      }
      cursor.setDate(cursor.getDate() + 1)
    }

    return { success: true, data: { slots, duration: slotDuration } }
  }

  async bookSession(userId: string, data: {
    consultantId: string
    sessionName?: string
    topic: string
    notes?: string
    description?: string
    scheduledAt: string
    duration?: number
    meetingType?: 'daily'
  }) {
    const scheduledAt = new Date(data.scheduledAt)
    if (scheduledAt <= new Date()) throw new BadRequestException('Cannot book a session in the past')
    if (!data.topic?.trim()) throw new BadRequestException('Session goal/topic is required')

    const consultant = await this.prisma.user.findUnique({
      where: { id: data.consultantId, accountType: 'CONSULTANT' },
      include: { profile: true },
    })
    if (!consultant) throw new NotFoundException('Consultant not found')

    const duration = data.duration || (consultant.profile?.sessionDuration as number) || DEFAULT_DURATION
    const baseDuration = (consultant.profile?.sessionDuration as number) || DEFAULT_DURATION
    const basePrice = Number(consultant.profile?.sessionPrice || consultant.hourlyRate || 0)
    // The stored profile price is the price of the default session length.
    // Scale it to the duration the student picked so the summary, the stored
    // price and the payment amount always match.
    const sessionPrice = Number(((basePrice * duration) / baseDuration).toFixed(2))

    const sessionEnd = addMinutes(scheduledAt, duration)

    // Slot locking. Two writes can race between the check and the insert, so the
    // check must be as tight as possible: fetch only locked sessions that start
    // before our end (a session starting after our end cannot overlap) and let
    // Postgres do the range scan. Only columns that have existed since the first
    // release are selected so this cannot 500 while optional columns are still
    // being migrated.
    const overlapping = await this.prisma.consultingSession.findMany({
      where: {
        consultantId: data.consultantId,
        status: { in: LOCKED_STATUSES },
        scheduledAt: {
          gte: addMinutes(scheduledAt, -(Math.max(duration, DEFAULT_DURATION) * 2)),
          lt: sessionEnd,
        },
      },
      select: { id: true, scheduledAt: true, duration: true },
    })

    const consultantConflict = overlapping.find((existing) => {
      const existingStart = toDate(existing.scheduledAt)
      if (!existingStart) return false
      const existingEnd = addMinutes(existingStart, existing.duration || duration)
      return scheduledAt < existingEnd && sessionEnd > existingStart
    })
    if (consultantConflict) {
      throw new ConflictException('هذا الموعد محجوز بالفعل، يرجى اختيار موعد آخر')
    }

    // The same student must not double-book themselves with any consultant.
    const userOverlapping = await this.prisma.consultingSession.findMany({
      where: {
        studentId: userId,
        status: { in: LOCKED_STATUSES },
        scheduledAt: {
          gte: addMinutes(scheduledAt, -(Math.max(duration, DEFAULT_DURATION) * 2)),
          lt: sessionEnd,
        },
      },
      select: { id: true, scheduledAt: true, duration: true },
    })

    const studentConflict = userOverlapping.find((existing) => {
      const existingStart = toDate(existing.scheduledAt)
      if (!existingStart) return false
      const existingEnd = addMinutes(existingStart, existing.duration || duration)
      return scheduledAt < existingEnd && sessionEnd > existingStart
    })
    if (studentConflict) {
      throw new ConflictException('لديك جلسة أخرى في نفس الوقت')
    }

    const session = await this.createSessionSafely({
      studentId: userId,
      consultantId: data.consultantId,
      sessionName: data.sessionName || data.topic,
      topic: data.topic,
      notes: data.notes ?? data.description ?? null,
      description: data.description || data.notes || '',
      scheduledAt,
      duration: duration ?? 60,
      price: sessionPrice,
      currency: 'SAR',
      status: ConsultingStatus.PENDING_APPROVAL,
      paymentStatus: sessionPrice > 0 ? 'UNPAID' : 'PAID',
      userApproved: true,
      consultantApproved: false,
      meetingType: 'daily',
    })

    await this.notify(data.consultantId, {
      titleEn: 'New Session Booking Request',
      titleAr: 'طلب حجز جلسة جديد',
      contentEn: `${formatName((session as any).user?.profile)} requested a session: "${data.sessionName || data.topic}"`,
      contentAr: `${formatName((session as any).user?.profile)} طلب جلسة: "${data.sessionName || data.topic}"`,
      type: 'SESSION_BOOKED',
    })

    return { success: true, data: session }
  }

  async getSessions(userId: string, range: { from?: string; to?: string } = {}) {
    const from = toDate(range.from)
    const to = toDate(range.to)
    const scheduledAt = from || to
      ? { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) }
      : undefined
    const dateFilter = scheduledAt ? { scheduledAt } : {}

    try {
      const mySessions = await this.findSessionsSafely({ studentId: userId, ...dateFilter })
      const clientSessions = await this.findSessionsSafely({ consultantId: userId, ...dateFilter })

      return {
        success: true,
        data: {
          mySessions,
          clientSessions,
          isConsultant: clientSessions.length > 0 || (await this.prisma.user.count({ where: { id: userId, accountType: 'CONSULTANT' } })) > 0,
        }
      }
    } catch(e: any) {
      console.error('[getSessions error]', e.message)
      return { success: true, data: { mySessions: [], clientSessions: [], isConsultant: false } }
    }
  }

  async getSession(sessionId: string, userId: string) {
    // Reuse the schema-tolerant read so a missing optional column never turns a
    // session detail request into a 500.
    const sessions = await this.findSessionsSafely({ id: sessionId })
    const session = sessions.find((row: any) => row.id === sessionId)
    if (!session) throw new NotFoundException('Session not found')
    if (session.studentId !== userId && session.consultantId !== userId) throw new ForbiddenException('Not authorized')
    return { success: true, data: session }
  }

  async approveSession(sessionId: string, consultantId: string) {
    const session = await this.prisma.consultingSession.findFirst({
      where: { id: sessionId, consultantId },
    })
    if (!session) throw new NotFoundException('Session not found')
    if (![ConsultingStatus.PENDING_APPROVAL, 'PENDING', ConsultingStatus.RESCHEDULE_REQUESTED].includes(session.status)) {
      throw new BadRequestException('Session cannot be approved')
    }

    const isFree = (session.price || 0) === 0
    const nextStatus = isFree ? ConsultingStatus.CONFIRMED : ConsultingStatus.AWAITING_PAYMENT

    const updated = await this.prisma.consultingSession.update({
      where: { id: sessionId },
      data: {
        status: nextStatus,
        consultantApproved: true,
        userApproved: true,
        paymentStatus: isFree ? 'PAID' : session.paymentStatus,
        paidAt: isFree ? new Date() : session.paidAt,
      },
    })

    await this.notify(session.studentId, {
      titleEn: isFree ? 'Session Confirmed' : 'Session Approved - Payment Required',
      titleAr: isFree ? 'تم تأكيد الجلسة' : 'تمت الموافقة على الجلسة — يرجى الدفع',
      contentEn: isFree
        ? `Your session "${session.sessionName || session.topic}" has been confirmed`
        : `Your session "${session.sessionName || session.topic}" was approved. Please complete payment.`,
      contentAr: isFree
        ? `تم تأكيد جلستك "${session.sessionName || session.topic}"`
        : `تمت الموافقة على جلستك "${session.sessionName || session.topic}" — يرجى إتمام الدفع.`,
      type: 'SESSION_APPROVED',
    })

    return { success: true, data: updated }
  }

  async requestReschedule(sessionId: string, consultantId: string, data: { proposedAt: string; reason?: string }) {
    const session = await this.prisma.consultingSession.findUnique({ where: { id: sessionId } })
    if (!session) throw new NotFoundException('Session not found')
    if (session.consultantId !== consultantId) throw new ForbiddenException('Not authorized')

    const proposedAt = new Date(data.proposedAt)
    if (proposedAt <= new Date()) throw new BadRequestException('Cannot propose past time')

    const updated = await this.prisma.consultingSession.update({
      where: { id: sessionId },
      data: {
        status: ConsultingStatus.RESCHEDULE_REQUESTED,
        proposedAt,
        proposedBy: 'CONSULTANT',
        originalScheduledAt: session.originalScheduledAt || session.scheduledAt,
      },
    })

    await this.notify(session.studentId, {
      titleEn: 'Reschedule Requested',
      titleAr: 'طلب تغيير موعد',
      contentEn: `The consultant proposes a new time: ${proposedAt.toLocaleDateString('en')} ${proposedAt.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}${data.reason ? ' - ' + data.reason : ''}`,
      contentAr: `المستشار يقترح موعداً جديداً: ${proposedAt.toLocaleDateString('ar')} ${proposedAt.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}${data.reason ? ' - ' + data.reason : ''}`,
      type: 'SYSTEM_ANNOUNCEMENT',
    })

    return { success: true, data: updated }
  }

  async approveReschedule(sessionId: string, userId: string) {
    const session = await this.prisma.consultingSession.findUnique({ where: { id: sessionId } })
    if (!session) throw new NotFoundException('Session not found')
    if (session.studentId !== userId) throw new ForbiddenException('Not authorized')
    if (!session.proposedAt) throw new BadRequestException('No proposal found')

    const updated = await this.prisma.consultingSession.update({
      where: { id: sessionId },
      data: {
        scheduledAt: session.proposedAt,
        rescheduledFrom: session.originalScheduledAt || session.scheduledAt,
        proposedAt: null,
        proposedBy: null,
        originalScheduledAt: null,
        status: session.paymentStatus === 'PAID' ? ConsultingStatus.CONFIRMED : ConsultingStatus.AWAITING_PAYMENT,
      },
    })

    await this.notify(session.consultantId, {
      titleEn: 'Reschedule Approved',
      titleAr: 'تمت الموافقة على الموعد الجديد',
      contentEn: 'The user approved the new session time',
      contentAr: 'وافق المستخدم على الموعد الجديد للجلسة',
      type: 'SYSTEM_ANNOUNCEMENT',
    })

    return { success: true, data: updated }
  }

  async rejectReschedule(sessionId: string, userId: string) {
    const session = await this.prisma.consultingSession.findUnique({ where: { id: sessionId } })
    if (!session) throw new NotFoundException('Session not found')
    if (session.studentId !== userId) throw new ForbiddenException('Not authorized')

    const updated = await this.prisma.consultingSession.update({
      where: { id: sessionId },
      data: {
        status: session.paymentStatus === 'PAID' ? ConsultingStatus.CONFIRMED : ConsultingStatus.AWAITING_PAYMENT,
        proposedAt: null,
        proposedBy: null,
        originalScheduledAt: null,
      },
    })

    await this.notify(session.consultantId, {
      titleEn: 'Reschedule Rejected',
      titleAr: 'رُفض طلب تغيير الموعد',
      contentEn: 'The user rejected the time change, original time remains',
      contentAr: 'رفض المستخدم تغيير الموعد، الموعد الأصلي سارٍ',
      type: 'SYSTEM_ANNOUNCEMENT',
    })

    return { success: true, data: updated }
  }

  async paySession(sessionId: string, userId: string) {
    const session = await this.prisma.consultingSession.findUnique({
      where: { id: sessionId },
      include: { consultant: { include: { profile: true } } },
    })
    if (!session) throw new NotFoundException('Session not found')
    if (session.studentId !== userId) throw new ForbiddenException('Not authorized')
    if (session.status !== ConsultingStatus.AWAITING_PAYMENT && session.status !== ConsultingStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Session is not awaiting payment')
    }
    if (session.paymentStatus === 'PAID') throw new BadRequestException('Already paid')

    const price = session.price || 0

    const updated = await this.prisma.consultingSession.update({
      where: { id: sessionId },
      data: { paymentStatus: 'PAID', paidAt: new Date(), status: ConsultingStatus.CONFIRMED },
    })

    if (price > 0) {
      await this.prisma.user.update({
        where: { id: session.consultantId },
        data: { earningsBalance: { increment: price } },
      }).catch(() => {})
    }

    await this.notify(session.consultantId, {
      titleEn: 'Payment Confirmed - Session Locked',
      titleAr: 'تم الدفع — الجلسة مؤكدة',
      contentEn: `Session "${session.sessionName || session.topic}" has been paid${price > 0 ? ` (${price} SAR)` : ''}. You can start the room when the time comes.`,
      contentAr: `تم دفع جلستك "${session.sessionName || session.topic}"${price > 0 ? ` (${price} ر.س)` : ''}. يمكنك بدء الجلسة عند حلول الموعد.`,
      type: 'PAYMENT_CONFIRMED',
    })

    return { success: true, data: updated }
  }

  async createPaymentIntent(sessionId: string, userId: string) {
    const session = await this.prisma.consultingSession.findUnique({
      where: { id: sessionId },
      include: { consultant: { include: { profile: true } } },
    })
    if (!session) throw new NotFoundException('Session not found')
    if (session.studentId !== userId) throw new ForbiddenException('Not authorized')

    const price = session.price || parseFloat(session.consultant?.profile?.sessionPrice?.toString() || '0')

    if (price === 0) {
      await this.prisma.consultingSession.update({
        where: { id: sessionId },
        data: { paymentStatus: 'PAID', paidAt: new Date(), status: ConsultingStatus.CONFIRMED },
      })
      await this.notify(session.consultantId, {
        titleEn: 'Free Session Confirmed',
        titleAr: 'تم تأكيد الجلسة المجانية',
        contentEn: `Free session "${session.sessionName || session.topic}" confirmed`,
        contentAr: `تم تأكيد الجلسة المجانية "${session.sessionName || session.topic}"`,
        type: 'PAYMENT_CONFIRMED',
      }).catch(() => {})
      return { success: true, free: true }
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(price * 100),
      currency: 'sar',
      metadata: { sessionId, userId, consultantId: session.consultantId },
      description: `Consulting session - ${session.sessionName || session.topic}`,
    })

    return {
      success: true,
      free: false,
      clientSecret: paymentIntent.client_secret,
      amount: price,
      currency: 'SAR',
      session: {
        id: session.id,
        sessionName: session.sessionName,
        topic: session.topic,
        scheduledAt: session.scheduledAt,
      }
    }
  }

  async confirmPayment(sessionId: string, userId: string, paymentIntentId?: string) {
    const existingSession = await this.prisma.consultingSession.findUnique({
      where: { id: sessionId },
      include: { consultant: { include: { profile: true } } },
    })
    if (!existingSession) throw new NotFoundException('Session not found')
    if (existingSession.studentId !== userId) throw new ForbiddenException('Not authorized')

    const price = existingSession.price || parseFloat(existingSession.consultant?.profile?.sessionPrice?.toString() || '0')
    const isFree = price === 0

    if (isFree || paymentIntentId === 'free') {
      await this.prisma.consultingSession.update({
        where: { id: sessionId },
        data: { paymentStatus: 'PAID', paidAt: new Date(), status: ConsultingStatus.CONFIRMED },
      })
      await this.activityService.track({
        userId,
        action: 'PAYMENT_SUCCESS',
        entityType: 'Session',
        entityId: sessionId,
        metadata: {
          amount: price,
          type: 'consultation',
          consultantName: formatName(existingSession.consultant?.profile),
        },
      })
      await this.notify(existingSession.consultantId, {
        titleEn: isFree ? 'Free Session Confirmed' : 'Session Confirmed',
        titleAr: isFree ? 'تم تأكيد الجلسة المجانية' : 'تم تأكيد الجلسة',
        contentEn: isFree
          ? `Free session "${existingSession.sessionName || existingSession.topic}" confirmed`
          : `Session "${existingSession.sessionName || existingSession.topic}" confirmed for ${price} SAR`,
        contentAr: isFree
          ? `تم تأكيد الجلسة المجانية "${existingSession.sessionName || existingSession.topic}"`
          : `تم تأكيد جلستك "${existingSession.sessionName || existingSession.topic}" بمبلغ ${price} ر.س`,
        type: 'PAYMENT_CONFIRMED',
      })
      return { success: true, data: existingSession }
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId!)
    if (paymentIntent.status !== 'succeeded') {
      throw new BadRequestException('Payment not completed')
    }

    await this.prisma.payment.create({
      data: {
        userId: existingSession.studentId,
        amount: price,
        currency: 'SAR',
        method: 'STRIPE_CARD',
        status: 'COMPLETED',
        stripeIntentId: paymentIntentId,
        itemType: 'SESSION',
        itemId: existingSession.id,
        description: `Consulting session: ${existingSession.sessionName || existingSession.topic}`,
      }
    }).catch(() => {})

    const session = await this.prisma.consultingSession.update({
      where: { id: sessionId },
      data: { paymentStatus: 'PAID', paidAt: new Date(), status: ConsultingStatus.CONFIRMED },
      include: { consultant: { include: { profile: true } } },
    })

    await this.activityService.track({
      userId,
      action: 'PAYMENT_SUCCESS',
      entityType: 'Session',
      entityId: sessionId,
      metadata: {
        amount: price,
        type: 'consultation',
        consultantName: formatName(session.consultant?.profile),
      },
    })

    if (price > 0) {
      const consultantId = (session as any).consultant?.id || existingSession.consultantId
      await this.prisma.user.update({
        where: { id: consultantId },
        data: { earningsBalance: { increment: price } },
      }).catch(() => {})
    }

    const consultantId = (session as any).consultant?.id || existingSession.consultantId
    await this.notify(consultantId, {
      titleEn: 'Payment Received - Session Confirmed',
      titleAr: 'تم استلام الدفع — الجلسة مؤكدة',
      contentEn: `Payment of ${price > 0 ? price + ' SAR' : ''} received for "${existingSession.sessionName || existingSession.topic}".`,
      contentAr: `تم دفع ${price > 0 ? price + ' ر.س' : ''} للجلسة "${existingSession.sessionName || existingSession.topic}".`,
      type: 'PAYMENT_CONFIRMED',
    })

    return { success: true, data: session }
  }

  async startRoom(sessionId: string, consultantId: string) {
    const session = await this.prisma.consultingSession.findUnique({
      where: { id: sessionId },
      include: { user: { include: { profile: true } }, consultant: { include: { profile: true } } },
    })
    if (!session) throw new NotFoundException('Session not found')
    if (session.consultantId !== consultantId) throw new ForbiddenException('Not authorized')

    // A running session can be re-opened: the consultant may have closed the
    // tab, or the student is already inside. Rejoining must never create a
    // second Daily room.
    if (session.status !== ConsultingStatus.CONFIRMED && session.status !== ConsultingStatus.IN_PROGRESS) {
      throw new BadRequestException('Session must be confirmed and paid before starting')
    }

    let roomName = session.dailyRoomName
    let roomUrl = session.dailyRoomUrl

    if (!roomUrl || !roomName) {
      try {
        const room = await this.dailyService.createConsultingRoom(sessionId)
        roomName = room.roomName
        roomUrl = room.roomUrl
      } catch (error: any) {
        // The room name is deterministic per session, so a "room already
        // exists" error (or a temporary Daily outage) still leaves a usable
        // room. Reconstruct the URL instead of failing the start button.
        roomName = session.dailyRoomName || `consulting-${sessionId}`
        roomUrl = session.dailyRoomUrl || `https://${process.env.DAILY_DOMAIN || 'deveway'}.daily.co/${roomName}`
        console.error('[startRoom] could not create Daily room, using existing name:', error?.message)
      }

      await this.prisma.consultingSession
        .update({ where: { id: sessionId }, data: { dailyRoomName: roomName, dailyRoomUrl: roomUrl } })
        .catch((error: any) => console.error('[startRoom] could not persist room:', error?.message))
    }

    const alreadyRunning = session.status === ConsultingStatus.IN_PROGRESS
    const updated = alreadyRunning
      ? session
      : await this.prisma.consultingSession.update({
          where: { id: sessionId },
          data: { status: ConsultingStatus.IN_PROGRESS, startedAt: new Date() },
        })

    // A missing Daily key must not block the redirect: the room URL is still
    // valid and Daily lets participants join without a token when the room is
    // not locked.
    let consultantToken: string | null = null
    try {
      consultantToken = await this.dailyService.createToken(roomName!, true)
    } catch (error: any) {
      console.error('[startRoom] could not create Daily token:', error?.message)
    }

    if (!alreadyRunning) {
      await this.notify(session.studentId, {
        titleEn: 'Your Session is Starting',
        titleAr: 'جلستك ستبدأ الآن',
        contentEn: `${formatName(session.consultant?.profile)} started the session — join now.`,
        contentAr: `${formatName(session.consultant?.profile)} بدأ الجلسة — انضم الآن.`,
        type: 'LIVE_STARTED',
        data: { sessionId, roomUrl, roomName },
      })
    }

    return { success: true, data: { roomUrl, token: consultantToken, roomName, session: updated } }
  }

  async joinRoom(sessionId: string, userId: string) {
    const session = await this.prisma.consultingSession.findUnique({
      where: { id: sessionId },
      include: { user: { include: { profile: true } }, consultant: { include: { profile: true } } },
    })
    if (!session) throw new NotFoundException('Session not found')
    if (session.studentId !== userId && session.consultantId !== userId) {
      throw new ForbiddenException('Not authorized')
    }
    if (!session.dailyRoomName || !session.dailyRoomUrl) {
      throw new BadRequestException('Room has not been started yet')
    }

    let token: string | null = null
    try {
      token = await this.dailyService.createToken(session.dailyRoomName, session.consultantId === userId)
    } catch (error: any) {
      console.error('[joinRoom] could not create Daily token:', error?.message)
    }

    return { success: true, data: { roomUrl: session.dailyRoomUrl, token, roomName: session.dailyRoomName } }
  }

  async endSession(sessionId: string, userId: string) {
    const session = await this.prisma.consultingSession.findFirst({
      where: { id: sessionId },
      select: { id: true, status: true, consultantId: true, studentId: true },
    })
    if (!session) throw new NotFoundException('Session not found')
    if (session.consultantId !== userId && session.studentId !== userId)
      throw new ForbiddenException('Not a participant')
    if (!['IN_PROGRESS', 'CONFIRMED'].includes(session.status))
      throw new BadRequestException(`Cannot end session with status ${session.status}`)
    return this.completeSession(sessionId, userId)
  }

  async completeSession(sessionId: string, userId: string) {
    const session = await this.prisma.consultingSession.findUnique({ where: { id: sessionId } })
    if (!session) throw new NotFoundException('Session not found')
    if (session.studentId !== userId && session.consultantId !== userId) throw new ForbiddenException('Not authorized')

    const updated = await this.prisma.consultingSession.update({
      where: { id: sessionId },
      data: { status: ConsultingStatus.COMPLETED, completedBy: userId, completedAt: new Date() },
    })

    const notifyId = session.studentId === userId ? session.consultantId : session.studentId
    await this.notify(notifyId, {
      titleEn: 'Session Completed',
      titleAr: 'تمت الجلسة بنجاح',
      contentEn: 'The consulting session has been marked as completed',
      contentAr: 'تم تأكيد اكتمال الجلسة الاستشارية',
      type: 'SYSTEM_ANNOUNCEMENT',
    })

    return { success: true, data: updated }
  }

  async cancelSession(sessionId: string, userId: string, data: { reason?: string }) {
    const session = await this.prisma.consultingSession.findUnique({ where: { id: sessionId } })
    if (!session) throw new NotFoundException('Session not found')
    if (session.studentId !== userId && session.consultantId !== userId) throw new ForbiddenException('Not authorized')
    if (session.status === ConsultingStatus.COMPLETED || session.status === ConsultingStatus.CANCELLED) {
      throw new BadRequestException('Session already finished')
    }

    const updated = await this.prisma.consultingSession.update({
      where: { id: sessionId },
      data: { status: ConsultingStatus.CANCELLED, cancelReason: data.reason || '' },
    })

    const notifyId = session.studentId === userId ? session.consultantId : session.studentId
    await this.notify(notifyId, {
      titleEn: `Session Cancelled${data.reason ? ': ' + data.reason : ''}`,
      titleAr: 'تم إلغاء الجلسة',
      contentEn: `The session has been cancelled${data.reason ? ': ' + data.reason : ''}`,
      contentAr: `تم إلغاء الجلسة${data.reason ? ': ' + data.reason : ''}`,
      type: 'SESSION_CANCELLED',
    })

    return { success: true, data: updated }
  }

  async confirmSessionByConsultant(sessionId: string, consultantId: string) {
    return this.approveSession(sessionId, consultantId)
  }

  // Webhook completion handler used by the webhook controller.
  async completeSessionFromWebhook(roomName: string, durationSeconds: number) {
    const session = await this.prisma.consultingSession.findFirst({
      where: { dailyRoomName: roomName },
      include: { user: { include: { profile: true } }, consultant: { include: { profile: true } } },
    })
    if (!session) return null

    const actualDuration = durationSeconds > 0 ? Math.round(durationSeconds / 60) : session.duration

    const updated = await this.prisma.consultingSession.update({
      where: { id: session.id },
      data: {
        status: ConsultingStatus.COMPLETED,
        actualDuration,
        endedAt: new Date(),
      },
    })

    await this.notify(session.consultantId, {
      titleEn: 'Session Ended',
      titleAr: 'انتهت الجلسة',
      contentEn: `The session with ${formatName(session.user?.profile)} ended. Duration: ${actualDuration} minutes.`,
      contentAr: `انتهت الجلسة مع ${formatName(session.user?.profile)}. المدة: ${actualDuration} دقيقة.`,
      type: 'LIVE_ENDED',
    })

    await this.notify(session.studentId, {
      titleEn: 'Session Ended',
      titleAr: 'انتهت الجلسة',
      contentEn: `Your session with ${formatName(session.consultant?.profile)} ended. Duration: ${actualDuration} minutes.`,
      contentAr: `انتهت جلستك مع ${formatName(session.consultant?.profile)}. المدة: ${actualDuration} دقيقة.`,
      type: 'LIVE_ENDED',
    })

    return updated
  }

  // ---------------------------------------------------------------------------
  // Schema-tolerance helpers
  //
  // The consulting table has been rebuilt a few times and some deployments can
  // lag behind the Prisma schema. These helpers keep reads and the booking
  // write working until the SQL in
  // prisma/migrations/20261029130000_complete_consulting_session_columns has run.
  //
  // Important: filtering only the *input* is not enough. Prisma also builds a
  // RETURNING clause from every scalar in the model, so a read of a column that
  // is absent in Postgres fails even for a minimal insert. The helpers below
  // therefore derive the `select` from the live `information_schema` too.
  // ---------------------------------------------------------------------------

  private async createSessionSafely(data: Record<string, any>) {
    const relations = {
      user: { select: { profile: { select: { firstName: true, lastName: true, avatar: true } } } },
      consultant: { select: { profile: { select: { firstName: true, lastName: true } } } },
    }

    const columns = await getConsultingSessionColumns(this.prisma)
    const payload = filterConsultingSessionData(data, columns)
    const select = buildConsultingSessionSelect(columns)

    try {
      return await this.prisma.consultingSession.create({
        data: payload as any,
        ...(select ? { select: { ...select, ...relations } } : { include: relations }),
      } as any)
    } catch (error: any) {
      if (!isMissingColumnError(error)) throw error

      // Last-resort path: only columns that have existed since the first
      // release of consulting sessions, on both the write and the read side.
      console.error('[bookSession] retrying with base columns:', error?.message)
      return await this.prisma.consultingSession.create({
        data: {
          studentId: data.studentId,
          consultantId: data.consultantId,
          scheduledAt: data.scheduledAt,
          duration: data.duration ?? 60,
          status: data.status,
        } as any,
        select: { ...consultingSessionBaseSelect(), ...relations },
      } as any)
    }
  }

  private async findSessionsSafely(where: Record<string, any>) {
    const relationSelect = {
      user: {
        select: {
          id: true,
          email: true,
          profile: { select: { firstName: true, lastName: true, avatar: true } },
        },
      },
      consultant: {
        select: {
          id: true,
          email: true,
          isVerified: true,
          profile: { select: { firstName: true, lastName: true, avatar: true, speciality: true } },
        },
      },
    }

    const columns = await getConsultingSessionColumns(this.prisma)
    const select = buildConsultingSessionSelect(columns)
    const effectiveSelect = select
      ? { ...select, ...relationSelect }
      : { ...consultingSessionBaseSelect(), ...relationSelect }

    try {
      return await this.prisma.consultingSession.findMany({
        where,
        select: effectiveSelect as any,
        orderBy: { scheduledAt: 'desc' },
      })
    } catch (error: any) {
      if (!isMissingColumnError(error)) {
        console.error('[ConsultingService] session query failed:', error?.message)
        return []
      }

      // The cached column list may be stale. Refresh it and retry once with the
      // intersection of model and database columns.
      const freshColumns = await getConsultingSessionColumns(this.prisma, { force: true })
      const freshSelect = buildConsultingSessionSelect(freshColumns)

      if (!freshSelect) {
        console.error('[ConsultingService] cannot determine consulting columns:', error?.message)
        return []
      }

      try {
        return await this.prisma.consultingSession.findMany({
          where,
          select: { ...freshSelect, ...relationSelect } as any,
          orderBy: { scheduledAt: 'desc' },
        })
      } catch (retryError: any) {
        console.error('[ConsultingService] session query retry failed:', retryError?.message)
        return []
      }
    }
  }

  private async notify(userId: string, payload: {
    titleEn: string
    titleAr: string
    contentEn: string
    contentAr: string
    type: string
    data?: Record<string, any>
  }) {
    try {
      await this.notificationsService.createNotification({ ...payload, userId, channels: ['PUSH'] })
    } catch (e) {
      console.error('[ConsultingService] notification failed:', e)
    }
  }
}
