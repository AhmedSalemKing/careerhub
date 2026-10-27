import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LectureRecordStatus } from '@prisma/client';
import { ReportFilterDto } from '../dto/report-filter.dto';

export interface CourseReport {
  courseId: string;
  courseName: string;
  lectureCount: number;
  totalMinutes: number;
  hoursDisplay: string;
  lastDeliveredAt: Date | null;
}

export interface InstructorReportItem {
  id: string;
  nameAr: string;
  nameEn: string;
  email: string;
  courses: CourseReport[];
  totalLectures: number;
  totalMinutes: number;
  hoursDisplay: string;
}

export interface CollectiveReportDto {
  generatedAt: Date;
  totalInstructors: number;
  totalLectures: number;
  totalMinutes: number;
  totalCourses: number;
  instructors: InstructorReportItem[];
}

export interface InstructorReportDto {
  generatedAt: Date;
  instructor: InstructorReportItem;
}

function formatHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} ساعة`;
  if (hours === 0) return `${mins} دقيقة`;
  return `${hours} ساعة و${mins} دقيقة`;
}

@Injectable()
export class LectureReportService {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(filter: ReportFilterDto) {
    const where: any = { status: LectureRecordStatus.COMPLETED };

    if (filter.instructorId) {
      where.instructorId = filter.instructorId;
    }
    if (filter.courseId) {
      where.courseId = filter.courseId;
    }
    if (filter.from || filter.to) {
      where.deliveredAt = {};
      if (filter.from) {
        where.deliveredAt.gte = new Date(filter.from);
      }
      if (filter.to) {
        where.deliveredAt.lte = new Date(filter.to);
      }
    }

    return where;
  }

  private getInstructorName(
    profile: { firstName?: string | null; lastName?: string | null } | null,
  ): { nameAr: string; nameEn: string } {
    const firstName = profile?.firstName ?? '';
    const lastName = profile?.lastName ?? '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
    return {
      nameAr: fullName || 'غير معروف',
      nameEn: fullName || 'Unknown',
    };
  }

  async getCollectiveReport(filter: ReportFilterDto): Promise<CollectiveReportDto> {
    const where = this.buildWhere(filter);

    const records = await this.prisma.lectureRecord.findMany({
      where,
      include: {
        instructor: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        course: {
          select: {
            id: true,
            titleEn: true,
            titleAr: true,
          },
        },
      },
      orderBy: { deliveredAt: 'desc' },
    });

    const instructorMap = new Map<string, InstructorReportItem>();

    for (const record of records) {
      const instId = record.instructor.id;
      const names = this.getInstructorName(record.instructor.profile);

      if (!instructorMap.has(instId)) {
        instructorMap.set(instId, {
          id: instId,
          nameAr: names.nameAr,
          nameEn: names.nameEn,
          email: record.instructor.email,
          courses: [],
          totalLectures: 0,
          totalMinutes: 0,
          hoursDisplay: '',
        });
      }

      const instructor = instructorMap.get(instId)!;
      let course = instructor.courses.find((c) => c.courseId === record.courseId);

      if (!course) {
        course = {
          courseId: record.courseId,
          courseName: record.course.titleAr || record.course.titleEn || record.courseId,
          lectureCount: 0,
          totalMinutes: 0,
          hoursDisplay: '',
          lastDeliveredAt: null,
        };
        instructor.courses.push(course);
      }

      course.lectureCount += 1;
      course.totalMinutes += record.durationMinutes;
      instructor.totalLectures += 1;
      instructor.totalMinutes += record.durationMinutes;

      if (!course.lastDeliveredAt || record.deliveredAt > course.lastDeliveredAt) {
        course.lastDeliveredAt = record.deliveredAt;
      }
    }

    let totalMinutes = 0;
    let totalLectures = 0;
    const uniqueCourses = new Set<string>();

    for (const instructor of instructorMap.values()) {
      for (const course of instructor.courses) {
        course.hoursDisplay = formatHours(course.totalMinutes);
        uniqueCourses.add(course.courseId);
      }
      instructor.hoursDisplay = formatHours(instructor.totalMinutes);
      totalMinutes += instructor.totalMinutes;
      totalLectures += instructor.totalLectures;
    }

    return {
      generatedAt: new Date(),
      totalInstructors: instructorMap.size,
      totalLectures,
      totalMinutes,
      totalCourses: uniqueCourses.size,
      instructors: Array.from(instructorMap.values()),
    };
  }

  async getInstructorReport(
    instructorId: string,
    filter: ReportFilterDto,
  ): Promise<InstructorReportDto> {
    const collective = await this.getCollectiveReport({
      ...filter,
      instructorId,
    });

    const instructor = collective.instructors[0] ?? {
      id: instructorId,
      nameAr: 'غير معروف',
      nameEn: 'Unknown',
      email: '',
      courses: [],
      totalLectures: 0,
      totalMinutes: 0,
      hoursDisplay: '0 ساعة و0 دقيقة',
    };

    return {
      generatedAt: collective.generatedAt,
      instructor,
    };
  }
}
