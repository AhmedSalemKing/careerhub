import { BadRequestException, HttpException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePackageDto, UpdatePackageDto } from './dto/create-package.dto';

@Injectable()
export class PackagesService implements OnModuleInit {
  private readonly logger = new Logger(PackagesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Same idea as the tracks table: additive and repeatable, safe next to `prisma migrate deploy`. */
  async onModuleInit() {
    try {
      await this.prisma.$executeRawUnsafe(
        `CREATE TABLE IF NOT EXISTS "packages" ("id" TEXT NOT NULL, "pathId" TEXT NOT NULL, "pathKind" TEXT NOT NULL DEFAULT 'TRACK', "courseIds" TEXT[], "originalPrice" DOUBLE PRECISION, "finalPrice" DOUBLE PRECISION NOT NULL, "notes" TEXT, "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "packages_pkey" PRIMARY KEY ("id"))`,
      );
      await this.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "packages_pathId_idx" ON "packages"("pathId")`);
      await this.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "packages_isActive_idx" ON "packages"("isActive")`);
    } catch (e: any) {
      this.logger.error(`[Packages] could not verify the packages table: ${e?.message ?? e}`);
    }
  }

  private fail(op: string, e: any): never {
    if (e instanceof HttpException) throw e;
    const msg = String(e?.message ?? e).split('\n').filter(Boolean).slice(-2).join(' ');
    this.logger.error(`[Packages] ${op} failed: ${e?.stack ?? e}`);
    throw new HttpException({ message: `Packages ${op} failed: ${msg}`, code: e?.code }, 500);
  }

  /** The id sent by the form is a Track id, a CareerPath id, or a CareerPath slug. */
  private async resolvePath(pathId: string): Promise<{ id: string; kind: 'TRACK' | 'CAREER_PATH' }> {
    const track = await this.prisma.track.findFirst({ where: { OR: [{ id: pathId }, { slug: pathId }] }, select: { id: true } });
    if (track) return { id: track.id, kind: 'TRACK' };
    const path = await this.prisma.careerPath.findFirst({ where: { OR: [{ id: pathId }, { slug: pathId }] }, select: { id: true } });
    if (path) return { id: path.id, kind: 'CAREER_PATH' };
    throw new BadRequestException('Unknown career path or track');
  }

  private async assertCourses(courseIds: string[]) {
    const unique = Array.from(new Set(courseIds));
    const found = await this.prisma.course.count({ where: { id: { in: unique } } });
    if (found !== unique.length) throw new BadRequestException('One or more selected courses do not exist');
    return unique;
  }

  async create(dto: CreatePackageDto) {
    try {
      const path = await this.resolvePath(dto.pathId);
      const courseIds = await this.assertCourses(dto.courseIds);
      return await this.prisma.package.create({
        data: {
          pathId: path.id,
          pathKind: path.kind,
          courseIds,
          originalPrice: dto.originalPrice ?? null,
          finalPrice: dto.finalPrice,
          notes: dto.notes ?? null,
          isActive: dto.isActive ?? true,
        },
      });
    } catch (e) {
      this.fail('create', e);
    }
  }

  /** Public list: active packages only, optionally for one track / path. */
  async findAll(pathId?: string) {
    try {
      let id = pathId;
      if (pathId) {
        try { id = (await this.resolvePath(pathId)).id; } catch { /* unknown path: filter by the raw value */ }
      }
      return await this.prisma.package.findMany({
        where: { isActive: true, ...(id ? { pathId: id } : {}) },
        orderBy: { createdAt: 'desc' },
      });
    } catch (e) {
      this.fail('list', e);
    }
  }

  async findAllAdmin() {
    try {
      return await this.prisma.package.findMany({ orderBy: { createdAt: 'desc' } });
    } catch (e) {
      this.fail('list', e);
    }
  }

  async findOne(id: string) {
    const pkg = await this.prisma.package.findFirst({ where: { id, isActive: true } }).catch((e) => this.fail('get', e));
    if (!pkg) throw new NotFoundException('Package not found');
    return pkg;
  }

  async update(id: string, dto: UpdatePackageDto) {
    try {
      const data: Record<string, unknown> = {};
      if (dto.pathId !== undefined) {
        const path = await this.resolvePath(dto.pathId);
        data.pathId = path.id;
        data.pathKind = path.kind;
      }
      if (dto.courseIds !== undefined) data.courseIds = await this.assertCourses(dto.courseIds);
      if (dto.originalPrice !== undefined) data.originalPrice = dto.originalPrice;
      if (dto.finalPrice !== undefined) data.finalPrice = dto.finalPrice;
      if (dto.notes !== undefined) data.notes = dto.notes;
      if (dto.isActive !== undefined) data.isActive = dto.isActive;
      return await this.prisma.package.update({ where: { id }, data });
    } catch (e: any) {
      if (e?.code === 'P2025') throw new NotFoundException('Package not found');
      this.fail('update', e);
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.package.delete({ where: { id } });
      return { deleted: true };
    } catch (e: any) {
      if (e?.code === 'P2025') throw new NotFoundException('Package not found');
      this.fail('delete', e);
    }
  }
}
