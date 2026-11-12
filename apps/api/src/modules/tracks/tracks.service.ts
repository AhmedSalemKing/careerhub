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
interface CourseRow { order?: number; titleAr?: string; titleEn?: string; type?: string; typeEn?: string; weeks?: number; provider?: string; language?: string; courseId?: string }

/**
 * Json columns can come back as a real array, as a JSON string (double-encoded by an earlier writer),
 * or as an object keyed by index. Always return a plain array of objects.
 */
export function toJsonArray<T = Record<string, unknown>>(value: unknown): T[] {
  let v: unknown = value;
  for (let i = 0; i < 3 && typeof v === 'string'; i++) {
    try { v = JSON.parse(v); } catch { return []; }
  }
  if (v && typeof v === 'object' && !Array.isArray(v)) v = Object.values(v as Record<string, unknown>);
  if (!Array.isArray(v)) return [];
  return v
    .map((item) => {
      let x: unknown = item;
      if (typeof x === 'string') { try { x = JSON.parse(x); } catch { return null; } }
      return x && typeof x === 'object' ? (x as T) : null;
    })
    .filter((x): x is T => x !== null);
}

const asArray = <T>(v: unknown): T[] => toJsonArray<T>(v);
const asVision = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : typeof v === 'string' && v ? [v] : []);
const pick = (en: boolean, ar?: string, enVal?: string) => ((en ? enVal : ar) || ar || enVal || '').toString();

/** Columns the model expects; used to repair a table that was created by an earlier / different version. */
const COLUMNS: Array<[string, string]> = [
  ['slug', 'TEXT'], ['nameAr', 'TEXT'], ['nameEn', 'TEXT'], ['descAr', 'TEXT'], ['descEn', 'TEXT'],
  ['weeks', 'INTEGER'], ['level', 'TEXT'], ['levelEn', 'TEXT'], ['languages', 'TEXT'],
  ['coverImage', 'TEXT'], ['vision2030', 'TEXT[]'], ['skills', 'TEXT[]'], ['skillsEn', 'TEXT[]'],
  ['jobs', "JSONB NOT NULL DEFAULT '[]'"], ['courses', "JSONB NOT NULL DEFAULT '[]'"],
  ['sessionPrice', 'DOUBLE PRECISION'], ['speciality', 'TEXT'], ['visionDescKSA', 'TEXT'], ['visionDescEG', 'TEXT'],
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

    const range = (min?: number | null, max?: number | null) => ({ min: min ?? null, max: max ?? null });
    const jobs = asArray<JobRow>(t.jobs).map((j) => ({
      title: pick(en, j.titleAr, j.titleEn),
      desc: pick(en, j.descAr, j.descEn),
      titleAr: j.titleAr || j.titleEn || '',
      salaryEG: range(j.salaryMinEG, j.salaryMaxEG),
      salaryKSA: range(j.salaryMinKSA, j.salaryMaxKSA),
      vision: asVision(j.vision),
    }));

    const courses = asArray<CourseRow>(t.courses)
      .map((c) => ({
        order: c.order ?? 0,
        title: pick(en, c.titleAr, c.titleEn),
        type: pick(en, c.type, c.typeEn),
        weeks: c.weeks ?? 0,
        provider: c.provider || '',
        language: c.language || '',
        courseId: c.courseId || null,
      }))
      .sort((a, b) => a.order - b.order);

    return {
      id: t.id,
      slug: t.slug,
      name: en ? t.nameEn : t.nameAr,
      description: en ? t.descEn : t.descAr,
      weeks: t.weeks,
      level: en ? t.levelEn : t.level,
      languages: t.languages,
      coverImage: t.coverImage ?? null,
      speciality: t.speciality ?? null,
      visionDescKSA: t.visionDescKSA ?? null,
      visionDescEG: t.visionDescEG ?? null,
      vision2030: t.vision2030,
      skills: en ? t.skillsEn : t.skills,
      jobs,
      jobCount: jobs.length,
      courses,
      courseCount: courses.length,
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
    const consultants = await this.findConsultants(t.speciality);
    const prices = consultants.map((c) => c.sessionPrice).filter((n): n is number => n != null && n > 0);
    // an explicit price set by the admin wins; otherwise the cheapest matching consultant; otherwise none
    const sessionPrice = t.sessionPrice ?? (prices.length ? Math.min(...prices) : null);
    const pkg = await this.findPackage(t.id);
    return { ...this.localise(t, lang, country), consultants, sessionPrice, package: pkg };
  }

  /** The newest active package of the track (prices are SAR, the platform base currency). */
  private async findPackage(trackId: string) {
    try {
      const p = await this.prisma.package.findFirst({ where: { pathId: trackId, isActive: true }, orderBy: { createdAt: 'desc' } });
      if (!p) return null;
      const discountPct = p.originalPrice && p.originalPrice > p.finalPrice ? Math.round((1 - p.finalPrice / p.originalPrice) * 100) : null;
      return { id: p.id, price: p.finalPrice, originalPrice: p.originalPrice ?? null, discountPct, notes: p.notes ?? null, courseCount: p.courseIds.length };
    } catch (e: any) {
      this.logger.error(`[Tracks] package lookup failed: ${e?.message ?? e}`);
      return null;
    }
  }

  /** Active consultants whose speciality matches the track's (amounts are SAR, the platform's base currency). */
  private async findConsultants(speciality?: string | null) {
    const spec = (speciality || '').trim();
    if (!spec) return [];
    try {
      const users = await this.prisma.user.findMany({
        where: {
          accountType: 'CONSULTANT',
          status: 'ACTIVE',
          isActive: true,
          OR: [
            { speciality: { contains: spec, mode: 'insensitive' } },
            { profile: { speciality: { contains: spec, mode: 'insensitive' } } },
          ],
        },
        select: { id: true, hourlyRate: true, profile: { select: { firstName: true, lastName: true, avatar: true, sessionPrice: true } } },
        take: 12,
      });
      return users
        .map((u) => ({
          id: u.id,
          name: `${u.profile?.firstName ?? ''} ${u.profile?.lastName ?? ''}`.trim(),
          avatar: u.profile?.avatar ?? null,
          sessionPrice: u.profile?.sessionPrice ?? u.hourlyRate ?? null,
        }))
        .sort((a, b) => (a.sessionPrice ?? Infinity) - (b.sessionPrice ?? Infinity));
    } catch (e: any) {
      this.logger.error(`[Tracks] consultants lookup failed: ${e?.message ?? e}`);
      return [];
    }
  }

  // ── admin ──
  async adminList() {
    try {
      const rows = await this.prisma.track.findMany({ orderBy: { createdAt: 'desc' } });
      return rows.map((t) => ({ ...t, jobs: toJsonArray(t.jobs), courses: toJsonArray(t.courses) }));
    } catch (e) {
      this.fail('list', e);
    }
  }

  /** Logs what was actually stored and returns the row with jobs / courses as real arrays. */
  private verified(op: string, row: Track, sent: { jobs?: unknown; courses?: unknown }) {
    const stored = { jobs: toJsonArray(row.jobs).length, courses: toJsonArray(row.courses).length };
    const wanted = { jobs: sent.jobs === undefined ? stored.jobs : toJsonArray(sent.jobs).length, courses: sent.courses === undefined ? stored.courses : toJsonArray(sent.courses).length };
    const line = `[Tracks] ${op} ${row.slug}: jobs ${stored.jobs}/${wanted.jobs}, courses ${stored.courses}/${wanted.courses} (stored/sent)`;
    if (stored.jobs !== wanted.jobs || stored.courses !== wanted.courses) this.logger.error(`${line} MISMATCH`);
    else this.logger.log(line);
    return { ...row, jobs: toJsonArray(row.jobs), courses: toJsonArray(row.courses) };
  }

  async create(dto: CreateTrackDto) {
    try {
      const row = await this.prisma.track.create({
        data: {
          ...dto,
          jobs: toJsonArray(dto.jobs) as Prisma.InputJsonValue,
          courses: toJsonArray(dto.courses) as Prisma.InputJsonValue,
        },
      });
      return this.verified('create', row, dto);
    } catch (e: any) {
      if (e instanceof HttpException) throw e;
      if (e?.code === 'P2002') throw new ConflictException('A track with this slug already exists');
      this.fail('create', e);
    }
  }

  async update(id: string, dto: UpdateTrackDto) {
    const { jobs, courses, ...rest } = dto;
    try {
      const row = await this.prisma.track.update({
        where: { id },
        data: {
          ...rest,
          ...(jobs ? { jobs: toJsonArray(jobs) as Prisma.InputJsonValue } : {}),
          ...(courses ? { courses: toJsonArray(courses) as Prisma.InputJsonValue } : {}),
        },
      });
      return this.verified('update', row, { jobs, courses });
    } catch (e: any) {
      if (e instanceof HttpException) throw e;
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
