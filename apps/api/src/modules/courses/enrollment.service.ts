import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EnrollmentService {
  constructor(private prisma: PrismaService) {}

  async enrollUser(userId: string, courseId: string, paymentId?: string) { return { success: true, courseId, userId }; }

  async getEnrollment(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({ where: { userId, courseId } });
    if (!enrollment) return null;

    // Count completed lessons and total published lessons for richer response
    const [completedLessons, totalLessons] = await Promise.all([
      this.prisma.lessonProgress.count({
        where: {
          userId,
          status: 'COMPLETED',
          lesson: { section: { courseId } },
        },
      }),
      this.prisma.lesson.count({
        where: { isPublished: true, section: { courseId } },
      }),
    ]);

    return {
      id: enrollment.id,
      courseId: enrollment.courseId,
      status: enrollment.status,
      progress: enrollment.progress,
      completedLessons,
      totalLessons,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
    };
  }

  async getUserEnrollments(userId: string, options: any) { return { data: [], total: 0 }; }
  async updateEnrollmentProgress(enrollmentId: string, progress: number) { return { success: true, progress }; }
  async completeEnrollment(enrollmentId: string) { return { success: true }; }
  async getEnrollmentDetails(userId: string, courseId: string, language?: string) { return { courseId, userId, progress: 0 }; }
  async getEnrollmentProgress(userId: string, courseId: string) { return { progress: 0, completedLessons: 0, totalLessons: 0 }; }
  async unenroll(userId: string, courseId: string) { return { success: true }; }
  async getAdminEnrollments(options: any) { return { data: [], total: 0 }; }
  async checkLessonCompletion(userId: string, lessonId: string, courseId: string) { return { success: true }; }
}
