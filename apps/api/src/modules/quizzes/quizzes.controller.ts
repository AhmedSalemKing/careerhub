import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { ReorderQuestionsDto } from './dto/reorder-questions.dto';
import { SaveAnswerDto } from './dto/save-answer.dto';
import { GradeAttemptDto } from './dto/grade-attempt.dto';

@ApiTags('quizzes-student')
@Controller('quizzes')
@UseGuards(JwtAuthGuard)
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Get(['lesson/:lessonId/active'])
  async getActiveQuiz(@Param('lessonId') lessonId: string) {
    const data = await this.quizzesService.getActiveQuizForLesson(lessonId);
    return { success: true, data };
  }

  @Get(':id/start')
  async startQuiz(@Request() req: any, @Param('id') id: string) {
    const data = await this.quizzesService.startQuiz(req.user.sub, id);
    return { success: true, data };
  }

  @Post('attempts/:aid/answer')
  async saveAnswer(@Request() req: any, @Param('aid') aid: string, @Body() dto: SaveAnswerDto) {
    const data = await this.quizzesService.saveAnswer(req.user.sub, aid, dto);
    return { success: true, data };
  }

  @Post('attempts/:aid/submit')
  async submitQuiz(@Request() req: any, @Param('aid') aid: string) {
    const data = await this.quizzesService.submitQuiz(req.user.sub, aid);
    return { success: true, data };
  }

  @Get('attempts/:aid/mine')
  async getMyAttempt(@Request() req: any, @Param('aid') aid: string) {
    const data = await this.quizzesService.getMyAttempt(req.user.sub, aid);
    return { success: true, data };
  }
}

@ApiTags('quizzes-instructor')
@Controller('quizzes')
@UseGuards(JwtAuthGuard)
export class QuizzesInstructorController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  async createQuiz(@Request() req: any, @Body() dto: CreateQuizDto) {
    const data = await this.quizzesService.createQuiz(req.user.sub, dto);
    return { success: true, data };
  }

  @Get()
  async listQuizzes(@Request() req: any, @Query('courseId') courseId: string) {
    const data = await this.quizzesService.listQuizzesByCourse(courseId, req.user.sub);
    return { success: true, data };
  }

  @Get(':id')
  async getQuiz(@Request() req: any, @Param('id') id: string) {
    const data = await this.quizzesService.getQuizForInstructor(id, req.user.sub);
    return { success: true, data };
  }

  @Patch(':id')
  async updateQuiz(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateQuizDto) {
    const data = await this.quizzesService.updateQuiz(id, req.user.sub, dto);
    return { success: true, data };
  }

  @Delete(':id')
  async deleteQuiz(@Request() req: any, @Param('id') id: string) {
    const data = await this.quizzesService.deleteQuiz(id, req.user.sub);
    return { success: true, data };
  }

  @Post(':id/questions')
  async addQuestion(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: CreateQuestionDto,
  ) {
    const data = await this.quizzesService.addQuestion(id, req.user.sub, dto);
    return { success: true, data };
  }

  @Patch(':id/questions/:questionId')
  async updateQuestion(
    @Request() req: any,
    @Param('id') id: string,
    @Param('questionId') questionId: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    const data = await this.quizzesService.updateQuestion(id, questionId, req.user.sub, dto);
    return { success: true, data };
  }

  @Delete(':id/questions/:questionId')
  async deleteQuestion(
    @Request() req: any,
    @Param('id') id: string,
    @Param('questionId') questionId: string,
  ) {
    const data = await this.quizzesService.deleteQuestion(id, questionId, req.user.sub);
    return { success: true, data };
  }

  @Post(':id/reorder')
  async reorderQuestions(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: ReorderQuestionsDto,
  ) {
    const data = await this.quizzesService.reorderQuestions(id, req.user.sub, dto.order);
    return { success: true, data };
  }

  @Post(':id/publish')
  async publishQuiz(@Request() req: any, @Param('id') id: string) {
    const data = await this.quizzesService.publishQuiz(id, req.user.sub);
    return { success: true, data };
  }

  @Post(':id/unpublish')
  async unpublishQuiz(@Request() req: any, @Param('id') id: string) {
    const data = await this.quizzesService.unpublishQuiz(id, req.user.sub);
    return { success: true, data };
  }

  @Get(':id/attempts')
  async listAttempts(
    @Request() req: any,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const data = await this.quizzesService.listAttempts(
      id,
      req.user.sub,
      parseInt(page ?? '1', 10),
      parseInt(limit ?? '20', 10),
      status,
    );
    return { success: true, data };
  }

  @Get('attempts/:aid')
  async getAttempt(@Request() req: any, @Param('aid') aid: string) {
    const data = await this.quizzesService.getAttemptForInstructor(aid, req.user.sub);
    return { success: true, data };
  }

  @Post('attempts/:aid/grade')
  async gradeAttempt(@Request() req: any, @Param('aid') aid: string, @Body() dto: GradeAttemptDto) {
    const data = await this.quizzesService.gradeAttempt(aid, req.user.sub, dto);
    return { success: true, data };
  }
}