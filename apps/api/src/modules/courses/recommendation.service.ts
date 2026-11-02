import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Course recommendations.
 *
 * Matching is strict: a course is recommended for a career path only when it
 * is explicitly tagged with that path slug in `careerPaths`. There is no
 * keyword scoring and no "popular courses" fallback.
 */
@Injectable()
export class RecommendationService {
  constructor(private prisma: PrismaService) {}

  async getRecommendedCourses(userPaths: string[], userId?: string, limit = 12) {
    if (!userPaths || userPaths.length === 0) return [];

    try {
      const completedCourseIds = userId
        ? (
            await this.prisma.enrollment.findMany({
              where: { userId, completedAt: { not: null } },
              select: { courseId: true },
            })
          ).map(e => e.courseId)
        : [];

      return await this.prisma.course.findMany({
        where: {
          status: 'PUBLISHED',
          careerPaths: { hasSome: userPaths },
          ...(completedCourseIds.length > 0 && { id: { notIn: completedCourseIds } }),
        },
        include: {
          category: true,
          instructor: {
            include: {
              profile: true,
            },
          },
          modules: {
            include: {
              _count: { select: { lessons: true } },
            },
          },
          _count: { select: { enrollments: true } },
        },
        orderBy: [
          { isFeatured: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit,
      });
    } catch (e: any) {
      console.error('[Recommendation]', e.message);
      return [];
    }
  }
}
