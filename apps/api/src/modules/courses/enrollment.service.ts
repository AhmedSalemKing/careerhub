import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { sendNotification } from '../../common/utils/notify.util';

@Injectable()
export class EnrollmentService {
  private readonly logger = new Logger(EnrollmentService.name);

  constructor(private prisma: PrismaService) {}

  async enrollUser(userId: string, courseId: string, paymentId?: string) {
    const existing = await this.prisma.enrollment.findFirst({
      where: { userId, courseId },
    });
    if (existing) {
      return { success: true, enrollment: existing, alreadyEnrolled: true };
    }

    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new Error('Course not found');
    }

    const enrollment = await this.prisma.enrollment.create({
      data: {
        userId,
        courseId,
        status: 'ACTIVE',
        progress: 0,
      },
    });

    // Notify student
    await sendNotification(
      this.prisma,
      userId,
      'تم الاشتراك في الكورس',
      `تم اشتراكك بنجاح في كورس "${course.titleEn}". يمكنك البدء الآن!`,
      'COURSE_ENROLLMENT',
      { courseId: course.id }
    );

    // Notify instructor
    if (course.instructorId && course.instructorId !== userId) {
      const student = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });
      const studentName = `${student?.profile?.firstName || ''} ${student?.profile?.lastName || ''}`.trim() || 'طالب جديد';
      await sendNotification(
        this.prisma,
        course.instructorId,
        'طالب جديد اشترك في كورسك',
        `${studentName} اشترك في كورس "${course.titleEn}"`,
        'COURSE_ENROLLMENT',
        { courseId: course.id, studentId: userId }
      );
    }

    await this.prisma.userActivity.create({
      data: {
        userId,
        action: 'ENROLL_COURSE',
        entity: 'Course',
        entityId: courseId,
        metadata: { courseTitle: course.titleEn },
      },
    }).catch(() => {});

    this.logger.log(`User ${userId} enrolled in course ${courseId}`);
    return { success: true, enrollment };
  }

  async getEnrollment(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({ where: { userId, courseId } });
    if (!enrollment) return null;

    const [lessonProgressRecords, totalLessons] = await Promise.all([
      this.prisma.lessonProgress.findMany({
        where: {
          userId,
          status: 'COMPLETED',
          lesson: { section: { courseId } },
        },
        select: { lessonId: true },
      }),
      this.prisma.lesson.count({
        where: { section: { courseId } },
      }),
    ]);

    const completedLessonIds = lessonProgressRecords.map((r) => r.lessonId);

    return {
      id: enrollment.id,
      courseId: enrollment.courseId,
      status: enrollment.status,
      progress: enrollment.progress,
      completedLessons: completedLessonIds.length,
      completedLessonIds,
      totalLessons,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
    };
  }

  async getUserEnrollments(userId: string, options: any) { return { data: [], total: 0 }; }

  async updateEnrollmentProgress(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) {
      this.logger.warn(`Enrollment not found for user=${userId} course=${courseId}`);
      return { success: false, progress: 0 };
    }

    const [completedCount, totalCount] = await Promise.all([
      this.prisma.lessonProgress.count({
        where: {
          userId,
          status: 'COMPLETED',
          lesson: { section: { courseId } },
        },
      }),
      this.prisma.lesson.count({
        where: {
          section: { courseId },
          isPublished: true,
        },
      }),
    ]);

    const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
    const isComplete = progress >= 100;

    const updated = await this.prisma.enrollment.update({
      where: { userId_courseId: { userId, courseId } },
      data: {
        progress,
        ...(isComplete
          ? { status: 'COMPLETED' as const, completedAt: new Date() }
          : {}),
      },
    });

    this.logger.log(`Progress updated: user=${userId} course=${courseId} ${completedCount}/${totalCount} (${progress}%)`);
    return { success: true, progress: updated.progress, completedLessons: completedCount, totalLessons: totalCount };
  }

  async completeEnrollment(enrollmentId: string) { return { success: true }; }
  async getEnrollmentDetails(userId: string, courseId: string, language?: string) { return { courseId, userId, progress: 0 }; }
  async getEnrollmentProgress(userId: string, courseId: string) { return { progress: 0, completedLessons: 0, totalLessons: 0 }; }
  async unenroll(userId: string, courseId: string) { return { success: true }; }
  async getAdminEnrollments(options: any) { return { data: [], total: 0 }; }
  async checkLessonCompletion(userId: string, lessonId: string, courseId: string) { return { success: true }; }
}