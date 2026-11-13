import {
  Body, Controller, Delete, Get, Logger, Param, Post, Put, Query, Req, UseGuards, ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TracksService } from './tracks.service';
import { CreateTrackDto } from './dto/create-track.dto';
import { UpdateTrackDto } from './dto/update-track.dto';

const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });

@ApiTags('Tracks')
@Controller('tracks')
export class TracksController {
  constructor(private readonly tracks: TracksService) {}

  @Get()
  async list(@Query('country') country?: string, @Query('lang') lang?: string) {
    return { success: true, data: await this.tracks.list(country, lang === 'en' ? 'en' : 'ar') };
  }

  @Get(':slug')
  async one(@Param('slug') slug: string, @Query('country') country?: string, @Query('lang') lang?: string) {
    return { success: true, data: await this.tracks.getBySlug(slug, country, lang === 'en' ? 'en' : 'ar') };
  }
}

@ApiTags('Tracks (admin)')
@Controller('admin/tracks')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminTracksController {
  private readonly log = new Logger('AdminTracks');
  constructor(private readonly tracks: TracksService) {}

  /** Raw request body vs the validated DTO: shows whether jobs / courses survive the pipes. */
  private logReceived(op: string, req: any, dto: any) {
    const n = (v: unknown) => (Array.isArray(v) ? v.length : typeof v === 'string' ? `string(${v.length})` : String(v));
    this.log.log(`[Tracks] ${op} received raw body: courses=${n(req?.body?.courses)} jobs=${n(req?.body?.jobs)} | after validation: courses=${n(dto?.courses)} jobs=${n(dto?.jobs)}`);
  }

  @Get()
  async list() {
    return { success: true, data: await this.tracks.adminList() };
  }

  @Post()
  async create(@Body(pipe) dto: CreateTrackDto, @Req() req: any) {
    this.logReceived('create', req, dto);
    return { success: true, data: await this.tracks.create(dto) };
  }

  @Post('import-career-paths')
  async importPaths() {
    return { success: true, data: await this.tracks.importCareerPaths() };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body(pipe) dto: UpdateTrackDto, @Req() req: any) {
    this.logReceived('update', req, dto);
    return { success: true, data: await this.tracks.update(id, dto) };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return { success: true, data: await this.tracks.remove(id) };
  }
}
