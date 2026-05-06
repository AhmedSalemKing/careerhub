"use client";
import { useQuery } from "@tanstack/react-query";
import { get, post } from "../../../../lib/api";
import { getMediaUrl, getCourseTitle } from "../../../../lib/media";
import { useLocale, useTranslations } from "next-intl";
import {
	Play, Clock, Users, BookOpen, ChevronDown, Lock, CheckCircle2,
	ArrowRight, ArrowLeft, GraduationCap, BarChart3, Star, Loader2,
	Sparkles, PlayCircle, Video, FileText, Award, Target, TrendingUp,
	CircleCheck, Shield, CreditCard, ShoppingCart, Tag, User, Gift,
	ChevronLeft, BadgeCheck, AlertCircle, Smartphone, Image, File,
	Download, Radio, MapPin, Calendar, MapPinned,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "react-hot-toast";

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

	const thumb = getMediaUrl(course?.thumbnail);
	const previewVideo = getMediaUrl(course?.previewVideo);
	const instructorName = course?.instructor?.profile
		? `${course.instructor.profile.firstName} ${course.instructor.profile.lastName}`
		: t("instructor");
	const sections = course?.sections ?? course?.modules ?? [];
	const totalLessons = sections.reduce(
		(acc: number, s: any) => acc + (s.lessons?.length || 0),
		0,
	);
	const MAIN_URL = process.env.NEXT_PUBLIC_MAIN_URL || "";

	const [courseProgress, setCourseProgress] = useState<number>(0);
	const [isGeneratingCert, setIsGeneratingCert] = useState(false);
	const [certAlreadyIssued, setCertAlreadyIssued] = useState(false);

	const apiBase =
		(process.env.NEXT_PUBLIC_API_URL || "https://deve-way.onrender.com/api").replace(/\/api\/api/, "/api");

	const getAuthToken = (): string => {
		if (typeof window === "undefined") return "";
		return (
			localStorage.getItem("deveway_token") ||
			localStorage.getItem("careerhub_token") ||
			localStorage.getItem("token") ||
			sessionStorage.getItem("deveway_token") ||
			sessionStorage.getItem("token") ||
			""
		);
	};

	// Determine course type
	const isLive = course?.type === 'live';
	const isOffline = course?.type === 'offline';

	// Get type information
	let typeBadgeText: string;
	let typeBadgeColor: string;
	let typeBadgeBg: string;
	let typeBadgeBorder: string;

	if (isLive) {
		typeBadgeText = isAr ? "بث مباشر" : "Live";
		typeBadgeColor = "#dc2626";
		typeBadgeBg = "rgba(220,38,38,0.1)";
		typeBadgeBorder = "rgba(220,38,38,0.3)";
	} else if (isOffline) {
		typeBadgeText = isAr ? "مقر فعلي" : "Physical";
		typeBadgeColor = "#16a34a";
		typeBadgeBg = "rgba(22,163,74,0.1)";
		typeBadgeBorder = "rgba(22,163,74,0.3)";
	} else {
		typeBadgeText = isAr ? "مسجل" : "Recorded";
		typeBadgeColor = "#6c3ce0";
		typeBadgeBg = "rgba(108,60,224,0.1)";
		typeBadgeBorder = "rgba(108,60,224,0.3)";
	}

	const [isLessonComplete, setIsLessonComplete] = useState(false);

	const bg = theme === 'dark' ? "rgb(0 0 0)" : "#ffffff";
	const cardBg = theme === 'dark' ? "rgb(25 27 32)" : "#f8f8fa";
	const textPrimary = theme === 'dark' ? "#ffffff" : "#0d0d0d";
	const textSecondary = theme === 'dark' ? "#94a3b8" : "#64748b";
	const borderColor = theme === 'dark' ? "#1e293b" : "#e5e7eb";
	const surfaceBg = theme === 'dark' ? "rgb(25 27 32)" : "#ffffff";
	const heroBg = theme === 'dark' ? "#0d0d0d" : "#f1f0fb";
	const purple = "#6c3ce0";
	const teal = "#0d9488";
	const greenBg = theme === 'dark' ? "rgba(22,163,74,0.12)" : "rgba(22,163,74,0.06)";
	const redColor = "#ef4444";
	const blueColor = "#ffffff";
	const purpleColor = "#a855f7";

	if (isLoading) return <CourseSkeleton isDark={theme === 'dark'} />;

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

	return (
		<div className="min-h-screen" style={{ background: bg }}>
			{/* -- Hero Section -- */}
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
										style={{ background: "rgba(108,60,224,0.1)", color: purple }}>
										<Tag className="inline h-3 w-3 ml-1" />
										{course.category.nameAr || course.category.nameEn}
									</span>
								)}
								<span
									className="text-xs font-semibold inline-block w-fit rounded-full px-3 py-1"
									style={{ background: typeBadgeBg, color: typeBadgeColor, border: `1px solid ${typeBadgeBorder}` }}>
									{isLive && <Radio className="inline h-3 w-3 ml-1" />}
									{isOffline && <MapPin className="inline h-3 w-3 ml-1" />}
									{!isLive && !isOffline && <Video className="inline h-3 w-3 ml-1" />}
									{typeBadgeText}
								</span>
							</div>
							<h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: textPrimary }}>
								{getCourseTitle(course, locale)}
							</h1>
							<div className="flex flex-wrap items-center gap-4 mb-4 text-sm" style={{ color: textSecondary }}>
								<div className="flex items-center gap-1">
									<Users className="h-4 w-4" />
									<span>{course._count?.enrollments ?? 0} {t("students")}</span>
								</div>
								{course.level && (
									<div className="flex items-center gap-1">
										<BarChart3 className="h-4 w-4" />
										<span>{course.level}</span>
									</div>
								)}
								{course.duration && (
									<div className="flex items-center gap-1">
										<Clock className="h-4 w-4" />
										<span>{course.duration} {t("hours")}</span>
									</div>
								)}
							</div>
							{isEnrolled ? (
								<div className="flex items-center gap-2 mb-4">
									<div className="flex-1 bg-gray-200 rounded-full h-2">
										<div
											className="bg-purple-600 h-2 rounded-full"
											style={{ width: `${courseProgress}%` }}
										/>
									</div>
									<span className="text-sm font-medium" style={{ color: textSecondary }}>
										{courseProgress}%
									</span>
								</div>
							) : (
								<button
									onClick={async () => {
										setEnrolling(true);
										try {
											const res: any = await post(`/courses/${courseId}/enroll`, {}, getAuthToken());
											if (res?.data?.success || res?.status === 200 || res?.status === 201) {
												setIsEnrolled(true);
												toast.success(isAr ? "تم التسجيل بنجاح" : "Enrolled successfully!");
											}
										} catch (e: any) {
											toast.error(e.message || (isAr ? "فشل التسجيل" : "Enrollment failed"));
										} finally {
											setEnrolling(false);
										}
									}}
									className="px-6 py-3 rounded-lg font-semibold text-white"
									style={{ background: "#5120c8" }}
									disabled={enrolling}>
									{enrolling ? (
										<Loader2 className="inline h-4 w-4 mr-2 animate-spin" />
									) : (
										<ShoppingCart className="inline h-4 w-4 mr-2" />
									)}
									{isAr ? "التسجيل في الكورس" : "Enroll in Course"}
								</button>
							)}
						</div>
						<div className="lg:col-span-2">
							<div className="rounded-xl overflow-hidden shadow-lg" style={{ border: `1px solid ${borderColor}` }}>
								{thumb ? (
									<img src={thumb} alt="" className="w-full h-48 object-cover" />
								) : (
									<div className="w-full h-48 flex items-center justify-center" style={{ background: cardBg }}>
										<Image className="h-16 w-16" style={{ color: textSecondary }} />
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* -- Course Content -- */}
			<div className="max-w-6xl mx-auto px-6 py-8">
				<div className="grid gap-6 lg:grid-cols-3">
					<div className="lg:col-span-2">
						{/* Description */}
						<div
							className="rounded-xl p-6 mb-6"
							style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
							<h2 className="text-lg font-bold mb-3" style={{ color: textPrimary }}>{isAr ? "وصف الكورس" : "Course Description"}</h2>
							<p className="text-sm leading-relaxed" style={{ color: textSecondary }}>
								{locale === 'ar' ? course.descriptionAr : course.descriptionEn}
							</p>
						</div>

						{/* Sections/Lessons */}
						{sections.map((section: any) => (
							<div
								key={section.id}
								className="rounded-xl mb-4 overflow-hidden"
								style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
								<button
									onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
									className="w-full px-6 py-4 flex items-center justify-between text-left"
									style={{ color: textPrimary }}>
									<div className="flex items-center gap-3">
										{section.icon && <section.icon className="h-5 w-5" style={{ color: purple }} />}
										<span className="font-semibold">{isAr ? section.titleAr : section.titleEn}</span>
										<span className="text-sm" style={{ color: textSecondary }}>
											{(section.lessons?.length || 0)} {t("lessons")}
										</span>
									</div>
									<ChevronDown
										className={`h-4 w-4 transition-transform ${openSection === section.id ? 'rotate-180' : ''}`}
										style={{ color: textSecondary }}
									/>
								</button>
								{openSection === section.id && (
									<div className="border-t" style={{ borderColor }}>
										{section.lessons?.map((lesson: any) => {
											const contentType = getLessonContentType(lesson);
											const LessonIcon = getLessonIcon(lesson);
											return (
												<a
													key={lesson.id}
													href={`/${locale}/courses/${courseId}/learn?lesson=${lesson.id}`}
													className="block px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
													onClick={(e) => {
														if (!isEnrolled) {
															e.preventDefault();
															toast.error(isAr ? "يجب التسجيل أولاً" : "Please enroll first");
														}
													}}>
													<div className="flex items-center gap-3">
														<div
															className="h-8 w-8 rounded-lg flex items-center justify-center"
															style={{ background: "rgba(108,60,224,0.1)" }}>
															<LessonIcon className="h-4 w-4" style={{ color: purple }} />
														</div>
														<div className="flex-1">
															<p className="text-sm font-medium" style={{ color: textPrimary }}>
																{isAr ? lesson.titleAr : lesson.titleEn}
															</p>
															<p className="text-xs" style={{ color: textSecondary }}>
																{contentType} • {lesson.duration || 0} {t("min")}
															</p>
														</div>
														{lesson.isFree && (
															<span
																className="text-xs px-2 py-1 rounded"
																style={{ background: greenBg, color: "#16a34a" }}>
																{isAr ? "مجاني" : "Free"}
															</span>
														)}
													</div>
												</a>
											);
										})}
									</div>
								)}
							</div>
						))}
					</div>

					{/* Sidebar */}
					<div>
						{/* Instructor */}
						{course.instructor && (
							<div
								className="rounded-xl p-6 mb-6"
								style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
								<h3 className="text-base font-bold mb-4" style={{ color: textPrimary }}>{isAr ? "المدرب" : "Instructor"}</h3>
								<div className="flex items-center gap-3 mb-4">
									<img
										src={course.instructor.profile?.avatar || "/default-avatar.png"}
										alt=""
										className="h-12 w-12 rounded-full object-cover"
									/>
									<div>
										<p className="text-sm font-semibold" style={{ color: textPrimary }}>
											{instructorName}
										</p>
										<p className="text-xs" style={{ color: textSecondary }}>
											{isAr ? "مدرب معتمد" : "Verified Instructor"}
										</p>
									</div>
								</div>
							</div>
						)}

						{/* Course Info */}
						<div
							className="rounded-xl p-6"
							style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
							<h3 className="text-base font-bold mb-4" style={{ color: textPrimary }}>{isAr ? "معلومات الكورس" : "Course Info"}</h3>
							<div className="space-y-3">
								{[
									{ icon: BookOpen, label: isAr ? "مستوى الكورس" : "Level", value: course.level },
									{ icon: Clock, label: isAr ? "المدة" : "Duration", value: `${course.duration || 0} ${t("hours")}` },
									{ icon: BarChart3, label: isAr ? "عدد الطلاب" : "Students", value: course._count?.enrollments || 0 },
									{ icon: Award, label: isAr ? "السعر" : "Price", value: course.price > 0 ? `${course.price} ${course.currency || 'SAR'}` : (isAr ? "مجاني" : "Free") },
								].map((item, idx) => {
									const Icon = item.icon;
									return (
									<div key={idx} className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Icon className="h-4 w-4" style={{ color: purple }} />
											<span className="text-sm" style={{ color: textSecondary }}>{item.label}</span>
										</div>
										<span className="text-sm font-semibold" style={{ color: textPrimary }}>{item.value}</span>
									</div>
									);
								})}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function CourseSkeleton({ isDark }: { isDark: boolean }) {
	return (
		<div className="min-h-screen flex items-center justify-center">
			<div className="animate-pulse">
				<div className="h-8 w-48 bg-gray-300 rounded mb-4"></div>
				<div className="h-4 w-96 bg-gray-200 rounded"></div>
			</div>
		</div>
	);
}

function getLessonContentType(lesson: any): string {
	if (lesson.videoUrl) return "Video";
	if (lesson.fileUrl) return "File";
	if (lesson.imageUrl) return "Image";
	return "File";
}

function getLessonIcon(lesson: any): any {
	if (lesson.videoUrl) return PlayCircle;
	if (lesson.fileUrl) return FileText;
	if (lesson.imageUrl) return Image;
	return File;
}
