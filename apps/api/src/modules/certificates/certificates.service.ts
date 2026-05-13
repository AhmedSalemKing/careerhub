import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas'
import * as QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'
import * as fs from 'fs'
import * as path from 'path'
import { v2 as cloudinary } from 'cloudinary'
import { Readable } from 'stream'
import { sendNotification } from '../../common/utils/notify.util'

const logger = new Logger('CertificatesService')

@Injectable()
export class CertificatesService {
  constructor(private prisma: PrismaService) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })
  }

  async generateCertificate(userId: string, courseId: string, bypassEnrollment = false) {
    // Guard: prevent duplicate certificates
    const existing = await this.prisma.certificate.findFirst({
      where: { userId, courseId },
    })
    if (existing) {
      logger.log(`[Certificate] Already exists: ${existing.serialNumber}`)
      return { success: true, data: existing }
    }

    try {
      logger.log(`[Certificate] generateCertificate called: ${userId}, ${courseId}`)
      const result = await this._doGenerate(userId, courseId, bypassEnrollment)
      logger.log(`[Certificate] Generation SUCCESS: ${result?.data?.id}`)
      return result
    } catch (e: any) {
      logger.error('[Certificate] Full generation failed, attempting fallback:', {
        message: e.message, code: e.code, meta: e.meta,
      })

      if (e instanceof ForbiddenException || e instanceof NotFoundException) throw e

      const existing2 = await this.prisma.certificate.findUnique({
        where: { userId_courseId: { userId, courseId } },
      }).catch(() => null)
      if (existing2) return { success: true, data: existing2 }

      const serialNumber = `DVW-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 8).toUpperCase()}`
      const cert = await this.prisma.certificate.create({
        data: { userId, courseId, serialNumber, certificateUrl: '', qrCodeUrl: '', issuedAt: new Date() },
      })
      logger.log(`[Certificate] Fallback certificate created: ${cert.id}`)
      return { success: true, data: cert }
    }
  }

  private async _doGenerate(userId: string, courseId: string, bypassEnrollment: boolean) {
    console.log('[Certificate] _doGenerate START:', { userId, courseId, bypassEnrollment })
    try {
    // 1. Check existing certificate (unique by userId+courseId)
    const existing = await this.prisma.certificate.findUnique({
      where: { userId_courseId: { userId, courseId } },
    })
    if (existing) {
      console.log('[Certificate] Existing certificate found:', existing.id)
      return { success: true, data: existing }
    }

    // 2. Get user data
    console.log('[Certificate] Fetching user:', userId)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    })
    if (!user) {
      console.error('[Certificate] User not found:', userId)
      throw new NotFoundException('User not found')
    }
    console.log('[Certificate] User found:', user.email)

    // 3. Get course data with instructor
    console.log('[Certificate] Fetching course:', courseId)
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          include: { profile: true },
        },
      },
    })
    if (!course) {
      console.error('[Certificate] Course not found:', courseId)
      throw new NotFoundException('Course not found')
    }
    console.log('[Certificate] Course found:', course.titleEn)

    // 4. Enrollment check removed - any authenticated user who completed
    //    the course can get a certificate (covers INSTRUCTOR, COACH, STUDENT)
    console.log('[Certificate] Skipping enrollment check - open to all authenticated users')

    // 5. Generate unique serial number (our verifyCode)
    const serialNumber = `DVW-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 8).toUpperCase()}`

    // 6. Build display strings
    const studentName = user.profile
      ? `${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim()
      : user.email.split('@')[0]

    const courseTitle = course.titleAr || course.titleEn || 'الدورة التدريبية'

    const instructorName = course.instructor?.profile
      ? `${course.instructor.profile.firstName || ''} ${course.instructor.profile.lastName || ''}`.trim()
      : 'DeveWay Instructor'

    const instructorSignatureUrl: string | null = null // reserved for future profile field

    const issueDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    // 7. Generate certificate image via canvas
    const certificateBuffer = await this.createCertificateImage({
      studentName,
      courseTitle,
      issueDate,
      serialNumber,
      instructorName,
      instructorSignatureUrl,
    })

    // 8. Upload to Cloudinary
    const certificateUrl = await this.uploadToCloudinary(certificateBuffer, serialNumber)

    // 9. Save to DB
    const certificate = await this.prisma.certificate.create({
      data: {
        userId,
        courseId,
        serialNumber,
        certificateUrl,
        qrCodeUrl: certificateUrl,
        issuedAt: new Date(),
      },
    })

    await sendNotification(
      this.prisma,
      userId,
      'تهانينا! حصلت على شهادتك',
      `أتممت كورس "${course.titleEn}" بنجاح وحصلت على شهادة إتمام. يمكنك تحميلها الآن!`,
      'CERTIFICATE_EARNED',
      { certificateId: certificate.id, courseId: course.id }
    );

    return { success: true, data: certificate }
  } catch (e: any) {
    console.error('[Certificate] _doGenerate FAILED:', {
      message: e.message,
      code: e.code,
      meta: e.meta,
      userId,
      courseId,
    })
    throw e
  }
  } // end _doGenerate

  private resolveTemplatePath(): string {
    const fs = require('fs') as typeof import('fs')
    const candidates = [
      path.join(__dirname, 'template.png'),                                         // dist/modules/certificates/
      path.join(process.cwd(), 'dist', 'modules', 'certificates', 'template.png'), // explicit dist path
      path.join(process.cwd(), 'src', 'modules', 'certificates', 'template.png'),  // src (local dev)
      path.join(process.cwd(), 'public', 'template.png'),                           // public fallback
    ]
    console.log('[Certificate] __dirname:', __dirname)
    for (const p of candidates) {
      const exists = fs.existsSync(p)
      console.log(`[Certificate] Checking ${p} → ${exists ? 'FOUND' : 'missing'}`)
      if (exists) return p
    }
    console.error('[Certificate] Template NOT FOUND. Searched:', candidates)
    throw new Error('Certificate template not found in any expected location')
  }

  // ── Helper: Arabic detection ────────────────────────────────────────────
  private isArabic(text: string): boolean {
    return /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text)
  }

  // ── Helper: Resolve font based on language and weight ────────────────────
  private resolveFont(
    sizePx: number,
    weight: 'normal' | 'bold' | 'italic' = 'bold',
    arabic = false,
  ): string {
    if (arabic) {
      return `${weight === 'italic' ? 'italic' : 'bold'} ${sizePx}px "CertificateArabic", Arial, sans-serif`
    }
    return `${weight} ${sizePx}px "Playfair Display", Georgia, "Times New Roman", serif`
  }

  // ── Helper: Draw text with alignment ─────────────────────────────────────
  private drawText(
    ctx: any,
    text: string,
    x: number,
    y: number,
    color = '#1a1a2e',
    align: 'left' | 'center' | 'right' = 'center',
  ): void {
    ctx.fillStyle = color
    ctx.textAlign = align
    ctx.fillText(text, x, y)
  }

  // ── Helper: Word-wrap text to fit maxWidth ──────────────────────────────
  private wrapText(ctx: any, text: string, maxWidth: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let current = ''
    for (const word of words) {
      const test = current ? `${current} ${word}` : word
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current)
        current = word
      } else {
        current = test
      }
    }
    if (current) lines.push(current)
    return lines
  }

  private async createCertificateImage(data: {
    studentName: string
    courseTitle: string
    issueDate: string
    serialNumber: string
    instructorName: string
    instructorSignatureUrl: string | null
  }): Promise<Buffer> {
    // ── Font Registration ──────────────────────────────────────────────────
    const fontsDir = path.join(__dirname, 'fonts')
    const arabicFontPath = path.join(fontsDir, 'certificate.ttf')
    let arabicFontRegistered = false

    if (fs.existsSync(arabicFontPath)) {
      try {
        GlobalFonts.registerFromPath(arabicFontPath, 'CertificateArabic')
        arabicFontRegistered = true
        logger.log(`[Certificate] Arabic font registered: ${arabicFontPath}`)
      } catch (fontErr: any) {
        logger.warn(`[Certificate] Arabic font registration failed: ${fontErr.message}`)
      }
    } else {
      logger.warn(`[Certificate] Arabic font NOT found at: ${arabicFontPath}`)
    }

    // ── Load Template ──────────────────────────────────────────────────────
    const templatePath = this.resolveTemplatePath()
    const template = await loadImage(templatePath).catch((e: any) => {
      logger.error(`[Certificate] loadImage failed: ${e.message} path: ${templatePath}`)
      throw e
    })

    const W = template.width
    const H = template.height
    logger.log(`[Certificate] Template loaded: ${W}x${H}`)

    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(template, 0, 0, W, H)

    // ── A. "Certificate of Completion" ────────────────────────────────────
    ctx.font = this.resolveFont(Math.floor(W * 0.040))
    this.drawText(ctx, 'Certificate of Completion', W / 2, H * 0.255, '#1a1a2e')

    // ── B. Decorative separator line ───────────────────────────────────────
    const lineW = W * 0.25
    ctx.strokeStyle = '#c9a96e'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(W / 2 - lineW / 2, H * 0.278)
    ctx.lineTo(W / 2 + lineW / 2, H * 0.278)
    ctx.stroke()

    // ── C. "This is to certify that" ──────────────────────────────────────
    ctx.font = this.resolveFont(Math.floor(W * 0.016), 'italic')
    this.drawText(ctx, 'This is to certify that', W / 2, H * 0.325, '#5a5a6e')

    // ── D. Student Name ────────────────────────────────────────────────────
    const nameArabic = this.isArabic(data.studentName)
    const nameFontSize = Math.floor(W * 0.034)
    ctx.font = this.resolveFont(nameFontSize, 'bold', nameArabic)
    if (nameArabic) ctx.direction = 'rtl'
    this.drawText(ctx, data.studentName, W / 2, H * 0.390, '#1a1a2e')
    ctx.direction = 'ltr'

    // ── E. Student name underline (signature-style) ──────────────────────
    const nameW = Math.min(ctx.measureText(data.studentName).width + W * 0.04, W * 0.55)
    ctx.strokeStyle = '#c9a96e'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(W / 2 - nameW / 2, H * 0.402)
    ctx.lineTo(W / 2 + nameW / 2, H * 0.402)
    ctx.stroke()

    // ── F. "has successfully completed the course:" ───────────────────────
    ctx.font = this.resolveFont(Math.floor(W * 0.015), 'italic')
    this.drawText(ctx, 'has successfully completed the course:', W / 2, H * 0.448, '#5a5a6e')

    // ── G. Course Title (with word wrap) ───────────────────────────────────
    const courseArabic = this.isArabic(data.courseTitle)
    const courseFontSize = Math.floor(W * 0.026)
    ctx.font = this.resolveFont(courseFontSize, 'bold', courseArabic)
    if (courseArabic) ctx.direction = 'rtl'

    const maxCourseWidth = W * 0.72
    const courseLines = this.wrapText(ctx, data.courseTitle, maxCourseWidth)
    const courseLineH = courseFontSize * 1.45
    const courseStartY = courseLines.length === 1
      ? H * 0.508
      : H * 0.495 - ((courseLines.length - 1) * courseLineH) / 2

    courseLines.forEach((line, i) => {
      this.drawText(ctx, line, W / 2, courseStartY + i * courseLineH, '#2d2d5e')
    })
    ctx.direction = 'ltr'

    // ── H. Issue Date ─────────────────────────────────────────────────────
    const issueDate = new Date(data.issueDate || Date.now())
    const dateFormatted = issueDate.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
    ctx.font = this.resolveFont(Math.floor(W * 0.0145), 'normal')
    this.drawText(ctx, `Issued: ${dateFormatted}`, W / 2, H * 0.612, '#666680')

    // ── I. Instructor Name ─────────────────────────────────────────────────
    const instructorName = data.instructorName || 'DeveWay Team'
    ctx.font = this.resolveFont(Math.floor(W * 0.017), 'bold')
    this.drawText(ctx, instructorName, W / 2, H * 0.798, '#1a1a2e')

    ctx.font = this.resolveFont(Math.floor(W * 0.013), 'normal')
    this.drawText(ctx, 'Course Instructor', W / 2, H * 0.820, '#888899')

    // ── J. Certificate ID (monospace for authenticity) ────────────────────
    ctx.font = `${Math.floor(W * 0.011)}px "Courier New", "Lucida Console", monospace`
    this.drawText(
      ctx,
      `Certificate ID: ${data.serialNumber}`,
      W / 2,
      H * 0.882,
      '#9999aa',
    )

    // ── K. Website URL ─────────────────────────────────────────────────────
    ctx.font = this.resolveFont(Math.floor(W * 0.011), 'normal')
    this.drawText(ctx, 'www.deveway.com', W / 2, H * 0.912, '#bbbbcc')

    // ── QR CODE BLOCK ──────────────────────────────────────────────────────
    try {
      const learnUrl = process.env.LEARN_URL || 'https://devewayhub.vercel.app'
      const serial = data.serialNumber
      const verifyUrl = `${learnUrl}/ar/certificate/${serial}`

      logger.log(`[Certificate] Generating QR for: ${verifyUrl}`)

      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: { dark: '#1a1a2e', light: '#ffffff' },
      })

      const qrImg = await loadImage(qrDataUrl)

      const qrSize   = Math.floor(W * 0.092)
      const qrX      = Math.floor(W * 0.842)
      const qrY      = Math.floor(H * 0.698)
      const padding  = 10
      const labelH   = 22

      // Outer card - white background with rounded corners
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      if (ctx.roundRect) {
        ctx.roundRect(
          qrX - padding,
          qrY - padding,
          qrSize + padding * 2,
          qrSize + padding * 2 + labelH,
          8,
        )
      } else {
        ctx.rect(qrX - padding, qrY - padding, qrSize + padding * 2, qrSize + padding * 2 + labelH)
      }
      ctx.fill()

      // Thin gold border
      ctx.strokeStyle = '#c9a96e'
      ctx.lineWidth = 1
      ctx.stroke()

      // QR image
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)

      // "Scan to Verify" label
      const labelFontSize = Math.floor(W * 0.0082)
      ctx.font = `${labelFontSize}px Arial, sans-serif`
      ctx.fillStyle = '#5a5a6e'
      ctx.textAlign = 'center'
      ctx.fillText('Scan to Verify', qrX + qrSize / 2, qrY + qrSize + labelH - 5)

      logger.log(`[Certificate] QR rendered at x:${qrX} y:${qrY} size:${qrSize}`)
    } catch (qrErr: any) {
      logger.warn(`[Certificate] QR generation failed (non-fatal): ${qrErr.message}`)
      ctx.font = `${Math.floor(W * 0.009)}px "Courier New", monospace`
      ctx.fillStyle = '#cccccc'
      ctx.textAlign = 'right'
      ctx.fillText(data.serialNumber || '', W * 0.968, H * 0.810)
    }

    return canvas.toBuffer('image/png')
  }

  /** Split text into lines that fit within maxWidth at the current ctx font. */
  private splitText(ctx: any, text: string, maxWidth: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let cur = ''
    for (const word of words) {
      const test = cur ? `${cur} ${word}` : word
      if (ctx.measureText(test).width > maxWidth && cur) {
        lines.push(cur)
        cur = word
      } else {
        cur = test
      }
    }
    if (cur) lines.push(cur)
    return lines
  }

  private uploadToCloudinary(buffer: Buffer, serialNumber: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'deveway/certificates',
          public_id: serialNumber,
          resource_type: 'image',
          format: 'png',
        },
        (error, result) => {
          if (error) return reject(error)
          resolve(result!.secure_url)
        },
      )
      const readable = new Readable()
      readable.push(buffer)
      readable.push(null)
      readable.pipe(uploadStream)
    })
  }

  // ─── Public API methods ──────────────────────────────────────

  async verifyCertificate(code: string) {
    const cert = await this.prisma.certificate.findFirst({
      where: {
        OR: [
          { serialNumber: code },
          { id: code },
        ],
      },
      include: {
        user: {
          select: {
            email: true,
            profile: {
              select: { firstName: true, lastName: true, avatar: true },
            },
          },
        },
        course: {
          select: {
            titleAr: true,
            titleEn: true,
            thumbnail: true,
            instructor: {
              select: {
                profile: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
        },
      },
    })
    if (!cert) throw new NotFoundException('الشهادة غير موجودة أو رمز التحقق غير صحيح')

    const studentName = cert.user.profile
      ? `${cert.user.profile.firstName || ''} ${cert.user.profile.lastName || ''}`.trim()
      : cert.user.email

    const instructorName = cert.course.instructor?.profile
      ? `${cert.course.instructor.profile.firstName || ''} ${cert.course.instructor.profile.lastName || ''}`.trim()
      : 'DeveWay Instructor'

    return {
      valid: true,
      certificate: {
        serialNumber: cert.serialNumber,
        issuedAt: cert.issuedAt,
        courseTitle: cert.course.titleAr || cert.course.titleEn,
        courseTitleAr: cert.course.titleAr,
        courseTitleEn: cert.course.titleEn,
        userName: studentName,
        studentAvatar: cert.user.profile?.avatar,
        courseThumbnail: cert.course.thumbnail,
        instructorName,
        certificateUrl: cert.certificateUrl,
      },
    }
  }

  async getMyCertificates(userId: string) {
    return this.prisma.certificate.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            thumbnail: true,
            instructor: {
              include: { profile: { select: { firstName: true, lastName: true } } },
            },
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
    })
  }

  async getAllCertificatesAdmin() {
    return this.prisma.certificate.findMany({
      include: {
        user: {
          include: { profile: { select: { firstName: true, lastName: true } } },
        },
        course: {
          select: { titleAr: true, titleEn: true },
        },
      },
      orderBy: { issuedAt: 'desc' },
      take: 200,
    })
  }

  // ─── Legacy / existing controller helpers ────────────────────

  async getUserCertificates(userId: string, options: { page: number; limit: number }) {
    const { page, limit } = options
    const skip = (page - 1) * limit
    const [certificates, total] = await Promise.all([
      this.prisma.certificate.findMany({
        where: { userId },
        include: { course: true },
        orderBy: { issuedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.certificate.count({ where: { userId } }),
    ])
    return {
      certificates,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }
  }

  async getCertificateStats() {
    const total = await this.prisma.certificate.count()
    const thisMonth = await this.prisma.certificate.count({
      where: {
        issuedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    })
    return { totalCertificates: total, certificatesThisMonth: thisMonth }
  }
}
