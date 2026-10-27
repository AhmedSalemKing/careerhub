import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportFilterDto } from './dto/report-filter.dto';
import { ExternalLectureStatus } from '@prisma/client';

export interface LectureSummary {
  courseId: string;
  courseTitle: string;
  lectureCount: number;
  totalHours: number;
}

export interface InstructorReport {
  instructorId: string;
  instructorName: string;
  courses: LectureSummary[];
  totalLectures: number;
  totalHours: number;
}

@Injectable()
export class ExternalReportService {
  constructor(private readonly prisma: PrismaService) {}

  async generateReport(filter: ReportFilterDto): Promise<InstructorReport[]> {
    const where: any = { status: ExternalLectureStatus.COMPLETED };
    if (filter.instructorId) where.instructorId = filter.instructorId;
    if (filter.courseId) where.courseId = filter.courseId;
    if (filter.dateFrom || filter.dateTo) {
      where.lectureDate = {};
      if (filter.dateFrom) where.lectureDate.gte = new Date(filter.dateFrom);
      if (filter.dateTo) where.lectureDate.lte = new Date(filter.dateTo);
    }

    const lectures = await this.prisma.externalLecture.findMany({
      where,
      include: { instructor: true },
      orderBy: { lectureDate: 'asc' },
    });

    // Aggregate by instructor then course
    const instructorMap = new Map<string, { name: string; courseMap: Map<string, { title: string; count: number; totalMinutes: number }> }>();

    for (const lec of lectures) {
      if (!instructorMap.has(lec.instructorId)) {
        instructorMap.set(lec.instructorId, { name: lec.instructor.name, courseMap: new Map() });
      }
      const inst = instructorMap.get(lec.instructorId)!;
      if (!inst.courseMap.has(lec.courseId)) {
        inst.courseMap.set(lec.courseId, { title: lec.title ?? lec.courseId, count: 0, totalMinutes: 0 });
      }
      const course = inst.courseMap.get(lec.courseId)!;
      course.count += 1;
      course.totalMinutes += lec.durationMinutes;
    }

    // Fetch course titles in bulk
    const courseIds = [...new Set(lectures.map((l) => l.courseId))];
    const courses = courseIds.length
      ? await this.prisma.course.findMany({ where: { id: { in: courseIds } }, select: { id: true, titleAr: true, titleEn: true } })
      : [];
    const courseTitleMap = new Map(courses.map((c) => [c.id, c.titleAr || c.titleEn]));

    const report: InstructorReport[] = [];
    for (const [instructorId, data] of instructorMap) {
      const courseSummaries: LectureSummary[] = [];
      let totalMinutes = 0;
      let totalLectures = 0;

      for (const [courseId, cd] of data.courseMap) {
        const totalHours = Math.floor(cd.totalMinutes / 60) + (cd.totalMinutes % 60) / 60;
        courseSummaries.push({
          courseId,
          courseTitle: courseTitleMap.get(courseId) ?? cd.title,
          lectureCount: cd.count,
          totalHours: Math.round(totalHours * 100) / 100,
        });
        totalMinutes += cd.totalMinutes;
        totalLectures += cd.count;
      }

      const grandTotalHours = Math.floor(totalMinutes / 60) + (totalMinutes % 60) / 60;
      report.push({
        instructorId,
        instructorName: data.name,
        courses: courseSummaries,
        totalLectures,
        totalHours: Math.round(grandTotalHours * 100) / 100,
      });
    }

    return report;
  }
}
