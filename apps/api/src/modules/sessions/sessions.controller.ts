import {
  Controller, Get, Post, Patch,
  Body, Param, Request, UseGuards, Query,
  NotFoundException, BadRequestException,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PrismaService } from '../../prisma/prisma.service'

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly prisma: PrismaService) {}

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
      meetingMethod: string
      topic?: string
      notes?: string
    }
  ) {
    const studentId = req.user.sub

    const consultant = await this.prisma.user.findFirst({
      where: { id: body.consultantId, accountType: 'CONSULTANT' },
      include: { profile: true }
    })
    if (!consultant) throw new NotFoundException('Consultant not found')

    const scheduledAt = new Date(body.scheduledAt)
    if (scheduledAt <= new Date()) {
      throw new BadRequestException('Session must be scheduled in the future')
    }

    const conflict = await this.prisma.consultingSession.findFirst({
      where: {
        consultantId: body.consultantId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        scheduledAt: {
          gte: new Date(scheduledAt.getTime() - 60 * 60 * 1000),
          lte: new Date(scheduledAt.getTime() + 60 * 60 * 1000),
        }
      }
    })
    if (conflict) throw new BadRequestException('This time slot is not available')

    const price = consultant.hourlyRate || 0
    const duration = body.duration || 60

    const session = await this.prisma.consultingSession.create({
      data: {
        studentId,
        consultantId: body.consultantId,
        scheduledAt,
        duration,
        meetingMethod: body.meetingMethod,
        topic: body.topic,
        notes: body.notes,
        status: 'PENDING',
        paymentStatus: price > 0 ? 'UNPAID' : 'PAID',
        price,
      },
      include: {
        consultant: { include: { profile: true } },
        student: { include: { profile: true } },
      }
    })

    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      include: { profile: true }
    })
    const studentName = `${student?.profile?.firstName || ''} ${student?.profile?.lastName || ''}`.trim()
    const dateStr = scheduledAt.toLocaleDateString('ar-SA')

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
      where.status = status
    }

    const sessions = await this.prisma.consultingSession.findMany({
      where,
      include: {
        student: {
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
      },
      orderBy: { scheduledAt: 'desc' }
    })

    console.log('[Sessions] Found sessions:', sessions.length, 'for userId:', userId)
    return { success: true, data: sessions }
  }

  @Get('my-earnings')
  async getMyEarnings(@Request() req: any) {
    const userId = req.user.sub
    
    const sessions = await this.prisma.consultingSession.findMany({
      where: { consultantId: userId },
      include: {
        student: { select: { profile: { select: { firstName: true, lastName: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    }).catch(() => [])
    
    const completed = sessions.filter((s: any) => s.status === 'COMPLETED')
    const pending = sessions.filter((s: any) => s.status === 'CONFIRMED')
    
    const total = completed.reduce((sum: number, s: any) => sum + (s.price || 0), 0)
    const pendingAmount = pending.reduce((sum: number, s: any) => sum + (s.price || 0), 0)
    
    return {
      success: true,
      data: {
        total,
        pending: pendingAmount,
        sessions: completed.map((s: any) => ({
          id: s.id,
          studentName: s.student?.profile ? `${s.student.profile.firstName} ${s.student.profile.lastName}` : 'طالب',
          amount: s.price,
          date: s.createdAt,
        }))
      }
    }
  }

  @Patch(':id/confirm')
  async confirmSession(@Param('id') id: string, @Request() req: any, @Body() body: { meetingLink?: string }) {
    const session = await this.prisma.consultingSession.findFirst({
      where: { id, consultantId: req.user.sub },
      include: {
        student: { include: { profile: true } },
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
    @Body() body: { proposedTime: string; message?: string }
  ) {
    const session = await this.prisma.consultingSession.findFirst({
      where: { id, consultantId: req.user.sub },
      include: { consultant: { include: { profile: true } } }
    })
    if (!session) throw new NotFoundException('Session not found')

    const proposedTime = new Date(body.proposedTime)

    await this.prisma.consultingSession.update({
      where: { id },
      data: {
        status: 'RESCHEDULED',
        proposedTime,
        proposedAt: new Date(),
      }
    })

    const consultantName = `${session.consultant.profile?.firstName || ''} ${session.consultant.profile?.lastName || ''}`.trim()
    const dateStr = proposedTime.toLocaleDateString('ar-SA')
    const timeStr = proposedTime.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })

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
      include: { student: { include: { profile: true } } }
    })
    if (!session || !session.proposedTime) throw new NotFoundException('Session not found')

    await this.prisma.consultingSession.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        scheduledAt: session.proposedTime,
        proposedTime: null,
      }
    })

    const studentName = `${session.student.profile?.firstName || ''} ${session.student.profile?.lastName || ''}`.trim()

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

  @Post(':id/pay')
  async paySession(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub

    const session = await this.prisma.consultingSession.findFirst({
      where: { id, studentId: userId },
      include: {
        consultant: { include: { profile: true } },
        student: { include: { profile: true } },
      }
    })
    if (!session) throw new NotFoundException('Session not found')
    if (session.paymentStatus === 'PAID') throw new BadRequestException('Already paid')

    const price = session.price || 0

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
        amount: session.price || 0,
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

    await this.prisma.notification.create({
      data: {
        userId,
        type: 'PAYMENT_CONFIRMED' as any,
        titleEn: 'Payment Successful',
        titleAr: 'تم الدفع بنجاح',
        contentEn: `Payment of ${session.price} SAR for consultation with ${consultantName} on ${dateStr}.`,
        contentAr: `تم دفع ${session.price} ريال لاستشارة مع ${consultantName} بتاريخ ${dateStr}`,
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
}
