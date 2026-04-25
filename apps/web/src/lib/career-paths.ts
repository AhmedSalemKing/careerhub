export type CareerPathEntry = {
  id: string
  title: string
  titleAr: string
  level: string
  demand: string
  salary: string
  descriptionAr?: string
  descriptionEn?: string
  tasks?: string[]
  skills?: string[]
  qualifications?: string[]
  kpis?: string[]
  progression?: string[]
}

export type CareerCategory = {
  category: string
  emoji: string
  color: string
  paths: CareerPathEntry[]
}

export const CAREER_PATHS: CareerCategory[] = [
  {
    category: "Technology & Development",
    emoji: "💻",
    color: "blue",
    paths: [
      { 
        id: "software-engineer", title: "Software Engineer", titleAr: "مهندس برمجيات", level: "Mid-Senior", demand: "Very High", salary: "12,000-30,000",
        descriptionAr: "مسؤول عن تصميم وتطوير الأنظمة ��لبرمجية الكاملة", descriptionEn: "Responsible for designing and developing complete software systems",
        skills: ["JavaScript/TypeScript", "Python/Java", "Git", "Databases", "REST APIs", "Docker", "Testing"],
        tasks: ["كتابة كود نظيف وقابل للصيانة", "تصميم архитектура التطبيقات", "مراجعة الكود", "إصلاح الأخطاء", "كتابة التوثيق", "التعاون مع الفريق"],
        qualifications: ["بكالوريوس في الحاسب الآلي", "خبرة 3+ سنوات", "إجادة لغة برمجة واحدة على الأقل", "فهم أنماط التصميم"],
        kpis: ["عدد الـ bugs", "وقت تسليم المهام", "تغطية الكود بالاختبارات"],
        progression: ["Junior Developer", "Mid Developer", "Senior Developer", "Tech Lead", "CTO"]
      },
      { 
        id: "frontend-developer", title: "Frontend Developer", titleAr: "مطور واجهات", level: "Junior-Senior", demand: "Very High", salary: "8,000-25,000",
        descriptionAr: "مسؤول عن تصميم وتطوير واجهات المستخدم التفاعلية", descriptionEn: "Responsible for designing and developing interactive user interfaces",
        skills: ["HTML/CSS", "JavaScript", "React/Vue", "TypeScript", "Git", "Figma", "REST APIs", "Responsive Design"],
        tasks: ["تطوير واجهات مستخدم تفاعلية", "ترجمة تصاميم UI/UX", "التعامل مع APIs", "تحسين الأداء", "ضمان التوافق مع المتصفحات"],
        qualifications: ["معرفة بـ HTML5, CSS3, JS", "خبرة في React أو Vue", "فهم TypeScript", "معرفة بـ Git"],
        kpis: ["Lighthouse Score", "زمن تحميل الصفحة", "عدد الـ bugs"],
        progression: ["Junior Developer", "Mid Developer", "Senior Developer", "Frontend Lead", "UI Director"]
      },
      { 
        id: "backend-developer", title: "Backend Developer", titleAr: "مطور خلفيات", level: "Junior-Senior", demand: "Very High", salary: "10,000-28,000",
        descriptionAr: "مسؤول عن بناء وتطوير الأنظمة الخلفية وقواعد البيانات", descriptionEn: "Responsible for building and developing backend systems and databases",
        skills: ["Node.js/Python", "SQL/NoSQL", "REST APIs", "Docker", "AWS", "Security", "Caching"],
        tasks: ["تصميم وبناء APIs", "إدارة قواعد البيانات", "تطوير منطق الأعمال", "ضمان أمان التطبيق", "نشر التطبيقات"],
        qualifications: ["خبرة في Node.js أو Python", "إجادة SQL", "معرفة بـ Docker", "فهم أساسيات الأمان"],
        kpis: ["زمن استجابة API", "Uptime", "أداء قاعدة البيانات"],
        progression: ["Junior Backend", "Mid Backend", "Senior Backend", "Backend Lead", "CTO"]
      },
      { 
        id: "fullstack-developer", title: "Full Stack Developer", titleAr: "مطور متكامل", level: "Mid-Senior", demand: "High", salary: "12,000-30,000",
        descriptionAr: "مطور يتعامل مع الواجهة الأمامية والخلفية معاً", descriptionEn: "Developer working on both frontend and backend",
        skills: ["JavaScript", "Node.js", "React", "Databases", "Git", "Cloud", "Testing"],
        tasks: ["تطوير كامل للتطبيقات", "العمل على APIs", "إدارة قواعد البيانات", "نشر وصيانة التطبيقات"],
        qualifications: ["خبرة في frontend و backend", "فهم cycle حياة التطبيق", "معرفة بـ DevOps basics"],
        kpis: ["سرعة التطوير", "جودة الكود", "عدد المهام المكتملة"],
        progression: ["Junior Developer", "Full Stack Developer", "Senior Developer", "Tech Lead", "Architect"]
      },
      { 
        id: "mobile-developer", title: "Mobile App Developer", titleAr: "مطور تطبيقات موبايل", level: "Junior-Senior", demand: "High", salary: "10,000-25,000",
        descriptionAr: "مسؤول عن تطوير تطبيقات الهواتف المحمولة", descriptionEn: "Responsible for developing mobile phone applications",
        skills: ["React Native/Flutter", "iOS/Android", "JavaScript/Dart", "APIs", "State Management"],
        tasks: ["تطوير تطبيقات iOS و Android", "دمج APIs", "تحسين أداء التطبيقات", "مراجعة واختبار التطبيقات"],
        qualifications: ["خبرة في React Native أو Flutter", "فهم native development", "معرفة بـ mobile guidelines"],
        kpis: ["أداء التطبيق", "crash rate", "تقييم المستخدمين"],
        progression: ["Junior Mobile Dev", "Mobile Developer", "Senior Mobile", "Mobile Lead", "Mobile Director"]
      },
      { 
        id: "game-developer", title: "Game Developer", titleAr: "مطور ألعاب", level: "Mid-Senior", demand: "Medium", salary: "8,000-22,000",
        descriptionAr: "مسؤول عن تطوير ألعاب الفيديو", descriptionEn: "Responsible for developing video games",
        skills: ["Unity/Unreal", "C#/C++", "Game Design", "3D Graphics", "Physics"],
        tasks: ["تطوير gameplay", "تصميم مستويات", "برمجة الذكاء الاصطناعي", "تحسين الأداء"],
        qualifications: ["خبرة في Unity أو Unreal", "فهم game loops", "مهارات تصميم"],
        kpis: ["FPS", "game size", "user retention"],
        progression: ["Junior Game Dev", "Game Developer", "Senior Game Dev", "Lead Designer", "Creative Director"]
      },
    ]
  },
  {
    category: "Cybersecurity",
    emoji: "🔐",
    color: "red",
    paths: [
      { 
        id: "cybersecurity-analyst", title: "Cybersecurity Analyst", titleAr: "محلل أمن سيبراني", level: "Junior-Senior", demand: "Very High", salary: "12,000-35,000",
        descriptionAr: "مسؤول عن حماية الأنظمة من التهديدات", descriptionEn: "Responsible for protecting systems from threats",
        skills: ["Network Security", "SIEM", "Threat Analysis", "Incident Response", "Penetration Testing"],
        tasks: ["مراقبة الأنظمة", "تحليل التهديدات", "الاستجابة للحوادث", "كتابة التقارير"],
        qualifications: ["شهادة Security+", "فهم الشبكات", "خبرة في SIEM"],
        kpis: ["MTTD", "MTTR", "عدد الحوادث"],
        progression: ["Security Analyst", "Senior Analyst", "Security Lead", "Security Manager", "CISO"]
      },
      { 
        id: "penetration-tester", title: "Penetration Tester", titleAr: "مختبر اختراق", level: "Mid-Senior", demand: "Very High", salary: "15,000-40,000",
        descriptionAr: "متخصص في اختبار اختراق الأنظمة", descriptionEn: "Specialist in penetration testing",
        skills: ["Ethical Hacking", "Metasploit", "Burp Suite", "OWASP", "Python scripting"],
        tasks: ["اختبار الاختراق", "كتابة تقارير الثغرات", "تقييم الأمان", "تقديم التوصيات"],
        qualifications: ["شهادة CEH أو OSCP", "فهم deep networking", "مهارات script"],
        kpis: ["عدد الثغرات", "جودة التقارير", "زمن الاختبار"],
        progression: ["Junior Pentester", "Pentester", "Senior Pentester", "Team Lead", "Security Consultant"]
      },
      { 
        id: "network-security-engineer", title: "Network Security Engineer", titleAr: "مهندس أمن شبكات", level: "Mid-Senior", demand: "High", salary: "14,000-35,000",
        descriptionAr: "متخصص في أمن الشبكات", descriptionEn: "Network security specialist",
        skills: ["Firewall", "VPN", "IDS/IPS", "Network Protocols", "Cisco/Juniper"],
        tasks: ["تصميم أمن الشبكات", "إدارة firewalls", "مراقبة الشبكة", "استجابة للحوادث"],
        qualifications: ["شهادة CCNA Security", "فهم networking protocols", "خبرة مع vendor"],
        kpis: ["network uptime", "عدد المحاولات", "أمنية"],
        progression: ["Junior Network Eng", "Network Security Eng", "Senior Eng", "Security Architect", "CISO"]
      },
      { 
        id: "soc-analyst", title: "SOC Analyst", titleAr: "محلل مركز العمليات الأمنية", level: "Junior-Mid", demand: "Very High", salary: "10,000-28,000",
        descriptionAr: "مراقبة وتحليل الأحداث الأمنية", descriptionEn: "Monitoring and analyzing security events",
        skills: ["SIEM", "Log Analysis", "Threat Intelligence", "Incident Response", "Forensics"],
        tasks: ["مراقبة alerts", "تحليل logs", "التصعيد عند الحاجة", "الكتابة"],
        qualifications: ["فهم security fundamentals", "خبرة في SIEM tools", "مهارات تحليلية"],
        kpis: ["alert quality", "false positive rate", "response time"],
        progression: ["Tier 1 Analyst", "Tier 2 Analyst", "Tier 3 Analyst", "SOC Lead", "SOC Manager"]
      },
    ]
  },
  {
    category: "Networking & Cloud",
    emoji: "🌐",
    color: "green",
    paths: [
      { 
        id: "network-engineer", title: "Network Engineer", titleAr: "مهندس شبكات", level: "Junior-Senior", demand: "High", salary: "10,000-28,000",
        descriptionAr: "تصميم وإدارة شبكات الحاسوب", descriptionEn: "Designing and managing computer networks",
        skills: ["Cisco/Juniper", "TCP/IP", "LAN/WAN", "Routing", "Switching"],
        tasks: ["تصميم الشبكات", "إدارة الأجهزة", "حل المشاكل", "التوثيق"],
        qualifications: ["شهادة CCNA", "فهم networking", "خبرة مع vendors"],
        kpis: ["network uptime", "latency", "المشاكل resolved"],
        progression: ["Junior Network Eng", "Network Eng", "Senior Network Eng", "Network Architect", "IT Director"]
      },
      { 
        id: "cloud-engineer", title: "Cloud Engineer", titleAr: "مهندس سحابي", level: "Mid-Senior", demand: "Very High", salary: "14,000-35,000",
        descriptionAr: "إدارة البنية التحتية السحابية", descriptionEn: "Managing cloud infrastructure",
        skills: ["AWS/Azure/GCP", "Terraform", "Kubernetes", "CI/CD", "Monitoring"],
        tasks: ["إدارة الخدمات السحابية", "أتمتة infrastructure", "optimizing costs", "الأمان"],
        qualifications: ["شهادة cloud provider", "فهم DevOps", "خبرة في containers"],
        kpis: ["cost optimization", "uptime", "deployment success"],
        progression: ["Cloud Eng", "Senior Cloud Eng", "Cloud Architect", "Cloud Director", "VP Infrastructure"]
      },
      { 
        id: "devops-engineer", title: "DevOps Engineer", titleAr: "مهندس DevOps", level: "Mid-Senior", demand: "Very High", salary: "15,000-38,000",
        descriptionAr: "أتمتة عمليات التطوير والنشر", descriptionEn: "Automating development and deployment processes",
        skills: ["Docker", "Kubernetes", "CI/CD", "Terraform", "Linux", "Monitoring", "Scripting"],
        tasks: ["بناء pipelines", "إدارة infrastructure", "تحسين CI/CD", "مراقبة الأنظمة"],
        qualifications: ["خبرة في Docker و Kubernetes", "فهم CI/CD", "مهارات scripting"],
        kpis: ["deployment time", "success rate", "downtime"],
        progression: ["Junior DevOps", "DevOps Engineer", "Senior DevOps", "Platform Lead", "Head of Infra"]
      },
      { 
        id: "sre-engineer", title: "Site Reliability Engineer", titleAr: "مهندس موثوقية الموقع", level: "Senior", demand: "High", salary: "18,000-45,000",
        descriptionAr: "ضمان موثوقية وقوة الأنظمة", descriptionEn: "Ensuring system reliability and resilience",
        skills: ["SRE principles", "Monitoring", "Incident Response", "Automation", "Performance"],
        tasks: ["مراقبة reliability", "تحليل incidents", "تحسين SLIs/SLOs", "التوثيق"],
        qualifications: ["فهم SRE", "خبرة في monitoring", "مهارات تحليلية متقدمة"],
        kpis: ["SLO compliance", "MTTR", "error budget"],
        progression: ["Junior SRE", "SRE", "Senior SRE", "SRE Lead", "Director of SRE"]
      },
    ]
  },
  {
    category: "Data & AI",
    emoji: "📊",
    color: "purple",
    paths: [
      { 
        id: "data-analyst", title: "Data Analyst", titleAr: "محلل بيانات", level: "Junior-Senior", demand: "Very High", salary: "8,000-25,000",
        descriptionAr: "تحليل البيانات واستخراج الرؤى", descriptionEn: "Analyzing data and extracting insights",
        skills: ["SQL", "Python/R", "Excel", "Tableau/PowerBI", "Statistics"],
        tasks: ["تحليل البيانات", "إنشاء ��قارير", "visualization", "تنظيف البيانات"],
        qualifications: ["فهم statistics", "خبرة في SQL", "مهارات Excel"],
        kpis: ["دقة التحليل", "وقت التقرير", "رضا stakeholders"],
        progression: ["Junior Analyst", "Data Analyst", "Senior Analyst", "Analytics Lead", "Head of Analytics"]
      },
      { 
        id: "data-scientist", title: "Data Scientist", titleAr: "عالم بيانات", level: "Mid-Senior", demand: "Very High", salary: "15,000-40,000",
        descriptionAr: "بناء نماذج تعلم آلي واستخراج رؤى", descriptionEn: "Building ML models and extracting insights",
        skills: ["Python", "Machine Learning", "TensorFlow/PyTorch", "SQL", "Statistics", "Deep Learning"],
        tasks: ["بناء نماذج ML", "تحليل البيانات", "نشر النماذج", "تحسين الأداء"],
        qualifications: ["بكالوريوس في إحصاء/حاسب", "إجادة Python", "فهم ML algorithms"],
        kpis: ["دقة النماذج", "قيمة الأعمال", "نشر النماذج"],
        progression: ["Junior Data Scientist", "Data Scientist", "Senior DS", "Lead DS", "Chief Data Officer"]
      },
      { 
        id: "ml-engineer", title: "Machine Learning Engineer", titleAr: "مهندس تعلم آلي", level: "Senior", demand: "Very High", salary: "18,000-45,000",
        descriptionAr: "تصميم وبناء أنظمة تعلم آلي", descriptionEn: "Designing and building ML systems",
        skills: ["ML Frameworks", "Python", "MLOps", "Cloud ML", "Distributed Computing"],
        tasks: ["بناء pipelines ML", "نشر النماذج", "تحسين الأداء", "العمل مع البيانات"],
        qualifications: ["خبرة في ML engineering", "فهم MLOps", "مهارات cloud"],
        kpis: ["model latency", "accuracy", "deployment frequency"],
        progression: ["ML Engineer", "Senior ML Eng", "ML Lead", "ML Architect", "VP of ML"]
      },
      { 
        id: "ai-engineer", title: "AI Engineer", titleAr: "مهندس ذكاء اصطناعي", level: "Senior", demand: "Very High", salary: "20,000-50,000",
        descriptionAr: "تطوير أنظمة الذكاء الاصطناعي المتقدمة", descriptionEn: "Developing advanced AI systems",
        skills: ["LLMs", "Prompt Engineering", "Vector DBs", "Python", "MLOps", "RAG"],
        tasks: ["بناء تطبيقات AI", "التعامل مع LLMs", "تحسين prompts", "الإنتاجية"],
        qualifications: ["فهم LLMs", "خبرة في NLP", "مهارات engineering متقدمة"],
        kpis: ["response quality", "latency", "cost efficiency"],
        progression: ["AI Engineer", "Senior AI Eng", "AI Lead", "AI Architect", "Chief AI Officer"]
      },
      { 
        id: "bi-analyst", title: "Business Intelligence Analyst", titleAr: "محلل ذكاء الأعمال", level: "Junior-Senior", demand: "High", salary: "8,000-22,000",
        descriptionAr: "تحليل بيانات الأعمال لدعم القرارات", descriptionEn: "Analyzing business data to support decisions",
        skills: ["SQL", "BI Tools", "Data Modeling", "Excel", "Business Acumen"],
        tasks: ["إنشاء dashboards", "تحليل KPIs", "تقارير الأعمال", "دعم القرارات"],
        qualifications: ["فهم business", "خبرة في BI tools", "مهارات SQL"],
        kpis: ["dashboard usage", "decision support", "report delivery"],
        progression: ["BI Analyst", "Senior BI", "BI Lead", "BI Manager", "Director of BI"]
      },
    ]
  },
  {
    category: "Design & Creative",
    emoji: "🎨",
    color: "pink",
    paths: [
      { 
        id: "ui-designer", title: "UI Designer", titleAr: "مصمم واجهات", level: "Junior-Senior", demand: "High", salary: "7,000-20,000",
        descriptionAr: "تصميم واجهات المستخدم البصرية", descriptionEn: "Designing visual user interfaces",
        skills: ["Figma", "Adobe XD", "UI Principles", "Typography", "Color Theory", "Prototyping"],
        tasks: ["تصميم واجهات", "إنشاء prototypes", "التعاون مع UX", "توثيق التصميم"],
        qualifications: ["فهم UI principles", "إجادة Figma", "بورتفوليو"],
        kpis: ["design consistency", "iteration speed", "developer handoff"],
        progression: ["Junior UI Designer", "UI Designer", "Senior UI", "Design Lead", "Head of Design"]
      },
      { 
        id: "ux-designer", title: "UX Designer", titleAr: "مصمم تجربة مستخدم", level: "Junior-Senior", demand: "High", salary: "8,000-22,000",
        descriptionAr: "تصميم تجربة المستخدم الشاملة", descriptionEn: "Designing comprehensive user experience",
        skills: ["User Research", "Wireframing", "Prototyping", "Usability Testing", "Figma"],
        tasks: ["بحث المستخدم", "إنشاء wireframes", "اختبار قابلية الاستخدام", "تحليل البيانات"],
        qualifications: ["فهم UX methodology", "خبرة في research", "مهارات تحليلية"],
        kpis: ["user satisfaction", "task completion rate", "research impact"],
        progression: ["Junior UX", "UX Designer", "Senior UX", "UX Lead", "Head of UX"]
      },
      { 
        id: "product-designer", title: "Product Designer", titleAr: "مصمم منتجات", level: "Mid-Senior", demand: "High", salary: "10,000-28,000",
        descriptionAr: "تصميم منتج كامل من الفكرة للتنفيذ", descriptionEn: "Designing complete products from idea to implementation",
        skills: ["UI/UX", "Design Systems", "User Research", "Prototyping", "Figma", "Animation"],
        tasks: ["تصميم منتج شامل", "بناء design systems", "التعاون مع product", "المقاييس"],
        qualifications: ["فهم product lifecycle", "خبرة في UI/UX", "مهارات تواصل"],
        kpis: ["product metrics", "design system adoption", "cross-functional impact"],
        progression: ["Product Designer", "Senior Product Designer", "Lead Product Designer", "Design Director", "CPO"]
      },
      { 
        id: "motion-designer", title: "Motion Graphics Designer", titleAr: "مصمم موشن جرافيك", level: "Junior-Senior", demand: "Medium", salary: "6,000-18,000",
        descriptionAr: "إنشاء الرسوم المتحركة للمشاريع", descriptionEn: "Creating animated graphics for projects",
        skills: ["After Effects", "Cinema 4D", "Animation Principles", "Timing", "Storytelling"],
        tasks: ["إنشاء animations", "motion graphics", "visual effects", "video editing"],
        qualifications: ["إجادة After Effects", "فهم animation principles", "بورتفوليو"],
        kpis: ["animation quality", "delivery time", "client satisfaction"],
        progression: ["Junior Motion", "Motion Designer", "Senior Motion", "Motion Lead", "Creative Director"]
      },
    ]
  },
  {
    category: "Business & Management",
    emoji: "📈",
    color: "amber",
    paths: [
      { 
        id: "business-analyst", title: "Business Analyst", titleAr: "محلل أعمال", level: "Junior-Senior", demand: "High", salary: "8,000-22,000",
        descriptionAr: "تحليل احتياجات الأعمال وترجمتها لمتطلبات تقنية", descriptionEn: "Analyzing business needs and translating to technical requirements",
        skills: ["Requirements Analysis", "Process Modeling", "Data Analysis", "JIRA", "Stakeholder Management"],
        tasks: ["جمع المتطلبات", "تحليل العمليات", "كتابة docs", "التواصل مع stakeholders"],
        qualifications: ["فهم business analysis", "مهارات تحليلية", "إجادة JIRA"],
        kpis: ["requirements quality", "project success", "stakeholder satisfaction"],
        progression: ["Junior BA", "Business Analyst", "Senior BA", "BA Lead", "Head of BA"]
      },
      { 
        id: "product-manager", title: "Product Manager", titleAr: "مدير منتج", level: "Mid-Senior", demand: "Very High", salary: "15,000-40,000",
        descriptionAr: "قيادة رؤية وتخطيط المنتج", descriptionEn: "Leading product vision and planning",
        skills: ["Product Strategy", "Agile/Scrum", "Data Analysis", "User Research", "Roadmapping", "Prioritization"],
        tasks: ["تحديد رؤية المنتج", "إدارة backlog", "تحليل المستخدمين", "التعاون مع teams"],
        qualifications: ["فهم product management", "خبرة في Agile", "مهارات اتخاذ قرار"],
        kpis: ["product growth", "user satisfaction", "on-time delivery"],
        progression: ["Associate PM", "Product Manager", "Senior PM", "Group PM", "VP Product", "CPO"]
      },
      { 
        id: "product-owner", title: "Product Owner", titleAr: "مالك المنتج", level: "Mid-Senior", demand: "High", salary: "12,000-30,000",
        descriptionAr: "إدارة backlog وتحديد أولويات المنتج", descriptionEn: "Managing backlog and prioritizing product",
        skills: ["Scrum", "User Stories", "Prioritization", "Stakeholder Management", "Agile"],
        tasks: ["إدارة backlog", "كتابة user stories", "قبول criteria", "التواصل مع team"],
        qualifications: ["شهادة CSPO", "فهم Scrum", "مهارات تحليل"],
        kpis: ["backlog grooming", "sprint delivery", "user story quality"],
        progression: ["Product Owner", "Senior PO", "Scrum Master", "Agile Coach", "Agile Director"]
      },
      { 
        id: "project-manager", title: "Project Manager", titleAr: "مدير مشاريع", level: "Mid-Senior", demand: "High", salary: "10,000-28,000",
        descriptionAr: "إدارة وتنفيذ المشاريع", descriptionEn: "Managing and executing projects",
        skills: ["Project Management", "Planning", "Risk Management", "Communication", "Budgeting"],
        tasks: ["تخطيط المشاريع", "إدارة الموارد", "تتبع المخاطر", "التقارير"],
        qualifications: ["شهادة PMP", "فهم project management", "مهارات تواصل"],
        kpis: ["on-time delivery", "budget adherence", "stakeholder satisfaction"],
        progression: ["Assistant PM", "Project Manager", "Senior PM", "Program Manager", "Director of PMO"]
      },
    ]
  },
  {
    category: "Marketing & Growth",
    emoji: "📣",
    color: "orange",
    paths: [
      { 
        id: "digital-marketing", title: "Digital Marketing Specialist", titleAr: "أخصائي تسويق رقمي", level: "Junior-Senior", demand: "High", salary: "6,000-18,000",
        descriptionAr: "تخطيط وتنفيذ استراتيجيات التسويق الرقمي", descriptionEn: "Planning and executing digital marketing strategies",
        skills: ["SEO/SEM", "Google Ads", "Meta Ads", "Content Marketing", "Analytics", "Social Media"],
        tasks: ["إدارة الحملات", "تحسين SEO", "تحليل البيانات", "إنشاء المحتوى"],
        qualifications: ["فهم digital marketing", "شهادات Google", "مهارات تحليلية"],
        kpis: ["conversion rate", "ROI", "traffic growth"],
        progression: ["Marketing Coordinator", "Marketing Specialist", "Senior Specialist", "Marketing Manager", "CMO"]
      },
      { 
        id: "performance-marketing", title: "Performance Marketing Specialist", titleAr: "أخصائي تسويق بالأداء", level: "Junior-Senior", demand: "Very High", salary: "8,000-22,000",
        descriptionAr: "تحسين حملات الإعلانات المبنية على الأداء", descriptionEn: "Optimizing performance-based advertising campaigns",
        skills: ["Paid Ads", "A/B Testing", "Analytics", "Conversion Optimization", "Retargeting"],
        tasks: ["إدارة paid campaigns", "تحسين conversion", "retargeting", "التقارير"],
        qualifications: ["خبرة في paid ads", "فهم attribution", "مهارات تحليل"],
        kpis: ["CPA", "ROAS", "conversion rate"],
        progression: ["Performance Marketer", "Senior PM", "Head of Performance", "Marketing Director", "CMO"]
      },
      { 
        id: "seo-specialist", title: "SEO Specialist", titleAr: "أخصائي SEO", level: "Junior-Senior", demand: "High", salary: "6,000-16,000",
        descriptionAr: "تحسين ظهور الموقع في محركات البحث", descriptionEn: "Improving website visibility in search engines",
        skills: ["Technical SEO", "Keyword Research", "Link Building", "Content Optimization", "Analytics"],
        tasks: ["تحليل SEO", "on-page optimization", "link building", "التقارير"],
        qualifications: ["فهم SEO principles", "خبرة في tools", "مهارات تحليل"],
        kpis: ["organic traffic", "keyword rankings", "domain authority"],
        progression: ["SEO Specialist", "Senior SEO", "SEO Lead", "Head of SEO", "Marketing Director"]
      },
      { 
        id: "content-strategist", title: "Content Strategist", titleAr: "استراتيجي المحتوى", level: "Junior-Senior", demand: "High", salary: "6,000-16,000",
        descriptionAr: "تطوير استراتيجيات المحتوى", descriptionEn: "Developing content strategies",
        skills: ["Content Strategy", "Copywriting", "SEO", "Content Calendar", "Analytics"],
        tasks: ["تطوير strategy", "إنشاء content calendar", "كتابة محتوى", "تحليل الأداء"],
        qualifications: ["فهم content marketing", "مهارات كتابة", "فهم SEO"],
        kpis: ["engagement rate", "traffic from content", "conversion rate"],
        progression: ["Content Strategist", "Senior Content", "Content Lead", "Content Director", "CMO"]
      },
    ]
  },
  {
    category: "Hybrid Tech + Business 🔥",
    emoji: "🚀",
    color: "gradient",
    paths: [
      { 
        id: "technical-pm", title: "Technical Product Manager", titleAr: "مدير منتج تقني", level: "Senior", demand: "Very High", salary: "20,000-50,000",
        descriptionAr: "مدير منتج بفهم تقني عميق", descriptionEn: "Product manager with deep technical understanding",
        skills: ["Technical Background", "Product Management", "System Design", "Agile", "Data Analysis"],
        tasks: ["تحديد المنتج التقني", "التعاون مع engineering", "تحليل trade-offs", "تخطيط"],
        qualifications: ["خبرة engineering", "فهم product management", "مهارات تحليلية"],
        kpis: ["technical accuracy", "product success", "team efficiency"],
        progression: ["Technical PM", "Senior TPM", "Director of TPM", "VP Product", "CPO"]
      },
      { 
        id: "tech-consultant", title: "Tech Consultant", titleAr: "مستشار تقني", level: "Senior", demand: "High", salary: "18,000-45,000",
        descriptionAr: "تقديم استشارات تقنية للشركات", descriptionEn: "Providing technical consulting to companies",
        skills: ["Technical Expertise", "Communication", "Problem Solving", "Architecture", "Advisory"],
        tasks: ["تقديم استشارات", "تحليل requirements", "تصميم solutions", "التدريب"],
        qualifications: ["خبرة تقنية عميقة", "مهارات تواصل متقدمة", "فهم business"],
        kpis: ["client satisfaction", "project success", "repeat business"],
        progression: ["Consultant", "Senior Consultant", "Principal Consultant", "Managing Consultant", "Partner"]
      },
      { 
        id: "ai-product-specialist", title: "AI Product Specialist", titleAr: "أخصائي منتجات الذكاء الاصطناعي", level: "Senior", demand: "Very High", salary: "22,000-55,000",
        descriptionAr: "متخصص في منتجات وحلول الذكاء الاصطناعي", descriptionEn: "Specialist in AI products and solutions",
        skills: ["AI/ML Understanding", "Product Management", "Technical Writing", "Demo Skills", "Sales Support"],
        tasks: ["تحديد فرص AI", "تحديد المتطلبات", "دعم المبيعات", "التدريب"],
        qualifications: ["فهم AI/ML", "مهارات product", "قدرة على شرح تقني"],
        kpis: ["product adoption", "customer success", "revenue impact"],
        progression: ["AI Specialist", "Senior Specialist", "AI Product Lead", "AI Director", "Chief AI Officer"]
      },
    ]
  },
]

export function findPathByTitle(titleEn: string): { path: CareerPathEntry; category: CareerCategory } | null {
  const normalized = titleEn.toLowerCase().trim()
  const slug = normalized.replace(/\s+/g, '-')
  for (const cat of CAREER_PATHS) {
    for (const p of cat.paths) {
      if (p.id === slug) return { path: p, category: cat }
    }
  }
  for (const cat of CAREER_PATHS) {
    for (const p of cat.paths) {
      if (p.title.toLowerCase() === normalized) return { path: p, category: cat }
    }
  }
  for (const cat of CAREER_PATHS) {
    for (const p of cat.paths) {
      if (p.title.toLowerCase().includes(normalized) || normalized.includes(p.title.toLowerCase())) {
        return { path: p, category: cat }
      }
    }
  }
  return null
}