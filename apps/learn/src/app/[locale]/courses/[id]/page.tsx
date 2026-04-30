"use client";
import { useQuery } from "@tanstack/react-query";
import { get, post } from "../../../../lib/api";
import { getMediaUrl, getCourseTitle } from "../../../../lib/media";
import { useLocale, useTranslations } from "next-intl";
import {
	Play,
	Clock,
	Users,
	BookOpen,
	ChevronDown,
	Lock,
	CheckCircle2,
	ArrowRight,
	ArrowLeft,
	GraduationCap,
	BarChart3,
	Star,
	Loader2,
	Sparkles,
	PlayCircle,
	Video,
	FileText,
	Award,
	Target,
	TrendingUp,
	CircleCheck,
	Shield,
	CreditCard,
	ShoppingCart,
	Tag,
	User,
	Gift,
	ChevronLeft,
	BadgeCheck,
	AlertCircle,
	Smartphone,
	Image,
	File,
	Download,
	Radio,
	MapPin,
	Calendar,
	MapPinned,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CourseDetailPage({
	params,
}: {
	params: { id: string; locale: string };
}) {
	const courseId = params.id;
	const locale = useLocale();
	const isAr = locale === "ar";
	const t = useTranslations("course");
	const router = useRouter();
	const [openSection, setOpenSection] = useState<string | null>(null);
	const [isEnrolled, setIsEnrolled] = useState(false);
	const [enrolling, setEnrolling] = useState(false);

	const [theme, setTheme] = useState<"light" | "dark">("light");

	useEffect(() => {
		const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
		const systemPrefersDark = window.matchMedia(
			"(prefers-color-scheme: dark)",
		).matches;
		if (savedTheme) setTheme(savedTheme);
		else if (systemPrefersDark) setTheme("dark");

		const handleStorageChange = () => {
			const t = localStorage.getItem("theme") as "light" | "dark" | null;
			if (t) setTheme(t);
		};
		window.addEventListener("storage", handleStorageChange);
		const interval = setInterval(() => {
			const t = localStorage.getItem("theme") as "light" | "dark" | null;
			if (t && t !== theme) setTheme(t);
		}, 500);
		return () => {
			window.removeEventListener("storage", handleStorageChange);
			clearInterval(interval);
		};
	}, [theme]);

	const [hasUser, setHasUser] = useState(false);
	useEffect(() => {
		const token =
			localStorage.getItem("deveway_token") ||
			localStorage.getItem("careerhub_token") ||
			document.cookie.match(/deveway_token=([^;]+)/)?.[1];
		setHasUser(!!token);
	}, []);

	const { data: course, isLoading } = useQuery({
		queryKey: ["course", courseId],
		queryFn: async () => {
			const res = await get(`/courses/${courseId}`);
			return (
				(res?.data as any)?.data?.course ??
				(res?.data as any)?.data ??
				(res?.data as any)
			);
		},
		enabled: !!courseId,
	});

	const {
		data: enrollmentData,
		isLoading: enrollmentLoading,
		refetch: refetchEnrollment,
	} = useQuery({
		queryKey: ["enrollment", courseId],
		queryFn: async () => {
			try {
				const res = await get(`/courses/${courseId}/enrollment`);
				const d = (res?.data as any)?.data ?? res?.data;
				return d;
			} catch (err) {
				return null;
			}
		},
		enabled: !!hasUser && !!courseId,
	});

	useEffect(() => {
		if (enrollmentData !== undefined && enrollmentData !== null) {
			const enrolled = !!(
				enrollmentData?.enrolled === true ||
				enrollmentData?.enrollment?.id ||
				enrollmentData?.id ||
				enrollmentData?.courseId ||
				(Array.isArray(enrollmentData) && enrollmentData.length > 0) ||
				enrollmentData?.status === "ACTIVE" ||
				enrollmentData?.status === "active"
			);
			setIsEnrolled(enrolled);
		}
	}, [enrollmentData]);

	const courseType = course?.type || "recorded";
	const isLive = courseType === "live";
	const isOffline = courseType === "offline";
	const isRecorded = courseType === "recorded" || (!isLive && !isOffline);

	const price = parseFloat(course?.price || 0);
	const isFree = price === 0;

	const handleEnroll = async () => {
		if (!hasUser) {
			const MAIN = process.env.NEXT_PUBLIC_MAIN_URL || "";
			router.push(
				`/${locale}/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`,
			);
			return;
		}

		if (isFree) {
			setEnrolling(true);
			try {
				await post(`/courses/${courseId}/enroll`, {});
				setIsEnrolled(true);
				refetchEnrollment();
				if (isLive) {
					router.push(`/${locale}/live/${courseId}`);
				} else {
					router.refresh();
				}
			} catch (e) {
				console.error("Enrollment error:", e);
			} finally {
				setEnrolling(false);
			}
		} else {
			const params = new URLSearchParams({
				courseId: course.id,
				amount: String(price),
				title: course.titleAr || course.titleEn || "",
				type: courseType,
				returnUrl: `/${locale}/courses/${courseId}`,
			});
			router.push(`/${locale}/payment/enroll?${params}`);
		}
	};

	const navigateToLearn = (lessonId?: string) => {
		if (isEnrolled) {
			const learnPath = `/${locale}/learn/${courseId}${lessonId ? `?lesson=${lessonId}` : ""}`;
			router.push(learnPath);
		} else {
			handleEnroll();
		}
	};

	const getLessonContentType = (lesson: any) => {
		if (lesson.videoUrl) return "video";
		if (lesson.fileUrl) return "file";
		if (lesson.imageUrl) return "image";
		return "none";
	};

	const getLessonIcon = (lesson: any) => {
		if (lesson.videoUrl) return Video;
		if (lesson.fileUrl) return FileText;
		if (lesson.imageUrl) return Image;
		return File;
	};

	const isDark = theme === "dark";

	const bg = isDark ? "rgb(0 0 0)" : "#ffffff";
	const cardBg = isDark ? "rgb(25 27 32)" : "#f8f8fa";
	const textPrimary = isDark ? "#ffffff" : "#0d0d0d";
	const textSecondary = isDark ? "#94a3b8" : "#64748b";
	const borderColor = isDark ? "#1e293b" : "#e5e7eb";
	const surfaceBg = isDark ? "rgb(25 27 32)" : "#ffffff";
	const heroBg = isDark ? "#0d0d0d" : "#f1f0fb";
	const purple = "#6c3ce0";
	const teal = "#0d9488";
	const greenBg = isDark ? "rgba(22,163,74,0.12)" : "rgba(22,163,74,0.06)";
	const redColor = "#ef4444";
	const blueColor = "#ffffff";
	const purpleColor = "#a855f7";

	if (isLoading) return <CourseSkeleton isDark={isDark} />;
	if (!course)
		return (
			<div
				className="min-h-screen flex items-center justify-center"
				style={{ background: bg, color: textSecondary }}>
				<div className="text-center">
					<AlertCircle
						className="mx-auto h-16 w-16 mb-4"
						style={{ color: textSecondary }}
					/>
					{t("not_found")}
				</div>
			</div>
		);

	const thumb = getMediaUrl(course.thumbnail);
	const previewVideo = getMediaUrl(course.previewVideo);
	const instructorName = course.instructor?.profile
		? `${course.instructor.profile.firstName} ${course.instructor.profile.lastName}`
		: t("instructor");
	const sections = course.sections ?? course.modules ?? [];
	const totalLessons = sections.reduce(
		(acc: number, s: any) => acc + (s.lessons?.length || 0),
		0,
	);
	const MAIN_URL = process.env.NEXT_PUBLIC_MAIN_URL || "";

	const typeBadge = isLive
		? {
				text: isAr ? "بث مباشر" : "Live",
				color: "#dc2626",
				bg: "rgba(220,38,38,0.1)",
				border: "rgba(220,38,38,0.3)",
				icon: Radio,
			}
		: isOffline
			? {
					text: isAr ? "مقر فعلي" : "Physical",
					color: "#16a34a",
					bg: "rgba(22,163,74,0.1)",
					border: "rgba(22,163,74,0.3)",
					icon: MapPin,
				}
			: {
					text: isAr ? "مسجل" : "Recorded",
					color: purple,
					bg: `${purple}18`,
					border: `${purple}30`,
					icon: Video,
				};

	const TypeIcon = typeBadge.icon;

	return (
		<div className="min-h-screen" style={{ background: bg }}>
			{/* ── Hero Section ── */}
			<div
				style={{
					background: heroBg,
					borderBottom: `1px solid ${borderColor}`,
				}}>
				<div className="max-w-6xl mx-auto px-6 py-10">
					<div className="grid gap-8 lg:grid-cols-5">
						<div className="lg:col-span-3 flex flex-col justify-center">
							<div className="flex flex-wrap items-center gap-2 mb-3">
								{course.category && (
									<span
										className="text-xs font-semibold inline-block w-fit rounded-full px-3 py-1"
										style={{ background: `${purple}18`, color: purple }}>
										<Tag className="inline h-3 w-3 ml-1" />
										{course.category.nameAr || course.category.nameEn}
									</span>
								)}
								<span
									className="text-xs font-semibold inline-block w-fit rounded-full px-3 py-1"
									style={{
										background: typeBadge.bg,
										color: typeBadge.color,
										border: `1px solid ${typeBadge.border}`,
									}}>
									<TypeIcon className="inline h-3 w-3 ml-1" />
									{typeBadge.text}
								</span>
							</div>

							<h1
								className="text-3xl lg:text-4xl font-bold font-madinet mb-4 leading-tight"
								style={{ color: textPrimary }}>
								{getCourseTitle(course, locale)}
							</h1>

							<p
								className="text-base leading-relaxed mb-6"
								style={{ color: textSecondary }}>
								{course.descriptionAr ||
									course.descriptionEn ||
									course.description}
							</p>

							<div
								className="flex flex-wrap gap-5 text-sm mb-6"
								style={{ color: textSecondary }}>
								<span className="flex items-center gap-1.5">
									<Users className="h-4 w-4" style={{ color: purple }} />
									{course._count?.enrollments || 0} {t("student")}
								</span>
								{isRecorded && (
									<>
										<span className="flex items-center gap-1.5">
											<BookOpen className="h-4 w-4" style={{ color: purple }} />
											{totalLessons} {t("lesson")}
										</span>
										<span className="flex items-center gap-1.5">
											<BookOpen className="h-4 w-4" style={{ color: purple }} />
											{sections.length} {t("section")}
										</span>
									</>
								)}
								<span className="flex items-center gap-1.5">
									<TrendingUp className="h-4 w-4" style={{ color: purple }} />
									{course.level === "BEGINNER"
										? t("beginner")
										: course.level === "INTERMEDIATE"
											? t("intermediate")
											: t("advanced")}
								</span>
								{course.duration && (
									<span className="flex items-center gap-1.5">
										<Clock className="h-4 w-4" style={{ color: purple }} />
										{course.duration} {isAr ? "ساعة" : "hours"}
									</span>
								)}
							</div>

							<div className="flex items-center gap-3">
								<div
									className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm"
									style={{ background: `${purple}20`, color: purple }}>
									<User className="h-5 w-5" />
								</div>
								<div>
									<p
										className="font-semibold text-sm"
										style={{ color: textPrimary }}>
										{instructorName}
									</p>
									<p className="text-xs" style={{ color: textSecondary }}>
										{t("instructor")}
									</p>
								</div>
							</div>
						</div>

						<div className="lg:col-span-2">
							<div
								className="rounded-2xl overflow-hidden aspect-video relative group cursor-pointer"
								style={{
									background: isDark ? "#000" : "#e2e8f0",
									boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
								}}
								onClick={() => navigateToLearn()}>
								{previewVideo ? (
									<video
										src={previewVideo}
										controls
										className="w-full h-full object-cover"
										poster={thumb || undefined}
									/>
								) : thumb ? (
									<>
										<img
											src={thumb}
											className="w-full h-full object-cover"
											alt={getCourseTitle(course, locale)}
										/>
										<div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
											<div
												className="h-16 w-16 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
												style={{
													background: `${purple}cc`,
													boxShadow: `0 8px 32px ${purple}50`,
												}}>
												<Play className="h-8 w-8 text-white mr-[-4px]" />
											</div>
										</div>
									</>
								) : (
									<div
										className="flex h-full items-center justify-center"
										style={{ background: isDark ? "#111" : "#e2e8f0" }}>
										<Play
											className="h-16 w-16"
											style={{ color: `${purple}40` }}
										/>
									</div>
								)}

								<div
									className="absolute bottom-4 left-4 px-4 py-2 rounded-lg text-white text-sm font-bold flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
									style={{ background: purple }}>
									<PlayCircle className="h-4 w-4" />
									{isEnrolled
										? isAr
											? "ابدأ التعلم الآن"
											: "Start Learning Now"
										: isLive
											? isAr
												? "انضم للبث المباشر"
												: "Join Live Stream"
											: isOffline
												? isAr
													? "احجز مقعدك"
													: "Reserve Your Spot"
												: isAr
													? "ابدأ التعلم"
													: "Start Learning"}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* ── Content + Sidebar ── */}
			<div className="max-w-6xl mx-auto px-6 py-10">
				<div className="grid gap-8 lg:grid-cols-3">
					<div className="lg:col-span-2 space-y-10">
						{/* Live Info Section */}
						{isLive && (
							<section>
								<h2
									className="text-xl font-bold font-madinet mb-5 flex items-center gap-2"
									style={{ color: textPrimary }}>
									<Radio className="h-5 w-5" style={{ color: "#dc2626" }} />
									{isAr ? "معلومات البث المباشر" : "Live Session Info"}
								</h2>
								<div
									className="rounded-xl p-6 space-y-4"
									style={{
										border: `1px solid rgba(220,38,38,0.2)`,
										background: "rgba(220,38,38,0.05)",
									}}>
									{course.liveStartTime && (
										<div className="flex items-center gap-3">
											<Calendar
												className="h-5 w-5"
												style={{ color: "#dc2626" }}
											/>
											<div>
												<p
													className="text-sm font-medium"
													style={{ color: textPrimary }}>
													{isAr ? "وقت البدء" : "Start Time"}
												</p>
												<p
													className="text-base"
													style={{ color: textSecondary }}>
													{new Date(course.liveStartTime).toLocaleString(
														isAr ? "ar-SA" : "en-US",
														{
															weekday: "long",
															year: "numeric",
															month: "long",
															day: "numeric",
															hour: "2-digit",
															minute: "2-digit",
														},
													)}
												</p>
											</div>
										</div>
									)}
									{course.liveEndTime && (
										<div className="flex items-center gap-3">
											<Clock className="h-5 w-5" style={{ color: "#dc2626" }} />
											<div>
												<p
													className="text-sm font-medium"
													style={{ color: textPrimary }}>
													{isAr ? "وقت الانتهاء" : "End Time"}
												</p>
												<p
													className="text-base"
													style={{ color: textSecondary }}>
													{new Date(course.liveEndTime).toLocaleString(
														isAr ? "ar-SA" : "en-US",
														{
															weekday: "long",
															year: "numeric",
															month: "long",
															day: "numeric",
															hour: "2-digit",
															minute: "2-digit",
														},
													)}
												</p>
											</div>
										</div>
									)}
									{course.liveStatus && (
										<div className="flex items-center gap-2">
											<span
												className="w-2 h-2 rounded-full"
												style={{
													background:
														course.liveStatus === "LIVE"
															? "#dc2626"
															: "#94a3b8",
												}}
											/>
											<span
												className="text-sm font-medium"
												style={{
													color:
														course.liveStatus === "LIVE"
															? "#dc2626"
															: textSecondary,
												}}>
												{course.liveStatus === "LIVE"
													? isAr
														? "مباشر الآن!"
														: "Live Now!"
													: course.liveStatus === "SCHEDULED"
														? isAr
															? "مجدول"
															: "Scheduled"
														: isAr
															? "انتهى"
															: "Ended"}
											</span>
										</div>
									)}
								</div>
							</section>
						)}

						{/* Offline Info Section */}
						{isOffline && (
							<section>
								<h2
									className="text-xl font-bold font-madinet mb-5 flex items-center gap-2"
									style={{ color: textPrimary }}>
									<MapPin className="h-5 w-5" style={{ color: "#16a34a" }} />
									{isAr ? "معلومات المكان" : "Location Info"}
								</h2>
								<div
									className="rounded-xl p-6 space-y-4"
									style={{
										border: `1px solid rgba(22,163,74,0.2)`,
										background: "rgba(22,163,74,0.05)",
									}}>
									{course.locationName && (
										<div className="flex items-center gap-3">
											<MapPinned
												className="h-5 w-5"
												style={{ color: "#16a34a" }}
											/>
											<div>
												<p
													className="text-sm font-medium"
													style={{ color: textPrimary }}>
													{isAr ? "اسم المكان" : "Venue Name"}
												</p>
												<p
													className="text-base"
													style={{ color: textSecondary }}>
													{course.locationName}
												</p>
											</div>
										</div>
									)}
									{course.locationAddress && (
										<div className="flex items-center gap-3">
											<MapPin
												className="h-5 w-5"
												style={{ color: "#16a34a" }}
											/>
											<div>
												<p
													className="text-sm font-medium"
													style={{ color: textPrimary }}>
													{isAr ? "العنوان" : "Address"}
												</p>
												<p
													className="text-base"
													style={{ color: textSecondary }}>
													{course.locationAddress}
												</p>
											</div>
										</div>
									)}
									{course.liveStartTime && (
										<div className="flex items-center gap-3">
											<Calendar
												className="h-5 w-5"
												style={{ color: "#16a34a" }}
											/>
											<div>
												<p
													className="text-sm font-medium"
													style={{ color: textPrimary }}>
													{isAr ? "التاريخ والوقت" : "Date & Time"}
												</p>
												<p
													className="text-base"
													style={{ color: textSecondary }}>
													{new Date(course.liveStartTime).toLocaleString(
														isAr ? "ar-SA" : "en-US",
														{
															weekday: "long",
															year: "numeric",
															month: "long",
															day: "numeric",
															hour: "2-digit",
															minute: "2-digit",
														},
													)}
												</p>
											</div>
										</div>
									)}
									{course.locationLat && course.locationLng && (
										<a
											href={`https://www.google.com/maps?q=${course.locationLat},${course.locationLng}`}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
											style={{ background: "#16a34a", color: "#fff" }}>
											<MapPin className="h-4 w-4" />
											{isAr ? "عرض على الخريطة" : "View on Map"}
										</a>
									)}
								</div>
							</section>
						)}

						{/* Curriculum - only for recorded */}
						{isRecorded && sections.length > 0 && (
							<section>
								<h2
									className="text-xl font-bold font-madinet mb-5 flex items-center gap-2"
									style={{ color: textPrimary }}>
									<BookOpen className="h-5 w-5" style={{ color: purple }} />
									{t("content")}
								</h2>
								<div className="space-y-3">
									{sections.map((section: any, sIdx: number) => (
										<div
											key={section.id}
											className="rounded-xl overflow-hidden transition-all hover:shadow-md"
											style={{
												border: `1px solid ${borderColor}`,
												background: surfaceBg,
											}}>
											<button
												onClick={() =>
													setOpenSection(
														openSection === section.id ? null : section.id,
													)
												}
												className="w-full flex items-center justify-between p-4 text-right transition-colors hover:opacity-90"
												style={{ color: textPrimary }}>
												<span className="font-semibold flex items-center gap-2">
													<span
														className="text-xs font-bold rounded-md px-2 py-0.5 flex items-center justify-center h-6 w-6"
														style={{
															background: `${purple}15`,
															color: purple,
														}}>
														{sIdx + 1}
													</span>
													{section.title || section.titleAr || section.titleEn}
												</span>
												<div className="flex items-center gap-3">
													<span
														className="text-xs flex items-center gap-1"
														style={{ color: textSecondary }}>
														<BookOpen className="h-3 w-3" />
														{section.lessons?.length || 0} {t("lesson")}
													</span>
													<ChevronDown
														className="h-4 w-4 transition-transform duration-200"
														style={{
															color: textSecondary,
															transform:
																openSection === section.id
																	? "rotate(180deg)"
																	: "none",
														}}
													/>
												</div>
											</button>

											{openSection === section.id && (
												<div style={{ borderTop: `1px solid ${borderColor}` }}>
													{section.lessons?.map((lesson: any, lIdx: number) => {
														const canAccess =
															isEnrolled || lesson.isFree || isFree;
														const contentType = getLessonContentType(lesson);
														const LessonIcon = getLessonIcon(lesson);

														return (
															<div
																key={lesson.id}
																onClick={() => {
																	if (canAccess) {
																		navigateToLearn(lesson.id);
																	} else {
																		handleEnroll();
																	}
																}}
																className={`flex items-center justify-between p-3.5 px-4 transition-all ${
																	canAccess
																		? "hover:bg-purple-5 dark:hover:bg-purple-900/10 cursor-pointer"
																		: "cursor-not-allowed opacity-60"
																}`}
																style={{
																	borderBottom:
																		lIdx < (section.lessons?.length || 0) - 1
																			? `1px solid ${borderColor}`
																			: "none",
																	borderRight: canAccess
																		? `3px solid transparent`
																		: "none",
																}}
																onMouseEnter={(e) => {
																	if (canAccess) {
																		const colors: Record<string, string> = {
																			video: redColor,
																			file: blueColor,
																			image: purpleColor,
																			none: purple,
																		};
																		e.currentTarget.style.borderRightColor =
																			colors[contentType] || purple;
																		e.currentTarget.style.background = isDark
																			? "rgba(108, 60, 224, 0.08)"
																			: "rgba(108, 60, 224, 0.04)";
																	}
																}}
																onMouseLeave={(e) => {
																	e.currentTarget.style.borderRightColor =
																		"transparent";
																	e.currentTarget.style.background =
																		"transparent";
																}}>
																<div className="flex items-center gap-3">
																	<div
																		className="h-7 w-7 rounded-full flex items-center justify-center text-xs shrink-0 transition-colors"
																		style={{
																			background: canAccess
																				? contentType === "video"
																					? `${redColor}15`
																					: contentType === "file"
																						? `${blueColor}15`
																						: contentType === "image"
																							? `${purpleColor}15`
																							: `${purple}15`
																				: isDark
																					? "#1e293b"
																					: "#e5e7eb",
																			color: canAccess
																				? contentType === "video"
																					? redColor
																					: contentType === "file"
																						? blueColor
																						: contentType === "image"
																							? purpleColor
																							: purple
																				: textSecondary,
																		}}>
																		{canAccess ? (
																			<LessonIcon className="h-3.5 w-3.5" />
																		) : (
																			<Lock className="h-3 w-3" />
																		)}
																	</div>

																	<div className="flex-1 min-w-0">
																		<span
																			className="text-sm font-medium block truncate"
																			style={{ color: textPrimary }}>
																			{lesson.title ||
																				lesson.titleAr ||
																				lesson.titleEn}
																		</span>

																		<div className="flex gap-1.5 mt-1">
																			{lesson.videoUrl && (
																				<span
																					className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded"
																					style={{
																						background: `${redColor}12`,
																						color: redColor,
																					}}>
																					<Video className="h-3 w-3" />
																					{isAr ? "فيديو" : "Video"}
																				</span>
																			)}
																			{lesson.fileUrl && (
																				<span
																					className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded"
																					style={{
																						background: `${blueColor}12`,
																						color: blueColor,
																					}}>
																					<FileText className="h-3 w-3" />
																					{lesson.fileName ||
																						(isAr ? "ملف" : "File")}
																				</span>
																			)}
																			{lesson.imageUrl && (
																				<span
																					className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded"
																					style={{
																						background: `${purpleColor}12`,
																						color: purpleColor,
																					}}>
																					<Image className="h-3 w-3" />
																					{isAr ? "صورة" : "Image"}
																				</span>
																			)}
																		</div>

																		{lesson.duration && (
																			<span
																				className="text-xs mt-0.5 block"
																				style={{ color: textSecondary }}>
																				<Clock className="inline h-3 w-3 ml-0.5" />
																				{lesson.duration}{" "}
																				{isAr ? "دقيقة" : "min"}
																			</span>
																		)}
																	</div>
																</div>

																<div className="flex items-center gap-2 shrink-0">
																	{lesson.isFree && (
																		<span
																			className="text-xs rounded-full px-2.5 py-0.5 font-medium flex items-center gap-1"
																			style={{
																				background: `${teal}18`,
																				color: teal,
																			}}>
																			<Gift className="h-3 w-3" />
																			{isAr ? "مجاني" : "Free"}
																		</span>
																	)}
																	{canAccess && (
																		<ChevronLeft
																			className="h-4 w-4"
																			style={{
																				color: textSecondary,
																				opacity: 0.5,
																			}}
																		/>
																	)}
																</div>
															</div>
														);
													})}
												</div>
											)}
										</div>
									))}
								</div>
							</section>
						)}

						{isRecorded && sections.length === 0 && (
							<section>
								<div
									className="rounded-xl p-10 text-center"
									style={{
										border: `1px solid ${borderColor}`,
										background: cardBg,
									}}>
									<BookOpen
										className="mx-auto h-12 w-12 mb-3"
										style={{ color: `${purple}30` }}
									/>
									<p style={{ color: textSecondary }}>{t("no_content")}</p>
								</div>
							</section>
						)}

						{course.instructor && (
							<section>
								<h2
									className="text-xl font-bold font-madinet mb-5 flex items-center gap-2"
									style={{ color: textPrimary }}>
									<GraduationCap
										className="h-5 w-5"
										style={{ color: purple }}
									/>
									{t("instructor")}
								</h2>
								<div
									className="rounded-xl p-6 flex items-start gap-4"
									style={{
										border: `1px solid ${borderColor}`,
										background: surfaceBg,
									}}>
									<div
										className="h-14 w-14 rounded-full flex items-center justify-center font-bold text-lg shrink-0"
										style={{ background: `${purple}15`, color: purple }}>
										<User className="h-7 w-7" />
									</div>
									<div className="flex-1">
										<h3
											className="font-bold text-lg mb-1 flex items-center gap-2"
											style={{ color: textPrimary }}>
											{instructorName}
											<BadgeCheck className="h-5 w-5" style={{ color: teal }} />
										</h3>
										{course.instructor.profile?.bio && (
											<p
												className="text-sm leading-relaxed"
												style={{ color: textSecondary }}>
												{course.instructor.profile.bio}
											</p>
										)}
										{course.instructor.profile?.title && (
											<p
												className="text-xs mt-2 font-medium"
												style={{ color: purple }}>
												{course.instructor.profile.title}
											</p>
										)}
									</div>
								</div>
							</section>
						)}
					</div>

					{/* ── Sidebar ── */}
					<div className="lg:col-span-1">
						<div
							className="rounded-2xl p-6 sticky top-6 space-y-5"
							style={{
								border: `1px solid ${borderColor}`,
								background: surfaceBg,
								boxShadow: isDark
									? "0 4px 30px rgba(0,0,0,0.3)"
									: "0 4px 30px rgba(0,0,0,0.06)",
							}}>
							<div
								className="text-center pb-4"
								style={{ borderBottom: `1px solid ${borderColor}` }}>
								{isFree ? (
									<div>
										<span
											className="text-3xl font-bold"
											style={{ color: teal }}>
											{isAr ? "مجاني" : "Free"}
										</span>
										<p
											className="text-xs mt-1"
											style={{ color: textSecondary }}>
											{isAr ? "وصول مدى الحياة" : "Lifetime access"}
										</p>
									</div>
								) : (
									<div>
										<div className="flex items-baseline justify-center gap-1">
											<span
												className="text-3xl font-bold"
												style={{ color: purple }}>
												{course.price}
											</span>
											<span
												className="text-base"
												style={{ color: textSecondary }}>
												{" "}
												{t("currency")}
											</span>
										</div>
										{course.originalPrice &&
											course.originalPrice > course.price && (
												<p
													className="text-sm line-through mt-1"
													style={{ color: textSecondary }}>
													{course.originalPrice} {t("currency")}
												</p>
											)}
									</div>
								)}
							</div>

							{isEnrolled ? (
								<>
									<button
										onClick={() => navigateToLearn()}
										className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base text-white transition-all hover:scale-[1.02] active:scale-95"
										style={{
											background: isLive
												? "linear-gradient(135deg, #dc2626, #b91c1c)"
												: isOffline
													? "linear-gradient(135deg, #16a34a, #15803d)"
													: "linear-gradient(135deg, #16a34a, #15803d)",
											boxShadow: isLive
												? "0 4px 24px rgba(220,38,38,0.35)"
												: "0 4px 24px rgba(22,163,74,0.35)",
										}}>
										{isLive ? (
											<>
												<Radio size={22} strokeWidth={2.5} />
												{isAr ? "انضم للبث المباشر" : "Join Live Stream"}
											</>
										) : isOffline ? (
											<>
												<MapPin size={22} strokeWidth={2.5} />
												{isAr ? "عرض التفاصيل" : "View Details"}
											</>
										) : (
											<>
												<PlayCircle size={22} strokeWidth={2.5} />
												{isAr ? "ابدأ التعلم الآن" : "Start Learning Now"}
											</>
										)}
									</button>

									<div
										className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium"
										style={{ background: greenBg, color: "#16a34a" }}>
										<CheckCircle2 size={18} strokeWidth={2.5} />
										<span>
											{isAr ? "تم الاشتراك بنجاح" : "Enrolled successfully"}
										</span>
									</div>
								</>
							) : (
								<button
									onClick={handleEnroll}
									disabled={enrolling}
									className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
									style={{
										background: isLive
											? "linear-gradient(135deg, #dc2626, #b91c1c)"
											: isOffline
												? "linear-gradient(135deg, #16a34a, #15803d)"
												: "linear-gradient(135deg, #5120c8, #6c3ce0)",
										boxShadow: isLive
											? "0 4px 24px rgba(220,38,38,0.35)"
											: isOffline
												? "0 4px 24px rgba(22,163,74,0.35)"
												: "0 4px 24px rgba(108, 60, 224, 0.35)",
									}}>
									{enrolling ? (
										<>
											<Loader2 size={20} className="animate-spin" />
											{isAr ? "جاري الاشتراك..." : "Enrolling..."}
										</>
									) : isLive ? (
										<>
											<Radio size={20} />
											{isAr ? "انضم للبث المباشر" : "Join Live Stream"}
										</>
									) : isOffline ? (
										<>
											<MapPin size={20} />
											{isAr ? "احجز مقعدك" : "Reserve Your Spot"}
										</>
									) : isFree ? (
										<>
											<Gift size={20} />
											{isAr ? "اشترك مجاناً" : "Enroll for Free"}
										</>
									) : (
										<>
											<ShoppingCart size={20} />
											{isAr ? "اشترك الآن" : "Enroll Now"} – {course?.price}{" "}
											{isAr ? "ريال" : "SAR"}
										</>
									)}
								</button>
							)}

							<div
								className="flex items-center justify-center gap-2 py-2 text-xs"
								style={{ color: textSecondary }}>
								<Shield className="h-4 w-4" style={{ color: teal }} />
								<span>
									{isAr
										? "ضمان استرداد الأموال خلال 30 يوم"
										: "30-day money-back guarantee"}
								</span>
							</div>

							<div
								className="space-y-3 pt-4"
								style={{ borderTop: `1px solid ${borderColor}` }}>
								{isRecorded && (
									<>
										{[
											{
												icon: BookOpen,
												label: t("total_lessons"),
												value: `${totalLessons} ${t("lesson")}`,
											},
											{
												icon: GraduationCap,
												label: t("sections_label"),
												value: `${sections.length} ${t("section")}`,
											},
										].map(({ icon: Icon, label, value }, i) => (
											<div
												key={i}
												className="flex items-center justify-between text-sm py-1">
												<span
													className="flex items-center gap-2"
													style={{ color: textSecondary }}>
													<Icon className="h-4 w-4" style={{ color: purple }} />
													{label}
												</span>
												<span
													className="font-medium"
													style={{ color: textPrimary }}>
													{value}
												</span>
											</div>
										))}
									</>
								)}
								{[
									{
										icon: TrendingUp,
										label: t("level"),
										value:
											course.level === "BEGINNER"
												? t("beginner")
												: course.level === "INTERMEDIATE"
													? t("intermediate")
													: t("advanced"),
									},
									{
										icon: Users,
										label: t("subscribers"),
										value: `${course._count?.enrollments || 0} ${t("student")}`,
									},
									...(course.duration
										? [
												{
													icon: Clock,
													label: isAr ? "المدة" : "Duration",
													value: `${course.duration} ${isAr ? "ساعة" : "hours"}`,
												},
											]
										: []),
									{
										icon: Award,
										label: isAr ? "الشهادة" : "Certificate",
										value: isAr ? "شهادة إتمام" : "Completion Certificate",
									},
								].map(({ icon: Icon, label, value }, i) => (
									<div
										key={i}
										className="flex items-center justify-between text-sm py-1">
										<span
											className="flex items-center gap-2"
											style={{ color: textSecondary }}>
											<Icon className="h-4 w-4" style={{ color: purple }} />
											{label}
										</span>
										<span
											className="font-medium"
											style={{ color: textPrimary }}>
											{value}
										</span>
									</div>
								))}
							</div>

							<div
								className="space-y-2 pt-2"
								style={{ borderTop: `1px solid ${borderColor}` }}>
								{isRecorded && (
									<>
										{[
											{
												icon: Video,
												text: isAr
													? "فيديوهات عالية الجودة"
													: "High-quality videos",
											},
											{
												icon: FileText,
												text: isAr
													? "موارد قابلة للتحميل"
													: "Downloadable resources",
											},
											{
												icon: Clock,
												text: isAr ? "وصول مدى الحياة" : "Lifetime access",
											},
										].map(({ icon: Icon, text }, i) => (
											<div
												key={i}
												className="flex items-center gap-2 text-xs"
												style={{ color: textSecondary }}>
												<Icon
													className="h-3.5 w-3.5 shrink-0"
													style={{ color: teal }}
												/>
												<span>{text}</span>
											</div>
										))}
									</>
								)}
								{[
									{
										icon: Award,
										text: isAr
											? "شهادة إتمام معتمدة"
											: "Verified completion certificate",
									},
									{
										icon: Smartphone,
										text: isAr
											? "متوافق مع جميع الأجهزة"
											: "Works on all devices",
									},
								].map(({ icon: Icon, text }, i) => (
									<div
										key={i}
										className="flex items-center gap-2 text-xs"
										style={{ color: textSecondary }}>
										<Icon
											className="h-3.5 w-3.5 shrink-0"
											style={{ color: teal }}
										/>
										<span>{text}</span>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function CourseSkeleton({ isDark }: { isDark: boolean }) {
	const skBg = isDark ? "rgb(25 27 32)" : "#f1f5f9";
	return (
		<div
			className="min-h-screen p-6 space-y-6"
			style={{ background: isDark ? "rgb(0 0 0)" : "#fff" }}>
			<div className="max-w-6xl mx-auto">
				<div
					className="h-8 w-48 animate-pulse rounded-lg mb-4"
					style={{ background: skBg }}
				/>
				<div
					className="h-64 animate-pulse rounded-2xl mb-6"
					style={{ background: skBg }}
				/>
				{[...Array(3)].map((_, i) => (
					<div
						key={i}
						className="h-16 animate-pulse rounded-xl mb-3"
						style={{ background: skBg }}
					/>
				))}
			</div>
		</div>
	);
}
