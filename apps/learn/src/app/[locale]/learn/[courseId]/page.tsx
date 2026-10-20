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
import { useLocale, useTranslations } from "next-intl";
import { ErrorBoundary } from "../../../../components/ErrorBoundary";
import { get, post } from "../../../../lib/api";
import { syncAuthUser } from "../../../../lib/auth-sync";
import { webLoginUrl } from "../../../../lib/constants";
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
	Volume2,
	VolumeX,
	Pause,
	SkipForward,
	SkipBack,
	GraduationCap,
	Target,
	Star,
	BarChart3,
} from "lucide-react";
import VideoProtection from "../../../../components/VideoProtection";
import QuizEntryCard from "../../../../components/quizzes/QuizEntryCard";
import NotEnrolledPage from "../../../../components/course/NotEnrolledPage";
import { useAuthStore } from "../../../../stores/authStore";

// Small inline meta row item used by the course info card and lesson details.
function MetaItem({
	icon: Icon,
	label,
	color,
}: {
	icon: any;
	label: any;
	color?: string;
}) {
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: 5,
				color: "var(--muted)",
			}}>
			<Icon size={14} style={{ color: color || "var(--muted)" }} />
			<span>{label}</span>
		</div>
	);
}

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

	const t = useTranslations('learn')
	const isAr = locale === 'ar'

	// Authenticated user (existing store, hydrated app-wide) — used for the
	// dynamic per-user video watermark.
	const authUser = useAuthStore((s: any) => s.user);

	// Email resolution for the watermark: auth store → persisted user
	// (deveway_user) → JWT payload → /auth/me. Guarantees the email is
	// available even before the store hydrates (e.g. cross-domain login).
	const [fetchedEmail, setFetchedEmail] = useState<string | null>(null);
	useEffect(() => {
		if (authUser?.email || fetchedEmail) return;
		let cancelled = false;
		let resolved: string | null = null;

		try {
			let raw = localStorage.getItem("deveway_user");
			if (!raw) {
				const m = document.cookie.match(/deveway_user=([^;]+)/);
				if (m) raw = decodeURIComponent(m[1]);
			}
			if (raw) {
				const parsed = JSON.parse(raw);
				if (parsed?.email) resolved = parsed.email;
			}
		} catch {}

		if (!resolved) {
			try {
				const token = getAuthToken();
				if (token && token.split(".").length === 3) {
					let b = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
					while (b.length % 4) b += "=";
					const payload = JSON.parse(atob(b));
					if (payload?.email) resolved = payload.email;
				}
			} catch {}
		}

		if (resolved) {
			setFetchedEmail(resolved);
			return;
		}

		syncAuthUser()
			.then((user) => {
				if (!cancelled && user?.email) setFetchedEmail(user.email);
			})
			.catch(() => {});

		return () => {
			cancelled = true;
		};
	}, [authUser?.email, fetchedEmail]);

	const userEmail = authUser?.email || fetchedEmail || undefined;

	// Native video ref
	const videoRef = useRef<HTMLVideoElement>(null);
	const lastTapRef = useRef<{ time: number; x: number } | null>(null);

	const [localCompleted, setLocalCompleted] = useState<Set<string>>(new Set());
	const [videoReady, setVideoReady] = useState(false);
	const [authChecked, setAuthChecked] = useState(false);
	const [openSections, setOpenSections] = useState<Set<string>>(new Set());
	const [markingComplete, setMarkingComplete] = useState(false);
	const [isCourseComplete, setIsCourseComplete] = useState(false);
	const [theme, setTheme] = useState<"light" | "dark">("light");

	// Media states
	const [isLoadingMedia, setIsLoadingMedia] = useState(true);
	const [videoError, setVideoError] = useState<string | null>(null);
	const [playbackRate, setPlaybackRate] = useState(1);
	const [seekFeedback, setSeekFeedback] = useState<{
		side: "forward" | "backward";
		visible: boolean;
	}>({ side: "forward", visible: false });
	const speeds = [0.75, 1, 1.25, 1.5, 2];
	const [activeTab, setActiveTab] = useState<'video' | 'file' | 'image'>('video');
	// PDF gating: the embedded viewer is cross-origin, so page position cannot be
	// observed. The student explicitly confirms reaching the last page instead.
	const [pdfReachedEnd, setPdfReachedEnd] = useState(false);
	// Tracks, per lesson id, whether the student has watched that lesson's video
	// to (near) the end. Persisted so the quiz gate survives reloads.
	const [videoWatched, setVideoWatched] = useState<Record<string, boolean>>(() => {
		try {
			return JSON.parse(localStorage.getItem("dw_video_watched") || "{}");
		} catch {
			return {};
		}
	});

	const markVideoWatched = (lessonId: string) => {
		setVideoWatched((prev) => {
			if (prev[lessonId]) return prev;
			const next = { ...prev, [lessonId]: true };
			try {
				localStorage.setItem("dw_video_watched", JSON.stringify(next));
			} catch {}
			return next;
		});
	};

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
			window.location.href = webLoginUrl(locale, window.location.pathname);
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

	const {
		data: enrollment,
		isLoading: enrollmentLoading,
		refetch: refetchEnrollment,
	} = useQuery({
		queryKey: ["learn-enrollment", courseId],
		enabled: !!courseId && authChecked,
		queryFn: async () => {
			try {
				const res = await get(`/courses/${courseId}/enrollment`);
				const payload = (res?.data as any)?.data;
				// Backend returns { enrollment: <object|null> }. Do NOT fall back to
				// the wrapper object — `{ enrollment: null }` is truthy and would
				// wrongly mark a non-enrolled student as enrolled.
				const e = payload?.enrollment ?? null;
				return e && typeof e === "object" ? e : null;
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

	// Quiz attached to the active lesson. Shares its react-query cache key with
	// QuizEntryCard so no extra network request is made.
	const { data: activeQuiz } = useQuery({
		queryKey: ["lesson-quiz-active", activeLessonId],
		queryFn: async () => {
			if (!activeLessonId) return null;
			const res = await get(`/quizzes/lesson/${activeLessonId}/active`);
			return (res?.data as any)?.data ?? null;
		},
		enabled: !!activeLessonId,
		staleTime: 0,
		refetchOnMount: "always",
		refetchOnWindowFocus: true,
	});
	const hasQuiz = !!activeQuiz;
	const quizPassed = activeQuiz?.bestAttempt?.passed === true;
	const requiresQuiz = hasQuiz && !quizPassed;
	const quizHref = activeQuiz?.id
		? `/${locale}/learn/${courseId}/quiz/${activeQuiz.id}`
		: null;

	// The quiz may only be started once the lesson's video has been watched to
	// (near) the end. Lessons without a video are never locked.
	const canStartQuiz =
		!activeLesson?.videoUrl || !!videoWatched[activeLesson?.id ?? ""];

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

	// The "next" affordance is blocked while the active lesson's quiz is pending.
	const canGoNext = !!nextLesson && !requiresQuiz;

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
		if (!url || typeof url !== 'string') return "";
		
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
		(typeof activeLesson?.videoUrl === 'string' && !activeLesson.videoUrl.startsWith("http")) ||
		(typeof activeLesson?.fileUrl === 'string' && !activeLesson.fileUrl.startsWith("http"));

	const videoUrl: string | undefined =
		getSafeUrl(activeLesson?.videoUrl) || undefined;
	const fileUrl: string | undefined =
		getSafeUrl(activeLesson?.fileUrl) || undefined;
	const imageUrl: string | undefined =
		getSafeUrl(activeLesson?.imageUrl) || undefined;
	const fileName: string = activeLesson?.fileName || "document.pdf";

	// Cloudinary raw resources always carry `Content-Disposition: attachment`
	// (even with `fl_inline`), so browsers can neither embed them in an iframe
	// nor open them inline — they auto-download instead. Route the PDF through
	// the Google Docs Viewer, which fetches the file server-side and serves a
	// renderable, embeddable document.
	const googleViewerUrl: string | undefined = fileUrl
		? `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`
		: undefined;

	const googleViewerTabUrl: string | undefined = fileUrl
		? `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}`
		: undefined;

	// Cloudinary raw uploads are public but extension-less, and the
	// `fl_attachment:<name>.pdf` transformation is rejected with HTTP 400 (the
	// ".pdf" is parsed as a format extension). Fetch the plain URL and save the
	// blob under the original fileName instead.
	const handleDownload = async (url: string | undefined, name: string) => {
		if (!url) return;
		try {
			const response = await fetch(url);
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const blob = await response.blob();
			const blobUrl = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = blobUrl;
			a.download = name || 'file';
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(blobUrl);
		} catch {
			window.open(url, '_blank');
		}
	};

	const isCurrentLive =
		activeLesson?.type === 'LIVE' ||
		activeLesson?.lessonType === 'LIVE' ||
		activeLesson?.isLive === true;

	const isCurrentCompleted = activeLessonId
		? completedLessons.has(activeLessonId)
		: false;
	const completedCount = completedLessons.size;
	const totalLessons = allLessonsFlat.length;
	const progress =
		totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
	const MAIN_URL = process.env.NEXT_PUBLIC_MAIN_URL || "";

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
		setIsLoadingMedia(true);
		setVideoError(null);
		setPdfReachedEnd(false);
	}, [activeLessonId]);

	// Default the active tab when the lesson changes. This runs once per lesson
	// (guarded by a ref) so it cannot override the user's tab choice on a mixed
	// lesson — previously it re-asserted 'video' and the image tab snapped back.
	const tabLessonRef = useRef<string | null>(null);
	useEffect(() => {
		if (!activeLesson) return;
		if (tabLessonRef.current === activeLessonId) return;
		tabLessonRef.current = activeLessonId;
		if (activeLesson.videoUrl) setActiveTab('video');
		else if (activeLesson.fileUrl) setActiveTab('file');
		else if (activeLesson.imageUrl) setActiveTab('image');
	}, [activeLessonId, activeLesson]);

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

	// Real-time socket connection for live lesson events
	useEffect(() => {
		if (!courseId || !authChecked) return;

		let socket: any = null

		const connectSocket = async () => {
			try {
				const { io } = await import('socket.io-client')
				socket = io('https://deve-way.onrender.com/live', {
					transports: ['websocket', 'polling'],
					reconnection: true,
					reconnectionAttempts: 5,
					reconnectionDelay: 1000,
				})

				socket.on('connect', () => {
					socket.emit('join-room', { courseId, userName: '', role: 'viewer' })
				})

				socket.on('stream-started', (data: any) => {
					qc.invalidateQueries({ queryKey: ['learn-course', courseId] })
				})

				socket.on('live-started', (data: any) => {
					qc.invalidateQueries({ queryKey: ['learn-course', courseId] })
				})

				socket.on('liveStarted', (data: any) => {
					qc.invalidateQueries({ queryKey: ['learn-course', courseId] })
				})

				socket.on('lesson-live', (data: any) => {
					qc.invalidateQueries({ queryKey: ['learn-course', courseId] })
				})

				socket.on('stream-ended', (data: any) => {
					qc.invalidateQueries({ queryKey: ['learn-course', courseId] })
				})

				socket.on('disconnect', () => {
				})
			} catch (e) {
				console.error('[LearnSocket] Socket error:', e)
			}
		}

		connectSocket()

		return () => {
			if (socket) {
				socket.emit('leave-room', { courseId })
				socket.disconnect()
			}
		}
	}, [courseId, authChecked, qc])

	// Polling fallback for live lesson status updates
	useEffect(() => {
		if (!activeLessonId || !courseId || !authChecked) return;
		const active = allLessonsFlat.find((l: any) => l.id === activeLessonId);
		const isLiveType = active?.type === 'LIVE' || active?.lessonType === 'LIVE' || active?.isLive;
		if (!isLiveType || active?.liveStatus === 'LIVE') return;

		const interval = setInterval(() => {
			qc.invalidateQueries({ queryKey: ["learn-course", courseId] });
		}, 8000);

		return () => clearInterval(interval);
	}, [activeLessonId, courseId, allLessonsFlat, authChecked, qc]);

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
		// A lesson that carries an unattempted/unpassed quiz must not be completed
		// (or advance) until the quiz is passed — doing so would unlock the next
		// lesson and bypass the quiz gate.
		if (requiresQuiz && quizHref) {
			toast.error(
				isAr
					? 'يجب اجتياز اختبار الدرس أولاً'
					: 'You must pass the lesson quiz first',
			);
			router.push(quizHref);
			return;
		}
		const token = getAuthToken()
		if (!token) {
			toast.error(isAr ? 'يجب تسجيل الدخول اولا' : 'Authentication required')
			window.location.href = webLoginUrl(locale, window.location.pathname)
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

			if (!res.ok) {
				const msg = payload?.message || (isAr ? 'فشل تسجيل اتمام الدرس' : 'Failed to complete lesson');
				toast.error(msg);
				setMarkingComplete(false);
				return;
			}

			const progress: number = payload?.data?.progress ?? 0;
			const quizzesPassed: boolean = payload?.data?.quizzesPassed ?? true;
			const isCourseComplete: boolean = payload?.data?.isCourseComplete ?? progress >= 100;

			// Update local completed lessons state
			// (already done above via setLocalCompleted)

			if (isCourseComplete && !quizzesPassed) {
				toast.success(
					isAr
						? 'أكملت جميع الدروس. اجتز الاختبارات المتبقية للحصول على الشهادة'
						: 'All lessons completed. Pass the remaining quizzes to get your certificate',
				);
			} else if (isCourseComplete) {
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

						if (certPayload?.success || certPayload?.data?.id) {
							toast.success(
								isAr ? 'تم اصدار شهادتك بنجاح' : 'Certificate issued successfully',
							);
						}
					} catch (certErr: any) {
						// Non-fatal: certificate auto-trigger failure shouldn't block progress.
						console.error('[Certificate] Auto-trigger failed (non-fatal):', certErr.message);
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

	const goToNextLesson = () => {
		if (!canGoNext) {
			if (requiresQuiz && quizHref) {
				toast.error(
					isAr
						? 'يجب اجتياز اختبار الدرس أولاً'
						: 'You must pass the lesson quiz first',
				);
				router.push(quizHref);
			}
			return;
		}
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
		if (typeof lesson.fileUrl === 'string') {
			if (IMAGE_EXTS.test(lesson.fileUrl)) return "image";
			if (PDF_EXT.test(lesson.fileUrl)) return "file";
			if (lesson.fileUrl.includes("/image/upload/")) return "image";
			return "file";
		}

		// videoUrl — may actually be an image (Cloudinary image stored in videoUrl)
		if (typeof lesson.videoUrl === 'string') {
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
		if (typeof lesson.content === 'string' && lesson.content.startsWith("http")) {
			if (IMAGE_EXTS.test(lesson.content)) return "image";
			if (lesson.content.includes("/image/upload/")) return "image";
			if (VIDEO_EXTS.test(lesson.content)) return "video";
		}

		if (type === "VIDEO") return "video";
		return "none";
	};

	const getLessonTypeBadge = (lesson: any) => {
		const type = lesson?.type || lesson?.lessonType || 'VIDEO';
		const isLiveLesson = type === 'LIVE' || lesson?.isLive === true;

		if (isLiveLesson) {
			const isActive = lesson?.liveStatus === 'LIVE';
			const scheduled = lesson?.liveStartTime
				? new Date(lesson.liveStartTime).toLocaleString(
						isAr ? 'ar-SA' : 'en-US',
						{ month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
					)
				: null;

			return (
				<span
					style={{
						display: 'inline-flex', alignItems: 'center', gap: '4px',
						padding: '2px 7px', borderRadius: '10px',
						background: isActive ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)',
						border: `1px solid ${isActive ? 'rgba(239,68,68,0.4)' : 'rgba(239,68,68,0.2)'}`,
						color: '#f87171', fontSize: '0.68rem', fontWeight: 500, fontFamily: 'var(--font-medium)',
						whiteSpace: 'nowrap',
					}}>
					<span
						style={{
							width: '5px', height: '5px', borderRadius: '50%',
							background: '#ef4444',
							animation: isActive ? 'pulse 1s infinite' : 'none',
						}}
					/>
					{isActive
						? (isAr ? t('liveNowLabel') : 'Live Now')
						: scheduled || (isAr ? t('liveLabel') : 'Live')}
				</span>
			);
		}

		const hasVideo = lesson?.videoUrl || type === 'VIDEO';
		const hasPdf = lesson?.fileUrl || type === 'PDF';
		const hasImage = lesson?.imageUrl || type === 'IMAGE';

		if (hasPdf) {
			return (
				<span
					style={{
						padding: '2px 7px', borderRadius: '10px', fontSize: '0.68rem',
						background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)',
						color: '#fbbf24', fontWeight: 500, fontFamily: 'var(--font-medium)',
					}}>
					{isAr ? 'ملف' : 'PDF'}
				</span>
			);
		}

		if (hasImage) {
			return (
				<span
					style={{
						padding: '2px 7px', borderRadius: '10px', fontSize: '0.68rem',
						background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
						color: '#4ade80', fontWeight: 500, fontFamily: 'var(--font-medium)',
					}}>
					{isAr ? 'صورة' : 'Image'}
				</span>
			);
		}

		return (
			<span
				style={{
					padding: '2px 7px', borderRadius: '10px', fontSize: '0.68rem',
					background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
					color: '#9999aa', fontWeight: 500, fontFamily: 'var(--font-medium)',
				}}>
				{isAr ? 'فيديو' : 'Video'}
			</span>
		);
	};

	// Content type detection
	const mediaType = activeLesson ? getMediaType(activeLesson) : "none";
	const hasVideo = mediaType === "video" && !!videoUrl;
	const hasFile = !!activeLesson?.fileUrl && !!fileUrl;
	const tabCount = [!!videoUrl, !!fileUrl, !!(activeLesson?.imageUrl)].filter(Boolean).length;
	const hasImage =
		mediaType === "image" &&
		!!(
			getSafeUrl(activeLesson?.imageUrl) || getSafeUrl(activeLesson?.videoUrl)
		) ||
		!!(
			!hasVideo && !hasFile &&
			getSafeUrl(activeLesson?.imageUrl)
		);
	// Mixed lessons carry video + file + image at once: mediaType resolves to
	// "video" (video wins), which used to blank out effectiveImageUrl and leave
	// the "الصورة" tab empty. Always prefer the dedicated imageUrl field and
	// only fall back to the image-as-video case for pure image lessons.
	const effectiveImageUrl =
		getSafeUrl(activeLesson?.imageUrl) ||
		(mediaType === "image" ? getSafeUrl(activeLesson?.videoUrl) : "");

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
						className="text-lg font-medium mb-2"
						style={{ color: textPrimary }}>
						{t('loading')}
					</h3>
					<p
						className="text-sm max-w-xs mx-auto"
						style={{ color: textSecondary }}>
						{t('preparingExp')}
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

	if (!isEnrolled && !enrollmentLoading) {
		return <NotEnrolledPage courseId={courseId} locale={locale} />;
	}

	return (
		<>
		<div
			className="flex min-h-screen flex-col"
			dir="rtl"
			style={
				{
					background: bg,
					"--background": bg,
					"--surface": sidebarBg,
					"--surface-2": isDark ? "#2C2C2E" : "#F7F7F9",
					"--border": borderColor,
					"--foreground": textPrimary,
					"--muted": textSecondary,
					"--card": cardBg,
					"--primary": purple,
				} as React.CSSProperties
			}>
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
							<ArrowRight className="h-4 w-4" />
							<span>{t('backToCourse')}</span>
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
										className="font-medium truncate text-sm lg:text-base"
										style={{ color: textPrimary, fontFamily: "var(--font-medium)" }}>
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
											className="text-sm font-medium"
											style={{ color: green }}>
											{progress}%
										</span>
										<span className="text-xs" style={{ color: textSecondary }}>
											{t('completed')}
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
											className="text-sm font-medium"
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
								className="p-2.5 rounded-xl transition-all duration-200"
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
								className="p-2.5 rounded-xl transition-all duration-200"
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

			{/* Responsive Body — 3-column grid (RTL: sidebar is first column / visual right) */}
			<div className="learn-layout">
				{/* RIGHT SIDEBAR: progress card + course content tree */}
				<aside
					className="learn-col-right"
					style={{ display: "flex", flexDirection: "column", gap: 20 }}>
					{/* Progress card */}
					{(() => {
						const progressPercent = progress;
						const circumference = 2 * Math.PI * 45;
						const strokeDashoffset =
							circumference - (progressPercent / 100) * circumference;
						return (
							<div
								style={{
									padding: 24,
									borderRadius: 20,
									background: "var(--card)",
									border: "1px solid var(--border)",
								}}>
								{/* Header with back link */}
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										marginBottom: 20,
									}}>
									<span
										style={{
											fontSize: 13,
											fontWeight: 500,
											fontFamily: "var(--font-medium)",
											color: "var(--muted)",
										}}>
										{isAr ? "العودة للكورس" : "Back to course"}
									</span>
									<button
										onClick={() =>
											router.push(`/${locale}/courses/${courseId}`)
										}
										title={isAr ? "العودة للكورس" : "Back to course"}
										style={{
											width: 32,
											height: 32,
											borderRadius: 8,
											background: "transparent",
											border: "none",
											color: "var(--primary)",
											cursor: "pointer",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
										}}>
										<ArrowLeft size={18} />
									</button>
								</div>

								{/* Circular progress */}
								<div
									style={{
										position: "relative",
										width: 120,
										height: 120,
										margin: "0 auto 20px",
									}}>
									<svg
										width="120"
										height="120"
										viewBox="0 0 120 120"
										style={{ transform: "rotate(-90deg)" }}>
										<circle
											cx="60"
											cy="60"
											r="45"
											stroke="var(--surface-2)"
											strokeWidth="8"
											fill="none"
										/>
										<circle
											cx="60"
											cy="60"
											r="45"
											stroke="var(--primary)"
											strokeWidth="8"
											fill="none"
											strokeDasharray={circumference}
											strokeDashoffset={strokeDashoffset}
											strokeLinecap="round"
											style={{ transition: "stroke-dashoffset 0.6s ease" }}
										/>
									</svg>
									<div
										style={{
											position: "absolute",
											inset: 0,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											flexDirection: "column",
										}}>
										<span
											style={{
												fontSize: 24,
												fontWeight: 500,
												fontFamily: "var(--font-medium)",
												color: "var(--foreground)",
											}}>
											{progressPercent}%
										</span>
									</div>
								</div>

								{/* Label */}
								<div style={{ textAlign: "center", marginBottom: 12 }}>
									<span
										style={{
											fontSize: 14,
											fontWeight: 500,
											fontFamily: "var(--font-medium)",
											color: "var(--foreground)",
										}}>
										{progressPercent === 100
											? isAr
												? "تم إكمال الكورس"
												: "Course completed"
											: isAr
												? "قيد التقدم"
												: "In progress"}
									</span>
								</div>

								{/* Linear progress bar */}
								<div
									style={{
										height: 6,
										borderRadius: 99,
										background: "var(--surface-2)",
										overflow: "hidden",
										marginBottom: 8,
									}}>
									<div
										style={{
											height: "100%",
											width: `${progressPercent}%`,
											background: "var(--primary)",
											borderRadius: 99,
											transition: "width 0.6s ease",
										}}
									/>
								</div>

								{/* Lessons count */}
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										fontSize: 12,
										fontWeight: 300,
										fontFamily: "var(--font-light)",
										color: "var(--muted)",
									}}>
									<span>
										{totalLessons} {isAr ? "درس" : "lessons"}
									</span>
									<span>
										{completedCount} {isAr ? "من" : "of"} {totalLessons}{" "}
										{isAr ? "درس" : "lessons"}
									</span>
								</div>

								{/* Grades link (preserved) */}
								<a
									href={`/${locale}/dashboard/grades`}
									style={{
										marginTop: 16,
										padding: "8px 12px",
										background: "var(--surface-2)",
										borderRadius: 10,
										display: "flex",
										alignItems: "center",
										gap: 8,
										color: "var(--foreground)",
										fontSize: "0.82rem",
										fontWeight: 500,
										fontFamily: "var(--font-medium)",
										textDecoration: "none",
									}}>
									<Award size={14} style={{ color: "var(--primary)" }} />
									{isAr ? "الدرجات" : "Grades"}
								</a>
							</div>
						);
					})()}

					{/* Course content tree card */}
					<div
						className="learn-tree-card"
						style={{
							padding: 16,
							borderRadius: 20,
							background: "var(--card)",
							border: "1px solid var(--border)",
						}}>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: 8,
								margin: "0 0 16px",
								padding: "0 8px",
							}}>
							<Target size={16} style={{ color: "var(--primary)" }} />
							<h3
								style={{
									fontSize: 15,
									fontWeight: 900,
									fontFamily: "var(--font-brand)",
									color: "var(--foreground)",
									margin: 0,
								}}>
								{isAr ? "محتوى الكورس" : "Course content"}
							</h3>
						</div>

					{/* Lessons List - Grouped by sections */}
					<div className="px-3 pb-4 space-y-1">
						{sections.map((section: any, sectionIndex: number) => {
							const sectionLessons = Array.isArray(section.lessons) ? section.lessons : [];
							if (sectionLessons.length === 0) return null;

							return (
								<div key={section.id || sectionIndex} style={{ marginBottom: sectionIndex < sections.length - 1 ? '12px' : '4px' }}>
									{/* Section Header */}
									<div
										style={{
											padding: '8px 12px',
											background: 'rgba(255,255,255,0.04)',
											borderRadius: '8px',
											marginBottom: '4px',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'space-between',
											cursor: 'pointer',
											userSelect: 'none',
										}}
										onClick={() => toggleSection(section.id)}>
										<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
											<span
												style={{
													width: '22px', height: '22px', borderRadius: '50%',
													background: openSections.has(section.id) ? 'rgba(81,32,200,0.2)' : 'rgba(255,255,255,0.06)',
													color: openSections.has(section.id) ? '#a78bfa' : '#666680',
													display: 'flex', alignItems: 'center', justifyContent: 'center',
													fontSize: '0.68rem', fontWeight: 500, fontFamily: 'var(--font-medium)', flexShrink: 0,
													transition: 'background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
												}}>
												{sectionIndex + 1}
											</span>
											<span
												style={{
													fontSize: '13px', fontWeight: 900,
													fontFamily: 'var(--font-brand)',
													color: 'var(--foreground)',
												}}>
												{section.title || section.titleAr || `Section ${sectionIndex + 1}`}
											</span>
										</div>
										<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
											<span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 500, fontFamily: 'var(--font-medium)' }}>
												{sectionLessons.length} {isAr ? 'دروس' : 'lessons'}
											</span>
											<ChevronDown
												size={14}
												style={{
													color: '#666680',
													transform: openSections.has(section.id) ? 'rotate(0deg)' : 'rotate(-90deg)',
													transition: 'transform 0.2s ease',
												}}
											/>
										</div>
									</div>

									{/* Section Lessons */}
									{openSections.has(section.id) && sectionLessons.map((lesson: any, lessonIndex: number) => {
										const globalIdx = allLessonsFlat.findIndex((l: any) => l.id === lesson.id);
										const status = getLessonStatus(lesson.id);
										const isActive = activeLessonId === lesson.id;

										return (
											<button
												key={lesson.id}
												onClick={() => {
													if (status !== "locked") goToLesson(lesson);
												}}
												disabled={status === "locked"}
												className={`
													group relative w-full text-right transition-all duration-200
													${status === "locked" ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
												`}
												style={{
													display: "flex",
													alignItems: "center",
													gap: "12px",
													padding: "10px 14px",
													borderRadius: "8px",
													border: "none",
													background: isActive ? "rgba(81,32,200,0.08)" : "transparent",
													borderRight: isActive
														? `3px solid var(--primary)`
														: "3px solid transparent",
													marginBottom: "2px",
												}}>
												{/* Status Indicator */}
												<div
													className="relative flex items-center justify-center shrink-0"
													style={{
														width: "30px",
														height: "30px",
														borderRadius: "10px",
														background:
															status === "completed"
																? green
																: status === "available"
																	? purple
																	: borderColor,
													}}>
													{status === "completed" && (
														<CheckCircle2 size={14} color="#fff" strokeWidth={2.5} />
													)}
													{status === "available" && (
														<Play size={13} color="#fff" fill="#fff" />
													)}
													{status === "locked" && (
														<Lock size={12} color={isDark ? "#6b7280" : "#9ca3af"} />
													)}
												</div>

												{/* Lesson Content */}
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
														<h3
															className="text-[13px] truncate leading-tight"
															style={{
																fontWeight: 500,
																fontFamily: "var(--font-medium)",
																color: isActive
																	? "var(--primary)"
																	: status === "locked"
																		? "var(--muted)"
																		: "var(--foreground)",
															}}>
															{lesson.title || lesson.titleAr}
														</h3>
														{getLessonTypeBadge(lesson)}
													</div>

													<div
														className="flex items-center gap-2 text-[11px]"
														style={{ color: textSecondary, fontWeight: 500, fontFamily: "var(--font-medium)" }}>
														{lesson.duration && (
															<span className="flex items-center gap-1">
																<Clock size={10} />
																{lesson.duration} د
															</span>
														)}
													</div>
												</div>

												{/* Lesson Number Badge */}
												<div
													className="flex items-center justify-center shrink-0 text-xs font-medium"
													style={{
														width: "22px",
														height: "22px",
														borderRadius: "7px",
														background: isActive ? purple : `${borderColor}`,
														color: isActive ? "#fff" : textSecondary,
														fontFamily: "var(--font-medium)",
													}}>
													{globalIdx + 1}
												</div>
											</button>
										);
									})}
								</div>
							);
						})}
					</div>
					</div>
				</aside>

				{/* Main Content Area - Course info, Video & Lesson Info */}
				<main
					className="learn-col-main"
					style={{ display: "flex", flexDirection: "column", gap: 20 }}>
					{/* Course info card */}
					<div
						style={{
							padding: 24,
							borderRadius: 20,
							background:
								"linear-gradient(135deg, rgba(81,32,200,0.08), rgba(139,92,246,0.04))",
							border: "1px solid var(--border)",
							display: "flex",
							gap: 24,
							alignItems: "center",
						}}>
						{!!getSafeUrl(course?.thumbnail) && (
							<div
								style={{
									width: 140,
									height: 100,
									flexShrink: 0,
									borderRadius: 16,
									overflow: "hidden",
									background: "var(--surface-2)",
								}}>
								<img
									src={getSafeUrl(course?.thumbnail)}
									alt=""
									style={{
										width: "100%",
										height: "100%",
										objectFit: "cover",
									}}
								/>
							</div>
						)}

						<div style={{ flex: 1, minWidth: 0 }}>
							<h1
								style={{
									fontSize: 24,
									fontWeight: 500,
									fontFamily: "var(--font-medium)",
									color: "var(--foreground)",
									margin: "0 0 6px",
								}}>
								{course?.titleAr || course?.titleEn || course?.title}
							</h1>
							{(course?.descriptionAr ||
								course?.descriptionEn ||
								course?.description) && (
								<p
									style={{
										fontSize: 13,
										fontWeight: 300,
										fontFamily: "var(--font-light)",
										color: "var(--muted)",
										margin: "0 0 14px",
										lineHeight: 1.6,
									}}>
									{course?.descriptionAr ||
										course?.descriptionEn ||
										course?.description}
								</p>
							)}

							{/* Meta row */}
							<div
								style={{
									display: "flex",
									gap: 8,
									flexWrap: "wrap",
									alignItems: "center",
									fontSize: 12,
									fontWeight: 300,
									fontFamily: "var(--font-light)",
									color: "var(--muted)",
								}}>
								<span>
									{course?.level
										? String(course.level).charAt(0).toUpperCase() +
											String(course.level).slice(1).toLowerCase()
										: isAr
											? "مبتدئ"
											: "Beginner"}
								</span>
								<span>·</span>
								<span>{`${course?.duration || 30} ${isAr ? "ساعة" : "hours"}`}</span>
								{course?.rating ? (
									<>
										<span>·</span>
										<span>{course.rating}</span>
									</>
								) : null}
								<span>·</span>
								<span>{`${totalLessons} ${isAr ? "درس" : "lessons"}`}</span>
							</div>
						</div>
					</div>

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
												fontWeight: 500,
												fontFamily: "var(--font-medium)",
												overflow: "hidden",
												textOverflow: "ellipsis",
												whiteSpace: "nowrap",
											}}>
											{currentLesson?.title || course?.titleAr}
										</div>
									</div>
									<span style={{ color: "#6b7280", fontSize: 11, fontWeight: 300, fontFamily: "var(--font-light)" }}>
										{activeLessonIndex + 1}/{totalLessons}
									</span>
								</div>
							)}

							{/* Media Viewer Container */}
							<div
								className="w-full relative"
								style={{
									width: "100%",
									maxWidth: "100%",
									background: "var(--card)",
									border: "1px solid var(--border)",
									borderRadius: 20,
									overflow: "hidden",
									boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
								}}>

								{/* TAB BUTTONS — underline style, only when 2+ content types */}
								{tabCount > 1 && (
									<div style={{
										display: 'flex', gap: 4, flexWrap: 'wrap',
										borderBottom: '1px solid var(--border)',
										padding: '0 16px',
									}}>
										{([
											{ id: 'video', show: !!videoUrl, icon: <Video size={14} />, label: isAr ? 'الفيديو' : 'Video' },
											{ id: 'file', show: !!fileUrl, icon: <FileText size={14} />, label: isAr ? 'ملف PDF' : 'PDF File' },
											{ id: 'image', show: !!activeLesson?.imageUrl, icon: <Image size={14} />, label: isAr ? 'الصورة' : 'Image' },
										] as { id: 'video' | 'file' | 'image'; show: boolean; icon: any; label: string }[])
											.filter((tab) => tab.show)
											.map((tab) => (
												<button
													key={tab.id}
													onClick={() => setActiveTab(tab.id)}
													style={{
														display: 'flex', alignItems: 'center', gap: 6,
														padding: '12px 16px',
														background: 'transparent',
														border: 'none',
														borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
														color: activeTab === tab.id ? 'var(--primary)' : 'var(--muted)',
														fontSize: 13, fontWeight: 500,
														fontFamily: 'var(--font-medium)',
														cursor: 'pointer',
														transition: 'all 0.15s ease',
													}}>
													{tab.icon}
													{tab.label}
												</button>
											))}
									</div>
								)}

								{/* VIDEO TAB */}
								{(activeTab === 'video' || (!activeLesson?.fileUrl && !activeLesson?.imageUrl)) && !!videoUrl && (
									<div className="relative" style={{ margin: '16px' }}>
										<div style={{
											position: 'relative',
											overflow: 'hidden',
											borderRadius: '18px',
											background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
											border: '1px solid rgba(255,255,255,0.08)',
											boxShadow: '0 10px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)',
										}}>
											<div
												className="video-container relative overflow-hidden"
												style={{
													paddingTop: isMobile ? "56.25%" : "56.25%",
													background: "#000",
													borderRadius: "12px",
													minHeight: isMobile ? "200px" : undefined,
													transition: 'box-shadow 0.3s ease',
												}}
												onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 10px 40px rgba(81,32,200,0.18)' }}
												onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none' }}
												onTouchEnd={handleVideoTap}>
												<video
													ref={videoRef}
													key={currentLesson?.id || "no-lesson"}
													src={videoUrl}
													controls
													autoPlay
													className="absolute top-0 left-0 w-full h-full object-contain"
													style={{ borderRadius: '12px' }}
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
														if (activeLesson?.id) markVideoWatched(activeLesson.id);
														if (requiresQuiz) return;
														if (!isCurrentCompleted) handleMarkComplete();
														else if (nextLesson) goToLesson(nextLesson);
													}}
													onTimeUpdate={(e) => {
														const el = e.currentTarget;
														if (
															activeLesson?.id &&
															el.duration > 0 &&
															el.duration - el.currentTime <= 5
														) {
															markVideoWatched(activeLesson.id);
														}
													}}
												/>

												{/* Loading Overlay */}
												{(!videoReady || isLoadingMedia) && (
													<div
														className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
														style={{
															background: "#0a0a0a",
															backdropFilter: "blur(4px)",
															borderRadius: "12px",
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
														style={{ background: "rgba(0,0,0,0.95)", borderRadius: "12px" }}>
														<div className="text-center p-8 max-w-sm">
															<div
																className="h-16 w-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
																style={{ background: `${redColor}20` }}>
																<Video
																	className="h-8 w-8"
																	style={{ color: redColor }}
																/>
															</div>
															<h3
																className="text-white text-lg mb-2"
																style={{ fontWeight: 500, fontFamily: "var(--font-medium)" }}>
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
																className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm font-medium transition-all">
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
														}}>
														{seekFeedback.side === "backward" ? "-5s" : "+5s"}
													</div>
											)}
										</div>

										<div style={{
											position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px',
												background: 'linear-gradient(to top, rgba(0,0,0,0.25), transparent)',
												pointerEvents: 'none',
											}} />
										</div>

										{/* Speed Controls — Segmented Pills */}
										<div style={{ marginTop: '12px' }}>
											<div style={{
												display: 'inline-flex', gap: '4px', padding: '5px',
												borderRadius: '12px',
												background: 'rgba(255,255,255,0.05)',
												border: '1px solid rgba(255,255,255,0.06)',
											}}>
												{speeds.map((speed) => (
													<button
														key={speed}
														onClick={() => { videoRef.current!.playbackRate = speed; setPlaybackRate(speed) }}
														style={{
															border: 'none',
															padding: '6px 11px',
															borderRadius: '9px',
															fontSize: '12px',
															fontWeight: 500,
															cursor: 'pointer',
															transition: 'background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease',
															background: playbackRate === speed ? '#5120C8' : 'transparent',
															color: playbackRate === speed ? '#fff' : '#94a3b8',
															boxShadow: playbackRate === speed ? '0 4px 12px rgba(81,32,200,0.35)' : 'none',
															fontFamily: 'var(--font-medium)',
														}}
													>
														{speed === 1 ? '1x' : `${speed}x`}
													</button>
												))}
											</div>
										</div>
									</div>
								)}

								{/* PDF TAB */}
								{(activeTab === 'file' || (!videoUrl && !activeLesson?.imageUrl)) && !!fileUrl && (
									<div style={{ padding: '16px' }}>
										<div style={{
											width: '100%', height: '75vh', borderRadius: '8px',
											overflow: 'hidden', border: `1px solid ${borderColor}`,
										}}>
											<iframe
												src={googleViewerUrl}
												style={{ width: '100%', height: '100%', border: 'none' }}
												title="PDF Viewer"
											/>
										</div>
										<div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
											<a href={googleViewerTabUrl} target="_blank" rel="noopener noreferrer"
												style={{
													padding: '8px 20px', borderRadius: '8px', fontSize: '13px',
													fontWeight: 500, fontFamily: 'var(--font-medium)', background: '#5120c8', color: 'white',
													textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px',
												}}>
												<Eye size={16} />
												{isAr ? 'فتح في تبويب جديد' : 'Open in new tab'}
											</a>
											<button type="button" onClick={() => handleDownload(fileUrl, fileName)}
												style={{
													padding: '8px 20px', borderRadius: '8px', fontSize: '13px',
													fontWeight: 500, fontFamily: 'var(--font-medium)', background: 'transparent', color: '#a78bfa',
													border: `1px solid #5120c8`, textDecoration: 'none',
													display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
												}}>
												<Download size={16} />
												{isAr ? 'تحميل' : 'Download'}
											</button>
											{!pdfReachedEnd && (
												<button
													onClick={() => setPdfReachedEnd(true)}
													style={{
														padding: '8px 20px', borderRadius: '8px', fontSize: '13px',
														fontWeight: 500, fontFamily: 'var(--font-medium)', background: 'rgba(34,197,94,0.15)', color: '#4ade80',
														border: '1px solid rgba(34,197,94,0.3)',
														display: 'flex', alignItems: 'center', gap: '6px',
														cursor: 'pointer',
													}}>
													<CheckCircle2 size={16} />
													{isAr ? 'وصلت إلى آخر صفحة' : 'I reached the last page'}
												</button>
											)}
										</div>
									</div>
								)}

								{/* IMAGE TAB — shown whenever an image URL resolves, so mixed
								    lessons (video + file + image) render it too. */}
								{activeTab === 'image' && !!effectiveImageUrl && (
									<div style={{ padding: '16px' }}>
										<div style={{
											width: '100%', display: 'flex', alignItems: 'center',
											justifyContent: 'center', background: isDark ? '#111827' : '#f8fafc',
											borderRadius: '12px', overflow: 'hidden', padding: '16px',
											border: `1px solid ${borderColor}`,
											minHeight: '300px',
										}}>
											<img
												src={effectiveImageUrl}
												alt="lesson image"
												className="max-w-full rounded-lg"
											/>
										</div>
										<div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
											<a href={effectiveImageUrl} target="_blank" rel="noopener noreferrer"
												style={{
													padding: '6px 14px', borderRadius: '6px', fontSize: '12px',
													background: 'transparent', color: '#a78bfa',
													border: `1px solid ${borderColor}`, textDecoration: 'none',
													display: 'flex', alignItems: 'center', gap: '6px',
												}}>
												<ZoomIn size={14} />
												{isAr ? 'تكبير' : 'Zoom'}
											</a>
											<button
												type="button"
												onClick={() => handleDownload(effectiveImageUrl, activeLesson?.imageFileName || 'image.jpg')}
												style={{
													padding: '6px 14px', borderRadius: '6px', fontSize: '12px',
													background: 'transparent', color: '#a78bfa',
													border: `1px solid ${borderColor}`, textDecoration: 'none',
													display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
												}}>
												<Download size={14} />
												{isAr ? 'تحميل' : 'Download'}
											</button>
										</div>
									</div>
								)}

								{/* Live Lesson UI */}
								{isCurrentLive && (() => {
									const isLive = activeLesson?.liveStatus === 'LIVE'
									const liveUrl = `/${locale}/live/${courseId}?lessonId=${activeLesson?.id}`
									return (
										<div
											style={{
												aspectRatio: '16/9',
												background: isLive
													? 'linear-gradient(135deg, #1a0505 0%, #3d0a0a 100%)'
													: 'linear-gradient(135deg, #0d0a1a 0%, #1a1040 100%)',
												borderRadius: '12px',
												display: 'flex',
												flexDirection: 'column',
												alignItems: 'center',
												justifyContent: 'center',
												gap: '1.5rem',
												border: isLive
													? '2px solid rgba(239,68,68,0.5)'
													: '1px solid rgba(81,32,200,0.3)',
												padding: '2rem',
												position: 'relative',
												overflow: 'hidden',
											}}>

											{/* LIVE badge */}
											{isLive && (
												<div style={{
													position: 'absolute', top: '16px', right: '16px',
													display: 'flex', alignItems: 'center', gap: '6px',
													background: '#ef4444', padding: '4px 12px',
													borderRadius: '20px', color: '#fff', fontWeight: 500, fontFamily: 'var(--font-medium)', fontSize: '0.8rem',
												}}>
													<span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff', animation: 'pulse 1s infinite' }}/>
													LIVE
												</div>
											)}

											{/* Icon */}
											<div style={{
												width: '80px', height: '80px', borderRadius: '50%',
												background: isLive ? 'rgba(239,68,68,0.15)' : 'rgba(81,32,200,0.15)',
												border: isLive ? '2px solid rgba(239,68,68,0.4)' : '2px solid rgba(81,32,200,0.3)',
												display: 'flex', alignItems: 'center', justifyContent: 'center',
											}}>
												<svg width="36" height="36" viewBox="0 0 24 24" fill="none"
													stroke={isLive ? '#f87171' : '#a78bfa'} strokeWidth="2">
													<circle cx="12" cy="12" r="10"/>
													<circle cx="12" cy="12" r="4" fill={isLive ? '#f87171' : '#a78bfa'}/>
												</svg>
											</div>

											{/* Title */}
											<p style={{ color: '#fff', fontWeight: 500, fontFamily: 'var(--font-medium)', fontSize: '1.1rem', textAlign: 'center', padding: '0 2rem' }}>
												{activeLesson?.title || (isAr ? t('liveLabel') : 'Live Session')}
											</p>

											{isLive ? (
												<>
													<p style={{ color: '#fca5a5', fontWeight: 300, fontFamily: 'var(--font-light)', fontSize: '0.88rem', textAlign: 'center', maxWidth: '320px' }}>
														{isAr ? t('liveNow') : 'Stream is live — join before it ends'}
													</p>
													<a
														href={liveUrl}
														style={{
															display: 'inline-flex', alignItems: 'center', gap: '10px',
															padding: '14px 32px', borderRadius: '10px',
															background: '#ef4444', color: '#fff',
															fontWeight: 500, fontFamily: 'var(--font-medium)', fontSize: '1rem',
															textDecoration: 'none',
															boxShadow: '0 0 20px rgba(239,68,68,0.5)',
														}}>
															<span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff', animation: 'pulse 1s infinite' }}/>
															{isAr ? 'انضم للبث المباشر الآن' : 'Join Live Stream Now'}
													</a>
												</>
											) : (
												<>
													{activeLesson?.liveStartTime && (
														<p style={{ color: '#c4b5fd', fontWeight: 300, fontFamily: 'var(--font-light)', fontSize: '0.9rem' }}>
															{isAr ? 'موعد البث: ' : 'Scheduled: '}
															{new Date(activeLesson.liveStartTime).toLocaleString(
																isAr ? 'ar-SA' : 'en-US',
																{ weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
															)}
														</p>
													)}
													<a
														href={liveUrl}
														style={{
															display: 'inline-flex', alignItems: 'center', gap: '8px',
															padding: '12px 28px', borderRadius: '10px',
															background: 'rgba(81,32,200,0.3)',
															border: '1px solid rgba(81,32,200,0.5)',
															color: '#c4b5fd', fontWeight: 500, fontFamily: 'var(--font-medium)', fontSize: '0.95rem',
															textDecoration: 'none',
														}}>
															{isAr ? 'ادخل غرفة الانتظار' : 'Enter Waiting Room'}
													</a>
													<p style={{ color: '#6666aa', fontWeight: 300, fontFamily: 'var(--font-light)', fontSize: '0.78rem', textAlign: 'center', maxWidth: '280px' }}>
														{isAr
															? 'سيتم إرسال إشعار فور بدء البث'
															: 'You will be notified when stream starts'}
													</p>
												</>
											)}
										</div>
									)
								})()}

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
												className="text-xl font-medium mb-3"
												style={{ color: textPrimary, fontWeight: 500, fontFamily: "var(--font-medium)" }}>
												المحتوى قيد الترحيل
											</h3>
											<p
												className="text-sm leading-relaxed"
												style={{ color: textSecondary, fontWeight: 300, fontFamily: "var(--font-light)" }}>
												هذا الملف لم يتم رفعه بعد على المنصة الجديدة. يرجى
												التواصل مع المحاضر لإعادة رفع المحتوى.
											</p>
										</div>
									</div>
								)}

								{/* No Media State */}
								{!isCurrentLive && !hasVideo && !hasFile && !hasImage && !hasLocalUrl && (
									<div
										style={{
											width: "100%",
											maxWidth: "100%",
											padding: "80px 24px",
											display: "flex",
											flexDirection: "column",
											alignItems: "center",
											justifyContent: "center",
											textAlign: "center",
											background: "var(--surface)",
										}}>
										<div
											style={{
												width: "64px",
												height: "64px",
												borderRadius: "18px",
												background: "rgba(81, 32, 200, 0.08)",
												color: "rgba(81, 32, 200, 0.5)",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												marginBottom: "16px",
											}}>
											<File size={28} />
										</div>
										<p
											style={{
												fontSize: "14px",
												fontWeight: 300,
												fontFamily: "var(--font-light)",
												color: "var(--muted)",
												margin: 0,
											}}>
											لا يوجد وسائط لهذا الدرس
										</p>
										<p
											style={{
												fontSize: "12px",
												fontWeight: 300,
												fontFamily: "var(--font-light)",
												color: "var(--muted)",
												marginTop: "6px",
												opacity: 0.7,
											}}>
											{isAr
												? "اختر درساً آخر أو عد لاحقاً"
												: "Choose another lesson or come back later"}
										</p>
										{activeLesson.description && (
											<p
												style={{
													marginTop: 16,
													fontSize: 13,
													fontWeight: 300,
													fontFamily: "var(--font-light)",
													color: "var(--muted)",
													maxWidth: 560,
													lineHeight: 1.7,
												}}>
												{activeLesson.description}
											</p>
										)}
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
											fontWeight: 500,
											fontFamily: "var(--font-medium)",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											gap: 6,
										}}>
										<ChevronRight size={16} />
										السابق
									</button>

									<button
										onClick={() => canGoNext && nextLesson && goToLesson(nextLesson)}
										disabled={!canGoNext}
										style={{
											flex: 1,
											padding: "10px 16px",
											borderRadius: 10,
											border: "none",
											cursor: canGoNext ? "pointer" : "not-allowed",
											background: canGoNext
												? "#5120c8"
												: "rgba(255,255,255,0.03)",
											color: canGoNext ? "#fff" : "#374151",
											fontSize: 13,
											fontWeight: 500,
											fontFamily: "var(--font-medium)",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											gap: 6,
											boxShadow: canGoNext
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
								className="p-6 lg:p-8"
								style={{
									background: "var(--card)",
									border: "1px solid var(--border)",
									borderRadius: 20,
									boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
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
												className="text-2xl lg:text-3xl leading-tight"
												style={{
													fontWeight: 500,
													fontFamily: "var(--font-medium)",
													color: textPrimary,
												}}>
												{activeLesson.title || activeLesson.titleAr}
											</h1>
										</div>

										{/* Meta Information */}
										<div
											className="flex items-center gap-4 flex-wrap text-sm"
											style={{ color: textSecondary, fontWeight: 300, fontFamily: "var(--font-light)" }}>
											{activeLesson.duration && (
												<span
													className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg"
													style={{ background: `${borderColor}` }}>
													<Clock className="h-4 w-4" />
													<span>
														{activeLesson.duration}
													</span>
												</span>
											)}

											<span
												className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg"
												style={{ background: `${borderColor}` }}>
												<BookOpen className="h-4 w-4" />
												<span>
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

								</div>

								{/* Description Card */}
								{activeLesson.description && (
									<div
										className="mb-6 p-5 rounded-2xl text-sm leading-relaxed"
										style={{
											background: cardBg,
											color: textSecondary,
											fontWeight: 300,
											fontFamily: "var(--font-light)",
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

								<QuizEntryCard
									lessonId={activeLesson?.id}
									locked={!canStartQuiz}
									lockHint={
										isAr
											? "يجب مشاهدة الفيديو أولاً"
											: "Watch the video first"
									}
								/>

								{/* Mark Complete & Navigation */}
								{isEnrolled && (
									<div
										style={{
											position: "sticky",
											bottom: 12,
											zIndex: 10,
											marginTop: "1.5rem",
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between",
											flexWrap: "wrap",
											gap: "1rem",
											padding: "14px 18px",
											borderRadius: 16,
											background: "var(--card)",
											border: "1px solid var(--border)",
											boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
										}}>
										{mediaType === "video" ? (
											isCurrentCompleted ? (
												<span
													style={{
														display: "inline-flex",
														alignItems: "center",
														gap: "8px",
														padding: "10px 20px",
														borderRadius: "10px",
														background: "rgba(34,197,94,0.15)",
														border: "1px solid rgba(34,197,94,0.3)",
														color: "#4ade80",
														fontWeight: 500,
														fontFamily: "var(--font-medium)",
														fontSize: "0.875rem",
													}}>
													<CheckCircle2 size={16} />
													{isAr ? t('completed') : "Completed"}
												</span>
											) : (
												<span
													style={{
														display: "inline-flex",
														alignItems: "center",
														gap: "8px",
														padding: "10px 16px",
														borderRadius: "10px",
														background: "rgba(255,255,255,0.04)",
														border: "1px solid rgba(255,255,255,0.08)",
														color: textSecondary,
														fontWeight: 300,
														fontFamily: "var(--font-light)",
														fontSize: "0.8rem",
													}}>
													<Video size={15} />
													{isAr
														? "يكتمل الدرس تلقائياً عند انتهاء الفيديو"
														: "Completes automatically when the video ends"}
												</span>
											)
										) : mediaType === "file" && !pdfReachedEnd ? (
											<span
												style={{
													display: "inline-flex",
													alignItems: "center",
													gap: "8px",
													padding: "10px 16px",
													borderRadius: "10px",
													background: "rgba(255,255,255,0.04)",
													border: "1px solid rgba(255,255,255,0.08)",
													color: textSecondary,
													fontWeight: 300,
													fontFamily: "var(--font-light)",
													fontSize: "0.8rem",
												}}>
												<FileText size={15} />
												{isAr
													? "انتقل إلى آخر صفحة ثم اضغط زر التالي"
													: "Reach the last page to unlock Next"}
											</span>
										) : (
											<button
												onClick={handleMarkComplete}
												disabled={isCurrentCompleted || markingComplete}
												style={{
													display: "inline-flex",
													alignItems: "center",
													gap: "8px",
													padding: "10px 20px",
													borderRadius: "10px",
													background: isCurrentCompleted
														? "rgba(34,197,94,0.15)"
														: "rgba(81,32,200,0.15)",
													border: isCurrentCompleted
														? "1px solid rgba(34,197,94,0.3)"
														: "1px solid rgba(81,32,200,0.3)",
													color: isCurrentCompleted ? "#4ade80" : "#a78bfa",
													fontWeight: 500,
													fontSize: "0.875rem",
													cursor: isCurrentCompleted ? "default" : "pointer",
													fontFamily: "var(--font-medium)",
												}}>
												{isCurrentCompleted ? (
													<>
														<svg
															width="16"
															height="16"
															viewBox="0 0 24 24"
															fill="none"
															stroke="currentColor"
															strokeWidth="2.5"
															strokeLinecap="round">
															<polyline points="20 6 9 17 4 12" />
														</svg>
														{isAr ? t('completed') : "Completed"}
													</>
												) : (
													<>
														<svg
															width="16"
															height="16"
															viewBox="0 0 24 24"
															fill="none"
															stroke="currentColor"
															strokeWidth="2"
															strokeLinecap="round">
															<circle cx="12" cy="12" r="10" />
															<polyline points="12 8 12 12 14 14" />
														</svg>
														{mediaType === "file"
															? isAr ? "الدرس التالي" : "Next Lesson"
															: isAr ? t('markComplete') : "Mark as Complete"}
													</>
												)}
											</button>
										)}

										<div style={{ display: "flex", gap: "8px" }}>
											{prevLesson && (
												<button
													onClick={() => goToLesson(prevLesson)}
													style={{
														padding: "10px 16px",
														borderRadius: "10px",
														background: "rgba(255,255,255,0.05)",
														border: "1px solid rgba(255,255,255,0.1)",
														color: textPrimary,
														cursor: "pointer",
														fontFamily: "var(--font-medium)",
														fontWeight: 500,
														fontSize: "0.85rem",
														display: "flex",
														alignItems: "center",
														gap: "6px",
													}}>
													<svg
														width="14"
														height="14"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														strokeWidth="2"
														strokeLinecap="round">
														<polyline points="15 18 9 12 15 6" />
													</svg>
													{isAr ? t('previous') : "Prev"}
												</button>
											)}
											{nextLesson && (
												<button
													onClick={() => canGoNext && goToLesson(nextLesson)}
													disabled={!canGoNext}
													style={{
														padding: "10px 16px",
														borderRadius: "10px",
														background: canGoNext
															? "#5120c8"
															: "rgba(255,255,255,0.05)",
														border: "none",
														color: canGoNext ? "#fff" : "#6b7280",
														cursor: canGoNext ? "pointer" : "not-allowed",
														fontFamily: "var(--font-medium)",
														fontSize: "0.85rem",
														fontWeight: 500,
														display: "flex",
														alignItems: "center",
														gap: "6px",
													}}>
													{isAr ? t('next') : "Next"}
													<svg
														width="14"
														height="14"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														strokeWidth="2"
														strokeLinecap="round">
														<polyline points="9 18 15 12 9 6" />
													</svg>
												</button>
											)}
										</div>
									</div>
								)}

								{/* Interaction Buttons */}
								<div
									className="mt-8 pt-8 flex items-center gap-3 flex-wrap"
									style={{ borderTop: `1px solid ${borderColor}` }}>
									<button
										className="
                      group inline-flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-medium 
                      transition-all duration-200
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
										<ThumbsUp className="h-4 w-4" />
										<span>{t('helpful')}</span>
									</button>

									<button
										className="
                      group inline-flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-medium 
                      transition-all duration-200
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
										<MessageSquare className="h-4 w-4" />
										<span>{t('askQuestion')}</span>
									</button>

									<button
										className="
                      group inline-flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-medium 
                      transition-all duration-200
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
										<Share2 className="h-4 w-4" />
										<span>{t('share')}</span>
									</button>
								</div>

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
									className="text-2xl lg:text-3xl font-medium mb-4"
									style={{ color: textPrimary, fontWeight: 500, fontFamily: "var(--font-medium)" }}>
									اختر درساً للبدء
								</h2>
								<p
									className="text-base mb-8 leading-relaxed"
									style={{ color: textSecondary, fontWeight: 300, fontFamily: "var(--font-light)" }}>
									اختر أي درس من القائمة الجانبية لبدء رحلتك التعليمية
								</p>

								<button
									onClick={() => {
										const first = allLessonsFlat[0];
										if (first) goToLesson(first);
									}}
									className="
                    group inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-medium 
                    text-base transition-all duration-300
                  "
									style={{
										background: `linear-gradient(135deg, ${purple}, #5b21b6)`,
										boxShadow: `0 8px 32px ${purple}40`,
										fontFamily: "var(--font-medium)",
									}}>
									<Play className="h-5 w-5" />
									<span>ابدأ من أول درس</span>
									<ArrowLeft className="h-5 w-5" />
								</button>
							</div>
						</div>
					)}
				</main>

				{/* LEFT SIDEBAR (RTL: last column) — reserved for future content */}
				<aside
					className="learn-col-left"
					style={{ display: "flex", flexDirection: "column", gap: 20 }}
					aria-hidden="true"
				/>
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
					transition: "background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease",
					zIndex: 50,
					textDecoration: "none",
				}}
				onMouseEnter={(e) => (e.currentTarget.style.background = "#6d35e0")}
				onMouseLeave={(e) => (e.currentTarget.style.background = "#5120c8")}
				title="المساعد الذكي">
				<Sparkles size={20} color="#fff" />
			</a>


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
          className="p-3 rounded-xl transition-all duration-200 disabled:opacity-30"
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
          className="p-3 rounded-xl transition-all duration-200 disabled:opacity-30"
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

				/* 3-column learning layout (RTL: sidebar is first DOM column) */
				.learn-layout {
					display: grid;
					grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr);
					gap: 24px;
					max-width: 1600px;
					margin: 0 auto;
					padding: 24px 20px;
					width: 100%;
					align-items: start;
				}

				.learn-col-right,
				.learn-col-main,
				.learn-col-left {
					min-width: 0;
				}

				@media (max-width: 1280px) {
					.learn-layout {
						grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
					}
					.learn-col-main {
						order: 1;
					}
					.learn-col-right {
						order: 2;
					}
					.learn-col-left {
						display: none;
					}
				}

				@media (max-width: 1024px) {
					.learn-layout {
						grid-template-columns: 1fr;
						padding: 16px 12px;
						gap: 16px;
					}
					.learn-col-main {
						order: 1;
					}
					.learn-col-right {
						order: 2;
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

		{/* Full-viewport per-user watermark overlay (learn page only) */}
		<VideoProtection userEmail={userEmail} />
		</>
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
	const t = useTranslations('learn')
	return (
		<ErrorBoundary>
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
							<p className="text-sm font-medium" style={{ color: "#4b5563", fontFamily: "var(--font-medium)" }}>
								{t('loadingLearn')}
							</p>
						</div>
					</div>
				}>
				<LearnPageInner />
			</Suspense>
		</>
		</ErrorBoundary>
	);
}
