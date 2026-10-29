import {
  Controller, Get, Post, Patch,
  Body, Param, Request, UseGuards, Query,
  NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PrismaService } from '../../prisma/prisma.service'
import { DailyService } from '../live/daily.service'
import {
  buildConsultingSessionSelect,
  consultingSessionBaseSelect,
  filterConsultingSessionData,
  getConsultingSessionColumns,
  isMissingColumnError,
} from '../consulting/consulting-columns'

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dailyService: DailyService,
  ) {}

  @Get('consultants')
  async getConsultants() {
    console.log('[Sessions] Fetching consultants...')
    const consultants = await this.prisma.user.findMany({
      where: {
        accountType: 'CONSULTANT',
        status: { in: ['ACTIVE', 'PENDING'] },
      },
      select: {
        id: true,
        email: true,
        isVerified: true,
        hourlyRate: true,
        meetingMethod: true,
        bio: true,
        speciality: true,
        experience: true,
        linkedinUrl: true,
        profile: {
          select: { firstName: true, lastName: true, avatar: true, country: true }
        },
        _count: { select: { consultantSessions: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    console.log('[Sessions] Found consultants:', consultants.length)
    return { success: true, data: consultants }
  }

  @Get('consultants/:id')
  async getConsultant(@Param('id') id: string) {
    const consultant = await this.prisma.user.findFirst({
      where: { id, accountType: 'CONSULTANT', status: { in: ['ACTIVE', 'PENDING'] } },
      select: {
        id: true,
        hourlyRate: true,
        meetingMethod: true,
        bio: true,
        speciality: true,
        experience: true,
        linkedinUrl: true,
        profile: { select: { firstName: true, lastName: true, avatar: true, country: true } },
        _count: { select: { consultantSessions: true } },
      }
    })
    if (!consultant) throw new NotFoundException('Consultant not found')
    return { success: true, data: consultant }
  }

  @Post('book')
  async bookSession(
    @Request() req: any,
    @Body() body: {
      consultantId: string
      scheduledAt: string
      duration?: number
      meetingType?: string
      topic?: string
      notes?: string
    }
  ) {
    const userId = req.user.sub

    const consultant = await this.prisma.user.findFirst({
      where: { id: body.consultantId, accountType: 'CONSULTANT' },
      include: { profile: true }
    })
    if (!consultant) throw new NotFoundException('Consultant not found')

    const scheduledAt = new Date(body.scheduledAt)
    if (scheduledAt <= new Date()) {
      throw new BadRequestException('Session must be scheduled in the future')
    }

    // Only select columns that have existed since the first release. Reading
    // every scalar here is what made this endpoint 500 while the optional
    // consulting columns were still missing in production.
    const conflict = await this.prisma.consultingSession.findFirst({
      where: {
        consultantId: body.consultantId,
        status: { in: ['PENDING', 'PENDING_APPROVAL', 'AWAITING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS'] },
        scheduledAt: {
          gte: new Date(scheduledAt.getTime() - 60 * 60 * 1000),
          lte: new Date(scheduledAt.getTime() + 60 * 60 * 1000),
        }
      },
      select: { id: true, scheduledAt: true, duration: true },
    })
    if (conflict) throw new BadRequestException('This time slot is not available')

    const price = Number(consultant.hourlyRate || consultant.profile?.sessionPrice || 0)
    const duration = body.duration || 60
    const topic = body.topic?.trim() || 'استشارة مهنية'

    const relations = {
      consultant: {
        select: {
          id: true,
          email: true,
          speciality: true,
          profile: { select: { firstName: true, lastName: true, avatar: true } },
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          profile: { select: { firstName: true, lastName: true, avatar: true } },
        },
      },
    }
    const columns = await getConsultingSessionColumns(this.prisma)
    const payload = filterConsultingSessionData({
      studentId: userId,
      consultantId: body.consultantId,
      sessionName: topic,
      scheduledAt,
      duration,
      meetingType: body.meetingType || 'daily',
      topic,
      notes: body.notes ?? null,
      description: body.notes ?? '',
      status: 'PENDING_APPROVAL',
      price,
      currency: 'SAR',
      paymentStatus: price > 0 ? 'UNPAID' : 'PAID',
    }, columns)
    const select = buildConsultingSessionSelect(columns)

    let session: any
    try {
      session = await this.prisma.consultingSession.create({
        data: payload as any,
        ...(select ? { select: { ...select, ...relations } } : { include: relations }),
      } as any)
    } catch (error: any) {
      if (!isMissingColumnError(error)) throw error
      console.error('[Sessions/book] retrying with base columns:', error?.message)
      session = await this.prisma.consultingSession.create({
        data: {
          studentId: userId,
          consultantId: body.consultantId,
          scheduledAt,
          duration,
          status: 'PENDING_APPROVAL',
        } as any,
        select: { ...consultingSessionBaseSelect(), ...relations },
      } as any)
    }

    const consultantName = session.consultant?.profile
      ? `${session.consultant.profile.firstName || ''} ${session.consultant.profile.lastName || ''}`.trim()
      : 'مستشار'
    const dateStr = scheduledAt.toLocaleDateString('ar-SA')

    const student = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    })
    const studentName = `${student?.profile?.firstName || ''} ${student?.profile?.lastName || ''}`.trim()

    await this.prisma.notification.create({
      data: {
        userId: body.consultantId,
        type: 'SYSTEM_ANNOUNCEMENT' as any,
        titleEn: 'New Consultation Request',
        titleAr: 'طلب استشارة جديد',
        contentEn: `${studentName} requests a consultation on ${dateStr} - ${body.topic || 'Career Consultation'}`,
        contentAr: `${studentName} يطلب استشارة بتاريخ ${dateStr} - ${body.topic || 'استشارة مهنية'}`,
        isRead: false,
      }
    }).catch(() => {})

    return { success: true, data: session }
  }

  @Get('my-sessions')
  async getMySessions(@Request() req: any, @Query('status') status?: string) {
    const userId = req.user.sub
    console.log('[Sessions] getMySessions userId:', userId)

    const where: any = {
      OR: [{ studentId: userId }, { consultantId: userId }]
    }
    if (status && status !== 'ALL') {
      // Rows created before the rebuild still carry the old status values.
      // Query both spellings so legacy sessions never disappear.
      if (status === 'PENDING_APPROVAL') {
        where.status = { in: ['PENDING_APPROVAL', 'PENDING'] }
      } else if (status === 'CANCELLED') {
        where.status = { in: ['CANCELLED', 'REJECTED'] }
      } else if (status === 'RESCHEDULE_REQUESTED') {
        where.status = { in: ['RESCHEDULE_REQUESTED', 'RESCHEDULED'] }
      } else {
        where.status = status
      }
    }

    const relationSelect = {
      user: {
        select: {
          id: true,
          email: true,
          profile: { select: { firstName: true, lastName: true, avatar: true } }
        }
      },
      consultant: {
        select: {
          id: true,
          email: true,
          speciality: true,
          hourlyRate: true,
          profile: { select: { firstName: true, lastName: true, avatar: true } }
        }
      },
    }

    // Never select a column that production has not migrated yet.
    const columns = await getConsultingSessionColumns(this.prisma)
    const select = buildConsultingSessionSelect(columns) ?? consultingSessionBaseSelect()

    try {
      const sessions = await this.prisma.consultingSession.findMany({
        where,
        select: { ...select, ...relationSelect } as any,
        orderBy: { scheduledAt: 'desc' }
      })

      console.log('[Sessions] Found sessions:', sessions.length, 'for userId:', userId)
      return { success: true, data: sessions }
    } catch (error: any) {
      if (!isMissingColumnError(error)) throw error
      const freshColumns = await getConsultingSessionColumns(this.prisma, { force: true })
      const freshSelect = buildConsultingSessionSelect(freshColumns) ?? consultingSessionBaseSelect()
      try {
        const sessions = await this.prisma.consultingSession.findMany({
          where,
          select: { ...freshSelect, ...relationSelect } as any,
          orderBy: { scheduledAt: 'desc' }
        })
        return { success: true, data: sessions }
      } catch (retryError: any) {
        console.error('[Sessions] my-sessions retry failed:', retryError?.message)
        return { success: true, data: [] }
      }
    }
  }

  @Get('my-earnings')
  async getMyEarnings(@Request() req: any) {
    const userId = req.user?.sub || req.user?.id

    const columns = await getConsultingSessionColumns(this.prisma)
    const earningsFields = [
      'id', 'studentId', 'consultantId', 'sessionName', 'topic', 'scheduledAt',
      'duration', 'status', 'price', 'paymentStatus', 'createdAt',
    ]
    const scalarSelect: Record<string, boolean> = { id: true }
    for (const field of earningsFields) {
      // When the column lookup is unavailable assume the base earning fields
      // (they existed before the rebuild) and let the catch below contain it.
      if (!columns || columns.has(field)) scalarSelect[field] = true
    }

    const sessions = await this.prisma.consultingSession.findMany({
      where: { consultantId: userId },
      select: {
        ...scalarSelect,
        user: { select: { profile: { select: { firstName: true, lastName: true } } } },
      } as any,
      orderBy: { createdAt: 'desc' }
    }).catch((error: any) => {
      console.error('[Sessions] my-earnings query failed:', error?.message)
      return []
    })

    const completed = sessions.filter((s: any) => s.status === 'COMPLETED')
    const pendingSessions = sessions.filter((s: any) => ['CONFIRMED', 'IN_PROGRESS'].includes(s.status))
    // Legacy rows used REJECTED instead of CANCELLED.
    const cancelled = sessions.filter((s: any) => ['CANCELLED', 'REJECTED'].includes(s.status))

    const total = completed.reduce((sum: number, s: any) => sum + (Number(s.price) || 0), 0)
    const pending = pendingSessions.reduce((sum: number, s: any) => sum + (Number(s.price) || 0), 0)
    const refunded = cancelled.reduce((sum: number, s: any) => sum + (Number(s.price) || 0), 0)

    const recentSessions = sessions.map((s: any) => ({
      id: s.id,
      sessionName: (s as any).sessionName || (s as any).topic || null,
      studentName: (s as any).user?.profile
        ? `${(s as any).user.profile.firstName || ''} ${(s as any).user.profile.lastName || ''}`.trim()
        : 'طالب',
      clientName: (s as any).user?.profile
        ? `${(s as any).user.profile.firstName || ''} ${(s as any).user.profile.lastName || ''}`.trim()
        : 'طالب',
      amount: Number((s as any).price) || 0,
      price: Number((s as any).price) || 0,
      status: s.status,
      paymentStatus: (s as any).paymentStatus || 'UNPAID',
      date: (s as any).scheduledAt || s.createdAt,
      scheduledAt: (s as any).scheduledAt || null,
    }))

    return {
      success: true,
      data: {
        // New shape used by the earnings dashboard.
        totalEarned: total,
        pendingEarnings: pending,
        refunded,
        available: total - refunded,
        sessionsCount: completed.length,
        recentSessions,
        // Backwards-compatible aliases for older clients.
        total,
        pending,
        totalEarnings: total,
        pendingAmount: pending,
        availableBalance: total - refunded,
        sessions: recentSessions,
      }
    }
  }

  @Patch(':id/confirm')
  async confirmSession(@Param('id') id: string, @Request() req: any, @Body() body: { meetingLink?: string }) {
    const session = await this.prisma.consultingSession.findFirst({
      where: { id, consultantId: req.user.sub },
      include: {
        user: { include: { profile: true } },
        consultant: { include: { profile: true } }
      }
    })
    if (!session) throw new NotFoundException('Session not found')

    const updated = await this.prisma.consultingSession.update({
      where: { id },
      data: { status: 'CONFIRMED', meetingLink: body.meetingLink }
    })

    const consultantName = `${session.consultant.profile?.firstName || ''} ${session.consultant.profile?.lastName || ''}`.trim()
    const dateStr = session.scheduledAt.toLocaleDateString('ar-SA')

    await this.prisma.notification.create({
      data: {
        userId: session.studentId,
        type: 'SYSTEM_ANNOUNCEMENT' as any,
        titleEn: 'Consultation Confirmed',
        titleAr: 'تم تأكيد استشارتك',
        contentEn: `${consultantName} has confirmed your consultation on ${dateStr}.${body.meetingLink ? ` Meeting link: ${body.meetingLink}` : ''}`,
        contentAr: `قبل ${consultantName} طلب استشارتك بتاريخ ${dateStr}. ${body.meetingLink ? `رابط الاجتماع: ${body.meetingLink}` : ''}`,
        isRead: false,
      }
    }).catch(() => {})

    return { success: true, data: updated }
  }

  @Patch(':id/reject')
  async rejectSession(@Param('id') id: string, @Request() req: any, @Body() body: { reason?: string }) {
    const session = await this.prisma.consultingSession.findFirst({
      where: { id, consultantId: req.user.sub },
      include: { consultant: { include: { profile: true } } }
    })
    if (!session) throw new NotFoundException('Session not found')

    await this.prisma.consultingSession.update({
      where: { id },
      data: { status: 'REJECTED' }
    })

    const consultantName = `${session.consultant.profile?.firstName || ''} ${session.consultant.profile?.lastName || ''}`.trim()

    await this.prisma.notification.create({
      data: {
        userId: session.studentId,
        type: 'SYSTEM_ANNOUNCEMENT' as any,
        titleEn: 'Consultation Request Declined',
        titleAr: 'تم رفض طلب الاستشارة',
        contentEn: `${consultantName} declined the consultation.${body.reason ? ` Reason: ${body.reason}` : ' You can choose another time or consultant.'}`,
        contentAr: `اعتذر ${consultantName} عن الاستشارة. ${body.reason ? `السبب: ${body.reason}` : 'يمكنك اختيار موعد آخر أو مستشار آخر.'}`,
        isRead: false,
      }
    }).catch(() => {})

    return { success: true }
  }

  @Patch(':id/reschedule')
  async rescheduleSession(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { proposedAt: string; message?: string }
  ) {
    const session = await this.prisma.consultingSession.findFirst({
      where: { id, consultantId: req.user.sub },
      include: { consultant: { include: { profile: true } } }
    })
    if (!session) throw new NotFoundException('Session not found')

    const proposedAt = new Date(body.proposedAt)

    await this.prisma.consultingSession.update({
      where: { id },
      data: {
        status: 'RESCHEDULED',
        proposedAt,
      }
    })

    const consultantName = `${session.consultant.profile?.firstName || ''} ${session.consultant.profile?.lastName || ''}`.trim()
    const dateStr = proposedAt.toLocaleDateString('ar-SA')
    const timeStr = proposedAt.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })

    await this.prisma.notification.create({
      data: {
        userId: session.studentId,
        type: 'SYSTEM_ANNOUNCEMENT' as any,
        titleEn: 'New Time Proposed for Consultation',
        titleAr: 'اقتراح موعد جديد للاستشارة',
        contentEn: `${consultantName} proposes a new time: ${dateStr} ${timeStr}.${body.message ? ` ${body.message}` : ''}`,
        contentAr: `${consultantName} يقترح موعداً جديداً: ${dateStr} ${timeStr}. ${body.message || ''}`,
        isRead: false,
      }
    }).catch(() => {})

    return { success: true }
  }

  @Patch(':id/accept-reschedule')
  async acceptReschedule(@Param('id') id: string, @Request() req: any) {
    const session = await this.prisma.consultingSession.findFirst({
      where: { id, studentId: req.user.sub, status: 'RESCHEDULED' },
      include: { user: { include: { profile: true } } }
    })
    if (!session || !session.proposedAt) throw new NotFoundException('Session not found')

    await this.prisma.consultingSession.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        scheduledAt: session.proposedAt,
        proposedAt: null,
      }
    })

    const studentName = `${(session as any).user?.profile?.firstName || ''} ${(session as any).user?.profile?.lastName || ''}`.trim()

    await this.prisma.notification.create({
      data: {
        userId: session.consultantId,
        type: 'SYSTEM_ANNOUNCEMENT' as any,
        titleEn: 'Student Accepted New Time',
        titleAr: 'قبل الطالب الموعد الجديد',
        contentEn: `${studentName} accepted the new consultation time.`,
        contentAr: `${studentName} وافق على الموعد الجديد للاستشارة.`,
        isRead: false,
      }
    }).catch(() => {})

    return { success: true }
  }

  @Post(':id/daily-room')
  async createDailyRoom(@Param('id') id: string, @Request() req: any) {
    const session = await this.prisma.consultingSession.findUnique({
      where: { id },
      select: { id: true, consultantId: true, studentId: true, dailyRoomName: true, status: true },
    })
    if (!session) throw new NotFoundException('Session not found')

    const isParticipant = session.consultantId === req.user.sub || session.studentId === req.user.sub
    if (!isParticipant) throw new ForbiddenException('Not a participant in this session')

    if (['CANCELLED', 'EXPIRED', 'COMPLETED'].includes(session.status)) {
      throw new BadRequestException('Cannot create a room for a session that is not active')
    }

    // Reuse the existing room if already created
    let roomName = session.dailyRoomName
    if (!roomName) {
      const room = await this.dailyService.createConsultingRoom(id)
      roomName = room.roomName
      await this.prisma.consultingSession.update({
        where: { id },
        data: { dailyRoomName: roomName, meetingType: 'daily' },
      })
    }

    const isConsultant = session.consultantId === req.user.sub
    const token = await this.dailyService.createToken(roomName, isConsultant)
    const domain = process.env.DAILY_DOMAIN || 'deveway'
    const roomUrl = `https://${domain}.daily.co/${roomName}`

    return { success: true, data: { roomUrl, token, roomName } }
  }

  @Post(':id/pay')
  async paySession(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub

    const session = await this.prisma.consultingSession.findFirst({
      where: { id, studentId: userId },
      include: {
        consultant: { include: { profile: true } },
        user: { include: { profile: true } },
      }
    })
    if (!session) throw new NotFoundException('Session not found')
    if (session.paymentStatus === 'PAID') throw new BadRequestException('Already paid')

    const price = (session as any).price || 0

    // FREE session
    if (price === 0) {
      await this.doPaySession(session, userId, 'FREE', `FREE_${Date.now()}`)
      return { success: true, data: { free: true } }
    }

    // STRIPE mode
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (stripeKey) {
      const Stripe = require('stripe')
      const stripe = new Stripe(stripeKey, { apiVersion: '2024-11-20.acacia' })

      const intent = await stripe.paymentIntents.create({
        amount: Math.round(price * 100),
        currency: 'sar',
        metadata: {
          userId,
          sessionId: session.id,
          type: 'SESSION',
        },
        description: `DeveWay: استشارة مع ${session.consultant.profile?.firstName || ''}`,
      })

      await this.prisma.payment.create({
        data: {
          userId,
          amount: price,
          method: 'STRIPE_CARD',
          status: 'PENDING',
          transactionId: intent.id,
          stripeIntentId: intent.id,
          itemType: 'SESSION',
          itemId: session.id,
        }
      }).catch(() => {})

      return {
        success: true,
        data: {
          clientSecret: intent.client_secret,
          amount: price,
          sessionId: session.id,
          mode: 'stripe',
        }
      }
    }

    // SANDBOX fallback
    const txId = `SESSION_SANDBOX_${Date.now()}`
    await this.doPaySession(session, userId, 'SANDBOX', txId)
    return { success: true, data: { sandbox: true, sessionId: session.id } }
  }

  @Post(':id/confirm-payment')
  async confirmSessionPayment(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { paymentIntentId: string }
  ) {
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) throw new BadRequestException('Stripe not configured')

    const Stripe = require('stripe')
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-11-20.acacia' })

    const intent = await stripe.paymentIntents.retrieve(body.paymentIntentId)
    if (intent.status !== 'succeeded') throw new BadRequestException('Payment not completed')

    const session = await this.prisma.consultingSession.findFirst({
      where: { id, studentId: req.user.sub },
      include: { consultant: { include: { profile: true } } }
    })
    if (!session) throw new NotFoundException('Session not found')

    await this.prisma.payment.updateMany({
      where: { transactionId: body.paymentIntentId },
      data: { status: 'SUCCESS' }
    })

    await this.doPaySession(session, req.user.sub, 'STRIPE', body.paymentIntentId)

    return { success: true }
  }

  private async doPaySession(session: any, userId: string, method: string, txId: string) {
    await this.prisma.payment.upsert({
      where: { transactionId: txId },
      update: { status: 'SUCCESS' },
      create: {
        userId,
        amount: (session as any).price || 0,
        method,
        status: 'SUCCESS',
        transactionId: txId,
        itemType: 'SESSION',
        itemId: session.id,
      }
    }).catch(() => {})

    const payment = await this.prisma.payment.findFirst({
      where: { transactionId: txId }
    })

    await this.prisma.consultingSession.update({
      where: { id: session.id },
      data: {
        paymentStatus: 'PAID',
        ...(payment ? { paymentId: payment.id } : {}),
      }
    })

    const consultantName = session.consultant?.profile
      ? `${session.consultant.profile.firstName || ''} ${session.consultant.profile.lastName || ''}`.trim()
      : 'المستشار'
    const dateStr = new Date(session.scheduledAt).toLocaleDateString('ar-SA')

    await this.prisma.userActivity.create({
      data: {
        userId,
        action: 'PAYMENT_SUCCESS',
        entity: 'Session',
        entityId: session.id,
        metadata: { amount: session.price, consultantName, date: dateStr, method },
      },
    }).catch(() => {})

    await this.prisma.notification.create({
      data: {
        userId,
        type: 'PAYMENT_CONFIRMED' as any,
        titleEn: 'Payment Successful',
        titleAr: 'تم الدفع بنجاح',
        contentEn: `Payment of ${(session as any).price} SAR for consultation with ${consultantName} on ${dateStr}.`,
        contentAr: `تم دفع ${(session as any).price} ريال لاستشارة مع ${consultantName} بتاريخ ${dateStr}`,
        isRead: false,
      }
    }).catch(() => {})
  }

  @Patch(':id/cancel')
  async cancelSession(@Param('id') id: string, @Request() req: any) {
    const session = await this.prisma.consultingSession.findFirst({
      where: {
        id,
        OR: [{ studentId: req.user.sub }, { consultantId: req.user.sub }]
      }
    })
    if (!session) throw new NotFoundException('Session not found')

    await this.prisma.consultingSession.update({
      where: { id },
      data: { status: 'CANCELLED' }
    })

    const notifyUserId = req.user.sub === session.studentId
      ? session.consultantId
      : session.studentId

    await this.prisma.notification.create({
      data: {
        userId: notifyUserId,
        type: 'SYSTEM_ANNOUNCEMENT' as any,
        titleEn: 'Consultation Cancelled',
        titleAr: 'تم إلغاء الاستشارة',
        contentEn: 'The consultation appointment has been cancelled.',
        contentAr: 'تم إلغاء موعد الاستشارة.',
        isRead: false,
      }
    }).catch(() => {})

    return { success: true }
  }

  @Post(':id/pay-wallet')
  async payWithWallet(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.id
    
    const session = await this.prisma.consultingSession.findUnique({ where: { id } }).catch(() => null)
    if (!session) throw new NotFoundException('Session not found')
    if (session.studentId !== userId) throw new ForbiddenException('Not your session')
    
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    const price = (session as any).price || 0
    
    if (price > 0 && (user?.walletBalance || 0) < price) {
      throw new BadRequestException('Insufficient wallet balance')
    }
    
    // Deduct from wallet
    if (price > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { walletBalance: { decrement: price } }
      })
      await this.prisma.walletTransaction.create({
        data: { userId, type: 'SESSION_PAYMENT', amount: -price, description: 'دفع جلسة استشارية' }
      }).catch(() => {})
    }
    
    // Free sessions: auto-confirm; paid sessions: only mark paid, consultant confirms separately
    const isFree = !price || price <= 0
    await this.prisma.consultingSession.update({
      where: { id },
      data: isFree
        ? { status: 'CONFIRMED', paymentStatus: 'PAID' }
        : { paymentStatus: 'PAID' }
    })
    
    // Notify student
    await this.prisma.notification.create({
      data: {
        userId,
        titleEn: isFree ? 'Free Session Confirmed' : 'Payment Successful',
        titleAr: isFree ? 'تم تأكيد الجلسة المجانية' : 'تم الدفع بنجاح',
        contentEn: isFree
          ? `Your free session has been confirmed`
          : `Payment of ${price} SAR completed. Waiting for consultant to confirm.`,
        contentAr: isFree
          ? `تم تأكيد جلستك المجانية`
          : `تم دفع ${price} ر.س. في انتظار تأكيد المستشار.`,
        type: 'SUCCESS' as any, isRead: false,
      }
    }).catch(() => {})
    
    // Notify consultant
    if (session.consultantId) {
      await this.prisma.notification.create({
        data: {
          userId: session.consultantId,
          titleEn: isFree ? 'Free Session Booked' : 'Payment Received',
          titleAr: isFree ? 'تم حجز جلسة مجانية' : 'تم استلام الدفع',
          contentEn: isFree
            ? `A free session has been booked. Please confirm.`
            : `Payment of ${price} SAR received for the session. Please confirm.`,
          contentAr: isFree
            ? `تم حجز جلسة مجانية. يرجى التأكيد.`
            : `تم استلام دفع ${price} ر.س للجلسة. يرجى تأكيد الموعد.`,
          type: 'INFO' as any, isRead: false,
        }
      }).catch(() => {})
    }
    
    return { success: true, message: isFree ? 'Session confirmed' : 'Payment completed' }
  }

  @Patch(':id/complete')
  async completeSession(@Param('id') id: string, @Request() req: any, @Body() body: { actualDuration?: number } = {}) {
    const session = await this.prisma.consultingSession.findUnique({ where: { id } }).catch(() => null)
    if (!session) throw new NotFoundException('Session not found')

    const isAllowed = session.consultantId === req.user.id ||
                      session.studentId === req.user.id ||
                      req.user.accountType === 'ADMIN'
    if (!isAllowed) throw new ForbiddenException()

    // Add earnings to consultant (85%)
    if (session.consultantId && ((session as any).price || 0) > 0) {
      const earnings = ((session as any).price || 0) * 0.85
      await this.prisma.user.update({
        where: { id: session.consultantId },
        data: { walletBalance: { increment: earnings } }
      }).catch(() => {})
    }

    const updateData: any = { status: 'COMPLETED', completedAt: new Date() }
    if (body.actualDuration != null && body.actualDuration > 0) {
      updateData.actualDuration = Math.round(body.actualDuration)
    }

    await this.prisma.consultingSession.update({
      where: { id },
      data: updateData,
    })

    return { success: true }
  }

  @Patch(':id/cancel-refund')
  async cancelWithRefund(@Param('id') id: string, @Request() req: any) {
    const session = await this.prisma.consultingSession.findUnique({ where: { id } }).catch(() => null)
    if (!session) throw new NotFoundException('Session not found')
    
    const isAllowed = session.consultantId === req.user.id ||
                      session.studentId === req.user.id ||
                      req.user.accountType === 'ADMIN'
    if (!isAllowed) throw new ForbiddenException()
    
    // Refund if was paid
    if (session.paymentStatus === 'PAID' && ((session as any).price || 0) > 0 && session.studentId) {
      await this.prisma.user.update({
        where: { id: session.studentId },
        data: { walletBalance: { increment: (session as any).price } }
      })
      await this.prisma.walletTransaction.create({
        data: { userId: session.studentId, type: 'REFUND', amount: (session as any).price, description: 'استرداد رسوم جلسة ملغاة' }
      }).catch(() => {})
      
      // Remove consultant earnings
      if (session.consultantId) {
        await this.prisma.user.update({
          where: { id: session.consultantId },
          data: { walletBalance: { decrement: ((session as any).price || 0) * 0.85 } }
        }).catch(() => {})
      }
      
      // Notify student
      await this.prisma.notification.create({
        data: { userId: session.studentId, titleEn: 'تم الاسترداد', titleAr: 'تم الاسترداد', contentEn: `تم إرجاع ${(session as any).price} ريال لمحفظتك`, contentAr: `تم إرجاع ${(session as any).price} ريال لمحفظتك`, type: 'SUCCESS' as any, isRead: false }
      }).catch(() => {})
    }
    
    await this.prisma.consultingSession.update({
      where: { id },
      data: { status: 'CANCELLED' }
    })
    
    return { success: true, refunded: session.paymentStatus === 'PAID' }
  }
}
