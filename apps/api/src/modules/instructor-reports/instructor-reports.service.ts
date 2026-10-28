import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LectureStatus, LiveSessionStatus, CourseStatus } from '@prisma/client';
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
  deliveredAt: string;
  durationMinutes: number;
  hoursDisplay: string;
  status: LectureStatus;
  type: 'live' | 'consulting' | 'manual' | 'lesson';
  activityLabel: string;
  instructorRole: string;
  sessionStatus: string;
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

// Virtual course id used for consulting sessions (no real courseId)
const CONSULTING_COURSE_ID = '__consulting__';
const CONSULTING_COURSE_NAME = 'جلسات استشارية';

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

  private dateRange(from?: string, to?: string): { gte?: Date; lte?: Date } {
    const range: { gte?: Date; lte?: Date } = {};
    if (from) range.gte = new Date(from);
    if (to) {
      const t = new Date(to);
      t.setUTCHours(23, 59, 59, 999);
      range.lte = t;
    }
    return range;
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

  // Resolve a reliable date from a session row with multiple nullable date fields.
  private resolveDate(
    ...candidates: (Date | string | null | undefined)[]
  ): string {
    for (const c of candidates) {
      if (!c) continue;
      const d = c instanceof Date ? c : new Date(c);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
    // Epoch sentinel: frontend safeDate() renders this as '—'
    return '1970-01-01T00:00:00.000Z';
  }

  // Lesson videoDuration is stored in seconds — convert to minutes.
  private resolveLessonDuration(videoDuration: number | null | undefined): number {
    if (!videoDuration || videoDuration <= 0) return 0;
    return Math.round(videoDuration / 60);
  }

  // Calculate duration in minutes from timestamps, falling back to provided value.
  private resolveDuration(
    durationMinutes: number,
    startedAt: Date | null,
    endedAt: Date | null,
  ): number {
    if (durationMinutes > 0) return durationMinutes;
    if (startedAt && endedAt) {
      const calculated = Math.round((endedAt.getTime() - startedAt.getTime()) / 60000);
      if (calculated > 0) return calculated;
    }
    return 0;
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
    deliveredAtInput: Date | string,
  ) {
    const deliveredAt =
      deliveredAtInput instanceof Date ? deliveredAtInput : new Date(deliveredAtInput);
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
        if (course.courseId !== CONSULTING_COURSE_ID) {
          uniqueCourses.add(course.courseId);
        }
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
    if (from || to) where.deliveredAt = this.dateRange(from, to);

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
   * Aggregates three sources:
   *  1. InstructorLecture (manual entries, status=COMPLETED)
   *  2. LiveSession (ended live classes; durationMinutes calculated from
   *     timestamps when the stored value is 0)
   *  3. ConsultingSession (completed consulting sessions for CONSULTANT users)
   *
   * ALL active INSTRUCTOR/CONSULTANT users appear in the report even if they
   * have no sessions — they show zeros. The map is pre-populated from the user
   * table so no session can make an instructor disappear.
   */
  async getCollectiveReport(filter: ReportFilterDto): Promise<CollectiveReport> {
    const { from, to } = this.resolveDates(filter);

    try {
      // ── Step 1: Pre-populate ALL active instructors/consultants ───────────
      // This guarantees every instructor appears even with 0 entries.
      const allUsers = await this.prisma.user.findMany({
        where: {
          accountType: { in: ['INSTRUCTOR', 'CONSULTANT'] },
          status: 'ACTIVE',
          ...(filter.instructorId ? { id: filter.instructorId } : {}),
        },
        select: {
          id: true,
          email: true,
          accountType: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      });

      const instructorMap = new Map<string, InstructorReport>();
      for (const user of allUsers) {
        this.ensureInstructor(instructorMap, user.id, user.email, user.profile);
      }

      // ── Step 2: Lessons in published courses (INSTRUCTOR users only) ────
      const pubCourseWhere: any = {
        status: CourseStatus.PUBLISHED,
        instructorId: { not: null },
        instructor: { accountType: 'INSTRUCTOR', status: 'ACTIVE' },
      };
      if (filter.instructorId) pubCourseWhere.instructorId = filter.instructorId;
      if (filter.courseId) pubCourseWhere.id = filter.courseId;

      const pubCourses = await this.prisma.course.findMany({
        where: pubCourseWhere,
        select: { id: true, titleAr: true, titleEn: true, instructorId: true },
      });
      const pubCourseMap = new Map(pubCourses.map((c) => [c.id, c]));
      const pubCourseIds = [...pubCourseMap.keys()];

      if (pubCourseIds.length > 0) {
        const lessonWhere: any = {
          isPublished: true,
          OR: [
            { module: { courseId: { in: pubCourseIds } } },
            { section: { courseId: { in: pubCourseIds } } },
          ],
        };
        if (from || to) lessonWhere.createdAt = this.dateRange(from, to);

        const lessons = await this.prisma.lesson.findMany({
          where: lessonWhere,
          select: {
            id: true,
            videoDuration: true,
            createdAt: true,
            module: { select: { courseId: true } },
            section: { select: { courseId: true } },
          },
        });

        for (const lesson of lessons) {
          const courseId = lesson.module?.courseId ?? lesson.section?.courseId;
          if (!courseId) continue;
          const course = pubCourseMap.get(courseId);
          if (!course?.instructorId) continue;
          if (!instructorMap.has(course.instructorId)) continue;

          const inst = instructorMap.get(course.instructorId)!;
          const courseName = course.titleAr || course.titleEn || courseId;
          const courseEntry = this.ensureCourse(inst, courseId, courseName);
          const mins = this.resolveLessonDuration(lesson.videoDuration);
          this.addEntry(inst, courseEntry, mins, lesson.createdAt);
        }
      }

      // ── Step 3: Manual InstructorLecture entries ───────────────────────
      const manualWhere: any = { status: { in: [LectureStatus.COMPLETED, LectureStatus.CANCELLED] } };
      if (filter.instructorId) manualWhere.instructorId = filter.instructorId;
      if (filter.courseId) manualWhere.courseId = filter.courseId;
      if (from || to) manualWhere.deliveredAt = this.dateRange(from, to);

      const manualRows = await this.prisma.instructorLecture.findMany({
        where: manualWhere,
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
      });

      for (const row of manualRows) {
        const inst = this.ensureInstructor(
          instructorMap, row.instructorId, row.instructor.email, row.instructor.profile,
        );
        const courseName = row.course.titleAr || row.course.titleEn || row.courseId;
        const course = this.ensureCourse(inst, row.courseId, courseName);
        this.addEntry(inst, course, row.durationMinutes, row.deliveredAt);
      }

      // ── Step 4: LiveSession (any started state — exclude only SCHEDULED) ──
      // Date filter uses createdAt (never null), not startedAt (nullable).
      const liveWhere: any = {
        status: { in: [LiveSessionStatus.STARTING, LiveSessionStatus.LIVE, LiveSessionStatus.ENDING, LiveSessionStatus.ENDED] },
      };
      if (filter.instructorId) liveWhere.instructorId = filter.instructorId;
      if (from || to) liveWhere.createdAt = this.dateRange(from, to);

      const liveSessions = await this.prisma.liveSession.findMany({ where: liveWhere });

      // Batch-fetch courses for live sessions (no Prisma relation on LiveSession)
      const liveCourseIds = [...new Set(liveSessions.map((s) => s.courseId))];
      const liveCourseRecords = liveCourseIds.length
        ? await this.prisma.course.findMany({
            where: { id: { in: liveCourseIds } },
            select: { id: true, titleAr: true, titleEn: true },
          })
        : [];
      const courseById = new Map(liveCourseRecords.map((c) => [c.id, c]));

      for (const session of liveSessions) {
        // Only include sessions belonging to a tracked instructor
        if (!instructorMap.has(session.instructorId)) continue;

        const mins = this.resolveDuration(
          session.durationMinutes,
          session.startedAt,
          session.endedAt,
        );
        const deliveredAt = this.resolveDate(session.endedAt, session.startedAt, session.createdAt);

        const inst = instructorMap.get(session.instructorId)!;
        const courseRecord = courseById.get(session.courseId);
        const courseName = courseRecord
          ? courseRecord.titleAr || courseRecord.titleEn || session.courseId
          : session.courseId;
        const course = this.ensureCourse(inst, session.courseId, courseName);
        this.addEntry(inst, course, mins, deliveredAt);
      }

      // ── Step 5: ConsultingSession (any non-pending state) ────────────
      // Filter on createdAt (always set).
      const consultingWhere: any = { status: { notIn: ['PENDING', 'SCHEDULED'] } };
      if (filter.instructorId) consultingWhere.consultantId = filter.instructorId;
      if (from || to) consultingWhere.createdAt = this.dateRange(from, to);

      const consultingSessions = await this.prisma.consultingSession.findMany({
        where: consultingWhere,
        select: {
          id: true,
          consultantId: true,
          duration: true,
          scheduledAt: true,
          completedAt: true,
        },
      });

      for (const session of consultingSessions) {
        if (!instructorMap.has(session.consultantId)) continue;
        const inst = instructorMap.get(session.consultantId)!;
        const course = this.ensureCourse(inst, CONSULTING_COURSE_ID, CONSULTING_COURSE_NAME);
        const deliveredAt = this.resolveDate(session.completedAt, session.scheduledAt);
        const mins = session.duration ?? 60;
        this.addEntry(inst, course, mins, deliveredAt);
      }

      // ── Finalize ────────────────────────────────────────────────────────
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
    const { from, to } = this.resolveDates(merged);

    const userRecord = await this.prisma.user.findUnique({
      where: { id: instructorId },
      select: { accountType: true },
    });
    const isConsultant = userRecord?.accountType === 'CONSULTANT';

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

    // ── Lesson detail list (published courses of this instructor) ────────
    const instrCoursesForLessons = await this.prisma.course.findMany({
      where: {
        status: CourseStatus.PUBLISHED,
        instructorId,
        instructor: { accountType: 'INSTRUCTOR', status: 'ACTIVE' },
      },
      select: { id: true, titleAr: true, titleEn: true },
    });
    const instrCourseMap = new Map(instrCoursesForLessons.map((c) => [c.id, c]));
    const instrCourseIds = [...instrCourseMap.keys()];

    let lessonRows: Array<{
      id: string;
      title: string;
      videoDuration: number | null;
      createdAt: Date;
      courseId: string;
      courseName: string;
    }> = [];

    if (instrCourseIds.length > 0) {
      const lessonDetailWhere: any = {
        isPublished: true,
        OR: [
          { module: { courseId: { in: instrCourseIds } } },
          { section: { courseId: { in: instrCourseIds } } },
        ],
      };
      if (from || to) lessonDetailWhere.createdAt = this.dateRange(from, to);

      const rawLessons = await this.prisma.lesson.findMany({
        where: lessonDetailWhere,
        select: {
          id: true,
          title: true,
          videoDuration: true,
          createdAt: true,
          module: { select: { courseId: true } },
          section: { select: { courseId: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      lessonRows = rawLessons.flatMap((lesson) => {
        const courseId = lesson.module?.courseId ?? lesson.section?.courseId;
        if (!courseId) return [];
        const course = instrCourseMap.get(courseId);
        if (!course) return [];
        return [{
          id: lesson.id,
          title: lesson.title,
          videoDuration: lesson.videoDuration,
          createdAt: lesson.createdAt,
          courseId,
          courseName: course.titleAr || course.titleEn || courseId,
        }];
      });
    }

    // ── Manual lecture detail list ────────────────────────────────────────
    const manualWhere: any = { status: { in: [LectureStatus.COMPLETED, LectureStatus.CANCELLED] }, instructorId };
    if (from || to) manualWhere.deliveredAt = this.dateRange(from, to);

    const manualRows = await this.prisma.instructorLecture.findMany({
      where: manualWhere,
      include: { course: { select: { id: true, titleAr: true, titleEn: true } } },
      orderBy: { deliveredAt: 'desc' },
    });

    // ── LiveSession detail list ───────────────────────────────────────────
    const liveWhere: any = {
      status: { in: [LiveSessionStatus.STARTING, LiveSessionStatus.LIVE, LiveSessionStatus.ENDING, LiveSessionStatus.ENDED] },
      instructorId,
    };
    if (from || to) liveWhere.createdAt = this.dateRange(from, to);

    const liveRows = await this.prisma.liveSession.findMany({
      where: liveWhere,
      orderBy: { createdAt: 'desc' },
    });

    const liveCourseIds = [...new Set(liveRows.map((s) => s.courseId))];
    const liveCourseRecords = liveCourseIds.length
      ? await this.prisma.course.findMany({
          where: { id: { in: liveCourseIds } },
          select: { id: true, titleAr: true, titleEn: true },
        })
      : [];
    const courseById = new Map(liveCourseRecords.map((c) => [c.id, c]));

    // ── ConsultingSession detail list ─────────────────────────────────────
    const consultingDetailWhere: any = { status: { notIn: ['PENDING', 'SCHEDULED'] }, consultantId: instructorId };
    if (from || to) consultingDetailWhere.createdAt = this.dateRange(from, to);

    const consultingRows = await this.prisma.consultingSession.findMany({
      where: consultingDetailWhere,
      select: {
        id: true,
        consultantId: true,
        duration: true,
        scheduledAt: true,
        completedAt: true,
        topic: true,
        sessionName: true,
        status: true,
      },
      orderBy: { scheduledAt: 'desc' },
    });

    // ── Merge and sort all lecture items ──────────────────────────────────
    const lectures: InstructorLectureItem[] = [
      ...lessonRows.map((lesson) => {
        const mins = this.resolveLessonDuration(lesson.videoDuration);
        return {
          id: lesson.id,
          courseId: lesson.courseId,
          courseName: lesson.courseName,
          title: lesson.title,
          deliveredAt: this.resolveDate(lesson.createdAt),
          durationMinutes: mins,
          hoursDisplay: formatHours(mins),
          status: LectureStatus.COMPLETED,
          type: 'lesson' as const,
          activityLabel: 'كورس',
          instructorRole: 'INSTRUCTOR',
          sessionStatus: 'منشورة',
        };
      }),
      ...manualRows.map((row) => ({
        id: row.id,
        courseId: row.courseId,
        courseName: row.course.titleAr || row.course.titleEn || row.courseId,
        title: row.title,
        deliveredAt: row.deliveredAt.toISOString(),
        durationMinutes: row.durationMinutes,
        hoursDisplay: formatHours(row.durationMinutes),
        status: row.status,
        type: 'manual' as const,
        activityLabel: 'كورس',
        instructorRole: isConsultant ? 'CONSULTANT' : 'INSTRUCTOR',
        sessionStatus: row.status === LectureStatus.CANCELLED ? 'ملغاة' : 'مكتملة',
      })),
      ...liveRows.map((session) => {
        const c = courseById.get(session.courseId);
        const mins = this.resolveDuration(session.durationMinutes, session.startedAt, session.endedAt);
        return {
          id: session.id,
          courseId: session.courseId,
          courseName: c ? c.titleAr || c.titleEn || session.courseId : session.courseId,
          title: 'جلسة مباشرة',
          deliveredAt: this.resolveDate(session.endedAt, session.startedAt, session.createdAt),
          durationMinutes: mins,
          hoursDisplay: formatHours(mins),
          status: LectureStatus.COMPLETED,
          type: 'live' as const,
          activityLabel: 'كورس',
          instructorRole: 'INSTRUCTOR',
          sessionStatus: session.status === LiveSessionStatus.ENDED ? 'مكتملة' : 'جارية',
        };
      }),
      ...consultingRows.map((session) => ({
        id: session.id,
        courseId: CONSULTING_COURSE_ID,
        courseName: CONSULTING_COURSE_NAME,
        title: session.sessionName || session.topic || 'جلسة استشارية',
        deliveredAt: this.resolveDate(session.completedAt, session.scheduledAt),
        durationMinutes: session.duration ?? 60,
        hoursDisplay: formatHours(session.duration ?? 60),
        status: LectureStatus.COMPLETED,
        type: 'consulting' as const,
        activityLabel: 'جلسة',
        instructorRole: 'CONSULTANT',
        sessionStatus:
          session.status === 'COMPLETED' ? 'مكتملة' :
          ['CANCELLED', 'NO_SHOW'].includes(session.status) ? 'ملغاة' :
          session.status === 'IN_PROGRESS' ? 'جارية' : 'مكتملة',
      })),
    ].sort((a, b) => new Date(b.deliveredAt).getTime() - new Date(a.deliveredAt).getTime());

    return {
      generatedAt: collective.generatedAt,
      instructor,
      lectures,
    };
  }
}
