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
      const now = new Date()
      const started = session.startedAt ?? course.liveStartTime ?? now
      const durationMinutes = Math.max(
        1,
        Math.round((now.getTime() - new Date(started).getTime()) / 60000),
      )
      await this.prisma.liveSession.update({
        where: { id: session.id },
        data: { isLive: false, status: 'ENDED', endedAt: now, durationMinutes },
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
    const result = await this.daily.getRecordingWithId(roomName)
    if (result) {
      this.logger.log(`[Live] Recording ready for course ${courseId}: recordingId=${result.id}`)
      // Store the Daily.co recording ID so getRecordingUrlForCourse can always fetch
      // a fresh pre-signed URL without re-listing. The URL itself is never cached.
      await this.prisma.liveRecording.upsert({
        where: { liveSessionId: sessionId },
        update: { sid: result.id, status: 'READY' },
        create: { liveSessionId: sessionId, sid: result.id, status: 'READY' },
      }).catch((e: Error) => this.logger.warn(`Could not upsert LiveRecording: ${e.message}`))
      await this.saveRecording(courseId, sessionId, result.url)
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
      include: { recording: { select: { sid: true } } },
    })
    if (!session) return { recordingUrl: null }

    const recordingId = session.recording?.sid

    if (recordingId) {
      // Always fetch a fresh pre-signed URL — Daily.co access links expire ~1 hour
      const url = await this.daily.getAccessLink(recordingId)
      return { recordingUrl: url }
    }

    if (!session.dailyRoomName) return { recordingUrl: null }

    // Fallback: list the room's recordings (one attempt) to find the ID and URL
    const result = await this.daily.getRecordingWithId(session.dailyRoomName, 1)
    if (result) {
      // Store the ID so future calls skip the list step
      await this.prisma.liveRecording.upsert({
        where: { liveSessionId: session.id },
        update: { sid: result.id, status: 'READY' },
        create: { liveSessionId: session.id, sid: result.id, status: 'READY' },
      }).catch((e: Error) => this.logger.warn(`Could not upsert LiveRecording: ${e.message}`))
      return { recordingUrl: result.url }
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

  async getLiveManageData(courseId: string, instructorId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true, avatar: true } },
          },
        },
        _count: { select: { enrollments: true } },
      },
    })
    if (!course || course.instructorId !== instructorId) {
      throw new ForbiddenException('Not authorized')
    }

    const session = await this.prisma.liveSession.findFirst({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
      include: { recording: { select: { sid: true } } },
    })

    let recordingUrl: string | null = null
    if (session?.recording?.sid) {
      try {
        recordingUrl = await this.daily.getAccessLink(session.recording.sid)
      } catch (e) {
        this.logger.warn(`Could not fetch recording access link for ${courseId}: ${e.message}`)
        recordingUrl = null
      }
    }

    const instructorProfile = course.instructor?.profile
    const instructorName = instructorProfile
      ? `${instructorProfile.firstName ?? ''} ${instructorProfile.lastName ?? ''}`.trim()
      : null

    const sessionStatus = session?.status ?? 'SCHEDULED'

    const computedDuration = (() => {
      if (session?.durationMinutes && session.durationMinutes > 0) {
        return session.durationMinutes
      }
      if (session?.startedAt && session?.endedAt) {
        return Math.round(
          (new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 60000,
        )
      }
      if (course?.liveStartTime && session?.endedAt) {
        return Math.round(
          (new Date(session.endedAt).getTime() - new Date(course.liveStartTime).getTime()) / 60000,
        )
      }
      return course?.duration ?? 0
    })()

    if (computedDuration > 0 && (!session?.durationMinutes || session.durationMinutes === 0)) {
      await this.prisma.liveSession.update({
        where: { id: session.id },
        data: { durationMinutes: computedDuration },
      }).catch(() => {})
    }

    return {
      success: true,
      data: {
        course: {
          id: course.id,
          title: course.titleAr || course.titleEn,
          description: course.descriptionAr || course.descriptionEn || '',
          thumbnail: course.thumbnail,
          publishStatus: course.status,
          enrollmentsCount: course._count.enrollments,
        },
        instructor: {
          id: course.instructor?.id ?? null,
          name: instructorName,
          avatar: instructorProfile?.avatar ?? null,
        },
        session: session
          ? {
              id: session.id,
              status: sessionStatus,
              scheduledAt: course.liveStartTime?.toISOString() ?? null,
              startedAt: session.startedAt?.toISOString() ?? null,
              endedAt: session.endedAt?.toISOString() ?? null,
              durationMinutes: computedDuration,
              viewerCount: course.liveViewerCount ?? 0,
              dailyRecordingId: session.recording?.sid ?? null,
            }
          : null,
        recordingUrl,
      },
    }
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
