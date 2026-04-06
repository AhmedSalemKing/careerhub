import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Response } from 'express';
import { join } from 'path';
import { access, mkdir, writeFile } from 'fs/promises';
import { createReadStream } from 'fs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { User } from '@prisma/client';

@ApiTags('Upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) { }

  // Public CV upload — used during registration before the user has a token
  @Public()
  @Post('cv')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (_req, file, cb) => {
      const allowed = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Only PDF and Word files are allowed'), false);
      }
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload CV (public — no auth)' })
  @ApiResponse({ status: 201, description: 'CV uploaded successfully' })
  async uploadCV(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');
    const result = await this.uploadService.uploadCV(file);
    return { success: true, data: result };
  }

  @Post('single')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload single file' })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  async uploadSingleFile(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
    @Body('isPublic') isPublic?: string,
  ) {
    const result = await this.uploadService.uploadSingleFile(user.id, file, {
      folder,
      isPublic: isPublic === 'true',
    });
    return {
      success: true,
      message: 'File uploaded successfully',
      data: result,
    };
  }

  @Post('multiple')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiResponse({ status: 201, description: 'Files uploaded successfully' })
  async uploadMultipleFiles(
    @CurrentUser() user: User,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('folder') folder?: string,
    @Body('isPublic') isPublic?: string,
  ) {
    const result = await this.uploadService.uploadMultipleFiles(user.id, files, {
      folder,
      isPublic: isPublic === 'true',
    });
    return {
      success: true,
      message: 'Files uploaded successfully',
      data: result,
    };
  }

  @Post('image')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image', {
    storage: memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith('image/')) cb(null, true);
      else cb(new BadRequestException('Only image files are allowed'), false);
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload image — saved to S3' })
  @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  async uploadImage(@UploadedFile() image: Express.Multer.File) {
    if (!image) throw new BadRequestException('No image file provided');

    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

    const s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const safeName = image.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `images/img_${Date.now()}_${safeName}`;

    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: fileName,
      Body: image.buffer,
      ContentType: image.mimetype,
    }));

    const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    return {
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url,
        fileName: image.originalname,
        size: image.size,
        mimeType: image.mimetype,
      },
    };
  }

  @Post('file')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
    fileFilter: (_req, file, cb) => {
      const allowed = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'application/zip',
        'image/jpeg', 'image/png', 'image/gif',
      ];
      if (allowed.includes(file.mimetype)) cb(null, true);
      else cb(new BadRequestException('File type not supported'), false);
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload lesson file (PDF, Word, Excel, PPT...)' })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `file_${Date.now()}_${safeName}`;
    const dir = join(process.cwd(), 'uploads', 'files');
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, fileName), file.buffer);
    return {
      success: true,
      data: {
        url: `/uploads/files/${fileName}`,
        fileName: file.originalname,
        size: file.size,
        type: file.mimetype,
      },
    };
  }

  @Post('video')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('video', {
    storage: memoryStorage(),
    limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith('video/')) cb(null, true);
      else cb(new BadRequestException('Only video files are allowed'), false);
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload video — saved to local disk' })
  @ApiResponse({ status: 201, description: 'Video uploaded successfully' })
  async uploadVideo(@UploadedFile() video: Express.Multer.File) {
    if (!video) throw new BadRequestException('No video file provided');
    const safeName = video.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `video_${Date.now()}_${safeName}`;
    const dir = join(process.cwd(), 'uploads', 'videos');
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, fileName), video.buffer);
    return {
      success: true,
      message: 'Video uploaded successfully',
      data: {
        url: `/uploads/videos/${fileName}`,
        fileName: video.originalname,
        size: video.size,
        mimeType: video.mimetype,
      },
    };
  }

  @Post('document')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('document'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload document file' })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  async uploadDocument(
    @CurrentUser() user: User,
    @UploadedFile() document: Express.Multer.File,
    @Body('title') title?: string,
    @Body('description') description?: string,
  ) {
    const result = await this.uploadService.uploadDocument(user.id, document, {
      title,
      description,
    });
    return {
      success: true,
      message: 'Document uploaded successfully',
      data: result,
    };
  }

  @Get('my-files')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user uploaded files' })
  @ApiResponse({ status: 200, description: 'Files retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by file type' })
  async getMyFiles(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
  ) {
    const files = await this.uploadService.getUserFiles(user.id, {
      page: page || 1,
      limit: limit || 20,
      type,
    });
    return {
      success: true,
      data: files,
    };
  }

  @Get('cv/:filename')
  @ApiOperation({ summary: 'Serve CV file inline or as download' })
  async serveCV(
    @Param('filename') filename: string,
    @Res() res: Response,
    @Query('download') download?: string,
  ) {
    const filePath = join(process.cwd(), 'uploads', 'cvs', filename);

    try {
      await access(filePath);
    } catch {
      throw new NotFoundException('File not found');
    }

    const ext = filename.split('.').pop()?.toLowerCase();

    const contentTypes: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    const contentType = contentTypes[ext || ''] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);

    if (download === 'true') {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    } else {
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    }

    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-cache');

    const fileStream = createReadStream(filePath);
    fileStream.pipe(res);
  }

  @Get(':fileId')
  @ApiOperation({ summary: 'Get file by ID' })
  @ApiResponse({ status: 200, description: 'File retrieved successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiParam({ name: 'fileId', description: 'File ID' })
  async getFile(@Param('fileId') fileId: string) {
    const file = await this.uploadService.getFile(fileId);
    return {
      success: true,
      data: { file },
    };
  }

  @Get(':fileId/download')
  @ApiOperation({ summary: 'Download file' })
  @ApiResponse({ status: 200, description: 'File download URL generated' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiParam({ name: 'fileId', description: 'File ID' })
  async downloadFile(@Param('fileId') fileId: string) {
    const downloadUrl = await this.uploadService.getDownloadUrl(fileId);
    return {
      success: true,
      data: { downloadUrl },
    };
  }

  @Delete(':fileId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete file' })
  @ApiResponse({ status: 204, description: 'File deleted successfully' })
  @ApiParam({ name: 'fileId', description: 'File ID' })
  async deleteFile(
    @CurrentUser() user: User,
    @Param('fileId') fileId: string,
  ) {
    await this.uploadService.deleteFile(user.id, fileId);
  }

  @Post(':fileId/share')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Share file' })
  @ApiResponse({ status: 200, description: 'File shared successfully' })
  @ApiParam({ name: 'fileId', description: 'File ID' })
  async shareFile(
    @CurrentUser() user: User,
    @Param('fileId') fileId: string,
    @Body() shareData: {
      expiresAt?: Date;
      password?: string;
      downloadLimit?: number;
    },
  ) {
    const shareLink = await this.uploadService.shareFile(user.id, fileId, shareData);
    return {
      success: true,
      message: 'File shared successfully',
      data: { shareLink },
    };
  }

  @Get('shared/:shareId')
  @ApiOperation({ summary: 'Access shared file' })
  @ApiResponse({ status: 200, description: 'Shared file accessed successfully' })
  @ApiResponse({ status: 404, description: 'Shared file not found or expired' })
  @ApiParam({ name: 'shareId', description: 'Share ID' })
  async getSharedFile(@Param('shareId') shareId: string) {
    const file = await this.uploadService.getSharedFile(shareId);
    return {
      success: true,
      data: { file },
    };
  }

  @Post('presigned-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate presigned upload URL' })
  @ApiResponse({ status: 201, description: 'Presigned URL generated successfully' })
  async generatePresignedUrl(
    @CurrentUser() user: User,
    @Body() urlData: {
      fileName: string;
      fileType: string;
      fileSize: number;
      folder?: string;
    },
  ) {
    const presignedUrl = await this.uploadService.generatePresignedUrl(user.id, urlData);
    return {
      success: true,
      message: 'Presigned URL generated successfully',
      data: presignedUrl,
    };
  }

  @Post('process/:fileId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process uploaded file' })
  @ApiResponse({ status: 200, description: 'File processing started' })
  @ApiParam({ name: 'fileId', description: 'File ID' })
  async processFile(
    @CurrentUser() user: User,
    @Param('fileId') fileId: string,
    @Body() processData: {
      operation: 'resize' | 'compress' | 'convert' | 'extract_thumbnails';
      options?: Record<string, any>;
    },
  ) {
    const result = await this.uploadService.processFile(user.id, fileId);
    return {
      success: true,
      message: 'File processing started',
      data: result,
    };
  }

  // Admin endpoints
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all files (Admin only)' })
  @ApiResponse({ status: 200, description: 'Files retrieved successfully' })
  async getAllFiles(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('userId') userId?: string,
    @Query('type') type?: string,
  ) {
    const files = await this.uploadService.getAllFiles({
      page: page || 1,
      limit: limit || 20,
      userId,
      type,
    });
    return {
      success: true,
      data: files,
    };
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get upload statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getUploadStats() {
    const stats = await this.uploadService.getUploadStats();
    return {
      success: true,
      data: { stats },
    };
  }

  @Post('admin/cleanup')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cleanup unused files (Admin only)' })
  @ApiResponse({ status: 200, description: 'Cleanup completed successfully' })
  async cleanupFiles(@Body('days') days: number = 30) {
    const result = await this.uploadService.cleanupFiles(days);
    return {
      success: true,
      message: 'Cleanup completed successfully',
      data: result,
    };
  }
}