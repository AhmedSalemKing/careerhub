"use client";

/**
 * LiveCourseDetail — the detail page of a LIVE course.
 *
 * A live course is not a curriculum: it is ONE event with (at most) ONE
 * recorded lesson. Showing the normal course layout here made a finished
 * session look like a broken course with an empty curriculum and a
 * "0/0 درس" progress bar, so live courses get their own page:
 *
 *   scheduled → countdown + the session date, and a CTA to the live room
 *   live      → a pulsing "live now" badge and a prominent join button
 *   ended     → the recording (when it exists) and NEVER a join button
 *
 * All dates/times are rendered in the browser timezone with the Gregorian
 * calendar (see lib/live.ts).
 *
 * Icons only — no emoji anywhere in this file.
 */

import { useEffect, useMemo, useState } from "react";
import {
	ArrowLeft,
	ArrowRight,
	Calendar,
	CheckCircle2,
	Clock,
	Loader2,
	PlayCircle,
	Radio,
	User,
	Video,
} from "lucide-react";
import { getCourseTitle, getMediaUrl } from "../../lib/media";
import {
	formatLiveDateLong,
	formatLiveTimeShort,
	liveCountdownParts,
	liveRecordingNote,
	normalizeLiveStatus,
} from "../../lib/live";
import LiveRecordingPlayer from "./LiveRecordingPlayer";

export interface LiveCourseDetailProps {
	course: any;
	locale: string;
	isDark: boolean;
	isEnrolled: boolean;
	enrollmentStatus?: "loading" | "enrolled" | "not-enrolled";
	enrolling?: boolean;
	onEnroll?: () => void;
	cloudRecordingUrl?: string | null;
}

export default function LiveCourseDetail({
	course,
	locale,
	isDark,
	isEnrolled,
	enrollmentStatus = "not-enrolled",
	enrolling = false,
	onEnroll,
	cloudRecordingUrl = null,
}: LiveCourseDetailProps) {
	const isAr = locale === "ar";

	const liveState = normalizeLiveStatus(course?.liveStatus);
	const isLive = liveState === "live";
	const isScheduled = liveState === "scheduled";
	const isEnded = liveState === "ended";

	const title = getCourseTitle(course, locale);
	const description =
		course?.descriptionAr || course?.descriptionEn || course?.description || "";
	const thumb = getMediaUrl(course?.thumbnail);

	const instructorProfile = course?.instructor?.profile;
	const instructorName = instructorProfile
		? `${instructorProfile.firstName ?? ""} ${instructorProfile.lastName ?? ""}`.trim() ||
		  (isAr ? "المدرب" : "Instructor")
		: isAr
			? "المدرب"
			: "Instructor";
	const instructorAvatar = getMediaUrl(instructorProfile?.avatar);

	const sections: any[] = Array.isArray(course?.sections)
		? course.sections
		: Array.isArray(course?.modules)
			? course.modules
			: [];

	const lessons = useMemo(
		() => sections.flatMap((s: any) => (Array.isArray(s?.lessons) ? s.lessons : [])),
		[sections],
	);

	// The recording (when the pipeline produced one) is a single video lesson.
	// It is only shown once the session is over — a running or upcoming
	// session is watched in the live room, not from a file.
	const recordedLesson = useMemo(
		() => lessons.find((l: any) => !!l?.videoUrl) ?? null,
		[lessons],
	);
	const lessonRecordingUrl = recordedLesson ? getMediaUrl(recordedLesson.videoUrl) : null;
	// Use the cloud recording URL as a fallback when the lesson pipeline hasn't
	// created a lesson yet (the recording is available on Daily.co but saveRecording
	// hasn't run or hasn't persisted yet).
	const recordingUrl = lessonRecordingUrl ?? cloudRecordingUrl ?? null;
	const hasRecording = isEnded && !!recordingUrl;

	// The countdown has to tick, otherwise it freezes on the value it had when
	// the page was rendered.
	const [, setTick] = useState(0);
	useEffect(() => {
		if (!isScheduled) return;
		const id = setInterval(() => setTick((t) => t + 1), 30000);
		return () => clearInterval(id);
	}, [isScheduled]);

	const countdown = liveCountdownParts(course?.liveStartTime);

	// Duration: the recorded lesson metadata when it exists, otherwise the
	// scheduled start/end window of the session.
	const durationMinutes = useMemo(() => {
		const seconds = recordedLesson?.videoDuration;
		if (typeof seconds === "number" && seconds > 0) {
			return Math.max(1, Math.round(seconds / 60));
		}
		const start = course?.liveStartTime
			? new Date(course.liveStartTime).getTime()
			: 0;
		const end = course?.liveEndTime ? new Date(course.liveEndTime).getTime() : 0;
		if (start && end && end > start) {
			return Math.round((end - start) / 60000);
		}
		return null;
	}, [recordedLesson, course?.liveStartTime, course?.liveEndTime]);

	const bg = isDark ? "#0d0d0d" : "#ffffff";
	const surfaceBg = isDark ? "#111111" : "#f8f8fa";
	const textPrimary = isDark ? "#f1f5f9" : "#0d0d0d";
	const textSecondary = isDark ? "#94a3b8" : "#64748b";
	const borderColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb";
	const purple = "#5120c8";
	const red = "#dc2626";
	const amber = "#f59e0b";

	const liveHref = `/${locale}/live/${course?.id}`;
	const watchHref = `/${locale}/learn/${course?.id}`;

	// ── Badge ────────────────────────────────────────────────────────────────
	const badge = isLive
		? {
				label: isAr ? "مباشر الآن" : "Live now",
				icon: Radio,
				color: red,
				background: "rgba(220,38,38,0.14)",
				border: "rgba(220,38,38,0.4)",
				pulsing: true,
			}
		: isScheduled
			? {
					label: isAr ? "مجدول" : "Scheduled",
					icon: Calendar,
					color: amber,
					background: "rgba(245,158,11,0.12)",
					border: "rgba(245,158,11,0.35)",
					pulsing: false,
				}
			: isEnded
				? hasRecording
					? {
							label: isAr ? "بث مسجل" : "Recorded session",
							icon: PlayCircle,
							color: purple,
							background: "rgba(81,32,200,0.12)",
							border: "rgba(81,32,200,0.35)",
							pulsing: false,
						}
					: {
							label: isAr ? "انتهى" : "Ended",
							icon: CheckCircle2,
							color: textSecondary,
							background: "rgba(148,163,184,0.12)",
							border: "rgba(148,163,184,0.3)",
							pulsing: false,
						}
				: {
						label: isAr ? "بث مباشر" : "Live session",
						icon: Radio,
						color: purple,
						background: "rgba(81,32,200,0.12)",
						border: "rgba(81,32,200,0.35)",
						pulsing: false,
					};

	const BadgeIcon = badge.icon;

	return (
		<div
			className="min-h-screen"
			dir={isAr ? "rtl" : "ltr"}
			style={{ background: bg, color: textPrimary }}>
			<div className="max-w-5xl mx-auto px-6 py-8">
				{/* Back to the catalogue */}
				<a
					href={`/${locale}/courses`}
					className="inline-flex items-center gap-2 text-sm font-medium mb-6 hover:opacity-70 transition-opacity"
					style={{ color: textSecondary }}>
					{isAr ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
					{isAr ? "العودة إلى الكورسات" : "Back to courses"}
				</a>

				{/* ── Stage: the recording, or an honest placeholder ─────────── */}
				<div
					id="live-recording"
					className="rounded-2xl overflow-hidden"
					style={{
						background: "#000",
						border: `1px solid ${borderColor}`,
						boxShadow: "0 8px 40px rgba(0,0,0,0.14)",
					}}>
					{hasRecording && recordingUrl ? (
						<LiveRecordingPlayer src={recordingUrl} poster={thumb} />
					) : (
						<div
							className="flex flex-col items-center justify-center text-center gap-4 px-6"
							style={{
								aspectRatio: "16/9",
								background: isDark
									? "linear-gradient(135deg, #0d0a1a 0%, #1a1040 100%)"
									: "linear-gradient(135deg, #f4f4fb 0%, #e9e7f8 100%)",
							}}>
							{isLive ? (
								<>
									<div
										className="flex items-center justify-center rounded-full"
										style={{
											width: 72,
											height: 72,
											background: "rgba(220,38,38,0.14)",
											border: "2px solid rgba(220,38,38,0.4)",
										}}>
										<Radio size={32} style={{ color: red }} />
									</div>
									<p
										className="text-lg font-bold"
										style={{ color: textPrimary }}>
										{isAr
											? "البث جارٍ الآن"
											: "The stream is live right now"}
									</p>
									<p
										className="text-sm max-w-md"
										style={{ color: textSecondary }}>
										{isAr
											? "انضم من صفحة البث لمشاهدة الجلسة مباشرة."
											: "Open the live room to watch the session."}
									</p>
								</>
							) : isEnded ? (
								<>
									<div
										className="flex items-center justify-center rounded-full"
										style={{
											width: 72,
											height: 72,
											background: "rgba(148,163,184,0.14)",
											border: "2px solid rgba(148,163,184,0.35)",
										}}>
										<Clock size={30} style={{ color: textSecondary }} />
									</div>
									<p
										className="text-lg font-bold"
										style={{ color: textPrimary }}>
										{isAr
											? "جارٍ معالجة التسجيل..."
											: "Processing the recording..."}
									</p>
									<p
										className="text-sm max-w-md"
										style={{ color: textSecondary }}>
										{liveRecordingNote(locale)}
									</p>
								</>
							) : (
								<>
									<div
										className="flex items-center justify-center rounded-full"
										style={{
											width: 72,
											height: 72,
											background: "rgba(245,158,11,0.14)",
											border: "2px solid rgba(245,158,11,0.4)",
										}}>
										<Calendar size={30} style={{ color: amber }} />
									</div>
									<p
										className="text-lg font-bold"
										style={{ color: textPrimary }}>
										{isAr ? "موعد البث" : "Scheduled for"}
									</p>
									<p
										className="text-sm font-medium"
										style={{ color: textSecondary }}>
										{course?.liveStartTime
											? `${formatLiveDateLong(course.liveStartTime, locale)} · ${formatLiveTimeShort(course.liveStartTime, locale)}`
											: isAr
												? "سيُحدَّد الموعد لاحقاً"
												: "The date will be announced soon"}
									</p>
									{countdown.isUpcoming && (
										<p
											className="text-sm font-semibold"
											style={{ color: amber }}>
											{countdown.days > 0
												? isAr
													? `يبدأ بعد ${countdown.days} يوم`
													: `Starts in ${countdown.days}d`
												: countdown.hours > 0
													? isAr
														? `يبدأ بعد ${countdown.hours} ساعة ${countdown.minutes} دقيقة`
														: `Starts in ${countdown.hours}h ${countdown.minutes}m`
													: isAr
														? `يبدأ بعد ${countdown.minutes} دقيقة`
														: `Starts in ${countdown.minutes}m`}
										</p>
									)}
								</>
							)}
						</div>
					)}
				</div>

				{/* ── Title + badges ──────────────────────────────────────────── */}
				<div className="mt-6 flex flex-wrap items-center gap-3">
					<span
						className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold${badge.pulsing ? " dw-pulse" : ""}`}
						style={{
							background: badge.background,
							border: `1px solid ${badge.border}`,
							color: badge.color,
						}}>
						<BadgeIcon size={14} />
						{badge.label}
					</span>
					<span
						className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
						style={{
							background: surfaceBg,
							border: `1px solid ${borderColor}`,
							color: textSecondary,
						}}>
						<Video size={14} />
						{isAr ? "بث مباشر" : "Live session"}
					</span>
				</div>

				<h1
					className="mt-4 text-3xl md:text-4xl font-bold leading-tight"
					style={{ color: textPrimary }}>
					{title}
				</h1>

				<div
					className="mt-4 h-px w-full"
					style={{ background: borderColor }}
				/>

				{/* ── Meta: date, time, duration, instructor ─────────────────── */}
				<div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
					{course?.liveStartTime && (
						<div className="flex items-center gap-2">
							<Calendar size={16} style={{ color: purple }} />
							<span className="text-sm" style={{ color: textSecondary }}>
								{formatLiveDateLong(course.liveStartTime, locale)}
							</span>
						</div>
					)}
					{course?.liveStartTime && (
						<div className="flex items-center gap-2">
							<Clock size={16} style={{ color: purple }} />
							<span className="text-sm" style={{ color: textSecondary }}>
								{formatLiveTimeShort(course.liveStartTime, locale)}
							</span>
						</div>
					)}
					{durationMinutes !== null && (
						<div className="flex items-center gap-2">
							<Video size={16} style={{ color: purple }} />
							<span className="text-sm" style={{ color: textSecondary }}>
								{isAr
									? `مدة البث: ${durationMinutes} دقيقة`
									: `Duration: ${durationMinutes} min`}
							</span>
						</div>
					)}
					<div className="flex items-center gap-2">
						{instructorAvatar ? (
							<img
								src={instructorAvatar}
								alt={instructorName}
								style={{
									width: 26,
									height: 26,
									borderRadius: "50%",
									objectFit: "cover",
								}}
							/>
						) : (
							<User size={16} style={{ color: purple }} />
						)}
						<span className="text-sm font-medium" style={{ color: textPrimary }}>
							{instructorName}
						</span>
					</div>
				</div>

				<div
					className="mt-5 h-px w-full"
					style={{ background: borderColor }}
				/>

				{/* ── Description ────────────────────────────────────────────── */}
				{description && (
					<p
						className="mt-5 text-sm leading-loose whitespace-pre-line"
						style={{ color: textSecondary }}>
						{description}
					</p>
				)}

				{/* ── Call to action ─────────────────────────────────────────── */}
				<div className="mt-7">
					{enrollmentStatus === "loading" ? (
						<button
							disabled
							className="w-full sm:w-auto flex items-center justify-center gap-2 py-4 px-8 rounded-xl font-bold text-base"
							style={{
								background: "rgba(148,163,184,0.15)",
								color: textSecondary,
								cursor: "wait",
								border: `1px solid ${borderColor}`,
							}}>
							<Loader2 size={20} className="animate-spin" />
							{isAr ? "جارٍ التحقق..." : "Checking enrollment..."}
						</button>
					) : !isEnrolled ? (
						// Not enrolled yet: the CTA is the enrollment, never a join.
						<button
							onClick={onEnroll}
							disabled={enrolling}
							className="w-full sm:w-auto flex items-center justify-center gap-2 py-4 px-8 rounded-xl font-bold text-base text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed"
							style={{
								background: "linear-gradient(135deg, #5120c8, #7c3aed)",
								boxShadow: "0 4px 24px rgba(108,60,224,0.35)",
							}}>
							{enrolling ? (
								<>
									<Loader2 size={20} className="animate-spin" />
									{isAr ? "جاري الاشتراك..." : "Enrolling..."}
								</>
							) : (
								<>
									<User size={20} />
									{isEnded
										? isAr
											? "اشترك للوصول إلى التسجيل"
											: "Enroll to access the recording"
										: isAr
											? "اشترك للمشاركة في البث"
											: "Enroll to attend the session"}
								</>
							)}
						</button>
					) : isEnded ? (
						hasRecording ? (
							<a
								href={watchHref}
								className="w-full sm:w-auto flex items-center justify-center gap-2 py-4 px-8 rounded-xl font-bold text-base text-white transition-all"
								style={{
									background: "linear-gradient(135deg, #5120c8, #7c3aed)",
									boxShadow: "0 4px 24px rgba(108,60,224,0.35)",
									textDecoration: "none",
								}}>
								<PlayCircle size={20} strokeWidth={2.5} />
								{isAr ? "شاهد التسجيل الكامل" : "Watch the full recording"}
							</a>
						) : null
					) : isLive ? (
						<a
							href={liveHref}
							className="w-full sm:w-auto flex items-center justify-center gap-2 py-4 px-8 rounded-xl font-bold text-base text-white transition-all"
							style={{
								background: "linear-gradient(135deg, #dc2626, #b91c1c)",
								boxShadow: "0 4px 24px rgba(220,38,38,0.35)",
								textDecoration: "none",
							}}>
							<Radio size={20} strokeWidth={2.5} />
							{isAr ? "انضم للبث الآن" : "Join the live session now"}
						</a>
					) : (
						<a
							href={liveHref}
							className="w-full sm:w-auto flex items-center justify-center gap-2 py-4 px-8 rounded-xl font-bold text-base text-white transition-all"
							style={{
								background: "linear-gradient(135deg, #dc2626, #b91c1c)",
								boxShadow: "0 4px 24px rgba(220,38,38,0.35)",
								textDecoration: "none",
							}}>
							<Radio size={20} strokeWidth={2.5} />
							{isAr ? "انضم للبث المباشر" : "Join the live stream"}
						</a>
					)}
				</div>
			</div>
		</div>
	);
}
