import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const CAREER_PATH_TAGS: Record<string, string[]> = {
  'frontend-dev': ['frontend', 'html', 'css', 'javascript', 'react', 'vue', 'angular', 'typescript', 'web', 'ui', 'تطوير', 'برمجة', 'ويب'],
  'backend-dev': ['backend', 'node', 'python', 'java', 'api', 'database', 'server', 'sql', 'mongodb', 'برمجة', 'خادم', 'قاعدة بيانات'],
  'fullstack-dev': ['fullstack', 'frontend', 'backend', 'web', 'react', 'node', 'javascript', 'typescript', 'برمجة', 'تطوير'],
  'mobile-dev': ['mobile', 'flutter', 'react native', 'ios', 'android', 'swift', 'kotlin', 'موبايل', 'تطبيق'],
  'data-scientist': ['data', 'python', 'machine learning', 'pandas', 'numpy', 'statistics', 'analytics', 'بيانات', 'تحليل', 'ذكاء اصطناعي'],
  'ai-engineer': ['ai', 'machine learning', 'deep learning', 'nlp', 'tensorflow', 'pytorch', 'llm', 'ذكاء اصطناعي', 'تعلم آلي'],
  'cybersecurity': ['security', 'hacking', 'network', 'linux', 'kali', 'penetration', 'ctf', 'أمن', 'سيبراني', 'اختراق'],
  'devops': ['devops', 'docker', 'kubernetes', 'aws', 'azure', 'cloud', 'ci/cd', 'linux', 'سحابة'],
  'ui-ux': ['ui', 'ux', 'design', 'figma', 'user experience', 'wireframe', 'prototype', 'تصميم', 'واجهة'],
  'graphic-designer': ['design', 'photoshop', 'illustrator', 'graphic', 'branding', 'logo', 'تصميم', 'جرافيك'],
  'digital-marketing': ['marketing', 'seo', 'google ads', 'social media', 'content', 'email', 'تسويق', 'رقمي'],
  'product-manager': ['product', 'agile', 'scrum', 'roadmap', 'strategy', 'ux', 'analytics', 'منتج', 'إدارة'],
  'business-analyst': ['business', 'excel', 'power bi', 'sql', 'analytics', 'reporting', 'أعمال', 'تحليل'],
  'project-manager': ['project management', 'pmp', 'agile', 'scrum', 'leadership', 'مشاريع', 'إدارة'],
  'entrepreneur': ['business', 'startup', 'finance', 'marketing', 'leadership', 'ريادة', 'أعمال', 'مشروع'],
  'sales-manager': ['sales', 'crm', 'negotiation', 'business', 'marketing', 'مبيعات', 'تفاوض'],
  'content-creator': ['content', 'writing', 'video', 'youtube', 'social media', 'storytelling', 'محتوى', 'إنشاء'],
};

const CATEGORY_PATH_MAP: Record<string, string[]> = {
  'برمجة': ['frontend-dev', 'backend-dev', 'fullstack-dev', 'mobile-dev', 'devops', 'cybersecurity', 'ai-engineer', 'data-scientist'],
  'programming': ['frontend-dev', 'backend-dev', 'fullstack-dev', 'mobile-dev', 'devops', 'cybersecurity', 'ai-engineer', 'data-scientist'],
  'البرمجة': ['frontend-dev', 'backend-dev', 'fullstack-dev', 'mobile-dev', 'devops', 'cybersecurity', 'ai-engineer', 'data-scientist'],
  'تصميم': ['ui-ux', 'graphic-designer'],
  'design': ['ui-ux', 'graphic-designer'],
  'تسويق': ['digital-marketing', 'content-creator', 'entrepreneur'],
  'marketing': ['digital-marketing', 'content-creator', 'entrepreneur'],
  'أعمال': ['entrepreneur', 'business-analyst', 'project-manager', 'product-manager', 'sales-manager'],
  'business': ['entrepreneur', 'business-analyst', 'project-manager', 'product-manager', 'sales-manager'],
  'ذكاء اصطناعي': ['ai-engineer', 'data-scientist'],
  'ai': ['ai-engineer', 'data-scientist'],
  'أمن': ['cybersecurity'],
  'security': ['cybersecurity'],
};

@Injectable()
export class RecommendationService {
  constructor(private prisma: PrismaService) {}

  private calculateScore(
    course: any,
    userPaths: string[],
    userBehavior?: { viewedIds?: string[]; completedIds?: string[] }
  ): number {
    let score = 0;

    const pathTags = userPaths.flatMap(p => CAREER_PATH_TAGS[p] || []);
    const titleText = `${course.titleAr || ''} ${course.titleEn || ''} ${course.descriptionAr || ''} ${course.descriptionEn || ''}`.toLowerCase();
    const categoryName = `${course.category?.nameEn || ''} ${course.category?.nameAr || ''}`.toLowerCase();

    pathTags.forEach(tag => {
      if (titleText.includes(tag.toLowerCase())) score += 4;
      if (categoryName.includes(tag.toLowerCase())) score += 3;
    });

    Object.entries(CATEGORY_PATH_MAP).forEach(([cat, paths]) => {
      if (categoryName.includes(cat.toLowerCase())) {
        const overlap = paths.filter(p => userPaths.includes(p)).length;
        score += overlap * 5;
      }
    });

    if (course.tags && Array.isArray(course.tags)) {
      course.tags.forEach((tag: string) => {
        if (pathTags.some(pt => pt.toLowerCase() === tag.toLowerCase())) {
          score += 6;
        }
      });
    }

    if (userBehavior?.completedIds?.includes(course.id)) score -= 10;
    if (userBehavior?.viewedIds?.includes(course.id)) score += 1;

    const enrollments = course._count?.enrollments || 0;
    score += Math.min(enrollments * 0.1, 3);

    return score;
  }

  async getRecommendedCourses(userPaths: string[], userId?: string, limit = 12) {
    try {
      const courses = await this.prisma.course.findMany({
        where: { status: 'PUBLISHED' },
        include: {
          category: true,
          instructor: {
            include: {
              profile: true,
            },
          },
          modules: {
            include: {
              _count: { select: { lessons: true } },
            },
          },
          _count: { select: { enrollments: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      console.log('[Recommendation] Found courses:', courses.length, 'Paths:', userPaths);

      if (!userPaths || userPaths.length === 0) {
        console.log('[Recommendation] No paths, returning all courses');
        return courses.slice(0, limit);
      }

      let userBehavior = {};
      if (userId) {
        try {
          const enrollments = await this.prisma.enrollment.findMany({
            where: { userId },
            select: { courseId: true, completedAt: true }
          });
          userBehavior = {
            completedIds: enrollments.filter(e => e.completedAt).map(e => e.courseId),
            viewedIds: enrollments.map(e => e.courseId),
          };
        } catch(e) {}
      }

      const scored = courses.map(course => ({
        ...course,
        _relevanceScore: this.calculateScore(course, userPaths, userBehavior)
      }));

      const relevant = scored.filter(c => c._relevanceScore > 0);

      if (relevant.length < 4) {
        const popular = scored
          .filter(c => c._relevanceScore === 0)
          .sort((a, b) => (b._count?.enrollments || 0) - (a._count?.enrollments || 0));
        return [...relevant, ...popular].slice(0, limit);
      }

      return relevant
        .sort((a, b) => b._relevanceScore - a._relevanceScore)
        .slice(0, limit);

    } catch(e: any) {
      console.error('[Recommendation]', e.message);
      return [];
    }
  }
}