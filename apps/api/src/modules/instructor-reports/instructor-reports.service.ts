import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LectureStatus, LiveSessionStatus, CourseStatus } from '@prisma/client';
import { CreateLectureDto } from './dto/create-lecture.dto';
import { UpdateLectureDto } from './dto/update-lecture.dto';
import { ReportFilterDto } from './dto/report-filter.dto';

export interface LessonDetail {
  lessonId: string;
  lessonTitle: string;
  durationMinutes: number;
  lessonDate: string | Date | null;
  lessonStatus?: string;
  typeBadge?: string;
}

export interface LiveSessionDetail {
  sessionId: string;
  sessionTitle: string;
  sessionDate: string | Date | null;
  actualDurationMinutes: number;
  sessionStatus: string;
}

export interface CourseReport {
  courseId: string;
  courseName: string;
  courseTitle?: string;
  courseStatus?: string;
  coursePrice?: number;
  courseCurrency?: string;
  lessonCount: number;
  liveSessionCount?: number;
  enrolledStudents?: number;
  paidEnrollments?: number;
  freeEnrollments?: number;
  grossSales?: number;
  refunds?: number;
  netRevenue?: number;
  publishedAt?: Date | string | null;
  createdAt?: Date | string | null;
  lectureCount: number; // backward compat
  totalMinutes: number; // backward compat
  hoursDisplay: string;
  lastDeliveredAt: Date | null;
  lessons?: LessonDetail[];
  liveSessions?: LiveSessionDetail[];
}

export interface InstructorReport {
  instructorId: string;
  nameAr: string;
  nameEn: string;
  email: string;
  courseCount?: number;
  totalLessons?: number;
  totalLiveSessions?: number;
  totalTeachingMinutes?: number;
  totalStudents?: number;
  totalRevenue?: number;
  courses: CourseReport[];
  totalLectures: number; // backward compat
  totalMinutes: number;
  hoursDisplay: string;
}

export interface ConsultantSessionDetail {
  sessionId: string;
  sessionTitle: string;
  topic?: string;
  clientName?: string;
  scheduledAt?: string | Date | null;
  actualStartedAt?: string | Date | null;
  actualEndedAt?: string | Date | null;
  actualDurationMinutes: number;
  sessionStatus: string;
  sessionPrice?: number;
  currency?: string;
  paymentStatus?: string;
  paidAmount?: number;
  refundAmount?: number;
}

export interface ConsultantReport {
  consultantId: string;
  nameAr: string;
  nameEn: string;
  email: string;
  sessionCount: number;
  completedCount: number;
  cancelledCount: number;
  totalActualMinutes: number;
  hoursDisplay: string;
  totalClients: number;
  grossCollected: number;
  refunds: number;
  netAmount: number;
  sessions: ConsultantSessionDetail[];
}

export interface CollectiveReport {
  generatedAt: Date;
  totalInstructors: number;
  totalLectures: number;
  totalMinutes: number;
  totalCourses: number;
  instructors: InstructorReport[];
  consultants?: ConsultantReport[];
  totalConsultants?: number;
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
      c = { courseId, courseName, courseTitle: courseName, lessonCount: 0, lectureCount: 0, totalMinutes: 0, hoursDisplay: '', lastDeliveredAt: null, lessons: [], liveSessions: [] } as any;
      instructor.courses.push(c);
    }
    if ((c as any).lessonCount === undefined) (c as any).lessonCount = (c as any).lessons?.length || c.lectureCount || 0;
    if (!(c as any).lessons) (c as any).lessons = [];
    if (!(c as any).liveSessions) (c as any).liveSessions = [];
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
    console.log('[REPORT] getCollectiveReport called with filter:', JSON.stringify(filter));

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
      console.log('[REPORT] all active instructors/consultants:', allUsers.length);
      allUsers.forEach(u => console.log(`  - ${u.email} (${u.accountType}) id=${u.id}`));

      const instructorMap = new Map<string, InstructorReport>();
      for (const user of allUsers) {
        this.ensureInstructor(instructorMap, user.id, user.email, user.profile);
      }

      // ── Step 2: Lessons in published courses (INSTRUCTOR users only) ────
      const pubCourseWhere: any = {
        status: CourseStatus.PUBLISHED,
        instructorId: { not: null },
      };
      if (filter.instructorId) pubCourseWhere.instructorId = filter.instructorId;
      if (filter.courseId) pubCourseWhere.id = filter.courseId;

      const pubCourses = await this.prisma.course.findMany({
        where: pubCourseWhere,
        select: { id: true, titleAr: true, titleEn: true, instructorId: true, status: true, price: true, currency: true, createdAt: true },
      });
      console.log('[REPORT] found published courses:', pubCourses.length);
      for (const pc of pubCourses) {
        console.log(`  course ${pc.id} by ${pc.instructorId} title:${pc.titleEn || pc.titleAr}`);
      }
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
        // For accounting report of courses/lessons, do not filter lessons by date range by default
        // if (from || to) lessonWhere.createdAt = this.dateRange(from, to);
        console.log('[REPORT] fetching lessons for courses:', pubCourseIds);

        const lessons = await this.prisma.lesson.findMany({
          where: lessonWhere,
          select: {
            id: true,
            title: true,
            videoDuration: true,
            createdAt: true,
            isPublished: true,
            type: true,
            module: { select: { courseId: true } },
            section: { select: { courseId: true } },
          },
        });
        console.log('[REPORT] found lessons:', lessons.length);

        for (const lesson of lessons) {
          const courseId = lesson.module?.courseId ?? lesson.section?.courseId;
          if (!courseId) continue;
          const course = pubCourseMap.get(courseId);
          if (!course?.instructorId) continue;
          if (!instructorMap.has(course.instructorId)) {
            // ensure it exists
            this.ensureInstructor(instructorMap, course.instructorId, '', null);
          }

          const inst = instructorMap.get(course.instructorId)!;
          const courseName = course.titleAr || course.titleEn || courseId;
          const courseEntry = this.ensureCourse(inst, courseId, courseName);
          // enhance course entry
          (courseEntry as any).courseTitle = courseName;
          (courseEntry as any).courseStatus = course.status;
          (courseEntry as any).coursePrice = course.price;
          (courseEntry as any).courseCurrency = course.currency;
          (courseEntry as any).createdAt = course.createdAt;
          if (!(courseEntry as any).lessons) (courseEntry as any).lessons = [];
          const mins = this.resolveLessonDuration(lesson.videoDuration);
          (courseEntry as any).lessons.push({
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            durationMinutes: mins,
            lessonDate: lesson.createdAt,
            lessonStatus: lesson.isPublished ? 'published' : 'draft',
            typeBadge: lesson.type === 'LIVE' || lesson.type === 'live' ? 'بث' : 'مسجل',
          });
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

      // ── Step 5: ConsultingSession (any non-pending/future state) ────────────
      const consultingWhere: any = { status: { notIn: ['PENDING', 'SCHEDULED'] } };
      if (filter.instructorId) consultingWhere.consultantId = filter.instructorId;
      if (from || to) consultingWhere.createdAt = this.dateRange(from, to);

      const consultingSessions = await ((this.prisma as any).consultingSession || (this.prisma as any).ConsultingSession).findMany({
        where: consultingWhere,
        select: {
          id: true,
          consultantId: true,
          duration: true,
          scheduledAt: true,
          completedAt: true,
          startedAt: true,
          endedAt: true,
          topic: true,
          sessionName: true,
          status: true,
          price: true,
          paymentStatus: true,
          paidAt: true,
        },
      } as any);
      console.log('[REPORT] consulting sessions found:', consultingSessions.length);

      // Build consultant reports separately
      const consultantMap = new Map<string, ConsultantReport>();
      for (const user of allUsers) {
        if (user.accountType === 'CONSULTANT') {
          const names = this.instructorName(user.profile, user.email);
          consultantMap.set(user.id, {
            consultantId: user.id,
            nameAr: names.nameAr,
            nameEn: names.nameEn,
            email: user.email,
            sessionCount: 0,
            completedCount: 0,
            cancelledCount: 0,
            totalActualMinutes: 0,
            hoursDisplay: formatHours(0),
            totalClients: 0,
            grossCollected: 0,
            refunds: 0,
            netAmount: 0,
            sessions: [],
          });
        }
      }

      const clientSet = new Set<string>();
      for (const session of consultingSessions as any[]) {
        if (!consultantMap.has(session.consultantId)) {
          // ensure exists
          const user = allUsers.find(u => u.id === session.consultantId);
          if (user) {
            const names = this.instructorName(user.profile, user.email);
            consultantMap.set(user.id, {
              consultantId: user.id,
              nameAr: names.nameAr,
              nameEn: names.nameEn,
              email: user.email,
              sessionCount: 0,
              completedCount: 0,
              cancelledCount: 0,
              totalActualMinutes: 0,
              hoursDisplay: formatHours(0),
              totalClients: 0,
              grossCollected: 0,
              refunds: 0,
              netAmount: 0,
              sessions: [],
            });
          } else {
            continue;
          }
        }
        const cons = consultantMap.get(session.consultantId)!;
        const mins = this.resolveDuration(session.duration || 0, session.startedAt || null, session.endedAt || null) || session.duration || 0;
        cons.sessionCount += 1;
        const st = (session.status || '').toUpperCase();
        if (st === 'COMPLETED') cons.completedCount += 1;
        if (st === 'CANCELLED' || st === 'NO_SHOW') cons.cancelledCount += 1;
        cons.totalActualMinutes += mins;
        if ((session as any).studentId) clientSet.add((session as any).studentId);
        cons.sessions.push({
          sessionId: session.id,
          sessionTitle: session.sessionName || session.topic || 'جلسة استشارية',
          topic: session.topic,
          clientName: undefined,
          scheduledAt: session.scheduledAt,
          actualStartedAt: session.startedAt,
          actualEndedAt: session.endedAt,
          actualDurationMinutes: mins,
          sessionStatus: st === 'COMPLETED' ? 'مكتملة' : st === 'CANCELLED' || st === 'NO_SHOW' ? 'ملغاة' : st === 'IN_PROGRESS' ? 'جارية' : 'مكتملة',
          sessionPrice: session.price || 0,
          currency: 'SAR',
          paymentStatus: session.paymentStatus,
          paidAmount: session.paymentStatus === 'PAID' ? (session.price || 0) : 0,
          refundAmount: 0,
        });
        if (session.paymentStatus === 'PAID') {
          cons.grossCollected += session.price || 0;
          cons.netAmount += session.price || 0;
        }
      }
      for (const c of consultantMap.values()) {
        c.totalClients = c.sessions.length;
        c.hoursDisplay = formatHours(c.totalActualMinutes);
      }

      // Also add consulting sessions to instructor map as before for backward compat? The requirement says separate sections.
      for (const session of consultingSessions) {
        if (instructorMap.has((session as any).consultantId)) {
          const inst = instructorMap.get((session as any).consultantId)!;
          const course = this.ensureCourse(inst, CONSULTING_COURSE_ID, CONSULTING_COURSE_NAME);
          const deliveredAt = this.resolveDate((session as any).completedAt, (session as any).scheduledAt);
          const mins = this.resolveDuration((session as any).duration ?? 60, (session as any).startedAt || null, (session as any).endedAt || null);
          this.addEntry(inst, course, mins, deliveredAt);
        }
      }

      // ── Finalize ────────────────────────────────────────────────────────
      const { instructors, totalLectures, totalMinutes, totalCourses } =
        this.finalizeMap(instructorMap);

      // enhance instructor summaries
      for (const inst of instructors) {
        let totalLessons = 0;
        let totalLiveSessions = 0;
        let totalTeachingMinutes = inst.totalMinutes;
        for (const c of inst.courses) {
          totalLessons += (c as any).lessons?.length || c.lectureCount || 0;
          totalLiveSessions += (c as any).liveSessions?.length || 0;
        }
        (inst as any).courseCount = inst.courses.filter(c => c.courseId !== CONSULTING_COURSE_ID).length;
        (inst as any).totalLessons = totalLessons;
        (inst as any).totalLiveSessions = totalLiveSessions;
        (inst as any).totalTeachingMinutes = totalTeachingMinutes;
        (inst as any).totalStudents = 0;
        (inst as any).totalRevenue = 0;
        // add lessons/liveSessions details
        for (const c of inst.courses) {
          if (!(c as any).lessons) (c as any).lessons = [];
          if (!(c as any).liveSessions) (c as any).liveSessions = [];
          c.lessonCount = (c as any).lessons.length || c.lectureCount;
        }
      }

      const consultants = Array.from(consultantMap.values());

      console.log('[REPORT] done. instructors:', instructors.length, 'consultants:', consultants.length);

      return {
        generatedAt: new Date(),
        totalInstructors: instructors.filter(i=> (i as any).courseCount > 0 || i.totalLectures > 0 || i.courses.length > 0).length || instructorMap.size,
        totalLectures,
        totalMinutes,
        totalCourses,
        instructors,
        consultants,
        totalConsultants: consultants.length,
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
