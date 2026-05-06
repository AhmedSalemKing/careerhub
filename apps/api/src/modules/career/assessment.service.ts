import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CareerAssessment, AssessmentQuestion, User } from '@prisma/client';

@Injectable()
export class AssessmentService {
  private readonly logger = new Logger(AssessmentService.name);

  constructor(private prisma: PrismaService) {}

  async startAssessment(userId: string, careerPathId: string) {
    // Check if career path exists
    const careerPath = await this.prisma.careerPath.findUnique({
      where: { id: careerPathId, isActive: true },
    });

    if (!careerPath) {
      throw new NotFoundException('Career path not found');
    }

    // Check if user has an incomplete assessment for this career path
    const existingAssessment = await this.prisma.careerAssessment.findFirst({
      where: {
        userId,
        careerPathId,
        status: 'IN_PROGRESS',
      },
    });

    if (existingAssessment) {
      return {
        assessment: existingAssessment,
        question: await this.getNextQuestionData(existingAssessment.id),
      };
    }

    // Create new assessment
    const assessment = await this.prisma.careerAssessment.create({
      data: {
        userId,
        careerPathId,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Generate assessment questions
    await this.generateAssessmentQuestions(assessment.id, careerPathId);

    // Get first question
    const question = await this.getNextQuestionData(assessment.id);

    this.logger.log(`Assessment started for user ${userId}, career path ${careerPathId}`);

    return {
      assessment,
      question,
    };
  }

  async getNextQuestion(userId: string, assessmentId: string, answer?: string) {
    // Verify assessment belongs to user
    const assessment = await this.prisma.careerAssessment.findFirst({
      where: {
        id: assessmentId,
        userId,
      },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    if (assessment.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Assessment is not in progress');
    }

    if (assessment.expiresAt < new Date()) {
      throw new BadRequestException('Assessment has expired');
    }

    // Save answer if provided
    if (answer) {
      await this.saveAnswer(assessmentId, answer);
    }

    // Get next question
    const question = await this.getNextQuestionData(assessmentId);

    if (!question) {
      // No more questions, complete the assessment
      return await this.completeAssessment(userId, assessmentId);
    }

    return {
      question,
      progress: await this.getAssessmentProgress(assessmentId),
    };
  }

  async completeAssessment(userId: string, assessmentId: string) {
    const assessment = await this.prisma.careerAssessment.findFirst({
      where: {
        id: assessmentId,
        userId,
      },
      include: {
        questions: true,
        careerPath: true,
      },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    if (assessment.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Assessment is already completed');
    }

    // Calculate score
    const score = await this.calculateAssessmentScore(assessmentId);

    // Generate results
    const results = await this.generateAssessmentResults(assessment, score);

    // Update assessment
    const updatedAssessment = await this.prisma.careerAssessment.update({
      where: { id: assessmentId },
      data: {
        status: 'COMPLETED',
        score,
        results,
        completedAt: new Date(),
      },
    });

    this.logger.log(`Assessment completed for user ${userId}, score: ${score}`);

    return {
      assessment: updatedAssessment,
      results,
      recommendations: await this.generateRecommendations(assessment, score),
    };
  }

  async getAssessment(userId: string, assessmentId: string) {
    const assessment = await this.prisma.careerAssessment.findFirst({
      where: {
        id: assessmentId,
        userId,
      },
      include: {
        careerPath: true,
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    return {
      assessment,
      progress: await this.getAssessmentProgress(assessmentId),
    };
  }

  async getAssessmentHistory(userId: string, options: { page: number; limit: number }) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [assessments, total] = await Promise.all([
      this.prisma.careerAssessment.findMany({
        where: { userId },
        include: {
          careerPath: true,
        },
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.careerAssessment.count({ where: { userId } }),
    ]);

    return {
      assessments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  private async generateAssessmentQuestions(assessmentId: string, careerPathId: string) {
    const questionTemplates = await this.getQuestionTemplates(careerPathId);
    
    for (let i = 0; i < questionTemplates.length; i++) {
      const template = questionTemplates[i];
      await this.prisma.assessmentQuestion.create({
        data: {
          assessmentId,
          questionTextEn: template.questionTextEn,
          questionTextAr: template.questionTextAr,
          questionType: template.questionType,
          options: JSON.stringify(template.options),
          correctAnswer: template.correctAnswer,
          points: template.points,
          order: i + 1,
        },
      });
    }
  }

  private async getQuestionTemplates(careerPathId: string) {
    // Mock question templates - in a real app, these would be stored in the database
    const templates = [
      {
        questionTextEn: 'How would you rate your problem-solving skills?',
        questionTextAr: 'ÙƒÙŠÙ ØªÙ‚ÙŠÙ… Ù…Ù‡Ø§Ø±Ø§Øª Ø­Ù„ Ø§Ù„Ù…Ø´ÙƒÙ„Ø§Øª Ù„Ø¯ÙŠÙƒØŸ',
        questionType: 'SCALE',
        options: ['1', '2', '3', '4', '5'],
        correctAnswer: '3', // Neutral answer for self-assessment
        points: 1,
      },
      {
        questionTextEn: 'Which programming languages are you familiar with?',
        questionTextAr: 'Ù…Ø§ Ù‡ÙŠ Ù„ØºØ§Øª Ø§Ù„Ø¨Ø±Ù…Ø¬Ø© Ø§Ù„ØªÙŠ ØªØ¹Ø±ÙÙ‡Ø§ØŸ',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          'JavaScript/TypeScript',
          'Python',
          'Java',
          'C++',
          'None of the above',
        ],
        correctAnswer: 'JavaScript/TypeScript',
        points: 2,
      },
      {
        questionTextEn: 'How comfortable are you with learning new technologies?',
        questionTextAr: 'Ù…Ø§ Ù…Ø¯Ù‰ Ø±Ø§Ø­ØªÙƒ ÙÙŠ ØªØ¹Ù„Ù… Ø§Ù„ØªÙ‚Ù†ÙŠØ§Øª Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©ØŸ',
        questionType: 'SCALE',
        options: ['1', '2', '3', '4', '5'],
        correctAnswer: '4',
        points: 1,
      },
      {
        questionTextEn: 'What type of work environment do you prefer?',
        questionTextAr: 'Ù…Ø§ Ù†ÙˆØ¹ Ø¨ÙŠØ¦Ø© Ø§Ù„Ø¹Ù…Ù„ Ø§Ù„ØªÙŠ ØªÙØ¶Ù„Ù‡Ø§ØŸ',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          'Fast-paced startup',
          'Corporate environment',
          'Remote/Flexible',
          'Research/Academic',
          'Freelance/Consulting',
        ],
        correctAnswer: 'Remote/Flexible',
        points: 1,
      },
      {
        questionTextEn: 'How do you approach complex problems?',
        questionTextAr: 'ÙƒÙŠÙ ØªØªØ¹Ø§Ù…Ù„ Ù…Ø¹ Ø§Ù„Ù…Ø´Ø§ÙƒÙ„ Ø§Ù„Ù…Ø¹Ù‚Ø¯Ø©ØŸ',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          'Break them down into smaller parts',
          'Seek help from colleagues',
          'Research and study the problem',
          'Try different approaches systematically',
          'All of the above',
        ],
        correctAnswer: 'All of the above',
        points: 2,
      },
      {
        questionTextEn: 'What motivates you most in your career?',
        questionTextAr: 'Ù…Ø§ Ø§Ù„Ø°ÙŠ ÙŠØ­ÙØ²Ùƒ Ø£ÙƒØ«Ø± ÙÙŠ Ù…Ø³ÙŠØ±ØªÙƒ Ø§Ù„Ù…Ù‡Ù†ÙŠØ©ØŸ',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          'Financial rewards',
          'Learning and growth',
          'Work-life balance',
          'Making an impact',
          'Technical challenges',
        ],
        correctAnswer: 'Learning and growth',
        points: 1,
      },
      {
        questionTextEn: 'How do you handle tight deadlines?',
        questionTextAr: 'ÙƒÙŠÙ ØªØªØ¹Ø§Ù…Ù„ Ù…Ø¹ Ø§Ù„Ù…ÙˆØ§Ø¹ÙŠØ¯ Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠØ© Ø§Ù„Ø¶ÙŠÙ‚Ø©ØŸ',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          'Prioritize and focus on important tasks',
          'Work extra hours',
          'Ask for deadline extensions',
          'Delegate when possible',
          'Communicate proactively',
        ],
        correctAnswer: 'Prioritize and focus on important tasks',
        points: 2,
      },
      {
        questionTextEn: 'What role do you usually take in team projects?',
        questionTextAr: 'Ù…Ø§ Ù‡Ùˆ Ø§Ù„Ø¯ÙˆØ± Ø§Ù„Ø°ÙŠ ØªØªØ®Ø°Ù‡ Ø¹Ø§Ø¯Ø© ÙÙŠ Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ Ø§Ù„Ø¬Ù…Ø§Ø¹ÙŠØ©ØŸ',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          'Leader/Coordinator',
          'Technical expert',
          'Researcher/Planner',
          'Implementer/Executor',
          'Supporter/Mediator',
        ],
        correctAnswer: 'Technical expert',
        points: 1,
      },
      {
        questionTextEn: 'How interested are you in data analysis?',
        questionTextAr: 'Ù…Ø§ Ù…Ø¯Ù‰ Ø§Ù‡ØªÙ…Ø§Ù…Ùƒ Ø¨ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§ØªØŸ',
        questionType: 'SCALE',
        options: ['1', '2', '3', '4', '5'],
        correctAnswer: '3',
        points: 1,
      },
      {
        questionTextEn: 'Do you prefer working with visual design or logical systems?',
        questionTextAr: 'Ù‡Ù„ ØªÙØ¶Ù„ Ø§Ù„Ø¹Ù…Ù„ Ù…Ø¹ Ø§Ù„ØªØµÙ…ÙŠÙ… Ø§Ù„Ø¨ØµØ±ÙŠ Ø£Ù… Ø§Ù„Ø£Ù†Ø¸Ù…Ø© Ø§Ù„Ù…Ù†Ø·Ù‚ÙŠØ©ØŸ',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          'Visual design',
          'Logical systems',
          'Both equally',
          'Neither',
        ],
        correctAnswer: 'Logical systems',
        points: 1,
      },
    ];

    // Shuffle questions for variety
    return templates.sort(() => Math.random() - 0.5).slice(0, 10); // Return 10 random questions
  }

  private async getNextQuestionData(assessmentId: string) {
    const unansweredQuestion = await this.prisma.assessmentQuestion.findFirst({
      where: {
        assessmentId,
        userAnswer: null,
      },
      orderBy: { order: 'asc' },
    });

    if (!unansweredQuestion) {
      return null;
    }

    return {
      id: unansweredQuestion.id,
      questionText: unansweredQuestion.questionTextEn,
      questionTextAr: unansweredQuestion.questionTextAr,
      questionType: unansweredQuestion.questionType,
      options: unansweredQuestion.options ? JSON.parse(String(unansweredQuestion.options)) : null,
      points: unansweredQuestion.points,
      order: unansweredQuestion.order,
    };
  }

  private async saveAnswer(assessmentId: string, answer: string) {
    const currentQuestion = await this.prisma.assessmentQuestion.findFirst({
      where: {
        assessmentId,
        userAnswer: null,
      },
      orderBy: { order: 'asc' },
    });

    if (currentQuestion) {
      await this.prisma.assessmentQuestion.update({
        where: { id: currentQuestion.id },
        data: { userAnswer: answer },
      });
    }
  }

  private async getAssessmentProgress(assessmentId: string) {
    const [totalQuestions, answeredQuestions] = await Promise.all([
      this.prisma.assessmentQuestion.count({
        where: { assessmentId },
      }),
      this.prisma.assessmentQuestion.count({
        where: {
          assessmentId,
          userAnswer: { not: null },
        },
      }),
    ]);

    return {
      total: totalQuestions,
      answered: answeredQuestions,
      percentage: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0,
    };
  }

  private async calculateAssessmentScore(assessmentId: string) {
    const questions = await this.prisma.assessmentQuestion.findMany({
      where: { assessmentId },
    });

    if (questions.length === 0) return 0;

    let totalPoints = 0;
    let earnedPoints = 0;

    questions.forEach(question => {
      totalPoints += question.points;
      
      // For self-assessment questions, we'll be more lenient
      if (question.questionType === 'SCALE') {
        // Scale questions get partial credit based on answer
        const answerValue = parseInt(question.userAnswer || '3');
        earnedPoints += Math.min(answerValue, question.points);
      } else {
        // Multiple choice questions
        if (question.userAnswer === question.correctAnswer) {
          earnedPoints += question.points;
        }
      }
    });

    return totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  }

  private async generateAssessmentResults(assessment: any, score: number) {
    const careerPath = assessment.careerPath;
    
    // Generate results based on score and career path
    const results = {
      score,
      level: this.getProficiencyLevel(score),
      strengths: this.identifyStrengths(assessment, score),
      improvements: this.identifyImprovements(assessment, score),
      fitScore: Math.min(score + 10, 100), // Add some optimism
      nextSteps: this.getNextSteps(score, careerPath),
      recommendedCourses: await this.getRecommendedCourses(assessment.userId, careerPath.id, score),
    };

    return results;
  }

  private getProficiencyLevel(score: number): string {
    if (score >= 80) return 'ADVANCED';
    if (score >= 60) return 'INTERMEDIATE';
    if (score >= 40) return 'BEGINNER';
    return 'NOVICE';
  }

  private identifyStrengths(assessment: any, score: number): string[] {
    const strengths = [];
    
    if (score >= 70) {
      strengths.push('Strong analytical thinking');
    }
    
    if (score >= 60) {
      strengths.push('Good problem-solving approach');
    }
    
    // Analyze specific answers to identify strengths
    // This would be more sophisticated in a real implementation
    
    return strengths;
  }

  private identifyImprovements(assessment: any, score: number): string[] {
    const improvements = [];
    
    if (score < 50) {
      improvements.push('Need more foundational knowledge');
    }
    
    if (score < 70) {
      improvements.push('Improve technical skills');
    }
    
    improvements.push('Continue learning and practicing');
    
    return improvements;
  }

  private getNextSteps(score: number, careerPath: any): string[] {
    const steps = [];
    
    if (score < 40) {
      steps.push('Start with beginner courses');
      steps.push('Build fundamental skills');
    } else if (score < 70) {
      steps.push('Take intermediate courses');
      steps.push('Work on practical projects');
    } else {
      steps.push('Advanced courses and specializations');
      steps.push('Consider certification');
    }
    
    steps.push('Join community forums');
    steps.push('Find a mentor');
    
    return steps;
  }

  private async getRecommendedCourses(userId: string, careerPathId: string, score: number) {
    // Get courses based on score level
    let level = 'BEGINNER';
    if (score >= 60) level = 'INTERMEDIATE';
    if (score >= 80) level = 'ADVANCED';

    const courses = await this.prisma.course.findMany({
      where: {
        careerPathId,
        level,
        status: 'PUBLISHED',
      },
      take: 3,
      orderBy: { sortOrder: 'asc' },
    });

    return courses.map(course => ({
      id: course.id,
      title: course.titleEn,
      description: course.descriptionEn,
      level: course.level,
      duration: course.duration,
    }));
  }

  private async generateRecommendations(assessment: any, score: number) {
    const recommendations = {
      careerPath: {
        suitable: score >= 50,
        confidence: Math.min(score + 20, 100),
        message: score >= 50 
          ? 'You show good potential for this career path'
          : 'Consider exploring other career paths that may better match your skills',
      },
      learning: {
        recommendedPace: score >= 70 ? 'Intensive' : 'Moderate',
        estimatedDuration: score >= 70 ? '3-6 months' : '6-12 months',
        focusAreas: this.getFocusAreas(score),
      },
      nextAction: score >= 60 
        ? 'Start with recommended courses'
        : 'Consider retaking assessment or exploring other paths',
    };

    return recommendations;
  }

  private getFocusAreas(score: number): string[] {
    if (score >= 80) {
      return ['Advanced topics', 'Specialization', 'Practical projects'];
    } else if (score >= 60) {
      return ['Core concepts', 'Hands-on practice', 'Building portfolio'];
    } else {
      return ['Fundamentals', 'Basic skills', 'Theory and concepts'];
    }
  }

   async getLatestResult(userId: string) {
     this.logger.log(`[Assessment] getLatestResult userId: ${userId}`)
     // Try CareerAssessment first, then AssessmentSession
     const assessment = await this.prisma.careerAssessment.findFirst({
       where: { userId, status: 'COMPLETED' },
       orderBy: { completedAt: 'desc' },
       include: { careerPath: true },
     }).catch(() => null) ||
     await this.prisma.assessmentSession.findFirst({
       where: { userId, status: 'COMPLETED' },
       orderBy: { completedAt: 'desc' },
     }).catch(() => null)

     if (!assessment) {
       this.logger.log('[Assessment] No assessment found')
       return { success: false, data: null, message: 'No assessment found' }
     }

     this.logger.log(`[Assessment] Found assessment: ${assessment.id}, type: ${'careerPath' in assessment ? 'CareerAssessment' : 'AssessmentSession'}`)

     // Parse stored results — may be JSON string or object
     let raw: any = (assessment as any).results ||
                    (assessment as any).report ||
                    (assessment as any).score ||
                    {}
     if (typeof raw === 'string') {
       try { raw = JSON.parse(raw); } catch { raw = {}; }
     }

     this.logger.log('[Assessment] Raw result type:', typeof raw, '| keys:', Object.keys(raw || {}))

     // Build topFields from the assessment result
     const topFields = this.buildTopFields(assessment, raw)

     this.logger.log('[Assessment] topFields count:', topFields.length)

     if (!topFields || topFields.length === 0) {
       return { success: false, data: null, message: 'No results yet' }
     }

     return {
       success: true,
       data: {
         assessmentId: assessment.id,
         topFields,
         summary: raw.personalityDescription || raw.summary || '',
         recommendedPaths: topFields.map((f: any) => f.fieldSlug),
       },
     }
   }

    // Parse stored results — may be JSON string or object
    let result: any = assessment.results || assessment.score || {};
    if (typeof result === 'string') {
      try { result = JSON.parse(result); } catch { result = {}; }
    }

    // Build topFields from the assessment result
    const topFields = this.buildTopFields(assessment, result);

    return {
      success: true,
      data: {
        assessmentId: assessment.id,
        topFields,
        summary: result.personalityDescription || result.summary || '',
        recommendedPaths: topFields.map((f: any) => f.fieldSlug),
      },
    };
  }

  private buildTopFields(assessment: any, result: any): any[] {
    // New format: AI returns topFields directly
    if (result.topFields && Array.isArray(result.topFields)) {
      return result.topFields.slice(0, 5).map((field: any, idx: number) => ({
        fieldSlug: field.fieldSlug || this.guessFieldSlug(field.titleEn || field.title || ''),
        title: field.titleAr || field.title || '',
        titleEn: field.titleEn || field.title || '',
        titleAr: field.titleAr || field.title || '',
        confidence: field.confidence || Math.max(0.5, 0.85 - idx * 0.05),
        reasoning: field.reasoning || '',
        skills: field.skills || [],
      }));
    }

    // Legacy format: topSpecializations
    if (result.topSpecializations) {
      return (result.topSpecializations as any[]).slice(0, 5).map((spec, idx) => ({
        fieldSlug: this.guessFieldSlug(spec.titleEn || spec.title || ''),
        title: spec.titleAr || spec.title || '',
        titleEn: spec.titleEn || spec.title || '',
        titleAr: spec.titleAr || spec.title || '',
        confidence: spec.matchScore ? spec.matchScore / 100 : 0.75 - idx * 0.05,
        reasoning: spec.whyMatch || '',
        skills: spec.requiredSkills || [],
      }));
    }

    // Fallback: build from score and career path
    const careerPath = assessment.careerPath;
    const score = assessment.score || 0;
    return [
      {
        fieldSlug: careerPath?.slug || 'fullstack',
        title: careerPath?.titleAr || 'تطوير الويب الشامل',
        titleEn: careerPath?.titleEn || 'Full Stack Development',
        titleAr: careerPath?.titleAr || 'تطوير الويب الشامل',
        confidence: Math.min((score || 70) / 100, 0.95),
        reasoning: `بناءً على إجاباتك، تميلك نحو ${careerPath?.titleAr || 'تطوير البرمجيات'}.`,
        skills: careerPath?.skills?.slice(0, 5) || ['JavaScript', 'Problem Solving'],
      },
    ];
  }

  private guessFieldSlug(title: string): string {
    const t = title.toLowerCase();
    if (t.includes('front')) return 'frontend';
    if (t.includes('back')) return 'backend';
    if (t.includes('full') || t.includes('mern') || t.includes('mean')) return 'fullstack';
    if (t.includes('mobile') || t.includes('flutter') || t.includes('react native')) return 'mobile';
    if (t.includes('devops') || t.includes('cloud') || t.includes('aws')) return 'devops';
    if (t.includes('data') || t.includes('ml') || t.includes('ai')) return 'data-science';
    if (t.includes('security') || t.includes('cyber')) return 'cybersecurity';
    if (t.includes('design') || t.includes('ux') || t.includes('ui')) return 'ui-ux';
    if (t.includes('blockchain') || t.includes('web3')) return 'blockchain';
    return 'fullstack';
  }
}

