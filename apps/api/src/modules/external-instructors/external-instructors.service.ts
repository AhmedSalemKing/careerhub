import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExternalInstructorDto } from './dto/create-external-instructor.dto';
import { UpdateExternalInstructorDto } from './dto/update-external-instructor.dto';

@Injectable()
export class ExternalInstructorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateExternalInstructorDto) {
    return this.prisma.externalInstructor.create({ data: dto });
  }

  async findAll(includeInactive = false) {
    return this.prisma.externalInstructor.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const instructor = await this.prisma.externalInstructor.findUnique({
      where: { id },
      include: { lectures: { orderBy: { lectureDate: 'desc' } } },
    });
    if (!instructor) throw new NotFoundException(`External instructor ${id} not found`);
    return instructor;
  }

  async update(id: string, dto: UpdateExternalInstructorDto) {
    await this.findOne(id);
    return this.prisma.externalInstructor.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.externalInstructor.delete({ where: { id } });
  }
}
