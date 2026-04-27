import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

export const SPECIALTY_KEYWORDS: Record<string, string[]> = {
  tech: ['برمجة','تقنية','software','tech','engineering','هندسة','developer','مطور','web','mobile','fullstack','frontend','backend','python','javascript','react','node','java','php','flutter','تطوير','كود','code','programming','ويب','موبايل','api','database','قاعدة بيانات','devops','cloud','سحابة','aws','azure','docker','kubernetes','linux','network','شبكات','typescript','vue','angular','spring','laravel'],
  data: ['data','بيانات','ai','ذكاء اصطناعي','machine learning','تعلم آلي','deep learning','neural','nlp','computer vision','analytics','تحليل','statistics','احصاء','tensorflow','pytorch','pandas','numpy','tableau','power bi','data science','علم البيانات','big data','etl','spark','hadoop'],
  security: ['security','أمن','سيبراني','cyber','hacking','penetration','اختراق','ethical hacking','ctf','forensics','malware','encryption','تشفير','firewall','vpn','soc','incident response','vulnerability','ثغرات','kali','metasploit','owasp'],
  design: ['تصميم','design','ui','ux','figma','graphic','جرافيك','واجهة','user experience','interaction','visual','branding','هوية','logo','photoshop','illustrator','sketch','motion','animation','حركة','creative','إبداع','art','فن','typography','خطوط','after effects','premiere'],
  marketing: ['تسويق','marketing','digital','رقمي','seo','sem','google ads','social media','content','محتوى','email','affiliate','influencer','brand','علامة تجارية','copywriting','growth','analytics','conversion','pr','advertising','إعلان','campaign','حملة','facebook ads','instagram','tiktok'],
  business: ['أعمال','business','management','إدارة','ريادة','entrepreneur','startup','مبيعات','sales','تجارة','finance','مالية','hr','موارد بشرية','project manager','product manager','scrum','agile','strategy','استراتيجية','consulting','استشارات','operations','accounting','محاسبة','investment','استثمار'],
}

@Injectable()
export class ConsultingService {
  constructor(private prisma: PrismaService) {}

  async getConsultants(query: { filter?: string; search?: string; sort?: string; limit?: number }) {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          OR: [
            { role: 'COACH' },
            { accountType: 'CONSULTANT' },
          ]
        },
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

      if (query.filter && query.filter !== 'all') {
        scored = scored.filter(u => u._score > 0)
      }
      if (query.search) {
        scored = scored.filter(u => u._score > 0)
      }

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

  async bookSession(userId: string, data: {
    consultantId: string
    sessionName: string
    topic: string
    description?: string
    scheduledAt: string
    meetingType: 'zoom' | 'meet'
    duration?: number
  }) {
    const scheduledAt = new Date(data.scheduledAt)
    if (scheduledAt <= new Date()) throw new BadRequestException('Cannot book a session in the past')
    if (!['zoom', 'meet'].includes(data.meetingType)) throw new BadRequestException('Only zoom or meet allowed')
    if (!data.sessionName?.trim()) throw new BadRequestException('Session name is required')
    if (!data.topic?.trim()) throw new BadRequestException('Session goal/topic is required')

    const consultant = await this.prisma.user.findUnique({
      where: { id: data.consultantId },
      include: { profile: true }
    })
    if (!consultant) throw new NotFoundException('Consultant not found')

    const session = await this.prisma.consultingSession.create({
      data: {
        userId,
        consultantId: data.consultantId,
        sessionName: data.sessionName,
        topic: data.topic,
        description: data.description || '',
        scheduledAt,
        meetingType: data.meetingType,
        duration: data.duration || (consultant.profile?.sessionDuration as number) || 60,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        userApproved: true,
        consultantApproved: false,
      },
      include: {
        user: { select: { profile: { select: { firstName: true, lastName: true, avatar: true } } } },
        consultant: { select: { profile: { select: { firstName: true, lastName: true } } } },
      }
    })

    try {
      await this.prisma.notification.create({
        data: {
          userId: data.consultantId,
          titleEn: 'New Session Booking Request',
          titleAr: 'طلب حجز جلسة جديد',
          contentEn: `${(session as any).user?.profile?.firstName} ${(session as any).user?.profile?.lastName} requested a session: "${data.sessionName}"`,
          contentAr: `${(session as any).user?.profile?.firstName} ${(session as any).user?.profile?.lastName} طلب جلسة: "${data.sessionName}"`,
          type: 'SESSION_BOOKED',
          isRead: false,
        }
      })
    } catch(e) {}

    return { success: true, data: session }
  }

  async getSessions(userId: string, role: string) {
    const isConsultant = ['COACH'].includes(role)

    const sessions = await this.prisma.consultingSession.findMany({
      where: isConsultant ? { consultantId: userId } : { userId },
      include: {
        user: { select: { id: true, profile: { select: { firstName: true, lastName: true, avatar: true } } } },
        consultant: { select: { id: true, isVerified: true, profile: { select: { firstName: true, lastName: true, avatar: true, speciality: true } } } },
      },
      orderBy: { scheduledAt: 'desc' },
    })

    const now = new Date()
    for (const s of sessions) {
      if (['PENDING','CONFIRMED','SCHEDULED'].includes(s.status) && new Date(s.scheduledAt).getTime() + (s.duration || 60) * 60000 + 1800000 < now.getTime()) {
        await this.prisma.consultingSession.update({ where: { id: s.id }, data: { status: 'EXPIRED' } }).catch(() => {})
        s.status = 'EXPIRED'
      }
    }

    return { success: true, data: sessions }
  }

  async getSession(sessionId: string, userId: string) {
    const session = await this.prisma.consultingSession.findUnique({
      where: { id: sessionId },
      include: {
        user: { select: { id: true, profile: { select: { firstName: true, lastName: true, avatar: true } } } },
        consultant: { select: { id: true, isVerified: true, profile: { select: { firstName: true, lastName: true, avatar: true, speciality: true, sessionPrice: true } } } },
      }
    })
    if (!session) throw new NotFoundException('Session not found')
    if (session.userId !== userId && session.consultantId !== userId) throw new ForbiddenException('Not authorized')
    return { success: true, data: session }
  }

  async requestReschedule(sessionId: string, consultantId: string, data: { proposedAt: string; reason?: string }) {
    const session = await this.prisma.consultingSession.findUnique({ where: { id: sessionId } })
    if (!session) throw new NotFoundException('Session not found')
    if (session.consultantId !== consultantId) throw new ForbiddenException('Not authorized')

    const proposedAt = new Date(data.proposedAt)
    if (proposedAt <= new Date()) throw new BadRequestException('Cannot propose past time')

    const updated = await this.prisma.consultingSession.update({
      where: { id: sessionId },
      data: { status: 'RESCHEDULE_REQUESTED', proposedAt, proposedBy: 'CONSULTANT', consultantApproved: true, userApproved: false }
    })

    try {
      await this.prisma.notification.create({
        data: {
          userId: session.userId,
          titleEn: 'Reschedule Request',
          titleAr: 'طلب تغيير موعد الجلسة',
          contentEn: `The consultant proposes a new time: ${proposedAt.toLocaleDateString('en')} ${proposedAt.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}${data.reason ? ' - ' + data.reason : ''}`,
          contentAr: `المستشار يقترح موعداً جديداً: ${proposedAt.toLocaleDateString('ar')} ${proposedAt.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}${data.reason ? ' - ' + data.reason : ''}`,
          type: 'SYSTEM_ANNOUNCEMENT',
          isRead: false,
        }
      })
    } catch(e) {}

    return { success: true, data: updated }
  }

  async approveReschedule(sessionId: string, userId: string) {
    const session = await this.prisma.consultingSession.findUnique({ where: { id: sessionId } })
    if (!session) throw new NotFoundException('Session not found')
    if (session.userId !== userId) throw new ForbiddenException('Not authorized')
    if (!session.proposedAt) throw new BadRequestException('No proposal found')

    const updated = await this.prisma.consultingSession.update({
      where: { id: sessionId },
      data: {
        scheduledAt: session.proposedAt,
        rescheduledFrom: session.scheduledAt,
        proposedAt: null, proposedBy: null,
        status: 'CONFIRMED', userApproved: true, consultantApproved: true,
      }
    })

    try {
      await this.prisma.notification.create({
        data: {
          userId: session.consultantId,
          titleEn: 'Reschedule Approved',
          titleAr: 'تمت الموافقة على الموعد الجديد',
          contentEn: 'The user approved the new session time',
          contentAr: 'وافق المستخدم على الموعد الجديد للجلسة',
          type: 'SYSTEM_ANNOUNCEMENT', isRead: false,
        }
      })
    } catch(e) {}

    return { success: true, data: updated }
  }

  async rejectReschedule(sessionId: string, userId: string) {
    const session = await this.prisma.consultingSession.findUnique({ where: { id: sessionId } })
    if (!session) throw new NotFoundException('Session not found')
    if (session.userId !== userId) throw new ForbiddenException('Not authorized')

    const updated = await this.prisma.consultingSession.update({
      where: { id: sessionId },
      data: { status: 'CONFIRMED', proposedAt: null, proposedBy: null, userApproved: true, consultantApproved: true }
    })

    try {
      await this.prisma.notification.create({
        data: {
          userId: session.consultantId,
          titleEn: 'Reschedule Rejected',
          titleAr: 'رُفض طلب تغيير الموعد',
          contentEn: 'The user rejected the time change, original time remains',
          contentAr: 'رفض المستخدم تغيير الموعد، الموعد الأصلي سارٍ',
          type: 'SYSTEM_ANNOUNCEMENT', isRead: false,
        }
      })
    } catch(e) {}

    return { success: true, data: updated }
  }

  async paySession(sessionId: string, userId: string) {
    const session = await this.prisma.consultingSession.findUnique({
      where: { id: sessionId },
      include: { consultant: { include: { profile: true } } }
    })
    if (!session) throw new NotFoundException('Session not found')
    if (session.userId !== userId) throw new ForbiddenException('Not authorized')
    if (session.paymentStatus === 'PAID') throw new BadRequestException('Already paid')

    const price = parseFloat((session.consultant?.profile?.sessionPrice as any)?.toString() || '0')

    const updated = await this.prisma.consultingSession.update({
      where: { id: sessionId },
      data: { paymentStatus: 'PAID', paidAt: new Date(), status: 'CONFIRMED' }
    })

    if (price > 0) {
      try {
        await this.prisma.$executeRawUnsafe(
          `UPDATE "users" SET "earningsBalance" = COALESCE("earningsBalance", 0) + ${price} WHERE "id" = '${session.consultantId}'`
        )
      } catch(e) {}
    }

    try {
      await this.prisma.notification.create({
        data: {
          userId: session.consultantId,
          titleEn: 'Payment Received - Add Meeting Link',
          titleAr: 'تم الدفع - أضف رابط الاجتماع',
          contentEn: `Session fees paid${price > 0 ? ` (${price} SAR)` : ''}. Please add the meeting link.`,
          contentAr: `تم دفع رسوم الجلسة${price > 0 ? ` (${price} ر.س)` : ''}. الرجاء إضافة رابط الاجتماع.`,
          type: 'PAYMENT_CONFIRMED', isRead: false,
        }
      })
    } catch(e) {}

    return { success: true, data: updated }
  }

  async addMeetingLink(sessionId: string, consultantId: string, data: { meetingLink: string }) {
    const isZoom = data.meetingLink?.includes('zoom.us')
    const isMeet = data.meetingLink?.includes('meet.google.com')
    if (!isZoom && !isMeet) throw new BadRequestException('Only Zoom or Google Meet links allowed')

    const session = await this.prisma.consultingSession.findUnique({ where: { id: sessionId } })
    if (!session) throw new NotFoundException('Session not found')
    if (session.consultantId !== consultantId) throw new ForbiddenException('Not authorized')
    if (session.paymentStatus !== 'PAID') throw new BadRequestException('Session must be paid first')

    const meetingLinkExpiresAt = new Date(
      new Date(session.scheduledAt).getTime() + (session.duration || 60) * 60000 + 3600000
    )

    const updated = await this.prisma.consultingSession.update({
      where: { id: sessionId },
      data: { meetingLink: data.meetingLink, meetingType: isZoom ? 'zoom' : 'meet', meetingLinkExpiresAt, status: 'SCHEDULED' }
    })

    try {
      await this.prisma.notification.create({
        data: {
          userId: session.userId,
          titleEn: `Session Link Ready - ${isZoom ? 'Zoom' : 'Google Meet'}`,
          titleAr: 'رابط الجلسة جاهز',
          contentEn: `${isZoom ? 'Zoom' : 'Google Meet'} link added. Click to join.`,
          contentAr: `تم إضافة رابط ${isZoom ? 'Zoom' : 'Google Meet'}. انقر للانضمام.`,
          type: 'SYSTEM_ANNOUNCEMENT', isRead: false,
        }
      })
    } catch(e) {}

    return { success: true, data: updated }
  }

  async completeSession(sessionId: string, userId: string) {
    const session = await this.prisma.consultingSession.findUnique({ where: { id: sessionId } })
    if (!session) throw new NotFoundException('Session not found')
    if (session.userId !== userId && session.consultantId !== userId) throw new ForbiddenException('Not authorized')

    const updated = await this.prisma.consultingSession.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED', completedBy: userId, completedAt: new Date() }
    })

    const notifyId = session.userId === userId ? session.consultantId : session.userId
    try {
      await this.prisma.notification.create({
        data: {
          userId: notifyId,
          titleEn: 'Session Completed',
          titleAr: 'تمت الجلسة بنجاح',
          contentEn: 'The consulting session has been marked as completed',
          contentAr: 'تم تأكيد اكتمال الجلسة الاستشارية',
          type: 'SYSTEM_ANNOUNCEMENT', isRead: false,
        }
      })
    } catch(e) {}

    return { success: true, data: updated }
  }

  async cancelSession(sessionId: string, userId: string, data: { reason?: string }) {
    const session = await this.prisma.consultingSession.findUnique({ where: { id: sessionId } })
    if (!session) throw new NotFoundException('Session not found')
    if (session.userId !== userId && session.consultantId !== userId) throw new ForbiddenException('Not authorized')
    if (session.paymentStatus === 'PAID') throw new BadRequestException('Cannot cancel a paid session')

    const updated = await this.prisma.consultingSession.update({
      where: { id: sessionId },
      data: { status: 'CANCELLED', cancelReason: data.reason || '' }
    })

    const notifyId = session.userId === userId ? session.consultantId : session.userId
    try {
      await this.prisma.notification.create({
        data: {
          userId: notifyId,
          titleEn: `Session Cancelled${data.reason ? ': ' + data.reason : ''}`,
          titleAr: 'تم إلغاء الجلسة',
          contentEn: `The session has been cancelled${data.reason ? ': ' + data.reason : ''}`,
          contentAr: `تم إلغاء الجلسة${data.reason ? ': ' + data.reason : ''}`,
          type: 'SESSION_CANCELLED', isRead: false,
        }
      })
    } catch(e) {}

    return { success: true, data: updated }
  }
}
