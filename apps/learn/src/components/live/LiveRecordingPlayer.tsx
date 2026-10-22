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
 * Icons only — no emoji anywhere in this file.
 */

import { useEffect, useRef } from "react";
import Hls from "hls.js";

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
	const isHls = typeof src === "string" && /\.m3u8(\?|#|$)/i.test(src);

	useEffect(() => {
		const video = videoRef.current;
		if (!video || !src) return;

		if (!isHls) {
			video.src = src;
			return;
		}

		// Native HLS (Safari / iOS): the element loads the manifest itself.
		if (video.canPlayType("application/vnd.apple.mpegurl")) {
			video.src = src;
			return;
		}

		if (!Hls.isSupported()) return;

		const hls = new Hls({ enableWorker: true });
		hls.loadSource(src);
		hls.attachMedia(video);

		return () => {
			hls.destroy();
		};
	}, [src, isHls]);

	return (
		<video
			ref={videoRef}
			src={isHls ? undefined : src ?? undefined}
			poster={poster || undefined}
			controls
			playsInline
			className={className}
			style={{ aspectRatio: "16/9", display: "block", width: "100%" }}
		/>
	);
}
