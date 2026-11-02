export const CAREER_PATH_SLUGS = [
  'software-engineering',
  'frontend-development',
  'backend-development',
  'fullstack-development',
  'mobile-development',
  'game-development',
  'data-science',
  'machine-learning',
  'data-engineering',
  'business-intelligence',
  'cybersecurity-analysis',
  'penetration-testing',
  'network-security',
  'soc-analysis',
  'network-engineering',
  'cloud-engineering',
  'devops',
  'site-reliability',
  'ui-design',
  'ux-design',
  'product-design',
  'motion-graphics',
  'business-analysis',
  'product-management',
  'product-ownership',
  'project-management',
  'digital-marketing',
  'performance-marketing',
  'seo',
  'content-strategy',
  'technical-pm',
  'technical-consulting',
  'ai-products',
]

export const PATH_CATEGORY_MAP: Record<string, string[]> = {
  'software-engineering':    ['برمجة', 'تطوير', 'software', 'programming', 'development', 'backend', 'frontend', 'fullstack'],
  'frontend-development':    ['واجهات', 'frontend', 'react', 'vue', 'html', 'css', 'javascript', 'ui', 'web'],
  'backend-development':     ['خلفيات', 'backend', 'node', 'python', 'java', 'api', 'database', 'server'],
  'fullstack-development':   ['متكامل', 'fullstack', 'full-stack', 'web', 'react', 'node', 'برمجة'],
  'mobile-development':      ['موبايل', 'mobile', 'flutter', 'react-native', 'ios', 'android', 'تطبيقات'],
  'game-development':        ['ألعاب', 'game', 'unity', 'unreal', 'gaming', 'gamedev'],
  'data-science':            ['بيانات', 'data', 'python', 'statistics', 'ml', 'ai', 'تعلم آلي', 'ذكاء'],
  'machine-learning':        ['تعلم آلي', 'machine learning', 'deep learning', 'neural', 'ai', 'python', 'tensorflow'],
  'data-engineering':        ['هندسة بيانات', 'data engineering', 'spark', 'hadoop', 'pipeline', 'etl', 'sql'],
  'business-intelligence':   ['ذكاء أعمال', 'bi', 'business intelligence', 'tableau', 'powerbi', 'sql', 'analytics'],
  'cybersecurity-analysis':  ['أمن', 'security', 'cybersecurity', 'threat', 'siem', 'سيبراني'],
  'penetration-testing':     ['اختراق', 'penetration', 'ethical hacking', 'pentest', 'burp', 'metasploit', 'أمن'],
  'network-security':        ['أمن شبكات', 'network security', 'firewall', 'vpn', 'ids', 'شبكات', 'أمن'],
  'soc-analysis':            ['soc', 'security operations', 'siem', 'threat intelligence', 'أمن', 'مراقبة'],
  'network-engineering':     ['شبكات', 'network', 'cisco', 'routing', 'switching', 'tcp', 'lan', 'wan'],
  'cloud-engineering':       ['سحابي', 'cloud', 'aws', 'azure', 'gcp', 'terraform', 'kubernetes'],
  'devops':                  ['devops', 'docker', 'kubernetes', 'ci/cd', 'jenkins', 'automation', 'deployment'],
  'site-reliability':        ['sre', 'reliability', 'monitoring', 'devops', 'automation', 'infrastructure'],
  'ui-design':               ['تصميم', 'ui', 'figma', 'adobe', 'design', 'واجهات', 'بصري'],
  'ux-design':               ['تجربة مستخدم', 'ux', 'user research', 'wireframe', 'prototype', 'usability', 'تصميم'],
  'product-design':          ['تصميم منتج', 'product design', 'ui', 'ux', 'figma', 'design system', 'تصميم'],
  'motion-graphics':         ['موشن', 'motion', 'after effects', 'animation', 'cinema 4d', 'رسوم متحركة'],
  'business-analysis':       ['تحليل أعمال', 'business analysis', 'requirements', 'process', 'jira', 'بيزنس'],
  'product-management':      ['إدارة منتج', 'product management', 'agile', 'scrum', 'roadmap', 'strategy'],
  'product-ownership':       ['product owner', 'scrum', 'backlog', 'user stories', 'agile', 'إدارة'],
  'project-management':      ['إدارة مشاريع', 'project management', 'pmp', 'prince2', 'planning', 'risk'],
  'digital-marketing':       ['تسويق', 'marketing', 'seo', 'social media', 'content', 'google ads', 'meta ads'],
  'performance-marketing':   ['performance', 'paid ads', 'a/b testing', 'conversion', 'roas', 'تسويق'],
  'seo':                     ['seo', 'search engine', 'keyword', 'backlink', 'technical seo', 'تحسين محركات'],
  'content-strategy':        ['محتوى', 'content', 'copywriting', 'storytelling', 'editorial', 'إنشاء'],
  'technical-pm':            ['technical product', 'tpm', 'system design', 'agile', 'technical', 'إدارة تقنية'],
  'technical-consulting':    ['استشارات', 'consulting', 'architecture', 'solution', 'technical', 'enterprise'],
  'ai-products':             ['ذكاء اصطناعي', 'ai', 'llm', 'prompt', 'gpt', 'artificial intelligence', 'منتجات ذكاء'],
}

export function getPathsForCategory(category: string): string[] {
  if (!category) return []
  const cat = category.toLowerCase()
  const matches: string[] = []
  for (const [pathSlug, keywords] of Object.entries(PATH_CATEGORY_MAP)) {
    if (keywords.some(kw => cat.includes(kw.toLowerCase()) || kw.toLowerCase().includes(cat))) {
      matches.push(pathSlug)
    }
  }
  return matches
}

export function getCategoriesForPaths(pathSlugs: string[]): string[] {
  const keywords: string[] = []
  for (const slug of pathSlugs) {
    const kws = PATH_CATEGORY_MAP[slug] ?? []
    keywords.push(...kws)
  }
  return Array.from(new Set(keywords))
}
