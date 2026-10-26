"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { learnUrlWithToken } from "../../../../lib/learn-link";
import { get, post, del } from "../../../../lib/api";
import { AuthGate } from "../../../components/AuthGate";
import ConfirmModal from "@/components/ConfirmModal";
import { getMediaUrl } from "../../../../lib/media";
import { useAuthStore } from "../../../../stores/authStore";
import { formatCoursePrice, formatMoney } from "../../../../lib/market";

function getTitle(c: any, locale: string) {
	if (locale === "ar") return c.titleAr || c.titleEn || c.title || "بدون عنوان";
	return c.titleEn || c.titleAr || c.title || "Untitled";
}

function getStatusConfig(status: string, course: any) {
	// Check for live course ended
	if (course?.type === "live" && course?.liveStatus === "ended") {
		return { key: "ended", ar: "انتهى البث", color: "#dc2626", bg: "rgba(220,38,38,0.08)", hasDot: false };
	}
	if (course?.type === "live" && course?.liveStatus === "live") {
		return { key: "live", ar: "بث مباشر", color: "#dc2626", bg: "rgba(220,38,38,0.12)", hasDot: true, pulse: true };
	}
	switch (status) {
		case "PUBLISHED":
			return { key: "published", ar: "منشور", color: "var(--success)", bg: "var(--success-subtle)", hasDot: true };
		case "DRAFT":
			return { key: "draft", ar: "مسودة", color: "var(--muted)", bg: "var(--surface-2)", hasDot: true };
		case "PENDING_REVIEW":
			return { key: "pending", ar: "قيد المراجعة", color: "var(--muted)", bg: "var(--surface-2)", hasDot: true };
		default:
			return { key: status, ar: status, color: "var(--muted)", bg: "var(--surface-2)", hasDot: true };
	}
}

export default function MyCoursesPage() {
	const locale = useLocale();
	const router = useRouter();
	const { user, hydrate } = useAuthStore();
	const [courses, setCourses] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState<string>("");

	useEffect(() => { hydrate(); }, [hydrate]);

	const isInstructor = user?.accountType === 'INSTRUCTOR';

	useEffect(() => {
		if (!user) return;
		setIsLoading(true);

		const endpoint = isInstructor
			? '/courses/my-courses'
			: '/courses/enrolled';

		get(endpoint).then(res => {
			const raw = (res?.data as any)?.data ?? (res?.data as any) ?? [];
			let list = Array.isArray(raw) ? raw : (Array.isArray(raw?.courses) ? raw.courses : []);

			if (!isInstructor) {
				list = list.map((e: any) => ({
					...e.course,
					progress: e.progress,
					enrollmentStatus: e.status,
				}));
			}

			setCourses(list);
			setIsLoading(false);
		}).catch(() => {
			setCourses([]);
			setIsLoading(false);
		});
	}, [user, isInstructor]);

	const isAr = locale === "ar";

	const [confirmModal, setConfirmModal] = useState<{
		isOpen: boolean; title: string; message: string;
		onConfirm: () => void; destructive?: boolean;
	}>({ isOpen: false, title: '', message: '', onConfirm: () => {} })

	const totalStudents = courses.reduce((sum: number, c: any) =>
		sum + (c._count?.enrollments || c.enrollmentsCount || c.enrollments || 0), 0);
	const totalRevenue = courses.reduce((sum: number, c: any) =>
		sum + (c.earnings || c.revenue || 0), 0);
	const publishedCount = courses.filter((c: any) => c.status === 'PUBLISHED').length;

	const handleDelete = (courseId: string) => {
		setConfirmModal({
			isOpen: true,
			title: isAr ? 'حذف الكورس' : 'Delete Course',
			message: isAr ? 'هل أنت متأكد من حذف هذا الكورس؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete this course? This action cannot be undone.',
			destructive: true,
			onConfirm: async () => {
				setConfirmModal(prev => ({ ...prev, isOpen: false }))
				try {
					await del(`/courses/${courseId}`)
					setCourses(prev => prev.filter((c: any) => c.id !== courseId))
				} catch (e: any) {
					console.error('Delete course error:', e)
				}
			},
		})
	};

	// Filter courses
	const filteredCourses = courses.filter((course: any) => {
		// Filter by tab
		if (activeTab === "published") {
			if (course.status !== "PUBLISHED") return false;
		} else if (activeTab === "live") {
			if (course.type !== "live" || course.liveStatus === "ended") return false;
		} else if (activeTab === "draft") {
			if (course.status !== "DRAFT") return false;
		} else if (activeTab === "ended") {
			if (!(course.type === "live" && course.liveStatus === "ended")) return false;
		}
		// Filter by search
		if (searchQuery) {
			const title = getTitle(course, locale).toLowerCase();
			if (!title.includes(searchQuery.toLowerCase())) return false;
		}
		return true;
	});

	const tabs = [
		{ key: "all", label: isAr ? "الكل" : "All" },
		{ key: "live", label: isAr ? "بث مباشر" : "Live" },
		{ key: "draft", label: isAr ? "مسودة" : "Draft" },
		{ key: "published", label: isAr ? "منشور" : "Published" },
		{ key: "ended", label: isAr ? "انتهى البث" : "Ended" },
	];

	return (
		<AuthGate>
			<div dir="rtl" style={{
				width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box',
				background: 'var(--background)',
				minHeight: '100vh',
				fontFamily: "'PingAR', sans-serif",
			}}>
				<style>{`
					@font-face { font-family:'PingAR'; src:url('/fonts/alfont_com_PingARLT-Black.otf') format('opentype'); font-weight:700; }
					@font-face { font-family:'PingAR'; src:url('/fonts/alfont_com_PingARLT-Medium.otf') format('opentype'); font-weight:500; }
					@font-face { font-family:'PingAR'; src:url('/fonts/alfont_com_PingARLT-Light.otf') format('opentype'); font-weight:300; }
					@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
					@keyframes livePulse { 0% { transform: scale(1); opacity: 0.7; } 70% { transform: scale(2.2); opacity: 0; } 100% { transform: scale(2.2); opacity: 0; } }
					@media (max-width: 768px) { .stats-grid { grid-template-columns: 1fr !important; } }
					@media (max-width: 640px) { .course-grid { grid-template-columns: 1fr !important; } }
					.course-card:hover { border-color: var(--primary-border) !important; }
				`}</style>
				<div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: '1400px', margin: '0 auto' }}>
					{/* 1. Page header row */}
					<div style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'flex-start',
						marginBottom: 24,
						flexWrap: 'wrap',
						gap: 16,
					}}>
						<div>
							<h1 style={{
								fontWeight: 700,
								fontSize: 'clamp(1.8rem,4vw,2.4rem)',
								color: 'var(--foreground)',
								margin: 0,
								marginBottom: 4,
								fontFamily: "'PingAR', sans-serif",
							}}>
								{isAr ? "كورساتي" : "My Courses"}
							</h1>
							<p style={{
								fontWeight: 300,
								fontSize: '0.88rem',
								color: 'var(--muted)',
								margin: 0,
								fontFamily: "'PingAR', sans-serif",
							}}>
								{isAr ? "إدارة ومتابعة الكورسات التي أنشأتها" : "Manage and track the courses you created"}
							</p>
						</div>
						<div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
							<div style={{
								background: 'var(--surface)',
								border: '1px solid var(--border)',
								borderRadius: 999,
								padding: '6px 16px',
								fontSize: '0.85rem',
								fontWeight: 500,
								color: 'var(--foreground)',
								fontFamily: "'PingAR', sans-serif",
							}}>
								{courses.length} {isAr ? "كورس" : "Course"}
							</div>
							{isInstructor && (
								<Link href={`/${locale}/dashboard/create-course`} style={{
									display: 'inline-flex',
									alignItems: 'center',
									gap: 8,
									background: 'var(--primary)',
									color: '#fff',
									border: 'none',
									borderRadius: 12,
									padding: '10px 22px',
									fontSize: '0.9rem',
									fontWeight: 500,
									textDecoration: 'none',
									cursor: 'pointer',
									fontFamily: "'PingAR', sans-serif",
								}}>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none"
										stroke="#fff" strokeWidth="2" strokeLinecap="round">
										<line x1="12" y1="5" x2="12" y2="19" />
										<line x1="5" y1="12" x2="19" y2="12" />
									</svg>
									{isAr ? "إنشاء كورس" : "Create Course"}
								</Link>
							)}
						</div>
					</div>

					{/* 2. Stats row — 3 cards */}
					{isInstructor && !isLoading && courses.length > 0 && (
						<div style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(3, 1fr)',
							gap: 12,
							marginBottom: 20,
						}} className="stats-grid">
							{[
								{
									label: isAr ? 'إجمالي الطلاب' : 'Total Students',
									value: totalStudents,
									icon: (
										<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
											<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
											<circle cx="9" cy="7" r="4" />
											<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
											<path d="M16 3.13a4 4 0 0 1 0 7.75" />
										</svg>
									),
								},
								{
									label: isAr ? 'الكورسات المنشورة' : 'Published Courses',
									value: publishedCount,
									icon: (
										<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
											<rect x="2" y="3" width="20" height="14" rx="2" />
											<line x1="8" y1="21" x2="16" y2="21" />
											<line x1="12" y1="17" x2="12" y2="21" />
										</svg>
									),
								},
								{
									label: isAr ? 'إجمالي الإيرادات' : 'Total Revenue',
									value: formatMoney(totalRevenue),
									icon: (
										<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
											<line x1="12" y1="1" x2="12" y2="23" />
											<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
										</svg>
									),
								},
							].map((stat, i) => (
								<div key={i} style={{
									background: 'var(--surface)',
									border: '1px solid var(--border)',
									borderRadius: 16,
									padding: 20,
									display: 'flex',
									alignItems: 'center',
									gap: 16,
								}}>
									<div style={{
										width: 44,
										height: 44,
										borderRadius: 12,
										background: 'var(--primary-subtle)',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										flexShrink: 0,
									}}>
										{stat.icon}
									</div>
									<div style={{ flex: 1 }}>
										<div style={{ fontWeight: 300, fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 4, fontFamily: "'PingAR', sans-serif" }}>
											{stat.label}
										</div>
										<div style={{ fontWeight: 500, fontSize: '1.5rem', color: 'var(--foreground)', fontFamily: "'PingAR', sans-serif" }}>
											{stat.value}
										</div>
									</div>
								</div>
							))}
						</div>
					)}

					{/* 3. Filter bar */}
					<div style={{
						display: 'flex',
						gap: 10,
						alignItems: 'center',
						marginBottom: 20,
						flexWrap: 'wrap',
					}}>
						<div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
								style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
								<circle cx="11" cy="11" r="8" />
								<line x1="21" y1="21" x2="16.65" y2="16.65" />
							</svg>
							<input
								type="text"
								placeholder={isAr ? "ابحث عن كورس..." : "Search for course..."}
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								style={{
									width: '100%',
									background: 'var(--surface)',
									border: '1px solid var(--border)',
									borderRadius: 12,
									padding: '10px 16px',
									paddingRight: 40,
									color: 'var(--foreground)',
									fontFamily: "'PingAR', sans-serif",
									fontWeight: 300,
									fontSize: '0.88rem',
									boxSizing: 'border-box',
									outline: 'none',
								}}
							/>
						</div>
						<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
							{tabs.map((tab) => (
								<button
									key={tab.key}
									onClick={() => setActiveTab(tab.key)}
									style={{
										borderRadius: 999,
										padding: '8px 16px',
										fontSize: '0.85rem',
										fontWeight: 500,
										cursor: 'pointer',
										border: activeTab === tab.key ? '1px solid var(--primary)' : '1px solid var(--border)',
										whiteSpace: 'nowrap',
										background: activeTab === tab.key ? 'var(--primary)' : 'var(--surface)',
										color: activeTab === tab.key ? '#fff' : 'var(--muted)',
										fontFamily: "'PingAR', sans-serif",
									}}
								>
									{tab.label}
								</button>
							))}
						</div>
						<select style={{
							background: 'var(--surface)',
							border: '1px solid var(--border)',
							borderRadius: 12,
							padding: '10px 14px',
							color: 'var(--foreground)',
							fontFamily: "'PingAR', sans-serif",
							fontWeight: 300,
							fontSize: '0.85rem',
							cursor: 'pointer',
						}}>
							<option>{isAr ? "الأحدث" : "Latest"}</option>
						</select>
					</div>

					{/* 4. Course cards grid */}
					{isLoading && (
						<div style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
							gap: 16,
						}} className="course-grid">
							{[1, 2, 3].map(i => (
								<div key={i} style={{
									background: 'var(--card-bg)',
									border: '1px solid var(--border)',
									borderRadius: 20,
									overflow: 'hidden',
								}}>
									<div style={{ height: 180, background: 'var(--surface-2)' }} />
									<div style={{ padding: 16 }}>
										<div style={{ height: 16, width: '70%', background: 'var(--surface-2)', borderRadius: 4, marginBottom: 8 }} />
										<div style={{ height: 12, width: '90%', background: 'var(--surface-2)', borderRadius: 4, marginBottom: 12 }} />
										<div style={{ height: 12, width: '50%', background: 'var(--surface-2)', borderRadius: 4 }} />
									</div>
								</div>
							))}
						</div>
					)}

					{!isLoading && filteredCourses.length === 0 && (
						<div style={{
							textAlign: 'center',
							padding: '3rem 1rem',
							background: 'var(--surface)',
							border: '1px dashed var(--border)',
							borderRadius: 16,
						}}>
							<h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px', color: 'var(--foreground)' }}>
								{isInstructor
									? (isAr ? 'لا توجد كورسات بعد' : 'No courses yet')
									: (isAr ? 'لم تشترك في أي كورس بعد' : 'Not enrolled in any course')}
							</h3>
							<p style={{
								color: 'var(--muted)',
								fontSize: '0.875rem',
								margin: '0 0 1.5rem',
								maxWidth: '300px',
								marginInline: 'auto'
							}}>
								{isInstructor
									? (isAr ? 'ابدأ بإنشاء كورسك الأول وشارك معرفتك مع الطلاب' : 'Create your first course and share your knowledge')
									: (isAr ? 'تصفح الكورسات المتاحة وابدأ رحلة التعلم' : 'Browse available courses and start your learning journey')}
							</p>
							{isInstructor && (
								<Link href={`/${locale}/dashboard/create-course`} style={{
									padding: '10px 24px',
									borderRadius: 12,
									background: 'var(--primary)',
									color: '#fff',
									textDecoration: 'none',
									fontWeight: 500,
									fontSize: '0.875rem',
									display: 'inline-flex',
									alignItems: 'center',
									gap: '8px',
								}}>
									<svg width="15" height="15" viewBox="0 0 24 24" fill="none"
										stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
										<line x1="12" y1="5" x2="12" y2="19" />
										<line x1="5" y1="12" x2="19" y2="12" />
									</svg>
									{isAr ? 'إنشاء كورس جديد' : 'Create Course'}
								</Link>
							)}
						</div>
					)}

					{!isLoading && filteredCourses.length > 0 && (
						<div style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
							gap: 16,
						}} className="course-grid">
							{filteredCourses.map((course: any) => {
								const title = getTitle(course, locale);
								const statusConfig = getStatusConfig(course.status, course);
								const enrollments = course._count?.enrollments || course.enrollmentsCount || course.enrollments || 0;
								const coursePrice = course.price;

								return (
									<div key={course.id} style={{
										background: 'var(--card-bg)',
										border: '1px solid var(--border)',
										borderRadius: 20,
										overflow: 'hidden',
										transition: 'border-color 0.2s',
									}} className="course-card">
										{/* Thumbnail area */}
										<div style={{
											height: 180,
											position: 'relative',
											overflow: 'hidden',
											background: course.thumbnail ? 'transparent' : 'var(--surface-2)',
										}}>
											{course.thumbnail ? (
												<img src={getMediaUrl(course.thumbnail) ?? ''} alt={title}
													style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
											) : (
												<div style={{
													width: '100%',
													height: '100%',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
												}}>
													<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
														<rect x="3" y="3" width="18" height="18" rx="2" />
														<circle cx="8.5" cy="8.5" r="1.5" />
														<polyline points="21,15 16,10 5,21" />
													</svg>
												</div>
											)}
											{/* Status badge */}
											<div style={{
												position: 'absolute',
												top: 12,
												right: 12,
												borderRadius: 999,
												padding: '4px 12px',
												fontSize: '0.78rem',
												fontWeight: 500,
												background: statusConfig.bg,
												color: statusConfig.color,
												display: 'flex',
												alignItems: 'center',
												gap: 6,
												fontFamily: "'PingAR', sans-serif",
											}}>
												{statusConfig.hasDot && (
													<span style={{
														width: 7,
														height: 7,
														borderRadius: '50%',
														background: statusConfig.pulse ? '#dc2626' : statusConfig.color,
														animation: statusConfig.pulse ? 'pulse 1.5s ease-in-out infinite' : 'none',
													}} />
												)}
												{isAr ? statusConfig.ar : (statusConfig.key === 'rejected' ? 'مرفوض' : statusConfig.ar)}
											</div>
										</div>

										{/* Card body */}
										<div style={{ padding: 16 }}>
											<div style={{
												fontWeight: 500,
												fontSize: '0.97rem',
												color: 'var(--foreground)',
												marginBottom: 8,
												display: '-webkit-box',
												WebkitLineClamp: 2,
												WebkitBoxOrient: 'vertical',
												overflow: 'hidden',
												lineHeight: 1.4,
												fontFamily: "'PingAR', sans-serif",
											}}>
												{title}
											</div>

											{/* Meta row */}
											<div style={{
												display: 'flex',
												gap: 16,
												fontSize: '0.8rem',
												color: 'var(--muted)',
												fontWeight: 300,
												marginBottom: 12,
												fontFamily: "'PingAR', sans-serif",
											}}>
												<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
													<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
														<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
														<circle cx="9" cy="7" r="4" />
														<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
														<path d="M16 3.13a4 4 0 0 1 0 7.75" />
													</svg>
													<span>{enrollments} {isAr ? "طالب" : "students"}</span>
												</div>
												<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
													<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
														<line x1="12" y1="1" x2="12" y2="23" />
														<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
													</svg>
													<span>{formatCoursePrice(course)}</span>
												</div>
											</div>

											{/* Action row */}
											<div style={{
												display: 'flex',
												gap: 8,
												alignItems: 'center',
											}}>
												{isInstructor ? (
													<>
														<Link href={`/${locale}/dashboard/courses/${course.id}/manage`} style={{
															background: 'var(--primary)',
															color: '#fff',
															border: 'none',
															borderRadius: 10,
															padding: '8px 20px',
															fontSize: '0.85rem',
															fontWeight: 500,
															textDecoration: 'none',
															fontFamily: "'PingAR', sans-serif",
														}}>
															{isAr ? "إدارة" : "Manage"}
														</Link>
														{course.type === 'live' && course.status === 'PUBLISHED' && course.liveStatus !== 'ended' && (
															<button
																onClick={async () => {
																	try {
																		const lessonsRes = await get(`/courses/${course.id}/lessons`)
																		const lessons = (lessonsRes?.data as any)?.data || lessonsRes?.data || []
																		const liveLesson = lessons.find((l: any) => l.lessonType === 'LIVE' || l.type === 'LIVE')
																		if (liveLesson?.id) {
																			await post(`/live/lesson-start/${liveLesson.id}`, {})
																			router.push(`/${locale}/dashboard/courses/${course.id}/go-live?lessonId=${liveLesson.id}`)
																		} else {
																			router.push(`/${locale}/dashboard/courses/${course.id}/go-live`)
																		}
																	} catch (e) {
																		router.push(`/${locale}/dashboard/courses/${course.id}/go-live`)
																	}
																}}
																style={{
																	display: 'flex',
																	alignItems: 'center',
																	gap: 8,
																	background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
																	color: '#fff',
																	border: 'none',
																	borderRadius: 10,
																	padding: '8px 18px',
																	fontSize: '0.85rem',
																	fontWeight: 500,
																	fontFamily: "'PingAR', sans-serif",
																	cursor: 'pointer',
																	boxShadow: '0 0 18px rgba(220,38,38,0.35)',
																	transition: 'all 0.2s',
																	position: 'relative',
																	overflow: 'hidden',
																}}
																onMouseEnter={e => {
																	(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 28px rgba(220,38,38,0.55)';
																	(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.03)';
																}}
																onMouseLeave={e => {
																	(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 18px rgba(220,38,38,0.35)';
																	(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
																}}
															>
																<span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
																	<span style={{
																		position: 'absolute',
																		width: 16, height: 16,
																		borderRadius: '50%',
																		background: 'rgba(255,255,255,0.3)',
																		animation: 'livePulse 1.4s ease-out infinite',
																	}} />
																	<span style={{
																		width: 8, height: 8,
																		borderRadius: '50%',
																		background: '#fff',
																		display: 'inline-block',
																		position: 'relative',
																		zIndex: 1,
																	}} />
																</span>
																<svg width="15" height="15" viewBox="0 0 24 24" fill="none"
																	stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
																	<path d="M16.24 7.76a6 6 0 0 1 0 8.49"/>
																	<path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
																	<path d="M4.93 19.07a10 10 0 0 1 0-14.14"/>
																	<path d="M7.76 16.24a6 6 0 0 1 0-8.49"/>
																	<circle cx="12" cy="12" r="2"/>
																</svg>
																{isAr ? "بدء البث" : "Start Live"}
															</button>
														)}
														<button
															onClick={() => handleDelete(course.id)}
															style={{
																marginLeft: 'auto',
																background: 'transparent',
																border: 'none',
																cursor: 'pointer',
																padding: 6,
																borderRadius: 8,
																display: 'flex',
																alignItems: 'center',
																justifyContent: 'center',
															}}
														>
															<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
																<circle cx="12" cy="5" r="1" />
																<circle cx="12" cy="12" r="1" />
																<circle cx="12" cy="19" r="1" />
															</svg>
														</button>
													</>
												) : (
													<a href={learnUrlWithToken(`/${locale}/courses/${course.id}`)}
														target="_blank"
														rel="noopener noreferrer"
														style={{
															background: 'var(--primary)',
															color: '#fff',
															border: 'none',
															borderRadius: 10,
															padding: '8px 20px',
															fontSize: '0.85rem',
															fontWeight: 500,
															textDecoration: 'none',
															fontFamily: "'PingAR', sans-serif",
														}}>
														{isAr ? "متابعة" : "Continue"}
													</a>
												)}
											</div>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>
			<ConfirmModal
				isOpen={confirmModal.isOpen}
				title={confirmModal.title}
				message={confirmModal.message}
				confirmLabel={isAr ? 'تأكيد الحذف' : 'Delete'}
				cancelLabel={isAr ? 'إلغاء' : 'Cancel'}
				confirmDestructive={confirmModal.destructive}
				onConfirm={confirmModal.onConfirm}
				onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
			/>
			<style jsx global>{`
				@keyframes pulse {
					0%, 100% { opacity: 1; }
					50% { opacity: 0.5; }
				}
				@media (max-width: 640px) {
					.course-grid {
						grid-template-columns: 1fr !important;
					}
				}
				@media (max-width: 480px) {
					.stats-grid {
						grid-template-columns: 1fr !important;
					}
				}
				.course-card:hover {
					border-color: var(--primary-border) !important;
				}
			`}</style>
		</AuthGate>
	);
}
