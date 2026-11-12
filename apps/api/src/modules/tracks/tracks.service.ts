import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Track } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTrackDto } from './dto/create-track.dto';
import { UpdateTrackDto } from './dto/update-track.dto';

export type TrackCountry = 'EG' | 'KSA';

interface JobRow { titleAr?: string; titleEn?: string; descAr?: string; descEn?: string; salaryMin?: number; salaryMax?: number; currency?: string; vision?: string }
interface CourseRow { order?: number; titleAr?: string; titleEn?: string; type?: string; typeEn?: string; weeks?: number; provider?: string; language?: string }

@Injectable()
export class TracksService {
  constructor(private readonly prisma: PrismaService) {}

  private normaliseCountry(c?: string): TrackCountry | undefined {
    const v = (c || '').toUpperCase();
    return v === 'EG' ? 'EG' : v === 'KSA' || v === 'SA' ? 'KSA' : undefined;
  }

  /** Flatten one row into the language / market the visitor asked for. */
  private localise(t: Track, lang: string, country?: TrackCountry) {
    const en = lang === 'en';
    const jobs = (Array.isArray(t.jobs) ? (t.jobs as unknown as JobRow[]) : []).map((j) => ({
      title: (en ? j.titleEn : j.titleAr) || j.titleAr || j.titleEn || '',
      desc: (en ? j.descEn : j.descAr) || j.descAr || j.descEn || '',
      salaryMin: j.salaryMin ?? null,
      salaryMax: j.salaryMax ?? null,
      currency: j.currency || '',
      vision: j.vision || '',
    }));
    const courses = (Array.isArray(t.courses) ? (t.courses as unknown as CourseRow[]) : [])
      .map((c) => ({
        order: c.order ?? 0,
        title: (en ? c.titleEn : c.titleAr) || c.titleAr || c.titleEn || '',
        type: (en ? c.typeEn : c.type) || c.type || c.typeEn || '',
        weeks: c.weeks ?? 0,
        provider: c.provider || '',
        language: c.language || '',
      }))
      .sort((a, b) => a.order - b.order);

    const ksa = country === 'KSA';
    return {
      id: t.id,
      slug: t.slug,
      name: en ? t.nameEn : t.nameAr,
      description: en ? t.descEn : t.descAr,
      weeks: t.weeks,
      level: en ? t.levelEn : t.level,
      languages: t.languages,
      vision2030: t.vision2030,
      price: ksa ? t.priceKSA : t.priceEG,
      currency: ksa ? 'SAR' : 'EGP',
      sessionPrice: ksa ? t.sessionPriceKSA : t.sessionPrice,
      skills: en ? t.skillsEn : t.skills,
      jobs,
      courses,
      courseCount: courses.length,
      freeItems: en ? t.freeItemsEn : t.freeItemsAr,
      country: t.country,
    };
  }

  private marketFilter(country?: TrackCountry): Prisma.TrackWhereInput {
    return country ? { isActive: true, country: { in: [country, 'BOTH'] } } : { isActive: true };
  }

  async list(countryParam?: string, lang = 'ar') {
    const country = this.normaliseCountry(countryParam);
    const rows = await this.prisma.track.findMany({ where: this.marketFilter(country), orderBy: { createdAt: 'asc' } });
    return rows.map((t) => this.localise(t, lang, country));
  }

  async getBySlug(slug: string, countryParam?: string, lang = 'ar') {
    const country = this.normaliseCountry(countryParam);
    const t = await this.prisma.track.findFirst({ where: { slug, ...this.marketFilter(country) } });
    if (!t) throw new NotFoundException('Track not found');
    return this.localise(t, lang, country);
  }

  // ── admin ──
  adminList() {
    return this.prisma.track.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(dto: CreateTrackDto) {
    try {
      return await this.prisma.track.create({
        data: { ...dto, jobs: dto.jobs as Prisma.InputJsonValue, courses: dto.courses as Prisma.InputJsonValue },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') throw new ConflictException('A track with this slug already exists');
      throw e;
    }
  }

  async update(id: string, dto: UpdateTrackDto) {
    const { jobs, courses, ...rest } = dto;
    try {
      return await this.prisma.track.update({
        where: { id },
        data: {
          ...rest,
          ...(jobs ? { jobs: jobs as Prisma.InputJsonValue } : {}),
          ...(courses ? { courses: courses as Prisma.InputJsonValue } : {}),
        },
      });
    } catch (e: any) {
      if (e?.code === 'P2025') throw new NotFoundException('Track not found');
      if (e?.code === 'P2002') throw new ConflictException('A track with this slug already exists');
      throw e;
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.track.delete({ where: { id } });
      return { deleted: true };
    } catch (e: any) {
      if (e?.code === 'P2025') throw new NotFoundException('Track not found');
      throw e;
    }
  }
}
