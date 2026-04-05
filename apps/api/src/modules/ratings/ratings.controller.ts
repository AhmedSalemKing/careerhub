import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Request,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Ratings')
@Controller('ratings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RatingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('course/:courseId')
  async rateCourse(
    @Param('courseId') courseId: string,
    @Request() req: any,
    @Body() body: { value: number; comment?: string },
  ) {
    const userId = req.user.sub || req.user.id;
    if (body.value < 1 || body.value > 5) {
      throw new BadRequestException('Rating must be 1-5');
    }
    const rating = await this.prisma.rating.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: { value: body.value, comment: body.comment },
      create: { userId, courseId, value: body.value, comment: body.comment },
    });
    return { success: true, data: rating };
  }

  @Get('course/:courseId')
  async getCourseRatings(@Param('courseId') courseId: string) {
    const ratings = await this.prisma.rating.findMany({
      where: { courseId },
      include: {
        user: { select: { profile: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const avg = ratings.length
      ? ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length
      : 0;
    return {
      success: true,
      data: {
        ratings,
        average: Math.round(avg * 10) / 10,
        count: ratings.length,
      },
    };
  }

  @Get('my/course/:courseId')
  async getMyRating(@Param('courseId') courseId: string, @Request() req: any) {
    const userId = req.user.sub || req.user.id;
    const rating = await this.prisma.rating.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    return { success: true, data: rating };
  }
}
