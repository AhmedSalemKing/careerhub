import {
  ConflictException, HttpException, Injectable, Logger, NotFoundException, OnModuleInit,
} from '@nestjs/common';
import { Prisma, Track } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTrackDto } from './dto/create-track.dto';
import { UpdateTrackDto } from './dto/update-track.dto';

export type TrackCountry = 'EG' | 'KSA';

interface JobRow {
  titleAr?: string; titleEn?: string; descAr?: string; descEn?: string;
  salaryMinEG?: number | null; salaryMaxEG?: number | null; salaryMinKSA?: number | null; salaryMaxKSA?: number | null;
  vision?: string[] | string;
}
interface CourseRow { order?: number; titleAr?: string; titleEn?: string; type?: string; typeEn?: string; weeks?: number; provider?: string; language?: string }
interface PackageRow { nameAr?: string; nameEn?: string; descAr?: string; descEn?: string; priceEG?: number | null; priceKSA?: number | null; sessions?: number | null; isActive?: boolean }

const asArray = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const asVision = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : typeof v === 'string' && v ? [v] : []);
const pick = (en: boolean, ar?: string, enVal?: string) => ((en ? enVal : ar) || ar || enVal || '').toString();

/** Columns the model expects; used to repair a table that was created by an earlier / different version. */
const COLUMNS: Array<[string, string]> = [
  ['slug', 'TEXT'], ['nameAr', 'TEXT'], ['nameEn', 'TEXT'], ['descAr', 'TEXT'], ['descEn', 'TEXT'],
  ['weeks', 'INTEGER'], ['level', 'TEXT'], ['levelEn', 'TEXT'], ['languages', 'TEXT'],
  ['vision2030', 'TEXT[]'], ['skills', 'TEXT[]'], ['skillsEn', 'TEXT[]'],
  ['jobs', "JSONB NOT NULL DEFAULT '[]'"], ['courses', "JSONB NOT NULL DEFAULT '[]'"], ['packages', "JSONB NOT NULL DEFAULT '[]'"],
  ['freeItemsAr', 'TEXT[]'], ['freeItemsEn', 'TEXT[]'],
  ['isActive', 'BOOLEAN NOT NULL DEFAULT true'], ['country', "TEXT NOT NULL DEFAULT 'BOTH'"],
  ['createdAt', 'TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP'], ['updatedAt', 'TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP'],
];

@Injectable()
export class TracksService implements OnModuleInit {
  private readonly logger = new Logger(TracksService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Makes sure the `tracks` table exists with every column the model needs. Everything here is additive and
   * idempotent (CREATE ... IF NOT EXISTS / ADD COLUMN IF NOT EXISTS), so it is safe to run on every boot even
   * when `prisma migrate deploy` already did the same work.
   */
  async onModuleInit() {
    try {
      await this.prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "tracks" ("id" TEXT NOT NULL, CONSTRAINT "tracks_pkey" PRIMARY KEY ("id"))`);
      for (const [name, def] of COLUMNS) {
        await this.prisma.$executeRawUnsafe(`ALTER TABLE "tracks" ADD COLUMN IF NOT EXISTS "${name}" ${def}`);
      }
      // jobs / courses created as jsonb[] by an older definition: turn them into one jsonb array, keeping the data
      for (const col of ['jobs', 'courses']) {
        const rows = await this.prisma.$queryRawUnsafe<{ data_type: string }[]>(
          `SELECT data_type FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = '${col}'`,
        );
        if (rows[0]?.data_type === 'ARRAY') {
          await this.prisma.$executeRawUnsafe(`ALTER TABLE "tracks" ALTER COLUMN "${col}" DROP DEFAULT`);
          await this.prisma.$executeRawUnsafe(`ALTER TABLE "tracks" ALTER COLUMN "${col}" TYPE JSONB USING COALESCE(to_jsonb("${col}"), '[]'::jsonb)`);
          await this.prisma.$executeRawUnsafe(`ALTER TABLE "tracks" ALTER COLUMN "${col}" SET DEFAULT '[]'::jsonb`);
          this.logger.warn(`[Tracks] converted tracks.${col} from an array column to jsonb`);
        }
      }
      await this.prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "tracks_slug_key" ON "tracks"("slug")`);
      await this.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "tracks_isActive_idx" ON "tracks"("isActive")`);
      const n = await this.prisma.track.count();
      this.logger.log(`[Tracks] table ready, ${n} row(s)`);
    } catch (e: any) {
      // never block API start-up because of this; the admin endpoints report the real error
      this.logger.error(`[Tracks] could not verify the tracks table: ${e?.message ?? e}`);
    }
  }

  /** Admin-facing: log the real cause and surface it (admin routes only) instead of a bare 500. */
  private fail(op: string, e: any): never {
    if (e instanceof HttpException) throw e;
    const msg = String(e?.message ?? e).split('\n').filter(Boolean).slice(-2).join(' ');
    this.logger.error(`[Tracks] ${op} failed: ${e?.stack ?? e}`);
    throw new HttpException({ message: `Tracks ${op} failed: ${msg}`, code: e?.code }, 500);
  }

  private normaliseCountry(c?: string): TrackCountry | undefined {
    const v = (c || '').toUpperCase();
    return v === 'EG' ? 'EG' : v === 'KSA' || v === 'SA' ? 'KSA' : undefined;
  }

  /** Flatten one row into the language / market the visitor asked for. */
  private localise(t: Track, lang: string, country?: TrackCountry) {
    const en = lang === 'en';
    const ksa = country === 'KSA';
    const currency = ksa ? 'SAR' : 'EGP';

    const jobs = asArray<JobRow>(t.jobs).map((j) => {
      const min = ksa ? j.salaryMinKSA : j.salaryMinEG;
      const max = ksa ? j.salaryMaxKSA : j.salaryMaxEG;
      return {
        title: pick(en, j.titleAr, j.titleEn),
        desc: pick(en, j.descAr, j.descEn),
        salaryMin: min ?? null,
        salaryMax: max ?? null,
        currency,
        vision: asVision(j.vision),
      };
    });

    const courses = asArray<CourseRow>(t.courses)
      .map((c) => ({
        order: c.order ?? 0,
        title: pick(en, c.titleAr, c.titleEn),
        type: pick(en, c.type, c.typeEn),
        weeks: c.weeks ?? 0,
        provider: c.provider || '',
        language: c.language || '',
      }))
      .sort((a, b) => a.order - b.order);

    const packages = asArray<PackageRow>(t.packages)
      .filter((p) => p.isActive !== false)
      .map((p) => ({
        name: pick(en, p.nameAr, p.nameEn),
        desc: pick(en, p.descAr, p.descEn),
        price: (ksa ? p.priceKSA : p.priceEG) ?? null,
        currency,
        sessions: p.sessions ?? 0,
      }));

    return {
      id: t.id,
      slug: t.slug,
      name: en ? t.nameEn : t.nameAr,
      description: en ? t.descEn : t.descAr,
      weeks: t.weeks,
      level: en ? t.levelEn : t.level,
      languages: t.languages,
      vision2030: t.vision2030,
      skills: en ? t.skillsEn : t.skills,
      jobs,
      jobCount: jobs.length,
      courses,
      courseCount: courses.length,
      packages,
      freeItems: en ? t.freeItemsEn : t.freeItemsAr,
      country: t.country,
      currency,
    };
  }

  private marketFilter(country?: TrackCountry): Prisma.TrackWhereInput {
    return country ? { isActive: true, country: { in: [country, 'BOTH'] } } : { isActive: true };
  }

  async list(countryParam?: string, lang = 'ar') {
    const country = this.normaliseCountry(countryParam);
    try {
      const rows = await this.prisma.track.findMany({ where: this.marketFilter(country), orderBy: { createdAt: 'asc' } });
      return rows.map((t) => this.localise(t, lang, country));
    } catch (e: any) {
      // The public site must keep working (it falls back to its static cards) even if the table is unavailable.
      this.logger.error(`[Tracks] list failed: ${e?.message ?? e}`);
      return [];
    }
  }

  async getBySlug(slug: string, countryParam?: string, lang = 'ar') {
    const country = this.normaliseCountry(countryParam);
    let t: Track | null = null;
    try {
      t = await this.prisma.track.findFirst({ where: { slug, ...this.marketFilter(country) } });
    } catch (e: any) {
      this.logger.error(`[Tracks] getBySlug failed: ${e?.message ?? e}`);
    }
    if (!t) throw new NotFoundException('Track not found');
    return this.localise(t, lang, country);
  }

  // ── admin ──
  async adminList() {
    try {
      return await this.prisma.track.findMany({ orderBy: { createdAt: 'desc' } });
    } catch (e) {
      this.fail('list', e);
    }
  }

  async create(dto: CreateTrackDto) {
    try {
      return await this.prisma.track.create({
        data: {
          ...dto,
          jobs: dto.jobs as Prisma.InputJsonValue,
          courses: dto.courses as Prisma.InputJsonValue,
          packages: (dto.packages ?? []) as Prisma.InputJsonValue,
        },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') throw new ConflictException('A track with this slug already exists');
      this.fail('create', e);
    }
  }

  async update(id: string, dto: UpdateTrackDto) {
    const { jobs, courses, packages, ...rest } = dto;
    try {
      return await this.prisma.track.update({
        where: { id },
        data: {
          ...rest,
          ...(jobs ? { jobs: jobs as Prisma.InputJsonValue } : {}),
          ...(courses ? { courses: courses as Prisma.InputJsonValue } : {}),
          ...(packages ? { packages: packages as Prisma.InputJsonValue } : {}),
        },
      });
    } catch (e: any) {
      if (e?.code === 'P2025') throw new NotFoundException('Track not found');
      if (e?.code === 'P2002') throw new ConflictException('A track with this slug already exists');
      this.fail('update', e);
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.track.delete({ where: { id } });
      return { deleted: true };
    } catch (e: any) {
      if (e?.code === 'P2025') throw new NotFoundException('Track not found');
      this.fail('delete', e);
    }
  }

  /**
   * Creates an inactive draft track for every existing career path that has none yet (matched by slug),
   * so the admin can complete and publish them. Existing tracks are never touched.
   */
  async importCareerPaths() {
    try {
      const [paths, existing] = await Promise.all([
        this.prisma.careerPath.findMany({ orderBy: { sortOrder: 'asc' } }),
        this.prisma.track.findMany({ select: { slug: true } }),
      ]);
      const have = new Set(existing.map((t) => t.slug));
      let created = 0;
      for (const p of paths) {
        if (have.has(p.slug)) continue;
        await this.prisma.track.create({
          data: {
            slug: p.slug,
            nameAr: p.titleAr,
            nameEn: p.titleEn,
            descAr: p.descriptionAr,
            descEn: p.descriptionEn,
            weeks: 8,
            level: 'مبتدئ ← متوسط',
            levelEn: 'Beginner → Intermediate',
            languages: 'العربية · الإنجليزية',
            vision2030: [],
            skills: p.skills,
            skillsEn: p.skills,
            jobs: p.jobTitlesAr.map((titleAr, i) => ({ titleAr, titleEn: p.jobTitlesEn[i] ?? titleAr, descAr: '', descEn: '', vision: [] })) as Prisma.InputJsonValue,
            courses: [] as Prisma.InputJsonValue,
            packages: [] as Prisma.InputJsonValue,
            freeItemsAr: [],
            freeItemsEn: [],
            isActive: false,
            country: 'BOTH',
          },
        });
        created++;
      }
      return { created, skipped: paths.length - created };
    } catch (e) {
      this.fail('import', e);
    }
  }
}
