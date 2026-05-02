import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { CertificatesService } from './certificates.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@ApiTags('Certificates')
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  // ── Generate certificate for a course ──────────────────────
  // Accepts courseId via URL param OR request body
  @Post('generate/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate certificate image for completed course' })
  async generate(
    @Param('courseId') pathCourseId: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    const courseId = pathCourseId || body?.courseId
    if (!courseId) {
      console.error('[Certificate] No courseId provided in path or body')
      throw new Error('courseId is required')
    }
    const userId = req.user.sub || req.user.id
    const isAdmin = req.user.role === 'ADMIN' || req.user.accountType === 'ADMIN'
    console.log('[Certificate] Generate request:', { userId, courseId, isAdmin, pathCourseId, bodyCourseId: body?.courseId })
    return this.certificatesService.generateCertificate(userId, courseId, isAdmin)
  }

  // ── Test endpoint to debug certificate generation ─────────────
  @Get('test/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Test certificate generation (Admin)' })
  async testGenerate(@Param('courseId') courseId: string, @Request() req: any) {
    const userId = req.user.sub || req.user.id
    const isAdmin = true // always admin for test
    console.log('[Certificate] Test generate:', { userId, courseId })
    return this.certificatesService.generateCertificate(userId, courseId, isAdmin)
  }

  // ── Manual trigger: generate for course (bypass enrollment check) ──
  @Post('generate-for-course/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually trigger certificate generation for current user' })
  async generateForCourse(
    @Param('courseId') courseId: string,
    @Request() req: any,
  ) {
    const userId = req.user.sub || req.user.id
    console.log('[CertCtrl] Manual generate for user:', userId, 'course:', courseId)
    return this.certificatesService.generateCertificate(userId, courseId, true)
  }

  // ── My certificates ─────────────────────────────────────────
  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user certificates' })
  async getMy(@Request() req: any) {
    const userId = req.user.sub || req.user.id
    console.log('[Certificates] getMy called with userId:', userId, 'user:', { sub: req.user.sub, id: req.user.id, email: req.user.email })
    const certs = await this.certificatesService.getMyCertificates(userId)
    console.log('[Certificates] Found certificates:', certs.length)
    return { success: true, data: certs }
  }

  // Keep legacy endpoint so old frontend code doesn't break
  @Get('my-certificates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user certificates (legacy)' })
  async getMyCertificatesLegacy(@Request() req: any) {
    const userId = req.user.sub || req.user.id
    const certs = await this.certificatesService.getMyCertificates(userId)
    return { success: true, data: certs }
  }

  // ── Verify by serial number (new path) ─────────────────────
  @Get('verify/:verifyCode')
  @ApiOperation({ summary: 'Verify certificate by serial number' })
  async verifyByCode(@Param('verifyCode') verifyCode: string) {
    const result = await this.certificatesService.verifyCertificate(verifyCode)
    return { success: true, data: result }
  }

  // ── Admin: all certificates ─────────────────────────────────
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all certificates (Admin)' })
  async getAllAdmin() {
    const certs = await this.certificatesService.getAllCertificatesAdmin()
    return { success: true, data: certs }
  }

  // ── Admin stats ─────────────────────────────────────────────
  @Get('stats/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Certificate statistics' })
  async getStats() {
    const stats = await this.certificatesService.getCertificateStats()
    return { success: true, data: stats }
  }
}
