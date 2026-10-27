import { Test, TestingModule } from '@nestjs/testing';
import { ExternalReportService } from './external-report.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ExternalLectureStatus } from '@prisma/client';

const makeLecture = (overrides: Partial<any> = {}) => ({
  id: 'lec1',
  instructorId: 'inst1',
  courseId: 'course1',
  title: 'Lecture 1',
  lectureDate: new Date('2026-01-15'),
  durationMinutes: 90,
  status: ExternalLectureStatus.COMPLETED,
  notes: null,
  createdById: 'admin1',
  createdAt: new Date(),
  updatedAt: new Date(),
  instructor: { id: 'inst1', name: 'Ahmed', email: null, phone: null, specialty: null, notes: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ...overrides,
});

describe('ExternalReportService', () => {
  let service: ExternalReportService;
  let prisma: { externalLecture: { findMany: jest.Mock }; course: { findMany: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      externalLecture: { findMany: jest.fn() },
      course: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExternalReportService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ExternalReportService>(ExternalReportService);
  });

  it('returns empty array when no COMPLETED lectures', async () => {
    prisma.externalLecture.findMany.mockResolvedValue([]);
    const result = await service.generateReport({});
    expect(result).toEqual([]);
  });

  it('aggregates single instructor single course correctly', async () => {
    prisma.externalLecture.findMany.mockResolvedValue([
      makeLecture({ durationMinutes: 60 }),
      makeLecture({ id: 'lec2', durationMinutes: 90 }),
    ]);
    prisma.course.findMany.mockResolvedValue([{ id: 'course1', titleAr: 'كورس 1', titleEn: 'Course 1' }]);

    const result = await service.generateReport({});
    expect(result).toHaveLength(1);
    expect(result[0].totalLectures).toBe(2);
    // 60 + 90 = 150 min = 2.5h
    expect(result[0].totalHours).toBe(2.5);
  });

  it('filters by instructorId before aggregation', async () => {
    prisma.externalLecture.findMany.mockResolvedValue([]);
    await service.generateReport({ instructorId: 'inst-x' });
    const call = prisma.externalLecture.findMany.mock.calls[0][0];
    expect(call.where.instructorId).toBe('inst-x');
  });

  it('applies dateFrom and dateTo to the query', async () => {
    prisma.externalLecture.findMany.mockResolvedValue([]);
    await service.generateReport({ dateFrom: '2026-01-01', dateTo: '2026-12-31' });
    const call = prisma.externalLecture.findMany.mock.calls[0][0];
    expect(call.where.lectureDate.gte).toEqual(new Date('2026-01-01'));
    expect(call.where.lectureDate.lte).toEqual(new Date('2026-12-31'));
  });

  it('CANCELLED / SCHEDULED lectures are excluded (query always filters by COMPLETED)', async () => {
    prisma.externalLecture.findMany.mockResolvedValue([]);
    await service.generateReport({});
    const call = prisma.externalLecture.findMany.mock.calls[0][0];
    expect(call.where.status).toBe(ExternalLectureStatus.COMPLETED);
  });

  it('groups multiple instructors separately', async () => {
    const inst2 = { id: 'inst2', name: 'Sara', email: null, phone: null, specialty: null, notes: null, isActive: true, createdAt: new Date(), updatedAt: new Date() };
    prisma.externalLecture.findMany.mockResolvedValue([
      makeLecture({ instructorId: 'inst1', durationMinutes: 60 }),
      makeLecture({ id: 'lec3', instructorId: 'inst2', durationMinutes: 45, instructor: inst2 }),
    ]);
    const result = await service.generateReport({});
    expect(result).toHaveLength(2);
  });

  it('totalHours is rounded to 2 decimal places', async () => {
    // 70 min = 1.1666… hours → should round to 1.17
    prisma.externalLecture.findMany.mockResolvedValue([makeLecture({ durationMinutes: 70 })]);
    const result = await service.generateReport({});
    expect(result[0].totalHours).toBe(1.17);
  });
});
