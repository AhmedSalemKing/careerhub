import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { DailyService } from './daily.service'
import { BunnyStreamService } from '../upload/bunny-stream.service'

@Injectable()
export class LiveService {
  private readonly logger = new Logger(LiveService.name);

  constructor(
    private prisma: PrismaService,
    private daily: DailyService,
    private bunny: BunnyStreamService,
  ) {}

  async startLive(courseId: string, instructorId: string): Promise<{ roomUrl: string; token: string }> {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } })
    if (!course) throw new NotFoundException('Course not found')
    if (course.instructorId !== instructorId) throw new ForbiddenException('Not authorized')

    const { roomUrl, roomName } = await this.daily.createRoom(courseId)
    const token = await this.daily.createToken(roomName, true)

    // Find existing session or create a new one
    const existing = await this.prisma.liveSession.findFirst({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
    })

    if (existing) {
      await this.prisma.liveSession.update({
        where: { id: existing.id },
        data: {
          dailyRoomName: roomName,
          dailyRoomUrl: roomUrl,
          isLive: true,
          status: 'LIVE',
          startedAt: new Date(),
          endedAt: null,
          recordingUrl: null,
        },
      })
    } else {
      await this.prisma.liveSession.create({
        data: {
          courseId,
          instructorId,
          dailyRoomName: roomName,
          dailyRoomUrl: roomUrl,
          isLive: true,
          status: 'LIVE',
          startedAt: new Date(),
        },
      })
    }

    await this.prisma.course.update({
      where: { id: courseId },
      data: { liveStatus: 'live', liveViewerCount: 0 },
    })

    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId },
      select: { userId: true },
    })
    for (const e of enrollments) {
      await this.prisma.notification.create({
        data: {
          userId: e.userId,
          titleEn: 'Live Stream Started!',
          titleAr: 'البث المباشر بدأ الآن!',
          contentEn: `${course.titleEn} - Join now`,
          contentAr: `${course.titleAr || course.titleEn} - انضم الآن`,
          type: 'LIVE_STARTED',
          isRead: false,
        },
      }).catch(() => {})
    }

    return { roomUrl, token }
  }

  async joinLive(courseId: string, userId: string): Promise<{ roomUrl: string; token: string; isLive: boolean }> {
    const enrollment = await this.prisma.enrollment.findFirst({ where: { courseId, userId } })
    const course = await this.prisma.course.findUnique({ where: { id: courseId } })
    if (!course) throw new NotFoundException('Course not found')

    const isInstructor = course.instructorId === userId
    if (!isInstructor && !enrollment) {
      return { roomUrl: '', token: '', isLive: false }
    }

    const session = await this.prisma.liveSession.findFirst({
      where: { courseId, isLive: true },
      orderBy: { createdAt: 'desc' },
    })

    if (!session?.dailyRoomName) {
      return { roomUrl: '', token: '', isLive: false }
    }

    const token = await this.daily.createToken(session.dailyRoomName, false)
    return { roomUrl: session.dailyRoomUrl ?? '', token, isLive: true }
  }

  async endLive(courseId: string, instructorId: string): Promise<void> {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } })
    if (!course) throw new NotFoundException('Course not found')
    if (course.instructorId !== instructorId) throw new ForbiddenException('Not authorized')

    const session = await this.prisma.liveSession.findFirst({
      where: { courseId, isLive: true },
      orderBy: { createdAt: 'desc' },
    })

    if (session) {
      await this.prisma.liveSession.update({
        where: { id: session.id },
        data: { isLive: false, status: 'ENDED', endedAt: new Date() },
      })

      if (session.dailyRoomName) {
        await this.daily.deleteRoom(session.dailyRoomName)
        this.pollForRecording(courseId, session.dailyRoomName, session.id).catch((e) =>
          this.logger.warn(`Recording poll failed for ${courseId}: ${e.message}`),
        )
      }
    }

    const updateData: any = { liveStatus: 'ended', liveViewerCount: 0 }
    if (course.autoDeleteAfterLive) updateData.status = 'archived'
    await this.prisma.course.update({ where: { id: courseId }, data: updateData })

    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId },
      select: { userId: true },
    })
    for (const e of enrollments) {
      await this.prisma.notification.create({
        data: {
          userId: e.userId,
          titleEn: 'Live Stream Ended',
          titleAr: 'انتهى البث المباشر',
          contentEn: `${course.titleEn} - Thank you for joining`,
          contentAr: `${course.titleAr || course.titleEn} - شكراً لمشاركتك`,
          type: 'LIVE_ENDED',
          isRead: false,
        },
      }).catch(() => {})
    }
  }

  async pollForRecording(courseId: string, roomName: string, sessionId: string): Promise<void> {
    this.logger.log(`[Live] Waiting 60 s before polling for recording: room=${roomName}`)
    await new Promise(r => setTimeout(r, 60_000))
    const url = await this.daily.getRecordingForRoom(roomName)
    if (url) {
      this.logger.log(`[Live] Recording ready for course ${courseId}: ${url}`)
      await this.saveRecording(courseId, sessionId, url)
    } else {
      this.logger.warn(`[Live] No recording found for room ${roomName} after polling`)
    }
  }

  async saveRecording(courseId: string, sessionId: string, recordingUrl: string): Promise<void> {
    try {
      await this.prisma.liveSession.update({
        where: { id: sessionId },
        data: { recordingUrl },
      })

      let section = await this.prisma.section.findFirst({
        where: { courseId },
        orderBy: { order: 'asc' },
      })
      if (!section) {
        section = await this.prisma.section.create({
          data: { courseId, title: 'Live Recording', order: 0 },
        })
      }

      const previous = await this.prisma.lesson.findFirst({
        where: { sectionId: section.id, recordingUrl: { not: null } },
        orderBy: { createdAt: 'desc' },
      })

      if (previous) {
        await this.prisma.lesson.update({
          where: { id: previous.id },
          data: { videoUrl: recordingUrl, recordingUrl, isPublished: true },
        })
      } else {
        await this.prisma.lesson.create({
          data: {
            sectionId: section.id,
            title: 'Live Session Recording',
            titleAr: 'تسجيل البث المباشر',
            type: 'VIDEO',
            videoUrl: recordingUrl,
            recordingUrl,
            order: 0,
            isPublished: true,
          },
        })
      }

      await this.prisma.course.update({
        where: { id: courseId },
        data: { recordingUrl },
      })
    } catch (e) {
      this.logger.error(`Failed to save recording for course ${courseId}: ${e.message}`)
    }
  }

  async getRecordingUrlForCourse(courseId: string): Promise<{ recordingUrl: string | null }> {
    const session = await this.prisma.liveSession.findFirst({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
    })
    if (!session) return { recordingUrl: null }
    if (session.recordingUrl) return { recordingUrl: session.recordingUrl }
    if (!session.dailyRoomName) return { recordingUrl: null }

    const url = await this.daily.getRecordingForRoom(session.dailyRoomName, 1)
    if (url) {
      await this.prisma.liveSession.update({ where: { id: session.id }, data: { recordingUrl: url } })
      return { recordingUrl: url }
    }
    return { recordingUrl: null }
  }

  async getLiveStatus(courseId: string) {
    const session = await this.prisma.liveSession.findFirst({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
      select: { isLive: true, dailyRoomUrl: true, recordingUrl: true },
    })
    if (!session) {
      return { exists: false, isLive: false, recordingUrl: null }
    }
    return {
      exists: true,
      isLive: session.isLive,
      roomUrl: session.dailyRoomUrl,
      recordingUrl: session.recordingUrl,
    }
  }

  async getCourseStatus(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { liveStatus: true },
    })
    if (!course) return null
    return { liveStatus: course.liveStatus }
  }

  async getLiveCourses(status?: string) {
    const where: any = { type: 'live' }
    if (status) where.liveStatus = status
    else where.liveStatus = { in: ['scheduled', 'live'] }

    const courses = await this.prisma.course.findMany({
      where,
      include: {
        instructor: {
          select: { profile: { select: { firstName: true, lastName: true, avatar: true } } },
        },
        _count: { select: { enrollments: true } },
      },
      orderBy: { liveStartTime: 'asc' },
    })

    return { success: true, data: courses }
  }

  async updateViewerCount(courseId: string, delta: number) {
    await this.prisma.course.update({
      where: { id: courseId },
      data: { liveViewerCount: { increment: delta } },
    })
    return { success: true }
  }

  /**
   * Stores a recording uploaded from the instructor's browser (legacy MediaRecorder flow).
   * Kept for backward compatibility with existing clients.
   */
  async saveRecordingFromFile(
    userId: string,
    courseId: string,
    file: Express.Multer.File,
    title?: string,
    accountType?: string,
    append = false,
  ) {
    if (!courseId) throw new BadRequestException('courseId is required')
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('No recording file provided')
    }

    const course = await this.prisma.course.findUnique({ where: { id: courseId } })
    if (!course) throw new NotFoundException('Course not found')

    const isOwner = course.instructorId === userId
    const isAdmin = accountType === 'ADMIN' || accountType === 'SUPER_ADMIN'
    if (!isOwner && !isAdmin) throw new ForbiddenException('Not authorized')

    const { videoId, videoUrl } = await this.bunny.uploadVideo(file)

    let section = await this.prisma.section.findFirst({
      where: { courseId },
      orderBy: { order: 'asc' },
    })
    if (!section) {
      section = await this.prisma.section.create({
        data: { courseId, title: 'Live Recording', order: 0 },
      })
    }

    const label = (title || '').trim()
    const isArabic = /[؀-ۿ]/.test(label)
    const lessonTitle = label && !isArabic ? label : 'Live Session Recording'
    const lessonTitleAr = label && isArabic ? label : 'تسجيل البث المباشر'

    let order = 0
    if (append) {
      const lastLesson = await this.prisma.lesson.findFirst({
        where: { sectionId: section.id },
        orderBy: { order: 'desc' },
        select: { order: true },
      })
      order = (lastLesson?.order ?? -1) + 1
    }

    const previous = append
      ? null
      : await this.prisma.lesson.findFirst({
          where: { sectionId: section.id, recordingUrl: { not: null } },
          orderBy: { createdAt: 'desc' },
        })

    const lesson = previous
      ? await this.prisma.lesson.update({
          where: { id: previous.id },
          data: { title: lessonTitle, titleAr: lessonTitleAr, type: 'VIDEO', videoUrl, recordingUrl: videoUrl, isPublished: true },
        })
      : await this.prisma.lesson.create({
          data: { sectionId: section.id, title: lessonTitle, titleAr: lessonTitleAr, type: 'VIDEO', videoUrl, recordingUrl: videoUrl, order, isPublished: true },
        })

    await this.prisma.course.update({
      where: { id: courseId },
      data: { recordingUrl: videoUrl },
    })

    return {
      success: true,
      data: { lessonId: lesson.id, videoId, url: videoUrl, sectionId: section.id },
    }
  }
}
