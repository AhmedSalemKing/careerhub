import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { ZoomService } from './zoom.service';

@Injectable()
export class CoachingService {
  private readonly logger = new Logger(CoachingService.name);
  private readonly cacheTtlMs = 30_000;
  private readonly cache = new Map<string, { expiresAt: number; data: any }>();

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private zoomService: ZoomService,
  ) { }

  async getCoaches(specialization?: string, language: string = 'en') {
    const cacheKey = `coaches:${specialization || ''}:${language}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const where: any = {
      user: {
        isActive: true,
      },
    };

    if (specialization) {
      (where as any).specialties = {
        has: specialization,
      };
    }

    const coaches = await this.prisma.coach.findMany({
      where,
      select: {
        id: true,
        hourlyRate: true,
        rating: true,
        specialties: true,
        user: {
          select: {
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    const data = coaches.map(coach => ({
      id: coach.id,
      hourlyRate: coach.hourlyRate,
      rating: coach.rating,
      specialties: coach.specialties,
      user: {
        firstName: coach.user.profile?.firstName,
        lastName: coach.user.profile?.lastName,
        avatar: coach.user.profile?.avatar,
      },
    }));

    this.cache.set(cacheKey, {
      expiresAt: Date.now() + this.cacheTtlMs,
      data,
    });

    return data;
  }

  async getCoach(id: string, language: string = 'en') {
    const coach = await this.prisma.coach.findUnique({
      where: { id },
      include: {
        user: {
          include: { profile: true },
        },
        coachingSessions: {
          where: {
            status: 'COMPLETED',
          },
          include: {
            reviews: true,
            user: {
              include: { profile: true },
            },
          },
        },
        _count: {
          select: {
            coachingSessions: {
              where: {
                status: 'COMPLETED',
              },
            },
            reviews: true,
          },
        },
      },
    });

    if (!coach) {
      throw new NotFoundException('Coach not found');
    }

    const totalReviews = (coach as any)._count.reviews;
    const averageRating = totalReviews > 0
      ? coach.coachingSessions.reduce((sum, session) => {
        const sessionRating = (session as any).reviews.reduce((reviewSum, review) => reviewSum + review.rating, 0);
        return sum + (sessionRating / (session as any).reviews.length || 0);
      }, 0) / coach.coachingSessions.length
      : 0;

    const reviews = coach.coachingSessions
      .flatMap(session => (session as any).reviews)
      .map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        user: {
          firstName: review.user.profile?.firstName,
          lastName: review.user.profile?.lastName,
          avatar: review.user.profile?.avatar,
        },
      }));

    return {
      id: coach.id,
      user: {
        id: coach.user.id,
        firstName: coach.user.profile?.firstName,
        lastName: coach.user.profile?.lastName,
        avatar: coach.user.profile?.avatar,
        email: coach.user.email,
      },
      bio: language === 'ar' ? coach.bioAr : coach.bioEn,
      specialties: (coach as any).specializations,
      hourlyRate: coach.hourlyRate,
      experience: coach.experience,
      rating: Math.round(averageRating * 10) / 10,
      totalSessions: (coach as any)._count.coachingSessions,
      totalReviews: totalReviews,
      reviews,
      availability: this.getMockAvailability(coach.id),
      education: (coach as any).education ? JSON.parse((coach as any).education) : [],
      certifications: (coach as any).certifications ? JSON.parse((coach as any).certifications) : [],
    };
  }

  async getUserSessions(userId: string, options: { page: number; limit: number; status?: string }) {
    const { page, limit, status } = options;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (status) {
      where.status = status.toUpperCase();
    }

    const [sessions, total] = await Promise.all([
      this.prisma.coachingSession.findMany({
        where,
        include: {
          coach: {
            include: {
              user: {
                include: { profile: true },
              },
            },
          },
          reviews: true,
        },
        orderBy: { startTime: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.coachingSession.count({ where }),
    ]);

    const transformedSessions = sessions.map(session => ({
      id: session.id,
      sessionType: (session as any).sessionType,
      status: session.status,
      startTime: session.startTime,
      endTime: (session as any).endTime,
      duration: (session as any).duration,
      price: (session as any).price,
      currency: (session as any).currency,
      notes: session.notes,
      meetingUrl: (session as any).meetingUrl,
      meetingId: (session as any).meetingId,
      coach: {
        id: session.coach.id,
        firstName: (session as any).coach?.user?.profile?.firstName,
        lastName: (session as any).coach?.user?.profile?.lastName,
        avatar: (session as any).coach?.user?.profile?.avatar,
        specialties: (session.coach as any).specializations,
      },
      review: (session as any).reviews[0] || null,
      canReschedule: this.canReschedule(session),
      canCancel: this.canCancel(session),
    }));

    return {
      sessions: transformedSessions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async getSession(userId: string, sessionId: string) {
    const session = await this.prisma.coachingSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      include: {
        coach: {
          include: {
            user: {
              include: { profile: true },
            },
          },
        },
        reviews: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return {
      id: session.id,
      sessionType: (session as any).sessionType,
      status: session.status,
      startTime: session.startTime,
      endTime: (session as any).endTime,
      duration: (session as any).duration,
      price: (session as any).price,
      currency: (session as any).currency,
      notes: session.notes,
      meetingUrl: (session as any).meetingUrl,
      meetingId: (session as any).meetingId,
      coach: {
        id: session.coach.id,
        firstName: (session as any).coach?.user?.profile?.firstName,
        lastName: (session as any).coach?.user?.profile?.lastName,
        avatar: (session as any).coach?.user?.profile?.avatar,
        email: session.coach.user.email,
        specialties: (session.coach as any).specializations,
        hourlyRate: session.coach.hourlyRate,
      },
      review: (session as any).reviews[0] || null,
      canReschedule: this.canReschedule(session),
      canCancel: this.canCancel(session),
      canJoin: this.canJoin(session),
    };
  }

  async joinSession(userId: string, sessionId: string) {
    const session = await this.prisma.coachingSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      include: {
        coach: {
          include: { user: true },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (!this.canJoin(session)) {
      throw new BadRequestException('Cannot join session at this time');
    }

    // Generate Zoom join URL
    if ((session as any).meetingId) {
      const joinUrl = await this.zoomService.getMeetingJoinUrl((session as any).meetingId, userId);
      return {
        joinUrl,
        meetingId: (session as any).meetingId,
        startTime: session.startTime,
        endTime: (session as any).endTime,
        coachName: `${(session as any).coach?.user?.profile?.firstName} ${(session as any).coach?.user?.profile?.lastName}`,
      };
    }

    throw new BadRequestException('Meeting not available');
  }

  async completeSession(
    coachId: string,
    sessionId: string,
    completionData: {
      notes?: string;
      followUpActions?: string[];
    }
  ) {
    const session = await this.prisma.coachingSession.findFirst({
      where: {
        id: sessionId,
        coachId,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.status !== 'SCHEDULED') {
      throw new BadRequestException('Session cannot be completed');
    }

    const updatedSession = await this.prisma.coachingSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        notes: completionData.notes,
      },
    });

    // Update coach availability
    await this.updateCoachAvailabilityAfterSession(session.coachId, session.startTime, (session as any).endTime);

    this.logger.log(`Session completed: ${sessionId}`);

    return updatedSession;
  }

  async submitReview(
    userId: string,
    sessionId: string,
    reviewData: {
      rating: number;
      comment?: string;
    }
  ) {
    const session = await this.prisma.coachingSession.findFirst({
      where: {
        id: sessionId,
        userId,
        status: 'COMPLETED',
      },
      include: {
        reviews: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found or not completed');
    }

    if ((session as any).reviews.length > 0) {
      throw new BadRequestException('Review already submitted for this session');
    }

    const review = await this.prisma.coachReview.create({
      data: {
        sessionId,
        userId,
        coachId: session.coachId,
        rating: reviewData.rating,
        comment: reviewData.comment,
      },
    });

    this.logger.log(`Review submitted for session: ${sessionId}`);

    return review;
  }

  async getCoachReviews(coachId: string, options: { page: number; limit: number }) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.coachReview.findMany({
        where: { coachId },
        include: {
          user: {
            include: { profile: true },
          },
          session: {
            select: {
              // sessionType: true,
              // completedAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.coachReview.count({ where: { coachId } }),
    ]);

    return {
      reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async getPackages(language: string = 'en') {
    // Mock packages - in a real app, these would be stored in the database
    return [
      {
        id: 'starter',
        name: 'Starter Package',
        description: 'Perfect for getting started with career coaching',
        price: 199,
        currency: 'USD',
        sessions: 3,
        duration: '3 weeks',
        features: [
          '3 one-on-one sessions',
          'Career assessment',
          'Personalized action plan',
          'Email support',
        ],
        popular: false,
      },
      {
        id: 'professional',
        name: 'Professional Package',
        description: 'Comprehensive coaching for career advancement',
        price: 499,
        currency: 'USD',
        sessions: 8,
        duration: '2 months',
        features: [
          '8 one-on-one sessions',
          'Career assessment',
          'Personalized action plan',
          'Interview preparation',
          'Resume review',
          'Priority email support',
        ],
        popular: true,
      },
      {
        id: 'executive',
        name: 'Executive Package',
        description: 'Premium coaching for senior professionals',
        price: 999,
        currency: 'USD',
        sessions: 12,
        duration: '3 months',
        features: [
          '12 one-on-one sessions',
          'Career assessment',
          'Personalized action plan',
          'Leadership development',
          'Executive presence coaching',
          'Interview preparation',
          'Resume and LinkedIn review',
          '24/7 priority support',
        ],
        popular: false,
      },
    ];
  }

  async purchasePackage(
    userId: string,
    packageId: string,
    purchaseData: {
      paymentMethodId: string;
    }
  ) {
    // Mock implementation - would integrate with payment service
    const packages = await this.getPackages();
    const coachingPackage = packages.find(p => p.id === packageId);

    if (!coachingPackage) {
      throw new NotFoundException('Package not found');
    }

    const purchase = await this.prisma.payment.create({
      data: {
        description: 'Coaching package',
        userId,
        amount: coachingPackage.price,
        currency: coachingPackage.currency,
        status: 'COMPLETED',
        method: "CREDIT_CARD" as any,
        transactionId: `txn_${Date.now()}`,
        metadata: {
          type: 'COACHING_PACKAGE',
          packageId,
          sessions: coachingPackage.sessions,
        },
      },
    });

    // Create coaching credits
    await (this.prisma as any).coachingCredit.create({
      data: {
        userId,
        packageId,
        sessionsRemaining: coachingPackage.sessions,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      },
    });

    this.logger.log(`Coaching package purchased: ${packageId} by user ${userId}`);

    return {
      purchase,
      package: coachingPackage,
      credits: coachingPackage.sessions,
    };
  }

  async getUserStats(userId: string) {
    const [
      totalSessions,
      completedSessions,
      totalSpent,
      averageRating,
    ] = await Promise.all([
      this.prisma.coachingSession.count({ where: { userId } }),
      this.prisma.coachingSession.count({
        where: { userId, status: 'COMPLETED' },
      }),
      (this.prisma as any).coachingSession.aggregate({
        where: { userId, status: 'COMPLETED' },
        _sum: { price: true }
      }),
      this.prisma.coachReview.aggregate({
        where: { userId },
        _avg: { rating: true },
      }),
    ]);

    return {
      totalSessions,
      completedSessions,
      totalSpent: (totalSpent as any)?._sum?.amount || 0,
      averageRating: averageRating._avg.rating || 0,
      completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
    };
  }

  async getCoachDashboard(coachId: string) {
    const [
      totalSessions,
      completedSessions,
      upcomingSessions,
      totalEarnings,
      averageRating,
      thisMonthSessions,
    ] = await Promise.all([
      this.prisma.coachingSession.count({ where: { coachId } }),
      this.prisma.coachingSession.count({
        where: { coachId, status: 'COMPLETED' },
      }),
      this.prisma.coachingSession.count({
        where: {
          coachId,
          status: 'SCHEDULED',
          startTime: { gt: new Date() },
        },
      }),
      (this.prisma as any).coachingSession.aggregate({
        where: { coachId, status: 'COMPLETED' },
        _sum: { price: true }
      }),
      this.prisma.coachReview.aggregate({
        where: { coachId },
        _avg: { rating: true },
      }),
      this.prisma.coachingSession.count({
        where: {
          coachId,
          startTime: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    return {
      totalSessions,
      completedSessions,
      upcomingSessions,
      totalEarnings: (totalEarnings as any)?._sum?.amount || 0,
      averageRating: averageRating._avg.rating || 0,
      thisMonthSessions,
      recentSessions: await this.getRecentSessions(coachId),
    };
  }

  async getCoachSchedule(coachId: string, startDate: Date, endDate: Date) {
    const sessions = await this.prisma.coachingSession.findMany({
      where: {
        coachId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: {
          include: { profile: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return sessions.map(session => ({
      id: session.id,
      title: `Session with ${session.user.profile?.firstName} ${session.user.profile?.lastName}`,
      start: session.startTime,
      end: (session as any).endTime,
      status: session.status,
      sessionType: (session as any).sessionType,
      user: {
        id: session.user.id,
        name: `${session.user.profile?.firstName} ${session.user.profile?.lastName}`,
        avatar: session.user.profile?.avatar,
      },
    }));
  }

  async createCoach(coachData: {
    userId: string;
    bio: string;
    specialties: string[];
    hourlyRate: number;
    experience: number;
  }) {
    const coach = await this.prisma.coach.create({
      data: {
        userId: coachData.userId,
        bioEn: coachData.bio,
        bioAr: coachData.bio,
        specialties: coachData.specialties,
        hourlyRate: coachData.hourlyRate,
        experience: coachData.experience,
        availability: {} as any,
      } as any,
    });

    this.logger.log(`Coach created: ${coachData.userId}`);

    return coach;
  }

  async getAllCoaches(options: { page: number; limit: number; status?: string }) {
    const { page, limit, status } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status === 'active') {
      where.user = { isActive: true };
    } else if (status === 'inactive') {
      where.user = { isActive: false };
    }

    const [coachesRaw, total] = await Promise.all([
      this.prisma.coach.findMany({
        where,
        include: {
          user: {
            include: { profile: true },
          },
          coachingSessions: {
            where: { status: 'COMPLETED' },
            select: { reviews: { select: { rating: true } } },
          },
          _count: {
            select: {
              coachingSessions: true,
              reviews: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.coach.count({ where }),
    ]);

    const coaches = coachesRaw.map((coach: any) => {
      const allReviews = coach.coachingSessions.flatMap((s: any) => s.reviews);
      const avgRating = allReviews.length > 0 
        ? allReviews.reduce((acc: number, r: any) => acc + r.rating, 0) / allReviews.length 
        : 0;
      
      return {
        ...coach,
        rating: Math.round(avgRating * 10) / 10,
        totalSessions: coach._count.coachingSessions,
        totalReviews: coach._count.reviews,
      };
    });

    return {
      coaches,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAllSessions(options: {
    page: number;
    limit: number;
    status?: string;
    coachId?: string;
  }) {
    const { page, limit, status, coachId } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status.toUpperCase();
    }
    if (coachId) {
      where.coachId = coachId;
    }

    const [sessions, total] = await Promise.all([
      this.prisma.coachingSession.findMany({
        where,
        include: {
          user: {
            include: { profile: true },
          },
          coach: {
            include: {
              user: {
                include: { profile: true },
              },
            },
          },
        },
        orderBy: { startTime: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.coachingSession.count({ where }),
    ]);

    return {
      sessions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async getAnalytics() {
    const totalRevenue = await (this.prisma as any).coachingSession.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { price: true }
    });

    const [
      totalSessions,
      completedSessions,
      totalCoaches,
      averageRating,
      sessionsByMonth,
    ] = await Promise.all([
      this.prisma.coachingSession.count(),
      this.prisma.coachingSession.count({ where: { status: 'COMPLETED' } }),
      this.prisma.coach.count(),
      this.prisma.coachReview.aggregate({ _avg: { rating: true } }),
      this.getSessionsByMonth(),
    ]);

    return {
      totalSessions,
      completedSessions,
      totalRevenue: (totalRevenue._sum as any)?.price || 0,
      totalCoaches,
      averageRating: averageRating._avg.rating || 0,
      completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
      sessionsByMonth,
    };
  }

  private getMockAvailability(coachId: string) {
    // Mock availability - would be calculated from actual availability data
    return {
      monday: ['09:00-12:00', '14:00-17:00'],
      tuesday: ['09:00-12:00', '14:00-17:00'],
      wednesday: ['09:00-12:00', '14:00-17:00'],
      thursday: ['09:00-12:00', '14:00-17:00'],
      friday: ['09:00-12:00', '14:00-17:00'],
      saturday: [],
      sunday: [],
    };
  }

  private canReschedule(session: any): boolean {
    const now = new Date();
    const sessionStart = new Date(session.startTime);
    const hoursUntilSession = (sessionStart.getTime() - now.getTime()) / (1000 * 60 * 60);

    return session.status === 'SCHEDULED' && hoursUntilSession > 24;
  }

  private canCancel(session: any): boolean {
    const now = new Date();
    const sessionStart = new Date(session.startTime);
    const hoursUntilSession = (sessionStart.getTime() - now.getTime()) / (1000 * 60 * 60);

    return session.status === 'SCHEDULED' && hoursUntilSession > 48;
  }

  private canJoin(session: any): boolean {
    const now = new Date();
    const sessionStart = new Date(session.startTime);
    const sessionEnd = new Date((session as any).endTime);

    return session.status === 'SCHEDULED' && now >= sessionStart && now <= sessionEnd;
  }

  private async updateCoachAvailabilityAfterSession(
    coachId: string,
    startTime: Date,
    endTime: Date
  ) {
    // This would update the coach's availability after a session
    // For now, it's a placeholder
    this.logger.log(`Updating availability for coach ${coachId} after session`);
  }

  private async getRecentSessions(coachId: string) {
    const sessions = await this.prisma.coachingSession.findMany({
      where: { coachId },
      include: {
        user: {
          include: { profile: true },
        },
      },
      orderBy: { startTime: 'desc' },
      take: 5,
    });

    return sessions.map(session => ({
      id: session.id,
      user: {
        name: `${session.user.profile?.firstName} ${session.user.profile?.lastName}`,
        avatar: session.user.profile?.avatar,
      },
      startTime: session.startTime,
      status: session.status,
    }));
  }

    async getConsultingSessions(userId: string, accountType: string) {
    if (accountType === 'CONSULTANT') {
      return this.prisma.consultingSession.findMany({
        where: { consultantId: userId },
        include: {
          user: {
            select: {
              id: true,
              profile: { select: { firstName: true, lastName: true, avatar: true } },
            },
          },
        },
        orderBy: { scheduledAt: 'desc' },
      });
    }
    return this.prisma.consultingSession.findMany({
      where: { studentId: userId },
      include: {
        consultant: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true, avatar: true } },
          },
        },
      },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async confirmConsultingSession(sessionId: string, consultantId: string) {
    const session = await this.prisma.consultingSession.findFirst({
      where: { id: sessionId, consultantId },
    });
    if (!session) throw new NotFoundException('Session not found');
    return this.prisma.consultingSession.update({
      where: { id: sessionId },
      data: { status: 'CONFIRMED' },
    });
  }

  async cancelConsultingSession(sessionId: string, userId: string) {
    const session = await this.prisma.consultingSession.findFirst({
      where: { id: sessionId, OR: [{ consultantId: userId }, { studentId: userId }] },
    });
    if (!session) throw new NotFoundException('Session not found');
    return this.prisma.consultingSession.update({
      where: { id: sessionId },
      data: { status: 'CANCELLED' },
    });
  }

  private async getSessionsByMonth() {
    // Get sessions grouped by month for the last 12 months
    const months = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const count = await this.prisma.coachingSession.count({
        where: {
          startTime: {
            gte: date,
            lt: nextMonth,
          },
        },
      });

      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        sessions: count,
      });
    }

    return months;
  }
}



