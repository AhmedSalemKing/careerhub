import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { AgoraService } from './agora.service'
import { BunnyStreamService } from '../upload/bunny-stream.service'

@Injectable()
export class LiveService {
  /**
   * The recording is produced by the instructor's browser (MediaRecorder) and
   * uploaded to this API, which stores it on Bunny.net Stream and turns it
   * into a Lesson. Agora Cloud Recording is not used and is not needed.
   */
  readonly recordingSupported = true;

  constructor(
    private prisma: PrismaService,
    private agora: AgoraService,
    private bunny: BunnyStreamService,
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

    // The recording is produced in the instructor's browser and uploaded right
    // after the stream ended, so at this exact moment there is nothing to
    // watch yet. The message says so instead of pretending the recording is
    // already there — and it never promises a recording that does not exist.
    const recordingAvailable = !!(await this.prisma.lesson.findFirst({
      where: { section: { courseId }, recordingUrl: { not: null } },
      select: { id: true },
    }))

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
        messageAr: 'يُحفظ التسجيل من متصفح المحاضر ويظهر للمشتركين بعد انتهاء الرفع',
        messageEn: 'The recording is captured in the instructor browser and appears once the upload finishes',
      },
    }
  }

  /**
   * Stores the recording the instructor's browser produced with MediaRecorder.
   *
   * The file goes to Bunny.net Stream through `BunnyStreamService` — the very
   * same service the regular video upload uses — and the returned HLS URL is
   * attached to a Lesson so the students find the recording in the course
   * page like any other video.
   */
  async saveRecording(
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

    // Bunny.net Stream — identical path as POST /upload/video. uploadVideo()
    // returns the full HLS playlist URL (`videoUrl`); the bare video id is not
    // playable, so this is what the lesson and the player need.
    const { videoId, videoUrl } = await this.bunny.uploadVideo(file)

    // The recording has to live in the curriculum, otherwise the student
    // pages never find it. A live course usually has no section yet, so one
    // is created for the recording.
    let section = await this.prisma.section.findFirst({
      where: { courseId },
      orderBy: { order: 'asc' },
    })
    if (!section) {
      section = await this.prisma.section.create({
        data: { courseId, title: 'Live Recording', order: 0 },
      })
    }

    // The label arrives in the instructor's language, so both spellings of the
    // lesson title are filled in.
    const label = (title || '').trim()
    const isArabic = /[؀-ۿ]/.test(label)
    let lessonTitle = label && !isArabic ? label : 'Live Session Recording'
    let lessonTitleAr = label && isArabic ? label : 'تسجيل البث المباشر'

    // The recording switches between the camera and the screen share while the
    // stream runs. Every finished segment is uploaded with append=true and kept
    // as its own lesson; the final upload (and a retry of it) replaces the
    // previous recording so repeated attempts do not pile up.
    let order = 0
    let liveStillRunning = false
    if (append) {
      const [lastLesson, segmentCount, liveLessons] = await Promise.all([
        this.prisma.lesson.findFirst({
          where: { sectionId: section.id },
          orderBy: { order: 'desc' },
          select: { order: true },
        }),
        this.prisma.lesson.count({
          where: { sectionId: section.id, recordingUrl: { not: null } },
        }),
        // A course live and a lesson live are two different flows; either one
        // means the session has not ended yet.
        this.prisma.lesson.count({
          where: { section: { courseId }, liveStatus: 'live' },
        }),
      ])
      order = (lastLesson?.order ?? -1) + 1
      liveStillRunning = course.liveStatus === 'live' || liveLessons > 0
      if (segmentCount > 0) {
        lessonTitle = `${lessonTitle} (${segmentCount + 1})`
        lessonTitleAr = `${lessonTitleAr} (${segmentCount + 1})`
      }
    }

    // A retry must not pile up recordings: the previous one is replaced.
    const previous = append
      ? null
      : await this.prisma.lesson.findFirst({
          where: { sectionId: section.id, recordingUrl: { not: null } },
          orderBy: { createdAt: 'desc' },
        })

    const lesson = previous
      ? await this.prisma.lesson.update({
          where: { id: previous.id },
          data: {
            title: lessonTitle,
            titleAr: lessonTitleAr,
            type: 'VIDEO',
            videoUrl: videoUrl,
            recordingUrl: videoUrl,
            isPublished: true,
          },
        })
      : await this.prisma.lesson.create({
          data: {
            sectionId: section.id,
            title: lessonTitle,
            titleAr: lessonTitleAr,
            type: 'VIDEO',
            videoUrl: videoUrl,
            recordingUrl: videoUrl,
            order,
            isPublished: true,
          },
        })

    await this.prisma.course.update({
      where: { id: courseId },
      data: {
        recordingUrl: videoUrl,
        // A live course is finished once its recording is in; a regular
        // course keeps its own status. An intermediate segment of a session
        // that is still running must never mark it ended — the viewer page
        // refuses to join a course whose liveStatus is 'ended'.
        ...(course.type === 'live' && !liveStillRunning
          ? { liveStatus: 'ended' }
          : {}),
      },
    })

    return {
      success: true,
      data: { lessonId: lesson.id, videoId, url: videoUrl, sectionId: section.id },
    }
  }

  /**
   * Read-only snapshot used by the socket gateway to answer a late joiner:
   * "is this course live right now, and on which Agora channel?".
   *
   * Both live flows are covered — course-level (`/live/start` writes
   * Course.liveStatus + Course.agoraChannelName) and lesson-level
   * (`/live/lesson-start` writes Lesson.liveStatus + Lesson.agoraChannelName).
   */
  async getCourseStatus(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        liveStatus: true,
        agoraChannelName: true,
        sections: {
          select: {
            lessons: {
              where: { liveStatus: 'live' },
              select: { id: true, agoraChannelName: true },
              take: 1,
            },
          },
        },
      },
    })
    if (!course) return null

    const liveLesson = course.sections.flatMap((s) => s.lessons)[0]
    if (liveLesson) {
      return {
        liveStatus: 'live',
        agoraChannelName: liveLesson.agoraChannelName || `lesson_${liveLesson.id}`,
      }
    }

    return {
      liveStatus: course.liveStatus,
      agoraChannelName: course.agoraChannelName,
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
