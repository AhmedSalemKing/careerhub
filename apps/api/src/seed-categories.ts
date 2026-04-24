const categories = {
  'البرمجة والتطوير': [
    'تطوير الويب الأمامي', 'تطوير الويب الخلفي', 'تطوير التطبيقات',
    'برمجة Python', 'برمجة JavaScript', 'برمجة Java', 'برمجة C++',
    'تطوير iOS', 'تطوير Android', 'Flutter وDart',
    'React وNext.js', 'Vue.js', 'Angular', 'Node.js',
    'قواعد البيانات', 'SQL وMySQL', 'MongoDB', 'PostgreSQL',
    'DevOps والسحابة', 'AWS', 'Docker وKubernetes',
    'الأمن السيبراني', 'اختبار الاختراق', 'البرمجة الكاملة',
    'الذكاء الاصطناعي', 'تعلم الآلة', 'معالجة البيانات',
    'Blockchain', 'Web3', 'Game Development',
  ],
  'التصميم والإبداع': [
    'تصميم UI/UX', 'تصميم الجرافيك', 'تصميم الشعارات',
    'Adobe Photoshop', 'Adobe Illustrator', 'Adobe XD', 'Figma',
    'تصميم الموشن جرافيك', 'After Effects', 'Premiere Pro',
    'تصميم الويب', 'تصميم التطبيقات', 'الهوية البصرية',
    'التصميم الداخلي', 'الرسم الرقمي', 'التصوير الفوتوغرافي',
    '3D Modeling', 'Blender', 'Maya', 'Cinema 4D',
    'تصميم الإنفوجرافيك', 'تصميم وسائل التواصل', 'Color Theory',
    'Typography', 'تصميم الحملات الإعلانية',
  ],
  'التسويق والأعمال الرقمية': [
    'التسويق الرقمي', 'SEO وتحسين محركات البحث', 'التسويق بالمحتوى',
    'إدارة وسائل التواصل الاجتماعي', 'Facebook Ads', 'Google Ads',
    'Email Marketing', 'Influencer Marketing', 'Affiliate Marketing',
    'التجارة الإلكترونية', 'Shopify', 'Amazon FBA',
    'إدارة العلامة التجارية', 'استراتيجية التسويق',
    'تحليل البيانات والتسويق', 'Google Analytics',
    'Copywriting', 'التسويق بالفيديو', 'Podcast Marketing',
    'Growth Hacking', 'CRM وإدارة العملاء',
    'التسويق عبر المؤثرين', 'Community Management',
  ],
  'إدارة الأعمال والتطوير المهني': [
    'ريادة الأعمال', 'إدارة المشاريع', 'PMP وإدارة المشاريع الاحترافية',
    'Agile وScrum', 'القيادة والإدارة', 'إدارة الفرق',
    'المحاسبة والمالية', 'التحليل المالي', 'الاستثمار والبورصة',
    'إدارة الموارد البشرية', 'التوظيف والاستقطاب',
    'مهارات التفاوض', 'مهارات التواصل', 'العرض والتقديم',
    'إنتاجية العمل', 'إدارة الوقت', 'تطوير الذات',
    'اللغة الإنجليزية للأعمال', 'الكتابة الاحترافية',
    'خدمة العملاء', 'المبيعات', 'التجارة الدولية',
    'الاستشارات المهنية', 'التدريب والتطوير', 'إدارة التغيير',
  ],
}

async function seedCategories() {
  const { PrismaClient } = require('@prisma/client')
  const prisma = new PrismaClient()
  
  let total = 0
  for (const [mainCat, subCats] of Object.entries(categories)) {
    const slug = mainCat.replace(/\s+/g, '-').replace(/[^\w\u0600-\u06FF-]/g, '')
    const main = await prisma.category.upsert({
      where: { slug },
      create: { nameAr: mainCat, nameEn: mainCat, slug },
      update: {},
    })
    
    for (const subCat of subCats) {
      const subSlug = subCat.replace(/\s+/g, '-').replace(/[^\w\u0600-\u06FF-]/g, '')
      try {
        await prisma.category.upsert({
          where: { slug: subSlug },
          create: { 
            nameAr: subCat, 
            nameEn: subCat,
            slug: subSlug,
            parentId: main.id 
          },
          update: { parentId: main.id },
        })
        total++
      } catch (e) {
        console.log('Skip:', subCat)
      }
    }
    console.log(`✓ ${mainCat}: ${(subCats as string[]).length} subcategories`)
  }
  
  console.log(`\n✅ Done! Seeded ${total} subcategories across 4 main categories`)
  await prisma.$disconnect()
}

seedCategories().catch(console.error)