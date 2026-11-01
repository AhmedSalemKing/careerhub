/**
 * Career Compass Seed — v1.0.0
 *
 * IDEMPOTENT: safe to run multiple times. Uses upsert-by-unique-key strategy.
 * ADDITIVE:   never deletes users, courses, UserCareerPath, CareerMemory, or any
 *             existing platform data.
 * ISOLATED:   touches only compass_* tables.
 *
 * Run:  npx ts-node prisma/compass-seed.ts
 *       (or `npm run db:seed:compass` once the script is added to package.json)
 *
 * NOTE: Question wording in Arabic is PROPOSED and requires content-team review.
 *       Scoring mappings and career-fit weights are NOT implemented — all
 *       careerFitScore fields remain null until business rules are approved by CTO.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ─── Version ────────────────────────────────────────────────────────────────
const VERSION = '1.0.0'

// ─── Stage definitions ───────────────────────────────────────────────────────
const STAGES = [
  { stageNumber: 1, titleAr: 'الملف الشخصي والأكاديمي', titleEn: 'Personal & Academic Profile' },
  { stageNumber: 2, titleAr: 'الاهتمامات', titleEn: 'Interests' },
  { stageNumber: 3, titleAr: 'المهارات', titleEn: 'Skills' },
  { stageNumber: 4, titleAr: 'المؤشرات السلوكية', titleEn: 'Behavioral Indicators' },
  { stageNumber: 5, titleAr: 'الدوافع وتفضيلات العمل', titleEn: 'Motivation & Work Preferences' },
  { stageNumber: 6, titleAr: 'الاستعداد للسوق', titleEn: 'Market Readiness' },
]

// ─── Baseline question bank ──────────────────────────────────────────────────
// 4 + 4 + 4 + 3 + 4 + 5 = 24 baseline questions

const QUESTIONS = [
  // ── Stage 1: CONTEXT (4) ────────────────────────────────────────────────
  {
    key: 'ctx_education',
    stageNumber: 1,
    dimension: 'CONTEXT' as const,
    type: 'SINGLE_CHOICE' as const,
    isBaseline: true,
    order: 1,
    textAr: 'ما هو مستواك التعليمي الحالي؟',
    textEn: 'What is your current educational level?',
    hintAr: null,
    hintEn: null,
    minAnswers: null,
    maxAnswers: null,
    options: [
      { key: 'ctx_edu_hs',    order: 1, textAr: 'ثانوية عامة أو أقل', textEn: 'High school or below', dimensionTag: null },
      { key: 'ctx_edu_univ',  order: 2, textAr: 'طالب جامعي حالياً', textEn: 'Currently a university student', dimensionTag: null },
      { key: 'ctx_edu_bach',  order: 3, textAr: 'بكالوريوس', textEn: "Bachelor's degree", dimensionTag: null },
      { key: 'ctx_edu_post',  order: 4, textAr: 'دراسات عليا (ماجستير/دكتوراه)', textEn: 'Postgraduate (Master\'s / PhD)', dimensionTag: null },
      { key: 'ctx_edu_other', order: 5, textAr: 'أخرى', textEn: 'Other', dimensionTag: null },
    ],
  },
  {
    key: 'ctx_field',
    stageNumber: 1,
    dimension: 'CONTEXT' as const,
    type: 'SINGLE_CHOICE' as const,
    isBaseline: true,
    order: 2,
    textAr: 'ما هو مجال دراستك أو تخصصك الأكاديمي؟',
    textEn: 'What is your field of study or academic specialization?',
    hintAr: null,
    hintEn: null,
    minAnswers: null,
    maxAnswers: null,
    options: [
      { key: 'ctx_field_cs',       order: 1, textAr: 'علوم الحاسب / تقنية المعلومات', textEn: 'Computer Science / IT', dimensionTag: null },
      { key: 'ctx_field_business',  order: 2, textAr: 'إدارة الأعمال / التجارة', textEn: 'Business / Commerce', dimensionTag: null },
      { key: 'ctx_field_eng',       order: 3, textAr: 'الهندسة (غير التقنية)', textEn: 'Engineering (non-CS)', dimensionTag: null },
      { key: 'ctx_field_science',   order: 4, textAr: 'العلوم الطبيعية / الرياضيات', textEn: 'Natural Sciences / Mathematics', dimensionTag: null },
      { key: 'ctx_field_humanities',order: 5, textAr: 'الإنسانيات / العلوم الاجتماعية', textEn: 'Humanities / Social Sciences', dimensionTag: null },
      { key: 'ctx_field_design',    order: 6, textAr: 'التصميم / الفنون الإبداعية', textEn: 'Design / Creative Arts', dimensionTag: null },
      { key: 'ctx_field_other',     order: 7, textAr: 'أخرى', textEn: 'Other', dimensionTag: null },
    ],
  },
  {
    key: 'ctx_experience',
    stageNumber: 1,
    dimension: 'CONTEXT' as const,
    type: 'SINGLE_CHOICE' as const,
    isBaseline: true,
    order: 3,
    textAr: 'كم سنة من الخبرة العملية لديك؟',
    textEn: 'How many years of work experience do you have?',
    hintAr: null,
    hintEn: null,
    minAnswers: null,
    maxAnswers: null,
    options: [
      { key: 'ctx_exp_none',   order: 1, textAr: 'لا تجربة عملية', textEn: 'No work experience', dimensionTag: null },
      { key: 'ctx_exp_lt1',    order: 2, textAr: 'أقل من سنة', textEn: 'Less than 1 year', dimensionTag: null },
      { key: 'ctx_exp_1to3',   order: 3, textAr: '1 إلى 3 سنوات', textEn: '1–3 years', dimensionTag: null },
      { key: 'ctx_exp_3to5',   order: 4, textAr: '3 إلى 5 سنوات', textEn: '3–5 years', dimensionTag: null },
      { key: 'ctx_exp_5plus',  order: 5, textAr: 'أكثر من 5 سنوات', textEn: 'More than 5 years', dimensionTag: null },
    ],
  },
  {
    key: 'ctx_situation',
    stageNumber: 1,
    dimension: 'CONTEXT' as const,
    type: 'SINGLE_CHOICE' as const,
    isBaseline: true,
    order: 4,
    textAr: 'ما وضعك المهني الحالي؟',
    textEn: 'What is your current career situation?',
    hintAr: null,
    hintEn: null,
    minAnswers: null,
    maxAnswers: null,
    options: [
      { key: 'ctx_sit_student',   order: 1, textAr: 'طالب غير عامل', textEn: 'Student, not working', dimensionTag: null },
      { key: 'ctx_sit_student_pt',order: 2, textAr: 'طالب مع عمل جزئي', textEn: 'Student with part-time work', dimensionTag: null },
      { key: 'ctx_sit_working',   order: 3, textAr: 'أعمل وأطور مساري', textEn: 'Working and developing my career', dimensionTag: null },
      { key: 'ctx_sit_unemployed',order: 4, textAr: 'بين وظيفتين حالياً', textEn: 'Between jobs', dimensionTag: null },
      { key: 'ctx_sit_changing',  order: 5, textAr: 'أغيّر مساري المهني', textEn: 'Changing career path', dimensionTag: null },
    ],
  },

  // ── Stage 2: INTERESTS (4) ──────────────────────────────────────────────
  {
    key: 'int_domains',
    stageNumber: 2,
    dimension: 'INTERESTS' as const,
    type: 'MULTI_SELECT' as const,
    isBaseline: true,
    order: 1,
    textAr: 'أي المجالات تجذبك وتشعل اهتمامك؟ (اختر من 2 إلى 3)',
    textEn: 'Which areas genuinely attract and engage you? (Choose 2–3)',
    hintAr: 'اختر ما يثير فضولك الحقيقي، وليس ما تعتقد أنه الإجابة الصحيحة.',
    hintEn: 'Choose what genuinely excites your curiosity, not what you think is the "right" answer.',
    minAnswers: 2,
    maxAnswers: 3,
    options: [
      { key: 'int_dom_tech',       order: 1, textAr: 'التقنية وبرمجيات المنتجات', textEn: 'Technology & Software Products', dimensionTag: 'INTERESTS' },
      { key: 'int_dom_business',   order: 2, textAr: 'الأعمال والتجارة والإدارة', textEn: 'Business, Commerce & Management', dimensionTag: 'INTERESTS' },
      { key: 'int_dom_data',       order: 3, textAr: 'البيانات والتحليل', textEn: 'Data & Analytics', dimensionTag: 'INTERESTS' },
      { key: 'int_dom_design',     order: 4, textAr: 'التصميم والإبداع', textEn: 'Design & Creative Work', dimensionTag: 'INTERESTS' },
      { key: 'int_dom_security',   order: 5, textAr: 'الأمن السيبراني وحماية الأنظمة', textEn: 'Cybersecurity & Systems Protection', dimensionTag: 'INTERESTS' },
      { key: 'int_dom_marketing',  order: 6, textAr: 'التسويق والتواصل', textEn: 'Marketing & Communication', dimensionTag: 'INTERESTS' },
      { key: 'int_dom_research',   order: 7, textAr: 'البحث والعلوم', textEn: 'Research & Science', dimensionTag: 'INTERESTS' },
      { key: 'int_dom_leadership', order: 8, textAr: 'القيادة وإدارة الفرق', textEn: 'Leadership & Team Management', dimensionTag: 'INTERESTS' },
    ],
  },
  {
    key: 'int_free_time',
    stageNumber: 2,
    dimension: 'INTERESTS' as const,
    type: 'SINGLE_CHOICE' as const,
    isBaseline: true,
    order: 2,
    textAr: 'في وقت فراغك، ما الذي تتجه إليه بشكل طبيعي؟',
    textEn: 'In your free time, what do you naturally gravitate toward?',
    hintAr: null,
    hintEn: null,
    minAnswers: null,
    maxAnswers: null,
    options: [
      { key: 'int_ft_build',    order: 1, textAr: 'بناء وإنشاء أشياء (تطبيقات، مشاريع، أدوات)', textEn: 'Building things (apps, projects, tools)', dimensionTag: 'INTERESTS' },
      { key: 'int_ft_learn',    order: 2, textAr: 'تعلّم مفاهيم جديدة وقراءة في موضوعات متنوعة', textEn: 'Learning new concepts and reading broadly', dimensionTag: 'INTERESTS' },
      { key: 'int_ft_analyze',  order: 3, textAr: 'تحليل المشكلات والبيانات', textEn: 'Analyzing problems and data', dimensionTag: 'INTERESTS' },
      { key: 'int_ft_people',   order: 4, textAr: 'التواصل مع الناس ومساعدتهم', textEn: 'Connecting with and helping people', dimensionTag: 'INTERESTS' },
      { key: 'int_ft_organize', order: 5, textAr: 'التنظيم وإدارة الأعمال والمهام', textEn: 'Organizing and managing tasks', dimensionTag: 'INTERESTS' },
    ],
  },
  {
    key: 'int_env',
    stageNumber: 2,
    dimension: 'INTERESTS' as const,
    type: 'SINGLE_CHOICE' as const,
    isBaseline: true,
    order: 3,
    textAr: 'أي بيئات العمل تستثير حماسك أكثر؟',
    textEn: 'Which work environment excites you most?',
    hintAr: null,
    hintEn: null,
    minAnswers: null,
    maxAnswers: null,
    options: [
      { key: 'int_env_startup',  order: 1, textAr: 'سريعة الإيقاع، شركات ناشئة', textEn: 'Fast-paced startup environment', dimensionTag: 'INTERESTS' },
      { key: 'int_env_corp',     order: 2, textAr: 'منظّمة ومؤسسية', textEn: 'Structured, corporate organization', dimensionTag: 'INTERESTS' },
      { key: 'int_env_creative', order: 3, textAr: 'إبداعية تشاركية', textEn: 'Creative, collaborative studio', dimensionTag: 'INTERESTS' },
      { key: 'int_env_research', order: 4, textAr: 'بحثية وأكاديمية', textEn: 'Research-focused, academic', dimensionTag: 'INTERESTS' },
      { key: 'int_env_freelance',order: 5, textAr: 'مستقلة وحرة', textEn: 'Independent, freelance', dimensionTag: 'INTERESTS' },
    ],
  },
  {
    key: 'int_problem',
    stageNumber: 2,
    dimension: 'INTERESTS' as const,
    type: 'SCENARIO' as const,
    isBaseline: true,
    order: 4,
    textAr: 'لو أُتيحت لك فرصة حل مشكلة كبيرة، أيّها ستختار؟',
    textEn: 'If you could solve one major problem, which would you choose?',
    hintAr: 'لا توجد إجابة صحيحة أو خاطئة — اختر ما يحرّكك.',
    hintEn: 'There is no right or wrong answer — choose what genuinely moves you.',
    minAnswers: null,
    maxAnswers: null,
    options: [
      { key: 'int_prob_security',  order: 1, textAr: 'تحسين الأمن السيبراني للمنظمات', textEn: 'Improve cybersecurity for organizations', dimensionTag: 'INTERESTS' },
      { key: 'int_prob_product',   order: 2, textAr: 'بناء منتجات يستخدمها ملايين البشر', textEn: 'Build products that millions of people use', dimensionTag: 'INTERESTS' },
      { key: 'int_prob_business',  order: 3, textAr: 'مساعدة الشركات على النمو وزيادة إيراداتها', textEn: 'Help businesses grow their revenue', dimensionTag: 'INTERESTS' },
      { key: 'int_prob_data',      order: 4, textAr: 'استخدام البيانات لاتخاذ قرارات أفضل', textEn: 'Use data to drive better decisions', dimensionTag: 'INTERESTS' },
      { key: 'int_prob_research',  order: 5, textAr: 'تقديم بحث علمي يُغيّر المجال', textEn: 'Advance scientific research that changes the field', dimensionTag: 'INTERESTS' },
    ],
  },

  // ── Stage 3: SKILLS (4) ─────────────────────────────────────────────────
  {
    key: 'skl_programming',
    stageNumber: 3,
    dimension: 'SKILLS' as const,
    type: 'RATING_SCALE' as const,
    isBaseline: true,
    order: 1,
    textAr: 'كيف تُقيّم مستوى مهاراتك البرمجية والتقنية؟',
    textEn: 'How would you rate your programming and technical skills?',
    hintAr: '1 = مبتدئ تماماً، 5 = خبرة متقدمة',
    hintEn: '1 = Complete beginner, 5 = Advanced expertise',
    minAnswers: null,
    maxAnswers: null,
    options: [],
  },
  {
    key: 'skl_technical_set',
    stageNumber: 3,
    dimension: 'SKILLS' as const,
    type: 'MULTI_SELECT' as const,
    isBaseline: true,
    order: 2,
    textAr: 'أيّ من هذه المهارات التقنية لديك فعلاً؟ (اختر كل ما ينطبق)',
    textEn: 'Which of these technical skills do you actually have? (Select all that apply)',
    hintAr: 'اختر فقط ما مارسته عملياً، وليس ما تعرفه نظرياً فقط.',
    hintEn: 'Select only skills you have practiced, not merely read about.',
    minAnswers: 1,
    maxAnswers: 8,
    options: [
      { key: 'skl_ts_programming',   order: 1, textAr: 'البرمجة بلغة واحدة على الأقل', textEn: 'Programming in at least one language', dimensionTag: 'SKILLS' },
      { key: 'skl_ts_database',      order: 2, textAr: 'تصميم قواعد البيانات والاستعلامات', textEn: 'Database design and SQL querying', dimensionTag: 'SKILLS' },
      { key: 'skl_ts_data_analysis', order: 3, textAr: 'تحليل البيانات (Excel، Python، R)', textEn: 'Data analysis (Excel, Python, R)', dimensionTag: 'SKILLS' },
      { key: 'skl_ts_networking',    order: 4, textAr: 'إدارة الشبكات والأنظمة', textEn: 'Network / system administration', dimensionTag: 'SKILLS' },
      { key: 'skl_ts_design',        order: 5, textAr: 'أدوات التصميم وتجربة المستخدم', textEn: 'UI/UX design tools', dimensionTag: 'SKILLS' },
      { key: 'skl_ts_cloud',         order: 6, textAr: 'الحوسبة السحابية (AWS / GCP / Azure)', textEn: 'Cloud platforms (AWS, GCP, Azure)', dimensionTag: 'SKILLS' },
      { key: 'skl_ts_bizanalysis',   order: 7, textAr: 'تحليل الأعمال والتوثيق', textEn: 'Business analysis and documentation', dimensionTag: 'SKILLS' },
      { key: 'skl_ts_none',          order: 8, textAr: 'لا شيء مما سبق حتى الآن', textEn: 'None of the above yet', dimensionTag: 'SKILLS' },
    ],
  },
  {
    key: 'skl_communication',
    stageNumber: 3,
    dimension: 'SKILLS' as const,
    type: 'RATING_SCALE' as const,
    isBaseline: true,
    order: 3,
    textAr: 'كيف تُقيّم مهاراتك في التواصل والعرض والتقديم؟',
    textEn: 'How would you rate your communication and presentation skills?',
    hintAr: '1 = أجد صعوبة في الشرح للآخرين، 5 = أقدّم بثقة أمام أي جمهور',
    hintEn: '1 = Struggle to explain to others, 5 = Present confidently before any audience',
    minAnswers: null,
    maxAnswers: null,
    options: [],
  },
  {
    key: 'skl_problem_approach',
    stageNumber: 3,
    dimension: 'SKILLS' as const,
    type: 'SINGLE_CHOICE' as const,
    isBaseline: true,
    order: 4,
    textAr: 'أيّ الأوصاف الآتية يُعبّر أفضل تعبير عن أسلوبك في حل المشكلات؟',
    textEn: 'Which best describes your natural approach to solving problems?',
    hintAr: null,
    hintEn: null,
    minAnswers: null,
    maxAnswers: null,
    options: [
      { key: 'skl_pa_code',     order: 1, textAr: 'أُفكّك المشكلة منطقياً وأبني حلاً برمجياً', textEn: 'Break it down logically and build a coded solution', dimensionTag: 'SKILLS' },
      { key: 'skl_pa_data',     order: 2, textAr: 'أحلل البيانات والأنماط لاستخلاص رؤى', textEn: 'Analyze data and patterns to extract insights', dimensionTag: 'SKILLS' },
      { key: 'skl_pa_ux',       order: 3, textAr: 'أفكر في تجربة المستخدم وأصمم حلولاً', textEn: 'Think about user experience and design solutions', dimensionTag: 'SKILLS' },
      { key: 'skl_pa_business', order: 4, textAr: 'أقيّم الأثر على الأعمال والنتائج المالية', textEn: 'Evaluate business impact and financial outcomes', dimensionTag: 'SKILLS' },
      { key: 'skl_pa_security', order: 5, textAr: 'أقيّم المخاطر والثغرات الأمنية', textEn: 'Evaluate risks and security implications', dimensionTag: 'SKILLS' },
    ],
  },

  // ── Stage 4: BEHAVIORAL INDICATORS (3) ──────────────────────────────────
  {
    key: 'beh_challenge',
    stageNumber: 4,
    dimension: 'BEHAVIORAL_INDICATORS' as const,
    type: 'SCENARIO' as const,
    isBaseline: true,
    order: 1,
    textAr: 'عندما تتولى مشروعاً صعباً لم تواجه مثله من قبل، ماذا تفعل عادةً؟',
    textEn: 'When you take on a challenging project you have not faced before, what do you typically do?',
    hintAr: 'اختر الأقرب لما تفعله فعلاً لا ما تتمنى فعله.',
    hintEn: 'Choose what you actually do, not what you wish you did.',
    minAnswers: null,
    maxAnswers: null,
    options: [
      { key: 'beh_ch_plan',     order: 1, textAr: 'أبحث وأخطط بعمق قبل أن أبدأ التنفيذ', textEn: 'Research and plan thoroughly before taking action', dimensionTag: 'BEHAVIORAL_INDICATORS' },
      { key: 'beh_ch_dive',     order: 2, textAr: 'أبدأ فوراً وأتعلم أثناء التنفيذ', textEn: 'Dive in and learn as I go', dimensionTag: 'BEHAVIORAL_INDICATORS' },
      { key: 'beh_ch_collab',   order: 3, textAr: 'أستشير الآخرين وأتعاون معهم من البداية', textEn: 'Consult others and collaborate from the start', dimensionTag: 'BEHAVIORAL_INDICATORS' },
      { key: 'beh_ch_systems',  order: 4, textAr: 'أُعدّ الأنظمة والعمليات اللازمة أولاً', textEn: 'Set up systems and processes first', dimensionTag: 'BEHAVIORAL_INDICATORS' },
    ],
  },
  {
    key: 'beh_new_problem',
    stageNumber: 4,
    dimension: 'BEHAVIORAL_INDICATORS' as const,
    type: 'SINGLE_CHOICE' as const,
    isBaseline: true,
    order: 2,
    textAr: 'حين تواجه مشكلة لم تصادفها من قبل، ما الذي تفعله عادةً؟',
    textEn: 'When you encounter a problem you have never faced before, you typically:',
    hintAr: null,
    hintEn: null,
    minAnswers: null,
    maxAnswers: null,
    options: [
      { key: 'beh_np_decompose', order: 1, textAr: 'أُجزّئها إلى مشاكل أصغر وأحل كل منها بمنهجية', textEn: 'Break it into smaller parts and solve each methodically', dimensionTag: 'BEHAVIORAL_INDICATORS' },
      { key: 'beh_np_patterns',  order: 2, textAr: 'أبحث عن أنماط من مشاكل مشابهة سبق حلّها', textEn: 'Look for patterns from similar solved problems', dimensionTag: 'BEHAVIORAL_INDICATORS' },
      { key: 'beh_np_collab',    order: 3, textAr: 'أطلب آراء الآخرين وأستفيد من تجاربهم', textEn: 'Seek others\' input and learn from their experience', dimensionTag: 'BEHAVIORAL_INDICATORS' },
      { key: 'beh_np_frameworks',order: 4, textAr: 'أبحث عن أفضل الممارسات والأطر المرجعية', textEn: 'Research best practices and established frameworks', dimensionTag: 'BEHAVIORAL_INDICATORS' },
    ],
  },
  {
    key: 'beh_team_role',
    stageNumber: 4,
    dimension: 'BEHAVIORAL_INDICATORS' as const,
    type: 'SINGLE_CHOICE' as const,
    isBaseline: true,
    order: 3,
    textAr: 'ما الدور الذي تجد نفسك تؤديه بشكل طبيعي في بيئة الفريق؟',
    textEn: 'In a team setting, which role do you most naturally find yourself in?',
    hintAr: null,
    hintEn: null,
    minAnswers: null,
    maxAnswers: null,
    options: [
      { key: 'beh_tr_leader',    order: 1, textAr: 'القائد الذي يوجّه ويحدد الاتجاه', textEn: 'The leader who guides and sets direction', dimensionTag: 'BEHAVIORAL_INDICATORS' },
      { key: 'beh_tr_executor',  order: 2, textAr: 'المنفذ الذي يبني وينجز', textEn: 'The executor who builds and delivers', dimensionTag: 'BEHAVIORAL_INDICATORS' },
      { key: 'beh_tr_analyst',   order: 3, textAr: 'المحلل الذي يُقيّم ويُقدّم المشورة', textEn: 'The analyst who evaluates and advises', dimensionTag: 'BEHAVIORAL_INDICATORS' },
      { key: 'beh_tr_connector', order: 4, textAr: 'الرابط الذي ينسّق ويُسهل التواصل', textEn: 'The connector who coordinates and facilitates', dimensionTag: 'BEHAVIORAL_INDICATORS' },
    ],
  },

  // ── Stage 5: MOTIVATION + WORK_PREFERENCES (4) ──────────────────────────
  {
    key: 'mot_driver',
    stageNumber: 5,
    dimension: 'MOTIVATION' as const,
    type: 'SINGLE_CHOICE' as const,
    isBaseline: true,
    order: 1,
    textAr: 'ما الذي يحرّكك بشكل أساسي في مسيرتك المهنية؟',
    textEn: 'What primarily drives you in your career?',
    hintAr: null,
    hintEn: null,
    minAnswers: null,
    maxAnswers: null,
    options: [
      { key: 'mot_dr_impact',    order: 1, textAr: 'بناء منتجات أو خدمات تؤثر في حياة الناس', textEn: 'Building products or services that impact many people', dimensionTag: 'MOTIVATION' },
      { key: 'mot_dr_learning',  order: 2, textAr: 'التحدي الفكري والتعلم المستمر', textEn: 'Intellectual challenge and continuous learning', dimensionTag: 'MOTIVATION' },
      { key: 'mot_dr_financial', order: 3, textAr: 'النمو المالي والاستقرار الوظيفي', textEn: 'Financial growth and career stability', dimensionTag: 'MOTIVATION' },
      { key: 'mot_dr_status',    order: 4, textAr: 'التميز والاعتراف المهني', textEn: 'Recognition and professional standing', dimensionTag: 'MOTIVATION' },
      { key: 'mot_dr_helping',   order: 5, textAr: 'إحداث تأثير اجتماعي ومساعدة الآخرين', textEn: 'Creating social impact and helping others', dimensionTag: 'MOTIVATION' },
    ],
  },
  {
    key: 'mot_satisfying',
    stageNumber: 5,
    dimension: 'MOTIVATION' as const,
    type: 'MULTI_SELECT' as const,
    isBaseline: true,
    order: 2,
    textAr: 'ما نوع المهام التي تجلب لك أكبر قدر من الرضا؟ (اختر 1 إلى 3)',
    textEn: 'What type of tasks bring you the most satisfaction? (Choose 1–3)',
    hintAr: null,
    hintEn: null,
    minAnswers: 1,
    maxAnswers: 3,
    options: [
      { key: 'mot_sat_technical', order: 1, textAr: 'حل المشاكل التقنية العميقة', textEn: 'Deep technical problem-solving', dimensionTag: 'MOTIVATION' },
      { key: 'mot_sat_strategy',  order: 2, textAr: 'التخطيط الاستراتيجي واتخاذ القرارات', textEn: 'Strategic planning and decision-making', dimensionTag: 'MOTIVATION' },
      { key: 'mot_sat_creating',  order: 3, textAr: 'الإبداع والتصميم', textEn: 'Creating and designing', dimensionTag: 'MOTIVATION' },
      { key: 'mot_sat_data',      order: 4, textAr: 'تحليل البيانات واستخلاص الأفكار', textEn: 'Analyzing data and generating insights', dimensionTag: 'MOTIVATION' },
      { key: 'mot_sat_people',    order: 5, textAr: 'إدارة العلاقات والتواصل', textEn: 'Managing relationships and communication', dimensionTag: 'MOTIVATION' },
    ],
  },
  {
    key: 'wp_work_style',
    stageNumber: 5,
    dimension: 'WORK_PREFERENCES' as const,
    type: 'SINGLE_CHOICE' as const,
    isBaseline: true,
    order: 3,
    textAr: 'كيف تفضّل العمل بشكل عام؟',
    textEn: 'How do you prefer to work in general?',
    hintAr: null,
    hintEn: null,
    minAnswers: null,
    maxAnswers: null,
    options: [
      { key: 'wp_ws_independent', order: 1, textAr: 'باستقلالية مع توجيه محدود', textEn: 'Independently with minimal supervision', dimensionTag: 'WORK_PREFERENCES' },
      { key: 'wp_ws_smallteam',   order: 2, textAr: 'بالتعاون الوثيق مع فريق صغير', textEn: 'In close collaboration with a small team', dimensionTag: 'WORK_PREFERENCES' },
      { key: 'wp_ws_leading',     order: 3, textAr: 'بقيادة فريق نحو هدف مشترك', textEn: 'Leading a team toward a shared goal', dimensionTag: 'WORK_PREFERENCES' },
      { key: 'wp_ws_flexible',    order: 4, textAr: 'بمرونة بين العمل الفردي والجماعي', textEn: 'Flexibly shifting between solo and team work', dimensionTag: 'WORK_PREFERENCES' },
    ],
  },
  {
    key: 'wp_trajectory',
    stageNumber: 5,
    dimension: 'WORK_PREFERENCES' as const,
    type: 'SINGLE_CHOICE' as const,
    isBaseline: true,
    order: 4,
    textAr: 'أي المسارات المهنية يُعبّر أفضل تعبير عن طموحاتك؟',
    textEn: 'Which career trajectory best describes your ambitions?',
    hintAr: null,
    hintEn: null,
    minAnswers: null,
    maxAnswers: null,
    options: [
      { key: 'wp_tr_specialist',  order: 1, textAr: 'متخصص تقني عميق في مجال واحد', textEn: 'Deep technical specialist in one domain', dimensionTag: 'WORK_PREFERENCES' },
      { key: 'wp_tr_generalist',  order: 2, textAr: 'متعدد الكفاءات عبر مجالات مختلفة', textEn: 'Broad generalist across multiple domains', dimensionTag: 'WORK_PREFERENCES' },
      { key: 'wp_tr_leadership',  order: 3, textAr: 'مسار إداري وقيادي', textEn: 'Leadership and management track', dimensionTag: 'WORK_PREFERENCES' },
      { key: 'wp_tr_entrepreneur',order: 4, textAr: 'ريادة الأعمال وبناء شيء خاص بي', textEn: 'Entrepreneurship, building my own venture', dimensionTag: 'WORK_PREFERENCES' },
      { key: 'wp_tr_research',    order: 5, textAr: 'مسار بحثي وأكاديمي', textEn: 'Research and academic track', dimensionTag: 'WORK_PREFERENCES' },
    ],
  },

  // ── Stage 6: MARKET_READINESS (5) ────────────────────────────────────────
  {
    key: 'mr_portfolio',
    stageNumber: 6,
    dimension: 'MARKET_READINESS' as const,
    type: 'SINGLE_CHOICE' as const,
    isBaseline: true,
    order: 1,
    textAr: 'هل لديك محفظة أعمال (Portfolio) أو ملف GitHub أو إنتاج منشور؟',
    textEn: 'Do you have a portfolio, GitHub profile, or published work?',
    hintAr: null,
    hintEn: null,
    minAnswers: null,
    maxAnswers: null,
    options: [
      { key: 'mr_port_active',      order: 1, textAr: 'نعم، نشط ومُحدَّث', textEn: 'Yes, active and up to date', dimensionTag: 'MARKET_READINESS' },
      { key: 'mr_port_old',         order: 2, textAr: 'نعم، لكنه قديم وغير مُحدَّث', textEn: 'Yes, but not recently maintained', dimensionTag: 'MARKET_READINESS' },
      { key: 'mr_port_inprogress',  order: 3, textAr: 'قيد الإنشاء حالياً', textEn: 'Currently in progress', dimensionTag: 'MARKET_READINESS' },
      { key: 'mr_port_none',        order: 4, textAr: 'لا، ليس لديّ بعد', textEn: 'No, not yet', dimensionTag: 'MARKET_READINESS' },
    ],
  },
  {
    key: 'mr_certifications',
    stageNumber: 6,
    dimension: 'MARKET_READINESS' as const,
    type: 'SINGLE_CHOICE' as const,
    isBaseline: true,
    order: 2,
    textAr: 'هل أنجزت شهادات أو دورات تدريبية في مجالك المستهدف؟',
    textEn: 'Have you completed any certifications or courses in your target field?',
    hintAr: null,
    hintEn: null,
    minAnswers: null,
    maxAnswers: null,
    options: [
      { key: 'mr_cert_multiple', order: 1, textAr: 'نعم، شهادات احترافية متعددة', textEn: 'Yes, multiple industry-recognized certifications', dimensionTag: 'MARKET_READINESS' },
      { key: 'mr_cert_some',     order: 2, textAr: 'نعم، بعض الدورات الإلكترونية أو الشهادات', textEn: 'Yes, a few online courses or certificates', dimensionTag: 'MARKET_READINESS' },
      { key: 'mr_cert_ongoing',  order: 3, textAr: 'حالياً في تدريب ذي صلة', textEn: 'Currently enrolled in relevant training', dimensionTag: 'MARKET_READINESS' },
      { key: 'mr_cert_none',     order: 4, textAr: 'لا، ليس بعد', textEn: 'No, not yet', dimensionTag: 'MARKET_READINESS' },
    ],
  },
  {
    key: 'mr_applications',
    stageNumber: 6,
    dimension: 'MARKET_READINESS' as const,
    type: 'SINGLE_CHOICE' as const,
    isBaseline: true,
    order: 3,
    textAr: 'هل تقدّمت لوظائف أو تدريبات في مجالك المستهدف؟',
    textEn: 'Have you applied for jobs or internships in your target field?',
    hintAr: null,
    hintEn: null,
    minAnswers: null,
    maxAnswers: null,
    options: [
      { key: 'mr_app_interviews',  order: 1, textAr: 'نعم، وخضت مقابلات', textEn: 'Yes, with interview experience', dimensionTag: 'MARKET_READINESS' },
      { key: 'mr_app_no_callbacks',order: 2, textAr: 'نعم، لكن دون ردود حتى الآن', textEn: 'Yes, but no callbacks yet', dimensionTag: 'MARKET_READINESS' },
      { key: 'mr_app_preparing',   order: 3, textAr: 'لا، أُعدّ نفسي للتقديم', textEn: 'Not yet, still preparing', dimensionTag: 'MARKET_READINESS' },
      { key: 'mr_app_na',          order: 4, textAr: 'لا ينطبق (أُغيّر المجال)', textEn: 'Not applicable, transitioning fields', dimensionTag: 'MARKET_READINESS' },
    ],
  },
  {
    key: 'mr_network',
    stageNumber: 6,
    dimension: 'MARKET_READINESS' as const,
    type: 'SINGLE_CHOICE' as const,
    isBaseline: true,
    order: 4,
    textAr: 'كيف تصف شبكة علاقاتك المهنية في المجال الذي تستهدفه؟',
    textEn: 'How would you describe your professional network in your target field?',
    hintAr: null,
    hintEn: null,
    minAnswers: null,
    maxAnswers: null,
    options: [
      { key: 'mr_net_strong',   order: 1, textAr: 'قوية — لديّ معارف في الصناعة', textEn: 'Strong — I know people in the industry', dimensionTag: 'MARKET_READINESS' },
      { key: 'mr_net_moderate', order: 2, textAr: 'متوسطة — بعض التواصلات', textEn: 'Moderate — some connections', dimensionTag: 'MARKET_READINESS' },
      { key: 'mr_net_minimal',  order: 3, textAr: 'محدودة — بدأت للتوّ', textEn: 'Minimal — just starting to build my network', dimensionTag: 'MARKET_READINESS' },
      { key: 'mr_net_none',     order: 4, textAr: 'لا شيء بعد', textEn: 'None yet', dimensionTag: 'MARKET_READINESS' },
    ],
  },
  {
    key: 'mr_readiness_rating',
    stageNumber: 6,
    dimension: 'MARKET_READINESS' as const,
    type: 'RATING_SCALE' as const,
    isBaseline: true,
    order: 5,
    textAr: 'بشكل عام، كيف تُقيّم جاهزيتك للبدء في مجالك المستهدف اليوم؟',
    textEn: 'Overall, how would you rate your readiness to start in your target field today?',
    hintAr: '1 = لست جاهزاً بعد، 5 = مستعد تماماً وجاهز للانطلاق',
    hintEn: '1 = Not ready yet, 5 = Fully ready to start right now',
    minAnswers: null,
    maxAnswers: null,
    options: [],
  },
] as const

// ─── Follow-up questions ─────────────────────────────────────────────────────

const FOLLOW_UP_QUESTIONS = [
  // FU-1: High programming rating → specialization
  {
    key: 'fu_prog_specialization',
    stageNumber: 3,
    dimension: 'SKILLS' as const,
    type: 'MULTI_SELECT' as const,
    isBaseline: false,
    order: 10,
    textAr: 'رائع! في أي تخصصات برمجية لديك عمق حقيقي؟ (اختر كل ما ينطبق)',
    textEn: 'Great! Which programming specializations do you have real depth in?',
    hintAr: null,
    hintEn: null,
    minAnswers: 1,
    maxAnswers: 6,
    maxFollowUpDepth: 1,
    options: [
      { key: 'fu_spec_frontend',  order: 1, textAr: 'تطوير الواجهات الأمامية (React / Vue / Angular)', textEn: 'Frontend development (React, Vue, Angular)', dimensionTag: 'SKILLS' },
      { key: 'fu_spec_backend',   order: 2, textAr: 'تطوير الخوادم (Node.js / Python / Java / Go)', textEn: 'Backend development (Node.js, Python, Java, Go)', dimensionTag: 'SKILLS' },
      { key: 'fu_spec_mobile',    order: 3, textAr: 'تطوير التطبيقات المحمولة (iOS / Android)', textEn: 'Mobile development (iOS, Android)', dimensionTag: 'SKILLS' },
      { key: 'fu_spec_data_ml',   order: 4, textAr: 'علم البيانات / التعلم الآلي', textEn: 'Data Science / Machine Learning', dimensionTag: 'SKILLS' },
      { key: 'fu_spec_devops',    order: 5, textAr: 'DevOps / البنية التحتية السحابية', textEn: 'DevOps / Cloud Infrastructure', dimensionTag: 'SKILLS' },
      { key: 'fu_spec_systems',   order: 6, textAr: 'أنظمة مدمجة / برمجة منخفضة المستوى', textEn: 'Embedded / Systems programming', dimensionTag: 'SKILLS' },
    ],
  },
  // FU-2: Low programming rating → learning commitment
  {
    key: 'fu_prog_commitment',
    stageNumber: 3,
    dimension: 'SKILLS' as const,
    type: 'RATING_SCALE' as const,
    isBaseline: false,
    order: 11,
    textAr: 'ما مدى التزامك بتطوير مهاراتك التقنية والبرمجية؟',
    textEn: 'How committed are you to developing your technical and programming skills?',
    hintAr: '1 = غير مهتم بالتقنية، 5 = ملتزم تماماً بالتعلم والتطور',
    hintEn: '1 = Not interested in tech, 5 = Fully committed to learning and growth',
    minAnswers: null,
    maxAnswers: null,
    maxFollowUpDepth: 1,
    options: [],
  },
  // FU-3: Data analysis skill selected → data tools depth
  {
    key: 'fu_data_tools',
    stageNumber: 3,
    dimension: 'SKILLS' as const,
    type: 'MULTI_SELECT' as const,
    isBaseline: false,
    order: 12,
    textAr: 'أي أدوات تحليل البيانات استخدمتها فعلاً؟',
    textEn: 'Which data analysis tools have you actually used?',
    hintAr: null,
    hintEn: null,
    minAnswers: 1,
    maxAnswers: 6,
    maxFollowUpDepth: 1,
    options: [
      { key: 'fu_dt_excel',   order: 1, textAr: 'Microsoft Excel (متقدم)', textEn: 'Microsoft Excel (advanced)', dimensionTag: 'SKILLS' },
      { key: 'fu_dt_python',  order: 2, textAr: 'Python (pandas / numpy / scikit-learn)', textEn: 'Python (pandas, numpy, scikit-learn)', dimensionTag: 'SKILLS' },
      { key: 'fu_dt_r',       order: 3, textAr: 'لغة R', textEn: 'R programming', dimensionTag: 'SKILLS' },
      { key: 'fu_dt_sql',     order: 4, textAr: 'SQL لتحليل البيانات', textEn: 'SQL for data analysis', dimensionTag: 'SKILLS' },
      { key: 'fu_dt_bi',      order: 5, textAr: 'Tableau / Power BI', textEn: 'Tableau / Power BI', dimensionTag: 'SKILLS' },
      { key: 'fu_dt_none',    order: 6, textAr: 'لم أستخدم أياً منها بعد', textEn: 'None of these yet', dimensionTag: 'SKILLS' },
    ],
  },
  // FU-4: Security problem chosen → security motivation depth
  {
    key: 'fu_security_motivation',
    stageNumber: 2,
    dimension: 'INTERESTS' as const,
    type: 'SINGLE_CHOICE' as const,
    isBaseline: false,
    order: 10,
    textAr: 'ما الذي يجذبك تحديداً نحو الأمن السيبراني؟',
    textEn: 'What specifically draws you toward cybersecurity?',
    hintAr: null,
    hintEn: null,
    maxFollowUpDepth: 1,
    options: [
      { key: 'fu_sec_challenge',    order: 1, textAr: 'التحدي الفكري في اكتشاف الثغرات', textEn: 'The intellectual challenge of finding vulnerabilities', dimensionTag: 'INTERESTS' },
      { key: 'fu_sec_protection',   order: 2, textAr: 'حماية المنظمات والأفراد', textEn: 'Protecting organizations and people', dimensionTag: 'INTERESTS' },
      { key: 'fu_sec_demand',       order: 3, textAr: 'الطلب الوظيفي العالي والرواتب', textEn: 'High job demand and compensation', dimensionTag: 'INTERESTS' },
      { key: 'fu_sec_offensive',    order: 4, textAr: 'الاختراق الأخلاقي والأمن الهجومي', textEn: 'Ethical hacking and offensive security', dimensionTag: 'INTERESTS' },
    ],
  },
  // FU-5: No portfolio → what's blocking
  {
    key: 'fu_portfolio_blocker',
    stageNumber: 6,
    dimension: 'MARKET_READINESS' as const,
    type: 'SINGLE_CHOICE' as const,
    isBaseline: false,
    order: 10,
    textAr: 'ما العائق الرئيسي الذي يمنعك من بناء محفظة أعمالك؟',
    textEn: 'What is the main barrier to building your portfolio?',
    hintAr: null,
    hintEn: null,
    maxFollowUpDepth: 1,
    options: [
      { key: 'fu_pb_ideas',      order: 1, textAr: 'لا أعرف ماذا أبني', textEn: "Don't know what to build", dimensionTag: 'MARKET_READINESS' },
      { key: 'fu_pb_time',       order: 2, textAr: 'لا وقت كافياً', textEn: 'Lack of time', dimensionTag: 'MARKET_READINESS' },
      { key: 'fu_pb_skills',     order: 3, textAr: 'أحتاج مهارات أكثر أولاً', textEn: 'Need more skills first', dimensionTag: 'MARKET_READINESS' },
      { key: 'fu_pb_presentation',order: 4, textAr: 'لا أعرف كيف أعرض عملي', textEn: "Don't know how to present my work", dimensionTag: 'MARKET_READINESS' },
      { key: 'fu_pb_unpublished', order: 5, textAr: 'لديّ مشاريع لكنها غير منشورة', textEn: 'Have projects but have not published them', dimensionTag: 'MARKET_READINESS' },
    ],
  },
  // FU-6: Financial motivation → financial goal
  {
    key: 'fu_financial_goal',
    stageNumber: 5,
    dimension: 'MOTIVATION' as const,
    type: 'SINGLE_CHOICE' as const,
    isBaseline: false,
    order: 10,
    textAr: 'ما الطموح المالي الذي يصف هدفك بشكل أفضل؟',
    textEn: 'Which financial ambition best describes your goal?',
    hintAr: null,
    hintEn: null,
    maxFollowUpDepth: 1,
    options: [
      { key: 'fu_fg_stable',    order: 1, textAr: 'دخل ثابت مع نمو تدريجي', textEn: 'Stable income with gradual growth', dimensionTag: 'MOTIVATION' },
      { key: 'fu_fg_highearner',order: 2, textAr: 'دور متخصص بمرتب مرتفع', textEn: 'High-earning specialist role', dimensionTag: 'MOTIVATION' },
      { key: 'fu_fg_equity',    order: 3, textAr: 'بناء ثروة من خلال ريادة الأعمال', textEn: 'Building wealth through entrepreneurship', dimensionTag: 'MOTIVATION' },
      { key: 'fu_fg_leadership',order: 4, textAr: 'منصب قيادي مع تعويض عالٍ', textEn: 'Leadership position with high compensation', dimensionTag: 'MOTIVATION' },
    ],
  },
]

// ─── Follow-up rules ─────────────────────────────────────────────────────────
// Defined as [triggerQuestionKey, triggerOptionKey|null, triggerCondition|null, followUpQuestionKey, reasonAr, reasonEn]
type FollowUpRule = {
  triggerQuestionKey: string
  triggerOptionKey: string | null
  triggerCondition: string | null
  followUpQuestionKey: string
  reasonAr: string
  reasonEn: string
  priority: number
}

const FOLLOW_UP_RULES: FollowUpRule[] = [
  {
    triggerQuestionKey: 'skl_programming',
    triggerOptionKey: null,
    triggerCondition: 'rating>=4',
    followUpQuestionKey: 'fu_prog_specialization',
    reasonAr: 'مستواك التقني المرتفع يستوجب تحديد التخصصات التي تتمتع بها',
    reasonEn: 'Your high technical rating warrants identifying your specific specializations',
    priority: 1,
  },
  {
    triggerQuestionKey: 'skl_programming',
    triggerOptionKey: null,
    triggerCondition: 'rating<=2',
    followUpQuestionKey: 'fu_prog_commitment',
    reasonAr: 'نريد فهم مدى اهتمامك بتطوير المهارات التقنية',
    reasonEn: 'We want to understand your interest in developing technical skills',
    priority: 2,
  },
  {
    triggerQuestionKey: 'skl_technical_set',
    triggerOptionKey: 'skl_ts_data_analysis',
    triggerCondition: null,
    followUpQuestionKey: 'fu_data_tools',
    reasonAr: 'ذكرت تحليل البيانات — نريد معرفة الأدوات التي تستخدمها',
    reasonEn: 'You mentioned data analysis — let\'s understand the tools you use',
    priority: 1,
  },
  {
    triggerQuestionKey: 'int_problem',
    triggerOptionKey: 'int_prob_security',
    triggerCondition: null,
    followUpQuestionKey: 'fu_security_motivation',
    reasonAr: 'اخترت الأمن السيبراني — نريد فهم ما يجذبك إليه تحديداً',
    reasonEn: 'You chose cybersecurity — let\'s understand what specifically draws you to it',
    priority: 1,
  },
  {
    triggerQuestionKey: 'mr_portfolio',
    triggerOptionKey: 'mr_port_none',
    triggerCondition: null,
    followUpQuestionKey: 'fu_portfolio_blocker',
    reasonAr: 'لمساعدتك بشكل أفضل، نريد فهم ما يمنعك من بناء محفظة أعمالك',
    reasonEn: 'To better help you, we want to understand what is blocking your portfolio',
    priority: 1,
  },
  {
    triggerQuestionKey: 'mot_driver',
    triggerOptionKey: 'mot_dr_financial',
    triggerCondition: null,
    followUpQuestionKey: 'fu_financial_goal',
    reasonAr: 'ذكرت النمو المالي — نريد تحديد طموحك بشكل أدق',
    reasonEn: 'You mentioned financial growth — let\'s clarify your specific ambition',
    priority: 1,
  },
]

// ─── Main seed function ──────────────────────────────────────────────────────

async function main() {
  console.log('🧭 Career Compass Seed — v' + VERSION)
  console.log('ℹ  Additive only — existing platform data will NOT be modified.\n')

  // ── 1. Create or find the version ──────────────────────────────────────
  let version = await prisma.compassVersion.findUnique({ where: { version: VERSION } })
  if (!version) {
    version = await prisma.compassVersion.create({
      data: { version: VERSION, isActive: true, publishedAt: new Date() },
    })
    console.log(`✓ Created CompassVersion ${VERSION} (id: ${version.id})`)
  } else {
    console.log(`↩ CompassVersion ${VERSION} already exists (id: ${version.id})`)
    // Ensure exactly one active version
    await prisma.compassVersion.updateMany({
      where: { id: { not: version.id }, isActive: true },
      data: { isActive: false },
    })
    await prisma.compassVersion.update({ where: { id: version.id }, data: { isActive: true } })
  }

  // ── 2. Create or upsert stages ─────────────────────────────────────────
  const stageIdByNumber: Record<number, string> = {}
  for (const s of STAGES) {
    const existing = await prisma.compassStage.findUnique({
      where: { versionId_stageNumber: { versionId: version.id, stageNumber: s.stageNumber } },
    })
    const stage = existing
      ? await prisma.compassStage.update({
          where: { id: existing.id },
          data: { titleAr: s.titleAr, titleEn: s.titleEn },
        })
      : await prisma.compassStage.create({
          data: { versionId: version.id, stageNumber: s.stageNumber, titleAr: s.titleAr, titleEn: s.titleEn },
        })
    stageIdByNumber[s.stageNumber] = stage.id
    console.log(`  ${existing ? '↩' : '✓'} Stage ${s.stageNumber}: ${s.titleAr}`)
  }

  // ── 3. Upsert all questions + options ──────────────────────────────────
  const allQuestions = [...QUESTIONS, ...FOLLOW_UP_QUESTIONS] as const

  const questionIdByKey: Record<string, string> = {}

  for (const q of allQuestions) {
    const stageId = stageIdByNumber[q.stageNumber]!
    const existing = await prisma.compassQuestion.findFirst({
      where: { versionId: version.id, stageId, textEn: q.textEn },
    })

    const maxFollowUpDepth = 'maxFollowUpDepth' in q ? q.maxFollowUpDepth : 0

    const question = existing
      ? await prisma.compassQuestion.update({
          where: { id: existing.id },
          data: {
            dimension: q.dimension,
            type: q.type,
            isBaseline: q.isBaseline,
            order: q.order,
            textAr: q.textAr,
            textEn: q.textEn,
            hintAr: q.hintAr ?? null,
            hintEn: q.hintEn ?? null,
            minAnswers: q.minAnswers ?? null,
            maxAnswers: q.maxAnswers ?? null,
            maxFollowUpDepth,
          },
        })
      : await prisma.compassQuestion.create({
          data: {
            versionId: version.id,
            stageId,
            dimension: q.dimension,
            type: q.type,
            isBaseline: q.isBaseline,
            order: q.order,
            textAr: q.textAr,
            textEn: q.textEn,
            hintAr: q.hintAr ?? null,
            hintEn: q.hintEn ?? null,
            minAnswers: q.minAnswers ?? null,
            maxAnswers: q.maxAnswers ?? null,
            maxFollowUpDepth,
          },
        })

    questionIdByKey[q.key] = question.id

    // Upsert options
    for (const opt of q.options) {
      const existingOpt = await prisma.compassOption.findFirst({
        where: { questionId: question.id, textEn: opt.textEn },
      })
      if (!existingOpt) {
        await prisma.compassOption.create({
          data: { questionId: question.id, textAr: opt.textAr, textEn: opt.textEn, order: opt.order },
        })
      } else {
        await prisma.compassOption.update({
          where: { id: existingOpt.id },
          data: { textAr: opt.textAr, order: opt.order },
        })
      }
    }

    console.log(`    ${existing ? '↩' : '✓'} Q[${q.key}]: ${q.textEn.slice(0, 60)}...`)
  }

  // ── 4. Upsert follow-up rules ──────────────────────────────────────────
  console.log('\n  Upserting follow-up rules...')
  for (const rule of FOLLOW_UP_RULES) {
    const triggerQId = questionIdByKey[rule.triggerQuestionKey]
    const followUpQId = questionIdByKey[rule.followUpQuestionKey]
    if (!triggerQId || !followUpQId) {
      console.warn(`  ⚠ Rule skipped — missing question key: trigger=${rule.triggerQuestionKey}, followUp=${rule.followUpQuestionKey}`)
      continue
    }

    // Find the trigger option ID if specified (match by textEn from question bank)
    let triggerOptionId: string | null = null
    if (rule.triggerOptionKey) {
      const triggerQuestionDef = allQuestions.find(q => q.key === rule.triggerQuestionKey)
      const optionDef = (triggerQuestionDef?.options as readonly { key: string; textEn: string }[])?.find(
        od => od.key === rule.triggerOptionKey,
      )
      if (optionDef) {
        const matchedOpt = await prisma.compassOption.findFirst({
          where: { questionId: triggerQId, textEn: optionDef.textEn },
        })
        triggerOptionId = matchedOpt?.id ?? null
      }
    }

    const existingRule = await prisma.compassFollowUpRule.findFirst({
      where: { triggerQuestionId: triggerQId, followUpQuestionId: followUpQId },
      // no versionId on CompassFollowUpRule — uniqueness by triggerQ + followUpQ pair
    })

    const fuQuestionDef = allQuestions.find(q => q.key === rule.followUpQuestionKey)
    const ruleDimension = (fuQuestionDef?.dimension ?? 'INTERESTS') as import('@prisma/client').CompassDimension

    if (!existingRule) {
      await prisma.compassFollowUpRule.create({
        data: {
          triggerQuestionId: triggerQId,
          triggerOptionId,
          triggerCondition: rule.triggerCondition,
          followUpQuestionId: followUpQId,
          dimension: ruleDimension,
          reasonAr: rule.reasonAr,
          reasonEn: rule.reasonEn,
          priority: rule.priority,
        },
      })
      console.log(`    ✓ Rule: ${rule.triggerQuestionKey} → ${rule.followUpQuestionKey}`)
    } else {
      await prisma.compassFollowUpRule.update({
        where: { id: existingRule.id },
        data: { triggerOptionId, triggerCondition: rule.triggerCondition, reasonAr: rule.reasonAr, reasonEn: rule.reasonEn, priority: rule.priority },
      })
      console.log(`    ↩ Rule: ${rule.triggerQuestionKey} → ${rule.followUpQuestionKey}`)
    }
  }

  // ── 5. Validate ───────────────────────────────────────────────────────
  const baselineCount = await prisma.compassQuestion.count({
    where: { versionId: version.id, isBaseline: true },
  })
  const followUpCount = await prisma.compassQuestion.count({
    where: { versionId: version.id, isBaseline: false },
  })
  const ruleCount = await prisma.compassFollowUpRule.count({
    where: { triggerQuestion: { versionId: version.id } },
  })

  console.log(`\n✅ Seed complete:`)
  console.log(`   • Baseline questions: ${baselineCount} (expected 24)`)
  console.log(`   • Follow-up questions: ${followUpCount} (expected 6)`)
  console.log(`   • Follow-up rules: ${ruleCount} (expected ${FOLLOW_UP_RULES.length})`)

  if (baselineCount !== 24) {
    throw new Error(`Baseline count mismatch: expected 24, got ${baselineCount}`)
  }

  console.log('\n⚠  IMPORTANT: Question wording in Arabic is PROPOSED and requires content-team review.')
  console.log('⚠  Scoring weights and career-fit thresholds are NOT implemented.')
  console.log('   All careerFitScore fields remain null until business rules are approved by CTO.\n')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
