import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CertificatesService } from './certificates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Certificates')
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get('my-certificates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user certificates' })
  @ApiResponse({ status: 200, description: 'Certificates retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async getMyCertificates(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const certificates = await this.certificatesService.getUserCertificates(user.id, {
      page: page || 1,
      limit: limit || 10,
    });
    return {
      success: true,
      data: certificates,
    };
  }

  @Get(':serialNumber')
  @ApiOperation({ summary: 'Get certificate by serial number' })
  @ApiResponse({ status: 200, description: 'Certificate retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  @ApiParam({ name: 'serialNumber', description: 'Certificate serial number' })
  async getCertificateBySerialNumber(@Param('serialNumber') serialNumber: string) {
    const certificate = await this.certificatesService.getCertificateBySerialNumber(serialNumber);
    return {
      success: true,
      data: { certificate },
    };
  }

  @Get(':serialNumber/verify')
  @ApiOperation({ summary: 'Verify certificate authenticity' })
  @ApiResponse({ status: 200, description: 'Certificate verification result' })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  @ApiParam({ name: 'serialNumber', description: 'Certificate serial number' })
  async verifyCertificate(@Param('serialNumber') serialNumber: string) {
    const verification = await this.certificatesService.verifyCertificate(serialNumber);
    return {
      success: true,
      data: verification,
    };
  }

  @Get(':serialNumber/download')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download certificate PDF' })
  @ApiResponse({ status: 200, description: 'Download URL generated' })
  @ApiResponse({ status: 403, description: 'Not authorized to download this certificate' })
  @ApiParam({ name: 'serialNumber', description: 'Certificate serial number' })
  async downloadCertificate(
    @CurrentUser() user: User,
    @Param('serialNumber') serialNumber: string,
  ) {
    const downloadUrl = await this.certificatesService.getDownloadUrl(user.id, serialNumber);
    return {
      success: true,
      data: { downloadUrl },
    };
  }

  @Get(':serialNumber/share')
  @ApiOperation({ summary: 'Get certificate sharing data' })
  @ApiResponse({ status: 200, description: 'Sharing data retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  @ApiParam({ name: 'serialNumber', description: 'Certificate serial number' })
  async getCertificateShareData(@Param('serialNumber') serialNumber: string) {
    const shareData = await this.certificatesService.getShareData(serialNumber);
    return {
      success: true,
      data: shareData,
    };
  }

  @Post(':serialNumber/share')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Share certificate on social media' })
  @ApiResponse({ status: 200, description: 'Certificate shared successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized to share this certificate' })
  @ApiParam({ name: 'serialNumber', description: 'Certificate serial number' })
  async shareCertificate(
    @CurrentUser() user: User,
    @Param('serialNumber') serialNumber: string,
    @Body() shareData: {
      platform: 'linkedin' | 'twitter' | 'facebook';
      message?: string;
    },
  ) {
    const result = await this.certificatesService.shareCertificate(
      user.id,
      serialNumber,
      shareData
    );
    return {
      success: true,
      message: 'Certificate shared successfully',
      data: result,
    };
  }

  @Get('course/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get certificate for specific course' })
  @ApiResponse({ status: 200, description: 'Certificate retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  async getCourseCertificate(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
  ) {
    const certificate = await this.certificatesService.getCourseCertificate(user.id, courseId);
    return {
      success: true,
      data: { certificate },
    };
  }

  @Post('request/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request certificate for completed course' })
  @ApiResponse({ status: 201, description: 'Certificate request processed' })
  @ApiResponse({ status: 400, description: 'Course not completed or certificate already issued' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  async requestCertificate(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
    @Body() requestData: {
      fullName?: string;
      includeDateOfBirth?: boolean;
    },
  ) {
    const certificate = await this.certificatesService.requestCertificate(
      user.id,
      courseId,
      requestData
    );
    return {
      success: true,
      message: 'Certificate generated successfully',
      data: { certificate },
    };
  }

  @Get('templates/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get certificate templates (Admin only)' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async getCertificateTemplates() {
    const templates = await this.certificatesService.getCertificateTemplates();
    return {
      success: true,
      data: { templates },
    };
  }

  @Post('templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create certificate template (Admin only)' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  async createCertificateTemplate(@Body() templateData: {
    name: string;
    description?: string;
    backgroundUrl?: string;
    layout: any;
  }) {
    const template = await this.certificatesService.createCertificateTemplate(templateData);
    return {
      success: true,
      message: 'Template created successfully',
      data: { template },
    };
  }

  @Post('regenerate/:certificateId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Regenerate certificate (Admin only)' })
  @ApiResponse({ status: 200, description: 'Certificate regenerated successfully' })
  @ApiParam({ name: 'certificateId', description: 'Certificate ID' })
  async regenerateCertificate(@Param('certificateId') certificateId: string) {
    const certificate = await this.certificatesService.regenerateCertificate(certificateId);
    return {
      success: true,
      message: 'Certificate regenerated successfully',
      data: { certificate },
    };
  }

  @Post('revoke/:certificateId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke certificate (Admin only)' })
  @ApiResponse({ status: 200, description: 'Certificate revoked successfully' })
  @ApiParam({ name: 'certificateId', description: 'Certificate ID' })
  async revokeCertificate(
    @Param('certificateId') certificateId: string,
    @Body('reason') reason: string,
  ) {
    const certificate = await this.certificatesService.revokeCertificate(certificateId, reason);
    return {
      success: true,
      message: 'Certificate revoked successfully',
      data: { certificate },
    };
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all certificates (Admin only)' })
  @ApiResponse({ status: 200, description: 'Certificates retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'courseId', required: false, description: 'Filter by course' })
  async getAllCertificates(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('courseId') courseId?: string,
  ) {
    const certificates = await this.certificatesService.getAllCertificates({
      page: page || 1,
      limit: limit || 20,
      status,
      courseId,
    });
    return {
      success: true,
      data: certificates,
    };
  }

  @Get('stats/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get certificate statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getCertificateStats() {
    const stats = await this.certificatesService.getCertificateStats();
    return {
      success: true,
      data: { stats },
    };
  }

  @Post('bulk/generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk generate certificates (Admin only)' })
  @ApiResponse({ status: 201, description: 'Bulk generation initiated' })
  async bulkGenerateCertificates(@Body() bulkData: {
    enrollments: string[];
    templateId?: string;
  }) {
    const result = await this.certificatesService.bulkGenerateCertificates(bulkData.enrollments);
    return {
      success: true,
      message: 'Bulk generation initiated',
      data: result,
    };
  }

  @Get('verify/batch')
  @ApiOperation({ summary: 'Verify multiple certificates' })
  @ApiResponse({ status: 200, description: 'Batch verification completed' })
  async verifyBatchCertificates(@Query('serialNumbers') serialNumbers: string) {
    const serialNumbersArray = serialNumbers.split(',');
    const results = await this.certificatesService.verifyBatchCertificates(serialNumbersArray);
    return {
      success: true,
      data: results,
    };
  }

  @Get('public/:serialNumber')
  @ApiOperation({ summary: 'Get public certificate view' })
  @ApiResponse({ status: 200, description: 'Public certificate data retrieved' })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  @ApiParam({ name: 'serialNumber', description: 'Certificate serial number' })
  async getPublicCertificate(@Param('serialNumber') serialNumber: string) {
    const certificate = await this.certificatesService.getPublicCertificate(serialNumber);
    return {
      success: true,
      data: { certificate },
    };
  }
}
