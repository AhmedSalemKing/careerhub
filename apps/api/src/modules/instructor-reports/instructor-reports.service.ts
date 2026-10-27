import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LectureStatus } from '@prisma/client';
import { CreateLectureDto } from './dto/create-lecture.dto';
import { UpdateLectureDto } from './dto/update-lecture.dto';
import { ReportFilterDto } from './dto/report-filter.dto';

export interface CourseReport {
  courseId: string;
  courseName: string;
  lectureCount: number;
  totalMinutes: number;
  hoursDisplay: string;
  lastDeliveredAt: Date | null;
}

export interface InstructorReport {
  instructorId: string;
  nameAr: string;
  nameEn: string;
  email: string;
  courses: CourseReport[];
  totalLectures: number;
  totalMinutes: number;
  hoursDisplay: string;
}

export interface CollectiveReport {
  generatedAt: Date;
  totalInstructors: number;
  totalLectures: number;
  totalMinutes: number;
  totalCourses: number;
  instructors: InstructorReport[];
}

export interface InstructorLectureItem {
  id: string;
  courseId: string;
  courseName: string;
  title: string | null;
  deliveredAt: Date;
  durationMinutes: number;
  hoursDisplay: string;
  status: LectureStatus;
}

export interface InstructorDetailReport {
  generatedAt: Date;
  instructor: InstructorReport;
  lectures: InstructorLectureItem[];
}

export function formatHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} ساعة`;
  if (hours === 0) return `${mins} دقيقة`;
  return `${hours} ساعة و${mins} دقيقة`;
}

@Injectable()
export class InstructorReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildCompletedWhere(filter: ReportFilterDto) {
    const where: any = { status: LectureStatus.COMPLETED };

    if (filter.instructorId) where.instructorId = filter.instructorId;
    if (filter.courseId) where.courseId = filter.courseId;

    if (filter.from || filter.to) {
      where.deliveredAt = {};
      if (filter.from) where.deliveredAt.gte = new Date(filter.from);
      if (filter.to) {
        const to = new Date(filter.to);
        to.setUTCHours(23, 59, 59, 999);
        where.deliveredAt.lte = to;
      }
    }

    return where;
  }

  private instructorName(profile: {
    firstName?: string | null;
    lastName?: string | null;
  } | null, email: string) {
    const name = [profile?.firstName, profile?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();
    const resolved = name || email;
    return { nameAr: resolved, nameEn: resolved };
  }

  async createLecture(dto: CreateLectureDto) {
    return this.prisma.instructorLecture.create({
      data: {
        instructorId: dto.instructorId,
        courseId: dto.courseId,
        title: dto.title,
        deliveredAt: new Date(dto.deliveredAt),
        durationMinutes: dto.durationMinutes,
        status: dto.status ?? LectureStatus.DRAFT,
        notes: dto.notes,
      },
    });
  }

  async updateLecture(id: string, dto: UpdateLectureDto) {
    const existing = await this.prisma.instructorLecture.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Lecture not found');

    const data: any = {};
    if (dto.instructorId !== undefined) data.instructorId = dto.instructorId;
    if (dto.courseId !== undefined) data.courseId = dto.courseId;
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.deliveredAt !== undefined) data.deliveredAt = new Date(dto.deliveredAt);
    if (dto.durationMinutes !== undefined) data.durationMinutes = dto.durationMinutes;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.notes !== undefined) data.notes = dto.notes;

    return this.prisma.instructorLecture.update({ where: { id }, data });
  }

  async deleteLecture(id: string) {
    const existing = await this.prisma.instructorLecture.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Lecture not found');
    return this.prisma.instructorLecture.delete({ where: { id } });
  }

  async listLectures(filters: ReportFilterDto) {
    const where: any = {};
    if (filters.instructorId) where.instructorId = filters.instructorId;
    if (filters.courseId) where.courseId = filters.courseId;

    if (filters.from || filters.to) {
      where.deliveredAt = {};
      if (filters.from) where.deliveredAt.gte = new Date(filters.from);
      if (filters.to) {
        const to = new Date(filters.to);
        to.setUTCHours(23, 59, 59, 999);
        where.deliveredAt.lte = to;
      }
    }

    return this.prisma.instructorLecture.findMany({
      where,
      include: {
        instructor: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        course: { select: { id: true, titleAr: true, titleEn: true } },
      },
      orderBy: { deliveredAt: 'desc' },
    });
  }

  async getInstructors() {
    const users = await this.prisma.user.findMany({
      where: {
        accountType: { in: ['INSTRUCTOR', 'CONSULTANT'] },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        accountType: true,
        profile: { select: { firstName: true, lastName: true } },
      },
      orderBy: { email: 'asc' },
    });

    return users.map((user) => {
      const names = this.instructorName(user.profile, user.email);
      return {
        id: user.id,
        email: user.email,
        accountType: user.accountType,
        nameAr: names.nameAr,
        nameEn: names.nameEn,
      };
    });
  }

  async getCollectiveReport(filter: ReportFilterDto): Promise<CollectiveReport> {
    const where = this.buildCompletedWhere(filter);

    const rows = await this.prisma.instructorLecture.findMany({
      where,
      include: {
        instructor: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        course: { select: { id: true, titleAr: true, titleEn: true } },
      },
      orderBy: [{ instructorId: 'asc' }, { deliveredAt: 'asc' }],
    });

    const instructorMap = new Map<string, InstructorReport>();

    for (const row of rows) {
      const key = row.instructorId;
      if (!instructorMap.has(key)) {
        const names = this.instructorName(row.instructor.profile, row.instructor.email);
        instructorMap.set(key, {
          instructorId: key,
          nameAr: names.nameAr,
          nameEn: names.nameEn,
          email: row.instructor.email,
          courses: [],
          totalLectures: 0,
          totalMinutes: 0,
          hoursDisplay: '',
        });
      }

      const instructor = instructorMap.get(key)!;
      let course = instructor.courses.find((c) => c.courseId === row.courseId);

      if (!course) {
        course = {
          courseId: row.courseId,
          courseName: row.course.titleAr || row.course.titleEn || row.courseId,
          lectureCount: 0,
          totalMinutes: 0,
          hoursDisplay: '',
          lastDeliveredAt: null,
        };
        instructor.courses.push(course);
      }

      course.lectureCount += 1;
      course.totalMinutes += row.durationMinutes;
      instructor.totalLectures += 1;
      instructor.totalMinutes += row.durationMinutes;

      if (!course.lastDeliveredAt || row.deliveredAt > course.lastDeliveredAt) {
        course.lastDeliveredAt = row.deliveredAt;
      }
    }

    let totalLectures = 0;
    let totalMinutes = 0;
    const uniqueCourses = new Set<string>();

    for (const instructor of instructorMap.values()) {
      instructor.courses.sort((a, b) => b.totalMinutes - a.totalMinutes);
      for (const course of instructor.courses) {
        course.hoursDisplay = formatHours(course.totalMinutes);
        uniqueCourses.add(course.courseId);
      }
      instructor.hoursDisplay = formatHours(instructor.totalMinutes);
      totalLectures += instructor.totalLectures;
      totalMinutes += instructor.totalMinutes;
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
  ): Promise<InstructorDetailReport> {
    const collective = await this.getCollectiveReport({
      ...filter,
      instructorId,
    });

    const instructor =
      collective.instructors[0] ??
      ({
        instructorId,
        nameAr: '',
        nameEn: '',
        email: '',
        courses: [],
        totalLectures: 0,
        totalMinutes: 0,
        hoursDisplay: formatHours(0),
      } as InstructorReport);

    const where = this.buildCompletedWhere({ ...filter, instructorId });
    const rows = await this.prisma.instructorLecture.findMany({
      where,
      include: {
        course: { select: { id: true, titleAr: true, titleEn: true } },
      },
      orderBy: { deliveredAt: 'desc' },
    });

    const lectures: InstructorLectureItem[] = rows.map((row) => ({
      id: row.id,
      courseId: row.courseId,
      courseName: row.course.titleAr || row.course.titleEn || row.courseId,
      title: row.title,
      deliveredAt: row.deliveredAt,
      durationMinutes: row.durationMinutes,
      hoursDisplay: formatHours(row.durationMinutes),
      status: row.status,
    }));

    return {
      generatedAt: collective.generatedAt,
      instructor,
      lectures,
    };
  }
}
