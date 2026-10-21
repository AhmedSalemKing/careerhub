import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { AgoraService } from './agora.service'

@Injectable()
export class LiveService {
  /**
   * Agora Cloud Recording is NOT integrated: there is no call that starts a
   * cloud recording, none that stops it and none that reads the resulting
   * m3u8/mp4 URL, so no recording file can ever be produced by a live session.
   * Until that integration exists the API (and the UI) must say so plainly
   * instead of promising a recording that will never appear.
   */
  readonly recordingSupported = false;

  constructor(
    private prisma: PrismaService,
    private agora: AgoraService,
  ) {}

  async getAgoraToken(courseId: string, userId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } })
    if (!course) throw new NotFoundException('Course not found')
    if (course.type !== 'live') throw new BadRequestException('Not a live course')
    if ((course as any).liveStatus === 'ended') {
      throw new ForbiddenException('Live stream has ended')
    }

    const isInstructor = course.instructorId === userId
    if (!isInstructor) {
      const enrollment = await this.prisma.enrollment.findFirst({
        where: { courseId, userId }
      })
      if (!enrollment) throw new ForbiddenException('Not enrolled in this course')
    }

    const channelName = course.agoraChannelName || courseId
    const uid = Math.floor(Math.random() * 100000)
    const role = isInstructor ? 'publisher' : 'subscriber'
    const token = this.agora.generateToken(channelName, uid, role)

    return {
      success: true,
      data: {
        token,
        channelName,
        uid,
        appId: this.agora.getAppId(),
        role,
      }
    }
  }

  async startLive(courseId: string, instructorId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } })
    if (!course) throw new NotFoundException('Course not found')
    if (course.instructorId !== instructorId) throw new ForbiddenException('Not authorized')
    if (course.type !== 'live') throw new BadRequestException('Not a live course')

    const channelName = this.agora.generateChannelName(courseId)
    const uid = 1
    const token = this.agora.generateToken(channelName, uid, 'publisher')

    await this.prisma.course.update({
      where: { id: courseId },
      data: {
        liveStatus: 'live',
        agoraChannelName: channelName,
        liveViewerCount: 0,
      }
    })

    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId },
      select: { userId: true }
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
        }
      }).catch(() => {})
    }

    return {
      success: true,
      data: {
        token,
        channelName,
        uid,
        appId: this.agora.getAppId(),
      }
    }
  }

  async endLive(courseId: string, instructorId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } })
    if (!course) throw new NotFoundException('Course not found')
    if (course.instructorId !== instructorId) throw new ForbiddenException('Not authorized')

    const updateData: any = {
      liveStatus: 'ended',
      liveViewerCount: 0,
    }

    if (course.autoDeleteAfterLive) {
      updateData.status = 'archived'
    }

    await this.prisma.course.update({ where: { id: courseId }, data: updateData })

    // Agora Cloud Recording is not integrated (see `recordingSupported`), so
    // there is no URL to retrieve and no Lesson to create from a recording.
    // Never tell students a recording exists when one was never produced —
    // the pending autoPublishRecording flag is intentionally ignored here.
    const recordingAvailable = false

    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId },
      select: { userId: true }
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
        }
      }).catch(() => {})
    }

    return {
      success: true,
      data: {
        autoDelete: course.autoDeleteAfterLive,
        recordingSupported: this.recordingSupported,
        recordingAvailable,
        messageAr: 'التسجيل التلقائي غير متوفر بعد — سيتم إضافته قريباً',
        messageEn: 'Auto-recording is not available yet — it will be added soon',
      },
    }
  }

  async getLiveCourses(status?: string) {
    const where: any = { type: 'live' }
    if (status) where.liveStatus = status
    else where.liveStatus = { in: ['scheduled', 'live'] }

    const courses = await this.prisma.course.findMany({
      where,
      include: {
        instructor: {
          select: { profile: { select: { firstName: true, lastName: true, avatar: true } } }
        },
        _count: { select: { enrollments: true } }
      },
      orderBy: { liveStartTime: 'asc' }
    })

    return { success: true, data: courses }
  }

  async updateViewerCount(courseId: string, delta: number) {
    await this.prisma.course.update({
      where: { id: courseId },
      data: { liveViewerCount: { increment: delta } }
    })
    return { success: true }
  }

  async getLessonAgoraToken(lessonId: string, userId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { section: { include: { course: true } } }
    })
    if (!lesson) throw new NotFoundException('Lesson not found')

    const course = lesson.section?.course
    const isInstructor = course?.instructorId === userId

    if (!isInstructor) {
      const enrollment = await this.prisma.enrollment.findFirst({
        where: { courseId: course?.id, userId }
      })
      if (!enrollment) throw new ForbiddenException('Not enrolled')
    }

    const channelName = lesson.agoraChannelName || `lesson_${lessonId}`
    const uid = Math.floor(Math.random() * 100000)
    const role = isInstructor ? 'publisher' : 'subscriber'
    const token = this.agora.generateToken(channelName, uid, role)

    return { success: true, data: { token, channelName, uid, appId: this.agora.getAppId(), role } }
  }

  async startLessonLive(lessonId: string, instructorId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { section: { include: { course: true } } }
    })
    if (!lesson) throw new NotFoundException('Lesson not found')
    if (lesson.section?.course?.instructorId !== instructorId) throw new ForbiddenException('Not authorized')

    const channelName = `lesson_${lessonId}_${Date.now()}`
    const token = this.agora.generateToken(channelName, 1, 'publisher')

    await this.prisma.lesson.update({
      where: { id: lessonId },
      data: { liveStatus: 'live', agoraChannelName: channelName }
    })

    return { success: true, data: { token, channelName, appId: this.agora.getAppId() } }
  }

  async endLessonLive(lessonId: string, instructorId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { section: { include: { course: true } } }
    })
    if (!lesson) throw new NotFoundException('Lesson not found')
    if (lesson.section?.course?.instructorId !== instructorId) throw new ForbiddenException('Not authorized')

    await this.prisma.lesson.update({
      where: { id: lessonId },
      data: { liveStatus: 'ended' }
    })

    return { success: true }
  }
}
