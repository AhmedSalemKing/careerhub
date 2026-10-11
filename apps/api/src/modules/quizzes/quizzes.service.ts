import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const MCQ = 'MCQ';
const SHORT_ANSWER = 'SHORT_ANSWER';
const FILE_UPLOAD = 'FILE_UPLOAD';
const GRACE_MS = 30000;

const CREATE_TABLES: string[] = [
  `CREATE TABLE IF NOT EXISTS "quiz_tests" (
    "id" TEXT PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "sectionId" TEXT,
    "lessonId" TEXT,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "description" TEXT,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "passingScore" INTEGER NOT NULL DEFAULT 60,
    "shuffleQuestions" BOOLEAN NOT NULL DEFAULT false,
    "shuffleChoices" BOOLEAN NOT NULL DEFAULT false,
    "allowRetake" BOOLEAN NOT NULL DEFAULT true,
    "retakeThreshold" INTEGER NOT NULL DEFAULT 50,
    "unlimitedRetakes" BOOLEAN NOT NULL DEFAULT false,
    "maxAttempts" INTEGER NOT NULL DEFAULT 1,
    "showResults" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "quiz_test_questions" (
    "id" TEXT PRIMARY KEY,
    "quizId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionImage" TEXT,
    "note" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "allowMultipleAnswers" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "quiz_test_choices" (
    "id" TEXT PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS "quiz_test_attempts" (
    "id" TEXT PRIMARY KEY,
    "quizId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3) NOT NULL,
    "timeSpentSeconds" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "autoScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "manualScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "teacherNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "quiz_test_answers" (
    "id" TEXT PRIMARY KEY,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedChoiceIds" TEXT[] NOT NULL DEFAULT '{}',
    "textAnswer" TEXT,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "autoGrade" DOUBLE PRECISION,
    "manualGrade" DOUBLE PRECISION,
    "feedback" TEXT,
    "gradedAt" TIMESTAMP(3),
    "gradedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("attemptId", "questionId")
  )`,
];

const CREATE_INDEXES: string[] = [
  `CREATE INDEX IF NOT EXISTS "quiz_tests_courseId_idx" ON "quiz_tests"("courseId")`,
  `CREATE INDEX IF NOT EXISTS "quiz_tests_lessonId_idx" ON "quiz_tests"("lessonId")`,
  `CREATE INDEX IF NOT EXISTS "quiz_tests_status_idx" ON "quiz_tests"("status")`,
  `CREATE INDEX IF NOT EXISTS "quiz_test_questions_quizId_idx" ON "quiz_test_questions"("quizId")`,
  `CREATE INDEX IF NOT EXISTS "quiz_test_choices_questionId_idx" ON "quiz_test_choices"("questionId")`,
  `CREATE INDEX IF NOT EXISTS "quiz_test_attempts_quizId_idx" ON "quiz_test_attempts"("quizId")`,
  `CREATE INDEX IF NOT EXISTS "quiz_test_attempts_userId_idx" ON "quiz_test_attempts"("userId")`,
  `CREATE INDEX IF NOT EXISTS "quiz_test_attempts_userId_quizId_idx" ON "quiz_test_attempts"("userId", "quizId")`,
  `CREATE INDEX IF NOT EXISTS "quiz_test_attempts_status_idx" ON "quiz_test_attempts"("status")`,
  `CREATE INDEX IF NOT EXISTS "quiz_test_answers_attemptId_idx" ON "quiz_test_answers"("attemptId")`,
  `CREATE INDEX IF NOT EXISTS "quiz_test_answers_questionId_idx" ON "quiz_test_answers"("questionId")`,
];

const MIGRATIONS: string[] = [
  `ALTER TABLE "quiz_tests" ADD COLUMN IF NOT EXISTS "retakeThreshold" INTEGER NOT NULL DEFAULT 50`,
  `ALTER TABLE "quiz_tests" ADD COLUMN IF NOT EXISTS "unlimitedRetakes" BOOLEAN NOT NULL DEFAULT false`,
  // Backfill the unique constraint required by saveAnswer's `upsert`.
  // Older deployments created quiz_test_answers via CREATE TABLE without it.
  `DELETE FROM "quiz_test_answers" a USING "quiz_test_answers" b
     WHERE a.ctid < b.ctid
       AND a."attemptId" = b."attemptId"
       AND a."questionId" = b."questionId"`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "quiz_test_answers_attemptId_questionId_key" ON "quiz_test_answers"("attemptId", "questionId")`,
];

interface GradeOutcome {
  autoScore: number;
  manualScore: number;
  totalScore: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  needsManual: boolean;
  autoByAnswer: Map<string, number>;
}

@Injectable()
export class QuizzesService implements OnModuleInit {
  private readonly logger = new Logger(QuizzesService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    for (const sql of CREATE_TABLES) {
      try {
        await this.prisma.$executeRawUnsafe(sql);
      } catch (e) {
        this.logger.warn(`Quiz table bootstrap failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    for (const sql of CREATE_INDEXES) {
      try {
        await this.prisma.$executeRawUnsafe(sql);
      } catch {
        // indexes are optional hardening
      }
    }
    for (const sql of MIGRATIONS) {
      try {
        await this.prisma.$executeRawUnsafe(sql);
      } catch (e) {
        this.logger.warn(`Quiz column migration failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    this.logger.log('Quiz tables ensured');
  }

  // ---------------------------------------------------------------------------
  // Instructor helpers
  // ---------------------------------------------------------------------------

  private async ensureOwnsCourse(instructorId: string, courseId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, instructorId },
      select: { id: true },
    });
    if (!course) {
      throw new NotFoundException('Course not found or not yours');
    }
    return course;
  }

  private async getOwnedQuiz(instructorId: string, quizId: string) {
    const quiz = await this.prisma.quiz.findFirst({
      where: { id: quizId, course: { instructorId } },
      include: {
        course: { select: { id: true, instructorId: true } },
        lesson: { select: { id: true, title: true, titleAr: true } },
        section: true,
      },
    });
    if (!quiz) {
      throw new NotFoundException('Quiz not found or not yours');
    }
    return quiz;
  }

  private async ensureLessonInCourse(lessonId: string, courseId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: {
        id: lessonId,
        OR: [{ section: { courseId } }, { module: { courseId } }],
      },
      select: { id: true },
    });
    if (!lesson) {
      throw new BadRequestException('Lesson does not belong to this course');
    }
  }

  private async ensureSectionInCourse(sectionId: string, courseId: string) {
    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, courseId },
      select: { id: true },
    });
    if (!section) {
      throw new BadRequestException('Section does not belong to this course');
    }
  }

  private validateMcq(question: { allowMultipleAnswers?: boolean; choices?: { isCorrect?: boolean }[] }) {
    const choices = question.choices ?? [];
    if (choices.length < 2) {
      throw new BadRequestException('MCQ questions need at least 2 choices');
    }
    const correct = choices.filter((c) => c.isCorrect);
    if (correct.length < 1) {
      throw new BadRequestException('MCQ questions need at least one correct answer');
    }
    if (question.allowMultipleAnswers === false && correct.length !== 1) {
      throw new BadRequestException('Single-answer questions need exactly one correct choice');
    }
  }

  private async validateQuizReady(quizId: string) {
    const questions = await this.prisma.quizQuestion.findMany({
      where: { quizId },
      orderBy: { order: 'asc' },
      include: { choices: true },
    });

    if (questions.length === 0) {
      throw new BadRequestException('Add at least one question before publishing');
    }

    let totalPoints = 0;
    for (const q of questions) {
      totalPoints += q.points;
      if (q.type === MCQ) {
        this.validateMcq({
          allowMultipleAnswers: q.allowMultipleAnswers,
          choices: q.choices,
        });
      }
    }

    if (totalPoints <= 0) {
      throw new BadRequestException('Total question points must be greater than zero');
    }

    return questions;
  }

  // ---------------------------------------------------------------------------
  // Instructor endpoints
  // ---------------------------------------------------------------------------

  async createQuiz(instructorId: string, dto: any) {
    await this.ensureOwnsCourse(instructorId, dto.courseId);

    if (dto.lessonId) {
      await this.ensureLessonInCourse(dto.lessonId, dto.courseId);
    }
    if (dto.sectionId) {
      await this.ensureSectionInCourse(dto.sectionId, dto.courseId);
    }

    const quiz = await this.prisma.quiz.create({
      data: {
        courseId: dto.courseId,
        sectionId: dto.sectionId ?? null,
        lessonId: dto.lessonId ?? null,
        title: dto.title,
        titleAr: dto.titleAr ?? null,
        description: dto.description ?? null,
        durationMinutes: dto.durationMinutes ?? 30,
        passingScore: dto.passingScore ?? 60,
        shuffleQuestions: dto.shuffleQuestions ?? false,
        shuffleChoices: dto.shuffleChoices ?? false,
        allowRetake: dto.allowRetake ?? true,
        retakeThreshold: dto.retakeThreshold ?? 50,
        unlimitedRetakes: dto.unlimitedRetakes ?? false,
        maxAttempts: dto.maxAttempts ?? 1,
        showResults: dto.showResults ?? true,
        status: 'DRAFT',
      },
    });
    return quiz;
  }

  async getQuizForInstructor(quizId: string, instructorId: string) {
    const quiz = await this.getOwnedQuiz(instructorId, quizId);
    const questions = await this.prisma.quizQuestion.findMany({
      where: { quizId },
      orderBy: { order: 'asc' },
      include: { choices: { orderBy: { order: 'asc' } } },
    });
    return { ...quiz, questions };
  }

  async updateQuiz(quizId: string, instructorId: string, dto: any) {
    const quiz = await this.getOwnedQuiz(instructorId, quizId);

    if (dto.sectionId !== undefined && dto.sectionId) {
      await this.ensureSectionInCourse(dto.sectionId, quiz.courseId);
    }
    if (dto.lessonId && dto.lessonId !== undefined) {
      await this.ensureLessonInCourse(dto.lessonId, quiz.courseId);
    }

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.titleAr !== undefined) data.titleAr = dto.titleAr;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.durationMinutes !== undefined) data.durationMinutes = dto.durationMinutes;
    if (dto.passingScore !== undefined) data.passingScore = dto.passingScore;
    if (dto.shuffleQuestions !== undefined) data.shuffleQuestions = dto.shuffleQuestions;
    if (dto.shuffleChoices !== undefined) data.shuffleChoices = dto.shuffleChoices;
    if (dto.allowRetake !== undefined) data.allowRetake = dto.allowRetake;
    if (dto.retakeThreshold !== undefined) data.retakeThreshold = dto.retakeThreshold;
    if (dto.unlimitedRetakes !== undefined) data.unlimitedRetakes = dto.unlimitedRetakes;
    if (dto.maxAttempts !== undefined) data.maxAttempts = dto.maxAttempts;
    if (dto.showResults !== undefined) data.showResults = dto.showResults;
    if (dto.lessonId !== undefined) data.lessonId = dto.lessonId || null;
    if (dto.sectionId !== undefined) data.sectionId = dto.sectionId || null;

    return this.prisma.quiz.update({
      where: { id: quiz.id },
      data,
    });
  }

  async deleteQuiz(quizId: string, instructorId: string) {
    const quiz = await this.getOwnedQuiz(instructorId, quizId);
    await this.prisma.quiz.delete({ where: { id: quiz.id } });
    return { success: true };
  }

  async listQuizzesByCourse(courseId: string, instructorId: string) {
    await this.ensureOwnsCourse(instructorId, courseId);
    const quizzes = await this.prisma.quiz.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { questions: true, attempts: true } },
        lesson: { select: { id: true, title: true, titleAr: true } },
      },
    });
    return quizzes.map((q) => ({
      id: q.id,
      title: q.title,
      titleAr: q.titleAr,
      status: q.status,
      durationMinutes: q.durationMinutes,
      passingScore: q.passingScore,
      lessonTitleAr: q.lesson?.titleAr ?? q.lesson?.title ?? null,
      _count: q._count,
    }));
  }

  async addQuestion(quizId: string, instructorId: string, dto: any) {
    const quiz = await this.getOwnedQuiz(instructorId, quizId);

    if (dto.type === MCQ) {
      this.validateMcq({
        allowMultipleAnswers: dto.allowMultipleAnswers ?? false,
        choices: dto.choices ?? [],
      });
    }

    const maxOrder = await this.prisma.quizQuestion.aggregate({
      where: { quizId: quiz.id },
      _max: { order: true },
    });
    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    const question = await this.prisma.quizQuestion.create({
      data: {
        quizId: quiz.id,
        order: nextOrder,
        type: dto.type,
        questionText: dto.questionText,
        questionImage: dto.questionImage ?? null,
        note: dto.note ?? null,
        points: dto.points ?? 1,
        allowMultipleAnswers: dto.allowMultipleAnswers ?? false,
        choices:
          dto.type === MCQ
            ? {
                create: (dto.choices ?? []).map((c: any, i: number) => ({
                  text: c.text,
                  isCorrect: c.isCorrect ?? false,
                  order: c.order ?? i,
                })),
              }
            : undefined,
      },
      include: { choices: { orderBy: { order: 'asc' } } },
    });

    return question;
  }

  async updateQuestion(quizId: string, questionId: string, instructorId: string, dto: any) {
    await this.getOwnedQuiz(instructorId, quizId);

    const existing = await this.prisma.quizQuestion.findFirst({
      where: { id: questionId, quizId },
      include: { choices: true },
    });
    if (!existing) {
      throw new NotFoundException('Question not found');
    }

    const data: Record<string, unknown> = {};
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.questionText !== undefined) data.questionText = dto.questionText;
    if (dto.questionImage !== undefined) data.questionImage = dto.questionImage;
    if (dto.note !== undefined) data.note = dto.note;
    if (dto.points !== undefined) data.points = dto.points;

    const targetType = dto.type ?? existing.type;
    let targetAllowMultiple = dto.allowMultipleAnswers ?? existing.allowMultipleAnswers;
    const replaceChoices = dto.choices !== undefined;

    if (targetType === MCQ) {
      const effectiveChoices = replaceChoices ? dto.choices : existing.choices;
      this.validateMcq({ allowMultipleAnswers: targetAllowMultiple, choices: effectiveChoices });
    }

    return this.prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = { ...data };

      if (targetType === MCQ && dto.allowMultipleAnswers !== undefined) {
        updateData.allowMultipleAnswers = dto.allowMultipleAnswers;
      }

      if (targetType !== MCQ) {
        updateData.allowMultipleAnswers = false;
        await tx.quizChoice.deleteMany({ where: { questionId: existing.id } });
      } else if (replaceChoices) {
        await tx.quizChoice.deleteMany({ where: { questionId: existing.id } });
        if (dto.choices.length > 0) {
          await tx.quizChoice.createMany({
            data: dto.choices.map((c: any, i: number) => ({
              questionId: existing.id,
              text: c.text,
              isCorrect: c.isCorrect ?? false,
              order: c.order ?? i,
            })),
          });
        }
      }

      return tx.quizQuestion.update({
        where: { id: existing.id },
        data: updateData,
        include: { choices: { orderBy: { order: 'asc' } } },
      });
    });
  }

  async deleteQuestion(quizId: string, questionId: string, instructorId: string) {
    await this.getOwnedQuiz(instructorId, quizId);

    const existing = await this.prisma.quizQuestion.findFirst({
      where: { id: questionId, quizId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Question not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.quizQuestion.delete({ where: { id: existing.id } });
      const remaining = await tx.quizQuestion.findMany({
        where: { quizId },
        orderBy: { order: 'asc' },
        select: { id: true, order: true },
      });
      for (let i = 0; i < remaining.length; i++) {
        if (remaining[i].order !== i) {
          await tx.quizQuestion.update({
            where: { id: remaining[i].id },
            data: { order: i },
          });
        }
      }
    });

    return { success: true };
  }

  async reorderQuestions(quizId: string, instructorId: string, ids: string[]) {
    await this.getOwnedQuiz(instructorId, quizId);

    const existing = await this.prisma.quizQuestion.findMany({
      where: { quizId },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((q) => q.id));

    if (ids.length !== existingIds.size || ids.some((id) => !existingIds.has(id))) {
      throw new BadRequestException('Reorder list must contain every question exactly once');
    }

    await this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < ids.length; i++) {
        await tx.quizQuestion.update({
          where: { id: ids[i] },
          data: { order: i },
        });
      }
    });

    return { success: true };
  }

  async publishQuiz(quizId: string, instructorId: string) {
    await this.getOwnedQuiz(instructorId, quizId);
    await this.validateQuizReady(quizId);
    return this.prisma.quiz.update({
      where: { id: quizId },
      data: { status: 'PUBLISHED' },
    });
  }

  async unpublishQuiz(quizId: string, instructorId: string) {
    await this.getOwnedQuiz(instructorId, quizId);
    return this.prisma.quiz.update({
      where: { id: quizId },
      data: { status: 'DRAFT' },
    });
  }

  async listAttempts(quizId: string, instructorId: string, page: number, limit: number, status?: string) {
    await this.getOwnedQuiz(instructorId, quizId);

    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 20;
    const skip = (safePage - 1) * safeLimit;

    const where: Record<string, unknown> = { quizId };
    if (status && status !== 'ALL') where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.quizAttempt.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip,
        take: safeLimit,
        select: {
          id: true,
          status: true,
          startedAt: true,
          submittedAt: true,
          autoScore: true,
          manualScore: true,
          totalScore: true,
          percentage: true,
          passed: true,
          timeSpentSeconds: true,
          user: {
            select: {
              id: true,
              email: true,
              profile: { select: { firstName: true, lastName: true, avatar: true } },
            },
          },
        },
      }),
      this.prisma.quizAttempt.count({ where }),
    ]);

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async getAttemptForInstructor(attemptId: string, instructorId: string) {
    const attempt = await this.prisma.quizAttempt.findFirst({
      where: { id: attemptId, quiz: { course: { instructorId } } },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstName: true, lastName: true, avatar: true } },
          },
        },
        answers: true,
        quiz: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
              include: { choices: { orderBy: { order: 'asc' } } },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    return this.buildInstructorView(attempt);
  }

  private buildInstructorView(attempt: any) {
    const answerMap = new Map<string, any>(attempt.answers.map((a: any) => [a.questionId, a]));
    const questions = attempt.quiz.questions.map((q: any) => {
      const answer = answerMap.get(q.id) ?? null;
      return {
        ...q,
        answer: answer
          ? {
              id: answer.id,
              selectedChoiceIds: answer.selectedChoiceIds,
              textAnswer: answer.textAnswer,
              fileUrl: answer.fileUrl,
              fileName: answer.fileName,
              autoGrade: answer.autoGrade,
              manualGrade: answer.manualGrade,
              feedback: answer.feedback,
              gradedAt: answer.gradedAt,
            }
          : null,
      };
    });

    return {
      id: attempt.id,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      endsAt: attempt.endsAt,
      timeSpentSeconds: attempt.timeSpentSeconds,
      autoScore: attempt.autoScore,
      manualScore: attempt.manualScore,
      totalScore: attempt.totalScore,
      maxScore: attempt.maxScore,
      percentage: attempt.percentage,
      passed: attempt.passed,
      teacherNotes: attempt.teacherNotes,
      student: attempt.user,
      quiz: {
        id: attempt.quiz.id,
        title: attempt.quiz.title,
        titleAr: attempt.quiz.titleAr,
        passingScore: attempt.quiz.passingScore,
        showResults: attempt.quiz.showResults,
        maxAttempts: attempt.quiz.maxAttempts,
      },
      questions,
    };
  }

  async gradeAttempt(attemptId: string, instructorId: string, dto: any) {
    const attempt = await this.prisma.quizAttempt.findFirst({
      where: { id: attemptId, quiz: { course: { instructorId } } },
      include: {
        answers: true,
        quiz: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
              include: { choices: true },
            },
          },
        },
      },
    });
    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    const gradingItems = dto.answers ?? [];
    const answerIdSet = new Set(attempt.answers.map((a: any) => a.id));
    for (const item of gradingItems) {
      if (!answerIdSet.has(item.answerId)) {
        throw new BadRequestException(`Answer ${item.answerId} does not belong to this attempt`);
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      for (const item of gradingItems) {
        await tx.quizAnswer.update({
          where: { id: item.answerId },
          data: {
            manualGrade: item.manualGrade,
            feedback: item.feedback ?? null,
            gradedAt: new Date(),
            gradedBy: instructorId,
          },
        });
      }

      const freshAnswers = await tx.quizAnswer.findMany({ where: { attemptId: attempt.id } });
      const grade = this.computeGrading(attempt.quiz, freshAnswers);
      for (const [answerId, autoGrade] of grade.autoByAnswer) {
        await tx.quizAnswer.update({
          where: { id: answerId },
          data: { autoGrade },
        });
      }

      return tx.quizAttempt.update({
        where: { id: attempt.id },
        data: {
          manualScore: grade.manualScore,
          autoScore: grade.autoScore,
          totalScore: grade.totalScore,
          maxScore: grade.maxScore,
          percentage: grade.percentage,
          passed: grade.passed,
          status: 'GRADED',
          teacherNotes: dto.teacherNotes ?? attempt.teacherNotes ?? null,
        },
      });
    });

    return this.getAttemptForInstructor(attemptId, instructorId);
  }

  // ---------------------------------------------------------------------------
  // Student endpoints
  // ---------------------------------------------------------------------------

  private canRetake(
    quiz: { allowRetake: boolean; maxAttempts: number; unlimitedRetakes: boolean; retakeThreshold: number },
    bestAttempt: { passed: boolean; status: string; percentage: number } | null,
    attemptCount: number,
  ): boolean {
    if (!quiz.allowRetake) return false;
    if (!bestAttempt) return true;
    if (bestAttempt.passed) return false;
    if (bestAttempt.status !== 'GRADED') return false;
    if (quiz.unlimitedRetakes) return bestAttempt.percentage < quiz.retakeThreshold;
    if (attemptCount >= quiz.maxAttempts) return false;
    return bestAttempt.percentage < quiz.retakeThreshold;
  }

  private attemptsRemaining(
    quiz: { unlimitedRetakes: boolean; maxAttempts: number },
    attemptCount: number,
  ): number | null {
    if (quiz.unlimitedRetakes) return null;
    return Math.max(0, quiz.maxAttempts - attemptCount);
  }

  async getActiveQuizForLesson(lessonId: string, userId?: string) {
    const quiz = await this.prisma.quiz.findFirst({
      where: { lessonId, status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        titleAr: true,
        durationMinutes: true,
        passingScore: true,
        allowRetake: true,
        retakeThreshold: true,
        unlimitedRetakes: true,
        maxAttempts: true,
        _count: { select: { questions: true } },
      },
    });
    if (!quiz) return null;

    const attempts = userId
      ? await this.prisma.quizAttempt.findMany({
          where: { quizId: quiz.id, userId },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            percentage: true,
            passed: true,
            startedAt: true,
            submittedAt: true,
          },
        })
      : [];

    const attemptCount = attempts.length;
    const graded = attempts.filter((a) => a.status === 'GRADED');
    const bestAttempt = graded.length
      ? graded.slice().sort((a, b) => b.percentage - a.percentage)[0]
      : null;
    const lastAttempt = attempts[0] ?? null;

    return {
      id: quiz.id,
      title: quiz.title,
      titleAr: quiz.titleAr,
      durationMinutes: quiz.durationMinutes,
      passingScore: quiz.passingScore,
      allowRetake: quiz.allowRetake,
      retakeThreshold: quiz.retakeThreshold,
      unlimitedRetakes: quiz.unlimitedRetakes,
      maxAttempts: quiz.maxAttempts,
      _count: quiz._count,
      attemptCount,
      attemptsRemaining: this.attemptsRemaining(quiz, attemptCount),
      canRetake: this.canRetake(quiz, bestAttempt, attemptCount),
      bestAttempt,
      lastAttempt,
    };
  }

  async getStudentGrades(
    userId: string,
    courseId?: string,
    page = 1,
    limit = 50,
  ) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId, ...(courseId ? { courseId } : {}) },
      select: { courseId: true },
    });
    const courseIds = enrollments.map((e) => e.courseId);

    if (courseIds.length === 0) {
      return {
        summary: { total: 0, passed: 0, failed: 0, pending: 0, averageScore: 0 },
        courses: [],
      };
    }

    const quizzes = await this.prisma.quiz.findMany({
      where: {
        courseId: courseId ? courseId : { in: courseIds },
        status: 'PUBLISHED',
      },
      include: {
        course: { select: { id: true, titleEn: true, titleAr: true } },
        lesson: { select: { id: true, title: true, titleAr: true } },
        questions: { select: { id: true, points: true } },
        attempts: {
          where: { userId },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, status: true, percentage: true, passed: true,
            startedAt: true, submittedAt: true,
          },
        },
      },
    });

    const items = quizzes.map((q) => {
      const attemptCount = q.attempts.length;
      const graded = q.attempts.filter((a) => a.status === 'GRADED');
      const bestAttempt = graded.length
        ? graded.slice().sort((a, b) => b.percentage - a.percentage)[0]
        : null;
      const lastAttempt = q.attempts[0] ?? null;

      return {
        quizId: q.id,
        quizTitle: q.title,
        courseId: q.courseId,
        courseTitle: q.course.titleAr ?? q.course.titleEn,
        lessonTitle: q.lesson?.titleAr ?? q.lesson?.title ?? null,
        passingScore: q.passingScore,
        durationMinutes: q.durationMinutes,
        attemptCount,
        attemptsRemaining: this.attemptsRemaining(q as any, attemptCount),
        canRetake: this.canRetake(q as any, bestAttempt as any, attemptCount),
        bestAttempt,
        lastAttempt,
      };
    });

    const graded = items.filter((i) => i.bestAttempt);
    const passed = graded.filter((i) => i.bestAttempt!.passed).length;
    const failed = graded.length - passed;
    const pending = items.filter((i) => i.lastAttempt?.status === 'SUBMITTED').length;
    const avg = graded.length
      ? graded.reduce((s, i) => s + (i.bestAttempt!.percentage ?? 0), 0) / graded.length
      : 0;

    const grouped: Record<string, { courseId: string; courseTitle: string; quizzes: any[] }> = {};
    for (const it of items) {
      if (!grouped[it.courseId]) {
        grouped[it.courseId] = { courseId: it.courseId, courseTitle: it.courseTitle, quizzes: [] };
      }
      grouped[it.courseId].quizzes.push(it);
    }

    const allCourses = Object.values(grouped);
    const start = (page - 1) * limit;
    const paged = allCourses.slice(start, start + limit);

    return {
      summary: {
        total: items.length,
        passed,
        failed,
        pending,
        averageScore: Math.round(avg),
      },
      courses: paged,
    };
  }

  private toStudentSnapshot(quiz: any, shuffleQuestions: boolean, shuffleChoices: boolean) {
    let questions = [...quiz.questions];
    if (shuffleQuestions) {
      questions = questions.sort(() => Math.random() - 0.5);
    }
    return {
      id: quiz.id,
      title: quiz.title,
      titleAr: quiz.titleAr,
      courseId: quiz.courseId,
      durationMinutes: quiz.durationMinutes,
      passingScore: quiz.passingScore,
      allowRetake: quiz.allowRetake,
      maxAttempts: quiz.maxAttempts,
      showResults: quiz.showResults,
      questions: questions.map((q: any) => {
        let choices = q.choices ?? [];
        if (shuffleChoices && choices.length) {
          choices = [...choices].sort(() => Math.random() - 0.5);
        }
        return {
          id: q.id,
          order: q.order,
          type: q.type,
          questionText: q.questionText,
          questionImage: q.questionImage ?? null,
          note: q.note ?? null,
          points: q.points,
          allowMultipleAnswers: q.allowMultipleAnswers,
          choices: choices.map((c: any) => ({ id: c.id, text: c.text, order: c.order })),
        };
      }),
    };
  }

  async startQuiz(userId: string, quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: { choices: { orderBy: { order: 'asc' } } },
        },
      },
    });

    if (!quiz || quiz.status !== 'PUBLISHED') {
      throw new NotFoundException('Quiz not found');
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: quiz.courseId } },
      select: { id: true },
    });
    if (!enrollment) {
      throw new ForbiddenException('You must be enrolled in this course to take the quiz');
    }

    const userAttempts = await this.prisma.quizAttempt.findMany({
      where: { quizId, userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        percentage: true,
        passed: true,
        endsAt: true,
        startedAt: true,
      },
    });
    const attemptCount = userAttempts.length;

    const inProgress = userAttempts.find((a) => a.status === 'IN_PROGRESS');
    if (inProgress) {
      return {
        attemptId: inProgress.id,
        endsAt: inProgress.endsAt,
        startedAt: inProgress.startedAt,
        resume: true,
        quiz: this.toStudentSnapshot(quiz, quiz.shuffleQuestions, quiz.shuffleChoices),
      };
    }

    const graded = userAttempts.filter((a) => a.status === 'GRADED');
    const bestAttempt = graded.length
      ? graded.slice().sort((a, b) => b.percentage - a.percentage)[0]
      : null;

    if (!this.canRetake(quiz as any, bestAttempt as any, attemptCount)) {
      const reason = !bestAttempt ? 'NOT_ALLOWED'
        : bestAttempt.passed ? 'PASSED'
        : bestAttempt.status === 'SUBMITTED' ? 'AWAITING_REVIEW'
        : bestAttempt.percentage >= quiz.retakeThreshold ? 'ABOVE_THRESHOLD'
        : attemptCount >= quiz.maxAttempts ? 'BELOW_MAX_ATTEMPTS'
        : 'NOT_ALLOWED';
      throw new ForbiddenException({ code: 'RETAKE_NOT_ALLOWED', reason });
    }

    const endsAt = new Date(Date.now() + quiz.durationMinutes * 60 * 1000);
    const attempt = await this.prisma.quizAttempt.create({
      data: {
        quizId,
        userId,
        endsAt,
        status: 'IN_PROGRESS',
      },
    });

    return {
      attemptId: attempt.id,
      endsAt,
      startedAt: attempt.startedAt,
      resume: false,
      quiz: this.toStudentSnapshot(quiz, quiz.shuffleQuestions, quiz.shuffleChoices),
    };
  }

  private async getOwnedAttempt(userId: string, attemptId: string) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: true,
        quiz: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
              include: { choices: { orderBy: { order: 'asc' } } },
            },
          },
        },
      },
    });
    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }
    if (attempt.userId !== userId) {
      throw new ForbiddenException('Not your attempt');
    }
    return attempt;
  }

  async saveAnswer(userId: string, attemptId: string, dto: any) {
    const attempt = await this.getOwnedAttempt(userId, attemptId);

    if (attempt.status !== 'IN_PROGRESS') {
      throw new ConflictException({ code: 'ATTEMPT_NOT_ACTIVE', status: attempt.status });
    }

    const graceEndsAt = new Date(new Date(attempt.endsAt).getTime() + GRACE_MS);
    if (Date.now() > graceEndsAt.getTime()) {
      throw new ForbiddenException({ code: 'LATE', message: 'LATE' });
    }

    const question = await this.prisma.quizQuestion.findFirst({
      where: { id: dto.questionId, quizId: attempt.quizId },
      include: { choices: { select: { id: true } } },
    });
    if (!question) {
      throw new BadRequestException('Question does not belong to this quiz');
    }

    if (question.type === MCQ && dto.selectedChoiceIds !== undefined) {
      const validIds = new Set(question.choices.map((c: any) => c.id));
      for (const id of dto.selectedChoiceIds) {
        if (!validIds.has(id)) {
          throw new BadRequestException('Selected choice does not belong to this question');
        }
      }
    }

    await this.prisma.quizAnswer.upsert({
      where: { attemptId_questionId: { attemptId, questionId: dto.questionId } },
      create: {
        attemptId,
        questionId: dto.questionId,
        selectedChoiceIds: dto.selectedChoiceIds ?? [],
        textAnswer: dto.textAnswer ?? null,
        fileUrl: dto.fileUrl ?? null,
        fileName: dto.fileName ?? null,
      },
      update: {
        selectedChoiceIds: dto.selectedChoiceIds ?? [],
        textAnswer: dto.textAnswer ?? null,
        fileUrl: dto.fileUrl ?? null,
        fileName: dto.fileName ?? null,
      },
    });

    return { ok: true };
  }

  private arraysEqualIds(a: string[], b: string[]) {
    if (a.length !== b.length) return false;
    const x = [...a].sort();
    const y = [...b].sort();
    return x.every((v, i) => v === y[i]);
  }

  private computeGrading(quiz: any, answers: any[]): GradeOutcome {
    let autoScore = 0;
    let maxScore = 0;
    let needsManual = false;

    const byQuestion = new Map(answers.map((a: any) => [a.questionId, a]));
    const autoByAnswer = new Map<string, number>();

    for (const q of quiz.questions) {
      maxScore += q.points;
      const answer = byQuestion.get(q.id);

      if (q.type === MCQ) {
        if (!answer) continue;
        const correctIds = q.choices.filter((c: any) => c.isCorrect).map((c: any) => c.id);
        const selected = answer.selectedChoiceIds ?? [];
        const isExactMatch =
          correctIds.length > 0 &&
          selected.length === correctIds.length &&
          this.arraysEqualIds(correctIds, selected);
        const grade = isExactMatch ? q.points : 0;
        autoByAnswer.set(answer.id, grade);
        autoScore += grade;
      } else if (!answer || answer.manualGrade == null) {
        needsManual = true;
      }
    }

    let manualScore = 0;
    for (const a of answers) {
      manualScore += a.manualGrade ?? 0;
    }

    const totalScore = autoScore + manualScore;
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const passed = percentage >= quiz.passingScore;

    return { autoScore, manualScore, totalScore, maxScore, percentage, passed, needsManual, autoByAnswer };
  }

  async submitQuiz(userId: string, attemptId: string) {
    const attempt = await this.getOwnedAttempt(userId, attemptId);

    if (attempt.status !== 'IN_PROGRESS') {
      throw new ConflictException({ code: 'ATTEMPT_NOT_ACTIVE', status: attempt.status });
    }

    const expired = Date.now() > new Date(attempt.endsAt).getTime();

    const submittedAt = new Date();
    const timeSpentSeconds = Math.max(
      0,
      Math.floor((submittedAt.getTime() - new Date(attempt.startedAt).getTime()) / 1000),
    );

    const existingAnswers = await this.prisma.quizAnswer.findMany({ where: { attemptId: attempt.id } });

    const isAnswered = (a: any) => {
      if (!a) return false;
      if (Array.isArray(a.selectedChoiceIds) && a.selectedChoiceIds.length > 0) return true;
      if (typeof a.textAnswer === 'string' && a.textAnswer.trim().length > 0) return true;
      if (typeof a.fileUrl === 'string' && a.fileUrl.length > 0) return true;
      return false;
    };

    const answeredByQuestion = new Map(existingAnswers.map((a: any) => [a.questionId, a]));
    const missing = attempt.quiz.questions
      .filter((q: any) => !isAnswered(answeredByQuestion.get(q.id)))
      .map((q: any) => q.id);

    // Manual submits must answer every question. Auto (timeout) submits bypass so
    // an expired attempt can still be finalized instead of being trapped.
    if (!expired && missing.length > 0) {
      throw new BadRequestException({
        code: 'MISSING_ANSWERS',
        missing,
        message: 'MISSING_ANSWERS',
      });
    }

    let saved: any;
    await this.prisma.$transaction(async (tx) => {
      const freshAnswers = await tx.quizAnswer.findMany({ where: { attemptId: attempt.id } });
      const grade = this.computeGrading(attempt.quiz, freshAnswers);
      for (const [answerId, autoGrade] of grade.autoByAnswer) {
        await tx.quizAnswer.update({
          where: { id: answerId },
          data: { autoGrade },
        });
      }

      saved = await tx.quizAttempt.update({
        where: { id: attempt.id },
        data: {
          submittedAt,
          timeSpentSeconds,
          autoScore: grade.autoScore,
          manualScore: grade.manualScore,
          totalScore: grade.totalScore,
          maxScore: grade.maxScore,
          percentage: grade.percentage,
          passed: grade.passed,
          status: grade.needsManual ? 'SUBMITTED' : 'GRADED',
        },
        include: {
          answers: true,
          quiz: {
            include: {
              questions: {
                orderBy: { order: 'asc' },
                include: { choices: { orderBy: { order: 'asc' } } },
              },
            },
          },
        },
      });
    });

    return this.buildStudentResult(saved, userId);
  }

  async getMyAttempt(userId: string, attemptId: string) {
    const attempt = await this.getOwnedAttempt(userId, attemptId);
    return this.buildStudentResult(attempt, userId);
  }

  private async buildStudentResult(attempt: any, userId: string) {
    const quiz = attempt.quiz;
    const showResults = quiz.showResults;
    const finished = attempt.status === 'GRADED' || attempt.status === 'SUBMITTED';
    const answerMap = new Map<string, any>((attempt.answers ?? []).map((a: any) => [a.questionId, a]));

    const userAttempts = await this.prisma.quizAttempt.findMany({
      where: { quizId: quiz.id, userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true, percentage: true, passed: true },
    });
    const attemptCount = userAttempts.length;
    const gradedAttempts = userAttempts.filter((a) => a.status === 'GRADED');
    const bestAttempt = gradedAttempts.length
      ? gradedAttempts.slice().sort((a, b) => b.percentage - a.percentage)[0]
      : null;
    const canRetake = this.canRetake(quiz, bestAttempt, attemptCount);
    const attemptsRemaining = this.attemptsRemaining(quiz, attemptCount);

    return {
      id: attempt.id,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      endsAt: attempt.endsAt,
      timeSpentSeconds: attempt.timeSpentSeconds,
      awaitingReview: attempt.status === 'SUBMITTED',
      canRetake,
      attemptsRemaining,
      attemptCount,
      scores: {
        autoScore: attempt.autoScore,
        manualScore: attempt.manualScore,
        totalScore: attempt.totalScore,
        maxScore: attempt.maxScore,
        percentage: attempt.percentage,
        passed: attempt.passed,
      },
      quiz: {
        id: quiz.id,
        title: quiz.title,
        titleAr: quiz.titleAr,
        durationMinutes: quiz.durationMinutes,
        passingScore: quiz.passingScore,
        showResults,
        allowRetake: quiz.allowRetake,
        maxAttempts: quiz.maxAttempts,
      },
      teacherNotes: attempt.teacherNotes ?? null,
      questions: quiz.questions.map((q: any) => {
        const answer = answerMap.get(q.id) ?? null;

        const questionView: Record<string, unknown> = {
          id: q.id,
          order: q.order,
          type: q.type,
          questionText: q.questionText,
          questionImage: q.questionImage ?? null,
          note: q.note ?? null,
          points: q.points,
          allowMultipleAnswers: q.allowMultipleAnswers,
        };

        if (q.type === MCQ) {
          questionView.choices = q.choices.map((c: any) => {
            const choiceView: Record<string, unknown> = { id: c.id, text: c.text, order: c.order };
            if (showResults && finished) {
              choiceView.isCorrect = c.isCorrect;
            }
            return choiceView;
          });
        }

        const revealGrades = attempt.status !== 'IN_PROGRESS';

        questionView.answer = answer
          ? {
              selectedChoiceIds: answer.selectedChoiceIds,
              textAnswer: answer.textAnswer,
              fileUrl: answer.fileUrl,
              fileName: answer.fileName,
              autoGrade: revealGrades ? answer.autoGrade : undefined,
              manualGrade: revealGrades ? answer.manualGrade : undefined,
              feedback: answer.feedback ?? null,
            }
          : null;

        return questionView;
      }),
    };
  }
}