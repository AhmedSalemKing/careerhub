import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LectureRecordStatus } from '@prisma/client';
import { CreateLectureRecordDto } from '../dto/create-lecture-record.dto';
import { UpdateLectureRecordDto } from '../dto/update-lecture-record.dto';

export interface FindAllFilters {
  instructorId?: string;
  courseId?: string;
  status?: LectureRecordStatus;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class LectureRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: FindAllFilters = {}) {
    const where: any = {};

    if (filters.instructorId) {
      where.instructorId = filters.instructorId;
    }
    if (filters.courseId) {
      where.courseId = filters.courseId;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.deliveredAt = {};
      if (filters.dateFrom) {
        where.deliveredAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.deliveredAt.lte = new Date(filters.dateTo);
      }
    }

    const [records, total] = await Promise.all([
      this.prisma.lectureRecord.findMany({
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
      }),
      this.prisma.lectureRecord.count({ where }),
    ]);

    return { records, total };
  }

  async findOne(id: string) {
    const record = await this.prisma.lectureRecord.findUnique({
      where: { id },
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
    });

    if (!record) {
      throw new NotFoundException('Lecture record not found');
    }

    return record;
  }

  async create(dto: CreateLectureRecordDto) {
    return this.prisma.lectureRecord.create({
      data: {
        instructorId: dto.instructorId,
        courseId: dto.courseId,
        title: dto.title,
        deliveredAt: new Date(dto.deliveredAt),
        durationMinutes: dto.durationMinutes,
        status: dto.status ?? LectureRecordStatus.DRAFT,
        notes: dto.notes,
      },
    });
  }

  async update(id: string, dto: UpdateLectureRecordDto) {
    await this.findOne(id);

    const data: any = {};
    if (dto.instructorId !== undefined) data.instructorId = dto.instructorId;
    if (dto.courseId !== undefined) data.courseId = dto.courseId;
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.deliveredAt !== undefined) data.deliveredAt = new Date(dto.deliveredAt);
    if (dto.durationMinutes !== undefined) data.durationMinutes = dto.durationMinutes;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.notes !== undefined) data.notes = dto.notes;

    return this.prisma.lectureRecord.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.lectureRecord.delete({
      where: { id },
    });
  }
}
