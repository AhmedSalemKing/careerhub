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
import { CareerService } from './career.service';
import { AssessmentService } from './assessment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Career')
@Controller('career')
export class CareerController {
  constructor(
    private readonly careerService: CareerService,
    private readonly assessmentService: AssessmentService,
  ) {}

  @Get('paths')
  @ApiOperation({ summary: 'Get all career paths' })
  @ApiResponse({ status: 200, description: 'Career paths retrieved successfully' })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar'], description: 'Response language' })
  async getCareerPaths(@Query('language') language?: string) {
    const careerPaths = await this.careerService.getCareerPaths(language);
    return {
      success: true,
      data: { careerPaths },
    };
  }

  @Get('paths/:slug')
  @ApiOperation({ summary: 'Get career path by slug' })
  @ApiResponse({ status: 200, description: 'Career path retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Career path not found' })
  @ApiParam({ name: 'slug', description: 'Career path slug' })
  async getCareerPathBySlug(
    @Param('slug') slug: string,
    @Query('language') language?: string,
  ) {
    const careerPath = await this.careerService.getCareerPathBySlug(slug, language);
    return {
      success: true,
      data: { careerPath },
    };
  }

  @Post('assessment/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start career assessment' })
  @ApiResponse({ status: 201, description: 'Assessment started successfully' })
  async startAssessment(
    @CurrentUser() user: User,
    @Body('careerPathId') careerPathId: string,
  ) {
    const assessment = await this.assessmentService.startAssessment(user.id, careerPathId);
    return {
      success: true,
      message: 'Assessment started successfully',
      data: { assessment },
    };
  }

  @Post('assessment/:assessmentId/question')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get next assessment question' })
  @ApiResponse({ status: 200, description: 'Question retrieved successfully' })
  @ApiParam({ name: 'assessmentId', description: 'Assessment ID' })
  async getNextQuestion(
    @CurrentUser() user: User,
    @Param('assessmentId') assessmentId: string,
    @Body('answer') answer?: string,
  ) {
    const result = await this.assessmentService.getNextQuestion(user.id, assessmentId, answer);
    return {
      success: true,
      data: result,
    };
  }

  @Post('assessment/:assessmentId/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete career assessment' })
  @ApiResponse({ status: 200, description: 'Assessment completed successfully' })
  @ApiParam({ name: 'assessmentId', description: 'Assessment ID' })
  async completeAssessment(
    @CurrentUser() user: User,
    @Param('assessmentId') assessmentId: string,
  ) {
    const result = await this.assessmentService.completeAssessment(user.id, assessmentId);
    return {
      success: true,
      message: 'Assessment completed successfully',
      data: result,
    };
  }

  @Get('assessment/:assessmentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get assessment details' })
  @ApiResponse({ status: 200, description: 'Assessment retrieved successfully' })
  @ApiParam({ name: 'assessmentId', description: 'Assessment ID' })
  async getAssessment(
    @CurrentUser() user: User,
    @Param('assessmentId') assessmentId: string,
  ) {
    const assessment = await this.assessmentService.getAssessment(user.id, assessmentId);
    return {
      success: true,
      data: { assessment },
    };
  }

  @Get('assessment/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user assessment history' })
  @ApiResponse({ status: 200, description: 'Assessment history retrieved successfully' })
  async getAssessmentHistory(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const history = await this.assessmentService.getAssessmentHistory(user.id, {
      page: page || 1,
      limit: limit || 10,
    });
    return {
      success: true,
      data: history,
    };
  }

  @Get('paths/:slug/courses')
  @ApiOperation({ summary: 'Get courses for a career path' })
  @ApiResponse({ status: 200, description: 'Courses retrieved successfully' })
  @ApiParam({ name: 'slug', description: 'Career path slug' })
  async getCareerPathCourses(
    @Param('slug') slug: string,
    @Query('language') language?: string,
    @Query('level') level?: string,
  ) {
    const courses = await this.careerService.getCareerPathCourses(slug, language, level);
    return {
      success: true,
      data: { courses },
    };
  }

  @Get('paths/:slug/statistics')
  @ApiOperation({ summary: 'Get career path statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiParam({ name: 'slug', description: 'Career path slug' })
  async getCareerPathStatistics(@Param('slug') slug: string) {
    const statistics = await this.careerService.getCareerPathStatistics(slug);
    return {
      success: true,
      data: { statistics },
    };
  }

  @Get('recommendations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get career path recommendations' })
  @ApiResponse({ status: 200, description: 'Recommendations retrieved successfully' })
  async getRecommendations(@CurrentUser() user: User) {
    const recommendations = await this.careerService.getRecommendations(user.id);
    return {
      success: true,
      data: { recommendations },
    };
  }

  @Get('skills')
  @ApiOperation({ summary: 'Get all skills' })
  @ApiResponse({ status: 200, description: 'Skills retrieved successfully' })
  async getSkills(@Query('search') search?: string) {
    const skills = await this.careerService.getSkills(search);
    return {
      success: true,
      data: { skills },
    };
  }

  @Get('market-insights')
  @ApiOperation({ summary: 'Get market insights' })
  @ApiResponse({ status: 200, description: 'Market insights retrieved successfully' })
  @ApiQuery({ name: 'country', required: false, description: 'Filter by country' })
  @ApiQuery({ name: 'careerPath', required: false, description: 'Filter by career path' })
  async getMarketInsights(
    @Query('country') country?: string,
    @Query('careerPath') careerPath?: string,
  ) {
    const insights = await this.careerService.getMarketInsights(country, careerPath);
    return {
      success: true,
      data: { insights },
    };
  }

  @Post('compare')
  @ApiOperation({ summary: 'Compare career paths' })
  @ApiResponse({ status: 200, description: 'Comparison completed successfully' })
  async compareCareerPaths(
    @Body('paths') paths: string[],
    @Query('language') language?: string,
  ) {
    const comparison = await this.careerService.compareCareerPaths(paths, language);
    return {
      success: true,
      data: { comparison },
    };
  }

  @Get('paths/:slug/roadmap')
  @ApiOperation({ summary: 'Get career path roadmap' })
  @ApiResponse({ status: 200, description: 'Roadmap retrieved successfully' })
  @ApiParam({ name: 'slug', description: 'Career path slug' })
  async getCareerPathRoadmap(
    @Param('slug') slug: string,
    @Query('language') language?: string,
  ) {
    const roadmap = await this.careerService.getCareerPathRoadmap(slug, language);
    return {
      success: true,
      data: { roadmap },
    };
  }
}
