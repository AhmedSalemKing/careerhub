"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { get } from "../../lib/api";
import { Lock, ShoppingCart, ArrowLeft, ShieldCheck, Clock, Award, Compass } from "lucide-react";

interface CourseInfo {
	id?: string;
	price?: number;
	priceDisplay?: string | null;
	titleAr?: string;
	titleEn?: string;
	slug?: string;
	type?: string;
}

interface NotEnrolledPageProps {
	courseId: string;
	locale: string;
	/** Optional pre-loaded course (avoids an extra fetch when the parent has it). */
	course?: CourseInfo;
}

export default function NotEnrolledPage({ courseId, locale, course }: NotEnrolledPageProps) {
	const isAr = locale === "ar";
	const router = useRouter();
	const [courseInfo, setCourseInfo] = useState<CourseInfo | undefined>(course);

	useEffect(() => {
		if (course || !courseId) return;
		let active = true;
		(async () => {
			try {
				const res = await get(`/courses/${courseId}`);
				const payload = (res?.data as any)?.data;
				const data = payload?.course ?? payload ?? null;
				if (active && data) setCourseInfo(data);
			} catch {
				// Network/permission errors: fall back to courseId-only URL.
			}
		})();
		return () => {
			active = false;
		};
	}, [courseId, course]);

	// Payment flow lives in THIS (learn) app — keep the URL relative (no domain).
	const info = course ?? courseInfo;
	const resolvedId = info?.id || courseId;
	const paymentParams = new URLSearchParams({
		courseId: resolvedId,
		amount: String(info?.price ?? 0),
		amountDisplay: info?.priceDisplay || "",
		title: info?.titleAr || info?.titleEn || "",
		type: info?.type || "recorded",
		returnUrl: `/${locale}/courses/${info?.slug || resolvedId}`,
	}).toString();

	const badges = [
		{ icon: ShieldCheck, label: isAr ? "دفع آمن" : "Secure payment", color: "var(--success)" },
		{ icon: Clock, label: isAr ? "وصول فوري" : "Instant access", color: "var(--info)" },
		{ icon: Award, label: isAr ? "شهادة معتمدة" : "Certificate", color: "var(--warning)" },
	];

	return (
		<div
			className="flex min-h-screen items-center justify-center p-6"
			dir={isAr ? "rtl" : "ltr"}
			style={{ background: "var(--background)" }}>
			<div className="mx-auto max-w-lg text-center">
				<div
					className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-3xl"
					style={{ background: "var(--primary-subtle)" }}>
					<Lock className="h-14 w-14" style={{ color: "var(--primary)" }} />
				</div>

				<h2
					className="mb-4 text-3xl font-bold"
					style={{ color: "var(--foreground)" }}>
					{isAr ? "هذا الكورس مقيّد" : "This course is restricted"}
				</h2>
				<p
					className="mx-auto mb-8 max-w-md text-base leading-relaxed"
					style={{ color: "var(--muted)" }}>
					{isAr
						? "يجب الاشتراك في هذا الكورس للوصول إلى المحتوى التعليمي."
						: "You need to enroll in this course to access its content."}
				</p>

				<button
					type="button"
					onClick={() => router.push(`/${locale}/payment/enroll?${paymentParams}`)}
					className="group inline-flex items-center gap-3 rounded-2xl px-8 py-4 font-bold text-white transition-all duration-300"
					style={{
						background: "linear-gradient(135deg, var(--primary), #5b21b6)",
						boxShadow: "var(--cta-shadow)",
						border: "none",
						cursor: "pointer",
					}}>
					<ShoppingCart className="h-5 w-5" />
					<span>{isAr ? "اشترك الآن" : "Subscribe now"}</span>
					<ArrowLeft className="h-5 w-5" />
				</button>

				<div className="mt-4">
					<button
						type="button"
						onClick={() => router.push(`/${locale}/courses`)}
						className="inline-flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-80"
						style={{
							color: "var(--muted)",
							background: "none",
							border: "none",
							cursor: "pointer",
						}}>
						<Compass className="h-4 w-4" />
						<span>{isAr ? "تصفح كورسات أخرى" : "Browse other courses"}</span>
					</button>
				</div>

				<div
					className="mt-8 flex justify-center gap-6 text-xs"
					style={{ color: "var(--muted)" }}>
					{badges.map((b) => (
						<div key={b.label} className="flex items-center gap-1.5">
							<b.icon className="h-4 w-4" style={{ color: b.color }} />
							<span>{b.label}</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
