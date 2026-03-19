import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) { }

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
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload image with processing' })
  @ApiResponse({ status: 201, description: 'Image uploaded and processed successfully' })
  async uploadImage(
    @CurrentUser() user: User,
    @UploadedFile() image: Express.Multer.File,
    @Body('resizeWidth') resizeWidth?: string,
    @Body('resizeHeight') resizeHeight?: string,
    @Body('quality') quality?: string,
    @Body('generateThumbnails') generateThumbnails?: string,
  ) {
    const result = await this.uploadService.uploadImage(user.id, image, {
      resizeWidth: resizeWidth ? parseInt(resizeWidth) : undefined,
      resizeHeight: resizeHeight ? parseInt(resizeHeight) : undefined,
      quality: quality ? parseInt(quality) : undefined,
      generateThumbnails: generateThumbnails === 'true',
    });
    return {
      success: true,
      message: 'Image uploaded and processed successfully',
      data: result,
    };
  }

  @Post('video')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('video'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload video file' })
  @ApiResponse({ status: 201, description: 'Video uploaded successfully' })
  async uploadVideo(
    @CurrentUser() user: User,
    @UploadedFile() video: Express.Multer.File,
    @Body('title') title?: string,
    @Body('description') description?: string,
  ) {
    const result = await this.uploadService.uploadVideo(user.id, video, {
      title,
      description,
    });
    return {
      success: true,
      message: 'Video uploaded successfully',
      data: result,
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

