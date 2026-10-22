"use client";

/**
 * LiveSessionReplay — the watch page of a live session that already ended.
 *
 * A live course has no curriculum: it has one lesson at most. The normal
 * watch page showed an empty lesson tree, a "0/0 درس" progress bar and a
 * certificate section that can never be completed, which made a finished
 * session look broken. This page is just the recording, the description and
 * the instructor.
 *
 * Icons only — no emoji anywhere in this file.
 */

import { useMemo } from "react";
import {
	ArrowLeft,
	ArrowRight,
	Calendar,
	Clock,
	PlayCircle,
	CheckCircle2,
	User,
	Video,
} from "lucide-react";
import { getCourseTitle, getMediaUrl } from "../../lib/media";
import {
	formatLiveDateLong,
	formatLiveTimeShort,
	liveRecordingNote,
} from "../../lib/live";
import VideoProtection from "../VideoProtection";
import LiveRecordingPlayer from "./LiveRecordingPlayer";

export interface LiveSessionReplayProps {
	course: any;
	locale: string;
	isDark: boolean;
	userEmail?: string;
}

export default function LiveSessionReplay({
	course,
	locale,
	isDark,
	userEmail,
}: LiveSessionReplayProps) {
	const isAr = locale === "ar";

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

	const recordedLesson = useMemo(() => {
		const lessons = sections.flatMap((s: any) =>
			Array.isArray(s?.lessons) ? s.lessons : [],
		);
		return lessons.find((l: any) => !!l?.videoUrl) ?? null;
	}, [sections]);

	const recordingUrl = recordedLesson
		? getMediaUrl(recordedLesson.videoUrl)
		: null;

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
	const cardBg = isDark ? "#161616" : "#ffffff";
	const surfaceBg = isDark ? "#111111" : "#f8f8fa";
	const textPrimary = isDark ? "#f1f5f9" : "#0d0d0d";
	const textSecondary = isDark ? "#94a3b8" : "#64748b";
	const borderColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb";
	const purple = "#5120c8";

	return (
		<div
			className="min-h-screen"
			dir={isAr ? "rtl" : "ltr"}
			style={{ background: bg, color: textPrimary }}>
			<div className="max-w-4xl mx-auto px-6 py-8">
				<a
					href={`/${locale}/courses/${course?.id}`}
					className="inline-flex items-center gap-2 text-sm font-medium mb-6 hover:opacity-70 transition-opacity"
					style={{ color: textSecondary }}>
					{isAr ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
					{isAr ? "العودة إلى صفحة البث" : "Back to the session"}
				</a>

				{/* ── The recording ───────────────────────────────────────────── */}
				{recordingUrl ? (
					<div
						className="rounded-2xl overflow-hidden"
						style={{
							background: "#000",
							border: `1px solid ${borderColor}`,
							boxShadow: "0 8px 40px rgba(0,0,0,0.14)",
						}}>
						<LiveRecordingPlayer src={recordingUrl} poster={thumb} />
					</div>
				) : (
					<div
						className="rounded-2xl flex flex-col items-center justify-center text-center gap-3 px-6"
						style={{
							aspectRatio: "16/9",
							background: isDark
								? "linear-gradient(135deg, #0d0a1a 0%, #1a1040 100%)"
								: "linear-gradient(135deg, #f4f4fb 0%, #e9e7f8 100%)",
							border: `1px solid ${borderColor}`,
						}}>
						<Video size={36} style={{ color: textSecondary }} />
						<p className="text-base font-bold" style={{ color: textPrimary }}>
							{isAr ? "التسجيل غير متاح لهذا البث" : "No recording for this session"}
						</p>
						<p className="text-sm max-w-md" style={{ color: textSecondary }}>
							{liveRecordingNote(locale)}
						</p>
					</div>
				)}

				{/* ── Title + subtitle ────────────────────────────────────────── */}
				<div className="mt-6 flex flex-wrap items-center gap-3">
					<span
						className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
						style={{
							background: recordingUrl
								? "rgba(81,32,200,0.12)"
								: "rgba(148,163,184,0.12)",
							border: recordingUrl
								? "1px solid rgba(81,32,200,0.35)"
								: "1px solid rgba(148,163,184,0.3)",
							color: recordingUrl ? purple : textSecondary,
						}}>
						{recordingUrl ? <PlayCircle size={14} /> : <CheckCircle2 size={14} />}
						{recordingUrl
							? (isAr ? "بث مسجل" : "Recorded session")
							: (isAr ? "انتهى" : "Ended")}
					</span>
				</div>

				<h1
					className="mt-3 text-2xl md:text-3xl font-bold leading-tight"
					style={{ color: textPrimary }}>
					{title}
				</h1>
				<p className="mt-1 text-base font-medium" style={{ color: textSecondary }}>
					{isAr ? "تسجيل البث المباشر" : "Live session recording"}
				</p>

				{/* ── Meta ────────────────────────────────────────────────────── */}
				<div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
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
				</div>

				{/* ── Description ─────────────────────────────────────────────── */}
				{description && (
					<div
						className="mt-6 rounded-2xl p-5"
						style={{
							background: surfaceBg,
							border: `1px solid ${borderColor}`,
						}}>
						<p
							className="text-sm leading-loose whitespace-pre-line"
							style={{ color: textSecondary }}>
							{description}
						</p>
					</div>
				)}

				{/* ── Instructor ──────────────────────────────────────────────── */}
				<div
					className="mt-5 rounded-2xl p-5 flex items-center gap-4"
					style={{
						background: cardBg,
						border: `1px solid ${borderColor}`,
					}}>
					{instructorAvatar ? (
						<img
							src={instructorAvatar}
							alt={instructorName}
							style={{
								width: 48,
								height: 48,
								borderRadius: "50%",
								objectFit: "cover",
							}}
						/>
					) : (
						<div
							className="flex items-center justify-center rounded-full"
							style={{
								width: 48,
								height: 48,
								background: "rgba(81,32,200,0.12)",
							}}>
							<User size={22} style={{ color: purple }} />
						</div>
					)}
					<div>
						<p className="text-xs" style={{ color: textSecondary }}>
							{isAr ? "المدرب" : "Instructor"}
						</p>
						<p className="text-base font-bold" style={{ color: textPrimary }}>
							{instructorName}
						</p>
					</div>
				</div>
			</div>

			<VideoProtection userEmail={userEmail} />
		</div>
	);
}
