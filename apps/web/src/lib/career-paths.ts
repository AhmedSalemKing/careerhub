export type CareerPathEntry = {
  id: string
  title: string
  titleAr: string
  level: string
  demand: string
  salary: string
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
      { id: "software-engineer", title: "Software Engineer", titleAr: "مهندس برمجيات", level: "Mid-Senior", demand: "Very High", salary: "12,000-30,000" },
      { id: "frontend-developer", title: "Frontend Developer", titleAr: "مطور واجهات", level: "Junior-Senior", demand: "Very High", salary: "8,000-25,000" },
      { id: "backend-developer", title: "Backend Developer", titleAr: "مطور خلفيات", level: "Junior-Senior", demand: "Very High", salary: "10,000-28,000" },
      { id: "fullstack-developer", title: "Full Stack Developer", titleAr: "مطور متكامل", level: "Mid-Senior", demand: "High", salary: "12,000-30,000" },
      { id: "mobile-developer", title: "Mobile App Developer", titleAr: "مطور تطبيقات موبايل", level: "Junior-Senior", demand: "High", salary: "10,000-25,000" },
      { id: "game-developer", title: "Game Developer", titleAr: "مطور ألعاب", level: "Mid-Senior", demand: "Medium", salary: "8,000-22,000" },
    ]
  },
  {
    category: "Cybersecurity",
    emoji: "🔐",
    color: "red",
    paths: [
      { id: "cybersecurity-analyst", title: "Cybersecurity Analyst", titleAr: "محلل أمن سيبراني", level: "Junior-Senior", demand: "Very High", salary: "12,000-35,000" },
      { id: "penetration-tester", title: "Penetration Tester", titleAr: "مختبر اختراق", level: "Mid-Senior", demand: "Very High", salary: "15,000-40,000" },
      { id: "network-security-engineer", title: "Network Security Engineer", titleAr: "مهندس أمن شبكات", level: "Mid-Senior", demand: "High", salary: "14,000-35,000" },
      { id: "soc-analyst", title: "SOC Analyst", titleAr: "محلل مركز العمليات الأمنية", level: "Junior-Mid", demand: "Very High", salary: "10,000-28,000" },
    ]
  },
  {
    category: "Networking & Cloud",
    emoji: "🌐",
    color: "green",
    paths: [
      { id: "network-engineer", title: "Network Engineer", titleAr: "مهندس شبكات", level: "Junior-Senior", demand: "High", salary: "10,000-28,000" },
      { id: "cloud-engineer", title: "Cloud Engineer", titleAr: "مهندس سحابي", level: "Mid-Senior", demand: "Very High", salary: "14,000-35,000" },
      { id: "devops-engineer", title: "DevOps Engineer", titleAr: "مهندس DevOps", level: "Mid-Senior", demand: "Very High", salary: "15,000-38,000" },
      { id: "sre-engineer", title: "Site Reliability Engineer", titleAr: "مهندس موثوقية الموقع", level: "Senior", demand: "High", salary: "18,000-45,000" },
    ]
  },
  {
    category: "Data & AI",
    emoji: "📊",
    color: "purple",
    paths: [
      { id: "data-analyst", title: "Data Analyst", titleAr: "محلل بيانات", level: "Junior-Senior", demand: "Very High", salary: "8,000-25,000" },
      { id: "data-scientist", title: "Data Scientist", titleAr: "عالم بيانات", level: "Mid-Senior", demand: "Very High", salary: "15,000-40,000" },
      { id: "ml-engineer", title: "Machine Learning Engineer", titleAr: "مهندس تعلم آلي", level: "Senior", demand: "Very High", salary: "18,000-45,000" },
      { id: "ai-engineer", title: "AI Engineer", titleAr: "مهندس ذكاء اصطناعي", level: "Senior", demand: "Very High", salary: "20,000-50,000" },
      { id: "bi-analyst", title: "Business Intelligence Analyst", titleAr: "محلل ذكاء الأعمال", level: "Junior-Senior", demand: "High", salary: "8,000-22,000" },
    ]
  },
  {
    category: "Design & Creative",
    emoji: "🎨",
    color: "pink",
    paths: [
      { id: "ui-designer", title: "UI Designer", titleAr: "مصمم واجهات", level: "Junior-Senior", demand: "High", salary: "7,000-20,000" },
      { id: "ux-designer", title: "UX Designer", titleAr: "مصمم تجربة مستخدم", level: "Junior-Senior", demand: "High", salary: "8,000-22,000" },
      { id: "product-designer", title: "Product Designer", titleAr: "مصمم منتجات", level: "Mid-Senior", demand: "High", salary: "10,000-28,000" },
      { id: "motion-designer", title: "Motion Graphics Designer", titleAr: "مصمم موشن جرافيك", level: "Junior-Senior", demand: "Medium", salary: "6,000-18,000" },
    ]
  },
  {
    category: "Business & Management",
    emoji: "📈",
    color: "amber",
    paths: [
      { id: "business-analyst", title: "Business Analyst", titleAr: "محلل أعمال", level: "Junior-Senior", demand: "High", salary: "8,000-22,000" },
      { id: "product-manager", title: "Product Manager", titleAr: "مدير منتج", level: "Mid-Senior", demand: "Very High", salary: "15,000-40,000" },
      { id: "product-owner", title: "Product Owner", titleAr: "مالك المنتج", level: "Mid-Senior", demand: "High", salary: "12,000-30,000" },
      { id: "project-manager", title: "Project Manager", titleAr: "مدير مشاريع", level: "Mid-Senior", demand: "High", salary: "10,000-28,000" },
    ]
  },
  {
    category: "Marketing & Growth",
    emoji: "📣",
    color: "orange",
    paths: [
      { id: "digital-marketing", title: "Digital Marketing Specialist", titleAr: "أخصائي تسويق رقمي", level: "Junior-Senior", demand: "High", salary: "6,000-18,000" },
      { id: "performance-marketing", title: "Performance Marketing Specialist", titleAr: "أخصائي تسويق بالأداء", level: "Junior-Senior", demand: "Very High", salary: "8,000-22,000" },
      { id: "seo-specialist", title: "SEO Specialist", titleAr: "أخصائي SEO", level: "Junior-Senior", demand: "High", salary: "6,000-16,000" },
      { id: "content-strategist", title: "Content Strategist", titleAr: "استراتيجي المحتوى", level: "Junior-Senior", demand: "High", salary: "6,000-16,000" },
    ]
  },
  {
    category: "Hybrid Tech + Business 🔥",
    emoji: "🚀",
    color: "gradient",
    paths: [
      { id: "technical-pm", title: "Technical Product Manager", titleAr: "مدير منتج تقني", level: "Senior", demand: "Very High", salary: "20,000-50,000" },
      { id: "tech-consultant", title: "Tech Consultant", titleAr: "مستشار تقني", level: "Senior", demand: "High", salary: "18,000-45,000" },
      { id: "ai-product-specialist", title: "AI Product Specialist", titleAr: "أخصائي منتجات الذكاء الاصطناعي", level: "Senior", demand: "Very High", salary: "22,000-55,000" },
    ]
  },
]

export function findPathByTitle(titleEn: string): { path: CareerPathEntry; category: CareerCategory } | null {
  const normalized = titleEn.toLowerCase().trim()
  // Exact id match
  const slug = normalized.replace(/\s+/g, '-')
  for (const cat of CAREER_PATHS) {
    for (const p of cat.paths) {
      if (p.id === slug) return { path: p, category: cat }
    }
  }
  // Exact title match
  for (const cat of CAREER_PATHS) {
    for (const p of cat.paths) {
      if (p.title.toLowerCase() === normalized) return { path: p, category: cat }
    }
  }
  // Partial match
  for (const cat of CAREER_PATHS) {
    for (const p of cat.paths) {
      if (p.title.toLowerCase().includes(normalized) || normalized.includes(p.title.toLowerCase())) {
        return { path: p, category: cat }
      }
    }
  }
  return null
}
