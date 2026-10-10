import { Module } from '@nestjs/common';
import { QuizzesController, QuizzesInstructorController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';

@Module({
  imports: [],
  controllers: [QuizzesController, QuizzesInstructorController],
  providers: [QuizzesService],
  exports: [QuizzesService],
})
export class QuizzesModule {}