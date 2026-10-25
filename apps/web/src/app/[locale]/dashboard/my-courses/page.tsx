"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { learnUrlWithToken } from "../../../../lib/learn-link";
import { get } from "../../../../lib/api";
import { AuthGate } from "../../../components/AuthGate";
import ConfirmModal from "@/components/ConfirmModal";
import { getMediaUrl } from "../../../../lib/media";
import { useAuthStore } from "../../../../stores/authStore";

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
			onConfirm: () => {
				setConfirmModal(prev => ({ ...prev, isOpen: false }))
				// TODO: Implement delete
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
			}}>
				<div style={{ padding: '24px 20px', maxWidth: '1400px', margin: '0 auto' }}>
					{/* 1. Hero section */}
					<div style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						gap: '24px',
						flexWrap: 'wrap',
						direction: 'rtl',
						marginBottom: '24px',
					}}>
						<div style={{ flex: '1', minWidth: '250px' }}>
							<h1 style={{
								fontWeight: 700,
								fontSize: 'clamp(2rem, 5vw, 3rem)',
								color: 'var(--foreground)',
								margin: 0,
								marginBottom: '8px',
							}}>
								{isAr ? "كورساتي" : "My Courses"}
							</h1>
							<p style={{
								color: 'var(--muted)',
								fontSize: '0.9rem',
								margin: 0,
								marginBottom: '16px',
							}}>
								{isAr ? "إدارة ومتابعة الكورسات التي أنشأتها" : "Manage and track the courses you created"}
							</p>
							<div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
								<div style={{
									background: 'var(--surface)',
									border: '1px solid var(--border)',
									borderRadius: 999,
									padding: '6px 16px',
									fontSize: '0.85rem',
									color: 'var(--foreground)',
								}}>
									{courses.length} {isAr ? "كورس" : "courses"}
								</div>
								{isInstructor && (
									<Link href={`/${locale}/dashboard/create-course`} style={{
										display: 'inline-flex',
										alignItems: 'center',
										gap: '8px',
										background: 'var(--primary)',
										color: '#fff',
										borderRadius: 12,
										padding: '10px 20px',
										fontSize: '0.9rem',
										fontWeight: 500,
										textDecoration: 'none',
									}}>
										<svg width="16" height="16" viewBox="0 0 24 24" fill="none"
											stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
											<line x1="12" y1="5" x2="12" y2="19" />
											<line x1="5" y1="12" x2="19" y2="12" />
										</svg>
										{isAr ? "+ إنشاء كورس" : "+ Create Course"}
									</Link>
								)}
							</div>
						</div>
						<div style={{
							background: 'var(--surface)',
							border: '1px solid var(--border)',
							borderRadius: 20,
							padding: 24,
							width: 280,
							textAlign: 'center',
						}}>
							<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px', display: 'block' }}>
								<path d="M22 10v6M2 10l10-5 10 5-10 5z" />
								<path d="M6 12v5c3 3 9 3 12 0v-5" />
							</svg>
							<div style={{ fontWeight: 700, color: 'var(--foreground)', marginBottom: '6px' }}>
								{isAr ? "مستقبلك التعليمي يبدأ هنا" : "Your learning future starts here"}
							</div>
							<div style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
								{isAr ? "أنشئ كورسات ملهمة وشارك معرفتك مع آلاف الطلاب حول العالم." : "Create inspiring courses and share your knowledge with thousands of students worldwide."}
							</div>
						</div>
					</div>

					{/* 2. Stats row */}
					{isInstructor && !isLoading && courses.length > 0 && (
						<div style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(3, 1fr)',
							gap: 12,
							margin: '16px 0',
						}} className="stats-grid">
							{[
								{
									label: isAr ? 'إجمالي الطلاب' : 'Total Students',
									value: totalStudents,
									icon: (
										<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
											<circle cx="9" cy="7" r="4" />
											<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
											<path d="M16 3.13a4 4 0 0 1 0 7.75" />
										</svg>
									),
									trend: "+12% من الشهر الماضي",
								},
								{
									label: isAr ? 'الكورسات المنشورة' : 'Published Courses',
									value: publishedCount,
									icon: (
										<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
											<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
										</svg>
									),
								},
								{
									label: isAr ? 'إجمالي الإيرادات' : 'Total Revenue',
									value: `${totalRevenue.toLocaleString()} ${isAr ? 'ر.س' : 'SAR'}`,
									icon: (
										<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
										width: 48,
										height: 48,
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
										<div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: '4px' }}>
											{stat.label}
										</div>
										<div style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--foreground)' }}>
											{stat.value}
										</div>
										{stat.trend && (
											<div style={{ color: 'var(--success)', fontSize: '0.75rem', marginTop: '2px' }}>
												{stat.trend}
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					)}

					{/* 3. Filter + Search bar */}
					<div style={{
						display: 'flex',
						gap: 12,
						alignItems: 'center',
						margin: '16px 0',
						direction: 'rtl',
						flexWrap: 'wrap',
					}}>
						<div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
								style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
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
									padding: '10px 16px 10px 40px',
									color: 'var(--foreground)',
									fontSize: '0.9rem',
									boxSizing: 'border-box',
								}}
							/>
						</div>
						<div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
							{tabs.map((tab) => (
								<button
									key={tab.key}
									onClick={() => setActiveTab(tab.key)}
									style={{
										background: activeTab === tab.key ? 'var(--primary)' : 'var(--surface)',
										color: activeTab === tab.key ? '#fff' : 'var(--muted)',
										border: activeTab === tab.key ? 'none' : '1px solid var(--border)',
										borderRadius: 999,
										padding: '8px 16px',
										fontSize: '0.85rem',
										cursor: 'pointer',
										whiteSpace: 'nowrap',
									}}
								>
									{tab.label}
								</button>
							))}
						</div>
						<button style={{
							background: 'var(--surface)',
							border: '1px solid var(--border)',
							borderRadius: 12,
							padding: '10px 14px',
							color: 'var(--foreground)',
							fontSize: '0.85rem',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							gap: '6px',
						}}>
							{isAr ? "الأحدث" : "Latest"} ▼
						</button>
						<button style={{
							background: 'var(--surface)',
							border: '1px solid var(--border)',
							borderRadius: 10,
							padding: 10,
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
							</svg>
						</button>
					</div>

					{/* 4. Course cards grid */}
					{isLoading && (
						<div style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
							gap: 16,
						}} className="course-grid">
							{[1, 2, 3].map(i => (
								<div key={i} style={{
									background: 'var(--card-bg)',
									border: '1px solid var(--border)',
									borderRadius: 20,
									overflow: 'hidden',
								}}>
									<div style={{ height: 180, background: 'var(--surface)' }} />
									<div style={{ padding: 16 }}>
										<div style={{ height: 16, width: '70%', background: 'var(--surface)', borderRadius: 4, marginBottom: 8 }} />
										<div style={{ height: 12, width: '90%', background: 'var(--surface)', borderRadius: 4, marginBottom: 12 }} />
										<div style={{ height: 12, width: '50%', background: 'var(--surface)', borderRadius: 4 }} />
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
							gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
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
										position: 'relative',
										transition: 'border-color 0.2s',
									}} className="course-card">
										{/* Thumbnail */}
										<div style={{
											height: 180,
											width: '100%',
											background: 'var(--surface)',
											position: 'relative',
											overflow: 'hidden',
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
													<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
														<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
														<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
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
											}}>
												{statusConfig.hasDot && (
													<span style={{
														width: 6,
														height: 6,
														borderRadius: '50%',
														background: statusConfig.pulse ? '#dc2626' : statusConfig.color,
														animation: statusConfig.pulse ? 'pulse 1.5s ease-in-out infinite' : 'none',
													}} />
												)}
												{isAr ? statusConfig.ar : statusConfig.key}
											</div>
										</div>

										{/* Card body */}
										<div style={{ padding: 16 }}>
											<h3 style={{
												fontWeight: 700,
												fontSize: '1rem',
												color: 'var(--foreground)',
												marginBottom: 6,
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												display: '-webkit-box',
												WebkitLineClamp: 2,
												WebkitBoxOrient: 'vertical',
												lineHeight: 1.4,
											}}>
												{title}
											</h3>
											{course.description && (
												<p style={{
													color: 'var(--muted)',
													fontSize: '0.82rem',
													lineHeight: 1.5,
													marginBottom: 12,
													overflow: 'hidden',
													textOverflow: 'ellipsis',
													display: '-webkit-box',
													WebkitLineClamp: 2,
													WebkitBoxOrient: 'vertical',
												}}>
													{course.description}
												</p>
											)}

											{/* Meta row */}
											<div style={{
												display: 'flex',
												gap: 16,
												alignItems: 'center',
												fontSize: '0.8rem',
												color: 'var(--muted)',
											}}>
												<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
													<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
														<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
														<circle cx="9" cy="7" r="4" />
														<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
														<path d="M16 3.13a4 4 0 0 1 0 7.75" />
													</svg>
													<span>{enrollments} {isAr ? "طالب" : "students"}</span>
												</div>
												<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
													<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
														<line x1="12" y1="1" x2="12" y2="23" />
														<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
													</svg>
													<span>{coursePrice === 0 || coursePrice === null ? (isAr ? "مجاني" : "Free") : `${coursePrice} ${isAr ? "ر.س" : "SAR"}`}</span>
												</div>
											</div>

											{/* Action row */}
											<div style={{
												display: 'flex',
												gap: 8,
												marginTop: 12,
												alignItems: 'center',
											}}>
												{isInstructor ? (
													<>
														<Link href={`/${locale}/dashboard/courses/${course.id}/manage`} style={{
															background: 'var(--primary)',
															color: '#fff',
															borderRadius: 10,
															padding: '8px 20px',
															fontSize: '0.85rem',
															fontWeight: 500,
															textDecoration: 'none',
															flex: 1,
															textAlign: 'center',
														}}>
															{isAr ? "إدارة" : "Manage"}
														</Link>
														<button style={{
															background: 'var(--surface-2)',
															border: '1px solid var(--border)',
															borderRadius: 10,
															padding: 8,
															cursor: 'pointer',
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'center',
														}}>
															<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
																<circle cx="12" cy="12" r="3" />
																<path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" />
															</svg>
														</button>
														<button onClick={() => handleDelete(course.id)} style={{
															marginLeft: 'auto',
															background: 'transparent',
															border: 'none',
															cursor: 'pointer',
															padding: 6,
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'center',
														}}>
															<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
																<circle cx="12" cy="12" r="1" />
																<circle cx="19" cy="12" r="1" />
																<circle cx="5" cy="12" r="1" />
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
															borderRadius: 10,
															padding: '8px 20px',
															fontSize: '0.85rem',
															fontWeight: 500,
															textDecoration: 'none',
															flex: 1,
															textAlign: 'center',
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
