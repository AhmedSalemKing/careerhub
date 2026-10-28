import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LectureStatus, LiveSessionStatus } from '@prisma/client';
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

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private resolveDates(filter: ReportFilterDto): { from?: string; to?: string } {
    return {
      from: filter.dateFrom ?? filter.from,
      to: filter.dateTo ?? filter.to,
    };
  }

  private buildManualWhere(filter: ReportFilterDto) {
    const { from, to } = this.resolveDates(filter);
    const where: any = { status: LectureStatus.COMPLETED };
    if (filter.instructorId) where.instructorId = filter.instructorId;
    if (filter.courseId) where.courseId = filter.courseId;
    if (from || to) {
      where.deliveredAt = {};
      if (from) where.deliveredAt.gte = new Date(from);
      if (to) {
        const t = new Date(to);
        t.setUTCHours(23, 59, 59, 999);
        where.deliveredAt.lte = t;
      }
    }
    return where;
  }

  private buildLiveWhere(filter: ReportFilterDto) {
    const { from, to } = this.resolveDates(filter);
    const where: any = { status: LiveSessionStatus.ENDED };
    if (filter.instructorId) where.instructorId = filter.instructorId;
    if (from || to) {
      where.startedAt = {};
      if (from) where.startedAt.gte = new Date(from);
      if (to) {
        const t = new Date(to);
        t.setUTCHours(23, 59, 59, 999);
        where.startedAt.lte = t;
      }
    }
    return where;
  }

  private instructorName(
    profile: { firstName?: string | null; lastName?: string | null } | null,
    email: string,
  ) {
    const name = [profile?.firstName, profile?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();
    const resolved = name || email;
    return { nameAr: resolved, nameEn: resolved };
  }

  // ─── Aggregation helpers ──────────────────────────────────────────────────

  private ensureInstructor(
    map: Map<string, InstructorReport>,
    id: string,
    email: string,
    profile: { firstName?: string | null; lastName?: string | null } | null,
  ): InstructorReport {
    if (!map.has(id)) {
      const names = this.instructorName(profile, email);
      map.set(id, {
        instructorId: id,
        nameAr: names.nameAr,
        nameEn: names.nameEn,
        email,
        courses: [],
        totalLectures: 0,
        totalMinutes: 0,
        hoursDisplay: '',
      });
    }
    return map.get(id)!;
  }

  private ensureCourse(
    instructor: InstructorReport,
    courseId: string,
    courseName: string,
  ): CourseReport {
    let c = instructor.courses.find((x) => x.courseId === courseId);
    if (!c) {
      c = { courseId, courseName, lectureCount: 0, totalMinutes: 0, hoursDisplay: '', lastDeliveredAt: null };
      instructor.courses.push(c);
    }
    return c;
  }

  private addEntry(
    instructor: InstructorReport,
    course: CourseReport,
    minutes: number,
    deliveredAt: Date,
  ) {
    course.lectureCount += 1;
    course.totalMinutes += minutes;
    instructor.totalLectures += 1;
    instructor.totalMinutes += minutes;
    if (!course.lastDeliveredAt || deliveredAt > course.lastDeliveredAt) {
      course.lastDeliveredAt = deliveredAt;
    }
  }

  private finalizeMap(map: Map<string, InstructorReport>): {
    instructors: InstructorReport[];
    totalLectures: number;
    totalMinutes: number;
    totalCourses: number;
  } {
    let totalLectures = 0;
    let totalMinutes = 0;
    const uniqueCourses = new Set<string>();

    for (const instructor of map.values()) {
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
      instructors: Array.from(map.values()),
      totalLectures,
      totalMinutes,
      totalCourses: uniqueCourses.size,
    };
  }

  // ─── CRUD (manual InstructorLecture entries) ──────────────────────────────

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
    const existing = await this.prisma.instructorLecture.findUnique({ where: { id } });
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
    const existing = await this.prisma.instructorLecture.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Lecture not found');
    return this.prisma.instructorLecture.delete({ where: { id } });
  }

  async listLectures(filters: ReportFilterDto) {
    const { from, to } = this.resolveDates(filters);
    const where: any = {};
    if (filters.instructorId) where.instructorId = filters.instructorId;
    if (filters.courseId) where.courseId = filters.courseId;
    if (from || to) {
      where.deliveredAt = {};
      if (from) where.deliveredAt.gte = new Date(from);
      if (to) {
        const t = new Date(to);
        t.setUTCHours(23, 59, 59, 999);
        where.deliveredAt.lte = t;
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

  // ─── Instructors list ─────────────────────────────────────────────────────

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

  // ─── Reports ──────────────────────────────────────────────────────────────

  /**
   * Aggregates BOTH manual InstructorLecture entries (status=COMPLETED)
   * AND auto-recorded LiveSession entries (status=ENDED) so the report
   * shows real data even before any manual entries exist.
   */
  async getCollectiveReport(filter: ReportFilterDto): Promise<CollectiveReport> {
    try {
      // Source 1: manual InstructorLecture entries
      const manualRows = await this.prisma.instructorLecture.findMany({
        where: this.buildManualWhere(filter),
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

      // Source 2: LiveSession (actual live classes that ended)
      // LiveSession has no Prisma relations defined, so users/courses are batch-fetched separately.
      const liveSessions = await this.prisma.liveSession.findMany({
        where: this.buildLiveWhere(filter),
        orderBy: [{ instructorId: 'asc' }, { startedAt: 'asc' }],
      });

      const liveInstructorIds = [...new Set(liveSessions.map((s) => s.instructorId))];
      const liveCourseIds = [...new Set(liveSessions.map((s) => s.courseId))];

      const [liveUsers, liveCourses] = await Promise.all([
        liveInstructorIds.length
          ? this.prisma.user.findMany({
              where: { id: { in: liveInstructorIds } },
              select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } },
            })
          : Promise.resolve([] as any[]),
        liveCourseIds.length
          ? this.prisma.course.findMany({
              where: { id: { in: liveCourseIds } },
              select: { id: true, titleAr: true, titleEn: true },
            })
          : Promise.resolve([] as any[]),
      ]);

      const userById = new Map(liveUsers.map((u: any) => [u.id, u]));
      const courseById = new Map(liveCourses.map((c: any) => [c.id, c]));

      // Aggregate
      const instructorMap = new Map<string, InstructorReport>();

      for (const row of manualRows) {
        const inst = this.ensureInstructor(
          instructorMap,
          row.instructorId,
          row.instructor.email,
          row.instructor.profile,
        );
        const courseName = row.course.titleAr || row.course.titleEn || row.courseId;
        const course = this.ensureCourse(inst, row.courseId, courseName);
        this.addEntry(inst, course, row.durationMinutes, row.deliveredAt);
      }

      for (const session of liveSessions) {
        if (!session.durationMinutes) continue;
        const user = userById.get(session.instructorId);
        if (!user) continue;
        const inst = this.ensureInstructor(
          instructorMap,
          session.instructorId,
          user.email,
          user.profile,
        );
        const courseRecord = courseById.get(session.courseId);
        const courseName = courseRecord
          ? courseRecord.titleAr || courseRecord.titleEn || session.courseId
          : session.courseId;
        const course = this.ensureCourse(inst, session.courseId, courseName);
        const deliveredAt = session.startedAt ?? session.endedAt ?? session.createdAt;
        this.addEntry(inst, course, session.durationMinutes, deliveredAt);
      }

      const { instructors, totalLectures, totalMinutes, totalCourses } =
        this.finalizeMap(instructorMap);

      return {
        generatedAt: new Date(),
        totalInstructors: instructorMap.size,
        totalLectures,
        totalMinutes,
        totalCourses,
        instructors,
      };
    } catch (e: any) {
      throw new InternalServerErrorException('Report query failed: ' + e.message);
    }
  }

  async getInstructorReport(
    instructorId: string,
    filter: ReportFilterDto,
  ): Promise<InstructorDetailReport> {
    const merged = { ...filter, instructorId };
    const collective = await this.getCollectiveReport(merged);

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

    // Lecture detail list: manual entries
    const manualRows = await this.prisma.instructorLecture.findMany({
      where: this.buildManualWhere(merged),
      include: {
        course: { select: { id: true, titleAr: true, titleEn: true } },
      },
      orderBy: { deliveredAt: 'desc' },
    });

    // Lecture detail list: live sessions
    const liveRows = await this.prisma.liveSession.findMany({
      where: this.buildLiveWhere(merged),
      orderBy: { startedAt: 'desc' },
    });

    const liveCourseIds = [...new Set(liveRows.map((s) => s.courseId))];
    const liveCourses = liveCourseIds.length
      ? await this.prisma.course.findMany({
          where: { id: { in: liveCourseIds } },
          select: { id: true, titleAr: true, titleEn: true },
        })
      : [];
    const courseById = new Map(liveCourses.map((c) => [c.id, c]));

    const lectures: InstructorLectureItem[] = [
      ...manualRows.map((row) => ({
        id: row.id,
        courseId: row.courseId,
        courseName: row.course.titleAr || row.course.titleEn || row.courseId,
        title: row.title,
        deliveredAt: row.deliveredAt,
        durationMinutes: row.durationMinutes,
        hoursDisplay: formatHours(row.durationMinutes),
        status: row.status,
      })),
      ...liveRows
        .filter((s) => s.durationMinutes > 0)
        .map((session) => {
          const c = courseById.get(session.courseId);
          return {
            id: session.id,
            courseId: session.courseId,
            courseName: c ? c.titleAr || c.titleEn || session.courseId : session.courseId,
            title: 'جلسة مباشرة',
            deliveredAt: session.startedAt ?? session.createdAt,
            durationMinutes: session.durationMinutes,
            hoursDisplay: formatHours(session.durationMinutes),
            status: LectureStatus.COMPLETED,
          };
        }),
    ].sort((a, b) => b.deliveredAt.getTime() - a.deliveredAt.getTime());

    return {
      generatedAt: collective.generatedAt,
      instructor,
      lectures,
    };
  }
}
