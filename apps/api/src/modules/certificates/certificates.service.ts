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
  }

  private async createCertificateImage(data: {
    studentName: string
    courseTitle: string
    issueDate: string
    serialNumber: string
    instructorName: string
    instructorSignatureUrl: string | null
  }): Promise<Buffer> {
    const templatePath = path.join(__dirname, 'template.png')

    const template = await loadImage(templatePath)
    const canvas = createCanvas(template.width, template.height)
    const ctx = canvas.getContext('2d')

    ctx.drawImage(template, 0, 0)

    const W = template.width
    const H = template.height

    // --- Cover placeholder rectangles ---
    const coverRects = [
      [W * 0.2, H * 0.33, W * 0.6, H * 0.08],   // recipient name
      [W * 0.15, H * 0.52, W * 0.7, H * 0.08],  // course title
      [W * 0.25, H * 0.62, W * 0.5, H * 0.05],  // date
      [W * 0.2, H * 0.82, W * 0.6, H * 0.04],   // cert ID
      [W * 0.05, H * 0.73, W * 0.3, H * 0.06],  // instructor name
    ]
    ctx.fillStyle = 'rgba(240, 242, 250, 0.95)'
    for (const [x, y, w, h] of coverRects) ctx.fillRect(x, y, w, h)

    // --- Student name ---
    ctx.fillStyle = '#1B2340'
    ctx.font = `italic bold ${Math.floor(W * 0.048)}px Georgia, serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = 'rgba(0,0,0,0.15)'
    ctx.shadowBlur = 4
    ctx.fillText(data.studentName, W / 2, H * 0.372)
    ctx.shadowBlur = 0

    // --- Course title (wrapped) ---
    ctx.fillStyle = '#1B2340'
    ctx.font = `bold ${Math.floor(W * 0.034)}px Georgia, serif`
    ctx.textAlign = 'center'
    this.wrapText(ctx, data.courseTitle, W / 2, H * 0.56, W * 0.65, Math.floor(W * 0.034) * 1.4)

    // --- Issue date ---
    ctx.fillStyle = '#4A5568'
    ctx.font = `${Math.floor(W * 0.018)}px Georgia, serif`
    ctx.textAlign = 'center'
    ctx.fillText(`on ${data.issueDate}`, W / 2, H * 0.645)

    // --- Instructor name ---
    ctx.fillStyle = '#2D3748'
    ctx.font = `italic ${Math.floor(W * 0.018)}px Georgia, serif`
    ctx.textAlign = 'center'
    ctx.fillText(data.instructorName, W * 0.22, H * 0.77)

    // --- Certificate ID ---
    ctx.fillStyle = '#718096'
    ctx.font = `${Math.floor(W * 0.012)}px Courier New, monospace`
    ctx.textAlign = 'center'
    ctx.fillText(`Certificate ID: ${data.serialNumber}`, W / 2, H * 0.84)

    // --- Instructor signature image (optional) ---
    if (data.instructorSignatureUrl) {
      try {
        const sig = await loadImage(data.instructorSignatureUrl)
        ctx.drawImage(sig, W * 0.08, H * 0.695, W * 0.18, H * 0.065)
      } catch {
        // skip if fails
      }
    }

    // --- QR code ---
    const verifyUrl = `${process.env.LEARN_URL || 'https://devewayhub.vercel.app'}/ar/certificate/${data.serialNumber}`
    try {
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 120,
        margin: 1,
        color: { dark: '#1B2340', light: '#FFFFFF' },
      })
      const qrImage = await loadImage(qrDataUrl)
      ctx.drawImage(qrImage, W * 0.86, H * 0.70, W * 0.08, W * 0.08)
      ctx.fillStyle = '#718096'
      ctx.font = `${Math.floor(W * 0.009)}px Arial, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('Scan to verify', W * 0.9, H * 0.80)
    } catch (e) {
      console.error('[Certificate] QR generation failed:', e)
    }

    return canvas.toBuffer('image/png')
  }

  private wrapText(
    ctx: any,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
  ) {
    const words = text.split(' ')
    let line = ''
    let currentY = y
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' '
      if (ctx.measureText(testLine).width > maxWidth && i > 0) {
        ctx.fillText(line.trim(), x, currentY)
        line = words[i] + ' '
        currentY += lineHeight
      } else {
        line = testLine
      }
    }
    ctx.fillText(line.trim(), x, currentY)
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
