import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function addCoaches() {
  const coachesData = [
    {
      email: 'ahmed.hassan@careerhub.com',
      firstName: 'أحمد',
      lastName: 'حسن',
      bioEn: 'Senior Software Engineer with 10+ years experience in web development. Specialized in React, Node.js, and cloud architecture.',
      bioAr: 'مهندس برمجيات أول بخبرة أكثر من 10 سنوات في تطوير الويب. متخصص في React و Node.js وهندسة السحابة.',
      specialties: ['Software Engineering', 'React', 'Node.js', 'Career Development'],
      hourlyRate: 50,
      currency: 'USD',
      experience: 10,
    },
    {
      email: 'sara.ahmed@careerhub.com',
      firstName: 'سارة',
      lastName: 'أحمد',
      bioEn: 'Business Analysis expert with MBA from AUC. 8 years experience helping professionals transition to business roles.',
      bioAr: 'خبيرة تحليل الأعمال حاصلة على ماجستير إدارة الأعمال. 8 سنوات خبرة في مساعدة المهنيين على الانتقال لأدوار الأعمال.',
      specialties: ['Business Analysis', 'Digital Transformation', 'Agile', 'Career Coaching'],
      hourlyRate: 45,
      currency: 'USD',
      experience: 8,
    },
    {
      email: 'omar.khalil@careerhub.com',
      firstName: 'عمر',
      lastName: 'خليل',
      bioEn: 'Data Science lead at a Fortune 500 company. Expert in ML, Python, and data strategy.',
      bioAr: 'قائد علم البيانات في شركة Fortune 500. خبير في التعلم الآلي وPython واستراتيجية البيانات.',
      specialties: ['Data Science', 'Machine Learning', 'Python', 'AI Strategy'],
      hourlyRate: 60,
      currency: 'USD',
      experience: 7,
    },
    {
      email: 'fatima.ali@careerhub.com',
      firstName: 'فاطمة',
      lastName: 'علي',
      bioEn: 'Digital Marketing director with proven track record in Egypt and Saudi Arabia. Expert in SEO, paid ads, and brand strategy.',
      bioAr: 'مديرة تسويق رقمي بسجل حافل في مصر والسعودية. خبيرة في تحسين محركات البحث والإعلانات المدفوعة واستراتيجية العلامة التجارية.',
      specialties: ['Digital Marketing', 'SEO', 'Social Media', 'Brand Strategy'],
      hourlyRate: 40,
      currency: 'USD',
      experience: 9,
    },
  ]

  for (const coach of coachesData) {
    const hashedPassword = await bcrypt.hash('Coach@123456!', 12)

    const user = await prisma.user.upsert({
      where: { email: coach.email },
      update: {},
      create: {
        email: coach.email,
        password: hashedPassword,
        role: 'COACH',
        profile: {
          create: {
            firstName: coach.firstName,
            lastName: coach.lastName,
            country: 'EG',
            language: 'ar',
          }
        }
      }
    })

    await prisma.coach.upsert({
      where: { userId: user.id },
      update: {
        bioEn: coach.bioEn,
        bioAr: coach.bioAr,
        specialties: coach.specialties,
        hourlyRate: coach.hourlyRate,
        currency: coach.currency,
        experience: coach.experience,
        isVerified: true,
        rating: 4.5 + Math.random() * 0.5,
        reviewCount: Math.floor(Math.random() * 50) + 20,
        availability: {},
      },
      create: {
        userId: user.id,
        bioEn: coach.bioEn,
        bioAr: coach.bioAr,
        specialties: coach.specialties,
        hourlyRate: coach.hourlyRate,
        currency: coach.currency,
        experience: coach.experience,
        isVerified: true,
        rating: 4.5 + Math.random() * 0.5,
        reviewCount: Math.floor(Math.random() * 50) + 20,
        availability: {},
      }
    })

    // Add available slots for next 30 days
    const slots = []
    for (let day = 1; day <= 30; day++) {
      const date = new Date()
      date.setDate(date.getDate() + day)
      if (date.getDay() !== 0 && date.getDay() !== 6) { // Skip weekends
        for (const hour of [10, 14, 16]) {
          const start = new Date(date)
          start.setHours(hour, 0, 0, 0)
          const end = new Date(date)
          end.setHours(hour + 1, 0, 0, 0)
          slots.push({ coachId: (await prisma.coach.findUnique({ where: { userId: user.id } }))!.id, startTime: start, endTime: end })
        }
      }
    }

    const coachRecord = await prisma.coach.findUnique({ where: { userId: user.id } })
    if (coachRecord) {
      for (const slot of slots) {
        await prisma.coachingSlot.create({
          data: {
            coachId: coachRecord.id,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isBooked: false,
          }
        })
      }
    }

    console.log(`✅ Coach added: ${coach.firstName} ${coach.lastName}`)
  }

  console.log('✅ All coaches added successfully!')
  await prisma.$disconnect()
}

addCoaches().catch(console.error)
