import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExternalLectureDto } from './dto/create-external-lecture.dto';
import { UpdateExternalLectureDto } from './dto/update-external-lecture.dto';

@Injectable()
export class ExternalLecturesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateExternalLectureDto, createdById: string) {
    return this.prisma.externalLecture.create({
      data: { ...dto, lectureDate: new Date(dto.lectureDate), createdById },
    });
  }

  async findAll(filters: { instructorId?: string; courseId?: string; dateFrom?: string; dateTo?: string }) {
    const where: any = {};
    if (filters.instructorId) where.instructorId = filters.instructorId;
    if (filters.courseId) where.courseId = filters.courseId;
    if (filters.dateFrom || filters.dateTo) {
      where.lectureDate = {};
      if (filters.dateFrom) where.lectureDate.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.lectureDate.lte = new Date(filters.dateTo);
    }
    return this.prisma.externalLecture.findMany({
      where,
      include: { instructor: true },
      orderBy: { lectureDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const lecture = await this.prisma.externalLecture.findUnique({
      where: { id },
      include: { instructor: true },
    });
    if (!lecture) throw new NotFoundException(`External lecture ${id} not found`);
    return lecture;
  }

  async update(id: string, dto: UpdateExternalLectureDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.lectureDate) data.lectureDate = new Date(dto.lectureDate);
    return this.prisma.externalLecture.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.externalLecture.delete({ where: { id } });
  }
}
