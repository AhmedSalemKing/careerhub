"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require('bcrypt');
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seeding...');
    await prisma.adminLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.chatMessage.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.coachReview.deleteMany();
    await prisma.coachingSession.deleteMany();
    await prisma.coachingSlot.deleteMany();
    await prisma.coach.deleteMany();
    await prisma.certificate.deleteMany();
    await prisma.lessonProgress.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.quizAttempt.deleteMany();
    await prisma.quizQuestion.deleteMany();
    await prisma.quiz.deleteMany();
    await prisma.videoContent.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.courseModule.deleteMany();
    await prisma.course.deleteMany();
    await prisma.assessmentQuestion.deleteMany();
    await prisma.careerAssessment.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.session.deleteMany();
    await prisma.careerPath.deleteMany();
    await prisma.user.deleteMany();
    const hashedAdminPassword = await bcrypt.hash('Admin@CareerHub2026!', 12);
    const adminUser = await prisma.user.create({
        data: {
            email: 'admin@careerhub.com',
            password: hashedAdminPassword,
            role: client_1.UserRole.ADMIN,
            isActive: true,
            profile: {
                create: {
                    firstName: 'Admin',
                    lastName: 'User',
                    phone: '+201234567890',
                    country: 'Egypt',
                    city: 'Cairo',
                    bio: 'System administrator',
                    language: 'en',
                    timezone: 'Africa/Cairo',
                },
            },
        },
    });
    const careerPaths = await Promise.all([
        prisma.careerPath.create({
            data: {
                slug: 'software-engineering',
                titleEn: 'Software Engineering',
                titleAr: 'هندسة البرمجيات',
                descriptionEn: 'Design, develop, and maintain software systems using modern programming languages and frameworks. Build scalable applications that solve real-world problems.',
                descriptionAr: 'تصميم وتطوير وصيانة أنظمة البرمجيات باستخدام لغات وأطر البرمجة الحديثة. بناء تطبيقات قابلة للتطوير تحل مشاكل العالم الحقيقي.',
                skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'SQL', 'Git', 'Docker', 'AWS'],
                salaryRangeEn: JSON.stringify({ min: 15000, max: 45000, currency: 'EGP' }),
                salaryRangeAr: JSON.stringify({ min: 2500, max: 8000, currency: 'SAR' }),
                jobTitlesEn: ['Software Developer', 'Full Stack Developer', 'Backend Developer', 'Frontend Developer', 'DevOps Engineer'],
                jobTitlesAr: ['مطور برمجيات', 'مطور Full Stack', 'مظهر Backend', 'مظهر Frontend', 'مهندس DevOps'],
                demandLevel: 'HIGH',
                icon: '💻',
                color: '#3B82F6',
                isActive: true,
                sortOrder: 1,
            },
        }),
        prisma.careerPath.create({
            data: {
                slug: 'data-science',
                titleEn: 'Data Science',
                titleAr: 'علم البيانات',
                descriptionEn: 'Extract insights from complex data using statistical analysis, machine learning, and data visualization. Help organizations make data-driven decisions.',
                descriptionAr: 'استخراج رؤى من البيانات المعقدة باستخدام التحليل الإحصائي والتعلم الآلي وتصور البيانات. مساعدة المؤسسات على اتخاذ قرارات قائمة على البيانات.',
                skills: ['Python', 'R', 'SQL', 'Machine Learning', 'Statistics', 'TensorFlow', 'Pandas', 'NumPy', 'Tableau', 'Power BI'],
                salaryRangeEn: JSON.stringify({ min: 18000, max: 55000, currency: 'EGP' }),
                salaryRangeAr: JSON.stringify({ min: 3000, max: 9500, currency: 'SAR' }),
                jobTitlesEn: ['Data Scientist', 'Data Analyst', 'ML Engineer', 'Business Intelligence Analyst', 'Research Scientist'],
                jobTitlesAr: ['عالم بيانات', 'محلل بيانات', 'مهندس تعلم الآلة', 'محلل ذكاء أعمال', 'عالم أبحاث'],
                demandLevel: 'HIGH',
                icon: '📊',
                color: '#10B981',
                isActive: true,
                sortOrder: 2,
            },
        }),
        prisma.careerPath.create({
            data: {
                slug: 'cybersecurity',
                titleEn: 'Cybersecurity',
                titleAr: 'الأمن السيبراني',
                descriptionEn: 'Protect digital systems, networks, and data from cyber threats. Implement security measures and respond to security incidents.',
                descriptionAr: 'حماية الأنظمة الرقمية والشبكات والبيانات من التهديدات السيبرانية. تطبيق تدابير الأمان والاستجابة للحوادث الأمنية.',
                skills: ['Network Security', 'Ethical Hacking', 'Cryptography', 'SIEM', 'Firewall Management', 'Incident Response', 'Compliance', 'Risk Assessment'],
                salaryRangeEn: JSON.stringify({ min: 20000, max: 60000, currency: 'EGP' }),
                salaryRangeAr: JSON.stringify({ min: 3500, max: 10000, currency: 'SAR' }),
                jobTitlesEn: ['Security Analyst', 'Penetration Tester', 'Security Engineer', 'Security Consultant', 'Chief Information Security Officer'],
                jobTitlesAr: ['محلل أمن', 'مختبر اختراق', 'مهندس أمن', 'استشاري أمن', 'رئيس أمن المعلومات'],
                demandLevel: 'HIGH',
                icon: '🔒',
                color: '#EF4444',
                isActive: true,
                sortOrder: 3,
            },
        }),
        prisma.careerPath.create({
            data: {
                slug: 'digital-marketing',
                titleEn: 'Digital Marketing',
                titleAr: 'التسويق الرقمي',
                descriptionEn: 'Create and execute marketing strategies across digital channels. Drive brand awareness and customer acquisition through online platforms.',
                descriptionAr: 'إنشاء وتنفيذ استراتيجيات التسويق عبر القنوات الرقمية. زيادة الوعي بالعلامة التجارية وجذب العملاء عبر المنصات الإلكترونية.',
                skills: ['SEO', 'SEM', 'Social Media Marketing', 'Content Marketing', 'Email Marketing', 'Google Analytics', 'Facebook Ads', 'Google Ads', 'Copywriting'],
                salaryRangeEn: JSON.stringify({ min: 12000, max: 35000, currency: 'EGP' }),
                salaryRangeAr: JSON.stringify({ min: 2000, max: 6000, currency: 'SAR' }),
                jobTitlesEn: ['Digital Marketing Specialist', 'Social Media Manager', 'SEO Specialist', 'Content Marketing Manager', 'Performance Marketing Manager'],
                jobTitlesAr: ['أخصائي تسويق رقمي', 'مدير وسائل التواصل الاجتماعي', 'أخصائي تحسين محركات البحث', 'مدير تسويق المحتوى', 'مدير تسويق الأداء'],
                demandLevel: 'MEDIUM',
                icon: '📱',
                color: '#F59E0B',
                isActive: true,
                sortOrder: 4,
            },
        }),
        prisma.careerPath.create({
            data: {
                slug: 'business-analysis',
                titleEn: 'Business Analysis',
                titleAr: 'تحليل الأعمال',
                descriptionEn: 'Bridge the gap between business needs and IT solutions. Analyze business processes and recommend improvements to drive efficiency.',
                descriptionAr: 'سد الفجوة بين احتياجات العمل وحلول تكنولوجيا المعلومات. تحليل عمليات العمل والتوصية بتحسينات لزيادة الكفاءة.',
                skills: ['Requirements Gathering', 'Process Modeling', 'Data Analysis', 'Stakeholder Management', 'Agile', 'Scrum', 'UML', 'SQL', 'Excel', 'PowerPoint'],
                salaryRangeEn: JSON.stringify({ min: 14000, max: 40000, currency: 'EGP' }),
                salaryRangeAr: JSON.stringify({ min: 2500, max: 7000, currency: 'SAR' }),
                jobTitlesEn: ['Business Analyst', 'Systems Analyst', 'Product Owner', 'Project Manager', 'Process Analyst'],
                jobTitlesAr: ['محلل أعمال', 'محلل أنظمة', 'مالك المنتج', 'مدير مشروع', 'محلل عمليات'],
                demandLevel: 'MEDIUM',
                icon: '💼',
                color: '#8B5CF6',
                isActive: true,
                sortOrder: 5,
            },
        }),
    ]);
    const coachUsers = await Promise.all([
        prisma.user.create({
            data: {
                email: 'ahmed.mohammed@careerhub.com',
                password: await bcrypt.hash('Coach123!', 12),
                role: client_1.UserRole.COACH,
                isActive: true,
                profile: {
                    create: {
                        firstName: 'Ahmed',
                        lastName: 'Mohammed',
                        phone: '+201012345678',
                        country: 'Egypt',
                        city: 'Cairo',
                        bio: 'Senior Software Engineer with 10+ years of experience in full-stack development and system architecture.',
                        language: 'en',
                        timezone: 'Africa/Cairo',
                    },
                },
            },
        }),
        prisma.user.create({
            data: {
                email: 'fatima.alali@careerhub.com',
                password: await bcrypt.hash('Coach123!', 12),
                role: client_1.UserRole.COACH,
                isActive: true,
                profile: {
                    create: {
                        firstName: 'Fatima',
                        lastName: 'Al Ali',
                        phone: '+966501234567',
                        country: 'Saudi Arabia',
                        city: 'Riyadh',
                        bio: 'Data Science expert specializing in machine learning and AI applications in business.',
                        language: 'en',
                        timezone: 'Asia/Riyadh',
                    },
                },
            },
        }),
        prisma.user.create({
            data: {
                email: 'khalid.alsaadi@careerhub.com',
                password: await bcrypt.hash('Coach123!', 12),
                role: client_1.UserRole.COACH,
                isActive: true,
                profile: {
                    create: {
                        firstName: 'Khalid',
                        lastName: 'Al Saadi',
                        phone: '+966512345678',
                        country: 'Saudi Arabia',
                        city: 'Jeddah',
                        bio: 'Cybersecurity consultant helping organizations protect their digital assets and build secure systems.',
                        language: 'en',
                        timezone: 'Asia/Riyadh',
                    },
                },
            },
        }),
        prisma.user.create({
            data: {
                email: 'sara.khalil@careerhub.com',
                password: await bcrypt.hash('Coach123!', 12),
                role: client_1.UserRole.COACH,
                isActive: true,
                profile: {
                    create: {
                        firstName: 'Sara',
                        lastName: 'Khalil',
                        phone: '+201112345678',
                        country: 'Egypt',
                        city: 'Alexandria',
                        bio: 'Digital marketing strategist helping businesses grow their online presence and reach target audiences effectively.',
                        language: 'en',
                        timezone: 'Africa/Cairo',
                    },
                },
            },
        }),
    ]);
    const coaches = await Promise.all([
        prisma.coach.create({
            data: {
                userId: coachUsers[0].id,
                bioEn: 'Senior Software Engineer with 10+ years of experience in full-stack development and system architecture. Passionate about mentoring junior developers and helping them advance their careers.',
                bioAr: 'مهندس برمجيات أول بخبرة تزيد عن 10 سنوات في تطوير Full Stack وهندسة الأنظمة. شغوف بتوجيه المطورين المبتدئين ومساعدتهم على التقدم في مسيرتهم المهنية.',
                specialties: ['Software Engineering', 'System Architecture', 'React', 'Node.js', 'Career Development'],
                experience: 10,
                hourlyRate: 50,
                currency: 'USD',
                availability: {
                    sunday: ['09:00-17:00'],
                    monday: ['09:00-17:00'],
                    tuesday: ['09:00-17:00'],
                    wednesday: ['09:00-17:00'],
                    thursday: ['09:00-17:00'],
                },
                isVerified: true,
                rating: 4.8,
                reviewCount: 47,
            },
        }),
        prisma.coach.create({
            data: {
                userId: coachUsers[1].id,
                bioEn: 'Data Science expert with 8 years of experience in machine learning and AI applications. Help businesses leverage data for strategic decision-making.',
                bioAr: 'خبيرة في علم البيانات بخبرة 8 سنوات في التعلم الآلي وتطبيقات الذكاء الاصطناعي. مساعدة الشركات على استغلال البيانات لاتخاذ قرارات استراتيجية.',
                specialties: ['Data Science', 'Machine Learning', 'Python', 'TensorFlow', 'Business Intelligence'],
                experience: 8,
                hourlyRate: 60,
                currency: 'USD',
                availability: {
                    saturday: ['10:00-18:00'],
                    sunday: ['10:00-18:00'],
                    monday: ['10:00-18:00'],
                    tuesday: ['10:00-18:00'],
                    wednesday: ['10:00-18:00'],
                },
                isVerified: true,
                rating: 4.9,
                reviewCount: 62,
            },
        }),
        prisma.coach.create({
            data: {
                userId: coachUsers[2].id,
                bioEn: 'Cybersecurity consultant with 12 years of experience in protecting digital assets. Specialized in ethical hacking and security architecture.',
                bioAr: 'استشاري أمن سيبراني بخبرة 12 سنة في حماية الأصول الرقمية. متخصص في الاختراق الأخلاقي وهندسة الأمان.',
                specialties: ['Cybersecurity', 'Ethical Hacking', 'Network Security', 'Compliance', 'Risk Management'],
                experience: 12,
                hourlyRate: 75,
                currency: 'USD',
                availability: {
                    saturday: ['14:00-22:00'],
                    sunday: ['14:00-22:00'],
                    monday: ['14:00-22:00'],
                    tuesday: ['14:00-22:00'],
                    wednesday: ['14:00-22:00'],
                },
                isVerified: true,
                rating: 4.7,
                reviewCount: 38,
            },
        }),
        prisma.coach.create({
            data: {
                userId: coachUsers[3].id,
                bioEn: 'Digital marketing strategist with 7 years of experience in helping businesses grow their online presence. Expert in social media and performance marketing.',
                bioAr: 'استراتيجية تسويق رقمي بخبرة 7 سنوات في مساعدة الشركات على نمو وجودها عبر الإنترنت. خبيرة في وسائل التواصل الاجتماعي والتسويق القائم على الأداء.',
                specialties: ['Digital Marketing', 'Social Media', 'SEO', 'Content Strategy', 'Performance Marketing'],
                experience: 7,
                hourlyRate: 45,
                currency: 'USD',
                availability: {
                    sunday: ['11:00-19:00'],
                    monday: ['11:00-19:00'],
                    tuesday: ['11:00-19:00'],
                    wednesday: ['11:00-19:00'],
                    thursday: ['11:00-19:00'],
                },
                isVerified: true,
                rating: 4.6,
                reviewCount: 29,
            },
        }),
    ]);
    const courses = [];
    const seCourses = [
        {
            titleEn: 'Introduction to Programming with JavaScript',
            titleAr: 'مقدمة في البرمجة بلغة JavaScript',
            descriptionEn: 'Learn the fundamentals of programming using JavaScript. This course covers variables, functions, control structures, and basic algorithms.',
            descriptionAr: 'تعلم أساسيات البرمجة باستخدام لغة JavaScript. يغطي هذا الدورة المتغيرات والدوال وهياكل التح控制和 الخوارزميات الأساسية.',
            price: 49.99,
            duration: 1200,
            level: 'BEGINNER',
        },
        {
            titleEn: 'React.js Modern Development',
            titleAr: 'تطوير React.js الحديث',
            descriptionEn: 'Master React.js and build modern web applications. Learn hooks, state management, routing, and best practices.',
            descriptionAr: 'أتقن React.js وابني تطبيقات الويب الحديثة. تعلم Hooks وإدارة الحالة والتوجيه وأفضل الممارسات.',
            price: 89.99,
            duration: 1800,
            level: 'INTERMEDIATE',
        },
        {
            titleEn: 'Advanced Backend with Node.js',
            titleAr: 'الخلفية المتقدمة مع Node.js',
            descriptionEn: 'Build scalable backend applications with Node.js. Learn about microservices, databases, authentication, and deployment.',
            descriptionAr: 'ابني تطبيقات خلفية قابلة للتطوير مع Node.js. تعلم عن الخدمات المصغرة وقواعد البيانات والمصادقة والنشر.',
            price: 99.99,
            duration: 2400,
            level: 'ADVANCED',
        },
    ];
    const dsCourses = [
        {
            titleEn: 'Python for Data Science',
            titleAr: 'Python لعلم البيانات',
            descriptionEn: 'Learn Python programming specifically for data science. Master libraries like Pandas, NumPy, and Matplotlib.',
            descriptionAr: 'تعلم برمجة Python خصيصًا لعلم البيانات. أتقن مكتبات مثل Pandas و NumPy و Matplotlib.',
            price: 69.99,
            duration: 1500,
            level: 'BEGINNER',
        },
        {
            titleEn: 'Machine Learning Fundamentals',
            titleAr: 'أساسيات التعلم الآلي',
            descriptionEn: 'Understand the core concepts of machine learning. Learn supervised and unsupervised learning algorithms.',
            descriptionAr: 'افهم المفاهيم الأساسية للتعلم الآلي. تعلم خوارزميات التعلم الخاضع للإشراف وغير الخاضع للإشراف.',
            price: 119.99,
            duration: 2000,
            level: 'INTERMEDIATE',
        },
        {
            titleEn: 'Deep Learning with TensorFlow',
            titleAr: 'التعلم العميق مع TensorFlow',
            descriptionEn: 'Build neural networks and deep learning models using TensorFlow. Learn CNNs, RNNs, and transfer learning.',
            descriptionAr: 'ابني الشبكات العصبية ونماذج التعلم العميق باستخدام TensorFlow. تعلم CNNs و RNNs والتعلم بالنقل.',
            price: 149.99,
            duration: 2800,
            level: 'ADVANCED',
        },
    ];
    const csCourses = [
        {
            titleEn: 'Introduction to Cybersecurity',
            titleAr: 'مقدمة في الأمن السيبراني',
            descriptionEn: 'Learn the fundamentals of cybersecurity. Understand common threats, vulnerabilities, and protection strategies.',
            descriptionAr: 'تعلم أساسيات الأمن السيبراني. افهم التهديدات الشائعة والثغرات واستراتيجيات الحماية.',
            price: 79.99,
            duration: 1600,
            level: 'BEGINNER',
        },
        {
            titleEn: 'Ethical Hacking and Penetration Testing',
            titleAr: 'الاختراق الأخلاقي واختبار الاختراق',
            descriptionEn: 'Learn ethical hacking techniques and penetration testing methodologies. Practice in a safe, lab environment.',
            descriptionAr: 'تعلم تقنيات الاختراق الأخلاقي ومنهجيات اختبار الاختراق. تدرب في بيئة معملية آمنة.',
            price: 129.99,
            duration: 2200,
            level: 'INTERMEDIATE',
        },
        {
            titleEn: 'Advanced Security Architecture',
            titleAr: 'هندسة الأمان المتقدمة',
            descriptionEn: 'Design and implement secure systems architecture. Learn about zero trust, cloud security, and compliance.',
            descriptionAr: 'صمم ونفذ بنية أنظمة آمنة. تعلم عن الثقة الصفرية وأمان السحابة والامتثال.',
            price: 159.99,
            duration: 3000,
            level: 'ADVANCED',
        },
    ];
    const dmCourses = [
        {
            titleEn: 'Digital Marketing Essentials',
            titleAr: 'أساسيات التسويق الرقمي',
            descriptionEn: 'Master the fundamentals of digital marketing. Learn SEO, social media marketing, and content strategy.',
            descriptionAr: 'أتقن أساسيات التسويق الرقمي. تعلم تحسين محركات البحث وتسويق وسائل التواصل الاجتماعي واستراتيجية المحتوى.',
            price: 59.99,
            duration: 1400,
            level: 'BEGINNER',
        },
        {
            titleEn: 'Social Media Marketing Mastery',
            titleAr: 'إتقان تسويق وسائل التواصل الاجتماعي',
            descriptionEn: 'Become a social media marketing expert. Learn platform-specific strategies and advertising techniques.',
            descriptionAr: 'كن خبيرًا في تسويق وسائل التواصل الاجتماعي. تعلم الاستراتيجيات الخاصة بكل منصة وتقنيات الإعلان.',
            price: 89.99,
            duration: 1800,
            level: 'INTERMEDIATE',
        },
        {
            titleEn: 'Performance Marketing and Analytics',
            titleAr: 'تسويق الأداء والتحليلات',
            descriptionEn: 'Master performance marketing and data analytics. Learn to optimize campaigns and measure ROI effectively.',
            descriptionAr: 'أتقن تسويق الأداء وتحليلات البيانات. تعلم تحسين الحملات وقياس العائد على الاستثمار بفعالية.',
            price: 109.99,
            duration: 2100,
            level: 'ADVANCED',
        },
    ];
    const baCourses = [
        {
            titleEn: 'Business Analysis Fundamentals',
            titleAr: 'أساسيات تحليل الأعمال',
            descriptionEn: 'Learn the core principles of business analysis. Master requirements gathering and process modeling.',
            descriptionAr: 'تعلم المبادئ الأساسية لتحليل الأعمال. أتقن جمع المتطلبات ونمذجة العمليات.',
            price: 69.99,
            duration: 1500,
            level: 'BEGINNER',
        },
        {
            titleEn: 'Agile and Scrum for Business Analysts',
            titleAr: 'Agile و Scrum لمحللي الأعمال',
            descriptionEn: 'Understand Agile methodologies and Scrum framework. Learn to work effectively in agile teams.',
            descriptionAr: 'افهم منهجيات Agile وإطار Scrum. تعلم العمل بفعالية في الفرق الرشيقة.',
            price: 89.99,
            duration: 1700,
            level: 'INTERMEDIATE',
        },
        {
            titleEn: 'Advanced Business Analysis Techniques',
            titleAr: 'تقنيات تحليل الأعمال المتقدمة',
            descriptionEn: 'Master advanced business analysis techniques. Learn stakeholder management and strategic planning.',
            descriptionAr: 'أتقن تقنيات تحليل الأعمال المتقدمة. تعلم إدارة أصحاب المصلحة والتخطيط الاستراتيجي.',
            price: 119.99,
            duration: 2300,
            level: 'ADVANCED',
        },
    ];
    const allCourseData = [
        ...seCourses.map(course => ({ ...course, careerPathId: careerPaths[0].id })),
        ...dsCourses.map(course => ({ ...course, careerPathId: careerPaths[1].id })),
        ...csCourses.map(course => ({ ...course, careerPathId: careerPaths[2].id })),
        ...dmCourses.map(course => ({ ...course, careerPathId: careerPaths[3].id })),
        ...baCourses.map(course => ({ ...course, careerPathId: careerPaths[4].id })),
    ];
    for (const courseData of allCourseData) {
        const course = await prisma.course.create({
            data: {
                ...courseData,
                slug: courseData.titleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                status: client_1.CourseStatus.PUBLISHED,
                isFeatured: Math.random() > 0.7,
                sortOrder: Math.floor(Math.random() * 100),
            },
        });
        courses.push(course);
        for (let moduleIndex = 1; moduleIndex <= 3; moduleIndex++) {
            const module = await prisma.courseModule.create({
                data: {
                    courseId: course.id,
                    titleEn: `Module ${moduleIndex}: ${courseData.titleEn}`,
                    titleAr: `الوحدة ${moduleIndex}: ${courseData.titleAr}`,
                    descriptionEn: `Comprehensive coverage of module ${moduleIndex} topics`,
                    descriptionAr: `تغطية شاملة لموضوعات الوحدة ${moduleIndex}`,
                    sortOrder: moduleIndex,
                    isPublished: true,
                },
            });
            for (let lessonIndex = 1; lessonIndex <= 3; lessonIndex++) {
                const lesson = await prisma.lesson.create({
                    data: {
                        moduleId: module.id,
                        title: `Lesson ${lessonIndex}: Key Concepts`,
                        titleAr: `الدرس ${lessonIndex}: المفاهيم الرئيسية`,
                        description: `Detailed explanation of lesson ${lessonIndex} concepts`,
                        content: `<h1>Lesson ${lessonIndex} Content</h1><p>This is the comprehensive content for lesson ${lessonIndex}.</p>`,
                        videoDuration: 600 + (lessonIndex * 120),
                        order: lessonIndex,
                        isPublished: true,
                    },
                });
                await prisma.videoContent.create({
                    data: {
                        lessonId: lesson.id,
                        streamId: `stream_${lesson.id}`,
                        playbackUrl: `https://cloudflarestream.com/${lesson.id}/manifest/video.m3u8`,
                        thumbnail: `https://example.com/thumbnails/${lesson.id}.jpg`,
                        duration: 600 + (lessonIndex * 120),
                        status: 'READY',
                    },
                });
                const quiz = await prisma.quiz.create({
                    data: {
                        lessonId: lesson.id,
                        titleEn: `Quiz: Lesson ${lessonIndex}`,
                        titleAr: `اختبار: الدرس ${lessonIndex}`,
                        descriptionEn: `Test your knowledge of lesson ${lessonIndex} concepts`,
                        descriptionAr: `اختبر معرفتك بمفاهيم الدرس ${lessonIndex}`,
                        passingScore: 70,
                        timeLimit: 15,
                        maxAttempts: 3,
                        sortOrder: lessonIndex,
                        isPublished: true,
                    },
                });
                for (let questionIndex = 1; questionIndex <= 5; questionIndex++) {
                    await prisma.quizQuestion.create({
                        data: {
                            quizId: quiz.id,
                            questionTextEn: `Question ${questionIndex}: What is the main concept discussed in this section?`,
                            questionTextAr: `السؤال ${questionIndex}: ما هو المفهوم الرئيسي الذي تمت مناقشته في هذا القسم؟`,
                            questionType: 'MULTIPLE_CHOICE',
                            options: JSON.stringify([
                                'Option A: First concept',
                                'Option B: Second concept',
                                'Option C: Third concept',
                                'Option D: Fourth concept',
                            ]),
                            correctAnswer: 'Option A: First concept',
                            points: 1,
                            order: questionIndex,
                        },
                    });
                }
            }
        }
    }
    const users = [];
    const firstNames = ['Mohammed', 'Fatima', 'Ali', 'Aisha', 'Omar', 'Khadija', 'Hassan', 'Zainab', 'Abdullah', 'Mariam'];
    const lastNames = ['Ali', 'Mohammed', 'Hassan', 'Khalid', 'Saad', 'Omar', 'Ahmed', 'Youssef', 'Ibrahim', 'Mahmoud'];
    const countries = ['Egypt', 'Saudi Arabia', 'UAE', 'Jordan', 'Morocco'];
    const cities = ['Cairo', 'Riyadh', 'Dubai', 'Amman', 'Casablanca'];
    for (let i = 0; i < 20; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const country = countries[Math.floor(Math.random() * countries.length)];
        const city = cities[Math.floor(Math.random() * cities.length)];
        const user = await prisma.user.create({
            data: {
                email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
                password: await bcrypt.hash('User123!', 12),
                role: client_1.UserRole.USER,
                isActive: true,
                profile: {
                    create: {
                        firstName,
                        lastName,
                        phone: `+20${1000000000 + i}`,
                        country,
                        city,
                        bio: `Passionate learner interested in professional development and career growth.`,
                        language: Math.random() > 0.5 ? 'en' : 'ar',
                        timezone: country === 'Egypt' ? 'Africa/Cairo' : 'Asia/Riyadh',
                    },
                },
            },
        });
        users.push(user);
        if (Math.random() > 0.3) {
            const randomCourse = courses[Math.floor(Math.random() * courses.length)];
            const progress = Math.random() * 100;
            const enrollment = await prisma.enrollment.create({
                data: {
                    userId: user.id,
                    courseId: randomCourse.id,
                    status: progress >= 100 ? client_1.EnrollmentStatus.COMPLETED : client_1.EnrollmentStatus.ACTIVE,
                    progress,
                    completedAt: progress >= 100 ? new Date() : null,
                },
            });
            const lessons = await prisma.lesson.findMany({
                where: {
                    module: {
                        courseId: randomCourse.id,
                    },
                },
            });
            for (const lesson of lessons) {
                if (Math.random() > 0.2) {
                    await prisma.lessonProgress.create({
                        data: {
                            userId: user.id,
                            lessonId: lesson.id,
                            status: Math.random() > 0.5 ? client_1.LessonStatus.COMPLETED : client_1.LessonStatus.IN_PROGRESS,
                            progress: Math.random() * 100,
                            timeSpent: Math.floor(Math.random() * 3600),
                            completedAt: Math.random() > 0.5 ? new Date() : null,
                        },
                    });
                }
            }
            if (progress >= 100) {
                await prisma.certificate.create({
                    data: {
                        userId: user.id,
                        courseId: randomCourse.id,
                        serialNumber: `CERT-${Date.now()}-${user.id.slice(-4)}`,
                        certificateUrl: `https://s3.amazonaws.com/certificates/${user.id}-${randomCourse.id}.pdf`,
                        qrCodeUrl: `https://s3.amazonaws.com/qrcodes/${user.id}-${randomCourse.id}.png`,
                    },
                });
            }
        }
        if (Math.random() > 0.4) {
            const randomCareerPath = careerPaths[Math.floor(Math.random() * careerPaths.length)];
            const isCompleted = Math.random() > 0.3;
            const assessment = await prisma.careerAssessment.create({
                data: {
                    userId: user.id,
                    careerPathId: randomCareerPath.id,
                    status: isCompleted ? client_1.AssessmentStatus.COMPLETED : client_1.AssessmentStatus.IN_PROGRESS,
                    score: isCompleted ? Math.floor(Math.random() * 40) + 60 : null,
                    results: isCompleted ? JSON.stringify({
                        strengths: ['Analytical Thinking', 'Problem Solving'],
                        improvements: ['Communication Skills'],
                        recommendedCourses: [courses[0].id, courses[1].id],
                    }) : null,
                    startedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                    completedAt: isCompleted ? new Date() : null,
                },
            });
            const questionCount = Math.floor(Math.random() * 10) + 10;
            for (let q = 1; q <= questionCount; q++) {
                await prisma.assessmentQuestion.create({
                    data: {
                        assessmentId: assessment.id,
                        questionTextEn: `Question ${q}: How would you handle a challenging technical problem?`,
                        questionTextAr: `السؤال ${q}: كيف تتعامل مع مشكلة تقنية صعبة؟`,
                        questionType: 'MULTIPLE_CHOICE',
                        options: JSON.stringify([
                            'Break it down into smaller parts',
                            'Seek help from colleagues',
                            'Research and study the problem',
                            'Try different approaches systematically',
                        ]),
                        correctAnswer: 'Break it down into smaller parts',
                        userAnswer: isCompleted ? 'Break it down into smaller parts' : null,
                        points: 1,
                        order: q,
                    },
                });
            }
        }
    }
    for (const coach of coaches) {
        const availability = coach.availability;
        const today = new Date();
        for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
            const currentDate = new Date(today);
            currentDate.setDate(today.getDate() + dayOffset);
            const dayName = currentDate.toLocaleDateString('en-us', { weekday: 'long' }).toLowerCase();
            if (availability[dayName]) {
                for (const timeSlot of availability[dayName]) {
                    const [startTime, endTime] = timeSlot.split('-');
                    const [startHour, startMinute] = startTime.split(':').map(Number);
                    const [endHour, endMinute] = endTime.split(':').map(Number);
                    const slotStart = new Date(currentDate);
                    slotStart.setHours(startHour, startMinute, 0, 0);
                    const slotEnd = new Date(currentDate);
                    slotEnd.setHours(endHour, endMinute, 0, 0);
                    if (slotStart > new Date()) {
                        await prisma.coachingSlot.create({
                            data: {
                                coachId: coach.id,
                                startTime: slotStart,
                                endTime: slotEnd,
                                isBooked: Math.random() > 0.8,
                                price: coach.hourlyRate,
                                currency: coach.currency,
                            },
                        });
                    }
                }
            }
        }
    }
    const availableSlots = await prisma.coachingSlot.findMany({
        where: { isBooked: true },
        include: { coach: true },
    });
    for (let i = 0; i < Math.min(availableSlots.length, users.length); i++) {
        const slot = availableSlots[i];
        const user = users[i];
        await prisma.coachingSession.create({
            data: {
                coachId: slot.coachId,
                userId: user.id,
                slotId: slot.id,
                startTime: slot.startTime,
                zoomMeetingId: `meeting_${Date.now()}_${i}`,
                zoomJoinUrl: `https://zoom.us/j/meeting_${Date.now()}_${i}`,
                status: Math.random() > 0.5 ? client_1.SessionStatus.COMPLETED : client_1.SessionStatus.SCHEDULED,
                notes: 'Coaching session focused on career development and skill improvement.',
                recordingUrl: Math.random() > 0.5 ? `https://zoom.us/recording/meeting_${Date.now()}_${i}` : null,
            },
        });
    }
    for (let i = 0; i < 30; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const amount = Math.floor(Math.random() * 200) + 50;
        await prisma.payment.create({
            data: {
                userId: user.id,
                amount,
                currency: 'USD',
                method: Math.random() > 0.5 ? client_1.PaymentMethod.PAYMOB : client_1.PaymentMethod.HYPERPAY,
                status: Math.random() > 0.1 ? client_1.PaymentStatus.COMPLETED : client_1.PaymentStatus.PENDING,
                transactionId: `txn_${Date.now()}_${i}`,
                description: i % 3 === 0 ? 'Course enrollment' : i % 3 === 1 ? 'Coaching session' : 'Premium features',
                metadata: JSON.stringify({
                    type: i % 3 === 0 ? 'course' : i % 3 === 1 ? 'coaching' : 'premium',
                }),
            },
        });
    }
    const notificationTypes = [
        client_1.NotificationType.COURSE_ENROLLMENT,
        client_1.NotificationType.LESSON_COMPLETED,
        client_1.NotificationType.CERTIFICATE_EARNED,
        client_1.NotificationType.COACHING_REMINDER,
        client_1.NotificationType.PAYMENT_CONFIRMED,
        client_1.NotificationType.SYSTEM_ANNOUNCEMENT,
    ];
    for (let i = 0; i < 100; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
        await prisma.notification.create({
            data: {
                userId: user.id,
                type,
                titleEn: `Notification: ${type}`,
                titleAr: `إشعار: ${type}`,
                contentEn: `This is a notification of type ${type} for the user.`,
                contentAr: `هذا إشعار من نوع ${type} للمستخدم.`,
                isRead: Math.random() > 0.6,
                data: JSON.stringify({
                    relatedId: `item_${i}`,
                    actionUrl: `/dashboard/${type.toLowerCase()}`,
                }),
            },
        });
    }
    for (let i = 0; i < 20; i++) {
        await prisma.adminLog.create({
            data: {
                adminId: adminUser.id,
                action: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN'][Math.floor(Math.random() * 4)],
                resource: ['User', 'Course', 'Coach', 'Payment'][Math.floor(Math.random() * 4)],
                resourceId: `resource_${i}`,
                details: JSON.stringify({
                    changes: 'Sample admin action details',
                }),
                ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
                userAgent: 'Mozilla/5.0 (Sample User Agent)',
            },
        });
    }
    console.log('✅ Database seeding completed successfully!');
    console.log(`👤 Created ${users.length} users`);
    console.log(`👨‍🏫 Created ${coaches.length} coaches`);
    console.log(`🛤️ Created ${careerPaths.length} career paths`);
    console.log(`📚 Created ${courses.length} courses`);
    console.log(`💰 Created payments and certificates`);
    console.log(`🗓️ Created coaching slots and sessions`);
    console.log(`🔔 Created notifications and admin logs`);
    console.log('');
    console.log('🔑 Admin Login Credentials:');
    console.log('   Email: admin@careerhub.com');
    console.log('   Password: Admin@CareerHub2026!');
    console.log('');
    console.log('👨‍🏫 Coach Login Credentials:');
    console.log('   Email: ahmed.mohammed@careerhub.com');
    console.log('   Password: Coach123!');
    console.log('');
}
main()
    .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map