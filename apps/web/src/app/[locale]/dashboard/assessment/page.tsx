"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useLocale } from "next-intl";
import { useMutation, useQuery } from "@tanstack/react-query";
import { get, post } from "../../../../lib/api";
import { AuthGate } from "../../../components/AuthGate";
import { DashboardShell } from "../../../components/DashboardShell";
import { useRouter } from "next/navigation";
import { findPathByTitle } from "../../../../lib/career-paths";
import {
	Brain,
	Target,
	Clock,
	Zap,
	HelpCircle,
	ArrowRight,
	ArrowLeft,
	Check,
	X,
	RefreshCw,
	Share2,
	Save,
	AlertTriangle,
	Sparkles,
	Briefcase,
	TrendingUp,
	ChevronRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuestionOption { value: string; en: string }
interface Question { id: number; category: string; en: string; options: QuestionOption[] }
interface LearningStep { month: string; focus: string; resources: string }
interface SalaryRange { egypt: string; saudi: string }
interface Specialization {
	rank: number; title: string; titleEn: string; matchScore: number;
	whyMatch: string; requiredSkills: string[]; currentSkills: string[];
	missingSkills: string[]; learningPath: LearningStep[];
	salaryRange: SalaryRange; timeToFirstJob: string;
	jobTitles: string[]; demandLevel: string;
}
interface Report {
	personalityType: string; personalityDescription: string;
	topSpecializations: Specialization[]; personalityStrengths: string[];
	areasToImprove: string[]; personalAdvice: string;
	urgentFirstStep: string; disclaimer: string | null;
}
interface HistorySession {
	id: string; status: string; createdAt: string;
	completedAt: string | null; report: Report | null;
}

type Phase = "start" | "quiz" | "loading" | "results" | "error";

// ─── Demo Questions ───────────────────────────────────────────────────────────

const DEMO_QUESTIONS: Question[] = Array.from({ length: 15 }, (_, i) => ({
	id: i + 1, category: i % 2 === 0 ? "technical" : "professional",
	en: `سؤال تجريبي ${i + 1}: ما هو اختيارك المفضل في هذا المجال؟`,
	options: [
		{ value: "A", en: "الخيار الأول" }, { value: "B", en: "الخيار الثاني" },
		{ value: "C", en: "الخيار الثالث" }, { value: "D", en: "الخيار الرابع" },
	],
}));

const LOADING_MESSAGES = [
	"جارٍ تحليل شخصيتك المهنية...",
	"مطابقة مهاراتك مع متطلبات السوق...",
	"اكتشاف أفضل المسارات لك...",
	"بناء خطة التعلم الخاصة بك...",
	"شارفنا على الانتهاء...",
];

// ─── CSS Keyframes (injected once) ────────────────────────────────────────────

const STYLE_ID = "assessment-keyframes";
const KEYFRAMES = `
@keyframes slideInRight { from { opacity:0; transform:translateX(60px) } to { opacity:1; transform:translateX(0) } }
@keyframes slideInLeft { from { opacity:0; transform:translateX(-60px) } to { opacity:1; transform:translateX(0) } }
@keyframes fadeInUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
@keyframes scaleIn { from { opacity:0; transform:scale(0.8) } to { opacity:1; transform:scale(1) } }
@keyframes confettiDot {
  0% { opacity:1; transform:translate(0,0) scale(1) }
  100% { opacity:0; transform:translate(var(--cx),var(--cy)) scale(0) }
}
@keyframes drawCircle { from { stroke-dashoffset:var(--circ) } to { stroke-dashoffset:var(--offset) } }
@keyframes checkPop { 0% { opacity:0; transform:scale(0) } 60% { transform:scale(1.2) } 100% { opacity:1; transform:scale(1) } }
@keyframes barFill { from { width:0 } to { width:var(--fill) } }
`;

function injectStyles() {
	if (typeof document === "undefined") return;
	if (document.getElementById(STYLE_ID)) return;
	const el = document.createElement("style");
	el.id = STYLE_ID;
	el.textContent = KEYFRAMES;
	document.head.appendChild(el);
}

// ─── Confetti Component ───────────────────────────────────────────────────────

function Confetti() {
	const dots = useMemo(() => {
		const colors = ["#5120c8", "#16a34a", "#f59e0b", "#dc2626", "#3b82f6", "#ec4899"];
		return Array.from({ length: 24 }, (_, i) => {
			const angle = (i / 24) * 360;
			const dist = 80 + Math.random() * 60;
			const rad = (angle * Math.PI) / 180;
			return {
				color: colors[i % colors.length],
				cx: `${Math.cos(rad) * dist}px`,
				cy: `${Math.sin(rad) * dist}px`,
				delay: `${Math.random() * 0.3}s`,
				size: 4 + Math.random() * 4,
			};
		});
	}, []);

	return (
		<div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
			{dots.map((d, i) => (
				<div key={i} className="absolute rounded-full"
					style={{
						width: d.size, height: d.size, backgroundColor: d.color,
						"--cx": d.cx, "--cy": d.cy,
						animation: `confettiDot 1.5s ${d.delay} ease-out forwards`,
					} as React.CSSProperties} />
			))}
		</div>
	);
}

// ─── Circular Progress Ring ───────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
	const r = 70, circ = 2 * Math.PI * r;
	const offset = circ - (score / 100) * circ;
	return (
		<div className="relative inline-flex items-center justify-center">
			<svg width="180" height="180" className="-rotate-90">
				<circle cx="90" cy="90" r={r} fill="none" strokeWidth="10"
					className="stroke-[#e5e7eb] dark:stroke-[rgba(255,255,255,0.08)]" />
				<circle cx="90" cy="90" r={r} fill="none" strokeWidth="10"
					strokeLinecap="round" className="stroke-[#5120c8]"
					style={{
						"--circ": circ, "--offset": offset,
						strokeDasharray: circ, strokeDashoffset: offset,
						animation: "drawCircle 1.5s ease-out forwards",
					} as React.CSSProperties} />
			</svg>
			<div className="absolute flex flex-col items-center">
				<span className="text-5xl font-bold tracking-tight text-[#0d0d0d] dark:text-[#f1f5f9]"
					style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
					{score}%
				</span>
				<span className="text-sm text-[#6b7280] dark:text-[#94a3b8]">النتيجة</span>
			</div>
		</div>
	);
}

// ─── Grade Badge ──────────────────────────────────────────────────────────────

function gradeBadge(score: number): { label: string; color: string } {
	if (score >= 90) return { label: "ممتاز", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" };
	if (score >= 75) return { label: "جيد جدا", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" };
	if (score >= 60) return { label: "جيد", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" };
	return { label: "مقبول", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" };
}

// ════════════════════════════════════════════════════════════════════════════════
//   PHASE 1: START SCREEN
// ════════════════════════════════════════════════════════════════════════════════

function StartScreen({ onStart, isStarting, questionCount, isAr }: {
	onStart: () => void; isStarting: boolean; questionCount: number; isAr: boolean;
}) {
	return (
		<div className="flex min-h-[60vh] items-center justify-center px-4" dir="rtl">
			<div className="w-full max-w-lg text-center" style={{ animation: "fadeInUp 0.5s ease-out" }}>
				<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(81,32,200,0.08)] dark:bg-[rgba(81,32,200,0.15)]">
					<Brain size={40} className="text-[#5120c8]" />
				</div>

				<h1 className="mt-6 text-3xl font-bold tracking-tight text-[#0d0d0d] dark:text-[#f1f5f9] sm:text-4xl"
					style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
					{isAr ? 'اختبار تحديد المسار المهني' : 'Career Path Assessment'}
				</h1>
				<p className="mt-3 text-base text-[#6b7280] dark:text-[#94a3b8]"
					style={{ fontFamily: "'DM Sans', sans-serif" }}>
					{isAr ? 'اكتشف مسارك المهني المثالي بناء على مهاراتك واهتماماتك' : 'Discover your ideal career based on your skills and interests'}
				</p>

				<div className="mt-8 grid grid-cols-3 gap-3">
					{[
						{ icon: HelpCircle, label: isAr ? `${questionCount} سؤال` : `${questionCount} Questions`, sub: isAr ? 'عدد الأسئلة' : 'Number of Questions' },
						{ icon: Clock, label: isAr ? '10 دقائق' : '10 Minutes', sub: isAr ? 'المدة التقريبية' : 'Estimated Duration' },
						{ icon: Zap, label: isAr ? 'فورية' : 'Instant', sub: isAr ? 'النتيجة' : 'Results' },
					].map((item) => (
						<div key={item.sub}
							className="rounded-xl border border-[#e5e7eb] dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#161929] p-4">
							<item.icon size={22} className="mx-auto text-[#5120c8]" />
							<div className="mt-2 text-sm font-bold text-[#0d0d0d] dark:text-[#f1f5f9]">{item.label}</div>
							<div className="text-xs text-[#6b7280] dark:text-[#94a3b8]">{item.sub}</div>
						</div>
					))}
				</div>

				<button onClick={onStart} disabled={isStarting}
					className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-[#5120c8] px-8 text-base font-bold text-white transition-all hover:bg-[#5120c8]/90 disabled:opacity-60 disabled:cursor-not-allowed">
					{isStarting ? (
						<><RefreshCw size={18} className="animate-spin" /> {isAr ? 'جارٍ البدء...' : 'Starting...'}</>
					) : (
						<><ArrowLeft size={18} /> {isAr ? 'ابدأ الاختبار الآن' : 'Start Assessment Now'}</>
					)}
				</button>

				<p className="mt-4 text-xs text-[#6b7280] dark:text-[#94a3b8]">
					{isAr ? 'اجاباتك سرية ولن تؤثر على حسابك' : 'Your answers are confidential and won\'t affect your account'}
				</p>
			</div>
		</div>
	);
}

// ════════════════════════════════════════════════════════════════════════════════
//   PHASE 2: QUIZ IN PROGRESS
// ════════════════════════════════════════════════════════════════════════════════

function QuizScreen({ questions, currentIdx, selectedOption, onSelect, onNext, onPrev, onExit, isAr }: {
	questions: Question[]; currentIdx: number; selectedOption: number | null;
	onSelect: (idx: number) => void; onNext: () => void; onPrev: () => void;
	onExit: () => void; isAr: boolean;
}) {
	const q = questions[currentIdx];
	if (!q) return null;
	const progress = ((currentIdx + (selectedOption !== null ? 1 : 0)) / questions.length) * 100;
	const [slideDir, setSlideDir] = useState<"right" | "left">("right");
	const [animKey, setAnimKey] = useState(0);

	useEffect(() => { setAnimKey((k) => k + 1); }, [currentIdx]);

	return (
		<div className="flex min-h-[70vh] flex-col" dir="rtl">
			{/* Top Bar */}
			<div className="sticky top-0 z-10 border-b border-[#e5e7eb] dark:border-[rgba(255,255,255,0.08)] bg-[#fafafa]/95 dark:bg-[#0f1221]/95 backdrop-blur-sm px-4 py-3">
				<div className="mx-auto flex max-w-2xl items-center justify-between">
					<span className="text-sm font-semibold text-[#6b7280] dark:text-[#94a3b8]">
						{isAr ? `السؤال ${currentIdx + 1} من ${questions.length}` : `Question ${currentIdx + 1} of ${questions.length}`}
					</span>
					<button onClick={onExit}
						className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6b7280] hover:bg-[#f4f4f6] dark:hover:bg-[#1e2235] transition-colors">
						<X size={18} />
					</button>
				</div>
				<div className="mx-auto mt-2 max-w-2xl">
					<div className="h-2 w-full overflow-hidden rounded-full bg-[#f4f4f6] dark:bg-[#1e2235]">
						<div className="h-full rounded-full bg-[#5120c8] transition-all duration-500 ease-out"
							style={{ width: `${progress}%` }} />
					</div>
				</div>
			</div>

			{/* Main Card */}
			<div className="flex flex-1 items-center justify-center px-4 py-8">
				<div key={animKey} className="w-full max-w-2xl"
					style={{ animation: `slideIn${slideDir === "right" ? "Right" : "Left"} 0.3s ease-out` }}>
					{/* Question Number */}
					<div className="mb-6 flex items-center gap-3">
						<span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(81,32,200,0.08)] dark:bg-[rgba(81,32,200,0.15)] text-xl font-bold text-[#5120c8]"
							style={{ fontFamily: "monospace" }}>
							{currentIdx + 1}
						</span>
					</div>

					{/* Question Text */}
					<h2 className="text-xl font-bold leading-relaxed text-[#0d0d0d] dark:text-[#f1f5f9] sm:text-2xl"
						style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.7 }}>
						{q.en}
					</h2>

					{/* Options */}
					<div className="mt-8 space-y-3">
						{q.options.map((opt, i) => {
							const isSelected = selectedOption === i;
							return (
								<button key={`${q.id}-${opt.value}`} onClick={() => onSelect(i)}
									className={`group flex w-full items-center gap-4 rounded-xl border-2 p-4 text-right transition-all duration-200 ${
										isSelected
											? "border-[#5120c8] bg-[#5120c8] text-white scale-[1.02]"
											: "border-[#e5e7eb] dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#161929] text-[#0d0d0d] dark:text-[#f1f5f9] hover:border-[#5120c8] hover:bg-[rgba(81,32,200,0.08)] dark:hover:bg-[rgba(81,32,200,0.08)]"
									}`}>
									<span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
										isSelected
											? "bg-white/20 text-white"
											: "border-2 border-[#e5e7eb] dark:border-[rgba(255,255,255,0.15)] text-[#6b7280] group-hover:border-[#5120c8] group-hover:text-[#5120c8]"
									}`}>
										{isSelected ? <Check size={16} /> : (i + 1)}
									</span>
									<span className="flex-1 text-sm font-medium" style={{ fontFamily: "'DM Sans', sans-serif" }}>
										{opt.en}
									</span>
								</button>
							);
						})}
					</div>
				</div>
			</div>

			{/* Bottom Bar */}
			<div className="border-t border-[#e5e7eb] dark:border-[rgba(255,255,255,0.08)] bg-[#fafafa]/95 dark:bg-[#0f1221]/95 backdrop-blur-sm px-4 py-3">
				<div className="mx-auto flex max-w-2xl items-center justify-between">
					<button onClick={() => { setSlideDir("left"); onPrev(); }}
						disabled={currentIdx === 0}
						className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-[#6b7280] hover:text-[#0d0d0d] dark:hover:text-[#f1f5f9] hover:bg-[#f4f4f6] dark:hover:bg-[#1e2235] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
						<ArrowRight size={16} /> {isAr ? 'السابق' : 'Previous'}
					</button>
					<span className="text-xs text-[#6b7280] dark:text-[#94a3b8]">
						{isAr ? 'اضغط 1-4 للإجابة' : 'Press 1-4 to answer'}
					</span>
					<button onClick={() => { setSlideDir("right"); onNext(); }}
						disabled={selectedOption === null}
						className="inline-flex items-center gap-2 rounded-lg bg-[#5120c8] px-6 py-2 text-sm font-bold text-white transition-all hover:bg-[#5120c8]/90 disabled:opacity-40 disabled:cursor-not-allowed">
						{currentIdx === questions.length - 1 ? (isAr ? 'ارسال' : 'Submit') : (isAr ? 'التالي' : 'Next')} <ArrowLeft size={16} />
					</button>
				</div>
			</div>
		</div>
	);
}

// ════════════════════════════════════════════════════════════════════════════════
//   LOADING SCREEN
// ════════════════════════════════════════════════════════════════════════════════

function LoadingScreen({ isAr }: { isAr: boolean }) {
	const [msgIdx, setMsgIdx] = useState(0);
	const [prog, setProg] = useState(0);

	const LOADING_MSGS_AR = [
		"جارٍ تحليل شخصيتك المهنية...",
		"مطابقة مهاراتك مع متطلبات السوق...",
		"اكتشاف أفضل المسارات لك...",
		"بناء خطة التعلم الخاصة بك...",
		"شارفنا على الانتهاء...",
	];
	const LOADING_MSGS_EN = [
		"Analyzing your personality...",
		"Matching your skills with market demands...",
		"Discovering the best paths for you...",
		"Building your personalized learning plan...",
		"Almost there...",
	];

	useEffect(() => {
		const t1 = setInterval(() => setMsgIdx((i) => (i + 1) % LOADING_MSGS_AR.length), 2200);
		const start = Date.now();
		const t2 = setInterval(() => setProg(Math.min(((Date.now() - start) / 18000) * 100, 95)), 200);
		return () => { clearInterval(t1); clearInterval(t2); };
	}, []);

	const loadingMsgs = isAr ? LOADING_MSGS_AR : LOADING_MSGS_EN;

	return (
		<div className="flex min-h-[60vh] items-center justify-center" dir="rtl">
			<div className="text-center" style={{ animation: "fadeInUp 0.4s ease-out" }}>
				<div className="relative mx-auto w-fit">
					<Brain size={56} className="text-[#5120c8] animate-pulse" />
					<Sparkles size={20} className="absolute -top-1 -left-1 text-amber-400 animate-spin" style={{ animationDuration: "3s" }} />
				</div>
				<div className="mt-6 text-base font-semibold text-[#0d0d0d] dark:text-[#f1f5f9]"
					style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
					{loadingMsgs[msgIdx]}
				</div>
				<div className="mx-auto mt-6 h-2 w-64 overflow-hidden rounded-full bg-[#f4f4f6] dark:bg-[#1e2235]">
					<div className="h-full rounded-full bg-[#5120c8] transition-all duration-300" style={{ width: `${prog}%` }} />
				</div>
				<p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[#6b7280] dark:text-[#94a3b8]">
					<Clock size={12} /> {isAr ? 'قد يستغرق الأمر حتى 30 ثانية' : 'This may take up to 30 seconds'}
				</p>
			</div>
		</div>
	);
}

// ════════════════════════════════════════════════════════════════════════════════
//   PHASE 3: RESULTS SCREEN
// ════════════════════════════════════════════════════════════════════════════════

function ResultsScreen({ report, onRetake, onSavePath, locale }: {
	report: Report; onRetake: () => void;
	onSavePath: (spec: Specialization) => Promise<void>; locale: string;
}) {
	const router = useRouter();
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);
	const [showConfetti, setShowConfetti] = useState(true);

	useEffect(() => { injectStyles(); const t = setTimeout(() => setShowConfetti(false), 2000); return () => clearTimeout(t); }, []);

	const avgScore = report.topSpecializations.length > 0
		? Math.round(report.topSpecializations.reduce((s, sp) => s + sp.matchScore, 0) / report.topSpecializations.length) : 0;
	const grade = gradeBadge(avgScore);

	const doSave = async () => {
		if (!report.topSpecializations.length || saving || saved) return;
		setSaving(true);
		try { await onSavePath(report.topSpecializations[0]); setSaved(true); router.push(`/${locale}/dashboard/career-path`); }
		catch { setSaving(false); }
	};

	// Build skill bars from all specializations
	const skillMap = new Map<string, number>();
	report.topSpecializations.forEach((sp) => {
		sp.currentSkills.forEach((s) => skillMap.set(s, (skillMap.get(s) || 0) + 1));
	});
	const topSkills = Array.from(skillMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
	const maxSkillVal = topSkills.length > 0 ? topSkills[0][1] : 1;

	const careerIcons = [Target, Briefcase, TrendingUp];

	return (
		<div className="relative mx-auto max-w-2xl space-y-8 px-4 py-8" dir="rtl">
			{showConfetti && <Confetti />}

			{/* Hero */}
			<div className="text-center" style={{ animation: "scaleIn 0.5s ease-out" }}>
				<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
					style={{ animation: "checkPop 0.6s 0.3s ease-out both" }}>
					<Check size={32} className="text-[#16a34a]" />
				</div>
				<h1 className="mt-4 text-2xl font-bold text-[#0d0d0d] dark:text-[#f1f5f9]"
					style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
					نتيجتك
				</h1>
				<div className="mt-6"><ScoreRing score={avgScore} /></div>
				<span className={`mt-3 inline-block rounded-full px-4 py-1.5 text-sm font-bold ${grade.color}`}>
					{grade.label}
				</span>
			</div>

			{/* Career Path Recommendations */}
			<div style={{ animation: "fadeInUp 0.5s 0.3s ease-out both" }}>
				<h2 className="mb-4 text-lg font-bold text-[#0d0d0d] dark:text-[#f1f5f9]"
					style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
					المسارات المهنية المقترحة لك
				</h2>
				<div className="space-y-3">
					{report.topSpecializations.slice(0, 3).map((spec, i) => {
						const Icon = careerIcons[i] || Target;
						return (
							<div key={spec.rank}
								className="rounded-xl border border-[#e5e7eb] dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#161929] p-5 transition-all hover:shadow-md"
								style={{ animation: `fadeInUp 0.4s ${0.4 + i * 0.15}s ease-out both` }}>
								<div className="flex items-start gap-4">
									<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[rgba(81,32,200,0.08)] dark:bg-[rgba(81,32,200,0.15)]">
										<Icon size={22} className="text-[#5120c8]" />
									</div>
									<div className="min-w-0 flex-1">
										<div className="flex items-center justify-between gap-2">
											<h3 className="font-bold text-[#0d0d0d] dark:text-[#f1f5f9]">{spec.title || spec.titleEn}</h3>
											<span className="shrink-0 text-lg font-bold text-[#5120c8]">{spec.matchScore}%</span>
										</div>
										<p className="mt-1 text-sm text-[#6b7280] dark:text-[#94a3b8] line-clamp-2">{spec.whyMatch}</p>
										<div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#f4f4f6] dark:bg-[#1e2235]">
											<div className="h-full rounded-full bg-[#5120c8]"
												style={{ "--fill": `${spec.matchScore}%`, width: `${spec.matchScore}%`, animation: "barFill 1s ease-out" } as React.CSSProperties} />
										</div>
										<button onClick={() => router.push(`/${locale}/dashboard/career-path`)}
											className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#5120c8] hover:underline">
											استكشف المسار <ChevronRight size={14} />
										</button>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* Skills Bars */}
			{topSkills.length > 0 && (
				<div className="rounded-xl border border-[#e5e7eb] dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#161929] p-6"
					style={{ animation: "fadeInUp 0.5s 0.7s ease-out both" }}>
					<h2 className="mb-5 text-lg font-bold text-[#0d0d0d] dark:text-[#f1f5f9]"
						style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
						نقاط قوتك
					</h2>
					<div className="space-y-4">
						{topSkills.map(([skill, val], i) => {
							const pct = Math.round((val / maxSkillVal) * 100);
							return (
								<div key={skill}>
									<div className="mb-1.5 flex items-center justify-between text-sm">
										<span className="font-medium text-[#0d0d0d] dark:text-[#f1f5f9]">{skill}</span>
										<span className="text-[#6b7280] dark:text-[#94a3b8]">{pct}%</span>
									</div>
									<div className="h-2.5 w-full overflow-hidden rounded-full bg-[#f4f4f6] dark:bg-[#1e2235]">
										<div className="h-full rounded-full bg-[#5120c8]"
											style={{ "--fill": `${pct}%`, width: `${pct}%`, animation: `barFill 0.8s ${0.8 + i * 0.1}s ease-out both` } as React.CSSProperties} />
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Action Buttons */}
			<div className="flex flex-wrap justify-center gap-3" style={{ animation: "fadeInUp 0.5s 1s ease-out both" }}>
				<button onClick={onRetake}
					className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-[#e5e7eb] dark:border-[rgba(255,255,255,0.08)] bg-transparent px-5 text-sm font-bold text-[#0d0d0d] dark:text-[#f1f5f9] transition-all hover:bg-[#f4f4f6] dark:hover:bg-[#1e2235]">
					<RefreshCw size={16} /> أعد الاختبار
				</button>
				<button onClick={doSave} disabled={saving || saved}
					className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#5120c8] px-5 text-sm font-bold text-white transition-all hover:bg-[#5120c8]/90 disabled:opacity-60 disabled:cursor-not-allowed">
					{saved ? <><Check size={16} /> تم الحفظ</> : saving ? <><RefreshCw size={16} className="animate-spin" /> جارٍ الحفظ...</> : <><Save size={16} /> احفظ النتيجة</>}
				</button>
				<button onClick={() => { if (navigator.share) navigator.share({ title: "نتيجة اختبار المسار المهني", text: `حصلت على ${avgScore}%` }); }}
					className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-bold text-[#6b7280] dark:text-[#94a3b8] transition-all hover:bg-[#f4f4f6] dark:hover:bg-[#1e2235]">
					<Share2 size={16} /> شارك نتيجتك
				</button>
			</div>
		</div>
	);
}

// ════════════════════════════════════════════════════════════════════════════════
//   MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════════

export default function AssessmentPage() {
	const locale = useLocale() as "ar" | "en";
	const isAr = locale === "ar";
	const [phase, setPhase] = useState<Phase>("start");
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [currentIdx, setCurrentIdx] = useState(0);
	const [selectedOption, setSelectedOption] = useState<number | null>(null);
	const [answers, setAnswers] = useState<Array<{ questionId: number; answer: string }>>([]);
	const [report, setReport] = useState<Report | null>(null);
	const [error, setError] = useState("");
	const [exitConfirm, setExitConfirm] = useState(false);

	useEffect(() => { injectStyles(); }, []);

	// ── Queries ──
	const questionsQ = useQuery({
		queryKey: ["ai-assessment-questions"],
		queryFn: async () => {
			const res = await get("/career/assessment/questions");
			const d = (res as any)?.data?.data;
			return Array.isArray(d?.questions) ? d.questions : [];
		},
	});

	const historyQ = useQuery({
		queryKey: ["ai-assessment-history"],
		queryFn: async () => {
			const res = await get("/career/assessment/session/history");
			const d = (res as any)?.data?.data;
			return Array.isArray(d?.sessions) ? d.sessions : [];
		},
	});

	// Use API questions or fallback to demo
	const questions: Question[] = questionsQ.data?.length ? questionsQ.data : DEMO_QUESTIONS;

	// ── Mutations ──
	const startMutation = useMutation({
		mutationFn: async () => {
			const res = await post("/career/assessment/session/start");
			const sid = (res as any)?.data?.data?.sessionId;
			if (!sid) throw new Error("No session ID");
			return String(sid);
		},
	});

	const completeMutation = useMutation({
		mutationFn: async (payload: { sessionId: string; answers: Array<{ questionId: number; answer: string }> }) => {
			const res = await post(`/career/assessment/session/${payload.sessionId}/complete`, { answers: payload.answers });
			const rd = (res as any)?.data?.data;
			if (rd?.personalityType) return rd;
			if (rd?.report?.personalityType) return rd.report;
			throw new Error("Invalid report");
		},
	});

	// ── Handlers ──
	const handleStart = useCallback(async () => {
		try {
			const id = await startMutation.mutateAsync();
			setSessionId(id);
			setAnswers([]);
			setCurrentIdx(0);
			setSelectedOption(null);
			setPhase("quiz");
		} catch {
			// Fallback: start in demo mode
			setSessionId("demo");
			setAnswers([]);
			setCurrentIdx(0);
			setSelectedOption(null);
			setPhase("quiz");
		}
	}, [startMutation]);

	const handleSelect = useCallback((optIdx: number) => {
		setSelectedOption(optIdx);
	}, []);

	const handleNext = useCallback(async () => {
		if (selectedOption === null) return;
		const q = questions[currentIdx];
		if (!q) return;
		const newAnswers = [...answers, { questionId: q.id, answer: q.options[selectedOption].value }];
		setAnswers(newAnswers);

		if (currentIdx + 1 >= questions.length) {
			// Submit
			setPhase("loading");
			if (sessionId && sessionId !== "demo") {
				try {
					const result = await completeMutation.mutateAsync({ sessionId, answers: newAnswers });
					if (!result?.personalityType) throw new Error("Bad report");
					setReport(result);
					historyQ.refetch();
					setPhase("results");
				} catch (e: any) {
					setError(e?.message || "فشل في إنشاء التقرير");
					setPhase("error");
				}
			} else {
				// Demo mode - show after delay
				setTimeout(() => {
					setReport({
						personalityType: "المحلل التقني",
						personalityDescription: "شخصية تحليلية تجمع بين التفكير المنطقي والإبداع التقني",
						topSpecializations: [
							{ rank: 1, title: "هندسة البرمجيات", titleEn: "Software Engineering", matchScore: 92,
								whyMatch: "تتوافق مهاراتك التحليلية مع متطلبات هندسة البرمجيات",
								requiredSkills: ["JavaScript", "React", "Node.js"], currentSkills: ["JavaScript", "React"],
								missingSkills: ["Node.js"], learningPath: [{ month: "شهر 1", focus: "أساسيات Node.js", resources: "Udemy" }],
								salaryRange: { egypt: "15,000-25,000 EGP", saudi: "12,000-20,000 SAR" },
								timeToFirstJob: "3-6 أشهر", jobTitles: ["مطور برمجيات", "مهندس واجهات"], demandLevel: "Very High" },
							{ rank: 2, title: "علوم البيانات", titleEn: "Data Science", matchScore: 85,
								whyMatch: "قدراتك التحليلية مناسبة لعلوم البيانات",
								requiredSkills: ["Python", "SQL", "ML"], currentSkills: ["Python", "SQL"],
								missingSkills: ["ML"], learningPath: [{ month: "شهر 1", focus: "Machine Learning", resources: "Coursera" }],
								salaryRange: { egypt: "20,000-35,000 EGP", saudi: "15,000-25,000 SAR" },
								timeToFirstJob: "4-8 أشهر", jobTitles: ["محلل بيانات", "عالم بيانات"], demandLevel: "High" },
							{ rank: 3, title: "الأمن السيبراني", titleEn: "Cybersecurity", matchScore: 78,
								whyMatch: "اهتمامك بالتفاصيل يناسب مجال الأمن السيبراني",
								requiredSkills: ["Networks", "Linux", "Security"], currentSkills: ["Networks"],
								missingSkills: ["Linux", "Security"], learningPath: [{ month: "شهر 1", focus: "Linux Basics", resources: "TryHackMe" }],
								salaryRange: { egypt: "18,000-30,000 EGP", saudi: "14,000-22,000 SAR" },
								timeToFirstJob: "6-10 أشهر", jobTitles: ["محلل أمني", "مختبر اختراق"], demandLevel: "Very High" },
						],
						personalityStrengths: ["التفكير التحليلي", "حل المشكلات", "التعلم الذاتي"],
						areasToImprove: ["العمل الجماعي", "العرض والتقديم"],
						personalAdvice: "ركّز على بناء مشاريع عملية لتعزيز معرض أعمالك",
						urgentFirstStep: "أنشئ حسابا على GitHub وابدأ بمشروع صغير هذا الأسبوع",
						disclaimer: "هذه توصية مبنية على الذكاء الاصطناعي بناء على إجاباتك",
					});
					setPhase("results");
				}, 3000);
			}
		} else {
			setCurrentIdx(currentIdx + 1);
			setSelectedOption(null);
		}
	}, [selectedOption, questions, currentIdx, answers, sessionId, completeMutation, historyQ]);

	const handlePrev = useCallback(() => {
		if (currentIdx === 0) return;
		setCurrentIdx(currentIdx - 1);
		const prevAnswer = answers[currentIdx - 1];
		if (prevAnswer) {
			const q = questions[currentIdx - 1];
			const optIdx = q.options.findIndex((o) => o.value === prevAnswer.answer);
			setSelectedOption(optIdx >= 0 ? optIdx : null);
		}
		setAnswers(answers.slice(0, -1));
	}, [currentIdx, answers, questions]);

	const handleRetake = useCallback(() => {
		setReport(null); setAnswers([]); setSessionId(null);
		setCurrentIdx(0); setSelectedOption(null); setError(""); setPhase("start");
	}, []);

	const handleSavePath = useCallback(async (spec: Specialization) => {
		const titleEn = spec.titleEn || spec.title || "";
		const match = findPathByTitle(titleEn);
		await post("/career/my-path", {
			pathId: match?.path.id || titleEn.toLowerCase().replace(/\s+/g, "-"),
			pathTitle: match?.path.title || titleEn,
			pathCategory: match?.category.category || "Technology & Development",
			aiRecommended: true,
		});
	}, []);

	const handleExit = useCallback(() => { setExitConfirm(true); }, []);
	const confirmExit = useCallback(() => { setExitConfirm(false); handleRetake(); }, [handleRetake]);

	// ── Keyboard Navigation ──
	useEffect(() => {
		if (phase !== "quiz") return;
		const handler = (e: KeyboardEvent) => {
			if (e.key >= "1" && e.key <= "4") handleSelect(parseInt(e.key) - 1);
			if (e.key === "Enter") handleNext();
			if (e.key === "ArrowLeft") handleNext();
			if (e.key === "ArrowRight") handlePrev();
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [phase, handleSelect, handleNext, handlePrev]);

	return (
		<AuthGate>
			<DashboardShell title={isAr ? 'اختبار المسار المهني' : 'Career Path Assessment'} subtitle={isAr ? 'اكتشف مسارك المهني المثالي' : 'Discover your ideal career path'}>
				<div className="bg-[#fafafa] dark:bg-[#0f1221] min-h-[60vh]">
					{phase === "start" && (
						<StartScreen onStart={handleStart} isStarting={startMutation.isPending} questionCount={questions.length} isAr={isAr} />
					)}

					{phase === "quiz" && (
						<QuizScreen questions={questions} currentIdx={currentIdx}
							selectedOption={selectedOption} onSelect={handleSelect}
							onNext={handleNext} onPrev={handlePrev} onExit={handleExit} isAr={isAr} />
					)}

					{phase === "loading" && <LoadingScreen isAr={isAr} />}

					{phase === "error" && (
						<div className="flex min-h-[60vh] items-center justify-center" dir="rtl">
							<div className="text-center" style={{ animation: "fadeInUp 0.4s ease-out" }}>
								<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
									<AlertTriangle size={32} className="text-[#dc2626]" />
								</div>
								<h3 className="mt-4 text-lg font-bold text-[#0d0d0d] dark:text-[#f1f5f9]">حدث خطأ</h3>
								<p className="mt-2 text-sm text-[#dc2626]">{error}</p>
								<button onClick={handleRetake}
									className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[#5120c8] px-6 text-sm font-bold text-white hover:bg-[#5120c8]/90">
									<RefreshCw size={16} /> حاول مرة أخرى
								</button>
							</div>
						</div>
					)}

					{phase === "results" && report && (
						<ResultsScreen report={report} onRetake={handleRetake} onSavePath={handleSavePath} locale={locale} />
					)}
				</div>

				{/* Exit Confirm Dialog */}
				{exitConfirm && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" dir="rtl">
						<div className="mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-[#161929] p-6 shadow-xl"
							style={{ animation: "scaleIn 0.2s ease-out" }}>
							<h3 className="text-lg font-bold text-[#0d0d0d] dark:text-[#f1f5f9]">هل تريد الخروج؟</h3>
							<p className="mt-2 text-sm text-[#6b7280] dark:text-[#94a3b8]">سيتم فقدان تقدمك الحالي في الاختبار</p>
							<div className="mt-5 flex gap-3">
								<button onClick={confirmExit}
									className="flex-1 rounded-xl bg-[#dc2626] py-2.5 text-sm font-bold text-white hover:bg-[#dc2626]/90">
									نعم، اخرج
								</button>
								<button onClick={() => setExitConfirm(false)}
									className="flex-1 rounded-xl border-2 border-[#e5e7eb] dark:border-[rgba(255,255,255,0.08)] py-2.5 text-sm font-bold text-[#0d0d0d] dark:text-[#f1f5f9] hover:bg-[#f4f4f6] dark:hover:bg-[#1e2235]">
									متابعة الاختبار
								</button>
							</div>
						</div>
					</div>
				)}
			</DashboardShell>
		</AuthGate>
	);
}
