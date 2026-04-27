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

  private readonly SPECIALTY_KEYWORDS: Record<string, string[]> = {
    tech: [
      'برمجة', 'تقنية', 'software', 'tech', 'engineering', 'هندسة', 'developer', 'مطور',
      'web', 'mobile', 'fullstack', 'frontend', 'backend', 'python', 'javascript', 'react',
      'node', 'java', 'php', 'ruby', 'golang', 'rust', 'swift', 'kotlin', 'flutter',
      'تطوير', 'كود', 'code', 'programming', 'بايثون', 'جافا', 'ويب', 'موبايل',
      'api', 'database', 'قاعدة بيانات', 'devops', 'cloud', 'سحابة', 'aws', 'azure',
      'google cloud', 'docker', 'kubernetes', 'linux', 'server', 'خادم', 'network', 'شبكات',
    ],
    data: [
      'data', 'بيانات', 'ai', 'ذكاء اصطناعي', 'machine learning', 'تعلم آلي', 'deep learning',
      'neural', 'nlp', 'computer vision', 'analytics', 'تحليل', 'statistics', 'احصاء',
      'tensorflow', 'pytorch', 'pandas', 'numpy', 'tableau', 'power bi', 'excel',
      'data science', 'علم البيانات', 'big data', 'بيانات ضخمة', 'etl', 'warehouse',
    ],
    security: [
      'security', 'أمن', 'سيبراني', 'cyber', 'hacking', 'penetration', 'اختراق',
      'ethical hacking', 'ctf', 'forensics', 'malware', 'encryption', 'تشفير',
      'firewall', 'vpn', 'soc', 'incident response', 'vulnerability', 'ثغرات',
    ],
    design: [
      'تصميم', 'design', 'ui', 'ux', 'figma', 'graphic', 'جرافيك', 'واجهة',
      'user experience', 'interaction', 'visual', 'branding', 'هوية', 'logo',
      'photoshop', 'illustrator', 'sketch', 'motion', 'animation', 'حركة',
      'creative', 'إبداع', 'art', 'فن', 'illustration', 'typography', 'خطوط',
    ],
    marketing: [
      'تسويق', 'marketing', 'digital', 'رقمي', 'seo', 'sem', 'google ads',
      'social media', 'content', 'محتوى', 'email', 'affiliate', 'influencer',
      'brand', 'علامة تجارية', 'copywriting', 'growth', 'analytics', 'conversion',
      'pr', 'public relations', 'advertising', 'إعلان', 'campaign', 'حملة',
    ],
    business: [
      'أعمال', 'business', 'management', 'إدارة', 'ريادة', 'entrepreneur', 'startup',
      'مبيعات', 'sales', 'تجارة', 'finance', 'مالية', 'hr', 'موارد بشرية',
      'project manager', 'product manager', 'scrum', 'agile', 'strategy', 'استراتيجية',
      'consulting', 'استشارات', 'operations', 'supply chain', 'logistics', 'legal',
      'accounting', 'محاسبة', 'investment', 'استثمار', 'banking', 'بنوك',
    ],
  };

  private calculateConsultantScore(consultant: any, filterKey: string, searchQuery: string): number {
    let score = 0;
    const keywords = this.SPECIALTY_KEYWORDS[filterKey] || [];

    const searchableText = [
      consultant.profile?.speciality || '',
      consultant.profile?.bio || '',
      ...(consultant.profile?.consultingAreas || []),
      ...(consultant.profile?.qualifications || []),
      consultant.email || '',
    ].join(' ').toLowerCase();

    keywords.forEach(kw => {
      if (searchableText.includes(kw.toLowerCase())) score += 10;
    });

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (searchableText.includes(q)) score += 20;
      if ((consultant.profile?.firstName + ' ' + consultant.profile?.lastName).toLowerCase().includes(q)) score += 30;
    }

    if (consultant.profile?.speciality) score += 5;
    if (consultant.profile?.bio) score += 3;
    if (consultant.profile?.qualifications?.length > 0) score += consultant.profile.qualifications.length * 2;
    if (consultant.profile?.consultingAreas?.length > 0) score += consultant.profile.consultingAreas.length * 2;
    if (consultant.profile?.linkedinUrl) score += 2;
    if (consultant.isVerified) score += 15;

    score += (consultant._count?.consultantSessions || 0) * 2;

    return score;
  }

  async getConsultants(query: { filter?: string; search?: string; sort?: string; limit?: number }) {
    try {
      const consultants = await this.prisma.user.findMany({
        where: { role: { in: ['INSTRUCTOR' as any, 'CONSULTANT' as any] } },
        include: {
          profile: { select: { firstName: true, lastName: true, avatar: true, bio: true, speciality: true, yearsExperience: true, qualifications: true, consultingAreas: true, linkedinUrl: true, sessionPrice: true, sessionDuration: true } },
        },
      });

      let scored = consultants.map((c: any) => ({ ...c, _score: this.calculateConsultantScore(c, query.filter || 'all', query.search || ''), _count: { consultantSessions: 0 } }));

      if (query.filter && query.filter !== 'all') scored = scored.filter((c: any) => c._score > 0);
      if (query.search) scored = scored.filter((c: any) => c._score > 0);

      switch(query.sort) {
        case 'price-low': scored.sort((a: any, b: any) => (parseFloat(a.profile?.sessionPrice || '0') - parseFloat(b.profile?.sessionPrice || '0'))); break;
        case 'price-high': scored.sort((a: any, b: any) => (parseFloat(b.profile?.sessionPrice || '0') - parseFloat(a.profile?.sessionPrice || '0'))); break;
        case 'experience': scored.sort((a: any, b: any) => (b.profile?.yearsExperience || 0) - (a.profile?.yearsExperience || 0)); break;
        case 'sessions': scored.sort((a: any, b: any) => (b._count?.consultantSessions || 0) - (a._count?.consultantSessions || 0)); break;
        default: scored.sort((a: any, b: any) => b._score - a._score);
      }

      return { success: true, data: scored.slice(0, query.limit || 50) };
    } catch(e: any) {
      this.logger.error('[getConsultants] error:', e.message);
      return { success: true, data: [] };
    }
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
      description: (session as any).notes,
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
      description: (session as any).notes,
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
      description?: string;
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
    const isConsultant = accountType === 'CONSULTANT' || accountType === 'INSTRUCTOR';

    const sessions = await this.prisma.consultingSession.findMany({
      where: isConsultant ? { consultantId: userId } : { userId },
      include: {
        user: {
          select: { id: true, profile: { select: { firstName: true, lastName: true, avatar: true } } }
        },
        consultant: {
          select: { id: true, isVerified: true, profile: { select: { firstName: true, lastName: true, avatar: true, speciality: true } } }
        }
      },
      orderBy: { scheduledAt: 'desc' },
    });

    return { success: true, data: sessions };
  }

  async bookConsultingSession(userId: string, data: {
    consultantId: string;
    sessionName: string;
    topic: string;
    description?: string;
    scheduledAt: string;
    meetingType: 'zoom' | 'meet';
    duration?: number;
  }) {
    const scheduledAt = new Date(data.scheduledAt);
    if (scheduledAt <= new Date()) throw new BadRequestException('Cannot book a session in the past');
    if (!['zoom', 'meet'].includes(data.meetingType)) throw new BadRequestException('Invalid meeting type');

    const consultant = await this.prisma.user.findUnique({ where: { id: data.consultantId }, include: { profile: true } });
    if (!consultant) throw new NotFoundException('Consultant not found');

    const session = await this.prisma.consultingSession.create({
      data: {
        userId,
        consultantId: data.consultantId,
        sessionName: data.sessionName,
        topic: data.topic,
        description: data.description || '',
        scheduledAt,
        meetingType: data.meetingType,
        duration: data.duration || consultant.profile?.sessionDuration || 60,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        consultantApproved: false,
        userApproved: true,
      },
      include: {
        user: { select: { profile: { select: { firstName: true, lastName: true } } } },
        consultant: { select: { profile: { select: { firstName: true, lastName: true } } } },
      }
    });

    try {
      await this.prisma.notification.create({
        data: { user: { connect: { id: data.consultantId } }, type: 'SESSION_BOOKED' as any, titleEn: 'New Session Booking Request', titleAr: 'طلب حجز جلسة جديد', contentEn: `${session.user?.profile?.firstName} ${session.user?.profile?.lastName} requests a session titled "${data.sessionName}"`, contentAr: `${session.user?.profile?.firstName} ${session.user?.profile?.lastName} طلب جلسة بعنوان "${data.sessionName}"`, isRead: false }
      });
    } catch(e) { this.logger.error('Notification error:', e); }

    return { success: true, data: session };
  }

  async requestReschedule(sessionId: string, consultantId: string, data: { proposedDate: string; proposedTime: string; reason?: string }) {
    const session = await this.prisma.consultingSession.findFirst({
      where: { id: sessionId, consultantId },
    });
    if (!session) throw new NotFoundException('Session not found');

    const proposedAt = new Date(`${data.proposedDate}T${data.proposedTime}:00`);
    if (proposedAt < new Date()) throw new BadRequestException('Cannot propose past time');

    const existingNotes = session.description || '';
    const rescheduleNote = `\n[RESCHEDULE_PROPOSED:${proposedAt.toISOString()}${data.reason ? ':' + data.reason : ''}]`;

    const updated = await this.prisma.consultingSession.update({
      where: { id: sessionId },
      data: {
        status: 'RESCHEDULE_REQUESTED',
        description: existingNotes + rescheduleNote,
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: session.userId,
        type: 'SYSTEM_ANNOUNCEMENT' as any,
        titleEn: 'Reschedule Request',
        titleAr: 'طلب تغيير موعد',
        contentEn: `New time proposed: ${proposedAt.toLocaleDateString()} - ${data.reason || 'No reason'}`,
        contentAr: `تم اقتراح موعد جديد: ${proposedAt.toLocaleDateString('ar-SA')} - ${data.reason || 'بدون سبب'}`,
        isRead: false,
      },
    }).catch(() => {});

    return { success: true, data: updated };
  }

  async approveReschedule(sessionId: string, userId: string) {
    const session = await this.prisma.consultingSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new NotFoundException('Session not found');

    const match = session.description?.match(/\[RESCHEDULE_PROPOSED:([^:\]]+)/);
    if (!match) throw new BadRequestException('No reschedule proposal found');

    const proposedAt = new Date(match[1]);
    const cleanNotes = (session.description || '').replace(/\n?\[RESCHEDULE_PROPOSED:[^\]]+\]/g, '');

    const updated = await this.prisma.consultingSession.update({
      where: { id: sessionId },
      data: {
        scheduledAt: proposedAt,
        status: 'CONFIRMED',
        description: cleanNotes,
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: session.consultantId,
        type: 'SYSTEM_ANNOUNCEMENT' as any,
        titleEn: 'Reschedule Approved',
        titleAr: 'تمت الموافقة على تغيير الموعد',
        contentEn: `Session rescheduled to ${proposedAt.toLocaleDateString()}`,
        contentAr: `تم تغيير موعد الجلسة إلى ${proposedAt.toLocaleDateString('ar-SA')}`,
        isRead: false,
      },
    }).catch(() => {});

    return { success: true, data: updated };
  }

  async rejectReschedule(sessionId: string, userId: string) {
    const session = await this.prisma.consultingSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new NotFoundException('Session not found');

    const cleanNotes = (session.description || '').replace(/\n?\[RESCHEDULE_PROPOSED:[^\]]+\]/g, '');

    const updated = await this.prisma.consultingSession.update({
      where: { id: sessionId },
      data: {
        status: 'CONFIRMED',
        description: cleanNotes,
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: session.consultantId,
        type: 'SYSTEM_ANNOUNCEMENT' as any,
        titleEn: 'Reschedule Rejected',
        titleAr: 'رفض طلب تغيير الموعد',
        contentEn: 'User rejected the reschedule request',
        contentAr: 'رفض المستخدم طلب تغيير موعد الجلسة',
        isRead: false,
      },
    }).catch(() => {});

    return { success: true, data: updated };
  }

  async getMeetingLink(sessionId: string, userId: string, role: string) {
    const where = role === 'CONSULTANT'
      ? { id: sessionId, consultantId: userId }
      : { id: sessionId, userId: userId };
    return this.prisma.consultingSession.findFirst({ where });
  }

  async addMeetingLink(sessionId: string, consultantId: string, data: { meetingLink: string; meetingType: string }) {
    const session = await this.prisma.consultingSession.findFirst({
      where: { id: sessionId, consultantId },
    });
    if (!session) throw new NotFoundException('Session not found');

    const updated = await this.prisma.consultingSession.update({
      where: { id: sessionId },
      data: {
        meetingLink: data.meetingLink,
        meetingType: data.meetingType?.toUpperCase() || 'ZOOM',
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: session.userId,
        type: 'SYSTEM_ANNOUNCEMENT' as any,
        titleEn: 'Meeting Link Added',
        titleAr: 'تمت إضافة رابط الاجتماع',
        contentEn: `Meeting link: ${data.meetingLink}`,
        contentAr: `رابط الاجتماع: ${data.meetingLink}`,
        isRead: false,
      },
    }).catch(() => {});

    return { success: true, data: updated };
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
      where: { id: sessionId, OR: [{ consultantId: userId }, { userId: userId }] },
    });
    if (!session) throw new NotFoundException('Session not found');
    return this.prisma.consultingSession.update({
      where: { id: sessionId },
      data: { status: 'CANCELLED' },
    });
  }

  async completeConsultingSession(sessionId: string, userId: string) {
    const session = await this.prisma.consultingSession.findFirst({
      where: { id: sessionId, OR: [{ consultantId: userId }, { userId: userId }] },
    });
    if (!session) throw new NotFoundException('Session not found');
    return this.prisma.consultingSession.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED' },
    });
  }

  async payConsultingSession(sessionId: string, userId: string) {
    const session = await this.prisma.consultingSession.findFirst({
      where: { id: sessionId, userId: userId },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.paymentStatus === 'PAID') {
      throw new BadRequestException('Already paid');
    }
    return this.prisma.consultingSession.update({
      where: { id: sessionId },
      data: { 
        paymentStatus: 'PAID',
        status: session.status === 'PENDING' ? 'CONFIRMED' : session.status,
      },
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



