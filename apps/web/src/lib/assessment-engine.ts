export type CareerTrack = 
  'frontend' | 'backend' | 'fullstack' | 'mobile' | 'devops' |
  'data-science' | 'ai-ml' | 'cybersecurity' | 'ui-ux' | 'graphic-design' |
  'digital-marketing' | 'seo' | 'content' | 'product-manager' |
  'business-analyst' | 'project-manager' | 'sales' | 'entrepreneur'

export interface QuestionOption {
  textAr: string
  textEn: string
  weights: Partial<Record<CareerTrack, number>>
}

export interface Question {
  id: string
  category: 'interests' | 'skills' | 'personality' | 'values' | 'experience'
  phaseAr: string
  phaseEn: string
  textAr: string
  textEn: string
  options: QuestionOption[]
}

export interface CareerScore {
  track: CareerTrack
  score: number
  normalized: number
  titleAr: string
  titleEn: string
  icon: string
  learnUrl: string
}

export const TRACK_META: Record<CareerTrack, { titleAr: string, titleEn: string, icon: string, category: string }> = {
  'frontend': { titleAr: 'مطور واجهات أمامية', titleEn: 'Frontend Developer', icon: 'code', category: 'tech' },
  'backend': { titleAr: 'مطور خلفي', titleEn: 'Backend Developer', icon: 'code', category: 'tech' },
  'fullstack': { titleAr: 'مطور متكامل', titleEn: 'Full Stack Developer', icon: 'code', category: 'tech' },
  'mobile': { titleAr: 'مطور تطبيقات موبايل', titleEn: 'Mobile Developer', icon: 'code', category: 'tech' },
  'devops': { titleAr: 'مهندس DevOps', titleEn: 'DevOps Engineer', icon: 'devops', category: 'tech' },
  'data-science': { titleAr: 'عالم بيانات', titleEn: 'Data Scientist', icon: 'data', category: 'tech' },
  'ai-ml': { titleAr: 'مهندس ذكاء اصطناعي', titleEn: 'AI/ML Engineer', icon: 'data', category: 'tech' },
  'cybersecurity': { titleAr: 'متخصص أمن سيبراني', titleEn: 'Cybersecurity Specialist', icon: 'security', category: 'tech' },
  'ui-ux': { titleAr: 'مصمم UI/UX', titleEn: 'UI/UX Designer', icon: 'design', category: 'design' },
  'graphic-design': { titleAr: 'مصمم جرافيك', titleEn: 'Graphic Designer', icon: 'design', category: 'design' },
  'digital-marketing': { titleAr: 'متخصص تسويق رقمي', titleEn: 'Digital Marketer', icon: 'marketing', category: 'marketing' },
  'seo': { titleAr: 'متخصص SEO', titleEn: 'SEO Specialist', icon: 'marketing', category: 'marketing' },
  'content': { titleAr: 'منشئ محتوى', titleEn: 'Content Creator', icon: 'marketing', category: 'marketing' },
  'product-manager': { titleAr: 'مدير منتج', titleEn: 'Product Manager', icon: 'product', category: 'business' },
  'business-analyst': { titleAr: 'محلل أعمال', titleEn: 'Business Analyst', icon: 'business', category: 'business' },
  'project-manager': { titleAr: 'مدير مشاريع', titleEn: 'Project Manager', icon: 'business', category: 'business' },
  'sales': { titleAr: 'مدير مبيعات', titleEn: 'Sales Manager', icon: 'business', category: 'business' },
  'entrepreneur': { titleAr: 'رائد أعمال', titleEn: 'Entrepreneur', icon: 'business', category: 'business' },
}

export const QUESTION_BANK: Question[] = [
  {
    id: 'q_interest_1',
    category: 'interests',
    phaseAr: 'الاهتمامات',
    phaseEn: 'Interests',
    textAr: 'ما الذي يجذبك أكثر في عالم التقنية والأعمال',
    textEn: 'What attracts you most in the world of tech and business?',
    options: [
      { textAr: 'بناء تطبيقات وكتابة الكود', textEn: 'Building apps and writing code',
        weights: { frontend: 3, backend: 3, fullstack: 2, mobile: 2 } },
      { textAr: 'تصميم تجارب مستخدم جميلة', textEn: 'Designing beautiful user experiences',
        weights: { 'ui-ux': 3, 'graphic-design': 2, frontend: 1 } },
      { textAr: 'تحليل البيانات واستخراج الأنماط', textEn: 'Analyzing data and finding patterns',
        weights: { 'data-science': 3, 'ai-ml': 2, 'business-analyst': 1 } },
      { textAr: 'قيادة الأعمال وبناء الاستراتيجيات', textEn: 'Leading businesses and building strategies',
        weights: { entrepreneur: 3, 'product-manager': 2, 'project-manager': 2, sales: 1 } },
    ]
  },
  {
    id: 'q_interest_2',
    category: 'interests',
    phaseAr: 'الاهتمامات',
    phaseEn: 'Interests',
    textAr: 'في وقت فراغك ما الذي تجد نفسك منجذبا إليه',
    textEn: 'In your free time, what do you find yourself drawn to?',
    options: [
      { textAr: 'تعلم لغات برمجة أو بناء مشاريع تقنية', textEn: 'Learning programming languages or building tech projects',
        weights: { frontend: 2, backend: 2, fullstack: 2, devops: 1 } },
      { textAr: 'الرسم والتصميم والمحتوى البصري', textEn: 'Drawing, design and visual content',
        weights: { 'ui-ux': 2, 'graphic-design': 3, content: 1 } },
      { textAr: 'قراءة عن الأعمال والاستثمار والريادة', textEn: 'Reading about business, investment and entrepreneurship',
        weights: { entrepreneur: 3, 'product-manager': 1, 'business-analyst': 2, sales: 1 } },
      { textAr: 'إنشاء محتوى ومتابعة التسويق الرقمي', textEn: 'Creating content and following digital marketing',
        weights: { 'digital-marketing': 3, content: 2, seo: 2 } },
    ]
  },
  {
    id: 'q_interest_3',
    category: 'interests',
    phaseAr: 'الاهتمامات',
    phaseEn: 'Interests',
    textAr: 'أي نوع من المشاريع يثير حماسك أكثر',
    textEn: 'Which type of project excites you most?',
    options: [
      { textAr: 'تطوير تطبيق موبايل أو موقع ويب', textEn: 'Developing a mobile app or website',
        weights: { mobile: 3, frontend: 2, fullstack: 2 } },
      { textAr: 'بناء نموذج ذكاء اصطناعي أو تحليل بيانات ضخمة', textEn: 'Building an AI model or analyzing big data',
        weights: { 'ai-ml': 3, 'data-science': 3, backend: 1 } },
      { textAr: 'إطلاق حملة تسويقية ناجحة', textEn: 'Launching a successful marketing campaign',
        weights: { 'digital-marketing': 3, content: 2, seo: 1 } },
      { textAr: 'تصميم هوية بصرية كاملة لعلامة تجارية', textEn: 'Designing a complete visual identity for a brand',
        weights: { 'graphic-design': 3, 'ui-ux': 2 } },
    ]
  },
  {
    id: 'q_skill_1',
    category: 'skills',
    phaseAr: 'المهارات',
    phaseEn: 'Skills',
    textAr: 'أي من هذه القدرات تعتبر نفسك متميزا فيها',
    textEn: 'Which of these abilities do you consider yourself excellent at?',
    options: [
      { textAr: 'التفكير المنطقي وحل المشكلات بشكل منهجي', textEn: 'Logical thinking and solving problems systematically',
        weights: { backend: 3, 'data-science': 2, cybersecurity: 2, devops: 1 } },
      { textAr: 'الحس الجمالي والإبداع البصري', textEn: 'Aesthetic sense and visual creativity',
        weights: { 'ui-ux': 3, 'graphic-design': 3, frontend: 1 } },
      { textAr: 'التواصل والإقناع وبناء العلاقات', textEn: 'Communication, persuasion and relationship building',
        weights: { sales: 3, 'digital-marketing': 2, 'product-manager': 2, content: 1 } },
      { textAr: 'التخطيط والتنظيم وإدارة الموارد', textEn: 'Planning, organization and resource management',
        weights: { 'project-manager': 3, 'product-manager': 2, 'business-analyst': 2 } },
    ]
  },
  {
    id: 'q_skill_2',
    category: 'skills',
    phaseAr: 'المهارات',
    phaseEn: 'Skills',
    textAr: 'كيف تتعامل مع الأرقام والبيانات',
    textEn: 'How do you deal with numbers and data?',
    options: [
      { textAr: 'أحبها وأجيد تحليلها للوصول لرؤى قابلة للتطبيق', textEn: 'I love them and excel at analyzing for actionable insights',
        weights: { 'data-science': 3, 'ai-ml': 2, 'business-analyst': 3, 'digital-marketing': 1 } },
      { textAr: 'أستخدمها عند الحاجة في مجال العمل', textEn: 'I use them when needed in my work field',
        weights: { 'project-manager': 1, 'product-manager': 1, devops: 1 } },
      { textAr: 'أفضل العمل الإبداعي بعيدا عن الأرقام', textEn: 'I prefer creative work away from numbers',
        weights: { 'graphic-design': 2, 'ui-ux': 1, content: 2 } },
      { textAr: 'أستخدمها لفهم سلوك العملاء وتحسين الحملات', textEn: 'I use them to understand customer behavior and optimize campaigns',
        weights: { seo: 3, 'digital-marketing': 2, 'product-manager': 1 } },
    ]
  },
  {
    id: 'q_skill_3',
    category: 'skills',
    phaseAr: 'المهارات',
    phaseEn: 'Skills',
    textAr: 'ما مستوى خبرتك في البرمجة الحالية',
    textEn: 'What is your current programming experience level?',
    options: [
      { textAr: 'متقدم - أبني مشاريع حقيقية وأعمل بها', textEn: 'Advanced - I build real projects and work with them',
        weights: { fullstack: 3, backend: 2, frontend: 2, devops: 2, 'ai-ml': 1 } },
      { textAr: 'متوسط - تعلمت أساسيات وأريد التخصص', textEn: 'Intermediate - I learned basics and want to specialize',
        weights: { frontend: 2, backend: 2, mobile: 2, cybersecurity: 1 } },
      { textAr: 'مبتدئ - أريد تعلم البرمجة من الصفر', textEn: 'Beginner - I want to learn programming from scratch',
        weights: { frontend: 2, mobile: 1 } },
      { textAr: 'لست مبرمجا ولا أنوي ذلك', textEn: 'I\'m not a programmer and don\'t plan to be',
        weights: { 'ui-ux': 2, 'graphic-design': 2, 'digital-marketing': 2, 'product-manager': 1, entrepreneur: 1 } },
    ]
  },
  {
    id: 'q_skill_4',
    category: 'skills',
    phaseAr: 'المهارات',
    phaseEn: 'Skills',
    textAr: 'لو عندك يوم فاضي تتعلم فيه مهارة جديدة إيه اللي هتختاره',
    textEn: 'If you had a free day to learn a new skill, what would you choose?',
    options: [
      { textAr: 'تعلم إطار عمل برمجي جديد مثل React أو Flutter', textEn: 'Learning a new framework like React or Flutter',
        weights: { frontend: 3, mobile: 3, fullstack: 1 } },
      { textAr: 'تعلم تقنيات الأمن السيبراني واختبار الاختراق', textEn: 'Learning cybersecurity and penetration testing',
        weights: { cybersecurity: 4, devops: 1 } },
      { textAr: 'تعلم Python للذكاء الاصطناعي وتحليل البيانات', textEn: 'Learning Python for AI and data analysis',
        weights: { 'ai-ml': 4, 'data-science': 3, backend: 1 } },
      { textAr: 'تعلم Figma والتصميم لتجربة المستخدم', textEn: 'Learning Figma and UX design',
        weights: { 'ui-ux': 4, 'graphic-design': 2 } },
    ]
  },
  {
    id: 'q_personality_1',
    category: 'personality',
    phaseAr: 'الشخصية',
    phaseEn: 'Personality',
    textAr: 'كيف تصف أسلوبك في اتخاذ القرارات',
    textEn: 'How would you describe your decision-making style?',
    options: [
      { textAr: 'بناء على البيانات والحقائق والتحليل المنطقي', textEn: 'Based on data, facts and logical analysis',
        weights: { 'data-science': 2, 'business-analyst': 2, backend: 1, cybersecurity: 1 } },
      { textAr: 'بناء على الحدس والخبرة والإبداع', textEn: 'Based on intuition, experience and creativity',
        weights: { entrepreneur: 2, 'ui-ux': 2, 'graphic-design': 1, 'product-manager': 1 } },
      { textAr: 'أستشير الفريق وأجمع آراء متعددة', textEn: 'I consult the team and gather multiple opinions',
        weights: { 'project-manager': 3, 'product-manager': 2, sales: 1 } },
      { textAr: 'أجرب بسرعة وأتعلم من النتائج', textEn: 'I experiment quickly and learn from results',
        weights: { entrepreneur: 2, 'digital-marketing': 2, frontend: 1, devops: 1 } },
    ]
  },
  {
    id: 'q_personality_2',
    category: 'personality',
    phaseAr: 'الشخصية',
    phaseEn: 'Personality',
    textAr: 'في بيئة العمل أي من هذه الأدوار يناسبك أكثر',
    textEn: 'In a work environment, which role suits you most?',
    options: [
      { textAr: 'المنفذ الفني - أحل المشكلات التقنية المعقدة', textEn: 'Technical executor - I solve complex technical problems',
        weights: { backend: 3, fullstack: 2, devops: 2, cybersecurity: 2 } },
      { textAr: 'المبدع - أحول الأفكار لتصاميم ومحتوى', textEn: 'Creative - I turn ideas into designs and content',
        weights: { 'graphic-design': 3, 'ui-ux': 2, content: 3 } },
      { textAr: 'القائد - أوجه الفريق نحو الهدف', textEn: 'Leader - I guide the team towards the goal',
        weights: { 'project-manager': 3, 'product-manager': 2, entrepreneur: 2 } },
      { textAr: 'الاستراتيجي - أحلل السوق وأضع الخطط', textEn: 'Strategist - I analyze the market and make plans',
        weights: { 'business-analyst': 3, 'digital-marketing': 2, entrepreneur: 2, 'product-manager': 1 } },
    ]
  },
  {
    id: 'q_personality_3',
    category: 'personality',
    phaseAr: 'الشخصية',
    phaseEn: 'Personality',
    textAr: 'كيف تتعامل مع الفشل أو الإخفاق في مشروع',
    textEn: 'How do you handle failure or setbacks in a project?',
    options: [
      { textAr: 'أحلل السبب بشكل منهجي وأصلح الكود/العملية', textEn: 'I analyze the cause systematically and fix the code/process',
        weights: { backend: 2, devops: 2, 'data-science': 1 } },
      { textAr: 'أعيد التصميم من منظور جديد وأبدع مجدا', textEn: 'I redesign from a fresh perspective and create again',
        weights: { 'ui-ux': 2, 'graphic-design': 2, content: 1 } },
      { textAr: 'أتعلم من التجربة وأجرب نهجا مختلفا بسرعة', textEn: 'I learn from experience and try a different approach quickly',
        weights: { entrepreneur: 3, 'digital-marketing': 2, sales: 1 } },
      { textAr: 'أعيد التخطيط مع الفريق وأضع خطة تعاف', textEn: 'I replan with the team and make a recovery plan',
        weights: { 'project-manager': 3, 'product-manager': 2 } },
    ]
  },
  {
    id: 'q_value_1',
    category: 'values',
    phaseAr: 'القيم',
    phaseEn: 'Values',
    textAr: 'ما الذي يشعرك بالرضا والإنجاز في نهاية يوم العمل',
    textEn: 'What makes you feel satisfied and accomplished at end of workday?',
    options: [
      { textAr: 'إنهاء ميزة تقنية معقدة وتشغيلها بنجاح', textEn: 'Finishing a complex technical feature and running it successfully',
        weights: { backend: 3, frontend: 2, fullstack: 2, mobile: 2 } },
      { textAr: 'رؤية تصميم جميل اكتمل وأعجب به العملاء', textEn: 'Seeing a beautiful design completed and admired by clients',
        weights: { 'ui-ux': 3, 'graphic-design': 3 } },
      { textAr: 'تحقيق أهداف المبيعات أو نمو الجمهور', textEn: 'Achieving sales targets or audience growth',
        weights: { sales: 3, 'digital-marketing': 3, content: 1 } },
      { textAr: 'إنهاء قرار استراتيجي سيؤثر على المنتج أو الشركة', textEn: 'Completing a strategic decision that will impact the product or company',
        weights: { 'product-manager': 3, entrepreneur: 2, 'business-analyst': 2 } },
    ]
  },
  {
    id: 'q_value_2',
    category: 'values',
    phaseAr: 'القيم',
    phaseEn: 'Values',
    textAr: 'ما الأهمية التي تضعها للاستقرار مقابل المغامرة',
    textEn: 'How do you weigh stability vs adventure in your career?',
    options: [
      { textAr: 'أفضل الاستقرار - عمل ثابت براتب محدد', textEn: 'I prefer stability - stable job with fixed salary',
        weights: { backend: 1, devops: 1, cybersecurity: 1, 'project-manager': 1 } },
      { textAr: 'أوازن بين الاثنين - فرص نمو مع بعض الاستقرار', textEn: 'I balance both - growth opportunities with some stability',
        weights: { 'product-manager': 2, 'data-science': 1, 'digital-marketing': 1, frontend: 1 } },
      { textAr: 'أفضل المغامرة - ريادة أعمال ومشاريع مستقلة', textEn: 'I prefer adventure - entrepreneurship and freelance projects',
        weights: { entrepreneur: 4, 'graphic-design': 1, content: 1, sales: 1 } },
      { textAr: 'أريد العمل الحر مع دخل متعدد المصادر', textEn: 'I want freelance work with multiple income sources',
        weights: { 'graphic-design': 2, 'ui-ux': 1, 'digital-marketing': 2, content: 2, seo: 2 } },
    ]
  },
  {
    id: 'q_value_3',
    category: 'values',
    phaseAr: 'القيم',
    phaseEn: 'Values',
    textAr: 'ما هو الدخل المستهدف الذي تسعى إليه خلال 3 سنوات',
    textEn: 'What income level are you targeting within 3 years?',
    options: [
      { textAr: '5,000 - 10,000 دولار شهريا من عمل تقني', textEn: '$5,000 - $10,000/month from technical work',
        weights: { backend: 2, 'ai-ml': 2, 'data-science': 2, cybersecurity: 2, devops: 2 } },
      { textAr: '3,000 - 6,000 دولار شهريا من الإبداع والتصميم', textEn: '$3,000 - $6,000/month from creative and design work',
        weights: { 'ui-ux': 2, 'graphic-design': 2 } },
      { textAr: 'دخل غير محدود من ريادة أعمال أو مبيعات', textEn: 'Unlimited income from entrepreneurship or sales',
        weights: { entrepreneur: 3, sales: 3 } },
      { textAr: '2,000 - 5,000 دولار من التسويق الرقمي والمحتوى', textEn: '$2,000 - $5,000 from digital marketing and content',
        weights: { 'digital-marketing': 2, content: 2, seo: 2 } },
    ]
  },
  {
    id: 'q_exp_1',
    category: 'experience',
    phaseAr: 'الخلفية',
    phaseEn: 'Background',
    textAr: 'ما خلفيتك الدراسية أو المهنية الحالية',
    textEn: 'What is your educational or professional background?',
    options: [
      { textAr: 'هندسة حاسبات أو تقنية معلومات', textEn: 'Computer Engineering or Information Technology',
        weights: { backend: 2, fullstack: 2, devops: 2, cybersecurity: 2, 'ai-ml': 2 } },
      { textAr: 'فنون تطبيقية أو تصميم جرافيك', textEn: 'Applied Arts or Graphic Design',
        weights: { 'graphic-design': 3, 'ui-ux': 2, content: 1 } },
      { textAr: 'إدارة أعمال أو تجارة أو اقتصاد', textEn: 'Business Administration, Commerce or Economics',
        weights: { 'business-analyst': 2, 'product-manager': 2, entrepreneur: 2, 'project-manager': 2, sales: 2 } },
      { textAr: 'خلفية مختلفة أو لا خبرة سابقة', textEn: 'Different background or no prior experience',
        weights: { frontend: 1, 'digital-marketing': 1, content: 1, 'ui-ux': 1 } },
    ]
  },
  {
    id: 'q_exp_2',
    category: 'experience',
    phaseAr: 'الخلفية',
    phaseEn: 'Background',
    textAr: 'هل سبق لك العمل في أي من هذه المجالات ولو بشكل جزئي',
    textEn: 'Have you worked in any of these fields even partially?',
    options: [
      { textAr: 'نعم - عملت في تطوير برمجيات أو تقنية', textEn: 'Yes - I worked in software development or tech',
        weights: { backend: 2, frontend: 2, fullstack: 2, devops: 1 } },
      { textAr: 'نعم - عملت في التصميم أو الإعلام أو المحتوى', textEn: 'Yes - I worked in design, media or content',
        weights: { 'graphic-design': 2, 'ui-ux': 2, content: 2, 'digital-marketing': 1 } },
      { textAr: 'نعم - عملت في المبيعات أو التسويق أو الأعمال', textEn: 'Yes - I worked in sales, marketing or business',
        weights: { sales: 2, 'digital-marketing': 2, entrepreneur: 1, 'product-manager': 1 } },
      { textAr: 'لا - أنا في بداية مسيرتي المهنية', textEn: 'No - I\'m at the beginning of my career',
        weights: { frontend: 1, 'digital-marketing': 1, 'ui-ux': 1 } },
    ]
  },
  {
    id: 'q_exp_3',
    category: 'experience',
    phaseAr: 'الخلفية',
    phaseEn: 'Background',
    textAr: 'لو خيرت بين هذه الأدوات أيها تختار',
    textEn: 'If given a choice between these tools, which would you choose?',
    options: [
      { textAr: 'VS Code وأدوات البرمجة', textEn: 'VS Code and programming tools',
        weights: { frontend: 3, backend: 3, fullstack: 3, mobile: 2 } },
      { textAr: 'Figma وAdobe Suite للتصميم', textEn: 'Figma and Adobe Suite for design',
        weights: { 'ui-ux': 3, 'graphic-design': 3 } },
      { textAr: 'Google Analytics وأدوات التسويق', textEn: 'Google Analytics and marketing tools',
        weights: { 'digital-marketing': 3, seo: 3, 'product-manager': 1 } },
      { textAr: 'Excel وPowerPoint وأدوات الأعمال', textEn: 'Excel, PowerPoint and business tools',
        weights: { 'business-analyst': 3, 'project-manager': 2, entrepreneur: 1 } },
    ]
  },
  {
    id: 'q_adaptive_tech_1',
    category: 'skills',
    phaseAr: 'التخصص التقني',
    phaseEn: 'Tech Specialization',
    textAr: 'في مجال التقنية ما الذي يثير اهتمامك أكثر',
    textEn: 'In tech, what interests you the most?',
    options: [
      { textAr: 'تطوير واجهات المستخدم وتجربة المستخدم البصرية', textEn: 'Frontend development and visual user experience',
        weights: { frontend: 4, 'ui-ux': 2 } },
      { textAr: 'تطوير الخوادم وقواعد البيانات والـ APIs', textEn: 'Server development, databases and APIs',
        weights: { backend: 4, fullstack: 1 } },
      { textAr: 'أمان الأنظمة والشبكات واختبار الاختراق', textEn: 'System security, networks and penetration testing',
        weights: { cybersecurity: 5, devops: 1 } },
      { textAr: 'نشر التطبيقات والسحابة والأتمتة', textEn: 'App deployment, cloud and automation',
        weights: { devops: 5, backend: 1 } },
    ]
  },
  {
    id: 'q_adaptive_tech_2',
    category: 'skills',
    phaseAr: 'التخصص التقني',
    phaseEn: 'Tech Specialization',
    textAr: 'ما الذي يصف طموحك في مجال الذكاء الاصطناعي والبيانات',
    textEn: 'What describes your ambition in AI and data?',
    options: [
      { textAr: 'بناء نماذج تعلم آلي وذكاء اصطناعي', textEn: 'Building machine learning and AI models',
        weights: { 'ai-ml': 5, 'data-science': 2 } },
      { textAr: 'تحليل البيانات وإنشاء لوحات معلومات', textEn: 'Analyzing data and creating dashboards',
        weights: { 'data-science': 5, 'business-analyst': 2 } },
      { textAr: 'هندسة البيانات وبناء pipelines', textEn: 'Data engineering and building pipelines',
        weights: { 'data-science': 3, backend: 2, devops: 1 } },
      { textAr: 'لا أميل لمجال الذكاء الاصطناعي والبيانات', textEn: 'I don\'t lean towards AI and data fields',
        weights: { frontend: 1, 'ui-ux': 1, 'digital-marketing': 1 } },
    ]
  },
  {
    id: 'q_adaptive_creative_1',
    category: 'skills',
    phaseAr: 'التخصص الإبداعي',
    phaseEn: 'Creative Specialization',
    textAr: 'في مجال التصميم ما الذي تشعر بأنك بارع فيه',
    textEn: 'In design, what do you feel you are good at?',
    options: [
      { textAr: 'تصميم تجارب المستخدم وبحوث UX', textEn: 'UX design and user research',
        weights: { 'ui-ux': 5, 'product-manager': 1 } },
      { textAr: 'تصميم الهويات البصرية والمطبوعات', textEn: 'Visual identity and print design',
        weights: { 'graphic-design': 5 } },
      { textAr: 'الحركة والموشن جرافيك', textEn: 'Motion graphics and animation',
        weights: { 'graphic-design': 3, content: 2 } },
      { textAr: 'إنشاء محتوى بصري للسوشيال ميديا', textEn: 'Creating visual content for social media',
        weights: { content: 4, 'digital-marketing': 2 } },
    ]
  },
  {
    id: 'q_adaptive_business_1',
    category: 'skills',
    phaseAr: 'التخصص في الأعمال',
    phaseEn: 'Business Specialization',
    textAr: 'في مجال الأعمال ما الدور الذي تراك فيه بعد 5 سنوات',
    textEn: 'In business, what role do you see yourself in after 5 years?',
    options: [
      { textAr: 'مؤسس شركة ناشئة أو صاحب مشروع', textEn: 'Startup founder or business owner',
        weights: { entrepreneur: 5, 'product-manager': 1 } },
      { textAr: 'مدير منتج في شركة تقنية كبيرة', textEn: 'Product manager at a major tech company',
        weights: { 'product-manager': 5, 'business-analyst': 1 } },
      { textAr: 'مدير مشاريع أو برامج', textEn: 'Project or program manager',
        weights: { 'project-manager': 5 } },
      { textAr: 'مدير مبيعات أو تطوير أعمال', textEn: 'Sales manager or business development',
        weights: { sales: 5, entrepreneur: 1 } },
    ]
  },
  {
    id: 'q_adaptive_marketing_1',
    category: 'skills',
    phaseAr: 'التخصص في التسويق',
    phaseEn: 'Marketing Specialization',
    textAr: 'في مجال التسويق الرقمي ما الذي يثير شغفك أكثر',
    textEn: 'In digital marketing, what ignites your passion the most?',
    options: [
      { textAr: 'تحسين محركات البحث SEO وتحليل الكلمات المفتاحية', textEn: 'SEO optimization and keyword analysis',
        weights: { seo: 5, 'digital-marketing': 2 } },
      { textAr: 'إنشاء محتوى إبداعي وبناء جمهور', textEn: 'Creating creative content and building an audience',
        weights: { content: 5, 'digital-marketing': 1 } },
      { textAr: 'إدارة الإعلانات المدفوعة Google/Meta Ads', textEn: 'Managing paid ads Google/Meta Ads',
        weights: { 'digital-marketing': 5, seo: 1 } },
      { textAr: 'تحليل بيانات التسويق وتحسين معدلات التحويل', textEn: 'Analyzing marketing data and improving conversion rates',
        weights: { 'digital-marketing': 3, 'data-science': 2, 'product-manager': 1 } },
    ]
  },
]

export function selectAdaptiveQuestions(allQuestions: Question[], _answers: Record<string, number>, scores: Record<string, number>): Question[] {
  const coreIds = ['q_interest_1', 'q_interest_2', 'q_skill_1', 'q_personality_1', 'q_value_1', 'q_exp_1']
  const coreQuestions = allQuestions.filter(q => coreIds.includes(q.id))
  
  const topCategory = getTopCategory(scores)
  
  const adaptiveQ = allQuestions.filter(q => q.id.includes('adaptive'))
  const relevant = adaptiveQ.filter(q => {
    if (topCategory === 'tech') return q.id.includes('tech')
    if (topCategory === 'design') return q.id.includes('creative')
    if (topCategory === 'business') return q.id.includes('business')
    if (topCategory === 'marketing') return q.id.includes('marketing')
    return true
  })
  
  const general = allQuestions.filter(q =>
    !q.id.includes('adaptive') &&
    !coreQuestions.find(c => c.id === q.id)
  )
  
  const shuffled = [...general].sort(() => Math.random() - 0.5)
  const combined = [...coreQuestions, ...relevant, ...shuffled]
  
  const unique = combined.filter((q, i, arr) => arr.findIndex(x => x.id === q.id) === i)
  return unique.slice(0, 15)
}

function getTopCategory(scores: Record<string, number>): string {
  const techTracks = ['frontend', 'backend', 'fullstack', 'mobile', 'devops', 'cybersecurity', 'ai-ml', 'data-science']
  const designTracks = ['ui-ux', 'graphic-design']
  const marketingTracks = ['digital-marketing', 'seo', 'content']
  const businessTracks = ['product-manager', 'business-analyst', 'project-manager', 'sales', 'entrepreneur']
  
  const techScore = techTracks.reduce((sum, t) => sum + (scores[t] || 0), 0)
  const designScore = designTracks.reduce((sum, t) => sum + (scores[t] || 0), 0)
  const marketingScore = marketingTracks.reduce((sum, t) => sum + (scores[t] || 0), 0)
  const businessScore = businessTracks.reduce((sum, t) => sum + (scores[t] || 0), 0)
  
  const cats = [
    { name: 'tech', score: techScore },
    { name: 'design', score: designScore },
    { name: 'marketing', score: marketingScore },
    { name: 'business', score: businessScore },
  ]
  return cats.sort((a, b) => b.score - a.score)[0]?.name || 'tech'
}

export function calculateResults(questions: Question[], answers: Record<string, number>, locale: string = 'ar'): CareerScore[] {
  const rawScores: Record<string, number> = {}
  
  Object.entries(answers).forEach(([qId, answerIdx]) => {
    const question = questions.find(q => q.id === qId)
    if (!question) return
    const option = question.options[answerIdx]
    if (!option) return
    
    Object.entries(option.weights).forEach(([track, weight]) => {
      rawScores[track] = (rawScores[track] || 0) + weight
    })
  })
  
  const maxScore = Math.max(...Object.values(rawScores), 1)
  
  return Object.entries(rawScores)
    .map(([track, score]) => {
      const meta = TRACK_META[track as CareerTrack]
      return {
        track: track as CareerTrack,
        score,
        normalized: Math.round((score / maxScore) * 100),
        titleAr: meta?.titleAr || track,
        titleEn: meta?.titleEn || track,
        icon: meta?.icon || 'code',
        learnUrl: `https://deveway-teal.vercel.app/${locale}/courses?category=${meta?.category || 'tech'}`,
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
}