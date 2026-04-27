import {
  Controller, Get, Post, Patch,
  Body, Param, Request, UseGuards, Query,
  NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PrismaService } from '../../prisma/prisma.service'

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('consultants')
  async getConsultants(@Query('sort') sort?: string) {
    console.log('[Sessions] Fetching consultants...', { sort })
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
        // meetingType was removed from User select
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
        // meetingType was removed from User select
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
      meetingType: string
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
        userId,
        consultantId: body.consultantId,
        scheduledAt,
        duration,
        meetingType: body.meetingType,
        topic: body.topic,
        // notes removed - use description
        status: 'PENDING',
        paymentStatus: price > 0 ? 'UNPAID' : 'PAID',
        price,
      },
      include: {
        consultant: { include: { profile: true } },
        user: { include: { profile: true } },
      }
    })

    const student = await this.prisma.user.findUnique({
      where: { id: userId },
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
      OR: [{ userId: userId }, { consultantId: userId }]
    }
    if (status && status !== 'ALL') {
      where.status = status
    }

    const sessions = await this.prisma.consultingSession.findMany({
      where,
      include: {
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
        user: { select: { profile: { select: { firstName: true, lastName: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    }).catch(() => [])
    
    const completed = sessions.filter((s: any) => s.status === 'COMPLETED')
    const confirmed = sessions.filter((s: any) => s.status === 'CONFIRMED')
    const cancelled = sessions.filter((s: any) => s.status === 'CANCELLED')
    
    const total = completed.reduce((sum: number, s: any) => sum + (s.price || 0), 0)
    const pending = confirmed.reduce((sum: number, s: any) => sum + (s.price || 0), 0)
    const refunded = cancelled.reduce((sum: number, s: any) => sum + (s.price || 0), 0)
    
    return {
      success: true,
      data: {
        total,
        pending,
        refunded,
        available: total - refunded,
        sessions: completed.map((s: any) => ({
          id: s.id,
          studentName: s.user?.profile ? `${s.user.profile.firstName} ${s.user.profile.lastName}` : 'طالب',
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
        userId: session.userId,
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

  @Patch(':id/meeting-link')
  async addMeetingLink(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { meetingLink: string; meetingType?: string }
  ) {
    const session = await this.prisma.consultingSession.findFirst({
      where: { id, consultantId: req.user.sub },
      include: { user: { include: { profile: true } } }
    })
    if (!session) throw new NotFoundException('Session not found')

    const isZoom = body.meetingLink?.includes('zoom.us')
    const isMeet = body.meetingLink?.includes('meet.google.com')
    if (!isZoom && !isMeet) throw new BadRequestException('Only Zoom or Google Meet links are allowed')

    const meetingType = body.meetingType || (isZoom ? 'zoom' : 'meet')

    const updated = await this.prisma.consultingSession.update({
      where: { id },
      data: {
        meetingLink: body.meetingLink,
        meetingType: meetingType.toUpperCase(),
        status: 'CONFIRMED',
      },
      include: {
        user: { include: { profile: true } },
        consultant: { include: { profile: true } }
      }
    })

    await this.prisma.notification.create({
      data: {
        userId: session.userId,
        type: 'SYSTEM_ANNOUNCEMENT' as any,
        titleEn: 'Meeting Link Added',
        titleAr: 'رابط الجلسة متاح الآن',
        contentEn: `Your session on ${session.scheduledAt.toLocaleDateString('ar-SA')} now has a meeting link.`,
        contentAr: `تتوفر رابط الجلسة لجلستك في ${session.scheduledAt.toLocaleDateString('ar-SA')}`,
        isRead: false,
      }
    }).catch(() => {})

    return { success: true, data: updated }
  }

  @Patch(':id/status')
  async updateSessionStatus(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { status: string; cancelReason?: string }
  ) {
    const session = await this.prisma.consultingSession.findFirst({
      where: {
        id,
        OR: [{ userId: req.user.sub }, { consultantId: req.user.sub }]
      }
    })
    if (!session) throw new NotFoundException('Session not found')

    const allowedStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'EXPIRED']
    if (!allowedStatuses.includes(body.status)) {
      throw new BadRequestException('Invalid status')
    }

    const updateData: any = { status: body.status }
    if (body.status === 'COMPLETED') updateData.completedAt = new Date()
    if (body.status === 'CANCELLED') {
      updateData.cancelledAt = new Date()
      if (body.cancelReason) updateData.cancelReason = body.cancelReason
    }

    const updated = await this.prisma.consultingSession.update({
      where: { id },
      data: updateData
    })

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
        userId: session.userId,
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
        proposedAt: new Date(),
      }
    })

    const consultantName = `${session.consultant.profile?.firstName || ''} ${session.consultant.profile?.lastName || ''}`.trim()
    const dateStr = proposedAt.toLocaleDateString('ar-SA')
    const timeStr = proposedAt.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })

    await this.prisma.notification.create({
      data: {
        userId: session.userId,
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
      where: { id, userId: req.user.sub, status: 'RESCHEDULED' },
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

    const studentName = `${session.user.profile?.firstName || ''} ${session.user.profile?.lastName || ''}`.trim()

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
      where: { id, userId: userId },
      include: {
        consultant: { include: { profile: true } },
        user: { include: { profile: true } },
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
      where: { id, userId: req.user.sub },
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
        OR: [{ userId: req.user.sub }, { consultantId: req.user.sub }]
      }
    })
    if (!session) throw new NotFoundException('Session not found')

    await this.prisma.consultingSession.update({
      where: { id },
      data: { status: 'CANCELLED' }
    })

    const notifyUserId = req.user.sub === session.userId
      ? session.consultantId
      : session.userId

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
    if (session.userId !== userId) throw new ForbiddenException('Not your session')
    
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    const price = session.price || 0
    
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
    
    await this.prisma.consultingSession.update({
      where: { id },
      data: { status: 'CONFIRMED', paymentStatus: 'PAID' }
    })
    
    // Notify student
    await this.prisma.notification.create({
      data: { userId, titleEn: 'تم تأكيد الجلسة', titleAr: 'تم تأكيد الجلسة', contentEn: 'تم الدفع وتأكيد جلستك بنجاح', contentAr: 'تم الدفع وتأكيد جلستك بنجاح', type: 'SUCCESS' as any, isRead: false }
    }).catch(() => {})
    
    // Notify consultant
    if (session.consultantId) {
      await this.prisma.notification.create({
        data: { userId: session.consultantId, titleEn: 'تم تأكيد جلستك', titleAr: 'تم تأكيد جلستك', contentEn: 'قام المستخدم بتأكيد الجلسة', contentAr: 'قام المستخدم بتأكيد الجلسة', type: 'INFO' as any, isRead: false }
      }).catch(() => {})
    }
    
    return { success: true, message: 'Session confirmed' }
  }

  @Patch(':id/complete')
  async completeSession(@Param('id') id: string, @Request() req: any) {
    const session = await this.prisma.consultingSession.findUnique({ where: { id } }).catch(() => null)
    if (!session) throw new NotFoundException('Session not found')
    
    const isAllowed = session.consultantId === req.user.id || 
                      session.userId === req.user.id || 
                      req.user.accountType === 'ADMIN'
    if (!isAllowed) throw new ForbiddenException()
    
    // Add earnings to consultant (85%)
    if (session.consultantId && (session.price || 0) > 0) {
      const earnings = (session.price || 0) * 0.85
      await this.prisma.user.update({
        where: { id: session.consultantId },
        data: { walletBalance: { increment: earnings } }
      }).catch(() => {})
    }
    
    await this.prisma.consultingSession.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date() }
    })
    
    return { success: true }
  }

  @Patch(':id/cancel-refund')
  async cancelWithRefund(@Param('id') id: string, @Request() req: any) {
    const session = await this.prisma.consultingSession.findUnique({ where: { id } }).catch(() => null)
    if (!session) throw new NotFoundException('Session not found')
    
    const isAllowed = session.consultantId === req.user.id ||
                      session.userId === req.user.id ||
                      req.user.accountType === 'ADMIN'
    if (!isAllowed) throw new ForbiddenException()
    
    // Refund if was paid
    if (session.paymentStatus === 'PAID' && (session.price || 0) > 0 && session.userId) {
      await this.prisma.user.update({
        where: { id: session.userId },
        data: { walletBalance: { increment: session.price } }
      })
      await this.prisma.walletTransaction.create({
        data: { userId: session.userId, type: 'REFUND', amount: session.price, description: 'استرداد رسوم جلسة ملغاة' }
      }).catch(() => {})
      
      // Remove consultant earnings
      if (session.consultantId) {
        await this.prisma.user.update({
          where: { id: session.consultantId },
          data: { walletBalance: { decrement: (session.price || 0) * 0.85 } }
        }).catch(() => {})
      }
      
      // Notify student
      await this.prisma.notification.create({
        data: { userId: session.userId, titleEn: 'تم الاسترداد', titleAr: 'تم الاسترداد', contentEn: `تم إرجاع ${session.price} ريال لمحفظتك`, contentAr: `تم إرجاع ${session.price} ريال لمحفظتك`, type: 'SUCCESS' as any, isRead: false }
      }).catch(() => {})
    }
    
    await this.prisma.consultingSession.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date() }
    })
    
    return { success: true, refunded: session.paymentStatus === 'PAID' }
  }
}
