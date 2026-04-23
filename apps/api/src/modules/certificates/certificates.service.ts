import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import * as QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'
import * as path from 'path'
import { v2 as cloudinary } from 'cloudinary'
import { Readable } from 'stream'

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
    try {
      return await this._doGenerate(userId, courseId, bypassEnrollment)
    } catch (e: any) {
      console.error('[Certificate] Generation error:', {
        message: e.message,
        code: e.code,
        stack: e.stack?.split('\n').slice(0, 6).join(' | '),
      })
      throw e
    }
  }

  private async _doGenerate(userId: string, courseId: string, bypassEnrollment: boolean) {
    // 1. Check existing certificate (unique by userId+courseId)
    const existing = await this.prisma.certificate.findUnique({
      where: { userId_courseId: { userId, courseId } },
    })
    if (existing) return { success: true, data: existing }

    // 2. Get user data
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    })
    if (!user) throw new NotFoundException('User not found')

    // 3. Get course data with instructor
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          include: { profile: true },
        },
      },
    })
    if (!course) throw new NotFoundException('Course not found')

    // 4. Check enrollment (admin can bypass)
    if (!bypassEnrollment) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
      })
      if (!enrollment) throw new ForbiddenException('Not enrolled in this course')
    }

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
        qrCodeUrl: certificateUrl, // same image; QR is embedded inside
        issuedAt: new Date(),
      },
    })

    return { success: true, data: certificate }
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

  /** Register professional fonts from @fontsource packages (once per process is fine) */
  private registerFonts() {
    const fs = require('fs') as typeof import('fs')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { GlobalFonts } = require('@napi-rs/canvas')
    const base = path.join(process.cwd(), 'node_modules', '@fontsource')
    const fonts = [
      { file: path.join(base, 'playfair-display', 'files', 'playfair-display-latin-400-normal.woff2'), family: 'Playfair Display' },
      { file: path.join(base, 'playfair-display', 'files', 'playfair-display-latin-400-italic.woff2'), family: 'Playfair Display' },
      { file: path.join(base, 'cormorant-garamond', 'files', 'cormorant-garamond-latin-400-normal.woff2'), family: 'Cormorant Garamond' },
      { file: path.join(base, 'cormorant-garamond', 'files', 'cormorant-garamond-latin-400-italic.woff2'), family: 'Cormorant Garamond' },
      { file: path.join(base, 'great-vibes', 'files', 'great-vibes-latin-400-normal.woff2'), family: 'Great Vibes' },
    ]
    for (const f of fonts) {
      if (fs.existsSync(f.file)) {
        try { GlobalFonts.registerFromPath(f.file, f.family) }
        catch { /* non-fatal */ }
      } else {
        console.warn('[Certificate] Font not found:', f.file)
      }
    }
    console.log('[Certificate] Registered fonts:', GlobalFonts.families?.length ?? '?')
  }

  private async createCertificateImage(data: {
    studentName: string
    courseTitle: string
    issueDate: string
    serialNumber: string
    instructorName: string
    instructorSignatureUrl: string | null
  }): Promise<Buffer> {
    this.registerFonts()

    // Register Arabic font
    const fs = require('fs') as typeof import('fs')
    const { GlobalFonts } = require('@napi-rs/canvas')
    const arabicFontPath = path.join(__dirname, 'fonts', 'certificate.ttf')
    if (fs.existsSync(arabicFontPath)) {
      try { GlobalFonts.registerFromPath(arabicFontPath, 'CertificateArabic') }
      catch { /* non-fatal */ }
      console.log('[Certificate] Arabic font registered')
    } else {
      console.warn('[Certificate] Arabic font not found:', arabicFontPath)
    }

    const templatePath = this.resolveTemplatePath()
    const template = await loadImage(templatePath).catch((e: any) => {
      console.error('[Certificate] loadImage failed:', e.message, 'path:', templatePath)
      throw e
    })

    const W = template.width
    const H = template.height
    console.log(`[Certificate] Template loaded: ${W}x${H}`)

    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext('2d')

    // Draw BLANK template (no placeholder text)
    ctx.drawImage(template, 0, 0)

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // ═══ STATIC TEXT ═══

    // "Certificate of Completion"
    ctx.font = `bold ${Math.floor(W * 0.042)}px "Playfair Display", Georgia, serif`
    ctx.fillStyle = '#1a1a2e'
    ctx.fillText('Certificate of Completion', W / 2, H * 0.195)

    // "This is to certify that"
    ctx.font = `${Math.floor(W * 0.016)}px "Cormorant Garamond", Georgia, serif`
    ctx.fillStyle = '#2c2c2c'
    ctx.fillText('This is to certify that', W / 2, H * 0.305)

    // "has successfully completed the course:"
    ctx.font = `${Math.floor(W * 0.015)}px "Cormorant Garamond", Georgia, serif`
    ctx.fillStyle = '#2c2c2c'
    ctx.fillText('has successfully completed the course:', W / 2, H * 0.455)

    // Description text
    ctx.font = `${Math.floor(W * 0.013)}px "Cormorant Garamond", Georgia, serif`
    ctx.fillText('This certificate is awarded in recognition of their commitment and', W / 2, H * 0.650)
    ctx.fillText('achievement in mastering the course material.', W / 2, H * 0.670)

    // "DeveWay Instructor" label
    ctx.font = `${Math.floor(W * 0.012)}px "Cormorant Garamond", Georgia, serif`
    ctx.fillText('DeveWay Instructor', W * 0.215, H * 0.855)

    // "DeveWay CEO" label
    ctx.fillText('DeveWay CEO', W * 0.785, H * 0.855)

    // "www.deveway.com" - raised
    ctx.font = `${Math.floor(W * 0.010)}px "Cormorant Garamond", Georgia, serif`
    ctx.fillStyle = '#5a5a5a'
    ctx.fillText('www.deveway.com', W / 2, H * 0.920)

    // ═══ DYNAMIC TEXT ═══

    // Student Name
    const nameLen = data.studentName.length
    const nameFontSize = nameLen > 35 ? Math.floor(W * 0.030)
      : nameLen > 25 ? Math.floor(W * 0.036)
      : Math.floor(W * 0.042)

    const nameHasArabic = /[\u0600-\u06FF]/.test(data.studentName)
    if (nameHasArabic) {
      ctx.font = `bold ${nameFontSize}px "CertificateArabic", Arial, sans-serif`
      ctx.direction = 'rtl'
    } else {
      ctx.font = `italic bold ${nameFontSize}px "Playfair Display", Georgia, serif`
      ctx.direction = 'ltr'
    }
    ctx.fillStyle = '#1a1a2e'
    ctx.shadowColor = 'rgba(0,0,0,0.08)'
    ctx.shadowBlur = 2
    ctx.fillText(
      data.studentName.length > 40 ? data.studentName.substring(0, 38) + '...' : data.studentName,
      W / 2,
      H * 0.360
    )
    ctx.shadowBlur = 0
    ctx.direction = 'ltr'

    // Course Title
    const courseFontSize = data.courseTitle.length > 35 ? Math.floor(W * 0.024) : Math.floor(W * 0.030)
    const courseHasArabic = /[\u0600-\u06FF]/.test(data.courseTitle)
    if (courseHasArabic) {
      ctx.font = `bold ${courseFontSize}px "CertificateArabic", Arial, sans-serif`
      ctx.direction = 'rtl'
    } else {
      ctx.font = `bold ${courseFontSize}px "Playfair Display", Georgia, serif`
      ctx.direction = 'ltr'
    }
    ctx.fillStyle = '#1a1a2e'

    const courseLines = this.splitText(ctx, data.courseTitle, W * 0.68)
    if (courseLines.length === 1) {
      ctx.fillText(courseLines[0], W / 2, H * 0.520)
    } else {
      ctx.fillText(courseLines[0], W / 2, H * 0.505)
      ctx.fillText(courseLines[1] || '', W / 2, H * 0.540)
    }
    ctx.direction = 'ltr'

    // Date
    ctx.font = `${Math.floor(W * 0.015)}px "Cormorant Garamond", Georgia, serif`
    ctx.fillStyle = '#2c2c2c'
    ctx.fillText(`on ${data.issueDate}`, W / 2, H * 0.610)

    // Instructor Name (left, under signature lines)
    ctx.font = `italic ${Math.floor(W * 0.018)}px "Playfair Display", Georgia, serif`
    ctx.fillStyle = '#1a1a2e'
    ctx.fillText(data.instructorName, W * 0.215, H * 0.800)

    // Certificate ID - raised
    ctx.font = `${Math.floor(W * 0.009)}px "Courier New", monospace`
    ctx.fillStyle = '#5a5a5a'
    ctx.fillText(`Certificate ID: ${data.serialNumber}`, W / 2, H * 0.890)

    // ── QR CODE ─────────────────────────────────────────────────────────────
    try {
      const verifyUrl = `${process.env.LEARN_URL || 'https://devewayhub.vercel.app'}/ar/certificate/${data.serialNumber}`
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 120,
        margin: 1,
        color: { dark: '#1a1a2e', light: 'rgba(255,255,255,0)' },
      })
      const qrImg = await loadImage(qrDataUrl)
      ctx.drawImage(qrImg, W * 0.860, H * 0.730, W * 0.075, W * 0.075 * (H / W))
    } catch (e: any) {
      console.error('[Certificate] QR failed:', e.message)
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

  async verifyCertificate(serialNumber: string) {
    const cert = await this.prisma.certificate.findFirst({
      where: { serialNumber },
      include: {
        user: { include: { profile: true } },
        course: {
          include: {
            instructor: { include: { profile: true } },
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
      studentName,
      courseTitle: cert.course.titleAr || cert.course.titleEn,
      instructorName,
      issueDate: cert.issuedAt,
      verifyCode: cert.serialNumber,
      certificateUrl: cert.certificateUrl,
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
