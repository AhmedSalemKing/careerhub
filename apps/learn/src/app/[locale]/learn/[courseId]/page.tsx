"use client";

import {
	useState,
	useEffect,
	Suspense,
	useRef,
	useMemo,
	useCallback,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { get, post } from "../../../../lib/api";
import { toast, Toaster } from "react-hot-toast";
import {
	Lock,
	Play,
	BookOpen,
	ArrowRight,
	ArrowLeft,
	Sparkles,
	CheckCircle2,
	ChevronDown,
	CheckCheck,
	Video,
	FileText,
	Clock,
	Award,
	ChevronLeft,
	ChevronRight,
	Settings,
	Download,
	Share2,
	MessageSquare,
	ThumbsUp,
	TrendingUp,
	Loader2,
	Gift,
	ShoppingCart,
	PlayCircle,
	Image,
	File,
	ExternalLink,
	ZoomIn,
	Eye,
	FileDown,
	Volume2,
	VolumeX,
	Pause,
	SkipForward,
	SkipBack,
	GraduationCap,
	Target,
	Star,
	Zap,
} from "lucide-react";
import VideoProtection from "../../../../components/VideoProtection";

	function LearnPageInner() {
		const params = useParams();
		const courseId = params.courseId as string;
		const locale = useLocale();
		const router = useRouter();
		const searchParams = useSearchParams();
		const qc = useQueryClient();
		const lessonParam = searchParams.get("lesson");

		// Token helper: try ALL known token storage keys
		const getAuthToken = (): string => {
			if (typeof window === 'undefined') return ''
			return (
				localStorage.getItem('deveway_token') ||
				localStorage.getItem('careerhub_token') ||
				localStorage.getItem('token') ||
				sessionStorage.getItem('deveway_token') ||
				sessionStorage.getItem('token') ||
				''
			)
	}

	const isAr = locale === 'ar'

	// Native video ref
	const videoRef = useRef<HTMLVideoElement>(null);
	const lastTapRef = useRef<{ time: number; x: number } | null>(null);

	const [localCompleted, setLocalCompleted] = useState<Set<string>>(new Set());
	const [videoReady, setVideoReady] = useState(false);
	const [authChecked, setAuthChecked] = useState(false);
	const [openSections, setOpenSections] = useState<Set<string>>(new Set());
	const [markingComplete, setMarkingComplete] = useState(false);
	const [isCourseComplete, setIsCourseComplete] = useState(false);
	const [isGeneratingCert, setIsGeneratingCert] = useState(false);
	const [theme, setTheme] = useState<"light" | "dark">("light");

	// Media states
	const [viewerMode, setViewerMode] = useState<
		"video" | "file" | "image" | "all"
	>("all");
	const [isLoadingMedia, setIsLoadingMedia] = useState(true);
	const [videoError, setVideoError] = useState<string | null>(null);
	const [playbackRate, setPlaybackRate] = useState(1);
	const [seekFeedback, setSeekFeedback] = useState<{
		side: "forward" | "backward";
		visible: boolean;
	}>({ side: "forward", visible: false });
	const speeds = [0.75, 1, 1.25, 1.5, 2];

	// Theme detection
	useEffect(() => {
		const saved = localStorage.getItem("theme") as "light" | "dark" | null;
		const systemDark = window.matchMedia(
			"(prefers-color-scheme: dark)",
		).matches;
		if (saved) setTheme(saved);
		else if (systemDark) setTheme("dark");
		const interval = setInterval(() => {
			const t = localStorage.getItem("theme") as "light" | "dark" | null;
			if (t) setTheme(t);
		}, 500);
		return () => clearInterval(interval);
	}, []);

	// Mobile detection
	const [isMobile, setIsMobile] = useState(false);
	useEffect(() => {
		const check = () => setIsMobile(window.innerWidth < 1024);
		check();
		window.addEventListener("resize", check);
		return () => window.removeEventListener("resize", check);
	}, []);

	// Auth guard
	useEffect(() => {
		const token =
			localStorage.getItem("deveway_token") ||
			document.cookie.match(/deveway_token=([^;]+)/)?.[1];
		if (!token) {
			const MAIN = process.env.NEXT_PUBLIC_MAIN_URL || "";
			window.location.href = `${MAIN}/${locale}/login?redirect=${encodeURIComponent(window.location.pathname)}`;
			return;
		}
		if (!localStorage.getItem("deveway_token")) {
			localStorage.setItem("deveway_token", token);
		}
		if (!localStorage.getItem("deveway_user")) {
			const m = document.cookie.match(/deveway_user=([^;]+)/);
			if (m) {
				try {
					localStorage.setItem("deveway_user", decodeURIComponent(m[1]));
				} catch {}
			}
		}
		setAuthChecked(true);
	}, [locale]);

	const { data: course, isLoading } = useQuery({
		queryKey: ["learn-course", courseId],
		enabled: !!courseId && authChecked,
		queryFn: async () => {
			const res = await get(`/courses/${courseId}`);
			return (
				(res?.data as any)?.data?.course ??
				(res?.data as any)?.data ??
				(res?.data as any)
			);
		},
	});

	const { data: enrollment, refetch: refetchEnrollment } = useQuery({
		queryKey: ["learn-enrollment", courseId],
		enabled: !!courseId && authChecked,
		queryFn: async () => {
			try {
				const res = await get(`/courses/${courseId}/enrollment`);
				return (
					(res?.data as any)?.data?.enrollment ??
					(res?.data as any)?.data ??
					null
				);
			} catch {
				return null;
			}
		},
	});

	const isEnrolled = !!enrollment;

	// Extract completed lesson IDs from enrollment response
	const getCompletedLessonIds = (): string[] => {
		try {
			if (!enrollment) return [];
			// Primary: new completedLessonIds array from updated getEnrollment
			if (Array.isArray(enrollment.completedLessonIds)) {
				return enrollment.completedLessonIds.filter(Boolean);
			}
			// Fallback: array of objects with lessonId
			if (Array.isArray(enrollment.completedLessons)) {
				return enrollment.completedLessons
					.map((cl: any) => cl.lessonId || cl.id || cl)
					.filter(Boolean);
			}
			// Fallback: lessons array with status
			if (Array.isArray(enrollment.lessons)) {
				return enrollment.lessons
					.filter((l: any) => l.completed || l.status === "COMPLETED")
					.map((l: any) => l.id || l.lessonId)
					.filter(Boolean);
			}
			return [];
		} catch {
			return [];
		}
	};

	const completedLessonIdsList = getCompletedLessonIds();
	// Merge server-confirmed + locally-tracked completions for instant UI feedback
	const completedLessons = useMemo(
		() => new Set([...completedLessonIdsList, ...Array.from(localCompleted)]),
		[completedLessonIdsList, localCompleted],
	);

	// Safe sections extraction
	const sections: any[] = useMemo(
		() =>
			Array.isArray(course?.sections)
				? course.sections
				: Array.isArray(course?.modules)
					? course.modules
					: [],
		[course],
	);

	// Flat ordered list across all sections — used for locking + navigation
	const allLessonsFlat = useMemo(
		() =>
			sections.flatMap((s: any) =>
				(Array.isArray(s.lessons) ? s.lessons : []).map((l: any) => ({
					...l,
					sectionTitle: s.title || s.titleAr,
				})),
			),
		[sections],
	);

	// Single source of truth: URL param drives everything
	const currentLesson = useMemo(() => {
		if (!allLessonsFlat.length) return null;
		if (!lessonParam) return allLessonsFlat[0] || null;
		return (
			allLessonsFlat.find((l: any) => l.id === lessonParam) || allLessonsFlat[0]
		);
	}, [lessonParam, allLessonsFlat]);
	const activeLesson = currentLesson;
	const activeLessonId = currentLesson?.id ?? null;

	const goToLesson = useCallback(
		(lesson: any) => {
			if (!lesson?.id) return;
			router.replace(`/${locale}/learn/${courseId}?lesson=${lesson.id}`, {
				scroll: false,
			});
		},
		[router, locale, courseId],
	);

	const activeLessonIndex = allLessonsFlat.findIndex(
		(l: any) => l.id === activeLessonId,
	);
	const prevLesson =
		activeLessonIndex > 0 ? allLessonsFlat[activeLessonIndex - 1] : null;
	const nextLesson =
		activeLessonIndex < allLessonsFlat.length - 1
			? allLessonsFlat[activeLessonIndex + 1]
			: null;

	// Sequential lock: lesson N unlocked only when lesson N-1 is completed
	const isLessonUnlocked = useCallback(
		(lessonId: string): boolean => {
			if (!isEnrolled) return false;
			const idx = allLessonsFlat.findIndex((l: any) => l.id === lessonId);
			if (idx <= 0) return true;
			return completedLessons.has(allLessonsFlat[idx - 1]?.id);
		},
		[allLessonsFlat, completedLessons, isEnrolled],
	);

	const getLessonStatus = useCallback(
		(lessonId: string): "completed" | "available" | "locked" => {
			if (completedLessons.has(lessonId)) return "completed";
			if (isLessonUnlocked(lessonId)) return "available";
			return "locked";
		},
		[completedLessons, isLessonUnlocked],
	);

	// ✅ FIXED: Safe URL construction - handles relative and absolute URLs
	const apiBase =
		process.env.NEXT_PUBLIC_API_URL || "https://deve-way.onrender.com/api";

	const getSafeUrl = (url: string | null | undefined): string => {
		if (!url) return "";
		
		// Local /uploads/ paths no longer exist on Render — treat as broken
		if (url.startsWith("/uploads/")) return "";
		
		// If already absolute URL, return as-is
		if (url.startsWith("http://") || url.startsWith("https://")) {
			return url;
		}
		
		// Remove leading slash if present to avoid double slashes
		const cleanUrl = url.replace(/^\//, "");
		
		// Construct full URL with API base
		return `${apiBase}/${cleanUrl}`;
	};

	// Detect lessons whose content was uploaded to the old Render filesystem (now gone)
	const hasLocalUrl =
		(!!activeLesson?.videoUrl && !activeLesson.videoUrl.startsWith("http")) ||
		(!!activeLesson?.fileUrl && !activeLesson.fileUrl.startsWith("http"));

	const videoUrl: string | undefined =
		getSafeUrl(activeLesson?.videoUrl) || undefined;
	const fileUrl: string | undefined =
		getSafeUrl(activeLesson?.fileUrl) || undefined;
	const imageUrl: string | undefined =
		getSafeUrl(activeLesson?.imageUrl) || undefined;
	const fileName: string = activeLesson?.fileName || "document.pdf";

	const isCurrentCompleted = activeLessonId
		? completedLessons.has(activeLessonId)
		: false;
	const completedCount = completedLessons.size;
	const totalLessons = allLessonsFlat.length;
	const progress =
		totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
	const MAIN_URL = process.env.NEXT_PUBLIC_MAIN_URL || "";

	// Show certificate button if course is complete OR all lessons are done (defensive fallback)
	const showCertButton = isCourseComplete ||
		(allLessonsFlat.length > 0 && completedLessons.size >= allLessonsFlat.length);

	// Merge localStorage progress on first load (before server data arrives)
	useEffect(() => {
		if (!courseId) return;
		try {
			const saved = localStorage.getItem(`progress_${courseId}`);
			if (saved) {
				const ids: string[] = JSON.parse(saved);
				if (Array.isArray(ids) && ids.length > 0) {
					setLocalCompleted((prev) => new Set([...prev, ...ids]));
				}
			}
		} catch {}
	}, [courseId]);

	// Reset video ready state when lesson changes
	useEffect(() => {
		setVideoReady(false);
	}, [activeLessonId]);

	// Auto-open section containing active lesson
	useEffect(() => {
		if (!activeLessonId || sections.length === 0) return;
		sections.forEach((s: any) => {
			if (
				Array.isArray(s.lessons) &&
				s.lessons.some((l: any) => l.id === activeLessonId)
			) {
				setOpenSections((prev) => new Set([...prev, s.id]));
			}
		});
	}, [activeLessonId, sections]);

	// Set isCourseComplete if course is already finished (from enrollment or localStorage)
	useEffect(() => {
		if (totalLessons > 0 && completedLessons.size >= totalLessons) {
			setIsCourseComplete(true);
		}
	}, [completedLessons, totalLessons]);

	// Update page title
	useEffect(() => {
		if (activeLesson) {
			document.title = `${activeLesson.title || activeLesson.titleAr} - ${course?.titleAr || course?.titleEn || "التعلم"}`;
		}
	}, [activeLesson, course]);

	// Reset states when lesson changes
	useEffect(() => {
		setViewerMode("all");
		setIsLoadingMedia(true);
		setVideoError(null);
	}, [activeLessonId]);

	// Apply playback speed to video element
	useEffect(() => {
		if (videoRef.current) videoRef.current.playbackRate = playbackRate;
	}, [playbackRate, activeLessonId]);

	// Keyboard shortcuts
	useEffect(() => {
		const handleKeys = (e: KeyboardEvent) => {
			const video = videoRef.current;
			if (!video) return;
			// Ignore when typing in inputs
			if (
				(e.target as HTMLElement).tagName === "INPUT" ||
				(e.target as HTMLElement).tagName === "TEXTAREA"
			)
				return;
			switch (e.key) {
				case "ArrowLeft":
					e.preventDefault();
					video.currentTime = Math.max(0, video.currentTime - 5);
					showSeekFeedback("backward");
					break;
				case "ArrowRight":
					e.preventDefault();
					video.currentTime = Math.min(
						video.duration || 0,
						video.currentTime + 5,
					);
					showSeekFeedback("forward");
					break;
				case " ":
					e.preventDefault();
					video.paused ? video.play() : video.pause();
					break;
				case "f":
					video.requestFullscreen?.();
					break;
			}
		};
		window.addEventListener("keydown", handleKeys);
		return () => window.removeEventListener("keydown", handleKeys);
	}, [activeLessonId]);

	// Double-tap to seek ±5s on mobile
	const showSeekFeedback = (side: "forward" | "backward") => {
		setSeekFeedback({ side, visible: true });
		setTimeout(
			() => setSeekFeedback((prev) => ({ ...prev, visible: false })),
			600,
		);
	};

	const handleVideoTap = (e: React.TouchEvent<HTMLDivElement>) => {
		const now = Date.now();
		const touch = e.changedTouches[0];
		const videoWidth = e.currentTarget.offsetWidth;
		if (lastTapRef.current && now - lastTapRef.current.time < 300) {
			const video = videoRef.current;
			if (!video) return;
			const isLeft = touch.clientX < videoWidth / 2;
			if (isLeft) {
				video.currentTime = Math.max(0, video.currentTime - 5);
				showSeekFeedback("backward");
			} else {
				video.currentTime = Math.min(
					video.duration || 0,
					video.currentTime + 5,
				);
				showSeekFeedback("forward");
			}
			lastTapRef.current = null;
		} else {
			lastTapRef.current = { time: now, x: touch.clientX };
		}
	};

	const toggleSection = (id: string) => {
		setOpenSections((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const handleMarkComplete = async (): Promise<void> => {
		if (!activeLessonId || markingComplete) return;
		const token = getAuthToken()
		if (!token) {
			toast.error(isAr ? 'يجب تسجيل الدخول اولا' : 'Authentication required')
			router.push(`/${locale}/login`)
			return
		}

		setMarkingComplete(true);
		setLocalCompleted((prev) => {
			const next = new Set([...prev, activeLessonId]);
			try {
				const allIds = [...next, ...completedLessonIdsList];
				localStorage.setItem(`progress_${courseId}`, JSON.stringify([...new Set(allIds)]));
			} catch {}
			return next;
		});

		try {
			const res = await fetch(
				`${apiBase}/courses/${courseId}/lessons/${activeLessonId}/complete`,
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${token}`,
						'Content-Type': 'application/json',
					},
				},
			);

			const payload = await res.json();
			console.log('[Lesson] Mark complete response:', payload);

			if (!res.ok) {
				const msg = payload?.message || (isAr ? 'فشل تسجيل اتمام الدرس' : 'Failed to complete lesson');
				toast.error(msg);
				setMarkingComplete(false);
				return;
			}

			const progress: number = payload?.data?.progress ?? 0;
			const isCourseComplete: boolean = payload?.data?.isCourseComplete ?? progress >= 100;

			// Update local completed lessons state
			// (already done above via setLocalCompleted)

			if (isCourseComplete) {
				setIsCourseComplete(true);
				toast.success(
					isAr
						? 'تهانينا! اكملت الكورس بنجاح. جاري اصدار شهادتك...'
						: 'Course complete! Issuing your certificate...',
				);

				// Auto-trigger certificate (with 2s delay to allow backend to process)
				setTimeout(async () => {
					try {
						const certRes = await fetch(`${apiBase}/certificates/generate/${courseId}`, {
							method: 'POST',
							headers: {
								Authorization: `Bearer ${token}`,
								'Content-Type': 'application/json',
							},
						});
						const certPayload = await certRes.json();
						console.log('[Certificate] Auto-generation result:', certPayload);

						if (certPayload?.success || certPayload?.data?.id) {
							toast.success(
								isAr ? 'تم اصدار شهادتك بنجاح' : 'Certificate issued successfully',
							);
						}
					} catch (certErr: any) {
						console.warn('[Certificate] Auto-trigger failed (non-fatal):', certErr.message);
					}
				}, 2000);
			} else {
				toast.success(
					isAr
						? `تم اتمام الدرس (${progress}%)`
						: `Lesson completed (${progress}%)`,
				);
			}

			refetchEnrollment();
			qc.invalidateQueries({ queryKey: ["learn-enrollment", courseId] });

			if (nextLesson) {
				goToLesson(nextLesson);
			}
		} catch (err: any) {
			console.error('[Lesson] Completion error:', err.message);
			toast.error(isAr ? 'حدث خطا غير متوقع' : 'Unexpected error occurred');
		} finally {
			setMarkingComplete(false);
		}
	};

	const handleGetCertificate = async (): Promise<void> => {
		const token = getAuthToken()
		if (!token) {
			router.push(`/${locale}/login`)
			return
		}

		setIsGeneratingCert(true)
		const toastId = toast.loading(
			isAr ? 'جاري اصدار الشهادة...' : 'Generating certificate...',
		)

		try {
			console.log('[Certificate] Requesting generation for courseId:', courseId)
			console.log('[Certificate] Token exists:', !!token, '| Token length:', token.length)

			const res = await fetch(`${apiBase}/certificates/generate/${courseId}`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			})

			const payload = await res.json()
			toast.dismiss(toastId)

			if (res.ok && (payload?.success || payload?.data?.id || payload?.data?.serialNumber)) {
				const serial = payload?.data?.serialNumber || payload?.data?.serial || ''
				toast.success(
					isAr ? 'تم اصدار الشهادة بنجاح' : 'Certificate issued successfully',
				)
				// Wait 1.5s then redirect to web app certificates page
				setTimeout(() => {
					const webUrl = process.env.NEXT_PUBLIC_MAIN_URL || 'https://deveway-teal.vercel.app'
					window.location.href = `${webUrl}/${locale}/dashboard/certificates`
				}, 1500)
			} else {
				const errMsg = payload?.message || payload?.error || 'Certificate generation failed'
				console.error('[Certificate] Generation failed:', errMsg, '| Full response:', payload)
				toast.error(isAr ? `فشل: ${errMsg}` : `Failed: ${errMsg}`)
			}
		} catch (err: any) {
			toast.dismiss(toastId)
			console.error('[Certificate] Network error:', err.message)
			toast.error(isAr ? 'خطأ في الاتصال بالخادم' : 'Network error please try again')
		} finally {
			setIsGeneratingCert(false)
		}
	};

	const goToNextLesson = () => {
		if (nextLesson) goToLesson(nextLesson);
	};
	const goToPrevLesson = () => {
		if (prevLesson) goToLesson(prevLesson);
	};

	// Detect media type — URL-based checks take priority over type field to handle
	// cases where images are stored in videoUrl (Cloudinary /image/upload/ URLs)
	const IMAGE_EXTS = /\.(jpe?g|png|gif|webp|svg|bmp)(\?.*)?$/i;
	const VIDEO_EXTS = /\.(mp4|webm|ogg|mov|avi|mkv)(\?.*)?$/i;
	const PDF_EXT = /\.pdf(\?.*)?$/i;
	const getMediaType = (lesson: any): "video" | "file" | "image" | "none" => {
		if (!lesson) return "none";
		const type = (lesson.type || lesson.contentType || "").toUpperCase();

		// Unambiguous type declarations — FILE/PDF/IMAGE trust immediately
		if (type === "FILE" || type === "PDF" || type === "DOCUMENT") return "file";
		if (type === "IMAGE") return "image";

		// Dedicated image field set — always image
		if (lesson.imageUrl && !VIDEO_EXTS.test(lesson.imageUrl)) return "image";

		// fileUrl — check extension
		if (lesson.fileUrl) {
			if (IMAGE_EXTS.test(lesson.fileUrl)) return "image";
			if (PDF_EXT.test(lesson.fileUrl)) return "file";
			if (lesson.fileUrl.includes("/image/upload/")) return "image";
			return "file";
		}

		// videoUrl — may actually be an image (Cloudinary image stored in videoUrl)
		if (lesson.videoUrl) {
			const url = lesson.videoUrl.split("?")[0];
			if (IMAGE_EXTS.test(url)) return "image";
			if (PDF_EXT.test(url)) return "file";
			if (lesson.videoUrl.includes("/image/upload/") && !VIDEO_EXTS.test(url))
				return "image";
			if (VIDEO_EXTS.test(url) || lesson.videoUrl.includes("/video/upload/"))
				return "video";
			// Fallback: trust VIDEO type if nothing else matched
			if (type === "VIDEO") return "video";
			return "video";
		}

		// content field fallback
		if (lesson.content && lesson.content.startsWith("http")) {
			if (IMAGE_EXTS.test(lesson.content)) return "image";
			if (lesson.content.includes("/image/upload/")) return "image";
			if (VIDEO_EXTS.test(lesson.content)) return "video";
		}

		if (type === "VIDEO") return "video";
		return "none";
	};

	// Content type detection
	const mediaType = activeLesson ? getMediaType(activeLesson) : "none";
	const hasVideo = mediaType === "video" && !!videoUrl;
	const hasFile = !!activeLesson?.fileUrl && !!fileUrl;
	const hasImage =
		mediaType === "image" &&
		!!(
			getSafeUrl(activeLesson?.imageUrl) || getSafeUrl(activeLesson?.videoUrl)
		);
	const effectiveImageUrl =
		mediaType === "image"
			? getSafeUrl(activeLesson?.imageUrl) || getSafeUrl(activeLesson?.videoUrl)
			: imageUrl;
	const hasMultipleTypes =
		[hasVideo, hasFile, hasImage].filter(Boolean).length > 1;

	// Colors - Professional Educational Platform Design
	const isDark = theme === "dark";
	const bg = isDark ? "#0d0d0d" : "#ffffff";
	const sidebarBg = isDark ? "#111111" : "#f8f8fa";
	const headerBg = isDark ? "#0d0d0d" : "#ffffff";
	const textPrimary = isDark ? "#f1f5f9" : "#0d0d0d";
	const textSecondary = isDark ? "#94a3b8" : "#6b7280";
	const borderColor = isDark ? "rgba(255,255,255,0.06)" : "#e5e7eb";
	const cardBg = isDark ? "#161616" : "#ffffff";
	const purple = "#5120c8";
	const purpleHover = "#6d35e0";
	const teal = "#0d9488";
	const green = "#10b981";
	const redColor = "#ef4444";
	const blueColor = "#ffffff";
	const purpleColor = "#8b5cf6";
	const amberColor = "#f59e0b";

	if (!authChecked || isLoading) {
		return (
			<div
				className="flex min-h-screen items-center justify-center"
				style={{ background: bg }}>
				<div className="text-center">
					<div
						className="h-16 w-16 mx-auto rounded-2xl flex items-center justify-center mb-6"
						style={{ background: `${purple}15` }}>
						<GraduationCap className="h-8 w-8" style={{ color: purple }} />
					</div>
					<h3
						className="text-lg font-semibold mb-2"
						style={{ color: textPrimary }}>
						جاري تحميل المحتوى...
					</h3>
					<p
						className="text-sm max-w-xs mx-auto"
						style={{ color: textSecondary }}>
						نُعدّ تجربة تعليمية مميزة لك
					</p>
					<div className="flex justify-center gap-2 mt-6">
						{[0, 1, 2].map((i) => (
							<div
								key={i}
								className="h-2 rounded-full"
								style={{
									width: i === 1 ? "32px" : "8px",
									background: i === 1 ? purple : borderColor,
								}}
							/>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (!isEnrolled && enrollment === null) {
		return (
			<div
				className="flex min-h-screen items-center justify-center p-6"
				dir="rtl"
				style={{ background: bg }}>
				<div className="text-center max-w-lg">
					<div className="relative mx-auto mb-8">
						<div
							className="h-28 w-28 rounded-3xl flex items-center justify-center mx-auto"
							style={{
								background: `${purple}15`,
							}}>
							<Lock className="h-14 w-14" style={{ color: purple }} />
						</div>
					</div>

					<h2
						className="text-3xl font-bold mb-4"
						style={{ color: textPrimary }}>
						الكورس مقيّد
					</h2>
					<p
						className="mb-8 text-base leading-relaxed max-w-md mx-auto"
						style={{ color: textSecondary }}>
						يجب الاشتراك في هذا الكورس للوصول إلى المحتوى التعليمي المميز
					</p>

					<a
						href={`${MAIN_URL}/${locale}/checkout/${courseId}`}
						className="group inline-flex items-center gap-3 rounded-2xl px-8 py-4 font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl"
						style={{
							background: `linear-gradient(135deg, ${purple}, #5b21b6)`,
							boxShadow: `0 10px 40px ${purple}40`,
						}}>
						<ShoppingCart className="h-5 w-5 transition-transform group-hover:scale-110" />
						<span>اشترك الآن</span>
						<ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
					</a>

					{/* Trust badges */}
					<div
						className="mt-8 flex justify-center gap-6 text-xs"
						style={{ color: textSecondary }}>
						<div className="flex items-center gap-1.5">
							<ShieldCheck className="h-4 w-4" style={{ color: green }} />
							<span>دفع آمن</span>
						</div>
						<div className="flex items-center gap-1.5">
							<Clock className="h-4 w-4" style={{ color: blueColor }} />
							<span>وصول فوري</span>
						</div>
						<div className="flex items-center gap-1.5">
							<Award className="h-4 w-4" style={{ color: amberColor }} />
							<span>شهادة معتمدة</span>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div
			className="flex min-h-screen flex-col"
			dir="rtl"
			style={{ background: bg }}>
			{/* ✨ Premium Header */}
			<header
				className="shrink-0 sticky top-0 z-50 backdrop-blur-xl"
				style={{
					background: isDark
						? "rgba(13, 14, 20, 0.85)"
						: "rgba(248, 249, 252, 0.9)",
					borderBottom: `1px solid ${borderColor}`,
					boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
				}}>
				<div className="px-4 lg:px-8 py-4">
					<div className="flex items-center gap-6 max-w-screen-2xl mx-auto">
						{/* Back button */}
						<a
							href={`/${locale}/courses/${courseId}`}
							className="hidden sm:flex items-center gap-2 text-sm font-medium shrink-0 transition-all duration-200 hover:opacity-70 group px-3 py-2 rounded-xl hover:bg-black/5"
							style={{ color: textSecondary }}>
							<ArrowRight className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
							<span>العودة للكورس</span>
						</a>

						{/* Course Info & Progress */}
						<div className="flex-1 min-w-0">
							<div className="flex items-center justify-between gap-4 mb-3">
								<div className="flex items-center gap-3 min-w-0 flex-1">
									<div
										className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
										style={{
											background: `linear-gradient(135deg, ${purple}15, ${purpleColor}15)`,
										}}>
										<BookOpen
											className="h-4.5 w-4.5"
											style={{ color: purple }}
										/>
									</div>
									<h2
										className="font-semibold truncate text-sm lg:text-base"
										style={{ color: textPrimary }}>
										{course?.titleAr || course?.titleEn || course?.title}
									</h2>
								</div>

								{/* Stats */}
								<div className="flex items-center gap-4 shrink-0">
									<div
										className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg"
										style={{
											background: `${green}10`,
											border: `1px solid ${green}20`,
										}}>
										<TrendingUp className="h-4 w-4" style={{ color: green }} />
										<span
											className="text-sm font-bold"
											style={{ color: green }}>
											{progress}%
										</span>
										<span className="text-xs" style={{ color: textSecondary }}>
											مكتمل
										</span>
									</div>

									<div
										className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
										style={{
											background: `${purple}10`,
											border: `1px solid ${purple}20`,
										}}>
										<CheckCircle2
											className="h-4 w-4"
											style={{ color: purple }}
										/>
										<span
											className="text-sm font-semibold"
											style={{ color: textPrimary }}>
											{completedCount}/{totalLessons}
										</span>
									</div>
								</div>
							</div>

							{/* Progress Bar */}
							<div
								className="relative h-2 rounded-full overflow-hidden"
								style={{ background: borderColor }}>
								<div
									className="h-full rounded-full transition-all duration-700"
									style={{ width: `${progress}%`, background: purple }}
								/>
							</div>
						</div>

						{/* Actions */}
						<div className="flex items-center gap-2 shrink-0">
							<button
								className="p-2.5 rounded-xl transition-all duration-200 hover:scale-105"
								style={{
									color: textSecondary,
									background: "transparent",
									border: `1px solid transparent`,
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.background = `${purple}10`;
									e.currentTarget.style.borderColor = `${purple}20`;
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = "transparent";
									e.currentTarget.style.borderColor = "transparent";
								}}>
								<FileText className="h-5 w-5" />
							</button>
							<button
								className="p-2.5 rounded-xl transition-all duration-200 hover:scale-105"
								style={{
									color: textSecondary,
									background: "transparent",
									border: `1px solid transparent`,
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.background = `${purple}10`;
									e.currentTarget.style.borderColor = `${purple}20`;
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = "transparent";
									e.currentTarget.style.borderColor = "transparent";
								}}>
								<Settings className="h-5 w-5" />
							</button>
						</div>
					</div>
				</div>
			</header>

			{/* Responsive Body */}
			<div
				className="flex flex-1"
				style={{
					flexDirection: isMobile ? "column" : "row",
					overflow: isMobile ? "auto" : "hidden",
					height: isMobile ? "auto" : "calc(100vh - 88px)",
				}}>
				{/* ✨ Modern Sidebar */}
				<aside
					className="overflow-y-auto"
					style={{
						width: isMobile ? "100%" : "340px",
						height: isMobile ? "auto" : "100%",
						background: sidebarBg,
						borderLeft: isMobile ? "none" : `1px solid ${borderColor}`,
						borderTop: isMobile ? `1px solid ${borderColor}` : "none",
						order: isMobile ? 1 : 0,
					}}>
					{/* Sidebar Header */}
					<div
						className="px-5 py-5 sticky top-0 z-10"
						style={{
							background: sidebarBg,
							borderBottom: `1px solid ${borderColor}`,
						}}>
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center gap-2">
								<Target className="h-4 w-4" style={{ color: purple }} />
								<span
									className="text-sm font-bold tracking-wide"
									style={{ color: textPrimary }}>
									محتوى الكورس
								</span>
							</div>
							<div
								className="px-3 py-1 rounded-lg text-xs font-bold"
								style={{
									background: `linear-gradient(135deg, ${purple}, ${purpleColor})`,
									color: "white",
								}}>
								{progress}%
							</div>
						</div>

						{/* Mini Progress */}
						<div
							className="relative h-1.5 rounded-full overflow-hidden mb-3"
							style={{ background: borderColor }}>
							<div
								className="h-full rounded-full transition-all duration-500 ease-out"
								style={{
									width: `${progress}%`,
									background: `linear-gradient(90deg, ${purple}, ${purpleColor})`,
								}}
							/>
						</div>

						<p className="text-xs font-medium" style={{ color: textSecondary }}>
							<span style={{ color: purple }}>{completedCount}</span> من{" "}
							<span>{totalLessons}</span> درس مكتمل
						</p>
					</div>

					{/* Lessons List */}
					<div className="px-3 pb-4 space-y-1">
						{allLessonsFlat.map((lesson: any, idx: number) => {
							const status = getLessonStatus(lesson.id);
							const isActive = activeLessonId === lesson.id;
							const lessonMediaType = getMediaType(lesson);
							const lessonType =
								lessonMediaType === "video"
									? "فيديو"
									: lessonMediaType === "file"
										? "ملف"
										: lessonMediaType === "image"
											? "صورة"
											: "نص";

							return (
								<button
									key={lesson.id}
									onClick={() => {
										if (status !== "locked") goToLesson(lesson);
									}}
									disabled={status === "locked"}
									className={`
                    group relative w-full text-right transition-all duration-200
                    ${status === "locked" ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-[1.01]"}
                  `}
									style={{
										display: "flex",
										alignItems: "center",
										gap: "14px",
										padding: "14px 16px",
										borderRadius: "14px",
										border: "none",
										background: isActive ? `${purple}10` : "transparent",
										borderRight: isActive
											? `3px solid ${purple}`
											: "3px solid transparent",
										marginBottom: "4px",
									}}>
									{/* Status Indicator */}
									<div
										className="relative flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
										style={{
											width: "36px",
											height: "36px",
											borderRadius: "12px",
											background:
												status === "completed"
													? green
													: status === "available"
														? purple
														: borderColor,
										}}>
										{status === "completed" && (
											<CheckCircle2 size={17} color="#fff" strokeWidth={2.5} />
										)}
										{status === "available" && (
											<Play size={16} color="#fff" fill="#fff" />
										)}
										{status === "locked" && (
											<Lock size={14} color={isDark ? "#6b7280" : "#9ca3af"} />
										)}
									</div>

									{/* Lesson Content */}
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-1">
											<h3
												className="text-[13px] font-semibold truncate leading-tight"
												style={{
													color: isActive
														? purple
														: status === "locked"
															? textSecondary
															: textPrimary,
												}}>
												{lesson.title || lesson.titleAr}
											</h3>
										</div>

										<div
											className="flex items-center gap-2 text-[11px]"
											style={{ color: textSecondary }}>
											<span
												className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium"
												style={{
													background:
														lessonMediaType === "video"
															? `${redColor}10`
															: lessonMediaType === "file"
																? `${blueColor}10`
																: lessonMediaType === "image"
																	? `${purpleColor}10`
																	: `${borderColor}`,
													color:
														lessonMediaType === "video"
															? redColor
															: lessonMediaType === "file"
																? blueColor
																: lessonMediaType === "image"
																	? purpleColor
																	: textSecondary,
												}}>
												{lessonType === "فيديو" && <Video size={10} />}
												{lessonType === "ملف" && <FileText size={10} />}
												{lessonType === "صورة" && <Image size={10} />}
												{lessonType}
											</span>

											{lesson.duration && (
												<span className="flex items-center gap-1">
													<Clock size={10} />
													{lesson.duration} د
												</span>
											)}

											{lesson.isFree && (
												<span
													className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium"
													style={{
														background: `${teal}10`,
														color: teal,
													}}>
													<Gift size={10} />
													مجاني
												</span>
											)}
										</div>
									</div>

									{/* Lesson Number Badge */}
									<div
										className="flex items-center justify-center shrink-0 text-xs font-bold"
										style={{
											width: "26px",
											height: "26px",
											borderRadius: "8px",
											background: isActive ? purple : `${borderColor}`,
											color: isActive ? "#fff" : textSecondary,
										}}>
										{idx + 1}
									</div>

									{/* Active indicator glow */}
									{isActive && (
										<div
											className="absolute inset-0 rounded-[14px] pointer-events-none"
											style={{
												background: `linear-gradient(135deg, ${purple}05, transparent)`,
												boxShadow: `inset 0 0 20px ${purple}08`,
											}}
										/>
									)}
								</button>
							);
						})}
					</div>
				</aside>

				{/* Main Content Area - Video & Lesson Info */}
				<main
					className="flex-1 overflow-auto flex flex-col"
					style={{
						order: isMobile ? 0 : 1,
					}}>
					{activeLessonId && activeLesson ? (
						<>
							{/* Mobile Compact Header */}
							{isMobile && (
								<div
									style={{
										padding: "10px 12px",
										display: "flex",
										alignItems: "center",
										gap: 8,
										background: "#0d0d0d",
										borderBottom: "1px solid rgba(255,255,255,0.06)",
										flexShrink: 0,
									}}>
									<button
										onClick={() => router.back()}
										style={{
											background: "none",
											border: "none",
											color: "#94a3b8",
											cursor: "pointer",
											padding: 4,
										}}>
										<ArrowRight size={18} />
									</button>
									<div style={{ flex: 1, overflow: "hidden" }}>
										<div
											style={{
												color: "#fff",
												fontSize: 13,
												fontWeight: 600,
												overflow: "hidden",
												textOverflow: "ellipsis",
												whiteSpace: "nowrap",
											}}>
											{currentLesson?.title || course?.titleAr}
										</div>
									</div>
									<span style={{ color: "#6b7280", fontSize: 11 }}>
										{activeLessonIndex + 1}/{totalLessons}
									</span>
								</div>
							)}

							{/* Media Viewer Container */}
							<div
								className="w-full relative"
								style={{
									background: "#000",
									minHeight: isMobile ? "auto" : "450px",
									maxHeight: isMobile ? "none" : "72vh",
									aspectRatio: isMobile ? "16/9" : undefined,
								}}>
								{/* Mode Tabs - Modern Design */}
								{hasMultipleTypes && (
									<div
										className="absolute top-0 left-0 right-0 z-20 flex gap-2 p-4"
										style={{
											background:
												"linear-gradient(to bottom, rgba(0,0,0,0.95), rgba(0,0,0,0.7), transparent)",
											backdropFilter: "blur(8px)",
										}}>
										<div className="flex gap-1.5 ml-auto bg-black/30 p-1 rounded-xl backdrop-blur-sm">
											{hasVideo && (
												<button
													onClick={() => setViewerMode("video")}
													className={`
                            flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-300
                            ${
															viewerMode === "video"
																? "bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105"
																: "text-white/70 hover:text-white hover:bg-white/10"
														}
                          `}>
													<Video className="h-4 w-4" />
													<span>فيديو</span>
												</button>
											)}
											{hasFile && (
												<button
													onClick={() => setViewerMode("file")}
													className={`
                            flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-300
                            ${
															viewerMode === "file"
																? "bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105"
																: "text-white/70 hover:text-white hover:bg-white/10"
														}
                          `}>
													<FileText className="h-4 w-4" />
													<span>ملف PDF</span>
												</button>
											)}
											{hasImage && (
												<button
													onClick={() => setViewerMode("image")}
													className={`
                            flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-300
                            ${
															viewerMode === "image"
																? "bg-purple-500 text-white shadow-lg shadow-purple-500/30 scale-105"
																: "text-white/70 hover:text-white hover:bg-white/10"
														}
                          `}>
													<Image className="h-4 w-4" />
													<span>صورة</span>
												</button>
											)}
										</div>
									</div>
								)}

								{/* VIDEO PLAYER - Enhanced */}
								{(viewerMode === "video" || viewerMode === "all") &&
									hasVideo &&
									videoUrl && (
										<div className="relative">
											{/* Video Container with Aspect Ratio */}
											<div
												className="video-container relative overflow-hidden"
												style={{
													paddingTop: isMobile ? "56.25%" : "56.25%",
													background: "#000",
													borderRadius: 0,
													minHeight: isMobile ? "200px" : undefined,
												}}
												onTouchEnd={handleVideoTap}>
												<video
													ref={videoRef}
													key={currentLesson?.id || "no-lesson"}
													src={videoUrl}
													controls
													autoPlay
													className="absolute top-0 left-0 w-full h-full object-contain"
													controlsList="nodownload"
													disablePictureInPicture
													playsInline
													onContextMenu={(e) => e.preventDefault()}
													onCanPlay={() => {
														setVideoReady(true);
														setIsLoadingMedia(false);
													}}
													onWaiting={() => setIsLoadingMedia(true)}
													onLoadedData={() => {
														setVideoReady(true);
														setIsLoadingMedia(false);
													}}
													onError={() => {
														setIsLoadingMedia(false);
														setVideoReady(true);
														setVideoError("فشل تحميل الفيديو");
													}}
													onEnded={() => {
														if (!isCurrentCompleted) handleMarkComplete();
														else if (nextLesson) goToLesson(nextLesson);
													}}
													style={{
														filter: isLoadingMedia
															? "brightness(0.7)"
															: "brightness(1)",
														transition: "filter 0.3s ease",
													}}
												/>

												{/* Loading Overlay — shown until video is ready */}
												{(!videoReady || isLoadingMedia) && (
													<div
														className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
														style={{
															background: "#0a0a0a",
															backdropFilter: "blur(4px)",
														}}>
														<div className="relative flex items-center justify-center">
															<div
																style={{
																	width: 48,
																	height: 48,
																	border: "3px solid rgba(124,58,237,0.3)",
																	borderTopColor: "#7c3aed",
																	borderRadius: "50%",
																	animation: "spin 0.8s linear infinite",
																}}
															/>
														</div>
													</div>
												)}

												{/* Error State */}
												{videoError && (
													<div
														className="absolute inset-0 flex items-center justify-center z-10"
														style={{ background: "rgba(0,0,0,0.95)" }}>
														<div className="text-center p-8 max-w-sm">
															<div
																className="h-16 w-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
																style={{ background: `${redColor}20` }}>
																<Video
																	className="h-8 w-8"
																	style={{ color: redColor }}
																/>
															</div>
															<h3 className="text-white font-bold text-lg mb-2">
																خطأ في التشغيل
															</h3>
															<p className="text-white/60 text-sm mb-6">
																{videoError}
															</p>
															<button
																onClick={() => {
																	setVideoError(null);
																	videoRef.current?.load();
																}}
																className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm font-medium transition-all hover:scale-105">
																إعادة المحاولة
															</button>
														</div>
													</div>
												)}

												{/* Double-tap Seek Feedback */}
												{seekFeedback.visible && (
													<div
														className="absolute top-1/2 -translate-y-1/2 z-20 flex items-center justify-center font-bold pointer-events-none transition-all duration-150"
														style={{
															...(seekFeedback.side === "backward"
																? { left: "18%" }
																: { right: "18%" }),
															background: "rgba(0,0,0,0.8)",
															color: "#fff",
															borderRadius: "50%",
															width: "64px",
															height: "64px",
															fontSize: "13px",
															backdropFilter: "blur(8px)",
															boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
															transform: seekFeedback.visible
																? "translateY(-50%) scale(1)"
																: "translateY(-50%) scale(0.8)",
														}}>
														{seekFeedback.side === "backward" ? "-5s" : "+5s"}
													</div>
												)}
											</div>

											{/* Speed Controls - Modern - Hidden on Mobile */}
											<div
												className="hidden sm:flex items-center gap-3 px-6 py-4 flex-wrap"
												style={{
													background: isDark ? "#0d0e14" : "#f8f9fc",
													borderBottom: `1px solid ${borderColor}`,
												}}>
												<div className="flex items-center gap-2 ml-2">
													<Zap className="h-4 w-4" style={{ color: purple }} />
													<span
														className="text-xs font-semibold"
														style={{ color: textSecondary }}>
														السرعة:
													</span>
												</div>
												<div className="flex gap-1.5">
													{speeds.map((speed) => (
														<button
															key={speed}
															onClick={() => setPlaybackRate(speed)}
															className={`
                              px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200
                              ${
																playbackRate === speed
																	? "text-white shadow-lg"
																	: "hover:scale-105"
															}
                            `}
															style={{
																background:
																	playbackRate === speed
																		? purple
																		: "transparent",
																color:
																	playbackRate === speed
																		? "#fff"
																		: textSecondary,
																border: `1.5px solid ${playbackRate === speed ? "transparent" : borderColor}`,
																boxShadow:
																	playbackRate === speed
																		? `0 4px 16px ${purple}35`
																		: "none",
															}}>
															{speed}x
														</button>
													))}
												</div>
											</div>
										</div>
									)}

								{/* PDF VIEWER - Professional */}
								{(viewerMode === "file" ||
									(viewerMode === "all" && !hasVideo)) &&
									hasFile &&
									fileUrl && (
										<div
											className="h-[650px] flex flex-col"
											style={{ background: sidebarBg }}>
											{/* PDF Header */}
											<div
												className="flex items-center justify-between px-6 py-5"
												style={{
													borderBottom: `1px solid ${borderColor}`,
													background: isDark ? "#0d0e14" : "#ffffff",
												}}>
												<div className="flex items-center gap-4">
													<div
														className="h-12 w-12 rounded-2xl flex items-center justify-center"
														style={{ background: `${blueColor}12` }}>
														<FileText
															className="h-6 w-6"
															style={{ color: blueColor }}
														/>
													</div>
													<div>
														<p
															className="text-sm font-bold"
															style={{ color: textPrimary }}>
															{fileName}
														</p>
														<p
															className="text-xs mt-0.5"
															style={{ color: textSecondary }}>
															اضغط على زر التحميل لحفظ الملف
														</p>
													</div>
												</div>

												<div className="flex items-center gap-3">
													<a
														href={fileUrl}
														target="_blank"
														rel="noopener noreferrer"
														className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105"
														style={{
															background: blueColor,
															color: "white",
															boxShadow: `0 4px 20px ${blueColor}30`,
														}}>
														<Download className="h-4 w-4 group-hover:animate-bounce" />
														<span>تحميل الملف</span>
													</a>
													<a
														href={fileUrl}
														target="_blank"
														rel="noopener noreferrer"
														className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105"
														style={{
															background: "transparent",
															color: blueColor,
															border: `1.5px solid ${blueColor}25`,
														}}>
														<ExternalLink className="h-4 w-4" />
														<span>فتح</span>
													</a>
												</div>
											</div>

											{/* PDF iframe */}
											<div className="flex-1 relative">
												<iframe
													src={`https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`}
													className="w-full h-full border-0"
													title={fileName}
													style={{ background: isDark ? "#0a0a0f" : "#e5e7eb" }}
												/>
											</div>
										</div>
									)}

								{/* IMAGE VIEWER - Gallery Style */}
								{(viewerMode === "image" ||
									(viewerMode === "all" && !hasVideo && !hasFile)) &&
									hasImage &&
									effectiveImageUrl && (
										<div
											className="min-h-[550px] flex flex-col items-center justify-center relative"
											style={{ background: isDark ? "#080810" : "#0f0f23" }}>
											{/* Image Actions */}
											<div className="absolute top-5 right-5 z-10 flex gap-2.5">
												<a
													href={effectiveImageUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="p-3 rounded-xl bg-black/40 text-white hover:bg-black/60 transition-all duration-200 hover:scale-110 backdrop-blur-sm"
													title="تكبير">
													<ZoomIn className="h-5 w-5" />
												</a>
												<a
													href={effectiveImageUrl}
													download
													className="p-3 rounded-xl bg-black/40 text-white hover:bg-black/60 transition-all duration-200 hover:scale-110 backdrop-blur-sm"
													title="تحميل">
													<Download className="h-5 w-5" />
												</a>
											</div>

											{/* Image Container */}
											<div className="max-h-[650px] max-w-full p-8 flex items-center justify-center">
												<img
													src={effectiveImageUrl}
													alt={activeLesson.title || activeLesson.titleAr || ""}
													className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl"
													style={{ boxShadow: "0 25px 80px rgba(0,0,0,0.5)" }}
												/>
											</div>

											{/* Image Caption */}
											<div
												className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl text-sm text-white/90 font-medium backdrop-blur-xl"
												style={{
													background: "rgba(0,0,0,0.7)",
													boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
												}}>
												{activeLesson.title || activeLesson.titleAr}
											</div>
										</div>
									)}

								{/* Broken Local URL State */}
								{!hasVideo && !hasFile && !hasImage && hasLocalUrl && (
									<div
										className="h-[450px] flex items-center justify-center"
										style={{ background: sidebarBg }}>
										<div className="text-center max-w-md px-8">
											<div
												className="mx-auto mb-5 h-20 w-20 rounded-3xl flex items-center justify-center"
												style={{ background: `${amberColor}15` }}>
												<File
													className="h-10 w-10"
													style={{ color: amberColor }}
												/>
											</div>
											<h3
												className="text-xl font-bold mb-3"
												style={{ color: textPrimary }}>
												المحتوى قيد الترحيل
											</h3>
											<p
												className="text-sm leading-relaxed"
												style={{ color: textSecondary }}>
												هذا الملف لم يتم رفعه بعد على المنصة الجديدة. يرجى
												التواصل مع المحاضر لإعادة رفع المحتوى.
											</p>
										</div>
									</div>
								)}

								{/* No Media State */}
								{!hasVideo && !hasFile && !hasImage && !hasLocalUrl && (
									<div
										className="h-[450px] flex items-center justify-center"
										style={{ background: sidebarBg }}>
										<div className="text-center">
											<div
												className="mx-auto mb-4 h-20 w-20 rounded-3xl flex items-center justify-center"
												style={{ background: `${purple}10` }}>
												<File
													className="h-10 w-10"
													style={{ color: `${purple}40` }}
												/>
											</div>
											<p
												className="text-base font-semibold mb-2"
												style={{ color: textPrimary }}>
												لا يوجد وسائط لهذا الدرس
											</p>
											{activeLesson.description && (
												<p
													className="text-sm mt-4 max-w-lg mx-auto leading-relaxed px-6"
													style={{ color: textSecondary }}>
													{activeLesson.description}
												</p>
											)}
										</div>
									</div>
								)}
							</div>

							{/* Mobile Navigation Controls */}
							{isMobile && (
								<div
									style={{
										padding: "12px 16px",
										background: "#111111",
										borderTop: "1px solid rgba(255,255,255,0.06)",
										display: "flex",
										alignItems: "center",
										gap: 12,
									}}>
									<button
										onClick={() => prevLesson && goToLesson(prevLesson)}
										disabled={!prevLesson}
										style={{
											flex: 1,
											padding: "10px 16px",
											borderRadius: 10,
											border: "none",
											cursor: prevLesson ? "pointer" : "not-allowed",
											background: prevLesson
												? "rgba(255,255,255,0.08)"
												: "rgba(255,255,255,0.03)",
											color: prevLesson ? "#f1f5f9" : "#374151",
											fontSize: 13,
											fontWeight: 600,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											gap: 6,
										}}>
										<ChevronRight size={16} />
										السابق
									</button>

									<button
										onClick={() => nextLesson && goToLesson(nextLesson)}
										disabled={!nextLesson}
										style={{
											flex: 1,
											padding: "10px 16px",
											borderRadius: 10,
											border: "none",
											cursor: nextLesson ? "pointer" : "not-allowed",
											background: nextLesson
												? "#5120c8"
												: "rgba(255,255,255,0.03)",
											color: nextLesson ? "#fff" : "#374151",
											fontSize: 13,
											fontWeight: 600,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											gap: 6,
											boxShadow: nextLesson
												? "0 2px 8px rgba(81,32,200,0.3)"
												: "none",
										}}>
										التالي
										<ChevronLeft size={16} />
									</button>
								</div>
							)}

							{/* Lesson Information Section */}
							<div
								className="flex-1 p-6 lg:p-8"
								style={{
									borderTop: `1px solid ${borderColor}`,
									background: bg,
								}}>
								{/* Lesson Title & Status */}
								<div className="flex items-start justify-between gap-6 mb-6">
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-3 mb-3">
											<div
												className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
												style={{
													background:
														mediaType === "video"
															? `${redColor}12`
															: mediaType === "file"
																? `${blueColor}12`
																: mediaType === "image"
																	? `${purpleColor}12`
																	: `${purple}12`,
												}}>
												{mediaType === "video" ? (
													<Video
														className="h-5 w-5"
														style={{ color: redColor }}
													/>
												) : mediaType === "file" ? (
													<FileText
														className="h-5 w-5"
														style={{ color: blueColor }}
													/>
												) : mediaType === "image" ? (
													<Image
														className="h-5 w-5"
														style={{ color: purpleColor }}
													/>
												) : (
													<File className="h-5 w-5" style={{ color: purple }} />
												)}
											</div>
											<h1
												className="text-2xl lg:text-3xl font-bold leading-tight"
												style={{ color: textPrimary }}>
												{activeLesson.title || activeLesson.titleAr}
											</h1>
										</div>

										{/* Meta Information */}
										<div
											className="flex items-center gap-4 flex-wrap text-sm"
											style={{ color: textSecondary }}>
											{activeLesson.duration && (
												<span
													className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg"
													style={{ background: `${borderColor}` }}>
													<Clock className="h-4 w-4" />
													<span className="font-medium">
														{activeLesson.duration}
													</span>
												</span>
											)}

											<span
												className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg"
												style={{ background: `${borderColor}` }}>
												<BookOpen className="h-4 w-4" />
												<span className="font-medium">
													الدرس{" "}
													{activeLessonIndex >= 0 ? activeLessonIndex + 1 : 1}{" "}
													من {totalLessons}
												</span>
											</span>

											{hasVideo && (
												<span
													className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium"
													style={{
														background: `${redColor}10`,
														color: redColor,
													}}>
													<Video className="h-4 w-4" />
													فيديو
												</span>
											)}

											{hasFile && (
												<span
													className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium"
													style={{
														background: `${blueColor}10`,
														color: blueColor,
													}}>
													<FileText className="h-4 w-4" />
													ملف PDF
												</span>
											)}

											{hasImage && (
												<span
													className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium"
													style={{
														background: `${purpleColor}10`,
														color: purpleColor,
													}}>
													<Image className="h-4 w-4" />
													صورة
												</span>
											)}

											{isCurrentCompleted && (
												<span
													className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium"
													style={{ background: `${green}10`, color: green }}>
													<CheckCircle2 className="h-4 w-4" />
													تم الإكمال
												</span>
											)}
										</div>
									</div>

									{/* Complete Button / Status Badge */}
									{isCurrentCompleted ? (
										<div
											className="flex items-center gap-3 px-6 py-3.5 rounded-2xl text-sm font-bold shrink-0"
											style={{
												background: `${green}10`,
												color: green,
												border: `1.5px solid ${green}25`,
												boxShadow: `0 4px 20px ${green}15`,
											}}>
											<Award className="h-5 w-5" />
											<span>مكتمل</span>
											<CheckCircle2 className="h-5 w-5" />
										</div>
									) : (
										<button
											onClick={handleMarkComplete}
											disabled={markingComplete}
											className="
                        group flex items-center gap-3 px-7 py-3.5 rounded-2xl text-sm font-bold text-white 
                        shrink-0 transition-all duration-300 
                        hover:scale-105 active:scale-95 
                        disabled:opacity-60 disabled:hover:scale-100
                      "
											style={{
												background: `linear-gradient(135deg, ${purple}, #5b21b6)`,
												boxShadow: `0 6px 24px ${purple}40`,
											}}>
											{markingComplete ? (
												<>
													<Loader2 className="h-5 w-5 animate-spin" />
													<span>جاري...</span>
												</>
											) : (
												<>
													<CheckCheck className="h-5 w-5 group-hover:scale-110 transition-transform" />
													<span>تمييز كمكتمل</span>
												</>
											)}
										</button>
									)}
								</div>

								{/* Description Card */}
								{activeLesson.description && (
									<div
										className="mb-6 p-5 rounded-2xl text-sm leading-relaxed"
										style={{
											background: cardBg,
											color: textSecondary,
											border: `1px solid ${borderColor}`,
											boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
										}}>
										<div className="flex items-start gap-3">
											<FileText
												className="h-5 w-5 shrink-0 mt-0.5"
												style={{ color: purple }}
											/>
											<p className="flex-1">{activeLesson.description}</p>
										</div>
									</div>
								)}

								{/* Download Materials Section */}
								{hasFile && fileUrl && (
									<div
										className="mb-6 p-5 rounded-2xl"
										style={{
											background: `${blueColor}06`,
											border: `1.5px solid ${blueColor}15`,
										}}>
										<h3
											className="text-base font-bold mb-4 flex items-center gap-2"
											style={{ color: blueColor }}>
											<Download className="h-5 w-5" />
											تحميل المواد الدراسية
										</h3>
										<div className="flex flex-wrap gap-3">
											<a
												href={fileUrl}
												download={fileName}
												className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105"
												style={{
													background: blueColor,
													color: "white",
													boxShadow: `0 4px 16px ${blueColor}25`,
												}}>
												<FileDown className="h-4 w-4 group-hover:animate-bounce" />
												<span>تحميل {fileName}</span>
											</a>
											<a
												href={fileUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105"
												style={{
													background: "transparent",
													color: blueColor,
													border: `1.5px solid ${blueColor}25`,
												}}>
												<Eye className="h-4 w-4" />
												<span>عرض</span>
											</a>
										</div>
									</div>
								)}

								{/* Navigation Buttons */}
								<div
									className="flex gap-4 mt-8 pt-8"
									style={{ borderTop: `1px solid ${borderColor}` }}>
									{nextLesson && (isEnrolled || nextLesson.isFree) && (
										<button
											onClick={goToNextLesson}
											className="
                        group flex-1 sm:flex-none flex items-center justify-center gap-3 px-7 py-4 
                        rounded-2xl text-sm font-bold text-white transition-all duration-300 
                        hover:scale-105 active:scale-95
                      "
											style={{
												background: `linear-gradient(135deg, ${purple}, #5b21b6)`,
												boxShadow: `0 6px 24px ${purple}35`,
											}}>
											<SkipForward className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
											<div className="text-right">
												<div className="text-xs opacity-80 font-normal">
													التالي →
												</div>
												<div className="text-sm font-bold">
													{nextLesson.title || nextLesson.titleAr}
												</div>
											</div>
											<ArrowLeft className="h-5 w-5" />
										</button>
									)}

									{prevLesson && (
										<button
											onClick={goToPrevLesson}
											className="
                        group flex-1 sm:flex-none flex items-center justify-center gap-3 px-7 py-4 
                        rounded-2xl text-sm font-bold transition-all duration-300 
                        hover:scale-105 active:scale-95
                      "
											style={{
												background: cardBg,
												color: textPrimary,
												border: `1.5px solid ${borderColor}`,
												boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
											}}>
											<ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
											<div className="text-right">
												<div className="text-xs opacity-60 font-normal">
													← السابق
												</div>
												<div className="text-sm">
													{prevLesson.title || prevLesson.titleAr}
												</div>
											</div>
											<SkipBack className="h-5 w-5" />
										</button>
									)}
								</div>

								{/* Interaction Buttons */}
								<div
									className="mt-8 pt-8 flex items-center gap-3 flex-wrap"
									style={{ borderTop: `1px solid ${borderColor}` }}>
									<button
										className="
                      group inline-flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-medium 
                      transition-all duration-200 hover:scale-105
                    "
										style={{
											color: textSecondary,
											background: "transparent",
											border: `1.5px solid ${borderColor}`,
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.background = `${green}08`;
											e.currentTarget.style.color = green;
											e.currentTarget.style.borderColor = `${green}25`;
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.background = "transparent";
											e.currentTarget.style.color = textSecondary;
											e.currentTarget.style.borderColor = borderColor;
										}}>
										<ThumbsUp className="h-4 w-4 group-hover:scale-110 transition-transform" />
										<span>مفيد</span>
									</button>

									<button
										className="
                      group inline-flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-medium 
                      transition-all duration-200 hover:scale-105
                    "
										style={{
											color: textSecondary,
											background: "transparent",
											border: `1.5px solid ${borderColor}`,
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.background = `${blueColor}08`;
											e.currentTarget.style.color = blueColor;
											e.currentTarget.style.borderColor = `${blueColor}25`;
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.background = "transparent";
											e.currentTarget.style.color = textSecondary;
											e.currentTarget.style.borderColor = borderColor;
										}}>
										<MessageSquare className="h-4 w-4 group-hover:scale-110 transition-transform" />
										<span>اسأل سؤال</span>
									</button>

									<button
										className="
                      group inline-flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-medium 
                      transition-all duration-200 hover:scale-105
                    "
										style={{
											color: textSecondary,
											background: "transparent",
											border: `1.5px solid ${borderColor}`,
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.background = `${purple}08`;
											e.currentTarget.style.color = purple;
											e.currentTarget.style.borderColor = `${purple}25`;
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.background = "transparent";
											e.currentTarget.style.color = textSecondary;
											e.currentTarget.style.borderColor = borderColor;
										}}>
										<Share2 className="h-4 w-4 group-hover:rotate-12 transition-transform" />
										<span>مشاركة</span>
									</button>
								</div>

								{/* Course Completion Certificate CTA */}
								{showCertButton && (
									<div
										style={{ position: "sticky", bottom: 24, marginTop: 32 }}>
										<button
											onClick={handleGetCertificate}
											className="
                        w-full flex items-center justify-center gap-4 px-8 py-5 rounded-2xl
                        text-white font-bold text-lg cursor-pointer
                        transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
                      "
											style={{
												background: "linear-gradient(135deg, #10b981, #059669)",
												boxShadow: "0 10px 40px rgba(16,185,129,0.35)",
											}}>
											<Award size={26} className="animate-pulse" />
											<div className="text-right">
												<div className="text-base">
													تهانينا! أكملت الكورس بنجاح
												</div>
												<div className="text-sm opacity-90 font-normal">
													احصل على شهادتك الآن
												</div>
											</div>
											<ChevronLeft size={20} />
										</button>
									</div>
								)}
							</div>
						</>
					) : (
						/* Empty State */
						<div className="flex h-full min-h-[70vh] items-center justify-center text-center p-8">
							<div className="max-w-md">
								<div
									className="mx-auto mb-8 h-28 w-28 rounded-3xl flex items-center justify-center relative"
									style={{
										background: `linear-gradient(135deg, ${purple}12, ${purpleColor}08)`,
									}}>
									<PlayCircle
										className="h-14 w-14"
										style={{ color: `${purple}60` }}
									/>
									<div
										className="absolute inset-0 rounded-3xl animate-pulse opacity-30"
										style={{
											background: `linear-gradient(135deg, ${purple}20, transparent)`,
										}}
									/>
								</div>

								<h2
									className="text-2xl lg:text-3xl font-bold mb-4"
									style={{ color: textPrimary }}>
									اختر درساً للبدء
								</h2>
								<p
									className="text-base mb-8 leading-relaxed"
									style={{ color: textSecondary }}>
									اختر أي درس من القائمة الجانبية لبدء رحلتك التعليمية
								</p>

								<button
									onClick={() => {
										const first = allLessonsFlat[0];
										if (first) goToLesson(first);
									}}
									className="
                    group inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-bold 
                    text-base transition-all duration-300 hover:scale-105
                  "
									style={{
										background: `linear-gradient(135deg, ${purple}, #5b21b6)`,
										boxShadow: `0 8px 32px ${purple}40`,
									}}>
									<Play className="h-5 w-5 group-hover:scale-110 transition-transform" />
									<span>ابدأ من أول درس</span>
									<ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
								</button>
							</div>
						</div>
					)}
				</main>
			</div>

			{/* Floating AI Assistant Button */}
			<a
				href={`/${locale}/learn/${courseId}/ai`}
				style={{
					position: "fixed",
					bottom: 24,
					left: 24,
					width: 48,
					height: 48,
					borderRadius: 14,
					background: "#5120c8",
					border: "none",
					cursor: "pointer",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					boxShadow: "0 4px 16px rgba(81,32,200,0.3)",
					transition: "all 0.2s ease",
					zIndex: 50,
					textDecoration: "none",
				}}
				onMouseEnter={(e) => (e.currentTarget.style.background = "#6d35e0")}
				onMouseLeave={(e) => (e.currentTarget.style.background = "#5120c8")}
				title="المساعد الذكي">
				<Sparkles size={20} color="#fff" />
			</a>

			{/* Video Protection Component */}
			<VideoProtection userName={undefined} userEmail={undefined} />

			{/* Mobile Bottom Navigation Bar - Hidden (using inline controls instead) */}
			{/* 
      <div 
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-4 py-4 flex items-center justify-between backdrop-blur-xl"
        style={{ 
          background: isDark ? 'rgba(13, 14, 20, 0.92)' : 'rgba(248, 249, 252, 0.92)',
          borderTop: `1px solid ${borderColor}`,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)'
        }}
      >
        <button 
          onClick={goToPrevLesson}
          disabled={!prevLesson}
          className="p-3 rounded-xl transition-all duration-200 hover:scale-110 disabled:opacity-30 disabled:hover:scale-100"
          style={{ 
            background: prevLesson ? `${purple}10` : 'transparent',
            color: prevLesson ? purple : textSecondary
          }}
        >
          <ArrowRight className="h-5 w-5" />
        </button>
        
        <div className="flex-1 mx-5">
          <div className="relative h-2 rounded-full overflow-hidden" style={{ background: borderColor }}>
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${progress}%`, 
                background: purple
              }}
            />
          </div>
        </div>
        
        <button 
          onClick={goToNextLesson}
          disabled={!nextLesson}
          className="p-3 rounded-xl transition-all duration-200 hover:scale-110 disabled:opacity-30 disabled:hover:scale-100"
          style={{ 
            background: nextLesson ? `${purple}10` : 'transparent',
            color: nextLesson ? purple : textSecondary
          }}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>
      */}

			{/* Global Styles */}
			<style jsx global>{`
				@keyframes spin {
					to {
						transform: rotate(360deg);
					}
				}

				/* Smooth scrolling */
				* {
					scroll-behavior: smooth;
				}

				/* Custom scrollbar for sidebar */
				aside::-webkit-scrollbar {
					width: 6px;
				}

				aside::-webkit-scrollbar-track {
					background: transparent;
				}

				aside::-webkit-scrollbar-thumb {
					background: ${borderColor};
					border-radius: 10px;
				}

				aside::-webkit-scrollbar-thumb:hover {
					background: ${purple}40;
				}
			`}</style>
		</div>
	);
}

// ShieldCheck icon component (if not imported)
function ShieldCheck({
	className,
	style,
}: {
	className?: string;
	style?: React.CSSProperties;
}) {
	return (
		<svg
			className={className}
			style={style}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round">
			<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
			<path d="m9 12 2 2 4-4" />
		</svg>
	);
}

export default function LearnPage() {
	return (
		<>
			<Toaster />
			<Suspense
				fallback={
					<div
						className="flex min-h-screen items-center justify-center"
						style={{ background: "#fafbfc" }}>
						<div className="text-center">
							<div
								className="h-16 w-16 mx-auto rounded-2xl flex items-center justify-center mb-6"
								style={{ background: "#7c3aed15" }}>
								<GraduationCap className="h-8 w-8" style={{ color: "#7c3aed" }} />
							</div>
							<p className="text-sm font-medium" style={{ color: "#4b5563" }}>
								جاري تحميل صفحة التعلم...
							</p>
						</div>
					</div>
				}>
				<LearnPageInner />
			</Suspense>
		</>
	);
}
