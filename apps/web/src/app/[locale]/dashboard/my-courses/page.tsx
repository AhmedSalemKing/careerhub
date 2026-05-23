"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
	BookOpen,
	Play,
	Radio,
	MapPin,
	Video,
	Clock,
	CheckCircle2,
	AlertCircle,
	Square,
} from "lucide-react";
import { get } from "../../../../lib/api";
import { AuthGate } from "../../../components/AuthGate";
import ConfirmModal from "@/components/ConfirmModal";
import { getMediaUrl } from "../../../../lib/media";
import { useAuthStore } from "../../../../stores/authStore";

function getTitle(c: any, locale: string) {
	if (locale === "ar") return c.titleAr || c.titleEn || c.title || "بدون عنوان";
	return c.titleEn || c.titleAr || c.title || "Untitled";
}

function getTypeConfig(course: any) {
	const type = course.type || "recorded";
	if (type === "live")
		return { label: "Live", ar: "بث مباشر", icon: Radio, color: "#dc2626", bg: "rgba(220,38,38,0.1)" };
	if (type === "offline")
		return { label: "Offline", ar: "مقر فعلي", icon: MapPin, color: "#16a34a", bg: "rgba(22,163,74,0.1)" };
	return { label: "Recorded", ar: "مسجل", icon: Video, color: "#5120c8", bg: "rgba(81,32,200,0.1)" };
}

function getStatusConfig(status: string) {
	switch (status) {
		case "PUBLISHED":
			return { label: "Published", ar: "منشور", color: "#16a34a", bg: "rgba(22,163,74,0.1)", icon: CheckCircle2 };
		case "DRAFT":
			return { label: "Draft", ar: "مسودة", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", icon: AlertCircle };
		case "PENDING_REVIEW":
			return { label: "Pending", ar: "قيد المراجعة", color: "#ffffff", bg: "rgba(81,32,200,0.1)", icon: Clock };
		default:
			return { label: status, ar: status, color: "#6b7280", bg: "rgba(107,114,128,0.1)", icon: AlertCircle };
	}
}

const LEARN_URL = process.env.NEXT_PUBLIC_LEARN_URL || 'https://devewayhub.vercel.app';

export default function MyCoursesPage() {
	const locale = useLocale();
	const router = useRouter();
	const { user, hydrate } = useAuthStore();
	const [courses, setCourses] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);

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

	return (
		<AuthGate>
			<div className="p-4 md:p-6" dir={isAr ? "rtl" : "ltr"} style={{
			width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box',
		}}>
				{/* PAGE HEADER */}
				<div style={{
					display: 'flex', alignItems: 'center', justifyContent: 'space-between',
					marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem',
				}}>
					<div>
						<h1 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', fontWeight: 800, margin: 0 }}>
							{isAr ? 'كورساتي' : 'My Courses'}
						</h1>
						<p style={{ color: 'var(--muted-foreground)', marginTop: '4px', fontSize: '0.9rem' }}>
							{courses.length} {isAr ? 'كورس' : 'courses'}
						</p>
					</div>
					{isInstructor && (
						<Link href={`/${locale}/dashboard/create-course`} style={{
							display: 'inline-flex', alignItems: 'center', gap: '8px',
							padding: '10px 20px', borderRadius: '10px',
							background: 'var(--primary, #5120c8)', color: '#fff',
							fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none',
						}}>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none"
								stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
								<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
							</svg>
							{isAr ? 'إنشاء كورس' : 'New Course'}
						</Link>
					)}
				</div>

				{/* STATS BAR */}
				{isInstructor && !isLoading && courses.length > 0 && (
					<div style={{
						display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
						gap: '1rem', marginBottom: '2rem',
					}}>
						{[
							{
								labelAr: 'إجمالي الطلاب', labelEn: 'Total Students',
								value: totalStudents,
								icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
							},
							{
								labelAr: 'إجمالي الإيرادات', labelEn: 'Total Revenue',
								value: `${totalRevenue.toLocaleString()} ${isAr ? 'ر.س' : 'SAR'}`,
								icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
							},
							{
								labelAr: 'كورسات منشورة', labelEn: 'Published',
								value: publishedCount,
								icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
							},
						].map((stat, i) => (
							<div key={i} style={{
								padding: '1rem 1.25rem',
								background: 'rgba(255,255,255,0.03)',
								border: '1px solid rgba(255,255,255,0.08)',
								borderRadius: '12px',
								display: 'flex', alignItems: 'center', gap: '12px',
							}}>
								<div style={{
									width: '40px', height: '40px', borderRadius: '10px',
									background: 'rgba(81,32,200,0.15)',
									display: 'flex', alignItems: 'center', justifyContent: 'center',
									color: '#a78bfa',
								}}>
									{stat.icon}
								</div>
								<div>
									<p style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
										{stat.value}
									</p>
									<p style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', margin: 0 }}>
										{isAr ? stat.labelAr : stat.labelEn}
									</p>
								</div>
							</div>
						))}
					</div>
				)}

				{/* LOADING */}
				{isLoading && (
					<div style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
						gap: '1.25rem',
					}}>
						{[1, 2, 3].map(i => (
							<div key={i} style={{
								background: 'rgba(255,255,255,0.03)',
								border: '1px solid rgba(255,255,255,0.08)',
								borderRadius: '16px', overflow: 'hidden',
							}}>
								<div style={{ height: '160px', background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} />
								<div style={{ padding: '1rem 1.25rem' }}>
									<div style={{ height: '16px', width: '70%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}/>
									<div style={{ height: '12px', width: '40%', marginTop: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}/>
								</div>
							</div>
						))}
					</div>
				)}

				{/* EMPTY STATE */}
				{!isLoading && courses.length === 0 && (
					<div style={{
						textAlign:'center', padding:'3rem 1rem',
						background:'rgba(255,255,255,0.02)',
						border:'1px dashed rgba(255,255,255,0.08)',
						borderRadius:'16px',
					}}>
						<div style={{
							width:'72px', height:'72px', borderRadius:'18px',
							background:'rgba(81,32,200,0.1)',
							border:'1px solid rgba(81,32,200,0.2)',
							display:'flex', alignItems:'center', justifyContent:'center',
							margin:'0 auto 1.25rem',
						}}>
							<svg width="32" height="32" viewBox="0 0 24 24" fill="none"
								stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round">
								<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
								<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
							</svg>
						</div>
						<h3 style={{ fontSize:'1.1rem', fontWeight:700, margin:'0 0 8px' }}>
							{isInstructor
								? (isAr ? 'لا توجد كورسات بعد' : 'No courses yet')
								: (isAr ? 'لم تشترك في أي كورس بعد' : 'Not enrolled in any course')}
						</h3>
						<p style={{ color:'var(--muted-foreground)', fontSize:'0.875rem',
							margin:'0 0 1.5rem', maxWidth:'300px', marginInline:'auto' }}>
							{isInstructor
								? (isAr ? 'ابدأ بإنشاء كورسك الأول وشارك معرفتك مع الطلاب' : 'Create your first course and share your knowledge')
								: (isAr ? 'تصفح الكورسات المتاحة وابدأ رحلة التعلم' : 'Browse available courses and start your learning journey')}
						</p>
						<a href={isInstructor ? `/${locale}/dashboard/create-course` : `${LEARN_URL}/${locale}/courses`} target="_blank" rel="noopener noreferrer" style={{
							padding:'10px 24px', borderRadius:'10px',
							background:'#5120c8', color:'#fff',
							textDecoration:'none', fontWeight:600, fontSize:'0.875rem',
							display:'inline-flex', alignItems:'center', gap:'8px',
						}}>
							<svg width="15" height="15" viewBox="0 0 24 24" fill="none"
								stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
								<line x1="12" y1="5" x2="12" y2="19"/>
								<line x1="5" y1="12" x2="19" y2="12"/>
							</svg>
							{isInstructor
								? (isAr ? 'إنشاء كورس جديد' : 'Create Course')
								: (isAr ? 'تصفح الكورسات' : 'Browse Courses')}
						</a>
					</div>
				)}

				{/* COURSE GRID */}
				{!isLoading && courses.length > 0 && (
					<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 w-full">
						{courses.map((course: any) => {
							const title = getTitle(course, locale);
							const typeConfig = getTypeConfig(course);
							const statusConfig = getStatusConfig(course.status);
							const TypeIcon = typeConfig.icon;
							const enrollments = course._count?.enrollments || course.enrollmentsCount || course.enrollments || 0;
							const earnings = course.earnings || course.revenue || 0;

							return (
								<div key={course.id} style={{
									background: 'rgba(255,255,255,0.03)',
									border: '1px solid rgba(255,255,255,0.08)',
									borderRadius: '16px',
									overflow: 'hidden',
									transition: 'border-color 0.2s',
									position: 'relative',
									width: '100%', minWidth: 0, boxSizing: 'border-box',
								}}>
									{/* Thumbnail */}
									<div style={{
										width: '100%', aspectRatio: '16/9', background: '#1a1a2e',
										position: 'relative', overflow: 'hidden',
									}}>
										{course.thumbnail ? (
											<img src={getMediaUrl(course.thumbnail) ?? ''} alt={title}
												style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
										) : (
											<div style={{
												width: '100%', height: '100%',
												background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1054 100%)',
												display: 'flex', alignItems: 'center', justifyContent: 'center',
											}}>
												<TypeIcon style={{ width: 48, height: 48, opacity: 0.2 }} />
											</div>
										)}

										{/* Status badge */}
										<div style={{
											position: 'absolute', top: '10px', right: '10px',
											padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem',
											fontWeight: 600,
											background: statusConfig.bg,
											border: `1px solid ${statusConfig.color}40`,
											color: statusConfig.color,
										}}>
											{isAr ? statusConfig.ar : statusConfig.label}
										</div>

										{/* Course type badge */}
										{course.type === "live" && (
											<div style={{
												position: 'absolute', top: '10px', left: '10px',
												padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem',
												fontWeight: 600,
												background: 'rgba(239,68,68,0.2)',
												border: '1px solid rgba(239,68,68,0.4)',
												color: '#f87171',
											}}>
												{isAr ? 'بث مباشر' : 'Live'}
											</div>
										)}

										{/* Go Live actions for live courses */}
										{course.type === "live" && course.liveStatus !== 'ended' && (
											course.liveStatus === 'live' ? (
												<a href={`/${locale}/dashboard/courses/${course.id}/go-live`}
													onClick={(e) => e.stopPropagation()}
													style={{
														position: 'absolute', bottom: '10px', right: '10px',
														display: 'flex', alignItems: 'center', gap: '4px',
														padding: '4px 12px', borderRadius: '8px',
														background: 'rgba(239,68,68,0.9)', color: '#fff',
														fontSize: '0.72rem', fontWeight: 600, textDecoration: 'none',
													}}>
													<Radio size={12} />
													{isAr ? 'إدارة البث' : 'Manage Live'}
												</a>
											) : (
												<button onClick={(e) => { e.stopPropagation(); router.push(`/${locale}/dashboard/courses/${course.id}/go-live`); }}
													style={{
														position: 'absolute', bottom: '10px', right: '10px',
														display: 'flex', alignItems: 'center', gap: '4px',
														padding: '4px 12px', borderRadius: '8px',
														background: 'rgba(239,68,68,0.9)', color: '#fff',
														fontSize: '0.72rem', fontWeight: 600, border: 'none', cursor: 'pointer',
													}}>
													<Play size={12} />
													{isAr ? 'بدء البث' : 'Go Live'}
												</button>
											)
										)}
										{course.type === "live" && course.liveStatus === 'ended' && (
											<div style={{
												position: 'absolute', bottom: '10px', right: '10px',
												display: 'flex', alignItems: 'center', gap: '4px',
												padding: '4px 12px', borderRadius: '8px',
												background: 'rgba(107,114,128,0.2)', color: '#9ca3af',
												fontSize: '0.72rem', fontWeight: 600,
											}}>
												<Square size={12} />
												{isAr ? 'منتهي' : 'Ended'}
											</div>
										)}
									</div>

									{/* Card body */}
									<div style={{ padding: '1rem 1.25rem' }}>
										<h3 style={{
											fontSize: 'clamp(11px, 3vw, 14px)', fontWeight: 700, margin: '0 0 8px',
											overflow: 'hidden', textOverflow: 'ellipsis',
											display: '-webkit-box', WebkitLineClamp: 2,
											WebkitBoxOrient: 'vertical',
										}}>
											{title}
										</h3>

										{/* Stats row */}
										<div style={{
											display: 'flex', alignItems: 'center', gap: '12px',
											marginBottom: '1rem', flexWrap: 'wrap',
										}}>
											{isInstructor ? (
												<>
													<span style={{ display: 'flex', alignItems: 'center', gap: '4px',
														fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
														<svg width="13" height="13" viewBox="0 0 24 24" fill="none"
															stroke="currentColor" strokeWidth="2">
															<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
															<circle cx="9" cy="7" r="4"/>
														</svg>
														{enrollments}
													</span>
													<span style={{ display: 'flex', alignItems: 'center', gap: '4px',
														fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
														<svg width="13" height="13" viewBox="0 0 24 24" fill="none"
															stroke="currentColor" strokeWidth="2">
															<line x1="12" y1="1" x2="12" y2="23"/>
															<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
														</svg>
														{course.price === 0 ? (isAr ? 'مجاني' : 'Free') : `${course.price} ر.س`}
													</span>
													<span style={{ display: 'flex', alignItems: 'center', gap: '4px',
														fontSize: '0.8rem', color: '#4ade80', fontWeight: 600 }}>
														{earnings.toLocaleString()} ر.س
													</span>
												</>
											) : (
												<>
													<span style={{ display: 'flex', alignItems: 'center', gap: '4px',
														fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
														<svg width="13" height="13" viewBox="0 0 24 24" fill="none"
															stroke="currentColor" strokeWidth="2">
															<line x1="12" y1="1" x2="12" y2="23"/>
															<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
														</svg>
														{course.price === 0 ? (isAr ? 'مجاني' : 'Free') : `${course.price} ر.س`}
													</span>
													{course.progress !== undefined && (
														<span style={{ display: 'flex', alignItems: 'center', gap: '4px',
															fontSize: '0.8rem', color: '#a78bfa', fontWeight: 600 }}>
															{Math.round(course.progress)}% {isAr ? 'مكتمل' : 'complete'}
														</span>
													)}
												</>
											)}
										</div>

										{/* Actions */}
										<div style={{ display: 'flex', gap: '8px' }}>
											{isInstructor ? (
												<>
													<Link href={`/${locale}/dashboard/courses/${course.id}/manage`}
														style={{
															flex: 1, padding: '8px', borderRadius: '8px', textAlign: 'center',
															background: 'rgba(81,32,200,0.15)',
															border: '1px solid rgba(81,32,200,0.3)',
															color: '#a78bfa',
															fontWeight: 600,
															textDecoration: 'none',
															fontSize: 'clamp(11px, 2.5vw, 13px)',
															width: '100%',
														}}>
														{isAr ? 'إدارة' : 'Manage'}
													</Link>
													<button onClick={() => handleDelete(course.id)}
														style={{
															padding: '8px', borderRadius: '8px',
															background: 'rgba(239,68,68,0.08)',
															border: '1px solid rgba(239,68,68,0.2)',
															color: '#f87171',
															fontSize: 'clamp(11px, 2.5vw, 13px)',
															cursor: 'pointer',
															width: '100%',
															textAlign: 'center',
														}}>
														<svg width="14" height="14" viewBox="0 0 24 24" fill="none"
															stroke="currentColor" strokeWidth="2" strokeLinecap="round">
															<polyline points="3 6 5 6 21 6"/>
															<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
														</svg>
													</button>
												</>
											) : (
												<a href={`${LEARN_URL}/${locale}/courses/${course.id}`}
													target="_blank" rel="noopener noreferrer"
													style={{
														flex: 1, padding: '8px', borderRadius: '8px', textAlign: 'center',
														background: 'rgba(81,32,200,0.15)',
														border: '1px solid rgba(81,32,200,0.3)',
														color: '#a78bfa',
														fontWeight: 600,
														textDecoration: 'none',
														fontSize: 'clamp(11px, 2.5vw, 13px)',
														width: '100%',
													}}>
													{isAr ? 'متابعة' : 'Continue'}
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
		</AuthGate>
	);
}
