"use client";

/**
 * LiveRecordingPlayer — the video element of a recorded live session.
 *
 * The recording is stored on Bunny.net Stream, which serves it as an HLS
 * playlist (.m3u8). Safari plays HLS natively, but Chrome and Firefox need
 * hls.js, so the manifest is attached through hls.js whenever the browser
 * cannot play it on its own. A progressive file (mp4/webm) keeps the plain
 * <video src> behaviour.
 *
 * The URL that is handed in is the complete playlist URL that Bunny returned
 * (`https://{cdn}/{videoId}/playlist.m3u8`) — nothing is rebuilt from the
 * hostname and the id here.
 *
 * Icons only — no emoji anywhere in this file.
 */

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { AlertCircle, Loader2 } from "lucide-react";

/** Shown when the stream cannot be played at all. */
const ERROR_MESSAGE = "تعذّر تشغيل الفيديو — حاول مرة أخرى لاحقاً";

export interface LiveRecordingPlayerProps {
	src: string | null;
	poster?: string | null;
	className?: string;
}

export default function LiveRecordingPlayer({
	src,
	poster,
	className = "w-full",
}: LiveRecordingPlayerProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const retriesRef = useRef(0);
	const [loading, setLoading] = useState(false);
	const [failed, setFailed] = useState(false);

	const isHls = typeof src === "string" && /\.m3u8(\?|#|$)/i.test(src);

	useEffect(() => {
		const video = videoRef.current;
		if (!video || !src) return;

		retriesRef.current = 0;
		setFailed(false);
		setLoading(true);

		const onLoaded = () => {
			// A recording always starts at 0:00. Never inherit the playback
			// position of the live stream the student was watching.
			video.currentTime = 0;
			setLoading(false);
		};
		const onError = () => {
			setLoading(false);
			setFailed(true);
		};

		// A progressive file (mp4/webm) and native HLS (Safari / iOS) are
		// loaded by the element itself.
		if (!isHls || video.canPlayType("application/vnd.apple.mpegurl")) {
			video.src = src;
			video.addEventListener("loadedmetadata", onLoaded);
			video.addEventListener("error", onError);
			return () => {
				video.removeEventListener("loadedmetadata", onLoaded);
				video.removeEventListener("error", onError);
			};
		}

		if (!Hls.isSupported()) {
			setLoading(false);
			setFailed(true);
			return;
		}

		// Force the recording to start at its beginning instead of resuming
		// from the live position the student left off at.
		const hls = new Hls({ enableWorker: true, startPosition: 0 });

		hls.on(Hls.Events.MANIFEST_PARSED, () => {
			setLoading(false);
		});

		hls.on(Hls.Events.ERROR, (_event, data) => {
			if (!data?.fatal) return;

			// Bunny encodes asynchronously — right after the upload the
			// playlist does not exist yet. A couple of retries cover that
			// window before the error is shown.
			if (
				data.type === Hls.ErrorTypes.NETWORK_ERROR &&
				retriesRef.current < 2
			) {
				retriesRef.current += 1;
				setTimeout(() => hls.startLoad(), 5000);
				return;
			}

			setLoading(false);
			setFailed(true);
		});

		hls.loadSource(src);
		hls.attachMedia(video);

		return () => {
			hls.destroy();
		};
	}, [src, isHls]);

	return (
		<div className="relative w-full" style={{ width: "100%" }}>
			<video
				ref={videoRef}
				src={isHls ? undefined : src ?? undefined}
				poster={poster || undefined}
				controls
				playsInline
				className={className}
				style={{ aspectRatio: "16/9", display: "block", width: "100%" }}
			/>

			{loading && !failed && (
				<div
					className="absolute inset-0 flex items-center justify-center pointer-events-none"
					style={{ background: "rgba(0,0,0,0.35)" }}>
					<Loader2
						size={34}
						className="animate-spin"
						style={{ color: "#ffffff" }}
					/>
				</div>
			)}

			{failed && (
				<div
					className="absolute inset-0 flex items-center justify-center px-4"
					style={{ background: "rgba(0,0,0,0.75)" }}>
					<div className="flex flex-col items-center gap-2 text-center">
						<AlertCircle size={28} style={{ color: "#f87171" }} />
						<p className="text-sm font-bold" style={{ color: "#ffffff" }}>
							{ERROR_MESSAGE}
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
