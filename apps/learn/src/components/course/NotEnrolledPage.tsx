"use client";

import { Lock, ShoppingCart, ArrowLeft, ShieldCheck, Clock, Award } from "lucide-react";

interface NotEnrolledPageProps {
	courseId: string;
	locale: string;
}

export default function NotEnrolledPage({ courseId, locale }: NotEnrolledPageProps) {
	const isAr = locale === "ar";
	const mainUrl = process.env.NEXT_PUBLIC_MAIN_URL || "";
	const checkoutUrl = `${mainUrl}/${locale}/checkout/${courseId}`;

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

				<a
					href={checkoutUrl}
					className="group inline-flex items-center gap-3 rounded-2xl px-8 py-4 font-bold text-white transition-all duration-300"
					style={{
						background: "linear-gradient(135deg, var(--primary), #5b21b6)",
						boxShadow: "var(--cta-shadow)",
					}}>
					<ShoppingCart className="h-5 w-5" />
					<span>{isAr ? "اشترك الآن" : "Subscribe now"}</span>
					<ArrowLeft className="h-5 w-5" />
				</a>

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
